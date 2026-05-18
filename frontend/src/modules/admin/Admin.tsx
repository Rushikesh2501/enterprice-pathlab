import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputLabel,
  CircularProgress,
  Stack,
  Alert,
  IconButton
} from '@mui/material';
import {
  CloudUpload,
  CheckCircle,
  FilePresent,
  AdminPanelSettings,
  Refresh
} from '@mui/icons-material';
import axios from 'axios';

interface AppointmentData {
  id: number;
  user_id: number;
  patient_name: string;
  package_id: number;
  package_name: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  visit_type: string;
  address: string | null;
  phone_number: string | null;
}

export const Admin: React.FC = () => {
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Upload modal states
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [selectedAppt, setSelectedAppt] = useState<AppointmentData | null>(null);
  const [reportName, setReportName] = useState<string>('');
  const [reportDate, setReportDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [renamingPreview, setRenamingPreview] = useState<string>('');

  // Action state messages
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/v1/admin/appointments');
      setAppointments(response.data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch appointments list.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUpload = (appt: AppointmentData) => {
    setSelectedAppt(appt);
    setReportName(`${appt.package_name} Report`);
    setReportDate(new Date().toISOString().split('T')[0]);
    setSelectedFile(null);
    setRenamingPreview('');
    setStatusMessage(null);
    setOpenModal(true);
  };

  const generateRenamedFilename = (packageName: string, userId: number, appointmentId: number): string => {
    const cleanPackage = packageName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')          // replace spaces with underscores
      .replace(/[^a-z0-9_]/g, '')    // strip out any special characters except underscores
      .replace(/_+/g, '_');          // avoid double underscores
    return `report_${cleanPackage}_${userId}_${appointmentId}.pdf`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        setStatusMessage({ type: 'error', text: 'Only PDF documents are allowed.' });
        setSelectedFile(null);
        setRenamingPreview('');
        return;
      }
      setSelectedFile(file);
      setStatusMessage(null);

      // Calculate dynamic preview of how the file will be saved in Azure
      if (selectedAppt) {
        const renamed = generateRenamedFilename(selectedAppt.package_name, selectedAppt.user_id, selectedAppt.id);
        setRenamingPreview(renamed);
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppt || !selectedFile) {
      setStatusMessage({ type: 'error', text: 'Please select a PDF report file.' });
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);

    try {
      // 1. Core Renaming Execution (Package Name + Patient ID + Appointment ID)
      const renamedName = generateRenamedFilename(selectedAppt.package_name, selectedAppt.user_id, selectedAppt.id);
      const renamedFile = new File([selectedFile], renamedName, { type: selectedFile.type });

      // 2. Prepare Multipart Form Request
      const formData = new FormData();
      formData.append('appointment_id', selectedAppt.id.toString());
      formData.append('report_name', reportName);
      formData.append('report_date', reportDate);
      formData.append('file', renamedFile);

      // 3. Dispatch to Azure SQL & Azure Files REST endpoint
      await axios.post('http://127.0.0.1:8000/api/v1/admin/reports/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setStatusMessage({
        type: 'success',
        text: `Report uploaded successfully! Saved as "${renamedName}" and mapped to Appointment #${selectedAppt.id}.`
      });

      // Refresh list to instantly show "Completed" status
      fetchAppointments();

      // Close modal after brief success window
      setTimeout(() => {
        setOpenModal(false);
        setSelectedFile(null);
        setRenamingPreview('');
      }, 2500);

    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.detail || 'Failed to complete report upload.';
      setStatusMessage({ type: 'error', text: errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusChipColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'completed';
      case 'successful':
      case 'sample collected':
        return 'Sample Collected';
      case 'booked':
        return 'booked';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getMuiColor = (customColor: string) => {
    switch (customColor) {
      case 'completed':
        return 'success';
      case 'Sample Collected':
        return 'warning';
      case 'booked':
        return 'primary';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    const lower = status.toLowerCase();
    if (lower === 'successful' || lower === 'success' || lower === 'sample collected') {
      return 'Sample Collected';
    }
    return status;
  };

  const visibleAppointments = appointments.filter(appt => appt.status.toLowerCase() !== 'booked');

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AdminPanelSettings color="primary" sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>Admin Portal</Typography>
            <Typography variant="body2" color="text.secondary">
              Upload diagnostic pathology reports and manage appointments.
            </Typography>
          </Box>
        </Box>
        <IconButton color="primary" onClick={fetchAppointments} disabled={loading} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Refresh />
        </IconButton>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
              <CircularProgress />
            </Box>
          ) : visibleAppointments.length === 0 ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <Typography color="text.secondary">No appointments scheduled.</Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead sx={{ bgcolor: 'grey.50' }}>
                  <TableRow>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Appt ID</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Patient Name</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Package/Test</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Schedule Date</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Time</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleAppointments.map((appt) => (
                    <TableRow key={appt.id} hover>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>#{appt.id}</TableCell>
                      <TableCell align="center">{appt.patient_name}</TableCell>
                      <TableCell align="center">{appt.package_name}</TableCell>
                      <TableCell align="center">{appt.appointment_date}</TableCell>
                      <TableCell align="center">{appt.appointment_time}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={getStatusLabel(appt.status)}
                          size="small"
                          color={getMuiColor(getStatusChipColor(appt.status)) as any}
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', alignItems: 'center' }}>
                          {appt.status.toLowerCase() === 'completed' ? (
                            <Button
                              variant="outlined"
                              size="small"
                              color="primary"
                              startIcon={<CloudUpload />}
                              onClick={() => handleOpenUpload(appt)}
                              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                            >
                              Upload Again
                            </Button>
                          ) : ['successful', 'success', 'sample collected'].includes(appt.status.toLowerCase()) ? (
                            <Button
                              variant="contained"
                              size="small"
                              color="primary"
                              startIcon={<CloudUpload />}
                              onClick={() => handleOpenUpload(appt)}
                              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                            >
                              Upload Report
                            </Button>
                          ) : null}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Upload PDF Dialog */}
      <Dialog
        open={openModal}
        onClose={() => !submitting && setOpenModal(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: 4, p: 1 }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          Upload Pathology PDF Report
        </DialogTitle>
        <form onSubmit={handleUploadSubmit}>
          <DialogContent>
            {statusMessage && (
              <Alert severity={statusMessage.type} sx={{ mb: 3, borderRadius: 2 }}>
                {statusMessage.text}
              </Alert>
            )}

            <Stack spacing={3}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Appointment ID (Mandatory)"
                  value={selectedAppt ? `#${selectedAppt.id}` : ''}
                  disabled
                  fullWidth
                  slotProps={{
                    input: { readOnly: true }
                  }}
                />
                <TextField
                  label="Patient Name (Mandatory)"
                  value={selectedAppt ? selectedAppt.patient_name : ''}
                  disabled
                  fullWidth
                  slotProps={{
                    input: { readOnly: true }
                  }}
                />
              </Box>

              <TextField
                label="Report Title"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                required
                fullWidth
              />

              <TextField
                label="Report Date"
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                required
                fullWidth
                slotProps={{
                  inputLabel: { shrink: true }
                }}
              />

              {/* Upload Drop Zone / Button */}
              <Box>
                <InputLabel sx={{ mb: 1, fontWeight: 600 }}>PDF Report File (Mandatory)</InputLabel>
                <Box
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    border: '2px dashed',
                    borderColor: selectedFile ? 'success.light' : 'primary.light',
                    borderRadius: 3,
                    p: 4,
                    textAlign: 'center',
                    cursor: 'pointer',
                    bgcolor: 'action.hover',
                    transition: '0.2s',
                    '&:hover': {
                      bgcolor: 'action.selected',
                      borderColor: 'primary.main'
                    }
                  }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />

                  {selectedFile ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <CheckCircle color="success" sx={{ fontSize: 40 }} />
                      <Typography sx={{ fontWeight: 600, color: 'success.main' }}>
                        Selected: {selectedFile.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <CloudUpload color="primary" sx={{ fontSize: 40 }} />
                      <Typography sx={{ fontWeight: 600 }}>
                        Click to browse or drop PDF report file here
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Only PDF documents are allowed
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Renaming Verification Box */}
              {renamingPreview && (
                <Box sx={{ bgcolor: 'info.lighter', p: 2, borderRadius: 2, border: '1px solid', borderColor: 'info.light' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'info.dark', mb: 0.5 }}>
                    <FilePresent fontSize="small" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Automatic Target Renaming System
                    </Typography>
                  </Box>
                  <Typography variant="body2">
                    The report will be automatically renamed and uploaded as:
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 0.5, fontWeight: 700, color: 'primary.main', bgcolor: 'white', p: 0.75, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                    {renamingPreview}
                  </Typography>
                </Box>
              )}
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setOpenModal(false)}
              disabled={submitting}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting || !selectedFile}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              {submitting ? <CircularProgress size={24} color="inherit" /> : 'Confirm Upload'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
