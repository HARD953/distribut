"use client";
// components/dashboard/LanfiaLinkDashboard.tsx
// Palette Login appliquée : vert forêt #1E3D2C · ocre #C07A2F · crème #FAF7F0

import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ScatterChart, Scatter, LineChart, Line, AreaChart, Area, Legend, ZAxis,
} from "recharts";
import {
  MapPin, Store, BadgePercent, TrendingUp, Filter, Camera, Target, BarChart3,
  Users, CheckCircle2, Image as ImageIcon, Layers3, Gauge, Search, Download,
  ShieldCheck, Loader2, AlertTriangle, X, ChevronLeft, ChevronRight, ZoomIn,
  Award, Navigation, Activity, Eye, TrendingDown, Zap, Globe,
} from "lucide-react";
import { apiService } from "./ApiService";

// ─────────────────────────────────────────────────────────────────────────────
// Palette Login → Dashboard
// ─────────────────────────────────────────────────────────────────────────────
const PALETTE = {
  forest:  "#2D5A3D",
  forestD: "#1E3D2C",
  ocre:    "#C07A2F",
  ocreL:   "#D4A843",
  sage:    "#4A7A5A",
  cream:   "#FAF7F0",
  sand:    "#F2EDE0",
  warm:    "#E8D9B8",
  text:    "#2A1A08",
  muted:   "#A89880",
  mutedD:  "#7A6A52",
};

const CHART_COLORS = [
  PALETTE.forest,
  PALETTE.ocre,
  PALETTE.sage,
  PALETTE.ocreL,
  PALETTE.muted,
  "#3B6D11",
  "#854F0B",
];

const MAP_LAYER_COLORS: Record<string, string> = {
  all:        PALETTE.forest,
  brandes:    PALETTE.ocre,
  nonbrandes: PALETTE.ocreL,
  eligibles:  PALETTE.sage,
  premium:    PALETTE.forestD,
  gps:        "#4A7A5A",
};

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface Photo {
  id: number;
  image: string;
  thumbnail: string;
  type: string;
  caption: string;
  order: number;
}

interface PointOfSale {
  id: number;
  name: string;
  commune: string;
  quartier: string;
  district: string;
  region: string;
  type: string;
  status: string;
  branding: string;
  potentiel: string;
  potentiel_label: string;
  visibilite: number;
  accessibilite: number;
  affluence: number;
  digitalisation: number;
  photos: Photo[];
  photos_count: number;
  scoreA: number;
  scoreD: number;
  scoreE: number;
  score: number;
  agent: string;
  agent_name: string;
  gpsValid: boolean;
  ficheComplete: boolean;
  eligibiliteBranding: boolean;
  eligibiliteExclusivite: boolean;
  eligibiliteActivation: boolean;
  grandeVoie: boolean;
  caMensuel: number;
  dateCollecte: string;
  latitude: number;
  longitude: number;
  address: string;
  phone: string;
  owner: string;
}

interface AgentPerformance {
  agent: string;
  agent_name: string;
  total: number;
  gps_rate: number;
  complete_rate: number;
  photo_avg: number;
}

interface FilterOption {
  value: string;
  label: string;
}

type MapLayer = "all" | "brandes" | "nonbrandes" | "eligibles" | "premium" | "gps";

// ─────────────────────────────────────────────────────────────────────────────
// Utilitaires
// ─────────────────────────────────────────────────────────────────────────────
function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

function badgeFromScore(score: number) {
  if (score >= 85) return { label: "Premium stratégique", cls: "bg-[#EAF2EC] text-[#1E3D2C] border border-[#B8D4BE]" };
  if (score >= 70) return { label: "Haut potentiel",      cls: "bg-[#F2EDE0] text-[#7A3E0A] border border-[#D4C4A0]" };
  if (score >= 50) return { label: "Développement",       cls: "bg-[#FDF5E0] text-[#7A5210] border border-[#E8D9B8]" };
  return             { label: "Standard",                  cls: "bg-[#F2EDE0] text-[#7A6A52] border border-[#D4C4A0]" };
}

function fmt(n: number) {
  return n.toLocaleString("fr-FR");
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook Leaflet SSR-safe
// ─────────────────────────────────────────────────────────────────────────────
function useLeaflet() {
  const [leafletReady, setLeafletReady] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).L) { setLeafletReady(true); return; }
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id   = "leaflet-css";
      link.rel  = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    const script = document.createElement("script");
    script.src   = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => setLeafletReady(true);
    document.head.appendChild(script);
  }, []);
  return leafletReady;
}

// ─────────────────────────────────────────────────────────────────────────────
// Carte Leaflet
// ─────────────────────────────────────────────────────────────────────────────
function LeafletMap({
  points, activeLayer, onSelectPoint,
}: {
  points: PointOfSale[];
  activeLayer: MapLayer;
  onSelectPoint: (id: number) => void;
}) {
  const mapRef     = useRef<HTMLDivElement>(null);
  const mapInst    = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const leafletReady = useLeaflet();

  const visiblePoints = useMemo(() => {
    switch (activeLayer) {
      case "brandes":    return points.filter((p) => p.branding === "Brandé");
      case "nonbrandes": return points.filter((p) => p.branding === "Non brandé");
      case "eligibles":  return points.filter((p) => p.eligibiliteBranding);
      case "premium":    return points.filter((p) => p.score >= 85);
      case "gps":        return points.filter((p) => p.gpsValid);
      default:           return points;
    }
  }, [points, activeLayer]);

  useEffect(() => {
    if (!leafletReady || !mapRef.current) return;
    const L = (window as any).L;
    if (mapInst.current) return;
    mapInst.current = L.map(mapRef.current, { center: [5.345, -4.0], zoom: 12, zoomControl: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapInst.current);
    return () => {
      if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; }
    };
  }, [leafletReady]);

  useEffect(() => {
    if (!leafletReady || !mapInst.current) return;
    const L = (window as any).L;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    const color = MAP_LAYER_COLORS[activeLayer] || MAP_LAYER_COLORS.all;
    visiblePoints.filter((p) => p.latitude && p.longitude).forEach((p) => {
      const svgIcon = L.divIcon({
        className: "",
        html: `<div style="
          width:28px;height:28px;border-radius:50%;
          background:${color};border:2px solid white;
          box-shadow:0 1px 6px rgba(0,0,0,0.3);
          display:flex;align-items:center;justify-content:center;
          font-size:10px;font-weight:700;color:white;
        ">${p.score}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      const popup = L.popup({ maxWidth: 280 }).setContent(`
        <div style="font-family:system-ui,sans-serif;padding:4px 0;">
          <p style="font-weight:700;font-size:14px;margin:0 0 4px;">${p.name}</p>
          <p style="font-size:12px;color:#7A6A52;margin:0 0 8px;">${p.commune}${p.quartier ? " · " + p.quartier : ""} · ${p.type}</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:11px;margin-bottom:8px;">
            <div style="background:#F2EDE0;border-radius:6px;padding:4px 8px;">
              <span style="color:#A89880;">Score</span><br/>
              <strong style="color:#2A1A08;">${p.score}/100</strong>
            </div>
            <div style="background:#F2EDE0;border-radius:6px;padding:4px 8px;">
              <span style="color:#A89880;">Branding</span><br/>
              <strong style="color:${p.branding === "Brandé" ? "#2D5A3D" : "#C07A2F"};">${p.branding}</strong>
            </div>
            <div style="background:#F2EDE0;border-radius:6px;padding:4px 8px;">
              <span style="color:#A89880;">Visibilité</span><br/>
              <strong style="color:#2A1A08;">${p.visibilite}/100</strong>
            </div>
            <div style="background:#F2EDE0;border-radius:6px;padding:4px 8px;">
              <span style="color:#A89880;">Photos</span><br/>
              <strong style="color:${p.photos_count >= 4 ? "#2D5A3D" : "#C07A2F"};">${p.photos_count}</strong>
            </div>
          </div>
          <div style="margin-bottom:6px;font-size:11px;">
            <span style="background:#F2EDE0;color:#7A3E0A;border-radius:4px;padding:2px 6px;font-weight:600;">${p.potentiel_label}</span>
            ${p.eligibiliteBranding ? '<span style="background:#EAF2EC;color:#1E3D2C;border-radius:4px;padding:2px 6px;font-weight:600;margin-left:4px;">Éligible branding</span>' : ""}
          </div>
          <button
            onclick="window._lanfiaSelectPDV && window._lanfiaSelectPDV(${p.id})"
            style="width:100%;padding:6px;background:#2D5A3D;color:white;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;"
          >Voir la fiche →</button>
        </div>
      `);
      const marker = L.marker([p.latitude, p.longitude], { icon: svgIcon })
        .addTo(mapInst.current)
        .bindPopup(popup);
      markersRef.current.push(marker);
    });
    const geoPoints = visiblePoints.filter((p) => p.latitude && p.longitude);
    if (geoPoints.length > 1) {
      const bounds = L.latLngBounds(geoPoints.map((p) => [p.latitude, p.longitude]));
      mapInst.current.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 });
    } else if (geoPoints.length === 1) {
      mapInst.current.setView([geoPoints[0].latitude, geoPoints[0].longitude], 14);
    }
  }, [leafletReady, visiblePoints, activeLayer]);

  useEffect(() => {
    (window as any)._lanfiaSelectPDV = (id: number) => {
      onSelectPoint(id);
      if (mapInst.current) mapInst.current.closePopup();
    };
    return () => { delete (window as any)._lanfiaSelectPDV; };
  }, [onSelectPoint]);

  const geoCount = visiblePoints.filter((p) => p.latitude && p.longitude).length;

  return (
    <div className="relative">
      {!leafletReady && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl border border-dashed"
             style={{ background: PALETTE.sand, borderColor: PALETTE.warm }}>
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" style={{ color: PALETTE.forest }} />
            <p className="text-xs" style={{ color: PALETTE.muted }}>Chargement de la carte…</p>
          </div>
        </div>
      )}
      <div ref={mapRef} className="rounded-xl overflow-hidden"
           style={{ height: "420px", width: "100%", border: `1px solid ${PALETTE.warm}` }} />
      <div className="absolute bottom-3 left-3 z-[1000] px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm"
           style={{ background: "rgba(250,247,240,0.92)", border: `1px solid ${PALETTE.warm}`, color: PALETTE.mutedD }}>
        {fmt(geoCount)} point{geoCount !== 1 ? "s" : ""} affiché{geoCount !== 1 ? "s" : ""}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Composants UI
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({
  title, value, sub, icon: Icon, iconBg, iconColor, trend, trendUp,
}: {
  title: string; value: string | number; sub: string;
  icon: any; iconBg: string; iconColor: string;
  trend?: string; trendUp?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:shadow-md"
         style={{ background: "#fff", border: `0.5px solid ${PALETTE.warm}` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider truncate"
             style={{ color: PALETTE.muted }}>{title}</p>
          <p className="mt-2 text-2xl font-bold tabular-nums" style={{ color: PALETTE.text }}>{value}</p>
          <p className="mt-1 text-xs truncate" style={{ color: PALETTE.muted }}>{sub}</p>
          {trend && (
            <div className={cn(
              "mt-2 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full",
              trendUp ? "bg-[#EAF2EC] text-[#1E3D2C]" : "bg-[#FDF0E0] text-[#7A3E0A]"
            )}>
              {trendUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {trend}
            </div>
          )}
        </div>
        <div className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
             style={{ background: iconBg }}>
          <Icon className="h-5 w-5" style={{ color: iconColor }} />
        </div>
      </div>
    </div>
  );
}

function Panel({
  title, subtitle, right, children, className, noPad,
}: {
  title: string; subtitle?: string; right?: React.ReactNode;
  children: React.ReactNode; className?: string; noPad?: boolean;
}) {
  return (
    <div className={cn("rounded-2xl shadow-sm", className)}
         style={{ background: "#fff", border: `0.5px solid ${PALETTE.warm}` }}>
      <div className={cn("flex items-start justify-between gap-4", noPad ? "px-5 pt-5 pb-3" : "px-5 pt-5 pb-4")}>
        <div>
          <h3 className="text-sm font-bold tracking-tight" style={{ color: PALETTE.text }}>{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs" style={{ color: PALETTE.muted }}>{subtitle}</p>}
        </div>
        {right}
      </div>
      <div className={noPad ? "" : "px-5 pb-5"}>{children}</div>
    </div>
  );
}

function Segmented({
  value, onChange, items,
}: {
  value: string;
  onChange: (v: string) => void;
  items: { value: string; label: string; icon?: any }[];
}) {
  return (
    <div className="inline-flex rounded-xl p-1 gap-0.5"
         style={{ background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.15)" }}>
      {items.map((item) => (
        <button
          key={item.value}
          onClick={() => onChange(item.value)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150"
          style={value === item.value
            ? { background: PALETTE.ocre, color: "#FAF7F0" }
            : { background: "transparent", color: "rgba(250,247,240,.55)" }
          }
          onMouseEnter={(e) => {
            if (value !== item.value)
              (e.currentTarget as HTMLElement).style.color = "rgba(250,247,240,.85)";
          }}
          onMouseLeave={(e) => {
            if (value !== item.value)
              (e.currentTarget as HTMLElement).style.color = "rgba(250,247,240,.55)";
          }}
        >
          {item.icon && <item.icon size={13} />}
          {item.label}
        </button>
      ))}
    </div>
  );
}

function ProgressBar({
  label, value, max = 100, color, showPct = false,
}: {
  label: string; value: number; max?: number; color: string; showPct?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-medium truncate" style={{ color: PALETTE.muted }}>{label}</span>
        <span className="font-bold ml-2 shrink-0" style={{ color: PALETTE.text }}>
          {showPct ? `${value}%` : `${value}/${max}`}
        </span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: PALETTE.sand }}>
        <div className="h-1.5 rounded-full transition-all duration-500"
             style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function EmptyState({ title = "Aucune donnée", text = "Affinez les filtres pour visualiser les données." }) {
  return (
    <div className="flex h-72 items-center justify-center rounded-xl border border-dashed"
         style={{ background: PALETTE.sand, borderColor: PALETTE.warm }}>
      <div className="text-center px-6">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
             style={{ background: PALETTE.sand, border: `1px solid ${PALETTE.warm}` }}>
          <BarChart3 className="w-5 h-5" style={{ color: PALETTE.muted }} />
        </div>
        <p className="text-sm font-semibold" style={{ color: PALETTE.mutedD }}>{title}</p>
        <p className="text-xs mt-1" style={{ color: PALETTE.muted }}>{text}</p>
      </div>
    </div>
  );
}

function Badge({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", cls)}>
      {label}
    </span>
  );
}

function SelectFilter({
  label, icon: Icon, value, onChange, children,
}: {
  label: string; icon: any; value: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl p-3" style={{ background: PALETTE.sand, border: `1px solid ${PALETTE.warm}` }}>
      <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide"
             style={{ color: PALETTE.mutedD }}>
        <Icon size={12} />
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none transition-all"
        style={{
          background: "#fff",
          border: `1px solid ${PALETTE.warm}`,
          color: PALETTE.text,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = PALETTE.forest;
          e.currentTarget.style.boxShadow = `0 0 0 2px rgba(45,90,61,.1)`;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = PALETTE.warm;
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {children}
      </select>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Lightbox
// ─────────────────────────────────────────────────────────────────────────────
function ImageLightbox({
  images, initialIndex, onClose,
}: {
  images: Photo[]; initialIndex: number; onClose: () => void;
}) {
  const [idx, setIdx] = useState(initialIndex);
  const prev = useCallback(() => setIdx((i) => (i > 0 ? i - 1 : images.length - 1)), [images.length]);
  const next = useCallback(() => setIdx((i) => (i < images.length - 1 ? i + 1 : 0)), [images.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, prev, next]);

  if (!images.length) return null;
  const src = images[idx]?.image || images[idx]?.thumbnail;

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center" onClick={onClose}>
      <button className="absolute top-4 right-4 z-10 p-2 text-white/70 hover:text-white transition-colors" onClick={onClose}>
        <X size={28} />
      </button>
      <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full text-white text-xs font-medium"
           style={{ background: "rgba(45,90,61,.5)" }}>
        {idx + 1} / {images.length}
      </div>
      <button className="absolute left-4 z-10 p-3 text-white/70 hover:text-white transition-colors"
              onClick={(e) => { e.stopPropagation(); prev(); }}>
        <ChevronLeft size={36} />
      </button>
      <div className="max-w-[88vw] max-h-[88vh]" onClick={(e) => e.stopPropagation()}>
        {src ? (
          <img src={src} alt={`Image ${idx + 1}`}
               className="max-w-full max-h-[82vh] object-contain rounded-xl shadow-2xl" />
        ) : (
          <div className="w-[480px] h-[360px] rounded-xl flex flex-col items-center justify-center gap-3"
               style={{ background: PALETTE.forestD }}>
            <ImageIcon className="w-14 h-14" style={{ color: PALETTE.muted }} />
            <p className="text-sm" style={{ color: PALETTE.muted }}>Image non disponible</p>
          </div>
        )}
        <p className="text-center text-white/60 mt-3 text-xs">
          {images[idx]?.caption || images[idx]?.type || `Photo ${idx + 1}`}
        </p>
      </div>
      <button className="absolute right-4 z-10 p-3 text-white/70 hover:text-white transition-colors"
              onClick={(e) => { e.stopPropagation(); next(); }}>
        <ChevronRight size={36} />
      </button>
      {images.length > 1 && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 px-4">
          {images.map((img, i) => (
            <button key={img.id}
                    onClick={(e) => { e.stopPropagation(); setIdx(i); }}
                    className={cn("w-12 h-12 rounded-lg overflow-hidden border-2 transition-all",
                      i === idx ? "border-white scale-110" : "border-white/30 opacity-60 hover:opacity-100")}>
              <img src={img.thumbnail || img.image} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Tooltip
// ─────────────────────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 shadow-lg text-xs"
         style={{ background: "#fff", border: `1px solid ${PALETTE.warm}` }}>
      {label && <p className="font-bold mb-1.5" style={{ color: PALETTE.mutedD }}>{label}</p>}
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span style={{ color: PALETTE.muted }}>{p.name || p.dataKey}:</span>
          <span className="font-semibold" style={{ color: PALETTE.text }}>
            {typeof p.value === "number" ? fmt(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function LanfiaLinkDashboard() {

  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [pointsOfSale, setPointsOfSale]     = useState<PointOfSale[]>([]);
  const [agentsPerformance, setAgentsPerformance] = useState<AgentPerformance[]>([]);

  const [commune, setCommune]     = useState("Toutes");
  const [branding, setBranding]   = useState("Tous");
  const [potentiel, setPotentiel] = useState("Tous");
  const [type, setType]           = useState("Tous");
  const [search, setSearch]       = useState("");
  const [view, setView]           = useState("marketing");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [communes, setCommunes]     = useState<string[]>([]);
  const [types, setTypes]           = useState<FilterOption[]>([]);
  const [potentiels, setPotentiels] = useState<FilterOption[]>([]);

  const [activeLayer, setActiveLayer] = useState<MapLayer>("all");

  const [lightboxOpen, setLightboxOpen]     = useState(false);
  const [lightboxImages, setLightboxImages] = useState<Photo[]>([]);
  const [lightboxIndex, setLightboxIndex]   = useState(0);

  useEffect(() => {
    apiService.getFilterOptions()
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return;
        setCommunes(data.communes || []);
        setTypes(data.types || []);
        setPotentiels(data.potentiels || []);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    apiService.getAgentsPerformance()
      .then((r) => r.ok ? r.json() : [])
      .then(setAgentsPerformance)
      .catch(console.error);
  }, []);

  const fetchPoints = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params: Record<string, any> = {};
      if (commune !== "Toutes") params.commune = commune;
      if (branding !== "Tous")  params.branding = branding === "Brandé" ? "true" : "false";
      if (potentiel !== "Tous") params.potentiel = potentiels.find((p) => p.label === potentiel)?.value ?? potentiel;
      if (type !== "Tous")      params.type = types.find((t) => t.label === type)?.value ?? type;

      const response = await apiService.getPointsVenteAnalytics(params);
      if (!response.ok) throw new Error("Erreur lors du chargement des données");
      const data = await response.json();

      const mapped: PointOfSale[] = data.map((p: any) => ({
        id: p.id, name: p.name, commune: p.commune, quartier: p.quartier || "",
        district: p.district || "", region: p.region || "", type: p.type,
        status: p.status, branding: p.brander ? "Brandé" : "Non brandé",
        potentiel: p.potentiel || "standard", potentiel_label: p.potentiel_label || "Standard",
        visibilite: p.visibilite || 0, accessibilite: p.accessibilite || 0,
        affluence: p.affluence || 0, digitalisation: p.digitalisation || 0,
        photos: p.photos || [], photos_count: p.photos_count || 0,
        scoreA: p.score_a || 0, scoreD: p.score_d || 0, scoreE: p.score_e || 0,
        score: p.score_global || 0,
        agent: p.agent_name || p.agent || "Agent inconnu", agent_name: p.agent_name || "",
        gpsValid: p.gps_valid || false, ficheComplete: p.fiche_complete || false,
        eligibiliteBranding: p.eligibilite_branding || false,
        eligibiliteExclusivite: p.eligibilite_exclusivite || false,
        eligibiliteActivation: p.eligibilite_activation || false,
        grandeVoie: p.grande_voie || false,
        caMensuel: parseFloat(p.monthly_turnover || "0"),
        dateCollecte: p.date_collecte || new Date().toISOString().split("T")[0],
        latitude: parseFloat(p.latitude) || 0, longitude: parseFloat(p.longitude) || 0,
        address: p.address || "", phone: p.phone || "", owner: p.owner || "",
      }));
      setPointsOfSale(mapped);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [commune, branding, potentiel, type, potentiels, types]);

  useEffect(() => { fetchPoints(); }, [fetchPoints]);

  useEffect(() => {
    if (selectedId === null && pointsOfSale.length > 0) setSelectedId(pointsOfSale[0].id);
  }, [pointsOfSale, selectedId]);

  const loadPhotos = async (id: number): Promise<Photo[]> => {
    try {
      const r = await apiService.getPointVenteDetail(id);
      if (!r.ok) return [];
      const data = await r.json();
      const photos = data.photos || [];
      setPointsOfSale((prev) => prev.map((p) => p.id === id ? { ...p, photos, photos_count: photos.length } : p));
      return photos;
    } catch { return []; }
  };

  const openLightbox = async (pos: PointOfSale, idx: number) => {
    let photos = pos.photos;
    if (!photos?.length && pos.photos_count > 0) photos = await loadPhotos(pos.id);
    if (photos?.length) { setLightboxImages(photos); setLightboxIndex(idx); setLightboxOpen(true); }
  };

  const handleSelectFromMap = useCallback((id: number) => {
    setSelectedId(id); setView("fiche");
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pointsOfSale;
    return pointsOfSale.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.quartier.toLowerCase().includes(q) ||
      p.commune.toLowerCase().includes(q)
    );
  }, [pointsOfSale, search]);

  const selected = useMemo(
    () => filtered.find((p) => p.id === selectedId) || filtered[0] || pointsOfSale[0],
    [filtered, selectedId, pointsOfSale]
  );

  const totals = useMemo(() => {
    const total             = filtered.length;
    const brandes           = filtered.filter((p) => p.branding === "Brandé").length;
    const nonBrandes        = total - brandes;
    const premium           = filtered.filter((p) => p.score >= 85).length;
    const eligiblesBranding = filtered.filter((p) => p.eligibiliteBranding).length;
    const gpsValides        = filtered.filter((p) => p.gpsValid).length;
    const ficheOk           = filtered.filter((p) => p.ficheComplete).length;
    const scoreMoyen        = Math.round(filtered.reduce((a, p) => a + p.score, 0) / Math.max(total, 1));
    const scoreA            = Math.round(filtered.reduce((a, p) => a + p.scoreA, 0) / Math.max(total, 1));
    const scoreD            = Math.round(filtered.reduce((a, p) => a + p.scoreD, 0) / Math.max(total, 1));
    const scoreE            = Math.round(filtered.reduce((a, p) => a + p.scoreE, 0) / Math.max(total, 1));
    return { total, brandes, nonBrandes, premium, eligiblesBranding, gpsValides, ficheOk, scoreMoyen, scoreA, scoreD, scoreE };
  }, [filtered]);

  const brandingVsPotential = useMemo(() => {
    const levels = ["Standard", "Développement", "Fort potentiel", "Premium"];
    return levels.map((level) => ({
      niveau: level,
      Brandé: filtered.filter((p) => p.potentiel_label === level && p.branding === "Brandé").length,
      "Non brandé": filtered.filter((p) => p.potentiel_label === level && p.branding === "Non brandé").length,
    }));
  }, [filtered]);

  const byCommune = useMemo(() => {
    const map = new Map<string, any>();
    filtered.forEach((p) => {
      if (!map.has(p.commune)) map.set(p.commune, {
        commune: p.commune, total: 0, brandes: 0, nonBrandes: 0, premium: 0,
        scoreMoyen: 0, visibilite: 0, accessibilite: 0, affluence: 0,
        digitalisation: 0, eligiblesBranding: 0,
      });
      const r = map.get(p.commune);
      r.total += 1; r.brandes += p.branding === "Brandé" ? 1 : 0;
      r.nonBrandes += p.branding === "Non brandé" ? 1 : 0;
      r.premium += p.score >= 85 ? 1 : 0; r.scoreMoyen += p.score;
      r.visibilite += p.visibilite; r.accessibilite += p.accessibilite;
      r.affluence += p.affluence; r.digitalisation += p.digitalisation;
      r.eligiblesBranding += p.eligibiliteBranding ? 1 : 0;
    });
    return Array.from(map.values()).map((r) => ({
      ...r,
      scoreMoyen:    Math.round(r.scoreMoyen / r.total),
      visibilite:    Math.round(r.visibilite / r.total),
      accessibilite: Math.round(r.accessibilite / r.total),
      affluence:     Math.round(r.affluence / r.total),
      digitalisation:Math.round(r.digitalisation / r.total),
    }));
  }, [filtered]);

  const pieData       = useMemo(() => byCommune.map((r) => ({ name: r.commune, value: r.total })), [byCommune]);
  const radarSource   = useMemo(() => {
    const src = commune !== "Toutes" ? filtered.filter((p) => p.commune === commune) : filtered;
    if (!src.length) return [];
    const avg = (key: keyof PointOfSale) =>
      Math.round(src.reduce((a, p) => a + (p[key] as number), 0) / src.length);
    return [
      { axe: "Visibilité",    valeur: avg("visibilite") },
      { axe: "Accessibilité", valeur: avg("accessibilite") },
      { axe: "Affluence",     valeur: avg("affluence") },
      { axe: "Digital",       valeur: avg("digitalisation") },
      { axe: "Score global",  valeur: avg("score") },
    ];
  }, [filtered, commune]);

  const lineSource    = useMemo(() => byCommune.map((r) => ({
    commune: r.commune, scoreMoyen: r.scoreMoyen, premium: r.premium, eligiblesBranding: r.eligiblesBranding,
  })), [byCommune]);

  const scatterData   = useMemo(
    () => filtered.slice(0, 500).map((p) => ({ x: p.visibilite, y: p.score, z: p.accessibilite, name: p.name })),
    [filtered]
  );
  const opportunities = useMemo(
    () => [...filtered].filter((p) => p.branding === "Non brandé").sort((a, b) => b.score - a.score).slice(0, 10),
    [filtered]
  );
  const dailySource   = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((p) => { map.set(p.dateCollecte, (map.get(p.dateCollecte) || 0) + 1); });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, total]) => ({ date: date.slice(5), total }));
  }, [filtered]);

  const selectedBadge = badgeFromScore(selected?.score || 0);

  const mapLayers: { id: MapLayer; label: string; count: number; color: string }[] = [
    { id: "all",        label: "Tous les PDV",        count: totals.total,             color: MAP_LAYER_COLORS.all },
    { id: "brandes",    label: "Brandés",              count: totals.brandes,           color: MAP_LAYER_COLORS.brandes },
    { id: "nonbrandes", label: "Non brandés",          count: totals.nonBrandes,        color: MAP_LAYER_COLORS.nonbrandes },
    { id: "eligibles",  label: "Éligibles branding",   count: totals.eligiblesBranding, color: MAP_LAYER_COLORS.eligibles },
    { id: "premium",    label: "Premium (score ≥ 85)", count: totals.premium,           color: MAP_LAYER_COLORS.premium },
    { id: "gps",        label: "GPS valides",          count: totals.gpsValides,        color: MAP_LAYER_COLORS.gps },
  ];

  const handleExport = () => {
    const headers = ["Nom","Commune","Quartier","Type","Branding","Potentiel","Score","Visibilité","Accessibilité","Affluence","Photos","Agent","CA mensuel","Latitude","Longitude"];
    let csv = headers.join(",") + "\n";
    filtered.forEach((p) => {
      csv += [p.name, p.commune, p.quartier, p.type, p.branding, p.potentiel_label, p.score,
              p.visibilite, p.accessibilite, p.affluence, p.photos_count, p.agent,
              p.caMensuel, p.latitude, p.longitude]
        .map((f) => `"${f}"`).join(",") + "\n";
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    a.download = "pdv_analytique.csv"; a.click();
  };

  // ── États globaux ─────────────────────────────────────────────────────────
  if (loading && pointsOfSale.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: PALETTE.cream }}>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
               style={{ background: PALETTE.forest }}>
            <Loader2 className="animate-spin text-white" size={28} />
          </div>
          <p className="text-sm font-medium" style={{ color: PALETTE.mutedD }}>Chargement du dashboard…</p>
        </div>
      </div>
    );
  }

  if (error && pointsOfSale.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: PALETTE.cream }}>
        <div className="rounded-2xl p-8 text-center max-w-sm shadow-sm"
             style={{ background: "#fff", border: `1px solid #FBD0B0` }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
               style={{ background: "#FDF0E0" }}>
            <AlertTriangle style={{ color: PALETTE.ocre }} size={24} />
          </div>
          <p className="font-semibold mb-1" style={{ color: PALETTE.text }}>Erreur de chargement</p>
          <p className="text-sm mb-5" style={{ color: PALETTE.muted }}>{error}</p>
          <button onClick={fetchPoints}
                  className="px-5 py-2 text-white rounded-xl text-sm font-semibold transition-colors"
                  style={{ background: PALETTE.forest }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = PALETTE.sage)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = PALETTE.forest)}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDU PRINCIPAL
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: PALETTE.cream, color: PALETTE.text }}>
      <div className="mx-auto max-w-[1440px] space-y-5">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="rounded-2xl p-6 shadow-sm relative overflow-hidden"
             style={{ background: PALETTE.forestD }}>
          {/* Bande kente */}
          <div className="absolute top-0 left-0 right-0 h-1 z-10"
               style={{ background: "repeating-linear-gradient(90deg,#9A5E1A 0,#9A5E1A 14px,#D4A843 14px,#D4A843 28px,#1E3D2C 28px,#1E3D2C 42px,#D4A843 42px,#D4A843 56px)" }} />
          {/* Grille de fond */}
          <div className="absolute inset-0 pointer-events-none"
               style={{ opacity: 0.05, backgroundImage: "linear-gradient(rgba(250,247,240,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(250,247,240,.8) 1px,transparent 1px)", backgroundSize: "36px 36px" }} />
          {/* Motif diamant */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.06 }} aria-hidden="true">
            <defs><pattern id="kdia" x="0" y="0" width="44" height="44" patternUnits="userSpaceOnUse">
              <polygon points="22,2 42,22 22,42 2,22" fill="none" stroke="#FAF7F0" strokeWidth="0.7"/>
            </pattern></defs>
            <rect width="100%" height="100%" fill="url(#kdia)"/>
          </svg>

          <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#F0C878" }} />
                <p className="text-xs font-semibold uppercase tracking-[0.2em]"
                   style={{ color: "rgba(250,247,240,.4)" }}>
                  Dashboard analytique
                </p>
              </div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#FAF7F0" }}>
                LanfiaLink Dashboard
              </h1>
              <p className="mt-1.5 text-sm max-w-2xl" style={{ color: "rgba(250,247,240,.42)" }}>
                Analyses stratégiques A / D / E · Éligibilités commerciales · Performance agents · Carte interactive
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <Segmented value={view} onChange={setView} items={[
                { value: "executif",   label: "Direction",  icon: Activity },
                { value: "marketing",  label: "Marketing",  icon: TrendingUp },
                { value: "operations", label: "Opérations", icon: Zap },
                { value: "carte",      label: "Carte",      icon: MapPin },
                { value: "fiche",      label: "Fiche PDV",  icon: Eye },
              ]} />
              <button onClick={handleExport}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-colors"
                      style={{ background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.15)", color: "rgba(250,247,240,.8)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,.18)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,.1)")}>
                <Download size={13} /> Exporter CSV
              </button>
            </div>
          </div>
        </div>

        {/* ── Filtres ───────────────────────────────────────────────────────── */}
        <div className="rounded-2xl shadow-sm p-5" style={{ background: "#fff", border: `0.5px solid ${PALETTE.warm}` }}>
          <div className="flex items-center gap-2 mb-4">
            <Filter size={14} style={{ color: PALETTE.muted }} />
            <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: PALETTE.mutedD }}>
              Filtres globaux
            </h3>
            <span className="ml-auto text-xs" style={{ color: PALETTE.muted }}>
              <span className="font-bold" style={{ color: PALETTE.text }}>{filtered.length}</span> PDV affichés
            </span>
          </div>

          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
            <SelectFilter label="Commune" icon={MapPin} value={commune} onChange={setCommune}>
              <option>Toutes</option>
              {communes.map((c) => <option key={c}>{c}</option>)}
            </SelectFilter>
            <SelectFilter label="Branding" icon={BadgePercent} value={branding} onChange={setBranding}>
              <option>Tous</option><option>Brandé</option><option>Non brandé</option>
            </SelectFilter>
            <SelectFilter label="Potentiel" icon={Gauge} value={potentiel} onChange={setPotentiel}>
              <option>Tous</option>
              {potentiels.map((p) => <option key={p.value}>{p.label}</option>)}
            </SelectFilter>
            <SelectFilter label="Type PDV" icon={Store} value={type} onChange={setType}>
              <option>Tous</option>
              {types.map((t) => <option key={t.value}>{t.label}</option>)}
            </SelectFilter>
            <div className="col-span-2 rounded-xl p-3" style={{ background: PALETTE.sand, border: `1px solid ${PALETTE.warm}` }}>
              <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide"
                     style={{ color: PALETTE.mutedD }}>
                <Search size={12} /> Recherche
              </label>
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                     placeholder="Nom, commune, quartier…"
                     className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none transition-all"
                     style={{ background: "#fff", border: `1px solid ${PALETTE.warm}`, color: PALETTE.text, height: 36 }}
                     onFocus={(e) => { e.currentTarget.style.borderColor = PALETTE.forest; e.currentTarget.style.boxShadow = `0 0 0 2px rgba(45,90,61,.1)`; }}
                     onBlur={(e) => { e.currentTarget.style.borderColor = PALETTE.warm; e.currentTarget.style.boxShadow = "none"; }} />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[
              { label: "Galerie",     value: "4+ photos / PDV" },
              { label: "Analyses",    value: "A · D · E" },
              { label: "Couches",     value: "Tous / Brandés / Premium" },
              { label: "PDV en base", value: `${totals.total}` },
              { label: "Fiches OK",   value: `${totals.ficheOk}/${totals.total}` },
              { label: "Usage",       value: "Branding · Exclusivité" },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg px-3 py-2 text-center"
                   style={{ background: PALETTE.sand, border: `1px solid ${PALETTE.warm}` }}>
                <p className="text-xs" style={{ color: PALETTE.muted }}>{label}</p>
                <p className="text-xs font-bold mt-0.5" style={{ color: PALETTE.mutedD }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
        <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
          <StatCard title="Points de vente"     value={fmt(totals.total)}
            sub={`Base filtrée · ${totals.gpsValides} géolocalisés`}
            icon={Store}      iconBg="#EAF2EC" iconColor={PALETTE.forest} />
          <StatCard title="Boutiques brandées"  value={fmt(totals.brandes)}
            sub={`${Math.round((totals.brandes / Math.max(totals.total, 1)) * 100)}% du parc`}
            icon={BadgePercent} iconBg="#FDF0E0" iconColor={PALETTE.ocre} />
          <StatCard title="Éligibles branding"  value={fmt(totals.eligiblesBranding)}
            sub="Non brandés · score ≥ 50"
            icon={TrendingUp} iconBg="#EAF2EC" iconColor={PALETTE.sage} />
          <StatCard title="Score moyen"         value={`${totals.scoreMoyen}/100`}
            sub={`A:${totals.scoreA} · D:${totals.scoreD} · E:${totals.scoreE}`}
            icon={BarChart3}  iconBg="#FDF5E0" iconColor={PALETTE.ocreL} />
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            VUE CARTE
        ══════════════════════════════════════════════════════════════════ */}
        {view === "carte" && (
          <div className="grid gap-4 lg:grid-cols-12">
            <Panel title="Carte interactive des points de vente"
                   subtitle="Cliquez sur un marqueur pour voir la fiche · Naviguez entre les couches thématiques"
                   className="lg:col-span-12">
              <div className="grid gap-4 lg:grid-cols-12">
                <div className="lg:col-span-3 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wide mb-3 flex items-center gap-1.5"
                     style={{ color: PALETTE.mutedD }}>
                    <Layers3 size={12} /> Couches thématiques
                  </p>
                  {mapLayers.map(({ id, label, count, color }) => (
                    <button key={id} onClick={() => setActiveLayer(id)}
                            className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 border transition-all text-left"
                            style={activeLayer === id
                              ? { background: "#EAF2EC", border: `1px solid #B8D4BE` }
                              : { background: "#fff", border: `1px solid ${PALETTE.warm}` }}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
                        <span className="text-xs font-medium"
                              style={{ color: activeLayer === id ? PALETTE.forest : PALETTE.mutedD }}>
                          {label}
                        </span>
                      </div>
                      <span className="text-xs font-bold ml-1 shrink-0"
                            style={{ color: activeLayer === id ? PALETTE.forest : PALETTE.text }}>
                        {fmt(count)}
                      </span>
                    </button>
                  ))}

                  <div className="mt-4 rounded-xl p-3" style={{ background: PALETTE.sand, border: `1px solid ${PALETTE.warm}` }}>
                    <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: PALETTE.mutedD }}>
                      Score sur marqueur
                    </p>
                    <div className="space-y-1.5">
                      {[
                        { label: "≥ 85 — Premium",    cls: "bg-[#EAF2EC] text-[#1E3D2C]" },
                        { label: "70–84 — Haut pot.", cls: "bg-[#F2EDE0] text-[#7A3E0A]" },
                        { label: "50–69 — Dév.",      cls: "bg-[#FDF5E0] text-[#7A5210]" },
                        { label: "< 50 — Standard",   cls: "bg-[#F2EDE0] text-[#7A6A52]" },
                      ].map(({ label, cls }) => (
                        <div key={label} className={cn("rounded-lg px-2 py-1 text-xs font-medium", cls)}>{label}</div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl p-3" style={{ background: PALETTE.sand, border: `1px solid ${PALETTE.warm}` }}>
                    <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: PALETTE.mutedD }}>
                      Couverture GPS
                    </p>
                    <ProgressBar label="GPS valides" value={totals.gpsValides} max={totals.total} color={PALETTE.sage} />
                    <p className="text-xs mt-2" style={{ color: PALETTE.muted }}>
                      {totals.total - totals.gpsValides} PDV sans coordonnées
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-9">
                  <LeafletMap points={filtered} activeLayer={activeLayer} onSelectPoint={handleSelectFromMap} />
                  <p className="mt-2 text-xs text-center" style={{ color: PALETTE.muted }}>
                    Le score affiché sur chaque marqueur correspond au score global du PDV. Cliquez pour accéder à la fiche complète.
                  </p>
                </div>
              </div>
            </Panel>

            <Panel title="Points de vente affichés sur la carte"
                   subtitle={`Couche active : ${mapLayers.find((l) => l.id === activeLayer)?.label}`}
                   className="lg:col-span-12"
                   right={
                     <button onClick={handleExport}
                             className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors"
                             style={{ color: PALETTE.mutedD, borderColor: PALETTE.warm }}
                             onMouseEnter={(e) => (e.currentTarget.style.background = PALETTE.sand)}
                             onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                       <Download size={12} /> Exporter
                     </button>
                   }>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${PALETTE.warm}` }}>
                      {["PDV","Commune","Potentiel","Score","Branding","GPS","Action"].map((h) => (
                        <th key={h} className="pb-3 pr-4 text-left text-xs font-bold uppercase tracking-wide whitespace-nowrap"
                            style={{ color: PALETTE.muted }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const pts = filtered.filter((p) => {
                        switch (activeLayer) {
                          case "brandes":    return p.branding === "Brandé";
                          case "nonbrandes": return p.branding === "Non brandé";
                          case "eligibles":  return p.eligibiliteBranding;
                          case "premium":    return p.score >= 85;
                          case "gps":        return p.gpsValid;
                          default:           return true;
                        }
                      }).slice(0, 20);
                      if (!pts.length) return (
                        <tr><td colSpan={7} className="py-10 text-center text-sm" style={{ color: PALETTE.muted }}>
                          Aucun PDV dans cette couche
                        </td></tr>
                      );
                      return pts.map((p) => {
                        const badge = badgeFromScore(p.score);
                        return (
                          <tr key={p.id} style={{ borderBottom: `1px solid ${PALETTE.sand}` }}
                              className="transition-colors"
                              onMouseEnter={(e) => (e.currentTarget.style.background = PALETTE.sand)}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                            <td className="py-3 pr-4 font-semibold whitespace-nowrap" style={{ color: PALETTE.text }}>{p.name}</td>
                            <td className="py-3 pr-4 text-xs" style={{ color: PALETTE.muted }}>{p.commune}</td>
                            <td className="py-3 pr-4">
                              <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                                    style={{ background: PALETTE.sand, color: PALETTE.mutedD }}>{p.potentiel_label}</span>
                            </td>
                            <td className="py-3 pr-4"><Badge label={`${p.score}`} cls={badge.cls} /></td>
                            <td className="py-3 pr-4">
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                    style={p.branding === "Brandé"
                                      ? { background: "#EAF2EC", color: PALETTE.forest }
                                      : { background: "#FDF0E0", color: PALETTE.ocre }}>
                                {p.branding}
                              </span>
                            </td>
                            <td className="py-3 pr-4">
                              {p.gpsValid
                                ? <span className="text-xs flex items-center gap-1" style={{ color: PALETTE.sage }}><CheckCircle2 size={12} /> Oui</span>
                                : <span className="text-xs" style={{ color: PALETTE.muted }}>—</span>}
                            </td>
                            <td className="py-3 pr-4">
                              <button onClick={() => { setSelectedId(p.id); setView("fiche"); }}
                                      className="text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all"
                                      style={{ color: PALETTE.forest, borderColor: "#B8D4BE" }}
                                      onMouseEnter={(e) => (e.currentTarget.style.background = "#EAF2EC")}
                                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                                Voir fiche →
                              </button>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            VUE DIRECTION + MARKETING
        ══════════════════════════════════════════════════════════════════ */}
        {(view === "executif" || view === "marketing") && (
          <div className="grid gap-4 lg:grid-cols-12">

            <Panel title="Brandés vs non brandés par niveau de potentiel"
                   subtitle="Identification immédiate des opportunités restantes"
                   className="lg:col-span-7">
              {brandingVsPotential.some((d) => d.Brandé > 0 || d["Non brandé"] > 0) ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={brandingVsPotential} barGap={4} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={PALETTE.sand} />
                      <XAxis dataKey="niveau" tick={{ fontSize: 11, fill: PALETTE.muted }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: PALETTE.muted }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(45,90,61,0.04)" }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="Brandé"     fill={PALETTE.forest} radius={[5, 5, 0, 0]} />
                      <Bar dataKey="Non brandé" fill={PALETTE.ocre}   radius={[5, 5, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <EmptyState />}
            </Panel>

            <Panel title="Répartition par commune" subtitle="Poids volumétrique dans la base filtrée" className="lg:col-span-5">
              {pieData.length ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={100}
                           paddingAngle={2} dataKey="value"
                           label={({ name, percent }: { name: string; percent?: number }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                           labelLine={false}>
                        {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : <EmptyState />}
            </Panel>

            <Panel title="Profil stratégique moyen"
                   subtitle="Moyennes du filtre actif · Visibilité · Accessibilité · Affluence"
                   className="lg:col-span-5">
              {radarSource.length ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarSource} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                      <PolarGrid stroke={PALETTE.warm} />
                      <PolarAngleAxis dataKey="axe" tick={{ fontSize: 11, fill: PALETTE.mutedD }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10, fill: PALETTE.muted }} />
                      <Radar dataKey="valeur" stroke={PALETTE.forest} fill={PALETTE.forest} fillOpacity={0.2} strokeWidth={2} />
                      <Tooltip content={<ChartTooltip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              ) : <EmptyState />}
            </Panel>

            <Panel title="Comparatif communes" subtitle="Score moyen · Premium · Éligibles branding" className="lg:col-span-7">
              {lineSource.length ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineSource} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={PALETTE.sand} />
                      <XAxis dataKey="commune" tick={{ fontSize: 11, fill: PALETTE.muted }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: PALETTE.muted }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="scoreMoyen"        stroke={PALETTE.forest} strokeWidth={2.5} dot={{ r: 4, fill: PALETTE.forest }} name="Score moyen" />
                      <Line type="monotone" dataKey="premium"           stroke={PALETTE.sage}   strokeWidth={2.5} dot={{ r: 4, fill: PALETTE.sage }}   name="Premium" />
                      <Line type="monotone" dataKey="eligiblesBranding" stroke={PALETTE.ocre}   strokeWidth={2.5} dot={{ r: 4, fill: PALETTE.ocre }}   name="Éligibles" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : <EmptyState />}
            </Panel>

            <Panel title="Tendance de collecte" subtitle="Volume de PDV recensés par date" className="lg:col-span-7">
              {dailySource.length ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailySource} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="collecteGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={PALETTE.forest} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={PALETTE.forest} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={PALETTE.sand} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: PALETTE.muted }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: PALETTE.muted }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="total" name="PDV collectés"
                            stroke={PALETTE.forest} fill="url(#collecteGrad)" strokeWidth={2.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : <EmptyState />}
            </Panel>

            <Panel title="Matrice visibilité × score" subtitle="Les meilleures opportunités sont en haut à droite" className="lg:col-span-5">
              {scatterData.length ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                      <CartesianGrid stroke={PALETTE.sand} />
                      <XAxis type="number" dataKey="x" name="Visibilité" tick={{ fontSize: 11, fill: PALETTE.muted }} axisLine={false}
                             label={{ value: "Visibilité", position: "insideBottomRight", offset: -5, fontSize: 11, fill: PALETTE.muted }} />
                      <YAxis type="number" dataKey="y" name="Score" tick={{ fontSize: 11, fill: PALETTE.muted }} axisLine={false}
                             label={{ value: "Score", angle: -90, position: "insideLeft", offset: 10, fontSize: 11, fill: PALETTE.muted }} />
                      <ZAxis type="number" dataKey="z" range={[30, 200]} name="Accessibilité" />
                      <Tooltip cursor={{ strokeDasharray: "3 3" }}
                               content={({ active, payload }) => {
                                 if (!active || !payload?.length) return null;
                                 const d = payload[0]?.payload;
                                 return (
                                   <div className="rounded-xl px-3 py-2 shadow-lg text-xs max-w-[180px]"
                                        style={{ background: "#fff", border: `1px solid ${PALETTE.warm}` }}>
                                     <p className="font-bold truncate mb-1" style={{ color: PALETTE.text }}>{d?.name}</p>
                                     <p style={{ color: PALETTE.muted }}>Visibilité : <span className="font-semibold" style={{ color: PALETTE.text }}>{d?.x}</span></p>
                                     <p style={{ color: PALETTE.muted }}>Score : <span className="font-semibold" style={{ color: PALETTE.text }}>{d?.y}</span></p>
                                     <p style={{ color: PALETTE.muted }}>Accessibilité : <span className="font-semibold" style={{ color: PALETTE.text }}>{d?.z}</span></p>
                                   </div>
                                 );
                               }} />
                      <Scatter name="PDV" data={scatterData} fill={PALETTE.forest} fillOpacity={0.6} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              ) : <EmptyState />}
            </Panel>

            <Panel title="Top opportunités branding" subtitle="PDV non brandés · triés par score décroissant"
                   className="lg:col-span-12"
                   right={
                     <button onClick={handleExport}
                             className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors"
                             style={{ color: PALETTE.mutedD, borderColor: PALETTE.warm }}
                             onMouseEnter={(e) => (e.currentTarget.style.background = PALETTE.sand)}
                             onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                       <Download size={12} /> Exporter
                     </button>
                   }>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${PALETTE.warm}` }}>
                      {["PDV","Commune","Quartier","Potentiel","Score","Visibilité","Accessibilité","Photos","Action"].map((h) => (
                        <th key={h} className="pb-3 pr-4 text-left text-xs font-bold uppercase tracking-wide whitespace-nowrap"
                            style={{ color: PALETTE.muted }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {opportunities.length === 0 ? (
                      <tr><td colSpan={9} className="py-10 text-center text-sm" style={{ color: PALETTE.muted }}>Aucune opportunité trouvée</td></tr>
                    ) : opportunities.map((p) => {
                      const badge = badgeFromScore(p.score);
                      return (
                        <tr key={p.id} style={{ borderBottom: `1px solid ${PALETTE.sand}` }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = PALETTE.sand)}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                          <td className="py-3 pr-4 font-semibold whitespace-nowrap" style={{ color: PALETTE.text }}>{p.name}</td>
                          <td className="py-3 pr-4 text-xs" style={{ color: PALETTE.muted }}>{p.commune}</td>
                          <td className="py-3 pr-4 text-xs" style={{ color: PALETTE.muted }}>{p.quartier || "—"}</td>
                          <td className="py-3 pr-4">
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                                  style={{ background: PALETTE.sand, color: PALETTE.mutedD }}>{p.potentiel_label}</span>
                          </td>
                          <td className="py-3 pr-4"><Badge label={`${p.score}`} cls={badge.cls} /></td>
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 rounded-full" style={{ background: PALETTE.sand }}>
                                <div className="h-1.5 rounded-full" style={{ width: `${p.visibilite}%`, background: PALETTE.forest }} />
                              </div>
                              <span className="text-xs" style={{ color: PALETTE.muted }}>{p.visibilite}</span>
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 rounded-full" style={{ background: PALETTE.sand }}>
                                <div className="h-1.5 rounded-full" style={{ width: `${p.accessibilite}%`, background: PALETTE.sage }} />
                              </div>
                              <span className="text-xs" style={{ color: PALETTE.muted }}>{p.accessibilite}</span>
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                  style={p.photos_count >= 4
                                    ? { background: "#EAF2EC", color: PALETTE.forest }
                                    : { background: "#FDF0E0", color: PALETTE.ocre }}>
                              {p.photos_count}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <button onClick={() => { setSelectedId(p.id); setView("fiche"); }}
                                    className="text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all"
                                    style={{ color: PALETTE.forest, borderColor: "#B8D4BE" }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = "#EAF2EC")}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                              Voir fiche →
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            VUE OPÉRATIONS
        ══════════════════════════════════════════════════════════════════ */}
        {(view === "executif" || view === "operations") && (
          <div className="grid gap-4 lg:grid-cols-12">
            <Panel title="Qualité de collecte par agent"
                   subtitle="Suivi qualité terrain · GPS · fiches complètes · photos"
                   className="lg:col-span-12">
              {agentsPerformance.length === 0 ? (
                <div className="py-10 text-center text-sm" style={{ color: PALETTE.muted }}>Aucune donnée agent disponible</div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {agentsPerformance.slice(0, 8).map((agent) => (
                    <div key={agent.agent} className="rounded-xl p-4 transition-shadow hover:shadow-sm"
                         style={{ border: `0.5px solid ${PALETTE.warm}`, background: PALETTE.sand }}>
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm leading-tight" style={{ color: PALETTE.text }}>
                            {agent.agent_name || agent.agent}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: PALETTE.muted }}>{agent.total} PDV recensés</p>
                        </div>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                             style={{ background: "#EAF2EC" }}>
                          <Users size={16} style={{ color: PALETTE.forest }} />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <ProgressBar label="GPS valides"      value={agent.gps_rate || 0}     max={100} color={PALETTE.forest}  showPct />
                        <ProgressBar label="Fiches complètes" value={agent.complete_rate || 0} max={100} color={PALETTE.ocre}    showPct />
                        <ProgressBar label="Photos moy."      value={agent.photo_avg || 0}     max={8}   color={PALETTE.sage} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Aperçu cartographique"
                   subtitle="Vue rapide de la distribution géographique"
                   className="lg:col-span-12"
                   right={
                     <button onClick={() => setView("carte")}
                             className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors"
                             style={{ color: PALETTE.forest, borderColor: "#B8D4BE" }}
                             onMouseEnter={(e) => (e.currentTarget.style.background = "#EAF2EC")}
                             onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                       <MapPin size={12} /> Vue carte complète →
                     </button>
                   }>
              <div className="grid gap-4 lg:grid-cols-12">
                <div className="lg:col-span-3 space-y-2">
                  {mapLayers.map(({ id, label, count, color }) => (
                    <div key={id} className="flex items-center justify-between rounded-lg px-3 py-2"
                         style={{ background: "#fff", border: `0.5px solid ${PALETTE.warm}` }}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                        <span className="text-xs font-medium" style={{ color: PALETTE.mutedD }}>{label}</span>
                      </div>
                      <span className="text-xs font-bold" style={{ color: PALETTE.text }}>{fmt(count)}</span>
                    </div>
                  ))}
                </div>
                <div className="lg:col-span-9">
                  <LeafletMap points={filtered} activeLayer="all" onSelectPoint={handleSelectFromMap} />
                </div>
              </div>
            </Panel>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            VUE FICHE PDV
        ══════════════════════════════════════════════════════════════════ */}
        {view === "fiche" && selected && (
          <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: "#fff", border: `0.5px solid ${PALETTE.warm}` }}>
            {/* Hero */}
            <div className="px-6 py-5 flex items-start justify-between gap-4 relative overflow-hidden"
                 style={{ background: PALETTE.forestD }}>
              <div className="absolute top-0 left-0 right-0 h-1"
                   style={{ background: "repeating-linear-gradient(90deg,#9A5E1A 0,#9A5E1A 14px,#D4A843 14px,#D4A843 28px,#1E3D2C 28px,#1E3D2C 42px,#D4A843 42px,#D4A843 56px)" }} />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Badge label={selectedBadge.label} cls="bg-white/20 text-white border border-white/30 text-xs px-2.5 py-0.5 rounded-full font-semibold" />
                </div>
                <h2 className="text-xl font-bold" style={{ color: "#FAF7F0" }}>{selected.name}</h2>
                <p className="text-sm mt-1" style={{ color: "rgba(250,247,240,.45)" }}>
                  {selected.commune}{selected.quartier ? ` · ${selected.quartier}` : ""} · {selected.type}
                </p>
              </div>
              <button onClick={() => setView("marketing")}
                      className="relative z-10 flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-colors mt-1"
                      style={{ background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.15)", color: "rgba(250,247,240,.8)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,.18)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,.1)")}>
                <ChevronLeft size={13} /> Retour
              </button>
            </div>

            <div className="p-6">
              <div className="grid gap-6 lg:grid-cols-12">
                <div className="lg:col-span-8 space-y-6">

                  {/* Galerie */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide mb-3 flex items-center gap-1.5"
                       style={{ color: PALETTE.mutedD }}>
                      <Camera size={12} /> Galerie photos ({selected.photos_count})
                    </p>
                    <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                      {selected.photos?.length > 0 ? (
                        selected.photos.map((photo, i) => (
                          <div key={photo.id}
                               className="rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] group"
                               style={{ border: `1px solid ${PALETTE.warm}` }}
                               onClick={() => openLightbox(selected, i)}>
                            <div className="relative h-28" style={{ background: PALETTE.sand }}>
                              {photo.thumbnail || photo.image ? (
                                <img src={photo.thumbnail || photo.image} alt={photo.caption || photo.type}
                                     className="w-full h-full object-cover"
                                     onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Camera size={20} style={{ color: PALETTE.muted }} />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={18} />
                              </div>
                            </div>
                            <div className="px-2.5 py-2" style={{ background: "#fff" }}>
                              <p className="text-xs font-medium truncate" style={{ color: PALETTE.mutedD }}>
                                {photo.caption || photo.type || `Photo ${i + 1}`}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        ["Façade","Intérieur","Axe principal","Environnement"].map((label, i) => (
                          <div key={label}
                               className={cn("rounded-xl overflow-hidden", selected.photos_count > 0 && "cursor-pointer hover:shadow-md transition-all")}
                               style={{ border: `1px solid ${PALETTE.warm}` }}
                               onClick={() => selected.photos_count > 0 && openLightbox(selected, i)}>
                            <div className="flex items-center justify-center h-28" style={{ background: PALETTE.sand }}>
                              {selected.photos_count > 0
                                ? <Loader2 size={20} className="animate-spin" style={{ color: PALETTE.muted }} />
                                : <Camera size={20} style={{ color: PALETTE.warm }} />}
                            </div>
                            <div className="px-2.5 py-2" style={{ background: "#fff" }}>
                              <p className="text-xs truncate" style={{ color: PALETTE.muted }}>{label}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Analyse A/D/E */}
                  <div className="rounded-xl p-5" style={{ border: `1px solid ${PALETTE.warm}` }}>
                    <p className="text-xs font-bold uppercase tracking-wide mb-4 flex items-center gap-1.5"
                       style={{ color: PALETTE.mutedD }}>
                      <Target size={12} /> Analyse stratégique A / D / E
                    </p>
                    <div className="space-y-4">
                      <ProgressBar label="A — Branding & disponibilité média" value={selected.scoreA} max={25} color={PALETTE.ocre} />
                      <ProgressBar label="D — Potentiel commercial"           value={selected.scoreD} max={40} color={PALETTE.forest} />
                      <ProgressBar label="E — Environnement stratégique"      value={selected.scoreE} max={35} color={PALETTE.sage} />
                    </div>
                    <div className="mt-4 rounded-xl p-4 text-xs leading-relaxed"
                         style={{ background: "#EAF2EC", border: `1px solid #B8D4BE`, color: PALETTE.mutedD }}>
                      <span className="font-bold" style={{ color: PALETTE.text }}>Diagnostic express : </span>
                      PDV {selected.branding === "Non brandé" ? "non brandé" : "déjà brandé"},
                      visibilité {selected.visibilite}/100, accessibilité {selected.accessibilite}/100,
                      affluence {selected.affluence}/100.{" "}
                      {selected.eligibiliteBranding
                        ? "Immédiatement exploitable pour une offre branding."
                        : "À suivre selon le ciblage commercial."}
                    </div>
                  </div>

                  {/* Mini-carte */}
                  {selected.latitude && selected.longitude ? (
                    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${PALETTE.warm}` }}>
                      <p className="text-xs font-bold uppercase tracking-wide px-4 py-3 flex items-center gap-1.5"
                         style={{ borderBottom: `1px solid ${PALETTE.warm}`, color: PALETTE.mutedD }}>
                        <MapPin size={12} /> Localisation GPS
                      </p>
                      <div style={{ height: "220px" }}>
                        <LeafletMap points={[selected]} activeLayer="all" onSelectPoint={() => {}} />
                      </div>
                      <div className="px-4 py-2.5" style={{ background: PALETTE.sand, borderTop: `1px solid ${PALETTE.warm}` }}>
                        <p className="text-xs" style={{ color: PALETTE.muted }}>
                          {selected.latitude.toFixed(6)}, {selected.longitude.toFixed(6)}
                          {selected.address && ` · ${selected.address}`}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed p-6 text-center"
                         style={{ borderColor: PALETTE.warm }}>
                      <MapPin className="w-6 h-6 mx-auto mb-2" style={{ color: PALETTE.warm }} />
                      <p className="text-xs" style={{ color: PALETTE.muted }}>Coordonnées GPS non disponibles pour ce PDV</p>
                    </div>
                  )}
                </div>

                {/* Colonne latérale */}
                <div className="lg:col-span-4 space-y-4">

                  <div className="rounded-xl p-5" style={{ border: `1px solid ${PALETTE.warm}` }}>
                    <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: PALETTE.mutedD }}>
                      Synthèse PDV
                    </p>
                    <dl className="space-y-2.5">
                      {[
                        ["Score global",  `${selected.score}/100`],
                        ["Branding",      selected.branding],
                        ["Potentiel",     selected.potentiel_label],
                        ["Grande voie",   selected.grandeVoie ? "Oui" : "Non"],
                        ["Photos",        `${selected.photos_count}`],
                        ["Agent",         selected.agent_name || selected.agent],
                        ["CA mensuel",    `${fmt(selected.caMensuel)} CFA`],
                        ["Propriétaire",  selected.owner || "—"],
                        ["Téléphone",     selected.phone || "—"],
                      ].map(([label, val]) => (
                        <div key={label as string} className="flex items-center justify-between py-1.5"
                             style={{ borderBottom: `1px solid ${PALETTE.sand}` }}>
                          <dt className="text-xs font-medium" style={{ color: PALETTE.muted }}>{label}</dt>
                          <dd className="text-xs font-bold text-right max-w-[55%] truncate" style={{ color: PALETTE.text }}>{val}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  <div className="rounded-xl p-5" style={{ border: `1px solid ${PALETTE.warm}` }}>
                    <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: PALETTE.mutedD }}>
                      Éligibilités
                    </p>
                    <div className="space-y-2">
                      {[
                        { label: "Branding",        ok: selected.eligibiliteBranding },
                        { label: "Exclusivité",      ok: selected.eligibiliteExclusivite },
                        { label: "Activation promo", ok: selected.eligibiliteActivation },
                        { label: "GPS valide",       ok: selected.gpsValid },
                        { label: "Fiche complète",   ok: selected.ficheComplete },
                      ].map(({ label, ok }) => (
                        <div key={label} className="flex items-center justify-between rounded-lg px-3 py-2"
                             style={{ background: PALETTE.sand, border: `1px solid ${PALETTE.warm}` }}>
                          <span className="text-xs font-medium" style={{ color: PALETTE.mutedD }}>{label}</span>
                          <span className="text-xs font-bold flex items-center gap-1"
                                style={{ color: ok ? PALETTE.forest : PALETTE.muted }}>
                            {ok ? <><CheckCircle2 size={12} /> Oui</> : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl p-5" style={{ background: PALETTE.sand, border: `1px solid ${PALETTE.warm}` }}>
                    <p className="text-xs font-bold uppercase tracking-wide mb-3 flex items-center gap-1.5"
                       style={{ color: PALETTE.mutedD }}>
                      <ShieldCheck size={12} style={{ color: PALETTE.sage }} /> Architecture
                    </p>
                    <ul className="space-y-2">
                      {[
                        "Scores A/D/E calculés côté backend",
                        "Lightbox avec strip thumbnails + clavier",
                        "Filtres envoyés en query params → DRF",
                        "Photos chargées à la demande (lazy)",
                        "Export CSV client-side (filtré)",
                        "Carte Leaflet SSR-safe",
                        "6 couches thématiques SVG",
                        "Popup bouton → fiche PDV",
                      ].map((item) => (
                        <li key={item} className="flex gap-2 text-xs" style={{ color: PALETTE.muted }}>
                          <CheckCircle2 size={12} className="mt-0.5 shrink-0" style={{ color: PALETTE.sage }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl p-4" style={{ border: `1px solid ${PALETTE.warm}` }}>
                    <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: PALETTE.mutedD }}>Autres PDV</p>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {filtered.slice(0, 20).map((p) => (
                        <button key={p.id} onClick={() => setSelectedId(p.id)}
                                className="w-full text-left px-3 py-2 rounded-lg text-xs transition-all"
                                style={p.id === selected.id
                                  ? { background: "#EAF2EC", color: PALETTE.forest, fontWeight: 700, border: `1px solid #B8D4BE` }
                                  : { color: PALETTE.mutedD, border: "1px solid transparent" }}
                                onMouseEnter={(e) => { if (p.id !== selected.id) (e.currentTarget.style.background = PALETTE.sand); }}
                                onMouseLeave={(e) => { if (p.id !== selected.id) (e.currentTarget.style.background = "transparent"); }}>
                          <span className="font-semibold truncate block">{p.name}</span>
                          <span style={{ color: PALETTE.muted }}>{p.commune} · score {p.score}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {lightboxOpen && lightboxImages.length > 0 && (
        <ImageLightbox images={lightboxImages} initialIndex={lightboxIndex} onClose={() => setLightboxOpen(false)} />
      )}
    </div>
  );
}