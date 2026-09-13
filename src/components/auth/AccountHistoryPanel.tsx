import { ExternalLink, History, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import { HydrologyLevelChart } from "@/components/hydrology/HydrologyLevelChart";
import {
  ACCOUNT_HISTORY_DATASETS,
  ACCOUNT_HISTORY_DATASET_KEYS,
  ACCOUNT_HISTORY_PERIODS,
  type AccountHistoryDatasetKey,
  type AccountHistoryPeriod,
} from "@/lib/auth/account-history";
import {
  getAccountHistorySeries,
  type AccountHistorySnapshot,
} from "@/lib/auth/account-history.functions";

import "./AccountHistoryPanel.css";

function formatCoverage(value: string | null) {
  if (!value) return "sem leitura no período";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function initialPeriod(historyAccessDays: number | null): AccountHistoryPeriod {
  if (historyAccessDays !== null && historyAccessDays < 30) return 7;
  return 30;
}

export function AccountHistoryPanel({ historyAccessDays }: { historyAccessDays: number | null }) {
  const loadHistory = useServerFn(getAccountHistorySeries);
  const [datasetKey, setDatasetKey] = useState<AccountHistoryDatasetKey>("laranjal");
  const [period, setPeriod] = useState<AccountHistoryPeriod>(() => initialPeriod(historyAccessDays));
  const [snapshot, setSnapshot] = useState<AccountHistorySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);

    void loadHistory({ data: { dataset: datasetKey, days: period } })
      .then((next) => {
        if (!active) return;
        if (next.status === "unauthenticated") {
          window.location.assign("/conta?next=/painel");
          return;
        }
        setSnapshot(next);
      })
      .catch(() => {
        if (!active) return;
        setSnapshot({
          status: "unavailable",
          dataset: ACCOUNT_HISTORY_DATASETS[datasetKey],
          requestedDays: period,
          effectiveDays: period,
          message: "Não foi possível carregar o histórico nesta consulta.",
        });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [datasetKey, period, refreshToken, loadHistory]);

  const selectedDataset = ACCOUNT_HISTORY_DATASETS[datasetKey];
  const resolved = snapshot?.status === "authenticated" ? snapshot : null;

  return (
    <section className="account-history" id="historico-pessoal" aria-labelledby="account-history-title">
      <header className="account-history__header">
        <div>
          <span className="eyebrow">Histórico pessoal</span>
          <h2 id="account-history-title">Volte no tempo sem sair do painel</h2>
          <p>
            Consulte observações arquivadas pelo Tempo Pelotas. O gráfico usa somente pontos reais da
            fonte e reduz a quantidade exibida quando necessário, sem interpolação nem preenchimento de
            lacunas.
          </p>
        </div>
        <span className="account-history__badge">
          <History aria-hidden="true" size={16} /> Incluído na conta
        </span>
      </header>

      <div className="account-history__controls" aria-label="Controles do histórico pessoal">
        <label>
          <span>Local monitorado</span>
          <select
            value={datasetKey}
            onChange={(event) => setDatasetKey(event.target.value as AccountHistoryDatasetKey)}
          >
            {ACCOUNT_HISTORY_DATASET_KEYS.map((key) => (
              <option key={key} value={key}>
                {ACCOUNT_HISTORY_DATASETS[key].label}
              </option>
            ))}
          </select>
        </label>

        <div className="account-history__periods" aria-label="Período do histórico">
          <span>Período</span>
          <div>
            {ACCOUNT_HISTORY_PERIODS.map((days) => {
              const disabled = historyAccessDays !== null && days > historyAccessDays;
              return (
                <button
                  type="button"
                  className={period === days ? "is-active" : undefined}
                  disabled={disabled}
                  aria-pressed={period === days}
                  onClick={() => setPeriod(days)}
                  key={days}
                >
                  {days} dias
                </button>
              );
            })}
          </div>
        </div>

        <button
          className="account-history__refresh"
          type="button"
          onClick={() => setRefreshToken((value) => value + 1)}
          disabled={loading}
        >
          <RefreshCw aria-hidden="true" size={16} />
          {loading ? "Atualizando…" : "Atualizar"}
        </button>
      </div>

      <div className="account-history__context">
        <div>
          <strong>{selectedDataset.label}</strong>
          <span>{selectedDataset.context}</span>
        </div>
        <a href={selectedDataset.publicPath}>
          Abrir página pública <ExternalLink aria-hidden="true" size={14} />
        </a>
      </div>

      {loading && !resolved ? (
        <div className="account-history__state" role="status">
          <strong>Carregando observações arquivadas…</strong>
          <span>Buscando apenas a série necessária para este painel.</span>
        </div>
      ) : snapshot?.status === "unavailable" ? (
        <div className="account-history__state is-unavailable" role="status">
          <strong>Histórico temporariamente indisponível</strong>
          <span>{snapshot.message}</span>
        </div>
      ) : resolved ? (
        <>
          <HydrologyLevelChart
            points={resolved.points}
            unit={resolved.dataset.unit}
            ariaLabel={`Histórico de nível de ${resolved.dataset.label} nos últimos ${resolved.effectiveDays} dias`}
            eyebrow="Arquivo da conta"
            windowLabel={`${resolved.dataset.label} · últimos ${resolved.effectiveDays} dias`}
            latestLabel="Leitura arquivada mais recente"
            emptyMessage="Ainda não há observações arquivadas para este local dentro do período selecionado."
            className="account-history__chart"
          />

          <footer className="account-history__meta">
            <span>
              Cobertura encontrada: <strong>{formatCoverage(resolved.coverageStart)}</strong> até{" "}
              <strong>{formatCoverage(resolved.coverageEnd)}</strong>
            </span>
            <span>
              {resolved.loadedCount} observações reais encontradas
              {resolved.sampledCount < resolved.loadedCount
                ? ` · ${resolved.sampledCount} pontos exibidos para manter o gráfico leve`
                : ""}
              {resolved.truncated ? " · consulta limitada para proteger o painel" : ""}
            </span>
          </footer>
        </>
      ) : null}
    </section>
  );
}
