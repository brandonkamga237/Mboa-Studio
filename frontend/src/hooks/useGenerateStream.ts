import { useState, useCallback, useRef } from "react";
import { createSSEConnection } from "../utils/sseClient";
import type { LogoConcept, StageInfo } from "../types/logo";

export function useGenerateStream() {
  const [stages, setStages] = useState<StageInfo[]>([]);
  const [logos, setLogos] = useState<(LogoConcept | null)[]>([null, null, null, null]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  // track current stage id to append thinking to correct stage
  const currentStageIdRef = useRef<string>("");

  const generate = useCallback((completedForm: object) => {
    if (cleanupRef.current) cleanupRef.current();
    setStages([]);
    setLogos([null, null, null, null]);
    setIsGenerating(true);
    setIsDone(false);
    setError(null);
    currentStageIdRef.current = "";

    cleanupRef.current = createSSEConnection(
      "/api/generate",
      { completed_form: completedForm },
      {
        onStage: (id, label) => {
          currentStageIdRef.current = id;
          // Mark previous stage as done, add new active stage
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
          // Mark last stage as done
          setStages((prev) =>
            prev.map((s) => s.status === "active" ? { ...s, status: "done" } : s)
          );
          setIsGenerating(false);
          setIsDone(true);
        },
        onError: (err) => { setError(err); setIsGenerating(false); },
      }
    );
  }, []);

  function reset() {
    if (cleanupRef.current) cleanupRef.current();
    setStages([]); setLogos([null, null, null, null]);
    setIsGenerating(false); setIsDone(false); setError(null);
    currentStageIdRef.current = "";
  }

  return { stages, logos, isGenerating, isDone, error, generate, reset };
}
