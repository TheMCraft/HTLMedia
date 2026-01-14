@echo off
REM HTLMedia Installation Script for Windows

echo.
echo =========================================
echo   HTLMedia - Installation
echo =========================================
echo.

REM Check Node.js
echo Pruefe Node.js Installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo FEHLER: Node.js nicht gefunden!
    echo Bitte installieren Sie Node.js von: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Node.js gefunden: 
node --version
echo.

REM Install Backend Dependencies
echo [1/3] Installiere Backend-Dependencies...
call npm install
if %errorlevel% neq 0 (
    echo FEHLER bei Backend-Installation!
    pause
    exit /b 1
)
echo [✓] Backend-Dependencies installiert
echo.

REM Install Frontend Dependencies
echo [2/3] Installiere Frontend-Dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo FEHLER bei Frontend-Installation!
    cd ..
    pause
    exit /b 1
)
cd ..
echo [✓] Frontend-Dependencies installiert
echo.

REM Check .env file
echo [3/3] Ueberpruefe .env Datei...
if not exist ".env" (
    echo FEHLER: .env Datei nicht gefunden!
    pause
    exit /b 1
)
echo [✓] .env Datei vorhanden
echo.

echo =========================================
echo   Installation erfolgreich!
echo =========================================
echo.
echo Naechste Schritte:
echo.
echo 1. Oeffne 2 Terminal-Fenster
echo.
echo    Terminal 1 - Backend:
echo    $ npm start
echo.
echo    Terminal 2 - Frontend:
echo    $ cd frontend
echo    $ npm run dev
echo.
echo 2. Oeffne http://localhost:5173 im Browser
echo.
echo 3. Registriere einen Benutzer
echo.
echo 4. Um Admin zu werden, fuehre aus:
echo    UPDATE users SET role = 'admin' WHERE username = 'YOUR_USERNAME';
echo.
echo Dokumentation: README.md oder QUICKSTART.md
echo.
pause
