const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

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
    throw err;
  }
  return json;
}

export const settingsApi = {
  async getGeneralSettings() {
    const res = await request('/settings/general');
    return res.data;
  },

  async updateGeneralSettings(settingsData) {
    const res = await request('/settings/general', {
      method: 'PUT',
      body: JSON.stringify(settingsData)
    });
    return res.data;
  },

  async getAllSettings() {
    const res = await request('/settings');
    return res.data;
  }
};
