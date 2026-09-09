"use client";

import { ExternalLink } from "lucide-react";
import { useState } from "react";

import "./SimagroModelProducts.css";

const SIMAGRO_URL = "https://simagro.rs.gov.br/";

const PRODUCTS = [
  {
    id: "wrf",
    label: "WRF",
    title: "Meteograma WRF para Pelotas",
    imageUrl:
      "https://simagro.rs.gov.br/data/produtos/latest/meteogramas/meteograma_wrf_4914.png",
  },
  {
    id: "gfs",
    label: "GFS",
    title: "Meteograma GFS para Pelotas",
    imageUrl:
      "https://simagro.rs.gov.br/data/produtos/latest/meteogramas/meteograma_gfs_4914.png",
  },
  {
    id: "agro",
    label: "GFS Agro",
    title: "Agrometeograma GFS para Pelotas",
    imageUrl:
      "https://simagro.rs.gov.br/data/produtos/latest/meteogramas/agrometeograma_gfs_4914.png",
  },
] as const;

type ProductId = (typeof PRODUCTS)[number]["id"];

export function SimagroModelProducts() {
  const [selectedId, setSelectedId] = useState<ProductId>("wrf");
  const [failedIds, setFailedIds] = useState<ProductId[]>([]);
  const selected = PRODUCTS.find((product) => product.id === selectedId) ?? PRODUCTS[0];
  const failed = failedIds.includes(selected.id);

  return (
    <section
      className="simagro-model-products"
      id="modelos-simagro"
      aria-labelledby="simagro-model-products-title"
    >
      <header>
        <h2 id="simagro-model-products-title">Meteogramas do SIMAGRO RS</h2>
        <a href={SIMAGRO_URL} target="_blank" rel="noopener noreferrer">
          Abrir SIMAGRO RS <ExternalLink aria-hidden="true" />
        </a>
      </header>

      <div className="simagro-model-products__tabs" aria-label="Produto do SIMAGRO RS">
        {PRODUCTS.map((product) => (
          <button
            key={product.id}
            type="button"
            className={product.id === selected.id ? "is-active" : undefined}
            aria-pressed={product.id === selected.id}
            onClick={() => setSelectedId(product.id)}
          >
            {product.label}
          </button>
        ))}
      </div>

      <figure className="simagro-model-products__viewer">
        <div className="simagro-model-products__viewer-heading">
          <strong>{selected.title}</strong>
        </div>

        {failed ? (
          <div className="simagro-model-products__unavailable" role="status">
            <strong>O gráfico não carregou nesta página.</strong>
            <span>O arquivo pode continuar disponível diretamente na fonte.</span>
            <div>
              <a href={selected.imageUrl} target="_blank" rel="noopener noreferrer">
                Abrir imagem no SIMAGRO <ExternalLink aria-hidden="true" />
              </a>
              <a href={SIMAGRO_URL} target="_blank" rel="noopener noreferrer">
                Abrir SIMAGRO RS <ExternalLink aria-hidden="true" />
              </a>
            </div>
          </div>
        ) : (
          <img
            key={selected.id}
            src={selected.imageUrl}
            alt={`${selected.title}, produto gráfico de previsão do SIMAGRO RS`}
            loading="lazy"
            decoding="async"
            onError={() =>
              setFailedIds((current) =>
                current.includes(selected.id) ? current : [...current, selected.id],
              )
            }
          />
        )}

        <figcaption>Imagem do SIMAGRO RS. Data e ciclo aparecem no gráfico.</figcaption>
      </figure>
    </section>
  );
}
