"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import * as fabric from 'fabric';
import Canvas from "@/components/editor/Canvas";
import Header from "@/components/editor/Header";
import LeftSidebar from "@/components/editor/LeftSidebar";
import RightSidebar from "@/components/editor/RightSidebar";
import { useFabric } from '@/hooks/useFabric';
import { useHistory } from '@/hooks/useHistory';

export default function Page() {
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [activeObject, setActiveObject] = useState<fabric.Object | null>(null);
  const [layers, setLayers] = useState<fabric.Object[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const originalImage = useRef<{ element: HTMLImageElement; scale: number } | null>(null);

  const { undo, redo, saveState, canUndo, canRedo, setHistory } = useHistory(canvas);

  const updateLayers = useCallback(() => {
    if (canvas) {
      setLayers(canvas.getObjects());
    }
  }, [canvas]);

  const canvasRef = useFabric((fabricCanvas) => {
    setCanvas(fabricCanvas);

    fabricCanvas.on('selection:created', (e) => setActiveObject(e.selected[0]));
    fabricCanvas.on('selection:updated', (e) => setActiveObject(e.selected[0]));
    fabricCanvas.on('selection:cleared', () => setActiveObject(null));

    fabricCanvas.on('after:render', updateLayers);

    // Load from localStorage on init
    const savedState = localStorage.getItem('canvasState');
    if (savedState) {
        fabricCanvas.loadFromJSON(savedState, () => {
            fabricCanvas.renderAll();
            setHistory([savedState]);
        });
    } else {
        // Initialize history with empty state
        setHistory([JSON.stringify(fabricCanvas.toJSON())]);
    }
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canvas) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgObj = new Image();
      imgObj.src = event.target?.result as string;
      imgObj.onload = () => {
        const workspace = canvas.getElement().parentElement;
        if (!workspace) return;
        
        const containerWidth = workspace.clientWidth - 40;
        const containerHeight = workspace.clientHeight - 40;
        const scale = Math.min(containerWidth / imgObj.width, containerHeight / imgObj.height);
        
        originalImage.current = { element: imgObj, scale };

        canvas.setDimensions({ width: imgObj.width * scale, height: imgObj.height * scale });
        const image = new fabric.Image(imgObj, { selectable: false, evented: false });
        canvas.setBackgroundImage(image, canvas.renderAll.bind(canvas), { scaleX: scale, scaleY: scale });
        saveState();
      };
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddText = useCallback(() => {
    if (!canvas) return;
    const text = new fabric.Textbox('Type here', {
      left: 50,
      top: 50,
      width: 200,
      fontSize: 24,
      fill: '#ffffff',
      fontFamily: 'Arial',
      padding: 7,
    });
    canvas.add(text);
    canvas.setActiveObject(text);
  }, [canvas]);
  
  const updateActiveObject = (props: Partial<fabric.ITextOptions | { shadow: fabric.Shadow | null }>) => {
    if (activeObject && canvas) {
      if ('shadow' in props) {
        activeObject.set({ shadow: props.shadow });
      } else {
        activeObject.set(props);
      }
      canvas.renderAll();
      saveState();
    }
  };

  const handleLayerLock = (obj: fabric.Object) => {
    obj.set({
        selectable: !obj.selectable,
        evented: !obj.evented,
    });
    canvas?.renderAll();
    // No need to save state for a lock, as it's a UI-only feature
  };

  const handleLayerDuplicate = (obj: fabric.Object) => {
    if (!canvas) return;
    obj.clone((cloned: fabric.Object) => {
        cloned.set({
            left: obj.left + 10,
            top: obj.top + 10,
        });
        canvas.add(cloned);
        canvas.setActiveObject(cloned);
    });
  };

  const handleLayerMove = (direction: 'front' | 'back' | 'forward' | 'backward') => {
    if (!activeObject || !canvas) return;
    switch (direction) {
      case 'front': activeObject.bringToFront(); break;
      case 'back': activeObject.sendToBack(); break;
      case 'forward': activeObject.bringForward(); break;
      case 'backward': activeObject.sendBackwards(); break;
    }
    canvas.renderAll();
    saveState();
  };
  
  const handleExport = () => {
    if (!canvas || !originalImage.current) {
        alert("Please upload an image first.");
        return;
    }

    const { element, scale } = originalImage.current;
    const originalWidth = element.width;
    const originalHeight = element.height;

    // Create a temporary static canvas for high-res export
    const staticCanvas = new fabric.StaticCanvas(null, {
        width: originalWidth,
        height: originalHeight,
    });

    const bgImage = new fabric.Image(element, { selectable: false, evented: false });
    staticCanvas.setBackgroundImage(bgImage, staticCanvas.renderAll.bind(staticCanvas), {});

    canvas.getObjects().forEach(obj => {
        const clonedObj = fabric.util.object.clone(obj);
        clonedObj.set({
            left: obj.left / scale,
            top: obj.top / scale,
            scaleX: (obj.scaleX || 1) / scale,
            scaleY: (obj.scaleY || 1) / scale,
        });
        if (clonedObj.type === 'textbox') {
            (clonedObj as fabric.Textbox).set({
                width: (obj.width || 0) / scale,
                fontSize: (obj.fontSize || 24) / scale,
            });
        }
        staticCanvas.add(clonedObj);
    });

    staticCanvas.renderAll();

    const dataUrl = staticCanvas.toDataURL({ format: 'png' });

    // Trigger download
    const link = document.createElement('a');
    link.download = 'composed-image.png';
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset the canvas? All unsaved work will be lost.")) {
      if (canvas) {
        canvas.clear();
        canvas.setBackgroundImage(null, canvas.renderAll.bind(canvas));
        canvas.setDimensions({ width: 500, height: 500 });
        localStorage.removeItem('canvasState');
        setHistory([JSON.stringify(canvas.toJSON())]);
      }
    }
  };

  return (
    <main className="flex flex-col h-screen bg-gray-900 text-white">
      <Header 
        onUploadClick={() => fileInputRef.current?.click()}
        onAddText={handleAddText}
        onExport={handleExport}
        onReset={handleReset}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
      <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/png" />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar 
            layers={layers}
            activeObject={activeObject}
            onLayerSelect={(obj) => canvas?.setActiveObject(obj).renderAll()}
            onLayerMove={handleLayerMove}
            onLayerLock={handleLayerLock}
            onLayerDuplicate={handleLayerDuplicate}
        />
        <section className="flex-1 flex items-center justify-center p-4 overflow-auto bg-gray-700">
          <Canvas canvasRef={canvasRef} />
        </section>
        <RightSidebar 
          activeObject={activeObject}
          onUpdate={updateActiveObject}
        />
      </div>
    </main>
  );
}
