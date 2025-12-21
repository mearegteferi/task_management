from app.core.db import Base

class User(Base):
    id
    full_name
    email
    hashed_password
    is_superuser
    is_active
