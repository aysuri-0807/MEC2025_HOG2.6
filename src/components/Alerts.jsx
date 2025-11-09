/**
 * Wildfire alerts component.
 * Allows users to submit wildfire alerts with validation and view/search
 * current alerts in nearby areas. Includes form validation to prevent fake reports.
 * 
 * @author Ammaar Shareef
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  Divider,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import WarningIcon from '@mui/icons-material/Warning';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MouseGradient from './MouseGradient';
import { sendChatMessage } from '../utils/api';
import { appendAlertToCSV, fetchAlertsFromCSV } from '../utils/github';

const Alerts = () => {
  const [alertForm, setAlertForm] = useState({
    location: '',
    severity: 'medium',
    description: '',
    contactInfo: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Refs for mouse gradient
  const submitBoxRef = useRef(null);
  const alertsListRef = useRef(null);

  // Alerts data - loaded from CSV, with demo fallback
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      location: 'Northern Valley, CA',
      severity: 'high',
      description: 'Smoke visible from residential area. Fire department responding. Evacuation recommended for areas within 2 miles.',
      reportedBy: 'Community Member',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      status: 'active',
      verified: true,
    },
    {
      id: 2,
      location: 'East Industrial Zone, CA',
      severity: 'medium',
      description: 'Small brush fire detected near power lines. Fire crews on scene. No immediate threat to structures.',
      reportedBy: 'Emergency Services',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      status: 'active',
      verified: true,
    },
    {
      id: 3,
      location: 'Southwest Residential Area, CA',
      severity: 'low',
      description: 'Controlled burn in progress. Fire department monitoring. No action needed.',
      reportedBy: 'Fire Department',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
      status: 'monitoring',
      verified: true,
    },
    {
      id: 4,
      location: 'Mountain View, CA',
      severity: 'high',
      description: 'Wildfire spreading rapidly. Evacuation orders issued for zones 1-3. Multiple structures at risk.',
      reportedBy: 'Emergency Management',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
      status: 'active',
      verified: true,
    },
    {
      id: 5,
      location: 'Oakland Hills, CA',
      severity: 'medium',
      description: 'Smoke reported in area. Investigation underway. Residents advised to stay alert.',
      reportedBy: 'Community Member',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      status: 'investigating',
      verified: false,
    },
  ]);

  const validateForm = () => {
    const newErrors = {};

    // Location validation
    if (!alertForm.location.trim()) {
      newErrors.location = 'Location is required';
    } else if (alertForm.location.trim().length < 3) {
      newErrors.location = 'Location must be at least 3 characters';
    }

    // Description validation
    if (!alertForm.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (alertForm.description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters to provide useful information';
    } else if (alertForm.description.trim().length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    // Contact info validation (optional but if provided, must be valid)
    if (alertForm.contactInfo.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!emailRegex.test(alertForm.contactInfo) && !phoneRegex.test(alertForm.contactInfo.replace(/\s/g, ''))) {
        newErrors.contactInfo = 'Please provide a valid email or phone number';
      }
    }

    // Anti-spam validation - check for common spam patterns
    const spamPatterns = [
      /http[s]?:\/\//i,
      /www\./i,
      /click here/i,
      /free/i,
      /urgent.*money/i,
    ];
    
    if (spamPatterns.some(pattern => pattern.test(alertForm.description))) {
      newErrors.description = 'Invalid content detected. Please provide a legitimate wildfire alert.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setSubmitSuccess(false);

    try {
      // Send alert to backend
      const alertData = {
        location: alertForm.location.trim(),
        severity: alertForm.severity,
        description: alertForm.description.trim(),
        contactInfo: alertForm.contactInfo.trim() || null,
        timestamp: new Date().toISOString(),
      };

      // Try to send to backend
      try {
        await sendChatMessage(`ALERT: ${JSON.stringify(alertData)}`);
      } catch (err) {
        // Backend might not be available, that's okay
        console.log('Backend not available');
      }

      // Save to CSV file in GitHub
      try {
        await appendAlertToCSV({
          ...alertData,
          status: 'pending',
          verified: false,
        });
        
        // Reload alerts from CSV
        await loadAlertsFromCSV();
        
        setSubmitSuccess(true);
      } catch (githubErr) {
        console.error('Error saving to CSV:', githubErr);
        // Still show success if backend received it
        if (githubErr.message?.includes('token')) {
          setSubmitSuccess(true);
          // Show warning about token
          setError('Alert submitted to backend. GitHub token not configured - alert not saved to CSV file.');
        } else {
          setError('Alert submitted to backend but failed to save to CSV. ' + (githubErr.message || ''));
        }
      }

      setAlertForm({
        location: '',
        severity: 'medium',
        description: '',
        contactInfo: '',
      });
      setErrors({});

      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
        setError(null);
      }, 5000);
    } catch (error) {
      console.error('Error submitting alert:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field) => (e) => {
    setAlertForm(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'success',
      medium: 'warning',
      high: 'error',
      critical: 'error',
    };
    return colors[severity] || 'default';
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  };

  // Filter alerts based on search query
  const filteredAlerts = alerts.filter(alert => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      alert.location.toLowerCase().includes(query) ||
      alert.description.toLowerCase().includes(query) ||
      alert.severity.toLowerCase().includes(query) ||
      alert.reportedBy.toLowerCase().includes(query)
    );
  });

  return (
    <Box>
      {/* Submit Alert Section */}
      <Paper
        ref={submitBoxRef}
        elevation={4}
        sx={{
          p: 4,
          mb: 3,
          borderRadius: 2,
          bgcolor: 'background.paper',
          border: '1px solid rgba(255, 68, 68, 0.2)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <MouseGradient targetRef={submitBoxRef} enabled={true} />
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <NotificationsIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Submit Wildfire Alert
            </Typography>
          </Box>

          {submitSuccess && (
            <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSubmitSuccess(false)}>
              Alert submitted successfully! Our team will verify and process your report.
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Location"
                  placeholder="e.g., Northern Valley, CA"
                  value={alertForm.location}
                  onChange={handleChange('location')}
                  error={!!errors.location}
                  helperText={errors.location || 'Enter the city, area, or specific location'}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOnIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Severity Level</InputLabel>
                  <Select
                    value={alertForm.severity}
                    onChange={handleChange('severity')}
                    label="Severity Level"
                  >
                    <MenuItem value="low">Low - Controlled/Monitored</MenuItem>
                    <MenuItem value="medium">Medium - Active Fire</MenuItem>
                    <MenuItem value="high">High - Spreading/Threat</MenuItem>
                    <MenuItem value="critical">Critical - Immediate Danger</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Description"
                  placeholder="Provide detailed information about the wildfire situation..."
                  value={alertForm.description}
                  onChange={handleChange('description')}
                  error={!!errors.description}
                  helperText={errors.description || `${alertForm.description.length}/500 characters. Minimum 20 characters required.`}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Contact Information (Optional)"
                  placeholder="Email or phone number for verification"
                  value={alertForm.contactInfo}
                  onChange={handleChange('contactInfo')}
                  error={!!errors.contactInfo}
                  helperText={errors.contactInfo || 'Optional: Help us verify your report'}
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={<SendIcon />}
                  disabled={submitting}
                  fullWidth
                  sx={{
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                  }}
                >
                  {submitting ? 'Submitting Alert...' : 'Submit Alert'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Box>
      </Paper>

      {/* Current Alerts Section */}
      <Paper
        ref={alertsListRef}
        elevation={4}
        sx={{
          p: 3,
          borderRadius: 2,
          bgcolor: 'background.paper',
          border: '1px solid rgba(255, 68, 68, 0.2)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <MouseGradient targetRef={alertsListRef} enabled={true} />
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <WarningIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Current Alerts in Nearby Areas
            </Typography>
          </Box>

          {/* Search Bar */}
          <TextField
            fullWidth
            placeholder="Search alerts by location, description, or severity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 3 }}
          />

          <Divider sx={{ mb: 3 }} />

          {/* Alerts List */}
          {filteredAlerts.length > 0 ? (
            <Grid container spacing={2}>
              {filteredAlerts.map((alert) => (
                <Grid item xs={12} key={alert.id}>
                  <Card sx={{ bgcolor: 'background.default', border: '1px solid rgba(255, 68, 68, 0.2)' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <LocationOnIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {alert.location}
                            </Typography>
                            <Chip
                              label={alert.severity.toUpperCase()}
                              color={getSeverityColor(alert.severity)}
                              size="small"
                            />
                            {alert.verified && (
                              <Chip
                                label="Verified"
                                color="success"
                                size="small"
                              />
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {formatTimeAgo(alert.timestamp)} • Reported by {alert.reportedBy}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          label={alert.status}
                          size="small"
                          sx={{
                            bgcolor: alert.status === 'active' ? 'error.main' : 
                                    alert.status === 'monitoring' ? 'warning.main' : 
                                    'info.main',
                            color: 'white',
                          }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                        {alert.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
              <Typography variant="body2" color="text.secondary">
                {searchQuery ? 'No alerts found matching your search.' : 'No alerts available at this time.'}
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default Alerts;

