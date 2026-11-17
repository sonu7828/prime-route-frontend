const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

function getAuthHeaders() {
  const token = localStorage.getItem('primeroute_access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const driversApi = {
  async getDrivers() {
    const res = await fetch(`${API_BASE_URL}/drivers`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json?.error?.message || 'Failed to fetch drivers from database');
    }
    return json.data;
  },

  async getDriverById(id) {
    const res = await fetch(`${API_BASE_URL}/drivers/${id}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json?.error?.message || `Driver with ID "${id}" not found`);
    }
    return json.data;
  },

  async createDriver(driverData) {
    const res = await fetch(`${API_BASE_URL}/drivers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(driverData)
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json?.error?.message || 'Failed to create driver');
    }
    return json.data;
  },

  async updateDriver(id, updates) {
    const res = await fetch(`${API_BASE_URL}/drivers/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json?.error?.message || 'Failed to update driver');
    }
    return json.data;
  },

  async deleteDriver(id) {
    const res = await fetch(`${API_BASE_URL}/drivers/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json?.error?.message || 'Failed to delete driver');
    }
    return json.data;
  }
};

export default driversApi;
