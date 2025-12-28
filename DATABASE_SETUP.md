# Database Setup Guide

## Overview
The application has been migrated from localStorage to PostgreSQL database. All data (admins, inventory, sales, customers, etc.) is now stored in PostgreSQL.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Initialize Database
Run the database initialization script to create all tables and insert the default admin:

```bash
npm run init-db
```

This will:
- Create all necessary tables (admins, inventory, sales, customers, suppliers, purchase_orders, etc.)
- Create the default admin account:
  - Email: `savantaakash322@gmail.com`
  - Password: `Aakash@9353`

### 3. Environment Variables
Make sure your `.env` file contains:
```
DATABASE_URL=postgresql://neondb_owner:npg_GTPRO4IeCy2B@ep-spring-boat-a4z0c3m5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### 4. For Render Deployment
Add the `DATABASE_URL` environment variable in your Render dashboard:
1. Go to your service settings
2. Navigate to "Environment" section
3. Add `DATABASE_URL` with your PostgreSQL connection string

## Features

### Multiple Admin Support
- Admins can now create multiple admin accounts
- Use the `/api/admin` endpoint to:
  - GET: List all admins
  - POST: Create new admin
  - DELETE: Delete admin (with ID parameter)

### Database Schema
All data is stored in PostgreSQL:
- `admins` - Admin users
- `business_profile` - Business information
- `suppliers` - Supplier information
- `purchase_orders` - Purchase orders from suppliers
- `inventory` - Product inventory
- `customers` - Customer database
- `catalogues` - Product catalogues
- `sales` - Sales records
- `sale_items` - Individual items in each sale

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email/password (now uses database)
- `GET /api/auth/check` - Check authentication status
- `POST /api/auth/logout` - Logout

### Admin Management
- `GET /api/admin` - Get all admins
- `POST /api/admin` - Create new admin
  ```json
  {
    "email": "admin@example.com",
    "password": "password123",
    "name": "Admin Name"
  }
  ```
- `DELETE /api/admin?id=1` - Delete admin by ID

## Security Notes

- Passwords are hashed using bcrypt
- Session tokens are stored in HTTP-only cookies
- All database queries use parameterized statements to prevent SQL injection

## Next Steps

1. Run `npm run init-db` to set up the database
2. Test login with default credentials
3. Create additional admins as needed
4. All existing localStorage data will need to be migrated (manual process or migration script)

