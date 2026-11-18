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

export const inspectionsApi = {
  async getInspections(params = {}) {
    const query = new URLSearchParams();
    if (params.vehicleId) query.append('vehicleId', params.vehicleId);
    if (params.status && params.status !== 'All') query.append('status', params.status);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await request(`/inspections${qs}`);
    return res.data || [];
  },

  async getInspectionById(id) {
    const res = await request(`/inspections/${id}`);
    return res.data;
  },

  async createInspection(inspectionData) {
    const res = await request('/inspections', {
      method: 'POST',
      body: JSON.stringify(inspectionData)
    });
    return res.data;
  },

  async updateInspection(id, updates) {
    const res = await request(`/inspections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    return res.data;
  },

  async deleteInspection(id) {
    const res = await request(`/inspections/${id}`, {
      method: 'DELETE'
    });
    return res;
  },

  async getAccidents() {
    const res = await request('/inspections/accidents');
    return res.data || [];
  },

  async getAccidentById(id) {
    const res = await request(`/inspections/accidents/${id}`);
    return res.data;
  },

  async createAccident(accidentData) {
    const res = await request('/inspections/accidents', {
      method: 'POST',
      body: JSON.stringify(accidentData)
    });
    return res.data;
  },

  async reportAccident(accidentData) {
    return this.createAccident(accidentData);
  },

  async updateAccident(id, updates) {
    const res = await request(`/inspections/accidents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    return res.data;
  },

  async deleteAccident(id) {
    const res = await request(`/inspections/accidents/${id}`, {
      method: 'DELETE'
    });
    return res;
  },

  async getInspectionStats() {
    const res = await request('/inspections/stats');
    return res.data;
  }
};

export default inspectionsApi;
