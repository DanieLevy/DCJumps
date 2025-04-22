"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import AppLogo from '../components/AppLogo';

export default function Home() {
  const [baseDir, setBaseDir] = useState('/mobileye/DC/Voice_Tagging/');
  const [datacoNumbers, setDatacoNumbers] = useState('');
  const [useTestDir, setUseTestDir] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!datacoNumbers.trim()) {
      setError('Please enter at least one DATACO number');
      return;
    }
    
    // Parse DATACO numbers
    const numbers = datacoNumbers
      .split(/[\s,]+/)
      .filter(n => n.trim() && /^\d+$/.test(n.trim()));
    
    if (numbers.length === 0) {
      setError('Please enter valid DATACO numbers (digits only)');
      return;
    }
    
    setError('');
    
    // Navigate to the dashboard with the entered parameters
    window.location.href = `/dashboard?datacos=${numbers.join(',')}&baseDir=${encodeURIComponent(baseDir)}&useTestDir=${useTestDir}`;
  };

  // Handle test directory toggle
  const handleUseTestDir = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUseTestDir(e.target.checked);
    if (e.target.checked) {
      // Save current baseDir if switching to test mode
      sessionStorage.setItem('previousBaseDir', baseDir);
      setBaseDir('TestDC');
    } else {
      // Restore previous baseDir when switching back
      const previousDir = sessionStorage.getItem('previousBaseDir');
      if (previousDir) {
        setBaseDir(previousDir);
      } else {
        setBaseDir('/mobileye/DC/Voice_Tagging/');
      }
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-b from-blue-50 to-indigo-100">
      <div className="w-full max-w-2xl p-8 bg-white rounded-xl shadow-lg">
        <div className="flex flex-col items-center mb-8">
          <AppLogo className="mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
            DC Jumps Processor
          </h1>
          <p className="text-gray-600 text-center">
            Advanced DATACO Jump Files Analysis and Processing
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="dataco-numbers" className="block text-sm font-medium text-gray-700 mb-1">
              DATACO Number(s)
            </label>
            <input
              type="text"
              id="dataco-numbers"
              placeholder="Enter DATACO numbers (comma or space separated)"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={datacoNumbers}
              onChange={(e) => setDatacoNumbers(e.target.value)}
            />
            <p className="mt-1 text-sm text-gray-500">
              Example: 123, 456, 789
            </p>
            {useTestDir && (
              <p className="mt-1 text-xs text-indigo-600">
                Available in test folder: 12345, 54321, 67890
              </p>
            )}
          </div>
          
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="useTestDir"
              checked={useTestDir}
              onChange={handleUseTestDir}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="useTestDir" className="ml-2 block text-sm text-gray-700">
              Use Debug Mode (TestDC folder)
            </label>
          </div>
          
          <div>
            <label htmlFor="base-dir" className="block text-sm font-medium text-gray-700 mb-1">
              Base Directory
            </label>
            <input
              type="text"
              id="base-dir"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={baseDir}
              onChange={(e) => setBaseDir(e.target.value)}
              disabled={useTestDir}
            />
            <p className="mt-1 text-sm text-gray-500">
              Path to the directory containing your project folders
            </p>
          </div>
          
          {error && (
            <div className="text-red-500 text-sm py-2">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span>Loading...</span>
            ) : (
              <>
                <span>Analyze DATACO Data</span>
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </>
            )}
          </button>
        </form>
        
        <div className="mt-8 pt-4 border-t border-gray-200">
          <h2 className="text-lg font-medium text-gray-800 mb-2">About this tool</h2>
          <p className="text-gray-600 text-sm">
            The DC Jumps Processor is a tool for analyzing and processing DATACO jump files. 
            It can load and analyze multiple DATACO datasets, compare them, and merge them into a single output.
          </p>
        </div>
      </div>
    </main>
  );
}
