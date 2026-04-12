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

// ─── Status Badge ────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status?: string }) => {
  const s = safeGetStatus(status);
  const config = {
    active:    { label: 'Actif',    cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', dot: 'bg-emerald-500' },
    inactive:  { label: 'Inactif',  cls: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',    dot: 'bg-slate-400' },
    suspended: { label: 'Suspendu', cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',     dot: 'bg-amber-500' },
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
  if (src) return <img src={src} alt={name} className={`${sz} rounded-xl object-cover border border-slate-100 flex-shrink-0`} />;
  return (
    <div className={`${sz} rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initial}
    </div>
  );
};

// ─── Form Field ──────────────────────────────────────────────────────
const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
      {label} {required && <span className="text-rose-400">*</span>}
    </label>
    {children}
  </div>
);

const inputCls = "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white transition-all";

// ─── Section Header ──────────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, label, color }: { icon: any; label: string; color: string }) => (
  <div className={`flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100`}>
    <div className={`p-1.5 rounded-lg ${color}`}>
      <Icon size={15} className="text-white" />
    </div>
    <h5 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{label}</h5>
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
    if (!formData.user.username?.trim()) return 'Le nom d\'utilisateur est requis.';
    if (!formData.user.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.user.email)) return 'Email invalide.';
    if (modalType === 'add' && !formData.user.password?.trim()) return 'Le mot de passe est requis.';
    if (!formData.role) return 'Le rôle est requis.';
    if (!formData.establishment_name?.trim()) return 'Le nom de l\'établissement est requis.';
    if (!formData.establishment_address?.trim()) return 'L\'adresse est requise.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setFormError(err); return; }
    try {
      setFormError(null); setIsSubmitting(true);
      const posIds = (formData.points_of_sale_ids || []).map(id => parseInt(id, 10));
      const base = {
        user: modalType === 'edit' ? { email: formData.user.email, first_name: formData.user.first_name || '', last_name: formData.user.last_name || '' } : { ...formData.user },
        phone: formData.phone || '', location: formData.location || '', status: formData.status, role_id: formData.role || '',
        establishment_name: formData.establishment_name, establishment_type: formData.establishment_type,
        establishment_address: formData.establishment_address, establishment_phone: formData.establishment_phone || '',
        establishment_email: formData.establishment_email || '', points_of_sale_ids: posIds,
      };
      const res = modalType === 'edit' && selectedUser
        ? await apiService.updateUser(selectedUser.id, base)
        : await apiService.createUser(base);
      if (!res.ok) { const d = await res.json(); throw new Error(d?.detail || d?.message || 'Erreur serveur'); }
      const updated = await res.json();
      onUserUpdated(updated, modalType);
      onClose();
    } catch (err: any) {
      if (err.message !== 'Session expired') setFormError(err.message || 'Une erreur est survenue');
    } finally { setIsSubmitting(false); }
  };

  if (!show) return null;

  const isView = modalType === 'view';
  const titles = { add: 'Nouvel utilisateur', edit: 'Modifier l\'utilisateur', view: 'Fiche utilisateur' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-800">{titles[modalType]}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{isView ? 'Informations complètes du compte' : 'Complétez toutes les informations requises'}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-200 transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {isView && selectedUser ? (
            <div className="space-y-6">
              {/* User Header Card */}
              <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100">
                <Avatar src={selectedUser.avatar} name={selectedUser.username} size="lg" />
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-slate-800">{safeGetText(selectedUser.first_name)} {safeGetText(selectedUser.last_name)}</h4>
                  <p className="text-slate-500 text-sm mt-0.5">@{selectedUser.username}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <StatusBadge status={selectedUser.status} />
                    <span className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar size={12} /> {new Date(selectedUser.join_date).toLocaleDateString('fr-FR')}
                    </span>
                    {selectedUser.role_name && (
                      <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">{selectedUser.role_name}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Personal Info */}
                <div className="bg-slate-50 rounded-2xl p-5 space-y-3">
                  <SectionHeader icon={UserIcon} label="Informations personnelles" color="bg-blue-500" />
                  {[
                    { icon: Mail, label: 'Email', value: selectedUser.email },
                    { icon: Phone, label: 'Téléphone', value: safeGetText(selectedUser.phone) },
                    { icon: MapPin, label: 'Localisation', value: safeGetText(selectedUser.location) },
                    { icon: Clock, label: 'Dernière connexion', value: selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString('fr-FR') : 'Jamais' },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-3 bg-white rounded-xl p-3">
                      <div className="p-2 bg-slate-100 rounded-lg flex-shrink-0"><Icon size={14} className="text-slate-500" /></div>
                      <div><p className="text-xs text-slate-400 font-medium">{label}</p><p className="text-sm text-slate-800 font-semibold mt-0.5">{value}</p></div>
                    </div>
                  ))}
                </div>

                {/* Establishment Info */}
                <div className="bg-slate-50 rounded-2xl p-5 space-y-3">
                  <SectionHeader icon={Building2} label="Établissement" color="bg-emerald-500" />
                  {[
                    { label: 'Nom', value: selectedUser.establishment_name },
                    { label: 'Type', value: ESTABLISHMENT_TYPES.find(t => t.value === selectedUser.establishment_type)?.label || selectedUser.establishment_type },
                    { label: 'Téléphone', value: safeGetText(selectedUser.establishment_phone) },
                    { label: 'Email', value: safeGetText(selectedUser.establishment_email) },
                    { label: 'Adresse', value: selectedUser.establishment_address },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-start bg-white rounded-xl p-3">
                      <p className="text-xs text-slate-400 font-medium">{label}</p>
                      <p className="text-sm text-slate-800 font-semibold text-right max-w-[60%]">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Points of Sale */}
              {selectedUser.points_of_sale && selectedUser.points_of_sale.length > 0 && (
                <div className="bg-slate-50 rounded-2xl p-5">
                  <SectionHeader icon={Store} label="Points de vente associés" color="bg-orange-500" />
                  <div className="grid sm:grid-cols-2 gap-2">
                    {selectedUser.points_of_sale.map((pos, i) => {
                      const posObj = typeof pos === 'object' && pos !== null ? pos as PointOfSale : null;
                      return (
                        <div key={i} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-slate-100">
                          <div className="p-2 bg-orange-50 rounded-lg"><Store size={14} className="text-orange-500" /></div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{posObj?.name || `POS ${pos}`}</p>
                            {posObj?.type && <p className="text-xs text-slate-400">{posObj.type}</p>}
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
              {formError && (
                <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  {formError}
                </div>
              )}

              {/* Account Info */}
              <div>
                <SectionHeader icon={UserIcon} label="Informations du compte" color="bg-indigo-500" />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Nom d'utilisateur" required><input type="text" value={formData.user.username} onChange={e => setUser('username', e.target.value)} className={inputCls} required /></Field>
                  <Field label="Email" required><input type="email" value={formData.user.email} onChange={e => setUser('email', e.target.value)} className={inputCls} required /></Field>
                  <Field label="Prénom"><input type="text" value={formData.user.first_name || ''} onChange={e => setUser('first_name', e.target.value)} className={inputCls} /></Field>
                  <Field label="Nom"><input type="text" value={formData.user.last_name || ''} onChange={e => setUser('last_name', e.target.value)} className={inputCls} /></Field>
                  {modalType === 'add' && <Field label="Mot de passe" required><input type="password" value={formData.user.password || ''} onChange={e => setUser('password', e.target.value)} className={inputCls} required /></Field>}
                  <Field label="Téléphone"><input type="tel" value={formData.phone || ''} onChange={e => setField('phone', e.target.value)} className={inputCls} /></Field>
                  <Field label="Localisation"><input type="text" value={formData.location || ''} onChange={e => setField('location', e.target.value)} className={inputCls} /></Field>
                  <Field label="Rôle" required>
                    <select value={formData.role || ''} onChange={e => setField('role', e.target.value)} className={inputCls} required>
                      <option value="">Sélectionner un rôle</option>
                      {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Statut" required>
                    <select value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value as any }))} className={inputCls}>
                      <option value="active">Actif</option>
                      <option value="inactive">Inactif</option>
                      <option value="suspended">Suspendu</option>
                    </select>
                  </Field>
                </div>
              </div>

              {/* Establishment */}
              <div>
                <SectionHeader icon={Building2} label="Informations de l'établissement" color="bg-emerald-500" />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Nom de l'établissement" required><input type="text" value={formData.establishment_name} onChange={e => setField('establishment_name', e.target.value)} className={inputCls} required /></Field>
                  <Field label="Type d'établissement" required>
                    <select value={formData.establishment_type} onChange={e => setField('establishment_type', e.target.value)} className={inputCls}>
                      {ESTABLISHMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Téléphone établissement"><input type="tel" value={formData.establishment_phone || ''} onChange={e => setField('establishment_phone', e.target.value)} className={inputCls} /></Field>
                  <Field label="Email établissement"><input type="email" value={formData.establishment_email || ''} onChange={e => setField('establishment_email', e.target.value)} className={inputCls} /></Field>
                  <div className="sm:col-span-2">
                    <Field label="Adresse" required><textarea value={formData.establishment_address} onChange={e => setField('establishment_address', e.target.value)} className={inputCls + ' resize-none'} rows={3} required /></Field>
                  </div>
                </div>
              </div>

              {/* Points of Sale */}
              {pointsOfSale.length > 0 && (
                <div>
                  <SectionHeader icon={Store} label="Points de vente associés" color="bg-orange-500" />
                  <div className="grid sm:grid-cols-2 gap-2">
                    {pointsOfSale.map(pos => (
                      <label key={pos.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${formData.points_of_sale_ids?.includes(pos.id.toString()) ? 'bg-indigo-50 border-indigo-300' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                        <input type="checkbox" checked={formData.points_of_sale_ids?.includes(pos.id.toString()) || false} onChange={e => togglePOS(pos.id.toString(), e.target.checked)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{pos.name}</p>
                          {pos.type && <p className="text-xs text-slate-400">{pos.type}</p>}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Avatar */}
              <div>
                <SectionHeader icon={UserIcon} label="Photo de profil" color="bg-violet-500" />
                <div className="flex items-center gap-5">
                  {avatarPreview
                    ? <img src={avatarPreview} alt="Preview" className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md" />
                    : <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center"><UserIcon size={24} className="text-slate-300" /></div>
                  }
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all" />
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        {!isView && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex-shrink-0">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors">
              Annuler
            </button>
            <button form="user-form" type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
              {isSubmitting ? <><Loader size={15} className="animate-spin" /> Enregistrement…</> : modalType === 'add' ? 'Créer l\'utilisateur' : 'Enregistrer'}
            </button>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-800">{selectedSupplier ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{selectedSupplier ? 'Mettez à jour les informations' : 'Ajoutez un nouveau partenaire'}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-200 transition-colors"><X size={18} className="text-slate-500" /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          <form onSubmit={handleSubmit} id="supplier-form" className="space-y-6">
            {formError && (
              <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
                <AlertCircle size={16} className="flex-shrink-0" />{formError}
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Nom du fournisseur" required><input type="text" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className={inputCls} required /></Field>
              <Field label="Type" required>
                <select value={formData.types} onChange={e => setFormData(p => ({ ...p, types: e.target.value }))} className={inputCls} required>
                  <option value="">Sélectionner</option>
                  {SUPPLIER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Contact" required><input type="text" value={formData.contact} onChange={e => setFormData(p => ({ ...p, contact: e.target.value }))} className={inputCls} required /></Field>
              <Field label="Email" required><input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} className={inputCls} required /></Field>
              <div className="sm:col-span-2">
                <Field label="Adresse"><textarea value={formData.address} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))} className={inputCls + ' resize-none'} rows={3} /></Field>
              </div>
            </div>
            <div>
              <SectionHeader icon={FileText} label="Logo du fournisseur" color="bg-violet-500" />
              <div className="flex items-center gap-5">
                {logoPreview
                  ? <img src={logoPreview} alt="Logo" className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md" />
                  : <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center"><Building2 size={24} className="text-slate-300" /></div>
                }
                <input type="file" accept="image/*" onChange={handleLogoChange} className="text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
              </div>
            </div>
          </form>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex-shrink-0">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">Annuler</button>
          <button form="supplier-form" type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-semibold disabled:opacity-50 shadow-sm">
            {isSubmitting ? <><Loader size={15} className="animate-spin" /> Enregistrement…</> : selectedSupplier ? 'Enregistrer' : 'Créer le fournisseur'}
          </button>
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
  const [formData, setFormData] = useState<NewRole>({ id: '', name: '', description: '', permissions: [], color: '#6366f1' });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!show) return;
    if (selectedRole) {
      setFormData({
        id: selectedRole.id, name: selectedRole.name, description: selectedRole.description || '',
        permissions: selectedRole.permissions.map(p => p.id), color: selectedRole.color || '#6366f1',
        tableau: selectedRole.tableau || false, distributeurs: selectedRole.distributeurs || false,
        commerciaux: selectedRole.commerciaux || false, prospects: selectedRole.prospects || false,
        inventaire: selectedRole.inventaire || false, commande: selectedRole.commande || false,
        utilisateur: selectedRole.utilisateur || false, analytique: selectedRole.analytique || false,
        geolocalisation: selectedRole.geolocalisation || false, configuration: selectedRole.configuration || false,
        positions: selectedRole.positions || false, createcommande: selectedRole.createcommande || false,
        vuecommande: selectedRole.vuecommande || false,
      });
    } else {
      setFormData({ id: '', name: '', description: '', permissions: [], color: '#6366f1', tableau: false, distributeurs: false, commerciaux: false, prospects: false, inventaire: false, commande: false, utilisateur: false, analytique: false, geolocalisation: false, configuration: false, positions: false, createcommande: false, vuecommande: false });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-800">{selectedRole ? 'Modifier le rôle' : 'Nouveau rôle'}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{selectedRole ? 'Mettez à jour le rôle et ses accès' : 'Définissez un nouveau profil d\'accès'}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-200 transition-colors"><X size={18} className="text-slate-500" /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-7">
          <form onSubmit={handleSubmit} id="role-form">
            {formError && (
              <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 mb-5">
                <AlertCircle size={16} className="flex-shrink-0" />{formError}
              </div>
            )}

            {/* Basic Info */}
            <div>
              <SectionHeader icon={Shield} label="Informations de base" color="bg-indigo-500" />
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="ID du rôle" required>
                  <input type="text" value={formData.id} onChange={e => setFormData(p => ({ ...p, id: e.target.value }))} className={inputCls} required disabled={!!selectedRole} />
                </Field>
                <Field label="Nom du rôle" required>
                  <input type="text" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className={inputCls} required />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Description">
                    <input type="text" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} className={inputCls} placeholder="Description du rôle…" />
                  </Field>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Couleur du rôle</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={formData.color || '#6366f1'} onChange={e => setFormData(p => ({ ...p, color: e.target.value }))} className="w-12 h-12 rounded-xl border border-slate-200 cursor-pointer" />
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{formData.color || '#6366f1'}</p>
                      <p className="text-xs text-slate-400">Couleur d'affichage</p>
                    </div>
                    <div className="ml-auto">
                      <span className="px-3 py-1.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: formData.color || '#6366f1' }}>
                        {formData.name || 'Aperçu'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Module Access */}
            <div>
              <SectionHeader icon={Settings} label="Accès aux modules" color="bg-violet-500" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {MODULE_PERMISSIONS.map(({ key, label, icon: Icon }) => {
                  const checked = formData[key as keyof NewRole] as boolean || false;
                  return (
                    <label key={key} className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${checked ? 'bg-indigo-50 border-indigo-300' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                      <input type="checkbox" checked={checked} onChange={e => setFormData(p => ({ ...p, [key]: e.target.checked }))} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                      <Icon size={14} className={checked ? 'text-indigo-500' : 'text-slate-400'} />
                      <span className={`text-xs font-semibold ${checked ? 'text-indigo-700' : 'text-slate-600'}`}>{label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Permissions by category */}
            {Object.keys(permByCategory).length > 0 && (
              <div>
                <SectionHeader icon={Shield} label="Permissions détaillées" color="bg-emerald-500" />
                <div className="space-y-3">
                  {Object.entries(permByCategory).map(([category, perms]) => (
                    <div key={category} className="border border-slate-100 rounded-xl overflow-hidden">
                      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{category}</span>
                      </div>
                      <div className="p-3 grid sm:grid-cols-2 gap-2">
                        {perms.map(perm => (
                          <label key={perm.id} className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${formData.permissions.includes(perm.id) ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                            <input type="checkbox" checked={formData.permissions.includes(perm.id)} onChange={() => togglePerm(perm.id)} className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                            <div>
                              <p className={`text-sm font-semibold ${formData.permissions.includes(perm.id) ? 'text-emerald-800' : 'text-slate-700'}`}>{perm.name}</p>
                              {perm.description && <p className="text-xs text-slate-400 mt-0.5">{perm.description}</p>}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex-shrink-0">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">Annuler</button>
          <button form="role-form" type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-semibold disabled:opacity-50 shadow-sm">
            {isSubmitting ? <><Loader size={15} className="animate-spin" /> Enregistrement…</> : selectedRole ? 'Enregistrer' : 'Créer le rôle'}
          </button>
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
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 border-3 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto" style={{ borderWidth: 3 }} />
        <p className="text-sm font-medium text-slate-500">Chargement des données…</p>
      </div>
    </div>
  );

  const activeCount = users.filter(u => u.status === 'active').length;
  const suspendedCount = users.filter(u => u.status === 'suspended').length;

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
          <AlertCircle size={16} className="flex-shrink-0" />{error}
        </div>
      )}

      {/* ── Stat Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Utilisateurs', value: users.length, sub: `${activeCount} actifs`, icon: Users, from: 'from-indigo-500', to: 'to-violet-600' },
          { label: 'Actifs', value: activeCount, sub: `${users.length > 0 ? Math.round(activeCount / users.length * 100) : 0}% du total`, icon: UserCheck, from: 'from-emerald-500', to: 'to-teal-600' },
          { label: 'Suspendus', value: suspendedCount, sub: 'Nécessite attention', icon: UserX, from: 'from-amber-500', to: 'to-orange-500' },
          { label: 'Fournisseurs', value: suppliers.length, sub: 'Partenaires actifs', icon: Factory, from: 'from-pink-500', to: 'to-rose-500' },
        ].map(({ label, value, sub, icon: Icon, from, to }) => (
          <div key={label} className={`bg-gradient-to-br ${from} ${to} rounded-2xl p-5 text-white`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">{label}</p>
                <p className="text-3xl font-bold mt-1 tracking-tight">{value}</p>
                <p className="text-white/60 text-xs mt-1.5">{sub}</p>
              </div>
              <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-sm">
                <Icon size={20} className="text-white/90" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Roles Section ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-800">Rôles système</h3>
            <p className="text-xs text-slate-400 mt-0.5">Configurez les profils d'accès</p>
          </div>
          <button onClick={() => { setSelectedRoleForEdit(null); setShowRoleModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-semibold shadow-sm">
            <Plus size={15} /> Nouveau rôle
          </button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {roles.map(role => (
            <div key={role.id} className="group relative bg-slate-50 rounded-xl p-4 border border-slate-100 hover:border-slate-200 hover:bg-white transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: role.color || '#6366f1' }} />
                  <h4 className="text-sm font-bold text-slate-800 truncate">{role.name}</h4>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => { setSelectedRoleForEdit(role); setShowRoleModal(true); }} className="p-1.5 rounded-lg hover:bg-indigo-100 hover:text-indigo-600 text-slate-400 transition-colors"><Edit size={13} /></button>
                  <button onClick={() => deleteRole(role.id)} className="p-1.5 rounded-lg hover:bg-rose-100 hover:text-rose-600 text-slate-400 transition-colors"><Trash2 size={13} /></button>
                </div>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2 mb-3">{role.description || 'Aucune description'}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">{role.users} utilisateur{role.users !== 1 ? 's' : ''}</span>
                <span className="text-[11px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-medium">{role.permissions.length} perm.</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab Panel ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {/* Tab Bar */}
        <div className="flex border-b border-slate-100 px-5 pt-2">
          {([['users', Users, 'Utilisateurs'], ['suppliers', Factory, 'Fournisseurs']] as const).map(([tab, Icon, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all mr-1 ${activeTab === tab ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
              <Icon size={16} />{label}
            </button>
          ))}
        </div>

        {/* ── Users Tab ─────────────────────────────────────────── */}
        {activeTab === 'users' ? (
          <>
            <div className="p-5 flex flex-col lg:flex-row lg:items-center gap-3 border-b border-slate-50">
              <div className="relative flex-1 max-w-xs">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Rechercher…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all" />
              </div>
              <div className="flex flex-wrap gap-2 flex-1">
                <select value={selectedRoleFilter} onChange={e => setSelectedRoleFilter(e.target.value)} className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 appearance-none">
                  <option value="all">Tous les rôles</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 appearance-none">
                  <option value="all">Tous les statuts</option>
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                  <option value="suspended">Suspendu</option>
                </select>
                <select value={selectedEstType} onChange={e => setSelectedEstType(e.target.value)} className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 appearance-none">
                  <option value="all">Tous les types</option>
                  {ESTABLISHMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button className="flex items-center gap-1.5 px-3.5 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium text-slate-600">
                  <Download size={14} /> Exporter
                </button>
                <button onClick={() => { setModalType('add'); setSelectedUser(null); setShowModal(true); }}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-semibold shadow-sm">
                  <Plus size={15} /> Nouvel utilisateur
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {[['username', 'Utilisateur'], [null, 'Établissement'], [null, 'Contact'], [null, 'Rôle'], [null, 'Statut'], ['last_login', 'Dernière connexion'], [null, '']].map(([key, label], i) => (
                      <th key={i} className={`py-3.5 px-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider ${i === 6 ? 'text-right' : ''}`}>
                        {key ? (
                          <button onClick={() => handleSort(key)} className="flex items-center gap-1.5 hover:text-slate-600 transition-colors">
                            {label} <ArrowUpDown size={12} />
                          </button>
                        ) : label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedUsers.length > 0 ? paginatedUsers.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <Avatar src={user.avatar} name={user.username} />
                          <div>
                            <p className="text-sm font-bold text-slate-800">{safeGetText(user.first_name)} {safeGetText(user.last_name)}</p>
                            <p className="text-xs text-slate-400">@{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <p className="text-sm font-semibold text-slate-700">{user.establishment_name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{getEstType(user.establishment_type)}</p>
                        {user.points_of_sale?.length > 0 && <p className="text-xs text-indigo-500 mt-0.5 font-medium">{user.points_of_sale.length} POS</p>}
                      </td>
                      <td className="py-3.5 px-5">
                        <p className="text-sm text-slate-700 font-medium">{user.email}</p>
                        {user.phone && <p className="text-xs text-slate-400 mt-0.5">{user.phone}</p>}
                      </td>
                      <td className="py-3.5 px-5">
                        {user.role
                          ? <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">{user.role_name || roles.find(r => r.id === user.role)?.name || 'Rôle inconnu'}</span>
                          : <span className="text-xs text-slate-300">—</span>
                        }
                      </td>
                      <td className="py-3.5 px-5"><StatusBadge status={user.status} /></td>
                      <td className="py-3.5 px-5">
                        <p className="text-xs text-slate-500">{user.last_login ? new Date(user.last_login).toLocaleDateString('fr-FR') : <span className="text-slate-300">Jamais</span>}</p>
                        {user.last_login && <p className="text-[11px] text-slate-300">{new Date(user.last_login).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setModalType('view'); setSelectedUser(user); setShowModal(true); }} className="p-2 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 text-slate-300 transition-colors" title="Voir"><Eye size={15} /></button>
                          <button onClick={() => { setModalType('edit'); setSelectedUser(user); setShowModal(true); }} className="p-2 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 text-slate-300 transition-colors" title="Modifier"><Edit size={15} /></button>
                          <button onClick={() => deleteUser(user.id)} className="p-2 rounded-lg hover:bg-rose-50 hover:text-rose-600 text-slate-300 transition-colors" title="Supprimer"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={7} className="py-16 text-center">
                      <Users size={40} className="mx-auto text-slate-200 mb-3" />
                      <p className="text-sm font-medium text-slate-400">Aucun utilisateur trouvé</p>
                      <p className="text-xs text-slate-300 mt-1">Modifiez vos critères de recherche</p>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50/50">
                <p className="text-xs text-slate-400">
                  {(currentPage - 1) * usersPerPage + 1}–{Math.min(currentPage * usersPerPage, sortedUsers.length)} sur {sortedUsers.length}
                </p>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    Préc.
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let p = i + 1;
                    if (totalPages > 5) {
                      if (currentPage <= 3) p = i + 1;
                      else if (currentPage >= totalPages - 2) p = totalPages - 4 + i;
                      else p = currentPage - 2 + i;
                    }
                    return (
                      <button key={p} onClick={() => setCurrentPage(p)} className={`w-9 h-9 rounded-xl text-xs font-bold transition-colors ${currentPage === p ? 'bg-indigo-600 text-white shadow-sm' : 'border border-slate-200 text-slate-600 hover:bg-white'}`}>{p}</button>
                    );
                  })}
                  <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    Suiv.
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* ── Suppliers Tab ──────────────────────────────────────── */
          <>
            <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-3 border-b border-slate-50">
              <div className="relative flex-1 max-w-xs">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Rechercher un fournisseur…" value={supplierSearchTerm} onChange={e => setSupplierSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all" />
              </div>
              <button onClick={() => { setSelectedSupplier(null); setShowSupplierModal(true); }} className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-semibold shadow-sm ml-auto">
                <Plus size={15} /> Nouveau fournisseur
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Fournisseur', 'Type', 'Contact', 'Email', 'Créé le', ''].map((h, i) => (
                      <th key={i} className={`py-3.5 px-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider ${i === 5 ? 'text-right' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredSuppliers.length > 0 ? filteredSuppliers.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          {s.logo
                            ? <img src={s.logo} alt={s.name} className="w-9 h-9 rounded-xl object-cover border border-slate-100 flex-shrink-0" />
                            : <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{s.name.charAt(0).toUpperCase()}</div>
                          }
                          <div>
                            <p className="text-sm font-bold text-slate-800">{s.name}</p>
                            <p className="text-xs text-slate-400 truncate max-w-[140px]">{s.address || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">{getSupplierType(s.types)}</span>
                      </td>
                      <td className="py-3.5 px-5"><p className="text-sm text-slate-700">{s.contact}</p></td>
                      <td className="py-3.5 px-5"><p className="text-sm text-slate-700">{s.email}</p></td>
                      <td className="py-3.5 px-5"><p className="text-xs text-slate-400">{new Date(s.created_at).toLocaleDateString('fr-FR')}</p></td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setSelectedSupplier(s); setShowSupplierModal(true); }} className="p-2 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 text-slate-300 transition-colors"><Edit size={15} /></button>
                          <button onClick={() => deleteSupplier(s.id)} className="p-2 rounded-lg hover:bg-rose-50 hover:text-rose-600 text-slate-300 transition-colors"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="py-16 text-center">
                      <Factory size={40} className="mx-auto text-slate-200 mb-3" />
                      <p className="text-sm font-medium text-slate-400">Aucun fournisseur trouvé</p>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────── */}
      <UserModal show={showModal} onClose={() => setShowModal(false)} modalType={modalType} selectedUser={selectedUser} roles={roles} pointsOfSale={pointsOfSale} onUserUpdated={handleUserUpdated} />
      <SupplierModal show={showSupplierModal} onClose={() => setShowSupplierModal(false)} selectedSupplier={selectedSupplier} onSupplierUpdated={handleSupplierUpdated} />
      <RoleModal show={showRoleModal} onClose={() => setShowRoleModal(false)} selectedRole={selectedRoleForEdit} permissions={permissions} onRoleUpdated={handleRoleUpdated} />
    </div>
  );
};

export default UserManagement;