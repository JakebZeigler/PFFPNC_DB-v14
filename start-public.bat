@echo off
echo Starting PFFPNC Database Management System with Public Access
echo.

echo Step 1: Setting up MySQL database...
cd server
call npm run init-db
if %errorlevel% neq 0 (
    echo ERROR: Database initialization failed. Please check your MySQL credentials in server\.env
    pause
    exit /b 1
)

echo.
echo Step 2: Starting backend server...
start "Backend Server" cmd /k "npm start"

echo.
echo Step 3: Starting frontend...
cd ..
start "Frontend Server" cmd /k "npm run dev"

echo.
echo Step 4: Setting up public access with ngrok...
echo Please install ngrok from https://ngrok.com/download if not already installed
echo.
echo After both servers start, run these commands in separate terminals:
echo   ngrok http 3001  (for backend API)
echo   ngrok http 5173  (for frontend)
echo.
echo Then update your .env file with the ngrok backend URL and restart the frontend.
echo.
pause
