import { useCallback, useEffect, useState } from "react";
import * as api from "../lib/api";
import { getDeviceId } from "../lib/deviceId";
import type { FootprintInput, Entry, FootprintResult, InsightsResponse } from "../lib/types";

export function useEmissionTracker() {
  const [deviceId] = useState(getDeviceId);
  const [result, setResult] = useState<FootprintResult | null>(null);
  const [lastInput, setLastInput] = useState<FootprintInput | null>(null);
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  const loadHistory = useCallback(async () => {
    try {
      setEntries(await api.loadHistory(deviceId));
    } catch {
      // History is non-critical; fail silently rather than blocking the app.
    }
  }, [deviceId]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const calculate = async (input: FootprintInput) => {
    setLoading(true);
    setError(null);
    setStatus("");
    try {
      const [calc, ins] = await Promise.all([api.estimateFootprint(input), api.fetchAdvice(input)]);
      setResult(calc);
      setInsights(ins);
      setLastInput(input);
      setStatus("Your footprint results and personalized insights are ready below.");
    } catch {
      setError("Something went wrong calculating your footprint. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!result || !lastInput) return;
    setSaving(true);
    setError(null);
    try {
      await api.storeEntry(deviceId, lastInput, result);
      await loadHistory();
      setStatus("Entry saved to your history.");
    } catch {
      setError("Could not save this entry. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return { result, insights, entries, loading, saving, error, status, calculate, save };
}
