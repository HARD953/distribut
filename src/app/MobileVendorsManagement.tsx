"use client";
import React, { useState, useEffect } from 'react';
import { 
  Bike, Plus, AlertTriangle, UserRound, ChevronDown, 
  Search, MoreVertical, Star, MapPin, Phone, Mail, Clock,
  ChevronLeft, ChevronRight, Frown, Smile, Meh, Check,
  Edit, Trash2, Save, Coins, Image as ImageIcon, Calendar,
  BarChart3, TrendingUp, TrendingDown, Filter, Key, User,
  ShoppingBag, X, Download, Upload, Eye, Award, Target
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
  purchases?: Purchase[];
}

interface Purchase {
  id: number;
  sales_total: string;
  first_name: string;
  last_name: string;
  zone: string;
  amount: string;
  photo: string;
  purchase_date: string;
  created_at: string;
  updated_at: string;
  base: string;
  pushcard_type: string;
  latitude: number;
  longitude: number;
  phone: string;
  vendor: number;
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
  const [activeTab, setActiveTab] = useState<'activities' | 'performance' | 'notes' | 'purchases'>('activities');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [pointsOfSale, setPointsOfSale] = useState<PointOfSale[]>([]);
  const [loadingPOS, setLoadingPOS] = useState(false);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [loadingPerformance, setLoadingPerformance] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const { user } = useAuth();

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
    if (performance >= 80) return 'bg-gradient-to-r from-green-500 to-green-600 text-white';
    if (performance >= 60) return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white';
    if (performance >= 40) return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white';
    return 'bg-gradient-to-r from-red-500 to-red-600 text-white';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'actif': return 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300';
      case 'inactif': return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300';
      case 'en_conge': return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300';
      case 'suspendu': return 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300';
      default: return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300';
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
      
      await fetchVendorPerformance(data.id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchVendorPerformance = async (vendorId: number) => {
    try {
      setLoadingPerformance(true);
      
      let url = `/sales/performance/?vendor_id=${vendorId}`;
      
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
      if (!confirm('Êtes-vous sûr de vouloir supprimer ce vendeur?')) return;
      
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

  const renderLoading = () => (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  const renderError = () => (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg shadow-sm">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-red-500" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-red-700">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Photo</label>
          <div className="flex items-center space-x-4">
            <div className="relative h-20 w-20 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 border-2 border-dashed border-gray-300">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>
            <label className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-lg shadow-md hover:from-blue-600 hover:to-purple-700 transition-all duration-200 cursor-pointer flex items-center">
              <Upload size={16} className="mr-2" />
              <span>Changer</span>
              <input type="file" className="sr-only" onChange={photoHandler} accept="image/*" />
            </label>
          </div>
        </div>

        {!isEditMode && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom d'utilisateur *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="username"
                  value={formData.username || ''}
                  onChange={handleChange}
                  className="pl-10 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="Choisir un nom d'utilisateur"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password || ''}
                  onChange={handleChange}
                  className="pl-10 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="Choisir un mot de passe"
                />
              </div>
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Prénom *</label>
          <input
            type="text"
            name="first_name"
            value={formData.first_name || ''}
            onChange={handleChange}
            className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
          <input
            type="text"
            name="last_name"
            value={formData.last_name || ''}
            onChange={handleChange}
            className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone *</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              name="phone"
              value={formData.phone || ''}
              onChange={handleChange}
              className="pl-10 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              className="pl-10 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Statut *</label>
          <select
            name="status"
            value={formData.status || 'actif'}
            onChange={handleChange}
            className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
            <option value="en_conge">En congé</option>
            <option value="suspendu">Suspendu</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Type de véhicule *</label>
          <select
            name="vehicle_type"
            value={formData.vehicle_type || 'moto'}
            onChange={handleChange}
            className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="moto">Moto</option>
            <option value="tricycle">Tricycle</option>
            <option value="velo">Vélo</option>
            <option value="pied">À pied</option>
            <option value="autre">Autre</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Numéro de véhicule</label>
          <input
            type="text"
            name="vehicle_id"
            value={formData.vehicle_id || ''}
            onChange={handleChange}
            className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Zones (séparées par des virgules) *</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              name="zones"
              value={formData.zones || ''}
              onChange={handleZone}
              className="pl-10 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Cocody, Plateau, Abobo"
              required
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Point de Vente *</label>
          <select
            name="point_of_sale"
            value={formData.point_of_sale || ''}
            onChange={handleChange}
            className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Performance (%)</label>
          <input
            type="number"
            name="performance"
            value={formData.performance || 0}
            onChange={handleChange}
            min="0"
            max="100"
            className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ventes moyennes/jour (XOF)</label>
          <input
            type="number"
            name="average_daily_sales"
            value={formData.average_daily_sales || 0}
            onChange={handleChange}
            min="0"
            step="0.01"
            className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center mt-6">
          <input
            type="checkbox"
            name="is_approved"
            checked={formData.is_approved || false}
            onChange={(e) => isEditMode 
              ? setEditForm({...editForm, is_approved: e.target.checked})
              : setNewVendor({...newVendor, is_approved: e.target.checked})
            }
            className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm font-medium text-gray-700">Approuvé</label>
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
          <textarea
            name="notes"
            value={formData.notes || ''}
            onChange={handleChange}
            rows={3}
            className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    );
  };

  const renderStatsCards = (isDetailView = false) => {
    if (isDetailView && performanceData) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Ventes Mensuelles</p>
                <p className="text-2xl font-bold mt-1">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(performanceData.summary.total_revenue)}
                </p>
              </div>
              <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                <Coins className="text-white" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Produits Vendus</p>
                <p className="text-2xl font-bold mt-1">{performanceData.summary.total_products_sold}</p>
              </div>
              <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                <Check className="text-white" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Performance</p>
                <p className="text-2xl font-bold mt-1">
                  {performanceData.summary.overall_performance.toFixed(2)}%
                </p>
                <p className="text-xs opacity-90 mt-1">
                  {performanceData.performance_indicators.growth_rate !== 0 && 
                    `Croissance: ${performanceData.performance_indicators.growth_rate > 0 ? '+' : ''}${performanceData.performance_indicators.growth_rate.toFixed(2)}%`}
                </p>
              </div>
              <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                <Star className="text-white" size={24} />
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Total Vendeurs</p>
              <p className="text-2xl font-bold mt-1">{vendors.length}</p>
            </div>
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <UserRound className="text-white" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Vendeurs Actifs</p>
              <p className="text-2xl font-bold mt-1">
                {vendors.filter(v => v.status === 'actif').length}
              </p>
            </div>
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <Check className="text-white" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Performance Moyenne</p>
              <p className="text-2xl font-bold mt-1">
                {vendors.length > 0 
                  ? Math.round(vendors.reduce((acc, v) => acc + (v.performance || 0), 0) / vendors.length) 
                  : 0}%
              </p>
            </div>
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <Star className="text-white" size={24} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPerformanceChart = () => {
    if (!performanceData || !performanceData.monthly_performance.length) {
      return (
        <div className="flex flex-col items-center justify-center h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 text-center">
          <BarChart3 className="text-gray-400 mb-4" size={48} />
          <p className="text-gray-500 font-medium">Aucune donnée de performance disponible</p>
          <p className="text-gray-400 text-sm mt-2">Les données de performance s'afficheront ici une fois disponibles</p>
        </div>
      );
    }

    const monthlyData = performanceData.monthly_performance;
    const maxRevenue = Math.max(...monthlyData.map(item => item.total_revenue), 100000);
    const maxProducts = Math.max(...monthlyData.map(item => item.total_products_sold), 50);

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-bold text-gray-800 text-lg">Performance mensuelle</h4>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                <span>Revenus (XOF)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                <span>Produits vendus</span>
              </div>
            </div>
          </div>
          
          <div className="h-80">
            <div className="flex h-full space-x-4 items-end justify-center">
              {monthlyData.map((item, index) => (
                <div key={index} className="flex flex-col items-center" style={{ width: `${100 / Math.max(monthlyData.length, 3)}%` }}>
                  <div className="flex flex-col items-center w-full h-full justify-end space-y-2">
                    <div 
                      className="w-3/4 bg-gradient-to-t from-blue-500 to-blue-600 rounded-t-lg transition-all duration-300 hover:from-blue-600 hover:to-blue-700 cursor-pointer"
                      style={{ height: `${(item.total_revenue / maxRevenue) * 70}%` }}
                      title={`${item.month}: ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(item.total_revenue)}`}
                    >
                      <div className="text-white text-xs font-bold text-center mt-1">
                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', notation: 'compact' }).format(item.total_revenue)}
                      </div>
                    </div>
                    
                    <div 
                      className="w-3/4 bg-gradient-to-t from-green-500 to-green-600 rounded-t-lg transition-all duration-300 hover:from-green-600 hover:to-green-700 cursor-pointer"
                      style={{ height: `${(item.total_products_sold / maxProducts) * 70}%` }}
                      title={`${item.month}: ${item.total_products_sold} produits`}
                    >
                      <div className="text-white text-xs font-bold text-center mt-1">
                        {item.total_products_sold}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-700 font-medium mt-2 text-center">
                    {item.month.split(' ')[0]}
                  </div>
                  <div className="text-xs text-gray-500 text-center">
                    {item.year}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h4 className="font-bold text-gray-800 text-lg mb-6">Indicateurs de performance</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200">
              <div className="flex items-center mb-3">
                <Award className="text-blue-600 mr-2" size={20} />
                <h5 className="font-semibold text-blue-800">Meilleur mois</h5>
              </div>
              {performanceData.performance_indicators.best_month ? (
                <div>
                  <p className="text-sm text-blue-700">{performanceData.performance_indicators.best_month.month}</p>
                  <p className="text-xl font-bold text-blue-900">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(performanceData.performance_indicators.best_month.total_revenue)}
                  </p>
                  <div className="flex justify-between mt-2 text-sm text-blue-700">
                    <span>{performanceData.performance_indicators.best_month.total_products_sold} produits</span>
                    <span>{performanceData.performance_indicators.best_month.total_customers} clients</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-blue-500">Aucune donnée</p>
              )}
            </div>
            
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-5 rounded-xl border border-red-200">
              <div className="flex items-center mb-3">
                <Target className="text-red-600 mr-2" size={20} />
                <h5 className="font-semibold text-red-800">Moins bon mois</h5>
              </div>
              {performanceData.performance_indicators.worst_month ? (
                <div>
                  <p className="text-sm text-red-700">{performanceData.performance_indicators.worst_month.month}</p>
                  <p className="text-xl font-bold text-red-900">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(performanceData.performance_indicators.worst_month.total_revenue)}
                  </p>
                  <div className="flex justify-between mt-2 text-sm text-red-700">
                    <span>{performanceData.performance_indicators.worst_month.total_products_sold} produits</span>
                    <span>{performanceData.performance_indicators.worst_month.total_customers} clients</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-red-500">Aucune donnée</p>
              )}
            </div>
            
            <div className="md:col-span-2 bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200">
              <h5 className="font-semibold text-gray-800 mb-4">Résumé de la période</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600">Revenu total</p>
                  <p className="text-lg font-bold text-blue-600">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(performanceData.summary.total_revenue)}
                  </p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600">Produits vendus</p>
                  <p className="text-lg font-bold text-green-600">{performanceData.summary.total_products_sold}</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600">Clients</p>
                  <p className="text-lg font-bold text-purple-600">{performanceData.summary.total_customers}</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600">Ventes</p>
                  <p className="text-lg font-bold text-orange-600">{performanceData.summary.total_sales}</p>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-2 bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl border border-green-200">
              <h5 className="font-semibold text-green-800 mb-3">Taux de croissance</h5>
              <div className="flex items-center">
                {performanceData.performance_indicators.growth_rate > 0 ? (
                  <TrendingUp className="text-green-600 mr-2" size={24} />
                ) : performanceData.performance_indicators.growth_rate < 0 ? (
                  <TrendingDown className="text-red-600 mr-2" size={24} />
                ) : (
                  <span className="mr-2">➡️</span>
                )}
                <span className={`text-2xl font-bold ${performanceData.performance_indicators.growth_rate > 0 ? 'text-green-600' : performanceData.performance_indicators.growth_rate < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {performanceData.performance_indicators.growth_rate > 0 ? '+' : ''}
                  {performanceData.performance_indicators.growth_rate.toFixed(2)}%
                </span>
              </div>
              <p className="text-sm text-green-700 mt-2">
                Période: {new Date(performanceData.period.start_date).toLocaleDateString('fr-FR')} - {new Date(performanceData.period.end_date).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPurchasesList = () => {
    if (!selectedVendor?.purchases || selectedVendor.purchases.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 text-center">
          <ShoppingBag className="text-gray-400 mb-4" size={48} />
          <p className="text-gray-500 font-medium">Aucun achat enregistré pour ce vendeur</p>
          <p className="text-gray-400 text-sm mt-2">Les achats apparaîtront ici une fois enregistrés</p>
        </div>
      );
    }

    const uniqueTypes = Array.from(new Set(selectedVendor.purchases.map(p => p.pushcard_type)));
    const filteredPurchases = filterType === 'all' 
      ? selectedVendor.purchases 
      : selectedVendor.purchases.filter(p => p.pushcard_type === filterType);

    return (
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-4 mb-3 md:mb-0">
            <label className="text-sm font-medium text-gray-700">Filtrer par type:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les types</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
            {filteredPurchases.length} achat(s) sur {selectedVendor.purchases.length}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Zone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Photo
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPurchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {purchase.first_name} {purchase.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {purchase.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(purchase.purchase_date).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(purchase.purchase_date).toLocaleTimeString('fr-FR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {purchase.pushcard_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{purchase.zone}</div>
                      <div className="text-xs text-gray-500">{purchase.base}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">
                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(parseFloat(purchase.amount))}
                      </div>
                      {purchase.sales_total && (
                        <div className="text-xs text-blue-600">
                          Ventes: {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(parseFloat(purchase.sales_total))}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {purchase.photo ? (
                        <div className="h-10 w-10 rounded-md overflow-hidden bg-gray-100 shadow-sm">
                          <img 
                            src={`https://api.pushtrack360.com/api${purchase.photo}`} 
                            alt={`Achat ${purchase.id}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Aucune</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPurchases.length > 0 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Affichage de {filteredPurchases.length} achat(s)
              </div>
            </div>
          )}
        </div>

        {filteredPurchases.length === 0 && filterType !== 'all' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-yellow-800">
              Aucun achat trouvé pour le type "{filterType}"
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderVendorDetails = () => {
    if (!selectedVendor) return null;

    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-gray-800 text-lg">Filtres de période</h4>
            <Filter size={20} className="text-gray-500" />
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
                className="w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-end space-x-2">
              <button
                onClick={applyDateFilter}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
              >
                Appliquer
              </button>
              <button
                onClick={resetDateFilter}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
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
                className="mr-4 text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <ChevronLeft size={24} />
              </button>

              {isEditing ? (
                <h2 className="text-2xl font-bold text-gray-800">Modifier le vendeur</h2>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{selectedVendor.first_name} {selectedVendor.last_name}</h2>
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
                className="p-2 text-blue-600 hover:text-blue-900 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                title="Modifier"
              >
                <Edit size={18} />
              </button>
              <button
                onClick={() => deleteVendor(selectedVendor.id)}
                className="p-2 text-red-600 hover:text-red-900 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                title="Supprimer"
              >
                <Trash2 size={18} />
              </button>
            </div>
          )}
        </div>
        
        {isEditing ? (
          <div className="space-y-6">
            {renderVendorForm(true)}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setPhotoPreview(null);
                }}
                className="px-5 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={updateVendor}
                className="px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors flex items-center"
              >
                <Save size={18} className="mr-2" />
                Enregistrer
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center space-x-3 mb-6">
              <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${getStatusColor(selectedVendor.status)}`}>
                {selectedVendor.status}
              </span>
              {selectedVendor.is_approved && (
                <span className="px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 rounded-full border border-blue-300">
                  Approuvé
                </span>
              )}
              <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${getPerformanceColor(selectedVendor.performance)}`}>
                Performance: {selectedVendor.performance}%
              </span>
            </div>

            {renderStatsCards(true)}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="border border-gray-200 rounded-xl p-5 bg-gradient-to-br from-gray-50 to-white shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                  <UserRound className="mr-2 text-blue-500" size={18} />
                  Informations Personnelles
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Phone className="text-gray-500 mr-3" size={16} />
                    <span className="text-sm">{selectedVendor.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="text-gray-500 mr-3" size={16} />
                    <span className="text-sm">{selectedVendor.email || 'Non spécifié'}</span>
                  </div>
                  <div className="flex items-center">
                    <Bike className="text-gray-500 mr-3" size={16} />
                    <span className="text-sm capitalize">{selectedVendor.vehicle_type}</span>
                    {selectedVendor.vehicle_id && (
                      <span className="text-sm ml-2">({selectedVendor.vehicle_id})</span>
                    )}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="text-gray-500 mr-3" size={16} />
                    <span className="text-sm">
                      Membre depuis {new Date(selectedVendor.date_joined).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-xl p-5 bg-gradient-to-br from-gray-50 to-white shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                  <MapPin className="mr-2 text-green-500" size={18} />
                  Zone d'Activité
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedVendor.zones.map((zone, i) => (
                    <span key={i} className="px-3 py-1.5 text-xs bg-gradient-to-r from-green-50 to-green-100 text-green-800 rounded-full flex items-center border border-green-200">
                      <MapPin className="mr-1" size={12} />
                      {zone}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-xl p-5 bg-gradient-to-br from-gray-50 to-white shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                  <BarChart3 className="mr-2 text-purple-500" size={18} />
                  Statistiques
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Ventes moyennes/jour:</span>
                    <span className="text-sm font-medium text-blue-600">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(selectedVendor.average_daily_sales)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Dernière activité:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedVendor.last_activity ? 
                        new Date(selectedVendor.last_activity).toLocaleString('fr-FR') : 
                        'Inconnue'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Point de vente:</span>
                    <span className="text-sm font-medium text-gray-900">{selectedVendor.point_of_sale_name || 'Non assigné'}</span>
                  </div>
                    <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Quantité en stock:</span>
                    <span className="text-sm font-medium text-blue-600">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(selectedVendor.average_daily_sales)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8 overflow-x-auto">
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
                  onClick={() => setActiveTab('purchases')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'purchases'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Pushcart ({selectedVendor.purchases?.length || 0})
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
                    <div key={activity.id} className="p-4 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors shadow-sm">
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
                  <div className="flex flex-col items-center justify-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                    <Clock className="text-gray-400 mb-4" size={40} />
                    <p className="text-gray-500 font-medium">Aucune activité récente</p>
                  </div>
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
            
            {activeTab === 'purchases' && (
              <div className="space-y-4">
                {renderPurchasesList()}
              </div>
            )}
            
            {activeTab === 'notes' && (
              <div className="space-y-4">
                {selectedVendor.notes ? (
                  <div className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                    <p className="text-gray-800 whitespace-pre-line">{selectedVendor.notes}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                    <Edit className="text-gray-400 mb-4" size={40} />
                    <p className="text-gray-500 font-medium">Aucune note pour ce vendeur</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderVendorList = () => (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
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
                <tr key={vendor.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 border-2 border-white shadow-sm">
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
                      className="text-blue-600 hover:text-blue-900 mr-3 font-medium"
                    >
                      Détails
                    </button>
                    <button className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-100">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <UserRound className="text-gray-400 mb-2" size={40} />
                    <p className="text-gray-500 font-medium">
                      {searchTerm ? 'Aucun vendeur trouvé' : 'Aucun vendeur enregistré'}
                    </p>
                    {!searchTerm && (
                      <button 
                        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                        onClick={() => setShowCreateForm(true)}
                      >
                        <Plus size={18} className="mr-2" />
                        Ajouter un vendeur
                      </button>
                    )}
                  </div>
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
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestion des Vendeurs Ambulants</h1>
          <p className="text-gray-600">
            {selectedPOS?.pos_name || "Tous les vendeurs ambulants"}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-gray-400" size={18} />
            </div>
            <input
              type="text"
              placeholder="Rechercher vendeurs..."
              className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button 
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center shadow-md"
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

      {renderStatsCards(showVendorDetails)}

      {showCreateForm && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Ajouter un nouveau vendeur</h2>
            <button 
              onClick={() => {
                setShowCreateForm(false);
                setPhotoPreview(null);
              }}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
          {renderVendorForm()}
          <div className="mt-6 flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              onClick={() => {
                setShowCreateForm(false);
                setPhotoPreview(null);
              }}
              className="px-5 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={createVendor}
              className="px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Enregistrer
            </button>
          </div>
        </div>
      )}

      {loading ? renderLoading() : (
        showVendorDetails ? renderVendorDetails() : renderVendorList()
      )}
    </div>
  );
};

export default MobileVendorsManagement;