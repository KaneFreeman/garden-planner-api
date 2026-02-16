# Dockerfile
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the NestJS application
RUN npm run build

# Use production environment
ENV NODE_ENV=production

# Start the app
CMD ["node", "dist-prod/main.js"]
