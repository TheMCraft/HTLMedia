import { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Initialize from localStorage for instant "local" feel
  const [fonts, setFonts] = useState(() => {
    try {
      const saved = localStorage.getItem('app_fonts');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [logo, setLogo] = useState(() => {
    try {
      const saved = localStorage.getItem('app_logo');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('app_settings');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  useEffect(() => {
    checkAuthStatus();
    fetchLogo();
    fetchSettings();
    fetchFonts(); // Load fonts list globally

    const onSettingsUpdated = () => {
      fetchSettings();
      fetchFonts();
    };
    window.addEventListener('settingsUpdated', onSettingsUpdated);
    return () => window.removeEventListener('settingsUpdated', onSettingsUpdated);
  }, []);

  async function fetchFonts() {
    try {
      const resp = await fetch('/api/fonts/list', { credentials: 'include' });
      if (resp.ok) {
        const data = await resp.json();
        // Berechne konsistenten Family-Namen
        const fontsWithFamily = (data || []).map(f => {
          const family = f.filename.includes('.') ? f.filename.substring(0, f.filename.lastIndexOf('.')) : f.filename;
          return { ...f, family };
        });
        setFonts(fontsWithFamily);
        localStorage.setItem('app_fonts', JSON.stringify(fontsWithFamily));

        // REGISTER ALL FONTS IN THE DOCUMENT IMMEDIATELY
        // This makes them available for Canvas and CSS without manual selection
        fontsWithFamily.forEach(async (font) => {
          try {
            const fontId = font.id;
            const linkId = `app-font-css-${fontId}`;
            if (!document.getElementById(linkId)) {
              const link = document.createElement('link');
              link.id = linkId;
              link.rel = 'stylesheet';
              link.href = `/api/fonts/css/${fontId}`;
              document.head.appendChild(link);
            }
            // Also explicitly load the family
            if (document.fonts && document.fonts.load) {
              await document.fonts.load(`16px "${font.family}"`);
            }
          } catch (e) {
            console.warn('App: error pre-loading font', font.family, e);
          }
        });
      }
    } catch (e) {
      console.warn('App: could not fetch fonts list', e);
    }
  }

  // Inject font CSS by id and wait for document.fonts to register the family
  async function injectFontCssById(fontId, cssVarName) {
    if (!fontId || typeof document === 'undefined') return;
    const linkId = `app-font-css-${fontId}`;
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = `/api/fonts/css/${fontId}`;
      document.head.appendChild(link);
      await new Promise((resolve) => {
        let done = false;
        link.onload = () => { done = true; resolve(); };
        link.onerror = () => { done = true; resolve(); };
        setTimeout(() => { if (!done) resolve(); }, 2000);
      });
    }

    // Try to determine family name from the fonts list
    const f = fonts.find(item => String(item.id) === String(fontId));
    let family = f && f.family ? f.family : null;
    
    // Fallback if fonts array not yet populated
    if (!family) {
        try {
            const resp = await fetch('/api/fonts/list', { credentials: 'include' });
            if (resp.ok) {
                const list = await resp.json();
                const item = list.find(it => String(it.id) === String(fontId));
                family = item && item.filename ? item.filename.replace(/\.[^.]+$/, '') : null;
            }
        } catch(e) {}
    }

    if (family) {
      // Apply to CSS variable on root for global use
      if (cssVarName) {
        document.documentElement.style.setProperty(cssVarName, `"${family}"`);
      }

      if (document.fonts && document.fonts.load) {
        try {
          await document.fonts.load(`16px "${family}"`);
        } catch (e) {
          console.warn('App: document.fonts.load failed for', family, e);
        }
      }
    }
  }

  async function checkAuthStatus() {
    try {
      const response = await fetch('/api/user', {
        credentials: 'include'
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        // Load authenticated data
        fetchFonts();
        fetchSettings();
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
          localStorage.setItem('app_logo', JSON.stringify(data));
        } else {
          // Received HTML (likely index.html) — log for debugging and avoid parse error
          const text = await response.text();
          console.error('fetchLogo: expected JSON but got:', text.slice(0, 500));
          setLogo(null);
          localStorage.removeItem('app_logo');
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
        localStorage.removeItem('app_logo');
      }
    } catch (error) {
      console.error('fetchLogo exception:', error);
      setLogo(null);
      localStorage.removeItem('app_logo');
    }
  }

  async function fetchSettings() {
    try {
      const response = await fetch('/api/settings', { credentials: 'include' });
      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('application/json')) {
        const data = await response.json();
        // Only update and notify if settings actually changed
        const prev = JSON.stringify(settings || {});
        const next = JSON.stringify(data || {});
        if (prev !== next) {
          setSettings(data);
          localStorage.setItem('app_settings', JSON.stringify(data));
          
          // Ensure admin-selected fonts are injected and loaded so they persist after reload
          if (data.titleFontId) await injectFontCssById(data.titleFontId, '--title-font');
          if (data.descriptionFontId) await injectFontCssById(data.descriptionFontId, '--description-font');
          
          // Notify listeners (PhotoEditor etc.) that settings changed
          window.dispatchEvent(new Event('settingsUpdated'));
        }
      } else {
        setSettings({});
        localStorage.removeItem('app_settings');
      }
    } catch (err) {
      console.error('fetchSettings error:', err);
      setSettings({});
    }
  }

  // Poll settings so users get admin changes automatically without manual re-select
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSettings();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
  return <Dashboard user={user} onLogout={handleLogout} isAdmin={user.role === 'admin'} logo={logo} initialSettings={settings} fonts={fonts} fetchFonts={fetchFonts} />;
}

export default App;
