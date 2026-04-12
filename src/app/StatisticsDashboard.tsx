'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, TrendingUp, Users, MapPin, Package, ShoppingCart,
  DollarSign, Download, Filter, ArrowUp, ArrowDown, AlertCircle,
  RefreshCw, BarChart, ShoppingBag, ChevronLeft, ChevronRight,
  X, Search, SlidersHorizontal, ChevronDown, ChevronUp, Building2
} from 'lucide-react';
import { apiService } from './ApiService';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend,
  ChartData as ChartJSData,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend
);

// ─── Palette LanfiaLink ────────────────────────────────────────────────────────
const P = {
  forest:       '#2D5A3D',
  forestLight:  '#3E7A54',
  forestPale:   '#EAF2EC',
  ocre:         '#C07A2F',
  ocreLight:    '#D4A843',
  gold:         '#F0C878',
  cream:        '#FAF7F0',
  sand:         '#F2EDE0',
  sandBorder:   '#E8D9B8',
  sandDark:     '#D4C4A0',
  textDark:     '#2A1A08',
  textMid:      '#7A6A52',
  textMuted:    '#A89880',
  textLighter:  '#C8B898',
  teal:         '#2D8C72',
  tealPale:     '#E0F5EF',
  red:          '#C05030',
  redPale:      '#FDECEA',
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface POSStat {
  id: number; name: string; type: string; region: string;
  commune: string; quartier?: string; total_sales: number;
  total_orders: number; average_order_value: number;
  mobile_vendors_count: number; performance_score: number;
  turnover: number; sales_growth?: number;
}
interface VendorStat {
  id: number; full_name: string; phone: string; status: string;
  vehicle_type: string; zone?: string; commune?: string; quartier?: string;
  total_sales: number; total_purchases: number; average_purchase_value: number;
  active_days: number; efficiency_rate: number; performance: number;
  sales_growth?: number;
}
interface ProductStat {
  id: number; name: string; sku: string; category: string; status: string;
  total_quantity_sold: number; total_revenue: number;
  average_price: number; stock_rotation: number; revenue_growth?: number;
}
interface TopPurchaseVendor {
  vendor_id: number; vendor_full_name: string; vendor_phone: string;
  vendor_status: string; point_of_sale: string;
  total_purchase_amount: number; total_purchase_count: number;
  average_purchase_value: number; total_sales_from_purchases: number;
  total_sales_count: number; purchase_to_sales_efficiency: number;
  top_purchases: { id: number; full_name: string; zone: string; purchase_amount: number; sales_amount: number; efficiency: number; }[];
}
interface PurchaseDetail {
  purchase_id: number; purchase_full_name: string; purchase_zone: string;
  purchase_amount: number; purchase_date: string; purchase_base: string;
  purchase_pushcard_type: string; purchase_phone: string;
  total_sales_amount: number; total_sales_count: number; sales_efficiency: number;
  main_mobile_vendor: { id: number; full_name: string; phone: string; total_sales_to_purchase: number; sales_count_to_purchase: number; } | null;
  main_vendor_ratio: number; latitude: number; longitude: number;
}
interface DashboardSummary {
  total_sales: number; total_orders: number; total_mobile_vendors: number;
  total_points_of_sale: number; active_purchases: number;
  sales_growth: number; revenue_growth: number;
  period?: string; start_date?: string; end_date?: string;
}
interface ChartDataset {
  label: string; data: number[];
  borderColor?: string; backgroundColor?: string | string[]; yAxisID?: string;
}
interface ChartData { labels: string[]; datasets: ChartDataset[]; }
interface FilterState {
  start_date?: string; end_date?: string; period?: string;
  point_of_sale?: number[]; vendor?: number[]; category?: number[];
  region?: string[]; commune?: string[]; quartier?: string[];
  zone?: string[]; status?: string; vehicle_type?: string;
  group_by?: string; search?: string;
}
interface StatsState {
  summary: DashboardSummary | null;
  posStats: POSStat[]; vendorStats: VendorStat[];
  productStats: ProductStat[]; topPurchaseVendors: TopPurchaseVendor[];
  purchaseDetails: PurchaseDetail[];
  salesChart: ChartData | null; performanceChart: ChartData | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtCFA = (n: number) => new Intl.NumberFormat('fr-FR').format(n || 0) + ' FCFA';
const fmtNum = (n: number) => new Intl.NumberFormat('fr-FR').format(n || 0);
const perfColor = (s: number) => s >= 80 ? P.forest : s >= 60 ? P.ocre : P.red;

// ─── Kente top band ────────────────────────────────────────────────────────────
const KenteBar = ({ bottom = false }: { bottom?: boolean }) => (
  <div style={{
    height: bottom ? 2 : 3,
    background: bottom
      ? `linear-gradient(90deg,${P.forest} 0%,${P.ocre} 30%,${P.ocreLight} 60%,${P.forest} 100%)`
      : `linear-gradient(90deg,#9A5E1A 0%,#D4A843 25%,#9A5E1A 50%,#D4A843 75%,#9A5E1A 100%)`,
    opacity: bottom ? 0.55 : 1,
  }} />
);

// ─── Stat Card ────────────────────────────────────────────────────────────────
type ColorKey = 'green' | 'ocre' | 'gold' | 'teal';
const CARD_PALETTE: Record<ColorKey, { accent: string; iconBg: string; iconStroke: string }> = {
  green: { accent: `linear-gradient(90deg,${P.forest},${P.forestLight})`, iconBg: P.forestPale, iconStroke: P.forest },
  ocre:  { accent: `linear-gradient(90deg,${P.ocre},${P.ocreLight})`,     iconBg: '#FFF3E8',    iconStroke: P.ocre  },
  gold:  { accent: `linear-gradient(90deg,#9A5E1A,${P.gold})`,            iconBg: '#FBF4E0',    iconStroke: '#9A5E1A' },
  teal:  { accent: `linear-gradient(90deg,${P.teal},#3DAAA0)`,            iconBg: P.tealPale,   iconStroke: P.teal  },
};
const StatCard = ({
  title, value, growth, icon: Icon, color = 'green', subtitle,
}: {
  title: string; value: string; growth?: number;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  color?: ColorKey; subtitle?: string;
}) => {
  const p = CARD_PALETTE[color];
  return (
    <div style={{
      background: 'white', borderRadius: 14,
      border: `1px solid ${P.sandBorder}`, padding: 18,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, background: p.accent }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: P.textMuted, marginBottom: 6 }}>{title}</p>
          <p style={{ fontSize: 22, fontWeight: 500, color: P.textDark, lineHeight: 1.1 }}>{value}</p>
          {subtitle && <p style={{ fontSize: 11, color: P.textMuted, marginTop: 2 }}>{subtitle}</p>}
          {growth !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 8, fontSize: 11, fontWeight: 500, color: growth >= 0 ? P.forest : P.red }}>
              {growth >= 0 ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
              {Math.abs(growth).toFixed(1)}% vs période précédente
            </div>
          )}
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: p.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 12 }}>
          <Icon size={18} strokeWidth={1.6} color={p.iconStroke} />
        </div>
      </div>
    </div>
  );
};

// ─── Progress Bar ──────────────────────────────────────────────────────────────
const ProgressBar = ({ value, max }: { value: number; max: number }) => {
  const pct = Math.min((value / (max || 1)) * 100, 100);
  const bg = value >= 80 ? `linear-gradient(90deg,${P.forest},${P.forestLight})` : value >= 60 ? `linear-gradient(90deg,${P.ocre},${P.ocreLight})` : `linear-gradient(90deg,${P.red},#E07050)`;
  return (
    <div style={{ height: 4, background: P.sand, borderRadius: 2, overflow: 'hidden', marginTop: 4 }}>
      <div style={{ width: `${pct}%`, height: 4, borderRadius: 2, background: bg, transition: 'width 0.7s' }} />
    </div>
  );
};

// ─── Status Badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const cfg: Record<string, { bg: string; color: string }> = {
    actif:    { bg: P.forestPale, color: P.forest },
    inactif:  { bg: P.redPale,    color: P.red },
    suspendu: { bg: '#FFF3E8',    color: '#9A5E1A' },
  };
  const s = cfg[status] || { bg: '#F1EFE8', color: P.textMid };
  return (
    <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 20, fontSize: 10.5, fontWeight: 600, background: s.bg, color: s.color }}>
      {status}
    </span>
  );
};

// ─── Perf Badge ───────────────────────────────────────────────────────────────
const PerfBadge = ({ score }: { score: number }) => (
  <span style={{ fontSize: 11, fontWeight: 500, color: perfColor(score) }}>{score.toFixed(1)}%</span>
);

// ─── Ocre Accent ──────────────────────────────────────────────────────────────
const OcreAccent = () => (
  <div style={{ width: 32, height: 2, borderRadius: 2, background: P.ocre, marginBottom: 16 }} />
);

// ─── Card shell ───────────────────────────────────────────────────────────────
const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: 'white', borderRadius: 14, border: `1px solid ${P.sandBorder}`, padding: 20, ...style }}>
    {children}
  </div>
);

const CardHeader = ({ title, onExport }: { title: string; onExport?: () => void }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
    <span style={{ fontSize: 13.5, fontWeight: 500, color: P.textDark }}>{title}</span>
    {onExport && (
      <button onClick={onExport} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: P.ocre, background: 'none', border: 'none', cursor: 'pointer' }}>
        <Download size={12} /> Exporter
      </button>
    )}
  </div>
);

// ─── Filter Panel ─────────────────────────────────────────────────────────────
interface FilterPanelProps {
  filters: FilterState; onUpdate: (k: keyof FilterState, v: any) => void;
  onReset: () => void; onClose: () => void;
  availableRegions: string[]; availableCommunes: string[];
  availableQuartiers: string[]; availableZones: string[];
}
const FilterPanel = ({ filters, onUpdate, onReset, onClose, availableRegions, availableCommunes, availableQuartiers, availableZones }: FilterPanelProps) => {
  const toggleArr = (key: keyof FilterState, val: string) => {
    const cur = (filters[key] as string[] | undefined) || [];
    const upd = cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val];
    onUpdate(key, upd.length > 0 ? upd : undefined);
  };

  const MultiSelect = ({ label, options, selected, filterKey }: { label: string; options: string[]; selected: string[]; filterKey: keyof FilterState }) => {
    const [open, setOpen] = useState(false);
    if (!options.length) return null;
    return (
      <div style={{ position: 'relative' }}>
        <button type="button" onClick={() => setOpen(o => !o)} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '7px 10px', border: `1.5px solid ${P.sandBorder}`, borderRadius: 8,
          background: P.sand, color: P.textDark, fontSize: 12, cursor: 'pointer',
        }}>
          <span>{label}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {selected.length > 0 && (
              <span style={{ background: P.forestPale, color: P.forest, fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 20 }}>{selected.length}</span>
            )}
            {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </div>
        </button>
        {open && (
          <div style={{ position: 'absolute', zIndex: 20, top: '100%', marginTop: 4, width: '100%', background: 'white', border: `1px solid ${P.sandBorder}`, borderRadius: 10, boxShadow: '0 4px 16px rgba(42,26,8,.10)', maxHeight: 180, overflowY: 'auto' }}>
            {options.map(opt => (
              <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', cursor: 'pointer', fontSize: 12, color: P.textDark }}>
                <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggleArr(filterKey, opt)} style={{ accentColor: P.forest }} />
                {opt}
              </label>
            ))}
          </div>
        )}
      </div>
    );
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '7px 10px', border: `1.5px solid ${P.sandBorder}`,
    borderRadius: 8, background: P.sand, fontSize: 12, color: P.textDark, outline: 'none',
  };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: P.textMuted, marginBottom: 6 };

  return (
    <div style={{ background: 'white', borderRadius: 14, border: `1px solid ${P.sandBorder}`, marginBottom: 20, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: `1px solid ${P.sand}`, background: P.sand }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SlidersHorizontal size={16} color={P.forest} />
          <span style={{ fontSize: 13, fontWeight: 500, color: P.textDark }}>Filtres avancés</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={onReset} style={{ fontSize: 11, color: P.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}>Réinitialiser</button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={15} color={P.textMid} /></button>
        </div>
      </div>
      <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        {[
          { label: 'Date début', key: 'start_date' as const, type: 'date' },
          { label: 'Date fin',   key: 'end_date'   as const, type: 'date' },
        ].map(({ label, key, type }) => (
          <div key={key}>
            <label style={labelStyle}>{label}</label>
            <input type={type} value={filters[key] || ''} onChange={e => onUpdate(key, e.target.value || undefined)} style={inputStyle} />
          </div>
        ))}
        <div>
          <label style={labelStyle}>Groupement</label>
          <select value={filters.group_by || 'day'} onChange={e => onUpdate('group_by', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="day">Par jour</option>
            <option value="week">Par semaine</option>
            <option value="month">Par mois</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Statut commercial</label>
          <select value={filters.status || ''} onChange={e => onUpdate('status', e.target.value || undefined)} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="">Tous</option>
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
            <option value="suspendu">Suspendu</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Type de véhicule</label>
          <select value={filters.vehicle_type || ''} onChange={e => onUpdate('vehicle_type', e.target.value || undefined)} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="">Tous</option>
            <option value="moto">Moto</option>
            <option value="velo">Vélo</option>
            <option value="tricycle">Tricycle</option>
            <option value="pieton">Piéton</option>
          </select>
        </div>
        {[
          { label: 'Région(s)', key: 'region' as const, opts: availableRegions },
          { label: 'Commune(s)', key: 'commune' as const, opts: availableCommunes },
          { label: 'Quartier(s)', key: 'quartier' as const, opts: availableQuartiers },
          { label: 'Zone(s)', key: 'zone' as const, opts: availableZones },
        ].map(({ label, key, opts }) => (
          <div key={key}>
            <label style={labelStyle}>{label}</label>
            <MultiSelect label={`Sélectionner ${label.toLowerCase()}`} options={opts} selected={(filters[key] as string[]) || []} filterKey={key} />
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Chart Component ───────────────────────────────────────────────────────────
const ChartComponent = ({ chartData, title, type = 'bar', height = '280px' }: {
  chartData: ChartData | null; title: string; type?: 'bar' | 'line' | 'pie'; height?: string;
}) => {
  const options = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const, labels: { font: { size: 11 }, padding: 14 } },
      tooltip: { callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${fmtCFA(ctx.raw)}` } },
    },
    scales: type !== 'pie' ? {
      y: {
        beginAtZero: true,
        grid: { color: P.sand },
        ticks: { color: P.textMuted, callback: (v: any) => new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(v) },
      },
      x: { grid: { display: false }, ticks: { color: P.textMuted } },
    } : undefined,
  };

  if (!chartData?.labels?.length) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: P.sand, borderRadius: 10, border: `1px dashed ${P.sandBorder}`, height }}>
        <BarChart size={32} color={P.textLighter} />
        <p style={{ fontSize: 12, color: P.textMuted, marginTop: 8 }}>Aucune donnée pour « {title} »</p>
      </div>
    );
  }

  const toChartJS = () => ({
    labels: chartData.labels,
    datasets: chartData.datasets.map((ds, i) => ({
      label: ds.label, data: ds.data,
      backgroundColor: ds.backgroundColor || (
        type === 'pie'
          ? [P.forest, P.ocre, P.teal, '#9A5E1A', P.red, '#2D8C72']
          : i === 0 ? P.forest : P.ocre
      ),
      borderColor: ds.borderColor || (i === 0 ? P.forestLight : P.ocreLight),
      borderWidth: type === 'pie' ? 0 : 2,
      borderRadius: type === 'bar' ? 5 : 0,
    })),
  });

  return (
    <div style={{ height, position: 'relative' }}>
      {type === 'bar'  && <Bar  data={toChartJS() as ChartJSData<'bar',  number[], string>} options={options as any} />}
      {type === 'line' && <Line data={toChartJS() as ChartJSData<'line', number[], string>} options={options as any} />}
      {type === 'pie'  && <Pie  data={toChartJS() as ChartJSData<'pie',  number[], string>} options={{ ...options, scales: undefined } as any} />}
    </div>
  );
};

// ─── Data Table ───────────────────────────────────────────────────────────────
interface Column<T> {
  key: string; label: string; align?: 'left' | 'right' | 'center';
  render: (row: T) => React.ReactNode;
}
function DataTable<T extends { id?: number }>({
  data, columns, searchKeys, emptyIcon: EmptyIcon = Package, emptyMsg = 'Aucune donnée', initialPerPage = 10,
}: {
  data: T[]; columns: Column<T>[]; searchKeys?: (keyof T)[];
  emptyIcon?: React.ComponentType<{ size?: number; color?: string }>;
  emptyMsg?: string; initialPerPage?: number;
}) {
  const [search, setSearch] = useState('');
  const [page, setPage]   = useState(1);
  const [perPage, setPerPage] = useState(initialPerPage);

  const filtered = search && searchKeys
    ? data.filter(r => searchKeys.some(k => String(r[k] ?? '').toLowerCase().includes(search.toLowerCase())))
    : data;
  const totalPages = Math.ceil(filtered.length / perPage);
  const slice = filtered.slice((page - 1) * perPage, page * perPage);

  useEffect(() => setPage(1), [search, perPage, data]);

  const thStyle: React.CSSProperties = {
    padding: '8px 12px', fontSize: 10, fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.07em',
    color: P.textMid, background: P.sand, borderBottom: `1px solid ${P.sandBorder}`,
    whiteSpace: 'nowrap',
  };
  const tdStyle: React.CSSProperties = { padding: '9px 12px', borderBottom: `1px solid ${P.sand}`, color: P.textDark };
  const pageBtnBase: React.CSSProperties = {
    padding: '5px 10px', border: `1.5px solid ${P.sandBorder}`, borderRadius: 7,
    background: 'white', color: P.textMid, cursor: 'pointer', fontSize: 12,
  };

  if (!data.length) return (
    <div style={{ textAlign: 'center', padding: '48px 0', color: P.textMuted }}>
      <EmptyIcon size={36} color={P.textLighter} />
      <p style={{ fontSize: 12, marginTop: 8 }}>{emptyMsg}</p>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
        {searchKeys && (
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: P.textMuted }} />
            <input
              type="text" placeholder="Rechercher…" value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 30, paddingRight: 10, paddingTop: 7, paddingBottom: 7, border: `1.5px solid ${P.sandBorder}`, borderRadius: 8, background: P.sand, fontSize: 12, color: P.textDark, outline: 'none', width: 220 }}
            />
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
          <span style={{ fontSize: 11, color: P.textMuted }}>{fmtNum(filtered.length)} entrée{filtered.length > 1 ? 's' : ''}</span>
          <select value={perPage} onChange={e => setPerPage(Number(e.target.value))} style={{ border: `1px solid ${P.sandBorder}`, borderRadius: 7, fontSize: 11, padding: '4px 8px', background: 'white', color: P.textMid }}>
            {[10, 20, 50].map(n => <option key={n} value={n}>{n} / page</option>)}
          </select>
        </div>
      </div>
      <div style={{ overflowX: 'auto', borderRadius: 10, border: `1px solid ${P.sand}` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
          <thead>
            <tr>
              {columns.map(c => (
                <th key={c.key} style={{ ...thStyle, textAlign: c.align || 'left' }}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((row, i) => (
              <tr key={row.id ?? i} style={{ transition: 'background .1s' }}
                onMouseEnter={e => (e.currentTarget.style.background = P.cream)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                {columns.map(c => (
                  <td key={c.key} style={{ ...tdStyle, textAlign: c.align || 'left' }}>{c.render(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
          <span style={{ fontSize: 11, color: P.textMuted }}>Page {page} / {totalPages}</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => setPage(1)} disabled={page === 1} style={pageBtnBase}>«</button>
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1} style={pageBtnBase}><ChevronLeft size={13} /></button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
              const p = totalPages <= 5 ? idx + 1 : page <= 3 ? idx + 1 : page >= totalPages - 2 ? totalPages - 4 + idx : page - 2 + idx;
              return (
                <button key={p} onClick={() => setPage(p)}
                  style={{ ...pageBtnBase, ...(page === p ? { background: P.forestPale, color: P.forest, borderColor: P.forest, fontWeight: 600 } : {}) }}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} style={pageBtnBase}><ChevronRight size={13} /></button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages} style={pageBtnBase}>»</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function StatisticsDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('30');
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({ period: '30', group_by: 'day' });

  const [availableRegions,   setAvailableRegions]   = useState<string[]>([]);
  const [availableCommunes,  setAvailableCommunes]  = useState<string[]>([]);
  const [availableQuartiers, setAvailableQuartiers] = useState<string[]>([]);
  const [availableZones,     setAvailableZones]     = useState<string[]>([]);

  const [stats, setStats] = useState<StatsState>({
    summary: null, posStats: [], vendorStats: [], productStats: [],
    topPurchaseVendors: [], purchaseDetails: [],
    salesChart: null, performanceChart: null,
  });

  const formatChart = (raw: any): ChartData | null => {
    if (!raw?.labels?.length || !raw?.datasets?.length) return null;
    return { labels: raw.labels, datasets: raw.datasets.map((d: any) => ({ label: d.label || '', data: d.data || [], backgroundColor: d.backgroundColor, borderColor: d.borderColor, yAxisID: d.yAxisID })) };
  };

  const uniq = <T,>(arr: T[], fn: (i: T) => string | undefined) =>
    [...new Set(arr.map(fn).filter((v): v is string => !!v))].sort();

  const loadStats = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      const f = { ...filters, period: timeRange };
      const results = await Promise.allSettled([
        apiService.getDashboardSummary(f),
        apiService.getPOSStatistics(f),
        apiService.getMobileVendorStatistics(timeRange, f),
        apiService.getProductStatistics(timeRange, f),
        apiService.get('/statistics/top_purchase/', f),
        apiService.get('/statistics/purchase_stat/', f),
        apiService.getSalesChart(f),
        apiService.getPerformanceChart('vendors', f),
      ]);

      const parse = async (r: PromiseSettledResult<Response>) => {
        if (r.status !== 'fulfilled') return null;
        try { return await r.value.json(); } catch { return null; }
      };
      const [summary, pos, vendors, products, topPurchase, purchaseDetails, salesChart, perfChart] =
        await Promise.all(results.map(parse));

      const posArr     = Array.isArray(pos)            ? pos            : [];
      const vendArr    = Array.isArray(vendors)        ? vendors        : [];
      const prodArr    = Array.isArray(products)       ? products       : [];
      const topArr     = Array.isArray(topPurchase)    ? topPurchase    : [];
      const purchArr   = Array.isArray(purchaseDetails)? purchaseDetails: [];

      setAvailableRegions(uniq(posArr, (p: POSStat) => p.region));
      setAvailableCommunes(uniq([...posArr, ...vendArr], (p: any) => p.commune));
      setAvailableQuartiers(uniq([...posArr, ...vendArr], (p: any) => p.quartier));
      setAvailableZones(uniq([...vendArr, ...purchArr], (p: any) => p.zone || p.purchase_zone));

      setStats({
        summary: summary || { total_sales: 0, total_orders: 0, total_mobile_vendors: 0, total_points_of_sale: 0, active_purchases: 0, sales_growth: 0, revenue_growth: 0 },
        posStats: posArr, vendorStats: vendArr, productStats: prodArr,
        topPurchaseVendors: topArr, purchaseDetails: purchArr,
        salesChart: formatChart(salesChart), performanceChart: formatChart(perfChart),
      });
    } catch (e: any) {
      setError(e.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [filters, timeRange]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const handleExport = async (type: string) => {
    try {
      const res = await apiService.exportData({ format: 'excel', report_type: type, filters: { ...filters, period: timeRange } });
      if (!res.ok) return;
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `${type}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a); a.click();
      URL.revokeObjectURL(url); document.body.removeChild(a);
    } catch { setError("Erreur lors de l'export"); }
  };

  const updateFilter = (key: keyof FilterState, value: any) =>
    setFilters(prev => ({ ...prev, [key]: value }));
  const resetFilters = () => setFilters({ period: timeRange, group_by: 'day' });

  const activeFiltersCount = Object.entries(filters).filter(([k, v]) =>
    !['period', 'group_by'].includes(k) && v !== undefined && (Array.isArray(v) ? v.length > 0 : v !== '')
  ).length;

  // ─── Tabs ──────────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'overview',       label: "Vue d'ensemble",  icon: BarChart3 },
    { id: 'points-of-sale', label: 'Points de vente', icon: MapPin    },
    { id: 'vendors',        label: 'Commerciaux',      icon: Users     },
    { id: 'products',       label: 'Produits',          icon: Package   },
    { id: 'pushcart',       label: 'Prospects',         icon: ShoppingBag },
    { id: 'analytics',      label: 'Analytiques',       icon: TrendingUp },
  ];

  // ─── Overview ──────────────────────────────────────────────────────────────
  const OverviewTab = () => (
    <div>
      {error && (
        <div style={{ background: '#FFF3E8', border: `1px solid #E8C090`, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 20 }}>
          <AlertCircle size={16} color={P.ocre} style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12.5, color: '#9A5E1A' }}>{error}</p>
        </div>
      )}
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        <StatCard title="Ventes totales"    value={fmtCFA(stats.summary?.total_sales          || 0)} growth={stats.summary?.sales_growth}    icon={DollarSign}  color="green" />
        <StatCard title="Commandes"          value={fmtNum(stats.summary?.total_orders          || 0)}                                          icon={ShoppingCart} color="ocre"  />
        <StatCard title="Commerciaux actifs" value={fmtNum(stats.summary?.total_mobile_vendors  || 0)}                                          icon={Users}        color="gold"  />
        <StatCard title="Points de vente"   value={fmtNum(stats.summary?.total_points_of_sale  || 0)}                                          icon={MapPin}       color="teal"  />
      </div>
      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 16 }}>
        <Card>
          <CardHeader title="Évolution des ventes" onExport={() => handleExport('sales')} />
          <ChartComponent chartData={stats.salesChart} title="Ventes" type="bar" height="260px" />
        </Card>
        <Card>
          <CardHeader title="Performance comparative" />
          <div style={{ marginBottom: 12 }}>
            <select onChange={async e => {
              try {
                const res  = await apiService.getPerformanceChart(e.target.value, filters);
                const data = await res.json();
                setStats(prev => ({ ...prev, performanceChart: formatChart(data) }));
              } catch { setStats(prev => ({ ...prev, performanceChart: null })); }
            }} style={{ padding: '5px 8px', border: `1.5px solid ${P.sandBorder}`, borderRadius: 7, background: P.sand, fontSize: 12, color: P.textDark }}>
              <option value="vendors">Commerciaux</option>
              <option value="products">Produits</option>
              <option value="pos">Points de vente</option>
            </select>
          </div>
          <ChartComponent chartData={stats.performanceChart} title="Performance" type="bar" height="220px" />
        </Card>
      </div>
      {/* Top 5 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <Card>
          <CardHeader title="Top 5 commerciaux" onExport={() => handleExport('vendors')} />
          {stats.vendorStats.slice(0, 5).map((v, i) => (
            <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 4 ? `1px solid ${P.sand}` : 'none' }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: i < 2 ? '#FBF4E0' : P.forestPale, color: i < 2 ? '#9A5E1A' : P.forest, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12.5, fontWeight: 500, color: P.textDark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.full_name}</p>
                <p style={{ fontSize: 11, color: P.textMuted }}>{v.phone}</p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: 12.5, fontWeight: 500, color: P.textDark }}>{fmtCFA(v.total_sales)}</p>
                <PerfBadge score={v.performance} />
              </div>
            </div>
          ))}
        </Card>
        <Card>
          <CardHeader title="Top 5 produits" onExport={() => handleExport('products')} />
          {stats.productStats.slice(0, 5).map((p, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 4 ? `1px solid ${P.sand}` : 'none' }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: i < 2 ? '#FBF4E0' : P.forestPale, color: i < 2 ? '#9A5E1A' : P.forest, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12.5, fontWeight: 500, color: P.textDark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                <p style={{ fontSize: 11, color: P.textMuted }}>{p.sku}</p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: 12.5, fontWeight: 500, color: P.textDark }}>{fmtCFA(p.total_revenue)}</p>
                <p style={{ fontSize: 11, color: P.textMuted }}>{fmtNum(p.total_quantity_sold)} unités</p>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );

  // ─── POS Tab ───────────────────────────────────────────────────────────────
  const PointsOfSaleTab = () => (
    <Card>
      <CardHeader title="Points de vente" onExport={() => handleExport('pos')} />
      <DataTable<POSStat>
        data={stats.posStats} emptyIcon={MapPin} emptyMsg="Aucun point de vente"
        searchKeys={['name', 'region', 'commune', 'quartier']}
        columns={[
          { key: 'name',              label: 'Point de vente', render: r => <span style={{ fontWeight: 500 }}>{r.name}</span> },
          { key: 'type',              label: 'Type',            render: r => <span style={{ color: P.textMid, textTransform: 'capitalize' }}>{r.type}</span> },
          { key: 'region',            label: 'Région',          render: r => <span style={{ color: P.textMid }}>{r.region}</span> },
          { key: 'commune',           label: 'Commune',         render: r => <span style={{ color: P.textMid }}>{r.commune || '—'}</span> },
          { key: 'total_sales',       label: 'Ventes',   align: 'right', render: r => <span style={{ fontWeight: 500 }}>{fmtCFA(r.total_sales)}</span> },
          { key: 'total_orders',      label: 'Commandes', align: 'right', render: r => <span>{fmtNum(r.total_orders)}</span> },
          { key: 'performance_score', label: 'Performance', align: 'right', render: r => (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
              <PerfBadge score={r.performance_score} />
              <ProgressBar value={r.performance_score} max={100} />
            </div>
          )},
        ]}
      />
    </Card>
  );

  // ─── Vendors Tab ──────────────────────────────────────────────────────────
  const VendorsTab = () => (
    <Card>
      <CardHeader title="Commerciaux ambulants" onExport={() => handleExport('vendors')} />
      <DataTable<VendorStat>
        data={stats.vendorStats} emptyIcon={Users} emptyMsg="Aucun commercial"
        searchKeys={['full_name', 'phone', 'commune', 'zone']}
        columns={[
          { key: 'full_name', label: 'Nom', render: r => (
            <div><p style={{ fontWeight: 500, color: P.textDark }}>{r.full_name}</p><p style={{ fontSize: 11, color: P.textMuted }}>{r.phone}</p></div>
          )},
          { key: 'status',       label: 'Statut',    render: r => <StatusBadge status={r.status} /> },
          { key: 'vehicle_type', label: 'Véhicule',  render: r => <span style={{ fontSize: 11, color: P.textMid, textTransform: 'capitalize' }}>{r.vehicle_type || '—'}</span> },
          { key: 'commune',      label: 'Commune',   render: r => <span style={{ color: P.textMid }}>{r.commune || '—'}</span> },
          { key: 'zone',         label: 'Zone',      render: r => <span style={{ fontSize: 11, color: P.textMuted }}>{r.zone || '—'}</span> },
          { key: 'total_sales',  label: 'Ventes', align: 'right', render: r => <span style={{ fontWeight: 500 }}>{fmtCFA(r.total_sales)}</span> },
          { key: 'performance',  label: 'Efficacité', align: 'right', render: r => <PerfBadge score={r.performance} /> },
          { key: 'active_days',  label: 'Jours actifs', align: 'right', render: r => <span style={{ color: P.textMid }}>{r.active_days ?? 0}j</span> },
        ]}
      />
    </Card>
  );

  // ─── Products Tab ─────────────────────────────────────────────────────────
  const ProductsTab = () => (
    <Card>
      <CardHeader title="Produits" onExport={() => handleExport('products')} />
      <DataTable<ProductStat>
        data={stats.productStats} emptyIcon={Package} emptyMsg="Aucun produit"
        searchKeys={['name', 'sku', 'category']}
        columns={[
          { key: 'name', label: 'Produit', render: r => (
            <div><p style={{ fontWeight: 500 }}>{r.name}</p><p style={{ fontSize: 11, color: P.textMuted }}>{r.sku}</p></div>
          )},
          { key: 'category', label: 'Catégorie', render: r => (
            <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10.5, fontWeight: 600, background: P.forestPale, color: P.forest }}>{r.category}</span>
          )},
          { key: 'status',              label: 'Statut',     render: r => <StatusBadge status={r.status} /> },
          { key: 'total_quantity_sold', label: 'Qté vendue', align: 'right', render: r => <span>{fmtNum(r.total_quantity_sold)}</span> },
          { key: 'total_revenue',       label: 'Revenu',     align: 'right', render: r => <span style={{ fontWeight: 500 }}>{fmtCFA(r.total_revenue)}</span> },
          { key: 'average_price',       label: 'Prix moyen', align: 'right', render: r => <span style={{ color: P.textMid }}>{fmtCFA(r.average_price)}</span> },
          { key: 'stock_rotation', label: 'Rotation', align: 'right', render: r => (
            <span style={{ fontWeight: 500, color: r.stock_rotation >= 2 ? P.forest : r.stock_rotation >= 1 ? P.ocre : P.red }}>
              {(r.stock_rotation || 0).toFixed(1)}×
            </span>
          )},
        ]}
      />
    </Card>
  );

  // ─── Pushcart Tab ─────────────────────────────────────────────────────────
  const PushcartTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <CardHeader title="Commerciaux — Performance par achats" onExport={() => handleExport('pushcart')} />
        <DataTable<TopPurchaseVendor & { id: number }>
          data={stats.topPurchaseVendors.map(v => ({ ...v, id: v.vendor_id }))}
          emptyIcon={ShoppingBag} emptyMsg="Aucune donnée"
          searchKeys={['vendor_full_name', 'vendor_phone'] as any}
          columns={[
            { key: 'vendor_full_name', label: 'Commercial', render: r => (
              <div><p style={{ fontWeight: 500 }}>{r.vendor_full_name}</p><p style={{ fontSize: 11, color: P.textMuted }}>{r.vendor_phone}</p></div>
            )},
            { key: 'vendor_status',            label: 'Statut',        render: r => <StatusBadge status={r.vendor_status} /> },
            { key: 'point_of_sale',             label: 'Point de vente', render: r => <span style={{ color: P.textMid }}>{r.point_of_sale}</span> },
            { key: 'total_purchase_count',      label: 'Nb achats',   align: 'right', render: r => <span>{fmtNum(r.total_purchase_count)}</span> },
            { key: 'total_purchase_amount',     label: 'Montant',     align: 'right', render: r => <span style={{ fontWeight: 500 }}>{fmtCFA(r.total_purchase_amount)}</span> },
            { key: 'total_sales_from_purchases',label: 'Ventes générées', align: 'right', render: r => <span>{fmtCFA(r.total_sales_from_purchases)}</span> },
            { key: 'purchase_to_sales_efficiency', label: 'Efficacité', align: 'right', render: r => <PerfBadge score={r.purchase_to_sales_efficiency} /> },
          ]}
        />
      </Card>
      <Card>
        <CardHeader title="Détails des achats" onExport={() => handleExport('purchase-details')} />
        <DataTable<PurchaseDetail & { id: number }>
          data={stats.purchaseDetails.map(p => ({ ...p, id: p.purchase_id }))}
          emptyIcon={ShoppingCart} emptyMsg="Aucun détail" initialPerPage={20}
          searchKeys={['purchase_full_name', 'purchase_zone', 'purchase_base'] as any}
          columns={[
            { key: 'purchase_full_name',  label: 'Acheteur', render: r => (
              <div><p style={{ fontWeight: 500 }}>{r.purchase_full_name}</p><p style={{ fontSize: 11, color: P.textMuted }}>{r.purchase_phone}</p></div>
            )},
            { key: 'purchase_zone',           label: 'Zone',          render: r => <span style={{ color: P.textMid }}>{r.purchase_zone || '—'}</span> },
            { key: 'purchase_pushcard_type',  label: 'Type prospect', render: r => (
              <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10.5, fontWeight: 600, background: P.tealPale, color: P.teal }}>{r.purchase_pushcard_type || '—'}</span>
            )},
            { key: 'purchase_amount',     label: 'Montant achat',   align: 'right', render: r => <span style={{ fontWeight: 500 }}>{fmtCFA(r.purchase_amount)}</span> },
            { key: 'total_sales_amount',  label: 'Ventes générées', align: 'right', render: r => <span>{fmtCFA(r.total_sales_amount)}</span> },
            { key: 'sales_efficiency',    label: 'Efficacité',      align: 'right', render: r => <PerfBadge score={r.sales_efficiency} /> },
            { key: 'main_mobile_vendor',  label: 'Vendeur principal', render: r => r.main_mobile_vendor
              ? <div><p style={{ fontSize: 12, fontWeight: 500 }}>{r.main_mobile_vendor.full_name}</p><p style={{ fontSize: 11, color: P.textMuted }}>{r.main_mobile_vendor.phone}</p></div>
              : <span style={{ color: P.textLighter, fontSize: 12 }}>Non assigné</span>
            },
          ]}
        />
      </Card>
    </div>
  );

  // ─── Analytics Tab ────────────────────────────────────────────────────────
  const AnalyticsTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <h3 style={{ fontSize: 13.5, fontWeight: 500, color: P.textDark, marginBottom: 16 }}>Exports & Rapports</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {[
            { type: 'sales',       icon: BarChart,   label: 'Rapport des ventes',   desc: 'Export complet des ventes' },
            { type: 'vendors',     icon: Users,      label: 'Rapport commerciaux',  desc: 'Performance des commerciaux' },
            { type: 'products',    icon: Package,    label: 'Rapport produits',     desc: 'Stocks, rotation, revenus' },
            { type: 'pos',         icon: MapPin,     label: 'Rapport PdV',          desc: 'Points de vente & communes' },
            { type: 'inventory',   icon: Package,    label: 'Rapport inventaire',   desc: 'État des stocks' },
            { type: 'performance', icon: TrendingUp, label: 'Rapport performance',  desc: 'KPIs globaux' },
          ].map(({ type, icon: Icon, label, desc }) => (
            <button key={type} onClick={() => handleExport(type)}
              style={{ padding: 16, border: `1.5px dashed ${P.sandBorder}`, borderRadius: 12, background: 'transparent', textAlign: 'left', cursor: 'pointer', transition: 'background .15s, border-color .15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = P.forestPale; (e.currentTarget as HTMLElement).style.borderColor = P.forest; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = P.sandBorder; }}>
              <Icon size={26} color={P.textLighter} style={{ marginBottom: 10 }} />
              <p style={{ fontSize: 12.5, fontWeight: 500, color: P.textDark }}>{label}</p>
              <p style={{ fontSize: 11, color: P.textMuted, marginTop: 3 }}>{desc}</p>
            </button>
          ))}
        </div>
      </Card>
      <Card>
        <h3 style={{ fontSize: 13.5, fontWeight: 500, color: P.textDark, marginBottom: 12 }}>Filtres actifs</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: P.forestPale, color: P.forest }}>Période : {timeRange} derniers jours</span>
          {filters.region?.map(r => <span key={r} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#EDE8FF', color: '#5340A0' }}>Région : {r}</span>)}
          {filters.commune?.map(c => <span key={c} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: P.tealPale, color: P.teal }}>Commune : {c}</span>)}
          {filters.status && <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: P.forestPale, color: P.forest }}>Statut : {filters.status}</span>}
        </div>
      </Card>
    </div>
  );

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading && !refreshing) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: P.cream }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${P.forestPale}`, borderTopColor: P.forest, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: 12.5, color: P.textMuted, fontWeight: 500 }}>Chargement des statistiques…</p>
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: P.cream }}>
      {/* ── Header ── */}
      <header style={{ background: P.forest, position: 'relative', overflow: 'hidden' }}>
        <KenteBar />
        {/* Grid texture */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: `linear-gradient(rgba(250,247,240,.9) 1px,transparent 1px),linear-gradient(90deg,rgba(250,247,240,.9) 1px,transparent 1px)`, backgroundSize: '36px 36px', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, position: 'relative', zIndex: 1, flexWrap: 'wrap' }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: P.ocre, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Building2 size={18} color="white" />
            </div>
            <div>
              <p style={{ color: '#FAF7F0', fontWeight: 500, fontSize: 15, lineHeight: 1.1 }}>LanfiaLink</p>
              <p style={{ color: 'rgba(250,247,240,.38)', fontSize: 10.5 }}>Tableau de bord statistiques</p>
            </div>
          </div>
          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Filters toggle */}
            <button onClick={() => setShowFilters(f => !f)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px',
              borderRadius: 10, border: `1px solid ${showFilters || activeFiltersCount > 0 ? P.ocre : 'rgba(250,247,240,.2)'}`,
              background: showFilters || activeFiltersCount > 0 ? P.ocre : 'rgba(250,247,240,.08)',
              color: 'rgba(250,247,240,.85)', fontSize: 12.5, cursor: 'pointer',
            }}>
              <SlidersHorizontal size={14} />
              Filtres
              {activeFiltersCount > 0 && (
                <span style={{ background: 'rgba(250,247,240,.25)', padding: '0 5px', borderRadius: 10, fontSize: 10, fontWeight: 700 }}>{activeFiltersCount}</span>
              )}
            </button>
            {/* Period */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(250,247,240,.08)', border: '1px solid rgba(250,247,240,.15)', borderRadius: 10, padding: '7px 10px' }}>
              <Filter size={13} color="rgba(250,247,240,.5)" />
              <select value={timeRange} onChange={e => setTimeRange(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'rgba(250,247,240,.85)', fontSize: 12.5, outline: 'none', cursor: 'pointer' }}>
                <option value="7">7 derniers jours</option>
                <option value="30">30 derniers jours</option>
                <option value="90">3 derniers mois</option>
                <option value="365">1 an</option>
              </select>
            </div>
            {/* Refresh */}
            <button onClick={() => loadStats(true)} disabled={refreshing}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, border: 'none', background: P.ocre, color: 'white', fontSize: 12.5, fontWeight: 500, cursor: refreshing ? 'not-allowed' : 'pointer', opacity: refreshing ? 0.6 : 1 }}>
              <RefreshCw size={13} style={refreshing ? { animation: 'spin 0.8s linear infinite' } : {}} />
              {refreshing ? 'Actualisation…' : 'Actualiser'}
            </button>
          </div>
        </div>
        <KenteBar bottom />
      </header>

      {/* ── Tabs ── */}
      <nav style={{ background: 'white', borderBottom: `1px solid ${P.sandBorder}`, padding: '0 24px', display: 'flex', gap: 2, overflowX: 'auto' }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '12px 14px',
            border: 'none', borderBottom: `2px solid ${activeTab === id ? P.forest : 'transparent'}`,
            background: 'transparent', color: activeTab === id ? P.forest : P.textMuted,
            fontSize: 12.5, fontWeight: activeTab === id ? 500 : 400,
            cursor: 'pointer', whiteSpace: 'nowrap', marginBottom: -1, transition: 'color .15s',
          }}>
            <Icon size={14} />
            {label}
          </button>
        ))}
      </nav>

      {/* ── Content ── */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
        <OcreAccent />

        {/* Stats date range */}
        {stats.summary?.start_date && stats.summary?.end_date && (
          <p style={{ fontSize: 11.5, color: P.textMuted, marginBottom: 16, marginTop: -8 }}>
            {new Date(stats.summary.start_date).toLocaleDateString('fr-FR')} – {new Date(stats.summary.end_date).toLocaleDateString('fr-FR')}
          </p>
        )}

        {showFilters && (
          <FilterPanel
            filters={filters} onUpdate={updateFilter} onReset={resetFilters} onClose={() => setShowFilters(false)}
            availableRegions={availableRegions} availableCommunes={availableCommunes}
            availableQuartiers={availableQuartiers} availableZones={availableZones}
          />
        )}

        <div key={activeTab}>
          {activeTab === 'overview'       && <OverviewTab />}
          {activeTab === 'points-of-sale' && <PointsOfSaleTab />}
          {activeTab === 'vendors'        && <VendorsTab />}
          {activeTab === 'products'       && <ProductsTab />}
          {activeTab === 'pushcart'       && <PushcartTab />}
          {activeTab === 'analytics'      && <AnalyticsTab />}
        </div>

        <footer style={{ textAlign: 'center', marginTop: 32, paddingTop: 16, borderTop: `1px solid ${P.sand}`, fontSize: 10.5, color: P.textLighter }}>
          © {new Date().getFullYear()} LanfiaLink · Côte d'Ivoire · Chiffrement AES-256
        </footer>
      </main>
    </div>
  );
}