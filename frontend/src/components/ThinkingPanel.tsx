import { useState, useEffect, useRef } from "react";
import type { StageInfo } from "../types/logo";

interface Props {
  stages: StageInfo[];
  isStreaming: boolean;
}

// Split accumulated stage text into readable paragraphs
function parseParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function StageIcon({ status }: { status: StageInfo["status"] }) {
  if (status === "done") {
    return (
      <div style={{
        width: 22, height: 22, borderRadius: "50%",
        background: "var(--black)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
          <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }
  return (
    <div style={{
      width: 22, height: 22, borderRadius: "50%",
      background: "none",
      border: "2px solid var(--black)",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--black)" }} />
    </div>
  );
}

function StageBlock({ stage, isLast }: { stage: StageInfo; isLast: boolean }) {
  const [open, setOpen] = useState(true);  // stages open by default
  const paragraphs = parseParagraphs(stage.thinking);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll active stage as text streams in
  useEffect(() => {
    if (stage.status === "active" && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [stage.thinking, stage.status]);

  // Collapse done stages when a new one opens (keep active open)
  useEffect(() => {
    if (stage.status === "done" && !isLast) {
      setOpen(false);
    }
    if (stage.status === "active") {
      setOpen(true);
    }
  }, [stage.status, isLast]);

  return (
    <div className="thinking-step-in" style={{ display: "flex", gap: "0.875rem" }}>
      {/* Timeline line + icon */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <StageIcon status={stage.status} />
        {!isLast && (
          <div style={{
            width: 2, flex: 1, minHeight: 16,
            background: stage.status === "done" ? "var(--black)" : "var(--border)",
            margin: "4px 0",
            transition: "background 0.3s",
          }} />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, paddingBottom: isLast ? 0 : "1rem", minWidth: 0 }}>
        {/* Stage header — clickable to collapse */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{
            background: "none", border: "none", padding: 0, cursor: "pointer",
            display: "flex", alignItems: "center", gap: "0.5rem",
            marginBottom: open && paragraphs.length > 0 ? "0.625rem" : 0,
            width: "100%", textAlign: "left",
          }}
        >
          <span style={{
            fontSize: "0.875rem", fontWeight: 600,
            color: stage.status === "active" ? "var(--text-1)" : "var(--text-2)",
            letterSpacing: "-0.02em",
            flex: 1,
          }}>
            {stage.label}
          </span>

          {stage.status === "active" && (
            <span style={{ display: "flex", gap: 3, alignItems: "flex-end", flexShrink: 0 }}>
              {[0, 1, 2].map((i) => (
                <span key={i} style={{
                  display: "inline-block", width: 3.5, height: 3.5,
                  borderRadius: "50%", background: "var(--text-3)",
                  animation: `dot 1s ease-in-out ${i * 0.15}s infinite`,
                }} />
              ))}
            </span>
          )}

          {stage.status === "done" && paragraphs.length > 0 && (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ color: "var(--text-3)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>

        {/* Stage paragraphs */}
        {open && paragraphs.length > 0 && (
          <div
            ref={scrollRef}
            style={{
              display: "flex", flexDirection: "column", gap: "0.5rem",
              maxHeight: stage.status === "active" ? 240 : "none",
              overflowY: stage.status === "active" ? "auto" : "visible",
            }}
          >
            {paragraphs.map((para, i) => {
              const isLastPara = i === paragraphs.length - 1;
              const showCursor = isLastPara && stage.status === "active";
              return (
                <p
                  key={i}
                  className={showCursor ? "cursor-blink" : ""}
                  style={{
                    margin: 0,
                    fontSize: "0.875rem",
                    lineHeight: 1.7,
                    color: "var(--text-2)",
                    fontFamily: showCursor ? "JetBrains Mono, monospace" : "inherit",
                  }}
                >
                  {para}
                </p>
              );
            })}
          </div>
        )}

        {/* Empty active stage — show waiting message */}
        {open && stage.status === "active" && paragraphs.length === 0 && (
          <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--text-3)", fontStyle: "italic" }}>
            En cours…
          </p>
        )}
      </div>
    </div>
  );
}

export default function ThinkingPanel({ stages, isStreaming }: Props) {
  const [open, setOpen] = useState(false);
  const doneCount = stages.filter((s) => s.status === "done").length;

  // Auto-open panel when streaming starts
  useEffect(() => {
    if (isStreaming) setOpen(true);
  }, [isStreaming]);

  if (stages.length === 0 && !isStreaming) return null;

  return (
    <div className="surface overflow-hidden in">
      {/* Panel header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0.875rem 1.25rem",
          background: "none", border: "none", cursor: "pointer",
          transition: "background 0.12s",
          borderBottom: open && stages.length > 0 ? "1px solid var(--border)" : "none",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--subtle)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "")}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {isStreaming ? (
            <span style={{ display: "flex", gap: 3 }}>
              {[0, 1, 2].map((i) => (
                <span key={i} style={{
                  display: "inline-block", width: 4, height: 4, borderRadius: "50%",
                  background: "var(--text-3)",
                  animation: `dot 1s ease-in-out ${i * 0.16}s infinite`,
                }} />
              ))}
            </span>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" style={{ color: "var(--text-3)" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          )}
          <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-1)", letterSpacing: "-0.01em" }}>
            {isStreaming ? "Raisonnement en cours…" : "Raisonnement complet"}
          </span>
          {!isStreaming && stages.length > 0 && (
            <span style={{
              fontSize: "0.6875rem", color: "var(--text-3)",
              background: "var(--subtle)", border: "1px solid var(--border)",
              borderRadius: 4, padding: "0.1rem 0.4rem", fontFamily: "monospace",
            }}>
              {doneCount} / {stages.length} étapes
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>
            {open ? "Masquer" : "Voir le raisonnement"}
          </span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ color: "var(--text-3)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Stages */}
      {open && stages.length > 0 && (
        <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column" }}>
          {stages.map((stage, i) => (
            <StageBlock
              key={stage.id + i}
              stage={stage}
              isLast={i === stages.length - 1}
            />
          ))}
        </div>
      )}

      {open && stages.length === 0 && isStreaming && (
        <div style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <span style={{ display: "flex", gap: 3 }}>
            {[0, 1, 2].map((i) => (
              <span key={i} style={{
                display: "inline-block", width: 4, height: 4, borderRadius: "50%",
                background: "var(--text-3)",
                animation: `dot 1s ease-in-out ${i * 0.16}s infinite`,
              }} />
            ))}
          </span>
          <span style={{ fontSize: "0.875rem", color: "var(--text-3)", fontStyle: "italic" }}>
            Initialisation…
          </span>
        </div>
      )}
    </div>
  );
}
