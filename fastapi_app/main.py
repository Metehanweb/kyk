import os
import django

# 1. Initialize Django environment first before any ORM models are accessed
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from fastapi_app.routers import (
    auth as auth_router,
    complaints as complaints_router,
    announcements as announcements_router,
    blocks as blocks_router,
    cafeteria as cafeteria_router,
    stats as stats_router,
    admin as admin_router,
)

app = FastAPI(
    title="Kırşehir Mucur Elvin Buğra Arslan Yurdu API",
    description="GSB Kırşehir Mucur Elvin Buğra Arslan Öğrenci Yurdu Bütünleşik İletişim ve Talep Yönetim Sistemi RESTful API Servisi",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Configuration
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000")
origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers with prefix /api/v1
app.include_router(auth_router.router, prefix="/api/v1")
app.include_router(complaints_router.router, prefix="/api/v1")
app.include_router(announcements_router.router, prefix="/api/v1")
app.include_router(blocks_router.router, prefix="/api/v1")
app.include_router(cafeteria_router.router, prefix="/api/v1")
app.include_router(stats_router.router, prefix="/api/v1")
app.include_router(admin_router.router, prefix="/api/v1")


@app.get("/api/v1/health", tags=["Sistem"])
async def health_check():
    return {
        "status": "online",
        "service": "Kırşehir Mucur Elvin Buğra Arslan Yurdu Bütünleşik İletişim Platformu",
        "version": "1.0.0",
        "database": "PostgreSQL 18 Connected"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("fastapi_app.main:app", host="127.0.0.1", port=8000, reload=True)
