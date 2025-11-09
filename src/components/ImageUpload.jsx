/**
 * Image upload and analysis component.
 * Handles satellite/aerial image uploads (128x128 pixels), displays analysis results,
 * shows community contribution information, impact stories, and previous uploads history.
 * 
 * @author Ammaar Shareef
 */
import React, { useState, useRef } from 'react';
import {
  Box,
  Paper,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Chip,
  Divider,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ImageIcon from '@mui/icons-material/Image';
import InfoIcon from '@mui/icons-material/Info';
import HistoryIcon from '@mui/icons-material/History';
import PeopleIcon from '@mui/icons-material/People';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { uploadImage } from '../utils/api';
import { saveImageToGitHub } from '../utils/github';
import MouseGradient from './MouseGradient';

const ImageUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [showDemoAnalysis, setShowDemoAnalysis] = useState(false);
  const [showUploadBox, setShowUploadBox] = useState(false);
  const [previousUploads, setPreviousUploads] = useState([]);

  // Refs for mouse gradient
  const communityBoxRef = useRef(null);
  const mainPaperRef = useRef(null);
  const infoBoxRef = useRef(null);
  const uploadCardRef = useRef(null);
  const previousUploadsRef = useRef(null);
  const impactSectionRef = useRef(null);

  // Demo analysis data
  const getDemoAnalysis = () => {
    return `**Fire Risk Indicators:**
- Moderate dry vegetation density detected in northern regions
- No visible smoke plumes or active fires
- Clear weather conditions with minimal cloud cover
- Some areas show signs of previous burn scars

**Infrastructure Assessment:**
- Multiple residential structures visible in the central area
- Primary road network appears accessible
- Power transmission lines detected running east-west
- Water reservoir visible in the southwest quadrant
- Infrastructure appears to be at moderate distance from high-risk vegetation zones

**Terrain Analysis:**
- Mixed topography with rolling hills and valleys
- Dense forest coverage in northern and eastern regions
- Natural firebreaks present (rivers, cleared areas)
- Potential fire spread pattern: North to South, following wind patterns

**Risk Assessment:**
- Overall Fire Risk Level: **Medium**
- Confidence Level: 75%
- Areas of Concern: Northern forested regions, eastern valley
- Time-Sensitive Risks: Low immediate threat, but conditions could worsen with dry weather

**Recommendations:**
- Monitor northern regions for 48-72 hours
- Prepare evacuation routes for eastern valley communities
- Ensure water supply systems are operational
- Alert infrastructure maintenance teams to check power line clearances
- Deploy monitoring resources to high-risk zones`;
  };

  // Format backend prediction as analysis text
  const formatPredictionAsAnalysis = (prediction) => {
    if (typeof prediction === 'string') {
      return prediction;
    }
    
    let analysis = `**Risk Assessment:**\n`;
    analysis += `- Overall Fire Risk Level: **${prediction.risk_level || 'Unknown'}**\n`;
    if (prediction.confidence) {
      analysis += `- Confidence Level: ${(prediction.confidence * 100).toFixed(0)}%\n`;
    }
    
    if (prediction.recommendations) {
      analysis += `\n**Recommendations:**\n`;
      if (Array.isArray(prediction.recommendations)) {
        prediction.recommendations.forEach(rec => {
          analysis += `- ${rec}\n`;
        });
      } else if (typeof prediction.recommendations === 'object') {
        if (prediction.recommendations.infrastructure) {
          analysis += `\nInfrastructure:\n`;
          prediction.recommendations.infrastructure.forEach(rec => {
            analysis += `- ${rec}\n`;
          });
        }
        if (prediction.recommendations.evacuation) {
          analysis += `\nEvacuation:\n`;
          prediction.recommendations.evacuation.forEach(rec => {
            analysis += `- ${rec}\n`;
          });
        }
      }
    }
    
    return analysis;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      // Validate image dimensions (128x128)
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        if (img.width !== 128 || img.height !== 128) {
          setError(`Image must be exactly 128x128 pixels. Current size: ${img.width}x${img.height}`);
          return;
        }
        
        setSelectedFile(file);
        setError(null);
        setResult(null);
        setAnalysis(null);
        setShowDemoAnalysis(true);
        
        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result);
        };
        reader.readAsDataURL(file);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        setError('Invalid image file');
      };
      img.src = objectUrl;
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      // Upload to backend
      let uploadResponse = null;
      try {
        uploadResponse = await uploadImage(selectedFile, {
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        // Backend might not be available, continue with demo analysis
        console.log('Backend not available, using demo analysis');
      }

      // Save image to GitHub (silently fail if token not configured)
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${timestamp}-${selectedFile.name}`;
        await saveImageToGitHub(selectedFile, filename);
        setResult({
          upload: uploadResponse,
          message: 'Image uploaded successfully and saved to GitHub!',
        });
      } catch (githubErr) {
        // GitHub save failed - silently continue if token not configured
        console.error('GitHub save error:', githubErr);
        // Only show message if it's not a token configuration issue
        if (uploadResponse && !githubErr.message?.includes('token')) {
          setResult({
            upload: uploadResponse,
            message: 'Image uploaded to backend. Failed to save to GitHub.',
          });
        }
        // If token not configured, don't show any message - just continue
      }

      // Add to previous uploads
      const newUpload = {
        id: Date.now(),
        filename: selectedFile.name,
        timestamp: new Date().toISOString(),
        description: uploadResponse?.description || uploadResponse?.analysis || 'No description available',
        preview: preview,
      };
      setPreviousUploads(prev => [newUpload, ...prev]);

      // Replace demo analysis with backend response if available
      if (uploadResponse?.analysis) {
        setAnalysis(uploadResponse.analysis);
        setShowDemoAnalysis(false);
      } else if (uploadResponse?.prediction) {
        const formattedAnalysis = formatPredictionAsAnalysis(uploadResponse.prediction);
        setAnalysis(formattedAnalysis);
        setShowDemoAnalysis(false);
      } else {
        // Show demo analysis
        setShowDemoAnalysis(true);
      }
    } catch (err) {
      setError(err.userMessage || err.response?.data?.message || err.message || 'Failed to upload image. Please check your backend connection.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setAnalysis(null);
    setError(null);
    setShowDemoAnalysis(false);
    setShowUploadBox(false);
  };

  // Mock data for impact stories
  const impactStories = [
    {
      id: 1,
      title: 'Early Detection Saves Northern Valley',
      date: '2024-01-15',
      impact: 'A user-uploaded satellite image detected smoke patterns 3 hours before official alerts. Emergency services were able to evacuate 200+ residents and protect critical infrastructure.',
      location: 'Northern Valley Region',
    },
    {
      id: 2,
      title: 'Community Alert Prevents Major Disaster',
      date: '2024-02-03',
      impact: 'Multiple community uploads helped identify a rapidly spreading fire near power transmission lines. Quick response prevented a potential city-wide power outage.',
      location: 'East Industrial Zone',
    },
    {
      id: 3,
      title: 'Satellite Data Aids Evacuation Planning',
      date: '2024-02-20',
      impact: 'User-contributed imagery provided real-time visibility of fire spread patterns, enabling emergency services to optimize evacuation routes and save valuable time.',
      location: 'Southwest Residential Area',
    },
  ];

  return (
    <Box>
      {/* Community Contribution Box - Above Upload */}
      <Paper
        ref={communityBoxRef}
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
        <MouseGradient targetRef={communityBoxRef} enabled={true} />
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <PeopleIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Help Improve Our Database & Alert Others
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8, color: 'text.secondary' }}>
            Your contributions make a real difference! By uploading satellite imagery and wildfire-related images, you're helping to:
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <CheckCircleIcon sx={{ color: 'primary.main', mt: 0.5 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Enhance Detection Accuracy
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Your uploads help train and improve our AI models, making wildfire detection faster and more accurate.
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <NotificationsIcon sx={{ color: 'primary.main', mt: 0.5 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Alert Communities
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Share critical information that can help alert nearby communities and emergency services about potential wildfire threats.
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <ImageIcon sx={{ color: 'primary.main', mt: 0.5 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Build Comprehensive Database
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Contribute to a growing database of wildfire imagery that helps researchers and emergency responders better understand fire patterns.
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      <Paper 
        ref={mainPaperRef}
        elevation={4} 
        sx={{ 
          p: 3, 
          borderRadius: 2,
          bgcolor: 'background.paper',
          border: '1px solid rgba(255, 68, 68, 0.2)',
          mb: 3,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <MouseGradient targetRef={mainPaperRef} enabled={true} />
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ImageIcon /> Satellite Image Upload & Analysis
            </Typography>
          </Box>

          {/* Upload Image Button */}
          {!showUploadBox && (
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<CloudUploadIcon />}
                onClick={() => setShowUploadBox(true)}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                }}
              >
                Upload Image
              </Button>
            </Box>
          )}

          {/* Info Box */}
          {showUploadBox && (
            <Paper
              ref={infoBoxRef}
              elevation={2}
              sx={{
                p: 3,
                mb: 3,
                bgcolor: 'background.default',
                border: '1px solid rgba(255, 68, 68, 0.3)',
                borderRadius: 2,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <MouseGradient targetRef={infoBoxRef} enabled={true} />
              <Box sx={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <InfoIcon sx={{ color: 'primary.main', mt: 0.5 }} />
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Upload Instructions
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, lineHeight: 1.8 }}>
                    <strong>What you can upload:</strong> Satellite imagery, aerial photographs, or any wildfire-related images for analysis.
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, lineHeight: 1.8 }}>
                    <strong>Image size requirement:</strong> Images must be exactly <strong>128x128 pixels</strong> only. Please resize your image before uploading.
                  </Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.8 }}>
                    <strong>What happens when you upload:</strong> Your image will be analyzed using AI-powered wildfire detection algorithms. The system will assess fire risk indicators, infrastructure vulnerabilities, terrain analysis, and provide recommendations for emergency response planning.
                  </Typography>
                </Box>
              </Box>
            </Paper>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* File Input - Shown when upload box is open but no file selected */}
          {showUploadBox && !selectedFile && (
            <Box sx={{ mb: 3 }}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="file-upload-input"
                type="file"
                onChange={handleFileSelect}
              />
              <label htmlFor="file-upload-input">
                <Button
                  variant="outlined"
                  component="span"
                  size="large"
                  fullWidth
                  startIcon={<CloudUploadIcon />}
                  sx={{
                    py: 2,
                    borderStyle: 'dashed',
                    borderWidth: 2,
                    borderColor: 'primary.main',
                    '&:hover': {
                      borderStyle: 'dashed',
                      borderWidth: 2,
                      bgcolor: 'rgba(255, 68, 68, 0.1)',
                    },
                  }}
                >
                  Choose Image File (128x128 pixels)
                </Button>
              </label>
            </Box>
          )}

          {/* Image Preview and Analysis - Only shown when file is selected */}
          {showUploadBox && selectedFile && (
            <Grid container spacing={3}>
              {/* Preview */}
              <Grid item xs={12} md={6}>
                <Card 
                  ref={uploadCardRef}
                  sx={{ 
                    bgcolor: 'background.default', 
                    border: '1px solid rgba(255, 68, 68, 0.2)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <MouseGradient targetRef={uploadCardRef} enabled={true} />
                  <Box sx={{ position: 'relative', zIndex: 2 }}>
                    <CardMedia
                      component="img"
                      height="300"
                      image={preview}
                      alt="Selected image"
                      sx={{ objectFit: 'contain', bgcolor: '#1a1a1a' }}
                    />
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </Typography>
                      <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                          variant="contained"
                          onClick={handleUpload}
                          disabled={uploading}
                          startIcon={uploading ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                          fullWidth
                          size="large"
                        >
                          {uploading ? 'Submitting...' : 'Submit'}
                        </Button>
                        <Button variant="outlined" onClick={handleClear} fullWidth>
                          Clear
                        </Button>
                      </Box>
                      {/* Upload Another Image Button - After successful upload */}
                      {result && (
                        <Box sx={{ mt: 2 }}>
                          <input
                            accept="image/*"
                            style={{ display: 'none' }}
                            id="file-upload-input-again"
                            type="file"
                            onChange={handleFileSelect}
                          />
                          <label htmlFor="file-upload-input-again">
                            <Button
                              variant="outlined"
                              component="span"
                              fullWidth
                              startIcon={<ImageIcon />}
                            >
                              Upload Another Image
                            </Button>
                          </label>
                        </Box>
                      )}
                    </CardContent>
                  </Box>
                </Card>
              </Grid>

              {/* Results */}
              <Grid item xs={12} md={6}>
                <Box sx={{ maxHeight: '500px', overflow: 'auto' }}>
                  {result && (
                    <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.default', border: '1px solid rgba(255, 68, 68, 0.2)' }}>
                      <Typography variant="h6" gutterBottom>
                        Upload Result
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {result.message}
                      </Typography>
                    </Paper>
                  )}

                  {(analysis || showDemoAnalysis) && (
                    <Paper sx={{ p: 3, mb: 2, bgcolor: 'background.default', border: '1px solid rgba(255, 68, 68, 0.2)' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <ImageIcon color="primary" />
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                          Detailed Image Analysis
                        </Typography>
                        {showDemoAnalysis && !analysis && (
                          <Chip label="Demo Data" size="small" color="info" />
                        )}
                      </Box>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          whiteSpace: 'pre-wrap',
                          lineHeight: 1.8,
                          '& strong': {
                            color: 'primary.main',
                            fontWeight: 600,
                          },
                        }}
                        component="div"
                        dangerouslySetInnerHTML={{
                          __html: (analysis || getDemoAnalysis())
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\n\n/g, '<br/><br/>')
                            .replace(/\n/g, '<br/>')
                        }}
                      />
                    </Paper>
                  )}

                  {!result && !analysis && !showDemoAnalysis && (
                    <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.default' }}>
                      <Typography variant="body2" color="text.secondary">
                        Upload an image and click "Submit" to see results
                      </Typography>
                    </Paper>
                  )}
                </Box>
              </Grid>
            </Grid>
          )}
        </Box>
      </Paper>

      {/* Impact Stories Section - How uploads helped */}
      <Paper
        ref={impactSectionRef}
        elevation={4}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          bgcolor: 'background.paper',
          border: '1px solid rgba(255, 68, 68, 0.2)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <MouseGradient targetRef={impactSectionRef} enabled={true} />
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <CheckCircleIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              How Your Uploads Helped in Wildfires
            </Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />
          <Grid container spacing={3}>
            {impactStories.map((story) => (
              <Grid item xs={12} md={4} key={story.id}>
                <Card sx={{ bgcolor: 'background.default', border: '1px solid rgba(255, 68, 68, 0.2)', height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      {story.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      {story.date} • {story.location}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                      {story.impact}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Paper>

      {/* Previous Uploads Section */}
      <Paper
        ref={previousUploadsRef}
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
        <MouseGradient targetRef={previousUploadsRef} enabled={true} />
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <HistoryIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Previous Uploads
            </Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />
          {previousUploads.length > 0 ? (
            <Grid container spacing={3}>
              {previousUploads.map((upload) => (
                <Grid item xs={12} sm={6} md={4} key={upload.id}>
                  <Card sx={{ bgcolor: 'background.default', border: '1px solid rgba(255, 68, 68, 0.2)' }}>
                    <CardMedia
                      component="img"
                      height="128"
                      image={upload.preview}
                      alt={upload.filename}
                      sx={{ objectFit: 'contain', bgcolor: '#1a1a1a' }}
                    />
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                        {upload.filename}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        {new Date(upload.timestamp).toLocaleString()}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.6,
                        }}
                      >
                        {upload.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
              <Typography variant="body2" color="text.secondary">
                No previous uploads yet. Upload your first image to get started!
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default ImageUpload;
