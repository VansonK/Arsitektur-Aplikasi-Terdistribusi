from sqlalchemy.orm import Session
from . import models, schemas

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate, hashed_password: str):
    # Paksa role menjadi citizen jika mendaftar lewat jalur umum
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        role="citizen",  # Default aman
        department=None  # Warga tidak punya departemen
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user