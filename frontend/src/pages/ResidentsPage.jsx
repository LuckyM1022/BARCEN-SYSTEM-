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
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api';
import { clearCurrentUser, getCurrentUser } from '../auth';
import ConfirmationDialog from '../components/ConfirmationDialog';
import CensusDashboardShortcut from '../components/CensusDashboardShortcut';
import barcenLogo from '../resources/Barcen_logo.png';
import './AdminPage.css';
import CertificatePreviewDialog from './CertificatePreviewDialog';

const formatBirthday = (value) => {
  if (!value) {
    return 'Not provided';
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

function ResidentsPage() {
  const rowsPerPage = 10;
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [residentRecords, setResidentRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResident, setSelectedResident] = useState(null);
  const [certificateType, setCertificateType] = useState('');
  const [status, setStatus] = useState({ severity: 'info', message: 'Loading residents...' });
  const [residentActionStatus, setResidentActionStatus] = useState(null);
  const [deletingResidentId, setDeletingResidentId] = useState('');
  const [residentToDelete, setResidentToDelete] = useState(null);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadResidents() {
      try {
        const searchParams = new URLSearchParams({
          page: String(page),
          pageSize: String(rowsPerPage),
        });

        if (searchTerm.trim()) {
          searchParams.set('search', searchTerm.trim());
        }

        const data = await apiRequest(`/api/residents?${searchParams.toString()}`);

        if (!cancelled) {
          setResidentRecords(data.residents || []);
          setTotalCount(data.totalCount || 0);
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
  }, [page, searchTerm]);

  useEffect(() => {
    setPage((current) => Math.min(current, Math.max(0, Math.ceil(totalCount / rowsPerPage) - 1)));
  }, [totalCount]);

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

  const handleResidentDelete = async () => {
    if (!residentToDelete?.id) {
      return;
    }

    setResidentActionStatus(null);
    setDeletingResidentId(residentToDelete.id);

    try {
      await apiRequest(`/api/residents/${residentToDelete.id}`, { method: 'DELETE' });
      setResidentRecords((current) => current.filter((resident) => resident.id !== residentToDelete.id));
      setTotalCount((current) => Math.max(0, current - 1));
      setResidentActionStatus({ severity: 'success', message: 'Resident removed.' });
    } catch (error) {
      setResidentActionStatus({ severity: 'error', message: error.message });
    } finally {
      setDeletingResidentId('');
      setResidentToDelete(null);
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
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setPage(0);
                  }}
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
                      <TableCell>Birthday</TableCell>
                      <TableCell>Address</TableCell>
                      <TableCell>Submitted By</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {residentRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.name}</TableCell>
                        <TableCell>{formatBirthday(record.birthday)}</TableCell>
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
                              onClick={() => setResidentToDelete(record)}
                            >
                              {deletingResidentId === record.id ? 'Removing...' : 'Remove'}
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                    {residentRecords.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="admin-empty-state">
                          No matching records found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={totalCount}
                page={page}
                onPageChange={(event, nextPage) => setPage(nextPage)}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[rowsPerPage]}
              />
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

      <ConfirmationDialog
        open={Boolean(residentToDelete)}
        title="Remove Resident"
        message={`Are you sure you want to remove ${residentToDelete?.name || 'this resident'}?`}
        confirmLabel="Remove"
        loading={Boolean(residentToDelete) && deletingResidentId === residentToDelete?.id}
        onClose={() => setResidentToDelete(null)}
        onConfirm={handleResidentDelete}
      />
    </main>
  );
}

export default ResidentsPage;
