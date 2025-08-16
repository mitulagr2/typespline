import { useState } from 'react';
import { fabric } from 'fabric';
// import { debounce } from '@/lib/utils';

export interface HistoryItem {
  state: string; // The canvas JSON state
  action: string; // The human-readable action name
}

const MAX_HISTORY_STEPS = 20;

export const useHistory = (canvas: fabric.Canvas | null, setLayers: (layers: fabric.Object[]) => void) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryItem[]>([]);
  // const [isStateLoading, setIsStateLoading] = useState(false);

  // const loadState = (state: HistoryItem): Promise<void> => {
  //   return new Promise((resolve) => {
  //     if (!canvas) {
  //       resolve();
  //       return;
  //     }
  //     setIsStateLoading(true);
  //     canvas.loadFromJSON(state, () => {
  //       canvas.renderAll();
  //       setIsStateLoading(false);
  //       updateLayers();
  //       resolve(); // Resolve the promise AFTER rendering is complete
  //     });
  //   });
  // };

  const saveState = (action: string) => {
    if (!canvas) return;

    const jsonState = JSON.stringify(canvas.toJSON());

    const newHistoryItem: HistoryItem = { state: jsonState, action };

    setHistory(prev => {
      const newHistory = [...prev, newHistoryItem];
      // Enforce history limit
      return newHistory.slice(-MAX_HISTORY_STEPS);
    });
    setRedoStack([]); // Clear redo stack on new action
    localStorage.setItem('canvasState', jsonState);
  };

  const undo = () => {
    if (history.length <= 1 || !canvas) return; // Can't undo the initial state

    const currentState = history[history.length - 1];
    const prevState = history[history.length - 2];

    canvas.loadFromJSON(prevState.state, () => {
      // 3. This callback runs ONLY AFTER the canvas is visually correct.
      // NOW it is safe to update the declarative React world.

      // Update the canvas's visual representation
      canvas.renderAll();

      // Update the React state all at once.
      setHistory(prev => prev.slice(0, -1));
      setRedoStack(prev => [currentState, ...prev]);
      setLayers(canvas.getObjects()); // Sync the layers list

      // Finally, update localStorage.
      localStorage.setItem('canvasState', prevState.state);
    });
  };

  const redo = () => {
    if (redoStack.length === 0 || !canvas) return;

    const nextState = redoStack[0];

    canvas.loadFromJSON(nextState.state, () => {
      // 3. NOW, update the declarative world.
      canvas.renderAll();
      setHistory(prev => [...prev, nextState]);
      setRedoStack(prev => prev.slice(1));
      setLayers(canvas.getObjects());
      localStorage.setItem('canvasState', nextState.state);
    });
  };

  const jumpToState = (index: number) => {
    if (index < 0 || index >= history.length || !canvas) return;

    const targetState = history[index];
    const newRedoStack = history.slice(index + 1);
    const newHistory = history.slice(0, index + 1);

    canvas.loadFromJSON(targetState.state, () => {
      // 3. NOW, update the declarative world.
      canvas.renderAll();
      setHistory(newHistory);
      setRedoStack(newRedoStack);
      setLayers(canvas.getObjects());
      localStorage.setItem('canvasState', targetState.state);
    });
  };

  // const debouncedSaveModification = useMemo(
  //   () => debounce(() => saveState('Modify Properties'), 500), // Give it a clear name and maybe a slightly longer debounce
  //   [saveState]
  // );

  // useEffect(() => {
  //   if (!canvas) return;

  //   canvas.on('object:modified', debouncedSaveModification);

  //   return () => {
  //     canvas.off('object:modified', debouncedSaveModification);
  //   };
  // }, [canvas, debouncedSaveModification]);

  return {
    history,
    currentIndex: history.length - 1, // Expose the current index for the UI
    jumpToState,
    saveState, // Expose the specific saveState, not just the debounced one
    // debouncedSaveModification,
    undo,
    redo,
    canUndo: history.length > 1,
    canRedo: redoStack.length > 0,
    setHistory, // We still need this for initial loading
  };
};
