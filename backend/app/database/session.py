from typing import Generator
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from app.core.config import settings

connect_args = {}
engine_kwargs = {
    "pool_pre_ping": True,
}

if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False
    engine_kwargs["connect_args"] = connect_args
else:
    # PostgreSQL / Supabase configuration
    engine_kwargs["poolclass"] = QueuePool
    engine_kwargs["pool_size"] = getattr(settings, "DB_POOL_MIN", 5)
    engine_kwargs["max_overflow"] = getattr(settings, "DB_POOL_MAX", 10)
    engine_kwargs["pool_recycle"] = 1800
    engine_kwargs["pool_timeout"] = getattr(settings, "DB_TIMEOUT_SEC", 30)

    # Supabase SSL requirement (for remote hosts)
    if (
        "sslmode" not in settings.DATABASE_URL
        and "localhost" not in settings.DATABASE_URL
        and "127.0.0.1" not in settings.DATABASE_URL
    ):
        connect_args["sslmode"] = "require"

    engine_kwargs["connect_args"] = connect_args

engine = create_engine(settings.DATABASE_URL, **engine_kwargs)

# Ensure SQLite strictly enforces Foreign Key constraints (matches PostgreSQL parity)
if settings.DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """Dependency that yields a database session and safely closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
