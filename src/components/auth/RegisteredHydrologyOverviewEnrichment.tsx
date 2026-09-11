import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import {
  getRegisteredEnrichmentAccess,
  type RegisteredEnrichmentAccess,
} from "@/lib/auth/registered-enrichment.functions";
import type { AnaRhnRegionalInventoryData } from "@/lib/hydrology/ana-rhn-regional.server";
import type { DefesaCivilHydroData } from "@/lib/hydrology/defesa-civil-rs.server";
import type { GuaibaObservationData } from "@/lib/hydrology/guaiba.server";
import type { LagoonMonitoringNetworkData } from "@/lib/hydrology/lagoon-network.server";
import type { LaranjalLevelData } from "@/lib/hydrology/laranjal-level.server";
import type { SaceGuaibaData } from "@/lib/hydrology/sace-guaiba.server";

import "./RegisteredWeatherEnrichment.css";

function finite(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function useRegisteredAccess() {
  const loadAccess = useServerFn(getRegisteredEnrichmentAccess);
  const [access, setAccess] = useState<RegisteredEnrichmentAccess | null>(null);

  useEffect(() => {
    let active = true;
    void loadAccess()
      .then((result) => {
        if (active) setAccess(result);
      })
      .catch(() => {
        if (active) setAccess({ status: "unavailable" });
      });
    return () => {
      active = false;
    };
  }, [loadAccess]);

  return access;
}

function statusAvailable(status: string) {
  return status !== "unavailable" && status !== "disabled";
}

function freshnessLabel(ageMinutes: number | null) {
  if (!finite(ageMinutes)) return "horário não informado";
  if (ageMinutes < 60) return `${Math.round(ageMinutes)} min`;
  return `${(ageMinutes / 60).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} h`;
}

export function RegisteredHydrologyOverviewEnrichment({
  level,
  guaiba,
  lagoon,
  sace,
  defesaCivil,
  anaRhnRegional,
}: {
  level: LaranjalLevelData;
  guaiba: GuaibaObservationData;
  lagoon: LagoonMonitoringNetworkData;
  sace: SaceGuaibaData;
  defesaCivil: DefesaCivilHydroData;
  anaRhnRegional: AnaRhnRegionalInventoryData;
}) {
  const access = useRegisteredAccess();

  const availableLayers = useMemo(
    () =>
      [
        statusAvailable(level.status),
        statusAvailable(guaiba.status),
        statusAvailable(lagoon.status),
        statusAvailable(sace.status),
        statusAvailable(defesaCivil.status),
        statusAvailable(anaRhnRegional.status),
      ].filter(Boolean).length,
    [anaRhnRegional.status, defesaCivil.status, guaiba.status, lagoon.status, level.status, sace.status],
  );

  if (!access || access.status === "unavailable") return null;

  if (access.status === "unauthenticated") {
    return (
      <aside className="registered-enrichment registered-enrichment--teaser" aria-label="Panorama hidrológico gratuito da conta">
        <div>
          <span className="eyebrow">Conta Free</span>
          <strong>O panorama multi-fonte fica ainda mais útil para usuários cadastrados.</strong>
          <p>
            A situação das águas continua pública. A conta Free acrescenta cobertura das fontes, freshness e
            inventário regional sem reduzir tudo a um único número de risco.
          </p>
        </div>
        <Link to="/conta" search={{ erro: undefined, next: "/situacao-hidrologica-pelotas" }}>
          Entrar gratuitamente
        </Link>
      </aside>
    );
  }

  const operatingAna = anaRhnRegional.stations.filter((station) => station.operating === true).length;
  const lagoonLive = lagoon.observations.filter((observation) => observation.status === "live").length;
  const lagoonClassified = lagoon.observations.filter(
    (observation) => observation.risk !== "unclassified" && observation.risk !== "unavailable",
  ).length;

  return (
    <section className="registered-enrichment" aria-labelledby="registered-hydrology-overview">
      <div className="registered-enrichment__heading">
        <div>
          <span className="eyebrow">Leitura avançada · Conta Free</span>
          <h2 id="registered-hydrology-overview">Veja a cobertura da rede antes de interpretar os níveis</h2>
          <p>
            Em vez de fundir réguas diferentes, esta camada mostra quanto do sistema de observação respondeu,
            quais redes estão recentes e onde existe contexto oficial adicional.
          </p>
        </div>
        <span className="registered-enrichment__badge">Free</span>
      </div>

      <div className="registered-enrichment__metrics">
        <article>
          <small>Camadas disponíveis</small>
          <strong>{availableLayers}/6</strong>
          <p>Laranjal, Guaíba, Lagoa regional, SACE, Defesa Civil RS e inventário ANA/RHN.</p>
        </article>
        <article>
          <small>Rede da Lagoa dos Patos</small>
          <strong>{lagoon.available}/{lagoon.total}</strong>
          <p>{lagoonLive} leituras atuais · {lagoonClassified} pontos com referência própria classificável.</p>
        </article>
        <article>
          <small>Defesa Civil RS</small>
          <strong>{defesaCivil.recentStationCount}/{defesaCivil.regionalStationCount}</strong>
          <p>Leituras recentes entre as estações regionais recebidas nesta consulta.</p>
        </article>
        <article>
          <small>ANA / RHN</small>
          <strong>{anaRhnRegional.stations.length} estações</strong>
          <p>{operatingAna} marcadas como operantes em até {anaRhnRegional.searchRadiusKm} km no inventário consultado.</p>
        </article>
      </div>

      <div className="registered-enrichment__trace">
        <article>
          <small>Laranjal</small>
          <strong>{level.status === "live" ? "Leitura atual" : level.status === "stale" ? "Última leitura atrasada" : "Indisponível"}</strong>
          <p>{level.source.name} · {freshnessLabel(level.ageMinutes)} desde a observação quando o horário está disponível.</p>
        </article>
        <article>
          <small>Guaíba</small>
          <strong>{guaiba.status === "live" ? "Leitura atual" : guaiba.status === "stale" ? "Última leitura atrasada" : "Indisponível"}</strong>
          <p>{guaiba.station} · {guaiba.source.name} · {freshnessLabel(guaiba.ageMinutes)} desde a observação.</p>
        </article>
        <article>
          <small>SACE Guaíba</small>
          <strong>{sace.counts.transmitting}/{sace.counts.total} transmitindo</strong>
          <p>{sace.counts.aboveNormal} estação{sace.counts.aboveNormal === 1 ? "" : "ões"} acima de Normal segundo a classificação de cada própria estação.</p>
        </article>
        <article>
          <small>Inventário estadual Defesa Civil</small>
          <strong>{defesaCivil.statewideStationCount} estações</strong>
          <p>Inventário recebido da fonte; quantidade não significa que todas possuam nível de rio ou leitura recente.</p>
        </article>
      </div>

      <div className="registered-enrichment__context">
        <div>
          <strong>O que esta visão permite</strong>
          <ul>
            <li>Identificar rapidamente quando uma rede inteira está parcial ou atrasada.</li>
            <li>Distinguir inventário de estações de medições realmente recentes.</li>
            <li>Perceber quando o contexto regional está mais ou menos completo antes de interpretar um evento.</li>
          </ul>
        </div>
        <div>
          <strong>O que ela não faz</strong>
          <ul>
            <li>Não cria uma cota única para Laranjal, Guaíba, SACE ou Defesa Civil.</li>
            <li>Não transforma ausência de dado em condição normal.</li>
            <li>Não converte automaticamente classificações de outra estação em risco para Pelotas.</li>
          </ul>
        </div>
      </div>

      <p className="registered-enrichment__footnote">
        O login apenas organiza o contexto das fontes já permitidas no portal. Cada estação preserva sua origem, horário, unidade e referência.
      </p>
    </section>
  );
}
