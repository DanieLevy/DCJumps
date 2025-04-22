#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
import glob
import re
import time
import concurrent.futures
from typing import List, Dict, Tuple, Set, Optional, Any
from datetime import datetime, timedelta
from collections import Counter, defaultdict
import json

# Global constants
BASE_DIR_DEFAULT = "/mobileye/DC/Voice_Tagging/"
ENCODINGS_TO_TRY = ['utf-8', 'latin-1', 'cp1252']
MAX_WORKERS_DEFAULT = min(32, (os.cpu_count() or 4) * 2)
FORMAT_LINE_PREFIX = "#format:"
VERSION_TAG = "trackfile camera frameIDStartFrame tag"

# --- Data Structures ---

class DATACOData:
    """Holds all processed information for a single DATACO number."""
    def __init__(self, dataco_number: str):
        self.dataco_number: str = dataco_number
        self.files: List[str] = []
        self.project_map: Dict[str, List[str]] = defaultdict(list) # Maps project name to list of files
        self.content: List[str] = [] # Combined content lines (excluding format)
        self.tag_counts: Counter = Counter()
        self.event_count: int = 0
        self.session_names: Set[str] = set()
        self.session_dates: Dict[str, datetime] = {} # Maps session name to its date
        self.min_date: Optional[datetime] = None
        self.max_date: Optional[datetime] = None
        self.processed_files_count: int = 0
        self.failed_files: List[str] = []

    def update_stats(self):
        """Calculate final stats after processing."""
        valid_dates = [d for d in self.session_dates.values() if d is not None and d != datetime.min]
        self.min_date = min(valid_dates) if valid_dates else None
        self.max_date = max(valid_dates) if valid_dates else None

    def get_stats_dict(self) -> Dict[str, Any]:
        """Return statistics as a dictionary."""
        min_date_str = self.min_date.isoformat() if self.min_date else None
        max_date_str = self.max_date.isoformat() if self.max_date else None
        
        return {
            "dataco_number": self.dataco_number,
            "total_files": len(self.files),
            "processed_files": self.processed_files_count,
            "failed_files": len(self.failed_files),
            "session_count": len(self.session_names),
            "event_count": self.event_count,
            "unique_tags": len(self.tag_counts),
            "min_date": min_date_str,
            "max_date": max_date_str,
            "tag_counts": dict(self.tag_counts.most_common()),
            "sessions": list(self.session_names)
        }
    
    def to_json(self):
        """Convert to JSON-serializable dictionary"""
        result = self.get_stats_dict()
        result["session_dates"] = {
            k: v.isoformat() if isinstance(v, datetime) else None 
            for k, v in self.session_dates.items()
        }
        # Limit content size
        if len(self.content) > 1000:
            result["content_sample"] = self.content[:1000]
            result["content_truncated"] = True
        else:
            result["content_sample"] = self.content
            result["content_truncated"] = False
        
        return result


class DATACOComparer:
    """Compares multiple DATACOData objects."""
    def __init__(self, datasets: List[DATACOData]):
        self.datasets = datasets
        self.common_tags: Set[str] = self._find_common_tags()
        self.unique_tags: Dict[str, Set[str]] = self._find_unique_tags()

    def _find_common_tags(self) -> Set[str]:
        if not self.datasets: return set()
        common = set(self.datasets[0].tag_counts.keys())
        for dataset in self.datasets[1:]:
            common &= set(dataset.tag_counts.keys())
        return common

    def _find_unique_tags(self) -> Dict[str, Set[str]]:
        unique_tags = {}
        all_tags = set().union(*(set(d.tag_counts.keys()) for d in self.datasets))
        for dataset in self.datasets:
            dataset_tags = set(dataset.tag_counts.keys())
            others_tags = set().union(*(set(d.tag_counts.keys()) for d in self.datasets if d != dataset))
            unique = dataset_tags - others_tags
            unique_tags[dataset.dataco_number] = unique
        return unique_tags
    
    def get_comparison_data(self) -> Dict[str, Any]:
        """Get comparison data in JSON-serializable format"""
        result = {
            "datasets": [d.dataco_number for d in self.datasets],
            "common_tags": list(self.common_tags),
            "unique_tags": {k: list(v) for k, v in self.unique_tags.items()},
            "stats": [d.get_stats_dict() for d in self.datasets]
        }
        return result


# --- Helper Functions (Parsing, File Ops) ---

def parse_date_from_session(session_name: str) -> Optional[datetime]:
    """Extracts date and time (YYMMDD_HHMMSS) from session name."""
    try:
        parts = session_name.split('_')
        if len(parts) >= 3:
            for i, part in enumerate(parts):
                # Look for YYMMDD pattern - 6 digits that could be a date
                if len(part) == 6 and part.isdigit():
                    date_str = part
                    # Check if next part has time info (at least 6 digits starting with HHMMSS)
                    if i+1 < len(parts) and len(parts[i+1]) >= 6 and parts[i+1][:6].isdigit():
                        time_str = parts[i+1][:6]
                        dt_str = f"{date_str}{time_str}"
                        # Use strptime for robust validation (handles Feb 30 etc.)
                        return datetime.strptime(dt_str, "%y%m%d%H%M%S")
    except (ValueError, IndexError):
        pass # Invalid format or date/time values
    return None # Return None for invalid or unparseable

def extract_session_name(file_path: str) -> Optional[str]:
    """Extracts session name from a file path."""
    file_name = os.path.basename(file_path)
    match = re.match(r'^(.*?)_([^_]+)_DATACO-\d+\.jump$', file_name)
    if match:
        return match.group(1) # Everything before the last underscore section before DATACO
    return None

def extract_tag_from_line(line: str) -> Optional[str]:
    """Extracts the tag (last element) from a jump file line."""
    parts = line.strip().split()
    return parts[-1] if len(parts) >= 4 else None

def save_to_file(content: List[str], file_path: str) -> bool:
    """Saves content list to a file using UTF-8 encoding."""
    try:
        # If file_path is empty, use current directory
        if not file_path:
            print("No file path provided.")
            return False
            
        # If directory part doesn't exist, create it
        dir_path = os.path.dirname(file_path)
        if dir_path and not os.path.exists(dir_path):
            try:
                os.makedirs(dir_path, exist_ok=True)
                print(f"Created directory: {dir_path}")
            except Exception as e:
                print(f"Failed to create directory {dir_path}: {str(e)}")
                return False
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write("\n".join(content)) # More efficient writing
        return True
    except Exception as e:
        print(f"Error saving file {file_path}: {str(e)}")
        return False

# --- Parallel Processing ---

def process_file_task(file_path: str) -> Optional[Tuple[str, List[str], Counter]]:
    """Task executed by each thread to process one file."""
    session_name = extract_session_name(file_path)
    if not session_name:
        return None # Skip files with unexpected names

    lines_content = []
    tag_counter = Counter()
    error_occurred = False

    try:
        file_read = False
        for encoding in ENCODINGS_TO_TRY:
            try:
                with open(file_path, 'r', encoding=encoding) as f:
                    lines = f.readlines()
                file_read = True
                break # Stop trying encodings on success
            except UnicodeDecodeError:
                continue
            except Exception as e: # Catch other file reading errors
                error_occurred = True
                break # Stop trying encodings if error other than decode occurred

        if not file_read and not error_occurred:
            return None # Could not read

        if error_occurred: return None

        # Process lines
        for line in lines:
            stripped = line.strip()
            if stripped and not stripped.startswith("#format:"):
                lines_content.append(stripped)
                tag = extract_tag_from_line(stripped)
                if tag:
                    tag_counter[tag] += 1

        return session_name, lines_content, tag_counter

    except Exception as e:
        return None # Ensure task failure returns None

def process_files_multi_threaded(files: List[str]) -> Tuple[List[str], Counter, int]:
    """Process multiple files in parallel and return their combined content, tag counts, and event count."""
    if not files:
        return [], Counter(), 0
    
    combined_content = []
    combined_tags = Counter()
    event_count = 0
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS_DEFAULT) as executor:
        future_to_file = {executor.submit(process_file_task, fp): fp for fp in files}
        
        for future in concurrent.futures.as_completed(future_to_file):
            try:
                task_result = future.result()
                if task_result is not None:
                    _, lines_content, tag_counter = task_result
                    combined_content.extend(lines_content)
                    combined_tags.update(tag_counter)
                    event_count += len(lines_content)
            except Exception as exc:
                # Silently continue on failure
                pass
    
    # Add format line if content was processed
    if combined_content and not combined_content[-1].startswith(FORMAT_LINE_PREFIX):
        combined_content.append(f"{FORMAT_LINE_PREFIX} {VERSION_TAG}")
    
    return combined_content, combined_tags, event_count

def get_date_key_for_sort(file_path: str) -> datetime:
     """Extracts date from file path for sorting, returning min date on error."""
     session_name = extract_session_name(file_path)
     if session_name:
         dt = parse_date_from_session(session_name)
         if dt: return dt
     return datetime.min # Sort files with bad names/dates first

def sort_files_by_date_key(files: List[str]) -> List[str]:
    """Sorts a list of file paths based on the extracted date."""
    return sorted(files, key=get_date_key_for_sort)

def load_dataco_data(dataco_number: str, base_dir: str) -> DATACOData:
    """Finds files, processes them in parallel, and returns DATACOData object."""
    result = DATACOData(dataco_number)
    print(f"Finding files for DATACO-{dataco_number}...")

    # Find files
    try:
        project_folders = [f.path for f in os.scandir(base_dir) if f.is_dir()]
    except FileNotFoundError:
        print(f"Base directory '{base_dir}' not found.")
        return result # Return empty result
    except Exception as e:
        print(f"Error scanning base directory '{base_dir}': {str(e)}")
        return result

    all_files = []
    for project_folder in project_folders:
        project_name = os.path.basename(project_folder)
        search_pattern = os.path.join(project_folder, f"*DATACO-{dataco_number}.jump")
        found_files = glob.glob(search_pattern)
        if found_files:
            result.project_map[project_name].extend(found_files)
            all_files.extend(found_files)

    result.files = sort_files_by_date_key(all_files) # Sort files early
    print(f"Found {len(result.files)} files across {len(result.project_map)} projects.")

    if not result.files:
        return result # No files found

    # Process files in parallel
    total_files = len(result.files)
    
    processed_count = 0
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS_DEFAULT) as executor:
        future_to_file = {executor.submit(process_file_task, fp): fp for fp in result.files}

        for future in concurrent.futures.as_completed(future_to_file):
            file_path = future_to_file[future]
            try:
                task_result = future.result()
                if task_result is not None:
                    session_name, lines_content, tag_counter = task_result
                    result.content.extend(lines_content)
                    result.tag_counts.update(tag_counter)
                    result.event_count += len(lines_content)
                    result.session_names.add(session_name)
                    # Attempt to parse and store date for the session
                    if session_name not in result.session_dates:
                         result.session_dates[session_name] = parse_date_from_session(session_name)
                    processed_count += 1
                else:
                    result.failed_files.append(os.path.basename(file_path))
            except Exception as exc:
                result.failed_files.append(os.path.basename(file_path))

    result.processed_files_count = processed_count
    # Add format line if content was processed
    if result.processed_files_count > 0:
        result.content.append(f"{FORMAT_LINE_PREFIX} {VERSION_TAG}")
        
    result.update_stats() # Calculate min/max dates etc.
    
    if result.failed_files:
         print(f"Failed to process {len(result.failed_files)} files for DATACO-{dataco_number}.")

    return result

def merge_dataco_results(datasets_to_merge: List[DATACOData], merged_prefix: str = "MERGED") -> Optional[DATACOData]:
    """Merges multiple DATACOData objects into a new one."""
    if not datasets_to_merge or len(datasets_to_merge) < 2:
        return None

    merged_number = f"{merged_prefix}_{'_'.join(d.dataco_number for d in datasets_to_merge)}"
    merged_data = DATACOData(merged_number)

    print(f"Merging {len(datasets_to_merge)} datasets...")

    # Combine files, projects, sessions, dates
    all_files = set()
    all_sessions = set()
    all_session_dates = {}
    project_map = defaultdict(set)

    for dataset in datasets_to_merge:
        all_files.update(dataset.files)
        all_sessions.update(dataset.session_names)
        all_session_dates.update(dataset.session_dates) # Overwrites duplicates, likely okay
        for proj, files in dataset.project_map.items():
            project_map[proj].update(files)

    merged_data.files = sort_files_by_date_key(list(all_files))
    merged_data.project_map = {k: list(v) for k, v in project_map.items()} # Convert sets back to lists
    merged_data.session_names = all_sessions
    merged_data.session_dates = all_session_dates
    
    # Re-process approach (more accurate, potentially slower):
    print("Re-processing merged files for accurate content and tags...")
    merged_data.content, merged_data.tag_counts, merged_data.event_count = process_files_multi_threaded(merged_data.files)

    merged_data.processed_files_count = sum(d.processed_files_count for d in datasets_to_merge)
    merged_data.failed_files = list(set(f for d in datasets_to_merge for f in d.failed_files))
    merged_data.update_stats()

    return merged_data

# --- API Functions for Web Interface ---

def get_dataco_data(dataco_number: str, base_dir: str) -> Dict[str, Any]:
    """API function to get DATACO data and return JSON-serializable dictionary"""
    dataco_data = load_dataco_data(dataco_number, base_dir)
    return dataco_data.to_json()

def compare_datacos(dataco_numbers: List[str], base_dir: str) -> Dict[str, Any]:
    """API function to compare multiple DATACO numbers"""
    datasets = []
    for number in dataco_numbers:
        data = load_dataco_data(number, base_dir)
        if data.files:  # Only include if files were found
            datasets.append(data)
    
    if len(datasets) < 2:
        return {"error": "Need at least two valid DATACO datasets to compare"}
    
    comparer = DATACOComparer(datasets)
    return comparer.get_comparison_data()

def merge_datacos(dataco_numbers: List[str], base_dir: str) -> Dict[str, Any]:
    """API function to merge multiple DATACO datasets"""
    datasets = []
    for number in dataco_numbers:
        data = load_dataco_data(number, base_dir)
        if data.files:  # Only include if files were found
            datasets.append(data)
    
    if len(datasets) < 2:
        return {"error": "Need at least two valid DATACO datasets to merge"}
    
    merged_data = merge_dataco_results(datasets)
    if merged_data:
        return merged_data.to_json()
    else:
        return {"error": "Failed to merge datasets"}

def save_dataco_content(content: List[str], file_path: str) -> Dict[str, Any]:
    """API function to save DATACO content to a file"""
    success = save_to_file(content, file_path)
    return {"success": success, "file_path": file_path if success else None}

# Command line interface for testing
if __name__ == "__main__":
    import argparse
    import json

    parser = argparse.ArgumentParser(description="DATACO Jump File Processor API")
    parser.add_argument("--action", required=True, choices=["load", "compare", "merge", "save"], 
                      help="Action to perform")
    parser.add_argument("--dataco", help="DATACO number(s) (comma separated)")
    parser.add_argument("--base-dir", default=BASE_DIR_DEFAULT, 
                      help=f"Base directory (default: {BASE_DIR_DEFAULT})")
    parser.add_argument("--output", help="Output file path for save action")
    args = parser.parse_args()

    try:
        if args.action == "load":
            if not args.dataco:
                print("Error: --dataco is required for load action")
                sys.exit(1)
            result = get_dataco_data(args.dataco, args.base_dir)
            print(json.dumps(result, indent=2))
        
        elif args.action == "compare":
            if not args.dataco:
                print("Error: --dataco is required for compare action")
                sys.exit(1)
            dataco_numbers = [num.strip() for num in args.dataco.split(",")]
            result = compare_datacos(dataco_numbers, args.base_dir)
            print(json.dumps(result, indent=2))
        
        elif args.action == "merge":
            if not args.dataco:
                print("Error: --dataco is required for merge action")
                sys.exit(1)
            dataco_numbers = [num.strip() for num in args.dataco.split(",")]
            result = merge_datacos(dataco_numbers, args.base_dir)
            print(json.dumps(result, indent=2))
        
        elif args.action == "save":
            # For save action, we expect content to be piped in
            if not args.output:
                print("Error: --output is required for save action")
                sys.exit(1)
            content = [line.strip() for line in sys.stdin.readlines()]
            result = save_dataco_content(content, args.output)
            print(json.dumps(result, indent=2))
    
    except Exception as e:
        error_result = {"error": str(e)}
        print(json.dumps(error_result, indent=2))
        sys.exit(1) 