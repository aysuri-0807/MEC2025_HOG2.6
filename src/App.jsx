/**
 * Main application component.
 * Sets up the Material-UI theme (dark mode with fire aesthetics), animated background gradient,
 * and renders the Dashboard component.
 * 
 * @author Ammaar Shareef
 */
import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import Dashboard from './components/Dashboard';

// Create dark mode theme with fire aesthetics
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ff4444', // Bright fire red
      dark: '#cc0000',
      light: '#ff6666',
    },
    secondary: {
      main: '#ff8800', // Fire orange
      dark: '#cc6600',
      light: '#ffaa33',
    },
    background: {
      default: '#1a0000', // Dark red-black background
      paper: '#1a1a1a', // Slightly lighter for cards
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#1a1a1a',
          backgroundImage: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1a1a1a',
          backgroundImage: 'linear-gradient(135deg, #1a1a1a 0%, #2a1a1a 100%)',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <style>{`
        @keyframes gradientMove {
          0% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, #1a0000 0%, #2d0000 25%, #1a0000 50%, #0d0000 75%, #1a0000 100%)',
          backgroundSize: '200% 100%',
          animation: 'gradientMove 15s linear infinite',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <Dashboard />
    </ThemeProvider>
  );
}

export default App;
