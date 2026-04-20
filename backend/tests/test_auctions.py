from datetime import datetime, timedelta

import pytest

from app.models import Auction, AuctionStatus
from app.services.scheduler_service import transition_auctions

pytestmark = pytest.mark.asyncio


async def test_get_live_auctions(async_client, test_auction, test_admin):
    now = datetime.utcnow()
    scheduled = Auction(
        title="Scheduled Auction",
        description="Scheduled item",
        category="Photography",
        images=[],
        starting_price=1500,
        current_bid=1500,
        seller_id=test_admin.id,
        start_time=now + timedelta(hours=2),
        end_time=now + timedelta(hours=4),
        status=AuctionStatus.SCHEDULED,
    )
    await scheduled.insert()

    response = await async_client.get("/api/auctions/live")
    payload = response.json()

    assert response.status_code == 200
    assert payload["success"] is True
    assert all(item["status"] == "LIVE" for item in payload["data"])


async def test_get_auction_detail(async_client, test_auction):
    response = await async_client.get(f"/api/auctions/{test_auction.id}")
    payload = response.json()

    assert response.status_code == 200
    assert payload["success"] is True
    assert payload["data"]["id"] == str(test_auction.id)
    assert payload["data"]["bid_count"] == test_auction.bid_count


async def test_create_auction_admin(async_client, admin_headers, test_admin):
    now = datetime.utcnow()
    response = await async_client.post(
        "/api/auctions",
        headers=admin_headers,
        json={
            "title": "Admin Created Auction",
            "description": "Auction created by admin",
            "category": "Fine Art",
            "images": ["https://example.com/cover.jpg"],
            "starting_price": 2000,
            "start_time": (now + timedelta(hours=1)).isoformat(),
            "end_time": (now + timedelta(hours=2)).isoformat(),
            "status": "SCHEDULED",
            "seller_id": str(test_admin.id),
        },
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["success"] is True
    assert payload["data"]["title"] == "Admin Created Auction"


async def test_create_auction_non_admin(async_client, auth_headers):
    now = datetime.utcnow()
    response = await async_client.post(
        "/api/auctions",
        headers=auth_headers,
        json={
            "title": "Should Fail",
            "description": "Only admin can create",
            "category": "Fine Art",
            "images": [],
            "starting_price": 2000,
            "start_time": (now + timedelta(hours=1)).isoformat(),
            "end_time": (now + timedelta(hours=2)).isoformat(),
            "status": "SCHEDULED",
        },
    )
    payload = response.json()

    assert response.status_code == 403
    assert payload["success"] is False
    assert payload["error"] == "Admin access required"


async def test_auction_status_transition(test_admin):
    now = datetime.utcnow()
    auction = Auction(
        title="Transition Auction",
        description="Transition test",
        category="Fine Art",
        images=[],
        starting_price=1000,
        current_bid=1000,
        seller_id=test_admin.id,
        start_time=now - timedelta(minutes=5),
        end_time=now + timedelta(hours=1),
        status=AuctionStatus.SCHEDULED,
    )
    await auction.insert()

    await transition_auctions()
    updated = await Auction.get(str(auction.id))
    assert updated.status == AuctionStatus.LIVE

