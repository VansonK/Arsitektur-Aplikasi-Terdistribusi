from sqlmodel import SQLModel, Field
import uuid
from datetime import datetime

class Notification(SQLModel, table=True):
    notification_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(index=True) # Bisa UserCustomer atau UserPegawai
    report_id: uuid.UUID
    message: str
    is_read: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)