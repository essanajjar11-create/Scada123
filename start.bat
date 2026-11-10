@echo off
title SCADA & SAS Digital Twin Launcher
color 0B
cd /d "%~dp0"

echo =========================================================================
echo    SCADA & SAS DIGITAL TWIN 132/13.8 kV - SYSTEM LAUNCHER
echo =========================================================================
echo.

:: Free port 3000 if occupied by stale node process
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo [INFO] Freeing occupied port 3000 ^(PID %%a^)...
    taskkill /f /pid %%a >nul 2>&1
)

where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js ^(v18+^) from https://nodejs.org/
    pause
    exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
    echo [ERROR] npm is not found in PATH!
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo [INFO] Dependencies not found. Installing packages with npm install...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed successfully.
)

echo [INFO] Starting SCADA server at http://localhost:3000 ...
start "" /B powershell -WindowStyle Hidden -Command "Start-Sleep -s 3; Start-Process 'http://localhost:3000'"
call npm run dev

pause
