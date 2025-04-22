# JUMPAPP - DATACO Jump Files Processor

A web application using Next.js and Express to analyze and process DATACO jump files via a Python script.

## Prerequisites

- Node.js >= 14.0.0
- Python 3.x (Ensure it's in your system's PATH or create a `.python-command` file in the root directory containing the command to run Python, e.g., `python3` or the full path to the executable)
- npm

## Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd JUMPAPP 
    ```

2.  **Install Node.js dependencies:**
    ```bash
    npm install
    ```

3.  **Prepare Data (Optional):**
    *   Place your DATACO jump files (`*DATACO-*.jump`) in a base directory. The default expected location is `/mobileye/DC/Voice_Tagging/`, but you can specify a different path in the application UI.
    *   For testing without real data, create a `TestDC` directory in the project root and place some sample `.jump` files there. The app can use this directory in debug mode.

## Running the Application

### Development Mode

Starts the application with hot-reloading enabled.

```bash
npm run dev
```

The application will be available at http://localhost:3000.

### Production Mode

Builds the Next.js frontend and starts the production server.

```bash
npm run start:prod
```

This command first runs `npm run build` and then `npm start`. The application will be available at http://localhost:3000.

## How it Works

- The Next.js/Express server (`server.js`) handles frontend requests and provides an API endpoint (`/api/python`).
- When the frontend calls the API, `server.js` executes the Python script (`src/scripts/DC_Jumps.py`) using `child_process.spawn`.
- The Python script processes the specified DATACO files based on the requested action (load, compare, merge, save) and returns results as JSON.
- The server reads the specific Python command to use from the `.python-command` file if it exists, otherwise defaults to `python`.

## Troubleshooting

- **Python Errors:** Ensure Python 3.x is installed and accessible via the command specified (either `python` or the content of `.python-command`). Check the console output from `npm run dev` or `npm run start:prod` for specific errors from the Python script (`stderr`).
- **File Not Found:** Verify the base directory path provided in the UI is correct and contains the expected DATACO jump files.

## License

[Specify Your License Here, e.g., MIT] 