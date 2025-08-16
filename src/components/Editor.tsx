"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { fabric } from 'fabric';
import Canvas from "@/components/editor/Canvas";
import Header from "@/components/editor/Header";
import LeftSidebar from "@/components/editor/LeftSidebar";
import RightSidebar from "@/components/editor/RightSidebar";
import { useFabric } from '@/hooks/useFabric';
import { HistoryItem, useHistory } from '@/hooks/useHistory';
import { loadGoogleFont } from '@/lib/font-loader';

export default function Editor() {
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [activeObject, setActiveObject] = useState<fabric.Object | null>(null);
  const [layers, setLayers] = useState<fabric.Object[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const originalImage = useRef<{ element: HTMLImageElement; scale: number } | null>(null);

  const verticalLine = useRef<fabric.Line | null>(null);
  const horizontalLine = useRef<fabric.Line | null>(null);

  const updateLayers = useCallback(() => {
    if (canvas) {
      setLayers(canvas.getObjects());
    }
  }, [canvas]);

  const {
    history,
    currentIndex,
    jumpToState,
    saveState,
    // debouncedSaveModification,
    undo,
    redo,
    canUndo,
    canRedo,
    setHistory
  } = useHistory(canvas, setLayers);

  // TODO font load
  const initCanvasCallback = useCallback((fabricCanvas: fabric.Canvas) => {
    // TODO
    setCanvas(fabricCanvas);

    const handleSelection = (e: fabric.IEvent) => {
      console.log(e);
      if (e.selected) {
        setActiveObject(e.selected[0] || null);
      }
    };

    const updateActiveObjectState = () => {
      const activeObj = fabricCanvas.getActiveObject();
      console.log(activeObj);
      setActiveObject(activeObj || null);
    };

    fabricCanvas.on('selection:created', updateActiveObjectState);
    fabricCanvas.on('selection:updated', updateActiveObjectState);
    fabricCanvas.on('selection:cleared', () => setActiveObject(null));

    // fabricCanvas.on('after:render', updateLayers);

    const snapThreshold = 6; // pixels

    fabricCanvas.on('object:moving', (e) => {
      const obj = e.target;
      if (!obj) return;

      const canvasCenter = fabricCanvas.getCenter();
      obj.setCoords(); // Update object's coordinates

      const objCenter = obj.getCenterPoint();

      const snappedToV = Math.abs(objCenter.x - canvasCenter.left) < snapThreshold;
      const snappedToH = Math.abs(objCenter.y - canvasCenter.top) < snapThreshold;

      if (snappedToV) {
        obj.set({ left: canvasCenter.left - obj.getScaledWidth() / 2 }).setCoords();
      }
      if (snappedToH) {
        obj.set({ top: canvasCenter.top - obj.getScaledHeight() / 2 }).setCoords();
      }

      // // Vertical Snapping
      // if (Math.abs(objCenter.x - canvasCenter.x) < snapThreshold) {
      //   obj.set({ left: canvasCenter.x - obj.getScaledWidth() / 2 }).setCoords();
      //   snappedToV = true;
      // }

      // // Horizontal Snapping
      // if (Math.abs(objCenter.y - canvasCenter.y) < snapThreshold) {
      //   obj.set({ top: canvasCenter.y - obj.getScaledHeight() / 2 }).setCoords();
      //   snappedToH = true;
      // }

      // Draw or remove vertical line
      if (snappedToV && !verticalLine.current) {
        verticalLine.current = new fabric.Line(
          [canvasCenter.left, 0, canvasCenter.left, fabricCanvas.getHeight()],
          { stroke: 'red', strokeWidth: 1, selectable: false, evented: false }
        );
        fabricCanvas.add(verticalLine.current);
      } else if (!snappedToV && verticalLine.current) {
        fabricCanvas.remove(verticalLine.current);
        verticalLine.current = null;
      }

      // Draw or remove horizontal line
      if (snappedToH && !horizontalLine.current) {
        horizontalLine.current = new fabric.Line(
          [0, canvasCenter.top, fabricCanvas.getWidth(), canvasCenter.top],
          { stroke: 'red', strokeWidth: 1, selectable: false, evented: false }
        );
        fabricCanvas.add(horizontalLine.current);
      } else if (!snappedToH && horizontalLine.current) {
        fabricCanvas.remove(horizontalLine.current);
        horizontalLine.current = null;
      }

      fabricCanvas.requestRenderAll();
    });

    // Clean up snap lines after movement stops
    const cleanupSnapLines = () => {
      if (verticalLine.current) fabricCanvas.remove(verticalLine.current);
      if (horizontalLine.current) fabricCanvas.remove(horizontalLine.current);
      verticalLine.current = null;
      horizontalLine.current = null;
      fabricCanvas.renderAll();
    };

    fabricCanvas.on('object:modified', cleanupSnapLines);
    fabricCanvas.on('mouse:up', cleanupSnapLines);
  }, []);

  const canvasRef = useFabric(initCanvasCallback);

  useEffect(() => {
    if (!canvas) {
      return;
    }

    const loadCanvasState = async () => {
      const savedState = localStorage.getItem('canvasState');

      if (savedState) {
        // STEP 1: Fetch your local list of all VALID Google Fonts first.
        let validGoogleFonts: string[] = [];
        try {
          const response = await fetch('/google-fonts.json');
          if (response.ok) {
            validGoogleFonts = await response.json();
          }
        } catch (e) {
          console.error("Could not load local font list for validation.", e);
        }

        // STEP 2: Extract all unique font families from the saved state.
        const data = JSON.parse(savedState);
        const fontFamiliesInSave = new Set<string>();
        if (data.objects && Array.isArray(data.objects)) {
          data.objects.forEach((obj: any) => {
            if (obj.fontFamily) {
              fontFamiliesInSave.add(obj.fontFamily);
            }
          });
        }

        // STEP 3: FILTER the list to get only the fonts that are actual Google Fonts.
        const googleFontsToLoad = Array.from(fontFamiliesInSave).filter(font =>
          validGoogleFonts.includes(font)
        );

        // STEP 4: Load ONLY the valid Google Fonts.
        if (googleFontsToLoad.length > 0) {
          const fontLoadPromises = googleFontsToLoad.map(font =>
            loadGoogleFont(font) // This will no longer be called with "Arial"
          );
          await Promise.allSettled(fontLoadPromises);
        }

        // STEP 3: NOW LOAD THE DATA INTO THE CANVAS
        // By this point, all fonts are loaded and ready in the browser.
        canvas.loadFromJSON(savedState, () => {
          canvas.renderAll();

          const initialHistoryItem: HistoryItem = {
            state: savedState,
            action: 'Load from Save' // A descriptive action name
          };

          // Sync the React state after the canvas is fully loaded and rendered
          setHistory([initialHistoryItem]);
          updateLayers(); // Assuming updateLayers is wrapped in useCallback
        });

      } else {
        const initialHistoryItem: HistoryItem = {
          state: JSON.stringify(canvas.toJSON()),
          action: 'Initial State'
        };
        // If there's no saved state, initialize the history with the empty canvas.
        setHistory([initialHistoryItem]);
      }
    };

    loadCanvasState();
  }, [canvas]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canvas) return;

    const reader = new FileReader();
    // TODO
    reader.onload = (event) => {
      const imgObj = new Image();
      imgObj.src = event.target?.result as string;
      imgObj.onload = () => {
        // err
        console.log(canvas);
        const workspace = canvas.getElement().parentElement;
        if (!workspace) return;

        const containerWidth = workspace.clientWidth - 40;
        const containerHeight = workspace.clientHeight - 40;
        const scale = Math.min(containerWidth / imgObj.width, containerHeight / imgObj.height);

        originalImage.current = { element: imgObj, scale };

        canvas.setDimensions({ width: imgObj.width * scale, height: imgObj.height * scale });
        const image = new fabric.Image(imgObj, { selectable: false, evented: false });
        canvas.setBackgroundImage(image, canvas.renderAll.bind(canvas), { scaleX: scale, scaleY: scale });
        saveState('Upload Image');
        updateLayers();
      };
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddText = () => {
    if (!canvas) return;
    // TODO
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
    saveState('Add Text');
    canvas.setActiveObject(text);
    updateLayers();
  };

  const updateActiveObject = (props: Partial<fabric.ITextOptions | { shadow: fabric.Shadow | undefined }>) => {
    if (activeObject && canvas) {
      if ('shadow' in props) {
        activeObject.set({ shadow: props.shadow });
      } else {
        activeObject.set(props);
      }
      canvas.renderAll();
    }
  };

  const handleLayerLock = (obj: fabric.Object) => {
    console.log(obj);
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
        left: (obj.left ?? 0) + 10,
        top: (obj.top ?? 0) + 10,
      });
      canvas.add(cloned);
      saveState('Duplicate Layer');
      canvas.setActiveObject(cloned);
      updateLayers();
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
    saveState('Move Layer');
    updateLayers();
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
        left: (obj.left ?? 0) / scale,
        top: (obj.top ?? 0) / scale,
        scaleX: (obj.scaleX ?? 1) / scale,
        scaleY: (obj.scaleY ?? 1) / scale,
      });
      if (obj.type === 'textbox' && clonedObj.type === 'textbox') {
        const originalTextbox = obj as fabric.Textbox;
        (clonedObj as fabric.Textbox).set({
          width: (originalTextbox.width ?? 0) / scale,
          fontSize: (originalTextbox.fontSize ?? 24) / scale,
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
        canvas.backgroundImage = undefined;
        canvas.renderAll();
        canvas.setDimensions({ width: 500, height: 500 });
        localStorage.removeItem('canvasState');
        const initialHistoryItem: HistoryItem = {
          state: JSON.stringify(canvas.toJSON()),
          action: 'Initial State'
        };
        setHistory([initialHistoryItem]);
        updateLayers();
      }
    }
  };

  const handleGroup = () => {
    if (!canvas || !activeObject || activeObject.type !== 'activeSelection') {
      return;
    }
    const sel = activeObject as fabric.ActiveSelection;
    const group = sel.toGroup();
    canvas.requestRenderAll();
    saveState('Group');
    updateLayers();
  };

  const handleUngroup = () => {
    if (!canvas || !activeObject || activeObject.type !== 'group') {
      return;
    }
    const group = activeObject as fabric.Group;
    group.toActiveSelection();
    canvas.requestRenderAll();
    saveState('Ungroup');
    updateLayers();
  };

  const handleJumpToState = async (index: number) => {
    jumpToState(index);
  };

  const handleUndo = async () => {
    undo();
  };

  const handleRedo = async () => {
    redo();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeObject || !canvas) return;

      const nudgeAmount = e.shiftKey ? 10 : 1;
      let needsUpdate = true;

      const currentTop = activeObject.top ?? 0;
      const currentLeft = activeObject.left ?? 0;

      switch (e.key) {
        case 'ArrowUp':
          activeObject.set('top', currentTop - nudgeAmount);
          break;
        case 'ArrowDown':
          activeObject.set('top', currentTop + nudgeAmount);
          break;
        case 'ArrowLeft':
          activeObject.set('left', currentLeft - nudgeAmount);
          break;
        case 'ArrowRight':
          activeObject.set('left', currentLeft + nudgeAmount);
          break;
        default:
          needsUpdate = false;
      }

      if (needsUpdate) {
        e.preventDefault();
        activeObject.setCoords();
        canvas.renderAll();
        // We can call saveState directly or let the object:modified event handle it
        // Calling it directly might create too many history states, so we'll rely on a mouseup/modified event
      }
    };

    // We also need to save state after nudging is finished
    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        saveState('Nudge ' + e.key.substring(5));
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeObject, canvas, saveState]);

  return (
    <main className="flex flex-col h-screen bg-gray-900 text-white">
      <Header
        activeObject={activeObject}
        onUploadClick={() => fileInputRef.current?.click()}
        onAddText={handleAddText}
        onExport={handleExport}
        onReset={handleReset}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onGroup={handleGroup}
        onUngroup={handleUngroup}
        canUndo={canUndo}
        canRedo={canRedo}
      />
      <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/png" />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar
          history={history}
          currentIndex={currentIndex}
          onJumpToState={handleJumpToState}
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
          onSaveHistory={saveState}
        />
      </div>
    </main>
  );
}
