# Sofi Task Management

Sofi Task Management is a full-stack project and task workspace built with Next.js, FastAPI, PostgreSQL, Redis, and an AI Architect flow that turns a prompt into a draft project with tasks.

## Stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS, Zustand, Axios
- Backend: FastAPI, SQLAlchemy async, Alembic, Pydantic Settings, Redis
- Tooling: `uv`, Ruff, `ty`, pytest, pre-commit, Docker, GitHub Actions
- Deployment: Railway

## Repository

```text
task_management/
|-- .github/workflows/ci-cd.yml
|-- .pre-commit-config.yaml
|-- docker-compose.yml
|-- .env.example
|-- backend/
|   |-- .env.example
|   |-- Dockerfile
|   |-- pyproject.toml
|   |-- uv.lock
|   |-- tests/
|   `-- app/
`-- frontend/
    |-- .env.example
    |-- Dockerfile
    `-- app/
```

## Local Development

### Environment files

Copy the examples and adjust values as needed:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Backend

```bash
cd backend
uv sync --all-groups
uv run alembic upgrade head
uv run fastapi dev app/main.py
```

To bootstrap an admin locally, set `INITIAL_SUPERUSER_EMAIL` and
`INITIAL_SUPERUSER_PASSWORD` in `backend/.env`, then run:

```bash
uv run python -m app.initial_data
```

Backend URLs:

- App: `http://localhost:8000`
- API: `http://localhost:8000/api/v1`
- Health: `http://localhost:8000/health`

### Frontend

```bash
cd frontend
npm ci
npm run dev
```

Frontend URL:

- App: `http://localhost:3000`

### Full stack with Docker Compose

The standard local container entrypoint is [docker-compose.yml](/c:/Users/omen/Documents/Projects/Sofi/task_management/docker-compose.yml).

```bash
docker compose up --build
```

Services:

- `postgres`
- `redis`
- `backend`
- `frontend`

Both app images use multi-stage Docker builds. The backend image installs dependencies with `uv`, runs migrations on startup, and starts as a non-root user. The frontend image uses a Next.js standalone production build.

If `INITIAL_SUPERUSER_EMAIL` and `INITIAL_SUPERUSER_PASSWORD` are present in the
backend container environment, the entrypoint will create that account once after
migrations.

## Quality Checks

### Backend

```bash
cd backend
uv run ruff check app tests
uv run ruff format --check app tests
uv run ty check
uv run pytest
```

### Frontend

```bash
cd frontend
npm run lint
npm run typecheck
npm run build
```

### Pre-commit

Install hooks once:

```bash
uv tool install pre-commit
pre-commit install
```

Run them manually:

```bash
pre-commit run --all-files
```

The root [`.pre-commit-config.yaml`](/c:/Users/omen/Documents/Projects/Sofi/task_management/.pre-commit-config.yaml) runs repository hygiene checks plus backend Ruff/`ty` and frontend lint/typecheck commands.

## CI/CD

The project uses a single GitHub Actions workflow in [ci-cd.yml](/c:/Users/omen/Documents/Projects/Sofi/task_management/.github/workflows/ci-cd.yml) that:

- validates backend linting, typing, and tests
- validates frontend linting, typing, and production build
- validates Docker Compose and builds both containers
- deploys backend and frontend services to Railway on pushes to `main`

Required GitHub secrets for deployment:

- `RAILWAY_TOKEN`
- `RAILWAY_PROJECT_ID`
- `RAILWAY_ENVIRONMENT_NAME`
- `RAILWAY_BACKEND_SERVICE`
- `RAILWAY_FRONTEND_SERVICE`

Optional smoke test secrets:

- `RAILWAY_BACKEND_HEALTHCHECK_URL`
- `RAILWAY_FRONTEND_URL`

## Notes

- The backend expects PostgreSQL and Redis configuration from `backend/.env`.
- The AI Architect flow also needs a configured provider such as Gemini, OpenAI, Ollama, or a Pydantic AI gateway.
- File uploads are stored under `backend/uploads/` and are intentionally excluded from version control.
