import asyncio
import logging

from sqlalchemy import select

from app.api.v1.users.models import User
from app.core.config import settings
from app.core.security import get_password_hash
from app.db.session import AsyncSessionLocal

logger = logging.getLogger(__name__)


async def create_initial_data() -> None:
    if not settings.has_initial_superuser:
        logger.info('Skipping initial data; no initial superuser credentials configured')
        return

    initial_superuser_email = str(settings.INITIAL_SUPERUSER_EMAIL)
    initial_superuser_password = settings.INITIAL_SUPERUSER_PASSWORD
    if initial_superuser_password is None:
        logger.info('Skipping initial data; initial superuser password is missing')
        return

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User).where(User.email == initial_superuser_email)
        )
        user = result.scalars().first()
        if user:
            logger.info(
                'Initial superuser %s already exists',
                initial_superuser_email,
            )
            return

        logger.info(
            'Creating initial superuser %s',
            initial_superuser_email,
        )
        user = User(
            email=initial_superuser_email,
            hashed_password=get_password_hash(initial_superuser_password),
            full_name=settings.INITIAL_SUPERUSER_NAME,
            is_superuser=True,
        )
        session.add(user)
        await session.commit()
        logger.info('Initial superuser created successfully')


async def main() -> None:
    await create_initial_data()


if __name__ == '__main__':
    asyncio.run(main())
