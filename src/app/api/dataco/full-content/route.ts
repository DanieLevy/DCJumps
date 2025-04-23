import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { outputPath, baseDir = 'TestDC' } = body;
    
    if (!outputPath) {
      return NextResponse.json(
        { error: 'Output path is required' },
        { status: 400 }
      );
    }
    
    // Construct the full path
    const fullPath = path.join(process.cwd(), baseDir, outputPath);
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json(
        { error: `File not found: ${outputPath}` },
        { status: 404 }
      );
    }
    
    // Read the file content
    const content = fs.readFileSync(fullPath, 'utf-8');
    
    // Parse the content into an array of events
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    return NextResponse.json({ 
      success: true, 
      content: lines 
    });
  } catch (error) {
    console.error('Error retrieving file content:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve file content',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 