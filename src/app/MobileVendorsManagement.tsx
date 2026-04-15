"use client";
import React, { useState, useEffect } from 'react';
import {
  Plus, AlertTriangle, UserRound, Search, MapPin, Phone, Mail, Clock,
  ChevronLeft, ChevronRight, Edit, Trash2, Save, Coins, Image as ImageIcon,
  Calendar, BarChart3, TrendingUp, TrendingDown, Filter, Key, User,
  ShoppingBag, X, Award, Target, RefreshCw, Map, Users, Activity, Package,
  ShieldCheck, UploadCloud, ChevronDown,
  TrendingUp as TrendingUpIcon
} from 'lucide-react';
import { apiService } from './ApiService';
import { useAuth } from './AuthContext';
import { POSData } from './AdminDashboard';

/* ─────────────────────────────────────────────
   PALETTE LANFIALINK — tokens issus de LoginPage
───────────────────────────────────────────── */
const T = {
  bg:          '#FAF7F0',   // fond principal crème ivoire
  surface:     '#F2EDE0',   // sable chaud – inputs / surfaces
  white:       '#FFFFFF',
  green:       '#2D5A3D',   // vert forêt – CTA / primary
  greenHover:  '#3E7A54',
  greenLight:  '#EAF2EC',   // fond badge vert
  greenBorder: '#B8D8C0',
  ocre:        '#C07A2F',   // ocre doré – accent
  ocreDark:    '#9A5E1A',   // or kente foncé – texte accent / erreurs
  ocreLight:   '#FFF3E8',   // fond erreur / warning
  ocreBorder:  '#E8C090',
  gold:        '#D4A843',   // or kente clair
  goldPale:    '#F0C878',   // or pâle – highlights
  text:        '#2A1A08',   // texte principal brun
  textSub:     '#A89880',   // texte secondaire
  textLabel:   '#7A6A52',   // labels / captions
  border:      '#D4C4A0',   // bordures
  borderLight: '#E8D9B8',   // bordures légères
} as const;

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
interface Vendor {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  status: 'actif' | 'inactif' | 'en_conge' | 'suspendu';
  vehicle_type: 'moto' | 'tricycle' | 'velo' | 'pied' | 'autre';
  vehicle_id?: string;
  zones: string[];
  photo?: string;
  photo_url?: string;
  is_approved: boolean;
  notes?: string;
  average_daily_sales: number;
  performance: number;
  date_joined: string;
  last_activity?: string;
  point_of_sale?: number;
  point_of_sale_name?: string;
  purchases?: Purchase[];
}

interface Sale {
  id: number;
  product_variant: number;
  customer: number;
  quantity: number;
  total_amount: string;
  created_at: string;
  vendor: number;
  product_variant_name: string;
  format: string;
  customer_name: string;
  vendor_name: string;
  vendor_activity: number;
  latitude: number | null;
  longitude: number | null;
}

interface Purchase {
  id: number;
  sales_total: string;
  first_name: string;
  last_name: string;
  zone: string;
  amount: string;
  photo: string;
  purchase_date: string;
  created_at: string;
  base: string;
  pushcard_type: string;
  latitude: number;
  longitude: number;
  phone: string;
  vendor: number;
}

interface Ville {
  id: number;
  nom: string;
  district: number;
  district_nom: string;
  quartiers_count: number;
  date_creation: string;
}

interface FormVendor {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  status: 'actif' | 'inactif' | 'en_conge' | 'suspendu';
  vehicle_type: 'moto' | 'tricycle' | 'velo' | 'pied' | 'autre';
  vehicle_id: string;
  zones: string[];
  point_of_sale: string;
  photo: File | string | undefined;
  is_approved: boolean;
  notes: string;
  average_daily_sales: number;
  performance: number;
  username: string;
  password: string;
}

interface ActivityItem {
  id: number;
  activity_type: string;
  timestamp: string;
  notes?: string;
  location?: string;
}

interface PointOfSale {
  id: number;
  name: string;
  commune: string;
}

interface PerformanceData {
  vendor_id: number;
  vendor_name: string;
  period: { start_date: string; end_date: string };
  monthly_performance: MonthlyPerformance[];
  summary: {
    total_customers: number;
    total_revenue: number;
    total_products_sold: number;
    total_sales: number;
    overall_performance: number;
    period_start: string;
    period_end: string;
  };
  performance_indicators: {
    best_month: MonthlyPerformance;
    worst_month: MonthlyPerformance;
    growth_rate: number;
  };
}

interface MonthlyPerformance {
  month: string;
  year: number;
  month_number: number;
  total_customers: number;
  total_revenue: number;
  total_products_sold: number;
  total_sales: number;
  performance_ratio: number;
  average_basket: number;
  revenue_per_customer: number;
}

interface PerformanceUpdateResponse {
  message: string;
  performance: number;
}

interface Props {
  selectedPOS: POSData | null;
}

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
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
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(n);

/* ─────────────────────────────────────────────
   SHARED STYLE HELPERS
───────────────────────────────────────────── */
const inputStyle: React.CSSProperties = {
  width: '100%', height: 42, padding: '0 14px', boxSizing: 'border-box',
  background: T.surface, border: `1.5px solid ${T.border}`,
  borderRadius: 10, color: T.text, fontSize: 13.5, fontFamily: 'inherit', outline: 'none',
};
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };
const textareaStyle: React.CSSProperties = { ...inputStyle, height: 'auto', padding: '10px 14px', resize: 'none' };

const card: React.CSSProperties = {
  background: T.white, border: `1.5px solid ${T.borderLight}`, borderRadius: 16, overflow: 'hidden',
};
const cardPad: React.CSSProperties = { ...card, padding: '20px 24px' };

const btnPrimary = (hover = false): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 7,
  padding: '9px 20px', borderRadius: 10, fontSize: 13.5, fontWeight: 600,
  background: hover ? T.greenHover : T.green, color: T.white, border: 'none', cursor: 'pointer',
});
const btnSecondary: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 7,
  padding: '9px 20px', borderRadius: 10, fontSize: 13.5, fontWeight: 600,
  background: T.surface, color: T.text, border: `1.5px solid ${T.border}`, cursor: 'pointer',
};
const btnGhost: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 7,
  padding: '7px 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 600,
  background: T.greenLight, color: T.green, border: `1.5px solid ${T.greenBorder}`, cursor: 'pointer',
};

/* ─────────────────────────────────────────────
   SPINNER
───────────────────────────────────────────── */
const Spinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
    <div style={{
      width: 26, height: 26, borderRadius: '50%',
      border: `2.5px solid ${T.green}`, borderTopColor: 'transparent',
      animation: 'spin 1s linear infinite',
    }} />
  </div>
);

/* ─────────────────────────────────────────────
   STATUS BADGE
───────────────────────────────────────────── */
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; bg: string; color: string; border: string }> = {
    actif:    { label: 'Actif',    bg: T.greenLight, color: T.green,    border: T.greenBorder },
    inactif:  { label: 'Inactif',  bg: T.surface,    color: T.textLabel, border: T.border },
    en_conge: { label: 'En congé', bg: '#EBF4FB',    color: '#2563A8',  border: '#B8D4EF' },
    suspendu: { label: 'Suspendu', bg: T.ocreLight,  color: T.ocreDark, border: T.ocreBorder },
  };
  const s = map[status] ?? map.inactif;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 700,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {s.label}
    </span>
  );
};

/* ─────────────────────────────────────────────
   PERF BAR
───────────────────────────────────────────── */
const PerfBar = ({ value }: { value: number }) => {
  const fill = value >= 80 ? T.green : value >= 60 ? T.ocre : value >= 40 ? T.gold : '#C0392B';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 110 }}>
      <div style={{ flex: 1, height: 5, background: T.borderLight, borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(value, 100)}%`, background: fill, borderRadius: 99 }} />
      </div>
      <span style={{ fontSize: 11.5, fontWeight: 700, color: T.text, minWidth: 32, textAlign: 'right' }}>{value}%</span>
    </div>
  );
};

/* ─────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────── */
const StatCard = ({ icon, label, value, bg, border, color }: {
  icon: React.ReactNode; label: string; value: React.ReactNode;
  bg: string; border: string; color: string;
}) => (
  <div style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 14, padding: '16px 20px', position: 'relative', overflow: 'hidden' }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color, opacity: 0.7, margin: '0 0 4px' }}>{label}</p>
        <p style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1, margin: 0 }}>{value}</p>
      </div>
      <div style={{ padding: 8, borderRadius: 10, background: 'rgba(255,255,255,.35)', color }}>{icon}</div>
    </div>
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
      background: `linear-gradient(90deg,${T.ocreDark} 0%,${T.gold} 50%,${T.ocreDark} 100%)`,
      opacity: 0.4,
    }} />
  </div>
);

/* ─────────────────────────────────────────────
   AVATAR
───────────────────────────────────────────── */
const Avatar = ({ vendor, size = 'md' }: { vendor: Vendor; size?: 'sm' | 'md' | 'lg' }) => {
  const px = { sm: 32, md: 40, lg: 64 }[size];
  const fs = { sm: 11, md: 14, lg: 20 }[size];
  const initials = `${vendor.first_name[0]}${vendor.last_name[0]}`.toUpperCase();
  const pals = [
    { bg: T.greenLight, color: T.green },
    { bg: T.ocreLight,  color: T.ocreDark },
    { bg: '#EBF4FB',    color: '#2563A8' },
    { bg: '#FEF9E7',    color: '#9A7D0A' },
  ];
  const p = pals[vendor.id % pals.length];
  if (vendor.photo || vendor.photo_url)
    return <img src={vendor.photo || vendor.photo_url} alt=""
      style={{ width: px, height: px, borderRadius: 10, objectFit: 'cover', border: `2px solid ${T.borderLight}`, flexShrink: 0 }} />;
  return (
    <div style={{
      width: px, height: px, borderRadius: 10, flexShrink: 0,
      background: p.bg, color: p.color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: fs, border: `2px solid ${T.borderLight}`,
    }}>
      {initials}
    </div>
  );
};

/* ─────────────────────────────────────────────
   VEHICLE LABEL
───────────────────────────────────────────── */
const VehicleLabel = ({ type }: { type: string }) => {
  const map: Record<string, string> = { moto: '🏍 Moto', tricycle: '🛺 Tricycle', velo: '🚲 Vélo', pied: '🚶 À pied', autre: '🚗 Autre' };
  return <span style={{ fontSize: 11.5, color: T.textSub }}>{map[type] ?? type}</span>;
};

/* ─────────────────────────────────────────────
   TAB BAR
───────────────────────────────────────────── */
type Tab = 'activities' | 'performance' | 'notes' | 'purchases' | 'map';
const TabBar = ({ active, onChange, purchaseCount, mapCount }: {
  active: Tab; onChange: (t: Tab) => void; purchaseCount: number; mapCount: number;
}) => {
  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: 'activities',  label: 'Activités' },
    { key: 'performance', label: 'Performance' },
    { key: 'purchases',   label: 'Pushcart', badge: purchaseCount },
    { key: 'map',         label: 'Carte',    badge: mapCount },
    { key: 'notes',       label: 'Notes' },
  ];
  return (
    <div style={{ display: 'flex', gap: 2, borderBottom: `1.5px solid ${T.borderLight}`, marginBottom: 24, overflowX: 'auto' }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px',
          fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', border: 'none',
          background: 'none', cursor: 'pointer', marginBottom: -1.5,
          borderBottom: `2.5px solid ${active === t.key ? T.green : 'transparent'}`,
          color: active === t.key ? T.green : T.textSub,
        }}>
          {t.label}
          {t.badge !== undefined && (
            <span style={{
              padding: '1px 7px', borderRadius: 20, fontSize: 11,
              background: active === t.key ? T.greenLight : T.surface,
              color: active === t.key ? T.green : T.textLabel,
              border: `1px solid ${active === t.key ? T.greenBorder : T.border}`,
            }}>{t.badge}</span>
          )}
        </button>
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────── */
const EmptyState = ({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '56px 24px', textAlign: 'center' }}>
    <div style={{
      width: 52, height: 52, borderRadius: 14, background: T.surface,
      border: `1.5px solid ${T.borderLight}`, display: 'flex', alignItems: 'center',
      justifyContent: 'center', color: T.textSub, marginBottom: 14,
    }}>{icon}</div>
    <p style={{ fontSize: 13.5, fontWeight: 600, color: T.text, margin: 0 }}>{title}</p>
    {sub && <p style={{ fontSize: 12, color: T.textSub, marginTop: 4, maxWidth: 260 }}>{sub}</p>}
  </div>
);

/* ─────────────────────────────────────────────
   FIELD WRAPPER
───────────────────────────────────────────── */
const Field = ({ label, children, span }: { label: string; children: React.ReactNode; span?: boolean }) => (
  <div style={{ gridColumn: span ? '1 / -1' : undefined }}>
    <label style={{
      display: 'block', fontSize: 10.5, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.08em',
      color: T.textLabel, marginBottom: 6,
    }}>{label}</label>
    {children}
  </div>
);

/* ─────────────────────────────────────────────
   ZONES MULTI-SELECT — dropdown dynamique
   Fetche https://api.lanfialink.com/api/villes/
   et utilise le champ `nom` comme valeur
───────────────────────────────────────────── */
const ZonesSelect = ({
  selected, villes, loadingVilles, onChange,
}: {
  selected: string[];
  villes: Ville[];
  loadingVilles: boolean;
  onChange: (zones: string[]) => void;
}) => {
  const [open, setOpen] = useState(false);

  const toggle = (nom: string) =>
    onChange(selected.includes(nom) ? selected.filter(z => z !== nom) : [...selected, nom]);

  return (
    <div style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        width: '100%', height: 42, padding: '0 14px', boxSizing: 'border-box',
        background: T.surface, border: `1.5px solid ${open ? T.green : T.border}`,
        borderRadius: 10, color: selected.length ? T.text : T.textSub,
        fontSize: 13.5, fontFamily: 'inherit', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        outline: 'none', boxShadow: open ? `0 0 0 3px rgba(45,90,61,.10)` : 'none',
        transition: 'border .15s, box-shadow .15s',
      }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'left' }}>
          {loadingVilles ? 'Chargement des villes…' : selected.length > 0 ? selected.join(', ') : 'Sélectionner des zones…'}
        </span>
        <ChevronDown size={14} style={{
          flexShrink: 0, marginLeft: 8, color: T.textLabel,
          transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s',
        }} />
      </button>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
          {selected.map(z => (
            <span key={z} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '2px 8px 2px 10px', borderRadius: 20,
              background: T.greenLight, color: T.green,
              border: `1px solid ${T.greenBorder}`, fontSize: 11.5, fontWeight: 600,
            }}>
              {z}
              <button type="button" onClick={() => toggle(z)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 0, display: 'flex', color: T.green,
              }}>
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
            marginTop: 4, background: T.white,
            border: `1.5px solid ${T.border}`, borderRadius: 12,
            boxShadow: '0 8px 24px rgba(42,26,8,.12)', maxHeight: 240, overflowY: 'auto',
          }}>
            {loadingVilles ? (
              <div style={{ padding: 16, textAlign: 'center', fontSize: 12.5, color: T.textSub }}>Chargement…</div>
            ) : villes.length === 0 ? (
              <div style={{ padding: 16, textAlign: 'center', fontSize: 12.5, color: T.textSub }}>Aucune ville disponible</div>
            ) : villes.map(v => {
              const sel = selected.includes(v.nom);
              return (
                <button key={v.id} type="button" onClick={() => toggle(v.nom)} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '9px 14px', border: 'none',
                  background: sel ? T.greenLight : 'transparent', cursor: 'pointer',
                  textAlign: 'left', borderBottom: `1px solid ${T.borderLight}`,
                  transition: 'background .1s',
                }}
                  onMouseEnter={e => { if (!sel) (e.currentTarget as HTMLElement).style.background = T.surface; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = sel ? T.greenLight : 'transparent'; }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    border: `1.5px solid ${sel ? T.green : T.border}`,
                    background: sel ? T.green : T.surface,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background .15s, border-color .15s',
                  }}>
                    {sel && (
                      <svg viewBox="0 0 12 12" fill="none" width="10" height="10">
                        <polyline points="1.5,6 4.5,9 10.5,3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0 }}>{v.nom}</p>
                    <p style={{ fontSize: 11, color: T.textSub, margin: 0 }}>{v.district_nom}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   SALES MAP
───────────────────────────────────────────── */
const SalesMap = ({ sales }: { sales: Sale[] }) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const gps = sales.filter(s => s.latitude !== null && s.longitude !== null);

  useEffect(() => {
    if (!gps.length) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; link.crossOrigin = '';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; script.crossOrigin = '';
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);
    return () => { document.head.removeChild(link); document.head.removeChild(script); };
  }, [gps.length]);

  useEffect(() => {
    if (!mapLoaded || !gps.length) return;
    const L = (window as any).L;
    const map = L.map('sales-map').setView([gps[0].latitude!, gps[0].longitude!], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);
    gps.forEach(s => {
      if (s.latitude && s.longitude)
        L.marker([s.latitude, s.longitude]).addTo(map).bindPopup(`<b>${s.product_variant_name}</b><br>${s.customer_name}<br>${fmt(parseFloat(s.total_amount))}`);
    });
    if (gps.length > 1) {
      const grp = new L.featureGroup(gps.map(s => L.marker([s.latitude!, s.longitude!])));
      map.fitBounds(grp.getBounds().pad(0.1));
    }
    return () => map.remove();
  }, [mapLoaded]);

  if (!gps.length) return <EmptyState icon={<Map size={24} />} title="Aucune donnée GPS" sub="Les ventes géolocalisées s'afficheront ici" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {[
          { label: 'Localisées',   val: gps.length, color: T.green,    bg: T.greenLight, icon: <MapPin size={14} /> },
          { label: 'Total ventes', val: sales.length, color: T.ocreDark, bg: T.ocreLight,  icon: <ShoppingBag size={14} /> },
          { label: 'CA total',     val: fmt(sales.reduce((a, s) => a + parseFloat(s.total_amount), 0)), color: '#2563A8', bg: '#EBF4FB', icon: <Coins size={14} /> },
        ].map(c => (
          <div key={c.label} style={{ borderRadius: 12, border: `1.5px solid ${T.borderLight}`, background: T.white, padding: '12px 14px' }}>
            <div style={{ color: c.color, marginBottom: 5 }}>{c.icon}</div>
            <p style={{ fontSize: 11, color: T.textSub, margin: 0 }}>{c.label}</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: 0 }}>{c.val}</p>
          </div>
        ))}
      </div>
      <div style={{ borderRadius: 14, overflow: 'hidden', border: `1.5px solid ${T.borderLight}` }}>
        <div id="sales-map" style={{ height: 380, position: 'relative' }}>
          {!mapLoaded && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.surface }}>
              <Spinner />
            </div>
          )}
        </div>
        <div style={{ padding: '9px 14px', background: T.surface, borderTop: `1px solid ${T.borderLight}`, display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: T.textSub }}>
          <span>{gps.length} point(s) localisé(s)</span>
          <span>Cliquer sur un marqueur pour les détails</span>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   PERFORMANCE CHART
───────────────────────────────────────────── */
const PerformanceChart = ({ data }: { data: PerformanceData | null }) => {
  if (!data?.monthly_performance.length)
    return <EmptyState icon={<BarChart3 size={24} />} title="Aucune donnée de performance" sub="Les données s'afficheront ici une fois disponibles" />;

  const monthly = data.monthly_performance;
  const maxRev  = Math.max(...monthly.map(m => m.total_revenue), 1);
  const maxProd = Math.max(...monthly.map(m => m.total_products_sold), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        <StatCard icon={<Coins size={16} />} label="Revenus période" value={fmt(data.summary.total_revenue)}
          bg="#EBF4FB" border="#B8D4EF" color="#2563A8" />
        <StatCard icon={<Package size={16} />} label="Produits vendus" value={data.summary.total_products_sold}
          bg={T.surface} border={T.border} color={T.ocreDark} />
        <StatCard icon={<StarIcon />} label="Performance" value={`${data.summary.overall_performance.toFixed(1)}%`}
          bg={T.greenLight} border={T.greenBorder} color={T.green} />
      </div>
      <div style={{ background: T.white, borderRadius: 14, border: `1.5px solid ${T.borderLight}`, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h4 style={{ fontSize: 13.5, fontWeight: 700, color: T.text, margin: 0 }}>Évolution mensuelle</h4>
          <div style={{ display: 'flex', gap: 14, fontSize: 11.5, color: T.textSub }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, background: '#2563A8', borderRadius: 2, display: 'inline-block' }} /> Revenus</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, background: T.green, borderRadius: 2, display: 'inline-block' }} /> Produits</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 160 }}>
          {monthly.map((item, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
              <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                <div style={{ flex: 1, background: '#2563A8', borderRadius: '3px 3px 0 0', minHeight: 4, height: Math.max(4, (item.total_revenue / maxRev) * 130) }} />
                <div style={{ flex: 1, background: T.green,   borderRadius: '3px 3px 0 0', minHeight: 4, height: Math.max(4, (item.total_products_sold / maxProd) * 130) }} />
              </div>
              <span style={{ fontSize: 10, color: T.textSub, textAlign: 'center', lineHeight: 1.3 }}>
                {item.month.split(' ')[0].slice(0, 3)}<br />{item.year}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { title: 'Meilleur mois',      data: data.performance_indicators.best_month,
            bg: T.greenLight, border: T.greenBorder, color: T.green },
          { title: 'Mois le plus faible', data: data.performance_indicators.worst_month,
            bg: T.ocreLight, border: T.ocreBorder, color: T.ocreDark },
        ].map(c => (
          <div key={c.title} style={{ borderRadius: 12, border: `1.5px solid ${c.border}`, background: c.bg, padding: 16 }}>
            <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: c.color, margin: '0 0 8px' }}>{c.title}</p>
            {c.data ? (
              <>
                <p style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: 0 }}>{c.data.month}</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: c.color, margin: '2px 0' }}>{fmt(c.data.total_revenue)}</p>
                <p style={{ fontSize: 11, color: T.textSub, margin: 0 }}>{c.data.total_products_sold} produits · {c.data.total_customers} clients</p>
              </>
            ) : <p style={{ fontSize: 11.5, color: T.textSub }}>Aucune donnée</p>}
          </div>
        ))}
      </div>
      {data.performance_indicators.growth_rate !== 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          borderRadius: 12, padding: '11px 16px', fontSize: 13, fontWeight: 600,
          background: data.performance_indicators.growth_rate > 0 ? T.greenLight : T.ocreLight,
          color: data.performance_indicators.growth_rate > 0 ? T.green : T.ocreDark,
          border: `1.5px solid ${data.performance_indicators.growth_rate > 0 ? T.greenBorder : T.ocreBorder}`,
        }}>
          {data.performance_indicators.growth_rate > 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
          Croissance : {data.performance_indicators.growth_rate > 0 ? '+' : ''}{data.performance_indicators.growth_rate.toFixed(2)}%
        </div>
      )}
    </div>
  );
};
const StarIcon = () => <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 1l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 10.7l-3.8 2.1.7-4.3-3.1-3 4.3-.6z"/></svg>;

/* ─────────────────────────────────────────────
   PURCHASES LIST
───────────────────────────────────────────── */
const PurchasesList = ({ purchases }: { purchases?: Purchase[] }) => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [filter, setFilter] = useState('all');

  if (!purchases?.length) return <EmptyState icon={<ShoppingBag size={24} />} title="Aucun achat enregistré" />;
  const types = Array.from(new Set(purchases.map(p => p.pushcard_type)));
  const filtered = filter === 'all' ? purchases : purchases.filter(p => p.pushcard_type === filter);
  const totalPages = Math.ceil(filtered.length / perPage);
  const shown = filtered.slice((page - 1) * perPage, page * perPage);

  const th: React.CSSProperties = {
    padding: '10px 14px', textAlign: 'left', fontSize: 10.5, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.07em', color: T.textLabel,
    background: T.surface, borderBottom: `1.5px solid ${T.borderLight}`,
  };
  const td: React.CSSProperties = { padding: '11px 14px', borderBottom: `1px solid ${T.bg}` };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, padding: '10px 14px', background: T.surface, borderRadius: 10, border: `1.5px solid ${T.borderLight}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Filter size={13} style={{ color: T.textSub }} />
          <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}
            style={{ ...selectStyle, height: 34, width: 'auto', fontSize: 12.5 }}>
            <option value="all">Tous les types</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: T.textSub }}>Afficher</span>
          <select value={perPage} onChange={e => { setPerPage(+e.target.value); setPage(1); }}
            style={{ ...selectStyle, height: 34, width: 'auto', fontSize: 12.5 }}>
            {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 11.5, fontWeight: 600, color: T.textLabel, background: T.bg, borderRadius: 20, padding: '3px 12px', border: `1px solid ${T.borderLight}` }}>
          {filtered.length} achat(s)
        </span>
      </div>
      <div style={{ background: T.white, borderRadius: 12, border: `1.5px solid ${T.borderLight}`, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>{['Client', 'Date', 'Type', 'Zone', 'Montant', 'Photo'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {shown.map(p => (
                <tr key={p.id}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = T.bg}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = T.white}
                >
                  <td style={td}><p style={{ fontWeight: 600, color: T.text, margin: 0 }}>{p.first_name} {p.last_name}</p><p style={{ fontSize: 11.5, color: T.textSub, margin: 0 }}>{p.phone}</p></td>
                  <td style={td}><p style={{ color: T.text, margin: 0 }}>{new Date(p.purchase_date).toLocaleDateString('fr-FR')}</p><p style={{ fontSize: 11.5, color: T.textSub, margin: 0 }}>{new Date(p.purchase_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p></td>
                  <td style={td}><span style={{ background: T.ocreLight, color: T.ocreDark, border: `1px solid ${T.ocreBorder}`, padding: '2px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 600 }}>{p.pushcard_type}</span></td>
                  <td style={td}><p style={{ color: T.text, margin: 0 }}>{p.zone}</p><p style={{ fontSize: 11.5, color: T.textSub, margin: 0 }}>{p.base}</p></td>
                  <td style={{ ...td, whiteSpace: 'nowrap' }}><p style={{ fontWeight: 700, color: T.green, margin: 0 }}>{fmt(parseFloat(p.amount))}</p>{p.sales_total && <p style={{ fontSize: 11.5, color: '#2563A8', margin: 0 }}>Ventes: {fmt(parseFloat(p.sales_total))}</p>}</td>
                  <td style={td}>{p.photo
                    ? <img src={`https://backendsupply.onrender.com${p.photo}`} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', border: `1px solid ${T.borderLight}` }} onError={e => (e.target as HTMLImageElement).style.display = 'none'} />
                    : <div style={{ width: 36, height: 36, borderRadius: 8, background: T.surface, border: `1px solid ${T.borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.border }}><ImageIcon size={14} /></div>
                  }</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '10px 14px', background: T.surface, borderTop: `1px solid ${T.borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: T.textSub }}>
          <span>{(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} sur {filtered.length}</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '4px 8px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.white, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, display: 'flex' }}><ChevronLeft size={13} /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => setPage(n)} style={{ minWidth: 28, height: 28, borderRadius: 8, fontSize: 12, fontWeight: 600, border: `1px solid ${n === page ? T.green : T.border}`, background: n === page ? T.green : T.white, color: n === page ? T.white : T.text, cursor: 'pointer' }}>{n}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '4px 8px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.white, cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1, display: 'flex' }}><ChevronRight size={13} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   VENDOR FORM
───────────────────────────────────────────── */
const VendorForm = ({
  data, onChange, onPhoto, photoPreview,
  pointsOfSale, loadingPOS, isEditMode, onApproved,
  villes, loadingVilles, onZonesChange,
}: {
  data: Partial<FormVendor>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onPhoto: (e: React.ChangeEvent<HTMLInputElement>) => void;
  photoPreview: string | null;
  pointsOfSale: PointOfSale[];
  loadingPOS: boolean;
  isEditMode: boolean;
  onApproved: (v: boolean) => void;
  villes: Ville[];
  loadingVilles: boolean;
  onZonesChange: (zones: string[]) => void;
}) => {
  const icon: React.CSSProperties = { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.textSub, pointerEvents: 'none' };
  const withIcon: React.CSSProperties = { ...inputStyle, paddingLeft: 36 };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 18 }}>
      {/* Photo */}
      <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 76, height: 76, borderRadius: 14, overflow: 'hidden', flexShrink: 0, background: T.surface, border: `2px dashed ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {photoPreview ? <img src={photoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={24} style={{ color: T.border }} />}
        </div>
        <label style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: T.greenLight, color: T.green, borderRadius: 10, fontSize: 13, fontWeight: 600, border: `1.5px solid ${T.greenBorder}` }}>
          <UploadCloud size={15} /> Changer la photo
          <input type="file" style={{ display: 'none' }} onChange={onPhoto} accept="image/*" />
        </label>
      </div>

      {!isEditMode && (
        <>
          <Field label="Nom d'utilisateur *">
            <div style={{ position: 'relative' }}><span style={icon}><User size={14} /></span>
              <input type="text" name="username" value={data.username || ''} onChange={onChange} style={withIcon} placeholder="nom_utilisateur" /></div>
          </Field>
          <Field label="Mot de passe *">
            <div style={{ position: 'relative' }}><span style={icon}><Key size={14} /></span>
              <input type="password" name="password" value={data.password || ''} onChange={onChange} style={withIcon} placeholder="••••••••" /></div>
          </Field>
        </>
      )}

      <Field label="Prénom *"><input type="text" name="first_name" value={data.first_name || ''} onChange={onChange} style={inputStyle} /></Field>
      <Field label="Nom *"><input type="text" name="last_name" value={data.last_name || ''} onChange={onChange} style={inputStyle} /></Field>
      <Field label="Téléphone *">
        <div style={{ position: 'relative' }}><span style={icon}><Phone size={14} /></span>
          <input type="text" name="phone" value={data.phone || ''} onChange={onChange} style={withIcon} /></div>
      </Field>
      <Field label="Email">
        <div style={{ position: 'relative' }}><span style={icon}><Mail size={14} /></span>
          <input type="email" name="email" value={data.email || ''} onChange={onChange} style={withIcon} /></div>
      </Field>
      <Field label="Statut">
        <select name="status" value={data.status || 'actif'} onChange={onChange} style={selectStyle}>
          <option value="actif">Actif</option><option value="inactif">Inactif</option>
          <option value="en_conge">En congé</option><option value="suspendu">Suspendu</option>
        </select>
      </Field>
      <Field label="Type de véhicule">
        <select name="vehicle_type" value={data.vehicle_type || 'moto'} onChange={onChange} style={selectStyle}>
          <option value="moto">Moto</option><option value="tricycle">Tricycle</option>
          <option value="velo">Vélo</option><option value="pied">À pied</option><option value="autre">Autre</option>
        </select>
      </Field>
      <Field label="N° de véhicule"><input type="text" name="vehicle_id" value={data.vehicle_id || ''} onChange={onChange} style={inputStyle} /></Field>
      <Field label="Point de vente *">
        <select name="point_of_sale" value={data.point_of_sale || ''} onChange={onChange} style={{ ...selectStyle, opacity: loadingPOS ? 0.5 : 1 }} disabled={loadingPOS}>
          <option value="">— Sélectionner —</option>
          {pointsOfSale.map(p => <option key={p.id} value={p.id}>{p.name} ({p.commune})</option>)}
        </select>
      </Field>

      {/* Zones — dropdown dynamique depuis /api/villes/ */}
      <Field label="Zones de distribution *" span>
        <ZonesSelect selected={Array.isArray(data.zones) ? data.zones : []} villes={villes} loadingVilles={loadingVilles} onChange={onZonesChange} />
      </Field>

      <Field label="Performance (%)"><input type="number" name="performance" value={data.performance || 0} onChange={onChange} min="0" max="100" style={inputStyle} /></Field>
      <Field label="Ventes moy/jour (XOF)"><input type="number" name="average_daily_sales" value={data.average_daily_sales || 0} onChange={onChange} min="0" style={inputStyle} /></Field>

      <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div onClick={() => onApproved(!data.is_approved)} style={{
          width: 18, height: 18, borderRadius: 5, cursor: 'pointer',
          border: `1.5px solid ${data.is_approved ? T.green : T.border}`,
          background: data.is_approved ? T.green : T.surface,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all .15s',
        }}>
          {data.is_approved && <svg viewBox="0 0 12 12" fill="none" width="11" height="11"><polyline points="1.5,6 4.5,9 10.5,3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
        </div>
        <label onClick={() => onApproved(!data.is_approved)} style={{ fontSize: 13.5, fontWeight: 600, color: T.text, cursor: 'pointer', userSelect: 'none' }}>Vendeur approuvé</label>
      </div>

      <Field label="Notes" span>
        <textarea name="notes" value={data.notes || ''} onChange={onChange} rows={3} style={textareaStyle} />
      </Field>
    </div>
  );
};

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const MobileVendorsManagement = ({ selectedPOS }: Props) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showVendorDetails, setShowVendorDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<FormVendor>>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newVendor, setNewVendor] = useState<FormVendor>(getDefaultVendorForm(selectedPOS));
  const [sales, setSales] = useState<Sale[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('activities');
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [pointsOfSale, setPointsOfSale] = useState<PointOfSale[]>([]);
  const [loadingPOS, setLoadingPOS] = useState(false);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loadingPerformance, setLoadingPerformance] = useState(false);
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [updatingPerformance, setUpdatingPerformance] = useState<number | null>(null);
  const [performanceDays, setPerformanceDays] = useState(30);
  const [villes, setVilles] = useState<Ville[]>([]);
  const [loadingVilles, setLoadingVilles] = useState(false);
  const { user } = useAuth();

  /* ── Fetch villes ── */
  useEffect(() => {
    (async () => {
      try {
        setLoadingVilles(true);
        const r = await fetch('https://api.lanfialink.com/api/villes/');
        if (r.ok) setVilles(await r.json());
      } catch { /* ignore */ }
      finally { setLoadingVilles(false); }
    })();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const url = selectedPOS?.pos_id ? `/mobile-vendors/?point_of_sale=${selectedPOS.pos_id}` : '/mobile-vendors/';
      const res = await apiService.get(url);
      if (!res.ok) throw new Error('Erreur de chargement');
      setVendors(await res.json());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const fetchVendorSales = async (id: number) => {
    try { setLoadingSales(true); const r = await apiService.get(`/salespos/?vendor=${id}`); if (r.ok) setSales(await r.json()); }
    catch { /* ignore */ } finally { setLoadingSales(false); }
  };

  const fetchVendorPerformance = async (id: number) => {
    try {
      setLoadingPerformance(true);
      let url = `/sales/performance/?vendor_id=${id}`;
      if (dateFilter.startDate) url += `&start_date=${dateFilter.startDate}`;
      if (dateFilter.endDate)   url += `&end_date=${dateFilter.endDate}`;
      const r = await apiService.get(url);
      if (r.ok) setPerformanceData(await r.json());
    } catch { /* ignore */ } finally { setLoadingPerformance(false); }
  };

  const viewVendorDetails = async (vendor: Vendor) => {
    try {
      setDateFilter({ startDate: '', endDate: '' });
      const r = await apiService.get(`/mobile-vendors/${vendor.id}/`);
      if (!r.ok) throw new Error('Erreur de chargement');
      const data: Vendor = await r.json();
      setSelectedVendor(data);
      setEditForm({ ...data, zones: data.zones, point_of_sale: data.point_of_sale?.toString() || '', username: '', password: '' });
      setPhotoPreview(data.photo || null);
      setShowVendorDetails(true);
      setActiveTab('activities');
      await Promise.all([fetchVendorPerformance(data.id), fetchVendorSales(data.id)]);
    } catch (e: any) { setError(e.message); }
  };

  const buildFD = (form: Partial<FormVendor>): FormData => {
    const fd = new FormData();
    (Object.entries(form) as [keyof FormVendor, any][]).forEach(([k, v]) => {
      if (k === 'zones' && Array.isArray(v)) fd.append(k, JSON.stringify(v));
      else if (k === 'photo' && v instanceof File) fd.append(k, v);
      else if (v !== null && v !== undefined && v !== '') fd.append(k, String(v));
    });
    return fd;
  };

  const createVendor = async () => {
    try {
      const r = await apiService.post('/mobile-vendors/', buildFD(newVendor), true);
      if (!r.ok) { const e = await r.json(); throw new Error(e.message || 'Erreur création'); }
      const created: Vendor = await r.json();
      setVendors(p => [...p, created]);
      setShowCreateForm(false); setNewVendor(getDefaultVendorForm(selectedPOS)); setPhotoPreview(null);
    } catch (e: any) { setError(e.message); }
  };

  const updateVendor = async () => {
    if (!selectedVendor) return;
    try {
      const r = await apiService.patch(`/mobile-vendors/${selectedVendor.id}/`, buildFD(editForm), true);
      if (!r.ok) throw new Error('Erreur mise à jour');
      const updated: Vendor = await r.json();
      setVendors(p => p.map(v => v.id === updated.id ? updated : v));
      setSelectedVendor(updated); setIsEditing(false); setPhotoPreview(null);
    } catch (e: any) { setError(e.message); }
  };

  const deleteVendor = async (id: number) => {
    if (!confirm('Supprimer ce vendeur ?')) return;
    try {
      const r = await apiService.delete(`/mobile-vendors/${id}/`);
      if (!r.ok) throw new Error('Erreur suppression');
      setVendors(p => p.filter(v => v.id !== id));
      if (selectedVendor?.id === id) setShowVendorDetails(false);
    } catch (e: any) { setError(e.message); }
  };

  const updateVendorPerformance = async (vendorId: number) => {
    try {
      setUpdatingPerformance(vendorId);
      const r = await apiService.post(`/vendors/${vendorId}/update_performance/`, { days: performanceDays });
      if (!r.ok) throw new Error();
      const data: PerformanceUpdateResponse = await r.json();
      setVendors(p => p.map(v => v.id === vendorId ? { ...v, performance: data.performance } : v));
      if (selectedVendor?.id === vendorId) setSelectedVendor(p => p ? { ...p, performance: data.performance } : null);
    } catch (e: any) { setError(e.message); }
    finally { setUpdatingPerformance(null); }
  };

  const updateAllVendorsPerformance = async () => {
    try {
      setUpdatingPerformance(-1);
      const results = await Promise.all(vendors.map(v => apiService.post(`/vendors/${v.id}/update_performance/`, { days: performanceDays })));
      const jsons = await Promise.all(results.map(r => r.json()));
      setVendors(p => p.map((v, i) => ({ ...v, performance: jsons[i].performance })));
    } catch (e: any) { setError(e.message); }
    finally { setUpdatingPerformance(null); }
  };

  useEffect(() => { fetchVendors(); }, [selectedPOS]);
  useEffect(() => {
    (async () => {
      try { setLoadingPOS(true); const r = await apiService.get('/points-vente/'); if (r.ok) setPointsOfSale(await r.json()); }
      catch { /* ignore */ } finally { setLoadingPOS(false); }
    })();
  }, []);
  useEffect(() => {
    if (!showVendorDetails || !selectedVendor?.id) return;
    (async () => {
      setLoadingActivities(true);
      try { const r = await apiService.get(`/vendor-activities/?vendor=${selectedVendor.id}`); if (r.ok) setActivities(await r.json()); }
      finally { setLoadingActivities(false); }
    })();
  }, [selectedVendor?.id, showVendorDetails]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, isEdit = false) => {
    const { name, value } = e.target;
    isEdit ? setEditForm(p => ({ ...p, [name]: value })) : setNewVendor(p => ({ ...p, [name]: value as any }));
  };
  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
      isEdit ? setEditForm(p => ({ ...p, photo: file })) : setNewVendor(p => ({ ...p, photo: file }));
    };
    reader.readAsDataURL(file);
  };
  const handleApproved = (val: boolean, isEdit = false) =>
    isEdit ? setEditForm(p => ({ ...p, is_approved: val })) : setNewVendor(p => ({ ...p, is_approved: val }));
  const handleZonesChange = (zones: string[], isEdit = false) =>
    isEdit ? setEditForm(p => ({ ...p, zones })) : setNewVendor(p => ({ ...p, zones }));

  const filteredVendors = vendors
    .filter(v =>
      `${v.first_name} ${v.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.phone.includes(searchTerm) ||
      v.zones.some(z => z.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => b.performance - a.performance);

  /* ─────── VENDOR DETAILS ─────── */
  const renderVendorDetails = () => {
    if (!selectedVendor) return null;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Header */}
        <div style={{ background: T.white, border: `1.5px solid ${T.borderLight}`, borderRadius: 16, overflow: 'hidden' }}>
          {/* Kente strip */}
          <div style={{ height: 5, background: `linear-gradient(90deg,${T.ocreDark} 0%,${T.gold} 25%,${T.ocreDark} 50%,${T.gold} 75%,${T.ocreDark} 100%)` }} />
          <div style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <button onClick={() => { setShowVendorDetails(false); setIsEditing(false); setPhotoPreview(null); }}
                  style={{ padding: 8, borderRadius: 10, border: `1.5px solid ${T.borderLight}`, background: T.surface, cursor: 'pointer', color: T.textSub, display: 'flex' }}>
                  <ChevronLeft size={17} />
                </button>
                <Avatar vendor={selectedVendor} size="lg" />
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: 0 }}>{selectedVendor.first_name} {selectedVendor.last_name}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                    <StatusBadge status={selectedVendor.status} />
                    {selectedVendor.is_approved && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 9px', borderRadius: 20, fontSize: 11.5, fontWeight: 600, background: T.greenLight, color: T.green, border: `1px solid ${T.greenBorder}` }}>
                        <ShieldCheck size={11} /> Approuvé
                      </span>
                    )}
                    <VehicleLabel type={selectedVendor.vehicle_type} />
                    <span style={{ fontSize: 11.5, color: T.textSub }}>· {selectedVendor.point_of_sale_name || 'Non assigné'}</span>
                  </div>
                </div>
              </div>
              {!isEditing && (
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => setIsEditing(true)} style={btnSecondary}><Edit size={13} /> Modifier</button>
                  <button onClick={() => deleteVendor(selectedVendor.id)} style={{ padding: 9, borderRadius: 10, border: `1.5px solid ${T.ocreBorder}`, background: T.ocreLight, color: T.ocreDark, cursor: 'pointer', display: 'flex' }}><Trash2 size={14} /></button>
                </div>
              )}
            </div>
          </div>
        </div>

        {isEditing ? (
          <div style={cardPad}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: '0 0 20px' }}>Modifier le profil</h3>
            <VendorForm data={editForm} isEditMode onChange={e => handleChange(e, true)} onPhoto={e => handlePhoto(e, true)}
              photoPreview={photoPreview} pointsOfSale={pointsOfSale} loadingPOS={loadingPOS}
              onApproved={v => handleApproved(v, true)} villes={villes} loadingVilles={loadingVilles}
              onZonesChange={z => handleZonesChange(z, true)} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24, paddingTop: 20, borderTop: `1px solid ${T.borderLight}` }}>
              <button onClick={() => { setIsEditing(false); setPhotoPreview(null); }} style={btnSecondary}>Annuler</button>
              <button onClick={updateVendor} style={btnPrimary()}><Save size={14} /> Enregistrer</button>
            </div>
          </div>
        ) : (
          <>
            {/* Date filter */}
            <div style={cardPad}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 12, marginBottom: 14 }}>
                {[{ label: 'Date début', key: 'startDate' as const }, { label: 'Date fin', key: 'endDate' as const }].map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.textLabel, marginBottom: 5 }}>{f.label}</label>
                    <input type="date" value={dateFilter[f.key]} onChange={e => setDateFilter(p => ({ ...p, [f.key]: e.target.value }))}
                      style={{ ...inputStyle, width: 150, height: 36, fontSize: 12 }} />
                  </div>
                ))}
                <button onClick={() => fetchVendorPerformance(selectedVendor.id)} style={{ ...btnPrimary(), padding: '8px 16px', fontSize: 12.5 }}>Appliquer</button>
                <button onClick={() => { setDateFilter({ startDate: '', endDate: '' }); fetchVendorPerformance(selectedVendor.id); }} style={{ ...btnSecondary, padding: '8px 16px', fontSize: 12.5 }}>Réinitialiser</button>
              </div>
              {performanceData && <p style={{ fontSize: 11.5, color: T.textSub, margin: 0 }}>Période : {new Date(performanceData.period.start_date).toLocaleDateString('fr-FR')} → {new Date(performanceData.period.end_date).toLocaleDateString('fr-FR')}</p>}
            </div>

            {/* Info cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
              <div style={cardPad}>
                <h4 style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.textLabel, display: 'flex', alignItems: 'center', gap: 5, margin: '0 0 14px' }}><UserRound size={12} /> Informations</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { icon: <Phone size={13} />, val: selectedVendor.phone },
                    { icon: <Mail size={13} />, val: selectedVendor.email || 'Non renseigné' },
                    { icon: <Calendar size={13} />, val: `Membre depuis ${new Date(selectedVendor.date_joined).toLocaleDateString('fr-FR')}` },
                    { icon: <Clock size={13} />, val: selectedVendor.last_activity ? `Actif ${new Date(selectedVendor.last_activity).toLocaleDateString('fr-FR')}` : 'Activité inconnue' },
                  ].map((r, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.text }}><span style={{ color: T.textSub }}>{r.icon}</span>{r.val}</div>
                  ))}
                </div>
              </div>
              <div style={cardPad}>
                <h4 style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.textLabel, display: 'flex', alignItems: 'center', gap: 5, margin: '0 0 14px' }}><MapPin size={12} /> Zones</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedVendor.zones.map((z, i) => (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: T.greenLight, color: T.green, border: `1px solid ${T.greenBorder}` }}>
                      <MapPin size={10} /> {z}
                    </span>
                  ))}
                </div>
              </div>
              <div style={cardPad}>
                <h4 style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.textLabel, display: 'flex', alignItems: 'center', gap: 5, margin: '0 0 14px' }}><BarChart3 size={12} /> Statistiques</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}><span style={{ color: T.textSub }}>Performance</span><PerfBar value={selectedVendor.performance} /></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: T.textSub }}>Ventes moy/jour</span><span style={{ fontWeight: 700, color: T.green }}>{fmt(selectedVendor.average_daily_sales)}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: T.textSub }}>Point de vente</span><span style={{ fontWeight: 600, color: T.text, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedVendor.point_of_sale_name || '—'}</span></div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={cardPad}>
              <TabBar active={activeTab} onChange={setActiveTab} purchaseCount={selectedVendor.purchases?.length || 0} mapCount={sales.filter(s => s.latitude && s.longitude).length} />
              {activeTab === 'activities' && (
                loadingActivities ? <Spinner /> : activities.length > 0
                  ? <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {activities.map(a => (
                        <div key={a.id} style={{ display: 'flex', gap: 12, padding: '13px 16px', borderRadius: 10, background: T.bg, border: `1px solid ${T.borderLight}` }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.green, marginTop: 5, flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                              <p style={{ fontWeight: 600, color: T.text, fontSize: 13, margin: 0 }}>{a.activity_type}</p>
                              {a.location && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#2563A8', background: '#EBF4FB', padding: '1px 8px', borderRadius: 20 }}><MapPin size={9} /> GPS</span>}
                            </div>
                            <p style={{ fontSize: 11.5, color: T.textSub, margin: '3px 0 0' }}>{new Date(a.timestamp).toLocaleString('fr-FR')}</p>
                            {a.notes && <p style={{ fontSize: 12, color: T.text, margin: '5px 0 0' }}>{a.notes}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  : <EmptyState icon={<Clock size={20} />} title="Aucune activité récente" />
              )}
              {activeTab === 'performance' && (loadingPerformance ? <Spinner /> : <PerformanceChart data={performanceData} />)}
              {activeTab === 'purchases' && <PurchasesList purchases={selectedVendor.purchases} />}
              {activeTab === 'map' && (loadingSales ? <Spinner /> : <SalesMap sales={sales} />)}
              {activeTab === 'notes' && (
                selectedVendor.notes
                  ? <div style={{ padding: 18, background: T.bg, borderRadius: 10, border: `1px solid ${T.borderLight}`, fontSize: 13.5, color: T.text, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{selectedVendor.notes}</div>
                  : <EmptyState icon={<Edit size={20} />} title="Aucune note" sub="Modifiez le profil pour ajouter des notes" />
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  /* ─────── VENDOR LIST ─────── */
  const renderVendorList = () => (
    <div style={card}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ minWidth: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: T.surface }}>
              {['Vendeur', 'Contact', 'Zones', 'Statut', 'Performance', ''].map(h => (
                <th key={h} style={{ padding: '11px 18px', textAlign: 'left', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: T.textLabel, borderBottom: `1.5px solid ${T.borderLight}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredVendors.length > 0 ? filteredVendors.map(vendor => (
              <tr key={vendor.id}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = T.bg}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = T.white}
              >
                <td style={{ padding: '13px 18px', borderBottom: `1px solid ${T.bg}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar vendor={vendor} />
                    <div><p style={{ fontWeight: 700, color: T.text, margin: 0 }}>{vendor.first_name} {vendor.last_name}</p><VehicleLabel type={vendor.vehicle_type} /></div>
                  </div>
                </td>
                <td style={{ padding: '13px 18px', borderBottom: `1px solid ${T.bg}` }}><p style={{ color: T.text, margin: 0 }}>{vendor.phone}</p><p style={{ fontSize: 11.5, color: T.textSub, margin: 0 }}>{vendor.email || '—'}</p></td>
                <td style={{ padding: '13px 18px', borderBottom: `1px solid ${T.bg}` }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {vendor.zones.slice(0, 2).map((z, i) => <span key={i} style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11.5, background: T.surface, color: T.textLabel, border: `1px solid ${T.borderLight}` }}>{z}</span>)}
                    {vendor.zones.length > 2 && <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11.5, background: T.surface, color: T.textSub, border: `1px solid ${T.borderLight}` }}>+{vendor.zones.length - 2}</span>}
                  </div>
                </td>
                <td style={{ padding: '13px 18px', borderBottom: `1px solid ${T.bg}` }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <StatusBadge status={vendor.status} />
                    {vendor.is_approved && <span style={{ fontSize: 11.5, color: T.green, fontWeight: 600 }}>✓ Approuvé</span>}
                  </div>
                </td>
                <td style={{ padding: '13px 18px', borderBottom: `1px solid ${T.bg}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <PerfBar value={vendor.performance} />
                    <button onClick={() => updateVendorPerformance(vendor.id)} disabled={updatingPerformance === vendor.id}
                      style={{ padding: 4, borderRadius: 6, border: 'none', background: 'none', cursor: updatingPerformance === vendor.id ? 'not-allowed' : 'pointer', color: T.textSub, display: 'flex', opacity: updatingPerformance === vendor.id ? 0.5 : 1 }}>
                      {updatingPerformance === vendor.id
                        ? <div style={{ width: 13, height: 13, borderRadius: '50%', border: `2px solid ${T.green}`, borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                        : <RefreshCw size={13} />}
                    </button>
                  </div>
                </td>
                <td style={{ padding: '13px 18px', borderBottom: `1px solid ${T.bg}` }}>
                  <button onClick={() => viewVendorDetails(vendor)} style={btnGhost}>Détails →</button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={6}><EmptyState icon={<UserRound size={24} />} title={searchTerm ? 'Aucun résultat' : 'Aucun vendeur enregistré'} sub={!searchTerm ? 'Commencez par ajouter un commercial terrain' : undefined} /></td></tr>
            )}
          </tbody>
        </table>
      </div>
      {filteredVendors.length > 0 && (
        <div style={{ padding: '11px 18px', background: T.surface, borderTop: `1px solid ${T.borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: T.textSub }}>
          <span>{filteredVendors.length} / {vendors.length} vendeur(s) affiché(s)</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {[ChevronLeft, ChevronRight].map((Icon, i) => (
              <button key={i} style={{ padding: '4px 8px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.white, cursor: 'pointer', display: 'flex', color: T.textSub }}><Icon size={13} /></button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  /* ─────── ROOT ─────── */
  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 4 }}>

        {/* Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0, letterSpacing: '-0.02em' }}>Commerciaux terrain</h1>
            <p style={{ fontSize: 13, color: T.textSub, margin: '3px 0 0' }}>{selectedPOS?.pos_name || 'Tous les points de vente'}</p>
            {/* Kente accent bar sous le titre */}
            <div style={{ width: 36, height: 3, borderRadius: 99, marginTop: 8, background: `linear-gradient(90deg,${T.ocreDark},${T.gold},${T.ocreDark})` }} />
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.textSub, pointerEvents: 'none' }} />
              <input type="text" placeholder="Rechercher…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                style={{ ...inputStyle, paddingLeft: 36, width: 220 }} />
            </div>
            <button
              onClick={() => { setShowCreateForm(true); setShowVendorDetails(false); setNewVendor(getDefaultVendorForm(selectedPOS)); }}
              style={btnPrimary()}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = T.greenHover}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = T.green}
            >
              <Plus size={15} /> Nouveau commercial
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '13px 16px', background: T.ocreLight, border: `1.5px solid ${T.ocreBorder}`, borderRadius: 12, fontSize: 13 }}>
            <AlertTriangle size={15} style={{ color: T.ocreDark, marginTop: 1, flexShrink: 0 }} />
            <span style={{ flex: 1, color: T.ocreDark, fontWeight: 500 }}>{error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.ocreDark, display: 'flex' }}><X size={15} /></button>
          </div>
        )}

        {/* Stat cards */}
        {!showVendorDetails && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
            <StatCard icon={<Users size={17} />} label="Total vendeurs" value={vendors.length} bg={T.greenLight} border={T.greenBorder} color={T.green} />
            <StatCard icon={<Activity size={17} />} label="Vendeurs actifs" value={vendors.filter(v => v.status === 'actif').length} bg="#EBF4FB" border="#B8D4EF" color="#2563A8" />
            <StatCard icon={<TrendingUpIcon size={17} />} label="Perf. moyenne"
              value={`${vendors.length > 0 ? Math.round(vendors.reduce((a, v) => a + (v.performance || 0), 0) / vendors.length) : 0}%`}
              bg={T.ocreLight} border={T.ocreBorder} color={T.ocreDark} />
          </div>
        )}

        {/* Performance update bar */}
        {!showVendorDetails && (
          <div style={{ ...cardPad, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: T.text, flex: 1 }}>
              <RefreshCw size={14} style={{ color: T.ocre }} />
              <span style={{ fontWeight: 600 }}>Mettre à jour les performances</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 12, color: T.textSub, whiteSpace: 'nowrap' }}>Période :</label>
              <input type="number" min="1" max="365" value={performanceDays} onChange={e => setPerformanceDays(+e.target.value || 30)}
                style={{ ...inputStyle, width: 72, height: 36, fontSize: 12 }} />
              <span style={{ fontSize: 12, color: T.textSub }}>jours</span>
            </div>
            <button onClick={updateAllVendorsPerformance} disabled={updatingPerformance === -1 || vendors.length === 0}
              style={{ ...btnGhost, opacity: updatingPerformance === -1 || vendors.length === 0 ? 0.5 : 1 }}>
              {updatingPerformance === -1
                ? <><div style={{ width: 13, height: 13, borderRadius: '50%', border: `2px solid ${T.green}`, borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} /> Mise à jour…</>
                : <><RefreshCw size={13} /> Tout mettre à jour</>}
            </button>
          </div>
        )}

        {/* Create form */}
        {showCreateForm && (
          <div style={cardPad}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0 }}>Nouveau commercial terrain</h2>
                <div style={{ width: 28, height: 3, borderRadius: 99, background: T.ocre, marginTop: 6 }} />
              </div>
              <button onClick={() => { setShowCreateForm(false); setPhotoPreview(null); }}
                style={{ padding: 7, borderRadius: 8, border: `1px solid ${T.borderLight}`, background: T.surface, cursor: 'pointer', color: T.textSub, display: 'flex' }}>
                <X size={16} />
              </button>
            </div>
            <VendorForm data={newVendor} isEditMode={false} onChange={e => handleChange(e, false)} onPhoto={e => handlePhoto(e, false)}
              photoPreview={photoPreview} pointsOfSale={pointsOfSale} loadingPOS={loadingPOS}
              onApproved={v => handleApproved(v, false)} villes={villes} loadingVilles={loadingVilles}
              onZonesChange={z => handleZonesChange(z, false)} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24, paddingTop: 20, borderTop: `1px solid ${T.borderLight}` }}>
              <button onClick={() => { setShowCreateForm(false); setPhotoPreview(null); }} style={btnSecondary}>Annuler</button>
              <button onClick={createVendor} style={btnPrimary()}>Enregistrer</button>
            </div>
          </div>
        )}

        {/* Main content */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: `2.5px solid ${T.green}`, borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: 13.5, color: T.textSub }}>Chargement des commerciaux…</p>
          </div>
        ) : showVendorDetails ? renderVendorDetails() : renderVendorList()}
      </div>
    </>
  );
};

export default MobileVendorsManagement;