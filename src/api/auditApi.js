const PRIMARY_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const LOCAL_URL = 'http://localhost:5000/api/v1';

function getAuthHeaders() {
  const token = localStorage.getItem('primeroute_access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function request(baseUrl, endpoint, options = {}) {
  const url = `${baseUrl}${endpoint}`;
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

async function requestWithFallback(endpoint, options = {}) {
  try {
    return await request(PRIMARY_URL, endpoint, options);
  } catch (primaryErr) {
    // If primary failed with 404 or network error and primary != local, try local
    if (PRIMARY_URL !== LOCAL_URL) {
      try {
        return await request(LOCAL_URL, endpoint, options);
      } catch (localErr) {
        throw primaryErr;
      }
    }
    throw primaryErr;
  }
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

    const json = await requestWithFallback(endpoint, { method: 'GET' });
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

      const json = await requestWithFallback('/audit-logs', {
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

    const json = await requestWithFallback(endpoint, { method: 'GET' });
    return json.data;
  },

  /**
   * Fetch dynamic filters metadata (Users, Modules, Actions) directly from database
   */
  async getAuditFilters() {
    const json = await requestWithFallback('/audit-logs/filters', { method: 'GET' });
    return json.data;
  }
};
