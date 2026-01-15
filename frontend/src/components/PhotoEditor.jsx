import { useState, useEffect, useRef } from 'react';
import './PhotoEditor.css';

export default function PhotoEditor({ photoId, photoUrl, onClose, onSave, titleFontId, titleFontSize, descriptionFontId, descriptionFontSize, fonts, logo }) {
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
  const [titleInput, setTitleInput] = useState('');
  const [showTitleInput, setShowTitleInput] = useState(false);
  const [appliedTitle, setAppliedTitle] = useState(null); // {text, x, y, fontSize, font}
  const [titleY, setTitleY] = useState(20); // Y-Position des Titels
  const [fontLoaded, setFontLoaded] = useState(false); // Font ist geladen
  const [customFontName, setCustomFontName] = useState('serif'); // Name des geladenen Custom Fonts
  
  // Description States
  const [descriptionInput, setDescriptionInput] = useState('');
  const [showDescriptionInput, setShowDescriptionInput] = useState(false);
  const [appliedDescription, setAppliedDescription] = useState(null); // {text, x, y, fontSize, font}
  const [descriptionY, setDescriptionY] = useState(100); // Y-Position der Description
  const [descriptionFont, setDescriptionFont] = useState({ name: 'serif', size: 60 }); // Description Font from admin
  
  // Title Font State
  const [titleFont, setTitleFont] = useState({ name: 'serif', size: 70 }); // Title Font from admin
  
  // Logo State
  const [logoLoading, setLogoLoading] = useState(true);
  const [logoImg, setLogoImg] = useState(null); // Geladenes Logo Bild
  const [logoPosition, setLogoPosition] = useState({ x: 20, y: 20, scale: 0.15 }); // Logo Position auf Canvas
  
  const imgRef = useRef(null);
  const canvasContainerRef = useRef(null);

  // Font laden
  useEffect(() => {
    const loadCustomFonts = async () => {
      try {
        // Lade die Liste der verfügbaren Custom Fonts vom Server
        const response = await fetch('/api/fonts/list', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const availableFonts = await response.json();
          console.log('Verfügbare Fonts:', availableFonts);
          
          // Lade alle verfügbaren Fonts und register sie bei document.fonts
          const loadPromises = availableFonts.map(async (font) => {
            try {
              // Verwende den Dateinamen (ohne Extension) als Font-Name für Uniqueness
              const fontName = font.filename.substring(0, font.filename.lastIndexOf('.')) || font.filename;
              const fontFace = new FontFace(fontName, `url(${font.url})`, {
                style: 'normal',
                weight: '400'
              });
              
              await fontFace.load();
              document.fonts.add(fontFace);
              console.log(`✓ Font geladen: ${fontName} (${font.url})`);
            } catch (err) {
              console.error(`Fehler beim Laden von ${font.filename}:`, err);
            }
          });
          
          await Promise.all(loadPromises);
        }
      } catch (error) {
        console.error('Fehler beim Laden der Custom Fonts:', error);
      } finally {
        setFontLoaded(true);
      }
    };
    
    loadCustomFonts();
  }, []);

  // Update description font wenn Admin settings sich ändern
  useEffect(() => {
    if (descriptionFontId && fonts && fonts.length > 0) {
      const selectedFont = fonts.find(f => f.id === descriptionFontId);
      if (selectedFont) {
        // Verwende den gleichen Font-Namen wie in loadCustomFonts
        const fontName = selectedFont.filename.substring(0, selectedFont.filename.lastIndexOf('.')) || selectedFont.filename;
        setDescriptionFont({
          name: fontName,
          size: descriptionFontSize
        });
        console.log(`Description Font aktualisiert: ${fontName}, Größe: ${descriptionFontSize}`);
      }
    } else {
      // Fallback wenn keine Font ausgewählt
      setDescriptionFont({
        name: 'serif',
        size: descriptionFontSize
      });
    }
  }, [descriptionFontId, descriptionFontSize, fonts]);

  // Update title font wenn Admin settings sich ändern
  useEffect(() => {
    console.log('Title Font Effect triggered - titleFontId:', titleFontId, 'fonts:', fonts);
    if (titleFontId && fonts && fonts.length > 0) {
      const selectedFont = fonts.find(f => f.id === titleFontId);
      console.log('Ausgewählter Font:', selectedFont);
      if (selectedFont) {
        // Verwende den gleichen Font-Namen wie in loadCustomFonts
        const fontName = selectedFont.filename.substring(0, selectedFont.filename.lastIndexOf('.')) || selectedFont.filename;
        setTitleFont({
          name: fontName,
          size: titleFontSize
        });
        console.log(`Title Font aktualisiert: ${fontName}, Größe: ${titleFontSize}`);
      }
    } else {
      // Fallback wenn keine Font ausgewählt
      console.log('Title Font Fallback zu serif');
      setTitleFont({
        name: 'serif',
        size: titleFontSize
      });
    }
  }, [titleFontId, titleFontSize, fonts]);

  // Logo laden
  useEffect(() => {
    const loadLogo = async () => {
      try {
        setLogoLoading(true);
        if (logo && logo.url) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            setLogoImg(img);
          };
          img.onerror = () => {
            console.error('Fehler beim Laden des Logos');
            setLogoImg(null);
          };
          img.src = logo.url;
        } else {
          setLogoImg(null);
        }
      } catch (error) {
        console.error('Fehler beim Laden des Logos:', error);
        setLogoImg(null);
      } finally {
        setLogoLoading(false);
      }
    };

    loadLogo();
  }, [logo]);

  // Redraw canvas wenn Logo geladen oder Position sich ändert
  useEffect(() => {
    if (imgRef.current) {
      redrawCanvas();
    }
  }, [logoPosition, logoImg]);

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

          // Bildformat erkennen
          const format = img.width > img.height ? 'horizontal' : 'vertical';
          setImageFormat(format);

          // Temporäre Canvas-Größe setzen (wird später vom Overlay überschrieben)
          const containerWidth = canvas?.parentElement?.offsetWidth || 800;
          const containerHeight = canvas?.parentElement?.offsetHeight || 600;
          canvas.width = Math.min(containerWidth - 40, 800);
          canvas.height = Math.min(containerHeight - 40, 600);

          // Bild temporär mittig zeichnen (wird später neu positioniert)
          const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          const x = (canvas.width - scaledWidth) / 2;
          const y = (canvas.height - scaledHeight) / 2;

          ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
          setImageTransform({ x: x, y: y, scale: scale });
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
      fetchOverlays(imageFormat).then(() => {
        // Nach dem Laden der Overlays die Canvas-Größe anpassen
        if (overlays.length > 0) {
          adjustCanvasToOverlay(overlays[0]);
        }
      });
    }
  }, [imageFormat]);

  // Canvas neu zeichnen wenn sich appliedOverlays oder imageTransform ändern
  useEffect(() => {
    redrawCanvas();
  }, [appliedOverlays, imageTransform, appliedTitle, appliedDescription]);

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
      
      // NUR Overlays sind bewegbar - NICHT das Bild
      if (selectedElementIndex === -1) {
        return;
      }
      
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
    
    // Bild mit imageTransform zeichnen
    if (imgRef.current) {
      const img = imgRef.current;
      const scaledWidth = img.width * imageTransform.scale;
      const scaledHeight = img.height * imageTransform.scale;
      ctx.drawImage(img, imageTransform.x, imageTransform.y, scaledWidth, scaledHeight);
    }

    // Logo zeichnen wenn vorhanden
    if (logoImg) {
      const logoWidth = logoImg.width * logoPosition.scale;
      const logoHeight = logoImg.height * logoPosition.scale;
      ctx.drawImage(logoImg, logoPosition.x, logoPosition.y, logoWidth, logoHeight);
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
              
              // Overlay zeichnen (füllt die gesamte Canvas)
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
        // Zeichne Title NACH den Overlays
        if (appliedTitle) {
          const ctx = canvas.getContext('2d');
          ctx.font = `${appliedTitle.fontSize}px ${appliedTitle.font}`;
          ctx.fillStyle = '#FFFFFF';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(appliedTitle.text, appliedTitle.x, appliedTitle.y);
        }
        
        // Zeichne Description NACH Title
        if (appliedDescription) {
          const ctx = canvas.getContext('2d');
          drawWrappedText(ctx, appliedDescription.text, appliedDescription.x, appliedDescription.y, canvas.width - 40, appliedDescription.fontSize, appliedDescription.font, '#FFFFFF');
        }
      });
      return;
    }

    // Title zeichnen wenn keine Overlays vorhanden sind
    if (appliedTitle) {
      ctx.font = `${appliedTitle.fontSize}px ${appliedTitle.font}`;
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(appliedTitle.text, appliedTitle.x, appliedTitle.y);
    }
    
    // Description zeichnen
    if (appliedDescription) {
      drawWrappedText(ctx, appliedDescription.text, appliedDescription.x, appliedDescription.y, canvas.width - 40, appliedDescription.fontSize, appliedDescription.font, '#FFFFFF');
    }
  }

  function drawWrappedText(ctx, text, x, y, maxWidth, fontSize, fontFamily, color) {
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    // Text wrapping auf maximal 2 Zeilen
    for (let i = 0; i < words.length && lines.length < 2; i++) {
      const testLine = currentLine + (currentLine ? ' ' : '') + words[i];
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
      
      // Wenn wir auf der 2. Zeile sind und noch Wörter übrig, add "..."
      if (lines.length === 1 && i === words.length - 1) {
        lines.push(currentLine);
      } else if (lines.length === 1 && i < words.length - 1) {
        const nextTest = currentLine + ' ' + words[i + 1];
        const nextMetrics = ctx.measureText(nextTest);
        if (nextMetrics.width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = '';
        }
      }
    }
    
    if (currentLine && lines.length < 2) {
      lines.push(currentLine);
    } else if (lines.length === 2 && currentLine) {
      // Wenn noch Text übrig ist und wir schon 2 Zeilen haben, kürzbar-Zeichen hinzufügen
      lines[1] = lines[1].substring(0, lines[1].length - 3) + '...';
    }
    
    // Zeichne die Zeilen
    const lineHeight = fontSize + 4;
    const startY = y - (lines.length - 1) * lineHeight / 2;
    
    lines.forEach((line, index) => {
      ctx.fillText(line, x, startY + index * lineHeight);
    });
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

  function handleAddTitle() {
    if (!titleInput.trim()) {
      setMessage('❌ Bitte einen Titel eingeben');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const titleObj = {
      text: titleInput,
      x: canvas.width / 2,
      y: titleY,
      fontSize: titleFont.size,
      font: `${titleFont.name}, serif`
    };

    console.log('Title hinzugefügt mit Font:', titleObj.font, 'Größe:', titleObj.fontSize);
    setAppliedTitle(titleObj);
    setTitleInput('');
    setShowTitleInput(false);
    setMessage('✓ Titel hinzugefügt!');
    setTimeout(() => setMessage(''), 2000);
    redrawCanvas();
  }

  function handleAddDescription() {
    if (!descriptionInput.trim()) {
      setMessage('❌ Bitte eine Beschreibung eingeben');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const descriptionObj = {
      text: descriptionInput,
      x: canvas.width / 2,
      y: descriptionY,
      fontSize: descriptionFont.size,
      font: `${descriptionFont.name}, serif`
    };

    setAppliedDescription(descriptionObj);
    setDescriptionInput('');
    setShowDescriptionInput(false);
    setMessage('✓ Beschreibung hinzugefügt!');
    setTimeout(() => setMessage(''), 2000);
    redrawCanvas();
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

        // Canvas an das Overlay anpassen
        adjustCanvasToOverlay(overlayImg);

        // Wenn Overlay horizontal ist, Bild auf y=467 positionieren
        if (overlay.overlayType === 'horizontal') {
          setImageTransform(prev => ({ ...prev, y: 467 }));
        }

        setMessage('✓ Overlay hinzugefügt!');
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

  function adjustCanvasToOverlay(overlay) {
    if (!overlay) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Canvas-Größe auf Overlay-Größe setzen
    canvas.width = overlay.width;
    canvas.height = overlay.height;

    // Bild an die Overlay-Größe anpassen
    if (imgRef.current) {
      const img = imgRef.current;
      const scale = overlay.width / img.width;
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      
      // Bild mittig positionieren
      const x = (overlay.width - scaledWidth) / 2;
      const y = (overlay.height - scaledHeight) / 2;
      
      setImageTransform({ x: x, y: y, scale: scale });
    }

    // Canvas neu zeichnen
    redrawCanvas();
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
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3030';
      const newPhotoUrl = `${backendUrl}/uploads/${version.filename}`;
      
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

    // Bild zeichnen mit imageTransform
    if (imgRef.current) {
      const img = imgRef.current;
      const scaledWidth = img.width * imageTransform.scale;
      const scaledHeight = img.height * imageTransform.scale;
      ctx.drawImage(img, imageTransform.x, imageTransform.y, scaledWidth, scaledHeight);
    }

    // Logo zeichnen wenn vorhanden
    if (logoImg) {
      const logoWidth = logoImg.width * logoPosition.scale;
      const logoHeight = logoImg.height * logoPosition.scale;
      ctx.drawImage(logoImg, logoPosition.x, logoPosition.y, logoWidth, logoHeight);
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

    // Title zeichnen
    if (appliedTitle) {
      ctx.font = `${appliedTitle.fontSize}px ${appliedTitle.font}`;
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(appliedTitle.text, appliedTitle.x, appliedTitle.y);
    }

    // Description zeichnen
    if (appliedDescription) {
      drawWrappedText(ctx, appliedDescription.text, appliedDescription.x, appliedDescription.y, exportCanvas.width - 40, appliedDescription.fontSize, appliedDescription.font, '#FFFFFF');
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
            <h3>🎨 Logo</h3>
            
            {logoImg ? (
              <div className="logo-controls">
                <p className="selector-label">Logo-Position:</p>
                <div className="logo-position-settings">
                  <label>
                    X: <input 
                      type="number" 
                      value={logoPosition.x} 
                      onChange={(e) => {
                        const newPos = {...logoPosition, x: parseInt(e.target.value) || 0};
                        setLogoPosition(newPos);
                      }}
                      className="position-input"
                    />px
                  </label>
                  <label>
                    Y: <input 
                      type="number" 
                      value={logoPosition.y} 
                      onChange={(e) => {
                        const newPos = {...logoPosition, y: parseInt(e.target.value) || 0};
                        setLogoPosition(newPos);
                      }}
                      className="position-input"
                    />px
                  </label>
                  <label>
                    Größe: <input 
                      type="range"
                      min="0.05"
                      max="0.5"
                      step="0.05"
                      value={logoPosition.scale}
                      onChange={(e) => {
                        const newPos = {...logoPosition, scale: parseFloat(e.target.value)};
                        setLogoPosition(newPos);
                      }}
                      className="scale-slider"
                    /> {(logoPosition.scale * 100).toFixed(0)}%
                  </label>
                </div>
              </div>
            ) : (
              <p className="no-logo">Kein Logo vorhanden. Bitte im Admin-Panel hochladen.</p>
            )}
          </div>

          <div className="sidebar-section">
            <h3>📝 Titel hinzufügen</h3>
            
            {!showTitleInput ? (
              <button 
                className="btn-add-title"
                onClick={() => setShowTitleInput(true)}
              >
                📝 Titel hinzufügen
              </button>
            ) : (
              <div className="title-input-group">
                <input 
                  type="text"
                  placeholder="Titel eingeben..."
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTitle()}
                  autoFocus
                  className="title-input-field"
                />
                <button 
                  className="btn-confirm-title"
                  onClick={handleAddTitle}
                >
                  ✓ Hinzufügen
                </button>
                <button 
                  className="btn-cancel-title"
                  onClick={() => {
                    setShowTitleInput(false);
                    setTitleInput('');
                  }}
                >
                  ✕ Abbrechen
                </button>
              </div>
            )}

            {appliedTitle && (
              <div className="title-display">
                <p className="selector-label">Titel:</p>
                <div className="title-item">
                  <span className="title-preview">{appliedTitle.text}</span>
                  <button 
                    className="btn-delete-title"
                    onClick={() => {
                      setAppliedTitle(null);
                      redrawCanvas();
                    }}
                    title="Titel löschen"
                  >
                    🗑️
                  </button>
                </div>
                
                <div className="title-controls">
                  <p className="selector-label">Y-Position des Textes:</p>
                  <input 
                    type="range"
                    min="0"
                    max={canvasRef.current?.height || 600}
                    value={titleY}
                    onChange={(e) => {
                      const newY = parseInt(e.target.value);
                      setTitleY(newY);
                      const updatedTitle = { ...appliedTitle, y: newY };
                      setAppliedTitle(updatedTitle);
                    }}
                    className="title-slider"
                  />
                  <span className="value-display">{titleY}px von oben</span>
                </div>
              </div>
            )}
          </div>

          <div className="sidebar-section">
            <h3>📄 Beschreibung hinzufügen</h3>
            
            {!showDescriptionInput ? (
              <button 
                className="btn-add-description"
                onClick={() => setShowDescriptionInput(true)}
              >
                📄 Beschreibung hinzufügen
              </button>
            ) : (
              <div className="description-input-group">
                <textarea 
                  placeholder="Beschreibung eingeben..."
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                  autoFocus
                  className="description-input-field"
                  rows="3"
                />
                <button 
                  className="btn-confirm-description"
                  onClick={handleAddDescription}
                >
                  ✓ Hinzufügen
                </button>
                <button 
                  className="btn-cancel-description"
                  onClick={() => {
                    setShowDescriptionInput(false);
                    setDescriptionInput('');
                  }}
                >
                  ✕ Abbrechen
                </button>
              </div>
            )}

            {appliedDescription && (
              <div className="description-display">
                <p className="selector-label">Beschreibung:</p>
                <div className="description-item">
                  <span className="description-preview">{appliedDescription.text}</span>
                  <button 
                    className="btn-delete-description"
                    onClick={() => {
                      setAppliedDescription(null);
                      redrawCanvas();
                    }}
                    title="Beschreibung löschen"
                  >
                    🗑️
                  </button>
                </div>
                
                <div className="description-controls">
                  <p className="selector-label">Y-Position des Textes:</p>
                  <input 
                    type="range"
                    min="0"
                    max={canvasRef.current?.height || 600}
                    value={descriptionY}
                    onChange={(e) => {
                      const newY = parseInt(e.target.value);
                      setDescriptionY(newY);
                      const updatedDescription = { ...appliedDescription, y: newY };
                      setAppliedDescription(updatedDescription);
                    }}
                    className="description-slider"
                  />
                  <span className="value-display">{descriptionY}px von oben</span>
                </div>
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
