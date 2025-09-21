# Euroform Setup Guide

## 📋 Environment Configuration

### 1. Create Client Environment File
Create `client/.env` with:
```
VITE_SUPABASE_URL=https://cxwldnvgajfjucvghtyv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4d2xkbnZnYWpmanVjdmdodHl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxOTU0NTksImV4cCI6MjA3Mzc3MTQ1OX0.qhtfIawjBBZuWpZVNrYo-bFPT48C8qCw5Dy2-zk7noU
```

### 2. Create Server Environment File
Create `server/.env` with:
```
# Supabase Configuration
VITE_SUPABASE_URL=https://cxwldnvgajfjucvghtyv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4d2xkbnZnYWpmanVjdmdodHl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxOTU0NTksImV4cCI6MjA3Mzc3MTQ1OX0.qhtfIawjBBZuWpZVNrYo-bFPT48C8qCw5Dy2-zk7noU
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE

# Mailjet Configuration
MAILJET_API_KEY=77578e11183053e0561f1268a46fb77b
MAILJET_SECRET_KEY=b1e6d0b211ef246c5a3840fcd13ca762
MAILJET_FROM_EMAIL=noreply@yourdomain.com
MAILJET_FROM_NAME=Euroform

# Application Configuration
NODE_ENV=development
PORT=3001
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:3001

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

## 🗄️ Supabase Database Setup

### Step 1: Get Service Role Key
1. Go to https://supabase.com/dashboard/project/cxwldnvgajfjucvghtyv
2. Navigate to **Settings** → **API**
3. Copy the **service_role** key (not the anon key)
4. Replace `YOUR_SERVICE_ROLE_KEY_HERE` in your server/.env file

### Step 2: Run Database Schema
1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the entire contents of `server/database/schema.sql`
4. Click **Run** to execute the schema

### Step 3: Verify Setup
After running the schema, you should see these tables in your **Table Editor**:
- `forms` - Stores form definitions
- `submissions` - Stores form submissions

### Step 4: Set up Storage
1. Go to **Storage** in your Supabase dashboard
2. The schema should have created a `form-uploads` bucket
3. Verify the bucket exists and has the correct policies

## ☁️ Hetzner Cloud Recommendations

### Recommended Server Configuration

For the MVP, you'll need a **Hetzner Cloud** server with these specs:

#### **Option 1: Basic (Recommended for MVP)**
- **Server Type**: CX21 (2 vCPUs, 4GB RAM, 40GB SSD)
- **Location**: Nuremberg, Germany (EU)
- **Monthly Cost**: ~€5.83
- **Good for**: Testing and small-scale production

#### **Option 2: Production Ready**
- **Server Type**: CX31 (2 vCPUs, 8GB RAM, 80GB SSD)
- **Location**: Nuremberg, Germany (EU)
- **Monthly Cost**: ~€10.52
- **Good for**: Production with moderate traffic

#### **Option 3: High Performance**
- **Server Type**: CX41 (4 vCPUs, 16GB RAM, 160GB SSD)
- **Location**: Nuremberg, Germany (EU)
- **Monthly Cost**: ~€20.24
- **Good for**: High traffic production

### Server Setup Steps

1. **Create Server**:
   - Go to https://console.hetzner.cloud
   - Create new project
   - Choose server location: **Nuremberg** (Germany/EU)
   - Select Ubuntu 22.04 LTS
   - Add your SSH key

2. **Initial Server Configuration**:
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js 18
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2 for process management
   sudo npm install -g pm2
   
   # Install Nginx
   sudo apt-get install nginx
   
   # Install Certbot for SSL
   sudo apt-get install certbot python3-certbot-nginx
   ```

3. **Deploy Application**:
   - Upload your built application
   - Configure Nginx reverse proxy
   - Set up SSL certificate
   - Start services with PM2

## 🚀 Quick Start (Local Development)

1. **Create the environment files** as described above
2. **Get your Supabase service role key** and update server/.env
3. **Run the database schema** in Supabase SQL Editor
4. **Start the development servers**:
   ```bash
   npm run dev
   ```

This will start:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## ✅ Next Steps Checklist

- [ ] Create client/.env file with Supabase credentials
- [ ] Create server/.env file with all credentials
- [ ] Get Supabase service role key from dashboard
- [ ] Run database schema in Supabase SQL Editor
- [ ] Test local development with `npm run dev`
- [ ] Set up Hetzner Cloud server (CX21 recommended for start)
- [ ] Configure domain and SSL certificate
- [ ] Deploy to production

## 🆘 Need Help?

If you encounter any issues:
1. Check that all environment variables are set correctly
2. Verify the database schema ran without errors
3. Ensure your Supabase project is in the EU region
4. Check that Mailjet API keys are valid and active
