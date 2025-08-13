'use client';

import * as fabric from 'fabric';
import { useEffect, useRef } from 'react';

interface Props {
  setCanvas: (canvas: fabric.Canvas) => void;
  setActiveObject: (object: fabric.Object | null) => void;
}

const CanvasWrapper = ({ setCanvas, setActiveObject }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;

    const fabricCanvas = new fabric.Canvas(canvasElement, {
      backgroundColor: '#fff',
      selection: true,
      preserveObjectStacking: true,
    });

    // Event listeners for selection
    fabricCanvas.on('selection:created', (e) => setActiveObject(e.selected?.[0] || null));
    fabricCanvas.on('selection:updated', (e) => setActiveObject(e.selected?.[0] || null));
    fabricCanvas.on('selection:cleared', () => setActiveObject(null));

    setCanvas(fabricCanvas);

    // Handle responsive canvas
    const resizeObserver = new ResizeObserver(entries => {
        const { width, height } = entries[0].contentRect;
        fabricCanvas.setDimensions({ width, height });
        fabricCanvas.renderAll();
    });

    if (canvasContainerRef.current) {
        resizeObserver.observe(canvasContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      fabricCanvas.dispose();
    };
  }, [setCanvas, setActiveObject]);

  return (
    <div ref={canvasContainerRef} className="w-full h-full">
      <canvas ref={canvasRef} />
    </div>
  );
};

export default CanvasWrapper;
