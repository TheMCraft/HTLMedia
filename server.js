require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3030;
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || `http://localhost:${process.env.PORT || 3030}`;

// Upload directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Overlays directory
const overlaysDir = path.join(__dirname, 'overlays');
if (!fs.existsSync(overlaysDir)) {
  fs.mkdirSync(overlaysDir, { recursive: true });
}

// Fonts directory
const fontsDir = path.join(__dirname, 'fonts');
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

// Logo directory
const logosDir = path.join(__dirname, 'logos');
if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
}

// Multer configuration für Nutzer-Fotos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Format: userid-timestamp.ext
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${req.session.userId}-${timestamp}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    // Nur Bilder akzeptieren
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Nur Bilder sind erlaubt'));
    }
  }
});

// Multer configuration für Overlays
const overlayStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, overlaysDir);
  },
  filename: (req, file, cb) => {
    // Format: overlay-type-timestamp.ext (z.B. overlay-vertical-1234567890.png)
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const overlayType = req.body.overlayType || 'overlay';
    const filename = `${overlayType}-${timestamp}${ext}`;
    cb(null, filename);
  }
});

const overlayUpload = multer({
  storage: overlayStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    // Nur Bilder akzeptieren
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Nur Bilder sind erlaubt'));
    }
  }
});

// Font Upload Configuration
const fontStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, fontsDir);
  },
  filename: (req, file, cb) => {
    // Format: font-timestamp.ext (z.B. font-1234567890.otf)
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `font-${timestamp}${ext}`;
    cb(null, filename);
  }
});

const fontUpload = multer({
  storage: fontStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB für Fonts
  fileFilter: (req, file, cb) => {
    // Akzeptiere .otf, .ttf, .woff
    const validMimes = ['font/otf', 'application/x-font-opentype', 'font/ttf', 'application/x-font-truetype', 'font/woff'];
    const validExts = ['.otf', '.ttf', '.woff'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (validExts.includes(ext) || validMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Nur .otf, .ttf und .woff Dateien sind erlaubt'));
    }
  }
});

// Logo Upload Configuration
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, logosDir);
  },
  filename: (req, file, cb) => {
    // Format: logo-timestamp.ext
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `logo-${timestamp}${ext}`;
    cb(null, filename);
  }
});

const logoUpload = multer({
  storage: logoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB für Logos
  fileFilter: (req, file, cb) => {
    // Nur Bilder akzeptieren
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Nur Bilder sind erlaubt'));
    }
  }
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// CORS & Cookies Middleware - für ALLE Requests (API + Uploads)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || 'http://localhost:4173');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Expose-Headers', 'Content-Type, Content-Length');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Access-Control-Max-Age', '3600');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Session konfigurieren
app.use(session({
  secret: process.env.SESSION_SECRET || 'themcraft-session-secret-2026',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: false,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 // 24 Stunden
  }
}));

// Static files für Uploads - MUSS VOR den API Routes sein!
app.use('/uploads', express.static(uploadsDir, {
  maxAge: '1d',
  etag: false
}));

// Static files für Overlays - MUSS VOR den API Routes sein!
app.use('/overlays', express.static(overlaysDir, {
  maxAge: '1d',
  etag: false
}));

// Static files für Fonts - MUSS VOR den API Routes sein!
app.use('/fonts', express.static(fontsDir, {
  maxAge: '1d',
  etag: false
}));

// Static files für Logos - MUSS VOR den API Routes sein!
app.use('/logos', express.static(logosDir, {
  maxAge: '1d',
  etag: false
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
          role ENUM('user', 'admin') DEFAULT 'user',
          active TINYINT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('✓ Benutzertabelle vorhanden');

      // Stelle sicher, dass active Spalte existiert
      try {
        await conn.execute(`
          ALTER TABLE users ADD COLUMN IF NOT EXISTS active TINYINT DEFAULT 0
        `);
        console.log('✓ active Spalte in users-Tabelle vorhanden');
      } catch (err) {
        // Spalte existiert wahrscheinlich bereits oder andere Fehler - ignorieren
        console.log('Hinweis: active Spalte existiert möglicherweise bereits');
      }

      // Fotostabelle erstellen (falls nicht vorhanden)
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS photos (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          filename VARCHAR(255) NOT NULL,
          original_filename VARCHAR(255) NOT NULL,
          mime_type VARCHAR(50) NOT NULL,
          size INT NOT NULL,
          version INT DEFAULT 1,
          finished TINYINT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX (user_id)
        )
      `);
      console.log('✓ Fotostabelle vorhanden');

      // Stelle sicher, dass finished Spalte existiert
      try {
        await conn.execute(`
          ALTER TABLE photos ADD COLUMN IF NOT EXISTS finished TINYINT DEFAULT 0
        `);
      } catch (err) {
        // Spalte existiert wahrscheinlich bereits oder andere Fehler - ignorieren
        console.log('Hinweis: finished Spalte existiert möglicherweise bereits');
      }


      // Overlays-Tabelle erstellen (falls nicht vorhanden)
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS overlays (
          id INT AUTO_INCREMENT PRIMARY KEY,
          filename VARCHAR(255) NOT NULL UNIQUE,
          overlay_type ENUM('vertical', 'horizontal') NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✓ Overlays-Tabelle vorhanden');

      // Fonts table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS fonts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          filename VARCHAR(255) NOT NULL UNIQUE,
          font_type ENUM('title', 'description', 'general') NOT NULL DEFAULT 'general',
          filesize INT NOT NULL,
          uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✓ Fonts-Tabelle vorhanden');

      // Migration: Add font_type column to fonts table if it doesn't exist
      try {
        await conn.execute('SELECT font_type FROM fonts LIMIT 1');
      } catch (e) {
        if (e.code === 'ER_BAD_FIELD_ERROR') {
          console.warn('WARNUNG: `fonts` Tabelle hat eine veraltete Struktur (fehlt font_type) und wird aktualisiert.');
          try {
            await conn.execute("ALTER TABLE fonts ADD COLUMN font_type ENUM('title', 'description', 'general') NOT NULL DEFAULT 'general'");
            console.log('✓ `fonts` Tabelle wurde erfolgreich aktualisiert (font_type hinzugefügt).');
          } catch (alterError) {
            console.error('❌ FEHLER beim Aktualisieren der `fonts` Tabelle:', alterError);
            throw alterError;
          }
        } else {
          throw e;
        }
      }

      // Logo table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS logo (
          id INT AUTO_INCREMENT PRIMARY KEY,
          filename VARCHAR(255) NOT NULL,
          filesize INT NOT NULL,
          uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✓ Logo-Tabelle vorhanden');

      // Settings table (key-value)
      await conn.query(`
        CREATE TABLE IF NOT EXISTS settings (
          setting_key VARCHAR(50) PRIMARY KEY,
          setting_value TEXT
        )
      `);
      console.log('✓ Settings-Tabelle vorhanden');

      // Migration: Check if settings table has the correct columns, if not, recreate it.
      try {
        await conn.execute('SELECT setting_key, setting_value FROM settings LIMIT 1');
      } catch (e) {
        if (e.code === 'ER_BAD_FIELD_ERROR') { // ER_BAD_FIELD_ERROR is the code for an unknown column
          console.warn('WARNUNG: `settings` Tabelle hat eine veraltete Struktur und wird neu erstellt.');
          try {
            await conn.execute('DROP TABLE settings');
            await conn.query(`
              CREATE TABLE settings (
                setting_key VARCHAR(50) PRIMARY KEY,
                setting_value TEXT
              )
            `);
            console.log('✓ `settings` Tabelle wurde erfolgreich neu erstellt.');
          } catch (recreateError) {
            console.error('❌ FEHLER beim Neuerstellen der `settings` Tabelle:', recreateError);
            throw recreateError;
          }
        } else {
          // For other errors, re-throw them
          throw e;
        }
      }
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
    // Send a 401 Unauthorized status, which is appropriate for API endpoints
    res.status(401).json({ error: 'Nicht authentifiziert' });
  }
}

// API Routes only (React frontend handles all page rendering)
// No HTML routes needed since React SPA handles everything on localhost:5173

// Registrierung
app.post('/api/register', async (req, res) => {
  const { username, password, confirmPassword } = req.body;

  if (!username || !password || password !== confirmPassword) {
    return res.status(400).json({ error: 'Ungültige Eingaben' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const connection = await dbPool.getConnection();
    
    try {
      await connection.execute(
        'INSERT INTO users (username, password) VALUES (?, ?)',
        [username, hashedPassword]
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
        'SELECT id, username, password, role, active FROM users WHERE username = ?',
        [username]
      );

      if (rows.length === 0) {
        return res.status(401).json({ error: 'Benutzer nicht gefunden' });
      }

      const user = rows[0];

      // Überprüfe, ob Account aktiv ist
      if (!user.active) {
        return res.status(403).json({ error: 'Account ist nicht aktiviert. Bitte kontaktiere einen Administrator.' });
      }

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
        'SELECT id, username, role, active, created_at FROM users ORDER BY created_at DESC'
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
  const { username, password, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username und Passwort erforderlich' });
  }

  const userRole = (role === 'admin') ? 'admin' : 'user';

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const connection = await dbPool.getConnection();
    
    try {
      // Wenn Admin erstellt wird, automatisch aktivieren
      // Wenn User erstellt wird, bleiben sie inaktiv bis der Admin sie aktiviert
      const isActive = (userRole === 'admin') ? 1 : 0;
      
      const [result] = await connection.execute(
        'INSERT INTO users (username, password, role, active) VALUES (?, ?, ?, ?)',
        [username, hashedPassword, userRole, isActive]
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
  const { role, active } = req.body;

  try {
    const connection = await dbPool.getConnection();
    try {
      // Nur role updaten wenn active nicht gesetzt
      if (active !== undefined) {
        await connection.execute(
          'UPDATE users SET active = ? WHERE id = ?',
          [active ? 1 : 0, id]
        );
      } else if (role) {
        await connection.execute(
          'UPDATE users SET role = ? WHERE id = ?',
          [role, id]
        );
      }
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

// GET: Alle Fotos aller Benutzer (Admin only)
app.get('/api/admin/photos', requireAdmin, async (req, res) => {
  try {
    const connection = await dbPool.getConnection();
    try {
      const [photos] = await connection.execute(
        `SELECT p.id, p.filename, p.original_filename, p.version, p.finished, p.created_at, p.size, u.username 
         FROM photos p 
         JOIN users u ON p.user_id = u.id 
         ORDER BY p.created_at DESC`
      );
      
      const photosWithUrl = photos.map(photo => ({
        ...photo,
        finished: photo.finished === 1,
        url: `/uploads/${photo.filename}`
      }));
      
      res.json(photosWithUrl);
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Photo Endpoints
// GET: Alle Fotos des Benutzers
app.get('/api/photos', requireLogin, async (req, res) => {
  try {
    const connection = await dbPool.getConnection();
    try {
      const [photos] = await connection.execute(
        'SELECT id, filename, original_filename, version, finished, created_at, size FROM photos WHERE user_id = ? ORDER BY created_at DESC',
        [req.session.userId]
      );
      
      // Füge URL hinzu (vollständige URL für CORS/Fabric)
      const photosWithUrl = photos.map(photo => ({
        ...photo,
        finished: photo.finished === 1,
        url: `/uploads/${photo.filename}`
      }));
      
      res.json(photosWithUrl);
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Neue Fotos hochladen
app.post('/api/photos', requireLogin, upload.single('photo'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Keine Datei hochgeladen' });
  }

  try {
    const connection = await dbPool.getConnection();
    try {
      // Version berechnen: Anzahl der existierenden Fotos mit gleichem Original-Namen + 1
      const [versions] = await connection.execute(
        'SELECT COUNT(*) as count FROM photos WHERE user_id = ? AND original_filename = ?',
        [req.session.userId, req.file.originalname]
      );
      const version = (versions[0]?.count || 0) + 1;

      // Foto in DB speichern
      await connection.execute(
        'INSERT INTO photos (user_id, filename, original_filename, mime_type, size, version) VALUES (?, ?, ?, ?, ?, ?)',
        [
          req.session.userId,
          req.file.filename,
          req.file.originalname,
          req.file.mimetype,
          req.file.size,
          version
        ]
      );

      res.json({
        success: true,
        message: 'Foto hochgeladen!',
        filename: req.file.filename
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    // Datei löschen wenn DB-Error
    if (req.file?.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Fehler beim Löschen der Datei:', err);
      });
    }
    res.status(500).json({ error: error.message });
  }
});

// POST: Neue Foto-Version speichern (vom Editor)
app.post('/api/photos/version', requireLogin, upload.single('photo'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Keine Datei hochgeladen' });
  }

  const originalPhotoId = req.body.originalPhotoId;
  if (!originalPhotoId) {
    // Datei löschen wenn validation error
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Fehler beim Löschen der Datei:', err);
    });
    return res.status(400).json({ error: 'Original-Foto-ID erforderlich' });
  }

  try {
    const isAdmin = req.session.role === 'admin';
    const connection = await dbPool.getConnection();
    try {
      // Original-Foto abrufen
      // Admins dürfen Versionen für alle Fotos erstellen
      let query = 'SELECT id, user_id, original_filename, version FROM photos WHERE id = ?';
      let params = [originalPhotoId];
      
      if (!isAdmin) {
        query += ' AND user_id = ?';
        params.push(req.session.userId);
      }

      const [originalPhotos] = await connection.execute(query, params);

      if (originalPhotos.length === 0) {
        // Datei löschen wenn Photo nicht gefunden
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Fehler beim Löschen der Datei:', err);
        });
        return res.status(404).json({ error: 'Original-Foto nicht gefunden' });
      }

      const originalPhoto = originalPhotos[0];
      const newVersion = (originalPhoto.version || 1) + 1;

      // Check if this is a finish operation
      const isFinished = req.body.finished === 'true';

      // Neue Version speichern
      // Wir behalten die ursprüngliche user_id bei, auch wenn ein Admin editiert
      await connection.execute(
        'INSERT INTO photos (user_id, filename, original_filename, mime_type, size, version, finished) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          originalPhoto.user_id,
          req.file.filename,
          originalPhoto.original_filename,
          req.file.mimetype,
          req.file.size,
          newVersion,
          isFinished ? 1 : 0
        ]
      );

      res.json({
        success: true,
        message: isFinished ? `Bild als fertig markiert!` : `Neue Version (${newVersion}) gespeichert!`,
        filename: req.file.filename,
        version: newVersion,
        finished: isFinished
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    // Datei löschen wenn DB-Error
    if (req.file?.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Fehler beim Löschen der Datei:', err);
      });
    }
    res.status(500).json({ error: error.message });
  }
});

// DELETE: Foto löschen
app.delete('/api/photos/:id', requireLogin, async (req, res) => {
  try {
    const isAdmin = req.session.role === 'admin';
    const connection = await dbPool.getConnection();
    try {
      // Foto von DB abrufen (um Dateiname zu kennen)
      // Admins dürfen alles löschen, User nur ihre eigenen
      let query = 'SELECT filename FROM photos WHERE id = ?';
      let params = [req.params.id];
      
      if (!isAdmin) {
        query += ' AND user_id = ?';
        params.push(req.session.userId);
      }

      const [photos] = await connection.execute(query, params);

      if (photos.length === 0) {
        return res.status(404).json({ error: 'Foto nicht gefunden' });
      }

      const filename = photos[0].filename;

      // Aus DB löschen
      let deleteQuery = 'DELETE FROM photos WHERE id = ?';
      let deleteParams = [req.params.id];

      if (!isAdmin) {
        deleteQuery += ' AND user_id = ?';
        deleteParams.push(req.session.userId);
      }

      await connection.execute(deleteQuery, deleteParams);

      // Datei löschen
      const filePath = path.join(uploadsDir, filename);
      fs.unlink(filePath, (err) => {
        if (err) console.error('Fehler beim Löschen der Datei:', err);
      });

      res.json({ success: true, message: 'Foto gelöscht!' });
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ======================= OVERLAY ENDPOINTS (NUR ADMIN) =======================

// GET: Alle Overlays abrufen (aus DB)
app.get('/api/admin/overlays', requireAdmin, async (req, res) => {
  try {
    const connection = await dbPool.getConnection();
    try {
      const [overlays] = await connection.execute(
        'SELECT id, filename, overlay_type, created_at FROM overlays ORDER BY created_at DESC'
      );

      const result = overlays.map(overlay => ({
        id: overlay.id,
        filename: overlay.filename,
        overlayType: overlay.overlay_type,
        url: `/overlays/${overlay.filename}`,
        createdAt: overlay.created_at
      }));

      res.json(result);
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Neues Overlay hochladen
app.post('/api/admin/overlays', requireAdmin, overlayUpload.single('overlay'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Keine Datei hochgeladen' });
  }

  if (!req.body.overlayType || !['vertical', 'horizontal'].includes(req.body.overlayType)) {
    // Datei löschen wenn validation error
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Fehler beim Löschen der Datei:', err);
    });
    return res.status(400).json({ error: 'Overlay-Typ muss "vertical" oder "horizontal" sein' });
  }

  try {
    const connection = await dbPool.getConnection();
    try {
      // In DB speichern
      await connection.execute(
        'INSERT INTO overlays (filename, overlay_type) VALUES (?, ?)',
        [req.file.filename, req.body.overlayType]
      );

      res.json({
        success: true,
        message: `${req.body.overlayType === 'vertical' ? 'Vertikales' : 'Horizontales'} Overlay hochgeladen!`,
        filename: req.file.filename,
        overlayType: req.body.overlayType,
        url: `/overlays/${req.file.filename}`
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    // Datei löschen wenn DB-Error
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Fehler beim Löschen der Datei:', err);
    });
    res.status(500).json({ error: error.message });
  }
});

// DELETE: Overlay löschen
app.delete('/api/admin/overlays/:id', requireAdmin, async (req, res) => {
  try {
    const connection = await dbPool.getConnection();
    try {
      // Overlay aus DB abrufen
      const [overlays] = await connection.execute(
        'SELECT filename FROM overlays WHERE id = ?',
        [req.params.id]
      );

      if (overlays.length === 0) {
        return res.status(404).json({ error: 'Overlay nicht gefunden' });
      }

      const filename = overlays[0].filename;

      // Aus DB löschen
      await connection.execute(
        'DELETE FROM overlays WHERE id = ?',
        [req.params.id]
      );

      // Datei löschen
      const filePath = path.join(overlaysDir, filename);
      fs.unlink(filePath, (err) => {
        if (err) console.error('Fehler beim Löschen der Datei:', err);
      });

      res.json({ success: true, message: 'Overlay gelöscht!' });
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Nur Overlays für Dropdown auswählen (für alle User)
app.get('/api/overlays/list/:type', requireLogin, async (req, res) => {
  try {
    const overlayType = req.params.type;
    
    if (!['vertical', 'horizontal'].includes(overlayType)) {
      return res.status(400).json({ error: 'Ungültiger Overlay-Typ' });
    }

    const connection = await dbPool.getConnection();
    try {
      const [overlays] = await connection.execute(
        'SELECT id, filename, overlay_type FROM overlays WHERE overlay_type = ? ORDER BY created_at DESC',
        [overlayType]
      );

      const result = overlays.map(overlay => ({
        id: overlay.id,
        filename: overlay.filename,
        url: `/overlays/${overlay.filename}`,
        overlayType: overlay.overlay_type
      }));

      res.json(result);
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ======================= FONT MANAGEMENT =======================

// GET: Alle Fonts für Admin
app.get('/api/admin/fonts', requireAdmin, async (req, res) => {
  try {
    const connection = await dbPool.getConnection();
    try {
      const [fonts] = await connection.execute(
        'SELECT id, filename, filesize, font_type, uploaded_at FROM fonts ORDER BY uploaded_at DESC'
      );

      const result = fonts.map(font => ({
        id: font.id,
        filename: font.filename,
        filesize: font.filesize,
        font_type: font.font_type,
        uploadedAt: font.uploaded_at,
        url: `/fonts/${font.filename}`
      }));

      res.json(result);
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Font hochladen
app.post('/api/admin/fonts', requireAdmin, fontUpload.single('font'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Keine Datei hochgeladen' });
  }

  const fontType = req.body.font_type || 'general';
  if (!['title', 'description', 'general'].includes(fontType)) {
    return res.status(400).json({ error: 'Ungültiger font_type.' });
  }

  try {
    const connection = await dbPool.getConnection();
    try {
      // Speichere Font in der Datenbank
      await connection.execute(
        'INSERT INTO fonts (filename, filesize, font_type) VALUES (?, ?, ?)',
        [req.file.filename, req.file.size, fontType]
      );

      res.json({ success: true, message: 'Font hochgeladen!' });
    } finally {
      connection.release();
    }
  } catch (error) {
    // Lösche Datei wenn Datenbankeintrag fehlschlägt
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Fehler beim Löschen der Datei:', err);
    });
    res.status(500).json({ error: error.message });
  }
});

// DELETE: Font löschen
app.delete('/api/admin/fonts/:id', requireAdmin, async (req, res) => {
  try {
    const connection = await dbPool.getConnection();
    try {
      const [fonts] = await connection.execute(
        'SELECT filename FROM fonts WHERE id = ?',
        [req.params.id]
      );

      if (fonts.length === 0) {
        return res.status(404).json({ error: 'Font nicht gefunden' });
      }

      const filename = fonts[0].filename;

      // Aus DB löschen
      await connection.execute(
        'DELETE FROM fonts WHERE id = ?',
        [req.params.id]
      );

      // Datei löschen
      const filePath = path.join(fontsDir, filename);
      fs.unlink(filePath, (err) => {
        if (err) console.error('Fehler beim Löschen der Datei:', err);
      });

      res.json({ success: true, message: 'Font gelöscht!' });
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Alle Fonts für Editor (für alle User), filterbar nach Typ
app.get('/api/fonts/list', requireLogin, async (req, res) => {
  try {
    const { type } = req.query; // 'title' or 'description'
    const connection = await dbPool.getConnection();
    try {
      let query = 'SELECT id, filename, font_type FROM fonts';
      
      if (type === 'title') {
        query += " WHERE font_type IN ('title', 'general')";
      } else if (type === 'description') {
        query += " WHERE font_type IN ('description', 'general')";
      }
      
      query += ' ORDER BY uploaded_at DESC';

      const [fonts] = await connection.execute(query);

      const result = fonts.map(font => ({
        id: font.id,
        filename: font.filename,
        font_type: font.font_type,
        url: `/fonts/${font.filename}`
      }));

      res.json(result);
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Liefere CSS @font-face für eine Font-ID (ermöglicht konsistentes Einbinden clientseitig)
app.get('/api/fonts/css/:id', async (req, res) => {
  try {
    const fontId = req.params.id;
    const connection = await dbPool.getConnection();
    try {
      const [rows] = await connection.execute('SELECT filename FROM fonts WHERE id = ?', [fontId]);
      if (!rows || rows.length === 0) {
        return res.status(404).send('/* Font not found */');
      }

      const filename = rows[0].filename;
      const ext = path.extname(filename).toLowerCase();
      const family = filename.includes('.') ? filename.substring(0, filename.lastIndexOf('.')) : filename;
      const fontUrl = `/fonts/${filename}`;

      // Bestimme format() für @font-face
      let format = 'truetype';
      if (ext === '.otf') format = 'opentype';
      if (ext === '.woff') format = 'woff';
      if (ext === '.ttf') format = 'truetype';

      const css = `@font-face { font-family: "${family}"; src: url('${fontUrl}') format('${format}'); font-weight: 400; font-style: normal; }
/* Generated by /api/fonts/css/${fontId} */`;

      res.setHeader('Content-Type', 'text/css; charset=utf-8');
      res.send(css);
    } finally {
      connection.release();
    }
  } catch (err) {
    res.status(500).send('/* Error generating font CSS */');
  }
});

// ======================= LOGO MANAGEMENT =======================

// GET: Aktuelles Logo abrufen
app.get('/api/logo', async (req, res) => {
  try {
    const connection = await dbPool.getConnection();
    try {
      const [logos] = await connection.execute(
        'SELECT id, filename FROM logo ORDER BY uploaded_at DESC LIMIT 1'
      );

      if (logos.length > 0) {
        const logo = logos[0];
        res.json({
          id: logo.id,
          filename: logo.filename,
          url: `/logos/${logo.filename}`
        });
      } else {
        res.json({ id: null, filename: null, url: null });
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Logo hochladen (nur Admin)
app.post('/api/admin/logo', requireAdmin, logoUpload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Keine Datei hochgeladen' });
    }

    const connection = await dbPool.getConnection();
    try {
      // Alte Logos löschen
      const [oldLogos] = await connection.execute('SELECT filename FROM logo');
      
      // Neue Logo Eintrag einfügen
      await connection.execute(
        'INSERT INTO logo (filename, filesize) VALUES (?, ?)',
        [req.file.filename, req.file.size]
      );

      // Alte Logodateien löschen
      for (const oldLogo of oldLogos) {
        const oldPath = path.join(logosDir, oldLogo.filename);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      // Alte Logo Einträge löschen (behalte nur den neuesten)
      await connection.execute('DELETE FROM logo WHERE id != LAST_INSERT_ID()');

      res.json({
        success: true,
        message: 'Logo hochgeladen!',
        filename: req.file.filename,
        url: `/logos/${req.file.filename}`
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    // Datei löschen wenn DB-Error
    if (req.file) {
      const filePath = path.join(logosDir, req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    res.status(500).json({ error: error.message });
  }
});

// DELETE: Logo löschen (nur Admin)
app.delete('/api/admin/logo/:id', requireAdmin, async (req, res) => {
  try {
    const connection = await dbPool.getConnection();
    try {
      const [logos] = await connection.execute(
        'SELECT filename FROM logo WHERE id = ?',
        [req.params.id]
      );

      if (logos.length === 0) {
        return res.status(404).json({ error: 'Logo nicht gefunden' });
      }

      const filename = logos[0].filename;

      // Datei löschen
      const filePath = path.join(logosDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Datenbank-Eintrag löschen
      await connection.execute('DELETE FROM logo WHERE id = ?', [req.params.id]);

      res.json({ success: true, message: 'Logo gelöscht!' });
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ======================= SETTINGS MANAGEMENT =======================

// GET: Alle öffentlichen Einstellungen abrufen
app.get('/api/settings', async (req, res) => {
  try {
    const connection = await dbPool.getConnection();
    try {
      const [rows] = await connection.execute('SELECT setting_key, setting_value FROM settings');
      const settings = {};
      rows.forEach(row => {
        try {
          settings[row.setting_key] = JSON.parse(row.setting_value);
        } catch (e) {
          settings[row.setting_key] = row.setting_value;
        }
      });
      res.json(settings);
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT: Einstellungen speichern (nur Admin)
app.post('/api/admin/settings', requireAdmin, async (req, res) => {
  try {
    const settings = req.body;
    const connection = await dbPool.getConnection();
    try {
      for (const [key, value] of Object.entries(settings)) {
        const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
        await connection.execute(
          'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
          [key, valueStr, valueStr]
        );
      }
      res.json({ success: true, message: 'Einstellungen gespeichert!' });
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Alias PUT /api/admin/settings for compatibility if needed
app.put('/api/admin/settings', requireAdmin, async (req, res) => {
  try {
    const settings = req.body;
    const connection = await dbPool.getConnection();
    try {
      for (const [key, value] of Object.entries(settings)) {
        const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
        await connection.execute(
          'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
          [key, valueStr, valueStr]
        );
      }
      res.json({ success: true, message: 'Einstellungen gespeichert!' });
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ======================= NORMAL ROUTES =======================

// Benutzerdaten abrufen
app.get('/api/user', requireLogin, async (req, res) => {
  try {
    const connection = await dbPool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT id, username, role, created_at FROM users WHERE id = ?',
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