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

  const currentTime = readingTime(current.updatedAt);
  const nextTime = readingTime(next.updatedAt);
  if (nextTime === null) return false;
  if (currentTime === null) return true;

  // A mesma medição pode voltar com status/idade atualizados. Uma medição mais
  // antiga, porém, nunca apaga a última leitura já visível.
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
