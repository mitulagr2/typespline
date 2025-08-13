"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as fabric from 'fabric';
import { 
    Upload, Type, ChevronsUpDown, Trash2, Download, RefreshCw, 
    AlignLeft, AlignCenter, AlignRight, Bold, Italic, Undo2, Redo2 
} from 'lucide-react';
import { colord } from "colord";

// --- Type Definitions ---
type CustomFabricObject = fabric.Object & { id: string; };
type GoogleFont = { family: string; variants: string[]; };

// --- Constants ---
const LOCAL_STORAGE_KEY = 'adomate-canvas-state';
const MAX_HISTORY_STEPS = 20;
const SNAP_THRESHOLD = 5; // Pixels for snap-to-center

// --- Extending Fabric's Object for custom properties ---
// This ensures our custom 'id' property is saved when the canvas is serialized to JSON.
fabric.Object.prototype.toObject = (function (toObject) {
    return function (this: fabric.Object) {
        // FIX: fabric.util.object.extend is deprecated. Use modern spread syntax instead.
        return {
            ...toObject.call(this),
            id: (this as any).id,
        };
    };
})(fabric.Object.prototype.toObject);

// --- Main Application Component ---
export default function ImageEditor() {
  // --- Refs and State ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const isStateLoading = useRef(false);

  const [activeObject, setActiveObject] = useState<fabric.Object | null>(null);
  const [layers, setLayers] = useState<CustomFabricObject[]>([]);
  
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Text properties state
  const [textColor, setTextColor] = useState('#000000');
  const [fontSize, setFontSize] = useState(40);
  const [opacity, setOpacity] = useState(1);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontWeight, setFontWeight] = useState('normal');
  const [fontStyle, setFontStyle] = useState('normal');
  const [textAlign, setTextAlign] = useState('left');

  const [googleFonts, setGoogleFonts] = useState<GoogleFont[]>([]);
  const [areFontsLoading, setAreFontsLoading] = useState(true);

  // --- History & State Management ---
  const saveState = useCallback(() => {
    if (isStateLoading.current || !fabricRef.current) return;
    const canvas = fabricRef.current;
    const jsonState = JSON.stringify(canvas.toJSON());
    
    setHistory(prev => {
        const newState = [...prev.slice(0, historyIndex + 1), jsonState];
        // Trim history if it exceeds the max steps
        return newState.length > MAX_HISTORY_STEPS ? newState.slice(newState.length - MAX_HISTORY_STEPS) : newState;
    });
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY_STEPS - 1));

    localStorage.setItem(LOCAL_STORAGE_KEY, jsonState);
    updateLayers();
  }, [historyIndex]);

  const loadState = useCallback(async (state: string) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    
    isStateLoading.current = true;
    await canvas.loadFromJSON(JSON.parse(state));
    canvas.renderAll();
    isStateLoading.current = false;
    updateLayers();
  }, []);

  const undo = () => {
    if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        loadState(history[newIndex]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        loadState(history[newIndex]);
    }
  };

  // --- Canvas Initialization ---
  const initializeCanvas = useCallback(() => {
    if (canvasRef.current && containerRef.current) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        backgroundColor: '#f0f0f0',
        selection: true,
        width: containerRef.current.clientWidth,
        height: 500,
      });
      fabricRef.current = canvas;

      const handleSelection = (e: fabric.TEvent) => setActiveObject(e.selected?.[0] || null);
      
      canvas.on('selection:created', handleSelection);
      canvas.on('selection:updated', handleSelection);
      canvas.on('selection:cleared', () => setActiveObject(null));
      
      const debouncedSave = fabric.util.debounce(saveState, 300);
      canvas.on('object:modified', debouncedSave);
      
      // --- Snap to Center Logic ---
      let vLine: fabric.Line, hLine: fabric.Line;
      canvas.on('object:moving', (options) => {
          const obj = options.target;
          if (!obj) return;
          const center = obj.getCenterPoint();
          const canvasCenter = canvas.getCenter();
          
          // Vertical Snap
          if (Math.abs(center.x - canvasCenter.left) < SNAP_THRESHOLD) {
              obj.set({ left: canvasCenter.left }).setCoords();
              if (!vLine) {
                  vLine = new fabric.Line([canvasCenter.left, 0, canvasCenter.left, canvas.height!], { stroke: 'rgba(100, 100, 255, 0.8)', strokeWidth: 1, selectable: false, evented: false });
                  canvas.add(vLine);
              }
          } else if (vLine) {
              canvas.remove(vLine);
              vLine = undefined!;
          }

          // Horizontal Snap
          if (Math.abs(center.y - canvasCenter.top) < SNAP_THRESHOLD) {
              obj.set({ top: canvasCenter.top }).setCoords();
              if (!hLine) {
                  hLine = new fabric.Line([0, canvasCenter.top, canvas.width!, canvasCenter.top], { stroke: 'rgba(100, 100, 255, 0.8)', strokeWidth: 1, selectable: false, evented: false });
                  canvas.add(hLine);
              }
          } else if (hLine) {
              canvas.remove(hLine);
              hLine = undefined!;
          }
          canvas.renderAll();
      });
      
      canvas.on('mouse:up', () => {
          if (vLine) canvas.remove(vLine);
          if (hLine) canvas.remove(hLine);
          vLine = undefined!;
          hLine = undefined!;
          canvas.renderAll();
      });

      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedState) {
        loadState(savedState).then(() => {
            const jsonState = JSON.stringify(canvas.toJSON());
            setHistory([jsonState]);
            setHistoryIndex(0);
        });
      } else {
        saveState();
      }

      return () => canvas.dispose();
    }
  }, [saveState, loadState]);

  useEffect(() => {
    const cleanup = initializeCanvas();
    return () => { if (cleanup) cleanup(); };
  }, [initializeCanvas]);

  // --- Nudge with Arrow Keys ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        const canvas = fabricRef.current;
        const activeObj = canvas?.getActiveObject();
        if (!activeObj) return;

        const nudgeAmount = e.shiftKey ? 10 : 1;
        
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                activeObj.set('left', activeObj.left! - nudgeAmount);
                break;
            case 'ArrowRight':
                e.preventDefault();
                activeObj.set('left', activeObj.left! + nudgeAmount);
                break;
            case 'ArrowUp':
                e.preventDefault();
                activeObj.set('top', activeObj.top! - nudgeAmount);
                break;
            case 'ArrowDown':
                e.preventDefault();
                activeObj.set('top', activeObj.top! + nudgeAmount);
                break;
            default:
                return;
        }
        activeObj.setCoords();
        canvas.renderAll();
        // Trigger the debounced save after nudging
        fabric.util.debounce(saveState, 500)();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveState]);

  // --- Google Fonts Loading ---
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/google/fonts/main/ofl/metadata/fonts.json')
      .then(res => res.json())
      .then(data => {
        const fontList = data.font_metadata_list.map((font: any) => ({ family: font.name, variants: [] }));
        setGoogleFonts(fontList);
        setAreFontsLoading(false);
      }).catch(err => {
        console.error("Failed to load Google Fonts list", err);
        setAreFontsLoading(false);
      });
  }, []);

  // --- Layer Management ---
  const updateLayers = () => {
    const canvas = fabricRef.current;
    if (canvas) {
      const objects = canvas.getObjects() as CustomFabricObject[];
      setLayers(objects);
    }
  };

  // --- Core Functionality ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const dataUrl = await new Promise<string>(resolve => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
    });
    
    const canvas = fabricRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    try {
        const img = await fabric.Image.fromURL(dataUrl);
        const containerWidth = container.clientWidth;
        const scaleFactor = containerWidth / (img.width || containerWidth);
        const canvasHeight = (img.height || 0) * scaleFactor;

        canvas.setWidth(containerWidth);
        canvas.setHeight(canvasHeight);
        
        canvas.backgroundImage = img;
        canvas.backgroundImage.scaleX = canvas.width! / (img.width || 1);
        canvas.backgroundImage.scaleY = canvas.height! / (img.height || 1);
        
        canvas.renderAll();
        saveState();
    } catch (error) {
        console.error("Error loading image:", error);
    }
    e.target.value = '';
  };

  const addText = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const center = { x: canvas.width! / 2, y: canvas.height! / 2 };

    const text = new fabric.IText('Type Something...', {
      left: center.x,
      top: center.y,
      originX: 'center',
      originY: 'center',
      fontFamily: 'Arial',
      fontSize: 40,
      fill: '#000000',
      id: `text_${Date.now()}`
    } as any);

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    saveState();
  };

  const exportAsPNG = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const dataURL = canvas.toDataURL({ format: 'png', quality: 1, multiplier: 1 });
    const link = document.createElement('a');
    link.download = 'adomate-creation.png';
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const resetCanvas = () => {
    const canvas = fabricRef.current;
    if(canvas) {
        canvas.clear();
        canvas.backgroundColor = '#f0f0f0';
        const container = containerRef.current;
        if(container) {
            canvas.setWidth(container.clientWidth);
            canvas.setHeight(500);
        }
        canvas.renderAll();
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        saveState();
    }
  };

  // --- Property Editors ---
  useEffect(() => {
    const obj = activeObject as fabric.IText;
    if (obj && obj.type === 'i-text') {
      setTextColor(colord(obj.fill as string).toHex());
      setFontSize(Number(obj.fontSize) || 40);
      setOpacity(Number(obj.opacity) || 1);
      setFontFamily(String(obj.fontFamily) || 'Arial');
      setFontWeight(String(obj.fontWeight) || 'normal');
      setFontStyle(String(obj.fontStyle) || 'normal');
      setTextAlign(String(obj.textAlign) || 'left');
    }
  }, [activeObject]);

  const updateTextProperty = (prop: string, value: any) => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (obj) {
      obj.set(prop, value);
      canvas.renderAll();
    }
  };

  const handleFontChange = (newFontFamily: string) => {
    setFontFamily(newFontFamily);
    const font = googleFonts.find(f => f.family === newFontFamily);
    if (font) {
      const linkId = `google-font-${font.family.replace(/\s/g, '-')}`;
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${font.family.replace(/\s/g, '+')}:wght@400;700&display=swap`;
        document.head.appendChild(link);
      }
    }
    updateTextProperty('fontFamily', newFontFamily);
    saveState();
  };

  // --- Layer Controls ---
  const moveLayer = (direction: 'up' | 'down') => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if(obj && canvas) {
        if(direction === 'up') obj.bringForward();
        else obj.sendBackwards();
        canvas.renderAll();
        saveState();
    }
  };
  
  const deleteActiveObject = () => {
    const canvas = fabricRef.current;
    const activeObj = canvas?.getActiveObject();
    if(activeObj && canvas) {
        canvas.remove(activeObj);
        canvas.discardActiveObject();
        canvas.renderAll();
        saveState();
    }
  };

  // --- UI Rendering ---
  return (
    <div className="flex h-screen w-screen bg-gray-800 text-white font-sans">
      {/* Left Sidebar */}
      <aside className="w-80 bg-gray-900 p-4 flex flex-col space-y-4 overflow-y-auto">
        <h1 className="text-xl font-bold text-center">Image Composer</h1>

        <div className="space-y-3">
          <label htmlFor="image-upload" className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg cursor-pointer transition-colors">
            <Upload className="mr-2 h-5 w-5" /> Upload Image
          </label>
          <input id="image-upload" type="file" accept="image/png" className="hidden" onChange={handleImageUpload} />
          
          <button onClick={addText} className="w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
            <Type className="mr-2 h-5 w-5" /> Add Text
          </button>
        </div>
        
        <div className="flex items-center justify-center space-x-2">
            <button onClick={undo} disabled={historyIndex <= 0} className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"><Undo2 size={18}/></button>
            <span className="text-xs text-gray-400">History: {historyIndex + 1} / {history.length}</span>
            <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"><Redo2 size={18}/></button>
        </div>

        <hr className="border-gray-700" />

        <div className="flex-grow min-h-0">
          <h2 className="text-lg font-semibold mb-3">Properties</h2>
          {activeObject && activeObject.type === 'i-text' ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Font Family</label>
                <select value={fontFamily} onChange={(e) => handleFontChange(e.target.value)} disabled={areFontsLoading} className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 mt-1 text-white">
                  {areFontsLoading ? <option>Loading...</option> : <><optgroup label="System"><option>Arial</option><option>Verdana</option></optgroup><optgroup label="Google Fonts">{googleFonts.map(font => <option key={font.family} value={font.family}>{font.family}</option>)}</optgroup></>}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm text-gray-400">Size</label>
                  <input type="number" value={fontSize} onChange={(e) => { const val = parseInt(e.target.value, 10); setFontSize(val); updateTextProperty('fontSize', val); }} onBlur={saveState} className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 mt-1"/>
                </div>
                <div className="flex items-end space-x-1">
                    <button onClick={() => { const newWeight = fontWeight === 'bold' ? 'normal' : 'bold'; setFontWeight(newWeight); updateTextProperty('fontWeight', newWeight); saveState(); }} className={`p-2 rounded-md ${fontWeight === 'bold' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}><Bold size={18}/></button>
                    <button onClick={() => { const newStyle = fontStyle === 'italic' ? 'normal' : 'italic'; setFontStyle(newStyle); updateTextProperty('fontStyle', newStyle); saveState(); }} className={`p-2 rounded-md ${fontStyle === 'italic' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}><Italic size={18}/></button>
                </div>
              </div>
              <div>
                  <label className="text-sm text-gray-400">Alignment</label>
                  <div className="flex items-center space-x-1 mt-1 bg-gray-700 rounded-md p-1">
                      <button onClick={() => { setTextAlign('left'); updateTextProperty('textAlign', 'left'); saveState(); }} className={`flex-1 p-2 rounded ${textAlign === 'left' ? 'bg-blue-600' : 'hover:bg-gray-600'}`}><AlignLeft size={18} className="mx-auto"/></button>
                      <button onClick={() => { setTextAlign('center'); updateTextProperty('textAlign', 'center'); saveState(); }} className={`flex-1 p-2 rounded ${textAlign === 'center' ? 'bg-blue-600' : 'hover:bg-gray-600'}`}><AlignCenter size={18} className="mx-auto"/></button>
                      <button onClick={() => { setTextAlign('right'); updateTextProperty('textAlign', 'right'); saveState(); }} className={`flex-1 p-2 rounded ${textAlign === 'right' ? 'bg-blue-600' : 'hover:bg-gray-600'}`}><AlignRight size={18} className="mx-auto"/></button>
                  </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Color</label>
                  <input type="color" value={textColor} onChange={(e) => { setTextColor(e.target.value); updateTextProperty('fill', e.target.value); }} onBlur={saveState} className="w-full h-10 p-1 bg-gray-800 border border-gray-700 rounded-md cursor-pointer mt-1"/>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Opacity</label>
                  <input type="range" min="0" max="1" step="0.01" value={opacity} onChange={(e) => { const val = parseFloat(e.target.value); setOpacity(val); updateTextProperty('opacity', val); }} onMouseUp={saveState} onTouchEnd={saveState} className="w-full mt-3"/>
                </div>
              </div>
              <button onClick={deleteActiveObject} className="w-full flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                <Trash2 className="mr-2 h-5 w-5" /> Delete Layer
              </button>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Select a text object to edit its properties.</p>
          )}
        </div>

        <hr className="border-gray-700" />
        
        <div className="min-h-0">
            <h2 className="text-lg font-semibold mb-3">Layers</h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
                {layers.slice().reverse().map((layer) => (
                    <div key={(layer as any).id} className={`p-2 rounded-md cursor-pointer flex justify-between items-center ${activeObject === layer ? 'bg-blue-900/50' : 'bg-gray-800 hover:bg-gray-700'}`} onClick={() => fabricRef.current?.setActiveObject(layer)}>
                        <span className="truncate text-sm">{layer.type === 'i-text' ? `Text: "${(layer as fabric.IText).text?.substring(0, 20)}"` : 'Background Image'}</span>
                        <div className="flex space-x-1"><button onClick={(e) => { e.stopPropagation(); moveLayer('up'); }} className="p-1 hover:bg-gray-600 rounded"><ChevronsUpDown size={14}/></button></div>
                    </div>
                ))}
                {layers.length === 0 && <p className="text-gray-500 text-sm">No layers yet.</p>}
            </div>
        </div>

        <div className="mt-auto space-y-3 pt-4 border-t border-gray-700">
          <button onClick={exportAsPNG} className="w-full flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
            <Download className="mr-2 h-5 w-5" /> Export as PNG
          </button>
          <button onClick={resetCanvas} className="w-full flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
            <RefreshCw className="mr-2 h-5 w-5" /> Reset
          </button>
        </div>
      </aside>

      <main ref={containerRef} className="flex-1 flex items-center justify-center p-4 bg-gray-800">
        <div className="shadow-2xl max-w-full max-h-full"><canvas ref={canvasRef} /></div>
      </main>
    </div>
  );
}
