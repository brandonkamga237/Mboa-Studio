import type { LogoConcept } from "../types/logo";

interface Props {
  concept: LogoConcept | null;
  isSelected: boolean;
  onClick: () => void;
}

export default function LogoCard({ concept, isSelected, onClick }: Props) {
  if (!concept) {
    return (
      <div style={{ display: "flex", flexDirection: "column", borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)" }}>
        <div className="skel" style={{ aspectRatio: "1", borderRadius: 0 }} />
        <div style={{ padding: "0.6rem 0.875rem", borderTop: "1px solid var(--border)", background: "var(--surface)" }}>
          <div className="skel" style={{ height: 10, width: "70%", borderRadius: 4 }} />
          <div className="skel" style={{ height: 8, width: "45%", borderRadius: 4, marginTop: "0.4rem" }} />
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        background: "#ffffff",
        border: `1.5px solid ${isSelected ? "var(--black)" : "var(--border)"}`,
        borderRadius: 10,
        overflow: "hidden",
        cursor: "pointer",
        position: "relative",
        transition: "border-color 0.15s, box-shadow 0.15s",
        textAlign: "left",
        display: "flex",
        flexDirection: "column",
        boxShadow: isSelected ? "0 0 0 3px rgba(0,0,0,0.06)" : "none",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-strong)";
      }}
      onMouseLeave={(e) => {
        if (!isSelected) (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
      }}
    >
      {/* SVG area */}
      <div
        style={{ padding: "1rem", background: "#fff", aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", userSelect: "none", pointerEvents: "none" }}
        dangerouslySetInnerHTML={{ __html: concept.svg }}
      />

      {/* Caption */}
      <div style={{
        borderTop: `1px solid ${isSelected ? "var(--border-strong)" : "var(--border)"}`,
        background: isSelected ? "#f8f8f7" : "#fff",
        padding: "0.625rem 0.875rem",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "0.5rem",
      }}>
        <p style={{ fontSize: "0.75rem", color: "var(--text-2)", lineHeight: 1.45, margin: 0, flex: 1 }}>
          {concept.description}
        </p>
        {!isSelected && (
          <span style={{
            fontSize: "0.6875rem", fontWeight: 500,
            color: "var(--text-3)",
            whiteSpace: "nowrap",
            paddingTop: "0.1rem",
          }}>
            Sélectionner
          </span>
        )}
      </div>

      {/* Selected badge */}
      {isSelected && (
        <div style={{
          position: "absolute", top: 8, right: 8,
          width: 20, height: 20, borderRadius: "50%",
          background: "var(--black)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
        }}>
          <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
            <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
    </button>
  );
}
