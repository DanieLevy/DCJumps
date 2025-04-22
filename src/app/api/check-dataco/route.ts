import { NextRequest, NextResponse } from 'next/server';
import { PythonShell } from 'python-shell';
import path from 'path';

// Define types for our API
interface CheckExistsRequest {
  datacos: string;
  useTestDir?: boolean;
}

interface CheckExistsResponse {
  exists: boolean;
  checked_dataco: string;
  checked_path: string;
  files_found: number;
}

// Helper function to run Python script
async function runPythonScript(scriptParams: string[]): Promise<CheckExistsResponse> {
  try {
    console.log('Running python script with params:', scriptParams);
    const options = {
      scriptPath: path.join(process.cwd(), 'src/scripts'),
      args: scriptParams,
    };

    const results = await PythonShell.run('DC_Jumps.py', options);
    // Get the last line of output (which should be the JSON result)
    const jsonResult = results[results.length - 1];
    console.log('Python script result:', jsonResult);
    return JSON.parse(jsonResult);
  } catch (error) {
    console.error('Error running Python script:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  console.log('Received request to check-dataco endpoint');
  
  try {
    // Safe body parsing - only do this once
    const bodyText = await request.text();
    let body: CheckExistsRequest;
    
    try {
      body = JSON.parse(bodyText);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json({ 
        error: 'Invalid JSON in request body' 
      }, { status: 400 });
    }
    
    const { datacos, useTestDir } = body;
    
    if (!datacos) {
      console.error('Missing datacos parameter');
      return NextResponse.json({ 
        error: 'DATACO numbers are required' 
      }, { status: 400 });
    }
    
    console.log(`Checking DATACO existence for: ${datacos}, useTestDir: ${useTestDir}`);
    
    const scriptParams = [
      '--action', 'check_exists',
      '--dataco', datacos
    ];
    
    const baseDir = useTestDir ? 'TestDC' : '/mobileye/DC/Voice_Tagging/';
    scriptParams.push('--base-dir', baseDir);
    
    console.log('Executing Python script with params:', scriptParams);
    const result = await runPythonScript(scriptParams);
    console.log('Result from Python script:', result);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error checking DATACO existence:', error);
    
    // Create a simplified error object that's safe to serialize
    const errorDetails = error instanceof Error ? {
      message: error.message,
      stack: error.stack
    } : String(error);
    
    return NextResponse.json({ 
      error: 'Failed to check if DATACO files exist', 
      details: errorDetails
    }, { status: 500 });
  }
} 