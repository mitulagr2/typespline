"use client";

import { useState, useRef, useCallback } from 'react';
import * as fabric from 'fabric';
import Canvas from "@/components/editor/Canvas";
import Header from "@/components/editor/Header";
import LeftSidebar from "@/components/editor/LeftSidebar";
import RightSidebar from "@/components/editor/RightSidebar";
import { useFabric } from '@/hooks/useFabric';

export default function Page() {
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [activeObject, setActiveObject] = useState<fabric.Object | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const originalImageDimensions = useRef<{ width: number; height: number }>({ width: 0, height: 0 });

  const canvasRef = useFabric((fabricCanvas) => {
    setCanvas(fabricCanvas);
    
    fabricCanvas.on('selection:created', (e) => setActiveObject(e.selected[0]));
    fabricCanvas.on('selection:updated', (e) => setActiveObject(e.selected[0]));
    fabricCanvas.on('selection:cleared', () => setActiveObject(null));
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canvas) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgObj = new Image();
      imgObj.src = event.target?.result as string;
      imgObj.onload = () => {
        originalImageDimensions.current = { width: imgObj.width, height: imgObj.height };

        const image = new fabric.Image(imgObj);
        const workspace = canvas.getElement().parentElement;
        if (!workspace) return;
        
        const containerWidth = workspace.clientWidth - 40; // With padding
        const containerHeight = workspace.clientHeight - 40;

        const scale = Math.min(containerWidth / imgObj.width, containerHeight / imgObj.height);
        
        canvas.setDimensions({ width: imgObj.width * scale, height: imgObj.height * scale });
        canvas.setBackgroundImage(image, canvas.renderAll.bind(canvas), {
          scaleX: scale,
          scaleY: scale,
        });
      };
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input to allow re-uploading the same file
  };

  const handleAddText = useCallback(() => {
    if (!canvas) return;
    const text = new fabric.Textbox('Type here', {
      left: 50,
      top: 50,
      width: 200,
      fontSize: 24,
      fill: '#ffffff',
      fontFamily: 'Arial'
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  }, [canvas]);

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };
  
  const updateActiveObject = (props: Partial<fabric.ITextOptions>) => {
    if (activeObject && canvas) {
      activeObject.set(props);
      canvas.renderAll();
    }
  };

  return (
    <main className="flex flex-col h-screen bg-gray-900 text-white">
      <Header 
        onUploadClick={triggerFileUpload}
        onAddText={handleAddText}
      />
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        className="hidden"
        accept="image/png" 
      />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <section className="flex-1 flex items-center justify-center p-4 overflow-auto bg-gray-800">
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
