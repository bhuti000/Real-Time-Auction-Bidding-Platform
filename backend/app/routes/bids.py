from fastapi import APIRouter, Depends, Query

from app.core.security import get_current_user
from app.models import User
from app.schemas import BidCreate
from app.services.bid_service import get_bid_history, place_bid, serialize_bid
from app.utils.response import paginated_response, success_response

router = APIRouter()


@router.post("/{auction_id}/bids")
async def create_bid(
    auction_id: str,
    payload: BidCreate,
    current_user: User = Depends(get_current_user),
):
    bid = await place_bid(auction_id=auction_id, amount=payload.amount, current_user=current_user)
    return success_response(
        serialize_bid(bid, bidder_name=current_user.full_name),
        message="Bid placed successfully"
    )


@router.get("/{auction_id}/bids")
async def get_bids(
    auction_id: str,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
):
    bids, total, safe_page, safe_limit = await get_bid_history(
        auction_id=auction_id, page=page, limit=limit
    )
    return paginated_response(
        bids,
        total=total,
        page=safe_page,
        limit=safe_limit,
    )

