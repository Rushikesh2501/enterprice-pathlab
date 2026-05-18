import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress
} from '@mui/material';
import { Science, CalendarToday, Description } from '@mui/icons-material';
import axios from 'axios';

interface TestHistoryData {
  id: number;
  test_name: string;
  result_summary: string;
  test_date: string;
}

export const TestHistory = () => {
  const [history, setHistory] = useState<TestHistoryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/v1/test-history/');
      // Sort by date descending
      const sorted = response.data.sort((a: any, b: any) => 
        new Date(b.test_date).getTime() - new Date(a.test_date).getTime()
      );
      setHistory(sorted);
    } catch (error) {
      console.error('Error fetching test history:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, margin: '0 auto' }}>
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>Health Timeline</Typography>
        <Typography color="text.secondary">
          Track your complete pathology test history over time.
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
          <CircularProgress />
        </Box>
      ) : history.length === 0 ? (
        <Box sx={{ textAlign: 'center', p: 8 }}>
          <Typography variant="h6" color="text.secondary">No test history found.</Typography>
        </Box>
      ) : (
        <Box sx={{ position: 'relative', ml: { xs: 2, md: 0 } }}>
          {/* Vertical Timeline Line */}
          <Box 
            sx={{ 
              position: 'absolute', 
              top: 0, 
              bottom: 0, 
              left: { xs: 0, md: '50%' }, 
              width: 2, 
              bgcolor: 'divider',
              transform: { md: 'translateX(-50%)' },
              display: { xs: 'none', sm: 'block' }
            }} 
          />

          {history.map((test, index) => (
            <Box 
              key={test.id} 
              sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', md: 'row' },
                justifyContent: index % 2 === 0 ? 'flex-start' : 'flex-end',
                alignItems: 'center',
                mb: 4,
                position: 'relative'
              }}
            >
              {/* Timeline Dot */}
              <Box 
                sx={{
                  position: 'absolute',
                  left: { xs: -8, md: '50%' },
                  transform: { md: 'translateX(-50%)' },
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  border: '4px solid white',
                  boxShadow: 1,
                  display: { xs: 'none', sm: 'block' },
                  zIndex: 1
                }}
              />

              {/* Timeline Content */}
              <Box 
                sx={{ 
                  width: { xs: '100%', md: '45%' },
                  pl: { xs: 4, md: index % 2 === 0 ? 0 : 4 },
                  pr: { xs: 0, md: index % 2 === 0 ? 4 : 0 },
                  textAlign: { xs: 'left', md: index % 2 === 0 ? 'right' : 'left' }
                }}
              >
                <Card sx={{ transition: '0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 } }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: { xs: 'column', md: index % 2 === 0 ? 'row-reverse' : 'row' },
                      alignItems: { xs: 'flex-start', md: 'center' },
                      gap: 2,
                      mb: 2
                    }}>
                      <Box sx={{ bgcolor: 'primary.light', color: 'white', p: 1, borderRadius: 2, display: 'flex' }}>
                        <Science fontSize="small" />
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>{test.test_name}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mt: 0.5, justifyContent: { xs: 'flex-start', md: index % 2 === 0 ? 'flex-end' : 'flex-start' } }}>
                          <CalendarToday fontSize="small" />
                          <Typography variant="body2">{test.test_date}</Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 2, textAlign: 'left' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Description color="action" fontSize="small" />
                        <Typography variant="subtitle2" color="text.secondary">Result Summary</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {test.result_summary || "Results not summarized."}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};
