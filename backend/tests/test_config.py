from __future__ import annotations

from app.api.v1.users.utils import render_email_template
from app.core.config import Settings


def test_settings_accept_empty_optional_email_values() -> None:
    test_settings = Settings.model_validate(
        {
            'SECRET_KEY': 'test-secret-key',
            'POSTGRES_USER': 'postgres',
            'POSTGRES_PASSWORD': 'postgres',
            'POSTGRES_SERVER': 'postgres',
            'POSTGRES_DB': 'task_db',
            'REDIS_URL': 'redis://redis:6379/0',
            'EMAILS_FROM_EMAIL': '',
            'XAI_API_KEY': '',
            'BACKEND_CORS_ORIGINS': [
                'http://localhost:3000',
                'http://127.0.0.1:3000',
            ],
        }
    )

    assert test_settings.EMAILS_FROM_EMAIL is None
    assert test_settings.XAI_API_KEY is None
    assert test_settings.all_cors_origins == [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ]


def test_settings_parse_ai_models_from_json_and_apply_defaults() -> None:
    test_settings = Settings.model_validate(
        {
            'SECRET_KEY': 'test-secret-key',
            'POSTGRES_USER': 'postgres',
            'POSTGRES_PASSWORD': 'postgres',
            'POSTGRES_SERVER': 'postgres',
            'POSTGRES_DB': 'task_db',
            'REDIS_URL': 'redis://redis:6379/0',
            'AI_MODELS': '["google-gla:gemini-2.5-flash-lite","openai:gpt-4o-mini"]',
        }
    )

    assert test_settings.AI_MODELS == [
        'google-gla:gemini-2.5-flash-lite',
        'openai:gpt-4o-mini',
    ]
    assert test_settings.AI_MAX_RETRIES == 2
    assert test_settings.AI_TIMEOUT_SECONDS == 30.0


def test_render_email_template_uses_shared_template_directory() -> None:
    rendered = render_email_template(
        template_name='test_email.html',
        context={'project_name': 'Sofi Task API', 'email': 'test@example.com'},
    )

    assert 'test@example.com' in rendered
    assert 'Sofi Task API' in rendered
