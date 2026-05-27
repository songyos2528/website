@echo off
echo ====================================================
echo Starting Contractor Website (Backend and Frontend)
echo ====================================================

echo [1/2] Starting Backend API...
start cmd /k "cd /d d:\Website\api && node server.js"

echo [2/2] Starting Frontend Website...
start cmd /k "cd /d d:\Website\app && npm run dev"

echo.
echo Both servers are starting in new windows...
echo Please wait a few seconds, then open your browser and go to:
echo http://localhost:5173
echo.
pause
