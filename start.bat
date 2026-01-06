@echo off
echo ================================
echo AQI Calculator - Quick Start
echo ================================
echo.

echo Setting up Backend...
cd backend
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate

echo Installing backend dependencies...
pip install -r requirements.txt

echo.
echo Starting backend server...
start cmd /k "cd /d %CD% && venv\Scripts\activate && python main.py"

cd ..

echo.
echo Setting up Frontend...
cd frontend
if not exist node_modules (
    echo Installing frontend dependencies...
    npm install
)

echo.
echo Starting frontend server...
start cmd /k "cd /d %CD% && npm run dev"

cd ..

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
