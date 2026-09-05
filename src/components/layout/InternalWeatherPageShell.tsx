import type { ReactNode } from "react";

import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";
import { toProductionAlerts, toProductionWeatherData } from "@/production/adapters/home";
import {
  hasVerifiedInmetAlertSemantics,
  InmetAlertsPanel,
} from "@/production/components/inmet-alerts-panel";
import { SiteFooter } from "@/production/components/site-footer";
import { SiteHeader } from "@/production/components/site-header";
import type { InmetAlertSeverity } from "@/production/lib/inmet-alerts";
import { useWeatherIntelligenceBrowserRecovery } from "@/production/lib/weather-intelligence-browser-recovery";
import type { WeatherData } from "@/production/lib/weather-data";
import { getWeatherAdvisory, type AdvisoryLevel } from "@/production/lib/weather-insights";

import "./InternalWeatherPageShell.css";

const advisoryRank: Record<AdvisoryLevel, number> = {
  normal: 0,
  attention: 1,
  warning: 2,
};

const officialSeverityRank: Record<InmetAlertSeverity, number> = {
  unknown: 0,
  potential: 1,
  danger: 2,
  "great-danger": 3,
};

export type InternalWeatherShellContext = {
  data: WeatherIntelligenceData;
  weather: WeatherData;
  advisoryLevel: AdvisoryLevel;
  officialAlertCount: number;
};

type InternalWeatherPageShellProps = {
  data: WeatherIntelligenceData;
  children: ReactNode | ((data: WeatherIntelligenceData) => ReactNode);
  hero?: (context: InternalWeatherShellContext) => ReactNode;
  showOfficialAlerts?: boolean;
  pageClassName?: string;
  recoverWeatherAfterHydration?: boolean;
};

type ResolvedInternalWeatherPageShellProps = InternalWeatherPageShellProps & {
  resolvedData: WeatherIntelligenceData;
};

export function InternalWeatherPageShell(props: InternalWeatherPageShellProps) {
  if (props.recoverWeatherAfterHydration === false) {
    return <ResolvedInternalWeatherPageShell {...props} resolvedData={props.data} />;
  }

  return <RecoveringInternalWeatherPageShell {...props} />;
}

function RecoveringInternalWeatherPageShell(props: InternalWeatherPageShellProps) {
  const recoveredData = useWeatherIntelligenceBrowserRecovery(props.data);
  return <ResolvedInternalWeatherPageShell {...props} resolvedData={recoveredData} />;
}

function ResolvedInternalWeatherPageShell({
  children,
  hero,
  showOfficialAlerts = true,
  pageClassName = "",
  resolvedData,
}: ResolvedInternalWeatherPageShellProps) {
  const productionWeather = toProductionWeatherData(resolvedData.weather);
  const inmetAlerts = toProductionAlerts(resolvedData.weather);
  const advisory = getWeatherAdvisory(productionWeather);
  const pelotasOfficialAlerts = inmetAlerts.alerts.filter(
    (alert) => alert.relevance === "pelotas",
  );
  const verifiedPelotasAlerts = pelotasOfficialAlerts.filter(hasVerifiedInmetAlertSemantics);
  const primaryOfficialSeverity = verifiedPelotasAlerts.reduce<InmetAlertSeverity>(
    (highest, alert) =>
      officialSeverityRank[alert.severity] > officialSeverityRank[highest]
        ? alert.severity
        : highest,
    "unknown",
  );
  const officialLevel: AdvisoryLevel = verifiedPelotasAlerts.some(
    (alert) => alert.severity === "danger" || alert.severity === "great-danger",
  )
    ? "warning"
    : verifiedPelotasAlerts.some((alert) => alert.severity === "potential")
      ? "attention"
      : "normal";
  const advisoryLevel =
    advisoryRank[officialLevel] > advisoryRank[advisory.level]
      ? officialLevel
      : advisory.level;
  const hasOfficialAlerts = pelotasOfficialAlerts.length > 0;
  const mainClassName = [
    "home-editorial-main",
    "today-v5-home-main",
    "internal-weather-main",
    hasOfficialAlerts ? "has-official-alerts" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const shellClassName = [
    "site-shell",
    "site-shell--home",
    "site-shell--home-editorial",
    "today-v5-home-shell",
    "internal-weather-shell",
    pageClassName,
  ]
    .filter(Boolean)
    .join(" ");
  const shellContext: InternalWeatherShellContext = {
    data: resolvedData,
    weather: productionWeather,
    advisoryLevel,
    officialAlertCount: pelotasOfficialAlerts.length,
  };
  const renderedChildren =
    typeof children === "function" ? children(resolvedData) : children;

  return (
    <div className={shellClassName} data-internal-weather-style="home-editorial">
      <SiteHeader
        advisoryLevel={advisoryLevel}
        officialAlertSeverity={primaryOfficialSeverity}
        variant="hero"
      />
      {hero ? <div className="internal-weather-hero-frame">{hero(shellContext)}</div> : null}

      <main className={mainClassName} id="conteudo-principal" tabIndex={-1}>
        {showOfficialAlerts ? (
          <InmetAlertsPanel
            data={inmetAlerts}
            variant="home"
            advisoryLevel={advisoryLevel}
          />
        ) : null}
        {renderedChildren}
      </main>

      <SiteFooter source={productionWeather.source} />
    </div>
  );
}
