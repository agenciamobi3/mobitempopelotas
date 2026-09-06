import { getCentralEmbrapaObservation } from "./embrapa-central.server";
import { canUseEmbrapaObservation, getObservationAgeMinutes } from "./current-observation";
import { fetchEmbrapaObservation } from "./embrapa.server";
import type { EmbrapaObservation } from "./official-sources.types";

export const CENTRAL_READING_MAX_AGE_MS = 75_000;

export function getCentralEmbrapaSnapshotAgeMs(
  observation: EmbrapaObservation,
  now = new Date(),
) {
  const timestamp = Date.parse(observation.source.fetchedAt);
  if (!Number.isFinite(timestamp)) return null;
  return Math.max(0, now.getTime() - timestamp);
}

export function isCentralEmbrapaSnapshotFresh(
  observation: EmbrapaObservation,
  now = new Date(),
) {
  const ageMs = getCentralEmbrapaSnapshotAgeMs(observation, now);
  return ageMs !== null && ageMs <= CENTRAL_READING_MAX_AGE_MS;
}

export function isPublishableEmbrapaObservation(
  observation: EmbrapaObservation,
  now = new Date(),
) {
  return canUseEmbrapaObservation(observation, getObservationAgeMinutes(observation, now));
}

/**
 * Mantém o centralizador como caminho rápido, mas um snapshot antigo não pode
 * representar o "Agora". Quando o cron não atualizou o registro nos últimos
 * 75 segundos, fazemos somente uma leitura direta da fonte, sem lease e sem
 * persistência no pageview.
 */
export async function getFreshEmbrapaObservation(): Promise<EmbrapaObservation> {
  const central = await getCentralEmbrapaObservation();
  if (isCentralEmbrapaSnapshotFresh(central)) return central;
  return fetchEmbrapaObservation();
}
