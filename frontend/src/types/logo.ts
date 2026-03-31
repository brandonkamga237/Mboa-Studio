export interface ExtractedForm {
  brand_name?: string | null;
  industry?: string | null;
  style_adjectives?: string[] | null;
  color_preferences?: string | null;
  slogan?: string | null;
  target_audience?: string | null;
  special_requests?: string | null;
}

export interface AnalyzeResponse {
  extracted: ExtractedForm;
  missing_fields: string[];
  ai_message: string;
}

export interface LogoConcept {
  svg: string;
  description: string;
  index: number;
}

export type FontFamily =
  | "Inter"
  | "Space Grotesk"
  | "DM Sans"
  | "Playfair Display"
  | "JetBrains Mono"
  | "Libre Baskerville";

export interface EditorState {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: FontFamily;
  fontSize: number;
  layout: "icon-above" | "icon-left" | "text-only";
}

export type AppStep = "input" | "form" | "generating" | "results" | "editing";

export interface StageInfo {
  id: string;
  label: string;
  thinking: string;        // accumulated text for this stage
  status: "active" | "done";
}
