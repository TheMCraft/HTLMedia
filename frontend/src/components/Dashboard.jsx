import { useState, useEffect } from 'react';
import './Dashboard.css';
import PhotoEditor from './PhotoEditor';

export default function Dashboard({ user, onLogout, isAdmin }) {
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload', 'photos', 'admin'
  const [adminLoading, setAdminLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'user'
  });
  const [photos, setPhotos] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoMessage, setPhotoMessage] = useState('');
  
  // Overlay States
  const [overlays, setOverlays] = useState([]);
  const [loadingOverlays, setLoadingOverlays] = useState(false);
  const [uploadingOverlay, setUploadingOverlay] = useState(false);
  const [overlayMessage, setOverlayMessage] = useState('');

  // Photo Editor States
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedPhotoForEdit, setSelectedPhotoForEdit] = useState(null);

  useEffect(() => {
    fetchUserPhotos();
  }, []);

  // Lade Admin-Users wenn Admin-Tab angezeigt wird
  useEffect(() => {
    if (activeTab === 'admin' && isAdmin) {
      fetchUsers();
      fetchOverlays();
    }
  }, [activeTab, isAdmin]);

  async function fetchUsers() {
    try {
      setAdminLoading(true);
      const response = await fetch('/api/admin/users', {
        credentials: 'include'
      });
      const data = await response.json();
      if (response.ok) {
        setUsers(data);
        setMessage('');
      } else {
        setMessage('❌ ' + (data.error || 'Fehler beim Laden der User'));
      }
    } catch (error) {
      console.error('Admin users fetch error:', error);
      setMessage('❌ Fehler: ' + error.message);
    } finally {
      setAdminLoading(false);
    }
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      setMessage('❌ Username und Passwort erforderlich');
      return;
    }
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('✓ User erstellt!');
        setFormData({ username: '', password: '', role: 'user' });
        setShowForm(false);
        fetchUsers();
      } else {
        setMessage('❌ ' + data.error);
      }
    } catch (error) {
      setMessage('❌ Fehler: ' + error.message);
    }
  }

  async function handleDeleteUser(userId, username) {
    if (!confirm(`Soll ${username} wirklich gelöscht werden?`)) return;
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('✓ User gelöscht!');
        fetchUsers();
      } else {
        setMessage('❌ ' + data.error);
      }
    } catch (error) {
      setMessage('❌ Fehler: ' + error.message);
    }
  }

  async function handleResetPassword(userId) {
    const newPassword = prompt('Neues Passwort eingeben:');
    if (!newPassword) return;
    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ newPassword })
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('✓ Passwort zurückgesetzt!');
      } else {
        setMessage('❌ ' + data.error);
      }
    } catch (error) {
      setMessage('❌ Fehler: ' + error.message);
    }
  }

  async function handleUpdateRole(userId, newRole) {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: newRole })
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('✓ Role aktualisiert!');
        fetchUsers();
      } else {
        setMessage('❌ ' + data.error);
      }
    } catch (error) {
      setMessage('❌ Fehler: ' + error.message);
    }
  }

  function handleOpenEditor(photo) {
    setSelectedPhotoForEdit(photo);
    setEditorOpen(true);
  }

  function handleCloseEditor() {
    setEditorOpen(false);
    setSelectedPhotoForEdit(null);
    fetchUserPhotos(); // Fotos neuladen um neue Versionen anzuzeigen
  }

  async function fetchUserPhotos() {
    try {
      const response = await fetch('/api/photos', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setPhotos(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Fotos:', error);
    }
  }

  async function handlePhotoUpload(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingPhoto(true);
    setPhotoMessage('');

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('photo', file);

        const response = await fetch('/api/photos', {
          method: 'POST',
          credentials: 'include',
          body: formData
        });

        if (response.ok) {
          setPhotoMessage('✓ Foto hochgeladen!');
          fetchUserPhotos();
        } else {
          const data = await response.json();
          setPhotoMessage('❌ ' + (data.error || 'Fehler beim Upload'));
        }
      } catch (error) {
        setPhotoMessage('❌ Fehler: ' + error.message);
      }
    }

    setUploadingPhoto(false);
    e.target.value = '';
  }

  async function handleDeletePhoto(photoId) {
    if (!confirm('Foto wirklich löschen?')) return;
    
    try {
      const response = await fetch(`/api/photos/${photoId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setPhotoMessage('✓ Foto gelöscht!');
        fetchUserPhotos();
      } else {
        const data = await response.json();
        setPhotoMessage('❌ ' + (data.error || 'Fehler beim Löschen'));
      }
    } catch (error) {
      setPhotoMessage('❌ Fehler: ' + error.message);
    }
  }

  // ===================== OVERLAY FUNCTIONS =====================

  async function fetchOverlays() {
    try {
      setLoadingOverlays(true);
      const response = await fetch('/api/admin/overlays', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setOverlays(data);
        setOverlayMessage('');
      } else {
        const data = await response.json();
        setOverlayMessage('❌ ' + (data.error || 'Fehler beim Laden'));
      }
    } catch (error) {
      console.error('Fehler beim Laden der Overlays:', error);
      setOverlayMessage('❌ Fehler: ' + error.message);
    } finally {
      setLoadingOverlays(false);
    }
  }

  async function handleOverlayUpload(e, overlayType) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingOverlay(true);
    setOverlayMessage('');

    try {
      const formData = new FormData();
      formData.append('overlay', file);
      formData.append('overlayType', overlayType);

      const response = await fetch('/api/admin/overlays', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        setOverlayMessage(`✓ ${overlayType === 'vertical' ? 'Vertikales' : 'Horizontales'} Overlay hochgeladen!`);
        fetchOverlays();
      } else {
        setOverlayMessage('❌ ' + (data.error || 'Fehler beim Upload'));
      }
    } catch (error) {
      setOverlayMessage('❌ Fehler: ' + error.message);
    }

    setUploadingOverlay(false);
    e.target.value = '';
  }

  async function handleDeleteOverlay(overlayId) {
    if (!confirm('Overlay wirklich löschen?')) return;

    try {
      const response = await fetch(`/api/admin/overlays/${overlayId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();
      if (response.ok) {
        setOverlayMessage('✓ Overlay gelöscht!');
        fetchOverlays();
      } else {
        setOverlayMessage('❌ ' + (data.error || 'Fehler beim Löschen'));
      }
    } catch (error) {
      setOverlayMessage('❌ Fehler: ' + error.message);
    }
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-navbar">
        <h1>🎬 HTLMedia</h1>
        <div className="navbar-tabs">
          <button 
            className={`nav-tab ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            📤 Upload
          </button>
          <button 
            className={`nav-tab ${activeTab === 'photos' ? 'active' : ''}`}
            onClick={() => setActiveTab('photos')}
          >
            📸 Meine Fotos ({photos.length})
          </button>
          {isAdmin && (
            <button 
              className={`nav-tab ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('admin');
                if (users.length === 0) fetchUsers();
              }}
            >
              🛡️ Admin Panel
            </button>
          )}
        </div>
        <div className="navbar-right">
          <div className="user-info">
            {isAdmin && <span className="admin-badge">🛡️ Admin</span>}
            <span>Benutzer: <strong>{user?.username}</strong></span>
          </div>
          <button className="logout-btn" onClick={onLogout}>Abmelden</button>
        </div>
      </div>

      <div className="dashboard-content">
        {activeTab === 'upload' ? (
          <>
            <div className="welcome-banner">
              <h2>📤 Foto Upload <span>{user?.username}</span></h2>
              <p>Laden Sie Ihre Fotos lossless hoch</p>
            </div>

            <div className="dashboard-grid">
              <div className="card">
                <h3>📸 Fotos hochladen</h3>
                {photoMessage && (
                  <div className={`message ${photoMessage.includes('✓') ? 'success' : 'error'}`}>
                    {photoMessage}
                  </div>
                )}
                
                <div className="photo-upload-section">
                  <label className="upload-label">
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhoto}
                      className="file-input"
                    />
                    <span className="upload-button">
                      {uploadingPhoto ? '⏳ Wird hochgeladen...' : '➕ Fotos hinzufügen'}
                    </span>
                  </label>
                  <p className="upload-info">Sie können mehrere Fotos gleichzeitig hochladen (lossless)</p>
                </div>
              </div>

              <div className="card">
                <h3>📊 Ihre Upload Statistik</h3>
                <div className="stats-section">
                  <div className="stat-box">
                    <span className="stat-value">{photos.length}</span>
                    <span className="stat-title">Fotos hochgeladen</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-value">{photos.reduce((sum, p) => sum + (p.size || 0), 0) ? Math.round(photos.reduce((sum, p) => sum + (p.size || 0), 0) / 1024 / 1024) : 0}</span>
                    <span className="stat-title">MB Speicher</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : activeTab === 'photos' ? (
          <>
            <div className="welcome-banner">
              <h2>📸 Meine Fotos <span>({photos.length})</span></h2>
              <p>Verwalten Sie Ihre hochgeladenen Fotos</p>
            </div>

            <div className="photos-container">
              {photos.length > 0 ? (
                <div className="photos-grid">
                  {photos.map((photo) => (
                    <div key={photo.id} className="photo-item">
                      <div 
                        className="photo-image-wrapper"
                        onClick={() => handleOpenEditor(photo)}
                        role="button"
                        tabIndex={0}
                      >
                        <img 
                          src={photo.url} 
                          alt={`Foto ${photo.id}`}
                          className="photo-image"
                        />
                        <div className="photo-overlay-hint">
                          <span className="edit-icon">✏️ Bearbeiten</span>
                        </div>
                      </div>
                      <div className="photo-info">
                        <div className="photo-meta">
                          <span className="meta-label">ID:</span> {photo.id}
                        </div>
                        <div className="photo-meta">
                          <span className="meta-label">Version:</span> {photo.version}
                        </div>
                        <div className="photo-meta">
                          <span className="meta-label">Datum:</span> {new Date(photo.created_at).toLocaleDateString('de-DE')}
                        </div>
                        <button 
                          className="btn-delete-photo"
                          onClick={() => handleDeletePhoto(photo.id)}
                          title="Foto löschen"
                        >
                          🗑️ Löschen
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card">
                  <p className="no-photos">Noch keine Fotos hochgeladen</p>
                </div>
              )}
            </div>
          </>
        ) : (
          // Admin Panel Tab
          <div className="admin-panel">
            <h2>🛡️ Admin Panel - Benutzerverwaltung</h2>
            
            {message && (
              <div className={`message ${message.includes('✓') ? 'success' : 'error'}`}>
                {message}
              </div>
            )}

            <div className="admin-stats">
              <div className="stat-card">
                <span className="stat-number">{users.length}</span>
                <span className="stat-label">Gesamt Benutzer</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{users.filter(u => u.role === 'admin').length}</span>
                <span className="stat-label">Administratoren</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{users.filter(u => u.role === 'user').length}</span>
                <span className="stat-label">Reguläre User</span>
              </div>
            </div>

            <div className="admin-section">
              <button 
                className="btn-create-user"
                onClick={() => setShowForm(!showForm)}
              >
                {showForm ? '❌ Formular schließen' : '➕ Neuen User erstellen'}
              </button>

              {showForm && (
                <form className="create-user-form" onSubmit={handleCreateUser}>
                  <h3>Neuen Benutzer erstellen</h3>
                  <div className="form-group">
                    <label>Benutzername:</label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleFormChange}
                      placeholder="z.B. john_doe"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Passwort:</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleFormChange}
                      placeholder="Mindestens 6 Zeichen"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Role:</label>
                    <select 
                      name="role" 
                      value={formData.role}
                      onChange={handleFormChange}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <button type="submit" className="btn-submit">✓ User erstellen</button>
                </form>
              )}
            </div>

            <div className="users-table-section">
              <h3>Alle Benutzer</h3>
              {adminLoading ? (
                <div className="loading">
                  <div className="spinner"></div>
                </div>
              ) : users.length > 0 ? (
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Benutzername</th>
                      <th>Role</th>
                      <th>Registriert</th>
                      <th>Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(userItem => (
                      <tr key={userItem.id}>
                        <td>{userItem.id}</td>
                        <td>{userItem.username}</td>
                        <td>
                          <select 
                            value={userItem.role}
                            onChange={(e) => handleUpdateRole(userItem.id, e.target.value)}
                            className="role-select"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td>{new Date(userItem.created_at).toLocaleDateString('de-DE')}</td>
                        <td className="actions">
                          <button 
                            className="btn-reset"
                            onClick={() => handleResetPassword(userItem.id)}
                            title="Passwort zurücksetzen"
                          >
                            🔑 Passwort
                          </button>
                          <button 
                            className="btn-delete"
                            onClick={() => handleDeleteUser(userItem.id, userItem.username)}
                            title="User löschen"
                          >
                            🗑️ Löschen
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>Keine Benutzer gefunden</p>
              )}
            </div>

            <div className="systeminfo-section">
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

            <div className="overlay-management-section">
              <h2>🎨 Overlay-Verwaltung</h2>
              
              {overlayMessage && (
                <div className={`message ${overlayMessage.includes('✓') ? 'success' : 'error'}`}>
                  {overlayMessage}
                </div>
              )}

              <div className="overlay-upload-container">
                {/* Vertikale Overlays */}
                <div className="overlay-upload-box">
                  <h3>📱 Vertikale Overlays</h3>
                  <p className="overlay-description">Für hochformatige Bilder (Portrait)</p>
                  
                  <label className="file-upload-label">
                    {uploadingOverlay ? (
                      <span className="uploading">⏳ Wird hochgeladen...</span>
                    ) : (
                      <>
                        <span className="upload-icon">📤</span>
                        <span>Bild hochladen</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleOverlayUpload(e, 'vertical')}
                      disabled={uploadingOverlay}
                      style={{ display: 'none' }}
                    />
                  </label>

                  <div className="overlay-list">
                    {loadingOverlays ? (
                      <div className="loading"><div className="spinner"></div></div>
                    ) : overlays.filter(o => o.overlayType === 'vertical').length > 0 ? (
                      overlays.filter(o => o.overlayType === 'vertical').map(overlay => (
                        <div key={overlay.id} className="overlay-item">
                          <img src={overlay.url} alt="Vertical Overlay" className="overlay-preview" />
                          <div className="overlay-info">
                            <small>{new Date(overlay.createdAt).toLocaleString('de-DE')}</small>
                          </div>
                          <button
                            className="btn-delete-overlay"
                            onClick={() => handleDeleteOverlay(overlay.id)}
                            title="Löschen"
                          >
                            🗑️
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="no-overlay">Kein Overlay vorhanden</p>
                    )}
                  </div>
                </div>

                {/* Horizontale Overlays */}
                <div className="overlay-upload-box">
                  <h3>🖼️ Horizontale Overlays</h3>
                  <p className="overlay-description">Für querformatige Bilder (Landscape)</p>
                  
                  <label className="file-upload-label">
                    {uploadingOverlay ? (
                      <span className="uploading">⏳ Wird hochgeladen...</span>
                    ) : (
                      <>
                        <span className="upload-icon">📤</span>
                        <span>Bild hochladen</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleOverlayUpload(e, 'horizontal')}
                      disabled={uploadingOverlay}
                      style={{ display: 'none' }}
                    />
                  </label>

                  <div className="overlay-list">
                    {loadingOverlays ? (
                      <div className="loading"><div className="spinner"></div></div>
                    ) : overlays.filter(o => o.overlayType === 'horizontal').length > 0 ? (
                      overlays.filter(o => o.overlayType === 'horizontal').map(overlay => (
                        <div key={overlay.id} className="overlay-item">
                          <img src={overlay.url} alt="Horizontal Overlay" className="overlay-preview" />
                          <div className="overlay-info">
                            <small>{new Date(overlay.createdAt).toLocaleString('de-DE')}</small>
                          </div>
                          <button
                            className="btn-delete-overlay"
                            onClick={() => handleDeleteOverlay(overlay.id)}
                            title="Löschen"
                          >
                            🗑️
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="no-overlay">Kein Overlay vorhanden</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Photo Editor Modal */}
      {editorOpen && selectedPhotoForEdit && (
        <PhotoEditor 
          photoId={selectedPhotoForEdit.id}
          photoUrl={selectedPhotoForEdit.url}
          onClose={handleCloseEditor}
          onSave={handleCloseEditor}
        />
      )}
    </div>
  );
}
