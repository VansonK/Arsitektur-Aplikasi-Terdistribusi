from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from datetime import datetime
from app.database import Base

class AllReport(Base):
    __tablename__ = "all_report"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    department = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    multimedia_url = Column(Text)  # Stores JSON string of Drive URLs
    anonymous = Column(Boolean, default=False)
    status = Column(String, default="pending")
    vote_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)