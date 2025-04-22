"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import Dashboard from '../../components/Dashboard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/ErrorAlert';

// Define constants for paths
const DEFAULT_BASE_DIR = '/mobileye/DC/Voice_Tagging/';
const TEST_DIR_NAME = 'TestDC';

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const datacoParam = searchParams.get('datacos');
  const useTestDir = searchParams.get('useTestDir') === 'true';
  const baseDir = useTestDir ? TEST_DIR_NAME : DEFAULT_BASE_DIR;
  
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
        
        // Fetch data for each DATACO number in parallel
        const promises = datacoNumbers.map(async (dataco) => {
          const response = await axios.get(`/api/dataco?dataco=${dataco}&baseDir=${encodeURIComponent(baseDir)}`);
          return response.data;
        });
        
        const results = await Promise.all(promises);
        setDatacoData(results);
      } catch (err: any) {
        console.error('Error fetching DATACO data:', err);
        setError(err.response?.data?.error || 'Failed to fetch DATACO data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [datacoNumbers.join(','), baseDir]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner className="h-10 w-10 text-indigo-600" />
        <span className="ml-2 text-gray-600">Loading DATACO data...</span>
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