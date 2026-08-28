import { fetchDefesaCivilHydroData } from "@/lib/hydrology/defesa-civil-rs.server";
import { getGuaibaObservation } from "@/lib/hydrology/guaiba.functions";
import { getLagoonMonitoringNetwork } from "@/lib/hydrology/lagoon-network.functions";
import { getLaranjalLevelData } from "@/lib/hydrology/laranjal-level.functions";
import { getRedemetOverview } from "@/lib/redemet/redemet.functions";
import { getEmbrapaHealthSnapshotServer } from "@/lib/weather/embrapa-health.server";
import { fetchOfficialWeatherSources } from "@/lib/weather/official-sources.server";
import { fetchPelotasWeather } from "@/lib/weather/weather-baseline.server";

import { getActiveMaintenanceWindows } from "./data-status-storage.server";
import type {
  DataStatusOverview,
  ServiceCategory,
  ServiceState,
  ServiceStatus,
} from "./data-status.types";

export function detailForState(state: ServiceState) {
  if (state === "operational") return "A fonte respondeu normalmente na última verificação.";
  if (state === "partial") {
    return "A fonte respondeu, mas há atraso ou parte das informações não está atualizada.";
  }
  if (state === "maintenance") return "Serviço em manutenção programada pelo Tempo Pelotas.";
  if (state === "implementation") {
    return "Acesso concedido; integração pública ainda em implantação e validação.";
  }
  return "Não foi possível obter dados desta fonte na última verificação.";
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

function stateFromLayer(configured: boolean, available: boolean): ServiceState {
  return configured && available ? "operational" : "offline";
}

function stateFromEmbrapaHealth(
  health: Awaited<ReturnType<typeof getEmbrapaHealthSnapshotServer>>,
): ServiceState {
  if (!health.collector.enabled || health.level === "unavailable" || health.data.status === "unavailable") {
    return "offline";
  }
  if (
    health.level === "degraded" ||
    health.level === "critical" ||
    health.data.status === "partial"
  ) {
    return "partial";
  }
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

function unavailableWeatherServices(checkedAt: string): ServiceStatus[] {
  return [
    weatherService(
      "weather-embrapa",
      "Observação meteorológica local",
      "Embrapa Clima Temperado",
      "offline",
      checkedAt,
    ),
    weatherService(
      "weather-inmet",
      "Avisos meteorológicos oficiais",
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
    weatherService(
      "weather-open-meteo",
      "Previsão numérica principal",
      "Open-Meteo",
      "offline",
      checkedAt,
    ),
    weatherService(
      "weather-met-norway",
      "Previsão numérica complementar",
      "MET Norway",
      "offline",
      checkedAt,
    ),
  ];
}

function unavailableRedemetServices(checkedAt: string): ServiceStatus[] {
  return [
    ["redemet-radar", "Radar meteorológico", "REDEMET / DECEA"],
    ["redemet-satellite", "Imagem de satélite", "REDEMET / DECEA"],
    ["redemet-stsc", "Ocorrências de trovoadas — STSC", "REDEMET / DECEA"],
    ["inmet-satellite", "Satélite meteorológico complementar", "INMET"],
  ].map(([id, name, provider]) => ({
    id,
    name,
    provider,
    category: "Radar e satélite" as ServiceCategory,
    state: "offline" as ServiceState,
    detail: detailForState("offline"),
    checkedAt,
  }));
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
    officialResult,
    embrapaHealthResult,
    redemetResult,
    laranjalResult,
    guaibaResult,
    lagoonResult,
    defesaCivilResult,
  ] = await Promise.allSettled([
    fetchPelotasWeather(),
    fetchOfficialWeatherSources(),
    getEmbrapaHealthSnapshotServer(),
    getRedemetOverview(),
    getLaranjalLevelData(),
    getGuaibaObservation(),
    getLagoonMonitoringNetwork(),
    fetchDefesaCivilHydroData(),
  ]);

  const services: ServiceStatus[] = [];

  if (baselineResult.status === "fulfilled") {
    const openMeteo = baselineResult.value.providers["open-meteo"];
    const metNorway = baselineResult.value.providers["met-norway"];

    services.push(
      weatherService(
        "weather-open-meteo",
        "Previsão numérica principal",
        "Open-Meteo",
        openMeteo.status === "live" ? "operational" : "offline",
        openMeteo.source.fetchedAt || checkedAt,
        openMeteo.message || detailForState(openMeteo.status === "live" ? "operational" : "offline"),
      ),
      weatherService(
        "weather-met-norway",
        "Previsão numérica complementar",
        "MET Norway",
        metNorway.status === "live" ? "operational" : "offline",
        metNorway.source.fetchedAt || checkedAt,
        metNorway.message || detailForState(metNorway.status === "live" ? "operational" : "offline"),
      ),
    );
  } else {
    services.push(
      weatherService(
        "weather-open-meteo",
        "Previsão numérica principal",
        "Open-Meteo",
        "offline",
        checkedAt,
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

  if (embrapaHealthResult.status === "fulfilled") {
    const health = embrapaHealthResult.value;
    const state = stateFromEmbrapaHealth(health);
    const checked = latestCheckedAt(
      [health.data.fetchedAt, health.collector.lastSuccessAt, health.collector.lastAttemptAt, health.generatedAt],
      checkedAt,
    );
    const detail =
      state === "operational"
        ? "O centralizador da Embrapa possui leitura recente e coleta saudável."
        : state === "partial"
          ? `O centralizador possui dados, mas a saúde da coleta está ${health.level}.`
          : "O centralizador da Embrapa não possui leitura operacional utilizável nesta verificação.";
    services.push(
      weatherService(
        "weather-embrapa",
        "Observação meteorológica local",
        "Embrapa Clima Temperado",
        state,
        checked,
        detail,
      ),
    );
  } else {
    services.push(
      weatherService(
        "weather-embrapa",
        "Observação meteorológica local",
        "Embrapa Clima Temperado",
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
        "Avisos meteorológicos oficiais",
        "INMET",
        inmetState,
        latestCheckedAt(inmetSources.map((source) => source.source.fetchedAt), checkedAt),
        inmetState === "partial"
          ? `${inmetLiveCount} de ${inmetSources.length} integrações meteorológicas do INMET responderam nesta verificação.`
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
        official.cppmet.error || detailForState(cppmetState),
      ),
    );
  } else {
    services.push(
      weatherService(
        "weather-inmet",
        "Avisos meteorológicos oficiais",
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

  if (redemetResult.status === "fulfilled") {
    const layers = [
      {
        id: "redemet-radar",
        name: "Radar meteorológico",
        provider: redemetResult.value.radar.provider,
        layer: redemetResult.value.radar,
      },
      {
        id: "redemet-satellite",
        name: "Imagem de satélite",
        provider: redemetResult.value.satellite.provider,
        layer: redemetResult.value.satellite,
      },
      {
        id: "redemet-stsc",
        name: "Ocorrências de trovoadas — STSC",
        provider: redemetResult.value.storms.provider,
        layer: redemetResult.value.storms,
      },
      {
        id: "inmet-satellite",
        name: "Satélite meteorológico complementar",
        provider: redemetResult.value.inmetSatellite.provider,
        layer: redemetResult.value.inmetSatellite,
      },
    ];

    for (const item of layers) {
      const state = stateFromLayer(item.layer.configured, item.layer.available);
      services.push({
        id: item.id,
        name: item.name,
        provider: item.provider,
        category: "Radar e satélite",
        state,
        detail: detailForState(state),
        checkedAt: item.layer.updatedAt || checkedAt,
        sourceUrl: "officialUrl" in item.layer ? item.layer.officialUrl : undefined,
      });
    }
  } else {
    services.push(...unavailableRedemetServices(checkedAt));
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
      provider: "LabHidroSens / UFPel",
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
      provider: "MetSul / TideSat Global",
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
          : lagoonResult.value.error || detailForState(state),
      checkedAt: lagoonResult.value.source.fetchedAt || checkedAt,
      sourceUrl: lagoonResult.value.source.url,
    });
  } else {
    services.push({
      id: "lagoon-regional-network",
      name: "Rede regional da Lagoa dos Patos",
      provider: "FURG & Portos RS",
      category: "Hidrologia",
      state: "offline",
      detail: detailForState("offline"),
      checkedAt,
      sourceUrl: "https://monitoramentolagoadospatos.com.br/",
    });
  }

  if (defesaCivilResult.status === "fulfilled") {
    const data = defesaCivilResult.value;
    const state = stateFromDefesaCivil(data.status);
    const detail =
      data.status === "live"
        ? `${data.regionalStationCount} estações no recorte regional; ${data.recentStationCount} com leitura recente. Inventário: ${data.inventory.HYDROLOGY} hidrológicas, ${data.inventory.METEOROLOGY} meteorológicas e ${data.inventory.BOTH} mistas.`
        : data.status === "disabled"
          ? "Integração desabilitada explicitamente pelo kill switch operacional do Tempo Pelotas."
          : data.error || detailForState(state);

    services.push({
      id: "defesa-civil-rs-hydromet",
      name: "Rede de Monitoramento Hidrometeorológico",
      provider: "Defesa Civil RS / Casa Militar",
      category: "Hidrologia",
      state,
      detail,
      checkedAt: data.source.fetchedAt || checkedAt,
      sourceUrl: data.source.mapUrl,
    });
  } else {
    services.push({
      id: "defesa-civil-rs-hydromet",
      name: "Rede de Monitoramento Hidrometeorológico",
      provider: "Defesa Civil RS / Casa Militar",
      category: "Hidrologia",
      state: "offline",
      detail: detailForState("offline"),
      checkedAt,
      sourceUrl: "https://redehidrometeorologica.defesacivil.rs.gov.br/Mapa",
    });
  }

  services.push({
    id: "ana-rhn",
    name: "Rede Hidrometeorológica Nacional",
    provider: "ANA / SNIRH / RHN",
    category: "Hidrologia",
    state: "implementation",
    detail: detailForState("implementation"),
    checkedAt,
    sourceUrl: "https://www.snirh.gov.br/hidroweb/",
  });

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
