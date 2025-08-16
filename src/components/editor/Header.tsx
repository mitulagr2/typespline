"use client";

import { fabric } from "fabric";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  Undo2,
  Redo2,
  Group,
  Ungroup,
  Upload,
  Type,
  Trash2,
  Download,
} from "lucide-react";

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
    <header className="h-16 bg-background border-b px-4 flex justify-between items-center z-10">
      <h1 className="text-xl font-bold">Image Text Composer</h1>
      
      {/* 4. Wrap the entire button group in a TooltipProvider */}
      <TooltipProvider>
        <div className="flex items-center gap-2">
          
          {/* Undo/Redo Group */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onUndo} disabled={!canUndo}>
                <Undo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Undo</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onRedo} disabled={!canRedo}>
                <Redo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Redo</p>
            </TooltipContent>
          </Tooltip>

          {/* 5. Use ShadCN Separator */}
          <Separator orientation="vertical" className="h-8 mx-2" />

          {/* Grouping Group */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onGroup} disabled={!isSelection}>
                <Group className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Group</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onUngroup} disabled={!isGroup}>
                <Ungroup className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ungroup</p>
            </TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-8 mx-2" />

          {/* Object Creation Group */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onUploadClick}>
                <Upload className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Upload Image</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onAddText}>
                <Type className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add Text</p>
            </TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-8 mx-2" />

          {/* Final Actions Group */}
          <Tooltip>
            <TooltipTrigger asChild>
              {/* 6. Use the `destructive` variant for the Reset button */}
              <Button variant="destructive" size="icon" onClick={onReset}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reset Canvas</p>
            </TooltipContent>
          </Tooltip>
          {/* 7. Use the default primary style for the main action */}
          <Button onClick={onExport} className="gap-x-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </TooltipProvider>
    </header>
  );
};

export default Header;
