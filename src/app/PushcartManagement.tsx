"use client";
import React, { useState, useEffect } from 'react';
import { 
  Filter, Search, MapPin, Calendar, User, Phone, 
  DollarSign, Package, BarChart3, ChevronDown, ChevronUp,
  Download, Eye, MoreVertical, X, Plus, Loader2,
  ArrowLeft, ShoppingCart, Bike, RefreshCw
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { apiService } from './ApiService';

// Interface pour les données d'achat
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
    purchase_date: string;
    vendor: string;
  };
  sales: SaleDetail[];
  statistics: SaleStatistics;
}

const PushcartManagement = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([]);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [purchaseDetails, setPurchaseDetails] = useState<PurchaseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  
  // États pour les filtres
  const [filters, setFilters] = useState({
    search: '',
    zone: '',
    pushcard_type: '',
    start_date: '',
    end_date: '',
    vendor: ''
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [zones, setZones] = useState<string[]>([]);
  const [pushcardTypes, setPushcardTypes] = useState<string[]>([]);

  // Charger les données initiales
  useEffect(() => {
    fetchPurchases();
  }, []);

  // Filtrer les données lorsque les filtres changent
  useEffect(() => {
    filterPurchases();
  }, [filters, purchases]);

  // Fonction pour récupérer les achats
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

  // Fonction pour récupérer les détails d'un achat
  const fetchPurchaseDetails = async (purchaseId: number) => {
    try {
      setDetailsLoading(true);
      setError(null);
      
      const response = await apiService.get(`/purchasedata/${purchaseId}/sales_details/`);
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const data: PurchaseDetails = await response.json();
      setPurchaseDetails(data);
      setShowDetailsModal(true);
      
    } catch (err) {
      console.error('Erreur lors du chargement des détails:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setDetailsLoading(false);
    }
  };

  // Filtrer les achats selon les critères
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

  // Réinitialiser les filtres
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
    const csvContent = [
      ['Nom complet', 'Zone', 'Base', 'Type', 'Téléphone', 'Date', 'Montant total', 'Quantité'],
      ...filteredPurchases.map(p => [
        p.full_name,
        p.zone,
        p.base,
        p.pushcard_type,
        p.phone,
        formatDate(p.purchase_date),
        p.total_sales_amount,
        p.total_sales_quantity
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `pushcarts_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg mr-3">
            <Bike className="text-white" size={28} />
          </div>
          Gestion des Pushcarts
        </h1>
        <p className="text-gray-600 mt-2">Suivi et gestion des ventes par pushcart</p>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total des ventes</p>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(purchases.reduce((sum, p) => sum + Number(p.total_sales_amount), 0))}
              </p>
            </div>
            <div className="p-3 bg-blue-400 bg-opacity-30 rounded-full">
              <DollarSign size={24} />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-blue-400 border-opacity-30 flex items-center">
            <span className="text-sm">+12% ce mois</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Nombre de ventes</p>
              <p className="text-2xl font-bold mt-1">
                {purchases.length}
              </p>
            </div>
            <div className="p-3 bg-green-400 bg-opacity-30 rounded-full">
              <ShoppingCart size={24} />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-green-400 border-opacity-30 flex items-center">
            <span className="text-sm">+8% ce mois</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Zones couvertes</p>
              <p className="text-2xl font-bold mt-1">
                {zones.length}
              </p>
            </div>
            <div className="p-3 bg-purple-400 bg-opacity-30 rounded-full">
              <MapPin size={24} />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-purple-400 border-opacity-30 flex items-center">
            <span className="text-sm">+2 nouvelles zones</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Types de pushcarts</p>
              <p className="text-2xl font-bold mt-1">
                {pushcardTypes.length}
              </p>
            </div>
            <div className="p-3 bg-orange-400 bg-opacity-30 rounded-full">
              <Bike size={24} />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-orange-400 border-opacity-30 flex items-center">
            <span className="text-sm">Stable ce mois</span>
          </div>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher un client, zone, base..."
              className="pl-10 pr-4 py-3 w-full border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors font-medium"
            >
              <Filter size={18} className="mr-2" />
              Filtres
              {showFilters ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />}
            </button>
            
            <button
              onClick={exportData}
              className="flex items-center px-4 py-2.5 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors font-medium"
            >
              <Download size={18} className="mr-2" />
              Exporter
            </button>
            
            <button
              onClick={fetchPurchases}
              className="p-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              title="Actualiser"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
        
        {/* Panneau de filtres avancés */}
        {showFilters && (
          <div className="p-5 border-b border-gray-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-blue-50 bg-opacity-30">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
              <select
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Type de pushcart</label>
              <select
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendeur</label>
              <input
                type="text"
                placeholder="ID du vendeur"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.vendor}
                onChange={(e) => setFilters({...filters, vendor: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.start_date}
                onChange={(e) => setFilters({...filters, start_date: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          </div>
        )}
      </div>

      {/* Tableau des données */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="animate-spin text-blue-600 mr-3" size={28} />
            <span className="text-gray-600">Chargement des données...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="mx-auto w-16 h-16 flex items-center justify-center bg-red-100 rounded-full mb-4">
              <X className="text-red-600" size={28} />
            </div>
            <div className="text-red-600 font-medium mb-2">Erreur lors du chargement des données</div>
            <div className="text-gray-600 mb-6">{error}</div>
            <button
              onClick={fetchPurchases}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-colors shadow-md"
            >
              Réessayer
            </button>
          </div>
        ) : filteredPurchases.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mb-4">
              <Search className="text-gray-500" size={28} />
            </div>
            <div className="text-gray-600 font-medium mb-4">Aucune donnée à afficher</div>
            {Object.values(filters).some(value => value) && (
              <button
                onClick={resetFilters}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-colors shadow-md"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Zone & Base
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Type & Vendeur
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Montant & Quantité
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPurchases.map((purchase) => (
                    <tr key={purchase.id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{purchase.full_name}</div>
                        <div className="text-sm text-gray-500">{purchase.pushcard_type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <MapPin size={14} className="text-blue-500 mr-1" />
                          <span className="text-gray-900 font-medium">{purchase.zone}</span>
                        </div>
                        <div className="text-sm text-gray-500">{purchase.base}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900 font-medium">Vendeur #{purchase.vendor}</div>
                        <div className="text-sm text-gray-500">{purchase.pushcard_type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Phone size={14} className="text-green-500 mr-1" />
                          <span className="text-gray-900">{purchase.phone}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-green-600">
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
                          onClick={() => fetchPurchaseDetails(purchase.id)}
                          className="flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                        >
                          <Eye size={16} className="mr-1.5" />
                          Détails
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination (optionnelle) */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Affichage de <span className="font-medium">{filteredPurchases.length}</span> résultats
              </div>
              
              <div className="flex space-x-2">
                <button
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 font-medium"
                  disabled
                >
                  Précédent
                </button>
                <button
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 font-medium"
                  disabled
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
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-2xl">
              <h2 className="text-xl font-bold">Détails de la vente</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-white hover:text-blue-100"
              >
                <X size={24} />
              </button>
            </div>
            
            {detailsLoading ? (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="animate-spin text-blue-600 mr-3" size={28} />
                <span className="text-gray-600">Chargement des détails...</span>
              </div>
            ) : (
              <div className="p-6">
                {/* Informations sur l'achat */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                    <h3 className="font-medium text-blue-800 mb-3 flex items-center">
                      <User size={18} className="mr-2" />
                      Informations client
                    </h3>
                    <p className="text-gray-900 font-medium">{purchaseDetails.purchase.full_name}</p>
                    <p className="text-gray-600 mt-1">{purchaseDetails.purchase.zone}</p>
                    <p className="text-gray-600">Vendeur: {purchaseDetails.purchase.vendor}</p>
                  </div>
                  
                  <div className="bg-green-50 p-5 rounded-xl border border-green-100">
                    <h3 className="font-medium text-green-800 mb-3 flex items-center">
                      <ShoppingCart size={18} className="mr-2" />
                      Informations vente
                    </h3>
                    <p className="text-gray-900 font-medium">{formatDate(purchaseDetails.purchase.purchase_date)}</p>
                    <p className="text-green-600 font-bold mt-2 text-lg">{formatCurrency(purchaseDetails.statistics.grand_total_amount)}</p>
                    <p className="text-gray-600">Quantité: {purchaseDetails.statistics.grand_total_quantity} unités</p>
                  </div>
                </div>
                
                {/* Détails des produits vendus */}
                <h3 className="font-medium text-gray-700 mb-4 flex items-center">
                  <Package size={18} className="mr-2 text-blue-500" />
                  Produits vendus
                </h3>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Produit
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Format
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Prix unitaire
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantité
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {purchaseDetails.sales.map((sale) => (
                        <tr key={sale.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{sale.product_variant.product.name}</div>
                            <div className="text-sm text-gray-500">SKU: {sale.product_variant.product.sku}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {sale.product_variant.format.name}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {formatCurrency(sale.unit_price)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                              {sale.quantity}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap font-medium text-green-600">
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
                
                {/* Résumé */}

                    <div className="mt-8 p-5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white">
                    <h3 className="font-medium mb-4 flex items-center">
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
  );
};

export default PushcartManagement;