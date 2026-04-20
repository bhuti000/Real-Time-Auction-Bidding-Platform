from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.core.permissions import require_admin
from app.core.security import get_current_user, get_current_user_optional
from app.models import AuctionStatus, User
from app.schemas import AuctionCreate, AuctionStatusUpdate, AuctionUpdate
from app.services.auction_service import (
    create_auction,
    delete_auction,
    get_auction,
    get_watched_auctions,
    list_auctions,
    serialize_auction,
    toggle_reminder,
    toggle_watch,
    update_auction,
    update_status,
)
from app.utils.response import paginated_response, success_response

router = APIRouter()


@router.get("")
async def get_auctions(
    status: Optional[str] = None,
    category: Optional[str] = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    search: Optional[str] = None,
    is_featured: Optional[bool] = Query(default=None),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    auctions, total, safe_page, safe_limit = await list_auctions(
        status_filter=status,
        category=category,
        page=page,
        limit=limit,
        search=search,
        is_featured=is_featured,
    )
    return paginated_response(
        [await serialize_auction(auction, user=current_user) for auction in auctions],
        total=total,
        page=safe_page,
        limit=safe_limit,
    )


@router.get("/featured")
async def get_featured_auctions(current_user: Optional[User] = Depends(get_current_user_optional)):
    auctions, total, safe_page, safe_limit = await list_auctions(
        page=1,
        limit=50,
        is_featured=True,
    )
    return paginated_response(
        [await serialize_auction(auction, user=current_user) for auction in auctions],
        total=total,
        page=safe_page,
        limit=safe_limit,
    )


@router.get("/live")
async def get_live_auctions(current_user: Optional[User] = Depends(get_current_user_optional)):
    auctions, total, safe_page, safe_limit = await list_auctions(
        status_filter=AuctionStatus.LIVE.value, page=1, limit=50
    )
    return paginated_response(
        [await serialize_auction(auction, user=current_user) for auction in auctions],
        total=total,
        page=safe_page,
        limit=safe_limit,
    )


@router.get("/upcoming")
async def get_upcoming_auctions(current_user: Optional[User] = Depends(get_current_user_optional)):
    auctions, total, safe_page, safe_limit = await list_auctions(
        status_filter="SCHEDULED", page=1, limit=50
    )
    return paginated_response(
        [await serialize_auction(auction, user=current_user) for auction in auctions],
        total=total,
        page=safe_page,
        limit=safe_limit,
    )


@router.get("/completed")
async def get_completed_auctions():
    auctions, total, safe_page, safe_limit = await list_auctions(
        status_filter=AuctionStatus.COMPLETED.value,
        page=1,
        limit=100,
    )
    return paginated_response(
        [serialize_auction(auction) for auction in auctions],
        total=total,
        page=safe_page,
        limit=safe_limit,
    )


@router.get("/watched")
async def get_watched_auctions_endpoint(
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    auctions = await get_watched_auctions(current_user=current_user)
    return success_response(
        [await serialize_auction(auction, user=current_user) for auction in auctions],
        message="Watched auctions fetched",
    )


@router.get("/{auction_id}")
async def get_auction_detail(
    auction_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    auction = await get_auction(auction_id=auction_id, increment_view=True)
    return success_response(await serialize_auction(auction, user=current_user))


@router.post("")
async def create_auction_endpoint(
    payload: AuctionCreate, admin_user: User = Depends(require_admin)
):
    auction = await create_auction(payload=payload, current_user=admin_user)
    return success_response(await serialize_auction(auction, user=admin_user), message="Auction created")


@router.put("/{auction_id}")
async def update_auction_endpoint(
    auction_id: str,
    payload: AuctionUpdate,
    admin_user: User = Depends(require_admin),
):
    auction = await update_auction(auction_id=auction_id, payload=payload)
    return success_response(await serialize_auction(auction, user=admin_user), message="Auction updated")


@router.delete("/{auction_id}")
async def delete_auction_endpoint(auction_id: str, _: User = Depends(require_admin)):
    await delete_auction(auction_id=auction_id)
    return success_response({"id": auction_id}, message="Auction deleted")


@router.patch("/{auction_id}/status")
async def patch_auction_status(
    auction_id: str,
    payload: AuctionStatusUpdate,
    admin_user: User = Depends(require_admin),
):
    auction = await update_status(auction_id=auction_id, new_status=payload.status)
    return success_response(await serialize_auction(auction, user=admin_user), message="Auction status updated")


@router.post("/{auction_id}/watch")
async def toggle_watch_endpoint(
    auction_id: str,
    current_user: User = Depends(get_current_user),
):
    watching = await toggle_watch(auction_id=auction_id, current_user=current_user)
    return success_response(
        {"auction_id": auction_id, "watching": watching},
        message="Watch status updated",
    )


@router.post("/{auction_id}/reminder")
async def toggle_reminder_endpoint(
    auction_id: str,
    current_user: User = Depends(get_current_user),
):
    reminding = await toggle_reminder(auction_id=auction_id, current_user=current_user)
    return success_response(
        {"auction_id": auction_id, "reminding": reminding},
        message="Reminder status updated",
    )
