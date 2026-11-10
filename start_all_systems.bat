@echo off
title 132/13.8 kV SUBSTATION SCADA & MATLAB DIGITAL TWIN MASTER LAUNCHER
color 0B
cd /d "%~dp0"

echo =========================================================================
echo    132/13.8 kV SUBSTATION AUTOMATION & DIGITAL TWIN UNIFIED LAUNCHER
echo    Real-Time Co-Simulation: Web SCADA (React 19) + MATLAB / Simulink
echo =========================================================================
echo.

:: 1. Free port 3000 if occupied by stale background node process
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo [INFO] Freeing occupied port 3000 ^(PID %%a^)...
    taskkill /f /pid %%a >nul 2>&1
)

:: 2. Verify Node.js Environment
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is not found in PATH!
    echo Please install Node.js ^(v18+^) from https://nodejs.org/
    pause
    exit /b 1
)

:: 3. Check and Install Node.js Dependencies if Missing
if not exist "node_modules\" (
    echo [INFO] Installing Node.js dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
)

:: 4. Check MATLAB Availability
set MATLAB_EXE=matlab
where matlab >nul 2>nul
if errorlevel 1 (
    if exist "C:\Program Files\MATLAB\R2023b\bin\matlab.exe" (
        set "MATLAB_EXE=C:\Program Files\MATLAB\R2023b\bin\matlab.exe"
    ) else if exist "C:\Program Files\MATLAB\R2024a\bin\matlab.exe" (
        set "MATLAB_EXE=C:\Program Files\MATLAB\R2024a\bin\matlab.exe"
    ) else if exist "C:\Program Files\MATLAB\R2023a\bin\matlab.exe" (
        set "MATLAB_EXE=C:\Program Files\MATLAB\R2023a\bin\matlab.exe"
    ) else (
        echo [WARNING] MATLAB not found in PATH or standard Program Files.
        echo Web SCADA will run in standalone mode with embedded telemetry.
        set MATLAB_FOUND=0
    )
)
if not defined MATLAB_FOUND set MATLAB_FOUND=1

echo.
echo [1/3] Starting Web SCADA Server on http://localhost:3000 ...
start "" /B powershell -WindowStyle Hidden -Command "Start-Sleep -s 3; Start-Process 'http://localhost:3000'"

if "%MATLAB_FOUND%"=="1" (
    echo [2/3] Launching MATLAB Co-Simulation Daemon ^& HMI Dashboard...
    start "" "%MATLAB_EXE%" -nosplash -r "try, cd('%~dp0matlab/cosim'); run_continuous_bridge('http://127.0.0.1:3000', 1.5); catch ME, disp(ME.message); end; try, cd('%~dp0matlab/gui'); substation_scada_dashboard(); catch ME, disp(ME.message); end;"
) else (
    echo [2/3] Skipping MATLAB launch ^(MATLAB executable not found in PATH^).
)

echo [3/3] System running in synchronized Co-Simulation mode!
echo -------------------------------------------------------------------------
echo Press Ctrl+C in this terminal to stop the Web SCADA server.
echo =========================================================================
echo.

call npm run dev
pause
