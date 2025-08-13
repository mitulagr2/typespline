import { useState, useMemo, useEffect } from 'react';
import { fabric } from 'fabric';
import { debounce } from '@/lib/utils';

const MAX_HISTORY_LENGTH = 20;

export const useHistory = (canvas: fabric.Canvas | null) => {
  const [history, setHistory] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [isStateLoading, setIsStateLoading] = useState(false);

  const saveState = () => {
    if (!canvas || isStateLoading) return;
    
    const jsonState = JSON.stringify(canvas.toJSON());
    
    // Prevent saving the same state consecutively
    if (history.length > 0 && history[history.length - 1] === jsonState) {
      return;
    }
    
    setHistory(prev => {
        const newHistory = [...prev, jsonState];
        // Enforce history limit
        return newHistory.slice(Math.max(newHistory.length - MAX_HISTORY_LENGTH, 0));
    });
    setRedoStack([]); // Clear redo stack on new action
    localStorage.setItem('canvasState', jsonState);
  };

  const debouncedSaveState = useMemo(() => debounce(saveState, 300), [saveState]);

  useEffect(() => {
    if (!canvas) return;

    canvas.on('object:added', debouncedSaveState);
    canvas.on('object:modified', debouncedSaveState);
    canvas.on('object:removed', debouncedSaveState);

    return () => {
      canvas.off('object:added', debouncedSaveState);
      canvas.off('object:modified', debouncedSaveState);
      canvas.off('object:removed', debouncedSaveState);
    };
  }, [canvas, debouncedSaveState]);

  const loadState = (state: string) => {
    if (!canvas) return;
    setIsStateLoading(true);
    canvas.loadFromJSON(state, () => {
      canvas.renderAll();
      setIsStateLoading(false);
    });
  };

  const undo = () => {
    if (history.length <= 1 || !canvas) return; // Can't undo the initial state
    
    const currentState = history[history.length - 1];
    const prevState = history[history.length - 2];

    setRedoStack(prev => [currentState, ...prev]);
    setHistory(prev => prev.slice(0, -1));

    loadState(prevState);
    localStorage.setItem('canvasState', prevState);
  };

  const redo = () => {
    if (redoStack.length === 0 || !canvas) return;

    const nextState = redoStack[0];
    
    setHistory(prev => [...prev, nextState]);
    setRedoStack(prev => prev.slice(1));
    
    loadState(nextState);
    localStorage.setItem('canvasState', nextState);
  };

  return { 
    undo, 
    redo, 
    saveState: debouncedSaveState, 
    canUndo: history.length > 1, 
    canRedo: redoStack.length > 0,
    setHistory, // Expose to initialize with saved state
  };
};
