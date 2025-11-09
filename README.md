# Phoenix AID - Wildfire Prediction Frontend

A React-based frontend application for wildfire prediction and management, focused on city infrastructure protection. This application integrates with a Python backend and provides AI-powered analysis capabilities.

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
- Gemini API key (for chatbot functionality)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
VITE_BACKEND_API_URL=http://localhost:8000
VITE_GEMINI_API_KEY=AIzaSyCkt1dcG3QBnHyZZ8A2PoUJ4Ym6tpldQ8c
```

**Note:** The frontend is fully interactive even without the backend or Gemini API key. Backend calls will show user-friendly error messages if the backend is not running.

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Quick Testing

The UI is **fully interactive** right now! You can:

✅ **Test without backend:**
- Navigate between tabs
- Select and preview images
- Type in the chatbot (will show error without Gemini API key)
- All buttons and UI elements work

❌ **Will show errors (but UI still works):**
- "Submit" button - if backend not running
- Chatbot messages - if Gemini API key not set
- "Analyze with Gemini" - if Gemini API key not set
- Fire map data - shows demo data if backend not running

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
│   └── geolocation.js      # Location detection and GPS utilities
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
- `VITE_GEMINI_API_KEY`: Google Gemini API key for chatbot functionality

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

## Integration with Python Backend

The frontend is configured to communicate with the Python backend through:

1. **API Client** (`src/utils/api.js`): Handles all HTTP requests to the backend
2. **Proxy Configuration** (`vite.config.js`): Proxies `/api` requests to the backend during development
3. **Chat Messages**: Sends messages to `/api/chat`, falls back to Gemini if backend unavailable
4. **Image Upload**: Sends images as multipart/form-data to the backend, replaces demo analysis with backend response
5. **Status Monitoring**: Periodically fetches wildfire status from the backend

See `BACKEND_CONNECTION_GUIDE.md` for detailed backend integration instructions and example code.

## Deployment

The application is configured for GitHub Pages deployment. See `DEPLOYMENT.md` for detailed instructions.

## Notes

- The chatbot sends messages directly to the backend for processing
- The backend should handle CORS if running on a different origin
- Image uploads must be exactly 128x128 pixels
- The application is designed for city infrastructure management, not end-user consumption
- All features work with demo data when backend is not connected
