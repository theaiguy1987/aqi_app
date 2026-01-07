@echo off
echo ================================
echo AQI Calculator - Quick Start
echo ================================
echo.

REM Get the directory where the script is located
set "PROJECT_ROOT=%~dp0"
cd /d "%PROJECT_ROOT%"

echo Setting up Python virtual environment...
if not exist .venv (
    echo Creating virtual environment...
    python -m venv .venv
)

echo Activating virtual environment...
call .venv\Scripts\activate

echo Installing backend dependencies...
pip install -r backend\requirements.txt

echo.
echo Starting backend server...
start cmd /k "cd /d %PROJECT_ROOT%backend && %PROJECT_ROOT%.venv\Scripts\activate && python main.py"

echo.
echo Setting up Frontend...
cd frontend
if not exist node_modules (
    echo Installing frontend dependencies...
    npm install
)

echo.
echo Starting frontend server...
start cmd /k "cd /d %PROJECT_ROOT%frontend && npm run dev"

cd /d "%PROJECT_ROOT%"

echo.
echo ================================
echo Setup Complete!
echo ================================
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8000/docs
echo.
echo Press any key to exit...
pause > nul
