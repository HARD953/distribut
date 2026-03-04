"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, Plus, Search, Filter, Edit, Trash2, 
  AlertTriangle, TrendingUp, TrendingDown, 
  Eye, Download, Upload, RefreshCw, Settings,
  BarChart3, ShoppingCart, Truck, Clock, X,
  Save, User, MapPin, Calendar, DollarSign, Image as ImageIcon,
  List, CheckCircle, ArrowUpRight, ArrowDownRight, Users,
  Tag, Layers, FolderOpen, Box, Database, AlertCircle
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
  image?: string | File;
}

interface ProductFormat {
  id: number;
  name: string;
  description?: string;
}

interface Category {
  id: number;
  name: string;
  description: string;
  image: string | null;
  created_at?: string;
  updated_at?: string;
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
  product_variant_id: string | '';
  type: 'entree' | 'sortie' | 'ajustement' | '';
  quantity: number;
  reason: string;
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

const StockManagement = () => {
  const [activeView, setActiveView] = useState<'overview' | 'products' | 'movements' | 'analytics'>('overview');
  const [activeProductTab, setActiveProductTab] = useState<'list' | 'variants' | 'formats' | 'categories'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showAddVariantModal, setShowAddVariantModal] = useState(false);
  const [showEditVariantModal, setShowEditVariantModal] = useState(false);
  const [showAddFormatModal, setShowAddFormatModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [formats, setFormats] = useState<ProductFormat[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
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
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    image: null as File | null
  });
  const [newMovement, setNewMovement] = useState<NewMovement>({
    product_variant_id: '',
    type: '',
    quantity: 0,
    reason: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Thème moderne avec couleurs professionnelles
  const theme = {
    primary: { 
      light: '#EEF2FF', 
      DEFAULT: '#4F46E5', 
      dark: '#4338CA', 
      text: '#3730A3',
      gradient: 'linear-gradient(135deg, #4F46E5 0%, #7C73E6 100%)'
    },
    success: { 
      light: '#ECFDF5', 
      DEFAULT: '#10B981', 
      dark: '#059669', 
      text: '#065F46' 
    },
    warning: { 
      light: '#FFFBEB', 
      DEFAULT: '#F59E0B', 
      dark: '#D97706', 
      text: '#92400E' 
    },
    error: { 
      light: '#FEF2F2', 
      DEFAULT: '#EF4444', 
      dark: '#DC2626', 
      text: '#991B1B' 
    },
    gray: { 
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827'
    }
  };

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
      case 'en_stock': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'stock_faible': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'rupture': return 'bg-red-100 text-red-800 border-red-200';
      case 'surstockage': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'entree': return <TrendingUp className="text-emerald-600" size={16} />;
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

  const filteredCategories = useMemo(() => {
    return categories.filter(category => {
      const nameMatch = category.name.toLowerCase().includes(searchTerm.toLowerCase());
      const descriptionMatch = category.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
      return nameMatch || descriptionMatch;
    });
  }, [categories, searchTerm]);

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

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      
      const formData = new FormData();
      formData.append('name', newCategory.name);
      formData.append('description', newCategory.description);
      if (newCategory.image) {
        formData.append('image', newCategory.image);
      }
      
      const response = await apiService.post('/categories/', formData, true);
      const createdCategory = await response.json();
      
      setCategories(prev => [...prev, createdCategory]);
      setNewCategory({
        name: '',
        description: '',
        image: null
      });
      setShowCategoryModal(false);
    } catch (error: any) {
      setError(error.message || 'Erreur lors de l\'ajout de la catégorie');
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

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) return;
    try {
      setError(null);
      await apiService.delete(`/categories/${id}/`);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la suppression de la catégorie');
    }
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const handleEditVariant = (variant: ProductVariant) => {
    setSelectedVariant({
      ...variant,
      product_id: variant.product_id || variant.product.id
    });
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
      
      if (selectedVariant.image instanceof File) {
        formData.append('image', selectedVariant.image);
      }
      
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
      
      if (!newMovement.product_variant_id) {
        throw new Error('Veuillez sélectionner une variante de produit');
      }
      if (!newMovement.type) {
        throw new Error('Veuillez sélectionner un type de mouvement');
      }
      if (newMovement.quantity <= 0) {
        throw new Error('La quantité doit être supérieure à 0');
      }
      if (!newMovement.reason.trim()) {
        throw new Error('Veuillez spécifier une raison');
      }

      const response = await apiService.post('/stock-movements/', newMovement);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erreur lors de l\'ajout du mouvement');
      }
      
      const createdMovement = await response.json();
      setMovements(prev => [createdMovement, ...prev]);
      
      setNewMovement({
        product_variant_id: '',
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
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-white">
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X size={24} className="text-gray-500" />
            </button>
          </div>
          <div className="p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 font-medium">
                {error}
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
    );
  };

  const OverviewView = () => (
    <div className="space-y-8">
      {/* Cartes de métriques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">Total Produits</p>
              <p className="text-3xl font-bold text-gray-900">{overviewData.total_products}</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-xl">
              <Package className="text-indigo-600" size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-emerald-600">
            <TrendingUp size={14} className="mr-1" />
            <span>+12% ce mois</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">Valeur Stock</p>
              <p className="text-3xl font-bold text-gray-900">₣ {(overviewData.stock_value / 1000).toFixed(1)}K</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-xl">
              <DollarSign className="text-emerald-600" size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-emerald-600">
            <ArrowUpRight size={14} className="mr-1" />
            <span>Croissance stable</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">Alertes Stock</p>
              <p className="text-3xl font-bold text-gray-900">{overviewData.alert_count}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-xl">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-red-600">
            <AlertCircle size={14} className="mr-1" />
            <span>Nécessite attention</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">Mouvements Jour</p>
              <p className="text-3xl font-bold text-gray-900">{overviewData.today_movements}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <RefreshCw className="text-purple-600" size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-purple-600">
            <BarChart3 size={14} className="mr-1" />
            <span>Activité normale</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Alertes Stock Critique */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Alertes Stock Critique</h3>
            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
              {overviewData.alert_count} alertes
            </span>
          </div>
          <div className="space-y-4">
            {overviewData.critical_products.length > 0 ? (
              overviewData.critical_products.map((product, index) => (
                <div key={`${product.id}-${index}`} className="flex items-center justify-between p-4 border-l-4 border-red-400 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className={product.status === 'rupture' ? 'text-red-500' : 'text-amber-500'} size={20} />
                    <div>
                      <p className="font-semibold text-gray-900">{product.name || 'Produit sans nom'}</p>
                      <p className="text-sm text-gray-600">SKU: {product.sku || 'N/A'}</p>
                    </div>
                  </div>
                  <button className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                    Voir détails
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                <CheckCircle size={32} className="mx-auto text-gray-400 mb-3" />
                <p className="font-medium">Aucune alerte de stock critique</p>
                <p className="text-sm mt-1">Tous les produits sont en stock optimal</p>
              </div>
            )}
          </div>
        </div>

        {/* Mouvements Récents */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Mouvements Récents</h3>
            <button 
              onClick={() => setActiveView('movements')}
              className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
            >
              Voir tous
            </button>
          </div>
          <div className="space-y-4">
            {movements.slice(0, 4).map((movement) => (
              <div key={movement.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    movement.type === 'entree' ? 'bg-emerald-100' :
                    movement.type === 'sortie' ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    {getMovementIcon(movement.type)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{movement.product?.name || 'Produit inconnu'}</p>
                    <p className="text-sm text-gray-600">{movement.reason}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500 font-medium">
                    {new Date(movement.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">{movement.user?.username || 'Utilisateur inconnu'}</p>
                </div>
              </div>
            ))}
            {movements.length === 0 && (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                <Package size={32} className="mx-auto text-gray-400 mb-3" />
                <p className="font-medium">Aucun mouvement récent</p>
                <p className="text-sm mt-1">Les mouvements de stock apparaîtront ici</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const ProductsView = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        {/* Navigation par onglets */}
        <div className="flex space-x-1 mb-6 p-1 bg-gray-100 rounded-xl">
          {[
            { id: 'list', label: 'Produits', icon: Package },
            { id: 'variants', label: 'Variantes', icon: Box },
            { id: 'formats', label: 'Formats', icon: Tag },
            { id: 'categories', label: 'Catégories', icon: FolderOpen }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveProductTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all font-medium flex-1 justify-center ${
                activeProductTab === tab.id 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
              }`}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Barre de recherche et filtres */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher..."
                className="pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-80 transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {activeProductTab === 'list' && (
              <select
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-w-[180px] transition-colors"
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
                if (activeProductTab === 'categories') setShowCategoryModal(true);
              }}
              className="flex items-center space-x-2 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-sm"
            >
              <Plus size={18} />
              <span>
                {activeProductTab === 'list' ? 'Nouveau Produit' : 
                 activeProductTab === 'variants' ? 'Nouvelle Variante' : 
                 activeProductTab === 'formats' ? 'Nouveau Format' : 'Nouvelle Catégorie'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Contenu des onglets */}
      {activeProductTab === 'list' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Produit</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Image</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Catégorie</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Fournisseur</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
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
                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200">
                          <img 
                            src={product.main_image} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                          <ImageIcon className="text-gray-400" size={20} />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {product.category?.name || 'Non spécifié'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(product.status)}`}>
                        {product.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{product.supplier?.name || 'Non spécifié'}</div>
                      <div className="text-sm text-gray-500">{product.point_of_sale?.name || 'Non spécifié'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleEditProduct(product)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Package className="text-gray-300 mb-3" size={48} />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {products.length === 0 ? 'Aucun produit disponible' : 'Aucun produit correspondant'}
                        </h3>
                        <p className="text-gray-600 max-w-md">
                          {products.length === 0 
                            ? 'Commencez par ajouter votre premier produit à votre inventaire.'
                            : 'Aucun produit ne correspond à vos critères de recherche.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeProductTab === 'variants' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Produit</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Format</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Prix</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Image</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVariants.map((variant, index) => (
                  <tr key={variant.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">
                        {variant.product?.name || 'Produit inconnu'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{variant.format?.name || 'Non spécifié'}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Actuel:</span>
                          <span className={`font-semibold ${
                            variant.current_stock <= variant.min_stock ? 'text-red-600' : 
                            variant.current_stock >= variant.max_stock ? 'text-emerald-600' : 'text-gray-900'
                          }`}>
                            {variant.current_stock}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Min:</span>
                          <span className="font-medium text-gray-900">{variant.min_stock}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Max:</span>
                          <span className="font-medium text-gray-900">{variant.max_stock}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      ₣ {variant.price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {variant.image ? (
                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200">
                          <img 
                            src={typeof variant.image === 'string' ? variant.image : URL.createObjectURL(variant.image)} 
                            alt={variant.format?.name || 'Variante'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                          <ImageIcon className="text-gray-400" size={20} />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleEditVariant(variant)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteVariant(variant.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredVariants.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Box className="text-gray-300 mb-3" size={48} />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {variants.length === 0 ? 'Aucune variante disponible' : 'Aucune variante correspondante'}
                        </h3>
                        <p className="text-gray-600">
                          {variants.length === 0 
                            ? 'Ajoutez des variantes pour gérer différents formats de produits.'
                            : 'Aucune variante ne correspond à vos critères de recherche.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeProductTab === 'formats' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFormats.map((format, index) => (
                  <tr key={format.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">{format.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{format.description || 'Aucune description'}</td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleDeleteFormat(format.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredFormats.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Tag className="text-gray-300 mb-3" size={48} />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {formats.length === 0 ? 'Aucun format disponible' : 'Aucun format correspondant'}
                        </h3>
                        <p className="text-gray-600">
                          {formats.length === 0 
                            ? 'Créez des formats pour organiser vos variantes de produits.'
                            : 'Aucun format ne correspond à vos critères de recherche.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeProductTab === 'categories' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Gestion des Catégories</h3>
              <button 
                onClick={() => setShowCategoryModal(true)}
                className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-sm"
              >
                <Plus size={16} />
                <span>Nouvelle Catégorie</span>
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Image</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCategories.map((category, index) => (
                  <tr key={category.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">{category.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{category.description || 'Aucune description'}</td>
                    <td className="px-6 py-4">
                      {category.image ? (
                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200">
                          <img 
                            src={category.image} 
                            alt={category.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                          <ImageIcon className="text-gray-400" size={20} />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleDeleteCategory(category.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredCategories.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <FolderOpen className="text-gray-300 mb-3" size={48} />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {categories.length === 0 ? 'Aucune catégorie disponible' : 'Aucune catégorie correspondante'}
                        </h3>
                        <p className="text-gray-600">
                          {categories.length === 0 
                            ? 'Organisez vos produits en créant des catégories.'
                            : 'Aucune catégorie ne correspond à vos critères de recherche.'}
                        </p>
                      </div>
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
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Mouvements de Stock</h3>
            <p className="text-gray-600 mt-1">Historique complet des entrées, sorties et ajustements</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => setShowMovementModal(true)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium shadow-sm"
            >
              <Plus size={16} />
              <span>Nouveau Mouvement</span>
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {movements.map((movement) => (
            <div key={movement.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-full ${
                  movement.type === 'entree' ? 'bg-emerald-100' :
                  movement.type === 'sortie' ? 'bg-red-100' : 'bg-blue-100'
                }`}>
                  {getMovementIcon(movement.type)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{movement.product?.name || 'Produit inconnu'}</p>
                  <p className="text-sm text-gray-600">{movement.reason}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold text-lg ${
                  movement.type === 'entree' ? 'text-emerald-600' :
                  movement.type === 'sortie' ? 'text-red-600' : 'text-blue-600'
                }`}>
                  {movement.type === 'entree' ? '+' : movement.type === 'sortie' ? '-' : '±'} {movement.quantity}
                </p>
                <p className="text-sm text-gray-500">{new Date(movement.date).toLocaleString('fr-FR')}</p>
                <p className="text-xs text-indigo-600 font-medium">{movement.user?.username || 'Utilisateur inconnu'}</p>
              </div>
            </div>
          ))}
          {movements.length === 0 && (
            <div className="text-center py-12">
              <RefreshCw className="mx-auto text-gray-300 mb-3" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun mouvement de stock</h3>
              <p className="text-gray-600 mb-4">Les mouvements de stock apparaîtront ici lorsqu'ils seront enregistrés.</p>
              <button 
                onClick={() => setShowMovementModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Créer le premier mouvement
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const AnalyticsView = () => (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-8 rounded-2xl border border-indigo-100">
        <TrendingUp className="mx-auto text-indigo-600 mb-4" size={64} />
        <h3 className="text-2xl font-bold text-gray-900 mb-3">Analyses Avancées</h3>
        <p className="text-gray-600 text-lg mb-6">Les rapports et analyses détaillées seront développés prochainement.</p>
        <div className="flex justify-center space-x-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <BarChart3 className="mx-auto text-indigo-600 mb-2" size={24} />
            <p className="text-sm font-medium text-gray-900">Rapports de Performance</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <Database className="mx-auto text-indigo-600 mb-2" size={24} />
            <p className="text-sm font-medium text-gray-900">Analyses Prédictives</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <Users className="mx-auto text-indigo-600 mb-2" size={24} />
            <p className="text-sm font-medium text-gray-900">Tableaux de Bord</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* En-tête */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Gestion de Stock Intelligente</h1>
          <p className="text-gray-600 text-lg">Système complet de gestion d'inventaire pour votre entreprise</p>
        </div>
        
        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 font-medium">
            {error}
          </div>
        )}

        {/* Navigation principale */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-2">
          <div className="flex space-x-1">
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
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all font-medium flex-1 justify-center ${
                  activeView === view.id 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
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
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <>
            {activeView === 'overview' && <OverviewView />}
            {activeView === 'products' && <ProductsView />}
            {activeView === 'movements' && <MovementsView />}
            {activeView === 'analytics' && <AnalyticsView />}
          </>
        )}

        {/* Modals */}
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Ajouter un nouveau produit">
          <form onSubmit={handleAddProduct} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">Nom du produit *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">Catégorie *</label>
                <select
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
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
                <label className="block text-sm font-semibold text-gray-900 mb-3">Code SKU *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  value={newProduct.sku}
                  onChange={(e) => setNewProduct({...newProduct, sku: e.target.value.toUpperCase()})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">Fournisseur *</label>
                <select
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
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
                <label className="block text-sm font-semibold text-gray-900 mb-3">Point de vente *</label>
                <select
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
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
                <label className="block text-sm font-semibold text-gray-900 mb-3">Statut *</label>
                <select
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  value={newProduct.status}
                  onChange={(e) => setNewProduct({...newProduct, status: e.target.value as any})}
                >
                  <option value="en_stock">En stock</option>
                  <option value="stock_faible">Stock faible</option>
                  <option value="rupture">Rupture de stock</option>
                  <option value="surstockage">Surstockage</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-900 mb-3">Image principale</label>
                <div className="flex items-center space-x-4">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
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
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                      <img
                        src={URL.createObjectURL(newProduct.main_image)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setNewProduct({...newProduct, main_image: undefined})}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">Description</label>
              <textarea
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                rows={3}
                value={newProduct.description}
                onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
              />
            </div>
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-sm"
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
                  // Dans le formulaire de modification de variante, assurez-vous que product_id est correctement géré
                  <select
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedVariant?.product_id}
                    onChange={(e) => setSelectedVariant({
                      ...selectedVariant,
                      product_id: e.target.value,
                      product: { ...selectedVariant.product, id: e.target.value }
                    })}
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
                    onChange={(e) => setSelectedVariant(prev => prev ? {...prev, current_stock: Number(e.target.value) || 0} : null)}
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
                    onChange={(e) => setSelectedVariant(prev => prev ? {...prev, min_stock: Number(e.target.value) || 0} : null)}
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
                      onChange={(e) => setSelectedVariant(prev => prev ? {...prev, max_stock: Number(e.target.value) || 0} : null)}
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
                      onChange={(e) => setSelectedVariant(prev => prev ? {...prev, price: Number(e.target.value) || 0} : null)}
                    />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Code-barres</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={selectedVariant.barcode}
                      onChange={(e) => setSelectedVariant(prev => prev ? {...prev, barcode: e.target.value} : null)}
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
                    onChange={(e) => setSelectedProduct(prev => prev ? {...prev, name: e.target.value} : null)}
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
                    onChange={(e) => setSelectedProduct(prev => prev ? {...prev, sku: e.target.value.toUpperCase()} : null)}
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
                  onChange={(e) => setSelectedProduct(prev => prev ? {...prev, description: e.target.value} : null)}
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
        <label className="block text-sm font-semibold text-gray-700 mb-2">Variante de produit *</label>
        <select
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={newMovement.product_variant_id}
          onChange={(e) => setNewMovement({...newMovement, product_variant_id: e.target.value})}
        >
          <option value="">Sélectionner une variante</option>
          {variants.map(variant => (
            <option key={variant.id} value={variant.id}>
              {variant.product?.name} - {variant.format?.name} (Stock: {variant.current_stock})
            </option>
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

<Modal isOpen={showCategoryModal} onClose={() => setShowCategoryModal(false)} title="Ajouter une nouvelle catégorie">
  <form onSubmit={handleAddCategory} className="space-y-6">
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">Nom de la catégorie *</label>
      <input
        type="text"
        required
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={newCategory.name}
        onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
      />
    </div>
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
      <textarea
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={3}
        value={newCategory.description}
        onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
      />
    </div>
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">Image de la catégorie</label>
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
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setNewCategory({...newCategory, image: e.target.files[0]});
              }
            }}
            accept="image/*"
          />
        </label>
        {newCategory.image && (
          <div className="relative w-16 h-16 rounded-lg overflow-hidden">
            <img
              src={URL.createObjectURL(newCategory.image)}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => setNewCategory({...newCategory, image: null})}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
            >
              <X size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
      <button
        type="button"
        onClick={() => setShowCategoryModal(false)}
        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
      >
        Annuler
      </button>
      <button
        type="submit"
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        Ajouter la catégorie
      </button>
    </div>
  </form>
</Modal>
      </div>
    </div>
  );
};

export default StockManagement;