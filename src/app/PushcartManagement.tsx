"use client";
// components/dashboard/PushcartManagement.tsx
// Prospects (pushcard) et points de vente : suivi des ventes, filtres détaillés, filtre par agent collecteur.
// Même langage visuel que les vues Activations, Analytiques, Découpage, Géolocalisation et Analyse POS.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, MapPin, Calendar, Phone, Package, BarChart3, ChevronDown, Download, Eye, X, RefreshCw,
  Users, ShoppingCart, Bike, Store, AlertTriangle, ChevronLeft, ChevronRight, Loader2, DollarSign,
  SlidersHorizontal, UserCheck, RotateCcw, CheckCircle2, Wallet,
} from 'lucide-react';
import { apiService } from './ApiService';

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
const NO_AGENT = 'Non renseigné';

/* ─── Types ───────────────────────────────────────────────── */
interface Purchase {
  id: number; full_name: string; first_name: string; last_name: string; zone: string;
  vendor: number; vendor_name?: string; vendor_phone?: string; // vendor_name : à exposer côté API (voir notes)
  purchase_date: string; base: string; pushcard_type: string; phone: string; latitude: number; longitude: number;
  total_sales_amount: string; total_sales_quantity: number; sales_count: number; total_products: number;
  total_variants: number; average_sale_amount: number; created_at: string;
}
interface PurchasePOS {
  id: number; name: string; owner: string; phone: string; email: string; address: string; latitude: number; longitude: number;
  total_sales_amount: string; total_sales_quantity: number; sales_count: number; total_products: number; total_variants: number;
  average_sale_amount: number; district: string; region: string; commune: string; type: string; status: string; nature: string;
  registration_date: string; turnover: string; monthly_orders: number; created_at: string; updated_at: string; user: number;
  avatar: string; brander: boolean; marque_brander: string | null;
  user_name?: string; // nom de l'utilisateur collecteur : à exposer côté API (voir notes)
  agent_name?: string; date_collecte?: string | null;
  agent_label?: string; // calculé au chargement : user_name, sinon nom trouvé via /users/, sinon « Utilisateur #id »
}
interface SaleDetail {
  id: number;
  product_variant: {
    id: number; product: { id: number; name: string; sku: string; category: number; status: string };
    format: { id: number; name: string; description: string }; current_stock: number; price: string; barcode: string;
  };
  quantity: number; total_amount: string; unit_price: number; created_at: string; vendor: string;
}
interface SaleStatistics { grand_total_amount: number; grand_total_quantity: number; total_products: number; total_variants: number; average_price: number }
interface PurchaseDetails {
  purchase: { id: number; full_name: string; zone: string; purchase_date?: string; vendor: string };
  sales: SaleDetail[]; statistics: SaleStatistics;
}
type TabType = 'pushcart' | 'pos';
type Tri = 'all' | 'with' | 'without';

interface PushFilters {
  search: string; agents: string[]; zones: string[]; types: string[]; bases: string[];
  start: string; end: string; minAmount: string; maxAmount: string; sales: Tri; gps: Tri;
}
interface PosFilters {
  search: string; agents: string[]; natures: string[]; districts: string[]; regions: string[]; communes: string[]; types: string[]; statuses: string[];
  branding: Tri; start: string; end: string; minAmount: string; maxAmount: string; sales: Tri; gps: Tri;
}
const EMPTY_PUSH: PushFilters = { search: '', agents: [], zones: [], types: [], bases: [], start: '', end: '', minAmount: '', maxAmount: '', sales: 'all', gps: 'all' };
const EMPTY_POS: PosFilters = { search: '', agents: [], natures: [], districts: [], regions: [], communes: [], types: [], statuses: [], branding: 'all', start: '', end: '', minAmount: '', maxAmount: '', sales: 'all', gps: 'all' };

/* ─── Helpers ─────────────────────────────────────────────── */
const num = (n: string | number | null | undefined) => (typeof n === 'string' ? parseFloat(n) || 0 : n ?? 0);
const fmtMoney = (n: string | number | null | undefined) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(num(n));
const fmtNum = (n: number | null | undefined) => (n ?? 0).toLocaleString('fr-FR');
const fmtDate = (d?: string | null) => (d ? new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d)) : '—');
const fmtDay = (d?: string | null) => (d ? new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d)) : '—');
const norm = (s: string) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const dayStr = (offset = 0) => new Date(Date.now() - offset * 86400000).toISOString().slice(0, 10);
const toArr = (d: any): any[] => (Array.isArray(d) ? d : Array.isArray(d?.results) ? d.results : []);
const hasGps = (x: { latitude: number; longitude: number }) => !!x.latitude && !!x.longitude && !isNaN(x.latitude) && !isNaN(x.longitude);
const agentOfPush = (p: Purchase) => p.vendor_name?.trim() || (p.vendor != null ? `Commercial #${p.vendor}` : NO_AGENT);
const agentOfPos = (p: PurchasePOS) => p.agent_name?.trim() || NO_AGENT;

function inRange(d: string | null | undefined, start: string, end: string) {
  if (!start && !end) return true;
  if (!d) return false;
  const t = new Date(d).getTime();
  if (start && t < new Date(start).getTime()) return false;
  if (end && t > new Date(end).getTime() + 86400000 - 1) return false;
  return true;
}
function triOk(v: Tri, has: boolean) { return v === 'all' || (v === 'with' ? has : !has); }
function amountOk(amt: number, min: string, max: string) {
  if (min !== '' && amt < Number(min)) return false;
  if (max !== '' && amt > Number(max)) return false;
  return true;
}

function applyPush(data: Purchase[], f: PushFilters, ignoreAgents = false) {
  const q = norm(f.search.trim());
  return data.filter((p) => {
    if (q && !norm([p.full_name, p.zone, p.phone, p.base, agentOfPush(p)].join(' ')).includes(q)) return false;
    if (!ignoreAgents && f.agents.length && !f.agents.includes(agentOfPush(p))) return false;
    if (f.zones.length && !f.zones.includes(p.zone)) return false;
    if (f.types.length && !f.types.includes(p.pushcard_type)) return false;
    if (f.bases.length && !f.bases.includes(p.base)) return false;
    if (!inRange(p.purchase_date, f.start, f.end)) return false;
    const amt = num(p.total_sales_amount);
    if (!amountOk(amt, f.minAmount, f.maxAmount)) return false;
    if (!triOk(f.sales, amt > 0)) return false;
    if (!triOk(f.gps, hasGps(p))) return false;
    return true;
  });
}
function applyPos(data: PurchasePOS[], f: PosFilters, ignoreAgents = false) {
  const q = norm(f.search.trim());
  return data.filter((p) => {
    if (q && !norm([p.name, p.owner, p.address, p.phone, p.commune, agentOfPos(p)].join(' ')).includes(q)) return false;
    if (!ignoreAgents && f.agents.length && !f.agents.includes(agentOfPos(p))) return false;
    if (f.districts.length && !f.districts.includes(p.district)) return false;
    if (f.regions.length && !f.regions.includes(p.region)) return false;
    if (f.communes.length && !f.communes.includes(p.commune)) return false;
    if (f.types.length && !f.types.includes(p.type)) return false;
    if (f.statuses.length && !f.statuses.includes(p.status)) return false;
    if (f.branding !== 'all' && (f.branding === 'with') !== !!p.brander) return false;
    if (!inRange(p.registration_date, f.start, f.end)) return false;
    const amt = num(p.total_sales_amount);
    if (!amountOk(amt, f.minAmount, f.maxAmount)) return false;
    if (!triOk(f.sales, amt > 0)) return false;
    if (!triOk(f.gps, hasGps(p))) return false;
    return true;
  });
}

/** Valeurs distinctes avec effectif, les plus fréquentes d'abord. */
function facet<T>(rows: T[], get: (r: T) => string) {
  const m = new Map<string, number>();
  rows.forEach((r) => { const v = get(r); if (v) m.set(v, (m.get(v) || 0) + 1); });
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'fr')).map(([value, count]) => ({ value, count }));
}
function downloadCsv(name: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((f) => `"${String(f ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }));
  a.download = name; a.click();
}

/* ─── Styles ──────────────────────────────────────────────── */
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
const CSS = `
@keyframes pc-spin { to { transform: rotate(360deg); } }
.pc-spin { animation: pc-spin .8s linear infinite; }
.pc-row:hover { background: #F5FAFD; }
.pc-th { cursor: pointer; user-select: none; }
.pc-th:hover { color: ${C.blueD}; }
@media (prefers-reduced-motion: reduce) { .pc-spin { animation: none; } }
`;

/* ─── Petits composants ───────────────────────────────────── */
const Pill = ({ bg, tx, children }: { bg: string; tx: string; children: React.ReactNode }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '2px 9px', borderRadius: 99, fontWeight: 700, background: bg, color: tx, whiteSpace: 'nowrap' }}>{children}</span>
);
const AgentPill = ({ name }: { name: string }) => name === NO_AGENT
  ? <Pill bg={C.greyBg} tx={C.greyTx}>{NO_AGENT}</Pill>
  : <Pill bg={C.violetBg} tx={C.violet}><UserCheck size={10} />{name}</Pill>;

const Kpi = ({ label, value, sub, color, icon: Icon }: { label: string; value: string; sub: string; color: string; icon: React.ComponentType<any> }) => (
  <div style={{ ...card, padding: 16 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <p style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>{label}</p><Icon size={15} style={{ color }} />
    </div>
    <p style={{ fontSize: 24, fontWeight: 700, color, marginTop: 4, lineHeight: 1.1 }}>{value}</p>
    <p style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>{sub}</p>
  </div>
);
const Panel = ({ title, subtitle, icon: Icon, right, children }: { title: string; subtitle?: string; icon: React.ComponentType<any>; right?: React.ReactNode; children: React.ReactNode }) => (
  <div style={{ ...card, padding: 16 }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, paddingBottom: 12, marginBottom: 12, borderBottom: `0.5px solid ${C.lineL}`, flexWrap: 'wrap' }}>
      <div>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: C.text }}><Icon size={14} style={{ color: C.blue }} />{title}</span>
        {subtitle && <p style={{ fontSize: 11, color: C.muted, marginTop: 3, paddingLeft: 22 }}>{subtitle}</p>}
      </div>
      {right}
    </div>
    {children}
  </div>
);
const Empty = ({ icon: Icon, title, text, action }: { icon: React.ComponentType<any>; title: string; text?: string; action?: React.ReactNode }) => (
  <div style={{ padding: '36px 16px', textAlign: 'center' }}>
    <Icon size={28} style={{ color: '#B8D4E8', margin: '0 auto 10px' }} />
    <p style={{ fontSize: 13, fontWeight: 600, color: C.sub, marginBottom: 4 }}>{title}</p>
    {text && <p style={{ fontSize: 12, color: C.muted, maxWidth: 360, margin: '0 auto 12px' }}>{text}</p>}
    {action}
  </div>
);
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
    <span style={{ fontSize: 12, fontWeight: 600, color: C.sub }}>{label}</span>{children}
  </label>
);
const TriSelect = ({ value, onChange, labels }: { value: Tri; onChange: (v: Tri) => void; labels: [string, string, string] }) => (
  <select style={inputStyle} value={value} onChange={(e) => onChange(e.target.value as Tri)}>
    <option value="all">{labels[0]}</option><option value="with">{labels[1]}</option><option value="without">{labels[2]}</option>
  </select>
);

/** Liste déroulante à choix multiples, avec effectifs et recherche si la liste est longue. */
function MultiSelect({ label, options, selected, onChange, highlight }: {
  label: string; options: { value: string; count?: number }[]; selected: string[]; onChange: (v: string[]) => void; highlight?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const toggle = (v: string) => onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  const shown = options.filter((o) => norm(o.value).includes(norm(q)));
  const text = selected.length === 0 ? 'Tous' : selected.length === 1 ? selected[0] : `${selected.length} sélectionnés`;
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={label}
        style={{ ...inputStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left', ...(selected.length || highlight ? { borderColor: C.blue, background: C.pale } : {}) }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selected.length ? C.text : C.muted, fontWeight: selected.length ? 600 : 400 }}>{text}</span>
        <ChevronDown size={13} style={{ color: C.muted, flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{ position: 'absolute', zIndex: 30, top: '100%', marginTop: 4, minWidth: '100%', width: 260, background: '#fff', border: `1px solid ${C.line}`, borderRadius: 12, boxShadow: '0 8px 24px rgba(13,27,42,.14)' }}>
          {options.length > 8 && (
            <div style={{ padding: 8, borderBottom: `1px solid ${C.surface}` }}>
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" aria-label={`Rechercher ${label}`} style={{ ...inputStyle, height: 30, fontSize: 12 }} />
            </div>
          )}
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {shown.length === 0 && <p style={{ padding: 12, fontSize: 12, color: C.muted }}>{options.length ? 'Aucun résultat' : 'Aucune valeur disponible'}</p>}
            {shown.map((o) => (
              <label key={o.value} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', cursor: 'pointer', fontSize: 12, color: C.text }}>
                <input type="checkbox" checked={selected.includes(o.value)} onChange={() => toggle(o.value)} style={{ accentColor: C.blue }} />
                <span style={{ flex: 1 }}>{o.value}</span>
                {o.count !== undefined && <span style={{ color: C.muted, fontSize: 11 }}>{o.count}</span>}
              </label>
            ))}
          </div>
          {selected.length > 0 && (
            <div style={{ padding: 8, borderTop: `1px solid ${C.surface}` }}>
              <button onClick={() => onChange([])} style={{ ...btnGhost, padding: '4px 10px', width: '100%', justifyContent: 'center' }}>Effacer la sélection</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Tableau : tri, pagination, CSV ──────────────────────── */
interface Column<T> {
  key: string; label: string; align?: 'left' | 'right'; render?: (r: T) => React.ReactNode;
  sort?: (r: T) => number | string; csv?: (r: T) => string | number; hidden?: boolean;
}
function DataTable<T extends { id: number }>({ data, columns, exportName, emptyMsg, defaultSort }: {
  data: T[]; columns: Column<T>[]; exportName: string; emptyMsg: string; defaultSort?: { key: string; asc: boolean };
}) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortKey, setSortKey] = useState<string | null>(defaultSort?.key ?? null);
  const [asc, setAsc] = useState(defaultSort?.asc ?? false);
  const shown = columns.filter((c) => !c.hidden);

  const rows = useMemo(() => {
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sort) return data;
    const f = col.sort;
    return [...data].sort((a, b) => {
      const x = f(a), y = f(b);
      const cmp = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'fr');
      return asc ? cmp : -cmp;
    });
  }, [data, columns, sortKey, asc]);

  useEffect(() => setPage(1), [data, perPage, sortKey, asc]);
  const totalPages = Math.max(1, Math.ceil(rows.length / perPage));
  const slice = rows.slice((page - 1) * perPage, page * perPage);
  const from = rows.length ? (page - 1) * perPage + 1 : 0;

  const exportCsv = () => {
    const cols = columns.filter((c) => c.csv || c.sort);
    const val = (c: Column<T>, r: T) => (c.csv ? c.csv(r) : c.sort!(r));
    downloadCsv(`${exportName}_${dayStr()}.csv`, [cols.map((c) => c.label), ...rows.map((r) => cols.map((c) => val(c, r)))]);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>{fmtNum(rows.length)} résultat{rows.length > 1 ? 's' : ''}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <select aria-label="Lignes par page" value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} style={{ ...inputStyle, height: 30, width: 'auto', fontSize: 11 }}>
            {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
          </select>
          <button onClick={exportCsv} disabled={!rows.length} style={{ ...btnGhost, padding: '5px 10px', opacity: rows.length ? 1 : 0.5 }}><Download size={12} /> CSV</button>
        </div>
      </div>
      {rows.length === 0 ? <Empty icon={Search} title={emptyMsg} text="Aucune donnée ne correspond aux filtres actuels." /> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.lineL}` }}>
                {shown.map((c) => (
                  <th key={c.key} className={c.sort ? 'pc-th' : undefined} aria-sort={sortKey === c.key ? (asc ? 'ascending' : 'descending') : undefined}
                    onClick={() => { if (!c.sort) return; if (sortKey === c.key) setAsc((a) => !a); else { setSortKey(c.key); setAsc(false); } }}
                    style={{ padding: '0 12px 10px 0', textAlign: c.align || 'left', fontSize: 11, fontWeight: 700, color: sortKey === c.key ? C.blueD : C.muted, whiteSpace: 'nowrap' }}>
                    {c.label}{sortKey === c.key && (asc ? ' ↑' : ' ↓')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slice.map((r) => (
                <tr key={r.id} className="pc-row" style={{ borderBottom: `1px solid ${C.surface}` }}>
                  {shown.map((c) => <td key={c.key} style={{ padding: '10px 12px 10px 0', textAlign: c.align || 'left', color: C.text, verticalAlign: 'middle' }}>{c.render ? c.render(r) : c.sort ? String(c.sort(r)) : ''}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{from}–{Math.min(page * perPage, rows.length)} sur {fmtNum(rows.length)} · page {page}/{totalPages}</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => setPage(1)} disabled={page === 1} aria-label="Première page" style={{ ...btnGhost, padding: '5px 9px', opacity: page === 1 ? 0.5 : 1 }}>«</button>
            <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} aria-label="Page précédente" style={{ ...btnGhost, padding: '5px 9px', opacity: page === 1 ? 0.5 : 1 }}><ChevronLeft size={13} /></button>
            <button onClick={() => setPage((p) => p + 1)} disabled={page === totalPages} aria-label="Page suivante" style={{ ...btnGhost, padding: '5px 9px', opacity: page === totalPages ? 0.5 : 1 }}><ChevronRight size={13} /></button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages} aria-label="Dernière page" style={{ ...btnGhost, padding: '5px 9px', opacity: page === totalPages ? 0.5 : 1 }}>»</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Fenêtre de détail des ventes ────────────────────────── */
interface ModalState { tab: TabType; title: string; sub: string; extra: [string, string][]; loading: boolean; error: string | null; details: PurchaseDetails | null }

function DetailsModal({ state, onClose }: { state: ModalState; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  const d = state.details;
  const exportSales = () => {
    if (!d) return;
    downloadCsv(`ventes_${d.purchase.id}_${dayStr()}.csv`, [
      ['Produit', 'SKU', 'Format', 'Prix unitaire', 'Quantité', 'Total', 'Date'],
      ...d.sales.map((s) => [s.product_variant.product.name, s.product_variant.product.sku, s.product_variant.format.name, s.unit_price, s.quantity, s.total_amount, fmtDate(s.created_at)]),
    ]);
  };
  return (
    <div role="dialog" aria-modal="true" aria-label="Détails des ventes" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(10,30,46,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ ...card, width: '100%', maxWidth: 860, maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `0.5px solid ${C.lineL}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{state.title}</p>
            <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{state.sub}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {d && d.sales.length > 0 && <button onClick={exportSales} style={{ ...btnGhost, padding: '5px 10px' }}><Download size={12} /> CSV</button>}
            <button onClick={onClose} aria-label="Fermer" style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}><X size={18} /></button>
          </div>
        </div>

        <div style={{ padding: 20, overflowY: 'auto' }}>
          {state.loading ? (
            <div style={{ padding: '56px 0', textAlign: 'center' }}><Loader2 className="pc-spin" size={26} style={{ color: C.blue, margin: '0 auto 10px' }} /><p style={{ fontSize: 13, color: C.muted }}>Chargement des ventes…</p></div>
          ) : state.error ? (
            <div role="alert" style={{ display: 'flex', gap: 8, padding: 12, borderRadius: 10, background: C.redBg, color: C.redTx, fontSize: 12 }}><AlertTriangle size={14} />{state.error}</div>
          ) : d ? (
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                <div style={{ border: `1px solid ${C.lineL}`, borderRadius: 14, padding: 14 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: C.blue, marginBottom: 10 }}>{state.tab === 'pushcart' ? 'Client' : 'Point de vente'}</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 8 }}>{d.purchase.full_name}</p>
                  <p style={{ fontSize: 12, color: C.sub, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}><MapPin size={11} style={{ color: C.blue }} />{d.purchase.zone || '—'}</p>
                  {state.extra.map(([k, v]) => <p key={k} style={{ fontSize: 12, color: C.sub, marginBottom: 4 }}><span style={{ color: C.muted }}>{k} : </span>{v}</p>)}
                  {state.tab === 'pushcart' && d.purchase.purchase_date && <p style={{ fontSize: 12, color: C.sub, display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={11} style={{ color: C.amber }} />{fmtDate(d.purchase.purchase_date)}</p>}
                </div>
                <div style={{ background: C.pale, border: `1px solid ${C.lineL}`, borderRadius: 14, padding: 14 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: C.blue, marginBottom: 10 }}>Résumé</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[['Montant total', fmtMoney(d.statistics.grand_total_amount)], ['Quantité', fmtNum(d.statistics.grand_total_quantity)], ['Produits', fmtNum(d.statistics.total_products)], ['Variantes', fmtNum(d.statistics.total_variants)]].map(([k, v]) => (
                      <div key={k} style={{ background: '#fff', borderRadius: 10, padding: 10 }}>
                        <p style={{ fontSize: 11, color: C.muted }}>{k}</p><p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginTop: 2 }}>{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}><Package size={14} style={{ color: C.blue }} />Produits vendus</p>
                {d.sales.length === 0 ? <Empty icon={Package} title="Aucune vente enregistrée" /> : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead><tr style={{ borderBottom: `1px solid ${C.lineL}` }}>
                        {['Produit', 'Format', 'Prix unit.', 'Qté', 'Total', 'Date'].map((h, i) => <th key={h} style={{ padding: '0 12px 10px 0', textAlign: i >= 2 && i <= 4 ? 'right' : 'left', fontSize: 11, fontWeight: 700, color: C.muted, whiteSpace: 'nowrap' }}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {d.sales.map((s) => (
                          <tr key={s.id} className="pc-row" style={{ borderBottom: `1px solid ${C.surface}` }}>
                            <td style={{ padding: '10px 12px 10px 0' }}><p style={{ fontWeight: 600, color: C.text }}>{s.product_variant.product.name}</p><p style={{ fontSize: 10, color: C.muted }}>SKU : {s.product_variant.product.sku}</p></td>
                            <td style={{ padding: '10px 12px 10px 0', color: C.sub }}>{s.product_variant.format.name}</td>
                            <td style={{ padding: '10px 12px 10px 0', textAlign: 'right', color: C.sub }}>{fmtMoney(s.unit_price)}</td>
                            <td style={{ padding: '10px 12px 10px 0', textAlign: 'right' }}><Pill bg={C.pale} tx={C.blueD}>{s.quantity}</Pill></td>
                            <td style={{ padding: '10px 12px 10px 0', textAlign: 'right', fontWeight: 700, color: C.blueD }}>{fmtMoney(s.total_amount)}</td>
                            <td style={{ padding: '10px 0', fontSize: 11, color: C.muted, whiteSpace: 'nowrap' }}>{fmtDay(s.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
        <div style={{ padding: '12px 20px', borderTop: `0.5px solid ${C.lineL}`, display: 'flex', justifyContent: 'flex-end' }}><button onClick={onClose} style={btnGhost}>Fermer</button></div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Composant principal
   ═══════════════════════════════════════════════════════════ */
const PushcartManagement = () => {
  const [tab, setTab] = useState<TabType>('pushcart');
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [purchasesPOS, setPurchasesPOS] = useState<PurchasePOS[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState<string[]>([]);
  const [fp, setFp] = useState<PushFilters>(EMPTY_PUSH);
  const [fs, setFs] = useState<PosFilters>(EMPTY_POS);
  const [advanced, setAdvanced] = useState(false);
  const [showAgents, setShowAgents] = useState(true);
  const [allAgents, setAllAgents] = useState(false);
  const [modal, setModal] = useState<ModalState | null>(null);
  const reqId = useRef(0);

  const load = useCallback(async (isRefresh = false) => {
    const id = ++reqId.current;
    isRefresh ? setRefreshing(true) : setLoading(true);
    const [a, b] = await Promise.allSettled([apiService.get('/purchasedata/'), apiService.get('/purchasedatapos/')]);
    const failedNow: string[] = [];
    let p: Purchase[] = [], s: PurchasePOS[] = [];
    if (a.status === 'fulfilled' && a.value.ok) { try { p = toArr(await a.value.json()); } catch { failedNow.push('prospects'); } } else failedNow.push('prospects');
    if (b.status === 'fulfilled' && b.value.ok) { try { s = toArr(await b.value.json()).filter((x: PurchasePOS) => (x.nature || 'pdv') === 'pdv'); } catch { failedNow.push('points de vente'); } } else failedNow.push('points de vente');
    if (id !== reqId.current) return;
    if (!failedNow.includes('prospects')) setPurchases(p);
    if (!failedNow.includes('points de vente')) setPurchasesPOS(s);
    setFailed(failedNow); setLoading(false); setRefreshing(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  /* ── Filtrage ── */
  const pushRows = useMemo(() => applyPush(purchases, fp), [purchases, fp]);
  const posRows = useMemo(() => applyPos(purchasesPOS, fs), [purchasesPOS, fs]);
  const pushForAgents = useMemo(() => applyPush(purchases, fp, true), [purchases, fp]);
  const posForAgents = useMemo(() => applyPos(purchasesPOS, fs, true), [purchasesPOS, fs]);

  /* ── Options de filtres (effectifs sur toute la base) ── */
  const opt = useMemo(() => ({
    pushAgents: facet(purchases, agentOfPush), zones: facet(purchases, (p) => p.zone), pushTypes: facet(purchases, (p) => p.pushcard_type), bases: facet(purchases, (p) => p.base),
    posAgents: facet(purchasesPOS, agentOfPos), districts: facet(purchasesPOS, (p) => p.district), regions: facet(purchasesPOS, (p) => p.region),
    communes: facet(purchasesPOS, (p) => p.commune), posTypes: facet(purchasesPOS, (p) => p.type), statuses: facet(purchasesPOS, (p) => p.status),
  }), [purchases, purchasesPOS]);

  const isPush = tab === 'pushcart';
  const posAgentKnown = purchasesPOS.some((p) => !!p.agent_name?.trim());
  const pushAgentKnown = purchases.some((p) => !!p.vendor_name?.trim());

  /* ── Performance par agent collecteur ── */
  const agentRows = useMemo(() => {
    const m = new Map<string, { name: string; count: number; amount: number; qty: number; withSales: number; last: string }>();
    const add = (name: string, amt: number, qty: number, date: string) => {
      const r = m.get(name) || { name, count: 0, amount: 0, qty: 0, withSales: 0, last: '' };
      r.count++; r.amount += amt; r.qty += qty; if (amt > 0) r.withSales++; if (date && date > r.last) r.last = date;
      m.set(name, r);
    };
    if (isPush) pushForAgents.forEach((p) => add(agentOfPush(p), num(p.total_sales_amount), p.total_sales_quantity || 0, p.purchase_date));
    else posForAgents.forEach((p) => add(agentOfPos(p), num(p.total_sales_amount), p.total_sales_quantity || 0, p.registration_date));
    return [...m.values()].sort((a, b) => b.count - a.count);
  }, [isPush, pushForAgents, posForAgents]);
  const selectedAgents = isPush ? fp.agents : fs.agents;
  const setAgents = (v: string[]) => (isPush ? setFp((f) => ({ ...f, agents: v })) : setFs((f) => ({ ...f, agents: v })));
  const toggleAgent = (name: string) => setAgents(selectedAgents.includes(name) ? selectedAgents.filter((x) => x !== name) : [...selectedAgents, name]);
  const maxAgentCount = Math.max(1, ...agentRows.map((r) => r.count));

  /* ── KPI ── */
  const kpis = useMemo(() => {
    if (isPush) {
      const sales = pushRows.reduce((a, p) => a + num(p.total_sales_amount), 0);
      const count = pushRows.reduce((a, p) => a + (p.sales_count || 0), 0);
      return [
        { label: 'Prospects', value: fmtNum(pushRows.length), sub: `sur ${fmtNum(purchases.length)} au total`, color: C.blueD, icon: Users },
        { label: 'Ventes totales', value: fmtMoney(sales), sub: `${fmtNum(pushRows.reduce((a, p) => a + (p.total_sales_quantity || 0), 0))} unités`, color: C.green, icon: DollarSign },
        { label: 'Panier moyen', value: count ? fmtMoney(sales / count) : '—', sub: `${fmtNum(count)} vente${count > 1 ? 's' : ''}`, color: C.violet, icon: Wallet },
        { label: 'Agents collecteurs', value: fmtNum(new Set(pushRows.map(agentOfPush)).size), sub: `${fmtNum(new Set(pushRows.map((p) => p.zone).filter(Boolean)).size)} zones · ${Math.round((pushRows.filter(hasGps).length / Math.max(pushRows.length, 1)) * 100)} % géolocalisés`, color: C.amber, icon: UserCheck },
      ];
    }
    const sales = posRows.reduce((a, p) => a + num(p.total_sales_amount), 0);
    return [
      { label: 'Points de vente', value: fmtNum(posRows.length), sub: `sur ${fmtNum(purchasesPOS.length)} au total`, color: C.blueD, icon: Store },
      { label: 'Ventes totales', value: fmtMoney(sales), sub: `${fmtNum(posRows.filter((p) => num(p.total_sales_amount) > 0).length)} PDV avec ventes`, color: C.green, icon: DollarSign },
      { label: "Chiffre d'affaires", value: fmtMoney(posRows.reduce((a, p) => a + num(p.turnover), 0)), sub: `${fmtNum(posRows.reduce((a, p) => a + (p.monthly_orders || 0), 0))} commandes / mois`, color: C.violet, icon: ShoppingCart },
      { label: 'Agents collecteurs', value: posAgentKnown ? fmtNum(new Set(posRows.map(agentOfPos)).size) : '—', sub: `${fmtNum(new Set(posRows.map((p) => p.commune).filter(Boolean)).size)} communes · ${Math.round((posRows.filter(hasGps).length / Math.max(posRows.length, 1)) * 100)} % géolocalisés`, color: C.amber, icon: UserCheck },
    ];
  }, [isPush, pushRows, posRows, purchases.length, purchasesPOS.length, posAgentKnown]);

  /* ── Pastilles de filtres actifs ── */
  const chips = useMemo(() => {
    const out: { key: string; label: string; clear: () => void }[] = [];
    const listChips = (prefix: string, label: string, values: string[], set: (v: string[]) => void) =>
      values.forEach((v) => out.push({ key: `${prefix}-${v}`, label: `${label} : ${v}`, clear: () => set(values.filter((x) => x !== v)) }));
    const triLabel = (v: Tri, w: string, wo: string) => (v === 'with' ? w : wo);
    if (isPush) {
      if (fp.search) out.push({ key: 'q', label: `Recherche : ${fp.search}`, clear: () => setFp((f) => ({ ...f, search: '' })) });
      listChips('ag', 'Agent', fp.agents, (v) => setFp((f) => ({ ...f, agents: v })));
      listChips('z', 'Zone', fp.zones, (v) => setFp((f) => ({ ...f, zones: v })));
      listChips('t', 'Type', fp.types, (v) => setFp((f) => ({ ...f, types: v })));
      listChips('b', 'Base', fp.bases, (v) => setFp((f) => ({ ...f, bases: v })));
      if (fp.start || fp.end) out.push({ key: 'd', label: `Période : ${fp.start || '…'} → ${fp.end || '…'}`, clear: () => setFp((f) => ({ ...f, start: '', end: '' })) });
      if (fp.minAmount || fp.maxAmount) out.push({ key: 'm', label: `Montant : ${fp.minAmount || '0'} – ${fp.maxAmount || '∞'}`, clear: () => setFp((f) => ({ ...f, minAmount: '', maxAmount: '' })) });
      if (fp.sales !== 'all') out.push({ key: 's', label: triLabel(fp.sales, 'Avec ventes', 'Sans vente'), clear: () => setFp((f) => ({ ...f, sales: 'all' })) });
      if (fp.gps !== 'all') out.push({ key: 'g', label: triLabel(fp.gps, 'Avec GPS', 'Sans GPS'), clear: () => setFp((f) => ({ ...f, gps: 'all' })) });
    } else {
      if (fs.search) out.push({ key: 'q', label: `Recherche : ${fs.search}`, clear: () => setFs((f) => ({ ...f, search: '' })) });
      listChips('ag', 'Agent', fs.agents, (v) => setFs((f) => ({ ...f, agents: v })));
      listChips('di', 'District', fs.districts, (v) => setFs((f) => ({ ...f, districts: v })));
      listChips('re', 'Région', fs.regions, (v) => setFs((f) => ({ ...f, regions: v })));
      listChips('co', 'Commune', fs.communes, (v) => setFs((f) => ({ ...f, communes: v })));
      listChips('t', 'Type', fs.types, (v) => setFs((f) => ({ ...f, types: v })));
      listChips('st', 'Statut', fs.statuses, (v) => setFs((f) => ({ ...f, statuses: v })));
      if (fs.branding !== 'all') out.push({ key: 'br', label: triLabel(fs.branding, 'Brandés', 'Non brandés'), clear: () => setFs((f) => ({ ...f, branding: 'all' })) });
      if (fs.start || fs.end) out.push({ key: 'd', label: `Enregistrement : ${fs.start || '…'} → ${fs.end || '…'}`, clear: () => setFs((f) => ({ ...f, start: '', end: '' })) });
      if (fs.minAmount || fs.maxAmount) out.push({ key: 'm', label: `Montant : ${fs.minAmount || '0'} – ${fs.maxAmount || '∞'}`, clear: () => setFs((f) => ({ ...f, minAmount: '', maxAmount: '' })) });
      if (fs.sales !== 'all') out.push({ key: 's', label: triLabel(fs.sales, 'Avec ventes', 'Sans vente'), clear: () => setFs((f) => ({ ...f, sales: 'all' })) });
      if (fs.gps !== 'all') out.push({ key: 'g', label: triLabel(fs.gps, 'Avec GPS', 'Sans GPS'), clear: () => setFs((f) => ({ ...f, gps: 'all' })) });
    }
    return out;
  }, [isPush, fp, fs]);

  const resetFilters = () => (isPush ? setFp(EMPTY_PUSH) : setFs(EMPTY_POS));
  const preset = (days: number | null) => {
    const patch = days === null ? { start: '', end: '' } : { start: dayStr(days), end: dayStr(0) };
    isPush ? setFp((f) => ({ ...f, ...patch })) : setFs((f) => ({ ...f, ...patch }));
  };
  const f = isPush ? fp : fs;
  const dateError = f.start && f.end && f.end < f.start ? 'La date de fin doit suivre la date de début.' : null;

  /* ── Détails d'une ligne ── */
  const openDetails = async (row: Purchase | PurchasePOS) => {
    const t = tab;
    const base: ModalState = t === 'pushcart'
      ? { tab: t, title: 'Détail des ventes', sub: `${(row as Purchase).full_name} · agent : ${agentOfPush(row as Purchase)}`, extra: [['Téléphone', (row as Purchase).phone || '—'], ['Base', (row as Purchase).base || '—']], loading: true, error: null, details: null }
      : { tab: t, title: 'Détail des ventes', sub: `${(row as PurchasePOS).name}`, extra: [['Propriétaire', (row as PurchasePOS).owner || '—'], ['Téléphone', (row as PurchasePOS).phone || '—'], ['Agent collecteur', agentOfPos(row as PurchasePOS)]], loading: true, error: null, details: null };
    setModal(base);
    try {
      const res = await apiService.get(t === 'pushcart' ? `/purchasedata/${row.id}/sales_details/` : `/purchasedatapos/${row.id}/sales_details/`);
      if (!res.ok) throw new Error('Impossible de charger le détail des ventes.');
      setModal({ ...base, loading: false, details: await res.json() });
    } catch (e: any) { setModal({ ...base, loading: false, error: e.message || 'Erreur de chargement.' }); }
  };

  /* ── Colonnes ── */
  const eyeBtn = (onClick: () => void, name: string) => (
    <button onClick={onClick} aria-label={`Voir les ventes de ${name}`} title="Voir les ventes" style={{ ...btnGhost, padding: '5px 9px' }}><Eye size={13} style={{ color: C.blueD }} /></button>
  );
  const pushColumns: Column<Purchase>[] = [
    { key: 'name', label: 'Client', sort: (r) => r.full_name, csv: (r) => r.full_name, render: (r) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 34, height: 34, borderRadius: 10, background: '#D6EAF6', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Bike size={15} style={{ color: C.blueD }} /></span>
        <div><p style={{ fontWeight: 600 }}>{r.full_name}</p><p style={{ fontSize: 11, color: C.muted }}>{r.pushcard_type || '—'}</p></div>
      </div>) },
    { key: 'zone', label: 'Zone & base', sort: (r) => r.zone || '', csv: (r) => `${r.zone} / ${r.base}`, render: (r) => (<div><p style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11} style={{ color: C.blue }} />{r.zone || '—'}</p><p style={{ fontSize: 11, color: C.muted }}>{r.base}</p></div>) },
    { key: 'agent', label: 'Agent collecteur', sort: (r) => agentOfPush(r), csv: (r) => agentOfPush(r), render: (r) => <AgentPill name={agentOfPush(r)} /> },
    { key: 'phone', label: 'Contact', sort: (r) => r.phone || '', render: (r) => <span style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Phone size={11} style={{ color: C.green }} />{r.phone || '—'}</span> },
    { key: 'amount', label: 'Ventes', align: 'right', sort: (r) => num(r.total_sales_amount), csv: (r) => num(r.total_sales_amount), render: (r) => (<div><p style={{ fontWeight: 700, color: C.blueD }}>{fmtMoney(r.total_sales_amount)}</p><p style={{ fontSize: 11, color: C.muted }}>{fmtNum(r.total_sales_quantity)} unités · {fmtNum(r.sales_count)} vente{r.sales_count > 1 ? 's' : ''}</p></div>) },
    { key: 'date', label: 'Date', sort: (r) => r.purchase_date || '', csv: (r) => fmtDate(r.purchase_date), render: (r) => <span style={{ fontSize: 12 }}>{fmtDay(r.purchase_date)}</span> },
    { key: 'gps', label: 'GPS', sort: (r) => (hasGps(r) ? 1 : 0), csv: (r) => (hasGps(r) ? 'Oui' : 'Non'), render: (r) => (hasGps(r) ? <CheckCircle2 size={14} style={{ color: C.green }} /> : <span style={{ color: C.muted }}>—</span>) },
    { key: 'lat', label: 'Latitude', hidden: true, csv: (r) => r.latitude ?? '' },
    { key: 'lng', label: 'Longitude', hidden: true, csv: (r) => r.longitude ?? '' },
    { key: 'act', label: '', render: (r) => eyeBtn(() => openDetails(r), r.full_name) },
  ];
  const posColumns: Column<PurchasePOS>[] = [
    { key: 'name', label: 'Point de vente', sort: (r) => r.name, csv: (r) => r.name, render: (r) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 36, height: 36, borderRadius: 10, overflow: 'hidden', background: C.pale, border: `1px solid ${C.lineL}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {r.avatar ? <img src={r.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Store size={15} style={{ color: C.blueD }} />}
        </span>
        <div><p style={{ fontWeight: 600 }}>{r.name}</p><p style={{ fontSize: 11, color: C.muted }}>{r.owner}</p></div>
      </div>) },
    { key: 'agent', label: 'Agent collecteur', sort: (r) => agentOfPos(r), csv: (r) => agentOfPos(r), render: (r) => <AgentPill name={agentOfPos(r)} /> },
    { key: 'loc', label: 'Localisation', sort: (r) => r.commune || '', csv: (r) => `${r.commune}, ${r.district}`, render: (r) => (<div><p style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11} style={{ color: C.blue }} />{r.commune || '—'}</p><p style={{ fontSize: 11, color: C.muted }}>{r.district}{r.region ? ` · ${r.region}` : ''}</p></div>) },
    { key: 'type', label: 'Type & statut', sort: (r) => r.type || '', csv: (r) => `${r.type} / ${r.status}`, render: (r) => (<div style={{ display: 'grid', gap: 4, justifyItems: 'start' }}><Pill bg={C.pale} tx={C.blueD}>{r.type || '—'}</Pill><Pill bg={r.status === 'actif' ? C.greenBg : C.amberBg} tx={r.status === 'actif' ? C.greenTx : C.amberTx}>{r.status}</Pill></div>) },
    { key: 'brand', label: 'Branding', sort: (r) => (r.brander ? 1 : 0), csv: (r) => (r.brander ? r.marque_brander || 'Oui' : 'Non'), render: (r) => <Pill bg={r.brander ? C.greenBg : C.amberBg} tx={r.brander ? C.greenTx : C.amberTx}>{r.brander ? 'Brandé' : 'Non brandé'}</Pill> },
    { key: 'amount', label: 'Ventes', align: 'right', sort: (r) => num(r.total_sales_amount), csv: (r) => num(r.total_sales_amount), render: (r) => (<div><p style={{ fontWeight: 700, color: C.blueD }}>{fmtMoney(r.total_sales_amount)}</p><p style={{ fontSize: 11, color: C.muted }}>{fmtNum(r.monthly_orders)} cmd / mois</p></div>) },
    { key: 'ca', label: 'CA', align: 'right', sort: (r) => num(r.turnover), csv: (r) => num(r.turnover), render: (r) => <span style={{ fontSize: 12 }}>{fmtMoney(r.turnover)}</span> },
    { key: 'date', label: 'Enregistrement', sort: (r) => r.registration_date || '', csv: (r) => r.registration_date, render: (r) => <span style={{ fontSize: 12 }}>{fmtDay(r.registration_date)}</span> },
    { key: 'gps', label: 'GPS', sort: (r) => (hasGps(r) ? 1 : 0), csv: (r) => (hasGps(r) ? 'Oui' : 'Non'), render: (r) => (hasGps(r) ? <CheckCircle2 size={14} style={{ color: C.green }} /> : <span style={{ color: C.muted }}>—</span>) },
    { key: 'phone', label: 'Téléphone', hidden: true, csv: (r) => r.phone },
    { key: 'addr', label: 'Adresse', hidden: true, csv: (r) => r.address },
    { key: 'act', label: '', render: (r) => eyeBtn(() => openDetails(r), r.name) },
  ];

  if (loading) {
    return <div style={{ ...card, padding: 56, textAlign: 'center' }}><style>{CSS}</style><Loader2 className="pc-spin" size={26} style={{ color: C.blue, margin: '0 auto 10px' }} /><p style={{ fontSize: 13, color: C.muted }}>Chargement des prospects et points de vente…</p></div>;
  }

  const totalAll = isPush ? purchases.length : purchasesPOS.length;
  const agentOptions = isPush ? opt.pushAgents : opt.posAgents;
  const agentDataMissing = isPush ? !pushAgentKnown && purchases.length > 0 : !posAgentKnown && purchasesPOS.length > 0;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <style>{CSS}</style>

      {/* Bandeau */}
      <div style={{ background: C.navy, borderRadius: 16, padding: 20, display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><Users size={16} style={{ color: C.blueL }} /><span style={{ color: 'rgba(200,230,248,.9)', fontSize: 12, fontWeight: 600 }}>LanfiaLink Prospects</span></div>
          <p style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>Qui a collecté quoi, où, et avec quels résultats de vente</p>
          <p style={{ color: 'rgba(200,230,248,.85)', fontSize: 12, marginTop: 6 }}>Filtrez par agent collecteur, zone, période ou montant, puis exportez le résultat.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'inline-flex', gap: 2, padding: 4, borderRadius: 12, background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)' }}>
            {([['pushcart', 'Prospects Pushcart', Bike], ['pos', 'Points de vente', Store]] as const).map(([k, label, Icon]) => (
              <button key={k} onClick={() => { setTab(k); setAdvanced(false); }} aria-pressed={tab === k}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', background: tab === k ? C.blue : 'transparent', color: tab === k ? '#fff' : 'rgba(200,230,248,.9)' }}>
                <Icon size={12} />{label}
              </button>
            ))}
          </div>
          <button onClick={() => load(true)} disabled={refreshing} style={{ ...btn('rgba(79,179,232,.18)'), opacity: refreshing ? 0.7 : 1 }}><RefreshCw size={13} className={refreshing ? 'pc-spin' : undefined} />{refreshing ? 'Actualisation…' : 'Actualiser'}</button>
        </div>
      </div>

      {failed.length > 0 && (
        <div role="alert" style={{ display: 'flex', gap: 10, alignItems: 'center', padding: 12, borderRadius: 12, background: C.redBg, color: C.redTx, fontSize: 12 }}>
          <AlertTriangle size={14} /><span style={{ flex: 1 }}>Les données « {failed.join(' » et « ')} » n'ont pas pu être chargées.</span>
          <button onClick={() => load(true)} style={{ ...btnGhost, padding: '4px 10px', color: C.redTx }}>Réessayer</button>
        </div>
      )}
      {agentDataMissing && (
        <div role="status" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: 12, borderRadius: 12, background: C.amberBg, color: C.amberTx, fontSize: 12 }}>
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{isPush
            ? "L'API ne renvoie pas encore le nom de l'agent collecteur des prospects : seul son numéro est affiché. Ajoutez vendor_name à la réponse de /purchasedata/ pour afficher et filtrer par nom."
            : "L'API ne renvoie pas encore l'agent collecteur des points de vente. Ajoutez agent_name à la réponse de /purchasedatapos/ pour activer ce filtre."}</span>
        </div>
      )}

      {/* KPI */}
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {kpis.map((k) => <Kpi key={k.label} {...k} />)}
      </div>

      {/* Filtres */}
      <div style={{ ...card, padding: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ position: 'relative', flex: '2 1 260px' }}>
            <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: f.search ? C.blue : C.muted }} />
            <input aria-label="Rechercher" value={f.search} onChange={(e) => (isPush ? setFp((x) => ({ ...x, search: e.target.value })) : setFs((x) => ({ ...x, search: e.target.value })))}
              placeholder={isPush ? 'Rechercher un client, une zone, un téléphone, un agent…' : 'Rechercher un PDV, un propriétaire, une adresse, un agent…'}
              style={{ ...inputStyle, paddingLeft: 32, borderColor: f.search ? C.blue : C.line }} />
          </div>
          <div style={{ flex: '1 1 220px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 5 }}><UserCheck size={12} style={{ color: C.violet }} />Agent collecteur</span>
            <MultiSelect label="Agent collecteur" options={agentOptions} selected={selectedAgents} onChange={setAgents} highlight />
          </div>
          <button onClick={() => setAdvanced((a) => !a)} aria-expanded={advanced} style={{ ...btnGhost, height: 36 }}>
            <SlidersHorizontal size={13} /> Plus de filtres
            {chips.filter((c) => !c.key.startsWith('ag') && c.key !== 'q').length > 0 && <Pill bg={C.blue} tx="#fff">{chips.filter((c) => !c.key.startsWith('ag') && c.key !== 'q').length}</Pill>}
            <ChevronDown size={13} style={{ transform: advanced ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
          </button>
          {chips.length > 0 && <button onClick={resetFilters} style={{ ...btnGhost, height: 36, color: C.red }}><RotateCcw size={12} /> Réinitialiser</button>}
        </div>

        {advanced && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.surface}`, display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
            {isPush ? (
              <>
                <Field label="Zone"><MultiSelect label="Zone" options={opt.zones} selected={fp.zones} onChange={(v) => setFp((x) => ({ ...x, zones: v }))} /></Field>
                <Field label="Type de prospect"><MultiSelect label="Type de prospect" options={opt.pushTypes} selected={fp.types} onChange={(v) => setFp((x) => ({ ...x, types: v }))} /></Field>
                <Field label="Base"><MultiSelect label="Base" options={opt.bases} selected={fp.bases} onChange={(v) => setFp((x) => ({ ...x, bases: v }))} /></Field>
              </>
            ) : (
              <>
                <Field label="District"><MultiSelect label="District" options={opt.districts} selected={fs.districts} onChange={(v) => setFs((x) => ({ ...x, districts: v }))} /></Field>
                <Field label="Région"><MultiSelect label="Région" options={opt.regions} selected={fs.regions} onChange={(v) => setFs((x) => ({ ...x, regions: v }))} /></Field>
                <Field label="Commune"><MultiSelect label="Commune" options={opt.communes} selected={fs.communes} onChange={(v) => setFs((x) => ({ ...x, communes: v }))} /></Field>
                <Field label="Type de PDV"><MultiSelect label="Type de PDV" options={opt.posTypes} selected={fs.types} onChange={(v) => setFs((x) => ({ ...x, types: v }))} /></Field>
                <Field label="Statut"><MultiSelect label="Statut" options={opt.statuses} selected={fs.statuses} onChange={(v) => setFs((x) => ({ ...x, statuses: v }))} /></Field>
                <Field label="Branding"><TriSelect value={fs.branding} onChange={(v) => setFs((x) => ({ ...x, branding: v }))} labels={['Tous', 'Brandés', 'Non brandés']} /></Field>
              </>
            )}
            <Field label={isPush ? 'Date de vente : du' : 'Enregistrement : du'}><input type="date" style={inputStyle} value={f.start} max={f.end || undefined} onChange={(e) => (isPush ? setFp((x) => ({ ...x, start: e.target.value })) : setFs((x) => ({ ...x, start: e.target.value })))} /></Field>
            <Field label="au"><input type="date" style={inputStyle} value={f.end} min={f.start || undefined} onChange={(e) => (isPush ? setFp((x) => ({ ...x, end: e.target.value })) : setFs((x) => ({ ...x, end: e.target.value })))} /></Field>
            <Field label="Montant des ventes min. (FCFA)"><input type="number" min={0} style={inputStyle} value={f.minAmount} onChange={(e) => (isPush ? setFp((x) => ({ ...x, minAmount: e.target.value })) : setFs((x) => ({ ...x, minAmount: e.target.value })))} placeholder="0" /></Field>
            <Field label="Montant des ventes max. (FCFA)"><input type="number" min={0} style={inputStyle} value={f.maxAmount} onChange={(e) => (isPush ? setFp((x) => ({ ...x, maxAmount: e.target.value })) : setFs((x) => ({ ...x, maxAmount: e.target.value })))} placeholder="Illimité" /></Field>
            <Field label="Ventes"><TriSelect value={f.sales} onChange={(v) => (isPush ? setFp((x) => ({ ...x, sales: v })) : setFs((x) => ({ ...x, sales: v })))} labels={['Tous', 'Avec ventes', 'Sans vente']} /></Field>
            <Field label="Géolocalisation"><TriSelect value={f.gps} onChange={(v) => (isPush ? setFp((x) => ({ ...x, gps: v })) : setFs((x) => ({ ...x, gps: v })))} labels={['Tous', 'Avec GPS', 'Sans GPS']} /></Field>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.sub, marginRight: 4 }}>Période rapide</span>
              {([['7 jours', 7], ['30 jours', 30], ['90 jours', 90], ['Toute la période', null]] as [string, number | null][]).map(([label, days]) => (
                <button key={label} onClick={() => preset(days)} style={{ ...btnGhost, padding: '4px 12px', borderRadius: 99, fontSize: 11 }}>{label}</button>
              ))}
              {dateError && <span role="alert" style={{ fontSize: 11, color: C.red, marginLeft: 8 }}>{dateError}</span>}
            </div>
          </div>
        )}

        {chips.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
            {chips.map((c) => (
              <span key={c.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 4px 4px 10px', borderRadius: 99, background: c.key.startsWith('ag') ? C.violetBg : C.pale, border: `1px solid ${C.line}`, color: c.key.startsWith('ag') ? C.violet : C.blueD, fontSize: 11, fontWeight: 600 }}>
                {c.label}
                <button onClick={c.clear} aria-label={`Retirer le filtre ${c.label}`} style={{ width: 18, height: 18, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', color: C.red, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={11} /></button>
              </span>
            ))}
          </div>
        )}
        <p style={{ fontSize: 11, color: C.muted, marginTop: 10 }}>{fmtNum(isPush ? pushRows.length : posRows.length)} résultat{(isPush ? pushRows.length : posRows.length) > 1 ? 's' : ''} sur {fmtNum(totalAll)}</p>
      </div>

      {/* Performance par agent collecteur */}
      <Panel title="Performance par agent collecteur" icon={UserCheck}
        subtitle={`${isPush ? 'Prospects' : 'Points de vente'} collectés, avec les autres filtres appliqués. Cliquez sur un agent pour filtrer le tableau.`}
        right={<button onClick={() => setShowAgents((s) => !s)} style={{ ...btnGhost, padding: '4px 10px' }}>{showAgents ? 'Masquer' : 'Afficher'}</button>}>
        {showAgents && (agentRows.length === 0 ? <Empty icon={Users} title="Aucun agent" text="Aucune donnée avec les filtres actuels." /> : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ borderBottom: `1px solid ${C.lineL}` }}>
                  {['Agent', isPush ? 'Prospects' : 'PDV', '', 'Avec ventes', 'Montant des ventes', 'Dernière collecte'].map((h, i) => <th key={i} style={{ padding: '0 12px 10px 0', textAlign: i === 4 ? 'right' : 'left', fontSize: 11, fontWeight: 700, color: C.muted, whiteSpace: 'nowrap' }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {(allAgents ? agentRows : agentRows.slice(0, 6)).map((r) => {
                    const on = selectedAgents.includes(r.name);
                    return (
                      <tr key={r.name} className="pc-row" onClick={() => toggleAgent(r.name)} style={{ borderBottom: `1px solid ${C.surface}`, cursor: 'pointer', background: on ? C.pale : undefined }}>
                        <td style={{ padding: '9px 12px 9px 0' }}>
                          <button onClick={(e) => { e.stopPropagation(); toggleAgent(r.name); }} aria-pressed={on} aria-label={`Filtrer sur ${r.name}`} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}><AgentPill name={r.name} /></button>
                        </td>
                        <td style={{ padding: '9px 12px 9px 0', fontWeight: 700 }}>{fmtNum(r.count)}</td>
                        <td style={{ padding: '9px 12px 9px 0', width: 140 }}><div style={{ height: 6, borderRadius: 99, background: C.surface, overflow: 'hidden' }}><div style={{ width: `${(r.count / maxAgentCount) * 100}%`, height: '100%', background: C.blue }} /></div></td>
                        <td style={{ padding: '9px 12px 9px 0', color: C.sub }}>{fmtNum(r.withSales)} <span style={{ color: C.muted, fontSize: 11 }}>({Math.round((r.withSales / Math.max(r.count, 1)) * 100)} %)</span></td>
                        <td style={{ padding: '9px 12px 9px 0', textAlign: 'right', fontWeight: 700, color: C.blueD }}>{fmtMoney(r.amount)}</td>
                        <td style={{ padding: '9px 0', fontSize: 12, color: C.muted, whiteSpace: 'nowrap' }}>{fmtDay(r.last)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {agentRows.length > 6 && <button onClick={() => setAllAgents((a) => !a)} style={{ ...btnGhost, marginTop: 10 }}>{allAgents ? 'Réduire la liste' : `Voir les ${agentRows.length - 6} autres agents`}</button>}
          </>
        ))}
      </Panel>

      {/* Tableau */}
      <Panel title={isPush ? 'Prospects pushcart' : 'Points de vente'} icon={isPush ? Bike : Store}
        right={<span style={{ fontSize: 11, color: C.muted }}>Le CSV exporte la liste filtrée, avec l'agent collecteur et les coordonnées GPS</span>}>
        {isPush
          ? <DataTable<Purchase> data={pushRows} columns={pushColumns} exportName="prospects_pushcart" emptyMsg={purchases.length ? 'Aucun résultat' : 'Aucun prospect enregistré'} defaultSort={{ key: 'date', asc: false }} />
          : <DataTable<PurchasePOS> data={posRows} columns={posColumns} exportName="points_de_vente" emptyMsg={purchasesPOS.length ? 'Aucun résultat' : 'Aucun point de vente enregistré'} defaultSort={{ key: 'date', asc: false }} />}
        {chips.length > 0 && (isPush ? pushRows.length : posRows.length) === 0 && (
          <div style={{ textAlign: 'center' }}><button onClick={resetFilters} style={btn(C.blue)}>Réinitialiser les filtres</button></div>
        )}
      </Panel>

      {modal && <DetailsModal state={modal} onClose={() => setModal(null)} />}
    </div>
  );
};

export default PushcartManagement;