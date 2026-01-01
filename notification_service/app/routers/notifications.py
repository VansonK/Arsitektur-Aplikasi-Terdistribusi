from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List
import json

from app.database import get_db
from app.models import NotificationEvent
from app.schemas import NotificationCreate, NotificationResponse
from app.websocket_manager import manager

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)

@router.get("/{user_id}", response_model=List[NotificationResponse])
async def get_user_notifications(
    user_id: str,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    notifications = db.query(NotificationEvent)\
        .filter(NotificationEvent.user_id == user_id)\
        .order_by(NotificationEvent.created_at.desc())\
        .limit(limit)\
        .offset(offset)\
        .all()
    return notifications

@router.put("/{notification_id}/read")
async def mark_as_read(notification_id: int, db: Session = Depends(get_db)):
    notification = db.query(NotificationEvent)\
        .filter(NotificationEvent.id == notification_id)\
        .first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.read = 1
    db.commit()
    return {"status": "success", "message": "Notification marked as read"}

@router.post("/send")
async def send_notification(
    notification: NotificationCreate,
    db: Session = Depends(get_db)
):
    db_notification = NotificationEvent(
        user_id=notification.user_id,
        notification_type=notification.notification_type,
        title=notification.title,
        message=notification.message,
        data=json.dumps(notification.data)
    )
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    
    await manager.send_personal_message(
        {
            'id': db_notification.id,
            'user_id': db_notification.user_id,
            'notification_type': db_notification.notification_type,
            'title': db_notification.title,
            'message': db_notification.message,
            'data': notification.data,
            'created_at': db_notification.created_at.isoformat(),
            'read': db_notification.read
        },
        notification.user_id
    )
    
    return {"status": "success", "notification_id": db_notification.id}
