from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from prometheus_fastapi_instrumentator import Instrumentator
from datetime import timedelta
import os

from . import models, schemas, crud, auth
from .database import engine, get_db
from .config import settings


# ============================================================
#  Create tables ONLY once — even with multiple workers
# ============================================================

LOCK_FILE = "/tmp/db_init.lock"

def init_db_once():
    """
    Ensure tables exist. Safe for multiple workers and multiple replicas.
    Only the first worker that starts will run this.
    """
    if os.path.exists(LOCK_FILE):
        print("DB already initialized. Skipping table creation...")
        return

    print("Running DB initialization...")

    # Create tables
    models.Base.metadata.create_all(bind=engine)

    # Write lock
    open(LOCK_FILE, "w").close()

    print("DB initialization completed.")


# ============================================================
#  FASTAPI Application
# ============================================================

app = FastAPI(title='Auth Microservice')

# Prometheus metrics
Instrumentator().instrument(app).expose(app)


# ============================================================
#  Startup hook
# ============================================================

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


@app.post('/token', response_model=schemas.Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Incorrect username or password'
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email, "id": user.id},
        expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@app.get('/me', response_model=schemas.UserRead)
async def read_current_user(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


@app.get('/verify')
async def verify_token(current_user: models.User = Depends(auth.get_current_user)):
    return {"detail": "token valid", "email": current_user.email, "id": current_user.id}


@app.post('/renew', response_model=schemas.Token)
async def renew_token(current_user: models.User = Depends(auth.get_current_user)):
    access_token = auth.create_access_token(data={"sub": current_user.email})
    return {"access_token": access_token, "token_type": "bearer"}
