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
    err.code = json?.error?.code;
    throw err;
  }
  return json;
}

export const maintenanceApi = {
  async getMaintenanceRecords(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.vehicleId) query.append('vehicleId', params.vehicleId);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await request(`/maintenance${qs}`);
    return res.data || [];
  },

  async getMaintenanceStats() {
    const res = await request('/maintenance/stats');
    return res.data;
  },

  async getMaintenanceById(id) {
    const res = await request(`/maintenance/${id}`);
    return res.data;
  },

  async createMaintenanceRecord(recordData) {
    const res = await request('/maintenance', {
      method: 'POST',
      body: JSON.stringify(recordData)
    });
    return res.data;
  },

  async updateMaintenanceRecord(id, updates) {
    const res = await request(`/maintenance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    return res.data;
  },

  async deleteMaintenanceRecord(id) {
    const res = await request(`/maintenance/${id}`, {
      method: 'DELETE'
    });
    return res;
  },

  async toggleVehicleAvailability(vehicleId, status = null) {
    const res = await request(`/maintenance/vehicles/${vehicleId}/availability`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    return res.data;
  }
};
