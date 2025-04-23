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
    
    // Create a filename for download based on the output path
    const fileName = path.basename(outputPath);
    
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json(
      { 
        error: 'Failed to download file',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 