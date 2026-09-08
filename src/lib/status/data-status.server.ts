import { fetchAnaRhnLaranjalPublicSnapshot } from "@/lib/hydrology/ana-rhn-public.server";
import { fetchDefesaCivilHydroData } from "@/lib/hydrology/defesa-civil-rs.server";
import { getGuaibaObservation } from "@/lib/hydrology/guaiba.functions";
import { getLagoonMonitoringNetwork } from "@/lib/hydrology/lagoon-network.functions";
import { getLaranjalLevelData } from "@/lib/hydrology/laranjal-level.functions";
import { selectDefesaCivilCurrentStation } from "@/lib/weather/defesa-civil-current.server";
import { fetchOfficialWeatherSources } from "@/lib/weather/official-sources.server";
import { fetchPelotasWeather } from "@/lib/weather/weather-baseline.server";

import { getOpenMeteoContingencyStatus } from "./open-meteo-contingency-status.server";
import { getActiveMaintenanceWindows } from "./data-status-storage.server";
import type {
  DataStatusOverview,
  ServiceState,
  ServiceStatus,
} from "./data-status.types";

export function detailForState(state: ServiceState) {
  if (state === "operational") return "A fonte respondeu normalmente na última verificação.";
  if (state === "partial") {
    return "A fonte respondeu, mas parte das informações está atrasada ou indisponível.";
  }
  if (state === "maintenance") return "Serviço em manutenção programada pelo Tempo Pelotas.";
  if (state === "implementation") {
    return "Fonte disponível para integração, mas ainda não usada na publicação.";
  }
  return "A fonte não entregou dados utilizáveis na última verificação.";
}

function stateFromHydrology(status: "live" | "stale" | "unavailable"): ServiceState {
  if (status === "unavailable") return "offline";
  if (status === "stale") return "partial";
  return "operational";
}

function stateFromRegionalHydrology(status: "live" | "partial" | "stale" | "unavailable"): ServiceState {
  if (status === "unavailable") return "offline";
  if (status === "partial" || status === "stale") return "partial";
  return "operational";
}

function stateFromDefesaCivil(
  status: "disabled" | "live" | "partial" | "unavailable",
): ServiceState {
  if (status === "unavailable" || status === "disabled") return "offline";
  if (status === "partial") return "partial";
  return "operational";
}

function latestCheckedAt(values: Array<string | null | undefined>, fallback: string) {
  const valid = values
    .filter((value): value is string => Boolean(value))
    .map((value) => ({ value, time: new Date(value).getTime() }))
    .filter((item) => Number.isFinite(item.time))
    .sort((a, b) => b.time - a.time);
  return valid[0]?.value ?? fallback;
}

function weatherService(
  id: string,
  name: string,
  provider: string,
  state: ServiceState,
  checkedAt: string,
  detail = detailForState(state),
): ServiceStatus {
  return {
    id,
    name,
    provider,
    category: "Meteorologia e avisos",
    state,
    detail,
    checkedAt,
  };
}

function applyMaintenanceWindows(
  services: ServiceStatus[],
  maintenance: Awaited<ReturnType<typeof getActiveMaintenanceWindows>>,
) {
  if (maintenance.length === 0) return services;
  const byService = new Map(maintenance.map((window) => [window.serviceId, window]));

  return services.map((service) => {
    const window = byService.get(service.id);
    if (!window) return service;
    return {
      ...service,
      state: "maintenance" as const,
      detail: window.message || window.title,
    };
  });
}

export function overallState(services: ServiceStatus[]): DataStatusOverview["overall"] {
  const runtimeServices = services.filter(
    (service) => service.state !== "implementation" && service.state !== "maintenance",
  );
  const offline = runtimeServices.filter((service) => service.state === "offline").length;
  const partial = runtimeServices.filter((service) => service.state === "partial").length;

  if (runtimeServices.length > 0 && offline === runtimeServices.length) return "offline";
  if (offline > 0 || partial > 0) return "partial";
  return "operational";
}

export async function collectDataStatus(): Promise<DataStatusOverview> {
  const checkedAt = new Date().toISOString();
  const [
    baselineResult,
    openMeteoContingencyResult,
    officialResult,
    laranjalResult,
    guaibaResult,
    lagoonResult,
    defesaCivilResult,
    anaRhnResult,
  ] = await Promise.allSettled([
    fetchPelotasWeather(),
    getOpenMeteoContingencyStatus(new Date(checkedAt)),
    fetchOfficialWeatherSources(),
    getLaranjalLevelData(),
    getGuaibaObservation(),
    getLagoonMonitoringNetwork(),
    fetchDefesaCivilHydroData(),
    fetchAnaRhnLaranjalPublicSnapshot(),
  ]);

  const services: ServiceStatus[] = [];
  const openMeteoContingency =
    openMeteoContingencyResult.status === "fulfilled"
      ? openMeteoContingencyResult.value
      : null;

  if (baselineResult.status === "fulfilled") {
    const openMeteo = baselineResult.value.providers["open-meteo"];
    const metNorway = baselineResult.value.providers["met-norway"];
    const openMeteoState: ServiceState =
      openMeteo.status === "live"
        ? openMeteo.source.isFallback
          ? "partial"
          : "operational"
        : openMeteoContingency?.available
          ? "partial"
          : "offline";
    const openMeteoCheckedAt =
      openMeteo.status === "live"
        ? openMeteo.source.fetchedAt || checkedAt
        : openMeteoContingency?.available
          ? openMeteoContingency.lastSuccessAt ||
            openMeteoContingency.fetchedAt ||
            openMeteo.source.fetchedAt ||
            checkedAt
          : openMeteo.source.fetchedAt || checkedAt;
    const openMeteoDetail =
      openMeteoState === "operational"
        ? detailForState("operational")
        : openMeteoContingency?.available
          ? `A consulta atual falhou; a última previsão válida continua disponível${
              openMeteoContingency.ageMinutes === null
                ? ""
                : ` e foi obtida há ${openMeteoContingency.ageMinutes} min`
            }.`
          : detailForState("offline");

    services.push(
      weatherService(
        "weather-open-meteo",
        "Previsão numérica principal",
        "Open-Meteo",
        openMeteoState,
        openMeteoCheckedAt,
        openMeteoDetail,
      ),
      weatherService(
        "weather-met-norway",
        "Previsão numérica complementar",
        "MET Norway",
        metNorway.status === "live" ? "operational" : "offline",
        metNorway.source.fetchedAt || checkedAt,
        detailForState(metNorway.status === "live" ? "operational" : "offline"),
      ),
    );
  } else {
    const openMeteoState: ServiceState = openMeteoContingency?.available ? "partial" : "offline";
    const openMeteoDetail = openMeteoContingency?.available
      ? `A consulta atual falhou; a última previsão válida continua disponível${
          openMeteoContingency.ageMinutes === null
            ? ""
            : ` e foi obtida há ${openMeteoContingency.ageMinutes} min`
        }.`
      : detailForState("offline");

    services.push(
      weatherService(
        "weather-open-meteo",
        "Previsão numérica principal",
        "Open-Meteo",
        openMeteoState,
        openMeteoContingency?.lastSuccessAt || openMeteoContingency?.fetchedAt || checkedAt,
        openMeteoDetail,
      ),
      weatherService(
        "weather-met-norway",
        "Previsão numérica complementar",
        "MET Norway",
        "offline",
        checkedAt,
      ),
    );
  }

  if (officialResult.status === "fulfilled") {
    const official = officialResult.value;
    const inmetSources = [official.inmet, official.inmetForecast, official.inmetStation];
    const inmetLiveCount = inmetSources.filter((source) => source.status === "live").length;
    const inmetState: ServiceState =
      inmetLiveCount === inmetSources.length
        ? "operational"
        : inmetLiveCount > 0
          ? "partial"
          : "offline";
    services.push(
      weatherService(
        "weather-inmet",
        "Previsão e avisos meteorológicos oficiais",
        "INMET",
        inmetState,
        latestCheckedAt(inmetSources.map((source) => source.source.fetchedAt), checkedAt),
        inmetState === "partial"
          ? `${inmetLiveCount} de ${inmetSources.length} serviços do INMET responderam nesta verificação.`
          : detailForState(inmetState),
      ),
    );

    const cppmetState: ServiceState =
      official.cppmet.status === "live" && official.cppmet.items.length > 0
        ? "operational"
        : official.cppmet.status === "live"
          ? "partial"
          : "offline";
    services.push(
      weatherService(
        "weather-cppmet",
        "Previsão e contexto regional",
        "CPPMet / UFPel",
        cppmetState,
        official.cppmet.source.fetchedAt || checkedAt,
        detailForState(cppmetState),
      ),
    );
  } else {
    services.push(
      weatherService(
        "weather-inmet",
        "Previsão e avisos meteorológicos oficiais",
        "INMET",
        "offline",
        checkedAt,
      ),
      weatherService(
        "weather-cppmet",
        "Previsão e contexto regional",
        "CPPMet / UFPel",
        "offline",
        checkedAt,
      ),
    );
  }

  if (laranjalResult.status === "fulfilled") {
    const state = stateFromHydrology(laranjalResult.value.status);
    services.push({
      id: "laranjal-level",
      name: "Nível da Lagoa dos Patos no Laranjal",
      provider: laranjalResult.value.source.name,
      category: "Hidrologia",
      state,
      detail: detailForState(state),
      checkedAt: laranjalResult.value.source.fetchedAt || checkedAt,
      sourceUrl: laranjalResult.value.source.url,
    });
  } else {
    services.push({
      id: "laranjal-level",
      name: "Nível da Lagoa dos Patos no Laranjal",
      provider: "Fonte local do Laranjal",
      category: "Hidrologia",
      state: "offline",
      detail: detailForState("offline"),
      checkedAt,
    });
  }

  if (guaibaResult.status === "fulfilled") {
    const state = stateFromHydrology(guaibaResult.value.status);
    services.push({
      id: "guaiba-level",
      name: "Nível do Guaíba",
      provider: guaibaResult.value.source.name,
      category: "Hidrologia",
      state,
      detail: detailForState(state),
      checkedAt: guaibaResult.value.source.fetchedAt || checkedAt,
      sourceUrl: guaibaResult.value.source.url,
    });
  } else {
    services.push({
      id: "guaiba-level",
      name: "Nível do Guaíba",
      provider: "Fonte de nível do Guaíba",
      category: "Hidrologia",
      state: "offline",
      detail: detailForState("offline"),
      checkedAt,
    });
  }

  if (lagoonResult.status === "fulfilled") {
    const state = stateFromRegionalHydrology(lagoonResult.value.status);
    services.push({
      id: "lagoon-regional-network",
      name: "Rede regional da Lagoa dos Patos",
      provider: lagoonResult.value.source.organizations,
      category: "Hidrologia",
      state,
      detail:
        state === "operational"
          ? `${lagoonResult.value.available} de ${lagoonResult.value.total} estações com leitura disponível.`
          : detailForState(state),
      checkedAt: lagoonResult.value.source.fetchedAt || checkedAt,
      sourceUrl: lagoonResult.value.source.url,
    });
  } else {
    services.push({
      id: "lagoon-regional-network",
      name: "Rede regional da Lagoa dos Patos",
      provider: "Rede de Monitoramento da Lagoa dos Patos",
      category: "Hidrologia",
      state: "offline",
      detail: detailForState("offline"),
      checkedAt,
      sourceUrl: "https://monitoramentolagoadospatos.com.br/",
    });
  }

  if (defesaCivilResult.status === "fulfilled") {
    const data = defesaCivilResult.value;
    const currentStation = selectDefesaCivilCurrentStation(data.stations);
    const networkState = stateFromDefesaCivil(data.status);
    const state: ServiceState =
      networkState === "operational" && !currentStation ? "partial" : networkState;
    const detail =
      data.status === "live" && currentStation
        ? `Estação usada no Agora: ${currentStation.name} (${currentStation.code}). A rede regional tem ${data.regionalStationCount} estações no recorte do portal e ${data.recentStationCount} leituras recentes.`
        : data.status === "live"
          ? "A rede respondeu, mas nenhuma estação elegível de Pelotas tem leitura recente para compor o Agora."
          : data.status === "disabled"
            ? "A integração está desativada no Tempo Pelotas."
            : detailForState(state);

    services.push(
      weatherService(
        "defesa-civil-rs-hydromet",
        "Observação atual e rede hidrometeorológica",
        "Defesa Civil RS / Casa Militar",
        state,
        currentStation?.observedAt ?? data.source.fetchedAt ?? checkedAt,
        detail,
      ),
    );
    const service = services.at(-1);
    if (service) service.sourceUrl = data.source.mapUrl;
  } else {
    services.push(
      weatherService(
        "defesa-civil-rs-hydromet",
        "Observação atual e rede hidrometeorológica",
        "Defesa Civil RS / Casa Militar",
        "offline",
        checkedAt,
      ),
    );
    const service = services.at(-1);
    if (service) service.sourceUrl = "https://redehidrometeorologica.defesacivil.rs.gov.br/Mapa";
  }

  if (anaRhnResult.status === "fulfilled") {
    const snapshot = anaRhnResult.value;
    services.push({
      id: "ana-rhn",
      name: "Rede Hidrometeorológica Nacional",
      provider: "ANA / SNIRH / RHN",
      category: "Hidrologia",
      state: "implementation",
      detail:
        snapshot.status === "source-live"
          ? `A fonte respondeu para a estação ${snapshot.stationCode}, mas seus dados ainda não são usados nas leituras públicas do Laranjal.`
          : "A fonte ainda não está sendo usada nas leituras públicas do Laranjal.",
      checkedAt: snapshot.fetchedAt || checkedAt,
      sourceUrl: snapshot.source.url,
    });
  } else {
    services.push({
      id: "ana-rhn",
      name: "Rede Hidrometeorológica Nacional",
      provider: "ANA / SNIRH / RHN",
      category: "Hidrologia",
      state: "implementation",
      detail: "A fonte ainda não está sendo usada nas leituras públicas do Laranjal.",
      checkedAt,
      sourceUrl: "https://www.snirh.gov.br/hidroweb/",
    });
  }

  const maintainedServices = applyMaintenanceWindows(
    services,
    await getActiveMaintenanceWindows(new Date(checkedAt)),
  );

  return {
    checkedAt,
    overall: overallState(maintainedServices),
    services: maintainedServices,
  };
}
