@echo off
REM Library Management System - Startup Script for Windows
REM Save this as "START.bat" in the project root directory
REM Double-click to run

setlocal enabledelayedexpansion

echo.
echo ======================================
echo Library Management System - Startup
echo ======================================
echo.

REM Check Python installation
echo Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8 or higher from python.org
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('python --version 2^>^&1') do set PYTHON_VER=%%i
echo Found: %PYTHON_VER%
echo.

REM Get current directory
echo Project directory: %cd%
echo.

REM Install dependencies
echo Installing dependencies...
pip install -q -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo Dependencies installed successfully!
echo.

REM Initialize database
echo Initializing database...
cd backend
python init_db.py
if errorlevel 1 (
    echo ERROR: Failed to initialize database
    pause
    exit /b 1
)
echo Database initialized successfully!
echo.

REM Display next steps
echo ======================================
echo ✓ System Ready! Starting Flask...
echo ======================================
echo.
echo The application will start on:
echo http://localhost:5000
echo.
echo Open this URL in your browser.
echo Press Ctrl+C to stop the server.
echo.

REM Start Flask
echo Starting Flask server...
python app.py

pause
