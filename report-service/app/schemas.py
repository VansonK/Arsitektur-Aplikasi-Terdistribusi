from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import json

class ReportBase(BaseModel):
    title: str
    department: str
    description: str
    anonymous: bool = False

class ReportCreate(ReportBase):
    user_id: str
    # Di model Anda menggunakan Text (JSON string), 
    # di schema kita terima sebagai List[str] agar mudah bagi Frontend
    multimedia_url: Optional[List[str]] = [] 

class ReportResponse(ReportBase):
    id: int
    user_id: str
    status: str
    vote_count: int  # Tambahkan ini agar cocok dengan model
    created_at: datetime
    multimedia_url: Optional[str] = None # Sesuai tipe Text di model

    class Config:
        from_attributes = True

class ReportStats(BaseModel):
    total: int
    pending: int
    diproses: int
    selesai: int