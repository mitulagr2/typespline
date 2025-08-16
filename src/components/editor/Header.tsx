"use client";

import { Button } from "../ui/button";
import { fabric } from "fabric";

interface HeaderProps {
  activeObject: fabric.Object | null;
  onUploadClick: () => void;
  onAddText: () => void;
  onExport: () => void;
  onReset: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onGroup: () => void;
  onUngroup: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const Header = ({ activeObject, onUploadClick, onAddText, onExport, onReset, onUndo, onRedo, onGroup, onUngroup, canUndo, canRedo }: HeaderProps) => {
  const isSelection = activeObject?.type === 'activeSelection';
  const isGroup = activeObject?.type === 'group';
  console.log(activeObject);

  return (
    <header className="p-3 bg-gray-800 text-white flex justify-between items-center shadow-md z-10">
      <h1 className="text-xl font-bold">Image Text Composer</h1>
      <div className="flex items-center gap-2">
        <Button onClick={onUndo} disabled={!canUndo}>Undo</Button>
        <Button onClick={onRedo} disabled={!canRedo}>Redo</Button>
        <div className="w-px h-8 bg-gray-600 mx-2" />
        <Button onClick={onGroup} disabled={!isSelection}>Group</Button>
        <Button onClick={onUngroup} disabled={!isGroup}>Ungroup</Button>
        <div className="w-px h-8 bg-gray-600 mx-2" />
        <Button onClick={onUploadClick}>Upload Image</Button>
        <Button onClick={onAddText}>Add Text</Button>
        <div className="w-px h-8 bg-gray-600 mx-2" />
        <Button onClick={onReset} className="bg-red-600 hover:bg-red-700">Reset</Button>
        <Button onClick={onExport} className="bg-green-600 hover:bg-green-700">Export</Button>
      </div>
    </header>
  );
};

export default Header;
