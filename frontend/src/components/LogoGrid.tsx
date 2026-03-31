import type { LogoConcept } from "../types/logo";
import LogoCard from "./LogoCard";

interface Props {
  logos: (LogoConcept | null)[];
  selectedIndex: number | null;
  onSelect: (i: number) => void;
  title?: string;
}

export default function LogoGrid({ logos, selectedIndex, onSelect, title = "Concepts" }: Props) {
  const ready = logos.filter(Boolean).length;
  const total = logos.length;

  return (
    <section className="in" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-1)" }}>{title}</p>
        <p style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>
          {ready < total ? `${ready} / ${total} générés` : "Cliquez pour sélectionner"}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.875rem" }}>
        {logos.map((c, i) => (
          <LogoCard key={i} concept={c} isSelected={selectedIndex === i} onClick={() => c && onSelect(i)} />
        ))}
      </div>
    </section>
  );
}
