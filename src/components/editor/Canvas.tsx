"use client";

import React from 'react';

interface CanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

const Canvas = ({ canvasRef }: CanvasProps) => {
  return (
    <div className="flex-grow h-full flex items-center justify-center bg-gray-700 relative">
      {/* We add the canvas element and its container for snapping lines */}
      <canvas ref={canvasRef} />
    </div>
  );
};

export default Canvas;
