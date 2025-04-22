'use client';

import { useState } from 'react';

interface PythonBackendTestProps {
  defaultDataco?: string;
}

export default function PythonBackendTest({ defaultDataco = '12345' }: PythonBackendTestProps) {
  const [dataco, setDataco] = useState(defaultDataco);
  const [action, setAction] = useState<'load' | 'compare' | 'merge' | 'save'>('load');
  const [baseDir, setBaseDir] = useState('');
  const [output, setOutput] = useState('');
  const [useTestDir, setUseTestDir] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/python', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          dataco,
          baseDir: baseDir || undefined,
          output: output || undefined,
          useTestDir
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch data');
      }
      
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Python Backend Test</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="action" className="block text-sm font-medium text-gray-700">
            Action
          </label>
          <select
            id="action"
            value={action}
            onChange={(e) => setAction(e.target.value as any)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="load">Load</option>
            <option value="compare">Compare</option>
            <option value="merge">Merge</option>
            <option value="save">Save</option>
          </select>
        </div>

        <div>
          <label htmlFor="dataco" className="block text-sm font-medium text-gray-700">
            DATACO Number(s) {action === 'compare' || action === 'merge' ? '(comma separated)' : ''}
          </label>
          <input
            type="text"
            id="dataco"
            value={dataco}
            onChange={(e) => setDataco(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="e.g. 12345 or 12345,67890"
          />
          <p className="mt-1 text-xs text-gray-500">
            Available in test folder: 12345, 54321, 67890
          </p>
        </div>

        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="useTestDir"
            checked={useTestDir}
            onChange={(e) => setUseTestDir(e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="useTestDir" className="ml-2 block text-sm text-gray-700">
            Use Test Directory (TestDC folder)
          </label>
        </div>

        <div className={!useTestDir ? "opacity-100" : "opacity-50"}>
          <label htmlFor="baseDir" className="block text-sm font-medium text-gray-700">
            Base Directory {useTestDir && "(ignored when using Test Directory)"}
          </label>
          <input
            type="text"
            id="baseDir"
            value={baseDir}
            onChange={(e) => setBaseDir(e.target.value)}
            disabled={useTestDir}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
            placeholder="/path/to/data"
          />
        </div>

        {action === 'save' && (
          <div>
            <label htmlFor="output" className="block text-sm font-medium text-gray-700">
              Output File Path
            </label>
            <input
              type="text"
              id="output"
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="output.jump"
            />
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Execute Python Script'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-lg font-medium text-red-800">Error</h3>
          <p className="mt-2 text-red-700">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900">Result</h3>
          <div className="mt-2 p-4 bg-gray-50 rounded-md">
            <pre className="whitespace-pre-wrap text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
} 