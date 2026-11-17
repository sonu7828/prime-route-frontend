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

export const accountingApi = {
  // Stats
  async getStats() {
    return request('/accounting/stats');
  },

  // Charges
  async getCharges() {
    return request('/accounting/charges');
  },

  async createCharge(chargeData) {
    return request('/accounting/charges', {
      method: 'POST',
      body: JSON.stringify(chargeData)
    });
  },

  // Payments
  async getPayments() {
    return request('/accounting/payments');
  },

  async createPayment(paymentData) {
    return request('/accounting/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
  },

  // Deposits
  async getDeposits() {
    return request('/accounting/deposits');
  },

  async createDeposit(depositData) {
    return request('/accounting/deposits', {
      method: 'POST',
      body: JSON.stringify(depositData)
    });
  },

  async releaseDeposit(id, data = {}) {
    return request(`/accounting/deposits/release/${id}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Refunds
  async getRefunds() {
    return request('/accounting/refunds');
  },

  async createRefund(refundData) {
    return request('/accounting/refunds', {
      method: 'POST',
      body: JSON.stringify(refundData)
    });
  },

  // Credits
  async getCredits() {
    return request('/accounting/credits');
  },

  async createCredit(creditData) {
    return request('/accounting/credits', {
      method: 'POST',
      body: JSON.stringify(creditData)
    });
  },

  // Invoices
  async getInvoices() {
    return request('/accounting/invoices');
  },

  async createInvoice(invoiceData) {
    return request('/accounting/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceData)
    });
  },

  // Payables
  async getPayables() {
    return request('/accounting/payables');
  },

  async createPayable(payableData) {
    return request('/accounting/payables', {
      method: 'POST',
      body: JSON.stringify(payableData)
    });
  },

  async updatePayableStatus(id, status) {
    return request(`/accounting/payables/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },

  // Balances
  async getDriverBalances() {
    return request('/accounting/balances');
  },

  // Vendors
  async getVendors() {
    return request('/accounting/vendors');
  },

  // Reversals
  async reverseTransaction(reversalData) {
    return request('/accounting/reversals', {
      method: 'POST',
      body: JSON.stringify(reversalData)
    });
  },

  // Delete
  async deleteEntry(type, id) {
    return request(`/accounting/entries/${type}/${id}`, {
      method: 'DELETE'
    });
  }
};

export default accountingApi;
