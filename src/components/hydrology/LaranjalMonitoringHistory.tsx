import { ArrowUpRight } from "lucide-react";

import styles from "./LaranjalMonitoringHistory.module.css";

const MILESTONES = [
  {
    date: "9 de maio de 2024",
    title: "HidroSens instala medidor no Trapiche durante a enchente",
    body:
      "Um trabalho técnico da UFPel registra a instalação de um medidor ultrassônico no Trapiche da Praia do Laranjal, com transmissão LoRaWAN. Os medidores usados naquele monitoramento foram comparados com réguas linimétricas locais; no Laranjal, o maior valor registrado no período foi 2,79 m segundo a régua local.",
    sourceLabel: "Trabalho técnico do HidroSens/UFPel no I CONABREH",
    sourceUrl: "https://static.even3.com/anais/937195.pdf?v=638936884795718411",
  },
  {
    date: "27 de junho de 2025",
    title: "Pelotas e UFPel anunciam a instalação de um sensor da ANA",
    body:
      "A Defesa Civil de Pelotas, em conjunto com o curso de Engenharia Hídrica da UFPel, anunciou a instalação de um sensor de nível da Agência Nacional de Águas e Saneamento Básico próximo ao Trapiche para ampliar o monitoramento da Lagoa e a integração de informações regionais.",
    sourceLabel: "Prefeitura Municipal de Pelotas",
    sourceUrl: "https://www.pelotas.rs.gov.br/noticia/prefeitura-realiza-acoes-preventivas-no-laranjal",
  },
  {
    date: "16 de agosto de 2026",
    title: "A leitura de Pelotas passa a compor o monitoramento do CIEX/FURG",
    body:
      "O monitoramento do Laranjal passou a aparecer na rede do CIEX/FURG. Na ocasião, o HidroSens informou que os dados coletados são enviados ao campus Anglo da UFPel e depois disponibilizados para a ANA e para o CIEX.",
    sourceLabel: "A Hora do Sul — monitoramento do Laranjal e CIEX/FURG",
    sourceUrl:
      "https://ahoradosul.com.br/conteudos/2026/08/16/nivel-da-lagoa-no-laranjal-passa-a-integrar-monitoramento-do-ciex-furg/",
  },
] as const;

export function LaranjalMonitoringHistory() {
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
        {MILESTONES.map((milestone) => (
          <li key={milestone.date}>
            <time>{milestone.date}</time>
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
          Por isso, o Tempo Pelotas mantém as identidades e referências separadas até existir
          documentação técnica suficiente.
        </p>
      </footer>
    </section>
  );
}
