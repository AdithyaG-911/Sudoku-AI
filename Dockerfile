# Stage 1: Build the Next.js frontend
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Final runtime image
FROM node:18-slim
WORKDIR /app

# Install Python 3.10 and build dependencies for OpenCV/Torch if needed
RUN apt-get update && apt-get install -y \
    python3.10 \
    python3-pip \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set up Python environment
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

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
ENV PYTHON_PATH=python3.10

EXPOSE 3000

CMD ["npm", "start"]
