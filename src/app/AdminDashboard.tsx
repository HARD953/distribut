"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Home, MapPin, Package, ShoppingCart, Users, Coins, 
  Scale, BarChart3, Map, Settings, Menu, Bell, Search,Truck,
  ChevronDown, LogOut, Plus, AlertTriangle, Clock, CheckCircle, Loader2, ChevronsUpDown, UserRound, Bike,
  X
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
import LocalisationManagement from './LocalisationManagement';

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
      id: number;
      name: string;
      description: string;
      color: string;
      permissions: Array<{
        id: number;
        name: string;
        category: string;
        description: string;
      }>;
      users: number;
      tableau: boolean;
      distributeurs: boolean;
      commerciaux: boolean;
      prospects: boolean;
      inventaire: boolean;
      commande: boolean;
      utilisateur: boolean;
      analytique: boolean;
      geolocalisation: boolean;
      configuration: boolean;
      positions: boolean;
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
  Bike
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    cumulative: {
      pos_id: null,
      pos_name: "Total Général",
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
  const [userPermissions, setUserPermissions] = useState({
    tableau: true, // Par défaut true pour voir les menus
    distributeurs: true,
    commerciaux: true,
    prospects: true,
    inventaire: true,
    commande: true,
    utilisateur: true,
    analytique: true,
    geolocalisation: true,
    configuration: true,
    positions:true
  });

  // Récupérer les informations détaillées de l'utilisateur connecté avec les permissions
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('access');
        if (!token) {
          console.warn('No access token found');
          return;
        }

        const response = await fetch('https://backendsupply.onrender.com/api/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const userDataArray = await response.json();
          console.log('User data from API:', userDataArray); // Debug log
          
          // L'API retourne un tableau, on prend le premier élément
          const userData = Array.isArray(userDataArray) ? userDataArray[0] : userDataArray;
          setCurrentUser(userData);
          
          if (userData.profile?.role) {
            const role = userData.profile.role;
            console.log('User role permissions:', role); // Debug log
            
            setUserRole(role.name || '');
            
            // Définir les permissions basées sur le rôle
            setUserPermissions({
              tableau: role.tableau ?? true,
              distributeurs: role.distributeurs ?? true,
              commerciaux: role.commerciaux ?? true,
              prospects: role.prospects ?? true,
              inventaire: role.inventaire ?? true,
              commande: role.commande ?? true,
              utilisateur: role.utilisateur ?? true,
              analytique: role.analytique ?? true,
              geolocalisation: role.geolocalisation ?? true,
              configuration: role.configuration ?? true,
              positions: role.positions ?? true,
            });
            
            console.log('Final permissions:', { // Debug log
              tableau: role.tableau ?? true,
              distributeurs: role.distributeurs ?? true,
              commerciaux: role.commerciaux ?? true,
              prospects: role.prospects ?? true,
              inventaire: role.inventaire ?? true,
              commande: role.commande ?? true,
              utilisateur: role.utilisateur ?? true,
              analytique: role.analytique ?? true,
              geolocalisation: role.geolocalisation ?? true,
              configuration: role.configuration ?? true,
              positions: role.positions ?? true,
            });
          }
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

  // Définir les menus en fonction des permissions
  const getMenuItems = () => {
    const allMenuItems = [
      { id: 'dashboard', icon: Home, label: 'Tableau de bord', color: 'text-blue-600', badge: null, permission: 'tableau' },
      { id: 'points-vente', icon: MapPin, label: 'Distributeurs', color: 'text-green-600', badge: null, permission: 'distributeurs' },
      { id: 'vendeurs-ambulants', icon: Bike, label: 'Commerciaux', color: 'text-amber-600', badge: '12', permission: 'commerciaux' },
      { id: 'Pushcart', icon: Truck, label: 'Prospects', color: 'text-purple-600', badge: '24', permission: 'prospects' },
      { id: 'stocks', icon: Package, label: 'Inventaire', color: 'text-orange-600', badge: '3', permission: 'inventaire' },
      { id: 'commandes', icon: ShoppingCart, label: 'Commandes', color: 'text-indigo-600', badge: '45', permission: 'commande' },
      { id: 'utilisateurs', icon: Users, label: 'Utilisateurs', color: 'text-pink-600', badge: null, permission: 'utilisateur' },
      { id: 'statistiques', icon: BarChart3, label: 'Analytiques', color: 'text-teal-600', badge: 'PRO', permission: 'analytique' },
      { id: 'cartes', icon: Map, label: 'Géolocalisation', color: 'text-cyan-600', badge: null, permission: 'geolocalisation' },
      { id: 'parametres', icon: Settings, label: 'Configuration', color: 'text-gray-600', badge: null, permission: 'configuration' },
      { id: 'positions', icon: MapPin, label: 'Decoupage', color: 'text-blue-600', badge: null, permission: 'positions' }
    ];

    // Filtrer les menus selon les permissions
    const filteredItems = allMenuItems.filter(item => {
      const hasPermission = userPermissions[item.permission as keyof typeof userPermissions];
      console.log(`Menu ${item.label}: ${hasPermission}`); // Debug log
      return hasPermission;
    });

    console.log('Filtered menu items:', filteredItems); // Debug log
    return filteredItems;
  };

  const menuItems = getMenuItems();

  const DashboardContent = () => {
    const currentData = getCurrentData();
    
    // Actions rapides - seulement pour les utilisateurs avec les permissions
    const quickActions = [
      { 
        icon: Plus, 
        label: 'Nouveau point de vente', 
        color: 'from-green-500 to-emerald-600',
        gradient: 'bg-gradient-to-r from-green-500 to-emerald-600',
        onClick: () => setActiveTab('points-vente'),
        permission: 'distributeurs'
      },
      { 
        icon: Package, 
        label: 'Gérer stock', 
        color: 'from-orange-500 to-amber-600',
        gradient: 'bg-gradient-to-r from-orange-500 to-amber-600',
        onClick: () => setActiveTab('stocks'),
        permission: 'inventaire'
      },
      { 
        icon: ShoppingCart, 
        label: 'Nouvelle commande', 
        color: 'from-purple-500 to-violet-600',
        gradient: 'bg-gradient-to-r from-purple-500 to-violet-600',
        onClick: () => setActiveTab('commandes'),
        permission: 'commande'
      },
      { 
        icon: BarChart3, 
        label: 'Voir rapports', 
        color: 'from-indigo-500 to-blue-600',
        gradient: 'bg-gradient-to-r from-indigo-500 to-blue-600',
        onClick: () => setActiveTab('statistiques'),
        permission: 'analytique'
      }
    ];

    const filteredQuickActions = quickActions.filter(action => 
      userPermissions[action.permission as keyof typeof userPermissions]
    );
    
    return (
      <div className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertTriangle className="text-red-600 mr-2" size={20} />
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* En-tête personnalisé avec les informations de l'utilisateur */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                Bonjour, {getUserDisplayName()} 👋
              </h1>
              <p className="opacity-90 mb-2">
                {selectedPOS?.pos_name === "Total Général" 
                  ? "Vue d'ensemble de tous vos Distributeurs" 
                  : `Activité du point de vente: ${selectedPOS?.pos_name}`}
              </p>
              <div className="flex flex-wrap gap-4 text-sm opacity-90">
                <div className="flex items-center">
                  <UserRound size={16} className="mr-1" />
                  <span>Rôle: {getUserRoleDisplay()}</span>
                </div>
                <div className="flex items-center">
                  <MapPin size={16} className="mr-1" />
                  <span>Localisation: {getUserLocation()}</span>
                </div>
                {userPermissions.distributeurs && (
                  <div className="flex items-center">
                    <Package size={16} className="mr-1" />
                    <span>Distributeurs: {getUserPointsOfSale().length}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Badge du rôle */}
            <div className="mt-4 md:mt-0">
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-full px-4 py-2 inline-flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                <span className="font-medium">{getUserRoleDisplay()}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {currentData.stats.map((stat, index) => {
            const IconComponent = iconComponents[stat.icon] || CheckCircle;
            return (
              <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md flex items-center">
                <div className="mr-4 p-3 rounded-full bg-indigo-100 text-indigo-600">
                  <IconComponent size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                  <p className={`text-sm font-semibold ${
                    stat.change.startsWith('+') ? 'text-green-600' : stat.change.startsWith('-') ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {stat.change}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Section Actions Rapides - Uniquement pour les utilisateurs avec permissions */}
        {filteredQuickActions.length > 0 && (
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
              {filteredQuickActions.map((action, index) => (
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
        
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Activités Récentes</h3>
              <button className="text-indigo-600 text-sm font-medium">Voir tout</button>
            </div>
            <div className="space-y-4">
              {currentData.recent_activities.length > 0 ? (
                currentData.recent_activities.map((activity, index) => {
                  const IconComponent = iconComponents[activity.icon] || CheckCircle;
                  return (
                    <div key={index} className="flex items-start p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="p-2 rounded-full mr-3 bg-indigo-100 text-indigo-600">
                        <IconComponent size={18} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{activity.action}</p>
                        <p className="text-sm text-gray-600">{activity.user}</p>
                      </div>
                      <div className="flex items-center text-xs text-gray-400">
                        <Clock size={14} className="mr-1" />
                        {activity.time}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-600">Aucune activité récente</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Alertes Importantes</h3>
              <button className="text-indigo-600 text-sm font-medium">Tout marquer comme lu</button>
            </div>
            <div className="space-y-4">
              {currentData.alerts.length > 0 ? (
                currentData.alerts.map((alert, index) => {
                  const IconComponent = iconComponents[alert.icon] || AlertTriangle;
                  return (
                    <div key={index} className={`p-4 rounded-lg border-l-4 flex items-start ${
                      alert.priority === 'high' ? 'border-red-500 bg-red-50' :
                      alert.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                      'border-blue-500 bg-blue-50'
                    }`}>
                      <div className={`p-2 rounded-full mr-3 ${
                        alert.priority === 'high' ? 'text-red-600 bg-red-100' :
                        alert.priority === 'medium' ? 'text-yellow-600 bg-yellow-100' :
                        'text-blue-600 bg-blue-100'
                      }`}>
                        <IconComponent size={18} />
                      </div>
                      <div>
                        <div className="font-medium text-sm text-gray-800">{alert.type}</div>
                        <div className="text-sm text-gray-600">{alert.message}</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-600">Aucune alerte pour le moment</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderActiveContent = () => {
    // Vérifier si l'utilisateur a la permission d'accéder à cet onglet
    const menuItem = menuItems.find(item => item.id === activeTab);
    if (!menuItem) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-gray-400 mb-4">
            <AlertTriangle size={48} className="mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Accès non autorisé
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Vous n'avez pas la permission d'accéder à cette section.
          </p>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Retour au tableau de bord
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent />;
      case 'points-vente':
        return userPermissions.distributeurs ? React.createElement(PointsVenteManagement as any, { selectedPOS }) : null;
      case 'stocks':
        return userPermissions.inventaire ? React.createElement(StockManagement as any, { selectedPOS }) : null;
      case 'commandes':
        return userPermissions.commande ? React.createElement(OrderManagement as any, { selectedPOS }) : null;
      case 'vendeurs-ambulants':
        return userPermissions.commerciaux ? React.createElement(MobileVendorsManagement as any, { selectedPOS }) : null;
      case 'statistiques':
        return userPermissions.analytique ? <StatisticsDashboard /> : null;
      case 'utilisateurs':
        return userPermissions.utilisateur ? React.createElement(UserManagement as any) : null;
      case 'parametres':
        return userPermissions.configuration ? <ParametresManagement /> : null;
      case 'cartes':
        return userPermissions.geolocalisation ? <MapComponent /> : null;
      case 'Pushcart':
        return userPermissions.prospects ? <PushcartManagement /> : null;
      case 'positions':
        return userPermissions.positions ? <LocalisationManagement /> : null; 
      default:
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-400 mb-4">
              {menuItems.find(item => item.id === activeTab)?.icon && 
                React.createElement(menuItems.find(item => item.id === activeTab)!.icon, { size: 48, className: 'mx-auto' })
              }
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {menuItems.find(item => item.id === activeTab)?.label}
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Cette section est en cours de développement. Elle sera disponible dans la prochaine mise à jour.
            </p>
            <button 
              onClick={() => setActiveTab('dashboard')}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Retour au tableau de bord
            </button>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <span className="text-gray-600">Chargement du tableau de bord...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white shadow-md p-4 flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={() => setMobileMenuOpen(true)} className="mr-3 p-1">
            <Menu size={24} className="text-gray-700" />
          </button>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-2">
              <span className="text-white font-bold">LF</span>
            </div>
            <h1 className="text-lg font-bold text-gray-800">LanfiaLink</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 text-gray-600 hover:text-gray-800 rounded-lg transition-colors relative"
          >
            <Bell size={20} />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadNotifications}
              </span>
            )}
          </button>
          
          <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {getUserInitials()}
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-2">
                  <span className="text-white font-bold">LL</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-800">LanfiaLink</h1>
                  <p className="text-xs text-gray-500">Admin Panel</p>
                </div>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto h-[calc(100%-120px)]">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all ${
                    activeTab === item.id ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <item.icon size={20} className={`flex-shrink-0 ${activeTab === item.id ? item.color : 'text-gray-500'}`} />
                  <span className={`${activeTab === item.id ? 'font-medium' : 'font-normal'}`}>
                    {item.label}
                  </span>
                </button>
              ))}
            </nav>

            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-medium">
                  {getUserInitials()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{getUserDisplayName()}</p>
                  <p className="text-xs text-gray-500">{currentUser?.email || 'admin@lanfiatech.com'}</p>
                  <p className="text-xs text-indigo-600 font-medium">{getUserRoleDisplay()}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Déconnexion"
                >
                  <LogOut size={20} className="text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className={`hidden lg:block fixed inset-y-0 left-0 z-40 bg-white shadow-lg transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'w-64' : 'w-20'
      }`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            {sidebarOpen ? (
              <div className="flex items-center">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-2">
                  <span className="text-white font-bold">LL</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-800">LanfiaLink</h1>
                  <p className="text-xs text-gray-500">Admin Panel</p>
                </div>
              </div>
            ) : (
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mx-auto">
                <span className="text-white font-bold">LL</span>
              </div>
            )}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu size={20} />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all ${
                  activeTab === item.id ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'
                } ${sidebarOpen ? 'justify-start' : 'justify-center'}`}
              >
                <item.icon size={20} className={`flex-shrink-0 ${activeTab === item.id ? item.color : 'text-gray-500'}`} />
                {sidebarOpen && (
                  <span className={`${activeTab === item.id ? 'font-medium' : 'font-normal'}`}>
                    {item.label}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-200">
            <div className={`flex items-center ${sidebarOpen ? 'space-x-3' : 'justify-center'}`}>
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-medium">
                {getUserInitials()}
              </div>
              {sidebarOpen && (
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{getUserDisplayName()}</p>
                  <p className="text-xs text-gray-500">{currentUser?.email || 'admin@lanfiatech.com'}</p>
                  <p className="text-xs text-indigo-600 font-medium">{getUserRoleDisplay()}</p>
                </div>
              )}
              {sidebarOpen && (
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Déconnexion"
                >
                  <LogOut size={20} className="text-gray-600" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={`transition-all duration-300 ease-in-out ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} lg:pt-0 pt-16`}>
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10 hidden lg:block">
          <div className="flex items-center justify-between p-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {menuItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
              </h2>
              <p className="text-sm text-gray-600">
                {activeTab === 'dashboard' ? 'Vue d\'ensemble de votre activité' : 
                 `Gestion des ${menuItems.find(item => item.id === activeTab)?.label.toLowerCase()}`}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {userPermissions.distributeurs && (
                <div className="relative">
                  <button 
                    onClick={() => setPosDropdownOpen(!posDropdownOpen)}
                    className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
                  >
                    <MapPin size={16} />
                    <span>{selectedPOS?.pos_name || 'Sélectionner POS'}</span>
                    <ChevronsUpDown size={16} />
                  </button>
                  
                  {posDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
                      <div className="p-2 max-h-60 overflow-y-auto">
                        <button
                          onClick={() => {
                            setSelectedPOS(dashboardData.cumulative);
                            setPosDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 hover:bg-gray-100 rounded-md ${
                            selectedPOS?.pos_id === null ? 'bg-indigo-50 text-indigo-600' : ''
                          }`}
                        >
                          Total Général
                        </button>
                        {dashboardData.pos_data.map(pos => (
                          <button
                            key={pos.pos_id}
                            onClick={() => {
                              setSelectedPOS(pos);
                              setPosDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 hover:bg-gray-100 rounded-md ${
                              selectedPOS?.pos_id === pos.pos_id ? 'bg-indigo-50 text-indigo-600' : ''
                            }`}
                          >
                            {pos.pos_name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Rechercher..." 
                  className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div className="relative">
                <button 
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors relative"
                >
                  <Bell size={20} />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadNotifications}
                    </span>
                  )}
                </button>
                
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
                    <div className="p-3 border-b border-gray-200 flex justify-between items-center">
                      <h3 className="font-medium">Notifications</h3>
                      <button className="text-indigo-600 text-sm">Marquer tout comme lu</button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map(notification => (
                          <div key={notification.id} className={`p-3 border-b border-gray-100 hover:bg-gray-50 ${!notification.is_read ? 'bg-indigo-50' : ''}`}>
                            <div className="flex justify-between">
                              <p className="font-medium text-sm">{notification.type}</p>
                              <p className="text-xs text-gray-500 flex items-center">
                                <Clock size={12} className="mr-1" />
                                {formatTimeAgo(new Date(notification.created_at))}
                              </p>
                            </div>
                            <p className="text-sm text-gray-600">{notification.message}</p>
                          </div>
                        ))
                      ) : (
                        <p className="p-3 text-sm text-gray-600">Aucune notification</p>
                      )}
                    </div>
                    <div className="p-3 text-center border-t border-gray-200">
                      <button className="text-indigo-600 text-sm font-medium">Voir toutes les notifications</button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-800">{getUserDisplayName()}</p>
                  <p className="text-xs text-gray-500">{getUserRoleDisplay()}</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {getUserInitials()}
                </div>
                <button 
                  onClick={handleLogout}
                  className="flex items-center text-gray-600 hover:text-gray-800"
                  title="Déconnexion"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6">
          {renderActiveContent()}
        </main>
      </div>

      {/* Mobile Notifications Panel */}
      {notificationsOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setNotificationsOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-80 bg-white" onClick={e => e.stopPropagation()}>
            <div className="p-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-medium">Notifications</h3>
              <button 
                className="p-1 rounded-full hover:bg-gray-100"
                onClick={() => setNotificationsOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="h-full overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map(notification => (
                  <div key={notification.id} className={`p-3 border-b border-gray-100 hover:bg-gray-50 ${!notification.is_read ? 'bg-indigo-50' : ''}`}>
                    <div className="flex justify-between">
                      <p className="font-medium text-sm">{notification.type}</p>
                      <p className="text-xs text-gray-500 flex items-center">
                        <Clock size={12} className="mr-1" />
                        {formatTimeAgo(new Date(notification.created_at))}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600">{notification.message}</p>
                  </div>
                ))
              ) : (
                <p className="p-3 text-sm text-gray-600">Aucune notification</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;