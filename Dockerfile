# Base image
FROM node:20-alpine
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the application
#ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Set production environment
ENV NODE_ENV production
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"] 