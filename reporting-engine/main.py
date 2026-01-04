import json
import os
import io
import asyncio
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from aiokafka import AIOKafkaProducer
# --- PERUBAHAN IMPORT ---
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
# ------------------------
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from contextlib import asynccontextmanager
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware
from concurrent.futures import ThreadPoolExecutor

executor = ThreadPoolExecutor(max_workers=10)

# --- KONFIGURASI DARI ENV ---
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:29092")
KAFKA_TOPIC = "New_Reports"
FOLDER_ID = os.getenv("GOOGLE_DRIVE_FOLDER_ID")
CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REFRESH_TOKEN = os.getenv("GOOGLE_REFRESH_TOKEN")

# Helper agar upload tidak memblokir event loop
async def upload_to_drive_async(content, file_name, mime_type):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        executor, upload_and_set_public, content, file_name, mime_type
    )

@asynccontextmanager
async def lifespan(app: FastAPI):
    producer = AIOKafkaProducer(
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        value_serializer=lambda v: json.dumps(v).encode('utf-8')
    )
    
    retry_count = 0
    while retry_count < 10:
        try:
            await producer.start()
            print("Producer connected to Kafka successfully!")
            break
        except Exception as e:
            retry_count += 1
            print(f"Kafka not ready (attempt {retry_count}), retrying in 5s...")
            await asyncio.sleep(5)
    
    app.state.producer = producer
    yield
    await app.state.producer.stop()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- HELPER GOOGLE DRIVE (VERSI OAUTH2) ---
def get_drive_service():
    # Membuat kredensial dari Refresh Token
    creds = Credentials(
        None, # Access token dikosongkan karena akan di-refresh otomatis
        refresh_token=REFRESH_TOKEN,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
    )
    
    # Refresh token jika sudah expired
    if not creds.valid:
        creds.refresh(Request())
        
    return build('drive', 'v3', credentials=creds)

def upload_and_set_public(file_content, file_name, mime_type):
    service = get_drive_service()
    
    file_metadata = {'name': file_name, 'parents': [FOLDER_ID]}
    media = MediaIoBaseUpload(io.BytesIO(file_content), mimetype=mime_type, resumable=True)
    
    # Upload ke Drive (Menggunakan kuota akun email kampus Anda)
    file = service.files().create(
        body=file_metadata, 
        media_body=media, 
        fields='id'
    ).execute()
    
    file_id = file.get('id')
    
    # Set Public agar file bisa dibuka via URL
    user_permission = {'type': 'anyone', 'role': 'reader'}
    service.permissions().create(fileId=file_id, body=user_permission).execute()
    
    return file_id

@app.post("/report")
async def submit_report(
    user_id: str = Form(...),
    department: str = Form(...),
    title: str = Form(...),
    description: str = Form(...),
    anonymous: bool = Form(False),
    # Ubah menjadi Optional dan default None atau []
    files: Optional[List[UploadFile]] = File(None) 
):
    try:
        drive_urls = []
        # Cek apakah ada file yang dikirim
        if files:
            for file in files:
                # Pastikan file memiliki nama (bukan file kosong)
                if file.filename:
                    content = await file.read()
                    file_id = await upload_to_drive_async(content, file.filename, file.content_type)
                    drive_urls.append(f"https://drive.google.com/uc?export=view&id={file_id}")

        payload = {
            "user_id": user_id,
            "title": title,
            "description": description,
            "department": department,
            "anonymous": anonymous,
            "multimedia_url": drive_urls, # Ini akan jadi list URL
        }

        await app.state.producer.send_and_wait(KAFKA_TOPIC, payload)
        return {"status": "success", "urls": drive_urls}
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))