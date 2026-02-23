from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.orm import relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Profile fields
    display_name = Column(String(100), nullable=True)
    bio = Column(String(500), nullable=True)
    sex = Column(String(20), nullable=True)
    birthday = Column(DateTime, nullable=True)
    relationship_status = Column(String(50), nullable=True)

    # Denormalized counts — updated atomically with their triggers
    followers_count = Column(Integer, default=0, nullable=False)
    following_count = Column(Integer, default=0, nullable=False)

    # Relationships
    posts = relationship("Post", back_populates="user", cascade="all, delete-orphan")
