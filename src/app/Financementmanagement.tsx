"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import {
  Landmark, Search, Download, RefreshCw, Loader2, AlertTriangle, X, CheckCircle2, Clock,
  TrendingUp, TrendingDown, Minus, Store, ShieldCheck, ChevronLeft, ChevronRight, FileText,
  Gauge, Wallet, Printer, Activity, Package, SlidersHorizontal, XCircle, Save,
} from "lucide-react";
import { apiService } from "./ApiService";

/* ─────────────────────────────────────────────────────────────────────────
   Palette (cohérente avec AdminDashboard / LanfiaLinkDashboard)
   ───────────────────────────────────────────────────────────────────────── */
const P = {
  navy: "#0A1E2E", blue: "#1A8FD1", blueL: "#4FB3E8", blueD: "#0D6FAB", banner: "#0D4E7A",
  pale: "#EDF5FA", surface: "#F0F5F9", warm: "#C0D4E6", warmL: "#D4E4F0",
  text: "#0A1E2E", textSub: "#2A4A62", muted: "#5A7A92", mutedD: "#1A4A6A",
  green: "#10B981", orange: "#F59E0B", red: "#EF4444", purple: "#8B5CF6", teal: "#14B8A6", gray: "#8AA6BA",
};

/* ─────────────────────────────────────────────────────────────────────────
   Statuts
   ───────────────────────────────────────────────────────────────────────── */
type EligKey = "eligible" | "conditions" | "surveiller" | "non_eligible" | "insuffisant";
const ELIG: Record<EligKey, { label: string; short: string; bg: string; fg: string; dot: string; factor: number; hint: string }> = {
  eligible:     { label: "Éligible",              short: "Éligible",     bg: "#DCF5EC", fg: "#044D38", dot: P.green,  factor: 1,    hint: "Historique solide : dossier prêt à être constitué." },
  conditions:   { label: "Éligible sous conditions", short: "Sous conditions", bg: "#DDEBFA", fg: "#0A4A80", dot: P.blue,   factor: 0.6,  hint: "Bon profil, mais certains points doivent être corrigés ou garantis." },
  surveiller:   { label: "À surveiller",          short: "À surveiller", bg: "#FBEFD6", fg: "#7A4F00", dot: P.orange, factor: 0.25, hint: "Activité insuffisante ou irrégulière : réévaluer plus tard." },
  non_eligible: { label: "Non éligible",          short: "Non éligible", bg: "#FCE4DC", fg: "#7A2410", dot: P.red,    factor: 0,    hint: "Le profil actuel ne permet pas un financement." },
  insuffisant:  { label: "Données insuffisantes", short: "Insuffisant",  bg: "#EAF0F5", fg: "#3A5A72", dot: P.gray,   factor: 0,    hint: "Pas assez de commandes ou d'historique pour évaluer." },
};

type DossierKey = "aucun" | "preparation" | "transmis" | "approuve" | "decaisse" | "refuse" | "suspendu";
const DOSSIER: Record<DossierKey, { label: string; bg: string; fg: string }> = {
  aucun:       { label: "Non engagé",              bg: "#EAF0F5", fg: "#3A5A72" },
  preparation: { label: "Dossier en préparation",  bg: "#DDEBFA", fg: "#0A4A80" },
  transmis:    { label: "Transmis au partenaire",  bg: "#EADFFB", fg: "#4B2A94" },
  approuve:    { label: "Approuvé",                bg: "#DCF5EC", fg: "#044D38" },
  decaisse:    { label: "Décaissé",                bg: "#C8F0E2", fg: "#033728" },
  refuse:      { label: "Refusé",                  bg: "#FCE4DC", fg: "#7A2410" },
  suspendu:    { label: "Suspendu",                bg: "#FBEFD6", fg: "#7A4F00" },
};
const DOSSIER_KEYS = Object.keys(DOSSIER) as DossierKey[];

interface DossierEntry {
  status: DossierKey; requested: string; note: string; updatedAt: string;
  history: { status: DossierKey; at: string }[];
}
const DOSSIER_STORAGE_KEY = "lanfialink_financement_dossiers_v1";

// ── À remplacer par l'API le jour où le backend expose les dossiers ──────────
function loadDossiers(): Record<number, DossierEntry> {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(DOSSIER_STORAGE_KEY) : null;
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
function saveDossier(all: Record<number, DossierEntry>) {
  try { window.localStorage.setItem(DOSSIER_STORAGE_KEY, JSON.stringify(all)); } catch { /* quota / mode privé */ }
}

/* ─────────────────────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────────────────────── */
type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
interface RawOrder {
  id: number; point_of_sale?: number | null;
  point_of_sale_details?: { id: number; name?: string; address?: string; owner?: string; phone?: string; nature?: any } | null;
  status: OrderStatus; total: string; date: string; delivery_date?: string | null;
  items?: { product_name?: string; name?: string; product_variant?: { product?: { name?: string } }; total?: string; quantity?: number }[];
}
interface PosBase {
  id: number; name: string; commune: string; quartier: string; nature: string;
  owner: string; phone: string; address: string;
  hasAnalytics: boolean; scoreGlobal: number; caDeclare: number;
  gpsValid: boolean; ficheComplete: boolean; nbOperateurs: number; ancienneteAnnees: number; potentielLabel: string;
}
interface ScoreLine { key: string; label: string; weight: number; value: number; detail: string; color: string }
interface Alert { level: "high" | "medium" | "low"; text: string }
interface Check { label: string; ok: boolean; detail: string }
interface MonthPoint { key: string; label: string; orders: number; gmv: number }
interface Profile extends PosBase {
  orders: RawOrder[];            // toutes les commandes (annulées incluses), triées par date desc
  nbValid: number; nbCancelled: number; nbDelivered: number; nbPending: number;
  gmv: number; avgBasket: number; avgMonthlyGmv: number; ordersPerMonth: number;
  avgIntervalDays: number | null; intervalCv: number | null;
  daysSinceLast: number | null; lastOrderDate: string | null; firstOrderDate: string | null; historyDays: number;
  growthPct: number | null; cancelRate: number; deliveredRate: number; avgLeadDays: number | null;
  topProduct: { name: string; share: number } | null; distinctProducts: number;
  finScore: number; elig: EligKey; scoreLines: ScoreLine[]; alerts: Alert[]; checks: Check[];
  ceiling: number; monthly: MonthPoint[];
}
interface Config { periodDays: number | null; benchmarkMonthly: number; multiple: number }

/* ─────────────────────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────────────────────── */
const DAY = 86400000;
const num = (v: any) => { const n = parseFloat(String(v ?? 0)); return Number.isFinite(n) ? n : 0; };
const money = (v: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(Math.round(v || 0));
const compact = (v: number) => {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1).replace(".", ",")} Md`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1).replace(".", ",")} M`;
  if (v >= 1e3) return `${Math.round(v / 1e3)} k`;
  return String(Math.round(v));
};
const fdate = (s?: string | null) => (s ? new Date(s).toLocaleDateString("fr-FR") : "—");
const clamp = (v: number, a = 0, b = 100) => Math.max(a, Math.min(b, v));
const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const std = (a: number[]) => { const m = mean(a); return Math.sqrt(mean(a.map((x) => (x - m) ** 2))); };
const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const normalizeNature = (raw: any): string => {
  if (raw == null) return "";
  const v = typeof raw === "string" ? raw : (raw.value ?? raw.code ?? raw.slug ?? raw.label ?? raw.name ?? "");
  return String(v).trim().toLowerCase().replace(/[\s-]+/g, "_");
};
const natureLabel = (n: string) =>
  n === "distributeur_secondaire" ? "Distributeur secondaire" : n === "pdv" ? "Point de vente" : n ? n.replace(/_/g, " ") : "—";
const orderTimestamp = (o: RawOrder) => new Date(o.date).getTime();

const STATUS_LABEL: Record<OrderStatus, { label: string; bg: string; fg: string }> = {
  pending:   { label: "En attente", bg: "#FBEFD6", fg: "#7A4F00" },
  confirmed: { label: "Confirmée",  bg: "#DDEBFA", fg: "#0A4A80" },
  shipped:   { label: "Expédiée",   bg: "#EADFFB", fg: "#4B2A94" },
  delivered: { label: "Livrée",     bg: "#DCF5EC", fg: "#044D38" },
  cancelled: { label: "Annulée",    bg: "#FCE4DC", fg: "#7A2410" },
};

// Certaines API DRF paginent ({count,next,results}) : on suit "next" pour tout récupérer.
const extractList = <T,>(json: any): T[] => (Array.isArray(json) ? json : Array.isArray(json?.results) ? json.results : []);
async function fetchAll<T>(path: string): Promise<T[]> {
  const res = await apiService.get(path);
  if (!res.ok) throw new Error(`Erreur ${res.status} sur ${path}`);
  let json = await res.json();
  const out: T[] = extractList<T>(json);
  let next: string | null = json?.next ?? null;
  let guard = 0;
  while (next && guard++ < 50) {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("access") : null;
    const r = await fetch(next, { headers: token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : {} });
    if (!r.ok) break;
    json = await r.json();
    out.push(...extractList<T>(json));
    next = json?.next ?? null;
  }
  return out;
}

/* ─────────────────────────────────────────────────────────────────────────
   Moteur d'analyse : transactions → indicateurs → score → statut
   ───────────────────────────────────────────────────────────────────────── */
const WEIGHTS = { frequence: 20, regularite: 15, volume: 20, croissance: 10, fiabilite: 15, recence: 10, dossier: 10 };

function buildProfile(base: PosBase, orders: RawOrder[], cfg: Config, now: number): Profile {
  const sorted = [...orders].sort((a, b) => orderTimestamp(b) - orderTimestamp(a));
  const allValid = sorted.filter((o) => o.status !== "cancelled");
  const winStart = cfg.periodDays ? now - cfg.periodDays * DAY : 0;
  const win = sorted.filter((o) => orderTimestamp(o) >= winStart);
  const winValid = win.filter((o) => o.status !== "cancelled");
  const winCancelled = win.length - winValid.length;

  const firstTs = allValid.length ? Math.min(...allValid.map(orderTimestamp)) : null;
  const lastTs = allValid.length ? Math.max(...allValid.map(orderTimestamp)) : null;
  const historyDays = firstTs ? Math.max(0, (now - firstTs) / DAY) : 0;
  const daysSinceLast = lastTs ? Math.max(0, Math.floor((now - lastTs) / DAY)) : null;

  const windowMonths = cfg.periodDays ? cfg.periodDays / 30 : Math.max(1, historyDays / 30);
  const monthsSpan = Math.max(1, Math.min(windowMonths, Math.max(1, historyDays / 30)));
  const gmv = winValid.reduce((s, o) => s + num(o.total), 0);
  const ordersPerMonth = winValid.length / monthsSpan;
  const avgMonthlyGmv = gmv / monthsSpan;
  const avgBasket = winValid.length ? gmv / winValid.length : 0;

  // Régularité : intervalles entre commandes successives
  const ts = winValid.map(orderTimestamp).sort((a, b) => a - b);
  const intervals: number[] = [];
  for (let i = 1; i < ts.length; i++) intervals.push((ts[i] - ts[i - 1]) / DAY);
  const avgIntervalDays = intervals.length ? mean(intervals) : null;
  const intervalCv = intervals.length >= 2 && mean(intervals) > 0 ? std(intervals) / mean(intervals) : null;

  // Tendance : 90 derniers jours vs 90 jours précédents
  const sum = (from: number, to: number) =>
    allValid.filter((o) => { const t = orderTimestamp(o); return t > from && t <= to; }).reduce((s, o) => s + num(o.total), 0);
  const recent = sum(now - 90 * DAY, now);
  const prev = sum(now - 180 * DAY, now - 90 * DAY);
  const growthPct = prev > 0 ? ((recent - prev) / prev) * 100 : null;

  const nbDelivered = winValid.filter((o) => o.status === "delivered").length;
  const nbPending = winValid.filter((o) => o.status === "pending").length;
  const deliveredRate = winValid.length ? nbDelivered / winValid.length : 0;
  const cancelRate = win.length ? winCancelled / win.length : 0;

  const leads = winValid
    .filter((o) => o.delivery_date && o.date)
    .map((o) => (new Date(o.delivery_date as string).getTime() - orderTimestamp(o)) / DAY)
    .filter((d) => d >= 0);
  const avgLeadDays = leads.length ? mean(leads) : null;

  // Concentration produit
  const prodMap = new Map<string, number>();
  winValid.forEach((o) => (o.items || []).forEach((it) => {
    const name = it.product_name || it.name || it.product_variant?.product?.name || "Produit";
    prodMap.set(name, (prodMap.get(name) || 0) + num(it.total));
  }));
  const prodTotal = Array.from(prodMap.values()).reduce((a, b) => a + b, 0);
  const topEntry = Array.from(prodMap.entries()).sort((a, b) => b[1] - a[1])[0];
  const topProduct = topEntry && prodTotal > 0 ? { name: topEntry[0], share: topEntry[1] / prodTotal } : null;

  // Série mensuelle (12 derniers mois)
  const monthly: MonthPoint[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(new Date(now).getFullYear(), new Date(now).getMonth() - i, 1);
    monthly.push({ key: monthKey(d), label: d.toLocaleDateString("fr-FR", { month: "short" }), orders: 0, gmv: 0 });
  }
  allValid.forEach((o) => {
    const m = monthly.find((x) => x.key === monthKey(new Date(o.date)));
    if (m) { m.orders += 1; m.gmv += num(o.total); }
  });

  // ── Sous-scores (0-100) ───────────────────────────────────────────────────
  const sFreq = clamp((ordersPerMonth / 4) * 100); // 4 commandes / mois = 100
  const sReg = intervalCv === null ? 30 : clamp(100 - intervalCv * 100);
  const sVol = clamp((avgMonthlyGmv / Math.max(cfg.benchmarkMonthly, 1)) * 100);
  const sGrowth = growthPct === null ? (recent > 0 ? 60 : 30) : clamp(50 + growthPct);
  const sReliab = clamp(100 * (0.5 * (1 - cancelRate) + 0.5 * deliveredRate));
  const sRecency = daysSinceLast === null ? 0 : clamp(100 - ((daysSinceLast - 15) / (120 - 15)) * 100);
  const sFile = base.hasAnalytics
    ? clamp((base.ficheComplete ? 30 : 0) + (base.gpsValid ? 25 : 0) + (base.nbOperateurs / 4) * 25 + Math.min(20, base.ancienneteAnnees * 5))
    : 0;

  const scoreLines: ScoreLine[] = [
    { key: "frequence", label: "Fréquence des commandes", weight: WEIGHTS.frequence, value: sFreq, color: P.blue,
      detail: `${ordersPerMonth.toFixed(1)} commande(s) / mois (100 = 4 par mois)` },
    { key: "regularite", label: "Régularité", weight: WEIGHTS.regularite, value: sReg, color: P.teal,
      detail: intervalCv === null ? "Pas assez de commandes pour mesurer la régularité" : `Intervalle moyen ${avgIntervalDays!.toFixed(0)} j, variabilité ${(intervalCv * 100).toFixed(0)} %` },
    { key: "volume", label: "Volume d'achat", weight: WEIGHTS.volume, value: sVol, color: P.purple,
      detail: `${money(avgMonthlyGmv)} / mois (objectif ${money(cfg.benchmarkMonthly)})` },
    { key: "croissance", label: "Tendance", weight: WEIGHTS.croissance, value: sGrowth, color: P.green,
      detail: growthPct === null ? "Pas de période de comparaison (90 j précédents)" : `${growthPct >= 0 ? "+" : ""}${growthPct.toFixed(0)} % vs 90 jours précédents` },
    { key: "fiabilite", label: "Fiabilité d'exécution", weight: WEIGHTS.fiabilite, value: sReliab, color: P.orange,
      detail: `${(cancelRate * 100).toFixed(0)} % annulées · ${(deliveredRate * 100).toFixed(0)} % livrées` },
    { key: "recence", label: "Activité récente", weight: WEIGHTS.recence, value: sRecency, color: P.blueD,
      detail: daysSinceLast === null ? "Aucune commande" : `Dernière commande il y a ${daysSinceLast} j` },
    { key: "dossier", label: "Qualité de la fiche PDV", weight: WEIGHTS.dossier, value: sFile, color: P.navy,
      detail: base.hasAnalytics ? `Fiche ${base.ficheComplete ? "complète" : "incomplète"} · GPS ${base.gpsValid ? "valide" : "non valide"} · ${base.nbOperateurs}/4 opérateurs` : "Fiche analytique non rattachée à ce point de vente" },
  ];
  const totalW = scoreLines.reduce((s, l) => s + l.weight, 0);
  const finScore = Math.round(scoreLines.reduce((s, l) => s + l.value * l.weight, 0) / totalW);

  // ── Statut automatique ────────────────────────────────────────────────────
  let elig: EligKey;
  const insufficient = winValid.length < 3 || historyDays < 30;
  if (insufficient) elig = "insuffisant";
  else if (finScore >= 75) elig = "eligible";
  else if (finScore >= 55) elig = "conditions";
  else if (finScore >= 40) elig = "surveiller";
  else elig = "non_eligible";
  if ((elig === "eligible" || elig === "conditions") && daysSinceLast !== null && daysSinceLast > 90) elig = "surveiller";

  // ── Alertes & contrôles ───────────────────────────────────────────────────
  const alerts: Alert[] = [];
  if (insufficient) alerts.push({ level: "medium", text: `Moins de 3 commandes valides ou moins de 30 jours d'historique : évaluation non fiable.` });
  if (daysSinceLast !== null && daysSinceLast > 45) alerts.push({ level: daysSinceLast > 90 ? "high" : "medium", text: `Aucune commande depuis ${daysSinceLast} jours.` });
  if (win.length >= 5 && cancelRate > 0.15) alerts.push({ level: cancelRate > 0.3 ? "high" : "medium", text: `Taux d'annulation élevé : ${(cancelRate * 100).toFixed(0)} %.` });
  if (growthPct !== null && growthPct < -30) alerts.push({ level: "high", text: `Activité en forte baisse : ${growthPct.toFixed(0)} % sur 90 jours.` });
  if (topProduct && topProduct.share > 0.7 && prodMap.size > 1) alerts.push({ level: "low", text: `Achats concentrés sur « ${topProduct.name} » (${(topProduct.share * 100).toFixed(0)} %).` });
  const stalled = winValid.filter((o) => o.status === "pending" && now - orderTimestamp(o) > 30 * DAY).length;
  if (stalled > 0) alerts.push({ level: "medium", text: `${stalled} commande(s) en attente depuis plus de 30 jours.` });
  if (!base.hasAnalytics) alerts.push({ level: "low", text: "Aucune fiche analytique rattachée (GPS, opérateurs, ancienneté inconnus)." });
  else {
    if (!base.ficheComplete) alerts.push({ level: "medium", text: "Fiche PDV incomplète." });
    if (!base.gpsValid) alerts.push({ level: "medium", text: "Coordonnées GPS non valides." });
  }

  const checks: Check[] = [
    { label: "Au moins 3 commandes valides", ok: winValid.length >= 3, detail: `${winValid.length} sur la période` },
    { label: "Au moins 30 jours d'historique", ok: historyDays >= 30, detail: `${Math.floor(historyDays)} jours` },
    { label: "Commande dans les 45 derniers jours", ok: daysSinceLast !== null && daysSinceLast <= 45, detail: daysSinceLast === null ? "Aucune" : `Il y a ${daysSinceLast} j` },
    { label: "Taux d'annulation inférieur à 15 %", ok: cancelRate < 0.15, detail: `${(cancelRate * 100).toFixed(0)} %` },
    { label: "Activité non en forte baisse", ok: growthPct === null || growthPct >= -30, detail: growthPct === null ? "Non mesurable" : `${growthPct.toFixed(0)} %` },
    { label: "Fiche PDV complète", ok: base.hasAnalytics && base.ficheComplete, detail: base.hasAnalytics ? (base.ficheComplete ? "Oui" : "Non") : "Non rattachée" },
    { label: "GPS valide", ok: base.hasAnalytics && base.gpsValid, detail: base.hasAnalytics ? (base.gpsValid ? "Oui" : "Non") : "Non rattachée" },
  ];

  const ceiling = Math.round((avgMonthlyGmv * cfg.multiple * ELIG[elig].factor) / 1000) * 1000;

  return {
    ...base, orders: sorted,
    nbValid: winValid.length, nbCancelled: winCancelled, nbDelivered, nbPending,
    gmv, avgBasket, avgMonthlyGmv, ordersPerMonth, avgIntervalDays, intervalCv,
    daysSinceLast, lastOrderDate: lastTs ? new Date(lastTs).toISOString() : null,
    firstOrderDate: firstTs ? new Date(firstTs).toISOString() : null, historyDays,
    growthPct, cancelRate, deliveredRate, avgLeadDays, topProduct, distinctProducts: prodMap.size,
    finScore, elig, scoreLines, alerts, checks, ceiling, monthly,
  };
}

/* ─────────────────────────────────────────────────────────────────────────
   Petits composants UI
   ───────────────────────────────────────────────────────────────────────── */
const card: React.CSSProperties = { background: "#fff", border: `1px solid ${P.warmL}`, borderRadius: 16, boxShadow: "0 1px 6px rgba(13,80,140,0.06)" };
const inputStyle: React.CSSProperties = {
  height: 36, borderRadius: 10, padding: "0 10px", fontSize: 13, background: "#fff",
  border: `1.5px solid ${P.warm}`, color: P.text, outline: "none", fontFamily: "inherit",
};

const Pill = ({ bg, fg, children, dot }: { bg: string; fg: string; children: React.ReactNode; dot?: string }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 9999, fontSize: 11, fontWeight: 700, background: bg, color: fg, whiteSpace: "nowrap" }}>
    {dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot }} />}{children}
  </span>
);
const EligPill = ({ k, short }: { k: EligKey; short?: boolean }) => (
  <Pill bg={ELIG[k].bg} fg={ELIG[k].fg} dot={ELIG[k].dot}>{short ? ELIG[k].short : ELIG[k].label}</Pill>
);
const DossierPill = ({ k }: { k: DossierKey }) => <Pill bg={DOSSIER[k].bg} fg={DOSSIER[k].fg}>{DOSSIER[k].label}</Pill>;

function ScoreRing({ score, size = 44, color }: { score: number; size?: number; color: string }) {
  const r = (size - 6) / 2, c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={P.surface} strokeWidth={5} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round"
                strokeDasharray={c} strokeDashoffset={c * (1 - clamp(score) / 100)} />
      </svg>
      <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size > 60 ? 20 : 13, fontWeight: 800, color: P.text }}>{score}</span>
    </div>
  );
}

function Trend({ pct }: { pct: number | null }) {
  if (pct === null) return <span style={{ color: P.muted, fontSize: 12 }}>—</span>;
  const up = pct > 5, down = pct < -5;
  const Icon = up ? TrendingUp : down ? TrendingDown : Minus;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 12, fontWeight: 700, color: up ? "#047857" : down ? "#B03318" : P.muted }}>
      <Icon size={12} />{pct > 0 ? "+" : ""}{pct.toFixed(0)}%
    </span>
  );
}

function Kpi({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div style={{ ...card, padding: 16, display: "flex", justifyContent: "space-between", gap: 10 }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: P.muted, margin: 0 }}>{label}</p>
        <p style={{ fontSize: 24, fontWeight: 800, color: P.text, margin: "6px 0 0", fontVariantNumeric: "tabular-nums" }}>{value}</p>
        {sub && <p style={{ fontSize: 11, color: P.muted, margin: "3px 0 0" }}>{sub}</p>}
      </div>
      <div style={{ width: 40, height: 40, borderRadius: 11, background: `${color}1A`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={18} style={{ color }} />
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div style={{ background: P.pale, border: `1px solid ${P.warmL}`, borderRadius: 12, padding: "10px 12px" }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: P.muted, margin: 0 }}>{label}</p>
      <p style={{ fontSize: 16, fontWeight: 800, color: P.text, margin: "3px 0 0" }}>{value}</p>
      {sub && <p style={{ fontSize: 10, color: P.muted, margin: "2px 0 0" }}>{sub}</p>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Fiche de financement d'un PDV (panneau détaillé)
   ───────────────────────────────────────────────────────────────────────── */
function FicheFinancement({ p, cfg, dossier, onSave, onClose }: {
  p: Profile; cfg: Config; dossier: DossierEntry | undefined;
  onSave: (entry: DossierEntry) => void; onClose: () => void;
}) {
  const [status, setStatus] = useState<DossierKey>(dossier?.status ?? "aucun");
  const [requested, setRequested] = useState(dossier?.requested ?? "");
  const [note, setNote] = useState(dossier?.note ?? "");
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<"analyse" | "transactions">("analyse");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSave = () => {
    const now = new Date().toISOString();
    const changed = status !== (dossier?.status ?? "aucun");
    onSave({
      status, requested, note, updatedAt: now,
      history: changed || !dossier ? [...(dossier?.history ?? []), { status, at: now }] : dossier.history,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const requestedNum = num(requested);
  const overCeiling = requestedNum > 0 && p.ceiling > 0 && requestedNum > p.ceiling;
  const passed = p.checks.filter((c) => c.ok).length;

  const handlePrint = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    const esc = (s: any) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as any)[c]);
    w.document.write(`<!DOCTYPE html><html><head><title>Fiche financement - ${esc(p.name)}</title>
      <style>body{font-family:system-ui,sans-serif;padding:28px;color:#0A1E2E}h1{color:#0D6FAB;margin:0 0 4px}
      table{width:100%;border-collapse:collapse;margin:10px 0 18px;font-size:13px}th,td{border:1px solid #C0D4E6;padding:7px 9px;text-align:left}th{background:#EDF5FA}
      .k{display:inline-block;margin:0 14px 8px 0}.k b{display:block;font-size:18px}</style></head><body>
      <h1>${esc(p.name)}</h1><p>${esc(natureLabel(p.nature))} · ${esc(p.commune)} ${esc(p.quartier)} · ${esc(p.owner)} ${esc(p.phone)}</p>
      <p><strong>Pré-éligibilité :</strong> ${esc(ELIG[p.elig].label)} (score ${p.finScore}/100) · <strong>Dossier :</strong> ${esc(DOSSIER[status].label)}</p>
      <div><span class="k">Commandes<b>${p.nbValid}</b></span><span class="k">Volume<b>${esc(money(p.gmv))}</b></span>
      <span class="k">Moyenne mensuelle<b>${esc(money(p.avgMonthlyGmv))}</b></span><span class="k">Plafond indicatif<b>${esc(money(p.ceiling))}</b></span></div>
      <h3>Détail du score</h3><table><tr><th>Critère</th><th>Poids</th><th>Note</th><th>Détail</th></tr>
      ${p.scoreLines.map((l) => `<tr><td>${esc(l.label)}</td><td>${l.weight}</td><td>${Math.round(l.value)}/100</td><td>${esc(l.detail)}</td></tr>`).join("")}</table>
      <h3>Transactions</h3><table><tr><th>Commande</th><th>Date</th><th>Statut</th><th>Total</th></tr>
      ${p.orders.map((o) => `<tr><td>CMD-${o.id}</td><td>${esc(fdate(o.date))}</td><td>${esc(STATUS_LABEL[o.status]?.label || o.status)}</td><td>${esc(money(num(o.total)))}</td></tr>`).join("")}</table>
      <p style="color:#5A7A92;font-size:11px">Document d'aide à la décision généré le ${new Date().toLocaleDateString("fr-FR")}. Le plafond est indicatif ; la décision appartient au partenaire financier.</p>
      <script>window.onload=()=>window.print()</script></body></html>`);
    w.document.close();
  };

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()}
         style={{ position: "fixed", inset: 0, background: "rgba(10,21,32,0.55)", backdropFilter: "blur(3px)", zIndex: 60, display: "flex", justifyContent: "flex-end" }}>
      <div style={{ width: "min(980px, 100%)", height: "100%", background: "#F7FAFC", display: "flex", flexDirection: "column", boxShadow: "-12px 0 40px rgba(10,21,32,0.25)" }}>
        {/* En-tête */}
        <div style={{ background: P.banner, padding: "18px 22px", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ color: "rgba(200,230,248,0.85)", fontSize: 12, fontWeight: 600, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                <Landmark size={13} /> Fiche de financement · {natureLabel(p.nature)}
              </p>
              <h2 style={{ color: "#fff", fontSize: 21, fontWeight: 800, margin: "4px 0 2px" }}>{p.name}</h2>
              <p style={{ color: "rgba(200,230,248,0.85)", fontSize: 12, margin: 0 }}>
                {[p.commune, p.quartier].filter(Boolean).join(" · ") || "Localisation inconnue"}
                {p.owner ? ` · ${p.owner}` : ""}{p.phone ? ` · ${p.phone}` : ""}
              </p>
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                <EligPill k={p.elig} />
                <DossierPill k={status} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
              <div style={{ background: "#fff", borderRadius: 14, padding: 6 }}>
                <ScoreRing score={p.finScore} size={64} color={ELIG[p.elig].dot} />
              </div>
              <button onClick={handlePrint} title="Imprimer la fiche" aria-label="Imprimer la fiche"
                      style={{ background: "rgba(255,255,255,0.16)", border: "none", borderRadius: 10, padding: 9, cursor: "pointer", color: "#fff", display: "flex" }}><Printer size={16} /></button>
              <button onClick={onClose} aria-label="Fermer"
                      style={{ background: "rgba(255,255,255,0.16)", border: "none", borderRadius: 10, padding: 9, cursor: "pointer", color: "#fff", display: "flex" }}><X size={16} /></button>
            </div>
          </div>
          <p style={{ color: "rgba(200,230,248,0.8)", fontSize: 11, margin: "10px 0 0" }}>{ELIG[p.elig].hint}</p>
        </div>

        {/* Onglets */}
        <div style={{ display: "flex", gap: 4, padding: "0 16px", background: "#fff", borderBottom: `1px solid ${P.warmL}`, flexShrink: 0 }}>
          {([["analyse", "Analyse & décision", Gauge], ["transactions", `Transactions (${p.orders.length})`, Package]] as const).map(([k, label, Icon]) => (
            <button key={k} onClick={() => setTab(k)}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "12px 14px", fontSize: 12, fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
                             color: tab === k ? P.blue : P.muted, borderBottom: `2.5px solid ${tab === k ? P.blue : "transparent"}`, marginBottom: -1 }}>
              <Icon size={13} />{label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>
          {tab === "analyse" && (<>
            {/* Indicateurs clés */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
              <Stat label="Commandes valides" value={p.nbValid} sub={`${p.nbCancelled} annulée(s)`} />
              <Stat label="Fréquence" value={`${p.ordersPerMonth.toFixed(1)} / mois`} sub={p.avgIntervalDays !== null ? `1 commande tous les ${p.avgIntervalDays.toFixed(0)} j` : "Intervalle non mesurable"} />
              <Stat label="Volume d'achat" value={money(p.gmv)} sub={`Panier moyen ${money(p.avgBasket)}`} />
              <Stat label="Moyenne mensuelle" value={money(p.avgMonthlyGmv)} />
              <Stat label="Tendance 90 j" value={<Trend pct={p.growthPct} />} />
              <Stat label="Dernière commande" value={p.daysSinceLast === null ? "—" : `Il y a ${p.daysSinceLast} j`} sub={fdate(p.lastOrderDate)} />
              <Stat label="Livraison" value={`${(p.deliveredRate * 100).toFixed(0)} % livrées`} sub={p.avgLeadDays !== null ? `Délai moyen ${p.avgLeadDays.toFixed(0)} j` : undefined} />
              <Stat label="Diversité produits" value={p.distinctProducts} sub={p.topProduct ? `Top : ${p.topProduct.name} (${(p.topProduct.share * 100).toFixed(0)} %)` : undefined} />
            </div>

            {/* Graphique */}
            <div style={{ ...card, padding: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: P.text, margin: "0 0 2px" }}>Rythme des commandes — 12 derniers mois</p>
              <p style={{ fontSize: 11, color: P.muted, margin: "0 0 10px" }}>Barres : volume d'achat (XOF) · Ligne : nombre de commandes</p>
              <div style={{ height: 230 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={p.monthly} margin={{ top: 6, right: 6, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={P.surface} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: P.muted }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="g" tick={{ fontSize: 10, fill: P.muted }} axisLine={false} tickLine={false} tickFormatter={compact} />
                    <YAxis yAxisId="o" orientation="right" allowDecimals={false} tick={{ fontSize: 10, fill: P.muted }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: any, name: any) => (name === "Volume" ? money(Number(v)) : v)} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    <Bar yAxisId="g" dataKey="gmv" name="Volume" fill={P.blueL} radius={[5, 5, 0, 0]} />
                    <Line yAxisId="o" type="monotone" dataKey="orders" name="Commandes" stroke={P.navy} strokeWidth={2.5} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
              {/* Décomposition du score */}
              <div style={{ ...card, padding: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: P.text, margin: "0 0 12px" }}>Comment le score de {p.finScore}/100 est calculé</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {p.scoreLines.map((l) => (
                    <div key={l.key}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4, gap: 8 }}>
                        <span style={{ fontWeight: 700, color: P.textSub }}>{l.label} <span style={{ color: P.muted, fontWeight: 500 }}>(poids {l.weight})</span></span>
                        <span style={{ fontWeight: 800, color: P.text }}>{Math.round(l.value)}</span>
                      </div>
                      <div style={{ height: 7, borderRadius: 9, background: P.surface, overflow: "hidden" }}>
                        <div style={{ width: `${l.value}%`, height: "100%", background: l.color, borderRadius: 9 }} />
                      </div>
                      <p style={{ fontSize: 11, color: P.muted, margin: "3px 0 0" }}>{l.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Contrôles */}
                <div style={{ ...card, padding: 16 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: P.text, margin: "0 0 10px", display: "flex", alignItems: "center", gap: 6 }}>
                    <ShieldCheck size={14} style={{ color: P.blue }} /> Contrôles du dossier ({passed}/{p.checks.length})
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {p.checks.map((c) => (
                      <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                        {c.ok ? <CheckCircle2 size={14} style={{ color: P.green, flexShrink: 0 }} /> : <XCircle size={14} style={{ color: P.red, flexShrink: 0 }} />}
                        <span style={{ flex: 1, color: P.textSub }}>{c.label}</span>
                        <span style={{ color: P.muted, fontSize: 11 }}>{c.detail}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Alertes */}
                <div style={{ ...card, padding: 16 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: P.text, margin: "0 0 10px", display: "flex", alignItems: "center", gap: 6 }}>
                    <AlertTriangle size={14} style={{ color: P.orange }} /> Points d'attention
                  </p>
                  {p.alerts.length === 0 ? (
                    <p style={{ fontSize: 12, color: P.muted, margin: 0 }}>Aucun signal d'alerte sur la période analysée.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {p.alerts.map((a, i) => {
                        const c = a.level === "high" ? { bg: "#FEF0ED", fg: "#8A2410", bar: P.red } : a.level === "medium" ? { bg: "#FBF3E0", fg: "#6B4500", bar: P.orange } : { bg: P.pale, fg: P.textSub, bar: P.blue };
                        return <div key={i} style={{ background: c.bg, color: c.fg, borderLeft: `3px solid ${c.bar}`, borderRadius: 8, padding: "7px 10px", fontSize: 12 }}>{a.text}</div>;
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Décision & suivi du dossier */}
            <div style={{ ...card, padding: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: P.text, margin: "0 0 4px", display: "flex", alignItems: "center", gap: 6 }}>
                <Wallet size={14} style={{ color: P.blue }} /> Décision & suivi du dossier
              </p>
              <p style={{ fontSize: 11, color: P.muted, margin: "0 0 12px" }}>
                Plafond indicatif de stock financé : <strong style={{ color: P.text }}>{money(p.ceiling)}</strong>
                {" "}(moyenne mensuelle × {cfg.multiple} × coefficient {ELIG[p.elig].factor}). C'est une aide à la décision : le montant final revient au partenaire financier.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: P.mutedD, display: "flex", flexDirection: "column", gap: 5 }}>
                  Statut du dossier
                  <select value={status} onChange={(e) => setStatus(e.target.value as DossierKey)} style={{ ...inputStyle, width: "100%" }}>
                    {DOSSIER_KEYS.map((k) => <option key={k} value={k}>{DOSSIER[k].label}</option>)}
                  </select>
                </label>
                <label style={{ fontSize: 11, fontWeight: 700, color: P.mutedD, display: "flex", flexDirection: "column", gap: 5 }}>
                  Montant demandé (XOF)
                  <input type="number" min={0} value={requested} onChange={(e) => setRequested(e.target.value)} placeholder="Ex : 2000000" style={{ ...inputStyle, width: "100%" }} />
                </label>
              </div>
              {overCeiling && (
                <p style={{ fontSize: 12, color: "#8A2410", background: "#FEF0ED", borderRadius: 8, padding: "7px 10px", margin: "10px 0 0" }}>
                  Le montant demandé dépasse le plafond indicatif de {money(requestedNum - p.ceiling)}.
                </p>
              )}
              <label style={{ fontSize: 11, fontWeight: 700, color: P.mutedD, display: "flex", flexDirection: "column", gap: 5, marginTop: 12 }}>
                Notes (décision, garanties, conditions…)
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
                          style={{ ...inputStyle, height: "auto", padding: "8px 10px", resize: "vertical", width: "100%" }} />
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
                <button onClick={handleSave}
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, border: "none", background: P.blue, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                  <Save size={13} /> Enregistrer le dossier
                </button>
                {saved && <span style={{ fontSize: 12, color: "#047857", fontWeight: 700 }}>Dossier enregistré</span>}
                {dossier?.updatedAt && <span style={{ fontSize: 11, color: P.muted }}>Dernière mise à jour : {new Date(dossier.updatedAt).toLocaleString("fr-FR")}</span>}
              </div>
              {dossier && dossier.history.length > 0 && (
                <div style={{ marginTop: 14, borderTop: `1px solid ${P.surface}`, paddingTop: 10 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: P.muted, margin: "0 0 6px" }}>Historique des statuts</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {[...dossier.history].reverse().map((h, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 11, color: P.muted }}>
                        <span style={{ width: 120 }}>{new Date(h.at).toLocaleDateString("fr-FR")}</span><DossierPill k={h.status} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>)}

          {tab === "transactions" && (
            <div style={{ ...card, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: P.surface }}>
                      {["Commande", "Date", "Livraison prévue", "Statut", "Articles", "Total", "Écart précédente"].map((h) => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: P.muted, whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {p.orders.length === 0 ? (
                      <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", color: P.muted }}>Aucune commande enregistrée pour ce point de vente.</td></tr>
                    ) : p.orders.map((o, i) => {
                      const older = p.orders[i + 1];
                      const gap = older ? Math.round((orderTimestamp(o) - orderTimestamp(older)) / DAY) : null;
                      const st = STATUS_LABEL[o.status] ?? { label: o.status, bg: P.surface, fg: P.muted };
                      return (
                        <tr key={o.id} style={{ borderTop: `1px solid ${P.surface}`, opacity: o.status === "cancelled" ? 0.6 : 1 }}>
                          <td style={{ padding: "10px 14px", fontWeight: 700, color: P.text }}>CMD-{o.id}</td>
                          <td style={{ padding: "10px 14px", color: P.textSub }}>{fdate(o.date)}</td>
                          <td style={{ padding: "10px 14px", color: P.muted }}>{fdate(o.delivery_date)}</td>
                          <td style={{ padding: "10px 14px" }}><Pill bg={st.bg} fg={st.fg}>{st.label}</Pill></td>
                          <td style={{ padding: "10px 14px", color: P.textSub }}>{o.items?.length ?? 0}</td>
                          <td style={{ padding: "10px 14px", fontWeight: 700, color: P.blueD, whiteSpace: "nowrap" }}>{money(num(o.total))}</td>
                          <td style={{ padding: "10px 14px", color: P.muted }}>{gap === null ? "—" : `${gap} j`}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Composant principal
   ───────────────────────────────────────────────────────────────────────── */
const PAGE_SIZE = 15;
type SortKey = "score" | "gmv" | "frequence" | "recence" | "plafond";

export default function FinancementManagement() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<RawOrder[]>([]);
  const [posList, setPosList] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [dossiers, setDossiers] = useState<Record<number, DossierEntry>>({});

  // Paramètres d'analyse
  const [periodDays, setPeriodDays] = useState<number | null>(180);
  const [benchmarkMonthly, setBenchmarkMonthly] = useState(1000000);
  const [multiple, setMultiple] = useState(1);
  const [showParams, setShowParams] = useState(false);

  // Filtres
  const [search, setSearch] = useState("");
  const [eligFilter, setEligFilter] = useState<"all" | EligKey>("all");
  const [dossierFilter, setDossierFilter] = useState<"all" | DossierKey>("all");
  const [natureFilter, setNatureFilter] = useState<"all" | "distributeur_secondaire" | "pdv">("all");
  const [withoutOrders, setWithoutOrders] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => { setDossiers(loadDossiers()); }, []);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [ord, pos, ana] = await Promise.allSettled([
        fetchAll<RawOrder>("/orders/"),
        fetchAll<any>("/points-vente/"),
        apiService.getPointsVenteAnalytics({}).then((r: Response) => (r.ok ? r.json() : [])).then((j: any) => extractList<any>(j)),
      ]);
      if (ord.status === "rejected") throw new Error("Impossible de charger les commandes. " + (ord.reason?.message ?? ""));
      setOrders(ord.value);
      setPosList(pos.status === "fulfilled" ? pos.value : []);
      setAnalytics(ana.status === "fulfilled" ? ana.value : []);
    } catch (e: any) {
      setError(e.message || "Erreur de chargement");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const cfg: Config = useMemo(() => ({ periodDays, benchmarkMonthly, multiple }), [periodDays, benchmarkMonthly, multiple]);

  // Référentiel unifié : points-vente + fiches analytiques + PDV vus dans les commandes
  const bases = useMemo(() => {
    const map = new Map<number, PosBase>();
    const blank = (id: number): PosBase => ({
      id, name: `PDV #${id}`, commune: "", quartier: "", nature: "", owner: "", phone: "", address: "",
      hasAnalytics: false, scoreGlobal: 0, caDeclare: 0, gpsValid: false, ficheComplete: false,
      nbOperateurs: 0, ancienneteAnnees: 0, potentielLabel: "",
    });
    posList.forEach((x) => {
      if (x?.id == null) return;
      const b = map.get(x.id) ?? blank(x.id);
      map.set(x.id, { ...b, name: x.name || b.name, commune: x.commune || b.commune, quartier: x.quartier || b.quartier,
        nature: normalizeNature(x.nature) || b.nature, owner: x.owner || b.owner, phone: x.phone || b.phone, address: x.address || b.address });
    });
    analytics.forEach((a) => {
      if (a?.id == null) return;
      const b = map.get(a.id) ?? blank(a.id);
      const ops = [a.moov, a.orange, a.mtn, a.wave].filter(Boolean).length;
      map.set(a.id, { ...b, name: a.name || b.name, commune: a.commune || b.commune, quartier: a.quartier || b.quartier,
        nature: normalizeNature(a.nature) || b.nature, owner: a.owner || b.owner, phone: a.phone || b.phone, address: a.address || b.address,
        hasAnalytics: true, scoreGlobal: num(a.score_global), caDeclare: num(a.monthly_turnover),
        gpsValid: Boolean(a.gps_valid), ficheComplete: Boolean(a.fiche_complete), nbOperateurs: ops,
        ancienneteAnnees: num(a.anciennete_annees), potentielLabel: a.potentiel_label || "" });
    });
    orders.forEach((o) => {
      const id = o.point_of_sale ?? o.point_of_sale_details?.id;
      if (id == null) return;
      const d = o.point_of_sale_details;
      const b = map.get(id) ?? blank(id);
      map.set(id, { ...b, name: b.name.startsWith("PDV #") && d?.name ? d.name : b.name,
        owner: b.owner || d?.owner || "", phone: b.phone || d?.phone || "", address: b.address || d?.address || "",
        nature: b.nature || normalizeNature(d?.nature) });
    });
    return Array.from(map.values());
  }, [posList, analytics, orders]);

  const ordersByPos = useMemo(() => {
    const m = new Map<number, RawOrder[]>();
    orders.forEach((o) => {
      const id = o.point_of_sale ?? o.point_of_sale_details?.id;
      if (id == null) return;
      if (!m.has(id)) m.set(id, []);
      m.get(id)!.push(o);
    });
    return m;
  }, [orders]);

  const profiles = useMemo(() => {
    const now = Date.now();
    return bases
      .filter((b) => withoutOrders || ordersByPos.has(b.id))
      .map((b) => buildProfile(b, ordersByPos.get(b.id) ?? [], cfg, now));
  }, [bases, ordersByPos, cfg, withoutOrders]);

  const dossierOf = useCallback((id: number): DossierKey => dossiers[id]?.status ?? "aucun", [dossiers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = profiles.filter((p) => {
      if (q && !(`${p.name} ${p.commune} ${p.quartier} ${p.owner}`.toLowerCase().includes(q))) return false;
      if (eligFilter !== "all" && p.elig !== eligFilter) return false;
      if (dossierFilter !== "all" && dossierOf(p.id) !== dossierFilter) return false;
      if (natureFilter !== "all" && p.nature !== natureFilter) return false;
      return true;
    });
    const val = (p: Profile) =>
      sortKey === "score" ? p.finScore : sortKey === "gmv" ? p.gmv : sortKey === "frequence" ? p.ordersPerMonth
        : sortKey === "plafond" ? p.ceiling : p.daysSinceLast === null ? -1 : -p.daysSinceLast;
    return list.sort((a, b) => val(b) - val(a));
  }, [profiles, search, eligFilter, dossierFilter, natureFilter, sortKey, dossierOf]);

  useEffect(() => { setPage(1); }, [search, eligFilter, dossierFilter, natureFilter, sortKey, withoutOrders, periodDays]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = useMemo(() => {
    const c: Record<EligKey, number> = { eligible: 0, conditions: 0, surveiller: 0, non_eligible: 0, insuffisant: 0 };
    profiles.forEach((p) => { c[p.elig]++; });
    return c;
  }, [profiles]);
  const dossierCounts = useMemo(() => {
    const c = Object.fromEntries(DOSSIER_KEYS.map((k) => [k, 0])) as Record<DossierKey, number>;
    profiles.forEach((p) => { c[dossierOf(p.id)]++; });
    return c;
  }, [profiles, dossierOf]);
  const totalGmv = profiles.reduce((s, p) => s + p.gmv, 0);
  const potentialCeiling = profiles.reduce((s, p) => s + p.ceiling, 0);

  const selected = useMemo(() => profiles.find((p) => p.id === selectedId) ?? null, [profiles, selectedId]);

  const handleSaveDossier = (id: number, entry: DossierEntry) => {
    setDossiers((prev) => { const next = { ...prev, [id]: entry }; saveDossier(next); return next; });
  };

  const exportCsv = () => {
    const head = ["PDV", "Nature", "Commune", "Quartier", "Pré-éligibilité", "Score", "Statut dossier", "Montant demandé (XOF)",
      "Commandes valides", "Annulées", "Commandes / mois", "Intervalle moyen (j)", "Volume période (XOF)", "Moyenne mensuelle (XOF)",
      "Tendance 90j (%)", "Dernière commande", "Jours depuis dernière", "Taux livraison (%)", "Taux annulation (%)", "Plafond indicatif (XOF)"];
    const rows = filtered.map((p) => [p.name, natureLabel(p.nature), p.commune, p.quartier, ELIG[p.elig].label, p.finScore, DOSSIER[dossierOf(p.id)].label,
      dossiers[p.id]?.requested ?? "", p.nbValid, p.nbCancelled, p.ordersPerMonth.toFixed(2), p.avgIntervalDays?.toFixed(1) ?? "",
      Math.round(p.gmv), Math.round(p.avgMonthlyGmv), p.growthPct?.toFixed(0) ?? "", fdate(p.lastOrderDate), p.daysSinceLast ?? "",
      (p.deliveredRate * 100).toFixed(0), (p.cancelRate * 100).toFixed(0), p.ceiling]);
    const csv = "\uFEFF" + [head, ...rows].map((r) => r.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(";")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    a.download = "financement_pdv.csv";
    a.click();
  };

  /* ── États ── */
  if (loading && orders.length === 0) {
    return (
      <div style={{ ...card, padding: 56, textAlign: "center" }}>
        <Loader2 size={32} className="animate-spin" style={{ color: P.blue, margin: "0 auto 12px" }} />
        <p style={{ fontSize: 13, color: P.textSub, fontWeight: 600, margin: 0 }}>Analyse des transactions en cours…</p>
      </div>
    );
  }
  if (error && orders.length === 0) {
    return (
      <div style={{ ...card, padding: 40, textAlign: "center" }}>
        <AlertTriangle size={28} style={{ color: "#B03318", margin: "0 auto 10px" }} />
        <p style={{ fontSize: 14, fontWeight: 700, color: P.text, margin: "0 0 4px" }}>Chargement impossible</p>
        <p style={{ fontSize: 12, color: P.muted, margin: "0 0 16px" }}>{error}</p>
        <button onClick={load} style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: P.blue, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Réessayer</button>
      </div>
    );
  }

  const statBtn = (key: "all" | EligKey, label: string, n: number, dot?: string) => {
    const active = eligFilter === key;
    return (
      <button key={key} onClick={() => setEligFilter(active ? "all" : key)}
              style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 12px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                       background: active ? P.blue : "#fff", color: active ? "#fff" : P.textSub, border: `1.5px solid ${active ? P.blue : P.warm}` }}>
        {dot && <span style={{ width: 8, height: 8, borderRadius: "50%", background: dot }} />}{label}
        <span style={{ background: active ? "rgba(255,255,255,0.25)" : P.surface, borderRadius: 9999, padding: "1px 8px", fontSize: 11 }}>{n}</span>
      </button>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {error && (
        <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 14px", borderRadius: 12, background: "#FEF0ED", border: "1px solid #F5C4B3", color: "#9A2D10", fontSize: 13 }}>
          <AlertTriangle size={15} /><span style={{ flex: 1 }}>{error}</span>
          <button onClick={() => setError(null)} aria-label="Fermer" style={{ background: "none", border: "none", cursor: "pointer", color: "#9A2D10" }}><X size={14} /></button>
        </div>
      )}

      {/* Bandeau */}
      <div style={{ background: P.banner, borderRadius: 16, padding: 20, display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ maxWidth: 620 }}>
          <p style={{ color: "rgba(200,230,248,0.9)", fontSize: 12, fontWeight: 600, margin: "0 0 6px", display: "flex", alignItems: "center", gap: 7 }}>
            <Landmark size={15} style={{ color: P.blueL }} /> LanfiaLink Finance
          </p>
          <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 800, margin: 0 }}>Fiches de financement par point de vente</h2>
          <p style={{ color: "rgba(200,230,248,0.85)", fontSize: 12, margin: "6px 0 0", lineHeight: 1.5 }}>
            Chaque fiche retrace les commandes reçues par un PDV (fréquence, régularité, volume, fiabilité, tendance) pour évaluer sa capacité à porter un stock financé par un partenaire.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={load} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 10, border: "none", background: "rgba(255,255,255,0.16)", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Actualiser
          </button>
          <button onClick={exportCsv} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 10, border: "none", background: P.blue, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            <Download size={13} /> Exporter CSV
          </button>
        </div>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
        <Kpi icon={Store} label="PDV analysés" value={profiles.length} sub={`${orders.length} commandes au total`} color={P.blue} />
        <Kpi icon={CheckCircle2} label="Éligibles ou sous conditions" value={counts.eligible + counts.conditions} sub={`${counts.eligible} éligibles · ${counts.conditions} sous conditions`} color={P.green} />
        <Kpi icon={Activity} label="Volume d'achat (période)" value={`${compact(totalGmv)} XOF`} sub={periodDays ? `${periodDays} derniers jours` : "Tout l'historique"} color={P.purple} />
        <Kpi icon={Wallet} label="Plafond indicatif cumulé" value={`${compact(potentialCeiling)} XOF`} sub="Somme des plafonds éligibles" color={P.orange} />
      </div>

      {/* Pré-éligibilité */}
      <div style={{ ...card, padding: 14 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: P.muted, margin: "0 0 8px" }}>Pré-éligibilité (calcul automatique)</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {statBtn("all", "Tous", profiles.length)}
          {(Object.keys(ELIG) as EligKey[]).map((k) => statBtn(k, ELIG[k].short, counts[k], ELIG[k].dot))}
        </div>
        <p style={{ fontSize: 11, fontWeight: 700, color: P.muted, margin: "14px 0 8px" }}>Pipeline des dossiers (suivi manuel)</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {DOSSIER_KEYS.map((k) => {
            const active = dossierFilter === k;
            return (
              <button key={k} onClick={() => setDossierFilter(active ? "all" : k)}
                      style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 11px", borderRadius: 9999, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                               background: DOSSIER[k].bg, color: DOSSIER[k].fg, border: `1.5px solid ${active ? DOSSIER[k].fg : "transparent"}` }}>
                {DOSSIER[k].label} <strong>{dossierCounts[k]}</strong>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filtres */}
      <div style={{ ...card, padding: 14 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 240px", maxWidth: 340 }}>
            <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: P.muted }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un PDV, une commune, un propriétaire…"
                   style={{ ...inputStyle, width: "100%", paddingLeft: 32 }} />
          </div>
          <select value={natureFilter} onChange={(e) => setNatureFilter(e.target.value as any)} style={inputStyle} aria-label="Nature du point de vente">
            <option value="all">Toutes natures</option>
            <option value="distributeur_secondaire">Distributeurs secondaires</option>
            <option value="pdv">Points de vente</option>
          </select>
          <select value={periodDays ?? "all"} onChange={(e) => setPeriodDays(e.target.value === "all" ? null : Number(e.target.value))} style={inputStyle} aria-label="Période d'analyse">
            <option value="90">90 derniers jours</option>
            <option value="180">180 derniers jours</option>
            <option value="365">12 derniers mois</option>
            <option value="all">Tout l'historique</option>
          </select>
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} style={inputStyle} aria-label="Tri">
            <option value="score">Trier : score</option>
            <option value="gmv">Trier : volume d'achat</option>
            <option value="frequence">Trier : fréquence</option>
            <option value="recence">Trier : activité récente</option>
            <option value="plafond">Trier : plafond indicatif</option>
          </select>
          <button onClick={() => setShowParams((s) => !s)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 36, padding: "0 12px", borderRadius: 10, border: `1.5px solid ${showParams ? P.blue : P.warm}`, background: showParams ? P.pale : "#fff", color: P.mutedD, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            <SlidersHorizontal size={13} /> Paramètres du score
          </button>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: P.textSub, fontWeight: 600 }}>
            <input type="checkbox" checked={withoutOrders} onChange={(e) => setWithoutOrders(e.target.checked)} style={{ accentColor: P.blue }} />
            Inclure les PDV sans commande
          </label>
        </div>
        {showParams && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${P.surface}`, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: P.mutedD, display: "flex", flexDirection: "column", gap: 5 }}>
              Volume mensuel de référence (XOF) — vaut 100 points
              <input type="number" min={1} step={50000} value={benchmarkMonthly} onChange={(e) => setBenchmarkMonthly(Math.max(1, Number(e.target.value) || 1))} style={{ ...inputStyle, width: "100%" }} />
            </label>
            <label style={{ fontSize: 11, fontWeight: 700, color: P.mutedD, display: "flex", flexDirection: "column", gap: 5 }}>
              Multiple de la moyenne mensuelle pour le plafond
              <input type="number" min={0.5} max={6} step={0.5} value={multiple} onChange={(e) => setMultiple(Math.max(0.5, Number(e.target.value) || 1))} style={{ ...inputStyle, width: "100%" }} />
            </label>
            <p style={{ fontSize: 11, color: P.muted, margin: 0, lineHeight: 1.5, alignSelf: "end" }}>
              Seuils : ≥ 75 éligible · 55-74 sous conditions · 40-54 à surveiller · &lt; 40 non éligible. « Données insuffisantes » en dessous de 3 commandes ou 30 jours d'historique.
            </p>
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{ ...card, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: P.surface, borderBottom: `1px solid ${P.warmL}` }}>
                {["Point de vente", "Score", "Pré-éligibilité", "Dossier", "Commandes", "Fréquence", "Volume période", "Tendance", "Dernière cmd", "Plafond indicatif", ""].map((h) => (
                  <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: P.muted, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr><td colSpan={11} style={{ padding: "44px 20px", textAlign: "center" }}>
                  <Landmark size={26} style={{ color: P.warm, margin: "0 auto 8px", display: "block" }} />
                  <p style={{ fontSize: 13, fontWeight: 700, color: P.text, margin: "0 0 3px" }}>
                    {profiles.length === 0 ? "Aucune commande à analyser" : "Aucun point de vente ne correspond"}
                  </p>
                  <p style={{ fontSize: 12, color: P.muted, margin: 0 }}>
                    {profiles.length === 0 ? "Les fiches apparaissent dès qu'un point de vente reçoit une commande." : "Modifiez les filtres ou la période d'analyse."}
                  </p>
                </td></tr>
              ) : pageRows.map((p) => (
                <tr key={p.id} onClick={() => setSelectedId(p.id)} style={{ borderTop: `1px solid ${P.surface}`, cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = P.pale)} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "11px 14px", minWidth: 190 }}>
                    <p style={{ margin: 0, fontWeight: 700, color: P.text }}>{p.name}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: P.muted }}>{natureLabel(p.nature)}{p.commune ? ` · ${p.commune}` : ""}</p>
                  </td>
                  <td style={{ padding: "8px 14px" }}><ScoreRing score={p.finScore} color={ELIG[p.elig].dot} /></td>
                  <td style={{ padding: "11px 14px" }}><EligPill k={p.elig} short /></td>
                  <td style={{ padding: "11px 14px" }}><DossierPill k={dossierOf(p.id)} /></td>
                  <td style={{ padding: "11px 14px", color: P.textSub }}>
                    <strong style={{ color: P.text }}>{p.nbValid}</strong>
                    {p.nbCancelled > 0 && <span style={{ color: "#B03318", fontSize: 11 }}> · {p.nbCancelled} ann.</span>}
                  </td>
                  <td style={{ padding: "11px 14px", color: P.textSub, whiteSpace: "nowrap" }}>
                    {p.ordersPerMonth.toFixed(1)} / mois
                    {p.avgIntervalDays !== null && <span style={{ display: "block", fontSize: 10, color: P.muted }}>tous les {p.avgIntervalDays.toFixed(0)} j</span>}
                  </td>
                  <td style={{ padding: "11px 14px", fontWeight: 700, color: P.blueD, whiteSpace: "nowrap" }}>{money(p.gmv)}</td>
                  <td style={{ padding: "11px 14px" }}><Trend pct={p.growthPct} /></td>
                  <td style={{ padding: "11px 14px", color: p.daysSinceLast !== null && p.daysSinceLast > 45 ? "#B03318" : P.textSub, whiteSpace: "nowrap" }}>
                    {p.daysSinceLast === null ? "—" : `Il y a ${p.daysSinceLast} j`}
                  </td>
                  <td style={{ padding: "11px 14px", fontWeight: 700, color: P.text, whiteSpace: "nowrap" }}>{p.ceiling > 0 ? money(p.ceiling) : "—"}</td>
                  <td style={{ padding: "11px 14px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: P.blue, whiteSpace: "nowrap" }}>
                      <FileText size={12} /> Ouvrir la fiche
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div style={{ padding: "11px 16px", borderTop: `1px solid ${P.warmL}`, background: P.surface, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: 12, color: P.muted, fontWeight: 600 }}>
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} sur {filtered.length}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button onClick={() => setPage((x) => Math.max(1, x - 1))} disabled={page === 1} aria-label="Page précédente"
                      style={{ padding: "5px 9px", borderRadius: 8, border: `1px solid ${P.warm}`, background: "#fff", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.5 : 1, display: "flex" }}><ChevronLeft size={14} /></button>
              <span style={{ fontSize: 12, fontWeight: 700, color: P.textSub }}>Page {page} / {totalPages}</span>
              <button onClick={() => setPage((x) => Math.min(totalPages, x + 1))} disabled={page === totalPages} aria-label="Page suivante"
                      style={{ padding: "5px 9px", borderRadius: 8, border: `1px solid ${P.warm}`, background: "#fff", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.5 : 1, display: "flex" }}><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      <div style={{ ...card, padding: "10px 14px", display: "flex", gap: 8, alignItems: "flex-start", fontSize: 11, color: P.muted, lineHeight: 1.5 }}>
        <Clock size={13} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          Les commandes annulées sont exclues du volume et de la fréquence, mais comptent dans le taux d'annulation. Les statuts de dossier sont enregistrés pour l'instant dans ce navigateur ; ils seront partagés entre utilisateurs une fois reliés à l'API.
        </span>
      </div>

      {selected && (
        <FicheFinancement
          key={selected.id}
          p={selected} cfg={cfg} dossier={dossiers[selected.id]}
          onSave={(entry) => handleSaveDossier(selected.id, entry)}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}