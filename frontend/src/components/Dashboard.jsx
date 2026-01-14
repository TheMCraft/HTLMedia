import { useState, useEffect } from 'react';
import './Dashboard.css';

export default function Dashboard({ user, onLogout, isAdmin }) {
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserDetails();
  }, []);

  async function fetchUserDetails() {
    try {
      const response = await fetch('/api/user');
      if (response.ok) {
        const data = await response.json();
        setUserDetails(data);
      }
    } catch (error) {
      console.error('Fehler:', error);
    } finally {
      setLoading(false);
    }
  }

  const createdDate = userDetails?.created_at ? 
    new Date(userDetails.created_at).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : '-';

  return (
    <div className="dashboard-container">
      <div className="dashboard-navbar">
        <h1>🎬 HTLMedia</h1>
        <div className="navbar-right">
          <div className="user-info">
            {isAdmin && <span className="admin-badge">🛡️ Admin</span>}
            <span>Benutzer: <strong>{user?.username}</strong></span>
          </div>
          <button className="logout-btn" onClick={onLogout}>Abmelden</button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="welcome-banner">
          <h2>Willkommen, <span>{user?.username}</span>! 👋</h2>
          <p>Sie sind erfolgreich angemeldet</p>
        </div>

        <div className="dashboard-grid">
          <div className="card">
            <h3>📊 Ihre Benutzerdaten</h3>
            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
              </div>
            ) : userDetails ? (
              <div className="user-details">
                <div className="detail-item">
                  <span className="detail-label">👤 Benutzername</span>
                  <span className="detail-value">{userDetails.username}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">📧 E-Mail</span>
                  <span className="detail-value">{userDetails.email || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">🔑 Benutzer-ID</span>
                  <span className="detail-value">{userDetails.id}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">👥 Role</span>
                  <span className={`detail-value role-${userDetails.role}`}>
                    {userDetails.role === 'admin' ? '🛡️ Admin' : '👤 User'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">📅 Registriert seit</span>
                  <span className="detail-value">{createdDate}</span>
                </div>
              </div>
            ) : (
              <p>Fehler beim Laden der Daten</p>
            )}
          </div>

          {isAdmin && (
            <div className="card admin-notice">
              <h3>🛡️ Administrator</h3>
              <p>Sie haben Admin-Rechte und können über das Admin-Panel User verwalten.</p>
              <ul>
                <li>✓ User erstellen und löschen</li>
                <li>✓ Rollen zuweisen (Admin/User)</li>
                <li>✓ Passwörter zurücksetzen</li>
                <li>✓ E-Mail-Adressen aktualisieren</li>
              </ul>
            </div>
          )}

          <div className="card">
            <h3>ℹ️ Systeminfo</h3>
            <div className="info-list">
              <div className="info-item">
                <span className="info-label">🔒 Datenbankverbindung:</span>
                <span className="status online">● Aktiv</span>
              </div>
              <div className="info-item">
                <span className="info-label">🔐 Session-Verwaltung:</span>
                <span className="status online">● Aktiv</span>
              </div>
              <div className="info-item">
                <span className="info-label">🛡️ Sicherheit:</span>
                <span className="status online">● Verschlüsselt</span>
              </div>
              <div className="info-item">
                <span className="info-label">📱 Responsive:</span>
                <span className="status online">● Unterstützt</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
