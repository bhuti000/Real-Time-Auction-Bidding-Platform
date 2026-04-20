import socketio

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    logger=False,
)


class SocketManager:
    async def broadcast(self, room: str, event: str, data: dict):
        await sio.emit(event, data, room=room)

    async def emit_to_user(self, user_id: str, event: str, data: dict):
        await sio.emit(event, data, room=f"user:{user_id}")

    async def join_room(self, sid: str, room: str):
        await sio.enter_room(sid, room)

    async def leave_room(self, sid: str, room: str):
        await sio.leave_room(sid, room)


socket_manager = SocketManager()

