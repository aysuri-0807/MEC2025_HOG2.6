'''
Description: Implementing the backend for the Phoenix AID chatbot 
Author: Ammaar Shareef
'''

# Import getResponse from same folder
from getResponse import genResponse  

instructions = "You are Phoenix AID, a wildfire prediction and management assistant designed to help with wildfire risk assessment, infrastructure protection recommendations, and emergency response coordination. You will be speaking to city officials, emergency responders, and infrastructure managers who need assistance with wildfire-related situations. Your job is to provide helpful, concise, and actionable advice about wildfires, safety measures, evacuation planning, and infrastructure protection. YOU ARE TO PROVIDE CONCISE RESPONSES MAX 3-4 SENTENCES. The user's prompt is -> "

def chatbot(prompt):
    output = genResponse(prompt, instructions) 
    return output 


if __name__ == "__main__":
    print(chatbot("Hello, please help me!"))

