#!/bin/sh

set -e


echo "Running migrations..."
uv run alembic upgrade head

echo "Creating initial data..."
uv run python -m app.initial_data

echo "Starting application..."
exec "$@"
