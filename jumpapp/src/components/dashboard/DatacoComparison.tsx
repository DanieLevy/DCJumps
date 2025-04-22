"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import LoadingSpinner from '../LoadingSpinner';
import ErrorAlert from '../ErrorAlert';

interface DatacoComparisonProps {
  dataco: any[];
  baseDir: string;
}

export default function DatacoComparison({ dataco, baseDir }: DatacoComparisonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [comparisonData, setComparisonData] = useState<any>(null);
  
  const datacoNumbers = dataco.map(d => d.dataco_number).join(',');
  
  useEffect(() => {
    const fetchComparisonData = async () => {
      if (dataco.length < 2) {
        setError('At least two DATACO datasets are required for comparison');
        return;
      }
      
      try {
        setIsLoading(true);
        setError('');
        
        const response = await axios.post('/api/dataco', {
          action: 'compare',
          datacoNumbers: dataco.map(d => d.dataco_number),
          baseDir
        });
        
        setComparisonData(response.data);
      } catch (err: any) {
        console.error('Error fetching comparison data:', err);
        setError(err.response?.data?.error || 'Failed to compare DATACO datasets');
      } finally {
        setIsLoading(false);
      }
    };
    
    // For now, we'll use the already loaded data instead of making a new API call
    // This simplifies the demo while we work on the permissions issue
    const mockComparisonData = createMockComparisonData(dataco);
    setComparisonData(mockComparisonData);
    
    // Uncomment this to use the real API once it's working
    // fetchComparisonData();
  }, [datacoNumbers, baseDir]);
  
  if (isLoading) {
    return <LoadingSpinner label="Comparing DATACO datasets..." />;
  }
  
  if (error) {
    return <ErrorAlert title="Error comparing datasets" message={error} />;
  }
  
  if (!comparisonData) {
    return <div>No comparison data available</div>;
  }
  
  // Generate colors for pie charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#4CAF50'];
  
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Comparing {dataco.length} DATACO Datasets
      </h2>
      
      {/* Common Tags Section */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Common Tags</h3>
        <p className="text-sm text-gray-500 mb-4">
          {comparisonData.common_tags.length} tags are shared across all datasets
        </p>
        
        <div className="flex flex-wrap gap-2">
          {comparisonData.common_tags.slice(0, 30).map((tag: string) => (
            <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {tag}
            </span>
          ))}
          {comparisonData.common_tags.length > 30 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              +{comparisonData.common_tags.length - 30} more
            </span>
          )}
        </div>
      </div>
      
      {/* Unique Tags Section */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Unique Tags by DATACO</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(comparisonData.unique_tags).map(([datacoNumber, tags]: [string, any]) => (
            <div key={datacoNumber} className="border p-3 rounded-md">
              <h4 className="font-medium text-gray-700 mb-2">DATACO-{datacoNumber}</h4>
              <div className="flex flex-wrap gap-1.5">
                {(tags as string[]).slice(0, 20).map((tag: string) => (
                  <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {tag}
                  </span>
                ))}
                {(tags as string[]).length > 20 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    +{(tags as string[]).length - 20} more
                  </span>
                )}
                {(tags as string[]).length === 0 && (
                  <span className="text-sm text-gray-500">No unique tags</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Statistics Comparison */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Statistical Comparison</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Metric
                </th>
                {comparisonData.stats.map((stat: any) => (
                  <th key={stat.dataco_number} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DATACO-{stat.dataco_number}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Files
                </td>
                {comparisonData.stats.map((stat: any) => (
                  <td key={stat.dataco_number} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {stat.total_files} ({stat.processed_files} processed)
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Events
                </td>
                {comparisonData.stats.map((stat: any) => (
                  <td key={stat.dataco_number} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {stat.event_count}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Unique Tags
                </td>
                {comparisonData.stats.map((stat: any) => (
                  <td key={stat.dataco_number} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {stat.unique_tags}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Sessions
                </td>
                {comparisonData.stats.map((stat: any) => (
                  <td key={stat.dataco_number} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {stat.session_count}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Tag Distribution Comparison */}
      <div className="bg-white shadow rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tag Distribution Comparison</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {comparisonData.stats.map((stat: any, index: number) => {
            const tagData = Object.entries(stat.tag_counts || {})
              .slice(0, 10)
              .map(([tag, count]) => ({ name: tag, value: count }));
            
            return (
              <div key={stat.dataco_number} className="h-64 border rounded-lg p-4">
                <h4 className="text-base font-medium text-gray-800 mb-2">DATACO-{stat.dataco_number}</h4>
                {tagData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tagData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {tagData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-500">No tag data available</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Helper function to create mock comparison data while API integration is fixed
function createMockComparisonData(dataco: any[]) {
  // Extract common tags
  const allTagSets = dataco.map(d => new Set(Object.keys(d.tag_counts || {})));
  let commonTags: string[] = [];
  
  if (allTagSets.length > 0) {
    commonTags = [...allTagSets[0]].filter(tag => 
      allTagSets.every(tagSet => tagSet.has(tag))
    );
  }
  
  // Extract unique tags
  const uniqueTags: Record<string, string[]> = {};
  
  dataco.forEach(d => {
    const otherTagSets = allTagSets.filter(set => 
      set !== new Set(Object.keys(d.tag_counts || {}))
    );
    
    const uniqueForThis = [...new Set(Object.keys(d.tag_counts || {}))].filter(tag => 
      !otherTagSets.some(tagSet => tagSet.has(tag))
    );
    
    uniqueTags[d.dataco_number] = uniqueForThis;
  });
  
  return {
    datasets: dataco.map(d => d.dataco_number),
    common_tags: commonTags,
    unique_tags: uniqueTags,
    stats: dataco.map(d => ({
      dataco_number: d.dataco_number,
      total_files: d.total_files,
      processed_files: d.processed_files,
      event_count: d.event_count,
      unique_tags: d.unique_tags,
      session_count: d.session_count,
      tag_counts: d.tag_counts
    }))
  };
} 