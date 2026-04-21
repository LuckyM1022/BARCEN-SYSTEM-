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
  MenuItem,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api';
import { clearCurrentUser, getCurrentUser } from '../auth';
import CensusDashboardShortcut from '../components/CensusDashboardShortcut';
import barcenLogo from '../resources/Barcen_logo.png';
import './AdminPage.css';

const DEFAULT_ROLES = [
  {
    name: 'Admin',
    access: 'Full user management, role assignment, and platform oversight.',
    members: 1,
  },
  {
    name: 'Personnel / Validator',
    access: 'Dashboard review, resident verification, and certificate processing.',
    members: 1,
  },
  {
    name: 'Census Taker',
    access: 'Field intake, resident record submission, and household data entry.',
    members: 2,
  },
];

const initialUserDialogValues = {
  name: '',
  email: '',
  phoneNumber: '',
  role: 'Census Taker',
  password: '',
};

function UserAdminPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = getCurrentUser();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState([]);
  const [residents, setResidents] = useState([]);
  const [censusRecords, setCensusRecords] = useState([]);
  const [status, setStatus] = useState({ severity: 'info', message: 'Loading admin workspace...' });
  const [activeView, setActiveView] = useState('users');
  const [settings, setSettings] = useState({
    emailNotifications: true,
    certificateApproval: true,
    maintenanceMode: false,
  });
  const [roles, setRoles] = useState(DEFAULT_ROLES);
  const [settingsStatus, setSettingsStatus] = useState(null);
  const [residentActionStatus, setResidentActionStatus] = useState(null);
  const [roleStatus, setRoleStatus] = useState(null);
  const [userStatus, setUserStatus] = useState(null);
  const [residentPreview, setResidentPreview] = useState(null);
  const [roleMembersPreview, setRoleMembersPreview] = useState(null);
  const [roleDialogState, setRoleDialogState] = useState({
    open: false,
    mode: 'create',
    originalName: '',
    values: {
      name: '',
      access: '',
      members: '1',
    },
  });
  const [userDialogState, setUserDialogState] = useState({
    open: false,
    mode: 'create',
    userId: '',
    values: initialUserDialogValues,
  });
  const [deletingUserId, setDeletingUserId] = useState('');
  const [deletingResidentId, setDeletingResidentId] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const view = searchParams.get('view');

    if (view && ['users', 'residents', 'roles', 'reports', 'settings'].includes(view)) {
      setActiveView(view);
    }
  }, [location.search]);

  useEffect(() => {
    let cancelled = false;

    async function loadAdminWorkspace() {
      try {
        const [usersData, rolesData, settingsData, statsData, residentsData, recordsData] = await Promise.all([
          apiRequest('/api/users'),
          apiRequest('/api/admin/roles'),
          apiRequest('/api/admin/settings'),
          apiRequest('/api/dashboard/stats'),
          apiRequest('/api/residents'),
          apiRequest('/api/census-records'),
        ]);

        if (cancelled) {
          return;
        }

        setUsers(usersData.users);
        setRoles(rolesData.roles || DEFAULT_ROLES);
        setSettings((current) => ({
          ...current,
          ...(settingsData.settings || {}),
        }));
        setStats(statsData.stats);
        setResidents(residentsData.residents);
        setCensusRecords(recordsData.records);
        setStatus(null);
      } catch (error) {
        if (!cancelled) {
          setStatus({ severity: 'error', message: error.message });
        }
      }
    }

    loadAdminWorkspace();
    const intervalId = window.setInterval(loadAdminWorkspace, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const reportSummary = useMemo(() => {
    const latestResidents = residents.slice(0, 5);
    const latestRecords = censusRecords.slice(0, 5);

    return {
      totalUsers: users.length,
      totalResidents: residents.length,
      totalSubmissions: censusRecords.length,
      latestResidents,
      latestRecords,
    };
  }, [censusRecords, residents, users.length]);

  const handleSettingToggle = (event) => {
    const { name, checked } = event.target;
    setSettingsStatus(null);
    setSettings((current) => ({
      ...current,
      [name]: checked,
    }));
  };

  const openCreateRoleDialog = () => {
    setRoleStatus(null);
    setRoleDialogState({
      open: true,
      mode: 'create',
      originalName: '',
      values: {
        name: '',
        access: '',
        members: '1',
      },
    });
  };

  const openEditRoleDialog = (role) => {
    setRoleStatus(null);
    setRoleDialogState({
      open: true,
      mode: 'edit',
      originalName: role.name,
      values: {
        name: role.name,
        access: role.access,
        members: String(role.members),
      },
    });
  };

  const closeRoleDialog = () => {
    setRoleDialogState((current) => ({
      ...current,
      open: false,
    }));
  };

  const handleRoleInputChange = (event) => {
    const { name, value } = event.target;
    setRoleDialogState((current) => ({
      ...current,
      values: {
        ...current.values,
        [name]: value,
      },
    }));
  };

  const handleRoleSave = async () => {
    const nextRole = {
      name: roleDialogState.values.name.trim(),
      access: roleDialogState.values.access.trim(),
      members: Math.max(1, Number(roleDialogState.values.members) || 1),
    };

    if (!nextRole.name || !nextRole.access) {
      setRoleStatus({ severity: 'error', message: 'Role name and access description are required.' });
      return;
    }

    const roleExists = roles.some(
      (role) =>
        role.name.toLowerCase() === nextRole.name.toLowerCase() &&
        role.name !== roleDialogState.originalName
    );

    if (roleExists) {
      setRoleStatus({ severity: 'error', message: 'A role with that name already exists.' });
      return;
    }

    try {
      if (roleDialogState.mode === 'create') {
        const data = await apiRequest('/api/admin/roles', {
          method: 'POST',
          body: JSON.stringify(nextRole),
        });
        setRoles((current) => [...current, data.role].sort((left, right) => left.name.localeCompare(right.name)));
        setRoleStatus({ severity: 'success', message: 'Role created.' });
      } else {
        const roleToUpdate = roles.find((role) => role.name === roleDialogState.originalName);
        const data = await apiRequest(`/api/admin/roles/${roleToUpdate.id}`, {
          method: 'PUT',
          body: JSON.stringify(nextRole),
        });
        setRoles((current) => current.map((role) => (role.id === data.role.id ? data.role : role)));
        setRoleStatus({ severity: 'success', message: 'Role access updated.' });
      }

      closeRoleDialog();
    } catch (error) {
      setRoleStatus({ severity: 'error', message: error.message });
    }
  };

  const handleSettingsSave = async () => {
    try {
      const data = await apiRequest('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      setSettings((current) => ({ ...current, ...(data.settings || {}) }));
      setSettingsStatus({ severity: 'success', message: 'Settings saved successfully.' });
    } catch (error) {
      setSettingsStatus({ severity: 'error', message: error.message });
    }
  };

  const openCreateUserDialog = () => {
    setUserStatus(null);
    setUserDialogState({
      open: true,
      mode: 'create',
      userId: '',
      values: initialUserDialogValues,
    });
  };

  const openEditUserDialog = (user) => {
    setUserStatus(null);
    setUserDialogState({
      open: true,
      mode: 'edit',
      userId: user.id,
      values: {
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber || '',
        role: user.role,
        password: '',
      },
    });
  };

  const closeUserDialog = () => {
    setUserDialogState((current) => ({
      ...current,
      open: false,
    }));
  };

  const handleUserInputChange = (event) => {
    const { name, value } = event.target;
    setUserDialogState((current) => ({
      ...current,
      values: {
        ...current.values,
        [name]: value,
      },
    }));
  };

  const handleUserSave = async () => {
    const payload = {
      name: userDialogState.values.name.trim(),
      email: userDialogState.values.email.trim(),
      phoneNumber: userDialogState.values.phoneNumber.trim(),
      role: userDialogState.values.role,
      password: userDialogState.values.password,
    };

    if (!payload.name || !payload.email || !payload.role || (userDialogState.mode === 'create' && !payload.password)) {
      setUserStatus({ severity: 'error', message: 'Name, email, role, and password are required for new users.' });
      return;
    }

    try {
      if (userDialogState.mode === 'create') {
        const data = await apiRequest('/api/users', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setUsers((current) => [...current, data.user].sort((left, right) => left.name.localeCompare(right.name)));
        setUserStatus({ severity: 'success', message: 'User created.' });
      } else {
        const data = await apiRequest(`/api/users/${userDialogState.userId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setUsers((current) => current.map((user) => (user.id === data.user.id ? data.user : user)));
        setUserStatus({ severity: 'success', message: 'User updated.' });
      }

      closeUserDialog();
    } catch (error) {
      setUserStatus({ severity: 'error', message: error.message });
    }
  };

  const handleUserDelete = async (userId) => {
    setUserStatus(null);
    setDeletingUserId(userId);

    try {
      await apiRequest(`/api/users/${userId}`, { method: 'DELETE' });
      setUsers((current) => current.filter((user) => user.id !== userId));
      setUserStatus({ severity: 'success', message: 'User removed.' });
    } catch (error) {
      setUserStatus({ severity: 'error', message: error.message });
    } finally {
      setDeletingUserId('');
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
            <Typography className="admin-brand">BARCEN Admin</Typography>
          </Box>
          <Stack spacing={1.5} className="admin-nav">
            <Button
              variant={activeView === 'users' ? 'contained' : 'text'}
              onClick={() => setActiveView('users')}
            >
              Users
            </Button>
            <Button
              variant={activeView === 'residents' ? 'contained' : 'text'}
              onClick={() => setActiveView('residents')}
            >
              Residents
            </Button>
            <Button
              variant={activeView === 'roles' ? 'contained' : 'text'}
              onClick={() => setActiveView('roles')}
            >
              Roles
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
            <Button component={RouterLink} to="/personnel-validator" variant="text">
              Validator Dashboard
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
                User Administration
              </Typography>
              <Typography className="admin-copy">
                Manage users, watch live census activity, and coordinate resident records across the admin and validator workspaces.
              </Typography>
            </Box>
            <Box className="admin-user">
              <Avatar className="admin-avatar">{currentUser?.name?.charAt(0) || 'A'}</Avatar>
              <Box>
                <Typography className="admin-user-name">{currentUser?.name || 'Admin User'}</Typography>
                <Typography className="admin-user-role">
                  {currentUser?.role || 'System Administrator'}
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
            {activeView === 'users' && (
              <Paper className="admin-panel admin-panel-wide" elevation={0}>
                <Box className="admin-panel-header">
                  <Typography variant="h6" className="admin-panel-title">
                    Users
                  </Typography>
                  <Button variant="contained" onClick={openCreateUserDialog}>Add User</Button>
                </Box>

                {userStatus && (
                  <Alert severity={userStatus.severity} className="admin-alert">
                    {userStatus.message}
                  </Alert>
                )}

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.email}>
                          <TableCell>{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Chip label={user.role} size="small" />
                          </TableCell>
                          <TableCell>
                            <Box className="admin-table-actions">
                              <Button size="small" variant="outlined" onClick={() => openEditUserDialog(user)}>
                                Edit
                              </Button>
                              <Button
                                size="small"
                                variant="text"
                                color="error"
                                disabled={deletingUserId === user.id}
                                onClick={() => handleUserDelete(user.id)}
                              >
                                {deletingUserId === user.id ? 'Removing...' : 'Remove'}
                              </Button>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}

            {activeView === 'residents' && (
              <Stack spacing={2.5}>
                <Paper className="admin-panel admin-panel-wide" elevation={0}>
                  <Box className="admin-panel-header">
                    <Typography variant="h6" className="admin-panel-title">
                      Census Taker Shortcut
                    </Typography>
                    <Box className="admin-panel-tools">
                      <Chip label="Live sync every 5s" size="small" />
                      <CensusDashboardShortcut canAccess={['Admin', 'Personnel / Validator', 'Census Taker'].includes(currentUser?.role)} />
                    </Box>
                  </Box>
                  <Typography className="admin-copy">
                    Use the shortcut icon to open the Census Taker page when you need to create a new resident record.
                  </Typography>
                </Paper>

                <Paper className="admin-panel admin-panel-wide" elevation={0}>
                  <Box className="admin-panel-header">
                    <Typography variant="h6" className="admin-panel-title">
                      Resident Records
                    </Typography>
                    <Typography className="admin-copy">Shared live data with validator tools</Typography>
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
                                  View
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

            {activeView === 'roles' && (
              <Paper className="admin-panel admin-panel-wide" elevation={0}>
                <Box className="admin-panel-header">
                  <Typography variant="h6" className="admin-panel-title">
                    Role Access
                  </Typography>
                  <Button variant="contained" onClick={openCreateRoleDialog}>
                    Create Role
                  </Button>
                </Box>

                {roleStatus && (
                  <Alert severity={roleStatus.severity} className="admin-alert">
                    {roleStatus.message}
                  </Alert>
                )}

                <Box className="admin-role-grid">
                  {roles.map((role) => (
                    <Box key={role.name} className="admin-role-card">
                      <Box className="admin-role-topline">
                        <Typography className="admin-role-name">{role.name}</Typography>
                        <Chip label={`${role.members} member${role.members > 1 ? 's' : ''}`} size="small" />
                      </Box>
                      <Typography className="admin-role-copy">{role.access}</Typography>
                      <Box className="admin-role-actions">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => openEditRoleDialog(role)}
                        >
                          Edit Access
                        </Button>
                        <Button size="small" variant="text" onClick={() => setRoleMembersPreview(role)}>
                          View Members
                        </Button>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Paper>
            )}

            {activeView === 'reports' && (
              <Stack spacing={2.5}>
                <Paper className="admin-panel admin-panel-wide" elevation={0}>
                  <Box className="admin-panel-header">
                    <Typography variant="h6" className="admin-panel-title">
                      Reports Snapshot
                    </Typography>
                    <Chip label="Realtime overview" size="small" />
                  </Box>
                  <Box className="admin-mini-stats">
                    <Box className="admin-mini-stat">
                      <Typography className="admin-stat-label">Users</Typography>
                      <Typography className="admin-stat-value">{reportSummary.totalUsers}</Typography>
                    </Box>
                    <Box className="admin-mini-stat">
                      <Typography className="admin-stat-label">Residents</Typography>
                      <Typography className="admin-stat-value">{reportSummary.totalResidents}</Typography>
                    </Box>
                    <Box className="admin-mini-stat">
                      <Typography className="admin-stat-label">Submissions</Typography>
                      <Typography className="admin-stat-value">{reportSummary.totalSubmissions}</Typography>
                    </Box>
                  </Box>
                </Paper>

                <Paper className="admin-panel admin-panel-wide" elevation={0}>
                  <Typography variant="h6" className="admin-panel-title">
                    Latest Census Records
                  </Typography>
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

            {activeView === 'settings' && (
              <Paper className="admin-panel admin-panel-wide" elevation={0}>
                <Box className="admin-panel-header">
                  <Typography variant="h6" className="admin-panel-title">
                    Platform Settings
                  </Typography>
                  <Button variant="contained" onClick={handleSettingsSave}>
                    Save Changes
                  </Button>
                </Box>

                {settingsStatus && (
                  <Alert severity={settingsStatus.severity} className="admin-alert">
                    {settingsStatus.message}
                  </Alert>
                )}

                <Stack spacing={2.5} className="admin-settings-list">
                  <Box className="admin-setting-row">
                    <Box>
                      <Typography className="admin-setting-title">Email Notifications</Typography>
                      <Typography className="admin-setting-copy">
                        Send account and submission updates to admin users.
                      </Typography>
                    </Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.emailNotifications}
                          onChange={handleSettingToggle}
                          name="emailNotifications"
                        />
                      }
                      label={settings.emailNotifications ? 'Enabled' : 'Disabled'}
                      labelPlacement="start"
                    />
                  </Box>

                  <Box className="admin-setting-row">
                    <Box>
                      <Typography className="admin-setting-title">Certificate Approval</Typography>
                      <Typography className="admin-setting-copy">
                        Require validator review before document release.
                      </Typography>
                    </Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.certificateApproval}
                          onChange={handleSettingToggle}
                          name="certificateApproval"
                        />
                      }
                      label={settings.certificateApproval ? 'Enabled' : 'Disabled'}
                      labelPlacement="start"
                    />
                  </Box>

                  <Box className="admin-setting-row">
                    <Box>
                      <Typography className="admin-setting-title">Maintenance Mode</Typography>
                      <Typography className="admin-setting-copy">
                        Temporarily limit new activity while system updates are in progress.
                      </Typography>
                    </Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.maintenanceMode}
                          onChange={handleSettingToggle}
                          name="maintenanceMode"
                        />
                      }
                      label={settings.maintenanceMode ? 'Enabled' : 'Disabled'}
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
        <DialogTitle>Resident Details</DialogTitle>
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

      <Dialog open={Boolean(roleMembersPreview)} onClose={() => setRoleMembersPreview(null)} fullWidth maxWidth="sm">
        <DialogTitle>{roleMembersPreview?.name} Members</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            {users.filter((user) => user.role === roleMembersPreview?.name).map((user) => (
              <Box key={user.id} className="admin-member-row">
                <Typography className="admin-detail-value">{user.name}</Typography>
                <Typography className="admin-member-meta">{user.email}</Typography>
              </Box>
            ))}
            {users.filter((user) => user.role === roleMembersPreview?.name).length === 0 && (
              <Typography className="admin-copy">No members assigned to this role yet.</Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleMembersPreview(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={roleDialogState.open} onClose={closeRoleDialog} fullWidth maxWidth="sm">
        <DialogTitle>{roleDialogState.mode === 'create' ? 'Create Role' : 'Edit Role Access'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {roleStatus?.severity === 'error' && (
              <Alert severity={roleStatus.severity}>{roleStatus.message}</Alert>
            )}
            <TextField
              fullWidth
              label="Role name"
              name="name"
              value={roleDialogState.values.name}
              onChange={handleRoleInputChange}
            />
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Access description"
              name="access"
              value={roleDialogState.values.access}
              onChange={handleRoleInputChange}
            />
            <TextField
              fullWidth
              label="Member count"
              name="members"
              type="number"
              value={roleDialogState.values.members}
              onChange={handleRoleInputChange}
              inputProps={{ min: 1 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRoleDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleRoleSave}>
            {roleDialogState.mode === 'create' ? 'Create Role' : 'Save Role'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={userDialogState.open} onClose={closeUserDialog} fullWidth maxWidth="sm">
        <DialogTitle>{userDialogState.mode === 'create' ? 'Add User' : 'Edit User'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {userStatus?.severity === 'error' && (
              <Alert severity={userStatus.severity}>{userStatus.message}</Alert>
            )}
            <TextField
              fullWidth
              label="Full name"
              name="name"
              value={userDialogState.values.name}
              onChange={handleUserInputChange}
            />
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={userDialogState.values.email}
              onChange={handleUserInputChange}
            />
            <TextField
              fullWidth
              label="Phone number"
              name="phoneNumber"
              value={userDialogState.values.phoneNumber}
              onChange={handleUserInputChange}
            />
            <TextField
              select
              fullWidth
              label="Role"
              name="role"
              value={userDialogState.values.role}
              onChange={handleUserInputChange}
            >
              {roles.map((role) => (
                <MenuItem key={role.id || role.name} value={role.name}>
                  {role.name}
                </MenuItem>
              ))}
            </TextField>
            {userDialogState.mode === 'create' && (
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={userDialogState.values.password}
                onChange={handleUserInputChange}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeUserDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleUserSave}>
            {userDialogState.mode === 'create' ? 'Create User' : 'Save User'}
          </Button>
        </DialogActions>
      </Dialog>
    </main>
  );
}

export default UserAdminPage;
