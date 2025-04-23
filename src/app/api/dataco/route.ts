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

    console.log('Running Python script with params:', scriptParams);
    const results = await PythonShell.run('DC_Jumps.py', options);
    
    // Get the last line of output (which should be the JSON result)
    const jsonResult = results[results.length - 1];
    
    try {
      const parsed = JSON.parse(jsonResult);
      
      // Remove large data fields to prevent response size issues
      if (parsed.all_content && parsed.all_content.length > 0) {
        console.log(`Result contains ${parsed.all_content.length} content lines, removing from response`);
        delete parsed.all_content;
      }
      
      return parsed;
    } catch (parseError) {
      console.error('Error parsing Python script output:', parseError);
      console.error('Raw output:', results);
      throw new Error(`Failed to parse Python script output: ${parseError.message}`);
    }
  } catch (error) {
    console.error('Error running Python script:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const dataco = url.searchParams.get('dataco');
    const baseDir = url.searchParams.get('baseDir') || '/mobileye/DC/Voice_Tagging/';

    if (!dataco) {
      return new NextResponse(
        JSON.stringify({ error: 'DATACO number is required' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await runPythonScript([
      '--action', 'load',
      '--dataco', dataco,
      '--base-dir', baseDir
    ]);
    
    return new NextResponse(
      JSON.stringify(result),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching DATACO data:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to fetch DATACO data' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, datacoNumbers, baseDir, outputPath, content } = body;
    
    console.log('POST request received:', { action, datacoNumbers, baseDir, outputPath });
    
    if (!action) {
      return new NextResponse(
        JSON.stringify({ error: 'Action is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (['load', 'compare', 'merge'].includes(action) && (!datacoNumbers || !datacoNumbers.length)) {
      return new NextResponse(
        JSON.stringify({ error: 'DATACO numbers are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (action === 'save' && (!outputPath || !content)) {
      return new NextResponse(
        JSON.stringify({ error: 'Output path and content are required for save action' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const scriptParams = ['--action', action];
    
    if (['load', 'compare', 'merge'].includes(action)) {
      scriptParams.push('--dataco', Array.isArray(datacoNumbers) ? datacoNumbers.join(',') : datacoNumbers);
      
      if (baseDir) {
        scriptParams.push('--base-dir', baseDir);
      }
    }
    
    // Add output path for both save AND merge actions
    if (['save', 'merge'].includes(action) && outputPath) {
      scriptParams.push('--output', outputPath);
    }
    
    const result = await runPythonScript(scriptParams);
    console.log('Script executed successfully, returning result');

    return new NextResponse(
      JSON.stringify(result),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to process request', 
        message: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 