from SatelliteAI.CNN import FireDetectionNN 
import torch 
from torchvision import transforms 
from PIL import Image 
'''
Description: Function to use the AI to analyze an image
Author: Andy Suri 
'''
# Preprocessing function
preprocess = transforms.Compose([
    transforms.Resize((128, 128)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5])
])

model = FireDetectionNN()
model.load_state_dict(torch.load("FireDetectionNN.pth"))
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
    img = Image.open(image_path).convert('RGB')
    img_tensor = preprocess(img).unsqueeze(0)
    with torch.no_grad():
        outputs = model(img_tensor)
        _, predicted = torch.max(outputs, 1)
    return predicted.item()

if __name__ == '__main__':
    pat = r"C:\Users\ands1\Downloads\image_satellite_test.png"
    a = predict(pat) 
    print (a)