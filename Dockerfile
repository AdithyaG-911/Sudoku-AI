# Stage 1: Build the Next.js frontend
FROM node:20-slim AS builder
WORKDIR /app

# Install build dependencies for native modules like 'canvas'
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Final runtime image
FROM node:20-slim
WORKDIR /app

# Install Python 3 and build dependencies for OpenCV/Torch
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set up Python environment
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt --break-system-packages

# Copy Next.js build and dependencies
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/sudoku-solver-computer-vision-cnn ./sudoku-solver-computer-vision-cnn

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV PYTHON_PATH=python3

EXPOSE 3000

CMD ["npm", "start"]
