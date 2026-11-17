const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

function getAuthHeaders() {
  const token = localStorage.getItem('primeroute_access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const rentalsApi = {
  async getRentals() {
    const res = await fetch(`${API_BASE_URL}/rentals`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json?.error?.message || 'Failed to fetch rentals from database');
    }
    return json.data;
  },

  async getRentalById(id) {
    const res = await fetch(`${API_BASE_URL}/rentals/${id}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json?.error?.message || `Rental contract with ID "${id}" not found`);
    }
    return json.data;
  },

  async createRental(rentalData) {
    const res = await fetch(`${API_BASE_URL}/rentals`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(rentalData)
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json?.error?.message || 'Failed to create rental');
    }
    return json.data;
  },

  async updateRental(id, updates) {
    const res = await fetch(`${API_BASE_URL}/rentals/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json?.error?.message || 'Failed to update rental');
    }
    return json.data;
  },

  async deleteRental(id) {
    const res = await fetch(`${API_BASE_URL}/rentals/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json?.error?.message || 'Failed to terminate rental');
    }
    return json.data;
  }
};

export default rentalsApi;
