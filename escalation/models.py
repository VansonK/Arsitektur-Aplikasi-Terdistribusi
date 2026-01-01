from sqlmodel import SQLModel, Field
import uuid
from datetime import datetime

class EscalationLog(SQLModel, table=True):
    escalation_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    report_id: uuid.UUID = Field(index=True) # Merujuk ke AllReport
    from_officer_level: int # Level sebelumnya yang menangani
    to_officer_level: int # Level tujuan eskalasi (misal naik ke level 2 atau 3)
    escalated_at: datetime = Field(default_factory=datetime.utcnow)
    reason: str = Field(default="SLA Expired")

class AuditTrail(SQLModel, table=True):
    audit_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    report_id: uuid.UUID = Field(index=True)
    officer_id: uuid.UUID # ID pegawai yang mengubah status
    status: str
    updated_at: datetime = Field(default_factory=datetime.utcnow)