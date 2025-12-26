import torch
import torch.onnx
import os
import sys

# Add the project root to the path so we can import the model
# Add the submodule to the path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
submodule_path = os.path.join(project_root, 'sudoku-solver-computer-vision-cnn')
sys.path.append(submodule_path)

from src.model.model import ConvNet

def convert_to_onnx():
    # Define paths
    base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    model_path = os.path.join(base_path, 'sudoku-solver-computer-vision-cnn', 'models', '50epochs_convnet_sudoku_only.pkl')
    onnx_path = os.path.join(base_path, 'sudoku-solver-computer-vision-cnn', 'models', 'model.onnx')

    print(f"Loading model from: {model_path}")

    # Load the model
    # Note: Using map_location='cpu' to ensure it loads even if trained on GPU
    device = torch.device('cpu')
    model = ConvNet()
    
    # Load weights
    if os.path.exists(model_path):
        state_dict = torch.load(model_path, map_location=device)
        model.load_state_dict(state_dict)
        print("Model weights loaded successfully.")
    else:
        print(f"Error: Model file not found at {model_path}")
        return

    model.eval()

    # Create dummy input for export (Batch Size, Channels, Height, Width)
    # MNIST-like input but model expects 3 channels (RGB-like): 3 channels, 28x28 images
    dummy_input = torch.randn(1, 3, 28, 28, device=device)

    print(f"Exporting model to: {onnx_path}")

    # Export to ONNX
    torch.onnx.export(
        model,
        dummy_input,
        onnx_path,
        export_params=True,        # Store the trained parameter weights inside the model file
        opset_version=11,          # The ONNX version to export the model to
        do_constant_folding=True,  # Whether to execute constant folding for optimization
        input_names=['input'],     # The model's input names
        output_names=['output'],   # The model's output names
        dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}} # Variable batch size
    )

    print("Model converted to ONNX successfully!")

if __name__ == "__main__":
    try:
        convert_to_onnx()
    except ImportError as e:
        print(f"ImportError: {e}. Make sure you are running this from the project root or have the PYTHONPATH set correctly.")
    except Exception as e:
        print(f"An error occurred: {e}")
