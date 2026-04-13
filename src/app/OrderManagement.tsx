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

// ─── Palette LanfiaLink ───────────────────────────────────────────────────────
// Vert forêt  #2D5A3D   — CTA, accents principaux
// Vert hover  #3E7A54   — hover boutons verts
// Ocre doré   #C07A2F   — warnings, priorité haute, accents chauds
// Or pâle     #F0C878   — highlights, kente
// Crème ivoire #FAF7F0  — fond page
// Sable chaud  #F2EDE0  — inputs, surfaces secondaires
// Sable border #D4C4A0  — bordures claires
// Sable mid    #E8D9B8  — séparateurs
// Texte foncé  #2A1A08  — texte principal
// Texte moyen  #7A6A52  — labels
// Texte clair  #A89880  — placeholders, muted

const C = {
  forest:   '#2D5A3D',
  forestHov:'#3E7A54',
  ocre:     '#C07A2F',
  ocreDark: '#9A5E1A',
  gold:     '#F0C878',
  ivory:    '#FAF7F0',
  sand:     '#F2EDE0',
  sandBdr:  '#D4C4A0',
  sandMid:  '#E8D9B8',
  text:     '#2A1A08',
  textMid:  '#7A6A52',
  textMut:  '#A89880',
  white:    '#FFFFFF',
  // Status sémantiques mappés sur la palette
  amber50:  '#FFF3E8',
  amberBdr: '#E8C090',
  amberTxt: '#9A5E1A',
  blue50:   '#EAF2EC',
  blueBdr:  '#B8D4C0',
  blueTxt:  '#2D5A3D',
  red50:    '#FDF0EC',
  redBdr:   '#E8B090',
  redTxt:   '#9A3A1A',
  green50:  '#EAF2EC',
  greenBdr: '#B8D4C0',
  greenTxt: '#2D5A3D',
};

const STATUS_CONFIG: Record<OrderStatus, {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: React.FC<any>;
}> = {
  pending:   { label: 'En Attente', color: C.ocreDark,  bg: C.amber50,  border: C.amberBdr, icon: Clock },
  confirmed: { label: 'Confirmée',  color: C.forest,    bg: C.blue50,   border: C.blueBdr,  icon: CheckCircle },
  shipped:   { label: 'Expédiée',   color: '#4A3A8A',   bg: '#F0EEF8',  border: '#C8C0E8',  icon: Truck },
  delivered: { label: 'Livrée',     color: C.forest,    bg: C.green50,  border: C.greenBdr, icon: CheckCircle },
  cancelled: { label: 'Annulée',    color: C.redTxt,    bg: C.red50,    border: C.redBdr,   icon: XCircle },
};

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string }> = {
  high:   { label: 'Haute',   color: C.ocre },
  medium: { label: 'Moyenne', color: C.ocreDark },
  low:    { label: 'Basse',   color: C.forest },
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

// ─── Shared input style ───────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 40,
  padding: '0 14px',
  background: C.sand,
  border: `1.5px solid ${C.sandBdr}`,
  borderRadius: 10,
  color: C.text,
  fontSize: 13.5,
  fontFamily: 'inherit',
  outline: 'none',
  transition: 'border .15s, background .15s, box-shadow .15s',
};

const inputClass = "lanfia-input";

// ─── Shared UI Components ─────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 600,
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
    }}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
};

const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: cfg.color }}>
      <Star size={13} fill="currentColor" />
      {cfg.label}
    </span>
  );
};

const ErrorBanner: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 16px', background: C.amber50, border: `1px solid ${C.amberBdr}`,
    borderRadius: 12, marginBottom: 20, color: C.amberTxt,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <AlertTriangle size={16} />
      <span style={{ fontWeight: 600, fontSize: 13 }}>{message}</span>
    </div>
    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.ocre, padding: 2 }}>
      <XCircle size={17} />
    </button>
  </div>
);

const Spinner: React.FC = () => (
  <div style={{ minHeight: '100vh', background: C.ivory, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        border: `3px solid ${C.sandBdr}`, borderTopColor: C.forest,
        animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
      }} />
      <p style={{ color: C.textMid, fontWeight: 500, fontSize: 14 }}>Chargement en cours…</p>
    </div>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const ModalWrapper: React.FC<{ onClose: () => void; children: React.ReactNode }> = ({ onClose, children }) => (
  <div
    onClick={(e) => e.target === e.currentTarget && onClose()}
    style={{
      position: 'fixed', inset: 0, background: 'rgba(42,26,8,0.45)',
      backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 50, padding: 16,
    }}
  >
    <div style={{
      background: C.ivory, borderRadius: 20, boxShadow: '0 20px 60px rgba(42,26,8,0.18)',
      width: '100%', maxWidth: '56rem', maxHeight: '90vh', overflowY: 'auto',
    }}>
      {children}
    </div>
  </div>
);

const ModalHeader: React.FC<{ title: string; subtitle?: string; onClose: () => void }> = ({ title, subtitle, onClose }) => (
  <div style={{
    padding: '20px 24px', borderBottom: `1px solid ${C.sandMid}`,
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    background: C.sand, borderRadius: '20px 20px 0 0',
  }}>
    <div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>{title}</h3>
      {subtitle && <p style={{ fontSize: 12.5, color: C.textMut, marginTop: 3 }}>{subtitle}</p>}
    </div>
    <button
      onClick={onClose}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: C.textMut, padding: 6, borderRadius: 8,
      }}
      onMouseEnter={e => (e.currentTarget.style.color = C.text)}
      onMouseLeave={e => (e.currentTarget.style.color = C.textMut)}
    >
      <XCircle size={22} />
    </button>
  </div>
);

const FormField: React.FC<{ label: string; icon?: React.ReactNode; required?: boolean; children: React.ReactNode }> = ({ label, icon, required, children }) => (
  <div>
    <label style={{
      display: 'block', fontSize: 10.5, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.08em',
      color: C.textMid, marginBottom: 7,
    }}>
      {icon && <span style={{ display: 'inline-flex', marginRight: 5, verticalAlign: 'middle', color: C.forest }}>{icon}</span>}
      {label}{required && ' *'}
    </label>
    {children}
  </div>
);

// Input/select/textarea shared focus handlers
const focusIn = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.background = C.white;
  e.currentTarget.style.borderColor = C.forest;
  e.currentTarget.style.boxShadow = `0 0 0 3px rgba(45,90,61,.10)`;
};
const focusOut = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.background = C.sand;
  e.currentTarget.style.borderColor = C.sandBdr;
  e.currentTarget.style.boxShadow = 'none';
};

const StyledInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} style={{ ...inputStyle, ...props.style }} onFocus={focusIn} onBlur={focusOut} />
);

const StyledSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ children, style, ...props }) => (
  <select
    {...props}
    style={{ ...inputStyle, height: 40, paddingRight: 32, cursor: 'pointer', ...style }}
    onFocus={focusIn}
    onBlur={focusOut}
  >
    {children}
  </select>
);

const StyledTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ style, ...props }) => (
  <textarea
    {...props}
    style={{ ...inputStyle, height: 'auto', padding: '10px 14px', resize: 'none', ...style }}
    onFocus={focusIn}
    onBlur={focusOut}
  />
);

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard: React.FC<{
  label: string;
  value: string | number;
  icon: React.FC<any>;
  iconBg: string;
  iconColor: string;
  trend?: string;
  trendColor?: string;
}> = ({ label, value, icon: Icon, iconBg, iconColor, trend, trendColor = C.textMut }) => (
  <div style={{
    background: C.white, padding: 20, borderRadius: 16,
    border: `1px solid ${C.sandMid}`, transition: 'box-shadow .2s',
  }}
    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(45,90,61,.08)')}
    onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <p style={{ fontSize: 13, fontWeight: 500, color: C.textMut, margin: 0 }}>{label}</p>
      <div style={{ padding: 10, borderRadius: 12, background: iconBg }}>
        <Icon style={{ color: iconColor }} size={18} />
      </div>
    </div>
    <p style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0 }}>{value}</p>
    {trend && (
      <p style={{ fontSize: 11, marginTop: 8, display: 'flex', alignItems: 'center', gap: 4, color: trendColor }}>
        <TrendingUp size={11} />{trend}
      </p>
    )}
    {/* Kente accent */}
    <div style={{
      height: 3, marginTop: 12, borderRadius: 2,
      background: `linear-gradient(90deg,${C.ocreDark} 0%,${C.ocre} 50%,${C.ocreDark} 100%)`,
      opacity: 0.35,
    }} />
  </div>
);

// ─── Order Items Editor ───────────────────────────────────────────────────────

const OrderItemsEditor: React.FC<{
  items: NewOrderItem[];
  productVariants: ProductVariant[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  onChange: (i: number, field: keyof NewOrderItem, value: any) => void;
}> = ({ items, productVariants, onAdd, onRemove, onChange }) => (
  <div style={{ border: `1.5px solid ${C.sandBdr}`, borderRadius: 12, overflow: 'hidden', background: C.sand }}>
    {items.length > 0 && (
      <div style={{
        display: 'grid', gridTemplateColumns: '5fr 2fr 2fr 2fr 1fr',
        gap: 8, padding: '10px 14px 4px',
        fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.07em', color: C.textMid,
      }}>
        <div>Produit</div><div>Format</div><div style={{ textAlign: 'center' }}>Qté</div>
        <div style={{ textAlign: 'right' }}>Prix unit.</div><div />
      </div>
    )}
    <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((item, index) => {
        const variant = productVariants.find(v => v.id === item.product_variant_id);
        return (
          <div key={index} style={{
            display: 'grid', gridTemplateColumns: '5fr 2fr 2fr 2fr 1fr',
            gap: 8, alignItems: 'center',
            background: C.white, padding: 10, borderRadius: 10,
            border: `1px solid ${C.sandMid}`,
          }}>
            <StyledSelect
              required
              value={item.product_variant_id}
              onChange={(e) => onChange(index, 'product_variant_id', parseInt(e.target.value))}
            >
              <option value={0}>Sélectionner un produit</option>
              {productVariants.map(v => (
                <option key={v.id} value={v.id}>
                  {v.product?.name || 'Inconnu'} — {v.format?.name || 'Sans format'}
                </option>
              ))}
            </StyledSelect>
            <div style={{ fontSize: 12.5, color: C.textMut, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {variant?.format?.name || '—'}
            </div>
            <StyledInput
              type="number"
              required
              min={1}
              max={variant?.current_stock || 9999}
              value={item.quantity}
              onChange={(e) => onChange(index, 'quantity', parseInt(e.target.value) || 1)}
              style={{ textAlign: 'center' }}
            />
            <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: C.text }}>
              {formatCurrency(item.price)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => onRemove(index)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: C.redTxt, padding: 5, borderRadius: 7,
                  transition: 'background .15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = C.red50)}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <XCircle size={15} />
              </button>
            </div>
          </div>
        );
      })}
      <button
        type="button"
        onClick={onAdd}
        style={{
          width: '100%', padding: '11px 0',
          border: `2px dashed ${C.sandBdr}`, borderRadius: 10,
          background: C.white, color: C.textMut, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          fontSize: 13, fontWeight: 600, transition: 'color .15s, border-color .15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.color = C.forest;
          e.currentTarget.style.borderColor = C.forest;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = C.textMut;
          e.currentTarget.style.borderColor = C.sandBdr;
        }}
      >
        <Plus size={14} /> Ajouter un article
      </button>
    </div>
  </div>
);

// ─── Buttons ──────────────────────────────────────────────────────────────────

const BtnPrimary: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; loadingText?: string }> = ({ children, loading, loadingText, style, ...props }) => (
  <button
    {...props}
    disabled={props.disabled || loading}
    style={{
      padding: '10px 20px', borderRadius: 12, border: 'none',
      background: C.forest, color: C.white,
      fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', gap: 6,
      transition: 'background .15s, transform .1s',
      opacity: (props.disabled || loading) ? 0.55 : 1,
      ...style,
    }}
    onMouseEnter={e => { if (!props.disabled && !loading) e.currentTarget.style.background = C.forestHov; }}
    onMouseLeave={e => { e.currentTarget.style.background = C.forest; }}
    onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.98)'; }}
    onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
  >
    {loading ? loadingText : children}
  </button>
);

const BtnSecondary: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, style, ...props }) => (
  <button
    {...props}
    style={{
      padding: '10px 20px', borderRadius: 12,
      border: `1.5px solid ${C.sandBdr}`, background: 'none',
      color: C.textMid, fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
      transition: 'background .15s',
      ...style,
    }}
    onMouseEnter={e => (e.currentTarget.style.background = C.sand)}
    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
  >
    {children}
  </button>
);

const BtnDanger: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, style, ...props }) => (
  <button
    {...props}
    style={{
      padding: '10px 20px', borderRadius: 12, border: 'none',
      background: '#C0442A', color: C.white,
      fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', gap: 6,
      transition: 'background .15s',
      ...style,
    }}
    onMouseEnter={e => (e.currentTarget.style.background = '#9A3A1A')}
    onMouseLeave={e => (e.currentTarget.style.background = '#C0442A')}
  >
    {children}
  </button>
);

const BtnSuccess: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, style, ...props }) => (
  <button
    {...props}
    style={{
      padding: '10px 20px', borderRadius: 12, border: 'none',
      background: C.ocre, color: C.white,
      fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', gap: 6,
      transition: 'background .15s',
      ...style,
    }}
    onMouseEnter={e => (e.currentTarget.style.background = C.ocreDark)}
    onMouseLeave={e => (e.currentTarget.style.background = C.ocre)}
  >
    {children}
  </button>
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
        method: 'POST', headers,
        body: JSON.stringify({
          point_of_sale: form.point_of_sale_id,
          date: form.date, delivery_date: form.delivery_date,
          priority: form.priority, notes: form.notes,
          items: form.items.map(({ product_variant_id, quantity }) => ({ product_variant_id, quantity })),
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || JSON.stringify(d)); }
      onCreated(await res.json());
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
      <div style={{ padding: 24 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {error && <ErrorBanner message={error} onClose={() => setError(null)} />}
          <FormField label="Point de vente" icon={<MapPin size={13} />} required>
            <StyledSelect
              required
              value={form.point_of_sale_id || ''}
              onChange={e => setForm(p => ({ ...p, point_of_sale_id: parseInt(e.target.value) || null }))}
            >
              <option value="">Sélectionner un point de vente</option>
              {pointsOfSale.map(pos => (
                <option key={pos.id} value={pos.id}>{pos.name}{pos.address ? ` — ${pos.address}` : ''}</option>
              ))}
            </StyledSelect>
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14 }}>
            <FormField label="Priorité" icon={<Star size={13} />} required>
              <StyledSelect value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value as Priority }))}>
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
              </StyledSelect>
            </FormField>
            <FormField label="Date commande" icon={<Calendar size={13} />} required>
              <StyledInput type="date" required value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            </FormField>
            <FormField label="Date livraison" icon={<Calendar size={13} />} required>
              <StyledInput type="date" required value={form.delivery_date} onChange={e => setForm(p => ({ ...p, delivery_date: e.target.value }))} />
            </FormField>
          </div>
          <FormField label="Articles" icon={<Package size={13} />}>
            <OrderItemsEditor
              items={form.items}
              productVariants={productVariants}
              onAdd={() => setForm(p => ({ ...p, items: [...p.items, { product_variant_id: 0, quantity: 1, price: '0' }] }))}
              onRemove={(i) => setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }))}
              onChange={handleItemChange}
            />
          </FormField>
          <FormField label="Notes" icon={<FileText size={13} />}>
            <StyledTextarea
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              rows={3}
              placeholder="Instructions, remarques…"
            />
          </FormField>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 14, borderTop: `1px solid ${C.sandMid}` }}>
            <BtnSecondary type="button" onClick={onClose}>Annuler</BtnSecondary>
            <BtnPrimary type="submit" loading={submitting} loadingText="Création…">Créer la commande</BtnPrimary>
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
        method: 'PUT', headers,
        body: JSON.stringify({
          point_of_sale: form.point_of_sale,
          date: form.date, delivery_date: form.delivery_date,
          priority: form.priority, status: form.status, notes: form.notes,
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
      <div style={{ padding: 24 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {error && <ErrorBanner message={error} onClose={() => setError(null)} />}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14 }}>
            <FormField label="Date commande">
              <StyledInput type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            </FormField>
            <FormField label="Date livraison">
              <StyledInput type="date" value={form.delivery_date || ''} onChange={e => setForm(p => ({ ...p, delivery_date: e.target.value }))} />
            </FormField>
            <FormField label="Priorité">
              <StyledSelect value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value as Priority }))}>
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
              </StyledSelect>
            </FormField>
            <FormField label="Statut">
              <StyledSelect value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as OrderStatus }))}>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </StyledSelect>
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
            <StyledTextarea
              value={form.notes || ''}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              rows={3}
              placeholder="Notes supplémentaires…"
            />
          </FormField>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 14, borderTop: `1px solid ${C.sandMid}` }}>
            <BtnSecondary type="button" onClick={onClose}>Annuler</BtnSecondary>
            <BtnPrimary type="submit" loading={submitting} loadingText="Enregistrement…">Enregistrer</BtnPrimary>
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
      <style>body{font-family:system-ui,sans-serif;padding:24px;color:#2A1A08;background:#FAF7F0}
      table{width:100%;border-collapse:collapse}th,td{border:1px solid #D4C4A0;padding:10px;text-align:left}
      th{background:#2D5A3D;color:#FAF7F0}</style>
      </head><body>
      <h1 style="color:#2D5A3D">Commande #${order.id}</h1>
      <p>Point de vente: ${order.point_of_sale_details?.name || '—'}</p>
      <p>Date: ${formatDate(order.date)} | Livraison: ${formatDate(order.delivery_date)}</p>
      <table><thead><tr><th>Produit</th><th>Qté</th><th>Prix</th><th>Total</th></tr></thead><tbody>
      ${order.items.map(i => `<tr><td>${i.product_name || i.product_variant?.product?.name || '—'}</td><td>${i.quantity}</td><td>${formatCurrency(i.price)}</td><td>${formatCurrency(i.total)}</td></tr>`).join('')}
      </tbody><tfoot><tr><td colspan="3"><strong>Total</strong></td><td><strong>${formatCurrency(order.total)}</strong></td></tr></tfoot></table>
      <script>window.onload=()=>window.print()</script></body></html>`);
    win.document.close();
  };

  const infoCard = (children: React.ReactNode) => (
    <div style={{
      padding: 18, borderRadius: 14,
      border: `1px solid ${cfg.border}`, background: cfg.bg,
    }}>
      {children}
    </div>
  );

  const infoRow = (label: string, val?: string) => (
    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13, padding: '4px 0' }}>
      <span style={{ color: C.textMut }}>{label}:</span>
      <span style={{ fontWeight: 600, color: C.text, textAlign: 'right' }}>{val || 'Non spécifié'}</span>
    </div>
  );

  return (
    <ModalWrapper onClose={onClose}>
      <ModalHeader title="Détails de la Commande" subtitle={`CMD-${order.id}`} onClose={onClose} />
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14 }}>
          {infoCard(<>
            <h4 style={{ fontWeight: 700, color: C.text, marginBottom: 12, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={13} style={{ color: C.forest }} /> Point de Vente
            </h4>
            {[
              ['Nom', order.point_of_sale_details?.name],
              ['Propriétaire', order.point_of_sale_details?.owner],
              ['Email', order.point_of_sale_details?.email],
              ['Téléphone', order.point_of_sale_details?.phone],
              ['Adresse', order.point_of_sale_details?.address],
            ].map(([l, v]) => infoRow(l as string, v as string))}
          </>)}
          {infoCard(<>
            <h4 style={{ fontWeight: 700, color: C.text, marginBottom: 12, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Package size={13} style={{ color: C.forest }} /> Informations
            </h4>
            {infoRow('Date', formatDate(order.date))}
            {infoRow('Livraison', formatDate(order.delivery_date))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '4px 0' }}>
              <span style={{ color: C.textMut }}>Statut:</span><StatusBadge status={order.status} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '4px 0' }}>
              <span style={{ color: C.textMut }}>Priorité:</span><PriorityBadge priority={order.priority} />
            </div>
          </>)}
        </div>

        {/* Items table */}
        <div>
          <h4 style={{ fontWeight: 700, color: C.text, marginBottom: 10, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Articles Commandés
          </h4>
          <div style={{ borderRadius: 12, border: `1px solid ${C.sandMid}`, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: C.sand, borderBottom: `1px solid ${C.sandMid}` }}>
                    {['Produit', 'Format', 'Qté', 'Prix unit.', 'Total', 'Affecté', 'Action'].map(h => (
                      <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontWeight: 700, color: C.textMid, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${C.sandMid}` }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: C.text }}>{item.product_name || item.product_variant?.product?.name || '—'}</td>
                      <td style={{ padding: '10px 14px', color: C.textMut }}>{item.product_variant?.format?.name || '—'}</td>
                      <td style={{ padding: '10px 14px', color: C.text }}>{item.quantity}</td>
                      <td style={{ padding: '10px 14px', color: C.text }}>{formatCurrency(item.price)}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: C.text }}>{formatCurrency(item.total)}</td>
                      <td style={{ padding: '10px 14px', color: C.text }}>{item.quantity_affecte || '0'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <button
                          onClick={() => onAssign(order, item)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '6px 12px', background: C.forest, color: C.white,
                            border: 'none', borderRadius: 8, cursor: 'pointer',
                            fontSize: 12, fontWeight: 700, transition: 'background .15s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = C.forestHov)}
                          onMouseLeave={e => (e.currentTarget.style.background = C.forest)}
                        >
                          <Target size={11} /> Affecter
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: C.sand, borderTop: `1px solid ${C.sandMid}` }}>
                    <td colSpan={4} style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 700, color: C.text }}>Total:</td>
                    <td style={{ padding: '11px 14px', fontWeight: 700, color: C.forest }}>{formatCurrency(order.total)}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {order.notes && (
          <div style={{ padding: 16, borderRadius: 12, border: `1px solid ${C.sandMid}`, background: C.sand }}>
            <h4 style={{ fontWeight: 700, color: C.textMid, marginBottom: 6, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Notes</h4>
            <p style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{order.notes}</p>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, paddingTop: 14, borderTop: `1px solid ${C.sandMid}` }}>
          <StyledSelect
            value={order.status}
            onChange={e => onStatusChange(order.id, e.target.value as OrderStatus)}
            style={{ maxWidth: 200 }}
          >
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </StyledSelect>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {canEdit && (
              <BtnPrimary onClick={() => onEdit(order)}>
                <Edit size={13} /> Modifier
              </BtnPrimary>
            )}
            <BtnSuccess onClick={handlePrint}>
              <Download size={13} /> Imprimer
            </BtnSuccess>
            {canEdit && (
              <BtnDanger onClick={() => onDelete(order.id)}>
                <Trash2 size={13} /> Supprimer
              </BtnDanger>
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
      <div style={{ maxWidth: '30rem', width: '100%' }}>
        <ModalHeader
          title="Affecter à un vendeur"
          subtitle={`Commande #${order.id} — ${item.product_name || item.product_variant?.product?.name || '—'}`}
          onClose={onClose}
        />
        <div style={{ padding: 24 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {error && <ErrorBanner message={error} onClose={() => setError(null)} />}
            <FormField label="Vendeur ambulant" icon={<Users size={13} />} required>
              <StyledSelect
                required
                value={form.vendor || ''}
                onChange={e => setForm(p => ({ ...p, vendor: parseInt(e.target.value) || null }))}
              >
                <option value="">Sélectionner un vendeur</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.full_name}{v.phone ? ` — ${v.phone}` : ''}</option>)}
              </StyledSelect>
            </FormField>
            <FormField label="Type d'activité" required>
              <StyledSelect
                value={form.activity_type}
                onChange={e => setForm(p => ({ ...p, activity_type: e.target.value }))}
              >
                {ACTIVITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </StyledSelect>
            </FormField>
            <FormField label="Quantité à affecter" required>
              <StyledInput
                type="number" required min={1} max={item.quantity}
                value={form.quantity_assignes || ''}
                onChange={e => setForm(p => ({ ...p, quantity_assignes: parseInt(e.target.value) || null }))}
              />
              <p style={{ fontSize: 11.5, color: C.textMut, marginTop: 5 }}>Maximum disponible : {item.quantity}</p>
            </FormField>
            <FormField label="Notes">
              <StyledTextarea
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                rows={3}
                placeholder="Notes supplémentaires…"
              />
            </FormField>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 14, borderTop: `1px solid ${C.sandMid}` }}>
              <BtnSecondary type="button" onClick={onClose}>Annuler</BtnSecondary>
              <BtnPrimary type="submit" loading={submitting} loadingText="Affectation…">Affecter</BtnPrimary>
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
  <div style={{ padding: 24 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
      <div>
        <h2 style={{ fontSize: 19, fontWeight: 700, color: C.text, margin: 0 }}>Catalogue produits</h2>
        <p style={{ fontSize: 13, color: C.textMut, marginTop: 3 }}>Sélectionnez les produits à commander</p>
      </div>
      <BtnPrimary onClick={onNewOrder}>
        <Plus size={15} /> Nouvelle commande
      </BtnPrimary>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 14 }}>
      {productVariants.map(v => {
        const stockOk = (v.current_stock || 0) > (v.min_stock || 0);
        return (
          <div
            key={v.id}
            style={{
              background: C.white, border: `1.5px solid ${C.sandBdr}`, borderRadius: 14, padding: 18,
              transition: 'box-shadow .2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(45,90,61,.09)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <h3 style={{ fontWeight: 700, color: C.text, fontSize: 14, margin: 0 }}>{v.product?.name || '—'}</h3>
                <p style={{ fontSize: 11.5, color: C.textMut, marginTop: 3 }}>{v.format?.name || 'Sans format'}</p>
              </div>
              {v.image && <img src={v.image} alt="" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 9, border: `1px solid ${C.sandMid}` }} />}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              <div style={{ background: C.sand, padding: '8px 10px', borderRadius: 9 }}>
                <span style={{ fontSize: 10.5, color: C.textMut, display: 'block' }}>Prix</span>
                <span style={{ fontWeight: 700, color: C.text, fontSize: 13.5 }}>{formatCurrency(v.price)}</span>
              </div>
              <div style={{ background: stockOk ? '#EAF2EC' : '#FDF0EC', padding: '8px 10px', borderRadius: 9 }}>
                <span style={{ fontSize: 10.5, color: C.textMut, display: 'block' }}>Stock</span>
                <span style={{ fontWeight: 700, color: stockOk ? C.forest : C.redTxt, fontSize: 13.5 }}>{v.current_stock || 0}</span>
              </div>
            </div>
            <button
              onClick={onNewOrder}
              style={{
                width: '100%', padding: '9px 0',
                background: C.sand, color: C.forest,
                border: 'none', borderRadius: 9, cursor: 'pointer',
                fontSize: 12.5, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                transition: 'background .15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#D4E8DA')}
              onMouseLeave={e => (e.currentTarget.style.background = C.sand)}
            >
              <Plus size={13} /> Ajouter à une commande
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

  const iconBtn = (onClick: () => void, color: string, hoverBg: string, title: string, children: React.ReactNode) => (
    <button
      onClick={onClick} title={title}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color, padding: 7, borderRadius: 8, transition: 'background .15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = hoverBg)}
      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
    >
      {children}
    </button>
  );

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 320 }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.textMut }} size={15} />
          <StyledInput
            type="text" placeholder="Rechercher…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ paddingLeft: 38 }}
          />
        </div>
        <StyledSelect value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={{ maxWidth: 170 }}>
          <option value="all">Tous les statuts</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </StyledSelect>
        <StyledSelect value={dateFilter} onChange={e => { setDateFilter(e.target.value); setPage(1); }} style={{ maxWidth: 170 }}>
          <option value="all">Toutes les dates</option>
          <option value="today">Aujourd'hui</option>
          <option value="week">Cette semaine</option>
          <option value="month">Ce mois</option>
        </StyledSelect>
        <StyledSelect
          value={`${sortKey}-${sortDir}`}
          onChange={e => { const [k, d] = e.target.value.split('-'); setSortKey(k as any); setSortDir(d as any); }}
          style={{ maxWidth: 190 }}
        >
          <option value="date-desc">Plus récentes</option>
          <option value="date-asc">Plus anciennes</option>
          <option value="total-desc">Montant ↓</option>
          <option value="total-asc">Montant ↑</option>
        </StyledSelect>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <BtnSecondary onClick={onRefresh} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px' }}>
            <RefreshCw size={14} /> Actualiser
          </BtnSecondary>
          {userRole?.createcommande && (
            <BtnPrimary onClick={onNewOrder}>
              <Plus size={14} /> Nouvelle commande
            </BtnPrimary>
          )}
        </div>
      </div>

      {selected.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px', background: C.blue50, borderRadius: 10,
          border: `1px solid ${C.blueBdr}`,
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.forest }}>{selected.length} sélectionnée(s)</span>
          <button
            onClick={() => setSelected([])}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12.5, color: C.forest, fontWeight: 600 }}
          >
            Désélectionner tout
          </button>
        </div>
      )}

      {/* Table */}
      <div style={{ background: C.white, borderRadius: 14, border: `1.5px solid ${C.sandBdr}`, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.sand, borderBottom: `1px solid ${C.sandMid}` }}>
                <th style={{ padding: '12px 14px' }}>
                  <input
                    type="checkbox" checked={allSelected} onChange={toggleAll}
                    style={{ cursor: 'pointer', accentColor: C.forest }}
                  />
                </th>
                {['Commande', 'Point de vente', 'Date', 'Statut', 'Priorité', 'Total', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: C.textMid, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '64px 24px', textAlign: 'center' }}>
                    <Package style={{ color: C.sandBdr, margin: '0 auto 12px' }} size={48} />
                    <p style={{ color: C.textMid, fontWeight: 600, margin: '0 0 4px' }}>Aucune commande trouvée</p>
                    <p style={{ color: C.textMut, fontSize: 12 }}>Essayez d'ajuster vos filtres</p>
                  </td>
                </tr>
              ) : paginated.map(order => (
                <tr
                  key={order.id}
                  style={{
                    borderBottom: `1px solid ${C.sandMid}`,
                    background: selected.includes(order.id) ? '#EAF2EC' : C.white,
                    transition: 'background .12s',
                  }}
                  onMouseEnter={e => { if (!selected.includes(order.id)) e.currentTarget.style.background = C.ivory; }}
                  onMouseLeave={e => { e.currentTarget.style.background = selected.includes(order.id) ? '#EAF2EC' : C.white; }}
                >
                  <td style={{ padding: '11px 14px' }}>
                    <input
                      type="checkbox" checked={selected.includes(order.id)}
                      onChange={() => toggleSelect(order.id)}
                      style={{ cursor: 'pointer', accentColor: C.forest }}
                    />
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ fontWeight: 700, color: C.forest }}>CMD-{order.id}</div>
                    <div style={{ fontSize: 11, color: C.textMut, marginTop: 2 }}>{order.items.length} article(s)</div>
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ fontWeight: 600, color: C.text }}>{order.point_of_sale_details?.name || '—'}</div>
                    <div style={{ fontSize: 11, color: C.textMut, marginTop: 2, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {order.point_of_sale_details?.address || ''}
                    </div>
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ fontWeight: 600, color: C.text }}>{formatDate(order.date)}</div>
                    <div style={{ fontSize: 11, color: C.textMut, marginTop: 2 }}>Livr. {formatDate(order.delivery_date)}</div>
                  </td>
                  <td style={{ padding: '11px 14px' }}><StatusBadge status={order.status} /></td>
                  <td style={{ padding: '11px 14px' }}><PriorityBadge priority={order.priority} /></td>
                  <td style={{ padding: '11px 14px', fontWeight: 700, color: C.text, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {formatCurrency(order.total)}
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                      {iconBtn(() => onView(order), C.forest, C.blue50, 'Détails', <Eye size={15} />)}
                      {userRole?.createcommande && <>
                        {iconBtn(() => onEdit(order), C.ocreDark, C.amber50, 'Modifier', <Edit size={15} />)}
                        {iconBtn(() => onDelete(order.id), C.redTxt, C.red50, 'Supprimer', <Trash2 size={15} />)}
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
          <div style={{
            padding: '12px 18px', borderTop: `1px solid ${C.sandMid}`,
            background: C.sand, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 12, color: C.textMut }}>
              {(page - 1) * ORDERS_PER_PAGE + 1}–{Math.min(page * ORDERS_PER_PAGE, filtered.length)} sur {filtered.length}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: 6, borderRadius: 8, border: `1px solid ${C.sandBdr}`,
                  background: C.white, cursor: page === 1 ? 'not-allowed' : 'pointer',
                  opacity: page === 1 ? 0.4 : 1, color: C.text, display: 'flex',
                }}
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .map((p, i, arr) => (
                  <React.Fragment key={p}>
                    {i > 0 && arr[i - 1] !== p - 1 && <span style={{ color: C.textMut, padding: '0 3px', fontSize: 12 }}>…</span>}
                    <button
                      onClick={() => setPage(p)}
                      style={{
                        width: 30, height: 30, borderRadius: 8, fontSize: 12, fontWeight: 600,
                        border: `1px solid ${p === page ? C.forest : C.sandBdr}`,
                        background: p === page ? C.forest : C.white,
                        color: p === page ? C.white : C.text,
                        cursor: 'pointer', transition: 'background .15s',
                      }}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: 6, borderRadius: 8, border: `1px solid ${C.sandBdr}`,
                  background: C.white, cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  opacity: page === totalPages ? 0.4 : 1, color: C.text, display: 'flex',
                }}
              >
                <ChevronRight size={14} />
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
      if (ordersRes.status === 'fulfilled' && ordersRes.value?.ok) setOrders(await ordersRes.value.json());
      if (variantsRes.status === 'fulfilled' && variantsRes.value?.ok) setProductVariants(await variantsRes.value.json());
      if (posRes.status === 'fulfilled' && posRes.value?.ok) setPointsOfSale(await posRes.value.json());
      if (vendorsRes.status === 'fulfilled' && vendorsRes.value?.ok) setMobileVendors(await vendorsRes.value.json());
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

  const revenue = orders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);

  if (loading) return <Spinner />;

  if (!canView && !canCreate) {
    return (
      <div style={{ minHeight: '100vh', background: C.ivory, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: C.white, borderRadius: 20, border: `1.5px solid ${C.sandBdr}`, padding: 40, maxWidth: 360, textAlign: 'center' }}>
          <div style={{ padding: 14, background: C.red50, borderRadius: 14, display: 'inline-block', marginBottom: 16 }}>
            <XCircle style={{ color: C.redTxt }} size={40} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 8 }}>Accès refusé</h2>
          <p style={{ fontSize: 13, color: C.textMut, lineHeight: 1.6 }}>
            Vous n'avez pas les permissions pour accéder à la gestion des commandes. Contactez votre administrateur.
          </p>
          {/* Kente accent */}
          <div style={{ height: 3, marginTop: 20, borderRadius: 2, background: `linear-gradient(90deg,${C.ocreDark} 0%,${C.ocre} 50%,${C.ocreDark} 100%)`, opacity: 0.4 }} />
        </div>
      </div>
    );
  }

  const showTabs = canView && canCreate;

  return (
    <div style={{ minHeight: '100vh', background: C.ivory }}>
      {/* Kente top band */}
      <div style={{
        height: 4, background: `linear-gradient(90deg,${C.ocreDark} 0%,${C.ocre} 25%,${C.ocreDark} 50%,${C.ocre} 75%,${C.ocreDark} 100%)`,
      }} />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 22 }}>
        {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

        {/* Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text, margin: 0 }}>Gestion des Commandes</h1>
            <p style={{ fontSize: 13, color: C.textMut, marginTop: 4 }}>
              {userProfile?.username && <>Connecté : <strong style={{ color: C.text }}>{userProfile.username}</strong>{userRole?.name && <span style={{ color: C.ocre }}> — {userRole.name}</span>}</>}
            </p>
          </div>
          <BtnSecondary onClick={fetchData} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={13} /> Actualiser
          </BtnSecondary>
        </div>

        {/* Stats */}
        {canView && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 }}>
            <StatCard
              label="Total commandes" value={orders.length}
              icon={Package} iconBg="#EAF2EC" iconColor={C.forest}
              trend="+12% ce mois" trendColor={C.forest}
            />
            <StatCard
              label="En attente" value={orders.filter(o => o.status === 'pending').length}
              icon={Clock} iconBg={C.amber50} iconColor={C.ocre}
              trend="Nécessite attention" trendColor={C.ocre}
            />
            <StatCard
              label="Livrées" value={orders.filter(o => o.status === 'delivered').length}
              icon={CheckCircle} iconBg="#EAF2EC" iconColor={C.forestHov}
              trend="+8% cette semaine" trendColor={C.forest}
            />
            <StatCard
              label="Chiffre d'affaires" value={formatCurrency(revenue)}
              icon={DollarSign} iconBg="#F2EDE0" iconColor={C.ocreDark}
              trend="Performance globale" trendColor={C.ocreDark}
            />
          </div>
        )}

        {/* Main panel */}
        <div style={{ background: C.white, borderRadius: 18, border: `1.5px solid ${C.sandBdr}` }}>
          {/* Tabs */}
          {showTabs && (
            <div style={{ display: 'flex', borderBottom: `1px solid ${C.sandMid}`, padding: '0 8px' }}>
              {[
                { key: 'received', label: 'Commandes reçues', icon: List, badge: orders.length },
                { key: 'create',   label: 'Créer une commande', icon: ShoppingCart },
              ].map(({ key, label, icon: Icon, badge }) => {
                const active = activeTab === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key as any)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 7,
                      padding: '15px 18px', fontSize: 13.5, fontWeight: 700,
                      background: 'none', border: 'none', cursor: 'pointer',
                      borderBottom: `2.5px solid ${active ? C.forest : 'transparent'}`,
                      color: active ? C.forest : C.textMut,
                      transition: 'color .15s, border-color .15s',
                      marginBottom: -1,
                    }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.color = C.text; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.color = C.textMut; }}
                  >
                    <Icon size={15} />
                    {label}
                    {badge !== undefined && (
                      <span style={{
                        padding: '2px 8px', borderRadius: 9999, fontSize: 11.5, fontWeight: 700,
                        background: active ? C.blue50 : C.sand,
                        color: active ? C.forest : C.textMut,
                      }}>
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {(canView && (!showTabs || activeTab === 'received')) && (
            <OrdersTableView
              orders={orders} userRole={userRole}
              onView={setDetailsOrder} onEdit={handleEdit}
              onDelete={handleDelete} onNewOrder={() => setShowAdd(true)}
              onRefresh={fetchData}
            />
          )}

          {(canCreate && (!showTabs || activeTab === 'create')) && (
            <ProductCatalogView productVariants={productVariants} onNewOrder={() => setShowAdd(true)} />
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
          order={detailsOrder} canEdit={canCreate}
          onClose={() => setDetailsOrder(null)} onEdit={handleEdit}
          onDelete={handleDelete} onStatusChange={updateOrderStatus}
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
          order={assignData.order} item={assignData.item}
          vendors={mobileVendors} onClose={() => setAssignData(null)}
        />
      )}
    </div>
  );
};

export default OrderManagement;