import type { NowObservationSourceKey } from "./aggregated-weather.types";

export const NOW_SOURCE_MODULES = ["embrapa", "defesa-civil-rs"] as const satisfies readonly NowObservationSourceKey[];

/**
 * Chave operacional do bloco Agora/Hero.
 *
 * Para trocar a fonte principal, altere somente este valor. O outro módulo
 * permanece como contingência observacional e assume silenciosamente quando a
 * fonte principal não entrega uma leitura recente utilizável.
 */
export const NOW_PRIMARY_SOURCE: NowObservationSourceKey = "embrapa";

export function getNowSourcePriority(
  primary: NowObservationSourceKey = NOW_PRIMARY_SOURCE,
): NowObservationSourceKey[] {
  return [primary, ...NOW_SOURCE_MODULES.filter((source) => source !== primary)];
}
