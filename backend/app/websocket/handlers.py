from collections import defaultdict

from app.websocket.events import USER_JOINED
from app.websocket.socket_manager import sio, socket_manager

room_users: dict[str, set[str]] = defaultdict(set)
sid_rooms: dict[str, set[str]] = defaultdict(set)


@sio.event
async def connect(sid, environ, auth):
    return True


@sio.event
async def authenticate(sid, data):
    user_id = data.get("user_id") if isinstance(data, dict) else data
    if user_id:
        room = f"user:{user_id}"
        await socket_manager.join_room(sid, room)
        sid_rooms[sid].add(room)
        print(f"SID {sid} authenticated as user: {user_id}")
        return True
    return False


@sio.event
async def join_auction(sid, data):
    auction_id = data.get("auction_id") if isinstance(data, dict) else None
    if not auction_id:
        return

    room = f"auction:{auction_id}"
    await socket_manager.join_room(sid=sid, room=room)
    room_users[room].add(sid)
    sid_rooms[sid].add(room)
    print(f"SID {sid} joined auction room: {room}")

    await sio.emit(
        USER_JOINED,
        {"auction_id": auction_id, "user_count": len(room_users[room])},
        room=room,
    )


@sio.event
async def join(sid, data):
    room = data.get("room")
    if room:
        await socket_manager.join_room(sid=sid, room=room)
        sid_rooms[sid].add(room)
        print(f"SID {sid} joined generic room: {room}")


@sio.event
async def leave_auction(sid, data):
    auction_id = data.get("auction_id") if isinstance(data, dict) else None
    if not auction_id:
        return

    room = f"auction:{auction_id}"
    await socket_manager.leave_room(sid=sid, room=room)

    if room in room_users and sid in room_users[room]:
        room_users[room].discard(sid)
    if sid in sid_rooms and room in sid_rooms[sid]:
        sid_rooms[sid].discard(room)


@sio.event
async def disconnect(sid):
    rooms = list(sid_rooms.get(sid, set()))
    for room in rooms:
        await socket_manager.leave_room(sid=sid, room=room)
        room_users[room].discard(sid)
        if not room_users[room]:
            room_users.pop(room, None)
    sid_rooms.pop(sid, None)

