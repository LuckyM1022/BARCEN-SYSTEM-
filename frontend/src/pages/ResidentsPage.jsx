import { useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api';
import { clearCurrentUser, getCurrentUser } from '../auth';
import CensusDashboardShortcut from '../components/CensusDashboardShortcut';
import barcenLogo from '../resources/Barcen_logo.png';
import './AdminPage.css';
import CertificatePreviewDialog from './CertificatePreviewDialog';

function ResidentsPage() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [residentRecords, setResidentRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResident, setSelectedResident] = useState(null);
  const [certificateType, setCertificateType] = useState('');
  const [status, setStatus] = useState({ severity: 'info', message: 'Loading residents...' });
  const [residentActionStatus, setResidentActionStatus] = useState(null);
  const [deletingResidentId, setDeletingResidentId] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadResidents() {
      try {
        const data = await apiRequest('/api/residents');

        if (!cancelled) {
          setResidentRecords(data.residents);
          setStatus(null);
        }
      } catch (error) {
        if (!cancelled) {
          setStatus({ severity: 'error', message: error.message });
        }
      }
    }

    loadResidents();
    const intervalId = window.setInterval(loadResidents, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const filteredRecords = residentRecords.filter((record) => {
    const searchableText = [record.name, record.address, record.submittedBy]
      .join(' ')
      .toLowerCase();

    return searchableText.includes(searchTerm.toLowerCase());
  });

  const handleOpenCertificateDialog = (resident) => {
    setSelectedResident(resident);
  };

  const handleCloseCertificateDialog = () => {
    setSelectedResident(null);
    setCertificateType('');
  };

  const handleSelectCertificateType = (type) => {
    if (type === 'indigency') {
      setCertificateType(type);
      return;
    }

    setResidentActionStatus({
      severity: 'info',
      message: `${type === 'residency' ? 'Certificate of Residency' : 'Barangay ID'} preview will be added next.`,
    });
    handleCloseCertificateDialog();
  };

  const handleResidentDelete = async (residentId) => {
    if (!window.confirm('Are you sure you want to delete this resident?')) {
      return;
    }

    setResidentActionStatus(null);
    setDeletingResidentId(residentId);

    try {
      await apiRequest(`/api/residents/${residentId}`, { method: 'DELETE' });
      setResidentRecords((current) => current.filter((resident) => resident.id !== residentId));
      setResidentActionStatus({ severity: 'success', message: 'Resident removed.' });
    } catch (error) {
      setResidentActionStatus({ severity: 'error', message: error.message });
    } finally {
      setDeletingResidentId('');
    }
  };

  const handleLogout = () => {
    clearCurrentUser();
    navigate('/login');
  };

  return (
    <main className="admin-page">
      <Box className="admin-layout">
        <aside className="admin-sidebar">
          <Box className="admin-brand-block">
            <img className="admin-brand-logo" src={barcenLogo} alt="Barcen logo" />
            <Typography className="admin-brand">BARCEN Validator</Typography>
          </Box>
          <Stack spacing={1.5} className="admin-nav">
            <Button component={RouterLink} to="/personnel-validator?view=dashboard" variant="text">
              Dashboard
            </Button>
            <Button component={RouterLink} to="/personnel-validator/residents" variant="contained">
              Households / Residents
            </Button>
            <Button component={RouterLink} to="/personnel-validator?view=reports" variant="text">
              Reports
            </Button>
            <Button component={RouterLink} to="/personnel-validator?view=settings" variant="text">
              Settings
            </Button>
            {currentUser?.role === 'Admin' && (
              <Button component={RouterLink} to="/admin?view=residents" variant="text">
                Admin Residents
              </Button>
            )}
            <Button variant="text" onClick={handleLogout}>
              Log Out
            </Button>
          </Stack>
        </aside>

        <section className="admin-content">
          <Box className="admin-header">
            <Box>
              <Typography variant="h3" className="admin-title">
                Residents Table
              </Typography>
              <Typography className="admin-copy">
                Review resident records, add new entries, remove outdated data, and generate certificates from shared census records.
              </Typography>
            </Box>
            <Box className="admin-user">
              <Avatar className="admin-avatar">{currentUser?.name?.charAt(0) || 'V'}</Avatar>
              <Box>
                <Typography className="admin-user-name">{currentUser?.name || 'Validator User'}</Typography>
                <Typography className="admin-user-role">
                  {currentUser?.role || 'Personnel and Validation Officer'}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box className="admin-panels">
            <Paper className="admin-panel admin-panel-wide" elevation={0}>
              <Box className="admin-panel-header">
                <Typography variant="h6" className="admin-panel-title">
                  Census Taker Shortcut
                </Typography>
                <Box className="admin-panel-tools">
                  <Chip label="Realtime sync every 5s" size="small" />
                  <CensusDashboardShortcut canAccess={['Admin', 'Personnel / Validator', 'Census Taker'].includes(currentUser?.role)} />
                </Box>
              </Box>

              {status && (
                <Alert severity={status.severity} className="admin-alert">
                  {status.message}
                </Alert>
              )}

              <Typography className="admin-copy">
                New resident entries should be created from the Census Taker page. Use the shortcut icon to open it.
              </Typography>
            </Paper>

            <Paper className="admin-panel admin-panel-wide" elevation={0}>
              <Box className="admin-panel-header">
                <Typography variant="h6" className="admin-panel-title">
                  Resident Records
                </Typography>
                <TextField
                  size="small"
                  className="admin-search"
                  label="Search residents"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </Box>

              {residentActionStatus && (
                <Alert severity={residentActionStatus.severity} className="admin-alert">
                  {residentActionStatus.message}
                </Alert>
              )}

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Resident</TableCell>
                      <TableCell>Address</TableCell>
                      <TableCell>Submitted By</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.name}</TableCell>
                        <TableCell>{record.address}</TableCell>
                        <TableCell>{record.submittedBy}</TableCell>
                        <TableCell>
                          <Box className="admin-table-actions">
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => handleOpenCertificateDialog(record)}
                            >
                              Generate Certificate
                            </Button>
                            <Button
                              size="small"
                              variant="text"
                              color="error"
                              disabled={deletingResidentId === record.id}
                              onClick={() => handleResidentDelete(record.id)}
                            >
                              {deletingResidentId === record.id ? 'Removing...' : 'Remove'}
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredRecords.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="admin-empty-state">
                          No matching records found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        </section>
      </Box>

      <Dialog
        open={Boolean(selectedResident) && !certificateType}
        onClose={handleCloseCertificateDialog}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Generate Certificate</DialogTitle>
        <DialogContent>
          <Typography className="admin-dialog-copy">
            Select the document to generate for{' '}
            <strong>{selectedResident?.name}</strong>.
          </Typography>
          <Stack spacing={1.5} className="admin-dialog-actions">
            <Button
              variant="contained"
              onClick={() => handleSelectCertificateType('indigency')}
            >
              Certificate of Indigency
            </Button>
            <Button variant="outlined" onClick={() => handleSelectCertificateType('residency')}>
              Certificate of Residency
            </Button>
            <Button variant="outlined" onClick={() => handleSelectCertificateType('barangay-id')}>
              Barangay ID
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCertificateDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      <CertificatePreviewDialog
        open={certificateType === 'indigency'}
        onClose={handleCloseCertificateDialog}
        resident={selectedResident}
      />
    </main>
  );
}

export default ResidentsPage;
