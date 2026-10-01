@echo off
chcp 65001 > nul
title Kirsehir Mucur KYK Yurt Talep Yonetim Sistemi

echo ========================================================
echo   KIRSEHIR MUCUR ELVIN BUGRA ARSLAN OGRENCI YURDU
echo   Butunlesik Ariza, Sikayet ve Yemekhane Portali
echo ========================================================
echo.

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo [1/3] PostgreSQL Veritabani baslatiliyor (Port: 5433)...
start "PostgreSQL-Dorm" /B "C:\Program Files\PostgreSQL\18\bin\postgres.exe" -D "%SCRIPT_DIR%pgdata" -p 5433
timeout /t 2 /nobreak > nul

echo [2/3] FastAPI Backend servisi baslatiliyor (Port: 8000)...
start "FastAPI-Backend" /B "%SCRIPT_DIR%venv\Scripts\python.exe" -m uvicorn fastapi_app.main:app --host 127.0.0.1 --port 8000
timeout /t 2 /nobreak > nul

echo [3/3] Vite Frontend baslatiliyor (Port: 5173)...
cd /d "%SCRIPT_DIR%frontend"
start "Vite-Frontend" /B cmd /c "npm run dev -- --host 127.0.0.1"
cd /d "%SCRIPT_DIR%"

timeout /t 3 /nobreak > nul

echo.
echo ========================================================
echo   TUM SISTEMLER BASARIYLA CALISIYOR!
echo   Frontend Web Arayuzu : http://localhost:5173
echo   Swagger API Belgeleri: http://127.0.0.1:8000/docs
echo.
echo   Ilk Yonetici (Admin) Girisi:
echo   T.C. Kimlik No : 11111111110
echo   Sifre          : admin123
echo ========================================================
echo.

start http://localhost:5173
exit /b 0
