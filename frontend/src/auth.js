const STORAGE_KEY = 'barcen-session';
const LEGACY_STORAGE_KEY = 'barcen-current-user';

function normalizeSession(storedValue) {
  if (!storedValue) {
    return null;
  }

  if (storedValue.user) {
    return {
      user: storedValue.user,
      token: storedValue.token || '',
    };
  }

  if (storedValue.role) {
    return {
      user: storedValue,
      token: '',
    };
  }

  return null;
}

export function getCurrentSession() {
  const storedSession = window.localStorage.getItem(STORAGE_KEY);
  const legacyUser = window.localStorage.getItem(LEGACY_STORAGE_KEY);
  const valueToParse = storedSession || legacyUser;

  if (!valueToParse) {
    return null;
  }

  try {
    return normalizeSession(JSON.parse(valueToParse));
  } catch (error) {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    return null;
  }
}

export function getCurrentUser() {
  return getCurrentSession()?.user || null;
}

export function getAuthToken() {
  return getCurrentSession()?.token || '';
}

export function saveCurrentUser(user, token = '') {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }));
  window.localStorage.removeItem(LEGACY_STORAGE_KEY);
}

export function clearCurrentUser() {
  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_STORAGE_KEY);
}

export function getDefaultRouteForRole(role) {
  if (role === 'Admin') {
    return '/admin';
  }

  if (role === 'Personnel / Validator') {
    return '/personnel-validator';
  }

  return '/census-taker';
}
