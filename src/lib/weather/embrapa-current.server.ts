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
 * O centralizador é a fonte de leitura do pageview. Um snapshot recente segue
 * pelo caminho rápido; um snapshot antigo, mas conhecido, é preservado como
 * último valor observado para páginas históricas e de acumulados.
 *
 * A idade da observação continua sendo validada por isPublishableEmbrapaObservation
 * e por deriveEmbrapaCurrent, portanto um snapshot antigo nunca representa o
 * "Agora". A consulta direta fica restrita ao caso em que não existe payload
 * central aproveitável; o cron permanece responsável por renovar a leitura.
 */
export async function getFreshEmbrapaObservation(): Promise<EmbrapaObservation> {
  const central = await getCentralEmbrapaObservation();
  if (isCentralEmbrapaSnapshotFresh(central)) return central;
  if (central.status !== "unavailable") return central;
  return fetchEmbrapaObservation();
}
