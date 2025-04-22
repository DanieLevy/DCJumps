"use client";

import { useState } from 'react';
import { DocumentArrowDownIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../LoadingSpinner';

interface DatacoExportProps {
  dataco: any;
  isLoading?: boolean;
}

type ExportFormat = 'csv' | 'json' | 'excel' | 'pdf';

export default function DatacoExport({ dataco, isLoading = false }: DatacoExportProps) {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [showOptions, setShowOptions] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    includeMetadata: true,
    includeTags: true,
    includeEvents: true,
    prettyPrint: false,
    filterByDateRange: false,
    dateRange: { start: '', end: '' },
  });
  const [exportStatus, setExportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleExport = async () => {
    if (!dataco) {
      setErrorMessage('No DATACO dataset loaded to export');
      setExportStatus('error');
      return;
    }

    setExportStatus('loading');
    setErrorMessage('');

    // Simulate export process
    setTimeout(() => {
      try {
        // In a real application, this would call an API endpoint to generate and download the file
        // For now, we'll just simulate success
        setExportStatus('success');
        
        // Simulate download by creating a dummy file
        const element = document.createElement('a');
        const file = new Blob(['DATACO export data would be here'], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `DATACO-${dataco.dataco_number || 'export'}.${exportFormat}`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        
        // Reset status after a delay
        setTimeout(() => {
          setExportStatus('idle');
        }, 3000);
      } catch (error) {
        setExportStatus('error');
        setErrorMessage('Failed to export dataset. Please try again.');
      }
    }, 1500);
  };

  const handleOptionChange = (option: keyof typeof exportOptions, value: any) => {
    setExportOptions({ ...exportOptions, [option]: value });
  };

  const toggleOptions = () => {
    setShowOptions(!showOptions);
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="border-b border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">
            Export DATACO Dataset
          </h2>
          <button
            type="button"
            onClick={toggleOptions}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {showOptions ? 'Hide Options' : 'Show Options'}
          </button>
        </div>
      </div>
      
      <div className="p-4">
        {errorMessage && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm">
            <div className="flex">
              <XMarkIcon className="h-5 w-5 text-red-400 mr-2" />
              {errorMessage}
            </div>
          </div>
        )}
        
        {exportStatus === 'success' && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-800 rounded-md p-3 text-sm">
            <div className="flex">
              <CheckIcon className="h-5 w-5 text-green-400 mr-2" />
              Export completed successfully!
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Export Format
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium ${
                  exportFormat === 'csv' 
                    ? 'bg-indigo-100 border-indigo-300 text-indigo-800' 
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
                onClick={() => setExportFormat('csv')}
              >
                CSV
              </button>
              <button
                type="button"
                className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium ${
                  exportFormat === 'json' 
                    ? 'bg-indigo-100 border-indigo-300 text-indigo-800' 
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
                onClick={() => setExportFormat('json')}
              >
                JSON
              </button>
              <button
                type="button"
                className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium ${
                  exportFormat === 'excel' 
                    ? 'bg-indigo-100 border-indigo-300 text-indigo-800' 
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
                onClick={() => setExportFormat('excel')}
              >
                Excel
              </button>
              <button
                type="button"
                className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium ${
                  exportFormat === 'pdf' 
                    ? 'bg-indigo-100 border-indigo-300 text-indigo-800' 
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
                onClick={() => setExportFormat('pdf')}
              >
                PDF
              </button>
            </div>
          </div>
          
          {showOptions && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-md">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Export Options</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      id="include-metadata"
                      name="include-metadata"
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      checked={exportOptions.includeMetadata}
                      onChange={(e) => handleOptionChange('includeMetadata', e.target.checked)}
                    />
                    <label htmlFor="include-metadata" className="ml-3 text-sm text-gray-700">
                      Include Metadata
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="include-tags"
                      name="include-tags"
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      checked={exportOptions.includeTags}
                      onChange={(e) => handleOptionChange('includeTags', e.target.checked)}
                    />
                    <label htmlFor="include-tags" className="ml-3 text-sm text-gray-700">
                      Include Tags
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="include-events"
                      name="include-events"
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      checked={exportOptions.includeEvents}
                      onChange={(e) => handleOptionChange('includeEvents', e.target.checked)}
                    />
                    <label htmlFor="include-events" className="ml-3 text-sm text-gray-700">
                      Include Events
                    </label>
                  </div>
                  
                  {exportFormat === 'json' && (
                    <div className="flex items-center">
                      <input
                        id="pretty-print"
                        name="pretty-print"
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={exportOptions.prettyPrint}
                        onChange={(e) => handleOptionChange('prettyPrint', e.target.checked)}
                      />
                      <label htmlFor="pretty-print" className="ml-3 text-sm text-gray-700">
                        Pretty Print JSON
                      </label>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <div className="flex items-center mb-2">
                  <input
                    id="filter-date-range"
                    name="filter-date-range"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={exportOptions.filterByDateRange}
                    onChange={(e) => handleOptionChange('filterByDateRange', e.target.checked)}
                  />
                  <label htmlFor="filter-date-range" className="ml-3 text-sm font-medium text-gray-700">
                    Filter by Date Range
                  </label>
                </div>
                
                {exportOptions.filterByDateRange && (
                  <div className="ml-6 space-y-3 mt-2">
                    <div>
                      <label htmlFor="export-start-date" className="block text-xs text-gray-500 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        id="export-start-date"
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={exportOptions.dateRange.start}
                        onChange={(e) => handleOptionChange('dateRange', { ...exportOptions.dateRange, start: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="export-end-date" className="block text-xs text-gray-500 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        id="export-end-date"
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={exportOptions.dateRange.end}
                        onChange={(e) => handleOptionChange('dateRange', { ...exportOptions.dateRange, end: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="pt-2">
            <button
              type="button"
              onClick={handleExport}
              disabled={isLoading || exportStatus === 'loading' || !dataco}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed w-full justify-center"
            >
              {exportStatus === 'loading' ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Exporting...
                </>
              ) : (
                <>
                  <DocumentArrowDownIcon className="-ml-0.5 mr-2 h-5 w-5" aria-hidden="true" />
                  Export as {exportFormat.toUpperCase()}
                </>
              )}
            </button>
          </div>
          
          <div className="text-xs text-gray-500 mt-2">
            {dataco ? (
              <>
                Exporting DATACO-{dataco.dataco_number || 'unknown'} • {exportOptions.includeEvents ? `${dataco.event_count || 0} events` : 'No events'} • {exportOptions.includeTags ? `${dataco.unique_tags || 0} tags` : 'No tags'}
              </>
            ) : (
              'No DATACO dataset loaded to export'
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 