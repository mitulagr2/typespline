import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.GOOGLE_FONTS_API_KEY;
  
  if (!apiKey) {
    console.error("Google Fonts API key is missing.");
    return NextResponse.json({ error: 'API key is not configured on the server' }, { status: 500 });
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/webfonts/v1/webfonts?key=${apiKey}&sort=alpha`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch fonts from Google API:', errorText);
      throw new Error('Failed to fetch fonts from Google API');
    }

    const data = await response.json();
    const fontFamilies = data.items.map((font: any) => font.family);
    
    return NextResponse.json(fontFamilies);
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    console.error(message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
