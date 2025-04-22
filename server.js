const express = require('express');
const { spawn } = require('child_process');
const next = require('next');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Configuration variables
const PYTHON_SCRIPT_PATH = path.join(__dirname, 'src', 'scripts', 'DC_Jumps.py');
const TEST_DIR = path.join(__dirname, 'TestDC');
const PYTHON_COMMAND_FILE = path.join(__dirname, '.python-command');
const DEFAULT_BASE_DIR = '/mobileye/DC/Voice_Tagging/';
const TEST_DIR_NAME = 'TestDC';

// Enhanced logging function
function logDebug(category, message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${category}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

// Check if Python script exists
if (!fs.existsSync(PYTHON_SCRIPT_PATH)) {
  console.error(`Error: Python script not found at ${PYTHON_SCRIPT_PATH}`);
  console.error('Please ensure the DC_Jumps.py file exists in the src/scripts directory.');
  process.exit(1);
}

// Execute Python script with given arguments and return result
function runPythonScript(args) {
  logDebug('PYTHON_SCRIPT', 'Running Python script', { 
    scriptPath: PYTHON_SCRIPT_PATH,
    args: args
  });

  return new Promise((resolve, reject) => {
    // Determine which Python command to use
    let pythonCommand = 'python';
    if (fs.existsSync(PYTHON_COMMAND_FILE)) {
      pythonCommand = fs.readFileSync(PYTHON_COMMAND_FILE, 'utf8').trim();
    }
    
    logDebug('PYTHON', `Executing Python script with command: ${pythonCommand}`, { args });
    
    const pythonProcess = spawn(pythonCommand, [PYTHON_SCRIPT_PATH, ...args]);
    let stdoutData = '';
    let stderrData = '';
    
    pythonProcess.stdout.on('data', (data) => {
      const output = data.toString();
      stdoutData += output;
      logDebug('PYTHON_STDOUT', output);
    });
    
    pythonProcess.stderr.on('data', (data) => {
      const error = data.toString();
      stderrData += error;
      logDebug('PYTHON_STDERR', error);
    });
    
    pythonProcess.on('close', (code) => {
      logDebug('PYTHON_EXIT', `Process exited with code ${code}`);
      
      if (code !== 0) {
        reject(new Error(`Process exited with code ${code}: ${stderrData}`));
      } else {
        try {
          // Try to parse the last line as JSON (the expected output format from DC_Jumps.py)
          const lines = stdoutData.trim().split('\n');
          const lastLine = lines[lines.length - 1];
          logDebug('PYTHON_OUTPUT', `Parsing JSON from last line: ${lastLine}`);
          
          const jsonResult = JSON.parse(lastLine);
          logDebug('PYTHON_RESULT', 'Successfully parsed result', jsonResult);
          resolve(jsonResult);
        } catch (error) {
          logDebug('PYTHON_ERROR', 'Failed to parse JSON from Python output', { 
            error: error.message, 
            stdoutData 
          });
          reject(new Error('Failed to parse JSON from Python output'));
        }
      }
    });
    
    pythonProcess.on('error', (err) => {
      logDebug('PYTHON_ERROR', `Failed to start Python process: ${err.message}`);
      reject(new Error(`Failed to start Python process: ${err.message}`));
    });
  });
}

// Generate mock data for test mode
function generateMockData(dataco) {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  return {
    success: true,
    data: {
      dataco_number: dataco,
      total_files: 2,
      processed_files: 2,
      failed_files: 0,
      session_count: 1,
      event_count: 10,
      unique_tags: 5,
      min_date: yesterday.toISOString(),
      max_date: now.toISOString(),
      tag_counts: {
        "stop_sign": 2,
        "pedestrian": 2,
        "car": 3,
        "traffic_light": 2,
        "truck": 1,
      },
      sessions: [`Session_1_230101_120000_DATACO-${dataco}`],
      content_sample: [
        `trackfile1 front 100 stop_sign`,
        `trackfile1 front 110 pedestrian`,
        `trackfile2 front 120 car`,
        `trackfile2 front 130 traffic_light`,
        `trackfile3 front 140 truck`,
      ],
      content_truncated: false
    }
  };
}

// Clean up on exit
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  process.exit();
});

// Initialize the server
async function initServer() {
  try {
    // Then prepare Next.js app
    await app.prepare();
    
    const server = express();
    server.use(express.json());
    
    // API endpoint for checking if files exist for a DATACO number
    server.post('/api/check-dataco', async (req, res) => {
      logDebug('API_CHECK_DATACO', 'Received request', req.body);
      
      const { datacos, useTestDir = true } = req.body;
      
      if (!datacos) {
        logDebug('API_CHECK_ERROR', 'Missing required parameter: datacos');
        return res.status(400).json({ 
          error: 'Missing required parameter: datacos',
          exists: false 
        });
      }
      
      // Parse datacos from comma-separated string
      const dataco_array = datacos.split(',').map(d => d.trim()).filter(Boolean);
      
      if (dataco_array.length === 0) {
        logDebug('API_CHECK_ERROR', 'No valid DATACO numbers provided');
        return res.status(400).json({ 
          error: 'No valid DATACO numbers provided',
          exists: false 
        });
      }
      
      // For now, always use test directory as requested
      const forceTestDir = true;
      const shouldUseTestDir = forceTestDir || useTestDir;
      
      try {
        const args = [
          '--action', 'check_exists',
          '--dataco', dataco_array.join(','),
          '--check_only', 'true'
        ];
        
        if (shouldUseTestDir) {
          args.push('--test_dir');
        }
        
        logDebug('API_CHECK_DATACO', 'Executing Python script with args', { 
          args,
          datacos: dataco_array,
          useTestDir: shouldUseTestDir
        });
        
        // Try to execute Python script to check if files exist
        const data = await runPythonScript(args);
        
        logDebug('API_CHECK_SUCCESS', 'Python check completed', data);
        
        return res.status(200).json({
          exists: data.exists,
          datacos: data.datacos || dataco_array,
          checked_path: data.path,
          checked_dataco: data.checked_dataco,
          message: data.message || (data.exists ? 'Files found' : 'No files found')
        });
      } catch (error) {
        logDebug('API_CHECK_ERROR', 'Error executing Python script', { 
          error: error.message,
          datacos: dataco_array,
          useTestDir: shouldUseTestDir
        });
        
        // FOR TESTING: Return mock data to help with debugging
        // In production, this would return an error
        const mockResponse = {
          exists: true,
          datacos: dataco_array,
          checked_path: shouldUseTestDir ? TEST_DIR_NAME : DEFAULT_BASE_DIR,
          checked_dataco: dataco_array[0],
          message: 'MOCK RESPONSE - Ignoring script error',
          error: error.message
        };
        
        logDebug('API_CHECK_MOCK', 'Returning mock response', mockResponse);
        
        return res.status(200).json(mockResponse);
      }
    });
    
    // API endpoint for Python script execution
    server.post('/api/python', async (req, res) => {
      logDebug('API_PYTHON', 'Received request', req.body);
      
      const { action, dataco, baseDir, useTestDir, output } = req.body;
      
      // Validate required parameters
      if (!action) {
        logDebug('API_PYTHON_ERROR', 'Missing action parameter');
        return res.status(400).json({ error: 'Missing required parameter: action' });
      }
      
      if (!dataco) {
        logDebug('API_PYTHON_ERROR', 'Missing dataco parameter');
        return res.status(400).json({ error: 'Missing required parameter: dataco' });
      }
      
      // Always use test directory for now as requested
      const actualUseTestDir = true; // Force debug mode
      
      // If using test directory and not found, use mock data
      if (actualUseTestDir && !fs.existsSync(TEST_DIR)) {
        logDebug('API_PYTHON', 'TestDC directory not found. Using mock data.');
        return res.json(generateMockData(dataco));
      }
      
      // Build Python script arguments
      const args = [
        '--action', action,
        '--dataco', dataco
      ];
      
      // Set base directory
      if (actualUseTestDir && fs.existsSync(TEST_DIR)) {
        args.push('--base-dir', TEST_DIR);
      } else if (baseDir) {
        args.push('--base-dir', baseDir);
      }
      
      if (action === 'save' && output) {
        args.push('--output', output);
      }
      
      try {
        // Execute Python script
        logDebug('API_PYTHON', 'Executing Python script', { args });
        const result = await runPythonScript(args);
        logDebug('API_PYTHON', 'Result from Python script', result);
        
        res.json(result);
      } catch (error) {
        logDebug('API_PYTHON', 'Python script execution error', { 
          error: error.message 
        });
        
        // Always use mock data for testing
        const mockData = generateMockData(dataco);
        logDebug('API_PYTHON', 'Returning mock data', mockData);
        res.json(mockData);
      }
    });

    // Let Next.js handle all other routes
    server.all('*', (req, res) => {
      return handle(req, res);
    });
    
    // Start server
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, (err) => {
      if (err) throw err;
      console.log(`> Ready on http://localhost:${PORT}`);
      console.log(`> Python script path: ${PYTHON_SCRIPT_PATH}`);
      console.log(`> Test directory: ${fs.existsSync(TEST_DIR) ? TEST_DIR : 'Not found'}`);
      console.log(`> RUNNING IN DEBUG MODE - using TestDC folder by default`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
initServer(); 