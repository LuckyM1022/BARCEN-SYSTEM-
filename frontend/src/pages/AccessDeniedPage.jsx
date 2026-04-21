import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { clearCurrentUser, getCurrentUser, getDefaultRouteForRole } from '../auth';
import './LoginPage.css';

function AccessDeniedPage() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const homeRoute = currentUser ? getDefaultRouteForRole(currentUser.role) : '/login';

  const handleLogout = () => {
    clearCurrentUser();
    navigate('/login');
  };

  return (
    <main className="login-shell">
      <Paper className="login-card" elevation={0}>
        <Box className="login-panel login-panel-form" sx={{ width: '100%' }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h4" className="form-title">
                Access Denied
              </Typography>
              <Typography className="form-copy">
                Your current role does not have permission to open this page.
              </Typography>
            </Box>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: '8px' }}>
              <Typography sx={{ fontWeight: 700 }}>
                Signed in as: {currentUser?.name || 'Guest'}
              </Typography>
              <Typography sx={{ color: '#6a7782' }}>
                Role: {currentUser?.role || 'Not signed in'}
              </Typography>
            </Paper>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button component={RouterLink} to={homeRoute} variant="contained" size="large">
                Go To My Page
              </Button>
              {currentUser ? (
                <Button onClick={handleLogout} variant="outlined" size="large">
                  Log Out
                </Button>
              ) : (
                <Button component={RouterLink} to="/login" variant="outlined" size="large">
                  Back To Login
                </Button>
              )}
            </Stack>
          </Stack>
        </Box>
      </Paper>
    </main>
  );
}

export default AccessDeniedPage;
