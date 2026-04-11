from pathlib import Path
from typing import Self

from pydantic import EmailStr, computed_field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file='.env',
        case_sensitive=True,
        env_ignore_empty=True,
    )

    PROJECT_NAME: str = 'Sofi Task API'
    API_V1_STR: str = '/api/v1'
    LOG_LEVEL: str = 'INFO'
    SQL_ECHO: bool = False

    SECRET_KEY: str
    ALGORITHM: str = 'HS256'
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_SERVER: str
    POSTGRES_DB: str
    REDIS_URL: str

    UPLOAD_DIR: Path = Path('uploads')
    MAX_UPLOAD_SIZE_BYTES: int = 10 * 1024 * 1024

    GEMINI_API_KEY: str | None = None
    OPENAI_API_KEY: str | None = None
    PYDANTIC_AI_GATEWAY_API_KEY: str | None = None
    AI_ARCHITECT_MODEL: str = 'google-gla:gemini-2.5-flash-lite'
    AI_ARCHITECT_SYSTEM_PROMPT: str | None = None
    AI_ARCHITECT_STATE_TTL_SECONDS: int = 60 * 60 * 24

    BACKEND_CORS_ORIGINS: list[str] = []
    FRONTEND_HOST: str = 'http://localhost:3000'

    SMTP_TLS: bool = True
    SMTP_SSL: bool = False
    SMTP_PORT: int = 587
    SMTP_HOST: str | None = None
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    EMAILS_FROM_EMAIL: EmailStr | None = None
    EMAILS_FROM_NAME: str | None = None
    EMAIL_RESET_TOKEN_EXPIRE_HOURS: int = 48

    INITIAL_SUPERUSER_EMAIL: EmailStr | None = None
    INITIAL_SUPERUSER_PASSWORD: str | None = None
    INITIAL_SUPERUSER_NAME: str = 'Initial Admin'

    @field_validator(
        'EMAILS_FROM_EMAIL',
        'INITIAL_SUPERUSER_EMAIL',
        'SMTP_HOST',
        'SMTP_USER',
        'SMTP_PASSWORD',
        'EMAILS_FROM_NAME',
        'GEMINI_API_KEY',
        'OPENAI_API_KEY',
        'PYDANTIC_AI_GATEWAY_API_KEY',
        'AI_ARCHITECT_SYSTEM_PROMPT',
        'INITIAL_SUPERUSER_PASSWORD',
        mode='before',
    )
    @classmethod
    def _empty_string_to_none(cls, value: str | None) -> str | None:
        if isinstance(value, str) and not value.strip():
            return None
        return value

    @field_validator('BACKEND_CORS_ORIGINS', mode='before')
    @classmethod
    def _parse_cors_origins(cls, value: str | list[str] | None) -> list[str]:
        if value is None:
            return []
        if isinstance(value, str):
            stripped = value.strip()
            if not stripped:
                return []
            if stripped.startswith('['):
                import json

                return [origin.strip() for origin in json.loads(stripped)]
            return [origin.strip() for origin in stripped.split(',') if origin.strip()]
        return [origin.strip() for origin in value if origin.strip()]

    @model_validator(mode='after')
    def _set_default_emails_from(self) -> Self:
        if not self.EMAILS_FROM_NAME:
            self.EMAILS_FROM_NAME = self.PROJECT_NAME
        return self

    @computed_field
    @property
    def DATABASE_URL(self) -> str:
        return (
            'postgresql+asyncpg://'
            f'{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@'
            f'{self.POSTGRES_SERVER}/{self.POSTGRES_DB}'
        )

    @computed_field
    @property
    def all_cors_origins(self) -> list[str]:
        origins = [*self.BACKEND_CORS_ORIGINS, self.FRONTEND_HOST]
        return list(dict.fromkeys(origin for origin in origins if origin))

    @computed_field
    @property
    def emails_enabled(self) -> bool:
        return bool(self.SMTP_HOST and self.EMAILS_FROM_EMAIL)

    @computed_field
    @property
    def upload_dir_path(self) -> Path:
        return self.UPLOAD_DIR.resolve()

    @computed_field
    @property
    def has_initial_superuser(self) -> bool:
        return bool(self.INITIAL_SUPERUSER_EMAIL and self.INITIAL_SUPERUSER_PASSWORD)


settings = Settings()  # ty: ignore[missing-argument]
