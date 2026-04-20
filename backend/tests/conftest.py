from datetime import datetime, timedelta

import pytest
import pytest_asyncio
from fakeredis import aioredis as fakeredis_aioredis
from httpx import ASGITransport, AsyncClient
from mongomock_motor import AsyncMongoMockClient

from app.core.rate_limiter import (
    close_rate_limiter,
    init_rate_limiter,
    reset_rate_limit_state,
    set_rate_limiter_redis_client,
)
from app.database import init_db
from app.main import app
from app.models import AuditLog, Auction, AuctionStatus, Bid, Collection, RefreshToken, User
from app.services.auth_service import create_access_token, hash_password


@pytest_asyncio.fixture(autouse=True)
async def setup_test_db():
    client = AsyncMongoMockClient()
    await init_db(mongo_client=client, db_name="test_db")

    await User.find_all().delete()
    await Auction.find_all().delete()
    await Bid.find_all().delete()
    await Collection.find_all().delete()
    await RefreshToken.find_all().delete()
    await AuditLog.find_all().delete()
    yield


@pytest_asyncio.fixture(autouse=True)
async def setup_rate_limiter():
    fake_redis = fakeredis_aioredis.FakeRedis(decode_responses=True)
    set_rate_limiter_redis_client(fake_redis)
    await init_rate_limiter()
    await reset_rate_limit_state()
    yield
    await reset_rate_limit_state()
    await close_rate_limiter()
    set_rate_limiter_redis_client(None)


@pytest_asyncio.fixture
async def async_client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client


@pytest_asyncio.fixture
async def test_user() -> User:
    user = User(
        email="user@example.com",
        hashed_password=hash_password("Testpass123!"),
        full_name="Test User",
        is_admin=False,
    )
    await user.insert()
    return user


@pytest_asyncio.fixture
async def test_admin() -> User:
    user = User(
        email="admin@example.com",
        hashed_password=hash_password("Testpass123!"),
        full_name="Admin User",
        is_admin=True,
    )
    await user.insert()
    return user


@pytest_asyncio.fixture
async def auth_headers(test_user: User) -> dict[str, str]:
    token = create_access_token(str(test_user.id), test_user.is_admin)
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def admin_headers(test_admin: User) -> dict[str, str]:
    token = create_access_token(str(test_admin.id), test_admin.is_admin)
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def test_auction(test_admin: User) -> Auction:
    now = datetime.utcnow()
    auction = Auction(
        title="Live Auction",
        description="Live auction description",
        category="Fine Art",
        images=["https://example.com/image.jpg"],
        starting_price=1000.0,
        current_bid=1000.0,
        seller_id=test_admin.id,
        start_time=now - timedelta(hours=1),
        end_time=now + timedelta(hours=1),
        status=AuctionStatus.LIVE,
        min_increment=500.0,
    )
    await auction.insert()
    return auction
