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
    const current = await this.getStatusesAndCategories();
    const updatedList = [...(current.vehicleStatuses || []), newItem];
    const res = await this.updateStatusesAndCategories({ ...current, vehicleStatuses: updatedList });
    return res?.vehicleStatuses || updatedList;
  },

  async updateVehicleStatus(id, patch) {
    const current = await this.getStatusesAndCategories();
    const updatedList = (current.vehicleStatuses || []).map((v) =>
      v.id === id ? { ...v, ...patch } : v
    );
    const res = await this.updateStatusesAndCategories({ ...current, vehicleStatuses: updatedList });
    return res?.vehicleStatuses || updatedList;
  },

  async deleteVehicleStatus(id) {
    const current = await this.getStatusesAndCategories();
    const updatedList = (current.vehicleStatuses || []).filter((v) => v.id !== id);
    const res = await this.updateStatusesAndCategories({ ...current, vehicleStatuses: updatedList });
    return res?.vehicleStatuses || updatedList;
  },

  async addExpenseCategory(newItem) {
    const current = await this.getStatusesAndCategories();
    const updatedList = [...(current.expenseCategories || []), newItem];
    const res = await this.updateStatusesAndCategories({ ...current, expenseCategories: updatedList });
    return res?.expenseCategories || updatedList;
  },

  async updateExpenseCategory(id, patch) {
    const current = await this.getStatusesAndCategories();
    const updatedList = (current.expenseCategories || []).map((e) =>
      e.id === id || e.code === id ? { ...e, ...patch } : e
    );
    const res = await this.updateStatusesAndCategories({ ...current, expenseCategories: updatedList });
    return res?.expenseCategories || updatedList;
  },

  async deleteExpenseCategory(id) {
    const current = await this.getStatusesAndCategories();
    const updatedList = (current.expenseCategories || []).filter((e) => e.id !== id && e.code !== id);
    const res = await this.updateStatusesAndCategories({ ...current, expenseCategories: updatedList });
    return res?.expenseCategories || updatedList;
  },

  async addTicketStatus(newItem) {
    const current = await this.getStatusesAndCategories();
    const updatedList = [...(current.ticketStatuses || []), newItem];
    const res = await this.updateStatusesAndCategories({ ...current, ticketStatuses: updatedList });
    return res?.ticketStatuses || updatedList;
  },

  async updateTicketStatus(id, patch) {
    const current = await this.getStatusesAndCategories();
    const updatedList = (current.ticketStatuses || []).map((t) =>
      t.id === id ? { ...t, ...patch } : t
    );
    const res = await this.updateStatusesAndCategories({ ...current, ticketStatuses: updatedList });
    return res?.ticketStatuses || updatedList;
  },

  async deleteTicketStatus(id) {
    const current = await this.getStatusesAndCategories();
    const updatedList = (current.ticketStatuses || []).filter((t) => t.id !== id);
    const res = await this.updateStatusesAndCategories({ ...current, ticketStatuses: updatedList });
    return res?.ticketStatuses || updatedList;
  }
};
