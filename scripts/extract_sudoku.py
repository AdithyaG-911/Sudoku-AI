
import sys
import os
import json
import cv2
import torch
import traceback
import base64

# Add the cloned project to the python path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLONED_REPO_PATH = os.path.join(PROJECT_ROOT, 'sudoku-solver-computer-vision-cnn')
sys.path.append(CLONED_REPO_PATH)

try:
    from src.model.model import ConvNet
    from src.preprocess.build_features import process_sudoku_image, finding_sudoku_mask, extract_sudoku_grid
except ImportError as e:
    print(json.dumps({"error": f"ImportError: {e}. Check if dependencies are installed."}))
    sys.exit(1)

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
        # corners_np is 4x2 array
        corners_list = corners_np.tolist()
        
        # 2. Process image (this re-does some work but ensures consistency with model input)
        # process_sudoku_image returns: cells, coords, warped_image
        cells, coords, warped = process_sudoku_image(image)
        
        if cells is None:
             print(json.dumps({"error": "Failed to detect Sudoku grid"}))
             sys.exit(0) # Not an error, just failed detection

        # 3. Encode warped image for UI display
        _, buffer = cv2.imencode('.jpg', warped)
        warped_base64 = base64.b64encode(buffer).decode('utf-8')
        warped_data_url = f"data:image/jpeg;base64,{warped_base64}"

        # Load model
        device = torch.device("cpu") # Force CPU for simplicity/compatibility
        model = ConvNet().to(device)
        
        model_path = os.path.join(CLONED_REPO_PATH, "models/50epochs_convnet_sudoku_only.pkl")
        if not os.path.exists(model_path):
             print(json.dumps({"error": f"Model file not found at {model_path}"}))
             sys.exit(1)
             
        model.load_state_dict(torch.load(model_path, map_location=device))
        model.eval()

        # Predict
        grid = [[0] * 9 for _ in range(9)]
        confidences = [[0.0] * 9 for _ in range(9)]
        
        with torch.no_grad():
            for i in range(9):
                for j in range(9):
                    cell_image = cells[i * 9 + j]
                    tensor_image = (
                        torch.from_numpy(cell_image)
                        .float()
                        .unsqueeze(0)
                        .unsqueeze(0)
                        .to(device)
                    )
                    tensor_image = tensor_image.repeat(1, 3, 1, 1)

                    output = model(tensor_image)
                    
                    # Get probability/confidence
                    probs = torch.nn.functional.softmax(output, dim=1)
                    max_prob, predicted = torch.max(probs, 1)
                    
                    digit = predicted.item()
                    confidence = max_prob.item()
                    
                    grid[i][j] = digit
                    confidences[i][j] = confidence

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
        sys.exit(1)

if __name__ == "__main__":
    main()
