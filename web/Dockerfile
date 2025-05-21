# Use the Debian slim base image
FROM node:24-slim

# Install curl for healthchecks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Optional: Install bash if needed by scripts (safe to skip if not needed)
# this only works for alphine based images not debian based images
# RUN apk add --no-cache bash

# Install only production dependencies (skip devDeps)
COPY package*.json ./
ENV NODE_ENV=production
RUN npm install

# Copy the rest of your app
COPY . .

# Expose the port your app listens on
EXPOSE 3000

# Start the app
CMD ["node", "server.js"]
