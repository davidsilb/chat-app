# Use the slim Alpine base image
FROM node:23-slim

# Set the working directory
WORKDIR /app

# Optional: Install bash if needed by scripts (safe to skip if not needed)
# RUN apk add --no-cache bash

# Install only production dependencies (skip devDeps)
COPY package*.json ./
RUN npm install --production

# Copy the rest of your app
COPY . .

# Expose the port your app listens on
EXPOSE 3000

# Start the app
CMD ["node", "server.js"]
