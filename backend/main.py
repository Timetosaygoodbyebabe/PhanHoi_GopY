from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Any
import httpx
import base64
import os
import re
from datetime import datetime
from dotenv import load_dotenv

# Load biến môi trường từ file .env
load_dotenv()

app = FastAPI(title="API Trung Gian Zalo Mini App Góp Ý")

# Cấu hình CORS để cho phép Frontend Zalo Mini App gọi qua
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_URL = os.getenv("API_BASE_URL", "https://gopy.danang.gov.vn/api")
USERNAME = os.getenv("API_USERNAME", "appdnsmartcity")
PASSWORD = os.getenv("API_PASSWORD", "6LklPeKBZL5YTTzNGefenw0RhGfIWiiX")

# Model dữ liệu nhận từ Zalo Mini App
class FeedbackRequest(BaseModel):
    name: str
    email: Optional[str] = ""
    phone: str
    content: str
    location: Optional[str] = ""
    media_base64: Optional[str] = None # Data ảnh định dạng base64 từ Zalo App
    media_name: Optional[str] = "image.jpg"

def get_auth_header():
    credentials = f"{USERNAME}:{PASSWORD}"
    encoded = base64.b64encode(credentials.encode()).decode()
    return {"Authorization": f"Basic {encoded}"}

async def upload_file_to_1022(base64_content: str, file_name: str) -> Optional[dict]:
    url = f"{BASE_URL}/gopy/file"
    payload = {
        "ten": file_name,
        "base64Content": base64_content
    }
    headers = get_auth_header()
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, headers=headers)
            if response.status_code == 200:
                res_data = response.json()
                return {"url": res_data.get("base64Content"), "ten": file_name}
        except Exception as e:
            print(f"Lỗi upload file: {e}")
    return None

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Backend Server is running"}

@app.post("/api/submit-feedback")
async def submit_feedback(data: FeedbackRequest):
    # 1. Nếu có hình ảnh (base64), tiến hành upload ảnh trước
    hinh_anhs = []
    if data.media_base64:
        # Xoá tiền tố data:image/jpeg;base64, nếu frontend có gửi lên
        clean_base64 = re.sub(r'^data:image/.+;base64,', '', data.media_base64)
        upload_result = await upload_file_to_1022(clean_base64, data.media_name)
        if upload_result and upload_result.get("url"):
            hinh_anhs.append({
                "url": upload_result["url"],
                "ten": upload_result["ten"]
            })

    # 2. Đóng gói dữ liệu và gửi Góp ý
    url = f"{BASE_URL}/gopy"
    payload = {
        "userId": 123, 
        "tenDayDu": data.name,
        "email": data.email,
        "soDienThoai": data.phone,
        "tieuDe": "Phản ánh từ Zalo Mini App",
        "noiDungYKien": data.content,
        "noiDienRa": data.location,
        "latitude": 0.0,
        "longitude": 0.0,
        "ngayDienRa": "",
        "thoiGianDienRa": "",
        "videos": "",
        "amThanh": "",
        "hinhAnhs": hinh_anhs,
        "fileDinhKem": {"url": "", "ten": ""},
        "linhVucId": 1,
        "nguonGopY": "AI"
    }
    
    headers = get_auth_header()
    headers["Content-Type"] = "application/json"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, headers=headers)
            if response.status_code == 200:
                return {"success": True, "message": "Gửi góp ý thành công", "data": response.json()}
            else:
                # Nếu API đích lỗi, trả về lỗi nguyên bản
                raise HTTPException(status_code=response.status_code, detail=response.text)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    # Lệnh để chạy server: uvicorn main:app --reload
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
