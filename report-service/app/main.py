import asyncio
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from . import models, schemas, auth # Pastikan auth.py tersedia di report-service juga
from .database import engine, Base, get_db
from .kafka_consumer import consume_reports
from fastapi.middleware.cors import CORSMiddleware

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Ganti dengan domain/IP frontend Anda nanti
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    # Menjalankan consumer sebagai background task
    asyncio.create_task(consume_reports())
    
# Endpoint Statistik
@app.get("/reports/stats")
async def get_report_stats(
    db: Session = Depends(get_db), 
    current_user: dict = Depends(auth.get_current_user)
):
    query = db.query(models.AllReport.status, func.count(models.AllReport.id))
    
    # FILTER BERDASARKAN ROLE 
    if current_user["role"] == "admin":
        # Admin hanya melihat statistik departemennya
        query = query.filter(models.AllReport.department == current_user["department"])
    elif current_user["role"] == "citizen":
        # Warga melihat statistik miliknya sendiri
        query = query.filter(models.AllReport.user_id == str(current_user["id"]))
    # "executive" tidak difilter (melihat semua untuk analisis pimpinan) 

    stats = query.group_by(models.AllReport.status).all()
    result = {s[0]: s[1] for s in stats}
    
    return {
        "pending": result.get("pending", 0),
        "diproses": result.get("diproses", 0),
        "selesai": result.get("selesai", 0)
    }

@app.get("/reports/recent")
async def get_recent_reports(
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.get_current_user)
):
    query = db.query(models.AllReport)

    if current_user["role"] == "admin":
        query = query.filter(models.AllReport.department == current_user["department"])
    elif current_user["role"] == "citizen":
        query = query.filter(models.AllReport.user_id == str(current_user["id"]))
    
    reports = query.order_by(models.AllReport.created_at.desc()).limit(10).all()

    # PROTEKSI ANONIMITAS: Sembunyikan user_id jika laporan anonim & user adalah Admin 
    for r in reports:
        if r.anonymous and current_user["role"] == "admin":
            r.user_id = "ANONYMOUS"
            
    return reports

@app.put("/reports/{report_id}/status")
async def update_report_status(
    report_id: int, 
    status: str, 
    note: str = "", 
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.get_current_user)
):
    # Validasi: Hanya admin yang boleh update
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    report = db.query(models.AllReport).filter(models.AllReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan")
    
    report.status = status
    report.admin_note = note
    db.commit()
    return {"status": "success"}

# 1. Endpoint untuk melihat SEMUA laporan (Jelajah)
@app.get("/reports/all")
async def get_all_public_reports(
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.get_current_user)
):
    # Mengambil semua laporan, diurutkan dari yang terbaru
    reports = db.query(models.AllReport).order_by(models.AllReport.created_at.desc()).all()
    
    for r in reports:
        if r.anonymous:
            r.user_id = "ANONYMOUS"
            
    return reports

# 2. Endpoint untuk UPVOTE
@app.post("/reports/{report_id}/vote")
async def upvote_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.get_current_user)
):
    report = db.query(models.AllReport).filter(models.AllReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan")
    
    report.vote_count += 1
    db.commit()
    return {"status": "success", "new_count": report.vote_count}