"use client";

import React from 'react';

interface CanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

const Canvas = ({ canvasRef }: CanvasProps) => {
  return (
    <div className="flex-grow h-full flex items-center justify-center bg-gray-700">
      <canvas ref={canvasRef} />
    </div>
  );
};

export default Canvas;
