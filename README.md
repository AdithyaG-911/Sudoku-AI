<<<<<<< HEAD
# 🧩 Sudoku AI Master 🚀

**The ultimate Sudoku experience, powered by Computer Vision and Deep Learning.**

Sudoku AI Master is a premium, full-stack web application that allows you to play, solve, and scan Sudoku puzzles with ease. From high-octane AI digit extraction to a relaxing lo-fi music player, this app is designed for both casual solvers and hardcore puzzle enthusiasts.

---

## ✨ Key Features

### 📸 AI Image Extraction
*   **Deep Learning Engine**: Uses a custom-trained Convolutional Neural Network (CNN) to recognize digits with high precision.
*   **Computer Vision**: Automatically detects the Sudoku grid from your photos, corrects perspective warping, and digitizes the board in seconds.
*   **Intelligent Post-Processing**: Automatically validates the extracted grid to ensure no duplicates or invalid moves were generated during scanning.

### 🧠 Smart Assistance
*   **Step-by-Step Hints**: Stuck? The AI doesn't just give you the answer; it explains the logic behind the next move using advanced Sudoku resolution techniques.
*   **Live Auto-Solver**: Watch the AI work! Toggle the solver to see the puzzle filled with a satisfying, real-time animation.
*   **Note Mode**: Swiftly toggle between pencil marks and final numbers to plan your strategy like a pro.

### 🎨 Premium User Experience
*   **Dynamic Design**: A glassmorphic, responsive UI that looks stunning on **MacBooks, Tablets, and iPhones**.
*   **Immersive Audio**: Integrated lo-fi music player with multiple tracks and volume control. Featuring satisfying haptic-style sound effects for every click and a triumphant chime for victory.
*   **Smart Interactions**: Highlight all instances of a number with one click, and deselect the board instantly by clicking any empty space.

### 📊 Persistence & Stats
*   **Session Continuity**: Your game, your notes, and your history are auto-saved to your browser. Close the tab anytime—your progress is safe.
*   **In-Depth Statistics**: Track your games played, win rate, best times, and current streaks across all difficulty levels.

---

## 🤖 AI Architecture & Model Details

The core of the application is a sophisticated digit recognition engine built using **PyTorch**.

### **ConvNet: The Heart of the Scanner**
Our primary model is a custom-designed, lightweight Convolutional Neural Network (CNN) optimized for high accuracy and real-time inference on mobile and web viewports.

*   **Architecture Specs**:
    *   **Input**: 3-channel (RGB) images resized to 28x28.
    *   **Convolutional Layer 1**: 32 filters (3x3 kernel) with ReLU activation.
    *   **MaxPooling**: 2x2 reduction for feature extraction.
    *   **Convolutional Layer 2**: 64 filters (3x3 kernel) with ReLU activation.
    *   **Fully Connected Layers**: 64 neurons branching into a 10-class output (digits 0-9).
*   **Performance Metrics**:
    *   **Accuracy**: Achieves an impressive **95.68%** accuracy on Sudoku-specific digit datasets.
    *   **Efficiency**: Extremely lightweight with only **~50,000 parameters**.
    *   **Inference Speed**: Processes a full 81-cell grid in **<1 second**, even on standard CPU environments.

### **Computer Vision Pipeline**
1.  **Grid Detection**: Uses OpenCV contour algorithms to isolate the Sudoku board from the image background.
2.  **Perspective Correction**: Applies a 4-point perspective transform to "flatten" tilted or angled photos into a perfect square.
3.  **Adaptive Thresholding**: Cleanly separates ink from paper to make the AI's job easier in varying lighting conditions.
4.  **Cell Recognition**: The CNN classifies each of the 81 cells, identifying both the numbers and empty spaces.

---

## 🛠️ Tech Stack

### Frontend & UI
*   **Framework**: Next.js 15 (App Router)
*   **Styling**: Tailwind CSS & Framer Motion (for smooth animations)
*   **Icons**: Lucide React
*   state management: Advanced React Hooks with LocalStorage persistence

### AI & Backend
*   **AI Engine**: Python 3.10
*   **Libraries**: PyTorch (Deep Learning), OpenCV (Computer Vision), NumPy
*   **API**: Next.js Serverless Bridge (executes backend logic via portable subprocesses)

---

## 🚀 Easy Deployment

This project is **production-ready** and includes a multi-stage `Dockerfile`.

### ⚡ Recommended (Consolidated)
Host the entire app (UI + AI) on **Railway** or **Render** using the provided Docker configuration. It automatically sets up the Node.js frontend and the heavy Python AI backend in one instance.

### ☁️ Alternative (Stateless)
Deploy the frontend to **Vercel/Netlify** and host the AI scanning logic as a separate microservice.

---

## 📄 Licensing & Security

Copyright © 2025. All Rights Reserved.

**Permissions**: This project is private. No part of this repository may be reproduced, distributed, or used for commercial purposes without the express written permission of the author. For inquiries, please open an issue or contact the owner directly.

---

## 📋 Installation

1.  **Clone**: `git clone [...]`
2.  **Node Setup**: `npm install`
3.  **Python Setup**: `pip install -r requirements.txt`
4.  **Launch**: `npm run dev` onwards to victory!
=======
# Sudoku-AI
Sudoku playing website with CNN model to import sudoku images from newspaper or other sources and solve in our sudoku-AI with features like Auto-solve and hints and Cool Background ambient music.
>>>>>>> e83a84cf056247cf28f420069365d8131e264186
