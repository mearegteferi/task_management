import uuid

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.projects.models import Project, ProjectStatus
from app.api.v1.projects.schemas import ProjectCreate, ProjectUpdate
from app.core.redis import clear_cache_pattern, get_cache, set_cache


class ProjectService:
    @staticmethod
    async def create(
        db: AsyncSession, project_in: ProjectCreate, owner_id: uuid.UUID
    ) -> Project:
        # Create Project with owner_id
        db_project = Project(
            title=project_in.title,
            description=project_in.description,
            status=project_in.status,
            priority=project_in.priority,
            due_date=project_in.due_date,
            owner_id=owner_id,  # <--- ASSIGN OWNER
        )
        db.add(db_project)
        await db.commit()
        await db.refresh(db_project)

        # Invalidate cache
        await clear_cache_pattern(f'user:{owner_id}:projects:*')
        await clear_cache_pattern(f'user:{owner_id}:analytics')

        return db_project

    @staticmethod
    async def get_multi(
        db: AsyncSession,
        owner_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
        status: ProjectStatus | None = None,
        priority: int | None = None,
        search: str | None = None,
    ) -> list[Project]:

        # Try to get from cache
        cache_key = (
            f'user:{owner_id}:projects:list:{skip}:{limit}:{status}:{priority}:{search}'
        )
        cached_data = await get_cache(cache_key)
        if cached_data:
            return [
                Project(**p) for p in cached_data
            ]  # This might need adjustment if Project doesn't support dict init well with relations, but for simple list it's usually fine or use schemas

        # Filter by owner_id AND is_deleted=False
        query = select(Project).where(
            and_(Project.owner_id == owner_id, Project.is_deleted.is_(False))
        )

        # Apply Filters dynamically
        if status:
            query = query.where(Project.status == status)
        if priority:
            query = query.where(Project.priority == priority)
        if search:
            query = query.where(
                or_(
                    Project.title.ilike(f'%{search}%'),
                    Project.description.ilike(f'%{search}%'),
                )
            )

        query = query.order_by(Project.created_at.desc()).offset(skip).limit(limit)

        result = await db.execute(query)
        projects = list(result.scalars().all())

        # Cache the result (need to serialize objects)
        # Note: In a real app, you'd use schemas for serialization
        # For simplicity, if we enable decode_responses=True in Redis, we store JSON
        # Here we converts projects to dicts if possible or just use a simpler caching strategy if needed.
        # However, Project model might have issues with simple json dumps.
        # Let's use a list of IDs or simpler dicts.

        # IMPROVEMENT: Use schemas for caching to avoid SQLAlchemy complexity in cache
        from app.api.v1.projects.schemas import ProjectResponse

        projects_data = [
            ProjectResponse.model_validate(p).model_dump(mode='json') for p in projects
        ]
        await set_cache(cache_key, projects_data, expire=3600)

        return projects

    @staticmethod
    async def get_one(
        db: AsyncSession,
        project_id: int,
        owner_id: uuid.UUID,  # <--- REQUIRE OWNER ID
    ) -> Project | None:
        # Try cache
        cache_key = f'user:{owner_id}:projects:{project_id}'
        cached_data = await get_cache(cache_key)
        if cached_data:
            return Project(**cached_data)

        # Only return if ID matches AND Owner matches
        query = select(Project).where(
            Project.id == project_id,
            Project.owner_id == owner_id,  # Security check
            Project.is_deleted.is_(False),
        )
        result = await db.execute(query)
        project = result.scalars().first()

        if project:
            from app.api.v1.projects.schemas import ProjectResponse

            await set_cache(
                cache_key,
                ProjectResponse.model_validate(project).model_dump(mode='json'),
            )

        return project

    @staticmethod
    async def update(
        db: AsyncSession, db_project: Project, project_update: ProjectUpdate
    ) -> Project:
        update_data = project_update.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(db_project, field, value)

        db.add(db_project)
        await db.commit()
        await db.refresh(db_project)

        # Invalidate cache
        await clear_cache_pattern(f'user:{db_project.owner_id}:projects:*')
        await clear_cache_pattern(f'user:{db_project.owner_id}:analytics')

        return db_project

    @staticmethod
    async def delete(db: AsyncSession, db_project: Project) -> None:
        db_project.is_deleted = True
        db.add(db_project)
        await db.commit()

        # Invalidate cache
        await clear_cache_pattern(f'user:{db_project.owner_id}:projects:*')
        await clear_cache_pattern(f'user:{db_project.owner_id}:analytics')

    @staticmethod
    async def restore(
        db: AsyncSession,
        project_id: int,
        owner_id: uuid.UUID,  # <--- REQUIRE OWNER ID
    ) -> Project | None:
        # Can only restore YOUR OWN deleted projects
        query = select(Project).where(
            Project.id == project_id,
            Project.owner_id == owner_id,
            Project.is_deleted,
        )
        result = await db.execute(query)
        db_project = result.scalars().first()

        if db_project:
            db_project.is_deleted = False
            db.add(db_project)
            await db.commit()
            await db.refresh(db_project)

            # Invalidate cache
            await clear_cache_pattern(f'user:{owner_id}:projects:*')
            await clear_cache_pattern(f'user:{owner_id}:analytics')

        return db_project
