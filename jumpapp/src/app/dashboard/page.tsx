"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import Dashboard from '../../components/Dashboard';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorAlert from '../../components/ErrorAlert';

// Mock data generator for debugging
function generateMockDataco(datacoNumber: string) {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  return {
    success: true,
    dataco_number: datacoNumber,
    total_files: 2,
    processed_files: 2,
    failed_files: 0,
    session_count: 1,
    event_count: 10,
    unique_tags: 5,
    min_date: yesterday.toISOString(),
    max_date: now.toISOString(),
    tag_counts: {
      "stop_sign": 2,
      "pedestrian": 2,
      "car": 3,
      "traffic_light": 2,
      "truck": 1,
    },
    sessions: [`Session_1_230101_120000_DATACO-${datacoNumber}`],
    content_sample: [
      `trackfile1 front 100 stop_sign`,
      `trackfile1 front 110 pedestrian`,
      `trackfile2 front 120 car`,
      `trackfile2 front 130 traffic_light`,
      `trackfile3 front 140 truck`,
    ],
    content_truncated: false
  };
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const datacoParam = searchParams.get('datacos');
  const baseDir = searchParams.get('baseDir') || '/mobileye/DC/Voice_Tagging/';
  const useTestDir = searchParams.get('useTestDir') === 'true';
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [datacoData, setDatacoData] = useState<any[]>([]);
  
  // Parse DATACO numbers from URL params
  const datacoNumbers = datacoParam
    ? datacoParam.split(',').filter(n => n.trim() && /^\d+$/.test(n.trim()))
    : [];
  
  useEffect(() => {
    const fetchData = async () => {
      if (datacoNumbers.length === 0) {
        setError('No valid DATACO numbers provided');
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError('');
        
        console.log('Fetching data with parameters:', {
          datacoNumbers,
          baseDir,
          useTestDir
        });
        
        // Fetch data for each DATACO number in parallel
        const promises = datacoNumbers.map(async (dataco) => {
          console.log(`Fetching data for DATACO: ${dataco}`);
          try {
            const response = await axios.post(`/api/python`, {
              action: 'load',
              dataco,
              baseDir,
              useTestDir
            });
            
            console.log(`Response for DATACO ${dataco}:`, response.data);
            
            const result = response.data?.data || response.data;
            console.log(`Processed result for DATACO ${dataco}:`, result);
            
            // Check if the result contains actual data
            if (result && (result.dataco_number || result.total_files || result.event_count)) {
              return result;
            } else if (useTestDir) {
              // Use mock data if in debug mode and the real data is empty or malformed
              console.log(`Using mock data for DATACO ${dataco} in debug mode`);
              return generateMockDataco(dataco);
            } else {
              return result;
            }
          } catch (err) {
            console.error(`Error fetching DATACO ${dataco}:`, err);
            if (useTestDir) {
              // Use mock data in debug mode if the API call fails
              console.log(`Using mock data for DATACO ${dataco} after error`);
              return generateMockDataco(dataco);
            }
            throw err;
          }
        });
        
        const results = await Promise.all(promises);
        console.log('All results:', results);
        setDatacoData(results);
      } catch (err: any) {
        console.error('Error fetching DATACO data:', err);
        
        // If in debug mode and there's an error, generate mock data
        if (useTestDir) {
          console.log('Using mock data in debug mode due to error');
          const mockData = datacoNumbers.map(dataco => generateMockDataco(dataco));
          setDatacoData(mockData);
        } else {
          setError(err.response?.data?.error || 'Failed to fetch DATACO data');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [datacoNumbers.join(','), baseDir, useTestDir]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner label="Loading DATACO data..." />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen p-6">
        <ErrorAlert 
          title="Error loading data" 
          message={error} 
          actionLabel="Go back home"
          actionHref="/"
        />
      </div>
    );
  }
  
  if (datacoData.length === 0) {
    return (
      <div className="min-h-screen p-6">
        <ErrorAlert 
          title="No data available" 
          message="No DATACO data could be loaded. Please check your DATACO numbers and try again."
          actionLabel="Go back home"
          actionHref="/"
        />
      </div>
    );
  }
  
  return <Dashboard dataco={datacoData} baseDir={baseDir} useTestDir={useTestDir} />;
} 