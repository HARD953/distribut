"use client";
// components/dashboard/LocalisationManagement.tsx
// Découpage territorial : districts > villes > quartiers (même langage visuel que Activations et Analytiques)

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus, Pencil, Trash2, MapPin, Search, X, Building2, Globe, AlertTriangle, Loader2,
  ChevronLeft, ChevronRight, Download, ListPlus,
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

/* ─── Types ───────────────────────────────────────────────── */
interface District { id: number; nom: string; villes_count: number; date_creation: string }
interface Ville { id: number; nom: string; district: number; district_nom: string; quartiers_count: number; date_creation: string }
interface Quartier { id: number; nom: string; ville: number; ville_nom: string; district_nom: string; date_creation: string }
type Tab = 'districts' | 'villes' | 'quartiers';

/* ─── API ─────────────────────────────────────────────────── */
const BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.lanfialink.com/api';

async function readError(res: Response): Promise<string> {
  try {
    const d = await res.json();
    const pick = (v: any): string | null => {
      if (typeof v === 'string') return v;
      if (Array.isArray(v)) return v.length ? pick(v[0]) : null;
      if (v && typeof v === 'object') return pick(v.detail ?? Object.values(v)[0]);
      return null;
    };
    return pick(d) || 'Une erreur est survenue.';
  } catch { return 'Une erreur est survenue.'; }
}
const toArr = (d: any): any[] => (Array.isArray(d) ? d : Array.isArray(d?.results) ? d.results : []);

async function fetchList<T>(url: string): Promise<T[]> {
  const res = await apiService.get(url);
  if (!res.ok) throw new Error(await readError(res));
  return toArr(await res.json());
}
async function send(method: 'post' | 'patch', url: string, body: any) {
  const res = method === 'post' ? await apiService.post(url, body) : await apiService.patch(url, body);
  if (!res.ok) throw new Error(await readError(res));
}
async function remove(url: string) {
  const svc: any = apiService;
  const res: Response = typeof svc.delete === 'function'
    ? await svc.delete(url)
    : await fetch(`${BASE}${url}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('access')}` } });
  if (!res.ok) throw new Error(await readError(res));
}

/* ─── Helpers ─────────────────────────────────────────────── */
const norm = (s: string) => (s || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
const fmtDate = (d: string) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');
const SINGULAR: Record<Tab, string> = { districts: 'district', villes: 'ville', quartiers: 'quartier' };
const PLURAL_CAP: Record<Tab, string> = { districts: 'Districts', villes: 'Villes', quartiers: 'Quartiers' };

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
@keyframes loc-spin { to { transform: rotate(360deg); } }
.loc-spin { animation: loc-spin .8s linear infinite; }
.loc-row:hover { background: #F5FAFD; }
.loc-th { cursor: pointer; user-select: none; }
.loc-th:hover { color: ${C.blueD}; }
.loc-icon:hover { background: ${C.pale}; }
@media (prefers-reduced-motion: reduce) { .loc-spin { animation: none; } }
`;

/* ─── Petits composants ───────────────────────────────────── */
const Pill = ({ bg, tx, children, onClick, title }: { bg: string; tx: string; children: React.ReactNode; onClick?: () => void; title?: string }) => {
  const style: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '2px 9px', borderRadius: 99, fontWeight: 700, background: bg, color: tx, whiteSpace: 'nowrap', border: 'none', fontFamily: 'inherit' };
  return onClick
    ? <button onClick={onClick} title={title} style={{ ...style, cursor: 'pointer' }}>{children}</button>
    : <span style={style}>{children}</span>;
};

const Kpi = ({ label, value, sub, color, icon: Icon }: { label: string; value: number; sub: string; color: string; icon: React.ComponentType<any> }) => (
  <div style={{ ...card, padding: 16 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <p style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>{label}</p>
      <Icon size={15} style={{ color }} />
    </div>
    <p style={{ fontSize: 24, fontWeight: 700, color, marginTop: 4, lineHeight: 1.1 }}>{value.toLocaleString('fr-FR')}</p>
    <p style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>{sub}</p>
  </div>
);

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
    <span style={{ fontSize: 12, fontWeight: 600, color: C.sub }}>{label}</span>
    {children}
    {hint && <span style={{ fontSize: 11, color: C.muted }}>{hint}</span>}
  </label>
);

const Modal = ({ title, onClose, children, footer }: { title: string; onClose: () => void; children: React.ReactNode; footer: React.ReactNode }) => {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(10,30,46,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ ...card, width: '100%', maxWidth: 480, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `0.5px solid ${C.lineL}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{title}</p>
          <button onClick={onClose} aria-label="Fermer" style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}><X size={18} /></button>
        </div>
        <div style={{ padding: 20, overflowY: 'auto' }}>{children}</div>
        <div style={{ padding: '12px 20px', borderTop: `0.5px solid ${C.lineL}`, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>{footer}</div>
      </div>
    </div>
  );
};

const ErrorBox = ({ children, tone = 'red' }: { children: React.ReactNode; tone?: 'red' | 'amber' }) => (
  <div role="alert" style={{ display: 'flex', gap: 8, padding: 12, borderRadius: 10, fontSize: 12, marginBottom: 14, background: tone === 'red' ? C.redBg : C.amberBg, color: tone === 'red' ? C.redTx : C.amberTx }}>
    <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} /><div style={{ flex: 1 }}>{children}</div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   Composant principal
   ═══════════════════════════════════════════════════════════ */
interface FormState { mode: 'create' | 'edit'; item: any | null }

const LocalisationManagement = () => {
  const [tab, setTab] = useState<Tab>('districts');
  const [districts, setDistricts] = useState<District[]>([]);
  const [villes, setVilles] = useState<Ville[]>([]);
  const [quartiers, setQuartiers] = useState<Quartier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtres, tri, pagination
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [villeFilter, setVilleFilter] = useState('');
  const [onlyEmpty, setOnlyEmpty] = useState(false);
  const [sortKey, setSortKey] = useState('nom');
  const [asc, setAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Formulaire
  const [form, setForm] = useState<FormState | null>(null);
  const [nom, setNom] = useState('');
  const [batch, setBatch] = useState(false);
  const [batchText, setBatchText] = useState('');
  const [parent, setParent] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Suppression
  const [toDelete, setToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    try {
      const [d, v, q] = await Promise.all([
        fetchList<District>('/districts/'), fetchList<Ville>('/villes/'), fetchList<Quartier>('/quartiers/'),
      ]);
      setDistricts(d); setVilles(v); setQuartiers(q);
      setError(null);
    } catch (e: any) { setError(e.message || 'Impossible de charger le découpage.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { loadAll(); }, [loadAll]);

  /* Navigation entre niveaux */
  const goTab = (t: Tab, patch: { district?: string; ville?: string } = {}) => {
    setTab(t); setSearch(''); setOnlyEmpty(false);
    setDistrictFilter(patch.district ?? ''); setVilleFilter(patch.ville ?? '');
    setSortKey('nom'); setAsc(true);
  };

  /* Données filtrées et triées pour l'onglet actif */
  const villeOptions = useMemo(
    () => villes.filter((v) => !districtFilter || v.district === Number(districtFilter)),
    [villes, districtFilter],
  );

  const columns = useMemo(() => {
    const iconBox = (Icon: React.ComponentType<any>) => (
      <span style={{ width: 32, height: 32, borderRadius: 9, background: '#D6EAF6', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={14} style={{ color: C.blueD }} />
      </span>
    );
    const nameCell = (Icon: React.ComponentType<any>) => (r: any) => (
      <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, color: C.text }}>{iconBox(Icon)}{r.nom}</span>
    );
    const date = { key: 'date_creation', label: 'Créé le', sort: (r: any) => r.date_creation || '', render: (r: any) => <span style={{ fontSize: 12, color: C.muted }}>{fmtDate(r.date_creation)}</span> };
    if (tab === 'districts') return [
      { key: 'nom', label: 'District', sort: (r: any) => norm(r.nom), render: nameCell(Globe) },
      { key: 'villes_count', label: 'Villes', sort: (r: any) => r.villes_count, render: (r: any) => r.villes_count > 0
        ? <Pill bg={C.pale} tx={C.blueD} onClick={() => goTab('villes', { district: String(r.id) })} title="Voir les villes">{r.villes_count} ville{r.villes_count > 1 ? 's' : ''} →</Pill>
        : <Pill bg={C.amberBg} tx={C.amberTx}>Aucune ville</Pill> },
      date,
    ];
    if (tab === 'villes') return [
      { key: 'nom', label: 'Ville', sort: (r: any) => norm(r.nom), render: nameCell(Building2) },
      { key: 'district_nom', label: 'District', sort: (r: any) => norm(r.district_nom), render: (r: any) => <Pill bg={C.violetBg} tx={C.violet}>{r.district_nom}</Pill> },
      { key: 'quartiers_count', label: 'Quartiers', sort: (r: any) => r.quartiers_count, render: (r: any) => r.quartiers_count > 0
        ? <Pill bg={C.pale} tx={C.blueD} onClick={() => goTab('quartiers', { district: String(r.district), ville: String(r.id) })} title="Voir les quartiers">{r.quartiers_count} quartier{r.quartiers_count > 1 ? 's' : ''} →</Pill>
        : <Pill bg={C.amberBg} tx={C.amberTx}>Aucun quartier</Pill> },
      date,
    ];
    return [
      { key: 'nom', label: 'Quartier', sort: (r: any) => norm(r.nom), render: nameCell(MapPin) },
      { key: 'ville_nom', label: 'Ville', sort: (r: any) => norm(r.ville_nom), render: (r: any) => <Pill bg={C.pale} tx={C.blueD}>{r.ville_nom}</Pill> },
      { key: 'district_nom', label: 'District', sort: (r: any) => norm(r.district_nom), render: (r: any) => <Pill bg={C.violetBg} tx={C.violet}>{r.district_nom}</Pill> },
      date,
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const rows = useMemo(() => {
    const q = norm(search);
    let r: any[] = tab === 'districts' ? districts : tab === 'villes' ? villes : quartiers;
    if (tab === 'villes' && districtFilter) r = r.filter((x) => x.district === Number(districtFilter));
    if (tab === 'quartiers') {
      if (villeFilter) r = r.filter((x) => x.ville === Number(villeFilter));
      else if (districtFilter) {
        const ids = new Set(villes.filter((v) => v.district === Number(districtFilter)).map((v) => v.id));
        r = r.filter((x) => ids.has(x.ville));
      }
    }
    if (onlyEmpty) r = r.filter((x) => (tab === 'districts' ? x.villes_count === 0 : tab === 'villes' ? x.quartiers_count === 0 : false));
    if (q) r = r.filter((x) => norm([x.nom, x.district_nom, x.ville_nom].filter(Boolean).join(' ')).includes(q));
    const col = columns.find((c) => c.key === sortKey) || columns[0];
    return [...r].sort((a, b) => {
      const x = col.sort(a), y = col.sort(b);
      const cmp = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'fr');
      return asc ? cmp : -cmp;
    });
  }, [tab, districts, villes, quartiers, districtFilter, villeFilter, onlyEmpty, search, columns, sortKey, asc]);

  useEffect(() => setPage(1), [tab, search, districtFilter, villeFilter, onlyEmpty, perPage, sortKey, asc]);
  const totalPages = Math.max(1, Math.ceil(rows.length / perPage));
  const slice = rows.slice((page - 1) * perPage, page * perPage);

  const emptyVilles = villes.filter((v) => v.quartiers_count === 0).length;
  const emptyDistricts = districts.filter((d) => d.villes_count === 0).length;
  const canFilterEmpty = tab !== 'quartiers';
  const emptyCount = tab === 'districts' ? emptyDistricts : emptyVilles;

  const exportCsv = () => {
    const head = columns.map((c) => c.label);
    const lines = rows.map((r) => columns.map((c) => `"${String(c.key === 'date_creation' ? fmtDate(r.date_creation) : r[c.key] ?? '').replace(/"/g, '""')}"`).join(';'));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\ufeff' + [head.join(';'), ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' }));
    a.download = `decoupage_${tab}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  /* ─── Formulaire ─── */
  const openCreate = () => {
    setForm({ mode: 'create', item: null });
    setNom(''); setBatch(false); setBatchText(''); setFormError(null);
    setParent(tab === 'villes' ? districtFilter : tab === 'quartiers' ? villeFilter : '');
  };
  const openEdit = (item: any) => {
    setForm({ mode: 'edit', item });
    setNom(item.nom); setBatch(false); setBatchText(''); setFormError(null);
    setParent(String(tab === 'villes' ? item.district : tab === 'quartiers' ? item.ville : ''));
  };
  const closeForm = useCallback(() => { if (!saving) setForm(null); }, [saving]);

  /** Noms déjà utilisés sous le même parent (comparaison sans accents ni casse). */
  const takenNames = (excludeId?: number) => {
    const list: any[] = tab === 'districts' ? districts : tab === 'villes' ? villes.filter((v) => String(v.district) === parent) : quartiers.filter((q) => String(q.ville) === parent);
    return new Set(list.filter((x) => x.id !== excludeId).map((x) => norm(x.nom)));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setFormError(null);
    const needsParent = tab !== 'districts';
    if (needsParent && !parent) { setFormError(`Choisissez ${tab === 'villes' ? 'un district' : 'une ville'}.`); return; }

    const names = (form.mode === 'create' && batch ? batchText.split('\n') : [nom]).map((n) => n.trim().replace(/\s+/g, ' ')).filter(Boolean);
    if (names.length === 0) { setFormError(`Saisissez le nom ${tab === 'quartiers' ? 'du' : 'du'} ${SINGULAR[tab]}.`); return; }

    const taken = takenNames(form.item?.id);
    const seen = new Set<string>();
    const dups: string[] = [], todo: string[] = [];
    names.forEach((n) => {
      const k = norm(n);
      if (taken.has(k) || seen.has(k)) dups.push(n); else { seen.add(k); todo.push(n); }
    });
    if (todo.length === 0) { setFormError(`${dups.length > 1 ? 'Ces noms existent déjà' : 'Ce nom existe déjà'} ici : ${dups.join(', ')}.`); return; }

    const payloadFor = (n: string) => ({ nom: n, ...(tab === 'villes' ? { district: Number(parent) } : tab === 'quartiers' ? { ville: Number(parent) } : {}) });
    setSaving(true);
    const failures: string[] = [];
    try {
      if (form.mode === 'edit') {
        try { await send('patch', `/${tab}/${form.item.id}/`, payloadFor(todo[0])); }
        catch (err: any) { failures.push(`${todo[0]} (${err.message})`); }
      } else {
        for (const n of todo) {
          try { await send('post', `/${tab}/`, payloadFor(n)); }
          catch (err: any) { failures.push(`${n} (${err.message})`); }
        }
      }
      await loadAll();
    } finally { setSaving(false); }

    if (failures.length) {
      setFormError(`Non enregistré : ${failures.join(' ; ')}${dups.length ? `. Déjà existants, ignorés : ${dups.join(', ')}` : ''}`);
      if (batch) setBatchText(failures.map((f) => f.replace(/ \(.*\)$/, '')).join('\n'));
      return;
    }
    setForm(null);
  };

  /* ─── Suppression ─── */
  const impact = useMemo(() => {
    if (!toDelete) return null;
    if (tab === 'districts') {
      const vs = villes.filter((v) => v.district === toDelete.id);
      return { villes: vs.length, quartiers: vs.reduce((a, v) => a + v.quartiers_count, 0) };
    }
    if (tab === 'villes') return { villes: 0, quartiers: toDelete.quartiers_count as number };
    return { villes: 0, quartiers: 0 };
  }, [toDelete, tab, villes]);

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true); setDeleteError(null);
    try { await remove(`/${tab}/${toDelete.id}/`); await loadAll(); setToDelete(null); }
    catch (e: any) { setDeleteError(e.message); }
    finally { setDeleting(false); }
  };

  const tabs: { id: Tab; icon: React.ComponentType<any>; count: number }[] = [
    { id: 'districts', icon: Globe, count: districts.length },
    { id: 'villes', icon: Building2, count: villes.length },
    { id: 'quartiers', icon: MapPin, count: quartiers.length },
  ];

  if (loading) {
    return <div style={{ ...card, padding: 48, textAlign: 'center' }}><style>{CSS}</style><Loader2 className="loc-spin" size={24} style={{ color: C.blue, margin: '0 auto' }} /></div>;
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <style>{CSS}</style>

      {/* Bandeau */}
      <div style={{ background: C.navy, borderRadius: 16, padding: 20, display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <MapPin size={16} style={{ color: C.blueL }} />
            <span style={{ color: 'rgba(200,230,248,.9)', fontSize: 12, fontWeight: 600 }}>LanfiaLink Découpage</span>
          </div>
          <p style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>Organiser le territoire : districts, villes et quartiers</p>
          <p style={{ color: 'rgba(200,230,248,.85)', fontSize: 12, marginTop: 6, maxWidth: 560 }}>
            Ce découpage structure les zones, les tournées et les campagnes. Les points de vente déjà recensés gardent leurs libellés si vous modifiez un nom ici.
          </p>
        </div>
        <button onClick={openCreate} style={btn(C.blue)}><Plus size={14} /> Ajouter un {SINGULAR[tab]}</button>
      </div>

      {error && (
        <div role="alert" style={{ display: 'flex', gap: 10, alignItems: 'center', padding: 12, borderRadius: 12, background: C.redBg, color: C.redTx, fontSize: 12 }}>
          <AlertTriangle size={14} /><span style={{ flex: 1 }}>{error}</span>
          <button onClick={loadAll} style={{ ...btnGhost, padding: '4px 10px', color: C.redTx }}>Réessayer</button>
        </div>
      )}

      {/* KPI */}
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
        <Kpi label="Districts" value={districts.length} sub={emptyDistricts ? `${emptyDistricts} sans ville` : 'Tous contiennent des villes'} color={C.blueD} icon={Globe} />
        <Kpi label="Villes" value={villes.length} sub={`Sur ${districts.length} district${districts.length > 1 ? 's' : ''}`} color={C.violet} icon={Building2} />
        <Kpi label="Quartiers" value={quartiers.length} sub={`Sur ${villes.length} ville${villes.length > 1 ? 's' : ''}`} color={C.green} icon={MapPin} />
        <Kpi label="Villes sans quartier" value={emptyVilles} sub={emptyVilles ? 'À compléter pour localiser les PDV' : 'Découpage complet'} color={emptyVilles ? C.amber : C.green} icon={AlertTriangle} />
      </div>

      {/* Onglets */}
      <div style={{ display: 'inline-flex', gap: 2, padding: 4, borderRadius: 12, background: C.pale, border: `0.5px solid ${C.line}`, justifySelf: 'start' }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => goTab(t.id)} aria-pressed={tab === t.id}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', background: tab === t.id ? C.blue : 'transparent', color: tab === t.id ? '#fff' : C.greyTx }}>
            <t.icon size={12} />{PLURAL_CAP[t.id]}
            <span style={{ background: tab === t.id ? 'rgba(255,255,255,.25)' : '#fff', color: tab === t.id ? '#fff' : C.blueD, borderRadius: 99, fontSize: 10, padding: '0 6px' }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Tableau */}
      <div style={{ ...card, padding: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 300 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
            <input aria-label={`Rechercher un ${SINGULAR[tab]}`} placeholder={`Rechercher un ${SINGULAR[tab]}…`} value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...input, paddingLeft: 30 }} />
          </div>
          {tab !== 'districts' && (
            <select aria-label="Filtrer par district" value={districtFilter} onChange={(e) => { setDistrictFilter(e.target.value); setVilleFilter(''); }} style={{ ...input, width: 'auto', minWidth: 170 }}>
              <option value="">Tous les districts</option>
              {districts.map((d) => <option key={d.id} value={d.id}>{d.nom}</option>)}
            </select>
          )}
          {tab === 'quartiers' && (
            <select aria-label="Filtrer par ville" value={villeFilter} onChange={(e) => setVilleFilter(e.target.value)} style={{ ...input, width: 'auto', minWidth: 170 }}>
              <option value="">Toutes les villes</option>
              {villeOptions.map((v) => <option key={v.id} value={v.id}>{v.nom}</option>)}
            </select>
          )}
          {canFilterEmpty && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.sub, cursor: 'pointer' }}>
              <input type="checkbox" checked={onlyEmpty} onChange={(e) => setOnlyEmpty(e.target.checked)} style={{ accentColor: C.blue }} />
              {tab === 'districts' ? 'Sans ville' : 'Sans quartier'} ({emptyCount})
            </label>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{rows.length} résultat{rows.length > 1 ? 's' : ''}</span>
            <select aria-label="Lignes par page" value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} style={{ ...input, height: 30, width: 'auto', fontSize: 11 }}>
              {[10, 20, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}
            </select>
            <button onClick={exportCsv} disabled={rows.length === 0} style={{ ...btnGhost, padding: '5px 10px' }}><Download size={12} /> CSV</button>
          </div>
        </div>

        {rows.length === 0 ? (
          <div style={{ padding: '36px 16px', textAlign: 'center' }}>
            <MapPin size={28} style={{ color: '#B8D4E8', margin: '0 auto 10px' }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: C.sub, marginBottom: 4 }}>
              {(tab === 'districts' ? districts : tab === 'villes' ? villes : quartiers).length === 0 ? `Aucun ${SINGULAR[tab]} pour l'instant` : 'Aucun résultat'}
            </p>
            <p style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>
              {(tab === 'districts' ? districts : tab === 'villes' ? villes : quartiers).length === 0 ? `Ajoutez votre premier ${SINGULAR[tab]} pour structurer le territoire.` : 'Modifiez la recherche ou les filtres.'}
            </p>
            <button onClick={openCreate} style={btn(C.blue)}><Plus size={13} /> Ajouter un {SINGULAR[tab]}</button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.lineL}` }}>
                  {columns.map((c) => (
                    <th key={c.key} className="loc-th" onClick={() => { if (sortKey === c.key) setAsc((a) => !a); else { setSortKey(c.key); setAsc(true); } }}
                      aria-sort={sortKey === c.key ? (asc ? 'ascending' : 'descending') : undefined}
                      style={{ padding: '0 12px 10px 0', textAlign: 'left', fontSize: 11, fontWeight: 700, color: sortKey === c.key ? C.blueD : C.muted, whiteSpace: 'nowrap' }}>
                      {c.label}{sortKey === c.key && (asc ? ' ↑' : ' ↓')}
                    </th>
                  ))}
                  <th style={{ padding: '0 0 10px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: C.muted }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {slice.map((r) => (
                  <tr key={r.id} className="loc-row" style={{ borderBottom: `1px solid ${C.surface}` }}>
                    {columns.map((c) => <td key={c.key} style={{ padding: '10px 12px 10px 0' }}>{c.render(r)}</td>)}
                    <td style={{ padding: '10px 0', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button className="loc-icon" onClick={() => openEdit(r)} aria-label={`Modifier ${r.nom}`} title="Modifier" style={{ padding: 7, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer' }}><Pencil size={14} style={{ color: C.blue }} /></button>
                      <button className="loc-icon" onClick={() => { setToDelete(r); setDeleteError(null); }} aria-label={`Supprimer ${r.nom}`} title="Supprimer" style={{ padding: 7, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash2 size={14} style={{ color: C.red }} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>Page {page} sur {totalPages}</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} aria-label="Page précédente" style={{ ...btnGhost, padding: '5px 9px', opacity: page === 1 ? 0.5 : 1 }}><ChevronLeft size={13} /></button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page === totalPages} aria-label="Page suivante" style={{ ...btnGhost, padding: '5px 9px', opacity: page === totalPages ? 0.5 : 1 }}><ChevronRight size={13} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Formulaire */}
      {form && (
        <Modal
          title={`${form.mode === 'edit' ? 'Modifier le' : 'Nouveau'} ${SINGULAR[tab]}`}
          onClose={closeForm}
          footer={<>
            <button type="button" onClick={closeForm} disabled={saving} style={btnGhost}>Annuler</button>
            <button type="submit" form="loc-form" disabled={saving} style={{ ...btn(C.navy), opacity: saving ? 0.7 : 1 }}>
              {saving ? <Loader2 size={13} className="loc-spin" /> : form.mode === 'edit' ? <Pencil size={13} /> : <Plus size={13} />}
              {saving ? 'Enregistrement…' : form.mode === 'edit' ? 'Enregistrer' : batch ? 'Créer la liste' : 'Créer'}
            </button>
          </>}>
          <form id="loc-form" onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
            {formError && <ErrorBox>{formError}</ErrorBox>}

            {tab === 'villes' && (
              <Field label="District">
                <select style={input} value={parent} onChange={(e) => setParent(e.target.value)} required>
                  <option value="">Choisir un district…</option>
                  {districts.map((d) => <option key={d.id} value={d.id}>{d.nom}</option>)}
                </select>
              </Field>
            )}
            {tab === 'quartiers' && (
              <Field label="Ville">
                <select style={input} value={parent} onChange={(e) => setParent(e.target.value)} required>
                  <option value="">Choisir une ville…</option>
                  {villes.map((v) => <option key={v.id} value={v.id}>{v.nom} · {v.district_nom}</option>)}
                </select>
              </Field>
            )}

            {batch && form.mode === 'create' ? (
              <Field label={`Noms des ${PLURAL_CAP[tab].toLowerCase()}`} hint="Un nom par ligne. Les doublons sont ignorés.">
                <textarea style={{ ...input, height: 150, padding: 10, resize: 'vertical' }} value={batchText} onChange={(e) => setBatchText(e.target.value)} placeholder={'Angré\nRiviera 2\nDeux Plateaux'} autoFocus />
              </Field>
            ) : (
              <Field label="Nom">
                <input style={input} value={nom} onChange={(e) => setNom(e.target.value)} placeholder={`Nom du ${SINGULAR[tab]}`} autoFocus required />
              </Field>
            )}

            {form.mode === 'create' && (
              <button type="button" onClick={() => setBatch((b) => !b)} style={{ ...btnGhost, justifySelf: 'start' }}>
                <ListPlus size={13} /> {batch ? 'Ajouter un seul nom' : 'Ajouter plusieurs à la fois'}
              </button>
            )}
          </form>
        </Modal>
      )}

      {/* Confirmation de suppression */}
      {toDelete && impact && (
        <Modal title={`Supprimer ${toDelete.nom} ?`} onClose={() => !deleting && setToDelete(null)}
          footer={<>
            <button onClick={() => setToDelete(null)} disabled={deleting} style={btnGhost}>Annuler</button>
            <button onClick={confirmDelete} disabled={deleting} style={{ ...btn(C.red), opacity: deleting ? 0.7 : 1 }}>
              {deleting ? <Loader2 size={13} className="loc-spin" /> : <Trash2 size={13} />} Supprimer définitivement
            </button>
          </>}>
          {deleteError && <ErrorBox>{deleteError}</ErrorBox>}
          {impact.villes + impact.quartiers > 0 ? (
            <ErrorBox tone="amber">
              Cette suppression retire aussi{' '}
              {impact.villes > 0 && <strong>{impact.villes} ville{impact.villes > 1 ? 's' : ''}</strong>}
              {impact.villes > 0 && impact.quartiers > 0 && ' et '}
              {impact.quartiers > 0 && <strong>{impact.quartiers} quartier{impact.quartiers > 1 ? 's' : ''}</strong>}.
            </ErrorBox>
          ) : null}
          <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.6 }}>
            Le {SINGULAR[tab]} sera supprimé du découpage. Cette action est définitive. Les points de vente déjà recensés conservent leurs libellés.
          </p>
        </Modal>
      )}
    </div>
  );
};

export default LocalisationManagement;