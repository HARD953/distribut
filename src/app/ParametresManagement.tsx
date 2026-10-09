import React, { useState, useEffect } from 'react';
import {
  Settings, User, Lock, Bell, CreditCard, Globe, Database,
  Shield, Info, Save, Loader2, CheckCircle, AlertCircle,
  Camera, Upload, Image as ImageIcon, X,
} from 'lucide-react';
import { useAuth } from './AuthContext';

/* ─── Palette & Gradients ─────────────────────────────────── */
const COLORS = {
  navy:       '#0D1B2A',
  blue:       '#1A8FD1',
  blueLight:  '#4FB3E8',
  blueDark:   '#0D6FAB',
  green:      '#10B981',
  greenLight: '#34D399',
  orange:     '#F59E0B',
  red:        '#EF4444',
  purple:     '#8B5CF6',
  teal:       '#14B8A6',
  white:      '#FFFFFF',
  grayLight:  '#F2F6FA',
  gray:       '#2A4055',
  grayDark:   '#0A1520',
  grayMuted:  '#1A3A50',
};

const GRADIENTS = {
  primary:   'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  secondary: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  success:   'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  warning:   'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  danger:    'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
  dark:      'linear-gradient(135deg, #0D1B2A 0%, #1a2f3f 100%)',
  card:      'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
};

/* ─── Gradient Stripe ─────────────────────────────────────── */
const GradientStripe = ({ height = 3 }: { height?: number }) => (
  <div style={{
    height,
    flexShrink: 0,
    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)',
  }} />
);

/* ─── Toggle Switch ───────────────────────────────────────── */
const Toggle = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <div
    onClick={() => onChange(!checked)}
    style={{
      width: 44,
      height: 24,
      borderRadius: 12,
      background: checked ? COLORS.blue : COLORS.blueLight,
      position: 'relative',
      cursor: 'pointer',
      transition: 'background 0.2s',
      flexShrink: 0,
    }}
  >
    <div style={{
      position: 'absolute',
      top: 3,
      left: checked ? 23 : 3,
      width: 18,
      height: 18,
      borderRadius: '50%',
      background: COLORS.white,
      transition: 'left 0.2s',
      boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
    }} />
  </div>
);

/* ─── Section Title ───────────────────────────────────────── */
const SectionTitle = ({ icon: Icon, label }: { icon: any; label: string }) => (
  <h4 style={{
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 11, fontWeight: 700, color: COLORS.grayDark,
    textTransform: 'uppercase', letterSpacing: '0.07em',
    marginBottom: 16,
  }}>
    <Icon size={13} color={COLORS.blue} /> {label}
  </h4>
);

/* ─── Form Input ──────────────────────────────────────────── */
const FormInput = ({
  label, value, onChange, type = 'text', placeholder = '', readOnly = false,
}: {
  label: string; value: string; onChange?: (v: string) => void;
  type?: string; placeholder?: string; readOnly?: boolean;
}) => (
  <div>
    <label style={{
      display: 'block', fontSize: 10, fontWeight: 700, color: COLORS.gray,
      textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5,
    }}>{label}</label>
    <input
      type={type}
      value={value}
      readOnly={readOnly}
      placeholder={placeholder}
      onChange={(e) => onChange?.(e.target.value)}
      style={{
        width: '100%', padding: '9px 12px',
        border: `1px solid ${COLORS.blueLight}`, borderRadius: 9,
        fontSize: 13, background: readOnly ? COLORS.grayLight : COLORS.grayLight,
        outline: 'none', fontFamily: 'inherit', color: COLORS.grayDark,
        transition: 'border 0.15s, box-shadow 0.15s',
        cursor: readOnly ? 'not-allowed' : 'text',
        opacity: readOnly ? 0.7 : 1,
        boxSizing: 'border-box',
      }}
      onFocus={(e) => {
        if (!readOnly) {
          e.currentTarget.style.borderColor = COLORS.blue;
          e.currentTarget.style.background = COLORS.white;
          e.currentTarget.style.boxShadow = `0 0 0 3px rgba(26,143,209,0.12)`;
        }
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = COLORS.blueLight;
        e.currentTarget.style.background = COLORS.grayLight;
        e.currentTarget.style.boxShadow = 'none';
      }}
    />
  </div>
);

/* ─── Form Select ─────────────────────────────────────────── */
const FormSelect = ({
  label, value, onChange, children,
}: {
  label: string; value: string; onChange: (v: string) => void; children: React.ReactNode;
}) => (
  <div>
    <label style={{
      display: 'block', fontSize: 10, fontWeight: 700, color: COLORS.gray,
      textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5,
    }}>{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%', padding: '9px 12px',
        border: `1px solid ${COLORS.blueLight}`, borderRadius: 9,
        fontSize: 13, background: COLORS.grayLight, outline: 'none',
        fontFamily: 'inherit', color: COLORS.grayDark,
        boxSizing: 'border-box',
      }}
    >
      {children}
    </select>
  </div>
);

/* ─── Toggle Row ──────────────────────────────────────────── */
const ToggleRow = ({
  title, description, checked, onChange,
}: {
  title: string; description: string; checked: boolean; onChange: (v: boolean) => void;
}) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 14px', borderRadius: 10,
    background: COLORS.grayLight, border: `1px solid ${COLORS.blueLight}`,
  }}>
    <div>
      <p style={{ fontWeight: 700, color: COLORS.grayDark, fontSize: 13 }}>{title}</p>
      <p style={{ fontSize: 11, color: COLORS.gray, marginTop: 2 }}>{description}</p>
    </div>
    <Toggle checked={checked} onChange={onChange} />
  </div>
);

/* ─── Info Row ────────────────────────────────────────────── */
const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 14px', borderRadius: 10,
    background: COLORS.grayLight, border: `1px solid ${COLORS.blueLight}`,
  }}>
    <span style={{ fontSize: 12, color: COLORS.gray, fontWeight: 600 }}>{label}</span>
    <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.grayDark }}>{value}</span>
  </div>
);

/* ─── Action Button ───────────────────────────────────────── */
const ActionButton = ({
  children, onClick, gradient = GRADIENTS.primary, disabled = false, icon: Icon,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  gradient?: string;
  disabled?: boolean;
  icon?: any;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      padding: '9px 18px', borderRadius: 9,
      background: gradient, color: COLORS.white,
      fontSize: 12, fontWeight: 700,
      border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'inherit', transition: 'transform 0.15s',
      opacity: disabled ? 0.6 : 1,
    }}
    onMouseEnter={(e) => { if (!disabled) (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)'; }}
    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
  >
    {Icon && <Icon size={13} />}
    {children}
  </button>
);

/* ─── Card Wrapper ────────────────────────────────────────── */
const Card = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{
    background: COLORS.white,
    border: `1px solid ${COLORS.blueLight}`,
    borderRadius: 14,
    overflow: 'hidden',
    transition: 'box-shadow 0.2s',
    ...style,
  }}
    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 5px 20px rgba(0,0,0,0.08)'; }}
    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
  >
    <GradientStripe height={2} />
    <div style={{ padding: 20 }}>{children}</div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
const ParametresManagement: React.FC = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('compte');
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [formData, setFormData] = useState({
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    notifEmail: true,
    notifSMS: false,
    notifPush: true,
    alertRupture: true,
    alertFaible: true,
    language: 'fr',
    timezone: 'Africa/Abidjan',
    currency: 'XOF',
    dataAnalytics: true,
    personalizedAds: false,
  });

  const sections = [
    { id: 'compte',          icon: User,       label: 'Compte' },
    { id: 'securite',        icon: Lock,       label: 'Sécurité' },
    { id: 'notifications',   icon: Bell,       label: 'Notifications' },
    { id: 'paiement',        icon: CreditCard, label: 'Paiement' },
    { id: 'international',   icon: Globe,      label: 'International' },
    { id: 'sauvegarde',      icon: Database,   label: 'Sauvegarde' },
    { id: 'confidentialite', icon: Shield,     label: 'Confidentialité' },
    { id: 'apropos',         icon: Info,       label: 'À propos' },
  ];

  const update = (key: string, value: any) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsLoading(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const showSaveBar = !['apropos', 'sauvegarde'].includes(activeSection);

  /* ── Section renderers ── */
  const renderCompte = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card>
        <SectionTitle icon={User} label="Informations du compte" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormInput label="Nom d'utilisateur" value={user?.username || ''} readOnly />
          <FormInput
            label="Email"
            type="email"
            value={formData.email}
            onChange={(v) => update('email', v)}
          />
        </div>
      </Card>

      <Card>
        <SectionTitle icon={Camera} label="Photo de profil" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 14,
            background: GRADIENTS.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, overflow: 'hidden',
            border: `2px solid ${COLORS.blueLight}`,
          }}>
            {user?.email
              ? <span style={{ fontSize: 24, fontWeight: 700, color: COLORS.white }}>
                  {user.email.substring(0, 2).toUpperCase()}
                </span>
              : <User size={28} color={COLORS.white} />}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <ActionButton gradient={GRADIENTS.primary} icon={Upload}>
              Changer la photo
            </ActionButton>
            <button style={{
              padding: '7px 14px', borderRadius: 9,
              border: `1px solid ${COLORS.blueLight}`,
              background: 'transparent', color: COLORS.gray,
              fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Supprimer
            </button>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderSecurite = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card>
        <SectionTitle icon={Lock} label="Changer le mot de passe" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FormInput
            label="Mot de passe actuel"
            type="password"
            value={formData.currentPassword}
            onChange={(v) => update('currentPassword', v)}
            placeholder="••••••••"
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FormInput
              label="Nouveau mot de passe"
              type="password"
              value={formData.newPassword}
              onChange={(v) => update('newPassword', v)}
              placeholder="••••••••"
            />
            <FormInput
              label="Confirmer le mot de passe"
              type="password"
              value={formData.confirmPassword}
              onChange={(v) => update('confirmPassword', v)}
              placeholder="••••••••"
            />
          </div>
          {formData.newPassword && formData.confirmPassword &&
            formData.newPassword !== formData.confirmPassword && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '10px 14px',
              borderRadius: 10, background: GRADIENTS.danger,
              border: `1px solid ${COLORS.red}`, color: COLORS.white, fontSize: 12, fontWeight: 600,
            }}>
              <AlertCircle size={13} /> Les mots de passe ne correspondent pas
            </div>
          )}
        </div>
      </Card>

      <Card>
        <SectionTitle icon={Shield} label="Authentification à deux facteurs" />
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', borderRadius: 10,
          background: COLORS.grayLight, border: `1px solid ${COLORS.blueLight}`,
        }}>
          <div>
            <p style={{ fontWeight: 700, color: COLORS.grayDark, fontSize: 13 }}>Authentification 2FA</p>
            <p style={{ fontSize: 11, color: COLORS.gray, marginTop: 2 }}>
              Ajoutez une couche de sécurité supplémentaire à votre compte
            </p>
          </div>
          <ActionButton gradient={GRADIENTS.success} icon={Shield}>Activer</ActionButton>
        </div>
      </Card>
    </div>
  );

  const renderNotifications = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card>
        <SectionTitle icon={Bell} label="Préférences de notification" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ToggleRow
            title="Notifications par email"
            description="Recevoir des notifications importantes par email"
            checked={formData.notifEmail}
            onChange={(v) => update('notifEmail', v)}
          />
          <ToggleRow
            title="Notifications SMS"
            description="Recevoir des alertes importantes par SMS"
            checked={formData.notifSMS}
            onChange={(v) => update('notifSMS', v)}
          />
          <ToggleRow
            title="Notifications push"
            description="Recevoir des notifications sur votre appareil"
            checked={formData.notifPush}
            onChange={(v) => update('notifPush', v)}
          />
        </div>
      </Card>

      <Card>
        <SectionTitle icon={AlertCircle} label="Alertes de stock" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ToggleRow
            title="Alertes de rupture"
            description="Recevoir une alerte quand un produit est en rupture"
            checked={formData.alertRupture}
            onChange={(v) => update('alertRupture', v)}
          />
          <ToggleRow
            title="Alertes de stock faible"
            description="Recevoir une alerte quand un produit est en stock faible"
            checked={formData.alertFaible}
            onChange={(v) => update('alertFaible', v)}
          />
        </div>
      </Card>
    </div>
  );

  const renderPaiement = () => (
    <Card>
      <SectionTitle icon={CreditCard} label="Méthodes de paiement" />
      <div style={{
        padding: 32, textAlign: 'center',
        border: `2px dashed ${COLORS.blueLight}`, borderRadius: 12,
      }}>
        <div style={{
          width: 52, height: 52, background: GRADIENTS.primary, borderRadius: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 12px',
        }}>
          <CreditCard size={22} color={COLORS.white} />
        </div>
        <p style={{ fontWeight: 700, color: COLORS.grayDark, fontSize: 13, marginBottom: 4 }}>
          Aucune méthode de paiement enregistrée
        </p>
        <p style={{ fontSize: 11, color: COLORS.gray, marginBottom: 16 }}>
          Ajoutez une carte bancaire ou un compte mobile money
        </p>
        <ActionButton gradient={GRADIENTS.primary} icon={CreditCard}>
          Ajouter un moyen de paiement
        </ActionButton>
      </div>
    </Card>
  );

  const renderInternational = () => (
    <Card>
      <SectionTitle icon={Globe} label="Langue et région" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        <FormSelect label="Langue" value={formData.language} onChange={(v) => update('language', v)}>
          <option value="fr">Français</option>
          <option value="en">English</option>
        </FormSelect>
        <FormSelect label="Fuseau horaire" value={formData.timezone} onChange={(v) => update('timezone', v)}>
          <option value="Africa/Abidjan">Abidjan (UTC+0)</option>
          <option value="Africa/Lagos">Lagos (UTC+1)</option>
          <option value="Europe/Paris">Paris (UTC+2)</option>
        </FormSelect>
        <FormSelect label="Devise" value={formData.currency} onChange={(v) => update('currency', v)}>
          <option value="XOF">Franc CFA (XOF)</option>
          <option value="EUR">Euro (€)</option>
          <option value="USD">Dollar US ($)</option>
        </FormSelect>
      </div>
    </Card>
  );

  const renderSauvegarde = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card>
        <SectionTitle icon={Database} label="Sauvegarde automatique" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <InfoRow label="Dernière sauvegarde" value="Aujourd'hui à 03h00" />
          <InfoRow label="Fréquence" value="Quotidienne" />
          <InfoRow label="Espace utilisé" value="2.4 Go / 10 Go" />
          <div style={{ height: 6, borderRadius: 10, background: COLORS.blueLight, marginTop: 4 }}>
            <div style={{ height: 6, borderRadius: 10, background: GRADIENTS.secondary, width: '24%' }} />
          </div>
        </div>
      </Card>
      <Card>
        <SectionTitle icon={Database} label="Export de données" />
        <p style={{ fontSize: 12, color: COLORS.gray, marginBottom: 14, lineHeight: 1.6 }}>
          Téléchargez une copie complète de vos données. Le fichier sera prêt dans quelques minutes.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <ActionButton gradient={GRADIENTS.primary} icon={Database}>
            Exporter en CSV
          </ActionButton>
          <ActionButton gradient={GRADIENTS.secondary} icon={Database}>
            Exporter en JSON
          </ActionButton>
        </div>
      </Card>
    </div>
  );

  const renderConfidentialite = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card>
        <SectionTitle icon={Shield} label="Paramètres de confidentialité" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ToggleRow
            title="Partage de données analytiques"
            description="Permettre le partage anonyme de données pour améliorer le service"
            checked={formData.dataAnalytics}
            onChange={(v) => update('dataAnalytics', v)}
          />
          <ToggleRow
            title="Publicité personnalisée"
            description="Permettre les publicités basées sur votre activité"
            checked={formData.personalizedAds}
            onChange={(v) => update('personalizedAds', v)}
          />
        </div>
      </Card>

      <Card>
        <SectionTitle icon={Shield} label="Export de données personnelles" />
        <p style={{ fontSize: 12, color: COLORS.gray, marginBottom: 14, lineHeight: 1.6 }}>
          Vous pouvez demander une exportation de toutes vos données personnelles stockées dans notre système.
        </p>
        <ActionButton gradient={GRADIENTS.warning} icon={Shield}>
          Exporter mes données
        </ActionButton>
      </Card>
    </div>
  );

  const renderApropos = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* App identity card */}
      <div style={{
        borderRadius: 16, background: GRADIENTS.dark, overflow: 'hidden',
      }}>
        <GradientStripe height={3} />
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{
              width: 60, height: 60, borderRadius: 14,
              background: GRADIENTS.primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: COLORS.white, fontWeight: 700, fontSize: 20 }}>LT</span>
            </div>
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: COLORS.white }}>LanfiaTech</h3>
              <span style={{
                fontSize: 11, padding: '3px 10px', borderRadius: 20,
                background: 'rgba(79,179,232,0.18)', color: COLORS.blueLight,
                fontWeight: 700, border: `1px solid rgba(79,179,232,0.3)`,
              }}>Version 1.0.0</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[
              { label: 'Utilisateurs', value: '1,200+' },
              { label: 'Distributeurs', value: '450+' },
              { label: 'Uptime', value: '99.9%' },
            ].map(({ label, value }) => (
              <div key={label} style={{
                background: 'rgba(79,179,232,0.10)', borderRadius: 10,
                padding: '12px 14px', textAlign: 'center',
              }}>
                <p style={{ fontSize: 20, fontWeight: 700, color: COLORS.white }}>{value}</p>
                <p style={{ fontSize: 10, color: 'rgba(200,230,248,0.60)', fontWeight: 600 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Card>
        <SectionTitle icon={Info} label="À propos de LanfiaTech" />
        <p style={{ fontSize: 13, color: COLORS.gray, lineHeight: 1.7, marginBottom: 16 }}>
          LanfiaTech est une plateforme de gestion complète pour les points de vente et distributeurs en Afrique.
          Notre mission est de digitaliser et simplifier la gestion des petites et moyennes entreprises.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{
            padding: '8px 16px', borderRadius: 9,
            border: `1px solid ${COLORS.blueLight}`,
            background: 'transparent', color: COLORS.blueDark,
            fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>Conditions d'utilisation</button>
          <button style={{
            padding: '8px 16px', borderRadius: 9,
            border: `1px solid ${COLORS.blueLight}`,
            background: 'transparent', color: COLORS.blueDark,
            fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>Politique de confidentialité</button>
        </div>
      </Card>

      <Card>
        <SectionTitle icon={Info} label="Support" />
        <p style={{ fontSize: 12, color: COLORS.gray, marginBottom: 14, lineHeight: 1.6 }}>
          Pour toute question ou problème, notre équipe est disponible 24h/24.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <InfoRow label="Email support" value="support@lanfiatech.com" />
          <InfoRow label="Téléphone" value="+225 XX XX XX XX" />
          <InfoRow label="Horaires" value="Lun–Ven · 8h–18h" />
        </div>
        <div style={{ marginTop: 14 }}>
          <ActionButton gradient={GRADIENTS.primary} icon={Info}>
            Contacter le support
          </ActionButton>
        </div>
      </Card>
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case 'compte':          return renderCompte();
      case 'securite':        return renderSecurite();
      case 'notifications':   return renderNotifications();
      case 'paiement':        return renderPaiement();
      case 'international':   return renderInternational();
      case 'sauvegarde':      return renderSauvegarde();
      case 'confidentialite': return renderConfidentialite();
      case 'apropos':         return renderApropos();
      default:
        return (
          <Card>
            <p style={{ fontSize: 13, color: COLORS.gray }}>
              Cette section est en cours de développement.
            </p>
          </Card>
        );
    }
  };

  /* ── Main render ── */
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F2F6FA 0%, #E8F0F5 100%)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 20px' }}>

        {/* Page header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 4, height: 24, background: GRADIENTS.primary, borderRadius: 2 }} />
            <h1 style={{ fontSize: 20, fontWeight: 700, color: COLORS.grayDark }}>Paramètres</h1>
          </div>
          <p style={{ fontSize: 12, color: COLORS.grayMuted, paddingLeft: 14, fontWeight: 500 }}>
            Gérez votre compte, sécurité et préférences
          </p>
        </div>

        {/* Success banner */}
        {saveSuccess && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 16px', borderRadius: 12, marginBottom: 16,
            background: GRADIENTS.success, border: `1px solid ${COLORS.greenLight}`,
            color: COLORS.white, fontSize: 13, fontWeight: 600,
          }}>
            <CheckCircle size={15} style={{ flexShrink: 0 }} />
            Paramètres mis à jour avec succès !
            <button onClick={() => setSaveSuccess(false)}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={14} color={COLORS.white} />
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 20 }}>

          {/* ── Sidebar ── */}
          <div style={{
            background: COLORS.white,
            border: `1px solid ${COLORS.blueLight}`,
            borderRadius: 14,
            overflow: 'hidden',
            height: 'fit-content',
          }}>
            <GradientStripe height={3} />
            <div style={{ padding: '18px 16px 6px' }}>
              <h2 style={{
                fontSize: 13, fontWeight: 700, color: COLORS.grayDark,
                textTransform: 'uppercase', letterSpacing: '0.07em',
                display: 'flex', alignItems: 'center', gap: 7,
              }}>
                <Settings size={14} color={COLORS.blue} /> Paramètres
              </h2>
            </div>
            <nav style={{ padding: '8px 10px 14px' }}>
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', borderRadius: 10, marginBottom: 2,
                      border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(102,126,234,0.12) 0%, rgba(118,75,162,0.08) 100%)'
                        : 'transparent',
                      color: isActive ? COLORS.blueDark : COLORS.gray,
                      transition: 'all 0.15s',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.background = COLORS.grayLight;
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                  >
                    <div style={{
                      width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                      background: isActive ? GRADIENTS.primary : COLORS.grayLight,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}>
                      <Icon size={14} color={isActive ? COLORS.white : COLORS.gray} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 500 }}>
                      {section.label}
                    </span>
                    {isActive && (
                      <div style={{
                        marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%',
                        background: GRADIENTS.primary,
                      }} />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* User mini card */}
            <div style={{
              margin: '0 10px 14px',
              padding: '12px 14px', borderRadius: 12,
              background: GRADIENTS.dark,
              border: `1px solid ${COLORS.blueLight}`,
            }}>
              <GradientStripe height={2} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                  background: GRADIENTS.primary,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ color: COLORS.white, fontWeight: 700, fontSize: 12 }}>
                    {(user?.email || 'U').substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: COLORS.white }}>
                    {user?.username || 'Utilisateur'}
                  </p>
                  <p style={{ fontSize: 10, color: 'rgba(200,230,248,0.65)', fontWeight: 500 }}>
                    {user?.email || '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Content ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {renderSection()}

            {/* Save bar */}
            {showSaveBar && (
              <div style={{
                display: 'flex', justifyContent: 'flex-end', gap: 10,
                padding: '14px 20px', borderRadius: 14,
                background: COLORS.white,
                border: `1px solid ${COLORS.blueLight}`,
              }}>
                <button
                  style={{
                    padding: '9px 18px', borderRadius: 9,
                    border: `1px solid ${COLORS.blueLight}`,
                    background: COLORS.grayLight, color: COLORS.grayDark,
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    padding: '9px 20px', borderRadius: 9,
                    background: isLoading ? COLORS.blueLight : GRADIENTS.primary,
                    color: COLORS.white, fontSize: 12, fontWeight: 700,
                    border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', transition: 'transform 0.15s',
                  }}
                  onMouseEnter={(e) => { if (!isLoading) (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                >
                  {isLoading
                    ? <><Loader2 size={13} className="animate-spin" /> Enregistrement...</>
                    : <><Save size={13} /> Enregistrer les modifications</>}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParametresManagement;