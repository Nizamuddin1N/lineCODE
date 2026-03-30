FROM node:20-alpine

WORKDIR /app

# Copy package files first (Docker layer caching)
# If package.json hasn't changed, npm install is skipped
COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]