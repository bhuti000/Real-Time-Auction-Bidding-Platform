from datetime import datetime
from enum import Enum

from beanie import Document, PydanticObjectId
from pydantic import Field


class CollectionStatus(str, Enum):
    ACCEPTING = "ACCEPTING"
    PREVIEW_OPEN = "PREVIEW_OPEN"
    CLOSED = "CLOSED"


class Collection(Document):
    title: str
    subtitle: str
    description: str
    cover_image: str
    total_lots: int
    est_value_low: float
    est_value_high: float
    status: CollectionStatus = CollectionStatus.CLOSED
    auction_ids: list[PydanticObjectId] = Field(default_factory=list)
    is_private: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "collections"
