import pytest
from fastapi import status
from app.database.base import Base


def test_chat_endpoints_return_404(client):
    """Section 2.2: All chat endpoints must return 404 Not Found."""
    assert client.get("/api/v1/chat").status_code == status.HTTP_404_NOT_FOUND
    assert client.get("/api/v1/messages").status_code == status.HTTP_404_NOT_FOUND
    assert client.post("/api/v1/chat/rooms").status_code == status.HTTP_404_NOT_FOUND
    assert client.get("/chat").status_code == status.HTTP_404_NOT_FOUND


def test_removed_database_tables_do_not_exist():
    """Section 2.2 & 8: chat_rooms and messages tables must NOT exist in schema metadata."""
    table_names = list(Base.metadata.tables.keys())
    assert "chat_rooms" not in table_names
    assert "messages" not in table_names
    assert "pending_sync" not in table_names


def test_exact_twelve_approved_tables():
    """Section 8: Exactly 12 approved tables in database contract."""
    table_names = set(Base.metadata.tables.keys())
    approved_12_tables = {
        "users",
        "employer_profiles",
        "job_seeker_profiles",
        "jobs",
        "applications",
        "saved_jobs",
        "notifications",
        "refresh_tokens",
        "revoked_tokens",
        "password_reset_tokens",
        "error_reports",
        "audit_logs",
    }
    assert table_names == approved_12_tables
