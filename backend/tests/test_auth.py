import pytest
from httpx import ASGITransport, AsyncClient

from app.config import settings
from app.main import app
from app.models import AuditLog, RefreshToken
from app.services.auth_service import decode_refresh_token

pytestmark = pytest.mark.asyncio


async def test_register_success(async_client):
    response = await async_client.post(
        "/api/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "Testpass123!",
            "full_name": "New User",
        },
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["success"] is True
    assert payload["data"]["access_token"]
    assert payload["data"]["user"]["email"] == "newuser@example.com"
    assert "refresh_token=" in response.headers.get("set-cookie", "")


async def test_register_duplicate_email(async_client):
    register_payload = {
        "email": "duplicate@example.com",
        "password": "Testpass123!",
        "full_name": "Duplicate User",
    }
    await async_client.post("/api/auth/register", json=register_payload)
    response = await async_client.post("/api/auth/register", json=register_payload)

    payload = response.json()
    assert response.status_code == 400
    assert payload["success"] is False
    assert payload["error"] == "Email already registered"


async def test_register_rejects_weak_password(async_client):
    response = await async_client.post(
        "/api/auth/register",
        json={
            "email": "weak-password@example.com",
            "password": "weakpass",
            "full_name": "Weak Password",
        },
    )

    payload = response.json()
    assert response.status_code == 400
    assert payload["success"] is False
    assert "Password must be at least 8 characters" in payload["error"]


async def test_login_success_sets_refresh_cookie(async_client, test_user):
    response = await async_client.post(
        "/api/auth/login",
        json={"email": test_user.email, "password": "Testpass123!"},
    )
    payload = response.json()
    set_cookie = response.headers.get("set-cookie", "")

    assert response.status_code == 200
    assert payload["success"] is True
    assert payload["data"]["access_token"]
    assert payload["data"]["user"]["id"] == str(test_user.id)
    assert "refresh_token=" in set_cookie
    assert "HttpOnly" in set_cookie
    assert "Path=/api/auth" in set_cookie


async def test_login_wrong_password(async_client, test_user):
    response = await async_client.post(
        "/api/auth/login",
        json={"email": test_user.email, "password": "wrong-password"},
    )
    payload = response.json()

    assert response.status_code == 401
    assert payload["success"] is False
    assert payload["error"] == "Invalid email or password"


async def test_get_me_authenticated(async_client, auth_headers):
    response = await async_client.get("/api/auth/me", headers=auth_headers)
    payload = response.json()

    assert response.status_code == 200
    assert payload["success"] is True
    assert payload["data"]["email"] == "user@example.com"


async def test_get_me_unauthenticated(async_client):
    response = await async_client.get("/api/auth/me")
    payload = response.json()

    assert response.status_code == 401
    assert payload["success"] is False


async def test_refresh_with_cookie_rotates_token(async_client, test_user):
    login = await async_client.post(
        "/api/auth/login",
        json={"email": test_user.email, "password": "Testpass123!"},
    )
    assert login.status_code == 200
    old_refresh_token = async_client.cookies.get("refresh_token")
    assert old_refresh_token

    refresh_response = await async_client.post("/api/auth/refresh")
    payload = refresh_response.json()
    new_refresh_token = async_client.cookies.get("refresh_token")

    assert refresh_response.status_code == 200
    assert payload["success"] is True
    assert payload["data"]["access_token"]
    assert new_refresh_token
    assert new_refresh_token != old_refresh_token

    old_jti = decode_refresh_token(old_refresh_token)["jti"]
    old_record = await RefreshToken.find_one(RefreshToken.jti == old_jti)
    assert old_record is not None
    assert old_record.revoked_at is not None
    assert old_record.rotated_at is not None
    assert old_record.replaced_by_jti is not None


async def test_refresh_reuse_detected_revokes_all_sessions(async_client, test_user):
    login = await async_client.post(
        "/api/auth/login",
        json={"email": test_user.email, "password": "Testpass123!"},
    )
    assert login.status_code == 200
    old_refresh_token = async_client.cookies.get("refresh_token")
    assert old_refresh_token

    first_refresh = await async_client.post("/api/auth/refresh")
    assert first_refresh.status_code == 200

    reuse_response = await async_client.post(
        "/api/auth/refresh",
        cookies={"refresh_token": old_refresh_token},
    )
    reuse_payload = reuse_response.json()
    assert reuse_response.status_code == 401
    assert reuse_payload["success"] is False
    assert "reuse detected" in reuse_payload["error"].lower()

    tokens = await RefreshToken.find(RefreshToken.user_id == test_user.id).to_list()
    assert tokens
    assert all(token.revoked_at is not None for token in tokens)

    reuse_log = await AuditLog.find_one(
        AuditLog.action == "REFRESH_REUSE_DETECTED",
        AuditLog.actor_id == test_user.id,
    )
    assert reuse_log is not None
    assert reuse_log.metadata.get("severity") == "high"


async def test_logout_revokes_current_token(async_client, test_user):
    login = await async_client.post(
        "/api/auth/login",
        json={"email": test_user.email, "password": "Testpass123!"},
    )
    payload = login.json()
    access_token = payload["data"]["access_token"]
    current_refresh_token = async_client.cookies.get("refresh_token")
    assert current_refresh_token

    logout_response = await async_client.post(
        "/api/auth/logout",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert logout_response.status_code == 200
    assert "refresh_token=" in logout_response.headers.get("set-cookie", "")

    jti = decode_refresh_token(current_refresh_token)["jti"]
    token_record = await RefreshToken.find_one(RefreshToken.jti == jti)
    assert token_record is not None
    assert token_record.revoked_at is not None

    refresh_with_revoked = await async_client.post(
        "/api/auth/refresh",
        cookies={"refresh_token": current_refresh_token},
    )
    assert refresh_with_revoked.status_code == 401


async def test_logout_all_revokes_all_tokens(async_client, test_user):
    login_one = await async_client.post(
        "/api/auth/login",
        json={"email": test_user.email, "password": "Testpass123!"},
    )
    assert login_one.status_code == 200
    access_token = login_one.json()["data"]["access_token"]

    second_transport = ASGITransport(app=app)
    async with AsyncClient(transport=second_transport, base_url="http://testserver") as second_client:
        login_two = await second_client.post(
            "/api/auth/login",
            json={"email": test_user.email, "password": "Testpass123!"},
        )
        assert login_two.status_code == 200

        logout_all = await async_client.post(
            "/api/auth/logout-all",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        assert logout_all.status_code == 200

        refresh_after_logout_all = await second_client.post("/api/auth/refresh")
        assert refresh_after_logout_all.status_code == 401

    tokens = await RefreshToken.find(RefreshToken.user_id == test_user.id).to_list()
    assert tokens
    assert all(token.revoked_at is not None for token in tokens)


async def test_update_me_rejects_weak_password(async_client, auth_headers):
    response = await async_client.put(
        "/api/users/me",
        headers=auth_headers,
        json={"password": "weakpass"},
    )
    payload = response.json()

    assert response.status_code == 400
    assert payload["success"] is False
    assert "Password must be at least 8 characters" in payload["error"]


async def test_allow_email_admin_hint_enabled_in_development(async_client):
    original_environment = settings.environment
    original_allow_hint = settings.allow_email_admin_hint
    settings.environment = "development"
    settings.allow_email_admin_hint = True
    try:
        response = await async_client.post(
            "/api/auth/register",
            json={
                "email": "admin-hint-dev@example.com",
                "password": "Strongpass1!",
                "full_name": "Admin Hint Dev",
            },
        )
        payload = response.json()
        assert response.status_code == 200
        assert payload["data"]["user"]["is_admin"] is True
    finally:
        settings.environment = original_environment
        settings.allow_email_admin_hint = original_allow_hint


async def test_allow_email_admin_hint_ignored_in_non_development(async_client):
    original_environment = settings.environment
    original_allow_hint = settings.allow_email_admin_hint
    settings.environment = "production"
    settings.allow_email_admin_hint = True
    try:
        response = await async_client.post(
            "/api/auth/register",
            json={
                "email": "admin-hint-prod@example.com",
                "password": "Strongpass1!",
                "full_name": "Admin Hint Prod",
            },
        )
        payload = response.json()
        assert response.status_code == 200
        assert payload["data"]["user"]["is_admin"] is False
    finally:
        settings.environment = original_environment
        settings.allow_email_admin_hint = original_allow_hint


@pytest.mark.parametrize(
    ("path", "payload"),
    [
        ("/api/auth/login", {"email": "user@example.com", "password": "wrongpass"}),
        (
            "/api/auth/register",
            {
                "email": "rate-limit-user-{idx}@example.com",
                "password": "Strongpass1!",
                "full_name": "Rate Limit User",
            },
        ),
        ("/api/auth/refresh", None),
    ],
)
async def test_auth_rate_limit_returns_429(async_client, path, payload):
    final_response = None
    request_count = 6 if path != "/api/auth/refresh" else 31

    for idx in range(request_count):
        if path == "/api/auth/register":
            request_payload = dict(payload)
            request_payload["email"] = request_payload["email"].format(idx=idx)
            final_response = await async_client.post(path, json=request_payload)
        elif path == "/api/auth/login":
            final_response = await async_client.post(path, json=payload)
        else:
            final_response = await async_client.post(path)

    assert final_response is not None
    assert final_response.status_code == 429
    assert final_response.json()["success"] is False
