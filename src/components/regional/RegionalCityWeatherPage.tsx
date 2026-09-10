import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { HomeForecastStory } from "@/components/weather/HomeForecastStory";
import {
  regionalCityEditorialProfile,
  regionalCityMetaDescription,
  regionalCityPageTitle,
} from "@/lib/regional-city-editorial";
import { findHydrologyLocalityByWeatherCitySlug } from "@/lib/hydrology/hydrology-localities";
import {
  isRegionalHomeCity,
  nearestRegionalCities,
  regionalCityPath,
  type RegionalCity,
} from "@/lib/regional-cities";
import {
  createBreadcrumbListJsonLd,
  serializeJsonLd,
} from "@/lib/structured-data";
import {
  hasVerifiedRegionalAlertSemantics,
  regionalAlertPeriod,
  selectPriorityRegionalAlert,
} from "@/lib/weather/regional-alert-priority";
import type { RegionalCityWeatherData } from "@/lib/weather/regional-city-weather.types";
import { RegionalCityDefesaCivil } from "./RegionalCityDefesaCivil";
import { RegionalCityHero } from "./RegionalCityHero";
import { RegionalCityHydrologyLink } from "./RegionalCityHydrologyLink";
import { toRegionalForecastStory } from "./regional-city-forecast-story";
import { formatRegionalDateTime } from "./regional-time-format";

import "./RegionalCityPerformance.css";
import styles from "./RegionalCityWeatherPage.module.css";
import "./RegionalCityIdentity.css";
import "./RegionalCityAccentContract.css";
import "./RegionalCityAlertLayout.css";
import "./RegionalCityVisualRefresh.css";

function distanceLabel(distanceKm: number) {
  return `${Math.round(distanceKm)} km em linha reta`;
}

function CityLink({ city, distanceKm }: { city: RegionalCity; distanceKm: number }) {
  const content = (
    <>
      <span>{city.name}</span>
      <small>
        {city.descriptor} · {distanceLabel(distanceKm)}
      </small>
      <ArrowRight aria-hidden="true" />
    </>
  );

  if (isRegionalHomeCity(city)) return <Link to="/">{content}</Link>;
  return (
    <Link to="/tempo-em/$citySlug" params={{ citySlug: city.slug }}>
      {content}
    </Link>
  );
}

function RegionalOfficialAlertPanel({ data }: { data: RegionalCityWeatherData }) {
  const alert = selectPriorityRegionalAlert(data.alerts.items);
  const verified = alert ? hasVerifiedRegionalAlertSemantics(alert) : false;
  const period = alert ? regionalAlertPeriod(alert) : null;
  const severityClass = alert && verified ? `severity-${alert.severity}` : "advisory-normal";
  const statusLabel = alert
    ? verified
      ? alert.severityLabel
      : "Classificação no INMET"
    : data.alerts.status === "unavailable"
      ? "Consulta indisponível"
      : "Sem aviso ativo";
  const title = alert
    ? alert.event
    : data.alerts.status === "unavailable"
      ? "Avisos do INMET indisponíveis nesta consulta"
      : `Sem aviso ativo para ${data.city.name}`;
  const validity = alert
    ? verified
      ? `${formatRegionalDateTime(alert.startsAt)} até ${formatRegionalDateTime(alert.expiresAt)}`
      : "Consulte início e término no aviso oficial"
    : data.alerts.status === "unavailable"
      ? "Confirme a situação nos canais oficiais"
      : `Consulta atualizada em ${formatRegionalDateTime(data.source.fetchedAt)}`;
  const officialUrl = alert?.officialUrl ?? data.alerts.sourceUrl;

  return (
    <section
      id="avisos-municipais"
      className={`regional-city-official-alert regional-city-alert-bar ${severityClass}${verified ? " is-officially-classified" : " is-unverified"}`}
      data-alert-active={alert ? "true" : "false"}
      data-alert-period={period ?? "none"}
      data-alert-severity={alert?.severity ?? "unknown"}
      data-alert-official-semantics={verified ? "verified" : "unverified"}
      aria-labelledby="regional-inmet-title"
    >
      <div className="regional-city-alert-bar__mark" aria-hidden="true">
        <small>INMET</small>
        <strong>{alert ? "!" : "✓"}</strong>
      </div>

      <div className="regional-city-alert-bar__content">
        <div className="regional-city-alert-bar__topline">
          <span>Aviso oficial</span>
          <b>{statusLabel}</b>
        </div>
        <div className="regional-city-alert-bar__summary">
          <h2 id="regional-inmet-title">{title}</h2>
          <p>
            {alert ? (
              <>
                Município de {data.city.name} <span aria-hidden="true">·</span> {validity}
              </>
            ) : (
              validity
            )}
          </p>
        </div>
      </div>

      <a
        className="regional-city-alert-bar__action"
        href={officialUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Consultar o INMET para ${data.city.name} em nova aba`}
      >
        Ver no INMET <span aria-hidden="true">→</span>
      </a>
    </section>
  );
}

export function RegionalCityWeatherPage({ data }: { data: RegionalCityWeatherData }) {
  const city = data.city;
  const editorial = regionalCityEditorialProfile(city);
  const related = nearestRegionalCities(city, 5);
  const title = regionalCityPageTitle(city);
  const description = regionalCityMetaDescription(city);
  const path = regionalCityPath(city);
  const forecastStory = toRegionalForecastStory(data);
  const hydrologyLocality = findHydrologyLocalityByWeatherCitySlug(city.slug);
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: `https://tempopelotas.com.br${path}`,
    dateModified: data.source.fetchedAt,
    about: {
      "@type": "Place",
      name: `${city.name}, Rio Grande do Sul`,
      geo: {
        "@type": "GeoCoordinates",
        latitude: city.latitude,
        longitude: city.longitude,
      },
    },
    isPartOf: {
      "@type": "WebSite",
      name: "Tempo Pelotas",
      url: "https://tempopelotas.com.br",
    },
  };
  const breadcrumbs = createBreadcrumbListJsonLd([
    { name: "Tempo Pelotas", path: "/" },
    { name: "Tempo na Região Sul", path: "/tempo-na-regiao-sul-rs" },
    { name: `Tempo em ${city.name}`, path },
  ]);
  const contextFacts = editorial?.facts ?? [
    "A condição atual e a previsão horária usam as coordenadas cadastradas para o município.",
    "Chuva, temperatura e vento podem variar entre bairros, zona rural, litoral e áreas mais elevadas.",
    "A tendência de vários dias serve para planejamento e deve ser conferida novamente conforme a data se aproxima.",
    "Em situação de risco, os avisos da Defesa Civil e do INMET têm prioridade sobre a previsão do modelo.",
  ];

  return (
    <div className={`${styles.page} regional-city-page`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbs) }}
      />

      <RegionalCityHero data={data} />
      <RegionalOfficialAlertPanel data={data} />

      <div className="internal-forecast-widget regional-city-shared-forecast">
        <HomeForecastStory
          data={forecastStory}
          context="regional-page"
          locationName={city.name}
          showLinks={false}
        />
      </div>

      <RegionalCityDefesaCivil citySlug={city.slug} cityName={city.name} />
      {hydrologyLocality ? <RegionalCityHydrologyLink citySlug={city.slug} /> : null}

      <section
        id="como-interpretar-previsao-regional"
        className={`${styles.context} regional-city-context`}
      >
        <div>
          <span className={styles.eyebrow}>Contexto local</span>
          <h2>O que vale observar em {city.name}</h2>
          <p>
            {editorial?.introduction ??
              `A previsão usa as coordenadas centrais de ${city.name}, ${city.descriptor}. Dentro do município, chuva, vento, nevoeiro e temperatura podem variar de um ponto para outro.`}
          </p>
        </div>
        <ul>
          {contextFacts.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      </section>

      <section
        id="cidades-proximas"
        className={`${styles.related} regional-city-related`}
        aria-labelledby="related-cities-title"
      >
        <header>
          <div>
            <span className={styles.eyebrow}>Na região</span>
            <h2 id="related-cities-title">Tempo nas cidades perto de {city.name}</h2>
          </div>
          <Link to="/tempo-na-regiao-sul-rs">
            Ver mapa regional <ArrowRight aria-hidden="true" />
          </Link>
        </header>
        <div>
          {related.map((item) => (
            <CityLink city={item.city} distanceKm={item.distanceKm} key={item.city.slug} />
          ))}
        </div>
      </section>

      <footer className={`${styles.sources} regional-city-sources`}>
        <span>Dados e atualização</span>
        <p>
          A previsão meteorológica usa o Open-Meteo nas coordenadas cadastradas de {city.name}. Os
          avisos municipais são consultados separadamente no INMET. {hydrologyLocality
            ? "O módulo Águas usa fontes hidrológicas próprias e não altera a previsão meteorológica. "
            : ""}
          Atualizado em {formatRegionalDateTime(data.source.fetchedAt)}. Tempo Pelotas.
        </p>
      </footer>
    </div>
  );
}
