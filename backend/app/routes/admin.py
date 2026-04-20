from datetime import datetime, time
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.permissions import require_admin
from app.models import AuditLog, Auction, AuctionStatus, Bid, User
from app.services.auth_service import serialize_user
from app.services.bid_service import list_all_bids
from app.utils.pagination import get_pagination_params
from app.utils.response import paginated_response, success_response

router = APIRouter()


@router.get("/audit-logs")
async def get_audit_logs(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    action_filter: Optional[str] = None,
    _: User = Depends(require_admin),
):
    skip, safe_limit = get_pagination_params(page, limit)
    query = AuditLog.find(
        {"action": action_filter} if action_filter else {}
    )
    total = await query.count()
    logs = await query.sort([("timestamp", -1)]).skip(skip).limit(safe_limit).to_list()

    data = [
        {
            "id": str(log.id),
            "action": log.action,
            "actor_id": str(log.actor_id) if log.actor_id else None,
            "auction_id": str(log.auction_id) if log.auction_id else None,
            "metadata": log.metadata,
            "timestamp": log.timestamp.isoformat(),
        }
        for log in logs
    ]
    return paginated_response(data, total=total, page=page, limit=safe_limit)


@router.get("/users")
async def get_users(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = None,
    _: User = Depends(require_admin),
):
    skip, safe_limit = get_pagination_params(page, limit)
    filters = {}
    if search:
        filters = {
            "$or": [
                {"email": {"$regex": search, "$options": "i"}},
                {"full_name": {"$regex": search, "$options": "i"}},
            ]
        }

    query = User.find(filters)
    total = await query.count()
    users = await query.sort([("created_at", -1)]).skip(skip).limit(safe_limit).to_list()
    return paginated_response(
        [serialize_user(user) for user in users],
        total=total,
        page=page,
        limit=safe_limit,
    )


@router.patch("/users/{user_id}/toggle-admin")
async def toggle_admin(user_id: str, current_user: User = Depends(require_admin)):
    target_user = await User.get(user_id)
    if not target_user:
        return success_response(None, message="User not found")

    # 1. Prevent self-lockout
    if str(target_user.id) == str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot remove your own admin status to prevent lockout."
        )

    # 2. Ensure at least one admin remains in the system
    if target_user.is_admin:
        admin_count = await User.find(User.is_admin == True).count()
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one admin must remain in the system."
            )

    target_user.is_admin = not target_user.is_admin
    target_user.updated_at = datetime.utcnow()
    await target_user.save()
    return success_response(serialize_user(target_user), message="Admin status updated")


@router.get("/stats")
async def get_stats(_: User = Depends(require_admin)):
    total_users = await User.find_all().count()
    live_auctions = await Auction.find(Auction.status == AuctionStatus.LIVE).count()

    now = datetime.utcnow()
    day_start = datetime.combine(now.date(), time.min)
    total_bids_today = await Bid.find(Bid.placed_at >= day_start).count()

    completed = await Auction.find(
        Auction.status == AuctionStatus.COMPLETED,
        Auction.highest_bidder_id != None,  # noqa: E711
    ).to_list()
    revenue = sum(auction.current_bid for auction in completed)

    return success_response(
        {
            "total_users": total_users,
            "live_auctions": live_auctions,
            "total_bids_today": total_bids_today,
            "revenue": revenue,
        }
    )


@router.get("/bids")
async def get_all_bids(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=100),
    _: User = Depends(require_admin),
):
    bids, total, safe_page, safe_limit = await list_all_bids(page=page, limit=limit)
    return paginated_response(
        bids,
        total=total,
        page=safe_page,
        limit=safe_limit,
    )

