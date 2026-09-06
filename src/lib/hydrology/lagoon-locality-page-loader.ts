import { createUnavailableLagoonMonitoringNetworkData } from "./public-hydrology-page-loader";
import { getLagoonMonitoringNetwork } from "./lagoon-network.functions";
import type {
  LagoonMonitoringNetworkData,
  LagoonMonitoringObservation,
} from "./lagoon-network.server";

const PAGE_DEADLINE_MS = 2_500;

export async function loadLagoonLocalityNetwork(): Promise<LagoonMonitoringNetworkData> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      getLagoonMonitoringNetwork(),
      new Promise<LagoonMonitoringNetworkData>((resolve) => {
        timeout = setTimeout(() => resolve(createUnavailableLagoonMonitoringNetworkData()), PAGE_DEADLINE_MS);
      }),
    ]);
  } catch {
    return createUnavailableLagoonMonitoringNetworkData();
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export function selectLagoonObservation(
  network: LagoonMonitoringNetworkData,
  stationId: string,
): LagoonMonitoringObservation | null {
  return network.observations.find((observation) => observation.station.id === stationId) ?? null;
}
