// // import create from 'zustand';
// // import { fabric } from 'fabric';
// // import { CustomFabricObject } from '@/types/fabric.types';

// // interface CanvasState {
// //   canvas: fabric.Canvas | null;
// //   layers: CustomFabricObject[];
// //   initCanvas: (canvas: fabric.Canvas) => void;
// //   updateLayers: () => void;
// // }

// // export const useCanvasStore = create<CanvasState>((set, get) => ({
// //   canvas: null,
// //   layers: [],
// //   initCanvas: (canvasInstance) => set({ canvas: canvasInstance }),
// //   updateLayers: () => {
// //     const canvas = get().canvas;
// //     if (canvas) {
// //       // The logic lives inside the store now
// //       set({ layers: canvas.getObjects() as CustomFabricObject[] });
// //     }
// //   },
// // }));

// import { create } from 'zustand';
// import { fabric } from 'fabric';
// import { v4 as uuidv4 } from 'uuid'; // Let's add UUID for robust layer keys
// import type { CustomFabricObject } from '@/types/fabric.types';

// // 1. Define the shape of our store's state and actions
// interface CanvasState {
//   canvas: fabric.Canvas | null;
//   layers: CustomFabricObject[];
//   activeObject: CustomFabricObject | null;
  
//   // Actions to initialize and update state
//   initCanvas: (canvas: fabric.Canvas) => void;
//   updateLayers: () => void;
//   setActiveObject: (obj: fabric.Object | null) => void;
  
//   // Actions that modify the canvas content
//   addText: () => void;
//   deleteLayer: (layer: CustomFabricObject) => void;
//   moveLayer: (direction: 'up' | 'down' | 'top' | 'bottom') => void;
//   updateObjectProps: (props: Partial<fabric.ITextboxOptions>) => void;
// }

// // 2. Create the store using Zustand's `create` function
// export const useCanvasStore = create<CanvasState>((set, get) => ({
//   // Initial State
//   canvas: null,
//   layers: [],
//   activeObject: null,

//   // --- Initializers and State Sync Actions ---

//   initCanvas: (canvasInstance) => {
//     set({ canvas: canvasInstance });
//     get().updateLayers(); // Initial layer sync
//   },

//   updateLayers: () => {
//     const canvas = get().canvas;
//     if (canvas) {
//       const objects = canvas.getObjects() as CustomFabricObject[];
//       set({ layers: objects });
//     }
//   },
  
//   setActiveObject: (obj) => {
//     set({ activeObject: obj as CustomFabricObject | null });
//   },

//   // --- Canvas Modification Actions ---

//   addText: () => {
//     const canvas = get().canvas;
//     if (!canvas) return;
    
//     const text = new fabric.Textbox('Type here', {
//       left: 100,
//       top: 100,
//       width: 200,
//       fontSize: 24,
//       fill: '#ffffff',
//     });

//     // Add our custom ID for state management
//     (text as CustomFabricObject).id = uuidv4();

//     canvas.add(text);
//     canvas.setActiveObject(text);
//     get().updateLayers(); // Sync state after modification
//   },

//   deleteLayer: (layerToDelete) => {
//     const canvas = get().canvas;
//     if (canvas && layerToDelete) {
//       canvas.remove(layerToDelete);
//       get().updateLayers();
//     }
//   },
  
//   moveLayer: (direction) => {
//     const canvas = get().canvas;
//     const activeObject = get().activeObject;
//     if (!canvas || !activeObject) return;

//     switch (direction) {
//       case 'up':      activeObject.bringForward(); break;
//       case 'down':    activeObject.sendBackwards(); break;
//       case 'top':     activeObject.bringToFront(); break;
//       case 'bottom':  activeObject.sendToBack(); break;
//     }
//     canvas.renderAll();
//     get().updateLayers();
//   },

//   updateObjectProps: (props) => {
//     const canvas = get().canvas;
//     const activeObject = get().activeObject;
//     if (canvas && activeObject) {
//       activeObject.set(props);
//       canvas.renderAll();
//       // Note: We don't need to call updateLayers() here, as the object reference doesn't change.
//     }
//   },
// }));
