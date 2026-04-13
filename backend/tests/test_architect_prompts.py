from app.api.v1.architect.prompts import build_feedback_prompt, build_initial_prompt
from app.api.v1.architect.schemas import (
    ArchitectChatRequest,
    ProjectBreakdown,
    SuggestProjectRequest,
    TaskSuggestion,
)


def test_build_initial_prompt_includes_goals_and_constraints() -> None:
    prompt = build_initial_prompt(
        SuggestProjectRequest(
            title='Launch project dashboard',
            description='A dashboard for project health and milestones.',
            goals=['Track delivery status', 'Highlight blocked work'],
            constraints=['Use existing backend APIs', 'Avoid duplicate tasks'],
            additional_context='Focus on team leads as the first user group.',
        )
    )

    assert 'Project title:' in prompt
    assert 'Launch project dashboard' in prompt
    assert 'Goals:' in prompt
    assert '- Track delivery status' in prompt
    assert 'Constraints:' in prompt
    assert '- Use existing backend APIs' in prompt
    assert 'Additional context:' in prompt


def test_build_feedback_prompt_preserves_full_draft_context() -> None:
    prompt = build_feedback_prompt(
        ProjectBreakdown(
            title='Launch dashboard',
            description='Initial architect draft',
            tasks=[
                TaskSuggestion(
                    title='Design widgets',
                    description='Define the metrics tiles and charts.',
                    estimated_priority=2,
                )
            ],
        ),
        ArchitectChatRequest(
            session_id='session-123',
            feedback='Add a task for audit logging and role-based access.',
        ),
    )

    assert 'Current draft JSON:' in prompt
    assert 'Design widgets' in prompt
    assert 'User feedback:' in prompt
    assert 'role-based access' in prompt
    assert 'Return the full revised ProjectBreakdown.' in prompt
