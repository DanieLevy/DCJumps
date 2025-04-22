"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { 
  ArrowRightIcon, 
  MagnifyingGlassIcon,
  FolderIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import AppLogo from '@/components/common/AppLogo';
import LoadingSpinner from '@/components/common/LoadingSpinner';

// Define constants for paths
const DEFAULT_BASE_DIR = '/mobileye/DC/Voice_Tagging/';
const TEST_DIR_NAME = 'TestDC';

// Enhanced logging
function logDebug(category, message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${category}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

export default function Home() {
  const router = useRouter();
  const [datacoNumbers, setDatacoNumbers] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [testDataAvailable, setTestDataAvailable] = useState<string[]>([]);
  
  // Use TestDC directory (debug mode)
  const [useTestDir, setUseTestDir] = useState(true);

  // On mount, check for available test data
  useEffect(() => {
    // Hardcoded list of known test DATACOs
    const knownDATACOs = ['12345', '54321', '10579', '10578', '10680', '10687', '11888', '10688'];
    setTestDataAvailable(knownDATACOs);
    
    // Log that we're starting in debug mode
    logDebug('HOME_INIT', 'Application initialized in debug mode', { 
      useTestDir: true,
      availableTestData: knownDATACOs
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    
    logDebug('HOME_SUBMIT', 'Form submitted', { 
      datacoNumbers, 
      useTestDir,
      timestamp: new Date().toISOString(),
      parsed: datacoNumbers.split(/[\s,]+/).filter(n => n.trim())
    });
    
    if (!datacoNumbers.trim()) {
      setError('Please enter at least one DATACO number.');
      logDebug('HOME_VALIDATION_ERROR', 'Empty DATACO numbers input');
      return;
    }
    
    const numbers = datacoNumbers
      .split(/[\s,]+/)
      .filter(n => n.trim() && /^\d+$/.test(n.trim()));
    
    logDebug('HOME_PARSED', 'Parsed DATACO numbers', { 
      original: datacoNumbers,
      parsed: numbers, 
      invalidRemoved: datacoNumbers.split(/[\s,]+/).filter(n => n.trim()).length - numbers.length
    });
    
    if (numbers.length === 0) {
      setError('Please enter valid DATACO numbers (digits only).');
      logDebug('HOME_VALIDATION_ERROR', 'No valid DATACO numbers found');
      return;
    }
    
    setIsLoading(true);
    
    try {
      logDebug('HOME_API_CALL', 'Calling check-dataco API', { 
        datacos: numbers.join(','), 
        useTestDir,
        url: '/api/check-dataco',
        timestamp: new Date().toISOString()
      });
      
      // Call the new check endpoint
      const response = await axios.post('/api/check-dataco', { 
        datacos: numbers.join(','), // Send as comma-separated string
        useTestDir: useTestDir 
      });
      
      logDebug('HOME_API_RESPONSE', 'Received response from API', {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        timestamp: new Date().toISOString(),
        responseTime: `${new Date().getTime() - new Date(logDebug['lastCallTime'] || 0).getTime()}ms`
      });
      
      if (response.data.exists) {
        logDebug('HOME_NAVIGATION', 'Files exist, navigating to dashboard', {
          datacos: numbers.join(','),
          useTestDir,
          path: `/dashboard?datacos=${numbers.join(',')}&useTestDir=${useTestDir}`,
          timestamp: new Date().toISOString()
        });
        
        // Files exist, navigate to dashboard
        // Pass only necessary info: datacos and useTestDir flag
        router.push(`/dashboard?datacos=${numbers.join(',')}&useTestDir=${useTestDir}`);
      } else {
        // Files don't exist, show error message
        const errorMsg = `No data found for DATACO ${response.data.checked_dataco || numbers[0]} in ${response.data.checked_path || (useTestDir ? TEST_DIR_NAME : DEFAULT_BASE_DIR)}.`;
        logDebug('HOME_ERROR', 'No files found error', {
          message: errorMsg,
          responseData: response.data,
          timestamp: new Date().toISOString()
        });
        setError(errorMsg);
        setIsLoading(false);
      }
    } catch (apiError: any) {
      logDebug('HOME_API_ERROR', 'Error calling API', { 
        error: apiError.message,
        status: apiError.response?.status,
        statusText: apiError.response?.statusText,
        responseData: apiError.response?.data,
        stack: apiError.stack,
        timestamp: new Date().toISOString()
      });
      
      console.error("API Error:", apiError);
      
      // For testing, bypass errors and navigate anyway
      const bypassError = true; // Force navigation even on error
      
      if (bypassError) {
        logDebug('HOME_BYPASS', 'Bypassing API error and navigating anyway', {
          datacos: numbers.join(','),
          useTestDir,
          path: `/dashboard?datacos=${numbers.join(',')}&useTestDir=${useTestDir}`,
          timestamp: new Date().toISOString()
        });
        router.push(`/dashboard?datacos=${numbers.join(',')}&useTestDir=${useTestDir}`);
        return;
      }
      
      setError(apiError.response?.data?.error || 'Failed to check DATACO data. Please try again.');
      setIsLoading(false);
    }
  };

  const currentPath = useTestDir ? TEST_DIR_NAME : DEFAULT_BASE_DIR;

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <AppLogo size="lg" className="mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-gray-900">
            Explore DATACO
          </h1>
          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <InformationCircleIcon className="h-4 w-4 mr-1" />
            Debug Mode Active
          </div>
        </div>
        
        {/* Search Form */}
        <form onSubmit={handleSubmit}>
          {/* Large Search Bar */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-6 w-6 text-gray-400" />
            </div>
            <input
              type="text"
              id="dataco-numbers"
              placeholder="Search DATACO numbers (e.g., 12345, 67890)"
              className="block w-full bg-white border border-gray-300 rounded-full pl-14 pr-20 py-4 text-lg shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
              value={datacoNumbers}
              onChange={(e) => setDatacoNumbers(e.target.value)}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-full text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" className="text-white" />
                ) : (
                  <ArrowRightIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Available test numbers */}
          {useTestDir && testDataAvailable.length > 0 && (
            <div className="mb-4 text-center">
              <p className="text-sm text-gray-600 mb-2">Available test DATACO numbers:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {testDataAvailable.map(num => (
                  <button
                    key={num}
                    type="button"
                    className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs"
                    onClick={() => setDatacoNumbers(prev => 
                      prev ? `${prev}, ${num}` : num
                    )}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Info below search bar */}
          <div className="flex flex-wrap gap-4 justify-center text-center text-sm text-gray-600 mb-6">
            {/* Debug Mode Toggle */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="useTestDir"
                checked={useTestDir}
                onChange={(e) => setUseTestDir(e.target.checked)}
                className="h-4 w-4 text-gray-900 focus:ring-gray-500 border-gray-300 rounded"
              />
              <label htmlFor="useTestDir" className="ml-2 text-gray-700">
                Debug Mode
              </label>
            </div>
            
            {/* Path Information */}
            <div className="flex items-center">
              <FolderIcon className="h-4 w-4 mr-1 text-gray-500" aria-hidden="true" />
              <span className="text-gray-600">{currentPath}</span>
            </div>
          </div>
        </form>
        
        {/* Error Display */}
        {error && (
          <div className="mt-6 flex items-start text-sm text-red-700 bg-red-50 p-4 rounded-md border border-red-200">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-red-400 flex-shrink-0" aria-hidden="true"/>
            <span>{error}</span>
          </div>
        )}
        
        {/* Footer */}
        <p className="mt-12 text-center text-xs text-gray-500">
          Search for DATACO numbers to analyze jump data
        </p>
      </div>
    </main>
  );
} 