"use client";
import React, { useState, useEffect } from 'react';
import { 
  MapPin, Plus, Search, Filter, Edit, Trash2, Eye, 
  Phone, Mail, User, Calendar, TrendingUp, AlertCircle,
  CheckCircle, Clock, Star, MoreVertical, Download,
  Navigation, Building2, Users, ChevronLeft, X,
  Shield, ChevronDown, ChevronRight, Loader2, Image as ImageIcon,
  BarChart3, Map, Upload, Target, Award, Store
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Chargement dynamique de la carte avec désactivation du SSR
const MapWithNoSSR = dynamic(() => import('@/components/Map').then(mod => {
  return (props: any) => <mod.default {...props} showAvatars={props.showAvatars} />;
}), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-gray-200">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto">
          <Navigation size={24} className="text-white" />
        </div>
        <p className="text-blue-700 font-medium font-sans">Chargement de la carte...</p>
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
  avatar: string;
  brander: boolean;
  marque_brander: string | null;
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
    longitude: 0,
    registration_date: new Date().toISOString().split('T')[0],
    avatar: '',
    brander: false,
    marque_brander: ''
  });
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [editingPoint, setEditingPoint] = useState<PointOfSale | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Types de points de vente
  const pointTypes = [
    { value: 'boutique', label: 'Boutique', icon: Store },
    { value: 'supermarche', label: 'Supermarché', icon: Building2 },
    { value: 'superette', label: 'Supérette', icon: Store },
    { value: 'epicerie', label: 'Épicerie', icon: Store },
    { value: 'demi_grossiste', label: 'Demi-Grossiste', icon: Users },
    { value: 'grossiste', label: 'Grossiste', icon: Building2 }
  ];

  // Statuts
  const statusOptions = [
    { value: 'actif', label: 'Actif', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { value: 'suspendu', label: 'Suspendu', color: 'text-red-600 bg-red-50 border-red-200' },
    { value: 'en_attente', label: 'En attente', color: 'text-amber-600 bg-amber-50 border-amber-200' }
  ];

  // Couleurs modernes
  const colors = {
    primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200',
    secondary: 'bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-700 border border-gray-200 hover:border-gray-300 transition-all duration-200',
    danger: 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-lg hover:shadow-xl transition-all duration-200',
    success: 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-200',
    warning: 'bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg hover:shadow-xl transition-all duration-200'
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

  // Gestion du fichier avatar
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
      
      // Prévisualisation pour l'ajout
      if (showAddModal) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setNewPoint({
            ...newPoint,
            avatar: event.target?.result as string
          });
        };
        reader.readAsDataURL(e.target.files[0]);
      }
      
      // Prévisualisation pour l'édition
      if (editingPoint) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setEditingPoint({
            ...editingPoint,
            avatar: event.target?.result as string
          });
        };
        reader.readAsDataURL(e.target.files[0]);
      }
    }
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
          avatar: point.avatar || '/default-avatar.png',
          latitude: isValidCoordinate(point.latitude) ? point.latitude : 5.3197,
          longitude: isValidCoordinate(point.longitude) ? point.longitude : -4.0267,
          registration_date: point.registration_date || new Date().toISOString().split('T')[0],
          brander: point.brander || false,
          marque_brander: point.marque_brander || null
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

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPoints.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPoints.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Fonction pour télécharger les données
  const downloadData = () => {
    const headers = [
      'Nom', 'Propriétaire', 'Téléphone', 'Email', 'Adresse', 'Type', 'Statut',
      'District', 'Région', 'Commune', 'Date d\'inscription', 'Chiffre d\'affaires',
      'Commandes mensuelles', 'Score d\'évaluation', 'Est brandé', 'Marque du brander'
    ];

    const csvData = filteredPoints.map(point => [
      point.name, point.owner, point.phone, point.email, point.address,
      pointTypes.find(t => t.value === point.type)?.label || point.type,
      statusOptions.find(s => s.value === point.status)?.label || point.status,
      point.district, point.region, point.commune, point.registration_date,
      point.turnover, point.monthly_orders, point.evaluation_score,
      point.brander ? 'Oui' : 'Non', point.marque_brander || ''
    ]);

    let csvContent = headers.join(',') + '\n';
    csvData.forEach(row => {
      csvContent += row.map(field => `"${field}"`).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'points_de_vente.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Obtenir le style du statut
  const getStatusStyle = (status: string) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption?.color || 'bg-gray-100 text-gray-800 border-gray-200';
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
      
      const formData = new FormData();
      formData.append('name', newPoint.name);
      formData.append('owner', newPoint.owner);
      formData.append('phone', newPoint.phone);
      formData.append('email', newPoint.email);
      formData.append('address', newPoint.address);
      formData.append('type', newPoint.type);
      formData.append('district', newPoint.district);
      formData.append('region', newPoint.region);
      formData.append('commune', newPoint.commune);
      formData.append('latitude', newPoint.latitude.toString());
      formData.append('longitude', newPoint.longitude.toString());
      formData.append('registration_date', newPoint.registration_date);
      formData.append('brander', newPoint.brander.toString());
      if (newPoint.brander && newPoint.marque_brander) {
        formData.append('marque_brander', newPoint.marque_brander);
      }
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const response = await fetch(`${API_BASE_URL}/points-vente/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'ajout du point de vente');
      }

      const createdPoint = await response.json();
      setPointsVente([...pointsVente, {
        ...createdPoint,
        brander: createdPoint.brander || false,
        marque_brander: createdPoint.marque_brander || null
      }]);
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
        longitude: 0,
        registration_date: new Date().toISOString().split('T')[0],
        avatar: '',
        brander: false,
        marque_brander: ''
      });
      setAvatarFile(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour un point de vente
  const updatePoint = async () => {
    if (!editingPoint) return;
    
    const token = localStorage.getItem('access');
    if (!token) {
      setError('Veuillez vous connecter.');
      return;
    }

    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('name', editingPoint.name);
      formData.append('owner', editingPoint.owner);
      formData.append('phone', editingPoint.phone);
      formData.append('email', editingPoint.email);
      formData.append('address', editingPoint.address);
      formData.append('type', editingPoint.type);
      formData.append('status', editingPoint.status);
      formData.append('district', editingPoint.district);
      formData.append('region', editingPoint.region);
      formData.append('commune', editingPoint.commune);
      formData.append('latitude', editingPoint.latitude.toString());
      formData.append('longitude', editingPoint.longitude.toString());
      formData.append('registration_date', editingPoint.registration_date);
      formData.append('brander', editingPoint.brander.toString());
      if (editingPoint.brander && editingPoint.marque_brander) {
        formData.append('marque_brander', editingPoint.marque_brander);
      } else {
        formData.append('marque_brander', '');
      }
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const response = await fetch(`${API_BASE_URL}/points-vente/${editingPoint.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la mise à jour du point de vente');
      }

      const updatedPoint = await response.json();
      setPointsVente(pointsVente.map(point => 
        point.id === updatedPoint.id ? {
          ...updatedPoint,
          brander: updatedPoint.brander || false,
          marque_brander: updatedPoint.marque_brander || null
        } : point
      ));
      setEditingPoint(null);
      setAvatarFile(null);
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

  // Statistiques améliorées
  const stats = [
    {
      title: 'Total Points de Vente',
      value: pointsVente.length.toString(),
      icon: Building2,
      bg: 'bg-gradient-to-br from-indigo-600 to-blue-500',
      trend: '+12%',
      trendColor: 'text-emerald-300'
    },
    {
      title: 'Points Actifs',
      value: pointsVente.filter(p => p.status === 'actif').length.toString(),
      icon: CheckCircle,
      bg: 'bg-gradient-to-br from-emerald-600 to-teal-500',
      trend: '+8%',
      trendColor: 'text-emerald-300'
    },
    {
      title: 'En Attente',
      value: pointsVente.filter(p => p.status === 'en_attente').length.toString(),
      icon: Clock,
      bg: 'bg-gradient-to-br from-amber-500 to-yellow-400',
      trend: '-3%',
      trendColor: 'text-red-300'
    },
    {
      title: 'CA Moyen/Mois',
      value: `₣ ${(pointsVente.reduce((sum, point) => sum + parseFloat(point.turnover), 0) / (pointsVente.length || 1)).toFixed(2)}`,
      icon: TrendingUp,
      bg: 'bg-gradient-to-br from-rose-500 to-pink-500',
      trend: '+15%',
      trendColor: 'text-emerald-300'
    }
  ];

  // Vue Liste améliorée
  const ListView = () => (
    <div className="space-y-6">
      {/* En-tête avec titre et actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 font-sans">Gestion des Points de Vente</h1>
          <p className="text-gray-600 mt-1">Gérez l'ensemble de votre réseau commercial</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setActiveView('carte')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${colors.secondary} font-medium`}
          >
            <Map size={16} />
            <span>Vue Carte</span>
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${colors.primary} font-medium`}
          >
            <Plus size={16} />
            <span>Nouveau Point</span>
          </button>
          <button 
            onClick={downloadData}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${colors.success} font-medium`}
          >
            <Download size={16} />
            <span>Exporter</span>
          </button>
        </div>
      </div>

      {/* Statistiques améliorées */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className={`p-5 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-200`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-800 font-sans">{stat.value}</p>
                <p className={`text-xs font-medium ${stat.trendColor} flex items-center gap-1 mt-1`}>
                  <TrendingUp size={12} />
                  {stat.trend}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg} text-white`}>
                <stat.icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Barre de recherche et filtres améliorée */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Rechercher un point de vente..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
              />
            </div>
            
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
            >
              <option value="all">Tous les statuts</option>
              {statusOptions.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>

            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
            >
              <option value="all">Tous les types</option>
              {pointTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Filter size={16} />
            <span>{filteredPoints.length} résultats</span>
          </div>
        </div>
      </div>

      {/* Tableau des points de vente amélioré */}
      {loading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-xl border border-gray-200">
          <div className="text-center space-y-3">
            <Loader2 className="animate-spin text-blue-600 mx-auto" size={32} />
            <p className="text-gray-600 font-medium">Chargement des points de vente...</p>
          </div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-center">
          <AlertCircle className="inline-block mr-2" size={16} />
          {error}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider font-sans">Point de Vente</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider font-sans">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider font-sans">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider font-sans">Statut</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider font-sans">Localisation</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider font-sans">Branding</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider font-sans">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentItems.map((point) => (
                  <tr key={point.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                          {point.avatar && point.avatar !== '/default-avatar.png' ? (
                            <img 
                              src={point.avatar} 
                              alt={point.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <Store className="text-blue-600" size={20} />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 font-sans">{point.name}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin size={12} />
                            {point.commune}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{point.owner}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Phone size={12} />
                        {point.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {pointTypes.find(t => t.value === point.type)?.label || point.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusStyle(point.status)}`}>
                        {getStatusIcon(point.status)}
                        {statusOptions.find(s => s.value === point.status)?.label || point.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{point.district}</div>
                      <div className="text-xs text-gray-500">{point.region}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
                          point.brander 
                            ? 'bg-purple-50 text-purple-700 border-purple-200' 
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                        }`}>
                          <Award size={12} />
                          {point.brander ? 'Brandé' : 'Non brandé'}
                        </span>
                        {point.brander && point.marque_brander && (
                          <span className="text-xs text-gray-600 truncate max-w-[120px]" title={point.marque_brander}>
                            {point.marque_brander}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        <button 
                          onClick={() => setSelectedPoint(point)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                          title="Voir les détails"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => {
                            setEditingPoint(point);
                            setAvatarFile(null);
                          }}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors duration-200"
                          title="Modifier"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => deletePoint(point.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          title="Supprimer"
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

          {/* Pagination améliorée */}
          {filteredPoints.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50">
              <div className="text-sm text-gray-700 font-medium">
                Affichage de <span className="text-gray-900">{indexOfFirstItem + 1}</span> à{' '}
                <span className="text-gray-900">
                  {indexOfLastItem > filteredPoints.length ? filteredPoints.length : indexOfLastItem}
                </span>{' '}
                sur <span className="text-gray-900">{filteredPoints.length}</span> résultats
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 font-medium">Lignes par page:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg border transition-all duration-200 ${
                      currentPage === 1 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                    }`}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => paginate(pageNum)}
                        className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all duration-200 ${
                          currentPage === pageNum 
                            ? 'bg-blue-600 text-white border-blue-600' 
                            : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg border transition-all duration-200 ${
                      currentPage === totalPages 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                    }`}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {filteredPoints.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Store className="text-gray-400" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2 font-sans">Aucun point de vente trouvé</h3>
              <p className="text-gray-600 mb-4">Aucun point de vente ne correspond à vos critères de recherche.</p>
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setFilterType('all');
                }}
                className={`px-4 py-2 rounded-lg ${colors.primary} font-medium`}
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Vue Carte améliorée
  const MapView = () => (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 font-sans">Carte des Points de Vente</h1>
          <p className="text-gray-600 mt-1">Visualisez votre réseau commercial sur la carte</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={downloadData}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${colors.success} font-medium`}
          >
            <Download size={16} />
            <span>Exporter</span>
          </button>
          <button 
            onClick={() => setActiveView('liste')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${colors.secondary} font-medium`}
          >
            <ChevronLeft size={16} />
            <span>Retour à la liste</span>
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-[600px]">
        <MapWithNoSSR 
          points={filteredPoints} 
          center={[5.3599517, -4.0082563]}
          zoom={12} 
          onPointClick={setSelectedPoint}
          showAvatars={true}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      {activeView === 'liste' ? <ListView /> : <MapView />}

      {/* Modal d'ajout amélioré */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Plus size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white font-sans">Nouveau Point de Vente</h3>
                  <p className="text-white/80 text-sm">Ajoutez un nouveau point à votre réseau commercial</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors duration-200"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Upload d'image */}
              <div className="flex flex-col items-center">
                <div className="relative w-32 h-32 mb-4 rounded-2xl overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 group hover:border-blue-500 transition-colors duration-200">
                  {newPoint.avatar ? (
                    <img 
                      src={newPoint.avatar} 
                      alt="Avatar preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                      <ImageIcon size={32} />
                      <span className="text-xs mt-2">Ajouter une image</span>
                    </div>
                  )}
                  <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Upload size={20} className="text-white" />
                  </label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-gray-500 text-center">Format recommandé: JPG, PNG • Max 2MB</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Colonne gauche */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800 font-sans flex items-center gap-2">
                    <User size={16} />
                    Informations de base
                  </h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom du Point de Vente *
                    </label>
                    <input 
                      type="text"
                      value={newPoint.name}
                      onChange={(e) => setNewPoint({...newPoint, name: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                      placeholder="Ex: Supermarché Central"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Propriétaire *
                    </label>
                    <input 
                      type="text"
                      value={newPoint.owner}
                      onChange={(e) => setNewPoint({...newPoint, owner: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                      placeholder="Ex: Jean Kouadio"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Téléphone *
                      </label>
                      <input 
                        type="tel"
                        value={newPoint.phone}
                        onChange={(e) => setNewPoint({...newPoint, phone: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                        placeholder="+225 XX XX XX XX XX"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input 
                        type="email"
                        value={newPoint.email}
                        onChange={(e) => setNewPoint({...newPoint, email: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                        placeholder="email@exemple.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type *
                      </label>
                      <select 
                        value={newPoint.type}
                        onChange={(e) => setNewPoint({...newPoint, type: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                        required
                      >
                        {pointTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date d'inscription *
                      </label>
                      <input 
                        type="date"
                        value={newPoint.registration_date}
                        onChange={(e) => setNewPoint({...newPoint, registration_date: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Colonne droite */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800 font-sans flex items-center gap-2">
                    <MapPin size={16} />
                    Localisation
                  </h4>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        District *
                      </label>
                      <input 
                        type="text"
                        value={newPoint.district}
                        onChange={(e) => setNewPoint({...newPoint, district: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Région *
                      </label>
                      <input 
                        type="text"
                        value={newPoint.region}
                        onChange={(e) => setNewPoint({...newPoint, region: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Commune *
                      </label>
                      <input 
                        type="text"
                        value={newPoint.commune}
                        onChange={(e) => setNewPoint({...newPoint, commune: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                        required
                      />
                    </div>
                  </div>

                  {/* Section Branding */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-800 font-sans flex items-center gap-2 mb-3">
                      <Award size={16} />
                      Information Branding
                    </h4>
                    
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-500 transition-colors duration-200 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={newPoint.brander}
                          onChange={(e) => {
                            setNewPoint({
                              ...newPoint, 
                              brander: e.target.checked,
                              marque_brander: e.target.checked ? newPoint.marque_brander : ''
                            })
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <span className="font-medium text-gray-800">Point de vente brandé</span>
                          <p className="text-sm text-gray-600">Ce point de vente représente une marque spécifique</p>
                        </div>
                      </label>

                      {newPoint.brander && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Marque du brander *
                          </label>
                          <input 
                            type="text"
                            value={newPoint.marque_brander}
                            onChange={(e) => setNewPoint({...newPoint, marque_brander: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                            placeholder="Ex: Coca-Cola, Nestlé, etc."
                            required={newPoint.brander}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Coordonnées GPS */}
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <h4 className="font-semibold text-gray-800 font-sans flex items-center gap-2 mb-3">
                      <Target size={16} />
                      Coordonnées GPS
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-2 font-medium">Latitude</label>
                        <input 
                          type="number"
                          step="any"
                          value={newPoint.latitude || ''}
                          onChange={(e) => setNewPoint({...newPoint, latitude: parseFloat(e.target.value) || 0})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                          placeholder="Latitude"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-2 font-medium">Longitude</label>
                        <input 
                          type="number"
                          step="any"
                          value={newPoint.longitude || ''}
                          onChange={(e) => setNewPoint({...newPoint, longitude: parseFloat(e.target.value) || 0})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                          placeholder="Longitude"
                        />
                      </div>
                    </div>
                    
                    <button
                      onClick={getCurrentLocation}
                      disabled={isFetchingLocation}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                        isFetchingLocation ? 'bg-gray-300 cursor-not-allowed' : colors.primary
                      }`}
                    >
                      {isFetchingLocation ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          <span>Récupération...</span>
                        </>
                      ) : (
                        <>
                          <Navigation size={16} />
                          <span>Obtenir ma position actuelle</span>
                        </>
                      )}
                    </button>
                    {locationError && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle size={14} />
                        {locationError}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Adresse complète */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse Complète *
                </label>
                <textarea 
                  value={newPoint.address}
                  onChange={(e) => setNewPoint({...newPoint, address: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium resize-none"
                  placeholder="Adresse complète avec quartier, commune, ville..."
                  required
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
              <button 
                onClick={() => setShowAddModal(false)}
                className={`px-6 py-3 rounded-xl ${colors.secondary} font-medium transition-all duration-200`}
              >
                Annuler
              </button>
              <button 
                onClick={handleAddPoint}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  !newPoint.name || !newPoint.owner || !newPoint.phone || !newPoint.email || !newPoint.address || 
                  !newPoint.district || !newPoint.region || !newPoint.commune || !newPoint.registration_date || 
                  (newPoint.brander && !newPoint.marque_brander)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : colors.primary
                }`}
                disabled={!newPoint.name || !newPoint.owner || !newPoint.phone || !newPoint.email || !newPoint.address || 
                  !newPoint.district || !newPoint.region || !newPoint.commune || !newPoint.registration_date || 
                  (newPoint.brander && !newPoint.marque_brander)}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin" size={16} />
                    <span>Création...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Plus size={16} />
                    <span>Créer le point de vente</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'édition amélioré */}
      {editingPoint && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-600 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Edit size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white font-sans">Modifier le Point de Vente</h3>
                  <p className="text-white/80 text-sm">Mettez à jour les informations du point de vente</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingPoint(null)}
                className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors duration-200"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Upload d'image */}
              <div className="flex flex-col items-center">
                <div className="relative w-32 h-32 mb-4 rounded-2xl overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 group hover:border-blue-500 transition-colors duration-200">
                  {editingPoint.avatar ? (
                    <img 
                      src={editingPoint.avatar} 
                      alt="Avatar preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                      <ImageIcon size={32} />
                      <span className="text-xs mt-2">Modifier l'image</span>
                    </div>
                  )}
                  <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Upload size={20} className="text-white" />
                  </label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-gray-500 text-center">Cliquez sur l'image pour la modifier</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Colonne gauche */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800 font-sans flex items-center gap-2">
                    <User size={16} />
                    Informations de base
                  </h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom du Point de Vente *
                    </label>
                    <input 
                      type="text"
                      value={editingPoint.name}
                      onChange={(e) => setEditingPoint({...editingPoint, name: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Propriétaire *
                    </label>
                    <input 
                      type="text"
                      value={editingPoint.owner}
                      onChange={(e) => setEditingPoint({...editingPoint, owner: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Téléphone *
                      </label>
                      <input 
                        type="tel"
                        value={editingPoint.phone}
                        onChange={(e) => setEditingPoint({...editingPoint, phone: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input 
                        type="email"
                        value={editingPoint.email}
                        onChange={(e) => setEditingPoint({...editingPoint, email: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type *
                      </label>
                      <select 
                        value={editingPoint.type}
                        onChange={(e) => setEditingPoint({...editingPoint, type: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                        required
                      >
                        {pointTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Statut *
                      </label>
                      <select 
                        value={editingPoint.status}
                        onChange={(e) => setEditingPoint({...editingPoint, status: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                        required
                      >
                        {statusOptions.map(status => (
                          <option key={status.value} value={status.value}>{status.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Colonne droite */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800 font-sans flex items-center gap-2">
                    <MapPin size={16} />
                    Localisation
                  </h4>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        District *
                      </label>
                      <input 
                        type="text"
                        value={editingPoint.district}
                        onChange={(e) => setEditingPoint({...editingPoint, district: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Région *
                      </label>
                      <input 
                        type="text"
                        value={editingPoint.region}
                        onChange={(e) => setEditingPoint({...editingPoint, region: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Commune *
                      </label>
                      <input 
                        type="text"
                        value={editingPoint.commune}
                        onChange={(e) => setEditingPoint({...editingPoint, commune: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                        required
                      />
                    </div>
                  </div>

                  {/* Section Branding */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-800 font-sans flex items-center gap-2 mb-3">
                      <Award size={16} />
                      Information Branding
                    </h4>
                    
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-500 transition-colors duration-200 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={editingPoint.brander}
                          onChange={(e) => {
                            setEditingPoint({
                              ...editingPoint, 
                              brander: e.target.checked,
                              marque_brander: e.target.checked ? editingPoint.marque_brander : ''
                            })
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <span className="font-medium text-gray-800">Point de vente brandé</span>
                          <p className="text-sm text-gray-600">Ce point de vente représente une marque spécifique</p>
                        </div>
                      </label>

                      {editingPoint.brander && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Marque du brander *
                          </label>
                          <input 
                            type="text"
                            value={editingPoint.marque_brander || ''}
                            onChange={(e) => setEditingPoint({...editingPoint, marque_brander: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                            placeholder="Ex: Coca-Cola, Nestlé, etc."
                            required={editingPoint.brander}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Coordonnées GPS */}
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <h4 className="font-semibold text-gray-800 font-sans flex items-center gap-2 mb-3">
                      <Target size={16} />
                      Coordonnées GPS
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-2 font-medium">Latitude</label>
                        <input 
                          type="number"
                          step="any"
                          value={editingPoint.latitude || ''}
                          onChange={(e) => setEditingPoint({...editingPoint, latitude: parseFloat(e.target.value) || 0})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-2 font-medium">Longitude</label>
                        <input 
                          type="number"
                          step="any"
                          value={editingPoint.longitude || ''}
                          onChange={(e) => setEditingPoint({...editingPoint, longitude: parseFloat(e.target.value) || 0})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                        />
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        setEditingPoint({
                          ...editingPoint,
                          latitude: 5.3599517,
                          longitude: -4.0082563
                        });
                      }}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium mt-3 ${colors.primary}`}
                    >
                      <Navigation size={16} />
                      <span>Position par défaut (Abidjan)</span>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Adresse complète */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse Complète *
                </label>
                <textarea 
                  value={editingPoint.address}
                  onChange={(e) => setEditingPoint({...editingPoint, address: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium resize-none"
                  required
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
              <button 
                onClick={() => setEditingPoint(null)}
                className={`px-6 py-3 rounded-xl ${colors.secondary} font-medium transition-all duration-200`}
              >
                Annuler
              </button>
              <button 
                onClick={updatePoint}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  !editingPoint.name || !editingPoint.owner || !editingPoint.phone || !editingPoint.email || !editingPoint.address || 
                  !editingPoint.district || !editingPoint.region || !editingPoint.commune || !editingPoint.registration_date || 
                  (editingPoint.brander && !editingPoint.marque_brander)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl'
                }`}
                disabled={!editingPoint.name || !editingPoint.owner || !editingPoint.phone || !editingPoint.email || !editingPoint.address || 
                  !editingPoint.district || !editingPoint.region || !editingPoint.commune || !editingPoint.registration_date || 
                  (editingPoint.brander && !editingPoint.marque_brander)}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin" size={16} />
                    <span>Sauvegarde...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} />
                    <span>Sauvegarder les modifications</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de détails amélioré */}
      {selectedPoint && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-white bg-white">
                  <img 
                    src={selectedPoint.avatar || '/default-avatar.png'} 
                    alt={selectedPoint.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/default-avatar.png';
                    }}
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white font-sans">{selectedPoint.name}</h3>
                  <p className="text-white/80 flex items-center gap-1">
                    <MapPin size={14} />
                    {selectedPoint.commune}, {selectedPoint.district}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPoint(null)}
                className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors duration-200"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Colonne principale */}
                <div className="xl:col-span-2 space-y-6">
                  {/* Informations générales */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h4 className="font-semibold text-gray-800 font-sans text-lg mb-4">Informations Générales</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="p-3 bg-white rounded-lg shadow-sm">
                          <User size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">Propriétaire</p>
                          <p className="font-semibold text-gray-800">{selectedPoint.owner}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="p-3 bg-white rounded-lg shadow-sm">
                          <Phone size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">Téléphone</p>
                          <p className="font-semibold text-gray-800">{selectedPoint.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="p-3 bg-white rounded-lg shadow-sm">
                          <Mail size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">Email</p>
                          <p className="font-semibold text-gray-800">{selectedPoint.email}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="p-3 bg-white rounded-lg shadow-sm">
                          <Building2 size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">Type</p>
                          <p className="font-semibold text-gray-800">
                            {pointTypes.find(t => t.value === selectedPoint.type)?.label || selectedPoint.type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="p-3 bg-white rounded-lg shadow-sm">
                          <Calendar size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">Date d'inscription</p>
                          <p className="font-semibold text-gray-800">{selectedPoint.registration_date}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="p-3 bg-white rounded-lg shadow-sm">
                          <Award size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">Statut</p>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusStyle(selectedPoint.status)}`}>
                            {getStatusIcon(selectedPoint.status)}
                            {statusOptions.find(s => s.value === selectedPoint.status)?.label || selectedPoint.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Carte et localisation */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h4 className="font-semibold text-gray-800 font-sans text-lg mb-4">Localisation</h4>
                    <div className="h-64 rounded-xl overflow-hidden border border-gray-200 mb-4">
                      <MapWithNoSSR 
                        points={[selectedPoint]} 
                        center={[isValidCoordinate(selectedPoint.latitude) ? selectedPoint.latitude : 5.3599517, 
                                isValidCoordinate(selectedPoint.longitude) ? selectedPoint.longitude : -4.0082563]} 
                        zoom={15} 
                        onPointClick={setSelectedPoint}
                        singleMarker
                        showAvatars={true}
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <MapPin size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-800">Adresse complète</p>
                          <p className="text-gray-600">{selectedPoint.address}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-600 font-medium">District</p>
                          <p className="font-semibold text-gray-800">{selectedPoint.district}</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-600 font-medium">Région</p>
                          <p className="font-semibold text-gray-800">{selectedPoint.region}</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-600 font-medium">Commune</p>
                          <p className="font-semibold text-gray-800">{selectedPoint.commune}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Colonne latérale */}
                <div className="space-y-6">
                  {/* Statistiques */}
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
                    <h4 className="font-semibold text-lg mb-4 font-sans">Performance</h4>
                    <div className="space-y-4">
                      <div className="text-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                        <div className="text-2xl font-bold font-sans">₣ {parseFloat(selectedPoint.turnover).toFixed(2)}</div>
                        <div className="text-sm text-white/80">Chiffre d'affaires mensuel</div>
                      </div>
                      <div className="text-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                        <div className="text-2xl font-bold font-sans">{selectedPoint.monthly_orders}</div>
                        <div className="text-sm text-white/80">Commandes ce mois</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Information Branding */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h4 className="font-semibold text-gray-800 font-sans text-lg mb-4 flex items-center gap-2">
                      <Award size={18} />
                      Information Branding
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-700">Est brandé</span>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
                          selectedPoint.brander 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                        }`}>
                          {selectedPoint.brander ? 'Oui' : 'Non'}
                        </span>
                      </div>
                      {selectedPoint.brander && selectedPoint.marque_brander && (
                        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <p className="text-sm text-gray-600 font-medium">Marque du brander</p>
                          <p className="font-semibold text-purple-700">{selectedPoint.marque_brander}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Évaluation */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h4 className="font-semibold text-gray-800 font-sans text-lg mb-4">Évaluation</h4>
                    <div className="text-center">
                      <div className="flex justify-center mb-2">
                        {[1,2,3,4,5].map((star) => (
                          <Star 
                            key={star} 
                            size={24} 
                            className={`${star <= selectedPoint.evaluation_score ? 'text-yellow-400 fill-current' : 'text-gray-300'} mx-0.5`} 
                          />
                        ))}
                      </div>
                      <div className="text-3xl font-bold text-gray-800 font-sans mb-1">{selectedPoint.evaluation_score}/5</div>
                      <div className="text-sm text-gray-600">Basé sur 24 avis clients</div>
                    </div>
                  </div>
                  
                  {/* Actions rapides */}
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <h4 className="font-semibold text-gray-800 font-sans text-lg mb-4">Actions</h4>
                    <div className="space-y-2">
                      <button 
                        onClick={() => {
                          setEditingPoint(selectedPoint);
                          setSelectedPoint(null);
                        }}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium ${colors.primary}`}
                      >
                        <Edit size={16} />
                        <span>Modifier les informations</span>
                      </button>
                      <button 
                        onClick={() => deletePoint(selectedPoint.id)}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium ${colors.danger}`}
                      >
                        <Trash2 size={16} />
                        <span>Supprimer le point</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PointsVenteManagement;