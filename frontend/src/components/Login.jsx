import { useState } from 'react';
import './Login.css';

export default function Login({ onLoginSuccess, logo }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    if (isLogin) {
      await handleLogin();
    } else {
      await handleRegister();
    }

    setLoading(false);
  }

  async function handleLogin() {
    const { username, password } = formData;

    if (!username || !password) {
      setMessage('❌ Benutzername und Passwort erforderlich');
      return;
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✓ Login erfolgreich!');
        setTimeout(() => onLoginSuccess(), 1000);
      } else {
        setMessage('❌ ' + data.error);
      }
    } catch (error) {
      setMessage('❌ Fehler: ' + error.message);
    }
  }

  async function handleRegister() {
    const { username, password, confirmPassword } = formData;

    if (!username || !password || !confirmPassword) {
      setMessage('❌ Alle Felder erforderlich');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('❌ Passwörter stimmen nicht überein');
      return;
    }

    if (password.length < 6) {
      setMessage('❌ Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password, confirmPassword })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✓ Registrierung erfolgreich! Bitte anmelden.');
        setTimeout(() => {
          setIsLogin(true);
          setFormData({ username, password: '', confirmPassword: '' });
        }, 1000);
      } else {
        setMessage('❌ ' + data.error);
      }
    } catch (error) {
      setMessage('❌ Fehler: ' + error.message);
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-center">
            {logo && logo.url ? (
              <img src={logo.url} alt="Logo" className="site-logo" />
            ) : (
              <span className="site-title">HTLMedia</span>
            )}
          </div>
          <p>{isLogin ? 'Willkommen' : 'Registrieren'}</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {message && (
            <div className={`alert ${message.includes('✓') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Benutzername</label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Benutzername eingeben"
              value={formData.username}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Passwort</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Passwort eingeben"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          {!isLogin && (
            <>
              <div className="form-group">
                <label htmlFor="confirmPassword">Passwort bestätigen</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Passwort wiederholen"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          <button 
            type="submit" 
            className="btn-submit"
            disabled={loading}
          >
            {loading ? 'Wird verarbeitet...' : (isLogin ? 'Anmelden' : 'Registrieren')}
          </button>
        </form>

        <div className="toggle-form">
          {isLogin ? (
            <>
              Noch kein Konto? 
              <a onClick={() => setIsLogin(false)}>Jetzt registrieren</a>
            </>
          ) : (
            <>
              Bereits registriert? 
              <a onClick={() => setIsLogin(true)}>Hier anmelden</a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
