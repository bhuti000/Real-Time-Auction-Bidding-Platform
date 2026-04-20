from datetime import datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.models import AuditLog, Auction, AuctionStatus, Bid
from app.websocket.socket_manager import socket_manager

scheduler = AsyncIOScheduler(timezone="UTC")


async def transition_auctions() -> None:
    now = datetime.utcnow()
    # Log to verify scheduler is alive
    print(f"DEBUG: [{now.isoformat()}] Running auction transition check...")

    # SCHEDULED → LIVE
    to_live = await Auction.find(
        Auction.status == AuctionStatus.SCHEDULED,
        Auction.start_time <= now,
    ).to_list()

    if to_live:
        print(f"DEBUG: Found {len(to_live)} auctions transitioning to LIVE")

    for auction in to_live:
        auction.status = AuctionStatus.LIVE
        await auction.save()
        
        # 1. Global Alert for everyone
        await socket_manager.broadcast(
            room="global",
            event="NOTIFICATION",
            data={
                "type": "auction_live_global",
                "title": "New Auction Live!",
                "message": f"'{auction.title}' has just started!",
                "auction_id": str(auction.id)
            }
        )

        # 2. Specific reminders
        from app.models import Reminder
        reminders = await Reminder.find(Reminder.auction_id == str(auction.id)).to_list()
        print(f"DEBUG: Sending notifications to {len(reminders)} subscribers for auction {auction.id}")
        
        for reminder in reminders:
            try:
                await socket_manager.emit_to_user(
                    user_id=reminder.user_id,
                    event="NOTIFICATION",
                    data={
                        "type": "auction_live",
                        "title": "Auction is Live!",
                        "message": f"'{auction.title}' is now open for bidding.",
                        "auction_id": str(auction.id)
                    }
                )
                await reminder.delete()
            except Exception as e:
                print(f"ERROR: Failed to notify user {reminder.user_id}: {str(e)}")

        await AuditLog(action="AUCTION_STARTED", auction_id=auction.id).save()

    # LIVE → COMPLETED
    to_complete = await Auction.find(
        Auction.status == AuctionStatus.LIVE,
        Auction.end_time <= now,
    ).to_list()

    for auction in to_complete:
        auction.status = AuctionStatus.COMPLETED
        await auction.save()

        # Mark winning bid
        if auction.highest_bidder_id:
            await Bid.find_one_and_update(
                {"auction_id": auction.id, "user_id": auction.highest_bidder_id},
                {"$set": {"is_winning": True}},
                sort=[("amount", -1)],
            )

        await socket_manager.broadcast(
            room=f"auction:{auction.id}",
            event="AUCTION_ENDED",
            data={
                "auction_id": str(auction.id),
                "winning_bid": auction.current_bid,
                "winner_id": str(auction.highest_bidder_id)
                if auction.highest_bidder_id
                else None,
            },
        )
        await AuditLog(action="AUCTION_ENDED", auction_id=auction.id).save()


def start_scheduler() -> None:
    if scheduler.running:
        return
    scheduler.add_job(transition_auctions, "interval", seconds=30, id="auction-transition")
    scheduler.start()


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)

