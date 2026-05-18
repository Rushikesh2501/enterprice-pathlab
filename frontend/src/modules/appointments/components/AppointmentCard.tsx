import React from 'react';
import { Card, CardContent, Box, Typography, Chip, IconButton } from '@mui/material';
import { Event, AccessTime, LocalHospital, Delete } from '@mui/icons-material';

interface AppointmentCardProps {
  appointment: any;
  onClick: (appointment: any) => void;
  onDeleteClick: (appointment: any, e: React.MouseEvent) => void;
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'booked': return 'primary';
    case 'completed': return 'success';
    case 'successful':
    case 'success':
    case 'sample collected':
      return 'warning';
    case 'cancelled': return 'error';
    default: return 'default';
  }
};

const getStatusLabel = (status: string) => {
  const lower = status.toLowerCase();
  if (lower === 'completed') {
    return 'Completed';
  }
  if (lower === 'successful' || lower === 'success' || lower === 'sample collected') {
    return 'Sample Collected';
  }
  return status;
};

export const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, onClick, onDeleteClick }) => {
  return (
    <Card 
      onClick={() => onClick(appointment)}
      sx={{ 
        height: '100%', 
        borderLeft: '4px solid #2563eb', 
        cursor: 'pointer', 
        transition: '0.2s', 
        '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 } 
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {appointment.package_name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip 
              label={getStatusLabel(appointment.status)} 
              color={getStatusColor(appointment.status) as any} 
              size="small" 
              sx={{ fontWeight: 600 }}
            />
            {appointment.status.toLowerCase() === 'booked' && (
              <IconButton 
                size="small" 
                color="error"
                onClick={(e) => onDeleteClick(appointment, e)}
              >
                <Delete fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: 'text.secondary' }}>
            <Event fontSize="small" color="action" />
            <Typography variant="body2">{appointment.appointment_date}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: 'text.secondary' }}>
            <AccessTime fontSize="small" color="action" />
            <Typography variant="body2">{appointment.appointment_time}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: 'text.secondary' }}>
            <LocalHospital fontSize="small" color="action" />
            <Typography variant="body2">{appointment.visit_type === 'Home Visit' ? 'Home Visit' : 'Enterprise PathLab Center'}</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
