from datetime import datetime
from enum import Enum
from typing import Any, Optional

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel, ReturnDocument


class AuctionStatus(str, Enum):
    DRAFT = "DRAFT"
    SCHEDULED = "SCHEDULED"
    LIVE = "LIVE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class Auction(Document):
    title: str
    description: str
    category: str
    images: list[str] = Field(default_factory=list)
    starting_price: float
    current_bid: float
    highest_bidder_id: Optional[PydanticObjectId] = None
    seller_id: PydanticObjectId
    start_time: datetime
    end_time: datetime
    status: AuctionStatus = AuctionStatus.DRAFT
    min_increment: float = 10.0
    estimate_low: Optional[float] = None
    estimate_high: Optional[float] = None
    medium: Optional[str] = None
    dimensions: Optional[str] = None
    provenance: Optional[str] = None
    condition: Optional[str] = None
    artist_name: Optional[str] = None
    year: Optional[int] = None
    is_featured: bool = False
    view_count: int = 0
    bid_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "auctions"
        indexes = [
            IndexModel([("status", 1)]),
            IndexModel([("category", 1)]),
            IndexModel([("end_time", 1)]),
            IndexModel([("is_featured", 1)]),
        ]

    @classmethod
    async def find_one_and_update(
        cls,
        filter_query: dict[str, Any],
        update_query: dict[str, Any],
        return_document: bool = True,
        sort: Optional[list[tuple[str, int]]] = None,
    ) -> Optional["Auction"]:
        document = await cls.get_motor_collection().find_one_and_update(
            filter_query,
            update_query,
            return_document=ReturnDocument.AFTER
            if return_document
            else ReturnDocument.BEFORE,
            sort=sort,
        )
        if document is None:
            return None
        return cls.model_validate(document)
