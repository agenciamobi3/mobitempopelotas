import { ArrowUpRight } from "lucide-react";

import type { AnaRhnLaranjalStationProfile } from "@/lib/hydrology/ana-rhn-laranjal-profile.server";

import styles from "./LaranjalMonitoringHistory.module.css";

type TimelineMilestone = {
  dateIso: string;
  date: string;
  title: string;
  body: string;
  sourceLabel: string;
  sourceUrl: string;
};

const BASE_MILESTONES: TimelineMilestone[] = [
  {
    dateIso: "2024-05-09",
    date: "9 de maio de 2024",
    title: "HidroSens instala medidor no Trapiche durante a enchente",
    body:
      "Um trabalho técnico da UFPel registra a instalação de um medidor ultrassônico no Trapiche da Praia do Laranjal, com transmissão LoRaWAN. Os medidores usados naquele monitoramento foram comparados com réguas linimétricas locais; no Laranjal, o maior valor registrado no período foi 2,79 m segundo a régua local.",
    sourceLabel: "Trabalho técnico do HidroSens/UFPel no I CONABREH",
    sourceUrl: "https://static.even3.com/anais/937195.pdf?v=638936884795718411",
  },
  {
    dateIso: "2025-06-27",
    date: "27 de junho de 2025",
    title: "Pelotas e UFPel anunciam a instalação de um sensor da ANA",
    body:
      "A Defesa Civil de Pelotas, em conjunto com o curso de Engenharia Hídrica da UFPel, anunciou a instalação de um sensor de nível da Agência Nacional de Águas e Saneamento Básico próximo ao Trapiche para ampliar o monitoramento da Lagoa e a integração de informações regionais.",
    sourceLabel: "Prefeitura Municipal de Pelotas",
    sourceUrl: "https://www.pelotas.rs.gov.br/noticia/prefeitura-realiza-acoes-preventivas-no-laranjal",
  },
  {
    dateIso: "2026-08-16",
    date: "16 de agosto de 2026",
    title: "A leitura de Pelotas passa a compor o monitoramento do CIEX/FURG",
    body:
      "O monitoramento do Laranjal passou a aparecer na rede do CIEX/FURG. Na ocasião, o HidroSens informou que os dados coletados são enviados ao campus Anglo da UFPel e depois disponibilizados para a ANA e para o CIEX.",
    sourceLabel: "A Hora do Sul — monitoramento do Laranjal e CIEX/FURG",
    sourceUrl:
      "https://ahoradosul.com.br/conteudos/2026/08/16/nivel-da-lagoa-no-laranjal-passa-a-integrar-monitoramento-do-ciex-furg/",
  },
];

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function anaRegistryMilestone(
  profile: AnaRhnLaranjalStationProfile,
): TimelineMilestone | null {
  if (profile.status !== "live") return null;

  const telemetric = profile.instruments.find((instrument) => instrument.label === "Telemetria");
  if (!telemetric?.startedAt) return null;

  const date = formatDate(telemetric.startedAt);
  if (!date) return null;

  return {
    dateIso: telemetric.startedAt,
    date,
    title: "ANA registra a identidade telemétrica 87955001 no Laranjal",
    body:
      "O inventário público da Rede Hidrometeorológica Nacional registra a estação LARANJAL 87955001 como telemétrica, sob responsabilidade e operação da UFPel. Esse cadastro confirma a identidade atual usada pelo Tempo Pelotas para consulta documental, mas não demonstra que ela seja o mesmo equipamento anunciado pela Prefeitura em 2025.",
    sourceLabel: "Cadastro público ANA/SNIRH da estação 87955001",
    sourceUrl: profile.source.url,
  };
}

function buildMilestones(profile: AnaRhnLaranjalStationProfile) {
  const anaMilestone = anaRegistryMilestone(profile);
  return [...BASE_MILESTONES, ...(anaMilestone ? [anaMilestone] : [])].sort(
    (left, right) => new Date(left.dateIso).getTime() - new Date(right.dateIso).getTime(),
  );
}

export function LaranjalMonitoringHistory({
  anaRhnProfile,
}: {
  anaRhnProfile: AnaRhnLaranjalStationProfile;
}) {
  const milestones = buildMilestones(anaRhnProfile);

  return (
    <section className={styles.section} aria-labelledby="laranjal-monitoring-history-title">
      <header className={styles.header}>
        <p>Trapiche do Laranjal</p>
        <h2 id="laranjal-monitoring-history-title">Como o monitoramento local evoluiu</h2>
        <span>
          O ponto de observação ganhou novos sensores e novas conexões entre 2024 e 2026. A
          cronologia abaixo preserva cada marco sem transformar equipamentos diferentes em uma única
          série.
        </span>
      </header>

      <ol className={styles.timeline}>
        {milestones.map((milestone) => (
          <li key={`${milestone.dateIso}-${milestone.title}`}>
            <time dateTime={milestone.dateIso}>{milestone.date}</time>
            <div>
              <h3>{milestone.title}</h3>
              <p>{milestone.body}</p>
              <a href={milestone.sourceUrl} target="_blank" rel="noreferrer">
                {milestone.sourceLabel} <ArrowUpRight aria-hidden="true" />
              </a>
            </div>
          </li>
        ))}
      </ol>

      <footer className={styles.note}>
        <p>
          Essa sequência documenta a evolução do monitoramento no Trapiche, mas não comprova que o
          medidor HidroSens de 2024, o sensor anunciado como equipamento da ANA em 2025 e a estação
          telemétrica 87955001 compartilhem o mesmo hardware, zero de régua, RN ou datum vertical.
          O cadastro da 87955001 é posterior ao anúncio municipal de 2025 e, sozinho, também não
          estabelece essa identidade. Por isso, o Tempo Pelotas mantém as referências separadas até
          existir documentação técnica suficiente.
        </p>
      </footer>
    </section>
  );
}
