#!/bin/bash

echo "🚀 Starting EcoPower EaaS Platform..."
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local file not found!"
    echo "Please create .env.local with your MongoDB URI"
    echo ""
    echo "Example:"
    echo "MONGODB_URI=your_mongodb_connection_string"
    echo "PAYMENT_GATEWAY_SECRET=test_secret_key"
    echo "PAYMENT_GATEWAY_MODE=test"
    exit 1
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Ask if user wants to seed database
echo "🌱 Do you want to seed the database? (y/n)"
read -r seed_choice

if [ "$seed_choice" = "y" ] || [ "$seed_choice" = "Y" ]; then
    echo "🌱 Seeding database with complete data..."
    npm run seed:complete
    echo ""
fi

echo "🔧 Starting backend server..."
npm run server &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

echo "🎨 Starting frontend..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Platform is starting!"
echo ""
echo "📡 Backend: http://localhost:5005"
echo "🎨 Frontend: http://localhost:3000"
echo ""
echo "🔐 Test Credentials:"
echo "   Admin: admin@ecopower.com / password123"
echo "   Enterprise: vikram@techcorp.in / password123"
echo "   Consumer: rahul.sharma@gmail.com / password123"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for user interrupt
trap "echo ''; echo '🛑 Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
