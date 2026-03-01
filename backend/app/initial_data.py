import asyncio
import logging

from sqlalchemy import select

from app.api.v1.users.models import User
from app.core.security import get_password_hash
from app.db.session import AsyncSessionLocal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def create_initial_data() -> None:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User).where(User.email == 'test@example.com')
        )
        user = result.scalars().first()
        if user:
            logger.info('User test@example.com already exists')
        else:
            logger.info('Creating user test@example.com')
            user = User(
                email='test@example.com',
                hashed_password=get_password_hash('password'),
                full_name='Test User',
                is_superuser=True,
            )
            session.add(user)
            await session.commit()
            logger.info('User created successfully')


async def main() -> None:
    logger.info('Creating initial data')
    await create_initial_data()
    logger.info('Initial data created')


if __name__ == '__main__':
    # Fix for Windows asyncio loop with certain libraries if needed
    # if sys.platform == "win32":
    #     asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
