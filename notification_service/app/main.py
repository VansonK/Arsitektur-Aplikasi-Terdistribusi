from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import logging

from app.database import init_db
from app.kafka_consumer import consume_notifications
from app.routers import notification # Pastikan nama file router benar

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Notification Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=False, # Ubah jadi False jika origins adalah "*"
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gunakan router (Logika inbox/read sudah ada di dalam router)
app.include_router(notification.router)

@app.on_event("startup")
async def startup_event():
    init_db() 
    asyncio.create_task(consume_notifications()) 
    logger.info("✅ Notification Service & Kafka Consumer started")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}