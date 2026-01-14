require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Session konfigurieren
app.use(session({
  secret: process.env.SESSION_SECRET || 'themcraft-session-secret-2026',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: false,
    maxAge: 1000 * 60 * 60 * 24 // 24 Stunden
  }
}));

// Database Connection Pool
let dbPool;

async function initDatabase() {
  try {
    dbPool = mysql.createPool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Verbindung testen
    const connection = await dbPool.getConnection();
    console.log('✓ Datenbankverbindung erfolgreich!');
    connection.release();

    // Benutzertabelle erstellen (falls nicht vorhanden)
    const conn = await dbPool.getConnection();
    try {
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          email VARCHAR(100),
          role ENUM('user', 'admin') DEFAULT 'user',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('✓ Benutzertabelle vorhanden');
    } finally {
      conn.release();
    }

  } catch (error) {
    console.error('❌ Datenbankfehler:', error.message);
    process.exit(1);
  }
}

// Middleware: Login-Check
function requireLogin(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    res.redirect('/login');
  }
}

// Routes
app.get('/', (req, res) => {
  if (req.session.userId) {
    res.redirect('/dashboard');
  } else {
    res.redirect('/login');
  }
});

// Login-Seite
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/login.html'));
});

// Dashboard (geschützt)
app.get('/dashboard', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/dashboard.html'));
});

// Registrierung
app.post('/api/register', async (req, res) => {
  const { username, password, confirmPassword, email } = req.body;

  if (!username || !password || password !== confirmPassword) {
    return res.status(400).json({ error: 'Ungültige Eingaben' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const connection = await dbPool.getConnection();
    
    try {
      await connection.execute(
        'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
        [username, hashedPassword, email]
      );
      res.json({ success: true, message: 'Registrierung erfolgreich!' });
    } finally {
      connection.release();
    }
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Benutzer existiert bereits' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username und Passwort erforderlich' });
  }

  try {
    const connection = await dbPool.getConnection();
    
    try {
      const [rows] = await connection.execute(
        'SELECT id, username, password FROM users WHERE username = ?',
        [username]
      );

      if (rows.length === 0) {
        return res.status(401).json({ error: 'Benutzer nicht gefunden' });
      }

      const user = rows[0];
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return res.status(401).json({ error: 'Falsches Passwort' });
      }

      // Session setzen - mit Role
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.role = user.role;

      res.json({ success: true, message: 'Login erfolgreich!' });
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout fehlgeschlagen' });
    }
    res.json({ success: true, message: 'Logout erfolgreich' });
  });
});

// Middleware: Admin-Check
function requireAdmin(req, res, next) {
  if (req.session.userId && req.session.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Admin-Rechte erforderlich' });
  }
}

// Admin: Alle User abrufen
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const connection = await dbPool.getConnection();
    try {
      const [users] = await connection.execute(
        'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC'
      );
      res.json(users);
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: User erstellen
app.post('/api/admin/users', requireAdmin, async (req, res) => {
  const { username, password, email, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username und Passwort erforderlich' });
  }

  const userRole = (role === 'admin') ? 'admin' : 'user';

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const connection = await dbPool.getConnection();
    
    try {
      const [result] = await connection.execute(
        'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
        [username, hashedPassword, email || null, userRole]
      );
      res.json({ 
        success: true, 
        message: 'User erstellt!',
        id: result.insertId
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Username existiert bereits' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Admin: User aktualisieren
app.put('/api/admin/users/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { email, role } = req.body;

  try {
    const connection = await dbPool.getConnection();
    try {
      await connection.execute(
        'UPDATE users SET email = ?, role = ? WHERE id = ?',
        [email || null, role, id]
      );
      res.json({ success: true, message: 'User aktualisiert!' });
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: User löschen
app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId;

  if (parseInt(id) === userId) {
    return res.status(400).json({ error: 'Du kannst dich selbst nicht löschen' });
  }

  try {
    const connection = await dbPool.getConnection();
    try {
      await connection.execute('DELETE FROM users WHERE id = ?', [id]);
      res.json({ success: true, message: 'User gelöscht!' });
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Passwort ändern
app.post('/api/admin/users/:id/reset-password', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ error: 'Neues Passwort erforderlich' });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const connection = await dbPool.getConnection();
    try {
      await connection.execute(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, id]
      );
      res.json({ success: true, message: 'Passwort zurückgesetzt!' });
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Benutzerdaten abrufen
app.get('/api/user', requireLogin, async (req, res) => {
  try {
    const connection = await dbPool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
        [req.session.userId]
      );
      if (rows.length > 0) {
        res.json(rows[0]);
      } else {
        res.status(404).json({ error: 'Benutzer nicht gefunden' });
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Server starten
async function startServer() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
