FROM node:22-bookworm-slim
WORKDIR /app

# Install chromium and its dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/ ./
RUN mkdir -p /data
EXPOSE 3001
CMD ["node", "server.js"]
