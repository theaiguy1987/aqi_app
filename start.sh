#!/bin/bash

echo "================================"
echo "AQI Calculator - Quick Start"
echo "================================"
echo ""

# Get the directory where the script is located
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo "Setting up environment files..."
# Create backend .env if it doesn't exist
if [ ! -f "backend/.env" ]; then
    echo "Creating backend/.env from example..."
    cp backend/.env.example backend/.env
fi

# Create frontend .env if it doesn't exist
if [ ! -f "frontend/.env" ]; then
    echo "Creating frontend/.env from example..."
    cp frontend/.env.example frontend/.env
fi

echo "Setting up Python virtual environment..."
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
fi

echo "Activating virtual environment..."
source .venv/bin/activate

echo "Installing backend dependencies..."
pip install -r backend/requirements.txt

echo ""
echo "Starting backend server..."
(cd backend && python main.py) &
BACKEND_PID=$!

echo ""
echo "Setting up Frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo ""
echo "Starting frontend server..."
npm run dev &
FRONTEND_PID=$!

cd "$PROJECT_ROOT"

echo ""
echo "================================"
echo "Setup Complete!"
echo "================================"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
