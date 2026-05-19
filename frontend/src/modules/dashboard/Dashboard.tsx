import { useState, useEffect } from 'react'; 
import {
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Button,
  Avatar,
  IconButton,
  Chip
} from '@mui/material';
import { 
  Science, 
  Event, 
  History, 
  ArrowForward,
  MoreVert,
  CheckCircle,
  Description,
  Download
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../services/api';
 
export const Dashboard = () => {
  const navigate = useNavigate();
  const [recentReport, setRecentReport] = useState<any>(null);
  const [stats, setStats] = useState({
    totalReports: 0,
    completedTests: 0,
    upcomingAppts: 0,
    totalSampleCollected: 0
  });
 
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [reportsRes, testsRes, apptsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/v1/reports/`),
          axios.get(`${API_BASE_URL}/api/v1/test-history/`),
          axios.get(`${API_BASE_URL}/api/v1/appointments/`)
        ]);
 
        const reports = reportsRes.data;
        const tests = testsRes.data;
        const appts = apptsRes.data;
 
        // Set Recent Report
        if (reports && reports.length > 0) {
          const sorted = [...reports].sort((a: any, b: any) => 
            new Date(b.report_date).getTime() - new Date(a.report_date).getTime()
          );
          setRecentReport(sorted[0]);
        }
 
        // Set Stats
        setStats({
          totalReports: reports.length,
          completedTests: tests.length,
          upcomingAppts: appts.filter((a: any) => a.status.toLowerCase() === 'booked').length,
          totalSampleCollected: appts.filter((a: any) => 
            ['successful', 'success', 'sample collected'].includes(a.status.toLowerCase())
          ).length
        });
 
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      }
    };
    fetchDashboardData();
  }, []);
 
  return (
    <Box>
      {/* Welcome Section */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Good Morning
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here is your health overview for today.
          </Typography>
        </Box>
        <Button variant="contained" color="primary" startIcon={<Event />} onClick={() => navigate('/appointments')}>
          Book Test
        </Button>
      </Box>
 
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { title: 'Total Reports', value: stats.totalReports, icon: <Science />, color: '#3b82f6' },
          { title: 'Completed Tests', value: stats.completedTests, icon: <History />, color: '#10b981' },
          { title: 'Upcoming Appointments', value: stats.upcomingAppts, icon: <Event />, color: '#f59e0b' },
          { title: 'Total Sample Collected', value: stats.totalSampleCollected, icon: <CheckCircle />, color: '#8b5cf6' },
        ].map((stat, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <Card elevation={0}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Avatar sx={{ bgcolor: `${stat.color}15`, color: stat.color, width: 48, height: 48 }}>
                    {stat.icon}
                  </Avatar>
                  <IconButton size="small"><MoreVert /></IconButton>
                </Box>
                <Typography variant="h3" sx={{ mb: 1 }}>{stat.value}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {stat.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card elevation={0} sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Recent Reports</Typography>
                <Button endIcon={<ArrowForward />} onClick={() => navigate('/reports')}>View All</Button>
              </Box>
              
              {recentReport ? (
                <Box sx={{ bgcolor: 'background.default', borderRadius: 2, p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ bgcolor: 'error.light', color: 'white', p: 1.5, borderRadius: 2, display: 'flex' }}>
                      <Description />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{recentReport.report_name}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Chip label="PDF" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                        <Typography variant="body2" color="text.secondary">{recentReport.report_date}</Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    startIcon={<Download />}
                    onClick={() => window.open(recentReport.file_url, '_blank')}
                  >
                    Download
                  </Button>
                </Box>
              ) : (
                <Box sx={{ bgcolor: 'background.default', borderRadius: 2, p: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">No recent reports found.</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={0} sx={{ height: '100%', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>AI Health Assistant</Typography>
              <Typography variant="body2" sx={{ mb: 4, opacity: 0.9 }}>
                Have questions about your reports? Ask our AI assistant in English, Hindi, or Marathi!
              </Typography>
              <Button 
                variant="contained" 
                fullWidth 
                onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chat'))}
                sx={{ 
                  bgcolor: 'white', 
                  color: 'primary.main',
                  '&:hover': { bgcolor: 'grey.100' }
                }}
              >
                Chat Now
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
