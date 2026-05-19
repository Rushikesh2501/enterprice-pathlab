import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Fab,
  Paper,
  Typography,
  IconButton,
  TextField,
  Avatar,
  CircularProgress,
  List,
  ListItem
} from '@mui/material';
import { Chat as ChatIcon, Close, Send, Science, SupportAgent } from '@mui/icons-material';
import axios from 'axios';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: 'Namaskar! I am your Enterprise Pathology Assistant. How can I help you today? Feel free to ask in English, Hindi, or Marathi!',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Listen to a custom window event to open chat (e.g. from Dashboard "Chat Now" button)
  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener('open-ai-chat', handleOpenChat);
    return () => {
      window.removeEventListener('open-ai-chat', handleOpenChat);
    };
  }, []);

  // Get current logged-in patient ID
  const getPatientId = (): number | undefined => {
    const saved = localStorage.getItem('pathlab_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        return u?.id;
      } catch (e) {
        console.error('Error parsing user storage in ChatWidget:', e);
      }
    }
    return undefined;
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMsg: Message = {
      sender: 'user',
      text: inputText,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/v1/chatbot/chat', {
        message: userMsg.text,
        patient_id: getPatientId()
      });

      const botMsg: Message = {
        sender: 'bot',
        text: response.data.reply || 'Sorry, I did not understand that.',
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error('Failed to get chat response', error);
      const errorMsg: Message = {
        sender: 'bot',
        text: 'Sorry, I am having trouble connecting to Azure OpenAI Service right now.',
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1200 }}>
      {/* Floating Action Button (FAB) */}
      {!isOpen && (
        <Fab
          color="primary"
          aria-label="chat"
          onClick={() => setIsOpen(true)}
          sx={{
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            transition: '0.3s transform',
            '&:hover': { transform: 'scale(1.1)' }
          }}
        >
          <ChatIcon />
        </Fab>
      )}

      {/* Floating Chat Box */}
      {isOpen && (
        <Paper
          elevation={12}
          sx={{
            width: { xs: 340, sm: 380 },
            height: 480,
            borderRadius: 3,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
            border: '1px solid rgba(0, 0, 0, 0.05)'
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 2,
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 36, height: 36 }}>
                <SupportAgent />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                  PathLab AI Assistant
                </Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: 'white' }}>
              <Close fontSize="small" />
            </IconButton>
          </Box>

          {/* Messages Area */}
          <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto', bgcolor: '#f8fafc' }}>
            <List disablePadding>
              {messages.map((msg, index) => {
                const isBot = msg.sender === 'bot';
                return (
                  <ListItem
                    key={index}
                    disableGutters
                    sx={{
                      display: 'flex',
                      justifyContent: isBot ? 'flex-start' : 'flex-end',
                      mb: 1.5
                    }}
                  >
                    {isBot && (
                      <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.light', mr: 1, alignSelf: 'flex-start', mt: 0.5 }}>
                        <Science sx={{ fontSize: 16 }} />
                      </Avatar>
                    )}
                    <Box
                      sx={{
                        maxWidth: '75%',
                        p: 1.5,
                        borderRadius: isBot ? '4px 16px 16px 16px' : '16px 16px 4px 16px',
                        bgcolor: isBot ? 'white' : 'primary.main',
                        color: isBot ? 'text.primary' : 'white',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        border: isBot ? '1px solid #e2e8f0' : 'none'
                      }}
                    >
                      <Typography variant="body2" sx={{ wordBreak: 'break-word', whiteSpace: 'pre-line' }}>
                        {msg.text}
                      </Typography>
                    </Box>
                  </ListItem>
                );
              })}
              {loading && (
                <ListItem disableGutters sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1.5 }}>
                  <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.light', mr: 1, alignSelf: 'flex-start' }}>
                    <Science sx={{ fontSize: 16 }} />
                  </Avatar>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: '4px 16px 16px 16px',
                      bgcolor: 'white',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <CircularProgress size={16} />
                    <Typography variant="body2" color="text.secondary">
                      Thinking...
                    </Typography>
                  </Box>
                </ListItem>
              )}
              <div ref={messagesEndRef} />
            </List>
          </Box>

          {/* Input Area */}
          <Box sx={{ p: 1.5, bgcolor: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Type your message here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSend();
                }
              }}
              disabled={loading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 6
                }
              }}
            />
            <IconButton
              color="primary"
              onClick={handleSend}
              disabled={!inputText.trim() || loading}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' },
                '&.Mui-disabled': { bgcolor: 'grey.100', color: 'grey.400' }
              }}
            >
              <Send fontSize="small" />
            </IconButton>
          </Box>
        </Paper>
      )}
    </Box>
  );
};
