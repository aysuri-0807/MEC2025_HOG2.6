import torch #Basic module 
import torch.nn as nn#Neural Network defining requisites
import torch.optim as optim #Provides predefined optimization functions (these are great) 
import torch.nn.functional as F #Provides access to common functions needed within CNNs 
'''
Description: Custom Neural Network for the FireRisk detection AI 
Author: Andy Suri
'''



class FireDetectionNN(nn.Module): #Create a child class inheriting from torchs neural network class
    def __init__(self,num_classes=7):
        super(FireDetectionNN,self).__init__() #Call the init function of the parent class, this sets up dependencies
        self.conv1 = nn.Conv2d(3, 32, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm2d(32)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm2d(64)
        self.pool = nn.MaxPool2d(2, 2)
        
        self.conv3 = nn.Conv2d(64, 128, kernel_size=3, padding=1)
        self.bn3 = nn.BatchNorm2d(128)
        
        self.fc1 = nn.Linear(128 * 16 * 16, 256)  # adjust if input image size changes
        self.drop = nn.Dropout(0.5)
        self.fc2 = nn.Linear(256, num_classes)
    def forward(self,x): 
        x = self.pool(F.relu(self.bn1(self.conv1(x))))
        x = self.pool(F.relu(self.bn2(self.conv2(x))))
        x = self.pool(F.relu(self.bn3(self.conv3(x))))
        x = x.view(x.size(0), -1)
        x = self.drop(F.relu(self.fc1(x)))
        x = self.fc2(x)
        return x
        