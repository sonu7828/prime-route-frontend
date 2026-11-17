const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

function getAuthHeaders() {
  const token = localStorage.getItem('primeroute_access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const vehiclesApi = {
  async getVehicles() {
    const res = await fetch(`${API_BASE_URL}/vehicles`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json?.error?.message || 'Failed to fetch vehicles from database');
    }
    return json.data;
  },

  async getVehicleById(id) {
    const res = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json?.error?.message || `Vehicle with ID "${id}" not found`);
    }
    return json.data;
  },

  async createVehicle(vehicleData) {
    const res = await fetch(`${API_BASE_URL}/vehicles`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(vehicleData)
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json?.error?.message || 'Failed to create vehicle');
    }
    return json.data;
  },

  async updateVehicle(id, updates) {
    const res = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json?.error?.message || 'Failed to update vehicle');
    }
    return json.data;
  },

  async deleteVehicle(id) {
    const res = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json?.error?.message || 'Failed to delete vehicle');
    }
    return json.data;
  }
};

export default vehiclesApi;
