import uuid
from typing import Any

from fastapi import HTTPException, status
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.architect.agent import deserialize_chat_history, get_architect_executor
from app.api.v1.architect.prompts import build_feedback_prompt, build_initial_prompt
from app.api.v1.architect.schemas import (
    ArchitectChatRequest,
    ArchitectConfirmRequest,
    ArchitectConfirmResponse,
    ProjectBreakdown,
    SuggestProjectRequest,
)
from app.api.v1.projects.models import Project
from app.api.v1.projects.schemas import ProjectResponse
from app.api.v1.tasks.models import Task, TaskStatus
from app.api.v1.tasks.schemas import TaskResponse
from app.core.ai import AIExecutionError, FallbackAIExecutor
from app.core.config import settings
from app.core.observability import log_ai_event, sanitize_text
from app.core.redis import clear_cache_pattern


class ArchitectService:
    @staticmethod
    def _draft_key(session_id: str) -> str:
        # Build the Redis key for the saved draft.
        return f'architect:{session_id}:draft_tasks'

    @staticmethod
    def _history_key(session_id: str) -> str:
        # Build the Redis key for saved chat history.
        return f'architect:{session_id}:chat_history'

    @staticmethod
    def _owner_key(session_id: str) -> str:
        # Build the Redis key for the session owner.
        return f'architect:{session_id}:owner'

    @staticmethod
    def _derive_project_priority(draft: ProjectBreakdown) -> int:
        # Pick the highest task priority as the project priority.
        return max((task.estimated_priority for task in draft.tasks), default=1)

    @staticmethod
    def _format_persistence_error(exc: Exception) -> str | None:
        # Translate common database schema errors into a clearer message.
        message = str(exc).lower()

        if (
            'undefinedcolumnerror' in message
            or 'undefinedtableerror' in message
            or (
                'does not exist' in message
                and ('column' in message or 'relation' in message)
            )
        ):
            return (
                'The database schema is out of date for architect persistence. '
                'Run `alembic upgrade head` in the backend directory and try again.'
            )

        return None

    @classmethod
    async def _save_state(
        cls,
        redis: Redis,
        user_id: uuid.UUID,
        session_id: str,
        draft: ProjectBreakdown,
        raw_history: bytes,
    ) -> None:
        # Save the draft, chat history, and owner in Redis.
        ttl = settings.AI_ARCHITECT_STATE_TTL_SECONDS
        await redis.set(cls._draft_key(session_id), draft.model_dump_json(), ex=ttl)
        await redis.set(
            cls._history_key(session_id), raw_history.decode('utf-8'), ex=ttl
        )
        await redis.set(cls._owner_key(session_id), str(user_id), ex=ttl)

    @classmethod
    async def _assert_session_owner(
        cls, redis: Redis, session_id: str, user_id: uuid.UUID
    ) -> None:
        # Make sure the draft session belongs to the current user.
        owner_id = await redis.get(cls._owner_key(session_id))
        if not owner_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='No architect session exists for the current user.',
            )

        if owner_id != str(user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='This architect session does not belong to the current user.',
            )

    @classmethod
    async def _get_draft(
        cls, redis: Redis, user_id: uuid.UUID, session_id: str
    ) -> ProjectBreakdown:
        # Load the saved draft for the current user.
        await cls._assert_session_owner(redis, session_id, user_id)
        raw_draft = await redis.get(cls._draft_key(session_id))
        if not raw_draft:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='No architect draft exists for this session.',
            )

        return ProjectBreakdown.model_validate_json(raw_draft)

    @classmethod
    async def _get_history(
        cls, redis: Redis, user_id: uuid.UUID, session_id: str
    ) -> list[object]:
        # Load the saved chat history for the current user.
        await cls._assert_session_owner(redis, session_id, user_id)
        raw_history = await redis.get(cls._history_key(session_id))
        if not raw_history:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='No architect chat history exists for this session.',
            )

        try:
            return deserialize_chat_history(raw_history)
        except RuntimeError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=str(exc),
            ) from exc
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail='Stored architect chat history is invalid.',
            ) from exc

    @classmethod
    async def _clear_state(
        cls, redis: Redis, user_id: uuid.UUID, session_id: str
    ) -> None:
        # Remove the saved draft state after it is no longer needed.
        await cls._assert_session_owner(redis, session_id, user_id)
        await redis.delete(
            cls._draft_key(session_id),
            cls._history_key(session_id),
            cls._owner_key(session_id),
        )

    @staticmethod
    async def _run_agent(
        executor: FallbackAIExecutor[ProjectBreakdown],
        prompt: str,
        *,
        message_history: list[object] | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> Any:
        # Run the AI executor and normalize provider errors.
        try:
            return await executor.run(
                prompt,
                message_history=message_history,
                metadata=metadata,
            )
        except AIExecutionError as exc:
            log_ai_event(
                'Architect AI execution failed across all models',
                workflow_name='architect',
                level='error',
                success=False,
                failure_count=len(exc.failures),
                failures=FallbackAIExecutor.format_failures(exc.failures),
                **(metadata or {}),
            )
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=str(exc),
            ) from exc
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f'Architect agent failed: {exc}',
            ) from exc

    @classmethod
    async def suggest(
        cls,
        redis: Redis,
        user_id: uuid.UUID,
        project_request: SuggestProjectRequest,
    ) -> tuple[str, ProjectBreakdown]:
        # Create a new draft and store its session state.
        session_id = str(uuid.uuid4())
        prompt = build_initial_prompt(project_request)
        metadata = {
            'user_id': str(user_id),
            'session_id': session_id,
            'project_title': sanitize_text(project_request.title, max_length=200),
            'project_description': sanitize_text(project_request.description),
        }
        log_ai_event(
            'Architect prompt generated',
            workflow_name='architect',
            prompt_type='suggest',
            success=True,
            goals=project_request.goals,
            constraints=project_request.constraints,
            **metadata,
        )
        result = await cls._run_agent(
            get_architect_executor(),
            prompt,
            metadata=metadata,
        )
        draft = result.output
        await cls._save_state(
            redis, user_id, session_id, draft, result.all_messages_json()
        )
        return session_id, draft

    @classmethod
    async def chat(
        cls,
        redis: Redis,
        user_id: uuid.UUID,
        feedback: ArchitectChatRequest,
    ) -> ProjectBreakdown:
        # Revise an existing draft using saved history and feedback.
        current_draft = await cls._get_draft(redis, user_id, feedback.session_id)
        history = await cls._get_history(redis, user_id, feedback.session_id)

        prompt = build_feedback_prompt(current_draft, feedback)
        metadata = {
            'user_id': str(user_id),
            'session_id': feedback.session_id,
            'project_title': sanitize_text(current_draft.title, max_length=200),
            'feedback_preview': sanitize_text(feedback.feedback),
        }
        log_ai_event(
            'Architect prompt generated',
            workflow_name='architect',
            prompt_type='refine',
            success=True,
            **metadata,
        )
        result = await cls._run_agent(
            get_architect_executor(),
            prompt,
            message_history=history,
            metadata=metadata,
        )
        draft = result.output
        await cls._save_state(
            redis,
            user_id,
            feedback.session_id,
            draft,
            result.all_messages_json(),
        )
        return draft

    @classmethod
    async def confirm(
        cls,
        db: AsyncSession,
        redis: Redis,
        user_id: uuid.UUID,
        confirm_request: ArchitectConfirmRequest,
    ) -> ArchitectConfirmResponse:
        # Save the approved draft as a project and its tasks.
        draft = await cls._get_draft(redis, user_id, confirm_request.session_id)
        project_priority = confirm_request.priority or cls._derive_project_priority(
            draft
        )

        project = Project(
            title=draft.title,
            description=draft.description,
            status=confirm_request.status,
            priority=project_priority,
            due_date=confirm_request.due_date,
            owner_id=user_id,
        )

        tasks = [
            Task(
                title=task.title,
                description=task.description,
                status=TaskStatus.TODO,
                priority=task.estimated_priority,
                is_completed=False,
                project=project,
            )
            for task in draft.tasks
        ]

        try:
            db.add(project)
            if tasks:
                db.add_all(tasks)
            await db.commit()
        except Exception as exc:
            await db.rollback()
            persistence_error = cls._format_persistence_error(exc)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=persistence_error or 'Failed to persist the architect draft.',
            ) from exc

        await db.refresh(project)
        for task in tasks:
            await db.refresh(task)

        await cls._clear_state(redis, user_id, confirm_request.session_id)
        await clear_cache_pattern(f'user:{user_id}:projects:*')
        await clear_cache_pattern(f'user:{user_id}:analytics')

        return ArchitectConfirmResponse(
            project=ProjectResponse.model_validate(project),
            tasks=[TaskResponse.model_validate(task) for task in tasks],
        )
