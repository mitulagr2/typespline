"use client";

import React from 'react';
import type { HistoryItem } from '@/hooks/useHistory';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History } from 'lucide-react';

interface HistoryPanelProps {
  history: HistoryItem[];
  currentIndex: number;
  onJump: (index: number) => void;
}

const HistoryPanel = ({ history, currentIndex, onJump }: HistoryPanelProps) => {
  return (
    <div className="flex flex-col gap-y-2">
      <h3 className="text-lg font-semibold flex items-center gap-x-2">
        <History className="h-5 w-5" />
        History
      </h3>
      
      {/* 3. Use the ShadCN ScrollArea component */}
      <ScrollArea className="h-48 rounded-md border p-2">
        {history.length <= 1 && ( // Show empty state if only "Initial State" exists
          <p className="text-muted-foreground text-sm text-center p-2">No actions yet.</p>
        )}
        
        {/* 4. Map over history items and render them as Buttons */}
        <div className="space-y-1">
          {[...history].reverse().map((item, i) => {
            // We can skip the "Initial State" from being displayed if we want
            if (item.action === 'Initial State' || item.action === 'Load from Save') return null;

            const index = history.length - 1 - i;
            const isCurrent = index === currentIndex;
            
            return (
              <Button
                key={`${index}-${item.action}`}
                onClick={() => onJump(index)}
                disabled={isCurrent}
                // 5. Use ShadCN variants for styling
                variant={isCurrent ? 'secondary' : 'ghost'}
                className="w-full justify-start text-sm h-8"
              >
                {item.action}
              </Button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default HistoryPanel;
