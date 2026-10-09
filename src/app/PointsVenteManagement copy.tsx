"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  MapPin, Plus, Search, Filter, Edit, Trash2, Eye,
  Phone, Mail, User, Calendar, TrendingUp, AlertCircle,
  CheckCircle, Clock, Star, Download,
  Navigation, Building2, Users, ChevronLeft, X,
  ChevronRight, Loader2, Image as ImageIcon,
  Map, Upload, Target, Award, Store, BarChart3,
  CheckCircle2, Activity, Gauge,
  Camera, ZoomIn, Layers, ChevronDown, Smartphone, Wifi,
  Briefcase, Building, ShoppingBag,
} from "lucide-react";
import dynamic from "next/dynamic";
import { apiService } from "./ApiService";

/* ─── Palette ───────────────────────────────────────────── */
const COLORS = {
  navy: "#0D1B2A", blue: "#1A8FD1", blueLight: "#4FB3E8", blueDark: "#0D6FAB",
  green: "#10B981", greenLight: "#34D399", orange: "#F59E0B", orangeLight: "#FBBF24",
  purple: "#8B5CF6", purpleLight: "#A78BFA", pink: "#EC4899", pinkLight: "#F472B6",
  teal: "#14B8A6", tealLight: "#5EEAD4", red: "#EF4444", yellow: "#FACC15",
  indigo: "#6366F1", cyan: "#06B6D4", rose: "#F43F5E",
  white: "#FFFFFF", grayLight: "#F2F6FA", gray: "#2A4055", grayDark: "#0A1520",
  grayMuted: "#1A3A50",
};

const GRADIENTS = {
  primary:   "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  secondary: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  success:   "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  warning:   "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  danger:    "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
  dark:      "linear-gradient(135deg, #0D1B2A 0%, #1a2f3f 100%)",
  card:      "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
};

/* ─── Logos SVG opérateurs mobiles ──────────────────────── */
// Logos fidèles aux identités visuelles officielles, rendus en SVG inline

const OrangeLogo = ({ size = 36, active = true }: { size?: number; active?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"
    style={{ opacity: active ? 1 : 0.4 }}>
    <rect width="36" height="36" rx="8" fill={active ? "#FF6600" : "#FFD4B3"} />
    {/* Carré blanc Orange */}
    <rect x="8" y="8" width="20" height="20" rx="2" fill="white" />
    <rect x="11" y="11" width="14" height="14" rx="1" fill="#FF6600" />
  </svg>
);

const MTNLogo = ({ size = 36, active = true }: { size?: number; active?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"
    style={{ opacity: active ? 1 : 0.4 }}>
    <rect width="36" height="36" rx="8" fill={active ? "#FFCC00" : "#FFF5B3"} />
    {/* Texte MTN stylisé */}
    <text x="5" y="23" fontSize="11" fontWeight="900" fontFamily="Arial, sans-serif" fill="#003087" letterSpacing="-0.5">MTN</text>
    {/* Ligne bleue signature */}
    <rect x="5" y="25" width="26" height="2.5" rx="1.25" fill="#003087" />
    {/* Point jaune foncé */}
    <circle cx="28" cy="12" r="4" fill="#003087" />
    <circle cx="28" cy="12" r="2" fill="#FFCC00" />
  </svg>
);

const MoovLogo = ({ size = 36, active = true }: { size?: number; active?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"
    style={{ opacity: active ? 1 : 0.4 }}>
    <rect width="36" height="36" rx="8" fill={active ? "#0055B3" : "#B3CCEE"} />
    {/* M stylisé Moov Africa */}
    <path d="M6 26 L6 12 L12 20 L18 12 L18 26" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    {/* Vague signature Moov */}
    <path d="M20 19 Q23 14 26 19 Q29 24 32 19" stroke="#00CFFF" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    {/* Point accent */}
    <circle cx="26" cy="13" r="2" fill="#00CFFF" />
  </svg>
);

const WaveLogo = ({ size = 36, active = true }: { size?: number; active?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"
    style={{ opacity: active ? 1 : 0.4 }}>
    <rect width="36" height="36" rx="8" fill={active ? "#1DC6EA" : "#B3ECFF"} />
    {/* W stylisé Wave */}
    <path d="M5 11 L10 25 L15 16 L20 25 L25 11" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    {/* Vague sous le W */}
    <path d="M5 28 Q12 24 18 28 Q24 32 31 28" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6"/>
    {/* Point accent */}
    <circle cx="29" cy="14" r="2.5" fill="white" opacity="0.9" />
  </svg>
);

/* ─── Opérateurs mobiles ─────────────────────────────────── */
const MOBILE_OPERATORS = [
  {
    key:       "orange",
    label:     "Orange CI",
    color:     "#FF6600",
    bg:        "#FFF3EC",
    Logo:      OrangeLogo,
  },
  {
    key:       "mtn",
    label:     "MTN CI",
    color:     "#FFCC00",
    textColor: "#003087",
    bg:        "#FFFBE6",
    Logo:      MTNLogo,
  },
  {
    key:       "moov",
    label:     "Moov Africa",
    color:     "#0055B3",
    bg:        "#EAF1FF",
    Logo:      MoovLogo,
  },
  {
    key:       "wave",
    label:     "Wave",
    color:     "#1DC6EA",
    bg:        "#E6F9FF",
    Logo:      WaveLogo,
  },
] as const;

type OperatorKey = "orange" | "mtn" | "moov" | "wave";

/* ─── Nature du point (Distributeur principal / secondaire / PDV) ──── */
type NatureKey = "distributeur_principal" | "distributeur_secondaire" | "pdv";

const NATURE_OPTIONS: { value: NatureKey; label: string; shortLabel: string; icon: any; color: string; bg: string; gradient: string }[] = [
  {
    value: "distributeur_principal",
    label: "Distributeur principal",
    shortLabel: "Dist. principal",
    icon: Building,
    color: COLORS.indigo,
    bg: "#EEF0FF",
    gradient: GRADIENTS.primary,
  },
  {
    value: "distributeur_secondaire",
    label: "Distributeur secondaire",
    shortLabel: "Dist. secondaire",
    icon: Briefcase,
    color: COLORS.teal,
    bg: "#E6FBF8",
    gradient: GRADIENTS.success,
  },
  {
    value: "pdv",
    label: "PDV",
    shortLabel: "PDV",
    icon: ShoppingBag,
    color: COLORS.orange,
    bg: "#FFF6E8",
    gradient: GRADIENTS.warning,
  },
];

const getNatureOpts  = (n: string) => NATURE_OPTIONS.find((x) => x.value === n) || NATURE_OPTIONS[2];
const getNatureLabel = (n: string) => NATURE_OPTIONS.find((x) => x.value === n)?.label || n || "—";

/* ─── Types ──────────────────────────────────────────────── */
interface POSPhoto {
  id: number; image: string; thumbnail: string | null;
  type: string; caption: string; order: number; created_at: string;
}

interface PointOfSale {
  id: number; name: string; owner: string; phone: string; email: string;
  address: string; latitude: number | null; longitude: number | null;
  district: string; region: string; commune: string; quartier: string;
  type: string; status: string;
  nature: string;
  potentiel: string; potentiel_label: string;
  registration_date: string; turnover: string; monthly_turnover: string;
  monthly_orders: number;
  avatar: string | null;
  brander: boolean; marque_brander: string | null; branding_image: string | null;
  score_a: number; score_d: number; score_e: number; score_global: number;
  visibilite: number; accessibilite: number; affluence: number; digitalisation: number;
  // ── Nouveaux champs opérateurs mobiles ──
  moov: boolean; orange: boolean; mtn: boolean; wave: boolean;
  eligibilite_branding: boolean; eligibilite_exclusivite: boolean; eligibilite_activation: boolean;
  gps_valid: boolean; fiche_complete: boolean; grande_voie: boolean;
  nb_concurrents: string;
  classe_quartier: string;
  anciennete_annees: number;
  facade_metres: number;
  agent: string; agent_name: string; date_collecte: string | null;
  photos_count: number; photos?: POSPhoto[];
  created_at?: string; updated_at?: string;
}

interface PhotoUploadItem {
  id: string; file: File; preview: string; type: string; caption: string;
}

interface District { id: number; nom: string; villes_count: number; }
interface Ville     { id: number; nom: string; district: number; district_nom: string; quartiers_count: number; }
interface Quartier  { id: number; nom: string; ville: number; ville_nom: string; district_nom: string; }

/* ─── Map (no SSR) ───────────────────────────────────────── */
const MapWithNoSSR = dynamic(
  () => import("@/components/Map").then((mod) => {
    return (props: any) => <mod.default {...props} showAvatars={props.showAvatars} />;
  }),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center rounded-xl"
        style={{ background: GRADIENTS.card, border: `1px solid ${COLORS.blueLight}` }}>
        <div className="text-center space-y-3">
          <div style={{ width: 44, height: 44, borderRadius: 12, background: GRADIENTS.primary,
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
            <Navigation size={20} color={COLORS.white} />
          </div>
          <p style={{ color: COLORS.grayDark, fontWeight: 700, fontSize: 13 }}>Chargement de la carte...</p>
        </div>
      </div>
    ),
  }
);

/* ─── Constants ──────────────────────────────────────────── */
const pointTypes = [
  { value: "boutique",       label: "Boutique",       icon: Store,     color: COLORS.blue    },
  { value: "supermarche",    label: "Supermarché",    icon: Building2, color: COLORS.purple  },
  { value: "superette",      label: "Supérette",      icon: Store,     color: COLORS.teal    },
  { value: "epicerie",       label: "Épicerie",       icon: Store,     color: COLORS.orange  },
  { value: "demi_grossiste", label: "Demi-Grossiste", icon: Users,     color: COLORS.pink    },
  { value: "grossiste",      label: "Grossiste",      icon: Building2, color: COLORS.indigo  },
];

const statusOptions = [
  { value: "actif",      label: "Actif",      color: COLORS.green,  bg: GRADIENTS.success, border: COLORS.greenLight },
  { value: "suspendu",   label: "Suspendu",   color: COLORS.red,    bg: GRADIENTS.danger,  border: COLORS.red       },
  { value: "en_attente", label: "En attente", color: COLORS.orange, bg: GRADIENTS.warning, border: COLORS.orange    },
];

const potentielLabels: Record<string, string> = {
  standard:       "Standard",
  developpement:  "Développement",
  fort_potentiel: "Fort potentiel",
  premium:        "Premium",
};

const nbConcurrentsOptions = [
  { value: "aucun",      label: "Aucun"   },
  { value: "un_deux",    label: "1 à 2"  },
  { value: "trois_plus", label: "3 et +" },
];

const classeQuartierOptions = [
  { value: "populaire", label: "Populaire" },
  { value: "mixte",     label: "Mixte"     },
  { value: "aise",      label: "Aisé"      },
];

const branderOptions = [
  { value: "all",         label: "Tous"       },
  { value: "brander",     label: "Brandé"     },
  { value: "non_brander", label: "Non brandé" },
];

const PHOTO_TYPES = [
  { value: "facade",        label: "Façade",        bg: GRADIENTS.primary,   icon: "🏪" },
  { value: "interieur",     label: "Intérieur",     bg: GRADIENTS.secondary, icon: "🏠" },
  { value: "axe_principal", label: "Axe principal", bg: GRADIENTS.success,   icon: "🛣️" },
  { value: "environnement", label: "Environnement", bg: GRADIENTS.warning,   icon: "🌿" },
  { value: "autre",         label: "Autre",         bg: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)", icon: "📷" },
];

const MIN_PHOTOS = 4;

/* ─── Helpers ────────────────────────────────────────────── */
const isValidCoord = (c: number | null | undefined): c is number =>
  c !== null && c !== undefined && !isNaN(c) && c !== 0;

const getStatusOpts  = (s: string) => statusOptions.find((x) => x.value === s) || statusOptions[0];
const getTypeLabel   = (t: string) => pointTypes.find((x) => x.value === t)?.label || t;
const getStatusLabel = (s: string) => statusOptions.find((x) => x.value === s)?.label || s;
const getPhotoLabel  = (t: string) => PHOTO_TYPES.find((x) => x.value === t)?.label || t;
const getPhotoBg     = (t: string) => PHOTO_TYPES.find((x) => x.value === t)?.bg || GRADIENTS.secondary;

const parseDate = (s: string | null | undefined): Date | null => {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

const inDateRange = (dateStr: string | null | undefined, from: string, to: string): boolean => {
  if (!from && !to) return true;
  const d = parseDate(dateStr);
  if (!d) return false;
  if (from) { const f = parseDate(from); if (f && d < f) return false; }
  if (to) { const t = parseDate(to); if (t) { const e = new Date(t); e.setHours(23,59,59,999); if (d > e) return false; } }
  return true;
};

const getStatusIcon = (status: string) => {
  if (status === "actif")      return <CheckCircle size={12} color={COLORS.green}  />;
  if (status === "suspendu")   return <AlertCircle size={12} color={COLORS.red}    />;
  if (status === "en_attente") return <Clock       size={12} color={COLORS.orange} />;
  return null;
};

const badgeFromScore = (score: number) => {
  if (score >= 85) return { label: "Premium stratégique", color: COLORS.white, bg: GRADIENTS.primary,   border: COLORS.purple  };
  if (score >= 70) return { label: "Haut potentiel",      color: COLORS.white, bg: GRADIENTS.success,   border: COLORS.teal    };
  if (score >= 50) return { label: "Développement",       color: COLORS.white, bg: GRADIENTS.warning,   border: COLORS.orange  };
  return             { label: "Standard",                 color: COLORS.grayDark, bg: "linear-gradient(135deg, #E5E7EB 0%, #D1D5DB 100%)", border: COLORS.gray };
};

const fmt = (n: number) => n.toLocaleString("fr-FR");

/** Calcule le score de digitalisation à partir des booléens opérateurs */
const calcDigitalisation = (p: Pick<PointOfSale, "moov"|"orange"|"mtn"|"wave">) =>
  [p.moov, p.orange, p.mtn, p.wave].filter(Boolean).length * 25;

/** Retourne les opérateurs actifs d'un PDV */
const getActiveOperators = (p: Pick<PointOfSale, "moov"|"orange"|"mtn"|"wave">) =>
  MOBILE_OPERATORS.filter((op) => p[op.key as OperatorKey]);

/* ─── GradientStripe ─────────────────────────────────────── */
const GradientStripe = ({ height = 3 }: { height?: number }) => (
  <div style={{
    height, flexShrink: 0,
    background: "linear-gradient(90deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)",
  }} />
);

/* ─── Micro-components ───────────────────────────────────── */
const SectionTitle = ({ icon: Icon, label }: { icon: any; label: string }) => (
  <h4 style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700,
    color: COLORS.grayDark, textTransform: "uppercase", letterSpacing: "0.07em" }}>
    <Icon size={13} color={COLORS.blue} /> {label}
  </h4>
);

const FormInput = ({ label, value, onChange, type = "text", placeholder = "", disabled = false }: {
  label: string; value: string | number; onChange: (v: string) => void;
  type?: string; placeholder?: string; disabled?: boolean;
}) => (
  <div>
    <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: COLORS.gray,
      textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>{label}</label>
    <input type={type} value={value ?? ""} disabled={disabled}
      onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: "100%", padding: "8px 12px", border: `1px solid ${COLORS.blueLight}`, borderRadius: 9,
        fontSize: 13, background: disabled ? "#f0f4f8" : COLORS.grayLight, outline: "none",
        fontFamily: "inherit", color: COLORS.grayDark, opacity: disabled ? 0.6 : 1,
        cursor: disabled ? "not-allowed" : "text", transition: "border 0.15s, box-shadow 0.15s" }}
      onFocus={(e) => { if (!disabled) { e.currentTarget.style.borderColor = COLORS.blue; e.currentTarget.style.background = COLORS.white; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(26,143,209,0.12)`; } }}
      onBlur={(e)  => { e.currentTarget.style.borderColor = COLORS.blueLight; e.currentTarget.style.background = disabled ? "#f0f4f8" : COLORS.grayLight; e.currentTarget.style.boxShadow = "none"; }} />
  </div>
);

const FormSelect = ({ label, value, onChange, options, disabled = false }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; disabled?: boolean;
}) => (
  <div>
    <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: COLORS.gray,
      textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>{label}</label>
    <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
      style={{ width: "100%", padding: "8px 12px", border: `1px solid ${COLORS.blueLight}`, borderRadius: 9,
        fontSize: 13, background: disabled ? "#f0f4f8" : COLORS.grayLight, outline: "none",
        fontFamily: "inherit", color: COLORS.grayDark, opacity: disabled ? 0.6 : 1,
        cursor: disabled ? "not-allowed" : "pointer" }}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const ScoreInput = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
  <div>
    <label style={{ display: "block", fontSize: 10, color: COLORS.gray, marginBottom: 4, fontWeight: 700 }}>{label}</label>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <input type="range" min={0} max={100} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: COLORS.blue }} />
      <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.grayDark, minWidth: 28, textAlign: "right" }}>{value}</span>
    </div>
  </div>
);

const FilterSelect = ({ value, onChange, children, disabled = false }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode; disabled?: boolean;
}) => (
  <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
    style={{ padding: "7px 12px", border: `1px solid ${COLORS.blueLight}`, borderRadius: 9,
      fontSize: 12, background: COLORS.grayLight, outline: "none", fontFamily: "inherit",
      color: COLORS.grayMuted, minWidth: 130, opacity: disabled ? 0.5 : 1,
      cursor: disabled ? "not-allowed" : "pointer", fontWeight: 500 }}>
    {children}
  </select>
);

/* ─── DateRangeFilter ────────────────────────────────────── */
const DateRangeFilter = ({ label, icon: Icon, color, fromValue, toValue, onFromChange, onToChange }: {
  label: string; icon: any; color: string;
  fromValue: string; toValue: string;
  onFromChange: (v: string) => void; onToChange: (v: string) => void;
}) => {
  const hasFilter = fromValue || toValue;
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 5,
      padding: "10px 12px",
      background: hasFilter ? `rgba(26,143,209,0.06)` : COLORS.white,
      border: `1px solid ${hasFilter ? COLORS.blue : COLORS.blueLight}`,
      borderRadius: 10, minWidth: 220, transition: "all 0.15s",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
        <div style={{ width: 20, height: 20, borderRadius: 5,
          background: hasFilter ? color : COLORS.grayLight,
          display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }}>
          <Icon size={11} color={hasFilter ? COLORS.white : COLORS.gray} />
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: hasFilter ? COLORS.blueDark : COLORS.grayMuted,
          textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</span>
        {hasFilter && (
          <button onClick={() => { onFromChange(""); onToChange(""); }} title="Effacer"
            style={{ marginLeft: "auto", padding: "1px 5px", borderRadius: 5,
              background: COLORS.red, border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}>
            <X size={9} color={COLORS.white} />
          </button>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {[{ l: "Début", v: fromValue, fn: onFromChange, min: undefined }, { l: "Fin", v: toValue, fn: onToChange, min: fromValue || undefined }].map(({ l, v, fn, min }) => (
          <div key={l}>
            <label style={{ display: "block", fontSize: 9, fontWeight: 700, color: COLORS.gray,
              textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>{l}</label>
            <input type="date" value={v} min={min} onChange={(e) => fn(e.target.value)}
              style={{ width: "100%", padding: "5px 8px",
                border: `1px solid ${v ? COLORS.blue : COLORS.blueLight}`,
                borderRadius: 7, fontSize: 11, background: COLORS.white, outline: "none",
                fontFamily: "inherit", color: COLORS.grayDark, cursor: "pointer" }} />
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── NatureTabs ──────────────────────────────────────────── */
const NatureTabs = ({ value, onChange, counts }: {
  value: "all" | NatureKey; onChange: (v: "all" | NatureKey) => void; counts: Record<string, number>;
}) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
    <button onClick={() => onChange("all")}
      style={{
        display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 10,
        border: `1.5px solid ${value === "all" ? COLORS.blue : COLORS.blueLight}`,
        background: value === "all" ? GRADIENTS.primary : COLORS.white,
        color: value === "all" ? COLORS.white : COLORS.grayMuted,
        fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
      }}>
      <Layers size={13} /> Tous
      <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 10,
        background: value === "all" ? "rgba(255,255,255,0.25)" : COLORS.grayLight,
        color: value === "all" ? COLORS.white : COLORS.gray, fontWeight: 700 }}>
        {counts.all ?? 0}
      </span>
    </button>
    {NATURE_OPTIONS.map((n) => {
      const active = value === n.value;
      const Icon = n.icon;
      return (
        <button key={n.value} onClick={() => onChange(n.value)}
          style={{
            display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 10,
            border: `1.5px solid ${active ? n.color : COLORS.blueLight}`,
            background: active ? n.gradient : n.bg,
            color: active ? COLORS.white : n.color,
            fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
          }}>
          <Icon size={13} /> {n.label}
          <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 10,
            background: active ? "rgba(255,255,255,0.25)" : COLORS.white,
            color: active ? COLORS.white : n.color, fontWeight: 700 }}>
            {counts[n.value] ?? 0}
          </span>
        </button>
      );
    })}
  </div>
);

const NatureBadge = ({ nature, size = "sm" }: { nature: string; size?: "sm" | "md" }) => {
  const n = getNatureOpts(nature);
  const Icon = n.icon;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: size === "sm" ? "2px 8px" : "3px 10px", borderRadius: 20,
      background: n.bg, border: `1px solid ${n.color}44`,
      fontSize: size === "sm" ? 10 : 11, fontWeight: 700, color: n.color,
    }}>
      <Icon size={size === "sm" ? 10 : 12} /> {size === "sm" ? n.shortLabel : n.label}
    </span>
  );
};

/* ─── OperatorToggle (formulaire) ────────────────────────── */
const OperatorTogglesField = ({
  data,
  onChange,
}: {
  data: Pick<PointOfSale, "moov"|"orange"|"mtn"|"wave">;
  onChange: (u: Partial<Pick<PointOfSale, "moov"|"orange"|"mtn"|"wave">>) => void;
}) => {
  const activeCount = MOBILE_OPERATORS.filter((op) => data[op.key as OperatorKey]).length;
  const digitPct = activeCount * 25;

  return (
    <div style={{ background: GRADIENTS.card, borderRadius: 12, padding: 14, border: `1px solid ${COLORS.blueLight}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <SectionTitle icon={Smartphone} label="Paiements mobiles acceptés" />
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "3px 10px", borderRadius: 20,
          background: digitPct === 100 ? GRADIENTS.success : digitPct > 0 ? GRADIENTS.secondary : COLORS.grayLight,
          border: `1px solid ${digitPct > 0 ? COLORS.blueLight : COLORS.blueLight}`,
        }}>
          <Wifi size={10} color={digitPct > 0 ? COLORS.white : COLORS.gray} />
          <span style={{ fontSize: 11, fontWeight: 700, color: digitPct > 0 ? COLORS.white : COLORS.gray }}>
            {digitPct}/100
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        {MOBILE_OPERATORS.map((op) => {
          const active = !!data[op.key as OperatorKey];
          const { Logo } = op;
          return (
            <button
              key={op.key}
              type="button"
              onClick={() => onChange({ [op.key]: !active } as any)}
              style={{
                position: "relative",
                padding: "12px 6px",
                borderRadius: 12,
                border: `2px solid ${active ? op.color : COLORS.blueLight}`,
                background: active ? op.bg : COLORS.grayLight,
                cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                transition: "all 0.15s",
                transform: active ? "scale(1.03)" : "scale(1)",
                boxShadow: active ? `0 4px 14px ${op.color}33` : "none",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.borderColor = op.color;
                  (e.currentTarget as HTMLElement).style.transform = "scale(1.02)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.borderColor = COLORS.blueLight;
                  (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                }
              }}
            >
              {active && (
                <div style={{
                  position: "absolute", top: 5, right: 5,
                  width: 15, height: 15, borderRadius: "50%",
                  background: op.color, display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 2px 6px ${op.color}66`,
                }}>
                  <CheckCircle2 size={10} color={COLORS.white} />
                </div>
              )}
              <Logo size={38} active={active} />
              <span style={{ fontSize: 10, fontWeight: 700, color: active ? op.color : COLORS.gray, textAlign: "center", lineHeight: 1.2 }}>
                {op.label}
              </span>
              {active ? (
                <span style={{ fontSize: 9, fontWeight: 700,
                  padding: "2px 6px", borderRadius: 5,
                  background: op.color + "22", color: op.color, border: `1px solid ${op.color}44` }}>
                  +25%
                </span>
              ) : (
                <span style={{ fontSize: 9, color: COLORS.gray, fontWeight: 500 }}>Inactif</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Barre de progression */}
      <div style={{ marginTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontSize: 10, color: COLORS.gray, fontWeight: 600 }}>Score digitalisation</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: digitPct > 0 ? COLORS.blue : COLORS.gray }}>{digitPct}/100</span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: COLORS.blueLight, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 3,
            background: digitPct === 100 ? GRADIENTS.success : GRADIENTS.secondary,
            width: `${digitPct}%`, transition: "width 0.4s",
          }} />
        </div>
        <p style={{ fontSize: 10, color: COLORS.gray, marginTop: 4, fontWeight: 600 }}>
          {activeCount === 0
            ? "Aucun opérateur sélectionné"
            : activeCount === 4
            ? "✓ Tous les opérateurs — digitalisation complète"
            : `${activeCount} opérateur${activeCount > 1 ? "s" : ""} actif${activeCount > 1 ? "s" : ""} — ${digitPct}/100`}
        </p>
      </div>
    </div>
  );
};

/* ─── OperatorBadges (affichage) ─────────────────────────── */
const OperatorBadges = ({ p, size = "sm" }: { p: Pick<PointOfSale, "moov"|"orange"|"mtn"|"wave">; size?: "sm"|"md" }) => {
  const active = getActiveOperators(p);
  if (active.length === 0) return null;
  const logoSize = size === "sm" ? 18 : 24;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
      {active.map((op) => {
        const { Logo } = op;
        return (
          <span key={op.key} title={op.label} style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: size === "sm" ? "2px 7px 2px 3px" : "3px 9px 3px 4px",
            borderRadius: 20,
            background: op.bg,
            border: `1px solid ${op.color}44`,
            fontSize: size === "sm" ? 10 : 11,
            fontWeight: 700, color: op.color,
          }}>
            <Logo size={logoSize} active={true} />
            {op.label}
          </span>
        );
      })}
    </div>
  );
};

const ActionBtn = ({ onClick, title, bgHover, children }: {
  onClick: () => void; title: string; bgHover: string; children: React.ReactNode;
}) => (
  <button onClick={onClick} title={title}
    style={{ padding: 7, borderRadius: 7, background: "transparent", border: "none", cursor: "pointer", transition: "background 0.15s" }}
    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = bgHover; }}
    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
    {children}
  </button>
);

const PagBtn = ({ onClick, disabled = false, active = false, children }: {
  onClick: () => void; disabled?: boolean; active?: boolean; children: React.ReactNode;
}) => (
  <button onClick={onClick} disabled={disabled}
    style={{ padding: "5px 10px", borderRadius: 7, fontSize: 12, fontWeight: 700,
      cursor: disabled ? "not-allowed" : "pointer", border: "1px solid",
      borderColor: active ? COLORS.blueDark : disabled ? COLORS.blueLight : COLORS.blueLight,
      background: active ? GRADIENTS.primary : disabled ? COLORS.grayLight : COLORS.grayLight,
      color: active ? COLORS.white : disabled ? COLORS.gray : COLORS.grayDark, transition: "all 0.1s" }}>
    {children}
  </button>
);

const ScorePill = ({ label, value, bg }: { label: string; value: number; bg: string }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 2, padding: "2px 6px",
    borderRadius: 5, fontSize: 10, fontWeight: 700, color: COLORS.white, background: bg }}>
    {label}:{value}
  </span>
);

const EligibilityDot = ({ label, ok }: { label: string; ok: boolean }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
    <div style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
      background: ok ? COLORS.green : COLORS.blueLight }} />
    <span style={{ fontSize: 11, fontWeight: 600, color: ok ? COLORS.green : COLORS.gray }}>{label}</span>
  </div>
);

const ProgressBarFull = ({ label, value, max, bg }: { label: string; value: number; max: number; bg: string }) => {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 5 }}>
        <span style={{ color: COLORS.gray, fontWeight: 600 }}>{label}</span>
        <span style={{ fontWeight: 700, color: COLORS.grayDark }}>{value}/{max}</span>
      </div>
      <div style={{ height: 7, borderRadius: 10, background: COLORS.blueLight }}>
        <div style={{ height: 7, borderRadius: 10, background: bg, width: `${pct}%`, transition: "width 0.5s" }} />
      </div>
    </div>
  );
};

const paginationRange = (current: number, total: number): (number | string)[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "...", total];
  if (current >= total - 3) return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
};

/* ═══════════════════════════════════════════════════════════
   GEO SELECTOR
═══════════════════════════════════════════════════════════ */
interface GeoSelectorProps {
  districtNom: string; villeNom: string; quartierNom: string;
  onDistrictChange: (nom: string) => void;
  onVilleChange: (nom: string) => void;
  onQuartierChange: (nom: string) => void;
}

const GeoSelector: React.FC<GeoSelectorProps> = ({
  districtNom, villeNom, quartierNom,
  onDistrictChange, onVilleChange, onQuartierChange,
}) => {
  const [districts, setDistricts] = useState<District[]>([]);
  const [villes, setVilles]       = useState<Ville[]>([]);
  const [quartiers, setQuartiers] = useState<Quartier[]>([]);
  const [loadingD, setLoadingD]   = useState(false);
  const [loadingV, setLoadingV]   = useState(false);
  const [loadingQ, setLoadingQ]   = useState(false);
  const [openD, setOpenD] = useState(false);
  const [openV, setOpenV] = useState(false);
  const [openQ, setOpenQ] = useState(false);

  useEffect(() => { fetchDistricts(); }, []);

  const fetchDistricts = async () => {
    setLoadingD(true);
    try {
      const res = await apiService.getDistricts();
      const data = await res.json();
      setDistricts(Array.isArray(data) ? data : (data.results || []));
    } catch {} finally { setLoadingD(false); }
  };

  const fetchVilles = async (districtId: number) => {
    setLoadingV(true);
    try {
      const res = await apiService.getVilles(districtId);
      const data = await res.json();
      setVilles(Array.isArray(data) ? data : (data.results || []));
    } catch {} finally { setLoadingV(false); }
  };

  const fetchQuartiers = async (villeId: number) => {
    setLoadingQ(true);
    try {
      const res = await apiService.getQuartiers(villeId);
      const data = await res.json();
      setQuartiers(Array.isArray(data) ? data : (data.results || []));
    } catch {} finally { setLoadingQ(false); }
  };

  const handleSelectDistrict = (d: District) => {
    onDistrictChange(d.nom); onVilleChange(""); onQuartierChange("");
    setVilles([]); setQuartiers([]); setOpenD(false);
    fetchVilles(d.id);
  };
  const handleSelectVille = (v: Ville) => {
    onVilleChange(v.nom); onQuartierChange("");
    setQuartiers([]); setOpenV(false);
    fetchQuartiers(v.id);
  };
  const handleSelectQuartier = (q: Quartier) => { onQuartierChange(q.nom); setOpenQ(false); };

  const GeoDropdown = ({ label, value, open, onOpen, loading, items, onSelect, disabled, placeholder }: {
    label: string; value: string; open: boolean; onOpen: () => void;
    loading: boolean; items: { id: number; nom: string; sub?: string }[];
    onSelect: (item: any) => void; disabled?: boolean; placeholder: string;
  }) => (
    <div style={{ position: "relative" }}>
      <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: COLORS.gray,
        textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>{label}</label>
      <button type="button" onClick={() => !disabled && onOpen()}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "8px 12px", border: `1px solid ${open ? COLORS.blue : COLORS.blueLight}`,
          borderRadius: 9, fontSize: 13, background: disabled ? "#f0f4f8" : COLORS.grayLight,
          outline: "none", fontFamily: "inherit", color: value ? COLORS.grayDark : COLORS.gray,
          cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1,
          boxShadow: open ? `0 0 0 3px rgba(26,143,209,0.12)` : "none", transition: "all 0.15s" }}>
        <span style={{ fontWeight: value ? 600 : 400 }}>{value || placeholder}</span>
        {loading
          ? <Loader2 size={13} color={COLORS.gray} className="animate-spin" />
          : <ChevronDown size={13} color={COLORS.gray}
              style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />}
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50,
          background: COLORS.white, border: `1px solid ${COLORS.blueLight}`, borderRadius: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", maxHeight: 220, overflowY: "auto" }}>
          {items.length === 0
            ? <div style={{ padding: "12px 14px", fontSize: 12, color: COLORS.gray, fontWeight: 600 }}>Aucun résultat</div>
            : items.map((item) => (
              <button key={item.id} type="button" onClick={() => onSelect(item)}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px", background: "transparent", border: "none", cursor: "pointer",
                  fontFamily: "inherit", borderBottom: `1px solid ${COLORS.grayLight}`, textAlign: "left", transition: "background 0.1s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = COLORS.grayLight; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.grayDark }}>{item.nom}</span>
                {item.sub && <span style={{ fontSize: 10, color: COLORS.gray, fontWeight: 500 }}>{item.sub}</span>}
              </button>
            ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
      <GeoDropdown label="District / Région *" value={districtNom} open={openD}
        onOpen={() => { setOpenD(!openD); setOpenV(false); setOpenQ(false); }}
        loading={loadingD} items={districts.map((d) => ({ id: d.id, nom: d.nom, sub: `${d.villes_count} ville(s)` }))}
        onSelect={handleSelectDistrict} placeholder="Choisir un district" />
      <GeoDropdown label="Ville / Commune *" value={villeNom} open={openV}
        onOpen={() => { setOpenV(!openV); setOpenD(false); setOpenQ(false); }}
        loading={loadingV} items={villes.map((v) => ({ id: v.id, nom: v.nom, sub: `${v.quartiers_count} quartier(s)` }))}
        onSelect={handleSelectVille} disabled={!districtNom} placeholder="Choisir une ville" />
      <GeoDropdown label="Quartier" value={quartierNom} open={openQ}
        onOpen={() => { setOpenQ(!openQ); setOpenD(false); setOpenV(false); }}
        loading={loadingQ} items={quartiers.map((q) => ({ id: q.id, nom: q.nom }))}
        onSelect={handleSelectQuartier} disabled={!villeNom} placeholder="Choisir un quartier" />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   PHOTO UPLOAD SECTION
═══════════════════════════════════════════════════════════ */
interface PhotoUploadSectionProps {
  photos: PhotoUploadItem[];
  onChange: (photos: PhotoUploadItem[]) => void;
  existingPhotos?: POSPhoto[];
  onDeleteExisting?: (photoId: number) => void;
  posId?: number;
  isUploading?: boolean;
}

const PhotoUploadSection: React.FC<PhotoUploadSectionProps> = ({
  photos, onChange, existingPhotos = [], onDeleteExisting, isUploading = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [lbIdx, setLbIdx] = useState<number | null>(null);
  const [lbSrc, setLbSrc] = useState<"new" | "existing">("new");

  const allCount      = existingPhotos.length + photos.length;
  const coveredTypes  = new Set([...existingPhotos.map((p) => p.type), ...photos.map((p) => p.type)]);
  const requiredTypes = ["facade", "interieur", "axe_principal", "environnement"];
  const missingTypes  = requiredTypes.filter((t) => !coveredTypes.has(t));

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const existingTypesArr = [...existingPhotos.map((p) => p.type), ...photos.map((p) => p.type)];
    const newItems: PhotoUploadItem[] = Array.from(files).map((file, i) => {
      const missingType = PHOTO_TYPES.find((t) => !existingTypesArr.includes(t.value));
      return { id: `new-${Date.now()}-${i}`, file, preview: URL.createObjectURL(file), type: missingType?.value || "autre", caption: "" };
    });
    onChange([...photos, ...newItems]);
  };

  const update = (id: string, u: Partial<PhotoUploadItem>) =>
    onChange(photos.map((p) => (p.id === id ? { ...p, ...u } : p)));
  const remove = (id: string) => onChange(photos.filter((p) => p.id !== id));

  return (
    <div className="space-y-4">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Camera size={15} color={COLORS.blue} />
          <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.grayDark, textTransform: "uppercase", letterSpacing: "0.06em" }}>Photos du PDV</span>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
            background: allCount >= MIN_PHOTOS ? GRADIENTS.success : GRADIENTS.secondary, color: COLORS.white }}>
            {allCount}/{MIN_PHOTOS} min
          </span>
        </div>
        <button type="button" onClick={() => inputRef.current?.click()} disabled={isUploading}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8,
            background: GRADIENTS.primary, color: COLORS.white, fontSize: 11, fontWeight: 700,
            border: "none", cursor: "pointer", opacity: isUploading ? 0.5 : 1 }}>
          <Plus size={12} /> Ajouter photos
        </button>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {missingTypes.length > 0 && (
        <div style={{ display: "flex", gap: 8, padding: 12, borderRadius: 10,
          background: GRADIENTS.warning, border: `1px solid ${COLORS.orangeLight}` }}>
          <AlertCircle size={14} color={COLORS.orange} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: COLORS.grayDark }}>Types requis manquants :</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
              {missingTypes.map((t) => (
                <span key={t} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6,
                  background: COLORS.white, color: COLORS.orange, fontWeight: 700 }}>
                  {PHOTO_TYPES.find((pt) => pt.value === t)?.icon} {getPhotoLabel(t)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {allCount === 0 && (
        <div onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          style={{ border: `2px dashed ${COLORS.blueLight}`, borderRadius: 14, padding: 32, textAlign: "center",
            cursor: "pointer", background: COLORS.grayLight, transition: "all 0.15s" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = COLORS.blue; (e.currentTarget as HTMLElement).style.background = COLORS.white; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = COLORS.blueLight; (e.currentTarget as HTMLElement).style.background = COLORS.grayLight; }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: GRADIENTS.primary,
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <Camera size={24} color={COLORS.white} />
          </div>
          <p style={{ fontWeight: 700, color: COLORS.grayDark, fontSize: 13, marginBottom: 4 }}>Déposez vos photos ici</p>
          <p style={{ fontSize: 11, color: COLORS.gray }}>4 photos minimum · Façade, Intérieur, Axe principal, Environnement</p>
        </div>
      )}

      {existingPhotos.length > 0 && (
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, color: COLORS.gray, textTransform: "uppercase",
            letterSpacing: "0.08em", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
            <Layers size={11} /> Photos enregistrées ({existingPhotos.length})
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
            {existingPhotos.map((photo, idx) => (
              <div key={photo.id} className="group relative rounded-xl overflow-hidden"
                style={{ aspectRatio: "1", border: `1px solid ${COLORS.blueLight}`, background: COLORS.grayLight }}>
                <img src={photo.thumbnail || photo.image} alt={photo.type}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <button type="button" onClick={() => { setLbIdx(idx); setLbSrc("existing"); }}
                    style={{ padding: 5, background: "rgba(255,255,255,0.9)", borderRadius: 7, border: "none", cursor: "pointer" }}>
                    <ZoomIn size={13} color={COLORS.grayDark} />
                  </button>
                  {onDeleteExisting && (
                    <button type="button" onClick={() => onDeleteExisting(photo.id)}
                      style={{ padding: 5, background: GRADIENTS.danger, borderRadius: 7, border: "none", cursor: "pointer" }}>
                      <Trash2 size={13} color={COLORS.white} />
                    </button>
                  )}
                </div>
                <div style={{ position: "absolute", top: 5, left: 5, padding: "2px 6px", borderRadius: 5,
                  background: getPhotoBg(photo.type), color: COLORS.white, fontSize: 10, fontWeight: 700 }}>
                  {PHOTO_TYPES.find((t) => t.value === photo.type)?.icon}
                </div>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0,
                  background: "linear-gradient(transparent,rgba(0,0,0,0.65))", padding: "6px 8px" }}>
                  <p style={{ color: COLORS.white, fontSize: 10, fontWeight: 700 }}>{getPhotoLabel(photo.type)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {photos.length > 0 && (
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, color: COLORS.gray, textTransform: "uppercase",
            letterSpacing: "0.08em", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
            <Upload size={11} /> Nouvelles photos ({photos.length})
          </p>
          <div className="space-y-3">
            {photos.map((photo) => (
              <div key={photo.id} style={{ display: "flex", gap: 12, padding: 12, borderRadius: 12,
                background: GRADIENTS.card, border: `1px solid ${COLORS.blueLight}` }}>
                <div style={{ width: 76, height: 76, borderRadius: 9, overflow: "hidden",
                  border: `1px solid ${COLORS.blueLight}`, flexShrink: 0, cursor: "pointer", position: "relative" }}
                  className="group"
                  onClick={() => { setLbIdx(photos.indexOf(photo)); setLbSrc("new"); }}>
                  <img src={photo.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ZoomIn size={15} color={COLORS.white} />
                  </div>
                </div>
                <div style={{ flex: 1 }} className="space-y-2">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: COLORS.gray,
                        textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Type *</label>
                      <select value={photo.type} onChange={(e) => update(photo.id, { type: e.target.value })}
                        style={{ width: "100%", padding: "6px 8px", border: `1px solid ${COLORS.blueLight}`,
                          borderRadius: 7, fontSize: 11, background: COLORS.white, outline: "none",
                          fontFamily: "inherit", color: COLORS.grayDark }}>
                        {PHOTO_TYPES.map((t) => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: COLORS.gray,
                        textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Légende</label>
                      <input type="text" value={photo.caption} placeholder="Description..."
                        onChange={(e) => update(photo.id, { caption: e.target.value })}
                        style={{ width: "100%", padding: "6px 8px", border: `1px solid ${COLORS.blueLight}`,
                          borderRadius: 7, fontSize: 11, background: COLORS.white, outline: "none",
                          fontFamily: "inherit", color: COLORS.grayDark }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, color: COLORS.white,
                      background: getPhotoBg(photo.type), fontWeight: 700 }}>
                      {PHOTO_TYPES.find((t) => t.value === photo.type)?.icon} {getPhotoLabel(photo.type)}
                    </span>
                    <button type="button" onClick={() => remove(photo.id)}
                      style={{ padding: 5, background: "none", border: "none", cursor: "pointer", borderRadius: 6, color: COLORS.red }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => inputRef.current?.click()}
            style={{ marginTop: 10, width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
              gap: 6, padding: "10px", border: `2px dashed ${COLORS.blueLight}`, borderRadius: 10,
              background: "transparent", color: COLORS.gray, fontSize: 12, fontWeight: 700, cursor: "pointer",
              transition: "all 0.15s", fontFamily: "inherit" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = COLORS.blue; (e.currentTarget as HTMLElement).style.color = COLORS.blue; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = COLORS.blueLight; (e.currentTarget as HTMLElement).style.color = COLORS.gray; }}>
            <Plus size={14} /> Ajouter d'autres photos
          </button>
        </div>
      )}

      {allCount > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
          {requiredTypes.map((type) => {
            const covered = coveredTypes.has(type);
            const info = PHOTO_TYPES.find((t) => t.value === type)!;
            return (
              <div key={type} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 8px",
                borderRadius: 8, fontSize: 10, fontWeight: 700,
                background: covered ? GRADIENTS.success : COLORS.grayLight,
                border: `1px solid ${covered ? COLORS.greenLight : COLORS.blueLight}`,
                color: covered ? COLORS.green : COLORS.gray }}>
                {covered
                  ? <CheckCircle2 size={11} color={COLORS.green} style={{ flexShrink: 0 }} />
                  : <div style={{ width: 11, height: 11, borderRadius: "50%", border: `2px solid ${COLORS.blueLight}`, flexShrink: 0 }} />}
                {info.icon} {info.label}
              </div>
            );
          })}
        </div>
      )}

      {lbIdx !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setLbIdx(null)}>
          <div style={{ position: "relative", maxWidth: 720, width: "100%" }} onClick={(e) => e.stopPropagation()}>
            <img src={lbSrc === "new" ? photos[lbIdx]?.preview : existingPhotos[lbIdx]?.image}
              alt="" style={{ width: "100%", borderRadius: 14, maxHeight: "80vh", objectFit: "contain" }} />
            <button onClick={() => setLbIdx(null)}
              style={{ position: "absolute", top: 10, right: 10, padding: 8, background: "rgba(0,0,0,0.5)",
                border: "none", borderRadius: 10, cursor: "pointer", color: COLORS.white }}>
              <X size={16} />
            </button>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
              <button onClick={() => setLbIdx((i) => i !== null && i > 0 ? i - 1 : i)}
                style={{ padding: "8px 16px", background: "rgba(255,255,255,0.1)", border: "none",
                  borderRadius: 10, color: COLORS.white, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>← Précédent</button>
              <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: 600 }}>
                {lbIdx + 1} / {lbSrc === "new" ? photos.length : existingPhotos.length}
              </span>
              <button onClick={() => {
                const max = (lbSrc === "new" ? photos.length : existingPhotos.length) - 1;
                setLbIdx((i) => i !== null && i < max ? i + 1 : i);
              }} style={{ padding: "8px 16px", background: "rgba(255,255,255,0.1)", border: "none",
                borderRadius: 10, color: COLORS.white, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Suivant →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── PhotoCard ──────────────────────────────────────────── */
const PhotoCard: React.FC<{
  photo: POSPhoto; onDelete: () => void; allPhotos: POSPhoto[]; index: number;
}> = ({ photo, onDelete, allPhotos, index }) => {
  const [lb, setLb] = useState(false);
  const [lbIdx, setLbIdx] = useState(index);
  return (
    <>
      <div className="group relative rounded-xl overflow-hidden"
        style={{ aspectRatio: "1", border: `1px solid ${COLORS.blueLight}`, background: COLORS.grayLight }}>
        <img src={photo.thumbnail || photo.image} alt={photo.type}
          style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }}
          className="group-hover:scale-105" />
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <button type="button" onClick={() => { setLbIdx(index); setLb(true); }}
            style={{ padding: 5, background: "rgba(255,255,255,0.9)", borderRadius: 7, border: "none", cursor: "pointer" }}>
            <ZoomIn size={13} color={COLORS.grayDark} />
          </button>
          <button type="button" onClick={onDelete}
            style={{ padding: 5, background: GRADIENTS.danger, borderRadius: 7, border: "none", cursor: "pointer" }}>
            <Trash2 size={13} color={COLORS.white} />
          </button>
        </div>
        <div style={{ position: "absolute", top: 5, left: 5, padding: "2px 6px", borderRadius: 5,
          background: getPhotoBg(photo.type), color: COLORS.white, fontSize: 10, fontWeight: 700 }}>
          {PHOTO_TYPES.find((t) => t.value === photo.type)?.icon}
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0,
          background: "linear-gradient(transparent,rgba(0,0,0,0.65))", padding: "6px 8px" }}>
          <p style={{ color: COLORS.white, fontSize: 10, fontWeight: 700 }}>{getPhotoLabel(photo.type)}</p>
        </div>
      </div>
      {lb && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setLb(false)}>
          <div style={{ position: "relative", maxWidth: 720, width: "100%" }} onClick={(e) => e.stopPropagation()}>
            <img src={allPhotos[lbIdx]?.image} alt=""
              style={{ width: "100%", borderRadius: 14, maxHeight: "80vh", objectFit: "contain" }} />
            <div style={{ position: "absolute", top: 10, left: 10, padding: "4px 10px", borderRadius: 8,
              background: getPhotoBg(allPhotos[lbIdx]?.type), color: COLORS.white, fontSize: 11, fontWeight: 700,
              display: "flex", alignItems: "center", gap: 5 }}>
              {PHOTO_TYPES.find((t) => t.value === allPhotos[lbIdx]?.type)?.icon}
              {getPhotoLabel(allPhotos[lbIdx]?.type)}
            </div>
            <button onClick={() => setLb(false)}
              style={{ position: "absolute", top: 10, right: 10, padding: 7, background: "rgba(0,0,0,0.5)",
                border: "none", borderRadius: 10, cursor: "pointer" }}>
              <X size={16} color={COLORS.white} />
            </button>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
              <button onClick={() => setLbIdx((i) => Math.max(0, i - 1))} disabled={lbIdx === 0}
                style={{ padding: "7px 14px", background: "rgba(255,255,255,0.1)", border: "none",
                  borderRadius: 9, color: COLORS.white, fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: lbIdx === 0 ? 0.3 : 1 }}>← Précédent</button>
              <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: 600, alignSelf: "center" }}>
                {lbIdx + 1} / {allPhotos.length}
              </span>
              <button onClick={() => setLbIdx((i) => Math.min(allPhotos.length - 1, i + 1))}
                disabled={lbIdx === allPhotos.length - 1}
                style={{ padding: "7px 14px", background: "rgba(255,255,255,0.1)", border: "none",
                  borderRadius: 9, color: COLORS.white, fontSize: 12, fontWeight: 700, cursor: "pointer",
                  opacity: lbIdx === allPhotos.length - 1 ? 0.3 : 1 }}>Suivant →</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/* ═══════════════════════════════════════════════════════════
   MODAL WRAPPER
═══════════════════════════════════════════════════════════ */
const ModalWrapper = ({ onClose, title, subtitle, headerBg, icon: Icon, children, footer }: any) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
    <div style={{ background: COLORS.white, borderRadius: 18, width: "100%", maxWidth: 860,
      maxHeight: "92vh", display: "flex", flexDirection: "column", overflow: "hidden",
      boxShadow: "0 20px 60px rgba(10,21,32,0.22)" }}>
      <div style={{ background: headerBg, flexShrink: 0 }}>
        <GradientStripe height={3} />
        <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, background: "rgba(255,255,255,0.18)", borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={17} color={COLORS.white} />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: COLORS.white }}>{title}</h3>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 1 }}>{subtitle}</p>
            </div>
          </div>
          <button onClick={onClose}
            style={{ padding: 6, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8,
              cursor: "pointer", color: "rgba(255,255,255,0.80)", transition: "background 0.15s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.25)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.15)"; }}>
            <X size={16} />
          </button>
        </div>
      </div>
      <div style={{ overflowY: "auto", flex: 1, padding: 20 }} className="space-y-5">{children}</div>
      <div style={{ borderTop: `1px solid ${COLORS.blueLight}`, padding: "14px 20px",
        display: "flex", justifyContent: "flex-end", gap: 10, background: COLORS.grayLight, flexShrink: 0 }}>
        {footer}
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
const PointsVenteManagement: React.FC = () => {

  const [pointsVente, setPointsVente]           = useState<PointOfSale[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [actionLoading, setActionLoading]       = useState(false);
  const [photosUploading, setPhotosUploading]   = useState(false);
  const [error, setError]                       = useState<string | null>(null);

  const [searchTerm, setSearchTerm]             = useState("");
  const [filterStatus, setFilterStatus]         = useState("all");
  const [filterType, setFilterType]             = useState("all");
  const [filterNature, setFilterNature]         = useState<"all" | NatureKey>("all");
  const [filterDistrict, setFilterDistrict]     = useState("all");
  const [filterRegion, setFilterRegion]         = useState("all");
  const [filterCommune, setFilterCommune]       = useState("all");
  const [filterBrander, setFilterBrander]       = useState("all");
  const [filterMarqueBrander, setFilterMarqueBrander] = useState("all");
  // ── Nouveaux filtres opérateurs mobiles ──
  const [filterOperator, setFilterOperator]     = useState<"all"|OperatorKey>("all");
  const [filterDigitMin, setFilterDigitMin]     = useState<number>(0); // 0=tous, 25,50,75,100

  const [filterRegDateFrom, setFilterRegDateFrom]     = useState("");
  const [filterRegDateTo, setFilterRegDateTo]         = useState("");
  const [filterCreatedAtFrom, setFilterCreatedAtFrom] = useState("");
  const [filterCreatedAtTo, setFilterCreatedAtTo]     = useState("");

  const [activeView, setActiveView]             = useState<"liste" | "carte" | "detail">("liste");
  const [showAddModal, setShowAddModal]         = useState(false);
  const [selectedPoint, setSelectedPoint]       = useState<PointOfSale | null>(null);
  const [editingPoint, setEditingPoint]         = useState<PointOfSale | null>(null);

  const [currentPage, setCurrentPage]           = useState(1);
  const [itemsPerPage, setItemsPerPage]         = useState(10);

  const [avatarFile, setAvatarFile]             = useState<File | null>(null);
  const [brandingImageFile, setBrandingImageFile] = useState<File | null>(null);

  const [addPhotos, setAddPhotos]               = useState<PhotoUploadItem[]>([]);
  const [editPhotos, setEditPhotos]             = useState<PhotoUploadItem[]>([]);
  const [detailPhotos, setDetailPhotos]         = useState<POSPhoto[]>([]);
  const [showPhotosModal, setShowPhotosModal]   = useState(false);
  const [photosModalPoint, setPhotosModalPoint] = useState<PointOfSale | null>(null);
  const [photosModalItems, setPhotosModalItems] = useState<PhotoUploadItem[]>([]);

  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [locationError, setLocationError]           = useState<string | null>(null);

  const emptyForm = () => ({
    name: "", owner: "", phone: "", email: "", address: "",
    type: "boutique", status: "en_attente",
    nature: "pdv" as NatureKey,
    district: "", region: "", commune: "", quartier: "",
    latitude: "" as string | number,
    longitude: "" as string | number,
    registration_date: new Date().toISOString().split("T")[0],
    avatar: "", brander: false, marque_brander: "", branding_image: "",
    visibilite: 0, accessibilite: 0, affluence: 0, digitalisation: 0,
    // ── Opérateurs mobiles ──
    moov: false, orange: false, mtn: false, wave: false,
    grande_voie: false, agent_name: "", date_collecte: "",
    monthly_turnover: "", monthly_orders: 0,
    nb_concurrents: "aucun",
    classe_quartier: "populaire",
    anciennete_annees: 0,
    facade_metres: 0,
  });
  const [newPoint, setNewPoint] = useState(emptyForm());

  /* ── Derived ── */
  const districts      = Array.from(new Set(pointsVente.map((p) => p.district).filter(Boolean))).sort();
  const regions        = Array.from(new Set(pointsVente.map((p) => p.region).filter(Boolean))).sort();
  const communes       = Array.from(new Set(pointsVente.map((p) => p.commune).filter(Boolean))).sort();
  const marquesBrander = Array.from(new Set(pointsVente.filter((p) => p.brander && p.marque_brander).map((p) => p.marque_brander as string))).sort();

  const hasDateFilters = filterRegDateFrom || filterRegDateTo || filterCreatedAtFrom || filterCreatedAtTo;
  const hasOperatorFilters = filterOperator !== "all" || filterDigitMin > 0;

  /* ── Compteurs par nature (sur l'ensemble des points, non filtré par nature) ── */
  const natureCounts: Record<string, number> = {
    all: pointsVente.length,
    distributeur_principal: pointsVente.filter((p) => p.nature === "distributeur_principal").length,
    distributeur_secondaire: pointsVente.filter((p) => p.nature === "distributeur_secondaire").length,
    pdv: pointsVente.filter((p) => p.nature === "pdv").length,
  };

  const filteredPoints = pointsVente.filter((point) => {
    const q = searchTerm.toLowerCase();
    const digitScore = calcDigitalisation(point);
    return (
      (point.name.toLowerCase().includes(q) || point.owner.toLowerCase().includes(q) ||
       point.address.toLowerCase().includes(q) || point.commune.toLowerCase().includes(q) ||
       (point.marque_brander || "").toLowerCase().includes(q)) &&
      (filterStatus === "all" || point.status === filterStatus) &&
      (filterType === "all" || point.type === filterType) &&
      (filterNature === "all" || point.nature === filterNature) &&
      (filterDistrict === "all" || point.district === filterDistrict) &&
      (filterRegion === "all" || point.region === filterRegion) &&
      (filterCommune === "all" || point.commune === filterCommune) &&
      (filterBrander === "all" || (filterBrander === "brander" ? point.brander : !point.brander)) &&
      (filterMarqueBrander === "all" || point.marque_brander === filterMarqueBrander) &&
      // ── Filtres opérateurs mobiles ──
      (filterOperator === "all" || !!point[filterOperator as OperatorKey]) &&
      (filterDigitMin === 0 || digitScore >= filterDigitMin) &&
      inDateRange(point.registration_date, filterRegDateFrom, filterRegDateTo) &&
      inDateRange(point.created_at, filterCreatedAtFrom, filterCreatedAtTo)
    );
  });

  const totalPages   = Math.ceil(filteredPoints.length / itemsPerPage);
  const indexOfFirst = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredPoints.slice(indexOfFirst, indexOfFirst + itemsPerPage);

  const statsCards = [
    { title: "Total Distributeurs", value: fmt(pointsVente.length),
      sub: `${pointsVente.filter((p) => p.status === "actif").length} actifs`,
      icon: Building2, gradient: GRADIENTS.primary },
    { title: "GPS Valides", value: fmt(pointsVente.filter((p) => p.gps_valid).length),
      sub: `${Math.round((pointsVente.filter((p) => p.gps_valid).length / Math.max(pointsVente.length, 1)) * 100)}%`,
      icon: Navigation, gradient: GRADIENTS.secondary },
    { title: "Éligibles Branding", value: fmt(pointsVente.filter((p) => p.eligibilite_branding).length),
      sub: `${pointsVente.filter((p) => p.brander).length} déjà brandés`,
      icon: Award, gradient: GRADIENTS.success },
    { title: "Score Moyen", value: `${Math.round(pointsVente.reduce((s, p) => s + p.score_global, 0) / Math.max(pointsVente.length, 1))}/100`,
      sub: `${pointsVente.filter((p) => p.score_global >= 80).length} premium`,
      icon: BarChart3, gradient: GRADIENTS.warning },
  ];

  /* ── Stat digitalisation ── */
  const digitStats = MOBILE_OPERATORS.map((op) => ({
    ...op,
    count: pointsVente.filter((p) => p[op.key as OperatorKey]).length,
  }));

  /* ── API calls ── */
  const fetchPoints = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const params: Record<string, any> = {};
      if (filterCommune !== "all")  params.commune  = filterCommune;
      if (filterDistrict !== "all") params.district = filterDistrict;
      if (filterRegion !== "all")   params.region   = filterRegion;
      if (filterType !== "all")     params.type     = filterType;
      if (filterStatus !== "all")   params.status   = filterStatus;
      if (filterNature !== "all")   params.nature   = filterNature;
      if (filterBrander === "brander")     params.branding = "true";
      if (filterBrander === "non_brander") params.branding = "false";
      const res = await apiService.getPointsVenteAnalytics(params);
      if (!res.ok) throw new Error("Erreur chargement Distributeurs");
      setPointsVente(await res.json());
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }, [filterCommune, filterDistrict, filterRegion, filterType, filterStatus, filterNature, filterBrander]);

  useEffect(() => { fetchPoints(); }, [fetchPoints]);

  const fetchPointDetail = useCallback(async (id: number) => {
    try {
      const res  = await apiService.getPointVenteDetail(id);
      if (!res.ok) throw new Error("Erreur chargement détail");
      const data: PointOfSale = await res.json();
      setSelectedPoint(data);
      setDetailPhotos(data.photos || []);
    } catch (err: any) { setError(err.message); }
  }, []);

  const uploadPhotosForPOS = async (posId: number, photos: PhotoUploadItem[]) => {
    const byType: Record<string, PhotoUploadItem[]> = {};
    photos.forEach((p) => { if (!byType[p.type]) byType[p.type] = []; byType[p.type].push(p); });
    for (const [type, items] of Object.entries(byType)) {
      const fd = new FormData();
      items.forEach((item) => fd.append("images", item.file));
      fd.append("type", type);
      const caption = items.find((i) => i.caption)?.caption || "";
      if (caption) fd.append("caption", caption);
      const res = await apiService.addPhotosToPointVente(posId, fd);
      if (!res.ok) throw new Error(`Erreur upload photos (${type})`);
    }
  };

  /* ── CRUD ── */
  const handleAddPoint = async () => {
    try {
      setActionLoading(true);
      const fd = new FormData();
      const skipKeys = ["avatar", "branding_image"];
      (Object.keys(newPoint) as Array<keyof typeof newPoint>).forEach((key) => {
        if (skipKeys.includes(key)) return;
        const val = newPoint[key];
        if (val !== "" && val !== null && val !== undefined) {
          // Booléens (moov, orange, mtn, wave, brander, grande_voie)
          if (typeof val === "boolean") { fd.append(key, val ? "true" : "false"); }
          else { fd.append(key, String(val)); }
        }
      });
      if (avatarFile)        fd.append("avatar",         avatarFile);
      if (brandingImageFile) fd.append("branding_image", brandingImageFile);
      const res = await apiService.createPointVenteFormData(fd);
      if (!res.ok) throw new Error("Erreur ajout Distributeur");
      const created: PointOfSale = await res.json();
      if (addPhotos.length > 0) await uploadPhotosForPOS(created.id, addPhotos);
      setPointsVente((prev) => [{ ...created, photos_count: addPhotos.length }, ...prev]);
      setShowAddModal(false); setNewPoint(emptyForm());
      setAvatarFile(null); setBrandingImageFile(null); setAddPhotos([]);
    } catch (err: any) { setError(err.message); }
    finally { setActionLoading(false); }
  };

  const handleUpdatePoint = async () => {
    if (!editingPoint) return;
    try {
      setActionLoading(true);
      const fd = new FormData();
      const fields: (keyof PointOfSale)[] = [
        "name","owner","phone","email","address","type","status","nature",
        "district","region","commune","quartier","latitude","longitude",
        "registration_date","brander","marque_brander",
        "visibilite","accessibilite","affluence","digitalisation",
        // ── Opérateurs mobiles ──
        "moov","orange","mtn","wave",
        "grande_voie","agent_name","date_collecte",
        "monthly_turnover","monthly_orders",
        "nb_concurrents","classe_quartier","anciennete_annees","facade_metres",
      ];
      fields.forEach((key) => {
        const val = editingPoint[key];
        if (val !== null && val !== undefined) {
          if (typeof val === "boolean") { fd.append(key, val ? "true" : "false"); }
          else { fd.append(key, String(val)); }
        }
      });
      if (!editingPoint.brander) fd.set("marque_brander", "");
      if (avatarFile)        fd.append("avatar",         avatarFile);
      if (brandingImageFile) fd.append("branding_image", brandingImageFile);
      const res = await apiService.patchPointVente(editingPoint.id, fd);
      if (!res.ok) throw new Error("Erreur mise à jour");
      const updated: PointOfSale = await res.json();
      if (editPhotos.length > 0) await uploadPhotosForPOS(updated.id, editPhotos);
      setPointsVente((prev) => prev.map((p) => p.id === updated.id
        ? { ...updated, photos_count: (updated.photos_count || 0) + editPhotos.length } : p));
      setEditingPoint(null); setAvatarFile(null); setBrandingImageFile(null); setEditPhotos([]);
    } catch (err: any) { setError(err.message); }
    finally { setActionLoading(false); }
  };

  const handleDeletePoint = async (id: number) => {
    if (!window.confirm("Supprimer ce Distributeur ?")) return;
    try {
      setActionLoading(true);
      const res = await apiService.deletePointVenteById(id);
      if (!res.ok) throw new Error("Erreur suppression");
      setPointsVente((prev) => prev.filter((p) => p.id !== id));
      if (selectedPoint?.id === id) setSelectedPoint(null);
    } catch (err: any) { setError(err.message); }
    finally { setActionLoading(false); }
  };

  const handleUploadPhotosModal = async () => {
    if (!photosModalPoint || photosModalItems.length === 0) return;
    try {
      setPhotosUploading(true);
      await uploadPhotosForPOS(photosModalPoint.id, photosModalItems);
      await fetchPointDetail(photosModalPoint.id);
      setPhotosModalItems([]); setShowPhotosModal(false);
      setPointsVente((prev) => prev.map((p) =>
        p.id === photosModalPoint.id ? { ...p, photos_count: (p.photos_count || 0) + photosModalItems.length } : p));
    } catch (err: any) { setError(err.message); }
    finally { setPhotosUploading(false); }
  };

  const handleDeletePhoto = async (posId: number, photoId: number) => {
    try {
      const res = await apiService.deletePhotoFromPointVente(posId, photoId);
      if (!res.ok) throw new Error("Erreur suppression photo");
      setDetailPhotos((prev) => prev.filter((p) => p.id !== photoId));
      setPointsVente((prev) => prev.map((p) =>
        p.id === posId ? { ...p, photos_count: Math.max(0, (p.photos_count || 1) - 1) } : p));
      if (selectedPoint?.id === posId) {
        setSelectedPoint((prev) => prev ? { ...prev,
          photos_count: Math.max(0, (prev.photos_count || 1) - 1),
          photos: (prev.photos || []).filter((ph) => ph.id !== photoId) } : null);
      }
    } catch (err: any) { setError(err.message); }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const r = ev.target?.result as string;
      if (showAddModal)  setNewPoint((p) => ({ ...p, avatar: r }));
      if (editingPoint)  setEditingPoint((p) => p && { ...p, avatar: r });
    };
    reader.readAsDataURL(file);
  };

  const handleBrandingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setBrandingImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const r = ev.target?.result as string;
      if (showAddModal)  setNewPoint((p) => ({ ...p, branding_image: r }));
      if (editingPoint)  setEditingPoint((p) => p && { ...p, branding_image: r });
    };
    reader.readAsDataURL(file);
  };

  const getCurrentLocation = () => {
    setIsFetchingLocation(true); setLocationError(null);
    if (!navigator.geolocation) { setLocationError("Non supporté"); setIsFetchingLocation(false); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setNewPoint((p) => ({ ...p, latitude: pos.coords.latitude, longitude: pos.coords.longitude })); setIsFetchingLocation(false); },
      (err) => { setLocationError("Erreur : " + err.message); setIsFetchingLocation(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const downloadData = () => {
    const headers = ["Nom","Propriétaire","Téléphone","Email","Adresse","Type","Nature","Statut","District","Région","Commune","Potentiel","Score global","GPS","Brandé","Marque","Orange","MTN","Moov","Wave","Digitalisation","Agent","Concurrents","Classe quartier","Ancienneté (ans)","Façade (m)","Date inscription","Date création"];
    let csv = headers.join(",") + "\n";
    filteredPoints.forEach((p) => {
      const digit = calcDigitalisation(p);
      csv += [p.name,p.owner,p.phone,p.email,p.address,getTypeLabel(p.type),getNatureLabel(p.nature),getStatusLabel(p.status),
        p.district,p.region,p.commune,p.potentiel_label,p.score_global,
        p.gps_valid?"Oui":"Non",p.brander?"Oui":"Non",p.marque_brander||"",
        p.orange?"Oui":"Non",p.mtn?"Oui":"Non",p.moov?"Oui":"Non",p.wave?"Oui":"Non",digit,
        p.agent_name||"",p.nb_concurrents,p.classe_quartier,p.anciennete_annees,p.facade_metres,
        p.registration_date||"",p.created_at||""]
        .map((f) => `"${f}"`).join(",") + "\n";
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    a.download = "distributeurs.csv"; a.click();
  };

  const resetFilters = () => {
    setSearchTerm(""); setFilterStatus("all"); setFilterType("all"); setFilterNature("all");
    setFilterDistrict("all"); setFilterRegion("all"); setFilterCommune("all");
    setFilterBrander("all"); setFilterMarqueBrander("all");
    setFilterOperator("all"); setFilterDigitMin(0);
    setFilterRegDateFrom(""); setFilterRegDateTo("");
    setFilterCreatedAtFrom(""); setFilterCreatedAtTo("");
    setCurrentPage(1);
  };

  const isAddFormValid = Boolean(
    newPoint.name && newPoint.owner && newPoint.phone && newPoint.email &&
    newPoint.address && newPoint.district && newPoint.commune && newPoint.nature &&
    newPoint.registration_date && !(newPoint.brander && !newPoint.marque_brander)
  );

  const isEditFormValid = Boolean(
    editingPoint?.name && editingPoint?.owner && editingPoint?.phone &&
    editingPoint?.email && editingPoint?.address && editingPoint?.district &&
    editingPoint?.commune && editingPoint?.nature && editingPoint?.registration_date &&
    !(editingPoint?.brander && !editingPoint?.marque_brander)
  );

  /* ── Avatar upload ── */
  const AvatarUpload = ({ src, inputId }: { src: string; inputId: string }) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 8 }}>
      <div className="group relative" style={{ width: 100, height: 100, borderRadius: 14,
        overflow: "hidden", border: `2px dashed ${COLORS.blueLight}`, background: COLORS.grayLight, cursor: "pointer" }}>
        {src
          ? <img src={src} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", color: COLORS.gray }}>
              <ImageIcon size={26} /><span style={{ fontSize: 10, marginTop: 4, fontWeight: 600 }}>Photo</span>
            </div>}
        <label htmlFor={inputId} className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.5)", cursor: "pointer" }}>
          <Upload size={18} color={COLORS.white} />
        </label>
        <input id={inputId} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
      </div>
      <p style={{ fontSize: 10, color: COLORS.gray, marginTop: 4, fontWeight: 600 }}>JPG, PNG · max 2MB</p>
    </div>
  );

  const BrandingUpload = ({ src, inputId }: { src: string | null; inputId: string }) => (
    <div style={{ border: `2px dashed ${COLORS.blueLight}`, borderRadius: 10, padding: 10,
      background: COLORS.grayLight, transition: "border 0.15s" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = COLORS.blue; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = COLORS.blueLight; }}>
      <label htmlFor={inputId} style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {src ? (
          <><img src={src} alt="branding" style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 8, marginBottom: 4 }} />
            <span style={{ fontSize: 11, color: COLORS.blueDark, fontWeight: 700 }}>Modifier l'image</span></>
        ) : (
          <div style={{ padding: 12, textAlign: "center" }}>
            <Upload size={18} color={COLORS.gray} style={{ margin: "0 auto 4px" }} />
            <span style={{ fontSize: 11, color: COLORS.grayMuted, fontWeight: 600 }}>Ajouter une image de marque</span>
            <p style={{ fontSize: 10, color: COLORS.gray, marginTop: 2 }}>JPG, PNG · max 2MB</p>
          </div>
        )}
      </label>
      <input id={inputId} type="file" accept="image/*" onChange={handleBrandingChange} className="hidden" />
    </div>
  );

  /* ── Terrain fields ── */
  const renderTerrainFields = (
    data: { nb_concurrents: string; classe_quartier: string; anciennete_annees: number; facade_metres: number },
    onChange: (u: any) => void
  ) => (
    <div style={{ background: GRADIENTS.card, borderRadius: 12, padding: 14, border: `1px solid ${COLORS.blueLight}` }}>
      <SectionTitle icon={Target} label="Données terrain (Huff / Hotelling / Applebaum)" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
        <FormSelect label="Concurrents à 300m" value={data.nb_concurrents}
          onChange={(v) => onChange({ nb_concurrents: v })} options={nbConcurrentsOptions} />
        <FormSelect label="Classe socio-éco du quartier" value={data.classe_quartier}
          onChange={(v) => onChange({ classe_quartier: v })} options={classeQuartierOptions} />
        <FormInput label="Ancienneté (années)" value={data.anciennete_annees}
          onChange={(v) => onChange({ anciennete_annees: parseInt(v) || 0 })} type="number" placeholder="0" />
        <FormInput label="Façade visible (mètres)" value={data.facade_metres}
          onChange={(v) => onChange({ facade_metres: parseFloat(v) || 0 })} type="number" placeholder="0.0" />
      </div>
    </div>
  );

  /* ── Base form fields ── */
  const renderBaseFields = (
    data: typeof newPoint | PointOfSale,
    onChange: (u: any) => void,
    showStatus = false
  ) => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      {/* Left */}
      <div className="space-y-4">
        <SectionTitle icon={User} label="Informations de base" />

        {/* ── Nature du point (onglets) ── */}
        <div>
          <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: COLORS.gray,
            textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Nature du point *</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {NATURE_OPTIONS.map((n) => {
              const active = (data as any).nature === n.value;
              const Icon = n.icon;
              return (
                <button key={n.value} type="button" onClick={() => onChange({ nature: n.value })}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                    padding: "10px 6px", borderRadius: 10,
                    border: `2px solid ${active ? n.color : COLORS.blueLight}`,
                    background: active ? n.bg : COLORS.grayLight,
                    cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
                    transform: active ? "scale(1.02)" : "scale(1)",
                  }}>
                  <Icon size={17} color={active ? n.color : COLORS.gray} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: active ? n.color : COLORS.gray, textAlign: "center", lineHeight: 1.2 }}>
                    {n.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <FormInput label="Nom du Distributeur *" value={data.name} onChange={(v) => onChange({ name: v })} placeholder="Ex: Supermarché Central" />
        <FormInput label="Propriétaire *" value={data.owner} onChange={(v) => onChange({ owner: v })} placeholder="Ex: Jean Kouadio" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <FormInput label="Téléphone *" type="tel" value={data.phone} onChange={(v) => onChange({ phone: v })} placeholder="+225 XX XX" />
          <FormInput label="Email *" type="email" value={data.email} onChange={(v) => onChange({ email: v })} placeholder="email@ex.com" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <FormSelect label="Type *" value={data.type} onChange={(v) => onChange({ type: v })} options={pointTypes} />
          {showStatus
            ? <FormSelect label="Statut *" value={(data as PointOfSale).status} onChange={(v) => onChange({ status: v })} options={statusOptions} />
            : <FormInput label="Date inscription *" type="date" value={data.registration_date} onChange={(v) => onChange({ registration_date: v })} />}
        </div>
        {showStatus && <FormInput label="Date inscription *" type="date" value={data.registration_date} onChange={(v) => onChange({ registration_date: v })} />}

        {showStatus && (
          <div style={{ padding: "10px 14px", background: GRADIENTS.card, borderRadius: 10,
            border: `1px solid ${COLORS.blueLight}`, display: "flex", alignItems: "center", gap: 8 }}>
            <Gauge size={14} color={COLORS.blue} />
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: COLORS.gray, textTransform: "uppercase", letterSpacing: "0.06em" }}>Potentiel commercial (calculé)</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: COLORS.grayDark, marginTop: 2 }}>
                {potentielLabels[(data as PointOfSale).potentiel] || "—"}
              </p>
            </div>
            <span style={{ marginLeft: "auto", fontSize: 10, padding: "2px 8px", borderRadius: 20,
              background: GRADIENTS.secondary, color: COLORS.white, fontWeight: 700 }}>Auto</span>
          </div>
        )}

        <div style={{ background: GRADIENTS.card, borderRadius: 12, padding: 14, border: `1px solid ${COLORS.blueLight}` }}>
          <SectionTitle icon={Activity} label="Indicateurs terrain (0-100)" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
            <ScoreInput label="Visibilité"    value={data.visibilite || 0}    onChange={(v) => onChange({ visibilite: v })} />
            <ScoreInput label="Accessibilité" value={data.accessibilite || 0} onChange={(v) => onChange({ accessibilite: v })} />
            <ScoreInput label="Affluence"     value={data.affluence || 0}     onChange={(v) => onChange({ affluence: v })} />
            {/* Digitalisation : lecture seule, calculée des opérateurs */}
            <div>
              <label style={{ display: "block", fontSize: 10, color: COLORS.gray, marginBottom: 4, fontWeight: 700 }}>
                Digitalisation (auto)
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1, height: 6, borderRadius: 3, background: COLORS.blueLight, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 3,
                    background: GRADIENTS.secondary,
                    width: `${calcDigitalisation(data as any)}%`,
                    transition: "width 0.3s",
                  }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.grayDark, minWidth: 28, textAlign: "right" }}>
                  {calcDigitalisation(data as any)}
                </span>
              </div>
              <p style={{ fontSize: 9, color: COLORS.gray, marginTop: 2, fontWeight: 500 }}>Calculé depuis les opérateurs</p>
            </div>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 10, cursor: "pointer" }}>
            <input type="checkbox" checked={data.grande_voie || false}
              onChange={(e) => onChange({ grande_voie: e.target.checked })}
              style={{ accentColor: COLORS.blue }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.grayDark }}>PDV sur grande voie</span>
          </label>
        </div>

        {/* ── Opérateurs mobiles ── */}
        <OperatorTogglesField
          data={{
            moov:   (data as any).moov   || false,
            orange: (data as any).orange || false,
            mtn:    (data as any).mtn    || false,
            wave:   (data as any).wave   || false,
          }}
          onChange={onChange}
        />

        {renderTerrainFields(
          {
            nb_concurrents:    (data as any).nb_concurrents    || "aucun",
            classe_quartier:   (data as any).classe_quartier   || "populaire",
            anciennete_annees: (data as any).anciennete_annees || 0,
            facade_metres:     (data as any).facade_metres     || 0,
          },
          onChange
        )}
      </div>

      {/* Right */}
      <div className="space-y-4">
        <SectionTitle icon={MapPin} label="Localisation" />
        <GeoSelector
          districtNom={(data as any).district || ""}
          villeNom={(data as any).commune || ""}
          quartierNom={(data as any).quartier || ""}
          onDistrictChange={(nom) => onChange({ district: nom, region: nom })}
          onVilleChange={(nom) => onChange({ commune: nom })}
          onQuartierChange={(nom) => onChange({ quartier: nom })}
        />

        <div style={{ background: GRADIENTS.card, borderRadius: 12, padding: 14, border: `1px solid ${COLORS.blueLight}` }}>
          <SectionTitle icon={Award} label="Branding" />
          <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
            background: COLORS.white, borderRadius: 8, border: `1px solid ${COLORS.blueLight}`,
            cursor: "pointer", marginTop: 10, marginBottom: 10 }}>
            <input type="checkbox" checked={data.brander}
              onChange={(e) => onChange({ brander: e.target.checked, marque_brander: e.target.checked ? data.marque_brander : "", branding_image: e.target.checked ? (data.branding_image || "") : "" })}
              style={{ accentColor: COLORS.blue }} />
            <div>
              <span style={{ fontWeight: 700, color: COLORS.grayDark, fontSize: 13 }}>Distributeur brandé</span>
              <p style={{ fontSize: 11, color: COLORS.gray, fontWeight: 500 }}>Représente une marque spécifique</p>
            </div>
          </label>
          {data.brander && (
            <div className="space-y-3">
              <FormInput label="Marque *" value={data.marque_brander || ""} onChange={(v) => onChange({ marque_brander: v })} placeholder="Ex: Coca-Cola, Nestlé..." />
              <BrandingUpload src={data.branding_image || null} inputId={showStatus ? "branding-edit" : "branding-add"} />
            </div>
          )}
        </div>

        <div style={{ background: GRADIENTS.secondary, borderRadius: 12, padding: 14, border: `1px solid ${COLORS.blueLight}` }}>
          <SectionTitle icon={Target} label="Coordonnées GPS" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "10px 0" }}>
            {[{ l: "Latitude", k: "latitude", ph: "5.3197" }, { l: "Longitude", k: "longitude", ph: "-4.0267" }].map(({ l, k, ph }) => (
              <div key={k}>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: COLORS.grayMuted,
                  textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{l}</label>
                <input type="number" step="any" value={(data as any)[k] ?? ""}
                  onChange={(e) => onChange({ [k]: parseFloat(e.target.value) || 0 })} placeholder={ph}
                  style={{ width: "100%", padding: "7px 10px", border: `1px solid ${COLORS.blueLight}`, borderRadius: 8,
                    fontSize: 12, background: COLORS.white, outline: "none", fontFamily: "inherit", color: COLORS.grayDark }} />
              </div>
            ))}
          </div>
          {!showStatus && (
            <button type="button" onClick={getCurrentLocation} disabled={isFetchingLocation}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                gap: 7, padding: "9px", borderRadius: 9, background: GRADIENTS.primary, color: COLORS.white,
                fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer",
                opacity: isFetchingLocation ? 0.6 : 1, fontFamily: "inherit" }}>
              {isFetchingLocation ? <><Loader2 size={13} className="animate-spin" /> Localisation...</> : <><Navigation size={13} /> Ma position actuelle</>}
            </button>
          )}
          {locationError && (
            <p style={{ fontSize: 11, color: COLORS.red, marginTop: 5, display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
              <AlertCircle size={11} /> {locationError}
            </p>
          )}
        </div>

        <div style={{ background: GRADIENTS.card, borderRadius: 12, padding: 14, border: `1px solid ${COLORS.blueLight}` }}>
          <SectionTitle icon={Users} label="Collecte terrain" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
            <FormInput label="Nom de l'agent" value={(data as any).agent_name || ""} onChange={(v) => onChange({ agent_name: v })} placeholder="Nom agent" />
            <FormInput label="Date collecte" type="date" value={(data as any).date_collecte || ""} onChange={(v) => onChange({ date_collecte: v })} />
          </div>
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #F2F6FA 0%, #E8F0F5 100%)" }}>
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "16px 20px" }} className="space-y-5">

        {/* Error */}
        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
            background: GRADIENTS.danger, border: `1px solid ${COLORS.red}`, borderRadius: 12,
            fontSize: 13, color: COLORS.white }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, fontWeight: 600 }}>{error}</span>
            <button onClick={() => setError(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>
              <X size={14} color={COLORS.white} />
            </button>
          </div>
        )}

        {/* ══════════════ LISTE VIEW ══════════════ */}
        {activeView === "liste" && (
          <>
            {/* Page header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <div style={{ width: 4, height: 24, background: GRADIENTS.primary, borderRadius: 2 }} />
                  <h1 style={{ fontSize: 20, fontWeight: 700, color: COLORS.grayDark }}>Gestion des Distributeurs</h1>
                </div>
                <p style={{ fontSize: 12, color: COLORS.grayMuted, paddingLeft: 14, fontWeight: 500 }}>Réseau commercial · Scores A/D/E · Éligibilités terrain</p>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <button onClick={() => setActiveView("carte")}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9,
                    border: `1px solid ${COLORS.blueLight}`, background: COLORS.grayLight, color: COLORS.grayDark,
                    fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = COLORS.white; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = COLORS.grayLight; }}>
                  <Map size={14} /> Vue Carte
                </button>
                <button onClick={() => setShowAddModal(true)}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9,
                    background: GRADIENTS.primary, color: COLORS.white, fontSize: 12, fontWeight: 700,
                    border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                  <Plus size={14} /> Nouveau Distributeur
                </button>
                <button onClick={downloadData}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9,
                    background: GRADIENTS.secondary, color: COLORS.white, fontSize: 12, fontWeight: 700,
                    border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                  <Download size={14} /> Exporter CSV
                </button>
              </div>
            </div>

            {/* ── Onglets Nature du point ── */}
            <div style={{ background: COLORS.white, border: `1px solid ${COLORS.blueLight}`, borderRadius: 14, overflow: "hidden" }}>
              <GradientStripe height={2} />
              <div style={{ padding: "14px 16px" }}>
                <NatureTabs
                  value={filterNature}
                  onChange={(v) => { setFilterNature(v); setCurrentPage(1); }}
                  counts={natureCounts}
                />
              </div>
            </div>

            {/* Stats Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
              {statsCards.map((s, i) => (
                <div key={i} style={{ background: COLORS.white, border: `1px solid ${COLORS.blueLight}`,
                  borderRadius: 14, overflow: "hidden", transition: "transform 0.2s, box-shadow 0.2s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 30px rgba(0,0,0,0.1)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
                  <GradientStripe height={3} />
                  <div style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                      <div>
                        <p style={{ fontSize: 10, color: COLORS.gray, fontWeight: 700, textTransform: "uppercase",
                          letterSpacing: "0.07em", marginBottom: 5 }}>{s.title}</p>
                        <p style={{ fontSize: 22, fontWeight: 700, color: COLORS.grayDark }}>{s.value}</p>
                        <p style={{ fontSize: 11, color: COLORS.blueDark, fontWeight: 700, marginTop: 3,
                          display: "flex", alignItems: "center", gap: 3 }}>
                          <TrendingUp size={10} /> {s.sub}
                        </p>
                      </div>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: s.gradient,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <s.icon size={18} color={COLORS.white} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Mini stat digitalisation ── */}
            <div style={{ background: COLORS.white, border: `1px solid ${COLORS.blueLight}`, borderRadius: 14, overflow: "hidden" }}>
              <GradientStripe height={2} />
              <div style={{ padding: "12px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <Smartphone size={13} color={COLORS.blue} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.grayDark, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                    Couverture paiements mobiles
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                  {digitStats.map((op) => {
                    const pct = Math.round((op.count / Math.max(pointsVente.length, 1)) * 100);
                    const { Logo } = op;
                    return (
                      <div key={op.key} style={{ padding: "10px 12px", borderRadius: 10,
                        background: op.bg, border: `1px solid ${op.color}44`,
                        cursor: "pointer", transition: "transform 0.15s",
                        outline: filterOperator === op.key ? `2px solid ${op.color}` : "none" }}
                        onClick={() => setFilterOperator(filterOperator === op.key ? "all" : op.key as OperatorKey)}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1.02)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                          <Logo size={28} active={true} />
                          <span style={{ fontSize: 10, fontWeight: 700, color: op.color }}>{pct}%</span>
                        </div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: op.color }}>{op.label}</p>
                        <p style={{ fontSize: 10, color: COLORS.gray, fontWeight: 600, marginTop: 2 }}>{op.count} PDV</p>
                        <div style={{ marginTop: 6, height: 3, borderRadius: 2, background: COLORS.blueLight + "44", overflow: "hidden" }}>
                          <div style={{ height: "100%", borderRadius: 2, background: op.color, width: `${pct}%`, transition: "width 0.5s" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ═══ Filters ═══ */}
            <div style={{ background: COLORS.white, border: `1px solid ${COLORS.blueLight}`, borderRadius: 14, overflow: "hidden" }}>
              <GradientStripe height={2} />
              <div style={{ padding: 16 }} className="space-y-3">

                {/* Row 1 : search + dropdowns */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                  <div style={{ position: "relative", flex: 1, maxWidth: 300 }}>
                    <Search size={14} color={COLORS.gray} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
                    <input type="text" placeholder="Rechercher..." value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                      style={{ width: "100%", paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                        border: `1px solid ${COLORS.blueLight}`, borderRadius: 9, fontSize: 12, background: COLORS.grayLight,
                        outline: "none", fontFamily: "inherit", color: COLORS.grayDark }} />
                  </div>
                  <FilterSelect value={filterStatus} onChange={(v) => { setFilterStatus(v); setCurrentPage(1); }}>
                    <option value="all">Tous statuts</option>
                    {statusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </FilterSelect>
                  <FilterSelect value={filterType} onChange={(v) => { setFilterType(v); setCurrentPage(1); }}>
                    <option value="all">Tous types</option>
                    {pointTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </FilterSelect>
                  <FilterSelect value={filterNature} onChange={(v) => { setFilterNature(v as any); setCurrentPage(1); }}>
                    <option value="all">Toutes natures</option>
                    {NATURE_OPTIONS.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
                  </FilterSelect>
                  <FilterSelect value={filterBrander} onChange={(v) => { setFilterBrander(v); setCurrentPage(1); }}>
                    {branderOptions.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                  </FilterSelect>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: COLORS.grayMuted }}>
                    <Filter size={13} />
                    <span style={{ fontWeight: 700, color: COLORS.grayDark }}>{filteredPoints.length}</span> résultats
                  </div>
                  {(searchTerm || filterStatus !== "all" || filterType !== "all" || filterNature !== "all" || filterBrander !== "all" || hasDateFilters || hasOperatorFilters) && (
                    <button onClick={resetFilters}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
                        borderRadius: 8, background: GRADIENTS.danger, color: COLORS.white,
                        fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                      <X size={11} /> Réinitialiser tout
                    </button>
                  )}
                </div>

                {/* Row 2 : filtres opérateurs mobiles */}
                <div style={{
                  paddingTop: 10, borderTop: `1px dashed ${COLORS.blueLight}`,
                  display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Smartphone size={13} color={COLORS.blue} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.grayMuted,
                      textTransform: "uppercase", letterSpacing: "0.06em" }}>Opérateurs</span>
                  </div>
                  {/* Filtre par opérateur */}
                  <div style={{ display: "flex", gap: 6 }}>
                    {(["all", ...MOBILE_OPERATORS.map((o) => o.key)] as const).map((key) => {
                      const op = MOBILE_OPERATORS.find((o) => o.key === key);
                      const isActive = filterOperator === key;
                      const Logo = op?.Logo;
                      return (
                        <button key={key} onClick={() => { setFilterOperator(key as any); setCurrentPage(1); }}
                          style={{
                            display: "flex", alignItems: "center", gap: 5,
                            padding: "5px 11px", borderRadius: 20,
                            border: `1.5px solid ${isActive ? (op?.color || COLORS.blue) : COLORS.blueLight}`,
                            background: isActive ? (op?.bg || "rgba(26,143,209,0.08)") : COLORS.grayLight,
                            fontSize: 11, fontWeight: 700,
                            color: isActive ? (op?.color || COLORS.blue) : COLORS.grayMuted,
                            cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
                          }}>
                          {Logo ? <Logo size={18} active={isActive} /> : null}
                          {op ? op.label : "Tous"}
                        </button>
                      );
                    })}
                  </div>
                  {/* Filtre score digitalisation minimum */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 8 }}>
                    <Wifi size={12} color={COLORS.gray} />
                    <span style={{ fontSize: 11, color: COLORS.grayMuted, fontWeight: 600 }}>Digit. min :</span>
                    {[0, 25, 50, 75, 100].map((lvl) => (
                      <button key={lvl} onClick={() => { setFilterDigitMin(lvl); setCurrentPage(1); }}
                        style={{
                          padding: "4px 9px", borderRadius: 8,
                          border: `1.5px solid ${filterDigitMin === lvl ? COLORS.blue : COLORS.blueLight}`,
                          background: filterDigitMin === lvl ? COLORS.blue : COLORS.grayLight,
                          fontSize: 10, fontWeight: 700,
                          color: filterDigitMin === lvl ? COLORS.white : COLORS.grayMuted,
                          cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
                        }}>
                        {lvl === 0 ? "Tous" : `≥${lvl}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Row 3 : date range filters */}
                <div style={{
                  display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-start",
                  paddingTop: 10, borderTop: `1px dashed ${COLORS.blueLight}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 12, minWidth: 90 }}>
                    <Calendar size={13} color={COLORS.blue} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.grayMuted,
                      textTransform: "uppercase", letterSpacing: "0.06em" }}>Dates</span>
                  </div>
                  <DateRangeFilter label="Date d'inscription" icon={Calendar} color={GRADIENTS.primary}
                    fromValue={filterRegDateFrom} toValue={filterRegDateTo}
                    onFromChange={(v) => { setFilterRegDateFrom(v); setCurrentPage(1); }}
                    onToChange={(v) => { setFilterRegDateTo(v); setCurrentPage(1); }} />
                  <DateRangeFilter label="Date de création" icon={Clock} color={GRADIENTS.secondary}
                    fromValue={filterCreatedAtFrom} toValue={filterCreatedAtTo}
                    onFromChange={(v) => { setFilterCreatedAtFrom(v); setCurrentPage(1); }}
                    onToChange={(v) => { setFilterCreatedAtTo(v); setCurrentPage(1); }} />

                  {/* Badges filtres actifs */}
                  {(hasDateFilters || hasOperatorFilters || filterNature !== "all") && (
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, paddingTop: 12 }}>
                      {filterNature !== "all" && (() => {
                        const n = getNatureOpts(filterNature);
                        const Icon = n.icon;
                        return (
                          <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 700,
                            background: n.bg, color: n.color, border: `1px solid ${n.color}44`,
                            display: "flex", alignItems: "center", gap: 4 }}>
                            <Icon size={10} /> {n.label}
                            <button onClick={() => setFilterNature("all")}
                              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                              <X size={9} color={n.color} />
                            </button>
                          </span>
                        );
                      })()}
                      {filterOperator !== "all" && (() => {
                        const op = MOBILE_OPERATORS.find((o) => o.key === filterOperator);
                        const Logo = op?.Logo;
                        return op ? (
                          <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 700,
                            background: op.bg, color: op.color, border: `1px solid ${op.color}44`,
                            display: "flex", alignItems: "center", gap: 4 }}>
                            {Logo && <Logo size={14} active={true} />}
                            {op.label} actif
                            <button onClick={() => setFilterOperator("all")}
                              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                              <X size={9} color={op.color} />
                            </button>
                          </span>
                        ) : null;
                      })()}
                      {filterDigitMin > 0 && (
                        <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 700,
                          background: GRADIENTS.secondary, color: COLORS.white,
                          display: "flex", alignItems: "center", gap: 4 }}>
                          <Wifi size={9} /> Digit. ≥ {filterDigitMin}%
                          <button onClick={() => setFilterDigitMin(0)}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                            <X size={9} color={COLORS.white} />
                          </button>
                        </span>
                      )}
                      {filterRegDateFrom && (
                        <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 700,
                          background: GRADIENTS.primary, color: COLORS.white, display: "flex", alignItems: "center", gap: 4 }}>
                          <Calendar size={9} /> Inscription ≥ {filterRegDateFrom}
                        </span>
                      )}
                      {filterRegDateTo && (
                        <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 700,
                          background: GRADIENTS.primary, color: COLORS.white, display: "flex", alignItems: "center", gap: 4 }}>
                          <Calendar size={9} /> Inscription ≤ {filterRegDateTo}
                        </span>
                      )}
                      {filterCreatedAtFrom && (
                        <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 700,
                          background: GRADIENTS.secondary, color: COLORS.white, display: "flex", alignItems: "center", gap: 4 }}>
                          <Clock size={9} /> Création ≥ {filterCreatedAtFrom}
                        </span>
                      )}
                      {filterCreatedAtTo && (
                        <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 700,
                          background: GRADIENTS.secondary, color: COLORS.white, display: "flex", alignItems: "center", gap: 4 }}>
                          <Clock size={9} /> Création ≤ {filterCreatedAtTo}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 240,
                background: COLORS.white, border: `1px solid ${COLORS.blueLight}`, borderRadius: 14 }}>
                <div style={{ textAlign: "center" }}>
                  <Loader2 size={30} color={COLORS.blue} className="animate-spin" style={{ margin: "0 auto 10px" }} />
                  <p style={{ color: COLORS.grayMuted, fontSize: 13, fontWeight: 600 }}>Chargement des Distributeurs...</p>
                </div>
              </div>
            ) : (
              <div style={{ background: COLORS.white, border: `1px solid ${COLORS.blueLight}`, borderRadius: 14, overflow: "hidden" }}>
                <GradientStripe height={2} />
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: COLORS.grayLight, borderBottom: `1px solid ${COLORS.blueLight}` }}>
                        {["Distributeur","Nature","Contact","Type / Potentiel","Statut","Score A·D·E","Terrain","Digital","Éligibilités","Photos","Actions"].map((h) => (
                          <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10,
                            fontWeight: 700, color: COLORS.grayMuted, textTransform: "uppercase",
                            letterSpacing: "0.07em", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((point) => {
                        const badge  = badgeFromScore(point.score_global);
                        const sOpts  = getStatusOpts(point.status);
                        const digit  = calcDigitalisation(point);
                        const activeOps = getActiveOperators(point);
                        return (
                          <tr key={point.id} style={{ borderBottom: `1px solid ${COLORS.grayLight}`, transition: "all 0.2s" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = COLORS.grayLight; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>

                            {/* Distributeur */}
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 42, height: 42, borderRadius: 10, overflow: "hidden",
                                  background: COLORS.grayLight, display: "flex", alignItems: "center",
                                  justifyContent: "center", flexShrink: 0, border: `1px solid ${COLORS.blueLight}` }}>
                                  {point.avatar
                                    ? <img src={point.avatar} alt={point.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                    : <Store size={16} color={COLORS.blueDark} />}
                                </div>
                                <div>
                                  <p style={{ fontWeight: 700, color: COLORS.grayDark, lineHeight: 1.3 }}>{point.name}</p>
                                  <p style={{ fontSize: 10, color: COLORS.grayMuted, marginTop: 2, display: "flex", alignItems: "center", gap: 3 }}>
                                    <MapPin size={10} />{point.commune}{point.quartier ? ` · ${point.quartier}` : ""}
                                  </p>
                                  {point.brander && point.marque_brander && (
                                    <span style={{ fontSize: 10, color: COLORS.purple, fontWeight: 700, marginTop: 2, display: "flex", alignItems: "center", gap: 3 }}>
                                      <Award size={9} />{point.marque_brander}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Nature */}
                            <td style={{ padding: "12px 16px" }}>
                              <NatureBadge nature={point.nature} size="sm" />
                            </td>

                            {/* Contact */}
                            <td style={{ padding: "12px 16px" }}>
                              <p style={{ fontWeight: 700, color: COLORS.grayDark }}>{point.owner}</p>
                              <p style={{ fontSize: 10, color: COLORS.grayMuted, marginTop: 2, display: "flex", alignItems: "center", gap: 3 }}>
                                <Phone size={10} />{point.phone}
                              </p>
                              {point.agent_name && (
                                <p style={{ fontSize: 10, color: COLORS.blueDark, marginTop: 2, display: "flex", alignItems: "center", gap: 3 }}>
                                  <Users size={9} />Agent: {point.agent_name}
                                </p>
                              )}
                            </td>

                            {/* Type */}
                            <td style={{ padding: "12px 16px" }}>
                              <span style={{ display: "inline-block", padding: "3px 8px", borderRadius: 20,
                                fontSize: 10, fontWeight: 700, background: GRADIENTS.secondary,
                                color: COLORS.white, border: `1px solid ${COLORS.blueLight}`, marginBottom: 4 }}>
                                {getTypeLabel(point.type)}
                              </span>
                              <p style={{ fontSize: 10, color: COLORS.grayMuted, fontWeight: 600 }}>
                                {potentielLabels[point.potentiel] || point.potentiel_label}
                              </p>
                            </td>

                            {/* Status */}
                            <td style={{ padding: "12px 16px" }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 9px",
                                borderRadius: 20, fontSize: 10, fontWeight: 700, background: sOpts.bg,
                                color: COLORS.white, border: `1px solid ${sOpts.border}` }}>
                                {getStatusIcon(point.status)}{getStatusLabel(point.status)}
                              </span>
                              <p style={{ fontSize: 10, marginTop: 4, display: "flex", alignItems: "center", gap: 3,
                                color: point.gps_valid ? COLORS.green : COLORS.orange }}>
                                {point.gps_valid ? <><CheckCircle2 size={10} /> GPS OK</> : <><AlertCircle size={10} /> GPS manquant</>}
                              </p>
                            </td>

                            {/* Scores */}
                            <td style={{ padding: "12px 16px" }}>
                              <span style={{ display: "inline-block", padding: "3px 8px", borderRadius: 20,
                                fontSize: 10, fontWeight: 700, background: badge.bg, color: badge.color,
                                border: `1px solid ${badge.border}`, marginBottom: 5 }}>
                                {point.score_global}/100
                              </span>
                              <div style={{ display: "flex", gap: 3 }}>
                                <ScorePill label="A" value={point.score_a} bg={GRADIENTS.primary} />
                                <ScorePill label="D" value={point.score_d} bg={GRADIENTS.secondary} />
                                <ScorePill label="E" value={point.score_e} bg={GRADIENTS.success} />
                              </div>
                            </td>

                            {/* Terrain */}
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                <span style={{ fontSize: 10, color: COLORS.grayMuted, fontWeight: 600 }}>
                                  {nbConcurrentsOptions.find((o) => o.value === point.nb_concurrents)?.label || "—"} conc.
                                </span>
                                <span style={{ fontSize: 10, color: COLORS.grayMuted, fontWeight: 600 }}>
                                  {classeQuartierOptions.find((o) => o.value === point.classe_quartier)?.label || "—"}
                                </span>
                                {point.anciennete_annees > 0 && (
                                  <span style={{ fontSize: 10, color: COLORS.blueDark, fontWeight: 600 }}>{point.anciennete_annees} an(s)</span>
                                )}
                                {point.facade_metres > 0 && (
                                  <span style={{ fontSize: 10, color: COLORS.teal, fontWeight: 600 }}>{point.facade_metres}m façade</span>
                                )}
                              </div>
                            </td>

                            {/* ── NOUVELLE COLONNE : Digital ── */}
                            <td style={{ padding: "12px 16px" }}>
                              {activeOps.length > 0 ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                  <OperatorBadges p={point} size="sm" />
                                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                    <div style={{ flex: 1, height: 3, borderRadius: 2, background: COLORS.blueLight, overflow: "hidden" }}>
                                      <div style={{ height: "100%", background: GRADIENTS.secondary, width: `${digit}%` }} />
                                    </div>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.blueDark, minWidth: 22 }}>{digit}%</span>
                                  </div>
                                </div>
                              ) : (
                                <span style={{ fontSize: 10, color: COLORS.gray, fontWeight: 600 }}>—</span>
                              )}
                            </td>

                            {/* Eligibilities */}
                            <td style={{ padding: "12px 16px" }}>
                              <div className="space-y-1">
                                <EligibilityDot label="Branding"    ok={point.eligibilite_branding} />
                                <EligibilityDot label="Exclusivité" ok={point.eligibilite_exclusivite} />
                                <EligibilityDot label="Activation"  ok={point.eligibilite_activation} />
                              </div>
                            </td>

                            {/* Photos */}
                            <td style={{ padding: "12px 16px" }}>
                              <button onClick={() => { setPhotosModalPoint(point); setPhotosModalItems([]); setShowPhotosModal(true); fetchPointDetail(point.id); }}
                                style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px",
                                  borderRadius: 9, fontSize: 11, fontWeight: 700, cursor: "pointer",
                                  background: (point.photos_count || 0) >= MIN_PHOTOS ? GRADIENTS.success : GRADIENTS.secondary,
                                  color: COLORS.white,
                                  border: `1px solid ${(point.photos_count || 0) >= MIN_PHOTOS ? COLORS.greenLight : COLORS.blueLight}` }}>
                                <Camera size={11} />
                                {point.photos_count || 0}
                                {(point.photos_count || 0) < MIN_PHOTOS && <span>/{MIN_PHOTOS}</span>}
                              </button>
                            </td>

                            {/* Actions */}
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ display: "flex", alignItems: "center" }}>
                                <ActionBtn onClick={() => { fetchPointDetail(point.id); setActiveView("detail"); }} title="Voir" bgHover={COLORS.grayLight}>
                                  <Eye size={14} color={COLORS.blueDark} />
                                </ActionBtn>
                                <ActionBtn onClick={() => { setEditingPoint(point); setAvatarFile(null); setBrandingImageFile(null); setEditPhotos([]); }} title="Modifier" bgHover={COLORS.grayLight}>
                                  <Edit size={14} color={COLORS.blue} />
                                </ActionBtn>
                                <ActionBtn onClick={() => handleDeletePoint(point.id)} title="Supprimer" bgHover={COLORS.grayLight}>
                                  <Trash2 size={14} color={COLORS.red} />
                                </ActionBtn>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {filteredPoints.length === 0 && (
                  <div style={{ textAlign: "center", padding: "48px 24px" }}>
                    <div style={{ width: 52, height: 52, background: COLORS.grayLight, borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                      <Store size={20} color={COLORS.gray} />
                    </div>
                    <h3 style={{ fontWeight: 700, color: COLORS.grayDark, marginBottom: 6 }}>Aucun Distributeur trouvé</h3>
                    <p style={{ fontSize: 12, color: COLORS.grayMuted, marginBottom: 16, fontWeight: 500 }}>Ajustez vos filtres.</p>
                    <button onClick={resetFilters}
                      style={{ padding: "8px 18px", background: GRADIENTS.primary, color: COLORS.white, borderRadius: 9,
                        fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                      Réinitialiser
                    </button>
                  </div>
                )}

                {filteredPoints.length > 0 && (
                  <div style={{ padding: "12px 16px", borderTop: `1px solid ${COLORS.blueLight}`,
                    background: COLORS.grayLight, display: "flex", alignItems: "center",
                    justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: COLORS.grayMuted, fontWeight: 600 }}>
                      <span>Lignes :</span>
                      <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                        style={{ padding: "4px 8px", border: `1px solid ${COLORS.blueLight}`, borderRadius: 7,
                          fontSize: 12, background: COLORS.white, outline: "none", fontFamily: "inherit", color: COLORS.grayDark }}>
                        {[5,10,25,50].map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                      <span>{indexOfFirst + 1}–{Math.min(indexOfFirst + itemsPerPage, filteredPoints.length)} sur {filteredPoints.length}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <PagBtn onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}><ChevronLeft size={14} /></PagBtn>
                      {paginationRange(currentPage, totalPages).map((p, i) =>
                        p === "..." ? <span key={i} style={{ padding: "0 6px", color: COLORS.grayMuted, fontSize: 12, fontWeight: 600 }}>…</span>
                          : <PagBtn key={p} onClick={() => setCurrentPage(p as number)} active={currentPage === p}>{p}</PagBtn>
                      )}
                      <PagBtn onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}><ChevronRight size={14} /></PagBtn>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ══════════════ CARTE VIEW ══════════════ */}
        {activeView === "carte" && (
          <>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <div style={{ width: 4, height: 24, background: GRADIENTS.primary, borderRadius: 2 }} />
                  <h1 style={{ fontSize: 20, fontWeight: 700, color: COLORS.grayDark }}>Carte des Distributeurs</h1>
                </div>
                <p style={{ fontSize: 12, color: COLORS.grayMuted, paddingLeft: 14, fontWeight: 500 }}>
                  {filteredPoints.filter((p) => isValidCoord(p.latitude)).length} PDV géolocalisés
                </p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={downloadData}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9,
                    background: GRADIENTS.secondary, color: COLORS.white, fontSize: 12, fontWeight: 700,
                    border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                  <Download size={14} /> Exporter
                </button>
                <button onClick={() => setActiveView("liste")}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9,
                    border: `1px solid ${COLORS.blueLight}`, background: COLORS.grayLight, color: COLORS.grayDark,
                    fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  <ChevronLeft size={14} /> Retour
                </button>
              </div>
            </div>
            <div style={{ background: COLORS.white, border: `1px solid ${COLORS.blueLight}`, borderRadius: 14, overflow: "hidden", height: 560 }}>
              <MapWithNoSSR
                points={filteredPoints} center={[5.3599517, -4.0082563]} zoom={12}
                onPointClick={(p: PointOfSale) => { fetchPointDetail(p.id); setActiveView("detail"); }}
                showAvatars={true}
              />
            </div>
          </>
        )}

        {/* ══════════════ DETAIL VIEW ══════════════ */}
        {activeView === "detail" && selectedPoint && (() => {
          const p           = selectedPoint;
          const badge       = badgeFromScore(p.score_global);
          const photos      = detailPhotos;
          const photosOk    = photos.length >= MIN_PHOTOS;
          const coveredPhotoTypes  = new Set(photos.map((ph) => ph.type));
          const requiredPhotoTypes = ["facade","interieur","axe_principal","environnement"];
          const activeOps   = getActiveOperators(p);
          const digitScore  = calcDigitalisation(p);

          return (
            <div className="space-y-5">
              {/* Hero */}
              <div style={{ borderRadius: 16, background: GRADIENTS.dark, overflow: "hidden", position: "relative" }}>
                <GradientStripe height={3} />
                <div style={{ position: "relative", height: 180 }}>
                  {p.avatar && <img src={p.avatar} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.3 }} />}
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)" }} />
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 24px 20px",
                    display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 14 }}>
                      <div style={{ width: 72, height: 72, borderRadius: 14, overflow: "hidden",
                        border: "3px solid rgba(79,179,232,0.6)", background: COLORS.white, flexShrink: 0 }}>
                        {p.avatar
                          ? <img src={p.avatar} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.grayLight }}>
                              <Store size={22} color={COLORS.blueDark} />
                            </div>}
                      </div>
                      <div style={{ marginBottom: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                          <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 20,
                            fontSize: 10, fontWeight: 700, background: badge.bg, color: badge.color,
                            border: `1px solid ${badge.border}` }}>
                            {badge.label}
                          </span>
                          <NatureBadge nature={p.nature} size="md" />
                          {activeOps.length > 0 && (
                            <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                              {activeOps.map((op) => {
                                const { Logo } = op;
                                return (
                                  <div key={op.key} title={op.label} style={{
                                    background: "rgba(255,255,255,0.18)", borderRadius: 8, padding: 3,
                                    backdropFilter: "blur(4px)",
                                  }}>
                                    <Logo size={20} active={true} />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: COLORS.white }}>{p.name}</h2>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 2,
                          display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}>
                          <MapPin size={11} />{p.commune}{p.quartier ? ` · ${p.quartier}` : ""} · {getTypeLabel(p.type)}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setActiveView("liste")}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px",
                        background: "rgba(79,179,232,0.18)", border: "1px solid rgba(79,179,232,0.40)",
                        borderRadius: 9, color: COLORS.white, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                      <ChevronLeft size={12} /> Retour
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
                {/* Main column */}
                <div className="space-y-4">

                  {/* General info */}
                  <div style={{ background: COLORS.white, border: `1px solid ${COLORS.blueLight}`, borderRadius: 14, overflow: "hidden" }}>
                    <GradientStripe height={2} />
                    <div style={{ padding: 18 }}>
                      <h4 style={{ fontSize: 11, fontWeight: 700, color: COLORS.grayDark, textTransform: "uppercase",
                        letterSpacing: "0.07em", marginBottom: 14 }}>Informations générales</h4>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        {[
                          { icon: User,      label: "Propriétaire",        value: p.owner,                                     color: COLORS.blue    },
                          { icon: Phone,     label: "Téléphone",           value: p.phone,                                     color: COLORS.green   },
                          { icon: Mail,      label: "Email",               value: p.email,                                     color: COLORS.purple  },
                          { icon: Building2, label: "Type",                value: getTypeLabel(p.type),                        color: COLORS.orange  },
                          { icon: Layers,    label: "Nature",              value: getNatureLabel(p.nature),                    color: COLORS.indigo  },
                          { icon: Gauge,     label: "Potentiel",           value: potentielLabels[p.potentiel] || p.potentiel_label, color: COLORS.pink },
                          { icon: Calendar,  label: "Date d'inscription",  value: p.registration_date,                         color: COLORS.teal    },
                          { icon: Clock,     label: "Date de création",    value: p.created_at ? p.created_at.split("T")[0] : "—", color: COLORS.cyan },
                          { icon: Users,     label: "Agent collecteur",    value: p.agent_name || p.agent || "—",              color: COLORS.rose    },
                        ].map(({ icon: Icon, label, value, color }) => (
                          <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: 10,
                            padding: 10, background: COLORS.grayLight, borderRadius: 10, border: `1px solid ${COLORS.blueLight}` }}>
                            <div style={{ padding: 6, background: COLORS.white, borderRadius: 7, border: `1px solid ${COLORS.blueLight}`, flexShrink: 0 }}>
                              <Icon size={13} color={color} />
                            </div>
                            <div>
                              <p style={{ fontSize: 10, color: COLORS.grayMuted, fontWeight: 700 }}>{label}</p>
                              <p style={{ fontWeight: 700, color: COLORS.grayDark, fontSize: 12, marginTop: 1 }}>{value || "—"}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ── Bloc digitalisation / opérateurs mobiles ── */}
                  <div style={{ background: COLORS.white, border: `1px solid ${COLORS.blueLight}`, borderRadius: 14, overflow: "hidden" }}>
                    <GradientStripe height={2} />
                    <div style={{ padding: 18 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                        <h4 style={{ fontSize: 11, fontWeight: 700, color: COLORS.grayDark, textTransform: "uppercase",
                          letterSpacing: "0.07em", display: "flex", alignItems: "center", gap: 6 }}>
                          <Smartphone size={13} color={COLORS.blue} /> Digitalisation & Paiements mobiles
                        </h4>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                          background: digitScore === 100 ? GRADIENTS.success : digitScore > 0 ? GRADIENTS.secondary : COLORS.grayLight,
                          color: digitScore > 0 ? COLORS.white : COLORS.gray,
                          border: `1px solid ${digitScore > 0 ? COLORS.greenLight : COLORS.blueLight}` }}>
                          {digitScore}/100
                        </span>
                      </div>

                      {/* Barre globale */}
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ height: 8, borderRadius: 4, background: COLORS.blueLight, overflow: "hidden" }}>
                          <div style={{ height: "100%", borderRadius: 4,
                            background: digitScore === 100 ? GRADIENTS.success : GRADIENTS.secondary,
                            width: `${digitScore}%`, transition: "width 0.5s" }} />
                        </div>
                      </div>

                      {/* Cartes opérateurs */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                        {MOBILE_OPERATORS.map((op) => {
                          const active = !!p[op.key as OperatorKey];
                          const { Logo } = op;
                          return (
                            <div key={op.key} style={{
                              padding: "14px 8px", borderRadius: 12, textAlign: "center",
                              background: active ? op.bg : COLORS.grayLight,
                              border: `2px solid ${active ? op.color : COLORS.blueLight}`,
                              opacity: active ? 1 : 0.45,
                              transition: "all 0.2s",
                            }}>
                              <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
                                <Logo size={40} active={active} />
                              </div>
                              <p style={{ fontSize: 11, fontWeight: 700, color: active ? op.color : COLORS.gray }}>{op.label}</p>
                              <p style={{ fontSize: 10, color: active ? op.color : COLORS.gray, fontWeight: 600, marginTop: 2 }}>
                                {active ? "✓ Actif" : "Inactif"}
                              </p>
                              {active && (
                                <span style={{ display: "inline-block", marginTop: 5, fontSize: 9, fontWeight: 700,
                                  padding: "2px 7px", borderRadius: 6, background: op.color + "22", color: op.color, border: `1px solid ${op.color}44` }}>
                                  +25%
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {activeOps.length === 0 && (
                        <p style={{ textAlign: "center", fontSize: 12, color: COLORS.gray, fontWeight: 600, marginTop: 10 }}>
                          Aucun opérateur de paiement mobile enregistré
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Terrain block */}
                  <div style={{ background: COLORS.white, border: `1px solid ${COLORS.blueLight}`, borderRadius: 14, overflow: "hidden" }}>
                    <GradientStripe height={2} />
                    <div style={{ padding: 18 }}>
                      <h4 style={{ fontSize: 11, fontWeight: 700, color: COLORS.grayDark, textTransform: "uppercase",
                        letterSpacing: "0.07em", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                        <Target size={13} color={COLORS.blue} /> Données terrain (Huff · Hotelling · Applebaum)
                      </h4>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                        {[
                          { label: "Concurrents 300m", value: nbConcurrentsOptions.find((o) => o.value === p.nb_concurrents)?.label || "—", color: COLORS.red    },
                          { label: "Classe quartier",  value: classeQuartierOptions.find((o) => o.value === p.classe_quartier)?.label || "—", color: COLORS.purple },
                          { label: "Ancienneté",       value: `${p.anciennete_annees} an(s)`, color: COLORS.teal   },
                          { label: "Façade visible",   value: `${p.facade_metres} m`,          color: COLORS.orange },
                        ].map(({ label, value, color }) => (
                          <div key={label} style={{ padding: 12, background: COLORS.grayLight, borderRadius: 10,
                            border: `1px solid ${COLORS.blueLight}`, textAlign: "center" }}>
                            <p style={{ fontSize: 10, color: COLORS.grayMuted, fontWeight: 700, marginBottom: 5 }}>{label}</p>
                            <p style={{ fontWeight: 700, color, fontSize: 14 }}>{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Photos */}
                  <div style={{ background: COLORS.white, border: `1px solid ${COLORS.blueLight}`, borderRadius: 14, overflow: "hidden" }}>
                    <GradientStripe height={2} />
                    <div style={{ padding: 18 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                        <h4 style={{ fontSize: 11, fontWeight: 700, color: COLORS.grayDark, textTransform: "uppercase",
                          letterSpacing: "0.07em", display: "flex", alignItems: "center", gap: 6 }}>
                          <Camera size={13} color={COLORS.blue} /> Photos du PDV
                          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 700,
                            background: photosOk ? GRADIENTS.success : GRADIENTS.secondary, color: COLORS.white }}>
                            {photos.length}/{MIN_PHOTOS} min
                          </span>
                        </h4>
                        <button onClick={() => { setPhotosModalPoint(p); setPhotosModalItems([]); setShowPhotosModal(true); }}
                          style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
                            borderRadius: 8, background: GRADIENTS.primary, color: COLORS.white, fontSize: 11,
                            fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                          <Plus size={12} /> Ajouter des photos
                        </button>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 12 }}>
                        {requiredPhotoTypes.map((type) => {
                          const covered = coveredPhotoTypes.has(type);
                          const info = PHOTO_TYPES.find((t) => t.value === type)!;
                          return (
                            <div key={type} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 8px",
                              borderRadius: 8, fontSize: 10, fontWeight: 700,
                              background: covered ? GRADIENTS.success : COLORS.grayLight,
                              border: `1px solid ${covered ? COLORS.greenLight : COLORS.blueLight}`,
                              color: covered ? COLORS.green : COLORS.grayMuted }}>
                              {covered ? <CheckCircle2 size={11} color={COLORS.green} style={{ flexShrink: 0 }} />
                                : <div style={{ width: 11, height: 11, borderRadius: "50%", border: `2px solid ${COLORS.blueLight}`, flexShrink: 0 }} />}
                              {info.icon} {info.label}
                            </div>
                          );
                        })}
                      </div>
                      {photos.length === 0 ? (
                        <div onClick={() => { setPhotosModalPoint(p); setPhotosModalItems([]); setShowPhotosModal(true); }}
                          style={{ border: `2px dashed ${COLORS.blueLight}`, borderRadius: 14, padding: 32,
                            textAlign: "center", cursor: "pointer", background: COLORS.grayLight }}>
                          <div style={{ width: 44, height: 44, background: GRADIENTS.primary, borderRadius: 12,
                            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                            <Camera size={20} color={COLORS.white} />
                          </div>
                          <p style={{ fontWeight: 700, color: COLORS.grayDark, fontSize: 13, marginBottom: 4 }}>Aucune photo enregistrée</p>
                          <p style={{ fontSize: 11, color: COLORS.grayMuted, fontWeight: 500 }}>Cliquez pour ajouter au moins 4 photos</p>
                        </div>
                      ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                          {photos.map((photo, idx) => (
                            <PhotoCard key={photo.id} photo={photo}
                              onDelete={() => handleDeletePhoto(p.id, photo.id)}
                              allPhotos={photos} index={idx} />
                          ))}
                          {!photosOk && (
                            <div onClick={() => { setPhotosModalPoint(p); setPhotosModalItems([]); setShowPhotosModal(true); }}
                              style={{ aspectRatio: "1", border: `2px dashed ${COLORS.blueLight}`, borderRadius: 12,
                                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", background: GRADIENTS.secondary }}>
                              <Plus size={18} color={COLORS.white} />
                              <span style={{ fontSize: 10, color: COLORS.white, fontWeight: 700, textAlign: "center", marginTop: 4, padding: "0 6px" }}>
                                +{MIN_PHOTOS - photos.length}<br/>photo(s)
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Analysis A/D/E */}
                  <div style={{ background: COLORS.white, border: `1px solid ${COLORS.blueLight}`, borderRadius: 14, overflow: "hidden" }}>
                    <GradientStripe height={2} />
                    <div style={{ padding: 18 }}>
                      <h4 style={{ fontSize: 11, fontWeight: 700, color: COLORS.grayDark, textTransform: "uppercase",
                        letterSpacing: "0.07em", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                        <Target size={13} color={COLORS.blue} /> Analyse stratégique A · D · E
                      </h4>
                      <div className="space-y-4">
                        <ProgressBarFull label="A — Branding & disponibilité média" value={p.score_a} max={25} bg={GRADIENTS.primary} />
                        <ProgressBarFull label="D — Potentiel commercial" value={p.score_d} max={40} bg={GRADIENTS.secondary} />
                        <ProgressBarFull label="E — Environnement stratégique" value={p.score_e} max={35} bg={GRADIENTS.success} />
                      </div>
                      <div style={{ background: GRADIENTS.card, border: `1px solid ${COLORS.blueLight}`, borderRadius: 10,
                        padding: "10px 14px", marginTop: 14, fontSize: 11, color: COLORS.grayMuted, lineHeight: 1.6 }}>
                        <span style={{ fontWeight: 700, color: COLORS.grayDark }}>Diagnostic : </span>
                        {getNatureLabel(p.nature)} {p.brander ? "déjà brandé" : "non brandé"}, visibilité {p.visibilite}/100,
                        accessibilité {p.accessibilite}/100, affluence {p.affluence}/100,
                        digitalisation {digitScore}/100
                        {activeOps.length > 0 && ` (${activeOps.map((o) => o.label).join(", ")})`},
                        façade {p.facade_metres}m, {nbConcurrentsOptions.find((o) => o.value === p.nb_concurrents)?.label || "—"} concurrent(s),
                        quartier {classeQuartierOptions.find((o) => o.value === p.classe_quartier)?.label || "—"}.{" "}
                        <span style={{ fontWeight: 700, color: p.eligibilite_branding ? COLORS.green : COLORS.grayMuted }}>
                          {p.eligibilite_branding
                            ? "Immédiatement exploitable pour une offre branding."
                            : "À suivre selon le ciblage commercial."}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Map */}
                  <div style={{ background: COLORS.white, border: `1px solid ${COLORS.blueLight}`, borderRadius: 14, overflow: "hidden" }}>
                    <GradientStripe height={2} />
                    <div style={{ padding: 18 }}>
                      <h4 style={{ fontSize: 11, fontWeight: 700, color: COLORS.grayDark, textTransform: "uppercase",
                        letterSpacing: "0.07em", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                        <MapPin size={13} color={COLORS.blue} /> Localisation
                      </h4>
                      <div style={{ height: 200, borderRadius: 10, overflow: "hidden", border: `1px solid ${COLORS.blueLight}`, marginBottom: 12 }}>
                        <MapWithNoSSR
                          points={[p]}
                          center={[isValidCoord(p.latitude) ? p.latitude : 5.3599517, isValidCoord(p.longitude) ? p.longitude : -4.0082563]}
                          zoom={15} onPointClick={() => {}} singleMarker showAvatars={true} />
                      </div>
                      <div style={{ padding: "10px 14px", background: GRADIENTS.secondary, borderRadius: 10,
                        border: `1px solid ${COLORS.blueLight}`, display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 10 }}>
                        <MapPin size={14} color={COLORS.white} style={{ flexShrink: 0, marginTop: 1 }} />
                        <p style={{ fontSize: 12, color: COLORS.white, fontWeight: 600 }}>{p.address}</p>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                        {[{ l: "District", v: p.district }, { l: "Commune", v: p.commune }, { l: "Quartier", v: p.quartier || "—" }].map(({ l, v }) => (
                          <div key={l} style={{ padding: 10, background: COLORS.grayLight, borderRadius: 9, textAlign: "center", border: `1px solid ${COLORS.blueLight}` }}>
                            <p style={{ fontSize: 10, color: COLORS.grayMuted, fontWeight: 700 }}>{l}</p>
                            <p style={{ fontWeight: 700, color: COLORS.grayDark, fontSize: 12, marginTop: 2 }}>{v || "—"}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Side column */}
                <div className="space-y-4">
                  {/* Score card */}
                  <div style={{ background: GRADIENTS.dark, borderRadius: 14, overflow: "hidden" }}>
                    <GradientStripe height={3} />
                    <div style={{ padding: 16 }}>
                      <h4 style={{ fontSize: 11, fontWeight: 700, color: COLORS.white, marginBottom: 12,
                        display: "flex", alignItems: "center", gap: 6 }}>
                        <BarChart3 size={13} /> Performance
                      </h4>
                      <div style={{ background: "rgba(79,179,232,0.12)", borderRadius: 10, padding: 14, textAlign: "center", marginBottom: 10 }}>
                        <p style={{ fontSize: 36, fontWeight: 700, color: COLORS.white }}>{p.score_global}</p>
                        <p style={{ fontSize: 10, color: "rgba(200,230,248,0.70)", marginTop: 2, fontWeight: 600 }}>Score global /100</p>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 7 }}>
                        {[["A", p.score_a, 25, GRADIENTS.primary], ["D", p.score_d, 40, GRADIENTS.secondary], ["E", p.score_e, 35, GRADIENTS.success]].map(([l, v, m, g]) => (
                          <div key={l as string} style={{ background: "rgba(79,179,232,0.10)", borderRadius: 9, padding: 9, textAlign: "center" }}>
                            <p style={{ fontSize: 16, fontWeight: 700, color: COLORS.white }}>{v}</p>
                            <p style={{ fontSize: 9, color: "rgba(200,230,248,0.55)", fontWeight: 600 }}>/{m}</p>
                            <p style={{ fontSize: 10, fontWeight: 700, background: g as string, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{l}</p>
                          </div>
                        ))}
                      </div>
                      {/* Mini digit score */}
                      <div style={{ marginTop: 8, background: "rgba(79,179,232,0.10)", borderRadius: 9, padding: "9px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                          <span style={{ fontSize: 10, color: "rgba(200,230,248,0.70)", fontWeight: 600 }}>Digitalisation</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.blueLight }}>{digitScore}/100</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)", overflow: "hidden" }}>
                          <div style={{ height: "100%", borderRadius: 2, background: GRADIENTS.secondary, width: `${digitScore}%` }} />
                        </div>
                        {activeOps.length > 0 && (
                          <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                            {activeOps.map((op) => {
                              const { Logo } = op;
                              return (
                                <span key={op.key} title={op.label} style={{ fontSize: 9, fontWeight: 700,
                                  padding: "2px 6px 2px 3px", borderRadius: 6,
                                  background: op.bg, color: op.color,
                                  display: "inline-flex", alignItems: "center", gap: 3 }}>
                                  <Logo size={14} active={true} />
                                  {op.label}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginTop: 8 }}>
                        <div style={{ background: "rgba(79,179,232,0.10)", borderRadius: 9, padding: 9, textAlign: "center" }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: COLORS.blueLight }}>₣ {fmt(parseFloat(p.monthly_turnover || "0"))}</p>
                          <p style={{ fontSize: 9, color: "rgba(200,230,248,0.60)", marginTop: 1, fontWeight: 600 }}>CA mensuel</p>
                        </div>
                        <div style={{ background: "rgba(79,179,232,0.10)", borderRadius: 9, padding: 9, textAlign: "center" }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: COLORS.white }}>{p.monthly_orders}</p>
                          <p style={{ fontSize: 9, color: "rgba(200,230,248,0.60)", marginTop: 1, fontWeight: 600 }}>Commandes</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Eligibilities */}
                  <div style={{ background: COLORS.white, border: `1px solid ${COLORS.blueLight}`, borderRadius: 14, overflow: "hidden" }}>
                    <GradientStripe height={2} />
                    <div style={{ padding: 16 }}>
                      <h4 style={{ fontSize: 11, fontWeight: 700, color: COLORS.grayDark, textTransform: "uppercase",
                        letterSpacing: "0.07em", marginBottom: 12 }}>Éligibilités</h4>
                      <div className="space-y-2">
                        {[
                          { label: "Branding",         ok: p.eligibilite_branding    },
                          { label: "Exclusivité",       ok: p.eligibilite_exclusivite },
                          { label: "Activation promo",  ok: p.eligibilite_activation  },
                          { label: "GPS valide",        ok: p.gps_valid               },
                          { label: "Fiche complète",    ok: p.fiche_complete          },
                          { label: "Grande voie",       ok: p.grande_voie             },
                        ].map(({ label, ok }) => (
                          <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "7px 10px", borderRadius: 8, background: COLORS.grayLight, border: `1px solid ${COLORS.blueLight}` }}>
                            <span style={{ fontSize: 11, color: COLORS.grayMuted, fontWeight: 600 }}>{label}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: ok ? COLORS.green : COLORS.grayMuted,
                              display: "flex", alignItems: "center", gap: 3 }}>
                              {ok ? <><CheckCircle2 size={11} /> Oui</> : "—"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Branding info */}
                  <div style={{ background: COLORS.white, border: `1px solid ${COLORS.blueLight}`, borderRadius: 14, overflow: "hidden" }}>
                    <GradientStripe height={2} />
                    <div style={{ padding: 16 }}>
                      <h4 style={{ fontSize: 11, fontWeight: 700, color: COLORS.grayDark, textTransform: "uppercase",
                        letterSpacing: "0.07em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                        <Award size={13} color={COLORS.blue} /> Branding
                      </h4>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "7px 10px", borderRadius: 8, background: COLORS.grayLight,
                        border: `1px solid ${COLORS.blueLight}`, marginBottom: 8 }}>
                        <span style={{ fontSize: 11, color: COLORS.grayMuted, fontWeight: 600 }}>Est brandé</span>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                          background: p.brander ? GRADIENTS.primary : COLORS.grayLight,
                          color: p.brander ? COLORS.white : COLORS.grayMuted,
                          border: `1px solid ${p.brander ? COLORS.purple : COLORS.blueLight}` }}>
                          {p.brander ? "Oui" : "Non"}
                        </span>
                      </div>
                      {p.brander && p.marque_brander && (
                        <p style={{ padding: "7px 10px", background: GRADIENTS.primary, borderRadius: 8,
                          fontWeight: 700, color: COLORS.white, fontSize: 12, border: `1px solid ${COLORS.purple}`, marginBottom: 8 }}>
                          {p.marque_brander}
                        </p>
                      )}
                      {p.brander && p.branding_image && (
                        <div style={{ position: "relative", height: 120, borderRadius: 10, overflow: "hidden", border: `1px solid ${COLORS.purple}` }}>
                          <img src={p.branding_image} alt="branding" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.3), transparent)" }} />
                          {p.marque_brander && (
                            <span style={{ position: "absolute", bottom: 7, left: 7, padding: "2px 8px",
                              background: "rgba(255,255,255,0.2)", borderRadius: 20, fontSize: 10, color: COLORS.white,
                              fontWeight: 700, backdropFilter: "blur(4px)" }}>
                              {p.marque_brander}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    {[
                      { label: "Modifier les informations", gradient: GRADIENTS.primary, hgradient: "linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)", icon: Edit,
                        action: () => { setEditingPoint(p); setSelectedPoint(null); setEditPhotos([]); } },
                      { label: `Gérer les photos (${photos.length})`, gradient: GRADIENTS.secondary, hgradient: "linear-gradient(135deg, #3a9cee 0%, #00e2ee 100%)", icon: Camera,
                        action: () => { setPhotosModalPoint(p); setPhotosModalItems([]); setShowPhotosModal(true); } },
                      { label: "Supprimer le Distributeur", gradient: GRADIENTS.danger, hgradient: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)", icon: Trash2,
                        action: () => { handleDeletePoint(p.id); setActiveView("liste"); } },
                    ].map((btn) => (
                      <button key={btn.label} onClick={btn.action}
                        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                          gap: 7, padding: "10px", borderRadius: 10, background: btn.gradient, color: COLORS.white,
                          fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = btn.hgradient; (e.currentTarget as HTMLElement).style.transform = "scale(1.02)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = btn.gradient; (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}>
                        <btn.icon size={13} /> {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ══════════════ MODAL ADD ══════════════ */}
        {showAddModal && (
          <ModalWrapper
            onClose={() => { setShowAddModal(false); setNewPoint(emptyForm()); setAvatarFile(null); setBrandingImageFile(null); setAddPhotos([]); }}
            title="Nouveau Distributeur"
            subtitle="Ajoutez un point à votre réseau commercial"
            headerBg={GRADIENTS.primary}
            icon={Plus}
            footer={
              <>
                <button onClick={() => { setShowAddModal(false); setNewPoint(emptyForm()); setAddPhotos([]); }}
                  style={{ padding: "9px 18px", borderRadius: 9, border: `1px solid ${COLORS.blueLight}`,
                    background: COLORS.grayLight, color: COLORS.grayDark, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  Annuler
                </button>
                <button onClick={handleAddPoint} disabled={!isAddFormValid || actionLoading}
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 9,
                    background: GRADIENTS.primary, color: COLORS.white, fontSize: 12, fontWeight: 700,
                    border: "none", cursor: isAddFormValid && !actionLoading ? "pointer" : "not-allowed",
                    opacity: !isAddFormValid || actionLoading ? 0.6 : 1, fontFamily: "inherit" }}>
                  {actionLoading ? <><Loader2 size={13} className="animate-spin" /> Création...</> : <><Plus size={13} /> Créer le Distributeur</>}
                </button>
              </>
            }
          >
            <AvatarUpload src={newPoint.avatar} inputId="avatar-add" />
            {renderBaseFields(newPoint, (u: any) => setNewPoint((p) => ({ ...p, ...u })), false)}
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: COLORS.gray,
                textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Adresse complète *</label>
              <textarea value={newPoint.address} onChange={(e) => setNewPoint((p) => ({ ...p, address: e.target.value }))}
                rows={2} placeholder="Adresse complète avec quartier, commune, ville..."
                style={{ width: "100%", padding: "8px 12px", border: `1px solid ${COLORS.blueLight}`, borderRadius: 9,
                  fontSize: 13, background: COLORS.grayLight, outline: "none", fontFamily: "inherit",
                  color: COLORS.grayDark, resize: "none" }} />
            </div>
            <div style={{ borderTop: `1px solid ${COLORS.blueLight}`, paddingTop: 18 }}>
              <PhotoUploadSection photos={addPhotos} onChange={setAddPhotos} isUploading={actionLoading} />
            </div>
          </ModalWrapper>
        )}

        {/* ══════════════ MODAL EDIT ══════════════ */}
        {editingPoint && (
          <ModalWrapper
            onClose={() => { setEditingPoint(null); setAvatarFile(null); setBrandingImageFile(null); setEditPhotos([]); }}
            title="Modifier le Distributeur"
            subtitle="Mettez à jour les informations"
            headerBg={GRADIENTS.secondary}
            icon={Edit}
            footer={
              <>
                <button onClick={() => setEditingPoint(null)}
                  style={{ padding: "9px 18px", borderRadius: 9, border: `1px solid ${COLORS.blueLight}`,
                    background: COLORS.grayLight, color: COLORS.grayDark, fontSize: 12, fontWeight: 700,
                    cursor: "pointer", fontFamily: "inherit" }}>
                  Annuler
                </button>
                <button onClick={handleUpdatePoint} disabled={!isEditFormValid || actionLoading}
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 9,
                    background: GRADIENTS.secondary, color: COLORS.white, fontSize: 12, fontWeight: 700,
                    border: "none", cursor: isEditFormValid && !actionLoading ? "pointer" : "not-allowed",
                    opacity: !isEditFormValid || actionLoading ? 0.6 : 1, fontFamily: "inherit" }}>
                  {actionLoading ? <><Loader2 size={13} className="animate-spin" /> Sauvegarde...</> : <><CheckCircle size={13} /> Sauvegarder</>}
                </button>
              </>
            }
          >
            <AvatarUpload src={editingPoint.avatar || ""} inputId="avatar-edit" />
            {renderBaseFields(editingPoint, (u: any) => setEditingPoint((p) => p ? { ...p, ...u } : null), true)}
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: COLORS.gray,
                textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Adresse complète *</label>
              <textarea value={editingPoint.address} onChange={(e) => setEditingPoint((p) => p ? { ...p, address: e.target.value } : null)}
                rows={2}
                style={{ width: "100%", padding: "8px 12px", border: `1px solid ${COLORS.blueLight}`, borderRadius: 9,
                  fontSize: 13, background: COLORS.grayLight, outline: "none", fontFamily: "inherit",
                  color: COLORS.grayDark, resize: "none" }} />
            </div>
            <div style={{ borderTop: `1px solid ${COLORS.blueLight}`, paddingTop: 18 }}>
              <PhotoUploadSection
                photos={editPhotos}
                onChange={setEditPhotos}
                existingPhotos={editingPoint.photos || []}
                onDeleteExisting={(photoId) => handleDeletePhoto(editingPoint.id, photoId)}
                posId={editingPoint.id}
                isUploading={actionLoading}
              />
            </div>
          </ModalWrapper>
        )}

        {/* ══════════════ MODAL PHOTOS ══════════════ */}
        {showPhotosModal && photosModalPoint && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
            <div style={{ background: COLORS.white, borderRadius: 18, width: "100%", maxWidth: 640,
              maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden",
              boxShadow: "0 20px 60px rgba(10,21,32,0.22)" }}>
              <div style={{ background: GRADIENTS.dark, flexShrink: 0 }}>
                <GradientStripe height={3} />
                <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, background: "rgba(79,179,232,0.18)", borderRadius: 10,
                      display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Camera size={16} color={COLORS.blueLight} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: COLORS.white }}>Photos du PDV</h3>
                      <p style={{ fontSize: 11, color: "rgba(200,230,248,0.70)", marginTop: 1, fontWeight: 500 }}>
                        {photosModalPoint.name} · {detailPhotos.length} photo(s) enregistrée(s)
                      </p>
                    </div>
                  </div>
                  <button onClick={() => { setShowPhotosModal(false); setPhotosModalItems([]); }}
                    style={{ padding: 6, background: "rgba(79,179,232,0.12)", border: "none", borderRadius: 8,
                      cursor: "pointer", color: "rgba(200,230,248,0.65)" }}>
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div style={{ overflowY: "auto", flex: 1, padding: 20 }}>
                <PhotoUploadSection
                  photos={photosModalItems}
                  onChange={setPhotosModalItems}
                  existingPhotos={detailPhotos}
                  onDeleteExisting={(photoId) => handleDeletePhoto(photosModalPoint.id, photoId)}
                  posId={photosModalPoint.id}
                  isUploading={photosUploading}
                />
              </div>
              <div style={{ borderTop: `1px solid ${COLORS.blueLight}`, padding: "14px 20px",
                display: "flex", justifyContent: "flex-end", gap: 10, background: COLORS.grayLight, flexShrink: 0 }}>
                <button onClick={() => { setShowPhotosModal(false); setPhotosModalItems([]); }}
                  style={{ padding: "9px 18px", borderRadius: 9, border: `1px solid ${COLORS.blueLight}`,
                    background: COLORS.grayLight, color: COLORS.grayDark, fontSize: 12, fontWeight: 700,
                    cursor: "pointer", fontFamily: "inherit" }}>
                  Fermer
                </button>
                {photosModalItems.length > 0 && (
                  <button onClick={handleUploadPhotosModal} disabled={photosUploading}
                    style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 9,
                      background: GRADIENTS.primary, color: COLORS.white, fontSize: 12, fontWeight: 700,
                      border: "none", cursor: photosUploading ? "not-allowed" : "pointer",
                      opacity: photosUploading ? 0.6 : 1, fontFamily: "inherit" }}>
                    {photosUploading
                      ? <><Loader2 size={13} className="animate-spin" /> Upload...</>
                      : <><Upload size={13} /> Uploader {photosModalItems.length} photo(s)</>}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PointsVenteManagement;