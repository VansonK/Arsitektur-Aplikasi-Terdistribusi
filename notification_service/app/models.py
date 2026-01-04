from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from datetime import datetime
from .database import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    report_id = Column(Integer, nullable=True) # Tambahkan nullable=True
    title = Column(String)
    status = Column(String, nullable=True)
    message = Column(Text)
    is_read = Column(Boolean, default=False) # Gunakan Boolean (is_read) secara konsisten
    created_at = Column(DateTime, default=datetime.utcnow)