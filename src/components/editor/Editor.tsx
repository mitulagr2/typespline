// 'use client';

// import React from 'react';
// import LeftSidebar from './LeftSidebar';
// import RightSidebar from './RightSidebar';
// import CanvasWrapper from './CanvasWrapper';
// import Header from './Header';
// import * as fabric from 'fabric';

// const Editor = () => {
//   const [canvas, setCanvas] = React.useState<fabric.Canvas | null>(null);
//   const [activeObject, setActiveObject] = React.useState<fabric.Object | null>(null);

//   // All state and handlers will be managed here

//   return (
//     <div className="flex flex-col h-full">
//       <Header canvas={canvas} />
//       <div className="flex flex-1 overflow-hidden">
//         <LeftSidebar canvas={canvas} />
//         <main className="flex-1 flex items-center justify-center bg-gray-200 p-4">
//           <CanvasWrapper setCanvas={setCanvas} setActiveObject={setActiveObject} />
//         </main>
//         <RightSidebar canvas={canvas} activeObject={activeObject} />
//       </div>
//     </div>
//   );
// };

// export default Editor;
