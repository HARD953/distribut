"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";
import {
  Eye,
  EyeOff,
  Lock,
  ArrowRight,
  Loader2,
  AlertTriangle,
  BarChart3,
  Zap,
  Map as MapIcon,
  Link2,
  Wallet,
  Landmark,
  Code2,
  ShieldCheck,
  Check,
  ArrowUp,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────────────────
   PAGE DE CONNEXION — version corrigée (option A) + design amélioré

   CORRECTIONS
   - login() est appelé avec 2 arguments (username, password), conformément
     à la signature actuelle de AuthContext → plus d'erreur
     "Expected 2 arguments, but got 3".
   - L'instance choisie reste côté client (localStorage "lanfia_instance") :
     elle est mémorisée après une connexion réussie, et pré-sélectionnée à
     la visite suivante. Le dashboard peut la lire pour mettre en avant
     l'onglet correspondant.
   - Suppression du code mort : usernameRef inutilisée, InstanceCardGrid
     non branché, type InstanceValue non utilisé.

   DESIGN
   - Le Merchant Graph reste le geste visuel principal (seul élément
     animé en continu), avec une légende qui explique ce que les couleurs
     représentent.
   - Sélecteur d'instance en tuiles (vrai groupe de radios, navigable aux
     flèches) à la place du <select> natif : les 8 offres sont visibles
     d'un coup d'œil.
   - Champs avec icône, avertissement Verr. Maj., focus visible,
     récapitulatif de l'instance choisie, mouvement réduit respecté.
   ──────────────────────────────────────────────────────────────────── */

// ─── Types ──────────────────────────────────────────────────────────────

interface FormState {
  instance: string;
  username: string;
  password: string;
  rememberMe: boolean;
}

interface FormErrors {
  instance?: string;
  username?: string;
  password?: string;
  general?: string;
}

const INSTANCE_STORAGE_KEY = "lanfia_instance";

// ─── Contenu ──────────────────────────────────────────────────────────

const FEATURES = [
  {
    label: "Merchant Graph vérifié",
    sub: "Un identifiant durable et un historique complet pour chaque point de vente",
  },
  {
    label: "Intelligence et agents IA",
    sub: "Scoring de potentiel, recommandations et exécution supervisée",
  },
  {
    label: "Paiement et activation intégrés",
    sub: "Commandes, preuves de terrain et règlements connectés",
  },
] as const;

const STATS = [
  { value: "500+", label: "Points de vente" },
  { value: "99.9%", label: "Disponibilité" },
  { value: "24/7", label: "Supervision terrain" },
] as const;

const INSTANCES = [
  { value: "intelligence", short: "Intelligence", label: "LanfiaLink Intelligence", sub: "Savoir où vendre et où investir", icon: BarChart3 },
  { value: "activate", short: "Activate", label: "LanfiaLink Activate", sub: "Exécuter et prouver une activation", icon: Zap },
  { value: "route", short: "Route", label: "LanfiaLink Route", sub: "Optimiser force de vente et couverture", icon: MapIcon },
  { value: "connect", short: "Connect", label: "LanfiaLink Connect", sub: "Relier boutique, distributeur et commande", icon: Link2 },
  { value: "pay", short: "Pay", label: "LanfiaLink Pay", sub: "Orchestrer paiements et rapprochement", icon: Wallet },
  { value: "finance", short: "Finance", label: "LanfiaLink Finance", sub: "Déclencher du stock financé par partenaire", icon: Landmark },
  { value: "api", short: "API", label: "LanfiaLink API", sub: "Exposer le Merchant Graph aux SI autorisés", icon: Code2 },
  { value: "compliance", short: "Compliance", label: "LanfiaLink Compliance", sub: "Branding, démarches et taxes associées", icon: ShieldCheck },
] as const;

/* ─── Le Merchant Graph — geste visuel principal ───────────────────────
   Coordonnées fixes (pas de Math.random au rendu : aucun écart
   serveur/client). Les nœuds orange = points de vente vérifiés ; les
   arêtes pulsées suggèrent un flux d'activité (illustration, pas de
   données en direct). */
const GRAPH_NODES: Array<{ x: number; y: number; r: number; delay: number; hub?: boolean }> = [
  { x: 120, y: 70, r: 3.5, delay: 0.0 },
  { x: 205, y: 55, r: 3, delay: 0.4 },
  { x: 285, y: 100, r: 3.5, delay: 0.8 },
  { x: 345, y: 170, r: 4, delay: 1.2 },
  { x: 85, y: 175, r: 3, delay: 0.6 },
  { x: 165, y: 215, r: 5, delay: 0.2, hub: true },
  { x: 250, y: 235, r: 3, delay: 1.0 },
  { x: 335, y: 275, r: 3.5, delay: 1.6 },
  { x: 65, y: 300, r: 3, delay: 1.4 },
  { x: 145, y: 340, r: 6.5, delay: 0.0, hub: true },
  { x: 225, y: 360, r: 3.5, delay: 0.9 },
  { x: 305, y: 375, r: 3, delay: 1.8 },
  { x: 385, y: 335, r: 4, delay: 0.5 },
  { x: 100, y: 430, r: 3, delay: 1.1 },
  { x: 185, y: 460, r: 4, delay: 0.3 },
  { x: 265, y: 480, r: 3.5, delay: 1.5 },
  { x: 345, y: 460, r: 3, delay: 0.7 },
  { x: 125, y: 540, r: 3.5, delay: 1.3 },
  { x: 205, y: 570, r: 3, delay: 0.1 },
  { x: 285, y: 560, r: 4, delay: 1.7 },
];

const GRAPH_EDGES: Array<[number, number, boolean?]> = [
  [0, 1], [1, 2], [2, 3], [0, 4], [1, 5, true], [4, 5],
  [5, 6], [6, 2], [6, 7], [7, 3], [4, 8], [8, 9, true],
  [5, 9, true], [9, 10], [6, 10], [10, 11], [7, 11], [11, 12],
  [8, 13], [9, 13], [9, 14], [10, 14], [13, 17], [14, 17],
  [14, 18], [15, 18], [15, 19], [11, 16], [10, 15],
];

const MerchantGraphBackground: React.FC = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 440 640"
    className="absolute inset-0 w-full h-full"
    preserveAspectRatio="xMidYMid slice"
  >
    <defs>
      <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#E8722D" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#E8722D" stopOpacity="0" />
      </radialGradient>
      <pattern id="dotGrid" width="22" height="22" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r="0.8" fill="rgba(79,179,232,0.10)" />
      </pattern>
    </defs>

    <rect width="440" height="640" fill="url(#dotGrid)" />

    {GRAPH_EDGES.map(([a, b, pulse], i) => {
      const n1 = GRAPH_NODES[a];
      const n2 = GRAPH_NODES[b];
      return (
        <g key={`edge-${i}`}>
          <line
            x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y}
            stroke="rgba(79,179,232,0.22)" strokeWidth="1"
          />
          {pulse && (
            <line
              x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y}
              stroke="#4FB3E8" strokeWidth="1.5"
              strokeDasharray="5 46"
              className="graph-edge-flow"
              style={{ animationDelay: `${i * 0.5}s` }}
            />
          )}
        </g>
      );
    })}

    {GRAPH_NODES.map((n, i) => (
      <g key={`node-${i}`}>
        {n.hub && n.r > 6 && (
          <circle cx={n.x} cy={n.y} r={26} fill="url(#hubGlow)" className="graph-hub-glow" />
        )}
        {n.hub && (
          <circle
            cx={n.x} cy={n.y} r={n.r + 5}
            fill="none"
            stroke={n.r > 6 ? "rgba(232,114,45,.45)" : "rgba(79,179,232,.35)"}
            strokeWidth="1"
          />
        )}
        <circle
          cx={n.x} cy={n.y} r={n.r}
          fill={n.r > 6 ? "#E8722D" : n.hub ? "#4FB3E8" : "#7FC4EE"}
          className={n.r > 6 ? "graph-hub-pulse" : "graph-node-breathe"}
          style={{ animationDelay: `${n.delay}s`, transformOrigin: `${n.x}px ${n.y}px` }}
        />
      </g>
    ))}
  </svg>
);

// ─── Marque LanfiaLink ─────────────────────────────────────────────────

const BrandMark: React.FC<{ dark?: boolean }> = ({ dark }) => (
  <div
    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
    style={{
      background: dark ? "linear-gradient(135deg,#1A8FD1,#0D6FAB)" : "#0D1B2A",
      boxShadow: dark ? "0 6px 20px rgba(26,143,209,.35)" : "none",
    }}
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
    </svg>
  </div>
);

// ─── Champ de formulaire (texte) ───────────────────────────────────────

interface FieldProps {
  id: string;
  name: "username" | "password";
  label: string;
  type?: string;
  value: string;
  error?: string;
  hint?: React.ReactNode;
  disabled?: boolean;
  placeholder?: string;
  autoComplete?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyUp?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRef?: React.Ref<HTMLInputElement>;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({
  id, name, label, type = "text", value, error, hint,
  disabled, placeholder, autoComplete, onChange, onKeyUp,
  inputRef, prefix, suffix,
}) => (
  <div className="space-y-2">
    <label htmlFor={id} className="block text-[12.5px] font-medium" style={{ color: "#3A5A72" }}>
      {label}
    </label>
    <div className="relative">
      {prefix && (
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none"
          style={{ color: "#8AAABF" }}
        >
          {prefix}
        </div>
      )}
      <input
        ref={inputRef}
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onKeyUp={onKeyUp}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoCapitalize="none"
        spellCheck={false}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        style={{
          width: "100%",
          height: 50,
          padding: `0 ${suffix ? 46 : 16}px 0 ${prefix ? 44 : 16}px`,
          background: "#F0F5F9",
          border: `1.5px solid ${error ? "#E05C3A" : "#C8D8E8"}`,
          borderRadius: 14,
          color: "#0D1B2A",
          fontSize: 14.5,
          fontFamily: "inherit",
          outline: "none",
          transition: "border .15s, background .15s, box-shadow .15s",
          opacity: disabled ? 0.45 : 1,
          cursor: disabled ? "not-allowed" : "text",
        }}
        onFocus={(e) => {
          e.currentTarget.style.background = "white";
          e.currentTarget.style.borderColor = error ? "#E05C3A" : "#1A8FD1";
          e.currentTarget.style.boxShadow = error
            ? "0 0 0 4px rgba(224,92,58,.12)"
            : "0 0 0 4px rgba(26,143,209,.14)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.background = "#F0F5F9";
          e.currentTarget.style.borderColor = error ? "#E05C3A" : "#C8D8E8";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
      {suffix && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3.5">
          {suffix}
        </div>
      )}
    </div>
    {hint}
    {error && (
      <p id={`${id}-err`} role="alert" className="flex items-center gap-1.5 text-xs" style={{ color: "#C04020" }}>
        <AlertTriangle size={11} aria-hidden="true" />
        {error}
      </p>
    )}
  </div>
);

// ─── Sélecteur d'instance — tuiles ─────────────────────────────────────
// Vrai groupe de radios (name partagé, masqué visuellement) : navigation
// clavier native aux flèches, focus visible porté par la tuile, état
// sélectionné lisible par les lecteurs d'écran.

interface InstancePickerProps {
  value: string;
  error?: string;
  disabled?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const InstancePicker: React.FC<InstancePickerProps> = ({ value, error, disabled, onChange }) => {
  const selected = INSTANCES.find((i) => i.value === value);
  return (
    <fieldset className="space-y-2.5" disabled={disabled} style={{ border: "none", padding: 0, margin: 0, minWidth: 0 }}>
      <legend className="block text-[12.5px] font-medium mb-2.5 p-0" style={{ color: "#3A5A72" }}>
        Instance LanfiaLink
      </legend>

      <div
        role="radiogroup"
        aria-label="Instance LanfiaLink"
        aria-describedby={error ? "instance-err" : undefined}
        className="grid grid-cols-2 sm:grid-cols-4 gap-2"
      >
        {INSTANCES.map((inst) => {
          const isSelected = value === inst.value;
          const Icon = inst.icon;
          return (
            <label
              key={inst.value}
              htmlFor={`instance-${inst.value}`}
              title={inst.label}
              className="relative flex flex-col items-start gap-2 select-none transition-all duration-150 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#1A8FD1]"
              style={{
                padding: "10px 10px 11px",
                borderRadius: 14,
                border: `1.5px solid ${isSelected ? "#1A8FD1" : error ? "#EBC2B3" : "#C8D8E8"}`,
                background: isSelected ? "#FFFFFF" : "#F0F5F9",
                boxShadow: isSelected ? "0 4px 14px rgba(26,143,209,.16)" : "none",
                opacity: disabled ? 0.45 : 1,
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            >
              <input
                type="radio"
                id={`instance-${inst.value}`}
                name="instance"
                value={inst.value}
                checked={isSelected}
                onChange={onChange}
                disabled={disabled}
                className="sr-only"
              />
              <div className="flex w-full items-start justify-between">
                <div
                  aria-hidden="true"
                  className="flex items-center justify-center shrink-0 transition-colors duration-150"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: isSelected ? "#1A8FD1" : "#DCE9F2",
                    color: isSelected ? "#FFFFFF" : "#5A87A3",
                  }}
                >
                  <Icon size={14} strokeWidth={2} />
                </div>
                {isSelected && (
                  <div
                    aria-hidden="true"
                    className="flex items-center justify-center"
                    style={{ width: 15, height: 15, borderRadius: "50%", background: "#1A8FD1" }}
                  >
                    <Check size={9} color="white" strokeWidth={3.5} />
                  </div>
                )}
              </div>
              <span
                className="text-[12px] font-semibold leading-none"
                style={{ color: isSelected ? "#0D1B2A" : "#4A6B85" }}
              >
                {inst.short}
              </span>
            </label>
          );
        })}
      </div>

      <div aria-live="polite" style={{ minHeight: 18 }}>
        {selected && !error && (
          <p className="text-[12px] leading-relaxed" style={{ color: "#6B8299" }}>
            {selected.sub}
          </p>
        )}
        {error && (
          <p id="instance-err" role="alert" className="flex items-center gap-1.5 text-xs" style={{ color: "#C04020" }}>
            <AlertTriangle size={11} aria-hidden="true" />
            {error}
          </p>
        )}
      </div>
    </fieldset>
  );
};

// ─── Page principale ───────────────────────────────────────────────────

const LoginPage: React.FC = () => {
  const [form, setForm] = useState<FormState>({
    instance: "",
    username: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const { login, isLoading, error: authError } = useAuth();

  // Pré-sélectionne la dernière instance utilisée, puis place le focus
  // sur l'identifiant (si l'instance est connue) pour gagner un clic.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(INSTANCE_STORAGE_KEY);
      if (saved && INSTANCES.some((i) => i.value === saved)) {
        setForm((prev) => ({ ...prev, instance: saved }));
        usernameRef.current?.focus();
      }
    } catch {
      /* localStorage indisponible : on ignore */
    }
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value, type, checked } = e.target;
      setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
      setErrors((prev) => {
        if (!(name in prev) && !prev.general) return prev;
        const next = { ...prev };
        delete next[name as keyof FormErrors];
        delete next.general;
        return next;
      });
    },
    []
  );

  const handlePasswordKeyUp = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsLock(e.getModifierState("CapsLock"));
  }, []);

  const validate = useCallback((): FormErrors => {
    const errs: FormErrors = {};
    if (!form.instance) errs.instance = "Choisissez l'instance à laquelle vous connecter";
    if (!form.username.trim()) errs.username = "L'identifiant est requis";
    if (!form.password) errs.password = "Le mot de passe est requis";
    else if (form.password.length < 6) errs.password = "Minimum 6 caractères";
    return errs;
  }, [form]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const validationErrors = validate();
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }
      setErrors({});
      try {
        // Option A : login() n'accepte que (username, password).
        // L'instance reste côté client pour l'instant.
        const result = await login(form.username.trim(), form.password);
        if (result.success) {
          try {
            localStorage.setItem(INSTANCE_STORAGE_KEY, form.instance);
          } catch {
            /* non bloquant */
          }
          router.push("/dashboard");
        } else {
          setErrors({ general: result.error ?? "Identifiants incorrects. Vérifiez-les puis réessayez." });
        }
      } catch {
        setErrors({ general: "Connexion impossible. Vérifiez votre réseau puis réessayez." });
      }
    },
    [form, login, router, validate]
  );

  const togglePassword = useCallback(() => setShowPassword((v) => !v), []);
  const generalError = errors.general ?? authError;
  const selectedInstance = INSTANCES.find((i) => i.value === form.instance);

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: "#E8F4FB" }}>
      <style>{`
        @keyframes graphNodeBreathe {
          0%, 100% { opacity: .5; transform: scale(1); }
          50%      { opacity: 1;  transform: scale(1.25); }
        }
        @keyframes graphHubPulse {
          0%, 100% { opacity: .9; transform: scale(1); }
          50%      { opacity: 1;  transform: scale(1.18); }
        }
        @keyframes graphHubGlow {
          0%, 100% { opacity: .3; }
          50%      { opacity: .7; }
        }
        @keyframes graphEdgeFlow {
          from { stroke-dashoffset: 51; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes panelReveal {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .graph-node-breathe { animation: graphNodeBreathe 4.5s ease-in-out infinite; }
        .graph-hub-pulse     { animation: graphHubPulse 3.2s ease-in-out infinite; }
        .graph-hub-glow      { animation: graphHubGlow 3.2s ease-in-out infinite; }
        .graph-edge-flow     { animation: graphEdgeFlow 3.6s linear infinite; }
        .panel-reveal        { animation: panelReveal .5s ease both; }
        .login-submit:focus-visible,
        .login-link:focus-visible,
        .login-eye:focus-visible {
          outline: 2px solid #1A8FD1;
          outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) {
          .graph-node-breathe, .graph-hub-pulse, .graph-hub-glow, .graph-edge-flow, .panel-reveal {
            animation: none !important;
          }
        }
      `}</style>

      {/* ────── Panneau gauche : le Merchant Graph ────── */}
      <aside
        className="hidden lg:flex lg:w-[50%] xl:w-[52%] flex-col justify-between overflow-hidden relative"
        style={{ background: "#0D1B2A" }}
      >
        <div
          aria-hidden="true"
          className="absolute top-0 left-0 right-0 h-1 z-10"
          style={{ background: "linear-gradient(90deg,#0D6FAB 0%,#1A8FD1 40%,#4FB3E8 70%,#1A8FD1 100%)" }}
        />

        <MerchantGraphBackground />

        {/* Voile pour garder le texte lisible par-dessus le graphe */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(13,27,42,0.50) 0%, rgba(13,27,42,0.78) 55%, rgba(13,27,42,0.93) 100%)" }}
        />

        <div className="relative z-10 flex flex-col justify-between h-full p-12 xl:p-16">
          <div>
            <div className="flex items-center gap-3.5 mb-16">
              <BrandMark dark />
              <div>
                <p className="text-white font-bold text-[17px] tracking-tight leading-none">LanfiaLink</p>
                <p className="text-[11.5px] mt-1.5" style={{ color: "rgba(127,196,238,.7)" }}>
                  Infrastructure commerciale intelligente
                </p>
              </div>
            </div>

            <h1
              className="font-bold leading-[1.15] tracking-tight mb-6"
              style={{ fontSize: "clamp(28px,3.2vw,40px)", color: "#F0F8FF", maxWidth: 440 }}
            >
              Le commerce de proximité, cartographié et activé.
            </h1>

            <p
              className="text-[14.5px] leading-relaxed max-w-[360px] mb-12"
              style={{ color: "rgba(190,220,240,.72)" }}
            >
              Chaque point de vente, chaque événement, chaque preuve d'exécution
              réunis dans un même graphe, pour vos équipes terrain, vos marques
              partenaires et vos agents IA.
            </p>

            <div className="space-y-6 mb-12">
              {FEATURES.map(({ label, sub }) => (
                <div key={label} className="flex items-start gap-3.5">
                  <div className="w-1.5 h-1.5 rounded-full mt-[8px] shrink-0" style={{ background: "#4FB3E8" }} aria-hidden="true" />
                  <div>
                    <p className="text-[14px] font-medium" style={{ color: "rgba(240,248,255,.92)" }}>{label}</p>
                    <p className="text-[12.5px] mt-1 leading-relaxed" style={{ color: "rgba(190,220,240,.58)" }}>{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex border-t pt-7" style={{ borderColor: "rgba(79,179,232,.16)" }}>
              {STATS.map(({ value, label }, i) => (
                <div key={label} className="flex-1 text-center"
                  style={{ borderRight: i < STATS.length - 1 ? "1px solid rgba(79,179,232,.12)" : "none" }}>
                  <p className="font-bold tabular-nums" style={{ fontSize: 22, color: "#4FB3E8" }}>{value}</p>
                  <p className="text-[11px] mt-1.5" style={{ color: "rgba(190,220,240,.55)" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-end justify-between gap-6">
            <p className="text-[11px]" style={{ color: "rgba(190,220,240,.4)" }}>
              © {new Date().getFullYear()} LanfiaLink, Abidjan, Côte d'Ivoire
            </p>
            {/* Légende : explique le graphe d'arrière-plan (illustration) */}
            <ul className="flex items-center gap-4 text-[11px]" style={{ color: "rgba(190,220,240,.55)" }} aria-label="Légende du graphe">
              <li className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full" style={{ background: "#E8722D" }} aria-hidden="true" />
                Point vérifié
              </li>
              <li className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full" style={{ background: "#7FC4EE" }} aria-hidden="true" />
                Point référencé
              </li>
            </ul>
          </div>
        </div>
      </aside>

      {/* ────── Panneau droit : formulaire ────── */}
      <main className="flex-1 flex items-center justify-center px-6 py-12" style={{ background: "#E8F4FB" }}>
        <div className="w-full max-w-[420px] panel-reveal">
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <BrandMark />
            <span className="font-bold text-[16px]" style={{ color: "#0D1B2A" }}>LanfiaLink</span>
          </div>

          <div
            className="rounded-3xl px-6 py-8 sm:px-8"
            style={{
              background: "#FFFFFF",
              border: "1px solid #D4E4F0",
              boxShadow: "0 24px 60px -24px rgba(13,60,100,.28)",
            }}
          >
            <h2 className="font-bold tracking-tight mb-2" style={{ fontSize: 26, color: "#0D1B2A" }}>
              Connexion
            </h2>
            <p className="text-[13.5px] leading-relaxed mb-7" style={{ color: "#6B8299" }}>
              {selectedInstance ? (
                <>Vous vous connectez à <strong style={{ color: "#0D6FAB" }}>{selectedInstance.label}</strong>.</>
              ) : (
                "Choisissez votre instance, puis entrez vos identifiants."
              )}
            </p>

            {generalError && (
              <div
                role="alert"
                aria-live="polite"
                className="flex items-start gap-3 px-4 py-3.5 rounded-2xl mb-6 border"
                style={{ background: "#FEF0ED", borderColor: "#F5C4B3" }}
              >
                <AlertTriangle size={14} className="mt-0.5 shrink-0" style={{ color: "#C04020" }} aria-hidden="true" />
                <div>
                  <p className="text-[12.5px] font-semibold" style={{ color: "#C04020" }}>Connexion refusée</p>
                  <p className="text-xs mt-0.5" style={{ color: "#9A3018" }}>{generalError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              <InstancePicker
                value={form.instance}
                error={errors.instance}
                disabled={isLoading}
                onChange={handleChange}
              />

              <div className="h-px" style={{ background: "#E1ECF4" }} aria-hidden="true" />

              <Field
                id="username" name="username" label="Identifiant"
                inputRef={usernameRef}
                value={form.username} error={errors.username} disabled={isLoading}
                placeholder="ex : j.kouassi" autoComplete="username" onChange={handleChange}
              />

              <Field
                id="password" name="password" label="Mot de passe"
                type={showPassword ? "text" : "password"}
                value={form.password} error={errors.password} disabled={isLoading}
                placeholder="••••••••" autoComplete="current-password"
                onChange={handleChange} onKeyUp={handlePasswordKeyUp}
                hint={
                  capsLock ? (
                    <p className="flex items-center gap-1.5 text-xs" style={{ color: "#8A5A00" }} role="status">
                      <ArrowUp size={11} aria-hidden="true" />
                      Verrouillage majuscules activé
                    </p>
                  ) : null
                }
                suffix={
                  <button
                    type="button" onClick={togglePassword} disabled={isLoading}
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    aria-pressed={showPassword}
                    className="login-eye rounded-md p-1 transition-colors disabled:pointer-events-none"
                    style={{ color: "#8AAABF", background: "none", border: "none", cursor: "pointer" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#1A8FD1"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#8AAABF"; }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />

              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2.5 cursor-pointer select-none focus-within:outline focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-[#1A8FD1] rounded">
                  <div className="relative">
                    <input
                      type="checkbox" name="rememberMe" checked={form.rememberMe}
                      onChange={handleChange} disabled={isLoading} className="sr-only"
                    />
                    <div
                      aria-hidden="true"
                      className="w-4 h-4 rounded flex items-center justify-center transition-all"
                      style={{
                        border: `1.5px solid ${form.rememberMe ? "#1A8FD1" : "#B5C9DA"}`,
                        background: form.rememberMe ? "#1A8FD1" : "#F0F5F9",
                      }}
                    >
                      {form.rememberMe && (
                        <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="none">
                          <polyline points="1.5,6 4.5,9 10.5,3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-[13px]" style={{ color: "#5A7A92" }}>Rester connecté</span>
                </label>

                <button
                  type="button" disabled={isLoading}
                  className="login-link text-[13px] rounded transition-colors disabled:pointer-events-none"
                  style={{ color: "#0D6FAB", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#084F7E"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#0D6FAB"; }}
                >
                  Mot de passe oublié ?
                </button>
              </div>

              <button
                type="submit" disabled={isLoading}
                className="login-submit w-full flex items-center justify-center gap-2.5 font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
                style={{
                  height: 52, borderRadius: 14, border: "none",
                  background: "linear-gradient(135deg,#1A8FD1,#0D6FAB)",
                  color: "white", fontSize: 14.5,
                  boxShadow: "0 10px 24px -10px rgba(13,111,171,.7)",
                  cursor: isLoading ? "not-allowed" : "pointer",
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                    <span>Connexion en cours…</span>
                  </>
                ) : (
                  <>
                    <span>Se connecter</span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 flex items-start gap-3 px-2">
            <div
              className="flex items-center justify-center shrink-0 rounded-full"
              style={{ width: 28, height: 28, background: "#D6EAF6", color: "#0D6FAB" }}
              aria-hidden="true"
            >
              <Lock size={12} />
            </div>
            <p className="text-[12.5px] leading-relaxed" style={{ color: "#6B8299" }}>
              Pas encore de compte ? Demandez vos identifiants nominatifs à votre
              administrateur. Chaque compte est lié à un rôle défini, et la
              connexion est chiffrée.
            </p>
          </div>

          <p className="lg:hidden mt-8 text-center text-[11px]" style={{ color: "#7F9BB2" }}>
            © {new Date().getFullYear()} LanfiaLink, Abidjan, Côte d'Ivoire
          </p>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;