from functools import lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_WEAK_SECRETS = {
    "your-secret-key-change-in-production",
    "super-secret-jwt-key-change-this",
    "your-refresh-secret-key-change-in-production",
    "super-secret-refresh-key-change-this",
    "changeme",
    "secret",
}


class Settings(BaseSettings):
    mongo_url: str = "mongodb://localhost:27017"
    mongo_db_name: str = "curated_exchange"
    jwt_secret: str = "your-secret-key-change-in-production"
    jwt_refresh_secret: str = "your-refresh-secret-key-change-in-production"
    jwt_expire_minutes: int = 15
    jwt_refresh_expire_days: int = 7
    redis_url: str = "redis://localhost:6379/0"
    allow_email_admin_hint: bool = False
    allowed_origins: str = "http://localhost:5173,http://localhost:3000"
    environment: str = "development"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

    @property
    def allowed_origins_list(self) -> list[str]:
        return [item.strip() for item in self.allowed_origins.split(",") if item.strip()]

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    @model_validator(mode="after")
    def validate_security(self):
        env = self.environment.lower()
        if env != "development":
            if (
                not self.jwt_secret
                or self.jwt_secret.lower() in _WEAK_SECRETS
                or len(self.jwt_secret) < 32
            ):
                raise ValueError("JWT_SECRET is weak. Use a strong secret in non-development.")
            if (
                not self.jwt_refresh_secret
                or self.jwt_refresh_secret.lower() in _WEAK_SECRETS
                or len(self.jwt_refresh_secret) < 32
            ):
                raise ValueError(
                    "JWT_REFRESH_SECRET is weak. Use a strong secret in non-development."
                )
        return self


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
