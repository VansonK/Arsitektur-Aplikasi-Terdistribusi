import json
import logging

from aiokafka import AIOKafkaConsumer
from app.config import settings
from app.database import SessionLocal
from app.models import NotificationEvent
from app.websocket_manager import manager

logger = logging.getLogger(__name__)


async def consume_notifications():
    consumer = AIOKafkaConsumer(
        settings.kafka_topic,
        bootstrap_servers=settings.kafka_bootstrap_servers,
        value_deserializer=lambda m: json.loads(m.decode("utf-8")),
        group_id=settings.kafka_group_id,
        auto_offset_reset="earliest",
        enable_auto_commit=True,
    )

    await consumer.start()
    logger.info("Kafka consumer started")

    try:
        async for msg in consumer:
            notification_data = msg.value
            logger.info("Received notification: %s", notification_data)

            db = SessionLocal()
            try:
                db_notification = NotificationEvent(
                    user_id=notification_data["user_id"],
                    notification_type=notification_data["notification_type"],
                    title=notification_data["title"],
                    message=notification_data["message"],
                    data=json.dumps(notification_data.get("data", {})),
                )

                db.add(db_notification)
                db.commit()
                db.refresh(db_notification)

                await manager.send_personal_message(
                    {
                        "id": db_notification.id,
                        "user_id": db_notification.user_id,
                        "notification_type": db_notification.notification_type,
                        "title": db_notification.title,
                        "message": db_notification.message,
                        "data": json.loads(db_notification.data),
                        "created_at": db_notification.created_at.isoformat(),
                        "read": db_notification.read,
                    },
                    db_notification.user_id,
                )

                logger.info(
                    "Notification %s saved and sent to user %s",
                    db_notification.id,
                    db_notification.user_id,
                )

            except Exception:
                db.rollback()
                logger.exception("Error processing notification")
            finally:
                db.close()

    finally:
        await consumer.stop()
        logger.info("Kafka consumer stopped")
