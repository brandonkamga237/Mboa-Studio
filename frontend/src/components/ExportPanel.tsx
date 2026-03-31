import { useState } from "react";
import toast from "react-hot-toast";
import { exportSVG, exportPNG } from "../utils/svgExport";

interface Props { svgString: string; brandName: string; }

const DlIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
  </svg>
);

export default function ExportPanel({ svgString, brandName }: Props) {
  const [pngLoading, setPngLoading] = useState(false);

  return (
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <button
        type="button"
        onClick={() => { exportSVG(svgString, brandName); toast.success("SVG téléchargé"); }}
        className="btn btn-outline"
        style={{ flex: 1, height: 36 }}
      >
        <DlIcon /> SVG
      </button>
      <button
        type="button"
        onClick={async () => {
          setPngLoading(true);
          try { await exportPNG(svgString, brandName); toast.success("PNG 1024px téléchargé"); }
          catch { toast.error("Export échoué"); }
          finally { setPngLoading(false); }
        }}
        disabled={pngLoading}
        className="btn btn-black"
        style={{ flex: 1, height: 36 }}
      >
        {pngLoading ? (
          <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
        ) : <DlIcon />}
        PNG
      </button>
    </div>
  );
}
