import React, { useState, useEffect, useCallback } from 'react';
import {
  Package, Search, Eye, Edit, Trash2, Plus,
  Calendar, MapPin, CheckCircle,
  Clock, AlertCircle, XCircle, Truck, DollarSign,
  Download, RefreshCw, Star, List, ShoppingCart,
  Users, Target, BarChart3, TrendingUp, FileText,
  ChevronLeft, ChevronRight, AlertTriangle
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
type Priority = 'low' | 'medium' | 'high';

interface UserRole {
  id: number;
  name: string;
  createcommande: boolean;
  vuecommande: boolean;
}

interface UserProfile {
  id: number;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  profile?: {
    phone?: string;
    location?: string;
    role?: UserRole;
    status?: string;
    avatar?: string | null;
    points_of_sale?: string[];
  };
}

interface PointOfSale {
  id: number;
  name: string;
  owner?: string;
  phone?: string;
  email?: string;
  address?: string;
  status?: string;
  avatar?: string;
}

interface Product { id: number; name: string; sku?: string; status?: string; }
interface ProductFormat { id: number; name?: string; description?: string; }

interface ProductVariant {
  id: number;
  product?: Product;
  format?: ProductFormat;
  current_stock?: number;
  min_stock?: number;
  max_stock?: number;
  price: string;
  barcode?: string;
  image?: string;
}

interface OrderItem {
  id: number;
  product_variant?: ProductVariant;
  product_name?: string;
  name?: string;
  quantity: number;
  price: string;
  total: string;
  quantity_affecte: string;
}

interface Order {
  id: number;
  point_of_sale?: number;
  point_of_sale_details?: PointOfSale;
  status: OrderStatus;
  total: string;
  date: string;
  delivery_date?: string;
  priority: Priority;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  items: OrderItem[];
}

interface NewOrderItem {
  product_variant_id: number;
  quantity: number;
  price: string;
}

interface NewOrder {
  point_of_sale_id: number | null;
  date: string;
  delivery_date: string;
  priority: Priority;
  notes: string;
  items: NewOrderItem[];
}

interface MobileVendor {
  id: number;
  full_name: string;
  phone?: string;
  email?: string;
  status?: string;
}

interface VendorActivity {
  vendor: number | null;
  activity_type: string;
  timestamp: string;
  location: { lat: number; lng: number } | null;
  notes: string;
  related_order: number | null;
  quantity_assignes: number | null;
  quantity_sales: number | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const API_BASE = 'https://backendsupply.onrender.com/api';
const ORDERS_PER_PAGE = 10;

const STATUS_CONFIG: Record<OrderStatus, { label: string; colorClass: string; bgClass: string; borderClass: string; icon: React.FC<any> }> = {
  pending:   { label: 'En Attente', colorClass: 'text-amber-700',   bgClass: 'bg-amber-50',   borderClass: 'border-amber-200',   icon: Clock },
  confirmed: { label: 'Confirmée',  colorClass: 'text-blue-700',    bgClass: 'bg-blue-50',    borderClass: 'border-blue-200',    icon: CheckCircle },
  shipped:   { label: 'Expédiée',   colorClass: 'text-indigo-700',  bgClass: 'bg-indigo-50',  borderClass: 'border-indigo-200',  icon: Truck },
  delivered: { label: 'Livrée',     colorClass: 'text-emerald-700', bgClass: 'bg-emerald-50', borderClass: 'border-emerald-200', icon: CheckCircle },
  cancelled: { label: 'Annulée',    colorClass: 'text-red-700',     bgClass: 'bg-red-50',     borderClass: 'border-red-200',     icon: XCircle },
};

const PRIORITY_CONFIG: Record<Priority, { label: string; colorClass: string }> = {
  high:   { label: 'Haute',   colorClass: 'text-red-500' },
  medium: { label: 'Moyenne', colorClass: 'text-amber-500' },
  low:    { label: 'Basse',   colorClass: 'text-emerald-500' },
};

const ACTIVITY_TYPES = [
  { value: 'sale',                label: 'Vente' },
  { value: 'stock_replenishment', label: 'Réapprovisionnement' },
  { value: 'check_in',            label: 'Check-in' },
  { value: 'check_out',           label: 'Check-out' },
  { value: 'incident',            label: 'Incident' },
  { value: 'other',               label: 'Autre' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (amount: string | number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 })
    .format(parseFloat(String(amount)) || 0);

const formatDate = (dateStr?: string) =>
  dateStr ? new Date(dateStr).toLocaleDateString('fr-FR') : 'Non spécifiée';

const isToday = (d: string) => new Date(d).toDateString() === new Date().toDateString();
const isThisWeek = (d: string) => { const now = new Date(); const week = new Date(now); week.setDate(now.getDate() - 7); return new Date(d) >= week; };
const isThisMonth = (d: string) => { const now = new Date(); const dt = new Date(d); return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear(); };

const getAuthHeaders = () => {
  const token = localStorage.getItem('access');
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : null;
};

// ─── Shared UI Components ─────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.colorClass} ${cfg.bgClass} ${cfg.borderClass}`}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
};

const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <span className={`inline-flex items-center gap-1 text-sm font-medium ${cfg.colorClass}`}>
      <Star size={14} fill="currentColor" />
      {cfg.label}
    </span>
  );
};

const ErrorBanner: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => (
  <div className="flex items-center justify-between p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 mb-6">
    <div className="flex items-center gap-2">
      <AlertTriangle size={18} />
      <span className="font-medium text-sm">{message}</span>
    </div>
    <button onClick={onClose} className="text-red-400 hover:text-red-600 transition-colors">
      <XCircle size={18} />
    </button>
  </div>
);

const Spinner: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
      <p className="text-gray-500 font-medium">Chargement en cours…</p>
    </div>
  </div>
);

const ModalWrapper: React.FC<{ onClose: () => void; children: React.ReactNode }> = ({ onClose, children }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto" style={{ maxWidth: '56rem' }}>
      {children}
    </div>
  </div>
);

const ModalHeader: React.FC<{ title: string; subtitle?: string; onClose: () => void }> = ({ title, subtitle, onClose }) => (
  <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-gradient-to-r from-indigo-50 to-white rounded-t-2xl">
    <div>
      <h3 className="text-xl font-bold text-gray-900">{title}</h3>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
      <XCircle size={22} />
    </button>
  </div>
);

const FormField: React.FC<{ label: string; icon?: React.ReactNode; required?: boolean; children: React.ReactNode }> = ({ label, icon, required, children }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-800 mb-2">
      {icon && <span className="inline-flex mr-1.5 text-indigo-500 align-middle">{icon}</span>}
      {label}{required && ' *'}
    </label>
    {children}
  </div>
);

const inputClass = "w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-colors text-sm";

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard: React.FC<{ label: string; value: string | number; icon: React.FC<any>; iconBg: string; iconColor: string; trend?: string; trendColor?: string }> =
  ({ label, value, icon: Icon, iconBg, iconColor, trend, trendColor = 'text-gray-500' }) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-3">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <div className={`p-2.5 rounded-xl ${iconBg}`}>
        <Icon className={iconColor} size={20} />
      </div>
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    {trend && <p className={`text-xs mt-2 flex items-center gap-1 ${trendColor}`}><TrendingUp size={12} />{trend}</p>}
  </div>
);

// ─── Order Items Editor (shared between Add & Edit) ───────────────────────────

const OrderItemsEditor: React.FC<{
  items: NewOrderItem[];
  productVariants: ProductVariant[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  onChange: (i: number, field: keyof NewOrderItem, value: any) => void;
}> = ({ items, productVariants, onAdd, onRemove, onChange }) => (
  <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
    {items.length > 0 && (
      <div className="px-4 pt-3 pb-1 grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
        <div className="col-span-5">Produit</div>
        <div className="col-span-2">Format</div>
        <div className="col-span-2 text-center">Qté</div>
        <div className="col-span-2 text-right">Prix unit.</div>
        <div className="col-span-1"></div>
      </div>
    )}
    <div className="p-3 space-y-2">
      {items.map((item, index) => {
        const variant = productVariants.find(v => v.id === item.product_variant_id);
        return (
          <div key={index} className="grid grid-cols-12 gap-2 items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
            <div className="col-span-5">
              <select
                required
                value={item.product_variant_id}
                onChange={(e) => onChange(index, 'product_variant_id', parseInt(e.target.value))}
                className={inputClass}
              >
                <option value={0}>Sélectionner un produit</option>
                {productVariants.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.product?.name || 'Inconnu'} — {v.format?.name || 'Sans format'}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2 text-sm text-gray-500 font-medium truncate">
              {variant?.format?.name || '—'}
            </div>
            <div className="col-span-2">
              <input
                type="number"
                required
                min={1}
                max={variant?.current_stock || 9999}
                value={item.quantity}
                onChange={(e) => onChange(index, 'quantity', parseInt(e.target.value) || 1)}
                className={inputClass + ' text-center'}
              />
            </div>
            <div className="col-span-2 text-right text-sm font-semibold text-gray-700">
              {formatCurrency(item.price)}
            </div>
            <div className="col-span-1 flex justify-center">
              <button type="button" onClick={() => onRemove(index)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <XCircle size={16} />
              </button>
            </div>
          </div>
        );
      })}
      <button
        type="button"
        onClick={onAdd}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 hover:text-indigo-600 hover:border-indigo-300 transition-colors bg-white flex items-center justify-center gap-2 text-sm font-medium"
      >
        <Plus size={15} /> Ajouter un article
      </button>
    </div>
  </div>
);

// ─── Add Order Modal ──────────────────────────────────────────────────────────

const AddOrderModal: React.FC<{
  onClose: () => void;
  onCreated: (order: Order) => void;
  productVariants: ProductVariant[];
  pointsOfSale: PointOfSale[];
}> = ({ onClose, onCreated, productVariants, pointsOfSale }) => {
  const [form, setForm] = useState<NewOrder>({
    point_of_sale_id: null,
    date: new Date().toISOString().split('T')[0],
    delivery_date: '',
    priority: 'medium',
    notes: '',
    items: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleItemChange = (index: number, field: keyof NewOrderItem, value: any) => {
    setForm(prev => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      if (field === 'product_variant_id') {
        const variant = productVariants.find(v => v.id === value);
        items[index].price = variant?.price ?? '0';
      }
      return { ...prev, items };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.point_of_sale_id) return setError('Veuillez sélectionner un point de vente.');
    if (form.items.length === 0) return setError('Veuillez ajouter au moins un article.');

    const headers = getAuthHeaders();
    if (!headers) return setError('Veuillez vous connecter.');

    for (const item of form.items) {
      const variant = productVariants.find(v => v.id === item.product_variant_id);
      if (!variant) return setError('Variante de produit invalide.');
      if ((variant.current_stock || 0) < item.quantity)
        return setError(`Stock insuffisant pour ${variant.product?.name || 'ce produit'}.`);
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/orders/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          point_of_sale: form.point_of_sale_id,
          date: form.date,
          delivery_date: form.delivery_date,
          priority: form.priority,
          notes: form.notes,
          items: form.items.map(({ product_variant_id, quantity }) => ({ product_variant_id, quantity })),
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || JSON.stringify(d)); }
      const created = await res.json();
      onCreated(created);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalWrapper onClose={onClose}>
      <ModalHeader title="Nouvelle Commande" onClose={onClose} />
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

          <FormField label="Point de vente" icon={<MapPin size={14} />} required>
            <select required value={form.point_of_sale_id || ''} onChange={e => setForm(p => ({ ...p, point_of_sale_id: parseInt(e.target.value) || null }))} className={inputClass}>
              <option value="">Sélectionner un point de vente</option>
              {pointsOfSale.map(pos => <option key={pos.id} value={pos.id}>{pos.name}{pos.address ? ` — ${pos.address}` : ''}</option>)}
            </select>
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Priorité" icon={<Star size={14} />} required>
              <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value as Priority }))} className={inputClass}>
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
              </select>
            </FormField>
            <FormField label="Date commande" icon={<Calendar size={14} />} required>
              <input type="date" required value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className={inputClass} />
            </FormField>
            <FormField label="Date livraison" icon={<Calendar size={14} />} required>
              <input type="date" required value={form.delivery_date} onChange={e => setForm(p => ({ ...p, delivery_date: e.target.value }))} className={inputClass} />
            </FormField>
          </div>

          <FormField label="Articles" icon={<Package size={14} />}>
            <OrderItemsEditor
              items={form.items}
              productVariants={productVariants}
              onAdd={() => setForm(p => ({ ...p, items: [...p.items, { product_variant_id: 0, quantity: 1, price: '0' }] }))}
              onRemove={(i) => setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }))}
              onChange={handleItemChange}
            />
          </FormField>

          <FormField label="Notes" icon={<FileText size={14} />}>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className={inputClass + ' resize-none'} rows={3} placeholder="Instructions, remarques…" />
          </FormField>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium">Annuler</button>
            <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-semibold shadow-sm disabled:opacity-60">
              {submitting ? 'Création…' : 'Créer la commande'}
            </button>
          </div>
        </form>
      </div>
    </ModalWrapper>
  );
};

// ─── Edit Order Modal ─────────────────────────────────────────────────────────

const EditOrderModal: React.FC<{
  order: Order;
  onClose: () => void;
  onUpdated: (order: Order) => void;
  productVariants: ProductVariant[];
}> = ({ order, onClose, onUpdated, productVariants }) => {
  const [form, setForm] = useState({ ...order });
  const [items, setItems] = useState<NewOrderItem[]>(
    order.items.map(item => ({ product_variant_id: item.product_variant?.id || 0, quantity: item.quantity, price: item.price }))
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleItemChange = (index: number, field: keyof NewOrderItem, value: any) => {
    setItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (field === 'product_variant_id') {
        const variant = productVariants.find(v => v.id === value);
        next[index].price = variant?.price ?? '0';
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (items.length === 0) return setError('Veuillez ajouter au moins un article.');
    const headers = getAuthHeaders();
    if (!headers) return setError('Veuillez vous connecter.');
    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/orders/${order.id}/`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          point_of_sale: form.point_of_sale,
          date: form.date,
          delivery_date: form.delivery_date,
          priority: form.priority,
          status: form.status,
          notes: form.notes,
          items: items.map(({ product_variant_id, quantity }) => ({ product_variant_id, quantity })),
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || JSON.stringify(d)); }
      onUpdated(await res.json());
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalWrapper onClose={onClose}>
      <ModalHeader title="Modifier la Commande" subtitle={`Commande #${order.id}`} onClose={onClose} />
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Date commande">
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className={inputClass} />
            </FormField>
            <FormField label="Date livraison">
              <input type="date" value={form.delivery_date || ''} onChange={e => setForm(p => ({ ...p, delivery_date: e.target.value }))} className={inputClass} />
            </FormField>
            <FormField label="Priorité">
              <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value as Priority }))} className={inputClass}>
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
              </select>
            </FormField>
            <FormField label="Statut">
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as OrderStatus }))} className={inputClass}>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </FormField>
          </div>

          <FormField label="Articles">
            <OrderItemsEditor
              items={items}
              productVariants={productVariants}
              onAdd={() => setItems(p => [...p, { product_variant_id: 0, quantity: 1, price: '0' }])}
              onRemove={(i) => setItems(p => p.filter((_, idx) => idx !== i))}
              onChange={handleItemChange}
            />
          </FormField>

          <FormField label="Notes">
            <textarea value={form.notes || ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className={inputClass + ' resize-none'} rows={3} placeholder="Notes supplémentaires…" />
          </FormField>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium">Annuler</button>
            <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-semibold shadow-sm disabled:opacity-60">
              {submitting ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </ModalWrapper>
  );
};

// ─── Order Details Modal ──────────────────────────────────────────────────────

const OrderDetailsModal: React.FC<{
  order: Order;
  canEdit: boolean;
  onClose: () => void;
  onEdit: (order: Order) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: OrderStatus) => void;
  onAssign: (order: Order, item: OrderItem) => void;
}> = ({ order, canEdit, onClose, onEdit, onDelete, onStatusChange, onAssign }) => {
  const cfg = STATUS_CONFIG[order.status];

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Commande #${order.id}</title>
      <style>body{font-family:system-ui,sans-serif;padding:24px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #e5e7eb;padding:10px;text-align:left}th{background:#4f46e5;color:#fff}</style>
      </head><body>
      <h1>Commande #${order.id}</h1>
      <p>Point de vente: ${order.point_of_sale_details?.name || '—'}</p>
      <p>Date: ${formatDate(order.date)} | Livraison: ${formatDate(order.delivery_date)}</p>
      <table><thead><tr><th>Produit</th><th>Qté</th><th>Prix</th><th>Total</th></tr></thead><tbody>
      ${order.items.map(i => `<tr><td>${i.product_name || i.product_variant?.product?.name || '—'}</td><td>${i.quantity}</td><td>${formatCurrency(i.price)}</td><td>${formatCurrency(i.total)}</td></tr>`).join('')}
      </tbody><tfoot><tr><td colspan="3"><strong>Total</strong></td><td><strong>${formatCurrency(order.total)}</strong></td></tr></tfoot></table>
      <script>window.onload=()=>window.print()</script></body></html>`);
    win.document.close();
  };

  return (
    <ModalWrapper onClose={onClose}>
      <ModalHeader title="Détails de la Commande" subtitle={`CMD-${order.id}`} onClose={onClose} />
      <div className="p-6 space-y-6">
        {/* Info grid */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className={`p-5 rounded-xl border ${cfg.borderClass} ${cfg.bgClass}`}>
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
              <MapPin size={14} className="text-indigo-500" /> Point de Vente
            </h4>
            <div className="space-y-1.5 text-sm">
              {[
                ['Nom', order.point_of_sale_details?.name],
                ['Propriétaire', order.point_of_sale_details?.owner],
                ['Email', order.point_of_sale_details?.email],
                ['Téléphone', order.point_of_sale_details?.phone],
                ['Adresse', order.point_of_sale_details?.address],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between gap-4">
                  <span className="text-gray-500">{label}:</span>
                  <span className="font-medium text-gray-800 text-right">{val || 'Non spécifié'}</span>
                </div>
              ))}
            </div>
          </div>
          <div className={`p-5 rounded-xl border ${cfg.borderClass} ${cfg.bgClass}`}>
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
              <Package size={14} className="text-indigo-500" /> Informations
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Date:</span><span className="font-medium">{formatDate(order.date)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Livraison:</span><span className="font-medium">{formatDate(order.delivery_date)}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">Statut:</span><StatusBadge status={order.status} /></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">Priorité:</span><PriorityBadge priority={order.priority} /></div>
            </div>
          </div>
        </div>

        {/* Items table */}
        <div>
          <h4 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">Articles Commandés</h4>
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Produit', 'Format', 'Qté', 'Prix unit.', 'Total', 'Affecté', 'Action'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold text-gray-700">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {order.items.map((item, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{item.product_name || item.product_variant?.product?.name || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{item.product_variant?.format?.name || '—'}</td>
                      <td className="px-4 py-3 text-gray-700">{item.quantity}</td>
                      <td className="px-4 py-3 text-gray-700">{formatCurrency(item.price)}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(item.total)}</td>
                      <td className="px-4 py-3 text-gray-700">{item.quantity_affecte || '0'}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => onAssign(order, item)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs font-medium">
                          <Target size={12} /> Affecter
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right font-bold text-gray-900">Total:</td>
                    <td className="px-4 py-3 font-bold text-gray-900">{formatCurrency(order.total)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {order.notes && (
          <div className={`p-4 rounded-xl border ${cfg.borderClass} ${cfg.bgClass}`}>
            <h4 className="font-semibold text-gray-800 mb-2 text-sm">Notes</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{order.notes}</p>
          </div>
        )}

        <div className="flex items-center justify-between flex-wrap gap-3 pt-4 border-t border-gray-100">
          <select value={order.status} onChange={e => onStatusChange(order.id, e.target.value as OrderStatus)} className={inputClass + ' max-w-xs'}>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <div className="flex gap-2 flex-wrap">
            {canEdit && (
              <button onClick={() => onEdit(order)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium">
                <Edit size={14} /> Modifier
              </button>
            )}
            <button onClick={handlePrint} className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-medium">
              <Download size={14} /> Imprimer
            </button>
            {canEdit && (
              <button onClick={() => onDelete(order.id)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-medium">
                <Trash2 size={14} /> Supprimer
              </button>
            )}
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};

// ─── Assign Vendor Modal ──────────────────────────────────────────────────────

const AssignVendorModal: React.FC<{
  order: Order;
  item: OrderItem;
  vendors: MobileVendor[];
  onClose: () => void;
}> = ({ order, item, vendors, onClose }) => {
  const [form, setForm] = useState<VendorActivity>({
    vendor: null,
    activity_type: 'sale',
    timestamp: new Date().toISOString(),
    location: null,
    notes: '',
    related_order: order.id,
    quantity_assignes: item.quantity,
    quantity_sales: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.vendor) return setError('Veuillez sélectionner un vendeur.');
    if (!form.quantity_assignes || form.quantity_assignes <= 0) return setError('Quantité invalide.');
    if (form.quantity_assignes > item.quantity) return setError('Quantité dépasse la quantité commandée.');

    const headers = getAuthHeaders();
    if (!headers) return setError('Veuillez vous connecter.');
    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/vendor-activities/`, {
        method: 'POST', headers, body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || JSON.stringify(d)); }
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalWrapper onClose={onClose}>
      <div style={{ maxWidth: '30rem' }} className="w-full">
        <ModalHeader
          title="Affecter à un vendeur"
          subtitle={`Commande #${order.id} — ${item.product_name || item.product_variant?.product?.name || '—'}`}
          onClose={onClose}
        />
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

            <FormField label="Vendeur ambulant" icon={<Users size={14} />} required>
              <select required value={form.vendor || ''} onChange={e => setForm(p => ({ ...p, vendor: parseInt(e.target.value) || null }))} className={inputClass}>
                <option value="">Sélectionner un vendeur</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.full_name}{v.phone ? ` — ${v.phone}` : ''}</option>)}
              </select>
            </FormField>

            <FormField label="Type d'activité" required>
              <select value={form.activity_type} onChange={e => setForm(p => ({ ...p, activity_type: e.target.value }))} className={inputClass}>
                {ACTIVITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </FormField>

            <FormField label="Quantité à affecter" required>
              <input type="number" required min={1} max={item.quantity} value={form.quantity_assignes || ''} onChange={e => setForm(p => ({ ...p, quantity_assignes: parseInt(e.target.value) || null }))} className={inputClass} />
              <p className="text-xs text-gray-400 mt-1">Maximum disponible : {item.quantity}</p>
            </FormField>

            <FormField label="Notes">
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className={inputClass + ' resize-none'} rows={3} placeholder="Notes supplémentaires…" />
            </FormField>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button type="button" onClick={onClose} className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium">Annuler</button>
              <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-semibold shadow-sm disabled:opacity-60">
                {submitting ? 'Affectation…' : 'Affecter'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalWrapper>
  );
};

// ─── Product Catalog View ─────────────────────────────────────────────────────

const ProductCatalogView: React.FC<{
  productVariants: ProductVariant[];
  onNewOrder: () => void;
}> = ({ productVariants, onNewOrder }) => (
  <div className="p-6">
    <div className="flex justify-between items-center mb-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Catalogue produits</h2>
        <p className="text-sm text-gray-500 mt-0.5">Sélectionnez les produits à commander</p>
      </div>
      <button onClick={onNewOrder} className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-semibold shadow-sm">
        <Plus size={16} /> Nouvelle commande
      </button>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {productVariants.map(v => {
        const stockOk = (v.current_stock || 0) > (v.min_stock || 0);
        return (
          <div key={v.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{v.product?.name || '—'}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{v.format?.name || 'Sans format'}</p>
              </div>
              {v.image && <img src={v.image} alt="" className="w-14 h-14 object-cover rounded-lg border border-gray-100" />}
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
              <div className="bg-gray-50 p-2.5 rounded-lg"><span className="text-xs text-gray-500 block">Prix</span><span className="font-semibold text-gray-900">{formatCurrency(v.price)}</span></div>
              <div className={`p-2.5 rounded-lg ${stockOk ? 'bg-emerald-50' : 'bg-red-50'}`}>
                <span className="text-xs text-gray-500 block">Stock</span>
                <span className={`font-semibold ${stockOk ? 'text-emerald-700' : 'text-red-700'}`}>{v.current_stock || 0}</span>
              </div>
            </div>
            <button onClick={onNewOrder} className="w-full py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium flex items-center justify-center gap-1.5">
              <Plus size={14} /> Ajouter à une commande
            </button>
          </div>
        );
      })}
    </div>
  </div>
);

// ─── Orders Table View ────────────────────────────────────────────────────────

const OrdersTableView: React.FC<{
  orders: Order[];
  userRole?: UserRole;
  onView: (order: Order) => void;
  onEdit: (order: Order) => void;
  onDelete: (id: number) => void;
  onNewOrder: () => void;
  onRefresh: () => void;
}> = ({ orders, userRole, onView, onEdit, onDelete, onNewOrder, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortKey, setSortKey] = useState<'date' | 'total'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selected, setSelected] = useState<number[]>([]);
  const [page, setPage] = useState(1);

  const filtered = orders
    .filter(o => {
      const q = search.toLowerCase();
      const matchSearch = String(o.id).includes(q) || (o.point_of_sale_details?.name || '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchDate = dateFilter === 'all' || (o.date && (
        (dateFilter === 'today' && isToday(o.date)) ||
        (dateFilter === 'week' && isThisWeek(o.date)) ||
        (dateFilter === 'month' && isThisMonth(o.date))
      ));
      return matchSearch && matchStatus && matchDate;
    })
    .sort((a, b) => {
      const av = sortKey === 'date' ? new Date(a.date).getTime() : parseFloat(a.total);
      const bv = sortKey === 'date' ? new Date(b.date).getTime() : parseFloat(b.total);
      return sortDir === 'asc' ? av - bv : bv - av;
    });

  const totalPages = Math.ceil(filtered.length / ORDERS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ORDERS_PER_PAGE, page * ORDERS_PER_PAGE);
  const allSelected = selected.length === filtered.length && filtered.length > 0;

  const toggleSelect = (id: number) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleAll = () => setSelected(allSelected ? [] : filtered.map(o => o.id));

  return (
    <div className="p-6 space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input type="text" placeholder="Rechercher…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full text-sm transition-colors" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className={inputClass + ' max-w-[160px]'}>
            <option value="all">Tous les statuts</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={dateFilter} onChange={e => { setDateFilter(e.target.value); setPage(1); }} className={inputClass + ' max-w-[160px]'}>
            <option value="all">Toutes les dates</option>
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
          </select>
          <select value={`${sortKey}-${sortDir}`} onChange={e => { const [k, d] = e.target.value.split('-'); setSortKey(k as any); setSortDir(d as any); }} className={inputClass + ' max-w-[180px]'}>
            <option value="date-desc">Plus récentes</option>
            <option value="date-asc">Plus anciennes</option>
            <option value="total-desc">Montant ↓</option>
            <option value="total-asc">Montant ↑</option>
          </select>
        </div>
        <div className="flex gap-2 ml-auto">
          <button onClick={onRefresh} className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium">
            <RefreshCw size={15} /> Actualiser
          </button>
          {userRole?.createcommande && (
            <button onClick={onNewOrder} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-semibold shadow-sm">
              <Plus size={15} /> Nouvelle commande
            </button>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl border border-indigo-200">
          <span className="text-sm font-semibold text-indigo-800">{selected.length} sélectionnée(s)</span>
          <button onClick={() => setSelected([])} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Désélectionner tout</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3"><input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" /></th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Commande</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Point de vente</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Statut</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Priorité</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Total</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.length === 0 ? (
                <tr><td colSpan={8} className="py-16 text-center">
                  <Package className="text-gray-200 mx-auto mb-3" size={52} />
                  <p className="text-gray-500 font-medium">Aucune commande trouvée</p>
                  <p className="text-gray-400 text-xs mt-1">Essayez d'ajuster vos filtres</p>
                </td></tr>
              ) : paginated.map(order => (
                <tr key={order.id} className={`hover:bg-gray-50 transition-colors ${selected.includes(order.id) ? 'bg-indigo-25' : ''}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.includes(order.id)} onChange={() => toggleSelect(order.id)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900">CMD-{order.id}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{order.items.length} article(s)</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{order.point_of_sale_details?.name || '—'}</div>
                    <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[160px]">{order.point_of_sale_details?.address || ''}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-800 font-medium">{formatDate(order.date)}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Livr. {formatDate(order.delivery_date)}</div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                  <td className="px-4 py-3"><PriorityBadge priority={order.priority} /></td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(order.total)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => onView(order)} className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors" title="Détails"><Eye size={16} /></button>
                      {userRole?.createcommande && <>
                        <button onClick={() => onEdit(order)} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors" title="Modifier"><Edit size={16} /></button>
                        <button onClick={() => onDelete(order.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors" title="Supprimer"><Trash2 size={16} /></button>
                      </>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {(page - 1) * ORDERS_PER_PAGE + 1}–{Math.min(page * ORDERS_PER_PAGE, filtered.length)} sur {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-white transition-colors">
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1).map((p, i, arr) => (
                <React.Fragment key={p}>
                  {i > 0 && arr[i - 1] !== p - 1 && <span className="text-gray-400 px-1 text-xs">…</span>}
                  <button onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${p === page ? 'bg-indigo-600 text-white' : 'border border-gray-200 hover:bg-white text-gray-700'}`}>{p}</button>
                </React.Fragment>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-white transition-colors">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const OrderManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);
  const [pointsOfSale, setPointsOfSale] = useState<PointOfSale[]>([]);
  const [mobileVendors, setMobileVendors] = useState<MobileVendor[]>([]);
  const [activeTab, setActiveTab] = useState<'received' | 'create'>('received');

  // Modal state
  const [showAdd, setShowAdd] = useState(false);
  const [detailsOrder, setDetailsOrder] = useState<Order | null>(null);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [assignData, setAssignData] = useState<{ order: Order; item: OrderItem } | null>(null);

  const userRole = userProfile?.profile?.role;
  const canView = userRole?.vuecommande ?? false;
  const canCreate = userRole?.createcommande ?? false;

  const fetchData = useCallback(async () => {
    const headers = getAuthHeaders();
    if (!headers) { setError('Veuillez vous connecter.'); setLoading(false); return; }

    try {
      setLoading(true);
      setError(null);

      const profileRes = await fetch(`${API_BASE}/me/`, { headers });
      if (!profileRes.ok) throw new Error('Impossible de récupérer le profil utilisateur.');
      const profile: UserProfile = await profileRes.json();
      setUserProfile(profile);

      const role = profile.profile?.role;
      if (role?.vuecommande) setActiveTab('received');
      else if (role?.createcommande) setActiveTab('create');

      const fetches = await Promise.allSettled([
        role?.vuecommande ? fetch(`${API_BASE}/orders/`, { headers }) : Promise.resolve(null),
        fetch(`${API_BASE}/product-variants/`, { headers }),
        fetch(`${API_BASE}/points-vente/`, { headers }),
        fetch(`${API_BASE}/mobile-vendors/`, { headers }),
      ]);

      const [ordersRes, variantsRes, posRes, vendorsRes] = fetches;

      if (ordersRes.status === 'fulfilled' && ordersRes.value?.ok) {
        setOrders(await ordersRes.value.json());
      }
      if (variantsRes.status === 'fulfilled' && variantsRes.value?.ok) {
        setProductVariants(await variantsRes.value.json());
      }
      if (posRes.status === 'fulfilled' && posRes.value?.ok) {
        setPointsOfSale(await posRes.value.json());
      }
      if (vendorsRes.status === 'fulfilled' && vendorsRes.value?.ok) {
        setMobileVendors(await vendorsRes.value.json());
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateOrderStatus = async (orderId: number, newStatus: OrderStatus) => {
    const headers = getAuthHeaders();
    if (!headers) return;
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/`, {
        method: 'PATCH', headers, body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Échec de la mise à jour du statut.');
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (detailsOrder?.id === orderId) setDetailsOrder(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (err: any) { setError(err.message); }
  };

  const handleDelete = async (orderId: number) => {
    if (!window.confirm('Supprimer cette commande ?')) return;
    const headers = getAuthHeaders();
    if (!headers) return;
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error('Échec de la suppression.');
      setOrders(prev => prev.filter(o => o.id !== orderId));
      if (detailsOrder?.id === orderId) setDetailsOrder(null);
    } catch (err: any) { setError(err.message); }
  };

  const handleEdit = (order: Order) => {
    if (!canCreate) { setError('Permission insuffisante.'); return; }
    setDetailsOrder(null);
    setEditOrder(order);
  };

  // Stats
  const revenue = orders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);

  if (loading) return <Spinner />;

  if (!canView && !canCreate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-sm text-center">
          <div className="p-3 bg-red-50 rounded-xl inline-block mb-4"><XCircle className="text-red-500" size={40} /></div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Accès refusé</h2>
          <p className="text-sm text-gray-500">Vous n'avez pas les permissions pour accéder à la gestion des commandes. Contactez votre administrateur.</p>
        </div>
      </div>
    );
  }

  const showTabs = canView && canCreate;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-xl mx-auto p-6 space-y-6">
        {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Commandes</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {userProfile?.username && <>Connecté : <strong>{userProfile.username}</strong>{userRole?.name && <> — {userRole.name}</>}</>}
            </p>
          </div>
          <button onClick={fetchData} className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl text-gray-600 hover:bg-white transition-colors text-sm font-medium shadow-sm">
            <RefreshCw size={14} /> Actualiser
          </button>
        </div>

        {/* Stats */}
        {canView && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total commandes" value={orders.length} icon={Package} iconBg="bg-indigo-100" iconColor="text-indigo-600" trend="+12% ce mois" trendColor="text-emerald-600" />
            <StatCard label="En attente" value={orders.filter(o => o.status === 'pending').length} icon={Clock} iconBg="bg-amber-100" iconColor="text-amber-600" trend="Nécessite attention" trendColor="text-amber-600" />
            <StatCard label="Livrées" value={orders.filter(o => o.status === 'delivered').length} icon={CheckCircle} iconBg="bg-emerald-100" iconColor="text-emerald-600" trend="+8% cette semaine" trendColor="text-emerald-600" />
            <StatCard label="Chiffre d'affaires" value={formatCurrency(revenue)} icon={DollarSign} iconBg="bg-purple-100" iconColor="text-purple-600" trend="Performance globale" trendColor="text-purple-600" />
          </div>
        )}

        {/* Main panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          {showTabs && (
            <div className="flex border-b border-gray-200 px-2">
              {[
                { key: 'received', label: 'Commandes reçues', icon: List, badge: orders.length },
                { key: 'create',   label: 'Créer une commande', icon: ShoppingCart },
              ].map(({ key, label, icon: Icon, badge }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-colors ${
                    activeTab === key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                  {badge !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${activeTab === key ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>{badge}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {(canView && (!showTabs || activeTab === 'received')) && (
            <OrdersTableView
              orders={orders}
              userRole={userRole}
              onView={setDetailsOrder}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onNewOrder={() => setShowAdd(true)}
              onRefresh={fetchData}
            />
          )}

          {(canCreate && (!showTabs || activeTab === 'create')) && (
            <ProductCatalogView
              productVariants={productVariants}
              onNewOrder={() => setShowAdd(true)}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {showAdd && (
        <AddOrderModal
          onClose={() => setShowAdd(false)}
          onCreated={order => setOrders(prev => [order, ...prev])}
          productVariants={productVariants}
          pointsOfSale={pointsOfSale}
        />
      )}

      {detailsOrder && (
        <OrderDetailsModal
          order={detailsOrder}
          canEdit={canCreate}
          onClose={() => setDetailsOrder(null)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStatusChange={updateOrderStatus}
          onAssign={(order, item) => { setAssignData({ order, item }); setDetailsOrder(null); }}
        />
      )}

      {editOrder && (
        <EditOrderModal
          order={editOrder}
          onClose={() => setEditOrder(null)}
          onUpdated={updated => { setOrders(prev => prev.map(o => o.id === updated.id ? updated : o)); setEditOrder(null); }}
          productVariants={productVariants}
        />
      )}

      {assignData && (
        <AssignVendorModal
          order={assignData.order}
          item={assignData.item}
          vendors={mobileVendors}
          onClose={() => setAssignData(null)}
        />
      )}
    </div>
  );
};

export default OrderManagement;