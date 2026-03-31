import { useState, useCallback, useRef } from "react";
import { createSSEConnection } from "../utils/sseClient";
import type { LogoConcept, StageInfo } from "../types/logo";

export function useRefineStream() {
  const [stages, setStages] = useState<StageInfo[]>([]);
  const [logos, setLogos] = useState<(LogoConcept | null)[]>([null, null]);
  const [isRefining, setIsRefining] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const currentStageIdRef = useRef<string>("");

  const refine = useCallback((selectedSvg: string, feedbackText: string) => {
    if (cleanupRef.current) cleanupRef.current();
    setStages([]);
    setLogos([null, null]);
    setIsRefining(true);
    setIsDone(false);
    setError(null);
    currentStageIdRef.current = "";

    cleanupRef.current = createSSEConnection(
      "/api/refine",
      { selected_svg: selectedSvg, feedback_text: feedbackText },
      {
        onStage: (id, label) => {
          currentStageIdRef.current = id;
          setStages((prev) => {
            const updated = prev.map((s) =>
              s.status === "active" ? { ...s, status: "done" as const } : s
            );
            return [...updated, { id, label, thinking: "", status: "active" }];
          });
        },
        onThinking: (chunk) => {
          const stageId = currentStageIdRef.current;
          setStages((prev) =>
            prev.map((s) =>
              s.id === stageId ? { ...s, thinking: s.thinking + chunk } : s
            )
          );
        },
        onLogo: (index, svg, description) =>
          setLogos((prev) => {
            const next = [...prev];
            next[index] = { index, svg, description };
            return next;
          }),
        onDone: () => {
          setStages((prev) =>
            prev.map((s) => s.status === "active" ? { ...s, status: "done" } : s)
          );
          setIsRefining(false);
          setIsDone(true);
        },
        onError: (err) => { setError(err); setIsRefining(false); },
      }
    );
  }, []);

  function reset() {
    if (cleanupRef.current) cleanupRef.current();
    setStages([]); setLogos([null, null]);
    setIsRefining(false); setIsDone(false); setError(null);
    currentStageIdRef.current = "";
  }

  return { stages, logos, isRefining, isDone, error, refine, reset };
}
