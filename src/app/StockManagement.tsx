"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, Plus, Search, Filter, Edit, Trash2, 
  AlertTriangle, TrendingUp, TrendingDown, 
  Eye, Download, Upload, RefreshCw, Settings,
  BarChart3, ShoppingCart, Truck, Clock, X,
  Save, User, MapPin, Calendar, DollarSign
} from 'lucide-react';
import { apiService } from './ApiService';

interface Product {
  id: string;
  name: string;
  category: { id: number; name: string };
  sku: string;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  price: number;
  supplier: { id: number; name: string };
  point_of_sale: { id: string; name: string };
  description?: string;
  status: 'en_stock' | 'stock_faible' | 'rupture' | 'surstockage';
  last_updated: string;
  variants?: ProductVariant[];
  images?: ProductImage[];
}

interface ProductVariant {
  id: string;
  name: string;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  price: number;
  barcode: string;
}

interface ProductImage {
  id: string;
  url: string;
  is_featured: boolean;
  caption?: string;
}

interface StockMovement {
  id: string;
  product: { id: string; name: string };
  product_variant?: { id: string; name: string };
  type: 'entree' | 'sortie' | 'ajustement';
  quantity: number;
  date: string;
  reason: string;
  user: { username: string };
}

interface NewProduct {
  name: string;
  category_id: number | '';
  sku: string;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  price: number;
  supplier_id: number | '';
  point_of_sale_id: string;
  description: string;
  variants?: Partial<ProductVariant>[];
}

interface NewMovement {
  product_id: string;
  product_variant_id?: string;
  type: 'entree' | 'sortie' | 'ajustement' | '';
  quantity: number;
  reason: string;
}

interface Category {
  id: number;
  name: string;
}

interface Supplier {
  id: number;
  name: string;
}

interface PointOfSale {
  id: string;
  name: string;
}

const StockManagement = () => {
  const [activeView, setActiveView] = useState<'overview' | 'products' | 'movements' | 'analytics'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [pointsOfSale, setPointsOfSale] = useState<PointOfSale[]>([]);
  const [overviewData, setOverviewData] = useState({
    total_products: 0,
    stock_value: 0,
    alert_count: 0,
    today_movements: 0,
    critical_products: [] as Product[]
  });
  const [newProduct, setNewProduct] = useState<NewProduct>({
    name: '',
    category_id: '',
    sku: '',
    current_stock: 0,
    min_stock: 0,
    max_stock: 0,
    price: 0,
    supplier_id: '',
    point_of_sale_id: '',
    description: ''
  });
  const [newMovement, setNewMovement] = useState<NewMovement>({
    product_id: '',
    type: '',
    quantity: 0,
    reason: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [
        overviewResponse, 
        productsResponse, 
        movementsResponse,
        categoriesResponse,
        suppliersResponse,
        posResponse
      ] = await Promise.all([
        apiService.get('/stock-overview/'),
        apiService.get('/products/?include_variants=true'),
        apiService.get('/stock-movements/'),
        apiService.get('/categories/'),
        apiService.get('/suppliers/'),
        apiService.get('/points-vente/')
      ]);

      // Map categories to ensure correct structure
      const mappedCategories: Category[] = Array.isArray(categoriesResponse)
        ? categoriesResponse.map((cat: any) => ({
            id: cat.id,
            name: cat.name
          }))
        : [];

      // Map suppliers to ensure correct structure
      const mappedSuppliers: Supplier[] = Array.isArray(suppliersResponse)
        ? suppliersResponse.map((sup: any) => ({
            id: sup.id,
            name: sup.name
          }))
        : [];

      setOverviewData({
        total_products: overviewResponse?.cumulative?.total_products || 0,
        stock_value: overviewResponse?.cumulative?.stock_value || 0,
        alert_count: overviewResponse?.cumulative?.alert_count || 0,
        today_movements: overviewResponse?.cumulative?.today_movements || 0,
        critical_products: Array.isArray(overviewResponse?.cumulative?.critical_products)
          ? overviewResponse.cumulative.critical_products
          : []
      });

      setProducts(Array.isArray(productsResponse) ? productsResponse : []);
      setMovements(Array.isArray(movementsResponse) ? movementsResponse : []);
      setCategories(mappedCategories);
      setSuppliers(mappedSuppliers);
      setPointsOfSale(Array.isArray(posResponse) ? posResponse : []);

    } catch (error: any) {
      setError(error.message || 'Erreur lors du chargement des données');
      setProducts([]);
      setMovements([]);
      setCategories([]);
      setSuppliers([]);
      setPointsOfSale([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Product status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en_stock': return 'bg-green-100 text-green-800 border-green-200';
      case 'stock_faible': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'rupture': return 'bg-red-100 text-red-800 border-red-200';
      case 'surstockage': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Movement icon
  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'entree': return <TrendingUp className="text-green-600" size={16} />;
      case 'sortie': return <TrendingDown className="text-red-600" size={16} />;
      case 'ajustement': return <RefreshCw className="text-blue-600" size={16} />;
      default: return <Package size={16} />;
    }
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const nameMatch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
      const skuMatch = product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
      const categoryMatch = selectedCategory === 'all' || product.category?.name === selectedCategory;
      return (nameMatch || skuMatch) && categoryMatch;
    });
  }, [products, searchTerm, selectedCategory]);

  // Add new product
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const createdProduct = await apiService.post('/products/', {
        ...newProduct,
        point_of_sale_id: newProduct.point_of_sale_id || pointsOfSale[0]?.id,
        category_id: Number(newProduct.category_id),
        supplier_id: Number(newProduct.supplier_id)
      });
      
      if (newProduct.current_stock > 0) {
        await apiService.post('/stock-movements/', {
          product_id: createdProduct.id,
          type: 'entree',
          quantity: newProduct.current_stock,
          reason: 'Stock initial'
        });
      }

      setProducts(prev => [...prev, createdProduct]);
      setNewProduct({
        name: '',
        category_id: '',
        sku: '',
        current_stock: 0,
        min_stock: 0,
        max_stock: 0,
        price: 0,
        supplier_id: '',
        point_of_sale_id: '',
        description: ''
      });
      setShowAddModal(false);
      await fetchData();
    } catch (error: any) {
      setError(error.message || 'Erreur lors de l\'ajout du produit');
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;
    try {
      setError(null);
      await apiService.delete(`/products/${id}/`);
      setProducts(prev => prev.filter(p => p.id !== id));
      setMovements(prev => prev.filter(m => m.product.id !== id));
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la suppression du produit');
    }
  };

  // Edit product
  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  // Update product
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      setError(null);
      const updatedProduct = await apiService.put(`/products/${selectedProduct.id}/`, {
        name: selectedProduct.name,
        category_id: selectedProduct.category.id,
        sku: selectedProduct.sku,
        current_stock: selectedProduct.current_stock,
        min_stock: selectedProduct.min_stock,
        max_stock: selectedProduct.max_stock,
        price: selectedProduct.price,
        supplier_id: selectedProduct.supplier.id,
        point_of_sale_id: selectedProduct.point_of_sale.id,
        description: selectedProduct.description || ''
      });
      setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
      setShowEditModal(false);
      setSelectedProduct(null);
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la mise à jour du produit');
    }
  };

  // Replenish stock
  const handleReplenish = async (product: Product) => {
    const quantity = prompt('Entrez la quantité à réapprovisionner:', '50');
    if (!quantity || isNaN(parseInt(quantity))) {
      setError('Quantité invalide.');
      return;
    }
    try {
      setError(null);
      const newMovement = await apiService.post('/stock-movements/', {
        product_id: product.id,
        type: 'entree',
        quantity: parseInt(quantity),
        reason: 'Réapprovisionnement'
      });
      setMovements(prev => [newMovement, ...prev]);
      
      const updatedProduct = await apiService.get(`/products/${product.id}/`);
      setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    } catch (error: any) {
      setError(error.message || 'Erreur lors du réapprovisionnement');
    }
  };

  // Add stock movement
  const handleAddMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const createdMovement = await apiService.post('/stock-movements/', newMovement);
      setMovements(prev => [createdMovement, ...prev]);
      
      const updatedProduct = await apiService.get(`/products/${newMovement.product_id}/`);
      setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
      
      setNewMovement({
        product_id: '',
        type: '',
        quantity: 0,
        reason: ''
      });
      setShowMovementModal(false);
    } catch (error: any) {
      setError(error.message || 'Erreur lors de l\'ajout du mouvement');
    }
  };

  // Modal component
  const Modal = ({ isOpen, onClose, title, children }: { 
    isOpen: boolean; 
    onClose: () => void; 
    title: string; 
    children: React.ReactNode 
  }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X size={24} />
            </button>
          </div>
          <div className="p-6">
            {error && <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg">{error}</div>}
            {children}
          </div>
        </div>
      </div>
    );
  };

  // Overview View
  const OverviewView = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700">Total Produits</p>
              <p className="text-3xl font-bold text-blue-900">{overviewData.total_products}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-xl">
              <Package className="text-white" size={32} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-green-700">Valeur Stock</p>
              <p className="text-3xl font-bold text-green-900">₣ {(overviewData.stock_value / 1000).toFixed(1)}K</p>
            </div>
            <div className="bg-green-500 p-3 rounded-xl">
              <DollarSign className="text-white" size={32} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl border border-red-200 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-red-700">Alertes Stock</p>
              <p className="text-3xl font-bold text-red-900">{overviewData.alert_count}</p>
            </div>
            <div className="bg-red-500 p-3 rounded-xl">
              <AlertTriangle className="text-white" size={32} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-purple-700">Mouvements Jour</p>
              <p className="text-3xl font-bold text-purple-900">{overviewData.today_movements}</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-xl">
              <RefreshCw className="text-white" size={32} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800">Alertes Stock Critique</h3>
            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
              {overviewData.alert_count} alertes
            </span>
          </div>
          <div className="space-y-4">
            {overviewData.critical_products.map((product: any) => (
              <div key={product.id} className="flex items-center justify-between p-4 border-l-4 border-red-400 bg-red-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className={product.status === 'rupture' ? 'text-red-500' : 'text-amber-500'} size={24} />
                  <div>
                    <p className="font-semibold text-gray-800">{product.name}</p>
                    <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleReplenish(product)}
                  className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  Réapprovisionner
                </button>
              </div>
            ))}
            {overviewData.critical_products.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                Aucune alerte de stock critique
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800">Mouvements Récents</h3>
            <button 
              onClick={() => setActiveView('movements')}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Voir tous
            </button>
          </div>
          <div className="space-y-4">
            {movements.slice(0, 4).map((movement) => (
              <div key={movement.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  {getMovementIcon(movement.type)}
                  <div>
                    <p className="font-semibold text-gray-800">{movement.product.name}</p>
                    <p className="text-sm text-gray-600">{movement.reason}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500">{new Date(movement.date).toLocaleTimeString()}</span>
                  <p className="text-xs text-gray-400">{movement.user.username}</p>
                </div>
              </div>
            ))}
            {movements.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                Aucun mouvement récent
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Products View
  const ProductsView = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher un produit, SKU..."
                className="pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-80"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">Toutes catégories</option>
              {categories.length > 0 ? (
                categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))
              ) : (
                <option value="">Aucune catégorie disponible</option>
              )}
            </select>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium shadow-lg"
            >
              <Plus size={18} />
              <span>Nouveau Produit</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Produit</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Prix</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Fournisseur</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product, index) => (
                <tr key={product.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.category?.name} • {product.sku}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">{product.current_stock} unités</div>
                    <div className="text-sm text-gray-500">Min: {product.min_stock} • Max: {product.max_stock}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    ₣ {product.price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(product.status)}`}>
                      {product.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{product.supplier?.name}</div>
                    <div className="text-sm text-gray-500">{product.point_of_sale?.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={() => handleEditProduct(product)}
                        className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    {products.length === 0 ? 'Aucun produit disponible' : 'Aucun produit correspondant à votre recherche'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Movements View
  const MovementsView = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Mouvements de Stock</h3>
          <div className="flex space-x-3">
            <button 
              onClick={() => setShowMovementModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Plus size={16} />
              <span>Nouveau Mouvement</span>
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {movements.map((movement) => (
            <div key={movement.id} className="flex items-center justify-between p-6 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-full ${
                  movement.type === 'entree' ? 'bg-green-100' :
                  movement.type === 'sortie' ? 'bg-red-100' : 'bg-blue-100'
                }`}>
                  {getMovementIcon(movement.type)}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-lg">{movement.product.name}</p>
                  <p className="text-sm text-gray-600">{movement.reason}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-800 text-lg">{movement.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}: {movement.quantity}</p>
                <p className="text-sm text-gray-500">{new Date(movement.date).toLocaleString()}</p>
                <p className="text-xs text-blue-600 font-medium">{movement.user.username}</p>
              </div>
            </div>
          ))}
          {movements.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Aucun mouvement de stock enregistré
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Analytics View
  const AnalyticsView = () => (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-12 text-center">
      <div className="bg-gradient-to-br from-purple-100 to-blue-100 p-8 rounded-2xl">
        <TrendingUp className="mx-auto text-purple-600 mb-6" size={64} />
        <h3 className="text-3xl font-bold text-gray-800 mb-4">Analyses Avancées</h3>
        <p className="text-gray-600 text-lg">Les rapports et analyses détaillées seront développés prochainement.</p>
      </div>
    </div>
  );

  // Main render
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Gestion de Stock</h1>
          <p className="text-gray-600">Système de gestion intelligent pour votre inventaire</p>
        </div>
        
        {error && (
          <div className="p-4 bg-red-100 text-red-800 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-2">
          <div className="flex space-x-2">
            {[
              { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
              { id: 'products', label: 'Produits', icon: Package },
              { id: 'movements', label: 'Mouvements', icon: RefreshCw },
              { id: 'analytics', label: 'Analyses', icon: TrendingUp }
            ].map((view) => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id as any)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all font-medium ${
                  activeView === view.id 
                    ? 'bg-blue-500 text-white shadow-lg' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                }`}
              >
                <view.icon size={18} />
                <span>{view.label}</span>
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {activeView === 'overview' && <OverviewView />}
            {activeView === 'products' && <ProductsView />}
            {activeView === 'movements' && <MovementsView />}
            {activeView === 'analytics' && <AnalyticsView />}
          </>
        )}

        {/* Add Product Modal */}
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Ajouter un nouveau produit">
          <form onSubmit={handleAddProduct} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nom du produit *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Catégorie *</label>
                <select
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newProduct.category_id}
                  onChange={(e) => setNewProduct({...newProduct, category_id: Number(e.target.value) || ''})}
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.length > 0 ? (
                    categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))
                  ) : (
                    <option value="">Aucune catégorie disponible</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Code SKU *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newProduct.sku}
                  onChange={(e) => setNewProduct({...newProduct, sku: e.target.value.toUpperCase()})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Prix (₣) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: Number(e.target.value) || 0})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Stock actuel *</label>
                <input
                  type="number"
                  required
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newProduct.current_stock}
                  onChange={(e) => setNewProduct({...newProduct, current_stock: Number(e.target.value) || 0})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Stock minimum *</label>
                <input
                  type="number"
                  required
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newProduct.min_stock}
                  onChange={(e) => setNewProduct({...newProduct, min_stock: Number(e.target.value) || 0})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Stock maximum *</label>
                <input
                  type="number"
                  required
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newProduct.max_stock}
                  onChange={(e) => setNewProduct({...newProduct, max_stock: Number(e.target.value) || 0})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Fournisseur *</label>
                <select
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newProduct.supplier_id}
                  onChange={(e) => setNewProduct({...newProduct, supplier_id: Number(e.target.value) || ''})}
                >
                  <option value="">Sélectionner un fournisseur</option>
                  {suppliers.length > 0 ? (
                    suppliers.map(sup => (
                      <option key={sup.id} value={sup.id}>{sup.name}</option>
                    ))
                  ) : (
                    <option value="">Aucun fournisseur disponible</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Point de vente *</label>
                <select
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newProduct.point_of_sale_id}
                  onChange={(e) => setNewProduct({...newProduct, point_of_sale_id: e.target.value})}
                >
                  <option value="">Sélectionner un point de vente</option>
                  {pointsOfSale.length > 0 ? (
                    pointsOfSale.map(pos => (
                      <option key={pos.id} value={pos.id}>{pos.name}</option>
                    ))
                  ) : (
                    <option value="">Aucun point de vente disponible</option>
                  )}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={newProduct.description}
                onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
              />
            </div>
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Ajouter le produit
              </button>
            </div>
          </form>
        </Modal>

        {/* Edit Product Modal */}
        <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedProduct(null); }} title="Modifier le produit">
          {selectedProduct && (
            <form onSubmit={handleUpdateProduct} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nom du produit *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedProduct.name}
                    onChange={(e) => setSelectedProduct({...selectedProduct, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Catégorie *</label>
                  <select
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedProduct.category.id}
                    onChange={(e) => setSelectedProduct({
                      ...selectedProduct,
                      category: { ...selectedProduct.category, id: Number(e.target.value) }
                    })}
                  >
                    {categories.length > 0 ? (
                      categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))
                    ) : (
                      <option value="">Aucune catégorie disponible</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Code SKU *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedProduct.sku}
                    onChange={(e) => setSelectedProduct({...selectedProduct, sku: e.target.value.toUpperCase()})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Prix (₣) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedProduct.price}
                    onChange={(e) => setSelectedProduct({...selectedProduct, price: Number(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Stock actuel *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedProduct.current_stock}
                    onChange={(e) => setSelectedProduct({...selectedProduct, current_stock: Number(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Stock minimum *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedProduct.min_stock}
                    onChange={(e) => setSelectedProduct({...selectedProduct, min_stock: Number(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Stock maximum *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedProduct.max_stock}
                    onChange={(e) => setSelectedProduct({...selectedProduct, max_stock: Number(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Fournisseur *</label>
                  <select
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedProduct.supplier.id}
                    onChange={(e) => setSelectedProduct({
                      ...selectedProduct,
                      supplier: { ...selectedProduct.supplier, id: Number(e.target.value) }
                    })}
                  >
                    {suppliers.length > 0 ? (
                      suppliers.map(sup => (
                        <option key={sup.id} value={sup.id}>{sup.name}</option>
                      ))
                    ) : (
                      <option value="">Aucun fournisseur disponible</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Point de vente *</label>
                  <select
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedProduct.point_of_sale.id}
                    onChange={(e) => setSelectedProduct({
                      ...selectedProduct,
                      point_of_sale: { ...selectedProduct.point_of_sale, id: e.target.value }
                    })}
                  >
                    {pointsOfSale.length > 0 ? (
                      pointsOfSale.map(pos => (
                        <option key={pos.id} value={pos.id}>{pos.name}</option>
                      ))
                    ) : (
                      <option value="">Aucun point de vente disponible</option>
                    )}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  value={selectedProduct.description || ''}
                  onChange={(e) => setSelectedProduct({...selectedProduct, description: e.target.value})}
                />
              </div>
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setSelectedProduct(null); }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Mettre à jour
                </button>
              </div>
            </form>
          )}
        </Modal>

        {/* Add Movement Modal */}
        <Modal isOpen={showMovementModal} onClose={() => setShowMovementModal(false)} title="Nouveau mouvement de Stock">
          <form onSubmit={handleAddMovement} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Produit *</label>
                <select
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newMovement.product_id}
                  onChange={(e) => setNewMovement({...newMovement, product_id: e.target.value})}
                >
                  <option value="">Sélectionner un produit</option>
                  {products.length > 0 ? (
                    products.map(product => (
                      <option key={product.id} value={product.id}>{product.name}</option>
                    ))
                  ) : (
                    <option value="">Aucun produit disponible</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Type *</label>
                <select
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newMovement.type}
                  onChange={(e) => setNewMovement({...newMovement, type: e.target.value as any})}
                >
                  <option value="">Sélectionner le type</option>
                  <option value="entree">Entrée</option>
                  <option value="sortie">Sortie</option>
                  <option value="ajustement">Ajustement</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quantité *</label>
                <input
                  type="number"
                  required
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newMovement.quantity}
                  onChange={(e) => setNewMovement({...newMovement, quantity: Number(e.target.value) || 0})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Raison *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newMovement.reason}
                  onChange={(e) => setNewMovement({...newMovement, reason: e.target.value})}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowMovementModal(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Ajouter le mouvement
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default StockManagement;