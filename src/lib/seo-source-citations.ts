import { absoluteUrl } from "./site-config";

export const SEO_SOURCE_URLS = {
  methodology: absoluteUrl("/metodologia"),
  openMeteo: "https://open-meteo.com/",
  embrapa: "https://agromet.cpact.embrapa.br/online/Current_Monitor.htm",
  inmet: "https://portal.inmet.gov.br/",
  inmetAlerts: "https://avisos.inmet.gov.br/",
  cppmet: "https://wp.ufpel.edu.br/cppmet/",
} as const;

export const CORE_WEATHER_CITATIONS = [
  SEO_SOURCE_URLS.methodology,
  SEO_SOURCE_URLS.openMeteo,
  SEO_SOURCE_URLS.embrapa,
  SEO_SOURCE_URLS.inmet,
  SEO_SOURCE_URLS.cppmet,
] as const;

export const RAIN_CITATIONS = [
  SEO_SOURCE_URLS.methodology,
  SEO_SOURCE_URLS.embrapa,
  SEO_SOURCE_URLS.openMeteo,
  SEO_SOURCE_URLS.inmetAlerts,
] as const;

export const WIND_CITATIONS = [
  SEO_SOURCE_URLS.methodology,
  SEO_SOURCE_URLS.embrapa,
  SEO_SOURCE_URLS.openMeteo,
  SEO_SOURCE_URLS.inmetAlerts,
] as const;
