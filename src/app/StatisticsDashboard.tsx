'use client';
// components/dashboard/StatisticsDashboard.tsx
// Vue Analytiques — même langage visuel que la vue Activations (blanc / bleu, à plat)

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3, TrendingUp, Users, MapPin, Package, ShoppingCart, DollarSign, Download,
  ArrowUp, ArrowDown, AlertTriangle, RefreshCw, ShoppingBag, ChevronLeft, ChevronRight,
  X, Search, SlidersHorizontal, ChevronDown, ChevronUp, Loader2, Wallet,
} from 'lucide-react';
import { apiService } from './ApiService';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

/* ─── Palette (identique à la vue Activations) ────────────── */
const C = {
  blue: '#1A8FD1', blueD: '#0D6FAB', blueL: '#4FB3E8', navy: '#0D4E7A',
  pale: '#EDF5FA', surface: '#F0F5F9', line: '#C0D4E6', lineL: '#D4E4F0',
  text: '#0A1E2E', sub: '#2A4A62', muted: '#5A7A92',
  green: '#0A9E7A', greenBg: '#DCF5EC', greenTx: '#044D38',
  amber: '#D08A00', amberBg: '#FBEFD6', amberTx: '#7A4F00',
  red: '#B03318', redBg: '#FCE4DC', redTx: '#7A2410',
  greyBg: '#EAF0F5', greyTx: '#3A5A72',
  violet: '#2E4DB0', violetBg: '#D4DCFA',
};
const CHART_COLORS = ['#1A8FD1', '#0D4E7A', '#4FB3E8', '#0A9E7A', '#D08A00', '#2E4DB0', '#B03318', '#6A8AA2'];

/* ─── Types ───────────────────────────────────────────────── */
interface POSStat {
  id: number; name: string; type: string; region: string; commune: string; quartier?: string;
  total_sales: number; total_orders: number; average_order_value: number;
  mobile_vendors_count: number; performance_score: number; turnover: number; sales_growth?: number;
}
interface VendorStat {
  id: number; full_name: string; phone: string; status: string; vehicle_type: string;
  zone?: string; commune?: string; quartier?: string; total_sales: number; total_purchases: number;
  average_purchase_value: number; active_days: number; efficiency_rate: number; performance: number; sales_growth?: number;
}
interface ProductStat {
  id: number; name: string; sku: string; category: string; status: string;
  total_quantity_sold: number; total_revenue: number; average_price: number; stock_rotation: number; revenue_growth?: number;
}
interface TopPurchaseVendor {
  vendor_id: number; vendor_full_name: string; vendor_phone: string; vendor_status: string; point_of_sale: string;
  total_purchase_amount: number; total_purchase_count: number; average_purchase_value: number;
  total_sales_from_purchases: number; total_sales_count: number; purchase_to_sales_efficiency: number;
}
interface PurchaseDetail {
  purchase_id: number; purchase_full_name: string; purchase_zone: string; purchase_amount: number;
  purchase_date: string; purchase_base: string; purchase_pushcard_type: string; purchase_phone: string;
  total_sales_amount: number; total_sales_count: number; sales_efficiency: number;
  main_mobile_vendor: { id: number; full_name: string; phone: string } | null;
}
interface DashboardSummary {
  total_sales: number; total_orders: number; total_mobile_vendors: number; total_points_of_sale: number;
  active_purchases: number; sales_growth: number; revenue_growth: number;
  period?: string; start_date?: string; end_date?: string;
}
interface ChartDataset { label: string; data: number[] }
interface ChartData { labels: string[]; datasets: ChartDataset[] }
interface FilterState {
  start_date?: string; end_date?: string; period?: string;
  region?: string[]; commune?: string[]; quartier?: string[]; zone?: string[];
  status?: string; vehicle_type?: string; group_by?: string;
}
interface StatsState {
  summary: DashboardSummary | null; posStats: POSStat[]; vendorStats: VendorStat[]; productStats: ProductStat[];
  topPurchaseVendors: TopPurchaseVendor[]; purchaseDetails: PurchaseDetail[]; salesChart: ChartData | null;
}

/* ─── Helpers ─────────────────────────────────────────────── */
const fmtNum = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0));
const fmtCFA = (n: number) => `${fmtNum(n)} FCFA`;
const fmtCompact = (n: number) => new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(n || 0);
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');
const toArr = (d: any): any[] => (Array.isArray(d) ? d : Array.isArray(d?.results) ? d.results : []);
const uniq = (arr: (string | undefined)[]) => [...new Set(arr.filter((v): v is string => !!v))].sort();

const formatChart = (raw: any): ChartData | null => {
  if (!raw?.labels?.length || !raw?.datasets?.length) return null;
  return { labels: raw.labels, datasets: raw.datasets.map((d: any) => ({ label: d.label || '', data: d.data || [] })) };
};

/* ─── Styles partagés ─────────────────────────────────────── */
const card: React.CSSProperties = { background: '#fff', border: `0.5px solid ${C.line}`, borderRadius: 16 };
const inputStyle: React.CSSProperties = {
  width: '100%', height: 36, borderRadius: 10, padding: '0 10px', fontSize: 13, background: '#fff',
  border: `1.5px solid ${C.line}`, color: C.text, outline: 'none', fontFamily: 'inherit',
};
const btn = (bg: string, color = '#fff'): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: bg,
  color, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
});
const btnGhost: React.CSSProperties = { ...btn('#fff', C.sub), border: `1px solid ${C.line}` };

const GLOBAL_CSS = `
@keyframes st-spin { to { transform: rotate(360deg); } }
.st-spin { animation: st-spin .8s linear infinite; }
.st-row:hover { background: #F5FAFD; }
.st-th { cursor: pointer; user-select: none; }
.st-th:hover { color: ${C.blueD}; }
@media (prefers-reduced-motion: reduce) { .st-spin { animation: none; } }
`;

/* ─── Petits composants ───────────────────────────────────── */
const Pill = ({ bg, tx, children }: { bg: string; tx: string; children: React.ReactNode }) => (
  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 700, background: bg, color: tx, whiteSpace: 'nowrap' }}>{children}</span>
);

const StatusBadge = ({ status }: { status: string }) => {
  const m: Record<string, [string, string]> = {
    actif: [C.greenBg, C.greenTx], inactif: [C.redBg, C.redTx], suspendu: [C.amberBg, C.amberTx],
    en_stock: [C.greenBg, C.greenTx], stock_faible: [C.amberBg, C.amberTx], rupture: [C.redBg, C.redTx], surstockage: [C.violetBg, C.violet],
  };
  const [bg, tx] = m[status] || [C.greyBg, C.greyTx];
  return <Pill bg={bg} tx={tx}>{(status || '—').replace('_', ' ')}</Pill>;
};

const PerfBadge = ({ score }: { score: number }) => {
  const s = Number(score || 0);
  const [bg, tx] = s >= 80 ? [C.greenBg, C.greenTx] : s >= 60 ? [C.amberBg, C.amberTx] : [C.redBg, C.redTx];
  return <Pill bg={bg} tx={tx}>{s.toFixed(1)} %</Pill>;
};

const MiniBar = ({ value, color }: { value: number; color?: string }) => {
  const c = color || (value >= 80 ? C.green : value >= 60 ? C.amber : C.red);
  return (
    <div style={{ height: 5, borderRadius: 99, background: C.surface, overflow: 'hidden', width: 80 }}>
      <div style={{ width: `${Math.max(0, Math.min(100, value))}%`, height: '100%', background: c, transition: 'width .4s' }} />
    </div>
  );
};

const Kpi = ({ label, value, sub, growth, icon: Icon, color }: {
  label: string; value: string; sub?: string; growth?: number; icon: React.ComponentType<any>; color: string;
}) => (
  <div style={{ ...card, padding: 16 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
      <p style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>{label}</p>
      <Icon size={15} style={{ color, flexShrink: 0 }} />
    </div>
    <p style={{ fontSize: 24, fontWeight: 700, color, marginTop: 4, lineHeight: 1.1 }}>{value}</p>
    {growth !== undefined && (
      <p style={{ fontSize: 11, fontWeight: 700, marginTop: 6, display: 'flex', alignItems: 'center', gap: 3, color: growth >= 0 ? C.green : C.red }}>
        {growth >= 0 ? <ArrowUp size={11} /> : <ArrowDown size={11} />}{Math.abs(growth).toFixed(1)} % vs période précédente
      </p>
    )}
    {sub && growth === undefined && <p style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>{sub}</p>}
  </div>
);

const Panel = ({ title, icon: Icon, right, children }: {
  title: string; icon: React.ComponentType<any>; right?: React.ReactNode; children: React.ReactNode;
}) => (
  <div style={{ ...card, padding: 16 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingBottom: 12, marginBottom: 12, borderBottom: `0.5px solid ${C.lineL}`, flexWrap: 'wrap' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: C.text }}>
        <Icon size={14} style={{ color: C.blue }} />{title}
      </span>
      {right}
    </div>
    {children}
  </div>
);

const Empty = ({ icon: Icon, title, text }: { icon: React.ComponentType<any>; title: string; text?: string }) => (
  <div style={{ padding: '32px 16px', textAlign: 'center' }}>
    <Icon size={28} style={{ color: '#B8D4E8', margin: '0 auto 10px' }} />
    <p style={{ fontSize: 13, fontWeight: 600, color: C.sub, marginBottom: 4 }}>{title}</p>
    {text && <p style={{ fontSize: 12, color: C.muted, maxWidth: 340, margin: '0 auto' }}>{text}</p>}
  </div>
);

const LinkBtn = ({ onClick, children, busy }: { onClick: () => void; children: React.ReactNode; busy?: boolean }) => (
  <button onClick={onClick} disabled={busy} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: C.blue, background: 'none', border: 'none', cursor: busy ? 'wait' : 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>
    {busy ? <Loader2 size={12} className="st-spin" /> : <Download size={12} />}{children}
  </button>
);

/* ─── Graphique ───────────────────────────────────────────── */
function ChartBlock({ data, type = 'bar', height = 260, money = true }: {
  data: ChartData | null; type?: 'bar' | 'line' | 'pie'; height?: number; money?: boolean;
}) {
  if (!data?.labels?.length) {
    return <div style={{ height }}><Empty icon={BarChart3} title="Pas de données sur cette période" text="Élargissez la période ou retirez un filtre." /></div>;
  }
  const fmtVal = (v: number) => (money ? fmtCFA(v) : fmtNum(v));
  const chart = {
    labels: data.labels,
    datasets: data.datasets.map((ds, i) => ({
      label: ds.label, data: ds.data,
      backgroundColor: type === 'pie' ? CHART_COLORS : type === 'line' ? `${CHART_COLORS[i % CHART_COLORS.length]}22` : CHART_COLORS[i % CHART_COLORS.length],
      borderColor: type === 'pie' ? '#fff' : CHART_COLORS[i % CHART_COLORS.length],
      borderWidth: type === 'bar' ? 0 : 2, borderRadius: type === 'bar' ? 4 : 0,
      fill: type === 'line', tension: 0.3, pointRadius: type === 'line' ? 3 : 0,
    })),
  };
  const options: any = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: type === 'pie' || data.datasets.length > 1, position: type === 'pie' ? 'right' : 'top', labels: { boxWidth: 10, font: { size: 11 }, color: C.sub } },
      tooltip: { callbacks: { label: (ctx: any) => `${ctx.label && type === 'pie' ? ctx.label : ctx.dataset.label}: ${fmtVal(ctx.raw)}` } },
    },
    scales: type === 'pie' ? undefined : {
      y: { beginAtZero: true, grid: { color: C.surface }, border: { display: false }, ticks: { color: C.muted, font: { size: 11 }, callback: (v: any) => (money ? fmtCompact(v) : v) } },
      x: { grid: { display: false }, ticks: { color: C.muted, font: { size: 11 }, maxRotation: 0, autoSkip: true } },
    },
  };
  return (
    <div style={{ height, position: 'relative' }}>
      {type === 'bar' && <Bar data={chart as any} options={options} />}
      {type === 'line' && <Line data={chart as any} options={options} />}
      {type === 'pie' && <Pie data={chart as any} options={options} />}
    </div>
  );
}

/* ─── Tableau : tri, recherche, pagination, export CSV ────── */
interface Column<T> {
  key: string; label: string; align?: 'left' | 'right' | 'center';
  render: (row: T) => React.ReactNode;
  sort?: (row: T) => number | string;
  csv?: (row: T) => string | number;
}

function paginationRange(current: number, total: number): (number | string)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '…', total];
  if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '…', current - 1, current, current + 1, '…', total];
}

function DataTable<T extends { id: number }>({ data, columns, searchKeys, emptyIcon = Package, emptyMsg, exportName, initialPerPage = 10 }: {
  data: T[]; columns: Column<T>[]; searchKeys?: string[]; emptyIcon?: React.ComponentType<any>;
  emptyMsg: string; exportName: string; initialPerPage?: number;
}) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(initialPerPage);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [asc, setAsc] = useState(false);

  const rows = useMemo(() => {
    let r = data;
    const q = search.trim().toLowerCase();
    if (q && searchKeys) r = r.filter((row) => searchKeys.some((k) => String((row as any)[k] ?? '').toLowerCase().includes(q)));
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

  // Retour page 1 seulement quand la recherche, le tri ou la taille changent (pas à chaque rendu)
  useEffect(() => setPage(1), [search, perPage, sortKey, asc, data.length]);

  const totalPages = Math.max(1, Math.ceil(rows.length / perPage));
  const slice = rows.slice((page - 1) * perPage, page * perPage);

  const toggleSort = (c: Column<T>) => {
    if (!c.sort) return;
    if (sortKey === c.key) setAsc((a) => !a); else { setSortKey(c.key); setAsc(false); }
  };

  const exportCsv = () => {
    const cols = columns.filter((c) => c.csv || c.sort);
    const val = (c: Column<T>, r: T) => (c.csv ? c.csv(r) : c.sort!(r));
    const csv = [cols.map((c) => c.label).join(';'),
      ...rows.map((r) => cols.map((c) => `"${String(val(c, r)).replace(/"/g, '""')}"`).join(';'))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = `${exportName}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  if (!data.length) return <Empty icon={emptyIcon} title={emptyMsg} text="Aucune donnée sur la période et les filtres choisis." />;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        {searchKeys ? (
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
            <input aria-label="Rechercher dans le tableau" placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ ...inputStyle, paddingLeft: 30, width: 230 }} />
          </div>
        ) : <span />}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{fmtNum(rows.length)} résultat{rows.length > 1 ? 's' : ''}</span>
          <select aria-label="Lignes par page" value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} style={{ ...inputStyle, height: 30, width: 'auto', fontSize: 11 }}>
            {[10, 20, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}
          </select>
          <button onClick={exportCsv} style={{ ...btnGhost, padding: '5px 10px' }}><Download size={12} /> CSV</button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.lineL}` }}>
              {columns.map((c) => (
                <th key={c.key} className={c.sort ? 'st-th' : undefined} onClick={() => toggleSort(c)}
                  aria-sort={sortKey === c.key ? (asc ? 'ascending' : 'descending') : undefined}
                  style={{ padding: '0 12px 10px 0', textAlign: c.align || 'left', fontSize: 11, fontWeight: 700, color: sortKey === c.key ? C.blueD : C.muted, whiteSpace: 'nowrap' }}>
                  {c.label}{sortKey === c.key && (asc ? ' ↑' : ' ↓')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((row) => (
              <tr key={row.id} className="st-row" style={{ borderBottom: `1px solid ${C.surface}` }}>
                {columns.map((c) => (
                  <td key={c.key} style={{ padding: '10px 12px 10px 0', textAlign: c.align || 'left', color: C.text }}>{c.render(row)}</td>
                ))}
              </tr>
            ))}
            {slice.length === 0 && <tr><td colSpan={columns.length}><Empty icon={Search} title="Aucun résultat" text="Modifiez la recherche." /></td></tr>}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>Page {page} sur {totalPages}</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <PagBtn onClick={() => setPage((p) => p - 1)} disabled={page === 1} label="Page précédente"><ChevronLeft size={13} /></PagBtn>
            {paginationRange(page, totalPages).map((p, i) =>
              p === '…' ? <span key={`e${i}`} style={{ padding: '0 6px', color: C.muted }}>…</span>
                : <PagBtn key={p} onClick={() => setPage(p as number)} active={page === p} label={`Page ${p}`}>{p}</PagBtn>)}
            <PagBtn onClick={() => setPage((p) => p + 1)} disabled={page === totalPages} label="Page suivante"><ChevronRight size={13} /></PagBtn>
          </div>
        </div>
      )}
    </div>
  );
}

const PagBtn = ({ onClick, disabled, active, label, children }: { onClick: () => void; disabled?: boolean; active?: boolean; label: string; children: React.ReactNode }) => (
  <button onClick={onClick} disabled={disabled} aria-label={label} aria-current={active ? 'page' : undefined}
    style={{ minWidth: 30, height: 30, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
      border: `1px solid ${active ? C.blue : C.line}`, background: active ? C.blue : '#fff', color: active ? '#fff' : disabled ? C.muted : C.sub, opacity: disabled ? 0.5 : 1 }}>
    {children}
  </button>
);

/* ─── Filtres ─────────────────────────────────────────────── */
function MultiSelect({ label, options, selected, onChange }: { label: string; options: string[]; selected: string[]; onChange: (v: string[] | undefined) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const toggle = (o: string) => {
    const next = selected.includes(o) ? selected.filter((v) => v !== o) : [...selected, o];
    onChange(next.length ? next : undefined);
  };
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        style={{ ...inputStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ color: selected.length ? C.text : C.muted }}>{selected.length ? `${selected.length} sélectionné${selected.length > 1 ? 's' : ''}` : (options.length ? 'Tous' : 'Aucune option')}</span>
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      {open && options.length > 0 && (
        <div style={{ position: 'absolute', zIndex: 20, top: '100%', marginTop: 4, width: '100%', background: '#fff', border: `1px solid ${C.line}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(13,27,42,.12)', maxHeight: 200, overflowY: 'auto' }}>
          {options.map((o) => (
            <label key={o} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', cursor: 'pointer', fontSize: 12, color: C.text }}>
              <input type="checkbox" checked={selected.includes(o)} onChange={() => toggle(o)} style={{ accentColor: C.blue }} />{o}
            </label>
          ))}
        </div>
      )}
      <span className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>{label}</span>
    </div>
  );
}

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 5 }}>{children}</span>
);

/* ═══════════════════════════════════════════════════════════
   Composant principal
   ═══════════════════════════════════════════════════════════ */
type TabId = 'overview' | 'points-of-sale' | 'vendors' | 'products' | 'pushcart' | 'analytics';
const EMPTY_FILTERS: FilterState = { group_by: 'day' };

export default function StatisticsDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [timeRange, setTimeRange] = useState('30');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failed, setFailed] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [applied, setApplied] = useState<FilterState>(EMPTY_FILTERS);
  const [draft, setDraft] = useState<FilterState>(EMPTY_FILTERS);
  const [exporting, setExporting] = useState<string | null>(null);
  const [salesView, setSalesView] = useState<'bar' | 'line'>('bar');
  const [perfScope, setPerfScope] = useState<'vendors' | 'products' | 'pos'>('vendors');
  const [perfChart, setPerfChart] = useState<ChartData | null>(null);
  const [stats, setStats] = useState<StatsState>({
    summary: null, posStats: [], vendorStats: [], productStats: [], topPurchaseVendors: [], purchaseDetails: [], salesChart: null,
  });
  const reqId = useRef(0);

  /** Paramètres envoyés à l'API : des dates précises remplacent la période glissante. */
  const params = useMemo<FilterState>(() => {
    const p: FilterState = { ...applied };
    if (applied.start_date || applied.end_date) delete p.period; else p.period = timeRange;
    return p;
  }, [applied, timeRange]);

  const loadStats = useCallback(async (isRefresh = false) => {
    const id = ++reqId.current;
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    const endpoints: { label: string; call: () => Promise<Response> }[] = [
      { label: 'synthèse', call: () => apiService.getDashboardSummary(params) },
      { label: 'points de vente', call: () => apiService.getPOSStatistics(params) },
      { label: 'commerciaux', call: () => apiService.getMobileVendorStatistics(timeRange, params) },
      { label: 'produits', call: () => apiService.getProductStatistics(timeRange, params) },
      { label: 'top prospects', call: () => apiService.get('/statistics/top_purchase/', params) },
      { label: 'détail prospects', call: () => apiService.get('/statistics/purchase_stat/', params) },
      { label: 'courbe des ventes', call: () => apiService.getSalesChart(params) },
    ];
    try {
      const results = await Promise.allSettled(endpoints.map((e) => e.call()));
      const failedNow: string[] = [];
      const parsed = await Promise.all(results.map(async (r, i) => {
        if (r.status !== 'fulfilled' || !r.value.ok) { failedNow.push(endpoints[i].label); return null; }
        try { return await r.value.json(); } catch { failedNow.push(endpoints[i].label); return null; }
      }));
      if (id !== reqId.current) return; // une requête plus récente a pris le relais
      const [summary, pos, vendors, products, top, purchases, sales] = parsed;
      setStats({
        summary: summary || null,
        posStats: toArr(pos), vendorStats: toArr(vendors), productStats: toArr(products),
        topPurchaseVendors: toArr(top), purchaseDetails: toArr(purchases), salesChart: formatChart(sales),
      });
      setFailed(failedNow);
    } catch (e: any) {
      if (id === reqId.current) setError(e?.message || 'Impossible de charger les statistiques.');
    } finally {
      if (id === reqId.current) { setLoading(false); setRefreshing(false); }
    }
  }, [params, timeRange]);

  useEffect(() => { loadStats(); }, [loadStats]);

  // Graphique de performance : contrôlé, rechargé avec les filtres
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await apiService.getPerformanceChart(perfScope, params);
        const data = res.ok ? await res.json() : null;
        if (alive) setPerfChart(formatChart(data));
      } catch { if (alive) setPerfChart(null); }
    })();
    return () => { alive = false; };
  }, [perfScope, params]);

  const handleExport = async (type: string) => {
    setExporting(type); setError(null);
    try {
      const res = await apiService.exportData({ format: 'excel', report_type: type, filters: params });
      if (!res.ok) throw new Error();
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url; a.download = `${type}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { setError("L'export a échoué. Réessayez dans un instant."); }
    finally { setExporting(null); }
  };

  /* Options de filtres, dérivées des données chargées */
  const options = useMemo(() => ({
    regions: uniq(stats.posStats.map((p) => p.region)),
    communes: uniq([...stats.posStats.map((p) => p.commune), ...stats.vendorStats.map((v) => v.commune)]),
    quartiers: uniq([...stats.posStats.map((p) => p.quartier), ...stats.vendorStats.map((v) => v.quartier)]),
    zones: uniq([...stats.vendorStats.map((v) => v.zone), ...stats.purchaseDetails.map((p) => p.purchase_zone)]),
  }), [stats.posStats, stats.vendorStats, stats.purchaseDetails]);
  const optionsRef = useRef(options);
  if (options.regions.length || options.communes.length) optionsRef.current = options; // évite de vider les listes quand un filtre réduit les résultats

  /* Pastilles de filtres actifs */
  const chips = useMemo(() => {
    const out: { key: string; label: string; clear: () => void }[] = [];
    const drop = (patch: Partial<FilterState>) => { setApplied((f) => ({ ...f, ...patch })); setDraft((f) => ({ ...f, ...patch })); };
    (['region', 'commune', 'quartier', 'zone'] as const).forEach((k) => {
      (applied[k] || []).forEach((v) => out.push({
        key: `${k}-${v}`, label: `${k === 'region' ? 'Région' : k === 'commune' ? 'Commune' : k === 'quartier' ? 'Quartier' : 'Zone'} : ${v}`,
        clear: () => { const rest = (applied[k] || []).filter((x) => x !== v); drop({ [k]: rest.length ? rest : undefined }); },
      }));
    });
    if (applied.status) out.push({ key: 'status', label: `Statut : ${applied.status}`, clear: () => drop({ status: undefined }) });
    if (applied.vehicle_type) out.push({ key: 'veh', label: `Véhicule : ${applied.vehicle_type}`, clear: () => drop({ vehicle_type: undefined }) });
    if (applied.start_date || applied.end_date) out.push({ key: 'dates', label: `Du ${fmtDate(applied.start_date)} au ${fmtDate(applied.end_date)}`, clear: () => drop({ start_date: undefined, end_date: undefined }) });
    return out;
  }, [applied]);

  /* Indicateurs dérivés des données chargées */
  const s = stats.summary;
  const avgBasket = s && s.total_orders ? s.total_sales / s.total_orders : 0;

  const salesByCommune = useMemo<ChartData | null>(() => {
    const m = new Map<string, number>();
    stats.posStats.forEach((p) => m.set(p.commune || 'Non renseignée', (m.get(p.commune || 'Non renseignée') || 0) + (p.total_sales || 0)));
    const rows = [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    return rows.length ? { labels: rows.map((r) => r[0]), datasets: [{ label: 'Ventes', data: rows.map((r) => r[1]) }] } : null;
  }, [stats.posStats]);

  const vendorPerfSplit = useMemo<ChartData | null>(() => {
    const v = stats.vendorStats;
    if (!v.length) return null;
    const hi = v.filter((x) => x.performance >= 80).length, mid = v.filter((x) => x.performance >= 60 && x.performance < 80).length;
    return { labels: ['≥ 80 %', '60 – 79 %', '< 60 %'], datasets: [{ label: 'Commerciaux', data: [hi, mid, v.length - hi - mid] }] };
  }, [stats.vendorStats]);

  const attention = useMemo(() => {
    const lowVendors = stats.vendorStats.filter((v) => v.status === 'actif' && v.performance < 40);
    const slowProducts = stats.productStats.filter((p) => p.total_quantity_sold > 0 && p.stock_rotation < 1);
    const outOfStock = stats.productStats.filter((p) => p.status === 'rupture');
    const lowPOS = stats.posStats.filter((p) => p.performance_score < 50);
    return [
      { id: 'v', n: lowVendors.length, text: 'commerciaux actifs sous 40 % de performance', tab: 'vendors' as TabId, color: C.red },
      { id: 'r', n: outOfStock.length, text: 'produits en rupture', tab: 'products' as TabId, color: C.red },
      { id: 's', n: slowProducts.length, text: 'produits à rotation lente (< 1×)', tab: 'products' as TabId, color: C.amber },
      { id: 'p', n: lowPOS.length, text: 'points de vente sous 50 % de performance', tab: 'points-of-sale' as TabId, color: C.amber },
    ].filter((a) => a.n > 0);
  }, [stats.vendorStats, stats.productStats, stats.posStats]);

  const topVendors = useMemo(() => [...stats.vendorStats].sort((a, b) => b.total_sales - a.total_sales).slice(0, 5), [stats.vendorStats]);
  const topProducts = useMemo(() => [...stats.productStats].sort((a, b) => b.total_revenue - a.total_revenue).slice(0, 5), [stats.productStats]);
  const topPurchaseRows = useMemo(() => stats.topPurchaseVendors.map((v) => ({ ...v, id: v.vendor_id })), [stats.topPurchaseVendors]);
  const purchaseRows = useMemo(() => stats.purchaseDetails.map((p) => ({ ...p, id: p.purchase_id })), [stats.purchaseDetails]);

  const tabs: { id: TabId; label: string; icon: React.ComponentType<any> }[] = [
    { id: 'overview', label: "Vue d'ensemble", icon: BarChart3 },
    { id: 'points-of-sale', label: 'Points de vente', icon: MapPin },
    { id: 'vendors', label: 'Commerciaux', icon: Users },
    { id: 'products', label: 'Produits', icon: Package },
    { id: 'pushcart', label: 'Prospects', icon: ShoppingBag },
    { id: 'analytics', label: 'Rapports', icon: TrendingUp },
  ];

  const periodLabel = applied.start_date || applied.end_date
    ? `Du ${fmtDate(applied.start_date)} au ${fmtDate(applied.end_date)}`
    : s?.start_date && s?.end_date ? `Du ${fmtDate(s.start_date)} au ${fmtDate(s.end_date)}` : `${timeRange} derniers jours`;

  /* ─── Onglets (fonctions de rendu, pas des composants : l'état des tableaux est conservé) ─── */
  const renderOverview = () => (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
        <Kpi label="Ventes totales" value={fmtCFA(s?.total_sales || 0)} growth={s?.sales_growth} icon={DollarSign} color={C.blueD} />
        <Kpi label="Commandes" value={fmtNum(s?.total_orders || 0)} sub="Sur la période" icon={ShoppingCart} color={C.violet} />
        <Kpi label="Panier moyen" value={fmtCFA(avgBasket)} sub="Ventes ÷ commandes" icon={Wallet} color={C.green} />
        <Kpi label="Commerciaux actifs" value={fmtNum(s?.total_mobile_vendors || 0)} sub="Sur le terrain" icon={Users} color={C.amber} />
        <Kpi label="Points de vente" value={fmtNum(s?.total_points_of_sale || 0)} sub="Dans le périmètre" icon={MapPin} color={C.navy} />
      </div>

      {attention.length > 0 && (
        <Panel title="Points d'attention" icon={AlertTriangle}>
          <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            {attention.map((a) => (
              <button key={a.id} onClick={() => setActiveTab(a.tab)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, background: C.pale, border: `1px solid ${C.lineL}`, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: a.color, minWidth: 32 }}>{a.n}</span>
                <span style={{ flex: 1, fontSize: 12, color: C.sub }}>{a.text}</span>
                <ChevronRight size={14} style={{ color: C.muted }} />
              </button>
            ))}
          </div>
        </Panel>
      )}

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 440px), 1fr))' }}>
        <Panel title="Évolution des ventes" icon={BarChart3} right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'inline-flex', gap: 2, padding: 3, borderRadius: 10, background: C.pale, border: `0.5px solid ${C.line}` }}>
              {(['bar', 'line'] as const).map((t) => (
                <button key={t} onClick={() => setSalesView(t)} aria-pressed={salesView === t}
                  style={{ padding: '3px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'inherit', background: salesView === t ? C.blue : 'transparent', color: salesView === t ? '#fff' : C.greyTx }}>
                  {t === 'bar' ? 'Barres' : 'Courbe'}
                </button>
              ))}
            </div>
            <LinkBtn onClick={() => handleExport('sales')} busy={exporting === 'sales'}>Excel</LinkBtn>
          </div>}>
          <ChartBlock data={stats.salesChart} type={salesView} />
        </Panel>

        <Panel title="Performance comparative" icon={Users} right={
          <select aria-label="Périmètre de comparaison" value={perfScope} onChange={(e) => setPerfScope(e.target.value as any)} style={{ ...inputStyle, height: 30, width: 'auto', fontSize: 12 }}>
            <option value="vendors">Commerciaux</option><option value="products">Produits</option><option value="pos">Points de vente</option>
          </select>}>
          <ChartBlock data={perfChart} money={false} />
        </Panel>

        <Panel title="Ventes par commune" icon={MapPin} right={<LinkBtn onClick={() => handleExport('pos')} busy={exporting === 'pos'}>Excel</LinkBtn>}>
          <ChartBlock data={salesByCommune} />
        </Panel>

        <Panel title="Répartition des commerciaux par performance" icon={Users}>
          <ChartBlock data={vendorPerfSplit} type="pie" money={false} height={240} />
        </Panel>

        <Panel title="Top 5 commerciaux" icon={Users} right={<LinkBtn onClick={() => setActiveTab('vendors')} >Voir tout</LinkBtn>}>
          {topVendors.length === 0 ? <Empty icon={Users} title="Aucun commercial" /> : topVendors.map((v, i) => (
            <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < topVendors.length - 1 ? `1px solid ${C.surface}` : 'none' }}>
              <span style={{ width: 24, height: 24, borderRadius: 7, background: i === 0 ? C.amberBg : C.pale, color: i === 0 ? C.amberTx : C.blueD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.full_name}</p>
                <p style={{ fontSize: 11, color: C.muted }}>{v.commune || v.zone || v.phone}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{fmtCFA(v.total_sales)}</p>
                <PerfBadge score={v.performance} />
              </div>
            </div>
          ))}
        </Panel>

        <Panel title="Top 5 produits" icon={Package} right={<LinkBtn onClick={() => setActiveTab('products')}>Voir tout</LinkBtn>}>
          {topProducts.length === 0 ? <Empty icon={Package} title="Aucun produit" /> : topProducts.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < topProducts.length - 1 ? `1px solid ${C.surface}` : 'none' }}>
              <span style={{ width: 24, height: 24, borderRadius: 7, background: i === 0 ? C.amberBg : C.pale, color: i === 0 ? C.amberTx : C.blueD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                <p style={{ fontSize: 11, color: C.muted }}>{p.sku}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{fmtCFA(p.total_revenue)}</p>
                <p style={{ fontSize: 11, color: C.muted }}>{fmtNum(p.total_quantity_sold)} unités</p>
              </div>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );

  const renderPOS = () => (
    <Panel title="Points de vente" icon={MapPin} right={<LinkBtn onClick={() => handleExport('pos')} busy={exporting === 'pos'}>Excel</LinkBtn>}>
      <DataTable<POSStat> data={stats.posStats} emptyIcon={MapPin} emptyMsg="Aucun point de vente" exportName="points_de_vente"
        searchKeys={['name', 'region', 'commune', 'quartier']}
        columns={[
          { key: 'name', label: 'Point de vente', sort: (r) => r.name, render: (r) => <span style={{ fontWeight: 600 }}>{r.name}</span> },
          { key: 'type', label: 'Type', sort: (r) => r.type || '', render: (r) => <Pill bg={C.pale} tx={C.blueD}>{r.type || '—'}</Pill> },
          { key: 'region', label: 'Région', sort: (r) => r.region || '', render: (r) => <span style={{ fontSize: 12, color: C.muted }}>{r.region || '—'}</span> },
          { key: 'commune', label: 'Commune', sort: (r) => r.commune || '', render: (r) => <span style={{ fontSize: 12, color: C.muted }}>{r.commune || '—'}</span> },
          { key: 'sales', label: 'Ventes', align: 'right', sort: (r) => r.total_sales, csv: (r) => r.total_sales, render: (r) => <strong>{fmtCFA(r.total_sales)}</strong> },
          { key: 'orders', label: 'Commandes', align: 'right', sort: (r) => r.total_orders, render: (r) => fmtNum(r.total_orders) },
          { key: 'aov', label: 'Panier moyen', align: 'right', sort: (r) => r.average_order_value || 0, render: (r) => <span style={{ fontSize: 12, color: C.muted }}>{fmtCFA(r.average_order_value)}</span> },
          { key: 'perf', label: 'Performance', align: 'right', sort: (r) => r.performance_score, render: (r) => (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}><PerfBadge score={r.performance_score} /><MiniBar value={r.performance_score} /></div>) },
        ]} />
    </Panel>
  );

  const renderVendors = () => (
    <Panel title="Commerciaux ambulants" icon={Users} right={<LinkBtn onClick={() => handleExport('vendors')} busy={exporting === 'vendors'}>Excel</LinkBtn>}>
      <DataTable<VendorStat> data={stats.vendorStats} emptyIcon={Users} emptyMsg="Aucun commercial" exportName="commerciaux"
        searchKeys={['full_name', 'phone', 'commune', 'zone']}
        columns={[
          { key: 'name', label: 'Nom', sort: (r) => r.full_name, csv: (r) => `${r.full_name} (${r.phone})`, render: (r) => (<div><p style={{ fontWeight: 600 }}>{r.full_name}</p><p style={{ fontSize: 11, color: C.muted }}>{r.phone}</p></div>) },
          { key: 'status', label: 'Statut', sort: (r) => r.status, render: (r) => <StatusBadge status={r.status} /> },
          { key: 'vehicle', label: 'Véhicule', sort: (r) => r.vehicle_type || '', render: (r) => <span style={{ fontSize: 12, color: C.muted, textTransform: 'capitalize' }}>{r.vehicle_type || '—'}</span> },
          { key: 'commune', label: 'Commune', sort: (r) => r.commune || '', render: (r) => <span style={{ fontSize: 12, color: C.muted }}>{r.commune || '—'}</span> },
          { key: 'zone', label: 'Zone', sort: (r) => r.zone || '', render: (r) => <span style={{ fontSize: 12, color: C.muted }}>{r.zone || '—'}</span> },
          { key: 'sales', label: 'Ventes', align: 'right', sort: (r) => r.total_sales, render: (r) => <strong>{fmtCFA(r.total_sales)}</strong> },
          { key: 'perf', label: 'Performance', align: 'right', sort: (r) => r.performance, render: (r) => <PerfBadge score={r.performance} /> },
          { key: 'days', label: 'Jours actifs', align: 'right', sort: (r) => r.active_days || 0, render: (r) => <span style={{ fontSize: 12, color: C.muted }}>{r.active_days ?? 0} j</span> },
        ]} />
    </Panel>
  );

  const renderProducts = () => (
    <Panel title="Produits" icon={Package} right={<LinkBtn onClick={() => handleExport('products')} busy={exporting === 'products'}>Excel</LinkBtn>}>
      <DataTable<ProductStat> data={stats.productStats} emptyIcon={Package} emptyMsg="Aucun produit" exportName="produits"
        searchKeys={['name', 'sku', 'category']}
        columns={[
          { key: 'name', label: 'Produit', sort: (r) => r.name, csv: (r) => `${r.name} (${r.sku})`, render: (r) => (<div><p style={{ fontWeight: 600 }}>{r.name}</p><p style={{ fontSize: 11, color: C.muted }}>{r.sku}</p></div>) },
          { key: 'cat', label: 'Catégorie', sort: (r) => r.category || '', render: (r) => <Pill bg={C.pale} tx={C.blueD}>{r.category || '—'}</Pill> },
          { key: 'status', label: 'Stock', sort: (r) => r.status, render: (r) => <StatusBadge status={r.status} /> },
          { key: 'qty', label: 'Qté vendue', align: 'right', sort: (r) => r.total_quantity_sold, render: (r) => fmtNum(r.total_quantity_sold) },
          { key: 'rev', label: 'Revenu', align: 'right', sort: (r) => r.total_revenue, render: (r) => <strong>{fmtCFA(r.total_revenue)}</strong> },
          { key: 'price', label: 'Prix moyen', align: 'right', sort: (r) => r.average_price || 0, render: (r) => <span style={{ fontSize: 12, color: C.muted }}>{fmtCFA(r.average_price)}</span> },
          { key: 'rot', label: 'Rotation', align: 'right', sort: (r) => r.stock_rotation || 0, render: (r) => {
            const v = r.stock_rotation || 0;
            const [bg, tx] = v >= 2 ? [C.greenBg, C.greenTx] : v >= 1 ? [C.amberBg, C.amberTx] : [C.redBg, C.redTx];
            return <Pill bg={bg} tx={tx}>{v.toFixed(1)} ×</Pill>;
          } },
        ]} />
    </Panel>
  );

  const renderPushcart = () => (
    <div style={{ display: 'grid', gap: 16 }}>
      <Panel title="Commerciaux : performance par achats" icon={ShoppingBag} right={<LinkBtn onClick={() => handleExport('pushcart')} busy={exporting === 'pushcart'}>Excel</LinkBtn>}>
        <DataTable data={topPurchaseRows} emptyIcon={ShoppingBag} emptyMsg="Aucune donnée d'achat" exportName="performance_achats"
          searchKeys={['vendor_full_name', 'vendor_phone', 'point_of_sale']}
          columns={[
            { key: 'name', label: 'Commercial', sort: (r) => r.vendor_full_name, csv: (r) => `${r.vendor_full_name} (${r.vendor_phone})`, render: (r) => (<div><p style={{ fontWeight: 600 }}>{r.vendor_full_name}</p><p style={{ fontSize: 11, color: C.muted }}>{r.vendor_phone}</p></div>) },
            { key: 'status', label: 'Statut', sort: (r) => r.vendor_status, render: (r) => <StatusBadge status={r.vendor_status} /> },
            { key: 'pos', label: 'Point de vente', sort: (r) => r.point_of_sale || '', render: (r) => <span style={{ fontSize: 12, color: C.muted }}>{r.point_of_sale}</span> },
            { key: 'count', label: 'Nb achats', align: 'right', sort: (r) => r.total_purchase_count, render: (r) => fmtNum(r.total_purchase_count) },
            { key: 'amount', label: 'Montant', align: 'right', sort: (r) => r.total_purchase_amount, render: (r) => <strong>{fmtCFA(r.total_purchase_amount)}</strong> },
            { key: 'sales', label: 'Ventes générées', align: 'right', sort: (r) => r.total_sales_from_purchases, render: (r) => <strong>{fmtCFA(r.total_sales_from_purchases)}</strong> },
            { key: 'eff', label: 'Efficacité', align: 'right', sort: (r) => r.purchase_to_sales_efficiency, render: (r) => <PerfBadge score={r.purchase_to_sales_efficiency} /> },
          ]} />
      </Panel>
      <Panel title="Détail des achats" icon={ShoppingCart} right={<LinkBtn onClick={() => handleExport('purchase-details')} busy={exporting === 'purchase-details'}>Excel</LinkBtn>}>
        <DataTable data={purchaseRows} emptyIcon={ShoppingCart} emptyMsg="Aucun achat" exportName="detail_achats" initialPerPage={20}
          searchKeys={['purchase_full_name', 'purchase_zone', 'purchase_base', 'purchase_phone']}
          columns={[
            { key: 'buyer', label: 'Acheteur', sort: (r) => r.purchase_full_name, csv: (r) => `${r.purchase_full_name} (${r.purchase_phone})`, render: (r) => (<div><p style={{ fontWeight: 600 }}>{r.purchase_full_name}</p><p style={{ fontSize: 11, color: C.muted }}>{r.purchase_phone}</p></div>) },
            { key: 'date', label: 'Date', sort: (r) => r.purchase_date || '', render: (r) => <span style={{ fontSize: 12, color: C.muted }}>{fmtDate(r.purchase_date)}</span> },
            { key: 'zone', label: 'Zone', sort: (r) => r.purchase_zone || '', render: (r) => <span style={{ fontSize: 12, color: C.muted }}>{r.purchase_zone || '—'}</span> },
            { key: 'type', label: 'Type', sort: (r) => r.purchase_pushcard_type || '', render: (r) => <Pill bg={C.pale} tx={C.blueD}>{r.purchase_pushcard_type || '—'}</Pill> },
            { key: 'amount', label: 'Montant achat', align: 'right', sort: (r) => r.purchase_amount, render: (r) => <strong>{fmtCFA(r.purchase_amount)}</strong> },
            { key: 'sales', label: 'Ventes générées', align: 'right', sort: (r) => r.total_sales_amount, render: (r) => <strong>{fmtCFA(r.total_sales_amount)}</strong> },
            { key: 'eff', label: 'Efficacité', align: 'right', sort: (r) => r.sales_efficiency, render: (r) => <PerfBadge score={r.sales_efficiency} /> },
            { key: 'vendor', label: 'Vendeur principal', sort: (r) => r.main_mobile_vendor?.full_name || '', render: (r) => r.main_mobile_vendor
              ? <div><p style={{ fontWeight: 600, fontSize: 12 }}>{r.main_mobile_vendor.full_name}</p><p style={{ fontSize: 11, color: C.muted }}>{r.main_mobile_vendor.phone}</p></div>
              : <Pill bg={C.amberBg} tx={C.amberTx}>Non assigné</Pill> },
          ]} />
      </Panel>
    </div>
  );

  const reports = [
    { type: 'sales', icon: BarChart3, label: 'Ventes', desc: 'Toutes les ventes de la période' },
    { type: 'vendors', icon: Users, label: 'Commerciaux', desc: 'Performance et activité terrain' },
    { type: 'products', icon: Package, label: 'Produits', desc: 'Revenus, rotation et stock' },
    { type: 'pos', icon: MapPin, label: 'Points de vente', desc: 'Résultats par commune et région' },
    { type: 'inventory', icon: Package, label: 'Inventaire', desc: 'État des stocks' },
    { type: 'performance', icon: TrendingUp, label: 'Performance', desc: 'Indicateurs globaux' },
  ];

  const renderReports = () => (
    <div style={{ display: 'grid', gap: 16 }}>
      <Panel title="Exporter un rapport Excel" icon={Download}>
        <p style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>
          Chaque rapport respecte la période et les filtres actifs : <strong style={{ color: C.sub }}>{periodLabel}</strong>
          {chips.length > 0 && <> · {chips.length} filtre{chips.length > 1 ? 's' : ''}</>}.
        </p>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
          {reports.map(({ type, icon: Icon, label, desc }) => (
            <button key={type} onClick={() => handleExport(type)} disabled={exporting !== null}
              style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 14, borderRadius: 12, background: C.pale, border: `1px solid ${C.lineL}`, cursor: exporting ? 'wait' : 'pointer', textAlign: 'left', fontFamily: 'inherit', opacity: exporting && exporting !== type ? 0.6 : 1 }}>
              <span style={{ width: 36, height: 36, borderRadius: 10, background: '#D6EAF6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {exporting === type ? <Loader2 size={16} className="st-spin" style={{ color: C.blueD }} /> : <Icon size={16} style={{ color: C.blueD }} />}
              </span>
              <span><span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.text }}>{label}</span><span style={{ fontSize: 11, color: C.muted }}>{desc}</span></span>
            </button>
          ))}
        </div>
      </Panel>
    </div>
  );

  /* ─── Rendu ─── */
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <style>{GLOBAL_CSS}</style>

      {/* Bandeau */}
      <div style={{ background: C.navy, borderRadius: 16, padding: 20, display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <BarChart3 size={16} style={{ color: C.blueL }} />
            <span style={{ color: 'rgba(200,230,248,.9)', fontSize: 12, fontWeight: 600 }}>LanfiaLink Analytiques</span>
          </div>
          <p style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>Ventes, terrain et stocks sur une même vue</p>
          <p style={{ color: 'rgba(200,230,248,.85)', fontSize: 12, marginTop: 6 }}>{periodLabel}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select aria-label="Période" value={timeRange} onChange={(e) => setTimeRange(e.target.value)} disabled={!!(applied.start_date || applied.end_date)}
            style={{ ...inputStyle, width: 'auto', height: 34, opacity: applied.start_date || applied.end_date ? 0.5 : 1 }}>
            <option value="7">7 derniers jours</option><option value="30">30 derniers jours</option>
            <option value="90">3 derniers mois</option><option value="365">1 an</option>
          </select>
          <button onClick={() => setShowFilters((f) => !f)} aria-expanded={showFilters}
            style={{ ...btn(showFilters || chips.length ? C.blue : 'rgba(79,179,232,.18)', '#fff'), height: 34 }}>
            <SlidersHorizontal size={13} /> Filtres
            {chips.length > 0 && <span style={{ background: '#fff', color: C.blueD, borderRadius: 99, fontSize: 10, padding: '0 6px', fontWeight: 700 }}>{chips.length}</span>}
          </button>
          <button onClick={() => loadStats(true)} disabled={refreshing} style={{ ...btn('rgba(79,179,232,.18)'), height: 34, opacity: refreshing ? 0.7 : 1 }}>
            <RefreshCw size={13} className={refreshing ? 'st-spin' : undefined} /> {refreshing ? 'Actualisation…' : 'Actualiser'}
          </button>
        </div>
      </div>

      {/* Erreurs */}
      {error && (
        <div role="alert" style={{ display: 'flex', gap: 10, alignItems: 'center', padding: 12, borderRadius: 12, background: C.redBg, color: C.redTx, fontSize: 12 }}>
          <AlertTriangle size={14} /><span style={{ flex: 1 }}>{error}</span>
          <button onClick={() => setError(null)} aria-label="Fermer" style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.redTx }}><X size={14} /></button>
        </div>
      )}
      {failed.length > 0 && !loading && (
        <div role="status" style={{ display: 'flex', gap: 10, alignItems: 'center', padding: 12, borderRadius: 12, background: C.amberBg, color: C.amberTx, fontSize: 12 }}>
          <AlertTriangle size={14} />
          <span style={{ flex: 1 }}>Certaines données n'ont pas pu être chargées ({failed.join(', ')}). Les autres blocs restent à jour.</span>
          <button onClick={() => loadStats(true)} style={{ ...btnGhost, padding: '4px 10px', color: C.amberTx }}>Réessayer</button>
        </div>
      )}

      {/* Filtres */}
      {showFilters && (
        <div style={{ ...card, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: C.text }}><SlidersHorizontal size={14} style={{ color: C.blue }} />Filtres avancés</span>
            <button onClick={() => setShowFilters(false)} aria-label="Fermer les filtres" style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}><X size={16} /></button>
          </div>
          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
            <label><FieldLabel>Date de début</FieldLabel><input type="date" style={inputStyle} value={draft.start_date || ''} max={draft.end_date} onChange={(e) => setDraft((d) => ({ ...d, start_date: e.target.value || undefined }))} /></label>
            <label><FieldLabel>Date de fin</FieldLabel><input type="date" style={inputStyle} value={draft.end_date || ''} min={draft.start_date} onChange={(e) => setDraft((d) => ({ ...d, end_date: e.target.value || undefined }))} /></label>
            <label><FieldLabel>Regrouper les ventes</FieldLabel>
              <select style={inputStyle} value={draft.group_by || 'day'} onChange={(e) => setDraft((d) => ({ ...d, group_by: e.target.value }))}>
                <option value="day">Par jour</option><option value="week">Par semaine</option><option value="month">Par mois</option>
              </select></label>
            <label><FieldLabel>Statut du commercial</FieldLabel>
              <select style={inputStyle} value={draft.status || ''} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value || undefined }))}>
                <option value="">Tous</option><option value="actif">Actif</option><option value="inactif">Inactif</option><option value="suspendu">Suspendu</option>
              </select></label>
            <label><FieldLabel>Véhicule</FieldLabel>
              <select style={inputStyle} value={draft.vehicle_type || ''} onChange={(e) => setDraft((d) => ({ ...d, vehicle_type: e.target.value || undefined }))}>
                <option value="">Tous</option><option value="moto">Moto</option><option value="velo">Vélo</option><option value="tricycle">Tricycle</option><option value="pieton">Piéton</option>
              </select></label>
            {([['region', 'Région', optionsRef.current.regions], ['commune', 'Commune', optionsRef.current.communes], ['quartier', 'Quartier', optionsRef.current.quartiers], ['zone', 'Zone', optionsRef.current.zones]] as const).map(([k, label, opts]) => (
              <div key={k}><FieldLabel>{label}</FieldLabel>
                <MultiSelect label={label} options={opts} selected={(draft[k] as string[]) || []} onChange={(v) => setDraft((d) => ({ ...d, [k]: v }))} /></div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <button style={btnGhost} onClick={() => { setDraft(EMPTY_FILTERS); setApplied(EMPTY_FILTERS); }}>Réinitialiser</button>
            <button style={btn(C.blue)} onClick={() => { setApplied(draft); setShowFilters(false); }}>Appliquer les filtres</button>
          </div>
        </div>
      )}

      {/* Pastilles de filtres actifs */}
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

      {/* Onglets */}
      <div style={{ display: 'inline-flex', gap: 2, padding: 4, borderRadius: 12, background: C.pale, border: `0.5px solid ${C.line}`, overflowX: 'auto', maxWidth: '100%', justifySelf: 'start' }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} aria-pressed={activeTab === t.id}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', whiteSpace: 'nowrap', background: activeTab === t.id ? C.blue : 'transparent', color: activeTab === t.id ? '#fff' : C.greyTx }}>
            <t.icon size={12} />{t.label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      {loading ? (
        <div style={{ ...card, padding: 48, textAlign: 'center' }}>
          <Loader2 className="st-spin" size={24} style={{ color: C.blue, margin: '0 auto 10px' }} />
          <p style={{ fontSize: 13, color: C.muted }}>Chargement des statistiques…</p>
        </div>
      ) : (
        <div style={{ opacity: refreshing ? 0.6 : 1, transition: 'opacity .2s' }}>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'points-of-sale' && renderPOS()}
          {activeTab === 'vendors' && renderVendors()}
          {activeTab === 'products' && renderProducts()}
          {activeTab === 'pushcart' && renderPushcart()}
          {activeTab === 'analytics' && renderReports()}
        </div>
      )}
    </div>
  );
}