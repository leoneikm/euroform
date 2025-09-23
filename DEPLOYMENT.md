# Euroform Deployment Guide

## Prerequisites

1. **Supabase Account** (EU Region)
   - Create a new project in the EU region
   - Note down your project URL and anon key
   - Generate a service role key

2. **Mailjet Account** (EU)
   - Create account at mailjet.com
   - Get API key and secret key
   - Verify your sender domain/email

3. **Hetzner Cloud Account** (EU)
   - Create a server instance
   - Install Node.js and npm
   - Install PM2 for process management

## Setup Steps

### 1. Database Setup

1. Go to your Supabase SQL Editor
2. Run the SQL script from `server/database/schema.sql`
3. Verify tables and policies are created

### 2. Environment Configuration

Copy `env.example` to `.env` and fill in your values:

```bash
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
SERVER_URL=https://api.yourdomain.com
```

### 3. Local Development

```bash
# Install all dependencies
npm run install:all

# Start development servers
npm run dev
```

This will start:
- Frontend on http://localhost:5173
- Backend on http://localhost:3001

### 4. Production Build

```bash
# Build frontend
npm run client:build

# The built files will be in client/dist/
```

### 5. Hetzner Cloud Deployment

1. **Server Setup:**
   ```bash
   # Install Node.js 18+
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install PM2
   sudo npm install -g pm2

   # Install Nginx
   sudo apt-get install nginx
   ```

2. **Deploy Backend:**
   ```bash
   # Upload server files to /var/www/euroform-api/
   cd /var/www/euroform-api/
   npm install --production

   # Start with PM2
   pm2 start index.js --name "euroform-api"
   pm2 startup
   pm2 save
   ```

3. **Deploy Frontend:**
   ```bash
   # Upload client/dist files to /var/www/euroform/
   # Configure Nginx to serve static files
   ```

4. **Nginx Configuration:**
   ```nginx
   # /etc/nginx/sites-available/euroform
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           root /var/www/euroform;
           try_files $uri $uri/ /index.html;
       }

       location /api/ {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

5. **SSL Certificate:**
   ```bash
   # Install Certbot
   sudo apt-get install certbot python3-certbot-nginx

   # Get SSL certificate
   sudo certbot --nginx -d yourdomain.com
   ```

### 6. File Cleanup Cron Job

Add to your server crontab:
```bash
# Clean up files older than 24 hours every hour
0 * * * * curl -X POST http://localhost:3001/api/cleanup
```

## Monitoring

- Use PM2 for process monitoring: `pm2 monit`
- Check logs: `pm2 logs euroform-api`
- Restart if needed: `pm2 restart euroform-api`

## Security Checklist

- [ ] Supabase RLS policies enabled
- [ ] Environment variables secured
- [ ] Nginx rate limiting configured
- [ ] SSL certificate installed
- [ ] File upload limits enforced
- [ ] CORS properly configured
- [ ] No sensitive data in logs

## GDPR Compliance & Data Protection

### Infrastructure & Data Processing
- ✅ **Database**: Supabase EU (PostgreSQL in European Union)
- ✅ **Application Hosting**: Hetzner Cloud (German data centers)
- ✅ **File Storage**: Supabase Storage EU with encryption at rest
- ✅ **Email Service**: Mailjet EU (European infrastructure only)
- ✅ **CDN/Assets**: Served directly from Hetzner (no third-party CDNs)

### Data Protection Measures
- ✅ **Data Minimization**: Only essential data collected (forms, submissions, user accounts)
- ✅ **Automatic Deletion**: Uploaded files deleted after 24 hours via cron job
- ✅ **User Control**: Complete account and data deletion capability
- ✅ **No Tracking**: Zero analytics, tracking pixels, or third-party scripts
- ✅ **Encryption**: All data transmission via HTTPS/TLS
- ✅ **Access Control**: Row-level security policies on all database operations

### Legal Compliance
- ✅ **Legal Basis**: Legitimate Interest (Art. 6(1)(f) GDPR)
- ✅ **Data Controller**: Clearly identified in privacy policy
- ✅ **User Rights**: Full implementation of GDPR rights (access, rectification, erasure, portability)
- ✅ **Retention Policy**: Clear data retention periods defined
- ✅ **Consent Management**: Transparent data processing information

### Technical Security
- ✅ **Database Security**: Supabase RLS policies prevent unauthorized access
- ✅ **API Security**: Rate limiting and input validation
- ✅ **File Security**: Upload restrictions and automatic cleanup
- ✅ **Network Security**: Nginx configuration with security headers
- ✅ **Environment Security**: Sensitive data in environment variables only

### Monitoring & Compliance
- ✅ **Audit Trail**: All database operations logged
- ✅ **Data Breach Procedures**: Automated monitoring and alerting
- ✅ **Regular Updates**: Security patches and dependency updates
- ✅ **Documentation**: Complete privacy policy and terms of service
