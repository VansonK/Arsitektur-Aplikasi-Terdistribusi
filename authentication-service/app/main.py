from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from prometheus_fastapi_instrumentator import Instrumentator
from datetime import timedelta
import os
from .auth import get_password_hash
from . import models, schemas, crud, auth
from .database import engine, get_db
from .config import settings

# Inisialisasi app HANYA SEKALI
app = FastAPI(title='Auth Microservice')

# Pasang CORS segera setelah inisialisasi app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)

# Prometheus metrics
Instrumentator().instrument(app).expose(app)

# ============================================================
#  Database Initialization Logic
# ============================================================
LOCK_FILE = "/tmp/db_init.lock"

def init_db_once():
    models.Base.metadata.create_all(bind=engine)
    db = next(get_db())
    
    # 1. Akun Admin (Dept: Kebersihan)
    if not db.query(models.User).filter(models.User.email == "admin@test.com").first():
        db.add(models.User(
            email="admin@test.com",
            hashed_password=auth.get_password_hash("admin123"),
            role="admin",
            department="Kebersihan"
        ))
    
    # 2. Akun Executive (Pimpinan)
    if not db.query(models.User).filter(models.User.email == "boss@test.com").first():
        db.add(models.User(
            email="boss@test.com",
            hashed_password=auth.get_password_hash("boss123"),
            role="executive"
        ))
    
    if not db.query(models.User).filter(models.User.email == "user@test.com").first():
        db.add(models.User(
            email="user@test.com",
            hashed_password=auth.get_password_hash("user123")
        ))
    
    db.commit()

@app.on_event("startup")
def startup():
    init_db_once()

# ============================================================
#  ROUTES
# ============================================================

@app.post('/register', response_model=schemas.UserRead)
async def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, user.email)
    if db_user:
        raise HTTPException(status_code=400, detail='Email already registered')

    hashed_password = auth.get_password_hash(user.password)
    created = crud.create_user(db, user, hashed_password=hashed_password)
    return created

@app.post('/login')
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Email atau password salah'
        )

    # TAMBAHKAN ROLE & DEPT KE DALAM TOKEN
    access_token = auth.create_access_token(
        data={
            "sub": user.email, 
            "id": user.id,
            "role": user.role,
            "department": user.department
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "department": user.department
        }
    }

@app.get('/me', response_model=schemas.UserRead)
async def read_current_user(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.get('/verify')
async def verify_token(current_user: models.User = Depends(auth.get_current_user)):
    return {"detail": "token valid", "email": current_user.email, "id": current_user.id}