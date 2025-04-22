# JUMPAPP - DATACO Jump Files Processor

A web application using Next.js and Express to analyze and process DATACO jump files via a Python script.

## Prerequisites

- Node.js >= 14.0.0
- Python 3.x (available in your PATH or configured via `.python-command`)
- npm

## Setup and Installation

Quick setup with a single command:

```bash
npm run setup
```

This command:
1. Installs all Node.js dependencies
2. Creates a default `.python-command` file using "python" as the command

If you need to use a different Python command (like `python3` or a full path), edit the `.python-command` file.

## Running the Application

### One-Command Development Mode

```bash
npm run dev
```

The application will be available at http://localhost:3000.

### One-Command Production Mode

```bash
npm run start:prod
```

This builds the Next.js frontend and starts the production server.

## Data Directory Setup

- **Default Path:** The application looks for DATACO jump files in `/mobileye/DC/Voice_Tagging/`
- **Test Data:** For testing, place sample `.jump` files in the `TestDC` directory

## How it Works

- The Next.js/Express server (`server.js`) serves the frontend and provides API endpoints
- The server executes the Python script (`src/scripts/DC_Jumps.py`) to process DATACO files
- The Python script reads jump files and returns analysis results as JSON

## Troubleshooting

- **Python Not Found:** Ensure Python is installed and properly referenced in the `.python-command` file
- **No Data Found:** Verify that your data is in either the default directory or the TestDC directory
- **Server Not Starting:** Check console output for specific error messages

## License

[Specify Your License Here, e.g., MIT] 