/**
 * Floating chatbot interface component.
 * Provides a persistent text input box at the bottom of the screen that expands
 * into a sliding chat panel when clicked. Manages the input state and triggers
 * message sending to the Chatbot component.
 * 
 * @author Ammaar Shareef
 */
import React, { useState } from 'react';
import {
  Box,
  IconButton,
  TextField,
  InputAdornment,
  Slide,
  Paper,
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import Chatbot from './Chatbot';

const FloatingChatbot = () => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [sendTrigger, setSendTrigger] = useState(0);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    // Send 'exit' message before closing
    if (open) {
      // Trigger exit in Chatbot component
      setInputValue('exit');
      // Wait for exit message to be sent, then close panel
      setTimeout(() => {
        setOpen(false);
        setInputValue('');
      }, 500);
    } else {
      setOpen(false);
      setInputValue('');
    }
  };

  const handleInputFocus = () => {
    if (!open) {
      handleOpen();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim()) {
        if (!open) {
          handleOpen();
        }
        // Trigger send by incrementing sendTrigger
        setSendTrigger(prev => prev + 1);
        // Clear input after Chatbot has had time to read it
        setTimeout(() => {
          setInputValue('');
        }, 300);
      }
    }
  };

  const handleSendClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (inputValue.trim()) {
      if (!open) {
        handleOpen();
      }
      // Trigger send by incrementing sendTrigger
      setSendTrigger(prev => prev + 1);
      // Clear input after Chatbot has had time to read it
      setTimeout(() => {
        setInputValue('');
      }, 300);
    }
  };

  return (
    <>
      {/* Chat Panel - Anchored to bottom, separate from text box */}
      <Slide direction="up" in={open} mountOnEnter unmountOnExit timeout={300}>
        <Paper
          elevation={24}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: '29.5%',
            transform: 'translateX(-50%)',
            width: { xs: '100%', sm: '600px', md: '700px' },
            maxWidth: '100vw',
            height: '500px',
            borderRadius: '24px 24px 0 0',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            bgcolor: 'background.paper',
            border: '1px solid rgba(255, 68, 68, 0.2)',
            zIndex: 1001,
          }}
        >
          {/* Header with Exit Button */}
          <Box
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              borderRadius: '24px 24px 0 0',
            }}
          >
            <IconButton
              onClick={() => {
                // Send exit message, then close
                setInputValue('exit');
                setSendTrigger(prev => prev + 1);
                setTimeout(() => {
                  setOpen(false);
                  setInputValue('');
                }, 500);
              }}
              size="small"
              sx={{
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Chat Content */}
          <Box sx={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
            <Chatbot 
              inputValue={inputValue} 
              sendTrigger={sendTrigger}
              onMessageSent={() => {
                // Clear input after message is sent
                setInputValue('');
              }}
              onExit={() => {
                setOpen(false);
                setInputValue('');
              }}
            />
          </Box>
        </Paper>
      </Slide>

      {/* Floating Text Input Box - Independent, always at bottom */}
      <Box
        sx={{
          position: 'fixed',
          bottom: open ? '520px' : '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          width: { xs: '90%', sm: '600px', md: '700px' },
          maxWidth: '90vw',
          transition: 'bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <TextField
          fullWidth
          placeholder="Ask Phoenix assistant about wildfires, safety, or infrastructure..."
          onClick={handleInputFocus}
          onFocus={handleInputFocus}
          onKeyPress={handleKeyPress}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SmartToyIcon sx={{ color: 'primary.main' }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={handleSendClick}
                  disabled={!inputValue.trim()}
                  sx={{ color: 'primary.main' }}
                >
                  <SendIcon />
                </IconButton>
              </InputAdornment>
            ),
            sx: {
              bgcolor: 'background.paper',
              borderRadius: '28px',
              boxShadow: 6,
              transition: 'all 0.2s',
              border: '1px solid rgba(255, 68, 68, 0.2)',
              '&:hover': {
                boxShadow: 8,
                border: '1px solid rgba(255, 68, 68, 0.4)',
              },
              '&:focus-within': {
                boxShadow: 10,
                border: '1px solid rgba(255, 68, 68, 0.6)',
              },
              '& fieldset': {
                border: 'none',
              },
              py: 0.5,
            },
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              fontSize: '0.95rem',
              color: 'text.primary',
            },
            '& .MuiInputBase-input::placeholder': {
              color: 'text.secondary',
              opacity: 0.7,
            },
          }}
        />
      </Box>
    </>
  );
};

export default FloatingChatbot;
