# Library Management System - Startup Script for Windows

# Save this file as "START.ps1" in the project root directory
# Run it with: powershell -ExecutionPolicy Bypass -File START.ps1

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Library Management System - Startup" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check Python installation
Write-Host "Checking Python installation..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
Write-Host "Found: $pythonVersion" -ForegroundColor Green
Write-Host ""

# Check if in correct directory
$projectRoot = Get-Location
Write-Host "Project directory: $projectRoot" -ForegroundColor Green
Write-Host ""

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
pip install -q -r requirements.txt
Write-Host "Dependencies installed successfully!" -ForegroundColor Green
Write-Host ""

# Initialize database
Write-Host "Initializing database..." -ForegroundColor Yellow
Set-Location backend
python init_db.py
Write-Host "Database initialized successfully!" -ForegroundColor Green
Write-Host ""

# Display next steps
Write-Host "======================================" -ForegroundColor Green
Write-Host "✅ System Ready! Starting Flask..." -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "The application will start on: " -ForegroundColor Cyan -NoNewline
Write-Host "http://localhost:5000" -ForegroundColor White
Write-Host ""
Write-Host "Open this URL in your browser." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop the server." -ForegroundColor Yellow
Write-Host ""

# Start Flask
Write-Host "Starting Flask server..." -ForegroundColor Green
python app.py
