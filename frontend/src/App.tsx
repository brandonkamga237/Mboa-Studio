import { useRef, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAnalyze } from "./hooks/useAnalyze";
import { useGenerateStream } from "./hooks/useGenerateStream";
import ChatInput from "./components/ChatInput";
import DynamicForm from "./components/DynamicForm";
import ThinkingPanel from "./components/ThinkingPanel";
import LogoGrid from "./components/LogoGrid";
import SvgEditor from "./components/SvgEditor";
import type { AppStep, LogoConcept } from "./types/logo";

export default function App() {
  const [step, setStep] = useState<AppStep>("input");
  const [sel, setSel] = useState<number | null>(null);

  const { data: analyzed, isLoading: analyzing, analyze } = useAnalyze();
  const { stages, logos, isGenerating, isDone, generate } = useGenerateStream();

  const formRef    = useRef<HTMLDivElement>(null);
  const resultRef  = useRef<HTMLDivElement>(null);
  const editorRef  = useRef<HTMLDivElement>(null);

  function scrollTo(r: React.RefObject<HTMLDivElement | null>) {
    setTimeout(() => r.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
  }

  async function handleChat(text: string) {
    setStep("form"); setSel(null);
    await analyze(text);
  }

  useEffect(() => { if (analyzed) scrollTo(formRef); }, [analyzed]);

  function handleConfirm(form: Record<string, string>) {
    setStep("generating"); setSel(null);
    scrollTo(resultRef);
    generate(form);
  }

  useEffect(() => {
    if (isDone) { setStep("results"); toast.success("4 logos générés"); }
  }, [isDone]);

  function handleSelect(i: number) {
    setSel(i); setStep("editing"); scrollTo(editorRef);
  }

  const concept: LogoConcept | null = sel !== null && logos[sel] ? logos[sel] : null;
  const brand = (analyzed?.extracted?.brand_name as string | null | undefined) ?? "Logo";

  const showThinking = ["generating","results","editing"].includes(step);
  const showGrid     = step === "results" || step === "editing" || (step === "generating" && logos.some(Boolean));

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>

      {/* ── Header ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 20,
        background: "rgba(250,250,249,0.85)",
        backdropFilter: "blur(20px) saturate(1.8)",
        WebkitBackdropFilter: "blur(20px) saturate(1.8)",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
      }}>
        <div style={{
          maxWidth: 980, margin: "0 auto",
          padding: "0 1.5rem",
          height: 56,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {/* Wordmark */}
          <button
            type="button"
            onClick={() => { setStep("input"); setSel(null); }}
            style={{
              background: "none", border: "none", padding: 0, cursor: "pointer",
              display: "flex", alignItems: "center", gap: "0.5rem",
            }}
          >
            <span style={{
              fontSize: "0.9375rem",
              fontWeight: 600,
              letterSpacing: "-0.03em",
              color: "var(--text-1)",
              userSelect: "none",
            }}>
              Mboa Studio
            </span>
            <span style={{
              fontSize: "0.6875rem",
              fontWeight: 500,
              letterSpacing: "0.04em",
              color: "var(--text-3)",
              background: "var(--subtle)",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              padding: "0.1rem 0.4rem",
              textTransform: "uppercase",
            }}>
              Beta
            </span>
          </button>

          {step !== "input" && (
            <button
              type="button"
              onClick={() => { setStep("input"); setSel(null); }}
              style={{
                background: "none",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                padding: "0.3125rem 0.875rem",
                fontSize: "0.8125rem",
                fontWeight: 500,
                color: "var(--text-2)",
                cursor: "pointer",
                transition: "background 0.12s, border-color 0.12s",
                letterSpacing: "-0.01em",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--subtle)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-strong)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"; }}
            >
              Nouveau logo
            </button>
          )}
        </div>
      </header>

      {/* ── Main ── */}
      <main style={{ flex: 1, maxWidth: 980, margin: "0 auto", width: "100%", padding: "3.5rem 1.5rem 6rem", display: "flex", flexDirection: "column", gap: "2.5rem" }}>

        {/* Step 1 — Input */}
        {step === "input" && (
          <div className="in" style={{ display: "flex", flexDirection: "column", gap: "2.75rem" }}>
            {/* Hero */}
            <div style={{ paddingTop: "0.5rem" }}>
              <h1 style={{
                fontSize: "clamp(2rem, 5.5vw, 2.875rem)",
                fontWeight: 700,
                letterSpacing: "-0.045em",
                lineHeight: 1.12,
                color: "var(--text-1)",
                marginBottom: "1rem",
              }}>
                Créez votre logo<br />avec l'IA
              </h1>
              <p style={{
                fontSize: "1rem",
                color: "var(--text-2)",
                maxWidth: 480,
                lineHeight: 1.65,
                letterSpacing: "-0.01em",
              }}>
                Décrivez votre marque en langage naturel. L'IA analyse, raisonne à voix haute, et génère 4 concepts SVG uniques.
              </p>
            </div>

            <ChatInput
              onSubmit={handleChat}
              isLoading={analyzing}
              placeholder="Décrivez votre marque... Ex: Je lance une startup de paiement mobile en Afrique appelée NkwaPay, je veux quelque chose de moderne et de confiance"
              buttonText="Créer mon logo"
              minRows={6}
            />

            {/* Feature list */}
            <div style={{ display: "flex", gap: "2.5rem", flexWrap: "wrap", paddingTop: "0.25rem" }}>
              {[
                ["Langage naturel", "Écrivez librement, dans votre langue"],
                ["Raisonnement visible", "L'IA explique chaque décision design"],
                ["4 concepts SVG", "Éditables, exportables en SVG et PNG"],
              ].map(([t, d]) => (
                <div key={t} style={{ flex: "1 1 150px" }}>
                  <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-1)", marginBottom: "0.25rem", letterSpacing: "-0.015em" }}>{t}</p>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-3)", lineHeight: 1.55 }}>{d}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 — Form */}
        {analyzed && step === "form" && (
          <div ref={formRef}>
            <DynamicForm analysis={analyzed} onConfirm={handleConfirm} isLoading={isGenerating} />
          </div>
        )}

        {/* Confirmed badge */}
        {analyzed && step !== "form" && step !== "input" && (
          <div ref={formRef} className="in" style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 0" }}>
            <svg width="12" height="12" viewBox="0 0 10 10" fill="none">
              <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: "0.8125rem", color: "var(--text-3)" }}>
              <strong style={{ color: "var(--text-2)", fontWeight: 500 }}>{brand}</strong> — brief confirmé
            </span>
          </div>
        )}

        {/* Step 3 — Thinking */}
        {showThinking && (
          <div ref={resultRef}>
            <ThinkingPanel stages={stages} isStreaming={isGenerating} />
          </div>
        )}

        {/* Step 4 — Grid */}
        {showGrid && (
          <LogoGrid logos={logos} selectedIndex={sel} onSelect={handleSelect} />
        )}

        {/* Step 5 — Editor */}
        {concept && (
          <div ref={editorRef}>
            <SvgEditor concept={concept} brandName={brand} />
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid rgba(0,0,0,0.05)", background: "var(--bg)" }}>
        <div style={{
          maxWidth: 980, margin: "0 auto",
          padding: "1.375rem 1.5rem",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{
            fontSize: "0.8125rem",
            fontWeight: 600,
            letterSpacing: "-0.025em",
            color: "var(--text-1)",
          }}>
            Mboa Studio
          </span>
          <span style={{
            fontSize: "0.75rem",
            color: "var(--text-3)",
            letterSpacing: "-0.01em",
          }}>
            Built by Brandon Kamga
          </span>
        </div>
      </footer>
    </div>
  );
}
