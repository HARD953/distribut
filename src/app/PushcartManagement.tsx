"use client";
import React, { useState, useEffect } from 'react';
import {
  Filter, Search, MapPin, Calendar, User, Phone,
  DollarSign, Package, BarChart3, ChevronDown, ChevronUp,
  Download, Eye, X, RefreshCw,
  Users, Target, ArrowUpRight, ShoppingCart, Bike,
  Store, Building, AlertCircle, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { apiService } from './ApiService';

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
interface Purchase {
  id: number;
  full_name: string;
  first_name: string;
  last_name: string;
  zone: string;
  vendor: number;
  purchase_date: string;
  base: string;
  pushcard_type: string;
  phone: string;
  latitude: number;
  longitude: number;
  total_sales_amount: string;
  total_sales_quantity: number;
  sales_count: number;
  total_products: number;
  total_variants: number;
  average_sale_amount: number;
  created_at: string;
}

interface PurchasePOS {
  id: number;
  name: string;
  owner: string;
  phone: string;
  email: string;
  address: string;
  latitude: number;
  longitude: number;
  total_sales_amount: string;
  total_sales_quantity: number;
  sales_count: number;
  total_products: number;
  total_variants: number;
  average_sale_amount: number;
  district: string;
  region: string;
  commune: string;
  type: string;
  status: string;
  registration_date: string;
  turnover: string;
  monthly_orders: number;
  evaluation_score: number;
  created_at: string;
  updated_at: string;
  user: number;
  avatar: string;
  brander: boolean;
  marque_brander: string | null;
}

interface SaleDetail {
  id: number;
  product_variant: {
    id: number;
    product: { id: number; name: string; sku: string; category: number; status: string };
    format: { id: number; name: string; description: string };
    current_stock: number;
    price: string;
    barcode: string;
  };
  quantity: number;
  total_amount: string;
  unit_price: number;
  created_at: string;
  vendor: string;
  latitude?: number;
  longitude?: number;
}

interface SaleStatistics {
  grand_total_amount: number;
  grand_total_quantity: number;
  total_products: number;
  total_variants: number;
  average_price: number;
}

interface PurchaseDetails {
  purchase: { id: number; full_name: string; zone: string; purchase_date?: string; vendor: string };
  sales: SaleDetail[];
  statistics: SaleStatistics;
}

type TabType = 'pushcart' | 'pos';

/* ─────────────────────────────────────────────
   PALETTE (calquée sur LoginPage)
───────────────────────────────────────────── */
const P = {
  forest:      '#2D5A3D',
  forestLight: '#3E7A54',
  forestPale:  '#EAF2EC',
  ocre:        '#C07A2F',
  ocreLight:   '#D4A843',
  ocrePale:    '#FFF3E8',
  gold:        '#F0C878',
  cream:       '#FAF7F0',
  sand:        '#F2EDE0',
  sandBorder:  '#E8D9B8',
  sandMid:     '#D4C4A0',
  ink:         '#2A1A08',
  muted:       '#A89880',
  mutedDark:   '#7A6A52',
  white:       '#FFFFFF',
};

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const fmt = (n: string | number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(Number(n));

const fmtDate = (d: string) =>
  new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d));

const fmtDateShort = (d: string) =>
  new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d));

/* ─────────────────────────────────────────────
   MICRO-COMPONENTS
───────────────────────────────────────────── */
const Badge = ({ label, color }: { label: string; color: 'green' | 'red' | 'amber' | 'gray' | 'blue' }) => {
  const styles: Record<string, React.CSSProperties> = {
    green: { background: P.forestPale, color: P.forest,  border: `1px solid #C4DCCA` },
    red:   { background: '#FCECEA',    color: '#9A1F1F',  border: '1px solid #F5C2C2' },
    amber: { background: P.ocrePale,   color: '#9A5E1A',  border: `1px solid #E8C090` },
    gray:  { background: P.sand,       color: P.mutedDark,border: `1px solid ${P.sandBorder}` },
    blue:  { background: '#EAF1FB',    color: '#185FA5',  border: '1px solid #B5D4F4' },
  };
  return (
    <span style={{
      ...styles[color],
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 10px', borderRadius: 999,
      fontSize: 11, fontWeight: 600,
    }}>
      {label}
    </span>
  );
};

const StatCard = ({ icon, label, value, sub, accentBg, accentIcon }: {
  icon: React.ReactNode; label: string; value: React.ReactNode;
  sub?: React.ReactNode; accentBg: string; accentIcon: string;
}) => (
  <div style={{
    background: P.white, borderRadius: 16,
    border: `1.5px solid ${P.sandBorder}`,
    padding: '20px', display: 'flex', flexDirection: 'column', gap: 12,
    transition: 'border-color .15s',
  }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: P.mutedDark, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{label}</p>
        <p style={{ fontSize: 22, fontWeight: 700, color: P.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</p>
      </div>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 12, color: accentIcon }}>
        {icon}
      </div>
    </div>
    {sub && (
      <div style={{ borderTop: `1px solid ${P.sand}`, paddingTop: 10 }}>{sub}</div>
    )}
  </div>
);

const inputStyle: React.CSSProperties = {
  width: '100%', height: 40,
  padding: '0 14px',
  background: P.sand,
  border: `1.5px solid ${P.sandMid}`,
  borderRadius: 12,
  color: P.ink, fontSize: 13.5,
  fontFamily: 'inherit',
  outline: 'none',
  transition: 'border .15s, background .15s, box-shadow .15s',
  boxSizing: 'border-box',
};

const InputField = ({ value, onChange, placeholder, type = 'text', style = {} }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; style?: React.CSSProperties;
}) => (
  <input
    type={type} value={value} placeholder={placeholder}
    onChange={e => onChange(e.target.value)}
    style={{ ...inputStyle, ...style }}
    onFocus={e => { e.currentTarget.style.background = P.white; e.currentTarget.style.borderColor = P.forest; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(45,90,61,.10)`; }}
    onBlur={e => { e.currentTarget.style.background = P.sand; e.currentTarget.style.borderColor = P.sandMid; e.currentTarget.style.boxShadow = 'none'; }}
  />
);

const SelectField = ({ value, onChange, children }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode;
}) => (
  <select
    value={value} onChange={e => onChange(e.target.value)}
    style={{ ...inputStyle, cursor: 'pointer' }}
    onFocus={e => { e.currentTarget.style.background = P.white; e.currentTarget.style.borderColor = P.forest; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(45,90,61,.10)`; }}
    onBlur={e => { e.currentTarget.style.background = P.sand; e.currentTarget.style.borderColor = P.sandMid; e.currentTarget.style.boxShadow = 'none'; }}
  >
    {children}
  </select>
);

const LabelBlock = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: P.mutedDark, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{label}</label>
    {children}
  </div>
);

/* ─────────────────────────────────────────────
   FILTER PANEL
───────────────────────────────────────────── */
const FilterPanel = ({ activeTab, filters, filtersPOS, zones, pushcardTypes, districts, regions, communes, posTypes, statuses, setFilters, setFiltersPOS, onReset, onResetPOS }: any) => (
  <div style={{ padding: '20px 24px', borderBottom: `1px solid ${P.sandBorder}`, background: P.cream }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
      {activeTab === 'pushcart' ? (
        <>
          <LabelBlock label="Zone">
            <SelectField value={filters.zone} onChange={v => setFilters((p: any) => ({ ...p, zone: v }))}>
              <option value="">Toutes les zones</option>
              {zones.map((z: string) => <option key={z} value={z}>{z}</option>)}
            </SelectField>
          </LabelBlock>
          <LabelBlock label="Type de prospect">
            <SelectField value={filters.pushcard_type} onChange={v => setFilters((p: any) => ({ ...p, pushcard_type: v }))}>
              <option value="">Tous les types</option>
              {pushcardTypes.map((t: string) => <option key={t} value={t}>{t}</option>)}
            </SelectField>
          </LabelBlock>
          <LabelBlock label="Commercial (ID)">
            <InputField value={filters.vendor} onChange={v => setFilters((p: any) => ({ ...p, vendor: v }))} placeholder="Ex : 42" />
          </LabelBlock>
          <LabelBlock label="Date de début">
            <InputField type="date" value={filters.start_date} onChange={v => setFilters((p: any) => ({ ...p, start_date: v }))} />
          </LabelBlock>
          <LabelBlock label="Date de fin">
            <InputField type="date" value={filters.end_date} onChange={v => setFilters((p: any) => ({ ...p, end_date: v }))} />
          </LabelBlock>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button onClick={onReset} style={{ height: 40, padding: '0 18px', borderRadius: 12, border: `1.5px solid ${P.sandMid}`, background: P.sand, color: P.mutedDark, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Réinitialiser
            </button>
          </div>
        </>
      ) : (
        <>
          <LabelBlock label="District">
            <SelectField value={filtersPOS.district} onChange={v => setFiltersPOS((p: any) => ({ ...p, district: v }))}>
              <option value="">Tous les districts</option>
              {districts.map((d: string) => <option key={d} value={d}>{d}</option>)}
            </SelectField>
          </LabelBlock>
          <LabelBlock label="Région">
            <SelectField value={filtersPOS.region} onChange={v => setFiltersPOS((p: any) => ({ ...p, region: v }))}>
              <option value="">Toutes les régions</option>
              {regions.map((r: string) => <option key={r} value={r}>{r}</option>)}
            </SelectField>
          </LabelBlock>
          <LabelBlock label="Commune">
            <SelectField value={filtersPOS.commune} onChange={v => setFiltersPOS((p: any) => ({ ...p, commune: v }))}>
              <option value="">Toutes les communes</option>
              {communes.map((c: string) => <option key={c} value={c}>{c}</option>)}
            </SelectField>
          </LabelBlock>
          <LabelBlock label="Type">
            <SelectField value={filtersPOS.type} onChange={v => setFiltersPOS((p: any) => ({ ...p, type: v }))}>
              <option value="">Tous les types</option>
              {posTypes.map((t: string) => <option key={t} value={t}>{t}</option>)}
            </SelectField>
          </LabelBlock>
          <LabelBlock label="Statut">
            <SelectField value={filtersPOS.status} onChange={v => setFiltersPOS((p: any) => ({ ...p, status: v }))}>
              <option value="">Tous les statuts</option>
              {statuses.map((s: string) => <option key={s} value={s}>{s}</option>)}
            </SelectField>
          </LabelBlock>
          <LabelBlock label="Date début">
            <InputField type="date" value={filtersPOS.start_date} onChange={v => setFiltersPOS((p: any) => ({ ...p, start_date: v }))} />
          </LabelBlock>
          <LabelBlock label="Date fin">
            <InputField type="date" value={filtersPOS.end_date} onChange={v => setFiltersPOS((p: any) => ({ ...p, end_date: v }))} />
          </LabelBlock>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button onClick={onResetPOS} style={{ height: 40, padding: '0 18px', borderRadius: 12, border: `1.5px solid ${P.sandMid}`, background: P.sand, color: P.mutedDark, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Réinitialiser
            </button>
          </div>
        </>
      )}
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   DETAIL MODAL
───────────────────────────────────────────── */
const DetailsModal = ({ details, loading, activeTab, selectedPurchase, onClose }: {
  details: PurchaseDetails | null;
  loading: boolean;
  activeTab: TabType;
  selectedPurchase: Purchase | PurchasePOS | null;
  onClose: () => void;
}) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(42,26,8,.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
    <div style={{ background: P.white, borderRadius: 20, boxShadow: '0 24px 64px rgba(42,26,8,.18)', maxWidth: 900, width: '100%', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {/* Kente top band */}
      <div style={{ height: 3, background: `linear-gradient(90deg,${P.ocre} 0%,${P.gold} 40%,${P.ocre} 100%)`, flexShrink: 0 }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: `1px solid ${P.sandBorder}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: P.forestPale, display: 'flex', alignItems: 'center', justifyContent: 'center', color: P.forest }}>
            {activeTab === 'pushcart' ? <Bike size={17} /> : <Store size={17} />}
          </div>
          <div>
            <h2 style={{ fontWeight: 700, color: P.ink, fontSize: 17, margin: 0 }}>Détails de la vente</h2>
            {details && <p style={{ fontSize: 12, color: P.muted, margin: 0 }}>#{details.purchase.id}</p>}
          </div>
        </div>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: `1.5px solid ${P.sandBorder}`, background: P.sand, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: P.muted }}>
          <X size={16} />
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: `2.5px solid ${P.forest}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ fontSize: 13, color: P.muted }}>Chargement…</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : details ? (
        <div style={{ overflowY: 'auto', flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Info cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: P.sand, borderRadius: 14, border: `1px solid ${P.sandBorder}`, padding: 18 }}>
              <h3 style={{ fontSize: 10, fontWeight: 700, color: P.mutedDark, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <User size={11} /> {activeTab === 'pushcart' ? 'Client' : 'Point de vente'}
              </h3>
              <p style={{ fontWeight: 600, color: P.ink, fontSize: 15, marginBottom: 6 }}>{details.purchase.full_name}</p>
              <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: P.muted, marginBottom: 4 }}><MapPin size={11} />{details.purchase.zone}</p>
              {activeTab === 'pos' && selectedPurchase && (
                <>
                  <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: P.muted, marginBottom: 4 }}><Phone size={11} />{(selectedPurchase as PurchasePOS).phone}</p>
                  <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: P.muted }}><Users size={11} />{(selectedPurchase as PurchasePOS).owner}</p>
                </>
              )}
              {activeTab === 'pushcart' && details.purchase.purchase_date && (
                <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: P.muted }}><Calendar size={11} />{fmtDate(details.purchase.purchase_date)}</p>
              )}
            </div>
            <div style={{ background: P.forestPale, borderRadius: 14, border: '1px solid #C4DCCA', padding: 18 }}>
              <h3 style={{ fontSize: 10, fontWeight: 700, color: P.forest, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <BarChart3 size={11} /> Résumé
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Montant total', val: fmt(details.statistics.grand_total_amount) },
                  { label: 'Quantité',       val: details.statistics.grand_total_quantity },
                  { label: 'Produits',        val: details.statistics.total_products },
                  { label: 'Variantes',       val: details.statistics.total_variants },
                ].map(s => (
                  <div key={s.label} style={{ background: P.white, borderRadius: 10, padding: 12, border: '1px solid #C4DCCA' }}>
                    <p style={{ fontSize: 11, color: P.muted, marginBottom: 3 }}>{s.label}</p>
                    <p style={{ fontWeight: 700, fontSize: 14, color: P.ink }}>{s.val}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Products table */}
          <div>
            <h3 style={{ fontSize: 10, fontWeight: 700, color: P.mutedDark, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Package size={11} /> Produits vendus
            </h3>
            <div style={{ background: P.white, borderRadius: 14, border: `1px solid ${P.sandBorder}`, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ minWidth: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: P.sand, borderBottom: `1px solid ${P.sandBorder}` }}>
                      {['Produit', 'Format', 'Prix unit.', 'Qté', 'Total', 'Date'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: P.mutedDark, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {details.sales.map((sale, i) => (
                      <tr key={sale.id} style={{ borderBottom: i < details.sales.length - 1 ? `1px solid ${P.cream}` : 'none' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <p style={{ fontWeight: 600, color: P.ink, marginBottom: 2 }}>{sale.product_variant.product.name}</p>
                          <p style={{ fontSize: 11, color: P.muted }}>SKU: {sale.product_variant.product.sku}</p>
                        </td>
                        <td style={{ padding: '12px 16px', color: P.ink, fontWeight: 500 }}>{sale.product_variant.format.name}</td>
                        <td style={{ padding: '12px 16px', color: P.mutedDark }}>{fmt(sale.unit_price)}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '2px 10px', background: P.forestPale, color: P.forest, borderRadius: 999, fontSize: 12, fontWeight: 700 }}>{sale.quantity}</span>
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: P.forest }}>{fmt(sale.total_amount)}</td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: P.muted, whiteSpace: 'nowrap' }}>{fmtDateShort(sale.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div style={{ padding: '14px 24px', borderTop: `1px solid ${P.sandBorder}`, display: 'flex', justifyContent: 'flex-end', background: P.cream, flexShrink: 0 }}>
        <button onClick={onClose} style={{ height: 38, padding: '0 20px', borderRadius: 12, border: `1.5px solid ${P.sandMid}`, background: P.white, color: P.mutedDark, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          Fermer
        </button>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   PAGINATION
───────────────────────────────────────────── */
const Pagination = ({ current, total, from, to, count, onPrev, onNext, onGo, perPage, onPerPage }: {
  current: number; total: number; from: number; to: number; count: number;
  onPrev: () => void; onNext: () => void; onGo: (n: number) => void;
  perPage: number; onPerPage: (n: number) => void;
}) => {
  const pages: number[] = [];
  const max = 5;
  let start = Math.max(1, current - Math.floor(max / 2));
  let end = Math.min(total, start + max - 1);
  if (end - start + 1 < max) start = Math.max(1, end - max + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  const btnBase: React.CSSProperties = { height: 32, minWidth: 32, borderRadius: 8, border: `1.5px solid ${P.sandBorder}`, background: P.white, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: P.mutedDark, fontFamily: 'inherit', transition: 'all .12s' };

  return (
    <div style={{ padding: '14px 20px', background: P.cream, borderTop: `1px solid ${P.sandBorder}`, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12, color: P.muted }}>{from}–{to} sur <strong style={{ color: P.ink }}>{count}</strong></span>
        <select value={perPage} onChange={e => onPerPage(+e.target.value)}
          style={{ height: 30, padding: '0 10px', borderRadius: 8, border: `1.5px solid ${P.sandBorder}`, background: P.white, fontSize: 12, color: P.mutedDark, fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}>
          {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n} / page</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={onPrev} disabled={current === 1} style={{ ...btnBase, opacity: current === 1 ? 0.4 : 1 }}><ChevronLeft size={13} /></button>
        {pages.map(n => (
          <button key={n} onClick={() => onGo(n)} style={{ ...btnBase, background: n === current ? P.forest : P.white, color: n === current ? P.white : P.mutedDark, border: n === current ? `1.5px solid ${P.forest}` : `1.5px solid ${P.sandBorder}` }}>
            {n}
          </button>
        ))}
        <button onClick={onNext} disabled={current === total} style={{ ...btnBase, opacity: current === total ? 0.4 : 1 }}><ChevronRight size={13} /></button>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const PushcartManagement = () => {
  const [activeTab, setActiveTab]                 = useState<TabType>('pushcart');
  const [purchases, setPurchases]                 = useState<Purchase[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([]);
  const [purchasesPOS, setPurchasesPOS]           = useState<PurchasePOS[]>([]);
  const [filteredPurchasesPOS, setFilteredPurchasesPOS] = useState<PurchasePOS[]>([]);
  const [selectedPurchase, setSelectedPurchase]   = useState<Purchase | PurchasePOS | null>(null);
  const [purchaseDetails, setPurchaseDetails]     = useState<PurchaseDetails | null>(null);
  const [loading, setLoading]                     = useState(true);
  const [detailsLoading, setDetailsLoading]       = useState(false);
  const [error, setError]                         = useState<string | null>(null);
  const [showFilters, setShowFilters]             = useState(false);
  const [showDetailsModal, setShowDetailsModal]   = useState(false);

  const [filters, setFilters]       = useState({ search: '', zone: '', pushcard_type: '', start_date: '', end_date: '', vendor: '' });
  const [filtersPOS, setFiltersPOS] = useState({ search: '', district: '', region: '', commune: '', type: '', status: '', start_date: '', end_date: '' });

  const [currentPage, setCurrentPage]       = useState(1);
  const [currentPagePOS, setCurrentPagePOS] = useState(1);
  const [itemsPerPage, setItemsPerPage]     = useState(10);

  const [zones, setZones]               = useState<string[]>([]);
  const [pushcardTypes, setPushcardTypes] = useState<string[]>([]);
  const [districts, setDistricts]       = useState<string[]>([]);
  const [regions, setRegions]           = useState<string[]>([]);
  const [communes, setCommunes]         = useState<string[]>([]);
  const [posTypes, setPosTypes]         = useState<string[]>([]);
  const [statuses, setStatuses]         = useState<string[]>([]);

  /* ── Pagination ── */
  const iPP = itemsPerPage;
  const pc = filteredPurchases, pp = filteredPurchasesPOS;
  const from  = (currentPage    - 1) * iPP + 1, to  = Math.min(currentPage    * iPP, pc.length);
  const fromP = (currentPagePOS - 1) * iPP + 1, toP = Math.min(currentPagePOS * iPP, pp.length);
  const totalPagesPC  = Math.max(1, Math.ceil(pc.length / iPP));
  const totalPagesPOS = Math.max(1, Math.ceil(pp.length / iPP));
  const currentItems    = pc.slice((currentPage    - 1) * iPP, currentPage    * iPP);
  const currentItemsPOS = pp.slice((currentPagePOS - 1) * iPP, currentPagePOS * iPP);

  /* ── API ── */
  const fetchPurchases = async () => {
    try {
      setLoading(true); setError(null);
      const res = await apiService.get('/purchasedata/');
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      const data: Purchase[] = await res.json();
      setPurchases(data);
      setZones(Array.from(new Set(data.map(p => p.zone))).filter(Boolean));
      setPushcardTypes(Array.from(new Set(data.map(p => p.pushcard_type))).filter(Boolean));
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const fetchPurchasesPOS = async () => {
    try {
      setLoading(true); setError(null);
      const res = await apiService.get('/purchasedatapos/');
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      const data: PurchasePOS[] = await res.json();
      setPurchasesPOS(data);
      setDistricts(Array.from(new Set(data.map(p => p.district))).filter(Boolean));
      setRegions(Array.from(new Set(data.map(p => p.region))).filter(Boolean));
      setCommunes(Array.from(new Set(data.map(p => p.commune))).filter(Boolean));
      setPosTypes(Array.from(new Set(data.map(p => p.type))).filter(Boolean));
      setStatuses(Array.from(new Set(data.map(p => p.status))).filter(Boolean));
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const fetchDetails = async (id: number) => {
    try {
      setDetailsLoading(true);
      const url = activeTab === 'pushcart' ? `/purchasedata/${id}/sales_details/` : `/purchasedatapos/${id}/sales_details/`;
      const res = await apiService.get(url);
      if (!res.ok) throw new Error('Erreur de chargement');
      setPurchaseDetails(await res.json());
      setShowDetailsModal(true);
    } catch (e: any) { setError(e.message); }
    finally { setDetailsLoading(false); }
  };

  /* ── Filters ── */
  useEffect(() => {
    let r = purchases;
    if (filters.search) { const s = filters.search.toLowerCase(); r = r.filter(p => p.full_name.toLowerCase().includes(s) || p.zone.toLowerCase().includes(s) || p.phone.includes(s) || p.base.toLowerCase().includes(s)); }
    if (filters.zone) r = r.filter(p => p.zone === filters.zone);
    if (filters.pushcard_type) r = r.filter(p => p.pushcard_type === filters.pushcard_type);
    if (filters.vendor) r = r.filter(p => p.vendor.toString() === filters.vendor);
    if (filters.start_date) r = r.filter(p => new Date(p.purchase_date) >= new Date(filters.start_date));
    if (filters.end_date) { const d = new Date(filters.end_date); d.setHours(23,59,59); r = r.filter(p => new Date(p.purchase_date) <= d); }
    setFilteredPurchases(r); setCurrentPage(1);
  }, [filters, purchases]);

  useEffect(() => {
    let r = purchasesPOS;
    if (filtersPOS.search) { const s = filtersPOS.search.toLowerCase(); r = r.filter(p => p.name.toLowerCase().includes(s) || p.owner.toLowerCase().includes(s) || p.address.toLowerCase().includes(s) || p.phone.includes(s)); }
    if (filtersPOS.district) r = r.filter(p => p.district === filtersPOS.district);
    if (filtersPOS.region)   r = r.filter(p => p.region   === filtersPOS.region);
    if (filtersPOS.commune)  r = r.filter(p => p.commune  === filtersPOS.commune);
    if (filtersPOS.type)     r = r.filter(p => p.type     === filtersPOS.type);
    if (filtersPOS.status)   r = r.filter(p => p.status   === filtersPOS.status);
    if (filtersPOS.start_date) r = r.filter(p => new Date(p.registration_date) >= new Date(filtersPOS.start_date));
    if (filtersPOS.end_date) { const d = new Date(filtersPOS.end_date); d.setHours(23,59,59); r = r.filter(p => new Date(p.registration_date) <= d); }
    setFilteredPurchasesPOS(r); setCurrentPagePOS(1);
  }, [filtersPOS, purchasesPOS]);

  useEffect(() => { fetchPurchases(); fetchPurchasesPOS(); }, []);

  /* ── Export ── */
  const exportData = () => {
    const rows = activeTab === 'pushcart'
      ? [['Nom','Zone','Base','Type','Téléphone','Date','Montant','Quantité'], ...filteredPurchases.map(p => [p.full_name, p.zone, p.base, p.pushcard_type, p.phone, fmtDate(p.purchase_date), p.total_sales_amount, p.total_sales_quantity])]
      : [['Nom','Propriétaire','Téléphone','Email','Adresse','District','Région','Type','Statut','CA'], ...filteredPurchasesPOS.map(p => [p.name, p.owner, p.phone, p.email, p.address, p.district, p.region, p.type, p.status, p.turnover])];
    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `${activeTab}_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  /* ── Stats ── */
  const totalSales    = purchases.reduce((s, p) => s + Number(p.total_sales_amount), 0);
  const totalSalesPOS = purchasesPOS.reduce((s, p) => s + Number(p.total_sales_amount), 0);
  const totalTurnover = purchasesPOS.reduce((s, p) => s + Number(p.turnover), 0);
  const activeFiltersCount = activeTab === 'pushcart'
    ? Object.values(filters).filter(Boolean).length
    : Object.values(filtersPOS).filter(Boolean).length;

  const isFiltered = activeTab === 'pushcart' ? filteredPurchases.length === 0 : filteredPurchasesPOS.length === 0;

  /* ── Render ── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 4 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: P.ink, letterSpacing: '-0.02em', marginBottom: 4 }}>Gestion des Prospects</h1>
          <p style={{ fontSize: 13, color: P.muted }}>Suivi et analyse des ventes ambulantes et points de vente</p>
          {/* Kente accent */}
          <div style={{ marginTop: 10, width: 40, height: 3, borderRadius: 2, background: `linear-gradient(90deg,${P.ocre},${P.gold})` }} />
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{ background: P.sand, borderRadius: 14, padding: 5, display: 'inline-flex', gap: 4, border: `1.5px solid ${P.sandBorder}` }}>
        {([
          { key: 'pushcart', label: 'Prospects Pushcart', icon: <Bike size={14} /> },
          { key: 'pos',      label: 'Points de vente',    icon: <Store size={14} /> },
        ] as { key: TabType; label: string; icon: React.ReactNode }[]).map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all .15s',
              background: activeTab === t.key ? P.forest : 'transparent',
              color: activeTab === t.key ? P.white : P.mutedDark,
              boxShadow: activeTab === t.key ? '0 2px 8px rgba(45,90,61,.20)' : 'none',
            }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <StatCard
          icon={<DollarSign size={17} />} label="Total ventes"
          value={fmt(activeTab === 'pushcart' ? totalSales : totalSalesPOS)}
          accentBg={P.forestPale} accentIcon={P.forest}
          sub={<span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: P.forest, fontWeight: 600 }}><ArrowUpRight size={11} />+12% ce mois</span>}
        />
        <StatCard
          icon={activeTab === 'pushcart' ? <ShoppingCart size={17} /> : <Store size={17} />}
          label={activeTab === 'pushcart' ? 'Nombre de ventes' : 'Points de vente'}
          value={activeTab === 'pushcart' ? purchases.length : purchasesPOS.length}
          accentBg={P.ocrePale} accentIcon={P.ocre}
          sub={<span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: P.ocre, fontWeight: 600 }}><ArrowUpRight size={11} />+8% ce mois</span>}
        />
        <StatCard
          icon={<MapPin size={17} />}
          label={activeTab === 'pushcart' ? 'Zones couvertes' : 'Régions couvertes'}
          value={activeTab === 'pushcart' ? zones.length : regions.length}
          accentBg={P.forestPale} accentIcon={P.forest}
          sub={<span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: P.forest, fontWeight: 600 }}><Target size={11} />+2 nouvelles</span>}
        />
        <StatCard
          icon={activeTab === 'pushcart' ? <Bike size={17} /> : <Building size={17} />}
          label={activeTab === 'pushcart' ? 'Types de prospects' : "Chiffre d'affaires"}
          value={activeTab === 'pushcart' ? pushcardTypes.length : fmt(totalTurnover)}
          accentBg={P.ocrePale} accentIcon={P.ocre}
          sub={<span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: P.muted, fontWeight: 600 }}><Users size={11} />Stable ce mois</span>}
        />
      </div>

      {/* Error */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 18px', background: '#FFF0F0', border: '1.5px solid #F7C1C1', borderRadius: 14, fontSize: 13 }}>
          <AlertCircle size={15} style={{ color: '#A32D2D', marginTop: 1, flexShrink: 0 }} />
          <span style={{ color: '#A32D2D', flex: 1 }}>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A32D2D' }}><X size={15} /></button>
        </div>
      )}

      {/* Table card */}
      <div style={{ background: P.white, borderRadius: 18, border: `1.5px solid ${P.sandBorder}`, overflow: 'hidden' }}>

        {/* Kente accent top */}
        <div style={{ height: 3, background: `linear-gradient(90deg,${P.forest} 0%,${P.ocre} 50%,${P.forest} 100%)`, opacity: 0.7 }} />

        {/* Toolbar */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${P.sandBorder}`, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 340 }}>
            <Search size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: P.muted, pointerEvents: 'none' }} />
            <InputField
              value={activeTab === 'pushcart' ? filters.search : filtersPOS.search}
              onChange={v => activeTab === 'pushcart' ? setFilters(p => ({ ...p, search: v })) : setFiltersPOS(p => ({ ...p, search: v }))}
              placeholder={activeTab === 'pushcart' ? 'Rechercher client, zone…' : 'Rechercher PDV, propriétaire…'}
              style={{ paddingLeft: 38 }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '0 14px', height: 36, borderRadius: 10, fontSize: 12, fontWeight: 600,
                border: `1.5px solid ${showFilters || activeFiltersCount > 0 ? P.forest : P.sandBorder}`,
                background: showFilters || activeFiltersCount > 0 ? P.forest : P.white,
                color: showFilters || activeFiltersCount > 0 ? P.white : P.mutedDark,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
              }}>
              <Filter size={12} /> Filtres
              {activeFiltersCount > 0 && (
                <span style={{ background: 'rgba(255,255,255,.28)', color: P.white, fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 999 }}>{activeFiltersCount}</span>
              )}
              {showFilters ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            <button onClick={exportData} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', height: 36, borderRadius: 10, fontSize: 12, fontWeight: 600, border: `1.5px solid ${P.sandBorder}`, background: P.white, color: P.mutedDark, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Download size={12} /> CSV
            </button>
            <button onClick={activeTab === 'pushcart' ? fetchPurchases : fetchPurchasesPOS} title="Actualiser"
              style={{ width: 36, height: 36, borderRadius: 10, border: `1.5px solid ${P.sandBorder}`, background: P.white, color: P.mutedDark, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        {showFilters && (
          <FilterPanel
            activeTab={activeTab} filters={filters} filtersPOS={filtersPOS}
            zones={zones} pushcardTypes={pushcardTypes}
            districts={districts} regions={regions} communes={communes} posTypes={posTypes} statuses={statuses}
            setFilters={setFilters} setFiltersPOS={setFiltersPOS}
            onReset={() => setFilters({ search: '', zone: '', pushcard_type: '', start_date: '', end_date: '', vendor: '' })}
            onResetPOS={() => setFiltersPOS({ search: '', district: '', region: '', commune: '', type: '', status: '', start_date: '', end_date: '' })}
          />
        )}

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: `2.5px solid ${P.forest}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ fontSize: 13, color: P.muted }}>Chargement…</p>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : isFiltered ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: P.sand, border: `1.5px solid ${P.sandBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: P.muted }}>
              <Search size={20} />
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: P.ink, marginBottom: 6 }}>Aucun résultat</p>
            <p style={{ fontSize: 12, color: P.muted, maxWidth: 280 }}>
              {activeFiltersCount > 0 ? 'Aucune donnée ne correspond à vos filtres.' : 'Aucune donnée enregistrée.'}
            </p>
            {activeFiltersCount > 0 && (
              <button
                onClick={activeTab === 'pushcart'
                  ? () => setFilters({ search: '', zone: '', pushcard_type: '', start_date: '', end_date: '', vendor: '' })
                  : () => setFiltersPOS({ search: '', district: '', region: '', commune: '', type: '', status: '', start_date: '', end_date: '' })}
                style={{ marginTop: 16, padding: '8px 18px', fontSize: 12, fontWeight: 600, color: P.forest, background: P.forestPale, border: '1.5px solid #C4DCCA', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit' }}>
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ minWidth: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: P.cream, borderBottom: `1px solid ${P.sandBorder}` }}>
                    {(activeTab === 'pushcart'
                      ? ['Client', 'Zone & Base', 'Commercial', 'Contact', 'Ventes', 'Date', '']
                      : ['Point de vente', 'Propriétaire', 'Localisation', 'Type / Statut', 'Ventes', 'Enregistrement', '']
                    ).map(h => (
                      <th key={h} style={{ padding: '12px 18px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: P.mutedDark, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeTab === 'pushcart'
                    ? currentItems.map((p, i) => (
                        <tr key={p.id} style={{ borderBottom: i < currentItems.length - 1 ? `1px solid ${P.cream}` : 'none' }}
                          onMouseEnter={e => (e.currentTarget.style.background = P.cream)}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <td style={{ padding: '14px 18px' }}>
                            <p style={{ fontWeight: 600, color: P.ink, marginBottom: 2 }}>{p.full_name}</p>
                            <span style={{ fontSize: 11, color: P.muted }}>{p.pushcard_type}</span>
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: P.ink }}><MapPin size={11} style={{ color: P.ocre, flexShrink: 0 }} />{p.zone}</div>
                            <p style={{ fontSize: 11, color: P.muted, marginTop: 3 }}>{p.base}</p>
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: P.mutedDark, background: P.sand, border: `1px solid ${P.sandBorder}`, padding: '2px 10px', borderRadius: 999 }}>#{p.vendor}</span>
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: P.ink }}><Phone size={11} style={{ color: P.forest }} />{p.phone}</div>
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <p style={{ fontWeight: 700, color: P.forest }}>{fmt(p.total_sales_amount)}</p>
                            <p style={{ fontSize: 11, color: P.muted, marginTop: 2 }}>{p.total_sales_quantity} unités</p>
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <p style={{ color: P.ink }}>{fmtDateShort(p.purchase_date)}</p>
                            <p style={{ fontSize: 11, color: P.muted, marginTop: 2 }}>{new Date(p.purchase_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <button
                              onClick={() => { setSelectedPurchase(p); fetchDetails(p.id); }}
                              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', fontSize: 11, fontWeight: 600, color: P.forest, background: P.forestPale, border: '1px solid #C4DCCA', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                              <Eye size={12} /> Détails
                            </button>
                          </td>
                        </tr>
                      ))
                    : currentItemsPOS.map((p, i) => (
                        <tr key={p.id} style={{ borderBottom: i < currentItemsPOS.length - 1 ? `1px solid ${P.cream}` : 'none' }}
                          onMouseEnter={e => (e.currentTarget.style.background = P.cream)}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <td style={{ padding: '14px 18px' }}>
                            <p style={{ fontWeight: 600, color: P.ink, marginBottom: 2 }}>{p.name}</p>
                            <p style={{ fontSize: 11, color: P.muted }}>{p.email}</p>
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <p style={{ fontWeight: 500, color: P.ink, marginBottom: 3 }}>{p.owner}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: P.muted }}><Phone size={10} />{p.phone}</div>
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: P.ink }}><MapPin size={11} style={{ color: P.ocre, flexShrink: 0 }} /><span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.address}</span></div>
                            <p style={{ fontSize: 11, color: P.muted, marginTop: 3 }}>{p.commune}, {p.district}</p>
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <p style={{ fontWeight: 500, color: P.ink, textTransform: 'capitalize', marginBottom: 5 }}>{p.type}</p>
                            <Badge label={p.status} color={p.status === 'actif' ? 'green' : 'red'} />
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <p style={{ fontWeight: 700, color: P.forest }}>{fmt(p.total_sales_amount)}</p>
                            <p style={{ fontSize: 11, color: P.muted, marginTop: 2 }}>{p.monthly_orders} cmd/mois</p>
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <p style={{ color: P.ink }}>{fmtDateShort(p.registration_date)}</p>
                            <p style={{ fontSize: 11, color: P.muted, marginTop: 2 }}>CA : {fmt(p.turnover)}</p>
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <button
                              onClick={() => { setSelectedPurchase(p); fetchDetails(p.id); }}
                              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', fontSize: 11, fontWeight: 600, color: P.forest, background: P.forestPale, border: '1px solid #C4DCCA', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                              <Eye size={12} /> Détails
                            </button>
                          </td>
                        </tr>
                      ))
                  }
                </tbody>
              </table>
            </div>

            <Pagination
              current={activeTab === 'pushcart' ? currentPage : currentPagePOS}
              total={activeTab === 'pushcart' ? totalPagesPC : totalPagesPOS}
              from={activeTab === 'pushcart' ? from : fromP}
              to={activeTab === 'pushcart' ? to : toP}
              count={activeTab === 'pushcart' ? filteredPurchases.length : filteredPurchasesPOS.length}
              onPrev={() => activeTab === 'pushcart' ? setCurrentPage(p => Math.max(1, p - 1)) : setCurrentPagePOS(p => Math.max(1, p - 1))}
              onNext={() => activeTab === 'pushcart' ? setCurrentPage(p => Math.min(totalPagesPC, p + 1)) : setCurrentPagePOS(p => Math.min(totalPagesPOS, p + 1))}
              onGo={n => activeTab === 'pushcart' ? setCurrentPage(n) : setCurrentPagePOS(n)}
              perPage={itemsPerPage}
              onPerPage={n => { setItemsPerPage(n); setCurrentPage(1); setCurrentPagePOS(1); }}
            />
          </>
        )}
      </div>

      {/* Modal */}
      {showDetailsModal && (
        <DetailsModal
          details={purchaseDetails}
          loading={detailsLoading}
          activeTab={activeTab}
          selectedPurchase={selectedPurchase}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </div>
  );
};

export default PushcartManagement;