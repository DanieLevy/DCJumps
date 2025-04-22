import fs from 'fs';
import path from 'path';

// Simple parser for jump files in TestDC
export function parseTestDatacoFiles(dataco: string, testDir: string): any {
  try {
    // Find all files for this DATACO number
    const files = findDatacoFilesInTestDir(testDir, dataco);
    
    if (files.length === 0) {
      console.warn(`No files found for DATACO ${dataco} in TestDC`);
      return null;
    }
    
    console.log(`Found ${files.length} files for DATACO ${dataco} in TestDC`);
    
    // Initialize data structure
    const data = {
      dataco_number: dataco,
      total_files: files.length,
      processed_files: 0,
      failed_files: 0,
      session_count: 0,
      event_count: 0,
      unique_tags: 0,
      min_date: null,
      max_date: null,
      tag_counts: {} as Record<string, number>,
      sessions: [] as string[],
      content_sample: [] as string[],
      content_truncated: false
    };
    
    // Process each file
    const tagSet = new Set<string>();
    const sessionSet = new Set<string>();
    const dates = [];
    
    files.forEach(filePath => {
      try {
        // Extract session name from file name
        const fileName = path.basename(filePath);
        const sessionMatch = fileName.match(/^(.+)_DATACO-\d+\.jump$/);
        const sessionName = sessionMatch ? sessionMatch[1] : fileName;
        
        // Extract date from session name (format: Session_1_YYMMDD_HHMMSS)
        const dateMatch = sessionName.match(/\d{6}_\d{6}/);
        if (dateMatch) {
          const dateStr = dateMatch[0]; // YYMMDD_HHMMSS
          const year = 2000 + parseInt(dateStr.substring(0, 2));
          const month = parseInt(dateStr.substring(2, 4)) - 1;
          const day = parseInt(dateStr.substring(4, 6));
          const hour = parseInt(dateStr.substring(7, 9));
          const minute = parseInt(dateStr.substring(9, 11));
          const second = parseInt(dateStr.substring(11, 13));
          
          const date = new Date(year, month, day, hour, minute, second);
          dates.push(date);
        }
        
        // Read file content
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim() !== '');
        
        // Extract tags and count events
        const validLines = lines.filter(line => !line.startsWith('#'));
        validLines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 4) {
            const tag = parts[parts.length - 1];
            tagSet.add(tag);
            data.tag_counts[tag] = (data.tag_counts[tag] || 0) + 1;
            data.event_count++;
          }
        });
        
        // Add session to the list
        sessionSet.add(sessionName);
        
        // Add content to sample (up to 50 lines)
        if (data.content_sample.length < 50) {
          const samplesToAdd = Math.min(50 - data.content_sample.length, validLines.length);
          data.content_sample.push(...validLines.slice(0, samplesToAdd));
        } else {
          data.content_truncated = true;
        }
        
        data.processed_files++;
      } catch (error) {
        console.error(`Error processing file ${filePath}:`, error);
        data.failed_files++;
      }
    });
    
    // Set calculated values
    data.unique_tags = tagSet.size;
    data.sessions = Array.from(sessionSet);
    data.session_count = sessionSet.size;
    
    // Set date range
    if (dates.length > 0) {
      data.min_date = new Date(Math.min(...dates.map(d => d.getTime()))).toISOString();
      data.max_date = new Date(Math.max(...dates.map(d => d.getTime()))).toISOString();
    }
    
    return data;
  } catch (error) {
    console.error(`Error parsing TestDC files for DATACO ${dataco}:`, error);
    return null;
  }
}

// Compare multiple DATACO datasets
export function compareTestDatacoFiles(datacoNumbers: string[], testDir: string): any {
  try {
    // Parse each DATACO dataset
    const datasets = datacoNumbers.map(dataco => parseTestDatacoFiles(dataco, testDir))
      .filter(Boolean); // Filter out null results
    
    if (datasets.length < 2) {
      console.warn(`Not enough valid datasets to compare. Found ${datasets.length}, need at least 2.`);
      return null;
    }
    
    // Find common tags across all datasets
    const commonTags = findCommonTags(datasets);
    
    // Find unique tags for each dataset
    const uniqueTags = findUniqueTags(datasets);
    
    // Create comparison result
    return {
      datasets: datacoNumbers,
      common_tags: commonTags,
      unique_tags: uniqueTags,
      stats: datasets.map(d => ({
        dataco_number: d.dataco_number,
        total_files: d.total_files,
        processed_files: d.processed_files,
        event_count: d.event_count,
        unique_tags: d.unique_tags,
        session_count: d.session_count,
        tag_counts: d.tag_counts
      }))
    };
  } catch (error) {
    console.error(`Error comparing DATACO datasets:`, error);
    return null;
  }
}

// Merge multiple DATACO datasets
export function mergeTestDatacoFiles(datacoNumbers: string[], testDir: string): any {
  try {
    // Parse each DATACO dataset
    const datasets = datacoNumbers.map(dataco => parseTestDatacoFiles(dataco, testDir))
      .filter(Boolean); // Filter out null results
    
    if (datasets.length < 2) {
      console.warn(`Not enough valid datasets to merge. Found ${datasets.length}, need at least 2.`);
      return null;
    }
    
    // Create a merged dataset
    const mergedData = {
      dataco_number: `MERGED-${datacoNumbers.join('-')}`,
      total_files: 0,
      processed_files: 0,
      failed_files: 0,
      session_count: 0,
      event_count: 0,
      unique_tags: 0,
      min_date: null,
      max_date: null,
      tag_counts: {} as Record<string, number>,
      sessions: [] as string[],
      content_sample: [] as string[],
      content_truncated: false
    };
    
    // Combine statistics
    datasets.forEach(dataset => {
      mergedData.total_files += dataset.total_files;
      mergedData.processed_files += dataset.processed_files;
      mergedData.failed_files += dataset.failed_files;
      mergedData.event_count += dataset.event_count;
      
      // Merge sessions
      mergedData.sessions = [...mergedData.sessions, ...dataset.sessions];
      
      // Merge content samples (up to 50 lines)
      if (mergedData.content_sample.length < 50) {
        const remainingSpace = 50 - mergedData.content_sample.length;
        const samplesToAdd = Math.min(remainingSpace, dataset.content_sample.length);
        mergedData.content_sample.push(...dataset.content_sample.slice(0, samplesToAdd));
        
        if (mergedData.content_sample.length >= 50 && dataset.content_sample.length > samplesToAdd) {
          mergedData.content_truncated = true;
        }
      } else {
        mergedData.content_truncated = true;
      }
      
      // Merge tag counts
      Object.entries(dataset.tag_counts).forEach(([tag, count]) => {
        mergedData.tag_counts[tag] = (mergedData.tag_counts[tag] || 0) + count;
      });
      
      // Update date range
      if (dataset.min_date && (!mergedData.min_date || new Date(dataset.min_date) < new Date(mergedData.min_date))) {
        mergedData.min_date = dataset.min_date;
      }
      
      if (dataset.max_date && (!mergedData.max_date || new Date(dataset.max_date) > new Date(mergedData.max_date))) {
        mergedData.max_date = dataset.max_date;
      }
    });
    
    // Remove duplicate sessions
    mergedData.sessions = [...new Set(mergedData.sessions)];
    mergedData.session_count = mergedData.sessions.length;
    
    // Count unique tags
    mergedData.unique_tags = Object.keys(mergedData.tag_counts).length;
    
    return {
      success: true,
      message: `Successfully merged ${datasets.length} DATACO datasets`,
      data: mergedData,
      outputPath: `${testDir}/merged_${datacoNumbers.join('-')}.jump`
    };
  } catch (error) {
    console.error(`Error merging DATACO datasets:`, error);
    return null;
  }
}

// Helper function to find common tags across datasets
function findCommonTags(datasets: any[]): string[] {
  if (datasets.length === 0) return [];
  
  // Start with all tags from the first dataset
  const commonTags = new Set(Object.keys(datasets[0].tag_counts));
  
  // Intersect with tags from all other datasets
  for (let i = 1; i < datasets.length; i++) {
    const datasetTags = new Set(Object.keys(datasets[i].tag_counts));
    
    // Keep only tags that are in both sets
    for (const tag of commonTags) {
      if (!datasetTags.has(tag)) {
        commonTags.delete(tag);
      }
    }
  }
  
  return Array.from(commonTags);
}

// Helper function to find unique tags for each dataset
function findUniqueTags(datasets: any[]): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  
  datasets.forEach(dataset => {
    const datasetTags = new Set(Object.keys(dataset.tag_counts));
    const uniqueTags: string[] = [];
    
    // Check if each tag is unique to this dataset
    datasetTags.forEach(tag => {
      let isUnique = true;
      
      for (const otherDataset of datasets) {
        if (otherDataset !== dataset && Object.keys(otherDataset.tag_counts).includes(tag)) {
          isUnique = false;
          break;
        }
      }
      
      if (isUnique) {
        uniqueTags.push(tag);
      }
    });
    
    result[dataset.dataco_number] = uniqueTags;
  });
  
  return result;
}

// Helper function to find dataco files in TestDC directory
export function findDatacoFilesInTestDir(testDir: string, datacoNumber: string): string[] {
  const files: string[] = [];
  
  // Get all subdirectories in TestDC
  const projectDirs = fs.readdirSync(testDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  // Look for jump files containing the dataco number in each project directory
  projectDirs.forEach(projectDir => {
    const projectPath = path.join(testDir, projectDir);
    try {
      const dirFiles = fs.readdirSync(projectPath);
      const matchingFiles = dirFiles.filter(file => 
        file.endsWith('.jump') && file.includes(`DATACO-${datacoNumber}`)
      );
      
      matchingFiles.forEach(file => {
        files.push(path.join(projectPath, file));
      });
    } catch (error) {
      console.error(`Error reading directory ${projectPath}:`, error);
    }
  });
  
  return files;
} 