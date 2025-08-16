"use client";

import React from 'react';
import type { HistoryItem } from '@/hooks/useHistory';

interface HistoryPanelProps {
  history: HistoryItem[];
  currentIndex: number;
  onJump: (index: number) => void;
}

const HistoryPanel = ({ history, currentIndex, onJump }: HistoryPanelProps) => {
  return (
    <div className="p-2 bg-gray-800 rounded-md">
      <h3 className="text-sm font-semibold text-gray-400 mb-2 px-2">History</h3>
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {history.length === 0 && (
          <p className="text-gray-500 text-xs px-2">No history yet.</p>
        )}
        {/* We reverse to show the most recent action at the top */}
        {[...history].reverse().map((item, i) => {
          const index = history.length - 1 - i;
          const isCurrent = index === currentIndex;
          
          return (
            <button
              key={`${index}-${item.action}`}
              onClick={() => onJump(index)}
              disabled={isCurrent}
              className={`w-full text-left text-sm px-2 py-1 rounded-md transition-colors ${
                isCurrent
                  ? 'bg-blue-600 text-white cursor-default'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              {item.action}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default HistoryPanel;
