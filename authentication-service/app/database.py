from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import settings

# Optimized for VPS with high concurrent connections
engine = create_engine(
    settings.DATABASE_URL, 
    pool_pre_ping=True, 
    pool_size=20,       # Adjusted for a single microservice
    max_overflow=40
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()