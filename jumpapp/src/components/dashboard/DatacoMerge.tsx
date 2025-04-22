"use client";

import { useState } from 'react';
import axios from 'axios';
import { ArrowDownTrayIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../LoadingSpinner';
import ErrorAlert from '../ErrorAlert';

interface DatacoMergeProps {
  dataco: any[];
  baseDir: string;
}

export default function DatacoMerge({ dataco, baseDir }: DatacoMergeProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mergeInProgress, setMergeInProgress] = useState(false);
  const [mergeStatus, setMergeStatus] = useState<null | {
    success: boolean;
    message: string;
    outputPath?: string;
  }>(null);
  const [selectedDatco, setSelectedDataco] = useState<string[]>([]);
  const [mergeName, setMergeName] = useState('');
  
  const handleSelectDatco = (datacoNumber: string) => {
    if (selectedDatco.includes(datacoNumber)) {
      setSelectedDataco(selectedDatco.filter(d => d !== datacoNumber));
    } else {
      setSelectedDataco([...selectedDatco, datacoNumber]);
    }
  };
  
  const handleMerge = async () => {
    if (selectedDatco.length < 2) {
      setError('Please select at least two DATACO datasets to merge');
      return;
    }
    
    if (!mergeName.trim()) {
      setError('Please provide a name for the merged dataset');
      return;
    }
    
    try {
      setIsLoading(true);
      setMergeInProgress(true);
      setError('');
      
      // For demo purposes, we'll simulate the merge process
      // In a real implementation, you'd send a request to your API
      
      // Simulate API call with a timeout
      setTimeout(() => {
        setMergeStatus({
          success: true,
          message: 'Successfully merged DATACO datasets',
          outputPath: `${baseDir}/merged_${mergeName}.zip`
        });
        setIsLoading(false);
        setMergeInProgress(false);
      }, 2000);
      
      // Uncomment this for the real implementation
      /*
      const response = await axios.post('/api/dataco', {
        action: 'merge',
        datacoNumbers: selectedDatco,
        baseDir,
        outputName: mergeName
      });
      
      setMergeStatus({
        success: true,
        message: response.data.message,
        outputPath: response.data.outputPath
      });
      */
    } catch (err: any) {
      console.error('Error merging DATACO datasets:', err);
      setError(err.response?.data?.error || 'Failed to merge DATACO datasets');
      setMergeStatus({
        success: false,
        message: err.response?.data?.error || 'Failed to merge DATACO datasets'
      });
    } finally {
      setIsLoading(false);
      setMergeInProgress(false);
    }
  };
  
  if (dataco.length < 2) {
    return (
      <div className="text-center p-8">
        <ExclamationCircleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Not Enough Datasets</h3>
        <p className="text-gray-600">
          You need at least two DATACO datasets to perform a merge operation.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Merge DATACO Datasets
        </h2>
        
        {error && <ErrorAlert title="Error" message={error} className="mb-4" />}
        
        {mergeStatus && (
          <div className={`mb-6 p-4 rounded-md ${mergeStatus.success ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {mergeStatus.success ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-400" />
                ) : (
                  <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
                )}
              </div>
              <div className="ml-3">
                <h3 className={`text-sm font-medium ${mergeStatus.success ? 'text-green-800' : 'text-red-800'}`}>
                  {mergeStatus.success ? 'Merge Successful' : 'Merge Failed'}
                </h3>
                <div className={`mt-2 text-sm ${mergeStatus.success ? 'text-green-700' : 'text-red-700'}`}>
                  <p>{mergeStatus.message}</p>
                  {mergeStatus.outputPath && (
                    <p className="mt-2">
                      Output saved to: <span className="font-mono">{mergeStatus.outputPath}</span>
                    </p>
                  )}
                </div>
                {mergeStatus.success && mergeStatus.outputPath && (
                  <div className="mt-4">
                    <button 
                      type="button"
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      onClick={() => {
                        // In a real app, this would download the file
                        alert('Download functionality would be implemented here');
                      }}
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                      Download Merged Dataset
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="mb-6">
          <label htmlFor="merge-name" className="block text-sm font-medium text-gray-700 mb-1">
            Merged Dataset Name
          </label>
          <input
            type="text"
            id="merge-name"
            value={mergeName}
            onChange={(e) => setMergeName(e.target.value)}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="my_merged_dataco"
            disabled={isLoading}
          />
        </div>
        
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Select DATACO Datasets to Merge</h3>
          <div className="bg-gray-50 rounded-md p-4 max-h-[300px] overflow-y-auto">
            <div className="space-y-2">
              {dataco.map((d) => (
                <div key={d.dataco_number} className="flex items-center">
                  <input
                    id={`dataco-${d.dataco_number}`}
                    name={`dataco-${d.dataco_number}`}
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={selectedDatco.includes(d.dataco_number)}
                    onChange={() => handleSelectDatco(d.dataco_number)}
                    disabled={isLoading}
                  />
                  <label htmlFor={`dataco-${d.dataco_number}`} className="ml-3 text-sm text-gray-700">
                    DATACO-{d.dataco_number} 
                    <span className="ml-2 text-xs text-gray-500">
                      ({d.event_count} events, {d.unique_tags} unique tags)
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            {selectedDatco.length} of {dataco.length} datasets selected
          </p>
        </div>
        
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleMerge}
            disabled={isLoading || selectedDatco.length < 2 || !mergeName.trim()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Merging...
              </>
            ) : (
              'Merge Selected Datasets'
            )}
          </button>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Merge Information</h3>
        
        <div className="bg-yellow-50 p-4 rounded-md mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationCircleIcon className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Important Notes About Merging</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc space-y-1 pl-5">
                  <li>Merging combines all events from the selected datasets into a single dataset</li>
                  <li>Tag statistics will be recalculated based on the combined events</li>
                  <li>Session information will be preserved but merged into a single timeline</li>
                  <li>The merge process may take several minutes for large datasets</li>
                  <li>Ensure you have sufficient disk space for the merged output</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700">What will be included in the merge?</h4>
            <p className="mt-1 text-sm text-gray-500">
              All events, tags, and session data from the selected datasets will be combined into a single dataset. 
              The merged dataset will be saved with the name you specified above.
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700">How to use the merged dataset?</h4>
            <p className="mt-1 text-sm text-gray-500">
              The merged dataset can be used for analysis just like any other DATACO dataset. 
              You can load it in this application or use it with other DATACO-compatible tools.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 