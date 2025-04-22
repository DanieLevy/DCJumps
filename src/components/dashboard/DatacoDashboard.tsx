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
  XCircleIcon,
  ArrowsPointingOutIcon,
  XMarkIcon
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
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const [searchSession, setSearchSession] = useState('');
  const [searchContent, setSearchContent] = useState('');
  
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
  
  // Reset search and modal states when switching DATACO
  useEffect(() => {
    setShowAllSessions(false);
    setShowFullContent(false);
    setSearchSession('');
    setSearchContent('');
  }, [activeDatacoIndex]);
  
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

  // Filter sessions by search term
  const filteredSessions = useMemo(() => {
    if (!activeDataco?.sessions || !Array.isArray(activeDataco.sessions)) return [];
    if (!searchSession) return activeDataco.sessions;
    
    return activeDataco.sessions.filter(session => 
      session.toLowerCase().includes(searchSession.toLowerCase())
    );
  }, [activeDataco?.sessions, searchSession]);

  // Filter content by search term
  const filteredContent = useMemo(() => {
    if (!activeDataco?.content_sample || !Array.isArray(activeDataco.content_sample)) return [];
    if (!searchContent) return activeDataco.content_sample;
    
    return activeDataco.content_sample.filter(line => 
      line.toLowerCase().includes(searchContent.toLowerCase())
    );
  }, [activeDataco?.content_sample, searchContent]);
  
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
                <div className="flex justify-between items-center mb-1">
                  <h4 className="text-sm font-medium text-gray-500">Sessions ({activeDataco.sessions?.length || 0})</h4>
                  {activeDataco.sessions && activeDataco.sessions.length > 0 && (
                    <button
                      onClick={() => setShowAllSessions(true)}
                      className="text-xs text-brand-600 hover:text-brand-800 flex items-center"
                    >
                      <ArrowsPointingOutIcon className="h-3 w-3 mr-1" />
                      View All
                    </button>
                  )}
                </div>
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
                              <button 
                                onClick={() => setShowAllSessions(true)} 
                                className="text-brand-600 hover:text-brand-800"
                              >
                                {`View ${activeDataco.sessions.length - 5} more sessions`}
                              </button>
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
                    {activeDataco.content_sample.length > 10 && (
                      <li className="text-gray-500 mt-2">
                        <button 
                          onClick={() => setShowFullContent(true)} 
                          className="text-brand-600 hover:text-brand-800"
                        >
                          {`View ${activeDataco.content_sample.length - 10} more lines`}
                        </button>
                      </li>
                    )}
                  </ul>
                </div>
                
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <div className="flex items-center">
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
                  <button
                    onClick={() => setShowFullContent(true)}
                    className="text-xs text-brand-600 hover:text-brand-800 flex items-center"
                  >
                    <ArrowsPointingOutIcon className="h-3 w-3 mr-1" />
                    View Full Content
                  </button>
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
      
      {/* All Sessions Modal */}
      {showAllSessions && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="px-4 py-5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">All Sessions - DATACO-{activeDataco.dataco_number}</h3>
              <button 
                onClick={() => setShowAllSessions(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <input
                type="text"
                placeholder="Search sessions..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                value={searchSession}
                onChange={(e) => setSearchSession(e.target.value)}
              />
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {filteredSessions.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session Name</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSessions.map((session) => (
                      <tr key={session} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-sm text-gray-500">{session}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  {searchSession ? 'No matching sessions found.' : 'No sessions available.'}
                </div>
              )}
            </div>
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 text-right">
              <span className="text-sm text-gray-500">
                Showing {filteredSessions.length} of {activeDataco.sessions?.length || 0} sessions
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Full Content Modal */}
      {showFullContent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="px-4 py-5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Jump File Content - DATACO-{activeDataco.dataco_number}</h3>
              <button 
                onClick={() => setShowFullContent(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <input
                type="text"
                placeholder="Search content..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                value={searchContent}
                onChange={(e) => setSearchContent(e.target.value)}
              />
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {filteredContent.length > 0 ? (
                <div className="font-mono text-xs bg-gray-50 p-3 rounded border border-gray-200">
                  <table className="min-w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 w-12">#</th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">Content</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredContent.map((line, index) => (
                        <tr key={`${line}-${index}`} className="hover:bg-gray-100">
                          <td className="px-2 py-1 text-gray-400 text-right align-top">{index + 1}</td>
                          <td className="px-2 py-1 whitespace-pre-wrap break-words">{line}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  {searchContent ? 'No matching content found.' : 'No content available.'}
                </div>
              )}
            </div>
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 text-right sm:flex sm:justify-between sm:items-center">
              <span className="text-sm text-gray-500">
                {activeDataco.content_truncated ? 
                  'Note: Content is truncated. This is only a sample of the full content.' : 
                  'Showing all available content.'}
              </span>
              <span className="text-sm text-gray-500">
                Showing {filteredContent.length} of {activeDataco.content_sample?.length || 0} lines
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 