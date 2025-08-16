// This script runs in a Node.js environment, so we can use `require`.
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch'); // You may need to run: npm install node-fetch@2

// Load environment variables from .env.local
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const main = async () => {
  console.log('Fetching Google Fonts list...');

  const apiKey = process.env.GOOGLE_FONTS_API_KEY;

  if (!apiKey) {
    console.error('ERROR: GOOGLE_FONTS_API_KEY is not set in your .env.local file.');
    // We exit with an error code to stop the build process if the key is missing.
    process.exit(1); 
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

    console.log(`Successfully saved ${fontFamilies.length} fonts to ${outputPath}`);
  } catch (error) {
    console.error('Error fetching Google Fonts:', error);
    process.exit(1); // Stop the build on error
  }
};

main();
