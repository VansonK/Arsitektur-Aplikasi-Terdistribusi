from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import logging

from app.config import settings
from app.database import init_db
from app.kafka_consumer import consume_notifications
from app.routers import notifications
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Untuk testing, izinkan semua. Nanti ganti dengan ["http://103.197.188.83:30"]
    allow_credentials=True,
    allow_methods=["*"], # Mengizinkan GET, POST, OPTIONS, dll.
    allow_headers=["*"], # Mengizinkan semua header (Authorization, Content-Type, dll.)
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Notification Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(notifications.router)

@app.on_event("startup")
async def startup_event():
    init_db()
    asyncio.create_task(consume_notifications())
    logger.info("Application started")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.api_host, port=settings.api_port)