import { useState } from 'react';
import { Alert, Box, Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api';
import { clearCurrentUser, getCurrentUser, getDefaultRouteForRole } from '../auth';
import BarangayLogo from '../resources/Barcen_logo.png';
import './CensusTakerPage.css';

const STO_NINO_SAPA_AREAS = [
  'Balut Street',
  'BondocVille',
  'Osmena East Street',
  'Osmena West Street',
  'NorthVille',
  'Quirino Street',
];

function CensusTakerPage() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const homeRoute = getDefaultRouteForRole(currentUser?.role);
  const initialFormValues = {
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    birthday: '',
    genderAtBirth: '',
    houseNumber: '',
    area: '',
    barangay: 'Barangay Sto. Nino Sapa',
    municipality: 'Sto. Tomas, Pampanga',
  };

  const [formValues, setFormValues] = useState(initialFormValues);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setSubmissionStatus(null);

    try {
      await apiRequest('/api/census-records', {
        method: 'POST',
        body: JSON.stringify(formValues),
      });
      setSubmissionStatus({
        severity: 'success',
        message: 'Census record saved and added to the residents list.',
      });
      setFormValues(initialFormValues);
    } catch (error) {
      setSubmissionStatus({
        severity: 'error',
        message: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    setFormValues(initialFormValues);
  };

  const handleLogout = () => {
    clearCurrentUser();
    navigate('/login');
  };

  return (
    <main className="census-page">
      <Paper className="census-card" elevation={0}>
        <Stack spacing={3} component="form" onSubmit={handleSubmit}>
          <Box className="census-hero">
            <Box className="census-logo-wrap">
              <img src={BarangayLogo} alt="Barangay Sto. Nino Sapa logo" className="census-logo" />
            </Box>
            <Box className="census-heading">
              <Typography className="census-kicker">Barangay Sto. Nino Sapa</Typography>
              <Typography variant="h3" className="census-title">
                Census Taker Form
              </Typography>
              <Typography className="census-copy">
                Resident intake record for Sto. Tomas, Pampanga.
              </Typography>
            </Box>
            <Box className="census-hero-actions">
              <Box className="census-status" aria-label="Current record status">
                <span className="census-status-dot" />
                {currentUser?.name || 'Census Taker'}
              </Box>
              <Box className="census-top-actions">
                {currentUser?.role !== 'Census Taker' && (
                  <Button
                    component={RouterLink}
                    to={homeRoute}
                    variant="outlined"
                    className="census-back-button"
                  >
                    Back To My Page
                  </Button>
                )}
                <Button variant="outlined" className="census-logout" onClick={handleLogout}>
                  Log Out
                </Button>
              </Box>
            </Box>
          </Box>

          {submissionStatus && (
            <Box className="census-alert">
              <Alert severity={submissionStatus.severity}>{submissionStatus.message}</Alert>
            </Box>
          )}

          <Box className="census-section">
            <Box className="section-heading">
              <Typography className="section-label">Personal Information</Typography>
              <Typography className="section-helper">Legal name and birth details</Typography>
            </Box>
            <Box className="census-grid census-grid-three">
              <TextField
                fullWidth
                label="First name"
                name="firstName"
                value={formValues.firstName}
                onChange={handleChange}
              />
              <TextField
                fullWidth
                label="Middle name"
                name="middleName"
                value={formValues.middleName}
                onChange={handleChange}
              />
              <TextField
                fullWidth
                label="Last name"
                name="lastName"
                value={formValues.lastName}
                onChange={handleChange}
              />
            </Box>

            <Box className="census-grid census-grid-three">
              <TextField
                fullWidth
                label="Suffix"
                name="suffix"
                value={formValues.suffix}
                onChange={handleChange}
              />
              <TextField
                fullWidth
                label="Birthday"
                name="birthday"
                type="date"
                value={formValues.birthday}
                onChange={handleChange}
                slotProps={{
                  inputLabel: { shrink: true },
                }}
              />
              <TextField
                select
                fullWidth
                label="Gender at birth"
                name="genderAtBirth"
                value={formValues.genderAtBirth}
                onChange={handleChange}
              >
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
              </TextField>
            </Box>
          </Box>

          <Box className="census-section">
            <Box className="section-heading">
              <Typography className="section-label">Address</Typography>
              <Typography className="section-helper">Barangay location details</Typography>
            </Box>
            <Box className="census-grid census-grid-address">
              <TextField
                fullWidth
                label="House number"
                name="houseNumber"
                value={formValues.houseNumber}
                onChange={handleChange}
              />
              <TextField
                select
                fullWidth
                label="Purok / Street"
                name="area"
                value={formValues.area}
                onChange={handleChange}
              >
                {STO_NINO_SAPA_AREAS.map((area) => (
                  <MenuItem key={area} value={area}>
                    {area}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                disabled
                label="Barangay"
                name="barangay"
                value={formValues.barangay}
              />
              <TextField
                fullWidth
                disabled
                label="Municipality"
                name="municipality"
                value={formValues.municipality}
              />
            </Box>
          </Box>

          <Box className="census-actions">
            <Button
              type="button"
              variant="outlined"
              size="large"
              className="secondary-action"
              onClick={handleClear}
            >
              Clear
            </Button>
            <Button
              type="submit"
              variant="contained"
              size="large"
              className="primary-action"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Record'}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </main>
  );
}

export default CensusTakerPage;
