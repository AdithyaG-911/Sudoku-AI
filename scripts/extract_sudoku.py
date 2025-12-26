
import sys
import os
import json
import cv2
import numpy as np
import onnxruntime as ort
import traceback
import base64

# Add the cloned project to the python path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLONED_REPO_PATH = os.path.join(PROJECT_ROOT, 'sudoku-solver-computer-vision-cnn')
sys.path.append(CLONED_REPO_PATH)

try:
    from src.preprocess.build_features import process_sudoku_image, finding_sudoku_mask, extract_sudoku_grid
except ImportError as e:
    print(json.dumps({"error": f"ImportError: {e}. Check if dependencies are installed."}))
    sys.exit(1)

def softmax(x):
    """Compute softmax values for each sets of scores in x."""
    e_x = np.exp(x - np.max(x, axis=1, keepdims=True))
    return e_x / e_x.sum(axis=1, keepdims=True)

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path provided"}))
        sys.exit(1)

    image_path = sys.argv[1]
    
    if not os.path.exists(image_path):
        print(json.dumps({"error": f"Image file not found: {image_path}"}))
        sys.exit(1)

    try:
        # Load image
        image = cv2.imread(image_path)
        if image is None:
            print(json.dumps({"error": "Failed to load image via cv2"}))
            sys.exit(1)

        # 1. Get corners explicitly for UI overlay
        mask = finding_sudoku_mask(image.copy())
        corners_np = extract_sudoku_grid(image.copy(), mask)
        
        # Convert numpy corners to list of list [[x,y],...]
        corners_list = corners_np.tolist()
        
        # 2. Process image
        # process_sudoku_image returns: cells, coords, warped_image
        # cells is a numpy array (N, 28, 28)
        cells, coords, warped = process_sudoku_image(image)
        
        if cells is None:
             print(json.dumps({"error": "Failed to detect Sudoku grid"}))
             sys.exit(0)

        # 3. Encode warped image for UI display
        _, buffer = cv2.imencode('.jpg', warped)
        warped_base64 = base64.b64encode(buffer).decode('utf-8')
        warped_data_url = f"data:image/jpeg;base64,{warped_base64}"

        # Load ONNX model
        model_path = os.path.join(CLONED_REPO_PATH, "models/model.onnx")
        if not os.path.exists(model_path):
             print(json.dumps({"error": f"Model file not found at {model_path}"}))
             sys.exit(1)
             
        # Initialize ONNX Runtime session
        # Use CPUExecutionProvider
        ort_session = ort.InferenceSession(model_path, providers=['CPUExecutionProvider'])
        
        input_name = ort_session.get_inputs()[0].name

        # Prepare batch input
        # cells is (81, 28, 28) float64/32
        # Model expects (Batch, 3, 28, 28) float32
        
        # 1. Expand dims to (Batch, 1, 28, 28)
        # 2. Repeat to 3 channels -> (Batch, 3, 28, 28)
        # 3. Ensure float32
        
        batch_input = np.expand_dims(cells, axis=1) # (81, 1, 28, 28)
        batch_input = np.repeat(batch_input, 3, axis=1) # (81, 3, 28, 28)
        batch_input = batch_input.astype(np.float32)
        
        # Run inference in one batch
        outputs = ort_session.run(None, {input_name: batch_input})
        
        # outputs[0] is (81, 10) - logits
        logits = outputs[0]
        
        # Apply softmax and argmax
        probs = softmax(logits)
        predicted = np.argmax(probs, axis=1)
        max_probs = np.max(probs, axis=1)
        
        # Reshape to 9x9
        grid = predicted.reshape(9, 9).tolist()
        confidences = max_probs.reshape(9, 9).tolist()

        # Prepare output
        result = {
            "board": grid,
            "confidences": confidences,
            "corners": corners_list,
            "warped_image": warped_data_url,
            "success": True
        }
        
        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({"error": f"Unexpected error: {str(e)}", "traceback": traceback.format_exc()}))
        print(traceback.format_exc(), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
