import { useState, useEffect } from 'react';
import './AdminPanel.css';

export default function AdminPanel({ user, onLogout }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    role: 'user'
  });
  const [message, setMessage] = useState('');

  // Lade alle User
  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        setMessage('❌ Fehler beim Laden der User');
      }
    } catch (error) {
      setMessage('❌ Fehler: ' + error.message);
    } finally {
      setLoading(false);
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
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✓ User erstellt!');
        setFormData({ username: '', password: '', email: '', role: 'user' });
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
    if (!confirm(`Soll ${username} wirklich gelöscht werden?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
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

  return (
    <div className="admin-container">
      <div className="admin-navbar">
        <h1>🛡️ Admin Panel</h1>
        <div className="navbar-right">
          <span>Admin: <strong>{user?.username}</strong></span>
          <button className="logout-btn" onClick={onLogout}>Abmelden</button>
        </div>
      </div>

      <div className="admin-content">
        {message && (
          <div className={`alert ${message.includes('✓') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <div className="section-header">
          <h2>👥 Benutzerverwaltung</h2>
          <button 
            className="btn-primary"
            onClick={() => {
              setShowForm(!showForm);
              setFormData({ username: '', password: '', email: '', role: 'user' });
            }}
          >
            {showForm ? '✕ Abbrechen' : '+ Neuer User'}
          </button>
        </div>

        {showForm && (
          <form className="create-form" onSubmit={handleCreateUser}>
            <h3>Neuen User erstellen</h3>
            <div className="form-row">
              <input
                type="text"
                name="username"
                placeholder="Benutzername"
                value={formData.username}
                onChange={handleFormChange}
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Passwort"
                value={formData.password}
                onChange={handleFormChange}
                required
              />
            </div>
            <div className="form-row">
              <input
                type="email"
                name="email"
                placeholder="E-Mail (optional)"
                value={formData.email}
                onChange={handleFormChange}
              />
              <select 
                name="role" 
                value={formData.role} 
                onChange={handleFormChange}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" className="btn-create">Erstellen</button>
          </form>
        )}

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>User werden geladen...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="no-users">Keine User vorhanden</div>
        ) : (
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Benutzername</th>
                  <th>E-Mail</th>
                  <th>Role</th>
                  <th>Registriert</th>
                  <th>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className={u.role === 'admin' ? 'admin-row' : ''}>
                    <td>{u.id}</td>
                    <td><strong>{u.username}</strong></td>
                    <td>{u.email || '-'}</td>
                    <td>
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                        className={`role-select role-${u.role}`}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>{new Date(u.created_at).toLocaleDateString('de-DE')}</td>
                    <td>
                      <button 
                        className="btn-action btn-password"
                        onClick={() => handleResetPassword(u.id)}
                        title="Passwort zurücksetzen"
                      >
                        🔑
                      </button>
                      <button 
                        className="btn-action btn-delete"
                        onClick={() => handleDeleteUser(u.id, u.username)}
                        disabled={u.id === user?.id}
                        title="Benutzer löschen"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="stats">
          <div className="stat-card">
            <div className="stat-value">{users.length}</div>
            <div className="stat-label">Gesamt User</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{users.filter(u => u.role === 'admin').length}</div>
            <div className="stat-label">Admins</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{users.filter(u => u.role === 'user').length}</div>
            <div className="stat-label">Normale User</div>
          </div>
        </div>
      </div>
    </div>
  );
}
