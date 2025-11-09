/**
 * Home page component.
 * Displays the application introduction, feature cards, and mission statement
 * with smooth fade-in animations and mouse-following gradient effects.
 * 
 * @author Ammaar Shareef
 */
import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Fade,
} from '@mui/material';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import SatelliteIcon from '@mui/icons-material/Satellite';
import MapIcon from '@mui/icons-material/Map';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import PublicIcon from '@mui/icons-material/Public';
import MouseGradient from './MouseGradient';

const Home = () => {
  const [fadeIn, setFadeIn] = useState(false);
  const heroRef = useRef(null);
  const card1Ref = useRef(null);
  const card2Ref = useRef(null);
  const card3Ref = useRef(null);
  const card4Ref = useRef(null);
  const missionRef = useRef(null);
  const featureCardRefs = [card1Ref, card2Ref, card3Ref, card4Ref];

  useEffect(() => {
    // Trigger fade-in animation
    setFadeIn(true);
  }, []);

  const features = [
    {
      icon: <SatelliteIcon sx={{ fontSize: 40 }} />,
      title: 'Satellite Image Analysis',
      description: 'Upload satellite imagery for AI-powered wildfire detection and risk assessment using advanced machine learning models.',
      expandedText: 'Our advanced ML algorithms analyze satellite imagery in real-time, detecting early signs of wildfires, smoke patterns, and heat signatures. The system provides confidence scores and risk assessments to help emergency services respond proactively.',
    },
    {
      icon: <MapIcon sx={{ fontSize: 40 }} />,
      title: 'Real-Time Fire Mapping',
      description: 'Interactive maps showing active wildfires, intensity levels, and safety information for your location.',
      expandedText: 'Get live updates on wildfire locations, spread patterns, and intensity levels. Our mapping system integrates with satellite data, weather information, and ground sensors to provide comprehensive situational awareness for emergency responders.',
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40 }} />,
      title: 'Infrastructure Protection',
      description: 'City-focused wildfire management system designed to protect critical infrastructure and coordinate emergency responses.',
      expandedText: 'Prioritize protection of critical infrastructure including power grids, water systems, communication networks, and transportation routes. Our system helps coordinate resource allocation and evacuation planning to minimize damage to essential city services.',
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 40 }} />,
      title: 'Rapid Response',
      description: 'Get instant alerts, safety recommendations, and nearest shelter information during wildfire events.',
      expandedText: 'Receive immediate notifications when wildfires are detected near your area. Access real-time safety recommendations, air quality indices, evacuation routes, and information about nearest shelters and emergency services.',
    },
  ];

  return (
    <Container maxWidth="lg">
      <Fade in={fadeIn} timeout={1000}>
        <Box>
          {/* Hero Section */}
          <Paper
            ref={heroRef}
            elevation={8}
            sx={{
              p: 6,
              mb: 6,
              textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(255, 68, 68, 0.15) 0%, rgba(139, 0, 0, 0.1) 50%, rgba(0, 0, 0, 0.05) 100%)',
              border: '1px solid rgba(255, 68, 68, 0.3)',
              borderRadius: 4,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'radial-gradient(circle at 30% 20%, rgba(255, 68, 68, 0.1) 0%, transparent 50%)',
                pointerEvents: 'none',
                zIndex: 0,
              },
            }}
          >
            <MouseGradient targetRef={heroRef} enabled={true} />
            <Box sx={{ position: 'relative', zIndex: 2 }}>
              <LocalFireDepartmentIcon
                sx={{
                  fontSize: 80,
                  color: 'primary.main',
                  mb: 2,
                  filter: 'drop-shadow(0 0 20px rgba(255, 68, 68, 0.5))',
                }}
              />
              <Typography
                variant="h2"
                component="h1"
                sx={{
                  fontWeight: 700,
                  mb: 2,
                  background: 'linear-gradient(135deg, #ff4444 0%, #ff8800 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 30px rgba(255, 68, 68, 0.3)',
                }}
              >
                Phoenix
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  color: 'text.secondary',
                  mb: 3,
                  fontWeight: 300,
                }}
              >
                Wildfire Prediction & Management System
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'text.secondary',
                  maxWidth: '800px',
                  mx: 'auto',
                  lineHeight: 1.8,
                  fontSize: '1.1rem',
                }}
              >
                Phoenix is an advanced wildfire prediction and management platform designed for city infrastructure protection. 
                Leveraging satellite imagery analysis, real-time monitoring, and AI-powered detection, we help cities prepare for, 
                respond to, and recover from wildfire events with unprecedented speed and accuracy.
              </Typography>
            </Box>
          </Paper>

          {/* Features Grid */}
          <Grid container spacing={4} sx={{ mb: 6 }}>
            {features.map((feature, index) => {
              const cardRef = featureCardRefs[index];
              
              return (
                <Grid item xs={12} sm={6} key={index}>
                  <Fade in={fadeIn} timeout={1000 + index * 200}>
                    <Card
                      ref={cardRef}
                      sx={{
                        height: '100%',
                        bgcolor: 'background.paper',
                        border: '1px solid rgba(255, 68, 68, 0.2)',
                        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&:hover': {
                          transform: 'scale(1.02)',
                          boxShadow: 8,
                          border: '1px solid rgba(255, 68, 68, 0.4)',
                          '& .feature-icon': {
                            color: 'primary.main',
                            transform: 'scale(1.05)',
                          },
                          '& .feature-description': {
                            maxHeight: '500px',
                            opacity: 1,
                          },
                        },
                      }}
                    >
                      <MouseGradient targetRef={cardRef} enabled={true} />
                      <CardContent 
                        sx={{ 
                          p: 3,
                          position: 'relative',
                          zIndex: 2,
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            mb: 2,
                          }}
                        >
                          <Box
                            className="feature-icon"
                            sx={{
                              color: 'text.secondary',
                              mr: 2,
                              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                          >
                            {feature.icon}
                          </Box>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 600,
                              color: 'text.primary',
                            }}
                          >
                            {feature.title}
                          </Typography>
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'text.secondary',
                            lineHeight: 1.7,
                            mb: 1,
                          }}
                        >
                          {feature.description}
                        </Typography>
                        <Typography
                          className="feature-description"
                          variant="body2"
                          sx={{
                            color: 'text.secondary',
                            lineHeight: 1.7,
                            maxHeight: 0,
                            opacity: 0,
                            overflow: 'hidden',
                            transition: 'max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease 0.1s',
                          }}
                        >
                          {feature.expandedText}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Fade>
                </Grid>
              );
            })}
          </Grid>

          {/* Mission Statement */}
          <Fade in={fadeIn} timeout={1500}>
            <Paper
              ref={missionRef}
              elevation={4}
              sx={{
                p: 5,
                textAlign: 'center',
                bgcolor: 'background.paper',
                border: '1px solid rgba(255, 68, 68, 0.2)',
                borderRadius: 4,
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '-50%',
                  right: '-50%',
                  width: '200%',
                  height: '200%',
                  background: 'radial-gradient(circle, rgba(255, 68, 68, 0.05) 0%, transparent 70%)',
                  pointerEvents: 'none',
                  zIndex: 0,
                },
              }}
            >
              <MouseGradient targetRef={missionRef} enabled={true} />
              <Box sx={{ position: 'relative', zIndex: 2 }}>
                <PublicIcon
                  sx={{
                    fontSize: 60,
                    color: 'primary.main',
                    mb: 2,
                    opacity: 0.8,
                  }}
                />
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 600,
                    mb: 3,
                    color: 'text.primary',
                  }}
                >
                  Protecting Cities, Saving Lives
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: 'text.secondary',
                    maxWidth: '700px',
                    mx: 'auto',
                    lineHeight: 1.9,
                    fontSize: '1.05rem',
                  }}
                >
                  Our mission is to provide cities with cutting-edge wildfire management tools that enable proactive planning, 
                  rapid response, and effective resource allocation. By combining satellite technology, machine learning, and 
                  real-time data analysis, Phoenix empowers emergency services to protect critical infrastructure and 
                  ensure public safety during wildfire events.
                </Typography>
              </Box>
            </Paper>
          </Fade>
        </Box>
      </Fade>
    </Container>
  );
};

export default Home;
