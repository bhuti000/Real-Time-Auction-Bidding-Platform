from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models import CollectionStatus


class CollectionCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    subtitle: str = Field(min_length=2, max_length=200)
    description: str = Field(min_length=5)
    cover_image: str
    total_lots: int = Field(ge=0)
    est_value_low: float = Field(gt=0)
    est_value_high: float = Field(gt=0)
    status: CollectionStatus = CollectionStatus.CLOSED
    auction_ids: list[str] = Field(default_factory=list)
    is_private: bool = True


class CollectionUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=2, max_length=200)
    subtitle: Optional[str] = Field(default=None, min_length=2, max_length=200)
    description: Optional[str] = Field(default=None, min_length=5)
    cover_image: Optional[str] = None
    total_lots: Optional[int] = Field(default=None, ge=0)
    est_value_low: Optional[float] = Field(default=None, gt=0)
    est_value_high: Optional[float] = Field(default=None, gt=0)
    status: Optional[CollectionStatus] = None
    auction_ids: Optional[list[str]] = None
    is_private: Optional[bool] = None


class CollectionAccessRequest(BaseModel):
    message: str = Field(min_length=3, max_length=500)


class CollectionResponse(BaseModel):
    id: str
    title: str
    subtitle: str
    description: str
    cover_image: str
    total_lots: int
    est_value_low: float
    est_value_high: float
    status: CollectionStatus
    auction_ids: list[str]
    is_private: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
