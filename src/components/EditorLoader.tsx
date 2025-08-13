"use client"; // This is the most important line!

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// This is where we perform the dynamic import inside a Client Component.
const Editor = dynamic(() => import('@/components/Editor'), {
  ssr: false, // This is now allowed because we are in a Client Component.
});

// This component's only job is to render the dynamic editor.
export default function EditorLoader() {
  return (
    <Suspense fallback={<div style={{color: 'white', padding: '20px'}}>Loading Editor...</div>}>
      <Editor />
    </Suspense>
  );
}
