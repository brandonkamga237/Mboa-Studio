import { useEffect, useState, useCallback } from "react";
import { extractColors, applyEdits } from "../utils/svgParser";
import type { EditorState, FontFamily, LogoConcept } from "../types/logo";
import { exportSVG, exportPNG } from "../utils/svgExport";
import ChatInput from "./ChatInput";
import LogoGrid from "./LogoGrid";
import ThinkingPanel from "./ThinkingPanel";
import { useRefineStream } from "../hooks/useRefineStream";
import toast from "react-hot-toast";

const FONTS: { value: FontFamily; label: string; style?: React.CSSProperties }[] = [
  { value: "Inter",             label: "Inter",             style: { fontFamily: "Inter" } },
  { value: "Space Grotesk",     label: "Space Grotesk",     style: { fontFamily: "Space Grotesk" } },
  { value: "DM Sans",           label: "DM Sans",           style: { fontFamily: "DM Sans" } },
  { value: "Playfair Display",  label: "Playfair Display",  style: { fontFamily: "Playfair Display" } },
  { value: "JetBrains Mono",    label: "JetBrains Mono",    style: { fontFamily: "JetBrains Mono" } },
  { value: "Libre Baskerville", label: "Libre Baskerville", style: { fontFamily: "Libre Baskerville" } },
];

interface Palette { name: string; primary: string; secondary: string; accent?: string }

const PALETTES: Palette[] = [
  { name: "Minuit",      primary: "#0f0f0f", secondary: "#525252" },
  { name: "Océan",       primary: "#0e4f8c", secondary: "#4ea8de" },
  { name: "Forêt",       primary: "#1a4731", secondary: "#52b788" },
  { name: "Feu",         primary: "#c1121f", secondary: "#e76f51" },
  { name: "Lavande",     primary: "#4361ee", secondary: "#7b2d8b" },
  { name: "Soleil",      primary: "#d4a017", secondary: "#f4a261" },
  { name: "Ardoise",     primary: "#334155", secondary: "#94a3b8" },
  { name: "Rose",        primary: "#be185d", secondary: "#f472b6" },
  { name: "Platine",     primary: "#1c1c1c", secondary: "#8a8a8a" },
  { name: "Émeraude",    primary: "#065f46", secondary: "#34d399" },
  { name: "Encre",       primary: "#1e1b4b", secondary: "#6366f1" },
  { name: "Corail",      primary: "#9d174d", secondary: "#fb7185" },
];

const BG_OPTIONS: { label: string; value: string; dark?: boolean }[] = [
  { label: "Blanc",        value: "#ffffff" },
  { label: "Gris clair",   value: "#f5f5f5" },
  { label: "Crème",        value: "#faf7f0" },
  { label: "Sombre",       value: "#111111", dark: true },
  { label: "Navy",         value: "#0f172a", dark: true },
  { label: "Transparent",  value: "transparent" },
];

const LAYOUTS: { value: EditorState["layout"]; label: string; icon: string }[] = [
  { value: "icon-above", label: "Icône au-dessus", icon: "↑" },
  { value: "icon-left",  label: "Icône à gauche",  icon: "←" },
  { value: "text-only",  label: "Texte seul",       icon: "T" },
];

interface Props { concept: LogoConcept; brandName: string; }

function HexInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);

  function handleBlur() {
    const v = local.startsWith("#") ? local : `#${local}`;
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) onChange(v);
    else setLocal(value);
  }

  return (
    <input
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={(e) => { if (e.key === "Enter") handleBlur(); }}
      style={{
        width: "100%",
        background: "var(--subtle)",
        border: "1px solid var(--border)",
        borderRadius: 5,
        padding: "0.25rem 0.5rem",
        fontSize: "0.75rem",
        fontFamily: "JetBrains Mono, monospace",
        color: "var(--text-1)",
        outline: "none",
        textTransform: "uppercase",
      }}
      onFocus={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
    />
  );
}

export default function SvgEditor({ concept, brandName }: Props) {
  const { stages: refineStages, logos: refined, isRefining, refine } = useRefineStream();
  const [refinedSel, setRefinedSel] = useState<number | null>(null);
  const [previewBg, setPreviewBg] = useState("#ffffff");
  const [pngLoading, setPngLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"couleurs" | "typographie" | "disposition">("couleurs");

  const base = refinedSel !== null && refined[refinedSel] ? refined[refinedSel]!.svg : concept.svg;

  const [ed, setEd] = useState<EditorState>(() => {
    const { primary, secondary } = extractColors(concept.svg);
    return { primaryColor: primary, secondaryColor: secondary, fontFamily: "Inter", fontSize: 48, layout: "icon-above" };
  });

  useEffect(() => {
    const { primary, secondary } = extractColors(base);
    setEd((p) => ({ ...p, primaryColor: primary, secondaryColor: secondary }));
  }, [base]);

  const preview = applyEdits(base, ed.primaryColor, ed.secondaryColor, ed.fontFamily, ed.fontSize, ed.layout);

  const set = useCallback(<K extends keyof EditorState>(k: K, v: EditorState[K]) => {
    setEd((p) => ({ ...p, [k]: v }));
  }, []);

  function applyPalette(p: Palette) {
    setEd((prev) => ({ ...prev, primaryColor: p.primary, secondaryColor: p.secondary }));
  }

  async function handleExportPNG() {
    setPngLoading(true);
    try { await exportPNG(preview, brandName); toast.success("PNG 1024px téléchargé"); }
    catch { toast.error("Export PNG échoué"); }
    finally { setPngLoading(false); }
  }

  const TABS = ["couleurs", "typographie", "disposition"] as const;

  return (
    <section className="in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* ── Editor ── */}
      <div className="surface overflow-hidden">

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0.875rem 1.25rem",
          borderBottom: "1px solid var(--border)",
        }}>
          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-1)", letterSpacing: "-0.02em", margin: 0 }}>
            Personnaliser
          </p>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={() => { exportSVG(preview, brandName); toast.success("SVG téléchargé"); }}
              style={{
                display: "flex", alignItems: "center", gap: "0.375rem",
                background: "var(--subtle)", border: "1px solid var(--border)",
                borderRadius: 6, padding: "0.3rem 0.75rem",
                fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-2)", cursor: "pointer",
              }}
            >
              <DownloadIcon /> SVG
            </button>
            <button
              type="button"
              onClick={handleExportPNG}
              disabled={pngLoading}
              style={{
                display: "flex", alignItems: "center", gap: "0.375rem",
                background: "var(--black)", border: "1px solid var(--black)",
                borderRadius: 6, padding: "0.3rem 0.75rem",
                fontSize: "0.8125rem", fontWeight: 500, color: "#fff", cursor: "pointer",
                opacity: pngLoading ? 0.6 : 1,
              }}
            >
              {pngLoading ? <SpinIcon /> : <DownloadIcon />} PNG
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px" }}>

          {/* Left: Controls */}
          <div style={{ borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>

            {/* Tabs */}
            <div style={{
              display: "flex", borderBottom: "1px solid var(--border)",
              padding: "0 1.25rem",
            }}>
              {TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    padding: "0.75rem 0",
                    marginRight: "1.25rem",
                    fontSize: "0.8125rem",
                    fontWeight: activeTab === tab ? 600 : 400,
                    color: activeTab === tab ? "var(--text-1)" : "var(--text-3)",
                    borderBottom: activeTab === tab ? "2px solid var(--black)" : "2px solid transparent",
                    letterSpacing: "-0.01em",
                    transition: "color 0.12s",
                  }}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ padding: "1.125rem 1.25rem", display: "flex", flexDirection: "column", gap: "1.25rem", flex: 1 }}>

              {/* ── COULEURS ── */}
              {activeTab === "couleurs" && (
                <>
                  {/* Palettes */}
                  <div>
                    <p className="lbl">Palettes suggérées</p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
                      {PALETTES.map((p) => {
                        const isActive = ed.primaryColor === p.primary && ed.secondaryColor === p.secondary;
                        return (
                          <button
                            key={p.name}
                            type="button"
                            onClick={() => applyPalette(p)}
                            title={p.name}
                            style={{
                              display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem",
                              background: "none", border: "none", cursor: "pointer", padding: "0.375rem",
                              borderRadius: 7,
                              outline: isActive ? "2px solid var(--black)" : "2px solid transparent",
                              outlineOffset: 1,
                              transition: "outline 0.1s",
                            }}
                          >
                            <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", width: "100%", height: 22 }}>
                              <div style={{ flex: 1, background: p.primary }} />
                              <div style={{ flex: 1, background: p.secondary }} />
                            </div>
                            <span style={{ fontSize: "0.6rem", color: "var(--text-3)", letterSpacing: "0", textAlign: "center", lineHeight: 1 }}>
                              {p.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom colors */}
                  <div>
                    <p className="lbl">Couleurs personnalisées</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
                      {([["primaryColor", "Principale"], ["secondaryColor", "Secondaire"]] as [keyof EditorState, string][]).map(([k, lbl]) => (
                        <div key={k} style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                          <label style={{
                            display: "flex", alignItems: "center", gap: "0.5rem",
                            padding: "0.5rem", border: "1px solid var(--border)", borderRadius: 7, cursor: "pointer",
                          }}>
                            <input
                              type="color"
                              value={ed[k] as string}
                              onChange={(e) => set(k, e.target.value)}
                              style={{ width: 28, height: 28, borderRadius: 5, flexShrink: 0 }}
                            />
                            <div>
                              <p style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--text-1)", margin: 0 }}>{lbl}</p>
                            </div>
                          </label>
                          <HexInput value={ed[k] as string} onChange={(v) => set(k, v)} />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ── TYPOGRAPHIE ── */}
              {activeTab === "typographie" && (
                <>
                  <div>
                    <p className="lbl">Police de caractères</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                      {FONTS.map((f) => (
                        <button
                          key={f.value}
                          type="button"
                          onClick={() => set("fontFamily", f.value)}
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "0.625rem 0.75rem",
                            border: `1px solid ${ed.fontFamily === f.value ? "var(--black)" : "var(--border)"}`,
                            borderRadius: 7,
                            background: ed.fontFamily === f.value ? "var(--black)" : "var(--surface)",
                            cursor: "pointer",
                            transition: "all 0.12s",
                          }}
                        >
                          <span style={{
                            ...f.style,
                            fontSize: "0.9375rem",
                            color: ed.fontFamily === f.value ? "#fff" : "var(--text-1)",
                            letterSpacing: "-0.01em",
                          }}>
                            {f.label}
                          </span>
                          {ed.fontFamily === f.value && (
                            <svg width="12" height="12" viewBox="0 0 10 10" fill="none">
                              <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <p className="lbl" style={{ margin: 0 }}>Taille du texte</p>
                      <span style={{ fontSize: "0.75rem", fontFamily: "JetBrains Mono, monospace", color: "var(--text-2)" }}>
                        {ed.fontSize}px
                      </span>
                    </div>
                    <input
                      type="range" min={20} max={88} step={2}
                      value={ed.fontSize}
                      onChange={(e) => set("fontSize", Number(e.target.value))}
                      style={{ width: "100%" }}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.25rem" }}>
                      <span style={{ fontSize: "0.6875rem", color: "var(--text-3)" }}>20</span>
                      <span style={{ fontSize: "0.6875rem", color: "var(--text-3)" }}>88</span>
                    </div>
                  </div>
                </>
              )}

              {/* ── DISPOSITION ── */}
              {activeTab === "disposition" && (
                <>
                  <div>
                    <p className="lbl">Disposition des éléments</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {LAYOUTS.map((l) => (
                        <button
                          key={l.value}
                          type="button"
                          onClick={() => set("layout", l.value)}
                          style={{
                            display: "flex", alignItems: "center", gap: "0.75rem",
                            padding: "0.75rem",
                            border: `1px solid ${ed.layout === l.value ? "var(--black)" : "var(--border)"}`,
                            borderRadius: 8,
                            background: ed.layout === l.value ? "var(--black)" : "var(--surface)",
                            cursor: "pointer",
                            transition: "all 0.12s",
                            textAlign: "left",
                          }}
                        >
                          <span style={{
                            width: 32, height: 32, borderRadius: 6,
                            background: ed.layout === l.value ? "rgba(255,255,255,0.12)" : "var(--subtle)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "1rem",
                            color: ed.layout === l.value ? "#fff" : "var(--text-2)",
                            flexShrink: 0,
                          }}>
                            {l.icon}
                          </span>
                          <span style={{
                            fontSize: "0.875rem", fontWeight: 500,
                            color: ed.layout === l.value ? "#fff" : "var(--text-1)",
                            letterSpacing: "-0.01em",
                          }}>
                            {l.label}
                          </span>
                          {ed.layout === l.value && (
                            <svg width="12" height="12" viewBox="0 0 10 10" fill="none" style={{ marginLeft: "auto" }}>
                              <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="lbl">Fond du logo</p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
                      {BG_OPTIONS.map((bg) => (
                        <button
                          key={bg.value}
                          type="button"
                          onClick={() => setPreviewBg(bg.value)}
                          style={{
                            display: "flex", flexDirection: "column", alignItems: "center", gap: "0.35rem",
                            padding: "0.5rem 0.375rem",
                            border: `1px solid ${previewBg === bg.value ? "var(--black)" : "var(--border)"}`,
                            borderRadius: 7, cursor: "pointer",
                            background: previewBg === bg.value ? "var(--subtle)" : "none",
                            transition: "all 0.12s",
                          }}
                        >
                          <div style={{
                            width: 28, height: 20, borderRadius: 4,
                            background: bg.value === "transparent"
                              ? "repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 8px 8px"
                              : bg.value,
                            border: "1px solid var(--border)",
                            flexShrink: 0,
                          }} />
                          <span style={{ fontSize: "0.6rem", color: "var(--text-3)", whiteSpace: "nowrap" }}>
                            {bg.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right: Preview */}
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: "1rem", padding: "1.5rem",
            background: "var(--subtle)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
              <p className="lbl" style={{ margin: 0 }}>Aperçu en direct</p>
              {/* Quick background toggle */}
              <div style={{ display: "flex", gap: "0.25rem" }}>
                {[
                  { bg: "#ffffff", title: "Fond blanc" },
                  { bg: "#111111", title: "Fond sombre" },
                  { bg: "repeating-conic-gradient(#d1d5db 0% 25%, #fff 0% 50%) 0 0 / 8px 8px", title: "Transparent", isGrad: true },
                ].map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    title={opt.title}
                    onClick={() => setPreviewBg(i === 2 ? "transparent" : opt.bg)}
                    style={{
                      width: 20, height: 20, borderRadius: 4,
                      background: opt.isGrad ? opt.bg : opt.bg,
                      border: `2px solid ${
                        previewBg === (i === 2 ? "transparent" : opt.bg)
                          ? "var(--black)"
                          : "var(--border)"
                      }`,
                      cursor: "pointer", padding: 0,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Large main preview */}
            <div
              style={{
                width: "100%",
                aspectRatio: "1",
                borderRadius: 12,
                border: "1px solid var(--border)",
                overflow: "hidden",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: previewBg === "transparent"
                  ? "repeating-conic-gradient(#e5e5e5 0% 25%, #fff 0% 50%) 0 0 / 10px 10px"
                  : previewBg,
                userSelect: "none",
              }}
              dangerouslySetInnerHTML={{ __html: preview }}
            />

            {/* Contextual mock — show logo on a realistic background */}
            <div style={{
              width: "100%",
              borderRadius: 10,
              overflow: "hidden",
              padding: "1rem",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: previewBg === "#111111" ? "#ffffff" : "#111111",
              border: "1px solid var(--border)",
              userSelect: "none",
            }}
              dangerouslySetInnerHTML={{ __html: preview }}
            />

            <p style={{ fontSize: "0.6875rem", color: "var(--text-3)", margin: 0, textAlign: "center" }}>
              Fond sélectionné · Fond inversé
            </p>
          </div>
        </div>
      </div>

      {/* ── Refinement ── */}
      <div className="surface" style={{ padding: "1.125rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
        <div>
          <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-1)", margin: "0 0 0.25rem", letterSpacing: "-0.02em" }}>
            Affiner avec l'IA
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-3)", margin: 0, lineHeight: 1.5 }}>
            Décrivez ce que vous souhaitez modifier. Vous obtiendrez 2 nouvelles variations.
          </p>
        </div>
        <ChatInput
          onSubmit={(t) => { setRefinedSel(null); refine(base, t); }}
          isLoading={isRefining}
          placeholder='Ex: "Rends les formes plus rondes, utilise du vert émeraude"'
          buttonText="Affiner"
          minRows={2}
        />
      </div>

      {(isRefining || refined.some(Boolean)) && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <ThinkingPanel stages={refineStages} isStreaming={isRefining} />
          <LogoGrid logos={refined} selectedIndex={refinedSel} onSelect={setRefinedSel} title="Variations affinées" />
        </div>
      )}
    </section>
  );
}

function DownloadIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
    </svg>
  );
}

function SpinIcon() {
  return (
    <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }}/>
      <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" style={{ opacity: 0.75 }}/>
    </svg>
  );
}
