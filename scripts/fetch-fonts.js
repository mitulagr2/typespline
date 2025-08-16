// This script runs in a Node.js environment, so we can use `require`.
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch'); // You may need to run: npm install node-fetch@2

// Load environment variables from .env.local
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const main = async () => {
  const apiKey = process.env.GOOGLE_FONTS_API_KEY;

  if (!apiKey) {
    console.error('WARNING: GOOGLE_FONTS_API_KEY is not set in your .env.local file.');
    return;
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/webfonts/v1/webfonts?key=${apiKey}&sort=alpha`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch fonts. Status: ${response.status}`);
    }

    const data = await response.json();
    const fontFamilies = data.items.map((font) => font.family);

    // The destination for our static data file.
    // The `public` directory is served as static assets by Next.js.
    const outputPath = path.resolve(process.cwd(), 'public/google-fonts.json');
    
    // Write the font list to the file.
    fs.writeFileSync(outputPath, JSON.stringify(fontFamilies, null, 2));
  } catch (error) {
    console.error('Error fetching Google Fonts:', error);
    return;
  }
};

main();
