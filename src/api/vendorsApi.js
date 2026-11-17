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
    const errorMsg = json?.error?.message || `Request failed with status ${res.status}`;
    const err = new Error(errorMsg);
    err.status = res.status;
    err.code = json?.error?.code;
    throw err;
  }
  return json;
}

export const vendorsApi = {
  async getVendors(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.category && params.category !== 'All') query.append('category', params.category);
    if (params.status && params.status !== 'All') query.append('status', params.status);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await request(`/vendors${qs}`);
    return {
      vendors: res.data || [],
      stats: res.stats || {
        totalVendors: (res.data || []).length,
        activeVendors: (res.data || []).filter((v) => v.status === 'Active Partner').length,
        totalSpendYTD: (res.data || []).reduce((sum, v) => sum + (v.spendYTD || 0), 0),
        standardTerms: 'Net 30'
      }
    };
  },

  async getVendorById(id) {
    const res = await request(`/vendors/${id}`);
    return res.data;
  },

  async createVendor(vendorData) {
    const res = await request('/vendors', {
      method: 'POST',
      body: JSON.stringify(vendorData)
    });
    return res.data;
  },

  async updateVendor(id, updates) {
    const res = await request(`/vendors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    return res.data;
  },

  async deleteVendor(id) {
    const res = await request(`/vendors/${id}`, {
      method: 'DELETE'
    });
    return res.data;
  }
};
