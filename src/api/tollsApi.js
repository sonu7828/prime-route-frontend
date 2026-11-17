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

export const tollsApi = {
  /**
   * Get KPI statistics
   */
  async getStats() {
    const res = await request('/tolls/stats');
    return res.data;
  },

  /**
   * Get all municipal violation tickets
   */
  async getTickets(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.vehicleId) query.append('vehicleId', params.vehicleId);
    if (params.driverId) query.append('driverId', params.driverId);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await request(`/tolls/tickets${qs}`);
    return res.data || [];
  },

  /**
   * Get all Electronic E-ZPass tolls
   */
  async getTolls(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await request(`/tolls/electronic${qs}`);
    return res.data || [];
  },

  /**
   * Get single ticket by ID
   */
  async getTicketById(id) {
    const res = await request(`/tolls/tickets/${id}`);
    return res.data;
  },

  /**
   * Create new citation ticket
   */
  async createTicket(ticketData) {
    const res = await request('/tolls/tickets', {
      method: 'POST',
      body: JSON.stringify(ticketData)
    });
    return res.data;
  },

  /**
   * Update citation ticket
   */
  async updateTicket(id, updates) {
    const res = await request(`/tolls/tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    return res.data;
  },

  /**
   * Delete citation ticket
   */
  async deleteTicket(id) {
    const res = await request(`/tolls/tickets/${id}`, {
      method: 'DELETE'
    });
    return res;
  },

  /**
   * Transition ticket through review workflow
   */
  async updateWorkflow(id, action, payload = {}) {
    const res = await request(`/tolls/tickets/${id}/workflow`, {
      method: 'PATCH',
      body: JSON.stringify({ action, ...payload })
    });
    return res.data;
  }
};
