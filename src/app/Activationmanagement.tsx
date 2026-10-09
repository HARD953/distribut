"use client";
// components/dashboard/ActivationManagement.tsx
// LanfiaLink Activate : ciblage -> mission -> preuve -> validation -> ROI (doc stratégique §13)

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Megaphone, Plus, Play, Target, CheckCircle, XCircle, Camera, MapPin, TrendingUp,
  Download, X, ChevronRight, ChevronLeft, Loader2, AlertTriangle, ClipboardList,
  BarChart3, Trash2, ShieldCheck, Flag,
} from "lucide-react";
import { apiService } from "./ApiService";

/* ─── Palette (identique au reste de l'admin) ─────────────── */
const C = {
  blue: "#1A8FD1", blueD: "#0D6FAB", blueL: "#4FB3E8", navy: "#0D4E7A",
  pale: "#EDF5FA", surface: "#F0F5F9", line: "#C0D4E6", lineL: "#D4E4F0",
  text: "#0A1E2E", sub: "#2A4A62", muted: "#5A7A92",
  green: "#0A9E7A", greenBg: "#DCF5EC", greenTx: "#044D38",
  amber: "#D08A00", amberBg: "#FBEFD6", amberTx: "#7A4F00",
  red: "#B03318", redBg: "#FCE4DC", redTx: "#7A2410",
  grey: "#6A8AA2", greyBg: "#EAF0F5", greyTx: "#3A5A72",
  violet: "#2E4DB0", violetBg: "#D4DCFA",
};

/* ─── Types ───────────────────────────────────────────────── */
type CampaignStatus = "brouillon" | "planifiee" | "en_cours" | "terminee" | "annulee";
type MissionStatus = "a_faire" | "en_cours" | "soumise" | "validee" | "rejetee";
interface ChecklistItem { id: string; label: string; required: boolean }
interface Campaign {
  id: number; client_name: string; name: string; objective: string; status: CampaignStatus;
  budget: string; cost_per_mission: string; start_date: string; end_date: string;
  checklist: ChecklistItem[]; min_photos: number; geofence_meters: number;
  missions_total: number; missions_validated: number; missions_submitted: number; missions_rejected: number;
}
interface Proof {
  id: number; image: string; type: string; distance_m: number | null;
  within_geofence: boolean; captured_at: string;
}
interface Mission {
  id: number; campaign: number; pos_id: number; pos_name: string; commune: string; quartier: string;
  match_score: number; agent: number | null; agent_name: string; status: MissionStatus;
  scheduled_date: string | null; rejection_reason: string; checklist_result: Record<string, boolean>;
  proofs: Proof[];
}
interface Agent { id: number; name: string }
interface Report {
  missions_total: number; by_status: Record<MissionStatus, number>; completion_rate: number;
  conformity_rate: number | null; geofence_rate: number | null; proofs_total: number;
  budget: number; cost_engaged: number; cost_per_validated: number | null;
  uplift: null | {
    target_before: number; target_after: number; target_growth_pct: number | null;
    control_size: number; control_growth_pct: number | null; net_uplift_pct: number | null;
    incremental_orders: number | null;
  };
}
interface PreviewRow {
  id: number; name: string; commune: string; quartier: string; score: number;
  branding: string; nb_operateurs: number;
}

/* ─── Helpers API ─────────────────────────────────────────── */
async function parseError(res: Response): Promise<string> {
  try {
    const d = await res.json();
    if (typeof d === "string") return d;
    if (d.detail) return d.detail;
    const first = Object.values(d)[0];
    return Array.isArray(first) ? String(first[0]) : "Une erreur est survenue.";
  } catch { return "Une erreur est survenue."; }
}
async function apiGet<T>(url: string): Promise<T> {
  const res = await apiService.get(url);
  if (!res.ok) throw new Error(await parseError(res));
  const d = await res.json();
  return (Array.isArray(d) || !d?.results ? d : d.results) as T;
}
async function apiPost<T>(url: string, body: any = {}): Promise<T> {
  const res = await apiService.post(url, body);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

/* ─── Libellés et styles de statut ────────────────────────── */
const CAMPAIGN_STATUS: Record<CampaignStatus, { label: string; bg: string; tx: string }> = {
  brouillon: { label: "Brouillon", bg: C.greyBg, tx: C.greyTx },
  planifiee: { label: "Planifiée", bg: C.violetBg, tx: C.violet },
  en_cours:  { label: "En cours",  bg: C.greenBg, tx: C.greenTx },
  terminee:  { label: "Terminée",  bg: "#D6EAF6", tx: "#083F6A" },
  annulee:   { label: "Annulée",   bg: C.redBg, tx: C.redTx },
};
const MISSION_STATUS: Record<MissionStatus, { label: string; bg: string; tx: string }> = {
  a_faire:  { label: "À faire",  bg: C.greyBg, tx: C.greyTx },
  en_cours: { label: "En cours", bg: C.violetBg, tx: C.violet },
  soumise:  { label: "À valider", bg: C.amberBg, tx: C.amberTx },
  validee:  { label: "Validée",  bg: C.greenBg, tx: C.greenTx },
  rejetee:  { label: "Rejetée",  bg: C.redBg, tx: C.redTx },
};

const fmt = (n: number | string | null | undefined) => Number(n ?? 0).toLocaleString("fr-FR");
const fmtCFA = (n: number | string | null | undefined) => `${fmt(n)} CFA`;
const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");
const pct = (n: number | null | undefined) => (n === null || n === undefined ? "—" : `${n} %`);
const signed = (n: number | null | undefined) => (n === null || n === undefined ? "—" : `${n > 0 ? "+" : ""}${n} %`);

/* ─── Petits composants ───────────────────────────────────── */
const card: React.CSSProperties = { background: "#fff", border: `0.5px solid ${C.line}`, borderRadius: 16 };
const input: React.CSSProperties = {
  width: "100%", height: 36, borderRadius: 10, padding: "0 10px", fontSize: 13,
  background: "#fff", border: `1.5px solid ${C.line}`, color: C.text, outline: "none", fontFamily: "inherit",
};
const btn = (bg: string, color = "#fff"): React.CSSProperties => ({
  display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10,
  background: bg, color, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit",
});
const btnGhost: React.CSSProperties = { ...btn("#fff", C.sub), border: `1px solid ${C.line}` };

const Chip = ({ s }: { s: { label: string; bg: string; tx: string } }) => (
  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, fontWeight: 700, background: s.bg, color: s.tx, whiteSpace: "nowrap" }}>
    {s.label}
  </span>
);

const Bar = ({ value, color = C.blue }: { value: number; color?: string }) => (
  <div style={{ height: 6, borderRadius: 99, background: C.surface, overflow: "hidden" }}>
    <div style={{ width: `${Math.max(0, Math.min(100, value))}%`, height: "100%", background: color, transition: "width .4s" }} />
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    <span style={{ fontSize: 12, fontWeight: 600, color: C.sub }}>{label}</span>
    {children}
  </label>
);

const Empty = ({ icon: Icon, title, text }: { icon: React.ComponentType<any>; title: string; text: string }) => (
  <div style={{ padding: "40px 16px", textAlign: "center" }}>
    <Icon size={28} style={{ color: "#B8D4E8", margin: "0 auto 10px" }} />
    <p style={{ fontSize: 13, fontWeight: 600, color: C.sub, marginBottom: 4 }}>{title}</p>
    <p style={{ fontSize: 12, color: C.muted, maxWidth: 340, margin: "0 auto" }}>{text}</p>
  </div>
);

const Kpi = ({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) => (
  <div style={{ ...card, padding: 16 }}>
    <p style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>{label}</p>
    <p style={{ fontSize: 24, fontWeight: 700, color, marginTop: 4, lineHeight: 1.1 }}>{value}</p>
    {sub && <p style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{sub}</p>}
  </div>
);

/* ═══════════════════════════════════════════════════════════
   Assistant de création de campagne (3 étapes)
   ═══════════════════════════════════════════════════════════ */
const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: "branding", label: "Branding / affiche posé conforme", required: true },
  { id: "produit_visible", label: "Produit visible et bien placé", required: true },
  { id: "avant_apres", label: "Photos avant et après réalisées", required: true },
  { id: "accord", label: "Accord du commerçant obtenu", required: false },
];

function CampaignWizard({ onClose, onCreated }: { onClose: () => void; onCreated: (id: number) => void }) {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Étape 1 : brief
  const [client, setClient] = useState("");
  const [name, setName] = useState("");
  const [objective, setObjective] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [budget, setBudget] = useState(0);
  const [costPerMission, setCostPerMission] = useState(0);

  // Étape 2 : ciblage
  const [communes, setCommunes] = useState("");
  const [minScore, setMinScore] = useState(50);
  const [branding, setBranding] = useState("non_brande");
  const [minOp, setMinOp] = useState(0);
  const [grandeVoie, setGrandeVoie] = useState(false);
  const [topN, setTopN] = useState(50);
  const [preview, setPreview] = useState<{ eligible_total: number; results: PreviewRow[] } | null>(null);
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [previewing, setPreviewing] = useState(false);

  // Étape 3 : exécution
  const [checklist, setChecklist] = useState<ChecklistItem[]>(DEFAULT_CHECKLIST);
  const [minPhotos, setMinPhotos] = useState(2);
  const [geofence, setGeofence] = useState(50);

  const criteria = useMemo(() => ({
    communes: communes.split(",").map((c) => c.trim()).filter(Boolean),
    min_score: minScore, branding, min_operateurs: minOp, grande_voie: grandeVoie, top_n: topN,
    start_date: start, end_date: end,
  }), [communes, minScore, branding, minOp, grandeVoie, topN, start, end]);

  const runPreview = async () => {
    setPreviewing(true); setError(null);
    try {
      const d = await apiPost<{ eligible_total: number; results: PreviewRow[] }>("/activations/campaigns/preview-targeting/", criteria);
      setPreview(d); setExcluded(new Set());
    } catch (e: any) { setError(e.message); }
    finally { setPreviewing(false); }
  };

  const selected = preview ? preview.results.filter((r) => !excluded.has(r.id)) : [];
  const briefOk = client.trim() && name.trim() && start && end && end >= start;
  const estCost = selected.length * costPerMission;

  const create = async () => {
    setBusy(true); setError(null);
    try {
      const camp = await apiPost<Campaign>("/activations/campaigns/", {
        client_name: client, name, objective, start_date: start, end_date: end,
        budget, cost_per_mission: costPerMission, checklist, min_photos: minPhotos,
        geofence_meters: geofence, targeting: criteria,
      });
      try {
        await apiPost(`/activations/campaigns/${camp.id}/generate-missions/`, { pos_ids: selected.map((r) => r.id) });
      } catch (e: any) {
        setError(`Campagne créée, mais les missions n'ont pas pu être générées : ${e.message}`);
        setBusy(false); return;
      }
      onCreated(camp.id);
    } catch (e: any) { setError(e.message); setBusy(false); }
  };

  const steps = ["Brief", "Ciblage", "Exécution"];

  return (
    <div role="dialog" aria-modal="true" aria-label="Nouvelle campagne"
      style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(10,30,46,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ ...card, width: "100%", maxWidth: 760, maxHeight: "92vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `0.5px solid ${C.lineL}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Nouvelle campagne d'activation</p>
            <div style={{ display: "flex", gap: 14, marginTop: 6 }}>
              {steps.map((s, i) => (
                <span key={s} style={{ fontSize: 12, fontWeight: i === step ? 700 : 500, color: i === step ? C.blue : i < step ? C.green : C.muted }}>
                  {i < step ? "✓ " : ""}{s}
                </span>
              ))}
            </div>
          </div>
          <button onClick={onClose} aria-label="Fermer" style={{ background: "none", border: "none", cursor: "pointer", color: C.muted }}><X size={18} /></button>
        </div>

        <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>
          {error && (
            <div style={{ display: "flex", gap: 8, padding: 12, borderRadius: 10, background: C.redBg, color: C.redTx, fontSize: 12, marginBottom: 14 }}>
              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />{error}
            </div>
          )}

          {step === 0 && (
            <div style={{ display: "grid", gap: 14, gridTemplateColumns: "1fr 1fr" }}>
              <Field label="Entreprise cliente"><input style={input} value={client} onChange={(e) => setClient(e.target.value)} placeholder="Ex : SOLIBRA" /></Field>
              <Field label="Nom de la campagne"><input style={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Lancement boisson, Abidjan" /></Field>
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="Objectif">
                  <textarea style={{ ...input, height: 64, padding: 10, resize: "vertical" }} value={objective}
                    onChange={(e) => setObjective(e.target.value)} placeholder="Ex : poser le branding et mesurer la hausse des commandes sur 30 jours" />
                </Field>
              </div>
              <Field label="Début"><input type="date" style={input} value={start} onChange={(e) => setStart(e.target.value)} /></Field>
              <Field label="Fin"><input type="date" style={input} value={end} min={start} onChange={(e) => setEnd(e.target.value)} /></Field>
              <Field label="Budget total (CFA)"><input type="number" min={0} style={input} value={budget} onChange={(e) => setBudget(Number(e.target.value))} /></Field>
              <Field label="Coût par mission validée (CFA)"><input type="number" min={0} style={input} value={costPerMission} onChange={(e) => setCostPerMission(Number(e.target.value))} /></Field>
            </div>
          )}

          {step === 1 && (
            <div>
              <div style={{ display: "grid", gap: 14, gridTemplateColumns: "1fr 1fr" }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <Field label="Communes (séparées par des virgules, vide = toutes)">
                    <input style={input} value={communes} onChange={(e) => setCommunes(e.target.value)} placeholder="Ex : Cocody, Yopougon, Abobo" />
                  </Field>
                </div>
                <Field label={`Score minimum : ${minScore}`}>
                  <input type="range" min={0} max={100} step={5} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} style={{ accentColor: C.blue }} />
                </Field>
                <Field label={`Nombre de PDV à retenir : ${topN}`}>
                  <input type="range" min={5} max={500} step={5} value={topN} onChange={(e) => setTopN(Number(e.target.value))} style={{ accentColor: C.blue }} />
                </Field>
                <Field label="Branding actuel">
                  <select style={input} value={branding} onChange={(e) => setBranding(e.target.value)}>
                    <option value="non_brande">Non brandés (à équiper)</option>
                    <option value="brande">Déjà brandés</option>
                    <option value="tous">Tous</option>
                  </select>
                </Field>
                <Field label="Opérateurs mobiles minimum">
                  <select style={input} value={minOp} onChange={(e) => setMinOp(Number(e.target.value))}>
                    {[0, 1, 2, 3, 4].map((n) => <option key={n} value={n}>{n === 0 ? "Aucun minimum" : `≥ ${n}`}</option>)}
                  </select>
                </Field>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: C.sub }}>
                  <input type="checkbox" checked={grandeVoie} onChange={(e) => setGrandeVoie(e.target.checked)} />
                  Sur une grande voie uniquement
                </label>
              </div>
              <p style={{ fontSize: 11, color: C.muted, marginTop: 10 }}>
                Seuls les PDV géolocalisés et libres sur la période sont proposés : sans GPS, la preuve ne peut pas être contrôlée.
              </p>

              <button onClick={runPreview} disabled={previewing} style={{ ...btn(C.blue), marginTop: 14, opacity: previewing ? 0.7 : 1 }}>
                {previewing ? <Loader2 size={13} className="animate-spin" /> : <Target size={13} />} Prévisualiser le ciblage
              </button>

              {preview && (
                <div style={{ marginTop: 16 }}>
                  <p style={{ fontSize: 12, color: C.sub, marginBottom: 8 }}>
                    <strong>{fmt(preview.eligible_total)}</strong> PDV éligibles, <strong>{selected.length}</strong> retenus
                    {costPerMission > 0 && <> · coût estimé si tout est validé : <strong>{fmtCFA(estCost)}</strong></>}
                    {budget > 0 && estCost > budget && <span style={{ color: C.red, fontWeight: 700 }}> (dépasse le budget)</span>}
                  </p>
                  {preview.results.length === 0 ? (
                    <Empty icon={Target} title="Aucun PDV ne correspond" text="Baissez le score minimum ou élargissez les communes." />
                  ) : (
                    <div style={{ border: `1px solid ${C.lineL}`, borderRadius: 10, maxHeight: 230, overflowY: "auto" }}>
                      {preview.results.map((r) => {
                        const off = excluded.has(r.id);
                        return (
                          <label key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderBottom: `1px solid ${C.surface}`, fontSize: 12, opacity: off ? 0.45 : 1, cursor: "pointer" }}>
                            <input type="checkbox" checked={!off} onChange={() => setExcluded((s) => { const n = new Set(s); off ? n.delete(r.id) : n.add(r.id); return n; })} />
                            <span style={{ flex: 1, fontWeight: 600, color: C.text }}>{r.name}</span>
                            <span style={{ color: C.muted }}>{r.commune}{r.quartier ? ` · ${r.quartier}` : ""}</span>
                            <span style={{ color: C.muted }}>{r.branding}</span>
                            <span style={{ fontWeight: 700, color: C.blueD, minWidth: 28, textAlign: "right" }}>{r.score}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>Checklist de l'agent</p>
              <div style={{ display: "grid", gap: 8 }}>
                {checklist.map((it, i) => (
                  <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input style={{ ...input, flex: 1 }} value={it.label}
                      onChange={(e) => setChecklist((l) => l.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                    <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.sub, whiteSpace: "nowrap" }}>
                      <input type="checkbox" checked={it.required}
                        onChange={(e) => setChecklist((l) => l.map((x, j) => (j === i ? { ...x, required: e.target.checked } : x)))} />
                      Obligatoire
                    </label>
                    <button onClick={() => setChecklist((l) => l.filter((_, j) => j !== i))} aria-label="Supprimer l'élément"
                      style={{ background: "none", border: "none", cursor: "pointer", color: C.red }}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
              <button onClick={() => setChecklist((l) => [...l, { id: `item_${Date.now()}`, label: "", required: false }])}
                style={{ ...btnGhost, marginTop: 10 }}><Plus size={12} /> Ajouter un élément</button>

              <div style={{ display: "grid", gap: 14, gridTemplateColumns: "1fr 1fr", marginTop: 20 }}>
                <Field label="Photos minimum par mission">
                  <input type="number" min={1} max={10} style={input} value={minPhotos} onChange={(e) => setMinPhotos(Number(e.target.value))} />
                </Field>
                <Field label="Rayon de validation GPS (mètres)">
                  <input type="number" min={10} max={500} style={input} value={geofence} onChange={(e) => setGeofence(Number(e.target.value))} />
                </Field>
              </div>

              <div style={{ marginTop: 20, padding: 14, borderRadius: 12, background: C.pale, border: `1px solid ${C.lineL}`, fontSize: 12, color: C.sub, lineHeight: 1.6 }}>
                <strong style={{ color: C.text }}>{name || "Campagne"}</strong> pour {client || "le client"} · du {fmtDate(start)} au {fmtDate(end)}<br />
                {selected.length} mission(s) à générer · {minPhotos} photo(s) minimum · preuve valable à {geofence} m du PDV
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "12px 20px", borderTop: `0.5px solid ${C.lineL}`, display: "flex", justifyContent: "space-between" }}>
          <button onClick={() => (step === 0 ? onClose() : setStep(step - 1))} style={btnGhost}>
            {step === 0 ? "Annuler" : <><ChevronLeft size={13} /> Retour</>}
          </button>
          {step < 2 ? (
            <button onClick={() => setStep(step + 1)} disabled={(step === 0 && !briefOk) || (step === 1 && selected.length === 0)}
              style={{ ...btn(C.blue), opacity: (step === 0 && !briefOk) || (step === 1 && selected.length === 0) ? 0.5 : 1 }}>
              Continuer <ChevronRight size={13} />
            </button>
          ) : (
            <button onClick={create} disabled={busy || checklist.some((c) => !c.label.trim())} style={{ ...btn(C.navy), opacity: busy ? 0.7 : 1 }}>
              {busy ? <Loader2 size={13} className="animate-spin" /> : <Megaphone size={13} />} Créer la campagne
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Vue principale
   ═══════════════════════════════════════════════════════════ */
type Tab = "campagnes" | "missions" | "preuves" | "roi";

export default function ActivationManagement() {
  const [tab, setTab] = useState<Tab>("campagnes");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [statusFilter, setStatusFilter] = useState<MissionStatus | "toutes">("toutes");
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wizard, setWizard] = useState(false);
  const [rejecting, setRejecting] = useState<number | null>(null);
  const [reason, setReason] = useState("");

  const selected = campaigns.find((c) => c.id === selectedId) ?? null;

  const loadCampaigns = useCallback(async () => {
    try {
      const data = await apiGet<Campaign[]>("/activations/campaigns/");
      setCampaigns(data);
      setSelectedId((id) => id ?? data[0]?.id ?? null);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  const loadMissions = useCallback(async (id: number) => {
    setLoadingDetail(true);
    try { setMissions(await apiGet<Mission[]>(`/activations/missions/?campaign=${id}`)); }
    catch (e: any) { setError(e.message); }
    finally { setLoadingDetail(false); }
  }, []);

  const loadReport = useCallback(async (id: number) => {
    setLoadingDetail(true);
    try { setReport(await apiGet<Report>(`/activations/campaigns/${id}/report/`)); }
    catch (e: any) { setError(e.message); }
    finally { setLoadingDetail(false); }
  }, []);

  useEffect(() => { loadCampaigns(); apiGet<Agent[]>("/activations/campaigns/agents/").then(setAgents).catch(() => {}); }, [loadCampaigns]);
  useEffect(() => { if (selectedId) loadMissions(selectedId); else setMissions([]); }, [selectedId, loadMissions]);
  useEffect(() => { if (tab === "roi" && selectedId) loadReport(selectedId); }, [tab, selectedId, loadReport]);

  const act = async (fn: () => Promise<any>) => {
    setError(null);
    try { await fn(); } catch (e: any) { setError(e.message); }
  };

  const refresh = async () => {
    await loadCampaigns();
    if (selectedId) await loadMissions(selectedId);
  };

  const launch = (id: number) => act(async () => { await apiPost(`/activations/campaigns/${id}/launch/`); await refresh(); });
  const close = (id: number) => act(async () => { await apiPost(`/activations/campaigns/${id}/close/`); await refresh(); });
  const assign = (mId: number, agentId: string) => act(async () => {
    await apiPost(`/activations/missions/${mId}/assign/`, { agent_id: agentId ? Number(agentId) : null });
    if (selectedId) await loadMissions(selectedId);
  });
  const validate = (mId: number) => act(async () => { await apiPost(`/activations/missions/${mId}/validate/`); await refresh(); });
  const reject = (mId: number) => act(async () => {
    await apiPost(`/activations/missions/${mId}/reject/`, { reason });
    setRejecting(null); setReason(""); await refresh();
  });

  /* KPI globaux */
  const kpis = useMemo(() => {
    const active = campaigns.filter((c) => c.status === "en_cours");
    const validated = campaigns.reduce((a, c) => a + c.missions_validated, 0);
    const rejected = campaigns.reduce((a, c) => a + c.missions_rejected, 0);
    const toReview = campaigns.reduce((a, c) => a + c.missions_submitted, 0);
    return {
      active: active.length,
      toReview,
      conformity: validated + rejected > 0 ? Math.round((validated / (validated + rejected)) * 100) : null,
      budgetActive: active.reduce((a, c) => a + Number(c.budget), 0),
    };
  }, [campaigns]);

  const shownMissions = missions.filter((m) => statusFilter === "toutes" || m.status === statusFilter);
  const toReview = missions.filter((m) => m.status === "soumise");

  const exportMissions = () => {
    if (!selected) return;
    const head = ["PDV", "Commune", "Quartier", "Score", "Agent", "Statut", "Photos", "Hors zone GPS", "Motif de rejet"];
    const rows = missions.map((m) => [
      m.pos_name, m.commune, m.quartier, m.match_score, m.agent_name || "—", MISSION_STATUS[m.status].label,
      m.proofs.length, m.proofs.filter((p) => !p.within_geofence).length, (m.rejection_reason || "").replace(/[\r\n]+/g, " "),
    ]);
    let csv = `Client:,${selected.client_name}\nCampagne:,${selected.name}\nPériode:,${selected.start_date} → ${selected.end_date}\n\n`;
    csv += head.join(",") + "\n" + rows.map((r) => r.map((f) => `"${f}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    a.download = `activation_${selected.id}_missions.csv`;
    a.click();
  };

  if (loading) {
    return <div style={{ ...card, padding: 48, textAlign: "center" }}><Loader2 className="animate-spin" size={24} style={{ color: C.blue, margin: "0 auto" }} /></div>;
  }

  const tabs: { id: Tab; label: string; icon: React.ComponentType<any>; badge?: number }[] = [
    { id: "campagnes", label: "Campagnes", icon: Megaphone },
    { id: "missions", label: "Missions", icon: ClipboardList },
    { id: "preuves", label: "Preuves à valider", icon: Camera, badge: toReview.length },
    { id: "roi", label: "ROI", icon: BarChart3 },
  ];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Bandeau */}
      <div style={{ background: C.navy, borderRadius: 16, padding: 20, display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Megaphone size={16} style={{ color: C.blueL }} />
            <span style={{ color: "rgba(200,230,248,.9)", fontSize: 12, fontWeight: 600 }}>LanfiaLink Activate</span>
          </div>
          <p style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>Exécuter une activation terrain et en prouver le résultat</p>
          <p style={{ color: "rgba(200,230,248,.85)", fontSize: 12, marginTop: 6, maxWidth: 560 }}>
            Ciblez les bons points de vente, envoyez les agents, contrôlez les photos géolocalisées et mesurez l'effet sur les commandes.
          </p>
        </div>
        <button onClick={() => setWizard(true)} style={btn(C.blue)}><Plus size={14} /> Nouvelle campagne</button>
      </div>

      {error && (
        <div style={{ display: "flex", gap: 10, alignItems: "center", padding: 12, borderRadius: 12, background: C.redBg, color: C.redTx, fontSize: 12 }}>
          <AlertTriangle size={14} /><span style={{ flex: 1 }}>{error}</span>
          <button onClick={() => setError(null)} aria-label="Fermer" style={{ background: "none", border: "none", cursor: "pointer", color: C.redTx }}><X size={14} /></button>
        </div>
      )}

      {/* KPI */}
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
        <Kpi label="Campagnes en cours" value={fmt(kpis.active)} sub={`${campaigns.length} au total`} color={C.blueD} />
        <Kpi label="Missions à valider" value={fmt(kpis.toReview)} sub="Preuves en attente de contrôle" color={kpis.toReview > 0 ? C.amber : C.green} />
        <Kpi label="Taux de conformité" value={pct(kpis.conformity)} sub="Missions validées sur missions contrôlées" color={C.green} />
        <Kpi label="Budget en cours" value={fmtCFA(kpis.budgetActive)} sub="Campagnes actives" color={C.violet} />
      </div>

      {/* Sélecteur de campagne + onglets */}
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <div style={{ display: "inline-flex", gap: 2, padding: 4, borderRadius: 12, background: C.pale, border: `0.5px solid ${C.line}` }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} aria-pressed={tab === t.id}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit",
                background: tab === t.id ? C.blue : "transparent", color: tab === t.id ? "#fff" : C.greyTx }}>
              <t.icon size={12} />{t.label}
              {!!t.badge && <span style={{ background: C.amber, color: "#fff", borderRadius: 99, fontSize: 10, padding: "0 6px" }}>{t.badge}</span>}
            </button>
          ))}
        </div>
        {tab !== "campagnes" && campaigns.length > 0 && (
          <select aria-label="Campagne" value={selectedId ?? ""} onChange={(e) => setSelectedId(Number(e.target.value))} style={{ ...input, width: 280 }}>
            {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.client_name}</option>)}
          </select>
        )}
      </div>

      {/* ── Campagnes ── */}
      {tab === "campagnes" && (
        campaigns.length === 0 ? (
          <div style={card}><Empty icon={Megaphone} title="Aucune campagne pour l'instant" text="Créez votre première campagne : choisissez un client, ciblez les PDV, puis lancez les missions." /></div>
        ) : (
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
            {campaigns.map((c) => {
              const done = c.missions_total ? Math.round(((c.missions_validated + c.missions_submitted + c.missions_rejected) / c.missions_total) * 100) : 0;
              return (
                <div key={c.id} style={{ ...card, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</p>
                      <p style={{ fontSize: 12, color: C.blueD, fontWeight: 500 }}>{c.client_name}</p>
                    </div>
                    <Chip s={CAMPAIGN_STATUS[c.status]} />
                  </div>
                  <p style={{ fontSize: 11, color: C.muted }}>{fmtDate(c.start_date)} → {fmtDate(c.end_date)} · budget {fmtCFA(c.budget)}</p>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.muted, marginBottom: 4 }}>
                      <span>{c.missions_validated} validées sur {c.missions_total}</span><span>{done} % traité</span>
                    </div>
                    <Bar value={done} color={C.green} />
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: "auto", flexWrap: "wrap" }}>
                    <button style={btnGhost} onClick={() => { setSelectedId(c.id); setTab("missions"); }}>Ouvrir</button>
                    {(c.status === "planifiee" || c.status === "brouillon") && <button style={btn(C.green)} onClick={() => launch(c.id)}><Play size={12} /> Lancer</button>}
                    {c.status === "en_cours" && <button style={btnGhost} onClick={() => close(c.id)}><Flag size={12} /> Clôturer</button>}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── Missions ── */}
      {tab === "missions" && (
        <div style={{ ...card, padding: 16 }}>
          {!selected ? <Empty icon={ClipboardList} title="Choisissez une campagne" text="Les missions de la campagne sélectionnée apparaissent ici." /> : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {(["toutes", "a_faire", "en_cours", "soumise", "validee", "rejetee"] as const).map((s) => {
                    const count = s === "toutes" ? missions.length : missions.filter((m) => m.status === s).length;
                    const on = statusFilter === s;
                    return (
                      <button key={s} onClick={() => setStatusFilter(s)}
                        style={{ padding: "4px 12px", borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                          background: on ? C.blue : "#fff", color: on ? "#fff" : C.sub, border: `1.5px solid ${on ? C.blue : C.line}` }}>
                        {s === "toutes" ? "Toutes" : MISSION_STATUS[s].label} ({count})
                      </button>
                    );
                  })}
                </div>
                <button onClick={exportMissions} style={btnGhost}><Download size={12} /> Exporter</button>
              </div>
              {loadingDetail ? <div style={{ padding: 32, textAlign: "center" }}><Loader2 className="animate-spin" size={20} style={{ color: C.blue }} /></div> :
                shownMissions.length === 0 ? <Empty icon={ClipboardList} title="Aucune mission" text="Aucune mission ne correspond à ce filtre." /> : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${C.lineL}`, textAlign: "left" }}>
                        {["PDV", "Commune", "Score", "Agent", "Statut", "Photos"].map((h) => (
                          <th key={h} style={{ padding: "0 12px 10px 0", fontSize: 11, fontWeight: 700, color: C.muted }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {shownMissions.map((m) => (
                        <tr key={m.id} style={{ borderBottom: `1px solid ${C.surface}` }}>
                          <td style={{ padding: "10px 12px 10px 0", fontWeight: 600, color: C.text, whiteSpace: "nowrap" }}>{m.pos_name}</td>
                          <td style={{ padding: "10px 12px 10px 0", color: C.muted, fontSize: 12 }}>{m.commune}{m.quartier ? ` · ${m.quartier}` : ""}</td>
                          <td style={{ padding: "10px 12px 10px 0", fontWeight: 700, color: C.blueD }}>{m.match_score}</td>
                          <td style={{ padding: "10px 12px 10px 0" }}>
                            <select aria-label={`Agent pour ${m.pos_name}`} value={m.agent ?? ""} disabled={m.status === "validee"}
                              onChange={(e) => assign(m.id, e.target.value)} style={{ ...input, height: 30, width: 170, fontSize: 12 }}>
                              <option value="">Non assignée</option>
                              {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                          </td>
                          <td style={{ padding: "10px 12px 10px 0" }}><Chip s={MISSION_STATUS[m.status]} /></td>
                          <td style={{ padding: "10px 0", fontSize: 12, color: C.muted }}>{m.proofs.length}/{selected.min_photos}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Preuves à valider ── */}
      {tab === "preuves" && (
        !selected ? <div style={card}><Empty icon={Camera} title="Choisissez une campagne" text="Les preuves à contrôler apparaissent ici." /></div> :
        toReview.length === 0 ? <div style={card}><Empty icon={ShieldCheck} title="Rien à valider" text="Les missions soumises par les agents s'afficheront ici avec leurs photos." /></div> : (
          <div style={{ display: "grid", gap: 12 }}>
            {toReview.map((m) => {
              const outside = m.proofs.filter((p) => !p.within_geofence).length;
              const needed = (selected.checklist || []).filter((i) => i.required);
              const checklistOk = needed.every((i) => m.checklist_result?.[i.id]);
              return (
                <div key={m.id} style={{ ...card, padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{m.pos_name}</p>
                      <p style={{ fontSize: 12, color: C.muted }}><MapPin size={11} style={{ display: "inline", marginRight: 3 }} />{m.commune} · agent : {m.agent_name || "non renseigné"}</p>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "flex-start" }}>
                      <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, fontWeight: 600, background: outside ? C.redBg : C.greenBg, color: outside ? C.redTx : C.greenTx }}>
                        {outside ? `${outside} photo(s) hors zone` : "GPS conforme"}
                      </span>
                      <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, fontWeight: 600, background: checklistOk ? C.greenBg : C.amberBg, color: checklistOk ? C.greenTx : C.amberTx }}>
                        {checklistOk ? "Checklist complète" : "Checklist incomplète"}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", margin: "14px 0" }}>
                    {m.proofs.map((p) => (
                      <a key={p.id} href={p.image} target="_blank" rel="noreferrer" style={{ textDecoration: "none", borderRadius: 10, overflow: "hidden", border: `1px solid ${p.within_geofence ? C.lineL : C.red}` }}>
                        <img src={p.image} alt={`Preuve ${p.type} — ${m.pos_name}`} style={{ width: "100%", height: 110, objectFit: "cover", display: "block", background: C.surface }} />
                        <div style={{ padding: "5px 8px", fontSize: 11, color: C.muted, display: "flex", justifyContent: "space-between" }}>
                          <span style={{ textTransform: "capitalize" }}>{p.type}</span>
                          <span style={{ color: p.within_geofence ? C.green : C.red, fontWeight: 600 }}>
                            {p.distance_m === null ? "sans GPS" : `${Math.round(p.distance_m)} m`}
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                    {(selected.checklist || []).map((i) => (
                      <span key={i.id} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: m.checklist_result?.[i.id] ? C.greenBg : C.greyBg, color: m.checklist_result?.[i.id] ? C.greenTx : C.greyTx }}>
                        {m.checklist_result?.[i.id] ? "✓" : "○"} {i.label}
                      </span>
                    ))}
                  </div>

                  {rejecting === m.id ? (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <input autoFocus style={{ ...input, flex: 1, minWidth: 220 }} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motif du rejet (visible par l'agent)" />
                      <button style={btn(C.red)} disabled={!reason.trim()} onClick={() => reject(m.id)}><XCircle size={13} /> Confirmer le rejet</button>
                      <button style={btnGhost} onClick={() => { setRejecting(null); setReason(""); }}>Annuler</button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={btn(C.green)} onClick={() => validate(m.id)}><CheckCircle size={13} /> Valider la mission</button>
                      <button style={btnGhost} onClick={() => setRejecting(m.id)}><XCircle size={13} /> Rejeter</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── ROI ── */}
      {tab === "roi" && (
        !selected ? <div style={card}><Empty icon={BarChart3} title="Choisissez une campagne" text="Le rapport de ROI s'affiche ici." /></div> :
        loadingDetail || !report ? <div style={{ ...card, padding: 40, textAlign: "center" }}><Loader2 className="animate-spin" size={20} style={{ color: C.blue, margin: "0 auto" }} /></div> : (
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
              <Kpi label="Missions traitées" value={pct(report.completion_rate)} sub={`${report.missions_total} missions au total`} color={C.blueD} />
              <Kpi label="Conformité" value={pct(report.conformity_rate)} sub="Validées sur contrôlées" color={C.green} />
              <Kpi label="Photos dans la zone" value={pct(report.geofence_rate)} sub={`${report.proofs_total} photos reçues`} color={C.violet} />
              <Kpi label="Coût par mission validée" value={report.cost_per_validated === null ? "—" : fmtCFA(report.cost_per_validated)} sub={`${fmtCFA(report.cost_engaged)} engagés sur ${fmtCFA(report.budget)}`} color={C.amber} />
            </div>

            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
              <div style={{ ...card, padding: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>Avancement des missions</p>
                <div style={{ display: "grid", gap: 10 }}>
                  {(Object.keys(MISSION_STATUS) as MissionStatus[]).map((s) => (
                    <div key={s}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: C.muted }}>{MISSION_STATUS[s].label}</span>
                        <strong style={{ color: C.text }}>{report.by_status[s]}</strong>
                      </div>
                      <Bar value={report.missions_total ? (report.by_status[s] / report.missions_total) * 100 : 0}
                        color={s === "validee" ? C.green : s === "rejetee" ? C.red : s === "soumise" ? C.amber : C.blue} />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ ...card, padding: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>Effet sur les commandes</p>
                <p style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>
                  Période de campagne comparée à la période précédente de même durée, puis à des PDV non ciblés des mêmes communes.
                </p>
                {!report.uplift ? (
                  <Empty icon={TrendingUp} title="Pas encore de mesure" text="L'effet sur les commandes apparaît dès le début de la campagne." />
                ) : (
                  <div style={{ display: "grid", gap: 10 }}>
                    <Row label="PDV ciblés" value={signed(report.uplift.target_growth_pct)} sub={`${fmtCFA(report.uplift.target_before)} → ${fmtCFA(report.uplift.target_after)}`} />
                    <Row label={`PDV témoins (${report.uplift.control_size})`} value={signed(report.uplift.control_growth_pct)} />
                    <div style={{ padding: 12, borderRadius: 12, background: C.pale, border: `1px solid ${C.lineL}` }}>
                      <p style={{ fontSize: 11, color: C.muted }}>Effet net de la campagne</p>
                      <p style={{ fontSize: 22, fontWeight: 700, color: (report.uplift.net_uplift_pct ?? 0) >= 0 ? C.green : C.red }}>{signed(report.uplift.net_uplift_pct)}</p>
                      {report.uplift.control_growth_pct === null && (
                        <p style={{ fontSize: 11, color: C.amber, marginTop: 4 }}>Pas de groupe témoin exploitable : l'effet net n'est pas calculable.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={exportMissions} style={btn(C.blue)}><Download size={13} /> Exporter les missions (CSV)</button>
            </div>
          </div>
        )
      )}

      {wizard && (
        <CampaignWizard
          onClose={() => setWizard(false)}
          onCreated={async (id) => { setWizard(false); await loadCampaigns(); setSelectedId(id); setTab("missions"); }}
        />
      )}
    </div>
  );
}

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingBottom: 8, borderBottom: `1px solid ${C.surface}` }}>
      <div>
        <p style={{ fontSize: 12, color: C.sub, fontWeight: 600 }}>{label}</p>
        {sub && <p style={{ fontSize: 11, color: C.muted }}>{sub}</p>}
      </div>
      <p style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{value}</p>
    </div>
  );
}