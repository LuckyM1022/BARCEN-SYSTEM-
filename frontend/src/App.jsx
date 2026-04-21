import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { getCurrentUser, getDefaultRouteForRole } from './auth';
import AccessDeniedPage from './pages/AccessDeniedPage';
import CensusTakerPage from './pages/CensusTakerPage';
import LoginPage from './pages/LoginPage';
import PersonnelValidatorPage from './pages/PersonnelValidatorPage';
import ResidentsPage from './pages/ResidentsPage';
import RegisterPage from './pages/RegisterPage';
import UserAdminPage from './pages/UserAdminPage';

function ProtectedRoute({ allowedRoles, children }) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/access-denied" replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const currentUser = getCurrentUser();

  if (currentUser) {
    return <Navigate to={getDefaultRouteForRole(currentUser.role)} replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/access-denied" element={<AccessDeniedPage />} />
        <Route
          path="/admin"
          element={(
            <ProtectedRoute allowedRoles={['Admin']}>
              <UserAdminPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/census-taker"
          element={(
            <ProtectedRoute allowedRoles={['Admin', 'Personnel / Validator', 'Census Taker']}>
              <CensusTakerPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/login"
          element={(
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          )}
        />
        <Route
          path="/personnel-validator"
          element={(
            <ProtectedRoute allowedRoles={['Admin', 'Personnel / Validator']}>
              <PersonnelValidatorPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/personnel-validator/residents"
          element={(
            <ProtectedRoute allowedRoles={['Admin', 'Personnel / Validator']}>
              <ResidentsPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/register"
          element={(
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          )}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
