import pytest

from app.config import Settings


def test_weak_jwt_secret_fails_startup_in_non_development():
    with pytest.raises(ValueError):
        Settings(
            environment="production",
            jwt_secret="secret",
            jwt_refresh_secret="this-is-a-very-strong-refresh-secret-123",
        )


def test_weak_refresh_secret_fails_startup_in_non_development():
    with pytest.raises(ValueError):
        Settings(
            environment="production",
            jwt_secret="this-is-a-very-strong-access-secret-123",
            jwt_refresh_secret="secret",
        )


def test_strong_secrets_allowed_in_non_development():
    settings = Settings(
        environment="production",
        jwt_secret="this-is-a-very-strong-access-secret-123",
        jwt_refresh_secret="this-is-a-very-strong-refresh-secret-123",
    )
    assert settings.environment == "production"
