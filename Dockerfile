# Lightweight Node.js Image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy application code
COPY . .

# Create volume mount points for persistence
# This is crucial: Even if the container is destroyed, the DB and Config survive if mapped
VOLUME /app/server/db
VOLUME /app/server/data

# Exposure
EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

# Start
CMD ["node", "server.js"]
