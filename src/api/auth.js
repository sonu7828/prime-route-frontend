import { delay, ApiError } from './client.js';
import { loadStoredUsers } from './users.js';
import { initialSettings } from '../data/mockData.js';

export const MOCK_AUTH_USERS = [
  {
    id: 'USR-001',
    name: 'Marcus Brody',
    email: 'marcus.brody@primeroute.io',
    password: 'password123',
    role: 'owner',
    roleName: 'Owner / Primary Admin',
    status: 'Active',
  },
  {
    id: 'USR-002',
    name: 'Elena Vance',
    email: 'elena.vance@primeroute.io',
    password: 'password123',
    role: 'secondary_admin',
    roleName: 'Secondary Admin',
    status: 'Active',
  },
  {
    id: 'USR-003',
    name: 'Michael Chang',
    email: 'michael.chang@primeroute.io',
    password: 'password123',
    role: 'finance',
    roleName: 'Finance',
    status: 'Active',
  },
  {
    id: 'USR-004',
    name: 'Tom Gallagher',
    email: 'tom.gallagher@primeroute.io',
    password: 'password123',
    role: 'fleet_maintenance',
    roleName: 'Fleet / Maintenance',
    status: 'Active',
  },
  {
    id: 'USR-005',
    name: 'Sarah Connor',
    email: 'sarah.connor@primeroute.io',
    password: 'password123',
    role: 'rental_operations',
    roleName: 'Rental / Operations',
    status: 'Active',
  },
  {
    id: 'USR-006',
    name: 'Rachel Green',
    email: 'rachel.green@primeroute.io',
    password: 'password123',
    role: 'readonly_manager',
    roleName: 'Read-only Manager',
    status: 'Active',
  },
];

export const normalizeAuthRole = (r) => {
  if (!r) return 'rental_operations';
  const lower = String(r).toLowerCase().trim();
  if (lower === 'owner' || lower === 'administrator 1' || lower === 'primary admin') return 'owner';
  if (lower === 'secondary_admin' || lower === 'admin' || lower === 'administrator' || lower === 'administrator 2') return 'secondary_admin';
  if (lower === 'finance' || lower === 'accountant') return 'finance';
  if (lower === 'fleet_maintenance' || lower === 'maintenance' || lower === 'fleet manager' || lower === 'service') return 'fleet_maintenance';
  if (lower === 'rental_operations' || lower === 'operations' || lower === 'operator' || lower === 'employee' || lower === 'rental') return 'rental_operations';
  if (lower === 'readonly_manager' || lower === 'manager' || lower === 'readonly' || lower === 'read-only') return 'readonly_manager';
  return lower;
};

export const findUserByEmail = (emailStr) => {
  if (!emailStr) return null;
  const targetEmail = String(emailStr).trim().toLowerCase();

  // 1. Check persistent localStorage users (includes admin-created users)
  try {
    const storedUsers = loadStoredUsers();
    const found = storedUsers.find((u) => (u.email || '').toLowerCase() === targetEmail);
    if (found) {
      return {
        ...found,
        role: normalizeAuthRole(found.role),
        password: found.password || 'password123',
        status: found.status || 'Active',
      };
    }
  } catch {
    // fallback
  }

  // 2. Check initialSettings.users from mockData
  if (initialSettings?.users?.length) {
    const found = initialSettings.users.find((u) => (u.email || '').toLowerCase() === targetEmail);
    if (found) {
      return {
        ...found,
        role: normalizeAuthRole(found.role),
        password: found.password || 'password123',
        status: found.status || 'Active',
      };
    }
  }

  // 3. Check MOCK_AUTH_USERS
  const found = MOCK_AUTH_USERS.find((u) => u.email.toLowerCase() === targetEmail);
  if (found) {
    return { ...found };
  }

  return null;
};

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const authenticate = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      const errorMsg = data?.error?.message || 'Authentication failed. Please verify corporate credentials.';
      throw new ApiError(errorMsg, response.status);
    }

    const { accessToken, refreshToken, user } = data.data;

    // Persist JWT session tokens
    if (accessToken) {
      localStorage.setItem('primeroute_access_token', accessToken);
    }
    if (refreshToken) {
      localStorage.setItem('primeroute_refresh_token', refreshToken);
    }
    if (user) {
      localStorage.setItem('primeroute_current_user', JSON.stringify(user));
      localStorage.setItem('primeroute_active_role', user.role);
    }

    return user;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    // Fallback if backend server is completely unreachable
    throw new ApiError(
      err.message || 'Cannot connect to authentication server. Please check backend status.',
      503
    );
  }
};

export const authApi = {
  login: authenticate,
  authenticate,
  findUserByEmail,
  getMockUsers: () => [...MOCK_AUTH_USERS],
};

export default authApi;

