// Utility formatters for PrimeRoute

export const CURRENCY_CONFIG = {
  'USD ($)': { code: 'USD', symbol: '$', locale: 'en-US' },
  'CAD ($)': { code: 'CAD', symbol: 'CA$', locale: 'en-US' },
  'EUR (€)': { code: 'EUR', symbol: '€', locale: 'en-US' },
  'GBP (£)': { code: 'GBP', symbol: '£', locale: 'en-US' },
  'AUD ($)': { code: 'AUD', symbol: 'A$', locale: 'en-US' },

  // Flexible direct aliases
  'USD': { code: 'USD', symbol: '$', locale: 'en-US' },
  'CAD': { code: 'CAD', symbol: 'CA$', locale: 'en-US' },
  'EUR': { code: 'EUR', symbol: '€', locale: 'en-US' },
  'GBP': { code: 'GBP', symbol: '£', locale: 'en-US' },
  'AUD': { code: 'AUD', symbol: 'A$', locale: 'en-US' },
};

export const getActiveCurrency = () => {
  try {
    const saved = localStorage.getItem('primeroute_currency');
    if (saved) {
      if (CURRENCY_CONFIG[saved]) return CURRENCY_CONFIG[saved];
      const upper = saved.toUpperCase().trim();
      if (CURRENCY_CONFIG[upper]) return CURRENCY_CONFIG[upper];
      if (upper.includes('EUR')) return CURRENCY_CONFIG['EUR (€)'];
      if (upper.includes('GBP') || upper.includes('POUND')) return CURRENCY_CONFIG['GBP (£)'];
      if (upper.includes('CAD')) return CURRENCY_CONFIG['CAD ($)'];
      if (upper.includes('AUD')) return CURRENCY_CONFIG['AUD ($)'];
      if (upper.includes('USD')) return CURRENCY_CONFIG['USD ($)'];
    }
    const settingsStr = localStorage.getItem('primeroute_general_settings');
    if (settingsStr) {
      const parsed = JSON.parse(settingsStr);
      const c = parsed?.company?.currency;
      if (c) {
        if (CURRENCY_CONFIG[c]) return CURRENCY_CONFIG[c];
        const upper = c.toUpperCase().trim();
        if (CURRENCY_CONFIG[upper]) return CURRENCY_CONFIG[upper];
        if (upper.includes('EUR')) return CURRENCY_CONFIG['EUR (€)'];
        if (upper.includes('GBP') || upper.includes('POUND')) return CURRENCY_CONFIG['GBP (£)'];
        if (upper.includes('CAD')) return CURRENCY_CONFIG['CAD ($)'];
        if (upper.includes('AUD')) return CURRENCY_CONFIG['AUD ($)'];
        if (upper.includes('USD')) return CURRENCY_CONFIG['USD ($)'];
      }
    }
  } catch {
    // fallback if localStorage is inaccessible
  }
  return CURRENCY_CONFIG['USD ($)'];
};

export const getCurrencySymbol = () => {
  return getActiveCurrency().symbol;
};

export const formatCurrency = (amount, options = {}) => {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    const sym = getCurrencySymbol();
    return `${sym}0`;
  }
  const active = getActiveCurrency();
  const maxDigits = options.maximumFractionDigits !== undefined ? options.maximumFractionDigits : 0;
  const minDigits = options.minimumFractionDigits !== undefined ? options.minimumFractionDigits : 0;

  return new Intl.NumberFormat(active.locale, {
    style: 'currency',
    currency: active.code,
    maximumFractionDigits: maxDigits,
    minimumFractionDigits: minDigits,
    ...options
  }).format(Number(amount));
};

export const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return new Intl.NumberFormat('en-US').format(num);
};

export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'available':
    case 'active':
    case 'paid':
    case 'completed':
    case 'good':
    case 'verified':
    case 'approved':
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500'
      };
    case 'rented':
    case 'in progress':
    case 'upcoming':
    case 'pending':
    case 'pending review':
    case 'processing':
      return {
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500'
      };
    case 'maintenance':
    case 'scheduled':
    case 'expiring soon':
    case 'due soon':
    case 'warning':
    case 'draft':
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500'
      };
    case 'inactive':
    case 'unpaid':
    case 'overdue':
    case 'cancelled':
    case 'expired':
    case 'danger':
    case 'rejected':
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500'
      };
    default:
      return {
        bg: 'bg-slate-50 text-slate-700 border-slate-200',
        dot: 'bg-slate-400'
      };
  }
};

