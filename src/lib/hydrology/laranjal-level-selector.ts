import type { LaranjalLevelData } from "./laranjal-level.server";

export type LaranjalLevelCandidates = {
  lab: LaranjalLevelData;
  ciexFurg: LaranjalLevelData;
  lastKnownLab: LaranjalLevelData | null;
};

/**
 * Ordem deliberada:
 * 1. LabHidroSens enquanto estiver realmente live;
 * 2. CIEX/FURG como contingência quando o Lab estiver stale/indisponível;
 * 3. leitura stale do próprio Lab se a contingência também falhar;
 * 4. last-known arquivado do Lab;
 * 5. erro original do Lab.
 *
 * As séries nunca são fundidas porque usam referências verticais distintas.
 */
export function selectLaranjalLevelSource({
  lab,
  ciexFurg,
  lastKnownLab,
}: LaranjalLevelCandidates): LaranjalLevelData {
  if (lab.status === "live") return lab;
  if (ciexFurg.status !== "unavailable") return ciexFurg;
  if (lab.status === "stale") return lab;
  return lastKnownLab ?? lab;
}
