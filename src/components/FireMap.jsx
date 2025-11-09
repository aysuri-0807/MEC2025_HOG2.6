/**
 * Interactive fire map component.
 * Displays wildfires, user location, city search functionality, nearest shelters,
 * air quality index, and safety information on an interactive Leaflet map.
 * 
 * @author Ammaar Shareef
 */
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Grid,
  TextField,
  InputAdornment,
} from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import RefreshIcon from '@mui/icons-material/Refresh';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import HomeIcon from '@mui/icons-material/Home';
import AirIcon from '@mui/icons-material/Air';
import WarningIcon from '@mui/icons-material/Warning';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { getCurrentLocation, watchLocation, stopWatchingLocation } from '../utils/geolocation';
import { getWildfiresNearLocation, getAllActiveWildfires, getLocationSafetyInfo } from '../utils/api';
import MouseGradient from './MouseGradient';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom fire icon based on intensity
const createFireIcon = (intensity) => {
  const colors = {
    low: '#ff9800',      // Orange
    medium: '#ff5722',   // Deep Orange
    high: '#d32f2f',     // Red
    critical: '#b71c1c'  // Dark Red
  };
  
  const color = colors[intensity] || colors.medium;
  const size = intensity === 'critical' ? 30 : intensity === 'high' ? 25 : intensity === 'medium' ? 20 : 15;
  
  return L.divIcon({
    className: 'custom-fire-icon',
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background-color: ${color};
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 10px ${color};
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: ${size * 0.4}px;
    ">🔥</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// Component to center map on location
function MapCenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      map.setView(center, zoom, { animate: true, duration: 0.5 });
    }
  }, [center, zoom, map]);
  return null;
}

const FireMap = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [wildfires, setWildfires] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [wildfireError, setWildfireError] = useState(null);
  const [mapCenter, setMapCenter] = useState([37.7749, -122.4194]); // Default: San Francisco
  const [mapZoom, setMapZoom] = useState(10);
  const [safetyInfo, setSafetyInfo] = useState(null);
  const [searchCity, setSearchCity] = useState('');
  const [searchingCity, setSearchingCity] = useState(false);
  const [searchedLocation, setSearchedLocation] = useState(null);
  const watchIdRef = useRef(null);

  // Get user location on mount
  useEffect(() => {
    requestLocation();
    return () => {
      if (watchIdRef.current) {
        stopWatchingLocation(watchIdRef.current);
      }
    };
  }, []);

  // Fetch wildfires and safety info when location is available
  useEffect(() => {
    const locationToUse = searchedLocation || userLocation;
    if (locationToUse) {
      // Fetch immediately
      const fetchData = async () => {
        await fetchWildfires();
        await fetchSafetyInfo();
      };
      fetchData();
      
      // Set up periodic updates every 30 seconds
      const interval = setInterval(() => {
        fetchData();
      }, 30000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation, searchedLocation]);

  const requestLocation = async () => {
    setLoading(true);
    setLocationError(null);
    
    try {
      const location = await getCurrentLocation();
      setUserLocation(location);
      setMapCenter([location.lat, location.lng]);
      setMapZoom(13);
      
      // Start watching location for updates
      watchIdRef.current = watchLocation((newLocation) => {
        setUserLocation(newLocation);
      });
    } catch (error) {
      setLocationError(error.message);
      // Try to fetch wildfires anyway (without user location)
      fetchWildfires();
    } finally {
      setLoading(false);
    }
  };

  const fetchWildfires = async () => {
    setWildfireError(null);
    
    try {
      let data;
      const locationToUse = searchedLocation || userLocation;
      if (locationToUse) {
        // Fetch wildfires near location (50km radius)
        data = await getWildfiresNearLocation(locationToUse.lat, locationToUse.lng, 50);
      } else {
        // Fetch all active wildfires if no location
        data = await getAllActiveWildfires();
      }
      
      // Handle different response formats
      if (Array.isArray(data)) {
        setWildfires(data);
      } else if (data.wildfires) {
        setWildfires(data.wildfires);
      } else if (data.data) {
        setWildfires(data.data);
      } else {
        setWildfires([]);
      }
    } catch (error) {
      setWildfireError(error.userMessage || error.message || 'Failed to fetch wildfire data');
      // Set mock data for demonstration if backend is not available
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        const locationToUse = searchedLocation || userLocation;
        if (locationToUse) {
          setWildfires(getMockWildfires(locationToUse));
        } else {
          setWildfires([]);
        }
      }
    }
  };

  const fetchSafetyInfo = async () => {
    const locationToUse = searchedLocation || userLocation;
    if (!locationToUse) return;
    
    try {
      const info = await getLocationSafetyInfo(locationToUse.lat, locationToUse.lng);
      setSafetyInfo(info);
    } catch (error) {
      console.error('Failed to fetch safety info:', error);
      // Always use mock data for demo
      setSafetyInfo(getMockSafetyInfo(locationToUse.lat, locationToUse.lng));
    }
  };

  // Simple city geocoding (mock - in production, use a real geocoding API)
  const geocodeCity = async (cityName) => {
    // Mock city coordinates - in production, use a geocoding service
    const cityCoordinates = {
      'san francisco': { lat: 37.7749, lng: -122.4194 },
      'los angeles': { lat: 34.0522, lng: -118.2437 },
      'san diego': { lat: 32.7157, lng: -117.1611 },
      'sacramento': { lat: 38.5816, lng: -121.4944 },
      'oakland': { lat: 37.8044, lng: -122.2712 },
      'fresno': { lat: 36.7378, lng: -119.7871 },
      'san jose': { lat: 37.3382, lng: -121.8863 },
      'long beach': { lat: 33.7701, lng: -118.1937 },
      'anaheim': { lat: 33.8366, lng: -117.9143 },
      'santa ana': { lat: 33.7455, lng: -117.8677 },
    };

    const normalizedName = cityName.toLowerCase().trim();
    const coords = cityCoordinates[normalizedName];
    
    if (coords) {
      return coords;
    }
    
    // If not found in mock data, return a default location (San Francisco)
    // In production, you would call a real geocoding API here
    throw new Error('City not found. Please try: San Francisco, Los Angeles, San Diego, Sacramento, Oakland, Fresno, San Jose, Long Beach, Anaheim, or Santa Ana');
  };

  const handleCitySearch = async () => {
    if (!searchCity.trim()) return;

    setSearchingCity(true);
    setLocationError(null);
    
    try {
      const coords = await geocodeCity(searchCity);
      const newLocation = { lat: coords.lat, lng: coords.lng };
      setSearchedLocation(newLocation);
      setMapCenter([coords.lat, coords.lng]);
      setMapZoom(12);
      
      // Immediately generate and set demo fires for the searched city
      const demoFires = getMockWildfires(newLocation);
      setWildfires(demoFires);
      setWildfireError(null);
      
      // Also fetch safety info for the new location
      setSafetyInfo(getMockSafetyInfo(coords.lat, coords.lng));
    } catch (error) {
      setLocationError(error.message);
    } finally {
      setSearchingCity(false);
    }
  };

  const handleResetToCurrentLocation = () => {
    setSearchedLocation(null);
    setSearchCity('');
    if (userLocation) {
      setMapCenter([userLocation.lat, userLocation.lng]);
      setMapZoom(13);
      // useEffect will handle fetching when searchedLocation becomes null
    }
  };

  const getMockSafetyInfo = (lat, lng) => {
    return {
      air_quality_index: Math.floor(Math.random() * 50) + 50,
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

  // Mock data for demonstration when backend is not available
  const getMockWildfires = (location) => {
    if (!location) return [];
    
    // Generate some mock fires around location
    return [
      {
        id: 1,
        lat: location.lat + 0.05,
        lng: location.lng + 0.05,
        intensity: 'high',
        confidence: 0.85,
        area: 'North Region',
        detected_at: new Date().toISOString(),
        status: 'active'
      },
      {
        id: 2,
        lat: location.lat - 0.03,
        lng: location.lng + 0.08,
        intensity: 'medium',
        confidence: 0.72,
        area: 'East Region',
        detected_at: new Date().toISOString(),
        status: 'active'
      },
      {
        id: 3,
        lat: location.lat + 0.08,
        lng: location.lng - 0.04,
        intensity: 'low',
        confidence: 0.65,
        area: 'South Region',
        detected_at: new Date().toISOString(),
        status: 'monitoring'
      }
    ];
  };

  const getIntensityColor = (intensity) => {
    const colors = {
      low: '#ff9800',
      medium: '#ff5722',
      high: '#d32f2f',
      critical: '#b71c1c'
    };
    return colors[intensity] || colors.medium;
  };

  const getIntensityLabel = (intensity) => {
    return intensity.charAt(0).toUpperCase() + intensity.slice(1);
  };

  const mapPaperRef = React.useRef(null);
  const safetyCardRef = React.useRef(null);
  const legendCardRef = React.useRef(null);

  return (
    <Paper 
      ref={mapPaperRef}
      elevation={4} 
      sx={{ 
        p: 3, 
        borderRadius: 2, 
        height: '100%',
        bgcolor: 'background.paper',
        border: '1px solid rgba(255, 68, 68, 0.2)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <MouseGradient targetRef={mapPaperRef} enabled={true} />
      <Box sx={{ position: 'relative', zIndex: 2 }}>
      {/* City Search */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Search for a city (e.g., San Francisco, Los Angeles, San Diego...)"
          value={searchCity}
          onChange={(e) => setSearchCity(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleCitySearch();
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleCitySearch}
                  disabled={!searchCity.trim() || searchingCity}
                  sx={{ mr: 1 }}
                >
                  {searchingCity ? <CircularProgress size={16} /> : 'Search'}
                </Button>
                {searchedLocation && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleResetToCurrentLocation}
                    sx={{ mr: 1 }}
                  >
                    Use My Location
                  </Button>
                )}
              </InputAdornment>
            ),
          }}
        />
        {searchedLocation && (
          <Alert severity="info" sx={{ mt: 1 }}>
            Showing information for: <strong>{searchCity}</strong>
          </Alert>
        )}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocalFireDepartmentIcon /> Wildfire Map
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh Location">
            <IconButton onClick={requestLocation} disabled={loading}>
              <MyLocationIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh Fire Data">
            <IconButton onClick={fetchWildfires} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {locationError && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setLocationError(null)}>
          {locationError} - Showing all active wildfires instead.
        </Alert>
      )}

      {wildfireError && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setWildfireError(null)}>
          <strong>⚠️ Demo Mode:</strong> {wildfireError} - Currently showing <strong>demo/mock fire data</strong> for testing. Connect your backend to see real wildfire detections.
        </Alert>
      )}
      
      {wildfires.length > 0 && !wildfireError && (
        <Alert severity="success" sx={{ mb: 2 }}>
          ✅ Showing <strong>{wildfires.length}</strong> real wildfire detection(s) from backend
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      )}

      <Box sx={{ height: '600px', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
        <MapContainer
          key={`${mapCenter[0]}-${mapCenter[1]}-${mapZoom}`}
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Center map on location */}
          <MapCenter center={mapCenter} zoom={mapZoom} />
          
          {/* User location marker */}
          {userLocation && !searchedLocation && (
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
              })}
            >
              <Popup>
                <Typography variant="subtitle2">Your Location</Typography>
                <Typography variant="body2">
                  {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                </Typography>
                {userLocation.accuracy && (
                  <Typography variant="caption" color="text.secondary">
                    Accuracy: ±{Math.round(userLocation.accuracy)}m
                  </Typography>
                )}
              </Popup>
            </Marker>
          )}

          {/* Searched city marker */}
          {searchedLocation && (
            <Marker
              position={[searchedLocation.lat, searchedLocation.lng]}
              icon={L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
              })}
            >
              <Popup>
                <Typography variant="subtitle2">
                  <LocationOnIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                  {searchCity}
                </Typography>
                <Typography variant="body2">
                  {searchedLocation.lat.toFixed(6)}, {searchedLocation.lng.toFixed(6)}
                </Typography>
              </Popup>
            </Marker>
          )}

          {/* Shelter markers */}
          {safetyInfo?.nearest_shelters?.map((shelter, index) => (
            <Marker
              key={`shelter-${index}`}
              position={[shelter.lat, shelter.lng]}
              icon={L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
              })}
            >
              <Popup>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    <HomeIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                    {shelter.name}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    {shelter.address}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Distance:</strong> {shelter.distance_km.toFixed(1)} km
                  </Typography>
                  <Typography variant="body2">
                    <strong>Capacity:</strong> {shelter.capacity} people
                  </Typography>
                </Box>
              </Popup>
            </Marker>
          ))}

          {/* Wildfire markers */}
          {wildfires.map((fire) => (
            <React.Fragment key={fire.id || `${fire.lat}-${fire.lng}`}>
              <Marker
                position={[fire.lat, fire.lng]}
                icon={createFireIcon(fire.intensity || fire.risk_level || 'medium')}
              >
                <Popup>
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      🔥 Wildfire Detected
                    </Typography>
                    <Chip
                      label={getIntensityLabel(fire.intensity || fire.risk_level || 'medium')}
                      size="small"
                      sx={{
                        bgcolor: getIntensityColor(fire.intensity || fire.risk_level || 'medium'),
                        color: 'white',
                        mb: 1
                      }}
                    />
                    {fire.area && (
                      <Typography variant="body2" gutterBottom>
                        <strong>Area:</strong> {fire.area}
                      </Typography>
                    )}
                    {fire.confidence && (
                      <Typography variant="body2" gutterBottom>
                        <strong>Confidence:</strong> {(fire.confidence * 100).toFixed(1)}%
                      </Typography>
                    )}
                    {fire.detected_at && (
                      <Typography variant="caption" color="text.secondary">
                        Detected: {new Date(fire.detected_at).toLocaleString()}
                      </Typography>
                    )}
                  </Box>
                </Popup>
              </Marker>
              
              {/* Intensity circle */}
              <Circle
                center={[fire.lat, fire.lng]}
                radius={5000} // 5km radius
                pathOptions={{
                  color: getIntensityColor(fire.intensity || fire.risk_level || 'medium'),
                  fillColor: getIntensityColor(fire.intensity || fire.risk_level || 'medium'),
                  fillOpacity: 0.1,
                  weight: 2
                }}
              />
            </React.Fragment>
          ))}
        </MapContainer>
      </Box>

      {/* Location Safety Info */}
      {safetyInfo && (searchedLocation || userLocation) && (
        <Card 
          ref={safetyCardRef}
          sx={{ 
            mt: 2, 
            mb: 2, 
            bgcolor: 'background.paper', 
            border: '1px solid rgba(255, 68, 68, 0.2)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <MouseGradient targetRef={safetyCardRef} enabled={true} />
          <CardContent sx={{ position: 'relative', zIndex: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningIcon color="primary" /> Your Location Safety Information
            </Typography>
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* Air Quality */}
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, border: '1px solid rgba(255, 68, 68, 0.1)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <AirIcon color="primary" />
                    <Typography variant="subtitle2">Air Quality Index</Typography>
                  </Box>
                  <Typography variant="h4" color="primary">
                    {safetyInfo.air_quality_index}
                  </Typography>
                  <Chip
                    label={safetyInfo.air_quality_status}
                    size="small"
                    color={safetyInfo.air_quality_index > 100 ? 'error' : safetyInfo.air_quality_index > 50 ? 'warning' : 'success'}
                    sx={{ mt: 1 }}
                  />
                </Paper>
              </Grid>

              {/* Outdoor Safety */}
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, border: '1px solid rgba(255, 68, 68, 0.1)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <WarningIcon color="warning" />
                    <Typography variant="subtitle2">Outdoor Safety</Typography>
                  </Box>
                  <Typography variant="h6" sx={{ mt: 1 }}>
                    {safetyInfo.outdoor_safety}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Status: {safetyInfo.safety_status}
                  </Typography>
                </Paper>
              </Grid>

              {/* Nearest Shelter */}
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, border: '1px solid rgba(255, 68, 68, 0.1)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <HomeIcon color="success" />
                    <Typography variant="subtitle2">Nearest Shelter</Typography>
                  </Box>
                  {safetyInfo.nearest_shelters && safetyInfo.nearest_shelters.length > 0 && (
                    <Box>
                      <Typography variant="body1" fontWeight="bold">
                        {safetyInfo.nearest_shelters[0].name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {safetyInfo.nearest_shelters[0].distance_km.toFixed(1)} km away
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {safetyInfo.nearest_shelters[0].address}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>

            {/* Recommendations */}
            {safetyInfo.recommendations && safetyInfo.recommendations.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Recommendations:
                </Typography>
                <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                  {safetyInfo.recommendations.map((rec, index) => (
                    <Typography key={index} component="li" variant="body2" sx={{ mb: 0.5 }}>
                      {rec}
                    </Typography>
                  ))}
                </Box>
              </Box>
            )}

            {/* All Shelters */}
            {safetyInfo.nearest_shelters && safetyInfo.nearest_shelters.length > 1 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  All Nearby Shelters:
                </Typography>
                {safetyInfo.nearest_shelters.map((shelter, index) => (
                  <Paper key={index} sx={{ p: 1.5, mt: 1, bgcolor: 'background.default', border: '1px solid rgba(255, 68, 68, 0.1)' }}>
                    <Typography variant="body2" fontWeight="medium">
                      {shelter.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {shelter.address} • {shelter.distance_km.toFixed(1)} km • Capacity: {shelter.capacity}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card 
        ref={legendCardRef}
        sx={{ 
          mt: 2,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <MouseGradient targetRef={legendCardRef} enabled={true} />
        <CardContent sx={{ position: 'relative', zIndex: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Fire Intensity Legend
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
            {['low', 'medium', 'high', 'critical'].map((intensity) => (
              <Box key={intensity} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    bgcolor: getIntensityColor(intensity),
                    border: '2px solid white',
                    boxShadow: 1
                  }}
                />
                <Typography variant="caption">
                  {getIntensityLabel(intensity)}
                </Typography>
              </Box>
            ))}
          </Box>
          {(searchedLocation || userLocation) && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Showing fires within 50km of {searchedLocation ? searchCity : 'your location'}
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Fire count summary */}
      {wildfires.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Active Wildfires Detected: <strong>{wildfires.length}</strong>
          </Typography>
        </Box>
      )}
      </Box>
    </Paper>
  );
};

export default FireMap;

