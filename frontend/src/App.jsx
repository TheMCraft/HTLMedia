import { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logo, setLogo] = useState(null);

  useEffect(() => {
    checkAuthStatus();
    fetchLogo();
  }, []);

  async function checkAuthStatus() {
    try {
      const response = await fetch('/api/user', {
        credentials: 'include'
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Fehler:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchLogo() {
    try {
      const response = await fetch('/api/logo', { credentials: 'include' });
      const contentType = response.headers.get('content-type') || '';
      if (response.ok) {
        if (contentType.includes('application/json')) {
          const data = await response.json();
          setLogo(data);
        } else {
          // Received HTML (likely index.html) — log for debugging and avoid parse error
          const text = await response.text();
          console.error('fetchLogo: expected JSON but got:', text.slice(0, 500));
          setLogo(null);
        }
      } else {
        // Non-OK response: try to parse JSON safely
        if (contentType.includes('application/json')) {
          const data = await response.json();
          console.error('fetchLogo error response:', data);
        } else {
          const text = await response.text();
          console.error('fetchLogo non-OK response (not JSON):', text.slice(0, 500));
        }
        setLogo(null);
      }
    } catch (error) {
      console.error('fetchLogo exception:', error);
      setLogo(null);
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setUser(null);
    } catch (error) {
      console.error('Logout Fehler:', error);
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Wird geladen...</p>
      </div>
    );
  }

  // Nicht angemeldet - Login Seite anzeigen
  if (!user) {
    return <Login onLoginSuccess={checkAuthStatus} logo={logo} />;
  }

  // Angemeldet - Dashboard mit Admin-Tab für Admins
  return <Dashboard user={user} onLogout={handleLogout} isAdmin={user.role === 'admin'} logo={logo} />;
}

export default App;
