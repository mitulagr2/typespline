"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface CanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

const Canvas = ({ canvasRef }: CanvasProps) => {
  return (
    <div className="flex-grow h-full flex items-center justify-center bg-muted p-4 relative">
      
      {/* 2. Style the canvas element itself to match the ShadCN aesthetic. */}
      {/* It now has rounded corners, a border, and the card background color. */}
      <canvas 
        ref={canvasRef} 
        className={cn(
          "rounded-lg border static shadow-sm"
        )} 
      />

    </div>
  );
};

export default Canvas;
