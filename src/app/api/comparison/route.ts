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
  const datacoParams = searchParams.get('dataco');
  const baseDir = searchParams.get('baseDir') || '/mobileye/DC/Voice_Tagging/';

  if (!datacoParams) {
    return NextResponse.json({ error: 'DATACO numbers are required' }, { status: 400 });
  }

  // Parse comma-separated DATACO numbers
  const datacoNumbers = datacoParams.split(',').map(d => d.trim());
  
  if (datacoNumbers.length < 2) {
    return NextResponse.json({ 
      error: 'At least two DATACO numbers are required for comparison' 
    }, { status: 400 });
  }

  try {
    const result = await runPythonScript([
      '--action', 'compare',
      '--dataco', datacoNumbers.join(','),
      '--base-dir', baseDir
    ]);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error comparing DATACO data:', error);
    return NextResponse.json({ error: 'Failed to compare DATACO data' }, { status: 500 });
  }
} 