"use client";
// components/dashboard/MapComponent.tsx
// Géolocalisation : clients (pushcard) et points de vente sur une carte dynamique.
// Même langage visuel que les vues Activations, Analytiques et Découpage.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Loader2, Download, User, Store, AlertTriangle, Users, MapPin, Calendar, X, TrendingUp,
  ShoppingBag, RefreshCw, Search, ChevronLeft, ChevronRight, Layers3, Flame, Crosshair,
  Maximize2, Minimize2, Crosshair as Target, Navigation, SlidersHorizontal,
} from 'lucide-react';
import { apiService } from './ApiService';
import 'leaflet/dist/leaflet.css';

/* ─── Types (exportés : peuvent être importés ailleurs) ───── */
export interface SaleDetail {
  product: string; variant_id: number; variant_name: string; format: string;
  price: number; quantity: number; amount: number; date: string;
}
export interface MapCustomer {
  id: number; full_name: string; phone: string; zone: string; base: string; pushcard_type: string;
  latitude: number | null; longitude: number | null; purchase_date: string; photo_url: string;
  total_sales_amount: number; total_quantity: number; sales_count: number; sales_details: SaleDetail[];
  vendor_id: number; vendor_name: string; point_of_sale: string;
}
export interface VendorInfo {
  vendor_id: number; vendor_name: string; point_of_sale: string;
  total_customers: number; total_sales: number; total_quantity: number;
}
export interface PeriodInfo { start_date: string; end_date: string; period_type: string }
export interface MapResponse {
  period: PeriodInfo; user_points_of_sale: string[]; vendors_summary: VendorInfo[]; customers: MapCustomer[];
  total_customers: number; grand_total_sales: number; grand_total_quantity: number; total_vendors: number;
}
export interface PointOfSale {
  id: number; name: string; owner: string; type: string; type_display: string; status: string; status_display: string;
  phone: string; email: string; address: string; district: string; region: string; commune: string;
  latitude: number | null; longitude: number | null; avatar_url: string; turnover: number; monthly_orders: number;
  evaluation_score: number; registration_date: string;
  orders_summary: { total_orders: number; total_revenue: number; total_items: number };
}
export interface PointsOfSaleResponse { period: { start_date: string; end_date: string }; points_of_sale: PointOfSale[] }

interface MapFilters { start_date: string; end_date: string; zone: string; pushcard_type: string }
type ViewType = 'customers' | 'points-of-sale' | 'both';
type Geo = 'ok' | 'missing' | 'suspect';
type CustomerRow = MapCustomer & { geo: Geo };
type PosRow = PointOfSale & { geo: Geo };

/* ─── Palette ─────────────────────────────────────────────── */
const C = {
  blue: '#1A8FD1', blueD: '#0D6FAB', blueL: '#4FB3E8', navy: '#0D4E7A',
  pale: '#EDF5FA', surface: '#F0F5F9', line: '#C0D4E6', lineL: '#D4E4F0',
  text: '#0A1E2E', sub: '#2A4A62', muted: '#5A7A92',
  green: '#0A9E7A', greenBg: '#DCF5EC', greenTx: '#044D38',
  amber: '#D08A00', amberBg: '#FBEFD6', amberTx: '#7A4F00',
  red: '#B03318', redBg: '#FCE4DC', redTx: '#7A2410',
  greyBg: '#EAF0F5', greyTx: '#3A5A72', violet: '#2E4DB0', violetBg: '#D4DCFA',
};
const CUSTOMER_COLOR = C.green;
const POS_COLOR = C.violet;

/* ─── Helpers ─────────────────────────────────────────────── */
const fmtNum = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0));
const fmtCFA = (n: number) => `${fmtNum(n)} FCFA`;
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');
const dayStr = (offset = 0) => new Date(Date.now() - offset * 86400000).toISOString().slice(0, 10);
const esc = (s: any) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c]);

/**
 * Coordonnées utilisables : présentes, non nulles, numériques finies,
 * et situées en Côte d'Ivoire (même logique que le backend).
 * Tolère les valeurs envoyées sous forme de chaîne par l'API.
 */
function geoState(lat: number | string | null | undefined, lng: number | string | null | undefined): Geo {
  if (lat === null || lat === undefined || lng === null || lng === undefined) return 'missing';
  if (lat === '' || lng === '') return 'missing';
  const la = typeof lat === 'number' ? lat : Number(lat);
  const ln = typeof lng === 'number' ? lng : Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return 'missing';
  if (la === 0 && ln === 0) return 'missing';
  if (la < 4 || la > 10.8 || ln < -8.7 || ln > -2.4) return 'suspect';
  return 'ok';
}

/**
 * Extrait un couple [lat, lng] numérique fini et géographiquement plausible,
 * ou `null`. Empêche tout `NaN` d'atteindre Leaflet.
 */
function latLngOf(x: { latitude: number | string | null | undefined; longitude: number | string | null | undefined }): [number, number] | null {
  if (x.latitude === null || x.latitude === undefined || x.longitude === null || x.longitude === undefined) return null;
  if (x.latitude === '' || x.longitude === '') return null;
  const la = typeof x.latitude === 'number' ? x.latitude : Number(x.latitude);
  const ln = typeof x.longitude === 'number' ? x.longitude : Number(x.longitude);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
  if (la === 0 && ln === 0) return null;
  if (la < 4 || la > 10.8 || ln < -8.7 || ln > -2.4) return null;
  return [la, ln];
}

/* ─── Styles ──────────────────────────────────────────────── */
const card: React.CSSProperties = { background: '#fff', border: `0.5px solid ${C.line}`, borderRadius: 16 };
const input: React.CSSProperties = {
  width: '100%', height: 36, borderRadius: 10, padding: '0 10px', fontSize: 13, background: '#fff',
  border: `1.5px solid ${C.line}`, color: C.text, outline: 'none', fontFamily: 'inherit',
};
const btn = (bg: string, color = '#fff'): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: bg,
  color, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
});
const btnGhost: React.CSSProperties = { ...btn('#fff', C.sub), border: `1px solid ${C.line}` };
const CSS = `
@keyframes geo-spin { to { transform: rotate(360deg); } }
.geo-spin { animation: geo-spin .8s linear infinite; }
.geo-row:hover { background: #F5FAFD; }
.geo-th { cursor: pointer; user-select: none; }
.geo-th:hover { color: ${C.blueD}; }
.geo-chip { display:inline-flex; align-items:center; gap:5px; padding:6px 10px; border-radius:10px; font-size:11px; font-weight:700;
  background:rgba(255,255,255,.96); color:${C.sub}; border:1px solid ${C.line}; box-shadow:0 2px 8px rgba(10,30,46,.12); cursor:pointer; font-family:inherit; }
.geo-chip[data-active="true"] { background:${C.blue}; color:#fff; border-color:${C.blue}; }
.geo-popup .leaflet-popup-content-wrapper { padding:0; overflow:hidden; border-radius:14px; box-shadow:0 12px 32px rgba(10,30,46,.28); }
.geo-popup .leaflet-popup-content { margin:0; width:260px !important; font-family:system-ui,sans-serif; }
@media (prefers-reduced-motion: reduce) { .geo-spin { animation: none; } }
`;

/* ─── Petits composants ───────────────────────────────────── */
const Pill = ({ bg, tx, children }: { bg: string; tx: string; children: React.ReactNode }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '2px 9px', borderRadius: 99, fontWeight: 700, background: bg, color: tx, whiteSpace: 'nowrap' }}>{children}</span>
);

const GeoBadge = ({ geo }: { geo: Geo }) =>
  geo === 'ok' ? <Pill bg={C.greenBg} tx={C.greenTx}>Valides</Pill>
    : geo === 'missing' ? <Pill bg={C.amberBg} tx={C.amberTx}>Manquantes</Pill>
      : <Pill bg={C.redBg} tx={C.redTx}>Hors Côte d'Ivoire</Pill>;

const Kpi = ({ label, value, sub, color, icon: Icon }: { label: string; value: string; sub: string; color: string; icon: React.ComponentType<any> }) => (
  <div style={{ ...card, padding: 16 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <p style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>{label}</p>
      <Icon size={15} style={{ color }} />
    </div>
    <p style={{ fontSize: 24, fontWeight: 700, color, marginTop: 4, lineHeight: 1.1 }}>{value}</p>
    <p style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>{sub}</p>
  </div>
);

const Panel = ({ title, icon: Icon, right, children }: { title: string; icon: React.ComponentType<any>; right?: React.ReactNode; children: React.ReactNode }) => (
  <div style={{ ...card, padding: 16 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingBottom: 12, marginBottom: 12, borderBottom: `0.5px solid ${C.lineL}`, flexWrap: 'wrap' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: C.text }}><Icon size={14} style={{ color: C.blue }} />{title}</span>
      {right}
    </div>
    {children}
  </div>
);

const Empty = ({ icon: Icon, title, text }: { icon: React.ComponentType<any>; title: string; text?: string }) => (
  <div style={{ padding: '32px 16px', textAlign: 'center' }}>
    <Icon size={28} style={{ color: '#B8D4E8', margin: '0 auto 10px' }} />
    <p style={{ fontSize: 13, fontWeight: 600, color: C.sub, marginBottom: 4 }}>{title}</p>
    {text && <p style={{ fontSize: 12, color: C.muted, maxWidth: 360, margin: '0 auto' }}>{text}</p>}
  </div>
);

const Segmented = <T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { value: T; label: string; icon: React.ComponentType<any> }[] }) => (
  <div style={{ display: 'inline-flex', gap: 2, padding: 4, borderRadius: 12, background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)' }}>
    {items.map((i) => (
      <button key={i.value} onClick={() => onChange(i.value)} aria-pressed={value === i.value}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', background: value === i.value ? C.blue : 'transparent', color: value === i.value ? '#fff' : 'rgba(200,230,248,.9)' }}>
        <i.icon size={12} />{i.label}
      </button>
    ))}
  </div>
);

/* ─── Tableau : tri, recherche, pagination, CSV ───────────── */
interface Column<T> {
  key: string; label: string; align?: 'left' | 'right';
  render?: (r: T) => React.ReactNode; sort?: (r: T) => number | string; csv?: (r: T) => string | number; hidden?: boolean;
}
function DataTable<T extends { id: number }>({ data, columns, searchKeys, exportName, emptyMsg }: {
  data: T[]; columns: Column<T>[]; searchKeys: string[]; exportName: string; emptyMsg: string;
}) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [asc, setAsc] = useState(false);
  const shown = columns.filter((c) => !c.hidden);

  const rows = useMemo(() => {
    let r = data;
    const q = search.trim().toLowerCase();
    if (q) r = r.filter((x) => searchKeys.some((k) => String((x as any)[k] ?? '').toLowerCase().includes(q)));
    const col = columns.find((c) => c.key === sortKey);
    if (col?.sort) {
      const f = col.sort;
      r = [...r].sort((a, b) => {
        const x = f(a), y = f(b);
        const cmp = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'fr');
        return asc ? cmp : -cmp;
      });
    }
    return r;
  }, [data, search, searchKeys, columns, sortKey, asc]);

  useEffect(() => setPage(1), [search, perPage, sortKey, asc, data.length]);
  const totalPages = Math.max(1, Math.ceil(rows.length / perPage));
  const slice = rows.slice((page - 1) * perPage, page * perPage);

  const exportCsv = () => {
    const cols = columns.filter((c) => c.csv || c.sort);
    const val = (c: Column<T>, r: T) => (c.csv ? c.csv(r) : c.sort!(r));
    const csv = [cols.map((c) => c.label).join(';'), ...rows.map((r) => cols.map((c) => `"${String(val(c, r)).replace(/"/g, '""')}"`).join(';'))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = `${exportName}_${dayStr()}.csv`;
    a.click();
  };

  if (!data.length) return <Empty icon={MapPin} title={emptyMsg} text="Aucune donnée sur la période et les filtres choisis." />;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
          <input aria-label="Rechercher dans le tableau" placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...input, paddingLeft: 30, width: 230 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{fmtNum(rows.length)} résultat{rows.length > 1 ? 's' : ''}</span>
          <select aria-label="Lignes par page" value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} style={{ ...input, height: 30, width: 'auto', fontSize: 11 }}>
            {[10, 20, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}
          </select>
          <button onClick={exportCsv} style={{ ...btnGhost, padding: '5px 10px' }}><Download size={12} /> CSV</button>
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.lineL}` }}>
              {shown.map((c) => (
                <th key={c.key} className={c.sort ? 'geo-th' : undefined} aria-sort={sortKey === c.key ? (asc ? 'ascending' : 'descending') : undefined}
                  onClick={() => { if (!c.sort) return; if (sortKey === c.key) setAsc((a) => !a); else { setSortKey(c.key); setAsc(false); } }}
                  style={{ padding: '0 12px 10px 0', textAlign: c.align || 'left', fontSize: 11, fontWeight: 700, color: sortKey === c.key ? C.blueD : C.muted, whiteSpace: 'nowrap' }}>
                  {c.label}{sortKey === c.key && (asc ? ' ↑' : ' ↓')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((r) => (
              <tr key={r.id} className="geo-row" style={{ borderBottom: `1px solid ${C.surface}` }}>
                {shown.map((c) => <td key={c.key} style={{ padding: '10px 12px 10px 0', textAlign: c.align || 'left', color: C.text }}>{c.render ? c.render(r) : c.sort ? String(c.sort(r)) : ''}</td>)}
              </tr>
            ))}
            {slice.length === 0 && <tr><td colSpan={shown.length}><Empty icon={Search} title="Aucun résultat" text="Modifiez la recherche." /></td></tr>}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
          <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>Page {page} sur {totalPages}</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} aria-label="Page précédente" style={{ ...btnGhost, padding: '5px 9px', opacity: page === 1 ? 0.5 : 1 }}><ChevronLeft size={13} /></button>
            <button onClick={() => setPage((p) => p + 1)} disabled={page === totalPages} aria-label="Page suivante" style={{ ...btnGhost, padding: '5px 9px', opacity: page === totalPages ? 0.5 : 1 }}><ChevronRight size={13} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Carte Leaflet (impérative : clusters, chaleur, fonds de carte)
   Leaflet vient du paquet npm déjà installé ; les plugins cluster/chaleur
   sont chargés à la demande, comme dans le tableau de bord analytique.
   ═══════════════════════════════════════════════════════════ */
type MapMode = 'cluster' | 'markers' | 'heat';
type TileKey = 'clair' | 'osm' | 'satellite';
const TILES: Record<TileKey, { label: string; url: string; attr: string; sub?: string }> = {
  clair: { label: 'Clair', url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', attr: '&copy; OpenStreetMap &copy; CARTO', sub: 'abcd' },
  osm: { label: 'OSM', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attr: '&copy; OpenStreetMap' },
  satellite: { label: 'Satellite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr: 'Tiles &copy; Esri' },
};

let leafletPromise: Promise<any> | null = null;
const loadScript = (src: string) => new Promise<void>((resolve) => {
  const s = document.createElement('script');
  s.src = src; s.async = true; s.onload = () => resolve(); s.onerror = () => resolve(); // un plugin absent ne bloque pas la carte
  document.head.appendChild(s);
});
function loadLeaflet(): Promise<any> {
  if (!leafletPromise) {
    leafletPromise = (async () => {
      // @ts-ignore — les types de leaflet ne sont pas toujours installés
      const mod = await import('leaflet');
      const L = (mod as any).default ?? mod;
      (window as any).L = L;
      if (!document.getElementById('mc-css')) {
        const l = document.createElement('link');
        l.id = 'mc-css'; l.rel = 'stylesheet'; l.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css';
        document.head.appendChild(l);
      }
      await Promise.all([
        loadScript('https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js'),
        loadScript('https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js'),
      ]);
      return L;
    })();
  }
  return leafletPromise;
}

const customerPopup = (c: MapCustomer) => `
  <div>
    <div style="background:${C.navy};color:#fff;padding:12px 14px">
      <p style="margin:0;font-weight:700;font-size:14px">${esc(c.full_name)}</p>
      <p style="margin:2px 0 0;font-size:11px;opacity:.8">${esc(c.phone)}</p>
    </div>
    <div style="padding:12px 14px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;margin-bottom:10px">
        ${[['Zone', c.zone], ['Base', c.base], ['Carte', c.pushcard_type], ['Vendeur', c.vendor_name]].map(([k, v]) =>
          `<div style="background:${C.surface};border-radius:6px;padding:5px 8px"><div style="color:${C.muted};font-size:10px">${k}</div><strong style="color:${C.text}">${esc(v) || '—'}</strong></div>`).join('')}
      </div>
      ${(c.sales_details || []).slice(0, 4).map((s) =>
        `<div style="display:flex;justify-content:space-between;font-size:11px;padding:3px 0;border-bottom:1px solid ${C.surface}"><span>${esc(s.product)} ${esc(s.format)} × ${esc(s.quantity)}</span><strong>${fmtNum(s.amount)}</strong></div>`).join('')}
      <div style="margin-top:10px;background:${C.greenBg};color:${C.greenTx};border-radius:8px;padding:8px 10px">
        <strong style="font-size:14px">${fmtCFA(c.total_sales_amount)}</strong>
        <div style="font-size:11px">${esc(c.total_quantity)} article(s) · ${esc(c.sales_count)} achat(s) · le ${fmtDate(c.purchase_date)}</div>
      </div>
    </div>
  </div>`;

const posPopup = (p: PointOfSale) => `
  <div>
    <div style="background:${C.navy};color:#fff;padding:12px 14px">
      <p style="margin:0;font-weight:700;font-size:14px">${esc(p.name)}</p>
      <p style="margin:2px 0 0;font-size:11px;opacity:.8">${esc(p.owner)}</p>
    </div>
    <div style="padding:12px 14px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;margin-bottom:10px">
        ${[['Type', p.type_display], ['Statut', p.status_display], ['Téléphone', p.phone], ['Commune', p.commune]].map(([k, v]) =>
          `<div style="background:${C.surface};border-radius:6px;padding:5px 8px"><div style="color:${C.muted};font-size:10px">${k}</div><strong style="color:${C.text}">${esc(v) || '—'}</strong></div>`).join('')}
      </div>
      <p style="margin:0 0 8px;font-size:11px;color:${C.muted}">${esc(p.address)}</p>
      <div style="background:${C.violetBg};color:${C.violet};border-radius:8px;padding:8px 10px">
        <strong style="font-size:14px">${fmtCFA(p.turnover)}</strong>
        <div style="font-size:11px">${esc(p.orders_summary?.total_orders ?? 0)} commande(s) · ${esc(p.orders_summary?.total_items ?? 0)} article(s) · score ${esc(p.evaluation_score)}/5</div>
      </div>
    </div>
  </div>`;

function GeoMap({ customers, pos, showCustomers, showPOS, focus, onFocusHandled }: {
  customers: MapCustomer[]; pos: PointOfSale[]; showCustomers: boolean; showPOS: boolean;
  focus: { key: string; nonce: number } | null; onFocusHandled: () => void;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const tileRef = useRef<any>(null);
  const layersRef = useRef<any[]>([]);
  const markersRef = useRef<Map<string, any>>(new Map());
  const groupsRef = useRef<Map<string, any>>(new Map());
  const pendingFocus = useRef<string | null>(null);

  const [ready, setReady] = useState(false);
  const [failedLoad, setFailedLoad] = useState(false);
  const [mode, setMode] = useState<MapMode>('cluster');
  const [tile, setTile] = useState<TileKey>('clair');
  const [fullscreen, setFullscreen] = useState(false);
  const [fitSignal, setFitSignal] = useState(0);

  // Références stables : sinon la carte serait reconstruite et recadrée à chaque rendu du parent
  const shownC = useMemo(() => (showCustomers ? customers : []), [showCustomers, customers]);
  const shownP = useMemo(() => (showPOS ? pos : []), [showPOS, pos]);

  // Chargement de Leaflet puis création de la carte
  useEffect(() => {
    let alive = true;
    loadLeaflet().then((L) => {
      if (!alive || !divRef.current || mapRef.current) return;
      LRef.current = L;
      const m = L.map(divRef.current, { center: [5.36, -4.0], zoom: 12, zoomControl: false });
      L.control.zoom({ position: 'bottomright' }).addTo(m);
      mapRef.current = m;
      setReady(true);
    }).catch(() => alive && setFailedLoad(true));
    return () => { alive = false; if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  // Fond de carte
  useEffect(() => {
    if (!ready) return;
    const L = LRef.current, cfg = TILES[tile];
    if (tileRef.current) tileRef.current.remove();
    tileRef.current = L.tileLayer(cfg.url, { attribution: cfg.attr, maxZoom: 19, subdomains: cfg.sub || 'abc' }).addTo(mapRef.current);
    tileRef.current.bringToBack();
  }, [ready, tile]);

  const applyFocus = useCallback(() => {
    const key = pendingFocus.current;
    const map = mapRef.current;
    if (!key || !map) return;
    const marker = markersRef.current.get(key);
    if (!marker) return;
    pendingFocus.current = null;
    const group = groupsRef.current.get(key.startsWith('c-') ? 'c' : 'p');
    if (group?.zoomToShowLayer) group.zoomToShowLayer(marker, () => marker.openPopup());
    else {
      const ll = marker.getLatLng();
      if (ll && Number.isFinite(ll.lat) && Number.isFinite(ll.lng)) {
        map.flyTo(ll, 16, { duration: 1 });
      }
      setTimeout(() => marker.openPopup(), 1000);
    }
    onFocusHandled();
  }, [onFocusHandled]);

  // Couches de données
  useEffect(() => {
    if (!ready) return;
    const L = LRef.current, map = mapRef.current;
    layersRef.current.forEach((l) => map.removeLayer(l));
    layersRef.current = []; markersRef.current.clear(); groupsRef.current.clear();

    if (mode === 'heat' && L.heatLayer) {
      const maxC = Math.max(1, ...shownC.map((c) => c.total_sales_amount || 0));
      const maxP = Math.max(1, ...shownP.map((p) => p.turnover || 0));
      const pts: [number, number, number][] = [];
      for (const c of shownC) {
        const p = latLngOf(c);
        if (p) pts.push([p[0], p[1], Math.max(0.15, (c.total_sales_amount || 0) / maxC)]);
      }
      for (const p of shownP) {
        const pp = latLngOf(p);
        if (pp) pts.push([pp[0], pp[1], Math.max(0.15, (p.turnover || 0) / maxP)]);
      }
      if (pts.length) {
        const heat = L.heatLayer(pts, { radius: 26, blur: 20, maxZoom: 15, gradient: { 0.2: C.blueL, 0.5: C.green, 0.8: C.amber, 1: C.red } }).addTo(map);
        layersRef.current.push(heat);
      }
    } else {
      const makeGroup = (color: string) => (mode === 'cluster' && L.markerClusterGroup
        ? L.markerClusterGroup({
          showCoverageOnHover: false, maxClusterRadius: 50,
          iconCreateFunction: (cl: any) => {
            const n = cl.getChildCount(), size = n < 10 ? 36 : n < 50 ? 44 : 54;
            return L.divIcon({
              html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font:700 13px system-ui;border:3px solid #fff;box-shadow:0 0 0 5px ${color}33,0 3px 10px rgba(10,30,46,.3)">${n}</div>`,
              className: '', iconSize: [size, size],
            });
          },
        })
        : L.layerGroup());

      const add = (kind: 'c' | 'p', items: any[], color: string, radius: string, popup: (x: any) => string, label: (x: any) => string) => {
        if (!items.length) return;
        const group = makeGroup(color);
        items.forEach((it) => {
          const p = latLngOf(it);
          if (!p) return; // jamais de NaN vers Leaflet
          const icon = L.divIcon({
            className: '', iconSize: [22, 22], iconAnchor: [11, 11], popupAnchor: [0, -12],
            html: `<div style="width:22px;height:22px;border-radius:${radius};background:${color};border:2.5px solid #fff;box-shadow:0 2px 6px rgba(10,30,46,.35)"></div>`,
          });
          const m = L.marker(p, { icon })
            .bindTooltip(esc(label(it)), { direction: 'top', offset: [0, -12] })
            .bindPopup(popup(it), { maxWidth: 270, className: 'geo-popup', autoPanPadding: [40, 40] });
          group.addLayer(m);
          markersRef.current.set(`${kind}-${it.id}`, m);
        });
        group.addTo(map);
        layersRef.current.push(group);
        groupsRef.current.set(kind, group);
      };
      add('c', shownC, CUSTOMER_COLOR, '50%', customerPopup, (c) => c.full_name);
      add('p', shownP, POS_COLOR, '7px', posPopup, (p) => p.name);
    }
    applyFocus();
  }, [ready, shownC, shownP, mode, applyFocus]);

  // Recadrage — protégé contre toute coordonnée invalide
  useEffect(() => {
    if (!ready) return;
    const L = LRef.current, map = mapRef.current;
    if (!L || !map) return;

    const pts: [number, number][] = [];
    for (const x of shownC) { const p = latLngOf(x); if (p) pts.push(p); }
    for (const x of shownP) { const p = latLngOf(x); if (p) pts.push(p); }

    if (!pts.length) return;

    const valid = pts.filter(([la, ln]) => Number.isFinite(la) && Number.isFinite(ln));
    if (!valid.length) return;

    try {
      if (valid.length === 1) map.flyTo(valid[0], 15, { duration: 0.8 });
      else map.flyToBounds(L.latLngBounds(valid), { padding: [40, 40], maxZoom: 15, duration: 0.8 });
    } catch {
      // Une mauvaise coordonnée ne doit jamais faire planter la carte
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, shownC, shownP, fitSignal]);

  // Demande de focus depuis les tableaux
  useEffect(() => {
    if (!focus) return;
    pendingFocus.current = focus.key;
    if (mode === 'heat') setMode('markers'); // la chaleur n'a pas de marqueurs : on bascule
    else applyFocus();
  }, [focus, mode, applyFocus]);

  // Plein écran
  useEffect(() => {
    const t = setTimeout(() => mapRef.current?.invalidateSize(), 300);
    if (!fullscreen) return () => clearTimeout(t);
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen(false); };
    window.addEventListener('keydown', h);
    return () => { clearTimeout(t); window.removeEventListener('keydown', h); };
  }, [fullscreen]);

  const total = shownC.length + shownP.length;
  const wrap: React.CSSProperties = fullscreen ? { position: 'fixed', inset: 0, zIndex: 2000, background: '#fff', padding: 12 } : { position: 'relative' };

  return (
    <div style={wrap}>
      <div style={{ position: 'relative', height: fullscreen ? '100%' : 480 }}>
        <div ref={divRef} role="application" aria-label="Carte des clients et points de vente"
          style={{ height: '100%', width: '100%', borderRadius: 12, border: `1px solid ${C.line}`, background: C.surface, overflow: 'hidden' }} />

        {!ready && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.surface, borderRadius: 12 }}>
            {failedLoad
              ? <Empty icon={AlertTriangle} title="La carte n'a pas pu se charger" text="Vérifiez la connexion, puis actualisez la page." />
              : <div style={{ textAlign: 'center' }}><Loader2 className="geo-spin" size={26} style={{ color: C.blue, margin: '0 auto 8px' }} /><p style={{ fontSize: 12, color: C.muted }}>Chargement de la carte…</p></div>}
          </div>
        )}

        {ready && (
          <>
            <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button className="geo-chip" data-active={mode === 'cluster'} onClick={() => setMode('cluster')}><Layers3 size={12} /> Regroupés</button>
                <button className="geo-chip" data-active={mode === 'markers'} onClick={() => setMode('markers')}><MapPin size={12} /> Points</button>
                <button className="geo-chip" data-active={mode === 'heat'} onClick={() => setMode('heat')} title="Pondérée par le montant des ventes"><Flame size={12} /> Chaleur</button>
              </div>
              <button className="geo-chip" onClick={() => setFitSignal((n) => n + 1)} style={{ alignSelf: 'flex-start' }}><Target size={12} /> Recadrer</button>
            </div>
            <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <button className="geo-chip" onClick={() => setFullscreen((f) => !f)}>{fullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}{fullscreen ? 'Réduire' : 'Plein écran'}</button>
              {(Object.keys(TILES) as TileKey[]).map((k) => <button key={k} className="geo-chip" data-active={tile === k} onClick={() => setTile(k)}>{TILES[k].label}</button>)}
            </div>
            <div style={{ position: 'absolute', bottom: 12, left: 12, zIndex: 1000, display: 'flex', gap: 10, alignItems: 'center', padding: '6px 10px', borderRadius: 10, background: 'rgba(255,255,255,.96)', border: `1px solid ${C.line}`, fontSize: 11, fontWeight: 600, color: C.sub }}>
              {showCustomers && <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: CUSTOMER_COLOR }} />Clients ({shownC.length})</span>}
              {showPOS && <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: POS_COLOR }} />Points de vente ({shownP.length})</span>}
              {total === 0 && <span style={{ color: C.muted }}>Aucun point à afficher</span>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Composant principal
   ═══════════════════════════════════════════════════════════ */
const MapComponent = () => {
  const initial: MapFilters = { start_date: dayStr(7), end_date: dayStr(0), zone: '', pushcard_type: '' };
  const [applied, setApplied] = useState<MapFilters>(initial);
  const [draft, setDraft] = useState<MapFilters>(initial);
  const [mapData, setMapData] = useState<MapResponse | null>(null);
  const [pointsOfSale, setPointsOfSale] = useState<PointOfSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failed, setFailed] = useState<string[]>([]);
  const [viewType, setViewType] = useState<ViewType>('both');
  const [vendorFilter, setVendorFilter] = useState<number | null>(null);
  const [focus, setFocus] = useState<{ key: string; nonce: number } | null>(null);
  const [showAllIssues, setShowAllIssues] = useState(false);
  const [zones, setZones] = useState<string[]>([]);
  const reqId = useRef(0);
  const mapAnchor = useRef<HTMLDivElement>(null);

  const load = useCallback(async (isRefresh = false) => {
    const id = ++reqId.current;
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    const p = new URLSearchParams();
    if (applied.start_date) p.append('start_date', applied.start_date);
    if (applied.end_date) p.append('end_date', applied.end_date);
    if (applied.zone) p.append('zone', applied.zone);
    if (applied.pushcard_type) p.append('pushcard_type', applied.pushcard_type);
    const pp = new URLSearchParams();
    if (applied.start_date) pp.append('start_date', applied.start_date);
    if (applied.end_date) pp.append('end_date', applied.end_date);

    const [a, b] = await Promise.allSettled([apiService.get(`/carte/?${p}`), apiService.get(`/pointsaleorders/?${pp}`)]);
    const failedNow: string[] = [];
    let md: MapResponse | null = null, pd: PointsOfSaleResponse | null = null;
    if (a.status === 'fulfilled' && a.value.ok) { try { md = await a.value.json(); } catch { failedNow.push('clients'); } } else failedNow.push('clients');
    if (b.status === 'fulfilled' && b.value.ok) { try { pd = await b.value.json(); } catch { failedNow.push('points de vente'); } } else failedNow.push('points de vente');
    if (id !== reqId.current) return;

    setMapData(md);
    setPointsOfSale(pd?.points_of_sale ?? []);
    setFailed(failedNow);
    if (failedNow.length === 2) setError('Impossible de charger les données de la carte. Vérifiez la connexion puis réessayez.');
    if (md?.customers) setZones((z) => [...new Set([...z, ...md!.customers.map((c) => c.zone).filter(Boolean)])].sort());
    setVendorFilter(null);
    setLoading(false); setRefreshing(false);
  }, [applied]);

  useEffect(() => { load(); }, [load]);

  /* Données enrichies et dérivées */
  const customers = useMemo<CustomerRow[]>(
    () => (mapData?.customers ?? []).filter((c) => !vendorFilter || c.vendor_id === vendorFilter).map((c) => ({ ...c, geo: geoState(c.latitude, c.longitude) })),
    [mapData, vendorFilter],
  );
  const posRows = useMemo<PosRow[]>(() => pointsOfSale.map((p) => ({ ...p, geo: geoState(p.latitude, p.longitude) })), [pointsOfSale]);
  const plotC = useMemo(() => customers.filter((c) => c.geo === 'ok'), [customers]);
  const plotP = useMemo(() => posRows.filter((p) => p.geo === 'ok'), [posRows]);

  const showC = viewType !== 'points-of-sale';
  const showP = viewType !== 'customers';
  const salesC = customers.reduce((a, c) => a + (c.total_sales_amount || 0), 0);
  const revenueP = posRows.reduce((a, p) => a + (p.turnover || 0), 0);
  const ordersP = posRows.reduce((a, p) => a + (p.orders_summary?.total_orders || 0), 0);

  const issues = useMemo(() => [
    ...(showC ? customers.filter((c) => c.geo !== 'ok').map((c) => ({ id: `c-${c.id}`, kind: 'Client', name: c.full_name, where: c.zone || c.vendor_name, geo: c.geo, lat: c.latitude, lng: c.longitude })) : []),
    ...(showP ? posRows.filter((p) => p.geo !== 'ok').map((p) => ({ id: `p-${p.id}`, kind: 'Point de vente', name: p.name, where: p.commune || p.address, geo: p.geo, lat: p.latitude, lng: p.longitude })) : []),
  ], [customers, posRows, showC, showP]);

  const exportIssues = () => {
    const csv = ['Type;Nom;Lieu;Problème;Latitude;Longitude', ...issues.map((i) =>
      [i.kind, i.name, i.where, i.geo === 'missing' ? 'Coordonnées manquantes' : "Hors Côte d'Ivoire", i.lat ?? '', i.lng ?? ''].map((f) => `"${String(f).replace(/"/g, '""')}"`).join(';'))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = `coordonnees_a_corriger_${dayStr()}.csv`;
    a.click();
  };

  const locate = (key: string) => {
    setFocus({ key, nonce: Date.now() });
    mapAnchor.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const clearFocus = useCallback(() => setFocus(null), []);

  const dateError = draft.start_date && draft.end_date && draft.end_date < draft.start_date ? 'La date de fin doit suivre la date de début.' : null;
  const preset = (days: number) => setDraft((d) => ({ ...d, start_date: dayStr(days), end_date: dayStr(0) }));
  const chips = [
    { key: 'zone', label: `Zone : ${applied.zone}`, on: !!applied.zone, clear: () => { setApplied((f) => ({ ...f, zone: '' })); setDraft((f) => ({ ...f, zone: '' })); } },
    { key: 'card', label: `Carte : ${applied.pushcard_type}`, on: !!applied.pushcard_type, clear: () => { setApplied((f) => ({ ...f, pushcard_type: '' })); setDraft((f) => ({ ...f, pushcard_type: '' })); } },
    { key: 'vendor', label: `Vendeur : ${mapData?.vendors_summary.find((v) => v.vendor_id === vendorFilter)?.vendor_name ?? ''}`, on: !!vendorFilter, clear: () => setVendorFilter(null) },
  ].filter((c) => c.on);

  const customerColumns: Column<CustomerRow>[] = [
    { key: 'name', label: 'Client', sort: (r) => r.full_name, csv: (r) => r.full_name, render: (r) => (<div><p style={{ fontWeight: 600 }}>{r.full_name}</p><p style={{ fontSize: 11, color: C.muted }}>{r.phone}</p></div>) },
    { key: 'zone', label: 'Zone', sort: (r) => r.zone || '', render: (r) => <span style={{ fontSize: 12, color: C.muted }}>{r.zone || '—'}</span> },
    { key: 'vendor', label: 'Vendeur', sort: (r) => r.vendor_name || '', render: (r) => <span style={{ fontSize: 12, color: C.muted }}>{r.vendor_name}</span> },
    { key: 'card', label: 'Carte', sort: (r) => r.pushcard_type || '', render: (r) => <Pill bg={C.pale} tx={C.blueD}>{r.pushcard_type || '—'}</Pill> },
    { key: 'date', label: 'Achat', sort: (r) => r.purchase_date || '', render: (r) => <span style={{ fontSize: 12, color: C.muted }}>{fmtDate(r.purchase_date)}</span> },
    { key: 'geo', label: 'Coordonnées', sort: (r) => r.geo, csv: (r) => r.geo, render: (r) => <GeoBadge geo={r.geo} /> },
    { key: 'amount', label: 'Montant', align: 'right', sort: (r) => r.total_sales_amount, render: (r) => <strong>{fmtCFA(r.total_sales_amount)}</strong> },
    { key: 'lat', label: 'Latitude', hidden: true, csv: (r) => r.latitude ?? '' },
    { key: 'lng', label: 'Longitude', hidden: true, csv: (r) => r.longitude ?? '' },
    { key: 'act', label: '', render: (r) => r.geo === 'ok' ? <button onClick={() => locate(`c-${r.id}`)} style={{ ...btnGhost, padding: '4px 10px' }}><Navigation size={11} /> Localiser</button> : null },
  ];
  const posColumns: Column<PosRow>[] = [
    { key: 'name', label: 'Point de vente', sort: (r) => r.name, csv: (r) => r.name, render: (r) => (<div><p style={{ fontWeight: 600 }}>{r.name}</p><p style={{ fontSize: 11, color: C.muted }}>{r.owner}</p></div>) },
    { key: 'type', label: 'Type', sort: (r) => r.type_display || '', render: (r) => <Pill bg={C.pale} tx={C.blueD}>{r.type_display || '—'}</Pill> },
    { key: 'commune', label: 'Commune', sort: (r) => r.commune || '', render: (r) => <span style={{ fontSize: 12, color: C.muted }}>{r.commune || '—'}</span> },
    { key: 'phone', label: 'Téléphone', sort: (r) => r.phone || '', render: (r) => <span style={{ fontSize: 12, color: C.muted }}>{r.phone || '—'}</span> },
    { key: 'geo', label: 'Coordonnées', sort: (r) => r.geo, csv: (r) => r.geo, render: (r) => <GeoBadge geo={r.geo} /> },
    { key: 'orders', label: 'Commandes', align: 'right', sort: (r) => r.orders_summary?.total_orders ?? 0, render: (r) => fmtNum(r.orders_summary?.total_orders ?? 0) },
    { key: 'ca', label: 'CA', align: 'right', sort: (r) => r.turnover, render: (r) => <strong>{fmtCFA(r.turnover)}</strong> },
    { key: 'lat', label: 'Latitude', hidden: true, csv: (r) => r.latitude ?? '' },
    { key: 'lng', label: 'Longitude', hidden: true, csv: (r) => r.longitude ?? '' },
    { key: 'act', label: '', render: (r) => r.geo === 'ok' ? <button onClick={() => locate(`p-${r.id}`)} style={{ ...btnGhost, padding: '4px 10px' }}><Navigation size={11} /> Localiser</button> : null },
  ];

  const periodLabel = `Du ${fmtDate(applied.start_date)} au ${fmtDate(applied.end_date)}`;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <style>{CSS}</style>

      {/* Bandeau */}
      <div style={{ background: C.navy, borderRadius: 16, padding: 20, display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <MapPin size={16} style={{ color: C.blueL }} />
            <span style={{ color: 'rgba(200,230,248,.9)', fontSize: 12, fontWeight: 600 }}>LanfiaLink Géolocalisation</span>
          </div>
          <p style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>Où vendent vos équipes et où sont vos points de vente</p>
          <p style={{ color: 'rgba(200,230,248,.85)', fontSize: 12, marginTop: 6 }}>{periodLabel}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <Segmented<ViewType> value={viewType} onChange={setViewType} items={[
            { value: 'customers', label: 'Clients', icon: Users },
            { value: 'points-of-sale', label: 'Points de vente', icon: Store },
            { value: 'both', label: 'Les deux', icon: ShoppingBag },
          ]} />
          <button onClick={() => load(true)} disabled={refreshing} style={{ ...btn('rgba(79,179,232,.18)'), opacity: refreshing ? 0.7 : 1 }}>
            <RefreshCw size={13} className={refreshing ? 'geo-spin' : undefined} /> {refreshing ? 'Actualisation…' : 'Actualiser'}
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" style={{ display: 'flex', gap: 10, alignItems: 'center', padding: 12, borderRadius: 12, background: C.redBg, color: C.redTx, fontSize: 12 }}>
          <AlertTriangle size={14} /><span style={{ flex: 1 }}>{error}</span>
          <button onClick={() => load()} style={{ ...btnGhost, padding: '4px 10px', color: C.redTx }}>Réessayer</button>
        </div>
      )}
      {failed.length === 1 && !loading && (
        <div role="status" style={{ display: 'flex', gap: 10, alignItems: 'center', padding: 12, borderRadius: 12, background: C.amberBg, color: C.amberTx, fontSize: 12 }}>
          <AlertTriangle size={14} />
          <span style={{ flex: 1 }}>Les données « {failed[0]} » n'ont pas pu être chargées. Le reste de la carte reste à jour.</span>
          <button onClick={() => load(true)} style={{ ...btnGhost, padding: '4px 10px', color: C.amberTx }}>Réessayer</button>
        </div>
      )}

      {/* Filtres */}
      <div style={{ ...card, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 13, fontWeight: 700, color: C.text }}>
          <SlidersHorizontal size={14} style={{ color: C.blue }} />Filtres
        </div>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
          <label><span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 5 }}>Du</span>
            <input type="date" style={input} value={draft.start_date} max={draft.end_date || undefined} onChange={(e) => setDraft((d) => ({ ...d, start_date: e.target.value }))} /></label>
          <label><span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 5 }}>Au</span>
            <input type="date" style={input} value={draft.end_date} min={draft.start_date || undefined} onChange={(e) => setDraft((d) => ({ ...d, end_date: e.target.value }))} /></label>
          <label><span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 5 }}>Zone (clients)</span>
            <input list="geo-zones" style={input} value={draft.zone} placeholder="Ex : Plateau" onChange={(e) => setDraft((d) => ({ ...d, zone: e.target.value }))} />
            <datalist id="geo-zones">{zones.map((z) => <option key={z} value={z} />)}</datalist></label>
          <label><span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 5 }}>Type de carte (clients)</span>
            <select style={input} value={draft.pushcard_type} onChange={(e) => setDraft((d) => ({ ...d, pushcard_type: e.target.value }))}>
              <option value="">Tous les types</option><option value="pushcard">Pushcard</option><option value="autre">Autre</option>
            </select></label>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', marginTop: 14 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {[7, 30, 90].map((d) => (
              <button key={d} onClick={() => preset(d)} style={{ ...btnGhost, padding: '4px 12px', borderRadius: 99, fontSize: 11 }}>{d} jours</button>
            ))}
            <span style={{ fontSize: 11, color: C.muted }}>La zone et le type de carte ne filtrent que les clients.</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {dateError && <span role="alert" style={{ fontSize: 11, color: C.red }}>{dateError}</span>}
            <button disabled={!!dateError} onClick={() => setApplied(draft)} style={{ ...btn(C.blue), opacity: dateError ? 0.5 : 1 }}>Appliquer les filtres</button>
          </div>
        </div>
      </div>

      {chips.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {chips.map((c) => (
            <span key={c.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 4px 4px 10px', borderRadius: 99, background: C.pale, border: `1px solid ${C.line}`, color: C.blueD, fontSize: 11, fontWeight: 600 }}>
              {c.label}
              <button onClick={c.clear} aria-label={`Retirer le filtre ${c.label}`} style={{ width: 18, height: 18, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', color: C.red, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={11} /></button>
            </span>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ ...card, padding: 56, textAlign: 'center' }}>
          <Loader2 className="geo-spin" size={24} style={{ color: C.blue, margin: '0 auto 10px' }} />
          <p style={{ fontSize: 13, color: C.muted }}>Chargement des données cartographiques…</p>
        </div>
      ) : (
        <>
          {/* KPI */}
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
            {showC && <Kpi label="Clients" value={fmtNum(customers.length)} sub={`${plotC.length} localisés sur la carte`} color={C.green} icon={Users} />}
            {showC && <Kpi label="Ventes clients" value={fmtCFA(salesC)} sub={`${mapData?.total_vendors ?? 0} vendeur${(mapData?.total_vendors ?? 0) > 1 ? 's' : ''}`} color={C.blueD} icon={TrendingUp} />}
            {showP && <Kpi label="Points de vente" value={fmtNum(posRows.length)} sub={`${plotP.length} localisés sur la carte`} color={C.violet} icon={Store} />}
            {showP && <Kpi label="CA points de vente" value={fmtCFA(revenueP)} sub={`${fmtNum(ordersP)} commandes`} color={C.amber} icon={ShoppingBag} />}
          </div>

          {/* Vendeurs */}
          {showC && (mapData?.vendors_summary?.length ?? 0) > 0 && (
            <Panel title="Vendeurs sur la période" icon={User}
              right={vendorFilter ? <button onClick={() => setVendorFilter(null)} style={{ ...btnGhost, padding: '4px 10px' }}>Tous les vendeurs</button> : <span style={{ fontSize: 11, color: C.muted }}>Cliquez sur un vendeur pour filtrer la carte</span>}>
              <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                {mapData!.vendors_summary.map((v) => {
                  const on = vendorFilter === v.vendor_id;
                  return (
                    <button key={v.vendor_id} onClick={() => setVendorFilter(on ? null : v.vendor_id)} aria-pressed={on}
                      style={{ textAlign: 'left', padding: 12, borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', background: on ? C.pale : '#fff', border: `1.5px solid ${on ? C.blue : C.lineL}` }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{v.vendor_name}</p>
                      <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{v.point_of_sale}</p>
                      <p style={{ fontSize: 11, color: C.sub, marginTop: 6 }}>{v.total_customers} client{v.total_customers > 1 ? 's' : ''} · <strong>{fmtCFA(v.total_sales)}</strong></p>
                    </button>
                  );
                })}
              </div>
            </Panel>
          )}

          {/* Carte */}
          <div ref={mapAnchor} style={{ scrollMarginTop: 80 }}>
            <GeoMap customers={plotC} pos={plotP} showCustomers={showC} showPOS={showP} focus={focus} onFocusHandled={clearFocus} />
          </div>

          {/* Coordonnées à corriger */}
          {issues.length > 0 && (
            <Panel title={`Coordonnées à corriger (${issues.length})`} icon={AlertTriangle}
              right={<button onClick={exportIssues} style={{ ...btnGhost, padding: '5px 10px' }}><Download size={12} /> CSV</button>}>
              <p style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>
                Ces éléments n'apparaissent pas sur la carte : sans position fiable, ils faussent les zones et les tournées. Corrigez-les dans leur fiche ou lors de la prochaine visite terrain.
              </p>
              <div style={{ display: 'grid', gap: 6 }}>
                {(showAllIssues ? issues : issues.slice(0, 6)).map((i) => (
                  <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: C.pale, border: `1px solid ${C.lineL}`, fontSize: 12 }}>
                    <Pill bg={i.kind === 'Client' ? C.greenBg : C.violetBg} tx={i.kind === 'Client' ? C.greenTx : C.violet}>{i.kind}</Pill>
                    <strong style={{ color: C.text, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.name}</strong>
                    <span style={{ color: C.muted }}>{i.where}</span>
                    <GeoBadge geo={i.geo} />
                  </div>
                ))}
              </div>
              {issues.length > 6 && (
                <button onClick={() => setShowAllIssues((s) => !s)} style={{ ...btnGhost, marginTop: 10 }}>{showAllIssues ? 'Réduire la liste' : `Voir les ${issues.length - 6} autres`}</button>
              )}
            </Panel>
          )}

          {/* Tableaux */}
          {showC && (
            <Panel title="Clients" icon={Users}>
              <DataTable<CustomerRow> data={customers} columns={customerColumns} searchKeys={['full_name', 'phone', 'zone', 'vendor_name']} exportName="clients_carte" emptyMsg="Aucun client sur la période" />
            </Panel>
          )}
          {showP && (
            <Panel title="Points de vente" icon={Store}>
              <DataTable<PosRow> data={posRows} columns={posColumns} searchKeys={['name', 'owner', 'phone', 'commune', 'address']} exportName="points_de_vente_carte" emptyMsg="Aucun point de vente sur la période" />
            </Panel>
          )}
        </>
      )}
    </div>
  );
};

export default MapComponent;