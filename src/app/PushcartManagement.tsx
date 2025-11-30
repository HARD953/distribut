"use client";
import React, { useState, useEffect } from 'react';
import { 
  Filter, Search, MapPin, Calendar, User, Phone, 
  DollarSign, Package, BarChart3, ChevronDown, ChevronUp,
  Download, Eye, MoreVertical, X, Plus, Loader2,
  ArrowLeft, ShoppingCart, Bike, RefreshCw, TrendingUp,
  Users, Target, ArrowUpRight, ArrowDownRight, CheckCircle,
  FileText, Database, AlertCircle, Store, Building
} from 'lucide-react';

import { useAuth } from './AuthContext';
import { apiService } from './ApiService';

// Interface pour les données Prospects Pushcart
interface Purchase {
  id: number;
  full_name: string;
  first_name: string;
  last_name: string;
  zone: string;
  vendor: number;
  purchase_date: string;
  base: string;
  pushcard_type: string;
  phone: string;
  latitude: number;
  longitude: number;
  total_sales_amount: string;
  total_sales_quantity: number;
  sales_count: number;
  total_products: number;
  total_variants: number;
  average_sale_amount: number;
  created_at: string;
}

// Interface pour les données Prospects Point de vente
interface PurchasePOS {
  id: number;
  name: string;
  owner: string;
  phone: string;
  email: string;
  address: string;
  latitude: number;
  longitude: number;
  total_sales_amount: string;
  total_sales_quantity: number;
  sales_count: number;
  total_products: number;
  total_variants: number;
  average_sale_amount: number;
  district: string;
  region: string;
  commune: string;
  type: string;
  status: string;
  registration_date: string;
  turnover: string;
  monthly_orders: number;
  evaluation_score: number;
  created_at: string;
  updated_at: string;
  user: number;
  avatar: string;
  brander: boolean;
  marque_brander: string | null;
}

// Interface pour les détails de vente
interface SaleDetail {
  id: number;
  product_variant: {
    id: number;
    product: {
      id: number;
      name: string;
      sku: string;
      category: number;
      status: string;
    };
    format: {
      id: number;
      name: string;
      description: string;
    };
    current_stock: number;
    price: string;
    barcode: string;
  };
  quantity: number;
  total_amount: string;
  unit_price: number;
  created_at: string;
  vendor: string;
  latitude?: number;
  longitude?: number;
}

// Interface pour les statistiques des détails
interface SaleStatistics {
  grand_total_amount: number;
  grand_total_quantity: number;
  total_products: number;
  total_variants: number;
  average_price: number;
}

// Interface pour la réponse des détails de vente
interface PurchaseDetails {
  purchase: {
    id: number;
    full_name: string;
    zone: string;
    purchase_date?: string;
    vendor: string;
  };
  sales: SaleDetail[];
  statistics: SaleStatistics;
}

// Interface pour la réponse des détails de vente POS
interface PurchasePOSDetails {
  purchase: {
    id: number;
    full_name: string;
    zone: string;
    vendor: string;
  };
  sales: SaleDetail[];
  statistics: SaleStatistics;
}

type TabType = 'pushcart' | 'pos';

const PushcartManagement = () => {
  const [activeTab, setActiveTab] = useState<TabType>('pushcart');
  
  // États pour Prospects Pushcart
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([]);
  
  // États pour Prospects Point de vente
  const [purchasesPOS, setPurchasesPOS] = useState<PurchasePOS[]>([]);
  const [filteredPurchasesPOS, setFilteredPurchasesPOS] = useState<PurchasePOS[]>([]);
  
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | PurchasePOS | null>(null);
  const [purchaseDetails, setPurchaseDetails] = useState<PurchaseDetails | PurchasePOSDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  
  // États pour les filtres Pushcart
  const [filters, setFilters] = useState({
    search: '',
    zone: '',
    pushcard_type: '',
    start_date: '',
    end_date: '',
    vendor: ''
  });
  
  // États pour les filtres POS
  const [filtersPOS, setFiltersPOS] = useState({
    search: '',
    district: '',
    region: '',
    commune: '',
    type: '',
    status: '',
    start_date: '',
    end_date: ''
  });
  
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPagePOS, setCurrentPagePOS] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [showFilters, setShowFilters] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [zones, setZones] = useState<string[]>([]);
  const [pushcardTypes, setPushcardTypes] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [communes, setCommunes] = useState<string[]>([]);
  const [posTypes, setPosTypes] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);

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

  // Calculs pour la pagination Pushcart
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPurchases.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage);

  // Calculs pour la pagination POS
  const indexOfLastItemPOS = currentPagePOS * itemsPerPage;
  const indexOfFirstItemPOS = indexOfLastItemPOS - itemsPerPage;
  const currentItemsPOS = filteredPurchasesPOS.slice(indexOfFirstItemPOS, indexOfLastItemPOS);
  const totalPagesPOS = Math.ceil(filteredPurchasesPOS.length / itemsPerPage);

  // Fonctions de pagination Pushcart
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Fonctions de pagination POS
  const nextPagePOS = () => {
    if (currentPagePOS < totalPagesPOS) {
      setCurrentPagePOS(currentPagePOS + 1);
    }
  };

  const prevPagePOS = () => {
    if (currentPagePOS > 1) {
      setCurrentPagePOS(currentPagePOS - 1);
    }
  };

  const goToPagePOS = (pageNumber: number) => {
    setCurrentPagePOS(pageNumber);
  };

  // Charger les données initiales
  useEffect(() => {
    fetchPurchases();
    fetchPurchasesPOS();
  }, []);

  // Filtrer les données lorsque les filtres changent
  useEffect(() => {
    filterPurchases();
  }, [filters, purchases]);

  useEffect(() => {
    filterPurchasesPOS();
  }, [filtersPOS, purchasesPOS]);

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  useEffect(() => {
    setCurrentPagePOS(1);
  }, [filtersPOS]);

  // Fonction pour récupérer les achats Pushcart
  const fetchPurchases = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.get('/purchasedata/');
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const data: Purchase[] = await response.json();
      setPurchases(data);
      
      // Extraire les zones et types uniques pour les filtres
      const uniqueZones = Array.from(new Set(data.map(p => p.zone))).filter(zone => zone);
      const uniqueTypes = Array.from(new Set(data.map(p => p.pushcard_type))).filter(type => type);
      
      setZones(uniqueZones);
      setPushcardTypes(uniqueTypes);
      
    } catch (err) {
      console.error('Erreur lors du chargement des achats:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour récupérer les achats POS
  const fetchPurchasesPOS = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.get('/purchasedatapos/');
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const data: PurchasePOS[] = await response.json();
      setPurchasesPOS(data);
      
      // Extraire les districts, régions, communes, types et statuts uniques pour les filtres
      const uniqueDistricts = Array.from(new Set(data.map(p => p.district))).filter(district => district);
      const uniqueRegions = Array.from(new Set(data.map(p => p.region))).filter(region => region);
      const uniqueCommunes = Array.from(new Set(data.map(p => p.commune))).filter(commune => commune);
      const uniqueTypes = Array.from(new Set(data.map(p => p.type))).filter(type => type);
      const uniqueStatuses = Array.from(new Set(data.map(p => p.status))).filter(status => status);
      
      setDistricts(uniqueDistricts);
      setRegions(uniqueRegions);
      setCommunes(uniqueCommunes);
      setPosTypes(uniqueTypes);
      setStatuses(uniqueStatuses);
      
    } catch (err) {
      console.error('Erreur lors du chargement des points de vente:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour récupérer les détails d'un achat
  const fetchPurchaseDetails = async (purchaseId: number) => {
    try {
      setDetailsLoading(true);
      setError(null);
      
      const endpoint = activeTab === 'pushcart' 
        ? `/purchasedata/${purchaseId}/sales_details/`
        : `/purchasedatapos/${purchaseId}/sales_details/`;
      
      const response = await apiService.get(endpoint);
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const data: PurchaseDetails | PurchasePOSDetails = await response.json();
      setPurchaseDetails(data);
      setShowDetailsModal(true);
      
    } catch (err) {
      console.error('Erreur lors du chargement des détails:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setDetailsLoading(false);
    }
  };

  // Filtrer les achats Pushcart selon les critères
  const filterPurchases = () => {
    let result = purchases;

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(purchase => 
        purchase.full_name.toLowerCase().includes(searchTerm) ||
        purchase.zone.toLowerCase().includes(searchTerm) ||
        purchase.base.toLowerCase().includes(searchTerm) ||
        purchase.phone.includes(searchTerm)
      );
    }

    if (filters.zone) {
      result = result.filter(purchase => purchase.zone === filters.zone);
    }

    if (filters.pushcard_type) {
      result = result.filter(purchase => purchase.pushcard_type === filters.pushcard_type);
    }

    if (filters.start_date) {
      result = result.filter(purchase => 
        new Date(purchase.purchase_date) >= new Date(filters.start_date)
      );
    }

    if (filters.end_date) {
      const endDate = new Date(filters.end_date);
      endDate.setHours(23, 59, 59); // Inclure toute la journée
      result = result.filter(purchase => 
        new Date(purchase.purchase_date) <= endDate
      );
    }

    if (filters.vendor) {
      result = result.filter(purchase => purchase.vendor.toString() === filters.vendor);
    }

    setFilteredPurchases(result);
  };

  // Filtrer les achats POS selon les critères
  const filterPurchasesPOS = () => {
    let result = purchasesPOS;

    if (filtersPOS.search) {
      const searchTerm = filtersPOS.search.toLowerCase();
      result = result.filter(purchase => 
        purchase.name.toLowerCase().includes(searchTerm) ||
        purchase.owner.toLowerCase().includes(searchTerm) ||
        purchase.address.toLowerCase().includes(searchTerm) ||
        purchase.phone.includes(searchTerm) ||
        purchase.email.toLowerCase().includes(searchTerm)
      );
    }

    if (filtersPOS.district) {
      result = result.filter(purchase => purchase.district === filtersPOS.district);
    }

    if (filtersPOS.region) {
      result = result.filter(purchase => purchase.region === filtersPOS.region);
    }

    if (filtersPOS.commune) {
      result = result.filter(purchase => purchase.commune === filtersPOS.commune);
    }

    if (filtersPOS.type) {
      result = result.filter(purchase => purchase.type === filtersPOS.type);
    }

    if (filtersPOS.status) {
      result = result.filter(purchase => purchase.status === filtersPOS.status);
    }

    if (filtersPOS.start_date) {
      result = result.filter(purchase => 
        new Date(purchase.registration_date) >= new Date(filtersPOS.start_date)
      );
    }

    if (filtersPOS.end_date) {
      const endDate = new Date(filtersPOS.end_date);
      endDate.setHours(23, 59, 59);
      result = result.filter(purchase => 
        new Date(purchase.registration_date) <= endDate
      );
    }

    setFilteredPurchasesPOS(result);
  };

  // Réinitialiser les filtres Pushcart
  const resetFilters = () => {
    setFilters({
      search: '',
      zone: '',
      pushcard_type: '',
      start_date: '',
      end_date: '',
      vendor: ''
    });
  };

  // Réinitialiser les filtres POS
  const resetFiltersPOS = () => {
    setFiltersPOS({
      search: '',
      district: '',
      region: '',
      commune: '',
      type: '',
      status: '',
      start_date: '',
      end_date: ''
    });
  };

  // Formater une date pour l'affichage
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Formater un montant
  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(Number(amount));
  };

  // Exporter les données
  const exportData = () => {
    const dataToExport = activeTab === 'pushcart' ? filteredPurchases : filteredPurchasesPOS;
    
    const csvContent = activeTab === 'pushcart' 
      ? [
          ['Nom complet', 'Zone', 'Base', 'Type', 'Téléphone', 'Date', 'Montant total', 'Quantité'],
          ...dataToExport.map(p => [
            (p as Purchase).full_name,
            p.zone,
            (p as Purchase).base,
            (p as Purchase).pushcard_type,
            p.phone,
            formatDate((p as Purchase).purchase_date),
            p.total_sales_amount,
            p.total_sales_quantity
          ])
        ]
      : [
          ['Nom', 'Propriétaire', 'Téléphone', 'Email', 'Adresse', 'District', 'Région', 'Commune', 'Type', 'Statut', 'Date d\'enregistrement', 'Chiffre d\'affaires'],
          ...dataToExport.map(p => [
            (p as PurchasePOS).name,
            p.owner,
            p.phone,
            p.email,
            p.address,
            p.district,
            p.region,
            p.commune,
            p.type,
            p.status,
            formatDate(p.registration_date),
            p.turnover
          ])
        ];

    const content = csvContent.map(row => row.join(',')).join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeTab === 'pushcart' ? 'pushcarts' : 'points_de_vente'}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Générer les numéros de page à afficher
  const getPageNumbers = (currentPage: number, totalPages: number) => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
    }
    
    return pageNumbers;
  };

  // Calculs des statistiques globales
  const totalSalesAmount = purchases.reduce((sum, p) => sum + Number(p.total_sales_amount), 0);
  const totalSalesAmountPOS = purchasesPOS.reduce((sum, p) => sum + Number(p.total_sales_amount), 0);
  const totalTurnoverPOS = purchasesPOS.reduce((sum, p) => sum + Number(p.turnover), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* En-tête */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Gestion des Prospects</h1>
          <p className="text-gray-600 text-lg">Suivi et analyse des ventes ambulantes et points de vente</p>
        </div>

        {/* Navigation par onglets */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('pushcart')}
                className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${
                  activeTab === 'pushcart'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Bike size={20} />
                  Prospects Pushcart
                </div>
              </button>
              <button
                onClick={() => setActiveTab('pos')}
                className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${
                  activeTab === 'pos'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Store size={20} />
                  Prospects Point de vente
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Total des ventes</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(activeTab === 'pushcart' ? totalSalesAmount : totalSalesAmountPOS)}
                </p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-xl">
                <DollarSign className="text-indigo-600" size={24} />
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
                <p className="text-sm font-semibold text-gray-600 mb-1">
                  {activeTab === 'pushcart' ? 'Nombre de ventes' : 'Points de vente'}
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {activeTab === 'pushcart' ? purchases.length : purchasesPOS.length}
                </p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                {activeTab === 'pushcart' ? (
                  <ShoppingCart className="text-emerald-600" size={24} />
                ) : (
                  <Store className="text-emerald-600" size={24} />
                )}
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-emerald-600">
              <ArrowUpRight size={14} className="mr-1" />
              <span>+8% ce mois</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">
                  {activeTab === 'pushcart' ? 'Zones couvertes' : 'Régions couvertes'}
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {activeTab === 'pushcart' ? zones.length : regions.length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <MapPin className="text-purple-600" size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-purple-600">
              <Target size={14} className="mr-1" />
              <span>+2 nouvelles {activeTab === 'pushcart' ? 'zones' : 'régions'}</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">
                  {activeTab === 'pushcart' ? 'Types de Prospects' : 'Chiffre d\'affaires total'}
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {activeTab === 'pushcart' ? pushcardTypes.length : formatCurrency(totalTurnoverPOS)}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                {activeTab === 'pushcart' ? (
                  <Bike className="text-orange-600" size={24} />
                ) : (
                  <Building className="text-orange-600" size={24} />
                )}
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-orange-600">
              <Users size={14} className="mr-1" />
              <span>Stable ce mois</span>
            </div>
          </div>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={
                  activeTab === 'pushcart' 
                    ? "Rechercher un client, zone, base..." 
                    : "Rechercher un point de vente, propriétaire, adresse..."
                }
                className="pl-12 pr-4 py-3 w-full border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                value={activeTab === 'pushcart' ? filters.search : filtersPOS.search}
                onChange={(e) => activeTab === 'pushcart' 
                  ? setFilters({...filters, search: e.target.value})
                  : setFiltersPOS({...filtersPOS, search: e.target.value})
                }
              />
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-colors font-medium"
              >
                <Filter size={18} className="mr-2" />
                Filtres
                {showFilters ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />}
              </button>
              
              <button
                onClick={exportData}
                className="flex items-center px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-colors font-medium"
              >
                <Download size={18} className="mr-2" />
                Exporter
              </button>
              
              <button
                onClick={activeTab === 'pushcart' ? fetchPurchases : fetchPurchasesPOS}
                className="p-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                title="Actualiser"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </div>
          
          {/* Panneau de filtres avancés */}
          {showFilters && (
            <div className="p-6 border-b border-gray-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-50">
              {activeTab === 'pushcart' ? (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Zone</label>
                    <select
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      value={filters.zone}
                      onChange={(e) => setFilters({...filters, zone: e.target.value})}
                    >
                      <option value="">Toutes les zones</option>
                      {zones.map(zone => (
                        <option key={zone} value={zone}>{zone}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Type de prospect</label>
                    <select
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      value={filters.pushcard_type}
                      onChange={(e) => setFilters({...filters, pushcard_type: e.target.value})}
                    >
                      <option value="">Tous les types</option>
                      {pushcardTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Commercial</label>
                    <input
                      type="text"
                      placeholder="ID du vendeur"
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      value={filters.vendor}
                      onChange={(e) => setFilters({...filters, vendor: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Date de début</label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      value={filters.start_date}
                      onChange={(e) => setFilters({...filters, start_date: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Date de fin</label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      value={filters.end_date}
                      onChange={(e) => setFilters({...filters, end_date: e.target.value})}
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      onClick={resetFilters}
                      className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                    >
                      Réinitialiser
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">District</label>
                    <select
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      value={filtersPOS.district}
                      onChange={(e) => setFiltersPOS({...filtersPOS, district: e.target.value})}
                    >
                      <option value="">Tous les districts</option>
                      {districts.map(district => (
                        <option key={district} value={district}>{district}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Région</label>
                    <select
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      value={filtersPOS.region}
                      onChange={(e) => setFiltersPOS({...filtersPOS, region: e.target.value})}
                    >
                      <option value="">Toutes les régions</option>
                      {regions.map(region => (
                        <option key={region} value={region}>{region}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Commune</label>
                    <select
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      value={filtersPOS.commune}
                      onChange={(e) => setFiltersPOS({...filtersPOS, commune: e.target.value})}
                    >
                      <option value="">Toutes les communes</option>
                      {communes.map(commune => (
                        <option key={commune} value={commune}>{commune}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Type</label>
                    <select
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      value={filtersPOS.type}
                      onChange={(e) => setFiltersPOS({...filtersPOS, type: e.target.value})}
                    >
                      <option value="">Tous les types</option>
                      {posTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Statut</label>
                    <select
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      value={filtersPOS.status}
                      onChange={(e) => setFiltersPOS({...filtersPOS, status: e.target.value})}
                    >
                      <option value="">Tous les statuts</option>
                      {statuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Date d'enregistrement (début)</label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      value={filtersPOS.start_date}
                      onChange={(e) => setFiltersPOS({...filtersPOS, start_date: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Date d'enregistrement (fin)</label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      value={filtersPOS.end_date}
                      onChange={(e) => setFiltersPOS({...filtersPOS, end_date: e.target.value})}
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      onClick={resetFiltersPOS}
                      className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                    >
                      Réinitialiser
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Tableau des données */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="animate-spin text-indigo-600 mr-3" size={28} />
              <span className="text-gray-600">Chargement des données...</span>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="mx-auto w-16 h-16 flex items-center justify-center bg-red-100 rounded-full mb-4">
                <X className="text-red-600" size={28} />
              </div>
              <div className="text-red-700 font-semibold mb-2">Erreur lors du chargement des données</div>
              <div className="text-gray-600 mb-6">{error}</div>
              <button
                onClick={activeTab === 'pushcart' ? fetchPurchases : fetchPurchasesPOS}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-sm"
              >
                Réessayer
              </button>
            </div>
          ) : (activeTab === 'pushcart' ? filteredPurchases : filteredPurchasesPOS).length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mb-4">
                <Search className="text-gray-500" size={28} />
              </div>
              <div className="text-gray-900 font-semibold mb-2">Aucune donnée à afficher</div>
              <div className="text-gray-600 mb-6">
                {(activeTab === 'pushcart' ? Object.values(filters) : Object.values(filtersPOS)).some(value => value) 
                  ? `Aucun ${activeTab === 'pushcart' ? 'prospect pushcart' : 'point de vente'} ne correspond à vos critères de recherche.`
                  : `Aucun ${activeTab === 'pushcart' ? 'prospect pushcart' : 'point de vente'} enregistré pour le moment.`
                }
              </div>
              {(activeTab === 'pushcart' ? Object.values(filters) : Object.values(filtersPOS)).some(value => value) && (
                <button
                  onClick={activeTab === 'pushcart' ? resetFilters : resetFiltersPOS}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-sm"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {activeTab === 'pushcart' ? (
                        <>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Client
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Zone & Base
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Type & Commercial
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Contact
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Montant & Quantité
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Date
                          </th>
                        </>
                      ) : (
                        <>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Point de vente
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Propriétaire & Contact
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Localisation
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Type & Statut
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Ventes & Commandes
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Date d'enregistrement
                          </th>
                        </>
                      )}
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {activeTab === 'pushcart' 
                      ? currentItems.map((purchase) => (
                          <tr key={purchase.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-semibold text-gray-900">{purchase.full_name}</div>
                              <div className="text-sm text-gray-500">{purchase.pushcard_type}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <MapPin size={14} className="text-indigo-500 mr-1" />
                                <span className="text-gray-900 font-medium">{purchase.zone}</span>
                              </div>
                              <div className="text-sm text-gray-500">{purchase.base}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-gray-900 font-medium">Commercial #{purchase.vendor}</div>
                              <div className="text-sm text-gray-500">{purchase.pushcard_type}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Phone size={14} className="text-emerald-500 mr-1" />
                                <span className="text-gray-900">{purchase.phone}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-semibold text-emerald-600">
                                {formatCurrency(purchase.total_sales_amount)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {purchase.total_sales_quantity} unités
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-gray-900 font-medium">
                                {formatDate(purchase.purchase_date).split(' ')[0]}
                              </div>
                              <div className="text-sm text-gray-500">
                                {formatDate(purchase.purchase_date).split(' ')[1]}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => {
                                  setSelectedPurchase(purchase);
                                  fetchPurchaseDetails(purchase.id);
                                }}
                                className="flex items-center px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors font-medium"
                              >
                                <Eye size={16} className="mr-1.5" />
                                Détails
                              </button>
                            </td>
                          </tr>
                        ))
                      : currentItemsPOS.map((purchase) => (
                          <tr key={purchase.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-semibold text-gray-900">{purchase.name}</div>
                              <div className="text-sm text-gray-500">{purchase.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-gray-900 font-medium">{purchase.owner}</div>
                              <div className="flex items-center text-sm text-gray-500">
                                <Phone size={14} className="mr-1" />
                                {purchase.phone}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <MapPin size={14} className="text-indigo-500 mr-1" />
                                <span className="text-gray-900">{purchase.address}</span>
                              </div>
                              <div className="text-sm text-gray-500">{purchase.commune}, {purchase.district}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-gray-900 font-medium capitalize">{purchase.type}</div>
                              <div className={`text-sm font-medium ${
                                purchase.status === 'actif' ? 'text-emerald-600' : 'text-red-600'
                              }`}>
                                {purchase.status}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-semibold text-emerald-600">
                                {formatCurrency(purchase.total_sales_amount)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {purchase.monthly_orders} commandes/mois
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-gray-900 font-medium">
                                {formatDate(purchase.registration_date).split(' ')[0]}
                              </div>
                              <div className="text-sm text-gray-500">
                                CA: {formatCurrency(purchase.turnover)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => {
                                  setSelectedPurchase(purchase);
                                  fetchPurchaseDetails(purchase.id);
                                }}
                                className="flex items-center px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors font-medium"
                              >
                                <Eye size={16} className="mr-1.5" />
                                Détails
                              </button>
                            </td>
                          </tr>
                        ))
                    }
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-700 font-medium">
                  Affichage de{' '}
                  <span className="text-gray-900">
                    {activeTab === 'pushcart' 
                      ? `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredPurchases.length)}`
                      : `${indexOfFirstItemPOS + 1}-${Math.min(indexOfLastItemPOS, filteredPurchasesPOS.length)}`
                    }
                  </span>{' '}
                  sur{' '}
                  <span className="text-gray-900">
                    {activeTab === 'pushcart' ? filteredPurchases.length : filteredPurchasesPOS.length}
                  </span>{' '}
                  résultats
                </div>
                
                <div className="flex items-center space-x-3">
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      activeTab === 'pushcart' ? setCurrentPage(1) : setCurrentPagePOS(1);
                    }}
                    className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                  >
                    <option value="5">5 par page</option>
                    <option value="10">10 par page</option>
                    <option value="20">20 par page</option>
                    <option value="50">50 par page</option>
                  </select>
                  
                  <button
                    onClick={activeTab === 'pushcart' ? prevPage : prevPagePOS}
                    disabled={activeTab === 'pushcart' ? currentPage === 1 : currentPagePOS === 1}
                    className={`px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium transition-colors ${
                      (activeTab === 'pushcart' ? currentPage === 1 : currentPagePOS === 1)
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Précédent
                  </button>
                  
                  {/* Numéros de page */}
                  <div className="flex space-x-1">
                    {getPageNumbers(
                      activeTab === 'pushcart' ? currentPage : currentPagePOS, 
                      activeTab === 'pushcart' ? totalPages : totalPagesPOS
                    ).map(pageNumber => (
                      <button
                        key={pageNumber}
                        onClick={() => activeTab === 'pushcart' ? goToPage(pageNumber) : goToPagePOS(pageNumber)}
                        className={`px-3 py-2 rounded-xl text-sm font-medium min-w-[40px] transition-colors ${
                          (activeTab === 'pushcart' ? currentPage : currentPagePOS) === pageNumber
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={activeTab === 'pushcart' ? nextPage : nextPagePOS}
                    disabled={activeTab === 'pushcart' ? currentPage === totalPages : currentPagePOS === totalPagesPOS}
                    className={`px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium transition-colors ${
                      (activeTab === 'pushcart' ? currentPage === totalPages : currentPagePOS === totalPagesPOS)
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Suivant
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal de détails */}
        {showDetailsModal && purchaseDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-screen overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-t-2xl">
                <div>
                  <h2 className="text-xl font-bold">Détails de la vente</h2>
                  <p className="text-indigo-100 text-sm mt-1">
                    {activeTab === 'pushcart' ? 'Vente' : 'Point de vente'} #{purchaseDetails.purchase.id}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-white hover:text-indigo-100 p-2 rounded-lg hover:bg-indigo-400 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              {detailsLoading ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="animate-spin text-indigo-600 mr-3" size={28} />
                  <span className="text-gray-600">Chargement des détails...</span>
                </div>
              ) : (
                <div className="p-6">
                  {/* Informations sur l'achat */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100">
                      <h3 className="font-semibold text-indigo-800 mb-3 flex items-center">
                        <User size={18} className="mr-2" />
                        {activeTab === 'pushcart' ? 'Informations client' : 'Informations point de vente'}
                      </h3>
                      <p className="text-gray-900 font-medium">{purchaseDetails.purchase.full_name}</p>
                      <div className="flex items-center mt-2 text-gray-600">
                        <MapPin size={14} className="mr-1" />
                        <span>{purchaseDetails.purchase.zone}</span>
                      </div>
                      {activeTab === 'pos' && selectedPurchase && (
                        <>
                          <div className="flex items-center mt-1 text-gray-600">
                            <Phone size={14} className="mr-1" />
                            <span>{(selectedPurchase as PurchasePOS).phone}</span>
                          </div>
                          <div className="flex items-center mt-1 text-gray-600">
                            <Users size={14} className="mr-1" />
                            <span>Propriétaire: {(selectedPurchase as PurchasePOS).owner}</span>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100">
                      <h3 className="font-semibold text-emerald-800 mb-3 flex items-center">
                        <ShoppingCart size={18} className="mr-2" />
                        Informations vente
                      </h3>
                      {activeTab === 'pushcart' && selectedPurchase && (
                        <p className="text-gray-900 font-medium">
                          {formatDate((selectedPurchase as Purchase).purchase_date)}
                        </p>
                      )}
                      <p className="text-emerald-600 font-bold mt-2 text-xl">
                        {formatCurrency(purchaseDetails.statistics.grand_total_amount)}
                      </p>
                      <p className="text-gray-600">Quantité: {purchaseDetails.statistics.grand_total_quantity} unités</p>
                    </div>
                  </div>
                  
                  {/* Détails des produits vendus */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <Package size={18} className="mr-2 text-indigo-500" />
                      Produits vendus
                    </h3>
                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Produit
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Format
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Prix unitaire
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Quantité
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Total
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {purchaseDetails.sales.map((sale) => (
                            <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="font-medium text-gray-900">{sale.product_variant.product.name}</div>
                                <div className="text-sm text-gray-500">SKU: {sale.product_variant.product.sku}</div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-gray-900 font-medium">
                                {sale.product_variant.format.name}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-gray-900">
                                {formatCurrency(sale.unit_price)}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                                  {sale.quantity}
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap font-semibold text-emerald-600">
                                {formatCurrency(sale.total_amount)}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(sale.created_at)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* Résumé */}
                  <div className="mt-8 p-5 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl text-white">
                    <h3 className="font-semibold mb-4 flex items-center">
                      <BarChart3 size={18} className="mr-2" />
                      Résumé de la vente
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white/20 p-3 rounded-lg">
                        <p className="text-sm opacity-90">Montant total</p>
                        <p className="font-bold text-lg">{formatCurrency(purchaseDetails.statistics.grand_total_amount)}</p>
                      </div>
                      <div className="bg-white/20 p-3 rounded-lg">
                        <p className="text-sm opacity-90">Quantité totale</p>
                        <p className="font-bold text-lg">{purchaseDetails.statistics.grand_total_quantity}</p>
                      </div>
                      <div className="bg-white/20 p-3 rounded-lg">
                        <p className="text-sm opacity-90">Produits différents</p>
                        <p className="font-bold text-lg">{purchaseDetails.statistics.total_products}</p>
                      </div>
                      <div className="bg-white/20 p-3 rounded-lg">
                        <p className="text-sm opacity-90">Variantes différentes</p>
                        <p className="font-bold text-lg">{purchaseDetails.statistics.total_variants}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="p-6 border-t border-gray-200 flex justify-end bg-gray-50 rounded-b-2xl">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PushcartManagement;