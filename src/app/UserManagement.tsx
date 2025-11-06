"use client";
import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Plus, Edit, Trash2, Eye, 
  Shield, Calendar, Clock, Phone, Mail, 
  UserCheck, UserX, Settings, Download, Upload, CheckCircle,
  AlertCircle, XCircle, Loader, ChevronDown, ChevronRight,
  MapPin, Bike, ShoppingCart, Store, Truck, User as UserIcon,
  Package, Factory, X, Building2, BadgePercent, CreditCard,
  BarChart3, FileText, MoreVertical, ArrowUpDown, TrendingUp,
  EyeOff, MailCheck, PhoneCall, MapPinCheck
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
  phone?: string;
  email?: string;
  address?: string;
  registration_date?: string;
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
  points_of_sale: (PointOfSale | number)[];
  establishment_registration_date?: string;
  role_name?: string;
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

// Helper functions
const safeGetStatus = (status?: string): 'active' | 'inactive' | 'suspended' => 
  status && ['active', 'inactive', 'suspended'].includes(status) 
    ? status as 'active' | 'inactive' | 'suspended' 
    : 'inactive';

const safeGetText = (text?: string | null, fallback = '-'): string => text || fallback;
const safeLowerCase = (text?: string): string => (text || '').toLowerCase();

interface UserModalProps {
  show: boolean;
  onClose: () => void;
  modalType: 'add' | 'edit' | 'view';
  selectedUser: User | null;
  roles: Role[];
  pointsOfSale: PointOfSale[];
  onUserUpdated: (user: User, type: 'add' | 'edit' | 'view') => void;
}

const UserModal: React.FC<UserModalProps> = ({ 
  show, 
  onClose, 
  modalType, 
  selectedUser, 
  roles, 
  pointsOfSale,
  onUserUpdated 
}) => {
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const establishmentTypes = [
    { value: 'Boutique', label: 'Boutique', icon: <Store size={16} /> },
    { value: 'supermarche', label: 'Supermarché', icon: <ShoppingCart size={16} /> },
    { value: 'superette', label: 'Supérette', icon: <Store size={16} /> },
    { value: 'epicerie', label: 'Épicerie', icon: <Store size={16} /> },
    { value: 'demi_grossiste', label: 'Demi-Grossiste', icon: <Truck size={16} /> },
    { value: 'grossiste', label: 'Grossiste', icon: <Truck size={16} /> },
    { value: 'mobile_vendor', label: 'Vendeur ambulant', icon: <Bike size={16} /> },
  ];

  useEffect(() => {
    if (show) {
      if (modalType === 'edit' && selectedUser) {
        const newFormData = {
          user: {
            username: selectedUser.username,
            email: selectedUser.email,
            first_name: selectedUser.first_name || '',
            last_name: selectedUser.last_name || '',
            password: '',
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
          points_of_sale_ids: Array.isArray(selectedUser.points_of_sale) 
            ? selectedUser.points_of_sale
                .map(pos => {
                  if (typeof pos === 'object' && pos !== null && 'id' in pos) {
                    return pos.id.toString();
                  }
                  return pos?.toString() || '';
                })
                .filter(id => id !== '')
            : []
        };
        setFormData(newFormData);
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
      setFormError(null);
    }
  }, [show, modalType, selectedUser]);

  const getStatusIcon = (status?: string) => {
    switch (safeGetStatus(status)) {
      case 'active': return <CheckCircle className="text-emerald-500" size={16} />;
      case 'inactive': return <XCircle className="text-rose-500" size={16} />;
      case 'suspended': return <AlertCircle className="text-amber-500" size={16} />;
      default: return <AlertCircle className="text-slate-500" size={16} />;
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

  const handleUserFieldChange = (field: keyof NewUser['user'], value: string) => {
    setFormData(prev => ({
      ...prev,
      user: {
        ...prev.user,
        [field]: value
      }
    }));
  };

  const handleDirectFieldChange = (field: keyof Omit<NewUser, 'user' | 'avatar'>, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStatusChange = (value: 'active' | 'inactive' | 'suspended') => {
    setFormData(prev => ({
      ...prev,
      status: value
    }));
  };

  const validateForm = () => {
    if (!formData.user.username?.trim()) {
      return 'Le nom d\'utilisateur est requis.';
    }
    if (!formData.user.email?.trim()) {
      return 'L\'email est requis.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.user.email)) {
      return 'Format d\'email invalide.';
    }
    if (modalType === 'add' && !formData.user.password?.trim()) {
      return 'Le mot de passe est requis pour un nouvel utilisateur.';
    }
    if (!formData.role) {
      return 'Le rôle est requis.';
    }
    if (!formData.establishment_name?.trim()) {
      return 'Le nom de l\'établissement est requis.';
    }
    if (!formData.establishment_type?.trim()) {
      return 'Le type d\'établissement est requis.';
    }
    if (!formData.establishment_address?.trim()) {
      return 'L\'adresse de l\'établissement est requise.';
    }
    return null;
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, avatar: file }));
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handlePointsOfSaleChange = (posId: string, isChecked: boolean) => {
    setFormData(prev => ({
      ...prev,
      points_of_sale_ids: isChecked
        ? [...(prev.points_of_sale_ids || []), posId]
        : (prev.points_of_sale_ids || []).filter(id => id !== posId)
    }));
  };

  const getPointOfSaleName = (posId: string | number) => {
    const pointOfSale = pointsOfSale.find(p => p.id.toString() === posId.toString());
    return pointOfSale?.name || `Point de vente ${posId}`;
  };

  const getPointOfSaleType = (posId: string | number) => {
    const pointOfSale = pointsOfSale.find(p => p.id.toString() === posId.toString());
    return pointOfSale?.type || 'Non spécifié';
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
      setIsSubmitting(true);
      
      let dataToSend: any;
      
      if (modalType === 'edit' && selectedUser) {
        dataToSend = {
          user: {
            ...(formData.user.username !== selectedUser.username && { 
              username: formData.user.username 
            }),
            email: formData.user.email,
            first_name: formData.user.first_name || '',
            last_name: formData.user.last_name || '',
          },
          phone: formData.phone || '',
          location: formData.location || '',
          status: formData.status,
          role_id: formData.role || '',
          establishment_name: formData.establishment_name,
          establishment_type: formData.establishment_type,
          establishment_address: formData.establishment_address,
          establishment_phone: formData.establishment_phone || '',
          establishment_email: formData.establishment_email || '',
          points_of_sale: formData.points_of_sale_ids || [],
        };
      } else {
        dataToSend = {
          user: {
            username: formData.user.username,
            email: formData.user.email,
            first_name: formData.user.first_name || '',
            last_name: formData.user.last_name || '',
            password: formData.user.password || '',
          },
          phone: formData.phone || '',
          location: formData.location || '',
          status: formData.status,
          role_id: formData.role || '',
          establishment_name: formData.establishment_name,
          establishment_type: formData.establishment_type,
          establishment_address: formData.establishment_address,
          establishment_phone: formData.establishment_phone || '',
          establishment_email: formData.establishment_email || '',
          points_of_sale: formData.points_of_sale_ids || [],
        };
      }

      let res;
      if (modalType === 'edit' && selectedUser) {
        res = await apiService.updateUser(selectedUser.id, dataToSend);
      } else {
        res = await apiService.createUser(dataToSend);
      }

      if (!res.ok) {
        const errorData = await res.json();
        let errorMessage = errorData?.detail || errorData?.message;
        if (!errorMessage && errorData) {
          for (const key in errorData) {
            if (Array.isArray(errorData[key])) {
              errorMessage = errorData[key].join(', ');
              break;
            }
          }
        }
        throw new Error(errorMessage || `Échec de ${modalType === 'edit' ? 'modification' : 'création'}`);
      }

      const updatedUser = await res.json();
      onUserUpdated(updatedUser, modalType);
      onClose();
      
    } catch (err: any) {
      if (err.message !== 'Session expired') {
        setFormError(err.message || 'Une erreur est survenue lors de l\'enregistrement');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div>
            <h3 className="text-xl font-bold text-slate-800">
              {modalType === 'add' ? 'Nouvel Utilisateur' : 
               modalType === 'edit' ? 'Modifier l\'Utilisateur' : 
               'Détails de l\'Utilisateur'}
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              {modalType === 'view' ? 'Informations complètes' : 'Remplissez les informations ci-dessous'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {modalType === 'view' && selectedUser ? (
          <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
            <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-xl">
              {selectedUser.avatar ? (
                <img 
                  src={selectedUser.avatar} 
                  alt={selectedUser.username}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-sm">
                  {selectedUser.username.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-slate-800">
                  {safeGetText(selectedUser.first_name)} {safeGetText(selectedUser.last_name)}
                </h4>
                <p className="text-slate-600">@{selectedUser.username}</p>
                <div className="flex items-center mt-2 space-x-4">
                  <div className="flex items-center">
                    {getStatusIcon(selectedUser.status)}
                    <span className="ml-2 text-sm font-medium">{getStatusText(selectedUser.status)}</span>
                  </div>
                  <div className="flex items-center text-slate-500 text-sm">
                    <Calendar size={14} className="mr-1" />
                    <span>Rejoint le {new Date(selectedUser.join_date).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h5 className="font-semibold text-slate-800 flex items-center">
                  <UserIcon size={16} className="mr-2 text-blue-500" />
                  Informations Personnelles
                </h5>
                <div className="space-y-3">
                  <div className="flex items-center p-3 bg-slate-50 rounded-lg">
                    <Mail size={16} className="text-slate-400 mr-3" />
                    <div>
                      <p className="text-sm text-slate-500">Email</p>
                      <p className="text-slate-800">{selectedUser.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-slate-50 rounded-lg">
                    <Phone size={16} className="text-slate-400 mr-3" />
                    <div>
                      <p className="text-sm text-slate-500">Téléphone</p>
                      <p className="text-slate-800">{safeGetText(selectedUser.phone)}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-slate-50 rounded-lg">
                    <MapPin size={16} className="text-slate-400 mr-3" />
                    <div>
                      <p className="text-sm text-slate-500">Localisation</p>
                      <p className="text-slate-800">{safeGetText(selectedUser.location)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h5 className="font-semibold text-slate-800 flex items-center">
                  <Shield size={16} className="mr-2 text-purple-500" />
                  Rôle et Accès
                </h5>
                <div className="space-y-3">
                  <div className="flex items-center p-3 bg-slate-50 rounded-lg">
                    <BadgePercent size={16} className="text-slate-400 mr-3" />
                    <div>
                      <p className="text-sm text-slate-500">Rôle</p>
                      <p className="text-slate-800">{selectedUser.role_name || roles.find(r => r.id === selectedUser.role)?.name || 'Aucun rôle'}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-slate-50 rounded-lg">
                    <Clock size={16} className="text-slate-400 mr-3" />
                    <div>
                      <p className="text-sm text-slate-500">Dernière connexion</p>
                      <p className="text-slate-800">
                        {selectedUser.last_login ? 
                          new Date(selectedUser.last_login).toLocaleString('fr-FR') : 
                          'Jamais connecté'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h5 className="font-semibold text-slate-800 flex items-center">
                <Building2 size={16} className="mr-2 text-emerald-500" />
                Informations de l'Établissement
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-500">Nom</p>
                    <p className="text-slate-800 font-medium">{selectedUser.establishment_name}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-500">Type</p>
                    <div className="flex items-center">
                      {establishmentTypes.find(t => t.value === selectedUser.establishment_type)?.icon || <Store size={16} />}
                      <span className="ml-2 text-slate-800">{getEstablishmentType(selectedUser.establishment_type)}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-500">Contact</p>
                    <p className="text-slate-800">{safeGetText(selectedUser.establishment_phone)}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-500">Email</p>
                    <p className="text-slate-800">{safeGetText(selectedUser.establishment_email)}</p>
                  </div>
                </div>
                <div className="md:col-span-2 p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">Adresse</p>
                  <p className="text-slate-800">{selectedUser.establishment_address}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="font-semibold text-slate-800 flex items-center">
                <Store size={16} className="mr-2 text-orange-500" />
                Points de Vente Associés
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedUser.points_of_sale && selectedUser.points_of_sale.length > 0 ? (
                  selectedUser.points_of_sale.map((pos, index) => {
                    const posId = typeof pos === 'object' && pos !== null && 'id' in pos ? pos.id : pos;
                    const posName = typeof pos === 'object' && pos !== null && 'name' in pos 
                      ? pos.name 
                      : getPointOfSaleName(posId);
                    const posType = typeof pos === 'object' && pos !== null && 'type' in pos 
                      ? pos.type 
                      : getPointOfSaleType(posId);
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <Store size={16} className="text-blue-600" />
                          </div>
                          <div>
                            <span className="font-medium text-slate-800">{posName}</span>
                            {posType && <span className="text-sm text-slate-500 ml-2">({posType})</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-2 text-center py-8 text-slate-500 bg-slate-50 rounded-xl">
                    <Store size={32} className="mx-auto mb-2 text-slate-300" />
                    <p>Aucun point de vente associé</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
            {formError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
                <div className="flex items-center">
                  <AlertCircle size={16} className="text-rose-500 mr-2" />
                  <span className="text-rose-700 text-sm">{formError}</span>
                </div>
              </div>
            )}
            
            <div className="space-y-6">
              <div>
                <h5 className="font-semibold text-slate-800 mb-4 flex items-center">
                  <UserIcon size={16} className="mr-2 text-blue-500" />
                  Informations du Compte
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Nom d'utilisateur *</label>
                    <input
                      type="text"
                      value={formData.user.username}
                      onChange={(e) => handleUserFieldChange('username', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
                    <input
                      type="email"
                      value={formData.user.email}
                      onChange={(e) => handleUserFieldChange('email', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Prénom</label>
                    <input
                      type="text"
                      value={formData.user.first_name || ''}
                      onChange={(e) => handleUserFieldChange('first_name', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Nom</label>
                    <input
                      type="text"
                      value={formData.user.last_name || ''}
                      onChange={(e) => handleUserFieldChange('last_name', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  {modalType === 'add' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Mot de passe *</label>
                      <input
                        type="password"
                        value={formData.user.password || ''}
                        onChange={(e) => handleUserFieldChange('password', e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        required
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Téléphone personnel</label>
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => handleDirectFieldChange('phone', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Localisation personnelle</label>
                    <input
                      type="text"
                      value={formData.location || ''}
                      onChange={(e) => handleDirectFieldChange('location', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Rôle *</label>
                    <select
                      value={formData.role || ''}
                      onChange={(e) => handleDirectFieldChange('role', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
                      required
                    >
                      <option value="">Sélectionner un rôle</option>
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Statut *</label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleStatusChange(e.target.value as 'active' | 'inactive' | 'suspended')}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
                      required
                    >
                      <option value="active">Actif</option>
                      <option value="inactive">Inactif</option>
                      <option value="suspended">Suspendu</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="pt-6 border-t border-slate-200">
                <h5 className="font-semibold text-slate-800 mb-4 flex items-center">
                  <Building2 size={16} className="mr-2 text-emerald-500" />
                  Informations de l'Établissement
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Nom de l'établissement *</label>
                    <input
                      type="text"
                      value={formData.establishment_name}
                      onChange={(e) => handleDirectFieldChange('establishment_name', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Type d'établissement *</label>
                    <select
                      value={formData.establishment_type}
                      onChange={(e) => handleDirectFieldChange('establishment_type', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
                      required
                    >
                      {establishmentTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Téléphone établissement</label>
                    <input
                      type="tel"
                      value={formData.establishment_phone || ''}
                      onChange={(e) => handleDirectFieldChange('establishment_phone', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email établissement</label>
                    <input
                      type="email"
                      value={formData.establishment_email || ''}
                      onChange={(e) => handleDirectFieldChange('establishment_email', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Adresse établissement *</label>
                    <textarea
                      value={formData.establishment_address}
                      onChange={(e) => handleDirectFieldChange('establishment_address', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      rows={3}
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="pt-6 border-t border-slate-200">
                <h5 className="font-semibold text-slate-800 mb-4 flex items-center">
                  <Store size={16} className="mr-2 text-orange-500" />
                  Points de Vente Associés
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {pointsOfSale.map((pos) => (
                    <label 
                      key={pos.id} 
                      className="flex items-center space-x-3 p-3 border border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.points_of_sale_ids?.includes(pos.id.toString()) || false}
                        onChange={(e) => handlePointsOfSaleChange(pos.id.toString(), e.target.checked)}
                        className="rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <span className="font-medium text-slate-800">{pos.name}</span>
                        {pos.type && <span className="text-sm text-slate-500 ml-2">({pos.type})</span>}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="pt-6 border-t border-slate-200">
                <h5 className="font-semibold text-slate-800 mb-4 flex items-center">
                  <UserIcon size={16} className="mr-2 text-purple-500" />
                  Photo de Profil
                </h5>
                <div className="flex items-center space-x-6">
                  <div className="flex-shrink-0">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar Preview" className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-sm" />
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl flex items-center justify-center text-slate-500">
                        <UserIcon size={24} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Avatar</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <span>{modalType === 'add' ? 'Créer l\'Utilisateur' : 'Modifier'}</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// SupplierModal Component
interface SupplierModalProps {
  show: boolean;
  onClose: () => void;
  selectedSupplier: Supplier | null;
  onSupplierUpdated: (supplier: Supplier, type: 'add' | 'edit') => void;
}

const SupplierModal: React.FC<SupplierModalProps> = ({ 
  show, 
  onClose, 
  selectedSupplier, 
  onSupplierUpdated 
}) => {
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supplierTypes = [
    { value: 'importateur', label: 'Importateur' },
    { value: 'producteur_local', label: 'Producteur local' },
    { value: 'distributeur', label: 'Distributeur' },
    { value: 'fabricant', label: 'Fabricant' },
    { value: 'grossiste', label: 'Grossiste' },
  ];

  useEffect(() => {
    if (show) {
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
      setFormError(null);
    }
  }, [show, selectedSupplier]);

  const validateForm = () => {
    if (!formData.name.trim()) return 'Le nom du fournisseur est requis.';
    if (!formData.types.trim()) return 'Le type de fournisseur est requis.';
    if (!formData.contact.trim()) return 'Le contact est requis.';
    if (!formData.email.trim()) return 'L\'email est requis.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return 'Format d\'email invalide.';
    }
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
      setIsSubmitting(true);
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
        res = await apiService.updateResource('/suppliers', selectedSupplier.id, formDataToSend, true);
      } else {
        res = await apiService.createResource('/suppliers', formDataToSend, true);
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.detail || errorData?.message || `Failed to ${selectedSupplier ? 'update' : 'create'} supplier`);
      }
      const updatedSupplier = await res.json();
      onSupplierUpdated(updatedSupplier, selectedSupplier ? 'edit' : 'add');
      onClose();
    } catch (err: any) {
      if (err.message !== 'Session expired') {
        setFormError(err.message || 'Une erreur est survenue');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div>
            <h3 className="text-xl font-bold text-slate-800">
              {selectedSupplier ? 'Modifier le Fournisseur' : 'Nouveau Fournisseur'}
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              {selectedSupplier ? 'Mettez à jour les informations' : 'Ajoutez un nouveau fournisseur'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {formError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
              <div className="flex items-center">
                <AlertCircle size={16} className="text-rose-500 mr-2" />
                <span className="text-rose-700 text-sm">{formError}</span>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nom du fournisseur *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Type *</label>
              <select
                value={formData.types}
                onChange={(e) => setFormData({...formData, types: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
                required
              >
                <option value="">Sélectionner un type</option>
                {supplierTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Contact *</label>
              <input
                type="text"
                value={formData.contact}
                onChange={(e) => setFormData({...formData, contact: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Adresse</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                rows={3}
              />
            </div>
          </div>
          
          <div className="pt-6 border-t border-slate-200">
            <h5 className="font-semibold text-slate-800 mb-4 flex items-center">
              <FileText size={16} className="mr-2 text-purple-500" />
              Logo du Fournisseur
            </h5>
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo Preview" className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-sm" />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl flex items-center justify-center text-slate-500">
                    <Building2 size={24} />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-2">Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <span>{selectedSupplier ? 'Modifier' : 'Créer le Fournisseur'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// RoleModal Component
interface RoleModalProps {
  show: boolean;
  onClose: () => void;
  selectedRole: Role | null;
  permissions: Permission[];
  onRoleUpdated: (role: Role, type: 'add' | 'edit') => void;
}

const RoleModal: React.FC<RoleModalProps> = ({ 
  show, 
  onClose, 
  selectedRole, 
  permissions, 
  onRoleUpdated 
}) => {
  const [formData, setFormData] = useState<NewRole>({
    id: '',
    name: '',
    description: '',
    permissions: []
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (show) {
      if (selectedRole) {
        setFormData({
          id: selectedRole.id,
          name: selectedRole.name,
          description: selectedRole.description || '',
          permissions: selectedRole.permissions.map(p => p.id)
        });
      } else {
        setFormData({
          id: '',
          name: '',
          description: '',
          permissions: []
        });
      }
      setFormError(null);
    }
  }, [show, selectedRole]);

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
      setIsSubmitting(true);
      const data = {
        id: formData.id,
        name: formData.name,
        description: formData.description,
        permissions: formData.permissions
      };
      let res;
      if (selectedRole) {
        res = await apiService.updateResource('roles', selectedRole.id, data);
      } else {
        res = await apiService.createRole(data);
      }
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.detail || `Failed to ${selectedRole ? 'update' : 'create'} role`);
      }
      const updatedRole = await res.json();
      onRoleUpdated(updatedRole, selectedRole ? 'edit' : 'add');
      onClose();
    } catch (err: any) {
      if (err.message !== 'Session expired') {
        setFormError(err.message || 'Une erreur est survenue');
      }
    } finally {
      setIsSubmitting(false);
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

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div>
            <h3 className="text-xl font-bold text-slate-800">
              {selectedRole ? 'Modifier le Rôle' : 'Nouveau Rôle'}
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              {selectedRole ? 'Mettez à jour le rôle et ses permissions' : 'Créez un nouveau rôle système'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {formError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
              <div className="flex items-center">
                <AlertCircle size={16} className="text-rose-500 mr-2" />
                <span className="text-rose-700 text-sm">{formError}</span>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">ID du rôle *</label>
              <input 
                type="text"
                value={formData.id}
                onChange={(e) => setFormData({...formData, id: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required 
                disabled={!!selectedRole}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nom du rôle *</label>
              <input 
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required 
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <input 
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Description du rôle..."
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200">
            <h5 className="font-semibold text-slate-800 mb-4 flex items-center">
              <Shield size={16} className="mr-2 text-purple-500" />
              Permissions du Rôle
            </h5>
            <div className="space-y-4">
              {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
                <div key={category} className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                  <h6 className="font-semibold text-slate-800 mb-3 text-sm uppercase tracking-wide">{category}</h6>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {categoryPermissions.map(permission => (
                      <label key={permission.id} className="flex items-center space-x-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(permission.id)}
                          onChange={() => toggleRolePermission(permission.id)}
                          className="rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <span className="text-sm font-medium text-slate-800">{permission.name}</span>
                          {permission.description && (
                            <p className="text-xs text-slate-500 mt-1">{permission.description}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors font-medium"
            >
              Annuler
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  <span>Enregistrement...</span>
                </>               ) : (
                <span>{selectedRole ? 'Modifier' : 'Créer le Rôle'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main UserManagement Component
// Main UserManagement Component
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
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedRoleForEdit, setSelectedRoleForEdit] = useState<Role | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'suppliers'>('users');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
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

        setUsers(usersData.map((user: any) => ({
          id: user.id,
          username: user.user?.username || user.username || '',
          email: user.user?.email || user.email || '',
          first_name: user.user?.first_name || user.first_name || '',
          last_name: user.user?.last_name || user.last_name || '',
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
          establishment_registration_date: user.establishment_registration_date || '',
          role_name: user.role_name || ''
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
          setError(err.message || 'Une erreur est survenue lors du chargement des données');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Déplacer filteredUsers AVANT sortedUsers
  const filteredUsers = React.useMemo(() => {
    return users.filter(user => {
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
  }, [users, searchTerm, selectedRole, selectedStatus, selectedEstablishmentType]);

  // Fonction de tri
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedUsers = React.useMemo(() => {
    if (!sortConfig) return filteredUsers;
    
    return [...filteredUsers].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof User];
      const bValue = b[sortConfig.key as keyof User];
      
      if (aValue === undefined || bValue === undefined) return 0;
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredUsers, sortConfig]);

  const filteredSuppliers = React.useMemo(() => {
    const searchTermLower = safeLowerCase(supplierSearchTerm);
    return suppliers.filter(supplier => 
      safeLowerCase(supplier.name).includes(searchTermLower) ||
      safeLowerCase(supplier.email).includes(searchTermLower) ||
      safeLowerCase(supplier.contact).includes(searchTermLower) ||
      safeLowerCase(supplier.address).includes(searchTermLower)
    );
  }, [suppliers, supplierSearchTerm]);

  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );
  const totalPages = Math.ceil(sortedUsers.length / usersPerPage) || 1;

  const getStatusIcon = (status?: string) => {
    switch (safeGetStatus(status)) {
      case 'active': return <CheckCircle className="text-emerald-500" size={16} />;
      case 'inactive': return <XCircle className="text-rose-500" size={16} />;
      case 'suspended': return <AlertCircle className="text-amber-500" size={16} />;
      default: return <AlertCircle className="text-slate-500" size={16} />;
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
    const supplierTypes = [
      { value: 'importateur', label: 'Importateur' },
      { value: 'producteur_local', label: 'Producteur local' },
      { value: 'distributeur', label: 'Distributeur' },
      { value: 'fabricant', label: 'Fabricant' },
      { value: 'grossiste', label: 'Grossiste' },
    ];
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
        setError(err.message || 'Erreur lors de la suppression de l\'utilisateur');
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
        setError(err.message || 'Erreur lors de la suppression du fournisseur');
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
        setError(err.message || 'Erreur lors de la suppression du rôle');
      }
    }
  };

  const handleUserUpdated = (updatedUser: User, type: 'add' | 'edit' | 'view') => {
    if (type === 'edit') {
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    } else if (type === 'add') {
      setUsers(prev => [...prev, updatedUser]);
    }
  };

  const handleSupplierUpdated = (updatedSupplier: Supplier, type: 'add' | 'edit') => {
    if (type === 'edit') {
      setSuppliers(prev => prev.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
    } else {
      setSuppliers(prev => [...prev, updatedSupplier]);
    }
  };

  const handleRoleUpdated = (updatedRole: Role, type: 'add' | 'edit') => {
    if (type === 'edit') {
      setRoles(prev => prev.map(r => r.id === updatedRole.id ? updatedRole : r));
    } else {
      setRoles(prev => [...prev, updatedRole]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader className="animate-spin text-blue-600 mx-auto mb-4" size={32} />
          <p className="text-slate-600 font-medium">Chargement des données...</p>
        </div>
      </div>
    );
  }

  // Le reste du code reste inchangé...
  return (
    <div className="space-y-6 p-6">
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
          <div className="flex items-center">
            <AlertCircle size={20} className="mr-3" />
            <span>{error}</span>
          </div>
        </div>
      )}
      
      {/* Cartes de statistiques améliorées */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Utilisateurs</p>
              <p className="text-2xl font-bold mt-1">{users.length}</p>
              <div className="flex items-center mt-2 text-blue-200 text-sm">
                <TrendingUp size={14} className="mr-1" />
                <span>+12% ce mois</span>
              </div>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Users size={24} className="text-blue-100" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Utilisateurs Actifs</p>
              <p className="text-2xl font-bold mt-1">{users.filter(u => u.status === 'active').length}</p>
              <div className="flex items-center mt-2 text-emerald-200 text-sm">
                <UserCheck size={14} className="mr-1" />
                <span>{Math.round((users.filter(u => u.status === 'active').length / users.length) * 100)}% actifs</span>
              </div>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <UserCheck size={24} className="text-emerald-100" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">Comptes Suspendus</p>
              <p className="text-2xl font-bold mt-1">{users.filter(u => u.status === 'suspended').length}</p>
              <div className="flex items-center mt-2 text-amber-200 text-sm">
                <AlertCircle size={14} className="mr-1" />
                <span>Nécessite attention</span>
              </div>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <UserX size={24} className="text-amber-100" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Fournisseurs</p>
              <p className="text-2xl font-bold mt-1">{suppliers.length}</p>
              <div className="flex items-center mt-2 text-purple-200 text-sm">
                <Package size={14} className="mr-1" />
                <span>Partenaires actifs</span>
              </div>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Factory size={24} className="text-purple-100" />
            </div>
          </div>
        </div>
      </div>

      {/* Le reste du composant reste identique... */}
      {/* Section Gestion des Rôles */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Gestion des Rôles</h3>
            <p className="text-slate-600 text-sm mt-1">Configurez les rôles et permissions système</p>
          </div>
          <button
            onClick={() => {
              setSelectedRoleForEdit(null);
              setShowRoleModal(true);
            }}
            className="mt-4 lg:mt-0 flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow-md font-medium"
          >
            <Plus size={16} />
            <span>Nouveau Rôle</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {roles.map((role) => (
            <div 
              key={role.id} 
              className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors bg-white group"
            >
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold text-slate-800">{role.name}</h4>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setSelectedRoleForEdit(role);
                      setShowRoleModal(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Modifier"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => deleteRole(role.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-4 line-clamp-2">{role.description || 'Aucune description'}</p>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700">
                  {role.users} utilisateur{role.users !== 1 ? 's' : ''}
                </span>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-medium">
                  {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation par onglets améliorée */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'users' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Users size={18} />
                <span>Gestion des Utilisateurs</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'suppliers' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Factory size={18} />
                <span>Gestion des Fournisseurs</span>
              </div>
            </button>
          </nav>
        </div>

        {activeTab === 'users' ? (
          <>
            {/* En-tête des utilisateurs avec recherche et filtres */}
            <div className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      placeholder="Rechercher un utilisateur..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-3 w-full sm:w-64 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="px-3 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
                    >
                      <option value="all">Tous les rôles</option>
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="px-3 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
                    >
                      <option value="all">Tous les statuts</option>
                      <option value="active">Actif</option>
                      <option value="inactive">Inactif</option>
                      <option value="suspended">Suspendu</option>
                    </select>
                    <select
                      value={selectedEstablishmentType}
                      onChange={(e) => setSelectedEstablishmentType(e.target.value)}
                      className="px-3 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
                    >
                      <option value="all">Tous les types</option>
                      {establishmentTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="flex items-center space-x-2 px-4 py-3 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors text-slate-700 font-medium">
                    <Download size={16} />
                    <span>Exporter</span>
                  </button>
                  <button className="flex items-center space-x-2 px-4 py-3 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors text-slate-700 font-medium">
                    <Upload size={16} />
                    <span>Importer</span>
                  </button>
                  <button
                    onClick={() => {
                      setModalType('add');
                      setSelectedUser(null);
                      setShowModal(true);
                    }}
                    className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow-md font-medium"
                  >
                    <Plus size={16} />
                    <span>Nouvel Utilisateur</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tableau des utilisateurs amélioré */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-y border-slate-200">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm uppercase tracking-wide">
                      <button 
                        onClick={() => handleSort('username')}
                        className="flex items-center space-x-1 hover:text-slate-800 transition-colors"
                      >
                        <span>Utilisateur</span>
                        <ArrowUpDown size={14} className="text-slate-400" />
                      </button>
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm uppercase tracking-wide">
                      Établissement
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm uppercase tracking-wide">
                      Contact
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm uppercase tracking-wide">
                      Rôle
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm uppercase tracking-wide">
                      Statut
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm uppercase tracking-wide">
                      Dernière connexion
                    </th>
                    <th className="text-right py-4 px-6 font-semibold text-slate-700 text-sm uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {paginatedUsers.length > 0 ? (
                    paginatedUsers.map(user => (
                      <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            {user.avatar ? (
                              <img 
                                src={user.avatar} 
                                alt={user.username}
                                className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                                {user.username?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-slate-800">
                                {safeGetText(user.first_name)} {safeGetText(user.last_name)}
                              </p>
                              <p className="text-sm text-slate-500">@{user.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            <p className="font-medium text-slate-800">{user.establishment_name}</p>
                            <div className="flex items-center text-sm text-slate-500">
                              {establishmentTypes.find(t => t.value === user.establishment_type)?.icon || <Store size={14} />}
                              <span className="ml-1">{getEstablishmentType(user.establishment_type)}</span>
                            </div>
                            {user.points_of_sale && user.points_of_sale.length > 0 && (
                              <div className="mt-1">
                                <p className="text-xs text-slate-500">
                                  {user.points_of_sale.length} point{user.points_of_sale.length !== 1 ? 's' : ''} de vente
                                </p>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            <p className="text-slate-800 font-medium">{user.email}</p>
                            <p className="text-sm text-slate-500">{safeGetText(user.phone)}</p>
                            <p className="text-sm text-slate-500">{safeGetText(user.establishment_phone)}</p>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {user.role ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {user.role_name || roles.find(r => r.id === user.role)?.name || 'Rôle inconnu'}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-sm">Aucun rôle</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            {getStatusIcon(user.status)}
                            <span className="ml-2 font-medium text-slate-700">{getStatusText(user.status)}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {user.last_login ? (
                            <span className="text-sm text-slate-600">
                              {new Date(user.last_login).toLocaleString('fr-FR')}
                            </span>
                          ) : (
                            <span className="text-sm text-slate-400">Jamais connecté</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setModalType('view');
                                setSelectedUser(user);
                                setShowModal(true);
                              }}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Voir détails"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setModalType('edit');
                                setSelectedUser(user);
                                setShowModal(true);
                              }}
                              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => deleteUser(user.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <div className="text-slate-400">
                          <Users size={48} className="mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium text-slate-500">Aucun utilisateur trouvé</p>
                          <p className="text-sm text-slate-400 mt-1">
                            Aucun utilisateur ne correspond à vos critères de recherche
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination améliorée */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
                <div className="mb-4 sm:mb-0">
                  <p className="text-sm text-slate-600">
                    Affichage de <span className="font-semibold">{(currentPage - 1) * usersPerPage + 1}</span> à{' '}
                    <span className="font-semibold">
                      {Math.min(currentPage * usersPerPage, sortedUsers.length)}
                    </span>{' '}
                    sur <span className="font-semibold">{sortedUsers.length}</span> résultat{sortedUsers.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-slate-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors text-slate-700 font-medium"
                  >
                    Précédent
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-4 py-2 rounded-xl font-medium min-w-[44px] ${
                          currentPage === pageNum 
                            ? 'bg-blue-600 text-white shadow-sm' 
                            : 'border border-slate-300 hover:bg-white text-slate-700'
                        } transition-colors`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-slate-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors text-slate-700 font-medium"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Section Fournisseurs */}
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="relative sm:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Rechercher un fournisseur..."
                    value={supplierSearchTerm}
                    onChange={(e) => setSupplierSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-3 w-full border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <button
                  onClick={() => {
                    setSelectedSupplier(null);
                    setShowSupplierModal(true);
                  }}
                  className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow-md font-medium"
                >
                  <Plus size={16} />
                  <span>Nouveau Fournisseur</span>
                </button>
              </div>
            </div>

            {/* Tableau des fournisseurs */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-y border-slate-200">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm uppercase tracking-wide">Fournisseur</th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm uppercase tracking-wide">Type</th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm uppercase tracking-wide">Contact</th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm uppercase tracking-wide">Email</th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm uppercase tracking-wide">Date création</th>
                    <th className="text-right py-4 px-6 font-semibold text-slate-700 text-sm uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredSuppliers.length > 0 ? (
                    filteredSuppliers.map(supplier => (
                      <tr key={supplier.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            {supplier.logo ? (
                              <img 
                                src={supplier.logo} 
                                alt={supplier.name}
                                className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                                {supplier.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-slate-800">{supplier.name}</p>
                              <p className="text-sm text-slate-500 line-clamp-1">{safeGetText(supplier.address)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                            {getSupplierType(supplier.types)}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-slate-800 font-medium">{supplier.contact}</p>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-slate-800 font-medium">{safeGetText(supplier.email)}</p>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-sm text-slate-600">
                            {new Date(supplier.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setSelectedSupplier(supplier);
                                setShowSupplierModal(true);
                              }}
                              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => deleteSupplier(supplier.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center">
                        <div className="text-slate-400">
                          <Factory size={48} className="mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium text-slate-500">Aucun fournisseur trouvé</p>
                          <p className="text-sm text-slate-400 mt-1">
                            Aucun fournisseur ne correspond à vos critères de recherche
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <UserModal 
        show={showModal}
        onClose={() => setShowModal(false)}
        modalType={modalType}
        selectedUser={selectedUser}
        roles={roles}
        pointsOfSale={pointsOfSale}
        onUserUpdated={handleUserUpdated}
      />
      
      <SupplierModal 
        show={showSupplierModal}
        onClose={() => setShowSupplierModal(false)}
        selectedSupplier={selectedSupplier}
        onSupplierUpdated={handleSupplierUpdated}
      />
      
      <RoleModal 
        show={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        selectedRole={selectedRoleForEdit}
        permissions={permissions}
        onRoleUpdated={handleRoleUpdated}
      />
    </div>
  );
};

export default UserManagement;