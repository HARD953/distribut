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
  Camera, ZoomIn, Layers,
} from "lucide-react";
import dynamic from "next/dynamic";
import { apiService } from "./ApiService";

/* ─── Types ──────────────────────────────────────────────── */
interface POSPhoto {
  id: number; image: string; thumbnail: string | null;
  type: string; caption: string; order: number; created_at: string;
}

interface PointOfSale {
  id: number; name: string; owner: string; phone: string; email: string;
  address: string; latitude: number | null; longitude: number | null;
  district: string; region: string; commune: string; quartier: string;
  type: string; status: string; potentiel: string; potentiel_label: string;
  registration_date: string; turnover: string; monthly_turnover: string;
  monthly_orders: number; evaluation_score: number; avatar: string | null;
  brander: boolean; marque_brander: string | null; branding_image: string | null;
  score_a: number; score_d: number; score_e: number; score_global: number;
  visibilite: number; accessibilite: number; affluence: number; digitalisation: number;
  eligibilite_branding: boolean; eligibilite_exclusivite: boolean; eligibilite_activation: boolean;
  gps_valid: boolean; fiche_complete: boolean; grande_voie: boolean;
  agent: string; agent_name: string; date_collecte: string | null;
  photos_count: number; photos?: POSPhoto[];
  created_at?: string; updated_at?: string;
}

/* ─── Map (no SSR) ───────────────────────────────────────── */
const MapWithNoSSR = dynamic(
  () => import("@/components/Map").then((mod) => {
    return (props: any) => <mod.default {...props} showAvatars={props.showAvatars} />;
  }),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center rounded-xl"
        style={{ background: "#EAF2EC", border: "0.5px solid #C8DFC0" }}>
        <div className="text-center space-y-3">
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#1A3A28",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
            <Navigation size={20} color="#FAF7F0" />
          </div>
          <p style={{ color: "#1A3A28", fontWeight: 600, fontSize: 13 }}>Chargement de la carte...</p>
        </div>
      </div>
    ),
  }
);

/* ─── Constants ──────────────────────────────────────────── */
const pointTypes = [
  { value: "boutique",       label: "Boutique",       icon: Store },
  { value: "supermarche",    label: "Supermarché",    icon: Building2 },
  { value: "superette",      label: "Supérette",      icon: Store },
  { value: "epicerie",       label: "Épicerie",       icon: Store },
  { value: "demi_grossiste", label: "Demi-Grossiste", icon: Users },
  { value: "grossiste",      label: "Grossiste",      icon: Building2 },
];

const statusOptions = [
  { value: "actif",      label: "Actif",      color: "#1A3A28", bg: "#EAF2EC", border: "#A8D4B0" },
  { value: "suspendu",   label: "Suspendu",   color: "#8B2020", bg: "#FEF0EE", border: "#F5C4B3" },
  { value: "en_attente", label: "En attente", color: "#B8801F", bg: "#FDF3E0", border: "#F0D0A0" },
];

const potentielOptions = [
  { value: "standard",       label: "Standard" },
  { value: "developpement",  label: "Développement" },
  { value: "fort_potentiel", label: "Fort potentiel" },
  { value: "premium",        label: "Premium" },
];

const branderOptions = [
  { value: "all",         label: "Tous" },
  { value: "brander",     label: "Brandé" },
  { value: "non_brander", label: "Non brandé" },
];

const PHOTO_TYPES = [
  { value: "facade",        label: "Façade",        bg: "#1A3A28", icon: "🏪" },
  { value: "interieur",     label: "Intérieur",     bg: "#B8801F", icon: "🏠" },
  { value: "axe_principal", label: "Axe principal", bg: "#6B3A9E", icon: "🛣️" },
  { value: "environnement", label: "Environnement", bg: "#1A5C6B", icon: "🌿" },
  { value: "autre",         label: "Autre",         bg: "#5C4A2A", icon: "📷" },
];

const MIN_PHOTOS = 4;

/* ─── Helpers ────────────────────────────────────────────── */
const isValidCoord = (c: number | null | undefined): c is number =>
  c !== null && c !== undefined && !isNaN(c) && c !== 0;

const getStatusOpts = (status: string) =>
  statusOptions.find((s) => s.value === status) || { color: "#5C4A2A", bg: "#F5F3EE", border: "#E8E0D4" };

const getStatusIcon = (status: string) => {
  if (status === "actif")      return <CheckCircle size={12} color="#1A3A28" />;
  if (status === "suspendu")   return <AlertCircle size={12} color="#8B2020" />;
  if (status === "en_attente") return <Clock size={12} color="#B8801F" />;
  return null;
};

const getTypeLabel   = (t: string) => pointTypes.find((x) => x.value === t)?.label || t;
const getStatusLabel = (s: string) => statusOptions.find((x) => x.value === s)?.label || s;
const getPhotoLabel  = (t: string) => PHOTO_TYPES.find((x) => x.value === t)?.label || t;
const getPhotoBg     = (t: string) => PHOTO_TYPES.find((x) => x.value === t)?.bg || "#5C4A2A";

const badgeFromScore = (score: number) => {
  if (score >= 85) return { label: "Premium stratégique", color: "#1A3A28", bg: "#EAF2EC", border: "#A8D4B0" };
  if (score >= 70) return { label: "Haut potentiel",      color: "#B8801F", bg: "#FDF3E0", border: "#F0D0A0" };
  if (score >= 50) return { label: "Développement",       color: "#6B3A9E", bg: "#F0EBF8", border: "#D4C0F0" };
  return               { label: "Standard",               color: "#5C4A2A", bg: "#F5F3EE", border: "#E8E0D4" };
};

const fmt = (n: number) => n.toLocaleString("fr-FR");

function cn(...cls: (string | boolean | undefined | null)[]) {
  return cls.filter(Boolean).join(" ");
}

/* ─── Kente stripe ───────────────────────────────────────── */
const KenteStripe = ({ height = 3 }: { height?: number }) => (
  <div style={{
    height, flexShrink: 0,
    background: "repeating-linear-gradient(90deg,#B8801F 0,#B8801F 14px,#E8C050 14px,#E8C050 28px,#1A3A28 28px,#1A3A28 36px,#8B2020 36px,#8B2020 50px,#E8C050 50px,#E8C050 64px,#1A3A28 64px,#1A3A28 72px)",
  }} />
);

/* ─── Photo upload item ──────────────────────────────────── */
interface PhotoUploadItem {
  id: string; file: File; preview: string; type: string; caption: string;
}

/* ─── PhotoUploadSection ─────────────────────────────────── */
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

  const allCount = existingPhotos.length + photos.length;
  const coveredTypes = new Set([...existingPhotos.map((p) => p.type), ...photos.map((p) => p.type)]);
  const requiredTypes = ["facade", "interieur", "axe_principal", "environnement"];
  const missingTypes = requiredTypes.filter((t) => !coveredTypes.has(t));

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera size={15} color="#B8801F" />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#1C1008", textTransform: "uppercase", letterSpacing: "0.06em" }}>Photos du PDV</span>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
            background: allCount >= MIN_PHOTOS ? "#EAF2EC" : "#FDF3E0",
            color: allCount >= MIN_PHOTOS ? "#1A3A28" : "#B8801F",
            border: `0.5px solid ${allCount >= MIN_PHOTOS ? "#A8D4B0" : "#F0D0A0"}` }}>
            {allCount}/{MIN_PHOTOS} min
          </span>
        </div>
        <button type="button" onClick={() => inputRef.current?.click()} disabled={isUploading}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8,
            background: "#1A3A28", color: "#FAF7F0", fontSize: 11, fontWeight: 600,
            border: "none", cursor: "pointer", opacity: isUploading ? 0.5 : 1 }}>
          <Plus size={12} /> Ajouter photos
        </button>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {/* Missing types warning */}
      {missingTypes.length > 0 && (
        <div style={{ display: "flex", gap: 8, padding: 12, borderRadius: 10,
          background: "#FDF3E0", border: "0.5px solid #F0D0A0" }}>
          <AlertCircle size={14} color="#B8801F" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#B8801F" }}>Types requis manquants :</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
              {missingTypes.map((t) => (
                <span key={t} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6,
                  background: "#FEF0C0", color: "#B8801F", fontWeight: 600 }}>
                  {PHOTO_TYPES.find((pt) => pt.value === t)?.icon} {getPhotoLabel(t)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Drop zone */}
      {allCount === 0 && (
        <div onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          style={{ border: "2px dashed #D4C4A0", borderRadius: 14, padding: 32, textAlign: "center",
            cursor: "pointer", background: "#FAF7F0", transition: "all 0.15s" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#B8801F"; (e.currentTarget as HTMLElement).style.background = "#FDF3E0"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#D4C4A0"; (e.currentTarget as HTMLElement).style.background = "#FAF7F0"; }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "#EAF2EC",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <Camera size={24} color="#1A3A28" />
          </div>
          <p style={{ fontWeight: 600, color: "#1C1008", fontSize: 13, marginBottom: 4 }}>Déposez vos photos ici</p>
          <p style={{ fontSize: 11, color: "#8A7A62" }}>4 photos minimum · Façade, Intérieur, Axe principal, Environnement</p>
        </div>
      )}

      {/* Existing photos */}
      {existingPhotos.length > 0 && (
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#8A7A62", textTransform: "uppercase",
            letterSpacing: "0.08em", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
            <Layers size={11} /> Photos enregistrées ({existingPhotos.length})
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
            {existingPhotos.map((photo, idx) => (
              <div key={photo.id} className="group relative rounded-xl overflow-hidden"
                style={{ aspectRatio: "1", border: "0.5px solid #E8E0D4", background: "#F5F3EE" }}>
                <img src={photo.thumbnail || photo.image} alt={photo.type}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <button type="button" onClick={() => { setLbIdx(idx); setLbSrc("existing"); }}
                    style={{ padding: 5, background: "rgba(255,255,255,0.9)", borderRadius: 7, border: "none", cursor: "pointer" }}>
                    <ZoomIn size={13} color="#1C1008" />
                  </button>
                  {onDeleteExisting && (
                    <button type="button" onClick={() => onDeleteExisting(photo.id)}
                      style={{ padding: 5, background: "#8B2020", borderRadius: 7, border: "none", cursor: "pointer" }}>
                      <Trash2 size={13} color="white" />
                    </button>
                  )}
                </div>
                <div style={{ position: "absolute", top: 5, left: 5, padding: "2px 6px", borderRadius: 5,
                  background: getPhotoBg(photo.type), color: "white", fontSize: 10, fontWeight: 700 }}>
                  {PHOTO_TYPES.find((t) => t.value === photo.type)?.icon}
                </div>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0,
                  background: "linear-gradient(transparent,rgba(0,0,0,0.65))", padding: "6px 8px" }}>
                  <p style={{ color: "white", fontSize: 10, fontWeight: 600 }}>{getPhotoLabel(photo.type)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New photos */}
      {photos.length > 0 && (
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#8A7A62", textTransform: "uppercase",
            letterSpacing: "0.08em", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
            <Upload size={11} /> Nouvelles photos ({photos.length})
          </p>
          <div className="space-y-3">
            {photos.map((photo) => (
              <div key={photo.id} style={{ display: "flex", gap: 12, padding: 12, borderRadius: 12,
                background: "#FAF7F0", border: "0.5px solid #E8E0D4" }}>
                <div style={{ width: 76, height: 76, borderRadius: 9, overflow: "hidden",
                  border: "0.5px solid #E8E0D4", flexShrink: 0, cursor: "pointer", position: "relative" }}
                  className="group"
                  onClick={() => { setLbIdx(photos.indexOf(photo)); setLbSrc("new"); }}>
                  <img src={photo.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ZoomIn size={15} color="white" />
                  </div>
                </div>
                <div style={{ flex: 1 }} className="space-y-2">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#8A7A62",
                        textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Type *</label>
                      <select value={photo.type} onChange={(e) => update(photo.id, { type: e.target.value })}
                        style={{ width: "100%", padding: "6px 8px", border: "0.5px solid #D4C4A0",
                          borderRadius: 7, fontSize: 11, background: "#fff", outline: "none", fontFamily: "inherit" }}>
                        {PHOTO_TYPES.map((t) => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#8A7A62",
                        textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Légende</label>
                      <input type="text" value={photo.caption} placeholder="Description..."
                        onChange={(e) => update(photo.id, { caption: e.target.value })}
                        style={{ width: "100%", padding: "6px 8px", border: "0.5px solid #D4C4A0",
                          borderRadius: 7, fontSize: 11, background: "#fff", outline: "none", fontFamily: "inherit" }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, color: "white",
                      background: getPhotoBg(photo.type), fontWeight: 600 }}>
                      {PHOTO_TYPES.find((t) => t.value === photo.type)?.icon} {getPhotoLabel(photo.type)}
                    </span>
                    <button type="button" onClick={() => remove(photo.id)}
                      style={{ padding: 5, background: "none", border: "none", cursor: "pointer", borderRadius: 6,
                        color: "#8B2020" }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => inputRef.current?.click()}
            style={{ marginTop: 10, width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
              gap: 6, padding: "10px", border: "2px dashed #D4C4A0", borderRadius: 10,
              background: "transparent", color: "#8A7A62", fontSize: 12, fontWeight: 600, cursor: "pointer",
              transition: "all 0.15s", fontFamily: "inherit" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#B8801F"; (e.currentTarget as HTMLElement).style.color = "#B8801F"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#D4C4A0"; (e.currentTarget as HTMLElement).style.color = "#8A7A62"; }}>
            <Plus size={14} /> Ajouter d'autres photos
          </button>
        </div>
      )}

      {/* Types coverage recap */}
      {allCount > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
          {requiredTypes.map((type) => {
            const covered = coveredTypes.has(type);
            const info = PHOTO_TYPES.find((t) => t.value === type)!;
            return (
              <div key={type} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 8px",
                borderRadius: 8, fontSize: 10, fontWeight: 600,
                background: covered ? "#EAF2EC" : "#F5F3EE",
                border: `0.5px solid ${covered ? "#A8D4B0" : "#E8E0D4"}`,
                color: covered ? "#1A3A28" : "#8A7A62" }}>
                {covered
                  ? <CheckCircle2 size={11} color="#1A3A28" style={{ flexShrink: 0 }} />
                  : <div style={{ width: 11, height: 11, borderRadius: "50%", border: "2px solid #D4C4A0", flexShrink: 0 }} />
                }
                {info.icon} {info.label}
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      {lbIdx !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setLbIdx(null)}>
          <div style={{ position: "relative", maxWidth: 720, width: "100%" }} onClick={(e) => e.stopPropagation()}>
            <img
              src={lbSrc === "new" ? photos[lbIdx]?.preview : existingPhotos[lbIdx]?.image}
              alt="" style={{ width: "100%", borderRadius: 14, maxHeight: "80vh", objectFit: "contain" }} />
            <button onClick={() => setLbIdx(null)}
              style={{ position: "absolute", top: 10, right: 10, padding: 8, background: "rgba(0,0,0,0.5)",
                border: "none", borderRadius: 10, cursor: "pointer", color: "white" }}>
              <X size={16} />
            </button>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
              <button onClick={() => setLbIdx((i) => i !== null && i > 0 ? i - 1 : i)}
                style={{ padding: "8px 16px", background: "rgba(255,255,255,0.1)", border: "none",
                  borderRadius: 10, color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                ← Précédent
              </button>
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
                {lbIdx + 1} / {lbSrc === "new" ? photos.length : existingPhotos.length}
              </span>
              <button onClick={() => {
                const max = (lbSrc === "new" ? photos.length : existingPhotos.length) - 1;
                setLbIdx((i) => i !== null && i < max ? i + 1 : i);
              }} style={{ padding: "8px 16px", background: "rgba(255,255,255,0.1)", border: "none",
                borderRadius: 10, color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                Suivant →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── PhotoCard (gallery) ────────────────────────────────── */
const PhotoCard: React.FC<{
  photo: POSPhoto; onDelete: () => void; allPhotos: POSPhoto[]; index: number;
}> = ({ photo, onDelete, allPhotos, index }) => {
  const [lb, setLb] = useState(false);
  const [lbIdx, setLbIdx] = useState(index);
  return (
    <>
      <div className="group relative rounded-xl overflow-hidden"
        style={{ aspectRatio: "1", border: "0.5px solid #E8E0D4", background: "#F5F3EE" }}>
        <img src={photo.thumbnail || photo.image} alt={photo.type}
          style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }}
          className="group-hover:scale-105" />
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center",
            justifyContent: "center", gap: 6 }}>
          <button type="button" onClick={() => { setLbIdx(index); setLb(true); }}
            style={{ padding: 5, background: "rgba(255,255,255,0.9)", borderRadius: 7, border: "none", cursor: "pointer" }}>
            <ZoomIn size={13} color="#1C1008" />
          </button>
          <button type="button" onClick={onDelete}
            style={{ padding: 5, background: "#8B2020", borderRadius: 7, border: "none", cursor: "pointer" }}>
            <Trash2 size={13} color="white" />
          </button>
        </div>
        <div style={{ position: "absolute", top: 5, left: 5, padding: "2px 6px", borderRadius: 5,
          background: getPhotoBg(photo.type), color: "white", fontSize: 10, fontWeight: 700 }}>
          {PHOTO_TYPES.find((t) => t.value === photo.type)?.icon}
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0,
          background: "linear-gradient(transparent,rgba(0,0,0,0.65))", padding: "6px 8px" }}>
          <p style={{ color: "white", fontSize: 10, fontWeight: 600 }}>{getPhotoLabel(photo.type)}</p>
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
              background: getPhotoBg(allPhotos[lbIdx]?.type), color: "white", fontSize: 11, fontWeight: 700,
              display: "flex", alignItems: "center", gap: 5 }}>
              {PHOTO_TYPES.find((t) => t.value === allPhotos[lbIdx]?.type)?.icon}
              {getPhotoLabel(allPhotos[lbIdx]?.type)}
            </div>
            <button onClick={() => setLb(false)}
              style={{ position: "absolute", top: 10, right: 10, padding: 7, background: "rgba(0,0,0,0.5)",
                border: "none", borderRadius: 10, cursor: "pointer" }}>
              <X size={16} color="white" />
            </button>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
              <button onClick={() => setLbIdx((i) => Math.max(0, i - 1))} disabled={lbIdx === 0}
                style={{ padding: "7px 14px", background: "rgba(255,255,255,0.1)", border: "none",
                  borderRadius: 9, color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer",
                  opacity: lbIdx === 0 ? 0.3 : 1 }}>← Précédent</button>
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, alignSelf: "center" }}>
                {lbIdx + 1} / {allPhotos.length}
              </span>
              <button onClick={() => setLbIdx((i) => Math.min(allPhotos.length - 1, i + 1))}
                disabled={lbIdx === allPhotos.length - 1}
                style={{ padding: "7px 14px", background: "rgba(255,255,255,0.1)", border: "none",
                  borderRadius: 9, color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer",
                  opacity: lbIdx === allPhotos.length - 1 ? 0.3 : 1 }}>Suivant →</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/* ─── Micro components ───────────────────────────────────── */
const SectionTitle = ({ icon: Icon, label }: { icon: any; label: string }) => (
  <h4 style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700,
    color: "#1C1008", textTransform: "uppercase", letterSpacing: "0.07em" }}>
    <Icon size={13} color="#B8801F" /> {label}
  </h4>
);

const FormInput = ({ label, value, onChange, type = "text", placeholder = "" }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) => (
  <div>
    <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#8A7A62",
      textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>{label}</label>
    <input type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: "100%", padding: "8px 12px", border: "0.5px solid #D4C4A0", borderRadius: 9,
        fontSize: 13, background: "#FAF7F0", outline: "none", fontFamily: "inherit",
        color: "#1C1008", transition: "border 0.15s, box-shadow 0.15s" }}
      onFocus={(e) => { e.currentTarget.style.borderColor = "#B8801F"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(184,128,31,0.12)"; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = "#D4C4A0"; e.currentTarget.style.boxShadow = "none"; }} />
  </div>
);

const ScoreInput = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
  <div>
    <label style={{ display: "block", fontSize: 10, color: "#8A7A62", marginBottom: 4, fontWeight: 600 }}>{label}</label>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <input type="range" min={0} max={100} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: "#B8801F" }} />
      <span style={{ fontSize: 11, fontWeight: 700, color: "#1C1008", minWidth: 28, textAlign: "right" }}>{value}</span>
    </div>
  </div>
);

const FilterSelect = ({ value, onChange, children, disabled = false }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode; disabled?: boolean;
}) => (
  <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
    style={{ padding: "7px 12px", border: "0.5px solid #D4C4A0", borderRadius: 9,
      fontSize: 12, background: "#FAF7F0", outline: "none", fontFamily: "inherit",
      color: "#1C1008", minWidth: 130, opacity: disabled ? 0.5 : 1, cursor: disabled ? "not-allowed" : "pointer" }}>
    {children}
  </select>
);

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
    style={{ padding: "5px 10px", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
      border: "0.5px solid",
      borderColor: active ? "#B8801F" : disabled ? "#E8E0D4" : "#D4C4A0",
      background: active ? "#B8801F" : disabled ? "#F5F3EE" : "#FAF7F0",
      color: active ? "white" : disabled ? "#C8B898" : "#1C1008", transition: "all 0.1s" }}>
    {children}
  </button>
);

const ScorePill = ({ label, value, bg }: { label: string; value: number; bg: string }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 2, padding: "2px 6px",
    borderRadius: 5, fontSize: 10, fontWeight: 700, color: "white", background: bg }}>
    {label}:{value}
  </span>
);

const EligibilityDot = ({ label, ok }: { label: string; ok: boolean }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
    <div style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
      background: ok ? "#1A3A28" : "#D4C4A0" }} />
    <span style={{ fontSize: 11, fontWeight: 500, color: ok ? "#1A3A28" : "#8A7A62" }}>{label}</span>
  </div>
);

const ProgressBarFull = ({ label, value, max, bg }: { label: string; value: number; max: number; bg: string }) => {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 5 }}>
        <span style={{ color: "#5C4A2A", fontWeight: 500 }}>{label}</span>
        <span style={{ fontWeight: 700, color: "#1C1008" }}>{value}/{max}</span>
      </div>
      <div style={{ height: 7, borderRadius: 10, background: "#E8E0D4" }}>
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
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
const PointsVenteManagement: React.FC = () => {

  const [pointsVente, setPointsVente]         = useState<PointOfSale[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [actionLoading, setActionLoading]     = useState(false);
  const [photosUploading, setPhotosUploading] = useState(false);
  const [error, setError]                     = useState<string | null>(null);

  const [searchTerm, setSearchTerm]                     = useState("");
  const [filterStatus, setFilterStatus]                 = useState("all");
  const [filterType, setFilterType]                     = useState("all");
  const [filterDistrict, setFilterDistrict]             = useState("all");
  const [filterRegion, setFilterRegion]                 = useState("all");
  const [filterCommune, setFilterCommune]               = useState("all");
  const [filterPotentiel, setFilterPotentiel]           = useState("all");
  const [filterBrander, setFilterBrander]               = useState("all");
  const [filterMarqueBrander, setFilterMarqueBrander]   = useState("all");

  const [activeView, setActiveView]     = useState<"liste" | "carte" | "detail">("liste");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<PointOfSale | null>(null);
  const [editingPoint, setEditingPoint]   = useState<PointOfSale | null>(null);

  const [currentPage, setCurrentPage]   = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [avatarFile, setAvatarFile]               = useState<File | null>(null);
  const [brandingImageFile, setBrandingImageFile] = useState<File | null>(null);

  const [addPhotos, setAddPhotos]         = useState<PhotoUploadItem[]>([]);
  const [editPhotos, setEditPhotos]       = useState<PhotoUploadItem[]>([]);
  const [detailPhotos, setDetailPhotos]   = useState<POSPhoto[]>([]);
  const [showPhotosModal, setShowPhotosModal]   = useState(false);
  const [photosModalPoint, setPhotosModalPoint] = useState<PointOfSale | null>(null);
  const [photosModalItems, setPhotosModalItems] = useState<PhotoUploadItem[]>([]);

  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [locationError, setLocationError]           = useState<string | null>(null);

  const emptyForm = () => ({
    name: "", owner: "", phone: "", email: "", address: "",
    type: "boutique", district: "", region: "", commune: "", quartier: "",
    potentiel: "standard",
    latitude: "" as string | number,
    longitude: "" as string | number,
    registration_date: new Date().toISOString().split("T")[0],
    avatar: "", brander: false, marque_brander: "", branding_image: "",
    visibilite: 0, accessibilite: 0, affluence: 0, digitalisation: 0,
    grande_voie: false, agent_name: "", date_collecte: "",
    monthly_turnover: "", monthly_orders: 0,
  });
  const [newPoint, setNewPoint] = useState(emptyForm());

  /* ── Derived ── */
  const districts     = Array.from(new Set(pointsVente.map((p) => p.district).filter(Boolean))).sort();
  const regions       = Array.from(new Set(pointsVente.map((p) => p.region).filter(Boolean))).sort();
  const communes      = Array.from(new Set(pointsVente.map((p) => p.commune).filter(Boolean))).sort();
  const marquesBrander = Array.from(new Set(pointsVente.filter((p) => p.brander && p.marque_brander).map((p) => p.marque_brander as string))).sort();

  const filteredPoints = pointsVente.filter((point) => {
    const q = searchTerm.toLowerCase();
    return (
      (point.name.toLowerCase().includes(q) || point.owner.toLowerCase().includes(q) ||
       point.address.toLowerCase().includes(q) || point.commune.toLowerCase().includes(q) ||
       (point.marque_brander || "").toLowerCase().includes(q)) &&
      (filterStatus === "all" || point.status === filterStatus) &&
      (filterType === "all" || point.type === filterType) &&
      (filterDistrict === "all" || point.district === filterDistrict) &&
      (filterRegion === "all" || point.region === filterRegion) &&
      (filterCommune === "all" || point.commune === filterCommune) &&
      (filterPotentiel === "all" || point.potentiel === filterPotentiel) &&
      (filterBrander === "all" || (filterBrander === "brander" ? point.brander : !point.brander)) &&
      (filterMarqueBrander === "all" || point.marque_brander === filterMarqueBrander)
    );
  });

  const totalPages   = Math.ceil(filteredPoints.length / itemsPerPage);
  const indexOfFirst = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredPoints.slice(indexOfFirst, indexOfFirst + itemsPerPage);

  const statsCards = [
    { title: "Total Distributeurs", value: fmt(pointsVente.length),
      sub: `${pointsVente.filter((p) => p.status === "actif").length} actifs`,
      icon: Building2, bg: "#1A3A28" },
    { title: "GPS Valides", value: fmt(pointsVente.filter((p) => p.gps_valid).length),
      sub: `${Math.round((pointsVente.filter((p) => p.gps_valid).length / Math.max(pointsVente.length, 1)) * 100)}%`,
      icon: Navigation, bg: "#B8801F" },
    { title: "Éligibles Branding", value: fmt(pointsVente.filter((p) => p.eligibilite_branding).length),
      sub: `${pointsVente.filter((p) => p.brander).length} déjà brandés`,
      icon: Award, bg: "#6B3A9E" },
    { title: "Score Moyen", value: `${Math.round(pointsVente.reduce((s, p) => s + p.score_global, 0) / Math.max(pointsVente.length, 1))}/100`,
      sub: `${pointsVente.filter((p) => p.score_global >= 85).length} premium`,
      icon: BarChart3, bg: "#1A5C6B" },
  ];

  /* ── API calls ── */
  const fetchPoints = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const params: Record<string, any> = {};
      if (filterCommune !== "all")   params.commune   = filterCommune;
      if (filterDistrict !== "all")  params.district  = filterDistrict;
      if (filterRegion !== "all")    params.region    = filterRegion;
      if (filterType !== "all")      params.type      = filterType;
      if (filterStatus !== "all")    params.status    = filterStatus;
      if (filterPotentiel !== "all") params.potentiel = filterPotentiel;
      if (filterBrander === "brander")     params.branding = "true";
      if (filterBrander === "non_brander") params.branding = "false";
      const res = await apiService.getPointsVenteAnalytics(params);
      if (!res.ok) throw new Error("Erreur chargement Distributeurs");
      setPointsVente(await res.json());
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }, [filterCommune, filterDistrict, filterRegion, filterType, filterStatus, filterPotentiel, filterBrander]);

  useEffect(() => { fetchPoints(); }, [fetchPoints]);

  const fetchPointDetail = useCallback(async (id: number) => {
    try {
      const res = await apiService.getPointVenteDetail(id);
      if (!res.ok) throw new Error("Erreur chargement détail");
      const data: PointOfSale = await res.json();
      setSelectedPoint(data);
      setDetailPhotos(data.photos || []);
    } catch (err: any) { setError(err.message); }
  }, []);

  /* ── CRUD ── */
  const handleAddPoint = async () => {
    try {
      setActionLoading(true);
      const fd = new FormData();
      (Object.keys(newPoint) as Array<keyof typeof newPoint>).forEach((key) => {
        if (["avatar", "branding_image"].includes(key)) return;
        const val = newPoint[key];
        if (val !== "" && val !== null && val !== undefined) fd.append(key, String(val));
      });
      if (avatarFile) fd.append("avatar", avatarFile);
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
        "name","owner","phone","email","address","type","status","potentiel",
        "district","region","commune","quartier","latitude","longitude",
        "registration_date","brander","marque_brander","visibilite","accessibilite",
        "affluence","digitalisation","grande_voie","agent_name","date_collecte",
        "monthly_turnover","monthly_orders",
      ];
      fields.forEach((key) => {
        const val = editingPoint[key];
        if (val !== null && val !== undefined) fd.append(key, String(val));
      });
      if (!editingPoint.brander) fd.set("marque_brander", "");
      if (avatarFile) fd.append("avatar", avatarFile);
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
      if (showAddModal) setNewPoint((p) => ({ ...p, avatar: r }));
      if (editingPoint) setEditingPoint((p) => p && { ...p, avatar: r });
    };
    reader.readAsDataURL(file);
  };

  const handleBrandingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setBrandingImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const r = ev.target?.result as string;
      if (showAddModal) setNewPoint((p) => ({ ...p, branding_image: r }));
      if (editingPoint) setEditingPoint((p) => p && { ...p, branding_image: r });
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
    const headers = ["Nom","Propriétaire","Téléphone","Email","Adresse","Type","Statut","District","Région","Commune","Potentiel","Score global","GPS","Brandé","Marque","Agent"];
    let csv = headers.join(",") + "\n";
    filteredPoints.forEach((p) => {
      csv += [p.name,p.owner,p.phone,p.email,p.address,getTypeLabel(p.type),getStatusLabel(p.status),
        p.district,p.region,p.commune,p.potentiel_label,p.score_global,
        p.gps_valid?"Oui":"Non",p.brander?"Oui":"Non",p.marque_brander||"",p.agent_name||""]
        .map((f) => `"${f}"`).join(",") + "\n";
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    a.download = "distributeurs.csv"; a.click();
  };

  const resetFilters = () => {
    setSearchTerm(""); setFilterStatus("all"); setFilterType("all");
    setFilterDistrict("all"); setFilterRegion("all"); setFilterCommune("all");
    setFilterPotentiel("all"); setFilterBrander("all"); setFilterMarqueBrander("all"); setCurrentPage(1);
  };

  const isAddFormValid = Boolean(newPoint.name && newPoint.owner && newPoint.phone && newPoint.email &&
    newPoint.address && newPoint.district && newPoint.region && newPoint.commune &&
    newPoint.registration_date && !(newPoint.brander && !newPoint.marque_brander));

  const isEditFormValid = Boolean(editingPoint?.name && editingPoint?.owner && editingPoint?.phone &&
    editingPoint?.email && editingPoint?.address && editingPoint?.district &&
    editingPoint?.region && editingPoint?.commune && editingPoint?.registration_date &&
    !(editingPoint?.brander && !editingPoint?.marque_brander));

  /* ── Avatar upload sub-component ── */
  const AvatarUpload = ({ src, inputId }: { src: string; inputId: string }) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 8 }}>
      <div className="group relative" style={{ width: 100, height: 100, borderRadius: 14,
        overflow: "hidden", border: "2px dashed #D4C4A0", background: "#FAF7F0", cursor: "pointer" }}>
        {src ? <img src={src} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", color: "#8A7A62" }}>
              <ImageIcon size={26} /><span style={{ fontSize: 10, marginTop: 4 }}>Photo</span>
            </div>
        }
        <label htmlFor={inputId} className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.5)", cursor: "pointer" }}>
          <Upload size={18} color="white" />
        </label>
        <input id={inputId} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
      </div>
      <p style={{ fontSize: 10, color: "#8A7A62", marginTop: 4 }}>JPG, PNG · max 2MB</p>
    </div>
  );

  const BrandingUpload = ({ src, inputId }: { src: string | null; inputId: string }) => (
    <div style={{ border: "2px dashed #D4C4A0", borderRadius: 10, padding: 10,
      background: "#FAF7F0", transition: "border 0.15s" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#B8801F"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#D4C4A0"; }}>
      <label htmlFor={inputId} style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {src ? (
          <><img src={src} alt="branding" style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 8, marginBottom: 4 }} />
            <span style={{ fontSize: 11, color: "#B8801F", fontWeight: 600 }}>Modifier l'image</span></>
        ) : (
          <div style={{ padding: 12, textAlign: "center" }}>
            <Upload size={18} color="#8A7A62" style={{ margin: "0 auto 4px" }} />
            <span style={{ fontSize: 11, color: "#5C4A2A" }}>Ajouter une image de marque</span>
            <p style={{ fontSize: 10, color: "#8A7A62", marginTop: 2 }}>JPG, PNG · max 2MB</p>
          </div>
        )}
      </label>
      <input id={inputId} type="file" accept="image/*" onChange={handleBrandingChange} className="hidden" />
    </div>
  );

  /* ── Form fields ── */
  const renderBaseFields = (
    data: typeof newPoint | PointOfSale,
    onChange: (u: any) => void,
    showStatus = false
  ) => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      {/* Left */}
      <div className="space-y-4">
        <SectionTitle icon={User} label="Informations de base" />
        <FormInput label="Nom du Distributeur *" value={data.name} onChange={(v) => onChange({ name: v })} placeholder="Ex: Supermarché Central" />
        <FormInput label="Propriétaire *" value={data.owner} onChange={(v) => onChange({ owner: v })} placeholder="Ex: Jean Kouadio" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <FormInput label="Téléphone *" type="tel" value={data.phone} onChange={(v) => onChange({ phone: v })} placeholder="+225 XX XX" />
          <FormInput label="Email *" type="email" value={data.email} onChange={(v) => onChange({ email: v })} placeholder="email@ex.com" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#8A7A62",
              textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Type *</label>
            <select value={data.type} onChange={(e) => onChange({ type: e.target.value })}
              style={{ width: "100%", padding: "8px 12px", border: "0.5px solid #D4C4A0", borderRadius: 9,
                fontSize: 13, background: "#FAF7F0", outline: "none", fontFamily: "inherit", color: "#1C1008" }}>
              {pointTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          {showStatus ? (
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#8A7A62",
                textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Statut *</label>
              <select value={(data as PointOfSale).status} onChange={(e) => onChange({ status: e.target.value })}
                style={{ width: "100%", padding: "8px 12px", border: "0.5px solid #D4C4A0", borderRadius: 9,
                  fontSize: 13, background: "#FAF7F0", outline: "none", fontFamily: "inherit", color: "#1C1008" }}>
                {statusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          ) : (
            <FormInput label="Date inscription *" type="date" value={data.registration_date} onChange={(v) => onChange({ registration_date: v })} />
          )}
        </div>
        {showStatus && <FormInput label="Date inscription *" type="date" value={data.registration_date} onChange={(v) => onChange({ registration_date: v })} />}
        <div>
          <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#8A7A62",
            textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Potentiel commercial</label>
          <select value={data.potentiel || "standard"} onChange={(e) => onChange({ potentiel: e.target.value })}
            style={{ width: "100%", padding: "8px 12px", border: "0.5px solid #D4C4A0", borderRadius: 9,
              fontSize: 13, background: "#FAF7F0", outline: "none", fontFamily: "inherit", color: "#1C1008" }}>
            {potentielOptions.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <div style={{ background: "#FAF7F0", borderRadius: 12, padding: 14, border: "0.5px solid #E8E0D4" }}>
          <SectionTitle icon={Activity} label="Indicateurs terrain (0-100)" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
            <ScoreInput label="Visibilité"     value={data.visibilite || 0}     onChange={(v) => onChange({ visibilite: v })} />
            <ScoreInput label="Accessibilité"  value={data.accessibilite || 0}  onChange={(v) => onChange({ accessibilite: v })} />
            <ScoreInput label="Affluence"      value={data.affluence || 0}      onChange={(v) => onChange({ affluence: v })} />
            <ScoreInput label="Digitalisation" value={data.digitalisation || 0} onChange={(v) => onChange({ digitalisation: v })} />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 10, cursor: "pointer" }}>
            <input type="checkbox" checked={data.grande_voie || false}
              onChange={(e) => onChange({ grande_voie: e.target.checked })}
              style={{ accentColor: "#B8801F" }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: "#1C1008" }}>PDV sur grande voie</span>
          </label>
        </div>
      </div>
      {/* Right */}
      <div className="space-y-4">
        <SectionTitle icon={MapPin} label="Localisation" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <FormInput label="District *" value={data.district} onChange={(v) => onChange({ district: v })} />
          <FormInput label="Région *"   value={data.region}   onChange={(v) => onChange({ region: v })} />
          <FormInput label="Commune *"  value={data.commune}  onChange={(v) => onChange({ commune: v })} />
        </div>
        <FormInput label="Quartier" value={data.quartier || ""} onChange={(v) => onChange({ quartier: v })} placeholder="Quartier (optionnel)" />

        {/* Branding */}
        <div style={{ background: "#FAF7F0", borderRadius: 12, padding: 14, border: "0.5px solid #E8E0D4" }}>
          <SectionTitle icon={Award} label="Branding" />
          <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
            background: "#fff", borderRadius: 8, border: "0.5px solid #E8E0D4",
            cursor: "pointer", marginTop: 10, marginBottom: 10 }}>
            <input type="checkbox" checked={data.brander}
              onChange={(e) => onChange({ brander: e.target.checked, marque_brander: e.target.checked ? data.marque_brander : "", branding_image: e.target.checked ? (data.branding_image || "") : "" })}
              style={{ accentColor: "#B8801F" }} />
            <div>
              <span style={{ fontWeight: 600, color: "#1C1008", fontSize: 13 }}>Distributeur brandé</span>
              <p style={{ fontSize: 11, color: "#8A7A62" }}>Représente une marque spécifique</p>
            </div>
          </label>
          {data.brander && (
            <div className="space-y-3">
              <FormInput label="Marque *" value={data.marque_brander || ""} onChange={(v) => onChange({ marque_brander: v })} placeholder="Ex: Coca-Cola, Nestlé..." />
              <BrandingUpload src={data.branding_image || null} inputId={showStatus ? "branding-edit" : "branding-add"} />
            </div>
          )}
        </div>

        {/* GPS */}
        <div style={{ background: "#EAF2EC", borderRadius: 12, padding: 14, border: "0.5px solid #A8D4B0" }}>
          <SectionTitle icon={Target} label="Coordonnées GPS" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "10px 0" }}>
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#5C4A2A",
                textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Latitude</label>
              <input type="number" step="any" value={data.latitude ?? ""}
                onChange={(e) => onChange({ latitude: parseFloat(e.target.value) || 0 })} placeholder="5.3197"
                style={{ width: "100%", padding: "7px 10px", border: "0.5px solid #A8D4B0", borderRadius: 8,
                  fontSize: 12, background: "#fff", outline: "none", fontFamily: "inherit" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#5C4A2A",
                textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Longitude</label>
              <input type="number" step="any" value={data.longitude ?? ""}
                onChange={(e) => onChange({ longitude: parseFloat(e.target.value) || 0 })} placeholder="-4.0267"
                style={{ width: "100%", padding: "7px 10px", border: "0.5px solid #A8D4B0", borderRadius: 8,
                  fontSize: 12, background: "#fff", outline: "none", fontFamily: "inherit" }} />
            </div>
          </div>
          {!showStatus && (
            <button type="button" onClick={getCurrentLocation} disabled={isFetchingLocation}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                gap: 7, padding: "9px", borderRadius: 9, background: "#1A3A28", color: "#FAF7F0",
                fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
                opacity: isFetchingLocation ? 0.6 : 1, fontFamily: "inherit" }}>
              {isFetchingLocation ? <><Loader2 size={13} className="animate-spin" /> Localisation...</> : <><Navigation size={13} /> Ma position actuelle</>}
            </button>
          )}
          {locationError && (
            <p style={{ fontSize: 11, color: "#8B2020", marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
              <AlertCircle size={11} /> {locationError}
            </p>
          )}
        </div>

        {/* Agent */}
        <div style={{ background: "#FAF7F0", borderRadius: 12, padding: 14, border: "0.5px solid #E8E0D4" }}>
          <SectionTitle icon={Users} label="Collecte terrain" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
            <FormInput label="Nom de l'agent" value={data.agent_name || ""} onChange={(v) => onChange({ agent_name: v })} placeholder="Nom agent" />
            <FormInput label="Date collecte" type="date" value={data.date_collecte || ""} onChange={(v) => onChange({ date_collecte: v })} />
          </div>
        </div>
      </div>
    </div>
  );

  /* ── Modal wrapper ── */
  const ModalWrapper = ({ onClose, title, subtitle, headerBg, icon: Icon, children, footer }: any) => (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 18, width: "100%", maxWidth: 860,
        maxHeight: "92vh", display: "flex", flexDirection: "column", overflow: "hidden",
        boxShadow: "0 20px 60px rgba(26,58,40,0.18)" }}>
        {/* Header */}
        <div style={{ background: headerBg, flexShrink: 0 }}>
          <KenteStripe height={3} />
          <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, background: "rgba(250,247,240,0.2)", borderRadius: 10,
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={17} color="#FAF7F0" />
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#FAF7F0" }}>{title}</h3>
                <p style={{ fontSize: 11, color: "rgba(250,247,240,0.65)", marginTop: 1 }}>{subtitle}</p>
              </div>
            </div>
            <button onClick={onClose}
              style={{ padding: 6, background: "rgba(250,247,240,0.15)", border: "none", borderRadius: 8,
                cursor: "pointer", color: "rgba(250,247,240,0.7)", transition: "background 0.15s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(250,247,240,0.25)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(250,247,240,0.15)"; }}>
              <X size={16} />
            </button>
          </div>
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: 20 }} className="space-y-5">{children}</div>
        <div style={{ borderTop: "0.5px solid #E8E0D4", padding: "14px 20px",
          display: "flex", justifyContent: "flex-end", gap: 10, background: "#FAF7F0", flexShrink: 0 }}>
          {footer}
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  return (
    <div style={{ minHeight: "100vh", background: "#F5F3EE" }}>
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "16px 20px" }} className="space-y-5">

        {/* Error */}
        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
            background: "#FEF0EE", border: "0.5px solid #F5C4B3", borderRadius: 12, fontSize: 13, color: "#8B2020" }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{error}</span>
            <button onClick={() => setError(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>
              <X size={14} color="#8B2020" />
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
                  <div style={{ width: 4, height: 24, background: "#B8801F", borderRadius: 2 }} />
                  <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1C1008" }}>Gestion des Distributeurs</h1>
                </div>
                <p style={{ fontSize: 12, color: "#8A7A62", paddingLeft: 14 }}>Réseau commercial · Scores A/D/E · Éligibilités terrain</p>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <button onClick={() => setActiveView("carte")}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9,
                    border: "0.5px solid #D4C4A0", background: "#FAF7F0", color: "#1C1008", fontSize: 12,
                    fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#F2EDE0"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#FAF7F0"; }}>
                  <Map size={14} /> Vue Carte
                </button>
                <button onClick={() => setShowAddModal(true)}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9,
                    background: "#1A3A28", color: "#FAF7F0", fontSize: 12, fontWeight: 600,
                    border: "none", cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#254F38"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#1A3A28"; }}>
                  <Plus size={14} /> Nouveau Distributeur
                </button>
                <button onClick={downloadData}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9,
                    background: "#B8801F", color: "#FAF7F0", fontSize: 12, fontWeight: 600,
                    border: "none", cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#9A6A18"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#B8801F"; }}>
                  <Download size={14} /> Exporter CSV
                </button>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
              {statsCards.map((s, i) => (
                <div key={i} style={{ background: "#fff", border: "0.5px solid #E8E0D4", borderRadius: 14, overflow: "hidden" }}>
                  <KenteStripe height={3} />
                  <div style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                      <div>
                        <p style={{ fontSize: 10, color: "#8A7A62", fontWeight: 700, textTransform: "uppercase",
                          letterSpacing: "0.07em", marginBottom: 5 }}>{s.title}</p>
                        <p style={{ fontSize: 22, fontWeight: 700, color: "#1C1008", fontVariantNumeric: "tabular-nums" }}>{s.value}</p>
                        <p style={{ fontSize: 11, color: "#1A3A28", fontWeight: 600, marginTop: 3,
                          display: "flex", alignItems: "center", gap: 3 }}>
                          <TrendingUp size={10} /> {s.sub}
                        </p>
                      </div>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <s.icon size={18} color="#FAF7F0" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div style={{ background: "#fff", border: "0.5px solid #E8E0D4", borderRadius: 14, overflow: "hidden" }}>
              <KenteStripe height={2} />
              <div style={{ padding: 16 }} className="space-y-3">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                  <div style={{ position: "relative", flex: 1, maxWidth: 300 }}>
                    <Search size={14} color="#8A7A62" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
                    <input type="text" placeholder="Rechercher..." value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                      style={{ width: "100%", paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                        border: "0.5px solid #D4C4A0", borderRadius: 9, fontSize: 12, background: "#FAF7F0",
                        outline: "none", fontFamily: "inherit", color: "#1C1008" }} />
                  </div>
                  <FilterSelect value={filterStatus} onChange={(v) => { setFilterStatus(v); setCurrentPage(1); }}>
                    <option value="all">Tous statuts</option>
                    {statusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </FilterSelect>
                  <FilterSelect value={filterType} onChange={(v) => { setFilterType(v); setCurrentPage(1); }}>
                    <option value="all">Tous types</option>
                    {pointTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </FilterSelect>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#5C4A2A" }}>
                    <Filter size={13} />
                    <span style={{ fontWeight: 700, color: "#1C1008" }}>{filteredPoints.length}</span> résultats
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#8A7A62", textTransform: "uppercase", letterSpacing: "0.08em" }}>Géo :</span>
                  <FilterSelect value={filterDistrict} onChange={(v) => { setFilterDistrict(v); setCurrentPage(1); }}>
                    <option value="all">Districts</option>
                    {districts.map((d) => <option key={d} value={d}>{d}</option>)}
                  </FilterSelect>
                  <FilterSelect value={filterRegion} onChange={(v) => { setFilterRegion(v); setCurrentPage(1); }}>
                    <option value="all">Régions</option>
                    {regions.map((r) => <option key={r} value={r}>{r}</option>)}
                  </FilterSelect>
                  <FilterSelect value={filterCommune} onChange={(v) => { setFilterCommune(v); setCurrentPage(1); }}>
                    <option value="all">Communes</option>
                    {communes.map((c) => <option key={c} value={c}>{c}</option>)}
                  </FilterSelect>
                  <FilterSelect value={filterPotentiel} onChange={(v) => { setFilterPotentiel(v); setCurrentPage(1); }}>
                    <option value="all">Potentiel</option>
                    {potentielOptions.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </FilterSelect>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#8A7A62", textTransform: "uppercase", letterSpacing: "0.08em" }}>Branding :</span>
                  <FilterSelect value={filterBrander} onChange={(v) => { setFilterBrander(v); setCurrentPage(1); }}>
                    {branderOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </FilterSelect>
                  <FilterSelect value={filterMarqueBrander} onChange={(v) => { setFilterMarqueBrander(v); setCurrentPage(1); }} disabled={marquesBrander.length === 0}>
                    <option value="all">Toutes marques</option>
                    {marquesBrander.map((m) => <option key={m} value={m}>{m}</option>)}
                  </FilterSelect>
                  <button onClick={resetFilters}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
                      borderRadius: 8, border: "0.5px solid #D4C4A0", background: "#FAF7F0",
                      color: "#5C4A2A", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                    <X size={12} /> Réinitialiser
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 240,
                background: "#fff", border: "0.5px solid #E8E0D4", borderRadius: 14 }}>
                <div style={{ textAlign: "center" }}>
                  <Loader2 size={30} color="#B8801F" className="animate-spin" style={{ margin: "0 auto 10px" }} />
                  <p style={{ color: "#8A7A62", fontSize: 13 }}>Chargement des Distributeurs...</p>
                </div>
              </div>
            ) : (
              <div style={{ background: "#fff", border: "0.5px solid #E8E0D4", borderRadius: 14, overflow: "hidden" }}>
                <KenteStripe height={2} />
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#FAF7F0", borderBottom: "0.5px solid #E8E0D4" }}>
                        {["Distributeur","Contact","Type / Potentiel","Statut","Score A·D·E","Éligibilités","Photos","Actions"].map((h) => (
                          <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10,
                            fontWeight: 700, color: "#8A7A62", textTransform: "uppercase", letterSpacing: "0.07em",
                            whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((point, ri) => {
                        const badge = badgeFromScore(point.score_global);
                        const sOpts = getStatusOpts(point.status);
                        return (
                          <tr key={point.id} style={{ borderBottom: "0.5px solid #F5F3EE", transition: "background 0.1s" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#FDF9F5"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                            {/* Distributeur */}
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 42, height: 42, borderRadius: 10, overflow: "hidden",
                                  background: "#EAF2EC", display: "flex", alignItems: "center",
                                  justifyContent: "center", flexShrink: 0, border: "0.5px solid #A8D4B0" }}>
                                  {point.avatar
                                    ? <img src={point.avatar} alt={point.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                    : <Store size={16} color="#1A3A28" />}
                                </div>
                                <div>
                                  <p style={{ fontWeight: 700, color: "#1C1008", lineHeight: 1.3 }}>{point.name}</p>
                                  <p style={{ fontSize: 10, color: "#8A7A62", marginTop: 2, display: "flex", alignItems: "center", gap: 3 }}>
                                    <MapPin size={10} />{point.commune}{point.quartier ? ` · ${point.quartier}` : ""}
                                  </p>
                                  {point.brander && point.marque_brander && (
                                    <span style={{ fontSize: 10, color: "#6B3A9E", fontWeight: 600, marginTop: 2, display: "flex", alignItems: "center", gap: 3 }}>
                                      <Award size={9} />{point.marque_brander}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            {/* Contact */}
                            <td style={{ padding: "12px 16px" }}>
                              <p style={{ fontWeight: 600, color: "#1C1008" }}>{point.owner}</p>
                              <p style={{ fontSize: 10, color: "#8A7A62", marginTop: 2, display: "flex", alignItems: "center", gap: 3 }}>
                                <Phone size={10} />{point.phone}
                              </p>
                              {point.agent_name && (
                                <p style={{ fontSize: 10, color: "#B8801F", marginTop: 2, display: "flex", alignItems: "center", gap: 3 }}>
                                  <Users size={9} />Agent: {point.agent_name}
                                </p>
                              )}
                            </td>
                            {/* Type */}
                            <td style={{ padding: "12px 16px" }}>
                              <span style={{ display: "inline-block", padding: "3px 8px", borderRadius: 20,
                                fontSize: 10, fontWeight: 700, background: "#EAF2EC",
                                color: "#1A3A28", border: "0.5px solid #A8D4B0", marginBottom: 4 }}>
                                {getTypeLabel(point.type)}
                              </span>
                              <p style={{ fontSize: 10, color: "#8A7A62" }}>{point.potentiel_label}</p>
                            </td>
                            {/* Status */}
                            <td style={{ padding: "12px 16px" }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 4,
                                padding: "4px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700,
                                background: sOpts.bg, color: sOpts.color, border: `0.5px solid ${sOpts.border}` }}>
                                {getStatusIcon(point.status)}{getStatusLabel(point.status)}
                              </span>
                              <p style={{ fontSize: 10, marginTop: 4, display: "flex", alignItems: "center", gap: 3,
                                color: point.gps_valid ? "#1A3A28" : "#B8801F" }}>
                                {point.gps_valid
                                  ? <><CheckCircle2 size={10} /> GPS OK</>
                                  : <><AlertCircle size={10} /> GPS manquant</>}
                              </p>
                            </td>
                            {/* Scores */}
                            <td style={{ padding: "12px 16px" }}>
                              <span style={{ display: "inline-block", padding: "3px 8px", borderRadius: 20,
                                fontSize: 10, fontWeight: 700, background: badge.bg, color: badge.color,
                                border: `0.5px solid ${badge.border}`, marginBottom: 5 }}>
                                {point.score_global}/100
                              </span>
                              <div style={{ display: "flex", gap: 3 }}>
                                <ScorePill label="A" value={point.score_a} bg="#6B3A9E" />
                                <ScorePill label="D" value={point.score_d} bg="#1A3A28" />
                                <ScorePill label="E" value={point.score_e} bg="#B8801F" />
                              </div>
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
                                  borderRadius: 9, fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "background 0.15s",
                                  background: (point.photos_count || 0) >= MIN_PHOTOS ? "#EAF2EC" : "#FDF3E0",
                                  color: (point.photos_count || 0) >= MIN_PHOTOS ? "#1A3A28" : "#B8801F",
                                  border: `0.5px solid ${(point.photos_count || 0) >= MIN_PHOTOS ? "#A8D4B0" : "#F0D0A0"}` }}>
                                <Camera size={11} />
                                {point.photos_count || 0}
                                {(point.photos_count || 0) < MIN_PHOTOS && <span>/{MIN_PHOTOS}</span>}
                              </button>
                            </td>
                            {/* Actions */}
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ display: "flex", alignItems: "center" }}>
                                <ActionBtn onClick={() => { fetchPointDetail(point.id); setActiveView("detail"); }} title="Voir" bgHover="#EAF2EC">
                                  <Eye size={14} color="#1A3A28" />
                                </ActionBtn>
                                <ActionBtn onClick={() => { setEditingPoint(point); setAvatarFile(null); setBrandingImageFile(null); setEditPhotos([]); }} title="Modifier" bgHover="#FDF3E0">
                                  <Edit size={14} color="#B8801F" />
                                </ActionBtn>
                                <ActionBtn onClick={() => handleDeletePoint(point.id)} title="Supprimer" bgHover="#FEF0EE">
                                  <Trash2 size={14} color="#8B2020" />
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
                    <div style={{ width: 52, height: 52, background: "#F5F3EE", borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                      <Store size={20} color="#8A7A62" />
                    </div>
                    <h3 style={{ fontWeight: 700, color: "#1C1008", marginBottom: 6 }}>Aucun Distributeur trouvé</h3>
                    <p style={{ fontSize: 12, color: "#8A7A62", marginBottom: 16 }}>Ajustez vos filtres pour trouver des résultats.</p>
                    <button onClick={resetFilters}
                      style={{ padding: "8px 18px", background: "#1A3A28", color: "#FAF7F0", borderRadius: 9,
                        fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                      Réinitialiser
                    </button>
                  </div>
                )}

                {/* Pagination */}
                {filteredPoints.length > 0 && (
                  <div style={{ padding: "12px 16px", borderTop: "0.5px solid #F5F3EE", background: "#FAF7F0",
                    display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#5C4A2A" }}>
                      <span>Lignes :</span>
                      <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                        style={{ padding: "4px 8px", border: "0.5px solid #D4C4A0", borderRadius: 7,
                          fontSize: 12, background: "#fff", outline: "none", fontFamily: "inherit" }}>
                        {[5,10,25,50].map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                      <span>{indexOfFirst + 1}–{Math.min(indexOfFirst + itemsPerPage, filteredPoints.length)} sur {filteredPoints.length}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <PagBtn onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}><ChevronLeft size={14} /></PagBtn>
                      {paginationRange(currentPage, totalPages).map((p, i) =>
                        p === "..." ? <span key={i} style={{ padding: "0 6px", color: "#8A7A62", fontSize: 12 }}>…</span>
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
                  <div style={{ width: 4, height: 24, background: "#B8801F", borderRadius: 2 }} />
                  <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1C1008" }}>Carte des Distributeurs</h1>
                </div>
                <p style={{ fontSize: 12, color: "#8A7A62", paddingLeft: 14 }}>
                  {filteredPoints.filter((p) => isValidCoord(p.latitude)).length} PDV géolocalisés
                </p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={downloadData}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9,
                    background: "#B8801F", color: "#FAF7F0", fontSize: 12, fontWeight: 600,
                    border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                  <Download size={14} /> Exporter
                </button>
                <button onClick={() => setActiveView("liste")}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9,
                    border: "0.5px solid #D4C4A0", background: "#FAF7F0", color: "#1C1008",
                    fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  <ChevronLeft size={14} /> Retour
                </button>
              </div>
            </div>
            <div style={{ background: "#fff", border: "0.5px solid #E8E0D4", borderRadius: 14, overflow: "hidden", height: 560 }}>
              <MapWithNoSSR
                points={filteredPoints}
                center={[5.3599517, -4.0082563]}
                zoom={12}
                onPointClick={(p: PointOfSale) => { fetchPointDetail(p.id); setActiveView("detail"); }}
                showAvatars={true}
              />
            </div>
          </>
        )}

        {/* ══════════════ DETAIL VIEW ══════════════ */}
        {activeView === "detail" && selectedPoint && (() => {
          const p = selectedPoint;
          const badge = badgeFromScore(p.score_global);
          const photos = detailPhotos;
          const photosOk = photos.length >= MIN_PHOTOS;
          const coveredPhotoTypes = new Set(photos.map((ph) => ph.type));
          const requiredPhotoTypes = ["facade","interieur","axe_principal","environnement"];

          return (
            <div className="space-y-5">
              {/* Hero banner */}
              <div style={{ borderRadius: 16, background: "#1A3A28", overflow: "hidden", position: "relative" }}>
                <KenteStripe height={3} />
                <div style={{ position: "relative", height: 180 }}>
                  {p.avatar && <img src={p.avatar} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.3 }} />}
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)" }} />
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 24px 20px",
                    display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 14 }}>
                      <div style={{ width: 72, height: 72, borderRadius: 14, overflow: "hidden",
                        border: "3px solid white", background: "#fff", flexShrink: 0 }}>
                        {p.avatar
                          ? <img src={p.avatar} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#EAF2EC" }}>
                              <Store size={22} color="#1A3A28" />
                            </div>}
                      </div>
                      <div style={{ marginBottom: 4 }}>
                        <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 20,
                          fontSize: 10, fontWeight: 700, background: badge.bg, color: badge.color,
                          border: `0.5px solid ${badge.border}`, marginBottom: 5 }}>
                          {badge.label}
                        </span>
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: "white" }}>{p.name}</h2>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 2,
                          display: "flex", alignItems: "center", gap: 4 }}>
                          <MapPin size={11} />{p.commune}{p.quartier ? ` · ${p.quartier}` : ""} · {getTypeLabel(p.type)}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setActiveView("liste")}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px",
                        background: "rgba(250,247,240,0.15)", border: "0.5px solid rgba(250,247,240,0.3)",
                        borderRadius: 9, color: "white", fontSize: 11, fontWeight: 600, cursor: "pointer",
                        fontFamily: "inherit" }}>
                      <ChevronLeft size={12} /> Retour
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
                {/* Main column */}
                <div className="space-y-4">

                  {/* General info */}
                  <div style={{ background: "#fff", border: "0.5px solid #E8E0D4", borderRadius: 14, overflow: "hidden" }}>
                    <KenteStripe height={2} />
                    <div style={{ padding: 18 }}>
                      <h4 style={{ fontSize: 11, fontWeight: 700, color: "#1C1008", textTransform: "uppercase",
                        letterSpacing: "0.07em", marginBottom: 14 }}>Informations générales</h4>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        {[
                          { icon: User,      label: "Propriétaire",    value: p.owner },
                          { icon: Phone,     label: "Téléphone",       value: p.phone },
                          { icon: Mail,      label: "Email",           value: p.email },
                          { icon: Building2, label: "Type",            value: getTypeLabel(p.type) },
                          { icon: Gauge,     label: "Potentiel",       value: p.potentiel_label },
                          { icon: Calendar,  label: "Inscription",     value: p.registration_date },
                          { icon: Users,     label: "Agent collecteur",value: p.agent_name || p.agent || "—" },
                          { icon: Calendar,  label: "Date collecte",   value: p.date_collecte || "—" },
                        ].map(({ icon: Icon, label, value }) => (
                          <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: 10,
                            padding: 10, background: "#FAF7F0", borderRadius: 10 }}>
                            <div style={{ padding: 6, background: "#fff", borderRadius: 7,
                              border: "0.5px solid #E8E0D4", flexShrink: 0 }}>
                              <Icon size={13} color="#B8801F" />
                            </div>
                            <div>
                              <p style={{ fontSize: 10, color: "#8A7A62", fontWeight: 600 }}>{label}</p>
                              <p style={{ fontWeight: 600, color: "#1C1008", fontSize: 12, marginTop: 1 }}>{value || "—"}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Photos section */}
                  <div style={{ background: "#fff", border: "0.5px solid #E8E0D4", borderRadius: 14, overflow: "hidden" }}>
                    <KenteStripe height={2} />
                    <div style={{ padding: 18 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                        <h4 style={{ fontSize: 11, fontWeight: 700, color: "#1C1008", textTransform: "uppercase",
                          letterSpacing: "0.07em", display: "flex", alignItems: "center", gap: 6 }}>
                          <Camera size={13} color="#B8801F" /> Photos du PDV
                          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 700,
                            background: photosOk ? "#EAF2EC" : "#FDF3E0",
                            color: photosOk ? "#1A3A28" : "#B8801F",
                            border: `0.5px solid ${photosOk ? "#A8D4B0" : "#F0D0A0"}` }}>
                            {photos.length}/{MIN_PHOTOS} min
                          </span>
                        </h4>
                        <button onClick={() => { setPhotosModalPoint(p); setPhotosModalItems([]); setShowPhotosModal(true); }}
                          style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
                            borderRadius: 8, background: "#1A3A28", color: "#FAF7F0", fontSize: 11,
                            fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                          <Plus size={12} /> Ajouter des photos
                        </button>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 12 }}>
                        {requiredPhotoTypes.map((type) => {
                          const covered = coveredPhotoTypes.has(type);
                          const info = PHOTO_TYPES.find((t) => t.value === type)!;
                          return (
                            <div key={type} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 8px",
                              borderRadius: 8, fontSize: 10, fontWeight: 600,
                              background: covered ? "#EAF2EC" : "#F5F3EE",
                              border: `0.5px solid ${covered ? "#A8D4B0" : "#E8E0D4"}`,
                              color: covered ? "#1A3A28" : "#8A7A62" }}>
                              {covered
                                ? <CheckCircle2 size={11} color="#1A3A28" style={{ flexShrink: 0 }} />
                                : <div style={{ width: 11, height: 11, borderRadius: "50%", border: "2px solid #D4C4A0", flexShrink: 0 }} />}
                              {info.icon} {info.label}
                            </div>
                          );
                        })}
                      </div>
                      {photos.length === 0 ? (
                        <div onClick={() => { setPhotosModalPoint(p); setPhotosModalItems([]); setShowPhotosModal(true); }}
                          style={{ border: "2px dashed #D4C4A0", borderRadius: 14, padding: 32,
                            textAlign: "center", cursor: "pointer", background: "#FAF7F0" }}>
                          <div style={{ width: 44, height: 44, background: "#EAF2EC", borderRadius: 12,
                            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                            <Camera size={20} color="#1A3A28" />
                          </div>
                          <p style={{ fontWeight: 600, color: "#1C1008", fontSize: 13, marginBottom: 4 }}>Aucune photo enregistrée</p>
                          <p style={{ fontSize: 11, color: "#8A7A62" }}>Cliquez pour ajouter au moins 4 photos</p>
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
                              style={{ aspectRatio: "1", border: "2px dashed #A8D4B0", borderRadius: 12,
                                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", background: "#EAF2EC", transition: "all 0.15s" }}>
                              <Plus size={18} color="#1A3A28" />
                              <span style={{ fontSize: 10, color: "#1A3A28", fontWeight: 600, textAlign: "center",
                                marginTop: 4, padding: "0 6px" }}>
                                +{MIN_PHOTOS - photos.length}<br/>photo(s)
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Analysis A/D/E */}
                  <div style={{ background: "#fff", border: "0.5px solid #E8E0D4", borderRadius: 14, overflow: "hidden" }}>
                    <KenteStripe height={2} />
                    <div style={{ padding: 18 }}>
                      <h4 style={{ fontSize: 11, fontWeight: 700, color: "#1C1008", textTransform: "uppercase",
                        letterSpacing: "0.07em", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                        <Target size={13} color="#B8801F" /> Analyse stratégique A · D · E
                      </h4>
                      <div className="space-y-4">
                        <ProgressBarFull label="A — Branding & disponibilité média" value={p.score_a} max={25} bg="#6B3A9E" />
                        <ProgressBarFull label="D — Potentiel commercial"           value={p.score_d} max={40} bg="#1A3A28" />
                        <ProgressBarFull label="E — Environnement stratégique"      value={p.score_e} max={35} bg="#B8801F" />
                      </div>
                      <div style={{ background: "#EAF2EC", border: "0.5px solid #A8D4B0", borderRadius: 10,
                        padding: "10px 14px", marginTop: 14, fontSize: 11, color: "#5C4A2A", lineHeight: 1.6 }}>
                        <span style={{ fontWeight: 700, color: "#1C1008" }}>Diagnostic : </span>
                        PDV {p.brander ? "déjà brandé" : "non brandé"}, visibilité {p.visibilite}/100,
                        accessibilité {p.accessibilite}/100, affluence {p.affluence}/100,
                        digitalisation {p.digitalisation}/100.{" "}
                        <span style={{ fontWeight: 600, color: p.eligibilite_branding ? "#1A3A28" : "#8A7A62" }}>
                          {p.eligibilite_branding
                            ? "Immédiatement exploitable pour une offre branding."
                            : "À suivre selon le ciblage commercial."}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Map */}
                  <div style={{ background: "#fff", border: "0.5px solid #E8E0D4", borderRadius: 14, overflow: "hidden" }}>
                    <KenteStripe height={2} />
                    <div style={{ padding: 18 }}>
                      <h4 style={{ fontSize: 11, fontWeight: 700, color: "#1C1008", textTransform: "uppercase",
                        letterSpacing: "0.07em", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                        <MapPin size={13} color="#B8801F" /> Localisation
                      </h4>
                      <div style={{ height: 200, borderRadius: 10, overflow: "hidden",
                        border: "0.5px solid #E8E0D4", marginBottom: 12 }}>
                        <MapWithNoSSR
                          points={[p]}
                          center={[isValidCoord(p.latitude) ? p.latitude : 5.3599517, isValidCoord(p.longitude) ? p.longitude : -4.0082563]}
                          zoom={15} onPointClick={() => {}} singleMarker showAvatars={true} />
                      </div>
                      <div style={{ padding: "10px 14px", background: "#EAF2EC", borderRadius: 10,
                        border: "0.5px solid #A8D4B0", display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 10 }}>
                        <MapPin size={14} color="#1A3A28" style={{ flexShrink: 0, marginTop: 1 }} />
                        <p style={{ fontSize: 12, color: "#1C1008" }}>{p.address}</p>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                        {[{ l: "District", v: p.district }, { l: "Région", v: p.region }, { l: "Commune", v: p.commune }].map(({ l, v }) => (
                          <div key={l} style={{ padding: 10, background: "#FAF7F0", borderRadius: 9, textAlign: "center",
                            border: "0.5px solid #E8E0D4" }}>
                            <p style={{ fontSize: 10, color: "#8A7A62", fontWeight: 600 }}>{l}</p>
                            <p style={{ fontWeight: 700, color: "#1C1008", fontSize: 12, marginTop: 2 }}>{v || "—"}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Side column */}
                <div className="space-y-4">
                  {/* Score card */}
                  <div style={{ background: "#1A3A28", borderRadius: 14, overflow: "hidden" }}>
                    <KenteStripe height={3} />
                    <div style={{ padding: 16 }}>
                      <h4 style={{ fontSize: 11, fontWeight: 700, color: "#FAF7F0", marginBottom: 12,
                        display: "flex", alignItems: "center", gap: 6 }}>
                        <BarChart3 size={13} /> Performance
                      </h4>
                      <div style={{ background: "rgba(250,247,240,0.12)", borderRadius: 10,
                        padding: 14, textAlign: "center", marginBottom: 10 }}>
                        <p style={{ fontSize: 36, fontWeight: 700, color: "#FAF7F0" }}>{p.score_global}</p>
                        <p style={{ fontSize: 10, color: "rgba(250,247,240,0.55)", marginTop: 2 }}>Score global /100</p>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 7 }}>
                        {[["A", p.score_a, 25], ["D", p.score_d, 40], ["E", p.score_e, 35]].map(([l, v, m]) => (
                          <div key={l as string} style={{ background: "rgba(250,247,240,0.1)", borderRadius: 9,
                            padding: 9, textAlign: "center" }}>
                            <p style={{ fontSize: 16, fontWeight: 700, color: "#FAF7F0" }}>{v}</p>
                            <p style={{ fontSize: 9, color: "rgba(250,247,240,0.45)" }}>/{m}</p>
                            <p style={{ fontSize: 10, fontWeight: 700, color: "#E8C050" }}>{l}</p>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginTop: 8 }}>
                        <div style={{ background: "rgba(250,247,240,0.1)", borderRadius: 9, padding: 9, textAlign: "center" }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: "#E8C050" }}>₣ {fmt(parseFloat(p.monthly_turnover || "0"))}</p>
                          <p style={{ fontSize: 9, color: "rgba(250,247,240,0.5)", marginTop: 1 }}>CA mensuel</p>
                        </div>
                        <div style={{ background: "rgba(250,247,240,0.1)", borderRadius: 9, padding: 9, textAlign: "center" }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: "#FAF7F0" }}>{p.monthly_orders}</p>
                          <p style={{ fontSize: 9, color: "rgba(250,247,240,0.5)", marginTop: 1 }}>Commandes</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Eligibilities */}
                  <div style={{ background: "#fff", border: "0.5px solid #E8E0D4", borderRadius: 14, overflow: "hidden" }}>
                    <KenteStripe height={2} />
                    <div style={{ padding: 16 }}>
                      <h4 style={{ fontSize: 11, fontWeight: 700, color: "#1C1008", textTransform: "uppercase",
                        letterSpacing: "0.07em", marginBottom: 12 }}>Éligibilités</h4>
                      <div className="space-y-2">
                        {[
                          { label: "Branding",        ok: p.eligibilite_branding },
                          { label: "Exclusivité",      ok: p.eligibilite_exclusivite },
                          { label: "Activation promo", ok: p.eligibilite_activation },
                          { label: "GPS valide",       ok: p.gps_valid },
                          { label: "Fiche complète",   ok: p.fiche_complete },
                          { label: "Grande voie",      ok: p.grande_voie },
                        ].map(({ label, ok }) => (
                          <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "7px 10px", borderRadius: 8, background: "#FAF7F0", border: "0.5px solid #E8E0D4" }}>
                            <span style={{ fontSize: 11, color: "#5C4A2A", fontWeight: 500 }}>{label}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: ok ? "#1A3A28" : "#8A7A62",
                              display: "flex", alignItems: "center", gap: 3 }}>
                              {ok ? <><CheckCircle2 size={11} /> Oui</> : "—"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Branding info */}
                  <div style={{ background: "#fff", border: "0.5px solid #E8E0D4", borderRadius: 14, overflow: "hidden" }}>
                    <KenteStripe height={2} />
                    <div style={{ padding: 16 }}>
                      <h4 style={{ fontSize: 11, fontWeight: 700, color: "#1C1008", textTransform: "uppercase",
                        letterSpacing: "0.07em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                        <Award size={13} color="#B8801F" /> Branding
                      </h4>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "7px 10px", borderRadius: 8, background: "#FAF7F0",
                        border: "0.5px solid #E8E0D4", marginBottom: 8 }}>
                        <span style={{ fontSize: 11, color: "#5C4A2A" }}>Est brandé</span>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                          background: p.brander ? "#F0EBF8" : "#F5F3EE",
                          color: p.brander ? "#6B3A9E" : "#8A7A62",
                          border: `0.5px solid ${p.brander ? "#D4C0F0" : "#E8E0D4"}` }}>
                          {p.brander ? "Oui" : "Non"}
                        </span>
                      </div>
                      {p.brander && p.marque_brander && (
                        <p style={{ padding: "7px 10px", background: "#F0EBF8", borderRadius: 8,
                          fontWeight: 700, color: "#6B3A9E", fontSize: 12, border: "0.5px solid #D4C0F0", marginBottom: 8 }}>
                          {p.marque_brander}
                        </p>
                      )}
                      {p.brander && p.branding_image && (
                        <div style={{ position: "relative", height: 120, borderRadius: 10, overflow: "hidden",
                          border: "0.5px solid #D4C0F0" }}>
                          <img src={p.branding_image} alt="branding" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.3), transparent)" }} />
                          {p.marque_brander && (
                            <span style={{ position: "absolute", bottom: 7, left: 7, padding: "2px 8px",
                              background: "rgba(255,255,255,0.2)", borderRadius: 20, fontSize: 10, color: "white",
                              fontWeight: 600, backdropFilter: "blur(4px)" }}>
                              {p.marque_brander}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Evaluation */}
                  <div style={{ background: "#fff", border: "0.5px solid #E8E0D4", borderRadius: 14, overflow: "hidden" }}>
                    <KenteStripe height={2} />
                    <div style={{ padding: 16, textAlign: "center" }}>
                      <h4 style={{ fontSize: 11, fontWeight: 700, color: "#1C1008", textTransform: "uppercase",
                        letterSpacing: "0.07em", marginBottom: 12 }}>Évaluation</h4>
                      <div style={{ display: "flex", justifyContent: "center", gap: 2, marginBottom: 6 }}>
                        {[1,2,3,4,5].map((s) => (
                          <Star key={s} size={20} style={{ color: s <= p.evaluation_score ? "#E8C050" : "#E8E0D4",
                            fill: s <= p.evaluation_score ? "#E8C050" : "#E8E0D4" }} />
                        ))}
                      </div>
                      <p style={{ fontSize: 28, fontWeight: 700, color: "#1C1008" }}>
                        {p.evaluation_score}<span style={{ fontSize: 14, color: "#8A7A62" }}>/5</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    {[
                      { label: "Modifier les informations", bg: "#1A3A28", hbg: "#254F38", icon: Edit,
                        action: () => { setEditingPoint(p); setSelectedPoint(null); setEditPhotos([]); } },
                      { label: `Gérer les photos (${photos.length})`, bg: "#6B3A9E", hbg: "#5A2E8A", icon: Camera,
                        action: () => { setPhotosModalPoint(p); setPhotosModalItems([]); setShowPhotosModal(true); } },
                      { label: "Supprimer le Distributeur", bg: "#8B2020", hbg: "#6E1A1A", icon: Trash2,
                        action: () => { handleDeletePoint(p.id); setActiveView("liste"); } },
                    ].map((btn) => (
                      <button key={btn.label} onClick={btn.action}
                        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                          gap: 7, padding: "10px", borderRadius: 10, background: btn.bg, color: "#FAF7F0",
                          fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
                          fontFamily: "inherit", transition: "background 0.15s" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = btn.hbg; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = btn.bg; }}>
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
            headerBg="#1A3A28"
            icon={Plus}
            footer={
              <>
                <button onClick={() => { setShowAddModal(false); setNewPoint(emptyForm()); setAddPhotos([]); }}
                  style={{ padding: "9px 18px", borderRadius: 9, border: "0.5px solid #D4C4A0", background: "#FAF7F0",
                    color: "#1C1008", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  Annuler
                </button>
                <button onClick={handleAddPoint} disabled={!isAddFormValid || actionLoading}
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 9,
                    background: "#1A3A28", color: "#FAF7F0", fontSize: 12, fontWeight: 600,
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
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#8A7A62",
                textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Adresse complète *</label>
              <textarea value={newPoint.address} onChange={(e) => setNewPoint((p) => ({ ...p, address: e.target.value }))}
                rows={2} placeholder="Adresse complète avec quartier, commune, ville..."
                style={{ width: "100%", padding: "8px 12px", border: "0.5px solid #D4C4A0", borderRadius: 9,
                  fontSize: 13, background: "#FAF7F0", outline: "none", fontFamily: "inherit",
                  color: "#1C1008", resize: "none" }} />
            </div>
            <div style={{ borderTop: "0.5px solid #E8E0D4", paddingTop: 18 }}>
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
            headerBg="#B8801F"
            icon={Edit}
            footer={
              <>
                <button onClick={() => setEditingPoint(null)}
                  style={{ padding: "9px 18px", borderRadius: 9, border: "0.5px solid #D4C4A0", background: "#FAF7F0",
                    color: "#1C1008", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  Annuler
                </button>
                <button onClick={handleUpdatePoint} disabled={!isEditFormValid || actionLoading}
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 9,
                    background: "#B8801F", color: "#FAF7F0", fontSize: 12, fontWeight: 600,
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
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#8A7A62",
                textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Adresse complète *</label>
              <textarea value={editingPoint.address} onChange={(e) => setEditingPoint((p) => p ? { ...p, address: e.target.value } : null)}
                rows={2}
                style={{ width: "100%", padding: "8px 12px", border: "0.5px solid #D4C4A0", borderRadius: 9,
                  fontSize: 13, background: "#FAF7F0", outline: "none", fontFamily: "inherit",
                  color: "#1C1008", resize: "none" }} />
            </div>
            <div style={{ borderTop: "0.5px solid #E8E0D4", paddingTop: 18 }}>
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
            <div style={{ background: "#fff", borderRadius: 18, width: "100%", maxWidth: 640,
              maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden",
              boxShadow: "0 20px 60px rgba(26,58,40,0.18)" }}>
              <div style={{ background: "#6B3A9E", flexShrink: 0 }}>
                <KenteStripe height={3} />
                <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, background: "rgba(250,247,240,0.2)", borderRadius: 10,
                      display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Camera size={16} color="#FAF7F0" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#FAF7F0" }}>Photos du PDV</h3>
                      <p style={{ fontSize: 11, color: "rgba(250,247,240,0.65)", marginTop: 1 }}>
                        {photosModalPoint.name} · {detailPhotos.length} photo(s) enregistrée(s)
                      </p>
                    </div>
                  </div>
                  <button onClick={() => { setShowPhotosModal(false); setPhotosModalItems([]); }}
                    style={{ padding: 6, background: "rgba(250,247,240,0.15)", border: "none", borderRadius: 8,
                      cursor: "pointer", color: "rgba(250,247,240,0.7)" }}>
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
              <div style={{ borderTop: "0.5px solid #E8E0D4", padding: "14px 20px",
                display: "flex", justifyContent: "flex-end", gap: 10, background: "#FAF7F0", flexShrink: 0 }}>
                <button onClick={() => { setShowPhotosModal(false); setPhotosModalItems([]); }}
                  style={{ padding: "9px 18px", borderRadius: 9, border: "0.5px solid #D4C4A0", background: "#FAF7F0",
                    color: "#1C1008", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  Fermer
                </button>
                {photosModalItems.length > 0 && (
                  <button onClick={handleUploadPhotosModal} disabled={photosUploading}
                    style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 9,
                      background: "#6B3A9E", color: "#FAF7F0", fontSize: 12, fontWeight: 600,
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