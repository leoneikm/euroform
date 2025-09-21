#!/bin/bash

# Euroform Server Setup Script for Hetzner
# Run this on your Hetzner server to prepare it for deployment

echo "🔧 Setting up Euroform server environment..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y
print_status "System updated"

# Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
print_status "Node.js installed: $(node --version)"

# Install PM2
echo "📦 Installing PM2..."
sudo npm install -g pm2
print_status "PM2 installed: $(pm2 --version)"

# Install Nginx
echo "📦 Installing Nginx..."
sudo apt-get install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
print_status "Nginx installed and started"

# Create application directories
echo "📁 Creating application directories..."
sudo mkdir -p /var/www/euroform
sudo mkdir -p /var/www/euroform-api
sudo chown -R www-data:www-data /var/www/euroform
sudo chown -R $USER:$USER /var/www/euroform-api
print_status "Directories created"

# Create basic Nginx configuration
echo "🔧 Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/euroform > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;  # Replace with your domain

    # Frontend
    location / {
        root /var/www/euroform;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase upload size for file uploads
        client_max_body_size 10M;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/euroform /etc/nginx/sites-enabled/
sudo nginx -t
if [ $? -eq 0 ]; then
    sudo systemctl reload nginx
    print_status "Nginx configuration created and loaded"
else
    print_error "Nginx configuration error"
fi

# Install Certbot for SSL
echo "🔒 Installing Certbot for SSL..."
sudo apt-get install -y certbot python3-certbot-nginx
print_status "Certbot installed"

# Create environment file template
echo "📝 Creating environment template..."
sudo tee /var/www/euroform-api/.env.template > /dev/null << 'EOF'
# Copy this to .env and fill in your values

# Supabase (EU Region)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Mailjet (EU)
MAILJET_API_KEY=your-mailjet-api-key
MAILJET_SECRET_KEY=your-mailjet-secret-key
MAILJET_FROM_EMAIL=noreply@yourdomain.com
MAILJET_FROM_NAME=Euroform

# Application
NODE_ENV=production
PORT=3001
CLIENT_URL=https://yourdomain.com
SERVER_URL=https://yourdomain.com
EOF
print_status "Environment template created at /var/www/euroform-api/.env.template"

# Setup PM2 startup
echo "🔄 Setting up PM2 startup..."
pm2 startup
print_status "PM2 startup configured"

# Create firewall rules
echo "🔥 Configuring firewall..."
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
print_status "Firewall configured"

echo ""
echo "🎉 Server setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Copy /var/www/euroform-api/.env.template to .env and fill in your values"
echo "2. Update your domain in /etc/nginx/sites-available/euroform"
echo "3. Run: sudo certbot --nginx -d yourdomain.com (for SSL)"
echo "4. Deploy your application using the deploy.sh script"
echo ""
echo "📊 Server Status:"
echo "   Node.js: $(node --version)"
echo "   npm: $(npm --version)"
echo "   PM2: $(pm2 --version)"
echo "   Nginx: $(nginx -v 2>&1)"
echo ""
print_status "Ready for deployment! 🚀"
