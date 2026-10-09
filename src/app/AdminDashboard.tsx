"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Home, MapPin, Package, ShoppingCart, Users,
  BarChart3, Map, Settings, Menu, Bell, Search, Truck,
  LogOut, Plus, AlertTriangle, Clock, CheckCircle,
  ChevronsUpDown, UserRound, Bike, X, ChevronRight,
  TrendingUp, TrendingDown, Minus, Activity,
  Sparkles, Bot, ShieldCheck, Wallet, Radar, Gauge,
  Megaphone, CreditCard, Landmark, Plug, Building2,
} from "lucide-react";
import { useAuth } from "./AuthContext";
import { apiService } from "./ApiService";
import StockManagement from "./StockManagement";
import OrderManagement from "./OrderManagement";
import PointsVenteManagement from "./PointsVenteManagement";
import UserManagement from "./UserManagement";
import MobileVendorsManagement from "./MobileVendorsManagement";
import ParametresManagement from "./ParametresManagement";
import MapComponent from "./MapComponent";
import PushcartManagement from "./PushcartManagement";
import StatisticsDashboard from "./StatisticsDashboard";
import LocalisationManagement from "./LocalisationManagement";
import LanfiaLinkDashboard from "./LanfiaLinkDashboard";

import ActivationManagement from "./Activationmanagement";
import FinancementManagement from "./Financementmanagement";
import PaiementsManagement from "./Paiementsmanagement";


/* ────────────────────────────────────────────────────────────────────────
   ÉTAPE 1 DE LA REFONTE — "Fondation & Intelligence"
   Cette version ajoute, sans rien retirer de l'existant :
   1. Un panneau de santé du Merchant Graph (fraîcheur, géoprécision,
      doublons, preuve) — cf. document stratégique LanfiaLink 2027, p.12.
   2. Un Agent Hub visuel reprenant les 7 agents de l'architecture cible
      (Scout, Territory, Trade, Merchant Copilot, Finance, Compliance,
      Revenue) — cf. document p.8-9. Tant que le backend ne renvoie pas
      encore ces données, l'UI affiche un état "à configurer" honnête
      plutôt que des chiffres inventés.
   3. Un nouvel onglet "Intelligence IA" qui regroupe ces deux blocs et
      une zone Next-Best-Outlet (encore vide, à connecter au scoring).
   Rien ici ne remplace le Merchant ID / journal d'événements côté
   backend — c'est la vraie priorité absolue (doc p.9-10) — mais cette
   V1 donne à l'équipe et aux clients une preuve visuelle immédiate de
   la direction produit, sans attendre que tout soit câblé.

   ÉTAPE 2 DE LA REFONTE — "Catalogue d'offres"
   Le document stratégique (section 5, p.8-9) définit huit offres
   commerciales construites sur le même Merchant Graph : Intelligence,
   Activate, Route, Connect, Pay, Finance, API, Compliance. Trois
   existaient déjà dans la navigation sous d'autres noms (Intelligence,
   Commerciaux ≈ Route, Commandes ≈ Connect). Cette étape ajoute les
   cinq offres manquantes comme sections dédiées (Activations,
   Paiements, Financement, Conformité & Branding, API & Intégrations),
   chacune avec un état honnête "en cours de câblage" décrivant les
   livrables et KPI cibles du document plutôt que des données fictives,
   et un panneau "Catalogue d'offres" dans l'onglet Intelligence IA qui
   relie chaque offre à sa section et à son statut réel.
   ──────────────────────────────────────────────────────────────────── */

/* ─── Types ──────────────────────────────────────────────── */
export interface Notification {
  id: number; type: string; message: string;
  created_at: string; is_read: boolean;
}
export interface StatItem {
  icon: string; title: string; value: string;
  change: string; color: string;
}
export interface ActivityItem {
  icon: string; action: string; user: string; time: string; color: string;
}
export interface AlertItem {
  icon: string; type: string; message: string;
  priority: "high" | "medium" | "low";
}
export interface POSData {
  pos_id: number | null; pos_name: string;
  stats: StatItem[]; recent_activities: ActivityItem[]; alerts: AlertItem[];
}

/* Merchant Graph health — un indicateur = une dimension de qualité de la
   donnée (doc p.12). "status" pilote uniquement la couleur ; la valeur et
   la cible viennent du backend une fois le journal d'événements en place. */
export type MetricStatus = "good" | "watch" | "critical";
export interface MerchantGraphMetric {
  label: string;
  value: string;
  target: string;
  status: MetricStatus;
}
export interface MerchantGraphHealth {
  freshness: MerchantGraphMetric;     // % PDV vérifiés < 90 jours
  geo_accuracy: MerchantGraphMetric;  // cohérence GPS
  duplicates: MerchantGraphMetric;    // doublons / 1000 fiches
  proof_rate: MerchantGraphMetric;    // % missions avec preuve photo/événement
}

/* Agent Hub — statut de chacun des 7 agents de l'architecture cible. */
export type AgentRuntimeStatus = "actif" | "en_pause" | "a_configurer";
export interface AgentStatus {
  id: "scout" | "territory" | "trade" | "copilot" | "finance" | "compliance" | "revenue";
  name: string;
  mission: string;
  status: AgentRuntimeStatus;
  metric_label: string;
  metric_value: string;
}

export interface DashboardData {
  cumulative: POSData; pos_data: POSData[];
  /* Optionnelles : tant que le backend ne les expose pas encore,
     les panneaux correspondants affichent un état vide plutôt que
     de planter ou d'afficher des données fictives. */
  merchant_graph_health?: MerchantGraphHealth;
  agents?: AgentStatus[];
}
export interface User {
  id: string; username?: string; email?: string;
  first_name?: string; last_name?: string;
  profile?: {
    role: {
      id: number; name: string; description: string; color: string;
      permissions: Array<{ id: number; name: string; category: string; description: string }>;
      users: number; tableau: boolean; distributeurs: boolean;
      commerciaux: boolean; prospects: boolean; inventaire: boolean;
      commande: boolean; utilisateur: boolean; analytique: boolean;
      geolocalisation: boolean; configuration: boolean;
      positions: boolean; dashboard_analytique: boolean;
      intelligence: boolean;
      /* Nouvelles offres du catalogue (doc p.8-9) — voir ÉTAPE 2 ci-dessus. */
      activations: boolean; paiements: boolean; financement: boolean;
      conformite: boolean; api: boolean;
    };
    phone?: string; location?: string; points_of_sale?: string[];
  };
}

/* ─── Icon map ───────────────────────────────────────────── */
const iconComponents: Record<string, React.ComponentType<any>> = {
  MapPin, ShoppingCart, Users, AlertTriangle, CheckCircle, UserRound, Bike,
};

/* Icônes fixes par agent — la liste des 7 agents est structurelle
   (définie par l'architecture cible), seul leur statut est dynamique. */
const AGENT_ICON_MAP: Record<AgentStatus["id"], React.ComponentType<any>> = {
  scout: Search,
  territory: Radar,
  trade: TrendingUp,
  copilot: Bot,
  finance: Wallet,
  compliance: ShieldCheck,
  revenue: BarChart3,
};

/* Agents par défaut : reflètent l'architecture cible du document (p.8-9)
   même avant que le backend ne renvoie de vraies données d'exécution. */
const DEFAULT_AGENTS: AgentStatus[] = [
  { id: "scout", name: "Scout Agent", mission: "Qualité du recensement : doublons, photos, cohérence GPS", status: "a_configurer", metric_label: "Taux d'erreur évité", metric_value: "—" },
  { id: "territory", name: "Territory Agent", mission: "Zonage, potentiel, white-spaces, propositions de routes", status: "a_configurer", metric_label: "Couverture / km / jour", metric_value: "—" },
  { id: "trade", name: "Trade Agent", mission: "Ciblage, plans d'activation, suivi de campagne", status: "a_configurer", metric_label: "Uplift / coût activation", metric_value: "—" },
  { id: "copilot", name: "Merchant Copilot", mission: "Commande, réassort et support par voix / WhatsApp", status: "a_configurer", metric_label: "Conversion / fréquence", metric_value: "—" },
  { id: "finance", name: "Finance Agent", mission: "Pré-éligibilité, dossier partenaire, rapprochement paiement", status: "a_configurer", metric_label: "Taux de qualification", metric_value: "—" },
  { id: "compliance", name: "Compliance Agent", mission: "Consentement, accès, détection d'anomalies", status: "a_configurer", metric_label: "Incidents / audit", metric_value: "—" },
  { id: "revenue", name: "Revenue Agent", mission: "Upsell, renouvellement, alerte churn", status: "a_configurer", metric_label: "NRR / marge", metric_value: "—" },
];

/* Dimensions de qualité du Merchant Graph — labels et cibles reprises du
   document stratégique (p.12). Affichées avec la valeur réelle une fois
   le backend connecté, ou en état vide sinon. */
const MERCHANT_GRAPH_DIMENSIONS: Array<{ key: keyof MerchantGraphHealth; label: string; target: string; icon: React.ComponentType<any> }> = [
  { key: "freshness", label: "Fraîcheur des fiches", target: "Cible : > 80 % vérifiées < 90j", icon: Clock },
  { key: "geo_accuracy", label: "Géoprécision", target: "Cible : < 20 m en zone urbaine", icon: MapPin },
  { key: "duplicates", label: "Déduplication", target: "Cible : < 5 doublons / 1000 fiches", icon: Gauge },
  { key: "proof_rate", label: "Preuve d'exécution", target: "Cible : > 95 % des campagnes", icon: CheckCircle },
];

const metricStatusStyles: Record<MetricStatus, { dot: string; text: string; bg: string }> = {
  good:     { dot: "#0A9E7A", text: "#044D38", bg: "#DCF5EC" },
  watch:    { dot: "#D08A00", text: "#7A4F00", bg: "#FBEFD6" },
  critical: { dot: "#B03318", text: "#7A2410", bg: "#FCE4DC" },
};
const agentStatusStyles: Record<AgentRuntimeStatus, { label: string; dot: string; text: string; bg: string }> = {
  actif:        { label: "Actif",        dot: "#0A9E7A", text: "#044D38", bg: "#DCF5EC" },
  en_pause:     { label: "En pause",     dot: "#D08A00", text: "#7A4F00", bg: "#FBEFD6" },
  a_configurer: { label: "À configurer", dot: "#6A8AA2", text: "#3A5A72", bg: "#EAF0F5" },
};

/* ─── Catalogue d'offres LanfiaLink (doc §5, p.8-9) ──────────
   Relie chaque offre commerciale du document stratégique à l'onglet
   correspondant dans l'admin, avec un statut honnête : "actif" quand
   la section existe déjà et est opérationnelle, "a_configurer" quand
   elle reste à construire. Le panneau qui l'affiche vit dans l'onglet
   Intelligence IA (voir OffersCatalogPanel plus bas). */
interface OfferDefinition {
  id: string;
  name: string;
  promesse: string;
  revenue: string;
  tabId: string;
  status: AgentRuntimeStatus;
}
const OFFER_CATALOG: OfferDefinition[] = [
  { id: "intelligence", name: "LanfiaLink Intelligence", promesse: "Savoir où vendre et où investir : cartes, segments, potentiel, white-spaces.", revenue: "Abonnement + volume PDV", tabId: "intelligence", status: "actif" },
  { id: "activate",     name: "LanfiaLink Activate",     promesse: "Exécuter et prouver une activation terrain : ciblage, missions, photos, ROI.", revenue: "Frais de campagne + PDV", tabId: "activations", status: "a_configurer" },
  { id: "route",        name: "LanfiaLink Route",        promesse: "Optimiser la force de vente et la couverture : territoires, tournées, visites.", revenue: "SaaS par équipe / utilisateur", tabId: "vendeurs-ambulants", status: "actif" },
  { id: "connect",      name: "LanfiaLink Connect",      promesse: "Relier boutique, distributeur et commande : catalogue, réassort, statuts.", revenue: "Abonnement + transaction", tabId: "commandes", status: "actif" },
  { id: "pay",          name: "LanfiaLink Pay",          promesse: "Orchestrer les paiements et le rapprochement via PI-SPI.", revenue: "Revenue share / frais de service", tabId: "paiements", status: "a_configurer" },
  { id: "finance",      name: "LanfiaLink Finance",      promesse: "Déclencher du stock financé par un partenaire éligible.", revenue: "Commission partenaire", tabId: "financement", status: "a_configurer" },
  { id: "api",          name: "LanfiaLink API",          promesse: "Exposer le Merchant Graph aux SI autorisés (API, MCP).", revenue: "Licence API / usage", tabId: "api", status: "a_configurer" },
  { id: "compliance",   name: "LanfiaLink Compliance",   promesse: "Gérer branding, autorisations et taxes locales associées.", revenue: "Frais de service / dossier", tabId: "conformite", status: "a_configurer" },
];

/* Contenu des pages "offre" nouvellement ajoutées : chaque section
   affiche honnêtement ce qui est prévu (livrables + KPI, repris du
   document) plutôt que des données inventées, tant que le backend
   correspondant n'est pas branché. */
interface OfferPageContent {
  icon: React.ComponentType<any>;
  title: string;
  intro: string;
  deliverables: string[];
  kpis: string[];
}
const OFFER_PAGE_CONTENT: Record<string, OfferPageContent> = {
  activations: {
    icon: Megaphone,
    title: "LanfiaLink Activate",
    intro: "Cibler les bons points de vente pour une campagne de marque, superviser la mission sur le terrain et prouver l'exécution (photo, checklist, conformité) jusqu'au calcul du ROI.",
    deliverables: [
      "Ciblage des PDV par ICP et score de potentiel",
      "Génération de missions et de routes de tournée",
      "Checklist de conformité et preuve photo géolocalisée",
      "Rapport de ROI et d'uplift par campagne",
    ],
    kpis: ["Uplift / coût d'activation", "Taux de conformité des missions", "Délai moyen de restitution du rapport"],
  },
  paiements: {
    icon: CreditCard,
    title: "LanfiaLink Pay",
    intro: "Relier la commande au paiement et au Merchant ID sans multiplier les intégrations propriétaires, en orchestrant le paiement via un partenaire PSP agréé PI-SPI.",
    deliverables: [
      "Génération de demandes de paiement (QR / RTP)",
      "Réception des statuts et webhooks du partenaire",
      "Rapprochement commande ↔ paiement",
      "Reporting de règlement par point de vente",
    ],
    kpis: ["Taux de rapprochement", "Délai de règlement", "Taux d'échec / litiges"],
  },
  financement: {
    icon: Landmark,
    title: "LanfiaLink Finance",
    intro: "Pré-qualifier les distributeurs et points de vente éligibles à un financement de stock porté par un partenaire financier, sans que LanfiaLink ne devienne elle-même l'établissement prêteur.",
    deliverables: [
      "Score de pré-éligibilité explicable",
      "Constitution du dossier partenaire",
      "Suivi de l'origination et du décaissement",
      "Signaux d'activité transmis au partenaire financier",
    ],
    kpis: ["Taux de qualification", "Approval-to-draw", "GMV financé"],
  },
  conformite: {
    icon: Building2,
    title: "LanfiaLink Compliance",
    intro: "Encadrer les démarches administratives et fiscales liées au branding et à l'occupation de points de vente selon les règles locales, avec validation humaine à chaque étape.",
    deliverables: [
      "Référentiel de règles par territoire",
      "Suivi des documents requis et des échéances",
      "Preuves de paiement et statut de dossier",
      "Interface avec les partenaires administratifs",
    ],
    kpis: ["Délai moyen de traitement d'un dossier", "Taux de conformité", "Incidents / audit"],
  },
  api: {
    icon: Plug,
    title: "LanfiaLink API",
    intro: "Exposer le Merchant Graph et les capacités de LanfiaLink aux systèmes autorisés via une API versionnée et des webhooks signés, puis à terme un serveur MCP pour les agents.",
    deliverables: [
      "Contrats API REST/OpenAPI versionnés",
      "Webhooks signés et idempotents",
      "Serveur MCP en lecture seule puis actions limitées",
      "Quotas, scopes et journal d'audit par client",
    ],
    kpis: ["Nombre de partenaires connectés", "Latence / disponibilité", "Appels API par client"],
  },
};

/* ─── Animations CSS globales ────────────────────────────── */
const globalStyles = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideInLeft {
    from { opacity: 0; transform: translateX(-8px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes countUp {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes ping {
    0%,100% { opacity: 0.4; transform: scale(1); }
    50%      { opacity: 0.9; transform: scale(1.08); }
  }
  @keyframes shimmer {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  @keyframes pulse-dot {
    0%,100% { transform: scale(1); opacity: 1; }
    50%      { transform: scale(1.4); opacity: 0.6; }
  }
  .stat-card-animated {
    animation: fadeInUp 0.4s ease both;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  }
  .stat-card-animated:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(13,27,42,0.10);
    border-color: rgba(26,143,209,0.35) !important;
  }
  .stat-underline {
    height: 2px;
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.3s ease;
    border-radius: 0 0 2px 2px;
  }
  .stat-card-animated:hover .stat-underline { transform: scaleX(1); }
  .activity-row-anim {
    animation: fadeInUp 0.35s ease both;
    transition: background 0.15s, transform 0.15s;
    border-radius: 10px;
  }
  .activity-row-anim:hover {
    background: #EBF4FB;
    transform: translateX(3px);
  }
  .notif-row-anim {
    transition: background 0.15s ease;
  }
  .notif-row-anim:hover {
    background: #EBF4FB;
  }
  .alert-item-anim {
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .alert-item-anim:hover {
    transform: translateX(3px);
    box-shadow: 0 2px 12px rgba(13,27,42,0.07);
  }
  .action-btn-anim {
    transition: transform 0.15s ease, opacity 0.15s ease, box-shadow 0.15s ease;
  }
  .action-btn-anim:hover {
    transform: translateY(-2px);
    opacity: 0.92;
    box-shadow: 0 6px 20px rgba(13,27,42,0.18);
  }
  .action-btn-anim:active { transform: scale(0.97); }
  .banner-anim {
    transition: transform 0.2s ease;
  }
  .banner-anim:hover { transform: translateY(-1px); }
  .nav-item-anim {
    transition: all 0.15s ease;
  }
  .nav-item-anim:hover:not(.active) {
    background: rgba(26,143,209,0.08) !important;
    transform: translateX(2px);
  }
  .nav-item-anim:focus-visible,
  .icon-btn-anim:focus-visible,
  .text-btn-anim:focus-visible {
    outline: 2px solid #1A8FD1;
    outline-offset: 2px;
  }
  .notif-dot-pulse {
    animation: pulse-dot 1.8s ease-in-out infinite;
  }
  .panel-card {
    transition: box-shadow 0.2s ease;
  }
  .panel-card:hover {
    box-shadow: 0 4px 20px rgba(13,27,42,0.06);
  }
  .agent-card-anim {
    animation: fadeInUp 0.35s ease both;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .agent-card-anim:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(13,27,42,0.08);
  }
  .quality-chip-anim {
    animation: fadeInUp 0.3s ease both;
    transition: transform 0.15s ease;
  }
  .quality-chip-anim:hover { transform: translateY(-1px); }
`;

/* ─── Tech stripe ────────────────────────────────────────── */
const TechStripe = ({ height = 4 }: { height?: number }) => (
  <div style={{
    height,
    background: "linear-gradient(90deg,#0D6FAB 0%,#1A8FD1 30%,#4FB3E8 55%,#1A8FD1 75%,#0D6FAB 100%)",
    flexShrink: 0,
  }} />
);

/* ─── Stat card palettes ─────────────────────────────────── */
const statPalettes = [
  { bg: "#D6EAF6", icon: "#0D6FAB", badge: "#B8D9EE", badgeText: "#083F6A", underline: "#0D6FAB", valueColor: "#072D4E", titleColor: "#1A4A6A" },
  { bg: "#C8F0E2", icon: "#0A7EA4", badge: "#A4E4CC", badgeText: "#044D38", underline: "#0A9E7A", valueColor: "#033728", titleColor: "#0A5040" },
  { bg: "#D4DCFA", icon: "#2E4DB0", badge: "#B8C4F0", badgeText: "#172375", underline: "#2E4DB0", valueColor: "#111A60", titleColor: "#1E2E82" },
  { bg: "#FFDDC8", icon: "#B04000", badge: "#FFB88A", badgeText: "#7A2400", underline: "#D05000", valueColor: "#5A1A00", titleColor: "#7A2A00" },
];

/* ─── Animated counter hook ──────────────────────────────── */
function useCountUp(target: number, duration = 1200, started = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!started) return;
    const num = parseInt(String(target).replace(/[^0-9]/g, ""), 10);
    if (isNaN(num)) { setValue(num); return; }
    const start = performance.now();
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setValue(Math.round(num * easeOut(progress)));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, started, duration]);
  return value;
}

/* ─── Skeleton block (used while a section has no data yet) ─ */
const SkeletonBlock = ({ height = 14, width = "100%" }: { height?: number; width?: number | string }) => (
  <div style={{
    height, width, borderRadius: 6,
    background: "linear-gradient(90deg,#EBF4FB 25%,#F5FAFD 37%,#EBF4FB 63%)",
    backgroundSize: "400% 100%",
    animation: "shimmer 1.4s ease-in-out infinite",
  }} />
);

/* ─── Empty state (générique, ton neutre, invite à agir) ─── */
const EmptyState = ({ icon: Icon, title, description }: { icon: React.ComponentType<any>; title: string; description: string }) => (
  <div className="py-8 text-center">
    <Icon size={28} style={{ color: "#B8D4E8", margin: "0 auto 10px" }} />
    <p style={{ fontSize: 13, fontWeight: 600, color: "#2A4A62", marginBottom: 4 }}>{title}</p>
    <p style={{ fontSize: 12, color: "#5A7A92", maxWidth: 320, margin: "0 auto" }}>{description}</p>
  </div>
);

/* ─── Main component ─────────────────────────────────────── */
const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    cumulative: { pos_id: null, pos_name: "Total Général", stats: [], recent_activities: [], alerts: [] },
    pos_data: [],
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, logout } = useAuth();
  const router = useRouter();
  const [selectedPOS, setSelectedPOS] = useState<POSData | null>(null);
  const [posDropdownOpen, setPosDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [dashboardReady, setDashboardReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userPermissions, setUserPermissions] = useState({
    tableau: true, distributeurs: true, commerciaux: true, prospects: true,
    inventaire: true, commande: true, utilisateur: true, analytique: true,
    geolocalisation: true, configuration: true, positions: true, dashboard_analytique: true,
    intelligence: true,
    /* Nouvelles offres du catalogue (doc p.8-9) */
    activations: true, paiements: true, financement: true, conformite: true, api: true,
  });

  /* ── Fetch current user ──
     Routed through apiService (like every other call in this file) instead of a
     hardcoded production URL, so the same build works against local/staging APIs. */
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("access");
        if (!token) return;
        const res = await apiService.get("/me/");
        if (res.ok) {
          const raw = await res.json();
          const data: User = Array.isArray(raw) ? raw[0] : raw;
          setCurrentUser(data);
          if (data.profile?.role) {
            const r = data.profile.role;
            setUserPermissions({
              tableau: r.tableau ?? true, distributeurs: r.distributeurs ?? true,
              commerciaux: r.commerciaux ?? true, prospects: r.prospects ?? true,
              inventaire: r.inventaire ?? true, commande: r.commande ?? true,
              utilisateur: r.utilisateur ?? true, analytique: r.analytique ?? true,
              geolocalisation: r.geolocalisation ?? true, configuration: r.configuration ?? true,
              positions: r.positions ?? true, dashboard_analytique: r.dashboard_analytique ?? true,
              intelligence: r.intelligence ?? true,
              activations: r.activations ?? true, paiements: r.paiements ?? true,
              financement: r.financement ?? true, conformite: r.conformite ?? true,
              api: r.api ?? true,
            });
          }
        }
      } catch { /* silent */ }
    };
    fetchCurrentUser();
  }, []);

  /* ── Fetch dashboard ── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const check = async () => {
      const token = localStorage.getItem("access");
      if (!token) { router.push("/login"); return; }
      try {
        const res = await apiService.get("/dashboard/");
        if (!res.ok) throw new Error();
        const data: DashboardData = await res.json();
        setDashboardData(data);
        setSelectedPOS(data.cumulative);
        setIsLoading(false);
        setTimeout(() => setDashboardReady(true), 100);
      } catch {
        logout(); router.push("/login");
      }
    };
    check();
  }, [router, logout]);

  /* ── Fetch notifications ── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const fetchNotifications = async () => {
      const token = localStorage.getItem("access");
      if (!token) return;
      try {
        const res = await apiService.get("/notifications/");
        if (!res.ok) { if (res.status === 401) { logout(); router.push("/login"); } return; }
        const data: Notification[] = await res.json();
        setNotifications(
          data.map((n) => ({
            ...n,
            type: n.type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
          }))
        );
      } catch { setError("Erreur notifications"); }
    };
    fetchNotifications();
  }, [router, logout]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  /* ── Close dropdowns on outside click / Escape ──
     Both dropdowns are marked with data-*-panel / data-*-toggle attributes on
     their JSX below, so this works regardless of where in the tree they render
     (desktop dropdown vs. the separate mobile full-screen panel). */
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        notificationsOpen &&
        !target.closest("[data-notif-panel]") &&
        !target.closest("[data-notif-toggle]")
      ) {
        setNotificationsOpen(false);
      }
      if (
        posDropdownOpen &&
        !target.closest("[data-pos-panel]") &&
        !target.closest("[data-pos-toggle]")
      ) {
        setPosDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setNotificationsOpen(false);
        setPosDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [notificationsOpen, posDropdownOpen]);

  const formatAgo = (date: Date) => {
    const diff = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diff < 60) return `${diff}min`;
    const h = Math.floor(diff / 60);
    return h < 24 ? `${h}h` : `${Math.floor(h / 24)}j`;
  };

  const handleLogout = () => { logout(); router.push("/login"); };

  /* ── Notification actions ──
     These call apiService.post/.patch on best-guess REST endpoints. Point them
     at whatever your backend actually exposes for "mark as read" — the local
     state update happens optimistically either way so the UI never feels dead. */
  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    const previous = notifications;
    setNotifications((ns) => ns.map((n) => ({ ...n, is_read: true })));
    try {
      const res = await apiService.post("/notifications/mark-all-read/", {});
      if (!res.ok) throw new Error();
    } catch {
      setNotifications(previous);
      setError("Impossible de marquer les notifications comme lues");
    }
  };

  const handleNotificationClick = async (n: Notification) => {
    if (n.is_read) return;
    setNotifications((ns) => ns.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    try {
      await apiService.patch(`/notifications/${n.id}/`, { is_read: true });
    } catch { /* best-effort, keep the optimistic local state */ }
  };

  const getCurrentData = (): POSData =>
    (!selectedPOS || selectedPOS.pos_id === null)
      ? dashboardData.cumulative
      : dashboardData.pos_data.find((p) => p.pos_id === selectedPOS.pos_id) ?? dashboardData.cumulative;

  const getInitials = () => {
    if (currentUser?.first_name && currentUser?.last_name)
      return `${currentUser.first_name[0]}${currentUser.last_name[0]}`.toUpperCase();
    if (currentUser?.username) return currentUser.username.slice(0, 2).toUpperCase();
    return "AU";
  };
  const getDisplayName = () =>
    (currentUser?.first_name && currentUser?.last_name)
      ? `${currentUser.first_name} ${currentUser.last_name}`
      : currentUser?.username ?? "Utilisateur";
  const getRole = () => currentUser?.profile?.role?.name ?? "Utilisateur";
  const getLocation = () => currentUser?.profile?.location ?? "Non spécifié";
  const getPOS = () => currentUser?.profile?.points_of_sale ?? [];

  /* ─── Menu items ────────────────────────────────────────── */
  const allItems = [
    { id: "dashboard",          icon: Home,        label: "Tableau de bord",        perm: "tableau",              section: "main" },
    { id: "intelligence",       icon: Sparkles,     label: "Intelligence IA",        perm: "intelligence",         section: "main" },
    { id: "points-vente",       icon: MapPin,       label: "Distributeurs",          perm: "distributeurs",        section: "main" },
    { id: "points-ventes",      icon: TrendingUp,   label: "Analyse POS",            perm: "dashboard_analytique", section: "main" },
    { id: "vendeurs-ambulants", icon: Bike,         label: "Commerciaux",            perm: "commerciaux",          section: "main" },
    { id: "Pushcart",           icon: Truck,        label: "Prospects",              perm: "prospects",            section: "main" },
    { id: "stocks",             icon: Package,      label: "Inventaire",             perm: "inventaire",           section: "ops"  },
    { id: "commandes",          icon: ShoppingCart, label: "Commandes",              perm: "commande",             section: "ops"  },
    /* Offres du catalogue (doc §5) encore à câbler — voir ÉTAPE 2 */
    { id: "activations",        icon: Megaphone,    label: "Activations",            perm: "activations",          section: "ops"  },
    { id: "paiements",          icon: CreditCard,   label: "Paiements",              perm: "paiements",            section: "ops"  },
    { id: "financement",        icon: Landmark,     label: "Financement",            perm: "financement",          section: "ops"  },
    { id: "statistiques",       icon: BarChart3,    label: "Analytiques",            perm: "analytique",           section: "ops"  },
    { id: "cartes",             icon: Map,          label: "Géolocalisation",        perm: "geolocalisation",      section: "ops"  },
    { id: "utilisateurs",       icon: Users,        label: "Etablissement",          perm: "utilisateur",          section: "admin"},
    { id: "positions",          icon: MapPin,       label: "Découpage",              perm: "positions",            section: "admin"},
    { id: "conformite",         icon: Building2,    label: "Conformité & Branding",   perm: "conformite",           section: "admin"},
    { id: "api",                icon: Plug,         label: "API & Intégrations",     perm: "api",                  section: "admin"},
    { id: "parametres",         icon: Settings,     label: "Configuration",          perm: "configuration",        section: "admin"},
  ];
  const menuItems = allItems.filter((i) => userPermissions[i.perm as keyof typeof userPermissions]);
  const bySection = (s: string) => menuItems.filter((i) => i.section === s);

  /* Quick search: jump to the first matching section on Enter. */
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;
    const match = menuItems.find((i) => i.label.toLowerCase().includes(q));
    if (match) {
      setActiveTab(match.id);
      setSearchQuery("");
    }
  };

  /* ─── Sidebar nav item ──────────────────────────────────── */
  const NavItem = ({ item, collapsed }: { item: (typeof allItems)[number]; collapsed: boolean }) => {
    const active = activeTab === item.id;
    return (
      <button
        onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
        title={collapsed ? item.label : undefined}
        aria-current={active ? "page" : undefined}
        className="nav-item-anim group relative w-full flex items-center gap-2.5 text-sm"
        style={{
          padding: "9px 10px",
          justifyContent: collapsed ? "center" : "flex-start",
          borderRadius: 8,
          /* Actif : fond bleu, texte blanc. Inactif : texte gris foncé lisible sur fond blanc */
          background: active ? "#1A8FD1" : "transparent",
          color: active ? "#FFFFFF" : "#3A5A72",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        <item.icon size={15} style={{ flexShrink: 0, opacity: active ? 1 : 0.85 }} />
        {!collapsed && (
          <span className="truncate" style={{ fontSize: 12, fontWeight: active ? 600 : 500 }}>
            {item.label}
          </span>
        )}
        {active && !collapsed && (
          <span style={{
            marginLeft: "auto", width: 5, height: 5, borderRadius: "50%",
            background: "rgba(255,255,255,0.8)", flexShrink: 0,
          }} />
        )}
        {collapsed && (
          <div className="absolute left-full ml-2.5 px-2 py-1 rounded-lg whitespace-nowrap z-50
            opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity"
            style={{ background: "#0D1B2A", color: "#E8F4FB", fontSize: 12 }}>
            {item.label}
          </div>
        )}
      </button>
    );
  };

  /* ─── Section header ─────────────────────────────────────── */
  const SectionLabel = ({ label, collapsed }: { label: string; collapsed: boolean }) =>
    collapsed ? <div style={{ height: 8 }} /> : (
      <p style={{
        fontSize: 10, color: "#1A8FD1", textTransform: "uppercase",
        letterSpacing: "0.12em", padding: "12px 8px 4px", fontWeight: 700,
      }}>
        {label}
      </p>
    );

  /* ─── Sidebar ────────────────────────────────────────────── */
  const SidebarContent = ({ collapsed }: { collapsed: boolean }) => (
    <>
      <TechStripe height={4} />
      <div className="relative overflow-hidden flex-1 flex flex-col" style={{ background: "#FFFFFF" }}>
        {/* Logo */}
        <div className="relative z-10 flex items-center border-b px-4 py-4"
          style={{
            gap: collapsed ? 0 : 10,
            justifyContent: collapsed ? "center" : "flex-start",
            borderColor: "#D4E4F0",
          }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#1A8FD1,#0D6FAB)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
            </svg>
          </div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: "#0A5A8A", fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>LanfiaLink</p>
              <p style={{ color: "#5A8AAA", fontSize: 11, marginTop: 2 }}>Admin Panel</p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={collapsed ? "Étendre le menu" : "Réduire le menu"}
            className="hidden lg:flex items-center justify-center rounded-lg transition-colors icon-btn-anim"
            style={{
              padding: "4px", background: "transparent", border: "none", cursor: "pointer",
              color: "#5A8AAA", flexShrink: 0,
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(26,143,209,0.08)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}>
            <Menu size={14} />
          </button>
        </div>

        {/* Nav */}
        <nav className="relative z-10 flex-1 overflow-y-auto p-2" style={{
          scrollbarWidth: "thin", scrollbarColor: "rgba(26,143,209,0.25) transparent",
        }}>
          <SectionLabel label="Principal" collapsed={collapsed} />
          {bySection("main").map((i) => <NavItem key={i.id} item={i} collapsed={collapsed} />)}
          <SectionLabel label="Opérations" collapsed={collapsed} />
          {bySection("ops").map((i) => <NavItem key={i.id} item={i} collapsed={collapsed} />)}
          <SectionLabel label="Administration" collapsed={collapsed} />
          {bySection("admin").map((i) => <NavItem key={i.id} item={i} collapsed={collapsed} />)}
        </nav>

        {/* User */}
        <div className="relative z-10 p-2.5" style={{ borderTop: "0.5px solid #D4E4F0" }}>
          <div className="flex items-center rounded-lg p-2" style={{
            gap: collapsed ? 0 : 8,
            justifyContent: collapsed ? "center" : "flex-start",
            background: "#EDF5FA",
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: "linear-gradient(135deg,#1A8FD1,#0D6FAB)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#FFFFFF", fontSize: 11, fontWeight: 700, flexShrink: 0,
            }}>
              {getInitials()}
            </div>
            {!collapsed && (
              <>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    color: "#0A1E2E", fontSize: 12, fontWeight: 600,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>{getDisplayName()}</p>
                  <p style={{ color: "#1A8FD1", fontSize: 11, marginTop: 1, fontWeight: 500 }}>{getRole()}</p>
                </div>
                <button onClick={handleLogout} title="Déconnexion" aria-label="Déconnexion"
                  className="rounded-lg transition-colors icon-btn-anim"
                  style={{ padding: 5, background: "transparent", border: "none", cursor: "pointer", color: "#5A8AAA", flexShrink: 0 }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(26,143,209,0.10)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}>
                  <LogOut size={13} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      <div style={{
        height: 3,
        background: "linear-gradient(90deg,#0D6FAB 0%,#1A8FD1 40%,#4FB3E8 70%,#0D6FAB 100%)",
        flexShrink: 0,
      }} />
    </>
  );

  /* ─── Stat card with counter animation ───────────────────── */
  const StatCard = ({ stat, index }: { stat: StatItem; index: number }) => {
    const Icon = iconComponents[stat.icon] ?? CheckCircle;
    const up = stat.change.startsWith("+");
    const down = stat.change.startsWith("-");
    const p = statPalettes[index % statPalettes.length];
    const rawNum = parseInt(stat.value.replace(/[^0-9]/g, ""), 10);
    const animated = useCountUp(isNaN(rawNum) ? 0 : rawNum, 1400, dashboardReady);
    const displayVal = isNaN(rawNum) ? stat.value : animated.toLocaleString("fr-FR");

    return (
      <div
        className="stat-card-animated rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden"
        style={{ background: "#fff", border: "0.5px solid #C0D4E6", animationDelay: `${index * 0.07}s` }}
      >
        <div className="flex items-start justify-between">
          <div style={{
            width: 38, height: 38, borderRadius: 10, background: p.bg,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon size={17} style={{ color: p.icon }} />
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full font-semibold"
            style={{ background: p.badge, color: p.badgeText, fontSize: 12 }}>
            {up ? <TrendingUp size={11} /> : down ? <TrendingDown size={11} /> : <Minus size={11} />}
            {stat.change}
          </div>
        </div>
        <div>
          <p style={{ color: p.valueColor, fontSize: 26, fontWeight: 700, lineHeight: 1.1 }}>
            {displayVal}
          </p>
          <p style={{ color: p.titleColor, fontSize: 13, marginTop: 3, fontWeight: 500 }}>{stat.title}</p>
        </div>
        <div className="stat-underline absolute bottom-0 left-0 right-0" style={{ background: p.underline }} />
      </div>
    );
  };

  /* ─── Merchant Graph panel (compact sur le Tableau de bord,
     détaillé sur l'onglet Intelligence IA) ───────────────────
     N'affiche jamais de chiffre inventé : sans données backend,
     chaque dimension montre sa cible et une invitation à connecter
     le journal d'événements plutôt qu'une fausse valeur. */
  const MerchantGraphPanel = ({ compact = false }: { compact?: boolean }) => {
    const health = dashboardData.merchant_graph_health;
    return (
      <div className={compact ? "" : "panel-card rounded-2xl p-4"}
        style={compact ? {} : { background: "#fff", border: "0.5px solid #C0D4E6" }}>
        {!compact && (
          <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: "0.5px solid #D4E4F0" }}>
            <div className="flex items-center gap-2">
              <Gauge size={14} style={{ color: "#1A8FD1" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0A1E30" }}>Santé du Merchant Graph</span>
            </div>
          </div>
        )}
        <div className={compact ? "grid grid-cols-2 sm:grid-cols-4 gap-2.5" : "grid grid-cols-1 sm:grid-cols-2 gap-3"}>
          {MERCHANT_GRAPH_DIMENSIONS.map((dim, i) => {
            const metric = health?.[dim.key];
            const style = metricStatusStyles[metric?.status ?? "watch"];
            return (
              <div key={dim.key}
                className="quality-chip-anim rounded-xl p-3 flex items-start gap-2.5"
                style={{ background: compact ? "#F5FAFD" : style.bg, border: compact ? "0.5px solid #D4E4F0" : "none", animationDelay: `${i * 0.05}s` }}>
                <dim.icon size={14} style={{ color: compact ? "#5A8AAA" : style.text, flexShrink: 0, marginTop: 1 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#3A5A72" }}>{dim.label}</p>
                  {metric ? (
                    <p style={{ fontSize: compact ? 15 : 17, fontWeight: 700, color: compact ? "#0A1E2E" : style.text, marginTop: 1 }}>
                      {metric.value}
                    </p>
                  ) : (
                    <p style={{ fontSize: 11, color: "#8AA6BA", marginTop: 2 }}>Non connecté</p>
                  )}
                  <p style={{ fontSize: 10, color: "#8AA6BA", marginTop: 2 }}>{dim.target}</p>
                </div>
              </div>
            );
          })}
        </div>
        {!health && !compact && (
          <p style={{ fontSize: 11, color: "#8AA6BA", marginTop: 12 }}>
            Ces indicateurs s'activeront dès que l'API /dashboard/ exposera merchant_graph_health,
            calculé à partir du journal d'événements Merchant ID (priorité P0 de la feuille de route).
          </p>
        )}
      </div>
    );
  };

  /* ─── Agent Hub ──────────────────────────────────────────── */
  const AgentHubPanel = () => {
    const agents = dashboardData.agents ?? DEFAULT_AGENTS;
    return (
      <div className="panel-card rounded-2xl p-4" style={{ background: "#fff", border: "0.5px solid #C0D4E6" }}>
        <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: "0.5px solid #D4E4F0" }}>
          <div className="flex items-center gap-2">
            <Bot size={14} style={{ color: "#1A8FD1" }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0A1E30" }}>Agent Hub</span>
          </div>
          <span style={{ fontSize: 11, color: "#5A7A92" }}>
            {agents.filter((a) => a.status === "actif").length} / {agents.length} actifs
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {agents.map((agent, i) => {
            const Icon = AGENT_ICON_MAP[agent.id] ?? Bot;
            const style = agentStatusStyles[agent.status];
            return (
              <div key={agent.id}
                className="agent-card-anim rounded-xl p-3"
                style={{ background: "#F5FAFD", border: "0.5px solid #D4E4F0", animationDelay: `${i * 0.05}s` }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, background: "#D6EAF6",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <Icon size={13} style={{ color: "#0D6FAB" }} />
                    </div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#0A1E2E" }}>{agent.name}</p>
                  </div>
                  <span style={{
                    fontSize: 10, padding: "2px 7px", borderRadius: 4, fontWeight: 700,
                    background: style.bg, color: style.text, whiteSpace: "nowrap",
                  }}>{style.label}</span>
                </div>
                <p style={{ fontSize: 11, color: "#5A7A92", marginTop: 6, lineHeight: 1.45 }}>{agent.mission}</p>
                <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: "0.5px solid #E4EDF4" }}>
                  <span style={{ fontSize: 10, color: "#8AA6BA" }}>{agent.metric_label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#0A5A8A" }}>{agent.metric_value}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /* ─── Catalogue d'offres (nouveau) ───────────────────────────
     Reprend le §5 du document (Intelligence, Activate, Route,
     Connect, Pay, Finance, API, Compliance), affiche un statut
     honnête par offre et navigue vers l'onglet correspondant quand
     celui-ci est accessible à l'utilisateur courant. */
  const OffersCatalogPanel = () => (
    <div className="panel-card rounded-2xl p-4" style={{ background: "#fff", border: "0.5px solid #C0D4E6" }}>
      <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: "0.5px solid #D4E4F0" }}>
        <div className="flex items-center gap-2">
          <Package size={14} style={{ color: "#1A8FD1" }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#0A1E30" }}>Catalogue d'offres LanfiaLink</span>
        </div>
        <span style={{ fontSize: 11, color: "#5A7A92" }}>
          {OFFER_CATALOG.filter((o) => o.status === "actif").length} / {OFFER_CATALOG.length} en service
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {OFFER_CATALOG.map((offer, i) => {
          const style = agentStatusStyles[offer.status];
          const accessible = menuItems.some((m) => m.id === offer.tabId);
          return (
            <button
              key={offer.id}
              onClick={() => accessible && setActiveTab(offer.tabId)}
              disabled={!accessible}
              className="agent-card-anim rounded-xl p-3 text-left w-full"
              style={{
                background: "#F5FAFD", border: "0.5px solid #D4E4F0", animationDelay: `${i * 0.05}s`,
                cursor: accessible ? "pointer" : "default", fontFamily: "inherit",
              }}>
              <div className="flex items-start justify-between gap-2">
                <p style={{ fontSize: 12, fontWeight: 700, color: "#0A1E2E" }}>{offer.name}</p>
                <span style={{
                  fontSize: 10, padding: "2px 7px", borderRadius: 4, fontWeight: 700,
                  background: style.bg, color: style.text, whiteSpace: "nowrap",
                }}>{style.label}</span>
              </div>
              <p style={{ fontSize: 11, color: "#5A7A92", marginTop: 6, lineHeight: 1.45 }}>{offer.promesse}</p>
              <p style={{ fontSize: 10, color: "#8AA6BA", marginTop: 6 }}>{offer.revenue}</p>
            </button>
          );
        })}
      </div>
    </div>
  );

  /* ─── Page générique pour une offre en cours de câblage ──────
     Utilisée par les cinq nouvelles sections (Activations, Paiements,
     Financement, Conformité & Branding, API & Intégrations). Affiche
     les livrables et KPI cibles issus du document plutôt que des
     données inventées, en attendant que le backend correspondant
     soit branché. */
  const OfferPlaceholderPage = ({ tabId }: { tabId: string }) => {
    const content = OFFER_PAGE_CONTENT[tabId];
    if (!content) return null;
    const Icon = content.icon;
    return (
      <div className="space-y-4">
        <div className="rounded-2xl p-5" style={{ background: "#0D4E7A" }}>
          <div className="flex items-center gap-2 mb-1.5">
            <Icon size={16} style={{ color: "#4FB3E8" }} />
            <span style={{ color: "rgba(200,230,248,0.9)", fontSize: 12, fontWeight: 600 }}>Catalogue d'offres LanfiaLink</span>
          </div>
          <p style={{ color: "#FFFFFF", fontSize: 16, fontWeight: 700, lineHeight: 1.4 }}>{content.title}</p>
          <p style={{ color: "rgba(200,230,248,0.85)", fontSize: 12, marginTop: 6, maxWidth: 560 }}>{content.intro}</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-3">
          <div className="panel-card rounded-2xl p-4" style={{ background: "#fff", border: "0.5px solid #C0D4E6" }}>
            <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: "0.5px solid #D4E4F0" }}>
              <CheckCircle size={14} style={{ color: "#1A8FD1" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0A1E30" }}>Livrables prévus</span>
            </div>
            <ul className="space-y-2">
              {content.deliverables.map((d, i) => (
                <li key={i} className="flex items-start gap-2" style={{ fontSize: 12, color: "#2E4E66", lineHeight: 1.5 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#1A8FD1", marginTop: 6, flexShrink: 0 }} />
                  {d}
                </li>
              ))}
            </ul>
          </div>
          <div className="panel-card rounded-2xl p-4" style={{ background: "#fff", border: "0.5px solid #C0D4E6" }}>
            <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: "0.5px solid #D4E4F0" }}>
              <Gauge size={14} style={{ color: "#1A8FD1" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0A1E30" }}>KPI à suivre</span>
            </div>
            <ul className="space-y-2">
              {content.kpis.map((k, i) => (
                <li key={i} className="flex items-start gap-2" style={{ fontSize: 12, color: "#2E4E66", lineHeight: 1.5 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#0A9E7A", marginTop: 6, flexShrink: 0 }} />
                  {k}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="panel-card rounded-2xl p-4" style={{ background: "#fff", border: "0.5px solid #C0D4E6" }}>
          <EmptyState
            icon={content.icon}
            title="Module en cours de câblage"
            description="Cette section affichera des données réelles dès que l'API correspondante sera exposée côté backend. Elle reste volontairement vide plutôt que remplie de chiffres fictifs."
          />
        </div>
      </div>
    );
  };

  /* ─── Onglet Intelligence IA ─────────────────────────────── */
  const IntelligenceContent = () => (
    <div className="space-y-4">
      <div className="rounded-2xl p-5" style={{ background: "#0D4E7A" }}>
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles size={16} style={{ color: "#4FB3E8" }} />
          <span style={{ color: "rgba(200,230,248,0.9)", fontSize: 12, fontWeight: 600 }}>LanfiaLink Intelligence</span>
        </div>
        <p style={{ color: "#FFFFFF", fontSize: 16, fontWeight: 700, lineHeight: 1.4 }}>
          Suivi de la qualité du Merchant Graph et des agents qui l'exploitent
        </p>
        <p style={{ color: "rgba(200,230,248,0.85)", fontSize: 12, marginTop: 6, maxWidth: 560 }}>
          Cette vue devient la base des futurs modules de scoring et de recommandation
          (white-space mapping, next-best-outlet) une fois le Merchant ID et le journal
          d'événements connectés côté backend.
        </p>
      </div>

      <MerchantGraphPanel />
      <AgentHubPanel />
      <OffersCatalogPanel />

      <div className="panel-card rounded-2xl p-4" style={{ background: "#fff", border: "0.5px solid #C0D4E6" }}>
        <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: "0.5px solid #D4E4F0" }}>
          <Radar size={14} style={{ color: "#1A8FD1" }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#0A1E30" }}>Prochains meilleurs points de vente</span>
        </div>
        <EmptyState
          icon={Radar}
          title="Scoring de potentiel non encore branché"
          description="Cette zone affichera les recommandations du Territory Agent (white-spaces, next-best-outlet) dès que le scoring de potentiel PDV sera disponible côté API."
        />
      </div>
    </div>
  );

  /* ─── Dashboard content ──────────────────────────────────── */
  const DashboardContent = () => {
    const data = getCurrentData();
    const quickActions = [
      { icon: Plus,         label: "Nouveau distributeur", bg: "#0D4E7A", perm: "distributeurs", onClick: () => setActiveTab("points-vente") },
      { icon: Package,      label: "Gérer le stock",       bg: "#1A8FD1", perm: "inventaire",    onClick: () => setActiveTab("stocks") },
      { icon: ShoppingCart, label: "Nouvelle commande",    bg: "#0A7EA4", perm: "commande",      onClick: () => setActiveTab("commandes") },
      { icon: BarChart3,    label: "Voir les rapports",    bg: "#2E4DB0", perm: "analytique",    onClick: () => setActiveTab("statistiques") },
    ].filter((a) => userPermissions[a.perm as keyof typeof userPermissions]);

    return (
      <div className="space-y-4">
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl"
            style={{ background: "#FEF0ED", border: "0.5px solid #F5C4B3", color: "#9A2D10", fontSize: 13 }}>
            <AlertTriangle size={16} className="flex-shrink-0" />
            <span style={{ flex: 1 }}>{error}</span>
            <button onClick={() => setError(null)} aria-label="Fermer" className="icon-btn-anim"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#9A2D10", padding: 2 }}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Welcome banner */}
        <div className="relative overflow-hidden rounded-2xl p-5 banner-anim" style={{ background: "#0D4E7A" }}>
          <div className="absolute top-0 left-0 right-0" style={{
            height: 3,
            background: "linear-gradient(90deg,#0D6FAB 0%,#1A8FD1 35%,#4FB3E8 65%,#1A8FD1 85%,#0D6FAB 100%)",
          }} />
          <svg aria-hidden className="absolute right-0 top-0 w-36 h-36 pointer-events-none"
            viewBox="0 0 144 144" style={{ opacity: 0.12 }} xmlns="http://www.w3.org/2000/svg">
            <circle cx="144" cy="0" r="100" fill="none" stroke="#4FB3E8" strokeWidth="1.5" />
            <circle cx="144" cy="0" r="65"  fill="none" stroke="#4FB3E8" strokeWidth="1"   />
            <circle cx="144" cy="0" r="32"  fill="none" stroke="#4FB3E8" strokeWidth="0.8" />
            <line x1="144" y1="0" x2="0" y2="144" stroke="#4FB3E8" strokeWidth="0.7" />
            <line x1="144" y1="0" x2="40" y2="144" stroke="#4FB3E8" strokeWidth="0.5" />
          </svg>
          <div className="relative flex items-start justify-between gap-4 pt-1">
            <div>
              <p style={{ color: "rgba(200,230,248,0.90)", fontSize: 12, marginBottom: 4, fontWeight: 500 }}>
                Bienvenue de retour
              </p>
              <h1 style={{ color: "#FFFFFF", fontSize: 22, fontWeight: 700 }}>{getDisplayName()} 👋</h1>
              <p style={{ color: "rgba(200,230,248,0.85)", fontSize: 12, marginTop: 5 }}>
                {selectedPOS?.pos_name === "Total Général"
                  ? "Vue d'ensemble de toute votre activité"
                  : `Point de vente : ${selectedPOS?.pos_name}`}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  { icon: <UserRound size={11} />, label: getRole(),       color: "rgba(79,179,232,0.30)", text: "#D6EFFC" },
                  { icon: <MapPin size={11} />,    label: getLocation(),   color: "rgba(79,179,232,0.18)", text: "#C8E8F8" },
                  ...(userPermissions.distributeurs
                    ? [{ icon: <Package size={11} />, label: `${getPOS().length} distributeur(s)`, color: "rgba(79,179,232,0.18)", text: "#C8E8F8" }]
                    : []),
                ].map((t, i) => (
                  <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                    style={{ background: t.color, color: t.text, fontSize: 12, fontWeight: 500 }}>
                    {t.icon}{t.label}
                  </span>
                ))}
              </div>
            </div>
            <div style={{
              width: 46, height: 46, borderRadius: 11, flexShrink: 0,
              background: "rgba(255,255,255,0.20)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#FFFFFF", fontSize: 16, fontWeight: 700,
              border: "1.5px solid rgba(255,255,255,0.30)",
            }}>
              {getInitials()}
            </div>
          </div>
        </div>

        {/* Bandeau compact de santé du Merchant Graph — vue d'ensemble rapide,
            le détail complet vit dans l'onglet Intelligence IA. */}
        {userPermissions.intelligence && (
          <div className="rounded-2xl p-3.5" style={{ background: "#fff", border: "0.5px solid #C0D4E6" }}>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <Gauge size={13} style={{ color: "#1A8FD1" }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#0A1E30" }}>Santé du Merchant Graph</span>
              </div>
              <button onClick={() => setActiveTab("intelligence")}
                className="flex items-center gap-1 transition-colors text-btn-anim"
                style={{ color: "#1A8FD1", background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 11 }}>
                Détails <ChevronRight size={10} />
              </button>
            </div>
            <MerchantGraphPanel compact />
          </div>
        )}

        {/* Stat cards */}
        {data.stats.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {data.stats.map((s, i) => <StatCard key={i} stat={s} index={i} />)}
          </div>
        )}

        {/* Quick actions */}
        {quickActions.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {quickActions.map((a, i) => (
              <button key={i} onClick={a.onClick}
                className="action-btn-anim p-4 rounded-2xl flex flex-col items-start gap-2.5"
                style={{ background: a.bg, border: "none", cursor: "pointer", textAlign: "left" }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 9,
                  background: "rgba(255,255,255,0.18)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <a.icon size={16} color="#FFFFFF" />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#FFFFFF", lineHeight: 1.3 }}>{a.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Bottom panels */}
        <div className="grid lg:grid-cols-2 gap-3">
          {/* Activities */}
          <div className="panel-card rounded-2xl p-4" style={{ background: "#fff", border: "0.5px solid #C0D4E6" }}>
            <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: "0.5px solid #D4E4F0" }}>
              <div className="flex items-center gap-2">
                <Activity size={14} style={{ color: "#1A8FD1" }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0A1E30" }}>Activités récentes</span>
              </div>
              {data.recent_activities.length > 0 && (
                <button className="flex items-center gap-1 transition-colors text-btn-anim"
                  style={{ color: "#1A8FD1", background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12 }}>
                  Tout voir <ChevronRight size={11} />
                </button>
              )}
            </div>
            <div className="space-y-1">
              {data.recent_activities.length > 0 ? data.recent_activities.map((a, i) => {
                const Icon = iconComponents[a.icon] ?? CheckCircle;
                return (
                  <div key={i}
                    className="activity-row-anim flex items-center gap-3 px-3 py-2.5"
                    style={{ animationDelay: `${i * 0.06}s` }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, background: "#D6EAF6",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <Icon size={14} style={{ color: "#0D6FAB" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: 12, fontWeight: 600, color: "#0A1E2E",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>{a.action}</p>
                      <p style={{
                        fontSize: 11, color: "#1478B0", fontWeight: 500,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        marginTop: 2,
                      }}>{a.user}</p>
                    </div>
                    <span style={{
                      fontSize: 11, color: "#5A7A92", flexShrink: 0,
                      display: "flex", alignItems: "center", gap: 3, fontWeight: 500,
                    }}>
                      <Clock size={10} />{a.time}
                    </span>
                  </div>
                );
              }) : (
                <EmptyState icon={Activity} title="Aucune activité récente" description="Les visites, commandes et mises à jour de fiches apparaîtront ici." />
              )}
            </div>
          </div>

          {/* Alerts */}
          <div className="panel-card rounded-2xl p-4" style={{ background: "#fff", border: "0.5px solid #C0D4E6" }}>
            <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: "0.5px solid #D4E4F0" }}>
              <div className="flex items-center gap-2">
                <Bell size={14} style={{ color: "#1A8FD1" }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0A1E30" }}>Alertes importantes</span>
              </div>
            </div>
            <div className="space-y-2">
              {data.alerts.length > 0 ? data.alerts.map((a, i) => {
                const Icon = iconComponents[a.icon] ?? AlertTriangle;
                const styles = {
                  high:   { bar: "#B03318", bg: "#FEF0ED", icon: "#B03318", badge: "#FCD9D0", badgeText: "#8A2410", label: "Urgent",  typeColor: "#B03318" },
                  medium: { bar: "#1A8FD1", bg: "#D6EAF6", icon: "#0A5A8A", badge: "#B8D9EE", badgeText: "#083A60", label: "Moyen",   typeColor: "#0A5A8A" },
                  low:    { bar: "#0A7EA4", bg: "#E3F5F0", icon: "#0A6A88", badge: "#A4E0D0", badgeText: "#044A3A", label: "Info",    typeColor: "#0A6A88" },
                }[a.priority];
                return (
                  <div key={i}
                    className="alert-item-anim flex gap-3 items-start rounded-xl p-3 relative overflow-hidden"
                    style={{ background: styles.bg }}
                  >
                    <div className="absolute left-0 top-0 bottom-0" style={{ width: 3, background: styles.bar, borderRadius: 0 }} />
                    <Icon size={14} style={{ color: styles.icon, flexShrink: 0, marginTop: 1 }} />
                    <div style={{ flex: 1, minWidth: 0, paddingLeft: 2 }}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span style={{ fontSize: 12, fontWeight: 700, color: styles.typeColor }}>{a.type}</span>
                        <span style={{
                          fontSize: 10, padding: "2px 7px", borderRadius: 4, fontWeight: 700,
                          background: styles.badge, color: styles.badgeText,
                        }}>{styles.label}</span>
                      </div>
                      <p style={{ fontSize: 11, color: "#2E4E66", lineHeight: 1.55, marginTop: 2 }}>{a.message}</p>
                    </div>
                  </div>
                );
              }) : (
                <EmptyState icon={CheckCircle} title="Aucune alerte pour le moment" description="Les ruptures de stock, litiges et anomalies détectées apparaîtront ici." />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ─── Render active tab ──────────────────────────────────── */
  const renderContent = () => {
    const item = menuItems.find((i) => i.id === activeTab);
    if (!item && activeTab !== "dashboard") {
      return (
        <div className="rounded-2xl p-12 text-center" style={{ background: "#fff", border: "0.5px solid #C0D4E6" }}>
          <AlertTriangle size={28} style={{ color: "#B8D4E8", margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "#0A1E30", marginBottom: 8 }}>Accès non autorisé</h3>
          <p style={{ fontSize: 13, color: "#4A6B85", marginBottom: 20 }}>
            Vous n'avez pas la permission d'accéder à cette section.
          </p>
          <button onClick={() => setActiveTab("dashboard")}
            className="px-5 py-2.5 rounded-xl font-semibold transition-colors"
            style={{ background: "#1A8FD1", color: "#FFFFFF", border: "none", cursor: "pointer", fontSize: 13 }}>
            Retour au tableau de bord
          </button>
        </div>
      );
    }
    switch (activeTab) {
      case "dashboard":          return <DashboardContent />;
      case "intelligence":       return userPermissions.intelligence         ? <IntelligenceContent /> : null;
      case "points-vente":       return userPermissions.distributeurs        ? React.createElement(PointsVenteManagement as any,  { selectedPOS }) : null;
      case "stocks":             return userPermissions.inventaire            ? React.createElement(StockManagement as any,         { selectedPOS }) : null;
      case "commandes":          return userPermissions.commande              ? React.createElement(OrderManagement as any,         { selectedPOS }) : null;
      case "vendeurs-ambulants": return userPermissions.commerciaux           ? React.createElement(MobileVendorsManagement as any, { selectedPOS }) : null;
      case "statistiques":       return userPermissions.analytique            ? <StatisticsDashboard /> : null;
      case "utilisateurs":       return userPermissions.utilisateur           ? React.createElement(UserManagement as any) : null;
      case "parametres":         return userPermissions.configuration         ? <ParametresManagement /> : null;
      case "cartes":             return userPermissions.geolocalisation        ? <MapComponent /> : null;
      case "Pushcart":           return userPermissions.prospects             ? <PushcartManagement /> : null;
      case "positions":          return userPermissions.positions             ? <LocalisationManagement /> : null;
      case "points-ventes":      return userPermissions.dashboard_analytique  ? <LanfiaLinkDashboard /> : null;
      /* Nouvelles offres du catalogue — chacune à câbler au fur et à mesure. */
      case "financement":        return userPermissions.financement           ? <FinancementManagement /> : null;
      case "activations":        return userPermissions.activations           ? <ActivationManagement /> : null;
      case "paiements":          return userPermissions.paiements             ? <PaiementsManagement /> : null;
      case "conformite":         return userPermissions.conformite            ? <OfferPlaceholderPage tabId="conformite" /> : null;
      case "api":                return userPermissions.api                   ? <OfferPlaceholderPage tabId="api" /> : null;
      default: return null;
    }
  };

  /* ─── Loading screen ─────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#EDF5FA" }}>
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div style={{
              width: 60, height: 60, borderRadius: 14,
              background: "linear-gradient(135deg,#1A8FD1,#0D6FAB)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ color: "#FFFFFF", fontWeight: 700, fontSize: 18 }}>LL</span>
            </div>
            <div style={{
              position: "absolute", inset: -4, border: "2px solid rgba(26,143,209,0.30)",
              borderRadius: 18, animation: "ping 1.2s ease-in-out infinite",
            }} />
          </div>
          <div className="text-center">
            <p style={{ color: "#0A5A8A", fontWeight: 700, fontSize: 15 }}>Chargement en cours</p>
            <p style={{ color: "#4A6B85", fontSize: 13, marginTop: 4 }}>LanfiaLink Admin</p>
          </div>
        </div>
        <style>{`@keyframes ping{0%,100%{opacity:0.4;transform:scale(1)}50%{opacity:0.9;transform:scale(1.08)}}`}</style>
      </div>
    );
  }

  const collapsed = !sidebarOpen;

  return (
    <div className="min-h-screen" style={{ background: "#EBF4FB", fontFamily: "inherit" }}>
      <style>{globalStyles}</style>

      {/* ── Mobile header ───────────────────────────────────── */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-50"
        style={{ background: "#fff", borderBottom: "0.5px solid #C0D4E6" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileMenuOpen(true)} aria-label="Ouvrir le menu"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <Menu size={20} style={{ color: "#2A4A62" }} />
          </button>
          <div className="flex items-center gap-2">
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: "linear-gradient(135deg,#1A8FD1,#0D6FAB)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ color: "#FFFFFF", fontWeight: 700, fontSize: 11 }}>LL</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#0A5A8A" }}>LanfiaLink</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            data-notif-toggle
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            aria-label="Notifications"
            aria-haspopup="true"
            aria-expanded={notificationsOpen}
            className="relative" style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}>
            <Bell size={18} style={{ color: "#2A4A62" }} />
            {unreadCount > 0 && (
              <span className="notif-dot-pulse absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center font-bold"
                style={{ background: "#C04020", color: "#fff", fontSize: 9 }}>{unreadCount}</span>
            )}
          </button>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: "linear-gradient(135deg,#1A8FD1,#0D6FAB)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#FFFFFF", fontSize: 11, fontWeight: 700,
          }}>{getInitials()}</div>
        </div>
      </div>

      {/* ── Mobile sidebar overlay ───────────────────────────── */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Menu de navigation">
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.40)" }}
            onClick={() => setMobileMenuOpen(false)} />
          <div className="relative flex flex-col" style={{ width: 240, background: "#FFFFFF", height: "100%" }}>
            <div className="flex items-center justify-between px-4 py-4"
              style={{ borderBottom: "0.5px solid #D4E4F0" }}>
              <div className="flex items-center gap-2.5">
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: "linear-gradient(135deg,#1A8FD1,#0D6FAB)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                  </svg>
                </div>
                <div>
                  <p style={{ color: "#0A5A8A", fontSize: 14, fontWeight: 700 }}>LanfiaLink</p>
                  <p style={{ color: "#5A8AAA", fontSize: 11 }}>Admin Panel</p>
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} aria-label="Fermer le menu"
                style={{ background: "none", border: "none", cursor: "pointer", color: "#5A8AAA", padding: 4 }}>
                <X size={16} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-2">
              <SectionLabel label="Principal" collapsed={false} />
              {bySection("main").map((i) => <NavItem key={i.id} item={i} collapsed={false} />)}
              <SectionLabel label="Opérations" collapsed={false} />
              {bySection("ops").map((i) => <NavItem key={i.id} item={i} collapsed={false} />)}
              <SectionLabel label="Administration" collapsed={false} />
              {bySection("admin").map((i) => <NavItem key={i.id} item={i} collapsed={false} />)}
            </nav>
          </div>
        </div>
      )}

      {/* ── Desktop sidebar ──────────────────────────────────── */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 flex-col transition-all duration-300"
        style={{
          width: collapsed ? 60 : 210,
          background: "#FFFFFF",
          borderRight: "0.5px solid #D4E4F0",
          boxShadow: "2px 0 12px rgba(13,80,140,0.06)",
        }}>
        <SidebarContent collapsed={collapsed} />
      </aside>

      {/* ── Main ─────────────────────────────────────────────── */}
      <div className="transition-all duration-300">
        <div className="hidden lg:block" style={{ marginLeft: collapsed ? 60 : 210 }}>
          {/* Top bar */}
          <header className="flex items-center justify-between px-6 sticky top-0 z-30"
            style={{ height: 58, background: "#fff", borderBottom: "0.5px solid #C0D4E6" }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#0A1E2E" }}>
                {menuItems.find((i) => i.id === activeTab)?.label ?? "Tableau de bord"}
              </p>
              <p style={{ fontSize: 12, color: "#1A8FD1", marginTop: 1, fontWeight: 500 }}>
                {activeTab === "dashboard"
                  ? "Vue d'ensemble de votre activité"
                  : `Gestion · ${menuItems.find((i) => i.id === activeTab)?.label}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* POS selector */}
              {userPermissions.distributeurs && (
                <div className="relative">
                  <button
                    data-pos-toggle
                    onClick={() => setPosDropdownOpen(!posDropdownOpen)}
                    aria-label="Sélectionner un point de vente"
                    aria-haspopup="true"
                    aria-expanded={posDropdownOpen}
                    className="flex items-center gap-1.5 transition-colors"
                    style={{
                      padding: "7px 12px", border: "0.5px solid #C0D4E6", borderRadius: 8,
                      background: "#EDF5FA", color: "#0A5A8A", cursor: "pointer",
                      fontFamily: "inherit", fontWeight: 600, fontSize: 12,
                    }}>
                    <MapPin size={12} style={{ color: "#1A8FD1" }} />
                    <span style={{ maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {selectedPOS?.pos_name ?? "Sélectionner"}
                    </span>
                    <ChevronsUpDown size={12} style={{ color: "#5A8AAA" }} />
                  </button>
                  {posDropdownOpen && (
                    <div data-pos-panel className="absolute right-0 mt-1.5 rounded-2xl overflow-hidden z-20"
                      style={{
                        width: 220, background: "#fff", border: "0.5px solid #C0D4E6",
                        boxShadow: "0 8px 24px rgba(13,27,42,0.12)",
                      }}>
                      <div className="p-1.5 max-h-56 overflow-y-auto">
                        {[dashboardData.cumulative, ...dashboardData.pos_data].map((p) => (
                          <button key={p.pos_id ?? "cum"} onClick={() => { setSelectedPOS(p); setPosDropdownOpen(false); }}
                            className="w-full text-left flex items-center gap-2 rounded-xl transition-colors"
                            style={{
                              padding: "8px 10px",
                              background: selectedPOS?.pos_id === p.pos_id ? "#D6EAF6" : "transparent",
                              color: selectedPOS?.pos_id === p.pos_id ? "#0A5A8A" : "#2A4A62",
                              fontWeight: selectedPOS?.pos_id === p.pos_id ? 700 : 500,
                              border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12,
                            }}>
                            <MapPin size={11} style={{ color: selectedPOS?.pos_id === p.pos_id ? "#1A8FD1" : "#6A9AB8" }} />
                            {p.pos_name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Search */}
              <div className="hidden md:flex items-center gap-2 px-3"
                style={{ height: 36, border: "0.5px solid #C0D4E6", borderRadius: 8, background: "#EDF5FA" }}>
                <Search size={13} style={{ color: "#5A8AAA" }} />
                <input
                  type="text"
                  placeholder="Rechercher…"
                  aria-label="Rechercher dans le menu"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  style={{
                    border: "none", background: "transparent", fontSize: 13, width: 140,
                    color: "#0A1E2E", outline: "none", fontFamily: "inherit",
                  }} />
              </div>

              {/* Notifications */}
              <div className="relative">
                <button
                  data-notif-toggle
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  aria-label="Notifications"
                  aria-haspopup="true"
                  aria-expanded={notificationsOpen}
                  style={{
                    width: 36, height: 36, borderRadius: 8, border: "0.5px solid #C0D4E6",
                    background: "#EDF5FA", display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", position: "relative",
                  }}>
                  <Bell size={15} style={{ color: "#2A4A62" }} />
                  {unreadCount > 0 && (
                    <span className="notif-dot-pulse" style={{
                      position: "absolute", top: 4, right: 4, width: 8, height: 8,
                      borderRadius: "50%", background: "#C04020", border: "1.5px solid #EDF5FA",
                    }} />
                  )}
                </button>
                {notificationsOpen && (
                  <div data-notif-panel className="absolute right-0 mt-1.5 rounded-2xl overflow-hidden z-20"
                    style={{
                      width: 300, background: "#fff", border: "0.5px solid #C0D4E6",
                      boxShadow: "0 8px 24px rgba(13,27,42,0.12)",
                    }}>
                    <div className="flex items-center justify-between px-4 py-3"
                      style={{ borderBottom: "0.5px solid #D4E4F0" }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#0A1E2E" }}>Notifications</span>
                      <button onClick={handleMarkAllRead} disabled={unreadCount === 0} aria-label="Marquer tout comme lu"
                        style={{
                          fontSize: 12, color: unreadCount === 0 ? "#9AB4C6" : "#1A8FD1", background: "none",
                          border: "none", cursor: unreadCount === 0 ? "default" : "pointer", fontWeight: 600,
                        }}>
                        Tout lire
                      </button>
                    </div>
                    <div style={{ maxHeight: 300, overflowY: "auto" }}>
                      {notifications.length > 0 ? notifications.map((n) => (
                        <div key={n.id} className="notif-row-anim px-4 py-3"
                          role="button" tabIndex={0}
                          onClick={() => handleNotificationClick(n)}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleNotificationClick(n); }}
                          style={{
                            borderBottom: "0.5px solid #EBF4FB",
                            background: n.is_read ? "transparent" : "rgba(26,143,209,0.05)",
                            cursor: n.is_read ? "default" : "pointer",
                          }}>
                          <div className="flex justify-between gap-2 mb-0.5">
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#0A5A8A" }}>{n.type}</span>
                            <span style={{ fontSize: 11, color: "#5A7A92", flexShrink: 0, display: "flex", alignItems: "center", gap: 3 }}>
                              <Clock size={10} />{formatAgo(new Date(n.created_at))}
                            </span>
                          </div>
                          <p style={{ fontSize: 12, color: "#2A4A62", lineHeight: 1.5, marginTop: 2 }}>{n.message}</p>
                          {!n.is_read && (
                            <div className="notif-dot-pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: "#1A8FD1", marginTop: 6 }} />
                          )}
                        </div>
                      )) : (
                        <div className="py-8 text-center">
                          <p style={{ fontSize: 13, color: "#4A6B85" }}>Aucune notification</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User */}
              <div className="flex items-center gap-2.5 pl-3" style={{ borderLeft: "0.5px solid #C0D4E6" }}>
                <div className="text-right hidden sm:block">
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#0A1E2E" }}>{getDisplayName()}</p>
                  <p style={{ fontSize: 11, color: "#1A8FD1", marginTop: 1, fontWeight: 600 }}>{getRole()}</p>
                </div>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: "linear-gradient(135deg,#1A8FD1,#0D6FAB)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#FFFFFF", fontSize: 11, fontWeight: 700,
                }}>{getInitials()}</div>
                <button onClick={handleLogout} title="Déconnexion" aria-label="Déconnexion"
                  style={{ padding: 5, background: "none", border: "none", cursor: "pointer", borderRadius: 6 }}>
                  <LogOut size={14} style={{ color: "#5A7A92" }} />
                </button>
              </div>
            </div>
          </header>

          {/* Blue accent under topbar */}
          <div style={{ height: 2, background: "linear-gradient(90deg,#EDF5FA 0%,#1A8FD1 30%,#4FB3E8 60%,#EDF5FA 100%)" }} />

          <main className="p-5 max-w-screen-2xl mx-auto">{renderContent()}</main>
        </div>

        {/* Mobile main */}
        <div className="lg:hidden pt-2 px-4 pb-6">{renderContent()}</div>
      </div>

      {/* Mobile notifications panel */}
      {notificationsOpen && (
        <div className="lg:hidden fixed inset-0 z-50" onClick={() => setNotificationsOpen(false)} role="dialog" aria-modal="true" aria-label="Notifications">
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.35)" }} />
          <div data-notif-panel className="absolute right-0 top-0 h-full flex flex-col"
            style={{ width: 300, background: "#fff" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-4"
              style={{ borderBottom: "0.5px solid #D4E4F0" }}>
              <span style={{ fontWeight: 700, color: "#0A1E2E", fontSize: 15 }}>Notifications</span>
              <div className="flex items-center gap-3">
                <button onClick={handleMarkAllRead} disabled={unreadCount === 0} aria-label="Marquer tout comme lu"
                  style={{
                    fontSize: 12, color: unreadCount === 0 ? "#9AB4C6" : "#1A8FD1", background: "none",
                    border: "none", cursor: unreadCount === 0 ? "default" : "pointer", fontWeight: 600,
                  }}>
                  Tout lire
                </button>
                <button onClick={() => setNotificationsOpen(false)} aria-label="Fermer le menu"
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                  <X size={16} style={{ color: "#2A4A62" }} />
                </button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {notifications.length > 0 ? notifications.map((n) => (
                <div key={n.id} className="notif-row-anim px-4 py-3"
                  role="button" tabIndex={0}
                  onClick={() => handleNotificationClick(n)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleNotificationClick(n); }}
                  style={{
                    borderBottom: "0.5px solid #EBF4FB",
                    background: n.is_read ? "transparent" : "rgba(26,143,209,0.05)",
                    cursor: n.is_read ? "default" : "pointer",
                  }}>
                  <div className="flex justify-between gap-2 mb-0.5">
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#0A5A8A" }}>{n.type}</span>
                    <span style={{ fontSize: 11, color: "#5A7A92" }}>{formatAgo(new Date(n.created_at))}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "#2A4A62", lineHeight: 1.5, marginTop: 2 }}>{n.message}</p>
                </div>
              )) : (
                <div className="py-8 text-center">
                  <p style={{ fontSize: 13, color: "#4A6B85" }}>Aucune notification</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
 