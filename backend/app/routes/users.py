from datetime import datetime

from fastapi import APIRouter, Depends, Query

from app.core.security import get_current_user
from app.models import Auction, AuctionStatus, Bid, User
from app.schemas import UserUpdate
from app.services.auction_service import serialize_auction
from app.services.auth_service import hash_password, serialize_user, validate_password_policy
from app.services.bid_service import serialize_bid
from app.utils.pagination import get_pagination_params
from app.utils.response import paginated_response, success_response

router = APIRouter()


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return success_response(serialize_user(current_user))


@router.put("/me")
async def update_me(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
):
    update_data = payload.model_dump(exclude_unset=True)
    next_password = update_data.pop("password", None)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    if next_password is not None:
        validate_password_policy(next_password)
        current_user.hashed_password = hash_password(next_password)
    current_user.updated_at = datetime.utcnow()
    await current_user.save()
    return success_response(serialize_user(current_user), message="Profile updated")


@router.get("/me/bids")
async def get_my_bids(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    skip, safe_limit = get_pagination_params(page, limit)
    query = Bid.find(Bid.user_id == current_user.id)
    total = await query.count()
    bids = await query.sort([("placed_at", -1)]).skip(skip).limit(safe_limit).to_list()

    results = []
    for bid in bids:
        bid_data = serialize_bid(bid)
        auction = await Auction.get(str(bid.auction_id))
        bid_data["auction"] = (
            {
                "id": str(auction.id),
                "title": auction.title,
                "status": auction.status.value,
                "current_bid": auction.current_bid,
                "end_time": auction.end_time.isoformat(),
            }
            if auction
            else None
        )
        results.append(bid_data)

    return paginated_response(results, total=total, page=page, limit=safe_limit)


@router.get("/me/won")
async def get_my_won_auctions(current_user: User = Depends(get_current_user)):
    auctions = await Auction.find(
        Auction.status == AuctionStatus.COMPLETED,
        Auction.highest_bidder_id == current_user.id,
    ).to_list()
    return success_response([serialize_auction(auction) for auction in auctions])


@router.get("/me/watching")
async def get_my_watching(current_user: User = Depends(get_current_user)):
    if not current_user.watched_auction_ids:
        return success_response([])
    auctions = await Auction.find(
        {"_id": {"$in": current_user.watched_auction_ids}}
    ).to_list()
    return success_response([serialize_auction(auction) for auction in auctions])


@router.post("/me/add-money")
async def add_money(
    amount: float = Query(default=1000.0, ge=1.0),
    current_user: User = Depends(get_current_user),
):
    current_user.balance += amount
    current_user.updated_at = datetime.utcnow()
    await current_user.save()
    return success_response(
        {"balance": current_user.balance},
        message=f"${amount:,.2f} added to your wallet successfully."
    )
