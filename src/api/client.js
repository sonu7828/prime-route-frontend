// Simulated API client with configurable latency and mock persistence
export const SIMULATED_LATENCY_MS = 120;

export const delay = (ms = SIMULATED_LATENCY_MS) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export class ApiError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Persistent cache for mock data across user reloads using localStorage
const memoryCache = new Map();

export const getCachedOrInit = (key, initialFactory) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = window.localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        memoryCache.set(key, parsed);
        return parsed;
      }
    } catch (e) {}
  }
  if (!memoryCache.has(key)) {
    memoryCache.set(key, initialFactory());
  }
  const data = memoryCache.get(key);
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {}
  }
  return data;
};

export const setCached = (key, data) => {
  memoryCache.set(key, data);
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {}
  }
};

