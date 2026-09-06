import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { InternalPageChapters } from "@/components/weather/InternalWeatherWidgets";
import { HomeForecastStory } from "@/components/weather/HomeForecastStory";
import {
  regionalCityEditorialProfile,
  regionalCityMetaDescription,
  regionalCityPageTitle,
} from "@/lib/regional-city-editorial";
import {
  isRegionalHomeCity,
  nearestRegionalCities,
  regionalCityPath,
  type RegionalCity,
} from "@/lib/regional-cities";
import { findHydrologyLocalityByWeatherCitySlug } from "@/lib/hydrology/hydrology-localities";
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

const regionalSections = [
  { href: "#avisos-municipais", label: "Avisos", detail: "INMET e orientações oficiais" },
  { href: "#previsao-hoje", label: "Próximas horas", detail: "Temperatura, chuva e vento" },
  { href: "#tendencia", label: "Próximos dias", detail: "Tendência diária do município" },
  { href: "#como-interpretar-previsao-regional", label: "Entenda os dados", detail: "Limites e origem da previsão" },
  { href: "#cidades-proximas", label: "Cidades próximas", detail: "Previsão para a região" },
];

function distanceLabel(distanceKm: number) { return `${Math.round(distanceKm)} km em linha reta`; }

function CityLink({ city, distanceKm }: { city: RegionalCity; distanceKm: number }) {
  const content = <><span>{city.name}</span><small>{city.descriptor} · {distanceLabel(distanceKm)}</small><ArrowRight aria-hidden="true" /></>;
  if (isRegionalHomeCity(city)) return <Link to="/">{content}</Link>;
  return <Link to="/tempo-em/$citySlug" params={{ citySlug: city.slug }}>{content}</Link>;
}

function RegionalOfficialAlertPanel({ data }: { data: RegionalCityWeatherData }) {
  const alert = selectPriorityRegionalAlert(data.alerts.items);
  const verified = alert ? hasVerifiedRegionalAlertSemantics(alert) : false;
  const period = alert ? regionalAlertPeriod(alert) : null;
  const severityClass = alert && verified ? `severity-${alert.severity}` : "advisory-normal";
  const statusLabel = alert ? (verified ? alert.severityLabel : "Classificação em validação") : data.alerts.status === "unavailable" ? "Consulta indisponível" : "Atualizado";
  const title = alert ? `Aviso meteorológico: ${alert.event}` : data.alerts.status === "unavailable" ? "Não foi possível consultar os avisos municipais agora" : `Nenhum aviso municipal ativo encontrado para ${data.city.name}`;
  const validity = alert ? (verified ? `${formatRegionalDateTime(alert.startsAt)} até ${formatRegionalDateTime(alert.expiresAt)}` : "Período completo ainda não reconhecido; confirme no aviso original") : data.alerts.status === "unavailable" ? "A situação deve ser confirmada nos canais oficiais" : `Consulta atualizada em ${formatRegionalDateTime(data.source.fetchedAt)}`;
  const officialUrl = alert?.officialUrl ?? data.alerts.sourceUrl;

  return <section id="avisos-municipais" className={`home-inmet-alerts ${severityClass}${verified ? " is-officially-classified" : " is-unverified"} regional-city-official-alert`} data-alert-period={period ?? "none"} data-alert-severity={alert?.severity ?? "unknown"} data-alert-official-semantics={verified ? "verified" : "unverified"} aria-labelledby="regional-inmet-title">
    <div className="home-inmet-alerts__main"><div className="home-inmet-alerts__mark" aria-hidden="true"><small>INMET</small><strong>{alert ? "!" : "✓"}</strong></div><div className="home-inmet-alerts__copy"><div className="home-inmet-alerts__topline"><span>Aviso oficial do INMET</span><b>{statusLabel}</b></div><h2 id="regional-inmet-title">{title}</h2><div className="home-inmet-alerts__meta"><span><small>Abrangência</small><strong>Município de {data.city.name}</strong></span><span><small>Validade</small><strong>{validity}</strong></span></div></div></div>
    <div className="home-inmet-alerts__aside"><strong>Áreas e orientações oficiais</strong><small>{alert ? `Aviso com abrangência informada para ${data.city.name}` : "A consulta automática é atualizada periodicamente"}</small><a href={officialUrl} target="_blank" rel="noopener noreferrer" aria-label={`Consultar o aviso oficial do INMET para ${data.city.name} em nova aba`}>Consultar avisos <span aria-hidden="true">→</span></a></div>
  </section>;
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
  const pageSections = hydrologyLocality
    ? [
        ...regionalSections.slice(0, 3),
        { href: "#aguas", label: "Águas", detail: "Nível local da Lagoa dos Patos" },
        ...regionalSections.slice(3),
      ]
    : regionalSections;
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: `https://tempopelotas.com.br${path}`,
    dateModified: data.source.fetchedAt,
    about: { "@type": "Place", name: `${city.name}, Rio Grande do Sul`, geo: { "@type": "GeoCoordinates", latitude: city.latitude, longitude: city.longitude } },
    isPartOf: { "@type": "WebSite", name: "Tempo Pelotas", url: "https://tempopelotas.com.br" },
  };
  const breadcrumbs = createBreadcrumbListJsonLd([
    { name: "Tempo Pelotas", path: "/" },
    { name: "Tempo na Região Sul", path: "/tempo-na-regiao-sul-rs" },
    { name: `Tempo em ${city.name}`, path },
  ]);
  const contextFacts = editorial?.facts ?? [
    "Agora: estimativa horária do modelo para as coordenadas municipais.",
    "Previsão: tendência produzida por modelo numérico para o município.",
    "Aviso oficial: comunicado emitido pelo INMET para o código municipal.",
    "Emergência: siga Defesa Civil, INMET e autoridades locais.",
  ];

  return <div className={`${styles.page} regional-city-page`}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbs) }} />
    <RegionalCityHero data={data} />
    <RegionalOfficialAlertPanel data={data} />
    <InternalPageChapters items={pageSections} label={`Navegação da previsão para ${city.name}`} />
    <div className="internal-forecast-widget regional-city-shared-forecast"><HomeForecastStory data={forecastStory} context="regional-page" locationName={city.name} showLinks={false} /></div>
    <RegionalCityDefesaCivil citySlug={city.slug} cityName={city.name} />
    {hydrologyLocality ? <RegionalCityHydrologyLink citySlug={city.slug} /> : null}
    <section id="como-interpretar-previsao-regional" className={`${styles.context} regional-city-context`}><div><span className={styles.eyebrow}>{editorial ? "Previsão local" : "Leitura local"}</span><h2>{editorial?.sectionTitle ?? `Como interpretar o tempo em ${city.name}`}</h2><p>{editorial?.introduction ?? `A previsão representa a grade meteorológica correspondente às coordenadas centrais de ${city.name}, ${city.descriptor}. Bairros, áreas rurais, litoral, serras e baixadas podem registrar condições diferentes, principalmente em chuva localizada, vento, nevoeiro e temperatura mínima.`}</p></div><ul>{contextFacts.map((fact) => <li key={fact}>{fact}</li>)}</ul></section>
    <section id="cidades-proximas" className={`${styles.related} regional-city-related`} aria-labelledby="related-cities-title"><header><div><span className={styles.eyebrow}>Proximidade geográfica</span><h2 id="related-cities-title">Consulte cidades próximas</h2></div><Link to="/tempo-na-regiao-sul-rs">Ver todas as cidades <ArrowRight aria-hidden="true" /></Link></header><div>{related.map((item) => <CityLink city={item.city} distanceKm={item.distanceKm} key={item.city.slug} />)}</div></section>
    <footer className={`${styles.sources} regional-city-sources`}><span>Fontes</span><p>Previsão por coordenadas: Open-Meteo. Avisos municipais: Instituto Nacional de Meteorologia. {hydrologyLocality ? "O módulo Águas consulta separadamente a Rede de Monitoramento do Nível da Lagoa dos Patos, sem alterar a previsão meteorológica." : ""} Distâncias entre cidades calculadas em linha reta a partir das coordenadas cadastradas. Atualizado em {formatRegionalDateTime(data.source.fetchedAt)}. Apresentação: Tempo Pelotas.</p></footer>
  </div>;
}
