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
  Building2,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface FormState {
  username: string;
  password: string;
  rememberMe: boolean;
}

interface FormErrors {
  username?: string;
  password?: string;
  general?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    label: "Tableau de bord statistiques",
    sub: "Ventes, performances & tendances en temps réel",
  },
  {
    label: "Gestion des commerciaux terrain",
    sub: "Suivi des ambulants par zone & commune",
  },
  {
    label: "Supply chain intégrée",
    sub: "De l'entrepôt au point de vente, bout en bout",
  },
] as const;

const STATS = [
  { value: "500+", label: "Points de vente" },
  { value: "99.9%", label: "Disponibilité" },
  { value: "24/7", label: "Monitoring" },
] as const;

// ─── Palette ─────────────────────────────────────────────────────────────────────
// Inspirée du kente et de la nature ivoirienne :
//   Vert forêt  #2D5A3D  — dominante gauche, confiance & ancrage
//   Ocre doré   #C07A2F  — accent, chaleur & soleil
//   Or pâle     #F0C878  — highlight texte, kente bands
//   Crème ivoire #FAF7F0 — fond droit, lumineux
//   Sable chaud  #F2EDE0  — surfaces de formulaire

// ─── Field Component ─────────────────────────────────────────────────────────────

interface FieldProps {
  id: string;
  name: keyof Omit<FormState, "rememberMe">;
  label: string;
  type?: string;
  value: string;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  autoComplete?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  suffix?: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({
  id, name, label, type = "text", value, error,
  disabled, placeholder, autoComplete, onChange, suffix,
}) => (
  <div className="space-y-2">
    <label
      htmlFor={id}
      className="block text-[10.5px] font-semibold uppercase tracking-widest"
      style={{ color: "#7A6A52" }}
    >
      {label}
    </label>
    <div className="relative">
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        style={{
          width: "100%",
          height: 44,
          padding: suffix ? "0 44px 0 16px" : "0 16px",
          background: "#F2EDE0",
          border: `1.5px solid ${error ? "#C07A2F" : "#D4C4A0"}`,
          borderRadius: 12,
          color: "#2A1A08",
          fontSize: 13.5,
          fontFamily: "inherit",
          outline: "none",
          transition: "border .15s, background .15s, box-shadow .15s",
          opacity: disabled ? 0.4 : 1,
          cursor: disabled ? "not-allowed" : "text",
        }}
        onFocus={(e) => {
          e.currentTarget.style.background = "white";
          e.currentTarget.style.borderColor = error ? "#C07A2F" : "#2D5A3D";
          e.currentTarget.style.boxShadow = error
            ? "0 0 0 3px rgba(192,122,47,.14)"
            : "0 0 0 3px rgba(45,90,61,.10)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.background = "#F2EDE0";
          e.currentTarget.style.borderColor = error ? "#C07A2F" : "#D4C4A0";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
      {suffix && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {suffix}
        </div>
      )}
    </div>
    {error && (
      <p
        id={`${id}-err`}
        role="alert"
        className="flex items-center gap-1.5 text-xs"
        style={{ color: "#9A5E1A" }}
      >
        <AlertTriangle size={11} aria-hidden="true" />
        {error}
      </p>
    )}
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────────

const LoginPage: React.FC = () => {
  const [form, setForm] = useState<FormState>({
    username: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const { login, isLoading, error: authError } = useAuth();

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value, type, checked } = e.target;
      setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
      if (name in errors) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[name as keyof FormErrors];
          return next;
        });
      }
    },
    [errors]
  );

  const validate = useCallback((): FormErrors => {
    const errs: FormErrors = {};
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
        const result = await login(form.username.trim(), form.password);
        if (result.success) {
          router.push("/dashboard");
        } else {
          setErrors({ general: result.error ?? "Identifiants incorrects. Veuillez réessayer." });
        }
      } catch {
        setErrors({ general: "Erreur de connexion. Veuillez réessayer." });
      }
    },
    [form, login, router, validate]
  );

  const togglePassword = useCallback(() => setShowPassword((v) => !v), []);
  const generalError = errors.general ?? authError;

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: "#FAF7F0" }}>

      {/* ────── Left panel ────── */}
      <aside
        className="hidden lg:flex lg:w-[50%] xl:w-[52%] flex-col justify-between overflow-hidden relative"
        style={{ background: "#2D5A3D" }}
      >
        {/* Kente top band */}
        <div
          aria-hidden="true"
          className="absolute top-0 left-0 right-0 h-1.5 z-10"
          style={{
            background:
              "linear-gradient(90deg,#9A5E1A 0%,#D4A843 25%,#9A5E1A 50%,#D4A843 75%,#9A5E1A 100%)",
          }}
        />

        {/* Grid texture */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            opacity: 0.06,
            backgroundImage:
              "linear-gradient(rgba(250,247,240,.9) 1px,transparent 1px),linear-gradient(90deg,rgba(250,247,240,.9) 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Diamond pattern SVG */}
        <svg
          aria-hidden="true"
          className="absolute inset-0 w-full h-full"
          style={{ opacity: 0.07 }}
        >
          <defs>
            <pattern id="kdia" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <polygon points="20,2 38,20 20,38 2,20" fill="none" stroke="#FAF7F0" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#kdia)" />
        </svg>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-12 xl:p-14">
          <div>
            {/* Brand */}
            <div className="flex items-center gap-3 mb-14">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "#C07A2F" }}
              >
                <Building2 size={18} className="text-white" aria-hidden="true" />
              </div>
              <div>
                <p className="text-white font-bold text-base tracking-tight leading-none">
                  LanfiaLink
                </p>
                <p className="text-[10.5px] mt-1" style={{ color: "rgba(250,247,240,.4)" }}>
                  Plateforme de distribution CI
                </p>
              </div>
            </div>

            {/* Headline */}
            <h1
              className="font-bold leading-[1.12] tracking-tight mb-5"
              style={{ fontSize: "clamp(26px,3vw,36px)", color: "#FAF7F0" }}
            >
              La distribution<br />
              ivoirienne à l'ère{" "}
              <span style={{ color: "#F0C878" }}>numérique.</span>
            </h1>

            <p
              className="text-[13.5px] leading-relaxed max-w-[290px] mb-10 font-light"
              style={{ color: "rgba(250,247,240,.45)" }}
            >
              Gérez vos commerciaux, points de vente et stocks depuis une seule
              plateforme — conçue pour le terrain ivoirien.
            </p>

            {/* Features */}
            <div className="space-y-5 mb-12">
              {FEATURES.map(({ label, sub }) => (
                <div key={label} className="flex items-start gap-3.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-[7px] shrink-0"
                    style={{ background: "#F0C878" }}
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-[13px] font-medium" style={{ color: "rgba(250,247,240,.82)" }}>
                      {label}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: "rgba(250,247,240,.35)" }}>
                      {sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div
              className="flex border-t pt-6"
              style={{ borderColor: "rgba(250,247,240,.1)" }}
            >
              {STATS.map(({ value, label }, i) => (
                <div
                  key={label}
                  className="flex-1 text-center"
                  style={{
                    borderRight: i < STATS.length - 1 ? "1px solid rgba(250,247,240,.08)" : "none",
                  }}
                >
                  <p
                    className="font-bold tabular-nums"
                    style={{ fontSize: 21, color: "#FAF7F0" }}
                  >
                    {value}
                  </p>
                  <p className="text-[10px] mt-1 tracking-wide" style={{ color: "rgba(250,247,240,.3)" }}>
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[10.5px]" style={{ color: "rgba(250,247,240,.18)" }}>
            © {new Date().getFullYear()} LanfiaLink · Côte d'Ivoire · ISO 27001
          </p>
        </div>

        {/* Kente bottom band */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0 h-1 z-10"
          style={{
            opacity: 0.5,
            background:
              "linear-gradient(90deg,#2D5A3D 0%,#C07A2F 30%,#D4A843 60%,#2D5A3D 100%)",
          }}
        />
      </aside>

      {/* ────── Right panel ────── */}
      <main
        className="flex-1 flex items-center justify-center px-6 py-12 relative"
        style={{ background: "#FAF7F0" }}
      >
        {/* Adinkra corner motif */}
        <svg
          aria-hidden="true"
          className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
          viewBox="0 0 128 128"
          fill="none"
          style={{ opacity: 0.055 }}
        >
          <circle cx="128" cy="0" r="90" stroke="#C07A2F" strokeWidth="1.5" />
          <circle cx="128" cy="0" r="62" stroke="#C07A2F" strokeWidth="1" />
          <circle cx="128" cy="0" r="34" stroke="#C07A2F" strokeWidth="0.8" />
          <line x1="128" y1="0" x2="0" y2="128" stroke="#C07A2F" strokeWidth="0.8" />
          <line x1="128" y1="0" x2="34" y2="128" stroke="#C07A2F" strokeWidth="0.5" />
          <line x1="128" y1="0" x2="0" y2="64" stroke="#C07A2F" strokeWidth="0.5" />
        </svg>

        <div className="w-full max-w-[360px]">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "#2D5A3D" }}
            >
              <Building2 size={16} className="text-white" />
            </div>
            <span className="font-bold text-[15px]" style={{ color: "#2A1A08" }}>
              LanfiaLink
            </span>
          </div>

          {/* Heading */}
          <h2
            className="font-bold tracking-tight mb-1.5"
            style={{ fontSize: 24, color: "#2A1A08" }}
          >
            Connexion
          </h2>
          <p className="text-[13px] leading-relaxed mb-6" style={{ color: "#A89880" }}>
            Entrez vos identifiants pour accéder au tableau de bord.
          </p>

          {/* Ocre accent */}
          <div
            aria-hidden="true"
            className="w-9 h-0.5 rounded-full mb-7"
            style={{ background: "#C07A2F" }}
          />

          {/* General error */}
          {generalError && (
            <div
              role="alert"
              aria-live="polite"
              className="flex items-start gap-3 px-4 py-3 rounded-xl mb-6 border"
              style={{ background: "#FFF3E8", borderColor: "#E8C090" }}
            >
              <AlertTriangle
                size={14}
                className="mt-0.5 shrink-0"
                style={{ color: "#9A5E1A" }}
                aria-hidden="true"
              />
              <div>
                <p className="text-[12.5px] font-semibold" style={{ color: "#9A5E1A" }}>
                  Authentification échouée
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#7A5230" }}>
                  {generalError}
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <Field
              id="username"
              name="username"
              label="Identifiant"
              value={form.username}
              error={errors.username}
              disabled={isLoading}
              placeholder="ex: j.kouassi"
              autoComplete="username"
              onChange={handleChange}
            />

            <Field
              id="password"
              name="password"
              label="Mot de passe"
              type={showPassword ? "text" : "password"}
              value={form.password}
              error={errors.password}
              disabled={isLoading}
              placeholder="••••••••"
              autoComplete="current-password"
              onChange={handleChange}
              suffix={
                <button
                  type="button"
                  onClick={togglePassword}
                  disabled={isLoading}
                  aria-label={showPassword ? "Masquer" : "Afficher"}
                  className="transition-colors disabled:pointer-events-none"
                  style={{ color: "#A89880" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#7A6A52"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#A89880"; }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            {/* Options row */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                <div className="relative">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={form.rememberMe}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="sr-only"
                  />
                  <div
                    className="w-4 h-4 rounded flex items-center justify-center transition-all"
                    style={{
                      border: `1.5px solid ${form.rememberMe ? "#2D5A3D" : "#D4C4A0"}`,
                      background: form.rememberMe ? "#2D5A3D" : "#F2EDE0",
                    }}
                  >
                    {form.rememberMe && (
                      <svg aria-hidden="true" className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="none">
                        <polyline
                          points="1.5,6 4.5,9 10.5,3"
                          stroke="white"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-xs" style={{ color: "#A89880" }}>
                  Rester connecté
                </span>
              </label>

              <button
                type="button"
                disabled={isLoading}
                className="text-xs transition-colors disabled:pointer-events-none underline"
                style={{ color: "#A89880", textDecorationColor: "#D4C4A0" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#4A2E0E"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#A89880"; }}
              >
                Mot de passe oublié ?
              </button>
            </div>

            {/* Submit */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2.5 font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                style={{
                  height: 46,
                  borderRadius: 12,
                  border: "none",
                  background: "#2D5A3D",
                  color: "white",
                  fontSize: 13.5,
                  letterSpacing: "0.01em",
                  cursor: isLoading ? "not-allowed" : "pointer",
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) (e.currentTarget as HTMLElement).style.background = "#3E7A54";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#2D5A3D";
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                    <span>Connexion…</span>
                  </>
                ) : (
                  <>
                    <span>Accéder au tableau de bord</span>
                    <ArrowRight size={15} aria-hidden="true" />
                  </>
                )}
              </button>

              {/* Kente accent under CTA */}
              <div
                aria-hidden="true"
                className="h-1 mt-0.5 rounded-b-xl"
                style={{
                  opacity: 0.55,
                  background:
                    "linear-gradient(90deg,#9A5E1A 0%,#D4A843 40%,#9A5E1A 100%)",
                }}
              />
            </div>
          </form>

          {/* Separator */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: "#E8D9B8" }} />
            <span className="text-[11px]" style={{ color: "#A89880" }}>
              accès entreprise
            </span>
            <div className="flex-1 h-px" style={{ background: "#E8D9B8" }} />
          </div>

          {/* Help box */}
          <div
            className="rounded-xl border px-4 py-4"
            style={{ background: "#F2EDE0", borderColor: "#E8D9B8" }}
          >
            <p
              className="text-[10.5px] font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: "#7A6A52" }}
            >
              Vous n'avez pas encore accès ?
            </p>
            <p className="text-[12px] leading-relaxed mb-3" style={{ color: "#A89880" }}>
              Contactez votre administrateur pour obtenir vos identifiants
              nominatifs. Chaque compte est lié à un rôle défini.
            </p>
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-medium"
              style={{ background: "#EAF2EC", color: "#2D5A3D" }}
            >
              <Lock size={10} aria-hidden="true" />
              Chiffrement AES-256 · Accès sécurisé
            </div>
          </div>

          {/* Mobile footer */}
          <p className="lg:hidden mt-8 text-center text-[10.5px]" style={{ color: "#C8B898" }}>
            © {new Date().getFullYear()} LanfiaLink · Côte d'Ivoire
          </p>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;