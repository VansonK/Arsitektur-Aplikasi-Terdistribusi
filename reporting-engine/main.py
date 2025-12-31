import json
import os
import io
import asyncio
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from aiokafka import AIOKafkaProducer
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from contextlib import asynccontextmanager
from typing import List

# --- KONFIGURASI ---
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:29092")
KAFKA_TOPIC = "New_Reports"
# Masukkan ID Folder yang Anda salin tadi di sini atau via env
FOLDER_ID = os.getenv("GOOGLE_DRIVE_FOLDER_ID", "ID_FOLDER_ANDA")
SERVICE_ACCOUNT_FILE = "service-account.json"
SCOPES = ['https://www.googleapis.com/auth/drive']

# --- HELPER GOOGLE DRIVE ---
def get_drive_service():
    creds = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES)
    return build('drive', 'v3', credentials=creds)

def upload_and_set_public(file_content, file_name, mime_type):
    service = get_drive_service()
    
    # 1. Upload File
    file_metadata = {'name': file_name, 'parents': [FOLDER_ID]}
    media = MediaIoBaseUpload(io.BytesIO(file_content), mimetype=mime_type, resumable=True)
    file = service.files().create(body=file_metadata, media_body=media, fields='id').execute()
    file_id = file.get('id')
    
    # 2. Set Public Permission (Agar FE bisa akses)
    user_permission = {'type': 'anyone', 'role': 'reader'}
    service.permissions().create(fileId=file_id, body=user_permission).execute()
    
    return file_id

# --- LIFESPAN FASTAPI ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inisialisasi Kafka Producer
    app.state.producer = AIOKafkaProducer(
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        value_serializer=lambda v: json.dumps(v).encode('utf-8')
    )
    await app.state.producer.start()
    yield
    await app.state.producer.stop()

app = FastAPI(lifespan=lifespan)

@app.post("/v1/submit-report")
async def submit_report(
    user_id: str = Form(...),
    department: str = Form(...),
    title: str = Form(...),
    description: str = Form(...),
    anonymous: bool = Form(False),
    files: List[UploadFile] = File(...) # Ubah jadi List
):
    try:
        drive_urls = []
        for file in files:
            content = await file.read()
            file_id = upload_and_set_public(content, file.filename, file.content_type)
            drive_urls.append(f"https://drive.google.com/uc?export=view&id={file_id}")

        payload = {
            "user_id": user_id,
            "title": title,
            "description": description,
            "department": department,
            "anonymous": anonymous,
            "multimedia_urls": drive_urls, # Sekarang berupa List of Strings
        }

        await app.state.producer.send_and_wait(KAFKA_TOPIC, payload)
        return {"status": "success", "urls": drive_urls}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))