@echo off
echo ========================================
echo   AI Hardware Verification Lab
echo ========================================
echo.

echo Starting Backend API Server...
start "API Server" cmd /k "cd /d D:\projects github\ai-hardware-lab\mcp_server && ..\venv\Scripts\activate && uvicorn server:app --reload"

timeout /t 3 /nobreak

echo Starting Frontend Dashboard Server...
start "Dashboard Server" cmd /k "cd /d D:\projects github\ai-hardware-lab\frontend && ..\venv\Scripts\activate && python serve.py"

timeout /t 2 /nobreak

echo Opening Dashboard in browser...
start http://localhost:3000

echo.
echo ========================================
echo   Both servers are running
echo   API Server   → http://127.0.0.1:8000
echo   Dashboard    → http://localhost:3000
echo ========================================
echo.
echo Close this window when done.
pause