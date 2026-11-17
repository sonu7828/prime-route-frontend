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
  return json.data;
}

export const insuranceApi = {
  // Policies
  async getPolicies() {
    return request('/insurance/policies');
  },

  async getPolicyById(id) {
    return request(`/insurance/policies/${id}`);
  },

  async createPolicy(policyData) {
    return request('/insurance/policies', {
      method: 'POST',
      body: JSON.stringify(policyData)
    });
  },

  async updatePolicy(id, policyData) {
    return request(`/insurance/policies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(policyData)
    });
  },

  async deletePolicy(id) {
    return request(`/insurance/policies/${id}`, {
      method: 'DELETE'
    });
  },

  // Claims
  async getClaims() {
    return request('/insurance/claims');
  },

  async getClaimById(id) {
    return request(`/insurance/claims/${id}`);
  },

  async createClaim(claimData) {
    return request('/insurance/claims', {
      method: 'POST',
      body: JSON.stringify(claimData)
    });
  },

  async updateClaim(id, claimData) {
    return request(`/insurance/claims/${id}`, {
      method: 'PUT',
      body: JSON.stringify(claimData)
    });
  },

  async deleteClaim(id) {
    return request(`/insurance/claims/${id}`, {
      method: 'DELETE'
    });
  },

  async getAccidents() {
    return request('/insurance/accidents');
  },

  // Compliance Records
  async getCompliance() {
    return request('/insurance/compliance');
  },

  async createCompliance(complianceData) {
    return request('/insurance/compliance', {
      method: 'POST',
      body: JSON.stringify(complianceData)
    });
  },

  async renewCompliance(id, renewData) {
    return request(`/insurance/compliance/renew/${id}`, {
      method: 'POST',
      body: JSON.stringify(renewData)
    });
  },

  async deleteCompliance(id) {
    return request(`/insurance/compliance/${id}`, {
      method: 'DELETE'
    });
  },

  // Stats / KPIs
  async getStats() {
    return request('/insurance/stats');
  }
};

export default insuranceApi;
