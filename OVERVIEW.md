# 🎬 HTLMedia - Projektübersicht

## ✅ Implementierte Funktionen

### 1. Backend (Node.js + Express)
- ✓ Express Server mit API-Endpunkten
- ✓ MySQL-Datenbankverbindung
- ✓ Benutzer-Authentifizierung (Registrierung, Login, Logout)
- ✓ Session-Management
- ✓ Passwort-Hashing mit bcryptjs
- ✓ Admin-Panel API für User-Verwaltung
- ✓ Rollen-Basierte Zugriffskontrolle (RBAC)

### 2. Frontend (React + Vite)
- ✓ Login/Registrierungs-Seite
- ✓ User-Dashboard
- ✓ Admin-Panel mit User-Verwaltung
- ✓ Responsive Design
- ✓ Fehlerbehandlung und Validierung
- ✓ API-Proxy in Vite konfiguriert

### 3. Datenbankfeatures
- ✓ Automatische Tabellen-Erstellung
- ✓ Role-Spalte (user/admin)
- ✓ Connection Pooling
- ✓ Timestamps (created_at, updated_at)

### 4. Sicherheit
- ✓ bcryptjs Passwort-Hashing
- ✓ Session-Cookies
- ✓ Prepared Statements gegen SQL-Injection
- ✓ Input-Validierung
- ✓ XSS-Schutz
- ✓ Admin-Middleware für geschützte Routen
- ✓ Umgebungsvariablen in .env

---

## 📁 Dateistruktur

```
HTLMedia/
├── .env                           # Umgebungsvariablen
├── .gitignore                     # Git ignore-Dateien
├── server.js                      # Express Backend
├── config.js                      # Legacy Verschlüsselung
├── package.json                   # Backend Dependencies
├── README.md                      # Vollständige Dokumentation
├── QUICKSTART.md                  # Schneller Start
│
├── frontend/                      # React-Projekt (Vite)
│   ├── package.json
│   ├── vite.config.js             # Vite mit API-Proxy
│   ├── index.html
│   └── src/
│       ├── main.jsx               # Entry Point
│       ├── App.jsx                # Haupt-Komponente
│       ├── App.css                # Global Styles
│       └── components/
│           ├── Login.jsx          # Login/Register
│           ├── Login.css
│           ├── Dashboard.jsx      # User Dashboard
│           ├── Dashboard.css
│           ├── AdminPanel.jsx     # Admin Dashboard
│           └── AdminPanel.css
│
└── public/                        # Legacy HTML (optional)
    ├── login.html
    └── dashboard.html
```

---

## 🚀 Verwendung

### Installation
```bash
npm install                # Backend Dependencies
cd frontend && npm install # Frontend Dependencies
```

### Development
```bash
# Terminal 1: Backend
npm start

# Terminal 2: Frontend
cd frontend && npm run dev
```

### Production
```bash
# Beides zusammen
npm start
# Frontend wird von Backend bereitgestellt
```

---

## 🔌 API-Endpunkte

### Public Endpunkte
- `POST /api/register` - Registrierung
- `POST /api/login` - Login
- `POST /api/logout` - Logout
- `GET /api/user` - Aktuelle User-Daten (mit Session)

### Admin-Only Endpunkte (erfordert Admin-Role)
- `GET /api/admin/users` - Alle User auflisten
- `POST /api/admin/users` - Neuen User erstellen
- `PUT /api/admin/users/:id` - User aktualisieren
- `DELETE /api/admin/users/:id` - User löschen
- `POST /api/admin/users/:id/reset-password` - Passwort zurücksetzen

---

## 🗄️ Datenbank

### Verbindung
- Host: `db.themcraft.com:3306`
- Datenbank: `s68_htlmedia`
- Benutzer: `u68_Co0YRE7C7Q`
- Passwort: `ZkU^f@X43R!nuRAo9E5i5qM6` (in .env)

### Tabelle: users
```
id (INT, Primary Key)
username (VARCHAR, Unique)
password (VARCHAR, bcrypt)
email (VARCHAR)
role (ENUM: 'user' | 'admin')
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

---

## 🛡️ Sicherheitsmerkmale

| Feature | Status | Details |
|---------|--------|---------|
| Passwort-Hashing | ✅ | bcryptjs mit Salt |
| Session-Cookies | ✅ | 24 Stunden, Secure Flag |
| Input-Validierung | ✅ | Client & Server |
| SQL-Injection | ✅ | Prepared Statements |
| XSS-Schutz | ✅ | HTML-Escaping |
| CSRF-Schutz | ⚠️ | Über Cookies/Sessions |
| CORS | ✅ | Vite Proxy |
| Role-Based Access | ✅ | Admin-Middleware |

---

## 📊 Workflow

1. **Benutzer registriert/meldet sich an** → Login-Seite
2. **Session wird erstellt** → req.session mit userId & role
3. **Dashboard wird angezeigt** → je nach Role
   - User → User-Dashboard
   - Admin → Admin-Panel
4. **Admin verwaltet User** → Erstelle/Lösche/Bearbeite User
5. **Logout** → Session wird zerstört

---

## 🎯 Admin-Panel Features

### User-Tabelle mit Aktionen
- 📋 ID, Username, Email, Role, Registrierungsdatum
- 🔄 Role ändern (Admin/User Select-Dropdown)
- 🔑 Passwort zurücksetzen (Prompt mit neuem Passwort)
- 🗑️ User löschen (mit Bestätigung)

### Formular zum Erstellen
- Input: Username (erforderlich)
- Input: Passwort (erforderlich)
- Input: Email (optional)
- Select: Role (User oder Admin)

### Statistiken
- Gesamt User-Anzahl
- Anzahl Admins
- Anzahl normale User

---

## 🔄 Technologie-Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js 4.18.2
- **Datenbank**: MySQL 8+
- **Authentifizierung**: bcryptjs + express-session
- **API**: RESTful mit JSON

### Frontend
- **Framework**: React 18+
- **Build Tool**: Vite
- **Styling**: CSS3 mit Flexbox/Grid
- **API-Client**: Fetch API

### DevOps
- **Environment**: .env Variablen
- **Version Control**: Git + .gitignore
- **Package Manager**: npm

---

## 🚀 Deployment

### Vorbereitung
```bash
# Frontend builden
cd frontend
npm run build

# Dist-Dateien sind im frontend/dist Ordner
```

### Auf Server kopieren
1. server.js + package.json
2. frontend/dist Ordner → public Ordner
3. .env Datei mit Production-Values
4. `npm install` auf dem Server
5. `npm start` oder `npm run dev`

---

## 📝 Nächste Schritte / Erweiterungen

- [ ] Email-Verifizierung
- [ ] Passwort-Reset per Email
- [ ] 2FA (Two-Factor Authentication)
- [ ] User-Profilbilder
- [ ] Activity-Logging
- [ ] Rate-Limiting
- [ ] Dunkles Design-Theme
- [ ] Internationalisierung (i18n)
- [ ] User-Import/Export
- [ ] Advanced Filtering in Admin-Panel

---

## 🆘 Support & Dokumentation

- **README.md** - Vollständige technische Dokumentation
- **QUICKSTART.md** - Schnelle Anleitung zum Starten
- **Code-Kommentare** - In Allen Hauptdateien

---

## 👨‍💻 Autor
TheMCraft

---

**Status**: ✅ Produktionsreif | **Version**: 1.0.0 | **Lizenz**: ISC
