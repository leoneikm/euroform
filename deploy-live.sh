#!/bin/bash

# Euroform Live Deployment Script
# This script prevents common deployment issues by automating the full deployment process

set -e  # Exit on any error

echo "🚀 Starting Euroform Live Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP="162.55.59.244"
SERVER_USER="root"
LOCAL_CLIENT_DIR="./client"
LOCAL_SERVER_DIR="./server"
REMOTE_FRONTEND_DIR="/var/www/html"
REMOTE_BACKEND_DIR="/var/www/euroform-api"

echo -e "${YELLOW}📋 Deployment Configuration:${NC}"
echo "  Server: $SERVER_USER@$SERVER_IP"
echo "  Frontend: $REMOTE_FRONTEND_DIR"
echo "  Backend: $REMOTE_BACKEND_DIR"
echo ""

# Step 1: Build Frontend
echo -e "${YELLOW}🔨 Building Frontend...${NC}"
cd $LOCAL_CLIENT_DIR
npm run build
cd ..
echo -e "${GREEN}✅ Frontend built successfully${NC}"

# Step 2: Deploy Frontend
echo -e "${YELLOW}📤 Deploying Frontend...${NC}"
scp -r $LOCAL_CLIENT_DIR/dist/* $SERVER_USER@$SERVER_IP:$REMOTE_FRONTEND_DIR/
echo -e "${GREEN}✅ Frontend deployed${NC}"

# Step 3: Deploy Backend
echo -e "${YELLOW}📤 Deploying Backend...${NC}"
scp -r $LOCAL_SERVER_DIR/* $SERVER_USER@$SERVER_IP:$REMOTE_BACKEND_DIR/
echo -e "${GREEN}✅ Backend files deployed${NC}"

# Step 4: Ensure .env file exists with correct configuration
echo -e "${YELLOW}⚙️  Configuring Backend Environment...${NC}"
ssh $SERVER_USER@$SERVER_IP << 'EOF'
# Create .env file with required configuration
cat > /var/www/euroform-api/.env << 'ENVEOF'
NODE_ENV=production
PORT=3001
VITE_SUPABASE_URL=https://cxwldnvgajfjucvghtyv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4d2xkbnZnYWpmanVjdmdodHl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxOTU0NTksImV4cCI6MjA3Mzc3MTQ1OX0.qhtfIawjBBZuWpZVNrYo-bFPT48C8qCw5Dy2-zk7noU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4d2xkbnZnYWpmanVjdmdodHl2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE5NTQ1OSwiZXhwIjoyMDczNzcxNDU5fQ.AlvHV4unqdNS9AbCPiNiH6ypemOzSiMWsXCkstn4yQY
ENVEOF
echo "✅ Environment configuration updated"
EOF
echo -e "${GREEN}✅ Backend environment configured${NC}"

# Step 5: Restart Backend Service
echo -e "${YELLOW}🔄 Restarting Backend Service...${NC}"
ssh $SERVER_USER@$SERVER_IP << 'EOF'
# Restart PM2 service
pm2 restart euroform-api || pm2 start /var/www/euroform-api/index.js --name euroform-api
pm2 save
echo "✅ Backend service restarted"
EOF
echo -e "${GREEN}✅ Backend service restarted${NC}"

# Step 6: Verify Services
echo -e "${YELLOW}🔍 Verifying Deployment...${NC}"
sleep 3  # Give services time to start

# Test backend health
echo "Testing backend health..."
HEALTH_RESPONSE=$(ssh $SERVER_USER@$SERVER_IP "curl -s https://app.euroform.io/api/health")
if [[ $HEALTH_RESPONSE == *"healthy"* ]]; then
    echo -e "${GREEN}✅ Backend health check passed${NC}"
else
    echo -e "${RED}❌ Backend health check failed: $HEALTH_RESPONSE${NC}"
    exit 1
fi

# Test manage endpoint
echo "Testing manage endpoint..."
MANAGE_RESPONSE=$(ssh $SERVER_USER@$SERVER_IP "curl -s 'https://app.euroform.io/api/forms/0f76e2f2-b2d8-41c9-ae64-3158d4087611?manage=true'")
if [[ $MANAGE_RESPONSE == *"euroform contact"* ]]; then
    echo -e "${GREEN}✅ Manage endpoint test passed${NC}"
else
    echo -e "${RED}❌ Manage endpoint test failed: $MANAGE_RESPONSE${NC}"
    exit 1
fi

# Step 7: Clear browser cache headers (force reload)
echo -e "${YELLOW}🧹 Updating cache headers...${NC}"
ssh $SERVER_USER@$SERVER_IP << 'EOF'
# Restart nginx to ensure cache headers are applied
systemctl reload nginx
echo "✅ Nginx cache headers updated"
EOF

echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo -e "${YELLOW}📝 Deployment Summary:${NC}"
echo "  ✅ Frontend built and deployed"
echo "  ✅ Backend deployed with correct configuration"
echo "  ✅ Environment variables configured"
echo "  ✅ Services restarted and verified"
echo "  ✅ API endpoints tested"
echo "  ✅ Cache headers updated"
echo ""
echo -e "${GREEN}🌐 Your site is live at: https://app.euroform.io${NC}"
echo ""
echo -e "${YELLOW}💡 Tips for future deployments:${NC}"
echo "  - Always run this script for deployments to avoid issues"
echo "  - Check PM2 logs if issues occur: ssh root@$SERVER_IP 'pm2 logs euroform-api'"
echo "  - Monitor server health: https://app.euroform.io/api/health"
