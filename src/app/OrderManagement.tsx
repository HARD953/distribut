import React, { useState, useEffect } from 'react';
import { 
  Package, Search, Filter, Eye, Edit, Trash2, Plus, 
  Calendar, MapPin, User, Phone, Mail, CheckCircle, 
  Clock, AlertCircle, XCircle, Truck, DollarSign,
  Download, RefreshCw, ChevronDown, ChevronUp, Star, List, ShoppingCart,
  Users, Target, BarChart3, TrendingUp, FileText
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
  role?: {
    id: number;
    name: string;
    createcommande: boolean;
    vuecommande: boolean;
    // autres permissions
  };
  status?: string;
  avatar?: string | null;
  points_of_sale?: string[];
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
  quantity_affecte: string;
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
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
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editingItems, setEditingItems] = useState<NewOrderItem[]>([]);
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

  // Thème moderne avec couleurs professionnelles
  const theme = {
    primary: { 
      light: '#EEF2FF', 
      DEFAULT: '#4F46E5', 
      dark: '#4338CA', 
      text: '#3730A3',
      gradient: 'linear-gradient(135deg, #4F46E5 0%, #7C73E6 100%)'
    },
    secondary: { 
      light: '#F0FDF9', 
      DEFAULT: '#0D9488', 
      dark: '#0F766E', 
      text: '#134E4A' 
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

  const orderStatuses: Record<OrderStatus, { label: string; color: string; icon: any; bgColor: string; borderColor: string }> = {
    pending: { 
      label: 'En Attente', 
      color: `text-amber-700`, 
      icon: Clock,
      bgColor: theme.warning.light,
      borderColor: 'border-amber-200'
    },
    confirmed: { 
      label: 'Confirmée', 
      color: 'text-blue-700', 
      icon: CheckCircle,
      bgColor: theme.primary.light,
      borderColor: 'border-blue-200'
    },
    shipped: { 
      label: 'Expédiée', 
      color: 'text-indigo-700', 
      icon: Truck,
      bgColor: '#F5F3FF',
      borderColor: 'border-indigo-200'
    },
    delivered: { 
      label: 'Livrée', 
      color: 'text-emerald-700', 
      icon: CheckCircle,
      bgColor: theme.success.light, 
      borderColor: 'border-emerald-200'
    },
    cancelled: { 
      label: 'Annulée', 
      color: 'text-red-700', 
      icon: XCircle,
      bgColor: theme.error.light,
      borderColor: 'border-red-200'
    }
  };

  // Fetch user profile and initial data
  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem('access');
      if (!token) {
        setError('Veuillez vous connecter.');
        setLoading(false);
        return;
      }
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      try {
        setError(null);
        
        // Fetch user profile
        const profileRes = await fetch('https://api.lanfialink.com/api/me/', { headers });
        if (!profileRes.ok) throw new Error('Échec de la récupération du profil utilisateur');
        const profileData = await profileRes.json();
        setUserProfile(profileData);

        // Set default active tab based on permissions
        if (profileData.role?.vuecommande && !profileData.role?.createcommande) {
          setActiveTab('received');
        } else if (!profileData.role?.vuecommande && profileData.role?.createcommande) {
          setActiveTab('created');
        }

        // Fetch Orders only if user has permission to view
        if (profileData.role?.vuecommande) {
          const ordersRes = await fetch('https://api.lanfialink.com/api/orders/', { headers });
          if (!ordersRes.ok) throw new Error('Échec de la récupération des commandes');
          const ordersData = await ordersRes.json();
          setOrders(ordersData);
          setFilteredOrders(ordersData);
        }

        // Fetch Product Variants (both views need this)
        const variantsRes = await fetch('https://api.lanfialink.com/api/product-variants/', { headers });
        if (!variantsRes.ok) throw new Error('Échec de la récupération des variantes de produits');
        const variantsData = await variantsRes.json();
        setProductVariants(variantsData);

        // Fetch Points of Sale (both views need this)
        const pointsOfSaleRes = await fetch('https://api.lanfialink.com/api/points-vente/', { headers });
        if (!pointsOfSaleRes.ok) throw new Error('Échec de la récupération des points de vente');
        const pointsOfSaleData = await pointsOfSaleRes.json();
        setPointsOfSale(pointsOfSaleData);

        // Fetch Mobile Vendors
        const vendorsRes = await fetch('https://api.lanfialink.com/api/mobile-vendors/', { headers });
        if (vendorsRes.ok) {
          const vendorsData = await vendorsRes.json();
          setMobileVendors(vendorsData);
        }
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
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
      const res = await fetch(`https://api.lanfialink.com/api/orders/${orderId}/`, {
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
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleEditOrder = (order: Order) => {
    if (!userProfile?.role?.createcommande) {
      setError('Vous n\'avez pas la permission de modifier les commandes');
      return;
    }
    setEditingOrder(order);
    // Convertir les items existants en format NewOrderItem
    const convertedItems: NewOrderItem[] = order.items.map(item => ({
      product_variant_id: item.product_variant?.id || 0,
      quantity: item.quantity,
      price: item.price
    }));
    setEditingItems(convertedItems);
    setShowEditModal(true);
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    const token = localStorage.getItem('access');
    if (!token) {
      setError('Veuillez vous connecter.');
      return;
    }

    try {
      setError(null);
      
      // Validation des articles
      if (editingItems.length === 0) {
        throw new Error("Veuillez ajouter au moins un article");
      }

      // Préparer les données pour l'API
      const orderData = {
        point_of_sale: editingOrder.point_of_sale,
        date: editingOrder.date,
        delivery_date: editingOrder.delivery_date,
        priority: editingOrder.priority,
        status: editingOrder.status,
        notes: editingOrder.notes,
        items: editingItems.map(item => ({
          product_variant_id: item.product_variant_id,
          quantity: item.quantity
        }))
      };

      const res = await fetch(`https://api.lanfialink.com/api/orders/${editingOrder.id}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || JSON.stringify(errorData));
      }

      const updatedOrder = await res.json();
      setOrders(prev => prev.map(o => o.id === editingOrder.id ? updatedOrder : o));
      setShowEditModal(false);
      setEditingOrder(null);
      setEditingItems([]);
    } catch (error: any) {
      setError(error.message);
      console.error("Erreur modification commande:", error);
    }
  };

  const handlePrintOrder = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setError('Impossible d\'ouvrir la fenêtre d\'impression. Vérifiez les bloqueurs de pop-up.');
      return;
    }

    const statusInfo = orderStatuses[order.status];
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Commande #${order.id}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          body { font-family: 'Inter', sans-serif; margin: 20px; background: #fff; }
          .header { text-align: center; border-bottom: 2px solid #4F46E5; padding-bottom: 20px; margin-bottom: 20px; }
          .order-info { margin-bottom: 20px; }
          .table { width: 100%; border-collapse: collapse; margin: 20px 0; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .table th, .table td { border: 1px solid #E5E7EB; padding: 12px; text-align: left; }
          .table th { background-color: #4F46E5; color: white; font-weight: 600; }
          .total { font-weight: 600; text-align: right; background: #F9FAFB; }
          .status { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="color: #4F46E5; margin: 0; font-weight: 700;">Commande #${order.id}</h1>
          <p style="color: #6B7280; margin: 8px 0 0 0;">Date: ${order.date ? new Date(order.date).toLocaleDateString('fr-FR') : 'Non spécifiée'}</p>
        </div>
        
        <div class="order-info">
          <h2 style="color: #374151; border-bottom: 1px solid #E5E7EB; padding-bottom: 8px;">Informations de la commande</h2>
          <p><strong>Point de vente:</strong> ${order.point_of_sale_details?.name || 'Non spécifié'}</p>
          <p><strong>Statut:</strong> <span class="status" style="background-color: ${statusInfo.bgColor}; color: ${statusInfo.color};">${statusInfo.label}</span></p>
          <p><strong>Priorité:</strong> ${order.priority === 'high' ? 'Haute' : order.priority === 'medium' ? 'Moyenne' : 'Basse'}</p>
          <p><strong>Date de livraison:</strong> ${order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('fr-FR') : 'Non spécifiée'}</p>
        </div>

        <h2 style="color: #374151; border-bottom: 1px solid #E5E7EB; padding-bottom: 8px;">Articles commandés</h2>
        <table class="table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Quantité</th>
              <th>Prix unitaire</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td>${item.product_name || item.product_variant?.product?.name || 'Produit inconnu'}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.price)}</td>
                <td>${formatCurrency(item.total)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" class="total">Total:</td>
              <td class="total">${formatCurrency(order.total)}</td>
            </tr>
          </tfoot>
        </table>

        ${order.notes ? `
        <div class="notes">
          <h2 style="color: #374151; border-bottom: 1px solid #E5E7EB; padding-bottom: 8px;">Notes</h2>
          <p style="background: #F9FAFB; padding: 12px; border-radius: 6px; border-left: 4px solid #4F46E5;">${order.notes}</p>
        </div>
        ` : ''}

        <div class="no-print" style="margin-top: 30px; text-align: center; padding-top: 20px; border-top: 1px solid #E5E7EB;">
          <button onclick="window.print()" style="padding: 12px 24px; background: #4F46E5; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
            Imprimer
          </button>
          <button onclick="window.close()" style="padding: 12px 24px; background: #6B7280; color: white; border: none; border-radius: 6px; cursor: pointer; margin-left: 10px; font-weight: 500;">
            Fermer
          </button>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
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
      const res = await fetch(`https://api.lanfialink.com/api/orders/${orderId}/`, {
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
        fetch(`https://api.lanfialink.com/api/orders/${orderId}/`, {
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

      const response = await fetch('https://api.lanfialink.com/api/vendor-activities/', {
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

  // Fonctions pour gérer les items dans la modification
  const handleAddEditingItem = () => {
    setEditingItems(prev => [...prev, { product_variant_id: 0, quantity: 1, price: "0" }]);
  };

  const handleRemoveEditingItem = (index: number) => {
    setEditingItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditingItemChange = (index: number, field: keyof NewOrderItem, value: any) => {
    setEditingItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      
      if (field === 'product_variant_id') {
        const variant = productVariants.find(v => v.id === value);
        if (variant) {
          newItems[index].price = variant.price;
        }
      }
      
      return newItems;
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
      
      if (newOrder.items.length === 0) {
        throw new Error("Veuillez ajouter au moins un article");
      }

      if (!newOrder.point_of_sale_id) {
        throw new Error("Veuillez sélectionner un point de vente");
      }

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

      const orderData = {
        point_of_sale: newOrder.point_of_sale_id,
        date: newOrder.date,
        delivery_date: newOrder.delivery_date,
        priority: newOrder.priority,
        notes: newOrder.notes,
        items: preparedItems
      };

      const response = await fetch('https://api.lanfialink.com/api/orders/', {
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
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-white">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Détails de la Commande</h3>
              <p className="text-gray-600 mt-1">Commande #{selectedOrder.id}</p>
            </div>
            <button 
              onClick={() => setShowDetailsModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            >
              <XCircle size={24} />
            </button>
          </div>
          <div className="p-8 space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className={`p-6 rounded-xl border ${statusInfo.borderColor} ${statusInfo.bgColor}`}>
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center text-lg">
                  <MapPin className="mr-3 text-indigo-600" size={20} />
                  Informations Point de Vente
                </h4>
                <div className="space-y-3 text-sm">
                  <p className="flex justify-between"><span className="text-gray-600">Nom:</span> <span className="font-medium">{pointOfSaleName}</span></p>
                  <p className="flex justify-between"><span className="text-gray-600">Propriétaire:</span> <span className="font-medium">{selectedOrder.point_of_sale_details?.owner || 'Non spécifié'}</span></p>
                  <p className="flex justify-between"><span className="text-gray-600">Email:</span> <span className="font-medium">{selectedOrder.point_of_sale_details?.email || 'Non spécifié'}</span></p>
                  <p className="flex justify-between"><span className="text-gray-600">Téléphone:</span> <span className="font-medium">{selectedOrder.point_of_sale_details?.phone || 'Non spécifié'}</span></p>
                  <p className="flex justify-between"><span className="text-gray-600">Adresse:</span> <span className="font-medium text-right">{selectedOrder.point_of_sale_details?.address || 'Non spécifié'}</span></p>
                </div>
              </div>
              <div className={`p-6 rounded-xl border ${statusInfo.borderColor} ${statusInfo.bgColor}`}>
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center text-lg">
                  <Package className="mr-3 text-indigo-600" size={20} />
                  Informations Commande
                </h4>
                <div className="space-y-3 text-sm">
                  <p className="flex justify-between"><span className="text-gray-600">Date:</span> <span className="font-medium">{selectedOrder.date ? new Date(selectedOrder.date).toLocaleDateString('fr-FR') : 'Non spécifiée'}</span></p>
                  <p className="flex justify-between"><span className="text-gray-600">Livraison prévue:</span> <span className="font-medium">{selectedOrder.delivery_date ? new Date(selectedOrder.delivery_date).toLocaleDateString('fr-FR') : 'Non spécifiée'}</span></p>
                  <p className="flex justify-between items-center"><span className="text-gray-600">Statut:</span> 
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color} bg-white border ${statusInfo.borderColor}`}>
                      {React.createElement(statusInfo.icon, { size: 12, className: "mr-1 inline" })}
                      {statusInfo.label}
                    </span>
                  </p>
                  <p className="flex justify-between items-center"><span className="text-gray-600">Priorité:</span> 
                    <div className="flex items-center">
                      <Star className={`mr-1 ${getPriorityColor(selectedOrder.priority)}`} size={16} />
                      <span className={`font-medium ${getPriorityColor(selectedOrder.priority)}`}>
                        {selectedOrder.priority === 'high' ? 'Haute' : 
                         selectedOrder.priority === 'medium' ? 'Moyenne' : 'Basse'}
                      </span>
                    </div>
                  </p>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4 text-lg">Articles Commandés</h4>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Produit</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Format</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Quantité</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Prix Unitaire</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Total</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Quantité Affectée</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedOrder.items.map((item, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.product_name || item.product_variant?.product?.name || 'Produit inconnu'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.product_variant?.format?.name || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 text-center">{item.quantity}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 text-right">{formatCurrency(item.price)}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">{formatCurrency(item.total)}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">{item.quantity_affecte || '0'}</td>
                        <td className="px-6 py-4 text-sm text-center">
                          <button
                            onClick={() => handleAssignProduct(selectedOrder, item)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium shadow-sm"
                          >
                            <Target size={14} />
                            Affecter
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-sm font-bold text-gray-900 text-right">Total Commande:</td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">{formatCurrency(selectedOrder.total)}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            {selectedOrder.notes && (
              <div className={`p-6 rounded-xl border ${statusInfo.borderColor} ${statusInfo.bgColor}`}>
                <h4 className="font-semibold text-gray-900 mb-3">Notes</h4>
                <p className="text-gray-700 leading-relaxed">{selectedOrder.notes}</p>
              </div>
            )}
            <div className="flex items-center justify-between flex-wrap gap-4 pt-6 border-t border-gray-200">
              <select 
                value={selectedOrder.status}
                onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value as OrderStatus)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm font-medium">
                {Object.entries(orderStatuses).map(([key, status]) => (
                  <option key={key} value={key}>{status.label}</option>
                ))}
              </select>
              <div className="flex gap-3">
                {userProfile?.role?.createcommande && (
                  <button 
                    onClick={() => handleEditOrder(selectedOrder)}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 font-medium shadow-sm"
                  >
                    <Edit size={16} />
                    Modifier
                  </button>
                )}
                <button 
                  onClick={() => handlePrintOrder(selectedOrder)}
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 font-medium shadow-sm"
                >
                  <Download size={16} />
                  Imprimer
                </button>
                {userProfile?.role?.createcommande && (
                  <button 
                    onClick={() => deleteOrder(selectedOrder.id)}
                    className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 font-medium shadow-sm"
                  >
                    <Trash2 size={16} />
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const EditOrderModal = () => {
    if (!editingOrder) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-white">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Modifier la Commande</h3>
              <p className="text-gray-600 mt-1">Commande #{editingOrder.id}</p>
            </div>
            <button 
              onClick={() => setShowEditModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            >
              <XCircle size={24} />
            </button>
          </div>
          <div className="p-8">
            <form onSubmit={handleUpdateOrder} className="space-y-8">
              {error && (
                <div className="text-red-700 bg-red-50 p-4 rounded-xl text-sm border border-red-200">
                  {error}
                </div>
              )}
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Date de commande
                  </label>
                  <input 
                    type="date"
                    value={editingOrder.date}
                    onChange={(e) => setEditingOrder({...editingOrder, date: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Date de livraison
                  </label>
                  <input 
                    type="date"
                    value={editingOrder.delivery_date || ''}
                    onChange={(e) => setEditingOrder({...editingOrder, delivery_date: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Priorité
                  </label>
                  <select 
                    value={editingOrder.priority}
                    onChange={(e) => setEditingOrder({...editingOrder, priority: e.target.value as 'low' | 'medium' | 'high'})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-colors">
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Statut
                  </label>
                  <select 
                    value={editingOrder.status}
                    onChange={(e) => setEditingOrder({...editingOrder, status: e.target.value as OrderStatus})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-colors">
                    {Object.entries(orderStatuses).map(([key, status]) => (
                      <option key={key} value={key}>{status.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-4">
                  Articles de la commande
                </label>
                <div className="border border-gray-300 rounded-xl p-6 space-y-4 bg-gray-50">
                  <div className="grid grid-cols-12 gap-3 text-sm font-semibold text-gray-900">
                    <div className="col-span-5">Produit</div>
                    <div className="col-span-2">Format</div>
                    <div className="col-span-2">Quantité</div>
                    <div className="col-span-2">Prix Unitaire</div>
                    <div className="col-span-1">Actions</div>
                  </div>
                  {editingItems.map((item, index) => {
                    const variant = productVariants.find(v => v.id === item.product_variant_id);
                    return (
                      <div key={index} className="grid grid-cols-12 gap-3 items-center bg-white p-3 rounded-lg border border-gray-200">
                        <div className="col-span-5">
                          <select 
                            required
                            value={item.product_variant_id}
                            onChange={(e) => handleEditingItemChange(index, 'product_variant_id', parseInt(e.target.value))}
                            className="w-full text-sm border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-colors">
                            <option value="0">Sélectionner un produit</option>
                            {productVariants.map(v => (
                              <option key={v.id} value={v.id}>
                                {v.product?.name || 'Produit inconnu'} - {v.format?.name || 'Sans format'}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2 text-sm text-gray-600 font-medium">
                          {variant?.format?.name || '-'}
                        </div>
                        <div className="col-span-2">
                          <input 
                            type="number"
                            required
                            min="1"
                            max={variant?.current_stock || 1}
                            value={item.quantity}
                            onChange={(e) => handleEditingItemChange(index, 'quantity', parseInt(e.target.value))}
                            className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-colors"
                          />
                        </div>
                        <div className="col-span-2">
                          <input 
                            type="text"
                            readOnly
                            value={formatCurrency(item.price)}
                            className="w-full px-4 py-2.5 text-sm border text-gray-600 bg-gray-100 rounded-lg font-medium"
                          />
                        </div>
                        <div className="col-span-1 flex items-center">
                          <button 
                            type="button"
                            onClick={() => handleRemoveEditingItem(index)}
                            className="text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors">
                            <XCircle size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <button 
                    type="button"
                    onClick={handleAddEditingItem}
                    className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:text-gray-700 hover:border-gray-400 transition-colors bg-white flex items-center justify-center gap-2 font-medium">
                    <Plus size={16} />
                    Ajouter un article
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Notes
                </label>
                <textarea 
                  value={editingOrder.notes || ''}
                  onChange={(e) => setEditingOrder({...editingOrder, notes: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-colors resize-none"
                  rows={4}
                  placeholder="Notes supplémentaires..."
                />
              </div>
              
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button 
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-sm"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const AssignVendorModal = () => {
    if (!selectedItem || !selectedOrder) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-white">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Affecter un produit à un vendeur</h3>
              <p className="text-gray-600 mt-1">Commande #{selectedOrder.id} - {selectedItem.product_name || selectedItem.product_variant?.product?.name || 'Produit inconnu'}</p>
            </div>
            <button 
              onClick={() => setShowAssignModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            >
              <XCircle size={24} />
            </button>
          </div>
          <div className="p-6">
            <form onSubmit={handleVendorAssignment} className="space-y-6">
              {error && (
                <div className="text-red-700 bg-red-50 p-4 rounded-xl text-sm border border-red-200">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  <Users className="inline w-4 h-4 mr-2 text-indigo-600" />
                  Vendeur ambulant *
                </label>
                <select
                  required
                  value={vendorActivity.vendor || ''}
                  onChange={(e) => setVendorActivity({...vendorActivity, vendor: parseInt(e.target.value) || null})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-colors"
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
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Type d'activité *
                </label>
                <select
                  required
                  value={vendorActivity.activity_type || ''}
                  onChange={(e) => setVendorActivity({...vendorActivity, activity_type: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-colors"
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
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Quantité à affecter *
                </label>
                <input 
                  type="number"
                  required
                  min="1"
                  max={selectedItem.quantity}
                  value={vendorActivity.quantity_assignes || ''}
                  onChange={(e) => setVendorActivity({...vendorActivity, quantity_assignes: parseInt(e.target.value) || null})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-colors"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Quantité maximale disponible: {selectedItem.quantity}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Notes
                </label>
                <textarea 
                  value={vendorActivity.notes}
                  onChange={(e) => setVendorActivity({...vendorActivity, notes: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-colors resize-none"
                  rows={3}
                  placeholder="Notes supplémentaires..."
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-sm"
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des permissions...</p>
        </div>
      </div>
    );
  }

  // Check permissions
  const hasViewPermission = userProfile?.role?.vuecommande || false;
  const hasCreatePermission = userProfile?.role?.createcommande || false;

  if (!hasViewPermission && !hasCreatePermission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md text-center">
          <div className="p-3 bg-red-100 rounded-xl inline-block mb-4">
            <XCircle className="text-red-600" size={48} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Accès refusé</h2>
          <p className="text-gray-600 mb-6">
            Vous n'avez pas les permissions nécessaires pour accéder à la gestion des commandes.
            Veuillez contacter votre administrateur.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 text-center rounded-xl border border-red-200 font-medium">
          {error}
        </div>
      )}
      
      {/* Header avec métriques */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Commandes</h1>
            <p className="text-gray-600">Suivez et gérez l'ensemble de vos commandes</p>
            {userProfile && (
              <p className="text-sm text-gray-500 mt-1">
                Connecté en tant que: <span className="font-medium">{userProfile.user?.username}</span> 
                - Rôle: <span className="font-medium">{userProfile.role?.name}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 mt-4 lg:mt-0">
            <button className="px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium flex items-center gap-2">
              <RefreshCw size={16} />
              Actualiser
            </button>
            <button className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2 shadow-sm">
              <Download size={16} />
              Exporter
            </button>
          </div>
        </div>

        {/* Cartes de métriques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Commandes</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{orders.length}</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-xl">
                <Package className="text-indigo-600" size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-green-600">
              <TrendingUp size={14} className="mr-1" />
              <span>+12% ce mois</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En Attente</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{orders.filter(o => o.status === 'pending').length}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <Clock className="text-amber-600" size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-amber-600">
              <AlertCircle size={14} className="mr-1" />
              <span>Nécessite attention</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Livrées</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{orders.filter(o => o.status === 'delivered').length}</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <CheckCircle className="text-emerald-600" size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-emerald-600">
              <TrendingUp size={14} className="mr-1" />
              <span>+8% cette semaine</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Chiffre d'Affaires</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(orders.reduce((sum, order) => sum + parseFloat(order.total), 0).toString())}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <DollarSign className="text-purple-600" size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-purple-600">
              <BarChart3 size={14} className="mr-1" />
              <span>Performance</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation par onglets - seulement si les deux permissions sont présentes */}
      {(hasViewPermission && hasCreatePermission) ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              className={`px-6 py-4 font-semibold flex items-center gap-3 transition-colors ${
                activeTab === 'received' 
                  ? 'text-indigo-600 border-b-2 border-indigo-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('received')}
            >
              <List size={20} />
              Commandes Reçues
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm font-medium">
                {orders.length}
              </span>
            </button>
            <button
              className={`px-6 py-4 font-semibold flex items-center gap-3 transition-colors ${
                activeTab === 'created' 
                  ? 'text-indigo-600 border-b-2 border-indigo-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('created')}
            >
              <ShoppingCart size={20} />
              Créer une Commande
            </button>
          </div>
          
          {activeTab === 'received' ? (
            <OrdersReceivedView 
              userProfile={userProfile}
              orders={orders}
              filteredOrders={filteredOrders}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
              sortBy={sortBy}
              sortOrder={sortOrder}
              setSortBy={setSortBy}
              setSortOrder={setSortOrder}
              selectedOrders={selectedOrders}
              setSelectedOrders={setSelectedOrders}
              handleSelectOrder={handleSelectOrder}
              handleSelectAll={handleSelectAll}
              setShowAddModal={setShowAddModal}
              bulkStatusUpdate={bulkStatusUpdate}
              setShowDetailsModal={setShowDetailsModal}
              setSelectedOrder={setSelectedOrder}
              handleEditOrder={handleEditOrder}
              deleteOrder={deleteOrder}
              formatCurrency={formatCurrency}
              getPriorityColor={getPriorityColor}
              orderStatuses={orderStatuses}
              currentOrders={currentOrders}
              indexOfFirstOrder={indexOfFirstOrder}
              indexOfLastOrder={indexOfLastOrder}
              filteredOrdersLength={filteredOrders.length}
              totalPages={totalPages}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              showAddModal={showAddModal}
              error={error}
              newOrder={newOrder}
              setNewOrder={setNewOrder}
              productVariants={productVariants}
              pointsOfSale={pointsOfSale}
              handleCreateOrder={handleCreateOrder}
              resetOrderForm={resetOrderForm}
              setShowEditModal={setShowEditModal}
              handleAddOrderItem={handleAddOrderItem}
              handleRemoveOrderItem={handleRemoveOrderItem}
              handleOrderItemChange={handleOrderItemChange}
            />
          ) : (
            <CreateOrderView 
              productVariants={productVariants}
              setShowAddModal={setShowAddModal}
              formatCurrency={formatCurrency}
            />
          )}
        </div>
      ) : hasViewPermission ? (
        <OrdersReceivedView 
          userProfile={userProfile}
          orders={orders}
          filteredOrders={filteredOrders}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          sortBy={sortBy}
          sortOrder={sortOrder}
          setSortBy={setSortBy}
          setSortOrder={setSortOrder}
          selectedOrders={selectedOrders}
          setSelectedOrders={setSelectedOrders}
          handleSelectOrder={handleSelectOrder}
          handleSelectAll={handleSelectAll}
          setShowAddModal={setShowAddModal}
          bulkStatusUpdate={bulkStatusUpdate}
          setShowDetailsModal={setShowDetailsModal}
          setSelectedOrder={setSelectedOrder}
          handleEditOrder={handleEditOrder}
          deleteOrder={deleteOrder}
          formatCurrency={formatCurrency}
          getPriorityColor={getPriorityColor}
          orderStatuses={orderStatuses}
          currentOrders={currentOrders}
          indexOfFirstOrder={indexOfFirstOrder}
          indexOfLastOrder={indexOfLastOrder}
          filteredOrdersLength={filteredOrders.length}
          totalPages={totalPages}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          showAddModal={showAddModal}
          error={error}
          newOrder={newOrder}
          setNewOrder={setNewOrder}
          productVariants={productVariants}
          pointsOfSale={pointsOfSale}
          handleCreateOrder={handleCreateOrder}
          resetOrderForm={resetOrderForm}
          setShowEditModal={setShowEditModal}
          handleAddOrderItem={handleAddOrderItem}
          handleRemoveOrderItem={handleRemoveOrderItem}
          handleOrderItemChange={handleOrderItemChange}
        />
      ) : (
        <CreateOrderView 
          productVariants={productVariants}
          setShowAddModal={setShowAddModal}
          formatCurrency={formatCurrency}
        />
      )}

      {/* Modals */}
      {showAddModal && (
        <AddOrderModal 
          showAddModal={showAddModal}
          setShowAddModal={setShowAddModal}
          error={error}
          newOrder={newOrder}
          setNewOrder={setNewOrder}
          productVariants={productVariants}
          pointsOfSale={pointsOfSale}
          handleCreateOrder={handleCreateOrder}
          formatCurrency={formatCurrency}
          handleAddOrderItem={handleAddOrderItem}
          handleRemoveOrderItem={handleRemoveOrderItem}
          handleOrderItemChange={handleOrderItemChange}
        />
      )}
      
      {showDetailsModal && <OrderDetailsModal />}
      {showEditModal && <EditOrderModal />}
      {showAssignModal && <AssignVendorModal />}
    </div>
  );
};

// Composant pour la vue "Commandes Reçues"
const OrdersReceivedView = ({
  userProfile,
  orders,
  filteredOrders,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  dateFilter,
  setDateFilter,
  sortBy,
  sortOrder,
  setSortBy,
  setSortOrder,
  selectedOrders,
  setSelectedOrders,
  handleSelectOrder,
  handleSelectAll,
  setShowAddModal,
  bulkStatusUpdate,
  setShowDetailsModal,
  setSelectedOrder,
  handleEditOrder,
  deleteOrder,
  formatCurrency,
  getPriorityColor,
  orderStatuses,
  currentOrders,
  indexOfFirstOrder,
  indexOfLastOrder,
  filteredOrdersLength,
  totalPages,
  currentPage,
  setCurrentPage,
  showAddModal,
  error,
  newOrder,
  setNewOrder,
  productVariants,
  pointsOfSale,
  handleCreateOrder,
  resetOrderForm,
  setShowEditModal,
  handleAddOrderItem,
  handleRemoveOrderItem,
  handleOrderItemChange
}: any) => (
  <div className="p-6">
    {/* Barre d'outils */}
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4 flex-1">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Rechercher une commande, point de vente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full transition-colors"
          />
        </div>
        <div className="flex gap-3">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-colors font-medium">
            <option value="all">Tous les statuts</option>
            {Object.entries(orderStatuses).map(([key, status]: [string, any]) => (
              <option key={key} value={key}>{status.label}</option>
            ))}
          </select>

          <select 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-colors font-medium">
            <option value="all">Toutes les dates</option>
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
          </select>
        </div>
      </div>
      <div className="flex gap-3">
        <select 
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [field, order] = e.target.value.split('-');
            setSortBy(field as keyof any);
            setSortOrder(order);
          }}
          className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-colors font-medium">
          <option value="date-desc">Plus récentes</option>
          <option value="date-asc">Plus anciennes</option>
          <option value="total-desc">Montant décroissant</option>
          <option value="total-asc">Montant croissant</option>
          <option value="point_of_sale-asc">Point de vente A-Z</option>
          <option value="point_of_sale-desc">Point de vente Z-A</option>
        </select>
        {userProfile?.role?.createcommande && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 font-medium shadow-sm"
          >
            <Plus size={18} />
            Nouvelle Commande
          </button>
        )}
      </div>
    </div>

    {/* Actions groupées */}
    {selectedOrders.length > 0 && (
      <div className="mb-6 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between items-center gap-4">
          <div className="text-sm font-semibold text-indigo-800 flex items-center gap-2">
            <CheckCircle size={16} />
            <span>{selectedOrders.length} commande(s) sélectionnée(s)</span>
          </div>
          <div className="flex gap-3">
            <select 
              onChange={(e) => {
                if (e.target.value) {
                  bulkStatusUpdate(e.target.value as any);
                  e.target.value = '';
                }
              }}
              className="px-3 py-2 text-sm border border-indigo-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white font-medium">
              <option value="">Modifier statut</option>
              {Object.entries(orderStatuses).map(([key, status]: [string, any]) => (
                <option key={key} value={key}>{status.label}</option>
              ))}
            </select>
            <button 
              onClick={() => setSelectedOrders([])}
              className="px-3 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
            >
              Tout désélectionner
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Tableau des commandes */}
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left">
                <input 
                  type="checkbox"
                  checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                  onChange={() => handleSelectAll()}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Commande</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Point de Vente</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Statut</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Priorité</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Total</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {currentOrders.length > 0 ? (
              currentOrders.map((order: any) => {
                const statusInfo = orderStatuses[order.status];
                const pointOfSaleName = order.point_of_sale_details?.name || 'Point de vente inconnu';
                
                return (
                  <tr 
                    key={order.id} 
                    className={`hover:bg-gray-50 transition-colors ${
                      selectedOrders.includes(order.id) ? 'bg-indigo-25' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => handleSelectOrder(order.id)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-gray-900">CMD-{order.id}</div>
                        <div className="text-sm text-gray-500 mt-1">{order.items.length} article(s)</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-gray-900">{pointOfSaleName}</div>
                        <div className="text-sm text-gray-500 mt-1">{order.point_of_sale_details?.address || ''}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {order.date ? new Date(order.date).toLocaleDateString('fr-FR') : 'Non spécifiée'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Livraison: {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('fr-FR') : 'Non spécifiée'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color} bg-white border ${statusInfo.borderColor}`}>
                        {React.createElement(statusInfo.icon, { size: 12, className: "mr-1" })}
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Star className={getPriorityColor(order.priority)} size={16} />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          {order.priority === 'high' ? 'Haute' : 
                           order.priority === 'medium' ? 'Moyenne' : 'Basse'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-semibold text-gray-900">{formatCurrency(order.total)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button 
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowDetailsModal(true);
                          }}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Voir détails"
                        >
                          <Eye size={18} />
                        </button>
                        {userProfile?.role?.createcommande && (
                          <>
                            <button 
                              onClick={() => handleEditOrder(order)}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit size={18} />
                            </button>
                            <button 
                              onClick={() => deleteOrder(order.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <Package className="text-gray-300 mb-4" size={64} />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune commande trouvée</h3>
                    <p className="text-gray-600 mb-6 max-w-md text-center">
                      {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' 
                        ? 'Aucune commande ne correspond aux critères de recherche.'
                        : 'Aucune commande n\'a été trouvée.'}
                    </p>
                    {userProfile?.role?.createcommande && (!searchTerm && statusFilter === 'all' && dateFilter === 'all') && (
                      <button 
                        onClick={() => setShowAddModal(true)}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors inline-flex items-center gap-2 font-medium shadow-sm"
                      >
                        <Plus size={18} />
                        Créer une Commande
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50">
          <div className="text-sm text-gray-600 font-medium">
            Affichage de <span className="text-gray-900">{indexOfFirstOrder + 1}</span> à <span className="text-gray-900">{Math.min(indexOfLastOrder, filteredOrdersLength)}</span> sur <span className="text-gray-900">{filteredOrdersLength}</span> commandes
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setCurrentPage((prev: number) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Précédent
            </button>
            {[...Array(totalPages)].map((_, index) => {
              const page = index + 1;
              if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 text-sm border rounded-lg font-medium transition-colors ${
                      currentPage === page 
                        ? 'bg-indigo-600 text-white border-indigo-600' 
                        : 'border-gray-300 hover:bg-white text-gray-700'
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return <span key={page} className="text-gray-500 px-2">...</span>;
              }
              return null;
            })}
            <button 
              onClick={() => setCurrentPage((prev: number) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
);

// Composant pour la vue "Créer une Commande"
const CreateOrderView = ({ productVariants, setShowAddModal, formatCurrency }: any) => (
  <div className="p-8">
    <div className="flex justify-between items-center mb-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Créer une nouvelle commande</h2>
        <p className="text-gray-600 mt-2">Sélectionnez les produits à commander</p>
      </div>
      <button 
        onClick={() => setShowAddModal(true)}
        className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 font-medium shadow-sm"
      >
        <Plus size={18} />
        Nouvelle Commande
      </button>
    </div>
    
    {/* Grille des produits */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {productVariants.map((variant: any) => (
        <div key={variant.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900 mb-1">{variant.product?.name || 'Produit inconnu'}</h3>
              <p className="text-gray-600 text-sm">{variant.format?.name || 'Sans format'}</p>
            </div>
            {variant.image && (
              <img 
                src={variant.image} 
                alt={`${variant.product?.name || 'Produit'} ${variant.format?.name || ''}`}
                className="w-16 h-16 object-cover rounded-lg"
              />
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-600 block mb-1">Prix:</span>
              <span className="font-semibold text-gray-900">{formatCurrency(variant.price)}</span>
            </div>
            <div className={`p-3 rounded-lg ${
              (variant.current_stock || 0) <= (variant.min_stock || 0) ? 'bg-red-50' : 
              (variant.current_stock || 0) >= (variant.max_stock || 0) ? 'bg-emerald-50' : 'bg-gray-50'
            }`}>
              <span className="text-gray-600 block mb-1">Stock:</span>
              <span className={`font-semibold ${
                (variant.current_stock || 0) <= (variant.min_stock || 0) ? 'text-red-600' : 
                (variant.current_stock || 0) >= (variant.max_stock || 0) ? 'text-emerald-600' : 'text-gray-900'
              }`}>
                {variant.current_stock || 0}
              </span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-600 block mb-1">Stock min:</span>
              <span className="font-semibold text-gray-900">{variant.min_stock || 0}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-600 block mb-1">Stock max:</span>
              <span className="font-semibold text-gray-900">{variant.max_stock || 0}</span>
            </div>
          </div>
          
          <button 
            onClick={() => {
              setShowAddModal(true);
            }}
            className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Ajouter à la commande
          </button>
        </div>
      ))}
    </div>
  </div>
);

// Composant pour le modal d'ajout de commande
const AddOrderModal = ({
  showAddModal,
  setShowAddModal,
  error,
  newOrder,
  setNewOrder,
  productVariants,
  pointsOfSale,
  handleCreateOrder,
  formatCurrency,
  handleAddOrderItem,
  handleRemoveOrderItem,
  handleOrderItemChange
}: any) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="p-6 border-b bg-gradient-to-r from-indigo-50 to-white">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gray-900">Nouvelle Commande</h3>
          <button 
            onClick={() => setShowAddModal(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <XCircle size={24} />
          </button>
        </div>
      </div>
      <div className="p-6">
        <form onSubmit={handleCreateOrder} className="space-y-6">
          {error && (
            <div className="text-red-700 bg-red-50 p-4 rounded-xl text-sm border border-red-200 font-medium">
              {error}
            </div>
          )}
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="col-span-full">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                <MapPin className="inline w-4 h-4 mr-2 text-indigo-600" />
                Point de vente *
              </label>
              <select
                required
                value={newOrder.point_of_sale_id || ''}
                onChange={(e) => setNewOrder({...newOrder, point_of_sale_id: parseInt(e.target.value) || null})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-colors"
              >
                <option value="">Sélectionner un point de vente</option>
                {pointsOfSale.map((pos: any) => (
                  <option key={pos.id} value={pos.id}>
                    {pos.name} - {pos.address || 'Adresse non spécifiée'}
                  </option>
                ))}
              </select>
            </div>
      
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                <Star className="inline w-4 h-4 mr-2 text-indigo-600" />
                Priorité *
              </label>
              <select 
                value={newOrder.priority}
                onChange={(e) => setNewOrder({...newOrder, priority: e.target.value as 'low' | 'medium' | 'high'})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-colors">
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                <Calendar className="inline w-4 h-4 mr-2 text-indigo-600" />
                Date de Commande *
              </label>
              <input 
                type="date"
                required
                value={newOrder.date}
                onChange={(e) => setNewOrder({...newOrder, date: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                <Calendar className="inline w-4 h-4 mr-2 text-indigo-600" />
                Date de Livraison *
              </label>
              <input 
                type="date"
                required
                value={newOrder.delivery_date}
                onChange={(e) => setNewOrder({...newOrder, delivery_date: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-colors"
              />
            </div>
          </div>
          
          <div className="col-span-full">
            <label className="block text-sm font-semibold text-gray-900 mb-4">
              <Package className="inline w-4 h-4 mr-2 text-indigo-600" />
              Articles à commander
            </label>
            <div className="border border-gray-300 rounded-xl p-6 space-y-4 bg-gray-50">
              <div className="grid grid-cols-12 gap-3 text-sm font-semibold text-gray-900">
                <div className="col-span-5">Produit</div>
                <div className="col-span-2">Format</div>
                <div className="col-span-2">Quantité</div>
                <div className="col-span-2">Prix Unitaire</div>
                <div className="col-span-1">Total</div>
              </div>
              {newOrder.items.map((item: any, index: number) => {
                const variant = productVariants.find((v: any) => v.id === item.product_variant_id);
                return (
                  <div key={index} className="grid grid-cols-12 gap-3 items-center bg-white p-3 rounded-lg border border-gray-200">
                    <div className="col-span-5">
                      <select 
                        required
                        value={item.product_variant_id}
                        onChange={(e) => handleOrderItemChange(index, 'product_variant_id', parseInt(e.target.value))}
                        className="w-full text-sm border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-colors">
                        <option value="0">Sélectionner un produit</option>
                        {productVariants.map((v: any) => (
                          <option key={v.id} value={v.id}>
                            {v.product?.name || 'Produit inconnu'} - {v.format?.name || 'Sans format'}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2 text-sm text-gray-600 font-medium">
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
                        className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-colors"
                        placeholder="Qty"
                      />
                    </div>
                    <div className="col-span-2">
                      <input 
                        type="text"
                        readOnly
                        value={formatCurrency(item.price)}
                        className="w-full px-4 py-2.5 text-sm border text-gray-600 bg-gray-100 rounded-lg font-medium"
                      />
                    </div>
                    <div className="col-span-1 flex items-center text-sm font-semibold text-gray-900">
                      {formatCurrency((parseFloat(item.price) * item.quantity).toString())}
                      <button 
                        type="button"
                        onClick={() => handleRemoveOrderItem(index)}
                        className="ml-2 text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                      >
                        <XCircle size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
              <button 
                type="button"
                onClick={handleAddOrderItem}
                className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:text-gray-700 hover:border-gray-400 transition-colors bg-white flex items-center justify-center gap-2 font-medium"
              >
                <Plus size={16} />
                Ajouter un article
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              <FileText className="inline w-4 h-4 mr-2 text-indigo-600" />
              Notes
            </label>
            <textarea 
              value={newOrder.notes}
              onChange={(e) => setNewOrder({...newOrder, notes: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-colors resize-none"
              rows={4}
              placeholder="Instructions spéciales, remarques..."
            />
          </div>
          
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button 
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              Annuler
            </button>
            <button 
              type="submit"
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-sm"
            >
              Créer la Commande
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
);

export default OrderManagement;