const API_BASE_URL = import.meta.env.VITE_API_URL;

function getAuthHeaders() {
  const token = localStorage.getItem('primeroute_access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const res = await fetch(url, {
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

export const auditApi = {
  /**
   * Fetch paginated & filtered audit logs directly from MySQL database
   */
  async getAuditLogs(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.user && params.user !== 'All Users') query.append('user', params.user);
    if (params.userId) query.append('userId', params.userId);
    if (params.action && params.action !== 'All Actions') query.append('action', params.action);
    if (params.module && params.module !== 'All Modules') query.append('module', params.module);
    if (params.datePeriod && params.datePeriod !== 'All') query.append('datePeriod', params.datePeriod);
    if (params.search) query.append('search', params.search);

    const queryString = query.toString();
    const endpoint = `/audit-logs${queryString ? `?${queryString}` : ''}`;

    const json = await request(endpoint, { method: 'GET' });
    return json.data;
  },

  /**
   * Append new immutable log into MySQL database
   */
  async appendAuditLog(entry = {}) {
    try {
      const payload = {
        module: entry.module || 'System',
        action: entry.action || 'Record Modified',
        entityType: entry.entityType || entry.module || 'System',
        entityId: entry.entityId || null,
        oldValues: entry.oldValues || entry.previousValue || null,
        newValues: entry.newValues || entry.newValue || entry.details || 'Active',
        notes: entry.notes || entry.details || `${entry.action || 'Action'} executed`,
        record: entry.record || entry.target || `${entry.module || 'Record'}`
      };

      const json = await request('/audit-logs', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return json.data;
    } catch (e) {
      console.warn('auditApi.appendAuditLog failed to reach database:', e.message);
      return null;
    }
  },

  /**
   * Export all matching audit records for admin compliance report
   */
  async exportAuditLogs(params = {}) {
    const query = new URLSearchParams();
    if (params.user && params.user !== 'All Users') query.append('user', params.user);
    if (params.action && params.action !== 'All Actions') query.append('action', params.action);
    if (params.module && params.module !== 'All Modules') query.append('module', params.module);
    if (params.datePeriod && params.datePeriod !== 'All') query.append('datePeriod', params.datePeriod);
    if (params.search) query.append('search', params.search);

    const queryString = query.toString();
    const endpoint = `/audit-logs/export${queryString ? `?${queryString}` : ''}`;

    const json = await request(endpoint, { method: 'GET' });
    return json.data;
  },

  /**
   * Fetch dynamic filters metadata (Users, Modules, Actions) directly from database
   */
  async getAuditFilters() {
    const json = await request('/audit-logs/filters', { method: 'GET' });
    return json.data;
  }
};
