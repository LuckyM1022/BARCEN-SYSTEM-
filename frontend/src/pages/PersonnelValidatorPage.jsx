import { useEffect, useMemo, useState } from 'react';
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
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api';
import { clearCurrentUser, getCurrentUser, saveCurrentUser } from '../auth';
import ConfirmationDialog from '../components/ConfirmationDialog';
import CensusDashboardShortcut from '../components/CensusDashboardShortcut';
import barcenLogo from '../resources/Barcen_logo.png';
import './AdminPage.css';

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

function PersonnelValidatorPage() {
  const rowsPerPage = 5;
  const navigate = useNavigate();
  const location = useLocation();
  const [sessionUser, setSessionUser] = useState(() => getCurrentUser());
  const [stats, setStats] = useState([]);
  const [dashboardResidents, setDashboardResidents] = useState([]);
  const [dashboardResidentsTotal, setDashboardResidentsTotal] = useState(0);
  const [dashboardRecords, setDashboardRecords] = useState([]);
  const [dashboardRecordsTotal, setDashboardRecordsTotal] = useState(0);
  const [residents, setResidents] = useState([]);
  const [residentsTotal, setResidentsTotal] = useState(0);
  const [residentSearchTerm, setResidentSearchTerm] = useState('');
  const [reportResidents, setReportResidents] = useState([]);
  const [status, setStatus] = useState({ severity: 'info', message: 'Loading dashboard...' });
  const [activeView, setActiveView] = useState('dashboard');
  const [settingsStatus, setSettingsStatus] = useState(null);
  const [profileForm, setProfileForm] = useState({
    name: sessionUser?.name || '',
    email: sessionUser?.email || '',
    phoneNumber: sessionUser?.phoneNumber || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [residentActionStatus, setResidentActionStatus] = useState(null);
  const [residentPreview, setResidentPreview] = useState(null);
  const [deletingResidentId, setDeletingResidentId] = useState('');
  const [residentToDelete, setResidentToDelete] = useState(null);
  const [dashboardResidentsPage, setDashboardResidentsPage] = useState(0);
  const [dashboardRecordsPage, setDashboardRecordsPage] = useState(0);
  const [residentsPage, setResidentsPage] = useState(0);
  const [reportsResidentsPage, setReportsResidentsPage] = useState(0);
  const visibleStats = stats.filter((stat) => stat.label !== 'Pending Reviews');

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const view = searchParams.get('view');

    if (view && ['dashboard', 'residents', 'reports', 'settings'].includes(view)) {
      setActiveView(view);
    }
  }, [location.search]);

  useEffect(() => {
    let cancelled = false;

    async function loadValidatorWorkspace() {
      try {
        const residentSearchParams = new URLSearchParams({
          page: String(residentsPage),
          pageSize: String(rowsPerPage),
        });

        if (residentSearchTerm.trim()) {
          residentSearchParams.set('search', residentSearchTerm.trim());
        }

        const [
          statsData,
          dashboardResidentsData,
          dashboardRecordsData,
          residentsData,
          reportsResidentsData,
        ] = await Promise.all([
          apiRequest('/api/dashboard/stats'),
          apiRequest(`/api/residents?page=${dashboardResidentsPage}&pageSize=${rowsPerPage}`),
          apiRequest(`/api/census-records?page=${dashboardRecordsPage}&pageSize=${rowsPerPage}`),
          apiRequest(`/api/residents?${residentSearchParams.toString()}`),
          apiRequest(`/api/residents?page=${reportsResidentsPage}&pageSize=${rowsPerPage}`),
        ]);

        if (cancelled) {
          return;
        }

        setStats(statsData.stats);
        setDashboardResidents(dashboardResidentsData.residents || []);
        setDashboardResidentsTotal(dashboardResidentsData.totalCount || 0);
        setDashboardRecords(dashboardRecordsData.records || []);
        setDashboardRecordsTotal(dashboardRecordsData.totalCount || 0);
        setResidents(residentsData.residents || []);
        setResidentsTotal(residentsData.totalCount || 0);
        setReportResidents(reportsResidentsData.residents || []);
        setStatus(null);
      } catch (error) {
        if (!cancelled) {
          setStatus({ severity: 'error', message: error.message });
        }
      }
    }

    loadValidatorWorkspace();
    const intervalId = activeView === 'settings'
      ? null
      : window.setInterval(loadValidatorWorkspace, 5000);

    return () => {
      cancelled = true;
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [
    activeView,
    dashboardRecordsPage,
    dashboardResidentsPage,
    reportsResidentsPage,
    residentSearchTerm,
    residentsPage,
  ]);

  const reportSummary = useMemo(() => ({
    totalResidents: residentsTotal,
    totalSubmissions: dashboardRecordsTotal,
  }), [dashboardRecordsTotal, residentsTotal]);

  useEffect(() => {
    setDashboardResidentsPage((current) => Math.min(current, Math.max(0, Math.ceil(dashboardResidentsTotal / rowsPerPage) - 1)));
    setDashboardRecordsPage((current) => Math.min(current, Math.max(0, Math.ceil(dashboardRecordsTotal / rowsPerPage) - 1)));
    setResidentsPage((current) => Math.min(current, Math.max(0, Math.ceil(residentsTotal / rowsPerPage) - 1)));
    setReportsResidentsPage((current) => Math.min(current, Math.max(0, Math.ceil(residentsTotal / rowsPerPage) - 1)));
  }, [dashboardRecordsTotal, dashboardResidentsTotal, residentsTotal]);

  useEffect(() => {
    setProfileForm({
      name: sessionUser?.name || '',
      email: sessionUser?.email || '',
      phoneNumber: sessionUser?.phoneNumber || '',
    });
  }, [sessionUser]);

  const handleProfileSave = async () => {
    try {
      const data = await apiRequest('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileForm),
      });
      saveCurrentUser(data.user, data.token);
      setSessionUser(data.user);
      setSettingsStatus({ severity: 'success', message: 'Your account details were updated.' });
    } catch (error) {
      setSettingsStatus({ severity: 'error', message: error.message });
    }
  };

  const handlePasswordSave = async () => {
    try {
      const data = await apiRequest('/api/auth/password', {
        method: 'PUT',
        body: JSON.stringify(passwordForm),
      });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setSettingsStatus({ severity: 'success', message: data.message || 'Password updated successfully.' });
    } catch (error) {
      setSettingsStatus({ severity: 'error', message: error.message });
    }
  };

  const handleResidentDelete = async () => {
    if (!residentToDelete?.id) {
      return;
    }

    setResidentActionStatus(null);
    setDeletingResidentId(residentToDelete.id);

    try {
      await apiRequest(`/api/residents/${residentToDelete.id}`, { method: 'DELETE' });
      setDashboardResidents((current) => current.filter((resident) => resident.id !== residentToDelete.id));
      setResidents((current) => current.filter((resident) => resident.id !== residentToDelete.id));
      setReportResidents((current) => current.filter((resident) => resident.id !== residentToDelete.id));
      setDashboardResidentsTotal((current) => Math.max(0, current - 1));
      setResidentsTotal((current) => Math.max(0, current - 1));
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
            <Button
              variant={activeView === 'dashboard' ? 'contained' : 'text'}
              onClick={() => setActiveView('dashboard')}
            >
              Dashboard
            </Button>
            <Button
              variant={activeView === 'residents' ? 'contained' : 'text'}
              onClick={() => setActiveView('residents')}
            >
              Residents
            </Button>
            <Button
              variant={activeView === 'reports' ? 'contained' : 'text'}
              onClick={() => setActiveView('reports')}
            >
              Reports
            </Button>
            <Button
              variant={activeView === 'settings' ? 'contained' : 'text'}
              onClick={() => setActiveView('settings')}
            >
              Settings
            </Button>
            {sessionUser?.role === 'Admin' && (
              <Button component={RouterLink} to="/admin" variant="text">
                Admin Page
              </Button>
            )}
            <Button component={RouterLink} to="/personnel-validator/residents" variant="text">
              Full Residents View
            </Button>
            <Button variant="text" onClick={handleLogout}>
              Log Out
            </Button>
          </Stack>
        </aside>

        <section className="admin-content">
          <Box className="admin-header">
            <Box>
              <Typography variant="h3" className="admin-title">
                Personnel / Validator Dashboard
              </Typography>
              <Typography className="admin-copy">
                Monitor live census activity, update residents in real time, and keep reports aligned with the admin workspace.
              </Typography>
            </Box>
            <Box className="admin-user">
              <Avatar className="admin-avatar">{sessionUser?.name?.charAt(0) || 'V'}</Avatar>
              <Box>
                <Typography className="admin-user-name">{sessionUser?.name || 'Validator User'}</Typography>
                <Typography className="admin-user-role">
                  {sessionUser?.role || 'Personnel and Validation Officer'}
                </Typography>
              </Box>
            </Box>
          </Box>

          {status && (
            <Alert severity={status.severity} className="admin-alert">
              {status.message}
            </Alert>
          )}

          <Box className="admin-stats">
            {visibleStats.map((stat) => (
              <Paper key={stat.label} className="admin-stat-card" elevation={0}>
                <Typography className="admin-stat-label">{stat.label}</Typography>
                <Typography className="admin-stat-value">{stat.value}</Typography>
                <Typography className="admin-stat-note">{stat.note}</Typography>
              </Paper>
            ))}
          </Box>

          <Box className="admin-panels">
            {activeView === 'dashboard' && (
              <Stack spacing={2.5}>
                <Paper className="admin-panel admin-panel-wide" elevation={0}>
                  <Box className="admin-panel-header">
                    <Typography variant="h6" className="admin-panel-title">
                      Live Residents Feed
                    </Typography>
                    <Chip label="Live sync every 5s" size="small" />
                  </Box>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Resident</TableCell>
                          <TableCell>Address</TableCell>
                          <TableCell>Submitted By</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {dashboardResidents.map((resident) => (
                          <TableRow key={resident.id}>
                            <TableCell>{resident.name}</TableCell>
                            <TableCell>{resident.address}</TableCell>
                            <TableCell>{resident.submittedBy}</TableCell>
                          </TableRow>
                        ))}
                        {dashboardResidents.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="admin-empty-state">
                              No residents found yet.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    component="div"
                    count={dashboardResidentsTotal}
                    page={dashboardResidentsPage}
                    onPageChange={(event, nextPage) => setDashboardResidentsPage(nextPage)}
                    rowsPerPage={rowsPerPage}
                    rowsPerPageOptions={[rowsPerPage]}
                  />
                </Paper>

                <Paper className="admin-panel admin-panel-wide" elevation={0}>
                  <Box className="admin-panel-header">
                    <Typography variant="h6" className="admin-panel-title">
                      Latest Census Records
                    </Typography>
                    <Button component={RouterLink} to="/personnel-validator/residents" variant="contained">
                      Open Residents Workspace
                    </Button>
                  </Box>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Purok</TableCell>
                          <TableCell>Birthday</TableCell>
                          <TableCell>Created At</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {dashboardRecords.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>{[record.firstName, record.lastName].filter(Boolean).join(' ')}</TableCell>
                            <TableCell>{record.area}</TableCell>
                            <TableCell>{record.birthday}</TableCell>
                            <TableCell>{new Date(record.createdAt).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                        {dashboardRecords.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="admin-empty-state">
                              No census submissions yet.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    component="div"
                    count={dashboardRecordsTotal}
                    page={dashboardRecordsPage}
                    onPageChange={(event, nextPage) => setDashboardRecordsPage(nextPage)}
                    rowsPerPage={rowsPerPage}
                    rowsPerPageOptions={[rowsPerPage]}
                  />
                </Paper>
              </Stack>
            )}

            {activeView === 'residents' && (
              <Stack spacing={2.5}>
                <Paper className="admin-panel admin-panel-wide" elevation={0}>
                  <Box className="admin-panel-header">
                    <Typography variant="h6" className="admin-panel-title">
                      Census Taker Shortcut
                    </Typography>
                    <Box className="admin-panel-tools">
                      <Chip label="Shared with admin instantly" size="small" />
                      <CensusDashboardShortcut canAccess={['Admin', 'Personnel / Validator', 'Census Taker'].includes(sessionUser?.role)} />
                    </Box>
                  </Box>
                  <Typography className="admin-copy">
                    Add new residents from the Census Taker page using the shortcut icon here.
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
                      value={residentSearchTerm}
                      onChange={(event) => {
                        setResidentSearchTerm(event.target.value);
                        setResidentsPage(0);
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
                        {residents.map((resident) => (
                          <TableRow key={resident.id}>
                            <TableCell>{resident.name}</TableCell>
                            <TableCell>{formatBirthday(resident.birthday)}</TableCell>
                            <TableCell>{resident.address}</TableCell>
                            <TableCell>{resident.submittedBy}</TableCell>
                            <TableCell>
                              <Box className="admin-table-actions">
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => setResidentPreview(resident)}
                                >
                                  Review
                                </Button>
                                <Button
                                  size="small"
                                  variant="text"
                                  color="error"
                                  disabled={deletingResidentId === resident.id}
                                  onClick={() => setResidentToDelete(resident)}
                                >
                                  {deletingResidentId === resident.id ? 'Removing...' : 'Remove'}
                                </Button>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    component="div"
                    count={residentsTotal}
                    page={residentsPage}
                    onPageChange={(event, nextPage) => setResidentsPage(nextPage)}
                    rowsPerPage={rowsPerPage}
                    rowsPerPageOptions={[rowsPerPage]}
                  />
                </Paper>
              </Stack>
            )}

            {activeView === 'reports' && (
              <Stack spacing={2.5}>
                <Paper className="admin-panel admin-panel-wide" elevation={0}>
                  <Box className="admin-panel-header">
                    <Typography variant="h6" className="admin-panel-title">
                      Reports Summary
                    </Typography>
                    <Chip label="Realtime metrics" size="small" />
                  </Box>
                  <Box className="admin-mini-stats">
                    <Box className="admin-mini-stat">
                      <Typography className="admin-stat-label">Residents</Typography>
                      <Typography className="admin-stat-value">{reportSummary.totalResidents}</Typography>
                    </Box>
                    <Box className="admin-mini-stat">
                      <Typography className="admin-stat-label">Census Records</Typography>
                      <Typography className="admin-stat-value">{reportSummary.totalSubmissions}</Typography>
                    </Box>
                  </Box>
                </Paper>

                <Paper className="admin-panel admin-panel-wide" elevation={0}>
                  <Typography variant="h6" className="admin-panel-title">
                    Latest Activity
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Resident</TableCell>
                          <TableCell>Address</TableCell>
                          <TableCell>Submitted By</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {reportResidents.map((resident) => (
                          <TableRow key={resident.id}>
                            <TableCell>{resident.name}</TableCell>
                            <TableCell>{resident.address}</TableCell>
                            <TableCell>{resident.submittedBy}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    component="div"
                    count={residentsTotal}
                    page={reportsResidentsPage}
                    onPageChange={(event, nextPage) => setReportsResidentsPage(nextPage)}
                    rowsPerPage={rowsPerPage}
                    rowsPerPageOptions={[rowsPerPage]}
                  />
                </Paper>
              </Stack>
            )}

            {activeView === 'settings' && (
              <Stack spacing={2.5}>
                <Paper className="admin-panel admin-panel-wide" elevation={0}>
                  <Box className="admin-panel-header">
                    <Typography variant="h6" className="admin-panel-title">
                      My Account
                    </Typography>
                    <Button variant="contained" onClick={handleProfileSave}>Save Details</Button>
                  </Box>

                  {settingsStatus && (
                    <Alert severity={settingsStatus.severity} className="admin-alert">
                      {settingsStatus.message}
                    </Alert>
                  )}

                  <Stack spacing={2.5} className="admin-settings-list">
                    <TextField
                      fullWidth
                      label="Full name"
                      value={profileForm.name}
                      onChange={(event) => {
                        setSettingsStatus(null);
                        setProfileForm((current) => ({ ...current, name: event.target.value }));
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={profileForm.email}
                      onChange={(event) => {
                        setSettingsStatus(null);
                        setProfileForm((current) => ({ ...current, email: event.target.value }));
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Phone number"
                      value={profileForm.phoneNumber}
                      onChange={(event) => {
                        setSettingsStatus(null);
                        setProfileForm((current) => ({ ...current, phoneNumber: event.target.value }));
                      }}
                    />
                  </Stack>
                </Paper>

                <Paper className="admin-panel admin-panel-wide" elevation={0}>
                  <Box className="admin-panel-header">
                    <Typography variant="h6" className="admin-panel-title">
                      Change My Password
                    </Typography>
                    <Button variant="contained" onClick={handlePasswordSave}>Update Password</Button>
                  </Box>

                  <Stack spacing={2.5} className="admin-settings-list">
                    <TextField
                      fullWidth
                      label="Current password"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(event) => {
                        setSettingsStatus(null);
                        setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }));
                      }}
                    />
                    <TextField
                      fullWidth
                      label="New password"
                      type="password"
                      helperText="Use at least 8 characters with 1 uppercase letter, 1 number, and 1 symbol."
                      value={passwordForm.newPassword}
                      onChange={(event) => {
                        setSettingsStatus(null);
                        setPasswordForm((current) => ({ ...current, newPassword: event.target.value }));
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Confirm new password"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(event) => {
                        setSettingsStatus(null);
                        setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }));
                      }}
                    />
                  </Stack>
                </Paper>
              </Stack>
            )}
          </Box>
        </section>
      </Box>

      <Dialog open={Boolean(residentPreview)} onClose={() => setResidentPreview(null)} fullWidth maxWidth="sm">
        <DialogTitle>Resident Review</DialogTitle>
        <DialogContent>
          <Stack spacing={2} className="admin-detail-stack">
            <Box>
              <Typography className="admin-detail-label">Resident</Typography>
              <Typography className="admin-detail-value">{residentPreview?.name}</Typography>
            </Box>
            <Box>
              <Typography className="admin-detail-label">Birthday</Typography>
              <Typography className="admin-detail-value">{formatBirthday(residentPreview?.birthday)}</Typography>
            </Box>
            <Box>
              <Typography className="admin-detail-label">Address</Typography>
              <Typography className="admin-detail-value">{residentPreview?.address}</Typography>
            </Box>
            <Box>
              <Typography className="admin-detail-label">Submitted By</Typography>
              <Typography className="admin-detail-value">{residentPreview?.submittedBy}</Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResidentPreview(null)}>Close</Button>
        </DialogActions>
      </Dialog>

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

export default PersonnelValidatorPage;
