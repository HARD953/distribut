"use client";
import React, { useState, useEffect } from 'react';
import { 
  Bike, Plus, AlertTriangle, UserRound, ChevronDown, 
  Search, MoreVertical, Star, MapPin, Phone, Mail, Clock,
  ChevronLeft, ChevronRight, Frown, Smile, Meh, Check,
  Edit, Trash2, Save, Coins, Image as ImageIcon, Calendar,
  BarChart3, TrendingUp, TrendingDown, Filter, Key, User,
  ShoppingBag, X, Download, Upload, Eye, Award, Target,
  RefreshCw, Map, Users, Activity, Package, TrendingUp as TrendingUpIcon,
  Shield, BadgePercent, Target as TargetIcon, Zap,
  Crown, Sparkles, Rocket, BarChart, Building2, Globe,
  ShieldCheck, Truck, DownloadCloud, UploadCloud
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

interface Sale {
  id: number;
  product_variant: number;
  customer: number;
  quantity: number;
  total_amount: string;
  created_at: string;
  updated_at: string;
  vendor: number;
  product_variant_name: string;
  format: string;
  customer_name: string;
  vendor_name: string;
  vendor_activity: number;
  latitude: number | null;
  longitude: number | null;
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

interface PerformanceUpdateResponse {
  message: string;
  performance: number;
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
  const [sales, setSales] = useState<Sale[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [activeTab, setActiveTab] = useState<'activities' | 'performance' | 'notes' | 'purchases' | 'map'>('activities');
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
  const [updatingPerformance, setUpdatingPerformance] = useState<number | null>(null);
  const [performanceDays, setPerformanceDays] = useState<number>(30);
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [purchaseFilterType, setPurchaseFilterType] = useState<string>('all');

  // Couleurs modernes avec glassmorphism
  const colors = {
    primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 backdrop-blur-sm',
    secondary: 'bg-white/80 backdrop-blur-xl border border-white/20 text-gray-700 hover:bg-white/90 transition-all duration-200',
    danger: 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-lg hover:shadow-xl transition-all duration-200',
    success: 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-200',
    warning: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-200'
  };

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
    if (performance >= 80) return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white';
    if (performance >= 60) return 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white';
    if (performance >= 40) return 'bg-gradient-to-r from-orange-500 to-amber-500 text-white';
    return 'bg-gradient-to-r from-red-500 to-rose-500 text-white';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'actif': return 'bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border border-emerald-300 backdrop-blur-sm';
      case 'inactif': return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300 backdrop-blur-sm';
      case 'en_conge': return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300 backdrop-blur-sm';
      case 'suspendu': return 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300 backdrop-blur-sm';
      default: return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300 backdrop-blur-sm';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'actif': return <Smile className="text-emerald-500" size={16} />;
      case 'inactif': return <Frown className="text-red-500" size={16} />;
      default: return <Meh className="text-amber-500" size={16} />;
    }
  };

  // Fonction pour mettre à jour les performances d'un vendeur
  const updateVendorPerformance = async (vendorId: number, days: number) => {
    try {
      setUpdatingPerformance(vendorId);
      setError(null);

      const response = await apiService.post(
        `/vendors/${vendorId}/update_performance/`,
        { days }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la mise à jour des performances');
      }

      const data: PerformanceUpdateResponse = await response.json();
      
      setVendors(prevVendors => 
        prevVendors.map(vendor => 
          vendor.id === vendorId 
            ? { ...vendor, performance: data.performance }
            : vendor
        )
      );

      if (selectedVendor && selectedVendor.id === vendorId) {
        setSelectedVendor(prev => prev ? { ...prev, performance: data.performance } : null);
      }

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setUpdatingPerformance(null);
    }
  };

  // Fonction pour mettre à jour les performances de tous les vendeurs
  const updateAllVendorsPerformance = async (days: number) => {
    try {
      setUpdatingPerformance(-1);
      setError(null);

      const updatePromises = vendors.map(vendor => 
        apiService.post(`/vendors/${vendor.id}/update_performance/`, { days })
      );

      const responses = await Promise.all(updatePromises);
      
      const allSuccessful = responses.every(response => response.ok);
      
      if (!allSuccessful) {
        throw new Error('Certaines mises à jour ont échoué');
      }

      const updateResults = await Promise.all(
        responses.map(response => response.json())
      );

      const updatedVendors = vendors.map((vendor, index) => ({
        ...vendor,
        performance: updateResults[index].performance
      }));

      setVendors(updatedVendors);
      
      setError(`Performance mise à jour pour ${vendors.length} vendeur(s)`);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdatingPerformance(null);
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

  // Fonction pour charger les ventes
  const fetchVendorSales = async (vendorId: number) => {
    try {
      setLoadingSales(true);
      const response = await apiService.get(`/salespos/?vendor=${vendorId}`);
      if (!response.ok) throw new Error('Failed to fetch vendor sales');
      const data: Sale[] = await response.json();
      setSales(data);
    } catch (err: any) {
      console.error('Error fetching sales data:', err);
      setError('Impossible de charger les données de vente');
    } finally {
      setLoadingSales(false);
    }
  };

  // Modifier la fonction viewVendorDetails pour charger les ventes
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
      
      await Promise.all([
        fetchVendorPerformance(data.id),
        fetchVendorSales(data.id)
      ]);
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

  // Composant pour la carte des ventes
  const SalesMap = ({ sales }: { sales: Sale[] }) => {
    const [mapLoaded, setMapLoaded] = useState(false);

    const salesWithLocation = sales.filter(sale => 
      sale.latitude !== null && sale.longitude !== null
    );

    useEffect(() => {
      const loadLeaflet = async () => {
        if (salesWithLocation.length === 0) return;

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        link.crossOrigin = '';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
        script.crossOrigin = '';
        script.onload = () => setMapLoaded(true);
        document.head.appendChild(script);

        return () => {
          document.head.removeChild(link);
          document.head.removeChild(script);
        };
      };

      loadLeaflet();
    }, [salesWithLocation.length]);

    useEffect(() => {
      if (!mapLoaded || salesWithLocation.length === 0) return;

      const map = (window as any).L.map('sales-map').setView(
        [salesWithLocation[0].latitude!, salesWithLocation[0].longitude!], 
        13
      );

      (window as any).L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      salesWithLocation.forEach((sale, index) => {
        if (sale.latitude && sale.longitude) {
          const popupContent = `
            <div class="p-2">
              <h4 class="font-bold">${sale.product_variant_name}</h4>
              <p><strong>Client:</strong> ${sale.customer_name}</p>
              <p><strong>Montant:</strong> ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(parseFloat(sale.total_amount))}</p>
              <p><strong>Quantité:</strong> ${sale.quantity}</p>
              <p><strong>Date:</strong> ${new Date(sale.created_at).toLocaleDateString('fr-FR')}</p>
            </div>
          `;

          (window as any).L.marker([sale.latitude, sale.longitude])
            .addTo(map)
            .bindPopup(popupContent);
        }
      });

      if (salesWithLocation.length > 1) {
        const group = new (window as any).L.featureGroup(
          salesWithLocation
            .filter(sale => sale.latitude && sale.longitude)
            .map(sale => (window as any).L.marker([sale.latitude!, sale.longitude!]))
        );
        map.fitBounds(group.getBounds().pad(0.1));
      }

      return () => {
        if (map) {
          map.remove();
        }
      };
    }, [mapLoaded, salesWithLocation]);

    if (salesWithLocation.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-96 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border border-white/20 p-8 text-center backdrop-blur-sm">
          <Map className="text-blue-400 mb-4" size={48} />
          <p className="text-slate-700 font-medium font-sans">Aucune donnée de localisation disponible</p>
          <p className="text-slate-500 text-sm mt-2 font-sans">
            Les ventes avec localisation GPS s'afficheront ici
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Statistiques des ventes localisées */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-200/50 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center">
              <MapPin className="text-blue-600 mr-3" size={20} />
              <div>
                <p className="text-sm font-medium text-slate-800 font-sans">Ventes localisées</p>
                <p className="text-2xl font-bold text-slate-900 font-sans">{salesWithLocation.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border border-emerald-200/50 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center">
              <ShoppingBag className="text-emerald-600 mr-3" size={20} />
              <div>
                <p className="text-sm font-medium text-slate-800 font-sans">Total des ventes</p>
                <p className="text-2xl font-bold text-slate-900 font-sans">{sales.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-200/50 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center">
              <Coins className="text-purple-600 mr-3" size={20} />
              <div>
                <p className="text-sm font-medium text-slate-800 font-sans">Chiffre d'affaires</p>
                <p className="text-2xl font-bold text-slate-900 font-sans">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(
                    sales.reduce((total, sale) => total + parseFloat(sale.total_amount), 0)
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Carte Leaflet */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden shadow-lg">
          <div 
            id="sales-map" 
            className="h-96 w-full relative"
            style={{ 
              minHeight: '384px',
              background: '#f8f9fa'
            }}
          >
            {!mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 backdrop-blur-sm">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-slate-600 font-sans">Chargement de la carte...</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Légende et contrôles */}
          <div className="p-4 bg-slate-50/80 backdrop-blur-sm border-t border-white/20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center text-sm text-slate-600 font-sans">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span>Points de vente localisés: {salesWithLocation.length}</span>
              </div>
              
              <div className="text-xs text-slate-500 font-sans">
                Cliquez sur les marqueurs pour voir les détails des ventes
              </div>
            </div>
          </div>
        </div>

        {/* Liste détaillée des ventes localisées */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/20 bg-gradient-to-r from-slate-50/80 to-slate-100/80 backdrop-blur-sm">
            <h3 className="font-bold text-slate-800 font-sans flex items-center">
              <MapPin className="mr-2 text-blue-500" size={18} />
              Détail des ventes localisées
            </h3>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {salesWithLocation.map((sale) => (
              <div key={sale.id} className="p-4 border-b border-white/20 hover:bg-white/50 transition-colors backdrop-blur-sm">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-slate-900 font-sans">
                        {sale.product_variant_name} ({sale.format})
                      </span>
                      <span className="text-emerald-600 font-bold font-sans">
                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(parseFloat(sale.total_amount))}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-slate-600 font-sans">
                      <div className="flex items-center">
                        <User className="mr-1" size={14} />
                        <span>{sale.customer_name}</span>
                      </div>
                      <div className="flex items-center">
                        <ShoppingBag className="mr-1" size={14} />
                        <span>Quantité: {sale.quantity}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="mr-1" size={14} />
                        <span>
                          {new Date(sale.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                    
                    {sale.latitude && sale.longitude && (
                      <div className="mt-2 text-xs text-slate-500 font-sans">
                        <span className="font-medium">Coordonnées:</span>{' '}
                        {sale.latitude.toFixed(4)}, {sale.longitude.toFixed(4)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderLoading = () => (
    <div className="flex justify-center items-center h-64">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="text-slate-600 font-sans">Chargement des commerciaux...</p>
      </div>
    </div>
  );

  const renderError = () => (
    <div className="bg-gradient-to-r from-red-500/10 to-red-600/10 backdrop-blur-xl border-l-4 border-red-500 p-4 mb-6 rounded-2xl shadow-sm">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-red-500" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-red-700 font-sans">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium font-sans"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );

  const renderPerformanceUpdateSection = () => (
    <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 mb-6 shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-slate-800 text-lg font-sans flex items-center">
            <RefreshCw className="mr-3 text-blue-500" size={20} />
            Mise à jour des Performances
          </h4>
          <p className="text-slate-600 text-sm font-sans mt-1">
            Mettre à jour les performances des vendeurs sur une période spécifique
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-slate-700 whitespace-nowrap font-sans">
              Période (jours):
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={performanceDays}
              onChange={(e) => setPerformanceDays(parseInt(e.target.value) || 30)}
              className="w-20 border border-white/20 bg-white/50 backdrop-blur-sm rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans"
            />
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => updateAllVendorsPerformance(performanceDays)}
              disabled={updatingPerformance === -1 || vendors.length === 0}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm font-sans shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {updatingPerformance === -1 ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Mise à jour...
                </>
              ) : (
                <>
                  <RefreshCw size={16} className="mr-2" />
                  Mettre à jour tous
                </>
              )}
            </button>
          </div>
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
          <label className="block text-sm font-medium text-slate-700 mb-3 font-sans">Photo de profil</label>
          <div className="flex items-center space-x-4">
            <div className="relative h-24 w-24 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 border-2 border-dashed border-white/30 group hover:border-blue-500 transition-colors backdrop-blur-sm">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <ImageIcon className="h-8 w-8 text-slate-400" />
                </div>
              )}
            </div>
            <label className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2.5 px-4 rounded-xl shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 cursor-pointer flex items-center font-sans font-medium transform hover:-translate-y-0.5">
              <UploadCloud size={16} className="mr-2" />
              <span>Changer la photo</span>
              <input type="file" className="sr-only" onChange={photoHandler} accept="image/*" />
            </label>
          </div>
        </div>

        {!isEditMode && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 font-sans">Nom d'utilisateur *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  name="username"
                  value={formData.username || ''}
                  onChange={handleChange}
                  className="pl-10 block w-full border border-white/20 bg-white/50 backdrop-blur-sm rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans"
                  required
                  placeholder="Choisir un nom d'utilisateur"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 font-sans">Mot de passe *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password || ''}
                  onChange={handleChange}
                  className="pl-10 block w-full border border-white/20 bg-white/50 backdrop-blur-sm rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans"
                  required
                  placeholder="Choisir un mot de passe"
                />
              </div>
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2 font-sans">Prénom *</label>
          <input
            type="text"
            name="first_name"
            value={formData.first_name || ''}
            onChange={handleChange}
            className="block w-full border border-white/20 bg-white/50 backdrop-blur-sm rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2 font-sans">Nom *</label>
          <input
            type="text"
            name="last_name"
            value={formData.last_name || ''}
            onChange={handleChange}
            className="block w-full border border-white/20 bg-white/50 backdrop-blur-sm rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2 font-sans">Téléphone *</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              name="phone"
              value={formData.phone || ''}
              onChange={handleChange}
              className="pl-10 block w-full border border-white/20 bg-white/50 backdrop-blur-sm rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans"
              required
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2 font-sans">Email</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              className="pl-10 block w-full border border-white/20 bg-white/50 backdrop-blur-sm rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2 font-sans">Statut *</label>
          <select
            name="status"
            value={formData.status || 'actif'}
            onChange={handleChange}
            className="block w-full border border-white/20 bg-white/50 backdrop-blur-sm rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans"
          >
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
            <option value="en_conge">En congé</option>
            <option value="suspendu">Suspendu</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2 font-sans">Type de véhicule *</label>
          <select
            name="vehicle_type"
            value={formData.vehicle_type || 'moto'}
            onChange={handleChange}
            className="block w-full border border-white/20 bg-white/50 backdrop-blur-sm rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans"
          >
            <option value="moto">Moto</option>
            <option value="tricycle">Tricycle</option>
            <option value="velo">Vélo</option>
            <option value="pied">À pied</option>
            <option value="autre">Autre</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2 font-sans">Numéro de véhicule</label>
          <input
            type="text"
            name="vehicle_id"
            value={formData.vehicle_id || ''}
            onChange={handleChange}
            className="block w-full border border-white/20 bg-white/50 backdrop-blur-sm rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2 font-sans">Zones (séparées par des virgules) *</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              name="zones"
              value={formData.zones || ''}
              onChange={handleZone}
              className="pl-10 block w-full border border-white/20 bg-white/50 backdrop-blur-sm rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans"
              placeholder="Cocody, Plateau, Abobo"
              required
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2 font-sans">Point de Vente *</label>
          <select
            name="point_of_sale"
            value={formData.point_of_sale || ''}
            onChange={handleChange}
            className="block w-full border border-white/20 bg-white/50 backdrop-blur-sm rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans"
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
          <label className="block text-sm font-medium text-slate-700 mb-2 font-sans">Performance (%)</label>
          <input
            type="number"
            name="performance"
            value={formData.performance || 0}
            onChange={handleChange}
            min="0"
            max="100"
            className="block w-full border border-white/20 bg-white/50 backdrop-blur-sm rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2 font-sans">Ventes moyennes/jour (XOF)</label>
          <input
            type="number"
            name="average_daily_sales"
            value={formData.average_daily_sales || 0}
            onChange={handleChange}
            min="0"
            step="0.01"
            className="block w-full border border-white/20 bg-white/50 backdrop-blur-sm rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans"
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
            className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-white/20 rounded bg-white/50 backdrop-blur-sm"
          />
          <label className="ml-2 block text-sm font-medium text-slate-700 font-sans">Approuvé</label>
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-2 font-sans">Notes</label>
          <textarea
            name="notes"
            value={formData.notes || ''}
            onChange={handleChange}
            rows={3}
            className="block w-full border border-white/20 bg-white/50 backdrop-blur-sm rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans resize-none"
          />
        </div>
      </div>
    );
  };

  const renderStatsCards = (isDetailView = false) => {
    if (isDetailView && performanceData) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-lg backdrop-blur-sm transform hover:-translate-y-1 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90 font-sans">Ventes Mensuelles</p>
                <p className="text-2xl font-bold mt-1 font-sans">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(performanceData.summary.total_revenue)}
                </p>
              </div>
              <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                <Coins className="text-white" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl p-6 shadow-lg backdrop-blur-sm transform hover:-translate-y-1 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90 font-sans">Produits Vendus</p>
                <p className="text-2xl font-bold mt-1 font-sans">{performanceData.summary.total_products_sold}</p>
              </div>
              <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                <Check className="text-white" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-6 shadow-lg backdrop-blur-sm transform hover:-translate-y-1 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90 font-sans">Performance</p>
                <p className="text-2xl font-bold mt-1 font-sans">
                  {performanceData.summary.overall_performance.toFixed(2)}%
                </p>
                <p className="text-xs opacity-90 mt-1 font-sans">
                  {performanceData.performance_indicators.growth_rate !== 0 && 
                    `Croissance: ${performanceData.performance_indicators.growth_rate > 0 ? '+' : ''}${performanceData.performance_indicators.growth_rate.toFixed(2)}%`}
                </p>
              </div>
              <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                <Star className="text-white" size={24} />
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-lg backdrop-blur-sm transform hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90 font-sans">Total Vendeurs</p>
              <p className="text-2xl font-bold mt-1 font-sans">{vendors.length}</p>
            </div>
            <div className="p-3 bg-white bg-opacity-20 rounded-xl">
              <Users className="text-white" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl p-6 shadow-lg backdrop-blur-sm transform hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90 font-sans">Vendeurs Actifs</p>
              <p className="text-2xl font-bold mt-1 font-sans">
                {vendors.filter(v => v.status === 'actif').length}
              </p>
            </div>
            <div className="p-3 bg-white bg-opacity-20 rounded-xl">
              <Activity className="text-white" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-6 shadow-lg backdrop-blur-sm transform hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90 font-sans">Performance Moyenne</p>
              <p className="text-2xl font-bold mt-1 font-sans">
                {vendors.length > 0 
                  ? Math.round(vendors.reduce((acc, v) => acc + (v.performance || 0), 0) / vendors.length) 
                  : 0}%
              </p>
            </div>
            <div className="p-3 bg-white bg-opacity-20 rounded-xl">
              <TrendingUpIcon className="text-white" size={24} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPerformanceChart = () => {
    if (!performanceData || !performanceData.monthly_performance.length) {
      return (
        <div className="flex flex-col items-center justify-center h-64 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border border-white/20 p-8 text-center backdrop-blur-sm">
          <BarChart3 className="text-blue-400 mb-4" size={48} />
          <p className="text-slate-700 font-medium font-sans">Aucune donnée de performance disponible</p>
          <p className="text-slate-500 text-sm mt-2 font-sans">Les données de performance s'afficheront ici une fois disponibles</p>
        </div>
      );
    }

    const monthlyData = performanceData.monthly_performance;
    
    const maxRevenue = Math.max(...monthlyData.map(item => item.total_revenue), 1);
    const maxProducts = Math.max(...monthlyData.map(item => item.total_products_sold), 1);

    return (
      <div className="space-y-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-bold text-slate-800 text-lg font-sans">Performance mensuelle - Diagramme en Barres</h4>
            <div className="flex items-center space-x-4 text-sm text-slate-500 font-sans">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                <span>Revenus (XOF)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-emerald-500 rounded mr-2"></div>
                <span>Produits vendus</span>
              </div>
            </div>
          </div>
          
          <div className="h-80 border border-white/20 rounded-2xl bg-slate-50/50 p-4 backdrop-blur-sm">
            <div className="flex items-end justify-between h-full space-x-2">
              {monthlyData.map((item, index) => (
                <div 
                  key={index} 
                  className="flex flex-col items-center justify-end h-full flex-1 space-x-1"
                >
                  <div className="flex items-end justify-center space-x-1 w-full">
                    <div className="flex flex-col items-center">
                      <div 
                        className="w-8 bg-blue-500 rounded-t hover:bg-blue-600 transition-all duration-300 cursor-pointer relative min-h-4"
                        style={{ 
                          height: `${(item.total_revenue / maxRevenue) * 90}%`,
                          minHeight: '20px'
                        }}
                        title={`Revenus: ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(item.total_revenue)}`}
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs font-medium text-blue-700 whitespace-nowrap font-sans">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', notation: 'compact' }).format(item.total_revenue)}
                        </div>
                      </div>
                      <div className="text-xs text-blue-600 mt-1 font-medium font-sans">Revenus</div>
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <div 
                        className="w-8 bg-emerald-500 rounded-t hover:bg-emerald-600 transition-all duration-300 cursor-pointer relative min-h-4"
                        style={{ 
                          height: `${(item.total_products_sold / maxProducts) * 90}%`,
                          minHeight: '20px'
                        }}
                        title={`Produits vendus: ${item.total_products_sold}`}
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs font-medium text-emerald-700 whitespace-nowrap font-sans">
                          {item.total_products_sold}
                        </div>
                      </div>
                      <div className="text-xs text-emerald-600 mt-1 font-medium font-sans">Produits</div>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-center">
                    <div className="text-sm font-medium text-slate-700 font-sans">
                      {item.month.split(' ')[0]}
                    </div>
                    <div className="text-xs text-slate-500 font-sans">
                      {item.year}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600 font-sans">
            <div className="text-center">
              <span className="font-semibold">Période couverte: </span>
              {monthlyData.length} mois
            </div>
            <div className="text-center">
              <span className="font-semibold">Revenu total: </span>
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(
                monthlyData.reduce((sum, item) => sum + item.total_revenue, 0)
              )}
            </div>
            <div className="text-center">
              <span className="font-semibold">Produits total: </span>
              {monthlyData.reduce((sum, item) => sum + item.total_products_sold, 0)}
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-white/20">
          <h4 className="font-bold text-slate-800 text-lg mb-6 font-sans">Indicateurs de performance</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 p-5 rounded-2xl border border-blue-200/50 backdrop-blur-sm">
              <div className="flex items-center mb-3">
                <Award className="text-blue-600 mr-2" size={20} />
                <h5 className="font-semibold text-blue-800 font-sans">Meilleur mois</h5>
              </div>
              {performanceData.performance_indicators.best_month ? (
                <div>
                  <p className="text-sm text-blue-700 font-sans">{performanceData.performance_indicators.best_month.month}</p>
                  <p className="text-xl font-bold text-blue-900 font-sans">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(performanceData.performance_indicators.best_month.total_revenue)}
                  </p>
                  <div className="flex justify-between mt-2 text-sm text-blue-700 font-sans">
                    <span>{performanceData.performance_indicators.best_month.total_products_sold} produits</span>
                    <span>{performanceData.performance_indicators.best_month.total_customers} clients</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-blue-500 font-sans">Aucune donnée</p>
              )}
            </div>
            
            <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 p-5 rounded-2xl border border-red-200/50 backdrop-blur-sm">
              <div className="flex items-center mb-3">
                <TargetIcon className="text-red-600 mr-2" size={20} />
                <h5 className="font-semibold text-red-800 font-sans">Moins bon mois</h5>
              </div>
              {performanceData.performance_indicators.worst_month ? (
                <div>
                  <p className="text-sm text-red-700 font-sans">{performanceData.performance_indicators.worst_month.month}</p>
                  <p className="text-xl font-bold text-red-900 font-sans">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(performanceData.performance_indicators.worst_month.total_revenue)}
                  </p>
                  <div className="flex justify-between mt-2 text-sm text-red-700 font-sans">
                    <span>{performanceData.performance_indicators.worst_month.total_products_sold} produits</span>
                    <span>{performanceData.performance_indicators.worst_month.total_customers} clients</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-red-500 font-sans">Aucune donnée</p>
              )}
            </div> 
          </div>
        </div>
      </div>
    );
  };

  const renderPurchasesList = () => {
    if (!selectedVendor?.purchases || selectedVendor.purchases.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border border-white/20 p-8 text-center backdrop-blur-sm">
          <ShoppingBag className="text-blue-400 mb-4" size={48} />
          <p className="text-slate-700 font-medium font-sans">Aucun achat enregistré pour ce vendeur</p>
          <p className="text-slate-500 text-sm mt-2 font-sans">Les achats apparaîtront ici une fois enregistrés</p>
        </div>
      );
    }

    const uniqueTypes = Array.from(new Set(selectedVendor.purchases.map(p => p.pushcard_type)));
    const filteredPurchases = purchaseFilterType === 'all' 
      ? selectedVendor.purchases 
      : selectedVendor.purchases.filter(p => p.pushcard_type === purchaseFilterType);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentPurchases = filteredPurchases.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    const goToPreviousPage = () => {
      if (currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    };

    const goToNextPage = () => {
      if (currentPage < totalPages) {
        setCurrentPage(currentPage + 1);
      }
    };

    return (
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white/80 backdrop-blur-xl p-4 rounded-2xl border border-white/20 shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-3 md:mb-0">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-slate-700 font-sans">Filtrer par type:</label>
              <select
                value={purchaseFilterType}
                onChange={(e) => {
                  setPurchaseFilterType(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-white/20 bg-white/50 backdrop-blur-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
              >
                <option value="all">Tous les types</option>
                {uniqueTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-slate-700 font-sans">Afficher:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-white/20 bg-white/50 backdrop-blur-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>
          
          <div className="text-sm bg-blue-500/10 text-blue-700 px-3 py-1 rounded-full font-sans backdrop-blur-sm">
            {filteredPurchases.length} achat(s) au total
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/20">
              <thead className="bg-slate-50/80 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider font-sans">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider font-sans">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider font-sans">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider font-sans">
                    Zone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider font-sans">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider font-sans">
                    Photo
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/50 divide-y divide-white/20 backdrop-blur-sm">
                {currentPurchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-white/70 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-slate-900 font-sans">
                          {purchase.first_name} {purchase.last_name}
                        </div>
                        <div className="text-sm text-slate-500 font-sans">
                          {purchase.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900 font-sans">
                        {new Date(purchase.purchase_date).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="text-xs text-slate-500 font-sans">
                        {new Date(purchase.purchase_date).toLocaleTimeString('fr-FR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-500/10 text-blue-800 rounded-full font-sans backdrop-blur-sm">
                        {purchase.pushcard_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900 font-sans">{purchase.zone}</div>
                      <div className="text-xs text-slate-500 font-sans">{purchase.base}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-emerald-600 font-sans">
                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(parseFloat(purchase.amount))}
                      </div>
                      {purchase.sales_total && (
                        <div className="text-xs text-blue-600 font-sans">
                          Ventes: {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(parseFloat(purchase.sales_total))}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {purchase.photo ? (
                        <div className="h-10 w-10 rounded-xl overflow-hidden bg-slate-100 shadow-sm backdrop-blur-sm">
                          <img 
                            src={`https://api.pushtrack360.com${purchase.photo}`}  
                            alt={`Achat ${purchase.id}`}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-sans">Aucune</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 bg-slate-50/80 backdrop-blur-sm border-t border-white/20 flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
            <div className="text-sm text-slate-500 font-sans">
              Affichage de <span className="font-medium">{indexOfFirstItem + 1}</span> à{' '}
              <span className="font-medium">
                {Math.min(indexOfLastItem, filteredPurchases.length)}
              </span> sur{' '}
              <span className="font-medium">{filteredPurchases.length}</span> achat(s)
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="p-2 border border-white/20 bg-white/50 backdrop-blur-sm rounded-xl text-slate-700 hover:bg-white/70 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="flex space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => paginate(page)}
                    className={`min-w-[40px] px-3 py-2 text-sm font-medium rounded-xl transition-colors font-sans backdrop-blur-sm ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/50 text-slate-700 border border-white/20 hover:bg-white/70'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="p-2 border border-white/20 bg-white/50 backdrop-blur-sm rounded-xl text-slate-700 hover:bg-white/70 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {filteredPurchases.length === 0 && purchaseFilterType !== 'all' && (
          <div className="bg-yellow-500/10 border border-yellow-200/50 rounded-2xl p-4 backdrop-blur-sm">
            <p className="text-yellow-800 font-sans">
              Aucun achat trouvé pour le type "{purchaseFilterType}"
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderVendorDetails = () => {
    if (!selectedVendor) return null;

    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6">
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-4 mb-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-slate-800 text-lg font-sans">Filtres de période</h4>
            <Filter size={20} className="text-slate-500" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 font-sans">
                Date de début
              </label>
              <input
                type="date"
                name="startDate"
                value={dateFilter.startDate}
                onChange={handleDateFilterChange}
                className="w-full border border-white/20 bg-white/50 backdrop-blur-sm rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 font-sans">
                Date de fin
              </label>
              <input
                type="date"
                name="endDate"
                value={dateFilter.endDate}
                onChange={handleDateFilterChange}
                className="w-full border border-white/20 bg-white/50 backdrop-blur-sm rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans"
              />
            </div>
            
            <div className="flex items-end space-x-2">
              <button
                onClick={applyDateFilter}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-sans"
              >
                Appliquer
              </button>
              <button
                onClick={resetDateFilter}
                className="bg-white/50 backdrop-blur-sm text-slate-700 px-4 py-2 rounded-xl border border-white/20 hover:bg-white/70 transition-colors font-sans"
              >
                Réinitialiser
              </button>
            </div>
          </div>
          
          <div className="mt-3 text-sm text-slate-500 font-sans">
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
                className="mr-4 text-slate-500 hover:text-slate-700 p-1 rounded-full hover:bg-white/50 transition-colors backdrop-blur-sm"
              >
                <ChevronLeft size={24} />
              </button>

              {isEditing ? (
                <h2 className="text-2xl font-bold text-slate-800 font-sans">Modifier le vendeur</h2>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 font-sans">{selectedVendor.first_name} {selectedVendor.last_name}</h2>
                  <p className="text-slate-600 font-sans">
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
                className="p-2 text-blue-600 hover:text-blue-900 bg-blue-500/10 rounded-xl hover:bg-blue-500/20 transition-colors backdrop-blur-sm"
                title="Modifier"
              >
                <Edit size={18} />
              </button>
              <button
                onClick={() => deleteVendor(selectedVendor.id)}
                className="p-2 text-red-600 hover:text-red-900 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-colors backdrop-blur-sm"
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
            <div className="flex justify-end space-x-4 pt-6 border-t border-white/20">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setPhotoPreview(null);
                }}
                className="px-5 py-2.5 border border-white/20 bg-white/50 backdrop-blur-sm rounded-xl text-sm font-medium text-slate-700 hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors font-sans"
              >
                Annuler
              </button>
              <button
                onClick={updateVendor}
                className="px-5 py-2.5 border border-transparent rounded-xl text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 flex items-center font-sans shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Save size={18} className="mr-2" />
                Enregistrer
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center space-x-3 mb-6">
              <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${getStatusColor(selectedVendor.status)} font-sans backdrop-blur-sm`}>
                {selectedVendor.status}
              </span>
              {selectedVendor.is_approved && (
                <span className="px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-blue-500/10 to-blue-600/10 text-blue-800 rounded-full border border-blue-300/50 font-sans backdrop-blur-sm">
                  Approuvé
                </span>
              )}
              <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${getPerformanceColor(selectedVendor.performance)} font-sans backdrop-blur-sm`}>
                Performance: {selectedVendor.performance}%
              </span>
            </div>

            {renderStatsCards(true)}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="border border-white/20 rounded-2xl p-5 bg-gradient-to-br from-slate-50/80 to-white/80 shadow-lg backdrop-blur-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center font-sans">
                  <UserRound className="mr-2 text-blue-500" size={18} />
                  Informations Personnelles
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Phone className="text-slate-500 mr-3" size={16} />
                    <span className="text-sm font-sans">{selectedVendor.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="text-slate-500 mr-3" size={16} />
                    <span className="text-sm font-sans">{selectedVendor.email || 'Non spécifié'}</span>
                  </div>
                  <div className="flex items-center">
                    <Bike className="text-slate-500 mr-3" size={16} />
                    <span className="text-sm capitalize font-sans">{selectedVendor.vehicle_type}</span>
                    {selectedVendor.vehicle_id && (
                      <span className="text-sm ml-2 font-sans">({selectedVendor.vehicle_id})</span>
                    )}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="text-slate-500 mr-3" size={16} />
                    <span className="text-sm font-sans">
                      Membre depuis {new Date(selectedVendor.date_joined).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="border border-white/20 rounded-2xl p-5 bg-gradient-to-br from-slate-50/80 to-white/80 shadow-lg backdrop-blur-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center font-sans">
                  <MapPin className="mr-2 text-emerald-500" size={18} />
                  Zone d'Activité
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedVendor.zones.map((zone, i) => (
                    <span key={i} className="px-3 py-1.5 text-xs bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 text-emerald-800 rounded-full flex items-center border border-emerald-200/50 font-sans backdrop-blur-sm">
                      <MapPin className="mr-1" size={12} />
                      {zone}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="border border-white/20 rounded-2xl p-5 bg-gradient-to-br from-slate-50/80 to-white/80 shadow-lg backdrop-blur-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center font-sans">
                  <BarChart3 className="mr-2 text-purple-500" size={18} />
                  Statistiques
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 font-sans">Ventes moyennes/jour:</span>
                    <span className="text-sm font-medium text-blue-600 font-sans">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(selectedVendor.average_daily_sales)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 font-sans">Dernière activité:</span>
                    <span className="text-sm font-medium text-slate-900 font-sans">
                      {selectedVendor.last_activity ? 
                        new Date(selectedVendor.last_activity).toLocaleString('fr-FR') : 
                        'Inconnue'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 font-sans">Point de vente:</span>
                    <span className="text-sm font-medium text-slate-900 font-sans">{selectedVendor.point_of_sale_name || 'Non assigné'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 font-sans">Quantité en stock:</span>
                    <span className="text-sm font-medium text-blue-600 font-sans">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(selectedVendor.average_daily_sales)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Navigation des onglets */}
            <div className="border-b border-white/20 mb-6">
              <nav className="-mb-px flex space-x-8 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('activities')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm font-sans transition-colors ${
                    activeTab === 'activities'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  Activités Récentes
                </button>
                <button
                  onClick={() => setActiveTab('performance')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm font-sans transition-colors ${
                    activeTab === 'performance'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  Performance
                </button>
                <button
                  onClick={() => setActiveTab('purchases')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm font-sans transition-colors ${
                    activeTab === 'purchases'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  Pushcart ({selectedVendor.purchases?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('map')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm font-sans transition-colors ${
                    activeTab === 'map'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Map className="inline mr-1" size={16} />
                  Carte ({sales.filter(s => s.latitude && s.longitude).length})
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm font-sans transition-colors ${
                    activeTab === 'notes'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
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
                    <div key={activity.id} className="p-4 border border-white/20 rounded-2xl bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-colors shadow-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-slate-800 font-sans">{activity.activity_type}</p>
                          <p className="text-sm text-slate-600 font-sans">
                            {new Date(activity.timestamp).toLocaleString('fr-FR')}
                          </p>
                        </div>
                        {activity.location && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-800 font-sans backdrop-blur-sm">
                            <MapPin size={12} className="mr-1" />
                            Localisé
                          </span>
                        )}
                      </div>
                      {activity.notes && (
                        <p className="mt-2 text-sm text-slate-700 font-sans">{activity.notes}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border border-white/20 backdrop-blur-sm">
                    <Clock className="text-blue-400 mb-4" size={40} />
                    <p className="text-slate-700 font-medium font-sans">Aucune activité récente</p>
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
            
            {activeTab === 'map' && (
              <div className="space-y-4">
                {loadingSales ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <SalesMap sales={sales} />
                )}
              </div>
            )}
            
            {activeTab === 'notes' && (
              <div className="space-y-4">
                {selectedVendor.notes ? (
                  <div className="p-5 bg-gradient-to-br from-slate-50/80 to-blue-50/80 rounded-2xl border border-white/20 backdrop-blur-sm">
                    <p className="text-slate-800 whitespace-pre-line font-sans">{selectedVendor.notes}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border border-white/20 backdrop-blur-sm">
                    <Edit className="text-blue-400 mb-4" size={40} />
                    <p className="text-slate-700 font-medium font-sans">Aucune note pour ce vendeur</p>
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
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/20">
          <thead className="bg-slate-50/80 backdrop-blur-sm">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider font-sans">Vendeur</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider font-sans">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider font-sans">Zones</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider font-sans">Statut</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider font-sans">Performance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider font-sans">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white/50 divide-y divide-white/20 backdrop-blur-sm">
            {filteredVendors.length > 0 ? (
              filteredVendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-white/70 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 border-2 border-white shadow-lg backdrop-blur-sm">
                        {vendor.photo ? (
                          <img 
                            src={vendor.photo} 
                            alt={`${vendor.first_name} ${vendor.last_name}`} 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-600 font-medium font-sans">
                            {vendor.first_name.charAt(0)}{vendor.last_name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-slate-900 font-sans">{vendor.first_name} {vendor.last_name}</div>
                        <div className="text-sm text-slate-500 capitalize font-sans">{vendor.vehicle_type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900 font-sans">{vendor.phone}</div>
                    <div className="text-sm text-slate-500 font-sans">{vendor.email || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {vendor.zones.slice(0, 2).map((zone, i) => (
                        <span key={i} className="px-2 py-1 text-xs bg-slate-500/10 rounded-full font-sans backdrop-blur-sm">
                          {zone}
                        </span>
                      ))}
                      {vendor.zones.length > 2 && (
                        <span className="px-2 py-1 text-xs bg-slate-500/10 rounded-full font-sans backdrop-blur-sm">+{vendor.zones.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(vendor.status)}
                      <span className="ml-2 capitalize font-sans">{vendor.status}</span>
                      {vendor.is_approved && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-500/10 text-blue-800 rounded-full font-sans backdrop-blur-sm">Approuvé</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full bg-slate-200 rounded-full h-2.5 backdrop-blur-sm">
                        <div 
                          className={`h-2.5 rounded-full ${getPerformanceColor(vendor.performance)}`} 
                          style={{ width: `${vendor.performance}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm font-medium font-sans">{vendor.performance}%</span>
                      <button
                        onClick={() => updateVendorPerformance(vendor.id, performanceDays)}
                        disabled={updatingPerformance === vendor.id}
                        className="ml-2 p-1 text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Mettre à jour la performance"
                      >
                        {updatingPerformance === vendor.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-600"></div>
                        ) : (
                          <RefreshCw size={14} />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => viewVendorDetails(vendor)}
                      className="text-blue-600 hover:text-blue-900 mr-3 font-medium font-sans"
                    >
                      Détails
                    </button>
                    <button className="text-slate-600 hover:text-slate-900 p-1 rounded hover:bg-white/50 transition-colors backdrop-blur-sm">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <UserRound className="text-slate-400 mb-2" size={40} />
                    <p className="text-slate-500 font-medium font-sans">
                      {searchTerm ? 'Aucun vendeur trouvé' : 'Aucun vendeur enregistré'}
                    </p>
                    {!searchTerm && (
                      <button 
                        className="mt-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center font-sans shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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
        <div className="px-6 py-3 bg-slate-50/80 backdrop-blur-sm border-t border-white/20 flex items-center justify-between">
          <div className="text-sm text-slate-500 font-sans">
            Affichage <span className="font-medium">1</span> à <span className="font-medium">{filteredVendors.length}</span> sur{' '}
            <span className="font-medium">{vendors.length}</span> résultats
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1 border border-white/20 bg-white/50 backdrop-blur-sm rounded-xl text-sm text-slate-700 hover:bg-white/70 disabled:opacity-50 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button className="px-3 py-1 border border-white/20 bg-white/50 backdrop-blur-sm rounded-xl text-sm text-slate-700 hover:bg-white/70 disabled:opacity-50 transition-colors">
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
          <h1 className="text-2xl font-bold text-slate-800 font-sans">Gestion des Commerciaux Terrain</h1>
          <p className="text-slate-600 font-sans">
            {selectedPOS?.pos_name || "Tous les commerciaux terrain"}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-slate-400" size={18} />
            </div>
            <input
              type="text"
              placeholder="Rechercher commerciaux..."
              className="pl-10 pr-4 py-3 w-full border border-white/20 bg-white/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg font-sans"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button 
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-sans font-medium"
            onClick={() => {
              setShowCreateForm(true);
              setShowVendorDetails(false);
              setNewVendor(getDefaultVendorForm(selectedPOS));
            }}
          >
            <Plus size={18} className="mr-2" />
            Nouveau Commercial
          </button>
        </div>
      </div>

      {error && renderError()}

      {!showVendorDetails && renderPerformanceUpdateSection()}

      {renderStatsCards(showVendorDetails)}

      {showCreateForm && (
        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-white/20">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800 font-sans">Ajouter un nouveau commercial</h2>
            <button 
              onClick={() => {
                setShowCreateForm(false);
                setPhotoPreview(null);
              }}
              className="text-slate-500 hover:text-slate-700 p-1 rounded-full hover:bg-white/50 transition-colors backdrop-blur-sm"
            >
              <X size={20} />
            </button>
          </div>
          {renderVendorForm()}
          <div className="mt-6 flex justify-end space-x-4 pt-6 border-t border-white/20">
            <button
              onClick={() => {
                setShowCreateForm(false);
                setPhotoPreview(null);
              }}
              className="px-5 py-2.5 border border-white/20 bg-white/50 backdrop-blur-sm rounded-xl text-sm font-medium text-slate-700 hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors font-sans"
            >
              Annuler
            </button>
            <button
              onClick={createVendor}
              className="px-5 py-2.5 border border-transparent rounded-xl text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 font-sans shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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