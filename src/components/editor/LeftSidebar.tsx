"use client";

import React from 'react';
import { fabric } from 'fabric';
import { Button } from '../ui/button';
import { HistoryItem } from '@/hooks/useHistory';
import HistoryPanel from './HistoryPanel';

// A simple lock icon component
const LockIcon = ({ locked }: { locked: boolean }) => (
  <svg className={`w-4 h-4 ${locked ? 'text-yellow-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {locked ? (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    )}
  </svg>
);

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
    <aside className="w-72 bg-gray-800 text-white p-4 flex flex-col">
      <HistoryPanel
        history={history}
        currentIndex={currentIndex}
        onJump={onJumpToState}
      />

      <h2 className="text-lg font-semibold mb-4">Layers</h2>

      <div className="flex-grow space-y-2 overflow-y-auto">
        {[...layers].reverse().map((layer, index) => { // Reverse to show top layer first
          const isActive = layer === activeObject;
          const isLocked = !layer.selectable;

          // const layerName = layer.type === 'textbox' ? (layer as fabric.Textbox).text.substring(0, 20) : `Layer ${index}`;
          let layerName = `Layer ${layers.length - index}`;
          if (layer.type === 'textbox') {
            const textContent = (layer as fabric.Textbox).text;
            layerName = textContent ? textContent.substring(0, 20) : '[Empty Text]';
          } else if (layer.type === 'group') {
            const group = layer as fabric.Group;
            layerName = `Group (${group.size()})`;
          }

          return (
            <div key={`${layer.type}-${index}`} className={`p-2 rounded-md flex items-center justify-between transition-colors ${isActive ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`} >
              <div onClick={() => onLayerSelect(layer)} className="flex-grow cursor-pointer truncate pr-2">
                {layerName || `[Empty Text]`}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onLayerLock(layer)} title={isLocked ? "Unlock" : "Lock"} className="hover:bg-gray-500 p-1 rounded"><LockIcon locked={isLocked} /></button>
                <button onClick={() => onLayerDuplicate(layer)} title="Duplicate" className="hover:bg-gray-500 p-1 rounded text-gray-400">D</button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-600 grid grid-cols-2 gap-2">
        <Button onClick={() => onLayerMove('forward')} disabled={!activeObject}>Bring Forward</Button>
        <Button onClick={() => onLayerMove('backward')} disabled={!activeObject}>Send Backward</Button>
        <Button onClick={() => onLayerMove('front')} disabled={!activeObject}>To Front</Button>
        <Button onClick={() => onLayerMove('back')} disabled={!activeObject}>To Back</Button>
      </div>
    </aside>
  );
};

export default LeftSidebar;
