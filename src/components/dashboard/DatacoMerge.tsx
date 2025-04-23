"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { ArchiveBoxIcon, ArrowPathIcon, ArrowDownTrayIcon, DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';

interface DatacoMergeProps {
  dataco: any[];
  baseDir: string;
  useTestDir?: boolean;
}

export default function DatacoMerge({ dataco, baseDir, useTestDir = false }: DatacoMergeProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mergedData, setMergedData] = useState<any>(null);
  const [selectedDatacos, setSelectedDatacos] = useState<string[]>([]);
  const [outputPath, setOutputPath] = useState('');
  const [mergeSuccess, setMergeSuccess] = useState(false);
  const [fullEventList, setFullEventList] = useState<string[]>([]);
  const [showFullEvents, setShowFullEvents] = useState(false);
  
  // Initialize with all DATACOs selected
  useEffect(() => {
    if (dataco && dataco.length >= 2) {
      setSelectedDatacos(dataco.map(d => d.dataco_number));
      setOutputPath(`MERGED_${dataco.map(d => d.dataco_number).join('_')}.jump`);
    }
  }, [dataco]);
  
  const toggleDataco = (datacoNumber: string) => {
    setSelectedDatacos(prev => {
      if (prev.includes(datacoNumber)) {
        return prev.filter(d => d !== datacoNumber);
      } else {
        return [...prev, datacoNumber];
      }
    });
  };
  
  const handleMerge = async () => {
    if (selectedDatacos.length < 2) {
      setError('Please select at least two DATACO datasets to merge');
      return;
    }
    
    if (!outputPath) {
      setError('Please specify an output file path');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      setMergeSuccess(false);
      
      // Use the Express server API instead of Next.js API routes
      const response = await axios.post('/api/python', {
        action: 'merge',
        dataco: selectedDatacos.join(','),
        baseDir: useTestDir ? 'TestDC' : baseDir,
        output: outputPath,
        useTestDir: true
      });
      
      // Set the merged data and show success message
      setMergedData(response.data);
      setMergeSuccess(true);
      
      // Get the full content for view/download purposes
      const fullContentResponse = await axios.post('/api/dataco/full-content', {
        outputPath,
        baseDir: useTestDir ? 'TestDC' : baseDir
      });
      
      if (fullContentResponse.data && fullContentResponse.data.content) {
        setFullEventList(fullContentResponse.data.content);
      }
    } catch (err: any) {
      console.error('Error merging DATACO datasets:', err);
      setError(err.response?.data?.error || err.message || 'Failed to merge DATACO datasets');
      setMergeSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownload = () => {
    // Create and download content as a file
    if (!fullEventList.length && mergedData?.content_sample) {
      // Use content sample if full list not available
      downloadFile(mergedData.content_sample.join('\n'), outputPath);
    } else if (fullEventList.length) {
      // Use full event list when available
      downloadFile(fullEventList.join('\n'), outputPath);
    }
  };
  
  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Auto-update output path when selections change
  useEffect(() => {
    if (selectedDatacos.length >= 2) {
      setOutputPath(`MERGED_${selectedDatacos.join('_')}.jump`);
    } else {
      setOutputPath('');
    }
  }, [selectedDatacos]);
  
  if (dataco.length < 2) {
    return (
      <ErrorAlert
        title="Merge Error"
        message="Need at least two DATACO datasets to merge"
      />
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
            Merge DATACO Datasets
          </h3>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select DATACOs to Merge
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {dataco.map((data, idx) => (
                <div key={idx}>
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      checked={selectedDatacos.includes(data.dataco_number)}
                      onChange={() => toggleDataco(data.dataco_number)}
                    />
                    <div className="ml-3">
                      <span className="block text-sm font-medium text-gray-700">
                        DATACO-{data.dataco_number}
                      </span>
                      <span className="block text-xs text-gray-500">
                        {data.total_files} files, {data.event_count} events
                      </span>
                    </div>
                  </label>
                </div>
              ))}
            </div>
            
            {selectedDatacos.length < 2 && (
              <p className="mt-2 text-sm text-red-500">
                Please select at least two DATACO datasets
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-6">
            <div>
              <label htmlFor="output-path" className="block text-sm font-medium text-gray-700 mb-1">
                Output File Path
              </label>
              <input
                type="text"
                id="output-path"
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                placeholder="merged_output.jump"
                value={outputPath}
                onChange={(e) => setOutputPath(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500">
                Path where the merged file will be saved {useTestDir ? '(inside TestDC folder)' : ''}
              </p>
            </div>
            
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleMerge}
                disabled={isLoading || selectedDatacos.length < 2 || !outputPath}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                  isLoading || selectedDatacos.length < 2 || !outputPath
                    ? 'bg-indigo-300 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                }`}
              >
                {isLoading ? (
                  <>
                    <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5" />
                    Merging...
                  </>
                ) : (
                  <>
                    <ArchiveBoxIcon className="-ml-1 mr-2 h-5 w-5" />
                    Merge Selected DATACOs
                  </>
                )}
              </button>
            </div>
          </div>
          
          {error && <ErrorAlert title="Merge Error" message={error} />}
          
          {mergeSuccess && (
            <div className="rounded-md bg-green-50 p-4 mt-4 border border-green-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    Successfully merged {selectedDatacos.length} DATACO datasets
                  </p>
                  <p className="mt-2 text-sm text-green-700">
                    Merged {mergedData?.event_count || 0} events from {mergedData?.session_count || 0} sessions
                    {mergedData?.outputPath && ` into ${mergedData.outputPath}`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {mergedData && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Merged Data Summary
              </h3>
              <div className="flex space-x-2">
                <button 
                  type="button"
                  onClick={() => setShowFullEvents(!showFullEvents)}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm leading-4 font-medium rounded-md text-indigo-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <DocumentTextIcon className="-ml-0.5 mr-2 h-4 w-4" />
                  {showFullEvents ? 'Hide Full Content' : 'View Full Content'}
                </button>
                <button 
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm leading-4 font-medium rounded-md text-indigo-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <ArrowDownTrayIcon className="-ml-0.5 mr-2 h-4 w-4" />
                  Download .jump File
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Files</h4>
                <p className="text-2xl font-semibold text-gray-900">{mergedData.total_files}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {mergedData.processed_files} processed, {mergedData.failed_files} failed
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Sessions</h4>
                <p className="text-2xl font-semibold text-gray-900">{mergedData.session_count}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Events</h4>
                <p className="text-2xl font-semibold text-gray-900">{mergedData.event_count}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {mergedData.unique_tags} unique tags
                </p>
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                {showFullEvents ? 'Complete Event List' : 'Content Preview (first 10 lines)'}
              </h4>
              <div className="bg-gray-50 rounded-lg p-3 overflow-x-auto max-h-96 overflow-y-auto">
                <pre className="text-xs font-mono">
                  {showFullEvents ? 
                    (fullEventList.length ? 
                      fullEventList.map((line: string, idx: number) => (
                        <div key={idx} className="py-0.5">{line}</div>
                      )) : 
                      mergedData.content_sample.map((line: string, idx: number) => (
                        <div key={idx} className="py-0.5">{line}</div>
                      ))
                    ) : 
                    (mergedData.content_sample || []).slice(0, 10).map((line: string, idx: number) => (
                      <div key={idx} className="py-0.5">{line}</div>
                    ))
                  }
                  {!showFullEvents && (mergedData.content_sample || []).length > 10 && (
                    <div className="py-0.5 text-gray-500">... {(mergedData.content_sample || []).length - 10} more lines</div>
                  )}
                </pre>
              </div>
            </div>
            
            {mergedData.tag_counts && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Top Tags</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {Object.entries(mergedData.tag_counts)
                    .sort(([, countA]: [string, any], [, countB]: [string, any]) => Number(countB) - Number(countA))
                    .slice(0, 12)
                    .map(([tag, count]: [string, any], idx: number) => (
                      <div key={idx} className="bg-gray-50 p-2 rounded border border-gray-200">
                        <div className="text-xs font-medium text-gray-700 truncate" title={tag}>
                          {tag}
                        </div>
                        <div className="text-sm font-semibold text-gray-900">{count}</div>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Full event list modal */}
      {showFullEvents && fullEventList.length > 100 && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Full Content of {outputPath}
              </h3>
              <button 
                onClick={() => setShowFullEvents(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <pre className="text-xs font-mono">
                {fullEventList.map((line, idx) => (
                  <div key={idx} className="py-0.5">{line}</div>
                ))}
              </pre>
            </div>
            <div className="px-4 py-3 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <ArrowDownTrayIcon className="-ml-1 mr-2 h-5 w-5" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 