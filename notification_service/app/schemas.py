from pydantic import BaseModel
from datetime import datetime

class NotificationBase(BaseModel):
    user_id: str
    notification_type: str
    title: str
    message: str
    data: dict = {}

class NotificationCreate(NotificationBase):
    pass

class NotificationResponse(BaseModel):
    id: int
    user_id: str
    notification_type: str
    title: str
    message: str
    data: str
    created_at: datetime
    read: int
    
    class Config:
        from_attributes = True