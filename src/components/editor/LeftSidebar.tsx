"use client";

import React from 'react';
import { fabric } from 'fabric';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  Layers,
  Lock,
  Unlock,
  Copy,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
} from "lucide-react";

import { HistoryItem } from '@/hooks/useHistory';
import HistoryPanel from './HistoryPanel';

interface LeftSidebarProps {
  history: HistoryItem[];
  currentIndex: number;
  onJumpToState: (index: number) => void;
  layers: fabric.Object[];
  activeObject: fabric.Object | null;
  onLayerSelect: (obj: fabric.Object) => void;
  onLayerMove: (direction: 'front' | 'back' | 'forward' | 'backward') => void;
  onLayerLock: (obj: fabric.Object) => void;
  onLayerDuplicate: (obj: fabric.Object) => void;
}

const LeftSidebar = ({ history, currentIndex, onJumpToState, layers, activeObject, onLayerSelect, onLayerMove, onLayerLock, onLayerDuplicate }: LeftSidebarProps) => {
  return (
    <aside className="w-72 bg-background border-l p-4 flex flex-col gap-y-4">
      {/* HistoryPanel remains the same */}
      <HistoryPanel
        history={history}
        currentIndex={currentIndex}
        onJump={onJumpToState}
      />

      <div className="flex flex-col gap-y-2">
        <h2 className="text-lg font-semibold flex items-center gap-x-2">
          <Layers className="h-5 w-5" />
          Layers
        </h2>

        <div className="flex-grow space-y-1 overflow-y-auto">
          {/* 5. Refactor the layer list items */}
          {[...layers].reverse().map((layer) => {
            const isActive = layer === activeObject;
            const isLocked = !layer.selectable;

            let layerName = 'Object'; // Default name
            if (layer.type === 'textbox') {
              const textContent = (layer as fabric.Textbox).text;
              layerName = textContent ? textContent.substring(0, 20) : '[Empty Text]';
            } else if (layer.type === 'group') {
              const group = layer as fabric.Group;
              layerName = `Group (${group.size()})`;
            }

            return (
              <div
                key={(layer as any).id || `layer-${Math.random()}`} // A stable ID is best
                // 6. Use the `cn` utility for clean conditional classes
                className={cn(
                  "p-2 rounded-md flex items-center justify-between transition-colors group",
                  isActive 
                    ? "bg-accent text-accent-foreground" 
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <div onClick={() => onLayerSelect(layer)} className="flex-grow cursor-pointer truncate pr-2">
                  {layerName}
                </div>
                <div className="flex items-center gap-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* 7. Replace buttons with ShadCN + Lucide icons */}
                  <Button variant="ghost" size="icon" onClick={() => onLayerLock(layer)} title={isLocked ? "Unlock" : "Lock"}>
                    {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onLayerDuplicate(layer)} title="Duplicate">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
          {layers.length === 0 && <p className="text-sm text-muted-foreground p-2">No layers yet.</p>}
        </div>
      </div>

      {/* 8. Refactor the reordering buttons */}
      <div className="mt-auto pt-4 border-t grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" onClick={() => onLayerMove('forward')} disabled={!activeObject} className="gap-x-2">
          <ChevronUp className="h-4 w-4" /> Forward
        </Button>
        <Button variant="outline" size="sm" onClick={() => onLayerMove('backward')} disabled={!activeObject} className="gap-x-2">
          <ChevronDown className="h-4 w-4" /> Backward
        </Button>
        <Button variant="outline" size="sm" onClick={() => onLayerMove('front')} disabled={!activeObject} className="gap-x-2">
          <ChevronsUp className="h-4 w-4" /> To Front
        </Button>
        <Button variant="outline" size="sm" onClick={() => onLayerMove('back')} disabled={!activeObject} className="gap-x-2">
          <ChevronsDown className="h-4 w-4" /> To Back
        </Button>
      </div>
    </aside>
  );
};

export default LeftSidebar;
