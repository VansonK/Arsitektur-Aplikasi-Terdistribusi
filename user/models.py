from sqlmodel import SQLModel, Field
from typing import Optional
import uuid

class Departments(SQLModel, table=True):
    department_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(unique=True, index=True) # Contoh: "Kebersihan", "Keamanan"

class UserCustomer(SQLModel, table=True):
    user_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(unique=True, index=True)
    password: str # Di simpan sebagai hash(str)
    name: str
    pub_key: str # Untuk validasi identitas digital pelapor

class UserPegawai(SQLModel, table=True):
    user_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(unique=True, index=True)
    password: str
    name: str
    department: str = Field(index=True) # Referensi ke nama Departemen
    position: int = Field(default=1) # Level 1-3 (3: Kewenangan Tertinggi)