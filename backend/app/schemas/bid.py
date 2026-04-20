from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class BidCreate(BaseModel):
    amount: float = Field(gt=0)


class BidResponse(BaseModel):
    id: str
    auction_id: str
    user_id: str
    amount: float
    placed_at: datetime
    is_winning: bool
    bidder_name: str

    model_config = ConfigDict(from_attributes=True)
