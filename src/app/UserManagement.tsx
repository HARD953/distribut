"use client";
import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Plus, Edit, Trash2, Eye, EyeOff, 
  Shield, MapPin, Calendar, Clock, Phone, Mail, MoreVertical,
  UserCheck, UserX, Settings, Download, Upload, CheckCircle,
  AlertCircle, XCircle, Loader, ChevronDown, ChevronRight
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  location: string;
  join_date: string;
  last_login: string | null;
  permissions: string[];
  avatar: string | null;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  users: number;
  color: string;
}

interface Permission {
  id: string;
  name: string;
  category: string;
}

interface NewUser {
  name: string;
  email: string;
  phone: string;
  role: string;
  location: string;
  permissions: string[];
}

interface NewRole {
  name: string;
  description: string;
  permissions: string[];
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'view' | 'permissions'>('add');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRoleForEdit, setSelectedRoleForEdit] = useState<Role | null>(null);
  const usersPerPage = 10;

  const permissions: Permission[] = [
    { id: 'all', name: 'Accès Complet', category: 'Système' },
    { id: 'users_management', name: 'Gestion Utilisateurs', category: 'Administration' },
    { id: 'roles_management', name: 'Gestion Rôles', category: 'Administration' },
    { id: 'stock_management', name: 'Gestion Stocks', category: 'Opérations' },
    { id: 'orders_management', name: 'Gestion Commandes', category: 'Opérations' },
    { id: 'orders_view', name: 'Consultation Commandes', category: 'Opérations' },
    { id: 'points_vente_management', name: 'Gestion Points de Vente', category: 'Opérations' },
    { id: 'points_vente_view', name: 'Consultation Points de Vente', category: 'Opérations' },
    { id: 'clients_management', name: 'Gestion Clients', category: 'Commercial' },
    { id: 'clients_view', name: 'Consultation Clients', category: 'Commercial' },
    { id: 'finance_management', name: 'Gestion Financière', category: 'Finance' },
    { id: 'payments_view', name: 'Consultation Paiements', category: 'Finance' },
    { id: 'reports_full', name: 'Rapports Complets', category: 'Rapports' },
    { id: 'reports_view', name: 'Consultation Rapports', category: 'Rapports' },
    { id: 'zone_management', name: 'Gestion Zones', category: 'Géographie' }
  ];

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Veuillez vous connecter.');
        setLoading(false);
        return;
      }
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      try {
        setError(null);
        setLoading(true);

        // Fetch Users
        const usersRes = await fetch('http://127.0.0.1:8000/api/users/', { headers });
        if (!usersRes.ok) throw new Error('Échec de la récupération des utilisateurs');
        const usersData = await usersRes.json();
        setUsers(usersData);

        // Fetch Roles
        const rolesRes = await fetch('http://127.0.0.1:8000/api/roles/', { headers });
        if (!rolesRes.ok) throw new Error('Échec de la récupération des rôles');
        const rolesData = await rolesRes.json();
        setRoles(rolesData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone.includes(searchTerm);
    const matchesRole = selectedRole === 'all' || user.role.toLowerCase() === selectedRole.toLowerCase();
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Paginate users
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="text-green-500" size={16} />;
      case 'inactive': return <XCircle className="text-red-500" size={16} />;
      case 'pending': return <AlertCircle className="text-yellow-500" size={16} />;
      default: return <AlertCircle className="text-gray-500" size={16} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'inactive': return 'Inactif';
      case 'pending': return 'En attente';
      default: return 'Inconnu';
    }
  };

  const deleteUser = async (userId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('Veuillez vous connecter.');
      return;
    }
    try {
      setError(null);
      const res = await fetch(`http://127.0.0.1:8000/api/users/${userId}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Échec de la suppression de l\'utilisateur');
      }
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteRole = async (roleId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce rôle ?')) return;
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('Veuillez vous connecter.');
      return;
    }
    try {
      setError(null);
      const res = await fetch(`http://127.0.0.1:8000/api/roles/${roleId}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Échec de la suppression du rôle');
      }
      setRoles(prev => prev.filter(r => r.id !== roleId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const UserModal = () => {
    const [formData, setFormData] = useState<NewUser>({
      name: '',
      email: '',
      phone: '',
      role: '',
      location: '',
      permissions: []
    });
    const [formError, setFormError] = useState<string | null>(null);

    useEffect(() => {
      if (modalType === 'edit' && selectedUser) {
        setFormData({
          name: selectedUser.name,
          email: selectedUser.email,
          phone: selectedUser.phone,
          role: selectedUser.role,
          location: selectedUser.location,
          permissions: selectedUser.permissions
        });
      } else if (modalType === 'add') {
        setFormData({
          name: '',
          email: '',
          phone: '',
          role: '',
          location: '',
          permissions: []
        });
      }
    }, [modalType, selectedUser]);

    const validateForm = () => {
      if (!formData.name.trim()) return 'Le nom est requis.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Email invalide.';
      if (!/^\+?[1-9]\d{1,14}$/.test(formData.phone)) return 'Numéro de téléphone invalide.';
      if (!formData.role) return 'Le rôle est requis.';
      if (!formData.location.trim()) return 'La localisation est requise.';
      return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const validationError = validateForm();
      if (validationError) {
        setFormError(validationError);
        return;
      }
      const token = localStorage.getItem('access_token');
      if (!token) {
        setFormError('Veuillez vous connecter.');
        return;
      }
      try {
        setFormError(null);
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };
        let res;
        if (modalType === 'add') {
          res = await fetch('http://127.0.0.1:8000/api/users/', {
            method: 'POST',
            headers,
            body: JSON.stringify({ ...formData, status: 'pending' })
          });
        } else if (modalType === 'edit') {
          res = await fetch(`http://127.0.0.1:8000/api/users/${selectedUser!.id}/`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(formData)
          });
        }
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.detail || `Échec de ${modalType === 'add' ? 'la création' : 'la mise à jour'} de l'utilisateur`);
        }
        const updatedUser = await res.json();
        setUsers(prev => modalType === 'add' ? [...prev, updatedUser] : prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        setShowModal(false);
      } catch (err: any) {
        setFormError(err.message);
      }
    };

    const togglePermission = (permissionId: string) => {
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.includes(permissionId)
          ? prev.permissions.filter(p => p !== permissionId)
          : [...prev.permissions, permissionId]
      }));
    };

    const permissionsByCategory = permissions.reduce((acc, permission) => {
      if (!acc[permission.category]) acc[permission.category] = [];
      acc[permission.category].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800">
                {modalType === 'add' ? 'Ajouter un utilisateur' : 
                 modalType === 'edit' ? 'Modifier l\'utilisateur' : 
                 modalType === 'view' ? 'Détails de l\'utilisateur' : 'Permissions'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>
          </div>

          {modalType === 'view' && selectedUser ? (
            <div className="p-6 space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {selectedUser.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-800">{selectedUser.name}</h4>
                  <p className="text-gray-600">{selectedUser.role}</p>
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
                    <span>{selectedUser.phone}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin size={16} className="mr-2" />
                    <span>{selectedUser.location}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center text-gray-600">
                    <Calendar size={16} className="mr-2" />
                    <span>Rejoint le {new Date(selectedUser.join_date).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock size={16} className="mr-2" />
                    <span>{selectedUser.last_login ? `Dernière connexion: ${selectedUser.last_login}` : 'Jamais connecté'}</span>
                  </div>
                </div>
              </div>
              <div>
                <h5 className="font-semibold text-gray-800 mb-3">Permissions</h5>
                <div className="flex flex-wrap gap-2">
                  {selectedUser.permissions.map(permId => {
                    const perm = permissions.find(p => p.id === permId);
                    return perm ? (
                      <span key={permId} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {perm.name}
                      </span>
                    ) : null;
                  })}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rôle *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Sélectionner un rôle</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.name}>{role.name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Localisation *</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">Permissions</label>
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
                              onChange={() => togglePermission(permission.id)}
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

  const RoleModal = () => {
    const [formData, setFormData] = useState<NewRole>({
      name: '',
      description: '',
      permissions: []
    });
    const [formError, setFormError] = useState<string | null>(null);

    useEffect(() => {
      if (selectedRoleForEdit) {
        setFormData({
          name: selectedRoleForEdit.name,
          description: selectedRoleForEdit.description,
          permissions: selectedRoleForEdit.permissions
        });
      } else {
        setFormData({
          name: '',
          description: '',
          permissions: []
        });
      }
    }, [selectedRoleForEdit]);

    const validateForm = () => {
      if (!formData.name.trim()) return 'Le nom du rôle est requis.';
      if (!formData.description.trim()) return 'La description est requise.';
      return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const validationError = validateForm();
      if (validationError) {
        setFormError(validationError);
        return;
      }
      const token = localStorage.getItem('access_token');
      if (!token) {
        setFormError('Veuillez vous connecter.');
        return;
      }
      try {
        setFormError(null);
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };
        let res;
        if (selectedRoleForEdit) {
          res = await fetch(`http://127.0.0.1:8000/api/roles/${selectedRoleForEdit.id}/`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(formData)
          });
        } else {
          res = await fetch('http://127.0.0.1:8000/api/roles/', {
            method: 'POST',
            headers,
            body: JSON.stringify(formData)
          });
        }
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.detail || `Échec de ${selectedRoleForEdit ? 'la mise à jour' : 'la création'} du rôle`);
        }
        const updatedRole = await res.json();
        setRoles(prev => selectedRoleForEdit ? 
          prev.map(r => r.id === updatedRole.id ? {...updatedRole, color: prev.find(r => r.id === updatedRole.id)?.color || 'bg-gray-100 text-gray-800 border-gray-200'} : r) : 
          [...prev, {...updatedRole, color: 'bg-blue-100 text-blue-800 border-blue-200'}]);
        setShowRoleModal(false);
        setSelectedRoleForEdit(null);
      } catch (err: any) {
        setFormError(err.message);
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
      if (!acc[permission.category]) acc[permission.category] = [];
      acc[permission.category].push(permission);
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nom du rôle *</label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                <input 
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required 
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
      {/* Header avec statistiques */}
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
              <p className="text-yellow-100 text-sm">En Attente</p>
              <p className="text-2xl font-bold">{users.filter(u => u.status === 'pending').length}</p>
            </div>
            <AlertCircle size={32} className="text-yellow-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Rôles Actifs</p>
              <p className="text-2xl font-bold">{roles.length}</p>
            </div>
            <Shield size={32} className="text-purple-200" />
          </div>
        </div>
      </div>

      {/* Gestion des rôles */}
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
            <div key={role.id} className={`border rounded-lg p-4 ${role.color}`}>
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
              <p className="text-sm opacity-80 mb-3">{role.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{role.users} utilisateurs</span>
                <span className="text-xs bg-white bg-opacity-30 px-2 py-1 rounded-full">
                  {role.permissions.length} permissions
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
                <option key={role.id} value={role.name}>{role.name}</option>
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
              <option value="pending">En attente</option>
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

      {/* Table des utilisateurs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Utilisateur</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Contact</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Rôle</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Statut</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Localisation</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Dernière connexion</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedUsers.length > 0 ? paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{user.name}</p>
                        <p className="text-sm text-gray-600">ID: {user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail size={14} className="mr-2" />
                        {user.email}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone size={14} className="mr-2" />
                        {user.phone}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      roles.find(r => r.name === user.role)?.color || 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(user.status)}
                      <span className="text-sm font-medium">{getStatusText(user.status)}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin size={14} className="mr-1" />
                      {user.location}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm text-gray-600">
                      {user.last_login ? (
                        <div className="flex items-center">
                          <Clock size={14} className="mr-1 text-green-500" />
                          {user.last_login}
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Clock size={14} className="mr-1 text-gray-400" />
                          Jamais connecté
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setModalType('view');
                          setSelectedUser(user);
                          setShowModal(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Voir les détails"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setModalType('edit');
                          setSelectedUser(user);
                          setShowModal(true);
                        }}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setModalType('permissions');
                          setSelectedUser(user);
                          setShowModal(true);
                        }}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Gérer les permissions"
                      >
                        <Shield size={16} />
                      </button>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <Users className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Aucun utilisateur trouvé</h3>
                    <p className="text-gray-600 mb-6">
                      {searchTerm || selectedRole !== 'all' || selectedStatus !== 'all'
                        ? 'Aucun utilisateur ne correspond aux critères.'
                        : 'Commencez par créer votre premier utilisateur.'}
                    </p>
                    {(!searchTerm && selectedRole === 'all' && selectedStatus === 'all') && (
                      <button 
                        onClick={() => {
                          setModalType('add');
                          setSelectedUser(null);
                          setShowModal(true);
                        }}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2 shadow-md"
                      >
                        <Plus size={16} />
                        Créer un Utilisateur
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Affichage de {(currentPage - 1) * usersPerPage + 1} à {Math.min(currentPage * usersPerPage, filteredUsers.length)} sur {filteredUsers.length} utilisateurs
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Précédent
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Actions rapides */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
        <h3 className="text-lg font-semibold mb-4">Actions Rapides</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 transition-colors">
            <UserCheck size={24} className="mb-2" />
            <p className="font-medium">Activer les utilisateurs en attente</p>
            <p className="text-sm opacity-80">Valider {users.filter(u => u.status === 'pending').length} comptes</p>
          </button>
          <button className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 transition-colors">
            <Shield size={24} className="mb-2" />
            <p className="font-medium">Audit des permissions</p>
            <p className="text-sm opacity-80">Vérifier les droits d'accès</p>
          </button>
          <button className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 transition-colors">
            <Settings size={24} className="mb-2" />
            <p className="font-medium">Configuration système</p>
            <p className="text-sm opacity-80">Paramètres de sécurité</p>
          </button>
        </div>
      </div>

      {/* Modals */}
      {showModal && <UserModal />}
      {showRoleModal && <RoleModal />}
    </div>
  );
};

export default UserManagement;