import json
import logging
import asyncio
from aiokafka import AIOKafkaConsumer
from .database import SessionLocal
from .models import AllReport
from .config import settings

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def consume_progress_updates():
    # Inisialisasi Consumer for status updates
    consumer = AIOKafkaConsumer(
        "Update_Report_Progress", 
        bootstrap_servers=settings.kafka_bootstrap_servers,
        value_deserializer=lambda m: json.loads(m.decode("utf-8")),
        group_id="report_status_update_group", # Distinct group ID
        auto_offset_reset="earliest"
    )

    # Reconnection logic
    while True:
        try:
            await consumer.start()
            logger.info("✅ Consumer Update Progress connected to Kafka. Topic: Update_Report_Progress")
            break
        except Exception as e:
            logger.error(f"❌ Kafka Status Update not ready, retrying in 5s... {e}")
            await asyncio.sleep(5)

    try:
        async for msg in consumer:
            data = msg.value
            report_id = data.get("report_id")
            new_status = data.get("status")
            admin_note = data.get("admin_note")
            
            logger.info(f"🔄 Processing status update for Report ID: {report_id}")

            db = SessionLocal()
            try:
                # Find the report in the database
                report = db.query(AllReport).filter(AllReport.id == report_id).first()
                if report:
                    report.status = new_status
                    report.admin_note = admin_note
                    db.commit()
                    logger.info(f"✨ Successfully updated report {report_id} to status: {new_status}")
                else:
                    logger.warning(f"⚠️ Report ID {report_id} not found in database")
            except Exception as e:
                db.rollback()
                logger.error(f"❌ DB Update Error: {e}")
            finally:
                db.close()
    except Exception as e:
        logger.error(f"❌ Error in status update consumer loop: {e}")
    finally:
        await consumer.stop()