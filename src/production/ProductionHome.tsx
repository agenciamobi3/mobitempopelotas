import { Await, Link } from "@tanstack/react-router";
import { Suspense, useEffect, useMemo, useState } from "react";

import { HomeExplorePortal } from "@/components/weather/HomeExplorePortal";
import { getWeatherCameras } from "@/lib/cameras/cameras.functions";
import type { WeatherCameraData } from "@/lib/cameras/cameras.types";
import { getGuaibaObservation } from "@/lib/hydrology/guaiba.functions";
import type { GuaibaObservationData } from "@/lib/hydrology/guaiba.server";
import { getLagoonMonitoringNetwork } from "@/lib/hydrology/lagoon-network.functions";
import type { LagoonMonitoringNetworkData } from "@/lib/hydrology/lagoon-network.server";
import { getLaranjalLevelData } from "@/lib/hydrology/laranjal-level.functions";
import type { LaranjalLevelData } from "@/lib/hydrology/laranjal-level.server";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";
import {
  toProductionAlerts,
  toProductionSummaries,
  toProductionWeatherData,
} from "@/production/adapters/home";
import { HomeDataGuide } from "@/production/components/home-data-guide";
import { HomeForecastEditorial } from "@/production/components/home-forecast-editorial";
import { HomeForecastTrend } from "@/production/components/home-forecast-trend";
import { HomeLiveCameraBackground } from "@/production/components/home-live-camera-background";
import { HomeSectionNavigation } from "@/production/components/home-section-navigation";
import { HomeWaterEditorial } from "@/production/components/home-water-editorial";
import { InmetAlertsPanel } from "@/production/components/inmet-alerts-panel";
import { InmetOfficialForecastPanel } from "@/production/components/inmet-official-forecast-panel";
import { SiteFooter } from "@/production/components/site-footer";
import { SiteHeader } from "@/production/components/site-header";
import { WeatherHero } from "@/production/components/weather-hero";
import type { InmetAlertSeverity } from "@/production/lib/inmet-alerts";
import { useOpenMeteoIntelligenceRecovery } from "@/production/lib/open-meteo-browser-recovery";
import type { WeatherData } from "@/production/lib/weather-data";
import { getWeatherAdvisory, type AdvisoryLevel } from "@/production/lib/weather-insights";
import "@/production/styles/home-editorial-status-refinements.css";
import "@/production/styles/home-water-deferred.css";

const CAMERA_DISCOVERY_IDLE_TIMEOUT_MS = 2_000;
const CAMERA_DISCOVERY_FALLBACK_DELAY_MS = 900;
const WEATHER_RECOVERY_GRACE_MS = 12_250;

const advisoryRank: Record<AdvisoryLevel, number> = { normal: 0, attention: 1, warning: 2 };
const officialSeverityRank: Record<InmetAlertSeverity, number> = {
  unknown: 0,
  potential: 1,
  danger: 2,
  "great-danger": 3,
};

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

const unavailableSource = {
  name: "MOBI Tempo Pelotas",
  url: "/status-dos-dados",
  isFallback: true,
  observationName: "Defesa Civil RS — Rede de Monitoramento Hidrometeorológico",
  observationUrl: "https://redehidrometeorologica.defesacivil.rs.gov.br/Mapa",
  forecastName: "Fontes meteorológicas em atualização",
  forecastUrl: "/status-dos-dados",
} satisfies WeatherData["source"];

export type HomeHydrologyData = {
  laranjal: LaranjalLevelData;
  guaiba: GuaibaObservationData;
  lagoon: LagoonMonitoringNetworkData;
};

export type HomeHydrologyResult =
  | ({ status: "ready" } & HomeHydrologyData)
  | { status: "unavailable" };

function getLiveLaranjalCamera(cameraData: WeatherCameraData) {
  const camera = cameraData.cameras.find((item) => item.id === "laranjal");
  if (
    !camera ||
    camera.status !== "online" ||
    camera.broadcastStatus !== "live" ||
    !camera.embedUrl
  ) {
    return null;
  }

  try {
    const embedUrl = new URL(camera.embedUrl);
    if (embedUrl.protocol !== "https:") return null;

    return {
      ...camera,
      embedUrl: embedUrl.toString(),
    };
  } catch {
    return null;
  }
}

function strongestHourlyWindSpeed(weather: WeatherData) {
  return weather.hourly.slice(0, 24).reduce<number | null>((strongest, hour) => {
    if (!Number.isFinite(hour.windSpeed)) return strongest;
    return strongest === null ? hour.windSpeed : Math.max(strongest, hour.windSpeed);
  }, null);
}

function hasUsableWeatherIntelligence(data: WeatherIntelligenceData) {
  return Boolean(
    data.weather.current !== null || data.weather.hourly.length > 0 || data.weather.daily.length > 0,
  );
}

function HomeWaterLoading() {
  return (
    <section className="home-water-deferred" aria-live="polite" aria-busy="true">
      <p className="home-water-deferred__eyebrow">Águas</p>
      <h2>Atualizando níveis e medições...</h2>
      <span className="home-water-deferred__progress" aria-hidden="true" />
    </section>
  );
}

function HomeWaterUnavailable() {
  return (
    <section className="home-water-deferred" aria-live="polite">
      <p className="home-water-deferred__eyebrow">Águas</p>
      <h2>Dados hidrológicos temporariamente indisponíveis</h2>
      <p className="home-water-deferred__message">
        A meteorologia principal continua disponível. Consulte a página de situação hidrológica para
        acompanhar o estado das fontes e tentar novamente.
      </p>
      <Link className="home-water-deferred__link" to="/situacao-hidrologica-pelotas">
        Ver situação hidrológica
      </Link>
    </section>
  );
}

function HomeWaterClientRecovery() {
  const [result, setResult] = useState<HomeHydrologyResult | null>(null);

  useEffect(() => {
    let active = true;

    void Promise.all([
      getLaranjalLevelData(),
      getGuaibaObservation(),
      getLagoonMonitoringNetwork(),
    ])
      .then(([laranjal, guaiba, lagoon]) => {
        if (!active) return;
        setResult({ status: "ready", laranjal, guaiba, lagoon });
      })
      .catch((error) => {
        console.error("Falha ao recuperar hidrologia da Home:", error);
        if (active) setResult({ status: "unavailable" });
      });

    return () => {
      active = false;
    };
  }, []);

  if (!result) return <HomeWaterLoading />;
  if (result.status === "unavailable") return <HomeWaterUnavailable />;

  return (
    <HomeWaterEditorial
      laranjal={result.laranjal}
      guaiba={result.guaiba}
      lagoon={result.lagoon}
    />
  );
}

function DeferredHomeWater({ hydrology }: { hydrology: Promise<HomeHydrologyResult> }) {
  return (
    <Suspense fallback={<HomeWaterLoading />}>
      <Await promise={hydrology}>
        {(result) =>
          result.status === "ready" ? (
            <HomeWaterEditorial
              laranjal={result.laranjal}
              guaiba={result.guaiba}
              lagoon={result.lagoon}
            />
          ) : (
            <HomeWaterClientRecovery />
          )
        }
      </Await>
    </Suspense>
  );
}

export function ProductionHome({
  data,
  hydrology,
}: {
  data: WeatherIntelligenceData;
  hydrology: Promise<HomeHydrologyResult>;
}) {
  const [serverRecoveredData, setServerRecoveredData] = useState(data);

  useEffect(() => {
    let active = true;
    setServerRecoveredData(data);

    if (hasUsableWeatherIntelligence(data)) {
      return () => {
        active = false;
      };
    }

    void getWeatherIntelligence()
      .then((nextData) => {
        if (!active || !hasUsableWeatherIntelligence(nextData)) return;
        setServerRecoveredData(nextData);
      })
      .catch(() => {
        // A recuperação direta do Open-Meteo permanece como contingência no hook abaixo.
      });

    return () => {
      active = false;
    };
  }, [data]);

  const recoveredData = useOpenMeteoIntelligenceRecovery(serverRecoveredData);
  const weather = useMemo(
    () => toProductionWeatherData(recoveredData.weather),
    [recoveredData.weather],
  );
  const [cameraData, setCameraData] = useState<WeatherCameraData | null>(null);

  useEffect(() => {
    let mounted = true;
    const idleWindow = window as IdleWindow;
    let idleHandle: number | null = null;
    let fallbackTimer: number | null = null;

    const discoverCamera = () => {
      idleHandle = null;
      fallbackTimer = null;

      void getWeatherCameras()
        .then((nextCameraData) => {
          if (mounted) setCameraData(nextCameraData);
        })
        .catch(() => {
          // A câmera é um aprimoramento progressivo do hero e nunca deve bloquear
          // ou degradar a leitura meteorológica principal da Home.
        });
    };

    if (idleWindow.requestIdleCallback) {
      idleHandle = idleWindow.requestIdleCallback(discoverCamera, {
        timeout: CAMERA_DISCOVERY_IDLE_TIMEOUT_MS,
      });
    } else {
      fallbackTimer = window.setTimeout(discoverCamera, CAMERA_DISCOVERY_FALLBACK_DELAY_MS);
    }

    return () => {
      mounted = false;
      if (idleHandle !== null) idleWindow.cancelIdleCallback?.(idleHandle);
      if (fallbackTimer !== null) window.clearTimeout(fallbackTimer);
    };
  }, []);

  const liveLaranjalCamera = useMemo(
    () => (cameraData ? getLiveLaranjalCamera(cameraData) : null),
    [cameraData],
  );
  const hasUsableWeather = Boolean(
    weather.current.available || weather.hourly.length > 0 || weather.daily.length > 0,
  );
  const [weatherRecoveryExpired, setWeatherRecoveryExpired] = useState(false);

  useEffect(() => {
    if (hasUsableWeather) {
      setWeatherRecoveryExpired(false);
      return;
    }

    setWeatherRecoveryExpired(false);
    const timeout = window.setTimeout(
      () => setWeatherRecoveryExpired(true),
      WEATHER_RECOVERY_GRACE_MS,
    );
    return () => window.clearTimeout(timeout);
  }, [hasUsableWeather]);

  if (!hasUsableWeather) {
    const recoveryPending = !weatherRecoveryExpired;
    return (
      <div className="site-shell site-shell--home site-shell--home-editorial">
        <SiteHeader advisoryLevel="normal" variant="hero" />
        <main className="home-editorial-main" id="conteudo-principal" tabIndex={-1}>
          <section
            className="status-page production-weather-unavailable"
            aria-labelledby="weather-unavailable-title"
            aria-live="polite"
            aria-busy={recoveryPending}
          >
            <p className="status-kicker">Tempo em Pelotas</p>
            <h1 id="weather-unavailable-title">
              {recoveryPending
                ? "Atualizando dados meteorológicos..."
                : "Dados meteorológicos temporariamente indisponíveis"}
            </h1>
            {recoveryPending ? (
              <>
                <p>Estamos consultando as fontes meteorológicas para montar a leitura atual.</p>
                <p>A página permanece navegável enquanto a atualização acontece.</p>
              </>
            ) : (
              <>
                <p>{recoveredData.weather.message ?? recoveredData.brief.summary}</p>
                <p>O portal continuará consultando automaticamente as fontes meteorológicas.</p>
              </>
            )}
            <p>
              Enquanto a previsão não atualiza, use os atalhos abaixo para consultar águas, câmeras,
              avisos e dados e fontes.
            </p>
          </section>
          <HomeExplorePortal />
          <HomeDataGuide />
        </main>
        <SiteFooter source={unavailableSource} />
      </div>
    );
  }

  const summaries = toProductionSummaries(recoveredData);
  const inmetAlerts = toProductionAlerts(recoveredData.weather);
  const advisory = getWeatherAdvisory(weather);
  const pelotasOfficialAlerts = inmetAlerts.alerts.filter((alert) => alert.relevance === "pelotas");
  const hasPelotasOfficialAlerts = pelotasOfficialAlerts.length > 0;
  const hasHomeInmetAlert = inmetAlerts.status === "live" && inmetAlerts.alerts.length > 0;
  const primaryOfficialSeverity = pelotasOfficialAlerts.reduce<InmetAlertSeverity>(
    (highest, alert) =>
      officialSeverityRank[alert.severity] > officialSeverityRank[highest] ? alert.severity : highest,
    "unknown",
  );

  // A cor oficial do INMET é tratada separadamente do advisory meteorológico local.
  // Somente "Grande perigo" exige o nível genérico warning; amarelo/laranja continuam
  // identificados pela sua própria classe oficial no header e no painel do INMET.
  const officialLevel: AdvisoryLevel =
    primaryOfficialSeverity === "great-danger"
      ? "warning"
      : hasPelotasOfficialAlerts
        ? "attention"
        : "normal";
  const headerLevel =
    advisoryRank[officialLevel] > advisoryRank[advisory.level] ? officialLevel : advisory.level;
  const cppmetToday = recoveredData.weather.officialForecast[0] ?? null;
  const forecastWindSpeedKmh = strongestHourlyWindSpeed(weather);
  const mainClassName = hasPelotasOfficialAlerts
    ? "home-editorial-main has-official-alerts"
    : "home-editorial-main";

  return (
    <div className="site-shell site-shell--home site-shell--home-editorial">
      <SiteHeader
        advisoryLevel={headerLevel}
        officialAlertSeverity={primaryOfficialSeverity}
        variant="hero"
      />
      <div className={`tp-home-hero-shell${liveLaranjalCamera ? " has-live-camera" : ""}`}>
        <WeatherHero
          weather={weather}
          advisoryLevel={headerLevel}
          officialAlertCount={pelotasOfficialAlerts.length}
          officialAlertSeverity={primaryOfficialSeverity}
          cppmetForecast={
            cppmetToday ? { item: cppmetToday, sourceUrl: "https://wp.ufpel.edu.br/cppmet/" } : null
          }
          liveCameraBackground={
            liveLaranjalCamera ? (
              <HomeLiveCameraBackground
                embedUrl={liveLaranjalCamera.embedUrl}
                title={liveLaranjalCamera.streamTitle ?? liveLaranjalCamera.name}
              />
            ) : null
          }
        />
        {liveLaranjalCamera ? (
          <Link
            className="tp-home-hero-source"
            to="/cameras-ao-vivo-pelotas"
            aria-label="Abrir a câmera ao vivo da Praia do Laranjal"
          >
            <span>
              <i aria-hidden="true" /> Câmera do Laranjal ao vivo
            </span>
            <small>Céu e clima em tempo real</small>
          </Link>
        ) : null}
      </div>

      <main className={mainClassName} id="conteudo-principal" tabIndex={-1}>
        {hasHomeInmetAlert ? (
          <div className="tp-home-alert-index-shell">
            <InmetAlertsPanel data={inmetAlerts} variant="home" advisoryLevel={headerLevel} />
            <HomeSectionNavigation />
          </div>
        ) : (
          <HomeSectionNavigation />
        )}
        <HomeForecastEditorial weather={weather} />
        <InmetOfficialForecastPanel
          periods={recoveredData.weather.inmetForecast}
          station={recoveredData.weather.inmetStation}
          forecastWindSpeedKmh={forecastWindSpeedKmh}
        />
        <HomeForecastTrend weather={weather} narrative={summaries.tomorrow} />
        <DeferredHomeWater hydrology={hydrology} />
        <HomeExplorePortal />
        <HomeDataGuide />
      </main>

      <SiteFooter source={weather.source} />
    </div>
  );
}