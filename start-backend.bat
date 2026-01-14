@echo off
REM Start Backend Server

echo.
echo =======================================
echo   HTLMedia Backend Server
echo =======================================
echo.

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo FEHLER: Node.js nicht gefunden!
    echo Bitte installieren Sie Node.js
    pause
    exit /b 1
)

echo Starting Backend Server...
echo.
echo Server laueft unter: http://localhost:3000
echo.
echo Druecke CTRL+C zum Beenden
echo.

npm start
