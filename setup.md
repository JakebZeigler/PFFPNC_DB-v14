# PFFPNC Database Management System Setup

## Prerequisites
- MySQL installed and running on your system
- Node.js installed

## Setup Steps

### 1. Configure MySQL Connection
1. Open `server\.env`
2. Update `DB_PASSWORD=your_mysql_password_here` with your actual MySQL root password
3. If you don't have a password set for MySQL root, use: `DB_PASSWORD=`

### 2. Initialize Database
```bash
cd server
npm run init-db
```

### 3. Start Backend Server
```bash
cd server
npm start
```

### 4. Start Frontend (in a new terminal)
```bash
npm run dev
```

### 5. For Public Access
We'll set up ngrok for public access:

1. Install ngrok: https://ngrok.com/download
2. Run: `ngrok http 3001` (for backend)
3. Run: `ngrok http 5173` (for frontend)
4. Update frontend `.env` with the ngrok backend URL

## Database Schema
The system creates these tables:
- `users` - User accounts and authentication
- `customers` - Customer records with full history
- `agents` - Sales agents
- `dispositions` - Call dispositions
- `shows` - Show/event information
- `associations` - Customer associations
- `disposition_history` - Historical disposition records

## API Endpoints
- `POST /api/auth/login` - User login
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create/update customer
- `GET /api/agents` - Get all agents
- And more...

## Troubleshooting
- If MySQL connection fails, check your credentials in `server\.env`
- Ensure MySQL service is running
- Check firewall settings for port 3306 (MySQL) and 3001 (API server)
