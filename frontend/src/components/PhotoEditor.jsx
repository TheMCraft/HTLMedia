import { useState, useEffect, useRef } from 'react';
import * as fabric from 'fabric';
import './PhotoEditor.css';

export default function PhotoEditor({ photoId, photoUrl, onClose, onSave }) {
  const canvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const [overlays, setOverlays] = useState([]);
  const [selectedOverlay, setSelectedOverlay] = useState(null);
  const [imageFormat, setImageFormat] = useState(''); // 'vertical' oder 'horizontal'
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  // Canvas initialisieren
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const initCanvas = async () => {
      try {
        const fabricCanvas = new fabric.Canvas('editor-canvas', {
          width: canvasRef.current.offsetWidth || 800,
          height: canvasRef.current.offsetHeight || 600,
          backgroundColor: '#2a2a2a'
        });

        setCanvas(fabricCanvas);

        // Bild laden
        const img = await fabric.Image.fromURL(photoUrl);
        
        // Bild auf Canvas skalieren
        const maxWidth = fabricCanvas.width - 40;
        const maxHeight = fabricCanvas.height - 40;
        
        let scale = 1;
        if (img.width > maxWidth || img.height > maxHeight) {
          scale = Math.min(maxWidth / img.width, maxHeight / img.height);
        }

        img.set({
          left: (fabricCanvas.width - img.width * scale) / 2,
          top: (fabricCanvas.height - img.height * scale) / 2,
          scaleX: scale,
          scaleY: scale,
          selectable: false
        });

        fabricCanvas.add(img);
        fabricCanvas.sendToBack(img);
        fabricCanvas.renderAll();

        // Bildformat erkennen
        const format = img.width > img.height ? 'horizontal' : 'vertical';
        setImageFormat(format);

        // History speichern
        addToHistory(fabricCanvas);
      } catch (error) {
        console.error('Canvas Init Fehler:', error);
        setMessage('❌ Canvas konnte nicht initialisiert werden');
      }
    };

    initCanvas();

    return () => {
      if (canvas) {
        try {
          canvas.dispose();
        } catch (err) {
          console.error('Fehler beim Dispose:', err);
        }
      }
    };
  }, [photoUrl]);

  // Overlays laden (nur für erkanntes Format)
  useEffect(() => {
    if (imageFormat) {
      fetchOverlays(imageFormat);
    }
  }, [imageFormat]);

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

  function addToHistory(fabricCanvas) {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.stringify(fabricCanvas.toJSON()));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
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
    canvas.loadFromJSON(state, () => {
      canvas.renderAll();
      setHistoryIndex(index);
    });
  }

  async function handleAddOverlay() {
    if (!selectedOverlay || !canvas) return;

    try {
      setMessage('⏳ Overlay wird hinzugefügt...');

      const overlay = overlays.find(o => o.id === selectedOverlay);
      if (!overlay) return;

      fabric.Image.fromURL(overlay.url, (img) => {
        // Overlay auf Canvas-Größe anpassen
        const scale = Math.max(
          canvas.width / img.width,
          canvas.height / img.height
        );

        img.set({
          left: 0,
          top: 0,
          scaleX: scale,
          scaleY: scale,
          opacity: 0.8,
          selectable: true
        });

        canvas.add(img);
        canvas.renderAll();

        addToHistory(canvas);
        setMessage('✓ Overlay hinzugefügt!');
        setTimeout(() => setMessage(''), 2000);
      });
    } catch (error) {
      setMessage('❌ Fehler beim Hinzufügen des Overlays');
      console.error(error);
    }
  }

  async function handleSaveVersion() {
    if (!canvas) return;

    setSaving(true);
    setMessage('⏳ Version wird gespeichert...');

    try {
      // Canvas als Blob exportieren
      canvas.renderAll();
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
        }
      }, 'image/png');
    } catch (error) {
      setMessage('❌ Fehler: ' + error.message);
    } finally {
      setSaving(false);
    }
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
                    {overlay.filename.split('-')[1].toUpperCase()}
                  </option>
                ))}
              </select>

              <button 
                className="btn-add-overlay"
                onClick={handleAddOverlay}
                disabled={!selectedOverlay}
              >
                ➕ Automatisch hinzufügen
              </button>
            </div>
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
              {saving ? '⏳ Wird gespeichert...' : '✓ Als Fertig markieren'}
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
        <div className="editor-canvas-area" ref={canvasRef}>
          <canvas id="editor-canvas"></canvas>
        </div>
      </div>
    </div>
  );
}
