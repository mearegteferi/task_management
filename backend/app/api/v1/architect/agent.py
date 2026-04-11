import os
from functools import lru_cache
from typing import Any

from pydantic_ai import Agent

from app.api.v1.architect.schemas import ProjectBreakdown
from app.core.config import settings

DEFAULT_ARCHITECT_SYSTEM_PROMPT = """
You are an AI project architect helping users turn project ideas into clear,
execution-ready plans.

Return a complete ProjectBreakdown every time. The breakdown should:
- keep the project title specific and practical
- write a short description that clarifies scope and expected outcome
- break the work into actionable tasks with no duplicates
- assign estimated_priority on a scale of 1 to 3, where 3 is most urgent
- incorporate the latest user feedback while preserving useful existing work

Do not return commentary outside the structured response.
""".strip()


def _apply_provider_environment() -> None:
    # Load provider keys and URLs into the process environment.
    if settings.GEMINI_API_KEY:
        os.environ.setdefault('GEMINI_API_KEY', settings.GEMINI_API_KEY)
    if settings.OLLAMA_BASE_URL:
        os.environ.setdefault('OLLAMA_BASE_URL', settings.OLLAMA_BASE_URL)
    if settings.OPENAI_API_KEY:
        os.environ.setdefault('OPENAI_API_KEY', settings.OPENAI_API_KEY)
    if settings.PYDANTIC_AI_GATEWAY_API_KEY:
        os.environ.setdefault(
            'PYDANTIC_AI_GATEWAY_API_KEY', settings.PYDANTIC_AI_GATEWAY_API_KEY
        )


def _missing_provider_configuration() -> str | None:
    # Check whether the selected AI provider has the required settings.
    model_name = settings.AI_ARCHITECT_MODEL.lower()

    if model_name.startswith('google-gla') and not (
        settings.GEMINI_API_KEY or os.environ.get('GEMINI_API_KEY')
    ):
        return 'GEMINI_API_KEY is required when using a Google Gemini architect model.'

    if model_name.startswith('ollama') and not (
        settings.OLLAMA_BASE_URL or os.environ.get('OLLAMA_BASE_URL')
    ):
        return 'OLLAMA_BASE_URL is required when using an Ollama architect model.'

    if model_name.startswith('openai') and not (
        settings.OPENAI_API_KEY or os.environ.get('OPENAI_API_KEY')
    ):
        return 'OPENAI_API_KEY is required when using an OpenAI architect model.'

    if model_name.startswith('gateway/') and not (
        settings.PYDANTIC_AI_GATEWAY_API_KEY
        or os.environ.get('PYDANTIC_AI_GATEWAY_API_KEY')
    ):
        return (
            'PYDANTIC_AI_GATEWAY_API_KEY is required when using a gateway-backed '
            'AI architect model.'
        )

    return None


def format_architect_provider_error(exc: Exception) -> str | None:
    # Turn common provider failures into simpler user-facing messages.
    model_name = settings.AI_ARCHITECT_MODEL.lower()
    message = str(exc)

    if model_name.startswith('ollama'):
        base_url = os.environ.get('OLLAMA_BASE_URL') or settings.OLLAMA_BASE_URL
        ollama_model = settings.AI_ARCHITECT_MODEL.split(':', maxsplit=1)[-1]

        if message == 'Connection error.':
            return (
                f'Could not reach Ollama at {base_url}. Install and start Ollama, '
                f'then run `ollama pull {ollama_model}` before trying again.'
            )

        lowered_message = message.lower()
        if 'not found' in lowered_message and 'model' in lowered_message:
            return (
                f'Ollama could not find the `{ollama_model}` model. Run '
                f'`ollama pull {ollama_model}` and try again.'
            )

    return None


@lru_cache(maxsize=1)
def get_architect_agent() -> Any:
    # Build and cache the architect agent instance.
    _apply_provider_environment()

    missing_configuration = _missing_provider_configuration()
    if missing_configuration:
        raise RuntimeError(missing_configuration)

    return Agent(
        settings.AI_ARCHITECT_MODEL,
        output_type=ProjectBreakdown,
        system_prompt=settings.AI_ARCHITECT_SYSTEM_PROMPT
        or DEFAULT_ARCHITECT_SYSTEM_PROMPT,
        retries=2,
    )


def deserialize_chat_history(raw_history: str) -> list[Any]:
    # Convert saved chat history JSON back into message objects.
    try:
        from pydantic_ai import ModelMessagesTypeAdapter
    except ModuleNotFoundError as exc:
        raise RuntimeError(
            'pydantic-ai is not installed. Run `uv sync` in the backend directory.'
        ) from exc

    return list(ModelMessagesTypeAdapter.validate_json(raw_history))
