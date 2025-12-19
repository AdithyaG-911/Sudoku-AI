import cv2
import numpy as np
import os
import json
import glob

# Constants
DATA_DIR = os.path.join(os.path.dirname(__file__), '../data/training_real/v2_train')
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), '../data/real-data.json')
GRID_OUTPUT_FILE = os.path.join(os.path.dirname(__file__), '../data/grid-data.json')
TARGET_SIZE = 28
GRID_TARGET_SIZE = 128

def parse_dat_file(dat_path):
    """
    Parses the .dat file to find the 9x9 grid numbers.
    Lines 3-11 usually contain the grid.
    """
    with open(dat_path, 'r') as f:
        lines = [l.strip() for l in f.readlines() if l.strip()]

    grid = []
    # Skip first 2 lines (metadata)
    for line in lines[2:]:
        parts = line.split()
        row = []
        for p in parts:
            if p.isdigit():
                row.append(int(p))
        
        if len(row) == 9:
            grid.append(row)
            
    if len(grid) != 9:
        raise ValueError(f"Found {len(grid)} rows, expected 9")
        
    return grid

def order_points(pts):
    """
    Orders coordinates: top-left, top-right, bottom-right, bottom-left
    """
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    return rect

def four_point_transform(image, pts):
    """
    Warp perspective to get a top-down view of the grid.
    """
    rect = order_points(pts)
    (tl, tr, br, bl) = rect

    widthA = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
    widthB = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
    maxWidth = max(int(widthA), int(widthB))

    heightA = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
    heightB = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
    maxHeight = max(int(heightA), int(heightB))

    dst = np.array([
        [0, 0],
        [maxWidth - 1, 0],
        [maxWidth - 1, maxHeight - 1],
        [0, maxHeight - 1]], dtype="float32")

    M = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(image, M, (maxWidth, maxHeight))
    return warped

def preprocess_cell(cell_img):
    """
    Preprocess a single cell image:
    1. Grayscale
    2. Threshold / Invert
    3. Center of Mass
    4. Resize to 28x28
    """
    # 1. Grayscale (if not already)
    if cell_img is None or cell_img.size == 0:
        return None

    if len(cell_img.shape) > 2:
        gray = cv2.cvtColor(cell_img, cv2.COLOR_BGR2GRAY)
    else:
        gray = cell_img

    # 2. Invert and Threshold
    # Adaptive threshold works reasonably well
    thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                   cv2.THRESH_BINARY_INV, 57, 5)

    # 3. Clean noise
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)
    
    # 4. Find digit contour (largest central blob)
    contours, _ = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if not contours:
        return np.zeros((TARGET_SIZE, TARGET_SIZE), dtype=np.float32)

    # Find largest blob
    c = max(contours, key=cv2.contourArea)
    x, y, w, h = cv2.boundingRect(c)
    
    # Filter noise
    if w < 4 or h < 4:
         return np.zeros((TARGET_SIZE, TARGET_SIZE), dtype=np.float32)

    # Extract digit
    digit = thresh[y:y+h, x:x+w]
    
    # 5. Scale to 20x20 into 28x28
    h, w = digit.shape
    scale = 20.0 / max(h, w)
    nh, nw = int(h * scale), int(w * scale)
    
    if nh <= 0 or nw <= 0:
        return np.zeros((TARGET_SIZE, TARGET_SIZE), dtype=np.float32)

    resized = cv2.resize(digit, (nw, nh), interpolation=cv2.INTER_AREA)
    
    # Center on 28x28
    final = np.zeros((TARGET_SIZE, TARGET_SIZE), dtype=np.uint8)
    dx = (TARGET_SIZE - nw) // 2
    dy = (TARGET_SIZE - nh) // 2
    
    final[dy:dy+nh, dx:dx+nw] = resized
    
    # Normalize 0.0 - 1.0
    return final.astype(np.float32) / 255.0

def process_image(img_path, dat_path):
    """
    Full pipeline for one image. Returns cell data AND grid corner data.
    """
    # Load Image
    img = cv2.imread(img_path)
    if img is None:
        print(f"Could not load {img_path}")
        return [], [], None, None
        
    orig_h, orig_w = img.shape[:2]

    # Preprocess
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    thresh = cv2.adaptiveThreshold(blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                   cv2.THRESH_BINARY_INV, 11, 2)
    
    # Robustness: Connect broken lines using Morphological Closing
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
    
    # Find Grid
    contours, _ = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return [], [], None, None
        
    # Largest polygon is likely the grid
    contours = sorted(contours, key=cv2.contourArea, reverse=True)
    puzzle_cnt = None
    
    for c in contours:
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)
        if len(approx) == 4:
            puzzle_cnt = approx
            break
            
    if puzzle_cnt is None:
        return [], [], None, None
        
    # Prepare Grid Training Data (MobileNetV2 format: 224x224 RGB)
    # 1. Resize to 224x224
    # Note: MobileNet expects RGB. We use the original color image, not gray.
    grid_img_resized = cv2.resize(img, (224, 224), interpolation=cv2.INTER_AREA)
    
    # MobileNet expects inputs [-1, 1] or [0, 1] usually. 
    # We'll stick to [0, 1] and let the frontend handle specific normalization if needed.
    grid_img_norm = grid_img_resized.astype(np.float32) / 255.0
    
    # 2. Normalize corners to [0, 1]
    # puzzle_cnt is likely (4, 1, 2)
    pts = puzzle_cnt.reshape(4, 2).astype(np.float32)
    rect = order_points(pts) # TL, TR, BR, BL
    
    # Normalize coordinates by original width/height
    norm_rect = rect.copy()
    norm_rect[:, 0] = norm_rect[:, 0] / orig_w
    norm_rect[:, 1] = norm_rect[:, 1] / orig_h
    
    grid_points = norm_rect.flatten().tolist() # [x1, y1, x2, y2, x3, y3, x4, y4]
    
    # Flatten: MobileNet expects (224, 224, 3)
    grid_pixels = grid_img_norm.flatten().tolist()

    # Warp Grid for Cell Extraction
    warped = four_point_transform(img, puzzle_cnt.reshape(4, 2))
    
    # Parse Labels
    try:
        grid_labels = parse_dat_file(dat_path)
    except Exception as e:
        print(f"Error parsing dat {dat_path}: {e}")
        return [], [], None, None
        
    grid_flat = [item for sublist in grid_labels for item in sublist]
    
    # Slice Cells
    h, w = warped.shape[:2]
    cell_h = h // 9
    cell_w = w // 9
    
    images = []
    labels = []
    
    # Adaptive margin to avoid grid lines
    margin = 4
    
    for row in range(9):
        for col in range(9):
            y1 = row * cell_h + margin
            y2 = (row + 1) * cell_h - margin
            x1 = col * cell_w + margin
            x2 = (col + 1) * cell_w - margin
            
            cell = warped[y1:y2, x1:x2]
            
            processed = preprocess_cell(cell)
            if processed is None:
                continue
            
            label = grid_flat[row * 9 + col]
            if label == 0:
                label = 10 # Class 10 is empty
            
            images.append(processed.flatten().tolist())
            labels.append(label)
            
    return images, labels, grid_pixels, grid_points

def main():
    print(f"Searching {DATA_DIR}...")
    jpg_files = glob.glob(os.path.join(DATA_DIR, "*.jpg"))
    print(f"Found {len(jpg_files)} images.")
    
    all_images = []
    all_labels = []
    
    grid_inputs = []
    grid_targets = []
    
    for jpg in jpg_files:
        dat = jpg.replace('.jpg', '.dat')
        if not os.path.exists(dat):
            continue
            
        imgs, lbls, g_img, g_pts = process_image(jpg, dat)
        if imgs:
            all_images.extend(imgs)
            all_labels.extend(lbls)
            
            if g_img and g_pts:
                grid_inputs.append(g_img)
                grid_targets.append(g_pts)
                
            print('.', end='', flush=True)
        else:
            print('x', end='', flush=True)
            
    print(f"\nProcessed {len(all_labels)} cells.")
    print(f"Processed {len(grid_inputs)} grid samples.")
    
    # Save Digits Data
    dataset = {
        "images": all_images,
        "labels": all_labels
    }
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(dataset, f)
    print(f"Saved digits to {OUTPUT_FILE}")
    
    # Save Grid Data
    grid_dataset = {
        "images": grid_inputs,
        "labels": grid_targets
    }
    with open(GRID_OUTPUT_FILE, 'w') as f:
        json.dump(grid_dataset, f)
    print(f"Saved grids to {GRID_OUTPUT_FILE}")

if __name__ == "__main__":
    main()
