from datetime import datetime
from typing import Optional

from beanie import Document, PydanticObjectId
from pydantic import EmailStr, Field
from pymongo import IndexModel


class User(Document):
    email: EmailStr
    hashed_password: str
    full_name: str
    is_admin: bool = False
    is_verified: bool = False
    avatar_url: Optional[str] = None
    balance: float = Field(default=50000.0, ge=0)
    watched_auction_ids: list[PydanticObjectId] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"
        indexes = [IndexModel([("email", 1)], unique=True)]
