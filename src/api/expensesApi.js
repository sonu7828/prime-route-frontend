import { delay, getCachedOrInit, setCached, ApiError } from './client';

const EXPENSES_CACHE = 'prime_route_expenses';

export const expensesApi = {
  async getExpenses() {
    await delay();
    return [...getCachedOrInit(EXPENSES_CACHE, () => [])];
  },

  async recordExpense(expenseData) {
    await delay();
    const expenses = getCachedOrInit(EXPENSES_CACHE, () => []);

    const newExpense = {
      id: expenseData.id || `EXP-${String(expenses.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      status: 'Paid',
      ...expenseData
    };

    const updated = [newExpense, ...expenses];
    setCached(EXPENSES_CACHE, updated);
    return { ...newExpense };
  },

  async updateExpense(id, updates) {
    await delay();
    const expenses = getCachedOrInit(EXPENSES_CACHE, () => []);
    const index = expenses.findIndex((e) => e.id === id);
    if (index === -1) throw new ApiError(`Expense "${id}" not found`, 404);

    const updated = { ...expenses[index], ...updates };
    expenses[index] = updated;
    setCached(EXPENSES_CACHE, [...expenses]);
    return { ...updated };
  }
};

