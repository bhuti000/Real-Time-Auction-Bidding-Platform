import os
import uuid
from typing import List

import aiofiles
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.core.permissions import require_admin
from app.models import User
from app.utils.response import success_response

router = APIRouter()

UPLOAD_DIR = "uploads"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


@router.post("")
async def upload_image(
    file: UploadFile = File(...),
    _: User = Depends(require_admin)
):
    # Validate extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file extension. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Ensure directory exists
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # Generate unique filename
    filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    # Read and validate size while saving
    try:
        async with aiofiles.open(file_path, "wb") as out_file:
            size = 0
            while content := await file.read(1024 * 1024):  # Read 1MB chunks
                size += len(content)
                if size > MAX_FILE_SIZE:
                    # Cleanup on failure
                    await out_file.close()
                    os.remove(file_path)
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="File too large. Max 5MB allowed."
                    )
                await out_file.write(content)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not save file: {str(e)}"
        )

    # Return the relative URL (assuming app mounts /uploads)
    file_url = f"/uploads/{filename}"
    return success_response({"url": file_url}, message="Image uploaded successfully")
