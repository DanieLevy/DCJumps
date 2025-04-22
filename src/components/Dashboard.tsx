"use client";

import { useState } from 'react';
import { Tab } from '@headlessui/react';
import Header from './layout/Header';
import DatacoDashboard from './dashboard/DatacoDashboard';
import DatacoComparison from './dashboard/DatacoComparison';
import DatacoMerge from './dashboard/DatacoMerge';

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

  const handleRefresh = () => {
    window.location.reload();
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header useTestDir={useTestDir} onRefresh={handleRefresh} />
      
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
          
          <div className="bg-white rounded-lg shadow">
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
                            ? 'border-brand-600 text-brand-600'
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