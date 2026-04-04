import uuid
from typing import Any

from fastapi import HTTPException, status
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.architect.agent import (
    deserialize_chat_history,
    format_architect_provider_error,
    get_architect_agent,
)
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
from app.core.config import settings
from app.core.redis import clear_cache_pattern


class ArchitectService:
    @staticmethod
    def _draft_key(session_id: str) -> str:
        return f'architect:{session_id}:draft_tasks'

    @staticmethod
    def _history_key(session_id: str) -> str:
        return f'architect:{session_id}:chat_history'

    @staticmethod
    def _owner_key(session_id: str) -> str:
        return f'architect:{session_id}:owner'

    @staticmethod
    def _build_initial_prompt(project_request: SuggestProjectRequest) -> str:
        lines = [
            'Create a project breakdown from the following request.',
            f'Title: {project_request.title}',
        ]

        if project_request.description:
            lines.append(f'Description: {project_request.description}')
        if project_request.goals:
            lines.append('Goals:')
            lines.extend(f'- {goal}' for goal in project_request.goals)
        if project_request.constraints:
            lines.append('Constraints:')
            lines.extend(
                f'- {constraint}' for constraint in project_request.constraints
            )
        if project_request.additional_context:
            lines.append(f'Additional context: {project_request.additional_context}')

        lines.append('Return a complete ProjectBreakdown.')
        return '\n'.join(lines)

    @staticmethod
    def _build_feedback_prompt(
        current_draft: ProjectBreakdown, feedback: ArchitectChatRequest
    ) -> str:
        return '\n'.join(
            [
                'Revise the current project breakdown using the feedback below.',
                'Current draft:',
                current_draft.model_dump_json(indent=2),
                'Feedback:',
                feedback.feedback,
                'Return the full revised ProjectBreakdown.',
            ]
        )

    @staticmethod
    def _derive_project_priority(draft: ProjectBreakdown) -> int:
        return max((task.estimated_priority for task in draft.tasks), default=1)

    @staticmethod
    def _format_persistence_error(exc: Exception) -> str | None:
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
        await cls._assert_session_owner(redis, session_id, user_id)
        await redis.delete(
            cls._draft_key(session_id),
            cls._history_key(session_id),
            cls._owner_key(session_id),
        )

    @staticmethod
    async def _run_agent(
        prompt: str, message_history: list[object] | None = None
    ) -> Any:
        try:
            agent = get_architect_agent()
            return await agent.run(prompt, message_history=message_history)
        except RuntimeError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=str(exc),
            ) from exc
        except Exception as exc:
            provider_error = format_architect_provider_error(exc)
            if provider_error:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=provider_error,
                ) from exc
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
        session_id = str(uuid.uuid4())
        result = await cls._run_agent(cls._build_initial_prompt(project_request))
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
        current_draft = await cls._get_draft(redis, user_id, feedback.session_id)
        history = await cls._get_history(redis, user_id, feedback.session_id)

        result = await cls._run_agent(
            cls._build_feedback_prompt(current_draft, feedback),
            message_history=history,
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
