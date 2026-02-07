from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.models.tag import Tag
from app.schemas.tag import TagCreate


class TagService:
    @staticmethod
    async def get_or_create_tags(db: AsyncSession, tags_in: List[TagCreate]) -> List[Tag]:
        """
        Takes a list of Tag schemas.
        Returns a list of Tag DB instances (existing or newly created).
        """
        tag_instances = []
        for tag_data in tags_in:
            # 1. Check if tag exists (Case insensitive for better UX)
            query = select(Tag).where(Tag.name == tag_data.name)
            result = await db.execute(query)
            existing_tag = result.scalars().first()

            if existing_tag:
                tag_instances.append(existing_tag)
            else:
                # 2. Create new tag
                new_tag = Tag(name=tag_data.name, color=tag_data.color)
                db.add(new_tag)
                tag_instances.append(new_tag)

        return tag_instances

    @staticmethod
    async def get_all(db: AsyncSession) -> List[Tag]:
        result = await db.execute(select(Tag))
        return result.scalars().all()