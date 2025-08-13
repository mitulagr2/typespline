"use client";

import * as fabric from 'fabric';
import React, { useEffect, useState } from 'react';
import { loadGoogleFont } from '@/lib/font-loader';
import Input from '../ui/Input';

interface RightSidebarProps {
  activeObject: fabric.Object | null;
  onUpdate: (props: Partial<fabric.ITextOptions>) => void;
}

const RightSidebar = ({ activeObject, onUpdate }: RightSidebarProps) => {
  const [fontList, setFontList] = useState<string[]>([]);
  const isTextbox = activeObject?.type === 'textbox';

  // Fetch font list on component mount
  useEffect(() => {
    const fetchFonts = async () => {
      try {
        const response = await fetch('/api/fonts');
        if (!response.ok) throw new Error('Failed to fetch fonts');
        const fonts = await response.json();
        setFontList(fonts);
      } catch (error) {
        console.error("Error fetching fonts:", error);
      }
    };
    fetchFonts();
  }, []);

  const handleFontChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const fontFamily = e.target.value;
    if (!activeObject) return;

    try {
      await loadGoogleFont(fontFamily);
      onUpdate({ fontFamily });
    } catch (error) {
      console.error("Failed to load font:", error);
      // Optionally handle the error in the UI
    }
  };
  
  if (!activeObject || !isTextbox) {
    return (
      <aside className="w-80 bg-gray-800 text-white p-4 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Properties</h2>
        <p className="text-gray-400">Select a text layer to see its properties.</p>
      </aside>
    );
  }

  const textbox = activeObject as fabric.Textbox;

  return (
    <aside className="w-80 bg-gray-800 text-white p-4 shadow-lg space-y-4">
      <h2 className="text-lg font-semibold">Text Properties</h2>
      
      {/* Font Family */}
      <div>
        <label className="text-sm text-gray-400 mb-1 block">Font Family</label>
        <select 
          value={textbox.fontFamily}
          onChange={handleFontChange}
          className="bg-gray-700 border border-gray-600 rounded-md p-2 w-full text-white"
        >
          <option value="Arial">Arial</option>
          <option value="Helvetica">Helvetica</option>
          {fontList.map(font => (
            <option key={font} value={font}>{font}</option>
          ))}
        </select>
      </div>

      {/* Font Size & Weight */}
      <div className="flex gap-4">
        <Input 
          label="Size"
          type="number"
          value={textbox.fontSize}
          onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value, 10) })}
        />
        <Input 
          label="Weight"
          type="number"
          step="100"
          min="100"
          max="900"
          value={textbox.fontWeight}
          onChange={(e) => onUpdate({ fontWeight: e.target.value })}
        />
      </div>

      {/* Color & Opacity */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-sm text-gray-400 mb-1 block">Color</label>
          <input 
            type="color"
            value={textbox.fill as string}
            onChange={(e) => onUpdate({ fill: e.target.value })}
            className="w-full h-10 p-1 bg-gray-700 border border-gray-600 rounded-md cursor-pointer"
          />
        </div>
        <div className="flex-1">
          <label className="text-sm text-gray-400 mb-1 block">Opacity</label>
          <input 
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={textbox.opacity}
            onChange={(e) => onUpdate({ opacity: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>
      </div>
      
    </aside>
  );
};

export default RightSidebar;
