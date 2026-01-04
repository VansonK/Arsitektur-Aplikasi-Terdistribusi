from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any

class NotificationBase(BaseModel):
    user_id: str
    title: str
    message: str
    report_id: Optional[int] = None
    status: Optional[str] = None

class NotificationCreate(NotificationBase):
    data: Optional[dict] = {}

class NotificationResponse(NotificationBase):
    id: int
    is_read: bool # Ubah dari read (int) menjadi is_read (bool)
    created_at: datetime
    
    class Config:
        from_attributes = True