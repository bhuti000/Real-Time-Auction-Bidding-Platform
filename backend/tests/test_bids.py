import asyncio

import pytest

from app.models import Auction, AuctionStatus

pytestmark = pytest.mark.asyncio


async def test_bid_success(async_client, auth_headers, test_auction):
    response = await async_client.post(
        f"/api/auctions/{test_auction.id}/bids",
        json={"amount": 1600},
        headers=auth_headers,
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["success"] is True
    assert payload["data"]["amount"] == 1600

    updated = await Auction.get(str(test_auction.id))
    assert updated.current_bid == 1600


async def test_bid_too_low(async_client, auth_headers, test_auction):
    response = await async_client.post(
        f"/api/auctions/{test_auction.id}/bids",
        json={"amount": 1000},
        headers=auth_headers,
    )
    payload = response.json()

    assert response.status_code == 400
    assert payload["success"] is False
    assert "greater than current bid" in payload["error"]


async def test_bid_below_increment(async_client, auth_headers, test_auction):
    response = await async_client.post(
        f"/api/auctions/{test_auction.id}/bids",
        json={"amount": 1200},
        headers=auth_headers,
    )
    payload = response.json()

    assert response.status_code == 400
    assert payload["success"] is False
    assert "Minimum increment is" in payload["error"]


async def test_bid_on_expired_auction(async_client, auth_headers, test_auction):
    test_auction.status = AuctionStatus.COMPLETED
    await test_auction.save()

    response = await async_client.post(
        f"/api/auctions/{test_auction.id}/bids",
        json={"amount": 1600},
        headers=auth_headers,
    )
    payload = response.json()

    assert response.status_code == 400
    assert payload["success"] is False
    assert payload["error"] == "Auction is not live"


async def test_bid_unauthenticated(async_client, test_auction):
    response = await async_client.post(
        f"/api/auctions/{test_auction.id}/bids",
        json={"amount": 1600},
    )
    payload = response.json()

    assert response.status_code == 401
    assert payload["success"] is False


async def test_concurrent_bids(async_client, auth_headers, test_auction):
    async def submit_bid():
        return await async_client.post(
            f"/api/auctions/{test_auction.id}/bids",
            json={"amount": 1600},
            headers=auth_headers,
        )

    first, second = await asyncio.gather(submit_bid(), submit_bid())
    statuses = sorted([first.status_code, second.status_code])

    assert statuses == [200, 400]

    updated = await Auction.get(str(test_auction.id))
    assert updated.current_bid == 1600

