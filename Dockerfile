FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
# RUN npm ci --only=production
RUN npm ci 

# Copy project files
COPY . .

# Build the application
RUN npm run build

# Expose the port the app runs on
EXPOSE 5000

# Start the application
CMD ["npm", "start"]