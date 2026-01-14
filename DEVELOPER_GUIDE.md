# 🎬 HTLMedia - Entwickler Guide

## Projektstruktur

```
HTLMedia/
├── Backend (Node.js + Express)
│   ├── server.js              Main Server mit API
│   ├── config.js              Verschlüsselung (optional)
│   └── package.json           Dependencies
│
├── Frontend (React + Vite)
│   └── frontend/
│       ├── src/
│       │   ├── App.jsx        Main Component (Routing)
│       │   └── components/
│       │       ├── Login.jsx   Auth Component
│       │       ├── Dashboard.jsx User Dashboard
│       │       └── AdminPanel.jsx Admin Dashboard
│       └── vite.config.js     API Proxy Setup
│
├── Dokumentation
│   ├── README.md              Technische Docs
│   ├── QUICKSTART.md          Getting Started
│   └── OVERVIEW.md            Project Overview
│
└── Scripts
    ├── install.bat            Installation
    ├── start-backend.bat      Backend starten
    └── start-frontend.bat     Frontend starten
```

---

## 🚀 Entwicklungs-Workflow

### 1. Projekt klonen/öffnen
```bash
cd HTLMedia
```

### 2. Installation
```bash
# Option A: Automatisch (Windows)
install.bat

# Option B: Manuell
npm install
cd frontend && npm install
```

### 3. Development starten
```bash
# Terminal 1: Backend
npm start

# Terminal 2: Frontend
cd frontend && npm run dev
```

### 4. Im Browser öffnen
```
Frontend: http://localhost:5173
Backend: http://localhost:3000
```

---

## 📝 Code-Standards

### Backend (Express)
```javascript
// API Endpoints folgen RESTful Convention
GET    /api/resource      - Alle abrufen
POST   /api/resource      - Neue erstellen
PUT    /api/:id           - Aktualisieren
DELETE /api/:id           - Löschen

// Middleware Pattern
app.get('/protected', requireLogin, (req, res) => {
  // session.userId verfügbar
});

// Datenbank Queries
const [rows] = await connection.execute(
  'SELECT * FROM table WHERE id = ?',
  [id]  // Prepared Statement
);
```

### Frontend (React)
```jsx
// Komponenten sind funktional (Hooks)
export default function Component() {
  const [state, setState] = useState(initialValue);
  
  useEffect(() => {
    // Daten laden
  }, []);
  
  return <div>JSX</div>;
}

// API Calls
const response = await fetch('/api/endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

---

## 🔐 Authentication Flow

```
1. User registriert → /api/register
   └─ Passwort wird mit bcrypt gehasht
   └─ User wird in DB gespeichert

2. User meldet sich an → /api/login
   └─ Passwort wird mit bcrypt verglichen
   └─ Session wird erstellt (req.session.userId)
   └─ Session wird in Cookie gespeichert

3. Frontend checkt Session → /api/user
   └─ Wenn angemeldet → Benutzerdaten zurück
   └─ Wenn nicht → 401 Unauthorized

4. Admin-Check für Admin-Routes
   └─ requireAdmin Middleware prüft req.session.role === 'admin'
   └─ Wenn nicht → 403 Forbidden
```

---

## 🗄️ Datenbank-Query-Beispiele

### User erstellen
```javascript
const hashedPassword = await bcrypt.hash(password, 10);
await connection.execute(
  'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
  [username, hashedPassword, email, 'user']
);
```

### User aktualisieren
```javascript
await connection.execute(
  'UPDATE users SET role = ?, email = ? WHERE id = ?',
  ['admin', email, userId]
);
```

### User löschen
```javascript
await connection.execute(
  'DELETE FROM users WHERE id = ?',
  [userId]
);
```

---

## 🎯 Häufige Änderungen

### Neuen API-Endpoint hinzufügen

**Backend (server.js):**
```javascript
// Route
app.get('/api/newendpoint', requireLogin, async (req, res) => {
  try {
    // Logic
    res.json({ success: true, data: ... });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Frontend (component):**
```javascript
const response = await fetch('/api/newendpoint');
const data = await response.json();
```

### Neue Komponente hinzufügen

**Datei:** `frontend/src/components/NewComponent.jsx`
```jsx
import './NewComponent.css';

export default function NewComponent() {
  return <div>Inhalt</div>;
}
```

**In App.jsx importieren:**
```jsx
import NewComponent from './components/NewComponent';
```

### Datenbankfeld hinzufügen

1. Migrieren Sie manuell oder nutzen Sie ALTER TABLE:
```sql
ALTER TABLE users ADD COLUMN newfield VARCHAR(255);
```

2. Update in server.js:
```javascript
const [rows] = await connection.execute(
  'SELECT id, username, newfield FROM users WHERE id = ?',
  [id]
);
```

---

## 🐛 Debugging

### Backend Debug
```javascript
// In server.js
console.log('Debug:', variable);

// Mit Nodemon (auto-reload)
npm install -D nodemon
// In package.json: "dev": "nodemon server.js"
```

### Frontend Debug
```javascript
// In React Components
console.log('State:', state);

// Browser DevTools (F12)
// Network Tab → API Calls überprüfen
// Console Tab → Errors sehen
```

### Datenbank Debug
```sql
-- Terminal mit mysql2 verbinden
mysql -h db.themcraft.com -u u68_Co0YRE7C7Q -p s68_htlmedia

-- Queries testen
SELECT * FROM users;
```

---

## 📊 Testing

### Manual Testing
```bash
# Registrierung
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123","email":"test@example.com"}'

# Login
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'

# User-Daten
curl http://localhost:3000/api/user
```

---

## 🚀 Production Deployment

### Frontend builden
```bash
cd frontend
npm run build
# Erzeugt frontend/dist Ordner
```

### Auf Server deployen
```bash
# .env mit Production-Values setzen
# Datenbankverbindung überprüfen
# npm install
npm start
```

### Checklist
- [ ] .env Variablen überprüfen
- [ ] Datenbank erreichbar?
- [ ] Frontend dist/ folder existiert
- [ ] PORT ist nicht blockiert
- [ ] SSL/HTTPS aktiviert (optional)
- [ ] Backups erstellt

---

## 📚 Wichtige Dependencies

### Backend
- **express** - Web Framework
- **mysql2** - DB Driver
- **bcryptjs** - Password Hashing
- **express-session** - Sessions
- **dotenv** - Environment Variables

### Frontend
- **react** - UI Library
- **vite** - Build Tool

---

## 🆘 Fehler beheben

| Fehler | Lösung |
|--------|--------|
| Cannot find module 'express' | `npm install` |
| Database connection refused | .env Daten überprüfen |
| Port already in use | `PORT=3001 npm start` |
| CORS error | vite.config.js Proxy überprüfen |
| undefined is not a function | Check imports & exports |

---

## 🎓 Learning Resources

- React: https://react.dev
- Express: https://expressjs.com
- MySQL: https://dev.mysql.com/doc/
- Vite: https://vitejs.dev

---

**Happy Coding! 🚀**
