from typing import Optional
from pydantic import BaseModel


class MessageOut(BaseModel):
    message: str
    detail: Optional[str] = None
