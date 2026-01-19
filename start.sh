#!/bin/bash
# LuxeBrain AI - Start All Services
# Copyright (c) 2024 Paksa IT Solutions

echo "========================================"
echo " LuxeBrain AI - Starting All Services"
echo "========================================"
echo ""

# Check if Redis is running
echo "[1/4] Checking Redis..."
if ! redis-cli ping > /dev/null 2>&1; then
    echo "Redis not running. Please start Redis first."
    echo "Run: redis-server"
    exit 1
fi
echo "Redis: OK"

# Start Backend API
echo ""
echo "[2/4] Starting Backend API (Port 8000)..."
python -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
sleep 3

# Start Frontend Apps
echo ""
echo "[3/4] Starting Frontend Apps..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..
sleep 3

echo ""
echo "[4/4] All services started!"
echo ""
echo "========================================"
echo " Access URLs:"
echo "========================================"
echo " Backend API:    http://localhost:8000"
echo " API Docs:       http://localhost:8000/docs"
echo " Tenant App:     http://localhost:3000"
echo " Admin App:      http://localhost:3001"
echo " Marketing:      http://localhost:3002"
echo "========================================"
echo ""
echo "Press Ctrl+C to stop all services..."

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'All services stopped.'; exit" INT
wait
