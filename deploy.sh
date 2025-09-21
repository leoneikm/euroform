#!/bin/bash

# Euroform Deployment Script
# Update these variables with your server details

SERVER_IP="YOUR_SERVER_IP"
SERVER_USER="root"  # or your username
FRONTEND_PATH="/var/www/euroform"
BACKEND_PATH="/var/www/euroform-api"
PM2_APP_NAME="euroform-api"

echo "🚀 Starting Euroform deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if variables are set
if [ "$SERVER_IP" = "YOUR_SERVER_IP" ]; then
    print_error "Please update SERVER_IP in deploy.sh with your actual server IP"
    exit 1
fi

# Build frontend (already done, but ensuring it's fresh)
echo "🔨 Building frontend..."
cd client && npm run build
if [ $? -eq 0 ]; then
    print_status "Frontend built successfully"
else
    print_error "Frontend build failed"
    exit 1
fi
cd ..

# Create deployment archive
echo "📦 Creating deployment package..."
tar -czf euroform-deployment.tar.gz \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='client/node_modules' \
    --exclude='server/node_modules' \
    --exclude='client/src' \
    --exclude='client/public' \
    --exclude='client/index.html' \
    --exclude='client/vite.config.js' \
    --exclude='client/package*.json' \
    --exclude='client/README.md' \
    --exclude='client/dist/assets/*.map' \
    client/dist server package.json

print_status "Deployment package created"

# Upload to server
echo "📤 Uploading to server..."
scp euroform-deployment.tar.gz $SERVER_USER@$SERVER_IP:/tmp/

if [ $? -eq 0 ]; then
    print_status "Files uploaded successfully"
else
    print_error "Upload failed"
    exit 1
fi

# Deploy on server
echo "🔧 Deploying on server..."
ssh $SERVER_USER@$SERVER_IP << 'EOF'
    # Colors for remote output
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    NC='\033[0m'

    echo -e "${GREEN}Starting server deployment...${NC}"

    # Extract files
    cd /tmp
    tar -xzf euroform-deployment.tar.gz

    # Backup existing deployment (if exists)
    if [ -d "/var/www/euroform" ]; then
        echo -e "${YELLOW}Backing up existing frontend...${NC}"
        sudo mv /var/www/euroform /var/www/euroform.backup.$(date +%Y%m%d_%H%M%S)
    fi

    if [ -d "/var/www/euroform-api" ]; then
        echo -e "${YELLOW}Backing up existing backend...${NC}"
        sudo mv /var/www/euroform-api /var/www/euroform-api.backup.$(date +%Y%m%d_%H%M%S)
    fi

    # Create directories
    sudo mkdir -p /var/www/euroform
    sudo mkdir -p /var/www/euroform-api

    # Deploy frontend
    echo -e "${GREEN}Deploying frontend...${NC}"
    sudo cp -r client/dist/* /var/www/euroform/

    # Deploy backend
    echo -e "${GREEN}Deploying backend...${NC}"
    sudo cp -r server/* /var/www/euroform-api/
    sudo cp package.json /var/www/euroform-api/

    # Set permissions
    sudo chown -R www-data:www-data /var/www/euroform
    sudo chown -R $USER:$USER /var/www/euroform-api

    # Install backend dependencies
    echo -e "${GREEN}Installing backend dependencies...${NC}"
    cd /var/www/euroform-api
    npm install --production

    # Restart PM2 application
    echo -e "${GREEN}Restarting application...${NC}"
    if pm2 list | grep -q "euroform-api"; then
        pm2 restart euroform-api
        echo -e "${GREEN}Application restarted${NC}"
    else
        echo -e "${YELLOW}Starting application for the first time...${NC}"
        pm2 start index.js --name "euroform-api"
        pm2 save
        echo -e "${GREEN}Application started${NC}"
    fi

    # Cleanup
    rm -rf /tmp/client /tmp/server /tmp/package.json /tmp/euroform-deployment.tar.gz

    echo -e "${GREEN}Deployment completed successfully!${NC}"
EOF

if [ $? -eq 0 ]; then
    print_status "Deployment completed successfully!"
    
    echo ""
    echo "🎉 Deployment Summary:"
    echo "   Frontend: Deployed to $FRONTEND_PATH"
    echo "   Backend:  Deployed to $BACKEND_PATH"
    echo "   PM2 App:  $PM2_APP_NAME"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Check PM2 status: ssh $SERVER_USER@$SERVER_IP 'pm2 status'"
    echo "   2. View logs: ssh $SERVER_USER@$SERVER_IP 'pm2 logs $PM2_APP_NAME'"
    echo "   3. Test your application at: http://$SERVER_IP"
    echo ""
    
else
    print_error "Deployment failed"
    exit 1
fi

# Cleanup local files
rm -f euroform-deployment.tar.gz
print_status "Cleanup completed"

echo ""
print_status "All done! 🚀"
