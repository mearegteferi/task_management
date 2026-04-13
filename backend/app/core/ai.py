from __future__ import annotations

import asyncio
import os
from dataclasses import asdict, dataclass
from time import perf_counter
from typing import Any, TypeVar

import httpx
from pydantic_ai import Agent
from pydantic_ai.exceptions import ModelAPIError, ModelHTTPError
from pydantic_ai.settings import ModelSettings

from app.core.config import settings
from app.core.observability import get_log_context, log_ai_event, sanitize_text

OutputT = TypeVar('OutputT')

_REMOTE_PROVIDER_KEYS: dict[str, str] = {
    'google': 'GEMINI_API_KEY',
    'google-gla': 'GEMINI_API_KEY',
    'openai': 'OPENAI_API_KEY',
    'xai': 'XAI_API_KEY',
}


@dataclass(slots=True)
class AIModelFailure:
    model_name: str
    error_type: str
    retry_count: int
    error_message: str


class AIExecutionError(RuntimeError):
    def __init__(self, message: str, *, failures: list[AIModelFailure]) -> None:
        super().__init__(message)
        self.failures = failures


class FallbackAIExecutor[OutputT]:
    def __init__(
        self,
        *,
        output_type: type[OutputT],
        system_prompt: str,
        workflow_name: str,
    ) -> None:
        self.workflow_name = workflow_name
        self.agent = Agent(
            output_type=output_type,
            system_prompt=system_prompt,
            name=f'{workflow_name}-fallback-agent',
            retries=0,
            instrument=True,
        )

    async def run(
        self,
        prompt: str,
        *,
        message_history: list[Any] | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> Any:
        available_models = self._available_models()
        if not available_models:
            raise AIExecutionError(
                'No remote AI models are configured. Add a provider API key and try again.',
                failures=[],
            )

        sanitized_metadata = {
            key: sanitize_text(str(value))
            for key, value in (metadata or {}).items()
            if value is not None
        }
        prompt_preview = sanitize_text(prompt)
        log_ai_event(
            'AI prompt prepared',
            workflow_name=self.workflow_name,
            prompt_preview=prompt_preview,
            prompt_length=len(prompt),
            model_candidates=available_models,
            success=False,
            **sanitized_metadata,
        )

        failures: list[AIModelFailure] = []
        for model_index, model_name in enumerate(available_models):
            self._apply_provider_api_key(model_name)
            log_ai_event(
                'AI model selected',
                workflow_name=self.workflow_name,
                model_name=model_name,
                model_index=model_index,
                success=True,
                **sanitized_metadata,
            )

            for attempt in range(1, settings.AI_MAX_RETRIES + 2):
                started_at = perf_counter()
                try:
                    with self._attempt_span(
                        model_name=model_name,
                        attempt=attempt,
                        prompt_length=len(prompt),
                        metadata=sanitized_metadata,
                    ):
                        result = await self.agent.run(
                            prompt,
                            message_history=message_history,
                            model=model_name,
                            model_settings=self._model_settings(),
                            metadata=self._run_metadata(
                                model_name=model_name,
                                attempt=attempt,
                                extra=sanitized_metadata,
                            ),
                        )
                except Exception as exc:
                    duration_ms = round((perf_counter() - started_at) * 1000, 2)
                    error_type = self._classify_error(exc)
                    error_message = sanitize_text(str(exc), max_length=800) or error_type
                    failures.append(
                        AIModelFailure(
                            model_name=model_name,
                            error_type=error_type,
                            retry_count=attempt - 1,
                            error_message=error_message,
                        )
                    )
                    log_ai_event(
                        'AI model attempt failed',
                        workflow_name=self.workflow_name,
                        level='warning',
                        model_name=model_name,
                        error_type=error_type,
                        retry_count=attempt - 1,
                        execution_time_ms=duration_ms,
                        success=False,
                        error_details=error_message,
                        **sanitized_metadata,
                    )

                    if attempt <= settings.AI_MAX_RETRIES:
                        backoff_seconds = float(2 ** (attempt - 1))
                        log_ai_event(
                            'Retrying AI model',
                            workflow_name=self.workflow_name,
                            level='warning',
                            model_name=model_name,
                            error_type=error_type,
                            retry_count=attempt,
                            backoff_seconds=backoff_seconds,
                            success=False,
                            **sanitized_metadata,
                        )
                        await asyncio.sleep(backoff_seconds)
                        continue

                    next_model = (
                        available_models[model_index + 1]
                        if model_index + 1 < len(available_models)
                        else None
                    )
                    if next_model:
                        log_ai_event(
                            'Falling back to next AI model',
                            workflow_name=self.workflow_name,
                            level='warning',
                            failed_model=model_name,
                            next_model=next_model,
                            error_type=error_type,
                            success=False,
                            **sanitized_metadata,
                        )
                    break

                duration_ms = round((perf_counter() - started_at) * 1000, 2)
                log_ai_event(
                    'AI model succeeded',
                    workflow_name=self.workflow_name,
                    model_name=model_name,
                    retry_count=attempt - 1,
                    execution_time_ms=duration_ms,
                    success=True,
                    **sanitized_metadata,
                )
                return result

        raise AIExecutionError(
            'The AI service is temporarily unavailable across all configured models. Please try again shortly.',
            failures=failures,
        )

    def _available_models(self) -> list[str]:
        available_models: list[str] = []
        for model_name in settings.AI_MODELS:
            if self._is_local_model(model_name):
                continue
            provider_key_name = self._provider_key_name(model_name)
            if provider_key_name is None:
                continue
            if getattr(settings, provider_key_name, None):
                available_models.append(model_name)
        return available_models

    def _model_settings(self) -> ModelSettings:
        return {'timeout': settings.AI_TIMEOUT_SECONDS}

    def _run_metadata(
        self,
        *,
        model_name: str,
        attempt: int,
        extra: dict[str, Any],
    ) -> dict[str, Any]:
        metadata = get_log_context(
            workflow_name=self.workflow_name,
            model_name=model_name,
            retry_attempt=attempt,
            **extra,
        )
        return {key: value for key, value in metadata.items() if value is not None}

    def _attempt_span(
        self,
        *,
        model_name: str,
        attempt: int,
        prompt_length: int,
        metadata: dict[str, Any],
    ) -> Any:
        import logfire

        return logfire.span(
            'AI model attempt',
            workflow_name=self.workflow_name,
            model_name=model_name,
            retry_attempt=attempt,
            prompt_length=prompt_length,
            **get_log_context(**metadata),
        )

    @staticmethod
    def _provider_key_name(model_name: str) -> str | None:
        provider = model_name.split(':', 1)[0].strip().lower()
        return _REMOTE_PROVIDER_KEYS.get(provider)

    @staticmethod
    def _is_local_model(model_name: str) -> bool:
        provider = model_name.split(':', 1)[0].strip().lower()
        return provider in {'ollama', 'localhost', 'local'}

    @staticmethod
    def _classify_error(exc: Exception) -> str:
        if isinstance(exc, ModelHTTPError):
            if exc.status_code == 429:
                return 'rate_limit'
            if exc.status_code in {408, 504}:
                return 'timeout'
            if exc.status_code == 400:
                body_text = str(exc.body).lower() if exc.body is not None else ''
                if any(
                    phrase in body_text
                    for phrase in ('token', 'context length', 'too long', 'max tokens')
                ):
                    return 'token_limit'
            return 'api_error'

        if isinstance(exc, ModelAPIError):
            lowered = str(exc).lower()
            if 'rate limit' in lowered:
                return 'rate_limit'
            if any(
                phrase in lowered
                for phrase in ('token', 'context length', 'too long', 'max tokens')
            ):
                return 'token_limit'
            if 'timeout' in lowered:
                return 'timeout'
            return 'api_error'

        if isinstance(exc, (asyncio.TimeoutError, TimeoutError, httpx.TimeoutException)):
            return 'timeout'

        if isinstance(exc, httpx.HTTPError):
            return 'network_error'

        lowered = str(exc).lower()
        if 'rate limit' in lowered or 'too many requests' in lowered:
            return 'rate_limit'
        if any(
            phrase in lowered
            for phrase in ('token', 'context length', 'too long', 'max tokens')
        ):
            return 'token_limit'
        if 'timeout' in lowered:
            return 'timeout'
        return 'api_error'

    @staticmethod
    def _apply_provider_api_key(model_name: str) -> None:
        provider_key_name = FallbackAIExecutor._provider_key_name(model_name)
        if provider_key_name is None:
            return

        api_key = getattr(settings, provider_key_name, None)
        if api_key:
            os.environ[provider_key_name] = api_key

    @staticmethod
    def format_failures(failures: list[AIModelFailure]) -> list[dict[str, Any]]:
        return [asdict(failure) for failure in failures]
