# 🎬 HTLMedia - Login System mit React Admin Panel

Eine vollständige Web-Anwendung mit Benutzer-Authentifizierung, Admin-Panel und Datenbankverbindung.

## ✨ Features

### 🔐 Authentifizierung
- ✓ Benutzerregistrierung und Login
- ✓ Sichere Passwort-Hashing (bcryptjs)
- ✓ Session-Management (express-session)
- ✓ Password-Bestätigung bei Registrierung

### 🛡️ Admin-Panel
- ✓ User-Management (erstellen, löschen, aktualisieren)
- ✓ Rollen-Verwaltung (Admin/User)
- ✓ Passwort-Reset für User
- ✓ E-Mail-Verwaltung
- ✓ Statistiken und Übersicht

### 💾 Datenbankverbindung
- ✓ MySQL-Datenbankverbindung (mysql2)
- ✓ Connection Pooling
- ✓ Automatische Tabellen-Erstellung
- ✓ Sichere Anmeldedaten (.env)

### 🎨 Frontend (React)
- ✓ Modernes UI mit Vite
- ✓ Login/Registrierungs-Seite
- ✓ Admin-Dashboard
- ✓ User-Dashboard
- ✓ Responsive Design
- ✓ Fehlerbehandlung

## 🚀 Installation und Setup

### 1. Node.js Dependencies installieren (Backend)
```bash
npm install
```

### 2. Frontend Dependencies installieren
```bash
cd frontend
npm install
cd ..
```

### 3. Umgebungsvariablen konfigurieren
Die `.env` Datei ist bereits mit den Datenbankdaten erstellt:
```env
PORT=3000
NODE_ENV=development
DB_HOST=db.themcraft.com
DB_PORT=3306
DB_USER=u68_Co0YRE7C7Q
DB_PASSWORD=ZkU^f@X43R!nuRAo9E5i5qM6
DB_NAME=s68_htlmedia
SESSION_SECRET=themcraft-session-secret-2026-htlmedia
```

## ▶️ Anwendung starten

### Terminal 1 - Backend Server starten
```bash
npm start
# oder
npm run dev
```
Server läuft unter: `http://localhost:3000`

### Terminal 2 - React Frontend starten (Vite Dev Server)
```bash
cd frontend
npm run dev
```
Frontend läuft unter: `http://localhost:5173`

### Oder zusammen für Production:
```bash
npm start
# Frontend wird über `/public` bereitgestellt
```

## 📁 Dateistruktur

```
HTLMedia/
├── server.js              # Express-Server mit API-Endpunkte
├── config.js              # Verschlüsselte Konfiguration (Legacy)
├── .env                   # Umgebungsvariablen
├── db.config.enc          # Verschlüsselte DB-Daten (Legacy)
├── package.json           # Backend-Dependencies
├── README.md              # Diese Datei
│
├── public/                # Statische HTML-Dateien (Legacy)
│   ├── login.html
│   └── dashboard.html
│
└── frontend/              # React-Anwendung
    ├── package.json       # Frontend-Dependencies
    ├── vite.config.js     # Vite-Konfiguration (mit API-Proxy)
    ├── index.html
    │
    └── src/
        ├── App.jsx        # Haupt-Komponente
        ├── App.css        # Global Styles
        ├── main.jsx       # Entry Point
        │
        └── components/
            ├── Login.jsx              # Login/Register-Komponente
            ├── Login.css
            ├── Dashboard.jsx          # User-Dashboard
            ├── Dashboard.css
            ├── AdminPanel.jsx         # Admin-Dashboard
            └── AdminPanel.css
```

## 🔌 API-Endpunkte

### Authentifizierung
| Methode | Endpunkt | Beschreibung |
|---------|----------|-------------|
| POST | `/api/register` | Neue User registrieren |
| POST | `/api/login` | User anmelden |
| POST | `/api/logout` | Abmelden |
| GET | `/api/user` | Aktuelle User-Daten |

### Admin-Funktionen (nur für Admins)
| Methode | Endpunkt | Beschreibung |
|---------|----------|-------------|
| GET | `/api/admin/users` | Alle User abrufen |
| POST | `/api/admin/users` | Neuen User erstellen |
| PUT | `/api/admin/users/:id` | User aktualisieren |
| DELETE | `/api/admin/users/:id` | User löschen |
| POST | `/api/admin/users/:id/reset-password` | Passwort zurücksetzen |

## 🗄️ Datenbank-Schema

### Users-Tabelle
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100),
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 🔐 Sicherheitsfeatures

1. **Passwort-Hashing**: bcryptjs mit automatischem Salt
2. **Session-Management**: Sichere Cookies mit 24h Maxage
3. **Input-Validierung**: Client- und Server-side
4. **XSS-Schutz**: HTML-Escaping bei Benutzerdaten
5. **SQL-Injection-Schutz**: Prepared Statements (mysql2)
6. **Role-Based Access Control**: Admin-Middleware
7. **CORS-ready**: Vite Proxy-Konfiguration

## 🎯 Rollen und Berechtigungen

### 👤 User-Rolle
- ✓ Eigene Profildaten anschauen
- ✓ Passwort ändern
- ✗ Andere User verwalten

### 🛡️ Admin-Rolle
- ✓ Alle User anschauen
- ✓ User erstellen/löschen
- ✓ Rollen zuweisen
- ✓ Passwörter zurücksetzen
- ✓ E-Mails aktualisieren
- ✓ Statistiken sehen

## 📝 Test-Benutzer erstellen

Nach dem Start wird automatisch die Tabelle erstellt. Um einen Admin-User manuell zu erstellen:

1. Registrieren Sie sich als normaler User
2. Aktualisieren Sie in der Datenbank die `role` auf `admin`:
```sql
UPDATE users SET role = 'admin' WHERE username = 'your_username';
```

## 🐛 Troubleshooting

### Datenbankverbindung fehlgeschlagen
- Überprüfen Sie .env Datei (Host, Port, Benutzerdaten)
- Stellen Sie sicher, dass die Datenbank erreichbar ist

### Port 3000 bereits in Verwendung
```bash
# Ändern Sie den Port in der .env oder:
PORT=3001 npm start
```

### Frontend verbindet sich nicht zum Backend
- Stellen Sie sicher, dass beide Server laufen
- Überprüfen Sie die vite.config.js Proxy-Konfiguration
- Prüfen Sie Browser-Konsole auf CORS-Fehler

## 📦 Dependencies

### Backend
- **express**: Web-Framework
- **mysql2**: MySQL-Datenbankverbindung
- **bcryptjs**: Passwort-Hashing
- **express-session**: Session-Management
- **dotenv**: Umgebungsvariablen
- **body-parser**: Request-Parsing

### Frontend
- **react**: UI-Framework
- **vite**: Build-Tool und Dev-Server

## 🔄 Workflow

1. **Login-Seite** → Benutzer registriert oder meldet sich an
2. **Session wird erstellt** → Browser speichert Session-Cookie
3. **Rolle wird überprüft**:
   - Admin → Admin-Panel
   - User → User-Dashboard
4. **Admin-Panel** → User-Verwaltung (nur für Admins)
5. **Logout** → Session wird gelöscht

## 🚀 Production Build

Frontend builden:
```bash
cd frontend
npm run build
```

Die generierten Dateien in `frontend/dist` müssen auf den Server kopiert werden.

## 📄 Lizenz
ISC

## 👤 Autor
TheMCraft

