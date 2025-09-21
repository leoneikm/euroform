#!/bin/bash

# 🚀 Euroform Auto-Deploy Script
# Run this ONCE on your server, then just git push to deploy!

echo "🚀 Setting up auto-deploy for Euroform..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get GitHub repo URL from user
echo -e "${BLUE}What's your GitHub repository URL?${NC}"
echo "Example: https://github.com/yourusername/euroform.git"
read -p "GitHub URL: " GITHUB_URL

if [ -z "$GITHUB_URL" ]; then
    echo "❌ GitHub URL is required!"
    exit 1
fi

# Install basic requirements
echo "📦 Installing requirements..."
sudo apt update
sudo apt install -y git nodejs npm nginx

# Install PM2
sudo npm install -g pm2

# Clone repository
echo "📥 Cloning repository..."
cd /var/www
sudo rm -rf euroform-live
sudo git clone $GITHUB_URL euroform-live
sudo chown -R $USER:$USER euroform-live

# Setup directories
cd euroform-live
sudo mkdir -p /var/www/html

# Install dependencies and build
echo "🔨 Building application..."
cd client && npm install && npm run build
cd ../server && npm install --production

# Copy frontend to web directory
sudo cp -r ../client/dist/* /var/www/html/

# Start backend with PM2
pm2 start server/index.js --name "euroform"
pm2 startup
pm2 save

# Create webhook script for auto-deploy
sudo tee /var/www/deploy-webhook.sh > /dev/null << EOF
#!/bin/bash
cd /var/www/euroform-live
git pull origin main

# Build frontend
cd client
npm install
npm run build
sudo cp -r dist/* /var/www/html/

# Update backend
cd ../server
npm install --production
pm2 restart euroform

echo "✅ Auto-deploy completed at \$(date)"
EOF

sudo chmod +x /var/www/deploy-webhook.sh

# Create simple Nginx config
sudo tee /etc/nginx/sites-available/default > /dev/null << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    root /var/www/html;
    index index.html;
    
    server_name _;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 10M;
    }
}
EOF

sudo systemctl reload nginx

# Create cron job for auto-deploy (checks every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * cd /var/www/euroform-live && git fetch && [ \$(git rev-list HEAD...origin/main --count) != 0 ] && /var/www/deploy-webhook.sh") | crontab -

echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo "✅ Your app is running at: http://$(curl -s ifconfig.me)"
echo "✅ Backend API: http://$(curl -s ifconfig.me)/api/"
echo ""
echo "🔄 To deploy updates:"
echo "   1. Make changes locally"
echo "   2. git add ."
echo "   3. git commit -m 'update'"
echo "   4. git push"
echo "   5. Wait ~5 minutes for auto-deploy!"
echo ""
echo "📊 Useful commands:"
echo "   pm2 status          - Check app status"
echo "   pm2 logs euroform   - View logs"
echo "   pm2 restart euroform - Restart app"
echo ""
echo -e "${GREEN}That's it! Just git push to deploy! 🚀${NC}"
