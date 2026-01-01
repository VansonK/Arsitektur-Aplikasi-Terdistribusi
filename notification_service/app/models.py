from sqlalchemy import Column, Integer, String, DateTime, Text, Index
from datetime import datetime
from app.database import Base

class NotificationEvent(Base):
    __tablename__ = "notification_events"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=False, index=True)
    notification_type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    data = Column(Text)  # JSON string for additional data
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    read = Column(Integer, default=0)
    
    __table_args__ = (
        Index('idx_user_created', 'user_id', 'created_at'),
    )