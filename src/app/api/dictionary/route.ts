import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const word = searchParams.get('word');
  const language = searchParams.get('language') || 'en';

  if (!word) {
    return NextResponse.json(
      { error: 'Word parameter is required' },
      { status: 400 }
    );
  }

  // Only support English for now
  if (language !== 'en') {
    return NextResponse.json(
      { error: 'Dictionary currently only supports English' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/${language}/${encodeURIComponent(word.toLowerCase())}`,
      {
        headers: {
          'User-Agent': 'Polyglotas Dictionary App'
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Word not found' },
          { status: 404 }
        );
      }
      throw new Error(`Dictionary API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Dictionary API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dictionary data' },
      { status: 500 }
    );
  }
}