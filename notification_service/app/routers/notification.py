from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from app.database import get_db
from app.models import Notification
from app.schemas import NotificationResponse

router = APIRouter(prefix="/notifications", tags=["notifications"])

# Endpoint ambil notifikasi (Digunakan Polling oleh Frontend)
@router.get("/{user_id}", response_model=List[NotificationResponse])
async def get_user_notifications(user_id: str, db: Session = Depends(get_db)):
    return db.query(Notification)\
             .filter(Notification.user_id == user_id)\
             .order_by(desc(Notification.created_at))\
             .limit(50).all()

# Endpoint tandai dibaca
@router.put("/{notif_id}/read")
async def mark_read(notif_id: int, db: Session = Depends(get_db)):
    notif = db.query(Notification).filter(Notification.id == notif_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notif not found")
    notif.is_read = True
    db.commit()
    return {"status": "ok"}