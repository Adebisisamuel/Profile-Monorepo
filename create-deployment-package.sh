#!/bin/bash

# This script creates a deployment package for the Bedieningen Profiel application
# It includes all necessary files and the .env file with database configuration

echo "Creating deployment package for Bedieningen Profiel..."

# Create a temporary directory for the package
mkdir -p ./deployment-package

# Copy all necessary files
echo "Copying project files..."
cp -r ./client ./deployment-package/
cp -r ./server ./deployment-package/
cp -r ./shared ./deployment-package/
cp -r ./migrations ./deployment-package/
cp -r ./uploads ./deployment-package/
cp -r ./node_modules ./deployment-package/ 2>/dev/null || echo "Warning: node_modules not included, you'll need to run npm install after unpacking"
cp -r ./public ./deployment-package/ 2>/dev/null || echo "Warning: public directory not found, but that's okay if it doesn't exist"

# Copy configuration files
cp .env ./deployment-package/
cp package.json ./deployment-package/
cp package-lock.json ./deployment-package/ 2>/dev/null || echo "Warning: package-lock.json not found, but that's okay"
cp tsconfig.json ./deployment-package/
cp vite.config.ts ./deployment-package/
cp drizzle.config.ts ./deployment-package/
cp tailwind.config.ts ./deployment-package/
cp postcss.config.js ./deployment-package/
cp theme.json ./deployment-package/ 2>/dev/null || echo "Warning: theme.json not found, but that's okay"
cp DEPLOYMENT.md ./deployment-package/

# Create a README with deployment instructions
cat > ./deployment-package/README.md << 'EOF'
# Bedieningen Profiel - Deployment Package

This package contains everything you need to deploy the Bedieningen Profiel application.

## Quick Start

1. **Set up your environment**
   - Node.js 18+ and npm must be installed
   - PostgreSQL database must be set up

2. **Configure the database**
   - The .env file already contains the database configuration
   - You can use the existing database or set up your own by updating the .env file

3. **Install dependencies**
   ```
   npm install
   ```

4. **Run database migrations**
   ```
   npm run db:push
   ```

5. **Start the application**
   For development:
   ```
   npm run dev
   ```
   
   For production:
   ```
   npm run build
   npm start
   ```

## Important Notes

- The database password is included in the .env file for convenience but should be changed in production
- Review DEPLOYMENT.md for more detailed deployment options including Docker and PaaS platforms
- If you encounter any issues, refer to the troubleshooting section in DEPLOYMENT.md

EOF

# Create a zip file of the deployment package
echo "Creating zip file..."
cd deployment-package
zip -r ../bedieningen-profiel-deployment.zip .
cd ..

# Clean up
echo "Cleaning up temporary directory..."
rm -rf ./deployment-package

echo "Deployment package created successfully: bedieningen-profiel-deployment.zip"
echo "This package includes the .env file with database configuration."
echo "Upload this zip file to your hosting provider or extract it on your local machine to deploy."