"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Home, MapPin, Package, ShoppingCart, Users, Coins, 
  Scale, BarChart3, Map, Settings, Menu, Bell, Search, Truck,
  ChevronDown, LogOut, Plus, AlertTriangle, Clock, CheckCircle, Loader2, ChevronsUpDown, UserRound, Bike,
  X, TrendingUp, TrendingDown, Eye, MoreHorizontal,
  Building2, Smartphone, Mail, Calendar, Target, ArrowUpRight,
  Shield, Zap, Globe, Activity, CreditCard, PieChart,
  Crown, Sparkles, Rocket, BarChart
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { apiService } from './ApiService';
import StockManagement from './StockManagement';
import OrderManagement from './OrderManagement';
import PointsVenteManagement from './PointsVenteManagement';
import UserManagement from './UserManagement';
import MobileVendorsManagement from './MobileVendorsManagement';
import ParametresManagement from './ParametresManagement';
import MapComponent from './MapComponent';
import PushcartManagement from './PushcartManagement';
import StatisticsDashboard from './StatisticsDashboard';

export interface Notification {
  id: number;
  type: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

export interface StatItem {
  icon: string;
  title: string;
  value: string;
  change: string;
  color: string;
}

export interface ActivityItem {
  icon: string;
  action: string;
  user: string;
  time: string;
  color: string;
}

export interface AlertItem {
  icon: string;
  type: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
}

export interface POSData {
  pos_id: number | null;
  pos_name: string;
  stats: StatItem[];
  recent_activities: ActivityItem[];
  alerts: AlertItem[];
}

export interface DashboardData {
  cumulative: POSData;
  pos_data: POSData[];
}

export interface User {
  id: string;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  profile?: {
    role: {
      name: string;
    };
    phone?: string;
    location?: string;
    points_of_sale?: string[];
  };
}

const iconComponents: Record<string, React.ComponentType<any>> = {
  MapPin,
  ShoppingCart,
  Coins,
  Users,
  AlertTriangle,
  CheckCircle,
  UserRound,
  Bike,
  TrendingUp,
  TrendingDown,
  Package,
  BarChart3,
  Truck,
  Activity,
  CreditCard,
  Target,
  Crown,
  Rocket,
  BarChart
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    cumulative: {
      pos_id: null,
      pos_name: "Vue d'ensemble",
      stats: [],
      recent_activities: [],
      alerts: []
    },
    pos_data: []
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, logout } = useAuth();
  const router = useRouter();
  const [selectedPOS, setSelectedPOS] = useState<POSData | null>(null);
  const [posDropdownOpen, setPosDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>('');

  // Récupérer les informations détaillées de l'utilisateur connecté
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('access');
        if (!token) {
          console.warn('No access token found');
          return;
        }

        const response = await fetch('https://api.lanfialink.com/api/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          setCurrentUser(userData);
          setUserRole(userData.profile?.role?.name || '');
        } else {
          console.error('Failed to fetch user data');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkAuth = async () => {
      const token = localStorage.getItem('access');
      if (!token) {
        console.warn('No access token found, redirecting to login');
        router.push('/login');
        return;
      }
      
      try {
        const response = await apiService.get('/dashboard/');
        if (!response.ok) {
          throw new Error(`Failed to fetch dashboard data: ${response.status}`);
        }
        const data: DashboardData = await response.json();
        setDashboardData(data);
        setSelectedPOS(data.cumulative);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Session invalide ou erreur serveur. Veuillez vous reconnecter.');
        logout();
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [router, logout]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const fetchNotifications = async () => {
      const token = localStorage.getItem('access');
      if (!token) return;
      
      try {
        const response = await apiService.get('/notifications/');
        if (!response.ok) {
          if (response.status === 401) {
            console.warn('Unauthorized, logging out');
            logout();
            router.push('/login');
            return;
          }
          throw new Error(`Failed to fetch notifications: ${response.status}`);
        }
        const data: Notification[] = await response.json();
        setNotifications(data.map((n: Notification) => ({
          id: n.id,
          type: n.type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
          message: n.message,
          created_at: n.created_at,
          is_read: n.is_read
        })));
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError('Erreur lors du chargement des notifications');
      }
    };
    fetchNotifications();
  }, [router, logout]);

  const unreadNotifications = notifications.filter(n => !n.is_read).length;

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diff < 60) return `${diff} min`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}j`;
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getCurrentData = (): POSData => {
    if (!selectedPOS) return dashboardData.cumulative;
    if (selectedPOS.pos_id === null) return dashboardData.cumulative;
    return dashboardData.pos_data.find(pos => pos.pos_id === selectedPOS.pos_id) || dashboardData.cumulative;
  };

  const getUserInitials = () => {
    if (currentUser?.first_name && currentUser?.last_name) {
      return `${currentUser.first_name[0]}${currentUser.last_name[0]}`.toUpperCase();
    }
    if (currentUser?.username) {
      return currentUser.username.slice(0, 2).toUpperCase();
    }
    if (currentUser?.email) {
      return currentUser.email.slice(0, 2).toUpperCase();
    }
    return 'AU';
  };

  const getUserDisplayName = () => {
    if (currentUser?.first_name && currentUser?.last_name) {
      return `${currentUser.first_name} ${currentUser.last_name}`;
    }
    if (currentUser?.username) {
      return currentUser.username;
    }
    if (currentUser?.email) {
      return currentUser.email;
    }
    return 'Utilisateur';
  };

  const getUserRoleDisplay = () => {
    return currentUser?.profile?.role?.name || userRole || 'Utilisateur';
  };

  const getUserLocation = () => {
    return currentUser?.profile?.location || 'Non spécifié';
  };

  const getUserPointsOfSale = () => {
    return currentUser?.profile?.points_of_sale || [];
  };

  // Définir les menus en fonction du rôle
  const getMenuItems = () => {
    const allMenuItems = [
      { id: 'dashboard', icon: Home, label: 'Tableau de bord', color: 'text-blue-600', badge: null },
      { id: 'points-vente', icon: MapPin, label: 'Points de vente', color: 'text-green-600', badge: null },
      { id: 'vendeurs-ambulants', icon: Bike, label: 'Commerciaux', color: 'text-amber-600', badge: '12' },
      { id: 'Pushcart', icon: Truck, label: 'Prospects', color: 'text-purple-600', badge: '24' },
      { id: 'stocks', icon: Package, label: 'Inventaire', color: 'text-orange-600', badge: '3' },
      { id: 'commandes', icon: ShoppingCart, label: 'Commandes', color: 'text-indigo-600', badge: '45' },
      { id: 'utilisateurs', icon: Users, label: 'Utilisateurs', color: 'text-pink-600', badge: null },
      { id: 'statistiques', icon: BarChart3, label: 'Analytiques', color: 'text-teal-600', badge: 'PRO' },
      { id: 'cartes', icon: Map, label: 'Géolocalisation', color: 'text-cyan-600', badge: null },
      { id: 'parametres', icon: Settings, label: 'Configuration', color: 'text-gray-600', badge: null }
    ];

    // Si l'utilisateur est SuperU, afficher tous les menus
    if (userRole === 'SuperU') {
      return allMenuItems;
    }

    // Sinon, afficher seulement les menus spécifiés
    const allowedMenuItems = ['dashboard', 'vendeurs-ambulants', 'Pushcart', 'statistiques', 'cartes'];
    return allMenuItems.filter(item => allowedMenuItems.includes(item.id));
  };

  const menuItems = getMenuItems();

  const DashboardContent = () => {
    const currentData = getCurrentData();
    
    // Actions rapides - seulement pour SuperU
    const quickActions = [
      { 
        icon: Plus, 
        label: 'Nouveau point de vente', 
        color: 'from-green-500 to-emerald-600',
        gradient: 'bg-gradient-to-r from-green-500 to-emerald-600',
        onClick: () => setActiveTab('points-vente')
      },
      { 
        icon: Package, 
        label: 'Gérer stock', 
        color: 'from-orange-500 to-amber-600',
        gradient: 'bg-gradient-to-r from-orange-500 to-amber-600',
        onClick: () => setActiveTab('stocks')
      },
      { 
        icon: ShoppingCart, 
        label: 'Nouvelle commande', 
        color: 'from-purple-500 to-violet-600',
        gradient: 'bg-gradient-to-r from-purple-500 to-violet-600',
        onClick: () => setActiveTab('commandes')
      },
      { 
        icon: BarChart3, 
        label: 'Voir rapports', 
        color: 'from-indigo-500 to-blue-600',
        gradient: 'bg-gradient-to-r from-indigo-500 to-blue-600',
        onClick: () => setActiveTab('statistiques')
      }
    ];

    // Stats par défaut si aucune donnée
    const defaultStats = [
      { icon: 'ShoppingCart', title: 'Commandes du jour', value: '0', change: '+0%', color: 'blue' },
      { icon: 'Coins', title: 'Chiffre d\'affaires', value: '0 FCFA', change: '+0%', color: 'green' },
      { icon: 'Package', title: 'Stock disponible', value: '0 unités', change: '+0%', color: 'orange' },
      { icon: 'Users', title: 'Commerciaux actifs', value: '0', change: '+0%', color: 'purple' }
    ];

    const displayStats = currentData.stats.length > 0 ? currentData.stats : defaultStats;
    
    return (
      <div className="space-y-8">
        {error && (
          <div className="p-6 bg-gradient-to-r from-red-500/10 to-red-600/10 backdrop-blur-xl border border-red-500/20 rounded-2xl flex items-center">
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mr-4">
              <AlertTriangle className="text-red-400" size={24} />
            </div>
            <div>
              <p className="text-red-800 font-semibold">Erreur de chargement</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* En-tête personnalisé avec les informations de l'utilisateur */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden border border-white/10">
          {/* Background Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/20 to-purple-500/20 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 rounded-full translate-y-24 -translate-x-24"></div>
          <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-6">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg border border-white/20">
                      <UserRound className="text-white" size={28} />
                    </div>
                    {userRole === 'SuperU' && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                        <Crown size={12} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold mb-2 font-sans bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                      Bon retour, {getUserDisplayName()} 👋
                    </h1>
                    <p className="text-blue-100/90 text-lg font-light">
                      {selectedPOS?.pos_name === "Vue d'ensemble" 
                        ? "Aperçu global de votre réseau commercial" 
                        : `Activité du point de vente: ${selectedPOS?.pos_name}`}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3 mb-6">
                  <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/20">
                    <Building2 size={18} className="mr-2 text-blue-300" />
                    <span className="font-medium text-white/90">{getUserRoleDisplay()}</span>
                  </div>
                  <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/20">
                    <MapPin size={18} className="mr-2 text-green-300" />
                    <span className="font-medium text-white/90">{getUserLocation()}</span>
                  </div>
                  <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/20">
                    <Calendar size={18} className="mr-2 text-amber-300" />
                    <span className="font-medium text-white/90">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                </div>
              </div>
              
              {/* Badge du rôle */}
              <div className="mt-6 lg:mt-0">
                <div className="bg-white/20 backdrop-blur-xl rounded-2xl px-6 py-4 inline-flex items-center border border-white/30 shadow-lg">
                  <div className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full mr-3 animate-pulse shadow-lg"></div>
                  <div>
                    <span className="font-semibold text-white block">{getUserRoleDisplay()}</span>
                    <span className="text-white/70 text-sm">Connecté</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-sm">Performance</span>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                </div>
                <div className="text-white font-semibold text-lg mt-2">98.2%</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-sm">Temps réponse</span>
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                </div>
                <div className="text-white font-semibold text-lg mt-2">47ms</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-sm">Sessions actives</span>
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                </div>
                <div className="text-white font-semibold text-lg mt-2">24</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-sm">Uptime</span>
                  <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                </div>
                <div className="text-white font-semibold text-lg mt-2">99.9%</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayStats.map((stat, index) => {
            const IconComponent = iconComponents[stat.icon] || BarChart3;
            const isPositive = stat.change.startsWith('+');
            const colorMap = {
              blue: { 
                gradient: 'from-blue-500 to-cyan-500', 
                bg: 'bg-blue-50', 
                text: 'text-blue-600',
                light: 'bg-blue-500/10'
              },
              green: { 
                gradient: 'from-emerald-500 to-green-500', 
                bg: 'bg-emerald-50', 
                text: 'text-emerald-600',
                light: 'bg-emerald-500/10'
              },
              orange: { 
                gradient: 'from-orange-500 to-amber-500', 
                bg: 'bg-orange-50', 
                text: 'text-orange-600',
                light: 'bg-orange-500/10'
              },
              purple: { 
                gradient: 'from-purple-500 to-violet-500', 
                bg: 'bg-purple-50', 
                text: 'text-purple-600',
                light: 'bg-purple-500/10'
              }
            };
            const colors = colorMap[stat.color as keyof typeof colorMap] || colorMap.blue;
            
            return (
              <div key={index} className="group bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 p-6 relative overflow-hidden">
                {/* Background Gradient */}
                <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${colors.gradient} opacity-5 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-500`}></div>
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-2xl ${colors.light} ${colors.text} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent size={24} />
                    </div>
                    {stat.change && (
                      <div className={`flex items-center text-sm font-semibold px-3 py-1 rounded-full backdrop-blur-sm ${
                        isPositive ? 'bg-emerald-500/20 text-emerald-700' : 'bg-red-500/20 text-red-700'
                      }`}>
                        {isPositive ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                        {stat.change}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-2">{stat.title}</p>
                    <p className="text-2xl font-bold text-slate-800 font-sans tracking-tight">{stat.value}</p>
                  </div>
                  
                  {/* View Details Link */}
                  <button className="mt-4 flex items-center text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors group/link">
                    <span>Voir détails</span>
                    <ArrowUpRight size={14} className="ml-1 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Section Actions Rapides - Uniquement pour SuperU */}
        {userRole === 'SuperU' && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-white/20 p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-bold text-slate-800 font-sans">Actions Rapides</h3>
                <p className="text-slate-600 text-lg mt-2">Accédez rapidement aux fonctionnalités principales</p>
              </div>
              <button className="text-blue-600 text-sm font-semibold flex items-center hover:text-blue-700 transition-colors group">
                Voir plus <ChevronDown size={16} className="ml-1 group-hover:translate-y-0.5 transition-transform" />
              </button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action, index) => (
                <button 
                  key={index} 
                  onClick={action.onClick}
                  className={`${action.gradient} text-white p-6 rounded-2xl transition-all duration-300 hover:shadow-2xl flex flex-col items-center space-y-4 group transform hover:-translate-y-2 active:scale-95 relative overflow-hidden`}
                >
                  {/* Background Effect */}
                  <div className="absolute inset-0 bg-white/10 transform scale-0 group-hover:scale-100 transition-transform duration-500"></div>
                  
                  <div className="p-4 bg-white/20 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg relative z-10">
                    <action.icon size={28} />
                  </div>
                  <span className="text-sm font-semibold text-center leading-tight relative z-10">{action.label}</span>
                  
                  {/* Hover Effect */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Activités récentes */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-white/20 p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-bold text-slate-800 font-sans">Activités Récentes</h3>
                <p className="text-slate-600 text-lg mt-2">Dernières actions sur la plateforme</p>
              </div>
              <button className="text-blue-600 text-sm font-semibold hover:text-blue-700 transition-colors flex items-center group">
                Voir tout <ArrowUpRight size={14} className="ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
            <div className="space-y-4">
              {currentData.recent_activities.length > 0 ? (
                currentData.recent_activities.map((activity, index) => {
                  const IconComponent = iconComponents[activity.icon] || Activity;
                  return (
                    <div key={index} className="flex items-start p-4 rounded-xl hover:bg-white/50 transition-all duration-200 group border border-transparent hover:border-white/20 backdrop-blur-sm">
                      <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 mr-4 group-hover:bg-blue-500/20 group-hover:scale-110 transition-all duration-300 shadow-sm">
                        <IconComponent size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{activity.action}</p>
                        <p className="text-sm text-slate-600 truncate">{activity.user}</p>
                      </div>
                      <div className="flex items-center text-xs text-slate-400 ml-2 bg-slate-100/50 px-3 py-2 rounded-full backdrop-blur-sm">
                        <Clock size={12} className="mr-1 flex-shrink-0" />
                        {activity.time}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-slate-100/50 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                    <Activity className="text-slate-400" size={32} />
                  </div>
                  <p className="text-lg font-medium text-slate-600 mb-2">Aucune activité récente</p>
                  <p className="text-sm text-slate-500 max-w-sm mx-auto">
                    Les activités de votre équipe apparaîtront ici lorsqu'elles utiliseront la plateforme.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Alertes importantes */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-white/20 p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-bold text-slate-800 font-sans">Alertes Importantes</h3>
                <p className="text-slate-600 text-lg mt-2">Notifications nécessitant votre attention</p>
              </div>
              <button className="text-blue-600 text-sm font-semibold hover:text-blue-700 transition-colors">
                Tout marquer comme lu
              </button>
            </div>
            <div className="space-y-4">
              {currentData.alerts.length > 0 ? (
                currentData.alerts.map((alert, index) => {
                  const IconComponent = iconComponents[alert.icon] || AlertTriangle;
                  const priorityColors = {
                    high: { 
                      border: 'border-red-200', 
                      bg: 'bg-red-50/80', 
                      text: 'text-red-700',
                      iconBg: 'bg-red-500/20 text-red-600',
                      accent: 'bg-red-500'
                    },
                    medium: { 
                      border: 'border-amber-200', 
                      bg: 'bg-amber-50/80', 
                      text: 'text-amber-700',
                      iconBg: 'bg-amber-500/20 text-amber-600',
                      accent: 'bg-amber-500'
                    },
                    low: { 
                      border: 'border-blue-200', 
                      bg: 'bg-blue-50/80', 
                      text: 'text-blue-700',
                      iconBg: 'bg-blue-500/20 text-blue-600',
                      accent: 'bg-blue-500'
                    }
                  };
                  const colors = priorityColors[alert.priority];
                  
                  return (
                    <div key={index} className={`p-4 rounded-xl border-l-4 flex items-start ${colors.border} ${colors.bg} backdrop-blur-sm transition-all hover:shadow-sm group`} style={{ borderLeftColor: colors.accent }}>
                      <div className={`p-3 rounded-2xl mr-4 ${colors.iconBg} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <div className="font-semibold text-sm text-slate-800">{alert.type}</div>
                          <div className={`w-2 h-2 rounded-full ml-2 ${colors.accent}`}></div>
                        </div>
                        <div className="text-sm text-slate-600 leading-relaxed">{alert.message}</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-slate-100/50 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                    <CheckCircle className="text-slate-400" size={32} />
                  </div>
                  <p className="text-lg font-medium text-slate-600 mb-2">Aucune alerte</p>
                  <p className="text-sm text-slate-500 max-w-sm mx-auto">
                    Toutes les opérations se déroulent normalement. Aucune intervention requise.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderActiveContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent />;
      case 'points-vente':
        return React.createElement(PointsVenteManagement as any, { selectedPOS });
      case 'stocks':
        return React.createElement(StockManagement as any, { selectedPOS });
      case 'commandes':
        return React.createElement(OrderManagement as any, { selectedPOS });
      case 'vendeurs-ambulants':
        return React.createElement(MobileVendorsManagement as any, { selectedPOS });
      case 'statistiques':
        return <StatisticsDashboard />;
      case 'utilisateurs':
        return React.createElement(UserManagement as any);
      case 'parametres':
        return <ParametresManagement />;
      case 'cartes':
        return <MapComponent />
      case 'Pushcart':
        return <PushcartManagement />
      default:
        return (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-white/20 p-12 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
              {menuItems.find(item => item.id === activeTab)?.icon && 
                React.createElement(menuItems.find(item => item.id === activeTab)!.icon, { 
                  size: 48, 
                  className: 'text-slate-400' 
                })
              }
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3 font-sans">
              {menuItems.find(item => item.id === activeTab)?.label}
            </h3>
            <p className="text-slate-600 max-w-md mx-auto text-lg leading-relaxed">
              Cette section est en cours de développement. Elle sera disponible dans la prochaine mise à jour.
            </p>
            <button 
              onClick={() => setActiveTab('dashboard')}
              className="mt-6 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Retour au tableau de bord
            </button>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="text-center">
            <span className="text-slate-700 font-semibold text-lg">Chargement du tableau de bord...</span>
            <p className="text-slate-500 text-sm mt-2">Préparation de votre espace de travail</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-10 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-1/2 -right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl shadow-2xl border-b border-white/20 p-4 flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={() => setMobileMenuOpen(true)} 
            className="mr-3 p-2 rounded-2xl hover:bg-white/50 transition-colors duration-200 backdrop-blur-sm"
          >
            <Menu size={24} className="text-slate-700" />
          </button>
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mr-3 shadow-lg">
              <Building2 className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 font-sans">LanfiaLink</h1>
              <p className="text-xs text-slate-500">Dashboard</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 text-slate-600 hover:text-slate-800 rounded-2xl transition-colors duration-200 relative hover:bg-white/50 backdrop-blur-sm"
          >
            <Bell size={20} />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold shadow-lg">
                {unreadNotifications}
              </span>
            )}
          </button>
          
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white font-semibold shadow-lg">
            {getUserInitials()}
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className={`hidden lg:block fixed inset-y-0 left-0 z-40 bg-white/95 backdrop-blur-xl shadow-2xl border-r border-white/20 transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'w-80' : 'w-20'
      }`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
            {sidebarOpen ? (
              <div className="flex items-center">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mr-3 backdrop-blur-sm border border-white/30">
                  <Building2 className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-xl font-bold font-sans">LanfiaLink</h1>
                  <p className="text-sm text-white/80">Panel d'administration</p>
                </div>
              </div>
            ) : (
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm border border-white/30">
                <Building2 className="text-white" size={24} />
              </div>
            )}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-2xl hover:bg-white/10 transition-colors duration-200"
            >
              <Menu size={20} />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-4 p-4 rounded-2xl transition-all duration-200 group ${
                  activeTab === item.id 
                    ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-600 border border-blue-500/20 shadow-lg' 
                    : 'text-slate-600 hover:bg-white/50 hover:text-slate-800 border border-transparent hover:border-white/20'
                } ${sidebarOpen ? 'justify-start' : 'justify-center'}`}
              >
                <div className="relative">
                  <item.icon size={22} className={`flex-shrink-0 ${activeTab === item.id ? item.color : 'text-slate-500 group-hover:text-slate-700'}`} />
                  {item.badge && (
                    <span className={`absolute -top-2 -right-2 text-xs px-1.5 py-0.5 rounded-full ${
                      item.badge === 'PRO' 
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' 
                        : 'bg-red-500 text-white'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </div>
                {sidebarOpen && (
                  <div className="flex-1 flex items-center justify-between">
                    <span className={`font-semibold ${activeTab === item.id ? 'text-blue-600' : 'text-slate-700'}`}>
                      {item.label}
                    </span>
                    {item.badge && item.badge !== 'PRO' && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-white/20 bg-white/50 backdrop-blur-sm">
            <div className={`flex items-center ${sidebarOpen ? 'space-x-3' : 'justify-center'} p-3 rounded-2xl bg-white/80 border border-white/20 backdrop-blur-sm`}>
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white font-semibold shadow-lg">
                  {getUserInitials()}
                </div>
                {userRole === 'SuperU' && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{getUserDisplayName()}</p>
                  <p className="text-xs text-slate-500 truncate">{currentUser?.email || 'admin@lanfiatech.com'}</p>
                  <p className="text-xs text-blue-600 font-semibold">{getUserRoleDisplay()}</p>
                </div>
              )}
              {sidebarOpen && (
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-2xl hover:bg-white transition-colors duration-200 flex-shrink-0"
                  title="Déconnexion"
                >
                  <LogOut size={20} className="text-slate-600" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={`transition-all duration-300 ease-in-out ${sidebarOpen ? 'lg:ml-80' : 'lg:ml-20'} lg:pt-0 pt-16`}>
        <header className="bg-white/95 backdrop-blur-xl shadow-lg border-b border-white/20 sticky top-0 z-10 hidden lg:block">
          <div className="flex items-center justify-between p-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 font-sans">
                {menuItems.find(item => item.id === activeTab)?.label || 'Tableau de bord'}
              </h2>
              <p className="text-slate-600 text-lg">
                {activeTab === 'dashboard' ? 'Aperçu global de votre activité' : 
                 `Gestion des ${menuItems.find(item => item.id === activeTab)?.label.toLowerCase()}`}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button 
                  onClick={() => setPosDropdownOpen(!posDropdownOpen)}
                  className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm hover:bg-white px-4 py-3 rounded-2xl transition-all duration-200 font-semibold border border-white/20 hover:border-white/40 shadow-sm"
                >
                  <MapPin size={18} className="text-slate-600" />
                  <span className="text-slate-700">{selectedPOS?.pos_name || 'Sélectionner POS'}</span>
                  <ChevronsUpDown size={16} className="text-slate-500" />
                </button>
                
                {posDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 z-20 overflow-hidden">
                    <div className="p-2 max-h-60 overflow-y-auto">
                      <button
                        onClick={() => {
                          setSelectedPOS(dashboardData.cumulative);
                          setPosDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-white/50 rounded-xl transition-colors duration-200 ${
                          selectedPOS?.pos_id === null ? 'bg-blue-500/10 text-blue-600 font-semibold border border-blue-500/20' : 'text-slate-700'
                        }`}
                      >
                        Vue d'ensemble
                      </button>
                      {dashboardData.pos_data.map(pos => (
                        <button
                          key={pos.pos_id}
                          onClick={() => {
                            setSelectedPOS(pos);
                            setPosDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-white/50 rounded-xl transition-colors duration-200 ${
                            selectedPOS?.pos_id === pos.pos_id ? 'bg-blue-500/10 text-blue-600 font-semibold border border-blue-500/20' : 'text-slate-700'
                          }`}
                        >
                          {pos.pos_name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="relative hidden md:block">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Rechercher..." 
                  className="pl-12 pr-4 py-3 w-80 border border-white/20 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 font-medium bg-white/50 backdrop-blur-sm placeholder-slate-400"
                />
              </div>
              
              <div className="relative">
                <button 
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-3 text-slate-600 hover:text-slate-800 hover:bg-white/50 rounded-2xl transition-all duration-200 relative border border-transparent hover:border-white/20 backdrop-blur-sm"
                >
                  <Bell size={20} />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold shadow-lg">
                      {unreadNotifications}
                    </span>
                  )}
                </button>
                
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 z-20 overflow-hidden">
                    <div className="p-4 border-b border-white/20 flex justify-between items-center bg-gradient-to-r from-slate-50 to-slate-100">
                      <h3 className="font-semibold text-slate-800 font-sans text-lg">Notifications</h3>
                      <button className="text-blue-600 text-sm font-semibold hover:text-blue-700 transition-colors">
                        Marquer tout comme lu
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map(notification => (
                          <div key={notification.id} className={`p-4 border-b border-white/20 hover:bg-white/50 transition-colors duration-200 ${
                            !notification.is_read ? 'bg-blue-500/10 border-l-4 border-l-blue-500' : ''
                          }`}>
                            <div className="flex justify-between items-start mb-2">
                              <p className="font-semibold text-slate-800 text-sm">{notification.type}</p>
                              <p className="text-xs text-slate-500 flex items-center bg-white/50 px-2 py-1 rounded-full backdrop-blur-sm">
                                <Clock size={12} className="mr-1" />
                                {formatTimeAgo(new Date(notification.created_at))}
                              </p>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed">{notification.message}</p>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center">
                          <Bell className="text-slate-400 mx-auto mb-3" size={32} />
                          <p className="text-slate-600 font-medium">Aucune notification</p>
                          <p className="text-slate-500 text-sm mt-1">Tout est à jour</p>
                        </div>
                      )}
                    </div>
                    <div className="p-4 text-center border-t border-white/20 bg-white/50">
                      <button className="text-blue-600 text-sm font-semibold hover:text-blue-700 transition-colors">
                        Voir toutes les notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-slate-800">{getUserDisplayName()}</p>
                  <p className="text-xs text-slate-500">{getUserRoleDisplay()}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white font-semibold shadow-lg">
                  {getUserInitials()}
                </div>
                <button 
                  onClick={handleLogout}
                  className="flex items-center text-slate-600 hover:text-slate-800 transition-colors duration-200 p-2 rounded-2xl hover:bg-white/50 backdrop-blur-sm"
                  title="Déconnexion"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6 lg:p-8">
          {renderActiveContent()}
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div className="fixed inset-y-0 left-0 w-80 bg-white/95 backdrop-blur-xl shadow-2xl border-r border-white/20" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mr-3 backdrop-blur-sm border border-white/30">
                  <Building2 className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-xl font-bold font-sans">LanfiaLink</h1>
                  <p className="text-sm text-white/80">Panel d'administration</p>
                </div>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-2xl hover:bg-white/10 transition-colors duration-200"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto h-[calc(100%-140px)]">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-4 p-4 rounded-2xl transition-all duration-200 ${
                    activeTab === item.id 
                      ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-600 border border-blue-500/20 shadow-lg' 
                      : 'text-slate-600 hover:bg-white/50 hover:text-slate-800 border border-transparent hover:border-white/20'
                  }`}
                >
                  <div className="relative">
                    <item.icon size={22} className={`flex-shrink-0 ${activeTab === item.id ? item.color : 'text-slate-500'}`} />
                    {item.badge && (
                      <span className={`absolute -top-2 -right-2 text-xs px-1.5 py-0.5 rounded-full ${
                        item.badge === 'PRO' 
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' 
                          : 'bg-red-500 text-white'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className={`font-semibold ${activeTab === item.id ? 'text-blue-600' : 'text-slate-700'}`}>
                      {item.label}
                    </span>
                    {item.badge && item.badge !== 'PRO' && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </nav>

            <div className="p-4 border-t border-white/20 bg-white/50 backdrop-blur-sm">
              <div className="flex items-center space-x-3 p-3 rounded-2xl bg-white/80 border border-white/20 backdrop-blur-sm">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white font-semibold shadow-lg">
                    {getUserInitials()}
                  </div>
                  {userRole === 'SuperU' && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{getUserDisplayName()}</p>
                  <p className="text-xs text-slate-500 truncate">{currentUser?.email || 'admin@lanfiatech.com'}</p>
                  <p className="text-xs text-blue-600 font-semibold">{getUserRoleDisplay()}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-2xl hover:bg-white transition-colors duration-200"
                  title="Déconnexion"
                >
                  <LogOut size={20} className="text-slate-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Notifications Panel */}
      {notificationsOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setNotificationsOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-96 bg-white/95 backdrop-blur-xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-white/20 flex justify-between items-center bg-gradient-to-r from-slate-900 to-slate-800 text-white">
              <h3 className="font-semibold font-sans text-lg">Notifications</h3>
              <button 
                className="p-2 rounded-2xl hover:bg-white/10 transition-colors duration-200"
                onClick={() => setNotificationsOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="h-full overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map(notification => (
                  <div key={notification.id} className={`p-4 border-b border-white/20 hover:bg-white/50 transition-colors duration-200 ${
                    !notification.is_read ? 'bg-blue-500/10 border-l-4 border-l-blue-500' : ''
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-semibold text-slate-800 text-sm">{notification.type}</p>
                      <p className="text-xs text-slate-500 flex items-center bg-white/50 px-2 py-1 rounded-full backdrop-blur-sm">
                        <Clock size={12} className="mr-1" />
                        {formatTimeAgo(new Date(notification.created_at))}
                      </p>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{notification.message}</p>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center h-full flex flex-col items-center justify-center">
                  <Bell className="text-slate-400 mb-4" size={48} />
                  <p className="text-slate-600 font-medium text-lg mb-2">Aucune notification</p>
                  <p className="text-slate-500">Tout est à jour dans votre espace</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;