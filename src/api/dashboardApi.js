const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const dashboardApi = {
  getDashboardData: async (filters = {}) => {
    const token = localStorage.getItem('primeroute_access_token');
    const params = new URLSearchParams();
    if (filters.dateRange) params.append('dateRange', filters.dateRange);
    if (filters.vehicleFilter) params.append('vehicleFilter', filters.vehicleFilter);
    if (filters.driverFilter) params.append('driverFilter', filters.driverFilter);
    if (filters.categoryFilter) params.append('categoryFilter', filters.categoryFilter);

    const queryString = params.toString();
    const url = `${API_BASE_URL}/dashboard${queryString ? `?${queryString}` : ''}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json?.error?.message || 'Failed to fetch dashboard metrics from live database');
    }
    return json.data;
  }
};

export default dashboardApi;
