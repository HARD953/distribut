"use client";
import React, { useEffect, useState } from "react";
import {
  MapPin, Phone, Building2, Store, Copy, Check, ArrowLeft,
  ShieldCheck, ShieldAlert, ShieldQuestion, Clock, Camera,
  ShoppingCart, Truck, Megaphone, Wallet, AlertTriangle,
  PlusCircle, RefreshCcw, PenLine, Gauge,
} from "lucide-react";
import { apiService } from "./ApiService";

/* ────────────────────────────────────────────────────────────────────────
   FICHE MERCHANT — fondation du Merchant Graph (doc LanfiaLink 2027, p.9-11)

   Idée centrale du document : chaque point de vente possède un identifiant
   durable (Merchant ID), indépendant du téléphone, de l'agent ou de la
   campagne. Autour de cet identifiant, on accumule des ÉVÉNEMENTS horodatés
   (création, vérification, visite, commande, livraison, activation,
   paiement, litige...). L'état courant est dérivé de l'historique — on
   n'écrase jamais l'historique.

   Ce composant est la traduction front-end de cette règle : on affiche un
   Merchant ID copiable et une timeline d'événements en lecture seule.
   C'est CE contrat (les champs de `Merchant` et `MerchantEvent` ci-dessous)
   que l'API Django devra respecter une fois qu'on attaquera le backend.
   ──────────────────────────────────────────────────────────────────── */

/* ─── Types du contrat Merchant Graph ────────────────────── */
export type MerchantStatus = "verifie" | "non_verifie" | "signale";

export type MerchantEventType =
  | "creation" | "verification" | "visite" | "photo"
  | "changement_enseigne" | "commande" | "livraison"
  | "activation" | "paiement" | "litige" | "stock_declare";

export interface MerchantEvent {
  id: string;
  type: MerchantEventType;
  occurred_at: string;   // ISO date
  actor: string;         // nom de l'agent / système à l'origine de l'événement
  note?: string;
  photo_url?: string;
}

export interface Merchant {
  id: string;              // Merchant ID — UUID durable
  name: string;
  category: string;        // boutique, supérette, demi-grossiste, grossiste...
  status: MerchantStatus;
  commune?: string;
  address?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  distributor?: string;
  brand_affiliations?: string[];
  first_seen_at: string;
  last_verified_at?: string;
  geo_accuracy_meters?: number;
  events: MerchantEvent[];
}

/* ─── Présentation par type d'événement ──────────────────── */
const EVENT_META: Record<MerchantEventType, { label: string; icon: React.ComponentType<any>; color: string; bg: string }> = {
  creation:             { label: "Création de la fiche",     icon: PlusCircle,   color: "#0D6FAB", bg: "#D6EAF6" },
  verification:         { label: "Vérification terrain",     icon: ShieldCheck,  color: "#0A9E7A", bg: "#D6F3EA" },
  visite:                { label: "Visite commerciale",       icon: Store,        color: "#2E4DB0", bg: "#DDE3FA" },
  photo:                { label: "Photo de contrôle",        icon: Camera,       color: "#7A4FB0", bg: "#EBE0FA" },
  changement_enseigne:  { label: "Changement d'enseigne",    icon: PenLine,      color: "#B0700D", bg: "#FBEBD4" },
  commande:             { label: "Commande",                 icon: ShoppingCart, color: "#0A7EA4", bg: "#D6F0F6" },
  livraison:            { label: "Livraison",                icon: Truck,        color: "#0A5A8A", bg: "#DCEAF5" },
  activation:           { label: "Activation marque",        icon: Megaphone,    color: "#B04000", bg: "#FBE1D2" },
  paiement:             { label: "Paiement",                 icon: Wallet,       color: "#0A9E7A", bg: "#D6F3EA" },
  litige:               { label: "Litige",                   icon: AlertTriangle,color: "#B03318", bg: "#FCE4DC" },
  stock_declare:        { label: "Stock déclaré",             icon: RefreshCcw,   color: "#5A5AA0", bg: "#E6E6FA" },
};

const STATUS_META: Record<MerchantStatus, { label: string; icon: React.ComponentType<any>; color: string; bg: string }> = {
  verifie:     { label: "Vérifié",      icon: ShieldCheck,   color: "#044D38", bg: "#DCF5EC" },
  non_verifie: { label: "Non vérifié",  icon: ShieldQuestion,color: "#7A4F00", bg: "#FBEFD6" },
  signale:     { label: "Signalé",      icon: ShieldAlert,   color: "#7A2410", bg: "#FCE4DC" },
};

/* ─── Utilitaires d'affichage ─────────────────────────────── */
const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const daysSince = (iso?: string) => {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
};

const initialsFromName = (name: string) =>
  name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

/* ─── Skeleton de chargement ──────────────────────────────── */
const ProfileSkeleton = () => (
  <div className="space-y-4">
    <div className="rounded-2xl p-5" style={{ background: "#fff", border: "0.5px solid #C0D4E6" }}>
      <div className="flex items-center gap-3">
        <div style={{ width: 52, height: 52, borderRadius: 14, background: "#EBF4FB" }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 14, width: "40%", background: "#EBF4FB", borderRadius: 6, marginBottom: 8 }} />
          <div style={{ height: 11, width: "25%", background: "#EBF4FB", borderRadius: 6 }} />
        </div>
      </div>
    </div>
  </div>
);

/* ─── Composant principal ─────────────────────────────────── */
interface MerchantProfileProps {
  merchantId?: string;      // si fourni sans `merchant`, déclenche un fetch
  merchant?: Merchant;      // ou données déjà chargées par le parent (ex: depuis la liste)
  onBack?: () => void;
}

const MerchantProfile: React.FC<MerchantProfileProps> = ({ merchantId, merchant: initialMerchant, onBack }) => {
  const [merchant, setMerchant] = useState<Merchant | null>(initialMerchant ?? null);
  const [isLoading, setIsLoading] = useState(!initialMerchant);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialMerchant || !merchantId) return;
    let cancelled = false;
    const fetchMerchant = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const res = await apiService.get(`/merchants/${merchantId}/`);
        if (!res.ok) throw new Error();
        const data: Merchant = await res.json();
        if (!cancelled) setMerchant(data);
      } catch {
        if (!cancelled) setLoadError("Impossible de charger cette fiche pour le moment.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchMerchant();
    return () => { cancelled = true; };
  }, [merchantId, initialMerchant]);

  const handleCopyId = async () => {
    if (!merchant) return;
    try {
      await navigator.clipboard.writeText(merchant.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard indisponible — pas bloquant */ }
  };

  if (isLoading) return <ProfileSkeleton />;

  if (loadError || !merchant) {
    return (
      <div className="rounded-2xl p-10 text-center" style={{ background: "#fff", border: "0.5px solid #C0D4E6" }}>
        <AlertTriangle size={26} style={{ color: "#B8D4E8", margin: "0 auto 10px" }} />
        <p style={{ fontSize: 13, fontWeight: 600, color: "#2A4A62", marginBottom: 4 }}>
          {loadError ?? "Aucune fiche à afficher"}
        </p>
        {onBack && (
          <button onClick={onBack} className="mt-3 px-4 py-2 rounded-xl font-semibold"
            style={{ background: "#1A8FD1", color: "#fff", border: "none", cursor: "pointer", fontSize: 12 }}>
            Retour
          </button>
        )}
      </div>
    );
  }

  const statusMeta = STATUS_META[merchant.status];
  const freshnessDays = daysSince(merchant.last_verified_at);
  const isFresh = freshnessDays !== null && freshnessDays <= 90;
  const sortedEvents = [...merchant.events].sort(
    (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
  );

  return (
    <div className="space-y-4">
      {onBack && (
        <button onClick={onBack}
          className="flex items-center gap-1.5 transition-colors"
          style={{ background: "none", border: "none", cursor: "pointer", color: "#1A8FD1", fontWeight: 600, fontSize: 12, padding: 0 }}>
          <ArrowLeft size={14} /> Retour aux distributeurs
        </button>
      )}

      {/* En-tête identité + Merchant ID */}
      <div className="rounded-2xl p-5" style={{ background: "#fff", border: "0.5px solid #C0D4E6" }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: "linear-gradient(135deg,#1A8FD1,#0D6FAB)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 700, fontSize: 16, flexShrink: 0,
            }}>
              {initialsFromName(merchant.name)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0A1E2E" }}>{merchant.name}</h2>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                  style={{ background: statusMeta.bg, color: statusMeta.color, fontSize: 11, fontWeight: 700 }}>
                  <statusMeta.icon size={11} /> {statusMeta.label}
                </span>
              </div>
              <p style={{ fontSize: 12, color: "#5A8AAA", marginTop: 3 }}>{merchant.category}</p>
            </div>
          </div>

          {/* Merchant ID — copiable, indépendant du téléphone/agent/campagne */}
          <button onClick={handleCopyId}
            title="Copier le Merchant ID"
            className="flex items-center gap-2 rounded-xl transition-colors"
            style={{
              padding: "8px 12px", background: "#EDF5FA", border: "0.5px solid #C0D4E6",
              cursor: "pointer", fontFamily: "monospace",
            }}>
            <span style={{ fontSize: 11, color: "#5A8AAA" }}>Merchant ID</span>
            <span style={{ fontSize: 12, color: "#0A5A8A", fontWeight: 600 }}>{merchant.id}</span>
            {copied ? <Check size={13} style={{ color: "#0A9E7A" }} /> : <Copy size={13} style={{ color: "#5A8AAA" }} />}
          </button>
        </div>

        {/* Infos rapides */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4" style={{ borderTop: "0.5px solid #EBF4FB" }}>
          <div className="flex items-center gap-2">
            <MapPin size={13} style={{ color: "#5A8AAA" }} />
            <span style={{ fontSize: 12, color: "#2A4A62" }}>{merchant.commune ?? "Commune non renseignée"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={13} style={{ color: "#5A8AAA" }} />
            <span style={{ fontSize: 12, color: "#2A4A62" }}>{merchant.phone ?? "Non renseigné"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 size={13} style={{ color: "#5A8AAA" }} />
            <span style={{ fontSize: 12, color: "#2A4A62" }}>{merchant.distributor ?? "Aucun distributeur rattaché"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={13} style={{ color: "#5A8AAA" }} />
            <span style={{ fontSize: 12, color: "#2A4A62" }}>
              {merchant.last_verified_at ? `Vérifié il y a ${freshnessDays}j` : "Jamais vérifié"}
            </span>
          </div>
        </div>

        {merchant.brand_affiliations && merchant.brand_affiliations.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {merchant.brand_affiliations.map((b) => (
              <span key={b} className="px-2 py-1 rounded-full"
                style={{ background: "#D6EAF6", color: "#0A5A8A", fontSize: 11, fontWeight: 600 }}>{b}</span>
            ))}
          </div>
        )}
      </div>

      {/* Qualité de cette fiche — même logique que le panneau global,
          appliquée ici à un seul point de vente */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-3.5 flex items-center gap-2.5"
          style={{ background: isFresh ? "#DCF5EC" : "#FBEFD6", border: "0.5px solid " + (isFresh ? "#BCE8D4" : "#F0DDA8") }}>
          <Clock size={16} style={{ color: isFresh ? "#0A9E7A" : "#B08A00" }} />
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#3A5A72" }}>Fraîcheur</p>
            <p style={{ fontSize: 12, color: isFresh ? "#044D38" : "#7A4F00" }}>
              {freshnessDays !== null ? `${freshnessDays} jours` : "Non vérifiée"} · cible ≤ 90j
            </p>
          </div>
        </div>
        <div className="rounded-2xl p-3.5 flex items-center gap-2.5" style={{ background: "#F5FAFD", border: "0.5px solid #D4E4F0" }}>
          <Gauge size={16} style={{ color: "#5A8AAA" }} />
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#3A5A72" }}>Géoprécision</p>
            <p style={{ fontSize: 12, color: "#2A4A62" }}>
              {merchant.geo_accuracy_meters != null ? `± ${merchant.geo_accuracy_meters} m` : "Non mesurée"} · cible &lt; 20 m
            </p>
          </div>
        </div>
      </div>

      {/* Journal d'événements — historique immuable, jamais écrasé */}
      <div className="rounded-2xl p-4" style={{ background: "#fff", border: "0.5px solid #C0D4E6" }}>
        <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: "0.5px solid #D4E4F0" }}>
          <Clock size={14} style={{ color: "#1A8FD1" }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#0A1E30" }}>Journal d'événements</span>
          <span style={{ fontSize: 11, color: "#8AA6BA", marginLeft: "auto" }}>{sortedEvents.length} événement(s)</span>
        </div>

        {sortedEvents.length === 0 ? (
          <div className="py-8 text-center">
            <Clock size={26} style={{ color: "#B8D4E8", margin: "0 auto 8px" }} />
            <p style={{ fontSize: 13, color: "#4A6B85" }}>Aucun événement enregistré pour cette fiche</p>
          </div>
        ) : (
          <div className="relative pl-6">
            <div className="absolute left-[9px] top-1 bottom-1" style={{ width: 2, background: "#E4EDF4" }} />
            <div className="space-y-4">
              {sortedEvents.map((ev) => {
                const meta = EVENT_META[ev.type];
                return (
                  <div key={ev.id} className="relative">
                    <div className="absolute -left-6 top-0.5" style={{
                      width: 18, height: 18, borderRadius: "50%", background: meta.bg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: "2px solid #fff", boxShadow: "0 0 0 1px #E4EDF4",
                    }}>
                      <meta.icon size={10} style={{ color: meta.color }} />
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#0A1E2E" }}>{meta.label}</p>
                      <span style={{ fontSize: 11, color: "#8AA6BA", flexShrink: 0 }}>{formatDateTime(ev.occurred_at)}</span>
                    </div>
                    <p style={{ fontSize: 11, color: "#5A7A92", marginTop: 1 }}>Par {ev.actor}</p>
                    {ev.note && <p style={{ fontSize: 12, color: "#2A4A62", marginTop: 3 }}>{ev.note}</p>}
                    {ev.photo_url && (
                      <img src={ev.photo_url} alt={meta.label}
                        style={{ marginTop: 6, width: 96, height: 96, objectFit: "cover", borderRadius: 8, border: "0.5px solid #D4E4F0" }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MerchantProfile;