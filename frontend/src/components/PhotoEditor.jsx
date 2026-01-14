import { useState, useEffect, useRef } from 'react';
import './PhotoEditor.css';

export default function PhotoEditor({ photoId, photoUrl, onClose, onSave }) {
  const canvasRef = useRef(null);
  const [imageFormat, setImageFormat] = useState(''); // 'vertical' oder 'horizontal'
  const [overlays, setOverlays] = useState([]);
  const [selectedOverlay, setSelectedOverlay] = useState(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [appliedOverlays, setAppliedOverlays] = useState([]); // [{id, x, y, scale}]
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [photoVersions, setPhotoVersions] = useState([]); // Alle Versionen des Fotos
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
  const [selectedElementIndex, setSelectedElementIndex] = useState(-1); // -1 = Bild, 0+ = Overlay-Index
  const [imageTransform, setImageTransform] = useState({ x: 0, y: 0, scale: 1 }); // Position und Größe des Bildes
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState(null); // 'move' oder 'resize'
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imgRef = useRef(null);
  const canvasContainerRef = useRef(null);

  // Canvas initialisieren und alle Versionen laden
  useEffect(() => {
    const initCanvas = async () => {
      try {
        // Lade alle Versionen dieses Fotos
        const response = await fetch('/api/photos', {
          credentials: 'include'
        });
        if (response.ok) {
          const allPhotos = await response.json();
          // Finde alle Versionen mit der gleichen ID
          const versions = allPhotos.filter(p => p.id === photoId || p.original_filename === allPhotos.find(ph => ph.id === photoId)?.original_filename);
          setPhotoVersions(versions.sort((a, b) => a.version - b.version));
          setCurrentVersionIndex(versions.length - 1); // Starte mit der neuesten Version
        }
        
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
  }, [photoUrl, photoId]);

  // Overlays laden (nur für erkanntes Format)
  useEffect(() => {
    if (imageFormat) {
      fetchOverlays(imageFormat);
    }
  }, [imageFormat]);

  // Canvas neu zeichnen wenn sich appliedOverlays oder imageTransform ändern
  useEffect(() => {
    redrawCanvas();
  }, [appliedOverlays, imageTransform]);

  // Mouse Event Handler für Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getElementBounds = () => {
      if (selectedElementIndex === -1) {
        // Bild
        if (!imgRef.current) return null;
        return {
          x: imageTransform.x,
          y: imageTransform.y,
          width: imgRef.current.width * imageTransform.scale,
          height: imgRef.current.height * imageTransform.scale
        };
      } else {
        // Overlay
        const overlay = appliedOverlays[selectedElementIndex];
        const overlayData = overlays.find(o => o.id === overlay.id);
        if (!overlayData) return null;
        
        return {
          x: overlay.x || 0,
          y: overlay.y || 0,
          width: 200 * (overlay.scale || 1), // Placeholder für Overlay-Breite
          height: 150 * (overlay.scale || 1)  // Placeholder für Overlay-Höhe
        };
      }
    };

    const handleMouseDown = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const bounds = getElementBounds();
      if (!bounds) return;

      const resizeHandleSize = 20;
      const isResizeHandle = 
        x >= bounds.x + bounds.width - resizeHandleSize &&
        x <= bounds.x + bounds.width &&
        y >= bounds.y + bounds.height - resizeHandleSize &&
        y <= bounds.y + bounds.height;

      const isInsideBounds = 
        x >= bounds.x && 
        x <= bounds.x + bounds.width &&
        y >= bounds.y && 
        y <= bounds.y + bounds.height;

      if (isInsideBounds) {
        setIsDragging(true);
        setDragMode(isResizeHandle ? 'resize' : 'move');
        setDragStart({ x, y });
      }
    };

    const handleMouseMove = (e) => {
      if (!isDragging) {
        // Cursor ändern wenn über Resize-Handle
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const bounds = getElementBounds();
        
        if (bounds) {
          const resizeHandleSize = 20;
          const isResizeHandle = 
            x >= bounds.x + bounds.width - resizeHandleSize &&
            x <= bounds.x + bounds.width &&
            y >= bounds.y + bounds.height - resizeHandleSize &&
            y <= bounds.y + bounds.height;
          
          canvas.style.cursor = isResizeHandle ? 'nwse-resize' : (
            x >= bounds.x && x <= bounds.x + bounds.width &&
            y >= bounds.y && y <= bounds.y + bounds.height ? 'move' : 'default'
          );
        }
        return;
      }

      const currentX = e.clientX - canvas.getBoundingClientRect().left;
      const currentY = e.clientY - canvas.getBoundingClientRect().top;
      const deltaX = currentX - dragStart.x;
      const deltaY = currentY - dragStart.y;

      if (dragMode === 'move') {
        updateSelectedElement({
          x: (selectedElementIndex === -1 ? imageTransform.x : appliedOverlays[selectedElementIndex]?.x || 0) + deltaX,
          y: (selectedElementIndex === -1 ? imageTransform.y : appliedOverlays[selectedElementIndex]?.y || 0) + deltaY
        });
      } else if (dragMode === 'resize') {
        const maxDelta = Math.max(deltaX, deltaY);
        const currentScale = selectedElementIndex === -1 ? imageTransform.scale : (appliedOverlays[selectedElementIndex]?.scale || 1);
        const newScale = Math.max(0.1, currentScale + maxDelta / 100);
        updateSelectedElement({ scale: newScale });
      }

      setDragStart({ x: currentX, y: currentY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragMode(null);
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [selectedElementIndex, imageTransform, appliedOverlays, overlays, isDragging, dragMode, dragStart]);

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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Bild mit Transform zeichnen
    if (imgRef.current) {
      const img = imgRef.current;
      const scaledWidth = img.width * imageTransform.scale;
      const scaledHeight = img.height * imageTransform.scale;
      ctx.drawImage(img, imageTransform.x, imageTransform.y, scaledWidth, scaledHeight);
      
      // Bounding Box zeichnen wenn Bild ausgewählt ist
      if (selectedElementIndex === -1) {
        drawBoundingBox(ctx, imageTransform.x, imageTransform.y, scaledWidth, scaledHeight);
      }
    }

    // Overlays überlagern - mit Promise.all für korrektes Rendering
    if (appliedOverlays.length > 0) {
      const imagePromises = appliedOverlays.map((overlay, index) => {
        return new Promise((resolve) => {
          const overlayData = overlays.find(o => o.id === overlay.id);
          if (overlayData) {
            const overlayImg = new Image();
            overlayImg.crossOrigin = 'anonymous';
            overlayImg.onload = () => {
              const scaledWidth = overlayImg.width * (overlay.scale || 1);
              const scaledHeight = overlayImg.height * (overlay.scale || 1);
              const x = overlay.x || 0;
              const y = overlay.y || 0;
              ctx.drawImage(overlayImg, x, y, scaledWidth, scaledHeight);
              
              // Bounding Box zeichnen wenn dieses Overlay ausgewählt ist
              if (selectedElementIndex === index) {
                drawBoundingBox(ctx, x, y, scaledWidth, scaledHeight);
              }
              
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

  function drawBoundingBox(ctx, x, y, width, height) {
    const borderColor = '#667eea';
    const borderWidth = 2;
    const handleSize = 20;
    
    // Rahmen zeichnen
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(x, y, width, height);
    
    // Resize-Handle (unten rechts)
    ctx.fillStyle = borderColor;
    ctx.fillRect(x + width - handleSize, y + height - handleSize, handleSize, handleSize);
    
    // Diagonal-Striche im Handle
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x + width - handleSize + 2 + i * 5, y + height - 2);
      ctx.lineTo(x + width - 2, y + height - handleSize + 2 + i * 5);
      ctx.stroke();
    }
  }

  async function handleAddOverlay() {
    if (!selectedOverlay) return;

    try {
      setMessage('⏳ Overlay wird hinzugefügt...');

      const overlay = overlays.find(o => o.id === selectedOverlay);
      if (!overlay) return;

      // Lade das Overlay-Bild um die Dimensionen zu erhalten
      const overlayImg = new Image();
      overlayImg.crossOrigin = 'anonymous';
      overlayImg.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Canvas bekommt die VOLLE Größe des Overlays (keine Skalierung)
        const canvasWidth = overlayImg.width;
        const canvasHeight = overlayImg.height;

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // Skaliere das Basis-Bild auf die WIDTH des Canvas
        if (imgRef.current) {
          const img = imgRef.current;
          // Skalierung basiert auf der Canvas-Breite
          const imgScale = canvasWidth / img.width;
          const scaledHeight = img.height * imgScale;
          
          // Für horizontal Overlays: Bild-Position bei (0, 1350)
          // Für vertikal Overlays: Bild zentriert
          let imgX = 0;
          let imgY = 0;
          
          if (imageFormat === 'horizontal') {
            // Horizontal: Oberste linke Ecke bei (0, 1350)
            imgX = 0;
            imgY = 1350;
          } else {
            // Vertikal: Zentriert
            imgX = 0;
            imgY = (canvasHeight - scaledHeight) / 2;
          }
          
          setImageTransform({
            x: imgX,
            y: imgY,
            scale: imgScale
          });
        }

        // Neues Overlay hinzufügen mit scale 1 (volle Größe)
        const newOverlay = {
          id: selectedOverlay,
          x: 0,
          y: 0,
          scale: 1
        };

        const newOverlays = [...appliedOverlays, newOverlay];
        setAppliedOverlays(newOverlays);
        
        // History speichern
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(JSON.stringify(newOverlays));
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        
        setMessage('✓ Overlay hinzugefügt und Bild skaliert!');
        setTimeout(() => setMessage(''), 2000);
      };
      overlayImg.onerror = () => {
        setMessage('❌ Fehler beim Laden des Overlays');
      };
      overlayImg.src = overlay.url;
    } catch (error) {
      setMessage('❌ Fehler beim Hinzufügen des Overlays');
      console.error(error);
    }
  }

  function undo() {
    // Wenn wir noch Overlay-History haben, gehe durch die Overlays
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      loadFromHistory(newIndex);
    } else if (currentVersionIndex > 0) {
      // Sonst gehe zur vorherigen Photo-Version
      const newIndex = currentVersionIndex - 1;
      loadVersionHistory(newIndex);
    }
  }

  function redo() {
    // Wenn wir noch Overlay-History haben, gehe durch die Overlays
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      loadFromHistory(newIndex);
    } else if (currentVersionIndex < photoVersions.length - 1) {
      // Sonst gehe zur nächsten Photo-Version
      const newIndex = currentVersionIndex + 1;
      loadVersionHistory(newIndex);
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

  function loadVersionHistory(index) {
    if (photoVersions[index]) {
      setCurrentVersionIndex(index);
      setHistory([]);
      setHistoryIndex(-1);
      setAppliedOverlays([]);
      
      const version = photoVersions[index];
      const newPhotoUrl = `http://localhost:${window.location.hostname === 'localhost' ? '3000' : window.location.host}/uploads/${version.filename}`;
      
      // Lade das Bild neu
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imgRef.current = img;
        redrawCanvas();
        setMessage(`✓ Version ${version.version} geladen`);
        setTimeout(() => setMessage(''), 2000);
      };
      img.src = newPhotoUrl;
    }
  }

  function updateSelectedElement(changes) {
    if (selectedElementIndex === -1) {
      // Bild ist ausgewählt
      setImageTransform(prev => ({ ...prev, ...changes }));
    } else {
      // Overlay ist ausgewählt
      const newOverlays = [...appliedOverlays];
      newOverlays[selectedElementIndex] = { ...newOverlays[selectedElementIndex], ...changes };
      setAppliedOverlays(newOverlays);
    }
  }

  function handleMoveUp() {
    updateSelectedElement({ y: (selectedElementIndex === -1 ? imageTransform.y : appliedOverlays[selectedElementIndex]?.y || 0) - 10 });
  }

  function handleMoveDown() {
    updateSelectedElement({ y: (selectedElementIndex === -1 ? imageTransform.y : appliedOverlays[selectedElementIndex]?.y || 0) + 10 });
  }

  function handleMoveLeft() {
    updateSelectedElement({ x: (selectedElementIndex === -1 ? imageTransform.x : appliedOverlays[selectedElementIndex]?.x || 0) - 10 });
  }

  function handleMoveRight() {
    updateSelectedElement({ x: (selectedElementIndex === -1 ? imageTransform.x : appliedOverlays[selectedElementIndex]?.x || 0) + 10 });
  }

  function handleZoomIn() {
    const currentScale = selectedElementIndex === -1 ? imageTransform.scale : (appliedOverlays[selectedElementIndex]?.scale || 1);
    updateSelectedElement({ scale: currentScale + 0.1 });
  }

  function handleZoomOut() {
    const currentScale = selectedElementIndex === -1 ? imageTransform.scale : (appliedOverlays[selectedElementIndex]?.scale || 1);
    if (currentScale > 0.1) {
      updateSelectedElement({ scale: Math.max(0.1, currentScale - 0.1) });
    }
  }

  async function exportCanvasWithoutSelection() {
    // Erstelle ein neues Canvas ohne die Bounding Box
    const originalCanvas = canvasRef.current;
    if (!originalCanvas) return null;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = originalCanvas.width;
    exportCanvas.height = originalCanvas.height;
    const ctx = exportCanvas.getContext('2d');

    // Zeichne alles neu ohne Bounding Box
    ctx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Bild zeichnen
    if (imgRef.current) {
      const img = imgRef.current;
      const scaledWidth = img.width * imageTransform.scale;
      const scaledHeight = img.height * imageTransform.scale;
      ctx.drawImage(img, imageTransform.x, imageTransform.y, scaledWidth, scaledHeight);
    }

    // Overlays zeichnen
    if (appliedOverlays.length > 0) {
      const imagePromises = appliedOverlays.map((overlay) => {
        return new Promise((resolve) => {
          const overlayData = overlays.find(o => o.id === overlay.id);
          if (overlayData) {
            const overlayImg = new Image();
            overlayImg.crossOrigin = 'anonymous';
            overlayImg.onload = () => {
              const scaledWidth = overlayImg.width * (overlay.scale || 1);
              const scaledHeight = overlayImg.height * (overlay.scale || 1);
              const x = overlay.x || 0;
              const y = overlay.y || 0;
              ctx.drawImage(overlayImg, x, y, scaledWidth, scaledHeight);
              resolve();
            };
            overlayImg.src = overlayData.url;
          } else {
            resolve();
          }
        });
      });

      await Promise.all(imagePromises);
    }

    return exportCanvas;
  }

  async function handleSaveVersion() {
    const exportCanvas = await exportCanvasWithoutSelection();
    if (!exportCanvas) return;

    setSaving(true);
    setMessage('⏳ Version wird gespeichert...');

    try {
      exportCanvas.toBlob(async (blob) => {
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

  async function handleFinishVersion() {
    const exportCanvas = await exportCanvasWithoutSelection();
    if (!exportCanvas) return;

    setSaving(true);
    setMessage('⏳ Wird als fertig markiert...');

    try {
      exportCanvas.toBlob(async (blob) => {
        const formData = new FormData();
        formData.append('photo', blob);
        formData.append('originalPhotoId', photoId);
        formData.append('finished', 'true');

        const response = await fetch('/api/photos/version', {
          method: 'POST',
          credentials: 'include',
          body: formData
        });

        const data = await response.json();
        if (response.ok) {
          setMessage('✓ Bild als fertig markiert!');
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
            <h3>🎯 Positionierung</h3>
            
            <div className="position-selector">
              <p className="selector-label">Auswahl:</p>
              <button 
                className={`selector-btn ${selectedElementIndex === -1 ? 'active' : ''}`}
                onClick={() => setSelectedElementIndex(-1)}
              >
                📷 Bild
              </button>
              {appliedOverlays.map((_, idx) => (
                <button 
                  key={idx}
                  className={`selector-btn ${selectedElementIndex === idx ? 'active' : ''}`}
                  onClick={() => setSelectedElementIndex(idx)}
                >
                  🎨 Overlay {idx + 1}
                </button>
              ))}
            </div>

            <p className="selector-label">Bewegen:</p>
            <div className="arrow-buttons">
              <button className="arrow-btn up" onClick={handleMoveUp} title="Nach oben">▲</button>
              <div className="arrow-sides">
                <button className="arrow-btn left" onClick={handleMoveLeft} title="Nach links">◀</button>
                <button className="arrow-btn right" onClick={handleMoveRight} title="Nach rechts">▶</button>
              </div>
              <button className="arrow-btn down" onClick={handleMoveDown} title="Nach unten">▼</button>
            </div>

            <p className="selector-label">Größe:</p>
            <div className="zoom-buttons">
              <button className="zoom-btn" onClick={handleZoomOut} title="Verkleinern">−</button>
              <span className="zoom-value">{Math.round((selectedElementIndex === -1 ? imageTransform.scale : (appliedOverlays[selectedElementIndex]?.scale || 1)) * 100)}%</span>
              <button className="zoom-btn" onClick={handleZoomIn} title="Vergrößern">+</button>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>↩️ Versionen & Bearbeitung</h3>
            
            {photoVersions.length > 1 && (
              <div className="version-info">
                <span className="version-badge">
                  Version {photoVersions[currentVersionIndex]?.version || 1} von {photoVersions.length}
                </span>
              </div>
            )}
            
            <div className="history-buttons">
              <button 
                className="btn-history"
                onClick={undo}
                disabled={historyIndex <= 0 && currentVersionIndex <= 0}
                title="Rückgängig"
              >
                ↶ Undo
              </button>
              <button 
                className="btn-history"
                onClick={redo}
                disabled={historyIndex >= history.length - 1 && currentVersionIndex >= photoVersions.length - 1}
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

            <button 
              className="btn-finish-version"
              onClick={handleFinishVersion}
              disabled={saving}
            >
              {saving ? '⏳ Wird abgeschlossen...' : '✓ Als fertig markieren'}
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
