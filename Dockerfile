# Lightweight Node.js Image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install build dependencies for better-sqlite3 (Required for Alpine)
RUN apk add --no-cache python3 make g++

# Copy dependency definitions
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy application code
COPY . .

# Create volume mount potential directory
VOLUME /app/data

# Exposure
EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

# Start
CMD ["node", "server/index.js"]
