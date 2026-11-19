import {
  initialVehicleStatuses,
  initialExpenseCategoriesList,
  initialTicketStatuses
} from '../data/mockData';

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
      // 1. Try dedicated endpoint first
      const res = await request('/settings/statuses-categories');
      if (res?.data) {
        localStorage.setItem('primeroute_statuses_categories', JSON.stringify(res.data));
        return res.data;
      }
    } catch (err) {
      // 2. Fallback to /settings table if dedicated endpoint is not yet mounted on remote
      try {
        const allSettings = await request('/settings');
        if (Array.isArray(allSettings?.data)) {
          const map = {};
          allSettings.data.forEach((item) => {
            map[item.setting_key] = item.setting_value;
          });

          let vehicleStatuses = initialVehicleStatuses;
          let expenseCategories = initialExpenseCategoriesList;
          let ticketStatuses = initialTicketStatuses;

          if (map['vehicle_statuses']) {
            try { vehicleStatuses = JSON.parse(map['vehicle_statuses']); } catch {}
          }
          if (map['expense_categories']) {
            try { expenseCategories = JSON.parse(map['expense_categories']); } catch {}
          }
          if (map['ticket_statuses']) {
            try { ticketStatuses = JSON.parse(map['ticket_statuses']); } catch {}
          }

          const resolved = { vehicleStatuses, expenseCategories, ticketStatuses };
          localStorage.setItem('primeroute_statuses_categories', JSON.stringify(resolved));
          return resolved;
        }
      } catch (innerErr) {
        console.warn('Could not fetch from /settings, using local cache:', innerErr);
      }
    }

    // 3. Fallback to localStorage or mockData
    try {
      const stored = localStorage.getItem('primeroute_statuses_categories');
      if (stored) return JSON.parse(stored);
    } catch {}

    return {
      vehicleStatuses: initialVehicleStatuses,
      expenseCategories: initialExpenseCategoriesList,
      ticketStatuses: initialTicketStatuses
    };
  },

  async updateStatusesAndCategories(data) {
    try {
      const res = await request('/settings/statuses-categories', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      if (res?.data) {
        localStorage.setItem('primeroute_statuses_categories', JSON.stringify(res.data));
        return res.data;
      }
    } catch (err) {
      try {
        await request('/settings/general', {
          method: 'PUT',
          body: JSON.stringify({
            vehicle_statuses: data.vehicleStatuses,
            expense_categories: data.expenseCategories,
            ticket_statuses: data.ticketStatuses
          })
        });
      } catch {}
    }

    localStorage.setItem('primeroute_statuses_categories', JSON.stringify(data));
    return data;
  },

  async addVehicleStatus(newItem) {
    try {
      const res = await request('/settings/vehicle-statuses', {
        method: 'POST',
        body: JSON.stringify(newItem)
      });
      if (res?.data) {
        const current = await this.getStatusesAndCategories();
        localStorage.setItem('primeroute_statuses_categories', JSON.stringify({ ...current, vehicleStatuses: res.data }));
        return res.data;
      }
    } catch {}

    const current = await this.getStatusesAndCategories();
    const list = [...(current.vehicleStatuses || []), newItem];
    await this.updateStatusesAndCategories({ ...current, vehicleStatuses: list });
    return list;
  },

  async deleteVehicleStatus(id) {
    try {
      const res = await request(`/settings/vehicle-statuses/${id}`, {
        method: 'DELETE'
      });
      if (res?.data) return res.data;
    } catch {}

    const current = await this.getStatusesAndCategories();
    const list = (current.vehicleStatuses || []).filter((v) => v.id !== id);
    await this.updateStatusesAndCategories({ ...current, vehicleStatuses: list });
    return list;
  },

  async addExpenseCategory(newItem) {
    try {
      const res = await request('/settings/expense-categories', {
        method: 'POST',
        body: JSON.stringify(newItem)
      });
      if (res?.data) {
        const current = await this.getStatusesAndCategories();
        localStorage.setItem('primeroute_statuses_categories', JSON.stringify({ ...current, expenseCategories: res.data }));
        return res.data;
      }
    } catch {}

    const current = await this.getStatusesAndCategories();
    const list = [...(current.expenseCategories || []), newItem];
    await this.updateStatusesAndCategories({ ...current, expenseCategories: list });
    return list;
  },

  async deleteExpenseCategory(id) {
    try {
      const res = await request(`/settings/expense-categories/${id}`, {
        method: 'DELETE'
      });
      if (res?.data) return res.data;
    } catch {}

    const current = await this.getStatusesAndCategories();
    const list = (current.expenseCategories || []).filter((v) => v.id !== id && v.code !== id);
    await this.updateStatusesAndCategories({ ...current, expenseCategories: list });
    return list;
  },

  async addTicketStatus(newItem) {
    try {
      const res = await request('/settings/ticket-statuses', {
        method: 'POST',
        body: JSON.stringify(newItem)
      });
      if (res?.data) {
        const current = await this.getStatusesAndCategories();
        localStorage.setItem('primeroute_statuses_categories', JSON.stringify({ ...current, ticketStatuses: res.data }));
        return res.data;
      }
    } catch {}

    const current = await this.getStatusesAndCategories();
    const list = [...(current.ticketStatuses || []), newItem];
    await this.updateStatusesAndCategories({ ...current, ticketStatuses: list });
    return list;
  },

  async deleteTicketStatus(id) {
    try {
      const res = await request(`/settings/ticket-statuses/${id}`, {
        method: 'DELETE'
      });
      if (res?.data) return res.data;
    } catch {}

    const current = await this.getStatusesAndCategories();
    const list = (current.ticketStatuses || []).filter((v) => v.id !== id);
    await this.updateStatusesAndCategories({ ...current, ticketStatuses: list });
    return list;
  }
};
