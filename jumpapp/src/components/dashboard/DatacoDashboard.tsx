"use client";

import { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ArrowDownTrayIcon, ChartBarIcon, TagIcon, CalendarIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../LoadingSpinner';

interface DatacoDashboardProps {
  dataco: any[];
  baseDir: string;
  useTestDir?: boolean;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function DatacoDashboard({ dataco, baseDir, useTestDir = false }: DatacoDashboardProps) {
  const [activeDatacoIndex, setActiveDatacoIndex] = useState(0);
  const [activeTags, setActiveTags] = useState<{ [key: string]: boolean }>({});
  const [tagData, setTagData] = useState<any[]>([]);
  
  const activeDataco = dataco[activeDatacoIndex];
  
  useEffect(() => {
    // Process tag data for charts
    if (activeDataco && activeDataco.tag_counts) {
      // Convert tag counts to array format for chart
      const data = Object.entries(activeDataco.tag_counts)
        .slice(0, 15) // Show top 15 tags
        .map(([tag, count]) => ({
          tag,
          count,
        }));
        
      setTagData(data);
      
      // Initialize all tags as active
      const initialActiveTags = data.reduce((acc, { tag }) => {
        acc[tag as string] = true;
        return acc;
      }, {} as { [key: string]: boolean });
      
      setActiveTags(initialActiveTags);
    }
  }, [activeDatacoIndex, activeDataco]);
  
  const toggleTag = (tag: string) => {
    setActiveTags((prev) => ({
      ...prev,
      [tag]: !prev[tag],
    }));
  };
  
  // Format dates for display
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  if (!activeDataco) {
    return <LoadingSpinner />;
  }
  
  return (
    <div>
      {/* DATACO selector tabs */}
      <div className="border-b border-gray-200 mb-4">
        <Tab.Group selectedIndex={activeDatacoIndex} onChange={setActiveDatacoIndex}>
          <Tab.List className="flex space-x-3">
            {dataco.map((data, idx) => (
              <Tab
                key={idx}
                className={({ selected }) =>
                  classNames(
                    'px-3 py-1.5 text-sm font-medium rounded-md',
                    selected
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100'
                  )
                }
              >
                DATACO-{data.dataco_number}
              </Tab>
            ))}
          </Tab.List>
        </Tab.Group>
      </div>
      
      {/* Summary statistics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                <ChartBarIcon className="h-6 w-6 text-indigo-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Files</dt>
                  <dd className="text-lg font-semibold text-gray-900">{activeDataco.total_files}</dd>
                </dl>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {activeDataco.processed_files} processed, {activeDataco.failed_files} failed
            </div>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <ChartBarIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Events</dt>
                  <dd className="text-lg font-semibold text-gray-900">{activeDataco.event_count}</dd>
                </dl>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {activeDataco.unique_tags} unique tags, {activeDataco.session_count} sessions
            </div>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                <TagIcon className="h-6 w-6 text-yellow-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Top Tag</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {tagData.length > 0 ? tagData[0].tag : 'N/A'}
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {tagData.length > 0 ? `${tagData[0].count} occurrences` : 'No tags available'}
            </div>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                <CalendarIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Date Range</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {formatDate(activeDataco.min_date)}
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {activeDataco.min_date !== activeDataco.max_date 
                ? `to ${formatDate(activeDataco.max_date)}` 
                : 'Single day'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Tag Distribution Chart */}
      <div className="bg-white rounded-lg shadow p-4 mt-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tag Distribution</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={tagData.filter(d => activeTags[d.tag])}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="tag" 
                angle={-45} 
                textAnchor="end" 
                height={60} 
                interval={0}
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip 
                formatter={(value, name, props) => [`${value} occurrences`, 'Count']}
                labelFormatter={(label) => `Tag: ${label}`}
              />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Tag toggles */}
        <div className="mt-4 flex flex-wrap gap-2">
          {tagData.map(({ tag }) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={classNames(
                'px-2 py-1 text-xs rounded-full',
                activeTags[tag]
                  ? 'bg-indigo-100 text-indigo-800'
                  : 'bg-gray-100 text-gray-600'
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
      
      {/* Sessions and Content Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Sessions</h3>
            <p className="text-sm text-gray-500">{activeDataco.session_count} sessions found</p>
          </div>
          <div className="px-4 py-2">
            <div className="max-h-60 overflow-y-auto">
              {activeDataco.sessions?.slice(0, 20).map((session: string, idx: number) => (
                <div key={idx} className="py-2 border-b border-gray-100 last:border-0 text-sm">
                  {session}
                </div>
              ))}
              {(activeDataco.sessions?.length || 0) > 20 && (
                <div className="py-2 text-sm text-gray-500 italic">
                  ...and {(activeDataco.sessions?.length || 0) - 20} more sessions
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Content Preview</h3>
              <p className="text-sm text-gray-500">
                {activeDataco.content_truncated 
                  ? 'Showing first 1000 lines (truncated)'
                  : `${activeDataco.content_sample?.length || 0} lines`}
              </p>
            </div>
            <button 
              className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-md text-sm flex items-center"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
              Save Content
            </button>
          </div>
          <div className="px-4 py-2">
            <div className="max-h-60 overflow-y-auto">
              <pre className="text-xs font-mono">
                {activeDataco.content_sample?.slice(0, 50).map((line: string, idx: number) => (
                  <div key={idx} className="py-0.5 whitespace-pre-wrap">
                    {line}
                  </div>
                ))}
                {(activeDataco.content_sample?.length || 0) > 50 && (
                  <div className="py-2 text-gray-500 italic">
                    ...more content available
                  </div>
                )}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 