import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  RadioGroup,
  Radio,
  TextField,
  List,
  ListItem,
  ListItemText,
  Checkbox
} from '@mui/material';
import { Add } from '@mui/icons-material';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { AppointmentCard } from './components/AppointmentCard';
import { AppointmentDetailsModal } from './components/AppointmentDetailsModal';
import { API_BASE_URL } from '../../services/api';

interface Appointment {
  id: number;
  appointment_date: string;
  appointment_time: string;
  status: string;
  visit_type?: string;
  address?: string;
  phone_number?: string;
  package_name: string;
  price: number;
}

interface Package {
  id: number;
  package_name: string;
  price: number;
}

export const Appointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // Modal State
  const [open, setOpen] = useState(false);
  const [selectedPackages, setSelectedPackages] = useState<number[]>([]);
  const [visitType, setVisitType] = useState('PathLab');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  // Details Modal
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Duplicate Warning Modal
  const [duplicateWarningOpen, setDuplicateWarningOpen] = useState(false);
  const [duplicateTests, setDuplicateTests] = useState<string[]>([]);

  // Error Modal
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Cancel Confirmation Modal
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  // Delete Confirmation Modal
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);

  useEffect(() => {
    fetchAppointments();
    fetchPackages();
  }, []);

  useEffect(() => {
    if (location.state && location.state.preSelectedPackageId) {
      const packageId = location.state.preSelectedPackageId;
      setSelectedPackages([packageId]);
      setOpen(true);
      // Clean up the location state so refreshing or coming back doesn't trigger the modal again
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  const fetchPackages = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/catalogue/`);
      setPackages(response.data);
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/appointments/`);
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookClick = () => {
    if (selectedPackages.length === 0 || !date || !time) {
      setErrorMessage("Please select at least one package, date, and time.");
      setErrorOpen(true);
      return;
    }
    if (visitType === 'Home Visit' && (!address || !phone)) {
      setErrorMessage("Full Address and Phone Number are strictly required for Home Visits.");
      setErrorOpen(true);
      return;
    }

    // Check for already booked tests
    const alreadyBooked: string[] = [];
    selectedPackages.forEach(pkgId => {
      const pkg = packages.find(p => p.id === pkgId);
      if (pkg) {
        const isBooked = appointments.some(appt => appt.package_name === pkg.package_name && appt.status.toLowerCase() === 'booked');
        if (isBooked) {
          alreadyBooked.push(pkg.package_name);
        }
      }
    });

    if (alreadyBooked.length > 0) {
      setDuplicateTests(alreadyBooked);
      setDuplicateWarningOpen(true);
      return;
    }

    proceedWithBooking();
  };

  const proceedWithBooking = async () => {
    setDuplicateWarningOpen(false);
    setBookingLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/v1/appointments/`, {
        package_ids: selectedPackages,
        appointment_date: date,
        appointment_time: time + ":00",
        visit_type: visitType,
        address: visitType === 'Home Visit' ? address : null,
        phone_number: visitType === 'Home Visit' ? phone : null
      });
      setOpen(false);
      // Reset form
      setSelectedPackages([]); setVisitType('PathLab'); setAddress(''); setPhone(''); setDate(''); setTime('');
      // Refresh list
      fetchAppointments();
    } catch (err) {
      console.error("Booking failed", err);
      setErrorMessage("Failed to securely book the appointment. Please try again.");
      setErrorOpen(true);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelClick = () => {
    if (!selectedAppointment) return;
    setCancelConfirmOpen(true);
  };

  const confirmCancelAppointment = async () => {
    setCancelConfirmOpen(false);
    try {
      await axios.put(`${API_BASE_URL}/api/v1/appointments/${selectedAppointment?.id}/cancel`);
      setDetailsOpen(false);
      fetchAppointments();
    } catch (err) {
      console.error("Failed to cancel appointment", err);
      setErrorMessage("Failed to cancel the appointment. Please try again.");
      setErrorOpen(true);
    }
  };

  const confirmDeleteAppointment = async () => {
    setDeleteConfirmOpen(false);
    try {
      await axios.delete(`${API_BASE_URL}/api/v1/appointments/${appointmentToDelete?.id}`);
      fetchAppointments();
    } catch (err) {
      console.error("Failed to delete appointment", err);
      setErrorMessage("Failed to securely delete the appointment. Please try again.");
      setErrorOpen(true);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>My Appointments</Typography>
          <Typography color="text.secondary">
            View and manage your upcoming pathology tests.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} size="large" onClick={() => setOpen(true)}>
          Book New
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {appointments.map((appt) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={appt.id}>
              <AppointmentCard 
                appointment={appt} 
                onClick={(appt) => { setSelectedAppointment(appt); setDetailsOpen(true); }}
                onDeleteClick={(appt, e) => {
                  e.stopPropagation();
                  setAppointmentToDelete(appt);
                  setDeleteConfirmOpen(true);
                }}
              />
            </Grid>
          ))}
          {appointments.length === 0 && (
            <Box sx={{ width: '100%', textAlign: 'center', p: 8 }}>
              <Typography variant="h6" color="text.secondary">You have no booked appointments.</Typography>
            </Box>
          )}
        </Grid>
      )}

      {/* Booking Modal */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Book a Test</DialogTitle>
        <DialogContent dividers>

          <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>Select Packages:</Typography>
          <List sx={{ bgcolor: 'grey.50', borderRadius: 2, mb: 3 }}>
            {packages.map((pkg) => (
              <ListItem key={pkg.id} disablePadding>
                <Box
                  onClick={() => {
                    setSelectedPackages(prev =>
                      prev.includes(pkg.id) ? prev.filter(id => id !== pkg.id) : [...prev, pkg.id]
                    )
                  }}
                  sx={{ width: '100%', p: 1, px: 2, display: 'flex', alignItems: 'center', cursor: 'pointer', '&:hover': { bgcolor: 'grey.100' } }}
                >
                  <Checkbox checked={selectedPackages.includes(pkg.id)} />
                  <ListItemText primary={pkg.package_name} />
                  <Typography variant="subtitle2" color="primary">₹{pkg.price}</Typography>
                </Box>
              </ListItem>
            ))}
          </List>

          <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>Visit Type:</Typography>
          <RadioGroup row value={visitType} onChange={(e) => setVisitType(e.target.value)} sx={{ mb: 3 }}>
            <FormControlLabel value="PathLab" control={<Radio />} label="Visit PathLab" />
            <FormControlLabel value="Home Visit" control={<Radio />} label="Home Visit" />
          </RadioGroup>

          {visitType === 'Home Visit' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
              <TextField
                label="Full Address"
                multiline
                rows={2}
                fullWidth
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
              <TextField
                label="Phone Number"
                fullWidth
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </Box>
          )}

          <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>Date & Time:</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              type="date"
              fullWidth
              value={date}
              onChange={(e) => setDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              type="time"
              fullWidth
              value={time}
              onChange={(e) => setTime(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>

        </DialogContent>
        <DialogActions sx={{ p: 2, px: 3 }}>
          <Button onClick={() => setOpen(false)} color="inherit">Cancel</Button>
          <Button
            onClick={handleBookClick}
            variant="contained"
            disabled={selectedPackages.length === 0 || !date || !time || bookingLoading}
          >
            {bookingLoading ? <CircularProgress size={24} /> : "Confirm Booking"}
          </Button>
        </DialogActions>
      </Dialog>

      <AppointmentDetailsModal 
        open={detailsOpen} 
        appointment={selectedAppointment} 
        onClose={() => setDetailsOpen(false)} 
        onCancelClick={handleCancelClick} 
      />

      {/* Duplicate Warning Modal */}
      <ConfirmationDialog
        open={duplicateWarningOpen}
        title="Duplicate Booking Warning"
        message={
          <>
            <Typography variant="body1" sx={{ mb: 2 }}>
              The following tests are already in your active schedule:
            </Typography>
            <Box sx={{ bgcolor: 'error.light', color: 'white', p: 2, borderRadius: 2, mb: 2 }}>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {duplicateTests.map((test, i) => (
                  <li key={i}><Typography variant="body2" sx={{ fontWeight: 600 }}>{test}</Typography></li>
                ))}
              </ul>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Are you absolutely sure you want to book them again?
            </Typography>
          </>
        }
        confirmText="Book Anyway"
        cancelText="Cancel Booking"
        confirmColor="error"
        onConfirm={proceedWithBooking}
        onClose={() => setDuplicateWarningOpen(false)}
      />

      {/* Error Popup Modal */}
      <ConfirmationDialog
        open={errorOpen}
        title="Action Required"
        message={errorMessage}
        confirmText="Understood"
        confirmColor="error"
        hideCancel={true}
        onConfirm={() => setErrorOpen(false)}
        onClose={() => setErrorOpen(false)}
      />

      {/* Cancel Confirmation Modal */}
      <ConfirmationDialog
        open={cancelConfirmOpen}
        title="Cancel Appointment?"
        message="Are you absolutely sure you want to cancel this appointment? This action cannot be undone."
        confirmText="Yes, Cancel It"
        cancelText="Keep Appointment"
        confirmColor="error"
        onConfirm={confirmCancelAppointment}
        onClose={() => setCancelConfirmOpen(false)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationDialog
        open={deleteConfirmOpen}
        title="Delete Appointment?"
        message="Are you sure you want to completely delete this record from your history? This action is permanent and cannot be undone."
        confirmText="Yes, Delete It"
        cancelText="Keep Record"
        confirmColor="error"
        onConfirm={confirmDeleteAppointment}
        onClose={() => setDeleteConfirmOpen(false)}
      />
    </Box>
  );
};
