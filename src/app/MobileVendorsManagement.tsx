"use client";
import React, { useState, useEffect } from 'react';
import { 
  Bike, Plus, AlertTriangle, UserRound, ChevronDown, 
  Search, MoreVertical, Star, MapPin, Phone, Mail, Clock,
  ChevronLeft, ChevronRight, Frown, Smile, Meh, Check, X,
  Edit, Trash2, Save, Coins, Image as ImageIcon, Calendar, Clock as ClockIcon
} from 'lucide-react';
import { apiService } from './apiService';
import { useAuth } from './AuthContext';

const MobileVendorsManagement = ({ selectedPOS }) => {
  // States
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showVendorDetails, setShowVendorDetails] = useState(false);
  const [stats, setStats] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newVendor, setNewVendor] = useState(getDefaultVendorForm(selectedPOS));
  const [activeTab, setActiveTab] = useState('activities');
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [pointsOfSale, setPointsOfSale] = useState([]);
  const [loadingPOS, setLoadingPOS] = useState(false);
  const { user } = useAuth();

  // Helper functions
  function getDefaultVendorForm(pos) {
    return {
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      status: 'actif',
      vehicle_type: 'moto',
      vehicle_id: '',
      zones: [],
      point_of_sale: pos?.id || '',
      photo: null,
      is_approved: false,
      notes: '',
      average_daily_sales: 0,
      performance: 0
    };
  }

  const getPerformanceColor = (performance) => {
    if (performance >= 70) return 'text-green-600';
    if (performance >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'actif': return <Smile className="text-green-500" size={16} />;
      case 'inactif': return <Frown className="text-red-500" size={16} />;
      default: return <Meh className="text-yellow-500" size={16} />;
    }
  };

  const filteredVendors = vendors
    .filter(vendor =>
      `${vendor.first_name} ${vendor.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.phone.includes(searchTerm) ||
      vendor.zones.some(zone => zone.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => b.performance - a.performance);

  // Handlers
  const handlePhotoUpload = (e, isEditMode = false) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
        if (isEditMode) {
          setEditForm(prev => ({...prev, photo: file}));
        } else {
          setNewVendor(prev => ({...prev, photo: file}));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e, isEditMode = false) => {
    const { name, value } = e.target;
    if (isEditMode) {
      setEditForm(prev => ({ ...prev, [name]: value }));
    } else {
      setNewVendor(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleZoneChange = (e, isEditMode = false) => {
    const { value } = e.target;
    const zones = value.split(',').map(z => z.trim());
    if (isEditMode) {
      setEditForm(prev => ({ ...prev, zones }));
    } else {
      setNewVendor(prev => ({ ...prev, zones }));
    }
  };

  const viewVendorDetails = async (vendor) => {
    try {
      const response = await apiService.get(`/mobile-vendors/${vendor.id}/`);
      if (!response.ok) throw new Error('Failed to fetch vendor details');
      const data = await response.json();
      
      setSelectedVendor(data);
      setEditForm({
        ...data,
        zones: data.zones.join(', '),
        point_of_sale: data.point_of_sale?.id || ''
      });
      setPhotoPreview(data.photo ? data.photo_url : null);
      setShowVendorDetails(true);
      setActiveTab('activities');
    } catch (err) {
      setError(err.message);
    }
  };

  const createVendor = async () => {
    try {
      const formData = new FormData();
      
      // Append all fields
      Object.entries(newVendor).forEach(([key, value]) => {
        if (key === 'zones') {
          formData.append(key, JSON.stringify(value));
        } else if (key === 'photo' && value) {
          formData.append(key, value);
        } else if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });

      const response = await apiService.post('/mobile-vendors/', formData, true);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create vendor');
      }
      
      const createdVendor = await response.json();
      setVendors([...vendors, createdVendor]);
      setShowCreateForm(false);
      setNewVendor(getDefaultVendorForm(selectedPOS));
      setPhotoPreview(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const updateVendor = async () => {
    try {
      const formData = new FormData();
      Object.entries(editForm).forEach(([key, value]) => {
        if (key === 'zones') {
          formData.append(key, JSON.stringify(value.split(',').map(z => z.trim())));
        } else if (key === 'photo' && typeof value !== 'string') {
          formData.append(key, value);
        } else if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });

      const response = await apiService.patch(
        `/mobile-vendors/${selectedVendor.id}/`, 
        formData, 
        true
      );
      
      if (!response.ok) throw new Error('Failed to update vendor');
      
      const updatedVendor = await response.json();
      setVendors(vendors.map(v => v.id === updatedVendor.id ? updatedVendor : v));
      setSelectedVendor(updatedVendor);
      setIsEditing(false);
      setPhotoPreview(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteVendor = async (vendorId) => {
    try {
      if (!confirm('Are you sure you want to delete this vendor?')) return;
      
      const response = await apiService.delete(`/mobile-vendors/${vendorId}/`);
      
      if (!response.ok) throw new Error('Failed to delete vendor');
      
      setVendors(vendors.filter(v => v.id !== vendorId));
      if (selectedVendor?.id === vendorId) {
        setShowVendorDetails(false);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Effects
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true);
        let url = '/mobile-vendors/';
        if (selectedPOS?.id) {
          url = `/mobile-vendors/?point_of_sale=${selectedPOS.id}`;
        }
        
        const response = await apiService.get(url);
        if (!response.ok) throw new Error('Failed to fetch vendors');
        const data = await response.json();
        setVendors(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, [selectedPOS]);

  useEffect(() => {
    const fetchPointsOfSale = async () => {
      try {
        setLoadingPOS(true);
        const response = await apiService.get('/points-vente/');
        if (response.ok) {
          setPointsOfSale(await response.json());
        }
      } catch (err) {
        console.error('Error fetching POS:', err);
      } finally {
        setLoadingPOS(false);
      }
    };

    fetchPointsOfSale();
  }, []);

  useEffect(() => {
    if (selectedVendor?.id) {
      const fetchStats = async () => {
        const response = await apiService.get(`/mobile-vendors/${selectedVendor.id}/stats/`);
        if (response.ok) {
          setStats(await response.json());
        }
      };
      fetchStats();
    }
  }, [selectedVendor]);

  useEffect(() => {
    if (showVendorDetails && selectedVendor?.id) {
      const fetchActivities = async () => {
        setLoadingActivities(true);
        try {
          const response = await apiService.get(`/vendor-activities/?vendor=${selectedVendor.id}`);
          if (response.ok) {
            setActivities(await response.json());
          }
        } finally {
          setLoadingActivities(false);
        }
      };
      fetchActivities();
    }
  }, [selectedVendor?.id, showVendorDetails]);

  // Render functions
  const renderLoading = () => (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  const renderError = () => (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-red-500" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-red-700">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );

  const renderVendorForm = (isEditMode = false) => {
    const formData = isEditMode ? editForm : newVendor;
    const handleChange = (e) => handleInputChange(e, isEditMode);
    const handleZone = (e) => handleZoneChange(e, isEditMode);
    const photoHandler = (e) => handlePhotoUpload(e, isEditMode);

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Photo</label>
          <div className="mt-1 flex items-center">
            <div className="inline-block h-16 w-16 rounded-full overflow-hidden bg-gray-100">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-full w-full text-gray-300" />
              )}
            </div>
            <label className="ml-5 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer">
              <input type="file" className="sr-only" onChange={photoHandler} accept="image/*" />
              Changer
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Prénom *</label>
          <input
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Nom *</label>
          <input
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Téléphone *</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Statut *</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
            <option value="en_conge">En congé</option>
            <option value="suspendu">Suspendu</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Type de véhicule *</label>
          <select
            name="vehicle_type"
            value={formData.vehicle_type}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="moto">Moto</option>
            <option value="tricycle">Tricycle</option>
            <option value="velo">Vélo</option>
            <option value="pied">À pied</option>
            <option value="autre">Autre</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Numéro de véhicule</label>
          <input
            type="text"
            name="vehicle_id"
            value={formData.vehicle_id}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Zones (séparées par des virgules) *</label>
          <input
            type="text"
            name="zones"
            value={formData.zones}
            onChange={handleZone}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Cocody, Plateau, Abobo"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Point de Vente *</label>
          <select
            name="point_of_sale"
            value={formData.point_of_sale}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
            disabled={loadingPOS}
          >
            <option value="">-- Sélectionnez --</option>
            {pointsOfSale.map((pos) => (
              <option key={pos.id} value={pos.id}>
                {pos.name} ({pos.commune})
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Performance (%)</label>
          <input
            type="number"
            name="performance"
            value={formData.performance}
            onChange={handleChange}
            min="0"
            max="100"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Ventes moyennes/jour (XOF)</label>
          <input
            type="number"
            name="average_daily_sales"
            value={formData.average_daily_sales}
            onChange={handleChange}
            min="0"
            step="0.01"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            name="is_approved"
            checked={formData.is_approved}
            onChange={(e) => isEditMode 
              ? setEditForm({...editForm, is_approved: e.target.checked})
              : setNewVendor({...newVendor, is_approved: e.target.checked})
            }
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-700">Approuvé</label>
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    );
  };

  const renderStatsCards = (isDetailView = false) => {
    if (isDetailView && stats) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ventes Mensuelles</p>
                <p className="text-3xl font-bold mt-1">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(stats.total_sales)}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Coins className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Jours Actifs</p>
                <p className="text-3xl font-bold mt-1">{stats.active_days}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Check className="text-green-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Performance</p>
                <p className={`text-3xl font-bold mt-1 ${getPerformanceColor(stats.current_performance)}`}>
                  {stats.current_performance}%
                </p>
                <p className="text-sm text-gray-500">
                  {stats.last_month_performance && `Mois précédent: ${stats.last_month_performance}%`}
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <Star className="text-amber-600" size={24} />
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Vendeurs</p>
              <p className="text-3xl font-bold mt-1">{vendors.length}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <UserRound className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vendeurs Actifs</p>
              <p className="text-3xl font-bold mt-1">
                {vendors.filter(v => v.status === 'actif').length}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Check className="text-green-600" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Performance Moyenne</p>
              <p className="text-3xl font-bold mt-1">
                {vendors.length > 0 
                  ? Math.round(vendors.reduce((acc, v) => acc + (v.performance || 0), 0) / vendors.length) 
                  : 0}%
              </p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg">
              <Star className="text-amber-600" size={24} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderVendorDetails = () => {
    if (!selectedVendor) return null;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center">
              <button 
                onClick={() => {
                  setShowVendorDetails(false);
                  setIsEditing(false);
                  setPhotoPreview(null);
                }}
                className="mr-4 text-gray-400 hover:text-gray-600"
              >
                <ChevronLeft size={20} />
              </button>

              {isEditing ? (
                <h2 className="text-xl font-bold text-gray-800">Modifier le vendeur</h2>
              ) : (
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{selectedVendor.first_name} {selectedVendor.last_name}</h2>
                  <p className="text-gray-600">
                    Vendeur ambulant • {selectedVendor.point_of_sale?.name} • {selectedVendor.vehicle_type}
                  </p>
                </div>
              )}
            </div>
          </div>

          {!isEditing && (
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-blue-600 hover:text-blue-900"
                title="Modifier"
              >
                <Edit size={18} />
              </button>
              <button
                onClick={() => deleteVendor(selectedVendor.id)}
                className="p-2 text-red-600 hover:text-red-900"
                title="Supprimer"
              >
                <Trash2 size={18} />
              </button>
            </div>
          )}
        </div>
        
        {isEditing ? (
          <div className="space-y-4">
            {renderVendorForm(true)}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setPhotoPreview(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Annuler
              </button>
              <button
                onClick={updateVendor}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Save size={18} className="inline mr-2" />
                Enregistrer
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center space-x-2 mb-6">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                selectedVendor.status === 'actif' ? 'bg-green-100 text-green-800' : 
                selectedVendor.status === 'inactif' ? 'bg-gray-100 text-gray-800' : 
                'bg-yellow-100 text-yellow-800'
              }`}>
                {selectedVendor.status}
              </span>
              {selectedVendor.is_approved && (
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  Approuvé
                </span>
              )}
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPerformanceColor(selectedVendor.performance)}`}>
                Performance: {selectedVendor.performance}%
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-3">Informations Personnelles</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Phone className="text-gray-400 mr-2" size={16} />
                    <span className="text-sm">{selectedVendor.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="text-gray-400 mr-2" size={16} />
                    <span className="text-sm">{selectedVendor.email || 'Non spécifié'}</span>
                  </div>
                  <div className="flex items-center">
                    <Bike className="text-gray-400 mr-2" size={16} />
                    <span className="text-sm capitalize">{selectedVendor.vehicle_type}</span>
                    {selectedVendor.vehicle_id && (
                      <span className="text-sm ml-2">({selectedVendor.vehicle_id})</span>
                    )}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="text-gray-400 mr-2" size={16} />
                    <span className="text-sm">
                      Membre depuis {new Date(selectedVendor.date_joined).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-3">Zone d'Activité</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedVendor.zones.map((zone, i) => (
                    <span key={i} className="px-2 py-1 text-xs bg-gray-100 rounded-full flex items-center">
                      <MapPin className="mr-1" size={12} />
                      {zone}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-3">Statistiques</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Ventes moyennes/jour:</span>
                    <span className="text-sm font-medium">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(selectedVendor.average_daily_sales)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Dernière activité:</span>
                    <span className="text-sm font-medium">
                      {selectedVendor.last_activity ? 
                        new Date(selectedVendor.last_activity).toLocaleString('fr-FR') : 
                        'Inconnue'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Point de vente:</span>
                    <span className="text-sm font-medium">{selectedVendor.point_of_sale?.name}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('activities')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'activities'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Activités Récentes
                </button>
                <button
                  onClick={() => setActiveTab('performance')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'performance'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Performance
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'notes'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Notes
                </button>
              </nav>
            </div>
            
            {activeTab === 'activities' && (
              <div className="space-y-4">
                {loadingActivities ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : activities.length > 0 ? (
                  activities.map((activity) => (
                    <div key={activity.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800">{activity.activity_type}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(activity.timestamp).toLocaleString('fr-FR')}
                          </p>
                        </div>
                        {activity.location && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <MapPin size={12} className="mr-1" />
                            Localisé
                          </span>
                        )}
                      </div>
                      {activity.notes && (
                        <p className="mt-2 text-sm text-gray-700">{activity.notes}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Aucune activité récente</p>
                )}
              </div>
            )}
            
            {activeTab === 'performance' && stats && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-3">Performance ce mois</h4>
                    <div className="h-64">
                      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
                        <p className="text-gray-500">Graphique de performance</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-3">Détails</h4>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600">Ventes totales</p>
                        <p className="text-xl font-bold">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(stats.total_sales)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Jours actifs</p>
                        <p className="text-xl font-bold">{stats.active_days}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Bonus estimé</p>
                        <p className="text-xl font-bold text-green-600">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(stats.total_sales * 0.05)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'notes' && (
              <div className="space-y-4">
                {selectedVendor.notes ? (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-800 whitespace-pre-line">{selectedVendor.notes}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Aucune note pour ce vendeur</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderVendorList = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendeur</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zones</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredVendors.length > 0 ? (
              filteredVendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden bg-gray-100">
                        {vendor.photo ? (
                          <img src={vendor.photo_url} alt={vendor.full_name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-600">
                            {vendor.first_name.charAt(0)}{vendor.last_name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{vendor.first_name} {vendor.last_name}</div>
                        <div className="text-sm text-gray-500 capitalize">{vendor.vehicle_type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{vendor.phone}</div>
                    <div className="text-sm text-gray-500">{vendor.email || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {vendor.zones.slice(0, 2).map((zone, i) => (
                        <span key={i} className="px-2 py-1 text-xs bg-gray-100 rounded-full">
                          {zone}
                        </span>
                      ))}
                      {vendor.zones.length > 2 && (
                        <span className="px-2 py-1 text-xs bg-gray-100 rounded-full">+{vendor.zones.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(vendor.status)}
                      <span className="ml-2 capitalize">{vendor.status}</span>
                      {vendor.is_approved && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">Approuvé</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${getPerformanceColor(vendor.performance)}`} 
                          style={{ width: `${vendor.performance}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm font-medium">{vendor.performance}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => viewVendorDetails(vendor)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Détails
                    </button>
                    <button className="text-gray-600 hover:text-gray-900">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                  {searchTerm ? 'Aucun vendeur trouvé' : 'Aucun vendeur enregistré'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {filteredVendors.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Affichage <span className="font-medium">1</span> à <span className="font-medium">{filteredVendors.length}</span> sur{' '}
            <span className="font-medium">{vendors.length}</span> résultats
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              <ChevronLeft size={16} />
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Main render
  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestion des Vendeurs Ambulants</h1>
          <p className="text-gray-600">
            {selectedPOS?.name || "Tous les vendeurs ambulants"}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher vendeurs..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            onClick={() => {
              setShowCreateForm(true);
              setShowVendorDetails(false);
              setNewVendor(getDefaultVendorForm(selectedPOS));
            }}
          >
            <Plus size={18} className="mr-2" />
            Nouveau Vendeur
          </button>
        </div>
      </div>

      {error && renderError()}

      {/* Stats Cards */}
      {renderStatsCards(showVendorDetails)}

      {/* Create Vendor Form */}
      {showCreateForm && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-bold mb-4">Ajouter un nouveau vendeur</h2>
          {renderVendorForm()}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowCreateForm(false);
                setPhotoPreview(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Annuler
            </button>
            <button
              onClick={createVendor}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Enregistrer
            </button>
          </div>
        </div>
      )}

      {/* Vendor List or Details */}
      {loading ? renderLoading() : (
        showVendorDetails ? renderVendorDetails() : renderVendorList()
      )}
    </div>
  );
};

export default MobileVendorsManagement;