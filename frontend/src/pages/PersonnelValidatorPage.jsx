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
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api';
import { clearCurrentUser, getCurrentUser } from '../auth';
import CensusDashboardShortcut from '../components/CensusDashboardShortcut';
import barcenLogo from '../resources/Barcen_logo.png';
import './AdminPage.css';

function PersonnelValidatorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = getCurrentUser();
  const [stats, setStats] = useState([]);
  const [residents, setResidents] = useState([]);
  const [censusRecords, setCensusRecords] = useState([]);
  const [status, setStatus] = useState({ severity: 'info', message: 'Loading dashboard...' });
  const [activeView, setActiveView] = useState('dashboard');
  const [settings, setSettings] = useState({
    autoRefresh: true,
    reviewLock: true,
    quickCertificateMode: false,
  });
  const [settingsStatus, setSettingsStatus] = useState(null);
  const [residentActionStatus, setResidentActionStatus] = useState(null);
  const [residentPreview, setResidentPreview] = useState(null);
  const [deletingResidentId, setDeletingResidentId] = useState('');

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
        const [statsData, residentsData, recordsData, settingsData] = await Promise.all([
          apiRequest('/api/dashboard/stats'),
          apiRequest('/api/residents'),
          apiRequest('/api/census-records'),
          apiRequest('/api/validator/settings'),
        ]);

        if (cancelled) {
          return;
        }

        setStats(statsData.stats);
        setResidents(residentsData.residents);
        setCensusRecords(recordsData.records);
        setSettings((current) => ({
          ...current,
          ...(settingsData.settings || {}),
        }));
        setStatus(null);
      } catch (error) {
        if (!cancelled) {
          setStatus({ severity: 'error', message: error.message });
        }
      }
    }

    loadValidatorWorkspace();
    const intervalId = window.setInterval(loadValidatorWorkspace, settings.autoRefresh ? 5000 : 15000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [settings.autoRefresh]);

  const reportSummary = useMemo(() => ({
    totalResidents: residents.length,
    totalSubmissions: censusRecords.length,
    latestResidents: residents.slice(0, 5),
    latestRecords: censusRecords.slice(0, 5),
  }), [censusRecords, residents]);

  const handleSettingToggle = (event) => {
    const { name, checked } = event.target;
    setSettingsStatus(null);
    setSettings((current) => ({
      ...current,
      [name]: checked,
    }));
  };

  const handleSettingsSave = async () => {
    try {
      const data = await apiRequest('/api/validator/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      setSettings((current) => ({
        ...current,
        ...(data.settings || {}),
      }));
      setSettingsStatus({ severity: 'success', message: 'Validator settings saved.' });
    } catch (error) {
      setSettingsStatus({ severity: 'error', message: error.message });
    }
  };

  const handleResidentDelete = async (residentId) => {
    if (!window.confirm('Are you sure you want to delete this resident?')) {
      return;
    }

    setResidentActionStatus(null);
    setDeletingResidentId(residentId);

    try {
      await apiRequest(`/api/residents/${residentId}`, { method: 'DELETE' });
      setResidents((current) => current.filter((resident) => resident.id !== residentId));
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
            {currentUser?.role === 'Admin' && (
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
              <Avatar className="admin-avatar">{currentUser?.name?.charAt(0) || 'V'}</Avatar>
              <Box>
                <Typography className="admin-user-name">{currentUser?.name || 'Validator User'}</Typography>
                <Typography className="admin-user-role">
                  {currentUser?.role || 'Personnel and Validation Officer'}
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
            {stats.map((stat) => (
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
                    <Chip label={settings.autoRefresh ? 'Auto refresh on' : 'Auto refresh off'} size="small" />
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
                        {reportSummary.latestResidents.map((resident) => (
                          <TableRow key={resident.id}>
                            <TableCell>{resident.name}</TableCell>
                            <TableCell>{resident.address}</TableCell>
                            <TableCell>{resident.submittedBy}</TableCell>
                          </TableRow>
                        ))}
                        {reportSummary.latestResidents.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="admin-empty-state">
                              No residents found yet.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
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
                        {reportSummary.latestRecords.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>{[record.firstName, record.lastName].filter(Boolean).join(' ')}</TableCell>
                            <TableCell>{record.area}</TableCell>
                            <TableCell>{record.birthday}</TableCell>
                            <TableCell>{new Date(record.createdAt).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                        {reportSummary.latestRecords.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="admin-empty-state">
                              No census submissions yet.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
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
                      <CensusDashboardShortcut canAccess={['Admin', 'Personnel / Validator', 'Census Taker'].includes(currentUser?.role)} />
                    </Box>
                  </Box>
                  <Typography className="admin-copy">
                    Add new residents from the Census Taker page using the shortcut icon here.
                  </Typography>
                </Paper>

                <Paper className="admin-panel admin-panel-wide" elevation={0}>
                  <Typography variant="h6" className="admin-panel-title">
                    Resident Records
                  </Typography>

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
                        {residents.map((resident) => (
                          <TableRow key={resident.id}>
                            <TableCell>{resident.name}</TableCell>
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
                                  onClick={() => handleResidentDelete(resident.id)}
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
                        {reportSummary.latestResidents.map((resident) => (
                          <TableRow key={resident.id}>
                            <TableCell>{resident.name}</TableCell>
                            <TableCell>{resident.address}</TableCell>
                            <TableCell>{resident.submittedBy}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Stack>
            )}

            {activeView === 'settings' && (
              <Paper className="admin-panel admin-panel-wide" elevation={0}>
                <Box className="admin-panel-header">
                  <Typography variant="h6" className="admin-panel-title">
                    Validator Settings
                  </Typography>
                  <Button variant="contained" onClick={handleSettingsSave}>Save Changes</Button>
                </Box>

                {settingsStatus && (
                  <Alert severity={settingsStatus.severity} className="admin-alert">
                    {settingsStatus.message}
                  </Alert>
                )}

                <Stack spacing={2.5} className="admin-settings-list">
                  <Box className="admin-setting-row">
                    <Box>
                      <Typography className="admin-setting-title">Auto Refresh</Typography>
                      <Typography className="admin-setting-copy">
                        Keep dashboard cards and tables synced from the server automatically.
                      </Typography>
                    </Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.autoRefresh}
                          onChange={handleSettingToggle}
                          name="autoRefresh"
                        />
                      }
                      label={settings.autoRefresh ? 'Enabled' : 'Disabled'}
                      labelPlacement="start"
                    />
                  </Box>

                  <Box className="admin-setting-row">
                    <Box>
                      <Typography className="admin-setting-title">Review Lock</Typography>
                      <Typography className="admin-setting-copy">
                        Hold certificates until a validator finishes checking resident details.
                      </Typography>
                    </Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.reviewLock}
                          onChange={handleSettingToggle}
                          name="reviewLock"
                        />
                      }
                      label={settings.reviewLock ? 'Enabled' : 'Disabled'}
                      labelPlacement="start"
                    />
                  </Box>

                  <Box className="admin-setting-row">
                    <Box>
                      <Typography className="admin-setting-title">Quick Certificate Mode</Typography>
                      <Typography className="admin-setting-copy">
                        Show faster document actions for residents already validated.
                      </Typography>
                    </Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.quickCertificateMode}
                          onChange={handleSettingToggle}
                          name="quickCertificateMode"
                        />
                      }
                      label={settings.quickCertificateMode ? 'Enabled' : 'Disabled'}
                      labelPlacement="start"
                    />
                  </Box>
                </Stack>
              </Paper>
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
    </main>
  );
}

export default PersonnelValidatorPage;
