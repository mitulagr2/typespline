"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface CanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

const Canvas = ({ canvasRef }: CanvasProps) => {
  return (
    <div className="flex-grow h-full flex items-center justify-center bg-muted p-4 relative">
      
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
