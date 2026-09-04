from typing import List, Union
import json
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    APP_NAME: str = "Batanes Niche Job Portal"
    BASE_URL: str = "http://localhost:8000"

    # Database Configuration
    DATABASE_URL: str = "sqlite:///./batanes_niche.db"

    # JWT Authentication
    JWT_SECRET_KEY: str = "batanes-niche-local-development-secret-key-super-secure-high-entropy-64chars-minimum"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    ALLOWED_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173"
    ]

    # SMTP Configuration (Email Delivery Service)
    MAIL_HOST: str = "smtp.gmail.com"
    MAIL_PORT: int = 587
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM: str = "noreply@batanesniche.ph"
    MAIL_FROM_NAME: str = "Batanes Niche Job Portal"
    MAIL_STARTTLS: bool = True
    MAIL_SSL_TLS: bool = False

    # Administrative UI Session Secret
    ADMIN_SESSION_SECRET: str = "batanes-niche-admin-session-local-secret-super-secure-high-entropy-64chars"

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except Exception:
                return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v


settings = Settings()
