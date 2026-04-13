"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Package, Plus, Search, Edit, Trash2,
  AlertTriangle, TrendingUp, TrendingDown,
  Upload, RefreshCw, X,
  BarChart3, Clock,
  Save, DollarSign, Image as ImageIcon,
  CheckCircle, ArrowUpRight,
  Tag, FolderOpen, Box, Database, AlertCircle
} from 'lucide-react';
import { apiService } from './ApiService';

/* ─────────────────────────── Palette LanfiaLink ─────────────────────────── */
// Vert forêt   #2D5A3D  — principal, navigation active
// Ocre doré    #C07A2F  — accent, CTA secondaire
// Or pâle      #F0C878  — highlight, kente
// Crème ivoire #FAF7F0  — fond général
// Sable chaud  #F2EDE0  — surfaces, inputs
// Brun texte   #2A1A08  — texte principal
// Brun moyen   #7A6A52  — labels
// Beige border #D4C4A0  — bordures
// Sable mid    #A89880  — texte secondaire

const C = {
  green:        '#2D5A3D',
  greenHover:   '#3E7A54',
  greenLight:   '#EAF2EC',
  ocre:         '#C07A2F',
  ocreLight:    '#FFF3E8',
  ocreBorder:   '#E8C090',
  ocreDark:     '#9A5E1A',
  gold:         '#F0C878',
  ivory:        '#FAF7F0',
  sand:         '#F2EDE0',
  sandBorder:   '#D4C4A0',
  sandMid:      '#E8D9B8',
  textMain:     '#2A1A08',
  textLabel:    '#7A6A52',
  textMuted:    '#A89880',
  white:        '#FFFFFF',
  // Alertes conservées sémantiquement mais réchauffées
  dangerBg:     '#FEF2F2',
  dangerText:   '#991B1B',
  dangerBorder: '#FECACA',
  warnBg:       '#FFFBEB',
  warnText:     '#92400E',
  warnBorder:   '#FDE68A',
  successBg:    '#ECFDF5',
  successText:  '#065F46',
  successBorder:'#A7F3D0',
  infoBg:       '#EFF6FF',
  infoText:     '#1E40AF',
  infoBorder:   '#BFDBFE',
};

/* ─────────────────────────── types ─────────────────────────── */
interface Product {
  id: string;
  name: string;
  category: { id: number; name: string };
  sku: string;
  supplier: { id: number; name: string };
  point_of_sale: { id: string; name: string };
  description?: string;
  main_image?: string;
  status: 'en_stock' | 'stock_faible' | 'rupture' | 'surstockage';
  last_updated: string;
  created_at: string;
}

interface ProductVariant {
  id: string;
  product_id: string;
  product: { id: string; name: string };
  format: { id: number; name: string; description?: string };
  current_stock: number;
  min_stock: number;
  max_stock: number;
  price: number;
  barcode: string;
  image?: string | File;
}

interface ProductFormat { id: number; name: string; description?: string }

interface Category {
  id: number; name: string; description: string;
  image: string | null; created_at?: string; updated_at?: string;
}

interface StockMovement {
  id: string;
  product: { id: string; name: string };
  product_variant?: { id: string; name: string };
  type: 'entree' | 'sortie' | 'ajustement';
  quantity: number;
  date: string;
  reason: string;
  user: { username: string };
}

interface NewProduct {
  name: string; category_id: number | ''; sku: string;
  supplier_id: number | ''; point_of_sale_id: string;
  description: string; status: 'en_stock' | 'stock_faible' | 'rupture' | 'surstockage';
  main_image?: File;
}

interface NewVariant {
  product_id: string; format_id: number | ''; current_stock: number;
  min_stock: number; max_stock: number; price: number; barcode: string; image?: File;
}

interface NewFormat { name: string; description: string }

interface NewMovement {
  product_variant_id: string | ''; type: 'entree' | 'sortie' | 'ajustement' | '';
  quantity: number; reason: string;
}

interface Supplier { id: number; name: string }
interface PointOfSale { id: string; name: string }

interface OverviewData {
  total_products: number; stock_value: number;
  alert_count: number; today_movements: number; critical_products: Product[];
}

/* ─────────────────────────── Modal ─────────────────────────── */
const Modal = ({
  isOpen, onClose, title, error, children
}: {
  isOpen: boolean; onClose: () => void; title: string; error?: string | null; children: React.ReactNode;
}) => {
  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(42,26,8,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50, padding: '1rem'
    }}>
      <div style={{
        background: C.ivory, borderRadius: 20,
        boxShadow: '0 24px 48px rgba(42,26,8,0.18)',
        maxWidth: 680, width: '100%', maxHeight: '90vh', overflowY: 'auto',
        border: `1px solid ${C.sandBorder}`
      }}>
        {/* Header avec bande kente */}
        <div style={{
          height: 4,
          background: `linear-gradient(90deg,${C.ocreDark} 0%,${C.ocre} 40%,${C.ocreDark} 100%)`,
          borderRadius: '20px 20px 0 0'
        }} />
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.25rem 1.5rem', borderBottom: `1px solid ${C.sandMid}`,
          background: C.sand, borderRadius: '0'
        }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.textMain }}>{title}</h2>
          <button onClick={onClose} style={{
            padding: 8, background: 'none', border: 'none', cursor: 'pointer',
            borderRadius: '50%', display: 'flex', alignItems: 'center',
            color: C.textMuted
          }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: '1.5rem', background: C.ivory }}>
          {error && (
            <div style={{
              marginBottom: 16, padding: '12px 16px', background: C.ocreLight,
              color: C.ocreDark, borderRadius: 12, border: `1px solid ${C.ocreBorder}`,
              fontWeight: 500, fontSize: 13
            }}>{error}</div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────── helpers ─────────────────────────── */
const statusColor = (s: string) => {
  switch (s) {
    case 'en_stock':    return { bg: C.successBg, text: C.successText, border: C.successBorder };
    case 'stock_faible':return { bg: C.warnBg,    text: C.warnText,    border: C.warnBorder    };
    case 'rupture':     return { bg: C.dangerBg,  text: C.dangerText,  border: C.dangerBorder  };
    case 'surstockage': return { bg: C.infoBg,    text: C.infoText,    border: C.infoBorder    };
    default: return { bg: C.sand, text: C.textLabel, border: C.sandBorder };
  }
};

const statusLabel = (s: string) => ({
  en_stock: 'En stock', stock_faible: 'Stock faible',
  rupture: 'Rupture', surstockage: 'Surstockage'
}[s] ?? s);

const movTypeColor   = (t: string) => ({ entree: C.successBg, sortie: C.dangerBg,  ajustement: C.infoBg   }[t] ?? C.sand);
const movTypeTextColor=(t: string) => ({ entree: '#059669',   sortie: '#DC2626',   ajustement: '#2563EB'  }[t] ?? C.textLabel);
const movTypeLabel   = (t: string) => ({ entree: 'Entrée',    sortie: 'Sortie',    ajustement: 'Ajustement'}[t] ?? t);
const movTypeSign    = (t: string) => ({ entree: '+',         sortie: '−',         ajustement: '±'        }[t] ?? '');

/* shared styles */
const inp: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: `1.5px solid ${C.sandBorder}`,
  borderRadius: 10, fontSize: 13.5, outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
  color: C.textMain, background: C.sand
};
const lbl: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700,
  color: C.textLabel, marginBottom: 6,
  textTransform: 'uppercase', letterSpacing: '0.06em'
};
const btn = (color: string) => ({
  padding: '10px 24px', background: color, color: C.white, border: 'none',
  borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: 13.5
} as React.CSSProperties);
const btnOutline: React.CSSProperties = {
  padding: '10px 24px', background: C.ivory, color: C.textLabel,
  border: `1.5px solid ${C.sandBorder}`, borderRadius: 10,
  fontWeight: 500, cursor: 'pointer', fontSize: 13.5
};

/* ─────────────────────────── main component ─────────────────────────── */
const StockManagement = () => {
  const [activeView, setActiveView] = useState<'overview' | 'products' | 'movements' | 'analytics'>('overview');
  const [activeProductTab, setActiveProductTab] = useState<'list' | 'variants' | 'formats' | 'categories'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [showAddModal,        setShowAddModal]        = useState(false);
  const [showEditModal,       setShowEditModal]       = useState(false);
  const [showMovementModal,   setShowMovementModal]   = useState(false);
  const [showAddVariantModal, setShowAddVariantModal] = useState(false);
  const [showEditVariantModal,setShowEditVariantModal]= useState(false);
  const [showAddFormatModal,  setShowAddFormatModal]  = useState(false);
  const [showCategoryModal,   setShowCategoryModal]   = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  const [products,     setProducts]     = useState<Product[]>([]);
  const [variants,     setVariants]     = useState<ProductVariant[]>([]);
  const [formats,      setFormats]      = useState<ProductFormat[]>([]);
  const [categories,   setCategories]   = useState<Category[]>([]);
  const [movements,    setMovements]    = useState<StockMovement[]>([]);
  const [suppliers,    setSuppliers]    = useState<Supplier[]>([]);
  const [pointsOfSale, setPointsOfSale]= useState<PointOfSale[]>([]);
  const [overviewData, setOverviewData] = useState<OverviewData>({
    total_products: 0, stock_value: 0, alert_count: 0, today_movements: 0, critical_products: []
  });
  const [newProduct,  setNewProduct]  = useState<NewProduct>({ name:'', category_id:'', sku:'', supplier_id:'', point_of_sale_id:'', description:'', status:'en_stock' });
  const [newVariant,  setNewVariant]  = useState<NewVariant>({ product_id:'', format_id:'', current_stock:0, min_stock:0, max_stock:0, price:0, barcode:'' });
  const [newFormat,   setNewFormat]   = useState<NewFormat>({ name:'', description:'' });
  const [newCategory, setNewCategory] = useState({ name:'', description:'', image: null as File | null });
  const [newMovement, setNewMovement] = useState<NewMovement>({ product_variant_id:'', type:'', quantity:0, reason:'' });

  const [error,     setError]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* ── fetch ── */
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true); setError(null);
      const [ovR,prR,vaR,foR,moR,caR,suR,poR] = await Promise.all([
        apiService.get('/stock-overview/'), apiService.get('/products/'),
        apiService.get('/product-variants/'), apiService.get('/products-formats/'),
        apiService.get('/stock-movements/'), apiService.get('/categories/'),
        apiService.get('/suppliers/'), apiService.get('/points-vente/')
      ]);
      const [ov,pr,va,fo,mo,ca,su,po] = await Promise.all([
        ovR.json(),prR.json(),vaR.json(),foR.json(),moR.json(),caR.json(),suR.json(),poR.json()
      ]);
      setOverviewData({
        total_products:  ov.cumulative?.total_products  ?? 0,
        stock_value:     ov.cumulative?.stock_value     ?? 0,
        alert_count:     ov.cumulative?.alert_count     ?? 0,
        today_movements: ov.cumulative?.today_movements ?? 0,
        critical_products: ov.cumulative?.critical_products ?? []
      });
      setProducts(pr); setVariants(va); setFormats(fo);
      setMovements(mo); setCategories(ca); setSuppliers(su); setPointsOfSale(po);
    } catch (e: any) { setError(e.message ?? 'Erreur lors du chargement'); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── filtered lists ── */
  const filteredProducts = useMemo(() => products.filter(p => {
    const q = searchTerm.toLowerCase();
    return (p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q))
      && (selectedCategory === 'all' || p.category?.name === selectedCategory);
  }), [products, searchTerm, selectedCategory]);

  const filteredVariants = useMemo(() => variants.filter(v => {
    const q = searchTerm.toLowerCase();
    return v.format?.name?.toLowerCase().includes(q)
      || v.barcode?.toLowerCase().includes(q)
      || products.find(p => p.id === v.product_id)?.name.toLowerCase().includes(q);
  }), [variants, products, searchTerm]);

  const filteredFormats = useMemo(() => formats.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
    || f.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ), [formats, searchTerm]);

  const filteredCategories = useMemo(() => categories.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
    || c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ), [categories, searchTerm]);

  /* ── handlers ── */
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const fd = new FormData();
      Object.entries(newProduct).forEach(([k,v]) => {
        if (k==='main_image' && v instanceof File) fd.append(k,v);
        else if (k!=='main_image') fd.append(k,String(v));
      });
      const res = await apiService.post('/products/', fd, true);
      const created = await res.json();
      setProducts(p => [...p, created]);
      setNewProduct({ name:'', category_id:'', sku:'', supplier_id:'', point_of_sale_id:'', description:'', status:'en_stock' });
      setShowAddModal(false); fetchData();
    } catch (e: any) { setError(e.message ?? 'Erreur ajout produit'); }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selectedProduct) return;
    try {
      setError(null);
      const fd = new FormData();
      fd.append('name', selectedProduct.name);
      fd.append('category_id', String(selectedProduct.category.id));
      fd.append('sku', selectedProduct.sku);
      fd.append('supplier_id', String(selectedProduct.supplier.id));
      fd.append('point_of_sale_id', selectedProduct.point_of_sale.id);
      fd.append('description', selectedProduct.description ?? '');
      fd.append('status', selectedProduct.status);
      const res = await apiService.put(`/products/${selectedProduct.id}/`, fd, true);
      const updated = await res.json();
      setProducts(p => p.map(x => x.id===updated.id ? updated : x));
      setShowEditModal(false); setSelectedProduct(null); fetchData();
    } catch (e: any) { setError(e.message ?? 'Erreur mise à jour produit'); }
  };

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const fd = new FormData();
      Object.entries(newVariant).forEach(([k,v]) => {
        if (k==='image' && v instanceof File) fd.append(k,v);
        else if (k!=='image') fd.append(k,String(v));
      });
      const res = await apiService.post('/product-variants/', fd, true);
      const created = await res.json();
      setVariants(v => [...v, created]);
      setNewVariant({ product_id:'', format_id:'', current_stock:0, min_stock:0, max_stock:0, price:0, barcode:'' });
      setShowAddVariantModal(false); fetchData();
    } catch (e: any) { setError(e.message ?? 'Erreur ajout variante'); }
  };

  const handleUpdateVariant = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selectedVariant) return;
    try {
      setError(null);
      const fd = new FormData();
      fd.append('product_id', selectedVariant.product_id);
      fd.append('format_id', String(selectedVariant.format.id));
      fd.append('current_stock', String(selectedVariant.current_stock));
      fd.append('min_stock', String(selectedVariant.min_stock));
      fd.append('max_stock', String(selectedVariant.max_stock));
      fd.append('price', String(selectedVariant.price));
      fd.append('barcode', selectedVariant.barcode);
      if (selectedVariant.image instanceof File) fd.append('image', selectedVariant.image);
      const res = await apiService.put(`/product-variants/${selectedVariant.id}/`, fd, true);
      const updated = await res.json();
      setVariants(v => v.map(x => x.id===updated.id ? updated : x));
      setShowEditVariantModal(false); setSelectedVariant(null); fetchData();
    } catch (e: any) { setError(e.message ?? 'Erreur mise à jour variante'); }
  };

  const handleAddFormat = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const res = await apiService.post('/products-formats/', newFormat);
      const created = await res.json();
      setFormats(f => [...f, created]);
      setNewFormat({ name:'', description:'' });
      setShowAddFormatModal(false); fetchData();
    } catch (e: any) { setError(e.message ?? 'Erreur ajout format'); }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const fd = new FormData();
      fd.append('name', newCategory.name);
      fd.append('description', newCategory.description);
      if (newCategory.image) fd.append('image', newCategory.image);
      const res = await apiService.post('/categories/', fd, true);
      const created = await res.json();
      setCategories(c => [...c, created]);
      setNewCategory({ name:'', description:'', image:null });
      setShowCategoryModal(false);
    } catch (e: any) { setError(e.message ?? 'Erreur ajout catégorie'); }
  };

  const handleAddMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      if (!newMovement.product_variant_id) throw new Error('Veuillez sélectionner une variante');
      if (!newMovement.type)               throw new Error('Veuillez sélectionner un type');
      if (newMovement.quantity <= 0)       throw new Error('La quantité doit être > 0');
      if (!newMovement.reason.trim())      throw new Error('Veuillez spécifier une raison');
      const res = await apiService.post('/stock-movements/', newMovement);
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail ?? 'Erreur'); }
      const created = await res.json();
      setMovements(m => [created, ...m]);
      setNewMovement({ product_variant_id:'', type:'', quantity:0, reason:'' });
      setShowMovementModal(false); fetchData();
    } catch (e: any) { setError(e.message ?? 'Erreur ajout mouvement'); }
  };

  const handleDeleteProduct  = async (id: string) => {
    if (!window.confirm('Supprimer ce produit ?')) return;
    try { await apiService.delete(`/products/${id}/`); setProducts(p => p.filter(x => x.id!==id)); fetchData(); }
    catch (e: any) { setError(e.message); }
  };
  const handleDeleteVariant  = async (id: string) => {
    if (!window.confirm('Supprimer cette variante ?')) return;
    try { await apiService.delete(`/product-variants/${id}/`); setVariants(v => v.filter(x => x.id!==id)); fetchData(); }
    catch (e: any) { setError(e.message); }
  };
  const handleDeleteFormat   = async (id: number) => {
    if (!window.confirm('Supprimer ce format ?')) return;
    try { await apiService.delete(`/products-formats/${id}/`); setFormats(f => f.filter(x => x.id!==id)); fetchData(); }
    catch (e: any) { setError(e.message); }
  };
  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('Supprimer cette catégorie ?')) return;
    try { await apiService.delete(`/categories/${id}/`); setCategories(c => c.filter(x => x.id!==id)); }
    catch (e: any) { setError(e.message); }
  };

  /* ── Image Upload ── */
  const ImageUploadField = ({
    value, onChange, onClear
  }: { value?: File | string | null; onChange: (f: File) => void; onClear: () => void }) => (
    <div style={{ display:'flex', alignItems:'center', gap:16 }}>
      <label style={{
        flex:1, display:'flex', flexDirection:'column', alignItems:'center',
        justifyContent:'center', height:100, border:`2px dashed ${C.sandBorder}`,
        borderRadius:12, cursor:'pointer', background:C.sand
      }}>
        <Upload size={22} color={C.textMuted} />
        <span style={{ fontSize:13, color:C.textMuted, marginTop:6 }}>Cliquez pour télécharger</span>
        <span style={{ fontSize:11, color:C.sandBorder }}>PNG, JPG, JPEG – max 5 MB</span>
        <input type="file" accept="image/*" style={{ display:'none' }}
          onChange={e => e.target.files?.[0] && onChange(e.target.files[0])} />
      </label>
      {value && (
        <div style={{ position:'relative', width:64, height:64, borderRadius:10, overflow:'hidden', border:`1px solid ${C.sandBorder}` }}>
          <img src={value instanceof File ? URL.createObjectURL(value) : value}
            alt="preview" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          <button type="button" onClick={onClear} style={{
            position:'absolute', top:2, right:2, background:C.ocreDark, border:'none',
            borderRadius:'50%', width:18, height:18, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center'
          }}>
            <X size={10} color="white" />
          </button>
        </div>
      )}
    </div>
  );

  /* ── Stat Card ── */
  const StatCard = ({ label, value, icon, iconBg, sub }: {
    label: string; value: string | number; icon: React.ReactNode; iconBg: string; sub: React.ReactNode;
  }) => (
    <div style={{
      background: C.white, padding:'1.25rem', borderRadius:16,
      border:`1px solid ${C.sandMid}`, display:'flex', flexDirection:'column', gap:12
    }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <p style={{ margin:0, fontSize:12, fontWeight:700, color:C.textLabel, textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</p>
          <p style={{ margin:'4px 0 0', fontSize:28, fontWeight:700, color:C.textMain }}>{value}</p>
        </div>
        <div style={{ padding:10, background:iconBg, borderRadius:12 }}>{icon}</div>
      </div>
      <div style={{ fontSize:13 }}>{sub}</div>
    </div>
  );

  /* ── Nav Tabs ── */
  const NavTabs = ({ tabs, active, onChange }: {
    tabs: { id:string; label:string; icon:React.ReactNode }[];
    active: string; onChange: (id:string) => void;
  }) => (
    <div style={{ display:'flex', gap:4, padding:4, background:C.sand, borderRadius:14 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          padding:'8px 12px', borderRadius:11, border:'none', cursor:'pointer', fontSize:13.5,
          fontWeight: active===t.id ? 700 : 500,
          background: active===t.id ? C.green : 'transparent',
          color: active===t.id ? C.white : C.textMuted,
          boxShadow: active===t.id ? '0 2px 8px rgba(45,90,61,0.18)' : 'none',
          transition:'all 0.15s'
        }}>
          {t.icon}{t.label}
        </button>
      ))}
    </div>
  );

  /* ── Table ── */
  const TableWrapper = ({ children }: { children: React.ReactNode }) => (
    <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.sandMid}`, overflow:'hidden' }}>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          {children}
        </table>
      </div>
    </div>
  );

  const Th = ({ children }: { children: React.ReactNode }) => (
    <th style={{
      padding:'12px 16px', textAlign:'left', fontSize:11, fontWeight:700,
      color:C.textLabel, textTransform:'uppercase', letterSpacing:'0.06em',
      background:C.sand, borderBottom:`1px solid ${C.sandMid}`
    }}>{children}</th>
  );

  const Td = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <td style={{ padding:'12px 16px', fontSize:13.5, color:C.textMain, borderBottom:`1px solid ${C.sand}`, ...style }}>
      {children}
    </td>
  );

  const EmptyRow = ({ cols, icon, msg, sub }: { cols:number; icon:React.ReactNode; msg:string; sub:string }) => (
    <tr><td colSpan={cols}>
      <div style={{ padding:'3rem 1rem', textAlign:'center' }}>
        <div style={{ color:C.sandBorder, marginBottom:12 }}>{icon}</div>
        <p style={{ margin:0, fontWeight:600, color:C.textLabel, fontSize:15 }}>{msg}</p>
        <p style={{ margin:'4px 0 0', color:C.textMuted, fontSize:13 }}>{sub}</p>
      </div>
    </td></tr>
  );

  const ThumbnailCell = ({ src, alt }: { src?: string | null; alt:string }) => (
    src
      ? <div style={{ width:44, height:44, borderRadius:8, overflow:'hidden', border:`1px solid ${C.sandBorder}` }}>
          <img src={src} alt={alt} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        </div>
      : <div style={{ width:44, height:44, borderRadius:8, background:C.sand, border:`1px solid ${C.sandBorder}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <ImageIcon size={18} color={C.textMuted} />
        </div>
  );

  const ActionBtn = ({ onClick, danger, children }: { onClick:()=>void; danger?:boolean; children:React.ReactNode }) => (
    <button onClick={onClick} style={{
      padding:7, background:'none', border:'none', cursor:'pointer', borderRadius:8,
      color: danger ? '#DC2626' : C.green, display:'flex', alignItems:'center'
    }}>{children}</button>
  );

  /* ─── Form helpers ─── */
  const FormRow = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>{children}</div>
  );

  const Field = ({ label, children }: { label:string; children:React.ReactNode }) => (
    <div><label style={lbl}>{label}</label>{children}</div>
  );

  const modalFooter = (onCancel: ()=>void, submitLabel:string, color=C.green) => (
    <div style={{ display:'flex', justifyContent:'flex-end', gap:12, paddingTop:20, borderTop:`1px solid ${C.sandMid}`, marginTop:4 }}>
      <button type="button" style={btnOutline} onClick={onCancel}>Annuler</button>
      <button type="submit" style={btn(color)}>
        <span style={{ display:'flex', alignItems:'center', gap:6 }}><Save size={14}/>{submitLabel}</span>
      </button>
    </div>
  );

  /* ─────────────────── OVERVIEW ─────────────────── */
  const renderOverview = () => (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16 }}>
        <StatCard label="Total Produits" value={overviewData.total_products} iconBg={C.greenLight}
          icon={<Package size={22} color={C.green} />}
          sub={<span style={{ color:C.green, display:'flex', alignItems:'center', gap:4 }}><TrendingUp size={13}/>+12% ce mois</span>} />
        <StatCard label="Valeur Stock" value={`₣ ${(overviewData.stock_value/1000).toFixed(1)}K`} iconBg={C.successBg}
          icon={<DollarSign size={22} color="#059669"/>}
          sub={<span style={{ color:'#059669', display:'flex', alignItems:'center', gap:4 }}><ArrowUpRight size={13}/>Croissance stable</span>} />
        <StatCard label="Alertes Stock" value={overviewData.alert_count} iconBg={C.ocreLight}
          icon={<AlertTriangle size={22} color={C.ocreDark}/>}
          sub={<span style={{ color:C.ocreDark, display:'flex', alignItems:'center', gap:4 }}><AlertCircle size={13}/>Nécessite attention</span>} />
        <StatCard label="Mouvements Jour" value={overviewData.today_movements} iconBg={C.sand}
          icon={<RefreshCw size={22} color={C.ocre}/>}
          sub={<span style={{ color:C.ocre, display:'flex', alignItems:'center', gap:4 }}><BarChart3 size={13}/>Activité normale</span>} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        {/* alertes */}
        <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.sandMid}`, padding:'1.25rem' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <h3 style={{ margin:0, fontSize:17, fontWeight:700, color:C.textMain }}>Alertes Stock Critique</h3>
            <span style={{ background:C.ocreLight, color:C.ocreDark, padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:600, border:`1px solid ${C.ocreBorder}` }}>
              {overviewData.alert_count} alertes
            </span>
          </div>
          {overviewData.critical_products.length > 0 ? overviewData.critical_products.map((p,i) => (
            <div key={`${p.id}-${i}`} style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'12px 14px', borderLeft:`4px solid ${C.ocre}`, background:C.ocreLight,
              borderRadius:'0 8px 8px 0', marginBottom:8
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <AlertTriangle size={18} color={p.status==='rupture' ? C.dangerText : C.ocreDark}/>
                <div>
                  <p style={{ margin:0, fontWeight:600, fontSize:14, color:C.textMain }}>{p.name}</p>
                  <p style={{ margin:0, fontSize:12, color:C.textMuted }}>SKU: {p.sku ?? 'N/A'}</p>
                </div>
              </div>
              <button style={{ ...btn(C.green), padding:'5px 12px', fontSize:12 }}>Voir</button>
            </div>
          )) : (
            <div style={{ textAlign:'center', padding:'2rem', background:C.sand, borderRadius:12 }}>
              <CheckCircle size={32} color={C.sandBorder} style={{ marginBottom:8 }}/>
              <p style={{ margin:0, fontWeight:500, color:C.textLabel }}>Aucune alerte critique</p>
              <p style={{ margin:'4px 0 0', fontSize:13, color:C.textMuted }}>Tous les produits sont en stock optimal</p>
            </div>
          )}
        </div>

        {/* mouvements récents */}
        <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.sandMid}`, padding:'1.25rem' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <h3 style={{ margin:0, fontSize:17, fontWeight:700, color:C.textMain }}>Mouvements Récents</h3>
            <button onClick={() => setActiveView('movements')} style={{ background:'none', border:'none', color:C.green, fontWeight:600, cursor:'pointer', fontSize:13 }}>
              Voir tous
            </button>
          </div>
          {movements.slice(0,5).map(m => (
            <div key={m.id} style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'10px 12px', border:`1px solid ${C.sand}`, borderRadius:10, marginBottom:8
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ padding:7, background:movTypeColor(m.type), borderRadius:'50%' }}>
                  {m.type==='entree' ? <TrendingUp size={14} color="#059669"/> :
                   m.type==='sortie' ? <TrendingDown size={14} color="#DC2626"/> :
                   <RefreshCw size={14} color="#2563EB"/>}
                </div>
                <div>
                  <p style={{ margin:0, fontWeight:600, fontSize:14, color:C.textMain }}>{m.product?.name ?? '—'}</p>
                  <p style={{ margin:0, fontSize:12, color:C.textMuted }}>{m.reason}</p>
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <p style={{ margin:0, fontSize:12, color:C.textMuted }}>
                  {new Date(m.date).toLocaleTimeString('fr-FR',{ hour:'2-digit', minute:'2-digit' })}
                </p>
                <p style={{ margin:0, fontSize:11, color:C.textMuted }}>{m.user?.username ?? '—'}</p>
              </div>
            </div>
          ))}
          {movements.length===0 && (
            <div style={{ textAlign:'center', padding:'2rem', background:C.sand, borderRadius:12 }}>
              <Package size={32} color={C.sandBorder} style={{ marginBottom:8 }}/>
              <p style={{ margin:0, fontWeight:500, color:C.textLabel }}>Aucun mouvement récent</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  /* ─────────────────── PRODUCTS ─────────────────── */
  const renderProducts = () => (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ background:C.white, padding:'1.25rem', borderRadius:16, border:`1px solid ${C.sandMid}` }}>
        <NavTabs active={activeProductTab} onChange={id => setActiveProductTab(id as any)} tabs={[
          { id:'list',       label:'Produits',    icon:<Package size={15}/> },
          { id:'variants',   label:'Variantes',   icon:<Box size={15}/> },
          { id:'formats',    label:'Formats',     icon:<Tag size={15}/> },
          { id:'categories', label:'Catégories',  icon:<FolderOpen size={15}/> },
        ]}/>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:16, flexWrap:'wrap', gap:10 }}>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <div style={{ position:'relative' }}>
              <Search size={15} color={C.textMuted} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }}/>
              <input style={{ ...inp, paddingLeft:36, width:280 }} placeholder="Rechercher…"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
            </div>
            {activeProductTab==='list' && (
              <select style={{ ...inp, width:200 }} value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                <option value="all">Toutes catégories</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            )}
          </div>
          <button style={btn(C.green)} onClick={() => {
            if (activeProductTab==='list')       setShowAddModal(true);
            else if (activeProductTab==='variants')  setShowAddVariantModal(true);
            else if (activeProductTab==='formats')   setShowAddFormatModal(true);
            else setShowCategoryModal(true);
          }}>
            <span style={{ display:'flex', alignItems:'center', gap:6 }}>
              <Plus size={15}/>
              {activeProductTab==='list'       ? 'Nouveau Produit'   :
               activeProductTab==='variants'   ? 'Nouvelle Variante' :
               activeProductTab==='formats'    ? 'Nouveau Format'    : 'Nouvelle Catégorie'}
            </span>
          </button>
        </div>
      </div>

      {/* liste produits */}
      {activeProductTab==='list' && (
        <TableWrapper>
          <thead><tr>
            <Th>Produit</Th><Th>Image</Th><Th>Catégorie</Th><Th>Statut</Th><Th>Fournisseur</Th><Th>Actions</Th>
          </tr></thead>
          <tbody>
            {filteredProducts.map(p => {
              const sc = statusColor(p.status);
              return (
                <tr key={p.id}
                  onMouseEnter={e => (e.currentTarget.style.background = C.sand)}
                  onMouseLeave={e => (e.currentTarget.style.background = C.white)}>
                  <Td><p style={{ margin:0, fontWeight:600, color:C.textMain }}>{p.name}</p><p style={{ margin:0, fontSize:12, color:C.textMuted }}>{p.sku}</p></Td>
                  <Td><ThumbnailCell src={p.main_image} alt={p.name}/></Td>
                  <Td><span style={{ color:C.textLabel }}>{p.category?.name ?? '—'}</span></Td>
                  <Td><span style={{ padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:600, background:sc.bg, color:sc.text, border:`1px solid ${sc.border}` }}>{statusLabel(p.status)}</span></Td>
                  <Td><p style={{ margin:0, fontWeight:500, color:C.textMain }}>{p.supplier?.name ?? '—'}</p><p style={{ margin:0, fontSize:12, color:C.textMuted }}>{p.point_of_sale?.name ?? '—'}</p></Td>
                  <Td><div style={{ display:'flex', gap:4 }}>
                    <ActionBtn onClick={() => { setSelectedProduct(p); setShowEditModal(true); }}><Edit size={15}/></ActionBtn>
                    <ActionBtn danger onClick={() => handleDeleteProduct(p.id)}><Trash2 size={15}/></ActionBtn>
                  </div></Td>
                </tr>
              );
            })}
            {filteredProducts.length===0 && <EmptyRow cols={6} icon={<Package size={40}/>}
              msg={products.length===0 ? 'Aucun produit' : 'Aucun résultat'}
              sub={products.length===0 ? 'Ajoutez votre premier produit.' : 'Modifiez vos critères de recherche.'}/>}
          </tbody>
        </TableWrapper>
      )}

      {/* variantes */}
      {activeProductTab==='variants' && (
        <TableWrapper>
          <thead><tr>
            <Th>Produit</Th><Th>Format</Th><Th>Stock</Th><Th>Prix</Th><Th>Image</Th><Th>Actions</Th>
          </tr></thead>
          <tbody>
            {filteredVariants.map(v => (
              <tr key={v.id}
                onMouseEnter={e => (e.currentTarget.style.background = C.sand)}
                onMouseLeave={e => (e.currentTarget.style.background = C.white)}>
                <Td><p style={{ margin:0, fontWeight:600, color:C.textMain }}>{v.product?.name ?? '—'}</p></Td>
                <Td><span style={{ color:C.textLabel }}>{v.format?.name ?? '—'}</span></Td>
                <Td>
                  <span style={{ fontWeight:700, color: v.current_stock<=v.min_stock ? C.dangerText : v.current_stock>=v.max_stock ? '#059669' : C.textMain }}>
                    {v.current_stock}
                  </span>
                  <span style={{ fontSize:12, color:C.textMuted }}> / min {v.min_stock} / max {v.max_stock}</span>
                </Td>
                <Td style={{ fontWeight:600, color:C.green }}>₣ {v.price.toLocaleString()}</Td>
                <Td><ThumbnailCell src={typeof v.image==='string' ? v.image : undefined} alt={v.format?.name ?? ''}/></Td>
                <Td><div style={{ display:'flex', gap:4 }}>
                  <ActionBtn onClick={() => { setSelectedVariant({ ...v, product_id: v.product_id||v.product.id }); setShowEditVariantModal(true); }}><Edit size={15}/></ActionBtn>
                  <ActionBtn danger onClick={() => handleDeleteVariant(v.id)}><Trash2 size={15}/></ActionBtn>
                </div></Td>
              </tr>
            ))}
            {filteredVariants.length===0 && <EmptyRow cols={6} icon={<Box size={40}/>}
              msg={variants.length===0 ? 'Aucune variante' : 'Aucun résultat'}
              sub={variants.length===0 ? 'Ajoutez des variantes à vos produits.' : 'Modifiez vos critères.'}/>}
          </tbody>
        </TableWrapper>
      )}

      {/* formats */}
      {activeProductTab==='formats' && (
        <TableWrapper>
          <thead><tr><Th>Nom</Th><Th>Description</Th><Th>Actions</Th></tr></thead>
          <tbody>
            {filteredFormats.map(f => (
              <tr key={f.id}
                onMouseEnter={e => (e.currentTarget.style.background = C.sand)}
                onMouseLeave={e => (e.currentTarget.style.background = C.white)}>
                <Td><p style={{ margin:0, fontWeight:600, color:C.textMain }}>{f.name}</p></Td>
                <Td style={{ color:C.textMuted }}>{f.description ?? '—'}</Td>
                <Td><ActionBtn danger onClick={() => handleDeleteFormat(f.id)}><Trash2 size={15}/></ActionBtn></Td>
              </tr>
            ))}
            {filteredFormats.length===0 && <EmptyRow cols={3} icon={<Tag size={40}/>}
              msg={formats.length===0 ? 'Aucun format' : 'Aucun résultat'}
              sub={formats.length===0 ? 'Créez des formats pour organiser vos variantes.' : 'Modifiez vos critères.'}/>}
          </tbody>
        </TableWrapper>
      )}

      {/* catégories */}
      {activeProductTab==='categories' && (
        <TableWrapper>
          <thead><tr><Th>Nom</Th><Th>Description</Th><Th>Image</Th><Th>Actions</Th></tr></thead>
          <tbody>
            {filteredCategories.map(c => (
              <tr key={c.id}
                onMouseEnter={e => (e.currentTarget.style.background = C.sand)}
                onMouseLeave={e => (e.currentTarget.style.background = C.white)}>
                <Td><p style={{ margin:0, fontWeight:600, color:C.textMain }}>{c.name}</p></Td>
                <Td style={{ color:C.textMuted }}>{c.description ?? '—'}</Td>
                <Td><ThumbnailCell src={c.image} alt={c.name}/></Td>
                <Td><ActionBtn danger onClick={() => handleDeleteCategory(c.id)}><Trash2 size={15}/></ActionBtn></Td>
              </tr>
            ))}
            {filteredCategories.length===0 && <EmptyRow cols={4} icon={<FolderOpen size={40}/>}
              msg={categories.length===0 ? 'Aucune catégorie' : 'Aucun résultat'}
              sub={categories.length===0 ? 'Organisez vos produits par catégorie.' : 'Modifiez vos critères.'}/>}
          </tbody>
        </TableWrapper>
      )}
    </div>
  );

  /* ─────────────────── MOVEMENTS ─────────────────── */
  const renderMovements = () => (
    <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.sandMid}`, padding:'1.25rem' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <h3 style={{ margin:0, fontSize:20, fontWeight:700, color:C.textMain }}>Mouvements de Stock</h3>
          <p style={{ margin:'4px 0 0', fontSize:14, color:C.textMuted }}>Historique des entrées, sorties et ajustements</p>
        </div>
        <button style={btn(C.green)} onClick={() => setShowMovementModal(true)}>
          <span style={{ display:'flex', alignItems:'center', gap:6 }}><Plus size={15}/>Nouveau Mouvement</span>
        </button>
      </div>
      {movements.length===0 ? (
        <div style={{ textAlign:'center', padding:'4rem 1rem' }}>
          <RefreshCw size={40} color={C.sandBorder} style={{ marginBottom:12 }}/>
          <p style={{ margin:0, fontWeight:600, fontSize:16, color:C.textLabel }}>Aucun mouvement de stock</p>
          <p style={{ margin:'6px 0 16px', color:C.textMuted }}>Les mouvements apparaîtront ici.</p>
          <button style={btn(C.green)} onClick={() => setShowMovementModal(true)}>
            <span style={{ display:'flex', alignItems:'center', gap:6 }}><Plus size={14}/>Premier mouvement</span>
          </button>
        </div>
      ) : movements.map(m => (
        <div key={m.id} style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'14px 16px', border:`1px solid ${C.sand}`, borderRadius:12, marginBottom:8
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ padding:10, background:movTypeColor(m.type), borderRadius:'50%' }}>
              {m.type==='entree' ? <TrendingUp size={16} color="#059669"/> :
               m.type==='sortie' ? <TrendingDown size={16} color="#DC2626"/> :
               <RefreshCw size={16} color="#2563EB"/>}
            </div>
            <div>
              <p style={{ margin:0, fontWeight:600, color:C.textMain }}>{m.product?.name ?? '—'}</p>
              <p style={{ margin:0, fontSize:13, color:C.textMuted }}>{m.reason}</p>
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <p style={{ margin:0, fontWeight:700, fontSize:18, color:movTypeTextColor(m.type) }}>
              {movTypeSign(m.type)} {m.quantity}
            </p>
            <p style={{ margin:0, fontSize:12, color:C.textMuted }}>{new Date(m.date).toLocaleString('fr-FR')}</p>
            <p style={{ margin:0, fontSize:12, color:C.green, fontWeight:500 }}>{m.user?.username ?? '—'}</p>
          </div>
        </div>
      ))}
    </div>
  );

  /* ─────────────────── ANALYTICS ─────────────────── */
  const renderAnalytics = () => (
    <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.sandMid}`, padding:'3rem', textAlign:'center' }}>
      <div style={{ background:C.sand, padding:'3rem', borderRadius:16, border:`1px solid ${C.sandMid}` }}>
        {/* Bande kente décorative */}
        <div style={{ height:4, borderRadius:4, marginBottom:24, background:`linear-gradient(90deg,${C.ocreDark} 0%,${C.ocre} 40%,${C.ocreDark} 100%)` }}/>
        <TrendingUp size={52} color={C.green} style={{ marginBottom:16 }}/>
        <h3 style={{ margin:0, fontSize:22, fontWeight:700, color:C.textMain }}>Analyses Avancées</h3>
        <p style={{ margin:'8px 0 24px', color:C.textMuted, fontSize:16 }}>Les rapports détaillés seront disponibles prochainement.</p>
        <div style={{ display:'flex', justifyContent:'center', gap:16 }}>
          {[
            { icon:<BarChart3 size={22} color={C.green}/>, label:'Performance' },
            { icon:<Database size={22} color={C.green}/>, label:'Prédictions' },
            { icon:<Clock size={22} color={C.green}/>, label:'Historique' },
          ].map(({ icon, label }) => (
            <div key={label} style={{ background:C.white, padding:'1rem 1.5rem', borderRadius:12, border:`1px solid ${C.sandMid}` }}>
              <div style={{ marginBottom:6 }}>{icon}</div>
              <p style={{ margin:0, fontSize:13, fontWeight:600, color:C.textLabel }}>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ─────────────────── RENDER ─────────────────── */
  return (
    <div style={{ minHeight:'100vh', background:C.ivory, padding:'1.5rem' }}>
      <div style={{ maxWidth:1280, margin:'0 auto', display:'flex', flexDirection:'column', gap:24 }}>

        {/* Header avec bande kente */}
        <div style={{ background:C.green, borderRadius:20, padding:'2rem 2.5rem', position:'relative', overflow:'hidden' }}>
          {/* grid texture */}
          <div style={{
            position:'absolute', inset:0, opacity:0.06,
            backgroundImage:'linear-gradient(rgba(250,247,240,.9) 1px,transparent 1px),linear-gradient(90deg,rgba(250,247,240,.9) 1px,transparent 1px)',
            backgroundSize:'48px 48px', borderRadius:20
          }}/>
          {/* bande kente top */}
          <div style={{ position:'absolute', top:0, left:0, right:0, height:4, background:`linear-gradient(90deg,${C.ocreDark} 0%,${C.ocre} 40%,${C.ocreDark} 100%)`, borderRadius:'20px 20px 0 0' }}/>
          <div style={{ position:'relative', zIndex:1 }}>
            <h1 style={{ margin:0, fontSize:28, fontWeight:800, color:C.ivory }}>
              Gestion de Stock
            </h1>
            <p style={{ margin:'6px 0 0', color:'rgba(250,247,240,0.5)', fontSize:15, fontWeight:400 }}>
              Système complet de gestion d'inventaire — <span style={{ color:C.gold }}>LanfiaLink</span>
            </p>
          </div>
          {/* bande kente bottom */}
          <div style={{ position:'absolute', bottom:0, left:0, right:0, height:3, opacity:0.5, background:`linear-gradient(90deg,${C.green} 0%,${C.ocre} 30%,${C.gold} 60%,${C.green} 100%)` }}/>
        </div>

        {error && (
          <div style={{ padding:'12px 16px', background:C.ocreLight, color:C.ocreDark, borderRadius:12, border:`1px solid ${C.ocreBorder}`, fontWeight:500 }}>
            {error}
          </div>
        )}

        {/* main nav */}
        <NavTabs active={activeView} onChange={id => { setActiveView(id as any); if (id==='products') setActiveProductTab('list'); }} tabs={[
          { id:'overview',  label:"Vue d'ensemble", icon:<BarChart3 size={15}/> },
          { id:'products',  label:'Produits',        icon:<Package size={15}/> },
          { id:'movements', label:'Mouvements',      icon:<RefreshCw size={15}/> },
          { id:'analytics', label:'Analyses',        icon:<TrendingUp size={15}/> },
        ]}/>

        {isLoading ? (
          <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:240, gap:16 }}>
            <div style={{ width:44, height:44, borderRadius:'50%', border:`3px solid ${C.sandMid}`, borderTopColor:C.green, animation:'spin 0.8s linear infinite' }}/>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <span style={{ color:C.textMuted, fontSize:14 }}>Chargement…</span>
          </div>
        ) : (
          <>
            {activeView==='overview'  && renderOverview()}
            {activeView==='products'  && renderProducts()}
            {activeView==='movements' && renderMovements()}
            {activeView==='analytics' && renderAnalytics()}
          </>
        )}

        {/* ══════════════ MODALS ══════════════ */}

        {/* Add Product */}
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Ajouter un produit" error={error}>
          <form onSubmit={handleAddProduct} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <FormRow>
              <Field label="Nom du produit *">
                <input style={inp} required value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name:e.target.value }))}/>
              </Field>
              <Field label="Catégorie *">
                <select style={inp} required value={newProduct.category_id} onChange={e => setNewProduct(p => ({ ...p, category_id:Number(e.target.value)||'' }))}>
                  <option value="">Sélectionner…</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Code SKU *">
                <input style={inp} required value={newProduct.sku} onChange={e => setNewProduct(p => ({ ...p, sku:e.target.value.toUpperCase() }))}/>
              </Field>
              <Field label="Fournisseur *">
                <select style={inp} required value={newProduct.supplier_id} onChange={e => setNewProduct(p => ({ ...p, supplier_id:Number(e.target.value)||'' }))}>
                  <option value="">Sélectionner…</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Field>
              <Field label="Point de vente *">
                <select style={inp} required value={newProduct.point_of_sale_id} onChange={e => setNewProduct(p => ({ ...p, point_of_sale_id:e.target.value }))}>
                  <option value="">Sélectionner…</option>
                  {pointsOfSale.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
              <Field label="Statut *">
                <select style={inp} value={newProduct.status} onChange={e => setNewProduct(p => ({ ...p, status:e.target.value as any }))}>
                  <option value="en_stock">En stock</option>
                  <option value="stock_faible">Stock faible</option>
                  <option value="rupture">Rupture</option>
                  <option value="surstockage">Surstockage</option>
                </select>
              </Field>
            </FormRow>
            <div><label style={lbl}>Description</label>
              <textarea style={{ ...inp, height:80, resize:'vertical' }} value={newProduct.description} onChange={e => setNewProduct(p => ({ ...p, description:e.target.value }))}/>
            </div>
            <div><label style={lbl}>Image principale</label>
              <ImageUploadField value={newProduct.main_image} onChange={f => setNewProduct(p => ({ ...p, main_image:f }))} onClear={() => setNewProduct(p => ({ ...p, main_image:undefined }))}/>
            </div>
            {modalFooter(() => setShowAddModal(false), 'Ajouter le produit')}
          </form>
        </Modal>

        {/* Edit Product */}
        <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedProduct(null); }} title="Modifier le produit" error={error}>
          {selectedProduct && (
            <form onSubmit={handleUpdateProduct} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <FormRow>
                <Field label="Nom *">
                  <input style={inp} required value={selectedProduct.name} onChange={e => setSelectedProduct(p => p ? { ...p, name:e.target.value } : null)}/>
                </Field>
                <Field label="Catégorie *">
                  <select style={inp} required value={selectedProduct.category.id} onChange={e => setSelectedProduct(p => p ? { ...p, category:{ ...p.category, id:Number(e.target.value) } } : null)}>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>
                <Field label="SKU *">
                  <input style={inp} required value={selectedProduct.sku} onChange={e => setSelectedProduct(p => p ? { ...p, sku:e.target.value.toUpperCase() } : null)}/>
                </Field>
                <Field label="Fournisseur *">
                  <select style={inp} required value={selectedProduct.supplier.id} onChange={e => setSelectedProduct(p => p ? { ...p, supplier:{ ...p.supplier, id:Number(e.target.value) } } : null)}>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </Field>
                <Field label="Point de vente *">
                  <select style={inp} required value={selectedProduct.point_of_sale.id} onChange={e => setSelectedProduct(p => p ? { ...p, point_of_sale:{ ...p.point_of_sale, id:e.target.value } } : null)}>
                    {pointsOfSale.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </Field>
                <Field label="Statut *">
                  <select style={inp} value={selectedProduct.status} onChange={e => setSelectedProduct(p => p ? { ...p, status:e.target.value as any } : null)}>
                    <option value="en_stock">En stock</option>
                    <option value="stock_faible">Stock faible</option>
                    <option value="rupture">Rupture</option>
                    <option value="surstockage">Surstockage</option>
                  </select>
                </Field>
              </FormRow>
              <div><label style={lbl}>Description</label>
                <textarea style={{ ...inp, height:80, resize:'vertical' }} value={selectedProduct.description ?? ''} onChange={e => setSelectedProduct(p => p ? { ...p, description:e.target.value } : null)}/>
              </div>
              <div><label style={lbl}>Image principale</label>
                <ImageUploadField value={selectedProduct.main_image} onChange={f => setSelectedProduct(p => p ? { ...p, main_image:URL.createObjectURL(f) } : null)} onClear={() => setSelectedProduct(p => p ? { ...p, main_image:undefined } : null)}/>
              </div>
              {modalFooter(() => { setShowEditModal(false); setSelectedProduct(null); }, 'Mettre à jour', C.ocre)}
            </form>
          )}
        </Modal>

        {/* Add Variant */}
        <Modal isOpen={showAddVariantModal} onClose={() => setShowAddVariantModal(false)} title="Nouvelle variante" error={error}>
          <form onSubmit={handleAddVariant} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <FormRow>
              <Field label="Produit *">
                <select style={inp} required value={newVariant.product_id} onChange={e => setNewVariant(v => ({ ...v, product_id:e.target.value }))}>
                  <option value="">Sélectionner…</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
              <Field label="Format *">
                <select style={inp} required value={newVariant.format_id} onChange={e => setNewVariant(v => ({ ...v, format_id:Number(e.target.value)||'' }))}>
                  <option value="">Sélectionner…</option>
                  {formats.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </Field>
              <Field label="Stock actuel *">
                <input style={inp} type="number" required min="0" value={newVariant.current_stock} onChange={e => setNewVariant(v => ({ ...v, current_stock:Number(e.target.value) }))}/>
              </Field>
              <Field label="Stock minimum *">
                <input style={inp} type="number" required min="0" value={newVariant.min_stock} onChange={e => setNewVariant(v => ({ ...v, min_stock:Number(e.target.value) }))}/>
              </Field>
              <Field label="Stock maximum *">
                <input style={inp} type="number" required min="0" value={newVariant.max_stock} onChange={e => setNewVariant(v => ({ ...v, max_stock:Number(e.target.value) }))}/>
              </Field>
              <Field label="Prix (₣) *">
                <input style={inp} type="number" required min="0" step="0.01" value={newVariant.price} onChange={e => setNewVariant(v => ({ ...v, price:Number(e.target.value) }))}/>
              </Field>
              <Field label="Code-barres">
                <input style={inp} value={newVariant.barcode} onChange={e => setNewVariant(v => ({ ...v, barcode:e.target.value }))}/>
              </Field>
            </FormRow>
            <div><label style={lbl}>Image</label>
              <ImageUploadField value={newVariant.image} onChange={f => setNewVariant(v => ({ ...v, image:f }))} onClear={() => setNewVariant(v => ({ ...v, image:undefined }))}/>
            </div>
            {modalFooter(() => setShowAddVariantModal(false), 'Ajouter la variante')}
          </form>
        </Modal>

        {/* Edit Variant */}
        <Modal isOpen={showEditVariantModal} onClose={() => { setShowEditVariantModal(false); setSelectedVariant(null); }} title="Modifier la variante" error={error}>
          {selectedVariant && (
            <form onSubmit={handleUpdateVariant} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <FormRow>
                <Field label="Produit *">
                  <select style={inp} required value={selectedVariant.product_id} onChange={e => setSelectedVariant(v => v ? { ...v, product_id:e.target.value, product:{ ...v.product, id:e.target.value } } : null)}>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </Field>
                <Field label="Format *">
                  <select style={inp} required value={selectedVariant.format.id} onChange={e => setSelectedVariant(v => v ? { ...v, format:{ ...v.format, id:Number(e.target.value) } } : null)}>
                    {formats.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </Field>
                <Field label="Stock actuel *">
                  <input style={inp} type="number" required min="0" value={selectedVariant.current_stock} onChange={e => setSelectedVariant(v => v ? { ...v, current_stock:Number(e.target.value) } : null)}/>
                </Field>
                <Field label="Stock minimum *">
                  <input style={inp} type="number" required min="0" value={selectedVariant.min_stock} onChange={e => setSelectedVariant(v => v ? { ...v, min_stock:Number(e.target.value) } : null)}/>
                </Field>
                <Field label="Stock maximum *">
                  <input style={inp} type="number" required min="0" value={selectedVariant.max_stock} onChange={e => setSelectedVariant(v => v ? { ...v, max_stock:Number(e.target.value) } : null)}/>
                </Field>
                <Field label="Prix (₣) *">
                  <input style={inp} type="number" required min="0" step="0.01" value={selectedVariant.price} onChange={e => setSelectedVariant(v => v ? { ...v, price:Number(e.target.value) } : null)}/>
                </Field>
                <Field label="Code-barres">
                  <input style={inp} value={selectedVariant.barcode} onChange={e => setSelectedVariant(v => v ? { ...v, barcode:e.target.value } : null)}/>
                </Field>
              </FormRow>
              <div><label style={lbl}>Image</label>
                <ImageUploadField
                  value={selectedVariant.image instanceof File ? selectedVariant.image : (typeof selectedVariant.image==='string' ? selectedVariant.image : null)}
                  onChange={f => setSelectedVariant(v => v ? { ...v, image:f } : null)}
                  onClear={() => setSelectedVariant(v => v ? { ...v, image:undefined } : null)}
                />
              </div>
              {modalFooter(() => { setShowEditVariantModal(false); setSelectedVariant(null); }, 'Mettre à jour', C.ocre)}
            </form>
          )}
        </Modal>

        {/* Add Format */}
        <Modal isOpen={showAddFormatModal} onClose={() => setShowAddFormatModal(false)} title="Nouveau format" error={error}>
          <form onSubmit={handleAddFormat} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <Field label="Nom *">
              <input style={inp} required value={newFormat.name} onChange={e => setNewFormat(f => ({ ...f, name:e.target.value }))}/>
            </Field>
            <Field label="Description">
              <textarea style={{ ...inp, height:80, resize:'vertical' }} value={newFormat.description} onChange={e => setNewFormat(f => ({ ...f, description:e.target.value }))}/>
            </Field>
            {modalFooter(() => setShowAddFormatModal(false), 'Ajouter le format')}
          </form>
        </Modal>

        {/* Add Category */}
        <Modal isOpen={showCategoryModal} onClose={() => setShowCategoryModal(false)} title="Nouvelle catégorie" error={error}>
          <form onSubmit={handleAddCategory} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <Field label="Nom *">
              <input style={inp} required value={newCategory.name} onChange={e => setNewCategory(c => ({ ...c, name:e.target.value }))}/>
            </Field>
            <Field label="Description">
              <textarea style={{ ...inp, height:80, resize:'vertical' }} value={newCategory.description} onChange={e => setNewCategory(c => ({ ...c, description:e.target.value }))}/>
            </Field>
            <div><label style={lbl}>Image</label>
              <ImageUploadField value={newCategory.image} onChange={f => setNewCategory(c => ({ ...c, image:f }))} onClear={() => setNewCategory(c => ({ ...c, image:null }))}/>
            </div>
            {modalFooter(() => setShowCategoryModal(false), 'Ajouter la catégorie')}
          </form>
        </Modal>

        {/* Add Movement */}
        <Modal isOpen={showMovementModal} onClose={() => setShowMovementModal(false)} title="Nouveau mouvement de stock" error={error}>
          <form onSubmit={handleAddMovement} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <Field label="Variante de produit *">
              <select style={inp} required value={newMovement.product_variant_id} onChange={e => setNewMovement(m => ({ ...m, product_variant_id:e.target.value }))}>
                <option value="">Sélectionner…</option>
                {variants.map(v => (
                  <option key={v.id} value={v.id}>{v.product?.name} – {v.format?.name} (Stock: {v.current_stock})</option>
                ))}
              </select>
            </Field>
            <FormRow>
              <Field label="Type *">
                <select style={inp} required value={newMovement.type} onChange={e => setNewMovement(m => ({ ...m, type:e.target.value as any }))}>
                  <option value="">Sélectionner…</option>
                  <option value="entree">Entrée</option>
                  <option value="sortie">Sortie</option>
                  <option value="ajustement">Ajustement</option>
                </select>
              </Field>
              <Field label="Quantité *">
                <input style={inp} type="number" required min="1" value={newMovement.quantity} onChange={e => setNewMovement(m => ({ ...m, quantity:Number(e.target.value) }))}/>
              </Field>
            </FormRow>
            <Field label="Raison *">
              <input style={inp} required value={newMovement.reason} onChange={e => setNewMovement(m => ({ ...m, reason:e.target.value }))}/>
            </Field>
            {modalFooter(() => setShowMovementModal(false), 'Ajouter le mouvement', C.green)}
          </form>
        </Modal>

        {/* Footer */}
        <p style={{ textAlign:'center', fontSize:11, color:C.textMuted, marginTop:8 }}>
          © {new Date().getFullYear()} LanfiaLink · Côte d'Ivoire · ISO 27001
        </p>

      </div>
    </div>
  );
};

export default StockManagement;