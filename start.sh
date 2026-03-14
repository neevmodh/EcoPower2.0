#!/bin/bash

echo "🚀 Starting EcoPower 2.0..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if database is seeded
echo "🌱 Checking database..."
echo "If this is your first time, run: npm run seed"
echo ""

# Start backend server in background
echo "⚡ Starting backend server on port 5005..."
npm run server &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
echo "🎨 Starting Next.js frontend on port 3000..."
npm run dev

# Cleanup on exit
trap "kill $BACKEND_PID 2>/dev/null" EXIT
