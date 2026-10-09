"use client";
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import {
  Plus, UserRound, Search, MapPin, Phone, Mail, Clock, ChevronLeft, ChevronRight, Edit, Trash2, Save,
  Coins, Image as ImageIcon, Calendar, BarChart3, TrendingUp, TrendingDown, Filter, Key, User,
  ShoppingBag, X, RefreshCw, Map as MapIcon, Users, Activity, Package, ShieldCheck, UploadCloud,
  ChevronDown, Navigation, AlertCircle, Store, Award, Download, Loader2, CheckCircle2,
} from 'lucide-react';
import { apiService } from './ApiService';
import type { POSData } from './AdminDashboard';

/* ─── Palette (identique aux autres vues admin) ─────────── */
const P = {
  navy: '#0A1E2E', blue: '#1A8FD1', blueL: '#4FB3E8', blueD: '#0D6FAB', banner: '#0D4E7A',
  pale: '#EDF5FA', surface: '#F0F5F9', warm: '#C0D4E6', warmL: '#D4E4F0',
  text: '#0A1E2E', textSub: '#2A4A62', muted: '#5A7A92', mutedD: '#1A4A6A',
  green: '#10B981', orange: '#F59E0B', red: '#EF4444', purple: '#8B5CF6', teal: '#14B8A6', pink: '#EC4899', gray: '#8AA6BA',
};

const card: React.CSSProperties = {
  background: '#fff', border: `1px solid ${P.warmL}`, borderRadius: 16,
  boxShadow: '0 1px 6px rgba(13,80,140,0.06)',
};

const inp: React.CSSProperties = {
  width: '100%', padding: '8px 12px', height: 38, border: `1.5px solid ${P.warm}`, borderRadius: 10,
  fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: P.text, background: '#fff',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

const GLOBAL_CSS = `
  @keyframes mvSpin { to { transform: rotate(360deg); } }
  @keyframes mvPop { 0% { transform: scale(0.97); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
  .mv-spin { animation: mvSpin 0.8s linear infinite; }
  .mv-pop { animation: mvPop 0.16s ease; }
  .mv-root input:not([type=checkbox]):not([type=file]):focus,
  .mv-root select:focus,
  .mv-root textarea:focus { border-color: #1A8FD1 !important; box-shadow: 0 0 0 3px rgba(26,143,209,0.15); }
  .mv-row { transition: background 0.12s; }
  .mv-row:hover { background: #EDF5FA; }
  .mv-btn { transition: opacity 0.15s, transform 0.1s; }
  .mv-btn:active:not(:disabled) { transform: scale(0.98); }
  .mv-form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
  @media (max-width: 700px) { .mv-form-grid { grid-template-columns: 1fr; } }
  @media (prefers-reduced-motion: reduce) { .mv-spin { animation-duration: 2s; } .mv-pop { animation: none; } }
`;

/* ─── Types ─────────────────────────────────────────────── */
type VendorStatus = 'actif' | 'inactif' | 'en_conge' | 'suspendu';
type VehicleType = 'moto' | 'tricycle' | 'velo' | 'pied' | 'autre';

interface Vendor {
  id: number; first_name: string; last_name: string; phone: string;
  email?: string; status: VendorStatus; vehicle_type: VehicleType;
  vehicle_id?: string; zones: string[]; photo?: string; photo_url?: string;
  is_approved: boolean; notes?: string; average_daily_sales: number;
  performance: number; date_joined: string; last_activity?: string;
  point_of_sale?: number; point_of_sale_name?: string; purchases?: Purchase[];
}
interface Sale {
  id: number; product_variant: number; customer: number; quantity: number;
  total_amount: string; created_at: string; vendor: number;
  product_variant_name: string; format: string; customer_name: string;
  vendor_name: string; vendor_activity: number;
  latitude: number | null; longitude: number | null;
}
interface Purchase {
  id: number; sales_total: string; first_name: string; last_name: string;
  zone: string; amount: string; photo: string; purchase_date: string;
  created_at: string; base: string; pushcard_type: string;
  latitude: number; longitude: number; phone: string; vendor: number;
}
interface Ville {
  id: number; nom: string; district: number; district_nom: string;
  quartiers_count: number; date_creation: string;
}
interface FormVendor {
  first_name: string; last_name: string; phone: string; email: string;
  status: VendorStatus; vehicle_type: VehicleType;
  vehicle_id: string; zones: string[]; point_of_sale: string;
  photo: File | string | undefined; is_approved: boolean; notes: string;
  average_daily_sales: number; performance: number; username: string; password: string;
}
interface ActivityItem {
  id: number; activity_type: string; timestamp: string; notes?: string; location?: string;
}
interface PointOfSale { id: number; name: string; commune: string; nature: string; }
interface MonthlyPerformance {
  month: string; year: number; month_number: number; total_customers: number;
  total_revenue: number; total_products_sold: number; total_sales: number;
  performance_ratio: number; average_basket: number; revenue_per_customer: number;
}
interface PerformanceData {
  vendor_id: number; vendor_name: string;
  period: { start_date: string; end_date: string };
  monthly_performance: MonthlyPerformance[];
  summary: { total_customers: number; total_revenue: number; total_products_sold: number; total_sales: number; overall_performance: number; period_start: string; period_end: string; };
  performance_indicators: { best_month: MonthlyPerformance; worst_month: MonthlyPerformance; growth_rate: number; };
}
interface PerformanceUpdateResponse { message: string; performance: number; }
interface DateFilter { startDate: string; endDate: string }
interface Props { selectedPOS: POSData | null; }

/* ─── Constantes & helpers ──────────────────────────────── */
// Les photos des achats Pushcart sont servies par ce backend (comportement d'origine conservé).
const MEDIA_BASE = 'https://backendsupply.onrender.com';
const PAGE_SIZE = 15;

const STATUS_CFG: Record<VendorStatus, { label: string; bg: string; fg: string; dot: string }> = {
  actif:    { label: 'Actif',    bg: '#DCF5EC', fg: '#044D38', dot: P.green },
  inactif:  { label: 'Inactif',  bg: '#FBEFD6', fg: '#7A4F00', dot: P.orange },
  en_conge: { label: 'En congé', bg: '#DDEBFA', fg: '#0A4A80', dot: P.blue },
  suspendu: { label: 'Suspendu', bg: '#FCE4DC', fg: '#7A2410', dot: P.red },
};
const VEHICLE_LABEL: Record<string, string> = { moto: 'Moto', tricycle: 'Tricycle', velo: 'Vélo', pied: 'À pied', autre: 'Autre' };

function getDefaultVendorForm(pos: POSData | null): FormVendor {
  return {
    first_name: '', last_name: '', phone: '', email: '',
    status: 'actif', vehicle_type: 'moto', vehicle_id: '',
    zones: [], point_of_sale: pos?.pos_id?.toString() || '',
    photo: undefined, is_approved: false, notes: '',
    average_daily_sales: 0, performance: 0, username: '', password: '',
  };
}

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(Number(n) || 0);
const compact = (v: number) => {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1).replace('.', ',')} Md`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1).replace('.', ',')} M`;
  if (v >= 1e3) return `${Math.round(v / 1e3)} k`;
  return String(Math.round(v));
};
const esc = (s: any) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c]);
const extractList = <T,>(json: any): T[] => (Array.isArray(json) ? json : Array.isArray(json?.results) ? json.results : []);
const photoUrl = (p?: string) => (!p ? '' : /^https?:/i.test(p) ? p : `${MEDIA_BASE}${p}`);
const fullName = (v: { first_name?: string; last_name?: string }) => `${v.first_name ?? ''} ${v.last_name ?? ''}`.trim();

/* Nettoie les zones : "démêle" les niveaux de JSON.stringify imbriqués
   accumulés par un ancien bug d'enregistrement, et renvoie une liste plate
   de noms de zones propres (ex: ["Cocody", "ABENGOUROU"]). */
function sanitizeZones(raw: any): string[] {
  const out = new Set<string>();
  const unwrap = (val: any): void => {
    if (Array.isArray(val)) { val.forEach(unwrap); return; }
    if (typeof val !== 'string') return;
    const trimmed = val.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) { parsed.forEach(unwrap); return; }
      } catch { /* pas du JSON valide, on continue avec la string brute */ }
    }
    const cleaned = trimmed.replace(/^"+|"+$/g, '').replace(/\\+/g, '').trim();
    if (cleaned) out.add(cleaned);
  };
  unwrap(raw);
  return Array.from(out);
}

/* Transforme une réponse d'erreur DRF ({champ: [messages]}, {detail}, {message}) en texte lisible. */
function parseApiError(data: any, fallback: string): string {
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (data.detail) return String(data.detail);
  if (data.message) return String(data.message);
  if (typeof data === 'object') {
    const parts = Object.entries(data).map(([k, v]) =>
      `${k} : ${Array.isArray(v) ? v.join(', ') : typeof v === 'object' ? JSON.stringify(v) : String(v)}`);
    if (parts.length) return parts.join(' · ');
  }
  return fallback;
}

/* Champs réellement envoyés à l'API (liste blanche : on n'envoie plus l'objet vendeur complet). */
const SENT_FIELDS: (keyof FormVendor)[] = [
  'first_name', 'last_name', 'phone', 'email', 'status', 'vehicle_type', 'vehicle_id',
  'point_of_sale', 'is_approved', 'notes', 'average_daily_sales', 'performance',
];
const CLEARABLE = new Set(['email', 'vehicle_id', 'notes']);

function buildFD(form: Partial<FormVendor>, isEdit: boolean): FormData {
  const fd = new FormData();
  SENT_FIELDS.forEach((k) => {
    const v = (form as any)[k];
    if (v === undefined || v === null) return;
    if (v === '') { if (isEdit && CLEARABLE.has(k)) fd.append(k, ''); return; } // permet de vider email / notes
    fd.append(k, String(v));
  });
  // Un champ "zones" répété par valeur (format multipart standard d'un ListField DRF)
  sanitizeZones(form.zones).forEach((z) => fd.append('zones', z));
  // La photo n'est envoyée que si un nouveau fichier a été choisi.
  if (form.photo instanceof File) fd.append('photo', form.photo);
  if (!isEdit) {
    if (form.username) fd.append('username', form.username);
    if (form.password) fd.append('password', form.password);
  }
  return fd;
}

function validateVendorForm(f: Partial<FormVendor>, isCreate: boolean): string[] {
  const errs: string[] = [];
  if (!f.first_name?.trim()) errs.push('Le prénom est obligatoire.');
  if (!f.last_name?.trim()) errs.push('Le nom est obligatoire.');
  if (!f.phone?.trim()) errs.push('Le téléphone est obligatoire.');
  if (!f.point_of_sale) errs.push('Choisissez un point de vente.');
  if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) errs.push("L'adresse email n'est pas valide.");
  if (isCreate) {
    if (!f.username?.trim()) errs.push("Le nom d'utilisateur est obligatoire.");
    if (!f.password) errs.push('Le mot de passe est obligatoire.');
    if (!f.zones || f.zones.length === 0) errs.push('Sélectionnez au moins une zone de distribution.');
  }
  const perf = Number(f.performance ?? 0);
  if (perf < 0 || perf > 100) errs.push('La performance doit être comprise entre 0 et 100.');
  return errs;
}

/* Exécute des requêtes avec une concurrence limitée (évite de saturer l'API). */
async function mapLimit<T, R>(items: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx]); }
  });
  await Promise.all(workers);
  return out;
}

const inRange = (iso: string | undefined, f: DateFilter) => {
  if (!iso) return true;
  const d = iso.slice(0, 10);
  return (!f.startDate || d >= f.startDate) && (!f.endDate || d <= f.endDate);
};

/* Chargement unique de Leaflet (script + CSS), partagé avec les autres vues. */
let leafletPromise: Promise<any> | null = null;
function ensureLeaflet(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('SSR'));
  if ((window as any).L) return Promise.resolve((window as any).L);
  if (!leafletPromise) {
    leafletPromise = new Promise((resolve, reject) => {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css'; link.rel = 'stylesheet'; link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; s.async = true;
      s.onload = () => resolve((window as any).L);
      s.onerror = () => { leafletPromise = null; reject(new Error('Leaflet indisponible')); };
      document.head.appendChild(s);
    });
  }
  return leafletPromise;
}

/* ─── Petits composants ─────────────────────────────────── */
const Pill = ({ bg, fg, dot, children }: { bg: string; fg: string; dot?: string; children: React.ReactNode }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 9999,
    fontSize: 11, fontWeight: 700, background: bg, color: fg, whiteSpace: 'nowrap' }}>
    {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot }} />}{children}
  </span>
);

const StatusBadge = ({ status }: { status: string }) => {
  const s = STATUS_CFG[status as VendorStatus] ?? STATUS_CFG.inactif;
  return <Pill bg={s.bg} fg={s.fg} dot={s.dot}>{s.label}</Pill>;
};

const Kpi = ({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: React.ReactNode; sub?: string; color: string;
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

const CardTitle = ({ icon: Icon, label, right }: { icon: any; label: string; right?: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
    paddingBottom: 12, marginBottom: 12, borderBottom: `1px solid ${P.warmL}` }}>
    <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: P.text }}>
      <Icon size={14} style={{ color: P.blue }} /> {label}
    </span>
    {right}
  </div>
);

const EmptyState = ({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '44px 24px', textAlign: 'center' }}>
    <div style={{ width: 52, height: 52, borderRadius: '50%', background: P.pale, display: 'flex',
      alignItems: 'center', justifyContent: 'center', color: P.blue, marginBottom: 12 }}>{icon}</div>
    <p style={{ fontSize: 14, fontWeight: 700, color: P.text, margin: 0 }}>{title}</p>
    {sub && <p style={{ fontSize: 12, color: P.muted, margin: '4px 0 0', maxWidth: 320 }}>{sub}</p>}
  </div>
);

const Spinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
    <Loader2 size={28} className="mv-spin" style={{ color: P.blue }} />
  </div>
);

const Field = ({ label, children, span }: { label: string; children: React.ReactNode; span?: boolean }) => (
  <div style={{ gridColumn: span ? '1 / -1' : undefined }}>
    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: P.mutedD, marginBottom: 5 }}>{label}</label>
    {children}
  </div>
);

const PerfBar = ({ value }: { value: number }) => {
  const v = Math.max(0, Math.min(Number(value) || 0, 100));
  const color = v >= 80 ? P.green : v >= 60 ? P.blue : v >= 40 ? P.orange : P.red;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 110 }}>
      <div style={{ flex: 1, height: 7, background: P.surface, borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${v}%`, background: color, borderRadius: 99, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 800, color: P.text, minWidth: 34, textAlign: 'right' }}>{Math.round(Number(value) || 0)}%</span>
    </div>
  );
};

const AVATAR_COLORS = [P.blue, P.teal, P.purple, P.orange, P.pink, P.green];
const Avatar = ({ vendor, size = 'md' }: { vendor: Vendor; size?: 'sm' | 'md' | 'lg' }) => {
  const px = { sm: 32, md: 40, lg: 68 }[size];
  const fs = { sm: 11, md: 14, lg: 22 }[size];
  const radius = { sm: 8, md: 10, lg: 16 }[size];
  const initials = `${vendor.first_name?.[0] ?? ''}${vendor.last_name?.[0] ?? ''}`.toUpperCase() || '?';
  const src = vendor.photo || vendor.photo_url;
  if (src) return <img src={src} alt="" style={{ width: px, height: px, borderRadius: radius, objectFit: 'cover', border: `2px solid ${P.warmL}`, flexShrink: 0 }} />;
  return (
    <div style={{ width: px, height: px, borderRadius: radius, flexShrink: 0, background: AVATAR_COLORS[vendor.id % AVATAR_COLORS.length],
      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: fs }}>{initials}</div>
  );
};

const btnPrimary: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 15px', borderRadius: 10, background: P.blue,
  color: '#fff', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
};
const btnSecondary: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 15px', borderRadius: 10, background: '#fff',
  color: P.mutedD, fontSize: 12, fontWeight: 700, border: `1.5px solid ${P.warm}`, cursor: 'pointer', fontFamily: 'inherit',
};

const ActionBtn = ({ onClick, title, danger, children }: { onClick: () => void; title: string; danger?: boolean; children: React.ReactNode }) => (
  <button className="mv-btn" onClick={(e) => { e.stopPropagation(); onClick(); }} title={title} aria-label={title}
    style={{ padding: 7, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}
    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = danger ? '#FEF0ED' : P.pale; }}
    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
    {children}
  </button>
);

/* Pagination à fenêtre glissante (corrige l'ancienne pagination limitée aux 7 premières pages). */
const paginationRange = (current: number, total: number): (number | string)[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '…', total];
  if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '…', current - 1, current, current + 1, '…', total];
};

const Pager = ({ page, perPage, count, onPage }: { page: number; perPage: number; count: number; onPage: (p: number) => void }) => {
  if (count === 0) return null;
  const total = Math.max(1, Math.ceil(count / perPage));
  const pb = (disabled: boolean, active = false): React.CSSProperties => ({
    padding: '5px 10px', minWidth: 30, borderRadius: 8, fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
    cursor: disabled ? 'not-allowed' : 'pointer', border: `1px solid ${active ? P.blue : P.warm}`,
    background: active ? P.blue : '#fff', color: active ? '#fff' : disabled ? P.warm : P.textSub,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  });
  return (
    <div style={{ padding: '11px 16px', borderTop: `1px solid ${P.warmL}`, background: P.surface, display: 'flex',
      alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
      <span style={{ fontSize: 12, color: P.muted, fontWeight: 600 }}>{(page - 1) * perPage + 1}–{Math.min(page * perPage, count)} sur {count}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button aria-label="Page précédente" onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1} style={pb(page === 1)}><ChevronLeft size={14} /></button>
        {paginationRange(page, total).map((n, i) => n === '…'
          ? <span key={i} style={{ padding: '0 6px', color: P.muted, fontSize: 12 }}>…</span>
          : <button key={n} onClick={() => onPage(n as number)} style={pb(false, n === page)}>{n}</button>)}
        <button aria-label="Page suivante" onClick={() => onPage(Math.min(total, page + 1))} disabled={page === total} style={pb(page === total)}><ChevronRight size={14} /></button>
      </div>
    </div>
  );
};

const Tabs = ({ tabs, active, onChange }: {
  tabs: { key: string; label: string; badge?: number }[]; active: string; onChange: (k: any) => void;
}) => (
  <div role="tablist" style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${P.warmL}`, marginBottom: 16, overflowX: 'auto' }}>
    {tabs.map((t) => {
      const on = active === t.key;
      return (
        <button key={t.key} role="tab" aria-selected={on} onClick={() => onChange(t.key)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 14px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
            border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', marginBottom: -1,
            color: on ? P.blue : P.muted, borderBottom: `2.5px solid ${on ? P.blue : 'transparent'}` }}>
          {t.label}
          {t.badge !== undefined && t.badge > 0 && (
            <span style={{ padding: '1px 8px', borderRadius: 9999, fontSize: 10, fontWeight: 700, background: on ? P.blue : P.surface, color: on ? '#fff' : P.muted }}>{t.badge}</span>
          )}
        </button>
      );
    })}
  </div>
);

const tableTh: React.CSSProperties = { padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: P.muted, background: P.surface, borderBottom: `1px solid ${P.warmL}`, whiteSpace: 'nowrap' };
const tableTd: React.CSSProperties = { padding: '11px 14px', borderTop: `1px solid ${P.surface}`, verticalAlign: 'middle' };

/* ─── Vue d'ensemble des ventes (Pushcart / POS) ────────── */
const GlobalSalesOverview = ({ sales, purchases, loading, failed }: { sales: Sale[]; purchases: Purchase[]; loading: boolean; failed: number }) => {
  if (loading) return <div style={card}><Spinner /></div>;

  const posCount = sales.length;
  const posQty = sales.reduce((a, s) => a + (Number(s.quantity) || 0), 0);
  const posAmount = sales.reduce((a, s) => a + (parseFloat(s.total_amount) || 0), 0);
  const pushCount = purchases.length;
  const pushAmount = purchases.reduce((a, p) => a + (parseFloat(p.amount) || 0), 0);
  const total = posAmount + pushAmount;

  if (!posCount && !pushCount) {
    return <div style={card}><EmptyState icon={<BarChart3 size={22} />} title="Aucune vente enregistrée" sub="Les ventes Pushcart et POS de l'ensemble des commerciaux s'afficheront ici." /></div>;
  }

  const channels = [
    { key: 'push', label: 'Pushcart', icon: ShoppingBag, color: P.pink, products: pushCount, count: pushCount, amount: pushAmount },
    { key: 'pos', label: 'Point de vente (POS)', icon: Store, color: P.blue, products: posQty, count: posCount, amount: posAmount },
    { key: 'all', label: 'Total consolidé', icon: Coins, color: P.green, products: pushCount + posQty, count: pushCount + posCount, amount: total },
  ];

  return (
    <div style={{ ...card, padding: 16 }}>
      <CardTitle icon={BarChart3} label="Vue globale des ventes (Pushcart et POS)"
        right={failed > 0 ? <Pill bg="#FBEFD6" fg="#7A4F00">Données partielles : {failed} commercial(aux) non chargé(s)</Pill> : undefined} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 12 }}>
        {channels.map((c) => (
          <div key={c.key} style={{ border: `1px solid ${P.warmL}`, borderTop: `3px solid ${c.color}`, borderRadius: 14, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10, color: c.color, fontSize: 12, fontWeight: 800 }}>
              <c.icon size={14} /> {c.label}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ background: P.pale, borderRadius: 10, padding: '8px 10px' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: P.muted, margin: 0 }}>Produits vendus</p>
                <p style={{ fontSize: 16, fontWeight: 800, color: P.text, margin: '2px 0 0' }}>{c.products}</p>
              </div>
              <div style={{ background: P.pale, borderRadius: 10, padding: '8px 10px' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: P.muted, margin: 0 }}>Ventes réalisées</p>
                <p style={{ fontSize: 16, fontWeight: 800, color: P.text, margin: '2px 0 0' }}>{c.count}</p>
              </div>
            </div>
            <p style={{ fontSize: 10, fontWeight: 700, color: P.muted, margin: '10px 0 0' }}>Montant total</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: P.text, margin: '2px 0 0' }}>{fmt(c.amount)}</p>
            {c.key !== 'all' && total > 0 && (
              <>
                <div style={{ height: 5, borderRadius: 9, background: P.surface, marginTop: 8, overflow: 'hidden' }}>
                  <div style={{ width: `${(c.amount / total) * 100}%`, height: '100%', background: c.color, borderRadius: 9 }} />
                </div>
                <p style={{ fontSize: 10, color: P.muted, margin: '4px 0 0' }}>{Math.round((c.amount / total) * 100)} % du montant total</p>
              </>
            )}
          </div>
        ))}
      </div>
      <p style={{ fontSize: 11, color: P.muted, margin: '12px 0 0' }}>
        Pour le canal Pushcart, « produits vendus » correspond au nombre d'achats enregistrés : la quantité détaillée n'existe pas côté achats terrain.
      </p>
    </div>
  );
};

/* ─── Carte (ventes POS + achats Pushcart) ──────────────── */
const SalesMap = ({ sales, purchases }: { sales: Sale[]; purchases: Purchase[] }) => {
  const mapEl = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const gpsSales = useMemo(() => sales.filter((s) => s.latitude != null && s.longitude != null), [sales]);
  const gpsPurchases = useMemo(() => purchases.filter((p) => p.latitude != null && p.longitude != null), [purchases]);
  const totalGps = gpsSales.length + gpsPurchases.length;

  useEffect(() => {
    if (!totalGps) return;
    let cancelled = false;
    let map: any;
    setStatus('loading');
    ensureLeaflet().then((L) => {
      if (cancelled || !mapEl.current) return;
      map = L.map(mapEl.current);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(map);
      const markers: any[] = [];
      const mk = (lat: number, lng: number, color: string, html: string) => {
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:24px;height:24px;border-radius:50%;background:${color};border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>`,
          iconSize: [24, 24], iconAnchor: [12, 12],
        });
        markers.push(L.marker([lat, lng], { icon }).addTo(map).bindPopup(html));
      };
      gpsSales.forEach((s) => mk(s.latitude as number, s.longitude as number, P.blue,
        `<b>Vente POS</b><br>${esc(s.product_variant_name)}<br>${esc(s.customer_name)}<br><b>${esc(fmt(parseFloat(s.total_amount)))}</b>`));
      gpsPurchases.forEach((p) => mk(p.latitude, p.longitude, P.pink,
        `<b>Achat Pushcart</b><br>${esc(fullName(p))}<br>${esc(p.pushcard_type)} · ${esc(p.zone)}<br><b>${esc(fmt(parseFloat(p.amount)))}</b>${p.sales_total ? `<br>Vente POS liée : ${esc(fmt(parseFloat(p.sales_total)))}` : ''}`));
      if (markers.length === 1) map.setView(markers[0].getLatLng(), 15);
      else map.fitBounds(L.featureGroup(markers).getBounds().pad(0.15));
      setStatus('ready');
    }).catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; if (map) map.remove(); };
  }, [gpsSales, gpsPurchases, totalGps]);

  if (!totalGps) return <EmptyState icon={<MapIcon size={22} />} title="Aucune donnée GPS" sub="Les ventes POS et les achats Pushcart géolocalisés s'afficheront ici." />;

  const caSales = gpsSales.reduce((a, s) => a + (parseFloat(s.total_amount) || 0), 0);
  const caPurchases = gpsPurchases.reduce((a, p) => a + (parseFloat(p.amount) || 0), 0);
  const stats = [
    { label: 'Ventes POS localisées', val: gpsSales.length, icon: MapPin, color: P.blue },
    { label: 'Achats localisés', val: gpsPurchases.length, icon: ShoppingBag, color: P.pink },
    { label: 'CA ventes POS', val: fmt(caSales), icon: Coins, color: P.teal },
    { label: 'CA achats', val: fmt(caPurchases), icon: Coins, color: P.orange },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
        {stats.map((c) => (
          <div key={c.label} style={{ border: `1px solid ${P.warmL}`, borderLeft: `3px solid ${c.color}`, borderRadius: 12, padding: '10px 12px' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: P.muted, margin: 0, display: 'flex', alignItems: 'center', gap: 5 }}><c.icon size={11} style={{ color: c.color }} /> {c.label}</p>
            <p style={{ fontSize: 15, fontWeight: 800, color: P.text, margin: '3px 0 0' }}>{c.val}</p>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 14px', background: P.pale, borderRadius: 10, flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: P.text }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: P.blue }} /> Ventes POS
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: P.text }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: P.pink }} /> Achats Pushcart
        </span>
      </div>
      <div style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${P.warmL}` }}>
        <div style={{ position: 'relative', height: 380 }}>
          <div ref={mapEl} style={{ height: '100%', width: '100%', background: P.surface }} />
          {status !== 'ready' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: P.surface, zIndex: 500 }}>
              {status === 'error'
                ? <p style={{ fontSize: 12, color: '#9A2D10', fontWeight: 600 }}>Impossible de charger la carte. Vérifiez votre connexion.</p>
                : <Spinner />}
            </div>
          )}
        </div>
        <div style={{ padding: '9px 14px', background: P.surface, borderTop: `1px solid ${P.warmL}`, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4, fontSize: 11, color: P.muted, fontWeight: 600 }}>
          <span>{totalGps} point(s) localisé(s) · {gpsSales.length} vente(s) POS · {gpsPurchases.length} achat(s)</span>
          <span>Cliquez sur un marqueur pour les détails</span>
        </div>
      </div>
    </div>
  );
};

/* ─── Graphique de performance ──────────────────────────── */
const PerformanceChart = ({ data }: { data: PerformanceData | null }) => {
  if (!data?.monthly_performance?.length)
    return <EmptyState icon={<BarChart3 size={22} />} title="Aucune donnée de performance" sub="Les données s'afficheront ici une fois disponibles." />;

  const chartData = data.monthly_performance.map((m) => ({
    label: `${m.month.split(' ')[0].slice(0, 3)} ${String(m.year).slice(2)}`,
    revenue: m.total_revenue, products: m.total_products_sold,
  }));
  const growth = data.performance_indicators.growth_rate;
  const best = data.performance_indicators.best_month;
  const worst = data.performance_indicators.worst_month;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
        <Kpi icon={Coins} label="Revenus sur la période" value={fmt(data.summary.total_revenue)} color={P.teal} />
        <Kpi icon={Package} label="Produits vendus" value={data.summary.total_products_sold} color={P.blue} />
        <Kpi icon={Users} label="Clients" value={data.summary.total_customers} color={P.purple} />
        <Kpi icon={Award} label="Performance" value={`${data.summary.overall_performance.toFixed(1)} %`} color={P.green} />
      </div>

      <div style={{ ...card, boxShadow: 'none', padding: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: P.text, margin: '0 0 2px' }}>Évolution mensuelle</p>
        <p style={{ fontSize: 11, color: P.muted, margin: '0 0 10px' }}>Barres : revenus (XOF) · Ligne : produits vendus</p>
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 6, right: 6, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={P.surface} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: P.muted }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="r" tick={{ fontSize: 10, fill: P.muted }} axisLine={false} tickLine={false} tickFormatter={compact} />
              <YAxis yAxisId="p" orientation="right" allowDecimals={false} tick={{ fontSize: 10, fill: P.muted }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: any, n: any) => (n === 'Revenus' ? fmt(Number(v)) : v)} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="r" dataKey="revenue" name="Revenus" fill={P.teal} radius={[5, 5, 0, 0]} />
              <Line yAxisId="p" type="monotone" dataKey="products" name="Produits" stroke={P.navy} strokeWidth={2.5} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
        {[{ title: 'Meilleur mois', d: best, color: P.green }, { title: 'Mois le plus faible', d: worst, color: P.orange }].map((c) => (
          <div key={c.title} style={{ border: `1px solid ${P.warmL}`, borderLeft: `3px solid ${c.color}`, borderRadius: 12, padding: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: P.muted, margin: '0 0 6px' }}>{c.title}</p>
            {c.d ? (
              <>
                <p style={{ fontSize: 13, fontWeight: 700, color: P.text, margin: 0 }}>{c.d.month}</p>
                <p style={{ fontSize: 17, fontWeight: 800, color: P.text, margin: '2px 0' }}>{fmt(c.d.total_revenue)}</p>
                <p style={{ fontSize: 11, color: P.muted, margin: 0 }}>{c.d.total_products_sold} produits · {c.d.total_customers} clients</p>
              </>
            ) : <p style={{ fontSize: 12, color: P.muted, margin: 0 }}>Aucune donnée</p>}
          </div>
        ))}
      </div>

      {growth !== 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 12, padding: '10px 14px', fontSize: 13, fontWeight: 700,
          background: growth > 0 ? '#DCF5EC' : '#FCE4DC', color: growth > 0 ? '#044D38' : '#7A2410' }}>
          {growth > 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
          Croissance : {growth > 0 ? '+' : ''}{growth.toFixed(2)} %
        </div>
      )}
    </div>
  );
};

/* ─── Achats Pushcart ───────────────────────────────────── */
const PurchasesList = ({ purchases }: { purchases: Purchase[] }) => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [filter, setFilter] = useState('all');
  useEffect(() => { setPage(1); }, [purchases]);
  if (!purchases.length) return <EmptyState icon={<ShoppingBag size={22} />} title="Aucun achat enregistré" sub="Aucun achat Pushcart sur la période sélectionnée." />;
  const types = Array.from(new Set(purchases.map((p) => p.pushcard_type)));
  const filtered = filter === 'all' ? purchases : purchases.filter((p) => p.pushcard_type === filter);
  const shown = filtered.slice((page - 1) * perPage, page * perPage);
  const total = filtered.reduce((a, p) => a + (parseFloat(p.amount) || 0), 0);
  const sel: React.CSSProperties = { ...inp, height: 34, width: 'auto', fontSize: 12, padding: '4px 10px' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
        <Filter size={13} style={{ color: P.muted }} />
        <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} aria-label="Type" style={sel}>
          <option value="all">Tous les types</option>
          {types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={perPage} onChange={(e) => { setPerPage(+e.target.value); setPage(1); }} aria-label="Lignes par page" style={sel}>
          {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n} par page</option>)}
        </select>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Pill bg={P.pale} fg={P.blueD}>{filtered.length} achat(s)</Pill>
          <Pill bg="#DCF5EC" fg="#044D38">{fmt(total)}</Pill>
        </span>
      </div>
      <div style={{ ...card, boxShadow: 'none', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead><tr>{['Client', 'Date', 'Type', 'Zone', 'Montant achat', 'Vente POS liée', 'Photo'].map((h) => <th key={h} style={tableTh}>{h}</th>)}</tr></thead>
            <tbody>
              {shown.map((p) => (
                <tr key={p.id} className="mv-row">
                  <td style={tableTd}><p style={{ fontWeight: 700, color: P.text, margin: 0 }}>{fullName(p)}</p><p style={{ fontSize: 10, color: P.muted, margin: 0 }}>{p.phone}</p></td>
                  <td style={tableTd}><p style={{ color: P.text, margin: 0, fontWeight: 600 }}>{new Date(p.purchase_date).toLocaleDateString('fr-FR')}</p><p style={{ fontSize: 10, color: P.muted, margin: 0 }}>{new Date(p.purchase_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p></td>
                  <td style={tableTd}><Pill bg="#EADFFB" fg="#4B2A94">{p.pushcard_type}</Pill></td>
                  <td style={tableTd}><p style={{ color: P.text, margin: 0, fontWeight: 600 }}>{p.zone}</p><p style={{ fontSize: 10, color: P.muted, margin: 0 }}>{p.base}</p></td>
                  <td style={{ ...tableTd, fontWeight: 800, color: P.blueD, whiteSpace: 'nowrap' }}>{fmt(parseFloat(p.amount))}</td>
                  <td style={{ ...tableTd, whiteSpace: 'nowrap' }}>{p.sales_total ? <Pill bg={P.pale} fg={P.blueD}>{fmt(parseFloat(p.sales_total))}</Pill> : <span style={{ color: P.muted }}>—</span>}</td>
                  <td style={tableTd}>
                    {p.photo
                      ? <img src={photoUrl(p.photo)} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', border: `1px solid ${P.warmL}` }} onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
                      : <div style={{ width: 36, height: 36, borderRadius: 8, background: P.pale, border: `1px dashed ${P.warm}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: P.gray }}><ImageIcon size={14} /></div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager page={page} perPage={perPage} count={filtered.length} onPage={setPage} />
      </div>
    </div>
  );
};

/* ─── Ventes POS ────────────────────────────────────────── */
const SalesList = ({ sales }: { sales: Sale[] }) => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [filter, setFilter] = useState('all');
  useEffect(() => { setPage(1); }, [sales]);
  if (!sales.length) return <EmptyState icon={<Store size={22} />} title="Aucune vente POS enregistrée" sub="Aucune vente au point de vente sur la période sélectionnée." />;
  const formats = Array.from(new Set(sales.map((s) => s.format).filter(Boolean)));
  const filtered = filter === 'all' ? sales : sales.filter((s) => s.format === filter);
  const shown = filtered.slice((page - 1) * perPage, page * perPage);
  const caTotal = filtered.reduce((a, s) => a + parseFloat(s.total_amount || '0'), 0);
  const sel: React.CSSProperties = { ...inp, height: 34, width: 'auto', fontSize: 12, padding: '4px 10px' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
        <Kpi icon={Store} label="Ventes POS" value={filtered.length} color={P.blue} />
        <Kpi icon={Coins} label="CA total" value={fmt(caTotal)} color={P.green} />
        <Kpi icon={MapPin} label="Géolocalisées" value={filtered.filter((s) => s.latitude && s.longitude).length} color={P.teal} />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
        <Filter size={13} style={{ color: P.muted }} />
        <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} aria-label="Format" style={sel}>
          <option value="all">Tous les formats</option>
          {formats.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <select value={perPage} onChange={(e) => { setPerPage(+e.target.value); setPage(1); }} aria-label="Lignes par page" style={sel}>
          {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n} par page</option>)}
        </select>
      </div>
      <div style={{ ...card, boxShadow: 'none', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead><tr>{['Client', 'Produit', 'Format', 'Qté', 'Date', 'Montant', 'GPS'].map((h) => <th key={h} style={tableTh}>{h}</th>)}</tr></thead>
            <tbody>
              {shown.map((s) => (
                <tr key={s.id} className="mv-row">
                  <td style={{ ...tableTd, fontWeight: 700, color: P.text }}>{s.customer_name || '—'}</td>
                  <td style={{ ...tableTd, fontWeight: 600, color: P.text }}>{s.product_variant_name}</td>
                  <td style={tableTd}>{s.format ? <Pill bg={P.pale} fg={P.blueD}>{s.format}</Pill> : <span style={{ color: P.muted }}>—</span>}</td>
                  <td style={{ ...tableTd, fontWeight: 600 }}>{s.quantity}</td>
                  <td style={tableTd}><p style={{ color: P.text, margin: 0, fontWeight: 600 }}>{new Date(s.created_at).toLocaleDateString('fr-FR')}</p><p style={{ fontSize: 10, color: P.muted, margin: 0 }}>{new Date(s.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p></td>
                  <td style={{ ...tableTd, fontWeight: 800, color: P.blueD, whiteSpace: 'nowrap' }}>{fmt(parseFloat(s.total_amount))}</td>
                  <td style={tableTd}>{s.latitude && s.longitude ? <Pill bg="#DCF5EC" fg="#044D38"><MapPin size={9} /> Oui</Pill> : <span style={{ color: P.muted }}>—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager page={page} perPage={perPage} count={filtered.length} onPage={setPage} />
      </div>
    </div>
  );
};

/* ─── Sélecteur de zones ────────────────────────────────── */
const ZonesSelect = ({ selected, villes, loadingVilles, onChange }: {
  selected: string[]; villes: Ville[]; loadingVilles: boolean; onChange: (zones: string[]) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const toggle = (nom: string) => onChange(selected.includes(nom) ? selected.filter((z) => z !== nom) : [...selected, nom]);
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? villes.filter((v) => v.nom.toLowerCase().includes(q) || v.district_nom?.toLowerCase().includes(q)) : villes;
  }, [villes, query]);
  return (
    <div style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        style={{ ...inp, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left',
          borderColor: open ? P.blue : P.warm, color: selected.length ? P.text : P.muted }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {loadingVilles ? 'Chargement…' : selected.length > 0 ? `${selected.length} zone(s) sélectionnée(s)` : 'Sélectionner des zones…'}
        </span>
        <ChevronDown size={14} style={{ flexShrink: 0, marginLeft: 8, color: P.muted, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
          {selected.map((z) => (
            <span key={z} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 6px 3px 10px', borderRadius: 9999, background: P.pale, border: `1px solid ${P.warmL}`, color: P.blueD, fontSize: 11, fontWeight: 700 }}>
              {z}
              <button type="button" onClick={() => toggle(z)} aria-label={`Retirer ${z}`} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: P.red }}><X size={11} /></button>
            </span>
          ))}
        </div>
      )}
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, marginTop: 4, background: '#fff', border: `1px solid ${P.warm}`, borderRadius: 12, boxShadow: '0 14px 34px rgba(10,21,32,0.18)', overflow: 'hidden' }}>
            <div style={{ padding: 8, borderBottom: `1px solid ${P.surface}` }}>
              {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
              <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher une ville ou un district…" style={{ ...inp, height: 34, fontSize: 12 }} />
            </div>
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              {loadingVilles ? <div style={{ padding: 16, textAlign: 'center', fontSize: 12, color: P.muted }}>Chargement…</div>
                : list.length === 0 ? <div style={{ padding: 16, textAlign: 'center', fontSize: 12, color: P.muted }}>Aucune ville trouvée</div>
                : list.map((v) => {
                  const on = selected.includes(v.nom);
                  return (
                    <button key={v.id} type="button" className="mv-row" onClick={() => toggle(v.nom)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 14px', border: 'none', background: on ? P.pale : 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                      <span style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, border: `1.5px solid ${on ? P.blue : P.warm}`, background: on ? P.blue : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {on && <svg viewBox="0 0 12 12" fill="none" width="10" height="10"><polyline points="1.5,6 4.5,9 10.5,3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                      </span>
                      <span>
                        <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: P.text }}>{v.nom}</span>
                        <span style={{ display: 'block', fontSize: 10, color: P.muted }}>{v.district_nom}</span>
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/* ─── Formulaire vendeur ────────────────────────────────── */
const VendorForm = ({ data, onChange, onPhoto, photoPreview, pointsOfSale, loadingPOS, isEditMode, onApproved, villes, loadingVilles, onZonesChange }: {
  data: Partial<FormVendor>; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onPhoto: (e: React.ChangeEvent<HTMLInputElement>) => void; photoPreview: string | null;
  pointsOfSale: PointOfSale[]; loadingPOS: boolean; isEditMode: boolean;
  onApproved: (v: boolean) => void; villes: Ville[]; loadingVilles: boolean;
  onZonesChange: (zones: string[]) => void;
}) => {
  const iconStyle: React.CSSProperties = { position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: P.muted, pointerEvents: 'none' };
  const withIcon: React.CSSProperties = { ...inp, paddingLeft: 32 };
  return (
    <div className="mv-form-grid">
      <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 76, height: 76, borderRadius: 16, overflow: 'hidden', flexShrink: 0, background: P.pale, border: `2px dashed ${P.warm}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {photoPreview ? <img src={photoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={24} style={{ color: P.gray }} />}
        </div>
        <label className="mv-btn" style={{ ...btnSecondary, cursor: 'pointer' }}>
          <UploadCloud size={14} /> {photoPreview ? 'Changer la photo' : 'Ajouter une photo'}
          <input type="file" style={{ display: 'none' }} onChange={onPhoto} accept="image/*" />
        </label>
      </div>
      {!isEditMode && (
        <>
          <Field label="Nom d'utilisateur *">
            <div style={{ position: 'relative' }}><span style={iconStyle}><User size={13} /></span>
              <input type="text" name="username" autoComplete="off" value={data.username || ''} onChange={onChange} style={withIcon} placeholder="nom_utilisateur" /></div>
          </Field>
          <Field label="Mot de passe *">
            <div style={{ position: 'relative' }}><span style={iconStyle}><Key size={13} /></span>
              <input type="password" name="password" autoComplete="new-password" value={data.password || ''} onChange={onChange} style={withIcon} placeholder="••••••••" /></div>
          </Field>
        </>
      )}
      <Field label="Prénom *"><input type="text" name="first_name" value={data.first_name || ''} onChange={onChange} style={inp} /></Field>
      <Field label="Nom *"><input type="text" name="last_name" value={data.last_name || ''} onChange={onChange} style={inp} /></Field>
      <Field label="Téléphone *">
        <div style={{ position: 'relative' }}><span style={iconStyle}><Phone size={13} /></span>
          <input type="tel" name="phone" value={data.phone || ''} onChange={onChange} style={withIcon} /></div>
      </Field>
      <Field label="Email">
        <div style={{ position: 'relative' }}><span style={iconStyle}><Mail size={13} /></span>
          <input type="email" name="email" value={data.email || ''} onChange={onChange} style={withIcon} /></div>
      </Field>
      <Field label="Statut">
        <select name="status" value={data.status || 'actif'} onChange={onChange} style={{ ...inp, cursor: 'pointer' }}>
          <option value="actif">Actif</option><option value="inactif">Inactif</option>
          <option value="en_conge">En congé</option><option value="suspendu">Suspendu</option>
        </select>
      </Field>
      <Field label="Type de véhicule">
        <select name="vehicle_type" value={data.vehicle_type || 'moto'} onChange={onChange} style={{ ...inp, cursor: 'pointer' }}>
          {Object.entries(VEHICLE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </Field>
      <Field label="N° de véhicule"><input type="text" name="vehicle_id" value={data.vehicle_id || ''} onChange={onChange} style={inp} /></Field>
      <Field label="Point de vente *">
        <select name="point_of_sale" value={data.point_of_sale || ''} onChange={onChange} style={{ ...inp, cursor: 'pointer', opacity: loadingPOS ? 0.5 : 1 }} disabled={loadingPOS}>
          <option value="">— Sélectionner —</option>
          {pointsOfSale.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.commune})</option>)}
        </select>
      </Field>
      <Field label={isEditMode ? 'Zones de distribution' : 'Zones de distribution *'} span>
        <ZonesSelect selected={Array.isArray(data.zones) ? data.zones : []} villes={villes} loadingVilles={loadingVilles} onChange={onZonesChange} />
      </Field>
      <Field label="Performance (%)"><input type="number" name="performance" value={data.performance ?? 0} onChange={onChange} min="0" max="100" style={inp} /></Field>
      <Field label="Ventes moyennes / jour (XOF)"><input type="number" name="average_daily_sales" value={data.average_daily_sales ?? 0} onChange={onChange} min="0" style={inp} /></Field>
      <div style={{ gridColumn: '1 / -1' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: P.pale, borderRadius: 10, border: `1px solid ${P.warmL}`, cursor: 'pointer' }}>
          <input type="checkbox" checked={!!data.is_approved} onChange={(e) => onApproved(e.target.checked)} style={{ accentColor: P.blue, width: 16, height: 16 }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: P.text }}>Vendeur approuvé</span>
          {data.is_approved && <span style={{ marginLeft: 'auto' }}><Pill bg="#DCF5EC" fg="#044D38"><ShieldCheck size={10} /> Approuvé</Pill></span>}
        </label>
      </div>
      <Field label="Notes" span>
        <textarea name="notes" value={data.notes || ''} onChange={onChange} rows={3} style={{ ...inp, height: 'auto', padding: '8px 12px', resize: 'vertical' }} />
      </Field>
    </div>
  );
};

/* ─── Modale (définie hors du composant : évite la perte de focus à chaque frappe) ─── */
const ModalWrapper = ({ onClose, title, subtitle, icon: Icon, children, footer }: {
  onClose: () => void; title: string; subtitle?: string; icon: any; children: React.ReactNode; footer: React.ReactNode;
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(10,21,32,0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
      <div className="mv-pop" style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 760, maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(10,21,32,0.25)' }}>
        <div style={{ background: P.banner, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.16)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={17} color="#fff" /></div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: 0 }}>{title}</h3>
              {subtitle && <p style={{ fontSize: 11, color: 'rgba(200,230,248,0.85)', margin: '2px 0 0' }}>{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} aria-label="Fermer" style={{ padding: 7, background: 'rgba(255,255,255,0.16)', border: 'none', borderRadius: 9, cursor: 'pointer', color: '#fff', display: 'flex' }}><X size={15} /></button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: 20 }}>{children}</div>
        <div style={{ borderTop: `1px solid ${P.warmL}`, padding: '14px 20px', display: 'flex', justifyContent: 'flex-end', gap: 10, background: P.surface, flexShrink: 0 }}>{footer}</div>
      </div>
    </div>
  );
};

const FormErrors = ({ errors }: { errors: string[] }) => errors.length === 0 ? null : (
  <div role="alert" style={{ display: 'flex', gap: 10, padding: '10px 14px', background: '#FEF0ED', border: '1px solid #F5C4B3', borderRadius: 12, fontSize: 12, color: '#9A2D10', marginBottom: 16 }}>
    <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
    <ul style={{ margin: 0, paddingLeft: 16, fontWeight: 600 }}>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
═══════════════════════════════════════════════════════════ */
type DetailTab = 'activities' | 'performance' | 'notes' | 'purchases' | 'ventes_pos' | 'map';
type StatusFilter = 'all' | VendorStatus | 'a_approuver';
type SortKey = 'performance' | 'name' | 'sales' | 'activity';
const EMPTY_FILTER: DateFilter = { startDate: '', endDate: '' };

const MobileVendorsManagement = ({ selectedPOS }: Props) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('performance');
  const [page, setPage] = useState(1);

  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showVendorDetails, setShowVendorDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<FormVendor>>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newVendor, setNewVendor] = useState<FormVendor>(getDefaultVendorForm(selectedPOS));
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [sales, setSales] = useState<Sale[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>('activities');
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [pointsOfSale, setPointsOfSale] = useState<PointOfSale[]>([]);
  const [loadingPOS, setLoadingPOS] = useState(false);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loadingPerformance, setLoadingPerformance] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>(EMPTY_FILTER);       // saisie en cours
  const [appliedFilter, setAppliedFilter] = useState<DateFilter>(EMPTY_FILTER); // filtre appliqué
  const [updatingPerformance, setUpdatingPerformance] = useState<number | null>(null);
  const [performanceDays, setPerformanceDays] = useState(30);
  const [villes, setVilles] = useState<Ville[]>([]);
  const [loadingVilles, setLoadingVilles] = useState(false);

  /* Agrégats globaux (page principale) : ventes POS + achats Pushcart de tous les commerciaux affichés */
  const [allSales, setAllSales] = useState<Sale[]>([]);
  const [allPurchases, setAllPurchases] = useState<Purchase[]>([]);
  const [loadingAggregates, setLoadingAggregates] = useState(false);
  const [aggFailed, setAggFailed] = useState(0);
  const [refreshTick, setRefreshTick] = useState(0);

  /* ── Chargements ── */
  useEffect(() => {
    (async () => {
      try { setLoadingVilles(true); const r = await fetch('https://api.lanfialink.com/api/villes/'); if (r.ok) setVilles(extractList<Ville>(await r.json())); }
      catch { /* ignore */ } finally { setLoadingVilles(false); }
    })();
  }, []);

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true);
      const url = selectedPOS?.pos_id ? `/mobile-vendors/?point_of_sale=${selectedPOS.pos_id}` : '/mobile-vendors/';
      const res = await apiService.get(url);
      if (!res.ok) throw new Error('Erreur de chargement des commerciaux');
      // Zones nettoyées dès la lecture : répare l'affichage même si des données corrompues existent en base.
      setVendors(extractList<Vendor>(await res.json()).map((v) => ({ ...v, zones: sanitizeZones(v.zones) })));
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [selectedPOS?.pos_id]);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  useEffect(() => {
    (async () => {
      try {
        setLoadingPOS(true);
        const r = await apiService.get('/points-vente/');
        if (r.ok) setPointsOfSale(extractList<PointOfSale>(await r.json()).filter((p) => p.nature === 'distributeur_secondaire')); // uniquement les PDV
      } catch { /* ignore */ } finally { setLoadingPOS(false); }
    })();
  }, []);

  /* Ne recharge les agrégats que si la LISTE des commerciaux change (pas à chaque mise à jour de performance),
     avec 6 requêtes en parallèle maximum et protection contre les réponses obsolètes. */
  const vendorIdsKey = useMemo(() => vendors.map((v) => v.id).sort((a, b) => a - b).join(','), [vendors]);
  useEffect(() => {
    let cancelled = false;
    const ids = vendorIdsKey ? vendorIdsKey.split(',').map(Number) : [];
    if (!ids.length) { setAllSales([]); setAllPurchases([]); setAggFailed(0); return; }
    (async () => {
      setLoadingAggregates(true);
      let failed = 0;
      const results = await mapLimit(ids, 6, async (id) => {
        try {
          const [sr, vr] = await Promise.all([apiService.get(`/salespos/?vendor=${id}`), apiService.get(`/mobile-vendors/${id}/`)]);
          const s = sr.ok ? extractList<Sale>(await sr.json()) : null;
          const v = vr.ok ? await vr.json() : null;
          if (!s || !v) failed++;
          return { sales: s ?? [], purchases: ((v?.purchases ?? []) as Purchase[]) };
        } catch { failed++; return { sales: [] as Sale[], purchases: [] as Purchase[] }; }
      });
      if (cancelled) return;
      setAllSales(results.flatMap((r) => r.sales));
      setAllPurchases(results.flatMap((r) => r.purchases));
      setAggFailed(failed);
      setLoadingAggregates(false);
    })();
    return () => { cancelled = true; };
  }, [vendorIdsKey, refreshTick]);

  const fetchVendorSales = async (id: number) => {
    try { setLoadingSales(true); const r = await apiService.get(`/salespos/?vendor=${id}`); if (r.ok) setSales(extractList<Sale>(await r.json())); }
    catch { /* ignore */ } finally { setLoadingSales(false); }
  };

  const fetchVendorPerformance = async (id: number, f: DateFilter = appliedFilter) => {
    try {
      setLoadingPerformance(true);
      let url = `/sales/performance/?vendor_id=${id}`;
      if (f.startDate) url += `&start_date=${f.startDate}`;
      if (f.endDate) url += `&end_date=${f.endDate}`;
      const r = await apiService.get(url);
      if (r.ok) setPerformanceData(await r.json());
    } catch { /* ignore */ } finally { setLoadingPerformance(false); }
  };

  const viewVendorDetails = async (vendor: Vendor) => {
    try {
      // On vide les données du vendeur précédent pour ne jamais les afficher par erreur.
      setDateFilter(EMPTY_FILTER); setAppliedFilter(EMPTY_FILTER);
      setSales([]); setActivities([]); setPerformanceData(null); setIsEditing(false); setFormErrors([]);
      const r = await apiService.get(`/mobile-vendors/${vendor.id}/`);
      if (!r.ok) throw new Error('Erreur de chargement du vendeur');
      const data: Vendor = await r.json();
      const cleanZones = sanitizeZones(data.zones);
      setSelectedVendor({ ...data, zones: cleanZones });
      setEditForm({ ...data, zones: cleanZones, point_of_sale: data.point_of_sale?.toString() || '', username: '', password: '' });
      setPhotoPreview(data.photo || null);
      setShowVendorDetails(true); setActiveTab('activities');
      await Promise.all([fetchVendorPerformance(data.id, EMPTY_FILTER), fetchVendorSales(data.id)]);
    } catch (e: any) { setError(e.message); }
  };

  useEffect(() => {
    if (!showVendorDetails || !selectedVendor?.id) return;
    let cancelled = false;
    (async () => {
      setLoadingActivities(true);
      try {
        const r = await apiService.get(`/vendor-activities/?vendor=${selectedVendor.id}`);
        if (r.ok && !cancelled) setActivities(extractList<ActivityItem>(await r.json()));
      } finally { if (!cancelled) setLoadingActivities(false); }
    })();
    return () => { cancelled = true; };
  }, [selectedVendor?.id, showVendorDetails]);

  /* ── Actions ── */
  const closeDetails = () => { setShowVendorDetails(false); setIsEditing(false); setPhotoPreview(null); setFormErrors([]); };

  const createVendor = async () => {
    const errs = validateVendorForm(newVendor, true);
    if (errs.length) { setFormErrors(errs); return; }
    try {
      setSaving(true); setFormErrors([]);
      const r = await apiService.post('/mobile-vendors/', buildFD(newVendor, false), true);
      if (!r.ok) { const e = await r.json().catch(() => null); throw new Error(parseApiError(e, 'Erreur lors de la création')); }
      const created: Vendor = await r.json();
      setVendors((p) => [...p, { ...created, zones: sanitizeZones(created.zones) }]);
      setShowCreateForm(false); setNewVendor(getDefaultVendorForm(selectedPOS)); setPhotoPreview(null);
    } catch (e: any) { setFormErrors([e.message]); }
    finally { setSaving(false); }
  };

  const updateVendor = async () => {
    if (!selectedVendor) return;
    const errs = validateVendorForm(editForm, false);
    if (errs.length) { setFormErrors(errs); return; }
    try {
      setSaving(true); setFormErrors([]);
      const r = await apiService.patch(`/mobile-vendors/${selectedVendor.id}/`, buildFD(editForm, true), true);
      if (!r.ok) { const e = await r.json().catch(() => null); throw new Error(parseApiError(e, 'Erreur lors de la mise à jour')); }
      const updated: Vendor = await r.json();
      const withZones = { ...updated, zones: sanitizeZones(updated.zones) };
      setVendors((p) => p.map((v) => (v.id === updated.id ? { ...v, ...withZones } : v)));
      setSelectedVendor((p) => (p ? { ...p, ...withZones } : withZones));
      setIsEditing(false); setPhotoPreview(updated.photo || null);
    } catch (e: any) { setFormErrors([e.message]); }
    finally { setSaving(false); }
  };

  const deleteVendor = async (id: number) => {
    if (!window.confirm('Supprimer ce vendeur ? Cette action est définitive.')) return;
    try {
      const r = await apiService.delete(`/mobile-vendors/${id}/`);
      if (!r.ok) throw new Error('Erreur lors de la suppression');
      setVendors((p) => p.filter((v) => v.id !== id));
      if (selectedVendor?.id === id) closeDetails();
    } catch (e: any) { setError(e.message); }
  };

  const updateVendorPerformance = async (vendorId: number) => {
    try {
      setUpdatingPerformance(vendorId);
      const r = await apiService.post(`/vendors/${vendorId}/update_performance/`, { days: performanceDays });
      if (!r.ok) throw new Error('Mise à jour de la performance impossible');
      const data: PerformanceUpdateResponse = await r.json();
      setVendors((p) => p.map((v) => (v.id === vendorId ? { ...v, performance: data.performance } : v)));
      if (selectedVendor?.id === vendorId) setSelectedVendor((p) => (p ? { ...p, performance: data.performance } : null));
    } catch (e: any) { setError(e.message); }
    finally { setUpdatingPerformance(null); }
  };

  /* Met à jour tous les commerciaux ; un échec isolé n'écrase plus les autres résultats. */
  const updateAllVendorsPerformance = async () => {
    try {
      setUpdatingPerformance(-1);
      const results = await mapLimit(vendors, 5, async (v) => {
        try {
          const r = await apiService.post(`/vendors/${v.id}/update_performance/`, { days: performanceDays });
          if (!r.ok) return { id: v.id, perf: null as number | null };
          const j: PerformanceUpdateResponse = await r.json();
          return { id: v.id, perf: typeof j.performance === 'number' ? j.performance : null };
        } catch { return { id: v.id, perf: null as number | null }; }
      });
      const map = new Map(results.filter((x) => x.perf !== null).map((x) => [x.id, x.perf as number]));
      setVendors((p) => p.map((v) => (map.has(v.id) ? { ...v, performance: map.get(v.id) as number } : v)));
      const failed = results.length - map.size;
      if (failed > 0) setError(`${failed} commercial(aux) n'ont pas pu être mis à jour.`);
    } finally { setUpdatingPerformance(null); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, isEdit = false) => {
    const { name, value, type } = e.target;
    const v: any = type === 'number' ? (value === '' ? 0 : Number(value)) : value;
    isEdit ? setEditForm((p) => ({ ...p, [name]: v })) : setNewVendor((p) => ({ ...p, [name]: v }));
  };
  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setFormErrors(['La photo dépasse 5 Mo.']); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
      isEdit ? setEditForm((p) => ({ ...p, photo: file })) : setNewVendor((p) => ({ ...p, photo: file }));
    };
    reader.readAsDataURL(file);
  };
  const handleApproved = (val: boolean, isEdit = false) =>
    isEdit ? setEditForm((p) => ({ ...p, is_approved: val })) : setNewVendor((p) => ({ ...p, is_approved: val }));
  const handleZonesChange = (zones: string[], isEdit = false) =>
    isEdit ? setEditForm((p) => ({ ...p, zones })) : setNewVendor((p) => ({ ...p, zones }));

  /* ── Données dérivées ── */
  const statusCounts = useMemo(() => {
    const c: Record<string, number> = { all: vendors.length, actif: 0, inactif: 0, en_conge: 0, suspendu: 0, a_approuver: 0 };
    vendors.forEach((v) => { c[v.status] = (c[v.status] || 0) + 1; if (!v.is_approved) c.a_approuver++; });
    return c;
  }, [vendors]);

  const filteredVendors = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const list = vendors.filter((v) => {
      if (statusFilter === 'a_approuver' ? v.is_approved : statusFilter !== 'all' && v.status !== statusFilter) return false;
      if (!q) return true;
      return fullName(v).toLowerCase().includes(q) || v.phone?.includes(q) || (v.email ?? '').toLowerCase().includes(q) || v.zones.some((z) => z.toLowerCase().includes(q));
    });
    const act = (v: Vendor) => (v.last_activity ? new Date(v.last_activity).getTime() : 0);
    return list.sort((a, b) =>
      sortKey === 'performance' ? (b.performance || 0) - (a.performance || 0)
        : sortKey === 'sales' ? (b.average_daily_sales || 0) - (a.average_daily_sales || 0)
        : sortKey === 'activity' ? act(b) - act(a)
        : fullName(a).localeCompare(fullName(b), 'fr'));
  }, [vendors, searchTerm, statusFilter, sortKey]);

  useEffect(() => { setPage(1); }, [searchTerm, statusFilter, sortKey, vendors.length]);

  const pageRows = filteredVendors.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const avgPerf = vendors.length ? Math.round(vendors.reduce((a, v) => a + (v.performance || 0), 0) / vendors.length) : 0;

  // Le filtre de période s'applique aux performances, ventes POS, achats et carte du vendeur ouvert.
  const periodSales = useMemo(() => sales.filter((s) => inRange(s.created_at, appliedFilter)), [sales, appliedFilter]);
  const periodPurchases = useMemo(
    () => (selectedVendor?.purchases ?? []).filter((p) => inRange(p.purchase_date || p.created_at, appliedFilter)),
    [selectedVendor?.purchases, appliedFilter]);
  const invalidRange = !!dateFilter.startDate && !!dateFilter.endDate && dateFilter.startDate > dateFilter.endDate;

  const applyPeriod = () => {
    if (!selectedVendor || invalidRange) return;
    setAppliedFilter(dateFilter);
    fetchVendorPerformance(selectedVendor.id, dateFilter);
  };
  const resetPeriod = () => {
    setDateFilter(EMPTY_FILTER); setAppliedFilter(EMPTY_FILTER);
    if (selectedVendor) fetchVendorPerformance(selectedVendor.id, EMPTY_FILTER);
  };

  const exportCsv = () => {
    const head = ['Nom', 'Téléphone', 'Email', 'Statut', 'Approuvé', 'Véhicule', 'N° véhicule', 'Zones', 'Point de vente', 'Performance (%)', 'Ventes moy./jour (XOF)', "Date d'inscription", 'Dernière activité'];
    const rows = filteredVendors.map((v) => [fullName(v), v.phone, v.email ?? '', STATUS_CFG[v.status]?.label ?? v.status, v.is_approved ? 'Oui' : 'Non',
      VEHICLE_LABEL[v.vehicle_type] ?? v.vehicle_type, v.vehicle_id ?? '', v.zones.join(' | '), v.point_of_sale_name ?? '', Math.round(v.performance || 0),
      Math.round(v.average_daily_sales || 0), new Date(v.date_joined).toLocaleDateString('fr-FR'), v.last_activity ? new Date(v.last_activity).toLocaleDateString('fr-FR') : '']);
    const csv = '\uFEFF' + [head, ...rows].map((r) => r.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(';')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = 'commerciaux_terrain.csv'; a.click();
  };

  const refreshAll = () => { fetchVendors(); setRefreshTick((t) => t + 1); };

  /* ─── Détails d'un vendeur ───────────────────────────── */
  const renderVendorDetails = () => {
    if (!selectedVendor) return null;
    const perf = selectedVendor.performance;
    const grade = perf >= 80 ? { label: 'Excellent', bg: '#DCF5EC', fg: '#044D38' } : perf >= 60 ? { label: 'Bon', bg: '#DDEBFA', fg: '#0A4A80' } : perf >= 40 ? { label: 'Moyen', bg: '#FBEFD6', fg: '#7A4F00' } : { label: 'Faible', bg: '#FCE4DC', fg: '#7A2410' };
    const mapCount = periodSales.filter((s) => s.latitude && s.longitude).length + periodPurchases.filter((p) => p.latitude && p.longitude).length;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* En-tête */}
        <div style={{ background: P.banner, borderRadius: 16, padding: '18px 22px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button className="mv-btn" onClick={closeDetails} aria-label="Retour à la liste"
              style={{ padding: 8, borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.16)', cursor: 'pointer', color: '#fff', display: 'flex' }}><ChevronLeft size={16} /></button>
            <Avatar vendor={selectedVendor} size="lg" />
            <div>
              <div style={{ marginBottom: 6 }}><Pill bg={grade.bg} fg={grade.fg}>{grade.label} · {Math.round(perf)} %</Pill></div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>{fullName(selectedVendor)}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                <StatusBadge status={selectedVendor.status} />
                {selectedVendor.is_approved
                  ? <Pill bg="rgba(255,255,255,0.18)" fg="#fff"><ShieldCheck size={10} /> Approuvé</Pill>
                  : <Pill bg="#FBEFD6" fg="#7A4F00">À approuver</Pill>}
                <span style={{ fontSize: 12, color: 'rgba(200,230,248,0.9)', fontWeight: 600 }}>{VEHICLE_LABEL[selectedVendor.vehicle_type] ?? selectedVendor.vehicle_type}</span>
              </div>
            </div>
          </div>
          {!isEditing && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="mv-btn" onClick={() => { setIsEditing(true); setFormErrors([]); }}
                style={{ ...btnPrimary, background: 'rgba(255,255,255,0.16)' }}><Edit size={13} /> Modifier</button>
              <button className="mv-btn" onClick={() => deleteVendor(selectedVendor.id)} aria-label="Supprimer le vendeur"
                style={{ padding: 9, borderRadius: 10, background: P.red, color: '#fff', cursor: 'pointer', display: 'flex', border: 'none' }}><Trash2 size={14} /></button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div style={{ ...card, padding: 20 }}>
            <CardTitle icon={Edit} label="Modifier le profil" />
            <FormErrors errors={formErrors} />
            <VendorForm data={editForm} isEditMode onChange={(e) => handleChange(e, true)} onPhoto={(e) => handlePhoto(e, true)}
              photoPreview={photoPreview} pointsOfSale={pointsOfSale} loadingPOS={loadingPOS}
              onApproved={(v) => handleApproved(v, true)} villes={villes} loadingVilles={loadingVilles}
              onZonesChange={(z) => handleZonesChange(z, true)} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${P.warmL}` }}>
              <button className="mv-btn" style={btnSecondary} disabled={saving}
                onClick={() => { setIsEditing(false); setPhotoPreview(selectedVendor.photo || null); setFormErrors([]); setEditForm({ ...selectedVendor, point_of_sale: selectedVendor.point_of_sale?.toString() || '', username: '', password: '' }); }}>Annuler</button>
              <button className="mv-btn" onClick={updateVendor} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>
                {saving ? <Loader2 size={13} className="mv-spin" /> : <Save size={13} />} {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Filtre de période */}
            <div style={{ ...card, padding: '14px 16px', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 12 }}>
              {([['Date début', 'startDate'], ['Date fin', 'endDate']] as const).map(([label, key]) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: P.mutedD, marginBottom: 5 }}>{label}</label>
                  <input type="date" value={dateFilter[key]} onChange={(e) => setDateFilter((p) => ({ ...p, [key]: e.target.value }))} style={{ ...inp, width: 160, height: 36 }} />
                </div>
              ))}
              <button className="mv-btn" onClick={applyPeriod} disabled={invalidRange} style={{ ...btnPrimary, opacity: invalidRange ? 0.5 : 1 }}>Appliquer</button>
              <button className="mv-btn" onClick={resetPeriod} style={btnSecondary}>Réinitialiser</button>
              <div style={{ marginLeft: 'auto', fontSize: 11, color: invalidRange ? '#9A2D10' : P.muted, fontWeight: 600, textAlign: 'right' }}>
                {invalidRange ? 'La date de début doit précéder la date de fin.'
                  : performanceData ? <>Période de performance : {new Date(performanceData.period.start_date).toLocaleDateString('fr-FR')} → {new Date(performanceData.period.end_date).toLocaleDateString('fr-FR')}</> : null}
                <br /><span style={{ fontWeight: 500 }}>Appliqué aux performances, ventes POS, achats et à la carte.</span>
              </div>
            </div>

            {/* Fiches d'information */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
              <div style={{ ...card, padding: 16 }}>
                <CardTitle icon={UserRound} label="Informations" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { icon: Phone, val: selectedVendor.phone, color: P.green },
                    { icon: Mail, val: selectedVendor.email || 'Non renseigné', color: P.purple },
                    { icon: Calendar, val: `Membre depuis ${new Date(selectedVendor.date_joined).toLocaleDateString('fr-FR')}`, color: P.teal },
                    { icon: Clock, val: selectedVendor.last_activity ? `Actif le ${new Date(selectedVendor.last_activity).toLocaleDateString('fr-FR')}` : 'Activité inconnue', color: P.orange },
                  ].map(({ icon: Ic, val, color }, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', background: P.pale, borderRadius: 10 }}>
                      <Ic size={13} style={{ color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: P.text, fontWeight: 600 }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ ...card, padding: 16 }}>
                <CardTitle icon={MapPin} label="Zones de distribution" />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedVendor.zones.map((z, i) => <Pill key={i} bg={P.pale} fg={P.blueD}><MapPin size={9} /> {z}</Pill>)}
                  {selectedVendor.zones.length === 0 && <span style={{ fontSize: 12, color: P.muted }}>Aucune zone assignée</span>}
                </div>
              </div>
              <div style={{ ...card, padding: 16 }}>
                <CardTitle icon={BarChart3} label="Statistiques" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', background: P.pale, borderRadius: 10 }}>
                    <span style={{ fontSize: 11, color: P.muted, fontWeight: 600 }}>Performance</span><PerfBar value={selectedVendor.performance} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', background: P.pale, borderRadius: 10 }}>
                    <span style={{ fontSize: 11, color: P.muted, fontWeight: 600 }}>Ventes moy./jour</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: P.blueD }}>{fmt(selectedVendor.average_daily_sales)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '7px 10px', background: P.pale, borderRadius: 10 }}>
                    <span style={{ fontSize: 11, color: P.muted, fontWeight: 600 }}>Point de vente</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: P.text, textAlign: 'right' }}>{selectedVendor.point_of_sale_name || '—'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Onglets */}
            <div style={{ ...card, padding: 18 }}>
              <Tabs active={activeTab} onChange={setActiveTab} tabs={[
                { key: 'activities', label: 'Activités' },
                { key: 'performance', label: 'Performance' },
                { key: 'purchases', label: 'Pushcart', badge: periodPurchases.length },
                { key: 'ventes_pos', label: 'Ventes POS', badge: periodSales.length },
                { key: 'map', label: 'Carte', badge: mapCount },
                { key: 'notes', label: 'Notes' },
              ]} />
              {activeTab === 'activities' && (
                loadingActivities ? <Spinner /> : activities.length > 0
                  ? <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {activities.map((a) => (
                        <div key={a.id} className="mv-row" style={{ display: 'flex', gap: 12, padding: '12px 14px', borderRadius: 12, border: `1px solid ${P.warmL}` }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: P.blue, marginTop: 5, flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                              <p style={{ fontWeight: 700, color: P.text, fontSize: 13, margin: 0 }}>{a.activity_type}</p>
                              {a.location && <Pill bg="#DCF5EC" fg="#044D38"><Navigation size={9} /> GPS</Pill>}
                            </div>
                            <p style={{ fontSize: 11, color: P.muted, margin: '3px 0 0' }}>{new Date(a.timestamp).toLocaleString('fr-FR')}</p>
                            {a.notes && <p style={{ fontSize: 12, color: P.text, margin: '5px 0 0' }}>{a.notes}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  : <EmptyState icon={<Clock size={20} />} title="Aucune activité récente" />
              )}
              {activeTab === 'performance' && (loadingPerformance ? <Spinner /> : <PerformanceChart data={performanceData} />)}
              {activeTab === 'purchases' && <PurchasesList purchases={periodPurchases} />}
              {activeTab === 'ventes_pos' && (loadingSales ? <Spinner /> : <SalesList sales={periodSales} />)}
              {activeTab === 'map' && (loadingSales ? <Spinner /> : <SalesMap sales={periodSales} purchases={periodPurchases} />)}
              {activeTab === 'notes' && (
                selectedVendor.notes
                  ? <div style={{ padding: 16, background: P.pale, borderRadius: 12, border: `1px solid ${P.warmL}`, fontSize: 13, color: P.text, lineHeight: 1.7, whiteSpace: 'pre-line' }}>{selectedVendor.notes}</div>
                  : <EmptyState icon={<Edit size={20} />} title="Aucune note" sub="Modifiez le profil pour ajouter des notes." />
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  /* ─── Liste des vendeurs ─────────────────────────────── */
  const chips: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'Tous' }, { key: 'actif', label: 'Actifs' }, { key: 'inactif', label: 'Inactifs' },
    { key: 'en_conge', label: 'En congé' }, { key: 'suspendu', label: 'Suspendus' }, { key: 'a_approuver', label: 'À approuver' },
  ];

  const renderVendorList = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Filtres */}
      <div style={{ ...card, padding: 14, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 340 }}>
          <Search size={14} color={P.muted} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input type="text" placeholder="Nom, téléphone, email ou zone…" aria-label="Rechercher un commercial" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ ...inp, height: 36, paddingLeft: 32 }} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {chips.map((c) => {
            const on = statusFilter === c.key;
            return (
              <button key={c.key} onClick={() => setStatusFilter(c.key)} aria-pressed={on}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 9999, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  background: on ? P.blue : '#fff', color: on ? '#fff' : P.textSub, border: `1.5px solid ${on ? P.blue : P.warm}` }}>
                {c.label}
                <span style={{ background: on ? 'rgba(255,255,255,0.25)' : P.surface, borderRadius: 9999, padding: '0 7px', fontSize: 10 }}>{statusCounts[c.key] ?? 0}</span>
              </button>
            );
          })}
        </div>
        <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} aria-label="Trier par" style={{ ...inp, width: 'auto', height: 36, cursor: 'pointer' }}>
          <option value="performance">Trier : performance</option>
          <option value="sales">Trier : ventes moy./jour</option>
          <option value="activity">Trier : dernière activité</option>
          <option value="name">Trier : nom</option>
        </select>
        <button className="mv-btn" onClick={exportCsv} disabled={!filteredVendors.length} style={{ ...btnSecondary, marginLeft: 'auto', height: 36, opacity: filteredVendors.length ? 1 : 0.5 }}>
          <Download size={13} /> Exporter CSV
        </button>
      </div>

      {/* Tableau */}
      <div style={{ ...card, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>{['Vendeur', 'Contact', 'Zones', 'Statut', 'Performance', 'Ventes moy./jour', 'Actions'].map((h) => <th key={h} style={tableTh}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {pageRows.length > 0 ? pageRows.map((vendor) => (
                <tr key={vendor.id} className="mv-row" onClick={() => viewVendorDetails(vendor)} style={{ cursor: 'pointer' }}>
                  <td style={tableTd}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar vendor={vendor} />
                      <div>
                        <p style={{ fontWeight: 700, color: P.text, margin: 0 }}>{fullName(vendor)}</p>
                        <p style={{ fontSize: 10, color: P.muted, margin: 0 }}>{VEHICLE_LABEL[vendor.vehicle_type] ?? vendor.vehicle_type}</p>
                      </div>
                    </div>
                  </td>
                  <td style={tableTd}>
                    <p style={{ color: P.text, margin: 0, fontWeight: 600 }}>{vendor.phone}</p>
                    <p style={{ fontSize: 10, color: P.muted, margin: 0 }}>{vendor.email || '—'}</p>
                  </td>
                  <td style={tableTd}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {vendor.zones.slice(0, 2).map((z, i) => <Pill key={i} bg={P.pale} fg={P.blueD}>{z}</Pill>)}
                      {vendor.zones.length > 2 && <Pill bg={P.surface} fg={P.muted}>+{vendor.zones.length - 2}</Pill>}
                      {vendor.zones.length === 0 && <span style={{ color: P.muted }}>—</span>}
                    </div>
                  </td>
                  <td style={tableTd}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                      <StatusBadge status={vendor.status} />
                      {vendor.is_approved
                        ? <span style={{ fontSize: 10, color: '#047857', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}><ShieldCheck size={9} /> Approuvé</span>
                        : <span style={{ fontSize: 10, color: '#7A4F00', fontWeight: 700 }}>À approuver</span>}
                    </div>
                  </td>
                  <td style={tableTd}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <PerfBar value={vendor.performance} />
                      <ActionBtn onClick={() => updateVendorPerformance(vendor.id)} title="Recalculer la performance">
                        {updatingPerformance === vendor.id || updatingPerformance === -1
                          ? <Loader2 size={12} className="mv-spin" style={{ color: P.blue }} />
                          : <RefreshCw size={12} style={{ color: P.muted }} />}
                      </ActionBtn>
                    </div>
                  </td>
                  <td style={{ ...tableTd, fontWeight: 700, color: P.blueD, whiteSpace: 'nowrap' }}>{fmt(vendor.average_daily_sales)}</td>
                  <td style={tableTd}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: P.blue, whiteSpace: 'nowrap' }}>Détails</span>
                      <ChevronRight size={12} style={{ color: P.blue }} />
                      <ActionBtn danger onClick={() => deleteVendor(vendor.id)} title="Supprimer"><Trash2 size={13} color={P.red} /></ActionBtn>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={7}>
                  <EmptyState icon={<UserRound size={22} />}
                    title={searchTerm || statusFilter !== 'all' ? 'Aucun commercial ne correspond' : 'Aucun vendeur enregistré'}
                    sub={searchTerm || statusFilter !== 'all' ? 'Modifiez la recherche ou le filtre de statut.' : 'Commencez par ajouter un commercial terrain.'} />
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pager page={page} perPage={PAGE_SIZE} count={filteredVendors.length} onPage={setPage} />
      </div>
    </div>
  );

  /* ════════════════════════════════════════════
     RENDU
  ════════════════════════════════════════════ */
  return (
    <div className="mv-root" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{GLOBAL_CSS}</style>

      {error && (
        <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#FEF0ED', border: '1px solid #F5C4B3', borderRadius: 12, fontSize: 13, color: '#9A2D10' }}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, fontWeight: 600 }}>{error}</span>
          <button onClick={() => setError(null)} aria-label="Fermer" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9A2D10', display: 'flex' }}><X size={14} /></button>
        </div>
      )}

      {/* Bandeau */}
      {!showVendorDetails && (
        <div style={{ background: P.banner, borderRadius: 16, padding: 20, display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ maxWidth: 620 }}>
            <p style={{ color: 'rgba(200,230,248,0.9)', fontSize: 12, fontWeight: 600, margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 7 }}>
              <Users size={15} style={{ color: P.blueL }} /> LanfiaLink Route
            </p>
            <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 800, margin: 0 }}>Commerciaux terrain</h2>
            <p style={{ color: 'rgba(200,230,248,0.85)', fontSize: 12, margin: '6px 0 0', lineHeight: 1.5 }}>
              {selectedPOS?.pos_name || 'Tous les points de vente'} · suivez la performance, les ventes et les zones de chaque commercial.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="mv-btn" onClick={refreshAll}
              style={{ ...btnPrimary, background: 'rgba(255,255,255,0.16)' }}>
              {loading ? <Loader2 size={13} className="mv-spin" /> : <RefreshCw size={13} />} Actualiser
            </button>
            <button className="mv-btn" onClick={() => { setShowCreateForm(true); setShowVendorDetails(false); setNewVendor(getDefaultVendorForm(selectedPOS)); setPhotoPreview(null); setFormErrors([]); }}
              style={btnPrimary}>
              <Plus size={14} /> Nouveau commercial
            </button>
          </div>
        </div>
      )}

      {/* Indicateurs */}
      {!showVendorDetails && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <Kpi icon={Users} label="Total commerciaux" value={vendors.length} sub={`${statusCounts.suspendu} suspendu(s) · ${statusCounts.en_conge} en congé`} color={P.blue} />
          <Kpi icon={Activity} label="Commerciaux actifs" value={statusCounts.actif} sub={vendors.length ? `${Math.round((statusCounts.actif / vendors.length) * 100)} % de l'effectif` : undefined} color={P.green} />
          <Kpi icon={ShieldCheck} label="À approuver" value={statusCounts.a_approuver} sub={statusCounts.a_approuver > 0 ? 'En attente de validation' : 'Tous approuvés'} color={P.orange} />
          <Kpi icon={TrendingUp} label="Performance moyenne" value={`${avgPerf} %`} color={P.purple} />
        </div>
      )}

      {/* Vue d'ensemble des ventes */}
      {!showVendorDetails && (
        <GlobalSalesOverview sales={allSales} purchases={allPurchases} loading={loadingAggregates} failed={aggFailed} />
      )}

      {/* Mise à jour des performances */}
      {!showVendorDetails && (
        <div style={{ ...card, padding: '12px 16px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: P.text, flex: 1, minWidth: 220 }}>
            <RefreshCw size={14} style={{ color: P.blue }} />
            <span style={{ fontWeight: 700 }}>Recalculer les performances</span>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: P.muted, fontWeight: 600 }}>
            Période
            <input type="number" min={1} max={365} value={performanceDays} onChange={(e) => setPerformanceDays(Math.min(365, Math.max(1, +e.target.value || 30)))}
              style={{ ...inp, width: 76, height: 34 }} /> jours
          </label>
          <button className="mv-btn" onClick={updateAllVendorsPerformance} disabled={updatingPerformance === -1 || vendors.length === 0}
            style={{ ...btnPrimary, opacity: updatingPerformance === -1 || vendors.length === 0 ? 0.55 : 1 }}>
            {updatingPerformance === -1 ? <><Loader2 size={13} className="mv-spin" /> Mise à jour…</> : <><RefreshCw size={13} /> Tout mettre à jour</>}
          </button>
        </div>
      )}

      {/* Contenu */}
      {loading && vendors.length === 0 ? (
        <div style={{ ...card, padding: 56, textAlign: 'center' }}>
          <Loader2 size={32} className="mv-spin" style={{ color: P.blue, margin: '0 auto 12px' }} />
          <p style={{ fontSize: 13, color: P.textSub, fontWeight: 600, margin: 0 }}>Chargement des commerciaux…</p>
        </div>
      ) : showVendorDetails ? renderVendorDetails() : renderVendorList()}

      {/* Modale : création */}
      {showCreateForm && (
        <ModalWrapper
          onClose={() => { if (!saving) { setShowCreateForm(false); setPhotoPreview(null); setFormErrors([]); } }}
          title="Nouveau commercial terrain" subtitle="Ajoutez un nouveau vendeur à votre réseau" icon={Plus}
          footer={
            <>
              <button className="mv-btn" style={btnSecondary} disabled={saving} onClick={() => { setShowCreateForm(false); setPhotoPreview(null); setFormErrors([]); }}>Annuler</button>
              <button className="mv-btn" onClick={createVendor} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>
                {saving ? <Loader2 size={13} className="mv-spin" /> : <Plus size={13} />} {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </>
          }
        >
          <FormErrors errors={formErrors} />
          <VendorForm data={newVendor} isEditMode={false} onChange={(e) => handleChange(e, false)} onPhoto={(e) => handlePhoto(e, false)}
            photoPreview={photoPreview} pointsOfSale={pointsOfSale} loadingPOS={loadingPOS}
            onApproved={(v) => handleApproved(v, false)} villes={villes} loadingVilles={loadingVilles}
            onZonesChange={(z) => handleZonesChange(z, false)} />
        </ModalWrapper>
      )}
    </div>
  );
};

export default MobileVendorsManagement;