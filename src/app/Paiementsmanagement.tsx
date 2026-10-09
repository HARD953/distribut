"use client";
// components/dashboard/PaiementsManagement.tsx
//
// LanfiaLink Pay — rapprochement commandes ↔ paiements, suivi des encaissements
// et reporting de règlement par point de vente.
//
// Données :
//   • /orders/ (API)  → montants dus par commande (même source qu'OrderManagement)
//   • paiements       → stockés pour l'instant dans le navigateur (localStorage),
//                       car le backend n'expose pas encore d'endpoint de paiements.
//
// Pour brancher le backend (Django / PSP PI-SPI), remplacer UNIQUEMENT les trois
// fonctions de la section "COUCHE DE PERSISTANCE" : loadPayments, savePayments
// et requestPaymentFromPsp. Tout le reste (calculs, statuts, écrans) reste identique.

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
} from "recharts";
import {
  CreditCard, Search, Download, RefreshCw, Loader2, AlertTriangle, X, CheckCircle2, Clock, Plus,
  ChevronLeft, ChevronRight, Wallet, Store, Send, Copy, XCircle, RotateCcw, Receipt, SlidersHorizontal, Banknote,
} from "lucide-react";
import { apiService } from "./ApiService";

/* ─────────────────────────────────────────────────────────────────────────
   Palette (cohérente avec les autres vues admin)
   ───────────────────────────────────────────────────────────────────────── */
const P = {
  navy: "#0A1E2E", blue: "#1A8FD1", blueL: "#4FB3E8", blueD: "#0D6FAB", banner: "#0D4E7A",
  pale: "#EDF5FA", surface: "#F0F5F9", warm: "#C0D4E6", warmL: "#D4E4F0",
  text: "#0A1E2E", textSub: "#2A4A62", muted: "#5A7A92", mutedD: "#1A4A6A",
  green: "#10B981", orange: "#F59E0B", red: "#EF4444", purple: "#8B5CF6", teal: "#14B8A6", gray: "#8AA6BA",
};

/* ─────────────────────────────────────────────────────────────────────────
   Types & statuts
   ───────────────────────────────────────────────────────────────────────── */
type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
interface RawOrder {
  id: number; point_of_sale?: number | null;
  point_of_sale_details?: { id: number; name?: string } | null;
  status: OrderStatus; total: string; date: string; delivery_date?: string | null;
}

type PayStatus = "pending" | "success" | "failed" | "refunded";
type MethodKey = "wave" | "orange_money" | "mtn_momo" | "moov_money" | "pispi" | "virement" | "especes";
interface Payment {
  id: string; orderId: number; posId: number; amount: number; method: MethodKey; reference: string;
  status: PayStatus; createdAt: string; paidAt: string | null; note: string;
}

const PAY_STATUS: Record<PayStatus, { label: string; bg: string; fg: string }> = {
  pending:  { label: "En attente", bg: "#FBEFD6", fg: "#7A4F00" },
  success:  { label: "Réussi",     bg: "#DCF5EC", fg: "#044D38" },
  failed:   { label: "Échoué",     bg: "#FCE4DC", fg: "#7A2410" },
  refunded: { label: "Remboursé",  bg: "#EADFFB", fg: "#4B2A94" },
};
const METHODS: Record<MethodKey, { label: string; color: string }> = {
  wave:         { label: "Wave",             color: "#1DC4E9" },
  orange_money: { label: "Orange Money",     color: "#FF6600" },
  mtn_momo:     { label: "MTN MoMo",         color: "#E0B200" },
  moov_money:   { label: "Moov Money",       color: "#00A651" },
  pispi:        { label: "PI-SPI (instantané)", color: P.blueD },
  virement:     { label: "Virement bancaire", color: P.navy },
  especes:      { label: "Espèces",          color: P.gray },
};
const METHOD_KEYS = Object.keys(METHODS) as MethodKey[];

type RecoKey = "solde" | "partiel" | "en_cours" | "impaye" | "echec" | "trop_percu" | "a_rembourser" | "annule";
const RECO: Record<RecoKey, { label: string; bg: string; fg: string; dot: string }> = {
  solde:        { label: "Soldée",             bg: "#DCF5EC", fg: "#044D38", dot: P.green },
  partiel:      { label: "Paiement partiel",   bg: "#DDEBFA", fg: "#0A4A80", dot: P.blue },
  en_cours:     { label: "Paiement en cours",  bg: "#EADFFB", fg: "#4B2A94", dot: P.purple },
  impaye:       { label: "Impayée",            bg: "#FBEFD6", fg: "#7A4F00", dot: P.orange },
  echec:        { label: "Échec de paiement",  bg: "#FCE4DC", fg: "#7A2410", dot: P.red },
  trop_percu:   { label: "Trop-perçu",         bg: "#FFF3C4", fg: "#6B5200", dot: "#D4A800" },
  a_rembourser: { label: "À rembourser",       bg: "#FCE4DC", fg: "#7A2410", dot: P.red },
  annule:       { label: "Annulée",            bg: "#EAF0F5", fg: "#3A5A72", dot: P.gray },
};
const RECO_KEYS = Object.keys(RECO) as RecoKey[];

/* ─────────────────────────────────────────────────────────────────────────
   COUCHE DE PERSISTANCE — à remplacer par l'API quand elle existera
   ───────────────────────────────────────────────────────────────────────── */
const PAYMENTS_KEY = "lanfialink_paiements_v1";

function loadPayments(): Payment[] {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(PAYMENTS_KEY) : null;
    return raw ? (JSON.parse(raw) as Payment[]) : [];
  } catch { return []; }
}
function savePayments(list: Payment[]) {
  try { window.localStorage.setItem(PAYMENTS_KEY, JSON.stringify(list)); } catch { /* quota / navigation privée */ }
}
// Point d'entrée vers le partenaire PSP (PI-SPI). Aujourd'hui : génère seulement une référence.
// Demain : appeler le PSP, récupérer le lien / QR / RTP, et renvoyer la référence réelle.
async function requestPaymentFromPsp(_p: { orderId: number; amount: number; method: MethodKey }): Promise<{ reference: string }> {
  return { reference: `RTP-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}` };
}

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
const fdate = (s?: string | number | null) => (s ? new Date(s).toLocaleDateString("fr-FR") : "—");
const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const newPayId = () => `PAY-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 4).toUpperCase()}`;
const posIdOf = (o: RawOrder) => o.point_of_sale ?? o.point_of_sale_details?.id ?? 0;

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
   Moteur de rapprochement
   ───────────────────────────────────────────────────────────────────────── */
interface OrderRec {
  order: RawOrder; posId: number; posName: string; total: number;
  paid: number; pendingAmt: number; due: number; reco: RecoKey;
  dueDate: number; overdueDays: number; lastPaidAt: number | null; settleDays: number | null;
  payments: Payment[];
}

function reconcile(orders: RawOrder[], payments: Payment[], termDays: number, now: number): OrderRec[] {
  const byOrder = new Map<number, Payment[]>();
  payments.forEach((p) => { if (!byOrder.has(p.orderId)) byOrder.set(p.orderId, []); byOrder.get(p.orderId)!.push(p); });

  return orders.map((o) => {
    const total = num(o.total);
    const pays = (byOrder.get(o.id) ?? []).slice().sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    const paid = pays.filter((p) => p.status === "success").reduce((s, p) => s + p.amount, 0);
    const pendingAmt = pays.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);
    const hasFailed = pays.some((p) => p.status === "failed");
    const cancelled = o.status === "cancelled";
    const due = cancelled ? 0 : Math.max(0, total - paid);

    let reco: RecoKey;
    if (cancelled) reco = paid > 0 ? "a_rembourser" : "annule";
    else if (paid > total + 0.5) reco = "trop_percu";
    else if (total > 0 && paid >= total - 0.5) reco = "solde";
    else if (paid > 0) reco = "partiel";
    else if (pendingAmt > 0) reco = "en_cours";
    else if (hasFailed) reco = "echec";
    else reco = "impaye";

    const dueDate = new Date(o.date).getTime() + termDays * DAY;
    const overdueDays = due > 0 && now > dueDate ? Math.floor((now - dueDate) / DAY) : 0;
    const succ = pays.filter((p) => p.status === "success" && p.paidAt);
    const lastPaidAt = succ.length ? Math.max(...succ.map((p) => +new Date(p.paidAt as string))) : null;
    const settleDays = reco === "solde" && lastPaidAt ? Math.max(0, (lastPaidAt - new Date(o.date).getTime()) / DAY) : null;

    return {
      order: o, posId: posIdOf(o), posName: o.point_of_sale_details?.name || `PDV #${posIdOf(o)}`,
      total, paid, pendingAmt, due, reco, dueDate, overdueDays, lastPaidAt, settleDays, payments: pays,
    };
  });
}

interface PosRec {
  posId: number; name: string; nbOrders: number; billed: number; collected: number; outstanding: number;
  overdueAmt: number; maxOverdueDays: number; avgDelay: number | null; failRate: number; unpaidCount: number;
  risk: "sain" | "relancer" | "critique";
}
const RISK = {
  sain:     { label: "Règlement sain", bg: "#DCF5EC", fg: "#044D38" },
  relancer: { label: "À relancer",     bg: "#FBEFD6", fg: "#7A4F00" },
  critique: { label: "Critique",       bg: "#FCE4DC", fg: "#7A2410" },
};

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
const RecoPill = ({ k }: { k: RecoKey }) => <Pill bg={RECO[k].bg} fg={RECO[k].fg} dot={RECO[k].dot}>{RECO[k].label}</Pill>;
const MethodTag = ({ m }: { m: MethodKey }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: P.textSub, fontWeight: 600, whiteSpace: "nowrap" }}>
    <span style={{ width: 9, height: 9, borderRadius: 3, background: METHODS[m].color }} />{METHODS[m].label}
  </span>
);
function Kpi({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string | number; sub?: string; color: string }) {
  return (
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
}
const th: React.CSSProperties = { padding: "11px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: P.muted, whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "11px 14px" };

function Pager({ page, total, count, size, onPage }: { page: number; total: number; count: number; size: number; onPage: (p: number) => void }) {
  if (count === 0) return null;
  return (
    <div style={{ padding: "11px 16px", borderTop: `1px solid ${P.warmL}`, background: P.surface, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
      <span style={{ fontSize: 12, color: P.muted, fontWeight: 600 }}>{(page - 1) * size + 1}–{Math.min(page * size, count)} sur {count}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1} aria-label="Page précédente"
                style={{ padding: "5px 9px", borderRadius: 8, border: `1px solid ${P.warm}`, background: "#fff", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.5 : 1, display: "flex" }}><ChevronLeft size={14} /></button>
        <span style={{ fontSize: 12, fontWeight: 700, color: P.textSub }}>Page {page} / {total}</span>
        <button onClick={() => onPage(Math.min(total, page + 1))} disabled={page === total} aria-label="Page suivante"
                style={{ padding: "5px 9px", borderRadius: 8, border: `1px solid ${P.warm}`, background: "#fff", cursor: page === total ? "not-allowed" : "pointer", opacity: page === total ? 0.5 : 1, display: "flex" }}><ChevronRight size={14} /></button>
      </div>
    </div>
  );
}
function EmptyRow({ cols, title, text }: { cols: number; title: string; text: string }) {
  return (
    <tr><td colSpan={cols} style={{ padding: "44px 20px", textAlign: "center" }}>
      <Receipt size={26} style={{ color: P.warm, margin: "0 auto 8px", display: "block" }} />
      <p style={{ fontSize: 13, fontWeight: 700, color: P.text, margin: "0 0 3px" }}>{title}</p>
      <p style={{ fontSize: 12, color: P.muted, margin: 0 }}>{text}</p>
    </td></tr>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Modal : enregistrer un paiement / émettre une demande de paiement
   ───────────────────────────────────────────────────────────────────────── */
function PaymentModal({ mode, recs, initialOrderId, onClose, onCreate }: {
  mode: "record" | "request"; recs: OrderRec[]; initialOrderId: number | null;
  onClose: () => void; onCreate: (p: Payment) => void;
}) {
  const open = useMemo(() => recs.filter((r) => r.order.status !== "cancelled" && r.due > 0)
    .sort((a, b) => +new Date(b.order.date) - +new Date(a.order.date)), [recs]);
  const [orderId, setOrderId] = useState<number | "">(initialOrderId ?? open[0]?.order.id ?? "");
  const rec = recs.find((r) => r.order.id === orderId);
  const [amount, setAmount] = useState<string>(rec ? String(Math.round(rec.due)) : "");
  const [method, setMethod] = useState<MethodKey>("wave");
  const [status, setStatus] = useState<PayStatus>("success");
  const [reference, setReference] = useState("");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<Payment | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const pickOrder = (id: number | "") => {
    setOrderId(id);
    const r = recs.find((x) => x.order.id === id);
    if (r) setAmount(String(Math.round(r.due)));
  };

  const amountNum = num(amount);
  const overpay = rec && amountNum > rec.due + 0.5;

  const submit = async () => {
    setErr(null);
    if (!rec) return setErr("Choisissez une commande.");
    if (!(amountNum > 0)) return setErr("Saisissez un montant supérieur à 0.");
    setBusy(true);
    try {
      const now = new Date().toISOString();
      let p: Payment;
      if (mode === "request") {
        const { reference: ref } = await requestPaymentFromPsp({ orderId: rec.order.id, amount: amountNum, method });
        p = { id: newPayId(), orderId: rec.order.id, posId: rec.posId, amount: amountNum, method, reference: ref, status: "pending", createdAt: now, paidAt: null, note };
      } else {
        p = {
          id: newPayId(), orderId: rec.order.id, posId: rec.posId, amount: amountNum, method,
          reference: reference.trim() || `MAN-${Date.now().toString(36).toUpperCase()}`,
          status, createdAt: now, paidAt: status === "success" ? new Date(paidAt).toISOString() : null, note,
        };
      }
      onCreate(p);
      if (mode === "request") setCreated(p); else onClose();
    } catch (e: any) { setErr(e.message || "Échec de l'opération"); }
    finally { setBusy(false); }
  };

  const payload = created && rec
    ? `LanfiaLink Pay — ${rec.posName}\nCommande CMD-${rec.order.id}\nMontant : ${money(created.amount)}\nMoyen : ${METHODS[created.method].label}\nRéférence : ${created.reference}`
    : "";

  const label: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: P.mutedD, display: "flex", flexDirection: "column", gap: 5 };

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()}
         style={{ position: "fixed", inset: 0, background: "rgba(10,21,32,0.55)", backdropFilter: "blur(3px)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 18, width: "100%", maxWidth: 520, maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(10,21,32,0.25)" }}>
        <div style={{ background: P.banner, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ color: "#fff", fontSize: 15, fontWeight: 800, margin: 0 }}>{mode === "record" ? "Enregistrer un paiement" : "Émettre une demande de paiement"}</h3>
            <p style={{ color: "rgba(200,230,248,0.85)", fontSize: 11, margin: "2px 0 0" }}>
              {mode === "record" ? "Rapprocher un encaissement avec une commande" : "Génère une référence à communiquer au point de vente"}
            </p>
          </div>
          <button onClick={onClose} aria-label="Fermer" style={{ background: "rgba(255,255,255,0.16)", border: "none", borderRadius: 9, padding: 7, cursor: "pointer", color: "#fff", display: "flex" }}><X size={15} /></button>
        </div>

        <div style={{ padding: 20, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
          {created ? (
            <>
              <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "10px 12px", borderRadius: 10, background: "#DCF5EC", color: "#044D38", fontSize: 12, fontWeight: 700 }}>
                <CheckCircle2 size={15} /> Demande créée — statut « En attente » jusqu'à confirmation du paiement.
              </div>
              <pre style={{ margin: 0, padding: 12, background: P.pale, border: `1px solid ${P.warmL}`, borderRadius: 10, fontSize: 12, color: P.text, whiteSpace: "pre-wrap", fontFamily: "inherit" }}>{payload}</pre>
              <p style={{ fontSize: 11, color: P.muted, margin: 0 }}>Pour l'instant, aucune demande n'est envoyée à un PSP : la référence sert au suivi interne. Quand le partenaire PI-SPI sera branché, le lien ou le QR sera généré ici.</p>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => { navigator.clipboard?.writeText(payload); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 10, border: `1.5px solid ${P.warm}`, background: "#fff", color: P.mutedD, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                  <Copy size={13} /> {copied ? "Copié" : "Copier le message"}
                </button>
                <button onClick={onClose} style={{ padding: "9px 16px", borderRadius: 10, border: "none", background: P.blue, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Terminer</button>
              </div>
            </>
          ) : (
            <>
              {err && <div style={{ padding: "9px 12px", borderRadius: 10, background: "#FEF0ED", border: "1px solid #F5C4B3", color: "#9A2D10", fontSize: 12 }}>{err}</div>}
              {open.length === 0 && <div style={{ padding: "9px 12px", borderRadius: 10, background: P.pale, color: P.textSub, fontSize: 12 }}>Aucune commande avec un solde à encaisser.</div>}
              <label style={label}>
                Commande
                <select value={orderId} onChange={(e) => pickOrder(e.target.value ? Number(e.target.value) : "")} style={{ ...inputStyle, width: "100%" }}>
                  <option value="">Sélectionner une commande</option>
                  {open.map((r) => <option key={r.order.id} value={r.order.id}>CMD-{r.order.id} — {r.posName} — reste {money(r.due)}</option>)}
                </select>
              </label>
              {rec && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: P.muted, background: P.pale, borderRadius: 10, padding: "8px 12px" }}>
                  <span>Total {money(rec.total)}</span><span>Déjà encaissé {money(rec.paid)}</span><strong style={{ color: P.text }}>Reste {money(rec.due)}</strong>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label style={label}>Montant (XOF)
                  <input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
                </label>
                <label style={label}>Moyen de paiement
                  <select value={method} onChange={(e) => setMethod(e.target.value as MethodKey)} style={{ ...inputStyle, width: "100%" }}>
                    {METHOD_KEYS.map((k) => <option key={k} value={k}>{METHODS[k].label}</option>)}
                  </select>
                </label>
              </div>
              {overpay && <p style={{ fontSize: 12, color: "#6B5200", background: "#FFF3C4", borderRadius: 8, padding: "7px 10px", margin: 0 }}>Ce montant dépasse le solde de {money(amountNum - rec!.due)} : la commande passera en « Trop-perçu ».</p>}
              {mode === "record" && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <label style={label}>Statut du paiement
                      <select value={status} onChange={(e) => setStatus(e.target.value as PayStatus)} style={{ ...inputStyle, width: "100%" }}>
                        <option value="success">Réussi</option><option value="pending">En attente</option><option value="failed">Échoué</option>
                      </select>
                    </label>
                    <label style={label}>Date d'encaissement
                      <input type="date" value={paidAt} disabled={status !== "success"} onChange={(e) => setPaidAt(e.target.value)} style={{ ...inputStyle, width: "100%", opacity: status === "success" ? 1 : 0.5 }} />
                    </label>
                  </div>
                  <label style={label}>Référence de transaction (optionnel)
                    <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Ex : identifiant Wave / Orange Money" style={{ ...inputStyle, width: "100%" }} />
                  </label>
                </>
              )}
              <label style={label}>Note
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} style={{ ...inputStyle, height: "auto", padding: "8px 10px", resize: "vertical", width: "100%" }} />
              </label>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={onClose} style={{ padding: "9px 16px", borderRadius: 10, border: `1.5px solid ${P.warm}`, background: "#fff", color: P.mutedD, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Annuler</button>
                <button onClick={submit} disabled={busy || open.length === 0}
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, border: "none", background: P.blue, color: "#fff", fontWeight: 700, fontSize: 12, cursor: busy ? "wait" : "pointer", opacity: busy || open.length === 0 ? 0.6 : 1, fontFamily: "inherit" }}>
                  {busy ? <Loader2 size={13} className="animate-spin" /> : mode === "record" ? <Wallet size={13} /> : <Send size={13} />}
                  {mode === "record" ? "Enregistrer" : "Créer la demande"}
                </button>
              </div>
            </>
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
type Tab = "rapprochement" | "paiements" | "pdv";

export default function PaiementsManagement() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<RawOrder[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tab, setTab] = useState<Tab>("rapprochement");

  const [periodDays, setPeriodDays] = useState<number | null>(180);
  const [termDays, setTermDays] = useState(30);
  const [showParams, setShowParams] = useState(false);

  const [search, setSearch] = useState("");
  const [recoFilter, setRecoFilter] = useState<"all" | RecoKey>("all");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [posFilter, setPosFilter] = useState<number | "all">("all");
  const [payStatusFilter, setPayStatusFilter] = useState<"all" | PayStatus>("all");
  const [methodFilter, setMethodFilter] = useState<"all" | MethodKey>("all");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<{ mode: "record" | "request"; orderId: number | null } | null>(null);

  useEffect(() => { setPayments(loadPayments()); }, []);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setOrders(await fetchAll<RawOrder>("/orders/")); }
    catch (e: any) { setError(e.message || "Impossible de charger les commandes."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => { setPage(1); }, [tab, search, recoFilter, overdueOnly, posFilter, payStatusFilter, methodFilter, periodDays, termDays]);

  const now = Date.now();
  const periodOrders = useMemo(() => {
    const start = periodDays ? Date.now() - periodDays * DAY : 0;
    return orders.filter((o) => new Date(o.date).getTime() >= start);
  }, [orders, periodDays]);

  const recs = useMemo(() => reconcile(periodOrders, payments, termDays, Date.now()), [periodOrders, payments, termDays]);
  const billable = useMemo(() => recs.filter((r) => r.order.status !== "cancelled"), [recs]);

  // ── Indicateurs globaux ────────────────────────────────────────────────
  const kpi = useMemo(() => {
    const billed = billable.reduce((s, r) => s + r.total, 0);
    const collected = billable.reduce((s, r) => s + Math.min(r.paid, r.total), 0);
    const outstanding = billable.reduce((s, r) => s + r.due, 0);
    const overdue = billable.filter((r) => r.overdueDays > 0).reduce((s, r) => s + r.due, 0);
    const solde = billable.filter((r) => r.reco === "solde" || r.reco === "trop_percu").length;
    const delays = billable.map((r) => r.settleDays).filter((d): d is number => d !== null);
    const ids = new Set(recs.map((r) => r.order.id));
    const attempts = payments.filter((p) => ids.has(p.orderId) && (p.status === "success" || p.status === "failed"));
    const failed = attempts.filter((p) => p.status === "failed").length;
    return {
      billed, collected, outstanding, overdue,
      rate: billable.length ? (solde / billable.length) * 100 : 0,
      avgDelay: delays.length ? mean(delays) : null,
      failRate: attempts.length ? (failed / attempts.length) * 100 : 0, attempts: attempts.length,
    };
  }, [billable, recs, payments]);

  const recoCounts = useMemo(() => {
    const c = Object.fromEntries(RECO_KEYS.map((k) => [k, 0])) as Record<RecoKey, number>;
    recs.forEach((r) => { c[r.reco]++; });
    return c;
  }, [recs]);

  // ── Ancienneté des créances ────────────────────────────────────────────
  const ageing = useMemo(() => {
    const b = [
      { name: "Non échu", value: 0, color: P.green }, { name: "1-30 j", value: 0, color: P.blueL },
      { name: "31-60 j", value: 0, color: P.orange }, { name: "61-90 j", value: 0, color: "#E8743B" }, { name: "> 90 j", value: 0, color: P.red },
    ];
    billable.forEach((r) => {
      if (r.due <= 0) return;
      const d = r.overdueDays;
      b[d === 0 ? 0 : d <= 30 ? 1 : d <= 60 ? 2 : d <= 90 ? 3 : 4].value += r.due;
    });
    return b;
  }, [billable]);

  // ── Facturé vs encaissé (6 derniers mois) ──────────────────────────────
  const monthly = useMemo(() => {
    const d0 = new Date();
    const pts = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(d0.getFullYear(), d0.getMonth() - (5 - i), 1);
      return { key: monthKey(d), label: d.toLocaleDateString("fr-FR", { month: "short" }), facture: 0, encaisse: 0 };
    });
    orders.filter((o) => o.status !== "cancelled").forEach((o) => {
      const m = pts.find((x) => x.key === monthKey(new Date(o.date)));
      if (m) m.facture += num(o.total);
    });
    payments.filter((p) => p.status === "success" && p.paidAt).forEach((p) => {
      const m = pts.find((x) => x.key === monthKey(new Date(p.paidAt as string)));
      if (m) m.encaisse += p.amount;
    });
    return pts;
  }, [orders, payments]);

  // ── Reporting par point de vente ───────────────────────────────────────
  const posRecs = useMemo<PosRec[]>(() => {
    const map = new Map<number, OrderRec[]>();
    billable.forEach((r) => { if (!map.has(r.posId)) map.set(r.posId, []); map.get(r.posId)!.push(r); });
    const ids = new Set(recs.map((r) => r.order.id));
    return Array.from(map.entries()).map(([posId, list]) => {
      const billed = list.reduce((s, r) => s + r.total, 0);
      const collected = list.reduce((s, r) => s + Math.min(r.paid, r.total), 0);
      const outstanding = list.reduce((s, r) => s + r.due, 0);
      const overdueList = list.filter((r) => r.overdueDays > 0);
      const overdueAmt = overdueList.reduce((s, r) => s + r.due, 0);
      const maxOverdueDays = overdueList.length ? Math.max(...overdueList.map((r) => r.overdueDays)) : 0;
      const delays = list.map((r) => r.settleDays).filter((d): d is number => d !== null);
      const att = payments.filter((p) => p.posId === posId && ids.has(p.orderId) && (p.status === "success" || p.status === "failed"));
      const failRate = att.length ? (att.filter((p) => p.status === "failed").length / att.length) * 100 : 0;
      const risk: PosRec["risk"] = overdueAmt === 0 ? "sain" : maxOverdueDays > 60 || (billed > 0 && overdueAmt / billed > 0.3) ? "critique" : "relancer";
      return {
        posId, name: list[0].posName, nbOrders: list.length, billed, collected, outstanding, overdueAmt, maxOverdueDays,
        avgDelay: delays.length ? mean(delays) : null, failRate, unpaidCount: list.filter((r) => r.due > 0).length, risk,
      };
    }).sort((a, b) => b.overdueAmt - a.overdueAmt || b.outstanding - a.outstanding);
  }, [billable, recs, payments]);

  // ── Filtres ────────────────────────────────────────────────────────────
  const filteredRecs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return recs.filter((r) => {
      if (q && !(`cmd-${r.order.id} ${r.posName}`.toLowerCase().includes(q))) return false;
      if (recoFilter !== "all" && r.reco !== recoFilter) return false;
      if (overdueOnly && r.overdueDays <= 0) return false;
      if (posFilter !== "all" && r.posId !== posFilter) return false;
      return true;
    }).sort((a, b) => b.overdueDays - a.overdueDays || +new Date(b.order.date) - +new Date(a.order.date));
  }, [recs, search, recoFilter, overdueOnly, posFilter]);

  const posNameById = useMemo(() => {
    const m = new Map<number, string>();
    orders.forEach((o) => m.set(posIdOf(o), o.point_of_sale_details?.name || `PDV #${posIdOf(o)}`));
    return m;
  }, [orders]);

  const filteredPays = useMemo(() => {
    const q = search.trim().toLowerCase();
    return payments.filter((p) => {
      if (q && !(`${p.reference} cmd-${p.orderId} ${posNameById.get(p.posId) ?? ""}`.toLowerCase().includes(q))) return false;
      if (payStatusFilter !== "all" && p.status !== payStatusFilter) return false;
      if (methodFilter !== "all" && p.method !== methodFilter) return false;
      if (posFilter !== "all" && p.posId !== posFilter) return false;
      return true;
    }).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [payments, search, payStatusFilter, methodFilter, posFilter, posNameById]);

  const filteredPos = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posRecs.filter((p) => !q || p.name.toLowerCase().includes(q));
  }, [posRecs, search]);

  const rows = tab === "rapprochement" ? filteredRecs : tab === "paiements" ? filteredPays : filteredPos;
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const slice = <T,>(l: T[]) => l.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Actions ────────────────────────────────────────────────────────────
  const commit = (next: Payment[]) => { setPayments(next); savePayments(next); };
  const addPayment = (p: Payment) => commit([p, ...payments]);
  const setStatus = (id: string, status: PayStatus) =>
    commit(payments.map((p) => p.id === id ? { ...p, status, paidAt: status === "success" ? new Date().toISOString() : status === "pending" ? null : p.paidAt } : p));

  const download = (name: string, head: string[], data: (string | number)[][]) => {
    const csv = "\uFEFF" + [head, ...data].map((r) => r.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(";")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    a.download = name; a.click();
  };
  const exportCsv = () => {
    if (tab === "rapprochement") {
      download("rapprochement_commandes.csv",
        ["Commande", "Point de vente", "Date", "Échéance", "Statut commande", "Total (XOF)", "Encaissé (XOF)", "Reste (XOF)", "Rapprochement", "Jours de retard"],
        filteredRecs.map((r) => [`CMD-${r.order.id}`, r.posName, fdate(r.order.date), fdate(r.dueDate), r.order.status, Math.round(r.total), Math.round(r.paid), Math.round(r.due), RECO[r.reco].label, r.overdueDays]));
    } else if (tab === "paiements") {
      download("paiements.csv",
        ["Référence", "Commande", "Point de vente", "Moyen", "Montant (XOF)", "Statut", "Créé le", "Encaissé le", "Note"],
        filteredPays.map((p) => [p.reference, `CMD-${p.orderId}`, posNameById.get(p.posId) ?? p.posId, METHODS[p.method].label, p.amount, PAY_STATUS[p.status].label, fdate(p.createdAt), fdate(p.paidAt), p.note]));
    } else {
      download("reglement_par_pdv.csv",
        ["Point de vente", "Commandes", "Facturé (XOF)", "Encaissé (XOF)", "Reste (XOF)", "Impayés échus (XOF)", "Retard max (j)", "Délai moyen de règlement (j)", "Taux d'échec (%)", "Risque"],
        filteredPos.map((p) => [p.name, p.nbOrders, Math.round(p.billed), Math.round(p.collected), Math.round(p.outstanding), Math.round(p.overdueAmt), p.maxOverdueDays, p.avgDelay?.toFixed(1) ?? "", p.failRate.toFixed(0), RISK[p.risk].label]));
    }
  };

  /* ── États de chargement ── */
  if (loading && orders.length === 0) {
    return (
      <div style={{ ...card, padding: 56, textAlign: "center" }}>
        <Loader2 size={32} className="animate-spin" style={{ color: P.blue, margin: "0 auto 12px" }} />
        <p style={{ fontSize: 13, color: P.textSub, fontWeight: 600, margin: 0 }}>Chargement des commandes…</p>
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

  const posOptions = Array.from(new Set(orders.map(posIdOf))).map((id) => [id, posNameById.get(id) ?? `PDV #${id}`] as [number, string]).sort((a, b) => a[1].localeCompare(b[1]));

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
            <CreditCard size={15} style={{ color: P.blueL }} /> LanfiaLink Pay
          </p>
          <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 800, margin: 0 }}>Paiements et rapprochement des commandes</h2>
          <p style={{ color: "rgba(200,230,248,0.85)", fontSize: 12, margin: "6px 0 0", lineHeight: 1.5 }}>
            Suivez ce qui a été facturé, encaissé et reste dû, commande par commande et point de vente par point de vente.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={load} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 10, border: "none", background: "rgba(255,255,255,0.16)", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Actualiser
          </button>
          <button onClick={() => setModal({ mode: "request", orderId: null })} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 10, border: "none", background: "rgba(255,255,255,0.16)", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            <Send size={13} /> Demande de paiement
          </button>
          <button onClick={() => setModal({ mode: "record", orderId: null })} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 10, border: "none", background: P.blue, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            <Plus size={13} /> Enregistrer un paiement
          </button>
        </div>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <Kpi icon={Receipt} label="Facturé" value={`${compact(kpi.billed)} XOF`} sub={`${billable.length} commande(s)`} color={P.blue} />
        <Kpi icon={Wallet} label="Encaissé" value={`${compact(kpi.collected)} XOF`} sub={kpi.billed ? `${((kpi.collected / kpi.billed) * 100).toFixed(0)} % du facturé` : undefined} color={P.green} />
        <Kpi icon={Banknote} label="Reste à encaisser" value={`${compact(kpi.outstanding)} XOF`} sub={`dont ${compact(kpi.overdue)} XOF en retard`} color={P.orange} />
        <Kpi icon={CheckCircle2} label="Taux de rapprochement" value={`${kpi.rate.toFixed(0)} %`} sub="Commandes soldées" color={P.teal} />
        <Kpi icon={Clock} label="Délai moyen de règlement" value={kpi.avgDelay === null ? "—" : `${kpi.avgDelay.toFixed(0)} j`} sub="Commandes soldées" color={P.purple} />
        <Kpi icon={XCircle} label="Taux d'échec" value={kpi.attempts ? `${kpi.failRate.toFixed(0)} %` : "—"} sub={`${kpi.attempts} tentative(s)`} color={P.red} />
      </div>

      {/* Graphiques */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
        <div style={{ ...card, padding: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: P.text, margin: "0 0 2px" }}>Ancienneté des créances</p>
          <p style={{ fontSize: 11, color: P.muted, margin: "0 0 10px" }}>Montants restant dus, selon le retard par rapport à l'échéance ({termDays} jours)</p>
          <div style={{ height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageing} margin={{ top: 6, right: 6, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={P.surface} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: P.muted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: P.muted }} axisLine={false} tickLine={false} tickFormatter={compact} />
                <Tooltip formatter={(v: any) => money(Number(v))} />
                <Bar dataKey="value" name="Reste dû" radius={[5, 5, 0, 0]}>
                  {ageing.map((a, i) => <Cell key={i} fill={a.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ ...card, padding: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: P.text, margin: "0 0 2px" }}>Facturé et encaissé — 6 derniers mois</p>
          <p style={{ fontSize: 11, color: P.muted, margin: "0 0 10px" }}>Facturation par mois de commande, encaissement par mois de paiement</p>
          <div style={{ height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthly} margin={{ top: 6, right: 6, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={P.surface} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: P.muted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: P.muted }} axisLine={false} tickLine={false} tickFormatter={compact} />
                <Tooltip formatter={(v: any) => money(Number(v))} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="facture" name="Facturé" fill={P.blueL} radius={[5, 5, 0, 0]} />
                <Line type="monotone" dataKey="encaisse" name="Encaissé" stroke={P.green} strokeWidth={2.5} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Onglets + filtres */}
      <div style={{ ...card, overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 4, padding: "0 12px", background: P.surface, borderBottom: `1px solid ${P.warmL}`, overflowX: "auto" }}>
          {([["rapprochement", "Rapprochement des commandes", Receipt, recs.length], ["paiements", "Paiements", CreditCard, payments.length], ["pdv", "Règlement par point de vente", Store, posRecs.length]] as const).map(([k, label, Icon, n]) => (
            <button key={k} onClick={() => setTab(k)}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "13px 14px", fontSize: 12, fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
                             color: tab === k ? P.blue : P.muted, borderBottom: `2.5px solid ${tab === k ? P.blue : "transparent"}`, marginBottom: -1 }}>
              <Icon size={13} />{label}
              <span style={{ background: tab === k ? P.blue : "#fff", color: tab === k ? "#fff" : P.muted, borderRadius: 9999, padding: "1px 8px", fontSize: 10 }}>{n}</span>
            </button>
          ))}
        </div>

        <div style={{ padding: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", borderBottom: `1px solid ${P.surface}` }}>
          <div style={{ position: "relative", flex: "1 1 220px", maxWidth: 320 }}>
            <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: P.muted }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tab === "paiements" ? "Référence, commande, PDV…" : "Commande ou point de vente…"} style={{ ...inputStyle, width: "100%", paddingLeft: 32 }} />
          </div>
          {tab !== "pdv" && (
            <select value={posFilter} onChange={(e) => setPosFilter(e.target.value === "all" ? "all" : Number(e.target.value))} style={inputStyle} aria-label="Point de vente">
              <option value="all">Tous les points de vente</option>
              {posOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          )}
          {tab === "rapprochement" && (
            <>
              <select value={recoFilter} onChange={(e) => setRecoFilter(e.target.value as any)} style={inputStyle} aria-label="Statut de rapprochement">
                <option value="all">Tous les statuts ({recs.length})</option>
                {RECO_KEYS.map((k) => <option key={k} value={k}>{RECO[k].label} ({recoCounts[k]})</option>)}
              </select>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: P.textSub, fontWeight: 600 }}>
                <input type="checkbox" checked={overdueOnly} onChange={(e) => setOverdueOnly(e.target.checked)} style={{ accentColor: P.blue }} /> En retard seulement
              </label>
            </>
          )}
          {tab === "paiements" && (
            <>
              <select value={payStatusFilter} onChange={(e) => setPayStatusFilter(e.target.value as any)} style={inputStyle} aria-label="Statut du paiement">
                <option value="all">Tous les statuts</option>
                {(Object.keys(PAY_STATUS) as PayStatus[]).map((k) => <option key={k} value={k}>{PAY_STATUS[k].label}</option>)}
              </select>
              <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value as any)} style={inputStyle} aria-label="Moyen de paiement">
                <option value="all">Tous les moyens</option>
                {METHOD_KEYS.map((k) => <option key={k} value={k}>{METHODS[k].label}</option>)}
              </select>
            </>
          )}
          <select value={periodDays ?? "all"} onChange={(e) => setPeriodDays(e.target.value === "all" ? null : Number(e.target.value))} style={inputStyle} aria-label="Période des commandes">
            <option value="30">Commandes des 30 jours</option>
            <option value="90">Commandes des 90 jours</option>
            <option value="180">Commandes des 180 jours</option>
            <option value="365">Commandes des 12 mois</option>
            <option value="all">Tout l'historique</option>
          </select>
          <button onClick={() => setShowParams((s) => !s)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 36, padding: "0 12px", borderRadius: 10, border: `1.5px solid ${showParams ? P.blue : P.warm}`, background: showParams ? P.pale : "#fff", color: P.mutedD, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            <SlidersHorizontal size={13} /> Échéance
          </button>
          <button onClick={exportCsv} style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, height: 36, padding: "0 12px", borderRadius: 10, border: `1.5px solid ${P.warm}`, background: "#fff", color: P.mutedD, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            <Download size={13} /> Exporter CSV
          </button>
        </div>
        {showParams && (
          <div style={{ padding: "12px 14px", background: P.pale, borderBottom: `1px solid ${P.surface}`, display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: P.mutedD, display: "flex", alignItems: "center", gap: 8 }}>
              Délai de paiement accordé
              <input type="number" min={0} max={365} value={termDays} onChange={(e) => setTermDays(Math.max(0, Number(e.target.value) || 0))} style={{ ...inputStyle, width: 80 }} /> jours après la date de commande
            </label>
            <span style={{ fontSize: 11, color: P.muted }}>Une commande non soldée devient « en retard » au-delà de cette échéance.</span>
          </div>
        )}

        {/* ── Rapprochement ── */}
        {tab === "rapprochement" && (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                <thead><tr style={{ background: P.surface }}>
                  {["Commande", "Point de vente", "Date", "Échéance", "Total", "Encaissé", "Reste", "Rapprochement", ""].map((h) => <th key={h} style={th}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {filteredRecs.length === 0 ? (
                    <EmptyRow cols={9} title={recs.length === 0 ? "Aucune commande sur la période" : "Aucune commande ne correspond"} text={recs.length === 0 ? "Élargissez la période d'analyse." : "Modifiez les filtres."} />
                  ) : slice(filteredRecs).map((r) => (
                    <tr key={r.order.id} style={{ borderTop: `1px solid ${P.surface}`, opacity: r.reco === "annule" ? 0.6 : 1 }}>
                      <td style={{ ...td, fontWeight: 700, color: P.text }}>CMD-{r.order.id}</td>
                      <td style={{ ...td, color: P.textSub }}>{r.posName}</td>
                      <td style={{ ...td, color: P.muted }}>{fdate(r.order.date)}</td>
                      <td style={{ ...td, color: r.overdueDays > 0 ? "#B03318" : P.muted, whiteSpace: "nowrap" }}>
                        {fdate(r.dueDate)}{r.overdueDays > 0 && <span style={{ display: "block", fontSize: 10, fontWeight: 700 }}>{r.overdueDays} j de retard</span>}
                      </td>
                      <td style={{ ...td, fontWeight: 700, color: P.blueD, whiteSpace: "nowrap" }}>{money(r.total)}</td>
                      <td style={{ ...td, color: "#047857", fontWeight: 600, whiteSpace: "nowrap" }}>
                        {money(r.paid)}{r.pendingAmt > 0 && <span style={{ display: "block", fontSize: 10, color: "#4B2A94" }}>+ {money(r.pendingAmt)} en attente</span>}
                      </td>
                      <td style={{ ...td, fontWeight: 700, color: r.due > 0 ? P.text : P.muted, whiteSpace: "nowrap" }}>{money(r.due)}</td>
                      <td style={td}><RecoPill k={r.reco} /></td>
                      <td style={td}>
                        {r.order.status !== "cancelled" && r.due > 0 && (
                          <button onClick={() => setModal({ mode: "record", orderId: r.order.id })}
                                  style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, border: `1px solid ${P.warm}`, background: P.pale, color: P.blue, fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                            <Wallet size={11} /> Encaisser
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={page} total={totalPages} count={filteredRecs.length} size={PAGE_SIZE} onPage={setPage} />
          </>
        )}

        {/* ── Paiements ── */}
        {tab === "paiements" && (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                <thead><tr style={{ background: P.surface }}>
                  {["Référence", "Commande", "Point de vente", "Moyen", "Montant", "Statut", "Créé le", "Encaissé le", "Actions"].map((h) => <th key={h} style={th}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {filteredPays.length === 0 ? (
                    <EmptyRow cols={9} title={payments.length === 0 ? "Aucun paiement enregistré" : "Aucun paiement ne correspond"}
                              text={payments.length === 0 ? "Utilisez « Enregistrer un paiement » ou « Demande de paiement » pour commencer le rapprochement." : "Modifiez les filtres."} />
                  ) : slice(filteredPays).map((p) => (
                    <tr key={p.id} style={{ borderTop: `1px solid ${P.surface}` }}>
                      <td style={{ ...td, fontWeight: 700, color: P.text, whiteSpace: "nowrap" }}>{p.reference}</td>
                      <td style={{ ...td, color: P.textSub }}>CMD-{p.orderId}</td>
                      <td style={{ ...td, color: P.textSub }}>{posNameById.get(p.posId) ?? `PDV #${p.posId}`}</td>
                      <td style={td}><MethodTag m={p.method} /></td>
                      <td style={{ ...td, fontWeight: 700, color: P.blueD, whiteSpace: "nowrap" }}>{money(p.amount)}</td>
                      <td style={td}><Pill bg={PAY_STATUS[p.status].bg} fg={PAY_STATUS[p.status].fg}>{PAY_STATUS[p.status].label}</Pill></td>
                      <td style={{ ...td, color: P.muted }}>{fdate(p.createdAt)}</td>
                      <td style={{ ...td, color: P.muted }}>{fdate(p.paidAt)}</td>
                      <td style={td}>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {p.status === "pending" && <>
                            <button onClick={() => setStatus(p.id, "success")} style={{ padding: "4px 9px", borderRadius: 8, border: "none", background: "#DCF5EC", color: "#044D38", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>Confirmer</button>
                            <button onClick={() => setStatus(p.id, "failed")} style={{ padding: "4px 9px", borderRadius: 8, border: "none", background: "#FCE4DC", color: "#7A2410", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>Échec</button>
                          </>}
                          {p.status === "success" && (
                            <button onClick={() => { if (window.confirm("Marquer ce paiement comme remboursé ? Il ne comptera plus dans l'encaissé.")) setStatus(p.id, "refunded"); }}
                                    style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 9px", borderRadius: 8, border: "none", background: "#EADFFB", color: "#4B2A94", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
                              <RotateCcw size={10} /> Rembourser
                            </button>
                          )}
                          {p.status === "failed" && (
                            <button onClick={() => setStatus(p.id, "pending")} style={{ padding: "4px 9px", borderRadius: 8, border: `1px solid ${P.warm}`, background: "#fff", color: P.mutedD, fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>Relancer</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={page} total={totalPages} count={filteredPays.length} size={PAGE_SIZE} onPage={setPage} />
          </>
        )}

        {/* ── Règlement par PDV ── */}
        {tab === "pdv" && (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                <thead><tr style={{ background: P.surface }}>
                  {["Point de vente", "Risque", "Commandes", "Facturé", "Encaissé", "Reste dû", "Impayés échus", "Délai moyen", "Échecs", ""].map((h) => <th key={h} style={th}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {filteredPos.length === 0 ? (
                    <EmptyRow cols={10} title="Aucun point de vente à afficher" text="Les points de vente apparaissent dès qu'ils ont une commande sur la période." />
                  ) : slice(filteredPos).map((p) => (
                    <tr key={p.posId} style={{ borderTop: `1px solid ${P.surface}` }}>
                      <td style={{ ...td, fontWeight: 700, color: P.text }}>{p.name}</td>
                      <td style={td}><Pill bg={RISK[p.risk].bg} fg={RISK[p.risk].fg}>{RISK[p.risk].label}</Pill></td>
                      <td style={{ ...td, color: P.textSub }}>{p.nbOrders}{p.unpaidCount > 0 && <span style={{ color: P.muted, fontSize: 11 }}> · {p.unpaidCount} à solder</span>}</td>
                      <td style={{ ...td, fontWeight: 700, color: P.blueD, whiteSpace: "nowrap" }}>{money(p.billed)}</td>
                      <td style={{ ...td, color: "#047857", fontWeight: 600, whiteSpace: "nowrap" }}>{money(p.collected)}</td>
                      <td style={{ ...td, fontWeight: 700, color: P.text, whiteSpace: "nowrap" }}>{money(p.outstanding)}</td>
                      <td style={{ ...td, whiteSpace: "nowrap", color: p.overdueAmt > 0 ? "#B03318" : P.muted, fontWeight: p.overdueAmt > 0 ? 700 : 500 }}>
                        {p.overdueAmt > 0 ? <>{money(p.overdueAmt)}<span style={{ display: "block", fontSize: 10 }}>jusqu'à {p.maxOverdueDays} j de retard</span></> : "—"}
                      </td>
                      <td style={{ ...td, color: P.textSub }}>{p.avgDelay === null ? "—" : `${p.avgDelay.toFixed(0)} j`}</td>
                      <td style={{ ...td, color: p.failRate > 20 ? "#B03318" : P.textSub }}>{p.failRate > 0 ? `${p.failRate.toFixed(0)} %` : "—"}</td>
                      <td style={td}>
                        <button onClick={() => { setPosFilter(p.posId); setTab("rapprochement"); }}
                                style={{ padding: "5px 10px", borderRadius: 8, border: `1px solid ${P.warm}`, background: P.pale, color: P.blue, fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                          Voir les commandes
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={page} total={totalPages} count={filteredPos.length} size={PAGE_SIZE} onPage={setPage} />
          </>
        )}
      </div>

      <div style={{ ...card, padding: "10px 14px", display: "flex", gap: 8, alignItems: "flex-start", fontSize: 11, color: P.muted, lineHeight: 1.5 }}>
        <Clock size={13} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          Les paiements sont enregistrés pour l'instant dans ce navigateur : ils ne sont pas partagés entre utilisateurs et aucune demande n'est transmise à un PSP. Les commandes annulées ne comptent pas dans le facturé ; une commande annulée déjà payée apparaît « À rembourser ».
        </span>
      </div>

      {modal && (
        <PaymentModal mode={modal.mode} recs={recs} initialOrderId={modal.orderId}
                      onClose={() => setModal(null)} onCreate={addPayment} />
      )}
    </div>
  );
}