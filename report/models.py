from sqlmodel import SQLModel, Field
from typing import Optional
import uuid
from datetime import datetime

class Report(SQLModel, table=True):
    report_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: str = Field(index=True) # Merujuk ke UserCustomer.user_id
    multimedia_url: Optional[str] = None # Disimpan di S3/Object Storage
    department: str = Field(index=True) # Menentukan laporan diteruskan ke siapa
    anonymous: bool = Field(default=False) # True = sembunyikan identitas ke penerima
    status: str = Field(default="pending", index=True)
    title: str
    status_description: Optional[str] = None
    vote_count: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)