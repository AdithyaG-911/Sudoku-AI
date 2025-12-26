
import sys
import os
import json
import cv2
import numpy as np
import onnxruntime as ort
import traceback
import base64

# Add the cloned project to the python path
# Add the cloned project to the python path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLONED_REPO_PATH = os.path.join(PROJECT_ROOT, 'sudoku-solver-computer-vision-cnn')
# sys.path.append(CLONED_REPO_PATH) # No longer needed as we are not importing from it

# --- Preprocessing functions imported from src.preprocess.build_features ---
# Copied here to avoid importing src.data.dataio which depends on torch (not installed in prod)

def perspective_transform(image, corners):
    def order_corner_points(corners):
        # Separate corners into individual points
        # Index 0 - top-right
        #       1 - top-left
        #       2 - bottom-left
        #       3 - bottom-right
        corners = [(corner[0], corner[1]) for corner in corners]
        top_r, top_l, bottom_l, bottom_r = (
            corners[3],
            corners[0],
            corners[1],
            corners[2],
        )
        return (top_l, top_r, bottom_r, bottom_l)

    # Order points in clockwise order
    ordered_corners = order_corner_points(corners)
    top_l, top_r, bottom_r, bottom_l = ordered_corners

    # Determine width of new image which is the max distance between
    # (bottom right and bottom left) or (top right and top left) x-coordinates
    width_A = np.sqrt(
        ((bottom_r[0] - bottom_l[0]) ** 2) + ((bottom_r[1] - bottom_l[1]) ** 2)
    )
    width_B = np.sqrt(((top_r[0] - top_l[0]) ** 2) + ((top_r[1] - top_l[1]) ** 2))
    width = max(int(width_A), int(width_B))

    # Determine height of new image which is the max distance between
    # (top right and bottom right) or (top left and bottom left) y-coordinates
    height_A = np.sqrt(
        ((top_r[0] - bottom_r[0]) ** 2) + ((top_r[1] - bottom_r[1]) ** 2)
    )
    height_B = np.sqrt(
        ((top_l[0] - bottom_l[0]) ** 2) + ((top_l[1] - bottom_l[1]) ** 2)
    )
    height = max(int(height_A), int(height_B))

    # Construct new points to obtain top-down view of image in
    # top_r, top_l, bottom_l, bottom_r order
    dimensions = np.array(
        [[0, 0], [width - 1, 0], [width - 1, height - 1], [0, height - 1]],
        dtype="float32",
    )

    # Convert to Numpy format
    ordered_corners = np.array(ordered_corners, dtype="float32")

    # Find perspective transform matrix
    matrix = cv2.getPerspectiveTransform(ordered_corners, dimensions)

    # Return the transformed image
    return cv2.warpPerspective(image, matrix, (width, height))


def extract_cells_with_coords_from_warped_image(image):
    h, w = image.shape[:2]
    cell_h, cell_w = h // 9, w // 9

    cells = []
    for i in range(9):
        for j in range(9):
            x, y = j * cell_w, i * cell_h
            cells.append(
                {
                    "image": image[y : y + cell_h, x : x + cell_w],
                    "coords": (x, y, cell_w, cell_h),
                }
            )
    return cells


def finding_sudoku_mask(image):
    sudoku_gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    # BLur
    sudoku_blur = cv2.GaussianBlur(sudoku_gray, (5, 5), 0)
    thresh = cv2.adaptiveThreshold(
        sudoku_blur, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY_INV, 11, 3
    )
    dilate = cv2.dilate(thresh, kernel=np.ones((3, 3), np.uint8), iterations=1)
    closing = cv2.morphologyEx(dilate, cv2.MORPH_CLOSE, np.ones((3, 3)))

    return closing


def extract_sudoku_grid(image, mask):
    # Find Contours
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Sort contours by area in descending order and convert to list to avoid Empty Sequence error
    contours = sorted(contours, key=cv2.contourArea, reverse=True)
    
    if not contours:
        return np.array([])

    largest_contour = contours[0]

    # Draw Contour on the image (optional, for debug/UI)
    # cv2.drawContours(image, [largest_contour], -1, (0, 0, 255), 2)

    peri = cv2.arcLength(largest_contour, True)  # Get the perimeter
    approx = cv2.approxPolyDP(
        largest_contour, 0.02 * peri, True
    )  # Przyblizanie konturu 2 % obwodu ( True Zamkniety kontur)

    # If we still don't have 4 points
    if len(approx) != 4:
        rect = cv2.minAreaRect(
            largest_contour
        )  # MinAreaRect zwraca prostokat, ktory ma najmniejsza powierzchnie i zawiera kontur
        box = cv2.boxPoints(
            rect
        )  # BoxPoints zwraca 4 punkty, ktore sa wierzcholkami prostokata
        approx = np.array(box)

    corners = approx.reshape(4, 2)  # Reshape to 4x2 array

    return corners


def process_sudoku_image(image, invert_for_mnist_compatibility=True):
    try:
        # Get sudoku box
        mask = finding_sudoku_mask(image.copy())
        corners = extract_sudoku_grid(image.copy(), mask)
        
        if len(corners) != 4:
             return None, None, None
             
        warped = perspective_transform(image, corners)

        # Process cells
        cells_data = extract_cells_with_coords_from_warped_image(warped)
        processed_cells = []
        coords = []

        for cell in cells_data:
            # Convert to grayscale
            gray = cv2.cvtColor(cell["image"], cv2.COLOR_BGR2GRAY)

            # Apply Otsu's thresholding - FIX: Use THRESH_BINARY (not INV) to match MNIST
            if invert_for_mnist_compatibility:
                # MNIST format: black background, white digits
                _, binary = cv2.threshold(
                    gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU
                )
            else:
                # Original format: white background, black digits
                _, binary = cv2.threshold(
                    gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU
                )

            # Resize to 28x28 and normalize to [0,1] range
            processed = cv2.resize(binary, (28, 28)) / 255.0

            processed_cells.append(processed)
            coords.append(cell["coords"])

        return np.array(processed_cells), coords, warped
    except Exception as e:
        # print(f"Error: {e}")
        return None, None, None

# -------------------------------------------------------------------

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
