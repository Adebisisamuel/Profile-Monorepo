#!/bin/bash

# Simple deployment script for Bedieningen Profiel

echo "Preparing Bedieningen Profiel deployment..."

# Install production dependencies
npm ci --production

# Build the application
npm run build

# Start the application
npm start