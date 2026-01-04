import json
import asyncio
import logging
from .database import SessionLocal
from .models import Notification
from .config import settings
from aiokafka import AIOKafkaConsumer

# Setup logging sederhana untuk memantau trafik Kafka
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def consume_notifications():
    # Memberi waktu bagi Kafka Broker untuk siap (cold start)
    await asyncio.sleep(10)
    
    consumer = AIOKafkaConsumer(
        settings.kafka_topic,
        bootstrap_servers=settings.kafka_bootstrap_servers,
        group_id=settings.kafka_group_id,
        value_deserializer=lambda v: json.loads(v.decode("utf-8"))
    )
    
    await consumer.start()
    logger.info(f"🚀 Kafka Consumer dimulai pada topik: {settings.kafka_topic}")

    try:
        async for msg in consumer:
            data = msg.value
            user_id = data.get("user_id")
            
            if not user_id:
                logger.warning("⚠️ Pesan diterima tanpa user_id, dilewati.")
                continue

            # Buat sesi database baru untuk setiap pesan
            db = SessionLocal()
            try:
                # 1. Buat object Notifikasi baru berdasarkan data Kafka
                new_notif = Notification(
                    user_id=str(data.get("user_id")),
                    report_id=data.get("report_id"),
                    title="Update Status Laporan", # Memberi judul default
                    status=data.get("status"),     # Mengisi kolom status dari Kafka
                    message=f"Laporan #{data.get('report_id')} Anda kini berstatus {data.get('status')}."
                )
                
                # 2. Simpan ke Database
                db.add(new_notif)
                db.commit()
                db.refresh(new_notif)
                
                logger.info(f"✅ Notifikasi disimpan untuk User {user_id} - Report #{data.get('report_id')}")

            except Exception as e:
                db.rollback()
                logger.error(f"❌ Gagal menyimpan notifikasi ke DB: {e}")
            finally:
                db.close()
                
    except Exception as e:
        logger.error(f"❌ Error pada Kafka Consumer loop: {e}")
    finally:
        await consumer.stop()
        logger.info("🔌 Kafka Consumer dimatikan.")