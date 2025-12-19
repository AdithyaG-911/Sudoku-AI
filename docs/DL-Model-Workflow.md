
# Deep Learning Model & Workflow

This document explains the technical details of the Sudoku OCR model, its training pipeline, and how it is integrated into the application.

## 1. Model Architecture
We use a **Convolutional Neural Network (CNN)** built with TensorFlow.js. It is designed to recognize digits (1-9) and empty cells from 28x28 grayscale images.

### Layers:
1.  **Input**: [28, 28, 1] (Grayscale image)
2.  **Conv2D**: 16 filters, 3x3 kernel, ReLU activation. Extracts basic features (edges, corners).
3.  **MaxPooling2D**: 2x2. Reduces spatial dimensions.
4.  **Conv2D**: 32 filters, 3x3 kernel, ReLU activation. Extracts complex features (loops, curves).
5.  **MaxPooling2D**: 2x2.
6.  **Flatten**: Converts 2D feature maps to 1D vector.
7.  **Dense**: 64 units, ReLU. Interpretation layer.
8.  **Output**: 11 units, Softmax. Probabilities for classes 0-9 and Empty(10).

## 2. Dataset
The model is trained on a **Hybrid Dataset** (50/50 mix):

### A. Real-World Data (50%)
*   **Source**: [Sudoku Dataset v2](https://github.com/wichtounet/sudoku_dataset)
*   **Size**: ~13,000 labelled cell images extracted from 160 smartphone photos.
*   **Preprocessing**:
    *   **Binarization**: Otsu-like thresholding to separate ink from paper.
    *   **Center-of-Mass**: The digit is detected and centered in the frame.
    *   **Scaling**: Scaled to fit a 20x20 box within the 28x28 input.

### B. Synthetic Data (50%)
*   **Source**: Generated on-the-fly during training.
*   **Augmentation**:
    *   **Fonts**: Random standard fonts (Arial, Tahoma, etc.).
    *   **Grid Lines**: Random vertical/horizontal lines drawn through digits (crucial for Sudoku).
    *   **Noise**: Salt-and-pepper noise, sensor blur.
    *   **Affine Transforms**: Rotation, shearing, scaling, translation.

## 3. Training Workflow
The training is handled by `scripts/train-model.js` (Node.js).

1.  **Setup**: Loads fonts and the pre-processed real dataset (`data/real-data.json`).
2.  **Loop**: Runs for 5 epochs.
3.  **Batching**: In each batch (size 64):
    *   32 images are sampled from the Real Dataset.
    *   32 images are generated synthetically.
    *   Both are concatenated and fed to the model.
4.  **Optimization**: **SGD optimizer** (LR=0.01) minimizes Categorical Crossentropy loss. (Switched from Adam for stability).
5.  **Export**: Saves `model.json` and `weights.bin` to `public/models/digit-recognition/`.

## 4. Inference (Web App)
The web app (`lib/sudoku-ocr.ts`) loads the model from `public/models/...`.

### Preprocessing Pipeline:
When a user uploads an image:
1.  **Grid Detection**: Finds the 9x9 grid corners.
2.  **Cell Extraction**: Cuts out 81 squares.
3.  **Preprocessing**: content is binarized, centered (Center-of-Mass), and resized to 28x28 (matching training data exactly).
4.  **Prediction**: The model predicts the digit.
    *   If confidence is low or class is 10, it returns 0 (Empty).
