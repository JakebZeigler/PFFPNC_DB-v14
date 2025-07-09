# PFFPNC Backend API

## Railway Deployment Instructions

### 1. Deploy to Railway
1. Go to [railway.app](https://railway.app)
2. Sign up/login with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Connect your GitHub account and select this repository
5. Choose the `/server` directory as the root

### 2. Add Environment Variables
In Railway dashboard, add these environment variables:

```
DB_HOST=your-railway-mysql-host
DB_USER=your-railway-mysql-user
DB_PASSWORD=your-railway-mysql-password
DB_NAME=pffpnc_db
DB_PORT=3306
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=3001
```

### 3. Add MySQL Database
1. In Railway, click "New" → "Database" → "MySQL"
2. Copy the connection details to your environment variables
3. The database will be automatically created

### 4. Initialize Database
After deployment, run the database initialization:
- Railway will automatically run `npm start`
- The server will create tables on first connection
- Or manually run the init script if needed

### 5. Get Your Public URL
- Railway will provide a public URL like: `https://your-app-name.railway.app`
- Use this URL + `/api` for your frontend connection

## Local Development
```bash
npm install
npm run init-db  # Initialize database
npm start        # Start server
```

## API Endpoints
- `GET /api/health` - Health check
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create customer
- And more... (see routes folder)
