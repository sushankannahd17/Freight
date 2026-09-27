"""
Base repository with common CRUD operations.
"""

from typing import Any, Generic, Type, TypeVar

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """Base repository with common database operations."""

    def __init__(self, model: Type[ModelType], session: AsyncSession):
        """
        Initialize repository.

        Args:
            model: SQLAlchemy model class
            session: Async database session
        """
        self.model = model
        self.session = session

    async def get(self, id: int) -> ModelType | None:
        """
        Get record by ID.

        Args:
            id: Record ID

        Returns:
            Model instance or None
        """
        result = await self.session.execute(select(self.model).where(self.model.id == id))
        return result.scalar_one_or_none()

    async def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
    ) -> list[ModelType]:
        """
        Get all records with pagination.

        Args:
            skip: Number of records to skip
            limit: Maximum number of records

        Returns:
            List of model instances
        """
        result = await self.session.execute(select(self.model).offset(skip).limit(limit))
        return list(result.scalars().all())

    async def create(self, obj_in: dict[str, Any]) -> ModelType:
        """
        Create new record.

        Args:
            obj_in: Dictionary of model fields

        Returns:
            Created model instance
        """
        db_obj = self.model(**obj_in)
        self.session.add(db_obj)
        await self.session.commit()
        await self.session.refresh(db_obj)
        return db_obj

    async def update(self, id: int, obj_in: dict[str, Any]) -> ModelType | None:
        """
        Update existing record.

        Args:
            id: Record ID
            obj_in: Dictionary of fields to update

        Returns:
            Updated model instance or None
        """
        db_obj = await self.get(id)
        if db_obj is None:
            return None

        for field, value in obj_in.items():
            if value is not None:
                setattr(db_obj, field, value)

        await self.session.commit()
        await self.session.refresh(db_obj)
        return db_obj

    async def delete(self, id: int) -> bool:
        """
        Delete record by ID.

        Args:
            id: Record ID

        Returns:
            True if deleted, False if not found
        """
        db_obj = await self.get(id)
        if db_obj is None:
            return False

        await self.session.delete(db_obj)
        await self.session.commit()
        return True

    async def count(self) -> int:
        """
        Count total records.

        Returns:
            Total count
        """
        result = await self.session.execute(select(self.model))
        return len(list(result.scalars().all()))

    async def exists(self, id: int) -> bool:
        """
        Check if record exists.

        Args:
            id: Record ID

        Returns:
            True if exists
        """
        result = await self.get(id)
        return result is not None
