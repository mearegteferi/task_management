#!/bin/sh

set -eu

echo "Running migrations..."
alembic upgrade head

if [ -n "${INITIAL_SUPERUSER_EMAIL:-}" ] && [ -n "${INITIAL_SUPERUSER_PASSWORD:-}" ]; then
  echo "Creating initial superuser..."
  python -m app.initial_data
fi

echo "Starting application..."
exec "$@"
