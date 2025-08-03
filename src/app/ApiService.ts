const API_BASE_URL = 'https://backendsupply.onrender.com/api';

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get authorization header
  getAuthHeader(): Record<string, string> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access') : null;
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  // Generic request method
  async request(endpoint: string, options: RequestInit = {}, isFormData: boolean = false): Promise<Response> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
        ...this.getAuthHeader(),
        ...options.headers,
      },
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
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access');
            localStorage.removeItem('refresh');
            localStorage.removeItem('user_data');
            window.location.href = '/login';
          }
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
  async refreshToken(): Promise<string> {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh') : null;
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
    if (typeof window !== 'undefined') {
      localStorage.setItem('access', data.access);
    }
    return data.access;
  }

  // HTTP methods
  async get(endpoint: string, params: Record<string, any> = {}): Promise<Response> {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  async post(endpoint: string, data: any = {}, isFormData: boolean = false): Promise<Response> {
    return this.request(endpoint, {
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data),
    }, isFormData);
  }

  async put(endpoint: string, data: any = {}, isFormData: boolean = false): Promise<Response> {
    return this.request(endpoint, {
      method: 'PUT',
      body: isFormData ? data : JSON.stringify(data),
    }, isFormData);
  }

  async patch(endpoint: string, data: any = {}, isFormData: boolean = false): Promise<Response> {
    return this.request(endpoint, {
      method: 'PATCH',
      body: isFormData ? data : JSON.stringify(data),
    }, isFormData);
  }

  async delete(endpoint: string): Promise<Response> {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Specific API endpoints
  async login(username: string, password: string): Promise<Response> {
    return this.post('/token/', { username, password });
  }

  async getDashboard(): Promise<Response> {
    return this.get('/dashboard/');
  }

  async getNotifications(): Promise<Response> {
    return this.get('/notifications/');
  }

  async getStockOverview(): Promise<Response> {
    return this.get('/stock-overview/');
  }

  async getCategories(): Promise<Response> {
    return this.get('/categories/');
  }

  async createCategory(data: any): Promise<Response> {
    return this.post('/categories/', data);
  }

  async getSuppliers(): Promise<Response> {
    return this.get('/suppliers/');
  }

  async createSupplier(data: any): Promise<Response> {
    return this.post('/suppliers/', data);
  }

  async getPointsVente(): Promise<Response> {
    return this.get('/points-vente/');
  }

  async createPointVente(data: any): Promise<Response> {
    return this.post('/points-vente/', data);
  }

  async getUsers(): Promise<Response> {
    return this.get('/users/');
  }

  async createUser(data: any): Promise<Response> {
    return this.post('/users/', data);
  }

  async getProducts(): Promise<Response> {
    return this.get('/products/');
  }

  async createProduct(data: any): Promise<Response> {
    return this.post('/products/', data);
  }

  async getProductVariants(): Promise<Response> {
    return this.get('/product-variants/');
  }

  async createProductVariant(data: any): Promise<Response> {
    return this.post('/product-variants/', data);
  }

  async getStockMovements(): Promise<Response> {
    return this.get('/stock-movements/');
  }

  async createStockMovement(data: any): Promise<Response> {
    return this.post('/stock-movements/', data);
  }

  async getOrders(): Promise<Response> {
    return this.get('/orders/');
  }

  async createOrder(data: any): Promise<Response> {
    return this.post('/orders/', data);
  }

  async getDisputes(): Promise<Response> {
    return this.get('/disputes/');
  }

  async createDispute(data: any): Promise<Response> {
    return this.post('/disputes/', data);
  }

  async getTokens(): Promise<Response> {
    return this.get('/tokens/');
  }

  async createToken(data: any): Promise<Response> {
    return this.post('/tokens/', data);
  }

  async getTokenTransactions(): Promise<Response> {
    return this.get('/token-transactions/');
  }

  async createTokenTransaction(data: any): Promise<Response> {
    return this.post('/token-transactions/', data);
  }

  async getRoles(): Promise<Response> {
    return this.get('/roles/');
  }

  async createRole(data: any): Promise<Response> {
    return this.post('/roles/', data);
  }

  async getPermissions(): Promise<Response> {
    return this.get('/permissions/');
  }

  // Generic CRUD operations
  async getResource(endpoint: string, id: string | number | null = null): Promise<Response> {
    const url = id ? `${endpoint}/${id}/` : `${endpoint}/`;
    return this.get(url);
  }

  async createResource(endpoint: string, data: any, isFormData: boolean = false): Promise<Response> {
    return this.post(`${endpoint}/`, data, isFormData);
  }

  async updateResource(endpoint: string, id: string | number, data: any, isFormData: boolean = false): Promise<Response> {
    return this.put(`${endpoint}/${id}/`, data, isFormData);
  }

  async patchResource(endpoint: string, id: string | number, data: any, isFormData: boolean = false): Promise<Response> {
    return this.patch(`${endpoint}/${id}/`, data, isFormData);
  }

  async deleteResource(endpoint: string, id: string | number): Promise<Response> {
    return this.delete(`${endpoint}/${id}/`);
  }
}

export const apiService = new ApiService();
export default ApiService;
