from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))

class Base(DeclarativeBase):
    pass
