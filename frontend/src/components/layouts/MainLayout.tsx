import React from 'react';
import { Box, CssBaseline } from '@mui/material';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { ChatWidget } from '../common/ChatWidget';
import { Outlet } from 'react-router-dom';

interface MainLayoutProps {
  user: any;
  onLogout: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ user, onLogout }) => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <CssBaseline />
      <Sidebar />
      
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Navbar user={user} onLogout={onLogout} />
        <Box component="main" sx={{ flexGrow: 1, p: 4 }}>
          {/* Outlet is where the nested routes (Dashboard, Reports, etc.) will render */}
          <Outlet />
        </Box>
      </Box>

      {/* Floating Chatbot Widget */}
      <ChatWidget />
    </Box>
  );
};
