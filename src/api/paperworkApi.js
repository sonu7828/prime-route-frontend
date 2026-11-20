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

export const paperworkApi = {
  async getPaperwork() {
    const res = await request('/paperwork');
    return res.data;
  },

  async getPaperworkById(id) {
    const res = await request(`/paperwork/${id}`);
    return res.data;
  },

  async savePaperwork(payload) {
    // Map 'Not Started' / 'not_started' safely to 'draft' so MySQL enum doesn't throw 500 error
    const rawStatus = (payload?.status || 'draft').toLowerCase().replace(/\s+/g, '_');
    const safeStatus = (rawStatus === 'not_started' || rawStatus === 'pending_review') 
      ? (rawStatus === 'pending_review' ? 'submitted' : 'draft')
      : rawStatus;

    const safePayload = {
      ...payload,
      status: safeStatus
    };

    const res = await request('/paperwork', {
      method: 'POST',
      body: JSON.stringify(safePayload)
    });
    return res.data;
  },

  async reviewPaperwork(id, action, notes = '') {
    // Map 'reset' / 'not_started' to 'draft' for MySQL enum compatibility
    const act = (action || '').toLowerCase();
    const safeAction = (act === 'reset' || act === 'not_started') ? 'draft' : act;

    const res = await request(`/paperwork/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ action: safeAction, notes })
    });
    return res.data;
  }
};

export default paperworkApi;
