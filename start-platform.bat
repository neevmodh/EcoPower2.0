@echo off
echo.
echo 🚀 Starting EcoPower EaaS Platform...
echo.

REM Check if .env.local exists
if not exist .env.local (
    echo ❌ Error: .env.local file not found!
    echo Please create .env.local with your MongoDB URI
    echo.
    echo Example:
    echo MONGODB_URI=your_mongodb_connection_string
    echo PAYMENT_GATEWAY_SECRET=test_secret_key
    echo PAYMENT_GATEWAY_MODE=test
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist node_modules (
    echo 📦 Installing dependencies...
    call npm install
    echo.
)

REM Ask if user wants to seed database
set /p seed_choice="🌱 Do you want to seed the database? (y/n): "

if /i "%seed_choice%"=="y" (
    echo 🌱 Seeding database with complete data...
    call npm run seed:complete
    echo.
)

echo 🔧 Starting backend server...
start "EcoPower Backend" cmd /k npm run server

REM Wait for backend to start
timeout /t 3 /nobreak > nul

echo 🎨 Starting frontend...
start "EcoPower Frontend" cmd /k npm run dev

echo.
echo ✅ Platform is starting!
echo.
echo 📡 Backend: http://localhost:5005
echo 🎨 Frontend: http://localhost:3000
echo.
echo 🔐 Test Credentials:
echo    Admin: admin@ecopower.com / password123
echo    Enterprise: vikram@techcorp.in / password123
echo    Consumer: rahul.sharma@gmail.com / password123
echo.
echo Close the terminal windows to stop services
echo.
pause
