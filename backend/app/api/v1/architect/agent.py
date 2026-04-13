from functools import lru_cache
from typing import Any

from pydantic_ai import ModelMessagesTypeAdapter

from app.api.v1.architect.schemas import ProjectBreakdown
from app.core.ai import FallbackAIExecutor
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
- respect any explicit goals, constraints, and additional context from the user

Do not return commentary outside the structured response.
""".strip()


@lru_cache(maxsize=1)
def get_architect_executor() -> FallbackAIExecutor[ProjectBreakdown]:
    # Build and cache the architect AI executor.
    return FallbackAIExecutor(
        output_type=ProjectBreakdown,
        system_prompt=settings.AI_ARCHITECT_SYSTEM_PROMPT
        or DEFAULT_ARCHITECT_SYSTEM_PROMPT,
        workflow_name='architect',
    )


def deserialize_chat_history(raw_history: str) -> list[Any]:
    # Convert saved chat history JSON back into message objects.
    return list(ModelMessagesTypeAdapter.validate_json(raw_history))
