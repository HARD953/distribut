"use client";
import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, Search, Plus, Edit, Trash2, Eye, EyeOff, Shield, Calendar, Clock, Phone, Mail,
  UserCheck, Settings, Download, CheckCircle, AlertCircle, ChevronLeft, ChevronRight,
  MapPin, Bike, ShoppingCart, Store, Truck, User as UserIcon, Package, Factory, X, Building2,
  BarChart3, ArrowUpDown, Loader2, Briefcase, Upload, RefreshCw,
} from 'lucide-react';
import { apiService } from './ApiService';

/* ─── Palette (identique aux autres vues admin) ─────────── */
const P = {
  navy: '#0A1E2E', blue: '#1A8FD1', blueL: '#4FB3E8', blueD: '#0D6FAB', banner: '#0D4E7A',
  pale: '#EDF5FA', surface: '#F0F5F9', warm: '#C0D4E6', warmL: '#D4E4F0',
  text: '#0A1E2E', textSub: '#2A4A62', muted: '#5A7A92', mutedD: '#1A4A6A',
  green: '#10B981', orange: '#F59E0B', red: '#EF4444', purple: '#8B5CF6', teal: '#14B8A6', indigo: '#6366F1', gray: '#8AA6BA',
};

const card: React.CSSProperties = { background: '#fff', border: `1px solid ${P.warmL}`, borderRadius: 16, boxShadow: '0 1px 6px rgba(13,80,140,0.06)' };
const inp: React.CSSProperties = {
  width: '100%', padding: '8px 12px', height: 38, border: `1.5px solid ${P.warm}`, borderRadius: 10, fontSize: 13, outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit', color: P.text, background: '#fff', transition: 'border-color 0.15s, box-shadow 0.15s',
};
const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: P.mutedD, marginBottom: 5 };
const btnPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 15px', borderRadius: 10, background: P.blue, color: '#fff', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit' };
const btnSecondary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 15px', borderRadius: 10, background: '#fff', color: P.mutedD, fontSize: 12, fontWeight: 700, border: `1.5px solid ${P.warm}`, cursor: 'pointer', fontFamily: 'inherit' };
const btnGhost: React.CSSProperties = { ...btnPrimary, background: 'rgba(255,255,255,0.16)' };

const GLOBAL_CSS = `
  @keyframes umSpin { to { transform: rotate(360deg); } }
  @keyframes umPop { 0% { transform: scale(0.97); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
  .um-spin { animation: umSpin 0.8s linear infinite; }
  .um-pop { animation: umPop 0.16s ease; }
  .um-root input:not([type=checkbox]):not([type=file]):not([type=color]):focus, .um-root select:focus, .um-root textarea:focus { border-color: #1A8FD1 !important; box-shadow: 0 0 0 3px rgba(26,143,209,0.15); }
  .um-row { transition: background 0.12s; }
  .um-row:hover { background: #EDF5FA; }
  .um-btn { transition: opacity 0.15s, transform 0.1s; }
  .um-btn:active:not(:disabled) { transform: scale(0.98); }
  .um-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
  .um-module-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  @media (max-width: 800px) { .um-grid-2 { grid-template-columns: 1fr; } .um-module-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (prefers-reduced-motion: reduce) { .um-spin { animation-duration: 2s; } .um-pop { animation: none; } }
`;

/* ─── Types ─────────────────────────────────────────────── */
interface Permission { id: string; name: string; category: string; description?: string; }
interface Role {
  id: string; name: string; description?: string; color?: string; permissions: Permission[]; users: number;
  tableau?: boolean; distributeurs?: boolean; commerciaux?: boolean; prospects?: boolean; inventaire?: boolean; commande?: boolean;
  utilisateur?: boolean; analytique?: boolean; geolocalisation?: boolean; configuration?: boolean; positions?: boolean;
  createcommande?: boolean; vuecommande?: boolean;
}
interface PointOfSale { id: string; name: string; type?: string; phone?: string; email?: string; address?: string; registration_date?: string; }
interface PortefeuillePOS {
  id: number; name: string; description?: string; points_of_sale: PointOfSale[]; pos_count: number;
  utilisateurs_count: number; owner?: number; created_at: string; updated_at: string;
}
interface NewPortefeuille { name: string; description: string; points_of_sale_ids: string[]; }
type UserStatus = 'active' | 'inactive' | 'suspended';
interface User {
  id: number; username: string; email: string; first_name?: string; last_name?: string; phone?: string; location?: string;
  role?: string; status: UserStatus; join_date: string; last_login?: string; avatar?: string; establishment_name: string;
  establishment_type: string; establishment_phone?: string; establishment_email?: string; establishment_address: string;
  points_of_sale: (PointOfSale | number)[]; establishment_registration_date?: string; role_name?: string;
  portefeuille?: number | null; portefeuille_detail?: PortefeuillePOS | null;
}
interface NewUser {
  user: { username: string; email: string; first_name?: string; last_name?: string; password?: string };
  phone?: string; location?: string; role?: string; status: UserStatus; establishment_name: string; establishment_type: string;
  establishment_phone?: string; establishment_email?: string; establishment_address: string; points_of_sale_ids?: string[]; portefeuille_id?: string | null;
}
interface NewRole {
  id: string; name: string; description?: string; permissions: string[]; color?: string;
  tableau?: boolean; distributeurs?: boolean; commerciaux?: boolean; prospects?: boolean; inventaire?: boolean; commande?: boolean;
  utilisateur?: boolean; analytique?: boolean; geolocalisation?: boolean; configuration?: boolean; positions?: boolean; createcommande?: boolean; vuecommande?: boolean;
}
interface Supplier { id: number; name: string; contact: string; address: string; email: string; logo?: string; created_at: string; types: string; }
interface NewSupplier { name: string; types: string; contact: string; address: string; email: string; logo?: File | null; }

/* ─── Constantes ────────────────────────────────────────── */
const ESTABLISHMENT_TYPES = [
  { value: 'Boutique', label: 'SA', icon: Store },
  { value: 'supermarche', label: 'SARL', icon: ShoppingCart },
];
const SUPPLIER_TYPES = [
  { value: 'importateur', label: 'Importateur' }, { value: 'producteur_local', label: 'Producteur local' },
  { value: 'distributeur', label: 'Distributeur' }, { value: 'fabricant', label: 'Fabricant' }, { value: 'grossiste', label: 'Grossiste' },
];
const MODULE_PERMISSIONS = [
  { key: 'tableau', label: 'Tableau de bord', icon: BarChart3 }, { key: 'distributeurs', label: 'Distributeurs', icon: Store },
  { key: 'commerciaux', label: 'Commerciaux', icon: Bike }, { key: 'prospects', label: 'Prospects', icon: Truck },
  { key: 'inventaire', label: 'Inventaire', icon: Package }, { key: 'commande', label: 'Commandes', icon: ShoppingCart },
  { key: 'utilisateur', label: 'Établissements', icon: Users }, { key: 'analytique', label: 'Analytiques', icon: BarChart3 },
  { key: 'geolocalisation', label: 'Géolocalisation', icon: MapPin }, { key: 'configuration', label: 'Configuration', icon: Settings },
  { key: 'positions', label: 'Positions', icon: MapPin }, { key: 'createcommande', label: 'Créer commande', icon: Plus },
  { key: 'vuecommande', label: 'Vue commande', icon: Eye },
];
const STATUS_CFG: Record<UserStatus, { label: string; bg: string; fg: string; dot: string }> = {
  active: { label: 'Actif', bg: '#DCF5EC', fg: '#044D38', dot: P.green },
  inactive: { label: 'Inactif', bg: '#EAF0F5', fg: '#3A5A72', dot: P.gray },
  suspended: { label: 'Suspendu', bg: '#FCE4DC', fg: '#7A2410', dot: P.red },
};

/* ─── Helpers ───────────────────────────────────────────── */
const safeGetStatus = (s?: string): UserStatus => (s && ['active', 'inactive', 'suspended'].includes(s) ? (s as UserStatus) : 'inactive');
const safeGetText = (t?: string | null, fb = '—') => t || fb;
const lower = (t?: string | null) => (t || '').toLowerCase();
const getEstType = (t?: string) => ESTABLISHMENT_TYPES.find((x) => x.value === t)?.label || t || '—';
const getSupplierType = (t?: string) => SUPPLIER_TYPES.find((x) => x.value === t)?.label || t || '—';
const fdate = (s?: string | null) => (s ? new Date(s).toLocaleDateString('fr-FR') : '—');
const fmt = (n: number) => n.toLocaleString('fr-FR');
const extractList = <T,>(j: any): T[] => (Array.isArray(j) ? j : Array.isArray(j?.results) ? j.results : []);
const fullName = (u: { first_name?: string; last_name?: string; username?: string }) => `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.username || '—';
const isEmail = (s?: string) => !!s && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

/* Normalise un utilisateur renvoyé par l'API (liste, création ou modification) pour qu'il ait toujours la même forme. */
const normalizeUser = (u: any): User => ({
  id: u.id, username: u.user?.username || u.username || '', email: u.user?.email || u.email || '',
  first_name: u.user?.first_name || u.first_name || '', last_name: u.user?.last_name || u.last_name || '',
  phone: u.phone || '', location: u.location || '', role: u.role || '', status: safeGetStatus(u.status),
  join_date: u.join_date || '', last_login: u.last_login || '', avatar: u.avatar || '',
  establishment_name: u.establishment_name || '', establishment_type: u.establishment_type || 'Boutique',
  establishment_phone: u.establishment_phone || '', establishment_email: u.establishment_email || '',
  establishment_address: u.establishment_address || '', points_of_sale: u.points_of_sale || [],
  establishment_registration_date: u.establishment_registration_date || '', role_name: u.role_name || '',
  portefeuille: u.portefeuille || null, portefeuille_detail: u.portefeuille_detail || null,
});

async function failMsg(res: Response, fallback: string): Promise<string> {
  try {
    const d = await res.json();
    if (typeof d === 'string') return d;
    if (d?.detail) return String(d.detail);
    if (d?.message) return String(d.message);
    if (d?.errors) return typeof d.errors === 'string' ? d.errors : JSON.stringify(d.errors);
    if (d && typeof d === 'object') {
      const parts = Object.entries(d).map(([k, v]) => `${k} : ${Array.isArray(v) ? v.join(', ') : typeof v === 'object' ? JSON.stringify(v) : String(v)}`);
      if (parts.length) return parts.join(' · ');
    }
  } catch { /* corps non JSON */ }
  return fallback;
}

const paginationRange = (current: number, total: number): (number | string)[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '…', total];
  if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '…', current - 1, current, current + 1, '…', total];
};

function downloadCsv(name: string, head: string[], rows: (string | number)[][]) {
  const csv = '\uFEFF' + [head, ...rows].map((r) => r.map((f) => `"${String(f ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  a.download = name; a.click();
}

/* ─── Petits composants ─────────────────────────────────── */
const Pill = ({ bg, fg, dot, children }: { bg: string; fg: string; dot?: string; children: React.ReactNode }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 9999, fontSize: 11, fontWeight: 700, background: bg, color: fg, whiteSpace: 'nowrap' }}>
    {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot }} />}{children}
  </span>
);
const StatusBadge = ({ status }: { status?: string }) => { const s = STATUS_CFG[safeGetStatus(status)]; return <Pill bg={s.bg} fg={s.fg} dot={s.dot}>{s.label}</Pill>; };

const Kpi = ({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: React.ReactNode; sub?: string; color: string }) => (
  <div style={{ ...card, padding: 16, display: 'flex', justifyContent: 'space-between', gap: 10 }}>
    <div style={{ minWidth: 0 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: P.muted, margin: 0 }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 800, color: P.text, margin: '6px 0 0', fontVariantNumeric: 'tabular-nums' }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: P.muted, margin: '3px 0 0' }}>{sub}</p>}
    </div>
    <div style={{ width: 40, height: 40, borderRadius: 11, background: `${color}1A`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon size={18} style={{ color }} /></div>
  </div>
);

const CardTitle = ({ icon: Icon, label, right }: { icon: any; label: string; right?: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingBottom: 12, marginBottom: 12, borderBottom: `1px solid ${P.warmL}` }}>
    <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: P.text }}><Icon size={14} style={{ color: P.blue }} /> {label}</span>{right}
  </div>
);
const SectionTitle = ({ icon: Icon, label }: { icon: any; label: string }) => (
  <h4 style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 800, color: P.text, margin: '0 0 12px' }}><Icon size={13} style={{ color: P.blue }} /> {label}</h4>
);

const EmptyState = ({ icon, title, sub, action }: { icon: React.ReactNode; title: string; sub?: string; action?: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '44px 24px', textAlign: 'center' }}>
    <div style={{ width: 52, height: 52, borderRadius: '50%', background: P.pale, display: 'flex', alignItems: 'center', justifyContent: 'center', color: P.blue, marginBottom: 12 }}>{icon}</div>
    <p style={{ fontSize: 14, fontWeight: 700, color: P.text, margin: 0 }}>{title}</p>
    {sub && <p style={{ fontSize: 12, color: P.muted, margin: '4px 0 0', maxWidth: 340 }}>{sub}</p>}
    {action && <div style={{ marginTop: 14 }}>{action}</div>}
  </div>
);

const AVATAR_COLORS = [P.blue, P.teal, P.purple, P.orange, P.indigo, P.green];
const Avatar = ({ src, name, size = 'md' }: { src?: string; name: string; size?: 'sm' | 'md' | 'lg' }) => {
  const sz = { sm: { wh: 32, fs: 11 }, md: { wh: 40, fs: 13 }, lg: { wh: 64, fs: 18 } }[size];
  const initial = (name || 'U').charAt(0).toUpperCase();
  if (src) return <img src={src} alt={name} style={{ width: sz.wh, height: sz.wh, borderRadius: 12, objectFit: 'cover', border: `1px solid ${P.warmL}`, flexShrink: 0 }} />;
  const color = AVATAR_COLORS[(name || 'U').charCodeAt(0) % AVATAR_COLORS.length];
  return <div style={{ width: sz.wh, height: sz.wh, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: sz.fs, fontWeight: 800, color: '#fff', background: color, flexShrink: 0 }}>{initial}</div>;
};

const ActionBtn = ({ onClick, title, danger, children }: { onClick: () => void; title: string; danger?: boolean; children: React.ReactNode }) => (
  <button className="um-btn" onClick={(e) => { e.stopPropagation(); onClick(); }} title={title} aria-label={title}
    style={{ padding: 7, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}
    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = danger ? '#FEF0ED' : P.pale; }}
    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>{children}</button>
);

const FormInput = ({ label, value, onChange, type = 'text', placeholder = '', required = false, disabled = false, hint }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean; disabled?: boolean; hint?: string;
}) => {
  const [show, setShow] = useState(false);
  const isPwd = type === 'password';
  return (
    <div>
      <label style={lbl}>{label}{required && <span style={{ color: P.red }}> *</span>}</label>
      <div style={{ position: 'relative' }}>
        <input type={isPwd && show ? 'text' : type} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
          autoComplete={isPwd ? 'new-password' : undefined}
          style={{ ...inp, paddingRight: isPwd ? 38 : 12, background: disabled ? P.surface : '#fff', cursor: disabled ? 'not-allowed' : 'text', opacity: disabled ? 0.75 : 1 }} />
        {isPwd && (
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: P.muted, display: 'flex', padding: 4 }}>
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {hint && <p style={{ fontSize: 10, color: P.muted, margin: '3px 0 0' }}>{hint}</p>}
    </div>
  );
};

const FormSelect = ({ label, value, onChange, children, required = false }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode; required?: boolean }) => (
  <div>
    <label style={lbl}>{label}{required && <span style={{ color: P.red }}> *</span>}</label>
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>{children}</select>
  </div>
);

const FormArea = ({ label, value, onChange, rows = 3, required = false }: { label: string; value: string; onChange: (v: string) => void; rows?: number; required?: boolean }) => (
  <div>
    <label style={lbl}>{label}{required && <span style={{ color: P.red }}> *</span>}</label>
    <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} style={{ ...inp, height: 'auto', padding: '8px 12px', resize: 'vertical' }} />
  </div>
);

const Pager = ({ page, perPage, count, onPage, onPerPage }: { page: number; perPage: number; count: number; onPage: (p: number) => void; onPerPage: (n: number) => void }) => {
  if (!count) return null;
  const total = Math.max(1, Math.ceil(count / perPage));
  const pb = (disabled: boolean, active = false): React.CSSProperties => ({ padding: '5px 10px', minWidth: 30, borderRadius: 8, fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: disabled ? 'not-allowed' : 'pointer', border: `1px solid ${active ? P.blue : P.warm}`, background: active ? P.blue : '#fff', color: active ? '#fff' : disabled ? P.warm : P.textSub, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' });
  return (
    <div style={{ padding: '11px 16px', borderTop: `1px solid ${P.warmL}`, background: P.surface, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: P.muted, fontWeight: 600 }}>
        <select value={perPage} onChange={(e) => onPerPage(Number(e.target.value))} aria-label="Lignes par page" style={{ ...inp, width: 'auto', height: 30, padding: '2px 8px', fontSize: 12 }}>{[5, 10, 25, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}</select>
        <span>{(page - 1) * perPage + 1}–{Math.min(page * perPage, count)} sur {count}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button aria-label="Page précédente" onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1} style={pb(page === 1)}><ChevronLeft size={14} /></button>
        {paginationRange(page, total).map((n, i) => n === '…' ? <span key={i} style={{ padding: '0 6px', color: P.muted, fontSize: 12 }}>…</span> : <button key={n} onClick={() => onPage(n as number)} style={pb(false, n === page)}>{n}</button>)}
        <button aria-label="Page suivante" onClick={() => onPage(Math.min(total, page + 1))} disabled={page === total} style={pb(page === total)}><ChevronRight size={14} /></button>
      </div>
    </div>
  );
};

const ModalWrapper = ({ onClose, title, subtitle, icon: Icon, children, footer, maxWidth = 860 }: { onClose: () => void; title: string; subtitle?: string; icon: any; children: React.ReactNode; footer?: React.ReactNode; maxWidth?: number }) => {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(10,21,32,0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
      <div className="um-pop" style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth, maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(10,21,32,0.25)' }}>
        <div style={{ background: P.banner, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.16)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={17} color="#fff" /></div>
            <div><h3 style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: 0 }}>{title}</h3>{subtitle && <p style={{ fontSize: 11, color: 'rgba(200,230,248,0.85)', margin: '2px 0 0' }}>{subtitle}</p>}</div>
          </div>
          <button onClick={onClose} aria-label="Fermer" style={{ padding: 7, background: 'rgba(255,255,255,0.16)', border: 'none', borderRadius: 9, cursor: 'pointer', color: '#fff', display: 'flex' }}><X size={15} /></button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
        {footer && <div style={{ borderTop: `1px solid ${P.warmL}`, padding: '14px 20px', display: 'flex', justifyContent: 'flex-end', gap: 10, background: P.surface, flexShrink: 0 }}>{footer}</div>}
      </div>
    </div>
  );
};

const FormError = ({ message, onClose }: { message: string | null; onClose?: () => void }) => !message ? null : (
  <div role="alert" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', background: '#FEF0ED', border: '1px solid #F5C4B3', borderRadius: 12, fontSize: 12, color: '#9A2D10' }}>
    <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} /><span style={{ flex: 1, fontWeight: 600 }}>{message}</span>
    {onClose && <button onClick={onClose} aria-label="Fermer" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9A2D10', display: 'flex' }}><X size={13} /></button>}
  </div>
);

const SubmitBtn = ({ busy, onClick, idle, busyLabel = 'Enregistrement…', icon: Icon = CheckCircle }: { busy: boolean; onClick: () => void; idle: string; busyLabel?: string; icon?: any }) => (
  <button className="um-btn" onClick={onClick} disabled={busy} style={{ ...btnPrimary, opacity: busy ? 0.7 : 1 }}>
    {busy ? <><Loader2 size={13} className="um-spin" /> {busyLabel}</> : <><Icon size={13} /> {idle}</>}
  </button>
);

/* ═══════════════════════════════════════════════════════════
   MODALE PORTEFEUILLE
═══════════════════════════════════════════════════════════ */
const PortefeuilleModal = ({ show, onClose, selectedPortefeuille, pointsOfSale, onPortefeuilleUpdated }: {
  show: boolean; onClose: () => void; selectedPortefeuille: PortefeuillePOS | null; pointsOfSale: PointOfSale[]; onPortefeuilleUpdated: (p: PortefeuillePOS, t: 'add' | 'edit') => void;
}) => {
  const [formData, setFormData] = useState<NewPortefeuille>({ name: '', description: '', points_of_sale_ids: [] });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [posSearch, setPosSearch] = useState('');

  useEffect(() => {
    if (!show) return;
    setFormData(selectedPortefeuille
      ? { name: selectedPortefeuille.name, description: selectedPortefeuille.description || '', points_of_sale_ids: selectedPortefeuille.points_of_sale.map((p) => p.id.toString()) }
      : { name: '', description: '', points_of_sale_ids: [] });
    setFormError(null); setPosSearch('');
  }, [show, selectedPortefeuille]);

  const toggle = (id: string, on: boolean) => setFormData((p) => ({ ...p, points_of_sale_ids: on ? [...p.points_of_sale_ids, id] : p.points_of_sale_ids.filter((x) => x !== id) }));
  const filtered = pointsOfSale.filter((pos) => lower(pos.name).includes(lower(posSearch)) || lower(pos.type).includes(lower(posSearch)));
  const selectFiltered = () => setFormData((p) => ({ ...p, points_of_sale_ids: Array.from(new Set([...p.points_of_sale_ids, ...filtered.map((x) => x.id.toString())])) }));

  const submit = async () => {
    if (!formData.name.trim()) { setFormError('Le nom du portefeuille est requis.'); return; }
    try {
      setFormError(null); setIsSubmitting(true);
      const body = { name: formData.name.trim(), description: formData.description, points_of_sale_ids: formData.points_of_sale_ids.map((i) => parseInt(i, 10)).filter((i) => !isNaN(i)) };
      const res = selectedPortefeuille ? await apiService.patch(`/portefeuilles/${selectedPortefeuille.id}/`, body) : await apiService.post('/portefeuilles/', body);
      if (!res.ok) throw new Error(await failMsg(res, 'Erreur serveur'));
      onPortefeuilleUpdated(await res.json(), selectedPortefeuille ? 'edit' : 'add'); onClose();
    } catch (e: any) { if (e.message !== 'Session expired') setFormError(e.message || 'Une erreur est survenue'); }
    finally { setIsSubmitting(false); }
  };

  if (!show) return null;
  const n = formData.points_of_sale_ids.length;
  return (
    <ModalWrapper onClose={() => { if (!isSubmitting) onClose(); }} maxWidth={720} icon={Briefcase}
      title={selectedPortefeuille ? 'Modifier le portefeuille' : 'Nouveau portefeuille POS'}
      subtitle={selectedPortefeuille ? 'Mettez à jour le portefeuille et ses points de vente' : 'Créez un groupe de points de vente'}
      footer={<><button className="um-btn" style={btnSecondary} disabled={isSubmitting} onClick={onClose}>Annuler</button>
        <SubmitBtn busy={isSubmitting} onClick={submit} idle={selectedPortefeuille ? 'Sauvegarder' : 'Créer le portefeuille'} icon={selectedPortefeuille ? CheckCircle : Plus} /></>}>
      <FormError message={formError} onClose={() => setFormError(null)} />
      <div style={{ border: `1px solid ${P.warmL}`, borderRadius: 14, padding: 16 }}>
        <SectionTitle icon={Briefcase} label="Informations du portefeuille" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <FormInput label="Nom du portefeuille" required value={formData.name} onChange={(v) => setFormData((p) => ({ ...p, name: v }))} placeholder="Ex : Zone Abidjan Nord" />
          <FormArea label="Description" rows={2} value={formData.description} onChange={(v) => setFormData((p) => ({ ...p, description: v }))} />
        </div>
      </div>
      <div style={{ border: `1px solid ${P.warmL}`, borderRadius: 14, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 800, color: P.text, margin: 0 }}><Store size={13} style={{ color: P.blue }} /> Points de vente <Pill bg={P.pale} fg={P.blueD}>{n} sélectionné(s)</Pill></h4>
          <div style={{ display: 'flex', gap: 10 }}>
            {filtered.length > 0 && <button type="button" onClick={selectFiltered} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.blue, fontSize: 11, fontWeight: 700, fontFamily: 'inherit' }}>Sélectionner les {filtered.length} résultat(s)</button>}
            {n > 0 && <button type="button" onClick={() => setFormData((p) => ({ ...p, points_of_sale_ids: [] }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.red, fontSize: 11, fontWeight: 700, fontFamily: 'inherit' }}>Tout désélectionner</button>}
          </div>
        </div>
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <Search size={13} color={P.muted} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
          <input type="text" placeholder="Rechercher un point de vente…" aria-label="Rechercher un point de vente" value={posSearch} onChange={(e) => setPosSearch(e.target.value)} style={{ ...inp, height: 36, paddingLeft: 32 }} />
        </div>
        <div className="um-grid-2" style={{ gap: 8, maxHeight: 250, overflowY: 'auto', padding: 2 }}>
          {filtered.length > 0 ? filtered.map((pos) => {
            const on = formData.points_of_sale_ids.includes(pos.id.toString());
            return (
              <label key={pos.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 11px', borderRadius: 10, cursor: 'pointer', background: on ? '#EEF0FF' : '#fff', border: `1.5px solid ${on ? P.indigo : P.warmL}` }}>
                <input type="checkbox" checked={on} onChange={(e) => toggle(pos.id.toString(), e.target.checked)} style={{ accentColor: P.indigo }} />
                <div style={{ minWidth: 0, flex: 1 }}><p style={{ fontSize: 12, fontWeight: 700, color: P.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pos.name}</p>{pos.type && <p style={{ fontSize: 10, color: P.muted, margin: 0 }}>{pos.type}</p>}</div>
              </label>
            );
          }) : <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '20px 0', color: P.muted, fontSize: 12, fontWeight: 600 }}>Aucun point de vente trouvé</div>}
        </div>
      </div>
    </ModalWrapper>
  );
};

/* ═══════════════════════════════════════════════════════════
   MODALE UTILISATEUR / ÉTABLISSEMENT
═══════════════════════════════════════════════════════════ */
const emptyUserForm = (): NewUser => ({
  user: { username: '', email: '', first_name: '', last_name: '', password: '' }, phone: '', location: '', role: '', status: 'active',
  establishment_name: '', establishment_type: 'Boutique', establishment_phone: '', establishment_email: '', establishment_address: '', points_of_sale_ids: [], portefeuille_id: null,
});

const UserModal = ({ show, onClose, modalType, selectedUser, roles, pointsOfSale, portefeuilles, onUserUpdated }: {
  show: boolean; onClose: () => void; modalType: 'add' | 'edit' | 'view'; selectedUser: User | null; roles: Role[]; pointsOfSale: PointOfSale[];
  portefeuilles: PortefeuillePOS[]; onUserUpdated: (u: User, t: 'add' | 'edit' | 'view') => void;
}) => {
  const [formData, setFormData] = useState<NewUser>(emptyUserForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [posMode, setPosMode] = useState<'portefeuille' | 'manuel'>('portefeuille');

  useEffect(() => {
    if (!show) return;
    if (modalType === 'edit' && selectedUser) {
      setPosMode(selectedUser.portefeuille ? 'portefeuille' : 'manuel');
      setFormData({
        user: { username: selectedUser.username, email: selectedUser.email, first_name: selectedUser.first_name || '', last_name: selectedUser.last_name || '', password: '' },
        phone: selectedUser.phone || '', location: selectedUser.location || '', role: selectedUser.role || '', status: safeGetStatus(selectedUser.status),
        establishment_name: selectedUser.establishment_name || '', establishment_type: selectedUser.establishment_type || 'Boutique',
        establishment_phone: selectedUser.establishment_phone || '', establishment_email: selectedUser.establishment_email || '', establishment_address: selectedUser.establishment_address || '',
        points_of_sale_ids: Array.isArray(selectedUser.points_of_sale) ? selectedUser.points_of_sale.map((pos) => (typeof pos === 'object' && pos !== null && 'id' in pos ? pos.id.toString() : pos?.toString() || '')).filter(Boolean) : [],
        portefeuille_id: selectedUser.portefeuille ? selectedUser.portefeuille.toString() : null,
      });
    } else if (modalType === 'add') { setPosMode('portefeuille'); setFormData(emptyUserForm()); }
    setFormError(null);
  }, [show, modalType, selectedUser]);

  const setUser = (f: keyof NewUser['user'], v: string) => setFormData((p) => ({ ...p, user: { ...p.user, [f]: v } }));
  const setField = (f: keyof Omit<NewUser, 'user'>, v: string) => setFormData((p) => ({ ...p, [f]: v }));
  const togglePOS = (id: string, on: boolean) => setFormData((p) => ({ ...p, points_of_sale_ids: on ? [...(p.points_of_sale_ids || []), id] : (p.points_of_sale_ids || []).filter((x) => x !== id) }));
  const selectedPf = portefeuilles.find((pf) => pf.id.toString() === formData.portefeuille_id);

  const validate = () => {
    if (!formData.user.username?.trim()) return "Le nom d'utilisateur est requis.";
    if (!isEmail(formData.user.email)) return 'Email invalide.';
    if (formData.establishment_email && !isEmail(formData.establishment_email)) return "L'email de l'établissement est invalide.";
    if (modalType === 'add' && !formData.user.password?.trim()) return 'Le mot de passe est requis.';
    if (!formData.role) return 'Le rôle est requis.';
    if (!formData.establishment_name?.trim()) return "Le nom de l'établissement est requis.";
    if (!formData.establishment_address?.trim()) return "L'adresse est requise.";
    return null;
  };

  const submit = async () => {
    const err = validate(); if (err) { setFormError(err); return; }
    try {
      setFormError(null); setIsSubmitting(true);
      const posIds = (formData.points_of_sale_ids || []).map((i) => parseInt(i, 10)).filter((i) => !isNaN(i));
      const pfId = formData.portefeuille_id ? parseInt(formData.portefeuille_id, 10) : null;
      const common = {
        phone: formData.phone || '', location: formData.location || '', status: formData.status, role_id: formData.role || null,
        establishment_name: formData.establishment_name, establishment_type: formData.establishment_type, establishment_address: formData.establishment_address,
        establishment_phone: formData.establishment_phone || '', establishment_email: formData.establishment_email || '',
        points_of_sale_ids: posMode === 'manuel' ? posIds : [], portefeuille_id: posMode === 'portefeuille' ? pfId : null,
      };
      if (modalType === 'edit' && selectedUser) {
        const userPayload: Record<string, string> = { email: formData.user.email, first_name: formData.user.first_name || '', last_name: formData.user.last_name || '' };
        if (formData.user.password?.trim()) userPayload.password = formData.user.password;
        const res = await apiService.updateUser(selectedUser.id, { user: userPayload, ...common });
        if (!res.ok) throw new Error(await failMsg(res, 'Erreur serveur'));
        onUserUpdated(normalizeUser(await res.json()), 'edit');
      } else {
        const res = await apiService.createUser({ user: { username: formData.user.username, email: formData.user.email, first_name: formData.user.first_name || '', last_name: formData.user.last_name || '', password: formData.user.password }, ...common });
        if (!res.ok) throw new Error(await failMsg(res, 'Erreur serveur'));
        onUserUpdated(normalizeUser(await res.json()), 'add');
      }
      onClose();
    } catch (e: any) { if (e.message !== 'Session expired') setFormError(e.message || 'Une erreur est survenue'); }
    finally { setIsSubmitting(false); }
  };

  if (!show) return null;
  const isView = modalType === 'view';
  const titles = { add: 'Nouvel établissement', edit: "Modifier l'établissement", view: "Fiche de l'établissement" };

  /* ── Vue lecture seule ── */
  if (isView && selectedUser) {
    const u = selectedUser;
    const manualPos = (u.points_of_sale || []).map((pos) => (typeof pos === 'object' && pos !== null ? (pos as PointOfSale) : null));
    const infoRow = (icon: any, label: string, value: string, color: string) => { const I = icon; return (
      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: P.pale, borderRadius: 10 }}>
        <I size={13} style={{ color, flexShrink: 0 }} /><div style={{ minWidth: 0 }}><p style={{ fontSize: 10, color: P.muted, fontWeight: 700, margin: 0 }}>{label}</p><p style={{ fontWeight: 700, color: P.text, fontSize: 12, margin: '1px 0 0', overflowWrap: 'anywhere' }}>{value}</p></div>
      </div>); };
    return (
      <ModalWrapper onClose={onClose} title={titles.view} subtitle="Informations complètes du compte" icon={Eye}>
        <div style={{ background: P.banner, borderRadius: 16, padding: 18, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Avatar src={u.avatar} name={u.username} size="lg" />
          <div style={{ minWidth: 0 }}>
            <h4 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>{fullName(u)}</h4>
            <p style={{ fontSize: 12, color: 'rgba(200,230,248,0.85)', margin: '2px 0 0' }}>@{u.username}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <StatusBadge status={u.status} />
              {(u.role_name || roles.find((r) => r.id === u.role)?.name) && <Pill bg="rgba(255,255,255,0.18)" fg="#fff">{u.role_name || roles.find((r) => r.id === u.role)?.name}</Pill>}
              {u.portefeuille_detail && <Pill bg="#EEF0FF" fg="#3730A3"><Briefcase size={10} /> {u.portefeuille_detail.name}</Pill>}
              <span style={{ fontSize: 11, color: 'rgba(200,230,248,0.85)', display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={11} /> Inscrit le {fdate(u.join_date)}</span>
            </div>
          </div>
        </div>
        <div className="um-grid-2">
          <div style={{ border: `1px solid ${P.warmL}`, borderRadius: 14, padding: 16 }}>
            <SectionTitle icon={UserIcon} label="Informations personnelles" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {infoRow(Mail, 'Email', u.email, P.purple)}{infoRow(Phone, 'Téléphone', safeGetText(u.phone), P.green)}{infoRow(MapPin, 'Localisation', safeGetText(u.location), P.blue)}
              {infoRow(Clock, 'Dernière connexion', u.last_login ? new Date(u.last_login).toLocaleString('fr-FR') : 'Jamais', P.teal)}
            </div>
          </div>
          <div style={{ border: `1px solid ${P.warmL}`, borderRadius: 14, padding: 16 }}>
            <SectionTitle icon={Building2} label="Établissement" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[['Nom', u.establishment_name], ['Forme juridique', getEstType(u.establishment_type)], ['Téléphone', safeGetText(u.establishment_phone)], ['Email', safeGetText(u.establishment_email)], ['Adresse', u.establishment_address]].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '8px 10px', background: P.pale, borderRadius: 10 }}>
                  <span style={{ fontSize: 11, color: P.muted, fontWeight: 700 }}>{l}</span><span style={{ fontSize: 12, fontWeight: 700, color: P.text, textAlign: 'right', overflowWrap: 'anywhere' }}>{v || '—'}</span>
                </div>))}
            </div>
          </div>
        </div>
        {u.portefeuille_detail && (
          <div style={{ border: `1.5px solid ${P.indigo}33`, borderRadius: 14, padding: 16 }}>
            <SectionTitle icon={Briefcase} label="Portefeuille POS" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#EEF0FF', borderRadius: 12, marginBottom: 12 }}>
              <Briefcase size={18} style={{ color: P.indigo }} />
              <div style={{ flex: 1 }}><p style={{ fontSize: 13, fontWeight: 800, color: P.text, margin: 0 }}>{u.portefeuille_detail.name}</p>{u.portefeuille_detail.description && <p style={{ fontSize: 11, color: P.muted, margin: '1px 0 0' }}>{u.portefeuille_detail.description}</p>}</div>
              <Pill bg="#fff" fg="#3730A3">{u.portefeuille_detail.pos_count} POS</Pill>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 7 }}>
              {u.portefeuille_detail.points_of_sale.map((pos, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: P.pale, borderRadius: 10 }}>
                  <Store size={12} style={{ color: P.indigo, flexShrink: 0 }} /><div style={{ minWidth: 0 }}><p style={{ fontSize: 11, fontWeight: 700, color: P.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pos.name}</p>{pos.type && <p style={{ fontSize: 10, color: P.muted, margin: 0 }}>{pos.type}</p>}</div>
                </div>))}
            </div>
          </div>
        )}
        {!u.portefeuille_detail && u.points_of_sale?.length > 0 && (
          <div style={{ border: `1px solid ${P.warmL}`, borderRadius: 14, padding: 16 }}>
            <SectionTitle icon={Store} label="Points de vente associés" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 7 }}>
              {u.points_of_sale.map((pos, i) => { const o = manualPos[i]; return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: P.pale, borderRadius: 10 }}>
                  <Store size={12} style={{ color: P.blue, flexShrink: 0 }} /><div><p style={{ fontSize: 12, fontWeight: 700, color: P.text, margin: 0 }}>{o?.name || `POS ${pos}`}</p>{o?.type && <p style={{ fontSize: 10, color: P.muted, margin: 0 }}>{o.type}</p>}</div>
                </div>); })}
            </div>
          </div>
        )}
      </ModalWrapper>
    );
  }

  /* ── Formulaire création / modification ── */
  return (
    <ModalWrapper onClose={() => { if (!isSubmitting) onClose(); }} title={titles[modalType]} icon={modalType === 'edit' ? Edit : Plus}
      subtitle={modalType === 'edit' ? (selectedUser ? `@${selectedUser.username}` : undefined) : 'Complétez les informations requises (*)'}
      footer={<><button className="um-btn" style={btnSecondary} disabled={isSubmitting} onClick={onClose}>Annuler</button>
        <SubmitBtn busy={isSubmitting} onClick={submit} idle={modalType === 'add' ? "Créer l'établissement" : 'Sauvegarder'} icon={modalType === 'add' ? Plus : CheckCircle} /></>}>
      <FormError message={formError} onClose={() => setFormError(null)} />
      <div className="um-grid-2" style={{ alignItems: 'start' }}>
        <div style={{ border: `1px solid ${P.warmL}`, borderRadius: 14, padding: 16 }}>
          <SectionTitle icon={UserIcon} label="Informations du compte" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            <FormInput label="Nom d'utilisateur" required value={formData.user.username} onChange={(v) => setUser('username', v)} disabled={modalType === 'edit'} hint={modalType === 'edit' ? "Le nom d'utilisateur ne peut pas être modifié." : undefined} />
            <FormInput label="Email" required type="email" value={formData.user.email} onChange={(v) => setUser('email', v)} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <FormInput label="Prénom" value={formData.user.first_name || ''} onChange={(v) => setUser('first_name', v)} />
              <FormInput label="Nom" value={formData.user.last_name || ''} onChange={(v) => setUser('last_name', v)} />
            </div>
            <FormInput label={modalType === 'add' ? 'Mot de passe' : 'Nouveau mot de passe'} required={modalType === 'add'} type="password" value={formData.user.password || ''} onChange={(v) => setUser('password', v)} hint={modalType === 'edit' ? 'Laissez vide pour conserver le mot de passe actuel.' : undefined} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <FormInput label="Téléphone" type="tel" value={formData.phone || ''} onChange={(v) => setField('phone', v)} />
              <FormInput label="Localisation" value={formData.location || ''} onChange={(v) => setField('location', v)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <FormSelect label="Rôle" required value={formData.role || ''} onChange={(v) => setField('role', v)}><option value="">Sélectionner…</option>{roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</FormSelect>
              <FormSelect label="Statut" required value={formData.status} onChange={(v) => setFormData((p) => ({ ...p, status: v as UserStatus }))}><option value="active">Actif</option><option value="inactive">Inactif</option><option value="suspended">Suspendu</option></FormSelect>
            </div>
          </div>
        </div>
        <div style={{ border: `1px solid ${P.warmL}`, borderRadius: 14, padding: 16 }}>
          <SectionTitle icon={Building2} label="Établissement" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            <FormInput label="Nom de l'établissement" required value={formData.establishment_name} onChange={(v) => setField('establishment_name', v)} />
            <FormSelect label="Forme juridique" required value={formData.establishment_type} onChange={(v) => setField('establishment_type', v)}>{ESTABLISHMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</FormSelect>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <FormInput label="Téléphone étab." type="tel" value={formData.establishment_phone || ''} onChange={(v) => setField('establishment_phone', v)} />
              <FormInput label="Email étab." type="email" value={formData.establishment_email || ''} onChange={(v) => setField('establishment_email', v)} />
            </div>
            <FormArea label="Adresse" required rows={3} value={formData.establishment_address} onChange={(v) => setField('establishment_address', v)} />
          </div>
        </div>
      </div>

      <div style={{ border: `1.5px solid ${P.indigo}33`, borderRadius: 14, padding: 16 }}>
        <SectionTitle icon={Briefcase} label="Assignation des points de vente" />
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {([['portefeuille', 'Via un portefeuille', Briefcase], ['manuel', 'Sélection manuelle', Store]] as const).map(([mode, label, Icon]) => {
            const on = posMode === mode;
            return <button key={mode} type="button" aria-pressed={on} onClick={() => setPosMode(mode)} className="um-btn"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, flex: 1, padding: '9px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: on ? P.indigo : '#fff', color: on ? '#fff' : P.muted, border: `1.5px solid ${on ? P.indigo : P.warm}` }}><Icon size={13} /> {label}</button>;
          })}
        </div>
        {posMode === 'portefeuille' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <FormSelect label="Portefeuille POS" value={formData.portefeuille_id || ''} onChange={(v) => setFormData((p) => ({ ...p, portefeuille_id: v || null, points_of_sale_ids: [] }))}>
              <option value="">— Aucun portefeuille —</option>{portefeuilles.map((pf) => <option key={pf.id} value={pf.id.toString()}>{pf.name} ({pf.pos_count} POS)</option>)}
            </FormSelect>
            {selectedPf && (
              <div style={{ padding: 12, background: '#EEF0FF', borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><Briefcase size={13} style={{ color: P.indigo }} /><p style={{ fontSize: 12, fontWeight: 800, color: '#3730A3', margin: 0 }}>{selectedPf.name}</p><span style={{ marginLeft: 'auto' }}><Pill bg="#fff" fg="#3730A3">{selectedPf.pos_count} POS</Pill></span></div>
                {selectedPf.description && <p style={{ fontSize: 11, color: P.muted, margin: '0 0 8px' }}>{selectedPf.description}</p>}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedPf.points_of_sale.slice(0, 8).map((pos) => <Pill key={pos.id} bg="#fff" fg={P.textSub}><Store size={10} /> {pos.name}</Pill>)}
                  {selectedPf.points_of_sale.length > 8 && <Pill bg="#fff" fg={P.muted}>+{selectedPf.points_of_sale.length - 8} autres</Pill>}
                </div>
              </div>
            )}
            {portefeuilles.length === 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#FBF3E0', borderRadius: 10, fontSize: 12, color: '#6B4500', fontWeight: 600 }}><AlertCircle size={13} /> Aucun portefeuille disponible : créez-en un dans l'onglet « Portefeuilles ».</div>}
          </div>
        ) : pointsOfSale.length > 0 ? (
          <div className="um-grid-2" style={{ gap: 7, maxHeight: 200, overflowY: 'auto' }}>
            {pointsOfSale.map((pos) => { const on = formData.points_of_sale_ids?.includes(pos.id.toString()) || false; return (
              <label key={pos.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, cursor: 'pointer', background: on ? P.pale : '#fff', border: `1.5px solid ${on ? P.blue : P.warmL}` }}>
                <input type="checkbox" checked={on} onChange={(e) => togglePOS(pos.id.toString(), e.target.checked)} style={{ accentColor: P.blue }} />
                <div><p style={{ fontSize: 12, fontWeight: 700, color: P.text, margin: 0 }}>{pos.name}</p>{pos.type && <p style={{ fontSize: 10, color: P.muted, margin: 0 }}>{pos.type}</p>}</div>
              </label>); })}
          </div>
        ) : <p style={{ textAlign: 'center', padding: '14px 0', color: P.muted, fontSize: 12, fontWeight: 600, margin: 0 }}>Aucun point de vente disponible</p>}
      </div>
    </ModalWrapper>
  );
};

/* ═══════════════════════════════════════════════════════════
   MODALE FOURNISSEUR
═══════════════════════════════════════════════════════════ */
const SupplierModal = ({ show, onClose, selectedSupplier, onSupplierUpdated }: { show: boolean; onClose: () => void; selectedSupplier: Supplier | null; onSupplierUpdated: (s: Supplier, t: 'add' | 'edit') => void }) => {
  const [formData, setFormData] = useState<NewSupplier>({ name: '', types: '', contact: '', address: '', email: '', logo: null });
  const [formError, setFormError] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!show) return;
    if (selectedSupplier) { setFormData({ name: selectedSupplier.name, types: selectedSupplier.types, contact: selectedSupplier.contact, address: selectedSupplier.address, email: selectedSupplier.email, logo: null }); setLogoPreview(selectedSupplier.logo || null); }
    else { setFormData({ name: '', types: '', contact: '', address: '', email: '', logo: null }); setLogoPreview(null); }
    setFormError(null);
  }, [show, selectedSupplier]);

  useEffect(() => () => { if (logoPreview?.startsWith('blob:')) URL.revokeObjectURL(logoPreview); }, [logoPreview]);

  const pickLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 2 * 1024 * 1024) { setFormError('Le logo dépasse 2 Mo.'); return; }
    setFormData((p) => ({ ...p, logo: f })); setLogoPreview(URL.createObjectURL(f));
  };

  const submit = async () => {
    if (!formData.name.trim()) return setFormError('Le nom est requis.');
    if (!formData.types.trim()) return setFormError('Le type est requis.');
    if (!formData.contact.trim()) return setFormError('Le contact est requis.');
    if (!isEmail(formData.email)) return setFormError('Email invalide.');
    try {
      setFormError(null); setIsSubmitting(true);
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => { if (k !== 'logo' && v) fd.append(k, v as string); });
      if (formData.logo) fd.append('logo', formData.logo);
      const res = selectedSupplier ? await apiService.updateResource('/suppliers', selectedSupplier.id, fd, true) : await apiService.createResource('/suppliers', fd, true);
      if (!res.ok) throw new Error(await failMsg(res, 'Erreur serveur'));
      onSupplierUpdated(await res.json(), selectedSupplier ? 'edit' : 'add'); onClose();
    } catch (e: any) { if (e.message !== 'Session expired') setFormError(e.message || 'Une erreur est survenue'); }
    finally { setIsSubmitting(false); }
  };

  if (!show) return null;
  return (
    <ModalWrapper onClose={() => { if (!isSubmitting) onClose(); }} maxWidth={680} icon={selectedSupplier ? Edit : Plus}
      title={selectedSupplier ? 'Modifier le fournisseur' : 'Nouveau fournisseur'} subtitle={selectedSupplier ? 'Mettez à jour les informations' : 'Ajoutez un nouveau partenaire'}
      footer={<><button className="um-btn" style={btnSecondary} disabled={isSubmitting} onClick={onClose}>Annuler</button><SubmitBtn busy={isSubmitting} onClick={submit} idle={selectedSupplier ? 'Sauvegarder' : 'Créer le fournisseur'} icon={selectedSupplier ? CheckCircle : Plus} /></>}>
      <FormError message={formError} onClose={() => setFormError(null)} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 14, border: `1px solid ${P.warmL}`, borderRadius: 14 }}>
        <div style={{ width: 72, height: 72, borderRadius: 14, overflow: 'hidden', border: `2px dashed ${P.warm}`, background: P.pale, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {logoPreview ? <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Building2 size={26} style={{ color: P.gray }} />}
        </div>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: P.text, margin: '0 0 6px' }}>Logo du fournisseur</p>
          <label className="um-btn" style={{ ...btnSecondary, padding: '7px 12px', cursor: 'pointer' }}><Upload size={12} /> Choisir un logo<input type="file" accept="image/*" onChange={pickLogo} style={{ display: 'none' }} /></label>
          <p style={{ fontSize: 10, color: P.muted, margin: '5px 0 0' }}>JPG ou PNG, 2 Mo maximum</p>
        </div>
      </div>
      <div className="um-grid-2">
        <FormInput label="Nom du fournisseur" required value={formData.name} onChange={(v) => setFormData((p) => ({ ...p, name: v }))} />
        <FormSelect label="Type" required value={formData.types} onChange={(v) => setFormData((p) => ({ ...p, types: v }))}><option value="">Sélectionner…</option>{SUPPLIER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</FormSelect>
        <FormInput label="Contact" required value={formData.contact} onChange={(v) => setFormData((p) => ({ ...p, contact: v }))} />
        <FormInput label="Email" required type="email" value={formData.email} onChange={(v) => setFormData((p) => ({ ...p, email: v }))} />
      </div>
      <FormArea label="Adresse" value={formData.address} onChange={(v) => setFormData((p) => ({ ...p, address: v }))} />
    </ModalWrapper>
  );
};

/* ═══════════════════════════════════════════════════════════
   MODALE RÔLE
═══════════════════════════════════════════════════════════ */
const RoleModal = ({ show, onClose, selectedRole, permissions, onRoleUpdated }: { show: boolean; onClose: () => void; selectedRole: Role | null; permissions: Permission[]; onRoleUpdated: (r: Role, t: 'add' | 'edit') => void }) => {
  const [formData, setFormData] = useState<NewRole>({ id: '', name: '', description: '', permissions: [], color: P.blue });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!show) return;
    if (selectedRole) {
      const mods: Record<string, boolean> = {}; MODULE_PERMISSIONS.forEach(({ key }) => { mods[key] = !!(selectedRole as any)[key]; });
      setFormData({ id: selectedRole.id, name: selectedRole.name, description: selectedRole.description || '', permissions: selectedRole.permissions.map((p) => p.id), color: selectedRole.color || P.blue, ...mods });
    } else setFormData({ id: '', name: '', description: '', permissions: [], color: P.blue });
    setFormError(null);
  }, [show, selectedRole]);

  const togglePerm = (id: string) => setFormData((p) => ({ ...p, permissions: p.permissions.includes(id) ? p.permissions.filter((x) => x !== id) : [...p.permissions, id] }));
  const setAllModules = (on: boolean) => setFormData((p) => { const n: any = { ...p }; MODULE_PERMISSIONS.forEach(({ key }) => { n[key] = on; }); return n; });

  const submit = async () => {
    if (!formData.name.trim()) { setFormError('Le nom du rôle est requis.'); return; }
    try {
      setFormError(null); setIsSubmitting(true);
      const res = selectedRole ? await apiService.updateResource('/roles', selectedRole.id, formData) : await apiService.createRole(formData);
      if (!res.ok) throw new Error(await failMsg(res, 'Erreur serveur'));
      onRoleUpdated(await res.json(), selectedRole ? 'edit' : 'add'); onClose();
    } catch (e: any) { if (e.message !== 'Session expired') setFormError(e.message || 'Une erreur est survenue'); }
    finally { setIsSubmitting(false); }
  };

  const byCategory = permissions.reduce((acc, p) => { const c = p.category || 'Autre'; (acc[c] ||= []).push(p); return acc; }, {} as Record<string, Permission[]>);
  const modCount = MODULE_PERMISSIONS.filter(({ key }) => (formData as any)[key]).length;

  if (!show) return null;
  return (
    <ModalWrapper onClose={() => { if (!isSubmitting) onClose(); }} icon={Shield} title={selectedRole ? 'Modifier le rôle' : 'Nouveau rôle'} subtitle={selectedRole ? 'Mettez à jour le rôle et ses accès' : "Définissez un nouveau profil d'accès"}
      footer={<><button className="um-btn" style={btnSecondary} disabled={isSubmitting} onClick={onClose}>Annuler</button><SubmitBtn busy={isSubmitting} onClick={submit} idle={selectedRole ? 'Sauvegarder' : 'Créer le rôle'} icon={selectedRole ? CheckCircle : Plus} /></>}>
      <FormError message={formError} onClose={() => setFormError(null)} />
      <div style={{ border: `1px solid ${P.warmL}`, borderRadius: 14, padding: 16 }}>
        <SectionTitle icon={Shield} label="Informations de base" />
        <div className="um-grid-2">
          <FormInput label="Identifiant du rôle" value={formData.id} onChange={(v) => setFormData((p) => ({ ...p, id: v }))} disabled={!!selectedRole} hint={selectedRole ? 'Non modifiable.' : 'Identifiant technique du rôle.'} />
          <FormInput label="Nom du rôle" required value={formData.name} onChange={(v) => setFormData((p) => ({ ...p, name: v }))} />
          <div style={{ gridColumn: '1 / -1' }}><FormInput label="Description" value={formData.description || ''} onChange={(v) => setFormData((p) => ({ ...p, description: v }))} placeholder="Description du rôle…" /></div>
          <div>
            <label style={lbl}>Couleur</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input type="color" value={formData.color || P.blue} onChange={(e) => setFormData((p) => ({ ...p, color: e.target.value }))} aria-label="Couleur du rôle" style={{ width: 44, height: 40, borderRadius: 10, border: `1.5px solid ${P.warm}`, cursor: 'pointer', background: 'none', padding: 2 }} />
              <span style={{ padding: '3px 12px', borderRadius: 9999, fontSize: 11, fontWeight: 700, color: '#fff', background: formData.color || P.blue }}>{formData.name || 'Aperçu'}</span>
            </div>
          </div>
        </div>
      </div>
      <div style={{ border: `1px solid ${P.warmL}`, borderRadius: 14, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 800, color: P.text, margin: 0 }}><Settings size={13} style={{ color: P.blue }} /> Accès aux modules <Pill bg={P.pale} fg={P.blueD}>{modCount}/{MODULE_PERMISSIONS.length}</Pill></h4>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={() => setAllModules(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.blue, fontSize: 11, fontWeight: 700, fontFamily: 'inherit' }}>Tout cocher</button>
            <button type="button" onClick={() => setAllModules(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.red, fontSize: 11, fontWeight: 700, fontFamily: 'inherit' }}>Tout décocher</button>
          </div>
        </div>
        <div className="um-module-grid">
          {MODULE_PERMISSIONS.map(({ key, label, icon: Icon }) => { const on = !!(formData as any)[key]; return (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 10px', borderRadius: 10, cursor: 'pointer', background: on ? P.pale : '#fff', border: `1.5px solid ${on ? P.blue : P.warmL}` }}>
              <input type="checkbox" checked={on} onChange={(e) => setFormData((p) => ({ ...p, [key]: e.target.checked }))} style={{ accentColor: P.blue }} />
              <Icon size={12} color={on ? P.blue : P.gray} /><span style={{ fontSize: 11, fontWeight: 700, color: on ? P.blueD : P.muted }}>{label}</span>
            </label>); })}
        </div>
      </div>
      {Object.keys(byCategory).length > 0 && (
        <div style={{ border: `1px solid ${P.warmL}`, borderRadius: 14, padding: 16 }}>
          <SectionTitle icon={Shield} label="Permissions détaillées" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(byCategory).map(([cat, perms]) => (
              <div key={cat} style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${P.warmL}` }}>
                <div style={{ padding: '8px 14px', background: P.surface, fontSize: 11, fontWeight: 800, color: P.mutedD }}>{cat}</div>
                <div className="um-grid-2" style={{ padding: 10, gap: 8 }}>
                  {perms.map((perm) => { const on = formData.permissions.includes(perm.id); return (
                    <label key={perm.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', borderRadius: 10, cursor: 'pointer', background: on ? P.pale : '#fff', border: `1.5px solid ${on ? P.blue : P.warmL}` }}>
                      <input type="checkbox" checked={on} onChange={() => togglePerm(perm.id)} style={{ accentColor: P.blue, marginTop: 2 }} />
                      <div><p style={{ fontSize: 12, fontWeight: 700, color: on ? P.blueD : P.text, margin: 0 }}>{perm.name}</p>{perm.description && <p style={{ fontSize: 10, color: P.muted, margin: '1px 0 0' }}>{perm.description}</p>}</div>
                    </label>); })}
                </div>
              </div>))}
          </div>
        </div>
      )}
    </ModalWrapper>
  );
};

/* ─── Carte portefeuille (liste extensible) ─────────────── */
const PortefeuilleCard = ({ pf, usersCount, onEdit, onDelete }: { pf: PortefeuillePOS; usersCount: number; onEdit: () => void; onDelete: () => void }) => {
  const [expanded, setExpanded] = useState(false);
  const list = expanded ? pf.points_of_sale : pf.points_of_sale.slice(0, 4);
  return (
    <div style={{ ...card, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: P.banner, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Briefcase size={16} color="#fff" /></div>
          <div style={{ minWidth: 0 }}><h4 style={{ fontSize: 14, fontWeight: 800, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pf.name}</h4>{pf.description && <p style={{ fontSize: 11, color: 'rgba(200,230,248,0.85)', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pf.description}</p>}</div>
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button className="um-btn" onClick={onEdit} aria-label="Modifier le portefeuille" style={{ padding: 7, background: 'rgba(255,255,255,0.16)', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex' }}><Edit size={13} color="#fff" /></button>
          <button className="um-btn" onClick={onDelete} aria-label="Supprimer le portefeuille" style={{ padding: 7, background: 'rgba(239,68,68,0.55)', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex' }}><Trash2 size={13} color="#fff" /></button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: `1px solid ${P.warmL}` }}>
        {[{ icon: Store, label: 'Points de vente', value: pf.points_of_sale.length || pf.pos_count }, { icon: Users, label: 'Établissements', value: usersCount }].map(({ icon: Icon, label, value }, i) => (
          <div key={label} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, borderRight: i === 0 ? `1px solid ${P.warmL}` : 'none' }}>
            <Icon size={15} style={{ color: P.indigo }} /><div><p style={{ fontSize: 18, fontWeight: 800, color: P.text, margin: 0 }}>{value}</p><p style={{ fontSize: 10, color: P.muted, fontWeight: 600, margin: 0 }}>{label}</p></div>
          </div>))}
      </div>
      <div style={{ padding: '12px 16px', flex: 1 }}>
        {pf.points_of_sale.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: expanded ? 220 : 'none', overflowY: 'auto' }}>
            {list.map((pos) => (
              <div key={pos.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 9px', background: P.pale, borderRadius: 8 }}>
                <Store size={11} style={{ color: P.indigo, flexShrink: 0 }} /><span style={{ fontSize: 11, fontWeight: 700, color: P.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pos.name}</span>{pos.type && <span style={{ fontSize: 10, color: P.muted }}>{pos.type}</span>}
              </div>))}
          </div>
        ) : <p style={{ fontSize: 12, color: P.muted, textAlign: 'center', margin: '8px 0' }}>Aucun point de vente assigné</p>}
        {pf.points_of_sale.length > 4 && <button onClick={() => setExpanded((e) => !e)} style={{ marginTop: 8, background: 'none', border: 'none', cursor: 'pointer', color: P.blue, fontSize: 11, fontWeight: 700, fontFamily: 'inherit', padding: 0 }}>{expanded ? 'Réduire la liste' : `Voir les ${pf.points_of_sale.length - 4} autres`}</button>}
      </div>
      <div style={{ padding: '8px 16px', borderTop: `1px solid ${P.warmL}`, background: P.surface }}><p style={{ fontSize: 10, color: P.muted, margin: 0 }}>Créé le {fdate(pf.created_at)}</p></div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
═══════════════════════════════════════════════════════════ */
type Tab = 'users' | 'portefeuilles' | 'suppliers' | 'roles';
type StatusFilter = 'all' | UserStatus;

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [pointsOfSale, setPointsOfSale] = useState<PointOfSale[]>([]);
  const [portefeuilles, setPortefeuilles] = useState<PortefeuillePOS[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
  const [supplierTypeFilter, setSupplierTypeFilter] = useState('all');
  const [pfSearch, setPfSearch] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedEstType, setSelectedEstType] = useState('all');
  const [selectedPortefeuilleFilter, setSelectedPortefeuilleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPortefeuilleModal, setShowPortefeuilleModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedRoleForEdit, setSelectedRoleForEdit] = useState<Role | null>(null);
  const [selectedPortefeuilleForEdit, setSelectedPortefeuilleForEdit] = useState<PortefeuillePOS | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('users');

  /* ── Chargement : une ressource en échec n'empêche plus d'afficher les autres ── */
  const fetchData = async () => {
    try {
      setError(null); setWarning(null); setLoading(true);
      const calls = [apiService.getUsers(), apiService.getRoles(), apiService.getPermissions(), apiService.getPointsVente(), apiService.getSuppliers(), apiService.get('/portefeuilles/')];
      const labels = ['utilisateurs', 'rôles', 'permissions', 'points de vente', 'fournisseurs', 'portefeuilles'];
      const results = await Promise.allSettled(calls);
      const failed: string[] = [];
      const get = async <T,>(i: number): Promise<T[]> => {
        const r = results[i];
        if (r.status !== 'fulfilled' || !r.value.ok) { failed.push(labels[i]); return []; }
        try { return extractList<T>(await r.value.json()); } catch { failed.push(labels[i]); return []; }
      };
      const [u, r, p, pos, s, pf] = await Promise.all([get<any>(0), get<Role>(1), get<Permission>(2), get<PointOfSale>(3), get<any>(4), get<PortefeuillePOS>(5)]);
      setUsers(u.map(normalizeUser)); setRoles(r); setPermissions(p); setPointsOfSale(pos);
      setSuppliers(s.map((x: any) => ({ ...x, types: x.types || 'grossiste' }))); setPortefeuilles(pf);
      if (failed.length === labels.length) setError('Impossible de charger les données.');
      else if (failed.length) setWarning(`Chargement partiel : ${failed.join(', ')} indisponible(s).`);
    } catch (e: any) { if (e.message !== 'Session expired') setError(e.message || 'Erreur de chargement'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  /* ── Compteurs calculés à partir des données chargées (toujours à jour) ── */
  const roleUsers = (id: string) => users.filter((u) => u.role === id).length;
  const pfUsers = (id: number) => users.filter((u) => u.portefeuille === id).length;

  /* ── Utilisateurs : filtre / tri / pagination ── */
  const statusCounts = useMemo(() => ({ all: users.length, active: users.filter((u) => u.status === 'active').length, inactive: users.filter((u) => u.status === 'inactive').length, suspended: users.filter((u) => u.status === 'suspended').length }), [users]);

  const filteredUsers = useMemo(() => {
    const q = lower(searchTerm.trim());
    return users.filter((u) => {
      if (q && !(lower(u.username).includes(q) || lower(u.email).includes(q) || lower(u.establishment_name).includes(q) || lower(u.phone) || lower(fullName(u)).includes(q))) { if (!(lower(u.phone).includes(q))) return false; }
      if (selectedRoleFilter !== 'all' && lower(u.role) !== lower(selectedRoleFilter)) return false;
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;
      if (selectedEstType !== 'all' && u.establishment_type !== selectedEstType) return false;
      if (selectedPortefeuilleFilter === 'none') return !u.portefeuille;
      if (selectedPortefeuilleFilter !== 'all') return u.portefeuille?.toString() === selectedPortefeuilleFilter;
      return true;
    });
  }, [users, searchTerm, selectedRoleFilter, statusFilter, selectedEstType, selectedPortefeuilleFilter]);

  const sortedUsers = useMemo(() => {
    if (!sortConfig) return filteredUsers;
    const { key, direction } = sortConfig; const dir = direction === 'asc' ? 1 : -1;
    return [...filteredUsers].sort((a, b) => {
      const av = (a as any)[key] ?? ''; const bv = (b as any)[key] ?? '';
      if (key === 'last_login') { if (!av && !bv) return 0; if (!av) return 1; if (!bv) return -1; return (new Date(av).getTime() - new Date(bv).getTime()) * dir; }
      return String(av).localeCompare(String(bv), 'fr') * dir;
    });
  }, [filteredUsers, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / itemsPerPage));
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages); }, [currentPage, totalPages]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, selectedRoleFilter, statusFilter, selectedEstType, selectedPortefeuilleFilter]);
  const paginatedUsers = sortedUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const handleSort = (key: string) => setSortConfig((prev) => ({ key, direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));

  const filteredSuppliers = useMemo(() => {
    const q = lower(supplierSearchTerm.trim());
    return suppliers.filter((s) => (supplierTypeFilter === 'all' || s.types === supplierTypeFilter) && (!q || lower(s.name).includes(q) || lower(s.email).includes(q) || lower(s.contact).includes(q)));
  }, [suppliers, supplierSearchTerm, supplierTypeFilter]);

  const filteredPortefeuilles = useMemo(() => {
    const q = lower(pfSearch.trim());
    return portefeuilles.filter((pf) => !q || lower(pf.name).includes(q) || lower(pf.description).includes(q) || pf.points_of_sale.some((p) => lower(p.name).includes(q)));
  }, [portefeuilles, pfSearch]);

  const hasUserFilters = !!searchTerm || selectedRoleFilter !== 'all' || statusFilter !== 'all' || selectedEstType !== 'all' || selectedPortefeuilleFilter !== 'all';
  const resetUserFilters = () => { setSearchTerm(''); setSelectedRoleFilter('all'); setStatusFilter('all'); setSelectedEstType('all'); setSelectedPortefeuilleFilter('all'); };

  /* ── Suppressions ── */
  const run = async (fn: () => Promise<Response>, onOk: () => void) => {
    try { const res = await fn(); if (!res.ok) throw new Error(await failMsg(res, 'Échec de la suppression')); onOk(); }
    catch (e: any) { if (e.message !== 'Session expired') setError(e.message || 'Erreur'); }
  };
  const deleteUser = (u: User) => { if (window.confirm(`Supprimer « ${u.establishment_name || u.username} » (@${u.username}) ? Cette action est définitive.`)) run(() => apiService.deleteResource('users', u.id), () => setUsers((p) => p.filter((x) => x.id !== u.id))); };
  const deleteSupplier = (s: Supplier) => { if (window.confirm(`Supprimer le fournisseur « ${s.name} » ?`)) run(() => apiService.deleteResource('suppliers', s.id), () => setSuppliers((p) => p.filter((x) => x.id !== s.id))); };
  const deleteRole = (r: Role) => {
    const n = roleUsers(r.id);
    if (window.confirm(n > 0 ? `Le rôle « ${r.name} » est attribué à ${n} utilisateur(s). Le supprimer quand même ?` : `Supprimer le rôle « ${r.name} » ?`)) run(() => apiService.deleteResource('roles', r.id), () => setRoles((p) => p.filter((x) => x.id !== r.id)));
  };
  const deletePortefeuille = (pf: PortefeuillePOS) => {
    const n = pfUsers(pf.id);
    if (window.confirm(`Supprimer le portefeuille « ${pf.name} » ?${n > 0 ? ` ${n} établissement(s) y sont rattachés ; ils ne seront pas supprimés.` : ''}`))
      run(() => apiService.delete(`/portefeuilles/${pf.id}/`), () => { setPortefeuilles((p) => p.filter((x) => x.id !== pf.id)); setUsers((p) => p.map((u) => (u.portefeuille === pf.id ? { ...u, portefeuille: null, portefeuille_detail: null } : u))); });
  };

  /* ── Mises à jour locales après création / modification ── */
  const handleUserUpdated = (u: User, type: 'add' | 'edit' | 'view') => {
    if (type === 'edit') setUsers((p) => p.map((x) => (x.id === u.id ? { ...x, ...u } : x)));
    else if (type === 'add') setUsers((p) => [u, ...p]);
  };
  const handleSupplierUpdated = (s: Supplier, type: 'add' | 'edit') => setSuppliers((p) => (type === 'edit' ? p.map((x) => (x.id === s.id ? s : x)) : [...p, s]));
  const handleRoleUpdated = (r: Role, type: 'add' | 'edit') => setRoles((p) => (type === 'edit' ? p.map((x) => (x.id === r.id ? r : x)) : [...p, r]));
  const handlePortefeuilleUpdated = (pf: PortefeuillePOS, type: 'add' | 'edit') => {
    setPortefeuilles((p) => (type === 'edit' ? p.map((x) => (x.id === pf.id ? pf : x)) : [...p, pf]));
    if (type === 'edit') setUsers((p) => p.map((u) => (u.portefeuille === pf.id ? { ...u, portefeuille_detail: pf } : u)));
  };

  const exportUsers = () => downloadCsv('etablissements.csv',
    ['Nom', "Nom d'utilisateur", 'Email', 'Téléphone', 'Localisation', 'Rôle', 'Statut', 'Établissement', 'Forme juridique', 'Adresse', 'Portefeuille', 'Nb points de vente', 'Inscrit le', 'Dernière connexion'],
    sortedUsers.map((u) => [fullName(u), u.username, u.email, u.phone || '', u.location || '', u.role_name || roles.find((r) => r.id === u.role)?.name || '', STATUS_CFG[u.status].label, u.establishment_name, getEstType(u.establishment_type), u.establishment_address, u.portefeuille_detail?.name || '', u.portefeuille_detail?.pos_count ?? u.points_of_sale?.length ?? 0, fdate(u.join_date), u.last_login ? new Date(u.last_login).toLocaleString('fr-FR') : 'Jamais']));

  const totalPOS = portefeuilles.reduce((a, pf) => a + (pf.points_of_sale.length || pf.pos_count || 0), 0);
  const selectStyle: React.CSSProperties = { ...inp, width: 'auto', height: 36, cursor: 'pointer', minWidth: 140 };
  const th: React.CSSProperties = { padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: P.muted, whiteSpace: 'nowrap' };
  const td: React.CSSProperties = { padding: '11px 14px', borderTop: `1px solid ${P.surface}`, verticalAlign: 'middle' };

  const openNewUser = () => { setModalType('add'); setSelectedUser(null); setShowModal(true); };

  if (loading && users.length === 0 && roles.length === 0) return (
    <div className="um-root" style={{ ...card, padding: 56, textAlign: 'center' }}><style>{GLOBAL_CSS}</style>
      <Loader2 size={32} className="um-spin" style={{ color: P.blue, margin: '0 auto 12px' }} /><p style={{ fontSize: 13, color: P.textSub, fontWeight: 600, margin: 0 }}>Chargement des données…</p>
    </div>
  );

  const tabs: { key: Tab; label: string; icon: any; count: number }[] = [
    { key: 'users', label: 'Établissements', icon: Users, count: users.length }, { key: 'portefeuilles', label: 'Portefeuilles', icon: Briefcase, count: portefeuilles.length },
    { key: 'suppliers', label: 'Fournisseurs', icon: Factory, count: suppliers.length }, { key: 'roles', label: 'Rôles', icon: Shield, count: roles.length },
  ];
  const sortableTh = (label: string, key: string) => (
    <button onClick={() => handleSort(key)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 10, fontWeight: 700, color: sortConfig?.key === key ? P.blue : P.muted, padding: 0 }}>
      {label} <ArrowUpDown size={11} />
    </button>
  );

  return (
    <div className="um-root" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{GLOBAL_CSS}</style>

      {error && <FormError message={error} onClose={() => setError(null)} />}
      {warning && (
        <div role="status" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#FBF3E0', border: '1px solid #F0DDA8', borderRadius: 12, fontSize: 12, color: '#6B4500', fontWeight: 600 }}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} /><span style={{ flex: 1 }}>{warning}</span>
          <button onClick={fetchData} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B4500', fontWeight: 700, fontSize: 12, fontFamily: 'inherit', textDecoration: 'underline' }}>Réessayer</button>
        </div>
      )}

      {/* Bandeau */}
      <div style={{ background: P.banner, borderRadius: 16, padding: 20, display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ maxWidth: 620 }}>
          <p style={{ color: 'rgba(200,230,248,0.9)', fontSize: 12, fontWeight: 600, margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 7 }}><Building2 size={15} style={{ color: P.blueL }} /> LanfiaLink Administration</p>
          <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 800, margin: 0 }}>Gestion des établissements</h2>
          <p style={{ color: 'rgba(200,230,248,0.85)', fontSize: 12, margin: '6px 0 0', lineHeight: 1.5 }}>Comptes, rôles et permissions, portefeuilles de points de vente et fournisseurs.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="um-btn" onClick={fetchData} style={btnGhost}>{loading ? <Loader2 size={13} className="um-spin" /> : <RefreshCw size={13} />} Actualiser</button>
          <button className="um-btn" onClick={openNewUser} style={btnPrimary}><Plus size={14} /> Nouvel établissement</button>
        </div>
      </div>

      {/* Indicateurs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
        <Kpi icon={Users} label="Total établissements" value={fmt(users.length)} sub={`${statusCounts.suspended} suspendu(s) · ${statusCounts.inactive} inactif(s)`} color={P.blue} />
        <Kpi icon={UserCheck} label="Établissements actifs" value={fmt(statusCounts.active)} sub={`${users.length ? Math.round((statusCounts.active / users.length) * 100) : 0} % du total`} color={P.green} />
        <Kpi icon={Briefcase} label="Portefeuilles POS" value={fmt(portefeuilles.length)} sub={`${fmt(totalPOS)} point(s) de vente gérés`} color={P.indigo} />
        <Kpi icon={Factory} label="Fournisseurs" value={fmt(suppliers.length)} sub={`${roles.length} rôle(s) configuré(s)`} color={P.teal} />
      </div>

      {/* Panneau principal */}
      <div style={{ ...card, overflow: 'hidden' }}>
        <div role="tablist" style={{ display: 'flex', gap: 4, padding: '0 12px', background: P.surface, borderBottom: `1px solid ${P.warmL}`, overflowX: 'auto' }}>
          {tabs.map(({ key, label, icon: Icon, count }) => { const on = activeTab === key; return (
            <button key={key} role="tab" aria-selected={on} onClick={() => setActiveTab(key)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '13px 14px', fontSize: 12, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', color: on ? P.blue : P.muted, borderBottom: `2.5px solid ${on ? P.blue : 'transparent'}`, marginBottom: -1 }}>
              <Icon size={14} />{label}<span style={{ padding: '1px 8px', borderRadius: 9999, fontSize: 10, background: on ? P.blue : '#fff', color: on ? '#fff' : P.muted }}>{count}</span>
            </button>); })}
        </div>

        {/* ── ÉTABLISSEMENTS ── */}
        {activeTab === 'users' && (
          <>
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10, borderBottom: `1px solid ${P.surface}` }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 340 }}>
                  <Search size={14} color={P.muted} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input type="text" placeholder="Nom, utilisateur, email, téléphone, établissement…" aria-label="Rechercher" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ ...inp, height: 36, paddingLeft: 32 }} />
                </div>
                {([['all', 'Tous'], ['active', 'Actifs'], ['inactive', 'Inactifs'], ['suspended', 'Suspendus']] as [StatusFilter, string][]).map(([k, l]) => { const on = statusFilter === k; return (
                  <button key={k} onClick={() => setStatusFilter(k)} aria-pressed={on} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 9999, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: on ? P.blue : '#fff', color: on ? '#fff' : P.textSub, border: `1.5px solid ${on ? P.blue : P.warm}` }}>
                    {l}<span style={{ background: on ? 'rgba(255,255,255,0.25)' : P.surface, borderRadius: 9999, padding: '0 7px', fontSize: 10 }}>{statusCounts[k]}</span></button>); })}
                <button className="um-btn" onClick={exportUsers} disabled={!sortedUsers.length} style={{ ...btnSecondary, height: 36, marginLeft: 'auto', opacity: sortedUsers.length ? 1 : 0.5 }}><Download size={13} /> Exporter CSV</button>
                <button className="um-btn" onClick={openNewUser} style={{ ...btnPrimary, height: 36 }}><Plus size={13} /> Nouvel établissement</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                <select value={selectedRoleFilter} onChange={(e) => setSelectedRoleFilter(e.target.value)} aria-label="Rôle" style={selectStyle}><option value="all">Tous les rôles</option>{roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
                <select value={selectedEstType} onChange={(e) => setSelectedEstType(e.target.value)} aria-label="Forme juridique" style={selectStyle}><option value="all">Toutes les formes juridiques</option>{ESTABLISHMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select>
                <select value={selectedPortefeuilleFilter} onChange={(e) => setSelectedPortefeuilleFilter(e.target.value)} aria-label="Portefeuille" style={selectStyle}><option value="all">Tous les portefeuilles</option><option value="none">Sans portefeuille</option>{portefeuilles.map((pf) => <option key={pf.id} value={pf.id.toString()}>{pf.name}</option>)}</select>
                <span style={{ fontSize: 12, color: P.muted, fontWeight: 600 }}><strong style={{ color: P.text }}>{filteredUsers.length}</strong> résultat(s)</span>
                {hasUserFilters && <button onClick={resetUserFilters} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.red, fontSize: 11, fontWeight: 700, fontFamily: 'inherit' }}>Tout réinitialiser</button>}
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: P.surface, borderBottom: `1px solid ${P.warmL}` }}>
                  <th style={th}>{sortableTh('Utilisateur', 'username')}</th><th style={th}>{sortableTh('Établissement', 'establishment_name')}</th><th style={th}>Portefeuille</th><th style={th}>Contact</th><th style={th}>Rôle</th>
                  <th style={th}>{sortableTh('Statut', 'status')}</th><th style={th}>{sortableTh('Dernière connexion', 'last_login')}</th><th style={{ ...th, textAlign: 'right' }}>Actions</th>
                </tr></thead>
                <tbody>
                  {paginatedUsers.length > 0 ? paginatedUsers.map((user) => (
                    <tr key={user.id} className="um-row" onClick={() => { setModalType('view'); setSelectedUser(user); setShowModal(true); }} style={{ cursor: 'pointer' }}>
                      <td style={td}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar src={user.avatar} name={user.username} /><div><p style={{ fontWeight: 700, color: P.text, margin: 0 }}>{fullName(user)}</p><p style={{ fontSize: 10, color: P.muted, margin: '2px 0 0' }}>@{user.username}</p></div></div></td>
                      <td style={td}><p style={{ fontWeight: 700, color: P.text, margin: 0 }}>{user.establishment_name || '—'}</p><p style={{ fontSize: 10, color: P.muted, margin: '2px 0 0' }}>{getEstType(user.establishment_type)}</p></td>
                      <td style={td}>
                        {user.portefeuille_detail ? <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><Briefcase size={13} style={{ color: P.indigo }} /><div><p style={{ fontSize: 11, fontWeight: 700, color: P.text, margin: 0 }}>{user.portefeuille_detail.name}</p><p style={{ fontSize: 10, color: P.muted, margin: 0 }}>{user.portefeuille_detail.pos_count} POS</p></div></div>
                          : user.points_of_sale?.length > 0 ? <span style={{ fontSize: 11, color: P.blueD, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><Store size={11} /> {user.points_of_sale.length} POS (manuel)</span> : <span style={{ color: P.muted }}>—</span>}
                      </td>
                      <td style={td}><p style={{ fontWeight: 600, color: P.text, margin: 0 }}>{user.email}</p>{user.phone && <p style={{ fontSize: 10, color: P.muted, margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 3 }}><Phone size={10} />{user.phone}</p>}</td>
                      <td style={td}>{user.role ? <Pill bg={P.pale} fg={P.blueD}>{user.role_name || roles.find((r) => r.id === user.role)?.name || 'Rôle inconnu'}</Pill> : <span style={{ color: P.muted }}>—</span>}</td>
                      <td style={td}><StatusBadge status={user.status} /></td>
                      <td style={td}>{user.last_login ? <><p style={{ fontSize: 11, color: P.text, fontWeight: 600, margin: 0 }}>{fdate(user.last_login)}</p><p style={{ fontSize: 10, color: P.muted, margin: 0 }}>{new Date(user.last_login).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p></> : <span style={{ fontSize: 11, color: P.muted, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={10} /> Jamais</span>}</td>
                      <td style={td}><div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <ActionBtn onClick={() => { setModalType('view'); setSelectedUser(user); setShowModal(true); }} title="Voir la fiche"><Eye size={14} color={P.blueD} /></ActionBtn>
                        <ActionBtn onClick={() => { setModalType('edit'); setSelectedUser(user); setShowModal(true); }} title="Modifier"><Edit size={14} color={P.blue} /></ActionBtn>
                        <ActionBtn danger onClick={() => deleteUser(user)} title="Supprimer"><Trash2 size={14} color={P.red} /></ActionBtn>
                      </div></td>
                    </tr>
                  )) : (
                    <tr><td colSpan={8}><EmptyState icon={<Users size={22} />} title={users.length === 0 ? 'Aucun établissement' : 'Aucun résultat'} sub={users.length === 0 ? 'Créez votre premier établissement pour commencer.' : 'Modifiez la recherche ou les filtres.'}
                      action={users.length === 0 ? <button className="um-btn" onClick={openNewUser} style={btnPrimary}><Plus size={13} /> Nouvel établissement</button> : hasUserFilters ? <button className="um-btn" onClick={resetUserFilters} style={btnSecondary}>Réinitialiser les filtres</button> : undefined} /></td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pager page={currentPage} perPage={itemsPerPage} count={sortedUsers.length} onPage={setCurrentPage} onPerPage={(n) => { setItemsPerPage(n); setCurrentPage(1); }} />
          </>
        )}

        {/* ── PORTEFEUILLES ── */}
        {activeTab === 'portefeuilles' && (
          <>
            <div style={{ padding: 14, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', borderBottom: `1px solid ${P.surface}` }}>
              <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 340 }}>
                <Search size={14} color={P.muted} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input type="text" placeholder="Rechercher un portefeuille ou un point de vente…" aria-label="Rechercher un portefeuille" value={pfSearch} onChange={(e) => setPfSearch(e.target.value)} style={{ ...inp, height: 36, paddingLeft: 32 }} />
              </div>
              <span style={{ fontSize: 12, color: P.muted, fontWeight: 600 }}>{filteredPortefeuilles.length} portefeuille(s) · {fmt(totalPOS)} point(s) de vente</span>
              <button className="um-btn" onClick={() => { setSelectedPortefeuilleForEdit(null); setShowPortefeuilleModal(true); }} style={{ ...btnPrimary, height: 36, marginLeft: 'auto' }}><Plus size={13} /> Nouveau portefeuille</button>
            </div>
            <div style={{ padding: 16 }}>
              {filteredPortefeuilles.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
                  {filteredPortefeuilles.map((pf) => <PortefeuilleCard key={pf.id} pf={pf} usersCount={pfUsers(pf.id)} onEdit={() => { setSelectedPortefeuilleForEdit(pf); setShowPortefeuilleModal(true); }} onDelete={() => deletePortefeuille(pf)} />)}
                </div>
              ) : <EmptyState icon={<Briefcase size={22} />} title={portefeuilles.length === 0 ? 'Aucun portefeuille' : 'Aucun résultat'} sub={portefeuilles.length === 0 ? 'Créez un portefeuille pour regrouper vos points de vente.' : 'Modifiez la recherche.'}
                action={portefeuilles.length === 0 ? <button className="um-btn" onClick={() => { setSelectedPortefeuilleForEdit(null); setShowPortefeuilleModal(true); }} style={btnPrimary}><Plus size={13} /> Créer un portefeuille</button> : undefined} />}
            </div>
          </>
        )}

        {/* ── FOURNISSEURS ── */}
        {activeTab === 'suppliers' && (
          <>
            <div style={{ padding: 14, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', borderBottom: `1px solid ${P.surface}` }}>
              <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 340 }}>
                <Search size={14} color={P.muted} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input type="text" placeholder="Rechercher un fournisseur…" aria-label="Rechercher un fournisseur" value={supplierSearchTerm} onChange={(e) => setSupplierSearchTerm(e.target.value)} style={{ ...inp, height: 36, paddingLeft: 32 }} />
              </div>
              <select value={supplierTypeFilter} onChange={(e) => setSupplierTypeFilter(e.target.value)} aria-label="Type de fournisseur" style={selectStyle}><option value="all">Tous les types</option>{SUPPLIER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select>
              <button className="um-btn" onClick={() => { setSelectedSupplier(null); setShowSupplierModal(true); }} style={{ ...btnPrimary, height: 36, marginLeft: 'auto' }}><Plus size={13} /> Nouveau fournisseur</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: P.surface, borderBottom: `1px solid ${P.warmL}` }}>{['Fournisseur', 'Type', 'Contact', 'Email', 'Créé le', 'Actions'].map((h, i) => <th key={h} style={{ ...th, textAlign: i === 5 ? 'right' : 'left' }}>{h}</th>)}</tr></thead>
                <tbody>
                  {filteredSuppliers.length > 0 ? filteredSuppliers.map((s) => (
                    <tr key={s.id} className="um-row">
                      <td style={td}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, overflow: 'hidden', border: `1px solid ${P.warmL}`, background: P.pale, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {s.logo ? <img src={s.logo} alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 14, fontWeight: 800, color: P.teal }}>{s.name.charAt(0).toUpperCase()}</span>}
                        </div>
                        <div><p style={{ fontWeight: 700, color: P.text, margin: 0 }}>{s.name}</p><p style={{ fontSize: 10, color: P.muted, margin: '1px 0 0' }}>{s.address || '—'}</p></div></div></td>
                      <td style={td}><Pill bg={P.pale} fg={P.blueD}>{getSupplierType(s.types)}</Pill></td>
                      <td style={{ ...td, fontWeight: 600, color: P.text }}>{s.contact}</td><td style={{ ...td, color: P.textSub }}>{s.email}</td><td style={{ ...td, color: P.muted }}>{fdate(s.created_at)}</td>
                      <td style={td}><div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <ActionBtn onClick={() => { setSelectedSupplier(s); setShowSupplierModal(true); }} title="Modifier"><Edit size={14} color={P.blue} /></ActionBtn>
                        <ActionBtn danger onClick={() => deleteSupplier(s)} title="Supprimer"><Trash2 size={14} color={P.red} /></ActionBtn>
                      </div></td>
                    </tr>
                  )) : <tr><td colSpan={6}><EmptyState icon={<Factory size={22} />} title={suppliers.length === 0 ? 'Aucun fournisseur' : 'Aucun résultat'} sub={suppliers.length === 0 ? 'Ajoutez un premier fournisseur.' : 'Modifiez la recherche ou le filtre.'} /></td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── RÔLES ── */}
        {activeTab === 'roles' && (
          <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              <div><h3 style={{ fontSize: 14, fontWeight: 800, color: P.text, margin: 0 }}>Rôles système</h3><p style={{ fontSize: 12, color: P.muted, margin: '2px 0 0' }}>Profils d'accès attribués aux utilisateurs.</p></div>
              <button className="um-btn" onClick={() => { setSelectedRoleForEdit(null); setShowRoleModal(true); }} style={btnPrimary}><Plus size={13} /> Nouveau rôle</button>
            </div>
            {roles.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                {roles.map((role) => {
                  const mods = MODULE_PERMISSIONS.filter(({ key }) => (role as any)[key]);
                  return (
                    <div key={role.id} style={{ border: `1px solid ${P.warmL}`, borderTop: `3px solid ${role.color || P.blue}`, borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <h4 style={{ fontSize: 13, fontWeight: 800, color: P.text, margin: 0, display: 'flex', alignItems: 'center', gap: 7 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: role.color || P.blue }} />{role.name}</h4>
                        <div style={{ display: 'flex' }}>
                          <ActionBtn onClick={() => { setSelectedRoleForEdit(role); setShowRoleModal(true); }} title="Modifier le rôle"><Edit size={13} color={P.blue} /></ActionBtn>
                          <ActionBtn danger onClick={() => deleteRole(role)} title="Supprimer le rôle"><Trash2 size={13} color={P.red} /></ActionBtn>
                        </div>
                      </div>
                      <p style={{ fontSize: 11, color: P.muted, margin: 0, lineHeight: 1.4, minHeight: 30 }}>{role.description || 'Aucune description'}</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {mods.slice(0, 4).map(({ key, label }) => <Pill key={key} bg={P.pale} fg={P.blueD}>{label}</Pill>)}
                        {mods.length > 4 && <Pill bg={P.surface} fg={P.muted}>+{mods.length - 4}</Pill>}
                        {mods.length === 0 && <span style={{ fontSize: 11, color: P.muted }}>Aucun module activé</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: `1px solid ${P.surface}` }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: P.text }}>{roleUsers(role.id)} utilisateur(s)</span>
                        <span style={{ fontSize: 11, color: P.muted, fontWeight: 600 }}>{role.permissions.length} permission(s)</span>
                      </div>
                    </div>);
                })}
              </div>
            ) : <EmptyState icon={<Shield size={22} />} title="Aucun rôle configuré" sub="Créez un rôle pour définir des profils d'accès." action={<button className="um-btn" onClick={() => { setSelectedRoleForEdit(null); setShowRoleModal(true); }} style={btnPrimary}><Plus size={13} /> Nouveau rôle</button>} />}
          </div>
        )}
      </div>

      {/* Modales */}
      <UserModal show={showModal} onClose={() => setShowModal(false)} modalType={modalType} selectedUser={selectedUser} roles={roles} pointsOfSale={pointsOfSale} portefeuilles={portefeuilles} onUserUpdated={handleUserUpdated} />
      <SupplierModal show={showSupplierModal} onClose={() => setShowSupplierModal(false)} selectedSupplier={selectedSupplier} onSupplierUpdated={handleSupplierUpdated} />
      <RoleModal show={showRoleModal} onClose={() => setShowRoleModal(false)} selectedRole={selectedRoleForEdit} permissions={permissions} onRoleUpdated={handleRoleUpdated} />
      <PortefeuilleModal show={showPortefeuilleModal} onClose={() => setShowPortefeuilleModal(false)} selectedPortefeuille={selectedPortefeuilleForEdit} pointsOfSale={pointsOfSale} onPortefeuilleUpdated={handlePortefeuilleUpdated} />
    </div>
  );
};

export default UserManagement;