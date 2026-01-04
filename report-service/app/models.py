from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from datetime import datetime
from app.database import Base

class AllReport(Base):
    __tablename__ = "all_report"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    department = Column(String, nullable=False) # Masalah dipisah berdasarkan jenis [cite: 56]
    description = Column(Text, nullable=False)
    multimedia_url = Column(Text)
    anonymous = Column(Boolean, default=False)
    status = Column(String, default="pending")
    
    # --- TAMBAHAN UNTUK PROGRES & ESKALASI ---
    admin_note = Column(Text, nullable=True) # Catatan kemajuan untuk warga [cite: 48]
    is_escalated = Column(Boolean, default=False) # Untuk pantauan pimpinan [cite: 52]
    
    vote_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)