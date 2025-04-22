import { useState, useEffect } from 'react';
import { 
  CalendarIcon, 
  ClockIcon, 
  TagIcon, 
  TruckIcon,
  DocumentTextIcon,
  CameraIcon,
  FilmIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { JumpEvent, parseJumpEvent } from '@/utils/jumpFileUtils';

interface JumpEventDetailsViewProps {
  event: string | JumpEvent;
  showRaw?: boolean;
}

export default function JumpEventDetailsView({ event, showRaw = false }: JumpEventDetailsViewProps) {
  const [parsedEvent, setParsedEvent] = useState<JumpEvent | null>(null);
  
  useEffect(() => {
    if (typeof event === 'string') {
      setParsedEvent(parseJumpEvent(event));
    } else {
      setParsedEvent(event);
    }
  }, [event]);
  
  if (!parsedEvent) {
    return <div className="text-sm text-gray-500">Invalid event format</div>;
  }
  
  const { trackfile, camera, frameId, tag } = parsedEvent;
  const { session, viewName, clipNumber } = trackfile;
  
  return (
    <div className="space-y-3">
      {showRaw && (
        <div className="bg-gray-100 p-2 rounded font-mono text-xs overflow-x-auto">
          {parsedEvent.raw}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500 flex items-center mb-1">
              <BuildingOfficeIcon className="h-4 w-4 mr-1 text-indigo-500" />
              Project Information
            </h3>
            <div className="ml-5 space-y-1">
              <div className="flex items-center text-sm">
                <span className="font-medium text-gray-600 w-24">Project:</span>
                <span className="text-gray-800">{session.projectName || 'N/A'}</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="font-medium text-gray-600 w-24">Vehicle:</span>
                <span className="text-gray-800">{session.vehicleName || 'N/A'}</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="font-medium text-gray-600 w-24">Version:</span>
                <span className="text-gray-800">{session.versionNumber || 'N/A'}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500 flex items-center mb-1">
              <CalendarIcon className="h-4 w-4 mr-1 text-blue-500" />
              Date & Time
            </h3>
            <div className="ml-5 space-y-1">
              <div className="flex items-center text-sm">
                <span className="font-medium text-gray-600 w-24">Date:</span>
                <span className="text-gray-800">
                  {session.date ? session.date.toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex items-center text-sm">
                <span className="font-medium text-gray-600 w-24">Time:</span>
                <span className="text-gray-800">{session.time || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500 flex items-center mb-1">
              <CameraIcon className="h-4 w-4 mr-1 text-green-500" />
              Recording Details
            </h3>
            <div className="ml-5 space-y-1">
              <div className="flex items-center text-sm">
                <span className="font-medium text-gray-600 w-24">View:</span>
                <span className="text-gray-800">{viewName || 'N/A'}</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="font-medium text-gray-600 w-24">Clip:</span>
                <span className="text-gray-800">{clipNumber || 'N/A'}</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="font-medium text-gray-600 w-24">Camera:</span>
                <span className="text-gray-800">{camera || 'N/A'}</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="font-medium text-gray-600 w-24">Frame ID:</span>
                <span className="text-gray-800">{frameId || 'N/A'}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500 flex items-center mb-1">
              <TagIcon className="h-4 w-4 mr-1 text-red-500" />
              Tag Information
            </h3>
            <div className="ml-5">
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {tag || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 