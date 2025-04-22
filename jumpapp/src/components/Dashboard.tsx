"use client";

import { useState } from 'react';
import { Tab } from '@headlessui/react';
import { HomeIcon, ArrowPathIcon, DocumentDuplicateIcon, BugAntIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import DatacoDashboard from './dashboard/DatacoDashboard';
import DatacoComparison from './dashboard/DatacoComparison';
import DatacoMerge from './dashboard/DatacoMerge';
import AppLogo from './AppLogo';

interface DashboardProps {
  dataco: any[];
  baseDir: string;
  useTestDir?: boolean;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Dashboard({ dataco, baseDir, useTestDir = false }: DashboardProps) {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  
  const tabs = [
    { name: 'Analysis', component: DatacoDashboard },
    { name: 'Comparison', component: DatacoComparison, disabled: dataco.length < 2 },
    { name: 'Merge', component: DatacoMerge, disabled: dataco.length < 2 },
  ];
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <HomeIcon className="h-6 w-6 text-indigo-600 mr-2" />
              <span className="sr-only">Home</span>
            </Link>
            <span className="mx-2 text-gray-300">|</span>
            <AppLogo />
            
            {useTestDir && (
              <div className="ml-4 flex items-center px-3 py-1 bg-yellow-100 rounded-md">
                <BugAntIcon className="h-4 w-4 text-yellow-700 mr-1" />
                <span className="text-xs font-medium text-yellow-800">Debug Mode</span>
              </div>
            )}
          </div>
          <div className="flex items-center">
            <button
              type="button"
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onClick={() => window.location.reload()}
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" />
              Refresh
            </button>
            <Link
              href="/"
              className="ml-2 inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
              New Session
            </Link>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {useTestDir && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Debug Mode Active:</strong> Using test data from TestDC directory instead of production data.
                {baseDir !== 'TestDC' && ` Base directory set to: ${baseDir}`}
              </p>
            </div>
          )}
          
          <div className="rounded-lg bg-white shadow">
            <div className="p-4 sm:p-6">
              <Tab.Group selectedIndex={activeTabIndex} onChange={setActiveTabIndex}>
                <Tab.List className="flex space-x-4 border-b">
                  {tabs.map((tab, idx) => (
                    <Tab
                      key={tab.name}
                      disabled={tab.disabled}
                      className={({ selected }) =>
                        classNames(
                          'px-4 py-2 text-sm font-medium outline-none border-b-2 transition-colors',
                          selected
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                          tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        )
                      }
                    >
                      {tab.name}{tab.disabled && ' (Need 2+ DATACOs)'}
                    </Tab>
                  ))}
                </Tab.List>
                <Tab.Panels className="mt-4">
                  {tabs.map((tab, idx) => (
                    <Tab.Panel key={idx} className={classNames('outline-none')}>
                      <tab.component dataco={dataco} baseDir={baseDir} useTestDir={useTestDir} />
                    </Tab.Panel>
                  ))}
                </Tab.Panels>
              </Tab.Group>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 