"use client";
// components/dashboard/MerchantGraphView.tsx
//
// Merchant Graph — vue autonome à brancher dans LanfiaLinkDashboard.
// Implémente côté front les primitives de la stratégie LanfiaLink 2027 :
//   1. Merchant ID durable (dérivé de l'id PDV, indépendant de l'agent / téléphone / campagne)
//   2. Journal d'événements par marchand (dérivé des données existantes)
//   3. Tableau de qualité de la donnée (fraîcheur, géoprécision, doublons, contact, preuve)
//   4. Déduplication (proximité GPS + similarité de nom / téléphone identique)
//   5. Graphe relationnel du marchand (commune, quartier, agent, opérateurs, pairs)
//   6. Merchant Passport exportable (JSON) avec contrôle du consentement
//
// NB : le Merchant ID et le journal sont ici CALCULÉS côté client à partir des champs existants.
// Pour un vrai journal immuable, il faudra les persister côté Django (voir notes en bas de fichier).

import React, { useMemo, useState } from "react";
import {
  Fingerprint, Network, ShieldCheck, Copy, Download, Search, CheckCircle2,
  AlertTriangle, Clock, Phone, Camera, MapPin, Users, Layers3, FileJson, X,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types (compatibles structurellement avec PointOfSale du dashboard)
// ─────────────────────────────────────────────────────────────────────────────
export interface MerchantInput {
  id: number;
  name: string;
  commune: string;
  quartier: string;
  type: string;
  branding: string;
  potentiel_label: string;
  score: number;
  moov: boolean; orange: boolean; mtn: boolean; wave: boolean;
  nb_operateurs: number;
  photos_count: number;
  gpsValid: boolean;
  ficheComplete: boolean;
  eligibiliteBranding: boolean;
  grandeVoie: boolean;
  agent: string;
  agent_name: string;
  phone: string;
  owner: string;
  latitude: number;
  longitude: number;
  dateCollecte: string;
  nb_concurrents_label: string;
  classe_quartier_label: string;
}

interface MerchantGraphViewProps {
  /** PDV filtrés (filtres globaux du dashboard) */
  points: MerchantInput[];
  /** Toute la base chargée (utile pour la déduplication globale) */
  allPoints?: MerchantInput[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onOpenFiche?: (id: number) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Palette locale (alignée sur le dashboard)
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  navy: "#0A1E2E", blue: "#1A8FD1", blueD: "#0D6FAB", blueL: "#4FB3E8",
  pale: "#EDF5FA", surface: "#F0F5F9", warm: "#C0D4E6", warmL: "#D4E4F0",
  text: "#0A1E2E", textSub: "#2A4A62", muted: "#5A7A92", mutedD: "#1A4A6A",
  green: "#10B981", orange: "#F59E0B", purple: "#8B5CF6", pink: "#EC4899",
  teal: "#14B8A6", red: "#EF4444",
};

const OP_COLORS: Record<string, string> = {
  moov: "#00A651", orange: "#FF6600", mtn: "#FFCC00", wave: "#1DC4E9",
};
const OP_LABELS: Record<string, string> = {
  moov: "Moov", orange: "Orange", mtn: "MTN", wave: "Wave",
};

// Seuils cibles (stratégie LanfiaLink 2027, §9)
const TARGETS = {
  fraicheurPct: 80,        // > 80 % vérifiés dans les 90 jours
  fraicheurJours: 90,
  doublonsPour1000: 5,     // < 5 doublons pour 1 000 fiches
  contactPct: 70,          // > 70 % numéro valide
  preuvePct: 95,           // > 95 % avec preuve photo
  gpsPct: 90,              // proxy de la géoprécision (< 20 m non mesurable côté front)
  dedupDistanceM: 25,
};

// ─────────────────────────────────────────────────────────────────────────────
// Utilitaires
// ─────────────────────────────────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString("fr-FR");

function norm(s: string) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function daysSince(dateStr: string): number {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 9999;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
}

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const B36 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Merchant ID durable : dérivé UNIQUEMENT de l'identifiant base de données du PDV
 * (jamais du téléphone, de l'agent, de la campagne ou du client entreprise).
 * Format : LNF-CI-0000123-K  (K = caractère de contrôle base 36)
 */
export function buildMerchantId(pdvId: number): string {
  const body = String(pdvId).padStart(7, "0");
  let sum = 0;
  for (let i = 0; i < body.length; i++) sum += (body.charCodeAt(i) - 48) * (i + 3);
  return `LNF-CI-${body}-${B36[sum % 36]}`;
}

function tokenJaccard(a: string, b: string) {
  const ta = new Set(a.split(" ").filter((t) => t.length > 1));
  const tb = new Set(b.split(" ").filter((t) => t.length > 1));
  if (!ta.size || !tb.size) return 0;
  let inter = 0;
  ta.forEach((t) => { if (tb.has(t)) inter++; });
  return inter / (ta.size + tb.size - inter);
}

function sameName(a: string, b: string) {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length > 4 && b.length > 4 && (a.includes(b) || b.includes(a))) return true;
  return tokenJaccard(a, b) >= 0.6;
}

function digitsOnly(s: string) { return (s || "").replace(/\D/g, ""); }
function validPhone(s: string) { return digitsOnly(s).length >= 8; }

// ─────────────────────────────────────────────────────────────────────────────
// Déduplication
// ─────────────────────────────────────────────────────────────────────────────
interface DuplicatePair {
  a: MerchantInput; b: MerchantInput;
  reason: string; distanceM: number | null; confidence: "Élevée" | "Moyenne";
}

function findDuplicates(pts: MerchantInput[], maxPairs = 300): DuplicatePair[] {
  const pairs: DuplicatePair[] = [];
  const seen = new Set<string>();
  const key = (x: number, y: number) => (x < y ? `${x}-${y}` : `${y}-${x}`);
  const push = (a: MerchantInput, b: MerchantInput, reason: string, distanceM: number | null, confidence: DuplicatePair["confidence"]) => {
    const k = key(a.id, b.id);
    if (seen.has(k) || pairs.length >= maxPairs) return;
    seen.add(k);
    pairs.push({ a, b, reason, distanceM, confidence });
  };

  const normName = new Map<number, string>();
  pts.forEach((p) => normName.set(p.id, norm(p.name)));

  // 1) Même nom normalisé + même commune/quartier
  const byNameZone = new Map<string, MerchantInput[]>();
  pts.forEach((p) => {
    const n = normName.get(p.id) || "";
    if (!n) return;
    const k = `${n}|${norm(p.commune)}|${norm(p.quartier)}`;
    if (!byNameZone.has(k)) byNameZone.set(k, []);
    byNameZone.get(k)!.push(p);
  });
  byNameZone.forEach((group) => {
    for (let i = 0; i < group.length; i++)
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i], b = group[j];
        const d = a.latitude && b.latitude ? haversineM(a.latitude, a.longitude, b.latitude, b.longitude) : null;
        push(a, b, "Même nom, même zone", d, "Élevée");
      }
  });

  // 2) Même téléphone valide
  const byPhone = new Map<string, MerchantInput[]>();
  pts.forEach((p) => {
    if (!validPhone(p.phone)) return;
    const k = digitsOnly(p.phone).slice(-8);
    if (!byPhone.has(k)) byPhone.set(k, []);
    byPhone.get(k)!.push(p);
  });
  byPhone.forEach((group) => {
    for (let i = 0; i < group.length; i++)
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i], b = group[j];
        const d = a.latitude && b.latitude ? haversineM(a.latitude, a.longitude, b.latitude, b.longitude) : null;
        const similar = sameName(normName.get(a.id) || "", normName.get(b.id) || "");
        push(a, b, similar ? "Même téléphone, nom proche" : "Même téléphone", d, similar ? "Élevée" : "Moyenne");
      }
  });

  // 3) Proximité GPS + nom proche (index par cellules ~33 m)
  const CS = 0.0003;
  const grid = new Map<string, MerchantInput[]>();
  const geo = pts.filter((p) => p.latitude && p.longitude);
  geo.forEach((p) => {
    const k = `${Math.floor(p.latitude / CS)}_${Math.floor(p.longitude / CS)}`;
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k)!.push(p);
  });
  geo.forEach((p) => {
    const cx = Math.floor(p.latitude / CS), cy = Math.floor(p.longitude / CS);
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++) {
        const cell = grid.get(`${cx + dx}_${cy + dy}`);
        if (!cell) continue;
        cell.forEach((q) => {
          if (q.id <= p.id) return;
          const d = haversineM(p.latitude, p.longitude, q.latitude, q.longitude);
          if (d > TARGETS.dedupDistanceM) return;
          if (sameName(normName.get(p.id) || "", normName.get(q.id) || ""))
            push(p, q, `Nom proche à ${Math.round(d)} m`, d, "Élevée");
        });
      }
  });

  return pairs.sort((x, y) => (x.confidence === y.confidence ? 0 : x.confidence === "Élevée" ? -1 : 1));
}

// ─────────────────────────────────────────────────────────────────────────────
// Journal d'événements (dérivé)
// ─────────────────────────────────────────────────────────────────────────────
interface MerchantEvent {
  type: string; label: string; date: string; actor: string; color: string;
}

function buildEvents(p: MerchantInput): MerchantEvent[] {
  const actor = p.agent_name || p.agent || "Agent";
  const d = p.dateCollecte;
  const ev: MerchantEvent[] = [
    { type: "creation", label: "Création de la fiche marchand", date: d, actor, color: C.blue },
  ];
  if (p.gpsValid) ev.push({ type: "gps", label: "Position GPS validée", date: d, actor, color: C.teal });
  if (p.photos_count > 0) ev.push({ type: "photo", label: `${p.photos_count} photo(s) de preuve ajoutée(s)`, date: d, actor, color: C.purple });
  if (p.ficheComplete) ev.push({ type: "fiche", label: "Fiche complète", date: d, actor, color: C.green });
  (["moov", "orange", "mtn", "wave"] as const).forEach((op) => {
    if (p[op]) ev.push({ type: "operateur", label: `Présence ${OP_LABELS[op]} constatée`, date: d, actor, color: OP_COLORS[op] });
  });
  ev.push({
    type: "branding",
    label: p.branding === "Brandé" ? "Statut : point de vente brandé" : "Statut : non brandé",
    date: d, actor, color: p.branding === "Brandé" ? C.green : C.orange,
  });
  if (p.eligibiliteBranding) ev.push({ type: "eligibilite", label: "Éligible à une offre branding", date: d, actor, color: C.pink });
  return ev;
}

// ─────────────────────────────────────────────────────────────────────────────
// Qualité de la donnée
// ─────────────────────────────────────────────────────────────────────────────
function computeQuality(pts: MerchantInput[], dupPairs: DuplicatePair[]) {
  const n = Math.max(pts.length, 1);
  const fresh = pts.filter((p) => daysSince(p.dateCollecte) <= TARGETS.fraicheurJours).length;
  const gps = pts.filter((p) => p.gpsValid).length;
  const contact = pts.filter((p) => validPhone(p.phone)).length;
  const proof = pts.filter((p) => p.photos_count > 0).length;
  const dupIds = new Set<number>();
  dupPairs.forEach((d) => { dupIds.add(d.a.id); dupIds.add(d.b.id); });
  const dupRate = (dupPairs.length / n) * 1000;
  return {
    total: pts.length,
    fraicheurPct: Math.round((fresh / n) * 100),
    gpsPct: Math.round((gps / n) * 100),
    contactPct: Math.round((contact / n) * 100),
    preuvePct: Math.round((proof / n) * 100),
    doublonsPour1000: Math.round(dupRate * 10) / 10,
    doublonsCount: dupPairs.length,
    merchantsConcernes: dupIds.size,
    stale: pts.length - fresh,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Composants UI
// ─────────────────────────────────────────────────────────────────────────────
function Card({ title, subtitle, right, children, className = "" }: {
  title: string; subtitle?: string; right?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`rounded-2xl ${className}`}
         style={{ background: "#FFF", border: `1px solid ${C.warmL}`, boxShadow: "0 1px 6px rgba(13,80,140,0.06)" }}>
      <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4 border-b" style={{ borderBottomColor: C.warmL }}>
        <div>
          <h3 className="text-sm font-bold tracking-tight" style={{ color: C.text }}>{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs" style={{ color: C.muted }}>{subtitle}</p>}
        </div>
        {right}
      </div>
      <div className="px-5 pb-5 pt-4">{children}</div>
    </div>
  );
}

function QualityRow({ label, value, unit, target, higherIsBetter = true, hint }: {
  label: string; value: number; unit: string; target: number; higherIsBetter?: boolean; hint: string;
}) {
  const ok = higherIsBetter ? value >= target : value <= target;
  const pct = higherIsBetter ? Math.min(100, (value / Math.max(target, 1)) * 100) : Math.min(100, (target / Math.max(value, 0.1)) * 100);
  const color = ok ? C.green : C.orange;
  return (
    <div className="rounded-xl p-3.5" style={{ border: `1px solid ${C.warmL}`, background: "#FFF" }}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold" style={{ color: C.text }}>{label}</p>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: ok ? "#C8F0E2" : "#FFDDC8", color: ok ? "#044D38" : "#7A2400" }}>
          {ok ? <CheckCircle2 size={10} /> : <AlertTriangle size={10} />}{ok ? "Cible atteinte" : "Sous la cible"}
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums" style={{ color: C.text }}>
        {value}<span className="text-sm font-medium ml-0.5" style={{ color: C.muted }}>{unit}</span>
      </p>
      <div className="h-1.5 rounded-full overflow-hidden mt-2" style={{ background: C.surface }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <p className="text-[10px] mt-1.5" style={{ color: C.muted }}>
        Cible : {higherIsBetter ? ">" : "<"} {target}{unit} · {hint}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Graphe relationnel d'un marchand (SVG)
// ─────────────────────────────────────────────────────────────────────────────
interface GNode { id: string; label: string; sub?: string; kind: string; color: string; x: number; y: number; r: number; pdvId?: number; }

function buildEgoGraph(center: MerchantInput, pool: MerchantInput[]): { nodes: GNode[]; edges: [string, string][] } {
  const W = 640, H = 400, cx = W / 2, cy = H / 2;
  const neighbors: Omit<GNode, "x" | "y">[] = [];

  neighbors.push({ id: "commune", label: center.commune || "Commune ?", sub: "Commune", kind: "zone", color: C.navy, r: 24 });
  if (center.quartier) neighbors.push({ id: "quartier", label: center.quartier, sub: "Quartier", kind: "zone", color: C.blueD, r: 22 });
  neighbors.push({ id: "agent", label: center.agent_name || center.agent || "Agent", sub: "Agent recenseur", kind: "agent", color: C.purple, r: 22 });
  neighbors.push({ id: "classe", label: center.classe_quartier_label, sub: "Profil quartier", kind: "attr", color: C.teal, r: 20 });
  neighbors.push({ id: "concurrence", label: center.nb_concurrents_label, sub: "Concurrents 300 m", kind: "attr", color: C.red, r: 20 });
  neighbors.push({
    id: "branding", label: center.branding, sub: "Branding",
    kind: "attr", color: center.branding === "Brandé" ? C.green : C.orange, r: 20,
  });
  (["moov", "orange", "mtn", "wave"] as const).forEach((op) => {
    if (center[op]) neighbors.push({ id: `op-${op}`, label: OP_LABELS[op], sub: "Opérateur", kind: "op", color: OP_COLORS[op], r: 17 });
  });

  // Pairs : même quartier (sinon même commune), les plus proches en score
  const peersPool = pool.filter((p) => p.id !== center.id &&
    (center.quartier ? p.quartier === center.quartier : p.commune === center.commune));
  peersPool
    .sort((a, b) => Math.abs(a.score - center.score) - Math.abs(b.score - center.score))
    .slice(0, 6)
    .forEach((p) => neighbors.push({
      id: `peer-${p.id}`, label: p.name.length > 16 ? p.name.slice(0, 15) + "…" : p.name,
      sub: `Pair · ${p.score}`, kind: "peer", color: C.blue, r: 16, pdvId: p.id,
    }));

  const nodes: GNode[] = [{
    id: "center", label: center.name.length > 18 ? center.name.slice(0, 17) + "…" : center.name,
    sub: buildMerchantId(center.id), kind: "center", color: C.blue, x: cx, y: cy, r: 34,
  }];
  const edges: [string, string][] = [];
  const n = neighbors.length;
  neighbors.forEach((nb, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    const ring = nb.kind === "peer" ? 1 : 0.62;
    nodes.push({ ...nb, x: cx + Math.cos(angle) * (W / 2 - 70) * ring * (nb.kind === "peer" ? 1 : 0.85) + 0,
      y: cy + Math.sin(angle) * (H / 2 - 50) * ring });
    edges.push(["center", nb.id]);
  });
  // Liens structurels
  if (center.quartier) edges.push(["quartier", "commune"]);
  return { nodes, edges };
}

function EgoGraph({ center, pool, onSelect }: {
  center: MerchantInput; pool: MerchantInput[]; onSelect: (id: number) => void;
}) {
  const { nodes, edges } = useMemo(() => buildEgoGraph(center, pool), [center, pool]);
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.warmL}`, background: C.pale }}>
      <svg viewBox="0 0 640 400" className="w-full h-auto" role="img" aria-label="Graphe relationnel du marchand">
        {edges.map(([a, b], i) => {
          const na = byId.get(a), nb = byId.get(b);
          if (!na || !nb) return null;
          return <line key={i} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
                       stroke={C.warm} strokeWidth={a === "center" ? 1.5 : 1} strokeDasharray={b.startsWith("peer") ? "4 3" : undefined} />;
        })}
        {nodes.map((n) => (
          <g key={n.id} style={{ cursor: n.pdvId ? "pointer" : "default" }}
             onClick={() => n.pdvId && onSelect(n.pdvId)}>
            <circle cx={n.x} cy={n.y} r={n.r} fill={n.color} fillOpacity={n.kind === "center" ? 1 : 0.9}
                    stroke="#FFF" strokeWidth={2.5} />
            <text x={n.x} y={n.y + 3} textAnchor="middle" fontSize={n.kind === "center" ? 10 : 8.5} fontWeight={700}
                  fill={n.color === OP_COLORS.mtn ? "#000" : "#FFF"} style={{ pointerEvents: "none" }}>
              {n.kind === "center" ? "MARCHAND" : n.kind === "peer" ? "PDV" : n.sub?.split(" ")[0]?.slice(0, 7).toUpperCase()}
            </text>
            <text x={n.x} y={n.y + n.r + 12} textAnchor="middle" fontSize={10} fontWeight={600} fill={C.text}>{n.label}</text>
            {n.kind === "center" && (
              <text x={n.x} y={n.y + n.r + 24} textAnchor="middle" fontSize={9} fill={C.muted}>{n.sub}</text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Export helpers
// ─────────────────────────────────────────────────────────────────────────────
function download(filename: string, content: string, mime: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type: mime }));
  a.download = filename;
  a.click();
}

// ─────────────────────────────────────────────────────────────────────────────
// Vue principale
// ─────────────────────────────────────────────────────────────────────────────
export default function MerchantGraphView({ points, allPoints, selectedId, onSelect, onOpenFiche }: MerchantGraphViewProps) {
  const [scope, setScope] = useState<"filtres" | "base">("filtres");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [includePersonal, setIncludePersonal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dupFilter, setDupFilter] = useState<"Toutes" | "Élevée" | "Moyenne">("Toutes");

  const pool = scope === "base" && allPoints?.length ? allPoints : points;

  const dupPairs = useMemo(() => findDuplicates(pool), [pool]);
  const quality = useMemo(() => computeQuality(pool, dupPairs), [pool, dupPairs]);

  const dupIds = useMemo(() => {
    const s = new Set<number>();
    dupPairs.forEach((d) => { s.add(d.a.id); s.add(d.b.id); });
    return s;
  }, [dupPairs]);

  const selected = useMemo(
    () => pool.find((p) => p.id === selectedId) || pool[0] || null,
    [pool, selectedId]
  );
  const events = useMemo(() => (selected ? buildEvents(selected) : []), [selected]);

  const registry = useMemo(() => {
    const q = norm(search);
    const rows = pool.map((p) => ({
      p, mid: buildMerchantId(p.id), age: daysSince(p.dateCollecte),
      dup: dupIds.has(p.id),
    }));
    if (!q) return rows;
    return rows.filter((r) =>
      norm(r.p.name).includes(q) || r.mid.toLowerCase().includes(q.replace(/\s/g, "-")) ||
      r.mid.toLowerCase().includes(search.toLowerCase()) ||
      norm(r.p.commune).includes(q) || norm(r.p.quartier).includes(q));
  }, [pool, search, dupIds]);

  const PAGE = 15;
  const pageCount = Math.max(1, Math.ceil(registry.length / PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = registry.slice(safePage * PAGE, safePage * PAGE + PAGE);

  const visibleDups = dupPairs.filter((d) => dupFilter === "Toutes" || d.confidence === dupFilter).slice(0, 12);

  // Zones à revisiter (fraîcheur) par commune
  const staleByCommune = useMemo(() => {
    const m = new Map<string, { commune: string; total: number; stale: number }>();
    pool.forEach((p) => {
      if (!m.has(p.commune)) m.set(p.commune, { commune: p.commune, total: 0, stale: 0 });
      const r = m.get(p.commune)!;
      r.total++;
      if (daysSince(p.dateCollecte) > TARGETS.fraicheurJours) r.stale++;
    });
    return Array.from(m.values())
      .map((r) => ({ ...r, pct: Math.round((r.stale / Math.max(r.total, 1)) * 100) }))
      .sort((a, b) => b.pct - a.pct || b.stale - a.stale)
      .slice(0, 6);
  }, [pool]);

  const passport = useMemo(() => {
    if (!selected) return null;
    const base: Record<string, any> = {
      merchant_id: buildMerchantId(selected.id),
      generated_at: new Date().toISOString(),
      identity: {
        name: selected.name, type: selected.type,
        commune: selected.commune, quartier: selected.quartier,
        gps: selected.latitude && selected.longitude ? { lat: selected.latitude, lon: selected.longitude } : null,
      },
      quality: {
        last_verified: selected.dateCollecte,
        age_days: daysSince(selected.dateCollecte),
        fresh_90d: daysSince(selected.dateCollecte) <= TARGETS.fraicheurJours,
        gps_valid: selected.gpsValid,
        fiche_complete: selected.ficheComplete,
        proof_photos: selected.photos_count,
        possible_duplicate: dupIds.has(selected.id),
      },
      commercial: {
        score: selected.score, potentiel: selected.potentiel_label, branding: selected.branding,
        eligible_branding: selected.eligibiliteBranding, grande_voie: selected.grandeVoie,
        operateurs: (["moov", "orange", "mtn", "wave"] as const).filter((o) => selected[o]).map((o) => OP_LABELS[o]),
      },
      events: events.map((e) => ({ type: e.type, label: e.label, date: e.date, actor: e.actor })),
      consent: { personal_data_included: includePersonal },
    };
    if (includePersonal) base.contact = { owner: selected.owner || null, phone: selected.phone || null };
    return base;
  }, [selected, events, includePersonal, dupIds]);

  const copyId = async () => {
    if (!selected) return;
    try { await navigator.clipboard.writeText(buildMerchantId(selected.id)); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* noop */ }
  };

  const exportRegistry = () => {
    const headers = ["Merchant ID", "Nom", "Commune", "Quartier", "Type", "Branding", "Score", "Dernière vérification", "Âge (jours)", "Frais (<90j)", "GPS valide", "Photos", "Contact valide", "Doublon suspect"];
    let csv = headers.join(",") + "\n";
    pool.forEach((p) => {
      const age = daysSince(p.dateCollecte);
      csv += [buildMerchantId(p.id), p.name, p.commune, p.quartier, p.type, p.branding, p.score, p.dateCollecte,
        age === 9999 ? "" : age, age <= TARGETS.fraicheurJours ? "Oui" : "Non", p.gpsValid ? "Oui" : "Non",
        p.photos_count, validPhone(p.phone) ? "Oui" : "Non", dupIds.has(p.id) ? "Oui" : "Non",
      ].map((f) => `"${String(f).replace(/"/g, '""')}"`).join(",") + "\n";
    });
    download("merchant_registry.csv", csv, "text/csv;charset=utf-8;");
  };

  const exportPassport = () => {
    if (!passport || !selected) return;
    download(`merchant_passport_${passport.merchant_id}.json`, JSON.stringify(passport, null, 2), "application/json");
  };

  if (!pool.length) {
    return (
      <div className="rounded-2xl p-10 text-center" style={{ background: C.pale, border: `1px dashed ${C.warm}` }}>
        <Network className="mx-auto mb-3" size={28} style={{ color: C.blue }} />
        <p className="text-sm font-semibold" style={{ color: C.text }}>Aucun marchand à afficher</p>
        <p className="text-xs mt-1" style={{ color: C.muted }}>Affinez ou réinitialisez les filtres globaux.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-12">

      {/* ── Bandeau d'introduction / périmètre ─────────────────────────── */}
      <div className="lg:col-span-12 rounded-2xl p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
           style={{ background: "#FFF", border: `1px solid ${C.warmL}` }}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#D6EAF6" }}>
            <Fingerprint size={18} style={{ color: C.blue }} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: C.text }}>Merchant Graph</p>
            <p className="text-xs max-w-2xl" style={{ color: C.muted }}>
              Chaque PDV reçoit une identité durable, un historique d'événements et des relations (zone, agent, opérateurs, pairs).
              La qualité de cette base est l'actif central de LanfiaLink.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-xl p-1 gap-0.5" style={{ background: C.pale, border: `1px solid ${C.warm}` }}>
            {([["filtres", `Filtres (${fmt(points.length)})`], ["base", `Toute la base (${fmt(allPoints?.length ?? points.length)})`]] as const).map(([v, l]) => (
              <button key={v} onClick={() => { setScope(v); setPage(0); }}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold"
                      style={scope === v ? { background: C.blue, color: "#FFF" } : { color: C.textSub }}>{l}</button>
            ))}
          </div>
          <button onClick={exportRegistry}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl"
                  style={{ background: C.blue, color: "#FFF" }}>
            <Download size={13} /> Registre CSV
          </button>
        </div>
      </div>

      {/* ── Qualité de la donnée ───────────────────────────────────────── */}
      <Card title="Qualité de la donnée" subtitle={`Seuils cibles de la stratégie 2027 · ${fmt(quality.total)} marchands analysés`}
            className="lg:col-span-12">
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-5">
          <QualityRow label="Fraîcheur" value={quality.fraicheurPct} unit="%" target={TARGETS.fraicheurPct}
                      hint={`${fmt(quality.stale)} fiches > ${TARGETS.fraicheurJours} j`} />
          <QualityRow label="Géolocalisation valide" value={quality.gpsPct} unit="%" target={TARGETS.gpsPct}
                      hint="proxy de la géoprécision" />
          <QualityRow label="Doublons / 1 000 fiches" value={quality.doublonsPour1000} unit="" target={TARGETS.doublonsPour1000}
                      higherIsBetter={false} hint={`${quality.doublonsCount} paire(s) suspecte(s)`} />
          <QualityRow label="Contact valide" value={quality.contactPct} unit="%" target={TARGETS.contactPct}
                      hint="numéro ≥ 8 chiffres" />
          <QualityRow label="Preuve photo" value={quality.preuvePct} unit="%" target={TARGETS.preuvePct}
                      hint="≥ 1 photo par PDV" />
        </div>
        {staleByCommune.length > 0 && (
          <div className="mt-5">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: C.blue }}>
              <Clock size={11} /> Zones à revisiter en priorité
            </p>
            <div className="grid gap-2 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
              {staleByCommune.map((r) => (
                <div key={r.commune} className="rounded-xl px-3 py-2" style={{ background: C.pale, border: `1px solid ${C.warmL}` }}>
                  <p className="text-xs font-bold truncate" style={{ color: C.text }}>{r.commune}</p>
                  <p className="text-[11px]" style={{ color: r.pct > 50 ? C.red : C.muted }}>
                    {r.pct}% périmés · {r.stale}/{r.total}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* ── Registre des Merchant ID ───────────────────────────────────── */}
      <Card title="Registre des marchands" subtitle="Merchant ID, fraîcheur et alertes de qualité"
            className="lg:col-span-7"
            right={
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.muted }} />
                <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                       placeholder="Nom, ID, commune…"
                       style={{ height: 32, borderRadius: 8, padding: "0 28px 0 28px", fontSize: 12, border: `1.5px solid ${C.warm}`, outline: "none", width: 190 }} />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: C.muted }}>
                    <X size={12} />
                  </button>
                )}
              </div>
            }>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.warmL}` }}>
                {["Merchant ID", "PDV", "Zone", "Vérifié", "Qualité"].map((h) => (
                  <th key={h} className="pb-3 pr-3 text-left text-xs font-bold uppercase tracking-wide whitespace-nowrap" style={{ color: C.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-sm" style={{ color: C.muted }}>Aucun résultat</td></tr>
              ) : pageRows.map(({ p, mid, age, dup }) => {
                const isSel = selected?.id === p.id;
                const fresh = age <= TARGETS.fraicheurJours;
                return (
                  <tr key={p.id} onClick={() => onSelect(p.id)} className="cursor-pointer"
                      style={{ borderBottom: `1px solid ${C.surface}`, background: isSel ? C.pale : "transparent" }}>
                    <td className="py-2.5 pr-3 font-mono text-[11px] font-bold whitespace-nowrap" style={{ color: C.blueD }}>{mid}</td>
                    <td className="py-2.5 pr-3 text-xs font-semibold whitespace-nowrap" style={{ color: C.text }}>{p.name}</td>
                    <td className="py-2.5 pr-3 text-xs whitespace-nowrap" style={{ color: C.muted }}>{p.commune}{p.quartier ? ` · ${p.quartier}` : ""}</td>
                    <td className="py-2.5 pr-3">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                            style={fresh ? { background: "#C8F0E2", color: "#044D38" } : { background: "#FFDDC8", color: "#7A2400" }}>
                        {age === 9999 ? "date ?" : `${age} j`}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-1.5" style={{ color: C.muted }}>
                        <MapPin size={12} style={{ color: p.gpsValid ? C.green : C.warm }} />
                        <Phone size={12} style={{ color: validPhone(p.phone) ? C.green : C.warm }} />
                        <Camera size={12} style={{ color: p.photos_count > 0 ? C.green : C.warm }} />
                        {dup && <AlertTriangle size={12} style={{ color: C.orange }} />}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-3 text-xs" style={{ color: C.muted }}>
          <span>{fmt(registry.length)} marchand(s) · page {safePage + 1}/{pageCount}</span>
          <div className="flex gap-2">
            <button disabled={safePage === 0} onClick={() => setPage(safePage - 1)}
                    className="px-2.5 py-1 rounded-lg font-semibold border disabled:opacity-40"
                    style={{ borderColor: C.warm, color: C.mutedD }}>Précédent</button>
            <button disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)}
                    className="px-2.5 py-1 rounded-lg font-semibold border disabled:opacity-40"
                    style={{ borderColor: C.warm, color: C.mutedD }}>Suivant</button>
          </div>
        </div>
        <p className="text-[10px] mt-2" style={{ color: C.muted }}>
          Icônes : position GPS · contact valide · photo de preuve · ⚠ doublon suspect (vert = OK, gris = manquant).
        </p>
      </Card>

      {/* ── Marchand sélectionné : identité + graphe ───────────────────── */}
      <div className="lg:col-span-5 space-y-4">
        {selected && (
          <Card title="Identité du marchand" subtitle="Identifiant indépendant de l'agent, du téléphone et de la campagne"
                right={
                  onOpenFiche ? (
                    <button onClick={() => onOpenFiche(selected.id)}
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                            style={{ background: C.pale, color: C.blue, border: `1px solid ${C.warm}` }}>Fiche →</button>
                  ) : undefined
                }>
            <div className="flex items-center justify-between gap-3 rounded-xl p-3" style={{ background: C.pale, border: `1px solid ${C.warmL}` }}>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.muted }}>Merchant ID</p>
                <p className="font-mono text-base font-bold truncate" style={{ color: C.blueD }}>{buildMerchantId(selected.id)}</p>
              </div>
              <button onClick={copyId} className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg shrink-0"
                      style={{ background: "#FFF", color: C.mutedD, border: `1px solid ${C.warm}` }}>
                <Copy size={12} /> {copied ? "Copié" : "Copier"}
              </button>
            </div>
            <p className="mt-3 text-sm font-bold" style={{ color: C.text }}>{selected.name}</p>
            <p className="text-xs" style={{ color: C.muted }}>
              {selected.commune}{selected.quartier ? ` · ${selected.quartier}` : ""} · {selected.type}
            </p>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[
                ["Score", `${selected.score}`],
                ["Vérifié", `${daysSince(selected.dateCollecte) === 9999 ? "?" : daysSince(selected.dateCollecte)} j`],
                ["Opérateurs", `${selected.nb_operateurs}/4`],
              ].map(([l, v]) => (
                <div key={l} className="rounded-lg px-2.5 py-2 text-center" style={{ background: C.surface }}>
                  <p className="text-[10px]" style={{ color: C.muted }}>{l}</p>
                  <p className="text-sm font-bold" style={{ color: C.text }}>{v}</p>
                </div>
              ))}
            </div>
            {dupIds.has(selected.id) && (
              <div className="mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-xs"
                   style={{ background: "#FFF6E5", border: "1px solid #F5D9A3", color: "#7A4A00" }}>
                <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                Doublon suspect détecté : voir le panneau « Déduplication » ci-dessous avant toute activation.
              </div>
            )}
          </Card>
        )}

        {selected && (
          <Card title="Merchant Passport" subtitle="Profil vérifié portable, à partager avec consentement">
            <label className="flex items-start gap-2 text-xs" style={{ color: C.mutedD }}>
              <input type="checkbox" className="mt-0.5" checked={includePersonal}
                     onChange={(e) => setIncludePersonal(e.target.checked)} />
              <span>
                Inclure les données personnelles (propriétaire, téléphone).
                <span className="block text-[10px]" style={{ color: C.muted }}>
                  À cocher uniquement si le commerçant a consenti à ce partage (loi n°2013-450).
                </span>
              </span>
            </label>
            <button onClick={exportPassport}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl"
                    style={{ background: C.blue, color: "#FFF" }}>
              <FileJson size={13} /> Exporter le passport (JSON)
            </button>
          </Card>
        )}
      </div>

      {/* ── Graphe relationnel + journal d'événements ──────────────────── */}
      {selected && (
        <>
          <Card title="Graphe relationnel" subtitle="Zone, agent, opérateurs, profil quartier et pairs du même quartier (cliquez un pair pour naviguer)"
                className="lg:col-span-7">
            <EgoGraph center={selected} pool={pool} onSelect={onSelect} />
          </Card>

          <Card title="Journal d'événements" subtitle="Historique dérivé des données collectées" className="lg:col-span-5">
            <ol className="relative ml-2 space-y-3 border-l" style={{ borderColor: C.warmL }}>
              {events.map((e, i) => (
                <li key={i} className="pl-4 relative">
                  <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full" style={{ background: e.color, border: "2px solid #FFF" }} />
                  <p className="text-xs font-semibold" style={{ color: C.text }}>{e.label}</p>
                  <p className="text-[10px]" style={{ color: C.muted }}>{e.date} · {e.actor}</p>
                </li>
              ))}
            </ol>
            <p className="text-[10px] mt-4" style={{ color: C.muted }}>
              Ces événements sont reconstitués à partir de l'état actuel de la fiche. Le vrai journal immuable (visites, commandes, changements d'enseigne…) doit être persisté côté API.
            </p>
          </Card>
        </>
      )}

      {/* ── Déduplication ──────────────────────────────────────────────── */}
      <Card title="Déduplication" subtitle={`${quality.doublonsCount} paire(s) suspecte(s) · ${quality.merchantsConcernes} marchand(s) concerné(s)`}
            className="lg:col-span-12"
            right={
              <div className="inline-flex rounded-xl p-1 gap-0.5" style={{ background: C.pale, border: `1px solid ${C.warm}` }}>
                {(["Toutes", "Élevée", "Moyenne"] as const).map((v) => (
                  <button key={v} onClick={() => setDupFilter(v)} className="rounded-lg px-2.5 py-1 text-xs font-semibold"
                          style={dupFilter === v ? { background: C.blue, color: "#FFF" } : { color: C.textSub }}>{v}</button>
                ))}
              </div>
            }>
        {visibleDups.length === 0 ? (
          <div className="rounded-xl p-6 text-center" style={{ background: C.pale, border: `1px dashed ${C.warm}` }}>
            <ShieldCheck className="mx-auto mb-2" size={22} style={{ color: C.green }} />
            <p className="text-sm font-semibold" style={{ color: C.text }}>Aucun doublon suspect</p>
            <p className="text-xs mt-0.5" style={{ color: C.muted }}>Critères : nom proche à moins de {TARGETS.dedupDistanceM} m, même nom dans la même zone, ou même téléphone.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.warmL}` }}>
                  {["PDV A", "PDV B", "Motif", "Distance", "Confiance", "Action"].map((h) => (
                    <th key={h} className="pb-3 pr-4 text-left text-xs font-bold uppercase tracking-wide whitespace-nowrap" style={{ color: C.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleDups.map((d, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.surface}` }}>
                    <td className="py-2.5 pr-4">
                      <p className="text-xs font-semibold" style={{ color: C.text }}>{d.a.name}</p>
                      <p className="font-mono text-[10px]" style={{ color: C.blueD }}>{buildMerchantId(d.a.id)}</p>
                    </td>
                    <td className="py-2.5 pr-4">
                      <p className="text-xs font-semibold" style={{ color: C.text }}>{d.b.name}</p>
                      <p className="font-mono text-[10px]" style={{ color: C.blueD }}>{buildMerchantId(d.b.id)}</p>
                    </td>
                    <td className="py-2.5 pr-4 text-xs" style={{ color: C.muted }}>{d.reason}</td>
                    <td className="py-2.5 pr-4 text-xs" style={{ color: C.muted }}>{d.distanceM === null ? "—" : `${Math.round(d.distanceM)} m`}</td>
                    <td className="py-2.5 pr-4">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                            style={d.confidence === "Élevée" ? { background: "#FFDDC8", color: "#7A2400" } : { background: "#FFF6E5", color: "#7A4A00" }}>
                        {d.confidence}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <div className="flex gap-1.5">
                        <button onClick={() => onSelect(d.a.id)} className="text-[11px] font-semibold px-2 py-1 rounded-lg"
                                style={{ background: C.pale, color: C.blue, border: `1px solid ${C.warm}` }}>Voir A</button>
                        <button onClick={() => onSelect(d.b.id)} className="text-[11px] font-semibold px-2 py-1 rounded-lg"
                                style={{ background: C.pale, color: C.blue, border: `1px solid ${C.warm}` }}>Voir B</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-[10px] mt-3" style={{ color: C.muted }}>
          Les doublons sont des suspicions : la fusion ou la suppression doit rester une décision humaine (data steward).
        </p>
      </Card>

      {/*
        ─────────────────────────────────────────────────────────────────────
        NOTES D'ÉVOLUTION BACKEND (Django REST Framework)
        1. Persister `merchant_id` sur le modèle PointVente (champ unique, non modifiable).
        2. Créer un modèle MerchantEvent append-only : merchant, type, payload(JSON), actor,
           occurred_at, source (mobile / dashboard / import). Jamais d'UPDATE ni de DELETE.
        3. Exposer GET /api/merchants/<merchant_id>/events/ et /passport/.
        4. Calculer les indicateurs de qualité côté serveur quand la base dépasse quelques milliers de PDV.
        ─────────────────────────────────────────────────────────────────────
      */}
    </div>
  );
}