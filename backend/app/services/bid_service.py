from datetime import datetime
from typing import Any, Optional

from beanie import PydanticObjectId
from fastapi import HTTPException

from app.models import AuditLog, Auction, AuctionStatus, Bid, User
from app.websocket.socket_manager import socket_manager


def serialize_bid(bid: Bid, bidder_name: Optional[str] = None) -> dict[str, Any]:
    user_id = str(bid.user_id)
    return {
        "id": str(bid.id),
        "auction_id": str(bid.auction_id),
        "user_id": user_id,
        "amount": bid.amount,
        "placed_at": bid.placed_at.isoformat(),
        "is_winning": bid.is_winning,
        "bidder_name": bidder_name or f"Bidder {user_id[-4:]}",
    }


async def place_bid(auction_id: str, amount: float, current_user: User) -> Bid:
    # Step 1: Fetch auction
    auction = await Auction.get(auction_id)
    if not auction:
        raise HTTPException(404, "Auction not found")

    # Step 2: Check auction is LIVE (server time — never trust client)
    if auction.status != AuctionStatus.LIVE:
        raise HTTPException(400, "Auction is not live")
    if datetime.utcnow() > auction.end_time:
        raise HTTPException(400, "Auction has ended")

    # Step 3: Validate amount (must be strictly greater)
    if amount <= auction.current_bid:
        raise HTTPException(
            400, f"Bid must be greater than current bid of {auction.current_bid}"
        )

    # Step 4: Validate minimum increment
    # Enforce 10.0 minimum regardless of DB value as per user request
    required_increment = 10.0
    if amount < auction.current_bid + required_increment:
        raise HTTPException(400, f"Minimum increment is {required_increment}")

    # Step 4.5: Payment Simulation (Check Balance First)
    if current_user.balance < amount:
        print(f"[BID_FAILED] Insufficient balance for user {current_user.email}. Has {current_user.balance}, needs {amount}")
        raise HTTPException(
            400,
            f"Insufficient balance. You have ${current_user.balance:,.2f} but need ${amount:,.2f}."
        )

    # Step 5: ATOMIC MongoDB update (race condition safe)
    # Only updates if current_bid is STILL less than our amount
    result = await Auction.find_one_and_update(
        {
            "_id": PydanticObjectId(auction_id),
            "current_bid": {"$lt": amount},
            "status": "LIVE",
        },
        {
            "$set": {
                "current_bid": amount,
                "highest_bidder_id": current_user.id,
                "updated_at": datetime.utcnow(),
            },
            "$inc": {"bid_count": 1},
        },
        return_document=True,
    )

    # If result is None, a concurrent bid beat us
    if result is None:
        print(f"[BID_FAILED] User {current_user.email} was outbid simultaneously for auction {auction_id}")
        raise HTTPException(
            400, "Bid was outbid by another user simultaneously. Please try again."
        )

    # Step 5.5: Success! Perform the simulated transaction
    # Refund previous highest bidder if exists
    if auction.highest_bidder_id:
        prev_bidder = await User.get(auction.highest_bidder_id)
        if prev_bidder:
            prev_bidder.balance += auction.current_bid
            await prev_bidder.save()
            print(f"[BID_REFUND] Refunded ${auction.current_bid} to {prev_bidder.email}")

    # Deduct from current user
    current_user.balance -= amount
    await current_user.save()
    print(f"[BID_SUCCESS] Deducted ${amount} from {current_user.email}. New balance: {current_user.balance}")

    # Step 6: Save bid document (audit trail)
    bid = Bid(
        auction_id=PydanticObjectId(auction_id),
        user_id=current_user.id,
        amount=amount,
    )
    await bid.save()

    # Step 7: Write audit log
    await AuditLog(
        action="BID_PLACED",
        actor_id=current_user.id,
        auction_id=PydanticObjectId(auction_id),
        metadata={"amount": amount, "previous_bid": auction.current_bid},
    ).save()

    # Step 8: Broadcast to all connected WebSocket clients in this auction room
    await socket_manager.broadcast(
        room=f"auction:{auction_id}",
        event="BID_PLACED",
        data={
            "auction_id": auction_id,
            "auction_title": result.title,
            "amount": amount,
            "bidder_id": str(current_user.id),
            "bidder_name": current_user.full_name,
            "bid_count": result.bid_count,
            "timestamp": datetime.utcnow().isoformat(),
        },
    )

    # Also broadcast to admin room for live monitoring
    await socket_manager.broadcast(
        room="admin",
        event="BID_PLACED",
        data={
            "auction_id": auction_id,
            "auction_title": result.title,
            "amount": amount,
            "bidder_id": str(current_user.id),
            "bidder_name": current_user.full_name,
            "bid_count": result.bid_count,
            "timestamp": datetime.utcnow().isoformat(),
        },
    )

    return bid


async def get_bid_history(
    auction_id: str, page: int = 1, limit: int = 20
) -> tuple[list[dict[str, Any]], int, int, int]:
    safe_page = page if page > 0 else 1
    safe_limit = min(max(limit, 1), 100)
    skip = (safe_page - 1) * safe_limit

    query = Bid.find(Bid.auction_id == PydanticObjectId(auction_id))
    total = await query.count()
    bids = await query.sort([("placed_at", -1)]).skip(skip).limit(safe_limit).to_list()

    # Enrich with user names
    user_ids = list({bid.user_id for bid in bids})
    users = await User.find({"_id": {"$in": user_ids}}).to_list()
    user_map = {u.id: u.full_name for u in users}

    serialized_bids = [
        serialize_bid(bid, bidder_name=user_map.get(bid.user_id))
        for bid in bids
    ]

    return serialized_bids, total, safe_page, safe_limit


async def list_all_bids(
    page: int = 1, limit: int = 50
) -> tuple[list[dict[str, Any]], int, int, int]:
    safe_page = page if page > 0 else 1
    safe_limit = min(max(limit, 1), 100)
    skip = (safe_page - 1) * safe_limit

    total = await Bid.find_all().count()
    bids = await Bid.find_all().sort([("placed_at", -1)]).skip(skip).limit(safe_limit).to_list()

    # Enrich with auction titles and user names
    auction_ids = {bid.auction_id for bid in bids}
    user_ids = {bid.user_id for bid in bids}
    
    auctions = await Auction.find({"_id": {"$in": list(auction_ids)}}).to_list()
    users = await User.find({"_id": {"$in": list(user_ids)}}).to_list()
    
    auction_map = {str(a.id): a.title for a in auctions}
    user_map = {u.id: u.full_name for u in users}

    enriched_bids = []
    for bid in bids:
        data = serialize_bid(bid, bidder_name=user_map.get(bid.user_id))
        data["auction_title"] = auction_map.get(str(bid.auction_id), "Unknown Auction")
        enriched_bids.append(data)

    return enriched_bids, total, safe_page, safe_limit

