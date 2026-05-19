import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  InputAdornment,
  Chip,
  CircularProgress,
  Divider,
  Avatar
} from '@mui/material';
import { Search, LocalHospital, Assignment, AttachMoney } from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../services/api';

interface Package {
  id: number;
  package_name: string;
  description: string;
  price: number;
}

export const Catalogue = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      // Fetching from our newly created backend endpoint
      const response = await axios.get(`${API_BASE_URL}/api/v1/catalogue/`);
      setPackages(response.data);
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = (packageId: number) => {
    navigate('/appointments', { state: { preSelectedPackageId: packageId } });
  };

  const filteredPackages = packages.filter((pkg) =>
    pkg.package_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pkg.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { md: 'center' }, gap: 2 }}>
        <Box>
          <Typography variant="h4" gutterBottom>Pathology Packages</Typography>
          <Typography color="text.secondary">
            Browse our comprehensive health checkup packages and book an appointment.
          </Typography>
        </Box>
        <TextField
          variant="outlined"
          placeholder="Search packages..."
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
          {filteredPackages.map((pkg) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={pkg.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: '0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 } }}>
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.light', color: 'white' }}>
                      <LocalHospital />
                    </Avatar>
                    <Chip label="Popular" color="secondary" size="small" sx={{ fontWeight: 600 }} />
                  </Box>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                    {pkg.package_name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <AttachMoney color="primary" fontSize="small" />
                    <Typography variant="h6" color="primary.main">
                      ₹{pkg.price}
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Assignment fontSize="small" sx={{ mt: 0.3 }} />
                    <span>{pkg.description}</span>
                  </Typography>
                </CardContent>
                <CardActions sx={{ p: 3, pt: 0 }}>
                  <Button variant="contained" fullWidth size="large" onClick={() => handleBookNow(pkg.id)}>
                    Book Now
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
          {filteredPackages.length === 0 && (
            <Box sx={{ width: '100%', textAlign: 'center', p: 8 }}>
              <Typography variant="h6" color="text.secondary">No packages found matching your search.</Typography>
            </Box>
          )}
        </Grid>
      )}
    </Box>
  );
};


