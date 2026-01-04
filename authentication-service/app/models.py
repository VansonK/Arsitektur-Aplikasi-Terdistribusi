from sqlalchemy import Column, Integer, String, Boolean
from .database import Base

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    
    # --- TAMBAHAN UNTUK ROLE & DEPT ---
    # Role: "citizen", "admin", "executive"
    role = Column(String, default="citizen", nullable=False)
    # Department: e.g., "kebersihan", "kesehatan", "keamanan" (null jika citizen)
    department = Column(String, nullable=True)