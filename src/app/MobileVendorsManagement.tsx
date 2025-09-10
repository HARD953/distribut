"use client";
import React, { useState, useEffect } from 'react';
import { 
  Bike, Plus, AlertTriangle, UserRound, ChevronDown, 
  Search, MoreVertical, Star, MapPin, Phone, Mail, Clock,
  ChevronLeft, ChevronRight, Frown, Smile, Meh, Check,
  Edit, Trash2, Save, Coins, Image as ImageIcon, Calendar,
  BarChart3, TrendingUp, TrendingDown, Filter, Key, User
} from 'lucide-react';
import { apiService } from './ApiService';
import { useAuth } from './AuthContext';
import { POSData } from './AdminDashboard';

interface Vendor {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  status: 'actif' | 'inactif' | 'en_conge' | 'suspendu';
  vehicle_type: 'moto' | 'tricycle' | 'velo' | 'pied' | 'autre';
  vehicle_id?: string;
  zones: string[];
  photo?: string;
  photo_url?: string;
  is_approved: boolean;
  notes?: string;
  average_daily_sales: number;
  performance: number;
  date_joined: string;
  last_activity?: string;
  point_of_sale?: number;
  point_of_sale_name?: string;
}

interface FormVendor {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  status: 'actif' | 'inactif' | 'en_conge' | 'suspendu';
  vehicle_type: 'moto' | 'tricycle' | 'velo' | 'pied' | 'autre';
  vehicle_id: string;
  zones: string;
  point_of_sale: string;
  photo: File | string | undefined;
  is_approved: boolean;
  notes: string;
  average_daily_sales: number;
  performance: number;
  username: string;
  password: string;
}

interface Stats {
  total_sales: number;
  active_days: number;
  current_performance: number;
  last_month_performance?: number;
}

interface Activity {
  id: number;
  activity_type: string;
  timestamp: string;
  notes?: string;
  location?: string;
}

interface PointOfSale {
  id: number;
  name: string;
  commune: string;
}

interface PerformanceData {
  vendor_id: number;
  vendor_name: string;
  period: {
    start_date: string;
    end_date: string;
  };
  monthly_performance: MonthlyPerformance[];
  summary: {
    period_start: string;
    period_end: string;
    total_customers: number;
    total_revenue: number;
    total_products_sold: number;
    total_sales: number;
    overall_performance: number;
  };
  performance_indicators: {
    best_month: MonthlyPerformance;
    worst_month: MonthlyPerformance;
    growth_rate: number;
  };
}

interface MonthlyPerformance {
  month: string;
  year: number;
  month_number: number;
  total_customers: number;
  total_revenue: number;
  total_products_sold: number;
  total_sales: number;
  performance_ratio: number;
  average_basket: number;
  revenue_per_customer: number;
}

interface Props {
  selectedPOS: POSData | null;
}

const MobileVendorsManagement = ({ selectedPOS }: Props) => {
  // States
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showVendorDetails, setShowVendorDetails] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<FormVendor>>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newVendor, setNewVendor] = useState<FormVendor>(getDefaultVendorForm(selectedPOS));
  const [activeTab, setActiveTab] = useState<'activities' | 'performance' | 'notes'>('activities');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [pointsOfSale, setPointsOfSale] = useState<PointOfSale[]>([]);
  const [loadingPOS, setLoadingPOS] = useState(false);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loadingPerformance, setLoadingPerformance] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const { user } = useAuth();

  // Helper functions
  function getDefaultVendorForm(pos: POSData | null): FormVendor {
    return {
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      status: 'actif',
      vehicle_type: 'moto',
      vehicle_id: '',
      zones: '',
      point_of_sale: pos?.pos_id?.toString() || '',
      photo: undefined,
      is_approved: false,
      notes: '',
      average_daily_sales: 0,
      performance: 0,
      username: '',
      password: ''
    };
  }

  const getPerformanceColor = (performance: number) => {
    if (performance >= 70) return 'bg-green-500 text-white';
    if (performance >= 50) return 'bg-yellow-500 text-white';
    return 'bg-red-500 text-white';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'actif': return 'bg-green-100 text-green-800';
      case 'inactif': return 'bg-gray-100 text-gray-800';
      case 'en_conge': return 'bg-blue-100 text-blue-800';
      case 'suspendu': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
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
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, isEditMode = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
        if (isEditMode) {
          setEditForm(prev => ({ ...prev, photo: file }));
        } else {
          setNewVendor(prev => ({ ...prev, photo: file }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, isEditMode = false) => {
    const { name, value } = e.target;
    if (isEditMode) {
      setEditForm(prev => ({ ...prev, [name]: value }));
    } else {
      setNewVendor(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleZoneChange = (e: React.ChangeEvent<HTMLInputElement>, isEditMode = false) => {
    const { value } = e.target;
    if (isEditMode) {
      setEditForm(prev => ({ ...prev, zones: value }));
    } else {
      setNewVendor(prev => ({ ...prev, zones: value }));
    }
  };

  const handleDateFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateFilter(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyDateFilter = () => {
    if (selectedVendor) {
      fetchVendorPerformance(selectedVendor.id);
    }
  };

  const resetDateFilter = () => {
    setDateFilter({
      startDate: '',
      endDate: ''
    });
    if (selectedVendor) {
      fetchVendorPerformance(selectedVendor.id);
    }
  };

  const viewVendorDetails = async (vendor: Vendor) => {
    try {
      // Réinitialiser les filtres de date
      setDateFilter({
        startDate: '',
        endDate: ''
      });
      
      const response = await apiService.get(`/mobile-vendors/${vendor.id}/`);
      if (!response.ok) throw new Error('Failed to fetch vendor details');
      const data: Vendor = await response.json();
      
      setSelectedVendor(data);
      
      setEditForm({
        ...data,
        zones: data.zones.join(', '),
        point_of_sale: data.point_of_sale?.toString() || '',
        photo: data.photo,
        username: '',
        password: ''
      });
      
      setPhotoPreview(data.photo || null);
      setShowVendorDetails(true);
      setActiveTab('activities');
      
      // Charger les données de performance
      await fetchVendorPerformance(data.id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchVendorPerformance = async (vendorId: number) => {
    try {
      setLoadingPerformance(true);
      
      // Construction de l'URL avec les paramètres
      let url = `/sales/performance/?vendor_id=${vendorId}`;
      
      // Ajout des filtres de date s'ils sont définis
      if (dateFilter.startDate) {
        url += `&start_date=${dateFilter.startDate}`;
      }
      if (dateFilter.endDate) {
        url += `&end_date=${dateFilter.endDate}`;
      }
      
      const response = await apiService.get(url);
      if (!response.ok) throw new Error('Failed to fetch vendor performance');
      const data: PerformanceData = await response.json();
      setPerformanceData(data);
    } catch (err: any) {
      console.error('Error fetching performance data:', err);
      setError('Impossible de charger les données de performance');
    } finally {
      setLoadingPerformance(false);
    }
  };

  const createVendor = async () => {
    try {
      const formData = new FormData();
      
      Object.entries(newVendor as Record<keyof FormVendor, FormVendor[keyof FormVendor]>).forEach(([key, value]) => {
        if (key === 'zones' && typeof value === 'string') {
          formData.append(key, JSON.stringify(value.split(',').map((z: string) => z.trim()).filter((z: string) => z)));
        } else if (key === 'photo' && value instanceof File) {
          formData.append(key, value);
        } else if (value !== null && value !== undefined && value !== '') {
          formData.append(key, String(value));
        }
      });

      const response = await apiService.post('/mobile-vendors/', formData, true);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create vendor');
      }
      
      const createdVendor: Vendor = await response.json();
      setVendors([...vendors, createdVendor]);
      setShowCreateForm(false);
      setNewVendor(getDefaultVendorForm(selectedPOS));
      setPhotoPreview(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const updateVendor = async () => {
    if (!selectedVendor) return;
    try {
      const formData = new FormData();
      Object.entries(editForm as Record<keyof FormVendor, FormVendor[keyof FormVendor]>).forEach(([key, value]) => {
        if (key === 'zones' && typeof value === 'string') {
          formData.append(key, JSON.stringify(value.split(',').map((z: string) => z.trim()).filter((z: string) => z)));
        } else if (key === 'photo' && value instanceof File) {
          formData.append(key, value);
        } else if (value !== null && value !== undefined && value !== '') {
          formData.append(key, String(value));
        }
      });

      const response = await apiService.patch(
        `/mobile-vendors/${selectedVendor.id}/`, 
        formData, 
        true
      );
      
      if (!response.ok) throw new Error('Failed to update vendor');
      
      const updatedVendor: Vendor = await response.json();
      setVendors(vendors.map(v => v.id === updatedVendor.id ? updatedVendor : v));
      setSelectedVendor(updatedVendor);
      setIsEditing(false);
      setPhotoPreview(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteVendor = async (vendorId: number) => {
    try {
      if (!confirm('Are you sure you want to delete this vendor?')) return;
      
      const response = await apiService.delete(`/mobile-vendors/${vendorId}/`);
      
      if (!response.ok) throw new Error('Failed to delete vendor');
      
      setVendors(vendors.filter(v => v.id !== vendorId));
      if (selectedVendor?.id === vendorId) {
        setShowVendorDetails(false);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Effects
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true);
        let url = '/mobile-vendors/';
        if (selectedPOS?.pos_id) {
          url = `/mobile-vendors/?point_of_sale=${selectedPOS.pos_id}`;
        }
        
        const response = await apiService.get(url);
        if (!response.ok) throw new Error('Failed to fetch vendors');
        const data: Vendor[] = await response.json();
        setVendors(data);
      } catch (err: any) {
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
      } catch (err: any) {
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
    const formData: Partial<FormVendor> = isEditMode ? editForm : newVendor;
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => handleInputChange(e, isEditMode);
    const handleZone = (e: React.ChangeEvent<HTMLInputElement>) => handleZoneChange(e, isEditMode);
    const photoHandler = (e: React.ChangeEvent<HTMLInputElement>) => handlePhotoUpload(e, isEditMode);

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

        {/* Nouveaux champs username et password */}
        {!isEditMode && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nom d'utilisateur *</label>
              <div className="mt-1 relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  name="username"
                  value={formData.username || ''}
                  onChange={handleChange}
                  className="pl-10 mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                  placeholder="Choisir un nom d'utilisateur"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Mot de passe *</label>
              <div className="mt-1 relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="password"
                  name="password"
                  value={formData.password || ''}
                  onChange={handleChange}
                  className="pl-10 mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                  placeholder="Choisir un mot de passe"
                />
              </div>
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Prénom *</label>
          <input
            type="text"
            name="first_name"
            value={formData.first_name || ''}
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
            value={formData.last_name || ''}
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
            value={formData.phone || ''}
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
            value={formData.email || ''}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Statut *</label>
          <select
            name="status"
            value={formData.status || 'actif'}
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
            value={formData.vehicle_type || 'moto'}
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
            value={formData.vehicle_id || ''}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Zones (séparées par des virgules) *</label>
          <input
            type="text"
            name="zones"
            value={formData.zones || ''}
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
            value={formData.point_of_sale || ''}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
            disabled={loadingPOS}
          >
            <option value="">-- Sélectionnez --</option>
            {pointsOfSale.map((pos) => (
              <option key={pos.id} value={pos.id.toString()}>
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
            value={formData.performance || 0}
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
            value={formData.average_daily_sales || 0}
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
            checked={formData.is_approved || false}
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
            value={formData.notes || ''}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    );
  };

  const renderStatsCards = (isDetailView = false) => {
    if (isDetailView && performanceData) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Ventes Mensuelles</p>
                <p className="text-3xl font-bold mt-1 text-blue-900">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(performanceData.summary.total_revenue)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Coins className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Produits Vendus</p>
                <p className="text-3xl font-bold mt-1 text-green-900">{performanceData.summary.total_products_sold}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Check className="text-green-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-800">Performance</p>
                <p className={`text-3xl font-bold mt-1 ${getPerformanceColor(performanceData.summary.overall_performance)} px-2 rounded-full inline-block`}>
                  {performanceData.summary.overall_performance.toFixed(2)}%
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  {performanceData.performance_indicators.growth_rate !== 0 && 
                    `Taux croissance: ${performanceData.performance_indicators.growth_rate > 0 ? '+' : ''}${performanceData.performance_indicators.growth_rate.toFixed(2)}%`}
                </p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <Star className="text-amber-600" size={24} />
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Total Vendeurs</p>
              <p className="text-3xl font-bold mt-1 text-blue-900">{vendors.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <UserRound className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Vendeurs Actifs</p>
              <p className="text-3xl font-bold mt-1 text-green-900">
                {vendors.filter(v => v.status === 'actif').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Check className="text-green-600" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-800">Performance Moyenne</p>
              <p className="text-3xl font-bold mt-1 text-amber-900">
                {vendors.length > 0 
                  ? Math.round(vendors.reduce((acc, v) => acc + (v.performance || 0), 0) / vendors.length) 
                  : 0}%
              </p>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <Star className="text-amber-600" size={24} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPerformanceChart = () => {
    if (!performanceData || !performanceData.monthly_performance.length) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Aucune donnée de performance disponible</p>
        </div>
      );
    }

    const monthlyData = performanceData.monthly_performance;
    
    // Si nous n'avons qu'un seul mois, ajustons l'échelle pour qu'il soit visible
    const maxRevenue = Math.max(...monthlyData.map(item => item.total_revenue), 100000);
    const maxProducts = Math.max(...monthlyData.map(item => item.total_products_sold), 50);

    return (
      <div className="space-y-6">
        {/* Graphique */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-4">Performance mensuelle - Revenus et Produits vendus</h4>
          <div className="h-80">
            <div className="flex h-full space-x-4 items-end justify-center">
              {monthlyData.map((item, index) => (
                <div key={index} className="flex flex-col items-center" style={{ width: `${100 / Math.max(monthlyData.length, 3)}%` }}>
                  <div className="flex flex-col items-center w-full h-full justify-end space-y-2">
                    {/* Barre pour les revenus */}
                    <div 
                      className="w-3/4 bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                      style={{ height: `${(item.total_revenue / maxRevenue) * 70}%` }}
                      title={`${item.month}: ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(item.total_revenue)}`}
                    >
                      <div className="text-white text-xs font-bold text-center mt-1">
                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', notation: 'compact' }).format(item.total_revenue)}
                      </div>
                    </div>
                    
                    {/* Barre pour les produits vendus */}
                    <div 
                      className="w-3/4 bg-green-500 rounded-t transition-all duration-300 hover:bg-green-600"
                      style={{ height: `${(item.total_products_sold / maxProducts) * 70}%` }}
                      title={`${item.month}: ${item.total_products_sold} produits`}
                    >
                      <div className="text-white text-xs font-bold text-center mt-1">
                        {item.total_products_sold}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-2 text-center">
                    {item.month.split(' ')[0]}
                  </div>
                  <div className="text-xs text-gray-400 text-center">
                    {item.year}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-center mt-4 space-x-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Revenus (XOF)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Produits vendus</span>
            </div>
          </div>
        </div>
        
        {/* Indicateurs de performance */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-4">Indicateurs de performance</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h5 className="font-medium text-blue-800 mb-2">Meilleur mois</h5>
              {performanceData.performance_indicators.best_month ? (
                <div>
                  <p className="text-sm">{performanceData.performance_indicators.best_month.month}</p>
                  <p className="text-xl font-bold">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(performanceData.performance_indicators.best_month.total_revenue)}
                  </p>
                  <p className="text-sm">{performanceData.performance_indicators.best_month.total_products_sold} produits vendus</p>
                  <p className="text-sm">{performanceData.performance_indicators.best_month.total_customers} clients</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Aucune donnée</p>
              )}
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <h5 className="font-medium text-red-800 mb-2">Moins bon mois</h5>
              {performanceData.performance_indicators.worst_month ? (
                <div>
                  <p className="text-sm">{performanceData.performance_indicators.worst_month.month}</p>
                  <p className="text-xl font-bold">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(performanceData.performance_indicators.worst_month.total_revenue)}
                  </p>
                  <p className="text-sm">{performanceData.performance_indicators.worst_month.total_products_sold} produits vendus</p>
                  <p className="text-sm">{performanceData.performance_indicators.worst_month.total_customers} clients</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Aucune donnée</p>
              )}
            </div>
            
            <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
              <h5 className="font-medium text-gray-800 mb-2">Résumé de la période</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Revenu total</p>
                  <p className="text-lg font-bold">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(performanceData.summary.total_revenue)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Produits vendus</p>
                  <p className="text-lg font-bold">{performanceData.summary.total_products_sold}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Clients</p>
                  <p className="text-lg font-bold">{performanceData.summary.total_customers}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ventes</p>
                  <p className="text-lg font-bold">{performanceData.summary.total_sales}</p>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-2 bg-green-50 p-4 rounded-lg">
              <h5 className="font-medium text-green-800 mb-2">Taux de croissance</h5>
              <div className="flex items-center">
                {performanceData.performance_indicators.growth_rate > 0 ? (
                  <TrendingUp className="text-green-500 mr-2" size={24} />
                ) : performanceData.performance_indicators.growth_rate < 0 ? (
                  <TrendingDown className="text-red-500 mr-2" size={24} />
                ) : (
                  <span className="mr-2">➡️</span>
                )}
                <span className={`text-xl font-bold ${performanceData.performance_indicators.growth_rate > 0 ? 'text-green-600' : performanceData.performance_indicators.growth_rate < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {performanceData.performance_indicators.growth_rate > 0 ? '+' : ''}
                  {performanceData.performance_indicators.growth_rate.toFixed(2)}%
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Période: {new Date(performanceData.period.start_date).toLocaleDateString('fr-FR')} - {new Date(performanceData.period.end_date).toLocaleDateString('fr-FR')}
              </p>
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
        
            {/* Filtres de date - DÉPLACÉ ICI AU LIEU DE DANS PERFORMANCE */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-800">Filtres de période</h4>
                <Filter size={18} className="text-gray-500" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de début
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={dateFilter.startDate}
                    onChange={handleDateFilterChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={dateFilter.endDate}
                    onChange={handleDateFilterChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="flex items-end space-x-2">
                  <button
                    onClick={applyDateFilter}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Appliquer
                  </button>
                  <button
                    onClick={resetDateFilter}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Réinitialiser
                  </button>
                </div>
              </div>
              
              <div className="mt-3 text-sm text-gray-500">
                Période actuelle: {new Date(performanceData?.period.start_date || '').toLocaleDateString('fr-FR')} - {new Date(performanceData?.period.end_date || '').toLocaleDateString('fr-FR')}
              </div>
            </div>
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
                    Vendeur ambulant • {selectedVendor.point_of_sale_name || 'Non assigné'} • {selectedVendor.vehicle_type}
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
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedVendor.status)}`}>
                {selectedVendor.status}
              </span>
              {selectedVendor.is_approved && (
                <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  Approuvé
                </span>
              )}
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${getPerformanceColor(selectedVendor.performance)}`}>
                Performance: {selectedVendor.performance}%
              </span>
            </div>

            
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
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
              
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
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
              
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
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
                    <span className="text-sm font-medium">{selectedVendor.point_of_sale_name || 'Non assigné'}</span>
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
                    <div key={activity.id} className="p-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50">
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
            
            {activeTab === 'performance' && (
              <div className="space-y-6">
                {loadingPerformance ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  renderPerformanceChart()
                )}
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
                          <img 
                            src={vendor.photo} 
                            alt={`${vendor.first_name} ${vendor.last_name}`} 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-600 font-medium">
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
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
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
            {selectedPOS?.pos_name || "Tous les vendeurs ambulants"}
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