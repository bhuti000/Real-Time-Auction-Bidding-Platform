from fastapi import APIRouter, Depends

from app.core.permissions import require_admin
from app.core.security import get_current_user
from app.models import User
from app.schemas import CollectionAccessRequest, CollectionCreate, CollectionUpdate
from app.services.collection_service import (
    create_collection,
    get_collection,
    list_collections,
    request_collection_access,
    serialize_collection,
    update_collection,
)
from app.utils.response import success_response

router = APIRouter()


@router.get("")
async def get_collections():
    collections = await list_collections(private_only=False)
    return success_response([serialize_collection(collection) for collection in collections])


@router.get("/private")
async def get_private_collections():
    collections = await list_collections(private_only=True)
    return success_response([serialize_collection(collection) for collection in collections])


@router.get("/{collection_id}")
async def get_collection_detail(collection_id: str):
    collection = await get_collection(collection_id)
    return success_response(serialize_collection(collection))


@router.post("/{collection_id}/request")
async def request_access(
    collection_id: str,
    payload: CollectionAccessRequest,
    current_user: User = Depends(get_current_user),
):
    await request_collection_access(
        collection_id=collection_id,
        message=payload.message,
        current_user=current_user,
    )
    return success_response(
        {"collection_id": collection_id},
        message="Access request submitted",
    )


@router.post("")
async def create_collection_endpoint(
    payload: CollectionCreate, _: User = Depends(require_admin)
):
    collection = await create_collection(payload)
    return success_response(serialize_collection(collection), message="Collection created")


@router.put("/{collection_id}")
async def update_collection_endpoint(
    collection_id: str,
    payload: CollectionUpdate,
    _: User = Depends(require_admin),
):
    collection = await update_collection(collection_id=collection_id, payload=payload)
    return success_response(serialize_collection(collection), message="Collection updated")

