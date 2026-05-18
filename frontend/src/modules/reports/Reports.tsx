import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  CircularProgress,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import { Description, Download, Visibility, Search, CalendarToday, Delete } from '@mui/icons-material';
import axios from 'axios';

interface Report {
  id: number;
  report_name: string;
  file_url: string;
  report_date: string;
  uploaded_at: string;
}

export const Reports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Delete confirmation dialog states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/v1/reports/');
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (report: Report) => {
    setReportToDelete(report);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteReport = async () => {
    if (!reportToDelete) return;
    setDeleting(true);
    setError('');
    try {
      await axios.delete(`http://127.0.0.1:8000/api/v1/reports/${reportToDelete.id}`);
      fetchReports();
      setDeleteConfirmOpen(false);
      setReportToDelete(null);
    } catch (err: any) {
      console.error(err);
      setError('Failed to delete report.');
    } finally {
      setDeleting(false);
    }
  };

  const filteredReports = reports.filter((report) =>
    report.report_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
      <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { md: 'center' }, gap: 2 }}>
        <Box>
          <Typography variant="h4" gutterBottom>My Reports</Typography>
          <Typography color="text.secondary">
            View, download, and track all your medical test reports.
          </Typography>
        </Box>
        <TextField
          variant="outlined"
          placeholder="Search reports..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="action" />
                </InputAdornment>
              ),
            }
          }}
          sx={{ width: { xs: '100%', md: 300 }, bgcolor: 'white', borderRadius: 1 }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredReports.map((report) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={report.id}>
              <Card sx={{ height: '100%', transition: '0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 } }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ bgcolor: 'error.light', color: 'white', p: 1.5, borderRadius: 2, display: 'flex' }}>
                        <Description />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                        {report.report_name}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label="PDF" size="small" sx={{ fontWeight: 600, bgcolor: 'grey.100' }} />
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => handleDeleteClick(report)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 3 }}>
                    <CalendarToday fontSize="small" />
                    <Typography variant="body2">
                      Generated on: {report.report_date}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button 
                      variant="outlined" 
                      startIcon={<Visibility />} 
                      fullWidth
                      onClick={() => window.open(report.file_url, '_blank')}
                      sx={{ textTransform: 'none', borderRadius: 2 }}
                    >
                      View
                    </Button>
                    <Button 
                      variant="contained" 
                      color="primary"
                      startIcon={<Download />} 
                      fullWidth
                      onClick={() => window.open(report.file_url, '_blank')}
                      sx={{ textTransform: 'none', borderRadius: 2 }}
                    >
                      Download
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {filteredReports.length === 0 && (
            <Box sx={{ width: '100%', textAlign: 'center', p: 8 }}>
              <Typography variant="h6" color="text.secondary">No reports found.</Typography>
            </Box>
          )}
        </Grid>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => !deleting && setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: 4, p: 1 }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          Delete Report?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete the diagnostic report **{reportToDelete?.report_name}**?
          </Typography>
          <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 1, fontWeight: 600 }}>
            This action is permanent and will completely delete the report record.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteConfirmOpen(false)}
            disabled={deleting}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteReport}
            variant="contained"
            color="error"
            disabled={deleting}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            {deleting ? <CircularProgress size={24} color="inherit" /> : 'Delete Report'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
