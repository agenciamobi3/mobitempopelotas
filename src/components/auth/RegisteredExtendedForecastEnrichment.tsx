import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import {
  getRegisteredEnrichmentAccess,
  type RegisteredEnrichmentAccess,
} from "@/lib/auth/registered-enrichment.functions";
import type { ExtendedForecastData } from "@/lib/weather/extended-forecast.types";
import type { DailyForecast } from "@/lib/weather/types";

import "./RegisteredWeatherEnrichment.css";

function finite(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function formatNumber(value: number, digits = 1) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function dayLabel(day: DailyForecast | undefined) {
  return day ? `${day.weekday} · ${day.date}` : "dia não informado";
}

function maxDay(
  days: readonly DailyForecast[],
  value: (day: DailyForecast) => number | null | undefined,
) {
  let result: { day: DailyForecast; value: number } | null = null;
  for (const day of days) {
    const current = value(day);
    if (!finite(current)) continue;
    if (!result || current > result.value) result = { day, value: current };
  }
  return result;
}

function minDay(
  days: readonly DailyForecast[],
  value: (day: DailyForecast) => number | null | undefined,
) {
  let result: { day: DailyForecast; value: number } | null = null;
  for (const day of days) {
    const current = value(day);
    if (!finite(current)) continue;
    if (!result || current < result.value) result = { day, value: current };
  }
  return result;
}

function windowSummary(days: readonly DailyForecast[]) {
  const precipitation = days.reduce(
    (total, day) => total + (finite(day.precipitationMm) ? day.precipitationMm : 0),
    0,
  );
  const rainyDays = days.filter(
    (day) => day.precipitationMm > 0.1 || (finite(day.rainChance) && day.rainChance >= 50),
  ).length;
  const hottest = maxDay(days, (day) => day.max);
  const coldest = minDay(days, (day) => day.min);
  const gust = maxDay(days, (day) => day.windGust);

  return { precipitation, rainyDays, hottest, coldest, gust };
}

export function RegisteredExtendedForecastEnrichment({
  forecast,
}: {
  forecast: ExtendedForecastData;
}) {
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

  const firstWindow = useMemo(() => windowSummary(forecast.days.slice(0, 7)), [forecast.days]);
  const secondWindow = useMemo(() => windowSummary(forecast.days.slice(7, 15)), [forecast.days]);
  const fullWindow = useMemo(() => windowSummary(forecast.days.slice(0, 15)), [forecast.days]);

  if (!access || access.status === "unavailable") return null;

  if (access.status === "unauthenticated") {
    return (
      <aside className="registered-enrichment registered-enrichment--teaser" aria-label="Planejamento estendido gratuito da conta">
        <div>
          <span className="eyebrow">Conta Free</span>
          <strong>Usuários cadastrados recebem uma leitura de planejamento da janela estendida.</strong>
          <p>
            A previsão de 15 dias continua pública. A conta gratuita organiza os dias em janelas, resume chuva,
            extremos e rajadas e deixa explícita a cobertura realmente retornada pelo modelo.
          </p>
        </div>
        <Link to="/conta" search={{ erro: undefined, next: "/previsao-15-dias-pelotas" }}>
          Entrar gratuitamente
        </Link>
      </aside>
    );
  }

  const unavailable = forecast.status === "unavailable" || forecast.days.length === 0;
  const hottest = fullWindow.hottest;
  const coldest = fullWindow.coldest;
  const gust = fullWindow.gust;

  return (
    <section className="registered-enrichment" aria-labelledby="registered-extended-forecast">
      <div className="registered-enrichment__heading">
        <div>
          <span className="eyebrow">Planejamento avançado · Conta Free</span>
          <h2 id="registered-extended-forecast">Separe o curto prazo da segunda semana</h2>
          <p>
            Quanto mais distante o dia, maior a utilidade como tendência de planejamento e menor a conveniência
            de tratar um número isolado como certeza. A conta Free organiza a mesma previsão em duas janelas.
          </p>
        </div>
        <span className="registered-enrichment__badge">Free</span>
      </div>

      {unavailable ? (
        <p className="registered-enrichment__footnote">
          A previsão estendida não trouxe dias utilizáveis nesta atualização. Nenhum valor demonstrativo foi colocado no lugar dos dados reais.
        </p>
      ) : (
        <>
          <div className="registered-enrichment__metrics">
            <article>
              <small>Dias 1 a 7</small>
              <strong>{formatNumber(firstWindow.precipitation)} mm</strong>
              <p>{firstWindow.rainyDays} dia{firstWindow.rainyDays === 1 ? "" : "s"} com volume previsto ou chance de chuva ≥ 50%.</p>
            </article>
            <article>
              <small>Dias 8 a 15</small>
              <strong>{formatNumber(secondWindow.precipitation)} mm</strong>
              <p>{secondWindow.rainyDays} dia{secondWindow.rainyDays === 1 ? "" : "s"} com volume previsto ou chance de chuva ≥ 50%.</p>
            </article>
            <article>
              <small>Maior máxima</small>
              <strong>{hottest ? `${Math.round(hottest.value)}°C` : "—"}</strong>
              <p>{hottest ? dayLabel(hottest.day) : "Sem máxima utilizável na janela."}</p>
            </article>
            <article>
              <small>Menor mínima</small>
              <strong>{coldest ? `${Math.round(coldest.value)}°C` : "—"}</strong>
              <p>{coldest ? dayLabel(coldest.day) : "Sem mínima utilizável na janela."}</p>
            </article>
          </div>

          <div className="registered-enrichment__trace">
            <article>
              <small>Cobertura desta atualização</small>
              <strong>{forecast.source.returnedDays}/{forecast.source.requestedDays} dias</strong>
              <p>Status {forecast.status} · modelo {forecast.source.model}.</p>
            </article>
            <article>
              <small>Rajada mais forte da janela</small>
              <strong>{gust ? `${Math.round(gust.value)} km/h` : "—"}</strong>
              <p>{gust ? dayLabel(gust.day) : "Sem rajada diária utilizável."}</p>
            </article>
          </div>

          <div className="registered-enrichment__context">
            <div>
              <strong>Como usar a primeira semana</strong>
              <ul>
                <li>Priorize a sequência dos dias e volte a conferir quando a atividade estiver mais próxima.</li>
                <li>Chance de chuva e volume previsto continuam sendo grandezas diferentes.</li>
                <li>Extremos resumem a janela, mas não substituem a leitura dia a dia.</li>
              </ul>
            </div>
            <div>
              <strong>Como usar a segunda semana</strong>
              <ul>
                <li>Trate os dias mais distantes como tendência para planejamento.</li>
                <li>Não transforme uma previsão distante em alerta ou certeza operacional.</li>
                <li>Compare novamente a janela conforme novos ciclos do modelo chegarem.</li>
              </ul>
            </div>
          </div>
        </>
      )}

      <p className="registered-enrichment__footnote">
        Fonte: {forecast.source.name} · {forecast.source.model}. O resumo deriva exclusivamente dos dias realmente retornados pela fonte nesta atualização.
      </p>
    </section>
  );
}
