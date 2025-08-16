export const loadGoogleFont = async (fontFamily: string) => {
  const fontId = `font-${fontFamily.replace(/\s+/g, '-')}`;

  if (document.getElementById(fontId)) {
    // Font is already loaded or is being loaded, but let's ensure it's ready
    try {
      await document.fonts.load(`1em ${fontFamily}`);
    } catch (e) {
      console.error(`Could not load font ${fontFamily}:`, e);
    }
    return;
  }

  const link = document.createElement('link');
  link.id = fontId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@400;700&display=swap`;
  
  document.head.appendChild(link);

  // Wait for the font to be loaded before resolving the promise
  return new Promise<void>((resolve, reject) => {
    link.onload = async () => {
      try {
        await document.fonts.load(`1em ${fontFamily}`);
        resolve();
      } catch (e) {
        console.error(`Could not load font ${fontFamily}:`, e);
        reject(e);
      }
    };
    link.onerror = () => {
      const errorMsg = `Failed to load stylesheet for font: ${fontFamily}`;
      console.error(errorMsg);
      reject(new Error(errorMsg));
    };
  });
};
