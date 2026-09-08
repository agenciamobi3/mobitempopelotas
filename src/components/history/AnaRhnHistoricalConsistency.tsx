import { ExternalLink, FileCheck2 } from "lucide-react";

import type {
  AnaRhnConsistencyClass,
  AnaRhnHistoricalConsistencyData,
} from "@/lib/hydrology/ana-rhn-consistency.server";

import "./AnaRhnHistoricalConsistency.css";

const CLASSIFICATION_LABELS: Record<AnaRhnConsistencyClass, string> = {
  OTIMO: "Ótima",
  BOM: "Boa",
  RAZOAVEL: "Razoável",
  RUIM: "Ruim",
  PESSIMO: "Péssima",
};

function formatScore(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 2,
  }).format(value);
}

export function AnaRhnHistoricalConsistency({
  data,
}: {
  data: AnaRhnHistoricalConsistencyData;
}) {
  if (data.status !== "live") return null;
  if (data.classification === null && data.score === null) return null;

  const place = [data.municipality, data.state].filter(Boolean).join(" / ");
  const context = [data.river, data.subBasin ?? data.basin].filter(Boolean).join(" · ");

  return (
    <section
      className="tp-flood-consistency"
      aria-labelledby="tp-flood-consistency-87955000-title"
    >
      <div className="tp-flood-consistency__heading">
        <span className="tp-flood-visual-kicker">
          <FileCheck2 className="tp-flood-visual-icon" aria-hidden="true" />
          Qualidade da série histórica
        </span>
        <h2 id="tp-flood-consistency-87955000-title">
          Como a ANA classifica a consistência da estação Laranjal 87955000
        </h2>
        {data.stationName || place || context ? (
          <p>
            {[data.stationName, place, context].filter(Boolean).join(" · ")}
          </p>
        ) : null}
      </div>

      <div className="tp-flood-consistency__content">
        <div className="tp-flood-consistency__facts">
          {data.classification ? (
            <div>
              <span>Classificação publicada</span>
              <strong>{CLASSIFICATION_LABELS[data.classification]}</strong>
            </div>
          ) : null}
          {data.score !== null ? (
            <div>
              <span>Nota publicada pela ANA</span>
              <strong>{formatScore(data.score)}</strong>
            </div>
          ) : null}
          {data.operating ? (
            <div>
              <span>Situação no cadastro</span>
              <strong>{data.operating}</strong>
            </div>
          ) : null}
        </div>

        <div className="tp-flood-consistency__explanation">
          <p>
            Esta avaliação pertence à camada de consistência da estação no cadastro da ANA. Ela não é
            uma nota da enchente de 8 de outubro de 2001 e não explica, sozinha, por que a série bruta
            e a série revisada guardam valores diferentes para aquele dia.
          </p>
          <p>
            A fonte também possui campos técnicos numerados de c1 a c16, mas o catálogo público da
            camada não descreve o significado de cada um. Por isso, o Tempo Pelotas não interpreta nem
            publica esses campos.
          </p>
        </div>

        <a href={data.source.layerUrl} target="_blank" rel="noreferrer">
          Consultar a camada de consistência da ANA
          <ExternalLink aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
