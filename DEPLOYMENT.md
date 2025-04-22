# Bedieningen Profiel - Deployment Guide

This guide provides instructions for deploying the Bedieningen Profiel application outside of Replit.

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Git

## Step 1: Export the Code from Replit

1. In Replit, click on the three dots menu in the files panel
2. Select "Download as zip"
3. Save and extract the zip file to your local machine

## Step 2: Configure Environment Variables

1. Update the `.env` file with your database credentials and other configuration:

```
# Database Configuration
DATABASE_URL=postgres://username:password@hostname:port/database_name
PGHOST=your-db-host
PGPORT=5432
PGUSER=your-db-user
PGPASSWORD=your-db-password
PGDATABASE=your-db-name

# Session Secret (Generate a new one for production)
SESSION_SECRET=your-session-secret

# Other Configuration
PORT=5000
NODE_ENV=production
```

> Replace the values with your actual database credentials. For SESSION_SECRET, generate a secure random string.

## Step 3: Install Dependencies and Set Up Database

1. Install dependencies:
```bash
npm install
```

2. Set up the database:
```bash
npm run db:push
```

## Step 4: Build and Start the Application

For development:
```bash
npm run dev
```

For production:
```bash
npm run build
npm start
```

## Step 5: (Optional) Set Up Environment-Specific Configuration

Create `.env.development` and `.env.production` files for different environments.

## Deployment Options

### Option 1: Self-Hosted Server

1. Set up a Linux server (e.g., Ubuntu)
2. Install Node.js and PostgreSQL
3. Clone your codebase to the server
4. Configure environment variables
5. Build and start the application using PM2:
```bash
npm install -g pm2
pm2 start npm --name "bedieningen-profiel" -- start
```

### Option 2: Platform as a Service (PaaS)

Deploy to platforms like Heroku, Render, or Railway:

1. Create an account and create a new app
2. Connect your Git repository
3. Configure environment variables in the platform's dashboard
4. Deploy the application

### Option 3: Docker Deployment

1. Create a Dockerfile:
```
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

2. Build and run:
```bash
docker build -t bedieningen-profiel .
docker run -p 5000:5000 --env-file .env bedieningen-profiel
```

## Database Migration

If you need to migrate data from your Replit database to your new deployment:

1. Export data from Replit database:
```bash
pg_dump -U $PGUSER -h $PGHOST -p $PGPORT -d $PGDATABASE > bedieningen_backup.sql
```

2. Import data to your new database:
```bash
psql -U your-new-db-user -h your-new-db-host -d your-new-db-name < bedieningen_backup.sql
```

## Important Notes

1. Ensure your `.env` file is included in `.gitignore` to keep your credentials secure
2. Set up HTTPS for production deployments
3. Configure backup schedules for your database
4. Set up monitoring for your production environment