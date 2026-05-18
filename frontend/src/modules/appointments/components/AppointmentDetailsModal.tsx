import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, Grid, Divider, Chip, Button } from '@mui/material';

interface AppointmentDetailsModalProps {
  open: boolean;
  appointment: any;
  onClose: () => void;
  onCancelClick: () => void;
}

export const AppointmentDetailsModal: React.FC<AppointmentDetailsModalProps> = ({ open, appointment, onClose, onCancelClick }) => {
  if (!appointment) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 600, borderBottom: '1px solid #eee' }}>
        Appointment Details
      </DialogTitle>
      <DialogContent sx={{ p: 3, pt: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary">Test Package</Typography>
          <Typography variant="h6">{appointment.package_name}</Typography>
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">Date</Typography>
            <Typography variant="body1">{appointment.appointment_date}</Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">Time</Typography>
            <Typography variant="body1">{appointment.appointment_time}</Typography>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 3 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary">Visit Details</Typography>
          <Typography variant="body1" sx={{ fontWeight: 500, color: 'primary.main', mb: 1 }}>
            {appointment.visit_type}
          </Typography>
          
          {appointment.visit_type === 'Home Visit' && (
            <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
              <Typography variant="body2" sx={{ mb: 1 }}><strong>Address:</strong> {appointment.address}</Typography>
              <Typography variant="body2"><strong>Phone:</strong> {appointment.phone_number}</Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" color="text.secondary">Status</Typography>
          <Chip 
            label={
              appointment.status.toLowerCase() === 'completed' ? 'Completed' :
              ['successful', 'success', 'sample collected'].includes(appointment.status.toLowerCase()) ? 'Sample Collected' :
              appointment.status
            } 
            color={
              appointment.status.toLowerCase() === 'completed' ? 'success' :
              ['successful', 'success', 'sample collected'].includes(appointment.status.toLowerCase()) ? 'warning' :
              appointment.status.toLowerCase() === 'booked' ? 'primary' :
              appointment.status.toLowerCase() === 'cancelled' ? 'error' : 'default'
            } 
            sx={{ fontWeight: 600 }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        {appointment.status.toLowerCase() === 'booked' && (
          <Button onClick={onCancelClick} color="error" variant="outlined" sx={{ mr: 'auto' }}>
            Cancel Appointment
          </Button>
        )}
        <Button onClick={onClose} variant="contained" sx={{ minWidth: 100 }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
