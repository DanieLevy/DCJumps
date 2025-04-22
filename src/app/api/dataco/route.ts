import { NextRequest, NextResponse } from 'next/server';
import { PythonShell } from 'python-shell';
import path from 'path';

// Helper function to run Python script
async function runPythonScript(scriptParams: string[]) {
  try {
    const options = {
      scriptPath: path.join(process.cwd(), 'src/scripts'),
      args: scriptParams,
    };

    const results = await PythonShell.run('DC_Jumps.py', options);
    // Get the last line of output (which should be the JSON result)
    const jsonResult = results[results.length - 1];
    return JSON.parse(jsonResult);
  } catch (error) {
    console.error('Error running Python script:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const dataco = searchParams.get('dataco');
  const baseDir = searchParams.get('baseDir') || '/mobileye/DC/Voice_Tagging/';

  if (!dataco) {
    return NextResponse.json({ error: 'DATACO number is required' }, { status: 400 });
  }

  try {
    const result = await runPythonScript([
      '--action', 'load',
      '--dataco', dataco,
      '--base-dir', baseDir
    ]);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching DATACO data:', error);
    return NextResponse.json({ error: 'Failed to fetch DATACO data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, datacoNumbers, baseDir, outputPath, content } = body;
    
    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }
    
    if (['load', 'compare', 'merge'].includes(action) && (!datacoNumbers || !datacoNumbers.length)) {
      return NextResponse.json({ error: 'DATACO numbers are required' }, { status: 400 });
    }
    
    if (action === 'save' && (!outputPath || !content)) {
      return NextResponse.json({ error: 'Output path and content are required for save action' }, { status: 400 });
    }
    
    const scriptParams = ['--action', action];
    
    if (['load', 'compare', 'merge'].includes(action)) {
      scriptParams.push('--dataco', Array.isArray(datacoNumbers) ? datacoNumbers.join(',') : datacoNumbers);
      
      if (baseDir) {
        scriptParams.push('--base-dir', baseDir);
      }
    }
    
    if (action === 'save') {
      scriptParams.push('--output', outputPath);
      
      // For save action, we need to write content to a temp file and pipe it to Python
      // This is simplified - in a real implementation we'd need to handle this differently
      const result = await runPythonScript(scriptParams);
      return NextResponse.json(result);
    }
    
    const result = await runPythonScript(scriptParams);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
} 