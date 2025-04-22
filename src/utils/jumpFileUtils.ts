/**
 * Utility functions for working with .jump files
 */

/**
 * Represents the structure of a session name in a jump file.
 * Example: DC3_Cay8_250126_105227_173621
 * - DC3 = Project Name
 * - Cay8 = Vehicle Name
 * - 250126 = Date (26/01/2025)
 * - 105227 = Time (10:52:27)
 * - 173621 = Version number
 */
export interface SessionInfo {
  raw: string;
  projectName: string;
  vehicleName: string;
  date: Date | null;
  time: string;
  versionNumber: string;
}

/**
 * Represents the structure of a trackfile in a jump file.
 * Example: SBS1_Wstn_250108_095047_0000_s001_v_Front-tgtSamsung3_s60_0003
 */
export interface TrackfileInfo {
  raw: string;
  session: SessionInfo;
  viewName: string;
  clipNumber: string;
}

/**
 * Represents a single jump event line.
 * Example: SBS1_Wstn_250108_095047_0000_s001_v_Front-tgtSamsung3_s60_0003 main 4535 police
 */
export interface JumpEvent {
  raw: string;
  trackfile: TrackfileInfo;
  camera: string;
  frameId: number;
  tag: string;
}

/**
 * Represents an entire jump file.
 */
export interface JumpFile {
  events: JumpEvent[];
  hasFormatRow: boolean;
}

/**
 * Parse a date string in the format YYMMDD to a Date object.
 * Example: 250126 -> Date object for January 26, 2025
 */
export function parseJumpDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.length !== 6) return null;
  
  try {
    const year = parseInt(`20${dateStr.substring(0, 2)}`, 10);
    const month = parseInt(dateStr.substring(2, 4), 10) - 1; // 0-indexed month
    const day = parseInt(dateStr.substring(4, 6), 10);
    
    return new Date(year, month, day);
  } catch (e) {
    console.error('Error parsing jump date:', e);
    return null;
  }
}

/**
 * Format a time string from HHMMSS to HH:MM:SS.
 * Example: 105227 -> 10:52:27
 */
export function formatTimeString(timeStr: string): string {
  if (!timeStr || timeStr.length !== 6) return timeStr;
  
  try {
    const hour = timeStr.substring(0, 2);
    const minute = timeStr.substring(2, 4);
    const second = timeStr.substring(4, 6);
    
    return `${hour}:${minute}:${second}`;
  } catch (e) {
    console.error('Error formatting time string:', e);
    return timeStr;
  }
}

/**
 * Parse a session name string into its components.
 * Example: DC3_Cay8_250126_105227_173621 -> SessionInfo object
 */
export function parseSessionName(sessionName: string): SessionInfo {
  if (!sessionName) {
    return {
      raw: '',
      projectName: '',
      vehicleName: '',
      date: null,
      time: '',
      versionNumber: ''
    };
  }
  
  const parts = sessionName.split('_');
  
  // Handle different formats - some may have fewer components
  const projectName = parts[0] || '';
  const vehicleName = parts.length > 1 ? parts[1] : '';
  const dateStr = parts.length > 2 ? parts[2] : '';
  const timeStr = parts.length > 3 ? parts[3] : '';
  const versionNumber = parts.length > 4 ? parts[4] : '';
  
  return {
    raw: sessionName,
    projectName,
    vehicleName,
    date: parseJumpDate(dateStr),
    time: formatTimeString(timeStr),
    versionNumber
  };
}

/**
 * Parse a trackfile string into its components.
 * Example: SBS1_Wstn_250108_095047_0000_s001_v_Front-tgtSamsung3_s60_0003
 */
export function parseTrackfile(trackfile: string): TrackfileInfo {
  if (!trackfile) {
    return {
      raw: '',
      session: parseSessionName(''),
      viewName: '',
      clipNumber: ''
    };
  }
  
  try {
    // Extract the session part (everything before _s001_)
    const sessionEndIndex = trackfile.indexOf('_s001_');
    if (sessionEndIndex === -1) {
      throw new Error('Invalid trackfile format: missing _s001_');
    }
    
    const sessionPart = trackfile.substring(0, sessionEndIndex);
    const restPart = trackfile.substring(sessionEndIndex + 6); // Skip '_s001_'
    
    // Parse view name (everything between _s001_ and _s60_)
    const s60Index = restPart.indexOf('_s60_');
    if (s60Index === -1) {
      throw new Error('Invalid trackfile format: missing _s60_');
    }
    
    const viewName = restPart.substring(0, s60Index);
    
    // Parse clip number (everything after _s60_)
    const clipNumber = restPart.substring(s60Index + 5); // Skip '_s60_'
    
    return {
      raw: trackfile,
      session: parseSessionName(sessionPart),
      viewName,
      clipNumber
    };
  } catch (e) {
    console.error('Error parsing trackfile:', e);
    return {
      raw: trackfile,
      session: parseSessionName(''),
      viewName: '',
      clipNumber: ''
    };
  }
}

/**
 * Parse a single jump event line.
 * Example: SBS1_Wstn_250108_095047_0000_s001_v_Front-tgtSamsung3_s60_0003 main 4535 police
 */
export function parseJumpEvent(line: string): JumpEvent | null {
  if (!line || line.trim().startsWith('#')) {
    return null; // Skip comments and empty lines
  }
  
  const parts = line.trim().split(/\s+/);
  if (parts.length < 4) {
    return null; // Invalid format
  }
  
  const trackfileStr = parts[0];
  const camera = parts[1];
  const frameId = parseInt(parts[2], 10);
  const tag = parts.slice(3).join(' '); // Tag might contain spaces
  
  return {
    raw: line,
    trackfile: parseTrackfile(trackfileStr),
    camera,
    frameId,
    tag
  };
}

/**
 * Parse an entire jump file content.
 */
export function parseJumpFile(content: string): JumpFile {
  const lines = content.split('\n');
  const events: JumpEvent[] = [];
  let hasFormatRow = false;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Check for format row
    if (trimmedLine.startsWith('#format:')) {
      hasFormatRow = true;
      continue;
    }
    
    // Skip empty lines
    if (!trimmedLine) continue;
    
    const event = parseJumpEvent(trimmedLine);
    if (event) {
      events.push(event);
    }
  }
  
  return {
    events,
    hasFormatRow
  };
}

/**
 * Group events by a specific property
 */
export function groupEventsByTag(events: JumpEvent[]): Record<string, JumpEvent[]> {
  return events.reduce((acc, event) => {
    if (!acc[event.tag]) {
      acc[event.tag] = [];
    }
    acc[event.tag].push(event);
    return acc;
  }, {} as Record<string, JumpEvent[]>);
}

/**
 * Group events by vehicle
 */
export function groupEventsByVehicle(events: JumpEvent[]): Record<string, JumpEvent[]> {
  return events.reduce((acc, event) => {
    const vehicle = event.trackfile.session.vehicleName;
    if (!acc[vehicle]) {
      acc[vehicle] = [];
    }
    acc[vehicle].push(event);
    return acc;
  }, {} as Record<string, JumpEvent[]>);
}

/**
 * Group events by project
 */
export function groupEventsByProject(events: JumpEvent[]): Record<string, JumpEvent[]> {
  return events.reduce((acc, event) => {
    const project = event.trackfile.session.projectName;
    if (!acc[project]) {
      acc[project] = [];
    }
    acc[project].push(event);
    return acc;
  }, {} as Record<string, JumpEvent[]>);
}

/**
 * Group events by date
 */
export function groupEventsByDate(events: JumpEvent[]): Record<string, JumpEvent[]> {
  return events.reduce((acc, event) => {
    const date = event.trackfile.session.date;
    const dateStr = date ? date.toISOString().split('T')[0] : 'unknown';
    
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(event);
    return acc;
  }, {} as Record<string, JumpEvent[]>);
}

/**
 * Sort events by date and time
 */
export function sortEventsByDateTime(events: JumpEvent[], ascending = true): JumpEvent[] {
  return [...events].sort((a, b) => {
    const dateA = a.trackfile.session.date;
    const dateB = b.trackfile.session.date;
    
    if (!dateA && !dateB) return 0;
    if (!dateA) return ascending ? 1 : -1;
    if (!dateB) return ascending ? -1 : 1;
    
    const timeCompare = dateA.getTime() - dateB.getTime();
    if (timeCompare !== 0) return ascending ? timeCompare : -timeCompare;
    
    // If dates are identical, compare by frame ID
    return ascending 
      ? a.frameId - b.frameId 
      : b.frameId - a.frameId;
  });
}

/**
 * Generate a jump file content from events
 */
export function generateJumpFileContent(events: JumpEvent[]): string {
  const lines = events.map(event => event.raw);
  
  // Add format row at the end
  lines.push('#format: trackfile camera frameIDStartFrame tag');
  
  return lines.join('\n');
}

/**
 * Check if the jump file has valid format
 */
export function validateJumpFile(file: JumpFile): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (file.events.length === 0) {
    errors.push('Empty jump file');
  }
  
  if (!file.hasFormatRow) {
    errors.push('Missing format row at the end of the file');
  }
  
  // Check for invalid events
  const invalidEvents = file.events.filter(event => {
    const isValid = 
      event.trackfile.raw &&
      event.camera &&
      !isNaN(event.frameId) &&
      event.tag;
      
    return !isValid;
  });
  
  if (invalidEvents.length > 0) {
    errors.push(`${invalidEvents.length} invalid events found`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Extract all unique tags from events
 */
export function extractUniqueTags(events: JumpEvent[]): string[] {
  return Array.from(new Set(events.map(event => event.tag)));
}

/**
 * Extract all unique projects from events
 */
export function extractUniqueProjects(events: JumpEvent[]): string[] {
  return Array.from(new Set(events.map(event => event.trackfile.session.projectName)));
}

/**
 * Extract all unique vehicles from events
 */
export function extractUniqueVehicles(events: JumpEvent[]): string[] {
  return Array.from(new Set(events.map(event => event.trackfile.session.vehicleName)));
}

/**
 * Extract all unique dates from events
 */
export function extractUniqueDates(events: JumpEvent[]): Date[] {
  return Array.from(
    new Set(
      events
        .map(event => event.trackfile.session.date)
        .filter(date => date !== null)
    )
  ) as Date[];
}

/**
 * Filter events by tag
 */
export function filterEventsByTag(events: JumpEvent[], tag: string): JumpEvent[] {
  return events.filter(event => event.tag === tag);
}

/**
 * Filter events by project
 */
export function filterEventsByProject(events: JumpEvent[], project: string): JumpEvent[] {
  return events.filter(event => event.trackfile.session.projectName === project);
}

/**
 * Filter events by vehicle
 */
export function filterEventsByVehicle(events: JumpEvent[], vehicle: string): JumpEvent[] {
  return events.filter(event => event.trackfile.session.vehicleName === vehicle);
}

/**
 * Filter events by date range
 */
export function filterEventsByDateRange(
  events: JumpEvent[], 
  startDate: Date, 
  endDate: Date
): JumpEvent[] {
  return events.filter(event => {
    const date = event.trackfile.session.date;
    if (!date) return false;
    
    return date >= startDate && date <= endDate;
  });
} 