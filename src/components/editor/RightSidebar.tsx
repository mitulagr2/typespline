"use client";

import { fabric } from 'fabric';
import React, { useEffect, useMemo, useState } from 'react';
import { debounce } from 'lodash';
import { loadGoogleFont } from '@/lib/font-loader';
import { Input } from '../ui/input';
import { Slider } from '../ui/slider';
import { Label } from '../ui/label';

// Define a type for our local state
interface TextProperties {
  fill: string;
  fontSize: number;
  lineHeight: number;
  textAlign: string;
  fontFamily: string;
  fontWeight: number;
  opacity: number;
  charSpacing: number;
  shadow: fabric.Shadow | undefined;
}

interface RightSidebarProps {
  activeObject: fabric.Object | null;
  onUpdate: (props: Partial<fabric.ITextOptions | { shadow: fabric.Shadow | undefined }>) => void;
  onSaveHistory: (action: string) => void;
}

const RightSidebar = ({ activeObject, onUpdate, onSaveHistory }: RightSidebarProps) => {
  const [fontList, setFontList] = useState<string[]>([]);
  const [properties, setProperties] = useState<TextProperties | null>(null);
  // const isTextbox = activeObject?.type === 'textbox';

  // This is crucial for performance with sliders.
  // const debouncedOnUpdate = useCallback(debounce((props) => {
  //   onUpdate(props);
  // }, 100), [onUpdate]);

  const debouncedSave = useMemo(() =>
    debounce(() => {
      onSaveHistory('Modify Properties');
    }, 500), [onSaveHistory])

  // This runs whenever the user selects a new object.
  useEffect(() => {
    if (activeObject && activeObject.type === 'textbox') {
      const textbox = activeObject as fabric.Textbox;
      setProperties({
        fill: textbox.fill as string,
        fontSize: textbox.fontSize ?? 24,
        lineHeight: textbox.lineHeight ?? 1.16,
        textAlign: textbox.textAlign ?? 'left',
        fontFamily: textbox.fontFamily ?? 'Arial',
        fontWeight: (textbox.fontWeight as number) ?? 400,
        opacity: textbox.opacity ?? 1,
        charSpacing: textbox.charSpacing ?? 0,
        shadow: textbox.shadow as fabric.Shadow | undefined,
      });
    } else {
      setProperties(null);
    }
  }, [activeObject]);

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

  // This handler is for continuous changes (sliders, text inputs)
  const handlePropertyChange = (prop: keyof TextProperties, value: any) => {
    if (!properties) return;
    const newProps = { ...properties, [prop]: value };
    setProperties(newProps);
    onUpdate({ [prop]: value });
    debouncedSave();
  };

  const handleShadowPropertyChange = (prop: string, value: any) => {
    if (!properties || !properties.shadow) return;

    // Create a new shadow object to avoid direct mutation
    const newShadow = new fabric.Shadow({
      ...properties.shadow.toObject(),
      [prop]: value,
    });

    // Update local state instantly
    setProperties({ ...properties, shadow: newShadow });

    // Update the canvas (debounced for sliders)
    onUpdate({ shadow: newShadow });
    debouncedSave();
  };

  const handleFontChange = async (newFontFamily: string) => {
    if (!properties) return;

    try {
      // Step A: Perform the unique, asynchronous side effect
      await loadGoogleFont(newFontFamily);

      // Step B: Update the local state to make the UI feel instantaneous
      setProperties({ ...properties, fontFamily: newFontFamily });

      // Step C: Update the actual Fabric canvas object
      onUpdate({ fontFamily: newFontFamily });

      // Step D: Explicitly save this discrete action to history
      onSaveHistory('Change Font');

    } catch (error) {
      console.error("Failed to load font:", error);
      // Optionally, you could revert the local state change on error here
    }
  };

  // This handler is for the on/off checkbox
  const toggleShadow = (enabled: boolean) => {
    if (!properties) return;

    if (enabled) {
      const newShadow = new fabric.Shadow({
        color: '#000000',
        blur: 5,
        offsetX: 5,
        offsetY: 5,
      });
      setProperties({ ...properties, shadow: newShadow });
      onUpdate({ shadow: newShadow }); // Update canvas immediately
      onSaveHistory('Enable Shadow');
    } else {
      setProperties({ ...properties, shadow: undefined });
      onUpdate({ shadow: undefined }); // Update canvas immediately
      onSaveHistory('Disable Shadow');
    }
  };

  if (!activeObject || !properties) {
    return (
      <aside className="w-80 bg-gray-800 text-white p-4 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Properties</h2>
        <p className="text-gray-400">Select a text layer to see its properties.</p>
      </aside>
    );
  }

  return (
    <aside className="w-80 bg-gray-800 text-white p-4 flex flex-col space-y-4 shadow-lg">
      <h2 className="text-lg font-semibold">Properties</h2>

      {/* --- Main Properties --- */}
      <div className="border-b border-gray-600 pb-4 space-y-4">

        {/* Font Family */}
        <div>
          <label className="text-sm text-gray-400 mb-1 block">Font Family</label>
          <select
            value={properties.fontFamily}
            onChange={(e) => handleFontChange(e.target.value)}
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
          <Label htmlFor="Size">Size</Label>
          <Input
            id="Size"
            type="number"
            value={properties.fontSize}
            onChange={(e) => handlePropertyChange('fontSize', parseInt(e.target.value, 10))}
          />
          <Label htmlFor="Weight">Weight</Label>
          <Input
            id="Weight"
            type="number"
            step="100"
            min="100"
            max="900"
            value={properties.fontWeight}
            onChange={(e) => handlePropertyChange('fontWeight', e.target.value)}
          />
        </div>

        {/* Color & Opacity */}
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-sm text-gray-400 mb-1 block">Color</label>
            <input
              type="color"
              value={properties.fill as string}
              onChange={(e) => handlePropertyChange('fill', e.target.value)}
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
              value={properties.opacity}
              onChange={(e) => handlePropertyChange('opacity', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-400 mb-2 block">Alignment</label>
          <div className="flex items-center justify-between bg-gray-700 rounded-md">
            {/* Left Align Button */}
            <button
              onClick={() => handlePropertyChange('textAlign', 'left')}
              className={`flex-1 p-2 rounded-md transition-colors ${properties.textAlign === 'left' ? 'bg-blue-600 text-white' : 'hover:bg-gray-600'}`}
              title="Align Left"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
                <path d="M3 4H21V6H3V4ZM3 9H15V11H3V9ZM3 14H21V16H3V14ZM3 19H15V21H3V19Z" />
              </svg>
            </button>

            {/* Center Align Button */}
            <button
              onClick={() => handlePropertyChange('textAlign', 'center')}
              className={`flex-1 p-2 rounded-md transition-colors ${properties.textAlign === 'center' ? 'bg-blue-600 text-white' : 'hover:bg-gray-600'}`}
              title="Align Center"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
                <path d="M3 4H21V6H3V4ZM5 9H19V11H5V9ZM3 14H21V16H3V14ZM5 19H19V21H5V19Z" />
              </svg>
            </button>

            {/* Right Align Button */}
            <button
              onClick={() => handlePropertyChange('textAlign', 'right')}
              className={`flex-1 p-2 rounded-md transition-colors ${properties.textAlign === 'right' ? 'bg-blue-600 text-white' : 'hover:bg-gray-600'}`}
              title="Align Right"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
                <path d="M3 4H21V6H3V4ZM9 9H21V11H9V9ZM3 14H21V16H3V14ZM9 19H21V21H9V19Z" />
              </svg>
            </button>
          </div>
        </div>

        <Label htmlFor="Line Height">Line Height</Label>
        <Slider
          id="Line Height"
          min={0.5}
          max={3}
          step={0.1}
          value={[properties.lineHeight || 1.16]}
          onValueChange={(values) => handlePropertyChange('lineHeight', values[0])}
        />
        <Label htmlFor="Letter Spacing">Letter Spacing</Label>
        <Slider
          id="Letter Spacing"
          min={-200}
          max={800}
          step={10}
          value={[properties.charSpacing || 0]}
          onValueChange={(values) => handlePropertyChange('charSpacing', values[0])}
        />
      </div>

      {/* --- Shadow Properties --- */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-md font-semibold">Shadow</h3>
          <input
            type="checkbox"
            checked={!!properties.shadow}
            onChange={(e) => toggleShadow(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
          />
        </div>
        {properties.shadow && (
          <div className="space-y-4 p-4 bg-gray-900/50 rounded-lg">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm text-gray-400 mb-1 block">Color</label>
                <input type="color" value={properties.shadow?.color}
                  onChange={(e) => handleShadowPropertyChange('color', e.target.value)}
                  className="w-full h-10 p-1 bg-gray-700 border border-gray-600 rounded-md" />
              </div>
            </div>
            <Label htmlFor="Blur">Blur</Label>
            <Slider id="Blur" min={0} max={50} step={1}
              value={[properties.shadow?.blur || 0]} onValueChange={(values) => handleShadowPropertyChange('blur', values[0])} />
            <Label htmlFor="Offset X">Offset X</Label>
            <Slider id="Offset X" min={-50} max={50} step={1}
              value={[properties.shadow?.offsetX || 0]} onValueChange={(values) => handleShadowPropertyChange('offsetX', values[0])} />
            <Label htmlFor="Offset Y">Offset Y</Label>
            <Slider id="Offset Y" min={-50} max={50} step={1}
              value={[properties.shadow?.offsetY || 0]} onValueChange={(values) => handleShadowPropertyChange('offsetY', values[0])} />
          </div>
        )}
      </div>
    </aside>
  );
};

export default RightSidebar;
