import { ArrowUpRight } from "lucide-react";

import type { AnaRhnLaranjalStationProfile as StationProfile } from "@/lib/hydrology/ana-rhn-laranjal-profile.server";

import styles from "./AnaRhnLaranjalStationProfile.module.css";

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function formatCoordinate(value: number | null) {
  if (value === null) return null;
  return value.toFixed(5).replace(".", ",");
}

function location(profile: StationProfile) {
  const city = [profile.municipality, profile.state].filter(Boolean).join(" / ");
  if (city) return city;
  if (profile.latitude !== null && profile.longitude !== null) {
    return `${formatCoordinate(profile.latitude)}, ${formatCoordinate(profile.longitude)}`;
  }
  return null;
}

export function AnaRhnLaranjalStationProfile({ data }: { data: StationProfile }) {
  if (data.status !== "live") return null;

  const place = location(data);
  const waterBody = data.river ?? data.subBasin ?? data.basin;
  const updatedAt = formatDate(data.inventoryUpdatedAt);
  const descriptiveName = [data.name, data.description]
    .filter((value, index, values): value is string => Boolean(value) && values.indexOf(value) === index)
    .join(" · ");

  const facts = [
    { label: "Código", value: data.code },
    { label: "Local", value: place },
    { label: "Corpo d'água", value: waterBody },
    { label: "Tipo de estação", value: data.stationType },
    {
      label: "Situação cadastral",
      value: data.operating === true ? "Em operação" : data.operating === false ? "Fora de operação" : null,
    },
    { label: "Responsável", value: data.responsible },
    { label: "Operadora", value: data.operator },
    {
      label: "Área de drenagem",
      value: data.drainageAreaKm2 === null ? null : `${data.drainageAreaKm2.toLocaleString("pt-BR")} km²`,
    },
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact.value));

  return (
    <section className={styles.section} aria-labelledby="ana-rhn-laranjal-profile-title">
      <header className={styles.header}>
        <div>
          <p>Rede Hidrometeorológica Nacional</p>
          <h2 id="ana-rhn-laranjal-profile-title">Estação 87955001 no cadastro da ANA</h2>
          {descriptiveName ? <span>{descriptiveName}</span> : null}
        </div>
        <a href={data.source.url} target="_blank" rel="noreferrer">
          Consultar a rede nacional <ArrowUpRight aria-hidden="true" />
        </a>
      </header>

      {facts.length > 0 ? (
        <dl className={styles.facts}>
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {data.instruments.length > 0 ? (
        <div className={styles.instruments}>
          <h3>Equipamentos cadastrados</h3>
          <div>
            {data.instruments.map((instrument) => {
              const startedAt = formatDate(instrument.startedAt);
              const endedAt = formatDate(instrument.endedAt);
              return (
                <p key={instrument.label}>
                  <strong>{instrument.label}</strong>
                  {startedAt ? <span>desde {startedAt}</span> : null}
                  {endedAt ? <span>até {endedAt}</span> : null}
                </p>
              );
            })}
          </div>
        </div>
      ) : null}

      <footer className={styles.note}>
        <p>
          Esta ficha descreve o cadastro da estação na ANA/SNIRH. Ela não acrescenta uma terceira
          leitura ao nível mostrado no topo e não autoriza converter a régua da 87955001 para a
          referência do LabHidroSens ou da rede CIEX/FURG. A medição ANA permanece fora do número
          principal enquanto sua referência vertical não estiver confirmada.
        </p>
        {updatedAt ? <small>Cadastro oficial alterado em {updatedAt}.</small> : null}
      </footer>
    </section>
  );
}
