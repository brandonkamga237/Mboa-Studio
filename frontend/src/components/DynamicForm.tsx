import { useState } from "react";
import type { ExtractedForm, AnalyzeResponse } from "../types/logo";

interface Props {
  analysis: AnalyzeResponse;
  onConfirm: (form: Record<string, string>) => void;
  isLoading: boolean;
}

const LABELS: Record<string, string> = {
  brand_name: "Nom",
  industry: "Secteur",
  style_adjectives: "Style",
  color_preferences: "Couleurs",
  slogan: "Slogan",
  target_audience: "Audience",
  special_requests: "Autres",
};

const FIELDS = ["brand_name","industry","style_adjectives","color_preferences","slogan","target_audience","special_requests"];

function str(extracted: ExtractedForm, f: string): string {
  const v = extracted[f as keyof ExtractedForm];
  if (!v) return "";
  return Array.isArray(v) ? v.join(", ") : String(v);
}

export default function DynamicForm({ analysis, onConfirm, isLoading }: Props) {
  const { extracted, missing_fields, ai_message } = analysis;

  const [form, setForm] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    FIELDS.forEach((f) => { init[f] = str(extracted, f); });
    return init;
  });

  const filled = FIELDS.filter((f) => form[f] && !missing_fields.includes(f));
  const empty  = FIELDS.filter((f) => !form[f] || missing_fields.includes(f));

  return (
    <div className="surface p-6 space-y-6 in">
      {/* AI message — clean, no colored box */}
      <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "1.25rem" }}>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-3)", marginBottom: "0.4rem" }}>
          Analyse IA
        </p>
        <p style={{ fontSize: "0.9375rem", color: "var(--text-2)", lineHeight: 1.6 }}>
          {ai_message}
        </p>
      </div>

      {/* Filled fields */}
      {filled.length > 0 && (
        <div className="space-y-3">
          <p className="lbl">Compris</p>
          {filled.map((f) => (
            <Row key={f} label={LABELS[f]} value={form[f]} filled onChange={(v) => setForm({ ...form, [f]: v })} />
          ))}
        </div>
      )}

      {/* Empty fields */}
      {empty.length > 0 && (
        <div className="space-y-3">
          <p className="lbl">À préciser <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 400, color: "var(--text-3)" }}>— optionnel</span></p>
          {empty.map((f) => (
            <Row key={f} label={LABELS[f]} value={form[f]} filled={false} onChange={(v) => setForm({ ...form, [f]: v })} />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => onConfirm(form)}
        disabled={isLoading || !form.brand_name?.trim()}
        className="btn btn-black w-full"
        style={{ height: 42 }}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            Génération…
          </>
        ) : "Confirmer et générer"}
      </button>
    </div>
  );
}

function Row({ label, value, filled, onChange }: { label: string; value: string; filled: boolean; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <div className={filled ? "pill-ok" : "pill-q"} style={{ minWidth: 90, justifyContent: "center" }}>
        {filled && (
          <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
            <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
        {label}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={filled ? undefined : "Optionnel…"}
        className="field flex-1"
        style={{ padding: "0.375rem 0.625rem", fontSize: "0.875rem" }}
      />
    </div>
  );
}
