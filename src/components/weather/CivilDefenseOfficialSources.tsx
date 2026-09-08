import { ArrowUpRight, FileText, Radar, ShieldAlert } from "lucide-react";

import "./CivilDefenseOfficialSources.css";

const officialSources = [
  {
    name: "Prepara RS",
    eyebrow: "Acompanhamento em tempo real",
    description:
      "Portal do Governo do Estado que reúne alertas e avisos vigentes, clima, níveis dos rios, radar e outros serviços públicos para eventos extremos.",
    href: "https://prepara.rs.gov.br/elnino",
    icon: Radar,
  },
  {
    name: "Avisos e boletins da Defesa Civil RS",
    eyebrow: "Boletins hidrometeorológicos",
    description:
      "Página oficial com boletins diurnos e noturnos e os avisos hidrometeorológicos produzidos pelo Centro de Monitoramento da Defesa Civil do Estado.",
    href: "https://defesacivil.rs.gov.br/avisos-e-boletins",
    icon: FileText,
  },
  {
    name: "Avisos, alertas e prevenção",
    eyebrow: "Defesa Civil do Rio Grande do Sul",
    description:
      "Canal estadual com avisos, alertas e orientações de prevenção. Use a publicação original para confirmar validade e instruções em situações de risco.",
    href: "https://defesacivil.rs.gov.br/avisos-e-alertas",
    icon: ShieldAlert,
  },
] as const;

export function CivilDefenseOfficialSources() {
  return (
    <section
      className="alerts-official-sources"
      id="fontes-estaduais-alertas"
      aria-labelledby="alerts-official-sources-title"
    >
      <header>
        <div>
          <span>Fontes estaduais complementares</span>
          <h2 id="alerts-official-sources-title">Consulte também a Defesa Civil do Rio Grande do Sul</h2>
        </div>
        <p>
          O aviso meteorológico do INMET e os comunicados da Defesa Civil têm funções diferentes. O
          Tempo Pelotas mantém os dois caminhos separados para preservar a origem e a responsabilidade
          de cada informação.
        </p>
      </header>

      <div className="alerts-official-sources__list">
        {officialSources.map((source) => {
          const Icon = source.icon;
          return (
            <a key={source.href} href={source.href} target="_blank" rel="noopener noreferrer">
              <Icon aria-hidden="true" />
              <span>
                <small>{source.eyebrow}</small>
                <strong>{source.name}</strong>
                <p>{source.description}</p>
              </span>
              <ArrowUpRight aria-hidden="true" />
            </a>
          );
        })}
      </div>

      <p className="alerts-official-sources__note">
        O portal não combina automaticamente classificações do INMET e da Defesa Civil em uma única
        escala de risco. Leia cada publicação na nomenclatura e no período informados pela própria fonte.
      </p>
    </section>
  );
}
