import torch
import torch.nn as nn
from torchvision import models

# Load pretrained ResNet50 (weights trained on ImageNet)
model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V1)

# Modify the classifier head for your dataset
num_classes = 7  # Change to match your FireRisk dataset
model.fc = nn.Linear(model.fc.in_features, num_classes)


# Freeze lower layers if you don’t want to retrain everything
for param in model.layer1.parameters():
    param.requires_grad = False
for param in model.layer2.parameters():
    param.requires_grad = False

# Move model to device
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)

torch.save(model.state_dict(), "FireDetectionNN.pth")

import torch
from torchvision import models, transforms
from PIL import Image
import torch.nn.functional as F

# 🔧 Load pretrained ResNet and modify head
num_classes = 7
model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V1)
model.fc = torch.nn.Linear(model.fc.in_features, num_classes)

# Load your fine-tuned weights
model.load_state_dict(torch.load("FireDetectionNN.pth", map_location="cpu"))
model.eval()

# 🔍 Define preprocessing (must match training)
preprocess = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225])
])


def predict_fire_risk(image_path):
    image = Image.open(image_path).convert("RGB")
    img_tensor = preprocess(image).unsqueeze(0)

    with torch.no_grad():
        outputs = model(img_tensor)
        probs = F.softmax(outputs, dim=1)
        conf, pred = torch.max(probs, 1)

    return pred.item()


#Testing

if __name__ == "__main__":
    path = r"C:\Users\ands1\Downloads\image_satellite_test.png"
    label, conf = predict_fire_risk(path)
    print(f"Prediction: {label} ({conf:.2f}% confidence)")
