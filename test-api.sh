#!/bin/bash

echo "🧪 Testing EcoPower 2.0 API Endpoints"
echo "======================================"
echo ""

BASE_URL="http://localhost:5005"

# Test health check
echo "1. Health Check:"
curl -s "$BASE_URL/api/health" | head -5
echo -e "\n"

# Test login
echo "2. Admin Login:"
ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/users/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@instinct.com","password":"admin@123"}')
ADMIN_ID=$(echo $ADMIN_RESPONSE | grep -o '"userId":"[^"]*"' | cut -d'"' -f4)
echo "Admin ID: $ADMIN_ID"
echo ""

echo "3. Consumer Login:"
CONSUMER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/users/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"rahul.sharma@gmail.com","password":"admin@123"}')
CONSUMER_ID=$(echo $CONSUMER_RESPONSE | grep -o '"userId":"[^"]*"' | cut -d'"' -f4)
echo "Consumer ID: $CONSUMER_ID"
echo ""

echo "4. Enterprise Login:"
ENT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/users/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"vikram@techpark.in","password":"admin@123"}')
ENT_ID=$(echo $ENT_RESPONSE | grep -o '"userId":"[^"]*"' | cut -d'"' -f4)
echo "Enterprise ID: $ENT_ID"
echo ""

# Test data endpoints
echo "5. Fetching Plans:"
curl -s "$BASE_URL/api/plans" | head -10
echo -e "\n"

echo "6. Fetching Consumer Devices:"
curl -s "$BASE_URL/api/devices?userId=$CONSUMER_ID&role=Consumer" | head -10
echo -e "\n"

echo "7. Fetching Consumer Telemetry:"
curl -s "$BASE_URL/api/telemetry/dashboard?userId=$CONSUMER_ID&role=Consumer" | head -10
echo -e "\n"

echo "8. Fetching Consumer Invoices:"
curl -s "$BASE_URL/api/invoices?userId=$CONSUMER_ID&role=Consumer" | head -10
echo -e "\n"

echo "9. Fetching Consumer Carbon Stats:"
curl -s "$BASE_URL/api/carbon?userId=$CONSUMER_ID&role=Consumer" | head -10
echo -e "\n"

echo "10. Fetching Consumer Notifications:"
curl -s "$BASE_URL/api/notifications?userId=$CONSUMER_ID" | head -10
echo -e "\n"

echo "✅ API Test Complete!"
