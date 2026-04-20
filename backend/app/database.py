from typing import Optional

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import settings
from app.models import AuditLog, Auction, Bid, Collection, RefreshToken, User

_client: Optional[AsyncIOMotorClient] = None
_db: Optional[AsyncIOMotorDatabase] = None


async def init_db(
    mongo_client: Optional[AsyncIOMotorClient] = None,
    db_name: Optional[str] = None,
) -> AsyncIOMotorDatabase:
    global _client, _db

    _client = mongo_client or AsyncIOMotorClient(settings.mongo_url)
    _db_name = db_name or settings.mongo_db_name
    _db = _client[_db_name]

    from app.models import AuditLog, Auction, Bid, Collection, RefreshToken, User, Reminder
    await init_beanie(
        database=_db,
        document_models=[User, Auction, Bid, Collection, AuditLog, RefreshToken, Reminder],
    )
    return _db


def get_database() -> AsyncIOMotorDatabase:
    if _db is None:
        raise RuntimeError("Database has not been initialized.")
    return _db


async def close_db() -> None:
    global _client, _db
    if _client is not None:
        _client.close()
    _client = None
    _db = None
