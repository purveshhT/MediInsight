@echo off
title MediInsight AI - Startup Launcher
echo ===============================================================================
echo            MEDIINSIGHT AI - HEALTHCARE ANALYTICS PLATFORM
echo ===============================================================================
echo.
echo Starting FastAPI Backend on http://localhost:8000 ...
start "MediInsight Backend (FastAPI)" cmd /k "cd /d %~dp0backend && C:\Users\Impur\AppData\Local\Programs\Python\Python313\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 3 /nobreak > nul

echo Starting React Frontend on http://localhost:5173 ...
start "MediInsight Frontend (Vite)" cmd /k "cd /d %~dp0frontend && C:\nvm4w\nodejs\npm.cmd run dev -- --host 0.0.0.0"

timeout /t 3 /nobreak > nul

echo Opening browser at http://localhost:5173 ...
start http://localhost:5173

echo.
echo ===============================================================================
echo MediInsight AI is running!
echo - Doctor Workspace:    http://localhost:5173/doctor
echo - Analytics Workspace: http://localhost:5173/analytics
echo - FastAPI Docs:        http://localhost:8000/api/docs
echo ===============================================================================
echo Press any key to stop both services when done.
pause > nul

