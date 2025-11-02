// ApiService.ts
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

  // ==================== AUTHENTICATION ====================
  async login(username: string, password: string): Promise<Response> {
    return this.post('/token/', { username, password });
  }

  // ==================== DASHBOARD ====================
  async getDashboard(): Promise<Response> {
    return this.get('/dashboard/');
  }

  async getNotifications(): Promise<Response> {
    return this.get('/notifications/');
  }

  // ==================== STATISTIQUES & RAPPORTS ====================
  async getDashboardSummary(filters?: any): Promise<Response> {
    return this.get('/statistics/dashboard_summary/', filters);
  }

  async getPOSStatistics(filters?: any): Promise<Response> {
    return this.get('/statistics/points_of_sale_stats/', filters);
  }

  async getMobileVendorStatistics(period: string = '30', filters?: any): Promise<Response> {
    const params = { period, ...filters };
    return this.get('/statistics/mobile_vendors_stats/', params);
  }

  async getProductStatistics(period: string = '30', filters?: any): Promise<Response> {
    const params = { period, ...filters };
    return this.get('/statistics/products_stats/', params);
  }

  async getPurchaseStatistics(period: string = '30', filters?: any): Promise<Response> {
    const params = { period, ...filters };
    return this.get('/statistics/purchases_stats/', params);
  }

  async getSalesTimeSeries(period: string = 'month', groupBy: string = 'day', filters?: any): Promise<Response> {
    const params = { period, group_by: groupBy, ...filters };
    return this.get('/statistics/sales_timeseries/', params);
  }

  async getPerformanceMetrics(): Promise<Response> {
    return this.get('/statistics/performance_metrics/');
  }

  async getZoneStatistics(filters?: any): Promise<Response> {
    return this.get('/statistics/zone_stats/', filters);
  }

  async getRevenueAnalytics(filters?: any): Promise<Response> {
    return this.get('/statistics/revenue_analytics/', filters);
  }

  // ==================== NOUVEAUX ENDPOINTS GRAPHIQUES ====================
  async getSalesChart(filters?: any): Promise<Response> {
    return this.get('/statistics/sales_chart/', filters);
  }

  async getPerformanceChart(chartType: string = 'vendors', filters?: any): Promise<Response> {
    const params = { chart_type: chartType, ...filters };
    return this.get('/statistics/performance_chart/', params);
  }

  // ==================== NOUVEAUX ENDPOINTS EXPORTS ====================
  async exportData(exportData: {
    format: 'csv' | 'excel' | 'pdf';
    report_type: string;
    filters?: any;
    columns?: string[];
  }): Promise<Response> {
    return this.post('/statistics/export_data/', exportData);
  }

  // ==================== RAPPORTS ====================
  async getSalesReport(params: Record<string, any> = {}): Promise<Response> {
    return this.get('/reports/sales_report/', params);
  }

  async getInventoryReport(): Promise<Response> {
    return this.get('/reports/inventory_report/');
  }

  // ==================== STOCK & INVENTORY ====================
  async getStockOverview(): Promise<Response> {
    return this.get('/stock-overview/');
  }

  async getStockMovements(): Promise<Response> {
    return this.get('/stock-movements/');
  }

  async createStockMovement(data: any): Promise<Response> {
    return this.post('/stock-movements/', data);
  }

  // ==================== CATEGORIES ====================
  async getCategories(): Promise<Response> {
    return this.get('/categories/');
  }

  async createCategory(data: any): Promise<Response> {
    return this.post('/categories/', data);
  }

  async updateCategory(categoryId: number, data: any): Promise<Response> {
    return this.put(`/categories/${categoryId}/`, data);
  }

  async deleteCategory(categoryId: number): Promise<Response> {
    return this.delete(`/categories/${categoryId}/`);
  }

  // ==================== FOURNISSEURS ====================
  async getSuppliers(): Promise<Response> {
    return this.get('/suppliers/');
  }

  async createSupplier(data: any, isFormData: boolean = false): Promise<Response> {
    return this.post('/suppliers/', data, isFormData);
  }

  async updateSupplier(supplierId: number, data: any, isFormData: boolean = false): Promise<Response> {
    return this.put(`/suppliers/${supplierId}/`, data, isFormData);
  }

  async deleteSupplier(supplierId: number): Promise<Response> {
    return this.delete(`/suppliers/${supplierId}/`);
  }

  // ==================== POINTS DE VENTE ====================
  async getPointsVente(): Promise<Response> {
    return this.get('/points-vente/');
  }

  async createPointVente(data: any): Promise<Response> {
    return this.post('/points-vente/', data);
  }

  async updatePointVente(posId: number, data: any): Promise<Response> {
    return this.put(`/points-vente/${posId}/`, data);
  }

  async deletePointVente(posId: number): Promise<Response> {
    return this.delete(`/points-vente/${posId}/`);
  }

  // ==================== UTILISATEURS ====================
  async getUsers(): Promise<Response> {
    return this.get('/users/');
  }

  async createUser(data: any): Promise<Response> {
    return this.post('/users/', data);
  }

  async updateUser(userId: number, data: any): Promise<Response> {
    return this.put(`/users/${userId}/`, data);
  }

  async patchUser(userId: number, data: any): Promise<Response> {
    return this.patch(`/users/${userId}/`, data);
  }

  async deleteUser(userId: number): Promise<Response> {
    return this.delete(`/users/${userId}/`);
  }

  // ==================== PRODUITS ====================
  async getProducts(): Promise<Response> {
    return this.get('/products/');
  }

  async createProduct(data: any): Promise<Response> {
    return this.post('/products/', data);
  }

  async updateProduct(productId: number, data: any): Promise<Response> {
    return this.put(`/products/${productId}/`, data);
  }

  async deleteProduct(productId: number): Promise<Response> {
    return this.delete(`/products/${productId}/`);
  }

  // ==================== VARIANTES DE PRODUITS ====================
  async getProductVariants(): Promise<Response> {
    return this.get('/product-variants/');
  }

  async createProductVariant(data: any): Promise<Response> {
    return this.post('/product-variants/', data);
  }

  async updateProductVariant(variantId: number, data: any): Promise<Response> {
    return this.put(`/product-variants/${variantId}/`, data);
  }

  async deleteProductVariant(variantId: number): Promise<Response> {
    return this.delete(`/product-variants/${variantId}/`);
  }

  // ==================== COMMANDES ====================
  async getOrders(): Promise<Response> {
    return this.get('/orders/');
  }

  async createOrder(data: any): Promise<Response> {
    return this.post('/orders/', data);
  }

  async updateOrder(orderId: number, data: any): Promise<Response> {
    return this.put(`/orders/${orderId}/`, data);
  }

  async deleteOrder(orderId: number): Promise<Response> {
    return this.delete(`/orders/${orderId}/`);
  }

  // ==================== VENDEURS AMBULANTS ====================
  async getMobileVendors(): Promise<Response> {
    return this.get('/mobile-vendors/');
  }

  async createMobileVendor(data: any): Promise<Response> {
    return this.post('/mobile-vendors/', data);
  }

  async updateMobileVendor(vendorId: number, data: any): Promise<Response> {
    return this.put(`/mobile-vendors/${vendorId}/`, data);
  }

  async deleteMobileVendor(vendorId: number): Promise<Response> {
    return this.delete(`/mobile-vendors/${vendorId}/`);
  }

  // ==================== ACTIVITÉS VENDEURS ====================
  async getVendorActivities(): Promise<Response> {
    return this.get('/vendor-activities/');
  }

  async createVendorActivity(data: any): Promise<Response> {
    return this.post('/vendor-activities/', data);
  }

  async updateVendorActivity(activityId: number, data: any): Promise<Response> {
    return this.put(`/vendor-activities/${activityId}/`, data);
  }

  async deleteVendorActivity(activityId: number): Promise<Response> {
    return this.delete(`/vendor-activities/${activityId}/`);
  }

  // ==================== ACHATS ====================
  async getPurchases(): Promise<Response> {
    return this.get('/purchases/');
  }

  async createPurchase(data: any): Promise<Response> {
    return this.post('/purchases/', data);
  }

  async updatePurchase(purchaseId: number, data: any): Promise<Response> {
    return this.put(`/purchases/${purchaseId}/`, data);
  }

  async deletePurchase(purchaseId: number): Promise<Response> {
    return this.delete(`/purchases/${purchaseId}/`);
  }

  // ==================== VENTES ====================
  async getSales(): Promise<Response> {
    return this.get('/sales/');
  }

  async createSale(data: any): Promise<Response> {
    return this.post('/sales/', data);
  }

  async updateSale(saleId: number, data: any): Promise<Response> {
    return this.put(`/sales/${saleId}/`, data);
  }

  async deleteSale(saleId: number): Promise<Response> {
    return this.delete(`/sales/${saleId}/`);
  }

  // ==================== LITIGES ====================
  async getDisputes(): Promise<Response> {
    return this.get('/disputes/');
  }

  async createDispute(data: any): Promise<Response> {
    return this.post('/disputes/', data);
  }

  async updateDispute(disputeId: number, data: any): Promise<Response> {
    return this.put(`/disputes/${disputeId}/`, data);
  }

  async deleteDispute(disputeId: number): Promise<Response> {
    return this.delete(`/disputes/${disputeId}/`);
  }

  // ==================== TOKENS ====================
  async getTokens(): Promise<Response> {
    return this.get('/tokens/');
  }

  async createToken(data: any): Promise<Response> {
    return this.post('/tokens/', data);
  }

  async updateToken(tokenId: number, data: any): Promise<Response> {
    return this.put(`/tokens/${tokenId}/`, data);
  }

  async deleteToken(tokenId: number): Promise<Response> {
    return this.delete(`/tokens/${tokenId}/`);
  }

  // ==================== TRANSACTIONS TOKENS ====================
  async getTokenTransactions(): Promise<Response> {
    return this.get('/token-transactions/');
  }

  async createTokenTransaction(data: any): Promise<Response> {
    return this.post('/token-transactions/', data);
  }

  async updateTokenTransaction(transactionId: number, data: any): Promise<Response> {
    return this.put(`/token-transactions/${transactionId}/`, data);
  }

  async deleteTokenTransaction(transactionId: number): Promise<Response> {
    return this.delete(`/token-transactions/${transactionId}/`);
  }

  // ==================== RÔLES ====================
  async getRoles(): Promise<Response> {
    return this.get('/roles/');
  }

  async createRole(data: any): Promise<Response> {
    return this.post('/roles/', data);
  }

  async updateRole(roleId: number, data: any): Promise<Response> {
    return this.put(`/roles/${roleId}/`, data);
  }

  async deleteRole(roleId: number): Promise<Response> {
    return this.delete(`/roles/${roleId}/`);
  }

  // ==================== PERMISSIONS ====================
  async getPermissions(): Promise<Response> {
    return this.get('/permissions/');
  }

  async createPermission(data: any): Promise<Response> {
    return this.post('/permissions/', data);
  }

  async updatePermission(permissionId: number, data: any): Promise<Response> {
    return this.put(`/permissions/${permissionId}/`, data);
  }

  async deletePermission(permissionId: number): Promise<Response> {
    return this.delete(`/permissions/${permissionId}/`);
  }

  // ==================== PUSHCART ====================
  async getPushcarts(): Promise<Response> {
    return this.get('/pushcarts/');
  }

  async createPushcart(data: any): Promise<Response> {
    return this.post('/pushcarts/', data);
  }

  async updatePushcart(pushcartId: number, data: any): Promise<Response> {
    return this.put(`/pushcarts/${pushcartId}/`, data);
  }

  async deletePushcart(pushcartId: number): Promise<Response> {
    return this.delete(`/pushcarts/${pushcartId}/`);
  }

  // ==================== PROFILS UTILISATEURS ====================
  async getUserProfiles(): Promise<Response> {
    return this.get('/user-profiles/');
  }

  async createUserProfile(data: any): Promise<Response> {
    return this.post('/user-profiles/', data);
  }

  async updateUserProfile(profileId: number, data: any): Promise<Response> {
    return this.put(`/user-profiles/${profileId}/`, data);
  }

  async deleteUserProfile(profileId: number): Promise<Response> {
    return this.delete(`/user-profiles/${profileId}/`);
  }

  // ==================== FORMATS PRODUITS ====================
  async getProductFormats(): Promise<Response> {
    return this.get('/product-formats/');
  }

  async createProductFormat(data: any): Promise<Response> {
    return this.post('/product-formats/', data);
  }

  async updateProductFormat(formatId: number, data: any): Promise<Response> {
    return this.put(`/product-formats/${formatId}/`, data);
  }

  async deleteProductFormat(formatId: number): Promise<Response> {
    return this.delete(`/product-formats/${formatId}/`);
  }

  // ==================== OPÉRATIONS GÉNÉRIQUES CRUD ====================
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

  // ==================== UTILITAIRES ====================
  async uploadFile(file: File, endpoint: string = '/upload/'): Promise<Response> {
    const formData = new FormData();
    formData.append('file', file);
    return this.post(endpoint, formData, true);
  }

  async bulkUpload(files: File[], endpoint: string = '/bulk-upload/'): Promise<Response> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    return this.post(endpoint, formData, true);
  }

  async exportDataOld(endpoint: string, params: Record<string, any> = {}): Promise<Response> {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.get(url);
  }
}

export const apiService = new ApiService();
export default ApiService;