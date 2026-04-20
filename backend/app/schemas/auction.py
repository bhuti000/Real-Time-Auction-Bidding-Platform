from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models import AuctionStatus


class AuctionCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    description: str = Field(min_length=5)
    category: str
    images: list[str] = Field(default_factory=list)
    starting_price: float = Field(gt=0)
    current_bid: Optional[float] = Field(default=None, gt=0)
    seller_id: Optional[str] = None
    start_time: datetime
    end_time: datetime
    status: AuctionStatus = AuctionStatus.DRAFT
    min_increment: float = Field(default=500.0, gt=0)
    estimate_low: Optional[float] = Field(default=None, gt=0)
    estimate_high: Optional[float] = Field(default=None, gt=0)
    medium: Optional[str] = None
    dimensions: Optional[str] = None
    provenance: Optional[str] = None
    condition: Optional[str] = None
    artist_name: Optional[str] = None
    year: Optional[int] = None
    is_featured: bool = False


class AuctionUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=2, max_length=200)
    description: Optional[str] = Field(default=None, min_length=5)
    category: Optional[str] = None
    images: Optional[list[str]] = None
    starting_price: Optional[float] = Field(default=None, gt=0)
    current_bid: Optional[float] = Field(default=None, gt=0)
    seller_id: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[AuctionStatus] = None
    min_increment: Optional[float] = Field(default=None, gt=0)
    estimate_low: Optional[float] = Field(default=None, gt=0)
    estimate_high: Optional[float] = Field(default=None, gt=0)
    medium: Optional[str] = None
    dimensions: Optional[str] = None
    provenance: Optional[str] = None
    condition: Optional[str] = None
    artist_name: Optional[str] = None
    year: Optional[int] = None
    is_featured: Optional[bool] = None


class AuctionStatusUpdate(BaseModel):
    status: AuctionStatus


class AuctionResponse(BaseModel):
    id: str
    title: str
    description: str
    category: str
    images: list[str]
    starting_price: float
    current_bid: float
    highest_bidder_id: Optional[str] = None
    seller_id: str
    start_time: datetime
    end_time: datetime
    status: AuctionStatus
    min_increment: float
    estimate_low: Optional[float] = None
    estimate_high: Optional[float] = None
    medium: Optional[str] = None
    dimensions: Optional[str] = None
    provenance: Optional[str] = None
    condition: Optional[str] = None
    artist_name: Optional[str] = None
    year: Optional[int] = None
    is_featured: bool
    view_count: int
    bid_count: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
