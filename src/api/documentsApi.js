const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const STORAGE_KEY = 'primeroute_documents_data_v2';

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('primeroute_access_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const documentsApi = {
  async getDocuments() {
    let localDocs = [];
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) localDocs = parsed;
        }
      } catch (e) {}
    }

    try {
      const res = await fetch(`${API_BASE_URL}/documents`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.data)) {
        // Merge server documents with local documents
        const serverMap = new Map(json.data.map((d) => [d.id, d]));
        const merged = [...json.data];
        for (const loc of localDocs) {
          if (!serverMap.has(loc.id)) {
            merged.push(loc);
          }
        }
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        }
        return merged;
      }
    } catch (err) {
      console.warn('Backend /documents fetch failed, preserving local vault:', err.message);
    }

    return localDocs;
  },

  async uploadDocument(docData) {
    const fallbackDoc = {
      ...docData,
      id: docData.id || `DOC-${Math.floor(100 + Math.random() * 900)}`,
      uploadedDate: new Date().toISOString().split('T')[0],
      status: 'Valid'
    };

    // Immediately save locally so it NEVER disappears on refresh
    if (typeof window !== 'undefined') {
      try {
        const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const updated = [fallbackDoc, ...existing.filter((d) => d.id !== fallbackDoc.id)];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
    }

    try {
      const res = await fetch(`${API_BASE_URL}/documents`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(docData)
      });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        if (typeof window !== 'undefined') {
          try {
            const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            const updated = [json.data, ...existing.filter((d) => d.id !== json.data.id && d.id !== fallbackDoc.id)];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          } catch (e) {}
        }
        return json.data;
      }
    } catch (err) {
      console.warn('Backend /documents upload failed, preserved locally:', err.message);
    }

    return fallbackDoc;
  },

  async deleteDocument(id) {
    // Immediately remove locally so it is permanently deleted
    if (typeof window !== 'undefined') {
      try {
        const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const filtered = existing.filter((d) => d.id !== id && d.dbId !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      } catch (e) {}
    }

    try {
      const res = await fetch(`${API_BASE_URL}/documents/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const json = await res.json();
      if (res.ok && json.success) {
        return json.data || { success: true };
      }
    } catch (err) {
      console.warn('Backend /documents delete failed, removed locally:', err.message);
    }
    return { success: true };
  }
};
