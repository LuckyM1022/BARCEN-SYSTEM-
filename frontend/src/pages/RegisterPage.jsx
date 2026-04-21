import { useState } from 'react';
import { Alert, Box, Button, Link, Paper, Stack, TextField, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { apiRequest } from '../api';
import barcenLogo from '../resources/Barcen_logo.png';
import './LoginPage.css';
import './RegisterPage.css';

function RegisterPage() {
  const [formValues, setFormValues] = useState({
    email: '',
    firstName: '',
    middleName: '',
    lastName: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setRegistrationStatus(null);
    setIsSubmitting(true);

    try {
      const data = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(formValues),
      });

      setRegistrationStatus({
        severity: 'success',
        message: `${data.user.name} was registered as a Census Taker.`,
      });
      setFormValues({
        email: '',
        firstName: '',
        middleName: '',
        lastName: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
      });
    } catch (error) {
      setRegistrationStatus({
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
            Register authorized census personnel in one secure onboarding flow.
          </Typography>
          <Typography className="brand-copy">
            Create an account for field staff or coordinators so they can submit
            respondent data, manage assignments, and access census tools.
          </Typography>

          <Stack className="brand-metrics" spacing={2}>
            <Box className="metric-card">
              <Typography className="metric-value">Verified</Typography>
              <Typography className="metric-label">
                Personnel details captured before field deployment
              </Typography>
            </Box>
            <Box className="metric-card">
              <Typography className="metric-value">Secure</Typography>
              <Typography className="metric-label">
                Centralized account creation for census operations
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Box className="login-panel login-panel-form auth-form-panel">
          <Stack spacing={2} component="form" onSubmit={handleSubmit}>
            <Box>
              <Typography variant="h4" className="form-title">
                Create account
              </Typography>
              <Typography className="form-copy">
                Register a new user profile for the Barcen census system.
              </Typography>
            </Box>

            <Alert severity={registrationStatus?.severity || 'info'} variant="outlined">
              {registrationStatus?.message || 'Registration now saves new demo accounts to the local backend.'}
            </Alert>

            <TextField
              fullWidth
              label="Email address"
              name="email"
              type="email"
              value={formValues.email}
              onChange={handleChange}
              autoComplete="email"
            />

            <Box className="form-grid">
              <TextField
                fullWidth
                label="First name"
                name="firstName"
                value={formValues.firstName}
                onChange={handleChange}
                autoComplete="given-name"
              />
              <TextField
                fullWidth
                label="Middle name"
                name="middleName"
                value={formValues.middleName}
                onChange={handleChange}
                autoComplete="additional-name"
              />
            </Box>

            <TextField
              fullWidth
              label="Last name"
              name="lastName"
              value={formValues.lastName}
              onChange={handleChange}
              autoComplete="family-name"
            />

            <TextField
              fullWidth
              label="Phone number"
              name="phoneNumber"
              type="tel"
              value={formValues.phoneNumber}
              onChange={handleChange}
              autoComplete="tel"
            />

            <Box className="form-grid">
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={formValues.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
              <TextField
                fullWidth
                label="Confirm password"
                name="confirmPassword"
                type="password"
                value={formValues.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </Box>

            <Button size="large" type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? 'Registering...' : 'Register'}
            </Button>

            <Typography className="signup-copy">
              Already have an account?{' '}
              <Link component={RouterLink} to="/login">
                Sign in
              </Link>
            </Typography>
          </Stack>
        </Box>
      </Paper>
    </main>
  );
}

export default RegisterPage;
