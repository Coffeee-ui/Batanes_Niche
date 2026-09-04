from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Text, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.database.base import Base


class ErrorReport(Base):
    __tablename__ = "error_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, index=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True, nullable=False
    )
    username: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    endpoint: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    error_message: Mapped[str] = mapped_column(Text, nullable=False)
    stack_trace: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    request_data: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
