import json
import logging
import asyncio
from aiokafka import AIOKafkaConsumer
from app.config import settings
from app.database import SessionLocal
from app.models import AllReport

logger = logging.getLogger(__name__)

async def consume_reports():
    # Retry logic if Kafka is not ready
    consumer = AIOKafkaConsumer(
        settings.kafka_topic,
        bootstrap_servers=settings.kafka_bootstrap_servers,
        value_deserializer=lambda m: json.loads(m.decode("utf-8")),
        group_id=settings.kafka_group_id,
        auto_offset_reset="earliest"
    )

    while True:
        try:
            await consumer.start()
            break
        except Exception as e:
            logger.error(f"Kafka not ready, retrying in 5s... {e}")
            await asyncio.sleep(5)

    logger.info(f"Started consuming topic: {settings.kafka_topic}")

    try:
        async for msg in consumer:
            data = msg.value
            logger.info(f"Processing report for user: {data.get('user_id')}")

            db = SessionLocal()
            try:
                new_report = AllReport(
                    user_id=data["user_id"],
                    title=data["title"],
                    department=data["department"],
                    description=data["description"],
                    multimedia_url=json.dumps(data.get("multimedia_urls", [])),
                    anonymous=data.get("anonymous", False)
                )
                db.add(new_report)
                db.commit()
                logger.info("Report successfully saved to Database")
            except Exception as e:
                db.rollback()
                logger.error(f"Failed to save report: {e}")
            finally:
                db.close()
    finally:
        await consumer.stop()