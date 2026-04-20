from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse

from app.config import settings
from app.core.rate_limiter import auth_rate_limit
from app.core.security import get_current_user
from app.models import User
from app.schemas import UserLogin, UserRegister
from app.services.auth_service import (
    authenticate_user,
    issue_auth_tokens_for_user,
    register_user,
    revoke_all_refresh_tokens_for_user,
    revoke_refresh_token,
    rotate_refresh_token,
    serialize_user,
)
from app.utils.response import success_response

router = APIRouter()

REFRESH_COOKIE_NAME = "refresh_token"


def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=settings.environment.lower() != "development",
        samesite="lax",
        path="/api/auth",
        max_age=settings.jwt_refresh_expire_days * 24 * 60 * 60,
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(key=REFRESH_COOKIE_NAME, path="/api/auth")


def _client_ip(request: Request) -> str | None:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return None


def _user_agent(request: Request) -> str | None:
    return request.headers.get("user-agent")


@router.post("/register", dependencies=[Depends(auth_rate_limit("register", 5, 900))])
async def register(payload: UserRegister, request: Request):
    user = await register_user(payload)
    token_pair = await issue_auth_tokens_for_user(
        user=user,
        ip=_client_ip(request),
        user_agent=_user_agent(request),
    )

    response = JSONResponse(
        content=success_response(
            {
                "access_token": token_pair["access_token"],
                "token_type": "bearer",
                "user": serialize_user(user),
            },
            message="Registration successful",
        )
    )
    _set_refresh_cookie(response, token_pair["refresh_token"])
    return response


@router.post("/login", dependencies=[Depends(auth_rate_limit("login", 5, 900))])
async def login(payload: UserLogin, request: Request):
    user = await authenticate_user(payload.email, payload.password)
    token_pair = await issue_auth_tokens_for_user(
        user=user,
        ip=_client_ip(request),
        user_agent=_user_agent(request),
    )

    response = JSONResponse(
        content=success_response(
            {
                "access_token": token_pair["access_token"],
                "token_type": "bearer",
                "user": serialize_user(user),
            },
            message="Login successful",
        )
    )
    _set_refresh_cookie(response, token_pair["refresh_token"])
    return response


@router.post("/refresh", dependencies=[Depends(auth_rate_limit("refresh", 30, 900))])
async def refresh_token(
    request: Request,
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE_NAME),
):
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing",
        )

    rotated = await rotate_refresh_token(
        refresh_token=refresh_token,
        ip=_client_ip(request),
        user_agent=_user_agent(request),
    )

    response = JSONResponse(
        content=success_response(
            {
                "access_token": rotated["access_token"],
                "token_type": "bearer",
            },
            message="Token refreshed",
        )
    )
    _set_refresh_cookie(response, rotated["refresh_token"])
    return response


@router.post("/logout")
async def logout(
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE_NAME),
):
    if refresh_token:
        await revoke_refresh_token(
            refresh_token=refresh_token,
            reason="logout",
        )

    response = JSONResponse(content=success_response({"logged_out": True}, message="Logged out"))
    _clear_refresh_cookie(response)
    return response


@router.post("/logout-all")
async def logout_all(current_user: User = Depends(get_current_user)):
    revoked_count = await revoke_all_refresh_tokens_for_user(
        user_id=str(current_user.id),
        reason="logout_all",
    )
    response = JSONResponse(
        content=success_response(
            {"revoked_sessions": revoked_count},
            message="Logged out from all devices",
        )
    )
    _clear_refresh_cookie(response)
    return response


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return success_response(serialize_user(current_user))
