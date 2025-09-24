# 🚀 Euroform Live Deployment Guide

## Quick Deploy (Recommended)

For future deployments, simply run:

```bash
./deploy-live.sh
```

This automated script will handle all the deployment steps and prevent common issues.

## Manual Deployment Steps (If Needed)

### 1. Build Frontend
```bash
cd client
npm run build
cd ..
```

### 2. Deploy Frontend
```bash
scp -r client/dist/* root@162.55.59.244:/var/www/html/
```

### 3. Deploy Backend
```bash
scp -r server/* root@162.55.59.244:/var/www/euroform-api/
```

### 4. Configure Environment
```bash
ssh root@162.55.59.244
cat > /var/www/euroform-api/.env << 'EOF'
NODE_ENV=production
PORT=3001
VITE_SUPABASE_URL=https://cxwldnvgajfjucvghtyv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4d2xkbnZnYWpmanVjdmdodHl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxOTU0NTksImV4cCI6MjA3Mzc3MTQ1OX0.qhtfIawjBBZuWpZVNrYo-bFPT48C8qCw5Dy2-zk7noU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4d2xkbnZnYWpmanVjdmdodHl2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE5NTQ1OSwiZXhwIjoyMDczNzcxNDU5fQ.AlvHV4unqdNS9AbCPiNiH6ypemOzSiMWsXCkstn4yQY
EOF
```

### 5. Restart Services
```bash
pm2 restart euroform-api
pm2 save
```

## 🔧 Common Issues & Solutions

### Issue: "Form not found" error
**Solution**: The backend might be crashing due to missing Mailjet credentials. This is fixed in the current codebase - Mailjet is now optional.

### Issue: Authentication timeout
**Solution**: Fixed by increasing timeout to 30 seconds and improving error handling in AuthContext.jsx.

### Issue: Routes returning 404
**Solution**: We now use query parameter approach (`/api/forms/{id}?manage=true`) instead of `/api/forms/{id}/manage` to avoid Express routing issues.

### Issue: Frontend not updating
**Solution**: Browser caching. The deployment script includes cache-busting headers and nginx reload.

## 🧪 Testing Deployment

After deployment, verify these endpoints:

1. **Health Check**: https://app.euroform.io/api/health
2. **Form Management**: https://app.euroform.io/api/forms/0f76e2f2-b2d8-41c9-ae64-3158d4087611?manage=true
3. **Public Form**: https://app.euroform.io/api/forms/0f76e2f2-b2d8-41c9-ae64-3158d4087611

## 📋 Server Configuration

### Nginx Configuration
- **File**: `/etc/nginx/sites-available/euroform`
- **SSL**: Certificate configured and active
- **Proxy**: `/api/` routes proxy to `localhost:3001`
- **Cache**: Cache-busting headers for development

### PM2 Services
- **Backend**: `euroform-api` (port 3001)
- **Frontend**: Served by nginx from `/var/www/html`

### Directory Structure
```
/var/www/
├── html/                 # Frontend files
└── euroform-api/         # Backend files
    ├── index.js
    ├── .env
    ├── routes/
    └── ...
```

## 🛠️ Troubleshooting Commands

```bash
# Check PM2 status
ssh root@162.55.59.244 "pm2 status"

# View backend logs
ssh root@162.55.59.244 "pm2 logs euroform-api"

# Restart backend
ssh root@162.55.59.244 "pm2 restart euroform-api"

# Check nginx status
ssh root@162.55.59.244 "systemctl status nginx"

# Test API endpoints
curl https://app.euroform.io/api/health
curl "https://app.euroform.io/api/forms/0f76e2f2-b2d8-41c9-ae64-3158d4087611?manage=true"
```

## 🔄 Rollback Procedure

If deployment fails:

1. **Restore Backend**: Deploy previous working version
2. **Restart Services**: `pm2 restart euroform-api`
3. **Check Logs**: `pm2 logs euroform-api`
4. **Test Endpoints**: Verify health and form endpoints

## 📝 Notes

- Always use the automated `deploy-live.sh` script for consistency
- The server uses Node.js 18 (consider upgrading to 20+ in future)
- Mailjet is optional - server won't crash if credentials are missing
- Authentication timeout increased to 30 seconds for better reliability
- Form management uses query parameters to avoid routing issues
