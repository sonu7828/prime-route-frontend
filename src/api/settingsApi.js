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
  },

  async getStatusesAndCategories() {
    try {
      const res = await request('/settings/statuses-categories');
      if (res?.data) {
        return {
          vehicleStatuses: Array.isArray(res.data.vehicleStatuses) ? res.data.vehicleStatuses : [],
          expenseCategories: Array.isArray(res.data.expenseCategories) ? res.data.expenseCategories : [],
          ticketStatuses: Array.isArray(res.data.ticketStatuses) ? res.data.ticketStatuses : []
        };
      }
    } catch (err) {
      console.error('Error fetching statuses and categories from database:', err);
    }

    return {
      vehicleStatuses: [],
      expenseCategories: [],
      ticketStatuses: []
    };
  },

  async updateStatusesAndCategories(data) {
    const res = await request('/settings/statuses-categories', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return res.data;
  },

  async addVehicleStatus(newItem) {
    const res = await request('/settings/vehicle-statuses', {
      method: 'POST',
      body: JSON.stringify(newItem)
    });
    return res.data;
  },

  async deleteVehicleStatus(id) {
    const res = await request(`/settings/vehicle-statuses/${id}`, {
      method: 'DELETE'
    });
    return res.data;
  },

  async addExpenseCategory(newItem) {
    const res = await request('/settings/expense-categories', {
      method: 'POST',
      body: JSON.stringify(newItem)
    });
    return res.data;
  },

  async deleteExpenseCategory(id) {
    const res = await request(`/settings/expense-categories/${id}`, {
      method: 'DELETE'
    });
    return res.data;
  },

  async addTicketStatus(newItem) {
    const res = await request('/settings/ticket-statuses', {
      method: 'POST',
      body: JSON.stringify(newItem)
    });
    return res.data;
  },

  async deleteTicketStatus(id) {
    const res = await request(`/settings/ticket-statuses/${id}`, {
      method: 'DELETE'
    });
    return res.data;
  }
};
