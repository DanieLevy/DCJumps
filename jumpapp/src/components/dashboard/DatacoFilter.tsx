"use client";

import { useState, useEffect } from 'react';
import { FunnelIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../LoadingSpinner';

interface DatacoFilterProps {
  dataco: any;
  onApplyFilter: (filteredData: any) => void;
  isLoading?: boolean;
}

export default function DatacoFilter({ dataco, onApplyFilter, isLoading = false }: DatacoFilterProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [dateRangeFilter, setDateRangeFilter] = useState<{start?: string, end?: string}>({});
  const [eventTypeFilter, setEventTypeFilter] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableEventTypes, setAvailableEventTypes] = useState<string[]>([]);
  const [searchTag, setSearchTag] = useState('');
  
  useEffect(() => {
    if (dataco) {
      // In a real app, you would get these from the dataco object or an API
      // For demo, we'll generate some example tags and event types
      const mockTags = [
        'Priority-High', 'Priority-Medium', 'Priority-Low',
        'Type-Bug', 'Type-Feature', 'Type-Task',
        'Component-UI', 'Component-Backend', 'Component-Database',
        'Status-Open', 'Status-InProgress', 'Status-Resolved',
        'Team-Alpha', 'Team-Beta', 'Team-Gamma'
      ];
      
      const mockEventTypes = [
        'IssueCreated', 'IssueUpdated', 'IssueResolved',
        'CommentAdded', 'LabelAdded', 'LabelRemoved',
        'AssigneeChanged', 'PriorityChanged', 'StatusChanged'
      ];
      
      setAvailableTags(mockTags);
      setAvailableEventTypes(mockEventTypes);
    }
  }, [dataco]);
  
  const handleToggleFilter = () => {
    setShowFilters(!showFilters);
  };
  
  const handleToggleTag = (tag: string) => {
    if (tagFilters.includes(tag)) {
      setTagFilters(tagFilters.filter(t => t !== tag));
    } else {
      setTagFilters([...tagFilters, tag]);
    }
  };
  
  const handleToggleEventType = (type: string) => {
    if (eventTypeFilter.includes(type)) {
      setEventTypeFilter(eventTypeFilter.filter(t => t !== type));
    } else {
      setEventTypeFilter([...eventTypeFilter, type]);
    }
  };
  
  const handleClearFilters = () => {
    setTagFilters([]);
    setDateRangeFilter({});
    setEventTypeFilter([]);
  };
  
  const handleApplyFilters = () => {
    // In a real application, this would filter the actual data
    // For this demo, we'll just pass the filters to the parent component
    
    const filteredData = {
      ...dataco,
      filters: {
        tags: tagFilters,
        dateRange: dateRangeFilter,
        eventTypes: eventTypeFilter
      }
    };
    
    onApplyFilter(filteredData);
    
    // Optionally close filter panel after applying
    // setShowFilters(false);
  };
  
  const filteredTags = searchTag
    ? availableTags.filter(tag => tag.toLowerCase().includes(searchTag.toLowerCase()))
    : availableTags;
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="border-b border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">
            Dataco Filters
          </h2>
          <button
            type="button"
            onClick={handleToggleFilter}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FunnelIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
        
        {!showFilters && (
          <div className="mt-2 flex flex-wrap gap-2">
            {tagFilters.length > 0 && (
              <div className="text-xs inline-flex items-center font-bold leading-sm uppercase px-3 py-1 bg-green-200 text-green-700 rounded-full">
                {tagFilters.length} Tags Selected
              </div>
            )}
            
            {eventTypeFilter.length > 0 && (
              <div className="text-xs inline-flex items-center font-bold leading-sm uppercase px-3 py-1 bg-blue-200 text-blue-700 rounded-full">
                {eventTypeFilter.length} Event Types
              </div>
            )}
            
            {dateRangeFilter.start && (
              <div className="text-xs inline-flex items-center font-bold leading-sm uppercase px-3 py-1 bg-yellow-200 text-yellow-700 rounded-full">
                Date Range
              </div>
            )}
            
            {(tagFilters.length > 0 || eventTypeFilter.length > 0 || dateRangeFilter.start) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs inline-flex items-center font-bold leading-sm uppercase px-3 py-1 bg-red-100 text-red-700 rounded-full hover:bg-red-200"
              >
                <XMarkIcon className="h-3 w-3 mr-1" />
                Clear All
              </button>
            )}
            
            {(tagFilters.length === 0 && eventTypeFilter.length === 0 && !dateRangeFilter.start) && (
              <div className="text-xs inline-flex items-center font-normal leading-sm px-3 py-1 bg-gray-100 text-gray-500 rounded-full">
                No filters applied
              </div>
            )}
          </div>
        )}
      </div>
      
      {showFilters && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tags Filter */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by Tags</h3>
              <div className="mb-2">
                <div className="relative rounded-md shadow-sm">
                  <input
                    type="text"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-10 sm:text-sm border-gray-300 rounded-md"
                    placeholder="Search tags..."
                    value={searchTag}
                    onChange={(e) => setSearchTag(e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <FunnelIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                </div>
              </div>
              
              <div className="max-h-60 overflow-y-auto bg-white rounded border border-gray-300 p-2">
                {filteredTags.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-2">No matching tags</p>
                ) : (
                  <div className="space-y-1">
                    {filteredTags.map(tag => (
                      <div key={tag} className="flex items-center">
                        <input
                          id={`tag-${tag}`}
                          name={`tag-${tag}`}
                          type="checkbox"
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          checked={tagFilters.includes(tag)}
                          onChange={() => handleToggleTag(tag)}
                        />
                        <label htmlFor={`tag-${tag}`} className="ml-3 text-sm text-gray-700">
                          {tag}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="mt-2 text-xs text-gray-500">
                {tagFilters.length} of {availableTags.length} tags selected
              </div>
            </div>
            
            {/* Date Range Filter */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by Date Range</h3>
              <div className="space-y-3">
                <div>
                  <label htmlFor="start-date" className="block text-xs text-gray-500 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="start-date"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={dateRangeFilter.start || ''}
                    onChange={(e) => setDateRangeFilter({...dateRangeFilter, start: e.target.value})}
                  />
                </div>
                
                <div>
                  <label htmlFor="end-date" className="block text-xs text-gray-500 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="end-date"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={dateRangeFilter.end || ''}
                    onChange={(e) => setDateRangeFilter({...dateRangeFilter, end: e.target.value})}
                  />
                </div>
                
                {(dateRangeFilter.start || dateRangeFilter.end) && (
                  <button
                    type="button"
                    className="inline-flex items-center text-xs text-red-600 hover:text-red-800"
                    onClick={() => setDateRangeFilter({})}
                  >
                    <XMarkIcon className="h-3 w-3 mr-1" />
                    Clear Dates
                  </button>
                )}
              </div>
            </div>
            
            {/* Event Type Filter */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by Event Type</h3>
              <div className="max-h-60 overflow-y-auto bg-white rounded border border-gray-300 p-2">
                {availableEventTypes.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-2">No event types available</p>
                ) : (
                  <div className="space-y-1">
                    {availableEventTypes.map(type => (
                      <div key={type} className="flex items-center">
                        <input
                          id={`event-${type}`}
                          name={`event-${type}`}
                          type="checkbox"
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          checked={eventTypeFilter.includes(type)}
                          onChange={() => handleToggleEventType(type)}
                        />
                        <label htmlFor={`event-${type}`} className="ml-3 text-sm text-gray-700">
                          {type}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="mt-2 text-xs text-gray-500">
                {eventTypeFilter.length} of {availableEventTypes.length} event types selected
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <XMarkIcon className="-ml-0.5 mr-1 h-4 w-4" aria-hidden="true" />
              Clear All Filters
            </button>
            <button
              type="button"
              onClick={handleApplyFilters}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Applying...
                </>
              ) : (
                <>
                  <CheckIcon className="-ml-0.5 mr-1 h-4 w-4" aria-hidden="true" />
                  Apply Filters
                </>
              )}
            </button>
          </div>
        </div>
      )}
      
      <div className="py-3 px-4 bg-white">
        <div className="text-sm text-gray-600">
          {dataco ? (
            <>
              <span className="font-medium">DATACO-{dataco.dataco_number}</span>
              <span className="mx-2">•</span>
              <span>{dataco.event_count || 0} events</span>
              <span className="mx-2">•</span>
              <span>{dataco.unique_tags || 0} unique tags</span>
            </>
          ) : (
            'No DATACO dataset loaded'
          )}
        </div>
      </div>
    </div>
  );
} 