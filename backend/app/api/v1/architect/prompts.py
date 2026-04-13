from collections.abc import Iterable

from app.api.v1.architect.schemas import (
    ArchitectChatRequest,
    ProjectBreakdown,
    SuggestProjectRequest,
)


def _normalize_lines(values: Iterable[str]) -> list[str]:
    normalized: list[str] = []
    for value in values:
        cleaned = value.strip()
        if cleaned:
            normalized.append(cleaned)
    return normalized


def build_initial_prompt(project_request: SuggestProjectRequest) -> str:
    # Turn the first project request into a structured AI prompt.
    sections = [
        'Create a project breakdown from the request below.',
        '',
        'Project title:',
        project_request.title.strip(),
    ]

    description = (project_request.description or '').strip()
    if description:
        sections.extend(['', 'Project description:', description])

    goals = _normalize_lines(project_request.goals)
    if goals:
        sections.extend(['', 'Goals:'])
        sections.extend(f'- {goal}' for goal in goals)

    constraints = _normalize_lines(project_request.constraints)
    if constraints:
        sections.extend(['', 'Constraints:'])
        sections.extend(f'- {constraint}' for constraint in constraints)

    additional_context = (project_request.additional_context or '').strip()
    if additional_context:
        sections.extend(['', 'Additional context:', additional_context])

    sections.extend(
        [
            '',
            'Instructions:',
            '- Return a complete ProjectBreakdown.',
            '- Use the user goals and constraints as hard requirements.',
            '- Keep tasks actionable, non-duplicative, and implementation-oriented.',
        ]
    )

    return '\n'.join(sections)


def build_feedback_prompt(
    current_draft: ProjectBreakdown, feedback: ArchitectChatRequest
) -> str:
    # Turn draft feedback into a revision prompt for the AI.
    return '\n'.join(
        [
            'Revise the current project breakdown using the feedback below.',
            '',
            'Current draft JSON:',
            current_draft.model_dump_json(indent=2),
            '',
            'User feedback:',
            feedback.feedback.strip(),
            '',
            'Instructions:',
            '- Return the full revised ProjectBreakdown.',
            '- Preserve useful existing work unless the feedback changes it.',
            '- Keep task priorities between 1 and 3.',
        ]
    )
