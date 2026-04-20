from contextlib import asynccontextmanager

import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.core.error_handlers import register_error_handlers
from app.core.rate_limiter import close_rate_limiter, init_rate_limiter
from app.database import close_db, init_db
from app.routes import admin, auctions, auth, bids, collections, uploads, users
from app.services.scheduler_service import start_scheduler, stop_scheduler
from app.websocket import handlers  # noqa: F401 - registers Socket.IO event handlers
from app.websocket.socket_manager import sio


@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_db()
    await init_rate_limiter()
    start_scheduler()
    yield
    stop_scheduler()
    await close_rate_limiter()
    await close_db()


app = FastAPI(title="The Curated Exchange API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

register_error_handlers(app)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(auctions.router, prefix="/api/auctions", tags=["auctions"])
app.include_router(bids.router, prefix="/api/auctions", tags=["bids"])
app.include_router(collections.router, prefix="/api/collections", tags=["collections"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(uploads.router, prefix="/api/uploads", tags=["uploads"])


@app.get("/health")
async def health_check():
    return {"success": True, "data": {"status": "ok"}}


socket_app = socketio.ASGIApp(sio, app)
