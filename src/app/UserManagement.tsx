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

// ─── Types ─────────────────────────────────────────────────────────
interface Role {
  id: string; name: string; description?: string; color?: string;
  permissions: Permission[]; users: number;
  tableau?: boolean; distributeurs?: boolean; commerciaux?: boolean;
  prospects?: boolean; inventaire?: boolean; commande?: boolean;
  utilisateur?: boolean; analytique?: boolean; geolocalisation?: boolean;
  configuration?: boolean; positions?: boolean; createcommande?: boolean; vuecommande?: boolean;
}
interface Permission { id: string; name: string; category: string; description?: string; }
interface PointOfSale { id: string; name: string; type?: string; phone?: string; email?: string; address?: string; registration_date?: string; }
interface User {
  id: number; username: string; email: string; first_name?: string; last_name?: string;
  phone?: string; location?: string; role?: string; status: 'active' | 'inactive' | 'suspended';
  join_date: string; last_login?: string; avatar?: string; establishment_name: string;
  establishment_type: string; establishment_phone?: string; establishment_email?: string;
  establishment_address: string; points_of_sale: (PointOfSale | number)[]; establishment_registration_date?: string; role_name?: string;
}
interface NewUser {
  user: { username: string; email: string; first_name?: string; last_name?: string; password?: string; };
  phone?: string; location?: string; role?: string; status: 'active' | 'inactive' | 'suspended';
  avatar?: File | null; establishment_name: string; establishment_type: string;
  establishment_phone?: string; establishment_email?: string; establishment_address: string; points_of_sale_ids?: string[];
}
interface NewRole {
  id: string; name: string; description?: string; permissions: string[]; color?: string;
  tableau?: boolean; distributeurs?: boolean; commerciaux?: boolean; prospects?: boolean;
  inventaire?: boolean; commande?: boolean; utilisateur?: boolean; analytique?: boolean;
  geolocalisation?: boolean; configuration?: boolean; positions?: boolean; createcommande?: boolean; vuecommande?: boolean;
}
interface Supplier { id: number; name: string; contact: string; address: string; email: string; logo?: string; created_at: string; types: string; }
interface NewSupplier { name: string; types: string; contact: string; address: string; email: string; logo?: File | null; }

// ─── Helpers ────────────────────────────────────────────────────────
const safeGetStatus = (status?: string): 'active' | 'inactive' | 'suspended' =>
  status && ['active', 'inactive', 'suspended'].includes(status) ? status as any : 'inactive';
const safeGetText = (text?: string | null, fallback = '-') => text || fallback;
const safeLowerCase = (text?: string) => (text || '').toLowerCase();

const ESTABLISHMENT_TYPES = [
  { value: 'Boutique', label: 'Boutique', icon: Store },
  { value: 'supermarche', label: 'Supermarché', icon: ShoppingCart },
  { value: 'superette', label: 'Supérette', icon: Store },
  { value: 'epicerie', label: 'Épicerie', icon: Store },
  { value: 'demi_grossiste', label: 'Demi-Grossiste', icon: Truck },
  { value: 'grossiste', label: 'Grossiste', icon: Truck },
  { value: 'mobile_vendor', label: 'Vendeur ambulant', icon: Bike },
];

const SUPPLIER_TYPES = [
  { value: 'importateur', label: 'Importateur' },
  { value: 'producteur_local', label: 'Producteur local' },
  { value: 'distributeur', label: 'Distributeur' },
  { value: 'fabricant', label: 'Fabricant' },
  { value: 'grossiste', label: 'Grossiste' },
];

const MODULE_PERMISSIONS = [
  { key: 'tableau', label: 'Tableau de bord', icon: BarChart3 },
  { key: 'distributeurs', label: 'Distributeurs', icon: Store },
  { key: 'commerciaux', label: 'Commerciaux', icon: Bike },
  { key: 'prospects', label: 'Prospects', icon: Truck },
  { key: 'inventaire', label: 'Inventaire', icon: Package },
  { key: 'commande', label: 'Commandes', icon: ShoppingCart },
  { key: 'utilisateur', label: 'Utilisateurs', icon: Users },
  { key: 'analytique', label: 'Analytiques', icon: BarChart3 },
  { key: 'geolocalisation', label: 'Géolocalisation', icon: MapPin },
  { key: 'configuration', label: 'Configuration', icon: Settings },
  { key: 'positions', label: 'Positions', icon: MapPin },
  { key: 'createcommande', label: 'Créer commande', icon: Plus },
  { key: 'vuecommande', label: 'Vue commande', icon: Eye },
];

// ─── Palette tokens (Login → UserManagement) ─────────────────────────
// Vert forêt  : #2D5A3D  (primary actions, accents)
// Ocre doré   : #C07A2F  (secondary accent, warnings)
// Or pâle     : #F0C878  (highlight, kente band)
// Crème ivoire: #FAF7F0  (page background)
// Sable chaud : #F2EDE0  (surface / input background)
// Brun foncé  : #2A1A08  (text primary)
// Taupe       : #7A6A52  (label text)
// Sable clair : #D4C4A0  (border default)
// Taupe clair : #A89880  (muted text)

// ─── Status Badge ────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status?: string }) => {
  const s = safeGetStatus(status);
  const config = {
    active:    { label: 'Actif',    cls: 'bg-[#EAF2EC] text-[#2D5A3D] ring-1 ring-[#B8D4BF]', dot: 'bg-[#2D5A3D]' },
    inactive:  { label: 'Inactif',  cls: 'bg-[#F2EDE0] text-[#7A6A52] ring-1 ring-[#D4C4A0]', dot: 'bg-[#A89880]' },
    suspended: { label: 'Suspendu', cls: 'bg-[#FFF3E8] text-[#9A5E1A] ring-1 ring-[#E8C090]', dot: 'bg-[#C07A2F]' },
  }[s];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

// ─── Avatar ─────────────────────────────────────────────────────────
const Avatar = ({ src, name, size = 'md' }: { src?: string; name: string; size?: 'sm' | 'md' | 'lg' }) => {
  const sz = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-16 h-16 text-xl' }[size];
  const initial = (name || 'U').charAt(0).toUpperCase();
  if (src) return <img src={src} alt={name} className={`${sz} rounded-xl object-cover border border-[#D4C4A0] flex-shrink-0`} />;
  return (
    <div className={`${sz} rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0`} style={{ background: '#2D5A3D' }}>
      {initial}
    </div>
  );
};

// ─── Form Field ──────────────────────────────────────────────────────
const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div>
    <label className="block text-[10.5px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#7A6A52' }}>
      {label} {required && <span style={{ color: '#C07A2F' }}>*</span>}
    </label>
    {children}
  </div>
);

const inputCls = "w-full px-3.5 py-2.5 border rounded-xl text-sm placeholder-[#A89880] focus:outline-none transition-all";
const inputStyle = {
  background: '#F2EDE0',
  borderColor: '#D4C4A0',
  color: '#2A1A08',
} as React.CSSProperties;

const StyledInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={inputCls + ' ' + (props.className || '')}
    style={{
      ...inputStyle,
      opacity: props.disabled ? 0.5 : 1,
    }}
    onFocus={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#2D5A3D'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(45,90,61,.10)'; }}
    onBlur={e => { e.currentTarget.style.background = '#F2EDE0'; e.currentTarget.style.borderColor = '#D4C4A0'; e.currentTarget.style.boxShadow = 'none'; }}
  />
);

const StyledSelect = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    className={inputCls + ' appearance-none ' + (props.className || '')}
    style={{ ...inputStyle, opacity: props.disabled ? 0.5 : 1 }}
    onFocus={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#2D5A3D'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(45,90,61,.10)'; }}
    onBlur={e => { e.currentTarget.style.background = '#F2EDE0'; e.currentTarget.style.borderColor = '#D4C4A0'; e.currentTarget.style.boxShadow = 'none'; }}
  />
);

const StyledTextarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className={inputCls + ' resize-none ' + (props.className || '')}
    style={{ ...inputStyle }}
    onFocus={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#2D5A3D'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(45,90,61,.10)'; }}
    onBlur={e => { e.currentTarget.style.background = '#F2EDE0'; e.currentTarget.style.borderColor = '#D4C4A0'; e.currentTarget.style.boxShadow = 'none'; }}
  />
);

// ─── Section Header ──────────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, label, color }: { icon: any; label: string; color: string }) => (
  <div className="flex items-center gap-2.5 mb-5 pb-3" style={{ borderBottom: '1px solid #E8D9B8' }}>
    <div className="p-1.5 rounded-lg" style={{ background: color }}>
      <Icon size={15} className="text-white" />
    </div>
    <h5 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#2A1A08' }}>{label}</h5>
  </div>
);

// ─── Primary Button ──────────────────────────────────────────────────
const PrimaryBtn = ({ children, disabled, type = 'button', form, onClick }: {
  children: React.ReactNode; disabled?: boolean; type?: 'button' | 'submit';
  form?: string; onClick?: () => void;
}) => (
  <button
    type={type}
    form={form}
    disabled={disabled}
    onClick={onClick}
    className="flex items-center gap-2 px-6 py-2.5 text-white rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
    style={{ background: '#2D5A3D', border: 'none' }}
    onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.background = '#3E7A54'; }}
    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#2D5A3D'; }}
  >
    {children}
  </button>
);

// ─── Ghost Button ────────────────────────────────────────────────────
const GhostBtn = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="px-5 py-2.5 text-sm font-semibold rounded-xl transition-colors"
    style={{ color: '#7A6A52' }}
    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F2EDE0'; (e.currentTarget as HTMLElement).style.color = '#2A1A08'; }}
    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#7A6A52'; }}
  >
    {children}
  </button>
);

// ─── Error Banner ────────────────────────────────────────────────────
const ErrorBanner = ({ message }: { message: string }) => (
  <div className="flex items-center gap-3 p-4 rounded-xl text-sm border" style={{ background: '#FFF3E8', borderColor: '#E8C090', color: '#9A5E1A' }}>
    <AlertCircle size={16} className="flex-shrink-0" />
    {message}
  </div>
);

// ─── UserModal ───────────────────────────────────────────────────────
interface UserModalProps {
  show: boolean; onClose: () => void; modalType: 'add' | 'edit' | 'view';
  selectedUser: User | null; roles: Role[]; pointsOfSale: PointOfSale[];
  onUserUpdated: (user: User, type: 'add' | 'edit' | 'view') => void;
}

const UserModal: React.FC<UserModalProps> = ({ show, onClose, modalType, selectedUser, roles, pointsOfSale, onUserUpdated }) => {
  const [formData, setFormData] = useState<NewUser>({
    user: { username: '', email: '', first_name: '', last_name: '', password: '' },
    phone: '', location: '', role: '', status: 'active', avatar: null,
    establishment_name: '', establishment_type: 'Boutique',
    establishment_phone: '', establishment_email: '', establishment_address: '', points_of_sale_ids: []
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!show) return;
    if (modalType === 'edit' && selectedUser) {
      setFormData({
        user: { username: selectedUser.username, email: selectedUser.email, first_name: selectedUser.first_name || '', last_name: selectedUser.last_name || '', password: '' },
        phone: selectedUser.phone || '', location: selectedUser.location || '', role: selectedUser.role || '',
        status: safeGetStatus(selectedUser.status), avatar: null,
        establishment_name: selectedUser.establishment_name || '', establishment_type: selectedUser.establishment_type || 'Boutique',
        establishment_phone: selectedUser.establishment_phone || '', establishment_email: selectedUser.establishment_email || '',
        establishment_address: selectedUser.establishment_address || '',
        points_of_sale_ids: Array.isArray(selectedUser.points_of_sale)
          ? selectedUser.points_of_sale.map(pos => (typeof pos === 'object' && pos !== null && 'id' in pos ? pos.id.toString() : pos?.toString() || '')).filter(Boolean)
          : []
      });
      setAvatarPreview(selectedUser.avatar || null);
    } else if (modalType === 'add') {
      setFormData({ user: { username: '', email: '', first_name: '', last_name: '', password: '' }, phone: '', location: '', role: '', status: 'active', avatar: null, establishment_name: '', establishment_type: 'Boutique', establishment_phone: '', establishment_email: '', establishment_address: '', points_of_sale_ids: [] });
      setAvatarPreview(null);
    }
    setFormError(null);
  }, [show, modalType, selectedUser]);

  const setUser = (field: keyof NewUser['user'], value: string) => setFormData(p => ({ ...p, user: { ...p.user, [field]: value } }));
  const setField = (field: keyof Omit<NewUser, 'user' | 'avatar'>, value: string) => setFormData(p => ({ ...p, [field]: value }));

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setFormData(p => ({ ...p, avatar: file })); setAvatarPreview(URL.createObjectURL(file)); }
  };

  const togglePOS = (posId: string, checked: boolean) =>
    setFormData(p => ({ ...p, points_of_sale_ids: checked ? [...(p.points_of_sale_ids || []), posId] : (p.points_of_sale_ids || []).filter(id => id !== posId) }));

  const validate = () => {
    if (!formData.user.username?.trim()) return "Le nom d'utilisateur est requis.";
    if (!formData.user.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.user.email)) return 'Email invalide.';
    if (modalType === 'add' && !formData.user.password?.trim()) return 'Le mot de passe est requis.';
    if (!formData.role) return 'Le rôle est requis.';
    if (!formData.establishment_name?.trim()) return "Le nom de l'établissement est requis.";
    if (!formData.establishment_address?.trim()) return "L'adresse est requise.";
    return null;
  };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const err = validate();
      if (err) { setFormError(err); return; }
    
      try {
        setFormError(null);
        setIsSubmitting(true);
    
        // ⚠️ FIX 1 : filtrer les IDs invalides
        const posIds = (formData.points_of_sale_ids || [])
          .map(id => parseInt(id, 10))
          .filter(id => !isNaN(id));
    
        if (modalType === 'edit' && selectedUser) {
          // ⚠️ FIX 2 : on n'envoie jamais le username en edit (non modifiable)
          //            on n'envoie le password que s'il est renseigné
          const userPayload: Record<string, string> = {
            email: formData.user.email,
            first_name: formData.user.first_name || '',
            last_name: formData.user.last_name || '',
          };
          if (formData.user.password && formData.user.password.trim()) {
            userPayload.password = formData.user.password;
          }
    
          const body = {
            user: userPayload,
            phone: formData.phone || '',
            location: formData.location || '',
            status: formData.status,
            // ⚠️ FIX 3 : le backend attend role_id (write_only), pas role
            role_id: formData.role || null,
            establishment_name: formData.establishment_name,
            establishment_type: formData.establishment_type,
            establishment_address: formData.establishment_address,
            establishment_phone: formData.establishment_phone || '',
            establishment_email: formData.establishment_email || '',
            points_of_sale_ids: posIds,
          };
    
          const res = await apiService.updateUser(selectedUser.id, body);
          if (!res.ok) {
            const d = await res.json();
            throw new Error(d?.detail || d?.message || JSON.stringify(d?.errors) || 'Erreur serveur');
          }
          const updated = await res.json();
          onUserUpdated(updated, 'edit');
    
        } else {
          // Mode création
          const body = {
            user: {
              username: formData.user.username,
              email: formData.user.email,
              first_name: formData.user.first_name || '',
              last_name: formData.user.last_name || '',
              password: formData.user.password,
            },
            phone: formData.phone || '',
            location: formData.location || '',
            status: formData.status,
            // ⚠️ FIX 3 : même chose pour la création
            role_id: formData.role || null,
            establishment_name: formData.establishment_name,
            establishment_type: formData.establishment_type,
            establishment_address: formData.establishment_address,
            establishment_phone: formData.establishment_phone || '',
            establishment_email: formData.establishment_email || '',
            points_of_sale_ids: posIds,
          };
    
          const res = await apiService.createUser(body);
          if (!res.ok) {
            const d = await res.json();
            throw new Error(d?.detail || d?.message || JSON.stringify(d?.errors) || 'Erreur serveur');
          }
          const created = await res.json();
          onUserUpdated(created, 'add');
        }
    
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

  const isView = modalType === 'view';
  const titles = { add: 'Nouvel utilisateur', edit: "Modifier l'utilisateur", view: 'Fiche utilisateur' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(42,26,8,0.55)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden rounded-2xl" style={{ background: '#FAF7F0', border: '1px solid #D4C4A0' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid #E8D9B8', background: '#F2EDE0' }}>
          <div>
            <h3 className="text-lg font-bold" style={{ color: '#2A1A08' }}>{titles[modalType]}</h3>
            <p className="text-xs mt-0.5" style={{ color: '#A89880' }}>{isView ? 'Informations complètes du compte' : 'Complétez toutes les informations requises'}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl transition-colors" style={{ color: '#7A6A52' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#E8D9B8'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {isView && selectedUser ? (
            <div className="space-y-6">
              {/* User Header Card */}
              <div className="flex items-center gap-4 p-5 rounded-2xl" style={{ background: '#EAF2EC', border: '1px solid #B8D4BF' }}>
                <Avatar src={selectedUser.avatar} name={selectedUser.username} size="lg" />
                <div className="flex-1">
                  <h4 className="text-xl font-bold" style={{ color: '#2A1A08' }}>{safeGetText(selectedUser.first_name)} {safeGetText(selectedUser.last_name)}</h4>
                  <p className="text-sm mt-0.5" style={{ color: '#7A6A52' }}>@{selectedUser.username}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <StatusBadge status={selectedUser.status} />
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: '#7A6A52' }}>
                      <Calendar size={12} /> {new Date(selectedUser.join_date).toLocaleDateString('fr-FR')}
                    </span>
                    {selectedUser.role_name && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: '#EAF2EC', color: '#2D5A3D' }}>{selectedUser.role_name}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Personal Info */}
                <div className="rounded-2xl p-5 space-y-3" style={{ background: '#F2EDE0' }}>
                  <SectionHeader icon={UserIcon} label="Informations personnelles" color="#2D5A3D" />
                  {[
                    { icon: Mail, label: 'Email', value: selectedUser.email },
                    { icon: Phone, label: 'Téléphone', value: safeGetText(selectedUser.phone) },
                    { icon: MapPin, label: 'Localisation', value: safeGetText(selectedUser.location) },
                    { icon: Clock, label: 'Dernière connexion', value: selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString('fr-FR') : 'Jamais' },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-3 rounded-xl p-3" style={{ background: '#FAF7F0' }}>
                      <div className="p-2 rounded-lg flex-shrink-0" style={{ background: '#E8D9B8' }}><Icon size={14} style={{ color: '#7A6A52' }} /></div>
                      <div><p className="text-xs font-medium" style={{ color: '#A89880' }}>{label}</p><p className="text-sm font-semibold mt-0.5" style={{ color: '#2A1A08' }}>{value}</p></div>
                    </div>
                  ))}
                </div>

                {/* Establishment Info */}
                <div className="rounded-2xl p-5 space-y-3" style={{ background: '#F2EDE0' }}>
                  <SectionHeader icon={Building2} label="Établissement" color="#C07A2F" />
                  {[
                    { label: 'Nom', value: selectedUser.establishment_name },
                    { label: 'Type', value: ESTABLISHMENT_TYPES.find(t => t.value === selectedUser.establishment_type)?.label || selectedUser.establishment_type },
                    { label: 'Téléphone', value: safeGetText(selectedUser.establishment_phone) },
                    { label: 'Email', value: safeGetText(selectedUser.establishment_email) },
                    { label: 'Adresse', value: selectedUser.establishment_address },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-start rounded-xl p-3" style={{ background: '#FAF7F0' }}>
                      <p className="text-xs font-medium" style={{ color: '#A89880' }}>{label}</p>
                      <p className="text-sm font-semibold text-right max-w-[60%]" style={{ color: '#2A1A08' }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Points of Sale */}
              {selectedUser.points_of_sale && selectedUser.points_of_sale.length > 0 && (
                <div className="rounded-2xl p-5" style={{ background: '#F2EDE0' }}>
                  <SectionHeader icon={Store} label="Points de vente associés" color="#9A5E1A" />
                  <div className="grid sm:grid-cols-2 gap-2">
                    {selectedUser.points_of_sale.map((pos, i) => {
                      const posObj = typeof pos === 'object' && pos !== null ? pos as PointOfSale : null;
                      return (
                        <div key={i} className="flex items-center gap-3 rounded-xl p-3" style={{ background: '#FAF7F0', border: '1px solid #E8D9B8' }}>
                          <div className="p-2 rounded-lg" style={{ background: '#FFF3E8' }}><Store size={14} style={{ color: '#C07A2F' }} /></div>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: '#2A1A08' }}>{posObj?.name || `POS ${pos}`}</p>
                            {posObj?.type && <p className="text-xs" style={{ color: '#A89880' }}>{posObj.type}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} id="user-form" className="space-y-8">
              {formError && <ErrorBanner message={formError} />}

              {/* Account Info */}
              <div>
                <SectionHeader icon={UserIcon} label="Informations du compte" color="#2D5A3D" />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Nom d'utilisateur" required><StyledInput type="text" value={formData.user.username} onChange={e => setUser('username', e.target.value)} required /></Field>
                  <Field label="Email" required><StyledInput type="email" value={formData.user.email} onChange={e => setUser('email', e.target.value)} required /></Field>
                  <Field label="Prénom"><StyledInput type="text" value={formData.user.first_name || ''} onChange={e => setUser('first_name', e.target.value)} /></Field>
                  <Field label="Nom"><StyledInput type="text" value={formData.user.last_name || ''} onChange={e => setUser('last_name', e.target.value)} /></Field>
                  {modalType === 'add' && <Field label="Mot de passe" required><StyledInput type="password" value={formData.user.password || ''} onChange={e => setUser('password', e.target.value)} required /></Field>}
                  <Field label="Téléphone"><StyledInput type="tel" value={formData.phone || ''} onChange={e => setField('phone', e.target.value)} /></Field>
                  <Field label="Localisation"><StyledInput type="text" value={formData.location || ''} onChange={e => setField('location', e.target.value)} /></Field>
                  <Field label="Rôle" required>
                    <StyledSelect value={formData.role || ''} onChange={e => setField('role', e.target.value)} required>
                      <option value="">Sélectionner un rôle</option>
                      {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </StyledSelect>
                  </Field>
                  <Field label="Statut" required>
                    <StyledSelect value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value as any }))}>
                      <option value="active">Actif</option>
                      <option value="inactive">Inactif</option>
                      <option value="suspended">Suspendu</option>
                    </StyledSelect>
                  </Field>
                </div>
              </div>

              {/* Establishment */}
              <div>
                <SectionHeader icon={Building2} label="Informations de l'établissement" color="#C07A2F" />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Nom de l'établissement" required><StyledInput type="text" value={formData.establishment_name} onChange={e => setField('establishment_name', e.target.value)} required /></Field>
                  <Field label="Type d'établissement" required>
                    <StyledSelect value={formData.establishment_type} onChange={e => setField('establishment_type', e.target.value)}>
                      {ESTABLISHMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </StyledSelect>
                  </Field>
                  <Field label="Téléphone établissement"><StyledInput type="tel" value={formData.establishment_phone || ''} onChange={e => setField('establishment_phone', e.target.value)} /></Field>
                  <Field label="Email établissement"><StyledInput type="email" value={formData.establishment_email || ''} onChange={e => setField('establishment_email', e.target.value)} /></Field>
                  <div className="sm:col-span-2">
                    <Field label="Adresse" required><StyledTextarea value={formData.establishment_address} onChange={e => setField('establishment_address', e.target.value)} rows={3} required /></Field>
                  </div>
                </div>
              </div>

              {/* Points of Sale */}
              {pointsOfSale.length > 0 && (
                <div>
                  <SectionHeader icon={Store} label="Points de vente associés" color="#9A5E1A" />
                  <div className="grid sm:grid-cols-2 gap-2">
                    {pointsOfSale.map(pos => {
                      const checked = formData.points_of_sale_ids?.includes(pos.id.toString()) || false;
                      return (
                        <label key={pos.id} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                          style={{ background: checked ? '#EAF2EC' : '#F2EDE0', border: `1.5px solid ${checked ? '#2D5A3D' : '#D4C4A0'}` }}>
                          <input type="checkbox" checked={checked} onChange={e => togglePOS(pos.id.toString(), e.target.checked)} className="rounded" style={{ accentColor: '#2D5A3D' }} />
                          <div>
                            <p className="text-sm font-semibold" style={{ color: '#2A1A08' }}>{pos.name}</p>
                            {pos.type && <p className="text-xs" style={{ color: '#A89880' }}>{pos.type}</p>}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Avatar */}
              <div>
                <SectionHeader icon={UserIcon} label="Photo de profil" color="#7A6A52" />
                <div className="flex items-center gap-5">
                  {avatarPreview
                    ? <img src={avatarPreview} alt="Preview" className="w-16 h-16 rounded-2xl object-cover" style={{ border: '2px solid #D4C4A0' }} />
                    : <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: '#F2EDE0', border: '1.5px dashed #D4C4A0' }}><UserIcon size={24} style={{ color: '#D4C4A0' }} /></div>
                  }
                  <input type="file" accept="image/*" onChange={handleAvatarChange}
                    className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold transition-all"
                    style={{ color: '#7A6A52' }} />
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        {!isView && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 flex-shrink-0" style={{ borderTop: '1px solid #E8D9B8', background: '#F2EDE0' }}>
            <GhostBtn onClick={onClose}>Annuler</GhostBtn>
            <PrimaryBtn type="submit" form="user-form" disabled={isSubmitting}>
              {isSubmitting ? <><Loader size={15} className="animate-spin" /> Enregistrement…</> : modalType === 'add' ? "Créer l'utilisateur" : 'Enregistrer'}
            </PrimaryBtn>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── SupplierModal ───────────────────────────────────────────────────
interface SupplierModalProps {
  show: boolean; onClose: () => void; selectedSupplier: Supplier | null;
  onSupplierUpdated: (supplier: Supplier, type: 'add' | 'edit') => void;
}

const SupplierModal: React.FC<SupplierModalProps> = ({ show, onClose, selectedSupplier, onSupplierUpdated }) => {
  const [formData, setFormData] = useState<NewSupplier>({ name: '', types: '', contact: '', address: '', email: '', logo: null });
  const [formError, setFormError] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!show) return;
    if (selectedSupplier) {
      setFormData({ name: selectedSupplier.name, types: selectedSupplier.types, contact: selectedSupplier.contact, address: selectedSupplier.address, email: selectedSupplier.email, logo: null });
      setLogoPreview(selectedSupplier.logo || null);
    } else {
      setFormData({ name: '', types: '', contact: '', address: '', email: '', logo: null });
      setLogoPreview(null);
    }
    setFormError(null);
  }, [show, selectedSupplier]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setFormData(p => ({ ...p, logo: file })); setLogoPreview(URL.createObjectURL(file)); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { setFormError('Le nom est requis.'); return; }
    if (!formData.types.trim()) { setFormError('Le type est requis.'); return; }
    if (!formData.contact.trim()) { setFormError('Le contact est requis.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { setFormError('Email invalide.'); return; }
    try {
      setFormError(null); setIsSubmitting(true);
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => { if (k !== 'logo' && v) fd.append(k, v as string); });
      if (formData.logo) fd.append('logo', formData.logo);
      const res = selectedSupplier
        ? await apiService.updateResource('/suppliers', selectedSupplier.id, fd, true)
        : await apiService.createResource('/suppliers', fd, true);
      if (!res.ok) { const d = await res.json(); throw new Error(d?.detail || 'Erreur serveur'); }
      const updated = await res.json();
      onSupplierUpdated(updated, selectedSupplier ? 'edit' : 'add');
      onClose();
    } catch (err: any) {
      if (err.message !== 'Session expired') setFormError(err.message || 'Une erreur est survenue');
    } finally { setIsSubmitting(false); }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(42,26,8,0.55)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl" style={{ background: '#FAF7F0', border: '1px solid #D4C4A0' }}>
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid #E8D9B8', background: '#F2EDE0' }}>
          <div>
            <h3 className="text-lg font-bold" style={{ color: '#2A1A08' }}>{selectedSupplier ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}</h3>
            <p className="text-xs mt-0.5" style={{ color: '#A89880' }}>{selectedSupplier ? 'Mettez à jour les informations' : 'Ajoutez un nouveau partenaire'}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl transition-colors" style={{ color: '#7A6A52' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#E8D9B8'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          <form onSubmit={handleSubmit} id="supplier-form" className="space-y-6">
            {formError && <ErrorBanner message={formError} />}
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Nom du fournisseur" required><StyledInput type="text" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required /></Field>
              <Field label="Type" required>
                <StyledSelect value={formData.types} onChange={e => setFormData(p => ({ ...p, types: e.target.value }))} required>
                  <option value="">Sélectionner</option>
                  {SUPPLIER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </StyledSelect>
              </Field>
              <Field label="Contact" required><StyledInput type="text" value={formData.contact} onChange={e => setFormData(p => ({ ...p, contact: e.target.value }))} required /></Field>
              <Field label="Email" required><StyledInput type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} required /></Field>
              <div className="sm:col-span-2">
                <Field label="Adresse"><StyledTextarea value={formData.address} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))} rows={3} /></Field>
              </div>
            </div>
            <div>
              <SectionHeader icon={FileText} label="Logo du fournisseur" color="#7A6A52" />
              <div className="flex items-center gap-5">
                {logoPreview
                  ? <img src={logoPreview} alt="Logo" className="w-16 h-16 rounded-2xl object-cover" style={{ border: '2px solid #D4C4A0' }} />
                  : <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: '#F2EDE0', border: '1.5px dashed #D4C4A0' }}><Building2 size={24} style={{ color: '#D4C4A0' }} /></div>
                }
                <input type="file" accept="image/*" onChange={handleLogoChange} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold" style={{ color: '#7A6A52' }} />
              </div>
            </div>
          </form>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 flex-shrink-0" style={{ borderTop: '1px solid #E8D9B8', background: '#F2EDE0' }}>
          <GhostBtn onClick={onClose}>Annuler</GhostBtn>
          <PrimaryBtn type="submit" form="supplier-form" disabled={isSubmitting}>
            {isSubmitting ? <><Loader size={15} className="animate-spin" /> Enregistrement…</> : selectedSupplier ? 'Enregistrer' : 'Créer le fournisseur'}
          </PrimaryBtn>
        </div>
      </div>
    </div>
  );
};

// ─── RoleModal ───────────────────────────────────────────────────────
interface RoleModalProps {
  show: boolean; onClose: () => void; selectedRole: Role | null;
  permissions: Permission[]; onRoleUpdated: (role: Role, type: 'add' | 'edit') => void;
}

const RoleModal: React.FC<RoleModalProps> = ({ show, onClose, selectedRole, permissions, onRoleUpdated }) => {
  const [formData, setFormData] = useState<NewRole>({ id: '', name: '', description: '', permissions: [], color: '#2D5A3D' });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!show) return;
    if (selectedRole) {
      setFormData({
        id: selectedRole.id, name: selectedRole.name, description: selectedRole.description || '',
        permissions: selectedRole.permissions.map(p => p.id), color: selectedRole.color || '#2D5A3D',
        tableau: selectedRole.tableau || false, distributeurs: selectedRole.distributeurs || false,
        commerciaux: selectedRole.commerciaux || false, prospects: selectedRole.prospects || false,
        inventaire: selectedRole.inventaire || false, commande: selectedRole.commande || false,
        utilisateur: selectedRole.utilisateur || false, analytique: selectedRole.analytique || false,
        geolocalisation: selectedRole.geolocalisation || false, configuration: selectedRole.configuration || false,
        positions: selectedRole.positions || false, createcommande: selectedRole.createcommande || false,
        vuecommande: selectedRole.vuecommande || false,
      });
    } else {
      setFormData({ id: '', name: '', description: '', permissions: [], color: '#2D5A3D', tableau: false, distributeurs: false, commerciaux: false, prospects: false, inventaire: false, commande: false, utilisateur: false, analytique: false, geolocalisation: false, configuration: false, positions: false, createcommande: false, vuecommande: false });
    }
    setFormError(null);
  }, [show, selectedRole]);

  const togglePerm = (id: string) => setFormData(p => ({ ...p, permissions: p.permissions.includes(id) ? p.permissions.filter(x => x !== id) : [...p.permissions, id] }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { setFormError('Le nom du rôle est requis.'); return; }
    try {
      setFormError(null); setIsSubmitting(true);
      const res = selectedRole
        ? await apiService.updateResource('/roles', selectedRole.id, formData)
        : await apiService.createRole(formData);
      if (!res.ok) { const d = await res.json(); throw new Error(d?.detail || 'Erreur serveur'); }
      const updated = await res.json();
      onRoleUpdated(updated, selectedRole ? 'edit' : 'add');
      onClose();
    } catch (err: any) {
      if (err.message !== 'Session expired') setFormError(err.message || 'Une erreur est survenue');
    } finally { setIsSubmitting(false); }
  };

  const permByCategory = permissions.reduce((acc, p) => {
    const cat = p.category || 'Autre';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(42,26,8,0.55)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden rounded-2xl" style={{ background: '#FAF7F0', border: '1px solid #D4C4A0' }}>
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid #E8D9B8', background: '#F2EDE0' }}>
          <div>
            <h3 className="text-lg font-bold" style={{ color: '#2A1A08' }}>{selectedRole ? 'Modifier le rôle' : 'Nouveau rôle'}</h3>
            <p className="text-xs mt-0.5" style={{ color: '#A89880' }}>{selectedRole ? 'Mettez à jour le rôle et ses accès' : "Définissez un nouveau profil d'accès"}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl transition-colors" style={{ color: '#7A6A52' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#E8D9B8'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-7">
          <form onSubmit={handleSubmit} id="role-form">
            {formError && <ErrorBanner message={formError} />}

            {/* Basic Info */}
            <div className="mb-7">
              <SectionHeader icon={Shield} label="Informations de base" color="#2D5A3D" />
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="ID du rôle" required>
                  <StyledInput type="text" value={formData.id} onChange={e => setFormData(p => ({ ...p, id: e.target.value }))} required disabled={!!selectedRole} />
                </Field>
                <Field label="Nom du rôle" required>
                  <StyledInput type="text" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Description">
                    <StyledInput type="text" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="Description du rôle…" />
                  </Field>
                </div>
                <div>
                  <label className="block text-[10.5px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#7A6A52' }}>Couleur du rôle</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={formData.color || '#2D5A3D'} onChange={e => setFormData(p => ({ ...p, color: e.target.value }))} className="w-12 h-12 rounded-xl cursor-pointer" style={{ border: '1.5px solid #D4C4A0' }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#2A1A08' }}>{formData.color || '#2D5A3D'}</p>
                      <p className="text-xs" style={{ color: '#A89880' }}>Couleur d'affichage</p>
                    </div>
                    <div className="ml-auto">
                      <span className="px-3 py-1.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: formData.color || '#2D5A3D' }}>
                        {formData.name || 'Aperçu'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Module Access */}
            <div className="mb-7">
              <SectionHeader icon={Settings} label="Accès aux modules" color="#C07A2F" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {MODULE_PERMISSIONS.map(({ key, label, icon: Icon }) => {
                  const checked = formData[key as keyof NewRole] as boolean || false;
                  return (
                    <label key={key} className="flex items-center gap-2.5 p-3 rounded-xl cursor-pointer transition-all"
                      style={{ background: checked ? '#EAF2EC' : '#F2EDE0', border: `1.5px solid ${checked ? '#2D5A3D' : '#D4C4A0'}` }}>
                      <input type="checkbox" checked={checked} onChange={e => setFormData(p => ({ ...p, [key]: e.target.checked }))} style={{ accentColor: '#2D5A3D' }} />
                      <Icon size={14} style={{ color: checked ? '#2D5A3D' : '#A89880' }} />
                      <span className="text-xs font-semibold" style={{ color: checked ? '#2D5A3D' : '#7A6A52' }}>{label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Permissions by category */}
            {Object.keys(permByCategory).length > 0 && (
              <div>
                <SectionHeader icon={Shield} label="Permissions détaillées" color="#9A5E1A" />
                <div className="space-y-3">
                  {Object.entries(permByCategory).map(([category, perms]) => (
                    <div key={category} className="rounded-xl overflow-hidden" style={{ border: '1px solid #E8D9B8' }}>
                      <div className="px-4 py-2.5" style={{ background: '#F2EDE0', borderBottom: '1px solid #E8D9B8' }}>
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#7A6A52' }}>{category}</span>
                      </div>
                      <div className="p-3 grid sm:grid-cols-2 gap-2" style={{ background: '#FAF7F0' }}>
                        {perms.map(perm => {
                          const checked = formData.permissions.includes(perm.id);
                          return (
                            <label key={perm.id} className="flex items-start gap-2.5 p-3 rounded-xl cursor-pointer transition-all"
                              style={{ background: checked ? '#EAF2EC' : '#F2EDE0', border: `1.5px solid ${checked ? '#2D5A3D' : '#D4C4A0'}` }}>
                              <input type="checkbox" checked={checked} onChange={() => togglePerm(perm.id)} className="mt-0.5" style={{ accentColor: '#2D5A3D' }} />
                              <div>
                                <p className="text-sm font-semibold" style={{ color: checked ? '#2D5A3D' : '#2A1A08' }}>{perm.name}</p>
                                {perm.description && <p className="text-xs mt-0.5" style={{ color: '#A89880' }}>{perm.description}</p>}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 flex-shrink-0" style={{ borderTop: '1px solid #E8D9B8', background: '#F2EDE0' }}>
          <GhostBtn onClick={onClose}>Annuler</GhostBtn>
          <PrimaryBtn type="submit" form="role-form" disabled={isSubmitting}>
            {isSubmitting ? <><Loader size={15} className="animate-spin" /> Enregistrement…</> : selectedRole ? 'Enregistrer' : 'Créer le rôle'}
          </PrimaryBtn>
        </div>
      </div>
    </div>
  );
};

// ─── Main UserManagement Component ──────────────────────────────────
const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [pointsOfSale, setPointsOfSale] = useState<PointOfSale[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedEstType, setSelectedEstType] = useState('all');
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null); setLoading(true);
        const [usersRes, rolesRes, permRes, posRes, suppRes] = await Promise.all([
          apiService.getUsers(), apiService.getRoles(), apiService.getPermissions(),
          apiService.getPointsVente(), apiService.getSuppliers()
        ]);
        if (!usersRes.ok || !rolesRes.ok || !permRes.ok || !posRes.ok || !suppRes.ok) throw new Error('Erreur de chargement');
        const [usersData, rolesData, permData, posData, suppData] = await Promise.all([usersRes.json(), rolesRes.json(), permRes.json(), posRes.json(), suppRes.json()]);
        setUsers(usersData.map((u: any) => ({
          id: u.id, username: u.user?.username || u.username || '', email: u.user?.email || u.email || '',
          first_name: u.user?.first_name || u.first_name || '', last_name: u.user?.last_name || u.last_name || '',
          phone: u.phone || '', location: u.location || '', role: u.role || '',
          status: safeGetStatus(u.status), join_date: u.join_date || '', last_login: u.last_login || '',
          avatar: u.avatar || '', establishment_name: u.establishment_name || '',
          establishment_type: u.establishment_type || 'Boutique', establishment_phone: u.establishment_phone || '',
          establishment_email: u.establishment_email || '', establishment_address: u.establishment_address || '',
          points_of_sale: u.points_of_sale || [], establishment_registration_date: u.establishment_registration_date || '',
          role_name: u.role_name || ''
        })));
        setRoles(rolesData); setPermissions(permData); setPointsOfSale(posData);
        setSuppliers(suppData.map((s: any) => ({ ...s, types: s.types || 'grossiste' })));
      } catch (err: any) {
        if (err.message !== 'Session expired') setError(err.message || 'Erreur de chargement');
      } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const filteredUsers = React.useMemo(() => users.filter(u => {
    if (!u) return false;
    const q = safeLowerCase(searchTerm);
    return (safeLowerCase(u.username).includes(q) || safeLowerCase(u.email).includes(q) || safeLowerCase(u.establishment_name).includes(q) || safeLowerCase(u.phone).includes(q))
      && (selectedRoleFilter === 'all' || safeLowerCase(u.role) === safeLowerCase(selectedRoleFilter))
      && (selectedStatus === 'all' || u.status === selectedStatus)
      && (selectedEstType === 'all' || u.establishment_type === selectedEstType);
  }), [users, searchTerm, selectedRoleFilter, selectedStatus, selectedEstType]);

  const sortedUsers = React.useMemo(() => {
    if (!sortConfig) return filteredUsers;
    return [...filteredUsers].sort((a, b) => {
      const av = a[sortConfig.key as keyof User]; const bv = b[sortConfig.key as keyof User];
      if (av === undefined || bv === undefined) return 0;
      return av < bv ? (sortConfig.direction === 'asc' ? -1 : 1) : av > bv ? (sortConfig.direction === 'asc' ? 1 : -1) : 0;
    });
  }, [filteredUsers, sortConfig]);

  const filteredSuppliers = React.useMemo(() => {
    const q = safeLowerCase(supplierSearchTerm);
    return suppliers.filter(s => safeLowerCase(s.name).includes(q) || safeLowerCase(s.email).includes(q) || safeLowerCase(s.contact).includes(q));
  }, [suppliers, supplierSearchTerm]);

  const paginatedUsers = sortedUsers.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);
  const totalPages = Math.ceil(sortedUsers.length / usersPerPage) || 1;

  const handleSort = (key: string) => setSortConfig(prev => ({ key, direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));

  const deleteUser = async (id: number) => {
    if (!window.confirm('Supprimer cet utilisateur ?')) return;
    try {
      const res = await apiService.deleteResource('users', id);
      if (!res.ok) throw new Error('Échec');
      setUsers(p => p.filter(u => u.id !== id));
    } catch (err: any) { if (err.message !== 'Session expired') setError(err.message || 'Erreur'); }
  };

  const deleteSupplier = async (id: number) => {
    if (!window.confirm('Supprimer ce fournisseur ?')) return;
    try {
      const res = await apiService.deleteResource('suppliers', id);
      if (!res.ok) throw new Error('Échec');
      setSuppliers(p => p.filter(s => s.id !== id));
    } catch (err: any) { if (err.message !== 'Session expired') setError(err.message || 'Erreur'); }
  };

  const deleteRole = async (id: string) => {
    if (!window.confirm('Supprimer ce rôle ?')) return;
    try {
      const res = await apiService.deleteResource('roles', id);
      if (!res.ok) throw new Error('Échec');
      setRoles(p => p.filter(r => r.id !== id));
    } catch (err: any) { if (err.message !== 'Session expired') setError(err.message || 'Erreur'); }
  };

  const handleUserUpdated = (u: User, type: 'add' | 'edit' | 'view') => {
    if (type === 'edit') setUsers(p => p.map(x => x.id === u.id ? u : x));
    else if (type === 'add') setUsers(p => [...p, u]);
  };
  const handleSupplierUpdated = (s: Supplier, type: 'add' | 'edit') => {
    if (type === 'edit') setSuppliers(p => p.map(x => x.id === s.id ? s : x));
    else setSuppliers(p => [...p, s]);
  };
  const handleRoleUpdated = (r: Role, type: 'add' | 'edit') => {
    if (type === 'edit') setRoles(p => p.map(x => x.id === r.id ? r : x));
    else setRoles(p => [...p, r]);
  };

  const getSupplierType = (type?: string) => SUPPLIER_TYPES.find(t => t.value === type)?.label || type || '-';
  const getEstType = (type?: string) => ESTABLISHMENT_TYPES.find(t => t.value === type)?.label || type || '-';

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]" style={{ background: '#FAF7F0' }}>
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-full animate-spin mx-auto" style={{ border: '3px solid #E8D9B8', borderTopColor: '#2D5A3D' }} />
        <p className="text-sm font-medium" style={{ color: '#7A6A52' }}>Chargement des données…</p>
      </div>
    </div>
  );

  const activeCount = users.filter(u => u.status === 'active').length;
  const suspendedCount = users.filter(u => u.status === 'suspended').length;

  // ── Search input helper
  const searchInput = (value: string, onChange: (v: string) => void, placeholder: string) => (
    <div className="relative flex-1 max-w-xs">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#A89880' }} />
      <input
        type="text" placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
        style={{ background: '#F2EDE0', border: '1.5px solid #D4C4A0', color: '#2A1A08' }}
        onFocus={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#2D5A3D'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(45,90,61,.10)'; }}
        onBlur={e => { e.currentTarget.style.background = '#F2EDE0'; e.currentTarget.style.borderColor = '#D4C4A0'; e.currentTarget.style.boxShadow = 'none'; }}
      />
    </div>
  );

  const filterSelect = (value: string, onChange: (v: string) => void, children: React.ReactNode) => (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="px-3 py-2.5 rounded-xl text-sm focus:outline-none transition-all appearance-none"
      style={{ background: '#F2EDE0', border: '1.5px solid #D4C4A0', color: '#2A1A08' }}
      onFocus={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#2D5A3D'; }}
      onBlur={e => { e.currentTarget.style.background = '#F2EDE0'; e.currentTarget.style.borderColor = '#D4C4A0'; }}>
      {children}
    </select>
  );

  return (
    <div className="space-y-5" style={{ background: '#FAF7F0', minHeight: '100vh', padding: '1.25rem' }}>
      {error && <ErrorBanner message={error} />}

      {/* ── Kente accent top bar */}
      <div className="h-1 rounded-full" style={{ background: 'linear-gradient(90deg,#9A5E1A 0%,#D4A843 25%,#9A5E1A 50%,#D4A843 75%,#9A5E1A 100%)', opacity: 0.7 }} />

      {/* ── Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Utilisateurs', value: users.length, sub: `${activeCount} actifs`, icon: Users, bg: '#2D5A3D' },
          { label: 'Actifs', value: activeCount, sub: `${users.length > 0 ? Math.round(activeCount / users.length * 100) : 0}% du total`, icon: UserCheck, bg: '#3E7A54' },
          { label: 'Suspendus', value: suspendedCount, sub: 'Nécessite attention', icon: UserX, bg: '#C07A2F' },
          { label: 'Fournisseurs', value: suppliers.length, sub: 'Partenaires actifs', icon: Factory, bg: '#9A5E1A' },
        ].map(({ label, value, sub, icon: Icon, bg }) => (
          <div key={label} className="rounded-2xl p-5 text-white relative overflow-hidden" style={{ background: bg }}>
            {/* Kente texture */}
            <div aria-hidden className="absolute inset-0" style={{ opacity: 0.06, backgroundImage: 'linear-gradient(rgba(255,255,255,.9) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.9) 1px,transparent 1px)', backgroundSize: '24px 24px' }} />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,.65)' }}>{label}</p>
                <p className="text-3xl font-bold mt-1 tracking-tight">{value}</p>
                <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,.55)' }}>{sub}</p>
              </div>
              <div className="p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,.15)' }}>
                <Icon size={20} style={{ color: 'rgba(255,255,255,.9)' }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Roles Section */}
      <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid #E8D9B8' }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold" style={{ color: '#2A1A08' }}>Rôles système</h3>
            <p className="text-xs mt-0.5" style={{ color: '#A89880' }}>Configurez les profils d'accès</p>
          </div>
          <button onClick={() => { setSelectedRoleForEdit(null); setShowRoleModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 text-white rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
            style={{ background: '#2D5A3D', border: 'none' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#3E7A54'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#2D5A3D'}>
            <Plus size={15} /> Nouveau rôle
          </button>
        </div>
        {/* Kente band under title */}
        <div className="h-0.5 rounded-full mb-5" style={{ background: 'linear-gradient(90deg,#9A5E1A 0%,#D4A843 40%,#9A5E1A 100%)', opacity: 0.4 }} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {roles.map(role => (
            <div key={role.id} className="group relative rounded-xl p-4 transition-all"
              style={{ background: '#F2EDE0', border: '1px solid #E8D9B8' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#FAF7F0'; (e.currentTarget as HTMLElement).style.borderColor = '#D4C4A0'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#F2EDE0'; (e.currentTarget as HTMLElement).style.borderColor = '#E8D9B8'; }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: role.color || '#2D5A3D' }} />
                  <h4 className="text-sm font-bold truncate" style={{ color: '#2A1A08' }}>{role.name}</h4>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => { setSelectedRoleForEdit(role); setShowRoleModal(true); }}
                    className="p-1.5 rounded-lg transition-colors" style={{ color: '#A89880' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#EAF2EC'; (e.currentTarget as HTMLElement).style.color = '#2D5A3D'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#A89880'; }}>
                    <Edit size={13} />
                  </button>
                  <button onClick={() => deleteRole(role.id)}
                    className="p-1.5 rounded-lg transition-colors" style={{ color: '#A89880' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#FFF3E8'; (e.currentTarget as HTMLElement).style.color = '#C07A2F'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#A89880'; }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <p className="text-xs line-clamp-2 mb-3" style={{ color: '#A89880' }}>{role.description || 'Aucune description'}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: '#7A6A52' }}>{role.users} utilisateur{role.users !== 1 ? 's' : ''}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: '#E8D9B8', color: '#7A6A52' }}>{role.permissions.length} perm.</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab Panel */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid #E8D9B8' }}>
        {/* Tab Bar */}
        <div className="flex px-5 pt-2" style={{ borderBottom: '1px solid #E8D9B8' }}>
          {([['users', Users, 'Utilisateurs'], ['suppliers', Factory, 'Fournisseurs']] as const).map(([tab, Icon, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab as any)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-semibold mr-1 transition-all"
              style={{
                borderBottom: `2px solid ${activeTab === tab ? '#2D5A3D' : 'transparent'}`,
                color: activeTab === tab ? '#2D5A3D' : '#A89880',
              }}>
              <Icon size={16} />{label}
            </button>
          ))}
        </div>

        {/* ── Users Tab */}
        {activeTab === 'users' ? (
          <>
            <div className="p-5 flex flex-col lg:flex-row lg:items-center gap-3" style={{ borderBottom: '1px solid #F2EDE0' }}>
              {searchInput(searchTerm, setSearchTerm, 'Rechercher…')}
              <div className="flex flex-wrap gap-2 flex-1">
                {filterSelect(selectedRoleFilter, setSelectedRoleFilter,
                  <><option value="all">Tous les rôles</option>{roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</>
                )}
                {filterSelect(selectedStatus, setSelectedStatus,
                  <><option value="all">Tous les statuts</option><option value="active">Actif</option><option value="inactive">Inactif</option><option value="suspended">Suspendu</option></>
                )}
                {filterSelect(selectedEstType, setSelectedEstType,
                  <><option value="all">Tous les types</option>{ESTABLISHMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{ border: '1.5px solid #D4C4A0', color: '#7A6A52', background: 'transparent' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F2EDE0'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                  <Download size={14} /> Exporter
                </button>
                <button onClick={() => { setModalType('add'); setSelectedUser(null); setShowModal(true); }}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-white rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
                  style={{ background: '#2D5A3D', border: 'none' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#3E7A54'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#2D5A3D'}>
                  <Plus size={15} /> Nouvel utilisateur
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: '#F2EDE0', borderBottom: '1px solid #E8D9B8' }}>
                    {[['username', 'Utilisateur'], [null, 'Établissement'], [null, 'Contact'], [null, 'Rôle'], [null, 'Statut'], ['last_login', 'Dernière connexion'], [null, '']].map(([key, label], i) => (
                      <th key={i} className={`py-3.5 px-5 text-left text-[10.5px] font-bold uppercase tracking-widest ${i === 6 ? 'text-right' : ''}`} style={{ color: '#7A6A52' }}>
                        {key ? (
                          <button onClick={() => handleSort(key)} className="flex items-center gap-1.5 transition-colors" style={{ color: '#7A6A52' }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#2A1A08'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#7A6A52'}>
                            {label} <ArrowUpDown size={12} />
                          </button>
                        ) : label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.length > 0 ? paginatedUsers.map((user, idx) => (
                    <tr key={user.id} className="group transition-colors"
                      style={{ borderBottom: '1px solid #F2EDE0' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FAF7F0'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <Avatar src={user.avatar} name={user.username} />
                          <div>
                            <p className="text-sm font-bold" style={{ color: '#2A1A08' }}>{safeGetText(user.first_name)} {safeGetText(user.last_name)}</p>
                            <p className="text-xs" style={{ color: '#A89880' }}>@{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <p className="text-sm font-semibold" style={{ color: '#2A1A08' }}>{user.establishment_name}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#A89880' }}>{getEstType(user.establishment_type)}</p>
                        {user.points_of_sale?.length > 0 && <p className="text-xs mt-0.5 font-medium" style={{ color: '#2D5A3D' }}>{user.points_of_sale.length} POS</p>}
                      </td>
                      <td className="py-3.5 px-5">
                        <p className="text-sm font-medium" style={{ color: '#2A1A08' }}>{user.email}</p>
                        {user.phone && <p className="text-xs mt-0.5" style={{ color: '#A89880' }}>{user.phone}</p>}
                      </td>
                      <td className="py-3.5 px-5">
                        {user.role
                          ? <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: '#EAF2EC', color: '#2D5A3D' }}>{user.role_name || roles.find(r => r.id === user.role)?.name || 'Rôle inconnu'}</span>
                          : <span className="text-xs" style={{ color: '#D4C4A0' }}>—</span>
                        }
                      </td>
                      <td className="py-3.5 px-5"><StatusBadge status={user.status} /></td>
                      <td className="py-3.5 px-5">
                        <p className="text-xs" style={{ color: '#7A6A52' }}>{user.last_login ? new Date(user.last_login).toLocaleDateString('fr-FR') : <span style={{ color: '#D4C4A0' }}>Jamais</span>}</p>
                        {user.last_login && <p className="text-[11px]" style={{ color: '#D4C4A0' }}>{new Date(user.last_login).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {[
                            { onClick: () => { setModalType('view'); setSelectedUser(user); setShowModal(true); }, icon: Eye, title: 'Voir', hoverBg: '#EAF2EC', hoverColor: '#2D5A3D' },
                            { onClick: () => { setModalType('edit'); setSelectedUser(user); setShowModal(true); }, icon: Edit, title: 'Modifier', hoverBg: '#FFF3E8', hoverColor: '#C07A2F' },
                            { onClick: () => deleteUser(user.id), icon: Trash2, title: 'Supprimer', hoverBg: '#FFF3E8', hoverColor: '#9A5E1A' },
                          ].map(({ onClick, icon: Icon, title, hoverBg, hoverColor }) => (
                            <button key={title} onClick={onClick} title={title}
                              className="p-2 rounded-lg transition-colors" style={{ color: '#D4C4A0' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = hoverBg; (e.currentTarget as HTMLElement).style.color = hoverColor; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#D4C4A0'; }}>
                              <Icon size={15} />
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={7} className="py-16 text-center">
                      <Users size={40} className="mx-auto mb-3" style={{ color: '#E8D9B8' }} />
                      <p className="text-sm font-medium" style={{ color: '#A89880' }}>Aucun utilisateur trouvé</p>
                      <p className="text-xs mt-1" style={{ color: '#D4C4A0' }}>Modifiez vos critères de recherche</p>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4" style={{ borderTop: '1px solid #F2EDE0', background: '#FAF7F0' }}>
                <p className="text-xs" style={{ color: '#A89880' }}>
                  {(currentPage - 1) * usersPerPage + 1}–{Math.min(currentPage * usersPerPage, sortedUsers.length)} sur {sortedUsers.length}
                </p>
                <div className="flex items-center gap-1.5">
                  {[
                    { label: 'Préc.', onClick: () => setCurrentPage(p => Math.max(p - 1, 1)), disabled: currentPage === 1 },
                  ].map(({ label, onClick, disabled }) => (
                    <button key={label} onClick={onClick} disabled={disabled}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ border: '1.5px solid #D4C4A0', color: '#7A6A52', background: 'transparent' }}
                      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.background = '#F2EDE0'; }}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                      {label}
                    </button>
                  ))}
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let p = i + 1;
                    if (totalPages > 5) {
                      if (currentPage <= 3) p = i + 1;
                      else if (currentPage >= totalPages - 2) p = totalPages - 4 + i;
                      else p = currentPage - 2 + i;
                    }
                    const active = currentPage === p;
                    return (
                      <button key={p} onClick={() => setCurrentPage(p)}
                        className="w-9 h-9 rounded-xl text-xs font-bold transition-colors"
                        style={{ background: active ? '#2D5A3D' : 'transparent', color: active ? 'white' : '#7A6A52', border: active ? 'none' : '1.5px solid #D4C4A0' }}
                        onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#F2EDE0'; }}
                        onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                        {p}
                      </button>
                    );
                  })}
                  <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ border: '1.5px solid #D4C4A0', color: '#7A6A52', background: 'transparent' }}
                    onMouseEnter={e => { if (currentPage !== totalPages) (e.currentTarget as HTMLElement).style.background = '#F2EDE0'; }}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                    Suiv.
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* ── Suppliers Tab */
          <>
            <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-3" style={{ borderBottom: '1px solid #F2EDE0' }}>
              {searchInput(supplierSearchTerm, setSupplierSearchTerm, 'Rechercher un fournisseur…')}
              <button onClick={() => { setSelectedSupplier(null); setShowSupplierModal(true); }}
                className="flex items-center gap-1.5 px-4 py-2.5 text-white rounded-xl text-sm font-semibold transition-all active:scale-[0.98] ml-auto"
                style={{ background: '#2D5A3D', border: 'none' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#3E7A54'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#2D5A3D'}>
                <Plus size={15} /> Nouveau fournisseur
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: '#F2EDE0', borderBottom: '1px solid #E8D9B8' }}>
                    {['Fournisseur', 'Type', 'Contact', 'Email', 'Créé le', ''].map((h, i) => (
                      <th key={i} className={`py-3.5 px-5 text-left text-[10.5px] font-bold uppercase tracking-widest ${i === 5 ? 'text-right' : ''}`} style={{ color: '#7A6A52' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.length > 0 ? filteredSuppliers.map(s => (
                    <tr key={s.id} className="group transition-colors"
                      style={{ borderBottom: '1px solid #F2EDE0' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FAF7F0'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          {s.logo
                            ? <img src={s.logo} alt={s.name} className="w-9 h-9 rounded-xl object-cover flex-shrink-0" style={{ border: '1px solid #D4C4A0' }} />
                            : <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: '#2D5A3D' }}>{s.name.charAt(0).toUpperCase()}</div>
                          }
                          <div>
                            <p className="text-sm font-bold" style={{ color: '#2A1A08' }}>{s.name}</p>
                            <p className="text-xs truncate max-w-[140px]" style={{ color: '#A89880' }}>{s.address || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: '#F2EDE0', color: '#7A6A52' }}>{getSupplierType(s.types)}</span>
                      </td>
                      <td className="py-3.5 px-5"><p className="text-sm" style={{ color: '#2A1A08' }}>{s.contact}</p></td>
                      <td className="py-3.5 px-5"><p className="text-sm" style={{ color: '#2A1A08' }}>{s.email}</p></td>
                      <td className="py-3.5 px-5"><p className="text-xs" style={{ color: '#A89880' }}>{new Date(s.created_at).toLocaleDateString('fr-FR')}</p></td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setSelectedSupplier(s); setShowSupplierModal(true); }}
                            className="p-2 rounded-lg transition-colors" style={{ color: '#D4C4A0' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#FFF3E8'; (e.currentTarget as HTMLElement).style.color = '#C07A2F'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#D4C4A0'; }}>
                            <Edit size={15} />
                          </button>
                          <button onClick={() => deleteSupplier(s.id)}
                            className="p-2 rounded-lg transition-colors" style={{ color: '#D4C4A0' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#FFF3E8'; (e.currentTarget as HTMLElement).style.color = '#9A5E1A'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#D4C4A0'; }}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="py-16 text-center">
                      <Factory size={40} className="mx-auto mb-3" style={{ color: '#E8D9B8' }} />
                      <p className="text-sm font-medium" style={{ color: '#A89880' }}>Aucun fournisseur trouvé</p>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── Modals */}
      <UserModal show={showModal} onClose={() => setShowModal(false)} modalType={modalType} selectedUser={selectedUser} roles={roles} pointsOfSale={pointsOfSale} onUserUpdated={handleUserUpdated} />
      <SupplierModal show={showSupplierModal} onClose={() => setShowSupplierModal(false)} selectedSupplier={selectedSupplier} onSupplierUpdated={handleSupplierUpdated} />
      <RoleModal show={showRoleModal} onClose={() => setShowRoleModal(false)} selectedRole={selectedRoleForEdit} permissions={permissions} onRoleUpdated={handleRoleUpdated} />
    </div>
  );
};

export default UserManagement;