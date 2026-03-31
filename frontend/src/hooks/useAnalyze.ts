import { useState } from "react";
import axios from "axios";
import type { AnalyzeResponse } from "../types/logo";

export function useAnalyze() {
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze(userText: string) {
    setIsLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await axios.post<AnalyzeResponse>("/api/analyze", { user_text: userText }, { timeout: 30_000 });
      setData(res.data);
    } catch (e) {
      const msg = axios.isAxiosError(e)
        ? (e.response?.data?.detail ?? e.message)
        : "Analyse échouée";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  function reset() { setData(null); setError(null); }

  return { data, isLoading, error, analyze, reset };
}
