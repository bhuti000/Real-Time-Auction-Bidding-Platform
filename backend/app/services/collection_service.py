from datetime import datetime
from typing import Any

from beanie import PydanticObjectId
from fastapi import HTTPException

from app.models import AuditLog, Collection, User
from app.schemas import CollectionCreate, CollectionUpdate


def serialize_collection(collection: Collection) -> dict[str, Any]:
    return {
        "id": str(collection.id),
        "title": collection.title,
        "subtitle": collection.subtitle,
        "description": collection.description,
        "cover_image": collection.cover_image,
        "total_lots": collection.total_lots,
        "est_value_low": collection.est_value_low,
        "est_value_high": collection.est_value_high,
        "status": collection.status.value,
        "auction_ids": [str(auction_id) for auction_id in collection.auction_ids],
        "is_private": collection.is_private,
        "created_at": collection.created_at.isoformat(),
    }


async def list_collections(private_only: bool = False) -> list[Collection]:
    if private_only:
        return await Collection.find(Collection.is_private == True).to_list()  # noqa: E712
    return await Collection.find_all().to_list()


async def get_collection(collection_id: str) -> Collection:
    collection = await Collection.get(collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    return collection


async def create_collection(payload: CollectionCreate) -> Collection:
    collection = Collection(
        **payload.model_dump(exclude={"auction_ids"}),
        auction_ids=[PydanticObjectId(auction_id) for auction_id in payload.auction_ids],
        created_at=datetime.utcnow(),
    )
    await collection.insert()
    return collection


async def update_collection(collection_id: str, payload: CollectionUpdate) -> Collection:
    collection = await get_collection(collection_id)
    update_data = payload.model_dump(exclude_unset=True)

    if "auction_ids" in update_data and update_data["auction_ids"] is not None:
        update_data["auction_ids"] = [
            PydanticObjectId(auction_id) for auction_id in update_data["auction_ids"]
        ]

    for field, value in update_data.items():
        setattr(collection, field, value)
    await collection.save()
    return collection


async def request_collection_access(
    collection_id: str, message: str, current_user: User
) -> None:
    collection = await get_collection(collection_id)
    await AuditLog(
        action="COLLECTION_ACCESS_REQUESTED",
        actor_id=current_user.id,
        metadata={
            "collection_id": str(collection.id),
            "collection_title": collection.title,
            "message": message,
        },
    ).save()
