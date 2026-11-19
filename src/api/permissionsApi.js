const API_BASE_URL = import.meta.env.VITE_API_URL;

function getAuthHeaders() {
  const token = localStorage.getItem('primeroute_access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function request(endpoint, options = {}) {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {})
    }
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    const errorMsg = json?.error?.message || json?.message || `Request failed with status ${res.status}`;
    const err = new Error(errorMsg);
    err.status = res.status;
    err.code = json?.error?.code;
    throw err;
  }
  return json;
}

export const PRIME_MODULES = [
  'Dashboard',
  'Employee Paperwork',
  'Vehicles',
  'Drivers',
  'Rentals',
  'Inspections',
  'Insurance & Compliance',
  'Accounting',
  'Vendors',
  'Maintenance',
  'Tolls & Tickets',
  'Documents',
  'Reports',
  'Users & Roles',
  'Settings',
  'Settings - General',
  'Settings - Audit Log',
  'Settings - Notifications',
  'Settings - Statuses & Categories'
];

export const permissionsApi = {
  async getMyPermissions() {
    const res = await request('/users/my-permissions');
    return res.data || [];
  },

  async getUserPermissions(userId) {
    const numericId = typeof userId === 'string' ? userId.replace(/\D/g, '') || userId : userId;
    try {
      const res = await request(`/users/${numericId}/permissions`);
      const perms = res.data?.permissions || [];
      if (Array.isArray(perms) && perms.length > 0) {
        localStorage.setItem(`primeroute_user_permissions_${userId}`, JSON.stringify(perms));
        localStorage.setItem(`primeroute_user_permissions_${numericId}`, JSON.stringify(perms));
      }
      return perms;
    } catch (err) {
      const cached = localStorage.getItem(`primeroute_user_permissions_${userId}`) ||
                     localStorage.getItem(`primeroute_user_permissions_${numericId}`);
      if (cached) return JSON.parse(cached);
      // Deny by default - strictly no fallback granting unauthorized view access
      return PRIME_MODULES.map((m, i) => ({
        id: i + 1,
        userId: Number(numericId),
        moduleName: m,
        canView: false,
        canAdd: false,
        canEdit: false,
        canDelete: false
      }));
    }
  },

  async updateUserPermissions(userId, permissions) {
    const numericId = typeof userId === 'string' ? userId.replace(/\D/g, '') || userId : userId;
    localStorage.setItem(`primeroute_user_permissions_${userId}`, JSON.stringify(permissions));
    localStorage.setItem(`primeroute_user_permissions_${numericId}`, JSON.stringify(permissions));
    const res = await request(`/users/${numericId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions })
    });
    return res;
  }
};
