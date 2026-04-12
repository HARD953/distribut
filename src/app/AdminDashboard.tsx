"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Home, MapPin, Package, ShoppingCart, Users,
  BarChart3, Map, Settings, Menu, Bell, Search, Truck,
  LogOut, Plus, AlertTriangle, Clock, CheckCircle,
  ChevronsUpDown, UserRound, Bike, X, ChevronRight,
  TrendingUp, TrendingDown, Minus, Activity,
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
export interface DashboardData {
  cumulative: POSData; pos_data: POSData[];
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
    };
    phone?: string; location?: string; points_of_sale?: string[];
  };
}

/* ─── Icon map ───────────────────────────────────────────── */
const iconComponents: Record<string, React.ComponentType<any>> = {
  MapPin, ShoppingCart, Users, AlertTriangle, CheckCircle, UserRound, Bike,
};

/* ─── Kente stripe (inline SVG reusable) ─────────────────── */
const KenteStripe = ({ height = 4 }: { height?: number }) => (
  <div
    style={{
      height,
      background:
        "repeating-linear-gradient(90deg,#B8801F 0,#B8801F 14px,#E8C050 14px,#E8C050 28px,#1A3A28 28px,#1A3A28 36px,#8B2020 36px,#8B2020 50px,#E8C050 50px,#E8C050 64px,#1A3A28 64px,#1A3A28 72px)",
    }}
  />
);

/* ─── Adinkra SVG background ─────────────────────────────── */
const AdinkraBg = () => (
  <svg
    aria-hidden="true"
    className="absolute inset-0 w-full h-full pointer-events-none"
    style={{ opacity: 0.055 }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern id="gye" x="0" y="0" width="52" height="52" patternUnits="userSpaceOnUse">
        <circle cx="26" cy="26" r="20" fill="none" stroke="#FAF7F0" strokeWidth="1.2" />
        <circle cx="26" cy="26" r="10" fill="none" stroke="#FAF7F0" strokeWidth="0.8" />
        <circle cx="26" cy="26" r="3.5" fill="#FAF7F0" opacity="0.55" />
        <line x1="6"  y1="26" x2="46" y2="26" stroke="#FAF7F0" strokeWidth="0.55" />
        <line x1="26" y1="6"  x2="26" y2="46" stroke="#FAF7F0" strokeWidth="0.55" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#gye)" />
  </svg>
);

/* ─── Stat card palette ──────────────────────────────────── */
const statPalettes = [
  { bg: "#EAF2EC", icon: "#1A3A28", badge: "#EAF2EC", badgeText: "#1A3A28" },
  { bg: "#FDF3E0", icon: "#B8801F", badge: "#FDF3E0", badgeText: "#B8801F" },
  { bg: "#F0EBF8", icon: "#6B3A9E", badge: "#F0EBF8", badgeText: "#6B3A9E" },
  { bg: "#FEF0EE", icon: "#8B2020", badge: "#FEF0EE", badgeText: "#8B2020" },
];

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
  const [userPermissions, setUserPermissions] = useState({
    tableau: true, distributeurs: true, commerciaux: true, prospects: true,
    inventaire: true, commande: true, utilisateur: true, analytique: true,
    geolocalisation: true, configuration: true, positions: true, dashboard_analytique: true,
  });

  /* ── Fetch user ── */
  useEffect(() => {
    const fetch = async () => {
      try {
        const token = localStorage.getItem("access");
        if (!token) return;
        const res = await window.fetch("https://api.lanfialink.com/api/me", {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
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
            });
          }
        }
      } catch { /* silent */ }
    };
    fetch();
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
      } catch {
        logout(); router.push("/login");
      }
    };
    check();
  }, [router, logout]);

  /* ── Fetch notifications ── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const fetch = async () => {
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
    fetch();
  }, [router, logout]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const formatAgo = (date: Date) => {
    const diff = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diff < 60) return `${diff}min`;
    const h = Math.floor(diff / 60);
    return h < 24 ? `${h}h` : `${Math.floor(h / 24)}j`;
  };

  const handleLogout = () => { logout(); router.push("/login"); };
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
    { id: "dashboard",         icon: Home,         label: "Tableau de bord",  perm: "tableau",             section: "main" },
    { id: "points-vente",      icon: MapPin,        label: "Distributeurs",    perm: "distributeurs",       section: "main" },
    { id: "points-ventes",     icon: MapPin,        label: "Points de vente",  perm: "dashboard_analytique",section: "main" },
    { id: "vendeurs-ambulants",icon: Bike,          label: "Commerciaux",      perm: "commerciaux",         section: "main" },
    { id: "Pushcart",          icon: Truck,         label: "Prospects",        perm: "prospects",           section: "main" },
    { id: "stocks",            icon: Package,       label: "Inventaire",       perm: "inventaire",          section: "ops"  },
    { id: "commandes",         icon: ShoppingCart,  label: "Commandes",        perm: "commande",            section: "ops"  },
    { id: "statistiques",      icon: BarChart3,     label: "Analytiques",      perm: "analytique",          section: "ops"  },
    { id: "cartes",            icon: Map,           label: "Géolocalisation",  perm: "geolocalisation",     section: "ops"  },
    { id: "utilisateurs",      icon: Users,         label: "Utilisateurs",     perm: "utilisateur",         section: "admin"},
    { id: "positions",         icon: MapPin,        label: "Découpage",        perm: "positions",           section: "admin"},
    { id: "parametres",        icon: Settings,      label: "Configuration",    perm: "configuration",       section: "admin"},
  ];
  const menuItems = allItems.filter((i) => userPermissions[i.perm as keyof typeof userPermissions]);
  const bySection = (s: string) => menuItems.filter((i) => i.section === s);

  /* ─── Sidebar nav item ──────────────────────────────────── */
  const NavItem = ({ item, collapsed }: { item: (typeof allItems)[number]; collapsed: boolean }) => {
    const active = activeTab === item.id;
    return (
      <button
        onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
        title={collapsed ? item.label : undefined}
        className="group relative w-full flex items-center gap-2.5 text-sm transition-all duration-150"
        style={{
          padding: collapsed ? "8px 10px" : "8px 10px",
          justifyContent: collapsed ? "center" : "flex-start",
          borderRadius: 8,
          background: active ? "#B8801F" : "transparent",
          color: active ? "#FAF7F0" : "rgba(250,247,240,0.6)",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
        onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(250,247,240,0.07)"; }}
        onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
      >
        <item.icon size={14} style={{ flexShrink: 0, opacity: active ? 1 : 0.8 }} />
        {!collapsed && <span className="truncate text-xs">{item.label}</span>}
        {collapsed && (
          <div className="absolute left-full ml-2.5 px-2 py-1 rounded-lg text-xs whitespace-nowrap z-50
            opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity"
            style={{ background: "#0E2018", color: "#FAF7F0" }}>
            {item.label}
          </div>
        )}
      </button>
    );
  };

  /* ─── Section header ─────────────────────────────────────── */
  const SectionLabel = ({ label, collapsed }: { label: string; collapsed: boolean }) =>
    collapsed ? <div style={{ height: 8 }} /> : (
      <p style={{ fontSize: 9, color: "rgba(250,247,240,0.3)", textTransform: "uppercase",
        letterSpacing: "0.1em", padding: "10px 8px 4px", fontWeight: 600 }}>
        {label}
      </p>
    );

  /* ─── Sidebar ────────────────────────────────────────────── */
  const SidebarContent = ({ collapsed }: { collapsed: boolean }) => (
    <>
      <KenteStripe height={4} />
      <div className="relative overflow-hidden flex-1 flex flex-col">
        <AdinkraBg />
        {/* Logo */}
        <div className="relative z-10 flex items-center border-b px-4 py-4"
          style={{ gap: collapsed ? 0 : 10, justifyContent: collapsed ? "center" : "flex-start",
            borderColor: "rgba(250,247,240,0.08)" }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "#B8801F",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
            </svg>
          </div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: "#FAF7F0", fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>LanfiaLink</p>
              <p style={{ color: "rgba(250,247,240,0.35)", fontSize: 10, marginTop: 2 }}>Admin Panel</p>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex items-center justify-center rounded-lg transition-colors"
            style={{ padding: "4px", background: "transparent", border: "none", cursor: "pointer",
              color: "rgba(250,247,240,0.3)", flexShrink: 0 }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(250,247,240,0.08)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}>
            <Menu size={14} />
          </button>
        </div>

        {/* Nav */}
        <nav className="relative z-10 flex-1 overflow-y-auto p-2" style={{ scrollbarWidth: "thin",
          scrollbarColor: "rgba(250,247,240,0.15) transparent" }}>
          <SectionLabel label="Principal" collapsed={collapsed} />
          {bySection("main").map((i) => <NavItem key={i.id} item={i} collapsed={collapsed} />)}
          <SectionLabel label="Opérations" collapsed={collapsed} />
          {bySection("ops").map((i) => <NavItem key={i.id} item={i} collapsed={collapsed} />)}
          <SectionLabel label="Administration" collapsed={collapsed} />
          {bySection("admin").map((i) => <NavItem key={i.id} item={i} collapsed={collapsed} />)}
        </nav>

        {/* User */}
        <div className="relative z-10 p-2.5" style={{ borderTop: "0.5px solid rgba(250,247,240,0.08)" }}>
          <div className="flex items-center rounded-lg p-2" style={{ gap: collapsed ? 0 : 8,
            justifyContent: collapsed ? "center" : "flex-start",
            background: "rgba(250,247,240,0.05)" }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "#B8801F",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#FAF7F0", fontSize: 10, fontWeight: 600, flexShrink: 0 }}>
              {getInitials()}
            </div>
            {!collapsed && (
              <>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: "#FAF7F0", fontSize: 11, fontWeight: 600, overflow: "hidden",
                    textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getDisplayName()}</p>
                  <p style={{ color: "rgba(250,247,240,0.4)", fontSize: 10, marginTop: 1 }}>{getRole()}</p>
                </div>
                <button onClick={handleLogout} title="Déconnexion"
                  className="rounded-lg transition-colors"
                  style={{ padding: 5, background: "transparent", border: "none", cursor: "pointer",
                    color: "rgba(250,247,240,0.3)", flexShrink: 0 }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(250,247,240,0.1)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}>
                  <LogOut size={13} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      <div style={{ height: 3, background: "repeating-linear-gradient(90deg,#E8C050 0,#E8C050 10px,#B8801F 10px,#B8801F 20px,#8B2020 20px,#8B2020 30px,#E8C050 30px,#E8C050 40px)", flexShrink: 0 }} />
    </>
  );

  /* ─── Stat card ──────────────────────────────────────────── */
  const StatCard = ({ stat, index }: { stat: StatItem; index: number }) => {
    const Icon = iconComponents[stat.icon] ?? CheckCircle;
    const up = stat.change.startsWith("+");
    const down = stat.change.startsWith("-");
    const p = statPalettes[index % 4];
    return (
      <div className="rounded-2xl p-4 flex flex-col gap-3"
        style={{ background: "#fff", border: "0.5px solid #E8E0D4" }}>
        <div className="flex items-start justify-between">
          <div style={{ width: 34, height: 34, borderRadius: 8, background: p.bg,
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon size={16} style={{ color: p.icon }} />
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold"
            style={{ background: p.badge, color: p.badgeText }}>
            {up ? <TrendingUp size={11} /> : down ? <TrendingDown size={11} /> : <Minus size={11} />}
            {stat.change}
          </div>
        </div>
        <div>
          <p className="text-xl font-bold" style={{ color: "#1C1008" }}>{stat.value}</p>
          <p className="text-xs mt-0.5" style={{ color: "#8A7A62" }}>{stat.title}</p>
        </div>
      </div>
    );
  };

  /* ─── Dashboard content ──────────────────────────────────── */
  const DashboardContent = () => {
    const data = getCurrentData();
    const quickActions = [
      { icon: Plus,         label: "Nouveau distributeur", bg: "#1A3A28", perm: "distributeurs",  onClick: () => setActiveTab("points-vente") },
      { icon: Package,      label: "Gérer stock",          bg: "#B8801F", perm: "inventaire",     onClick: () => setActiveTab("stocks") },
      { icon: ShoppingCart, label: "Nouvelle commande",    bg: "#6B3A9E", perm: "commande",       onClick: () => setActiveTab("commandes") },
      { icon: BarChart3,    label: "Voir rapports",        bg: "#1A5C6B", perm: "analytique",     onClick: () => setActiveTab("statistiques") },
    ].filter((a) => userPermissions[a.perm as keyof typeof userPermissions]);

    return (
      <div className="space-y-4">
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl text-sm"
            style={{ background: "#FEF0EE", border: "0.5px solid #F5C4B3", color: "#8B2020" }}>
            <AlertTriangle size={16} className="flex-shrink-0" />{error}
          </div>
        )}

        {/* Welcome banner */}
        <div className="relative overflow-hidden rounded-2xl p-5"
          style={{ background: "#1A3A28" }}>
          {/* kente top */}
          <div className="absolute top-0 left-0 right-0" style={{ height: 3,
            background: "repeating-linear-gradient(90deg,#B8801F 0,#B8801F 12px,#E8C050 12px,#E8C050 24px,#8B2020 24px,#8B2020 36px,#E8C050 36px,#E8C050 48px)" }} />
          {/* adinkra corner */}
          <svg aria-hidden className="absolute right-0 top-0 w-36 h-36 pointer-events-none"
            viewBox="0 0 144 144" style={{ opacity: 0.07 }} xmlns="http://www.w3.org/2000/svg">
            <circle cx="144" cy="0" r="100" fill="none" stroke="#FAF7F0" strokeWidth="1.5" />
            <circle cx="144" cy="0" r="65"  fill="none" stroke="#FAF7F0" strokeWidth="1"   />
            <circle cx="144" cy="0" r="32"  fill="none" stroke="#FAF7F0" strokeWidth="0.8" />
            <line x1="144" y1="0" x2="0" y2="144" stroke="#FAF7F0" strokeWidth="0.7" />
            <line x1="144" y1="0" x2="40" y2="144" stroke="#FAF7F0" strokeWidth="0.5" />
          </svg>
          <div className="relative flex items-start justify-between gap-4 pt-1">
            <div>
              <p style={{ color: "rgba(250,247,240,0.45)", fontSize: 11, marginBottom: 4 }}>Bienvenue de retour</p>
              <h1 style={{ color: "#FAF7F0", fontSize: 18, fontWeight: 700 }}>{getDisplayName()} 👋</h1>
              <p style={{ color: "rgba(250,247,240,0.45)", fontSize: 11, marginTop: 4 }}>
                {selectedPOS?.pos_name === "Total Général"
                  ? "Vue d'ensemble de toute votre activité"
                  : `Point de vente : ${selectedPOS?.pos_name}`}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  { icon: <UserRound size={11} />, label: getRole() },
                  { icon: <MapPin size={11} />,    label: getLocation() },
                  ...(userPermissions.distributeurs
                    ? [{ icon: <Package size={11} />, label: `${getPOS().length} distributeur(s)` }]
                    : []),
                ].map((t, i) => (
                  <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                    style={{ background: "rgba(250,247,240,0.1)", color: "rgba(250,247,240,0.75)" }}>
                    {t.icon}{t.label}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: "#B8801F", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#FAF7F0", fontSize: 16, fontWeight: 700 }}>
              {getInitials()}
            </div>
          </div>
        </div>

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
                className="p-4 rounded-2xl flex flex-col items-start gap-2.5 transition-all duration-150 hover:opacity-85 active:scale-95"
                style={{ background: a.bg, border: "none", cursor: "pointer", textAlign: "left" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(250,247,240,0.18)",
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <a.icon size={16} color="#FAF7F0" />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#FAF7F0", lineHeight: 1.3 }}>{a.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Bottom panels */}
        <div className="grid lg:grid-cols-2 gap-3">
          {/* Activities */}
          <div className="rounded-2xl p-4" style={{ background: "#fff", border: "0.5px solid #E8E0D4" }}>
            <div className="flex items-center justify-between mb-4 pb-3"
              style={{ borderBottom: "0.5px solid #E8E0D4" }}>
              <div className="flex items-center gap-2">
                <Activity size={13} style={{ color: "#8A7A62" }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "#1C1008" }}>Activités récentes</span>
              </div>
              <button className="flex items-center gap-1 text-xs transition-colors"
                style={{ color: "#1A3A28", background: "none", border: "none", cursor: "pointer" }}>
                Tout voir <ChevronRight size={11} />
              </button>
            </div>
            <div className="space-y-1">
              {data.recent_activities.length > 0 ? data.recent_activities.map((a, i) => {
                const Icon = iconComponents[a.icon] ?? CheckCircle;
                return (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
                    style={{ cursor: "default" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#F5F3EE")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: "#EAF2EC",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={13} style={{ color: "#1A3A28" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: "#1C1008",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.action}</p>
                      <p style={{ fontSize: 10, color: "#8A7A62", overflow: "hidden",
                        textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.user}</p>
                    </div>
                    <span style={{ fontSize: 10, color: "#8A7A62", flexShrink: 0,
                      display: "flex", alignItems: "center", gap: 3 }}>
                      <Clock size={10} />{a.time}
                    </span>
                  </div>
                );
              }) : (
                <div className="py-8 text-center">
                  <Activity size={28} style={{ color: "#D4C4A0", margin: "0 auto 8px" }} />
                  <p style={{ fontSize: 12, color: "#8A7A62" }}>Aucune activité récente</p>
                </div>
              )}
            </div>
          </div>

          {/* Alerts */}
          <div className="rounded-2xl p-4" style={{ background: "#fff", border: "0.5px solid #E8E0D4" }}>
            <div className="flex items-center justify-between mb-4 pb-3"
              style={{ borderBottom: "0.5px solid #E8E0D4" }}>
              <div className="flex items-center gap-2">
                <Bell size={13} style={{ color: "#8A7A62" }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "#1C1008" }}>Alertes importantes</span>
              </div>
              <button style={{ fontSize: 11, color: "#1A3A28", background: "none", border: "none", cursor: "pointer" }}>
                Tout lire
              </button>
            </div>
            <div className="space-y-2">
              {data.alerts.length > 0 ? data.alerts.map((a, i) => {
                const Icon = iconComponents[a.icon] ?? AlertTriangle;
                const styles = {
                  high:   { bar: "#8B2020", bg: "#FEF0EE", icon: "#8B2020", badge: "#FBDADA", badgeText: "#8B2020", label: "Urgent"  },
                  medium: { bar: "#B8801F", bg: "#FDF3E0", icon: "#B8801F", badge: "#FDE8C0", badgeText: "#B8801F", label: "Moyen"   },
                  low:    { bar: "#1A3A28", bg: "#EAF2EC", icon: "#1A3A28", badge: "#D0E8D4", badgeText: "#1A3A28", label: "Info"    },
                }[a.priority];
                return (
                  <div key={i} className="flex gap-3 items-start rounded-xl p-3 relative overflow-hidden"
                    style={{ background: styles.bg }}>
                    <div className="absolute left-0 top-0 bottom-0" style={{ width: 3, background: styles.bar }} />
                    <Icon size={14} style={{ color: styles.icon, flexShrink: 0, marginTop: 1 }} />
                    <div style={{ flex: 1, minWidth: 0, paddingLeft: 2 }}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#1C1008" }}>{a.type}</span>
                        <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, fontWeight: 600,
                          background: styles.badge, color: styles.badgeText }}>{styles.label}</span>
                      </div>
                      <p style={{ fontSize: 10, color: "#5C4A2A", lineHeight: 1.5 }}>{a.message}</p>
                    </div>
                  </div>
                );
              }) : (
                <div className="py-8 text-center">
                  <CheckCircle size={28} style={{ color: "#A8D4B0", margin: "0 auto 8px" }} />
                  <p style={{ fontSize: 12, color: "#8A7A62" }}>Aucune alerte pour le moment</p>
                </div>
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
        <div className="rounded-2xl p-12 text-center" style={{ background: "#fff", border: "0.5px solid #E8E0D4" }}>
          <AlertTriangle size={28} style={{ color: "#D4C4A0", margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1C1008", marginBottom: 8 }}>Accès non autorisé</h3>
          <p style={{ fontSize: 12, color: "#8A7A62", marginBottom: 20 }}>Vous n'avez pas la permission d'accéder à cette section.</p>
          <button onClick={() => setActiveTab("dashboard")}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            style={{ background: "#1A3A28", color: "#FAF7F0", border: "none", cursor: "pointer" }}>
            Retour au tableau de bord
          </button>
        </div>
      );
    }
    switch (activeTab) {
      case "dashboard":          return <DashboardContent />;
      case "points-vente":       return userPermissions.distributeurs       ? React.createElement(PointsVenteManagement as any,    { selectedPOS }) : null;
      case "stocks":             return userPermissions.inventaire           ? React.createElement(StockManagement as any,           { selectedPOS }) : null;
      case "commandes":          return userPermissions.commande             ? React.createElement(OrderManagement as any,           { selectedPOS }) : null;
      case "vendeurs-ambulants": return userPermissions.commerciaux          ? React.createElement(MobileVendorsManagement as any,   { selectedPOS }) : null;
      case "statistiques":       return userPermissions.analytique           ? <StatisticsDashboard /> : null;
      case "utilisateurs":       return userPermissions.utilisateur          ? React.createElement(UserManagement as any) : null;
      case "parametres":         return userPermissions.configuration        ? <ParametresManagement /> : null;
      case "cartes":             return userPermissions.geolocalisation       ? <MapComponent /> : null;
      case "Pushcart":           return userPermissions.prospects            ? <PushcartManagement /> : null;
      case "positions":          return userPermissions.positions            ? <LocalisationManagement /> : null;
      case "points-ventes":      return userPermissions.dashboard_analytique ? <LanfiaLinkDashboard /> : null;
      default: return null;
    }
  };

  /* ─── Loading screen ─────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F5F3EE" }}>
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div style={{ width: 60, height: 60, borderRadius: 14, background: "#1A3A28",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#FAF7F0", fontWeight: 700, fontSize: 18 }}>LL</span>
            </div>
            <div style={{ position: "absolute", inset: -4, border: "2px solid rgba(26,58,40,0.2)",
              borderRadius: 18, animation: "ping 1.2s ease-in-out infinite" }} />
          </div>
          <div className="text-center">
            <p style={{ color: "#1C1008", fontWeight: 600, fontSize: 14 }}>Chargement en cours</p>
            <p style={{ color: "#8A7A62", fontSize: 12, marginTop: 4 }}>LanfiaLink Admin</p>
          </div>
        </div>
        <style>{`@keyframes ping{0%,100%{opacity:0.4;transform:scale(1)}50%{opacity:0.9;transform:scale(1.08)}}`}</style>
      </div>
    );
  }

  const collapsed = !sidebarOpen;

  return (
    <div className="min-h-screen" style={{ background: "#F5F3EE", fontFamily: "inherit" }}>

      {/* ── Mobile header ───────────────────────────────────── */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-50"
        style={{ background: "#fff", borderBottom: "0.5px solid #E8E0D4" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileMenuOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <Menu size={20} style={{ color: "#5C4A2A" }} />
          </button>
          <div className="flex items-center gap-2">
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "#1A3A28",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#FAF7F0", fontWeight: 700, fontSize: 11 }}>LL</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 14, color: "#1C1008" }}>LanfiaLink</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative" style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}>
            <Bell size={18} style={{ color: "#5C4A2A" }} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center font-bold"
                style={{ background: "#8B2020", color: "#FAF7F0", fontSize: 9 }}>{unreadCount}</span>
            )}
          </button>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "#1A3A28",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#FAF7F0", fontSize: 11, fontWeight: 700 }}>{getInitials()}</div>
        </div>
      </div>

      {/* ── Mobile sidebar overlay ───────────────────────────── */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.45)" }}
            onClick={() => setMobileMenuOpen(false)} />
          <div className="relative flex flex-col" style={{ width: 240, background: "#1A3A28", height: "100%" }}>
            <div className="flex items-center justify-between px-4 py-4"
              style={{ borderBottom: "0.5px solid rgba(250,247,240,0.08)" }}>
              <div className="flex items-center gap-2.5">
                <div style={{ width: 30, height: 30, borderRadius: 8, background: "#B8801F",
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                  </svg>
                </div>
                <div>
                  <p style={{ color: "#FAF7F0", fontSize: 13, fontWeight: 700 }}>LanfiaLink</p>
                  <p style={{ color: "rgba(250,247,240,0.35)", fontSize: 10 }}>Admin Panel</p>
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(250,247,240,0.4)", padding: 4 }}>
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
        style={{ width: collapsed ? 60 : 210, background: "#1A3A28" }}>
        <SidebarContent collapsed={collapsed} />
      </aside>

      {/* ── Main ─────────────────────────────────────────────── */}
      <div className="transition-all duration-300"
        style={{ marginLeft: 0, paddingTop: 0 }}
        /* Tailwind can't do dynamic lg:ml, use inline style per breakpoint via JS */ >
        <div className="hidden lg:block" style={{ marginLeft: collapsed ? 60 : 210 }}>
          {/* Top bar */}
          <header className="flex items-center justify-between px-6 sticky top-0 z-30"
            style={{ height: 56, background: "#fff", borderBottom: "0.5px solid #E8E0D4" }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1C1008" }}>
                {menuItems.find((i) => i.id === activeTab)?.label ?? "Tableau de bord"}
              </p>
              <p style={{ fontSize: 11, color: "#8A7A62", marginTop: 1 }}>
                {activeTab === "dashboard"
                  ? "Vue d'ensemble de votre activité"
                  : `Gestion · ${menuItems.find((i) => i.id === activeTab)?.label}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* POS selector */}
              {userPermissions.distributeurs && (
                <div className="relative">
                  <button onClick={() => setPosDropdownOpen(!posDropdownOpen)}
                    className="flex items-center gap-1.5 text-xs transition-colors"
                    style={{ padding: "6px 12px", border: "0.5px solid #D4C4A0", borderRadius: 8,
                      background: "#FAF7F0", color: "#5C4A2A", cursor: "pointer", fontFamily: "inherit" }}>
                    <MapPin size={12} style={{ color: "#B8801F" }} />
                    <span style={{ maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {selectedPOS?.pos_name ?? "Sélectionner"}
                    </span>
                    <ChevronsUpDown size={12} style={{ color: "#8A7A62" }} />
                  </button>
                  {posDropdownOpen && (
                    <div className="absolute right-0 mt-1.5 rounded-2xl overflow-hidden z-20"
                      style={{ width: 220, background: "#fff", border: "0.5px solid #E8E0D4",
                        boxShadow: "0 8px 24px rgba(26,58,40,0.12)" }}>
                      <div className="p-1.5 max-h-56 overflow-y-auto">
                        {[dashboardData.cumulative, ...dashboardData.pos_data].map((p) => (
                          <button key={p.pos_id ?? "cum"} onClick={() => { setSelectedPOS(p); setPosDropdownOpen(false); }}
                            className="w-full text-left flex items-center gap-2 text-xs rounded-xl transition-colors"
                            style={{ padding: "8px 10px",
                              background: selectedPOS?.pos_id === p.pos_id ? "#EAF2EC" : "transparent",
                              color: selectedPOS?.pos_id === p.pos_id ? "#1A3A28" : "#5C4A2A",
                              fontWeight: selectedPOS?.pos_id === p.pos_id ? 600 : 400,
                              border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                            <MapPin size={11} style={{ color: selectedPOS?.pos_id === p.pos_id ? "#1A3A28" : "#D4C4A0" }} />
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
                style={{ height: 34, border: "0.5px solid #D4C4A0", borderRadius: 8, background: "#FAF7F0" }}>
                <Search size={13} style={{ color: "#8A7A62" }} />
                <input type="text" placeholder="Rechercher…"
                  style={{ border: "none", background: "transparent", fontSize: 12, width: 140,
                    color: "#1C1008", outline: "none", fontFamily: "inherit" }} />
              </div>

              {/* Notifications */}
              <div className="relative">
                <button onClick={() => setNotificationsOpen(!notificationsOpen)}
                  style={{ width: 34, height: 34, borderRadius: 8, border: "0.5px solid #D4C4A0",
                    background: "#FAF7F0", display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", position: "relative" }}>
                  <Bell size={15} style={{ color: "#5C4A2A" }} />
                  {unreadCount > 0 && (
                    <span style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8,
                      borderRadius: "50%", background: "#8B2020", border: "1.5px solid #FAF7F0" }} />
                  )}
                </button>
                {notificationsOpen && (
                  <div className="absolute right-0 mt-1.5 rounded-2xl overflow-hidden z-20"
                    style={{ width: 300, background: "#fff", border: "0.5px solid #E8E0D4",
                      boxShadow: "0 8px 24px rgba(26,58,40,0.12)" }}>
                    <div className="flex items-center justify-between px-4 py-3"
                      style={{ borderBottom: "0.5px solid #E8E0D4" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#1C1008" }}>Notifications</span>
                      <button style={{ fontSize: 11, color: "#1A3A28", background: "none",
                        border: "none", cursor: "pointer" }}>Tout lire</button>
                    </div>
                    <div style={{ maxHeight: 300, overflowY: "auto" }}>
                      {notifications.length > 0 ? notifications.map((n) => (
                        <div key={n.id} className="px-4 py-3"
                          style={{ borderBottom: "0.5px solid #F5F3EE",
                            background: n.is_read ? "transparent" : "rgba(26,58,40,0.03)" }}>
                          <div className="flex justify-between gap-2 mb-0.5">
                            <span style={{ fontSize: 11, fontWeight: 600, color: "#1C1008" }}>{n.type}</span>
                            <span style={{ fontSize: 10, color: "#8A7A62", flexShrink: 0,
                              display: "flex", alignItems: "center", gap: 3 }}>
                              <Clock size={10} />{formatAgo(new Date(n.created_at))}
                            </span>
                          </div>
                          <p style={{ fontSize: 11, color: "#5C4A2A", lineHeight: 1.5 }}>{n.message}</p>
                          {!n.is_read && (
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#1A3A28", marginTop: 6 }} />
                          )}
                        </div>
                      )) : (
                        <div className="py-8 text-center">
                          <p style={{ fontSize: 12, color: "#8A7A62" }}>Aucune notification</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User */}
              <div className="flex items-center gap-2.5 pl-3" style={{ borderLeft: "0.5px solid #E8E0D4" }}>
                <div className="text-right hidden sm:block">
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#1C1008" }}>{getDisplayName()}</p>
                  <p style={{ fontSize: 10, color: "#8A7A62", marginTop: 1 }}>{getRole()}</p>
                </div>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: "#1A3A28",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#FAF7F0", fontSize: 11, fontWeight: 700 }}>{getInitials()}</div>
                <button onClick={handleLogout} title="Déconnexion"
                  style={{ padding: 5, background: "none", border: "none", cursor: "pointer", borderRadius: 6 }}>
                  <LogOut size={14} style={{ color: "#8A7A62" }} />
                </button>
              </div>
            </div>
          </header>

          {/* Kente accent under topbar */}
          <div style={{ height: 2, background: "repeating-linear-gradient(90deg,#1A3A28 0,#1A3A28 20px,#B8801F 20px,#B8801F 32px,#E8C050 32px,#E8C050 44px,#1A3A28 44px,#1A3A28 56px)" }} />

          <main className="p-5 max-w-screen-2xl mx-auto">{renderContent()}</main>
        </div>

        {/* Mobile main */}
        <div className="lg:hidden pt-2 px-4 pb-6">{renderContent()}</div>
      </div>

      {/* Mobile notifications panel */}
      {notificationsOpen && (
        <div className="lg:hidden fixed inset-0 z-50" onClick={() => setNotificationsOpen(false)}>
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.4)" }} />
          <div className="absolute right-0 top-0 h-full flex flex-col"
            style={{ width: 300, background: "#fff" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-4"
              style={{ borderBottom: "0.5px solid #E8E0D4" }}>
              <span style={{ fontWeight: 600, color: "#1C1008" }}>Notifications</span>
              <button onClick={() => setNotificationsOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                <X size={16} style={{ color: "#5C4A2A" }} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {notifications.map((n) => (
                <div key={n.id} className="px-4 py-3"
                  style={{ borderBottom: "0.5px solid #F5F3EE",
                    background: n.is_read ? "transparent" : "rgba(26,58,40,0.03)" }}>
                  <div className="flex justify-between gap-2 mb-0.5">
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#1C1008" }}>{n.type}</span>
                    <span style={{ fontSize: 10, color: "#8A7A62" }}>{formatAgo(new Date(n.created_at))}</span>
                  </div>
                  <p style={{ fontSize: 11, color: "#5C4A2A", lineHeight: 1.5 }}>{n.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;