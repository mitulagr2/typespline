"use client";

import { fabric } from 'fabric';
import React, { useEffect, useState } from 'react';
import { loadGoogleFont } from '@/lib/font-loader';
import Input from '../ui/Input';
import Slider from '../ui/Slider';

interface RightSidebarProps {
  activeObject: fabric.Object | null;
  onUpdate: (props: Partial<fabric.ITextOptions | { shadow: fabric.Shadow | undefined }>) => void;
  onSaveHistory: (action: string) => void;
}

const RightSidebar = ({ activeObject, onUpdate, onSaveHistory }: RightSidebarProps) => {
  const [fontList, setFontList] = useState<string[]>([]);
  const isTextbox = activeObject?.type === 'textbox';

  useEffect(() => {
    const fetchFonts = async () => {
      try {
        const response = await fetch('/google-fonts.json');
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
      onSaveHistory('Change Font');
    } catch (error) {
      console.error("Failed to load font:", error);
      // Optionally handle the error in the UI
    }
  };

  const handleShadowChange = (prop: string, value: any) => {
    if (!activeObject) return;
    const currentShadow = activeObject.shadow as fabric.Shadow || new fabric.Shadow({
      color: '#000000',
      blur: 0,
      offsetX: 0,
      offsetY: 0,
    });

    if (prop === 'enabled') {
      onUpdate({ shadow: value ? currentShadow : undefined });
    } else {
      // currentShadow.set({ [prop]: value });
      (currentShadow as any)[prop] = value;
      onUpdate({ shadow: currentShadow });
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
  const shadow = textbox.shadow as fabric.Shadow;

  return (
    <aside className="w-80 bg-gray-800 text-white p-4 flex flex-col space-y-4 shadow-lg">
      <h2 className="text-lg font-semibold">Properties</h2>

      {/* --- Main Properties --- */}
      <div className="border-b border-gray-600 pb-4 space-y-4">

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

        <div>
          <label className="text-sm text-gray-400 mb-2 block">Alignment</label>
          <div className="flex items-center justify-between bg-gray-700 rounded-md">
            {/* Left Align Button */}
            <button
              onClick={() => onUpdate({ textAlign: 'left' })}
              className={`flex-1 p-2 rounded-md transition-colors ${textbox.textAlign === 'left' ? 'bg-blue-600 text-white' : 'hover:bg-gray-600'}`}
              title="Align Left"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
                <path d="M3 4H21V6H3V4ZM3 9H15V11H3V9ZM3 14H21V16H3V14ZM3 19H15V21H3V19Z" />
              </svg>
            </button>

            {/* Center Align Button */}
            <button
              onClick={() => onUpdate({ textAlign: 'center' })}
              className={`flex-1 p-2 rounded-md transition-colors ${textbox.textAlign === 'center' ? 'bg-blue-600 text-white' : 'hover:bg-gray-600'}`}
              title="Align Center"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
                <path d="M3 4H21V6H3V4ZM5 9H19V11H5V9ZM3 14H21V16H3V14ZM5 19H19V21H5V19Z" />
              </svg>
            </button>

            {/* Right Align Button */}
            <button
              onClick={() => onUpdate({ textAlign: 'right' })}
              className={`flex-1 p-2 rounded-md transition-colors ${textbox.textAlign === 'right' ? 'bg-blue-600 text-white' : 'hover:bg-gray-600'}`}
              title="Align Right"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
                <path d="M3 4H21V6H3V4ZM9 9H21V11H9V9ZM3 14H21V16H3V14ZM9 19H21V21H9V19Z" />
              </svg>
            </button>
          </div>
        </div>
      
        <Slider
          label="Line Height"
          min={0.5}
          max={3}
          step={0.1}
          value={textbox.lineHeight || 1.16}
          onChange={(e) => onUpdate({ lineHeight: parseFloat(e.target.value) })}
        />
        <Slider
          label="Letter Spacing"
          min={-200}
          max={800}
          step={10}
          value={textbox.charSpacing || 0}
          onChange={(e) => onUpdate({ charSpacing: parseInt(e.target.value, 10) })}
        />
      </div>

      {/* --- Shadow Properties --- */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-md font-semibold">Shadow</h3>
          <input
            type="checkbox"
            checked={!!shadow}
            onChange={(e) => handleShadowChange('enabled', e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
          />
        </div>
        {shadow && (
          <div className="space-y-4 p-4 bg-gray-900/50 rounded-lg">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm text-gray-400 mb-1 block">Color</label>
                <input type="color" value={shadow.color} onChange={(e) => handleShadowChange('color', e.target.value)} className="w-full h-10 p-1 bg-gray-700 border border-gray-600 rounded-md" />
              </div>
            </div>
            <Slider label="Blur" min={0} max={50} step={1} value={shadow.blur || 0} onChange={(e) => handleShadowChange('blur', parseInt(e.target.value, 10))} />
            <Slider label="Offset X" min={-50} max={50} step={1} value={shadow.offsetX || 0} onChange={(e) => handleShadowChange('offsetX', parseInt(e.target.value, 10))} />
            <Slider label="Offset Y" min={-50} max={50} step={1} value={shadow.offsetY || 0} onChange={(e) => handleShadowChange('offsetY', parseInt(e.target.value, 10))} />
          </div>
        )}
      </div>
    </aside>
  );
};

export default RightSidebar;
