@echo off
echo ========================================
echo Dashboard Management System Setup
echo ========================================
echo.

echo Setting up Backend...
cd backend
echo Installing Python dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo Error: Failed to install Python dependencies
    pause
    exit /b 1
)
echo Backend setup complete!
echo.

echo Setting up Frontend...
cd ..\frontend
echo Installing Node.js dependencies...
npm install
if %errorlevel% neq 0 (
    echo Error: Failed to install Node.js dependencies
    pause
    exit /b 1
)
echo Frontend setup complete!
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo To start the system:
echo 1. Run start_backend.bat to start the Flask server
echo 2. Run start_frontend.bat to start the React app
echo 3. Open http://localhost:3000 in your browser
echo.
echo Sample users:
echo - Username: manager, Password: password123 (Manager)
echo - Username: john, Password: password123 (User)
echo - Username: jane, Password: password123 (User)
echo.
pause 