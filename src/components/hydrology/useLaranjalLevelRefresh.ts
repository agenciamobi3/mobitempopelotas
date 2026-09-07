import { useEffect, useState } from "react";

import { getLaranjalLevelData } from "@/lib/hydrology/laranjal-level.functions";
import type { LaranjalLevelData } from "@/lib/hydrology/laranjal-level.server";

export const LARANJAL_REFRESH_INTERVAL_MS = 60_000;

function readingTime(value: string | null) {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function canReplaceLaranjalReading(
  current: LaranjalLevelData,
  next: LaranjalLevelData,
) {
  if (next.currentLevel === null || next.updatedAt === null) {
    return current.currentLevel === null || current.updatedAt === null;
  }

  if (current.currentLevel === null || current.updatedAt === null) return true;

  const currentSource = current.source.key;
  const nextSource = next.source.key;

  // O seletor server-side já escolheu a fonte correta. Quando a proveniência
  // muda, não comparamos timestamps nem valores de réguas com referências
  // verticais diferentes: aceitamos a troca de fonte como uma nova série.
  if (currentSource && nextSource && currentSource !== nextSource) return true;

  const currentTime = readingTime(current.updatedAt);
  const nextTime = readingTime(next.updatedAt);
  if (nextTime === null) return false;
  if (currentTime === null) return true;

  // Dentro da mesma fonte, a mesma medição pode voltar com status/idade
  // atualizados. Uma medição mais antiga nunca apaga a última leitura visível.
  return nextTime >= currentTime;
}

export function useLaranjalLevelRefresh(initialLevel: LaranjalLevelData) {
  const [level, setLevel] = useState(initialLevel);

  useEffect(() => {
    setLevel(initialLevel);
  }, [initialLevel]);

  useEffect(() => {
    let active = true;
    let inFlight = false;

    const refresh = async () => {
      if (!active || inFlight || document.visibilityState === "hidden") return;
      inFlight = true;

      try {
        const next = await getLaranjalLevelData();
        if (!active) return;
        setLevel((current) => (canReplaceLaranjalReading(current, next) ? next : current));
      } catch {
        // Mantém a última medição visível. Falha de atualização não apaga last-known.
      } finally {
        inFlight = false;
      }
    };

    void refresh();
    const interval = window.setInterval(() => void refresh(), LARANJAL_REFRESH_INTERVAL_MS);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return level;
}
