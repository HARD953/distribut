"use client";
import React, { useState, useEffect } from 'react';
import { 
  MapPin, Plus, Search, Filter, Edit, Trash2, Eye, 
  Phone, Mail, User, Calendar, TrendingUp, AlertCircle,
  CheckCircle, Clock, Star, MoreVertical, Download,
  Navigation, Building2, Users, ChevronLeft, X,
  Shield, ChevronDown, ChevronRight, Loader, Image as ImageIcon
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Chargement dynamique de la carte avec désactivation du SSR
const MapWithNoSSR = dynamic(() => import('@/components/Map').then(mod => {
  return (props: any) => <mod.default {...props} showAvatars={props.showAvatars} />;
}), {
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
  avatar: string;
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
    avatar: ''
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
          registration_date: point.registration_date || new Date().toISOString().split('T')[0]
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
    // Créer un CSV des données
    const headers = [
      'Nom',
      'Propriétaire',
      'Téléphone',
      'Email',
      'Adresse',
      'Type',
      'Statut',
      'District',
      'Région',
      'Commune',
      'Date d\'inscription',
      'Chiffre d\'affaires',
      'Commandes mensuelles',
      'Score d\'évaluation'
    ];

    const csvData = filteredPoints.map(point => [
      point.name,
      point.owner,
      point.phone,
      point.email,
      point.address,
      pointTypes.find(t => t.value === point.type)?.label || point.type,
      statusOptions.find(s => s.value === point.status)?.label || point.status,
      point.district,
      point.region,
      point.commune,
      point.registration_date,
      point.turnover,
      point.monthly_orders,
      point.evaluation_score
    ]);

    // Créer le contenu CSV
    let csvContent = headers.join(',') + '\n';
    csvData.forEach(row => {
      csvContent += row.map(field => `"${field}"`).join(',') + '\n';
    });

    // Créer un blob et un lien de téléchargement
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
      
      // Création du FormData pour gérer le fichier
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
        longitude: 0,
        registration_date: new Date().toISOString().split('T')[0],
        avatar: ''
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
      
      // Création du FormData pour gérer le fichier
      const formData = new FormData();
      formData.append('name', editingPoint.name);
      formData.append('owner', editingPoint.owner);
      formData.append('phone', editingPoint.phone);
      formData.append('email', editingPoint.email);
      formData.append('address', editingPoint.address);
      formData.append('type', editingPoint.type);
      formData.append('district', editingPoint.district);
      formData.append('region', editingPoint.region);
      formData.append('commune', editingPoint.commune);
      formData.append('latitude', editingPoint.latitude.toString());
      formData.append('longitude', editingPoint.longitude.toString());
      formData.append('registration_date', editingPoint.registration_date);
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
        throw new Error('Erreur lors de la mise à jour du point de vente');
      }

      const updatedPoint = await response.json();
      setPointsVente(pointsVente.map(point => 
        point.id === updatedPoint.id ? updatedPoint : point
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
            <button 
              onClick={downloadData}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${colors.success}`}
            >
              <Download size={16} />
              <span>Exporter</span>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Image</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Point de Vente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Propriétaire</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Localisation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentItems.map((point) => (
                  <tr key={point.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="w-10 h-10 rounded-lg overflow-hidden">
                        <img 
                          src={point.avatar || '/default-avatar.png'} 
                          alt={point.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/default-avatar.png';
                          }}
                        />
                      </div>
                    </td>
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
                        <button 
                          onClick={() => {
                            setEditingPoint(point);
                            setAvatarFile(null);
                          }}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                        >
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

          {/* Pagination */}
          {filteredPoints.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700">
                Affichage de <span className="font-medium">{indexOfFirstItem + 1}</span> à{' '}
                <span className="font-medium">
                  {indexOfLastItem > filteredPoints.length ? filteredPoints.length : indexOfLastItem}
                </span>{' '}
                sur <span className="font-medium">{filteredPoints.length}</span> résultats
              </div>
              
              <div className="flex items-center gap-2">
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                >
                  <option value="5">5 par page</option>
                  <option value="10">10 par page</option>
                  <option value="25">25 par page</option>
                  <option value="50">50 par page</option>
                </select>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-md border ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => paginate(page)}
                      className={`px-3 py-1 rounded-md border ${
                        currentPage === page 
                          ? 'bg-blue-600 text-white border-blue-600' 
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-md border ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Vue Carte
  const MapView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Carte des Points de Vente</h3>
        <div className="flex gap-2">
          <button 
            onClick={downloadData}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${colors.success}`}
          >
            <Download size={16} />
            <span>Exporter</span>
          </button>
          <button 
            onClick={() => setActiveView('liste')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${colors.secondary}`}
          >
            <ChevronLeft size={16} />
            <span>Retour à la liste</span>
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-[600px]">
        <MapWithNoSSR 
          points={filteredPoints} 
          center={[5.3599517, -4.0082563]} // Coordonnées centrales d'Abidjan
          zoom={12} 
          onPointClick={setSelectedPoint}
          showAvatars={true}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Gestion des Points de Vente</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={downloadData}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            title="Télécharger les données"
          >
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
              <div className="flex flex-col items-center mb-4">
                <div className="relative w-24 h-24 mb-3 rounded-full overflow-hidden border-2 border-gray-300">
                  {newPoint.avatar ? (
                    <img 
                      src={newPoint.avatar} 
                      alt="Avatar preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <ImageIcon size={32} className="text-gray-400" />
                    </div>
                  )}
                </div>
                <label className="cursor-pointer">
                  <span className={`px-4 py-2 rounded-lg ${colors.secondary}`}>
                    Choisir une image
                  </span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>

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
                    Date d'inscription *
                  </label>
                  <input 
                    type="date"
                    value={newPoint.registration_date}
                    onChange={(e) => setNewPoint({...newPoint, registration_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
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
                disabled={!newPoint.name || !newPoint.owner || !newPoint.phone || !newPoint.email || !newPoint.address || !newPoint.district || !newPoint.region || !newPoint.commune || !newPoint.registration_date}
              >
                {loading ? <Loader className="animate-spin" size={16} /> : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'édition */}
      {editingPoint && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-600 rounded-t-xl">
              <h3 className="text-xl font-semibold text-white">Modifier le Point de Vente</h3>
              <button 
                onClick={() => setEditingPoint(null)}
                className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex flex-col items-center mb-4">
                <div className="relative w-24 h-24 mb-3 rounded-full overflow-hidden border-2 border-gray-300">
                  {editingPoint.avatar ? (
                    <img 
                      src={editingPoint.avatar} 
                      alt="Avatar preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <ImageIcon size={32} className="text-gray-400" />
                    </div>
                  )}
                </div>
                <label className="cursor-pointer">
                  <span className={`px-4 py-2 rounded-lg ${colors.secondary}`}>
                    Changer l'image
                  </span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du Point de Vente *
                  </label>
                  <input 
                    type="text"
                    value={editingPoint.name}
                    onChange={(e) => setEditingPoint({...editingPoint, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Propriétaire *
                  </label>
                  <input 
                    type="text"
                    value={editingPoint.owner}
                    onChange={(e) => setEditingPoint({...editingPoint, owner: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone *
                  </label>
                  <input 
                    type="tel"
                    value={editingPoint.phone}
                    onChange={(e) => setEditingPoint({...editingPoint, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input 
                    type="email"
                    value={editingPoint.email}
                    onChange={(e) => setEditingPoint({...editingPoint, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select 
                    value={editingPoint.type}
                    onChange={(e) => setEditingPoint({...editingPoint, type: e.target.value})}
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
                    Date d'inscription *
                  </label>
                  <input 
                    type="date"
                    value={editingPoint.registration_date}
                    onChange={(e) => setEditingPoint({...editingPoint, registration_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut *
                  </label>
                  <select 
                    value={editingPoint.status}
                    onChange={(e) => setEditingPoint({...editingPoint, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {statusOptions.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    District *
                  </label>
                  <input 
                    type="text"
                    value={editingPoint.district}
                    onChange={(e) => setEditingPoint({...editingPoint, district: e.target.value})}
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
                    value={editingPoint.region}
                    onChange={(e) => setEditingPoint({...editingPoint, region: e.target.value})}
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
                    value={editingPoint.commune}
                    onChange={(e) => setEditingPoint({...editingPoint, commune: e.target.value})}
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
                        value={editingPoint.latitude || ''}
                        onChange={(e) => setEditingPoint({...editingPoint, latitude: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">Longitude</label>
                      <input 
                        type="number"
                        value={editingPoint.longitude || ''}
                        onChange={(e) => setEditingPoint({...editingPoint, longitude: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={() => {
                        setEditingPoint({
                          ...editingPoint,
                          latitude: 5.3599517,
                          longitude: -4.0082563
                        });
                      }}
                      className={`px-4 py-2 rounded-lg ${colors.primary}`}
                    >
                      <span>Position par défaut</span>
                    </button>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse Complète *
                </label>
                <textarea 
                  value={editingPoint.address}
                  onChange={(e) => setEditingPoint({...editingPoint, address: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button 
                onClick={() => setEditingPoint(null)}
                className={`px-4 py-2 rounded-lg ${colors.secondary}`}
              >
                Annuler
              </button>
              <button 
                onClick={updatePoint}
                className={`px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white`}
                disabled={!editingPoint.name || !editingPoint.owner || !editingPoint.phone || !editingPoint.email || !editingPoint.address || !editingPoint.district || !editingPoint.region || !editingPoint.commune || !editingPoint.registration_date}
              >
                {loading ? <Loader className="animate-spin" size={16} /> : 'Enregistrer'}
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
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white">
                  <img 
                    src={selectedPoint.avatar || '/default-avatar.png'} 
                    alt={selectedPoint.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/default-avatar.png';
                    }}
                  />
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
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <Calendar size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Date d'inscription</p>
                          <p className="font-medium">{selectedPoint.registration_date}</p>
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
                        showAvatars={true}
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
              <button 
                onClick={() => {
                  setEditingPoint(selectedPoint);
                  setSelectedPoint(null);
                }}
                className={`px-4 py-2 rounded-lg ${colors.primary}`}
              >
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