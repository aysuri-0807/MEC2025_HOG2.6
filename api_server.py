'''
FastAPI server for Phoenix AID chatbot integration
Author: Ammaar Shareef
'''

import sys
import os
import tempfile
from pathlib import Path
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add project root and ChatBot folder to path to import modules
current_dir = Path(__file__).parent
chatbot_dir = current_dir / "ChatBot"
sys.path.insert(0, str(current_dir))
sys.path.insert(0, str(chatbot_dir))

# Import chatbot from ChatBot folder
from ChatBot.chatbot import chatbot

# Import SatelliteAI for image analysis
try:
    from SatelliteAI.SatelliteAI import predict, FIRE_CLASSES
    SATELLITE_AI_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Could not import SatelliteAI: {e}")
    SATELLITE_AI_AVAILABLE = False
    FIRE_CLASSES = {}

app = FastAPI(title="Phoenix AID API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessage(BaseModel):
    message: str

@app.post("/api/chat")
async def chat_endpoint(chat_message: ChatMessage):
    """
    Chat endpoint that processes messages using the chatbot.py function
    """
    try:
        user_message = chat_message.message
        
        # Handle exit command
        if user_message.lower().strip() == 'exit':
            return {"response": "Goodbye! Stay safe."}
        
        # Get response from chatbot
        response = chatbot(user_message)
        
        return {"response": response}
    except Exception as e:
        return {"response": f"Error processing message: {str(e)}"}

@app.post("/api/upload-image")
async def upload_image(image: UploadFile = File(...)):
    """
    Image upload endpoint that analyzes images using SatelliteAI
    Returns raw analysis string from the AI model
    """
    if not SATELLITE_AI_AVAILABLE:
        return {
            "error": "SatelliteAI not available",
            "message": "Image analysis module could not be loaded. Please check dependencies.",
            "analysis": None
        }
    
    temp_file_path = None
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(image.filename)[1]) as temp_file:
            content = await image.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        # Run prediction using SatelliteAI
        prediction_class = predict(temp_file_path)
        
        # Get analysis from FIRE_CLASSES mapping
        if prediction_class in FIRE_CLASSES:
            fire_label, fire_color, fire_description = FIRE_CLASSES[prediction_class]
            # Return raw analysis string as requested
            analysis = f"{fire_label}\n\n{fire_description}\n\nFire Risk Class: {prediction_class}"
        else:
            analysis = f"Fire Risk Class: {prediction_class}\n\nAnalysis completed successfully."
        
        return {
            "message": "Image analyzed successfully",
            "analysis": analysis,
            "prediction": prediction_class,
            "status": "success"
        }
        
    except Exception as e:
        error_msg = f"Error analyzing image: {str(e)}"
        print(error_msg)
        return {
            "error": error_msg,
            "message": "Failed to analyze image",
            "analysis": None,
            "status": "error"
        }
    finally:
        # Clean up temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except Exception as e:
                print(f"Warning: Could not delete temp file {temp_file_path}: {e}")

@app.get("/api/status")
async def status():
    """
    System status endpoint
    """
    return {
        "status": "Operational",
        "service": "Phoenix AID Chatbot",
        "satellite_ai_available": SATELLITE_AI_AVAILABLE
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

