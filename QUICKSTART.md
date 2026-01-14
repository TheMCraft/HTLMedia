# 🚀 Quick Start Guide

## Schritt 1: Dependencies installieren

```bash
# Backend
npm install

# Frontend
cd frontend
npm install
cd ..
```

## Schritt 2: Server starten

### Option A: Backend und Frontend zusammen (Entwicklung)

**Terminal 1 - Backend:**
```bash
npm start
```
→ Server läuft auf `http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
→ Frontend läuft auf `http://localhost:5173`

Öffnen Sie dann: `http://localhost:5173`

---

### Option B: Nur Backend (Production)

```bash
npm start
```

Der Server stellt das React-Frontend automatisch bereit.
→ Öffnen Sie: `http://localhost:3000`

---

## Schritt 3: Benutzer erstellen

### Erste Admin erstellen:

1. Öffnen Sie die Seite und **registrieren** Sie einen Benutzer
2. Gehen Sie in die Datenbank und führen Sie aus:
   ```sql
   UPDATE users SET role = 'admin' WHERE username = 'ihr_benutzername';
   ```
3. **Aktualisieren** Sie die Seite und melden Sie sich erneut an
4. Sie sehen jetzt das Admin-Panel

### Oder: Admin direkt mit API erstellen

```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password123",
    "email": "admin@htlmedia.com"
  }'
```

Dann in der Datenbank aktualisieren:
```sql
UPDATE users SET role = 'admin' WHERE username = 'admin';
```

---

## 📋 Das sehen Sie

### Nach dem Login als normaler User:
- ✓ User-Dashboard mit Profil-Info
- ✓ Rolle und Registrierungsdatum
- ✓ System-Status

### Nach dem Login als Admin:
- 🛡️ Admin-Panel mit User-Tabelle
- ➕ Neue User erstellen
- 🔄 Rollen ändern
- 🔑 Passwörter zurücksetzen
- 🗑️ User löschen
- 📊 Statistiken

---

## 🔧 Fehlerbehebung

### Fehler: "Datenbankverbindung fehlgeschlagen"
```
Überprüfen Sie die .env Datei:
- DB_HOST korrekt?
- DB_PORT = 3306?
- DB_USER korrekt?
- DB_PASSWORD korrekt?
- DB_NAME = s68_htlmedia?
```

### Fehler: "Port 3000 bereits in Verwendung"
```bash
PORT=3001 npm start
```

### Fehler: "Cannot find module 'dotenv'"
```bash
npm install dotenv
```

### Frontend verbindet sich nicht zu API
- Stellen Sie sicher, Backend läuft auf Port 3000
- Prüfen Sie Browser Console (F12 → Console)
- Überprüfen Sie vite.config.js Proxy-Einstellung

---

## 📊 Datenbankinfo

```
Host: db.themcraft.com:3306
Datenbank: s68_htlmedia
User: u68_Co0YRE7C7Q
Password: ZkU^f@X43R!nuRAo9E5i5qM6
```

---

## ✅ Das ist alles!

Ihre HTLMedia-Anwendung ist bereit zu verwenden! 🎉

Viel Erfolg! 🚀
