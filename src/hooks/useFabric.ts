import { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';

export const useFabric = (
  setCanvasInstance: (canvas: fabric.Canvas) => void
) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);

  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;

    const canvas = new fabric.Canvas(canvasElement, {
      backgroundColor: '#333',
      preserveObjectStacking: true,
      width: 500, // Default width
      height: 500, // Default height
    });

    fabricRef.current = canvas;
    setCanvasInstance(canvas);

    // Dispose canvas on unmount
    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, [setCanvasInstance]);

  return canvasRef;
};
