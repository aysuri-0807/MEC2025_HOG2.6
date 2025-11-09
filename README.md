AS # Phoenix - Wildfire Prediction Frontend

A React-based frontend application for wildfire prediction and management, focused on city infrastructure protection. This application integrates with a Python backend and provides AI-powered analysis capabilities.

# To run Frontend along with Backend
- Download all files/folders and put them into one folder
- Open in IDE, and run these 2 commands each in 2 seperate terminals, npm run dev, python api_server.py

## Features

- **AI Chatbot**: Floating chatbot interface (bottom center) that smoothly appears when the input box is clicked. Sends messages directly to backend for processing. Exit button sends 'exit' message before closing.
- **Image Upload & Analysis**: Upload satellite/aerial imagery (128x128 pixels) with detailed AI-powered analysis, community contribution tracking, and impact stories
- **Interactive Fire Map**: Real-time map showing wildfires, user location, city search functionality, nearest shelters, air quality index, and safety information
- **Alerts System**: Submit and view wildfire alerts with validation, search functionality, and community reporting
- **Home Dashboard**: Feature overview and mission statement with smooth animations
- **Automatic Location Detection**: GPS-based location tracking for map features
- **Backend Integration**: Seamless integration with Python backend for image processing, chat, and wildfire data

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Python backend running on `http://localhost:8000` (default)
- GitHub Personal Access Token (optional, for saving images/alerts to repository)

## Installation

1. Install frontend dependencies:
```bash
npm install
```

2. Install Python backend dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file in the root directory (optional):
```env
VITE_BACKEND_API_URL=http://localhost:8000
VITE_GITHUB_TOKEN=your_github_token_here
```

**Note:** The frontend is fully interactive even without the backend. Backend calls will show user-friendly error messages if the backend is not running.

## Running the Application

You need **TWO terminal windows** - one for the Python backend and one for the React frontend.

### Terminal 1: Python Backend Server

1. Navigate to your project directory
2. Run the Python server:
```bash
python api_server.py
```
3. **Keep this terminal open** - you should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Terminal 2: React Frontend Server

1. Open a **NEW** terminal/command prompt window
2. Navigate to the same project directory
3. Run the frontend:
```bash
npm run dev
```
4. **Keep this terminal open** - you should see:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:3000/
```

### Access Your App

Open your browser and go to: **http://localhost:3000**

The frontend will automatically connect to the backend on port 8000.

**Quick Summary:**
- **Terminal 1**: `python api_server.py` (Backend - port 8000)
- **Terminal 2**: `npm run dev` (Frontend - port 3000)
- Both must be running at the same time!

## Quick Testing

The UI is **fully interactive** right now! You can:

✅ **Test without backend:**
- Navigate between tabs
- Select and preview images
- Type in the chatbot (will show message if backend not running)
- All buttons and UI elements work

❌ **Will show errors (but UI still works):**
- "Submit" button - if backend not running
- Chatbot messages - if backend not running
- Fire map data - shows demo data if backend not running
- GitHub file saving - if GitHub token not configured

## Project Structure

```
src/
├── components/
│   ├── Chatbot.jsx          # Chatbot component that handles message display and backend communication
│   ├── FloatingChatbot.jsx  # Floating chatbot input box and sliding panel interface
│   ├── ImageUpload.jsx      # Image upload, analysis, and community contribution component
│   ├── FireMap.jsx          # Interactive map with wildfires, city search, and safety information
│   ├── Alerts.jsx           # Wildfire alert submission and viewing component
│   ├── Home.jsx             # Home page with features and mission statement
│   ├── Dashboard.jsx        # Main dashboard layout with tab navigation
│   └── MouseGradient.jsx   # Mouse-following gradient light effect component
├── utils/
│   ├── api.js              # Backend API integration utilities and HTTP client
│   ├── geolocation.js      # Location detection and GPS utilities
│   └── github.js           # GitHub API utilities for saving files to repository
├── App.jsx                 # Main app component with theme and animated background
├── main.jsx                # React entry point and error handling
└── index.css               # Global styles
```

## Backend API Endpoints

The frontend expects the following backend endpoints:

- `POST /api/chat` - Send chat messages (returns AI response)
- `POST /api/upload-image` - Upload image with location for processing (returns analysis/prediction)
- `GET /api/status` - Get current wildfire/system status
- `GET /api/wildfires/nearby` - Get wildfires near a location (for map)
- `GET /api/wildfires/active` - Get all active wildfires (for map)
- `GET /api/location/safety` - Get safety info (shelters, AQI) for a location
- `POST /api/infrastructure/recommendations` - Get infrastructure protection recommendations

## Environment Variables

- `VITE_BACKEND_API_URL`: Backend API base URL (default: `http://localhost:8000`)
- `VITE_GITHUB_TOKEN`: GitHub Personal Access Token for saving files to repository (optional)

## Building for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Python Backend Files

- `chatbot.py` - Main chatbot function with wildfire-focused instructions
- `getResponse.py` - Google Gemini API integration
- `api_server.py` - FastAPI server that exposes the chatbot as a REST API
- `requirements.txt` - Python dependencies

## Integration with Python Backend

The frontend is configured to communicate with the Python backend through:

1. **API Client** (`src/utils/api.js`): Handles all HTTP requests to the backend
2. **Proxy Configuration** (`vite.config.js`): Proxies `/api` requests to the backend during development
3. **Chat Messages**: Sends messages to `/api/chat` for backend processing (uses Gemini API)
4. **Image Upload**: Sends images as multipart/form-data to the backend, displays analysis results
5. **Status Monitoring**: Periodically fetches wildfire status from the backend

### Backend API Endpoints

- `POST /api/chat` - Send chat messages
  - Request: `{ "message": "your message here" }`
  - Response: `{ "response": "chatbot response" }`
- `GET /api/status` - Check system status
  - Response: `{ "status": "Operational", "service": "Phoenix AID Chatbot" }`

**Note:** The Gemini API key is configured in `getResponse.py`. The chatbot is configured for wildfire-related assistance with responses limited to 3-4 sentences.

## GitHub Integration

The application can save uploaded images and alerts directly to your GitHub repository:

1. **Images**: Saved to `uploads/` folder in the repository
2. **Alerts**: Appended to `Alerts.csv` file
3. **Setup**: Create a GitHub Personal Access Token with `repo` scope and add to `.env` as `VITE_GITHUB_TOKEN`

**Note**: Without the token, the app will still work but won't save files to GitHub. Images will still appear in "Previous Uploads" section.

## Deployment

The application is configured for GitHub Pages deployment with automatic deployment via GitHub Actions. Simply push to the `main` branch and the site will be automatically built and deployed.

**Note**: To enable GitHub file saving (images and alerts), you need to set up a GitHub Personal Access Token. See the GitHub Integration section below.

## Notes

- The chatbot sends messages directly to the backend for processing
- The backend should handle CORS if running on a different origin
- Image uploads must be exactly 128x128 pixels
- The application is designed for city infrastructure management
- All features work with demo data when backend is not connected
- Uploaded images appear in "Previous Uploads" even without GitHub token



