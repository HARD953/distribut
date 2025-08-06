"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, Plus, Search, Filter, Edit, Trash2, 
  AlertTriangle, TrendingUp, TrendingDown, 
  Eye, Download, Upload, RefreshCw, Settings,
  BarChart3, ShoppingCart, Truck, Clock, X,
  Save, User, MapPin, Calendar, DollarSign, Image as ImageIcon
} from 'lucide-react';
import { apiService } from './ApiService';

interface Product {
  id: string;
  name: string;
  category: { id: number; name: string };
  sku: string;
  supplier: { id: number; name: string };
  point_of_sale: { id: string; name: string };
  description?: string;
  main_image?: string;
  status: 'en_stock' | 'stock_faible' | 'rupture' | 'surstockage';
  last_updated: string;
  created_at: string;
}

interface ProductVariant {
  id: string;
  product_id: string;
  product: { id: string; name: string };
  format: { id: number; name: string; description?: string };
  current_stock: number;
  min_stock: number;
  max_stock: number;
  price: number;
  barcode: string;
  image?: string;
}

interface ProductFormat {
  id: number;
  name: string;
  description?: string;
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
  supplier_id: number | '';
  point_of_sale_id: string;
  description: string;
  status: 'en_stock' | 'stock_faible' | 'rupture' | 'surstockage';
  main_image?: File;
}

interface NewVariant {
  product_id: string;
  format_id: number | '';
  current_stock: number;
  min_stock: number;
  max_stock: number;
  price: number;
  barcode: string;
  image?: File;
}

interface NewFormat {
  name: string;
  description: string;
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

interface OverviewData {
  total_products: number;
  stock_value: number;
  alert_count: number;
  today_movements: number;
  critical_products: Product[];
}

interface ApiOverviewResponse {
  cumulative?: {
    total_products: number;
    stock_value: number;
    alert_count: number;
    today_movements: number;
    critical_products: Product[];
  };
  pos_data?: any[];
}

const StockManagement = () => {
  const [activeView, setActiveView] = useState<'overview' | 'products' | 'movements' | 'analytics'>('overview');
  const [activeProductTab, setActiveProductTab] = useState<'list' | 'variants' | 'formats'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showAddVariantModal, setShowAddVariantModal] = useState(false);
  const [showEditVariantModal, setShowEditVariantModal] = useState(false);
  const [showAddFormatModal, setShowAddFormatModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [formats, setFormats] = useState<ProductFormat[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [pointsOfSale, setPointsOfSale] = useState<PointOfSale[]>([]);
  const [overviewData, setOverviewData] = useState<OverviewData>({
    total_products: 0,
    stock_value: 0,
    alert_count: 0,
    today_movements: 0,
    critical_products: []
  });
  const [newProduct, setNewProduct] = useState<NewProduct>({
    name: '',
    category_id: '',
    sku: '',
    supplier_id: '',
    point_of_sale_id: '',
    description: '',
    status: 'en_stock'
  });
  const [newVariant, setNewVariant] = useState<NewVariant>({
    product_id: '',
    format_id: '',
    current_stock: 0,
    min_stock: 0,
    max_stock: 0,
    price: 0,
    barcode: ''
  });
  const [newFormat, setNewFormat] = useState<NewFormat>({
    name: '',
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

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [
        overviewResponse,
        productsResponse,
        variantsResponse,
        formatsResponse,
        movementsResponse,
        categoriesResponse,
        suppliersResponse,
        posResponse
      ] = await Promise.all([
        apiService.get('/stock-overview/'),
        apiService.get('/products/'),
        apiService.get('/product-variants/'),
        apiService.get('/products-formats/'),
        apiService.get('/stock-movements/'),
        apiService.get('/categories/'),
        apiService.get('/suppliers/'),
        apiService.get('/points-vente/')
      ]);

      const overviewData = await overviewResponse.json();
      const productsData = await productsResponse.json();
      const variantsData = await variantsResponse.json();
      const formatsData = await formatsResponse.json();
      const movementsData = await movementsResponse.json();
      const categoriesData = await categoriesResponse.json();
      const suppliersData = await suppliersResponse.json();
      const posData = await posResponse.json();

      // Correction ici pour utiliser les données cumulative
      setOverviewData({
        total_products: overviewData.cumulative?.total_products || 0,
        stock_value: overviewData.cumulative?.stock_value || 0,
        alert_count: overviewData.cumulative?.alert_count || 0,
        today_movements: overviewData.cumulative?.today_movements || 0,
        critical_products: overviewData.cumulative?.critical_products || []
      });

      setProducts(productsData);
      setVariants(variantsData);
      setFormats(formatsData);
      setMovements(movementsData);
      setCategories(categoriesData);
      setSuppliers(suppliersData);
      setPointsOfSale(posData);

    } catch (error: any) {
      setError(error.message || 'Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en_stock': return 'bg-green-100 text-green-800 border-green-200';
      case 'stock_faible': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'rupture': return 'bg-red-100 text-red-800 border-red-200';
      case 'surstockage': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'entree': return <TrendingUp className="text-green-600" size={16} />;
      case 'sortie': return <TrendingDown className="text-red-600" size={16} />;
      case 'ajustement': return <RefreshCw className="text-blue-600" size={16} />;
      default: return <Package size={16} />;
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const nameMatch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
      const skuMatch = product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
      const categoryMatch = selectedCategory === 'all' || product.category?.name === selectedCategory;
      return (nameMatch || skuMatch) && categoryMatch;
    });
  }, [products, searchTerm, selectedCategory]);

  const filteredVariants = useMemo(() => {
    return variants.filter(variant => {
      const nameMatch = variant.format?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
      const barcodeMatch = variant.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
      const productMatch = products.find(p => p.id === variant.product_id)?.name.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
      return nameMatch || barcodeMatch || productMatch;
    });
  }, [variants, products, searchTerm]);

  const filteredFormats = useMemo(() => {
    return formats.filter(format => {
      const nameMatch = format.name.toLowerCase().includes(searchTerm.toLowerCase());
      const descriptionMatch = format.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
      return nameMatch || descriptionMatch;
    });
  }, [formats, searchTerm]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isVariant = false) => {
    if (e.target.files && e.target.files[0]) {
      if (isVariant) {
        setNewVariant({...newVariant, image: e.target.files[0]});
      } else {
        setNewProduct({...newProduct, main_image: e.target.files[0]});
      }
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      
      const formData = new FormData();
      formData.append('name', newProduct.name);
      formData.append('category_id', String(newProduct.category_id));
      formData.append('sku', newProduct.sku);
      formData.append('supplier_id', String(newProduct.supplier_id));
      formData.append('point_of_sale_id', newProduct.point_of_sale_id);
      formData.append('description', newProduct.description);
      formData.append('status', newProduct.status);
      if (newProduct.main_image) {
        formData.append('main_image', newProduct.main_image);
      }
      
      const response = await apiService.post('/products/', formData, true);
      const createdProduct = await response.json();

      setProducts(prev => [...prev, createdProduct]);
      setNewProduct({
        name: '',
        category_id: '',
        sku: '',
        supplier_id: '',
        point_of_sale_id: '',
        description: '',
        status: 'en_stock'
      });
      setShowAddModal(false);
      await fetchData();
    } catch (error: any) {
      setError(error.message || 'Erreur lors de l\'ajout du produit');
    }
  };

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      
      const formData = new FormData();
      formData.append('product_id', newVariant.product_id);
      formData.append('format_id', String(newVariant.format_id));
      formData.append('current_stock', String(newVariant.current_stock));
      formData.append('min_stock', String(newVariant.min_stock));
      formData.append('max_stock', String(newVariant.max_stock));
      formData.append('price', String(newVariant.price));
      formData.append('barcode', newVariant.barcode);
      if (newVariant.image) {
        formData.append('image', newVariant.image);
      }
      
      const response = await apiService.post('/product-variants/', formData, true);
      const createdVariant = await response.json();

      setVariants(prev => [...prev, createdVariant]);
      setNewVariant({
        product_id: '',
        format_id: '',
        current_stock: 0,
        min_stock: 0,
        max_stock: 0,
        price: 0,
        barcode: ''
      });
      setShowAddVariantModal(false);
      await fetchData();
    } catch (error: any) {
      setError(error.message || 'Erreur lors de l\'ajout de la variante');
    }
  };

  const handleAddFormat = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const response = await apiService.post('/products-formats/', newFormat);
      const createdFormat = await response.json();
      
      setFormats(prev => [...prev, createdFormat]);
      setNewFormat({
        name: '',
        description: ''
      });
      setShowAddFormatModal(false);
      await fetchData();
    } catch (error: any) {
      setError(error.message || 'Erreur lors de l\'ajout du format');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;
    try {
      setError(null);
      await apiService.delete(`/products/${id}/`);
      setProducts(prev => prev.filter(p => p.id !== id));
      setMovements(prev => prev.filter(m => m.product.id !== id));
      await fetchData();
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la suppression du produit');
    }
  };

  const handleDeleteVariant = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette variante ?')) return;
    try {
      setError(null);
      await apiService.delete(`/product-variants/${id}/`);
      setVariants(prev => prev.filter(v => v.id !== id));
      await fetchData();
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la suppression de la variante');
    }
  };

  const handleDeleteFormat = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce format ?')) return;
    try {
      setError(null);
      await apiService.delete(`/products-formats/${id}/`);
      setFormats(prev => prev.filter(f => f.id !== id));
      await fetchData();
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la suppression du format');
    }
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const handleEditVariant = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setShowEditVariantModal(true);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      setError(null);
      
      const formData = new FormData();
      formData.append('name', selectedProduct.name);
      formData.append('category_id', String(selectedProduct.category.id));
      formData.append('sku', selectedProduct.sku);
      formData.append('supplier_id', String(selectedProduct.supplier.id));
      formData.append('point_of_sale_id', selectedProduct.point_of_sale.id);
      formData.append('description', selectedProduct.description || '');
      formData.append('status', selectedProduct.status);
      
      const response = await apiService.put(`/products/${selectedProduct.id}/`, formData, true);
      const updatedProduct = await response.json();
      
      setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
      setShowEditModal(false);
      setSelectedProduct(null);
      await fetchData();
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la mise à jour du produit');
    }
  };

  const handleUpdateVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariant) return;
    try {
      setError(null);
      
      const formData = new FormData();
      formData.append('product_id', selectedVariant.product_id);
      formData.append('format_id', String(selectedVariant.format.id));
      formData.append('current_stock', String(selectedVariant.current_stock));
      formData.append('min_stock', String(selectedVariant.min_stock));
      formData.append('max_stock', String(selectedVariant.max_stock));
      formData.append('price', String(selectedVariant.price));
      formData.append('barcode', selectedVariant.barcode);
      
      const response = await apiService.put(`/product-variants/${selectedVariant.id}/`, formData, true);
      const updatedVariant = await response.json();
      
      setVariants(prev => prev.map(v => v.id === updatedVariant.id ? updatedVariant : v));
      setShowEditVariantModal(false);
      setSelectedVariant(null);
      await fetchData();
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la mise à jour de la variante');
    }
  };

  const handleAddMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const response = await apiService.post('/stock-movements/', newMovement);
      const createdMovement = await response.json();
      setMovements(prev => [createdMovement, ...prev]);
      
      setNewMovement({
        product_id: '',
        type: '',
        quantity: 0,
        reason: ''
      });
      setShowMovementModal(false);
      await fetchData();
    } catch (error: any) {
      setError(error.message || 'Erreur lors de l\'ajout du mouvement');
    }
  };

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
            {overviewData.critical_products.length > 0 ? (
              overviewData.critical_products.map((product, index) => (
                <div key={`${product.id}-${index}`} className="flex items-center justify-between p-4 border-l-4 border-red-400 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className={product.status === 'rupture' ? 'text-red-500' : 'text-amber-500'} size={24} />
                    <div>
                      <p className="font-semibold text-gray-800">{product.name || 'Unnamed Product'}</p>
                      <p className="text-sm text-gray-600">SKU: {product.sku || 'N/A'}</p>
                    </div>
                  </div>
                  <button
                    className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors font-medium"
                  >
                    Voir détails
                  </button>
                </div>
              ))
            ) : (
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
                    <p className="font-semibold text-gray-800">{movement.product?.name || 'Unknown Product'}</p>
                    <p className="text-sm text-gray-600">{movement.reason}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500">{new Date(movement.date).toLocaleTimeString()}</span>
                  <p className="text-xs text-gray-400">{movement.user?.username || 'Unknown User'}</p>
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

  const ProductsView = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg">
        <div className="flex space-x-2 mb-4">
          {[
            { id: 'list', label: 'Liste des Produits', icon: Package },
            { id: 'variants', label: 'Variantes', icon: Package },
            { id: 'formats', label: 'Formats', icon: Package }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveProductTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all font-medium ${
                activeProductTab === tab.id 
                  ? 'bg-blue-500 text-white shadow-lg' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
              }`}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher..."
                className="pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-80"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {activeProductTab === 'list' && (
              <select
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">Toutes catégories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => {
                if (activeProductTab === 'list') setShowAddModal(true);
                if (activeProductTab === 'variants') setShowAddVariantModal(true);
                if (activeProductTab === 'formats') setShowAddFormatModal(true);
              }}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium shadow-lg"
            >
              <Plus size={18} />
              <span>
                {activeProductTab === 'list' ? 'Nouveau Produit' : 
                 activeProductTab === 'variants' ? 'Nouvelle Variante' : 'Nouveau Format'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {activeProductTab === 'list' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Produit</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Image</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Catégorie</th>
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
                        <div className="text-sm text-gray-500">{product.sku}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {product.main_image ? (
                        <div className="w-12 h-12 rounded-lg overflow-hidden">
                          <img 
                            src={product.main_image} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                          <ImageIcon className="text-gray-400" size={20} />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {product.category?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(product.status)}`}>
                        {product.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{product.supplier?.name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{product.point_of_sale?.name || 'Unknown'}</div>
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
      )}

      {activeProductTab === 'variants' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Produit</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Format</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Prix</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Image</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVariants.map((variant, index) => (
                  <tr key={variant.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">
                        {variant.product?.name || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{variant.format?.name || 'Unknown'}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div>Actuel: {variant.current_stock}</div>
                        <div>Min: {variant.min_stock}</div>
                        <div>Max: {variant.max_stock}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      ₣ {variant.price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {variant.image ? (
                        <div className="w-12 h-12 rounded-lg overflow-hidden">
                          <img 
                            src={variant.image} 
                            alt={variant.format?.name || 'Variant'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                          <ImageIcon className="text-gray-400" size={20} />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <button 
                          onClick={() => handleEditVariant(variant)}
                          className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteVariant(variant.id)}
                          className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredVariants.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      {variants.length === 0 ? 'Aucune variante disponible' : 'Aucune variante correspondant à votre recherche'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeProductTab === 'formats' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFormats.map((format, index) => (
                  <tr key={format.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{format.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{format.description || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <button 
                          onClick={() => handleDeleteFormat(format.id)}
                          className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredFormats.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                      {formats.length === 0 ? 'Aucun format disponible' : 'Aucun format correspondant à votre recherche'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

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
                  <p className="font-semibold text-gray-800 text-lg">{movement.product?.name || 'Unknown Product'}</p>
                  <p className="text-sm text-gray-600">{movement.reason}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-800 text-lg">{movement.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}: {movement.quantity}</p>
                <p className="text-sm text-gray-500">{new Date(movement.date).toLocaleString()}</p>
                <p className="text-xs text-blue-600 font-medium">{movement.user?.username || 'Unknown User'}</p>
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

  const AnalyticsView = () => (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-12 text-center">
      <div className="bg-gradient-to-br from-purple-100 to-blue-100 p-8 rounded-2xl">
        <TrendingUp className="mx-auto text-purple-600 mb-6" size={64} />
        <h3 className="text-3xl font-bold text-gray-800 mb-4">Analyses Avancées</h3>
        <p className="text-gray-600 text-lg">Les rapports et analyses détaillées seront développés prochainement.</p>
      </div>
    </div>
  );

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
                onClick={() => {
                  setActiveView(view.id as any);
                  if (view.id === 'products') setActiveProductTab('list');
                }}
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
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Fournisseur *</label>
                <select
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newProduct.supplier_id}
                  onChange={(e) => setNewProduct({...newProduct, supplier_id: Number(e.target.value) || ''})}
                >
                  <option value="">Sélectionner un fournisseur</option>
                  {suppliers.map(sup => (
                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                  ))}
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
                  {pointsOfSale.map(pos => (
                    <option key={pos.id} value={pos.id}>{pos.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Statut *</label>
                <select
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newProduct.status}
                  onChange={(e) => setNewProduct({...newProduct, status: e.target.value as any})}
                >
                  <option value="en_stock">En stock</option>
                  <option value="stock_faible">Stock faible</option>
                  <option value="rupture">Rupture</option>
                  <option value="surstockage">Surstockage</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Image principale</label>
                <div className="flex items-center space-x-4">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">Cliquez pour télécharger</p>
                      <p className="text-xs text-gray-500">PNG, JPG, JPEG (MAX. 5MB)</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={(e) => handleImageUpload(e)}
                      accept="image/*"
                    />
                  </label>
                  {newProduct.main_image && (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                      <img
                        src={URL.createObjectURL(newProduct.main_image)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setNewProduct({...newProduct, main_image: undefined})}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
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

        {/* Add Variant Modal */}
        <Modal isOpen={showAddVariantModal} onClose={() => setShowAddVariantModal(false)} title="Ajouter une nouvelle variante">
          <form onSubmit={handleAddVariant} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Produit *</label>
                <select
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newVariant.product_id}
                  onChange={(e) => setNewVariant({...newVariant, product_id: e.target.value})}
                >
                  <option value="">Sélectionner un produit</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Format *</label>
                <select
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newVariant.format_id}
                  onChange={(e) => setNewVariant({...newVariant, format_id: Number(e.target.value) || ''})}
                >
                  <option value="">Sélectionner un format</option>
                  {formats.map(format => (
                    <option key={format.id} value={format.id}>{format.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Stock actuel *</label>
                <input
                  type="number"
                  required
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newVariant.current_stock}
                  onChange={(e) => setNewVariant({...newVariant, current_stock: Number(e.target.value) || 0})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Stock minimum *</label>
                <input
                  type="number"
                  required
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newVariant.min_stock}
                  onChange={(e) => setNewVariant({...newVariant, min_stock: Number(e.target.value) || 0})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Stock maximum *</label>
                <input
                  type="number"
                  required
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newVariant.max_stock}
                  onChange={(e) => setNewVariant({...newVariant, max_stock: Number(e.target.value) || 0})}
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
                  value={newVariant.price}
                  onChange={(e) => setNewVariant({...newVariant, price: Number(e.target.value) || 0})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Code-barres</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newVariant.barcode}
                  onChange={(e) => setNewVariant({...newVariant, barcode: e.target.value})}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Image de la variante</label>
                <div className="flex items-center space-x-4">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">Cliquez pour télécharger</p>
                      <p className="text-xs text-gray-500">PNG, JPG, JPEG (MAX. 5MB)</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={(e) => handleImageUpload(e, true)}
                      accept="image/*"
                    />
                  </label>
                  {newVariant.image && (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                      <img
                        src={URL.createObjectURL(newVariant.image)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setNewVariant({...newVariant, image: undefined})}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowAddVariantModal(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Ajouter la variante
              </button>
            </div>
          </form>
        </Modal>

        {/* Edit Variant Modal */}
        <Modal isOpen={showEditVariantModal} onClose={() => { setShowEditVariantModal(false); setSelectedVariant(null); }} title="Modifier la variante">
          {selectedVariant && (
            <form onSubmit={handleUpdateVariant} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Produit *</label>
                  <select
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedVariant.product_id}
                    onChange={(e) => setSelectedVariant({...selectedVariant, product_id: e.target.value})}
                  >
                    {products.map(product => (
                      <option key={product.id} value={product.id}>{product.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Format *</label>
                  <select
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedVariant.format.id}
                    onChange={(e) => setSelectedVariant({
                      ...selectedVariant,
                      format: { ...selectedVariant.format, id: Number(e.target.value) }
                    })}
                  >
                    {formats.map(format => (
                      <option key={format.id} value={format.id}>{format.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Stock actuel *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedVariant.current_stock}
                    onChange={(e) => setSelectedVariant({...selectedVariant, current_stock: Number(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Stock minimum *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedVariant.min_stock}
                    onChange={(e) => setSelectedVariant({...selectedVariant, min_stock: Number(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Stock maximum *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedVariant.max_stock}
                    onChange={(e) => setSelectedVariant({...selectedVariant, max_stock: Number(e.target.value) || 0})}
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
                    value={selectedVariant.price}
                    onChange={(e) => setSelectedVariant({...selectedVariant, price: Number(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Code-barres</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedVariant.barcode}
                    onChange={(e) => setSelectedVariant({...selectedVariant, barcode: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Image de la variante</label>
                  <div className="flex items-center space-x-4">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-3 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500">Cliquez pour télécharger</p>
                        <p className="text-xs text-gray-500">PNG, JPG, JPEG (MAX. 5MB)</p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        onChange={(e) => handleImageUpload(e, true)}
                        accept="image/*"
                      />
                    </label>
                    {selectedVariant.image && (
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                        <img
                          src={selectedVariant.image}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setSelectedVariant({...selectedVariant, image: undefined})}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => { setShowEditVariantModal(false); setSelectedVariant(null); }}
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

        {/* Add Format Modal */}
        <Modal isOpen={showAddFormatModal} onClose={() => setShowAddFormatModal(false)} title="Ajouter un nouveau format">
          <form onSubmit={handleAddFormat} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nom du format *</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newFormat.name}
                onChange={(e) => setNewFormat({...newFormat, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={newFormat.description}
                onChange={(e) => setNewFormat({...newFormat, description: e.target.value})}
              />
            </div>
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowAddFormatModal(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Ajouter le format
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
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
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
                    {suppliers.map(sup => (
                      <option key={sup.id} value={sup.id}>{sup.name}</option>
                    ))}
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
                    {pointsOfSale.map(pos => (
                      <option key={pos.id} value={pos.id}>{pos.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Statut *</label>
                  <select
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedProduct.status}
                    onChange={(e) => setSelectedProduct({
                      ...selectedProduct,
                      status: e.target.value as any
                    })}
                  >
                    <option value="en_stock">En stock</option>
                    <option value="stock_faible">Stock faible</option>
                    <option value="rupture">Rupture</option>
                    <option value="surstockage">Surstockage</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Image principale</label>
                  <div className="flex items-center space-x-4">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-3 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500">Cliquez pour télécharger</p>
                        <p className="text-xs text-gray-500">PNG, JPG, JPEG (MAX. 5MB)</p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        onChange={(e) => handleImageUpload(e)}
                        accept="image/*"
                      />
                    </label>
                    {selectedProduct.main_image && (
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                        <img
                          src={selectedProduct.main_image}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setSelectedProduct({...selectedProduct, main_image: undefined})}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>
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
                  {products.map(product => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
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