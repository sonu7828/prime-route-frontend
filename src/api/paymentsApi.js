import { delay, getCachedOrInit, setCached, ApiError } from './client';

const INCOME_CACHE = 'prime_route_payments';
const INVOICES_CACHE = 'prime_route_invoices';

export const paymentsApi = {
  async getPayments() {
    await delay();
    return [...getCachedOrInit(INCOME_CACHE, () => [])];
  },

  async getInvoices() {
    await delay();
    return [...getCachedOrInit(INVOICES_CACHE, () => [])];
  },

  async recordPayment(paymentData) {
    await delay();
    const payments = getCachedOrInit(INCOME_CACHE, () => []);

    const newPayment = {
      id: paymentData.id || `PAY-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      status: 'Completed',
      ...paymentData
    };

    const updated = [newPayment, ...payments];
    setCached(INCOME_CACHE, updated);
    return { ...newPayment };
  },

  async createInvoice(invoiceData) {
    await delay();
    const invoices = getCachedOrInit(INVOICES_CACHE, () => []);

    const newInvoice = {
      id: invoiceData.id || `INV-${String(invoices.length + 101).padStart(4, '0')}`,
      date: new Date().toISOString().split('T')[0],
      status: 'Unpaid',
      ...invoiceData
    };

    const updated = [newInvoice, ...invoices];
    setCached(INVOICES_CACHE, updated);
    return { ...newInvoice };
  }
};

