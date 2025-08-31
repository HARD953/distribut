"use client";
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Loader2, Filter, Download, User, Store, AlertCircle, ShoppingBag, Users } from 'lucide-react';
import { apiService } from './ApiService';

// Types pour les données de la carte
export interface MapCustomer {
  id: number;
  full_name: string;
  phone: string;
  zone: string;
  base: string;
  pushcard_type: string;
  latitude: number | null;
  longitude: number | null;
  purchase_date: string;
  photo_url: string;
  total_sales_amount: number;
  total_quantity: number;
  sales_count: number;
}

export interface PointOfSale {
  id: number;
  name: string;
  owner: string;
  type: string;
  type_display: string;
  status: string;
  status_display: string;
  phone: string;
  email: string;
  address: string;
  district: string;
  region: string;
  commune: string;
  latitude: number | null;
  longitude: number | null;
  avatar_url: string;
  turnover: number;
  monthly_orders: number;
  evaluation_score: number;
  registration_date: string;
  orders_summary: {
    total_orders: number;
    total_revenue: number;
    total_items: number;
  };
}

export interface CustomersResponse {
  customers: MapCustomer[];
}

export interface PointsOfSaleResponse {
  period: {
    start_date: string;
    end_date: string;
  };
  points_of_sale: PointOfSale[];
}

interface MapFilters {
  start_date: string;
  end_date: string;
  zone: string;
  pushcard_type: string;
}

// Icônes personnalisées
const customerIcon = new Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

const posIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

// Types de vue disponibles
type ViewType = 'customers' | 'points-of-sale' | 'both';

const MapComponent = () => {
  const [customers, setCustomers] = useState<MapCustomer[]>([]);
  const [pointsOfSale, setPointsOfSale] = useState<PointOfSale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MapFilters>({
    start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    zone: '',
    pushcard_type: ''
  });
  const [viewType, setViewType] = useState<ViewType>('both');

  // Coordonnées par défaut (Abidjan)
  const defaultCenter: [number, number] = [5.3599517, -4.0082563];
  const defaultZoom = 12;

  useEffect(() => {
    fetchMapData();
  }, []);

  const fetchMapData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Appel API pour les clients
      const customerParams = new URLSearchParams();
      if (filters.start_date) customerParams.append('start_date', filters.start_date);
      if (filters.end_date) customerParams.append('end_date', filters.end_date);
      
      if (filters.zone) customerParams.append('zone', filters.zone);
      if (filters.pushcard_type) customerParams.append('pushcard_type', filters.pushcard_type);
      
      console.log('Params clients:', customerParams.toString());
      console.log('URL clients:', `/carte/?${customerParams.toString()}`);
      
      const customerResponse = await apiService.get(`/carte/?${customerParams.toString()}`);
      
      if (!customerResponse.ok) {
        console.error('Erreur réponse clients:', customerResponse.status, customerResponse.statusText);
        throw new Error(`Erreur lors du chargement des clients: ${customerResponse.status}`);
      }
      
      const customerData: CustomersResponse = await customerResponse.json();
      console.log('Données clients reçues:', customerData);
      setCustomers(customerData.customers || []);
      
      // Appel API pour les points de vente
      const posParams = new URLSearchParams();
      if (filters.start_date) posParams.append('start_date', filters.start_date);
      if (filters.end_date) posParams.append('end_date', filters.end_date);
      
      console.log('Params points de vente:', posParams.toString());
      console.log('URL points de vente:', `/pointsaleorders/?${posParams.toString()}`);
      
      const posResponse = await apiService.get(`/pointsaleorders/?${posParams.toString()}`);
      
      if (!posResponse.ok) {
        console.error('Erreur réponse points de vente:', posResponse.status, posResponse.statusText);
        throw new Error(`Erreur lors du chargement des points de vente: ${posResponse.status}`);
      }
      
      const posData: PointsOfSaleResponse = await posResponse.json();
      console.log('Données points de vente reçues:', posData);
      setPointsOfSale(posData.points_of_sale || []);
      
    } catch (err) {
      console.error('Error fetching map data:', err);
      setError('Erreur lors du chargement des données de la carte. Voir la console pour plus de détails.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: keyof MapFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    fetchMapData();
  };

  const exportData = () => {
    if (viewType === 'customers' && customers.length === 0) return;
    if (viewType === 'points-of-sale' && pointsOfSale.length === 0) return;
    
    let headers = "";
    let csvContent = "";
    
    if (viewType === 'customers' || viewType === 'both') {
      headers = "Nom, Téléphone, Zone, Base, Type de carte, Montant total, Quantité totale, Nombre de ventes\n";
      csvContent = customers.reduce((acc, customer) => {
        return acc + `"${customer.full_name}", "${customer.phone}", "${customer.zone}", "${customer.base}", "${customer.pushcard_type}", ${customer.total_sales_amount}, ${customer.total_quantity}, ${customer.sales_count}\n`;
      }, headers);
    }
    
    if (viewType === 'points-of-sale' || viewType === 'both') {
      headers = "Nom, Propriétaire, Type, Statut, Téléphone, Adresse, Chiffre d'affaires, Commandes mensuelles\n";
      csvContent = pointsOfSale.reduce((acc, pos) => {
        return acc + `"${pos.name}", "${pos.owner}", "${pos.type_display}", "${pos.status_display}", "${pos.phone}", "${pos.address}", ${pos.turnover}, ${pos.monthly_orders}\n`;
      }, csvContent + (csvContent ? "\n" : "") + headers);
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `donnees_carte_${filters.start_date}_${filters.end_date}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fonction pour valider les coordonnées
  const isValidCoordinate = (lat: number | null, lng: number | null): boolean => {
    if (lat === null || lng === null) return false;
    if (isNaN(lat) || isNaN(lng)) return false;
    if (lat < -90 || lat > 90) return false;
    if (lng < -180 || lng > 180) return false;
    return true;
  };

  // Filtrer les clients avec des coordonnées valides
  const validCustomers = customers.filter(customer => 
    isValidCoordinate(customer.latitude, customer.longitude)
  );

  // Filtrer les points de vente avec des coordonnées valides
  const validPointsOfSale = pointsOfSale.filter(pos => 
    isValidCoordinate(pos.latitude, pos.longitude)
  );

  // Calculer les totaux
  const totalCustomerSales = customers.reduce((sum, customer) => sum + customer.total_sales_amount, 0);
  const totalPosRevenue = pointsOfSale.reduce((sum, pos) => sum + pos.turnover, 0);
  const totalOrders = pointsOfSale.reduce((sum, pos) => sum + pos.orders_summary.total_orders, 0);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
          <h2 className="text-xl font-bold text-gray-800">Carte des Ventes et Points de Vente</h2>
          
          <div className="flex flex-wrap gap-2">
            {/* Boutons de sélection de vue */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewType('customers')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewType === 'customers' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Users size={16} className="inline mr-1" />
                Clients
              </button>
              <button
                onClick={() => setViewType('points-of-sale')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewType === 'points-of-sale' 
                    ? 'bg-green-600 text-white' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Store size={16} className="inline mr-1" />
                Points de vente
              </button>
              <button
                onClick={() => setViewType('both')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewType === 'both' 
                    ? 'bg-purple-600 text-white' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <ShoppingBag size={16} className="inline mr-1" />
                Les deux
              </button>
            </div>
            
            <button 
              onClick={exportData}
              disabled={
                (viewType === 'customers' && customers.length === 0) ||
                (viewType === 'points-of-sale' && pointsOfSale.length === 0) ||
                (viewType === 'both' && customers.length === 0 && pointsOfSale.length === 0)
              }
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Download size={16} className="mr-2" />
              Exporter
            </button>
          </div>
        </div>

        {/* Filtres */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
            <input
              type="text"
              value={filters.zone}
              onChange={(e) => handleFilterChange('zone', e.target.value)}
              placeholder="Filtrer par zone"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type de carte</label>
            <select
              value={filters.pushcard_type}
              onChange={(e) => handleFilterChange('pushcard_type', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tous les types</option>
              <option value="TopTop">TopTop</option>
              <option value="Classic">Classic</option>
              <option value="Premium">Premium</option>
            </select>
          </div>
          <div className="md:col-span-4 flex justify-end">
            <button
              onClick={handleApplyFilters}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Filter size={16} className="mr-2" />
              Appliquer les filtres
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="text-red-600 mr-2" size={20} />
            <div>
              <p className="text-red-800 font-medium">{error}</p>
              <p className="text-red-700 text-sm mt-1">Ouvrez la console du navigateur (F12) pour voir les détails.</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-96 bg-gray-100 rounded-lg">
            <div className="flex items-center space-x-2">
              <Loader2 className="animate-spin text-blue-600" size={24} />
              <span className="text-gray-600">Chargement des données cartographiques...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Avertissement sur les données invalides */}
            {((viewType === 'customers' || viewType === 'both') && customers.length > validCustomers.length) ||
             ((viewType === 'points-of-sale' || viewType === 'both') && pointsOfSale.length > validPointsOfSale.length) && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
                <AlertCircle className="text-yellow-600 mr-2 mt-0.5" size={16} />
                <div>
                  <p className="text-yellow-800 text-sm font-medium">Données incomplètes</p>
                    <p className="text-yellow-700 text-sm">
                    {viewType !== 'points-of-sale' && `${customers.length - validCustomers.length} client(s) sans coordonnées valides`}
                    {viewType === 'both' && customers.length > validCustomers.length && pointsOfSale.length > validPointsOfSale.length && ' et '}
                    {/* {viewType !== 'customers' && `${pointsOfSale.length - validPointsOfSale.length} point(s) de vente sans coordonnées valides`} */}
                    </p>
                </div>
              </div>
            )}

            {/* Légende */}
            <div className="flex flex-wrap gap-4 mb-4">
              {(viewType === 'customers' || viewType === 'both') && (
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-sm">Clients ({validCustomers.length})</span>
                </div>
              )}
              {(viewType === 'points-of-sale' || viewType === 'both') && (
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm">Points de vente ({validPointsOfSale.length})</span>
                </div>
              )}
            </div>

            {/* Carte Leaflet */}
            <div className="h-96 rounded-lg mb-6 overflow-hidden border border-gray-300">
              <MapContainer
                center={defaultCenter}
                zoom={defaultZoom}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Marqueurs pour les clients avec coordonnées valides */}
                {(viewType === 'customers' || viewType === 'both') && validCustomers.map((customer) => (
                  <Marker
                    key={`customer-${customer.id}`}
                    position={[customer.latitude as number, customer.longitude as number]}
                    icon={customerIcon}
                  >
                    <Popup>
                      <div className="p-2 max-w-xs">
                        <div className="flex items-center mb-2">
                          {customer.photo_url ? (
                            <img 
                              src={customer.photo_url} 
                              alt={customer.full_name}
                              className="w-10 h-10 rounded-full object-cover mr-2"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const placeholder = target.nextElementSibling as HTMLElement;
                                if (placeholder) placeholder.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-2 ${customer.photo_url ? 'hidden' : ''}`}>
                            <User size={20} className="text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-blue-600">{customer.full_name}</h3>
                            <p className="text-sm text-gray-500">{customer.phone}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="font-medium">Zone:</span> {customer.zone}
                          </div>
                          <div>
                            <span className="font-medium">Base:</span> {customer.base}
                          </div>
                          <div>
                            <span className="font-medium">Type carte:</span> {customer.pushcard_type}
                          </div>
                          <div>
                            <span className="font-medium">Achat:</span> {new Date(customer.purchase_date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                          <p className="font-semibold text-blue-800">
                            Dépense: {customer.total_sales_amount.toLocaleString()} FCFA
                          </p>
                          <p className="text-xs text-blue-600">
                            {customer.total_quantity} article(s) • {customer.sales_count} achat(s)
                          </p>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
                
                {/* Marqueurs pour les points de vente avec coordonnées valides */}
                {(viewType === 'points-of-sale' || viewType === 'both') && validPointsOfSale.map((pos) => (
                  <Marker
                    key={`pos-${pos.id}`}
                    position={[pos.latitude as number, pos.longitude as number]}
                    icon={posIcon}
                  >
                    <Popup>
                      <div className="p-2 max-w-xs">
                        <div className="flex items-center mb-2">
                          {pos.avatar_url ? (
                            <img 
                              src={pos.avatar_url} 
                              alt={pos.name}
                              className="w-10 h-10 rounded-full object-cover mr-2"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const placeholder = target.nextElementSibling as HTMLElement;
                                if (placeholder) placeholder.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-2 ${pos.avatar_url ? 'hidden' : ''}`}>
                            <Store size={20} className="text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-green-600">{pos.name}</h3>
                            <p className="text-sm text-gray-500">Propriétaire: {pos.owner}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                          <div>
                            <span className="font-medium">Type:</span> {pos.type_display}
                          </div>
                          <div>
                            <span className="font-medium">Statut:</span> {pos.status_display}
                          </div>
                          <div>
                            <span className="font-medium">Tél:</span> {pos.phone}
                          </div>
                          <div>
                            <span className="font-medium">Inscription:</span> {new Date(pos.registration_date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Adresse:</span> {pos.address}
                        </div>
                        <div className="mt-2 p-2 bg-green-50 rounded-lg">
                          <p className="font-semibold text-green-800">
                            CA: {pos.turnover.toLocaleString()} FCFA
                          </p>
                          <p className="text-xs text-green-600">
                            {pos.monthly_orders} commande(s) mensuelle(s) • Score: {pos.evaluation_score}/5
                          </p>
                          <p className="text-xs text-green-600">
                            {pos.orders_summary.total_orders} commande(s) • {pos.orders_summary.total_items} article(s)
                          </p>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            {/* Résumé des données */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(viewType === 'customers' || viewType === 'both') && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 flex items-center">
                    <Users size={18} className="mr-2" />
                    Clients
                  </h3>
                  <p className="text-2xl font-bold">{customers.length}</p>
                  <p className="text-sm text-blue-600">
                    {validCustomers.length} avec coordonnées valides
                  </p>
                  <p className="text-lg font-semibold mt-2">
                    {totalCustomerSales.toLocaleString()} FCFA
                  </p>
                  <p className="text-sm text-blue-700">Chiffre d'affaires total</p>
                </div>
              )}
              
              {(viewType === 'points-of-sale' || viewType === 'both') && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 flex items-center">
                    <Store size={18} className="mr-2" />
                    Points de vente
                  </h3>
                  <p className="text-2xl font-bold">{pointsOfSale.length}</p>
                  <p className="text-sm text-green-600">
                    {validPointsOfSale.length} avec coordonnées valides
                  </p>
                  <p className="text-lg font-semibold mt-2">
                    {totalPosRevenue.toLocaleString()} FCFA
                  </p>
                  <p className="text-sm text-green-700">Chiffre d'affaires total</p>
                </div>
              )}
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-800 flex items-center">
                  <ShoppingBag size={18} className="mr-2" />
                  Commandes
                </h3>
                <p className="text-2xl font-bold">{totalOrders}</p>
                <p className="text-sm text-purple-600">Total des commandes</p>
                {(viewType === 'both') && (
                  <>
                    <p className="text-lg font-semibold mt-2">
                      {(totalCustomerSales + totalPosRevenue).toLocaleString()} FCFA
                    </p>
                    <p className="text-sm text-purple-700">CA global</p>
                  </>
                )}
              </div>
            </div>

            {/* Liste des données (optionnel) */}
            {((viewType === 'customers' || viewType === 'both') && customers.length > 0) && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Users size={20} className="mr-2" />
                  Derniers clients
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type de carte</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coordonnées</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {customers.slice(0, 5).map((customer) => {
                        const hasValidCoords = isValidCoordinate(customer.latitude, customer.longitude);
                        return (
                          <tr key={customer.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {customer.photo_url ? (
                                  <img 
                                    src={customer.photo_url} 
                                    alt={customer.full_name}
                                    className="w-8 h-8 rounded-full object-cover mr-2"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const placeholder = target.nextElementSibling as HTMLElement;
                                      if (placeholder) placeholder.classList.remove('hidden');
                                    }}
                                  />
                                ) : null}
                                <div className={`w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2 ${customer.photo_url ? 'hidden' : ''}`}>
                                  <User size={16} className="text-blue-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-900">{customer.full_name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.phone}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.zone}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.pushcard_type}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {hasValidCoords ? (
                                <span className="text-green-600">Valides</span>
                              ) : (
                                <span className="text-red-600 flex items-center">
                                  <AlertCircle size={14} className="mr-1" />
                                  Manquantes
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.total_sales_amount.toLocaleString()} FCFA</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {((viewType === 'points-of-sale' || viewType === 'both') && pointsOfSale.length > 0) && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Store size={20} className="mr-2" />
                  Points de vente
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Point de vente</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Propriétaire</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coordonnées</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chiffre d'affaires</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pointsOfSale.slice(0, 5).map((pos) => {
                        const hasValidCoords = isValidCoordinate(pos.latitude, pos.longitude);
                        return (
                          <tr key={pos.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {pos.avatar_url ? (
                                  <img 
                                    src={pos.avatar_url} 
                                    alt={pos.name}
                                    className="w-8 h-8 rounded-full object-cover mr-2"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const placeholder = target.nextElementSibling as HTMLElement;
                                      if (placeholder) placeholder.classList.remove('hidden');
                                    }}
                                  />
                                ) : null}
                                <div className={`w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-2 ${pos.avatar_url ? 'hidden' : ''}`}>
                                  <Store size={16} className="text-green-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-900">{pos.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pos.owner}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pos.type_display}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pos.phone}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {hasValidCoords ? (
                                <span className="text-green-600">Valides</span>
                              ) : (
                                <span className="text-red-600 flex items-center">
                                  <AlertCircle size={14} className="mr-1" />
                                  Manquantes
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pos.turnover.toLocaleString()} FCFA</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {((viewType === 'customers' && customers.length === 0) ||
              (viewType === 'points-of-sale' && pointsOfSale.length === 0) ||
              (viewType === 'both' && customers.length === 0 && pointsOfSale.length === 0)) && (
              <div className="text-center py-8">
                <MapPin size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-600">Aucune donnée disponible</h3>
                <p className="text-gray-500">Aucune donnée trouvée pour les filtres sélectionnés.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MapComponent;