import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import {
  getRegisteredEnrichmentAccess,
  type RegisteredEnrichmentAccess,
} from "@/lib/auth/registered-enrichment.functions";
import type { GuaibaObservationData } from "@/lib/hydrology/guaiba.server";
import type { LaranjalLevelData } from "@/lib/hydrology/laranjal-level.server";

import "./RegisteredWeatherEnrichment.css";

type Props =
  | {
      variant: "laranjal";
      data: LaranjalLevelData;
      pagePath: "/nivel-da-lagoa-dos-patos-laranjal";
    }
  | {
      variant: "guaiba";
      data: GuaibaObservationData;
      pagePath: "/nivel-do-guaiba";
    };

function finite(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function formatNumber(value: number, digits = 1) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function signedCentimeters(value: number | null) {
  if (!finite(value)) return "—";
  const signal = value > 0 ? "+" : "";
  return `${signal}${formatNumber(value)} cm`;
}

function meters(value: number | null) {
  return finite(value) ? `${formatNumber(value, 2)} m` : "—";
}

function ageCopy(value: number | null) {
  if (!finite(value)) return "Idade da leitura não informada";
  if (value < 60) return `${Math.round(value)} min desde a leitura`;
  return `${formatNumber(value / 60)} h desde a leitura`;
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

function Teaser({ pagePath }: { pagePath: Props["pagePath"] }) {
  return (
    <aside className="registered-enrichment registered-enrichment--teaser" aria-label="Leitura avançada gratuita da conta">
      <div>
        <span className="eyebrow">Conta Free</span>
        <strong>A série pública tem uma leitura estatística adicional para usuários cadastrados.</strong>
        <p>
          O nível principal continua aberto. A conta gratuita acrescenta variações por janela, extremos,
          média da série e proveniência sem transformar o dado de origem em conteúdo pago.
        </p>
      </div>
      <Link to="/conta" search={{ erro: undefined, next: pagePath }}>
        Entrar gratuitamente
      </Link>
    </aside>
  );
}

function LaranjalContent({ data }: { data: LaranjalLevelData }) {
  const amplitude =
    finite(data.periodMinimum) && finite(data.periodMaximum)
      ? data.periodMaximum - data.periodMinimum
      : null;

  return (
    <>
      <div className="registered-enrichment__metrics">
        <article>
          <small>Variação · 1h</small>
          <strong>{signedCentimeters(data.change1hCm)}</strong>
          <p>Diferença calculada dentro da própria série da Estação Laranjal.</p>
        </article>
        <article>
          <small>Variação · 6h</small>
          <strong>{signedCentimeters(data.change6hCm)}</strong>
          <p>{finite(data.trendCmPerHour) ? `Ritmo recente: ${signedCentimeters(data.trendCmPerHour)}/h.` : "Ritmo recente não disponível."}</p>
        </article>
        <article>
          <small>Variação · 24h</small>
          <strong>{signedCentimeters(data.change24hCm)}</strong>
          <p>Janela mais longa da mesma régua, sem converter o valor em classificação de risco.</p>
        </article>
        <article>
          <small>Amplitude da série</small>
          <strong>{finite(amplitude) ? `${formatNumber(amplitude * 100)} cm` : "—"}</strong>
          <p>{finite(data.periodMinimum) && finite(data.periodMaximum) ? `${meters(data.periodMinimum)} a ${meters(data.periodMaximum)} no período recebido.` : "Extremos não disponíveis."}</p>
        </article>
      </div>

      <div className="registered-enrichment__trace">
        <article>
          <small>Média do período</small>
          <strong>{meters(data.periodAverage)}</strong>
          <p>{data.series.length} pontos utilizáveis na série reduzida desta consulta.</p>
        </article>
        <article>
          <small>Origem selecionada</small>
          <strong>{data.source.name}</strong>
          <p>
            {data.source.role === "contingency" ? "Fonte de contingência ativa" : "Fonte principal ativa"}
            {data.source.reference ? ` · ${data.source.reference}` : ""} · {ageCopy(data.ageMinutes)}.
          </p>
        </article>
      </div>
    </>
  );
}

function GuaibaContent({ data }: { data: GuaibaObservationData }) {
  const amplitude =
    finite(data.periodMinimum) && finite(data.periodMaximum)
      ? data.periodMaximum - data.periodMinimum
      : null;
  const references = data.references ?? [];

  return (
    <>
      <div className="registered-enrichment__metrics">
        <article>
          <small>Variação · 24h</small>
          <strong>{signedCentimeters(data.variation24hCm)}</strong>
          <p>Calculada somente na série da referência selecionada: {data.station}.</p>
        </article>
        <article>
          <small>Ritmo recente</small>
          <strong>{finite(data.trendCmPerHour) ? `${signedCentimeters(data.trendCmPerHour)}/h` : "—"}</strong>
          <p>Derivação matemática da própria série, não uma tendência oficial publicada pela fonte.</p>
        </article>
        <article>
          <small>Média da série recebida</small>
          <strong>{meters(data.periodAverage)}</strong>
          <p>{finite(data.periodMinimum) && finite(data.periodMaximum) ? `${meters(data.periodMinimum)} a ${meters(data.periodMaximum)} no período.` : "Extremos não disponíveis."}</p>
        </article>
        <article>
          <small>Amplitude da série</small>
          <strong>{finite(amplitude) ? `${formatNumber(amplitude * 100)} cm` : "—"}</strong>
          <p>{ageCopy(data.ageMinutes)} · {data.location}.</p>
        </article>
      </div>

      {references.length > 0 ? (
        <div className="registered-enrichment__context">
          <div>
            <strong>Referências recebidas separadamente</strong>
            <ul>
              {references.map((reference) => (
                <li key={reference.id}>
                  {reference.station}: {meters(reference.currentLevel)} · 24h {signedCentimeters(reference.variation24hCm)} · referência própria {meters(reference.floodReference)}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <strong>Regra de interpretação</strong>
            <ul>
              <li>Cais Mauá e Gasômetro não formam uma única régua.</li>
              <li>As cotas de referência permanecem vinculadas a cada estação.</li>
              <li>O Tempo Pelotas não subtrai nem normaliza as duas séries como se compartilhassem o mesmo datum.</li>
            </ul>
          </div>
        </div>
      ) : null}

      <div className="registered-enrichment__trace">
        <article>
          <small>Fonte selecionada</small>
          <strong>{data.source.name}</strong>
          <p>{data.source.originalInstitutions} · {data.station} · {ageCopy(data.ageMinutes)}.</p>
        </article>
        <article>
          <small>Distância à referência da própria régua</small>
          <strong>{finite(data.distanceToFloodReference) ? `${formatNumber(data.distanceToFloodReference * 100)} cm` : "—"}</strong>
          <p>
            Referência de {meters(data.floodReference)} da estação selecionada. Este valor não é transferido para Pelotas nem para outras réguas.
          </p>
        </article>
      </div>
    </>
  );
}

export function RegisteredSeriesHydrologyEnrichment(props: Props) {
  const access = useRegisteredAccess();

  if (!access || access.status === "unavailable") return null;
  if (access.status === "unauthenticated") return <Teaser pagePath={props.pagePath} />;

  const sourceName = props.data.source.name;
  const unavailable = props.data.status === "unavailable";

  return (
    <section className="registered-enrichment" aria-labelledby={`registered-series-${props.variant}`}>
      <div className="registered-enrichment__heading">
        <div>
          <span className="eyebrow">Leitura avançada · Conta Free</span>
          <h2 id={`registered-series-${props.variant}`}>Aprofunde a própria série, sem misturar réguas</h2>
          <p>
            Esta camada calcula contexto somente sobre os dados que a página já recebeu. Ela não substitui a
            leitura pública, não inventa classificação de risco e não transforma uma fonte pública em paywall.
          </p>
        </div>
        <span className="registered-enrichment__badge">Free</span>
      </div>

      {unavailable ? (
        <p className="registered-enrichment__footnote">
          A série avançada está indisponível nesta atualização. A página pública continua mostrando o último estado permitido pelo contrato da fonte.
        </p>
      ) : props.variant === "laranjal" ? (
        <LaranjalContent data={props.data} />
      ) : (
        <GuaibaContent data={props.data} />
      )}

      <p className="registered-enrichment__footnote">
        Fonte da série: {sourceName}. Estatísticas derivadas permanecem vinculadas à mesma estação e à mesma referência física da origem.
      </p>
    </section>
  );
}
