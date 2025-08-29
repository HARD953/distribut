"use client";
import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Plus, Edit, Trash2, Eye, 
  Shield, Calendar, Clock, Phone, Mail, 
  UserCheck, UserX, Settings, Download, Upload, CheckCircle,
  AlertCircle, XCircle, Loader, ChevronDown, ChevronRight,
  MapPin, Bike, ShoppingCart, Store, Truck, User as UserIcon,
  Package, Factory
} from 'lucide-react';
import { apiService } from './ApiService';

interface Role {
  id: string;
  name: string;
  description?: string;
  color?: string;
  permissions: Permission[];
  users: number;
}

interface Permission {
  id: string;
  name: string;
  category: string;
  description?: string;
}

interface PointOfSale {
  id: string;
  name: string;
  type?: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  location?: string;
  role?: string;
  status: 'active' | 'inactive' | 'suspended';
  join_date: string;
  last_login?: string;
  avatar?: string;
  establishment_name: string;
  establishment_type: string;
  establishment_phone?: string;
  establishment_email?: string;
  establishment_address: string;
  points_of_sale: PointOfSale[];
  establishment_registration_date?: string;
}

interface NewUser {
  user: {
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
    password?: string;
  };
  phone?: string;
  location?: string;
  role?: string;
  status: 'active' | 'inactive' | 'suspended';
  avatar?: File | null;
  establishment_name: string;
  establishment_type: string;
  establishment_phone?: string;
  establishment_email?: string;
  establishment_address: string;
  points_of_sale_ids?: string[];
}

interface NewRole {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
}

interface Supplier {
  id: number;
  name: string;
  contact: string;
  address: string;
  email: string;
  logo?: string;
  created_at: string;
  types: string;
}

interface NewSupplier {
  name: string;
  types: string;
  contact: string;
  address: string;
  email: string;
  logo?: File | null;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [pointsOfSale, setPointsOfSale] = useState<PointOfSale[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedEstablishmentType, setSelectedEstablishmentType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRoleForEdit, setSelectedRoleForEdit] = useState<Role | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'suppliers'>('users');
  const usersPerPage = 10;

  const establishmentTypes = [
    { value: 'Boutique', label: 'Boutique', icon: <Store size={16} /> },
    { value: 'supermarche', label: 'Supermarché', icon: <ShoppingCart size={16} /> },
    { value: 'superette', label: 'Supérette', icon: <Store size={16} /> },
    { value: 'epicerie', label: 'Épicerie', icon: <Store size={16} /> },
    { value: 'demi_grossiste', label: 'Demi-Grossiste', icon: <Truck size={16} /> },
    { value: 'grossiste', label: 'Grossiste', icon: <Truck size={16} /> },
    { value: 'mobile_vendor', label: 'Vendeur ambulant', icon: <Bike size={16} /> },
  ];

  const supplierTypes = [
    { value: 'importateur', label: 'Importateur' },
    { value: 'producteur_local', label: 'Producteur local' },
    { value: 'distributeur', label: 'Distributeur' },
    { value: 'fabricant', label: 'Fabricant' },
    { value: 'grossiste', label: 'Grossiste' },
  ];

  const safeGetStatus = (status?: string): 'active' | 'inactive' | 'suspended' => 
    status && ['active', 'inactive', 'suspended'].includes(status) 
      ? status as 'active' | 'inactive' | 'suspended' 
      : 'inactive';

  const safeGetText = (text?: string | null, fallback = '-'): string => text || fallback;
  const safeLowerCase = (text?: string): string => (text || '').toLowerCase();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        setLoading(true);

        const [usersRes, rolesRes, permissionsRes, posRes, suppliersRes] = await Promise.all([
          apiService.getUsers(),
          apiService.getRoles(),
          apiService.getPermissions(),
          apiService.getPointsVente(),
          apiService.getSuppliers()
        ]);

        if (!usersRes.ok) throw new Error('Failed to fetch users');
        if (!rolesRes.ok) throw new Error('Failed to fetch roles');
        if (!permissionsRes.ok) throw new Error('Failed to fetch permissions');
        if (!posRes.ok) throw new Error('Failed to fetch points of sale');
        if (!suppliersRes.ok) throw new Error('Failed to fetch suppliers');

        const usersData = await usersRes.json();
        const rolesData: Role[] = await rolesRes.json();
        const permissionsData: Permission[] = await permissionsRes.json();
        const posData: PointOfSale[] = await posRes.json();
        const suppliersData: Supplier[] = await suppliersRes.json();

        // Map user data to match interface
        setUsers(usersData.map((user: any) => ({
          id: user.user?.id || 0,
          username: user.user?.username || '',
          email: user.user?.email || '',
          first_name: user.user?.first_name || '',
          last_name: user.user?.last_name || '',
          phone: user.phone || '',
          location: user.location || '',
          role: user.role || '',
          status: safeGetStatus(user.status),
          join_date: user.join_date || '',
          last_login: user.last_login || '',
          avatar: user.avatar || '',
          establishment_name: user.establishment_name || '',
          establishment_type: user.establishment_type || 'Boutique',
          establishment_phone: user.establishment_phone || '',
          establishment_email: user.establishment_email || '',
          establishment_address: user.establishment_address || '',
          points_of_sale: user.points_of_sale || [],
          establishment_registration_date: user.establishment_registration_date || ''
        })));

        setRoles(rolesData);
        setPermissions(permissionsData);
        setPointsOfSale(posData);
        setSuppliers(suppliersData.map((supplier: any) => ({
          ...supplier,
          types: supplier.types || 'grossiste'
        })));

      } catch (err: any) {
        if (err.message !== 'Session expired') {
          setError(err.message || 'An error occurred while fetching data');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredUsers = users.filter(user => {
    if (!user) return false;

    const searchTermLower = safeLowerCase(searchTerm);

    return (
      (safeLowerCase(user.username).includes(searchTermLower) ||
       safeLowerCase(user.email).includes(searchTermLower) ||
       safeLowerCase(user.establishment_name).includes(searchTermLower) ||
       safeLowerCase(user.phone).includes(searchTermLower)) &&
      (selectedRole === 'all' || (user.role && safeLowerCase(user.role) === safeLowerCase(selectedRole))) &&
      (selectedStatus === 'all' || user.status === selectedStatus) &&
      (selectedEstablishmentType === 'all' || user.establishment_type === selectedEstablishmentType)
    );
  });

  const filteredSuppliers = suppliers.filter(supplier => {
    const searchTermLower = safeLowerCase(supplierSearchTerm);
    return (
      safeLowerCase(supplier.name).includes(searchTermLower) ||
      safeLowerCase(supplier.email).includes(searchTermLower) ||
      safeLowerCase(supplier.contact).includes(searchTermLower) ||
      safeLowerCase(supplier.address).includes(searchTermLower)
    );
  });

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage) || 1;

  const getStatusIcon = (status?: string) => {
    switch (safeGetStatus(status)) {
      case 'active': return <CheckCircle className="text-green-500" size={16} />;
      case 'inactive': return <XCircle className="text-red-500" size={16} />;
      case 'suspended': return <AlertCircle className="text-yellow-500" size={16} />;
      default: return <AlertCircle className="text-gray-500" size={16} />;
    }
  };

  const getStatusText = (status?: string) => {
    switch (safeGetStatus(status)) {
      case 'active': return 'Actif';
      case 'inactive': return 'Inactif';
      case 'suspended': return 'Suspendu';
      default: return 'Inconnu';
    }
  };

  const getEstablishmentType = (type?: string) => {
    const found = establishmentTypes.find(t => t.value === type);
    return found ? found.label : type || 'Non spécifié';
  };

  const getSupplierType = (type?: string) => {
    const found = supplierTypes.find(t => t.value === type);
    return found ? found.label : type || 'Non spécifié';
  };

  const deleteUser = async (userId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    try {
      setError(null);
      const res = await apiService.deleteResource('users', userId);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.detail || 'Failed to delete user');
      }
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err: any) {
      if (err.message !== 'Session expired') {
        setError(err.message || 'Failed to delete user');
      }
    }
  };

  const deleteSupplier = async (supplierId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur ?')) return;
    try {
      setError(null);
      const res = await apiService.deleteResource('suppliers', supplierId);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.detail || 'Failed to delete supplier');
      }
      setSuppliers(prev => prev.filter(s => s.id !== supplierId));
    } catch (err: any) {
      if (err.message !== 'Session expired') {
        setError(err.message || 'Failed to delete supplier');
      }
    }
  };

  const deleteRole = async (roleId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce rôle ?')) return;
    try {
      setError(null);
      const res = await apiService.deleteResource('roles', roleId);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.detail || 'Failed to delete role');
      }
      setRoles(prev => prev.filter(r => r.id !== roleId));
    } catch (err: any) {
      if (err.message !== 'Session expired') {
        setError(err.message || 'Failed to delete role');
      }
    }
  };

  const UserModal: React.FC = () => {
    const [formData, setFormData] = useState<NewUser>({
      user: {
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        password: '',
      },
      phone: '',
      location: '',
      role: '',
      status: 'active',
      avatar: null,
      establishment_name: '',
      establishment_type: 'Boutique',
      establishment_phone: '',
      establishment_email: '',
      establishment_address: '',
      points_of_sale_ids: []
    });
    const [formError, setFormError] = useState<string | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    useEffect(() => {
      if (modalType === 'edit' && selectedUser) {
        setFormData({
          user: {
            username: selectedUser.username,
            email: selectedUser.email,
            first_name: selectedUser.first_name || '',
            last_name: selectedUser.last_name || '',
          },
          phone: selectedUser.phone || '',
          location: selectedUser.location || '',
          role: selectedUser.role || '',
          status: safeGetStatus(selectedUser.status),
          avatar: null,
          establishment_name: selectedUser.establishment_name || '',
          establishment_type: selectedUser.establishment_type || 'Boutique',
          establishment_phone: selectedUser.establishment_phone || '',
          establishment_email: selectedUser.establishment_email || '',
          establishment_address: selectedUser.establishment_address || '',
          points_of_sale_ids: selectedUser.points_of_sale?.map(pos => pos.id) || []
        });
        setAvatarPreview(selectedUser.avatar || null);
      } else if (modalType === 'add') {
        setFormData({
          user: {
            username: '',
            email: '',
            first_name: '',
            last_name: '',
            password: '',
          },
          phone: '',
          location: '',
          role: '',
          status: 'active',
          avatar: null,
          establishment_name: '',
          establishment_type: 'Boutique',
          establishment_phone: '',
          establishment_email: '',
          establishment_address: '',
          points_of_sale_ids: []
        });
        setAvatarPreview(null);
      }
    }, [modalType, selectedUser]);

    const validateForm = () => {
      if (!formData.user.username.trim()) return 'Le nom d\'utilisateur est requis.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.user.email)) return 'Email invalide.';
      if (modalType === 'add' && !formData.user.password) return 'Le mot de passe est requis.';
      if (!formData.role) return 'Le rôle est requis.';
      if (!formData.establishment_name.trim()) return 'Le nom de l\'établissement est requis.';
      if (!formData.establishment_type) return 'Le type d\'établissement est requis.';
      if (!formData.establishment_address.trim()) return 'L\'adresse de l\'établissement est requise.';
      return null;
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setFormData(prev => ({ ...prev, avatar: file }));
        setAvatarPreview(URL.createObjectURL(file));
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const validationError = validateForm();
      if (validationError) {
        setFormError(validationError);
        return;
      }
      try {
        setFormError(null);
        const formDataToSend = new FormData();
        
        // User data - structure imbriquée comme attendu par le serializer
        formDataToSend.append('user[username]', formData.user.username);
        formDataToSend.append('user[email]', formData.user.email);
        formDataToSend.append('user[first_name]', formData.user.first_name || '');
        formDataToSend.append('user[last_name]', formData.user.last_name || '');
        if (modalType === 'add') {
          formDataToSend.append('user[password]', formData.user.password || '');
        }

        // Profile data
        formDataToSend.append('phone', formData.phone || '');
        formDataToSend.append('location', formData.location || '');
        formDataToSend.append('role', formData.role || '');
        formDataToSend.append('status', formData.status);
        formDataToSend.append('establishment_name', formData.establishment_name);
        formDataToSend.append('establishment_type', formData.establishment_type);
        formDataToSend.append('establishment_phone', formData.establishment_phone || '');
        formDataToSend.append('establishment_email', formData.establishment_email || '');
        formDataToSend.append('establishment_address', formData.establishment_address);

        // Points of sale
        if (formData.points_of_sale_ids) {
          formData.points_of_sale_ids.forEach(id => {
            formDataToSend.append('points_of_sale_ids', id);
          });
        }

        // Avatar
        if (formData.avatar) {
          formDataToSend.append('avatar', formData.avatar);
        }

        let res;
        if (modalType === 'add') {
          res = await apiService.createUser(formDataToSend);
        } else {
          res = await apiService.updateResource('users', selectedUser?.id || 0, formDataToSend);
        }

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData?.detail || errorData?.message || `Failed to ${modalType === 'add' ? 'create' : 'update'} user`);
        }
        
        const updatedUser = await res.json();
        setUsers(prev => modalType === 'add' ? [...prev, updatedUser] : prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        setShowModal(false);
      } catch (err: any) {
        if (err.message !== 'Session expired') {
          setFormError(err.message || 'An error occurred');
        }
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800">
                {modalType === 'add' ? 'Ajouter un utilisateur' : 
                 modalType === 'edit' ? 'Modifier l\'utilisateur' : 
                 'Détails de l\'utilisateur'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>
          </div>

          {modalType === 'view' && selectedUser ? (
            <div className="p-6 space-y-6">
              <div className="flex items-center space-x-4">
                {selectedUser.avatar ? (
                  <img 
                    src={selectedUser.avatar} 
                    alt={selectedUser.username}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {selectedUser.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="text-xl font-semibold text-gray-800">
                    {safeGetText(selectedUser.first_name)} {safeGetText(selectedUser.last_name)}
                  </h4>
                  <p className="text-gray-600">@{selectedUser.username}</p>
                  <div className="flex items-center mt-1">
                    {getStatusIcon(selectedUser.status)}
                    <span className="ml-2 text-sm">{getStatusText(selectedUser.status)}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center text-gray-600">
                    <Mail size={16} className="mr-2" />
                    <span>{selectedUser.email}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Phone size={16} className="mr-2" />
                    <span>{safeGetText(selectedUser.phone)}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin size={16} className="mr-2" />
                    <span>{safeGetText(selectedUser.location)}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center text-gray-600">
                    <Calendar size={16} className="mr-2" />
                    <span>Rejoint le {new Date(selectedUser.join_date).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock size={16} className="mr-2" />
                    <span>{selectedUser.last_login ? 
                      `Dernière connexion: ${new Date(selectedUser.last_login).toLocaleString('fr-FR')}` : 
                      'Jamais connecté'}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Shield size={16} className="mr-2" />
                    <span>{roles.find(r => r.id === selectedUser.role)?.name || 'Aucun rôle'}</span>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Informations de l'établissement</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center text-gray-600">
                      <Store size={16} className="mr-2" />
                      <span>{selectedUser.establishment_name}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      {establishmentTypes.find(t => t.value === selectedUser.establishment_type)?.icon || <Store size={16} className="mr-2" />}
                      <span className="ml-2">{getEstablishmentType(selectedUser.establishment_type)}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Phone size={16} className="mr-2" />
                      <span>{safeGetText(selectedUser.establishment_phone)}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center text-gray-600">
                      <Mail size={16} className="mr-2" />
                      <span>{safeGetText(selectedUser.establishment_email)}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <MapPin size={16} className="mr-2" />
                      <span>{selectedUser.establishment_address}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {formError && (
                <div className="p-3 bg-red-100 text-red-600 rounded-lg">{formError}</div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom d'utilisateur *</label>
                  <input
                    type="text"
                    value={formData.user.username}
                    onChange={(e) => setFormData({
                      ...formData, 
                      user: {...formData.user, username: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.user.email}
                    onChange={(e) => setFormData({
                      ...formData, 
                      user: {...formData.user, email: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                  <input
                    type="text"
                    value={formData.user.first_name || ''}
                    onChange={(e) => setFormData({
                      ...formData, 
                      user: {...formData.user, first_name: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                  <input
                    type="text"
                    value={formData.user.last_name || ''}
                    onChange={(e) => setFormData({
                      ...formData, 
                      user: {...formData.user, last_name: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {modalType === 'add' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe *</label>
                    <input
                      type="password"
                      value={formData.user.password || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        user: {...formData.user, password: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone personnel</label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({
                      ...formData, 
                      phone: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Localisation personnelle</label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({
                      ...formData, 
                      location: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rôle *</label>
                  <select
                    value={formData.role || ''}
                    onChange={(e) => setFormData({
                      ...formData, 
                      role: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Sélectionner un rôle</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Statut *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({
                      ...formData, 
                      status: e.target.value as 'active' | 'inactive' | 'suspended'
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                    <option value="suspended">Suspendu</option>
                  </select>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Informations de l'établissement</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom de l'établissement *</label>
                    <input
                      type="text"
                      value={formData.establishment_name}
                      onChange={(e) => setFormData({
                        ...formData, 
                        establishment_name: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type d'établissement *</label>
                    <select
                      value={formData.establishment_type}
                      onChange={(e) => setFormData({
                        ...formData, 
                        establishment_type: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {establishmentTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone établissement</label>
                    <input
                      type="tel"
                      value={formData.establishment_phone || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        establishment_phone: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email établissement</label>
                    <input
                      type="email"
                      value={formData.establishment_email || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        establishment_email: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Adresse établissement *</label>
                    <textarea
                      value={formData.establishment_address}
                      onChange={(e) => setFormData({
                        ...formData, 
                        establishment_address: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Points de vente associés</h4>
                <div className="space-y-2">
                  {pointsOfSale.map(pos => (
                    <label key={pos.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.points_of_sale_ids?.includes(pos.id) || false}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setFormData(prev => ({
                            ...prev,
                            points_of_sale_ids: isChecked
                              ? [...(prev.points_of_sale_ids || []), pos.id]
                              : (prev.points_of_sale_ids || []).filter(id => id !== pos.id)
                          }));
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{pos.name} ({pos.type || 'Non spécifié'})</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Photo de profil</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Avatar</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  {avatarPreview && (
                    <img src={avatarPreview} alt="Avatar Preview" className="mt-2 w-20 h-20 rounded-full object-cover" />
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {modalType === 'add' ? 'Ajouter' : 'Modifier'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  };

  const SupplierModal: React.FC = () => {
    const [formData, setFormData] = useState<NewSupplier>({
      name: '',
      types: '',
      contact: '',
      address: '',
      email: '',
      logo: null
    });
    const [formError, setFormError] = useState<string | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    useEffect(() => {
      if (selectedSupplier) {
        setFormData({
          name: selectedSupplier.name,
          types: selectedSupplier.types,
          contact: selectedSupplier.contact,
          address: selectedSupplier.address,
          email: selectedSupplier.email,
          logo: null
        });
        setLogoPreview(selectedSupplier.logo || null);
      } else {
        setFormData({
          name: '',
          types: '',
          contact: '',
          address: '',
          email: '',
          logo: null
        });
        setLogoPreview(null);
      }
    }, [selectedSupplier]);

    const validateForm = () => {
      if (!formData.name.trim()) return 'Le nom du fournisseur est requis.';
      if (!formData.types.trim()) return 'Le type de fournisseur est requis.';
      if (!formData.contact.trim()) return 'Le contact est requis.';
      return null;
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setFormData(prev => ({ ...prev, logo: file }));
        setLogoPreview(URL.createObjectURL(file));
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const validationError = validateForm();
      if (validationError) {
        setFormError(validationError);
        return;
      }
      try {
        setFormError(null);
        const formDataToSend = new FormData();
        
        formDataToSend.append('name', formData.name);
        formDataToSend.append('types', formData.types);
        formDataToSend.append('contact', formData.contact);
        formDataToSend.append('address', formData.address);
        formDataToSend.append('email', formData.email);
        
        if (formData.logo) {
          formDataToSend.append('logo', formData.logo);
        }

        let res;
        if (selectedSupplier) {
          res = await apiService.updateResource('suppliers', selectedSupplier.id, formDataToSend);
        } else {
          res = await apiService.createSupplier(formDataToSend);
        }

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData?.detail || errorData?.message || `Failed to ${selectedSupplier ? 'update' : 'create'} supplier`);
        }
        const updatedSupplier = await res.json();
        setSuppliers(prev => selectedSupplier ? 
          prev.map(s => s.id === updatedSupplier.id ? updatedSupplier : s) : 
          [...prev, updatedSupplier]);
        setShowSupplierModal(false);
      } catch (err: any) {
        if (err.message !== 'Session expired') {
          setFormError(err.message || 'An error occurred');
        }
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800">
                {selectedSupplier ? 'Modifier le fournisseur' : 'Ajouter un fournisseur'}
              </h3>
              <button onClick={() => setShowSupplierModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {formError && (
              <div className="p-3 bg-red-100 text-red-600 rounded-lg">{formError}</div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom du fournisseur *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                <select
                  value={formData.types}
                  onChange={(e) => setFormData({...formData, types: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Sélectionner un type</option>
                  {supplierTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact *</label>
                <input
                  type="text"
                  value={formData.contact}
                  onChange={(e) => setFormData({...formData, contact: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Logo</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo du fournisseur</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                {logoPreview && (
                  <img src={logoPreview} alt="Logo Preview" className="mt-2 w-20 h-20 rounded object-cover" />
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowSupplierModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {selectedSupplier ? 'Modifier' : 'Ajouter'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const RoleModal: React.FC = () => {
    const [formData, setFormData] = useState<NewRole>({
      id: '',
      name: '',
      description: '',
      permissions: []
    });
    const [formError, setFormError] = useState<string | null>(null);

    useEffect(() => {
      if (selectedRoleForEdit) {
        setFormData({
          id: selectedRoleForEdit.id,
          name: selectedRoleForEdit.name,
          description: selectedRoleForEdit.description || '',
          permissions: selectedRoleForEdit.permissions.map(p => p.id)
        });
      } else {
        setFormData({
          id: '',
          name: '',
          description: '',
          permissions: []
        });
      }
    }, [selectedRoleForEdit]);

    const validateForm = () => {
      if (!formData.id.trim()) return 'L\'ID du rôle est requis.';
      if (!formData.name.trim()) return 'Le nom du rôle est requis.';
      return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const validationError = validateForm();
      if (validationError) {
        setFormError(validationError);
        return;
      }
      try {
        setFormError(null);
        const data = {
          id: formData.id,
          name: formData.name,
          description: formData.description,
          permissions: formData.permissions
        };
        let res;
        if (selectedRoleForEdit) {
          res = await apiService.updateResource('roles', selectedRoleForEdit.id, data);
        } else {
          res = await apiService.createRole(data);
        }
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData?.detail || `Failed to ${selectedRoleForEdit ? 'update' : 'create'} role`);
        }
        const updatedRole = await res.json();
        setRoles(prev => selectedRoleForEdit ? 
          prev.map(r => r.id === updatedRole.id ? updatedRole : r) : 
          [...prev, updatedRole]);
        setShowRoleModal(false);
        setSelectedRoleForEdit(null);
      } catch (err: any) {
        if (err.message !== 'Session expired') {
          setFormError(err.message || 'An error occurred');
        }
      }
    };

    const toggleRolePermission = (permissionId: string) => {
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.includes(permissionId)
          ? prev.permissions.filter(p => p !== permissionId)
          : [...prev.permissions, permissionId]
      }));
    };

    const permissionsByCategory = permissions.reduce((acc, permission) => {
      const category = permission.category || 'Autre';
      if (!acc[category]) acc[category] = [];
      acc[category].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800">
                {selectedRoleForEdit ? 'Modifier le rôle' : 'Ajouter un rôle'}
              </h3>
              <button 
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedRoleForEdit(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={24} />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {formError && (
              <div className="p-3 bg-red-100 text-red-600 rounded-lg">{formError}</div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">ID du rôle *</label>
                <input 
                  type="text"
                  value={formData.id}
                  onChange={(e) => setFormData({...formData, id: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required 
                  disabled={!!selectedRoleForEdit}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nom du rôle *</label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <input 
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-4">Permissions</label>
              <div className="space-y-4">
                {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
                  <div key={category} className="border border-gray-200 rounded-lg p-4">
                    <h6 className="font-medium text-gray-800 mb-3">{category}</h6>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {categoryPermissions.map(permission => (
                        <label key={permission.id} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.permissions.includes(permission.id)}
                            onChange={() => toggleRolePermission(permission.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{permission.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
              <button 
                type="button"
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedRoleForEdit(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Annuler
              </button>
              <button 
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {selectedRoleForEdit ? 'Modifier' : 'Ajouter'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {error && (
        <div className="p-4 bg-red-100 text-red-600 text-center rounded-lg">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Utilisateurs</p>
              <p className="text-2xl font-bold">{users.length}</p>
            </div>
            <Users size={32} className="text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Utilisateurs Actifs</p>
              <p className="text-2xl font-bold">{users.filter(u => u.status === 'active').length}</p>
            </div>
            <UserCheck size={32} className="text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Suspendus</p>
              <p className="text-2xl font-bold">{users.filter(u => u.status === 'suspended').length}</p>
            </div>
            <AlertCircle size={32} className="text-yellow-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Fournisseurs</p>
              <p className="text-2xl font-bold">{suppliers.length}</p>
            </div>
            <Package size={32} className="text-purple-200" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Gestion des Rôles</h3>
          <button
            onClick={() => setShowRoleModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            <span>Nouveau Rôle</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {roles.map(role => (
            <div key={role.id} className={`border rounded-lg p-4 ${role.color ? `bg-[${role.color}20]` : 'bg-gray-100'}`}>
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold">{role.name}</h4>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedRoleForEdit(role);
                      setShowRoleModal(true);
                    }}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => deleteRole(role.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p className="text-sm opacity-80 mb-3">{role.description || 'Aucune description'}</p>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  {role.users} utilisateurs
                </span>
                <span className="text-xs bg-white bg-opacity-30 px-2 py-1 rounded-full">
                  {role.permissions.length} permissions
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'users' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Users size={16} />
                <span>Utilisateurs</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'suppliers' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Factory size={16} />
                <span>Fournisseurs</span>
              </div>
            </button>
          </nav>
        </div>

        {activeTab === 'users' ? (
          <>
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Rechercher un utilisateur..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full md:w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tous les rôles</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                    <option value="suspended">Suspendu</option>
                  </select>
                  <select
                    value={selectedEstablishmentType}
                    onChange={(e) => setSelectedEstablishmentType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tous les types</option>
                    {establishmentTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Download size={16} />
                    <span>Exporter</span>
                  </button>
                  <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Upload size={16} />
                    <span>Importer</span>
                  </button>
                  <button
                    onClick={() => {
                      setModalType('add');
                      setSelectedUser(null);
                      setShowModal(true);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={16} />
                    <span>Nouvel utilisateur</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Utilisateur</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Établissement</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Contact</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Rôle</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Statut</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Dernière connexion</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedUsers.length > 0 ? (
                    paginatedUsers.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            {user.avatar ? (
                              <img 
                                src={user.avatar} 
                                alt={user.username}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-800">
                                {safeGetText(user.first_name)} {safeGetText(user.last_name)}
                              </p>
                              <p className="text-sm text-gray-500">@{user.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <p className="font-medium text-gray-800">{user.establishment_name}</p>
                            <div className="flex items-center text-sm text-gray-500">
                              {establishmentTypes.find(t => t.value === user.establishment_type)?.icon || <Store size={16} />}
                              <span className="ml-1">{getEstablishmentType(user.establishment_type)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <p className="text-gray-800">{user.email}</p>
                            <p className="text-sm text-gray-500">{safeGetText(user.phone)}</p>
                            <p className="text-sm text-gray-500">{safeGetText(user.establishment_phone)}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {user.role ? (
                            <span 
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {roles.find(r => r.id === user.role)?.name || 'Rôle inconnu'}
                            </span>
                          ) : (
                            <span className="text-gray-500">Aucun rôle</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            {getStatusIcon(user.status)}
                            <span className="ml-2">{getStatusText(user.status)}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {user.last_login ? (
                            <span className="text-sm text-gray-600">
                              {new Date(user.last_login).toLocaleString('fr-FR')}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">Jamais connecté</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => {
                                setModalType('view');
                                setSelectedUser(user);
                                setShowModal(true);
                              }}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                              title="Voir détails"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => {
                                setModalType('edit');
                                setSelectedUser(user);
                                setShowModal(true);
                              }}
                              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                              title="Modifier"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => deleteUser(user.id)}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500">
                        Aucun utilisateur trouvé
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-600">
                    Affichage de <span className="font-medium">{(currentPage - 1) * usersPerPage + 1}</span> à{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * usersPerPage, filteredUsers.length)}
                    </span>{' '}
                    sur <span className="font-medium">{filteredUsers.length}</span> résultats
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Précédent
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded-lg ${currentPage === page ? 'bg-blue-600 text-white' : 'border border-gray-300 hover:bg-gray-50'}`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="p-6">
              <div className="flex justify-between items-center">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Rechercher un fournisseur..."
                    value={supplierSearchTerm}
                    onChange={(e) => setSupplierSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={() => {
                    setSelectedSupplier(null);
                    setShowSupplierModal(true);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={16} />
                  <span>Nouveau fournisseur</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Fournisseur</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Contact</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Date création</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSuppliers.length > 0 ? (
                    filteredSuppliers.map(supplier => (
                      <tr key={supplier.id} className="hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            {supplier.logo ? (
                              <img 
                                src={supplier.logo} 
                                alt={supplier.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                                {supplier.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-800">{supplier.name}</p>
                              <p className="text-sm text-gray-500">{safeGetText(supplier.address)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {getSupplierType(supplier.types)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-gray-800">{supplier.contact}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-gray-800">{safeGetText(supplier.email)}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm text-gray-600">
                            {new Date(supplier.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => {
                                setSelectedSupplier(supplier);
                                setShowSupplierModal(true);
                              }}
                              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                              title="Modifier"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => deleteSupplier(supplier.id)}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500">
                        Aucun fournisseur trouvé
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {showModal && <UserModal />}
      {showSupplierModal && <SupplierModal />}
      {showRoleModal && <RoleModal />}
    </div>
  );
};

export default UserManagement;