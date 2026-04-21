import { clearCurrentUser, getAuthToken } from './auth';

const configuredApiBaseUrl = process.env.REACT_APP_API_BASE_URL?.trim();
const API_BASE_URL = (configuredApiBaseUrl || `http://${window.location.hostname}:4000`).replace(
  /\/$/,
  ''
);

export async function apiRequest(path, options = {}) {
  const token = getAuthToken();

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      ...options,
    });
  } catch (error) {
    throw new Error(
      'Could not reach the backend API. Check that the backend server is running and that REACT_APP_API_BASE_URL points to the correct host.'
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      clearCurrentUser();
    }

    throw new Error(data.message || 'Request failed.');
  }

  return data;
}
