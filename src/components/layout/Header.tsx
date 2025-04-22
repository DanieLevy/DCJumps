import React from 'react';
import Link from 'next/link';
import { HomeIcon, ArrowPathIcon, DocumentDuplicateIcon, BugAntIcon } from '@heroicons/react/24/outline';
import AppLogo from '@/components/common/AppLogo';

interface HeaderProps {
  useTestDir?: boolean;
  onRefresh?: () => void;
}

const Header: React.FC<HeaderProps> = ({ useTestDir = false, onRefresh }) => {
  return (
    <header className="bg-white shadow">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <HomeIcon className="h-6 w-6 text-brand-600 mr-2" />
            <span className="sr-only">Home</span>
          </Link>
          <span className="mx-2 text-gray-300">|</span>
          <AppLogo size="sm" />
          
          {useTestDir && (
            <div className="ml-4 flex items-center px-3 py-1 bg-yellow-100 rounded-md">
              <BugAntIcon className="h-4 w-4 text-yellow-700 mr-1" />
              <span className="text-xs font-medium text-yellow-800">Debug Mode</span>
            </div>
          )}
        </div>
        <div className="flex items-center">
          {onRefresh && (
            <button
              type="button"
              className="btn-secondary flex items-center text-sm mr-2"
              onClick={onRefresh}
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" />
              Refresh
            </button>
          )}
          <Link
            href="/"
            className="btn-secondary flex items-center text-sm"
          >
            <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
            New Session
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header; 