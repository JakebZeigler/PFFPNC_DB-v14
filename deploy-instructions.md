# 🚀 PFFPNC Deployment Guide

## Quick Deployment Steps

### 1. Deploy Backend to Railway (5 minutes)

1. **Go to Railway:**
   - Visit: https://railway.app
   - Sign up/login with GitHub

2. **Create New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your GitHub account
   - Select your repository
   - Choose `/server` as the root directory

3. **Add MySQL Database:**
   - In Railway dashboard, click "New" → "Database" → "MySQL"
   - Railway will automatically create a MySQL instance

4. **Set Environment Variables:**
   - Go to your service → "Variables" tab
   - Add these variables (Railway will auto-fill database values):
   ```
   DB_HOST=<auto-filled by Railway MySQL>
   DB_USER=<auto-filled by Railway MySQL>
   DB_PASSWORD=<auto-filled by Railway MySQL>
   DB_NAME=pffpnc_db
   DB_PORT=3306
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   PORT=3001
   ```

5. **Get Your Backend URL:**
   - Railway will provide a URL like: `https://your-app-name.railway.app`
   - Your API will be at: `https://your-app-name.railway.app/api`

### 2. Update Frontend for Netlify

1. **Update Environment Variable:**
   - Open your `.env` file
   - Change `VITE_API_URL` to your Railway backend URL:
   ```
   VITE_API_URL=https://your-app-name.railway.app/api
   ```

2. **Claim Your Netlify Site:**
   - Your site is already deployed at: https://pffpnc-database-system.windsurf.build
   - Click the claim link provided earlier to activate it
   - Or redeploy with the updated backend URL

### 3. Test Your Public App

Once both are deployed:
- **Frontend:** https://pffpnc-database-system.windsurf.build
- **Backend:** https://your-app-name.railway.app/api
- **Database:** Railway MySQL (automatically connected)

## Alternative: Quick Local + ngrok Setup

If you prefer to test locally first:
1. Find ngrok.exe in your Downloads
2. Run: `ngrok http 3001` (for backend)
3. Run: `ngrok http 5173` (for frontend)
4. Update `.env` with ngrok backend URL

## 🎯 Your App Features

- **Customer Management:** Add, edit, delete customers
- **Agent Management:** Manage sales agents
- **Disposition Tracking:** Track customer interactions
- **Show Management:** Manage events and shows
- **Association Management:** Handle business associations
- **User Authentication:** Login/register system
- **Real-time Database:** All changes sync to MySQL

## 📱 Cross-Device Access

Once deployed, you can access your app from:
- Any computer with internet
- Mobile phones and tablets
- Share the URL with team members
- All data syncs in real-time
