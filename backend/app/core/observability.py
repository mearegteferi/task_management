from __future__ import annotations

import contextvars
import logging
import uuid
from collections.abc import Awaitable, Callable
from typing import Any

import logfire
from fastapi import FastAPI, HTTPException, Request
from fastapi.exception_handlers import (
    http_exception_handler as fastapi_http_exception_handler,
)
from fastapi.exception_handlers import (
    request_validation_exception_handler,
)
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
from starlette.responses import JSONResponse, Response

from app.core.config import settings

logger = logging.getLogger(__name__)

_request_id_context: contextvars.ContextVar[str | None] = contextvars.ContextVar(
    'request_id',
    default=None,
)


def sanitize_text(value: str | None, *, max_length: int = 500) -> str | None:
    if value is None:
        return None

    normalized = ' '.join(value.split())
    if len(normalized) <= max_length:
        return normalized
    return f'{normalized[: max_length - 3]}...'


def get_request_id() -> str | None:
    return _request_id_context.get()


def get_log_context(**extra: Any) -> dict[str, Any]:
    context = {'request_id': get_request_id()}
    context.update(extra)
    return {key: value for key, value in context.items() if value is not None}


def log_ai_event(
    message: str,
    *,
    workflow_name: str,
    level: str = 'info',
    **attributes: Any,
) -> None:
    log = logfire.with_tags('ai', workflow_name)
    payload = get_log_context(workflow_name=workflow_name, **attributes)
    getattr(log, level)(message, **payload)


def _request_attributes_mapper(
    request: Request, attributes: dict[str, Any]
) -> dict[str, Any]:
    mapped_attributes = dict(attributes)
    request_id = getattr(request.state, 'request_id', None) or request.headers.get(
        'x-request-id'
    )
    if request_id:
        mapped_attributes['request_id'] = request_id
    return mapped_attributes


def configure_logfire() -> None:
    logfire.configure(
        service_name=settings.LOGFIRE_PROJECT_NAME or settings.PROJECT_NAME,
        api_key=settings.LOGFIRE_API_KEY,
        send_to_logfire='if-token-present',
        console=False,
        min_level=settings.LOG_LEVEL.lower(),
    )
    logfire.instrument_pydantic(record='all')
    try:
        logfire.instrument_httpx(capture_all=True)
    except RuntimeError as exc:
        logger.warning('HTTPX Logfire instrumentation unavailable: %s', exc)


async def request_context_middleware(
    request: Request, call_next: Callable[[Request], Awaitable[Response]]
) -> Response:
    request_id = request.headers.get('x-request-id') or str(uuid.uuid4())
    request.state.request_id = request_id
    token = _request_id_context.set(request_id)

    try:
        response = await call_next(request)
    finally:
        _request_id_context.reset(token)

    response.headers['X-Request-ID'] = request_id
    return response


async def log_request_validation_error(
    request: Request, exc: RequestValidationError
) -> Response:
    logfire.warning(
        'FastAPI request validation failed',
        **get_log_context(
            path=request.url.path,
            method=request.method,
            errors=exc.errors(),
        ),
    )
    return await request_validation_exception_handler(request, exc)


async def log_pydantic_validation_error(
    request: Request, exc: ValidationError
) -> Response:
    logfire.error(
        'Unhandled Pydantic validation error',
        **get_log_context(
            path=request.url.path,
            method=request.method,
            errors=exc.errors(),
        ),
    )
    return JSONResponse(
        status_code=500,
        content={'detail': 'A validation error occurred while processing the request.'},
    )


async def log_http_exception(request: Request, exc: HTTPException) -> Response:
    logfire.warning(
        'HTTP exception raised',
        **get_log_context(
            path=request.url.path,
            method=request.method,
            status_code=exc.status_code,
            detail=exc.detail,
        ),
    )
    return await fastapi_http_exception_handler(request, exc)


async def log_unhandled_exception(request: Request, exc: Exception) -> Response:
    logfire.error(
        'Unhandled application exception',
        **get_log_context(
            path=request.url.path,
            method=request.method,
            error_type=type(exc).__name__,
            error_details=sanitize_text(str(exc), max_length=800),
        ),
    )
    return JSONResponse(
        status_code=500,
        content={'detail': 'An unexpected error occurred.'},
    )


def configure_observability(app: FastAPI) -> None:
    configure_logfire()
    app.middleware('http')(request_context_middleware)
    try:
        logfire.instrument_fastapi(
            app,
            capture_headers=False,
            request_attributes_mapper=_request_attributes_mapper,
        )
    except RuntimeError as exc:
        logger.warning('FastAPI Logfire instrumentation unavailable: %s', exc)
    app.add_exception_handler(RequestValidationError, log_request_validation_error)
    app.add_exception_handler(ValidationError, log_pydantic_validation_error)
    app.add_exception_handler(HTTPException, log_http_exception)
    app.add_exception_handler(Exception, log_unhandled_exception)
    logger.info('Logfire observability configured')
