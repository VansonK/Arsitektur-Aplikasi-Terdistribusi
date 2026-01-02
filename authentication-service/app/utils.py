from fastapi import HTTPException, status

LOCK_FILE = "/tmp/db_init.lock"

@app.on_event("startup")
def ensure_db_tables(engine, Base):
    # create tables if not exists (simple approach)
    Base.metadata.create_all(bind=engine)