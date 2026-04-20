from datetime import datetime
from typing import Any, Optional

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel, ReturnDocument


class Bid(Document):
    auction_id: PydanticObjectId
    user_id: PydanticObjectId
    amount: float
    placed_at: datetime = Field(default_factory=datetime.utcnow)
    is_winning: bool = False

    class Settings:
        name = "bids"
        indexes = [
            IndexModel([("auction_id", 1), ("placed_at", -1)]),
            IndexModel([("user_id", 1)]),
        ]

    @classmethod
    async def find_one_and_update(
        cls,
        filter_query: dict[str, Any],
        update_query: dict[str, Any],
        sort: Optional[list[tuple[str, int]]] = None,
    ) -> Optional["Bid"]:
        document = await cls.get_motor_collection().find_one_and_update(
            filter_query,
            update_query,
            return_document=ReturnDocument.AFTER,
            sort=sort,
        )
        if document is None:
            return None
        return cls.model_validate(document)
