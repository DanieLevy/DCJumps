"use client";

import { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { 
  DocumentTextIcon, 
  ChartBarIcon, 
  TagIcon, 
  ClockIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface DatacoDashboardProps {
  dataco: any[];
  baseDir: string;
  useTestDir?: boolean;
}

export default function DatacoDashboard({ dataco, baseDir, useTestDir = false }: DatacoDashboardProps) {
  const [activeDatacoIndex, setActiveDatacoIndex] = useState(0);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [tagData, setTagData] = useState<any[]>([]);
  
  const activeDataco = useMemo(() => {
    return dataco?.[activeDatacoIndex] || null;
  }, [dataco, activeDatacoIndex]);

  // Process tag data for charts
  useEffect(() => {
    if (!activeDataco?.tag_counts) return;
    
    const tagCounts = activeDataco.tag_counts;
    const sortedTags = Object.entries(tagCounts)
      .sort((a: any, b: any) => b[1] - a[1])
      .map(([tag, count]: [string, number]) => ({
        name: tag,
        value: count,
      }));
    
    setTagData(sortedTags);
    
    // Initialize active tags with top 5 tags
    if (activeTags.length === 0 && sortedTags.length > 0) {
      setActiveTags(sortedTags.slice(0, 5).map(item => item.name));
    }
  }, [activeDataco, activeTags.length]);
  
  // Toggle tag selection
  const toggleTag = (tag: string) => {
    if (activeTags.includes(tag)) {
      setActiveTags(activeTags.filter(t => t !== tag));
    } else {
      setActiveTags([...activeTags, tag]);
    }
  };
  
  // Format date string
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (e) {
      return dateString;
    }
  };
  
  if (!activeDataco) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No DATACO data available.</p>
      </div>
    );
  }
  
  // Generate colors for chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#6B66FF'];
  
  return (
    <div className="space-y-6">
      {/* DATACO Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900">DATACO Selection</h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-wrap gap-2">
            {dataco.map((item, index) => (
              <button
                key={item.dataco_number}
                onClick={() => setActiveDatacoIndex(index)}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  index === activeDatacoIndex 
                    ? 'bg-brand-100 text-brand-800 border-2 border-brand-300' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-200'
                }`}
              >
                DATACO-{item.dataco_number}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-brand-100 rounded-md p-3">
                <DocumentTextIcon className="h-6 w-6 text-brand-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Files</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      {activeDataco.total_files} 
                      <span className="ml-2 text-sm text-gray-500">
                        ({activeDataco.processed_files} processed)
                      </span>
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <ChartBarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Event Count</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{activeDataco.event_count}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                <TagIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Unique Tags</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{activeDataco.unique_tags}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Sessions</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{activeDataco.session_count}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tag Distribution */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Tag Distribution</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-4 py-5 sm:p-6">
          <div className="lg:col-span-1">
            <h4 className="text-sm font-medium text-gray-500 mb-3">Top Tags</h4>
            <div className="max-h-96 overflow-y-auto pr-2">
              <ul className="space-y-2">
                {tagData.slice(0, 20).map((tag, index) => (
                  <li key={tag.name} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`tag-${index}`}
                        checked={activeTags.includes(tag.name)}
                        onChange={() => toggleTag(tag.name)}
                        className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`tag-${index}`} className="ml-2 block text-sm text-gray-700 truncate max-w-[180px]">
                        {tag.name}
                      </label>
                    </div>
                    <span className="text-sm text-gray-500">{tag.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="lg:col-span-2 h-96">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tagData.filter(tag => activeTags.includes(tag.name))}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius="70%"
                  fill="#8884d8"
                  dataKey="value"
                >
                  {tagData.filter(tag => activeTags.includes(tag.name)).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} events`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Sessions and Content Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Session Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Session Information</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Date Range</h4>
                <p className="text-sm text-gray-700">
                  {activeDataco.min_date ? formatDate(activeDataco.min_date) : 'N/A'} 
                  {' '} to {' '}
                  {activeDataco.max_date ? formatDate(activeDataco.max_date) : 'N/A'}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Sessions ({activeDataco.sessions?.length || 0})</h4>
                {activeDataco.sessions && activeDataco.sessions.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session Name</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {activeDataco.sessions.slice(0, 5).map((session) => (
                          <tr key={session}>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{session}</td>
                          </tr>
                        ))}
                        {activeDataco.sessions.length > 5 && (
                          <tr>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                              {`${activeDataco.sessions.length - 5} more sessions`}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No session information available</p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Content Preview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Content Preview</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {activeDataco.content_sample && activeDataco.content_sample.length > 0 ? (
              <div className="space-y-3">
                <div className="max-h-64 overflow-y-auto font-mono text-xs bg-gray-50 p-3 rounded border border-gray-200">
                  <ul className="space-y-1">
                    {activeDataco.content_sample.slice(0, 10).map((line, index) => (
                      <li key={`${line}-${index}`} className="whitespace-pre-wrap break-words">
                        {line}
                      </li>
                    ))}
                    {activeDataco.content_truncated && (
                      <div className="text-gray-500 mt-2">
                        {`${activeDataco.content_sample.length - 10} more lines`}
                      </div>
                    )}
                  </ul>
                </div>
                
                <div className="flex items-center text-sm text-gray-500">
                  {activeDataco.content_truncated ? (
                    <ArrowPathIcon className="h-4 w-4 mr-1 text-yellow-500" />
                  ) : (
                    <CheckCircleIcon className="h-4 w-4 mr-1 text-green-500" />
                  )}
                  <span>
                    {activeDataco.content_truncated
                      ? 'Content preview is truncated due to size'
                      : 'Full content preview available'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center text-sm text-gray-500">
                <XCircleIcon className="h-4 w-4 mr-1 text-red-500" />
                <span>No content preview available</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 