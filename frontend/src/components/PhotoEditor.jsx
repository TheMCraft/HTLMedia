import { useState, useEffect, useRef } from 'react';
import './PhotoEditor.css';

export default function PhotoEditor({ photoId, photoUrl, onClose, onSave }) {
  const canvasRef = useRef(null);
  const [imageFormat, setImageFormat] = useState(''); // 'vertical' oder 'horizontal'
  const [overlays, setOverlays] = useState([]);
  const [selectedOverlay, setSelectedOverlay] = useState(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [appliedOverlays, setAppliedOverlays] = useState([]); // [{id}]
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [photoVersions, setPhotoVersions] = useState([]); // Alle Versionen des Fotos
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
  const imgRef = useRef(null);

  // Canvas initialisieren
  useEffect(() => {
    const initCanvas = async () => {
      try {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Bild laden
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          imgRef.current = img;

          // Canvas-Größe auf Bild anpassen
          const containerWidth = canvas?.parentElement?.offsetWidth || 800;
          const containerHeight = canvas?.parentElement?.offsetHeight || 600;
          const maxWidth = containerWidth - 40;
          const maxHeight = containerHeight - 40;

          let displayWidth = img.width;
          let displayHeight = img.height;

          // Skalieren wenn nötig
          if (img.width > maxWidth || img.height > maxHeight) {
            const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
            displayWidth = img.width * scale;
            displayHeight = img.height * scale;
          }

          canvas.width = displayWidth;
          canvas.height = displayHeight;

          // Bild zeichnen
          ctx.drawImage(img, 0, 0, displayWidth, displayHeight);

          // Bildformat erkennen
          const format = img.width > img.height ? 'horizontal' : 'vertical';
          setImageFormat(format);
        };
        img.onerror = () => {
          setMessage('❌ Fehler beim Laden des Bildes');
        };
        img.src = photoUrl;
      } catch (error) {
        console.error('Canvas Init Fehler:', error);
        setMessage('❌ Canvas konnte nicht initialisiert werden');
      }
    };

    initCanvas();
  }, [photoUrl]);

  // Overlays laden (nur für erkanntes Format)
  useEffect(() => {
    if (imageFormat) {
      fetchOverlays(imageFormat);
    }
  }, [imageFormat]);

  // Canvas neu zeichnen wenn sich appliedOverlays ändern
  useEffect(() => {
    redrawCanvas();
  }, [appliedOverlays]);

  async function fetchOverlays(format) {
    try {
      const response = await fetch(`/api/overlays/list/${format}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setOverlays(data);
        if (data.length > 0) {
          setSelectedOverlay(data[0].id);
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden der Overlays:', error);
    }
  }

  function redrawCanvas() {
    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current) return;

    const ctx = canvas.getContext('2d');
    
    // Bild als Basis zeichnen
    ctx.drawImage(imgRef.current, 0, 0, canvas.width, canvas.height);

    // Overlays überlagern - mit Promise.all für korrektes Rendering
    if (appliedOverlays.length > 0) {
      const imagePromises = appliedOverlays.map(overlay => {
        return new Promise((resolve) => {
          const overlayData = overlays.find(o => o.id === overlay.id);
          if (overlayData) {
            const overlayImg = new Image();
            overlayImg.crossOrigin = 'anonymous';
            overlayImg.onload = () => {
              ctx.drawImage(overlayImg, 0, 0, canvas.width, canvas.height);
              resolve();
            };
            overlayImg.onerror = () => {
              console.error('Fehler beim Laden des Overlays:', overlayData.filename);
              resolve();
            };
            overlayImg.src = overlayData.url;
          } else {
            resolve();
          }
        });
      });

      Promise.all(imagePromises).then(() => {
        // Alle Overlays sind geladen und gezeichnet
      });
    }
  }

  async function handleAddOverlay() {
    if (!selectedOverlay) return;

    try {
      setMessage('⏳ Overlay wird hinzugefügt...');

      const overlay = overlays.find(o => o.id === selectedOverlay);
      if (!overlay) return;

      // Neues Overlay hinzufügen
      const newOverlay = {
        id: selectedOverlay
      };

      const newOverlays = [...appliedOverlays, newOverlay];
      setAppliedOverlays(newOverlays);
      
      // History speichern
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(JSON.stringify(newOverlays));
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      
      // Canvas sofort neu zeichnen
      redrawCanvas();
      
      setMessage('✓ Overlay hinzugefügt!');
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      setMessage('❌ Fehler beim Hinzufügen des Overlays');
      console.error(error);
    }
  }

  function undo() {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      loadFromHistory(newIndex);
    }
  }

  function redo() {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      loadFromHistory(newIndex);
    }
  }

  function loadFromHistory(index) {
    const state = JSON.parse(history[index]);
    setAppliedOverlays(state);
    setHistoryIndex(index);
    setTimeout(() => {
      redrawCanvas();
    }, 50);
  }

  async function handleSaveVersion() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setSaving(true);
    setMessage('⏳ Version wird gespeichert...');

    try {
      canvas.toBlob(async (blob) => {
        const formData = new FormData();
        formData.append('photo', blob);
        formData.append('originalPhotoId', photoId);

        const response = await fetch('/api/photos/version', {
          method: 'POST',
          credentials: 'include',
          body: formData
        });

        const data = await response.json();
        if (response.ok) {
          setMessage('✓ Version gespeichert!');
          setTimeout(() => {
            if (onSave) onSave();
            onClose();
          }, 1500);
        } else {
          setMessage('❌ ' + (data.error || 'Fehler beim Speichern'));
          setSaving(false);
        }
      }, 'image/png');
    } catch (error) {
      setMessage('❌ Fehler: ' + error.message);
      setSaving(false);
    }
  }

  function handleClearOverlays() {
    setAppliedOverlays([]);
    redrawCanvas();
    setMessage('✓ Overlays gelöscht');
    setTimeout(() => setMessage(''), 2000);
  }

  return (
    <div className="photo-editor-container">
      <div className="editor-header">
        <h2>🖼️ Foto-Editor</h2>
        <button className="btn-close" onClick={onClose}>✕</button>
      </div>

      <div className="editor-layout">
        {/* Sidebar mit Tools */}
        <div className="editor-sidebar">
          <div className="sidebar-section">
            <h3>🎨 Overlays</h3>
            
            <div className="format-info">
              <span className="format-badge">
                {imageFormat === 'vertical' ? '📱 Vertikal' : '🖼️ Horizontal'}
              </span>
            </div>

            <div className="overlay-select">
              <select 
                value={selectedOverlay || ''} 
                onChange={(e) => setSelectedOverlay(Number(e.target.value))}
                className="overlay-dropdown"
              >
                <option value="">Overlay wählen...</option>
                {overlays.map(overlay => (
                  <option key={overlay.id} value={overlay.id}>
                    {overlay.filename.split('-')[1]?.toUpperCase() || overlay.filename}
                  </option>
                ))}
              </select>

              <button 
                className="btn-add-overlay"
                onClick={handleAddOverlay}
                disabled={!selectedOverlay}
              >
                ➕ Hinzufügen
              </button>

              <button 
                className="btn-clear-overlays"
                onClick={handleClearOverlays}
                disabled={appliedOverlays.length === 0}
              >
                🗑️ Alle löschen
              </button>
            </div>

            {appliedOverlays.length > 0 && (
              <div className="overlay-count">
                {appliedOverlays.length} Overlay(s) angewendet
              </div>
            )}
          </div>

          <div className="sidebar-section">
            <h3>↩️ Bearbeiten</h3>
            
            <div className="history-buttons">
              <button 
                className="btn-history"
                onClick={undo}
                disabled={historyIndex <= 0}
                title="Rückgängig"
              >
                ↶ Undo
              </button>
              <button 
                className="btn-history"
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                title="Wiederherstellen"
              >
                ↷ Redo
              </button>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>💾 Speichern</h3>
            
            <button 
              className="btn-save-version"
              onClick={handleSaveVersion}
              disabled={saving}
            >
              {saving ? '⏳ Wird gespeichert...' : '✓ Speichern'}
            </button>

            <p className="save-info">
              Eine neue Version wird gespeichert. Das Original bleibt unverändert.
            </p>
          </div>

          {message && (
            <div className={`message ${message.includes('✓') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}
        </div>

        {/* Canvas Area */}
        <div className="editor-canvas-area">
          <canvas id="editor-canvas" ref={canvasRef}></canvas>
        </div>
      </div>
    </div>
  );
}
