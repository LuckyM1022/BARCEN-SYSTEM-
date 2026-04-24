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
  MenuItem,
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

const createProfileForm = (user) => ({
  name: user?.name || '',
  email: user?.email || '',
  phoneNumber: user?.phoneNumber || '',
});

const initialPasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

function UserAdminPage() {
  const rowsPerPage = 5;
  const navigate = useNavigate();
  const location = useLocation();
  const [sessionUser, setSessionUser] = useState(() => getCurrentUser());
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState([]);
  const [residents, setResidents] = useState([]);
  const [residentsTotal, setResidentsTotal] = useState(0);
  const [residentSearchTerm, setResidentSearchTerm] = useState('');
  const [censusRecords, setCensusRecords] = useState([]);
  const [censusRecordsTotal, setCensusRecordsTotal] = useState(0);
  const [status, setStatus] = useState({ severity: 'info', message: 'Loading admin workspace...' });
  const [activeView, setActiveView] = useState('users');
  const [roles, setRoles] = useState(DEFAULT_ROLES);
  const [settingsStatus, setSettingsStatus] = useState(null);
  const [profileForm, setProfileForm] = useState(() => createProfileForm(getCurrentUser()));
  const [passwordForm, setPasswordForm] = useState(initialPasswordForm);
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
  const [deletingRoleId, setDeletingRoleId] = useState('');
  const [deletingUserId, setDeletingUserId] = useState('');
  const [deletingResidentId, setDeletingResidentId] = useState('');
  const [userToDelete, setUserToDelete] = useState(null);
  const [residentToDelete, setResidentToDelete] = useState(null);
  const [residentsPage, setResidentsPage] = useState(0);
  const [reportsRecordsPage, setReportsRecordsPage] = useState(0);
  const visibleStats = stats.filter((stat) => stat.label !== 'Pending Reviews');

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const view = searchParams.get('view');

    if (view && ['users', 'residents', 'reports', 'settings'].includes(view)) {
      setActiveView(view);
    }
  }, [location.search]);

  useEffect(() => {
    let cancelled = false;

    async function loadAdminWorkspace() {
      try {
        const residentSearchParams = new URLSearchParams({
          page: String(residentsPage),
          pageSize: String(rowsPerPage),
        });

        if (residentSearchTerm.trim()) {
          residentSearchParams.set('search', residentSearchTerm.trim());
        }

        const [usersData, rolesData, statsData, residentsData, recordsData] = await Promise.all([
          apiRequest('/api/users'),
          apiRequest('/api/admin/roles'),
          apiRequest('/api/dashboard/stats'),
          apiRequest(`/api/residents?${residentSearchParams.toString()}`),
          apiRequest(`/api/census-records?page=${reportsRecordsPage}&pageSize=${rowsPerPage}`),
        ]);

        if (cancelled) {
          return;
        }

        setUsers(usersData.users);
        setRoles(rolesData.roles || DEFAULT_ROLES);
        setStats(statsData.stats);
        setResidents(residentsData.residents || []);
        setResidentsTotal(residentsData.totalCount || 0);
        setCensusRecords(recordsData.records || []);
        setCensusRecordsTotal(recordsData.totalCount || 0);
        setStatus(null);
      } catch (error) {
        if (!cancelled) {
          setStatus({ severity: 'error', message: error.message });
        }
      }
    }

    loadAdminWorkspace();
    const intervalId = activeView === 'settings'
      ? null
      : window.setInterval(loadAdminWorkspace, 5000);

    return () => {
      cancelled = true;
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [activeView, reportsRecordsPage, residentSearchTerm, residentsPage]);

  const reportSummary = useMemo(() => {
    return {
      totalUsers: users.length,
      totalResidents: residentsTotal,
      totalSubmissions: censusRecordsTotal,
    };
  }, [censusRecordsTotal, residentsTotal, users.length]);

  useEffect(() => {
    setResidentsPage((current) => Math.min(current, Math.max(0, Math.ceil(residentsTotal / rowsPerPage) - 1)));
    setReportsRecordsPage((current) => Math.min(current, Math.max(0, Math.ceil(censusRecordsTotal / rowsPerPage) - 1)));
  }, [censusRecordsTotal, residentsTotal]);

  useEffect(() => {
    setProfileForm(createProfileForm(sessionUser));
  }, [sessionUser]);

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

  const handleProfileSave = async () => {
    try {
      const data = await apiRequest('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileForm),
      });
      saveCurrentUser(data.user, data.token);
      setSessionUser(data.user);
      setUsers((current) => current.map((user) => (user.id === data.user.id ? data.user : user)));
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
      setPasswordForm(initialPasswordForm);
      setSettingsStatus({ severity: 'success', message: data.message || 'Password updated successfully.' });
    } catch (error) {
      setSettingsStatus({ severity: 'error', message: error.message });
    }
  };

  const handleRoleDelete = async (roleId) => {
    if (!window.confirm('Are you sure you want to delete this role?')) {
      return;
    }

    setRoleStatus(null);
    setDeletingRoleId(roleId);

    try {
      await apiRequest(`/api/admin/roles/${roleId}`, { method: 'DELETE' });
      setRoles((current) => current.filter((role) => role.id !== roleId));
      setRoleStatus({ severity: 'success', message: 'Role removed.' });
    } catch (error) {
      setRoleStatus({ severity: 'error', message: error.message });
    } finally {
      setDeletingRoleId('');
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

  const handleUserDelete = async () => {
    if (!userToDelete?.id) {
      return;
    }

    setUserStatus(null);
    setDeletingUserId(userToDelete.id);

    try {
      await apiRequest(`/api/users/${userToDelete.id}`, { method: 'DELETE' });
      setUsers((current) => current.filter((user) => user.id !== userToDelete.id));
      setUserStatus({ severity: 'success', message: 'User removed.' });
    } catch (error) {
      setUserStatus({ severity: 'error', message: error.message });
    } finally {
      setDeletingUserId('');
      setUserToDelete(null);
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
      setResidents((current) => current.filter((resident) => resident.id !== residentToDelete.id));
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
              <Avatar className="admin-avatar">{sessionUser?.name?.charAt(0) || 'A'}</Avatar>
              <Box>
                <Typography className="admin-user-name">{sessionUser?.name || 'Admin User'}</Typography>
                <Typography className="admin-user-role">
                  {sessionUser?.role || 'System Administrator'}
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
                                onClick={() => setUserToDelete(user)}
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
                      <CensusDashboardShortcut canAccess={['Admin', 'Personnel / Validator', 'Census Taker'].includes(sessionUser?.role)} />
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
                                  View
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
                        {censusRecords.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>{[record.firstName, record.lastName].filter(Boolean).join(' ')}</TableCell>
                            <TableCell>{record.area}</TableCell>
                            <TableCell>{record.birthday}</TableCell>
                            <TableCell>{new Date(record.createdAt).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                        {censusRecords.length === 0 && (
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
                    count={censusRecordsTotal}
                    page={reportsRecordsPage}
                    onPageChange={(event, nextPage) => setReportsRecordsPage(nextPage)}
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
                    <Button variant="contained" onClick={handleProfileSave}>
                      Save Details
                    </Button>
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
                    <Button variant="contained" onClick={handlePasswordSave}>
                      Update Password
                    </Button>
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
        <DialogTitle>Resident Details</DialogTitle>
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
            <TextField
              fullWidth
              label={userDialogState.mode === 'create' ? 'Password' : 'New password'}
              name="password"
              type="password"
              helperText={
                userDialogState.mode === 'create'
                  ? 'Use at least 8 characters with 1 uppercase letter, 1 number, and 1 symbol.'
                  : 'Leave blank to keep the current password. If set, use 8+ chars with 1 uppercase, 1 number, and 1 symbol.'
              }
              value={userDialogState.values.password}
              onChange={handleUserInputChange}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeUserDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleUserSave}>
            {userDialogState.mode === 'create' ? 'Create User' : 'Save User'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmationDialog
        open={Boolean(userToDelete)}
        title="Remove User"
        message={`Are you sure you want to remove ${userToDelete?.name || 'this user'}?`}
        confirmLabel="Remove"
        loading={Boolean(userToDelete) && deletingUserId === userToDelete?.id}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleUserDelete}
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

export default UserAdminPage;
