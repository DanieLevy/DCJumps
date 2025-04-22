const { PythonShell } = require('python-shell');
const path = require('path');

// Test DATACO numbers
const testCases = [
  { dataco: '10579', useTestDir: true },   // This should exist in TestDC/SBS1
  { dataco: '12345', useTestDir: true },   // This exists in TestDC root
  { dataco: '99999', useTestDir: true }    // This should not exist anywhere
];

async function testCheckExists() {
  for (const testCase of testCases) {
    console.log(`\nTesting DATACO ${testCase.dataco} with useTestDir=${testCase.useTestDir}`);
    
    const options = {
      scriptPath: path.join(__dirname, 'src/scripts'),
      args: [
        '--action', 'check_exists',
        '--dataco', testCase.dataco,
        '--base-dir', testCase.useTestDir ? 'TestDC' : '/mobileye/DC/Voice_Tagging/'
      ]
    };

    try {
      console.log(`Running with options: ${JSON.stringify(options)}`);
      const results = await PythonShell.run('DC_Jumps.py', options);
      // Get the last line of output (which should be the JSON result)
      const jsonResult = results[results.length - 1];
      const parsed = JSON.parse(jsonResult);
      
      console.log('Results:', JSON.stringify(parsed, null, 2));
    } catch (error) {
      console.error('Error:', error);
    }
  }
}

testCheckExists().then(() => console.log('Done')); 