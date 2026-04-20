from datetime import datetime
from typing import Optional

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel


class AuditLog(Document):
    action: str
    actor_id: Optional[PydanticObjectId] = None
    auction_id: Optional[PydanticObjectId] = None
    metadata: dict = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "audit_logs"
        indexes = [IndexModel([("timestamp", -1)])]
