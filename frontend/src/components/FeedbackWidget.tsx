import { useState } from "react";

type Step = "closed" | "rate" | "message" | "done";

function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: "0.375rem" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          style={{
            background: "none", border: "none", cursor: "pointer", padding: "0.125rem",
            fontSize: "1.625rem", lineHeight: 1,
            color: n <= (hovered || value) ? "#f59e0b" : "var(--border-strong)",
            transition: "color 0.1s, transform 0.1s",
            transform: n <= (hovered || value) ? "scale(1.15)" : "scale(1)",
          }}
          aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

const RATING_LABELS: Record<number, string> = {
  1: "Décevant",
  2: "Passable",
  3: "Correct",
  4: "Bien",
  5: "Excellent !",
};

export default function FeedbackWidget() {
  const [step, setStep] = useState<Step>("closed");
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function open() {
    setStep("rate");
    setRating(0);
    setMessage("");
  }

  function close() {
    setStep("closed");
  }

  function handleRatingSelect(n: number) {
    setRating(n);
    setTimeout(() => setStep("message"), 300);
  }

  async function handleSubmit() {
    if (!rating) return;
    setSubmitting(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, message }),
      });
      setStep("done");
      setTimeout(() => setStep("closed"), 3000);
    } catch {
      // submit silently
      setStep("done");
      setTimeout(() => setStep("closed"), 3000);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{
      position: "fixed",
      bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
      right: "1rem",
      zIndex: 100,
      display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.75rem",
    }}>
      {/* Panel */}
      {step !== "closed" && (
        <div
          className="in"
          style={{
            width: "min(320px, calc(100vw - 2rem))",
            background: "#fff",
            border: "1px solid var(--border)",
            borderRadius: 16,
            boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "1rem 1.25rem",
            borderBottom: step !== "done" ? "1px solid var(--border)" : "none",
            background: step === "done" ? "none" : "var(--subtle)",
          }}>
            <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-1)", margin: 0, letterSpacing: "-0.02em" }}>
              {step === "rate"    && "Votre expérience"}
              {step === "message" && "Un commentaire ?"}
              {step === "done"    && "Merci ! 🎉"}
            </p>
            <button
              type="button"
              onClick={close}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--text-3)", fontSize: "1.125rem", lineHeight: 1,
                padding: "0.125rem", borderRadius: 4,
                display: "flex", alignItems: "center",
              }}
            >
              ×
            </button>
          </div>

          {/* Step: Rate */}
          {step === "rate" && (
            <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center", textAlign: "center" }}>
              <p style={{ fontSize: "0.875rem", color: "var(--text-2)", margin: 0, lineHeight: 1.6 }}>
                Comment évaluez-vous Mboa Studio ?
              </p>
              <StarRating value={rating} onChange={handleRatingSelect} />
              {rating > 0 && (
                <p style={{ fontSize: "0.8125rem", color: "var(--text-3)", margin: 0, fontStyle: "italic" }}>
                  {RATING_LABELS[rating]}
                </p>
              )}
            </div>
          )}

          {/* Step: Message */}
          {step === "message" && (
            <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <StarRating value={rating} onChange={setRating} />
                <span style={{ fontSize: "0.8125rem", color: "var(--text-3)" }}>{RATING_LABELS[rating]}</span>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Partagez votre expérience (optionnel)"
                className="field"
                style={{ resize: "none", fontSize: "0.875rem" }}
                autoFocus
              />
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setStep("rate")}
                  className="btn btn-outline"
                  style={{ flex: 1, padding: "0.5rem" }}
                >
                  Retour
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="btn btn-black"
                  style={{ flex: 2, padding: "0.5rem" }}
                >
                  {submitting ? "Envoi…" : "Envoyer"}
                </button>
              </div>
            </div>
          )}

          {/* Step: Done */}
          {step === "done" && (
            <div style={{
              padding: "2rem 1.25rem",
              display: "flex", flexDirection: "column", alignItems: "center", gap: "0.625rem", textAlign: "center",
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: "50%",
                background: "var(--success-bg)", border: "1px solid var(--success-border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.375rem",
              }}>
                ✓
              </div>
              <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-1)", margin: 0, letterSpacing: "-0.02em" }}>
                Merci pour votre retour !
              </p>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-3)", margin: 0, lineHeight: 1.55 }}>
                Votre avis nous aide à améliorer Mboa Studio.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Trigger button — compact circle */}
      <button
        type="button"
        onClick={step === "closed" ? open : close}
        title={step === "closed" ? "Donner un avis" : "Fermer"}
        style={{
          width: 40, height: 40,
          borderRadius: "50%",
          background: step !== "closed" ? "var(--subtle)" : "var(--black)",
          color: step !== "closed" ? "var(--text-2)" : "#fff",
          border: step !== "closed" ? "1px solid var(--border)" : "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
          boxShadow: step === "closed" ? "0 2px 12px rgba(0,0,0,0.2)" : "none",
          transition: "all 0.18s",
          fontSize: step === "closed" ? "1.125rem" : "1.25rem",
          flexShrink: 0,
        }}
      >
        {step === "closed" ? "★" : "×"}
      </button>
    </div>
  );
}
