"use client";
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Package, Plus, Search, Edit, Trash2,
  AlertTriangle, TrendingUp, TrendingDown,
  Upload, RefreshCw, X, BarChart3, Clock,
  Save, Wallet, Image as ImageIcon,
  CheckCircle, Tag, FolderOpen, Box, Database, AlertCircle,
  ChevronDown, Loader2,
} from 'lucide-react';
import { apiService } from './ApiService';

/* ─── Palette (identique aux vues Financement / Paiements) ─── */
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

/* ─── Types ─────────────────────────────────────────────── */
interface Product {
  id: string;
  name: string;
  category: { id: number; name: string };
  sku: string;
  supplier: { id: number; name: string };
  point_of_sale: { id: string; name: string };
  description?: string;
  main_image?: string;
  status: 'en_stock' | 'stock_faible' | 'rupture' | 'surstockage';
  last_updated: string;
  created_at: string;
}

interface ProductVariant {
  id: string;
  product_id: string;
  product: { id: string; name: string };
  format: { id: number; name: string; description?: string };
  current_stock: number;
  min_stock: number;
  max_stock: number;
  price: number;
  barcode: string;
  image?: string | File;
}

interface ProductFormat { id: number; name: string; description?: string }

interface Category {
  id: number; name: string; description: string;
  image: string | null; created_at?: string; updated_at?: string;
}

interface StockMovement {
  id: string;
  product: { id: string; name: string };
  product_variant?: { id: string; name: string };
  type: 'entree' | 'sortie' | 'ajustement';
  quantity: number;
  date: string;
  reason: string;
  user: { username: string };
}

interface NewProduct {
  name: string; category_id: number | ''; sku: string;
  supplier_id: number | ''; point_of_sale_id: string;
  description: string; status: 'en_stock' | 'stock_faible' | 'rupture' | 'surstockage';
  main_image?: File;
}

interface NewVariant {
  product_id: string; format_id: number | ''; current_stock: number;
  min_stock: number; max_stock: number; price: number; barcode: string; image?: File;
}

interface NewFormat { name: string; description: string }

interface NewMovement {
  product_variant_id: string | ''; type: 'entree' | 'sortie' | 'ajustement' | '';
  quantity: number; reason: string;
}

interface Supplier { id: number; name: string }

/* Nature du point de vente : seuls les distributeurs sont utilisables
   comme point de vente rattaché à un produit. */
type PointOfSaleNature = 'distributeur_principal' | 'distributeur_secondaire' | string;
interface PointOfSale { id: string; name: string; nature?: PointOfSaleNature }

interface OverviewData {
  total_products: number; stock_value: number;
  alert_count: number; today_movements: number; critical_products: Product[];
}

interface Toast { message: string; type: 'success' | 'error' }

/* ─── Helpers de présentation ───────────────────────────── */
const money = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(Math.round(v || 0));
const compact = (v: number) => {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1).replace('.', ',')} Md`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1).replace('.', ',')} M`;
  if (v >= 1e3) return `${Math.round(v / 1e3)} k`;
  return String(Math.round(v));
};

const PRODUCT_STATUS: Record<string, { label: string; bg: string; fg: string; dot: string }> = {
  en_stock:     { label: 'En stock',     bg: '#DCF5EC', fg: '#044D38', dot: P.green },
  stock_faible: { label: 'Stock faible', bg: '#FBEFD6', fg: '#7A4F00', dot: P.orange },
  rupture:      { label: 'Rupture',      bg: '#FCE4DC', fg: '#7A2410', dot: P.red },
  surstockage:  { label: 'Surstockage',  bg: '#DDEBFA', fg: '#0A4A80', dot: P.blue },
};
const statusInfo = (s: string) => PRODUCT_STATUS[s] ?? { label: s, bg: P.surface, fg: P.muted, dot: P.gray };

const natureLabel = (n?: PointOfSaleNature) => ({
  distributeur_principal: 'Distributeur principal',
  distributeur_secondaire: 'Distributeur secondaire',
}[n as string] ?? n ?? '');

const MOVEMENT: Record<string, { label: string; sign: string; color: string; bg: string; fg: string }> = {
  entree:     { label: 'Entrée',     sign: '+', color: P.green, bg: '#DCF5EC', fg: '#044D38' },
  sortie:     { label: 'Sortie',     sign: '−', color: P.red,   bg: '#FCE4DC', fg: '#7A2410' },
  ajustement: { label: 'Ajustement', sign: '±', color: P.blue,  bg: '#DDEBFA', fg: '#0A4A80' },
};
const movInfo = (t: string) => MOVEMENT[t] ?? { label: t, sign: '', color: P.muted, bg: P.surface, fg: P.muted };

/* État d'une variante selon ses seuils */
const variantState = (v: ProductVariant): keyof typeof PRODUCT_STATUS => {
  if (v.current_stock <= 0) return 'rupture';
  if (v.current_stock <= v.min_stock) return 'stock_faible';
  if (v.max_stock > 0 && v.current_stock >= v.max_stock) return 'surstockage';
  return 'en_stock';
};

/* ─── Styles partagés ───────────────────────────────────── */
const inp: React.CSSProperties = {
  width: '100%', padding: '8px 12px', height: 38,
  border: `1.5px solid ${P.warm}`, borderRadius: 10, fontSize: 13, outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit', color: P.text, background: '#fff',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

const lbl: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700, color: P.mutedD, marginBottom: 5,
};

const GLOBAL_CSS = `
  @keyframes stkSpin { to { transform: rotate(360deg); } }
  @keyframes stkToast { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
  .stk-root input:not([type=checkbox]):not([type=file]):focus,
  .stk-root select:focus,
  .stk-root textarea:focus { border-color: #1A8FD1 !important; box-shadow: 0 0 0 3px rgba(26,143,209,0.15); }
  .stk-row { transition: background 0.12s; }
  .stk-row:hover { background: #EDF5FA; }
  .stk-btn { transition: opacity 0.15s, transform 0.1s; }
  .stk-btn:active:not(:disabled) { transform: scale(0.98); }
  .stk-spin { animation: stkSpin 0.8s linear infinite; }
  @media (prefers-reduced-motion: reduce) { .stk-spin { animation-duration: 2s; } }
`;

/* ─── Petits composants ─────────────────────────────────── */
const Pill = ({ bg, fg, dot, children }: { bg: string; fg: string; dot?: string; children: React.ReactNode }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 9999,
    fontSize: 11, fontWeight: 700, background: bg, color: fg, whiteSpace: 'nowrap' }}>
    {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot }} />}{children}
  </span>
);

const StatusPill = ({ status }: { status: string }) => {
  const s = statusInfo(status);
  return <Pill bg={s.bg} fg={s.fg} dot={s.dot}>{s.label}</Pill>;
};

const Kpi = ({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string | number; sub?: string; color: string;
}) => (
  <div style={{ ...card, padding: 16, display: 'flex', justifyContent: 'space-between', gap: 10 }}>
    <div style={{ minWidth: 0 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: P.muted, margin: 0 }}>{label}</p>
      <p style={{ fontSize: 24, fontWeight: 800, color: P.text, margin: '6px 0 0', fontVariantNumeric: 'tabular-nums' }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: P.muted, margin: '3px 0 0' }}>{sub}</p>}
    </div>
    <div style={{ width: 40, height: 40, borderRadius: 11, background: `${color}1A`, display: 'flex',
      alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={18} style={{ color }} />
    </div>
  </div>
);

const CardTitle = ({ icon: Icon, label, right }: { icon: any; label: string; right?: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
    paddingBottom: 12, marginBottom: 12, borderBottom: `1px solid ${P.warmL}` }}>
    <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: P.text }}>
      <Icon size={14} style={{ color: P.blue }} /> {label}
    </span>
    {right}
  </div>
);

/* ─── Boutons ───────────────────────────────────────────── */
const PrimaryBtn = ({ onClick, children, disabled, small }: {
  onClick?: () => void; children: React.ReactNode; disabled?: boolean; small?: boolean;
}) => (
  <button className="stk-btn" onClick={onClick} disabled={disabled}
    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: small ? '6px 11px' : '9px 15px',
      borderRadius: 10, background: P.blue, color: '#fff', fontSize: small ? 11 : 12, fontWeight: 700,
      border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
      opacity: disabled ? 0.6 : 1 }}>
    {children}
  </button>
);

const SecondaryBtn = ({ onClick, children, disabled, small }: {
  onClick?: () => void; children: React.ReactNode; disabled?: boolean; small?: boolean;
}) => (
  <button className="stk-btn" type="button" onClick={onClick} disabled={disabled}
    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: small ? '6px 11px' : '9px 15px',
      borderRadius: 10, border: `1.5px solid ${P.warm}`, background: '#fff', color: P.mutedD,
      fontSize: small ? 11 : 12, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'inherit', opacity: disabled ? 0.6 : 1 }}>
    {children}
  </button>
);

const ActionBtn = ({ onClick, title, danger, children }: {
  onClick: () => void; title?: string; danger?: boolean; children: React.ReactNode;
}) => (
  <button className="stk-btn" onClick={onClick} title={title} aria-label={title}
    style={{ padding: 7, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer',
      color: danger ? P.red : P.blueD, display: 'flex' }}
    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = danger ? '#FEF0ED' : P.pale; }}
    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
    {children}
  </button>
);

/* Pied de formulaire : Annuler + Enregistrer */
const modalFooter = (onCancel: () => void, submitLabel: string, submitting = false) => (
  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 14, marginTop: 4,
    borderTop: `1px solid ${P.warmL}` }}>
    <SecondaryBtn onClick={onCancel} disabled={submitting}>Annuler</SecondaryBtn>
    <button type="submit" disabled={submitting} className="stk-btn"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10,
        background: P.blue, color: '#fff', fontSize: 12, fontWeight: 700, border: 'none',
        cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: submitting ? 0.75 : 1 }}>
      {submitting ? <Loader2 size={13} className="stk-spin" /> : <Save size={13} />}
      {submitting ? 'Enregistrement…' : submitLabel}
    </button>
  </div>
);

/* ─── Modal ──────────────────────────────────────────────── */
const Modal = ({
  isOpen, onClose, title, subtitle, icon: Icon, error, children,
}: {
  isOpen: boolean; onClose: () => void; title: string; subtitle?: string;
  icon?: any; error?: string | null; children: React.ReactNode;
}) => {
  /* Fermer avec la touche Échap */
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label={title}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(10,21,32,0.55)', backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 760, maxHeight: '92vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(10,21,32,0.25)' }}>
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
          <button onClick={onClose} title="Fermer (Échap)" aria-label="Fermer"
            style={{ padding: 7, background: 'rgba(255,255,255,0.16)', border: 'none', borderRadius: 9,
              cursor: 'pointer', color: '#fff', display: 'flex' }}>
            <X size={15} />
          </button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: 20 }}>
          {error && (
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
              background: '#FEF0ED', border: '1px solid #F5C4B3', borderRadius: 10, fontSize: 13, color: '#9A2D10' }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span style={{ fontWeight: 600 }}>{error}</span>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

/* ─── ImageUploadField ───────────────────────────────────── */
const ImageUploadField = ({
  value, onChange, onClear,
}: { value?: File | string | null; onChange: (f: File) => void; onClear: () => void }) => {
  /* Aperçu : on crée l'URL une seule fois par fichier et on la libère ensuite */
  const preview = useMemo(
    () => (value instanceof File ? URL.createObjectURL(value) : value || null),
    [value]
  );
  useEffect(() => () => { if (value instanceof File && preview) URL.revokeObjectURL(preview); }, [value, preview]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <label style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: 88, border: `2px dashed ${P.warm}`, borderRadius: 12,
        cursor: 'pointer', background: P.pale, transition: 'border-color 0.15s, background 0.15s' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = P.blue; (e.currentTarget as HTMLElement).style.background = '#fff'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = P.warm; (e.currentTarget as HTMLElement).style.background = P.pale; }}>
        <Upload size={18} color={P.muted} />
        <span style={{ fontSize: 12, color: P.textSub, marginTop: 6, fontWeight: 600 }}>Cliquez pour téléverser</span>
        <span style={{ fontSize: 10, color: P.muted }}>PNG, JPG – max 5 Mo</span>
        <input type="file" accept="image/*" style={{ display: 'none' }}
          onChange={(e) => e.target.files?.[0] && onChange(e.target.files[0])} />
      </label>
      {preview && (
        <div style={{ position: 'relative', width: 64, height: 64, borderRadius: 12, overflow: 'visible',
          border: `1px solid ${P.warm}`, flexShrink: 0 }}>
          <img src={preview} alt="Aperçu" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 11 }} />
          <button type="button" onClick={onClear} aria-label="Retirer l'image"
            style={{ position: 'absolute', top: -6, right: -6, background: P.red, border: '2px solid #fff',
              borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', padding: 0 }}>
            <X size={10} color="#fff" />
          </button>
        </div>
      )}
    </div>
  );
};

/* ─── SearchableSelect ───────────────────────────────────────
   Combobox avec recherche pour les listes qui peuvent devenir longues.
   `value` / `id` sont toujours des chaînes ; l'appelant convertit en nombre. */
interface SearchableOption { id: string; label: string; sublabel?: string }

const SearchableSelect = ({
  options, value, onChange, placeholder = 'Sélectionner…', required, emptyMessage = 'Aucun résultat',
}: {
  options: SearchableOption[]; value: string; onChange: (id: string) => void;
  placeholder?: string; required?: boolean; emptyMessage?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.id === value);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) { setOpen(false); setQuery(''); }
    };
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); setQuery(''); } };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q) || (o.sublabel ?? '').toLowerCase().includes(q));
  }, [options, query]);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open}
        style={{ ...inp, textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 8, cursor: 'pointer', color: selected ? P.text : P.muted,
          borderColor: open ? P.blue : P.warm }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={14} color={P.muted}
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }} />
      </button>

      {/* Champ invisible pour conserver la validation HTML5 "required" */}
      {required && (
        <input tabIndex={-1} aria-hidden value={value} required onChange={() => {}}
          style={{ position: 'absolute', bottom: 0, opacity: 0, height: 1, width: '100%', pointerEvents: 'none' }} />
      )}

      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 30, background: '#fff',
          border: `1px solid ${P.warm}`, borderRadius: 12, boxShadow: '0 14px 34px rgba(10,21,32,0.18)', overflow: 'hidden' }}>
          <div style={{ padding: 8, borderBottom: `1px solid ${P.surface}` }}>
            <div style={{ position: 'relative' }}>
              <Search size={12} color={P.muted} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)' }} />
              {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
              <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher…"
                style={{ ...inp, height: 32, padding: '6px 10px 6px 28px', fontSize: 12 }} />
            </div>
          </div>
          <div role="listbox" style={{ maxHeight: 220, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '16px 12px', fontSize: 12, color: P.muted, textAlign: 'center' }}>{emptyMessage}</div>
            ) : filtered.map((o) => (
              <div key={o.id} role="option" aria-selected={o.id === value}
                onClick={() => { onChange(o.id); setOpen(false); setQuery(''); }}
                className="stk-row"
                style={{ padding: '9px 12px', cursor: 'pointer', fontSize: 13,
                  background: o.id === value ? P.pale : undefined,
                  borderLeft: `3px solid ${o.id === value ? P.blue : 'transparent'}` }}>
                <p style={{ margin: 0, fontWeight: 600, color: P.text }}>{o.label}</p>
                {o.sublabel && <p style={{ margin: 0, fontSize: 10, color: P.muted }}>{o.sublabel}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Vignette d'image ───────────────────────────────────── */
const Thumb = ({ src, alt, size = 40 }: { src?: string | null; alt: string; size?: number }) => (
  src
    ? <img src={src} alt={alt} loading="lazy"
        style={{ width: size, height: size, borderRadius: 10, objectFit: 'cover', border: `1px solid ${P.warmL}`, flexShrink: 0, background: P.surface }} />
    : <div style={{ width: size, height: size, borderRadius: 10, background: P.pale, border: `1px dashed ${P.warm}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <ImageIcon size={Math.round(size * 0.42)} color={P.gray} />
      </div>
);

/* ─── FormRow / Field ────────────────────────────────────── */
const FormRow = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>{children}</div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div><label style={lbl}>{label}</label>{children}</div>
);

/* ─── Onglets soulignés ──────────────────────────────────── */
const Tabs = ({ tabs, active, onChange }: {
  tabs: { id: string; label: string; icon: any; count?: number }[];
  active: string; onChange: (id: string) => void;
}) => (
  <div role="tablist" style={{ display: 'flex', gap: 4, overflowX: 'auto' }}>
    {tabs.map((t) => {
      const on = active === t.id;
      return (
        <button key={t.id} role="tab" aria-selected={on} onClick={() => onChange(t.id)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '13px 14px', fontSize: 12,
            fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            whiteSpace: 'nowrap', color: on ? P.blue : P.muted,
            borderBottom: `2.5px solid ${on ? P.blue : 'transparent'}`, marginBottom: -1 }}>
          <t.icon size={13} />{t.label}
          {t.count !== undefined && (
            <span style={{ background: on ? P.blue : P.surface, color: on ? '#fff' : P.muted, borderRadius: 9999,
              padding: '1px 8px', fontSize: 10 }}>{t.count}</span>
          )}
        </button>
      );
    })}
  </div>
);

/* ─── Tableaux ───────────────────────────────────────────── */
const TableWrapper = ({ children }: { children: React.ReactNode }) => (
  <div style={{ ...card, overflow: 'hidden' }}>
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>{children}</table>
    </div>
  </div>
);

const Th = ({ children }: { children?: React.ReactNode }) => (
  <th style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: P.muted,
    background: P.surface, borderBottom: `1px solid ${P.warmL}`, whiteSpace: 'nowrap' }}>
    {children}
  </th>
);

const Td = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <td style={{ padding: '11px 14px', color: P.text, borderTop: `1px solid ${P.surface}`, verticalAlign: 'middle', ...style }}>
    {children}
  </td>
);

const EmptyBlock = ({ icon, title, text, action }: {
  icon: React.ReactNode; title: string; text: string; action?: React.ReactNode;
}) => (
  <div style={{ padding: '44px 24px', textAlign: 'center' }}>
    <div style={{ width: 52, height: 52, background: P.pale, borderRadius: '50%', display: 'flex',
      alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>{icon}</div>
    <p style={{ fontWeight: 700, color: P.text, margin: '0 0 4px', fontSize: 14 }}>{title}</p>
    <p style={{ fontSize: 12, color: P.muted, margin: 0 }}>{text}</p>
    {action && <div style={{ marginTop: 16 }}>{action}</div>}
  </div>
);

const EmptyRow = ({ cols, icon, msg, sub }: { cols: number; icon: React.ReactNode; msg: string; sub: string }) => (
  <tr><td colSpan={cols}><EmptyBlock icon={icon} title={msg} text={sub} /></td></tr>
);

/* ════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
════════════════════════════════════════════════════════════ */
const StockManagement = () => {
  const [activeView, setActiveView] = useState<'overview' | 'products' | 'movements' | 'analytics'>('overview');
  const [activeProductTab, setActiveProductTab] = useState<'list' | 'variants' | 'formats' | 'categories'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [showAddModal,         setShowAddModal]         = useState(false);
  const [showEditModal,        setShowEditModal]        = useState(false);
  const [showMovementModal,    setShowMovementModal]    = useState(false);
  const [showAddVariantModal,  setShowAddVariantModal]  = useState(false);
  const [showEditVariantModal, setShowEditVariantModal] = useState(false);
  const [showAddFormatModal,   setShowAddFormatModal]   = useState(false);
  const [showCategoryModal,    setShowCategoryModal]    = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  const [products,      setProducts]      = useState<Product[]>([]);
  const [variants,      setVariants]      = useState<ProductVariant[]>([]);
  const [formats,       setFormats]       = useState<ProductFormat[]>([]);
  const [categories,    setCategories]    = useState<Category[]>([]);
  const [movements,     setMovements]     = useState<StockMovement[]>([]);
  const [suppliers,     setSuppliers]     = useState<Supplier[]>([]);
  const [pointsOfSale,  setPointsOfSale]  = useState<PointOfSale[]>([]);
  const [overviewData,  setOverviewData]  = useState<OverviewData>({
    total_products: 0, stock_value: 0, alert_count: 0, today_movements: 0, critical_products: [],
  });

  const [newProduct,  setNewProduct]  = useState<NewProduct>({ name: '', category_id: '', sku: '', supplier_id: '', point_of_sale_id: '', description: '', status: 'en_stock' });
  const [newVariant,  setNewVariant]  = useState<NewVariant>({ product_id: '', format_id: '', current_stock: 0, min_stock: 0, max_stock: 0, price: 0, barcode: '' });
  const [newFormat,   setNewFormat]   = useState<NewFormat>({ name: '', description: '' });
  const [newCategory, setNewCategory] = useState({ name: '', description: '', image: null as File | null });
  const [newMovement, setNewMovement] = useState<NewMovement>({ product_variant_id: '', type: '', quantity: 0, reason: '' });

  const [error,        setError]        = useState<string | null>(null);
  const [isLoading,    setIsLoading]    = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast,        setToast]        = useState<Toast | null>(null);

  /* Toast auto-dismiss après 3 s */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  /* ── fetch ── */
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true); setError(null);
      const [ovR, prR, vaR, foR, moR, caR, suR, poR] = await Promise.all([
        apiService.get('/stock-overview/'), apiService.get('/products/'),
        apiService.get('/product-variants/'), apiService.get('/products-formats/'),
        apiService.get('/stock-movements/'), apiService.get('/categories/'),
        apiService.get('/suppliers/'), apiService.get('/points-vente/'),
      ]);
      const [ov, pr, va, fo, mo, ca, su, po] = await Promise.all([
        ovR.json(), prR.json(), vaR.json(), foR.json(), moR.json(), caR.json(), suR.json(), poR.json(),
      ]);
      setOverviewData({
        total_products:  ov.cumulative?.total_products  ?? 0,
        stock_value:     ov.cumulative?.stock_value     ?? 0,
        alert_count:     ov.cumulative?.alert_count     ?? 0,
        today_movements: ov.cumulative?.today_movements ?? 0,
        critical_products: ov.cumulative?.critical_products ?? [],
      });
      setProducts(pr); setVariants(va); setFormats(fo);
      setMovements(mo); setCategories(ca); setSuppliers(su); setPointsOfSale(po);
    } catch (e: any) { setError(e.message ?? 'Erreur lors du chargement'); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── points de vente utilisables : uniquement les distributeurs ── */
  const distributeurs = useMemo(() => pointsOfSale.filter((p) =>
    p.nature === 'distributeur_principal' || p.nature === 'distributeur_secondaire'
  ), [pointsOfSale]);

  /* En édition, si le point de vente déjà assigné n'est plus dans la liste filtrée,
     on l'ajoute en tête pour ne pas perdre la sélection existante. */
  const editDistributeurs = useMemo(() => {
    if (!selectedProduct?.point_of_sale?.id) return distributeurs;
    const alreadyThere = distributeurs.some((p) => p.id === selectedProduct.point_of_sale.id);
    if (alreadyThere) return distributeurs;
    const current = pointsOfSale.find((p) => p.id === selectedProduct.point_of_sale.id);
    return current ? [current, ...distributeurs] : distributeurs;
  }, [distributeurs, pointsOfSale, selectedProduct]);

  /* ── filtered ── */
  const filteredProducts = useMemo(() => products.filter((p) => {
    const q = searchTerm.toLowerCase();
    return (p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q))
      && (selectedCategory === 'all' || p.category?.name === selectedCategory);
  }), [products, searchTerm, selectedCategory]);

  const filteredVariants = useMemo(() => variants.filter((v) => {
    const q = searchTerm.toLowerCase();
    return v.format?.name?.toLowerCase().includes(q)
      || v.barcode?.toLowerCase().includes(q)
      || products.find((p) => p.id === v.product_id)?.name.toLowerCase().includes(q);
  }), [variants, products, searchTerm]);

  const filteredFormats = useMemo(() => formats.filter((f) =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
    || f.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ), [formats, searchTerm]);

  const filteredCategories = useMemo(() => categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
    || c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ), [categories, searchTerm]);

  /* ── répartition des produits par statut (calculée sur les données chargées) ── */
  const statusCounts = useMemo(() => {
    const c: Record<string, number> = { en_stock: 0, stock_faible: 0, rupture: 0, surstockage: 0 };
    products.forEach((p) => { if (p.status in c) c[p.status]++; });
    return c;
  }, [products]);

  /* ── handlers (logique inchangée) ── */
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    try {
      setError(null); setIsSubmitting(true);
      const fd = new FormData();
      Object.entries(newProduct).forEach(([k, v]) => {
        if (k === 'main_image' && v instanceof File) fd.append(k, v);
        else if (k !== 'main_image') fd.append(k, String(v));
      });
      const res = await apiService.post('/products/', fd, true);
      const created = await res.json();
      setProducts((p) => [...p, created]);
      setNewProduct({ name: '', category_id: '', sku: '', supplier_id: '', point_of_sale_id: '', description: '', status: 'en_stock' });
      setShowAddModal(false); fetchData();
      setToast({ message: 'Produit créé avec succès', type: 'success' });
    } catch (e: any) { setError(e.message ?? 'Erreur ajout produit'); }
    finally { setIsSubmitting(false); }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selectedProduct || isSubmitting) return;
    try {
      setError(null); setIsSubmitting(true);
      const fd = new FormData();
      fd.append('name', selectedProduct.name);
      fd.append('category_id', String(selectedProduct.category.id));
      fd.append('sku', selectedProduct.sku);
      fd.append('supplier_id', String(selectedProduct.supplier.id));
      fd.append('point_of_sale_id', selectedProduct.point_of_sale.id);
      fd.append('description', selectedProduct.description ?? '');
      fd.append('status', selectedProduct.status);
      const res = await apiService.put(`/products/${selectedProduct.id}/`, fd, true);
      const updated = await res.json();
      setProducts((p) => p.map((x) => x.id === updated.id ? updated : x));
      setShowEditModal(false); setSelectedProduct(null); fetchData();
      setToast({ message: 'Produit mis à jour', type: 'success' });
    } catch (e: any) { setError(e.message ?? 'Erreur mise à jour produit'); }
    finally { setIsSubmitting(false); }
  };

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault(); if (isSubmitting) return;
    try {
      setError(null); setIsSubmitting(true);
      const fd = new FormData();
      Object.entries(newVariant).forEach(([k, v]) => {
        if (k === 'image' && v instanceof File) fd.append(k, v);
        else if (k !== 'image') fd.append(k, String(v));
      });
      const res = await apiService.post('/product-variants/', fd, true);
      const created = await res.json();
      setVariants((v) => [...v, created]);
      setNewVariant({ product_id: '', format_id: '', current_stock: 0, min_stock: 0, max_stock: 0, price: 0, barcode: '' });
      setShowAddVariantModal(false); fetchData();
      setToast({ message: 'Variante ajoutée avec succès', type: 'success' });
    } catch (e: any) { setError(e.message ?? 'Erreur ajout variante'); }
    finally { setIsSubmitting(false); }
  };

  const handleUpdateVariant = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selectedVariant || isSubmitting) return;
    try {
      setError(null); setIsSubmitting(true);
      const fd = new FormData();
      fd.append('product_id', selectedVariant.product_id);
      fd.append('format_id', String(selectedVariant.format.id));
      fd.append('current_stock', String(selectedVariant.current_stock));
      fd.append('min_stock', String(selectedVariant.min_stock));
      fd.append('max_stock', String(selectedVariant.max_stock));
      fd.append('price', String(selectedVariant.price));
      fd.append('barcode', selectedVariant.barcode);
      if (selectedVariant.image instanceof File) fd.append('image', selectedVariant.image);
      const res = await apiService.put(`/product-variants/${selectedVariant.id}/`, fd, true);
      const updated = await res.json();
      setVariants((v) => v.map((x) => x.id === updated.id ? updated : x));
      setShowEditVariantModal(false); setSelectedVariant(null); fetchData();
      setToast({ message: 'Variante mise à jour', type: 'success' });
    } catch (e: any) { setError(e.message ?? 'Erreur mise à jour variante'); }
    finally { setIsSubmitting(false); }
  };

  const handleAddFormat = async (e: React.FormEvent) => {
    e.preventDefault(); if (isSubmitting) return;
    try {
      setError(null); setIsSubmitting(true);
      const res = await apiService.post('/products-formats/', newFormat);
      const created = await res.json();
      setFormats((f) => [...f, created]);
      setNewFormat({ name: '', description: '' });
      setShowAddFormatModal(false); fetchData();
      setToast({ message: 'Format ajouté avec succès', type: 'success' });
    } catch (e: any) { setError(e.message ?? 'Erreur ajout format'); }
    finally { setIsSubmitting(false); }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault(); if (isSubmitting) return;
    try {
      setError(null); setIsSubmitting(true);
      const fd = new FormData();
      fd.append('name', newCategory.name);
      fd.append('description', newCategory.description);
      if (newCategory.image) fd.append('image', newCategory.image);
      const res = await apiService.post('/categories/', fd, true);
      const created = await res.json();
      setCategories((c) => [...c, created]);
      setNewCategory({ name: '', description: '', image: null });
      setShowCategoryModal(false);
      setToast({ message: 'Catégorie ajoutée avec succès', type: 'success' });
    } catch (e: any) { setError(e.message ?? 'Erreur ajout catégorie'); }
    finally { setIsSubmitting(false); }
  };

  const handleAddMovement = async (e: React.FormEvent) => {
    e.preventDefault(); if (isSubmitting) return;
    try {
      setError(null); setIsSubmitting(true);
      if (!newMovement.product_variant_id) throw new Error('Veuillez sélectionner une variante');
      if (!newMovement.type)               throw new Error('Veuillez sélectionner un type');
      if (newMovement.quantity <= 0)       throw new Error('La quantité doit être > 0');
      if (!newMovement.reason.trim())      throw new Error('Veuillez spécifier une raison');
      const res = await apiService.post('/stock-movements/', newMovement);
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail ?? 'Erreur'); }
      const created = await res.json();
      setMovements((m) => [created, ...m]);
      setNewMovement({ product_variant_id: '', type: '', quantity: 0, reason: '' });
      setShowMovementModal(false); fetchData();
      setToast({ message: 'Mouvement enregistré avec succès', type: 'success' });
    } catch (e: any) { setError(e.message ?? 'Erreur ajout mouvement'); }
    finally { setIsSubmitting(false); }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Supprimer ce produit ?')) return;
    try {
      await apiService.delete(`/products/${id}/`); setProducts((p) => p.filter((x) => x.id !== id)); fetchData();
      setToast({ message: 'Produit supprimé', type: 'success' });
    } catch (e: any) { setError(e.message); setToast({ message: 'Échec de la suppression du produit', type: 'error' }); }
  };
  const handleDeleteVariant = async (id: string) => {
    if (!window.confirm('Supprimer cette variante ?')) return;
    try {
      await apiService.delete(`/product-variants/${id}/`); setVariants((v) => v.filter((x) => x.id !== id)); fetchData();
      setToast({ message: 'Variante supprimée', type: 'success' });
    } catch (e: any) { setError(e.message); setToast({ message: 'Échec de la suppression de la variante', type: 'error' }); }
  };
  const handleDeleteFormat = async (id: number) => {
    if (!window.confirm('Supprimer ce format ?')) return;
    try {
      await apiService.delete(`/products-formats/${id}/`); setFormats((f) => f.filter((x) => x.id !== id)); fetchData();
      setToast({ message: 'Format supprimé', type: 'success' });
    } catch (e: any) { setError(e.message); setToast({ message: 'Échec de la suppression du format', type: 'error' }); }
  };
  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('Supprimer cette catégorie ?')) return;
    try {
      await apiService.delete(`/categories/${id}/`); setCategories((c) => c.filter((x) => x.id !== id));
      setToast({ message: 'Catégorie supprimée', type: 'success' });
    } catch (e: any) { setError(e.message); setToast({ message: 'Échec de la suppression de la catégorie', type: 'error' }); }
  };

  /* ─── Indicateurs (sous-titres calculés, sans valeurs inventées) ─── */
  const kpis = [
    { label: 'Total produits',  value: overviewData.total_products, sub: `${variants.length} variante(s)`, icon: Package, color: P.blue },
    { label: 'Valeur du stock', value: `${compact(overviewData.stock_value)} XOF`, sub: 'Toutes variantes confondues', icon: Wallet, color: P.green },
    { label: 'Alertes stock',   value: overviewData.alert_count, sub: `${statusCounts.rupture} produit(s) en rupture`, icon: AlertTriangle, color: P.orange },
    { label: 'Mouvements du jour', value: overviewData.today_movements, sub: `${movements.length} mouvement(s) au total`, icon: RefreshCw, color: P.purple },
  ];

  /* ─── Vue d'ensemble ───────────────────────────────────── */
  const renderOverview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
        {kpis.map((k) => <Kpi key={k.label} icon={k.icon} label={k.label} value={k.value} sub={k.sub} color={k.color} />)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
        {/* Alertes critiques */}
        <div style={{ ...card, padding: 16 }}>
          <CardTitle icon={AlertTriangle} label="Produits en alerte"
            right={<Pill bg="#FBEFD6" fg="#7A4F00">{overviewData.alert_count} alerte(s)</Pill>} />
          {overviewData.critical_products.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {overviewData.critical_products.map((p, i) => (
                <div key={`${p.id}-${i}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                  padding: '10px 12px', background: '#FDF6E7', borderLeft: `3px solid ${P.orange}`, borderRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <Thumb src={p.main_image} alt={p.name} size={34} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: P.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: P.muted }}>SKU : {p.sku ?? 'N/A'}</p>
                    </div>
                  </div>
                  <SecondaryBtn small onClick={() => { setActiveView('products'); setActiveProductTab('list'); setSearchTerm(p.sku ?? p.name); }}>
                    Voir
                  </SecondaryBtn>
                </div>
              ))}
            </div>
          ) : (
            <EmptyBlock icon={<CheckCircle size={20} color={P.green} />} title="Aucune alerte critique"
              text="Tous les produits sont à un niveau de stock correct." />
          )}
        </div>

        {/* Mouvements récents */}
        <div style={{ ...card, padding: 16 }}>
          <CardTitle icon={RefreshCw} label="Mouvements récents"
            right={<button onClick={() => setActiveView('movements')}
              style={{ background: 'none', border: 'none', color: P.blue, fontWeight: 700, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
              Voir tout</button>} />
          {movements.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {movements.slice(0, 5).map((m) => {
                const mi = movInfo(m.type);
                const Icon = m.type === 'entree' ? TrendingUp : m.type === 'sortie' ? TrendingDown : RefreshCw;
                return (
                  <div key={m.id} className="stk-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                    padding: '9px 10px', borderRadius: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, background: mi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={14} style={{ color: mi.color }} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: P.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.product?.name ?? '—'}</p>
                        <p style={{ margin: 0, fontSize: 11, color: P.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.reason}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: mi.color }}>{mi.sign} {m.quantity}</p>
                      <p style={{ margin: 0, fontSize: 10, color: P.muted }}>
                        {new Date(m.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · {m.user?.username ?? '—'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyBlock icon={<Package size={20} color={P.gray} />} title="Aucun mouvement récent"
              text="Les entrées, sorties et ajustements apparaîtront ici." />
          )}
        </div>
      </div>

      {/* Répartition par statut */}
      <div style={{ ...card, padding: 16 }}>
        <CardTitle icon={BarChart3} label="Répartition des produits par statut" />
        {products.length === 0 ? (
          <p style={{ fontSize: 12, color: P.muted, margin: 0 }}>Aucun produit enregistré pour le moment.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {Object.keys(PRODUCT_STATUS).map((k) => {
              const s = PRODUCT_STATUS[k];
              const n = statusCounts[k] ?? 0;
              const pct = Math.round((n / Math.max(products.length, 1)) * 100);
              return (
                <div key={k}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                    <span style={{ fontWeight: 700, color: P.textSub }}>{s.label}</span>
                    <span style={{ fontWeight: 800, color: P.text }}>{n} <span style={{ color: P.muted, fontWeight: 500 }}>({pct} %)</span></span>
                  </div>
                  <div style={{ height: 7, borderRadius: 9, background: P.surface, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: s.dot, borderRadius: 9 }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  /* ─── Produits ─────────────────────────────────────────── */
  const addLabel = activeProductTab === 'list' ? 'Nouveau produit'
    : activeProductTab === 'variants' ? 'Nouvelle variante'
    : activeProductTab === 'formats' ? 'Nouveau format' : 'Nouvelle catégorie';

  const renderProducts = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ ...card, overflow: 'hidden' }}>
        <div style={{ padding: '0 12px', background: P.surface, borderBottom: `1px solid ${P.warmL}` }}>
          <Tabs active={activeProductTab} onChange={(id) => { setActiveProductTab(id as any); setSearchTerm(''); }} tabs={[
            { id: 'list',       label: 'Produits',   icon: Package,    count: products.length },
            { id: 'variants',   label: 'Variantes',  icon: Box,        count: variants.length },
            { id: 'formats',    label: 'Formats',    icon: Tag,        count: formats.length },
            { id: 'categories', label: 'Catégories', icon: FolderOpen, count: categories.length },
          ]} />
        </div>
        <div style={{ padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} color={P.muted} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
              <input style={{ ...inp, paddingLeft: 32, paddingRight: searchTerm ? 30 : 12, width: 270 }} placeholder="Rechercher…"
                aria-label="Rechercher" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} title="Effacer la recherche" aria-label="Effacer la recherche"
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none',
                    border: 'none', cursor: 'pointer', color: P.muted, padding: 2, display: 'flex' }}>
                  <X size={13} />
                </button>
              )}
            </div>
            {activeProductTab === 'list' && (
              <select style={{ ...inp, width: 210 }} value={selectedCategory} aria-label="Catégorie"
                onChange={(e) => setSelectedCategory(e.target.value)}>
                <option value="all">Toutes les catégories</option>
                {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            )}
          </div>
          <PrimaryBtn onClick={() => {
            if (activeProductTab === 'list') setShowAddModal(true);
            else if (activeProductTab === 'variants') setShowAddVariantModal(true);
            else if (activeProductTab === 'formats') setShowAddFormatModal(true);
            else setShowCategoryModal(true);
          }}>
            <Plus size={13} /> {addLabel}
          </PrimaryBtn>
        </div>
      </div>

      {/* Produits */}
      {activeProductTab === 'list' && (
        <TableWrapper>
          <thead><tr>
            <Th>Produit</Th><Th>Catégorie</Th><Th>Statut</Th><Th>Fournisseur</Th><Th>Point de vente</Th><Th>Actions</Th>
          </tr></thead>
          <tbody>
            {filteredProducts.map((p) => (
              <tr key={p.id} className="stk-row">
                <Td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Thumb src={p.main_image} alt={p.name} />
                    <div>
                      <p style={{ margin: 0, fontWeight: 700 }}>{p.name}</p>
                      <p style={{ margin: 0, fontSize: 10, color: P.muted }}>{p.sku}</p>
                    </div>
                  </div>
                </Td>
                <Td style={{ color: P.textSub }}>{p.category?.name ?? '—'}</Td>
                <Td><StatusPill status={p.status} /></Td>
                <Td style={{ color: P.textSub }}>{p.supplier?.name ?? '—'}</Td>
                <Td style={{ color: P.textSub }}>{p.point_of_sale?.name ?? '—'}</Td>
                <Td>
                  <div style={{ display: 'flex', gap: 2 }}>
                    <ActionBtn onClick={() => { setSelectedProduct(p); setShowEditModal(true); }} title="Modifier"><Edit size={14} /></ActionBtn>
                    <ActionBtn danger onClick={() => handleDeleteProduct(p.id)} title="Supprimer"><Trash2 size={14} /></ActionBtn>
                  </div>
                </Td>
              </tr>
            ))}
            {filteredProducts.length === 0 && (
              <EmptyRow cols={6} icon={<Package size={20} color={P.gray} />}
                msg={products.length === 0 ? 'Aucun produit' : 'Aucun résultat'}
                sub={products.length === 0 ? 'Ajoutez votre premier produit.' : 'Modifiez vos critères de recherche.'} />
            )}
          </tbody>
        </TableWrapper>
      )}

      {/* Variantes */}
      {activeProductTab === 'variants' && (
        <TableWrapper>
          <thead><tr>
            <Th>Produit</Th><Th>Format</Th><Th>Stock</Th><Th>Niveau</Th><Th>Prix</Th><Th>Actions</Th>
          </tr></thead>
          <tbody>
            {filteredVariants.map((v) => {
              const st = variantState(v);
              const fill = v.max_stock > 0 ? Math.min(100, (v.current_stock / v.max_stock) * 100) : 0;
              return (
                <tr key={v.id} className="stk-row">
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Thumb src={typeof v.image === 'string' ? v.image : undefined} alt={v.format?.name ?? ''} />
                      <p style={{ margin: 0, fontWeight: 700 }}>{v.product?.name ?? '—'}</p>
                    </div>
                  </Td>
                  <Td style={{ color: P.textSub }}>{v.format?.name ?? '—'}</Td>
                  <Td style={{ minWidth: 150 }}>
                    <span style={{ fontWeight: 800, color: statusInfo(st).fg }}>{v.current_stock}</span>
                    <span style={{ fontSize: 10, color: P.muted }}> · min {v.min_stock} · max {v.max_stock}</span>
                    <div style={{ height: 5, borderRadius: 9, background: P.surface, marginTop: 5, overflow: 'hidden' }}>
                      <div style={{ width: `${fill}%`, height: '100%', background: statusInfo(st).dot, borderRadius: 9 }} />
                    </div>
                  </Td>
                  <Td><StatusPill status={st} /></Td>
                  <Td style={{ fontWeight: 700, color: P.blueD, whiteSpace: 'nowrap' }}>{money(v.price)}</Td>
                  <Td>
                    <div style={{ display: 'flex', gap: 2 }}>
                      <ActionBtn onClick={() => { setSelectedVariant({ ...v, product_id: v.product_id || v.product.id }); setShowEditVariantModal(true); }} title="Modifier"><Edit size={14} /></ActionBtn>
                      <ActionBtn danger onClick={() => handleDeleteVariant(v.id)} title="Supprimer"><Trash2 size={14} /></ActionBtn>
                    </div>
                  </Td>
                </tr>
              );
            })}
            {filteredVariants.length === 0 && (
              <EmptyRow cols={6} icon={<Box size={20} color={P.gray} />}
                msg={variants.length === 0 ? 'Aucune variante' : 'Aucun résultat'}
                sub={variants.length === 0 ? 'Ajoutez des variantes à vos produits.' : 'Modifiez vos critères.'} />
            )}
          </tbody>
        </TableWrapper>
      )}

      {/* Formats */}
      {activeProductTab === 'formats' && (
        <TableWrapper>
          <thead><tr><Th>Nom</Th><Th>Description</Th><Th>Actions</Th></tr></thead>
          <tbody>
            {filteredFormats.map((f) => (
              <tr key={f.id} className="stk-row">
                <Td style={{ fontWeight: 700 }}>{f.name}</Td>
                <Td style={{ color: P.textSub }}>{f.description || '—'}</Td>
                <Td><ActionBtn danger onClick={() => handleDeleteFormat(f.id)} title="Supprimer"><Trash2 size={14} /></ActionBtn></Td>
              </tr>
            ))}
            {filteredFormats.length === 0 && (
              <EmptyRow cols={3} icon={<Tag size={20} color={P.gray} />}
                msg={formats.length === 0 ? 'Aucun format' : 'Aucun résultat'}
                sub={formats.length === 0 ? 'Créez des formats pour organiser vos variantes.' : 'Modifiez vos critères.'} />
            )}
          </tbody>
        </TableWrapper>
      )}

      {/* Catégories */}
      {activeProductTab === 'categories' && (
        <TableWrapper>
          <thead><tr><Th>Catégorie</Th><Th>Description</Th><Th>Actions</Th></tr></thead>
          <tbody>
            {filteredCategories.map((c) => (
              <tr key={c.id} className="stk-row">
                <Td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Thumb src={c.image} alt={c.name} />
                    <span style={{ fontWeight: 700 }}>{c.name}</span>
                  </div>
                </Td>
                <Td style={{ color: P.textSub }}>{c.description || '—'}</Td>
                <Td><ActionBtn danger onClick={() => handleDeleteCategory(c.id)} title="Supprimer"><Trash2 size={14} /></ActionBtn></Td>
              </tr>
            ))}
            {filteredCategories.length === 0 && (
              <EmptyRow cols={3} icon={<FolderOpen size={20} color={P.gray} />}
                msg={categories.length === 0 ? 'Aucune catégorie' : 'Aucun résultat'}
                sub={categories.length === 0 ? 'Organisez vos produits par catégorie.' : 'Modifiez vos critères.'} />
            )}
          </tbody>
        </TableWrapper>
      )}
    </div>
  );

  /* ─── Mouvements ───────────────────────────────────────── */
  const renderMovements = () => (
    <div style={{ ...card, padding: 16 }}>
      <CardTitle icon={RefreshCw} label={`Mouvements de stock (${movements.length})`}
        right={<PrimaryBtn onClick={() => setShowMovementModal(true)}><Plus size={13} /> Nouveau mouvement</PrimaryBtn>} />
      {movements.length === 0 ? (
        <EmptyBlock icon={<RefreshCw size={20} color={P.gray} />} title="Aucun mouvement de stock"
          text="Enregistrez une entrée, une sortie ou un ajustement pour commencer."
          action={<PrimaryBtn onClick={() => setShowMovementModal(true)}><Plus size={13} /> Premier mouvement</PrimaryBtn>} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {movements.map((m) => {
            const mi = movInfo(m.type);
            const Icon = m.type === 'entree' ? TrendingUp : m.type === 'sortie' ? TrendingDown : RefreshCw;
            return (
              <div key={m.id} className="stk-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                padding: '12px 14px', border: `1px solid ${P.surface}`, borderRadius: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: mi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={16} style={{ color: mi.color }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 700, color: P.text, fontSize: 13 }}>{m.product?.name ?? '—'}</p>
                    <p style={{ margin: '1px 0 4px', fontSize: 11, color: P.muted }}>{m.reason}</p>
                    <Pill bg={mi.bg} fg={mi.fg}>{mi.label}</Pill>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: 18, color: mi.color, fontVariantNumeric: 'tabular-nums' }}>{mi.sign} {m.quantity}</p>
                  <p style={{ margin: 0, fontSize: 11, color: P.muted }}>{new Date(m.date).toLocaleString('fr-FR')}</p>
                  <p style={{ margin: 0, fontSize: 11, color: P.blue, fontWeight: 600 }}>{m.user?.username ?? '—'}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  /* ─── Analyses (à venir) ───────────────────────────────── */
  const renderAnalytics = () => (
    <div style={{ ...card, padding: 16 }}>
      <EmptyBlock icon={<TrendingUp size={22} color={P.blue} />} title="Analyses avancées"
        text="Les rapports détaillés ne sont pas encore disponibles. Ils s'appuieront sur les mouvements et la valeur du stock déjà enregistrés."
        action={
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
            {[{ icon: BarChart3, label: 'Performance' }, { icon: Database, label: 'Prévisions' }, { icon: Clock, label: 'Historique' }].map(({ icon: Icon, label }) => (
              <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9999,
                background: P.pale, border: `1px solid ${P.warmL}`, color: P.mutedD, fontSize: 12, fontWeight: 700 }}>
                <Icon size={13} /> {label}
              </span>
            ))}
          </div>
        } />
    </div>
  );

  /* ════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════ */
  return (
    <div className="stk-root" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{GLOBAL_CSS}</style>

      {/* Toast */}
      {toast && (
        <div role="status" style={{ position: 'fixed', top: 20, right: 20, zIndex: 100, display: 'flex', alignItems: 'center', gap: 10,
          padding: '11px 14px', borderRadius: 12, fontSize: 13, fontWeight: 700, color: P.text, background: '#fff',
          border: `1px solid ${P.warmL}`, borderLeft: `4px solid ${toast.type === 'success' ? P.green : P.red}`,
          boxShadow: '0 10px 30px rgba(10,21,32,0.18)', animation: 'stkToast 0.2s ease-out' }}>
          {toast.type === 'success'
            ? <CheckCircle size={15} color={P.green} />
            : <AlertCircle size={15} color={P.red} />}
          {toast.message}
          <button onClick={() => setToast(null)} aria-label="Fermer"
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: P.muted, padding: 0 }}>
            <X size={13} />
          </button>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#FEF0ED',
          border: '1px solid #F5C4B3', borderRadius: 12, fontSize: 13, color: '#9A2D10' }}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, fontWeight: 600 }}>{error}</span>
          <button onClick={() => setError(null)} aria-label="Fermer" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9A2D10', display: 'flex' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Bandeau */}
      <div style={{ background: P.banner, borderRadius: 16, padding: 20, display: 'flex', justifyContent: 'space-between',
        gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ maxWidth: 620 }}>
          <p style={{ color: 'rgba(200,230,248,0.9)', fontSize: 12, fontWeight: 600, margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 7 }}>
            <Package size={15} style={{ color: P.blueL }} /> LanfiaLink Inventaire
          </p>
          <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 800, margin: 0 }}>Gestion de stock</h2>
          <p style={{ color: 'rgba(200,230,248,0.85)', fontSize: 12, margin: '6px 0 0', lineHeight: 1.5 }}>
            Produits, variantes, formats et mouvements : suivez les niveaux de stock de chaque distributeur.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ padding: '6px 12px', borderRadius: 9999, fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.14)', color: '#E8F4FB' }}>
            {products.length} produit(s)
          </span>
          <button className="stk-btn" onClick={fetchData}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, border: 'none',
              background: 'rgba(255,255,255,0.16)', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
            {isLoading ? <Loader2 size={13} className="stk-spin" /> : <RefreshCw size={13} />} Actualiser
          </button>
          <button className="stk-btn" onClick={() => setShowMovementModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, border: 'none',
              background: P.blue, color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Plus size={13} /> Nouveau mouvement
          </button>
        </div>
      </div>

      {/* Navigation principale */}
      <div style={{ ...card, padding: '0 12px' }}>
        <Tabs active={activeView} onChange={(id) => { setActiveView(id as any); if (id === 'products') setActiveProductTab('list'); }} tabs={[
          { id: 'overview',  label: "Vue d'ensemble", icon: BarChart3 },
          { id: 'products',  label: 'Produits',       icon: Package, count: products.length },
          { id: 'movements', label: 'Mouvements',     icon: RefreshCw, count: movements.length },
          { id: 'analytics', label: 'Analyses',       icon: TrendingUp },
        ]} />
      </div>

      {/* Contenu */}
      {isLoading && products.length === 0 && variants.length === 0 ? (
        <div style={{ ...card, padding: 56, textAlign: 'center' }}>
          <Loader2 size={32} className="stk-spin" style={{ color: P.blue, margin: '0 auto 12px' }} />
          <p style={{ fontSize: 13, color: P.textSub, fontWeight: 600, margin: 0 }}>Chargement de l'inventaire…</p>
        </div>
      ) : (
        <>
          {activeView === 'overview'  && renderOverview()}
          {activeView === 'products'  && renderProducts()}
          {activeView === 'movements' && renderMovements()}
          {activeView === 'analytics' && renderAnalytics()}
        </>
      )}

      <p style={{ textAlign: 'center', fontSize: 11, color: P.muted, margin: 0 }}>
        © {new Date().getFullYear()} LanfiaLink · Côte d'Ivoire · ISO 27001
      </p>

      {/* ══════════════ MODALES ══════════════ */}

      {/* Nouveau produit */}
      <Modal isOpen={showAddModal} onClose={() => { if (!isSubmitting) setShowAddModal(false); }}
        title="Nouveau produit" subtitle="Ajoutez un produit à votre inventaire" icon={Plus} error={error}>
        <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FormRow>
            <Field label="Nom du produit *">
              <input style={inp} required value={newProduct.name}
                onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))} />
            </Field>
            <Field label="Catégorie *">
              <SearchableSelect
                options={categories.map((c) => ({ id: String(c.id), label: c.name }))}
                value={newProduct.category_id === '' ? '' : String(newProduct.category_id)}
                onChange={(id) => setNewProduct((p) => ({ ...p, category_id: id ? Number(id) : '' }))}
                placeholder="Sélectionner…" required emptyMessage="Aucune catégorie trouvée" />
            </Field>
            <Field label="Code SKU *">
              <input style={inp} required value={newProduct.sku}
                onChange={(e) => setNewProduct((p) => ({ ...p, sku: e.target.value.toUpperCase() }))} />
            </Field>
            <Field label="Fournisseur *">
              <SearchableSelect
                options={suppliers.map((s) => ({ id: String(s.id), label: s.name }))}
                value={newProduct.supplier_id === '' ? '' : String(newProduct.supplier_id)}
                onChange={(id) => setNewProduct((p) => ({ ...p, supplier_id: id ? Number(id) : '' }))}
                placeholder="Sélectionner…" required emptyMessage="Aucun fournisseur trouvé" />
            </Field>
            <Field label="Point de vente *">
              <SearchableSelect
                options={distributeurs.map((p) => ({ id: p.id, label: p.name, sublabel: natureLabel(p.nature) }))}
                value={newProduct.point_of_sale_id}
                onChange={(id) => setNewProduct((p) => ({ ...p, point_of_sale_id: id }))}
                placeholder="Sélectionner un distributeur…" required
                emptyMessage="Aucun distributeur (principal ou secondaire) trouvé" />
            </Field>
            <Field label="Statut *">
              <select style={inp} value={newProduct.status}
                onChange={(e) => setNewProduct((p) => ({ ...p, status: e.target.value as any }))}>
                <option value="en_stock">En stock</option>
                <option value="stock_faible">Stock faible</option>
                <option value="rupture">Rupture</option>
                <option value="surstockage">Surstockage</option>
              </select>
            </Field>
          </FormRow>
          <Field label="Description">
            <textarea style={{ ...inp, height: 76, resize: 'vertical' }} value={newProduct.description}
              onChange={(e) => setNewProduct((p) => ({ ...p, description: e.target.value }))} />
          </Field>
          <Field label="Image principale">
            <ImageUploadField value={newProduct.main_image}
              onChange={(f) => setNewProduct((p) => ({ ...p, main_image: f }))}
              onClear={() => setNewProduct((p) => ({ ...p, main_image: undefined }))} />
          </Field>
          {modalFooter(() => setShowAddModal(false), 'Créer le produit', isSubmitting)}
        </form>
      </Modal>

      {/* Modifier le produit */}
      <Modal isOpen={showEditModal} onClose={() => { if (!isSubmitting) { setShowEditModal(false); setSelectedProduct(null); } }}
        title="Modifier le produit" subtitle="Mettez à jour les informations" icon={Edit} error={error}>
        {selectedProduct && (
          <form onSubmit={handleUpdateProduct} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <FormRow>
              <Field label="Nom *">
                <input style={inp} required value={selectedProduct.name}
                  onChange={(e) => setSelectedProduct((p) => p ? { ...p, name: e.target.value } : null)} />
              </Field>
              <Field label="Catégorie *">
                <SearchableSelect
                  options={categories.map((c) => ({ id: String(c.id), label: c.name }))}
                  value={String(selectedProduct.category.id)}
                  onChange={(id) => setSelectedProduct((p) => p ? { ...p, category: { ...p.category, id: Number(id) } } : null)}
                  placeholder="Sélectionner…" required emptyMessage="Aucune catégorie trouvée" />
              </Field>
              <Field label="SKU *">
                <input style={inp} required value={selectedProduct.sku}
                  onChange={(e) => setSelectedProduct((p) => p ? { ...p, sku: e.target.value.toUpperCase() } : null)} />
              </Field>
              <Field label="Fournisseur *">
                <SearchableSelect
                  options={suppliers.map((s) => ({ id: String(s.id), label: s.name }))}
                  value={String(selectedProduct.supplier.id)}
                  onChange={(id) => setSelectedProduct((p) => p ? { ...p, supplier: { ...p.supplier, id: Number(id) } } : null)}
                  placeholder="Sélectionner…" required emptyMessage="Aucun fournisseur trouvé" />
              </Field>
              <Field label="Point de vente *">
                <SearchableSelect
                  options={editDistributeurs.map((p) => ({ id: p.id, label: p.name, sublabel: natureLabel(p.nature) }))}
                  value={selectedProduct.point_of_sale.id}
                  onChange={(id) => setSelectedProduct((p) => p ? { ...p, point_of_sale: { ...p.point_of_sale, id } } : null)}
                  placeholder="Sélectionner un distributeur…" required
                  emptyMessage="Aucun distributeur (principal ou secondaire) trouvé" />
              </Field>
              <Field label="Statut *">
                <select style={inp} value={selectedProduct.status}
                  onChange={(e) => setSelectedProduct((p) => p ? { ...p, status: e.target.value as any } : null)}>
                  <option value="en_stock">En stock</option>
                  <option value="stock_faible">Stock faible</option>
                  <option value="rupture">Rupture</option>
                  <option value="surstockage">Surstockage</option>
                </select>
              </Field>
            </FormRow>
            <Field label="Description">
              <textarea style={{ ...inp, height: 76, resize: 'vertical' }} value={selectedProduct.description ?? ''}
                onChange={(e) => setSelectedProduct((p) => p ? { ...p, description: e.target.value } : null)} />
            </Field>
            <Field label="Image principale">
              <ImageUploadField value={selectedProduct.main_image}
                onChange={(f) => setSelectedProduct((p) => p ? { ...p, main_image: URL.createObjectURL(f) } : null)}
                onClear={() => setSelectedProduct((p) => p ? { ...p, main_image: undefined } : null)} />
            </Field>
            {modalFooter(() => { setShowEditModal(false); setSelectedProduct(null); }, 'Mettre à jour', isSubmitting)}
          </form>
        )}
      </Modal>

      {/* Nouvelle variante */}
      <Modal isOpen={showAddVariantModal} onClose={() => { if (!isSubmitting) setShowAddVariantModal(false); }}
        title="Nouvelle variante" subtitle="Associez un format à un produit" icon={Box} error={error}>
        <form onSubmit={handleAddVariant} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FormRow>
            <Field label="Produit *">
              <SearchableSelect
                options={products.map((p) => ({ id: p.id, label: p.name, sublabel: p.sku }))}
                value={newVariant.product_id}
                onChange={(id) => setNewVariant((v) => ({ ...v, product_id: id }))}
                placeholder="Sélectionner…" required emptyMessage="Aucun produit trouvé" />
            </Field>
            <Field label="Format *">
              <SearchableSelect
                options={formats.map((f) => ({ id: String(f.id), label: f.name, sublabel: f.description }))}
                value={newVariant.format_id === '' ? '' : String(newVariant.format_id)}
                onChange={(id) => setNewVariant((v) => ({ ...v, format_id: id ? Number(id) : '' }))}
                placeholder="Sélectionner…" required emptyMessage="Aucun format trouvé" />
            </Field>
            <Field label="Stock actuel *">
              <input style={inp} type="number" required min="0" value={newVariant.current_stock}
                onChange={(e) => setNewVariant((v) => ({ ...v, current_stock: Number(e.target.value) }))} />
            </Field>
            <Field label="Stock minimum *">
              <input style={inp} type="number" required min="0" value={newVariant.min_stock}
                onChange={(e) => setNewVariant((v) => ({ ...v, min_stock: Number(e.target.value) }))} />
            </Field>
            <Field label="Stock maximum *">
              <input style={inp} type="number" required min="0" value={newVariant.max_stock}
                onChange={(e) => setNewVariant((v) => ({ ...v, max_stock: Number(e.target.value) }))} />
            </Field>
            <Field label="Prix (XOF) *">
              <input style={inp} type="number" required min="0" step="0.01" value={newVariant.price}
                onChange={(e) => setNewVariant((v) => ({ ...v, price: Number(e.target.value) }))} />
            </Field>
            <Field label="Code-barres">
              <input style={inp} value={newVariant.barcode}
                onChange={(e) => setNewVariant((v) => ({ ...v, barcode: e.target.value }))} />
            </Field>
          </FormRow>
          <Field label="Image">
            <ImageUploadField value={newVariant.image}
              onChange={(f) => setNewVariant((v) => ({ ...v, image: f }))}
              onClear={() => setNewVariant((v) => ({ ...v, image: undefined }))} />
          </Field>
          {modalFooter(() => setShowAddVariantModal(false), 'Ajouter la variante', isSubmitting)}
        </form>
      </Modal>

      {/* Modifier la variante */}
      <Modal isOpen={showEditVariantModal} onClose={() => { if (!isSubmitting) { setShowEditVariantModal(false); setSelectedVariant(null); } }}
        title="Modifier la variante" subtitle="Mettez à jour les informations" icon={Edit} error={error}>
        {selectedVariant && (
          <form onSubmit={handleUpdateVariant} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <FormRow>
              <Field label="Produit *">
                <SearchableSelect
                  options={products.map((p) => ({ id: p.id, label: p.name, sublabel: p.sku }))}
                  value={selectedVariant.product_id}
                  onChange={(id) => setSelectedVariant((v) => v ? { ...v, product_id: id, product: { ...v.product, id } } : null)}
                  placeholder="Sélectionner…" required emptyMessage="Aucun produit trouvé" />
              </Field>
              <Field label="Format *">
                <SearchableSelect
                  options={formats.map((f) => ({ id: String(f.id), label: f.name, sublabel: f.description }))}
                  value={String(selectedVariant.format.id)}
                  onChange={(id) => setSelectedVariant((v) => v ? { ...v, format: { ...v.format, id: Number(id) } } : null)}
                  placeholder="Sélectionner…" required emptyMessage="Aucun format trouvé" />
              </Field>
              <Field label="Stock actuel *">
                <input style={inp} type="number" required min="0" value={selectedVariant.current_stock}
                  onChange={(e) => setSelectedVariant((v) => v ? { ...v, current_stock: Number(e.target.value) } : null)} />
              </Field>
              <Field label="Stock minimum *">
                <input style={inp} type="number" required min="0" value={selectedVariant.min_stock}
                  onChange={(e) => setSelectedVariant((v) => v ? { ...v, min_stock: Number(e.target.value) } : null)} />
              </Field>
              <Field label="Stock maximum *">
                <input style={inp} type="number" required min="0" value={selectedVariant.max_stock}
                  onChange={(e) => setSelectedVariant((v) => v ? { ...v, max_stock: Number(e.target.value) } : null)} />
              </Field>
              <Field label="Prix (XOF) *">
                <input style={inp} type="number" required min="0" step="0.01" value={selectedVariant.price}
                  onChange={(e) => setSelectedVariant((v) => v ? { ...v, price: Number(e.target.value) } : null)} />
              </Field>
              <Field label="Code-barres">
                <input style={inp} value={selectedVariant.barcode}
                  onChange={(e) => setSelectedVariant((v) => v ? { ...v, barcode: e.target.value } : null)} />
              </Field>
            </FormRow>
            <Field label="Image">
              <ImageUploadField
                value={selectedVariant.image instanceof File ? selectedVariant.image : (typeof selectedVariant.image === 'string' ? selectedVariant.image : null)}
                onChange={(f) => setSelectedVariant((v) => v ? { ...v, image: f } : null)}
                onClear={() => setSelectedVariant((v) => v ? { ...v, image: undefined } : null)} />
            </Field>
            {modalFooter(() => { setShowEditVariantModal(false); setSelectedVariant(null); }, 'Mettre à jour', isSubmitting)}
          </form>
        )}
      </Modal>

      {/* Nouveau format */}
      <Modal isOpen={showAddFormatModal} onClose={() => { if (!isSubmitting) setShowAddFormatModal(false); }}
        title="Nouveau format" subtitle="Créez un format de conditionnement" icon={Tag} error={error}>
        <form onSubmit={handleAddFormat} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Nom *">
            <input style={inp} required value={newFormat.name}
              onChange={(e) => setNewFormat((f) => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Description">
            <textarea style={{ ...inp, height: 76, resize: 'vertical' }} value={newFormat.description}
              onChange={(e) => setNewFormat((f) => ({ ...f, description: e.target.value }))} />
          </Field>
          {modalFooter(() => setShowAddFormatModal(false), 'Ajouter le format', isSubmitting)}
        </form>
      </Modal>

      {/* Nouvelle catégorie */}
      <Modal isOpen={showCategoryModal} onClose={() => { if (!isSubmitting) setShowCategoryModal(false); }}
        title="Nouvelle catégorie" subtitle="Organisez vos produits" icon={FolderOpen} error={error}>
        <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Nom *">
            <input style={inp} required value={newCategory.name}
              onChange={(e) => setNewCategory((c) => ({ ...c, name: e.target.value }))} />
          </Field>
          <Field label="Description">
            <textarea style={{ ...inp, height: 76, resize: 'vertical' }} value={newCategory.description}
              onChange={(e) => setNewCategory((c) => ({ ...c, description: e.target.value }))} />
          </Field>
          <Field label="Image">
            <ImageUploadField value={newCategory.image}
              onChange={(f) => setNewCategory((c) => ({ ...c, image: f }))}
              onClear={() => setNewCategory((c) => ({ ...c, image: null }))} />
          </Field>
          {modalFooter(() => setShowCategoryModal(false), 'Ajouter la catégorie', isSubmitting)}
        </form>
      </Modal>

      {/* Nouveau mouvement */}
      <Modal isOpen={showMovementModal} onClose={() => { if (!isSubmitting) setShowMovementModal(false); }}
        title="Nouveau mouvement de stock" subtitle="Enregistrez une entrée, une sortie ou un ajustement" icon={RefreshCw} error={error}>
        <form onSubmit={handleAddMovement} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Variante de produit *">
            <SearchableSelect
              options={variants.map((v) => ({
                id: v.id,
                label: `${v.product?.name ?? '—'} – ${v.format?.name ?? '—'}`,
                sublabel: `Stock actuel : ${v.current_stock}`,
              }))}
              value={newMovement.product_variant_id}
              onChange={(id) => setNewMovement((m) => ({ ...m, product_variant_id: id }))}
              placeholder="Sélectionner une variante…" required emptyMessage="Aucune variante trouvée" />
          </Field>
          <FormRow>
            <Field label="Type *">
              <select style={inp} required value={newMovement.type}
                onChange={(e) => setNewMovement((m) => ({ ...m, type: e.target.value as any }))}>
                <option value="">Sélectionner…</option>
                <option value="entree">Entrée</option>
                <option value="sortie">Sortie</option>
                <option value="ajustement">Ajustement</option>
              </select>
            </Field>
            <Field label="Quantité *">
              <input style={inp} type="number" required min="1" value={newMovement.quantity}
                onChange={(e) => setNewMovement((m) => ({ ...m, quantity: Number(e.target.value) }))} />
            </Field>
          </FormRow>
          <Field label="Raison *">
            <input style={inp} required value={newMovement.reason}
              onChange={(e) => setNewMovement((m) => ({ ...m, reason: e.target.value }))} />
          </Field>
          {modalFooter(() => setShowMovementModal(false), 'Ajouter le mouvement', isSubmitting)}
        </form>
      </Modal>
    </div>
  );
};

export default StockManagement;