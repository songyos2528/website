@echo off
echo Starting Website Application...
echo.

REM Kill existing processes on ports 3000 and 5173
echo Cleaning up old processes...
taskkill /F /IM node.exe 2>nul

REM Wait a moment
timeout /t 2 /nobreak

echo.
echo Starting API Server...
cd /d D:\Website\api
start "API Server" npm start

REM Wait for API to start
timeout /t 3 /nobreak

echo.
echo Starting React Development Server...
cd /d D:\Website\app
start "React Dev Server" npm run dev

echo.
echo Both servers are starting...
echo - API Server: http://localhost:3000
echo - React App: http://localhost:5173
echo.
pause
