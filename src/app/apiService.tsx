const API_BASE_URL = 'https://backendsupply.onrender.com/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get authorization header
  getAuthHeader() {
    const token = localStorage.getItem('access');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      // Handle 401 Unauthorized - token might be expired
      if (response.status === 401) {
        // Try to refresh token
        try {
          await this.refreshToken();
          // Retry the original request with new token
          const newConfig = {
            ...config,
            headers: {
              ...config.headers,
              ...this.getAuthHeader(),
            },
          };
          return await fetch(url, newConfig);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem('access');
          localStorage.removeItem('refresh');
          localStorage.removeItem('user_data');
          window.location.href = '/login';
          throw new Error('Session expired');
        }
      }

      return response;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Refresh access token
  async refreshToken() {
    const refreshToken = localStorage.getItem('refresh');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.baseURL}/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    localStorage.setItem('access', data.access);
    return data.access;
  }

  // HTTP methods
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Specific API endpoints
  async login(username, password) {
    return this.post('/token/', { username, password });
  }

  async getDashboard() {
    return this.get('/dashboard/');
  }

  async getNotifications() {
    return this.get('/notifications/');
  }

  async getStockOverview() {
    return this.get('/stock-overview/');
  }

  async getCategories() {
    return this.get('/categories/');
  }

  async createCategory(data) {
    return this.post('/categories/', data);
  }

  async getSuppliers() {
    return this.get('/suppliers/');
  }

  async createSupplier(data) {
    return this.post('/suppliers/', data);
  }

  async getPointsVente() {
    return this.get('/points-vente/');
  }

  async createPointVente(data) {
    return this.post('/points-vente/', data);
  }

  async getUsers() {
    return this.get('/users/');
  }

  async createUser(data) {
    return this.post('/users/', data);
  }

  async getProducts() {
    return this.get('/products/');
  }

  async createProduct(data) {
    return this.post('/products/', data);
  }

  async getProductVariants() {
    return this.get('/product-variants/');
  }

  async createProductVariant(data) {
    return this.post('/product-variants/', data);
  }

  async getStockMovements() {
    return this.get('/stock-movements/');
  }

  async createStockMovement(data) {
    return this.post('/stock-movements/', data);
  }

  async getOrders() {
    return this.get('/orders/');
  }

  async createOrder(data) {
    return this.post('/orders/', data);
  }

  async getDisputes() {
    return this.get('/disputes/');
  }

  async createDispute(data) {
    return this.post('/disputes/', data);
  }

  async getTokens() {
    return this.get('/tokens/');
  }

  async createToken(data) {
    return this.post('/tokens/', data);
  }

  async getTokenTransactions() {
    return this.get('/token-transactions/');
  }

  async createTokenTransaction(data) {
    return this.post('/token-transactions/', data);
  }

  async getRoles() {
    return this.get('/roles/');
  }

  async createRole(data) {
    return this.post('/roles/', data);
  }

  async getPermissions() {
    return this.get('/permissions/');
  }

  // Generic CRUD operations
  async getResource(endpoint, id = null) {
    const url = id ? `${endpoint}/${id}/` : `${endpoint}/`;
    return this.get(url);
  }

  async createResource(endpoint, data) {
    return this.post(`${endpoint}/`, data);
  }

  async updateResource(endpoint, id, data) {
    return this.put(`${endpoint}/${id}/`, data);
  }

  async patchResource(endpoint, id, data) {
    return this.patch(`${endpoint}/${id}/`, data);
  }

  async deleteResource(endpoint, id) {
    return this.delete(`${endpoint}/${id}/`);
  }
}

export const apiService = new ApiService();