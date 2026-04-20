from datetime import datetime
from typing import Optional

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel


class RefreshToken(Document):
    user_id: PydanticObjectId
    token_hash: str
    jti: str
    family_id: str
    expires_at: datetime
    rotated_at: Optional[datetime] = None
    revoked_at: Optional[datetime] = None
    replaced_by_jti: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_used_at: Optional[datetime] = None
    ip: Optional[str] = None
    user_agent: Optional[str] = None

    class Settings:
        name = "refresh_tokens"
        indexes = [
            IndexModel([("jti", 1)], unique=True),
            IndexModel([("user_id", 1)]),
            IndexModel([("expires_at", 1)]),
            IndexModel([("user_id", 1), ("revoked_at", 1)]),
        ]
