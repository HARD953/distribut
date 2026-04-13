"use client";
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, Filter, Download, User, Store, AlertCircle, ShoppingBag, Users, MapPin, Calendar, CreditCard, DollarSign } from 'lucide-react';
import { apiService } from './ApiService';
import 'leaflet/dist/leaflet.css';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SaleDetail {
  product: string;
  variant_id: number;
  variant_name: string;
  format: string;
  price: number;
  quantity: number;
  amount: number;
  date: string;
}

export interface MapCustomer {
  id: number;
  full_name: string;
  phone: string;
  zone: string;
  base: string;
  pushcard_type: string;
  latitude: number | null;
  longitude: number | null;
  purchase_date: string;
  photo_url: string;
  total_sales_amount: number;
  total_quantity: number;
  sales_count: number;
  sales_details: SaleDetail[];
  vendor_id: number;
  vendor_name: string;
  point_of_sale: string;
}

export interface VendorInfo {
  vendor_id: number;
  vendor_name: string;
  point_of_sale: string;
  total_customers: number;
  total_sales: number;
  total_quantity: number;
}

export interface PeriodInfo {
  start_date: string;
  end_date: string;
  period_type: string;
}

export interface MapResponse {
  period: PeriodInfo;
  user_points_of_sale: string[];
  vendors_summary: VendorInfo[];
  customers: MapCustomer[];
  total_customers: number;
  grand_total_sales: number;
  grand_total_quantity: number;
  total_vendors: number;
}

export interface PointOfSale {
  id: number;
  name: string;
  owner: string;
  type: string;
  type_display: string;
  status: string;
  status_display: string;
  phone: string;
  email: string;
  address: string;
  district: string;
  region: string;
  commune: string;
  latitude: number | null;
  longitude: number | null;
  avatar_url: string;
  turnover: number;
  monthly_orders: number;
  evaluation_score: number;
  registration_date: string;
  orders_summary: {
    total_orders: number;
    total_revenue: number;
    total_items: number;
  };
}

export interface PointsOfSaleResponse {
  period: { start_date: string; end_date: string };
  points_of_sale: PointOfSale[];
}

interface MapFilters {
  start_date: string;
  end_date: string;
  zone: string;
  pushcard_type: string;
}

type ViewType = 'customers' | 'points-of-sale' | 'both';

// ─── Palette (identique Login) ────────────────────────────────────────────────
const P = {
  forest:    '#2D5A3D',   // vert forêt  — dominante
  forestHov: '#3E7A54',   // vert survol
  ochre:     '#C07A2F',   // ocre doré   — accent
  ochreDark: '#9A5E1A',   // ocre foncé
  gold:      '#F0C878',   // or pâle     — highlight
  goldMid:   '#D4A843',   // or moyen
  cream:     '#FAF7F0',   // crème ivoire — fond
  sand:      '#F2EDE0',   // sable chaud  — surfaces
  border:    '#E8D9B8',   // bordure sable
  borderMid: '#D4C4A0',   // bordure mid
  text:      '#2A1A08',   // texte principal
  muted:     '#A89880',   // texte muted
  subtle:    '#7A6A52',   // labels uppercase
  errorBg:   '#FFF3E8',   // fond erreur
  errorBrd:  '#E8C090',   // bordure erreur
  greenBg:   '#EAF2EC',   // puce sécurité
};

// ─── Dynamic Leaflet imports ──────────────────────────────────────────────────

const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

// ─── Component ───────────────────────────────────────────────────────────────

const MapComponent = () => {
  const [mapData, setMapData] = useState<MapResponse | null>(null);
  const [pointsOfSale, setPointsOfSale] = useState<PointOfSale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MapFilters>({
    start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    zone: '',
    pushcard_type: '',
  });
  const [viewType, setViewType] = useState<ViewType>('both');
  const [isMounted, setIsMounted] = useState(false);

  const defaultCenter: [number, number] = [5.3599517, -4.0082563];
  const defaultZoom = 12;

  useEffect(() => { setIsMounted(true); }, []);
  useEffect(() => { fetchMapData(); }, []);

  const getIcons = () => {
    if (typeof window === 'undefined') return { customerIcon: null, posIcon: null };
    const L = require('leaflet');
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
    return {
      customerIcon: new L.Icon({
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
      }),
      posIcon: new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
      }),
    };
  };

  const fetchMapData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.zone) params.append('zone', filters.zone);
      if (filters.pushcard_type) params.append('pushcard_type', filters.pushcard_type);

      const response = await apiService.get(`/carte/?${params.toString()}`);
      if (!response.ok) throw new Error(`Erreur carte: ${response.status}`);
      const data: MapResponse = await response.json();
      setMapData(data);

      const posParams = new URLSearchParams();
      if (filters.start_date) posParams.append('start_date', filters.start_date);
      if (filters.end_date) posParams.append('end_date', filters.end_date);

      const posResponse = await apiService.get(`/pointsaleorders/?${posParams.toString()}`);
      if (!posResponse.ok) throw new Error(`Erreur points de vente: ${posResponse.status}`);
      const posData: PointsOfSaleResponse = await posResponse.json();
      setPointsOfSale(posData.points_of_sale || []);
    } catch (err) {
      console.error('Error fetching map data:', err);
      setError('Erreur lors du chargement des données de la carte.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: keyof MapFilters, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const exportData = () => {
    let csvContent = '';
    if (viewType !== 'points-of-sale' && mapData) {
      const headers = 'Nom, Téléphone, Zone, Base, Type de carte, Vendeur, Point de vente, Montant total, Quantité totale, Nombre de ventes\n';
      csvContent += mapData.customers.reduce((acc, c) =>
        acc + `"${c.full_name}","${c.phone}","${c.zone}","${c.base}","${c.pushcard_type}","${c.vendor_name}","${c.point_of_sale}",${c.total_sales_amount},${c.total_quantity},${c.sales_count}\n`,
        headers);
    }
    if (viewType !== 'customers') {
      const headers = "Nom, Propriétaire, Type, Statut, Téléphone, Adresse, Chiffre d'affaires, Commandes mensuelles\n";
      csvContent += pointsOfSale.reduce((acc, p) =>
        acc + `"${p.name}","${p.owner}","${p.type_display}","${p.status_display}","${p.phone}","${p.address}",${p.turnover},${p.monthly_orders}\n`,
        headers);
    }
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `donnees_carte_${filters.start_date}_${filters.end_date}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isValidCoordinate = (lat: number | null, lng: number | null) =>
    lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng) &&
    lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

  const validCustomers = mapData?.customers.filter((c) =>
    isValidCoordinate(c.latitude, c.longitude)) || [];
  const validPointsOfSale = pointsOfSale.filter((p) =>
    isValidCoordinate(p.latitude, p.longitude));

  const totalCustomerSales = mapData?.grand_total_sales || 0;
  const totalPosRevenue = pointsOfSale.reduce((s, p) => s + p.turnover, 0);
  const totalOrders = pointsOfSale.reduce((s, p) => s + p.orders_summary.total_orders, 0);

  // ─── Styles partagés ────────────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 40,
    padding: '0 12px',
    background: P.sand,
    border: `1.5px solid ${P.borderMid}`,
    borderRadius: 10,
    color: P.text,
    fontSize: 13,
    fontFamily: 'inherit',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 10.5,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: P.subtle,
    marginBottom: 6,
  };

  const viewBtnStyle = (active: boolean, color: string): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontSize: 12.5,
    fontWeight: 600,
    fontFamily: 'inherit',
    background: active ? color : 'transparent',
    color: active ? 'white' : P.muted,
    transition: 'all .15s',
  });

  const statCardStyle = (bg: string): React.CSSProperties => ({
    background: bg,
    border: `1px solid ${P.border}`,
    borderRadius: 14,
    padding: '16px 20px',
  });

  // ─── Vendor summary ──────────────────────────────────────────────────────────

  const getVendorsSummary = () => {
    if (!mapData?.vendors_summary?.length) return null;

    const periodLine = (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Calendar size={15} style={{ color: P.ochre, flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: 10.5, fontWeight: 600, color: P.subtle, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Période</p>
          <p style={{ fontSize: 12.5, color: P.text }}>
            {new Date(mapData.period.start_date).toLocaleDateString()} – {new Date(mapData.period.end_date).toLocaleDateString()}
          </p>
        </div>
      </div>
    );

    if (mapData.vendors_summary.length === 1) {
      const v = mapData.vendors_summary[0];
      return (
        <div style={{ background: P.sand, border: `1px solid ${P.border}`, borderRadius: 14, padding: '14px 18px', marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={15} style={{ color: P.ochre }} />
              <div>
                <p style={labelStyle}>Période</p>
                <p style={{ fontSize: 12.5, color: P.text }}>
                  {new Date(mapData.period.start_date).toLocaleDateString()} – {new Date(mapData.period.end_date).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={15} style={{ color: P.ochre }} />
              <div>
                <p style={labelStyle}>Vendeur</p>
                <p style={{ fontSize: 12.5, color: P.text }}>{v.vendor_name}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Store size={15} style={{ color: P.ochre }} />
              <div>
                <p style={labelStyle}>Point de vente</p>
                <p style={{ fontSize: 12.5, color: P.text }}>{v.point_of_sale}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={{ background: P.sand, border: `1px solid ${P.border}`, borderRadius: 14, padding: '14px 18px', marginBottom: 20 }}>
        {periodLine}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10 }}>
          {mapData.vendors_summary.map((v) => (
            <div key={v.vendor_id} style={{ background: P.cream, border: `1px solid ${P.border}`, borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <User size={13} style={{ color: P.ochre }} />
                <p style={{ fontSize: 12.5, fontWeight: 600, color: P.text }}>{v.vendor_name}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Store size={13} style={{ color: P.muted }} />
                <p style={{ fontSize: 11.5, color: P.muted }}>{v.point_of_sale}</p>
              </div>
              <p style={{ fontSize: 11, color: P.subtle }}>
                {v.total_customers} client(s) · {v.total_sales.toLocaleString()} FCFA
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: 'inherit' }}>

      {/* Card principale */}
      <div style={{ background: P.cream, borderRadius: 18, border: `1px solid ${P.border}`, padding: '28px 28px 32px', boxShadow: '0 1px 4px rgba(45,90,61,.06)' }}>

        {/* Kente top band */}
        <div style={{ height: 3, borderRadius: '12px 12px 0 0', marginBottom: 20, marginLeft: -28, marginRight: -28, marginTop: -28, background: `linear-gradient(90deg,${P.ochreDark} 0%,${P.goldMid} 25%,${P.ochreDark} 50%,${P.goldMid} 75%,${P.ochreDark} 100%)` }} />

        {/* Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: P.text, margin: 0 }}>
              Carte des Ventes &amp; Points de Vente
            </h2>
            <p style={{ fontSize: 12.5, color: P.muted, marginTop: 4 }}>
              Visualisation géographique · Côte d'Ivoire
            </p>
          </div>

          {/* Boutons de vue + export */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            {/* Sélecteur de vue */}
            <div style={{ display: 'flex', background: P.sand, border: `1px solid ${P.border}`, borderRadius: 10, padding: 3, gap: 2 }}>
              <button style={viewBtnStyle(viewType === 'customers', P.forest)} onClick={() => setViewType('customers')}>
                <Users size={13} />Clients
              </button>
              <button style={viewBtnStyle(viewType === 'points-of-sale', P.ochre)} onClick={() => setViewType('points-of-sale')}>
                <Store size={13} />Points de vente
              </button>
              <button
                style={viewBtnStyle(viewType === 'both', '#6B4C9A')}
                onClick={() => setViewType('both')}
              >
                <ShoppingBag size={13} />Les deux
              </button>
            </div>

            {/* Export */}
            <button
              onClick={exportData}
              disabled={
                (viewType === 'customers' && (!mapData || !mapData.customers.length)) ||
                (viewType === 'points-of-sale' && !pointsOfSale.length) ||
                (viewType === 'both' && (!mapData || !mapData.customers.length) && !pointsOfSale.length)
              }
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 10, border: 'none',
                background: P.forest, color: 'white',
                fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'background .15s',
                opacity: isLoading ? 0.5 : 1,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = P.forestHov; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = P.forest; }}
            >
              <Download size={14} />Exporter
            </button>
          </div>
        </div>

        {/* Vendor summary */}
        {mapData && getVendorsSummary()}

        {/* Accent bar */}
        <div style={{ width: 36, height: 2.5, borderRadius: 99, background: P.ochre, marginBottom: 20 }} />

        {/* Filtres */}
        <div style={{ background: P.sand, border: `1px solid ${P.border}`, borderRadius: 14, padding: '16px 20px', marginBottom: 20 }}>
          <p style={{ ...labelStyle, marginBottom: 14 }}>Filtres</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 14 }}>
            <div>
              <label style={labelStyle}>Date de début</label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Date de fin</label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Zone</label>
              <input
                type="text"
                value={filters.zone}
                onChange={(e) => handleFilterChange('zone', e.target.value)}
                placeholder="ex: Plateau"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Type de carte</label>
              <select
                value={filters.pushcard_type}
                onChange={(e) => handleFilterChange('pushcard_type', e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="">Tous les types</option>
                <option value="pushcard">Pushcard</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
            <button
              onClick={fetchMapData}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 18px', borderRadius: 10, border: 'none',
                background: P.forest, color: 'white',
                fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'background .15s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = P.forestHov; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = P.forest; }}
            >
              <Filter size={14} />Appliquer les filtres
            </button>
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', background: P.errorBg, border: `1px solid ${P.errorBrd}`, borderRadius: 12, marginBottom: 20 }}>
            <AlertCircle size={15} style={{ color: P.ochreDark, marginTop: 1, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 12.5, fontWeight: 600, color: P.ochreDark }}>Authentification échouée</p>
              <p style={{ fontSize: 12, color: '#7A5230', marginTop: 2 }}>{error}</p>
            </div>
          </div>
        )}

        {/* Chargement */}
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 384, background: P.sand, borderRadius: 14, border: `1px solid ${P.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Loader2 style={{ color: P.forest }} size={22} className="animate-spin" />
              <span style={{ fontSize: 13.5, color: P.muted }}>Chargement des données cartographiques…</span>
            </div>
          </div>
        ) : (
          <>
            {/* Avertissement coordonnées manquantes */}
            {(
              ((viewType === 'customers' || viewType === 'both') && mapData && mapData.customers.length > validCustomers.length) ||
              ((viewType === 'points-of-sale' || viewType === 'both') && pointsOfSale.length > validPointsOfSale.length)
            ) && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', background: '#FFF8EC', border: `1px solid ${P.goldMid}`, borderRadius: 12, marginBottom: 16 }}>
                <AlertCircle size={14} style={{ color: P.ochre, marginTop: 1, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: P.ochreDark }}>Données incomplètes</p>
                  <p style={{ fontSize: 11.5, color: '#7A5230', marginTop: 1 }}>
                    {viewType !== 'points-of-sale' && mapData && `${mapData.customers.length - validCustomers.length} client(s) sans coordonnées valides`}
                    {viewType === 'both' && mapData && mapData.customers.length > validCustomers.length && pointsOfSale.length > validPointsOfSale.length && ' · '}
                    {(viewType === 'points-of-sale' || viewType === 'both') && `${pointsOfSale.length - validPointsOfSale.length} point(s) de vente sans coordonnées valides`}
                  </p>
                </div>
              </div>
            )}

            {/* Légende */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 12, fontSize: 12.5, color: P.muted }}>
              {(viewType === 'customers' || viewType === 'both') && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: P.forest, display: 'inline-block' }} />
                  Clients ({validCustomers.length})
                </span>
              )}
              {(viewType === 'points-of-sale' || viewType === 'both') && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: P.ochre, display: 'inline-block' }} />
                  Points de vente ({validPointsOfSale.length})
                </span>
              )}
            </div>

            {/* Carte Leaflet */}
            <div style={{ height: 420, borderRadius: 14, overflow: 'hidden', border: `1.5px solid ${P.borderMid}`, marginBottom: 24 }}>
              {isMounted && (
                <MapContainer center={defaultCenter} zoom={defaultZoom} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {/* Clients */}
                  {(viewType === 'customers' || viewType === 'both') && validCustomers.map((customer) => (
                    <Marker
                      key={`customer-${customer.id}`}
                      position={[customer.latitude as number, customer.longitude as number]}
                      icon={getIcons().customerIcon}
                    >
                      <Popup>
                        <div style={{ maxWidth: 260, fontFamily: 'inherit' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            {customer.photo_url ? (
                              <img src={customer.photo_url} alt={customer.full_name} style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }}
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                              <div style={{ width: 38, height: 38, borderRadius: '50%', background: P.greenBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <User size={18} style={{ color: P.forest }} />
                              </div>
                            )}
                            <div>
                              <p style={{ fontWeight: 700, color: P.forest, fontSize: 13 }}>{customer.full_name}</p>
                              <p style={{ fontSize: 11.5, color: P.muted }}>{customer.phone}</p>
                            </div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 12, color: P.text, marginBottom: 8 }}>
                            <span><b>Zone:</b> {customer.zone}</span>
                            <span><b>Base:</b> {customer.base}</span>
                            <span><b>Carte:</b> {customer.pushcard_type}</span>
                            <span><b>Vendeur:</b> {customer.vendor_name}</span>
                            <span style={{ gridColumn: '1 / -1' }}><b>Achat:</b> {new Date(customer.purchase_date).toLocaleDateString()}</span>
                          </div>
                          {customer.sales_details?.length > 0 && (
                            <div style={{ marginBottom: 8 }}>
                              <p style={{ fontSize: 11.5, fontWeight: 600, color: P.subtle, marginBottom: 4 }}>Détails des ventes</p>
                              <div style={{ maxHeight: 110, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {customer.sales_details.map((sale, i) => (
                                  <div key={i} style={{ background: P.sand, borderRadius: 6, padding: '4px 8px', fontSize: 11 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <b>{sale.product}</b><span>{sale.quantity}×</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: P.muted }}>
                                      <span>{sale.format}</span><span style={{ fontWeight: 600 }}>{sale.amount.toLocaleString()} FCFA</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div style={{ background: P.greenBg, borderRadius: 8, padding: '8px 10px' }}>
                            <p style={{ fontWeight: 700, color: P.forest, fontSize: 13 }}>{customer.total_sales_amount.toLocaleString()} FCFA</p>
                            <p style={{ fontSize: 11, color: P.muted, marginTop: 2 }}>{customer.total_quantity} article(s) · {customer.sales_count} achat(s)</p>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                  {/* Points de vente */}
                  {(viewType === 'points-of-sale' || viewType === 'both') && validPointsOfSale.map((pos) => (
                    <Marker
                      key={`pos-${pos.id}`}
                      position={[pos.latitude as number, pos.longitude as number]}
                      icon={getIcons().posIcon}
                    >
                      <Popup>
                        <div style={{ maxWidth: 260, fontFamily: 'inherit' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            {pos.avatar_url ? (
                              <img src={pos.avatar_url} alt={pos.name} style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }}
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                              <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#FFF3E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Store size={18} style={{ color: P.ochre }} />
                              </div>
                            )}
                            <div>
                              <p style={{ fontWeight: 700, color: P.ochre, fontSize: 13 }}>{pos.name}</p>
                              <p style={{ fontSize: 11.5, color: P.muted }}>{pos.owner}</p>
                            </div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 12, color: P.text, marginBottom: 8 }}>
                            <span><b>Type:</b> {pos.type_display}</span>
                            <span><b>Statut:</b> {pos.status_display}</span>
                            <span><b>Tél:</b> {pos.phone}</span>
                            <span><b>Inscription:</b> {new Date(pos.registration_date).toLocaleDateString()}</span>
                            <span style={{ gridColumn: '1 / -1' }}><b>Adresse:</b> {pos.address}</span>
                          </div>
                          <div style={{ background: '#FFF3E8', borderRadius: 8, padding: '8px 10px' }}>
                            <p style={{ fontWeight: 700, color: P.ochreDark, fontSize: 13 }}>{pos.turnover.toLocaleString()} FCFA</p>
                            <p style={{ fontSize: 11, color: P.muted, marginTop: 2 }}>{pos.monthly_orders} cmd(s)/mois · score {pos.evaluation_score}/5</p>
                            <p style={{ fontSize: 11, color: P.muted }}>{pos.orders_summary.total_orders} commande(s) · {pos.orders_summary.total_items} article(s)</p>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              )}
            </div>

            {/* Cartes de résumé */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16, marginBottom: 28 }}>
              {(viewType === 'customers' || viewType === 'both') && mapData && (
                <div style={statCardStyle(P.greenBg)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Users size={16} style={{ color: P.forest }} />
                    <p style={{ ...labelStyle, margin: 0 }}>Clients</p>
                  </div>
                  <p style={{ fontSize: 28, fontWeight: 700, color: P.forest, lineHeight: 1 }}>{mapData.total_customers}</p>
                  <p style={{ fontSize: 11.5, color: P.muted, marginTop: 4 }}>{validCustomers.length} avec coordonnées valides</p>
                  <div style={{ borderTop: `1px solid ${P.border}`, marginTop: 12, paddingTop: 10 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: P.forest }}>{totalCustomerSales.toLocaleString()} FCFA</p>
                    <p style={{ fontSize: 11.5, color: P.muted }}>Chiffre d'affaires total</p>
                  </div>
                  {(mapData.total_vendors ?? 0) > 0 && (
                    <p style={{ fontSize: 11, color: P.subtle, marginTop: 6 }}>{mapData.total_vendors} vendeur(s)</p>
                  )}
                </div>
              )}

              {(viewType === 'points-of-sale' || viewType === 'both') && (
                <div style={statCardStyle('#FFF8EC')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Store size={16} style={{ color: P.ochre }} />
                    <p style={{ ...labelStyle, margin: 0 }}>Points de vente</p>
                  </div>
                  <p style={{ fontSize: 28, fontWeight: 700, color: P.ochreDark, lineHeight: 1 }}>{pointsOfSale.length}</p>
                  <p style={{ fontSize: 11.5, color: P.muted, marginTop: 4 }}>{validPointsOfSale.length} avec coordonnées valides</p>
                  <div style={{ borderTop: `1px solid ${P.border}`, marginTop: 12, paddingTop: 10 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: P.ochreDark }}>{totalPosRevenue.toLocaleString()} FCFA</p>
                    <p style={{ fontSize: 11.5, color: P.muted }}>Chiffre d'affaires total</p>
                  </div>
                </div>
              )}

              <div style={statCardStyle(P.sand)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <ShoppingBag size={16} style={{ color: P.subtle }} />
                  <p style={{ ...labelStyle, margin: 0 }}>Commandes</p>
                </div>
                <p style={{ fontSize: 28, fontWeight: 700, color: P.text, lineHeight: 1 }}>{totalOrders}</p>
                <p style={{ fontSize: 11.5, color: P.muted, marginTop: 4 }}>Total des commandes</p>
                {viewType === 'both' && (
                  <div style={{ borderTop: `1px solid ${P.border}`, marginTop: 12, paddingTop: 10 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: P.text }}>{(totalCustomerSales + totalPosRevenue).toLocaleString()} FCFA</p>
                    <p style={{ fontSize: 11.5, color: P.muted }}>CA global</p>
                  </div>
                )}
              </div>
            </div>

            {/* Table clients */}
            {(viewType === 'customers' || viewType === 'both') && mapData && mapData.customers.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Users size={17} style={{ color: P.forest }} />
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: P.text, margin: 0 }}>Derniers clients</h3>
                </div>
                <div style={{ overflowX: 'auto', borderRadius: 12, border: `1px solid ${P.border}` }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                    <thead>
                      <tr style={{ background: P.sand }}>
                        {['Client', 'Téléphone', 'Zone', 'Vendeur', 'Type de carte', 'Coordonnées', 'Montant'].map((h) => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: P.subtle, borderBottom: `1px solid ${P.border}` }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {mapData.customers.slice(0, 5).map((c) => {
                        const valid = isValidCoordinate(c.latitude, c.longitude);
                        return (
                          <tr key={c.id} style={{ borderBottom: `1px solid ${P.border}` }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = P.sand; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                            <td style={{ padding: '10px 14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {c.photo_url
                                  ? <img src={c.photo_url} alt={c.full_name} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                  : <div style={{ width: 28, height: 28, borderRadius: '50%', background: P.greenBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={13} style={{ color: P.forest }} /></div>
                                }
                                <span style={{ fontWeight: 600, color: P.text }}>{c.full_name}</span>
                              </div>
                            </td>
                            <td style={{ padding: '10px 14px', color: P.muted }}>{c.phone}</td>
                            <td style={{ padding: '10px 14px', color: P.muted }}>{c.zone}</td>
                            <td style={{ padding: '10px 14px', color: P.muted }}>{c.vendor_name}</td>
                            <td style={{ padding: '10px 14px', color: P.muted }}>{c.pushcard_type}</td>
                            <td style={{ padding: '10px 14px' }}>
                              {valid
                                ? <span style={{ fontSize: 11, fontWeight: 600, color: P.forest, background: P.greenBg, padding: '2px 8px', borderRadius: 99 }}>Valides</span>
                                : <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: P.ochreDark, background: P.errorBg, padding: '2px 8px', borderRadius: 99 }}><AlertCircle size={11} />Manquantes</span>
                              }
                            </td>
                            <td style={{ padding: '10px 14px', fontWeight: 700, color: P.text }}>{c.total_sales_amount.toLocaleString()} FCFA</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Table points de vente */}
            {(viewType === 'points-of-sale' || viewType === 'both') && pointsOfSale.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Store size={17} style={{ color: P.ochre }} />
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: P.text, margin: 0 }}>Points de vente</h3>
                </div>
                <div style={{ overflowX: 'auto', borderRadius: 12, border: `1px solid ${P.border}` }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                    <thead>
                      <tr style={{ background: P.sand }}>
                        {['Point de vente', 'Propriétaire', 'Type', 'Téléphone', 'Coordonnées', "Chiffre d'affaires"].map((h) => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: P.subtle, borderBottom: `1px solid ${P.border}` }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pointsOfSale.slice(0, 5).map((pos) => {
                        const valid = isValidCoordinate(pos.latitude, pos.longitude);
                        return (
                          <tr key={pos.id} style={{ borderBottom: `1px solid ${P.border}` }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = P.sand; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                            <td style={{ padding: '10px 14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {pos.avatar_url
                                  ? <img src={pos.avatar_url} alt={pos.name} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                  : <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#FFF3E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Store size={13} style={{ color: P.ochre }} /></div>
                                }
                                <span style={{ fontWeight: 600, color: P.text }}>{pos.name}</span>
                              </div>
                            </td>
                            <td style={{ padding: '10px 14px', color: P.muted }}>{pos.owner}</td>
                            <td style={{ padding: '10px 14px', color: P.muted }}>{pos.type_display}</td>
                            <td style={{ padding: '10px 14px', color: P.muted }}>{pos.phone}</td>
                            <td style={{ padding: '10px 14px' }}>
                              {valid
                                ? <span style={{ fontSize: 11, fontWeight: 600, color: P.ochre, background: '#FFF3E8', padding: '2px 8px', borderRadius: 99 }}>Valides</span>
                                : <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: P.ochreDark, background: P.errorBg, padding: '2px 8px', borderRadius: 99 }}><AlertCircle size={11} />Manquantes</span>
                              }
                            </td>
                            <td style={{ padding: '10px 14px', fontWeight: 700, color: P.text }}>{pos.turnover.toLocaleString()} FCFA</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Aucune donnée */}
            {((viewType === 'customers' && (!mapData || !mapData.customers.length)) ||
              (viewType === 'points-of-sale' && !pointsOfSale.length) ||
              (viewType === 'both' && (!mapData || !mapData.customers.length) && !pointsOfSale.length)) && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <MapPin size={44} style={{ color: P.borderMid, margin: '0 auto 14px' }} />
                <p style={{ fontSize: 15, fontWeight: 600, color: P.muted }}>Aucune donnée disponible</p>
                <p style={{ fontSize: 13, color: P.muted, marginTop: 4 }}>Aucune donnée trouvée pour les filtres sélectionnés.</p>
              </div>
            )}
          </>
        )}

        {/* Kente bottom band */}
        <div style={{ height: 3, borderRadius: '0 0 12px 12px', marginTop: 28, marginLeft: -28, marginRight: -28, marginBottom: -32, opacity: 0.5, background: `linear-gradient(90deg,${P.forest} 0%,${P.ochre} 30%,${P.goldMid} 60%,${P.forest} 100%)` }} />
      </div>
    </div>
  );
};

export default MapComponent;