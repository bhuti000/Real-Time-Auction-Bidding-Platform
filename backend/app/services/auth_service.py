import re
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any
from uuid import uuid4

from beanie import PydanticObjectId
from fastapi import HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings
from app.models import AuditLog, RefreshToken, User
from app.schemas import UserRegister

ALGORITHM = "HS256"
ACCESS_TOKEN_TYPE = "access"
REFRESH_TOKEN_TYPE = "refresh"
_PASSWORD_SPECIAL_RE = re.compile(r"[^A-Za-z0-9]")

bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@dataclass
class TokenResult:
    token: str
    jti: str
    expires_at: datetime
    family_id: str | None = None


def _utcnow() -> datetime:
    return datetime.utcnow()


def _is_admin_hint_enabled() -> bool:
    return settings.allow_email_admin_hint and settings.environment.lower() == "development"


def _to_object_id(user_id: str) -> PydanticObjectId:
    try:
        return PydanticObjectId(user_id)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token subject",
        ) from exc


def validate_password_policy(password: str) -> None:
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Password must be at least 8 characters and include uppercase, lowercase, "
                "number, and special character."
            ),
        )
    if password.lower() == password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Password must be at least 8 characters and include uppercase, lowercase, "
                "number, and special character."
            ),
        )
    if password.upper() == password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Password must be at least 8 characters and include uppercase, lowercase, "
                "number, and special character."
            ),
        )
    if not any(char.isdigit() for char in password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Password must be at least 8 characters and include uppercase, lowercase, "
                "number, and special character."
            ),
        )
    if not _PASSWORD_SPECIAL_RE.search(password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Password must be at least 8 characters and include uppercase, lowercase, "
                "number, and special character."
            ),
        )


def hash_password(password: str) -> str:
    return bcrypt_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt_context.verify(plain, hashed)


def serialize_user(user: User) -> dict[str, Any]:
    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "is_admin": user.is_admin,
        "is_verified": user.is_verified,
        "avatar_url": user.avatar_url,
        "balance": user.balance,
        "watched_auction_ids": [str(auction_id) for auction_id in user.watched_auction_ids],
        "created_at": user.created_at.isoformat(),
        "updated_at": user.updated_at.isoformat(),
    }


def _encode_token(payload: dict[str, Any], secret: str, expires_delta: timedelta) -> TokenResult:
    now = _utcnow()
    exp = now + expires_delta
    jti = payload.get("jti") or str(uuid4())
    full_payload = {
        **payload,
        "jti": jti,
        "iat": int(now.timestamp()),
        "exp": exp,
    }
    token = jwt.encode(full_payload, secret, algorithm=ALGORITHM)
    return TokenResult(token=token, jti=jti, expires_at=exp, family_id=payload.get("family_id"))


def build_access_token(user_id: str, is_admin: bool) -> TokenResult:
    return _encode_token(
        payload={
            "type": ACCESS_TOKEN_TYPE,
            "sub": user_id,
            "is_admin": is_admin,
        },
        secret=settings.jwt_secret,
        expires_delta=timedelta(minutes=settings.jwt_expire_minutes),
    )


def build_refresh_token(user_id: str, family_id: str | None = None) -> TokenResult:
    resolved_family_id = family_id or str(uuid4())
    return _encode_token(
        payload={
            "type": REFRESH_TOKEN_TYPE,
            "sub": user_id,
            "family_id": resolved_family_id,
        },
        secret=settings.jwt_refresh_secret,
        expires_delta=timedelta(days=settings.jwt_refresh_expire_days),
    )


def create_access_token(user_id: str, is_admin: bool) -> str:
    return build_access_token(user_id, is_admin).token


def _decode_token(token: str, secret: str, expected_type: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(token, secret, algorithms=[ALGORITHM])
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc

    if payload.get("type") != expected_type:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    return payload


def decode_access_token(token: str) -> dict[str, Any]:
    return _decode_token(token, settings.jwt_secret, ACCESS_TOKEN_TYPE)


def decode_refresh_token(token: str) -> dict[str, Any]:
    return _decode_token(token, settings.jwt_refresh_secret, REFRESH_TOKEN_TYPE)


def decode_token(token: str) -> dict[str, Any]:
    return decode_access_token(token)


async def register_user(payload: UserRegister) -> User:
    existing = await User.find_one(User.email == payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    validate_password_policy(payload.password)

    is_admin_hint_applied = _is_admin_hint_enabled() and "admin" in payload.email.lower()
    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        is_admin=is_admin_hint_applied,
    )
    await user.insert()
    await AuditLog(
        action="USER_REGISTERED",
        actor_id=user.id,
        metadata={"admin_hint_applied": is_admin_hint_applied},
    ).save()
    return user


async def authenticate_user(email: str, password: str) -> User:
    user = await User.find_one(User.email == email)
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if _is_admin_hint_enabled() and "admin" in user.email.lower() and not user.is_admin:
        user.is_admin = True
        user.updated_at = _utcnow()
        await user.save()

    return user


async def issue_auth_tokens_for_user(
    user: User,
    ip: str | None = None,
    user_agent: str | None = None,
    family_id: str | None = None,
) -> dict[str, Any]:
    access = build_access_token(str(user.id), user.is_admin)
    refresh = build_refresh_token(str(user.id), family_id=family_id)

    refresh_record = RefreshToken(
        user_id=user.id,
        token_hash=hash_password(refresh.token),
        jti=refresh.jti,
        family_id=refresh.family_id or "",
        expires_at=refresh.expires_at,
        ip=ip,
        user_agent=user_agent,
    )
    await refresh_record.insert()

    return {
        "access_token": access.token,
        "refresh_token": refresh.token,
        "refresh_jti": refresh.jti,
        "refresh_family_id": refresh.family_id,
        "user": user,
    }


async def _revoke_token_record(token_record: RefreshToken, revoked_at: datetime) -> None:
    if token_record.revoked_at is None:
        token_record.revoked_at = revoked_at
    token_record.last_used_at = revoked_at
    await token_record.save()


async def revoke_all_refresh_tokens_for_user(user_id: str, reason: str) -> int:
    user_object_id = _to_object_id(user_id)
    now = _utcnow()
    tokens = await RefreshToken.find(
        RefreshToken.user_id == user_object_id,
        RefreshToken.revoked_at == None,  # noqa: E711
    ).to_list()
    for token_record in tokens:
        await _revoke_token_record(token_record, now)

    if tokens:
        await AuditLog(
            action="REFRESH_TOKENS_REVOKED",
            actor_id=user_object_id,
            metadata={"reason": reason, "count": len(tokens)},
        ).save()
    return len(tokens)


async def _handle_refresh_reuse(
    user_id: str,
    reused_jti: str,
    ip: str | None,
    user_agent: str | None,
) -> None:
    revoked_count = await revoke_all_refresh_tokens_for_user(
        user_id=user_id,
        reason="refresh_reuse_detected",
    )
    await AuditLog(
        action="REFRESH_REUSE_DETECTED",
        actor_id=_to_object_id(user_id),
        metadata={
            "severity": "high",
            "reused_jti": reused_jti,
            "revoked_count": revoked_count,
            "ip": ip,
            "user_agent": user_agent,
        },
    ).save()


async def rotate_refresh_token(
    refresh_token: str,
    ip: str | None = None,
    user_agent: str | None = None,
) -> dict[str, Any]:
    payload = decode_refresh_token(refresh_token)
    user_id = payload.get("sub")
    jti = payload.get("jti")
    family_id = payload.get("family_id")
    if not user_id or not jti or not family_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    token_record = await RefreshToken.find_one(RefreshToken.jti == jti)
    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    if token_record.user_id != _to_object_id(user_id):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    try:
        token_hash_valid = verify_password(refresh_token, token_record.token_hash)
    except Exception:  # noqa: BLE001
        token_hash_valid = False

    if not token_hash_valid:
        await _handle_refresh_reuse(user_id=user_id, reused_jti=jti, ip=ip, user_agent=user_agent)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token reuse detected",
        )

    now = _utcnow()
    if token_record.expires_at <= now:
        await _revoke_token_record(token_record, now)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired",
        )

    if token_record.revoked_at is not None or token_record.rotated_at is not None:
        await _handle_refresh_reuse(user_id=user_id, reused_jti=jti, ip=ip, user_agent=user_agent)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token reuse detected",
        )

    user = await User.get(user_id)
    if not user:
        await _revoke_token_record(token_record, now)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    new_tokens = await issue_auth_tokens_for_user(
        user=user,
        ip=ip,
        user_agent=user_agent,
        family_id=family_id,
    )

    token_record.rotated_at = now
    token_record.revoked_at = now
    token_record.replaced_by_jti = new_tokens["refresh_jti"]
    token_record.last_used_at = now
    await token_record.save()

    return {
        "access_token": new_tokens["access_token"],
        "refresh_token": new_tokens["refresh_token"],
        "user": serialize_user(user),
    }


async def revoke_refresh_token(
    refresh_token: str,
    expected_user_id: str | None = None,
    reason: str = "logout",
) -> bool:
    try:
        payload = decode_refresh_token(refresh_token)
    except HTTPException:
        return False

    jti = payload.get("jti")
    user_id = payload.get("sub")
    if not jti or not user_id:
        return False

    if expected_user_id and expected_user_id != user_id:
        return False

    token_record = await RefreshToken.find_one(RefreshToken.jti == jti)
    if not token_record:
        return False

    try:
        if not verify_password(refresh_token, token_record.token_hash):
            return False
    except Exception:  # noqa: BLE001
        return False

    if token_record.revoked_at is None:
        now = _utcnow()
        token_record.revoked_at = now
        token_record.last_used_at = now
        await token_record.save()

        await AuditLog(
            action="REFRESH_TOKEN_REVOKED",
            actor_id=_to_object_id(user_id),
            metadata={"reason": reason, "jti": jti},
        ).save()

    return True
