"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  MapPin, Plus, Search, Edit, Trash2, Eye, Phone, Mail, User, Calendar, AlertCircle, CheckCircle2,
  Clock, Download, Navigation, Building2, Users, ChevronLeft, ChevronRight, ChevronDown, X, Loader2,
  Image as ImageIcon, Map as MapIcon, Upload, Target, Award, Store, BarChart3, Activity, Gauge, Camera,
  ZoomIn, Layers, Smartphone, Wifi, Briefcase, Building, ShoppingBag, RefreshCw, SlidersHorizontal, Save,
} from "lucide-react";
import dynamic from "next/dynamic";
import { apiService } from "./ApiService";

/* ─── Palette (identique aux autres vues admin) ─────────── */
const P = {
  navy: "#0A1E2E", blue: "#1A8FD1", blueL: "#4FB3E8", blueD: "#0D6FAB", banner: "#0D4E7A",
  pale: "#EDF5FA", surface: "#F0F5F9", warm: "#C0D4E6", warmL: "#D4E4F0",
  text: "#0A1E2E", textSub: "#2A4A62", muted: "#5A7A92", mutedD: "#1A4A6A",
  green: "#10B981", orange: "#F59E0B", red: "#EF4444", purple: "#8B5CF6", teal: "#14B8A6",
  pink: "#EC4899", indigo: "#6366F1", cyan: "#06B6D4", gray: "#8AA6BA",
};

const card: React.CSSProperties = { background: "#fff", border: `1px solid ${P.warmL}`, borderRadius: 16, boxShadow: "0 1px 6px rgba(13,80,140,0.06)" };
const inp: React.CSSProperties = {
  width: "100%", padding: "8px 12px", height: 38, border: `1.5px solid ${P.warm}`, borderRadius: 10, fontSize: 13,
  outline: "none", boxSizing: "border-box", fontFamily: "inherit", color: P.text, background: "#fff",
  transition: "border-color 0.15s, box-shadow 0.15s",
};
const lbl: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, color: P.mutedD, marginBottom: 5 };
const btnPrimary: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 15px", borderRadius: 10, background: P.blue,
  color: "#fff", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "inherit",
};
const btnSecondary: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 15px", borderRadius: 10, background: "#fff",
  color: P.mutedD, fontSize: 12, fontWeight: 700, border: `1.5px solid ${P.warm}`, cursor: "pointer", fontFamily: "inherit",
};

const GLOBAL_CSS = `
  @keyframes pvSpin { to { transform: rotate(360deg); } }
  @keyframes pvPop { 0% { transform: scale(0.97); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
  .pv-spin { animation: pvSpin 0.8s linear infinite; }
  .pv-pop { animation: pvPop 0.16s ease; }
  .pv-root input:not([type=checkbox]):not([type=file]):not([type=range]):focus,
  .pv-root select:focus, .pv-root textarea:focus { border-color: #1A8FD1 !important; box-shadow: 0 0 0 3px rgba(26,143,209,0.15); }
  .pv-row { transition: background 0.12s; }
  .pv-row:hover { background: #EDF5FA; }
  .pv-btn { transition: opacity 0.15s, transform 0.1s; }
  .pv-btn:active:not(:disabled) { transform: scale(0.98); }
  .pv-form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
  .pv-geo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .pv-detail-grid { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 16px; }
  .pv-photo-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  @media (max-width: 1000px) { .pv-detail-grid { grid-template-columns: 1fr; } }
  @media (max-width: 760px) {
    .pv-form-grid { grid-template-columns: 1fr; }
    .pv-geo-grid { grid-template-columns: 1fr; }
    .pv-photo-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (prefers-reduced-motion: reduce) { .pv-spin { animation-duration: 2s; } .pv-pop { animation: none; } }
`;

/* ─── Logos opérateurs mobiles ──────────────────────────── */
type LogoProps = { size?: number; active?: boolean };
const OrangeLogo = ({ size = 36, active = true }: LogoProps) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" style={{ opacity: active ? 1 : 0.4 }}>
    <rect width="36" height="36" rx="8" fill={active ? "#FF6600" : "#FFD4B3"} />
    <rect x="8" y="8" width="20" height="20" rx="2" fill="white" />
    <rect x="11" y="11" width="14" height="14" rx="1" fill="#FF6600" />
  </svg>
);
const MTNLogo = ({ size = 36, active = true }: LogoProps) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" style={{ opacity: active ? 1 : 0.4 }}>
    <rect width="36" height="36" rx="8" fill={active ? "#FFCC00" : "#FFF5B3"} />
    <text x="5" y="23" fontSize="11" fontWeight="900" fontFamily="Arial, sans-serif" fill="#003087" letterSpacing="-0.5">MTN</text>
    <rect x="5" y="25" width="26" height="2.5" rx="1.25" fill="#003087" />
    <circle cx="28" cy="12" r="4" fill="#003087" /><circle cx="28" cy="12" r="2" fill="#FFCC00" />
  </svg>
);
const MoovLogo = ({ size = 36, active = true }: LogoProps) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" style={{ opacity: active ? 1 : 0.4 }}>
    <rect width="36" height="36" rx="8" fill={active ? "#0055B3" : "#B3CCEE"} />
    <path d="M6 26 L6 12 L12 20 L18 12 L18 26" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M20 19 Q23 14 26 19 Q29 24 32 19" stroke="#00CFFF" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <circle cx="26" cy="13" r="2" fill="#00CFFF" />
  </svg>
);
const WaveLogo = ({ size = 36, active = true }: LogoProps) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" style={{ opacity: active ? 1 : 0.4 }}>
    <rect width="36" height="36" rx="8" fill={active ? "#1DC6EA" : "#B3ECFF"} />
    <path d="M5 11 L10 25 L15 16 L20 25 L25 11" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M5 28 Q12 24 18 28 Q24 32 31 28" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
    <circle cx="29" cy="14" r="2.5" fill="white" opacity="0.9" />
  </svg>
);

type OperatorKey = "orange" | "mtn" | "moov" | "wave";
const MOBILE_OPERATORS: { key: OperatorKey; label: string; color: string; bg: string; Logo: React.FC<LogoProps> }[] = [
  { key: "orange", label: "Orange CI",   color: "#FF6600", bg: "#FFF3EC", Logo: OrangeLogo },
  { key: "mtn",    label: "MTN CI",      color: "#B58A00", bg: "#FFFBE6", Logo: MTNLogo },
  { key: "moov",   label: "Moov Africa", color: "#0055B3", bg: "#EAF1FF", Logo: MoovLogo },
  { key: "wave",   label: "Wave",        color: "#0E9FC0", bg: "#E6F9FF", Logo: WaveLogo },
];

/* ─── Nature du point ───────────────────────────────────── */
type NatureKey = "distributeur_principal" | "distributeur_secondaire" | "pdv";
const NATURE_OPTIONS: { value: NatureKey; label: string; shortLabel: string; icon: any; color: string; bg: string }[] = [
  { value: "distributeur_principal",  label: "Distributeur principal",  shortLabel: "Dist. principal",  icon: Building,    color: P.indigo, bg: "#EEF0FF" },
  { value: "distributeur_secondaire", label: "Distributeur secondaire", shortLabel: "Dist. secondaire", icon: Briefcase,   color: P.teal,   bg: "#E6FBF8" },
  { value: "pdv",                     label: "PDV",                     shortLabel: "PDV",              icon: ShoppingBag, color: P.orange, bg: "#FFF6E8" },
];
const getNatureOpts = (n: string) => NATURE_OPTIONS.find((x) => x.value === n) || NATURE_OPTIONS[2];
const getNatureLabel = (n: string) => NATURE_OPTIONS.find((x) => x.value === n)?.label || n || "—";

/* ─── Types ─────────────────────────────────────────────── */
interface POSPhoto { id: number; image: string; thumbnail: string | null; type: string; caption: string; order: number; created_at: string; }

interface PointOfSale {
  id: number; name: string; owner: string; phone: string; email: string;
  address: string; latitude: number | null; longitude: number | null;
  district: string; region: string; commune: string; quartier: string;
  type: string; status: string; nature: string;
  potentiel: string; potentiel_label: string;
  registration_date: string; turnover: string; monthly_turnover: string; monthly_orders: number;
  avatar: string | null;
  brander: boolean; marque_brander: string | null; branding_image: string | null;
  score_a: number; score_d: number; score_e: number; score_global: number;
  visibilite: number; accessibilite: number; affluence: number; digitalisation: number;
  moov: boolean; orange: boolean; mtn: boolean; wave: boolean;
  eligibilite_branding: boolean; eligibilite_exclusivite: boolean; eligibilite_activation: boolean;
  gps_valid: boolean; fiche_complete: boolean; grande_voie: boolean;
  nb_concurrents: string; classe_quartier: string; anciennete_annees: number; facade_metres: number;
  agent: string; agent_name: string; date_collecte: string | null;
  photos_count: number; photos?: POSPhoto[];
  created_at?: string; updated_at?: string;
}

/* Brouillon de formulaire (création ou modification) */
type Draft = Partial<Omit<PointOfSale, "latitude" | "longitude">> & { latitude?: number | string | null; longitude?: number | string | null };

interface PhotoUploadItem { id: string; file: File; preview: string; type: string; caption: string; }
interface District { id: number; nom: string; villes_count: number; }
interface Ville { id: number; nom: string; district: number; district_nom: string; quartiers_count: number; }
interface Quartier { id: number; nom: string; ville: number; ville_nom: string; district_nom: string; }
interface PhotosModalState { point: PointOfSale; existing: POSPhoto[]; items: PhotoUploadItem[]; loading: boolean; }

/* ─── Constantes métier ─────────────────────────────────── */
const pointTypes = [
  { value: "boutique", label: "Boutique" }, { value: "supermarche", label: "Supermarché" },
  { value: "superette", label: "Supérette" }, { value: "epicerie", label: "Épicerie" },
  { value: "demi_grossiste", label: "Demi-Grossiste" }, { value: "grossiste", label: "Grossiste" },
];
const statusOptions = [
  { value: "actif", label: "Actif", bg: "#DCF5EC", fg: "#044D38", dot: P.green },
  { value: "suspendu", label: "Suspendu", bg: "#FCE4DC", fg: "#7A2410", dot: P.red },
  { value: "en_attente", label: "En attente", bg: "#FBEFD6", fg: "#7A4F00", dot: P.orange },
];
const potentielLabels: Record<string, string> = { standard: "Standard", developpement: "Développement", fort_potentiel: "Fort potentiel", premium: "Premium" };
const nbConcurrentsOptions = [{ value: "aucun", label: "Aucun" }, { value: "un_deux", label: "1 à 2" }, { value: "trois_plus", label: "3 et +" }];
const classeQuartierOptions = [{ value: "populaire", label: "Populaire" }, { value: "mixte", label: "Mixte" }, { value: "aise", label: "Aisé" }];
const branderOptions = [{ value: "all", label: "Tous" }, { value: "brander", label: "Brandé" }, { value: "non_brander", label: "Non brandé" }];
const PHOTO_TYPES = [
  { value: "facade", label: "Façade", color: P.blue }, { value: "interieur", label: "Intérieur", color: P.teal },
  { value: "axe_principal", label: "Axe principal", color: P.purple }, { value: "environnement", label: "Environnement", color: P.green },
  { value: "autre", label: "Autre", color: P.gray },
];
const REQUIRED_PHOTO_TYPES = ["facade", "interieur", "axe_principal", "environnement"];
const MIN_PHOTOS = 4;

/* ─── Helpers ───────────────────────────────────────────── */
const extractList = <T,>(json: any): T[] => (Array.isArray(json) ? json : Array.isArray(json?.results) ? json.results : []);
const fmt = (n: number) => (Number(n) || 0).toLocaleString("fr-FR");
const isValidCoord = (c: any): c is number => c !== null && c !== undefined && c !== "" && !isNaN(Number(c)) && Number(c) !== 0;
const getStatusOpts = (s: string) => statusOptions.find((x) => x.value === s) || statusOptions[2];
const getTypeLabel = (t: string) => pointTypes.find((x) => x.value === t)?.label || t;
const getPhotoLabel = (t: string) => PHOTO_TYPES.find((x) => x.value === t)?.label || t;
const getPhotoColor = (t: string) => PHOTO_TYPES.find((x) => x.value === t)?.color || P.gray;
const calcDigitalisation = (p: { moov?: boolean; orange?: boolean; mtn?: boolean; wave?: boolean }) =>
  [p.moov, p.orange, p.mtn, p.wave].filter(Boolean).length * 25;
const getActiveOperators = (p: { moov?: boolean; orange?: boolean; mtn?: boolean; wave?: boolean }) => MOBILE_OPERATORS.filter((op) => p[op.key]);
const today = () => new Date().toISOString().split("T")[0];

const parseDate = (s?: string | null) => { if (!s) return null; const d = new Date(s); return isNaN(d.getTime()) ? null : d; };
const inDateRange = (dateStr: string | null | undefined, from: string, to: string) => {
  if (!from && !to) return true;
  const d = parseDate(dateStr); if (!d) return false;
  if (from) { const f = parseDate(from); if (f && d < f) return false; }
  if (to) { const t = parseDate(to); if (t) { const e = new Date(t); e.setHours(23, 59, 59, 999); if (d > e) return false; } }
  return true;
};

const badgeFromScore = (score: number) => {
  if (score >= 85) return { label: "Premium stratégique", bg: "#EADFFB", fg: "#4B2A94" };
  if (score >= 70) return { label: "Haut potentiel", bg: "#DCF5EC", fg: "#044D38" };
  if (score >= 50) return { label: "Développement", bg: "#FBEFD6", fg: "#7A4F00" };
  return { label: "Standard", bg: "#EAF0F5", fg: "#3A5A72" };
};

/* Transforme une réponse d'erreur DRF en texte lisible. */
async function failMsg(res: Response, fallback: string): Promise<string> {
  try {
    const d = await res.json();
    if (typeof d === "string") return d;
    if (d?.detail) return String(d.detail);
    if (d?.message) return String(d.message);
    if (d && typeof d === "object") {
      const parts = Object.entries(d).map(([k, v]) => `${k} : ${Array.isArray(v) ? v.join(", ") : typeof v === "object" ? JSON.stringify(v) : String(v)}`);
      if (parts.length) return `${fallback} — ${parts.join(" · ")}`;
    }
  } catch { /* corps non JSON */ }
  return fallback;
}

const paginationRange = (current: number, total: number): (number | string)[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (current >= total - 3) return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "…", current - 1, current, current + 1, "…", total];
};

const emptyForm = (): Draft => ({
  name: "", owner: "", phone: "", email: "", address: "", type: "boutique", status: "en_attente", nature: "pdv",
  district: "", region: "", commune: "", quartier: "", latitude: "", longitude: "",
  registration_date: today(), avatar: null, brander: false, marque_brander: "", branding_image: null,
  visibilite: 0, accessibilite: 0, affluence: 0, moov: false, orange: false, mtn: false, wave: false,
  grande_voie: false, agent_name: "", date_collecte: "", monthly_turnover: "", monthly_orders: 0,
  nb_concurrents: "aucun", classe_quartier: "populaire", anciennete_annees: 0, facade_metres: 0,
});

function validatePoint(d: Draft): string[] {
  const e: string[] = [];
  if (!d.name?.trim()) e.push("Le nom est obligatoire.");
  if (!d.owner?.trim()) e.push("Le propriétaire est obligatoire.");
  if (!d.phone?.trim()) e.push("Le téléphone est obligatoire.");
  if (!d.email?.trim()) e.push("L'email est obligatoire.");
  else if (!/^\S+@\S+\.\S+$/.test(d.email)) e.push("L'adresse email n'est pas valide.");
  if (!d.address?.trim()) e.push("L'adresse complète est obligatoire.");
  if (!d.district) e.push("Choisissez un district.");
  if (!d.commune) e.push("Choisissez une ville / commune.");
  if (!d.nature) e.push("Choisissez la nature du point.");
  if (!d.registration_date) e.push("La date d'inscription est obligatoire.");
  if (d.brander && !d.marque_brander?.trim()) e.push("Indiquez la marque du distributeur brandé.");
  if (isValidCoord(d.latitude) && (Number(d.latitude) < -90 || Number(d.latitude) > 90)) e.push("La latitude doit être comprise entre -90 et 90.");
  if (isValidCoord(d.longitude) && (Number(d.longitude) < -180 || Number(d.longitude) > 180)) e.push("La longitude doit être comprise entre -180 et 180.");
  return e;
}

const FD_FIELDS = [
  "name", "owner", "phone", "email", "address", "type", "status", "nature", "district", "region", "commune", "quartier",
  "registration_date", "brander", "marque_brander", "visibilite", "accessibilite", "affluence", "moov", "orange", "mtn", "wave",
  "grande_voie", "agent_name", "date_collecte", "monthly_turnover", "monthly_orders",
  "nb_concurrents", "classe_quartier", "anciennete_annees", "facade_metres",
] as const;

function buildPointFD(d: Draft, isEdit: boolean, avatarFile: File | null, brandingFile: File | null): FormData {
  const fd = new FormData();
  FD_FIELDS.forEach((k) => {
    const v = (d as any)[k];
    if (v === null || v === undefined) return;
    if (!isEdit && v === "") return; // à la création, on n'envoie pas les champs vides
    fd.append(k, typeof v === "boolean" ? (v ? "true" : "false") : String(v));
  });
  fd.append("digitalisation", String(calcDigitalisation(d))); // calculée depuis les opérateurs
  if (isValidCoord(d.latitude)) fd.append("latitude", String(d.latitude));
  if (isValidCoord(d.longitude)) fd.append("longitude", String(d.longitude));
  if (!d.brander) fd.set("marque_brander", "");
  if (avatarFile) fd.append("avatar", avatarFile);
  if (brandingFile) fd.append("branding_image", brandingFile);
  return fd;
}

function downloadCsv(name: string, head: string[], rows: (string | number)[][]) {
  const csv = "\uFEFF" + [head, ...rows].map((r) => r.map((f) => `"${String(f ?? "").replace(/"/g, '""')}"`).join(";")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  a.download = name; a.click();
}

/* ─── Carte (sans SSR) ──────────────────────────────────── */
const MapWithNoSSR = dynamic(
  () => import("@/components/Map").then((mod) => (props: any) => <mod.default {...props} showAvatars={props.showAvatars} />),
  {
    ssr: false,
    loading: () => (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: P.surface }}>
        <div style={{ textAlign: "center" }}>
          <Loader2 size={26} className="pv-spin" style={{ color: P.blue, margin: "0 auto 8px" }} />
          <p style={{ color: P.textSub, fontWeight: 600, fontSize: 12, margin: 0 }}>Chargement de la carte…</p>
        </div>
      </div>
    ),
  }
);

/* ─── Petits composants ─────────────────────────────────── */
const Pill = ({ bg, fg, dot, children, style }: { bg: string; fg: string; dot?: string; children: React.ReactNode; style?: React.CSSProperties }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 9999, fontSize: 11, fontWeight: 700, background: bg, color: fg, whiteSpace: "nowrap", ...style }}>
    {dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot }} />}{children}
  </span>
);

const Kpi = ({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: React.ReactNode; sub?: string; color: string }) => (
  <div style={{ ...card, padding: 16, display: "flex", justifyContent: "space-between", gap: 10 }}>
    <div style={{ minWidth: 0 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: P.muted, margin: 0 }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 800, color: P.text, margin: "6px 0 0", fontVariantNumeric: "tabular-nums" }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: P.muted, margin: "3px 0 0" }}>{sub}</p>}
    </div>
    <div style={{ width: 40, height: 40, borderRadius: 11, background: `${color}1A`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon size={18} style={{ color }} />
    </div>
  </div>
);

const CardTitle = ({ icon: Icon, label, right }: { icon: any; label: string; right?: React.ReactNode }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, paddingBottom: 12, marginBottom: 12, borderBottom: `1px solid ${P.warmL}` }}>
    <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: P.text }}><Icon size={14} style={{ color: P.blue }} /> {label}</span>
    {right}
  </div>
);

const SectionTitle = ({ icon: Icon, label }: { icon: any; label: string }) => (
  <h4 style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 800, color: P.text, margin: 0 }}><Icon size={13} style={{ color: P.blue }} /> {label}</h4>
);

const EmptyState = ({ icon, title, sub, action }: { icon: React.ReactNode; title: string; sub?: string; action?: React.ReactNode }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "44px 24px", textAlign: "center" }}>
    <div style={{ width: 52, height: 52, borderRadius: "50%", background: P.pale, display: "flex", alignItems: "center", justifyContent: "center", color: P.blue, marginBottom: 12 }}>{icon}</div>
    <p style={{ fontSize: 14, fontWeight: 700, color: P.text, margin: 0 }}>{title}</p>
    {sub && <p style={{ fontSize: 12, color: P.muted, margin: "4px 0 0", maxWidth: 340 }}>{sub}</p>}
    {action && <div style={{ marginTop: 14 }}>{action}</div>}
  </div>
);

const FormInput = ({ label, value, onChange, type = "text", placeholder = "", disabled = false, min, max, step }: {
  label: string; value: string | number | null | undefined; onChange: (v: string) => void; type?: string; placeholder?: string;
  disabled?: boolean; min?: number; max?: number; step?: string;
}) => (
  <div>
    <label style={lbl}>{label}</label>
    <input type={type} value={value ?? ""} disabled={disabled} min={min} max={max} step={step} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)} style={{ ...inp, background: disabled ? P.surface : "#fff", cursor: disabled ? "not-allowed" : "text" }} />
  </div>
);

const FormSelect = ({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) => (
  <div>
    <label style={lbl}>{label}</label>
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const ScoreInput = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
  <div>
    <label style={{ ...lbl, marginBottom: 4 }}>{label}</label>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <input type="range" min={0} max={100} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ flex: 1, accentColor: P.blue }} />
      <span style={{ fontSize: 12, fontWeight: 800, color: P.text, minWidth: 28, textAlign: "right" }}>{value}</span>
    </div>
  </div>
);

const ProgressBar = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => {
  const pct = Math.max(0, Math.min(100, ((Number(value) || 0) / max) * 100));
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
        <span style={{ color: P.textSub, fontWeight: 600 }}>{label}</span><span style={{ fontWeight: 800, color: P.text }}>{value}/{max}</span>
      </div>
      <div style={{ height: 7, borderRadius: 9, background: P.surface, overflow: "hidden" }}><div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 9, transition: "width 0.4s" }} /></div>
    </div>
  );
};

const ActionBtn = ({ onClick, title, danger, children }: { onClick: () => void; title: string; danger?: boolean; children: React.ReactNode }) => (
  <button className="pv-btn" onClick={(e) => { e.stopPropagation(); onClick(); }} title={title} aria-label={title}
    style={{ padding: 7, borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", display: "flex" }}
    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = danger ? "#FEF0ED" : P.pale; }}
    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>{children}</button>
);

const NatureBadge = ({ nature, size = "sm" }: { nature: string; size?: "sm" | "md" }) => {
  const n = getNatureOpts(nature); const Icon = n.icon;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: size === "sm" ? "2px 8px" : "3px 10px", borderRadius: 9999, background: n.bg, border: `1px solid ${n.color}44`, fontSize: size === "sm" ? 10 : 11, fontWeight: 700, color: n.color, whiteSpace: "nowrap" }}>
      <Icon size={size === "sm" ? 10 : 12} /> {size === "sm" ? n.shortLabel : n.label}
    </span>
  );
};

const OperatorBadges = ({ p, size = 18 }: { p: { moov?: boolean; orange?: boolean; mtn?: boolean; wave?: boolean }; size?: number }) => {
  const ops = getActiveOperators(p);
  if (!ops.length) return <span style={{ color: P.muted, fontSize: 11 }}>—</span>;
  return <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{ops.map((op) => <span key={op.key} title={op.label} style={{ display: "flex" }}><op.Logo size={size} active /></span>)}</div>;
};

const Pager = ({ page, perPage, count, onPage, onPerPage }: { page: number; perPage: number; count: number; onPage: (p: number) => void; onPerPage: (n: number) => void }) => {
  if (!count) return null;
  const total = Math.max(1, Math.ceil(count / perPage));
  const pb = (disabled: boolean, active = false): React.CSSProperties => ({ padding: "5px 10px", minWidth: 30, borderRadius: 8, fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: disabled ? "not-allowed" : "pointer", border: `1px solid ${active ? P.blue : P.warm}`, background: active ? P.blue : "#fff", color: active ? "#fff" : disabled ? P.warm : P.textSub, display: "inline-flex", alignItems: "center", justifyContent: "center" });
  return (
    <div style={{ padding: "11px 16px", borderTop: `1px solid ${P.warmL}`, background: P.surface, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: P.muted, fontWeight: 600 }}>
        <select value={perPage} onChange={(e) => onPerPage(Number(e.target.value))} aria-label="Lignes par page" style={{ ...inp, width: "auto", height: 30, padding: "2px 8px", fontSize: 12 }}>{[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}</select>
        <span>{(page - 1) * perPage + 1}–{Math.min(page * perPage, count)} sur {count}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <button aria-label="Page précédente" onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1} style={pb(page === 1)}><ChevronLeft size={14} /></button>
        {paginationRange(page, total).map((n, i) => n === "…" ? <span key={i} style={{ padding: "0 6px", color: P.muted, fontSize: 12 }}>…</span> : <button key={n} onClick={() => onPage(n as number)} style={pb(false, n === page)}>{n}</button>)}
        <button aria-label="Page suivante" onClick={() => onPage(Math.min(total, page + 1))} disabled={page === total} style={pb(page === total)}><ChevronRight size={14} /></button>
      </div>
    </div>
  );
};

const DateRangeFilter = ({ label, icon: Icon, fromValue, toValue, onFromChange, onToChange }: { label: string; icon: any; fromValue: string; toValue: string; onFromChange: (v: string) => void; onToChange: (v: string) => void }) => {
  const has = !!(fromValue || toValue);
  return (
    <div style={{ padding: "10px 12px", background: has ? P.pale : "#fff", border: `1.5px solid ${has ? P.blue : P.warm}`, borderRadius: 12, minWidth: 230 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <Icon size={12} style={{ color: has ? P.blue : P.muted }} /><span style={{ fontSize: 11, fontWeight: 700, color: has ? P.blueD : P.mutedD }}>{label}</span>
        {has && <button onClick={() => { onFromChange(""); onToChange(""); }} aria-label="Effacer" style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", display: "flex", color: P.red }}><X size={12} /></button>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <input type="date" aria-label={`${label} — début`} value={fromValue} onChange={(e) => onFromChange(e.target.value)} style={{ ...inp, height: 32, fontSize: 11, padding: "4px 8px" }} />
        <input type="date" aria-label={`${label} — fin`} value={toValue} min={fromValue || undefined} onChange={(e) => onToChange(e.target.value)} style={{ ...inp, height: 32, fontSize: 11, padding: "4px 8px" }} />
      </div>
    </div>
  );
};

/* ─── Visionneuse d'images ──────────────────────────────── */
const Lightbox = ({ images, index, onClose, onIndex }: { images: { src: string; label?: string; color?: string }[]; index: number; onClose: () => void; onIndex: (i: number) => void }) => {
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
      if (e.key === "ArrowLeft") onIndex(Math.max(0, index - 1));
      if (e.key === "ArrowRight") onIndex(Math.min(images.length - 1, index + 1));
    };
    window.addEventListener("keydown", k, true);
    return () => window.removeEventListener("keydown", k, true);
  }, [index, images.length, onClose, onIndex]);
  const img = images[index];
  if (!img) return null;
  const nav: React.CSSProperties = { padding: "8px 16px", background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 10, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" };
  return (
    <div role="dialog" aria-modal="true" aria-label="Photo agrandie" onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(10,21,32,0.92)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ position: "relative", maxWidth: 760, width: "100%" }} onClick={(e) => e.stopPropagation()}>
        <img src={img.src} alt={img.label || ""} style={{ width: "100%", borderRadius: 14, maxHeight: "78vh", objectFit: "contain" }} />
        {img.label && <span style={{ position: "absolute", top: 10, left: 10, padding: "4px 10px", borderRadius: 9999, background: img.color || P.blue, color: "#fff", fontSize: 11, fontWeight: 700 }}>{img.label}</span>}
        <button onClick={onClose} aria-label="Fermer" style={{ position: "absolute", top: 10, right: 10, padding: 8, background: "rgba(0,0,0,0.5)", border: "none", borderRadius: 10, cursor: "pointer", color: "#fff", display: "flex" }}><X size={16} /></button>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
          <button onClick={() => onIndex(Math.max(0, index - 1))} disabled={index === 0} style={{ ...nav, opacity: index === 0 ? 0.35 : 1 }}>← Précédent</button>
          <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 600 }}>{index + 1} / {images.length}</span>
          <button onClick={() => onIndex(Math.min(images.length - 1, index + 1))} disabled={index === images.length - 1} style={{ ...nav, opacity: index === images.length - 1 ? 0.35 : 1 }}>Suivant →</button>
        </div>
      </div>
    </div>
  );
};

const PhotoThumb = ({ photo, onOpen, onDelete }: { photo: POSPhoto; onOpen: () => void; onDelete?: () => void }) => (
  <div className="group" style={{ position: "relative", aspectRatio: "1", borderRadius: 12, overflow: "hidden", border: `1px solid ${P.warmL}`, background: P.surface }}>
    <img src={photo.thumbnail || photo.image} alt={getPhotoLabel(photo.type)} loading="lazy" onClick={onOpen} style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "zoom-in" }} />
    <span style={{ position: "absolute", top: 6, left: 6, padding: "2px 7px", borderRadius: 9999, background: getPhotoColor(photo.type), color: "#fff", fontSize: 10, fontWeight: 700 }}>{getPhotoLabel(photo.type)}</span>
    <div style={{ position: "absolute", bottom: 6, right: 6, display: "flex", gap: 4 }}>
      <button type="button" onClick={onOpen} aria-label="Agrandir" style={{ padding: 5, background: "rgba(255,255,255,0.92)", borderRadius: 7, border: "none", cursor: "pointer", display: "flex" }}><ZoomIn size={12} color={P.text} /></button>
      {onDelete && <button type="button" onClick={onDelete} aria-label="Supprimer la photo" style={{ padding: 5, background: P.red, borderRadius: 7, border: "none", cursor: "pointer", display: "flex" }}><Trash2 size={12} color="#fff" /></button>}
    </div>
  </div>
);

/* ─── Modale ────────────────────────────────────────────── */
const ModalWrapper = ({ onClose, title, subtitle, icon: Icon, children, footer, maxWidth = 900 }: { onClose: () => void; title: string; subtitle?: string; icon: any; children: React.ReactNode; footer: React.ReactNode; maxWidth?: number }) => {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(10,21,32,0.55)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
      <div className="pv-pop" style={{ background: "#fff", borderRadius: 18, width: "100%", maxWidth, maxHeight: "92vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 60px rgba(10,21,32,0.25)" }}>
        <div style={{ background: P.banner, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, background: "rgba(255,255,255,0.16)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={17} color="#fff" /></div>
            <div><h3 style={{ fontSize: 15, fontWeight: 800, color: "#fff", margin: 0 }}>{title}</h3>{subtitle && <p style={{ fontSize: 11, color: "rgba(200,230,248,0.85)", margin: "2px 0 0" }}>{subtitle}</p>}</div>
          </div>
          <button onClick={onClose} aria-label="Fermer" style={{ padding: 7, background: "rgba(255,255,255,0.16)", border: "none", borderRadius: 9, cursor: "pointer", color: "#fff", display: "flex" }}><X size={15} /></button>
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: 20, display: "flex", flexDirection: "column", gap: 18 }}>{children}</div>
        <div style={{ borderTop: `1px solid ${P.warmL}`, padding: "14px 20px", display: "flex", justifyContent: "flex-end", gap: 10, background: P.surface, flexShrink: 0 }}>{footer}</div>
      </div>
    </div>
  );
};

const FormErrors = ({ errors }: { errors: string[] }) => !errors.length ? null : (
  <div role="alert" style={{ display: "flex", gap: 10, padding: "10px 14px", background: "#FEF0ED", border: "1px solid #F5C4B3", borderRadius: 12, fontSize: 12, color: "#9A2D10" }}>
    <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
    <ul style={{ margin: 0, paddingLeft: 16, fontWeight: 600 }}>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   SÉLECTEUR GÉOGRAPHIQUE (District → Ville → Quartier)
═══════════════════════════════════════════════════════════ */
const GeoDropdown = ({ label, value, open, onToggle, loading, items, onSelect, disabled, placeholder }: {
  label: string; value: string; open: boolean; onToggle: () => void; loading: boolean;
  items: { id: number; nom: string; sub?: string }[]; onSelect: (item: any) => void; disabled?: boolean; placeholder: string;
}) => (
  <div style={{ position: "relative" }}>
    <label style={lbl}>{label}</label>
    <button type="button" onClick={() => !disabled && onToggle()} aria-expanded={open}
      style={{ ...inp, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: disabled ? "not-allowed" : "pointer", textAlign: "left", background: disabled ? P.surface : "#fff", opacity: disabled ? 0.65 : 1, borderColor: open ? P.blue : P.warm, color: value ? P.text : P.muted }}>
      <span style={{ fontWeight: value ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value || placeholder}</span>
      {loading ? <Loader2 size={13} className="pv-spin" style={{ color: P.muted }} /> : <ChevronDown size={13} style={{ color: P.muted, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />}
    </button>
    {open && (
      <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 60, background: "#fff", border: `1px solid ${P.warm}`, borderRadius: 12, boxShadow: "0 14px 34px rgba(10,21,32,0.18)", maxHeight: 220, overflowY: "auto" }}>
        {items.length === 0
          ? <div style={{ padding: "12px 14px", fontSize: 12, color: P.muted, fontWeight: 600 }}>{loading ? "Chargement…" : "Aucun résultat"}</div>
          : items.map((item) => (
            <button key={item.id} type="button" className="pv-row" onClick={() => onSelect(item)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", background: item.nom === value ? P.pale : "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: P.text }}>{item.nom}</span>
              {item.sub && <span style={{ fontSize: 10, color: P.muted }}>{item.sub}</span>}
            </button>
          ))}
      </div>
    )}
  </div>
);

const GeoSelector = ({ districtNom, villeNom, quartierNom, onDistrictChange, onVilleChange, onQuartierChange }: {
  districtNom: string; villeNom: string; quartierNom: string;
  onDistrictChange: (nom: string) => void; onVilleChange: (nom: string) => void; onQuartierChange: (nom: string) => void;
}) => {
  const [districts, setDistricts] = useState<District[]>([]);
  const [villes, setVilles] = useState<Ville[]>([]);
  const [quartiers, setQuartiers] = useState<Quartier[]>([]);
  const [loading, setLoading] = useState({ d: false, v: false, q: false });
  const [open, setOpen] = useState<null | "d" | "v" | "q">(null);

  useEffect(() => {
    let off = false;
    (async () => {
      setLoading((l) => ({ ...l, d: true }));
      try { const r = await apiService.getDistricts(); const j = await r.json(); if (!off) setDistricts(extractList<District>(j)); } catch { /* ignore */ }
      finally { if (!off) setLoading((l) => ({ ...l, d: false })); }
    })();
    return () => { off = true; };
  }, []);

  // En modification, on recharge les villes / quartiers correspondant aux valeurs déjà enregistrées.
  useEffect(() => {
    if (!districts.length || !districtNom) { setVilles([]); return; }
    const d = districts.find((x) => x.nom === districtNom);
    if (!d) return;
    let off = false;
    (async () => {
      setLoading((l) => ({ ...l, v: true }));
      try { const r = await apiService.getVilles(d.id); const j = await r.json(); if (!off) setVilles(extractList<Ville>(j)); } catch { /* ignore */ }
      finally { if (!off) setLoading((l) => ({ ...l, v: false })); }
    })();
    return () => { off = true; };
  }, [districts, districtNom]);

  useEffect(() => {
    if (!villes.length || !villeNom) { setQuartiers([]); return; }
    const v = villes.find((x) => x.nom === villeNom);
    if (!v) return;
    let off = false;
    (async () => {
      setLoading((l) => ({ ...l, q: true }));
      try { const r = await apiService.getQuartiers(v.id); const j = await r.json(); if (!off) setQuartiers(extractList<Quartier>(j)); } catch { /* ignore */ }
      finally { if (!off) setLoading((l) => ({ ...l, q: false })); }
    })();
    return () => { off = true; };
  }, [villes, villeNom]);

  const toggle = (k: "d" | "v" | "q") => setOpen((o) => (o === k ? null : k));
  return (
    <div className="pv-geo-grid">
      {open && <div style={{ position: "fixed", inset: 0, zIndex: 55 }} onClick={() => setOpen(null)} />}
      <GeoDropdown label="District / Région *" value={districtNom} open={open === "d"} onToggle={() => toggle("d")} loading={loading.d}
        items={districts.map((d) => ({ id: d.id, nom: d.nom, sub: `${d.villes_count} ville(s)` }))} placeholder="Choisir un district"
        onSelect={(d: District) => { setOpen(null); if (d.nom === districtNom) return; onDistrictChange(d.nom); onVilleChange(""); onQuartierChange(""); setVilles([]); setQuartiers([]); }} />
      <GeoDropdown label="Ville / Commune *" value={villeNom} open={open === "v"} onToggle={() => toggle("v")} loading={loading.v} disabled={!districtNom}
        items={villes.map((v) => ({ id: v.id, nom: v.nom, sub: `${v.quartiers_count} quartier(s)` }))} placeholder="Choisir une ville"
        onSelect={(v: Ville) => { setOpen(null); if (v.nom === villeNom) return; onVilleChange(v.nom); onQuartierChange(""); setQuartiers([]); }} />
      <GeoDropdown label="Quartier" value={quartierNom} open={open === "q"} onToggle={() => toggle("q")} loading={loading.q} disabled={!villeNom}
        items={quartiers.map((q) => ({ id: q.id, nom: q.nom }))} placeholder="Choisir un quartier"
        onSelect={(q: Quartier) => { setOpen(null); onQuartierChange(q.nom); }} />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   OPÉRATEURS MOBILES (formulaire)
═══════════════════════════════════════════════════════════ */
const OperatorTogglesField = ({ data, onChange }: { data: { moov?: boolean; orange?: boolean; mtn?: boolean; wave?: boolean }; onChange: (u: Partial<Draft>) => void }) => {
  const pct = calcDigitalisation(data);
  return (
    <div style={{ border: `1px solid ${P.warmL}`, borderRadius: 14, padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <SectionTitle icon={Smartphone} label="Paiements mobiles acceptés" />
        <Pill bg={pct === 100 ? "#DCF5EC" : pct > 0 ? P.pale : P.surface} fg={pct === 100 ? "#044D38" : pct > 0 ? P.blueD : P.muted}><Wifi size={10} /> {pct}/100</Pill>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: 8 }}>
        {MOBILE_OPERATORS.map((op) => {
          const active = !!data[op.key];
          return (
            <button key={op.key} type="button" aria-pressed={active} onClick={() => onChange({ [op.key]: !active })}
              style={{ position: "relative", padding: "12px 6px", borderRadius: 12, border: `2px solid ${active ? op.color : P.warmL}`, background: active ? op.bg : "#fff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, fontFamily: "inherit" }}>
              {active && <span style={{ position: "absolute", top: 5, right: 5, width: 15, height: 15, borderRadius: "50%", background: op.color, display: "flex", alignItems: "center", justifyContent: "center" }}><CheckCircle2 size={10} color="#fff" /></span>}
              <op.Logo size={36} active={active} />
              <span style={{ fontSize: 10, fontWeight: 700, color: active ? op.color : P.muted, textAlign: "center" }}>{op.label}</span>
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={{ height: 6, borderRadius: 9, background: P.surface, overflow: "hidden" }}><div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? P.green : P.blue, transition: "width 0.3s" }} /></div>
        <p style={{ fontSize: 11, color: P.muted, margin: "5px 0 0", fontWeight: 600 }}>{pct === 0 ? "Aucun opérateur sélectionné" : `${pct / 25} opérateur(s) · 25 points chacun`}</p>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   PHOTOS
═══════════════════════════════════════════════════════════ */
const PhotoUploadSection = ({ photos, onChange, existingPhotos = [], onDeleteExisting, isUploading = false }: {
  photos: PhotoUploadItem[]; onChange: (p: PhotoUploadItem[]) => void; existingPhotos?: POSPhoto[]; onDeleteExisting?: (id: number) => void; isUploading?: boolean;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [lb, setLb] = useState<number | null>(null);
  const allCount = existingPhotos.length + photos.length;
  const covered = new Set([...existingPhotos.map((p) => p.type), ...photos.map((p) => p.type)]);
  const missing = REQUIRED_PHOTO_TYPES.filter((t) => !covered.has(t));
  const gallery = [
    ...existingPhotos.map((p) => ({ src: p.image, label: getPhotoLabel(p.type), color: getPhotoColor(p.type) })),
    ...photos.map((p) => ({ src: p.preview, label: getPhotoLabel(p.type), color: getPhotoColor(p.type) })),
  ];

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const used = [...existingPhotos.map((p) => p.type), ...photos.map((p) => p.type)];
    const items: PhotoUploadItem[] = Array.from(files).filter((f) => f.type.startsWith("image/")).map((file, i) => {
      const next = PHOTO_TYPES.find((t) => !used.includes(t.value) && REQUIRED_PHOTO_TYPES.includes(t.value));
      if (next) used.push(next.value);
      return { id: `new-${Date.now()}-${i}`, file, preview: URL.createObjectURL(file), type: next?.value || "autre", caption: "" };
    });
    onChange([...photos, ...items]);
  };
  const update = (id: string, u: Partial<PhotoUploadItem>) => onChange(photos.map((p) => (p.id === id ? { ...p, ...u } : p)));
  const remove = (id: string) => { const p = photos.find((x) => x.id === id); if (p) URL.revokeObjectURL(p.preview); onChange(photos.filter((x) => x.id !== id)); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <SectionTitle icon={Camera} label="Photos du point de vente" />
          <Pill bg={allCount >= MIN_PHOTOS ? "#DCF5EC" : P.pale} fg={allCount >= MIN_PHOTOS ? "#044D38" : P.blueD}>{allCount}/{MIN_PHOTOS} min</Pill>
        </div>
        <button type="button" className="pv-btn" onClick={() => inputRef.current?.click()} disabled={isUploading} style={{ ...btnSecondary, padding: "7px 12px", opacity: isUploading ? 0.5 : 1 }}><Plus size={12} /> Ajouter des photos</button>
        <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
      </div>

      {missing.length > 0 && (
        <div style={{ display: "flex", gap: 8, padding: "10px 12px", borderRadius: 10, background: "#FBF3E0", borderLeft: `3px solid ${P.orange}` }}>
          <AlertCircle size={14} style={{ color: P.orange, flexShrink: 0, marginTop: 1 }} />
          <div><p style={{ fontSize: 12, fontWeight: 700, color: "#6B4500", margin: 0 }}>Types de photos manquants</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 5 }}>{missing.map((t) => <Pill key={t} bg="#fff" fg="#7A4F00">{getPhotoLabel(t)}</Pill>)}</div></div>
        </div>
      )}

      {allCount === 0 && (
        <div onClick={() => inputRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          style={{ border: `2px dashed ${P.warm}`, borderRadius: 14, padding: 30, textAlign: "center", cursor: "pointer", background: P.pale }}>
          <Camera size={26} style={{ color: P.blue, margin: "0 auto 8px", display: "block" }} />
          <p style={{ fontWeight: 700, color: P.text, fontSize: 13, margin: "0 0 3px" }}>Déposez vos photos ici</p>
          <p style={{ fontSize: 11, color: P.muted, margin: 0 }}>4 minimum : façade, intérieur, axe principal, environnement</p>
        </div>
      )}

      {existingPhotos.length > 0 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: P.muted, margin: "0 0 8px" }}>Photos enregistrées ({existingPhotos.length})</p>
          <div className="pv-photo-grid">{existingPhotos.map((p, i) => <PhotoThumb key={p.id} photo={p} onOpen={() => setLb(i)} onDelete={onDeleteExisting ? () => onDeleteExisting(p.id) : undefined} />)}</div>
        </div>
      )}

      {photos.length > 0 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: P.muted, margin: "0 0 8px" }}>Nouvelles photos à envoyer ({photos.length})</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {photos.map((photo, idx) => (
              <div key={photo.id} style={{ display: "flex", gap: 12, padding: 10, borderRadius: 12, border: `1px solid ${P.warmL}` }}>
                <img src={photo.preview} alt="" onClick={() => setLb(existingPhotos.length + idx)} style={{ width: 76, height: 76, borderRadius: 10, objectFit: "cover", cursor: "zoom-in", flexShrink: 0, border: `1px solid ${P.warmL}` }} />
                <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, alignContent: "start" }}>
                  <div><label style={{ ...lbl, marginBottom: 3 }}>Type *</label>
                    <select value={photo.type} onChange={(e) => update(photo.id, { type: e.target.value })} style={{ ...inp, height: 34, fontSize: 12 }}>{PHOTO_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
                  <div><label style={{ ...lbl, marginBottom: 3 }}>Légende</label>
                    <input type="text" value={photo.caption} placeholder="Description…" onChange={(e) => update(photo.id, { caption: e.target.value })} style={{ ...inp, height: 34, fontSize: 12 }} /></div>
                  <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Pill bg={`${getPhotoColor(photo.type)}1F`} fg={getPhotoColor(photo.type)}>{getPhotoLabel(photo.type)}</Pill>
                    <ActionBtn danger onClick={() => remove(photo.id)} title="Retirer cette photo"><Trash2 size={13} color={P.red} /></ActionBtn>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {allCount > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 6 }}>
          {REQUIRED_PHOTO_TYPES.map((t) => {
            const ok = covered.has(t);
            return <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 9px", borderRadius: 9, fontSize: 11, fontWeight: 700, background: ok ? "#DCF5EC" : P.surface, color: ok ? "#044D38" : P.muted }}>
              {ok ? <CheckCircle2 size={12} /> : <span style={{ width: 12, height: 12, borderRadius: "50%", border: `2px solid ${P.warm}` }} />}{getPhotoLabel(t)}</div>;
          })}
        </div>
      )}
      {lb !== null && <Lightbox images={gallery} index={lb} onClose={() => setLb(null)} onIndex={setLb} />}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   FORMULAIRE DISTRIBUTEUR (création / modification)
═══════════════════════════════════════════════════════════ */
const AvatarUpload = ({ src, onPick }: { src?: string | null; onPick: (f: File) => void }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
    <div style={{ width: 84, height: 84, borderRadius: 16, overflow: "hidden", border: `2px dashed ${P.warm}`, background: P.pale, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {src ? <img src={src} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <ImageIcon size={26} style={{ color: P.gray }} />}
    </div>
    <label className="pv-btn" style={{ ...btnSecondary, cursor: "pointer" }}><Upload size={14} /> {src ? "Changer la photo" : "Ajouter une photo"}
      <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = ""; }} /></label>
    <span style={{ fontSize: 11, color: P.muted }}>JPG ou PNG, 2 Mo maximum</span>
  </div>
);

const BrandingUpload = ({ src, onPick }: { src?: string | null; onPick: (f: File) => void }) => (
  <label style={{ display: "block", border: `2px dashed ${P.warm}`, borderRadius: 12, padding: 10, background: P.pale, cursor: "pointer", textAlign: "center" }}>
    {src ? <><img src={src} alt="Branding" style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 10, display: "block", margin: "0 auto 4px" }} /><span style={{ fontSize: 11, color: P.blueD, fontWeight: 700 }}>Modifier l'image</span></>
      : <div style={{ padding: 10 }}><Upload size={18} style={{ color: P.muted, margin: "0 auto 4px", display: "block" }} /><span style={{ fontSize: 12, color: P.textSub, fontWeight: 600 }}>Ajouter une image de marque</span></div>}
    <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = ""; }} />
  </label>
);

const PointForm = ({ data, onChange, isEdit, onPickAvatar, onPickBranding, isFetchingLocation, locationError, onLocate }: {
  data: Draft; onChange: (u: Partial<Draft>) => void; isEdit: boolean; onPickAvatar: (f: File) => void; onPickBranding: (f: File) => void;
  isFetchingLocation?: boolean; locationError?: string | null; onLocate?: () => void;
}) => {
  const digit = calcDigitalisation(data);
  return (
    <>
      <AvatarUpload src={data.avatar} onPick={onPickAvatar} />
      <div className="pv-form-grid">
        {/* Colonne gauche */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <SectionTitle icon={User} label="Informations de base" />
          <div>
            <label style={lbl}>Nature du point *</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {NATURE_OPTIONS.map((n) => {
                const active = data.nature === n.value; const Icon = n.icon;
                return (
                  <button key={n.value} type="button" aria-pressed={active} onClick={() => onChange({ nature: n.value })}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: "10px 6px", borderRadius: 12, border: `2px solid ${active ? n.color : P.warmL}`, background: active ? n.bg : "#fff", cursor: "pointer", fontFamily: "inherit" }}>
                    <Icon size={17} color={active ? n.color : P.gray} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: active ? n.color : P.muted, textAlign: "center", lineHeight: 1.2 }}>{n.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <FormInput label="Nom du distributeur *" value={data.name} onChange={(v) => onChange({ name: v })} placeholder="Ex : Supermarché Central" />
          <FormInput label="Propriétaire *" value={data.owner} onChange={(v) => onChange({ owner: v })} placeholder="Ex : Jean Kouadio" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <FormInput label="Téléphone *" type="tel" value={data.phone} onChange={(v) => onChange({ phone: v })} placeholder="+225 …" />
            <FormInput label="Email *" type="email" value={data.email} onChange={(v) => onChange({ email: v })} placeholder="email@exemple.com" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <FormSelect label="Type *" value={data.type || "boutique"} onChange={(v) => onChange({ type: v })} options={pointTypes} />
            {isEdit
              ? <FormSelect label="Statut *" value={data.status || "en_attente"} onChange={(v) => onChange({ status: v })} options={statusOptions} />
              : <FormInput label="Date d'inscription *" type="date" value={data.registration_date} onChange={(v) => onChange({ registration_date: v })} />}
          </div>
          {isEdit && <FormInput label="Date d'inscription *" type="date" value={data.registration_date} onChange={(v) => onChange({ registration_date: v })} />}

          {isEdit && (
            <div style={{ padding: "10px 14px", background: P.pale, borderRadius: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <Gauge size={14} style={{ color: P.blue }} />
              <div><p style={{ fontSize: 11, fontWeight: 700, color: P.muted, margin: 0 }}>Potentiel commercial (calculé)</p>
                <p style={{ fontSize: 13, fontWeight: 800, color: P.text, margin: "2px 0 0" }}>{potentielLabels[data.potentiel || ""] || "—"}</p></div>
              <Pill bg="#fff" fg={P.blueD} style={{ marginLeft: "auto" }}>Auto</Pill>
            </div>
          )}

          <div style={{ border: `1px solid ${P.warmL}`, borderRadius: 14, padding: 14 }}>
            <SectionTitle icon={Activity} label="Indicateurs terrain (0 à 100)" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
              <ScoreInput label="Visibilité" value={data.visibilite || 0} onChange={(v) => onChange({ visibilite: v })} />
              <ScoreInput label="Accessibilité" value={data.accessibilite || 0} onChange={(v) => onChange({ accessibilite: v })} />
              <ScoreInput label="Affluence" value={data.affluence || 0} onChange={(v) => onChange({ affluence: v })} />
              <div>
                <label style={{ ...lbl, marginBottom: 4 }}>Digitalisation (auto)</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, height: 6, borderRadius: 9, background: P.surface, overflow: "hidden" }}><div style={{ height: "100%", width: `${digit}%`, background: P.blue }} /></div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: P.text, minWidth: 28, textAlign: "right" }}>{digit}</span>
                </div>
                <p style={{ fontSize: 10, color: P.muted, margin: "3px 0 0" }}>Calculée depuis les opérateurs</p>
              </div>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, cursor: "pointer" }}>
              <input type="checkbox" checked={!!data.grande_voie} onChange={(e) => onChange({ grande_voie: e.target.checked })} style={{ accentColor: P.blue, width: 15, height: 15 }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: P.text }}>Point de vente sur grande voie</span>
            </label>
          </div>

          <OperatorTogglesField data={data} onChange={onChange} />

          <div style={{ border: `1px solid ${P.warmL}`, borderRadius: 14, padding: 14 }}>
            <SectionTitle icon={Target} label="Données terrain" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
              <FormSelect label="Concurrents à 300 m" value={data.nb_concurrents || "aucun"} onChange={(v) => onChange({ nb_concurrents: v })} options={nbConcurrentsOptions} />
              <FormSelect label="Classe socio-éco du quartier" value={data.classe_quartier || "populaire"} onChange={(v) => onChange({ classe_quartier: v })} options={classeQuartierOptions} />
              <FormInput label="Ancienneté (années)" type="number" min={0} value={data.anciennete_annees ?? 0} onChange={(v) => onChange({ anciennete_annees: parseInt(v) || 0 })} />
              <FormInput label="Façade visible (m)" type="number" min={0} step="0.1" value={data.facade_metres ?? 0} onChange={(v) => onChange({ facade_metres: parseFloat(v) || 0 })} />
            </div>
          </div>
        </div>

        {/* Colonne droite */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <SectionTitle icon={MapPin} label="Localisation" />
          <GeoSelector districtNom={data.district || ""} villeNom={data.commune || ""} quartierNom={data.quartier || ""}
            onDistrictChange={(nom) => onChange({ district: nom, region: nom })} onVilleChange={(nom) => onChange({ commune: nom })} onQuartierChange={(nom) => onChange({ quartier: nom })} />
          <div>
            <label style={lbl}>Adresse complète *</label>
            <textarea value={data.address || ""} onChange={(e) => onChange({ address: e.target.value })} rows={2} placeholder="Adresse avec quartier, commune, ville…" style={{ ...inp, height: "auto", padding: "8px 12px", resize: "vertical" }} />
          </div>

          <div style={{ border: `1px solid ${P.warmL}`, borderRadius: 14, padding: 14 }}>
            <SectionTitle icon={Award} label="Branding" />
            <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: P.pale, borderRadius: 10, cursor: "pointer", margin: "12px 0" }}>
              <input type="checkbox" checked={!!data.brander} onChange={(e) => onChange({ brander: e.target.checked, marque_brander: e.target.checked ? data.marque_brander : "", branding_image: e.target.checked ? data.branding_image : null })} style={{ accentColor: P.blue, width: 15, height: 15 }} />
              <div><span style={{ fontWeight: 700, color: P.text, fontSize: 13 }}>Distributeur brandé</span><p style={{ fontSize: 11, color: P.muted, margin: 0 }}>Représente une marque spécifique</p></div>
            </label>
            {data.brander && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <FormInput label="Marque *" value={data.marque_brander} onChange={(v) => onChange({ marque_brander: v })} placeholder="Ex : Coca-Cola, Nestlé…" />
                <BrandingUpload src={data.branding_image} onPick={onPickBranding} />
              </div>
            )}
          </div>

          <div style={{ border: `1px solid ${P.warmL}`, borderRadius: 14, padding: 14 }}>
            <SectionTitle icon={Target} label="Coordonnées GPS" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "12px 0" }}>
              <FormInput label="Latitude" type="number" step="any" value={data.latitude as any} onChange={(v) => onChange({ latitude: v === "" ? "" : parseFloat(v) })} placeholder="5.3197" />
              <FormInput label="Longitude" type="number" step="any" value={data.longitude as any} onChange={(v) => onChange({ longitude: v === "" ? "" : parseFloat(v) })} placeholder="-4.0267" />
            </div>
            {onLocate && (
              <button type="button" className="pv-btn" onClick={onLocate} disabled={isFetchingLocation} style={{ ...btnSecondary, width: "100%", justifyContent: "center", opacity: isFetchingLocation ? 0.6 : 1 }}>
                {isFetchingLocation ? <><Loader2 size={13} className="pv-spin" /> Localisation…</> : <><Navigation size={13} /> Utiliser ma position actuelle</>}
              </button>
            )}
            {locationError && <p style={{ fontSize: 11, color: P.red, margin: "6px 0 0", display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}><AlertCircle size={11} /> {locationError}</p>}
          </div>

          <div style={{ border: `1px solid ${P.warmL}`, borderRadius: 14, padding: 14 }}>
            <SectionTitle icon={Users} label="Collecte terrain" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
              <FormInput label="Nom de l'agent" value={data.agent_name} onChange={(v) => onChange({ agent_name: v })} placeholder="Nom de l'agent" />
              <FormInput label="Date de collecte" type="date" value={data.date_collecte} onChange={(v) => onChange({ date_collecte: v })} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════
   FICHE DÉTAIL
═══════════════════════════════════════════════════════════ */
const PointDetail = ({ p, onBack, onEdit, onDelete, onManagePhotos, onDeletePhoto }: {
  p: PointOfSale; onBack: () => void; onEdit: () => void; onDelete: () => void; onManagePhotos: () => void; onDeletePhoto: (photoId: number) => void;
}) => {
  const badge = badgeFromScore(p.score_global);
  const photos = p.photos || [];
  const photosOk = photos.length >= MIN_PHOTOS;
  const covered = new Set(photos.map((x) => x.type));
  const activeOps = getActiveOperators(p);
  const digit = calcDigitalisation(p);
  const [lb, setLb] = useState<number | null>(null);
  const lat = Number(p.latitude), lng = Number(p.longitude);

  const infoRows = [
    { icon: User, label: "Propriétaire", value: p.owner, color: P.blue }, { icon: Phone, label: "Téléphone", value: p.phone, color: P.green },
    { icon: Mail, label: "Email", value: p.email, color: P.purple }, { icon: Building2, label: "Type", value: getTypeLabel(p.type), color: P.orange },
    { icon: Layers, label: "Nature", value: getNatureLabel(p.nature), color: P.indigo }, { icon: Gauge, label: "Potentiel", value: potentielLabels[p.potentiel] || p.potentiel_label, color: P.pink },
    { icon: Calendar, label: "Date d'inscription", value: p.registration_date, color: P.teal }, { icon: Clock, label: "Date de création", value: p.created_at ? p.created_at.split("T")[0] : "—", color: P.cyan },
    { icon: Users, label: "Agent collecteur", value: p.agent_name || p.agent || "—", color: P.red },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* En-tête */}
      <div style={{ background: P.banner, borderRadius: 16, padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button className="pv-btn" onClick={onBack} aria-label="Retour à la liste" style={{ padding: 8, borderRadius: 10, border: "none", background: "rgba(255,255,255,0.16)", cursor: "pointer", color: "#fff", display: "flex" }}><ChevronLeft size={16} /></button>
          <div style={{ width: 68, height: 68, borderRadius: 16, overflow: "hidden", background: "#fff", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {p.avatar ? <img src={p.avatar} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Store size={24} color={P.blueD} />}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
              <Pill bg={badge.bg} fg={badge.fg}>{badge.label}</Pill><NatureBadge nature={p.nature} size="md" />
              {activeOps.map((op) => <span key={op.key} title={op.label} style={{ display: "flex" }}><op.Logo size={22} active /></span>)}
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0 }}>{p.name}</h2>
            <p style={{ fontSize: 12, color: "rgba(200,230,248,0.9)", margin: "4px 0 0", display: "flex", alignItems: "center", gap: 4 }}><MapPin size={11} /> {p.commune}{p.quartier ? ` · ${p.quartier}` : ""} · {getTypeLabel(p.type)}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="pv-btn" onClick={onEdit} style={{ ...btnPrimary, background: "rgba(255,255,255,0.16)" }}><Edit size={13} /> Modifier</button>
          <button className="pv-btn" onClick={onDelete} style={{ ...btnPrimary, background: P.red }}><Trash2 size={13} /> Supprimer</button>
        </div>
      </div>

      <div className="pv-detail-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <div style={{ ...card, padding: 16 }}>
            <CardTitle icon={Building2} label="Informations générales" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
              {infoRows.map(({ icon: Icon, label, value, color }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", background: P.pale, borderRadius: 10 }}>
                  <Icon size={14} style={{ color, flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}><p style={{ fontSize: 10, color: P.muted, fontWeight: 700, margin: 0 }}>{label}</p><p style={{ fontWeight: 700, color: P.text, fontSize: 12, margin: "1px 0 0", overflow: "hidden", textOverflow: "ellipsis" }}>{value || "—"}</p></div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...card, padding: 16 }}>
            <CardTitle icon={Smartphone} label="Digitalisation et paiements mobiles" right={<Pill bg={digit === 100 ? "#DCF5EC" : P.pale} fg={digit === 100 ? "#044D38" : P.blueD}>{digit}/100</Pill>} />
            <div style={{ height: 7, borderRadius: 9, background: P.surface, overflow: "hidden", marginBottom: 12 }}><div style={{ height: "100%", width: `${digit}%`, background: digit === 100 ? P.green : P.blue }} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 10 }}>
              {MOBILE_OPERATORS.map((op) => {
                const active = !!p[op.key];
                return (
                  <div key={op.key} style={{ padding: "12px 8px", borderRadius: 12, textAlign: "center", background: active ? op.bg : P.surface, border: `2px solid ${active ? op.color : P.warmL}`, opacity: active ? 1 : 0.55 }}>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}><op.Logo size={36} active={active} /></div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: active ? op.color : P.muted, margin: 0 }}>{op.label}</p>
                    <p style={{ fontSize: 10, color: active ? op.color : P.muted, margin: "2px 0 0", fontWeight: 600 }}>{active ? "Actif · +25" : "Inactif"}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ ...card, padding: 16 }}>
            <CardTitle icon={Target} label="Données terrain" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
              {[
                { label: "Concurrents à 300 m", value: nbConcurrentsOptions.find((o) => o.value === p.nb_concurrents)?.label || "—", color: P.red },
                { label: "Classe du quartier", value: classeQuartierOptions.find((o) => o.value === p.classe_quartier)?.label || "—", color: P.purple },
                { label: "Ancienneté", value: `${p.anciennete_annees} an(s)`, color: P.teal }, { label: "Façade visible", value: `${p.facade_metres} m`, color: P.orange },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ padding: 12, background: P.pale, borderRadius: 12, textAlign: "center" }}>
                  <p style={{ fontSize: 10, color: P.muted, fontWeight: 700, margin: "0 0 4px" }}>{label}</p><p style={{ fontWeight: 800, color, fontSize: 15, margin: 0 }}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...card, padding: 16 }}>
            <CardTitle icon={Camera} label={`Photos (${photos.length}/${MIN_PHOTOS} min)`} right={<button className="pv-btn" onClick={onManagePhotos} style={{ ...btnSecondary, padding: "6px 11px" }}><Plus size={12} /> Gérer les photos</button>} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 6, marginBottom: 12 }}>
              {REQUIRED_PHOTO_TYPES.map((t) => { const ok = covered.has(t); return (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 9px", borderRadius: 9, fontSize: 11, fontWeight: 700, background: ok ? "#DCF5EC" : P.surface, color: ok ? "#044D38" : P.muted }}>
                  {ok ? <CheckCircle2 size={12} /> : <span style={{ width: 12, height: 12, borderRadius: "50%", border: `2px solid ${P.warm}` }} />}{getPhotoLabel(t)}</div>); })}
            </div>
            {photos.length === 0
              ? <div onClick={onManagePhotos} style={{ border: `2px dashed ${P.warm}`, borderRadius: 14, padding: 28, textAlign: "center", cursor: "pointer", background: P.pale }}>
                  <Camera size={24} style={{ color: P.blue, margin: "0 auto 6px", display: "block" }} /><p style={{ fontWeight: 700, color: P.text, fontSize: 13, margin: "0 0 3px" }}>Aucune photo enregistrée</p><p style={{ fontSize: 11, color: P.muted, margin: 0 }}>Ajoutez au moins {MIN_PHOTOS} photos</p></div>
              : <div className="pv-photo-grid">{photos.map((ph, i) => <PhotoThumb key={ph.id} photo={ph} onOpen={() => setLb(i)} onDelete={() => onDeletePhoto(ph.id)} />)}
                  {!photosOk && <div onClick={onManagePhotos} style={{ aspectRatio: "1", border: `2px dashed ${P.warm}`, borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", background: P.pale, color: P.blueD }}><Plus size={18} /><span style={{ fontSize: 11, fontWeight: 700, marginTop: 4 }}>+{MIN_PHOTOS - photos.length} photo(s)</span></div>}</div>}
          </div>

          <div style={{ ...card, padding: 16 }}>
            <CardTitle icon={Target} label="Analyse stratégique A · D · E" />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <ProgressBar label="A — Branding et disponibilité média" value={p.score_a} max={25} color={P.purple} />
              <ProgressBar label="D — Potentiel commercial" value={p.score_d} max={40} color={P.blue} />
              <ProgressBar label="E — Environnement stratégique" value={p.score_e} max={35} color={P.teal} />
            </div>
            <div style={{ background: P.pale, borderRadius: 12, padding: "10px 14px", marginTop: 14, fontSize: 12, color: P.textSub, lineHeight: 1.6 }}>
              <strong style={{ color: P.text }}>Diagnostic : </strong>{getNatureLabel(p.nature)} {p.brander ? "déjà brandé" : "non brandé"}, visibilité {p.visibilite}/100, accessibilité {p.accessibilite}/100, affluence {p.affluence}/100, digitalisation {digit}/100{activeOps.length > 0 && ` (${activeOps.map((o) => o.label).join(", ")})`}, façade {p.facade_metres} m, {nbConcurrentsOptions.find((o) => o.value === p.nb_concurrents)?.label || "—"} concurrent(s), quartier {classeQuartierOptions.find((o) => o.value === p.classe_quartier)?.label || "—"}. <strong style={{ color: p.eligibilite_branding ? "#047857" : P.muted }}>{p.eligibilite_branding ? "Immédiatement exploitable pour une offre branding." : "À suivre selon le ciblage commercial."}</strong>
            </div>
          </div>

          <div style={{ ...card, padding: 16 }}>
            <CardTitle icon={MapPin} label="Localisation" />
            <div style={{ height: 220, borderRadius: 12, overflow: "hidden", border: `1px solid ${P.warmL}`, marginBottom: 12 }}>
              <MapWithNoSSR points={[p]} center={[isValidCoord(lat) ? lat : 5.3599517, isValidCoord(lng) ? lng : -4.0082563]} zoom={15} onPointClick={() => {}} singleMarker showAvatars />
            </div>
            <p style={{ padding: "9px 12px", background: P.pale, borderRadius: 10, fontSize: 12, color: P.text, fontWeight: 600, margin: "0 0 10px", display: "flex", gap: 8 }}><MapPin size={14} style={{ color: P.blue, flexShrink: 0, marginTop: 1 }} /> {p.address || "Adresse non renseignée"}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8 }}>
              {[{ l: "District", v: p.district }, { l: "Commune", v: p.commune }, { l: "Quartier", v: p.quartier }].map(({ l, v }) => (
                <div key={l} style={{ padding: 9, background: P.surface, borderRadius: 10, textAlign: "center" }}><p style={{ fontSize: 10, color: P.muted, fontWeight: 700, margin: 0 }}>{l}</p><p style={{ fontWeight: 700, color: P.text, fontSize: 12, margin: "2px 0 0" }}>{v || "—"}</p></div>
              ))}
            </div>
          </div>
        </div>

        {/* Colonne latérale */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <div style={{ background: P.banner, borderRadius: 16, padding: 16 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 7 }}><BarChart3 size={14} /> Performance</h4>
            <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 12, padding: 14, textAlign: "center", marginBottom: 10 }}>
              <p style={{ fontSize: 36, fontWeight: 800, color: "#fff", margin: 0 }}>{p.score_global}</p><p style={{ fontSize: 11, color: "rgba(200,230,248,0.85)", margin: "2px 0 0", fontWeight: 600 }}>Score global /100</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 7 }}>
              {([["A", p.score_a, 25], ["D", p.score_d, 40], ["E", p.score_e, 35]] as const).map(([l, v, m]) => (
                <div key={l} style={{ background: "rgba(255,255,255,0.10)", borderRadius: 10, padding: 9, textAlign: "center" }}>
                  <p style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: 0 }}>{v}<span style={{ fontSize: 10, opacity: 0.7 }}>/{m}</span></p><p style={{ fontSize: 11, fontWeight: 700, color: P.blueL, margin: "2px 0 0" }}>{l}</p>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginTop: 8 }}>
              <div style={{ background: "rgba(255,255,255,0.10)", borderRadius: 10, padding: 9, textAlign: "center" }}><p style={{ fontSize: 13, fontWeight: 800, color: P.blueL, margin: 0 }}>{fmt(parseFloat(p.monthly_turnover || "0"))} XOF</p><p style={{ fontSize: 10, color: "rgba(200,230,248,0.8)", margin: "1px 0 0", fontWeight: 600 }}>CA mensuel</p></div>
              <div style={{ background: "rgba(255,255,255,0.10)", borderRadius: 10, padding: 9, textAlign: "center" }}><p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: 0 }}>{p.monthly_orders}</p><p style={{ fontSize: 10, color: "rgba(200,230,248,0.8)", margin: "1px 0 0", fontWeight: 600 }}>Commandes</p></div>
            </div>
          </div>

          <div style={{ ...card, padding: 16 }}>
            <CardTitle icon={CheckCircle2} label="Éligibilités" />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[["Branding", p.eligibilite_branding], ["Exclusivité", p.eligibilite_exclusivite], ["Activation promo", p.eligibilite_activation], ["GPS valide", p.gps_valid], ["Fiche complète", p.fiche_complete], ["Grande voie", p.grande_voie]].map(([label, ok]) => (
                <div key={label as string} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 10px", borderRadius: 9, background: ok ? "#F0FAF6" : P.surface }}>
                  <span style={{ fontSize: 12, color: P.textSub, fontWeight: 600 }}>{label as string}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: ok ? "#047857" : P.muted, display: "flex", alignItems: "center", gap: 3 }}>{ok ? <><CheckCircle2 size={12} /> Oui</> : "Non"}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...card, padding: 16 }}>
            <CardTitle icon={Award} label="Branding" />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 10px", borderRadius: 9, background: P.surface, marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: P.textSub, fontWeight: 600 }}>Est brandé</span><Pill bg={p.brander ? "#EADFFB" : "#fff"} fg={p.brander ? "#4B2A94" : P.muted}>{p.brander ? "Oui" : "Non"}</Pill>
            </div>
            {p.brander && p.marque_brander && <p style={{ padding: "7px 10px", background: "#EADFFB", borderRadius: 9, fontWeight: 700, color: "#4B2A94", fontSize: 12, margin: "0 0 8px" }}>{p.marque_brander}</p>}
            {p.brander && p.branding_image && <img src={p.branding_image} alt="Branding" style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 12, border: `1px solid ${P.warmL}` }} />}
          </div>

          <button className="pv-btn" onClick={onManagePhotos} style={{ ...btnSecondary, justifyContent: "center", width: "100%" }}><Camera size={13} /> Gérer les photos ({photos.length})</button>
        </div>
      </div>
      {lb !== null && <Lightbox images={photos.map((x) => ({ src: x.image, label: getPhotoLabel(x.type), color: getPhotoColor(x.type) }))} index={lb} onClose={() => setLb(null)} onIndex={setLb} />}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
═══════════════════════════════════════════════════════════ */
type SortKey = "recent" | "name" | "score" | "digital" | "registration";
type QualityFilter = "all" | "gps" | "fiche" | "photos";

const PointsVenteManagement: React.FC = () => {
  const [pointsVente, setPointsVente] = useState<PointOfSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtres (tous appliqués côté client : on charge la liste une seule fois)
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterNature, setFilterNature] = useState<"all" | NatureKey>("all");
  const [filterDistrict, setFilterDistrict] = useState("all");
  const [filterCommune, setFilterCommune] = useState("all");
  const [filterBrander, setFilterBrander] = useState("all");
  const [filterMarque, setFilterMarque] = useState("all");
  const [filterOperator, setFilterOperator] = useState<"all" | OperatorKey>("all");
  const [filterDigitMin, setFilterDigitMin] = useState(0);
  const [filterQuality, setFilterQuality] = useState<QualityFilter>("all");
  const [regFrom, setRegFrom] = useState(""); const [regTo, setRegTo] = useState("");
  const [creFrom, setCreFrom] = useState(""); const [creTo, setCreTo] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [activeView, setActiveView] = useState<"liste" | "carte" | "detail">("liste");
  const [selectedPoint, setSelectedPoint] = useState<PointOfSale | null>(null);

  // Création / modification
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPoint, setNewPoint] = useState<Draft>(emptyForm());
  const [editingPoint, setEditingPoint] = useState<PointOfSale | null>(null);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [brandingFile, setBrandingFile] = useState<File | null>(null);
  const [addPhotos, setAddPhotos] = useState<PhotoUploadItem[]>([]);
  const [editPhotos, setEditPhotos] = useState<PhotoUploadItem[]>([]);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Modale photos
  const [photosModal, setPhotosModal] = useState<PhotosModalState | null>(null);
  const [photosUploading, setPhotosUploading] = useState(false);

  /* ── Chargement ── */
  const fetchPoints = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const res = await apiService.getPointsVenteAnalytics({});
      if (!res.ok) throw new Error(await failMsg(res, "Erreur de chargement des distributeurs"));
      setPointsVente(extractList<PointOfSale>(await res.json()));
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchPoints(); }, [fetchPoints]);

  const fetchPointDetail = useCallback(async (id: number): Promise<PointOfSale | null> => {
    try {
      const res = await apiService.getPointVenteDetail(id);
      if (!res.ok) throw new Error(await failMsg(res, "Erreur de chargement du détail"));
      return (await res.json()) as PointOfSale;
    } catch (e: any) { setError(e.message); return null; }
  }, []);

  /* ── Données dérivées ── */
  const districts = useMemo(() => Array.from(new Set(pointsVente.map((p) => p.district).filter(Boolean))).sort(), [pointsVente]);
  const communes = useMemo(() => Array.from(new Set(pointsVente.filter((p) => filterDistrict === "all" || p.district === filterDistrict).map((p) => p.commune).filter(Boolean))).sort(), [pointsVente, filterDistrict]);
  const marques = useMemo(() => Array.from(new Set(pointsVente.filter((p) => p.brander && p.marque_brander).map((p) => p.marque_brander as string))).sort(), [pointsVente]);

  const natureCounts = useMemo(() => ({
    all: pointsVente.length,
    distributeur_principal: pointsVente.filter((p) => p.nature === "distributeur_principal").length,
    distributeur_secondaire: pointsVente.filter((p) => p.nature === "distributeur_secondaire").length,
    pdv: pointsVente.filter((p) => p.nature === "pdv").length,
  } as Record<string, number>), [pointsVente]);

  const filteredPoints = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const list = pointsVente.filter((p) => {
      if (q && !(`${p.name} ${p.owner} ${p.address} ${p.commune} ${p.marque_brander ?? ""} ${p.phone}`.toLowerCase().includes(q))) return false;
      if (filterStatus !== "all" && p.status !== filterStatus) return false;
      if (filterType !== "all" && p.type !== filterType) return false;
      if (filterNature !== "all" && p.nature !== filterNature) return false;
      if (filterDistrict !== "all" && p.district !== filterDistrict) return false;
      if (filterCommune !== "all" && p.commune !== filterCommune) return false;
      if (filterBrander !== "all" && (filterBrander === "brander" ? !p.brander : p.brander)) return false;
      if (filterMarque !== "all" && p.marque_brander !== filterMarque) return false;
      if (filterOperator !== "all" && !p[filterOperator]) return false;
      if (filterDigitMin > 0 && calcDigitalisation(p) < filterDigitMin) return false;
      if (filterQuality === "gps" && p.gps_valid) return false;
      if (filterQuality === "fiche" && p.fiche_complete) return false;
      if (filterQuality === "photos" && (p.photos_count || 0) >= MIN_PHOTOS) return false;
      return inDateRange(p.registration_date, regFrom, regTo) && inDateRange(p.created_at, creFrom, creTo);
    });
    const t = (s?: string | null) => (s ? new Date(s).getTime() : 0);
    return list.sort((a, b) =>
      sortKey === "name" ? a.name.localeCompare(b.name, "fr")
        : sortKey === "score" ? (b.score_global || 0) - (a.score_global || 0)
        : sortKey === "digital" ? calcDigitalisation(b) - calcDigitalisation(a)
        : sortKey === "registration" ? t(b.registration_date) - t(a.registration_date)
        : (t(b.created_at) - t(a.created_at)) || b.id - a.id);
  }, [pointsVente, searchTerm, filterStatus, filterType, filterNature, filterDistrict, filterCommune, filterBrander, filterMarque, filterOperator, filterDigitMin, filterQuality, regFrom, regTo, creFrom, creTo, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filteredPoints.length / itemsPerPage));
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages); }, [currentPage, totalPages]);
  const currentItems = filteredPoints.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const activeChips = useMemo(() => {
    const c: { key: string; label: string; clear: () => void }[] = [];
    if (filterNature !== "all") c.push({ key: "nature", label: getNatureLabel(filterNature), clear: () => setFilterNature("all") });
    if (filterStatus !== "all") c.push({ key: "status", label: `Statut : ${getStatusOpts(filterStatus).label}`, clear: () => setFilterStatus("all") });
    if (filterType !== "all") c.push({ key: "type", label: `Type : ${getTypeLabel(filterType)}`, clear: () => setFilterType("all") });
    if (filterDistrict !== "all") c.push({ key: "district", label: `District : ${filterDistrict}`, clear: () => { setFilterDistrict("all"); setFilterCommune("all"); } });
    if (filterCommune !== "all") c.push({ key: "commune", label: `Commune : ${filterCommune}`, clear: () => setFilterCommune("all") });
    if (filterBrander !== "all") c.push({ key: "brander", label: filterBrander === "brander" ? "Brandés" : "Non brandés", clear: () => setFilterBrander("all") });
    if (filterMarque !== "all") c.push({ key: "marque", label: `Marque : ${filterMarque}`, clear: () => setFilterMarque("all") });
    if (filterOperator !== "all") c.push({ key: "op", label: `${MOBILE_OPERATORS.find((o) => o.key === filterOperator)?.label} actif`, clear: () => setFilterOperator("all") });
    if (filterDigitMin > 0) c.push({ key: "digit", label: `Digitalisation ≥ ${filterDigitMin}`, clear: () => setFilterDigitMin(0) });
    if (filterQuality !== "all") c.push({ key: "quality", label: filterQuality === "gps" ? "GPS manquant" : filterQuality === "fiche" ? "Fiche incomplète" : "Photos insuffisantes", clear: () => setFilterQuality("all") });
    if (regFrom || regTo) c.push({ key: "reg", label: `Inscription ${regFrom || "…"} → ${regTo || "…"}`, clear: () => { setRegFrom(""); setRegTo(""); } });
    if (creFrom || creTo) c.push({ key: "cre", label: `Création ${creFrom || "…"} → ${creTo || "…"}`, clear: () => { setCreFrom(""); setCreTo(""); } });
    return c;
  }, [filterNature, filterStatus, filterType, filterDistrict, filterCommune, filterBrander, filterMarque, filterOperator, filterDigitMin, filterQuality, regFrom, regTo, creFrom, creTo]);

  const resetFilters = () => {
    setSearchTerm(""); setFilterStatus("all"); setFilterType("all"); setFilterNature("all"); setFilterDistrict("all"); setFilterCommune("all");
    setFilterBrander("all"); setFilterMarque("all"); setFilterOperator("all"); setFilterDigitMin(0); setFilterQuality("all");
    setRegFrom(""); setRegTo(""); setCreFrom(""); setCreTo(""); setCurrentPage(1);
  };
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterStatus, filterType, filterNature, filterDistrict, filterCommune, filterBrander, filterMarque, filterOperator, filterDigitMin, filterQuality, regFrom, regTo, creFrom, creTo, sortKey]);

  const stats = useMemo(() => {
    const n = Math.max(pointsVente.length, 1);
    return {
      total: pointsVente.length, actifs: pointsVente.filter((p) => p.status === "actif").length,
      gps: pointsVente.filter((p) => p.gps_valid).length, elig: pointsVente.filter((p) => p.eligibilite_branding).length,
      brandes: pointsVente.filter((p) => p.brander).length, score: Math.round(pointsVente.reduce((s, p) => s + (p.score_global || 0), 0) / n),
      premium: pointsVente.filter((p) => p.score_global >= 80).length,
    };
  }, [pointsVente]);

  const digitStats = useMemo(() => MOBILE_OPERATORS.map((op) => ({ ...op, count: pointsVente.filter((p) => p[op.key]).length })), [pointsVente]);

  /* ── Aperçus d'images ── */
  const readPreview = (file: File, cb: (dataUrl: string) => void) => {
    if (file.size > 2 * 1024 * 1024) { setFormErrors(["L'image dépasse 2 Mo."]); return false; }
    const r = new FileReader(); r.onload = (e) => cb(e.target?.result as string); r.readAsDataURL(file); return true;
  };
  const pickAvatar = (isEdit: boolean) => (f: File) => { if (readPreview(f, (src) => isEdit ? setEditingPoint((p) => p && { ...p, avatar: src }) : setNewPoint((p) => ({ ...p, avatar: src })))) setAvatarFile(f); };
  const pickBranding = (isEdit: boolean) => (f: File) => { if (readPreview(f, (src) => isEdit ? setEditingPoint((p) => p && { ...p, branding_image: src }) : setNewPoint((p) => ({ ...p, branding_image: src })))) setBrandingFile(f); };

  const getCurrentLocation = () => {
    setIsFetchingLocation(true); setLocationError(null);
    if (!navigator.geolocation) { setLocationError("La géolocalisation n'est pas supportée par ce navigateur."); setIsFetchingLocation(false); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setNewPoint((p) => ({ ...p, latitude: pos.coords.latitude, longitude: pos.coords.longitude })); setIsFetchingLocation(false); },
      (err) => { setLocationError("Position indisponible : " + err.message); setIsFetchingLocation(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  /* ── Photos ── */
  const uploadPhotosForPOS = async (posId: number, photos: PhotoUploadItem[]) => {
    const byType: Record<string, PhotoUploadItem[]> = {};
    photos.forEach((p) => { (byType[p.type] ||= []).push(p); });
    for (const [type, items] of Object.entries(byType)) {
      const fd = new FormData();
      items.forEach((i) => fd.append("images", i.file));
      fd.append("type", type);
      const caption = items.find((i) => i.caption)?.caption;
      if (caption) fd.append("caption", caption);
      const res = await apiService.addPhotosToPointVente(posId, fd);
      if (!res.ok) throw new Error(await failMsg(res, `Erreur d'envoi des photos (${getPhotoLabel(type)})`));
    }
  };

  const openPhotosModal = async (point: PointOfSale) => {
    setPhotosModal({ point, existing: point.photos || [], items: [], loading: true });
    const d = await fetchPointDetail(point.id);
    setPhotosModal((m) => (m && m.point.id === point.id ? { ...m, existing: d?.photos || m.existing, loading: false } : m));
  };

  const closePhotosModal = () => { photosModal?.items.forEach((i) => URL.revokeObjectURL(i.preview)); setPhotosModal(null); };

  const syncPhotos = (posId: number, photos: POSPhoto[]) => {
    setPointsVente((prev) => prev.map((p) => (p.id === posId ? { ...p, photos_count: photos.length, photos } : p)));
    setSelectedPoint((p) => (p && p.id === posId ? { ...p, photos_count: photos.length, photos } : p));
    setEditingPoint((p) => (p && p.id === posId ? { ...p, photos_count: photos.length, photos } : p));
    setPhotosModal((m) => (m && m.point.id === posId ? { ...m, existing: photos } : m));
  };

  const handleUploadPhotosModal = async () => {
    if (!photosModal || !photosModal.items.length) return;
    const { point, items } = photosModal;
    try {
      setPhotosUploading(true);
      await uploadPhotosForPOS(point.id, items);
      const d = await fetchPointDetail(point.id);
      syncPhotos(point.id, d?.photos || []);
      items.forEach((i) => URL.revokeObjectURL(i.preview));
      setPhotosModal((m) => (m ? { ...m, items: [] } : m));
    } catch (e: any) { setError(e.message); }
    finally { setPhotosUploading(false); }
  };

  const handleDeletePhoto = async (posId: number, photoId: number) => {
    if (!window.confirm("Supprimer cette photo ?")) return;
    try {
      const res = await apiService.deletePhotoFromPointVente(posId, photoId);
      if (!res.ok) throw new Error(await failMsg(res, "Erreur de suppression de la photo"));
      const base = (selectedPoint?.id === posId ? selectedPoint.photos : editingPoint?.id === posId ? editingPoint.photos : photosModal?.point.id === posId ? photosModal.existing : []) || [];
      syncPhotos(posId, base.filter((p) => p.id !== photoId));
    } catch (e: any) { setError(e.message); }
  };

  /* ── CRUD ── */
  const closeAdd = () => { addPhotos.forEach((p) => URL.revokeObjectURL(p.preview)); setShowAddModal(false); setNewPoint(emptyForm()); setAvatarFile(null); setBrandingFile(null); setAddPhotos([]); setFormErrors([]); setLocationError(null); };
  const closeEdit = () => { editPhotos.forEach((p) => URL.revokeObjectURL(p.preview)); setEditingPoint(null); setAvatarFile(null); setBrandingFile(null); setEditPhotos([]); setFormErrors([]); };

  const openEdit = async (point: PointOfSale) => {
    setFormErrors([]); setAvatarFile(null); setBrandingFile(null); setEditPhotos([]);
    setEditingPoint({ ...point });
    const d = await fetchPointDetail(point.id); // les photos existantes viennent du détail
    if (d) setEditingPoint((p) => (p && p.id === point.id ? { ...p, photos: d.photos || [] } : p));
  };

  const openDetail = async (point: PointOfSale) => {
    setSelectedPoint(point); setActiveView("detail");
    const d = await fetchPointDetail(point.id);
    if (d) setSelectedPoint((p) => (p && p.id === point.id ? d : p));
  };

  const handleAddPoint = async () => {
    const errs = validatePoint(newPoint);
    if (errs.length) { setFormErrors(errs); return; }
    try {
      setActionLoading(true); setFormErrors([]);
      const res = await apiService.createPointVenteFormData(buildPointFD(newPoint, false, avatarFile, brandingFile));
      if (!res.ok) throw new Error(await failMsg(res, "Erreur lors de la création"));
      const created: PointOfSale = await res.json();
      if (addPhotos.length > 0) await uploadPhotosForPOS(created.id, addPhotos);
      setPointsVente((prev) => [{ ...created, photos_count: addPhotos.length }, ...prev]);
      closeAdd();
    } catch (e: any) { setFormErrors([e.message]); }
    finally { setActionLoading(false); }
  };

  const handleUpdatePoint = async () => {
    if (!editingPoint) return;
    const errs = validatePoint(editingPoint as Draft);
    if (errs.length) { setFormErrors(errs); return; }
    try {
      setActionLoading(true); setFormErrors([]);
      const res = await apiService.patchPointVente(editingPoint.id, buildPointFD(editingPoint as Draft, true, avatarFile, brandingFile));
      if (!res.ok) throw new Error(await failMsg(res, "Erreur lors de la mise à jour"));
      const updated: PointOfSale = await res.json();
      if (editPhotos.length > 0) await uploadPhotosForPOS(updated.id, editPhotos);
      const nPhotos = (updated.photos_count ?? editingPoint.photos_count ?? 0) + editPhotos.length;
      setPointsVente((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated, photos_count: nPhotos } : p)));
      setSelectedPoint((p) => (p && p.id === updated.id ? { ...p, ...updated, photos: p.photos, photos_count: nPhotos } : p));
      closeEdit();
      if (editPhotos.length > 0) { const d = await fetchPointDetail(updated.id); if (d) syncPhotos(updated.id, d.photos || []); }
    } catch (e: any) { setFormErrors([e.message]); }
    finally { setActionLoading(false); }
  };

  const handleDeletePoint = async (id: number): Promise<boolean> => {
    if (!window.confirm("Supprimer ce distributeur ? Cette action est définitive.")) return false;
    try {
      setActionLoading(true);
      const res = await apiService.deletePointVenteById(id);
      if (!res.ok) throw new Error(await failMsg(res, "Erreur lors de la suppression"));
      setPointsVente((prev) => prev.filter((p) => p.id !== id));
      if (selectedPoint?.id === id) setSelectedPoint(null);
      return true;
    } catch (e: any) { setError(e.message); return false; }
    finally { setActionLoading(false); }
  };

  const exportCsv = () => downloadCsv("distributeurs.csv",
    ["Nom", "Propriétaire", "Téléphone", "Email", "Adresse", "Type", "Nature", "Statut", "District", "Commune", "Quartier", "Potentiel", "Score global", "GPS valide", "Fiche complète", "Brandé", "Marque", "Orange", "MTN", "Moov", "Wave", "Digitalisation", "Photos", "Agent", "Concurrents", "Classe quartier", "Ancienneté (ans)", "Façade (m)", "Date inscription", "Date création"],
    filteredPoints.map((p) => [p.name, p.owner, p.phone, p.email, p.address, getTypeLabel(p.type), getNatureLabel(p.nature), getStatusOpts(p.status).label, p.district, p.commune, p.quartier, p.potentiel_label, p.score_global,
      p.gps_valid ? "Oui" : "Non", p.fiche_complete ? "Oui" : "Non", p.brander ? "Oui" : "Non", p.marque_brander || "", p.orange ? "Oui" : "Non", p.mtn ? "Oui" : "Non", p.moov ? "Oui" : "Non", p.wave ? "Oui" : "Non", calcDigitalisation(p), p.photos_count || 0,
      p.agent_name || "", nbConcurrentsOptions.find((o) => o.value === p.nb_concurrents)?.label || p.nb_concurrents, classeQuartierOptions.find((o) => o.value === p.classe_quartier)?.label || p.classe_quartier, p.anciennete_annees, p.facade_metres, p.registration_date || "", p.created_at || ""]));

  const selectStyle: React.CSSProperties = { ...inp, width: "auto", height: 36, cursor: "pointer", minWidth: 130 };

  /* ══════════════════════════════════════════════════════════
     RENDU
  ══════════════════════════════════════════════════════════ */
  return (
    <div className="pv-root" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <style>{GLOBAL_CSS}</style>

      {error && (
        <div role="alert" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#FEF0ED", border: "1px solid #F5C4B3", borderRadius: 12, fontSize: 13, color: "#9A2D10" }}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} /><span style={{ flex: 1, fontWeight: 600 }}>{error}</span>
          <button onClick={() => setError(null)} aria-label="Fermer" style={{ background: "none", border: "none", cursor: "pointer", color: "#9A2D10", display: "flex" }}><X size={14} /></button>
        </div>
      )}

      {/* ══════════ LISTE ══════════ */}
      {activeView === "liste" && (
        <>
          <div style={{ background: P.banner, borderRadius: 16, padding: 20, display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
            <div style={{ maxWidth: 620 }}>
              <p style={{ color: "rgba(200,230,248,0.9)", fontSize: 12, fontWeight: 600, margin: "0 0 6px", display: "flex", alignItems: "center", gap: 7 }}><Building2 size={15} style={{ color: P.blueL }} /> LanfiaLink Intelligence</p>
              <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 800, margin: 0 }}>Gestion des distributeurs</h2>
              <p style={{ color: "rgba(200,230,248,0.85)", fontSize: 12, margin: "6px 0 0", lineHeight: 1.5 }}>Réseau commercial : scores A/D/E, éligibilités, paiements mobiles et qualité des fiches terrain.</p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="pv-btn" onClick={fetchPoints} style={{ ...btnPrimary, background: "rgba(255,255,255,0.16)" }}>{loading ? <Loader2 size={13} className="pv-spin" /> : <RefreshCw size={13} />} Actualiser</button>
              <button className="pv-btn" onClick={() => setActiveView("carte")} style={{ ...btnPrimary, background: "rgba(255,255,255,0.16)" }}><MapIcon size={13} /> Vue carte</button>
              <button className="pv-btn" onClick={exportCsv} disabled={!filteredPoints.length} style={{ ...btnPrimary, background: "rgba(255,255,255,0.16)", opacity: filteredPoints.length ? 1 : 0.5 }}><Download size={13} /> Exporter CSV</button>
              <button className="pv-btn" onClick={() => { setShowAddModal(true); setFormErrors([]); }} style={btnPrimary}><Plus size={14} /> Nouveau distributeur</button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
            <Kpi icon={Building2} label="Total distributeurs" value={fmt(stats.total)} sub={`${stats.actifs} actifs`} color={P.blue} />
            <Kpi icon={Navigation} label="GPS valides" value={fmt(stats.gps)} sub={`${Math.round((stats.gps / Math.max(stats.total, 1)) * 100)} % du réseau`} color={P.teal} />
            <Kpi icon={Award} label="Éligibles branding" value={fmt(stats.elig)} sub={`${stats.brandes} déjà brandés`} color={P.purple} />
            <Kpi icon={BarChart3} label="Score moyen" value={`${stats.score}/100`} sub={`${stats.premium} avec un score ≥ 80`} color={P.orange} />
          </div>

          {/* Couverture paiements mobiles */}
          <div style={{ ...card, padding: 16 }}>
            <CardTitle icon={Smartphone} label="Couverture des paiements mobiles" right={<span style={{ fontSize: 11, color: P.muted }}>Cliquez sur un opérateur pour filtrer</span>} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10 }}>
              {digitStats.map((op) => {
                const pct = Math.round((op.count / Math.max(pointsVente.length, 1)) * 100);
                const on = filterOperator === op.key;
                return (
                  <button key={op.key} onClick={() => setFilterOperator(on ? "all" : op.key)} aria-pressed={on}
                    style={{ textAlign: "left", padding: "10px 12px", borderRadius: 12, background: op.bg, border: `2px solid ${on ? op.color : `${op.color}33`}`, cursor: "pointer", fontFamily: "inherit" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}><op.Logo size={26} active /><span style={{ fontSize: 11, fontWeight: 800, color: op.color }}>{pct} %</span></div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: op.color, margin: 0 }}>{op.label}</p><p style={{ fontSize: 11, color: P.muted, margin: "2px 0 6px", fontWeight: 600 }}>{op.count} point(s)</p>
                    <div style={{ height: 4, borderRadius: 9, background: "rgba(255,255,255,0.7)", overflow: "hidden" }}><div style={{ height: "100%", width: `${pct}%`, background: op.color }} /></div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filtres */}
          <div style={{ ...card, padding: 14 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              {[{ v: "all" as const, label: "Tous", icon: Layers, color: P.blue, bg: P.pale }, ...NATURE_OPTIONS.map((n) => ({ v: n.value, label: n.label, icon: n.icon, color: n.color, bg: n.bg }))].map((n) => {
                const on = filterNature === n.v; const Icon = n.icon;
                return (
                  <button key={n.v} onClick={() => setFilterNature(n.v)} aria-pressed={on}
                    style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 13px", borderRadius: 10, border: `1.5px solid ${on ? n.color : P.warm}`, background: on ? n.color : "#fff", color: on ? "#fff" : n.color, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    <Icon size={13} /> {n.label}
                    <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 9999, background: on ? "rgba(255,255,255,0.25)" : n.bg, color: on ? "#fff" : n.color }}>{natureCounts[n.v] ?? 0}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              <div style={{ position: "relative", flex: "1 1 240px", maxWidth: 340 }}>
                <Search size={14} color={P.muted} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input type="text" placeholder="Nom, propriétaire, téléphone, commune, marque…" aria-label="Rechercher" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ ...inp, height: 36, paddingLeft: 32 }} />
              </div>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} aria-label="Statut" style={selectStyle}><option value="all">Tous les statuts</option>{statusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} aria-label="Type" style={selectStyle}><option value="all">Tous les types</option>{pointTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select>
              <select value={filterQuality} onChange={(e) => setFilterQuality(e.target.value as QualityFilter)} aria-label="Qualité de la fiche" style={selectStyle}>
                <option value="all">Qualité : toutes les fiches</option><option value="gps">GPS manquant</option><option value="fiche">Fiche incomplète</option><option value="photos">Photos insuffisantes</option>
              </select>
              <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} aria-label="Trier par" style={selectStyle}>
                <option value="recent">Trier : plus récents</option><option value="score">Trier : score</option><option value="digital">Trier : digitalisation</option><option value="registration">Trier : date d'inscription</option><option value="name">Trier : nom</option>
              </select>
              <button className="pv-btn" onClick={() => setShowAdvanced((s) => !s)} style={{ ...btnSecondary, height: 36, borderColor: showAdvanced ? P.blue : P.warm, background: showAdvanced ? P.pale : "#fff" }}><SlidersHorizontal size={13} /> Plus de filtres</button>
            </div>

            {showAdvanced && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px dashed ${P.warm}`, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                  <select value={filterDistrict} onChange={(e) => { setFilterDistrict(e.target.value); setFilterCommune("all"); }} aria-label="District" style={selectStyle}><option value="all">Tous les districts</option>{districts.map((d) => <option key={d} value={d}>{d}</option>)}</select>
                  <select value={filterCommune} onChange={(e) => setFilterCommune(e.target.value)} aria-label="Commune" style={selectStyle}><option value="all">Toutes les communes</option>{communes.map((c) => <option key={c} value={c}>{c}</option>)}</select>
                  <select value={filterBrander} onChange={(e) => setFilterBrander(e.target.value)} aria-label="Branding" style={selectStyle}>{branderOptions.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}</select>
                  {marques.length > 0 && <select value={filterMarque} onChange={(e) => setFilterMarque(e.target.value)} aria-label="Marque" style={selectStyle}><option value="all">Toutes les marques</option>{marques.map((m) => <option key={m} value={m}>{m}</option>)}</select>}
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Wifi size={12} style={{ color: P.muted }} /><span style={{ fontSize: 11, color: P.muted, fontWeight: 600 }}>Digitalisation min.</span>
                    {[0, 25, 50, 75, 100].map((l) => <button key={l} onClick={() => setFilterDigitMin(l)} aria-pressed={filterDigitMin === l} style={{ padding: "4px 9px", borderRadius: 8, border: `1.5px solid ${filterDigitMin === l ? P.blue : P.warm}`, background: filterDigitMin === l ? P.blue : "#fff", fontSize: 11, fontWeight: 700, color: filterDigitMin === l ? "#fff" : P.textSub, cursor: "pointer", fontFamily: "inherit" }}>{l === 0 ? "Tous" : `≥ ${l}`}</button>)}
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  <DateRangeFilter label="Date d'inscription" icon={Calendar} fromValue={regFrom} toValue={regTo} onFromChange={setRegFrom} onToChange={setRegTo} />
                  <DateRangeFilter label="Date de création" icon={Clock} fromValue={creFrom} toValue={creTo} onFromChange={setCreFrom} onToChange={setCreTo} />
                </div>
              </div>
            )}

            {(activeChips.length > 0 || searchTerm) && (
              <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, color: P.muted, fontWeight: 600 }}><strong style={{ color: P.text }}>{filteredPoints.length}</strong> résultat(s)</span>
                {activeChips.map((c) => <span key={c.key} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 6px 3px 10px", borderRadius: 9999, background: P.pale, border: `1px solid ${P.warmL}`, color: P.blueD, fontSize: 11, fontWeight: 700 }}>{c.label}<button onClick={c.clear} aria-label={`Retirer ${c.label}`} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", color: P.red, padding: 0 }}><X size={11} /></button></span>)}
                <button onClick={resetFilters} style={{ background: "none", border: "none", cursor: "pointer", color: P.red, fontSize: 11, fontWeight: 700, fontFamily: "inherit" }}>Tout réinitialiser</button>
              </div>
            )}
          </div>

          {/* Tableau */}
          {loading && pointsVente.length === 0 ? (
            <div style={{ ...card, padding: 56, textAlign: "center" }}><Loader2 size={32} className="pv-spin" style={{ color: P.blue, margin: "0 auto 12px" }} /><p style={{ fontSize: 13, color: P.textSub, fontWeight: 600, margin: 0 }}>Chargement des distributeurs…</p></div>
          ) : (
            <div style={{ ...card, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                  <thead><tr style={{ background: P.surface, borderBottom: `1px solid ${P.warmL}` }}>
                    {["Distributeur", "Nature · Type", "Contact", "Statut", "Score A·D·E", "Terrain", "Paiements", "Éligibilités", "Photos", "Actions"].map((h) => <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: P.muted, whiteSpace: "nowrap" }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {currentItems.map((point) => {
                      const badge = badgeFromScore(point.score_global); const sOpts = getStatusOpts(point.status);
                      const nPhotos = point.photos_count || 0;
                      return (
                        <tr key={point.id} className="pv-row" onClick={() => openDetail(point)} style={{ borderTop: `1px solid ${P.surface}`, cursor: "pointer" }}>
                          <td style={{ padding: "11px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 42, height: 42, borderRadius: 11, overflow: "hidden", background: P.pale, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${P.warmL}` }}>
                                {point.avatar ? <img src={point.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} /> : <Store size={16} color={P.blueD} />}
                              </div>
                              <div><p style={{ fontWeight: 700, color: P.text, margin: 0 }}>{point.name}</p>
                                <p style={{ fontSize: 10, color: P.muted, margin: "2px 0 0", display: "flex", alignItems: "center", gap: 3 }}><MapPin size={10} />{point.commune}{point.quartier ? ` · ${point.quartier}` : ""}</p>
                                {point.brander && point.marque_brander && <span style={{ fontSize: 10, color: "#4B2A94", fontWeight: 700, display: "flex", alignItems: "center", gap: 3, marginTop: 2 }}><Award size={9} />{point.marque_brander}</span>}</div>
                            </div>
                          </td>
                          <td style={{ padding: "11px 14px" }}><NatureBadge nature={point.nature} /><p style={{ fontSize: 11, color: P.textSub, margin: "5px 0 0", fontWeight: 600 }}>{getTypeLabel(point.type)}</p><p style={{ fontSize: 10, color: P.muted, margin: "1px 0 0" }}>{potentielLabels[point.potentiel] || point.potentiel_label}</p></td>
                          <td style={{ padding: "11px 14px" }}><p style={{ fontWeight: 700, color: P.text, margin: 0 }}>{point.owner}</p><p style={{ fontSize: 10, color: P.muted, margin: "2px 0 0", display: "flex", alignItems: "center", gap: 3 }}><Phone size={10} />{point.phone}</p>{point.agent_name && <p style={{ fontSize: 10, color: P.blueD, margin: "2px 0 0" }}>Agent : {point.agent_name}</p>}</td>
                          <td style={{ padding: "11px 14px" }}><Pill bg={sOpts.bg} fg={sOpts.fg} dot={sOpts.dot}>{sOpts.label}</Pill>
                            <p style={{ fontSize: 10, margin: "5px 0 0", display: "flex", alignItems: "center", gap: 3, color: point.gps_valid ? "#047857" : "#9A6A00", fontWeight: 600 }}>{point.gps_valid ? <><CheckCircle2 size={10} /> GPS valide</> : <><AlertCircle size={10} /> GPS manquant</>}</p></td>
                          <td style={{ padding: "11px 14px" }}><Pill bg={badge.bg} fg={badge.fg}>{point.score_global}/100</Pill>
                            <div style={{ display: "flex", gap: 4, marginTop: 5 }}>{[["A", point.score_a, P.purple], ["D", point.score_d, P.blue], ["E", point.score_e, P.teal]].map(([l, v, c]) => <span key={l as string} style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 6, background: `${c}1F`, color: c as string }}>{l}:{v}</span>)}</div></td>
                          <td style={{ padding: "11px 14px", fontSize: 10, color: P.textSub, fontWeight: 600, lineHeight: 1.6 }}>
                            {nbConcurrentsOptions.find((o) => o.value === point.nb_concurrents)?.label || "—"} conc.<br />{classeQuartierOptions.find((o) => o.value === point.classe_quartier)?.label || "—"}
                            {point.anciennete_annees > 0 && <><br />{point.anciennete_annees} an(s)</>}{point.facade_metres > 0 && <><br />{point.facade_metres} m façade</>}</td>
                          <td style={{ padding: "11px 14px" }}><OperatorBadges p={point} /><p style={{ fontSize: 10, color: P.muted, margin: "4px 0 0", fontWeight: 600 }}>{calcDigitalisation(point)}/100</p></td>
                          <td style={{ padding: "11px 14px" }}><div style={{ display: "flex", flexDirection: "column", gap: 3 }}>{[["Branding", point.eligibilite_branding], ["Exclusivité", point.eligibilite_exclusivite], ["Activation", point.eligibilite_activation]].map(([l, ok]) => <span key={l as string} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: ok ? "#047857" : P.muted }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: ok ? P.green : P.warm }} />{l as string}</span>)}</div></td>
                          <td style={{ padding: "11px 14px" }}>
                            <button className="pv-btn" onClick={(e) => { e.stopPropagation(); openPhotosModal(point); }} title="Gérer les photos"
                              style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 9, fontSize: 11, fontWeight: 700, cursor: "pointer", background: nPhotos >= MIN_PHOTOS ? "#DCF5EC" : P.pale, color: nPhotos >= MIN_PHOTOS ? "#044D38" : P.blueD, border: "none", fontFamily: "inherit" }}>
                              <Camera size={11} />{nPhotos}{nPhotos < MIN_PHOTOS && `/${MIN_PHOTOS}`}</button></td>
                          <td style={{ padding: "11px 14px" }}><div style={{ display: "flex" }}>
                            <ActionBtn onClick={() => openDetail(point)} title="Voir la fiche"><Eye size={14} color={P.blueD} /></ActionBtn>
                            <ActionBtn onClick={() => openEdit(point)} title="Modifier"><Edit size={14} color={P.blue} /></ActionBtn>
                            <ActionBtn danger onClick={() => handleDeletePoint(point.id)} title="Supprimer"><Trash2 size={14} color={P.red} /></ActionBtn>
                          </div></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredPoints.length === 0 && (
                <EmptyState icon={<Store size={22} />} title={pointsVente.length === 0 ? "Aucun distributeur enregistré" : "Aucun distributeur ne correspond"}
                  sub={pointsVente.length === 0 ? "Ajoutez votre premier point pour commencer." : "Ajustez ou réinitialisez les filtres."}
                  action={pointsVente.length === 0 ? <button className="pv-btn" onClick={() => setShowAddModal(true)} style={btnPrimary}><Plus size={13} /> Nouveau distributeur</button> : <button className="pv-btn" onClick={resetFilters} style={btnSecondary}>Réinitialiser les filtres</button>} />
              )}
              <Pager page={currentPage} perPage={itemsPerPage} count={filteredPoints.length} onPage={setCurrentPage} onPerPage={(n) => { setItemsPerPage(n); setCurrentPage(1); }} />
            </div>
          )}
        </>
      )}

      {/* ══════════ CARTE ══════════ */}
      {activeView === "carte" && (
        <>
          <div style={{ background: P.banner, borderRadius: 16, padding: 20, display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
            <div><h2 style={{ color: "#fff", fontSize: 18, fontWeight: 800, margin: 0 }}>Carte des distributeurs</h2>
              <p style={{ color: "rgba(200,230,248,0.85)", fontSize: 12, margin: "4px 0 0" }}>{filteredPoints.filter((p) => isValidCoord(p.latitude)).length} point(s) géolocalisé(s) sur {filteredPoints.length} (filtres appliqués)</p></div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="pv-btn" onClick={exportCsv} style={{ ...btnPrimary, background: "rgba(255,255,255,0.16)" }}><Download size={13} /> Exporter</button>
              <button className="pv-btn" onClick={() => setActiveView("liste")} style={btnPrimary}><ChevronLeft size={14} /> Retour à la liste</button>
            </div>
          </div>
          <div style={{ ...card, overflow: "hidden", height: 580 }}>
            <MapWithNoSSR points={filteredPoints} center={[5.3599517, -4.0082563]} zoom={12} onPointClick={(p: PointOfSale) => openDetail(p)} showAvatars />
          </div>
        </>
      )}

      {/* ══════════ DÉTAIL ══════════ */}
      {activeView === "detail" && (selectedPoint ? (
        <PointDetail p={selectedPoint} onBack={() => setActiveView("liste")} onEdit={() => openEdit(selectedPoint)}
          onDelete={async () => { if (await handleDeletePoint(selectedPoint.id)) setActiveView("liste"); }}
          onManagePhotos={() => openPhotosModal(selectedPoint)} onDeletePhoto={(id) => handleDeletePhoto(selectedPoint.id, id)} />
      ) : (
        <div style={{ ...card, padding: 56, textAlign: "center" }}>
          <Loader2 size={32} className="pv-spin" style={{ color: P.blue, margin: "0 auto 12px" }} />
          <button className="pv-btn" onClick={() => setActiveView("liste")} style={{ ...btnSecondary, marginTop: 8 }}><ChevronLeft size={13} /> Retour à la liste</button>
        </div>
      ))}

      {/* ══════════ MODALE CRÉATION ══════════ */}
      {showAddModal && (
        <ModalWrapper onClose={() => { if (!actionLoading) closeAdd(); }} title="Nouveau distributeur" subtitle="Ajoutez un point à votre réseau commercial" icon={Plus}
          footer={<>
            <button className="pv-btn" style={btnSecondary} disabled={actionLoading} onClick={closeAdd}>Annuler</button>
            <button className="pv-btn" onClick={handleAddPoint} disabled={actionLoading} style={{ ...btnPrimary, opacity: actionLoading ? 0.7 : 1 }}>
              {actionLoading ? <><Loader2 size={13} className="pv-spin" /> Création…</> : <><Plus size={13} /> Créer le distributeur</>}</button>
          </>}>
          <FormErrors errors={formErrors} />
          <PointForm data={newPoint} isEdit={false} onChange={(u) => setNewPoint((p) => ({ ...p, ...u }))} onPickAvatar={pickAvatar(false)} onPickBranding={pickBranding(false)}
            isFetchingLocation={isFetchingLocation} locationError={locationError} onLocate={getCurrentLocation} />
          <div style={{ borderTop: `1px solid ${P.warmL}`, paddingTop: 16 }}><PhotoUploadSection photos={addPhotos} onChange={setAddPhotos} isUploading={actionLoading} /></div>
        </ModalWrapper>
      )}

      {/* ══════════ MODALE MODIFICATION ══════════ */}
      {editingPoint && (
        <ModalWrapper onClose={() => { if (!actionLoading) closeEdit(); }} title="Modifier le distributeur" subtitle={editingPoint.name} icon={Edit}
          footer={<>
            <button className="pv-btn" style={btnSecondary} disabled={actionLoading} onClick={closeEdit}>Annuler</button>
            <button className="pv-btn" onClick={handleUpdatePoint} disabled={actionLoading} style={{ ...btnPrimary, opacity: actionLoading ? 0.7 : 1 }}>
              {actionLoading ? <><Loader2 size={13} className="pv-spin" /> Sauvegarde…</> : <><Save size={13} /> Sauvegarder</>}</button>
          </>}>
          <FormErrors errors={formErrors} />
          <PointForm data={editingPoint as Draft} isEdit onChange={(u) => setEditingPoint((p) => (p ? ({ ...p, ...u } as PointOfSale) : null))} onPickAvatar={pickAvatar(true)} onPickBranding={pickBranding(true)} />
          <div style={{ borderTop: `1px solid ${P.warmL}`, paddingTop: 16 }}>
            <PhotoUploadSection photos={editPhotos} onChange={setEditPhotos} existingPhotos={editingPoint.photos || []} onDeleteExisting={(id) => handleDeletePhoto(editingPoint.id, id)} isUploading={actionLoading} />
          </div>
        </ModalWrapper>
      )}

      {/* ══════════ MODALE PHOTOS ══════════ */}
      {photosModal && (
        <ModalWrapper onClose={() => { if (!photosUploading) closePhotosModal(); }} title="Photos du point de vente" subtitle={`${photosModal.point.name} · ${photosModal.existing.length} photo(s) enregistrée(s)`} icon={Camera} maxWidth={680}
          footer={<>
            <button className="pv-btn" style={btnSecondary} disabled={photosUploading} onClick={closePhotosModal}>Fermer</button>
            {photosModal.items.length > 0 && (
              <button className="pv-btn" onClick={handleUploadPhotosModal} disabled={photosUploading} style={{ ...btnPrimary, opacity: photosUploading ? 0.7 : 1 }}>
                {photosUploading ? <><Loader2 size={13} className="pv-spin" /> Envoi…</> : <><Upload size={13} /> Envoyer {photosModal.items.length} photo(s)</>}</button>
            )}
          </>}>
          {photosModal.loading && <p style={{ fontSize: 12, color: P.muted, margin: 0, display: "flex", alignItems: "center", gap: 6 }}><Loader2 size={12} className="pv-spin" /> Chargement des photos…</p>}
          <PhotoUploadSection photos={photosModal.items} onChange={(items) => setPhotosModal((m) => (m ? { ...m, items } : m))} existingPhotos={photosModal.existing}
            onDeleteExisting={(id) => handleDeletePhoto(photosModal.point.id, id)} isUploading={photosUploading} />
        </ModalWrapper>
      )}
    </div>
  );
};

export default PointsVenteManagement;