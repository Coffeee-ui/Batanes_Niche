from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    message: str
    type: str
    is_read: bool
    link: Optional[str] = None
    created_at: datetime
