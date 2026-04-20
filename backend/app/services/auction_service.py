from datetime import datetime
from typing import Any, Optional

from beanie import PydanticObjectId
from fastapi import HTTPException, status

from app.models import Auction, AuctionStatus, User
from app.schemas import AuctionCreate, AuctionUpdate
from app.utils.pagination import get_pagination_params


async def serialize_auction(auction: Auction, user: Optional[User] = None) -> dict[str, Any]:
    from app.models import Reminder
    
    data = {
        "id": str(auction.id),
        "title": auction.title,
        "description": auction.description,
        "category": auction.category,
        "images": auction.images,
        "starting_price": auction.starting_price,
        "current_bid": auction.current_bid,
        "highest_bidder_id": str(auction.highest_bidder_id)
        if auction.highest_bidder_id
        else None,
        "seller_id": str(auction.seller_id),
        "start_time": auction.start_time.isoformat(),
        "end_time": auction.end_time.isoformat(),
        "status": auction.status.value,
        "min_increment": auction.min_increment,
        "estimate_low": auction.estimate_low,
        "estimate_high": auction.estimate_high,
        "medium": auction.medium,
        "dimensions": auction.dimensions,
        "provenance": auction.provenance,
        "condition": auction.condition,
        "artist_name": auction.artist_name,
        "year": auction.year,
        "is_featured": auction.is_featured,
        "view_count": auction.view_count,
        "bid_count": auction.bid_count,
        "created_at": auction.created_at.isoformat(),
        "updated_at": auction.updated_at.isoformat(),
        "is_watched": False,
        "is_reminding": False,
    }

    if user:
        # Check wishlist/watch (user object has watched_auction_ids list of ObjectIds)
        data["is_watched"] = str(auction.id) in [str(aid) for aid in user.watched_auction_ids]
        # Check reminders
        reminder = await Reminder.find_one(
            Reminder.user_id == str(user.id), 
            Reminder.auction_id == str(auction.id)
        )
        data["is_reminding"] = reminder is not None

    return data


def _parse_status(status_value: Optional[str]) -> Optional[AuctionStatus]:
    if not status_value:
        return None
    try:
        return AuctionStatus(status_value.upper())
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid auction status"
        ) from exc


async def list_auctions(
    status_filter: Optional[str] = None,
    category: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
    is_featured: Optional[bool] = None,
) -> tuple[list[Auction], int, int, int]:
    filters: dict[str, Any] = {}
    parsed_status = _parse_status(status_filter)
    if parsed_status:
        filters["status"] = parsed_status
    if category:
        filters["category"] = category
    if is_featured is not None:
        filters["is_featured"] = is_featured
    if search:
        filters["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
        ]

    skip, safe_limit = get_pagination_params(page, limit)
    query = Auction.find(filters)
    total = await query.count()
    auctions = (
        await query.sort([("created_at", -1)]).skip(skip).limit(safe_limit).to_list()
    )
    return auctions, total, page, safe_limit


async def get_auction(auction_id: str, increment_view: bool = False) -> Auction:
    auction = await Auction.get(auction_id)
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    if increment_view:
        auction.view_count += 1
        auction.updated_at = datetime.utcnow()
        await auction.save()
    return auction


async def create_auction(payload: AuctionCreate, current_user: User) -> Auction:
    if payload.end_time <= payload.start_time:
        raise HTTPException(status_code=400, detail="end_time must be after start_time")

    seller_id = (
        PydanticObjectId(payload.seller_id) if payload.seller_id else current_user.id
    )
    current_bid = payload.current_bid or payload.starting_price

    auction = Auction(
        **payload.model_dump(exclude={"seller_id", "current_bid"}),
        seller_id=seller_id,
        current_bid=current_bid,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    await auction.insert()
    return auction


async def update_auction(auction_id: str, payload: AuctionUpdate) -> Auction:
    auction = await get_auction(auction_id)
    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        return auction

    if "seller_id" in update_data and update_data["seller_id"]:
        update_data["seller_id"] = PydanticObjectId(update_data["seller_id"])

    next_start = update_data.get("start_time", auction.start_time)
    next_end = update_data.get("end_time", auction.end_time)
    if next_end <= next_start:
        raise HTTPException(status_code=400, detail="end_time must be after start_time")

    for field, value in update_data.items():
        setattr(auction, field, value)
    auction.updated_at = datetime.utcnow()
    await auction.save()
    return auction


async def delete_auction(auction_id: str) -> None:
    auction = await get_auction(auction_id)
    await auction.delete()


async def update_status(auction_id: str, new_status: AuctionStatus) -> Auction:
    auction = await get_auction(auction_id)
    auction.status = new_status
    auction.updated_at = datetime.utcnow()

    # If manually marking as completed (sold), identify the winning bid
    if new_status == AuctionStatus.COMPLETED and auction.highest_bidder_id:
        from app.models import Bid
        await Bid.find_one_and_update(
            {"auction_id": auction.id, "user_id": auction.highest_bidder_id},
            {"$set": {"is_winning": True}},
            sort=[("amount", -1)],
        )

    await auction.save()
    return auction


async def get_watched_auctions(current_user: User) -> list[Auction]:
    watched_ids = current_user.watched_auction_ids
    if not watched_ids:
        return []
    return await Auction.find({"_id": {"$in": watched_ids}}).to_list()


async def toggle_watch(auction_id: str, current_user: User) -> bool:
    auction = await get_auction(auction_id)
    auction_object_id = PydanticObjectId(str(auction.id))

    if auction_object_id in current_user.watched_auction_ids:
        current_user.watched_auction_ids.remove(auction_object_id)
        watching = False
    else:
        current_user.watched_auction_ids.append(auction_object_id)
        watching = True

    current_user.updated_at = datetime.utcnow()
    await current_user.save()
    return watching


async def toggle_reminder(auction_id: str, current_user: User) -> bool:
    from app.models import Reminder
    auction = await get_auction(auction_id)
    
    existing = await Reminder.find_one(
        Reminder.user_id == str(current_user.id),
        Reminder.auction_id == str(auction.id)
    )
    
    if existing:
        await existing.delete()
        return False
    else:
        new_reminder = Reminder(
            user_id=str(current_user.id),
            auction_id=str(auction.id)
        )
        await new_reminder.insert()
        return True
