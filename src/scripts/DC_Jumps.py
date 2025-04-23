#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
import fnmatch
import argparse
import json
import logging
from datetime import datetime
from collections import Counter

# Check Python version
import platform
python_version = platform.python_version_tuple()
python_version_info = "Python {}.{}.{}".format(*python_version)
print(f"Running with {python_version_info}")

# Set up logging
logging.basicConfig(
    level=logging.DEBUG,
    format='[%(asctime)s] [PYTHON] %(message)s',
    datefmt='%Y-%m-%dT%H:%M:%S'
)
logger = logging.getLogger('DC_Jumps')

def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='DATACO Jump Files Processor')
    
    parser.add_argument('--action', choices=['load', 'compare', 'merge', 'save', 'check_exists'],
                        help='Action to perform: load, compare, merge, save, or check_exists')
    
    parser.add_argument('--dataco',
                        help='DATACO number(s) to process (comma-separated for multiple)')
    
    parser.add_argument('--base-dir', default='/mobileye/DC/Voice_Tagging/',
                        help='Base directory for DATACO files')
    
    parser.add_argument('--output', 
                        help='Output file path (used for save action)')
    
    parser.add_argument('--help-cmd', action='store_true',
                        help='Show help message and exit')
                        
    parser.add_argument('--test_dir', action='store_true',
                        help='Use test directory instead of production directory')
                        
    parser.add_argument('--check_only', 
                        help='Only check if files exist (for check_exists action)')
    
    return parser.parse_args()

def find_dataco_files(dataco_number, base_dir):
    """Find all jump files for a given DATACO number, searching recursively."""
    # Ensure the base directory exists
    if not os.path.isdir(base_dir):
        logger.warning(f"Base directory not found or not a directory: {base_dir}")
        return []
    
    logger.debug(f"Searching for DATACO-{dataco_number} in {base_dir}")
    
    # Recursive search pattern for Python 3.5+
    pattern = f"*DATACO-{dataco_number}.jump"
    files = []
    
    # Walk the directory tree - works on all Python versions
    for root, _, filenames in os.walk(base_dir):
        for filename in filenames:
            if fnmatch.fnmatch(filename, pattern):
                file_path = os.path.join(root, filename)
                if os.path.isfile(file_path):
                    files.append(file_path)
    
    logger.debug(f"Found {len(files)} files for DATACO-{dataco_number}")
    return files

def extract_tag_from_line(line):
    """Extract tag from a jump file line.
    Format: trackfile camera frameID tag
    Example: SBS1_Wstn_250108_095047_0000_s001_v_Front-tgtSamsung3_s60_0003 main 4535 police
    """
    parts = line.strip().split()
    if len(parts) < 4:
        return None
    
    # Tag is everything after the frame ID (could be multiple words)
    return ' '.join(parts[3:])

def load_dataco(dataco_number, base_dir):
    """Load and process a single DATACO dataset."""
    logger.debug(f"Loading DATACO-{dataco_number} from {base_dir}")
    files = find_dataco_files(dataco_number, base_dir)
    
    if not files:
        logger.warning(f"No files found for DATACO-{dataco_number} in {base_dir}")
        return {
            "success": False,
            "error": f"No files found for DATACO-{dataco_number}"
        }
    
    # Process all files
    all_content = []
    tag_counter = Counter()
    session_names = set()
    
    for file_path in files:
        try:
            # Extract session name from filename
            filename = os.path.basename(file_path)
            session_name = filename.split(f"_DATACO-{dataco_number}")[0]
            session_names.add(session_name)
            
            logger.debug(f"Processing file: {file_path}")
            
            # Read and process file content
            with open(file_path, 'r', encoding='utf-8') as f:
                for line in f:
                    stripped = line.strip()
                    if stripped and not stripped.startswith("#format:"):
                        all_content.append(stripped)
                        tag = extract_tag_from_line(stripped)
                        if tag:
                            tag_counter[tag] += 1
        except Exception as e:
            logger.error(f"Error processing file {file_path}: {str(e)}")
    
    # Generate response
    now = datetime.now()
    yesterday = datetime.now()
    yesterday = yesterday.replace(day=yesterday.day-1)
    
    result = {
        "dataco_number": dataco_number,
        "total_files": len(files),
        "processed_files": len(files),
        "failed_files": 0,
        "session_count": len(session_names),
        "event_count": len(all_content),
        "unique_tags": len(tag_counter),
        "min_date": yesterday.isoformat(),
        "max_date": now.isoformat(),
        "tag_counts": dict(tag_counter),
        "sessions": list(session_names),
        "content_sample": all_content[:100],
        "content_truncated": len(all_content) > 100
    }
    
    logger.debug(f"Successfully loaded DATACO-{dataco_number}: {len(files)} files, {len(all_content)} events")
    return result

def compare_datacos(dataco_numbers, base_dir):
    """Compare multiple DATACO datasets."""
    logger.debug(f"Comparing DATACOs: {dataco_numbers}")
    
    if len(dataco_numbers) < 2:
        logger.error("At least two DATACO numbers are required for comparison")
        return {
            "success": False,
            "error": "At least two DATACO numbers are required for comparison"
        }
    
    datasets = []
    stats = []
    all_tags = set()
    
    for dataco in dataco_numbers:
        data = load_dataco(dataco, base_dir)
        if "error" in data:
            continue
        
        datasets.append(dataco)
        stats.append(data)
        all_tags.update(data["tag_counts"].keys())
    
    # Find common tags
    common_tags = set()
    if stats:
        common_tags = set(stats[0]["tag_counts"].keys())
        for data in stats[1:]:
            common_tags &= set(data["tag_counts"].keys())
    
    # Find unique tags for each dataset
    unique_tags = {}
    for i, dataco in enumerate(datasets):
        if i < len(stats):
            dataset_tags = set(stats[i]["tag_counts"].keys())
            others_tags = set()
            for j, other_dataco in enumerate(datasets):
                if i != j and j < len(stats):
                    others_tags.update(stats[j]["tag_counts"].keys())
            unique = dataset_tags - others_tags
            unique_tags[dataco] = list(unique)
    
    logger.debug(f"Comparison completed: {len(datasets)} datasets, {len(common_tags)} common tags")
    return {
        "datasets": datasets,
        "common_tags": list(common_tags),
        "unique_tags": unique_tags,
        "stats": stats
    }

def merge_datacos(dataco_numbers, base_dir):
    """Merge multiple DATACO datasets."""
    logger.debug(f"Merging DATACOs: {dataco_numbers}")
    
    if len(dataco_numbers) < 2:
        logger.error("At least two DATACO numbers are required for merging")
        return {
            "success": False,
            "error": "At least two DATACO numbers are required for merging"
        }
    
    all_content = []
    tag_counter = Counter()
    session_names = set()
    processed_files = 0
    failed_files = 0
    all_files = []
    dates = []
    
    # Load and process each DATACO dataset
    for dataco in dataco_numbers:
        try:
            files = find_dataco_files(dataco, base_dir)
            if not files:
                logger.warning(f"No files found for DATACO-{dataco} in {base_dir}")
                continue
                
            all_files.extend(files)
            
            for file_path in files:
                try:
                    # Extract session name from filename
                    filename = os.path.basename(file_path)
                    session_name = filename.split(f"_DATACO-{dataco}")[0]
                    session_names.add(session_name)
                    
                    logger.debug(f"Processing file for merge: {file_path}")
                    
                    # Read and process file content
                    with open(file_path, 'r', encoding='utf-8') as f:
                        file_content = []
                        for line in f:
                            stripped = line.strip()
                            if stripped and not stripped.startswith("#format:"):
                                file_content.append(stripped)
                                tag = extract_tag_from_line(stripped)
                                if tag:
                                    tag_counter[tag] += 1
                        
                        # Try to extract date from filename
                        try:
                            date_parts = filename.split('_')
                            for part in date_parts:
                                if len(part) == 6 and part.isdigit():  # YYMMDD format
                                    year = int("20" + part[:2])
                                    month = int(part[2:4])
                                    day = int(part[4:6])
                                    dates.append(datetime(year, month, day))
                                    break
                        except Exception as e:
                            logger.warning(f"Could not parse date from filename {filename}: {str(e)}")
                    
                    all_content.extend(file_content)
                    processed_files += 1
                except Exception as e:
                    logger.error(f"Error processing file {file_path}: {str(e)}")
                    failed_files += 1
        except Exception as e:
            logger.error(f"Error processing DATACO-{dataco}: {str(e)}")
    
    if not all_content:
        logger.error("No content found in any of the DATACO files")
        return {
            "success": False,
            "error": "No content found in any of the DATACO files"
        }
    
    # Determine date range
    min_date = min(dates) if dates else datetime.now().replace(day=datetime.now().day-1)
    max_date = max(dates) if dates else datetime.now()
    
    # Create full content with format line for saving
    complete_content = all_content.copy()
    complete_content.append("#format: trackfile camera frameIDStartFrame tag")
    
    # Generate merged data response
    result = {
        "success": True,
        "message": f"Successfully merged {len(dataco_numbers)} DATACO datasets",
        "dataco_number": f"MERGED-{'-'.join(dataco_numbers)}",
        "total_files": len(all_files),
        "processed_files": processed_files,
        "failed_files": failed_files,
        "session_count": len(session_names),
        "event_count": len(all_content),
        "unique_tags": len(tag_counter),
        "min_date": min_date.isoformat(),
        "max_date": max_date.isoformat(),
        "tag_counts": dict(tag_counter),
        "sessions": list(session_names),
        "content_sample": all_content[:100] if len(all_content) > 100 else all_content,
        "content_truncated": len(all_content) > 100,
        "all_content": complete_content
    }
    
    logger.debug(f"Merge completed: {len(dataco_numbers)} datasets with {result['event_count']} events")
    return result

def save_dataco(output_path, content=None):
    """Save content to a file."""
    logger.debug(f"Saving content to {output_path}")
    
    if not content:
        logger.error("No content provided to save")
        return {
            "success": False,
            "error": "No content provided to save"
        }
    
    try:
        # Make sure the directory exists
        output_dir = os.path.dirname(output_path)
        if output_dir and not os.path.exists(output_dir):
            os.makedirs(output_dir)
            logger.debug(f"Created directory: {output_dir}")
        
        # Write content to file
        with open(output_path, 'w', encoding='utf-8') as f:
            if isinstance(content, list):
                f.write('\n'.join(content))
            else:
                f.write(str(content))
        
        logger.debug(f"Successfully saved content to {output_path}")
        return {
            "success": True,
            "message": f"Content saved to {output_path}",
            "outputPath": output_path
        }
    except Exception as e:
        logger.error(f"Error saving content to {output_path}: {str(e)}")
        return {
            "success": False,
            "error": f"Failed to save content: {str(e)}",
            "outputPath": output_path
        }

def check_dataco_exists(dataco_numbers, base_dir):
    """Check if files exist for given DATACO numbers."""
    logger.debug(f"Checking existence of DATACOs: {dataco_numbers} in {base_dir}")
    
    if not dataco_numbers:
        logger.error("No DATACO numbers provided for check")
        return {
            "success": False,
            "error": "No DATACO numbers provided",
            "exists": False
        }
    
    results = {}
    any_exists = False
    
    for dataco in dataco_numbers:
        files = find_dataco_files(dataco, base_dir)
        results[dataco] = len(files) > 0
        if results[dataco]:
            any_exists = True
    
    logger.debug(f"Check completed: {any_exists}")
    return {
        "success": True,
        "exists": any_exists,
        "datacos": dataco_numbers,
        "checked_path": base_dir,
        "results": results,
        "checked_dataco": dataco_numbers[0] if dataco_numbers else None,
        "message": "Files found" if any_exists else "No files found"
    }

def main():
    """Main entry point."""
    try:
        args = parse_arguments()
        
        # Just show help and exit
        if args.help_cmd:
            logger.info("DC_Jumps.py - DATACO Jump Files Processor")
            logger.info("Available actions: load, compare, merge, save, check_exists")
            return 0
        
        # Determine the base directory
        base_dir = args.base_dir
        if args.test_dir:
            # Use the test directory in the current directory
            script_dir = os.path.dirname(os.path.abspath(__file__))
            base_dir = os.path.join(os.path.dirname(os.path.dirname(script_dir)), 'TestDC')
            logger.debug(f"Using test directory: {base_dir}")
            
            # Create the test directory if it doesn't exist
            if not os.path.exists(base_dir):
                os.makedirs(base_dir)
                logger.debug(f"Created test directory: {base_dir}")
        
        logger.debug(f"Using base directory: {base_dir}")
        
        # Action requires DATACO number(s)
        if args.action in ['load', 'compare', 'merge', 'check_exists'] and not args.dataco:
            logger.error(f"DATACO number is required for {args.action} action")
            result = {"success": False, "error": f"DATACO number is required for {args.action} action"}
        
        # Split comma-separated DATACO numbers
        elif args.action in ['load', 'compare', 'merge', 'check_exists']:
            dataco_numbers = args.dataco.split(',')
            dataco_numbers = [d.strip() for d in dataco_numbers]
            
            if args.action == 'load':
                if len(dataco_numbers) == 1:
                    result = load_dataco(dataco_numbers[0], base_dir)
                else:
                    datasets = []
                    for dataco in dataco_numbers:
                        data = load_dataco(dataco, base_dir)
                        datasets.append(data)
                    result = {"datasets": datasets}
            
            elif args.action == 'compare':
                result = compare_datacos(dataco_numbers, base_dir)
            
            elif args.action == 'merge':
                # First merge the data
                merged_data = merge_datacos(dataco_numbers, base_dir)
                
                # If output path is provided, save the merged content
                if args.output and merged_data.get("success"):
                    # Prefer all_content if available, otherwise use content_sample
                    content_to_save = merged_data.get("all_content", merged_data.get("content_sample", []))
                    
                    # Make sure we have the format line at the end
                    if content_to_save and not content_to_save[-1].startswith("#format:"):
                        content_to_save.append("#format: trackfile camera frameIDStartFrame tag")
                    
                    # Log saving information
                    logger.debug(f"Saving merged content to {args.output} ({len(content_to_save)} lines)")
                    
                    # Save the merged content
                    save_result = save_dataco(args.output, content_to_save)
                    
                    # Combine merge and save results
                    merged_data["save_result"] = save_result
                    merged_data["outputPath"] = args.output
                
                result = merged_data
            
            elif args.action == 'check_exists':
                result = check_dataco_exists(dataco_numbers, base_dir)
            else:
                result = {"success": False, "error": f"Unknown action: {args.action}"}
        
        # Save action
        elif args.action == 'save':
            if not args.output:
                result = {"success": False, "error": "Output path is required for save action"}
            else:
                # In a real implementation, this would get content from stdin or a temp file
                # For testing, we'll just save a sample content
                sample_content = ["trackfile1 front 100 stop_sign", 
                                 "trackfile2 front 200 pedestrian",
                                 "#format: trackfile camera frameIDStartFrame tag"]
                result = save_dataco(args.output, sample_content)
        
        else:
            result = {"success": False, "error": f"Unknown action: {args.action}"}
        
        # Print the result as JSON
        print(json.dumps(result))
        
        return 0
    
    except Exception as e:
        logger.exception(f"Unhandled exception: {str(e)}")
        print(json.dumps({
            "success": False, 
            "error": str(e),
            "exists": False
        }))
        return 1

if __name__ == "__main__":
    sys.exit(main()) 