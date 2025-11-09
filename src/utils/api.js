/**
 * Backend API integration utilities.
 * Provides HTTP client configuration and functions for communicating with the Python backend,
 * including image uploads, chat messages, wildfire data, and location safety information.
 * 
 * @author Ammaar Shareef
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout for image processing
});

// Image upload API
export const uploadImage = async (file, additionalData = {}) => {
  const formData = new FormData();
  formData.append('image', file);
  
  // Append any additional data
  Object.keys(additionalData).forEach(key => {
    formData.append(key, additionalData[key]);
  });

  try {
    const response = await apiClient.post('/api/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Image upload error:', error);
    // Provide user-friendly error message
    if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
      error.userMessage = 'Cannot connect to backend. Please ensure your Python backend is running on ' + API_BASE_URL;
    } else if (error.response) {
      error.userMessage = error.response.data?.message || error.response.data?.detail || 'Backend returned an error';
    } else {
      error.userMessage = 'Failed to upload image. Please check your backend connection.';
    }
    throw error;
  }
};

// Wildfire prediction API
export const predictWildfire = async (imageData) => {
  try {
    const response = await apiClient.post('/api/predict', imageData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Prediction error:', error);
    if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
      error.userMessage = 'Cannot connect to backend. Please ensure your Python backend is running on ' + API_BASE_URL;
    } else if (error.response) {
      error.userMessage = error.response.data?.message || error.response.data?.detail || 'Backend returned an error';
    } else {
      error.userMessage = 'Failed to get prediction. Please check your backend connection.';
    }
    throw error;
  }
};

// Get wildfire status/updates
export const getWildfireStatus = async () => {
  try {
    const response = await apiClient.get('/api/status');
    return response.data;
  } catch (error) {
    // Don't throw for status - it's non-critical
    console.error('Status fetch error:', error);
    return null;
  }
};

// Get infrastructure recommendations during wildfire
export const getInfrastructureRecommendations = async (wildfireData) => {
  try {
    const response = await apiClient.post('/api/infrastructure/recommendations', wildfireData);
    return response.data;
  } catch (error) {
    console.error('Recommendations error:', error);
    throw error;
  }
};

// Get wildfires near a location
export const getWildfiresNearLocation = async (lat, lng, radius = 50) => {
  try {
    const response = await apiClient.get('/api/wildfires/nearby', {
      params: {
        lat,
        lng,
        radius // radius in kilometers
      }
    });
    return response.data;
  } catch (error) {
    console.error('Get wildfires error:', error);
    if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
      error.userMessage = 'Cannot connect to backend. Please ensure your Python backend is running on ' + API_BASE_URL;
    } else if (error.response) {
      error.userMessage = error.response.data?.message || error.response.data?.detail || 'Backend returned an error';
    } else {
      error.userMessage = 'Failed to fetch wildfire data. Please check your backend connection.';
    }
    throw error;
  }
};

// Get all active wildfires
export const getAllActiveWildfires = async () => {
  try {
    const response = await apiClient.get('/api/wildfires/active');
    return response.data;
  } catch (error) {
    console.error('Get active wildfires error:', error);
    if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
      error.userMessage = 'Cannot connect to backend. Please ensure your Python backend is running on ' + API_BASE_URL;
    } else if (error.response) {
      error.userMessage = error.response.data?.message || error.response.data?.detail || 'Backend returned an error';
    } else {
      error.userMessage = 'Failed to fetch wildfire data. Please check your backend connection.';
    }
    throw error;
  }
};

// Upload image with location
export const uploadImageWithLocation = async (file, location, additionalData = {}) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('latitude', location.lat.toString());
  formData.append('longitude', location.lng.toString());
  
  // Append any additional data
  Object.keys(additionalData).forEach(key => {
    formData.append(key, additionalData[key]);
  });

  try {
    const response = await apiClient.post('/api/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Image upload error:', error);
    if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
      error.userMessage = 'Cannot connect to backend. Please ensure your Python backend is running on ' + API_BASE_URL;
    } else if (error.response) {
      error.userMessage = error.response.data?.message || error.response.data?.detail || 'Backend returned an error';
    } else {
      error.userMessage = 'Failed to upload image. Please check your backend connection.';
    }
    throw error;
  }
};

// Get location safety info (shelters, AQI, safety status)
export const getLocationSafetyInfo = async (lat, lng) => {
  try {
    const response = await apiClient.get('/api/location/safety', {
      params: {
        lat,
        lng
      }
    });
    return response.data;
  } catch (error) {
    console.error('Get location safety info error:', error);
    // Return mock data if backend not available
    if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
      return getMockSafetyInfo(lat, lng);
    }
    throw error;
  }
};

// Mock safety info for demonstration
const getMockSafetyInfo = (lat, lng) => {
  return {
    air_quality_index: Math.floor(Math.random() * 50) + 50, // 50-100
    air_quality_status: 'Moderate',
    safety_status: 'Moderate',
    outdoor_safety: 'Use caution',
    nearest_shelters: [
      {
        name: 'Community Center',
        address: '123 Main St',
        distance_km: 2.5,
        capacity: 200,
        lat: lat + 0.02,
        lng: lng + 0.02
      },
      {
        name: 'High School Gym',
        address: '456 Oak Ave',
        distance_km: 4.8,
        capacity: 500,
        lat: lat - 0.03,
        lng: lng + 0.04
      }
    ],
    recommendations: [
      'Stay indoors if possible',
      'Keep windows closed',
      'Use air purifier if available'
    ]
  };
};

// Send chat message to backend
// Backend expects: { "message": "string" }
// Backend returns: { "response": "string" }
export const sendChatMessage = async (message) => {
  try {
    const response = await apiClient.post('/api/chat', {
      message: message
    });
    // Backend returns { "response": "string" }
    const responseData = response.data;
    // Handle different response formats
    if (typeof responseData === 'string') {
      return responseData;
    } else if (responseData.response) {
      return responseData.response;
    } else if (responseData.message) {
      return responseData.message;
    } else {
      return JSON.stringify(responseData);
    }
  } catch (error) {
    console.error('Chat message error:', error);
    if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
      error.userMessage = 'Cannot connect to backend. Please ensure your Python backend is running on ' + API_BASE_URL;
    } else if (error.response) {
      error.userMessage = error.response.data?.message || error.response.data?.detail || 'Backend returned an error';
    } else {
      error.userMessage = 'Failed to send message. Please check your backend connection.';
    }
    throw error;
  }
};

export default apiClient;

