import json
import logging
import asyncio
import os
from aiokafka import AIOKafkaConsumer
from .config import settings
from .database import SessionLocal
from .models import AllReport

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def consume_reports():
    # Inisialisasi Consumer
    consumer = AIOKafkaConsumer(
        settings.kafka_topic,
        bootstrap_servers=settings.kafka_bootstrap_servers,
        value_deserializer=lambda m: json.loads(m.decode("utf-8")),
        group_id=settings.kafka_group_id,
        auto_offset_reset="earliest"
    )

    # Reconnection logic
    while True:
        try:
            await consumer.start()
            logger.info(f"✅ Berhasil terhubung ke Kafka. Topic: {settings.kafka_topic}")
            break
        except Exception as e:
            logger.error(f"❌ Kafka belum siap, mencoba lagi dalam 5 detik... {e}")
            await asyncio.sleep(5)

    try:
        async for msg in consumer:
            data = msg.value
            logger.info(f"📥 Memproses laporan masuk dari user: {data.get('user_id')}")

            db = SessionLocal()
            try:
                new_report = AllReport(
                    user_id=str(data["user_id"]),
                    title=data["title"],
                    department=data["department"],
                    description=data["description"],
                    # Sinkronisasi key: reporting-engine mengirim 'multimedia_url'
                    multimedia_url=json.dumps(data.get("multimedia_url", [])),
                    anonymous=data.get("anonymous", False),
                    status="pending"
                )
                db.add(new_report)
                db.commit()
                logger.info(f"💾 Laporan saved: {data['title']}")
            except Exception as e:
                db.rollback()
                logger.error(f"❌ DB Error: {e}")
            finally:
                db.close()
    except Exception as e:
        logger.error(f"❌ Error pada loop consumer: {e}")
    finally:
        await consumer.stop()