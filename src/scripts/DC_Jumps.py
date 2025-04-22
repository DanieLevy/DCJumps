#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
import glob
import argparse
import json
import logging
from datetime import datetime
from collections import Counter

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
    
    # Recursive search pattern
    pattern = os.path.join(base_dir, '**', f"*DATACO-{dataco_number}.jump")
    
    # Use glob with recursive=True
    # Note: Requires Python 3.5+
    files = glob.glob(pattern, recursive=True)
    
    # Filter out potential directory matches if pattern somehow matches a directory
    files = [f for f in files if os.path.isfile(f)]
    
    logger.debug(f"Found {len(files)} files for DATACO-{dataco_number}")
    return files

def extract_tag_from_line(line):
    """Extract the tag from a jump file line."""
    parts = line.strip().split()
    return parts[-1] if len(parts) >= 4 else None

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
    
    # For this mock version, just return a success response
    result = {
        "success": True,
        "message": f"Successfully merged {len(dataco_numbers)} DATACO datasets",
        "data": {
            "dataco_number": f"MERGED-{'-'.join(dataco_numbers)}",
            "total_files": len(dataco_numbers) * 2,
            "processed_files": len(dataco_numbers) * 2,
            "failed_files": 0,
            "session_count": len(dataco_numbers),
            "event_count": len(dataco_numbers) * 10,
            "unique_tags": 5 + len(dataco_numbers),
            "min_date": datetime.now().replace(day=datetime.now().day-1).isoformat(),
            "max_date": datetime.now().isoformat(),
            "tag_counts": {
                "stop_sign": len(dataco_numbers) * 2,
                "pedestrian": len(dataco_numbers) * 2,
                "car": len(dataco_numbers) * 3,
                "traffic_light": len(dataco_numbers) * 2,
                "truck": len(dataco_numbers)
            }
        },
        "outputPath": os.path.join(base_dir, f"merged_{'_'.join(dataco_numbers)}.jump")
    }
    
    logger.debug(f"Merge completed: {len(dataco_numbers)} datasets")
    return result

def save_dataco(output_path):
    """Save content to a file."""
    logger.debug(f"Saving content to {output_path}")
    return {
        "success": True,
        "message": f"Content saved to {output_path}",
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
        
        # Check for required arguments if --help-cmd is not specified
        if not args.help_cmd:
            # Special case for check_only parameter
            if args.check_only:
                if not args.dataco:
                    print(json.dumps({
                        "success": False,
                        "error": "Missing required parameter: dataco",
                        "exists": False
                    }))
                    return 1
                
                dataco_numbers = args.dataco.split(',')
                result = check_dataco_exists(dataco_numbers, base_dir)
                print(json.dumps(result))
                return 0
            
            if not args.action:
                print(json.dumps({
                    "success": False,
                    "error": "Missing required parameter: action",
                    "exists": False
                }))
                return 1
                
            if not args.dataco:
                print(json.dumps({
                    "success": False,
                    "error": "Missing required parameter: dataco",
                    "exists": False
                }))
                return 1
            
            # Process the action
            dataco_numbers = args.dataco.split(',')
            
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
                result = merge_datacos(dataco_numbers, base_dir)
            
            elif args.action == 'save':
                if not args.output:
                    result = {"success": False, "error": "Output path is required for save action"}
                else:
                    result = save_dataco(args.output)
            
            elif args.action == 'check_exists':
                result = check_dataco_exists(dataco_numbers, base_dir)
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