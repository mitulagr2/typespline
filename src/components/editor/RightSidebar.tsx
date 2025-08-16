"use client";

import { fabric } from 'fabric';
import React, { useEffect, useMemo, useState } from 'react';
import { debounce } from 'lodash';
import { loadGoogleFont } from '@/lib/font-loader';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlignCenter, AlignLeft, AlignRight } from 'lucide-react';

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
    <aside className="w-80 bg-background border-l p-4 flex flex-col gap-y-6">
      <h2 className="text-lg font-semibold">Properties</h2>

      {/* --- Main Properties --- */}
      <div className="space-y-4">

        {/* Font Family - Refactored with ShadCN Select */}
        <div className="space-y-2">
          <Label>Font Family</Label>
          <Select onValueChange={handleFontChange} value={properties.fontFamily}>
            <SelectTrigger>
              <SelectValue placeholder="Select a font" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Arial">Arial</SelectItem>
              <SelectItem value="Helvetica">Helvetica</SelectItem>
              {fontList.map(font => (
                <SelectItem key={font} value={font}>{font}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Font Size & Weight - Refactored with ShadCN Input/Label */}
        <div className="flex gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="fontSize">Size</Label>
            <Input
              id="fontSize"
              type="number"
              value={properties.fontSize}
              onChange={(e) => handlePropertyChange('fontSize', parseInt(e.target.value, 10))}
            />
          </div>
          <div className="flex-1 space-y-2">
            <Label htmlFor="fontWeight">Weight</Label>
            <Input
              id="fontWeight"
              type="number"
              step="100" min="100" max="900"
              value={properties.fontWeight}
              onChange={(e) => handlePropertyChange('fontWeight', parseInt(e.target.value, 10))}
            />
          </div>
        </div>

        {/* Color & Opacity - Refactored with ShadCN Slider */}
        <div className="flex gap-4 items-end">
          <div className="flex-1 space-y-2">
            <Label>Color</Label>
            <Input
              type="color"
              value={properties.fill}
              onChange={(e) => handlePropertyChange('fill', e.target.value)}
              className="w-full h-10 p-1 cursor-pointer" // Standard input, styled to match
            />
          </div>
          <div className="flex-1 space-y-2">
            <Label>Opacity</Label>
            <Slider
              value={[properties.opacity]}
              onValueChange={(values) => handlePropertyChange('opacity', values[0])}
              min={0} max={1} step={0.01}
            />
          </div>
        </div>

        {/* Alignment - Refactored with ShadCN Button */}
        <div className="space-y-2">
          <Label>Alignment</Label>
          <div className="flex items-center justify-between border rounded-md">
            <Button
              variant={properties.textAlign === 'left' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => handlePropertyChange('textAlign', 'left')}
              className="flex-1 rounded-r-none"
            >
              <AlignLeft />
            </Button>
            <Button
              variant={properties.textAlign === 'center' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => handlePropertyChange('textAlign', 'center')}
              className="flex-1 rounded-none border-x"
            >
              <AlignCenter />
            </Button>
            <Button
              variant={properties.textAlign === 'right' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => handlePropertyChange('textAlign', 'right')}
              className="flex-1 rounded-l-none"
            >
              <AlignRight />
            </Button>
          </div>
        </div>

        {/* Line Height & Spacing - Refactored with ShadCN Slider */}
        <div className="space-y-2">
          <Label>Line Height</Label>
          <Slider value={[properties.lineHeight]} onValueChange={(v) => handlePropertyChange('lineHeight', v[0])} min={0.5} max={3} step={0.1} />
        </div>
        <div className="space-y-2">
          <Label>Letter Spacing</Label>
          <Slider value={[properties.charSpacing]} onValueChange={(v) => handlePropertyChange('charSpacing', v[0])} min={-200} max={800} step={10} />
        </div>
      </div>

      {/* --- Shadow Properties --- */}
      <div className="space-y-4 pt-4 border-t">
        {/* Shadow Toggle - Refactored with ShadCN Checkbox/Label */}
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="shadow-toggle"
            checked={!!properties.shadow}
            onCheckedChange={(checked) => toggleShadow(checked as boolean)}
          />
          <Label htmlFor="shadow-toggle" className="text-md font-semibold cursor-pointer">Shadow</Label>
        </div>
        
        {properties.shadow && (
          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <div className="flex-1 space-y-2">
              <Label>Color</Label>
              <Input type="color" value={properties.shadow.color} onChange={(e) => handleShadowPropertyChange('color', e.target.value)} className="w-full h-10 p-1 cursor-pointer" />
            </div>
            <div className="space-y-2">
              <Label>Blur</Label>
              <Slider value={[properties.shadow.blur || 0]} onValueChange={(v) => handleShadowPropertyChange('blur', v[0])} min={0} max={50} step={1} />
            </div>
            <div className="space-y-2">
              <Label>Offset X</Label>
              <Slider value={[properties.shadow.offsetX || 0]} onValueChange={(v) => handleShadowPropertyChange('offsetX', v[0])} min={-50} max={50} step={1} />
            </div>
            <div className="space-y-2">
              <Label>Offset Y</Label>
              <Slider value={[properties.shadow.offsetY || 0]} onValueChange={(v) => handleShadowPropertyChange('offsetY', v[0])} min={-50} max={50} step={1} />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default RightSidebar;
