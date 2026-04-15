const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.lanfialink.com/api';

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // ── Auth helpers ──────────────────────────────────────────────────────────
  getAuthHeader(): Record<string, string> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // ── Refresh token ─────────────────────────────────────────────────────────
  async refreshToken(): Promise<string> {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh') : null;
    if (!refreshToken) throw new Error('No refresh token available');

    const response = await fetch(`${this.baseURL}/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) throw new Error('Token refresh failed');

    const data = await response.json();
    if (typeof window !== 'undefined') localStorage.setItem('access', data.access);
    return data.access;
  }

  // ── Request générique avec retry 401 ─────────────────────────────────────
  async request(
    endpoint: string,
    options: RequestInit = {},
    isFormData = false
  ): Promise<Response> {
    const url = `${this.baseURL}${endpoint}`;

    const buildConfig = (): RequestInit => ({
      ...options,
      headers: {
        ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
        ...this.getAuthHeader(),
        ...(options.headers || {}),
      },
    });

    try {
      let response = await fetch(url, buildConfig());

      if (response.status === 401) {
        try {
          await this.refreshToken();
          response = await fetch(url, buildConfig());
        } catch {
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

  // ── HTTP methods ──────────────────────────────────────────────────────────
  async get(endpoint: string, params: Record<string, any> = {}): Promise<Response> {
    const cleaned = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    const queryString = new URLSearchParams(cleaned).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  async post(endpoint: string, data: any = {}, isFormData = false): Promise<Response> {
    return this.request(
      endpoint,
      { method: 'POST', body: isFormData ? data : JSON.stringify(data) },
      isFormData
    );
  }

  async put(endpoint: string, data: any = {}, isFormData = false): Promise<Response> {
    return this.request(
      endpoint,
      { method: 'PUT', body: isFormData ? data : JSON.stringify(data) },
      isFormData
    );
  }

  async patch(endpoint: string, data: any = {}, isFormData = false): Promise<Response> {
    return this.request(
      endpoint,
      { method: 'PATCH', body: isFormData ? data : JSON.stringify(data) },
      isFormData
    );
  }

  async delete(endpoint: string): Promise<Response> {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // AUTHENTIFICATION
  // ══════════════════════════════════════════════════════════════════════════
  async login(username: string, password: string): Promise<Response> {
    return this.post('/token/', { username, password });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DASHBOARD & NOTIFICATIONS
  // ══════════════════════════════════════════════════════════════════════════
  async getDashboard(): Promise<Response> {
    return this.get('/dashboard/');
  }

  async getNotifications(): Promise<Response> {
    return this.get('/notifications/');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STATISTIQUES & RAPPORTS
  // ══════════════════════════════════════════════════════════════════════════
  async getDashboardSummary(filters?: any): Promise<Response> {
    return this.get('/statistics/dashboard_summary/', filters);
  }

  async getPOSStatistics(filters?: any): Promise<Response> {
    return this.get('/statistics/points_of_sale_stats/', filters);
  }

  async getMobileVendorStatistics(period = '30', filters?: any): Promise<Response> {
    return this.get('/statistics/mobile_vendors_stats/', { period, ...filters });
  }

  async getProductStatistics(period = '30', filters?: any): Promise<Response> {
    return this.get('/statistics/products_stats/', { period, ...filters });
  }

  async getPurchaseStatistics(period = '30', filters?: any): Promise<Response> {
    return this.get('/statistics/purchases_stats/', { period, ...filters });
  }

  async getSalesTimeSeries(period = 'month', groupBy = 'day', filters?: any): Promise<Response> {
    return this.get('/statistics/sales_timeseries/', { period, group_by: groupBy, ...filters });
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

  async getSalesChart(filters?: any): Promise<Response> {
    return this.get('/statistics/sales_chart/', filters);
  }

  async getPerformanceChart(chartType = 'vendors', filters?: any): Promise<Response> {
    return this.get('/statistics/performance_chart/', { chart_type: chartType, ...filters });
  }

  async exportData(exportData: {
    format: 'csv' | 'excel' | 'pdf';
    report_type: string;
    filters?: any;
    columns?: string[];
  }): Promise<Response> {
    return this.post('/statistics/export_data/', exportData);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RAPPORTS
  // ══════════════════════════════════════════════════════════════════════════
  async getSalesReport(params: Record<string, any> = {}): Promise<Response> {
    return this.get('/reports/sales_report/', params);
  }

  async getInventoryReport(): Promise<Response> {
    return this.get('/reports/inventory_report/');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STOCK & INVENTORY
  // ══════════════════════════════════════════════════════════════════════════
  async getStockOverview(): Promise<Response> {
    return this.get('/stock-overview/');
  }

  async getStockMovements(): Promise<Response> {
    return this.get('/stock-movements/');
  }

  async createStockMovement(data: any): Promise<Response> {
    return this.post('/stock-movements/', data);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CATÉGORIES
  // ══════════════════════════════════════════════════════════════════════════
  async getCategories(): Promise<Response> { return this.get('/categories/'); }
  async createCategory(data: any): Promise<Response> { return this.post('/categories/', data); }
  async updateCategory(id: number, data: any): Promise<Response> { return this.patch(`/categories/${id}/`, data); }
  async deleteCategory(id: number): Promise<Response> { return this.delete(`/categories/${id}/`); }

  // ══════════════════════════════════════════════════════════════════════════
  // FOURNISSEURS
  // ══════════════════════════════════════════════════════════════════════════
  async getSuppliers(): Promise<Response> { return this.get('/suppliers/'); }
  async createSupplier(data: any, isFormData = false): Promise<Response> { return this.post('/suppliers/', data, isFormData); }
  async updateSupplier(id: number, data: any, isFormData = false): Promise<Response> { return this.patch(`/suppliers/${id}/`, data, isFormData); }
  async deleteSupplier(id: number): Promise<Response> { return this.delete(`/suppliers/${id}/`); }

  // ══════════════════════════════════════════════════════════════════════════
  // POINTS DE VENTE — CRUD CLASSIQUE
  // ══════════════════════════════════════════════════════════════════════════
  async getPointsVente(): Promise<Response> {
    return this.get('/points-vente/');
  }

  async createPointVente(data: any): Promise<Response> {
    return this.post('/points-vente/', data);
  }

  async updatePointVente(posId: number, data: any): Promise<Response> {
    return this.patch(`/points-vente/${posId}/`, data);
  }

  async deletePointVente(posId: number): Promise<Response> {
    return this.delete(`/points-vente/${posId}/`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // POINTS DE VENTE — DASHBOARD ANALYTIQUE
  // ══════════════════════════════════════════════════════════════════════════
  async getPointsVenteAnalytics(params: Record<string, any> = {}): Promise<Response> {
    return this.get('/points-of-vente/', params);
  }

  async getPointVenteDetail(id: number): Promise<Response> {
    return this.get(`/points-of-vente/${id}/`);
  }

  async createPointVenteFormData(data: FormData): Promise<Response> {
    return this.post('/points-of-vente/', data, true);
  }

  async patchPointVente(id: number, data: FormData): Promise<Response> {
    return this.patch(`/points-of-vente/${id}/`, data, true);
  }

  async deletePointVenteById(id: number): Promise<Response> {
    return this.delete(`/points-of-vente/${id}/`);
  }

  async getFilterOptions(): Promise<Response> {
    return this.get('/points-of-vente/filter-options/');
  }

  async getAgentsPerformance(): Promise<Response> {
    return this.get('/points-of-vente/agents-performance/');
  }

  async getPointsVenteStats(): Promise<Response> {
    return this.get('/points-of-vente/stats/');
  }

  async addPhotosToPointVente(posId: number, formData: FormData): Promise<Response> {
    return this.post(`/points-of-vente/${posId}/photos/`, formData, true);
  }

  async deletePhotoFromPointVente(posId: number, photoId: number): Promise<Response> {
    return this.delete(`/points-of-vente/${posId}/photos/${photoId}/`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // UTILISATEURS
  // ⚠️ FIX PRINCIPAL : updateUser utilise désormais PATCH (partial update)
  //    et non PUT (full replace) — évite les erreurs de champs requis manquants
  // ══════════════════════════════════════════════════════════════════════════
  async getUsers(): Promise<Response> { return this.get('/users/'); }
  async createUser(data: any): Promise<Response> { return this.post('/users/', data); }

  /**
   * Mise à jour partielle d'un utilisateur.
   * PATCH au lieu de PUT : seuls les champs envoyés sont modifiés côté Django.
   * Cela évite les ValidationError sur les champs non fournis (ex: password en edit).
   */
  async updateUser(id: number, data: any): Promise<Response> {
    return this.patch(`/users/${id}/`, data);   // ← PATCH, plus PUT
  }

  async patchUser(id: number, data: any): Promise<Response> {
    return this.patch(`/users/${id}/`, data);
  }

  async deleteUser(id: number): Promise<Response> { return this.delete(`/users/${id}/`); }

  // ══════════════════════════════════════════════════════════════════════════
  // PRODUITS & VARIANTES
  // ══════════════════════════════════════════════════════════════════════════
  async getProducts(): Promise<Response> { return this.get('/products/'); }
  async createProduct(data: any): Promise<Response> { return this.post('/products/', data); }
  async updateProduct(id: number, data: any): Promise<Response> { return this.patch(`/products/${id}/`, data); }
  async deleteProduct(id: number): Promise<Response> { return this.delete(`/products/${id}/`); }

  async getProductVariants(): Promise<Response> { return this.get('/product-variants/'); }
  async createProductVariant(data: any): Promise<Response> { return this.post('/product-variants/', data); }
  async updateProductVariant(id: number, data: any): Promise<Response> { return this.patch(`/product-variants/${id}/`, data); }
  async deleteProductVariant(id: number): Promise<Response> { return this.delete(`/product-variants/${id}/`); }

  // ══════════════════════════════════════════════════════════════════════════
  // COMMANDES
  // ══════════════════════════════════════════════════════════════════════════
  async getOrders(): Promise<Response> { return this.get('/orders/'); }
  async createOrder(data: any): Promise<Response> { return this.post('/orders/', data); }
  async updateOrder(id: number, data: any): Promise<Response> { return this.patch(`/orders/${id}/`, data); }
  async deleteOrder(id: number): Promise<Response> { return this.delete(`/orders/${id}/`); }

  // ══════════════════════════════════════════════════════════════════════════
  // VENDEURS AMBULANTS & ACTIVITÉS
  // ══════════════════════════════════════════════════════════════════════════
  async getMobileVendors(): Promise<Response> { return this.get('/mobile-vendors/'); }
  async createMobileVendor(data: any): Promise<Response> { return this.post('/mobile-vendors/', data); }
  async updateMobileVendor(id: number, data: any): Promise<Response> { return this.patch(`/mobile-vendors/${id}/`, data); }
  async deleteMobileVendor(id: number): Promise<Response> { return this.delete(`/mobile-vendors/${id}/`); }

  async getVendorActivities(): Promise<Response> { return this.get('/vendor-activities/'); }
  async createVendorActivity(data: any): Promise<Response> { return this.post('/vendor-activities/', data); }
  async updateVendorActivity(id: number, data: any): Promise<Response> { return this.patch(`/vendor-activities/${id}/`, data); }
  async deleteVendorActivity(id: number): Promise<Response> { return this.delete(`/vendor-activities/${id}/`); }

  // ══════════════════════════════════════════════════════════════════════════
  // ACHATS & VENTES
  // ══════════════════════════════════════════════════════════════════════════
  async getPurchases(): Promise<Response> { return this.get('/purchases/'); }
  async createPurchase(data: any): Promise<Response> { return this.post('/purchases/', data); }
  async updatePurchase(id: number, data: any): Promise<Response> { return this.patch(`/purchases/${id}/`, data); }
  async deletePurchase(id: number): Promise<Response> { return this.delete(`/purchases/${id}/`); }

  async getSales(): Promise<Response> { return this.get('/sales/'); }
  async createSale(data: any): Promise<Response> { return this.post('/sales/', data); }
  async updateSale(id: number, data: any): Promise<Response> { return this.patch(`/sales/${id}/`, data); }
  async deleteSale(id: number): Promise<Response> { return this.delete(`/sales/${id}/`); }

  // ══════════════════════════════════════════════════════════════════════════
  // LITIGES
  // ══════════════════════════════════════════════════════════════════════════
  async getDisputes(): Promise<Response> { return this.get('/disputes/'); }
  async createDispute(data: any): Promise<Response> { return this.post('/disputes/', data); }
  async updateDispute(id: number, data: any): Promise<Response> { return this.patch(`/disputes/${id}/`, data); }
  async deleteDispute(id: number): Promise<Response> { return this.delete(`/disputes/${id}/`); }

  // ══════════════════════════════════════════════════════════════════════════
  // TOKENS & TRANSACTIONS
  // ══════════════════════════════════════════════════════════════════════════
  async getTokens(): Promise<Response> { return this.get('/tokens/'); }
  async createToken(data: any): Promise<Response> { return this.post('/tokens/', data); }
  async updateToken(id: number, data: any): Promise<Response> { return this.patch(`/tokens/${id}/`, data); }
  async deleteToken(id: number): Promise<Response> { return this.delete(`/tokens/${id}/`); }

  async getTokenTransactions(): Promise<Response> { return this.get('/token-transactions/'); }
  async createTokenTransaction(data: any): Promise<Response> { return this.post('/token-transactions/', data); }
  async updateTokenTransaction(id: number, data: any): Promise<Response> { return this.patch(`/token-transactions/${id}/`, data); }
  async deleteTokenTransaction(id: number): Promise<Response> { return this.delete(`/token-transactions/${id}/`); }

  // ══════════════════════════════════════════════════════════════════════════
  // RÔLES & PERMISSIONS
  // ══════════════════════════════════════════════════════════════════════════
  async getRoles(): Promise<Response> { return this.get('/roles/'); }
  async createRole(data: any): Promise<Response> { return this.post('/roles/', data); }
  async updateRole(id: number, data: any): Promise<Response> { return this.patch(`/roles/${id}/`, data); }
  async deleteRole(id: number): Promise<Response> { return this.delete(`/roles/${id}/`); }

  async getPermissions(): Promise<Response> { return this.get('/permissions/'); }
  async createPermission(data: any): Promise<Response> { return this.post('/permissions/', data); }
  async updatePermission(id: number, data: any): Promise<Response> { return this.patch(`/permissions/${id}/`, data); }
  async deletePermission(id: number): Promise<Response> { return this.delete(`/permissions/${id}/`); }

  // ══════════════════════════════════════════════════════════════════════════
  // PUSHCART
  // ══════════════════════════════════════════════════════════════════════════
  async getPushcarts(): Promise<Response> { return this.get('/pushcarts/'); }
  async createPushcart(data: any): Promise<Response> { return this.post('/pushcarts/', data); }
  async updatePushcart(id: number, data: any): Promise<Response> { return this.patch(`/pushcarts/${id}/`, data); }
  async deletePushcart(id: number): Promise<Response> { return this.delete(`/pushcarts/${id}/`); }

  // ══════════════════════════════════════════════════════════════════════════
  // PROFILS UTILISATEURS
  // ══════════════════════════════════════════════════════════════════════════
  async getUserProfiles(): Promise<Response> { return this.get('/user-profiles/'); }
  async createUserProfile(data: any): Promise<Response> { return this.post('/user-profiles/', data); }
  async updateUserProfile(id: number, data: any): Promise<Response> { return this.patch(`/user-profiles/${id}/`, data); }
  async deleteUserProfile(id: number): Promise<Response> { return this.delete(`/user-profiles/${id}/`); }

  // ══════════════════════════════════════════════════════════════════════════
  // FORMATS PRODUITS
  // ══════════════════════════════════════════════════════════════════════════
  async getProductFormats(): Promise<Response> { return this.get('/product-formats/'); }
  async createProductFormat(data: any): Promise<Response> { return this.post('/product-formats/', data); }
  async updateProductFormat(id: number, data: any): Promise<Response> { return this.patch(`/product-formats/${id}/`, data); }
  async deleteProductFormat(id: number): Promise<Response> { return this.delete(`/product-formats/${id}/`); }

  // ══════════════════════════════════════════════════════════════════════════
  // OPÉRATIONS GÉNÉRIQUES CRUD
  // ══════════════════════════════════════════════════════════════════════════
  async getResource(endpoint: string, id: string | number | null = null): Promise<Response> {
    const url = id ? `${endpoint}/${id}/` : `${endpoint}/`;
    return this.get(url);
  }

  async createResource(endpoint: string, data: any, isFormData = false): Promise<Response> {
    return this.post(`${endpoint}/`, data, isFormData);
  }

  async updateResource(endpoint: string, id: string | number, data: any, isFormData = false): Promise<Response> {
    // ⚠️ FIX : patch au lieu de put pour la cohérence globale
    return this.patch(`${endpoint}/${id}/`, data, isFormData);
  }

  async patchResource(endpoint: string, id: string | number, data: any, isFormData = false): Promise<Response> {
    return this.patch(`${endpoint}/${id}/`, data, isFormData);
  }

  async deleteResource(endpoint: string, id: string | number): Promise<Response> {
    return this.delete(`${endpoint}/${id}/`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // UTILITAIRES
  // ══════════════════════════════════════════════════════════════════════════
  async uploadFile(file: File, endpoint = '/upload/'): Promise<Response> {
    const formData = new FormData();
    formData.append('file', file);
    return this.post(endpoint, formData, true);
  }

  async bulkUpload(files: File[], endpoint = '/bulk-upload/'): Promise<Response> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
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