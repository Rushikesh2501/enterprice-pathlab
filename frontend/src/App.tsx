import { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { theme } from './theme';
import { MainLayout } from './components/layouts/MainLayout';
import { Login } from './modules/auth/pages/Login';
import { Dashboard } from './modules/dashboard/Dashboard';
import { Catalogue } from './modules/catalogue/Catalogue';
import { Appointments } from './modules/appointments/Appointments';
import { Reports } from './modules/reports/Reports';
import { TestHistory } from './modules/test-history/TestHistory';
import { Admin } from './modules/admin/Admin';

function App() {
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('pathlab_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
    localStorage.setItem('pathlab_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('pathlab_user');
  };

  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          {!user ? (
            <Route path="*" element={<Login onLoginSuccess={handleLoginSuccess} />} />
          ) : (
            /* Protected Routes */
            <Route element={<MainLayout user={user} onLogout={handleLogout} />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/history" element={<TestHistory />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/catalogue" element={<Catalogue />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          )}
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
