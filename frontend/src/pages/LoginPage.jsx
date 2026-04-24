import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../api';
import { getDefaultRouteForRole, saveCurrentUser } from '../auth';
import barcenLogo from '../resources/Barcen_logo.png';
import './LoginPage.css';

function LoginPage() {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState({
    email: '',
    password: '',
    rememberMe: true,
  });
  const [authStatus, setAuthStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value, checked, type } = event.target;

    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setAuthStatus(null);
    setIsSubmitting(true);

    try {
      const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: formValues.email,
          password: formValues.password,
        }),
      });

      setAuthStatus({
        severity: 'success',
        message: `Welcome back, ${data.user.name}.`,
      });
      saveCurrentUser(data.user, data.token);
      navigate(getDefaultRouteForRole(data.user.role));
    } catch (error) {
      setAuthStatus({
        severity: 'error',
        message: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-shell">
      <Paper className="login-card" elevation={0}>
        <Box className="login-panel login-panel-brand">
          <Box className="brand-header">
            <img className="brand-logo" src={barcenLogo} alt="Barcen logo" />
            <Typography className="brand-kicker">Barcen Census Portal</Typography>
          </Box>

          <Typography component="h1" className="brand-title">
            Collect accurate household data with a secure, field-ready census
            platform.
          </Typography>
          <Typography className="brand-copy">
            Sign in to manage enumerators, review submissions, monitor response
            coverage, and keep census operations consistent across every area.
          </Typography>

          <Stack className="brand-metrics" spacing={2}>
            <Box className="metric-card">
              <Typography className="metric-value">100%</Typography>
              <Typography className="metric-label">
                Structured census records in one central system
              </Typography>
            </Box>
            <Box className="metric-card">
              <Typography className="metric-value">Live</Typography>
              <Typography className="metric-label">
                Progress tracking across barangays and field teams
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Box className="login-panel login-panel-form">
          <Stack spacing={3} component="form" onSubmit={handleSubmit}>
            <Box>
              <Typography variant="h4" className="form-title">
                Sign in
              </Typography>
              <Typography className="form-copy">
                Use your official account to access census assignments,
                respondent records, and reporting tools.
              </Typography>
            </Box>

            {authStatus && (
              <Alert severity={authStatus.severity} variant="outlined">
                {authStatus.message}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Email address"
              name="email"
              type="email"
              value={formValues.email}
              onChange={handleChange}
              autoComplete="email"
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formValues.password}
              onChange={handleChange}
              autoComplete="current-password"
            />

            <Box className="form-row">
              <FormControlLabel
                control={
                  <Checkbox
                    name="rememberMe"
                    checked={formValues.rememberMe}
                    onChange={handleChange}
                  />
                }
                label="Remember me"
              />
            </Box>

            <Button size="large" type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? 'Logging in...' : 'Login'}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </main>
  );
}

export default LoginPage;
