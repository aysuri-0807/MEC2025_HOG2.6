import torch
import torch.nn as nn
import os
from pathlib import Path
from torchvision import transforms, models
from PIL import Image
import torch.nn.functional as F
'''
Description: Function to use the AI to analyze an image
Author: Andy Suri 
'''

# Find model file path (in project root)
current_file = Path(__file__)
project_root = current_file.parent.parent
model_path = project_root / "FireDetectionNN.pth"

# Preprocessing function for ResNet50 (224x224, ImageNet normalization)
preprocess = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225])
])

# Initialize ResNet50 model (matching the saved model architecture)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
num_classes = 7
model = models.resnet50(weights=None)  # Don't load pretrained weights
model.fc = nn.Linear(model.fc.in_features, num_classes)

# Load the trained model weights
if os.path.exists(model_path):
    model.load_state_dict(torch.load(str(model_path), map_location=device))
else:
    raise FileNotFoundError(f"Model file not found at {model_path}")
model.to(device)
model.eval() 

# Mapping of model outputs to fire risk descriptions
FIRE_CLASSES = {
    0: ("🔥 Extreme Fire Damage", "#ff1a1a",
        "Severe fire damage detected. Immediate evacuation advised."),
    1: ("🔥 High Fire Risk", "#ff4d4d",
        "Extensive burned zones detected. Avoid entry until cleared by officials."),
    2: ("⚠️ Moderate Fire Risk", "#f39c12",
        "Partial vegetation loss or heat stress detected. Exercise caution."),
    3: ("🌿 Low Fire Risk", "#27ae60",
        "Area appears mostly safe with minimal fire indicators."),
    4: ("🌳 Healthy Vegetation", "#2ecc71",
        "No burn indicators detected. Area is green and stable."),
    5: ("🔥 Active Fire", "#e74c3c",
        "Active fire sources detected. Immediate response required."),
    6: ("🟤 Burned Area", "#b87333",
        "Region already burned. No ongoing fire but vegetation lost.")
}

def predict(image_path):
    """
    Predict fire risk from an image
    Args:
        image_path: Path to the image file
    Returns:
        int: Predicted fire risk class (0-6)
    """
    img = Image.open(image_path).convert('RGB')
    img_tensor = preprocess(img).unsqueeze(0).to(device)
    with torch.no_grad():
        outputs = model(img_tensor)
        _, predicted = torch.max(outputs, 1)
    return predicted.item()

if __name__ == '__main__':
    pat = r"C:\Users\ands1\Downloads\image_satellite_test.png"
    a = predict(pat) 
    print (a)