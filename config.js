/**
 * DEPRECATED - Diese Datei wird nicht mehr verwendet
 * 
 * Die Datenbankverbindung wird jetzt über .env konfiguriert
 * (siehe .env Datei)
 * 
 * Falls Sie noch .enc-basierte Verschlüsselung benötigen,
 * können Sie diesen Code verwenden. Aber für den Standard-Betrieb
 * ist das nicht nötig.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Verschlüsselungsschlüssel (sollte in einer .env Datei sein)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'themcraft-secure-key-2026-htlmedia-project';

// Datenbank-Anmeldedaten
const dbConfig = {
  host: 'db.themcraft.com',
  port: 3306,
  user: 'u68_Co0YRE7C7Q',
  password: 'ZkU^f@X43R!nuRAo9E5i5qM6',
  database: 's68_htlmedia'
};

// Verschlüsseln der Daten
function encryptConfig(config) {
  const algorithm = 'aes-256-cbc';
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(JSON.stringify(config), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const encData = iv.toString('hex') + ':' + encrypted;
  return encData;
}

// Entschlüsseln der Daten
function decryptConfig(encData) {
  const algorithm = 'aes-256-cbc';
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  
  const parts = encData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return JSON.parse(decrypted);
}

// Speichern in .enc Datei
function saveEncryptedConfig(filename = 'db.config.enc') {
  const encData = encryptConfig(dbConfig);
  const encPath = path.join(__dirname, filename);
  fs.writeFileSync(encPath, encData, 'utf8');
  console.log(`✓ Verschlüsselte Konfiguration gespeichert: ${filename}`);
  return encPath;
}

// Laden aus .enc Datei
function loadEncryptedConfig(filename = 'db.config.enc') {
  const encPath = path.join(__dirname, filename);
  if (!fs.existsSync(encPath)) {
    console.warn(`⚠ Datei nicht gefunden: ${filename}`);
    return null;
  }
  
  const encData = fs.readFileSync(encPath, 'utf8');
  return decryptConfig(encData);
}

module.exports = {
  dbConfig,
  encryptConfig,
  decryptConfig,
  loadEncryptedConfig,
  ENCRYPTION_KEY
};

