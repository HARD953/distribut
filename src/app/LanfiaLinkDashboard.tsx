"use client";
// components/dashboard/LanfiaLinkDashboard.tsx
// Analyse POS : direction, marketing, opérations, ciblage business, Merchant Graph, carte, fiche PDV.
// Même langage visuel que les vues Activations, Analytiques, Découpage et Géolocalisation.

import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ScatterChart, Scatter, LineChart, Line, AreaChart, Area, Legend, ZAxis,
} from "recharts";
import {
  MapPin, Store, BadgePercent, TrendingUp, Camera, Target, BarChart3, Users, CheckCircle2,
  Layers3, Gauge, Search, Download, ShieldCheck, Loader2, AlertTriangle, X, ChevronLeft,
  ChevronRight, ChevronDown, ZoomIn, Navigation, Activity, Eye, Zap, Globe, Building2, Ruler,
  Swords, Calendar, SlidersHorizontal, Wifi, Landmark, ShoppingBag, Smartphone, Megaphone,
  Briefcase, Sparkles, FileText, Network, Flame, Maximize2, Minimize2, Play, Pause, Crosshair,
  RotateCcw, Palette, RefreshCw,
} from "lucide-react";
import { apiService } from "./ApiService";
import MerchantGraphView from "./MerchantGraphView";

/* ─── Palette ─────────────────────────────────────────────── */
const C = {
  blue: "#1A8FD1", blueD: "#0D6FAB", blueL: "#4FB3E8", navy: "#0D4E7A",
  pale: "#EDF5FA", surface: "#F0F5F9", line: "#C0D4E6", lineL: "#D4E4F0",
  text: "#0A1E2E", sub: "#2A4A62", muted: "#5A7A92",
  green: "#0A9E7A", greenBg: "#DCF5EC", greenTx: "#044D38",
  amber: "#D08A00", amberBg: "#FBEFD6", amberTx: "#7A4F00",
  red: "#B03318", redBg: "#FCE4DC", redTx: "#7A2410",
  greyBg: "#EAF0F5", greyTx: "#3A5A72", violet: "#2E4DB0", violetBg: "#D4DCFA",
};
const CHART_COLORS = ["#1A8FD1", "#0D4E7A", "#4FB3E8", "#0A9E7A", "#D08A00", "#2E4DB0", "#B03318", "#6A8AA2"];
const OPERATOR_COLORS: Record<string, string> = { moov: "#00A651", orange: "#FF6600", mtn: "#FFCC00", wave: "#1DC4E9" };
const POTENTIEL_COLORS: Record<string, string> = {
  "premium": C.violet, "fort potentiel": C.green, "développement": C.amber, "developpement": C.amber, "standard": C.muted,
};
const MAP_LAYER_COLORS: Record<string, string> = {
  all: C.blue, brandes: C.green, nonbrandes: C.amber, eligibles: C.violet, premium: C.navy, gps: C.blueL,
};

/** Couleur d'un marqueur selon le score. */
function scoreColor(score: number) {
  if (score >= 80) return C.violet;
  if (score >= 65) return C.green;
  if (score >= 45) return C.amber;
  return C.blue;
}
function scoreBadge(score: number) {
  if (score >= 80) return { label: "Premium", bg: C.violetBg, tx: C.violet };
  if (score >= 65) return { label: "Fort potentiel", bg: C.greenBg, tx: C.greenTx };
  if (score >= 45) return { label: "Développement", bg: C.amberBg, tx: C.amberTx };
  return { label: "Standard", bg: C.greyBg, tx: C.greyTx };
}

/* ─── Styles ──────────────────────────────────────────────── */
const card: React.CSSProperties = { background: "#fff", border: `0.5px solid ${C.line}`, borderRadius: 16 };
const inputStyle: React.CSSProperties = {
  width: "100%", height: 36, borderRadius: 10, padding: "0 10px", fontSize: 13, background: "#fff",
  border: `1.5px solid ${C.line}`, color: C.text, outline: "none", fontFamily: "inherit",
};
const btn = (bg: string, color = "#fff"): React.CSSProperties => ({
  display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, background: bg,
  color, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit",
});
const btnGhost: React.CSSProperties = { ...btn("#fff", C.sub), border: `1px solid ${C.line}` };

const GLOBAL_CSS = `
@keyframes lf-pop   { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes lf-ring  { 0% { transform: scale(.7); opacity: .85; } 100% { transform: scale(1.9); opacity: 0; } }
@keyframes lf-slide { from { transform: translateY(-6px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes lf-spin  { to { transform: rotate(360deg); } }
.lf-spin { animation: lf-spin .8s linear infinite; }
.lf-row:hover { background: #F5FAFD; }
.lf-th { cursor: pointer; user-select: none; }
.lf-th:hover { color: ${C.blueD}; }
.lf-mapbtn { display:inline-flex; align-items:center; gap:5px; padding:6px 10px; border-radius:10px; font-size:11px; font-weight:700;
  background:rgba(255,255,255,.96); color:${C.sub}; border:1px solid ${C.line}; box-shadow:0 2px 8px rgba(10,30,46,.12); cursor:pointer; font-family:inherit; }
.lf-mapbtn[data-active="true"] { background:${C.blue}; color:#fff; border-color:${C.blue}; }
.lf-marker { width:30px; height:30px; border-radius:50%; background:var(--c); border:2.5px solid #fff; box-shadow:0 2px 8px rgba(10,30,46,.35);
  display:flex; align-items:center; justify-content:center; color:#fff; font:700 10px system-ui,sans-serif; position:relative;
  animation: lf-pop .5s cubic-bezier(.34,1.56,.64,1) backwards; transition: transform .15s ease; }
.lf-marker:hover { transform:scale(1.3); z-index:999; }
.lf-pulse::after { content:""; position:absolute; inset:-5px; border-radius:50%; border:2px solid var(--c); animation: lf-ring 1.8s ease-out infinite; pointer-events:none; }
.lf-cluster { border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; font:800 13px system-ui,sans-serif;
  background:${C.blueD}; border:3px solid #fff; box-shadow:0 0 0 6px rgba(26,143,209,.22), 0 4px 14px rgba(10,30,46,.35); }
.lf-popup .leaflet-popup-content-wrapper { padding:0; overflow:hidden; border-radius:16px; box-shadow:0 12px 32px rgba(10,30,46,.28); }
.lf-popup .leaflet-popup-content { margin:0; width:270px !important; }
.lf-pop-head { display:flex; align-items:center; gap:10px; padding:12px 14px; color:#fff; }
.lf-pop-score { min-width:40px; height:40px; border-radius:12px; background:rgba(255,255,255,.2); border:1px solid rgba(255,255,255,.35); display:flex; align-items:center; justify-content:center; font:800 16px system-ui,sans-serif; }
.lf-pop-name { margin:0; font:700 14px system-ui,sans-serif; line-height:1.2; }
.lf-pop-sub { margin:2px 0 0; font:500 11px system-ui,sans-serif; opacity:.85; }
.lf-pop-body { padding:12px 14px 14px; font-family:system-ui,sans-serif; }
.lf-pop-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; margin:8px 0; font-size:11px; }
.lf-pop-grid > div { border-radius:8px; padding:5px 8px; }
.lf-pop-bar { height:5px; border-radius:99px; background:#E6EEF4; overflow:hidden; }
.lf-pop-bar > i { display:block; height:100%; border-radius:99px; }
.lf-pop-date { margin:8px 0; font-size:10px; color:${C.muted}; }
.lf-pop-btn { width:100%; padding:8px; border:none; border-radius:8px; background:${C.blue}; color:#fff; font:600 12px system-ui,sans-serif; cursor:pointer; }
.lf-pop-btn:hover { background:${C.blueD}; }
.lf-tip { border-radius:8px !important; border:none !important; box-shadow:0 4px 14px rgba(10,30,46,.25) !important; font:600 11px system-ui,sans-serif !important; color:${C.text} !important; padding:4px 8px !important; }
@media (prefers-reduced-motion: reduce) { .lf-marker, .lf-pulse::after, .lf-spin { animation: none !important; } }
`;

/* ─── Logos opérateurs ────────────────────────────────────── */
const OPERATOR_LOGOS: Record<string, React.ReactNode> = {
  moov: (<svg viewBox="0 0 60 24" width="48" height="20" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="24" rx="4" fill="#00A651" /><text x="30" y="17" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="bold" fontSize="12" fill="#FFFFFF">Moov</text></svg>),
  orange: (<svg viewBox="0 0 60 24" width="48" height="20" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="24" rx="4" fill="#FF6600" /><text x="30" y="17" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="bold" fontSize="11" fill="#FFFFFF">orange</text></svg>),
  mtn: (<svg viewBox="0 0 60 24" width="48" height="20" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="24" rx="4" fill="#FFCC00" /><text x="30" y="17" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="bold" fontSize="13" fill="#000000">MTN</text></svg>),
  wave: (<svg viewBox="0 0 60 24" width="48" height="20" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="24" rx="4" fill="#1DC4E9" /><text x="30" y="17" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="bold" fontSize="12" fill="#FFFFFF">Wave</text></svg>),
};
const OPS = ["moov", "orange", "mtn", "wave"] as const;
const OpsRow = ({ p, size }: { p: PointOfSale; size?: "sm" }) => (
  <span style={{ display: "inline-flex", gap: 3, flexWrap: "wrap" }}>
    {OPS.map((op) => (
      <span key={op} style={{ opacity: p[op] ? 1 : 0.22, transform: size === "sm" ? "scale(.85)" : undefined, transformOrigin: "left center" }}>{OPERATOR_LOGOS[op]}</span>
    ))}
  </span>
);

/* ─── Types ───────────────────────────────────────────────── */
interface Photo { id: number; image: string; thumbnail: string; type: string; caption: string; order: number }
interface PointOfSale {
  id: number; name: string; commune: string; quartier: string; district: string; region: string; type: string; status: string;
  branding: string; potentiel: string; potentiel_label: string;
  visibilite: number; accessibilite: number; affluence: number; digitalisation: number;
  moov: boolean; orange: boolean; mtn: boolean; wave: boolean; nb_operateurs: number;
  photos: Photo[]; photos_count: number;
  scoreA: number; scoreD: number; scoreE: number; score: number;
  agent: string; agent_name: string; gpsValid: boolean; ficheComplete: boolean;
  eligibiliteBranding: boolean; eligibiliteExclusivite: boolean; eligibiliteActivation: boolean;
  grandeVoie: boolean; caMensuel: number; dateCollecte: string;
  latitude: number; longitude: number; address: string; phone: string; owner: string;
  nb_concurrents: string; nb_concurrents_label: string; classe_quartier: string; classe_quartier_label: string;
  anciennete_annees: number; facade_metres: number; nature: string;
}
interface AgentPerformance { agent: string; agent_name: string; total: number; gps_rate: number; complete_rate: number; photo_avg: number }
interface FilterOption { value: string; label: string }
type MapLayer = "all" | "brandes" | "nonbrandes" | "eligibles" | "premium" | "gps";
type ViewId = "executif" | "marketing" | "operations" | "ciblage" | "graphe" | "carte" | "fiche";

/* ─── Ciblage business ────────────────────────────────────── */
interface CriteriaWeights {
  visibilite: number; accessibilite: number; affluence: number; digitalisation: number;
  facade: number; anciennete: number; concurrence: number; classeQuartier: number;
}
interface HardFilters { minOperateurs: number; requireGrandeVoie: boolean; minFacade: number; brandingRequis: "Tous" | "Brandé" | "Non brandé" }
interface BusinessTemplate {
  id: string; label: string; secteur: string; icon: any; color: string; description: string;
  weights: CriteriaWeights; hardFilters: HardFilters; facadeTarget: number; ancienneteTarget: number;
  classePreferences: Record<string, number>;
}
interface TargetingResult extends PointOfSale { matchScore: number; why: string[] }

const CRITERIA: [keyof CriteriaWeights, string][] = [
  ["visibilite", "Visibilité"], ["accessibilite", "Accessibilité"], ["affluence", "Affluence"],
  ["digitalisation", "Digitalisation (opérateurs)"], ["facade", "Taille de façade"], ["anciennete", "Ancienneté / stabilité"],
  ["concurrence", "Faible concurrence"], ["classeQuartier", "Profil du quartier"],
];
const DEFAULT_HARD: HardFilters = { minOperateurs: 0, requireGrandeVoie: false, minFacade: 0, brandingRequis: "Tous" };

const BUSINESS_TEMPLATES: BusinessTemplate[] = [
  { id: "agency-banking", label: "Agency Banking", secteur: "Banque & services financiers", icon: Landmark, color: C.navy,
    description: "PDV à fort trafic et bien desservis, pour déployer des agents bancaires, DAB ou points mobile money.",
    weights: { visibilite: 10, accessibilite: 20, affluence: 20, digitalisation: 20, facade: 5, anciennete: 10, concurrence: 10, classeQuartier: 5 },
    hardFilters: { ...DEFAULT_HARD, minOperateurs: 1 }, facadeTarget: 6, ancienneteTarget: 3,
    classePreferences: { populaire: 90, moyen: 80, "résident": 60, affaires: 55, "huppé": 45 } },
  { id: "distribution-fmcg", label: "Distribution & FMCG", secteur: "Grande consommation", icon: ShoppingBag, color: C.amber,
    description: "Boutiques à forte affluence et bonne visibilité, adaptées à la distribution de produits de grande consommation.",
    weights: { visibilite: 20, accessibilite: 15, affluence: 25, digitalisation: 5, facade: 20, anciennete: 5, concurrence: 5, classeQuartier: 5 },
    hardFilters: { ...DEFAULT_HARD }, facadeTarget: 8, ancienneteTarget: 4,
    classePreferences: { populaire: 85, moyen: 75, "résident": 60, affaires: 55, "huppé": 45 } },
  { id: "activation-telco", label: "Activation Télécom", secteur: "Télécom & Mobile Money", icon: Smartphone, color: C.green,
    description: "PDV multi-opérateurs pour la recharge, le mobile money et les opérations d'activation terrain.",
    weights: { visibilite: 10, accessibilite: 15, affluence: 20, digitalisation: 35, facade: 5, anciennete: 5, concurrence: 5, classeQuartier: 5 },
    hardFilters: { ...DEFAULT_HARD, minOperateurs: 2 }, facadeTarget: 5, ancienneteTarget: 2,
    classePreferences: { populaire: 80, moyen: 75, "résident": 55, affaires: 55, "huppé": 45 } },
  { id: "branding-ooh", label: "Publicité Extérieure (OOH)", secteur: "Communication & Branding", icon: Megaphone, color: C.violet,
    description: "Grandes façades sur axes passants, adaptées aux campagnes de branding et de publicité extérieure.",
    weights: { visibilite: 30, accessibilite: 10, affluence: 15, digitalisation: 0, facade: 30, anciennete: 5, concurrence: 0, classeQuartier: 10 },
    hardFilters: { ...DEFAULT_HARD, requireGrandeVoie: true, minFacade: 4 }, facadeTarget: 12, ancienneteTarget: 3,
    classePreferences: { affaires: 85, "huppé": 80, "résident": 60, moyen: 55, populaire: 45 } },
  { id: "microfinance", label: "Microfinance & Assurance", secteur: "Inclusion financière", icon: Briefcase, color: C.red,
    description: "Zones populaires sous-équipées et peu concurrencées, pour l'implantation de points de proximité.",
    weights: { visibilite: 5, accessibilite: 20, affluence: 20, digitalisation: 10, facade: 5, anciennete: 10, concurrence: 25, classeQuartier: 5 },
    hardFilters: { ...DEFAULT_HARD }, facadeTarget: 5, ancienneteTarget: 3,
    classePreferences: { populaire: 95, moyen: 70, "résident": 45, affaires: 30, "huppé": 20 } },
  { id: "custom", label: "Ciblage personnalisé", secteur: "Sur mesure", icon: Sparkles, color: C.blue,
    description: "Définissez vous-même le poids de chaque critère selon le besoin exact du client.",
    weights: { visibilite: 15, accessibilite: 15, affluence: 15, digitalisation: 15, facade: 10, anciennete: 10, concurrence: 10, classeQuartier: 10 },
    hardFilters: { ...DEFAULT_HARD }, facadeTarget: 8, ancienneteTarget: 4, classePreferences: {} },
];

const normalizeStr = (s: string) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/** Score 0-100 : moins il y a de concurrents à 300 m, plus le score est élevé. */
function scoreConcurrenceLabel(label: string): number {
  const n = normalizeStr(label);
  if (!n) return 50;
  if (n.includes("aucun")) return 100;
  const match = n.match(/\d+/);
  if (!match) return 60;
  return Math.max(5, 100 - parseInt(match[0], 10) * 18);
}
function scoreClassePreference(label: string, prefs: Record<string, number>): number {
  const n = normalizeStr(label);
  for (const key of Object.keys(prefs)) if (n.includes(normalizeStr(key))) return prefs[key];
  return 50;
}

/** Score de correspondance + les trois critères qui y contribuent le plus (score explicable). */
function computeMatch(p: PointOfSale, w: CriteriaWeights, facadeTarget: number, ancienneteTarget: number, prefs: Record<string, number>) {
  const sub: CriteriaWeights = {
    visibilite: p.visibilite, accessibilite: p.accessibilite, affluence: p.affluence, digitalisation: p.digitalisation,
    facade: Math.min(100, (p.facade_metres / Math.max(facadeTarget, 0.5)) * 100),
    anciennete: Math.min(100, (p.anciennete_annees / Math.max(ancienneteTarget, 0.5)) * 100),
    concurrence: scoreConcurrenceLabel(p.nb_concurrents_label),
    classeQuartier: scoreClassePreference(p.classe_quartier_label, prefs),
  };
  const keys = Object.keys(w) as (keyof CriteriaWeights)[];
  const total = keys.reduce((a, k) => a + w[k], 0) || 1;
  const score = Math.round(keys.reduce((a, k) => a + sub[k] * w[k], 0) / total);
  const why = keys.filter((k) => w[k] > 0)
    .sort((a, b) => (sub[b] * w[b]) - (sub[a] * w[a]))
    .slice(0, 3)
    .map((k) => `${CRITERIA.find((c) => c[0] === k)![1].replace(" (opérateurs)", "")} ${Math.round(sub[k])}`);
  return { score, why };
}
function passesHard(p: PointOfSale, hf: HardFilters): boolean {
  if (p.nb_operateurs < hf.minOperateurs) return false;
  if (hf.requireGrandeVoie && !p.grandeVoie) return false;
  if (p.facade_metres < hf.minFacade) return false;
  if (hf.brandingRequis !== "Tous" && p.branding !== hf.brandingRequis) return false;
  return true;
}

/* ─── Utilitaires ─────────────────────────────────────────── */
const fmt = (n: number) => (n ?? 0).toLocaleString("fr-FR");
const esc = (s: any): string => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as Record<string, string>)[c]);
const unique = (arr: string[]) => Array.from(new Set(arr.filter(Boolean))).sort();
function uniqueOptions(arr: FilterOption[]): FilterOption[] {
  const sv = new Set<string>(), sl = new Set<string>();
  return arr.filter((o) => {
    const nl = o.label.trim().toLowerCase();
    if (sv.has(o.value) || sl.has(nl)) return false;
    sv.add(o.value); sl.add(nl); return true;
  });
}
/** Export CSV : séparateur « ; » et BOM pour une ouverture correcte dans Excel. */
function downloadCsv(name: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((f) => `"${String(f ?? "").replace(/"/g, '""')}"`).join(";")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" }));
  a.download = name; a.click();
}
const today = () => new Date().toISOString().slice(0, 10);

/* ─── Petits composants ───────────────────────────────────── */
const Pill = ({ bg, tx, children }: { bg: string; tx: string; children: React.ReactNode }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, padding: "2px 9px", borderRadius: 99, fontWeight: 700, background: bg, color: tx, whiteSpace: "nowrap" }}>{children}</span>
);

const Kpi = ({ label, value, sub, color, icon: Icon }: { label: string; value: string; sub: string; color: string; icon: React.ComponentType<any> }) => (
  <div style={{ ...card, padding: 16 }}>
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <p style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>{label}</p><Icon size={15} style={{ color }} />
    </div>
    <p style={{ fontSize: 24, fontWeight: 700, color, marginTop: 4, lineHeight: 1.1 }}>{value}</p>
    <p style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>{sub}</p>
  </div>
);

const Panel = ({ title, subtitle, icon: Icon, right, children, span }: {
  title: string; subtitle?: string; icon: React.ComponentType<any>; right?: React.ReactNode; children: React.ReactNode; span?: boolean;
}) => (
  <div style={{ ...card, padding: 16, gridColumn: span ? "1 / -1" : undefined, minWidth: 0 }}>
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, paddingBottom: 12, marginBottom: 12, borderBottom: `0.5px solid ${C.lineL}`, flexWrap: "wrap" }}>
      <div>
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: C.text }}><Icon size={14} style={{ color: C.blue }} />{title}</span>
        {subtitle && <p style={{ fontSize: 11, color: C.muted, marginTop: 3, paddingLeft: 22 }}>{subtitle}</p>}
      </div>
      {right}
    </div>
    {children}
  </div>
);

const Empty = ({ title, text, height }: { title: string; text?: string; height?: number }) => (
  <div style={{ height, padding: "28px 16px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
    <BarChart3 size={28} style={{ color: "#B8D4E8", marginBottom: 10 }} />
    <p style={{ fontSize: 13, fontWeight: 600, color: C.sub, marginBottom: 4 }}>{title}</p>
    {text && <p style={{ fontSize: 12, color: C.muted, maxWidth: 340 }}>{text}</p>}
  </div>
);

const Field = ({ label, icon: Icon, children }: { label: string; icon?: React.ComponentType<any>; children: React.ReactNode }) => (
  <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: C.sub }}>
      {Icon && <Icon size={11} style={{ color: C.muted }} />}{label}
    </span>
    {children}
  </label>
);

const Select = ({ value, onChange, children, active }: { value: string; onChange: (v: string) => void; children: React.ReactNode; active?: boolean }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inputStyle, cursor: "pointer", ...(active ? { borderColor: C.blue, background: C.pale, fontWeight: 600 } : {}) }}>{children}</select>
);

const Bar1 = ({ label, value, max = 100, color, pct = false, target }: { label: string; value: number; max?: number; color: string; pct?: boolean; target?: string }) => {
  const p = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
        <span style={{ color: C.muted, fontWeight: 500 }}>{label}</span>
        <strong style={{ color: C.text }}>{pct ? `${value} %` : `${value}/${max}`}</strong>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: C.surface, overflow: "hidden" }}>
        <div style={{ width: `${p}%`, height: "100%", background: color, transition: "width .4s" }} />
      </div>
      {target && <p style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>{target}</p>}
    </div>
  );
};

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: `1px solid ${C.lineL}`, borderRadius: 10, padding: "8px 10px", fontSize: 12, boxShadow: "0 6px 20px rgba(10,30,46,.12)" }}>
      {label && <p style={{ fontWeight: 700, color: C.text, marginBottom: 4 }}>{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color || p.fill }} />
          <span style={{ color: C.muted }}>{p.name || p.dataKey}:</span>
          <strong style={{ color: C.text }}>{typeof p.value === "number" ? fmt(p.value) : p.value}</strong>
        </div>
      ))}
    </div>
  );
}
const axis = { tick: { fontSize: 11, fill: C.muted }, axisLine: false, tickLine: false } as const;

/* ─── Tableau : tri, recherche, pagination, CSV ───────────── */
interface Column<T> {
  key: string; label: string; align?: "left" | "right"; render?: (r: T) => React.ReactNode;
  sort?: (r: T) => number | string; csv?: (r: T) => string | number; hidden?: boolean;
}
function DataTable<T extends { id: number }>({ data, columns, searchKeys, exportName, emptyMsg, defaultSort, initialPerPage = 10 }: {
  data: T[]; columns: Column<T>[]; searchKeys: string[]; exportName: string; emptyMsg: string;
  defaultSort?: { key: string; asc: boolean }; initialPerPage?: number;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(initialPerPage);
  const [sortKey, setSortKey] = useState<string | null>(defaultSort?.key ?? null);
  const [asc, setAsc] = useState(defaultSort?.asc ?? false);
  const shown = columns.filter((c) => !c.hidden);

  const rows = useMemo(() => {
    let r = data;
    const q = search.trim().toLowerCase();
    if (q) r = r.filter((x) => searchKeys.some((k) => String((x as any)[k] ?? "").toLowerCase().includes(q)));
    const col = columns.find((c) => c.key === sortKey);
    if (col?.sort) {
      const f = col.sort;
      r = [...r].sort((a, b) => {
        const x = f(a), y = f(b);
        const cmp = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "fr");
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
    downloadCsv(`${exportName}_${today()}.csv`, [cols.map((c) => c.label), ...rows.map((r) => cols.map((c) => val(c, r)))]);
  };

  if (!data.length) return <Empty title={emptyMsg} text="Aucune donnée avec les filtres actuels." />;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ position: "relative" }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.muted }} />
          <input aria-label="Rechercher dans le tableau" placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, paddingLeft: 30, width: 230 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{fmt(rows.length)} résultat{rows.length > 1 ? "s" : ""}</span>
          <select aria-label="Lignes par page" value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} style={{ ...inputStyle, height: 30, width: "auto", fontSize: 11 }}>
            {[10, 20, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}
          </select>
          <button onClick={exportCsv} style={{ ...btnGhost, padding: "5px 10px" }}><Download size={12} /> CSV</button>
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.lineL}` }}>
              {shown.map((c) => (
                <th key={c.key} className={c.sort ? "lf-th" : undefined} aria-sort={sortKey === c.key ? (asc ? "ascending" : "descending") : undefined}
                  onClick={() => { if (!c.sort) return; if (sortKey === c.key) setAsc((a) => !a); else { setSortKey(c.key); setAsc(false); } }}
                  style={{ padding: "0 12px 10px 0", textAlign: c.align || "left", fontSize: 11, fontWeight: 700, color: sortKey === c.key ? C.blueD : C.muted, whiteSpace: "nowrap" }}>
                  {c.label}{sortKey === c.key && (asc ? " ↑" : " ↓")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((r) => (
              <tr key={r.id} className="lf-row" style={{ borderBottom: `1px solid ${C.surface}` }}>
                {shown.map((c) => <td key={c.key} style={{ padding: "10px 12px 10px 0", textAlign: c.align || "left", color: C.text }}>{c.render ? c.render(r) : c.sort ? String(c.sort(r)) : ""}</td>)}
              </tr>
            ))}
            {slice.length === 0 && <tr><td colSpan={shown.length}><Empty title="Aucun résultat" text="Modifiez la recherche." /></td></tr>}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
          <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>Page {page} sur {totalPages}</span>
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} aria-label="Page précédente" style={{ ...btnGhost, padding: "5px 9px", opacity: page === 1 ? 0.5 : 1 }}><ChevronLeft size={13} /></button>
            <button onClick={() => setPage((p) => p + 1)} disabled={page === totalPages} aria-label="Page suivante" style={{ ...btnGhost, padding: "5px 9px", opacity: page === totalPages ? 0.5 : 1 }}><ChevronRight size={13} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Carte Leaflet (CDN : clusters, chaleur) — chargée une seule fois
   ═══════════════════════════════════════════════════════════ */
let leafletPromise: Promise<void> | null = null;
const loadScript = (src: string) => new Promise<void>((resolve) => {
  const s = document.createElement("script");
  s.src = src; s.async = true; s.onload = () => resolve(); s.onerror = () => resolve(); // un plugin manquant ne bloque pas la carte
  document.head.appendChild(s);
});
function loadCss(id: string, href: string) {
  if (document.getElementById(id)) return;
  const l = document.createElement("link"); l.id = id; l.rel = "stylesheet"; l.href = href; document.head.appendChild(l);
}
function ensureLeaflet(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (!leafletPromise) {
    loadCss("leaflet-css", "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
    leafletPromise = (async () => {
      if (!(window as any).L) await loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js");
      await Promise.all([
        loadScript("https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"),
        loadScript("https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js"),
      ]);
    })();
  }
  return leafletPromise;
}
function useLeaflet() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    ensureLeaflet().then(() => { if (alive && (window as any).L) setReady(true); });
    return () => { alive = false; };
  }, []);
  return ready;
}

type TileKey = "clair" | "osm" | "sombre" | "satellite";
type MapMode = "cluster" | "markers" | "heat";
const TILES: Record<TileKey, { label: string; url: string; attr: string; subdomains?: string }> = {
  clair: { label: "Clair", url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", attr: "&copy; OpenStreetMap &copy; CARTO", subdomains: "abcd" },
  osm: { label: "OSM", url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attr: "&copy; OpenStreetMap" },
  sombre: { label: "Sombre", url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", attr: "&copy; OpenStreetMap &copy; CARTO", subdomains: "abcd" },
  satellite: { label: "Satellite", url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attr: "Tiles &copy; Esri" },
};
const MapChip = ({ active, onClick, title, children }: { active?: boolean; onClick: () => void; title?: string; children: React.ReactNode }) => (
  <button type="button" className="lf-mapbtn" data-active={active ? "true" : "false"} title={title} onClick={onClick}>{children}</button>
);

function LeafletMap({ points, activeLayer, onSelectPoint, scoreMin = 0, height = 460, compact = false }: {
  points: PointOfSale[]; activeLayer: MapLayer; onSelectPoint: (id: number) => void; scoreMin?: number; height?: number; compact?: boolean;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInst = useRef<any>(null);
  const tileRef = useRef<any>(null);
  const dataLayerRef = useRef<any>(null);
  const markersById = useRef<Map<number, any>>(new Map());
  const ready = useLeaflet();

  const [tile, setTile] = useState<TileKey>("clair");
  const [mode, setMode] = useState<MapMode>(compact ? "markers" : "cluster");
  const [colorBy, setColorBy] = useState<"score" | "couche">("score");
  const [fullscreen, setFullscreen] = useState(false);
  const [tourOn, setTourOn] = useState(false);
  const [tourInfo, setTourInfo] = useState<{ i: number; total: number; name: string } | null>(null);

  const geoPoints = useMemo(() => {
    const pts = points.filter((p) => p.score >= scoreMin);
    const byLayer = (() => {
      switch (activeLayer) {
        case "brandes": return pts.filter((p) => p.branding === "Brandé");
        case "nonbrandes": return pts.filter((p) => p.branding === "Non brandé");
        case "eligibles": return pts.filter((p) => p.eligibiliteBranding);
        case "premium": return pts.filter((p) => p.score >= 80);
        case "gps": return pts.filter((p) => p.gpsValid);
        default: return pts;
      }
    })();
    return byLayer.filter((p) => p.latitude && p.longitude);
  }, [points, activeLayer, scoreMin]);

  useEffect(() => {
    if (!ready || !mapRef.current || mapInst.current) return;
    const L = (window as any).L;
    const m = L.map(mapRef.current, { center: [5.345, -4.0], zoom: 12, zoomControl: false });
    L.control.zoom({ position: "bottomright" }).addTo(m);
    mapInst.current = m;
    return () => { m.remove(); mapInst.current = null; tileRef.current = null; dataLayerRef.current = null; };
  }, [ready]);

  useEffect(() => {
    if (!ready || !mapInst.current) return;
    const L = (window as any).L, cfg = TILES[tile];
    if (tileRef.current) tileRef.current.remove();
    tileRef.current = L.tileLayer(cfg.url, { attribution: cfg.attr, maxZoom: 19, subdomains: cfg.subdomains || "abc" }).addTo(mapInst.current);
    tileRef.current.bringToBack();
  }, [ready, tile]);

  useEffect(() => {
    if (!ready || !mapInst.current) return;
    const L = (window as any).L, map = mapInst.current;
    if (dataLayerRef.current) { map.removeLayer(dataLayerRef.current); dataLayerRef.current = null; }
    markersById.current.clear();
    if (!geoPoints.length) return;

    if (mode === "heat" && L.heatLayer) {
      dataLayerRef.current = L.heatLayer(
        geoPoints.map((p) => [p.latitude, p.longitude, Math.max(0.15, p.score / 100)]),
        { radius: 28, blur: 22, maxZoom: 15, gradient: { 0.2: C.blueL, 0.45: C.green, 0.7: C.amber, 1: C.violet } },
      ).addTo(map);
      return;
    }
    const layerColor = MAP_LAYER_COLORS[activeLayer] || MAP_LAYER_COLORS.all;
    const group = mode === "cluster" && L.markerClusterGroup
      ? L.markerClusterGroup({
        showCoverageOnHover: false, spiderfyOnMaxZoom: true, maxClusterRadius: 55,
        iconCreateFunction: (cl: any) => {
          const n = cl.getChildCount(), size = n < 10 ? 38 : n < 50 ? 46 : 56;
          return L.divIcon({ html: `<div class="lf-cluster" style="width:${size}px;height:${size}px"><span>${n}</span></div>`, className: "", iconSize: [size, size] });
        },
      })
      : L.layerGroup();

    const opsHtml = (p: PointOfSale) => {
      const ops = [
        p.moov && `<span style="background:#00A651;color:#fff;font-size:9px;font-weight:700;padding:1px 6px;border-radius:4px">Moov</span>`,
        p.orange && `<span style="background:#FF6600;color:#fff;font-size:9px;font-weight:700;padding:1px 6px;border-radius:4px">Orange</span>`,
        p.mtn && `<span style="background:#FFCC00;color:#000;font-size:9px;font-weight:700;padding:1px 6px;border-radius:4px">MTN</span>`,
        p.wave && `<span style="background:#1DC4E9;color:#fff;font-size:9px;font-weight:700;padding:1px 6px;border-radius:4px">Wave</span>`,
      ].filter(Boolean);
      return ops.length ? `<div style="display:flex;gap:3px;flex-wrap:wrap">${ops.join("")}</div>` : "";
    };

    geoPoints.forEach((p, i) => {
      const color = colorBy === "score" ? scoreColor(p.score) : layerColor;
      const icon = L.divIcon({
        className: "", iconSize: [30, 30], iconAnchor: [15, 15], popupAnchor: [0, -14],
        html: `<div class="lf-marker ${p.score >= 80 ? "lf-pulse" : ""}" style="--c:${color};animation-delay:${Math.min(i * 10, 800)}ms">${esc(p.score)}</div>`,
      });
      const popup = `
        <div>
          <div class="lf-pop-head" style="background:linear-gradient(135deg,${C.navy},${color})">
            <div class="lf-pop-score">${esc(p.score)}</div>
            <div><p class="lf-pop-name">${esc(p.name)}</p><p class="lf-pop-sub">${esc(p.commune)}${p.quartier ? " · " + esc(p.quartier) : ""}</p></div>
          </div>
          <div class="lf-pop-body">
            ${opsHtml(p)}
            <div class="lf-pop-grid">
              <div style="background:${C.violetBg};color:${C.violet}"><span style="opacity:.85">Score</span><br/><strong>${esc(p.score)}/100</strong></div>
              <div style="background:#D6EAF6;color:${C.blueD}"><span style="opacity:.85">Digital</span><br/><strong>${esc(p.digitalisation)}/100</strong></div>
              <div style="background:${C.greenBg};color:${C.greenTx}"><span style="opacity:.85">Façade</span><br/><strong>${esc(p.facade_metres)} m</strong></div>
              <div style="background:${C.amberBg};color:${C.amberTx}"><span style="opacity:.85">Opérateurs</span><br/><strong>${esc(p.nb_operateurs)}/4</strong></div>
            </div>
            <div class="lf-pop-bar"><i style="width:${Math.max(0, Math.min(100, p.score))}%;background:${color}"></i></div>
            <p class="lf-pop-date">${esc(p.type)} · Collecte : ${esc(p.dateCollecte)}</p>
            <button class="lf-pop-btn" onclick="window._lanfiaSelectPDV && window._lanfiaSelectPDV(${Number(p.id)})">Voir la fiche</button>
          </div>
        </div>`;
      const marker = L.marker([p.latitude, p.longitude], { icon })
        .bindTooltip(esc(p.name), { direction: "top", offset: [0, -14], className: "lf-tip" })
        .bindPopup(popup, { maxWidth: 290, className: "lf-popup", autoPanPadding: [40, 40] });
      group.addLayer(marker);
      markersById.current.set(p.id, marker);
    });
    group.addTo(map);
    dataLayerRef.current = group;
  }, [ready, geoPoints, mode, colorBy, activeLayer]);

  const fitAll = useCallback(() => {
    const L = (window as any).L, map = mapInst.current;
    if (!L || !map || !geoPoints.length) return;
    if (geoPoints.length === 1) map.flyTo([geoPoints[0].latitude, geoPoints[0].longitude], 15, { duration: 0.9 });
    else map.flyToBounds(L.latLngBounds(geoPoints.map((p) => [p.latitude, p.longitude])), { padding: [40, 40], maxZoom: 15, duration: 0.9 });
  }, [geoPoints]);

  useEffect(() => {
    if (!ready || !mapInst.current || tourOn) return;
    fitAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, geoPoints]);

  // Visite guidée : survole les 12 meilleurs PDV
  useEffect(() => {
    const map = mapInst.current;
    if (!tourOn || !map) { setTourInfo(null); return; }
    const top = [...geoPoints].sort((a, b) => b.score - a.score).slice(0, 12);
    if (!top.length) { setTourOn(false); return; }
    let i = 0; let timeout: any;
    const step = () => {
      const p = top[i % top.length];
      map.flyTo([p.latitude, p.longitude], 16, { duration: 1.5 });
      setTourInfo({ i: (i % top.length) + 1, total: top.length, name: p.name });
      timeout = setTimeout(() => markersById.current.get(p.id)?.openPopup(), 1600);
      i++;
    };
    step();
    const iv = setInterval(() => { map.closePopup(); step(); }, 4500);
    return () => { clearInterval(iv); clearTimeout(timeout); map.closePopup(); };
  }, [tourOn, geoPoints]);

  const toggleTour = () => {
    if (!tourOn) setMode("markers"); else setTimeout(fitAll, 50);
    setTourOn((v) => !v);
  };

  useEffect(() => {
    const t = setTimeout(() => mapInst.current?.invalidateSize(), 350);
    return () => clearTimeout(t);
  }, [fullscreen]);
  useEffect(() => {
    if (!fullscreen) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setFullscreen(false); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [fullscreen]);
  useEffect(() => {
    (window as any)._lanfiaSelectPDV = (id: number) => { onSelectPoint(id); mapInst.current?.closePopup(); };
    return () => { delete (window as any)._lanfiaSelectPDV; };
  }, [onSelectPoint]);

  const tiers = [{ c: C.violet, l: "≥ 80" }, { c: C.green, l: "65–79" }, { c: C.amber, l: "45–64" }, { c: C.blue, l: "< 45" }];
  const wrap: React.CSSProperties = fullscreen ? { position: "fixed", inset: 0, zIndex: 2000, background: "#fff", padding: 12 } : { position: "relative" };

  return (
    <div style={wrap}>
      <div style={{ position: "relative", height: fullscreen ? "100%" : height }}>
        {!ready && (
          <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 12, background: C.surface, border: `1px dashed ${C.line}` }}>
            <div style={{ textAlign: "center" }}><Loader2 className="lf-spin" size={26} style={{ color: C.blue, margin: "0 auto 8px" }} /><p style={{ fontSize: 12, color: C.muted }}>Chargement de la carte…</p></div>
          </div>
        )}
        <div ref={mapRef} role="application" aria-label="Carte des points de vente" style={{ height: "100%", width: "100%", borderRadius: 12, overflow: "hidden", border: `1px solid ${C.line}`, background: C.surface }} />

        {!compact && ready && (
          <div style={{ position: "absolute", top: 12, left: 12, zIndex: 1000, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              <MapChip active={mode === "cluster"} onClick={() => { setTourOn(false); setMode("cluster"); }} title="Regrouper les points proches"><Layers3 size={12} /> Regroupés</MapChip>
              <MapChip active={mode === "markers"} onClick={() => setMode("markers")} title="Afficher chaque point"><MapPin size={12} /> Points</MapChip>
              <MapChip active={mode === "heat"} onClick={() => { setTourOn(false); setMode("heat"); }} title="Chaleur pondérée par le score"><Flame size={12} /> Chaleur</MapChip>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              <MapChip onClick={fitAll} title="Recadrer sur tous les points"><Crosshair size={12} /> Recadrer</MapChip>
              <MapChip active={tourOn} onClick={toggleTour} title="Survoler les meilleurs PDV">{tourOn ? <Pause size={12} /> : <Play size={12} />} Visite guidée</MapChip>
              {mode !== "heat" && <MapChip onClick={() => setColorBy((c) => (c === "score" ? "couche" : "score"))} title="Changer la logique de couleur"><Palette size={12} /> {colorBy === "score" ? "Par score" : "Par couche"}</MapChip>}
            </div>
          </div>
        )}
        {!compact && ready && (
          <div style={{ position: "absolute", top: 12, right: 12, zIndex: 1000, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <MapChip onClick={() => setFullscreen((f) => !f)} title={fullscreen ? "Quitter le plein écran (Échap)" : "Plein écran"}>{fullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />} {fullscreen ? "Réduire" : "Plein écran"}</MapChip>
            {(Object.keys(TILES) as TileKey[]).map((k) => <MapChip key={k} active={tile === k} onClick={() => setTile(k)}>{TILES[k].label}</MapChip>)}
          </div>
        )}
        <div style={{ position: "absolute", bottom: 12, left: 12, zIndex: 1000, display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
          {!compact && mode !== "heat" && colorBy === "score" && (
            <div style={{ display: "flex", gap: 10, padding: "6px 10px", borderRadius: 10, background: "rgba(255,255,255,.96)", border: `1px solid ${C.line}` }}>
              {tiers.map((t) => <span key={t.l} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, color: C.sub }}><span style={{ width: 10, height: 10, borderRadius: "50%", background: t.c }} />{t.l}</span>)}
            </div>
          )}
          <div style={{ padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: "rgba(237,245,250,.96)", border: `1px solid ${C.line}`, color: C.sub }}>
            {fmt(geoPoints.length)} point{geoPoints.length !== 1 ? "s" : ""} affiché{geoPoints.length !== 1 ? "s" : ""}
          </div>
        </div>
        {tourInfo && (
          <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", zIndex: 1000, display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 12, background: C.navy, color: "#fff", animation: "lf-slide .3s ease-out" }}>
            <Play size={12} style={{ color: C.blueL }} /><span style={{ fontSize: 12, fontWeight: 600 }}>{tourInfo.name}</span>
            <span style={{ fontSize: 10, color: C.blueL }}>{tourInfo.i} / {tourInfo.total}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Visionneuse de photos ───────────────────────────────── */
function ImageLightbox({ images, initialIndex, onClose }: { images: Photo[]; initialIndex: number; onClose: () => void }) {
  const [idx, setIdx] = useState(initialIndex);
  const prev = useCallback(() => setIdx((i) => (i > 0 ? i - 1 : images.length - 1)), [images.length]);
  const next = useCallback(() => setIdx((i) => (i < images.length - 1 ? i + 1 : 0)), [images.length]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); if (e.key === "ArrowLeft") prev(); if (e.key === "ArrowRight") next(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose, prev, next]);
  if (!images.length) return null;
  const src = images[idx]?.image || images[idx]?.thumbnail;
  const navBtn: React.CSSProperties = { position: "absolute", top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,.12)", border: "none", color: "#fff", borderRadius: 99, padding: 10, cursor: "pointer" };
  return (
    <div role="dialog" aria-modal="true" aria-label="Photos du point de vente" onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(5,15,25,.95)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <button onClick={onClose} aria-label="Fermer" style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "#fff", cursor: "pointer" }}><X size={26} /></button>
      <span style={{ position: "absolute", top: 18, left: 18, padding: "5px 12px", borderRadius: 99, background: C.blue, color: "#fff", fontSize: 12, fontWeight: 600 }}>{idx + 1} / {images.length}</span>
      <button aria-label="Photo précédente" style={{ ...navBtn, left: 16 }} onClick={(e) => { e.stopPropagation(); prev(); }}><ChevronLeft size={28} /></button>
      <div style={{ maxWidth: "88vw", maxHeight: "88vh", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
        {src ? <img src={src} alt={`Photo ${idx + 1}`} style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain", borderRadius: 12 }} /> : <p style={{ color: "#fff" }}>Image non disponible</p>}
        <p style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,.82)" }}>{images[idx]?.caption || images[idx]?.type || `Photo ${idx + 1}`}</p>
      </div>
      <button aria-label="Photo suivante" style={{ ...navBtn, right: 16 }} onClick={(e) => { e.stopPropagation(); next(); }}><ChevronRight size={28} /></button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Composant principal
   ═══════════════════════════════════════════════════════════ */
export default function LanfiaLinkDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pointsOfSale, setPointsOfSale] = useState<PointOfSale[]>([]);
  const [agentsPerformance, setAgentsPerformance] = useState<AgentPerformance[]>([]);

  // Filtres
  const [commune, setCommune] = useState("Toutes");
  const [quartier, setQuartier] = useState("Tous");
  const [district, setDistrict] = useState("Tous");
  const [region, setRegion] = useState("Toutes");
  const [branding, setBranding] = useState("Tous");
  const [potentiel, setPotentiel] = useState("Tous");
  const [type, setType] = useState("Tous");
  const [nbConcurrents, setNbConcurrents] = useState("Tous");
  const [classeQuartier, setClasseQuartier] = useState("Tous");
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [operateurFilter, setOperateurFilter] = useState({ moov: false, orange: false, mtn: false, wave: false });
  const [nbOpMinFilter, setNbOpMinFilter] = useState(0);
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  const [mapScoreMin, setMapScoreMin] = useState(0);
  const [view, setView] = useState<ViewId>("marketing");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeLayer, setActiveLayer] = useState<MapLayer>("all");

  // Options de filtres (API)
  const [apiCommunes, setApiCommunes] = useState<string[]>([]);
  const [apiQuartiers, setApiQuartiers] = useState<string[]>([]);
  const [apiDistricts, setApiDistricts] = useState<string[]>([]);
  const [apiRegions, setApiRegions] = useState<string[]>([]);
  const [apiTypes, setApiTypes] = useState<FilterOption[]>([]);
  const [apiPotentiels, setApiPotentiels] = useState<FilterOption[]>([]);
  const [apiConcurrentsOpts, setApiConcurrentsOpts] = useState<FilterOption[]>([]);
  const [apiClassesOpts, setApiClassesOpts] = useState<FilterOption[]>([]);

  // Visionneuse
  const [lightbox, setLightbox] = useState<{ images: Photo[]; index: number } | null>(null);

  // Ciblage business
  const [clientName, setClientName] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [campaignObjective, setCampaignObjective] = useState("");
  const [templateId, setTemplateId] = useState<string>(BUSINESS_TEMPLATES[0].id);
  const [weights, setWeights] = useState<CriteriaWeights>(BUSINESS_TEMPLATES[0].weights);
  const [hardFilters, setHardFilters] = useState<HardFilters>(BUSINESS_TEMPLATES[0].hardFilters);
  const [facadeTarget, setFacadeTarget] = useState(BUSINESS_TEMPLATES[0].facadeTarget);
  const [ancienneteTarget, setAncienneteTarget] = useState(BUSINESS_TEMPLATES[0].ancienneteTarget);
  const [classePrefs, setClassePrefs] = useState<Record<string, number>>(BUSINESS_TEMPLATES[0].classePreferences);
  const [topN, setTopN] = useState(20);
  const [useGlobalFilters, setUseGlobalFilters] = useState(false);

  const applyTemplate = useCallback((t: BusinessTemplate) => {
    setTemplateId(t.id); setWeights(t.weights); setHardFilters(t.hardFilters);
    setFacadeTarget(t.facadeTarget); setAncienneteTarget(t.ancienneteTarget); setClassePrefs(t.classePreferences);
  }, []);

  /* ── Chargements ── */
  useEffect(() => {
    apiService.getFilterOptions().then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (!d) return;
      setApiCommunes(d.communes || []); setApiQuartiers(d.quartiers || []); setApiDistricts(d.districts || []);
      setApiRegions(d.regions || []); setApiTypes(d.types || []); setApiPotentiels(d.potentiels || []);
      setApiConcurrentsOpts(d.nb_concurrents || []); setApiClassesOpts(d.classes_quartier || []);
    }).catch(console.error);
    apiService.getAgentsPerformance().then((r) => (r.ok ? r.json() : [])).then(setAgentsPerformance).catch(console.error);
  }, []);

  /** On charge toute la base des PDV une seule fois ; les filtres s'appliquent ensuite côté navigateur.
   *  Ainsi « Toute la base » du ciblage est réellement toute la base, et filtrer est instantané. */
  const fetchPoints = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const response = await apiService.getPointsVenteAnalytics({ nature: "pdv" });
      if (!response.ok) throw new Error("Impossible de charger les points de vente.");
      const raw = await response.json();
      const data: any[] = Array.isArray(raw) ? raw : raw?.results ?? [];
      const mapped: PointOfSale[] = data.filter((p) => (p.nature || "pdv") === "pdv").map((p) => {
        const moov = Boolean(p.moov), orange = Boolean(p.orange), mtn = Boolean(p.mtn), wave = Boolean(p.wave);
        const nb_operateurs = [moov, orange, mtn, wave].filter(Boolean).length;
        return {
          id: p.id, name: p.name, commune: p.commune, quartier: p.quartier || "", district: p.district || "", region: p.region || "",
          type: p.type, status: p.status, branding: p.brander ? "Brandé" : "Non brandé",
          potentiel: p.potentiel || "standard", potentiel_label: p.potentiel_label || "Standard",
          visibilite: p.visibilite || 0, accessibilite: p.accessibilite || 0, affluence: p.affluence || 0, digitalisation: nb_operateurs * 25,
          moov, orange, mtn, wave, nb_operateurs, photos: p.photos || [], photos_count: p.photos_count || 0,
          scoreA: p.score_a || 0, scoreD: p.score_d || 0, scoreE: p.score_e || 0, score: p.score_global || 0,
          agent: p.agent_name || p.agent || "Agent inconnu", agent_name: p.agent_name || "",
          gpsValid: p.gps_valid || false, ficheComplete: p.fiche_complete || false,
          eligibiliteBranding: p.eligibilite_branding || false, eligibiliteExclusivite: p.eligibilite_exclusivite || false,
          eligibiliteActivation: p.eligibilite_activation || false, grandeVoie: p.grande_voie || false,
          caMensuel: parseFloat(p.monthly_turnover || "0"), dateCollecte: p.date_collecte || today(),
          latitude: parseFloat(p.latitude) || 0, longitude: parseFloat(p.longitude) || 0,
          address: p.address || "", phone: p.phone || "", owner: p.owner || "",
          nb_concurrents: p.nb_concurrents || "aucun", nb_concurrents_label: p.nb_concurrents_label || "Aucun",
          classe_quartier: p.classe_quartier || "populaire", classe_quartier_label: p.classe_quartier_label || "Populaire",
          anciennete_annees: p.anciennete_annees || 0, facade_metres: parseFloat(p.facade_metres || "0"), nature: p.nature || "pdv",
        };
      });
      setPointsOfSale(mapped);
    } catch (e: any) { setError(e.message || "Erreur de chargement."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { fetchPoints(); }, [fetchPoints]);
  useEffect(() => { if (selectedId === null && pointsOfSale.length > 0) setSelectedId(pointsOfSale[0].id); }, [pointsOfSale, selectedId]);
  useEffect(() => { setQuartier("Tous"); }, [commune]);

  /* ── Options de filtres : API + données ── */
  const communes = useMemo(() => unique([...apiCommunes, ...pointsOfSale.map((p) => p.commune)]), [apiCommunes, pointsOfSale]);
  const quartiers = useMemo(() => {
    const base = commune !== "Toutes" ? pointsOfSale.filter((p) => p.commune === commune).map((p) => p.quartier) : pointsOfSale.map((p) => p.quartier);
    return unique([...base, ...(commune === "Toutes" ? apiQuartiers : [])]);
  }, [apiQuartiers, pointsOfSale, commune]);
  const districts = useMemo(() => unique([...apiDistricts, ...pointsOfSale.map((p) => p.district)]), [apiDistricts, pointsOfSale]);
  const regions = useMemo(() => unique([...apiRegions, ...pointsOfSale.map((p) => p.region)]), [apiRegions, pointsOfSale]);
  const types = useMemo(() => uniqueOptions([...apiTypes, ...unique(pointsOfSale.map((p) => p.type)).map((t) => ({ value: t, label: t }))]), [apiTypes, pointsOfSale]);
  const potentiels = useMemo(() => uniqueOptions([...apiPotentiels, ...unique(pointsOfSale.map((p) => p.potentiel_label)).map((l) => ({ value: l, label: l }))]), [apiPotentiels, pointsOfSale]);
  const concurrentsOpts = useMemo(() => {
    const known = new Set(apiConcurrentsOpts.map((c) => c.label.trim().toLowerCase()));
    return uniqueOptions([...apiConcurrentsOpts, ...unique(pointsOfSale.map((p) => p.nb_concurrents_label)).filter((l) => !known.has(l.trim().toLowerCase())).map((l) => ({ value: l, label: l }))]);
  }, [apiConcurrentsOpts, pointsOfSale]);
  const classesOpts = useMemo(() => {
    const known = new Set(apiClassesOpts.map((c) => c.label.trim().toLowerCase()));
    return uniqueOptions([...apiClassesOpts, ...unique(pointsOfSale.map((p) => p.classe_quartier_label)).filter((l) => !known.has(l.trim().toLowerCase())).map((l) => ({ value: l, label: l }))]);
  }, [apiClassesOpts, pointsOfSale]);

  /* ── Filtres : réinitialisation, pastilles ── */
  const resetFilters = () => {
    setCommune("Toutes"); setQuartier("Tous"); setDistrict("Tous"); setRegion("Toutes"); setBranding("Tous"); setPotentiel("Tous");
    setType("Tous"); setNbConcurrents("Tous"); setClasseQuartier("Tous"); setDateDebut(""); setDateFin(""); setSearch("");
    setOperateurFilter({ moov: false, orange: false, mtn: false, wave: false }); setNbOpMinFilter(0);
  };
  const applyDatePreset = (days: number | null) => {
    if (days === null) { setDateDebut(""); setDateFin(""); return; }
    setDateDebut(new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)); setDateFin(today());
  };

  const chips: { key: string; label: string; clear: () => void }[] = [];
  const addChip = (key: string, label: string, clear: () => void) => chips.push({ key, label, clear });
  if (commune !== "Toutes") addChip("commune", `Commune : ${commune}`, () => setCommune("Toutes"));
  if (quartier !== "Tous") addChip("quartier", `Quartier : ${quartier}`, () => setQuartier("Tous"));
  if (district !== "Tous") addChip("district", `District : ${district}`, () => setDistrict("Tous"));
  if (region !== "Toutes") addChip("region", `Région : ${region}`, () => setRegion("Toutes"));
  if (type !== "Tous") addChip("type", `Type : ${type}`, () => setType("Tous"));
  if (branding !== "Tous") addChip("branding", `Branding : ${branding}`, () => setBranding("Tous"));
  if (potentiel !== "Tous") addChip("potentiel", `Potentiel : ${potentiel}`, () => setPotentiel("Tous"));
  if (nbConcurrents !== "Tous") addChip("conc", `Concurrents : ${nbConcurrents}`, () => setNbConcurrents("Tous"));
  if (classeQuartier !== "Tous") addChip("classe", `Classe : ${classeQuartier}`, () => setClasseQuartier("Tous"));
  OPS.forEach((op) => { if (operateurFilter[op]) addChip(`op-${op}`, `Opérateur : ${op === "mtn" ? "MTN" : op[0].toUpperCase() + op.slice(1)}`, () => setOperateurFilter((f) => ({ ...f, [op]: false }))); });
  if (nbOpMinFilter > 0) addChip("nbop", `Opérateurs ≥ ${nbOpMinFilter}`, () => setNbOpMinFilter(0));
  if (dateDebut || dateFin) addChip("date", `Collecte : ${dateDebut || "…"} → ${dateFin || "…"}`, () => { setDateDebut(""); setDateFin(""); });
  if (search) addChip("search", `Recherche : ${search}`, () => setSearch(""));

  /* ── Filtrage ── */
  const filtered = useMemo(() => {
    let pts = pointsOfSale;
    if (commune !== "Toutes") pts = pts.filter((p) => p.commune === commune);
    if (quartier !== "Tous") pts = pts.filter((p) => p.quartier === quartier);
    if (district !== "Tous") pts = pts.filter((p) => p.district === district);
    if (region !== "Toutes") pts = pts.filter((p) => p.region === region);
    if (type !== "Tous") { const v = apiTypes.find((t) => t.label === type)?.value ?? type; pts = pts.filter((p) => p.type === v || p.type === type); }
    if (branding !== "Tous") pts = pts.filter((p) => p.branding === branding);
    if (potentiel !== "Tous") pts = pts.filter((p) => p.potentiel_label === potentiel);
    if (nbConcurrents !== "Tous") { const v = apiConcurrentsOpts.find((c) => c.label === nbConcurrents)?.value ?? nbConcurrents; pts = pts.filter((p) => p.nb_concurrents_label === nbConcurrents || p.nb_concurrents === v); }
    if (classeQuartier !== "Tous") { const v = apiClassesOpts.find((c) => c.label === classeQuartier)?.value ?? classeQuartier; pts = pts.filter((p) => p.classe_quartier_label === classeQuartier || p.classe_quartier === v); }
    if (dateDebut) pts = pts.filter((p) => p.dateCollecte >= dateDebut);
    if (dateFin) pts = pts.filter((p) => p.dateCollecte <= dateFin);
    OPS.forEach((op) => { if (operateurFilter[op]) pts = pts.filter((p) => p[op]); });
    if (nbOpMinFilter > 0) pts = pts.filter((p) => p.nb_operateurs >= nbOpMinFilter);
    const q = search.trim().toLowerCase();
    if (q) pts = pts.filter((p) => p.name.toLowerCase().includes(q) || p.quartier.toLowerCase().includes(q) || p.commune.toLowerCase().includes(q) || p.owner.toLowerCase().includes(q));
    return pts;
  }, [pointsOfSale, commune, quartier, district, region, type, branding, potentiel, nbConcurrents, classeQuartier, dateDebut, dateFin, search, operateurFilter, nbOpMinFilter, apiTypes, apiConcurrentsOpts, apiClassesOpts]);

  const selected = useMemo(() => filtered.find((p) => p.id === selectedId) || filtered[0] || pointsOfSale[0], [filtered, selectedId, pointsOfSale]);

  /* ── Agrégats ── */
  const totals = useMemo(() => {
    const total = filtered.length, d = Math.max(total, 1);
    const sum = (f: (p: PointOfSale) => number) => filtered.reduce((a, p) => a + f(p), 0);
    const brandes = filtered.filter((p) => p.branding === "Brandé").length;
    const cutoff = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
    return {
      total, brandes, nonBrandes: total - brandes,
      premium: filtered.filter((p) => p.score >= 80).length,
      eligiblesBranding: filtered.filter((p) => p.eligibiliteBranding).length,
      gpsValides: filtered.filter((p) => p.gpsValid).length,
      ficheOk: filtered.filter((p) => p.ficheComplete).length,
      photosOk: filtered.filter((p) => p.photos_count >= 4).length,
      frais: filtered.filter((p) => p.dateCollecte >= cutoff).length,
      scoreMoyen: Math.round(sum((p) => p.score) / d), scoreA: Math.round(sum((p) => p.scoreA) / d),
      scoreD: Math.round(sum((p) => p.scoreD) / d), scoreE: Math.round(sum((p) => p.scoreE) / d),
      facadeMoyenne: parseFloat((sum((p) => p.facade_metres) / d).toFixed(1)),
      ancienneteMoyenne: parseFloat((sum((p) => p.anciennete_annees) / d).toFixed(1)),
      digitalisationMoy: Math.round(sum((p) => p.digitalisation) / d),
      moovCount: filtered.filter((p) => p.moov).length, orangeCount: filtered.filter((p) => p.orange).length,
      mtnCount: filtered.filter((p) => p.mtn).length, waveCount: filtered.filter((p) => p.wave).length,
      pdvMultiOp: filtered.filter((p) => p.nb_operateurs >= 2).length,
    };
  }, [filtered]);
  const pctOf = (n: number) => Math.round((n / Math.max(totals.total, 1)) * 100);

  /* ── Données de graphiques ── */
  const brandingVsPotential = useMemo(() => ["Standard", "Développement", "Fort potentiel", "Premium"].map((level) => ({
    niveau: level,
    "Brandé": filtered.filter((p) => p.potentiel_label === level && p.branding === "Brandé").length,
    "Non brandé": filtered.filter((p) => p.potentiel_label === level && p.branding === "Non brandé").length,
  })), [filtered]);

  const countBy = (f: (p: PointOfSale) => string) => {
    const m: Record<string, number> = {};
    filtered.forEach((p) => { const k = f(p); m[k] = (m[k] || 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  };
  const byConcurrents = useMemo(() => countBy((p) => p.nb_concurrents_label), [filtered]); // eslint-disable-line react-hooks/exhaustive-deps
  const byClasseQuartier = useMemo(() => countBy((p) => p.classe_quartier_label), [filtered]); // eslint-disable-line react-hooks/exhaustive-deps

  const byCommune = useMemo(() => {
    const map = new Map<string, any>();
    filtered.forEach((p) => {
      if (!map.has(p.commune)) map.set(p.commune, { commune: p.commune, total: 0, premium: 0, scoreMoyen: 0, eligiblesBranding: 0, facadeMoy: 0, moov: 0, orange: 0, mtn: 0, wave: 0 });
      const r = map.get(p.commune);
      r.total++; r.premium += p.score >= 80 ? 1 : 0; r.scoreMoyen += p.score; r.eligiblesBranding += p.eligibiliteBranding ? 1 : 0; r.facadeMoy += p.facade_metres;
      OPS.forEach((op) => { if (p[op]) r[op]++; });
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total).map((r) => ({
      ...r, scoreMoyen: Math.round(r.scoreMoyen / r.total), facadeMoy: parseFloat((r.facadeMoy / r.total).toFixed(1)),
    }));
  }, [filtered]);

  const pieData = useMemo(() => {
    const top = byCommune.slice(0, 7).map((r) => ({ name: r.commune, value: r.total }));
    const rest = byCommune.slice(7).reduce((a, r) => a + r.total, 0);
    return rest > 0 ? [...top, { name: "Autres", value: rest }] : top;
  }, [byCommune]);
  const topCommunes = useMemo(() => byCommune.slice(0, 10), [byCommune]);
  const digitDistrib = useMemo(() => [0, 1, 2, 3, 4].map((n) => ({ name: n === 0 ? "Aucun" : `${n} op.`, value: filtered.filter((p) => p.nb_operateurs === n).length })).filter((d) => d.value > 0), [filtered]);
  const radarSource = useMemo(() => {
    if (!filtered.length) return [];
    const avg = (k: keyof PointOfSale) => Math.round(filtered.reduce((a, p) => a + (p[k] as number), 0) / filtered.length);
    return [{ axe: "Visibilité", valeur: avg("visibilite") }, { axe: "Accessibilité", valeur: avg("accessibilite") }, { axe: "Affluence", valeur: avg("affluence") }, { axe: "Digital", valeur: avg("digitalisation") }, { axe: "Score global", valeur: avg("score") }];
  }, [filtered]);
  const scatterData = useMemo(() => filtered.slice(0, 500).map((p) => ({ x: p.facade_metres, y: p.score, z: p.accessibilite, name: p.name })), [filtered]);
  const opportunities = useMemo(() => filtered.filter((p) => p.branding === "Non brandé"), [filtered]);
  const dailySource = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach((p) => m.set(p.dateCollecte, (m.get(p.dateCollecte) || 0) + 1));
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([date, total]) => ({ date: date.slice(5), total }));
  }, [filtered]);

  /* ── Ciblage ── */
  const targetingPool = useGlobalFilters ? filtered : pointsOfSale;
  const targetingResults = useMemo<TargetingResult[]>(() => targetingPool
    .filter((p) => passesHard(p, hardFilters))
    .map((p) => { const { score, why } = computeMatch(p, weights, facadeTarget, ancienneteTarget, classePrefs); return { ...p, matchScore: score, why }; })
    .sort((a, b) => b.matchScore - a.matchScore),
  [targetingPool, hardFilters, weights, facadeTarget, ancienneteTarget, classePrefs]);
  const targetingTop = useMemo(() => targetingResults.slice(0, topN), [targetingResults, topN]);
  const targetingMapPoints = useMemo(() => targetingTop.map((r) => ({ ...r, score: r.matchScore })), [targetingTop]);
  const targetingStats = useMemo(() => {
    const t = targetingTop.length, d = Math.max(t, 1);
    return {
      total: t, eligiblesTotal: targetingResults.length,
      scoreMoyen: Math.round(targetingTop.reduce((a, p) => a + p.matchScore, 0) / d),
      affluenceMoyenne: Math.round(targetingTop.reduce((a, p) => a + p.affluence, 0) / d),
      digitalMoyen: Math.round(targetingTop.reduce((a, p) => a + p.digitalisation, 0) / d),
      communesCouvertes: unique(targetingTop.map((p) => p.commune)).length,
    };
  }, [targetingTop, targetingResults]);
  const template = BUSINESS_TEMPLATES.find((t) => t.id === templateId);
  const weightTotal = Object.values(weights).reduce((a, b) => a + b, 0) || 1;

  /* ── Carte ── */
  const mapLayers: { id: MapLayer; label: string; count: number }[] = [
    { id: "all", label: "Tous les PDV", count: totals.total }, { id: "brandes", label: "Brandés", count: totals.brandes },
    { id: "nonbrandes", label: "Non brandés", count: totals.nonBrandes }, { id: "eligibles", label: "Éligibles branding", count: totals.eligiblesBranding },
    { id: "premium", label: "Premium (score ≥ 80)", count: totals.premium }, { id: "gps", label: "GPS valides", count: totals.gpsValides },
  ];
  const layerPoints = useMemo(() => filtered.filter((p) => {
    if (p.score < mapScoreMin) return false;
    switch (activeLayer) {
      case "brandes": return p.branding === "Brandé";
      case "nonbrandes": return p.branding === "Non brandé";
      case "eligibles": return p.eligibiliteBranding;
      case "premium": return p.score >= 80;
      case "gps": return p.gpsValid;
      default: return true;
    }
  }), [filtered, activeLayer, mapScoreMin]);

  const openFiche = useCallback((id: number) => { setSelectedId(id); setView("fiche"); }, []);
  const singlePoint = useMemo(() => (selected ? [selected] : []), [selected]);

  /* ── Exports ── */
  const handleExport = () => {
    downloadCsv(`pdv_analytique_${today()}.csv`, [
      ["Nom", "Commune", "Quartier", "Type", "Branding", "Potentiel", "Score", "Visibilité", "Accessibilité", "Affluence", "Digitalisation", "Moov", "Orange", "MTN", "Wave", "NbOpérateurs", "Photos", "Agent", "CA mensuel", "Concurrents", "Classe quartier", "Ancienneté (ans)", "Façade (m)", "Date collecte", "Latitude", "Longitude"],
      ...filtered.map((p) => [p.name, p.commune, p.quartier, p.type, p.branding, p.potentiel_label, p.score, p.visibilite, p.accessibilite, p.affluence, p.digitalisation,
        p.moov ? "Oui" : "Non", p.orange ? "Oui" : "Non", p.mtn ? "Oui" : "Non", p.wave ? "Oui" : "Non", p.nb_operateurs, p.photos_count, p.agent, p.caMensuel,
        p.nb_concurrents_label, p.classe_quartier_label, p.anciennete_annees, p.facade_metres, p.dateCollecte, p.latitude, p.longitude]),
    ]);
  };
  const exportTargeting = () => {
    const safe = (clientName || "ciblage").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_");
    downloadCsv(`ciblage_${safe}_${template?.id || "custom"}.csv`, [
      ["Client", clientName || "-"], ["Campagne", campaignName || "-"], ["Secteur", template?.secteur || "-"],
      ["Objectif", (campaignObjective || "-").replace(/[\r\n]+/g, " ")], ["Date export", new Date().toLocaleDateString("fr-FR")], [],
      ["Rang", "PDV", "Commune", "Quartier", "Score de correspondance", "Pourquoi", "Score global PDV", "Affluence", "Accessibilité", "Visibilité", "Digitalisation", "Façade (m)", "Ancienneté (ans)", "Concurrents", "Classe quartier", "Branding", "Opérateurs", "Agent", "Date collecte"],
      ...targetingTop.map((p, i) => [i + 1, p.name, p.commune, p.quartier, p.matchScore, p.why.join(" · "), p.score, p.affluence, p.accessibilite, p.visibilite, p.digitalisation,
        p.facade_metres, p.anciennete_annees, p.nb_concurrents_label, p.classe_quartier_label, p.branding, OPS.filter((o) => p[o]).join("/"), p.agent, p.dateCollecte]),
    ]);
  };

  /* ── Photos ── */
  const openLightbox = async (pos: PointOfSale, idx: number) => {
    let photos = pos.photos;
    if (!photos?.length && pos.photos_count > 0) {
      try {
        const r = await apiService.getPointVenteDetail(pos.id);
        if (r.ok) {
          photos = (await r.json()).photos || [];
          setPointsOfSale((prev) => prev.map((p) => (p.id === pos.id ? { ...p, photos, photos_count: photos.length } : p)));
        }
      } catch { /* silencieux : la galerie reste en attente */ }
    }
    if (photos?.length) setLightbox({ images: photos, index: idx });
  };

  /* ── Colonnes de tableaux PDV ── */
  const baseCols = (onOpen: (id: number) => void): Column<PointOfSale>[] => [
    { key: "name", label: "PDV", sort: (r) => r.name, render: (r) => <strong style={{ whiteSpace: "nowrap" }}>{r.name}</strong> },
    { key: "commune", label: "Commune", sort: (r) => r.commune || "", render: (r) => <span style={{ fontSize: 12, color: C.muted }}>{r.commune}{r.quartier ? ` · ${r.quartier}` : ""}</span> },
    { key: "potentiel", label: "Potentiel", sort: (r) => r.potentiel_label || "", render: (r) => <Pill bg={C.pale} tx={C.blueD}>{r.potentiel_label}</Pill> },
    { key: "score", label: "Score", align: "right", sort: (r) => r.score, render: (r) => { const b = scoreBadge(r.score); return <Pill bg={b.bg} tx={b.tx}>{r.score}</Pill>; } },
    { key: "branding", label: "Branding", sort: (r) => r.branding, render: (r) => <Pill bg={r.branding === "Brandé" ? C.greenBg : C.amberBg} tx={r.branding === "Brandé" ? C.greenTx : C.amberTx}>{r.branding}</Pill> },
    { key: "ops", label: "Opérateurs", sort: (r) => r.nb_operateurs, render: (r) => <OpsRow p={r} size="sm" /> },
    { key: "conc", label: "Concurrents", sort: (r) => r.nb_concurrents_label || "", render: (r) => <span style={{ fontSize: 12, color: C.muted }}>{r.nb_concurrents_label}</span> },
    { key: "classe", label: "Quartier", sort: (r) => r.classe_quartier_label || "", render: (r) => <span style={{ fontSize: 12, color: C.muted }}>{r.classe_quartier_label}</span> },
    { key: "facade", label: "Façade", align: "right", sort: (r) => r.facade_metres, render: (r) => `${r.facade_metres} m` },
    { key: "date", label: "Collecte", sort: (r) => r.dateCollecte || "", render: (r) => <span style={{ fontSize: 12, color: C.muted }}>{r.dateCollecte}</span> },
    { key: "photos", label: "Photos", align: "right", sort: (r) => r.photos_count, render: (r) => <Pill bg={r.photos_count >= 4 ? C.greenBg : C.amberBg} tx={r.photos_count >= 4 ? C.greenTx : C.amberTx}>{r.photos_count}</Pill> },
    { key: "gps", label: "GPS", sort: (r) => (r.gpsValid ? 1 : 0), render: (r) => (r.gpsValid ? <CheckCircle2 size={14} style={{ color: C.green }} /> : <span style={{ color: C.muted }}>—</span>) },
    { key: "open", label: "", render: (r) => <button onClick={() => onOpen(r.id)} style={{ ...btnGhost, padding: "4px 10px", color: C.blue }}>Voir →</button> },
  ];
  const posColumns = useMemo(() => baseCols(openFiche), [openFiche]); // eslint-disable-line react-hooks/exhaustive-deps
  const targetingColumns = useMemo<Column<TargetingResult>[]>(() => [
    { key: "rank", label: "#", sort: (r) => r.matchScore, hidden: true, csv: (r) => r.matchScore },
    { key: "name", label: "PDV", sort: (r) => r.name, render: (r) => <strong style={{ whiteSpace: "nowrap" }}>{r.name}</strong> },
    { key: "commune", label: "Commune", sort: (r) => r.commune || "", render: (r) => <span style={{ fontSize: 12, color: C.muted }}>{r.commune}{r.quartier ? ` · ${r.quartier}` : ""}</span> },
    { key: "match", label: "Correspondance", sort: (r) => r.matchScore, render: (r) => {
      const b = scoreBadge(r.matchScore);
      return (<span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Pill bg={b.bg} tx={b.tx}>{r.matchScore}</Pill>
        <span style={{ width: 56, height: 6, borderRadius: 99, background: C.surface, overflow: "hidden" }}><span style={{ display: "block", height: "100%", width: `${r.matchScore}%`, background: C.blue }} /></span></span>);
    } },
    { key: "why", label: "Pourquoi", csv: (r) => r.why.join(" · "), render: (r) => <span style={{ display: "inline-flex", gap: 4, flexWrap: "wrap" }}>{r.why.map((w) => <Pill key={w} bg={C.pale} tx={C.blueD}>{w}</Pill>)}</span> },
    { key: "affluence", label: "Affluence", align: "right", sort: (r) => r.affluence, render: (r) => r.affluence },
    { key: "acc", label: "Accessibilité", align: "right", sort: (r) => r.accessibilite, render: (r) => r.accessibilite },
    { key: "ops", label: "Opérateurs", sort: (r) => r.nb_operateurs, render: (r) => <OpsRow p={r} size="sm" /> },
    { key: "facade", label: "Façade", align: "right", sort: (r) => r.facade_metres, render: (r) => `${r.facade_metres} m` },
    { key: "conc", label: "Concurrents", sort: (r) => r.nb_concurrents_label || "", render: (r) => <span style={{ fontSize: 12, color: C.muted }}>{r.nb_concurrents_label}</span> },
    { key: "open", label: "", render: (r) => <button onClick={() => openFiche(r.id)} style={{ ...btnGhost, padding: "4px 10px", color: C.blue }}>Voir →</button> },
  ], [openFiche]);

  /* ═══════════ Rendu ═══════════ */
  const potentielOptions = [{ value: "Tous", label: "Tous", color: C.blue }, ...potentiels.map((p) => ({ value: p.label, label: p.label, color: POTENTIEL_COLORS[p.label.trim().toLowerCase()] || C.blue }))];
  const viewItems: { value: ViewId; label: string; icon: React.ComponentType<any> }[] = [
    { value: "executif", label: "Direction", icon: Activity }, { value: "marketing", label: "Marketing", icon: TrendingUp },
    { value: "operations", label: "Opérations", icon: Zap }, { value: "ciblage", label: "Ciblage Business", icon: Target },
    { value: "graphe", label: "Merchant Graph", icon: Network }, { value: "carte", label: "Carte", icon: MapPin }, { value: "fiche", label: "Fiche PDV", icon: Eye },
  ];
  const grid2: React.CSSProperties = { display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))" };
  const chartH = 260;

  const renderMarketing = () => (
    <div style={grid2}>
      <Panel title="Brandés vs non brandés par niveau de potentiel" subtitle="Identification immédiate des opportunités restantes" icon={BadgePercent}>
        {brandingVsPotential.some((d) => d["Brandé"] > 0 || d["Non brandé"] > 0) ? (
          <div style={{ height: chartH }}><ResponsiveContainer width="100%" height="100%">
            <BarChart data={brandingVsPotential} barGap={4} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.surface} />
              <XAxis dataKey="niveau" {...axis} /><YAxis {...axis} allowDecimals={false} />
              <Tooltip content={<ChartTip />} cursor={{ fill: `${C.blue}10` }} /><Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Brandé" fill={C.green} radius={[4, 4, 0, 0]} /><Bar dataKey="Non brandé" fill={C.amber} radius={[4, 4, 0, 0]} />
            </BarChart></ResponsiveContainer></div>
        ) : <Empty title="Aucune donnée" height={chartH} />}
      </Panel>

      <Panel title="Répartition par commune" subtitle="Poids dans la base filtrée" icon={MapPin}>
        {pieData.length ? (
          <div style={{ height: chartH }}><ResponsiveContainer width="100%" height="100%">
            <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={2} dataKey="value" label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
              {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Pie><Tooltip content={<ChartTip />} /></PieChart>
          </ResponsiveContainer></div>
        ) : <Empty title="Aucune donnée" height={chartH} />}
      </Panel>

      <Panel title="Présence opérateurs par commune" subtitle="Moov · Orange · MTN · Wave (10 premières communes)" icon={Wifi}>
        {topCommunes.length ? (
          <div style={{ height: chartH }}><ResponsiveContainer width="100%" height="100%">
            <BarChart data={topCommunes} barGap={2} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.surface} /><XAxis dataKey="commune" {...axis} /><YAxis {...axis} allowDecimals={false} />
              <Tooltip content={<ChartTip />} cursor={{ fill: `${C.blue}10` }} /><Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              {OPS.map((op) => <Bar key={op} dataKey={op} name={op === "mtn" ? "MTN" : op[0].toUpperCase() + op.slice(1)} fill={OPERATOR_COLORS[op]} radius={[3, 3, 0, 0]} />)}
            </BarChart></ResponsiveContainer></div>
        ) : <Empty title="Aucune donnée" height={chartH} />}
      </Panel>

      <Panel title="Distribution de la digitalisation" subtitle="Nombre d'opérateurs présents par PDV" icon={Smartphone}>
        {digitDistrib.length ? (
          <div style={{ height: chartH }}><ResponsiveContainer width="100%" height="100%">
            <PieChart><Pie data={digitDistrib} cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={3} dataKey="value" label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
              {digitDistrib.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Pie><Tooltip content={<ChartTip />} /></PieChart>
          </ResponsiveContainer></div>
        ) : <Empty title="Aucune donnée" height={chartH} />}
      </Panel>

      <Panel title="Pression concurrentielle" subtitle="PDV selon le nombre de concurrents à 300 m" icon={Swords}>
        {byConcurrents.length ? (
          <div style={{ height: chartH }}><ResponsiveContainer width="100%" height="100%">
            <PieChart><Pie data={byConcurrents} cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={3} dataKey="value" label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
              {byConcurrents.map((_, i) => <Cell key={i} fill={[C.green, C.amber, C.red][i % 3]} />)}</Pie><Tooltip content={<ChartTip />} /></PieChart>
          </ResponsiveContainer></div>
        ) : <Empty title="Aucune donnée" height={chartH} />}
      </Panel>

      <Panel title="Profil socio-économique des quartiers" subtitle="Segmentation par classe de quartier" icon={Building2}>
        {byClasseQuartier.length ? (
          <div style={{ height: chartH }}><ResponsiveContainer width="100%" height="100%">
            <BarChart data={byClasseQuartier} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.surface} /><XAxis dataKey="name" {...axis} /><YAxis {...axis} allowDecimals={false} />
              <Tooltip content={<ChartTip />} cursor={{ fill: `${C.blue}10` }} />
              <Bar dataKey="value" name="PDV" radius={[4, 4, 0, 0]}>{byClasseQuartier.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Bar>
            </BarChart></ResponsiveContainer></div>
        ) : <Empty title="Aucune donnée" height={chartH} />}
      </Panel>

      <Panel title="Profil stratégique moyen" subtitle="Visibilité · Accessibilité · Affluence · Digital" icon={Gauge}>
        {radarSource.length ? (
          <div style={{ height: chartH }}><ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarSource} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
              <PolarGrid stroke={C.lineL} /><PolarAngleAxis dataKey="axe" tick={{ fontSize: 11, fill: C.sub }} /><PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10, fill: C.muted }} />
              <Radar dataKey="valeur" stroke={C.blue} fill={C.blue} fillOpacity={0.2} strokeWidth={2} /><Tooltip content={<ChartTip />} />
            </RadarChart></ResponsiveContainer></div>
        ) : <Empty title="Aucune donnée" height={chartH} />}
      </Panel>

      <Panel title="Tendance de collecte" subtitle="PDV recensés par date" icon={Calendar}>
        {dailySource.length ? (
          <div style={{ height: chartH }}><ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailySource} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs><linearGradient id="collecteGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.blue} stopOpacity={0.25} /><stop offset="95%" stopColor={C.blue} stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.surface} /><XAxis dataKey="date" {...axis} /><YAxis {...axis} allowDecimals={false} />
              <Tooltip content={<ChartTip />} /><Area type="monotone" dataKey="total" name="PDV collectés" stroke={C.blue} fill="url(#collecteGrad)" strokeWidth={2.5} />
            </AreaChart></ResponsiveContainer></div>
        ) : <Empty title="Aucune donnée" height={chartH} />}
      </Panel>

      <Panel title="Comparatif des communes" subtitle="Score moyen, PDV premium, éligibles et façade moyenne (10 premières communes)" icon={BarChart3} span>
        {topCommunes.length ? (
          <div style={{ height: chartH + 20 }}><ResponsiveContainer width="100%" height="100%">
            <LineChart data={topCommunes} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.surface} /><XAxis dataKey="commune" {...axis} /><YAxis {...axis} />
              <Tooltip content={<ChartTip />} /><Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="scoreMoyen" name="Score moyen" stroke={C.navy} strokeWidth={2.5} dot={{ r: 4, fill: C.navy, stroke: "#fff", strokeWidth: 2 }} />
              <Line type="monotone" dataKey="premium" name="Premium" stroke={C.violet} strokeWidth={2.5} dot={{ r: 4, fill: C.violet, stroke: "#fff", strokeWidth: 2 }} />
              <Line type="monotone" dataKey="eligiblesBranding" name="Éligibles" stroke={C.green} strokeWidth={2.5} dot={{ r: 4, fill: C.green, stroke: "#fff", strokeWidth: 2 }} />
              <Line type="monotone" dataKey="facadeMoy" name="Façade moy. (m)" stroke={C.amber} strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3, fill: C.amber, stroke: "#fff", strokeWidth: 2 }} />
            </LineChart></ResponsiveContainer></div>
        ) : <Empty title="Aucune donnée" height={chartH} />}
      </Panel>

      <Panel title="Matrice façade × score (OTS)" subtitle="Grande façade + fort score = meilleures opportunités" icon={Ruler} span>
        {scatterData.length ? (
          <div style={{ height: chartH + 20 }}><ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid stroke={C.surface} />
              <XAxis type="number" dataKey="x" name="Façade (m)" {...axis} label={{ value: "Façade (m)", position: "insideBottomRight", offset: -5, fontSize: 11, fill: C.muted }} />
              <YAxis type="number" dataKey="y" name="Score" {...axis} label={{ value: "Score", angle: -90, position: "insideLeft", offset: 10, fontSize: 11, fill: C.muted }} />
              <ZAxis type="number" dataKey="z" range={[30, 200]} name="Accessibilité" />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} content={({ active, payload }: any) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload;
                return (<div style={{ background: "#fff", border: `1px solid ${C.lineL}`, borderRadius: 10, padding: "8px 10px", fontSize: 12, maxWidth: 190 }}>
                  <p style={{ fontWeight: 700, color: C.text, marginBottom: 3 }}>{d?.name}</p><p style={{ color: C.muted }}>Façade : <strong style={{ color: C.text }}>{d?.x} m</strong></p><p style={{ color: C.muted }}>Score : <strong style={{ color: C.text }}>{d?.y}</strong></p></div>);
              }} />
              <Scatter name="PDV" data={scatterData} fill={C.blue} fillOpacity={0.55} />
            </ScatterChart></ResponsiveContainer></div>
        ) : <Empty title="Aucune donnée" height={chartH} />}
      </Panel>

      <Panel title="Opportunités de branding" subtitle="PDV non brandés, triés par score" icon={Megaphone} span>
        <DataTable<PointOfSale> data={opportunities} columns={posColumns} searchKeys={["name", "commune", "quartier", "owner"]} exportName="opportunites_branding" emptyMsg="Aucune opportunité" defaultSort={{ key: "score", asc: false }} />
      </Panel>
    </div>
  );

  const renderDirectionExtras = () => (
    <Panel title="Qualité de la donnée" subtitle="Ce qui conditionne la fiabilité des scores et des ciblages" icon={ShieldCheck} span>
      <div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <Bar1 label="Fiches vérifiées < 90 jours" value={pctOf(totals.frais)} pct color={pctOf(totals.frais) >= 80 ? C.green : C.amber} target="Cible : > 80 %" />
        <Bar1 label="Coordonnées GPS valides" value={pctOf(totals.gpsValides)} pct color={pctOf(totals.gpsValides) >= 90 ? C.green : C.amber} target="Condition d'une preuve géolocalisée" />
        <Bar1 label="Fiches complètes" value={pctOf(totals.ficheOk)} pct color={pctOf(totals.ficheOk) >= 90 ? C.green : C.amber} target="Nom, propriétaire, adresse, téléphone, GPS" />
        <Bar1 label="PDV avec au moins 4 photos" value={pctOf(totals.photosOk)} pct color={pctOf(totals.photosOk) >= 80 ? C.green : C.amber} target="Façade, intérieur, axe, environnement" />
      </div>
    </Panel>
  );

  const renderOperations = () => (
    <div style={{ display: "grid", gap: 16 }}>
      <Panel title="Qualité de collecte par agent" subtitle="GPS · fiches complètes · photos" icon={Users}>
        {agentsPerformance.length === 0 ? <Empty title="Aucune donnée agent" /> : (
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
            {agentsPerformance.slice(0, 8).map((a) => (
              <div key={a.agent} style={{ border: `1px solid ${C.lineL}`, borderRadius: 12, padding: 14 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{a.agent_name || a.agent}</p>
                <p style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>{a.total} PDV recensés</p>
                <div style={{ display: "grid", gap: 10 }}>
                  <Bar1 label="GPS valides" value={a.gps_rate || 0} pct color={C.navy} />
                  <Bar1 label="Fiches complètes" value={a.complete_rate || 0} pct color={C.blue} />
                  <Bar1 label="Photos moy." value={a.photo_avg || 0} max={8} color={C.green} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
      <Panel title="Aperçu cartographique" subtitle="Distribution géographique des PDV filtrés" icon={MapPin}
        right={<button onClick={() => setView("carte")} style={{ ...btnGhost, padding: "5px 10px", color: C.blue }}><MapPin size={12} /> Carte complète →</button>}>
        <LeafletMap points={filtered} activeLayer="all" onSelectPoint={openFiche} />
      </Panel>
    </div>
  );

  const renderCiblage = () => (
    <div style={{ display: "grid", gap: 16 }}>
      <Panel title="Définir le besoin du client" subtitle="Choisissez un secteur, puis ajustez les critères pour trouver les PDV les plus pertinents" icon={Target}>
        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginBottom: 14 }}>
          <Field label="Entreprise cliente" icon={Building2}><input style={inputStyle} value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Ex : BNI" /></Field>
          <Field label="Projet / campagne" icon={Target}><input style={inputStyle} value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="Ex : Déploiement Agency Banking" /></Field>
          <Field label="Base utilisée" icon={Layers3}>
            <Select value={useGlobalFilters ? "filtres" : "toute"} onChange={(v) => setUseGlobalFilters(v === "filtres")}>
              <option value="toute">Toute la base ({fmt(pointsOfSale.length)} PDV)</option>
              <option value="filtres">PDV filtrés actuellement ({fmt(filtered.length)})</option>
            </Select>
          </Field>
        </div>
        <Field label="Objectif marketing (facultatif)" icon={FileText}>
          <textarea rows={2} style={{ ...inputStyle, height: "auto", padding: 10, resize: "vertical" }} value={campaignObjective} onChange={(e) => setCampaignObjective(e.target.value)} placeholder="Ex : identifier les PDV pouvant héberger un agent bancaire pour dépôts, retraits et mobile money" />
        </Field>

        <p style={{ fontSize: 12, fontWeight: 700, color: C.blue, margin: "18px 0 10px", display: "flex", alignItems: "center", gap: 6 }}><Briefcase size={12} /> Secteur d'activité</p>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))" }}>
          {BUSINESS_TEMPLATES.map((t) => {
            const on = templateId === t.id;
            return (
              <button key={t.id} onClick={() => applyTemplate(t)} aria-pressed={on}
                style={{ textAlign: "left", padding: 12, borderRadius: 12, cursor: "pointer", fontFamily: "inherit", background: on ? `${t.color}10` : "#fff", border: `1.5px solid ${on ? t.color : C.lineL}` }}>
                <span style={{ width: 30, height: 30, borderRadius: 9, background: `${t.color}18`, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}><t.icon size={14} style={{ color: t.color }} /></span>
                <p style={{ fontSize: 12, fontWeight: 700, color: on ? t.color : C.text }}>{t.label}</p>
                <p style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{t.secteur}</p>
              </button>
            );
          })}
        </div>
        {template && <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: C.pale, border: `1px solid ${C.lineL}`, fontSize: 12, color: C.sub }}>{template.description}</div>}

        <div style={{ display: "grid", gap: 28, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", marginTop: 22 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.blue, display: "flex", alignItems: "center", gap: 6 }}><SlidersHorizontal size={12} /> Pondération des critères</p>
              {template && <button onClick={() => applyTemplate(template)} style={{ ...btnGhost, padding: "3px 10px", fontSize: 11 }}><RotateCcw size={11} /> Réinitialiser</button>}
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              {CRITERIA.map(([key, label]) => (
                <div key={key}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                    <span style={{ color: C.muted }}>{label}</span>
                    <strong style={{ color: C.text }}>{weights[key]} <span style={{ fontWeight: 500, color: C.muted }}>({Math.round((weights[key] / weightTotal) * 100)} %)</span></strong>
                  </div>
                  <input type="range" min={0} max={40} step={1} value={weights[key]} aria-label={label} onChange={(e) => setWeights((w) => ({ ...w, [key]: Number(e.target.value) }))} style={{ width: "100%", accentColor: C.blue, cursor: "pointer" }} />
                </div>
              ))}
            </div>
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.blue, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}><ShieldCheck size={12} /> Critères éliminatoires</p>
            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}><span style={{ color: C.muted }}>Opérateurs minimum</span><strong>{hardFilters.minOperateurs}</strong></div>
                <input type="range" min={0} max={4} step={1} value={hardFilters.minOperateurs} aria-label="Opérateurs minimum" onChange={(e) => setHardFilters((h) => ({ ...h, minOperateurs: Number(e.target.value) }))} style={{ width: "100%", accentColor: C.blue }} />
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}><span style={{ color: C.muted }}>Façade minimum</span><strong>{hardFilters.minFacade} m</strong></div>
                <input type="range" min={0} max={20} step={1} value={hardFilters.minFacade} aria-label="Façade minimum" onChange={(e) => setHardFilters((h) => ({ ...h, minFacade: Number(e.target.value) }))} style={{ width: "100%", accentColor: C.blue }} />
              </div>
              <Field label="Branding requis" icon={BadgePercent}>
                <Select value={hardFilters.brandingRequis} onChange={(v) => setHardFilters((h) => ({ ...h, brandingRequis: v as HardFilters["brandingRequis"] }))}>
                  <option>Tous</option><option>Brandé</option><option>Non brandé</option>
                </Select>
              </Field>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: C.sub }}>
                <input type="checkbox" checked={hardFilters.requireGrandeVoie} onChange={(e) => setHardFilters((h) => ({ ...h, requireGrandeVoie: e.target.checked }))} /> Situé sur une grande voie uniquement
              </label>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}><span style={{ color: C.muted }}>PDV à retenir (top N)</span><strong>{topN}</strong></div>
                <input type="range" min={5} max={100} step={5} value={topN} aria-label="Nombre de PDV à retenir" onChange={(e) => setTopN(Number(e.target.value))} style={{ width: "100%", accentColor: C.blue }} />
              </div>
            </div>
          </div>
        </div>
      </Panel>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
        <Kpi label="PDV éligibles" value={fmt(targetingStats.eligiblesTotal)} sub="Après critères éliminatoires" color={C.green} icon={CheckCircle2} />
        <Kpi label="PDV retenus" value={fmt(targetingStats.total)} sub={`Top ${topN} par correspondance`} color={C.blueD} icon={Target} />
        <Kpi label="Correspondance moyenne" value={`${targetingStats.scoreMoyen}/100`} sub={`Affluence moy. ${targetingStats.affluenceMoyenne}/100`} color={C.violet} icon={Gauge} />
        <Kpi label="Communes couvertes" value={fmt(targetingStats.communesCouvertes)} sub={`Digital moy. ${targetingStats.digitalMoyen}/100`} color={C.amber} icon={Globe} />
      </div>

      <Panel title="Synthèse de ciblage" subtitle="Résumé utilisable dans la présentation client" icon={FileText}>
        <p style={{ fontSize: 13, lineHeight: 1.7, color: C.sub }}>
          {targetingStats.total > 0 ? (
            <>Sur la base analysée, <strong>{fmt(targetingStats.eligiblesTotal)} points de vente</strong> répondent aux critères éliminatoires{clientName ? ` définis pour ${clientName}` : ""}.
              Les <strong>{targetingStats.total} PDV</strong> les mieux placés {campaignName ? `pour « ${campaignName} » ` : ""}ont une correspondance moyenne de <strong>{targetingStats.scoreMoyen}/100</strong>,
              répartis sur <strong>{targetingStats.communesCouvertes} commune(s)</strong>, avec une affluence moyenne de {targetingStats.affluenceMoyenne}/100 et une digitalisation moyenne de {targetingStats.digitalMoyen}/100.</>
          ) : "Assouplissez les critères pour obtenir une liste de PDV."}
        </p>
      </Panel>

      <Panel title="Carte des PDV ciblés" subtitle="Les meilleures correspondances" icon={MapPin}>
        {targetingTop.length ? <LeafletMap points={targetingMapPoints} activeLayer="all" onSelectPoint={openFiche} /> : <Empty title="Aucun PDV ne correspond" text="Assouplissez les critères éliminatoires." />}
      </Panel>

      <Panel title="Liste des PDV ciblés" subtitle="Classés par correspondance, avec les trois critères qui pèsent le plus" icon={Users}
        right={<button onClick={exportTargeting} style={btn(C.blue)}><Download size={12} /> Exporter le ciblage</button>}>
        <DataTable<TargetingResult> data={targetingTop} columns={targetingColumns} searchKeys={["name", "commune", "quartier"]} exportName="ciblage_pdv" emptyMsg="Aucun PDV ne correspond" defaultSort={{ key: "match", asc: false }} />
      </Panel>
    </div>
  );

  const renderCarte = () => (
    <div style={{ display: "grid", gap: 16 }}>
      <Panel title="Carte interactive des points de vente" subtitle="Regroupés, points ou chaleur · cliquez sur un marqueur pour ouvrir la fiche" icon={MapPin}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ display: "grid", gap: 14, alignContent: "start", flex: "0 1 270px", minWidth: 240 }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.blue, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><Layers3 size={12} /> Couches</p>
              <div style={{ display: "grid", gap: 6 }}>
                {mapLayers.map(({ id, label, count }) => {
                  const on = activeLayer === id, color = MAP_LAYER_COLORS[id];
                  return (
                    <button key={id} onClick={() => setActiveLayer(id)} aria-pressed={on}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", textAlign: "left", background: on ? `${color}14` : "#fff", border: `1.5px solid ${on ? color : C.lineL}` }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, color: on ? color : C.sub }}><span style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />{label}</span>
                      <strong style={{ fontSize: 12, color: on ? color : C.text }}>{fmt(count)}</strong>
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ padding: 12, borderRadius: 12, background: C.pale, border: `1px solid ${C.lineL}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.sub }}>Score minimum</span>
                <Pill bg={C.blue} tx="#fff">≥ {mapScoreMin}</Pill>
              </div>
              <input type="range" min={0} max={100} step={5} value={mapScoreMin} aria-label="Score minimum" onChange={(e) => setMapScoreMin(Number(e.target.value))} style={{ width: "100%", accentColor: C.blue }} />
              {mapScoreMin > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: C.muted }}>
                  <span>{fmt(layerPoints.length)} PDV visibles</span>
                  <button onClick={() => setMapScoreMin(0)} style={{ background: "none", border: "none", cursor: "pointer", color: C.red, fontWeight: 600, fontSize: 11 }}>Réinitialiser</button>
                </div>
              )}
            </div>
          </div>
          <div style={{ flex: "1 1 420px", minWidth: 0 }}>
            <LeafletMap points={filtered} activeLayer={activeLayer} onSelectPoint={openFiche} scoreMin={mapScoreMin} height={560} />
          </div>
        </div>
      </Panel>
      <Panel title="Points de vente affichés" subtitle={`Couche : ${mapLayers.find((l) => l.id === activeLayer)?.label}${mapScoreMin > 0 ? ` · score ≥ ${mapScoreMin}` : ""}`} icon={Store}>
        <DataTable<PointOfSale> data={layerPoints} columns={posColumns} searchKeys={["name", "commune", "quartier", "owner"]} exportName="pdv_carte" emptyMsg="Aucun PDV" defaultSort={{ key: "score", asc: false }} />
      </Panel>
    </div>
  );

  const renderFiche = () => {
    if (!selected) return <div style={card}><Empty title="Aucun PDV sélectionné" text="Choisissez un point de vente dans une liste ou sur la carte." /></div>;
    const badge = scoreBadge(selected.score);
    const idx = filtered.findIndex((p) => p.id === selected.id);
    const go = (d: number) => { const n = filtered[idx + d]; if (n) setSelectedId(n.id); };
    const synth: [string, string][] = [
      ["Score global", `${selected.score}/100`], ["Potentiel", selected.potentiel_label], ["Branding", selected.branding], ["Grande voie", selected.grandeVoie ? "Oui" : "Non"],
      ["Façade visible", `${selected.facade_metres} m`], ["Ancienneté", `${selected.anciennete_annees} ans`], ["Concurrents", selected.nb_concurrents_label],
      ["Classe quartier", selected.classe_quartier_label], ["CA mensuel", `${fmt(selected.caMensuel)} CFA`], ["Agent", selected.agent_name || selected.agent],
      ["Propriétaire", selected.owner || "—"], ["Téléphone", selected.phone || "—"], ["Date collecte", selected.dateCollecte], ["Photos", `${selected.photos_count}`],
    ];
    const elig = [
      { label: "Branding", ok: selected.eligibiliteBranding }, { label: "Exclusivité", ok: selected.eligibiliteExclusivite }, { label: "Activation promo", ok: selected.eligibiliteActivation },
      { label: "GPS valide", ok: selected.gpsValid }, { label: "Fiche complète", ok: selected.ficheComplete },
    ];
    return (
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ background: C.navy, borderRadius: 16, padding: 20, display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div>
            <Pill bg="rgba(255,255,255,.18)" tx="#fff">{badge.label}</Pill>
            <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 700, marginTop: 8 }}>{selected.name}</h2>
            <p style={{ color: "rgba(200,230,248,.9)", fontSize: 12, marginTop: 4 }}>{selected.commune}{selected.quartier ? ` · ${selected.quartier}` : ""} · {selected.type}</p>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10, flexWrap: "wrap" }}>
              <OpsRow p={selected} />
              <Pill bg="rgba(79,179,232,.2)" tx={C.blueL}>{selected.nb_operateurs}/4 opérateurs · Digital {selected.digitalisation}/100</Pill>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button onClick={() => go(-1)} disabled={idx <= 0} aria-label="PDV précédent" style={{ ...btn("rgba(79,179,232,.2)"), opacity: idx <= 0 ? 0.4 : 1 }}><ChevronLeft size={13} /> Précédent</button>
            <button onClick={() => go(1)} disabled={idx < 0 || idx >= filtered.length - 1} aria-label="PDV suivant" style={{ ...btn("rgba(79,179,232,.2)"), opacity: idx < 0 || idx >= filtered.length - 1 ? 0.4 : 1 }}>Suivant <ChevronRight size={13} /></button>
            <button onClick={() => setView("marketing")} style={btn(C.blue)}>Retour</button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ flex: "2 1 460px", display: "grid", gap: 16, minWidth: 0, alignContent: "start" }}>
            <Panel title={`Galerie photos (${selected.photos_count})`} icon={Camera}>
              <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
                {selected.photos?.length > 0 ? selected.photos.map((ph, i) => (
                  <button key={ph.id} onClick={() => openLightbox(selected, i)} aria-label={`Agrandir ${ph.caption || ph.type || `photo ${i + 1}`}`}
                    style={{ padding: 0, textAlign: "left", cursor: "zoom-in", border: `1px solid ${C.lineL}`, borderRadius: 12, overflow: "hidden", background: "#fff", fontFamily: "inherit" }}>
                    <div style={{ position: "relative", height: 100, background: C.surface }}>
                      <img src={ph.thumbnail || ph.image} alt={ph.caption || ph.type} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      <ZoomIn size={16} style={{ position: "absolute", right: 6, bottom: 6, color: "#fff", filter: "drop-shadow(0 1px 2px rgba(0,0,0,.6))" }} />
                    </div>
                    <p style={{ padding: "6px 8px", fontSize: 11, fontWeight: 500, color: C.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ph.caption || ph.type || `Photo ${i + 1}`}</p>
                  </button>
                )) : ["Façade", "Intérieur", "Axe principal", "Environnement"].map((label, i) => (
                  <button key={label} onClick={() => selected.photos_count > 0 && openLightbox(selected, i)} disabled={selected.photos_count === 0}
                    style={{ padding: 0, border: `1px solid ${C.lineL}`, borderRadius: 12, overflow: "hidden", background: "#fff", cursor: selected.photos_count > 0 ? "pointer" : "default", fontFamily: "inherit" }}>
                    <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center", background: C.pale }}>
                      {selected.photos_count > 0 ? <Loader2 size={18} className="lf-spin" style={{ color: C.muted }} /> : <Camera size={18} style={{ color: C.line }} />}
                    </div>
                    <p style={{ padding: "6px 8px", fontSize: 11, color: C.muted }}>{label}</p>
                  </button>
                ))}
              </div>
            </Panel>

            <Panel title="Analyse stratégique A / D / E" icon={Target}>
              <div style={{ display: "grid", gap: 14 }}>
                <Bar1 label="A · Branding & OTS façade (max 25)" value={selected.scoreA} max={25} color={C.violet} />
                <Bar1 label="D · Potentiel commercial (max 40)" value={selected.scoreD} max={40} color={C.navy} />
                <Bar1 label="E · Environnement stratégique (max 35)" value={selected.scoreE} max={35} color={C.green} />
              </div>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.blue, margin: "20px 0 10px", display: "flex", alignItems: "center", gap: 6 }}>
                <Wifi size={12} /> Digitalisation · {selected.nb_operateurs} opérateur{selected.nb_operateurs !== 1 ? "s" : ""} · {selected.digitalisation}/100
              </p>
              <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))" }}>
                {OPS.map((op) => {
                  const on = selected[op];
                  return (
                    <div key={op} style={{ textAlign: "center", padding: 10, borderRadius: 12, background: on ? `${OPERATOR_COLORS[op]}12` : C.pale, border: `1.5px solid ${on ? OPERATOR_COLORS[op] : C.lineL}` }}>
                      <div style={{ opacity: on ? 1 : 0.3, display: "flex", justifyContent: "center" }}>{OPERATOR_LOGOS[op]}</div>
                      <p style={{ fontSize: 10, fontWeight: 700, marginTop: 6, color: on ? C.text : C.muted }}>{on ? "✓ Présent" : "Absent"}</p>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: C.pale, border: `1px solid ${C.lineL}`, fontSize: 12, lineHeight: 1.7, color: C.sub }}>
                <strong style={{ color: C.text }}>Diagnostic express : </strong>
                PDV {selected.branding === "Non brandé" ? "non brandé" : "déjà brandé"}, façade de {selected.facade_metres} m, {selected.anciennete_annees} an(s) d'ancienneté, {selected.nb_concurrents_label.toLowerCase()} concurrent(s) à 300 m, quartier {selected.classe_quartier_label.toLowerCase()}.{" "}
                {selected.nb_operateurs > 0 ? `${selected.nb_operateurs} opérateur(s) mobile(s) présent(s).` : "Aucun opérateur mobile présent."} Collecte le {selected.dateCollecte}.{" "}
                {selected.eligibiliteBranding ? "Immédiatement exploitable pour une offre de branding." : "À suivre selon le ciblage commercial."}
              </div>
            </Panel>

            <Panel title="Localisation GPS" icon={MapPin}>
              {selected.latitude && selected.longitude ? (
                <>
                  <LeafletMap points={singlePoint} activeLayer="all" onSelectPoint={() => {}} height={240} compact />
                  <p style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>{selected.latitude.toFixed(6)}, {selected.longitude.toFixed(6)}{selected.address && ` · ${selected.address}`}</p>
                </>
              ) : <Empty title="Coordonnées GPS non disponibles" text="Cette fiche n'apparaît pas sur la carte tant qu'elle n'est pas géolocalisée." />}
            </Panel>
          </div>

          <div style={{ flex: "1 1 300px", display: "grid", gap: 16, alignContent: "start", minWidth: 0 }}>
            <Panel title="Synthèse PDV" icon={Store}>
              <dl style={{ margin: 0 }}>
                {synth.map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "7px 0", borderBottom: `1px solid ${C.surface}` }}>
                    <dt style={{ fontSize: 12, color: C.muted }}>{k}</dt>
                    <dd style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.text, textAlign: "right", maxWidth: "58%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</dd>
                  </div>
                ))}
              </dl>
            </Panel>
            <Panel title="Éligibilités" icon={CheckCircle2}>
              <div style={{ display: "grid", gap: 6 }}>
                {elig.map(({ label, ok }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 10, background: ok ? C.greenBg : C.pale, border: `1px solid ${ok ? "#A4E4CC" : C.lineL}` }}>
                    <span style={{ fontSize: 12, color: C.sub }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: ok ? C.greenTx : C.muted }}>{ok ? "✓ Oui" : "—"}</span>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Autres PDV" icon={Users}>
              <div style={{ display: "grid", gap: 4, maxHeight: 260, overflowY: "auto" }}>
                {filtered.slice(0, 30).map((p) => {
                  const on = p.id === selected.id;
                  return (
                    <button key={p.id} onClick={() => setSelectedId(p.id)} aria-current={on ? "true" : undefined}
                      style={{ textAlign: "left", padding: "8px 10px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", background: on ? C.pale : "transparent", border: `1px solid ${on ? C.line : "transparent"}` }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: on ? C.navy : C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                      <p style={{ fontSize: 11, color: C.muted }}>{p.commune} · score {p.score}</p>
                    </button>
                  );
                })}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    );
  };

  /* ─── États globaux ─── */
  if (loading && pointsOfSale.length === 0) {
    return (
      <div style={{ ...card, padding: 56, textAlign: "center" }}>
        <style>{GLOBAL_CSS}</style>
        <Loader2 className="lf-spin" size={26} style={{ color: C.blue, margin: "0 auto 10px" }} />
        <p style={{ fontSize: 13, color: C.muted }}>Chargement des points de vente…</p>
      </div>
    );
  }
  if (error && pointsOfSale.length === 0) {
    return (
      <div style={{ ...card, padding: 40, textAlign: "center" }}>
        <style>{GLOBAL_CSS}</style>
        <AlertTriangle size={28} style={{ color: C.red, margin: "0 auto 10px" }} />
        <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Erreur de chargement</p>
        <p style={{ fontSize: 12, color: C.muted, margin: "6px 0 14px" }}>{error}</p>
        <button onClick={() => fetchPoints()} style={btn(C.blue)}>Réessayer</button>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <style>{GLOBAL_CSS}</style>

      {/* Bandeau */}
      <div style={{ background: C.navy, borderRadius: 16, padding: 20, display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <BarChart3 size={16} style={{ color: C.blueL }} /><span style={{ color: "rgba(200,230,248,.9)", fontSize: 12, fontWeight: 600 }}>LanfiaLink Analyse POS</span>
          </div>
          <p style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>Scores, potentiel et ciblage de vos points de vente</p>
          <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
            {OPS.map((op) => (
              <span key={op} style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 2 }}>{OPERATOR_LOGOS[op]}
                <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(200,230,248,.9)" }}>{fmt(totals[`${op}Count` as const])}</span></span>
            ))}
            <Pill bg="rgba(79,179,232,.2)" tx={C.blueL}>{fmt(totals.pdvMultiOp)} PDV multi-opérateurs</Pill>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "inline-flex", flexWrap: "wrap", gap: 2, padding: 4, borderRadius: 12, background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.2)" }}>
            {viewItems.map((i) => (
              <button key={i.value} onClick={() => setView(i.value)} aria-pressed={view === i.value}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit", background: view === i.value ? C.blue : "transparent", color: view === i.value ? "#fff" : "rgba(200,230,248,.9)" }}>
                <i.icon size={12} />{i.label}
              </button>
            ))}
          </div>
          <button onClick={() => fetchPoints(true)} disabled={refreshing} style={{ ...btn("rgba(79,179,232,.18)"), opacity: refreshing ? 0.7 : 1 }}><RefreshCw size={13} className={refreshing ? "lf-spin" : undefined} />{refreshing ? "Actualisation…" : "Actualiser"}</button>
          <button onClick={handleExport} style={btn(C.blue)}><Download size={13} /> Exporter CSV</button>
        </div>
      </div>

      {error && (
        <div role="alert" style={{ display: "flex", gap: 10, alignItems: "center", padding: 12, borderRadius: 12, background: C.redBg, color: C.redTx, fontSize: 12 }}>
          <AlertTriangle size={14} /><span style={{ flex: 1 }}>{error}</span>
          <button onClick={() => fetchPoints(true)} style={{ ...btnGhost, padding: "4px 10px", color: C.redTx }}>Réessayer</button>
        </div>
      )}

      {/* Filtres */}
      <div style={{ ...card, padding: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => setFiltersOpen((o) => !o)} aria-expanded={filtersOpen}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
            <SlidersHorizontal size={14} style={{ color: C.blue }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Filtres</span>
            <span style={{ fontSize: 11, color: C.muted }}>{chips.length ? `${chips.length} actif${chips.length > 1 ? "s" : ""}` : "aucun"}</span>
            <ChevronDown size={14} style={{ color: C.muted, transform: filtersOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ minWidth: 150 }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: C.text, lineHeight: 1 }}>{fmt(filtered.length)} <span style={{ fontSize: 11, fontWeight: 500, color: C.muted }}>/ {fmt(pointsOfSale.length)} PDV</span></p>
              <div style={{ height: 5, borderRadius: 99, background: C.surface, marginTop: 6, overflow: "hidden" }}><div style={{ width: `${Math.round((filtered.length / Math.max(pointsOfSale.length, 1)) * 100)}%`, height: "100%", background: C.blue, transition: "width .4s" }} /></div>
            </div>
            {chips.length > 0 && <button onClick={resetFilters} style={{ ...btnGhost, padding: "5px 10px", color: C.red }}><RotateCcw size={11} /> Réinitialiser</button>}
          </div>
        </div>

        <div style={{ position: "relative", marginTop: 12 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: search ? C.blue : C.muted }} />
          <input aria-label="Rechercher un PDV" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un PDV, un propriétaire, une commune, un quartier…"
            style={{ ...inputStyle, height: 40, paddingLeft: 34, paddingRight: 34, background: C.surface, borderColor: search ? C.blue : "transparent" }} />
          {search && <button onClick={() => setSearch("")} aria-label="Effacer la recherche" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.muted }}><X size={14} /></button>}
        </div>

        {chips.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
            {chips.map((c) => (
              <span key={c.key} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 4px 4px 10px", borderRadius: 99, background: C.pale, border: `1px solid ${C.line}`, color: C.blueD, fontSize: 11, fontWeight: 600 }}>
                {c.label}
                <button onClick={c.clear} aria-label={`Retirer le filtre ${c.label}`} style={{ width: 18, height: 18, borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer", color: C.red, display: "flex", alignItems: "center", justifyContent: "center" }}><X size={11} /></button>
              </span>
            ))}
          </div>
        )}

        {filtersOpen && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.surface}`, display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
            <Field label="Commune" icon={MapPin}><Select value={commune} onChange={setCommune} active={commune !== "Toutes"}><option>Toutes</option>{communes.map((c) => <option key={c}>{c}</option>)}</Select></Field>
            <Field label="Quartier" icon={MapPin}><Select value={quartier} onChange={setQuartier} active={quartier !== "Tous"}><option>Tous</option>{quartiers.map((q) => <option key={q}>{q}</option>)}</Select></Field>
            <Field label="District" icon={Navigation}><Select value={district} onChange={setDistrict} active={district !== "Tous"}><option>Tous</option>{districts.map((d) => <option key={d}>{d}</option>)}</Select></Field>
            <Field label="Région" icon={Globe}><Select value={region} onChange={setRegion} active={region !== "Toutes"}><option>Toutes</option>{regions.map((r) => <option key={r}>{r}</option>)}</Select></Field>
            <Field label="Type de PDV" icon={Store}><Select value={type} onChange={setType} active={type !== "Tous"}><option>Tous</option>{types.map((t) => <option key={t.value}>{t.label}</option>)}</Select></Field>
            <Field label="Concurrents à 300 m" icon={Swords}><Select value={nbConcurrents} onChange={setNbConcurrents} active={nbConcurrents !== "Tous"}><option>Tous</option>{concurrentsOpts.map((c) => <option key={c.value}>{c.label}</option>)}</Select></Field>
            <Field label="Classe du quartier" icon={Building2}><Select value={classeQuartier} onChange={setClasseQuartier} active={classeQuartier !== "Tous"}><option>Tous</option>{classesOpts.map((c) => <option key={c.value}>{c.label}</option>)}</Select></Field>
            <Field label="Collecte du" icon={Calendar}><input type="date" style={inputStyle} value={dateDebut} onChange={(e) => { setDateDebut(e.target.value); if (dateFin && e.target.value > dateFin) setDateFin(""); }} /></Field>
            <Field label="au" icon={Calendar}><input type="date" style={inputStyle} value={dateFin} onChange={(e) => { setDateFin(e.target.value); if (dateDebut && e.target.value < dateDebut) setDateDebut(""); }} /></Field>

            <div style={{ gridColumn: "1 / -1", display: "grid", gap: 14 }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.sub, marginRight: 4 }}>Branding</span>
                {[{ v: "Tous", c: C.blue }, { v: "Brandé", c: C.green }, { v: "Non brandé", c: C.amber }].map(({ v, c }) => (
                  <button key={v} onClick={() => setBranding(v)} aria-pressed={branding === v} style={{ padding: "4px 12px", borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: branding === v ? c : "#fff", color: branding === v ? "#fff" : C.sub, border: `1.5px solid ${branding === v ? c : C.line}` }}>{v}</button>
                ))}
                <span style={{ fontSize: 12, fontWeight: 600, color: C.sub, margin: "0 4px 0 14px" }}>Potentiel</span>
                {potentielOptions.map((o) => (
                  <button key={o.value} onClick={() => setPotentiel(o.value)} aria-pressed={potentiel === o.value} style={{ padding: "4px 12px", borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: potentiel === o.value ? o.color : "#fff", color: potentiel === o.value ? "#fff" : C.sub, border: `1.5px solid ${potentiel === o.value ? o.color : C.line}` }}>{o.label}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.sub, marginRight: 4 }}>Opérateurs (tous requis)</span>
                {OPS.map((op) => {
                  const on = operateurFilter[op], c = OPERATOR_COLORS[op];
                  return (
                    <button key={op} onClick={() => setOperateurFilter((f) => ({ ...f, [op]: !f[op] }))} aria-pressed={on}
                      style={{ padding: "6px 8px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", background: on ? `${c}16` : "#fff", border: `1.5px solid ${on ? c : C.lineL}`, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                      {OPERATOR_LOGOS[op]}<span style={{ fontSize: 10, fontWeight: 700, color: C.sub }}>{fmt(totals[`${op}Count` as const])} · {pctOf(totals[`${op}Count` as const])} %</span>
                    </button>
                  );
                })}
                <span style={{ fontSize: 12, fontWeight: 600, color: C.sub, margin: "0 4px 0 10px" }}>Minimum</span>
                {[0, 1, 2, 3, 4].map((n) => (
                  <button key={n} onClick={() => setNbOpMinFilter(n)} aria-pressed={nbOpMinFilter === n} style={{ padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: nbOpMinFilter === n ? C.blue : "#fff", color: nbOpMinFilter === n ? "#fff" : C.sub, border: `1.5px solid ${nbOpMinFilter === n ? C.blue : C.line}` }}>{n === 0 ? "Tous" : `≥ ${n}`}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.sub, marginRight: 4 }}>Période de collecte</span>
                {([["7 jours", 7], ["30 jours", 30], ["90 jours", 90], ["Toute la période", null]] as [string, number | null][]).map(([label, days]) => (
                  <button key={label} onClick={() => applyDatePreset(days)} style={{ ...btnGhost, padding: "4px 12px", borderRadius: 99, fontSize: 11 }}>{label}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
        <Kpi label="Points de vente" value={fmt(totals.total)} sub={`${fmt(totals.gpsValides)} géolocalisés`} color={C.navy} icon={Store} />
        <Kpi label="Boutiques brandées" value={fmt(totals.brandes)} sub={`${pctOf(totals.brandes)} % du parc`} color={C.green} icon={BadgePercent} />
        <Kpi label="Digitalisation moyenne" value={`${totals.digitalisationMoy}/100`} sub={`${fmt(totals.pdvMultiOp)} PDV multi-opérateurs`} color={C.blueD} icon={Wifi} />
        <Kpi label="Score moyen" value={`${totals.scoreMoyen}/100`} sub={`A ${totals.scoreA} · D ${totals.scoreD} · E ${totals.scoreE}`} color={C.violet} icon={BarChart3} />
      </div>

      {/* Vues */}
      {view === "graphe" && (
        <MerchantGraphView points={filtered} allPoints={pointsOfSale} selectedId={selectedId} onSelect={setSelectedId} onOpenFiche={openFiche} />
      )}
      {view === "ciblage" && renderCiblage()}
      {view === "carte" && renderCarte()}
      {(view === "executif" || view === "marketing") && (
        <div style={{ display: "grid", gap: 16 }}>
          {view === "executif" && <div style={grid2}>{renderDirectionExtras()}</div>}
          {renderMarketing()}
        </div>
      )}
      {(view === "executif" || view === "operations") && renderOperations()}
      {view === "fiche" && renderFiche()}

      {lightbox && <ImageLightbox images={lightbox.images} initialIndex={lightbox.index} onClose={() => setLightbox(null)} />}
    </div>
  );
}