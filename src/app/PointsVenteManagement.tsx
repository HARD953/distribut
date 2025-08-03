"use client";
import React, { useState, useEffect } from 'react';
import { 
  MapPin, Plus, Search, Filter, Edit, Trash2, Eye, 
  Phone, Mail, User, Calendar, TrendingUp, AlertCircle,
  CheckCircle, Clock, Star, MoreVertical, Download,
  Navigation, Building2, Users, ChevronLeft, X,
  Shield, ChevronDown, ChevronRight, Loader
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Chargement dynamique de la carte avec désactivation du SSR
const MapWithNoSSR = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg animate-pulse">
      <div className="text-center space-y-2">
        <Navigation size={48} className="text-blue-500 mx-auto" />
        <p className="text-blue-700 font-medium">Chargement de la carte...</p>
      </div>
    </div>
  )
});



interface PointOfSale {
  id: string;
  name: string;
  owner: string;
  phone: string;
  email: string;
  address: string;
  latitude: number;
  longitude: number;
  district: string;
  region: string;
  commune: string;
  type: string;
  status: string;
  registration_date: string;
  turnover: string;
  monthly_orders: number;
  evaluation_score: number;
}

const PointsVenteManagement = () => {
  const API_BASE_URL = 'https://backendsupply.onrender.com/api';
  const [pointsVente, setPointsVente] = useState<PointOfSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [activeView, setActiveView] = useState('liste');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<PointOfSale | null>(null);
  const [newPoint, setNewPoint] = useState({
    name: '',
    owner: '',
    phone: '',
    email: '',
    address: '',
    type: 'boutique',
    district: '',
    region: '',
    commune: '',
    latitude: 0,
    longitude: 0
  });
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Types de points de vente
  const pointTypes = [
    { value: 'boutique', label: 'Boutique' },
    { value: 'supermarche', label: 'Supermarché' },
    { value: 'superette', label: 'Supérette' },
    { value: 'epicerie', label: 'Épicerie' },
    { value: 'demi_grossiste', label: 'Demi-Grossiste' },
    { value: 'grossiste', label: 'Grossiste' }
  ];

  // Statuts
  const statusOptions = [
    { value: 'actif', label: 'Actif' },
    { value: 'suspendu', label: 'Suspendu' },
    { value: 'en_attente', label: 'En attente' }
  ];

  // Couleurs
  const colors = {
    primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white',
    secondary: 'bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-700 border border-gray-200',
    danger: 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white',
    success: 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white',
    warning: 'bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white'
  };

  // Obtenir la position géographique
  const getCurrentLocation = () => {
    setIsFetchingLocation(true);
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocationError('La géolocalisation n\'est pas supportée par votre navigateur');
      setIsFetchingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setNewPoint({
          ...newPoint,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setIsFetchingLocation(false);
      },
      (error) => {
        setLocationError('Erreur lors de la récupération de la position: ' + error.message);
        setIsFetchingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Charger les points de vente
  useEffect(() => {
    const fetchPointsVente = async () => {
      const token = localStorage.getItem('access');
      if (!token) {
        setError('Veuillez vous connecter.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE_URL}/points-vente/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Erreur lors du chargement des points de vente');
        }

        const data = await response.json();
        // Validation des coordonnées
        const validatedData = data.map((point: PointOfSale) => ({
          ...point,
          latitude: isValidCoordinate(point.latitude) ? point.latitude : 5.3197,
          longitude: isValidCoordinate(point.longitude) ? point.longitude : -4.0267
        }));
        setPointsVente(validatedData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPointsVente();
  }, []);

  // Valider les coordonnées
  const isValidCoordinate = (coord: number) => {
    return typeof coord === 'number' && !isNaN(coord) && coord !== 0;
  };

  // Filtrer les points de vente
  const filteredPoints = pointsVente.filter(point => {
    const matchesSearch = 
      point.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      point.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      point.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || point.status === filterStatus;
    const matchesType = filterType === 'all' || point.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Obtenir le style du statut
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'actif':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'suspendu':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'en_attente':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Obtenir l'icône du statut
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'actif':
        return <CheckCircle size={14} className="text-emerald-500" />;
      case 'suspendu':
        return <AlertCircle size={14} className="text-red-500" />;
      case 'en_attente':
        return <Clock size={14} className="text-amber-500" />;
      default:
        return null;
    }
  };

  // Ajouter un nouveau point de vente
  const handleAddPoint = async () => {
    const token = localStorage.getItem('access');
    if (!token) {
      setError('Veuillez vous connecter.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/points-vente/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newPoint,
          status: 'en_attente',
          latitude: isValidCoordinate(newPoint.latitude) ? newPoint.latitude : 5.3197,
          longitude: isValidCoordinate(newPoint.longitude) ? newPoint.longitude : -4.0267,
          turnover: "0.00",
          monthly_orders: 0,
          evaluation_score: 0,
          registration_date: new Date().toISOString().split('T')[0]
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'ajout du point de vente');
      }

      const createdPoint = await response.json();
      setPointsVente([...pointsVente, createdPoint]);
      setShowAddModal(false);
      setNewPoint({
        name: '',
        owner: '',
        phone: '',
        email: '',
        address: '',
        type: 'boutique',
        district: '',
        region: '',
        commune: '',
        latitude: 0,
        longitude: 0
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un point de vente
  const deletePoint = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce point de vente ?')) return;
    
    const token = localStorage.getItem('access');
    if (!token) {
      setError('Veuillez vous connecter.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/points-vente/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression du point de vente');
      }

      setPointsVente(pointsVente.filter(point => point.id !== id));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Statistiques
  const stats = [
    {
      title: 'Total Points de Vente',
      value: pointsVente.length.toString(),
      icon: Building2,
      bg: 'bg-gradient-to-br from-indigo-600 to-blue-500',
      border: 'border-indigo-500'
    },
    {
      title: 'Points Actifs',
      value: pointsVente.filter(p => p.status === 'actif').length.toString(),
      icon: CheckCircle,
      bg: 'bg-gradient-to-br from-emerald-600 to-teal-500',
      border: 'border-emerald-500'
    },
    {
      title: 'En Attente',
      value: pointsVente.filter(p => p.status === 'en_attente').length.toString(),
      icon: Clock,
      bg: 'bg-gradient-to-br from-amber-500 to-yellow-400',
      border: 'border-amber-400'
    },
    {
      title: 'CA Moyen/Mois',
      value: `₣ ${(pointsVente.reduce((sum, point) => sum + parseFloat(point.turnover), 0) / (pointsVente.length || 1)).toFixed(2)}`,
      icon: TrendingUp,
      bg: 'bg-gradient-to-br from-rose-500 to-pink-500',
      border: 'border-rose-400'
    }
  ];

  // Vue Liste
  const ListView = () => (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className={`p-5 rounded-xl border ${stat.bg} ${stat.border} text-white shadow-md`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/90">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <div className="p-2 rounded-full bg-white/10">
                <stat.icon size={20} className="text-white/90" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Rechercher un point de vente..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les statuts</option>
              {statusOptions.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>

            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les types</option>
              {pointTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveView('carte')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${colors.secondary}`}
            >
              <Navigation size={16} />
              <span>Vue Carte</span>
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${colors.primary}`}
            >
              <Plus size={16} />
              <span>Ajouter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tableau des points de vente */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader className="animate-spin text-blue-600" size={32} />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-100 text-red-600 rounded-lg text-center">
          {error}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Point de Vente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Propriétaire</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Localisation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPoints.map((point) => (
                  <tr key={point.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <MapPin className="text-blue-600" size={20} />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{point.name}</div>
                          <div className="text-xs text-gray-500">{point.commune}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{point.owner}</div>
                      <div className="text-xs text-gray-500">{point.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {pointTypes.find(t => t.value === point.type)?.label || point.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(point.status)}`}>
                        {getStatusIcon(point.status)}
                        {statusOptions.find(s => s.value === point.status)?.label || point.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{point.district}</div>
                      <div className="text-xs text-gray-500">{point.region}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setSelectedPoint(point)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Eye size={16} />
                        </button>
                        <button className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg">
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => deletePoint(point.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  // Vue Carte
  const MapView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Carte des Points de Vente</h3>
        <button 
          onClick={() => setActiveView('liste')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${colors.secondary}`}
        >
          <ChevronLeft size={16} />
          <span>Retour à la liste</span>
        </button>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-[600px]">
        <MapWithNoSSR 
          points={filteredPoints} 
          center={[5.3599517, -4.0082563]} // Coordonnées centrales d'Abidjan
          zoom={12} 
          onPointClick={setSelectedPoint}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Gestion des Points de Vente</h1>
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
            <Download size={20} />
          </button>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
            <Filter size={20} />
          </button>
        </div>
      </header>

      {activeView === 'liste' ? <ListView /> : <MapView />}

      {/* Modal d'ajout */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-xl">
              <h3 className="text-xl font-semibold text-white">Ajouter un Point de Vente</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du Point de Vente *
                  </label>
                  <input 
                    type="text"
                    value={newPoint.name}
                    onChange={(e) => setNewPoint({...newPoint, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Supermarché Central"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Propriétaire *
                  </label>
                  <input 
                    type="text"
                    value={newPoint.owner}
                    onChange={(e) => setNewPoint({...newPoint, owner: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Jean Kouadio"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone *
                  </label>
                  <input 
                    type="tel"
                    value={newPoint.phone}
                    onChange={(e) => setNewPoint({...newPoint, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+225 XX XX XX XX XX"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input 
                    type="email"
                    value={newPoint.email}
                    onChange={(e) => setNewPoint({...newPoint, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="email@exemple.com"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select 
                    value={newPoint.type}
                    onChange={(e) => setNewPoint({...newPoint, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {pointTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    District *
                  </label>
                  <input 
                    type="text"
                    value={newPoint.district}
                    onChange={(e) => setNewPoint({...newPoint, district: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Région *
                  </label>
                  <input 
                    type="text"
                    value={newPoint.region}
                    onChange={(e) => setNewPoint({...newPoint, region: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Commune *
                  </label>
                  <input 
                    type="text"
                    value={newPoint.commune}
                    onChange={(e) => setNewPoint({...newPoint, commune: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Coordonnées
                  </label>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">Latitude</label>
                      <input 
                        type="number"
                        value={newPoint.latitude || ''}
                        onChange={(e) => setNewPoint({...newPoint, latitude: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Latitude"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">Longitude</label>
                      <input 
                        type="number"
                        value={newPoint.longitude || ''}
                        onChange={(e) => setNewPoint({...newPoint, longitude: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Longitude"
                      />
                    </div>
                    <button
                      onClick={getCurrentLocation}
                      disabled={isFetchingLocation}
                      className={`px-4 py-2 rounded-lg ${isFetchingLocation ? 'bg-gray-300' : colors.primary}`}
                    >
                      {isFetchingLocation ? (
                        <Loader className="animate-spin" size={16} />
                      ) : (
                        <span>Obtenir Position</span>
                      )}
                    </button>
                  </div>
                  {locationError && (
                    <p className="mt-2 text-sm text-red-600">{locationError}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse Complète *
                </label>
                <textarea 
                  value={newPoint.address}
                  onChange={(e) => setNewPoint({...newPoint, address: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Adresse complète avec quartier, commune, ville"
                  required
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button 
                onClick={() => setShowAddModal(false)}
                className={`px-4 py-2 rounded-lg ${colors.secondary}`}
              >
                Annuler
              </button>
              <button 
                onClick={handleAddPoint}
                className={`px-4 py-2 rounded-lg ${colors.primary}`}
                disabled={!newPoint.name || !newPoint.owner || !newPoint.phone || !newPoint.email || !newPoint.address || !newPoint.district || !newPoint.region || !newPoint.commune}
              >
                {loading ? <Loader className="animate-spin" size={16} /> : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de détails */}
      {selectedPoint && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getStatusStyle(selectedPoint.status)}`}>
                  <MapPin size={20} className="text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white">{selectedPoint.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedPoint(null)}
                className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-4">Informations Générales</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <User size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Propriétaire</p>
                          <p className="font-medium">{selectedPoint.owner}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <Phone size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Téléphone</p>
                          <p className="font-medium">{selectedPoint.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <Mail size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium">{selectedPoint.email}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <Building2 size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Type</p>
                          <p className="font-medium">
                            {pointTypes.find(t => t.value === selectedPoint.type)?.label || selectedPoint.type}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-5">
                    <h4 className="font-semibold text-gray-800 mb-4">Localisation</h4>
                    <div className="h-48 rounded-lg overflow-hidden border border-gray-200">
                      <MapWithNoSSR 
                        points={[selectedPoint]} 
                        center={[isValidCoordinate(selectedPoint.latitude) ? selectedPoint.latitude : 5.3599517, 
                                isValidCoordinate(selectedPoint.longitude) ? selectedPoint.longitude : -4.0082563]} 
                        zoom={15} 
                        onPointClick={setSelectedPoint}
                        singleMarker
                      />
                    </div>
                    <div className="mt-3 text-sm text-gray-600">
                      <div className="flex items-start gap-2">
                        <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <span>{selectedPoint.address}</span>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        <div>
                          <p className="text-xs text-gray-500">District</p>
                          <p className="text-sm">{selectedPoint.district}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Région</p>
                          <p className="text-sm">{selectedPoint.region}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Commune</p>
                          <p className="text-sm">{selectedPoint.commune}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
                    <h4 className="font-semibold text-gray-800 mb-4">Statistiques</h4>
                    <div className="space-y-4">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          ₣ {parseFloat(selectedPoint.turnover).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600">Chiffre d'affaires mensuel</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-emerald-600">{selectedPoint.monthly_orders}</div>
                        <div className="text-sm text-gray-600">Commandes ce mois</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-5">
                    <h4 className="font-semibold text-gray-800 mb-4">Évaluation</h4>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[1,2,3,4,5].map((star) => (
                          <Star 
                            key={star} 
                            size={20} 
                            className={`${star <= selectedPoint.evaluation_score ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                          />
                        ))}
                      </div>
                      <span className="text-lg font-semibold">{selectedPoint.evaluation_score}/5</span>
                    </div>
                    <div className="text-sm text-gray-600">Basé sur 24 avis clients</div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-4">Informations Complémentaires</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Date d'inscription</p>
                        <p className="font-medium">{selectedPoint.registration_date}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Statut</p>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyle(selectedPoint.status)}`}>
                          {getStatusIcon(selectedPoint.status)}
                          {statusOptions.find(s => s.value === selectedPoint.status)?.label || selectedPoint.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedPoint(null)}
                className={`px-4 py-2 rounded-lg ${colors.secondary}`}
              >
                Fermer
              </button>
              <button className={`px-4 py-2 rounded-lg ${colors.primary}`}>
                Modifier les informations
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PointsVenteManagement;