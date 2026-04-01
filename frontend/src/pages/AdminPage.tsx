import { useState, useEffect, useCallback } from "react";
import { useMobile } from "../hooks/useMobile";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AnalyticsData {
  total_generations: number;
  total_logos: number;
  today_generations: number;
  week_generations: number;
  daily: Record<string, number>;
  browsers: Record<string, number>;
  os: Record<string, number>;
  origins: Record<string, number>;
  recent: Array<{ ts: string; ip: string; browser: string; os: string; referer: string; brand: string; logos: number }>;
}

interface FeedbackData {
  total: number;
  average_rating: number;
  feedbacks: Array<{ ts: string; rating: number; message: string; ip: string }>;
}

interface Config {
  maintenance_mode: boolean;
  maintenance_message: string;
}

type AdminView = "overview" | "analytics" | "feedback" | "settings";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ color: "#f59e0b", letterSpacing: 1 }}>
      {"★".repeat(rating)}{"☆".repeat(5 - rating)}
    </span>
  );
}

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid var(--border)", borderRadius: 12,
      padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.375rem",
    }}>
      <p style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--text-3)", letterSpacing: "0.04em", textTransform: "uppercase", margin: 0 }}>{label}</p>
      <p style={{ fontSize: "2rem", fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.04em", margin: 0, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: "0.75rem", color: "var(--text-3)", margin: 0 }}>{sub}</p>}
    </div>
  );
}

function BarChart({ data, label }: { data: Record<string, number>; label: string }) {
  const entries = Object.entries(data);
  if (!entries.length) return <p style={{ fontSize: "0.875rem", color: "var(--text-3)" }}>Aucune donnée</p>;
  const max = Math.max(...entries.map(([, v]) => v), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <p className="lbl">{label}</p>
      {entries.map(([k, v]) => (
        <div key={k} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-2)", width: 80, flexShrink: 0, textAlign: "right" }}>{k}</span>
          <div style={{ flex: 1, background: "var(--subtle)", borderRadius: 4, height: 8, overflow: "hidden" }}>
            <div style={{ width: `${(v / max) * 100}%`, height: "100%", background: "var(--black)", borderRadius: 4, transition: "width 0.4s ease" }} />
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-3)", width: 24, textAlign: "right", flexShrink: 0 }}>{v}</span>
        </div>
      ))}
    </div>
  );
}

function DailyChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).slice(-14);
  if (!entries.length) return (
    <div>
      <p className="lbl">Logos générés — 14 derniers jours</p>
      <p style={{ fontSize: "0.875rem", color: "var(--text-3)", padding: "1rem 0" }}>Aucune donnée pour l'instant</p>
    </div>
  );
  const max = Math.max(...entries.map(([, v]) => v), 1);
  const BAR_H = 100; // fixed chart area height in px

  return (
    <div>
      <p className="lbl">Logos générés — 14 derniers jours</p>
      {/* Bar area — fixed height, bars grow from bottom */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: "0.3rem", height: BAR_H, overflow: "visible" }}>
        {entries.map(([day, count]) => {
          const barH = count > 0 ? Math.max(Math.round((count / max) * (BAR_H - 4)), 4) : 0;
          return (
            <div
              key={day}
              title={`${day}: ${count} logo${count !== 1 ? "s" : ""}`}
              style={{
                flex: "1 1 0",
                minWidth: 8,
                maxWidth: 40,
                height: barH,
                background: barH > 0 ? "var(--black)" : "var(--border)",
                borderRadius: barH > 0 ? "3px 3px 0 0" : 3,
                transition: "height 0.4s ease",
                cursor: "default",
              }}
            />
          );
        })}
      </div>
      {/* Label row — completely separate from bar area */}
      <div style={{ display: "flex", gap: "0.3rem", marginTop: "0.375rem", borderTop: "1px solid var(--border)", paddingTop: "0.375rem" }}>
        {entries.map(([day]) => (
          <div key={day} style={{ flex: "1 1 0", minWidth: 8, maxWidth: 40, textAlign: "center" }}>
            <span style={{ fontSize: "0.6rem", color: "var(--text-3)", display: "block" }}>
              {day.slice(8)}/{day.slice(5, 7)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Views ────────────────────────────────────────────────────────────────────

function OverviewView({ analytics, feedbackSummary, config, onRefresh }: {
  analytics: AnalyticsData;
  feedbackSummary: { total: number; average_rating: number };
  config: Config;
  onRefresh: () => void;
}) {
  const mobile = useMobile();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {config.maintenance_mode && (
        <div style={{
          background: "#fef9c3", border: "1px solid #fde047", borderRadius: 10,
          padding: "0.875rem 1.25rem", display: "flex", alignItems: "center", gap: "0.75rem",
        }}>
          <span style={{ fontSize: "1.25rem" }}>⚠</span>
          <div>
            <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "#854d0e", margin: 0 }}>Mode maintenance actif</p>
            <p style={{ fontSize: "0.8125rem", color: "#a16207", margin: 0 }}>{config.maintenance_message}</p>
          </div>
        </div>
      )}

      <div className="kpi-grid-4" style={{ display: "grid", gridTemplateColumns: mobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: "0.75rem" }}>
        <KpiCard label="Générations" value={analytics.total_generations} />
        <KpiCard label="Logos générés" value={analytics.total_logos} />
        <KpiCard label="Aujourd'hui" value={analytics.today_generations} />
        <KpiCard label="Cette semaine" value={analytics.week_generations} />
      </div>

      <div className="kpi-grid-2" style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(2, 1fr)", gap: "0.75rem" }}>
        <KpiCard
          label="Satisfaction"
          value={feedbackSummary.average_rating > 0 ? `${feedbackSummary.average_rating}/5` : "—"}
          sub={`${feedbackSummary.total} avis`}
        />
        <KpiCard
          label="Statut"
          value={config.maintenance_mode ? "Maintenance" : "En ligne"}
          sub={config.maintenance_mode ? "App inaccessible" : "App accessible"}
        />
      </div>

      <div className="surface" style={{ padding: mobile ? "1rem" : "1.5rem" }}>
        <DailyChart data={analytics.daily} />
      </div>

      <div className="surface" style={{ padding: mobile ? "1rem" : "1.5rem" }}>
        <p className="lbl">Activité récente</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 0, marginTop: "0.5rem" }}>
          {analytics.recent.slice(0, 10).map((e, i) => (
            mobile ? (
              /* Mobile: stacked card layout */
              <div key={i} style={{
                padding: "0.75rem 0",
                borderBottom: i < 9 ? "1px solid var(--border)" : "none",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.25rem" }}>
                  <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-1)", margin: 0 }}>{e.brand || "—"}</p>
                  <span style={{ fontSize: "0.6875rem", color: "var(--text-3)", flexShrink: 0, marginLeft: "0.5rem" }}>{formatDate(e.ts)}</span>
                </div>
                <p style={{ fontSize: "0.75rem", color: "var(--text-3)", margin: 0 }}>
                  {e.browser} · {e.os} · {e.logos} logos · {e.ip}
                </p>
              </div>
            ) : (
              /* Desktop: grid row */
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "1fr 80px 90px 80px 60px",
                gap: "0.75rem", padding: "0.625rem 0",
                borderBottom: i < 9 ? "1px solid var(--border)" : "none",
                alignItems: "center",
              }}>
                <div>
                  <p style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-1)", margin: 0 }}>{e.brand || "—"}</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-3)", margin: 0 }}>{e.ip}</p>
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-2)" }}>{e.browser}</span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-2)" }}>{e.os}</span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>{e.logos} logos</span>
                <span style={{ fontSize: "0.6875rem", color: "var(--text-3)" }}>{formatDate(e.ts)}</span>
              </div>
            )
          ))}
          {analytics.recent.length === 0 && (
            <p style={{ fontSize: "0.875rem", color: "var(--text-3)", padding: "1rem 0" }}>Aucune activité enregistrée</p>
          )}
        </div>
      </div>
    </div>
  );
}

function AnalyticsView({ analytics }: { analytics: AnalyticsData }) {
  const mobile = useMobile();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="kpi-grid-3" style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3, 1fr)", gap: "1rem" }}>
        <div className="surface" style={{ padding: "1.5rem" }}>
          <BarChart data={analytics.browsers} label="Navigateurs" />
        </div>
        <div className="surface" style={{ padding: "1.5rem" }}>
          <BarChart data={analytics.os} label="Systèmes d'exploitation" />
        </div>
        <div className="surface" style={{ padding: "1.5rem" }}>
          <BarChart data={analytics.origins} label="Origines (Referer)" />
        </div>
      </div>

      <div className="surface" style={{ padding: "1.5rem" }}>
        <DailyChart data={analytics.daily} />
      </div>

      <div className="surface" style={{ padding: "1.5rem" }}>
        <p className="lbl">Toutes les générations ({analytics.recent.length})</p>
        <div style={{ overflowX: "auto", marginTop: "0.75rem", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
          <table style={{ width: "100%", minWidth: 560, borderCollapse: "collapse", fontSize: "0.8125rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)" }}>
                {["Date", "Marque", "IP", "Navigateur", "OS", "Référent", "Logos"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "0.5rem 0.75rem", color: "var(--text-3)", fontWeight: 500, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {analytics.recent.map((e, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "0.5rem 0.75rem", color: "var(--text-3)", whiteSpace: "nowrap" }}>{formatDate(e.ts)}</td>
                  <td style={{ padding: "0.5rem 0.75rem", fontWeight: 500, color: "var(--text-1)" }}>{e.brand || "—"}</td>
                  <td style={{ padding: "0.5rem 0.75rem", color: "var(--text-2)", fontFamily: "monospace" }}>{e.ip}</td>
                  <td style={{ padding: "0.5rem 0.75rem", color: "var(--text-2)" }}>{e.browser}</td>
                  <td style={{ padding: "0.5rem 0.75rem", color: "var(--text-2)" }}>{e.os}</td>
                  <td style={{ padding: "0.5rem 0.75rem", color: "var(--text-3)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.referer}</td>
                  <td style={{ padding: "0.5rem 0.75rem", color: "var(--text-2)", textAlign: "center" }}>{e.logos}</td>
                </tr>
              ))}
              {analytics.recent.length === 0 && (
                <tr><td colSpan={7} style={{ padding: "2rem 0.75rem", color: "var(--text-3)", textAlign: "center" }}>Aucune donnée</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FeedbackView({ data }: { data: FeedbackData }) {
  const mobile = useMobile();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="kpi-grid-3" style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3, 1fr)", gap: "0.75rem" }}>
        <KpiCard label="Avis total" value={data.total} />
        <KpiCard label="Note moyenne" value={data.average_rating > 0 ? `${data.average_rating} / 5` : "—"} />
        <KpiCard label="Satisfaction" value={data.average_rating >= 4 ? "Excellente" : data.average_rating >= 3 ? "Bonne" : data.total === 0 ? "—" : "À améliorer"} />
      </div>

      <div className="surface" style={{ padding: "1.5rem" }}>
        <p className="lbl">Tous les avis</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "0.75rem" }}>
          {data.feedbacks.map((f, i) => (
            <div key={i} style={{
              padding: "1rem 1.25rem",
              background: "var(--subtle)", borderRadius: 10,
              border: "1px solid var(--border)",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <Stars rating={f.rating} />
                <span style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>{formatDate(f.ts)} · {f.ip}</span>
              </div>
              {f.message ? (
                <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-2)", lineHeight: 1.6 }}>{f.message}</p>
              ) : (
                <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-3)", fontStyle: "italic" }}>Aucun commentaire</p>
              )}
            </div>
          ))}
          {data.feedbacks.length === 0 && (
            <p style={{ fontSize: "0.875rem", color: "var(--text-3)" }}>Aucun feedback reçu pour l'instant</p>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingsView({ config, token, onUpdate }: {
  config: Config;
  token: string;
  onUpdate: (cfg: Config) => void;
}) {
  const [enabled, setEnabled] = useState(config.maintenance_mode);
  const [message, setMessage] = useState(config.maintenance_message);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ enabled, message }),
      });
      const data = await res.json();
      onUpdate(data.config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: 600 }}>
      <div className="surface" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div>
          <p style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-1)", letterSpacing: "-0.02em", margin: "0 0 0.25rem" }}>Mode maintenance</p>
          <p style={{ fontSize: "0.875rem", color: "var(--text-3)", margin: 0 }}>
            Quand activé, toute tentative de génération affiche un message de maintenance.
          </p>
        </div>

        {/* Toggle */}
        <label style={{ display: "flex", alignItems: "center", gap: "1rem", cursor: "pointer" }}>
          <div
            onClick={() => setEnabled((v) => !v)}
            style={{
              width: 44, height: 24, borderRadius: 999,
              background: enabled ? "var(--black)" : "var(--border)",
              position: "relative", cursor: "pointer", transition: "background 0.2s",
              flexShrink: 0,
            }}
          >
            <div style={{
              position: "absolute", top: 3, left: enabled ? 23 : 3,
              width: 18, height: 18, borderRadius: "50%",
              background: "#fff",
              transition: "left 0.2s",
              boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
            }} />
          </div>
          <span style={{ fontSize: "0.9375rem", fontWeight: 500, color: enabled ? "var(--text-1)" : "var(--text-3)" }}>
            {enabled ? "Maintenance activée" : "Maintenance désactivée"}
          </span>
        </label>

        {/* Message */}
        <div>
          <label className="lbl">Message affiché aux utilisateurs</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="field"
            style={{ resize: "vertical" }}
          />
        </div>

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="btn btn-black"
          style={{ alignSelf: "flex-start" }}
        >
          {saving ? "Enregistrement…" : saved ? "✓ Enregistré" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (!res.ok) { setError("PIN invalide. Réessayez."); return; }
      const data = await res.json();
      onLogin(data.token);
    } catch {
      setError("Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg)", padding: "1rem",
    }}>
      <div className="surface" style={{ width: "100%", maxWidth: 360, padding: "2rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div>
          <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            Mboa Studio
          </p>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.035em", color: "var(--text-1)", margin: "0 0 0.375rem" }}>
            Espace Admin
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--text-3)", margin: 0 }}>
            Entrez votre code PIN à 8 chiffres.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <input
            type="password"
            inputMode="numeric"
            maxLength={8}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="••••••••"
            className="field"
            style={{ fontSize: "1.5rem", letterSpacing: "0.25em", textAlign: "center" }}
            autoFocus
          />
          {error && (
            <p style={{ fontSize: "0.8125rem", color: "#dc2626", margin: 0 }}>{error}</p>
          )}
          <button
            type="submit"
            disabled={pin.length !== 8 || loading}
            className="btn btn-black"
            style={{ width: "100%", padding: "0.75rem" }}
          >
            {loading ? "Vérification…" : "Accéder"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const NAV: { id: AdminView; label: string; icon: string }[] = [
  { id: "overview",   label: "Vue d'ensemble", icon: "⊞" },
  { id: "analytics",  label: "Générations",    icon: "↗" },
  { id: "feedback",   label: "Feedback",       icon: "★" },
  { id: "settings",   label: "Paramètres",     icon: "⚙" },
];

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function AdminPage() {
  const mobile = useMobile();
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem("admin_token"));
  const [view, setView] = useState<AdminView>("overview");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchStats = useCallback(async (tok: string) => {
    setLoading(true);
    try {
      const [statsRes, feedRes] = await Promise.all([
        fetch("/api/admin/stats", { headers: { "Authorization": `Bearer ${tok}` } }),
        fetch("/api/admin/feedback", { headers: { "Authorization": `Bearer ${tok}` } }),
      ]);
      if (statsRes.status === 401) { sessionStorage.removeItem("admin_token"); setToken(null); return; }
      const stats = await statsRes.json();
      const feed = await feedRes.json();
      setAnalytics(stats.analytics);
      setFeedbackData(feed);
      setConfig(stats.config);
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) fetchStats(token);
  }, [token, fetchStats]);

  function handleLogin(tok: string) {
    sessionStorage.setItem("admin_token", tok);
    setToken(tok);
  }

  function handleLogout() {
    sessionStorage.removeItem("admin_token");
    setToken(null);
  }

  if (!token) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>

      {/* ── Mobile top bar ── */}
      {mobile && (
        <header style={{
          position: "sticky", top: 0, zIndex: 20,
          background: "#fff", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 1rem", height: 52,
        }}>
          <span style={{ fontSize: "0.9375rem", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--text-1)" }}>
            Mboa Studio <span style={{ fontWeight: 400, color: "var(--text-3)", fontSize: "0.75rem" }}>Admin</span>
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button type="button" onClick={() => token && fetchStats(token)} disabled={loading}
              style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "0.3rem 0.625rem", fontSize: "0.8125rem", color: "var(--text-2)", cursor: "pointer" }}>
              {loading ? "…" : "↻"}
            </button>
            <button type="button" onClick={handleLogout}
              style={{ background: "none", border: "none", fontSize: "0.75rem", color: "var(--text-3)", cursor: "pointer" }}>
              Quitter
            </button>
          </div>
        </header>
      )}

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* ── Desktop Sidebar ── */}
        {!mobile && (
          <aside className="admin-sidebar" style={{
            width: 220, flexShrink: 0,
            background: "#fff", borderRight: "1px solid var(--border)",
            display: "flex", flexDirection: "column",
            position: "sticky", top: 0, height: "100vh",
          }}>
            <div style={{ padding: "1.5rem 1.25rem 1rem", borderBottom: "1px solid var(--border)" }}>
              <p style={{ fontSize: "0.9375rem", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--text-1)", margin: "0 0 0.125rem" }}>Mboa Studio</p>
              <p style={{ fontSize: "0.6875rem", color: "var(--text-3)", margin: 0, letterSpacing: "0.04em", textTransform: "uppercase" }}>Admin</p>
            </div>
            <nav style={{ flex: 1, padding: "0.75rem" }}>
              {NAV.map((item) => (
                <button key={item.id} type="button" onClick={() => setView(item.id)} style={{
                  width: "100%", display: "flex", alignItems: "center", gap: "0.625rem",
                  padding: "0.625rem 0.75rem", borderRadius: 8,
                  border: "none", cursor: "pointer", textAlign: "left",
                  background: view === item.id ? "var(--subtle)" : "none",
                  color: view === item.id ? "var(--text-1)" : "var(--text-3)",
                  fontWeight: view === item.id ? 600 : 400,
                  fontSize: "0.875rem", letterSpacing: "-0.01em",
                  transition: "background 0.12s, color 0.12s", marginBottom: "0.125rem",
                }}>
                  <span style={{ fontSize: "1rem", width: 20, textAlign: "center" }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>
            <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {lastRefresh && (
                <p style={{ fontSize: "0.6875rem", color: "var(--text-3)", margin: 0 }}>
                  Actualisé {lastRefresh.toLocaleTimeString("fr-FR", { timeStyle: "short" })}
                </p>
              )}
              <button type="button" onClick={() => token && fetchStats(token)} disabled={loading}
                className="btn btn-outline" style={{ fontSize: "0.8125rem", padding: "0.375rem 0.75rem" }}>
                {loading ? "…" : "↻ Actualiser"}
              </button>
              <button type="button" onClick={handleLogout}
                style={{ fontSize: "0.75rem", color: "var(--text-3)", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: "0.125rem 0" }}>
                Déconnexion
              </button>
            </div>
          </aside>
        )}

        {/* ── Main content ── */}
        <main className="admin-main" style={{
          flex: 1, overflowY: "auto",
          padding: mobile ? "1.25rem 1rem 5rem" : "2rem 2.5rem",
        }}>
          <div style={{ marginBottom: mobile ? "1.25rem" : "2rem" }}>
            <h1 style={{ fontSize: mobile ? "1.25rem" : "1.5rem", fontWeight: 700, letterSpacing: "-0.035em", color: "var(--text-1)", margin: "0 0 0.25rem" }}>
              {NAV.find((n) => n.id === view)?.label}
            </h1>
            <p style={{ fontSize: "0.875rem", color: "var(--text-3)", margin: 0 }}>
              {view === "overview"  && "Tableau de bord global de l'application"}
              {view === "analytics" && "Comportement des utilisateurs et origines des requêtes"}
              {view === "feedback"  && "Avis et retours des utilisateurs"}
              {view === "settings"  && "Configuration et maintenance de l'application"}
            </p>
          </div>

          {loading && !analytics && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--text-3)" }}>
              <span style={{ display: "flex", gap: 4 }}>
                {[0,1,2].map((i) => <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--text-3)", display: "inline-block", animation: `dot 1s ease-in-out ${i*0.15}s infinite` }} />)}
              </span>
              Chargement…
            </div>
          )}

          {analytics && feedbackData && config && (
            <>
              {view === "overview"  && <OverviewView analytics={analytics} feedbackSummary={{ total: feedbackData.total, average_rating: feedbackData.average_rating }} config={config} onRefresh={() => fetchStats(token!)} />}
              {view === "analytics" && <AnalyticsView analytics={analytics} />}
              {view === "feedback"  && <FeedbackView data={feedbackData} />}
              {view === "settings"  && <SettingsView config={config} token={token!} onUpdate={setConfig} />}
            </>
          )}
        </main>
      </div>

      {/* ── Mobile bottom tab bar ── */}
      {mobile && (
        <nav className="admin-bottomnav" style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30,
          background: "#fff", borderTop: "1px solid var(--border)",
          display: "flex",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}>
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id)}
              style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: "0.2rem",
                padding: "0.625rem 0",
                background: "none", border: "none", cursor: "pointer",
                color: view === item.id ? "var(--text-1)" : "var(--text-3)",
                transition: "color 0.12s",
              }}
            >
              <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>{item.icon}</span>
              <span style={{
                fontSize: "0.6rem", fontWeight: view === item.id ? 600 : 400,
                letterSpacing: "0.02em",
              }}>
                {item.label.split(" ")[0]}
              </span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
