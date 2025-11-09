/**
 * Main dashboard component with tab navigation.
 * Manages the overall layout, navigation tabs (Home, Analysis, Map, Alerts),
 * system status display, and renders the FloatingChatbot component.
 * 
 * @author Ammaar Shareef
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import MapIcon from '@mui/icons-material/Map';
import HomeIcon from '@mui/icons-material/Home';
import NotificationsIcon from '@mui/icons-material/Notifications';
import FloatingChatbot from './FloatingChatbot';
import Home from './Home';
import ImageUpload from './ImageUpload';
import FireMap from './FireMap';
import Alerts from './Alerts';
import { getWildfireStatus } from '../utils/api';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [status, setStatus] = useState(null);
  const [statusError, setStatusError] = useState(null);
  const tabsRef = React.useRef(null);

  useEffect(() => {
    // Fetch wildfire status on mount
    fetchStatus();
    
    // Set up periodic status updates (every 30 seconds)
    const interval = setInterval(fetchStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const data = await getWildfireStatus();
      setStatus(data);
      setStatusError(null);
    } catch (err) {
      // Don't show error if backend is not available yet
      if (err.code !== 'ECONNREFUSED') {
        setStatusError('Unable to fetch wildfire status');
      }
    }
  };

  const handleTabChange = (event, newValue) => {
    if (newValue !== activeTab) {
      setActiveTab(newValue);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default', position: 'relative' }}>
      {/* App Bar */}
      <AppBar position="static" elevation={2}>
        <Toolbar>
          <LocalFireDepartmentIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Phoenix - Wildfire Prediction & Management System
          </Typography>
          {status && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2">
                System Status: {status.status || 'Operational'}
              </Typography>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 12, mb: 20, pb: 4 }}>
        {/* Status Alert */}
        {statusError && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {statusError} - Backend may not be running. Some features may be limited.
          </Alert>
        )}

        {/* Main Content Tabs - Fixed Round Navigation at Top */}
        <Paper 
          ref={tabsRef}
          elevation={8} 
          sx={{ 
            position: 'fixed',
            top: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: 'background.paper',
            border: '1px solid rgba(255, 68, 68, 0.3)',
            borderRadius: '32px',
            px: 2,
            py: 1,
            zIndex: 1000,
            boxShadow: '0 4px 20px rgba(255, 68, 68, 0.2)',
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="standard"
            sx={{
              minHeight: 'auto',
              '& .MuiTabs-indicator': {
                display: 'none',
              },
              '& .MuiTab-root': {
                minHeight: 'auto',
                minWidth: 'auto',
                px: 3,
                py: 1.5,
                mx: 0.75,
                borderRadius: '24px',
                color: 'text.secondary',
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'none',
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: 'rgba(255, 68, 68, 0.1)',
                  color: 'primary.light',
                },
                '&.Mui-selected': {
                  color: 'white',
                  bgcolor: 'primary.main',
                  boxShadow: '0 2px 12px rgba(255, 68, 68, 0.5)',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                },
                '& .MuiTab-iconWrapper': {
                  marginRight: 1,
                  fontSize: '1.2rem',
                },
              },
            }}
          >
            <Tab label="Home" icon={<HomeIcon />} iconPosition="start" />
            <Tab label="Analysis" />
            <Tab label="Map" icon={<MapIcon />} iconPosition="start" />
            <Tab label="Alerts" icon={<NotificationsIcon />} iconPosition="start" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        <Grid container spacing={3}>
          {activeTab === 0 && (
            <Grid item xs={12}>
              <Home />
            </Grid>
          )}

          {activeTab === 1 && (
            <Grid item xs={12}>
              <ImageUpload />
            </Grid>
          )}

          {activeTab === 2 && (
            <Grid item xs={12}>
              <FireMap />
            </Grid>
          )}

          {activeTab === 3 && (
            <Grid item xs={12}>
              <Alerts />
            </Grid>
          )}
        </Grid>

        {/* Footer Info */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Phoenix - City Infrastructure Wildfire Management System
          </Typography>
        </Box>
      </Container>

      {/* Floating Chatbot Button */}
      <FloatingChatbot />
    </Box>
  );
};

export default Dashboard;

