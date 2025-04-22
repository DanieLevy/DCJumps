import { NextRequest, NextResponse } from 'next/server';

// This route is now a thin wrapper around our Express API endpoint
// All the actual Python processing happens in server.js

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required parameters
    if (!body.action) {
      return NextResponse.json(
        { error: 'Missing required parameter: action' },
        { status: 400 }
      );
    }
    
    if (!body.dataco) {
      return NextResponse.json(
        { error: 'Missing required parameter: dataco' },
        { status: 400 }
      );
    }

    // The request will be automatically forwarded to our Express API
    // by Next.js at /api/python since this file is at app/api/python/route.ts
    
    // Let the Express server handle it from here
    return NextResponse.next();
    
  } catch (error: any) {
    console.error('Request processing error:', error);
    return NextResponse.json(
      { error: `Failed to process request: ${error.message}` },
      { status: 400 }
    );
  }
}

// Handle GET requests 
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const dataco = searchParams.get('dataco');
  const action = searchParams.get('action') || 'load';
  const baseDir = searchParams.get('baseDir');
  const useTestDir = searchParams.get('useTestDir') === 'true';
  
  if (!dataco) {
    return NextResponse.json(
      { error: 'Missing required parameter: dataco' },
      { status: 400 }
    );
  }

  // Let the Express server handle it from here
  return NextResponse.next();
} 