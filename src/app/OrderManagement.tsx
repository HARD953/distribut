import React, { useState, useEffect } from 'react';
import { 
  Package, Search, Filter, Eye, Edit, Trash2, Plus, 
  Calendar, MapPin, User, Phone, Mail, CheckCircle, 
  Clock, AlertCircle, XCircle, Truck, DollarSign,
  Download, RefreshCw, ChevronDown, ChevronUp, Star, List, ShoppingCart,
  Users, Target
} from 'lucide-react';

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

interface UserProfile {
  id: number;
  user?: {
    id?: number;
    username?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  };
  establishment_name?: string;
  establishment_phone?: string;
  establishment_email?: string;
  establishment_address?: string;
  establishment_type?: string;
  phone?: string;
  location?: string;
  role?: number;
  status?: string;
  avatar?: string | null;
  points_of_sale?: PointOfSale[];
}

interface PointOfSale {
  id: number;
  name: string;
  owner?: string;
  phone?: string;
  email?: string;
  address?: string;
  status?: string;
  avatar?: string;
}

interface Product {
  id: number;
  name: string;
  sku?: string;
  status?: string;
}

interface ProductFormat {
  id: number;
  name?: string;
  description?: string;
}

interface ProductVariant {
  id: number;
  product?: Product;
  format?: ProductFormat;
  current_stock?: number;
  min_stock?: number;
  max_stock?: number;
  price: string;
  barcode?: string;
  image?: string;
}

interface OrderItem {
  id: number;
  product_variant?: ProductVariant;
  product_name?: string;
  name?: string;
  quantity: number;
  price: string;
  total: string;
}

interface Order {
  id: number;
  point_of_sale?: number;
  point_of_sale_details?: PointOfSale;
  status: OrderStatus;
  total: string;
  date: string;
  delivery_date?: string;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  created_at?: string;
  updated_at?: string;
  items: OrderItem[];
}

interface NewOrder {
  point_of_sale_id: number | null;
  status: OrderStatus | null;
  total: string | null;
  date: string;
  delivery_date: string;
  priority: 'low' | 'medium' | 'high';
  notes: string;
  items: NewOrderItem[];
}

interface NewOrderItem {
  product_variant_id: number;
  quantity: number;
  price: string;
}

interface MobileVendor {
  id: number;
  full_name: string;
  phone?: string;
  email?: string;
  status?: string;
  avatar?: string;
}

interface VendorActivity {
  id?: number;
  vendor: number | null;
  activity_type: string | null;
  timestamp: string | null;
  location: { lat: number, lng: number } | null;
  notes: string;
  related_order: number | null;
  quantity_assignes: number | null;
  quantity_sales: number | null;
}

const OrderManagement = () => {
  const [activeTab, setActiveTab] = useState<'received' | 'created'>('received');
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);
  const [pointsOfSale, setPointsOfSale] = useState<PointOfSale[]>([]);
  const [mobileVendors, setMobileVendors] = useState<MobileVendor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState<keyof Order>('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [newOrder, setNewOrder] = useState<NewOrder>({
    point_of_sale_id: null,
    status: null,
    total: null,
    date: new Date().toISOString().split('T')[0],
    delivery_date: '',
    priority: 'medium',
    notes: '',
    items: []
  });
  const [vendorActivity, setVendorActivity] = useState<VendorActivity>({
    vendor: null,
    activity_type: 'sale',
    timestamp: new Date().toISOString(),
    location: null,
    notes: '',
    related_order: null,
    quantity_assignes: null,
    quantity_sales: null
  });

  const theme = {
    primary: { light: '#EFF6FF', DEFAULT: '#3B82F6', dark: '#2563EB', text: '#1E40AF' },
    secondary: { light: '#F0FDF4', DEFAULT: '#10B981', dark: '#059669', text: '#065F46' },
    danger: { light: '#FEF2F2', DEFAULT: '#EF4444', dark: '#DC2626', text: '#991B1B' },
    warning: { light: '#FFFBEB', DEFAULT: '#F59E0B', dark: '#D97706', text: '#92400E' },
    success: { light: '#ECFDF5', DEFAULT: '#10B981', dark: '#059669', text: '#065F46' },
    gray: { light: '#F9FAFB', DEFAULT: '#6B7280', dark: '#374151', text: '#111827' }
  };

  const orderStatuses: Record<OrderStatus, { label: string; color: string; icon: any; bgColor: string; borderColor: string }> = {
    pending: { 
      label: 'En Attente', 
      color: `bg-amber-100 text-amber-800`, 
      icon: Clock,
      bgColor: theme.warning.light,
      borderColor: 'border-amber-200'
    },
    confirmed: { 
      label: 'Confirmée', 
      color: 'bg-blue-100 text-blue-800', 
      icon: CheckCircle,
      bgColor: theme.primary.light,
      borderColor: 'border-blue-200'
    },
    shipped: { 
      label: 'Expédiée', 
      color: 'bg-purple-100 text-purple-800', 
      icon: Truck,
      bgColor: '#F5F3FF',
      borderColor: 'border-purple-200'
    },
    delivered: { 
      label: 'Livrée', 
      color: 'bg-green-100 text-green-800', 
      icon: CheckCircle,
      bgColor: theme.success.light, 
      borderColor: 'border-green-200'
    },
    cancelled: { 
      label: 'Annulée', 
      color: 'bg-red-100 text-red-800', 
      icon: XCircle,
      bgColor: theme.danger.light,
      borderColor: 'border-red-200'
    }
  };

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('access');
      if (!token) {
        setError('Veuillez vous connecter.');
        return;
      }
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      try {
        setError(null);
        // Fetch Orders
        const ordersRes = await fetch('https://backendsupply.onrender.com/api/orders/', { headers });
        if (!ordersRes.ok) throw new Error('Échec de la récupération des commandes');
        const ordersData = await ordersRes.json();
        setOrders(ordersData);
        setFilteredOrders(ordersData);

        // Fetch Product Variants
        const variantsRes = await fetch('https://backendsupply.onrender.com/api/product-variants/', { headers });
        if (!variantsRes.ok) throw new Error('Échec de la récupération des variantes de produits');
        const variantsData = await variantsRes.json();
        setProductVariants(variantsData);

        // Fetch Points of Sale
        const pointsOfSaleRes = await fetch('https://backendsupply.onrender.com/api/points-vente/', { headers });
        if (!pointsOfSaleRes.ok) throw new Error('Échec de la récupération des points de vente');
        const pointsOfSaleData = await pointsOfSaleRes.json();
        setPointsOfSale(pointsOfSaleData);

        // Fetch Mobile Vendors
        const vendorsRes = await fetch('https://backendsupply.onrender.com/api/mobile-vendors/', { headers });
        if (vendorsRes.ok) {
          const vendorsData = await vendorsRes.json();
          setMobileVendors(vendorsData);
        }
      } catch (error: any) {
        setError(error.message);
      }
    };
    fetchData();
  }, []);

  // Filter and sort orders
  useEffect(() => {
    let filtered = orders.filter(order => {
      const pointOfSaleName = order.point_of_sale_details?.name?.toLowerCase() || '';
      const pointOfSaleAddress = order.point_of_sale_details?.address?.toLowerCase() || '';
      
      const matchesSearch = order.id.toString().includes(searchTerm.toLowerCase()) ||
                           pointOfSaleName.includes(searchTerm.toLowerCase()) ||
                           pointOfSaleAddress.includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesDate = dateFilter === 'all' || 
                         (dateFilter === 'today' && order.date && isToday(order.date)) ||
                         (dateFilter === 'week' && order.date && isThisWeek(order.date)) ||
                         (dateFilter === 'month' && order.date && isThisMonth(order.date));
      return matchesSearch && matchesStatus && matchesDate;
    });

    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      switch (sortBy) {
        case 'date':
          aValue = a.date ? new Date(a.date).getTime() : 0;
          bValue = b.date ? new Date(b.date).getTime() : 0;
          break;
        case 'total':
          aValue = parseFloat(a.total) || 0;
          bValue = parseFloat(b.total) || 0;
          break;
        case 'point_of_sale':
          aValue = a.point_of_sale_details?.name?.toLowerCase() || '';
          bValue = b.point_of_sale_details?.name?.toLowerCase() || '';
          break;
        default:
          aValue = a[sortBy as keyof Order] ?? '';
          bValue = b[sortBy as keyof Order] ?? '';
          if (typeof aValue === 'string') aValue = aValue.toLowerCase();
          if (typeof bValue === 'string') bValue = bValue.toLowerCase();
      }

      if (aValue === undefined || aValue === null) return sortOrder === 'asc' ? -1 : 1;
      if (bValue === undefined || bValue === null) return sortOrder === 'asc' ? 1 : -1;

      return sortOrder === 'asc'
        ? aValue > bValue ? 1 : aValue < bValue ? -1 : 0
        : aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    });

    setFilteredOrders(filtered);
    setCurrentPage(1);
  }, [orders, searchTerm, statusFilter, dateFilter, sortBy, sortOrder]);

  // Date utilities
  const isToday = (dateString: string) => {
    if (!dateString) return false;
    const today = new Date().toDateString();
    const date = new Date(dateString).toDateString();
    return today === date;
  };

  const isThisWeek = (dateString: string) => {
    if (!dateString) return false;
    const now = new Date();
    const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    const date = new Date(dateString);
    return date >= weekAgo && date <= now;
  };

  const isThisMonth = (dateString: string) => {
    if (!dateString) return false;
    const now = new Date();
    const date = new Date(dateString);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  };

  // Order selection
  const handleSelectOrder = (orderId: number) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(order => order.id));
    }
  };

  // Order actions
  const updateOrderStatus = async (orderId: number, newStatus: OrderStatus) => {
    const token = localStorage.getItem('access');
    if (!token) {
      setError('Veuillez vous connecter.');
      return;
    }
    try {
      setError(null);
      const res = await fetch(`https://backendsupply.onrender.com/api/orders/${orderId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Échec de la mise à jour du statut');
      }
      const updatedOrder = await res.json();
      setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
    } catch (error: any) {
      setError(error.message);
    }
  };

  const deleteOrder = async (orderId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) return;
    const token = localStorage.getItem('access');
    if (!token) {
      setError('Veuillez vous connecter.');
      return;
    }
    try {
      setError(null);
      const res = await fetch(`https://backendsupply.onrender.com/api/orders/${orderId}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Échec de la suppression de la commande');
      }
      setOrders(prev => prev.filter(o => o.id !== orderId));
      setSelectedOrders(prev => prev.filter(id => id !== orderId));
    } catch (error: any) {
      setError(error.message);
    }
  };

  const bulkStatusUpdate = async (newStatus: OrderStatus) => {
    const token = localStorage.getItem('access');
    if (!token) {
      setError('Veuillez vous connecter.');
      return;
    }
    try {
      setError(null);
      const promises = selectedOrders.map(orderId => 
        fetch(`https://backendsupply.onrender.com/api/orders/${orderId}/`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: newStatus })
        })
      );

      await Promise.all(promises);
      setOrders(prev => prev.map(o => 
        selectedOrders.includes(o.id) ? { ...o, status: newStatus } : o
      ));
      setSelectedOrders([]);
    } catch (error: any) {
      setError(error.message);
    }
  };

  // Vendor assignment functions
  const handleAssignProduct = (order: Order, item: OrderItem) => {
    setSelectedOrder(order);
    setSelectedItem(item);
    setVendorActivity({
      vendor: null,
      activity_type: 'sale',
      timestamp: new Date().toISOString(),
      location: null,
      notes: '',
      related_order: order.id,
      quantity_assignes: item.quantity,
      quantity_sales: 0
    });
    setShowAssignModal(true);
  };

  const handleVendorAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('access');
    if (!token) {
      setError('Veuillez vous connecter.');
      return;
    }

    try {
      setError(null);
      
      if (!vendorActivity.vendor) {
        throw new Error("Veuillez sélectionner un vendeur");
      }

      if (!vendorActivity.quantity_assignes || vendorActivity.quantity_assignes <= 0) {
        throw new Error("Veuillez spécifier une quantité valide");
      }

      if (selectedItem && vendorActivity.quantity_assignes > selectedItem.quantity) {
        throw new Error("La quantité affectée ne peut pas dépasser la quantité commandée");
      }

      const response = await fetch('https://backendsupply.onrender.com/api/vendor-activities/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(vendorActivity)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || JSON.stringify(errorData));
      }

      // Succès
      setShowAssignModal(false);
      setSelectedItem(null);
      setSelectedOrder(null);
      alert('Produit affecté avec succès au vendeur!');

    } catch (error: any) {
      setError(error.message);
      console.error("Erreur affectation produit:", error);
    }
  };

  const handleAddOrderItem = () => {
    setNewOrder(prev => ({
      ...prev,
      items: [...prev.items, { product_variant_id: 0, quantity: 1, price: "0" }]
    }));
  };

  const handleRemoveOrderItem = (index: number) => {
    setNewOrder(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleOrderItemChange = (index: number, field: keyof NewOrderItem, value: any) => {
    setNewOrder(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      
      if (field === 'product_variant_id') {
        const variant = productVariants.find(v => v.id === value);
        if (variant) {
          newItems[index].price = variant.price;
        }
      }
      
      return { ...prev, items: newItems };
    });
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('access');
    if (!token) {
      setError('Veuillez vous connecter.');
      return;
    }

    try {
      setError(null);
      
      // Validation des articles
      if (newOrder.items.length === 0) {
        throw new Error("Veuillez ajouter au moins un article");
      }

      if (!newOrder.point_of_sale_id) {
        throw new Error("Veuillez sélectionner un point de vente");
      }

      // Préparation des articles
      const preparedItems = newOrder.items.map(item => {
        const variant = productVariants.find(v => v.id === item.product_variant_id);
        if (!variant) {
          throw new Error("Variante de produit non trouvée");
        }
        if ((variant.current_stock || 0) < item.quantity) {
          throw new Error(`Stock insuffisant pour ${variant.product?.name || 'le produit sélectionné'}`);
        }

        return {
          product_variant_id: variant.id,
          quantity: item.quantity
        };
      });

      // Construction de la commande
      const orderData = {
        point_of_sale: newOrder.point_of_sale_id,
        date: newOrder.date,
        delivery_date: newOrder.delivery_date,
        priority: newOrder.priority,
        notes: newOrder.notes,
        items: preparedItems
      };

      // Envoi de la requête
      const response = await fetch('https://backendsupply.onrender.com/api/orders/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || JSON.stringify(errorData));
      }

      // Succès
      const createdOrder = await response.json();
      setOrders(prev => [createdOrder, ...prev]);
      resetOrderForm();
      setShowAddModal(false);

    } catch (error: any) {
      setError(error.message);
      console.error("Erreur création commande:", error);
    }
  };

  const resetOrderForm = () => {
    setNewOrder({
      point_of_sale_id: null,
      status: null,
      total: null,
      date: new Date().toISOString().split('T')[0],
      delivery_date: '',
      priority: 'medium',
      notes: '',
      items: []
    });
  };

  // Pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(parseFloat(amount));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-amber-500';
      case 'low': return 'text-emerald-500';
      default: return 'text-gray-500';
    }
  };

  const OrderDetailsModal = () => {
    if (!selectedOrder) return null;
    const statusInfo = orderStatuses[selectedOrder.status];
    const pointOfSaleName = selectedOrder.point_of_sale_details?.name || 'Point de vente inconnu';

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-800">Détails de la Commande</h3>
              <p className="text-gray-600">Commande #{selectedOrder.id}</p>
            </div>
            <button 
              onClick={() => setShowDetailsModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle size={24} />
            </button>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className={`p-4 rounded-lg border ${statusInfo.borderColor} ${statusInfo.bgColor}`}>
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <MapPin className="mr-2" size={16} />
                  Informations Point de Vente
                </h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Nom:</strong> {pointOfSaleName}</p>
                  <p><strong>Propriétaire:</strong> {selectedOrder.point_of_sale_details?.owner || 'Non spécifié'}</p>
                  <p><strong>Email:</strong> {selectedOrder.point_of_sale_details?.email || 'Non spécifié'}</p>
                  <p><strong>Téléphone:</strong> {selectedOrder.point_of_sale_details?.phone || 'Non spécifié'}</p>
                  <p><strong>Adresse:</strong> {selectedOrder.point_of_sale_details?.address || 'Non spécifié'}</p>
                </div>
              </div>
              <div className={`p-4 rounded-lg border ${statusInfo.borderColor} ${statusInfo.bgColor}`}>
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <Package className="mr-2" size={16} />
                  Informations Commande
                </h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Date:</strong> {selectedOrder.date ? new Date(selectedOrder.date).toLocaleDateString('fr-FR') : 'Non spécifiée'}</p>
                  <p><strong>Livraison prévue:</strong> {selectedOrder.delivery_date ? new Date(selectedOrder.delivery_date).toLocaleDateString('fr-FR') : 'Non spécifiée'}</p>
                  <p><strong>Statut:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${statusInfo.color}`}>
                      {React.createElement(statusInfo.icon, { size: 12, className: "mr-1 inline" })}
                      {statusInfo.label}
                    </span>
                  </p>
                  <p><strong>Priorité:</strong> 
                    <Star className={`inline ml-2 ${getPriorityColor(selectedOrder.priority)}`} size={16} />
                    <span className={`ml-1 ${getPriorityColor(selectedOrder.priority)} font-medium`}>
                      {selectedOrder.priority === 'high' ? 'Haute' : 
                       selectedOrder.priority === 'medium' ? 'Moyenne' : 'Basse'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Articles Commandés</h4>
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Produit</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Format</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Quantité</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Prix Unitaire</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Total</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedOrder.items.map((item, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 text-sm text-gray-800">{item.product_name || item.product_variant?.product?.name || 'Produit inconnu'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.product_variant?.format?.name || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-center">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">{formatCurrency(item.price)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-800 text-right">{formatCurrency(item.total)}</td>
                        <td className="px-4 py-3 text-sm text-center">
                          <button
                            onClick={() => handleAssignProduct(selectedOrder, item)}
                            className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center gap-1 text-xs"
                          >
                            <Target size={12} />
                            Affecter
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-sm font-bold text-gray-800 text-right">Total Commande:</td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-800 text-right">{formatCurrency(selectedOrder.total)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            {selectedOrder.notes && (
              <div className={`p-4 py-3 rounded-lg border ${statusInfo.borderColor} ${statusInfo.bgColor}`}>
                <h4 className="font-semibold text-gray-800 mb-2">Notes</h4>
                <p className="text-sm font-medium text-gray-600">{selectedOrder.notes}</p>
              </div>
            )}
            <div className="flex items-center justify-between flex-wrap gap-3 pt-4 border-t border-gray-200">
              <select 
                value={selectedOrder.status}
                onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value as OrderStatus)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                {Object.entries(orderStatuses).map(([key, status]) => (
                  <option key={key} value={key}>{status.label}</option>
                ))}
              </select>
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-between gap-2">
                <Edit size={16} />
                Modifier
              </button>
              <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-between gap-2">
                <Download size={16} />
                Imprimer
              </button>
              <button 
                onClick={() => deleteOrder(selectedOrder.id)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-between gap-2">
                <Trash2 size={16} />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const AssignVendorModal = () => {
    if (!selectedItem || !selectedOrder) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-800">Affecter un produit à un vendeur</h3>
              <p className="text-gray-600">Commande #{selectedOrder.id} - {selectedItem.product_name || selectedItem.product_variant?.product?.name || 'Produit inconnu'}</p>
            </div>
            <button 
              onClick={() => setShowAssignModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle size={24} />
            </button>
          </div>
          <div className="p-6">
            <form onSubmit={handleVendorAssignment} className="space-y-4">
              {error && (
                <div className="text-red-600 bg-red-100 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Users className="inline w-4 h-4 mr-2" />
                  Vendeur ambulant *
                </label>
                <select
                  required
                  value={vendorActivity.vendor || ''}
                  onChange={(e) => setVendorActivity({...vendorActivity, vendor: parseInt(e.target.value) || null})}
                  className="w-full px-4 py-2 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Sélectionner un vendeur</option>
                  {mobileVendors.map(vendor => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.full_name} - {vendor.phone || 'Téléphone non spécifié'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type d'activité *
                </label>
                <select
                  required
                  value={vendorActivity.activity_type || ''}
                  onChange={(e) => setVendorActivity({...vendorActivity, activity_type: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="sale">Vente</option>
                  <option value="stock_replenishment">Réapprovisionnement</option>
                  <option value="check_in">Check-in</option>
                  <option value="check_out">Check-out</option>
                  <option value="incident">Incident</option>
                  <option value="other">Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Quantité à affecter *
                </label>
                <input 
                  type="number"
                  required
                  min="1"
                  max={selectedItem.quantity}
                  value={vendorActivity.quantity_assignes || ''}
                  onChange={(e) => setVendorActivity({...vendorActivity, quantity_assignes: parseInt(e.target.value) || null})}
                  className="w-full px-4 py-2 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Quantité maximale disponible: {selectedItem.quantity}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes
                </label>
                <textarea 
                  value={vendorActivity.notes}
                  onChange={(e) => setVendorActivity({...vendorActivity, notes: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  rows={3}
                  placeholder="Notes supplémentaires..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Affecter
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {error && (
        <div className="p-4 bg-red-100 text-red-600 text-center rounded-lg">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-sm border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Total Commandes</p>
              <p className="text-2xl font-bold text-blue-600">{orders.length}</p>
            </div>
            <Package className="text-blue-500" size={24} />
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-xl shadow-sm border border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-800">En Attente</p>
              <p className="text-2xl font-bold text-amber-600">{orders.filter(o => o.status === 'pending').length}</p>
            </div>
            <Clock className="text-amber-500" size={24} />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-sm border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Livrées</p>
              <p className="text-2xl font-bold text-green-600">{orders.filter(o => o.status === 'delivered').length}</p>
            </div>
            <CheckCircle className="text-green-500" size={24} />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-sm border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-800">Chiffre d'Affaires</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(orders.reduce((sum, order) => sum + parseFloat(order.total), 0).toString())}
              </p>
            </div>
            <DollarSign className="text-purple-500" size={24} />
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={`px-4 py-2 font-medium flex items-center gap-2 ${activeTab === 'received' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('received')}
        >
          <List size={18} />
          Commandes Reçues
        </button>
        <button
          className={`px-4 py-2 font-medium flex items-center gap-2 ${activeTab === 'created' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('created')}
        >
          <ShoppingCart size={18} />
          Créer une Commande
        </button>
      </div>
      
      {activeTab === 'received' ? (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text"
                placeholder="Rechercher une commande..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="all">Tous les statuts</option>
                {Object.entries(orderStatuses).map(([key, status]) => (
                  <option key={key} value={key}>{status.label}</option>
                ))}
              </select>

              <select 
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="all">Toutes les dates</option>
                <option value="today">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
              </select>

              <select 
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field as keyof Order);
                  setSortOrder(order);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="date-desc">Date (Plus récente)</option>
                <option value="date-asc">Date (Plus ancienne)</option>
                <option value="total-desc">Total (Plus élevé)</option>
                <option value="total-asc">Total (Plus bas)</option>
                <option value="point_of_sale-asc">Point de vente (A-Z)</option>
                <option value="point_of_sale-desc">Point de vente (Z-A)</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-md">
                <Plus size={16} />
                Nouvelle Commande
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-md">
                <Download size={16} />
                Exporter
              </button>
            </div>
          </div>

          {selectedOrders.length > 0 && (
            <div className="mt-4 p-4 bg-blue-100 rounded-lg border border-blue-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between items-center gap-3">
                <div className="text-sm font-medium text-blue-800">
                  <span className="text-sm">{selectedOrders.length} commande(s) sélectionnée(s)</span>
                </div>
                <div className="flex gap-2">
                  <select 
                    onChange={(e) => {
                      if (e.target.value) {
                        bulkStatusUpdate(e.target.value as OrderStatus);
                        e.target.value = '';
                      }
                    }}
                    className="px-3 py-1 text-sm border border-blue-300 rounded-lg focus:outline-none focus:ring-blue-500 bg-white">
                    <option value="">Changer le statut</option>
                    {Object.entries(orderStatuses).map(([key, status]) => (
                      <option key={key} value={key}>{status.label}</option>
                    ))}
                  </select>
                  <button 
                    onClick={() => setSelectedOrders([])}
                    className="px-3 py-1 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600">
                    Désélectionner
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input 
                        type="checkbox"
                        checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                        onChange={() => handleSelectAll()}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium font-semibold">Commande</th>
                    <th className="px-6 py-4 text-left text-sm font-medium">Point de Vente</th>
                    <th className="px-6 py-4 text-center text-sm font-medium">Date</th>
                    <th className="px-6 py-4 text-center text-sm font-medium">Statut</th>
                    <th className="px-6 py-4 text-center text-sm font-medium">Priority</th>
                    <th className="px-6 py-4 text-right text-sm font-medium">Total</th>
                    <th className="px-6 py-4 text-center text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentOrders.length > 0 ? (
                    currentOrders.map((order) => {
                      const statusInfo = orderStatuses[order.status];
                      const pointOfSaleName = order.point_of_sale_details?.name || 'Point de vente inconnu';
                      
                      return (
                        <tr 
                          key={order.id} 
                          className={`hover:bg-gray-50 transition-colors ${selectedOrders.includes(order.id) ? 'bg-blue-50' : ''}`}>
                          <td className="px-6 py-4">
                            <input 
                              type="checkbox"
                              checked={selectedOrders.includes(order.id)}
                              onChange={() => handleSelectOrder(order.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-semibold text-gray-800">{order.id}</div>
                              <div className="text-sm text-gray-500">{order.items.length} article(s)</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-semibold text-gray-800">{pointOfSaleName}</div>
                              <div className="text-sm text-gray-500">{order.point_of_sale_details?.address || ''}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600">
                              {order.date ? new Date(order.date).toLocaleDateString('fr-FR') : 'Non spécifiée'}
                            </div>
                            <div className="text-xs text-gray-500">
                              Livraison: {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('fr-FR') : 'Non spécifiée'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-4 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                              {React.createElement(statusInfo.icon, { size: 12, className: "mr-1" })}
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <Star className={getPriorityColor(order.priority)} size={16} />
                              <span className="ml-1 text-xs font-medium text-gray-600">
                                {order.priority === 'high' ? 'Haute' : 
                                 order.priority === 'medium' ? 'Moyenne' : 'Basse'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="font-semibold text-gray-800">{formatCurrency(order.total)}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center space-x-2">
                              <button 
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setShowDetailsModal(true);
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Voir détails"
                              >
                                <Eye size={16} />
                              </button>
                              <button 
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Modifier"
                              >
                                <Edit size={16} />
                              </button>
                              <button 
                                onClick={() => deleteOrder(order.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-24 text-center">
                        <Package className="mx-auto text-gray-400 mb-4" size={48} />
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Aucune commande trouvée</h3>
                        <p className="text-gray-600 mb-6">
                          {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' 
                            ? 'Aucune commande ne correspond aux critères.'
                            : 'Commencez par créer votre première commande.'}
                        </p>
                        {(!searchTerm && statusFilter === 'all' && dateFilter === 'all') && (
                          <button 
                            onClick={() => setShowAddModal(true)}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2 shadow-md">
                            <Plus size={16} />
                            Créer une Commande
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Affichage de <span className="font-semibold">{indexOfFirstOrder + 1}</span> à <span>{Math.min(indexOfLastOrder, filteredOrders.length)}</span> sur {filteredOrders.length} commandes
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
                    Précédent
                  </button>
                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;
                    if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 text-sm border rounded-md ${
                            currentPage === page ? 
                            'bg-blue-500 text-white border-blue-500' : 
                            'border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="text-gray-600">...</span>;
                    }
                    return null;
                  })}
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Créer une nouvelle commande</h2>
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-md">
              <Plus size={16} />
              Nouvelle Commande
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {productVariants.map(variant => (
              <div key={variant.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{variant.product?.name || 'Produit inconnu'}</h3>
                    <p className="text-gray-600">{variant.format?.name || 'Sans format'}</p>
                  </div>
                  {variant.image && (
                    <img 
                      src={variant.image} 
                      alt={`${variant.product?.name || 'Produit'} ${variant.format?.name || ''}`}
                      className="w-16 h-16 object-contain"
                    />
                  )}
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Prix:</span>
                    <span className="font-semibold ml-2">{formatCurrency(variant.price)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Stock:</span>
                    <span className={`font-semibold ml-2 ${
                      (variant.current_stock || 0) <= (variant.min_stock || 0) ? 'text-red-500' : 
                      (variant.current_stock || 0) >= (variant.max_stock || 0) ? 'text-green-500' : 'text-gray-700'
                    }`}>
                      {variant.current_stock || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Stock min:</span>
                    <span className="font-semibold ml-2">{variant.min_stock || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Stock max:</span>
                    <span className="font-semibold ml-2">{variant.max_stock || 0}</span>
                  </div>
                </div>
                
                <div className="mt-4">
                  <button 
                    onClick={() => {
                      setShowAddModal(true);
                      setNewOrder(prev => ({
                        ...prev,
                        items: [...prev.items, { 
                          product_variant_id: variant.id, 
                          quantity: 1, 
                          price: variant.price 
                        }]
                      }));
                    }}
                    className="w-full py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    Ajouter à la commande
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b bg-blue-50">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-semibold text-gray-800">Nouvelle Commande</h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-700 transition-colors">
                  <XCircle size={24} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <form onSubmit={handleCreateOrder} className="space-y-6">
                {error && (
                  <div className="text-red-600 bg-red-200 p-3 rounded-lg">
                    {error}
                  </div>
                )}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="col-span-full">
                    <label className="block text-sm font-semibold text-gray-600 mb-2">
                      <MapPin className="inline w-4 h-4 mr-2" />
                      Point de vente *
                    </label>
                    <select
                      required
                      value={newOrder.point_of_sale_id || ''}
                      onChange={(e) => setNewOrder({...newOrder, point_of_sale_id: parseInt(e.target.value) || null})}
                      className="w-full px-4 py-2 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Sélectionner un point de vente</option>
                      {pointsOfSale.map(pos => (
                        <option key={pos.id} value={pos.id}>
                          {pos.name} - {pos.address || 'Adresse non spécifiée'}
                        </option>
                      ))}
                    </select>
                  </div>
            
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Star className="inline w-4 h-4 mr-2" />
                      Priorité *
                    </label>
                    <select 
                      value={newOrder.priority}
                      onChange={(e) => setNewOrder({...newOrder, priority: e.target.value as 'low' | 'medium' | 'high'})}
                      className="w-full px-4 py-2 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                      <option value="low">Basse</option>
                      <option value="medium">Moyenne</option>
                      <option value="high">Haute</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">
                      <Calendar className="inline w-4 h-4 mr-2" />
                      Date de Commande *
                    </label>
                    <input 
                      type="date"
                      required
                      value={newOrder.date}
                      onChange={(e) => setNewOrder({...newOrder, date: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">
                      <Calendar className="inline w-4 h-4 mr-2" />
                      Date de Livraison *
                    </label>
                    <input 
                      type="date"
                      required
                      value={newOrder.delivery_date}
                      onChange={(e) => setNewOrder({...newOrder, delivery_date: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>
                <div className="col-span-full">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Package className="inline w-4 h-4 mr-2" />
                    Articles à commander
                  </label>
                  <div className="border rounded-lg p-4 border-gray-300 space-y-4">
                    <div className="grid grid-cols-12 gap-2 text-sm font-semibold text-gray-700">
                      <div className="col-span-5">Produit</div>
                      <div className="col-span-2">Format</div>
                      <div className="col-span-2">Quantité</div>
                      <div className="col-span-2">Prix Unitaire</div>
                      <div className="col-span-1">Total</div>
                    </div>
                    {newOrder.items.map((item, index) => {
                      const variant = productVariants.find(v => v.id === item.product_variant_id);
                      return (
                        <div key={index} className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-5">
                            <select 
                              required
                              value={item.product_variant_id}
                              onChange={(e) => handleOrderItemChange(index, 'product_variant_id', parseInt(e.target.value))}
                              className="w-full text-sm border px-4 py-2 rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                              <option value="0">Sélectionner un produit</option>
                              {productVariants.map(v => (
                                <option key={v.id} value={v.id}>
                                  {v.product?.name || 'Produit inconnu'} - {v.format?.name || 'Sans format'}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-span-2 text-sm text-gray-600">
                            {variant?.format?.name || '-'}
                          </div>
                          <div className="col-span-2">
                            <input 
                              type="number"
                              required
                              min="1"
                              max={variant?.current_stock || 1}
                              value={item.quantity}
                              onChange={(e) => handleOrderItemChange(index, 'quantity', parseInt(e.target.value))}
                              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              placeholder="Qty"
                            />
                          </div>
                          <div className="col-span-2">
                            <input 
                              type="text"
                              readOnly
                              value={formatCurrency(item.price)}
                              className="w-full px-4 py-2 text-sm border text-gray-600 bg-gray-100 rounded-lg"
                            />
                          </div>
                          <div className="col-span-1 flex items-center text-sm font-semibold text-gray-800">
                            {formatCurrency((parseFloat(item.price) * item.quantity).toString())}
                            <button 
                              type="button"
                              onClick={() => handleRemoveOrderItem(index)}
                              className="ml-2 text-red-600 hover:text-red-700">
                              <XCircle size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    <button 
                      type="button"
                      onClick={handleAddOrderItem}
                      className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-gray-700 hover:border-gray-400 transition-colors bg-white">
                      + Ajouter un article
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea 
                    value={newOrder.notes}
                    onChange={(e) => setNewOrder({...newOrder, notes: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    rows={3}
                    placeholder="Instructions spéciales..."
                  />
                </div>
                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
                    Annuler
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md">
                    Créer la Commande
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {showDetailsModal && <OrderDetailsModal />}
      {showAssignModal && <AssignVendorModal />}
    </div>
  );
};

export default OrderManagement;