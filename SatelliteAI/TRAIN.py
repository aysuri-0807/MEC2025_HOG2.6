import torch 
import torch.nn as nn 
import torch.nn.functional as F 
from torch.utils.data import DataLoader 
from torchvision import datasets, transforms 
from CNN import * 
from tqdm import tqdm
'''
Description: Script to train the FireDetection AI Model using the FireRisk dataset
Author: Andy Suri 
'''

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

if torch.cuda.is_available():
    print ("USING GPU") 


model = FireDetectionNN(num_classes=7).to(device)

# 1️⃣ Define how to process each image
train_transforms = transforms.Compose([
    transforms.Resize((128, 128)),
    transforms.RandomHorizontalFlip(),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225])
])


# Transformations for validation — no random augmentations!
val_tfms = transforms.Compose([
    transforms.Resize((128, 128)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225])
])
eval_root = r"SatelliteAI\data\FireRisk\val" 
train_root = r"SatelliteAI\data\FireRisk\train"
# Create dataset
val_dataset = datasets.ImageFolder(root=eval_root, transform=val_tfms)

# Create DataLoader
val_loader = DataLoader(val_dataset, batch_size=32, shuffle=False)

# 2️⃣ Create a dataset (expects subfolders = class names)
train_dataset = datasets.ImageFolder(root=train_root, transform=train_transforms)

# 3️⃣ Wrap it in a DataLoader
train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)


criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=1e-4)


for epoch in range(20):  # increase epochs if needed
    model.train()
    running_loss = 0.0
    for images, labels in tqdm(train_loader):
        images, labels = images.to(device), labels.to(device)
        
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        
        running_loss += loss.item()

    print(f"Epoch {epoch+1} | Training Loss: {running_loss/len(train_loader):.4f}")
    
    # Validation
    model.eval()
    correct, total = 0, 0
    with torch.no_grad():
        for images, labels in val_loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            _, predicted = torch.max(outputs, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()
    print(f"Validation Accuracy: {100 * correct / total:.2f}%")


model_path = 'FireDetectionNN.pth' 

torch.save({
    'model_state_dict': model.state_dict(),
    'optimizer_state_dict': optimizer.state_dict(),
},model_path)