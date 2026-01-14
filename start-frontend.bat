@echo off
REM Start Frontend Dev Server

echo.
echo =======================================
echo   HTLMedia Frontend Dev Server
echo =======================================
echo.

cd frontend

if not exist "node_modules" (
    echo node_modules nicht gefunden, installiere Dependencies...
    call npm install
)

echo Starting Vite Dev Server...
echo.
echo Frontend laueft unter: http://localhost:5173
echo API Proxy zu: http://localhost:3000
echo.
echo Druecke CTRL+C zum Beenden
echo.

npm run dev
