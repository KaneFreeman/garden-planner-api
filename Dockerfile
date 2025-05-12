# Dockerfile
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build the NestJS application
RUN yarn build

# Use production environment
ENV NODE_ENV=production

# Start the app
CMD ["node", "dist-prod/main.js"]
