import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Box,
  Badge,
} from '@mui/material';
import { Notifications, Menu as MenuIcon, Logout } from '@mui/icons-material';

interface NavbarProps {
  user: any;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  return (
    <AppBar position="sticky" elevation={0} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton edge="start" color="inherit" sx={{ mr: 2, display: { sm: 'none' } }} >
          <MenuIcon />
        </IconButton>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton color="inherit">
            <Badge badgeContent={3} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}>
            <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {user?.full_name || 'Guest User'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.role === 'admin' ? 'Admin' : 'Patient'}
              </Typography>
            </Box>
            <Avatar
              src={user?.profile_image_url}
              sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}
            >
              {user?.full_name?.charAt(0) || 'G'}
            </Avatar>
          </Box>

          <IconButton
            onClick={onLogout}
            color="error"
            sx={{
              ml: 1,
              bgcolor: 'rgba(239, 68, 68, 0.08)',
              '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.15)' }
            }}
            title="Log Out"
          >
            <Logout fontSize="small" />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
