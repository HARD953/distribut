"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Package, Search, Eye, Edit, Trash2, Plus,
  MapPin, CheckCircle, Clock, XCircle, Truck, Wallet,
  Download, RefreshCw, List, ShoppingCart,
  Users, Target, TrendingUp,
  ChevronLeft, ChevronRight, AlertTriangle, Loader2,
  Store, CheckCircle2, ZoomIn, PackageX, PackageSearch, X,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
type Priority = 'low' | 'medium' | 'high';
type StockStatus = 'out' | 'low' | 'in_stock';

interface UserRole {
  id: number; name: string; createcommande: boolean; vuecommande: boolean;
}
interface UserProfile {
  id: number; username?: string; email?: string; first_name?: string; last_name?: string;
  profile?: { phone?: string; location?: string; role?: UserRole; status?: string; avatar?: string | null; points_of_sale?: string[]; };
}
interface PointOfSale {
  id: number; name: string; owner?: string; phone?: string; email?: string; address?: string; status?: string; avatar?: string;
  nature?: string;
}
interface Product { id: number; name: string; sku?: string; status?: string; }
interface ProductFormat { id: number; name?: string; description?: string; }
interface ProductVariant {
  id: number; product?: Product; format?: ProductFormat; current_stock?: number;
  min_stock?: number; max_stock?: number; price: string; barcode?: string; image?: string;
  point_of_sale?: number; point_of_sale_details?: PointOfSale;
}
interface OrderItem {
  id: number; product_variant?: ProductVariant; product_name?: string; name?: string;
  quantity: number; price: string; total: string; quantity_affecte: string;
}
interface Order {
  id: number; point_of_sale?: number; point_of_sale_details?: PointOfSale;
  status: OrderStatus; total: string; date: string; delivery_date?: string;
  priority: Priority; notes?: string; created_at?: string; updated_at?: string; items: OrderItem[];
}
interface NewOrderItem { product_variant_id: number; quantity: number; price: string; }
interface NewOrder {
  point_of_sale_id: number | null; date: string; delivery_date: string;
  priority: Priority; notes: string; items: NewOrderItem[];
}
interface MobileVendor { id: number; full_name: string; phone?: string; email?: string; status?: string; }
interface VendorActivity {
  vendor: number | null; activity_type: string; timestamp: string;
  location: { lat: number; lng: number } | null; notes: string;
  related_order: number | null; quantity_assignes: number | null; quantity_sales: number | null;
}
interface CartLine { variantId: number; quantity: number; }

// ─── Constants ──────────────────────────────────────────────────────────────────

const API_BASE = 'https://api.lanfialink.com/api';
const ORDERS_PER_PAGE = 10;

// Seuls les points de vente de nature "distributeur_secondaire" sont utilisables
// comme destination de commande dans ce module.
const DISTRIBUTEUR_SECONDAIRE = 'distributeur_secondaire';
// Normalise la valeur avant comparaison : gère le cas où l'API renvoie le libellé
// humain ("Distributeur Secondaire"), des espaces au lieu d'underscores, une casse
// différente, ou un objet de choix { value / code / slug / label } au lieu d'une
// simple chaîne.
const normalizeNature = (raw: any): string => {
  if (raw == null) return '';
  const value = typeof raw === 'string' ? raw : (raw.value ?? raw.code ?? raw.slug ?? raw.label ?? raw.name ?? '');
  return String(value).trim().toLowerCase().replace(/[\s-]+/g, '_');
};
const isDistributeurSecondaire = (pos?: Partial<PointOfSale> | null) => normalizeNature(pos?.nature) === DISTRIBUTEUR_SECONDAIRE;

// Certaines API DRF paginent leurs listes ({count, next, previous, results: [...]})
// au lieu de renvoyer un tableau brut : on gère les deux formats pour éviter
// qu'un .filter() sur un objet ne fasse silencieusement échouer le filtrage.
const extractList = <T,>(json: any): T[] => {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.results)) return json.results;
  return [];
};

// ─── Palette (identique aux vues Financement / Paiements / Stock) ─────────────

const P = {
  navy: '#0A1E2E', blue: '#1A8FD1', blueL: '#4FB3E8', blueD: '#0D6FAB', banner: '#0D4E7A',
  pale: '#EDF5FA', surface: '#F0F5F9', warm: '#C0D4E6', warmL: '#D4E4F0',
  text: '#0A1E2E', textSub: '#2A4A62', muted: '#5A7A92', mutedD: '#1A4A6A',
  green: '#10B981', orange: '#F59E0B', red: '#EF4444', purple: '#8B5CF6', teal: '#14B8A6', gray: '#8AA6BA',
};

const card: React.CSSProperties = {
  background: '#fff', border: `1px solid ${P.warmL}`, borderRadius: 16,
  boxShadow: '0 1px 6px rgba(13,80,140,0.06)',
};

const inp: React.CSSProperties = {
  width: '100%', padding: '8px 12px', height: 38,
  border: `1.5px solid ${P.warm}`, borderRadius: 10, fontSize: 13, outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit', color: P.text, background: '#fff',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

const lbl: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700, color: P.mutedD, marginBottom: 5,
};

const STATUS_CONFIG: Record<OrderStatus, { label: string; bg: string; fg: string; dot: string; icon: React.FC<any> }> = {
  pending:   { label: 'En attente', bg: '#FBEFD6', fg: '#7A4F00', dot: P.orange, icon: Clock },
  confirmed: { label: 'Confirmée',  bg: '#DDEBFA', fg: '#0A4A80', dot: P.blue,   icon: CheckCircle },
  shipped:   { label: 'Expédiée',   bg: '#EADFFB', fg: '#4B2A94', dot: P.purple, icon: Truck },
  delivered: { label: 'Livrée',     bg: '#DCF5EC', fg: '#044D38', dot: P.green,  icon: CheckCircle2 },
  cancelled: { label: 'Annulée',    bg: '#FCE4DC', fg: '#7A2410', dot: P.red,    icon: XCircle },
};

const PRIORITY_CONFIG: Record<Priority, { label: string; bg: string; fg: string; dot: string }> = {
  high:   { label: 'Haute',   bg: '#FCE4DC', fg: '#7A2410', dot: P.red },
  medium: { label: 'Moyenne', bg: '#FBEFD6', fg: '#7A4F00', dot: P.orange },
  low:    { label: 'Basse',   bg: '#DCF5EC', fg: '#044D38', dot: P.green },
};

const STOCK_STATUS_CONFIG: Record<StockStatus, { label: string; bg: string; fg: string; dot: string }> = {
  out:      { label: 'Rupture',      bg: '#FCE4DC', fg: '#7A2410', dot: P.red },
  low:      { label: 'Stock faible', bg: '#FBEFD6', fg: '#7A4F00', dot: P.orange },
  in_stock: { label: 'En stock',     bg: '#DCF5EC', fg: '#044D38', dot: P.green },
};

const ACTIVITY_TYPES = [
  { value: 'sale',                label: 'Vente' },
  { value: 'stock_replenishment', label: 'Réapprovisionnement' },
  { value: 'check_in',            label: 'Check-in' },
  { value: 'check_out',           label: 'Check-out' },
  { value: 'incident',            label: 'Incident' },
  { value: 'other',               label: 'Autre' },
];

// ─── Helpers ────────────────────────────────────────────────────────────────────

const formatCurrency = (amount: string | number | null | undefined) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 })
    .format(parseFloat(String(amount ?? 0)) || 0);

const formatDate = (dateStr?: string) =>
  dateStr ? new Date(dateStr).toLocaleDateString('fr-FR') : 'Non spécifiée';

const isToday = (d: string) => new Date(d).toDateString() === new Date().toDateString();
const isThisWeek = (d: string) => { const now = new Date(); const week = new Date(now); week.setDate(now.getDate() - 7); return new Date(d) >= week; };
const isThisMonth = (d: string) => { const now = new Date(); const dt = new Date(d); return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear(); };

// Échappe le HTML injecté dans la fenêtre d'impression (noms de produits / PDV).
const esc = (s: any) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c]);

const getAuthHeaders = () => {
  const token = localStorage.getItem('access');
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : null;
};

const getStockStatus = (v: ProductVariant): StockStatus => {
  const stock = v.current_stock || 0;
  const min = v.min_stock || 0;
  if (stock <= 0) return 'out';
  if (stock <= min) return 'low';
  return 'in_stock';
};

// Regroupe, sans doublon, le(s) point(s) de vente réellement impliqué(s) dans une
// commande : le point de vente de la commande + celui de chaque article (au cas où
// les articles proviennent de points de vente différents).
const getOrderPosList = (order: Order): PointOfSale[] => {
  const map = new Map<number, PointOfSale>();
  if (order.point_of_sale_details) map.set(order.point_of_sale_details.id, order.point_of_sale_details);
  order.items.forEach(item => {
    const pos = item.product_variant?.point_of_sale_details;
    if (pos) map.set(pos.id, pos);
  });
  return Array.from(map.values());
};

// ─── Styles globaux (focus, survols, grilles responsives) ─────────────────────

const GlobalStyles = () => (
  <style>{`
    @keyframes ordSpin { to { transform: rotate(360deg); } }
    @keyframes ordPop { 0% { transform: scale(0.96); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
    .ord-spin { animation: ordSpin 0.8s linear infinite; }
    .ord-pop { animation: ordPop 0.16s ease; }
    .ord-root input:not([type=checkbox]):not([type=file]):focus,
    .ord-root select:focus,
    .ord-root textarea:focus { border-color: #1A8FD1 !important; box-shadow: 0 0 0 3px rgba(26,143,209,0.15); }
    .ord-row { transition: background 0.12s; }
    .ord-row:hover { background: #EDF5FA; }
    .ord-btn { transition: opacity 0.15s, transform 0.1s; }
    .ord-btn:active:not(:disabled) { transform: scale(0.98); }
    .ord-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .ord-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .ord-catalog-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
    .ord-img-zoom { transition: transform 0.35s ease; }
    .ord-img-wrap:hover .ord-img-zoom { transform: scale(1.05); }
    .ord-item-row { display: grid; grid-template-columns: minmax(0, 3fr) minmax(0, 1.2fr) minmax(0, 1fr) 32px; gap: 8px; align-items: center; }
    @media (max-width: 900px) {
      .ord-grid-2, .ord-grid-3 { grid-template-columns: 1fr; }
    }
    @media (max-width: 640px) {
      .ord-item-row { grid-template-columns: 1fr auto 32px; }
      .ord-item-picker { grid-column: 1 / -1; }
      .ord-item-head { display: none; }
    }
    @media (prefers-reduced-motion: reduce) { .ord-spin { animation-duration: 2s; } .ord-pop { animation: none; } }
  `}</style>
);

// ─── Petits composants ──────────────────────────────────────────────────────────

const Pill = ({ bg, fg, dot, icon: Icon, children }: {
  bg: string; fg: string; dot?: string; icon?: any; children: React.ReactNode;
}) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 9999,
    fontSize: 11, fontWeight: 700, background: bg, color: fg, whiteSpace: 'nowrap' }}>
    {Icon ? <Icon size={10} /> : dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot }} />}
    {children}
  </span>
);

const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const c = STATUS_CONFIG[status];
  return <Pill bg={c.bg} fg={c.fg} icon={c.icon}>{c.label}</Pill>;
};

const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  const c = PRIORITY_CONFIG[priority];
  return <Pill bg={c.bg} fg={c.fg} dot={c.dot}>{c.label}</Pill>;
};

const StockBadge: React.FC<{ status: StockStatus }> = ({ status }) => {
  const c = STOCK_STATUS_CONFIG[status];
  return <Pill bg={c.bg} fg={c.fg} dot={c.dot}>{c.label}</Pill>;
};

const Kpi = ({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string | number; sub?: string; color: string;
}) => (
  <div style={{ ...card, padding: 16, display: 'flex', justifyContent: 'space-between', gap: 10 }}>
    <div style={{ minWidth: 0 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: P.muted, margin: 0 }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 800, color: P.text, margin: '6px 0 0', fontVariantNumeric: 'tabular-nums' }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: P.muted, margin: '3px 0 0' }}>{sub}</p>}
    </div>
    <div style={{ width: 40, height: 40, borderRadius: 11, background: `${color}1A`, display: 'flex',
      alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={18} style={{ color }} />
    </div>
  </div>
);

const SectionTitle = ({ icon: Icon, label }: { icon: any; label: string }) => (
  <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: P.text, margin: 0 }}>
    <Icon size={14} style={{ color: P.blue }} /> {label}
  </h4>
);

// ─── Image produit (avec repli) ────────────────────────────────────────────────

const ProductImage: React.FC<{
  src?: string; alt: string; size?: number; rounded?: number; onClick?: (e: React.MouseEvent) => void;
}> = ({ src, alt, size = 44, rounded = 10, onClick }) => (
  src ? (
    <img src={src} alt={alt} onClick={onClick} loading="lazy"
      style={{ width: size, height: size, objectFit: 'cover', borderRadius: rounded, border: `1px solid ${P.warmL}`,
        cursor: onClick ? 'zoom-in' : 'default', flexShrink: 0, background: P.surface }} />
  ) : (
    <div onClick={onClick} style={{ width: size, height: size, borderRadius: rounded, background: P.pale,
      border: `1px dashed ${P.warm}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, cursor: onClick ? 'pointer' : 'default' }}>
      <Package size={Math.max(12, Math.round(size * 0.42))} color={P.gray} />
    </div>
  )
);

// ─── Badge point de vente ─────────────────────────────────────────────────────

const PosBadge: React.FC<{ name: string; small?: boolean }> = ({ name, small }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: small ? '2px 7px' : '3px 9px', borderRadius: 9999,
    fontSize: small ? 10 : 11, fontWeight: 700,
    background: P.pale, color: P.blueD, border: `1px solid ${P.warmL}`,
    maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  }}>
    <Store size={small ? 9 : 10} style={{ flexShrink: 0 }} /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
  </span>
);

// ─── Zoom image plein écran ────────────────────────────────────────────────────

const ImageZoomModal: React.FC<{ src: string; alt?: string; onClose: () => void }> = ({ src, alt, onClose }) => {
  // Échap ferme uniquement le zoom (capture : la modale en dessous ne se ferme pas).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-label="Image agrandie" onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(10,21,32,0.88)', zIndex: 80, display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 24, cursor: 'zoom-out' }}>
      <button onClick={onClose} aria-label="Fermer"
        style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.15)', border: 'none',
          borderRadius: 10, padding: 8, cursor: 'pointer', display: 'flex' }}>
        <X size={20} color="#fff" />
      </button>
      <img src={src} alt={alt || ''} onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '92vw', maxHeight: '86vh', objectFit: 'contain', borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} />
    </div>
  );
};

// ─── Sélecteur de quantité ─────────────────────────────────────────────────────

const QuantityStepper: React.FC<{
  value: number; min?: number; max?: number; onChange: (v: number) => void; size?: 'sm' | 'md';
}> = ({ value, min = 0, max, onChange, size = 'md' }) => {
  const h = size === 'sm' ? 28 : 34;
  const atMin = value <= min;
  const atMax = max !== undefined && value >= max;
  const btn = (disabled: boolean): React.CSSProperties => ({
    width: h, height: h, border: 'none', background: P.surface, cursor: disabled ? 'not-allowed' : 'pointer',
    color: disabled ? P.warm : P.text, fontWeight: 700, fontSize: 15, lineHeight: 1, fontFamily: 'inherit',
  });
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', border: `1.5px solid ${P.warm}`, borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
      <button type="button" aria-label="Diminuer" onClick={() => onChange(Math.max(min, value - 1))} disabled={atMin} style={btn(atMin)}>−</button>
      <span style={{ minWidth: 34, textAlign: 'center', fontSize: 13, fontWeight: 800, color: P.text, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      <button type="button" aria-label="Augmenter" onClick={() => onChange(max !== undefined ? Math.min(max, value + 1) : value + 1)} disabled={atMax} style={btn(atMax)}>+</button>
    </div>
  );
};

// ─── Pagination / actions ──────────────────────────────────────────────────────

const PagBtn = ({ onClick, disabled = false, active = false, children }: {
  onClick: () => void; disabled?: boolean; active?: boolean; children: React.ReactNode;
}) => (
  <button onClick={onClick} disabled={disabled}
    style={{ padding: '5px 10px', minWidth: 30, borderRadius: 8, fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
      cursor: disabled ? 'not-allowed' : 'pointer', border: `1px solid ${active ? P.blue : P.warm}`,
      background: active ? P.blue : '#fff', color: active ? '#fff' : disabled ? P.warm : P.textSub,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
    {children}
  </button>
);

const ActionBtn = ({ onClick, title, danger, children }: {
  onClick: () => void; title: string; danger?: boolean; children: React.ReactNode;
}) => (
  <button className="ord-btn" onClick={onClick} title={title} aria-label={title}
    style={{ padding: 7, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}
    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = danger ? '#FEF0ED' : P.pale; }}
    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
    {children}
  </button>
);

// ─── Champs de formulaire ──────────────────────────────────────────────────────

const FormInput = ({ label, value, onChange, type = 'text', placeholder = '', required = false }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean;
}) => (
  <div>
    <label style={lbl}>{label}{required && ' *'}</label>
    <input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} style={inp} />
  </div>
);

const FormSelect = ({ label, value, onChange, required = false, children, style = {} }: {
  label?: string; value: string | number; onChange: (v: string) => void;
  required?: boolean; children: React.ReactNode; style?: React.CSSProperties;
}) => (
  <div style={{ flex: 1 }}>
    {label && <label style={lbl}>{label}{required && ' *'}</label>}
    <select value={value} onChange={(e) => onChange(e.target.value)} required={required}
      style={{ ...inp, cursor: 'pointer', ...style }}>{children}</select>
  </div>
);

// ─── État vide ─────────────────────────────────────────────────────────────────

const EmptyState: React.FC<{ icon?: any; title: string; text?: string; action?: React.ReactNode }> = ({ icon: Icon = PackageSearch, title, text, action }) => (
  <div style={{ padding: '44px 24px', textAlign: 'center' }}>
    <div style={{ width: 52, height: 52, background: P.pale, borderRadius: '50%', display: 'flex',
      alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
      <Icon size={22} color={P.blue} />
    </div>
    <p style={{ fontWeight: 700, color: P.text, margin: '0 0 4px', fontSize: 14 }}>{title}</p>
    {text && <p style={{ fontSize: 12, color: P.muted, maxWidth: 340, margin: '0 auto' }}>{text}</p>}
    {action && <div style={{ marginTop: 16 }}>{action}</div>}
  </div>
);

// ─── Modale ────────────────────────────────────────────────────────────────────

const ModalWrapper: React.FC<{
  onClose: () => void; title: string; subtitle?: string;
  icon?: any; children: React.ReactNode; footer: React.ReactNode;
  maxWidth?: number;
}> = ({ onClose, title, subtitle, icon: Icon, children, footer, maxWidth = 860 }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={title}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(10,21,32,0.55)', backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
      <div className="ord-pop" style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth,
        maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(10,21,32,0.25)' }}>
        <div style={{ background: P.banner, padding: '14px 20px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {Icon && (
              <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.16)', borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={17} color="#fff" />
              </div>
            )}
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: 0 }}>{title}</h3>
              {subtitle && <p style={{ fontSize: 11, color: 'rgba(200,230,248,0.85)', margin: '2px 0 0' }}>{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} aria-label="Fermer"
            style={{ padding: 7, background: 'rgba(255,255,255,0.16)', border: 'none', borderRadius: 9,
              cursor: 'pointer', color: '#fff', display: 'flex' }}>
            <X size={15} />
          </button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: 20 }}>{children}</div>
        <div style={{ borderTop: `1px solid ${P.warmL}`, padding: '14px 20px', display: 'flex', justifyContent: 'flex-end',
          alignItems: 'center', gap: 10, background: P.surface, flexShrink: 0, flexWrap: 'wrap' }}>
          {footer}
        </div>
      </div>
    </div>
  );
};

// ─── Boutons ───────────────────────────────────────────────────────────────────

const BtnPrimary: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; loadingText?: string }> = ({ children, loading, loadingText, style, ...props }) => (
  <button {...props} className="ord-btn" disabled={props.disabled || loading}
    style={{ padding: '9px 16px', borderRadius: 10, border: 'none', background: P.blue, color: '#fff', fontSize: 12,
      fontWeight: 700, cursor: (props.disabled || loading) ? 'not-allowed' : 'pointer', display: 'inline-flex',
      alignItems: 'center', gap: 6, opacity: (props.disabled || loading) ? 0.65 : 1, fontFamily: 'inherit', ...style }}>
    {loading ? <><Loader2 size={13} className="ord-spin" />{loadingText}</> : children}
  </button>
);

const BtnSecondary: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, style, ...props }) => (
  <button {...props} className="ord-btn"
    style={{ padding: '9px 16px', borderRadius: 10, border: `1.5px solid ${P.warm}`, background: '#fff', color: P.mutedD,
      fontSize: 12, fontWeight: 700, cursor: props.disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
      display: 'inline-flex', alignItems: 'center', gap: 6, opacity: props.disabled ? 0.6 : 1, ...style }}>
    {children}
  </button>
);

const BtnDanger: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, style, ...props }) => (
  <button {...props} className="ord-btn"
    style={{ padding: '9px 16px', borderRadius: 10, border: 'none', background: P.red, color: '#fff', fontSize: 12,
      fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', ...style }}>
    {children}
  </button>
);

// ─── Bandeau d'erreur ──────────────────────────────────────────────────────────

const ErrorBanner: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => (
  <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#FEF0ED',
    border: '1px solid #F5C4B3', borderRadius: 12, fontSize: 13, color: '#9A2D10' }}>
    <AlertTriangle size={15} style={{ flexShrink: 0 }} />
    <span style={{ flex: 1, fontWeight: 600 }}>{message}</span>
    <button onClick={onClose} aria-label="Fermer" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9A2D10', display: 'flex' }}>
      <X size={14} />
    </button>
  </div>
);

// ─── Sélecteur de produit (recherche + aperçu) ─────────────────────────────────

const ProductVariantPicker: React.FC<{
  value: number;
  productVariants: ProductVariant[];
  onSelect: (variant: ProductVariant) => void;
  onZoom?: (src: string) => void;
}> = ({ value, productVariants, onSelect, onZoom }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selected = productVariants.find(v => v.id === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = !q ? productVariants : productVariants.filter(v =>
      (v.product?.name || '').toLowerCase().includes(q) ||
      (v.format?.name || '').toLowerCase().includes(q) ||
      (v.point_of_sale_details?.name || '').toLowerCase().includes(q)
    );
    return pool.slice(0, 40);
  }, [query, productVariants]);

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <div onClick={() => setOpen(o => !o)} role="button" tabIndex={0} aria-expanded={open}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(o => !o); } }}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', border: `1.5px solid ${open ? P.blue : P.warm}`,
          borderRadius: 10, background: '#fff', cursor: 'pointer', minHeight: 42 }}>
        {selected ? (
          <>
            <ProductImage src={selected.image} alt="" size={28} rounded={7} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: P.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                {selected.product?.name || 'Inconnu'} — {selected.format?.name || 'Sans format'}
              </p>
              {selected.point_of_sale_details?.name && (
                <p style={{ fontSize: 10, color: P.blueD, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.point_of_sale_details.name}</p>
              )}
            </div>
          </>
        ) : (
          <span style={{ fontSize: 12, color: P.muted, display: 'flex', alignItems: 'center', gap: 6 }}><Search size={12} /> Choisir un produit…</span>
        )}
      </div>

      {open && (
        <div style={{ position: 'absolute', zIndex: 20, top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff',
          border: `1px solid ${P.warm}`, borderRadius: 12, boxShadow: '0 14px 34px rgba(10,21,32,0.20)', overflow: 'hidden' }}>
          <div style={{ padding: 8, borderBottom: `1px solid ${P.surface}` }}>
            {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un produit ou un point de vente…"
              style={{ ...inp, height: 34, fontSize: 12 }} />
          </div>
          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
            {results.length === 0 ? (
              <div style={{ padding: 16, textAlign: 'center', fontSize: 12, color: P.muted }}>Aucun produit trouvé</div>
            ) : results.map(v => {
              const stockStatus = getStockStatus(v);
              return (
                <div key={v.id} className="ord-row" onClick={() => { onSelect(v); setOpen(false); setQuery(''); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', cursor: 'pointer' }}>
                  <ProductImage src={v.image} alt="" size={34} rounded={8}
                    onClick={v.image && onZoom ? (e) => { e.stopPropagation(); onZoom(v.image!); } : undefined} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: P.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                      {v.product?.name || 'Inconnu'} — {v.format?.name || 'Sans format'}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, color: P.muted }}>{formatCurrency(v.price)} · {v.current_stock ?? 0} en stock</span>
                      {v.point_of_sale_details?.name && <PosBadge name={v.point_of_sale_details.name} small />}
                    </div>
                  </div>
                  {stockStatus !== 'in_stock' && <StockBadge status={stockStatus} />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Éditeur d'articles ────────────────────────────────────────────────────────

const OrderItemsEditor: React.FC<{
  items: NewOrderItem[];
  productVariants: ProductVariant[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  onChange: (i: number, field: keyof NewOrderItem, value: any) => void;
  onZoom?: (src: string) => void;
}> = ({ items, productVariants, onAdd, onRemove, onChange, onZoom }) => {
  const itemsTotal = items.reduce((sum, it) => sum + (parseFloat(it.price) || 0) * it.quantity, 0);
  return (
    <div style={{ border: `1px solid ${P.warmL}`, borderRadius: 14, background: P.surface }}>
      <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.length > 0 && (
          <div className="ord-item-row ord-item-head" style={{ padding: '0 10px', fontSize: 10, fontWeight: 700, color: P.muted }}>
            <div>Produit</div><div style={{ textAlign: 'center' }}>Quantité</div><div style={{ textAlign: 'right' }}>Total</div><div />
          </div>
        )}
        {items.map((item, index) => {
          const variant = productVariants.find(v => v.id === item.product_variant_id);
          const maxStock = variant?.current_stock ?? undefined;
          const lineTotal = (parseFloat(item.price) || 0) * item.quantity;
          return (
            <div key={index} className="ord-item-row ord-pop" style={{ background: '#fff', padding: 10, borderRadius: 12, border: `1px solid ${P.warmL}` }}>
              <div className="ord-item-picker">
                <ProductVariantPicker value={item.product_variant_id} productVariants={productVariants} onZoom={onZoom}
                  onSelect={(v) => { onChange(index, 'product_variant_id', v.id); onChange(index, 'price', v.price); }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <QuantityStepper value={item.quantity} min={1} max={maxStock} onChange={(v) => onChange(index, 'quantity', v)} size="sm" />
              </div>
              <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: P.text }}>{formatCurrency(lineTotal)}</div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <ActionBtn danger onClick={() => onRemove(index)} title="Retirer cet article"><X size={14} color={P.red} /></ActionBtn>
              </div>
            </div>
          );
        })}
        <button type="button" onClick={onAdd} className="ord-btn"
          style={{ width: '100%', padding: '10px 0', border: `2px dashed ${P.warm}`, borderRadius: 12, background: '#fff', color: P.blueD,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>
          <Plus size={14} /> Ajouter un article
        </button>
        {items.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '2px 4px', fontSize: 12, fontWeight: 700, color: P.text }}>
            Sous-total articles : <span style={{ marginLeft: 6, color: P.blueD }}>{formatCurrency(itemsTotal)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Modale : nouvelle commande ────────────────────────────────────────────────

const AddOrderModal: React.FC<{
  onClose: () => void; onCreated: (order: Order) => void;
  productVariants: ProductVariant[]; pointsOfSale: PointOfSale[];
  initialItems?: NewOrderItem[];
  onZoom?: (src: string) => void;
}> = ({ onClose, onCreated, productVariants, pointsOfSale, initialItems, onZoom }) => {
  const [form, setForm] = useState<NewOrder>({
    point_of_sale_id: null, date: new Date().toISOString().split('T')[0], delivery_date: '',
    priority: 'medium', notes: '', items: initialItems && initialItems.length ? initialItems : [],
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

  const orderTotal = form.items.reduce((sum, it) => sum + (parseFloat(it.price) || 0) * it.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    if (!form.point_of_sale_id) return setError('Veuillez sélectionner un point de vente.');
    if (form.items.length === 0) return setError('Veuillez ajouter au moins un article.');
    const headers = getAuthHeaders();
    if (!headers) return setError('Veuillez vous connecter.');
    for (const item of form.items) {
      const variant = productVariants.find(v => v.id === item.product_variant_id);
      if (!variant) return setError('Variante de produit invalide.');
      if ((variant.current_stock || 0) < item.quantity) return setError(`Stock insuffisant pour ${variant.product?.name || 'ce produit'}.`);
    }
    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/orders/`, {
        method: 'POST', headers,
        body: JSON.stringify({ point_of_sale: form.point_of_sale_id, date: form.date, delivery_date: form.delivery_date, priority: form.priority, notes: form.notes, items: form.items.map(({ product_variant_id, quantity }) => ({ product_variant_id, quantity })) }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || JSON.stringify(d)); }
      onCreated(await res.json()); onClose();
    } catch (err: any) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  return (
    <ModalWrapper onClose={onClose} title="Nouvelle commande" subtitle="Créer une commande pour un point de vente" icon={Plus}
      footer={<>
        <div style={{ marginRight: 'auto', fontSize: 12, color: P.muted, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          Total : <strong style={{ fontSize: 15, color: P.text }}>{formatCurrency(orderTotal)}</strong>
        </div>
        <BtnSecondary type="button" onClick={onClose}>Annuler</BtnSecondary>
        <BtnPrimary type="submit" form="add-order-form" loading={submitting} loadingText="Création…"><Plus size={13} /> Créer la commande</BtnPrimary>
      </>}>
      <form id="add-order-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && <ErrorBanner message={error} onClose={() => setError(null)} />}
        {initialItems && initialItems.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 10, background: '#DCF5EC', fontSize: 12, color: '#044D38', fontWeight: 600 }}>
            <ShoppingCart size={14} /> {initialItems.length} article(s) importé(s) depuis votre panier — il ne reste plus qu'à choisir le point de vente.
          </div>
        )}
        {pointsOfSale.length === 0 ? (
          <EmptyState icon={Store} title="Aucun point de vente disponible" text="Aucun distributeur secondaire n'est enregistré. Ajoutez-en un pour pouvoir créer une commande." />
        ) : (
          <FormSelect label="Point de vente (distributeur secondaire)" required value={form.point_of_sale_id || ''} onChange={(v) => setForm(p => ({ ...p, point_of_sale_id: parseInt(v) || null }))}>
            <option value="">Sélectionner un point de vente</option>
            {pointsOfSale.map(pos => <option key={pos.id} value={pos.id}>{pos.name}{pos.address ? ` — ${pos.address}` : ''}</option>)}
          </FormSelect>
        )}
        <div className="ord-grid-3">
          <FormSelect label="Priorité" required value={form.priority} onChange={(v) => setForm(p => ({ ...p, priority: v as Priority }))}>
            <option value="low">Basse</option><option value="medium">Moyenne</option><option value="high">Haute</option>
          </FormSelect>
          <FormInput label="Date commande" type="date" value={form.date} onChange={(v) => setForm(p => ({ ...p, date: v }))} required />
          <FormInput label="Date livraison" type="date" value={form.delivery_date} onChange={(v) => setForm(p => ({ ...p, delivery_date: v }))} required />
        </div>
        <div>
          <label style={{ ...lbl, marginBottom: 8 }}>Articles</label>
          <OrderItemsEditor items={form.items} productVariants={productVariants} onZoom={onZoom}
            onAdd={() => setForm(p => ({ ...p, items: [...p.items, { product_variant_id: 0, quantity: 1, price: '0' }] }))}
            onRemove={(i) => setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }))}
            onChange={handleItemChange} />
        </div>
        <div>
          <label style={lbl}>Notes</label>
          <textarea value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} placeholder="Instructions, remarques…"
            style={{ ...inp, height: 'auto', resize: 'vertical', padding: '8px 12px' }} />
        </div>
      </form>
    </ModalWrapper>
  );
};

// ─── Modale : modifier la commande ─────────────────────────────────────────────

const EditOrderModal: React.FC<{
  order: Order; onClose: () => void; onUpdated: (order: Order) => void; productVariants: ProductVariant[];
  onZoom?: (src: string) => void;
}> = ({ order, onClose, onUpdated, productVariants, onZoom }) => {
  const [form, setForm] = useState({ ...order });
  const [items, setItems] = useState<NewOrderItem[]>(order.items.map(item => ({ product_variant_id: item.product_variant?.id || 0, quantity: item.quantity, price: item.price })));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleItemChange = (index: number, field: keyof NewOrderItem, value: any) => {
    setItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (field === 'product_variant_id') { const variant = productVariants.find(v => v.id === value); next[index].price = variant?.price ?? '0'; }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    if (items.length === 0) return setError('Veuillez ajouter au moins un article.');
    const headers = getAuthHeaders();
    if (!headers) return setError('Veuillez vous connecter.');
    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/orders/${order.id}/`, {
        method: 'PUT', headers,
        body: JSON.stringify({ point_of_sale: form.point_of_sale, date: form.date, delivery_date: form.delivery_date, priority: form.priority, status: form.status, notes: form.notes, items: items.map(({ product_variant_id, quantity }) => ({ product_variant_id, quantity })) }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || JSON.stringify(d)); }
      onUpdated(await res.json()); onClose();
    } catch (err: any) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  return (
    <ModalWrapper onClose={onClose} title="Modifier la commande" subtitle={`Commande CMD-${order.id}`} icon={Edit}
      footer={<>
        <BtnSecondary type="button" onClick={onClose}>Annuler</BtnSecondary>
        <BtnPrimary type="submit" form="edit-order-form" loading={submitting} loadingText="Enregistrement…"><CheckCircle size={13} /> Enregistrer</BtnPrimary>
      </>}>
      <form id="edit-order-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && <ErrorBanner message={error} onClose={() => setError(null)} />}
        {order.point_of_sale_details?.name && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: P.mutedD }}>Point de vente</span>
            <PosBadge name={order.point_of_sale_details.name} />
          </div>
        )}
        <div className="ord-grid-2">
          <FormInput label="Date commande" type="date" value={form.date} onChange={(v) => setForm(p => ({ ...p, date: v }))} />
          <FormInput label="Date livraison" type="date" value={form.delivery_date || ''} onChange={(v) => setForm(p => ({ ...p, delivery_date: v }))} />
        </div>
        <div className="ord-grid-2">
          <FormSelect label="Priorité" value={form.priority} onChange={(v) => setForm(p => ({ ...p, priority: v as Priority }))}>
            <option value="low">Basse</option><option value="medium">Moyenne</option><option value="high">Haute</option>
          </FormSelect>
          <FormSelect label="Statut" value={form.status} onChange={(v) => setForm(p => ({ ...p, status: v as OrderStatus }))}>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </FormSelect>
        </div>
        <div>
          <label style={{ ...lbl, marginBottom: 8 }}>Articles</label>
          <OrderItemsEditor items={items} productVariants={productVariants} onZoom={onZoom}
            onAdd={() => setItems(p => [...p, { product_variant_id: 0, quantity: 1, price: '0' }])}
            onRemove={(i) => setItems(p => p.filter((_, idx) => idx !== i))}
            onChange={handleItemChange} />
        </div>
        <div>
          <label style={lbl}>Notes</label>
          <textarea value={form.notes || ''} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} placeholder="Notes supplémentaires…"
            style={{ ...inp, height: 'auto', resize: 'vertical', padding: '8px 12px' }} />
        </div>
      </form>
    </ModalWrapper>
  );
};

// ─── Modale : détails de la commande ───────────────────────────────────────────

const OrderDetailsModal: React.FC<{
  order: Order; canEdit: boolean; onClose: () => void; onEdit: (order: Order) => void;
  onDelete: (id: number) => void; onStatusChange: (id: number, status: OrderStatus) => void;
  onAssign: (order: Order, item: OrderItem) => void; onZoom: (src: string) => void;
}> = ({ order, canEdit, onClose, onEdit, onDelete, onStatusChange, onAssign, onZoom }) => {
  const posList = getOrderPosList(order);

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Commande #${order.id}</title>
      <style>body{font-family:system-ui,sans-serif;padding:24px;color:#0A1E2E}
      table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #C0D4E6;padding:9px;text-align:left;font-size:13px}
      th{background:#0D4E7A;color:#FFFFFF}</style></head><body>
      <h1 style="color:#0D6FAB;margin:0 0 8px">Commande CMD-${order.id}</h1>
      <p>Point(s) de vente : ${esc(posList.map(p => p.name).join(', ') || '—')}</p>
      <p>Date : ${esc(formatDate(order.date))} | Livraison : ${esc(formatDate(order.delivery_date))}</p>
      <table><thead><tr><th>Produit</th><th>Point de vente</th><th>Qté</th><th>Prix</th><th>Total</th></tr></thead><tbody>
      ${order.items.map(i => `<tr><td>${esc(i.product_name || i.product_variant?.product?.name || '—')}</td><td>${esc(i.product_variant?.point_of_sale_details?.name || '—')}</td><td>${esc(i.quantity)}</td><td>${esc(formatCurrency(i.price))}</td><td>${esc(formatCurrency(i.total))}</td></tr>`).join('')}
      </tbody><tfoot><tr><td colspan="4"><strong>Total</strong></td><td><strong>${esc(formatCurrency(order.total))}</strong></td></tr></tfoot></table>
      <script>window.onload=()=>window.print()</script></body></html>`);
    win.document.close();
  };

  const infoRows: [string, string | undefined][] = [
    ['Nom', order.point_of_sale_details?.name], ['Propriétaire', order.point_of_sale_details?.owner],
    ['Email', order.point_of_sale_details?.email], ['Téléphone', order.point_of_sale_details?.phone],
    ['Adresse', order.point_of_sale_details?.address],
  ];

  return (
    <ModalWrapper onClose={onClose} title="Détails de la commande" subtitle={`CMD-${order.id}`} icon={Package}
      footer={<>
        <select value={order.status} onChange={(e) => onStatusChange(order.id, e.target.value as OrderStatus)} aria-label="Statut de la commande"
          style={{ ...inp, width: 'auto', height: 36, cursor: 'pointer', marginRight: 'auto' }}>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <BtnSecondary onClick={handlePrint}><Download size={13} /> Imprimer</BtnSecondary>
        {canEdit && <><BtnPrimary onClick={() => onEdit(order)}><Edit size={13} /> Modifier</BtnPrimary><BtnDanger onClick={() => onDelete(order.id)}><Trash2 size={13} /> Supprimer</BtnDanger></>}
      </>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="ord-grid-2">
          <div style={{ ...card, padding: 16, boxShadow: 'none' }}>
            <SectionTitle icon={MapPin} label="Point de vente" />
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {infoRows.map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, padding: '5px 0', borderBottom: `1px solid ${P.surface}` }}>
                  <span style={{ color: P.muted }}>{l}</span>
                  <span style={{ fontWeight: 700, color: P.text, textAlign: 'right' }}>{v || '—'}</span>
                </div>
              ))}
            </div>
            {posList.length > 1 && (
              <div style={{ marginTop: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: P.muted, margin: '0 0 6px' }}>Autres points de vente impliqués</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {posList.slice(1).map(p => <PosBadge key={p.id} name={p.name} small />)}
                </div>
              </div>
            )}
          </div>

          <div style={{ background: P.banner, borderRadius: 16, padding: 16 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '0 0 12px' }}>Informations de la commande</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[['Date', formatDate(order.date)], ['Livraison', formatDate(order.delivery_date)]].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', background: 'rgba(255,255,255,0.10)', borderRadius: 9, fontSize: 12 }}>
                  <span style={{ color: 'rgba(200,230,248,0.85)' }}>{l}</span>
                  <span style={{ fontWeight: 700, color: '#fff' }}>{v}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 10px', background: 'rgba(255,255,255,0.10)', borderRadius: 9, fontSize: 12 }}>
                <span style={{ color: 'rgba(200,230,248,0.85)' }}>Statut</span><StatusBadge status={order.status} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 10px', background: 'rgba(255,255,255,0.10)', borderRadius: 9, fontSize: 12 }}>
                <span style={{ color: 'rgba(200,230,248,0.85)' }}>Priorité</span><PriorityBadge priority={order.priority} />
              </div>
              <div style={{ padding: 10, background: 'rgba(255,255,255,0.14)', borderRadius: 9, textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: 'rgba(200,230,248,0.85)', margin: '0 0 2px', fontWeight: 600 }}>Total</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>{formatCurrency(order.total)}</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <SectionTitle icon={Package} label={`Articles commandés (${order.items.length})`} />
          <div style={{ ...card, boxShadow: 'none', overflow: 'hidden', marginTop: 12 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: P.surface }}>
                    {['', 'Produit', 'Format', 'Point de vente', 'Qté', 'Prix unit.', 'Total', 'Affecté', ''].map((h, i) => (
                      <th key={i} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: P.muted, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, i) => (
                    <tr key={i} className="ord-row" style={{ borderTop: `1px solid ${P.surface}` }}>
                      <td style={{ padding: '10px 14px' }}>
                        <ProductImage src={item.product_variant?.image} alt={item.product_name || ''} size={36}
                          onClick={item.product_variant?.image ? () => onZoom(item.product_variant!.image!) : undefined} />
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: P.text }}>{item.product_name || item.product_variant?.product?.name || '—'}</td>
                      <td style={{ padding: '10px 14px', color: P.textSub }}>{item.product_variant?.format?.name || '—'}</td>
                      <td style={{ padding: '10px 14px', color: P.textSub }}>{item.product_variant?.point_of_sale_details?.name || '—'}</td>
                      <td style={{ padding: '10px 14px' }}><Pill bg={P.pale} fg={P.blueD}>{item.quantity}</Pill></td>
                      <td style={{ padding: '10px 14px', color: P.text, whiteSpace: 'nowrap' }}>{formatCurrency(item.price)}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: P.blueD, whiteSpace: 'nowrap' }}>{formatCurrency(item.total)}</td>
                      <td style={{ padding: '10px 14px', color: P.text }}>{item.quantity_affecte || '0'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <button className="ord-btn" onClick={() => onAssign(order, item)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: P.pale, color: P.blue, border: `1px solid ${P.warm}`,
                            borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                          <Target size={11} /> Affecter
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: P.surface, borderTop: `1px solid ${P.warmL}` }}>
                    <td colSpan={6} style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: P.text }}>Total</td>
                    <td style={{ padding: '10px 14px', fontWeight: 800, color: P.blueD, fontSize: 14, whiteSpace: 'nowrap' }}>{formatCurrency(order.total)}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {order.notes && (
          <div style={{ padding: 14, borderRadius: 12, border: `1px solid ${P.warmL}`, background: P.pale }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: P.muted, margin: '0 0 6px' }}>Notes</p>
            <p style={{ fontSize: 13, color: P.text, lineHeight: 1.6, margin: 0 }}>{order.notes}</p>
          </div>
        )}
      </div>
    </ModalWrapper>
  );
};

// ─── Modale : affecter à un vendeur ────────────────────────────────────────────

const AssignVendorModal: React.FC<{
  order: Order; item: OrderItem; vendors: MobileVendor[]; onClose: () => void;
}> = ({ order, item, vendors, onClose }) => {
  const [form, setForm] = useState<VendorActivity>({ vendor: null, activity_type: 'sale', timestamp: new Date().toISOString(), location: null, notes: '', related_order: order.id, quantity_assignes: item.quantity, quantity_sales: 0 });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    if (!form.vendor) return setError('Veuillez sélectionner un vendeur.');
    if (!form.quantity_assignes || form.quantity_assignes <= 0) return setError('Quantité invalide.');
    if (form.quantity_assignes > item.quantity) return setError('Quantité dépasse la quantité commandée.');
    const headers = getAuthHeaders();
    if (!headers) return setError('Veuillez vous connecter.');
    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/vendor-activities/`, { method: 'POST', headers, body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || JSON.stringify(d)); }
      onClose();
    } catch (err: any) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  return (
    <ModalWrapper onClose={onClose} title="Affecter à un vendeur" subtitle={`Commande CMD-${order.id} — ${item.product_name || item.product_variant?.product?.name || '—'}`} icon={Users}
      maxWidth={520}
      footer={<><BtnSecondary type="button" onClick={onClose}>Annuler</BtnSecondary><BtnPrimary type="submit" form="assign-form" loading={submitting} loadingText="Affectation…"><Target size={13} /> Affecter</BtnPrimary></>}>
      <form id="assign-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {error && <ErrorBanner message={error} onClose={() => setError(null)} />}
        {vendors.length === 0 ? (
          <EmptyState icon={Users} title="Aucun vendeur ambulant disponible" text="Ajoutez d'abord un vendeur pour pouvoir lui affecter des articles." />
        ) : (
          <FormSelect label="Vendeur ambulant" required value={form.vendor || ''} onChange={(v) => setForm(p => ({ ...p, vendor: parseInt(v) || null }))}>
            <option value="">Sélectionner un vendeur</option>
            {vendors.map(v => <option key={v.id} value={v.id}>{v.full_name}{v.phone ? ` — ${v.phone}` : ''}</option>)}
          </FormSelect>
        )}
        <FormSelect label="Type d'activité" required value={form.activity_type} onChange={(v) => setForm(p => ({ ...p, activity_type: v }))}>
          {ACTIVITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </FormSelect>
        <div>
          <label style={lbl}>Quantité à affecter *</label>
          <QuantityStepper value={form.quantity_assignes || 0} min={0} max={item.quantity} onChange={(v) => setForm(p => ({ ...p, quantity_assignes: v }))} />
          <p style={{ fontSize: 11, color: P.muted, margin: '6px 0 0' }}>Maximum disponible : {item.quantity}</p>
        </div>
        <div>
          <label style={lbl}>Notes</label>
          <textarea value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} placeholder="Notes supplémentaires…"
            style={{ ...inp, height: 'auto', resize: 'vertical', padding: '8px 12px' }} />
        </div>
      </form>
    </ModalWrapper>
  );
};

// ─── Catalogue produits (parcourir → ajouter au panier → commander) ───────────

const ProductCatalogView: React.FC<{
  productVariants: ProductVariant[];
  cart: CartLine[];
  onAddToCart: (variantId: number, qty?: number) => void;
  onUpdateCartQty: (variantId: number, qty: number) => void;
  onZoom: (src: string) => void;
  onNewOrder: () => void;
}> = ({ productVariants, cart, onAddToCart, onUpdateCartQty, onZoom, onNewOrder }) => {
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | StockStatus>('all');
  const [posFilter, setPosFilter] = useState<'all' | number>('all');

  // Points de vente réellement présents dans le catalogue (informatif — pas de
  // restriction de nature ici, uniquement pour permettre de filtrer par origine).
  const posOptions = useMemo(() => {
    const map = new Map<number, string>();
    productVariants.forEach(v => { if (v.point_of_sale_details) map.set(v.point_of_sale_details.id, v.point_of_sale_details.name); });
    return Array.from(map.entries());
  }, [productVariants]);

  const filtered = useMemo(() => productVariants.filter(v => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || (v.product?.name || '').toLowerCase().includes(q) || (v.format?.name || '').toLowerCase().includes(q);
    const matchesStock = stockFilter === 'all' || getStockStatus(v) === stockFilter;
    const matchesPos = posFilter === 'all' || v.point_of_sale_details?.id === posFilter || v.point_of_sale === posFilter;
    return matchesSearch && matchesStock && matchesPos;
  }), [productVariants, search, stockFilter, posFilter]);

  const resetFilters = () => { setSearch(''); setStockFilter('all'); setPosFilter('all'); };
  const selectStyle: React.CSSProperties = { ...inp, width: 'auto', height: 36, cursor: 'pointer' };

  return (
    <div style={{ padding: 18 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: P.text, margin: 0 }}>Catalogue produits</h3>
          <p style={{ fontSize: 12, color: P.muted, margin: '3px 0 0' }}>Ajoutez des produits au panier, puis passez commande en un clic.</p>
        </div>
        <BtnSecondary onClick={onNewOrder}><Plus size={14} /> Commande vierge</BtnSecondary>
      </div>

      {productVariants.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
          <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 320 }}>
            <Search size={14} color={P.muted} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
            <input type="text" placeholder="Rechercher un produit…" aria-label="Rechercher un produit" value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ ...inp, height: 36, paddingLeft: 32 }} />
          </div>
          <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value as any)} aria-label="Filtrer par stock" style={selectStyle}>
            <option value="all">Tous les stocks</option>
            <option value="in_stock">En stock</option>
            <option value="low">Stock faible</option>
            <option value="out">Rupture</option>
          </select>
          {posOptions.length > 1 && (
            <select value={posFilter === 'all' ? 'all' : String(posFilter)} onChange={(e) => setPosFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
              aria-label="Filtrer par point de vente" style={selectStyle}>
              <option value="all">Tous les points de vente</option>
              {posOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          )}
        </div>
      )}

      {productVariants.length === 0 ? (
        <EmptyState icon={PackageX} title="Aucun produit disponible" text="Votre catalogue est vide pour le moment. Contactez votre administrateur pour ajouter des produits." />
      ) : filtered.length === 0 ? (
        <EmptyState icon={PackageSearch} title="Aucun résultat" text="Essayez un autre mot-clé ou réinitialisez les filtres."
          action={<BtnSecondary onClick={resetFilters}>Réinitialiser les filtres</BtnSecondary>} />
      ) : (
        <div className="ord-catalog-grid">
          {filtered.map(v => {
            const stockStatus = getStockStatus(v);
            const inCartQty = cart.find(c => c.variantId === v.id)?.quantity || 0;
            const stock = v.current_stock || 0;
            return (
              <div key={v.id}
                style={{ background: '#fff', border: `1.5px solid ${inCartQty > 0 ? P.blue : P.warmL}`, borderRadius: 16, overflow: 'hidden',
                  boxShadow: inCartQty > 0 ? '0 0 0 3px rgba(26,143,209,0.12)' : '0 1px 6px rgba(13,80,140,0.05)' }}>
                <div className="ord-img-wrap" style={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', overflow: 'hidden', background: P.pale, cursor: v.image ? 'zoom-in' : 'default' }}
                  onClick={() => v.image && onZoom(v.image)}>
                  {v.image ? (
                    <img src={v.image} alt={v.product?.name || ''} loading="lazy" className="ord-img-zoom"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Package size={40} color={P.warm} />
                    </div>
                  )}
                  <div style={{ position: 'absolute', top: 8, left: 8 }}><StockBadge status={stockStatus} /></div>
                  {v.image && (
                    <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(13,27,42,0.55)', borderRadius: 8, padding: 5, display: 'flex' }}>
                      <ZoomIn size={13} color="#fff" />
                    </div>
                  )}
                </div>

                <div style={{ padding: 14 }}>
                  <h3 style={{ fontWeight: 700, color: P.text, fontSize: 13, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.product?.name || '—'}</h3>
                  <p style={{ fontSize: 11, color: P.muted, margin: '3px 0 0' }}>{v.format?.name || 'Sans format'}</p>
                  {v.point_of_sale_details?.name && (
                    <div style={{ marginTop: 6 }}><PosBadge name={v.point_of_sale_details.name} small /></div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '10px 0 12px' }}>
                    <span style={{ fontWeight: 800, color: P.text, fontSize: 15 }}>{formatCurrency(v.price)}</span>
                    <span style={{ fontSize: 11, color: P.muted, fontWeight: 600 }}>{stock} en stock</span>
                  </div>

                  {stockStatus === 'out' ? (
                    <div style={{ width: '100%', padding: '9px 0', textAlign: 'center', borderRadius: 10, background: P.surface, color: P.muted, fontSize: 12, fontWeight: 700 }}>
                      Indisponible
                    </div>
                  ) : inCartQty > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <QuantityStepper value={inCartQty} min={0} max={stock} onChange={(v2) => onUpdateCartQty(v.id, v2)} />
                      <span style={{ fontSize: 11, color: P.blueD, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={12} /> Ajouté
                      </span>
                    </div>
                  ) : (
                    <button className="ord-btn" onClick={() => onAddToCart(v.id, 1)}
                      style={{ width: '100%', padding: '9px 0', background: P.blue, color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer',
                        fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' }}>
                      <ShoppingCart size={13} /> Ajouter au panier
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Barre de panier flottante ─────────────────────────────────────────────────

const CartBar: React.FC<{ count: number; total: number; onOpen: () => void; onClear: () => void }> = ({ count, total, onOpen, onClear }) => {
  if (count === 0) return null;
  return (
    <div className="ord-pop" style={{
      position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 20, zIndex: 45,
      display: 'flex', alignItems: 'center', gap: 12, background: P.navy, color: '#fff',
      borderRadius: 9999, padding: '8px 8px 8px 18px', boxShadow: '0 14px 36px rgba(10,21,32,0.4)',
      maxWidth: 'calc(100vw - 32px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
        <ShoppingCart size={16} color={P.blueL} />
        <span style={{ fontSize: 13, fontWeight: 700 }}>{count} article{count > 1 ? 's' : ''}</span>
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>·</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: P.blueL }}>{formatCurrency(total)}</span>
      </div>
      <button onClick={onClear} title="Vider le panier" aria-label="Vider le panier"
        style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 9999, padding: '8px 10px', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', flexShrink: 0, display: 'flex' }}>
        <Trash2 size={14} />
      </button>
      <BtnPrimary onClick={onOpen} style={{ borderRadius: 9999, flexShrink: 0 }}>
        <ShoppingCart size={13} /> Commander
      </BtnPrimary>
    </div>
  );
};

// ─── Tableau des commandes ─────────────────────────────────────────────────────

const OrdersTableView: React.FC<{
  orders: Order[]; userRole?: UserRole;
  onView: (order: Order) => void; onEdit: (order: Order) => void;
  onDelete: (id: number) => void; onNewOrder: () => void;
}> = ({ orders, userRole, onView, onEdit, onDelete, onNewOrder }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortKey, setSortKey] = useState<'date' | 'total'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selected, setSelected] = useState<number[]>([]);
  const [page, setPage] = useState(1);

  const hasAnyFilter = search !== '' || statusFilter !== 'all' || dateFilter !== 'all';

  const filtered = orders
    .filter(o => {
      const q = search.toLowerCase();
      const posNames = getOrderPosList(o).map(p => p.name.toLowerCase()).join(' ');
      const matchSearch = String(o.id).includes(q) || posNames.includes(q);
      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchDate = dateFilter === 'all' || (o.date && ((dateFilter === 'today' && isToday(o.date)) || (dateFilter === 'week' && isThisWeek(o.date)) || (dateFilter === 'month' && isThisMonth(o.date))));
      return matchSearch && matchStatus && matchDate;
    })
    .sort((a, b) => {
      const av = sortKey === 'date' ? new Date(a.date).getTime() : parseFloat(a.total);
      const bv = sortKey === 'date' ? new Date(b.date).getTime() : parseFloat(b.total);
      return sortDir === 'asc' ? av - bv : bv - av;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ORDERS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ORDERS_PER_PAGE, page * ORDERS_PER_PAGE);
  const allSelected = selected.length === filtered.length && filtered.length > 0;
  const toggleSelect = (id: number) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleAll = () => setSelected(allSelected ? [] : filtered.map(o => o.id));

  const resetFilters = () => { setSearch(''); setStatusFilter('all'); setDateFilter('all'); setPage(1); };

  const paginationRange = (current: number, total: number): (number | string)[] => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
    if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  const selectStyle: React.CSSProperties = { ...inp, width: 'auto', height: 36, cursor: 'pointer' };
  const th: React.CSSProperties = { padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: P.muted, whiteSpace: 'nowrap' };

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Barre d'outils */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 340 }}>
          <Search size={14} color={P.muted} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
          <input type="text" placeholder="Rechercher une commande ou un point de vente…" aria-label="Rechercher" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} style={{ ...inp, height: 36, paddingLeft: 32 }} />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} aria-label="Statut" style={selectStyle}>
          <option value="all">Tous les statuts</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setPage(1); }} aria-label="Période" style={selectStyle}>
          <option value="all">Toutes les dates</option>
          <option value="today">Aujourd'hui</option>
          <option value="week">Cette semaine</option>
          <option value="month">Ce mois</option>
        </select>
        <select value={`${sortKey}-${sortDir}`} onChange={(e) => { const [k, d] = e.target.value.split('-'); setSortKey(k as any); setSortDir(d as any); }} aria-label="Tri" style={selectStyle}>
          <option value="date-desc">Plus récentes</option>
          <option value="date-asc">Plus anciennes</option>
          <option value="total-desc">Montant décroissant</option>
          <option value="total-asc">Montant croissant</option>
        </select>
        {hasAnyFilter && <BtnSecondary onClick={resetFilters} style={{ padding: '8px 12px' }}><X size={12} /> Réinitialiser</BtnSecondary>}
        {userRole?.createcommande && (
          <div style={{ marginLeft: 'auto' }}>
            <BtnPrimary onClick={onNewOrder}><Plus size={14} /> Nouvelle commande</BtnPrimary>
          </div>
        )}
      </div>

      {/* Bandeau de sélection */}
      {selected.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', background: P.pale, borderRadius: 10, border: `1px solid ${P.warm}` }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: P.blueD }}>{selected.length} commande(s) sélectionnée(s)</span>
          <button onClick={() => setSelected([])} style={{ background: '#fff', border: `1px solid ${P.warm}`, cursor: 'pointer', fontSize: 12, color: P.mutedD, fontWeight: 700, padding: '4px 10px', borderRadius: 8, fontFamily: 'inherit' }}>Désélectionner</button>
        </div>
      )}

      {/* Tableau */}
      <div style={{ ...card, overflow: 'hidden', boxShadow: 'none' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: P.surface, borderBottom: `1px solid ${P.warmL}` }}>
                <th style={{ padding: '11px 14px', width: 36 }}>
                  <input type="checkbox" aria-label="Tout sélectionner" checked={allSelected} onChange={toggleAll} style={{ cursor: 'pointer', accentColor: P.blue }} />
                </th>
                {['Commande', 'Point(s) de vente', 'Date', 'Statut', 'Priorité', 'Total', 'Actions'].map(h => (
                  <th key={h} style={{ ...th, textAlign: h === 'Total' ? 'right' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={8}>
                  {orders.length === 0 ? (
                    <EmptyState icon={Package} title="Aucune commande pour le moment" text="Créez votre première commande depuis le catalogue ou le bouton ci-dessus." />
                  ) : (
                    <EmptyState icon={PackageSearch} title="Aucune commande ne correspond" text="Essayez d'ajuster votre recherche ou vos filtres."
                      action={hasAnyFilter ? <BtnSecondary onClick={resetFilters}>Réinitialiser les filtres</BtnSecondary> : undefined} />
                  )}
                </td></tr>
              ) : paginated.map(order => {
                const posList = getOrderPosList(order);
                const primaryPos = posList[0];
                const isSel = selected.includes(order.id);
                return (
                  <tr key={order.id} className="ord-row"
                    style={{ borderTop: `1px solid ${P.surface}`, background: isSel ? 'rgba(79,179,232,0.08)' : undefined }}>
                    <td style={{ padding: '11px 14px' }}>
                      <input type="checkbox" aria-label={`Sélectionner CMD-${order.id}`} checked={isSel} onChange={() => toggleSelect(order.id)} style={{ cursor: 'pointer', accentColor: P.blue }} />
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <Pill bg={P.pale} fg={P.blueD}>CMD-{order.id}</Pill>
                      <p style={{ fontSize: 10, color: P.muted, margin: '3px 0 0' }}>{order.items.length} article(s)</p>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <p style={{ fontWeight: 700, color: P.text, display: 'flex', alignItems: 'center', gap: 5, margin: 0 }}>
                        <MapPin size={11} color={P.blue} /> {primaryPos?.name || '—'}
                      </p>
                      {primaryPos?.address && <p style={{ fontSize: 10, color: P.muted, margin: '2px 0 0', maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{primaryPos.address}</p>}
                      {posList.length > 1 && (
                        <span title={posList.slice(1).map(p => p.name).join(', ')}
                          style={{ display: 'inline-block', marginTop: 4, fontSize: 10, fontWeight: 700, color: P.blueD, background: P.pale, borderRadius: 9999, padding: '1px 7px' }}>
                          +{posList.length - 1} autre{posList.length - 1 > 1 ? 's' : ''}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <p style={{ fontWeight: 600, color: P.text, margin: 0 }}>{formatDate(order.date)}</p>
                      <p style={{ fontSize: 10, color: P.muted, margin: '2px 0 0' }}>Livr. {formatDate(order.delivery_date)}</p>
                    </td>
                    <td style={{ padding: '11px 14px' }}><StatusBadge status={order.status} /></td>
                    <td style={{ padding: '11px 14px' }}><PriorityBadge priority={order.priority} /></td>
                    <td style={{ padding: '11px 14px', fontWeight: 800, color: P.blueD, textAlign: 'right', whiteSpace: 'nowrap' }}>{formatCurrency(order.total)}</td>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <ActionBtn onClick={() => onView(order)} title="Détails"><Eye size={14} color={P.blueD} /></ActionBtn>
                        {userRole?.createcommande && <>
                          <ActionBtn onClick={() => onEdit(order)} title="Modifier"><Edit size={14} color={P.blue} /></ActionBtn>
                          <ActionBtn danger onClick={() => onDelete(order.id)} title="Supprimer"><Trash2 size={14} color={P.red} /></ActionBtn>
                        </>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div style={{ padding: '11px 16px', borderTop: `1px solid ${P.warmL}`, background: P.surface, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <span style={{ fontSize: 12, color: P.muted, fontWeight: 600 }}>
              {(page - 1) * ORDERS_PER_PAGE + 1}–{Math.min(page * ORDERS_PER_PAGE, filtered.length)} sur {filtered.length}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <PagBtn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={14} /></PagBtn>
              {paginationRange(page, totalPages).map((p, i) =>
                p === '...'
                  ? <span key={i} style={{ padding: '0 6px', color: P.muted, fontSize: 12, fontWeight: 600 }}>…</span>
                  : <PagBtn key={p} onClick={() => setPage(p as number)} active={page === p}>{p}</PagBtn>
              )}
              <PagBtn onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight size={14} /></PagBtn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Composant principal ───────────────────────────────────────────────────────

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
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // ── Panier (parcourir → ajouter → commander) ──────
  const [cart, setCart] = useState<CartLine[]>([]);

  const addToCart = useCallback((variantId: number, qty: number = 1) => {
    setCart(prev => {
      const idx = prev.findIndex(i => i.variantId === variantId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
        return next;
      }
      return [...prev, { variantId, quantity: qty }];
    });
  }, []);

  const updateCartQty = useCallback((variantId: number, qty: number) => {
    setCart(prev => qty <= 0 ? prev.filter(i => i.variantId !== variantId) : prev.map(i => i.variantId === variantId ? { ...i, quantity: qty } : i));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart.reduce((s, i) => {
    const v = productVariants.find(pv => pv.id === i.variantId);
    return s + (parseFloat(v?.price || '0') * i.quantity);
  }, 0);
  const cartAsOrderItems: NewOrderItem[] = cart.map(i => {
    const v = productVariants.find(pv => pv.id === i.variantId);
    return { product_variant_id: i.variantId, quantity: i.quantity, price: v?.price ?? '0' };
  });

  const userRole = userProfile?.profile?.role;
  const canView = userRole?.vuecommande ?? false;
  const canCreate = userRole?.createcommande ?? false;

  const fetchData = useCallback(async () => {
    const headers = getAuthHeaders();
    if (!headers) { setError('Veuillez vous connecter.'); setLoading(false); return; }
    try {
      setLoading(true); setError(null);
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
      if (ordersRes.status === 'fulfilled' && ordersRes.value?.ok) setOrders(extractList<Order>(await ordersRes.value.json()));
      if (variantsRes.status === 'fulfilled' && variantsRes.value?.ok) setProductVariants(extractList<ProductVariant>(await variantsRes.value.json()));
      if (posRes.status === 'fulfilled' && posRes.value?.ok) {
        try {
          const posData = extractList<PointOfSale>(await posRes.value.json());
          const filtered = posData.filter(isDistributeurSecondaire);
          // Aide au diagnostic si le champ "nature" ne correspond à aucune valeur attendue
          // (nom de champ ou format différent côté API) : on log les valeurs brutes reçues
          // sans bloquer l'affichage.
          if (posData.length > 0 && filtered.length === 0) {
            console.warn('[OrderManagement] Aucun point de vente "distributeur_secondaire" trouvé. Valeurs "nature" reçues :', Array.from(new Set(posData.map(p => p.nature))));
          }
          setPointsOfSale(filtered);
        } catch (e) {
          console.error('[OrderManagement] Échec du traitement des points de vente :', e);
          setPointsOfSale([]);
        }
      } else if (posRes.status === 'rejected') {
        console.error('[OrderManagement] Requête /points-vente/ rejetée :', posRes.reason);
      }
      if (vendorsRes.status === 'fulfilled' && vendorsRes.value?.ok) setMobileVendors(extractList<MobileVendor>(await vendorsRes.value.json()));
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateOrderStatus = async (orderId: number, newStatus: OrderStatus) => {
    const headers = getAuthHeaders();
    if (!headers) return;
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/`, { method: 'PATCH', headers, body: JSON.stringify({ status: newStatus }) });
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
    setDetailsOrder(null); setEditOrder(order);
  };

  const openBlankOrder = () => { setShowAdd(true); };
  const openOrderFromCart = () => { setShowAdd(true); };

  const handleOrderCreated = (order: Order) => {
    setOrders(prev => [order, ...prev]);
    clearCart();
  };

  /* ── Chargement ── */
  if (loading && orders.length === 0 && productVariants.length === 0) return (
    <div className="ord-root" style={{ ...card, padding: 56, textAlign: 'center' }}>
      <GlobalStyles />
      <Loader2 size={32} className="ord-spin" style={{ color: P.blue, margin: '0 auto 12px' }} />
      <p style={{ color: P.textSub, fontWeight: 600, fontSize: 13, margin: 0 }}>Chargement des commandes…</p>
    </div>
  );

  /* ── Accès refusé ── */
  if (!loading && !canView && !canCreate) return (
    <div className="ord-root" style={{ ...card, padding: 48, textAlign: 'center', maxWidth: 440, margin: '24px auto' }}>
      <GlobalStyles />
      <div style={{ width: 56, height: 56, background: '#FEF0ED', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
        <XCircle size={28} color={P.red} />
      </div>
      <h2 style={{ fontSize: 17, fontWeight: 800, color: P.text, margin: '0 0 8px' }}>Accès refusé</h2>
      <p style={{ fontSize: 13, color: P.muted, lineHeight: 1.6, margin: 0 }}>
        Vous n'avez pas les permissions pour accéder à la gestion des commandes. Contactez votre administrateur.
      </p>
      {error && <p style={{ fontSize: 12, color: '#9A2D10', margin: '12px 0 0' }}>{error}</p>}
    </div>
  );

  const showTabs = canView && canCreate;

  // Indicateurs calculés sur les commandes chargées (aucune valeur inventée)
  const activeOrders = orders.filter(o => o.status !== 'cancelled');
  const revenue = activeOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const stalePending = pendingOrders.filter(o => o.date && (Date.now() - new Date(o.date).getTime()) > 7 * 86400000).length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;
  const monthCount = orders.filter(o => o.date && isThisMonth(o.date)).length;
  const kpis = [
    { label: 'Total commandes', value: orders.length, sub: `${monthCount} ce mois-ci`, icon: Package, color: P.blue },
    { label: 'En attente', value: pendingOrders.length, sub: stalePending > 0 ? `${stalePending} depuis plus de 7 jours` : 'Aucune en attente prolongée', icon: Clock, color: P.orange },
    { label: 'Livrées', value: deliveredCount, sub: orders.length ? `${Math.round((deliveredCount / orders.length) * 100)} % des commandes` : undefined, icon: CheckCircle2, color: P.green },
    { label: "Chiffre d'affaires", value: formatCurrency(revenue), sub: 'Hors commandes annulées', icon: Wallet, color: P.purple },
  ];

  return (
    <div className="ord-root" style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: cartCount > 0 ? 80 : 0 }}>
      <GlobalStyles />

      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      {/* Bandeau */}
      <div style={{ background: P.banner, borderRadius: 16, padding: 20, display: 'flex', justifyContent: 'space-between',
        gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ maxWidth: 620 }}>
          <p style={{ color: 'rgba(200,230,248,0.9)', fontSize: 12, fontWeight: 600, margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 7 }}>
            <ShoppingCart size={15} style={{ color: P.blueL }} /> LanfiaLink Connect
          </p>
          <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 800, margin: 0 }}>Gestion des commandes</h2>
          <p style={{ color: 'rgba(200,230,248,0.85)', fontSize: 12, margin: '6px 0 0', lineHeight: 1.5 }}>
            {userProfile?.username
              ? <>Connecté : <strong style={{ color: '#fff' }}>{userProfile.username}</strong>{userRole?.name && <> — {userRole.name}</>}</>
              : 'Suivez les commandes reçues par vos distributeurs et créez-en depuis le catalogue.'}
          </p>
        </div>
        <button className="ord-btn" onClick={fetchData}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, border: 'none',
            background: 'rgba(255,255,255,0.16)', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
          {loading ? <Loader2 size={13} className="ord-spin" /> : <RefreshCw size={13} />} Actualiser
        </button>
      </div>

      {/* Indicateurs */}
      {canView && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
          {kpis.map(k => <Kpi key={k.label} icon={k.icon} label={k.label} value={k.value} sub={k.sub} color={k.color} />)}
        </div>
      )}

      {/* Panneau principal */}
      <div style={{ ...card, overflow: 'hidden' }}>
        {showTabs && (
          <div role="tablist" style={{ display: 'flex', gap: 4, padding: '0 12px', background: P.surface, borderBottom: `1px solid ${P.warmL}`, overflowX: 'auto' }}>
            {[
              { key: 'received', label: 'Commandes reçues', icon: List, badge: orders.length },
              { key: 'create', label: 'Catalogue & panier', icon: ShoppingCart, badge: cartCount || undefined },
            ].map(({ key, label, icon: Icon, badge }) => {
              const isActive = activeTab === key;
              return (
                <button key={key} role="tab" aria-selected={isActive} onClick={() => setActiveTab(key as any)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '13px 14px', fontSize: 12, fontWeight: 700, background: 'none', border: 'none',
                    cursor: 'pointer', borderBottom: `2.5px solid ${isActive ? P.blue : 'transparent'}`, color: isActive ? P.blue : P.muted,
                    marginBottom: -1, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                  <Icon size={14} />{label}
                  {badge !== undefined && (
                    <span style={{ padding: '1px 8px', borderRadius: 9999, fontSize: 10, fontWeight: 700, background: isActive ? P.blue : '#fff', color: isActive ? '#fff' : P.muted }}>
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {(canView && (!showTabs || activeTab === 'received')) && (
          <OrdersTableView orders={orders} userRole={userRole} onView={setDetailsOrder} onEdit={handleEdit} onDelete={handleDelete} onNewOrder={openBlankOrder} />
        )}
        {(canCreate && (!showTabs || activeTab === 'create')) && (
          <ProductCatalogView productVariants={productVariants} cart={cart} onAddToCart={addToCart} onUpdateCartQty={updateCartQty} onZoom={setZoomImage} onNewOrder={openBlankOrder} />
        )}
      </div>

      {/* Panier flottant */}
      <CartBar count={cartCount} total={cartTotal} onOpen={openOrderFromCart} onClear={clearCart} />

      {/* Modales */}
      {showAdd && (
        <AddOrderModal
          onClose={() => setShowAdd(false)}
          onCreated={handleOrderCreated}
          productVariants={productVariants}
          pointsOfSale={pointsOfSale}
          initialItems={cartAsOrderItems}
          onZoom={setZoomImage}
        />
      )}
      {detailsOrder && <OrderDetailsModal order={detailsOrder} canEdit={canCreate} onClose={() => setDetailsOrder(null)} onEdit={handleEdit} onDelete={handleDelete} onStatusChange={updateOrderStatus} onAssign={(order, item) => { setAssignData({ order, item }); setDetailsOrder(null); }} onZoom={setZoomImage} />}
      {editOrder && <EditOrderModal order={editOrder} onClose={() => setEditOrder(null)} onUpdated={updated => { setOrders(prev => prev.map(o => o.id === updated.id ? updated : o)); setEditOrder(null); }} productVariants={productVariants} onZoom={setZoomImage} />}
      {assignData && <AssignVendorModal order={assignData.order} item={assignData.item} vendors={mobileVendors} onClose={() => setAssignData(null)} />}
      {zoomImage && <ImageZoomModal src={zoomImage} onClose={() => setZoomImage(null)} />}
    </div>
  );
};

export default OrderManagement;