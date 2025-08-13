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

// export const useFabric = () => {
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);

//   useEffect(() => {
//     const initFabric = () => {
//       const canvasElement = canvasRef.current;
//       if (!canvasElement) return;

//       const fabricCanvas = new fabric.Canvas(canvasElement, {
//         backgroundColor: '#1e1e1e', // A dark background for the workspace
//         selection: true,
//         preserveObjectStacking: true,
//       });

//       setCanvas(fabricCanvas);
//     };

//     const disposeFabric = () => {
//       canvas?.dispose();
//       setCanvas(null);
//     };

//     initFabric();

//     return () => {
//       disposeFabric();
//     };
//   },); // Empty dependency array ensures this runs only once

//   return { canvasRef, canvas };
// };
