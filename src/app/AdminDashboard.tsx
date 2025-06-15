"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Home, MapPin, Package, ShoppingCart, Users, Coins, 
  Scale, BarChart3, Map, Settings, Menu, Bell, Search,
  ChevronDown, LogOut, Plus, AlertTriangle, Clock, CheckCircle, Loader2
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { apiService } from './apiService';
import StockManagement from './StockManagement';
import OrderManagement from './OrderManagement';
import PointsVenteManagement from './PointsVenteManagement';
import UserManagement from './UserManagement';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    stats: [
      { title: 'Points de Vente', value: '0', change: '0%', color: 'bg-blue-100 border-blue-200', icon: MapPin },
      { title: 'Commandes du Jour', value: '0', change: '0%', color: 'bg-green-100 border-green-200', icon: ShoppingCart },
      { title: 'Revenus Mensuels', value: '₣ 0', change: '0%', color: 'bg-purple-100 border-purple-200', icon: Coins },
      { title: 'Utilisateurs Actifs', value: '0', change: '0%', color: 'bg-orange-100 border-orange-200', icon: Users }
    ],
    recent_activities: [],
    alerts: []
  });
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, logout } = useAuth();
  const router = useRouter();

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access');
      if (!token) {
        router.push('/login');
        return;
      }
      
      try {
        await apiService.get('/dashboard/');
        setIsLoading(false);
      } catch (error) {
        setError('Session invalide. Veuillez vous reconnecter.');
        logout();
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [router, logout]);

  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', color: 'text-blue-600' },
    { id: 'points-vente', icon: MapPin, label: 'Points de Vente', color: 'text-green-600' },
    { id: 'stocks', icon: Package, label: 'Gestion Stocks', color: 'text-orange-600' },
    { id: 'commandes', icon: ShoppingCart, label: 'Commandes', color: 'text-purple-600' },
    { id: 'utilisateurs', icon: Users, label: 'Utilisateurs', color: 'text-indigo-600' },
    { id: 'jetons', icon: Coins, label: 'Système Jetons', color: 'text-yellow-600' },
    { id: 'contentieux', icon: Scale, label: 'Contentieux', color: 'text-red-600' },
    { id: 'rapports', icon: BarChart3, label: 'Rapports', color: 'text-teal-600' },
    { id: 'cartes', icon: Map, label: 'Cartes', color: 'text-cyan-600' },
    { id: 'parametres', icon: Settings, label: 'Paramètres', color: 'text-gray-600' }
  ];

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await apiService.get('/dashboard/');
        if (!response.ok) {
          if (response.status === 401) {
            logout();
            router.push('/login');
            return;
          }
          throw new Error('Failed to fetch dashboard data');
        }
        const data = await response.json();
        setDashboardData({
          stats: Object.values(data.stats),
          recent_activities: data.recent_activities,
          alerts: data.alerts
        });
      } catch (error) {
        setError('Erreur lors du chargement des données du tableau de bord');
        console.error('Error fetching dashboard data:', error);
      }
    };
    if (localStorage.getItem('access')) fetchDashboardData();
  }, [router, logout]);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await apiService.get('/notifications/');
        if (!response.ok) {
          if (response.status === 401) {
            logout();
            router.push('/login');
            return;
          }
          throw new Error('Failed to fetch notifications');
        }
        const data = await response.json();
        setNotifications(data.map(n => ({
          id: n.id,
          type: n.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          message: n.message,
          time: formatTimeAgo(new Date(n.created_at)),
          read: n.is_read
        })));
      } catch (error) {
        setError('Erreur lors du chargement des notifications');
        console.error('Error fetching notifications:', error);
      }
    };
    if (localStorage.getItem('access')) fetchNotifications();
  }, [router, logout]);

  const unreadNotifications = notifications.filter(n => !n.read).length;

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = Math.floor((now - date) / 60000); // Minutes
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

  const DashboardContent = () => (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertTriangle className="text-red-600 mr-2" size={20} />
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Bonjour, {user?.name || 'Admin'} 👋</h1>
        <p className="opacity-90">Voici un résumé de votre activité aujourd'hui</p>
      </div>

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardData.stats.map((stat, index) => (
          <div key={index} className={`p-6 rounded-xl border ${stat.color} transition-all hover:shadow-md flex items-center`}>
            <div className="mr-4 p-3 rounded-full bg-white bg-opacity-30">
              <stat.icon className={`${stat.color.replace('bg-', 'text-').replace('-100', '-600')}`} size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              <p className={`text-sm font-semibold ${
                stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Actions Rapides</h3>
          <button className="text-blue-600 text-sm font-medium flex items-center">
            Voir plus <ChevronDown size={16} className="ml-1" />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { 
              icon: Plus, 
              label: 'Ajouter Point de Vente', 
              color: 'from-green-500 to-green-600',
              onClick: () => setActiveTab('points-vente')
            },
            { 
              icon: Package, 
              label: 'Gérer Stocks', 
              color: 'from-orange-500 to-orange-600',
              onClick: () => setActiveTab('stocks')
            },
            { 
              icon: ShoppingCart, 
              label: 'Nouvelle Commande', 
              color: 'from-purple-500 to-purple-600',
              onClick: () => setActiveTab('commandes')
            },
            { 
              icon: BarChart3, 
              label: 'Vue Rapports', 
              color: 'from-blue-500 to-blue-600',
              onClick: () => setActiveTab('rapports')
            }
          ].map((action, index) => (
            <button 
              key={index} 
              onClick={action.onClick}
              className={`bg-gradient-to-r ${action.color} text-white p-4 rounded-lg transition-all hover:shadow-lg flex flex-col items-center space-y-2`}
            >
              <action.icon size={24} />
              <span className="text-sm font-medium text-center">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity and Alerts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Activités Récentes</h3>
            <button className="text-blue-600 text-sm font-medium">Voir tout</button>
          </div>
          <div className="space-y-4">
            {dashboardData.recent_activities.length > 0 ? (
              dashboardData.recent_activities.map((activity, index) => {
                const IconComponent = { ShoppingCart, AlertTriangle, MapPin, CheckCircle }[activity.icon] || CheckCircle;
                return (
                  <div key={index} className="flex items-start p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`p-2 rounded-full mr-3 ${activity.color}`}>
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
            <button className="text-blue-600 text-sm font-medium">Tout marquer comme lu</button>
          </div>
          <div className="space-y-4">
            {dashboardData.alerts.length > 0 ? (
              dashboardData.alerts.map((alert, index) => {
                const IconComponent = { AlertTriangle, Package, Coins, Users }[alert.icon] || AlertTriangle;
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

  const renderActiveContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent />;
      case 'points-vente':
        return <PointsVenteManagement />;
      case 'stocks':
        return <StockManagement />;
      case 'commandes':
        return <OrderManagement />;
      case 'utilisateurs':
        return <UserManagement />;
      default:
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-400 mb-4">
              {menuItems.find(item => item.id === activeTab)?.icon && 
                React.createElement(menuItems.find(item => item.id === activeTab).icon, { size: 48, className: 'mx-auto' })
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
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
        <div className="flex items-center space-x-2">
          <Loader2 className="animate-spin text-blue-600" size={24} />
          <span className="text-gray-600">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 bg-white shadow-lg transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'w-64' : 'w-20'
      }`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            {sidebarOpen ? (
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-2">
                  <span className="text-white font-bold">LT</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-800">LanfiaTech</h1>
                  <p className="text-xs text-gray-500">Admin Panel</p>
                </div>
              </div>
            ) : (
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
                <span className="text-white font-bold">LT</span>
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
                  activeTab === item.id ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
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
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                {user?.name?.slice(0, 2).toUpperCase() || 'AU'}
              </div>
              {sidebarOpen && (
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{user?.name || 'Admin User'}</p>
                  <p className="text-xs text-gray-500">{user?.email || 'admin@lanfiatech.com'}</p>
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

      <div className={`transition-all duration-300 ease-in-out ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
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
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Rechercher..." 
                  className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                      <button className="text-blue-600 text-sm">Marquer tout comme lu</button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map(notification => (
                          <div key={notification.id} className={`p-3 border-b border-gray-100 hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}>
                            <div className="flex justify-between">
                              <p className="font-medium text-sm">{notification.type}</p>
                              <p className="text-xs text-gray-500 flex items-center">
                                <Clock size={12} className="mr-1" />
                                {notification.time}
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
                      <button className="text-blue-600 text-sm font-medium">Voir toutes les notifications</button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {user?.name?.slice(0, 2).toUpperCase() || 'AU'}
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

        <main className="p-6">
          {renderActiveContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;