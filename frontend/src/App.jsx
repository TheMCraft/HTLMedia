import { useState, useEffect } from 'react'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import './App.css'

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
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
    return <Login onLoginSuccess={checkAuthStatus} />;
  }

  // Angemeldet - Dashboard mit Admin-Tab für Admins
  return <Dashboard user={user} onLogout={handleLogout} isAdmin={user.role === 'admin'} />;
}

export default App
