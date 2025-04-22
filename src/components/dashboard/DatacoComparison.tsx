"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip } from 'recharts';
import { 
  ExclamationTriangleIcon, 
  ChartBarIcon, 
  TagIcon,
  ArrowsRightLeftIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';

interface DatacoComparisonProps {
  dataco: any[];
  baseDir: string;
  useTestDir?: boolean;
}

export default function DatacoComparison({ dataco, baseDir, useTestDir = false }: DatacoComparisonProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comparisonData, setComparisonData] = useState<any>(null);

  useEffect(() => {
    if (dataco.length < 2) {
      setError('At least two DATACO datasets are required for comparison');
      setLoading(false);
      return;
    }

    const fetchComparisonData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use test data if in development mode or props indicate test mode
        if (process.env.NODE_ENV === 'development' || useTestDir) {
          const mockData = createMockComparisonData(dataco);
          setTimeout(() => {
            setComparisonData(mockData);
            setLoading(false);
          }, 1000); // Simulate network delay
          return;
        }
        
        const datacoNumbers = dataco.map(d => d.dataco_number).join(',');
        const response = await axios.get(`/api/comparison?dataco=${datacoNumbers}&baseDir=${encodeURIComponent(baseDir)}`);
        
        if (response.data.error) {
          throw new Error(response.data.error);
        }
        
        setComparisonData(response.data);
      } catch (err: any) {
        setError(`Failed to load comparison data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchComparisonData();
  }, [dataco, baseDir, useTestDir]);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <LoadingSpinner size="lg" label="Loading comparison data..." />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorAlert 
        title="Comparison Error" 
        message={error}
        actionLabel="Return to Dashboard"
        actionHref="/"
      />
    );
  }

  if (!comparisonData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No comparison data available.</p>
      </div>
    );
  }

  // Generate colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <div className="space-y-8">
      {/* Common Tags Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Common Tags</h3>
          <p className="mt-1 text-sm text-gray-500">
            Tags that appear in all selected DATACO datasets
          </p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          {comparisonData.common_tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {comparisonData.common_tags.map((tag: string, idx: number) => (
                <span 
                  key={idx} 
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <div className="flex items-center text-sm text-gray-500">
              <XCircleIcon className="h-5 w-5 mr-2 text-red-500" />
              No common tags found between the datasets
            </div>
          )}
        </div>
      </div>
      
      {/* Unique Tags by DATACO */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Unique Tags by DATACO</h3>
          <p className="mt-1 text-sm text-gray-500">
            Tags that appear exclusively in one dataset
          </p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {comparisonData.unique_tags.map((item: any, idx: number) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  DATACO-{item.dataco_number} 
                  <span className="ml-2 text-sm text-gray-500">
                    ({item.unique_tags.length} unique tags)
                  </span>
                </h4>
                {item.unique_tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto">
                    {item.unique_tags.slice(0, 25).map((tag: string, tagIdx: number) => (
                      <span 
                        key={tagIdx} 
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                      </span>
                    ))}
                    {item.unique_tags.length > 25 && (
                      <span className="text-xs text-gray-500 mt-2">
                        ...and {item.unique_tags.length - 25} more
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    No unique tags found
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Statistical Comparison */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Statistical Comparison</h3>
        </div>
        <div className="px-4 py-5 sm:p-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statistic
                </th>
                {comparisonData.comparison.map((item: any, idx: number) => (
                  <th key={idx} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DATACO-{item.dataco_number}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Total Files
                </td>
                {comparisonData.comparison.map((item: any, idx: number) => (
                  <td key={idx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.total_files}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Event Count
                </td>
                {comparisonData.comparison.map((item: any, idx: number) => (
                  <td key={idx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.event_count}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Unique Tags
                </td>
                {comparisonData.comparison.map((item: any, idx: number) => (
                  <td key={idx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.unique_tags}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Sessions
                </td>
                {comparisonData.comparison.map((item: any, idx: number) => (
                  <td key={idx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.session_count}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Date Range
                </td>
                {comparisonData.comparison.map((item: any, idx: number) => (
                  <td key={idx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(item.min_date).toLocaleDateString()} to {new Date(item.max_date).toLocaleDateString()}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Tag Distribution Comparison */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Tag Distribution Comparison</h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {comparisonData.tag_distribution.map((item: any, idx: number) => (
              <div key={idx} className="p-4">
                <h4 className="text-center text-md font-medium text-gray-900 mb-4">
                  DATACO-{item.dataco_number}
                </h4>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={item.tags.slice(0, 8)} // Show top 8 tags
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius="70%"
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {item.tags.slice(0, 8).map((entry: any, i: number) => (
                          <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} events`, 'Count']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to generate mock comparison data for development
function createMockComparisonData(dataco: any[]) {
  const selected = dataco.slice(0, Math.min(dataco.length, 3));
  
  // Extract basic information from each DATACO
  const comparison = selected.map(d => ({
    dataco_number: d.dataco_number,
    total_files: d.total_files,
    event_count: d.event_count,
    unique_tags: d.unique_tags,
    session_count: d.session_count,
    min_date: d.min_date,
    max_date: d.max_date,
  }));
  
  // Mock data for common tags
  const common_tags = ['JUMP', 'LANDING', 'TAKEOFF', 'FLIGHT', 'PREPARATION'];
  
  // Mock data for unique tags
  const unique_tags = selected.map(d => {
    const uniqueCount = Math.floor(Math.random() * 10) + 3;
    const tags = Array.from({ length: uniqueCount }, (_, i) => 
      `${d.dataco_number}_UNIQUE_TAG_${i + 1}`
    );
    
    return {
      dataco_number: d.dataco_number,
      unique_tags: tags
    };
  });
  
  // Mock data for tag distribution
  const tag_distribution = selected.map(d => {
    // Use the tag counts if available, otherwise generate mock data
    let tags = [];
    
    if (d.tag_counts) {
      tags = Object.entries(d.tag_counts)
        .slice(0, 10)
        .map(([tag, count]: [string, number]) => ({
          name: tag,
          value: count,
        }));
    } else {
      tags = Array.from({ length: 8 }, (_, i) => ({
        name: `TAG_${i + 1}`,
        value: Math.floor(Math.random() * 100) + 10,
      }));
    }
    
    return {
      dataco_number: d.dataco_number,
      tags
    };
  });
  
  return {
    comparison,
    common_tags,
    unique_tags,
    tag_distribution
  };
} 