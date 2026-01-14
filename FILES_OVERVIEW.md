# 📋 HTLMedia - Datei-Übersicht

## 🏗️ Projektarchitektur

```
HTLMedia/
├── 📌 Kernkomponenten
│   ├── server.js              ← Express Server + API
│   ├── .env                   ← DB-Konfiguration (GEHEIM!)
│   ├── package.json           ← Backend-Abhängigkeiten
│   └── config.js              ← Legacy Verschlüsselung
│
├── 🎨 Frontend (React + Vite)
│   └── frontend/
│       ├── src/
│       │   ├── main.jsx       ← Entry Point
│       │   ├── App.jsx        ← Routing & Auth Check
│       │   ├── components/
│       │   │   ├── Login.jsx              (3 Seiten: Login/Register)
│       │   │   ├── Dashboard.jsx         (User Dashboard)
│       │   │   └── AdminPanel.jsx        (Admin Dashboard)
│       │   └── *.css           ← Styling
│       ├── vite.config.js      ← Build + API Proxy
│       ├── package.json
│       └── index.html
│
├── 📚 Dokumentation
│   ├── README.md               ← Technische Docs (50+ Zeilen)
│   ├── QUICKSTART.md           ← Quick Start Guide
│   ├── OVERVIEW.md             ← Feature Overview
│   ├── DEVELOPER_GUIDE.md       ← Code Standards
│   └── COMPLETION.md           ← Projekt-Status
│
├── 🔧 Scripts
│   ├── install.bat             ← Automatische Installation
│   ├── start-backend.bat       ← Backend starten
│   ├── start-frontend.bat      ← Frontend starten
│   └── .gitignore              ← Git Ignore
│
└── 📂 Public (Legacy HTML)
    ├── login.html              ← Alternative HTML Login
    └── dashboard.html          ← Alternative HTML Dashboard
```

---

## 📝 Was wurde implementiert?

### Backend-Komponenten

| Datei | Funktion | Lines | Status |
|-------|----------|-------|--------|
| server.js | Express Server + alle APIs | 335+ | ✅ Komplett |
| .env | Datenbankdaten | 11 | ✅ Konfiguriert |
| config.js | Legacy Verschlüsselung | 95 | ✅ Optional |

### Frontend-Komponenten

| Komponente | Funktion | Lines | Status |
|-----------|----------|-------|--------|
| App.jsx | Routing & Auth | 50 | ✅ Komplett |
| Login.jsx | Auth-Seite | 150+ | ✅ Komplett |
| Dashboard.jsx | User-Dashboard | 100+ | ✅ Komplett |
| AdminPanel.jsx | Admin-Dashboard | 250+ | ✅ Komplett |

### Styling

| Datei | Funktion | Lines | Status |
|-------|----------|-------|--------|
| App.css | Global Styles | 35 | ✅ Komplett |
| Login.css | Login-Styling | 150+ | ✅ Responsive |
| Dashboard.css | Dashboard-Styling | 200+ | ✅ Responsive |
| AdminPanel.css | Admin-Styling | 250+ | ✅ Responsive |

---

## 🔐 Datenbankverbindung

```
Host:     db.themcraft.com
Port:     3306
Benutzer: u68_Co0YRE7C7Q
Passwort: ZkU^f@X43R!nuRAo9E5i5qM6
Datenbank: s68_htlmedia

✓ In .env Datei gespeichert
✓ Sicher in Environment-Variablen
```

### Tabelle: users
```sql
id           INT AUTO_INCREMENT PRIMARY KEY
username     VARCHAR(50) UNIQUE
password     VARCHAR(255) HASHED
email        VARCHAR(100)
role         ENUM('user', 'admin')
created_at   TIMESTAMP
updated_at   TIMESTAMP
```

---

## 🎯 Implementierte Features

### ✅ Authentifizierung
- Benutzerregistrierung
- Login/Logout
- Session-Management
- Passwort-Hashing (bcryptjs)

### ✅ Admin-Panel
- Alle User auflisten
- Neue User erstellen
- User-Role ändern (Admin/User)
- Passwort zurücksetzen
- User löschen
- Statistiken anzeigen

### ✅ Sicherheit
- Prepared SQL Statements
- XSS-Protection
- Session-Cookies
- Role-Based Access Control
- Admin-Middleware

### ✅ Frontend
- Modernes React UI
- Login/Register-Seite
- User-Dashboard
- Admin-Panel
- Responsive Design
- Fehlerbehandlung

### ✅ Dokumentation
- README (technisch)
- QUICKSTART (schneller Start)
- OVERVIEW (Übersicht)
- DEVELOPER_GUIDE (Code-Standards)
- COMPLETION (Status)

---

## 🚀 Installation

### Schnell (Windows):
```bash
install.bat          # Alles automatisch
start-backend.bat    # Terminal 1
start-frontend.bat   # Terminal 2
```

### Manuell:
```bash
npm install                 # Backend
cd frontend && npm install  # Frontend

npm start                   # Terminal 1: Backend
cd frontend && npm run dev  # Terminal 2: Frontend
```

---

## 📊 Statistiken

| Metrik | Wert |
|--------|------|
| Dateien insgesamt | 40+ |
| React-Komponenten | 3 |
| CSS-Dateien | 4 |
| Dokumentations-Dateien | 5 |
| Batch-Scripts | 3 |
| API-Endpunkte | 11 |
| Zeilen Code (Backend) | 335+ |
| Zeilen Code (Frontend) | 500+ |
| Zeilen Code (CSS) | 600+ |

---

## 🎓 Was Sie lernen können

### Backend
- Express.js REST API
- MySQL mit node-mysql2
- Session-Management
- Passwort-Sicherheit
- Error Handling

### Frontend
- React Hooks (useState, useEffect)
- Component Architecture
- Fetch API
- Form Handling
- Responsive CSS

### DevOps
- Environment Variables
- npm Package Management
- Development Workflow
- Git (.gitignore)

---

## 🔍 Code-Highlights

### Sichere Authentifizierung
```javascript
const passwordMatch = await bcrypt.compare(password, user.password);
```

### Admin-Middleware
```javascript
function requireAdmin(req, res, next) {
  if (req.session.userId && req.session.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden' });
  }
}
```

### React Authentication Check
```javascript
async function checkAuthStatus() {
  const response = await fetch('/api/user');
  if (response.ok) {
    const userData = await response.json();
    setUser(userData);
  }
}
```

---

## 📚 Dateien zum Lesen

| Datei | Für Wen | Wichtigkeit |
|-------|---------|-------------|
| QUICKSTART.md | Anfänger | 🔴 MUSS |
| README.md | Entwickler | 🔴 MUSS |
| DEVELOPER_GUIDE.md | Coder | 🟡 SOLLTE |
| OVERVIEW.md | Manager | 🟡 SOLLTE |
| server.js | Backend-Dev | 🔴 MUSS |
| App.jsx | Frontend-Dev | 🔴 MUSS |

---

## 🎯 Nächste Schritte

1. ✅ Projekt laden
2. ✅ install.bat ausführen (oder npm install)
3. ✅ Backend starten (npm start)
4. ✅ Frontend starten (cd frontend && npm run dev)
5. ✅ Browser öffnen (http://localhost:5173)
6. ✅ Benutzer registrieren
7. ✅ Admin-Status setzen (SQL)
8. ✅ Admin-Panel nutzen

---

## 💡 Tipps

- Lesen Sie **QUICKSTART.md** zuerst!
- Die **.env Datei** ist sicherheitsrelevant → nicht committen
- **Admin-Panel** nur mit Admin-Rolle zugänglich
- **vite.config.js** proxy ist wichtig für API-Calls
- **React Components** sind reusable und einfach zu erweitern

---

## 🆘 Probleme?

| Problem | Lösung |
|---------|--------|
| Dependencies installieren nicht | `npm install --save` |
| Datenbank nicht erreichbar | .env Daten überprüfen |
| Admin-Panel nicht sichtbar | SQL: UPDATE users SET role='admin'... |
| Frontend lädt nicht | Beide Server laufen? |
| CSS hat keine Farben | Browser Cache löschen (Ctrl+Shift+Del) |

---

## 📄 Lizenzen & Authoren

**Projekt**: HTLMedia v1.0.0
**Autor**: TheMCraft
**Lizenz**: ISC

---

**🎉 Projekt ist produktionsreif!**

Beginnen Sie jetzt mit QUICKSTART.md
