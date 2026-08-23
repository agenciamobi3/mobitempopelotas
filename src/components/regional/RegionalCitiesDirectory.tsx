import { useMemo, useState } from "react";
import { ArrowRight, MapPin, Search } from "lucide-react";

import {
  REGIONAL_CITY_GROUPS,
  regionalCityPath,
  type RegionalCityGroup,
} from "@/lib/regional-cities";
import type {
  RegionalCitiesOverview,
  RegionalCityOverviewItem,
} from "@/lib/weather/regional-cities-overview.types";

import styles from "./RegionalCitiesDirectory.module.css";

type RegionalCitiesDirectoryProps = {
  data: RegionalCitiesOverview;
};

type RegionalFilter = RegionalCityGroup | "Todas";

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "agora";
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function formatTemperatureRange(item: RegionalCityOverviewItem) {
  if (item.minimum === null && item.maximum === null) return "—";
  if (item.minimum === null) return `até ${item.maximum}°`;
  if (item.maximum === null) return `a partir de ${item.minimum}°`;
  return `${item.minimum}° / ${item.maximum}°`;
}

function formatMetric(value: number | null, suffix: string) {
  return value === null ? "—" : `${value}${suffix}`;
}

function statusLabel(item: RegionalCityOverviewItem) {
  if (item.status === "unavailable") return "Resumo indisponível";
  if (item.status === "partial") return "Estimativa parcial";
  return "Estimativa agora";
}

export function RegionalCitiesDirectory({ data }: RegionalCitiesDirectoryProps) {
  const [query, setQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState<RegionalFilter>("Todas");
  const itemBySlug = useMemo(
    () => new Map(data.items.map((item) => [item.city.slug, item])),
    [data.items],
  );
  const groupOptions = useMemo<RegionalFilter[]>(
    () => ["Todas", ...REGIONAL_CITY_GROUPS.map((group) => group.name)],
    [],
  );
  const normalizedQuery = normalizeSearch(query);

  const visibleGroups = useMemo(
    () =>
      REGIONAL_CITY_GROUPS.map((group) => ({
        ...group,
        cities: group.cities.filter((city) => {
          if (activeGroup !== "Todas" && city.group !== activeGroup) return false;
          if (!normalizedQuery) return true;
          return normalizeSearch(`${city.name} ${city.group} ${city.descriptor}`).includes(
            normalizedQuery,
          );
        }),
      })).filter((group) => group.cities.length > 0),
    [activeGroup, normalizedQuery],
  );

  const visibleCount = visibleGroups.reduce((total, group) => total + group.cities.length, 0);
  const availableCount = data.items.filter((item) => item.status !== "unavailable").length;

  return (
    <div className={`${styles.page} regional-cities-directory`}>
      <section className={styles.hero}>
        <span>Tempo Pelotas · Central regional</span>
        <h1>Tempo na Região Sul do RS</h1>
        <p>
          Compare a condição estimada nas cidades atendidas e abra a página local para ver a
          previsão completa, chuva, vento e avisos meteorológicos municipais do INMET. Pelotas
          permanece como núcleo editorial do portal.
        </p>
        <div className={styles.heroStats}>
          <div>
            <strong>{data.items.length}</strong>
            <span>municípios disponíveis</span>
          </div>
          <div>
            <strong>{availableCount}</strong>
            <span>com resumo regional agora</span>
          </div>
          <div>
            <strong>{formatUpdatedAt(data.fetchedAt)}</strong>
            <span>atualização do modelo</span>
          </div>
        </div>
        <small className={styles.heroNote}>
          A condição exibida nesta central é estimativa de modelo do Open-Meteo, não observação de
          estação. Alertas oficiais permanecem nas páginas municipais.
        </small>
      </section>

      <section className={styles.controls} aria-labelledby="regional-search-title">
        <div className={styles.controlsHeading}>
          <div>
            <span>Encontre sua cidade</span>
            <h2 id="regional-search-title">Consulte a região sem percorrer um diretório inteiro</h2>
          </div>
          <strong aria-live="polite">{visibleCount} cidades</strong>
        </div>

        <label className={styles.searchField}>
          <Search aria-hidden="true" />
          <span className={styles.srOnly}>Buscar cidade, região ou característica</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Busque por Pelotas, Bagé, Costa Doce..."
            autoComplete="off"
            aria-controls="regional-city-results"
          />
        </label>

        <div className={styles.filters} role="group" aria-label="Filtrar cidades por região">
          {groupOptions.map((group) => (
            <button
              key={group}
              type="button"
              aria-pressed={activeGroup === group}
              onClick={() => setActiveGroup(group)}
            >
              {group}
            </button>
          ))}
        </div>
      </section>

      <section
        className={styles.directory}
        id="regional-city-results"
        aria-label="Cidades com previsão local"
      >
        {visibleGroups.map((group) => (
          <article key={group.name}>
            <header>
              <MapPin aria-hidden="true" />
              <div>
                <span>Região</span>
                <h2>{group.name}</h2>
              </div>
            </header>
            <div className={styles.cityList}>
              {group.cities.map((city) => {
                const item = itemBySlug.get(city.slug);
                if (!item) return null;

                return (
                  <a className={styles.cityCard} href={regionalCityPath(city)} key={city.slug}>
                    <div className={styles.cityIdentity}>
                      <strong>{city.name}</strong>
                      <small>{city.descriptor}</small>
                    </div>

                    <div className={styles.currentSummary}>
                      <span>{statusLabel(item)}</span>
                      <strong>{item.temperature === null ? "—" : `${item.temperature}°`}</strong>
                      <small>{item.condition}</small>
                    </div>

                    <dl className={styles.metrics}>
                      <div>
                        <dt>Hoje</dt>
                        <dd>{formatTemperatureRange(item)}</dd>
                      </div>
                      <div>
                        <dt>Chuva</dt>
                        <dd>{formatMetric(item.rainChance, "%")}</dd>
                      </div>
                      <div>
                        <dt>Vento</dt>
                        <dd>{formatMetric(item.windSpeed, " km/h")}</dd>
                      </div>
                    </dl>

                    <ArrowRight className={styles.arrow} aria-hidden="true" />
                  </a>
                );
              })}
            </div>
          </article>
        ))}

        {visibleGroups.length === 0 ? (
          <div className={styles.emptyState} role="status">
            <strong>Nenhuma cidade encontrada.</strong>
            <span>Tente outro nome ou selecione “Todas” para voltar ao inventário completo.</span>
          </div>
        ) : null}
      </section>

      {data.message ? (
        <aside className={styles.dataNotice} role="status">
          {data.message}
        </aside>
      ) : null}

      <section className={styles.method}>
        <div>
          <span>Como ler esta central</span>
          <h2>Comparação rápida primeiro; detalhe municipal depois</h2>
          <p>
            A visão regional usa as coordenadas das 24 cidades em uma consulta resumida. Ao abrir
            um município, a página local aprofunda a previsão e consulta os avisos oficiais pelo
            código IBGE correspondente.
          </p>
        </div>
        <ul>
          <li>Resumo regional em uma única consulta meteorológica, com cache.</li>
          <li>Condição atual da central identificada explicitamente como estimativa de modelo.</li>
          <li>Busca por cidade e filtro pelos quatro agrupamentos já atendidos.</li>
          <li>Páginas municipais permanentes para previsão completa e avisos oficiais.</li>
        </ul>
      </section>
    </div>
  );
}
