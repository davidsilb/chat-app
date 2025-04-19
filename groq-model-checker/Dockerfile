# Use lightweight Node image
FROM node:23-alpine

# Create app directory
WORKDIR /app

# Copy files
#COPY package.json ./
COPY package.json package-lock.json* ./
COPY fetchGroqModels.js ./

# Install dependencies
RUN npm install

# Run the script
#CMD ["npm", "start"]
CMD ["node", "fetchGroqModels.js"]