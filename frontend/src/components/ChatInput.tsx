import { useState, useRef, type KeyboardEvent } from "react";

interface Props {
  onSubmit: (text: string) => void;
  isLoading: boolean;
  placeholder?: string;
  buttonText?: string;
  minRows?: number;
}

export default function ChatInput({
  onSubmit,
  isLoading,
  placeholder = "Décrivez votre marque...",
  buttonText = "Générer",
  minRows = 5,
}: Props) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  function submit() {
    const t = text.trim();
    if (!t || isLoading) return;
    onSubmit(t);
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submit(); }
  }

  function resize() {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  return (
    <div
      className="surface overflow-hidden transition-colors"
      style={{ borderColor: "var(--border)" }}
    >
      <textarea
        ref={ref}
        value={text}
        onChange={(e) => { setText(e.target.value); resize(); }}
        onKeyDown={onKey}
        rows={minRows}
        placeholder={placeholder}
        disabled={isLoading}
        className="w-full resize-none bg-transparent outline-none"
        style={{
          color: "var(--text-1)",
          fontSize: "0.9375rem",
          lineHeight: "1.65",
          minHeight: `${minRows * 1.65}rem`,
          padding: "clamp(0.875rem, 3vw, 1.25rem)",
          paddingBottom: "0.75rem",
        }}
      />
      <div
        style={{
          borderTop: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0.75rem clamp(0.875rem, 3vw, 1rem)",
          gap: "0.75rem",
        }}
      >
        <span style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>
          Ctrl + Entrée
        </span>
        <button
          type="button"
          onClick={submit}
          disabled={isLoading || !text.trim()}
          className="btn btn-black"
          style={{ flexShrink: 0 }}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }}/>
                <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" style={{ opacity: 0.75 }}/>
              </svg>
              Analyse…
            </>
          ) : buttonText}
        </button>
      </div>
    </div>
  );
}
