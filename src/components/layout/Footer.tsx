import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import type { WeatherData } from "@/production/lib/weather-data";

import "./FooterStatusLink.css";
import { EmergencyFooterStrip } from "./EmergencyFooterStrip";

const footerGroups = [
  {
    title: "Previsão",
    links: [
      { label: "Hoje em Pelotas", ariaLabel: "Ver a previsão do tempo para hoje em Pelotas", to: "/tempo-hoje-pelotas" },
      { label: "Amanhã", ariaLabel: "Ver a previsão do tempo para amanhã em Pelotas", to: "/tempo-amanha-pelotas" },
      { label: "Tempo no Laranjal", ariaLabel: "Ver a previsão do tempo para a Praia do Laranjal em Pelotas", to: "/tempo-laranjal-pelotas" },
      { label: "Próximos 7 dias", ariaLabel: "Ver a previsão do tempo para os próximos 7 dias em Pelotas", to: "/previsao-7-dias-pelotas" },
      { label: "Próximos 15 dias", ariaLabel: "Ver a previsão do tempo para os próximos 15 dias em Pelotas", to: "/previsao-15-dias-pelotas" },
      { label: "Meteograma", ariaLabel: "Ver o meteograma horário de Pelotas", to: "/meteograma-pelotas" },
      { label: "Chuva em Pelotas", ariaLabel: "Ver probabilidade e volume de chuva em Pelotas", to: "/chuva-em-pelotas" },
      { label: "Vento em Pelotas", ariaLabel: "Ver velocidade, direção e rajadas de vento em Pelotas", to: "/vento-em-pelotas" },
    ],
  },
  {
    title: "Monitoramento",
    links: [
      { label: "Radar e satélite", ariaLabel: "Acompanhar radar e satélite meteorológico para Pelotas e região", to: "/radar-e-satelite-pelotas" },
      { label: "Dados e fontes", ariaLabel: "Consultar a origem e o status dos dados do Tempo Pelotas", to: "/status-dos-dados" },
      { label: "Câmeras ao vivo", ariaLabel: "Ver câmeras ao vivo de Pelotas e região", to: "/cameras-ao-vivo-pelotas" },
      { label: "Mapa de geadas", ariaLabel: "Consultar ocorrências de geada registradas pelo INMET no Rio Grande do Sul", to: "/mapa-de-geadas-rio-grande-do-sul" },
      { label: "Avisos oficiais", ariaLabel: "Consultar avisos meteorológicos oficiais para Pelotas", to: "/alertas" },
    ],
  },
  {
    title: "Águas",
    links: [
      { label: "Situação das águas", ariaLabel: "Ver a situação hidrológica de Pelotas e da Lagoa dos Patos", to: "/situacao-hidrologica-pelotas" },
      { label: "Nível da Lagoa dos Patos", ariaLabel: "Ver o panorama da Lagoa dos Patos e os cinco pontos locais monitorados", to: "/nivel-da-lagoa-dos-patos" },
      { label: "Nível no Laranjal", ariaLabel: "Ver o nível da Lagoa dos Patos na Praia do Laranjal", to: "/nivel-da-lagoa-dos-patos-laranjal" },
      { label: "Nível do Guaíba", ariaLabel: "Ver o nível atual do Guaíba e suas referências de medição", to: "/nivel-do-guaiba" },
      { label: "Nível do Canal São Gonçalo", ariaLabel: "Ver o nível atual do Canal São Gonçalo na estação da Eclusa em Capão do Leão", to: "/nivel-do-canal-sao-goncalo" },
      { label: "Nível do Rio Jaguarão", ariaLabel: "Ver o nível atual do Rio Jaguarão na estação da Defesa Civil RS", to: "/nivel-do-rio-jaguarao" },
      { label: "História das enchentes", ariaLabel: "Consultar o arquivo histórico das enchentes de Pelotas em 1941, 2001, 2015 e 2024", to: "/historia-das-enchentes-pelotas" },
      { label: "Enchente de 1941", ariaLabel: "Consultar o registro histórico da enchente de 1941 em Pelotas", to: "/enchente-1941-pelotas" },
      { label: "Enchente de 2001", ariaLabel: "Consultar o registro histórico em pesquisa da enchente de 2001 em Pelotas e no Laranjal", to: "/enchente-2001-pelotas" },
      { label: "Enchente de 2015", ariaLabel: "Consultar a linha do tempo histórica da enchente de 2015 em Pelotas", to: "/enchente-2015-pelotas" },
      { label: "Enchente de 2024", ariaLabel: "Consultar o registro histórico da enchente de 2024 em Pelotas e no Laranjal", to: "/enchente-2024-pelotas-laranjal" },
    ],
  },
  {
    title: "Região e contexto",
    links: [
      { label: "Tempo na Zona Sul", ariaLabel: "Ver a previsão meteorológica para cidades da Zona Sul do Rio Grande do Sul", to: "/tempo-na-regiao-sul-rs" },
      { label: "Clima de Pelotas", ariaLabel: "Entender o clima de Pelotas e seus padrões sazonais", to: "/clima-em-pelotas" },
      { label: "Histórico climático", ariaLabel: "Consultar o histórico climático recente de Pelotas", to: "/historico-climatico-pelotas" },
      { label: "Blog", ariaLabel: "Ler conteúdos meteorológicos e editoriais do Tempo Pelotas", to: "/blog" },
    ],
  },
] as const;

const mobiUrl = "https://agenciamobi.com.br/?utm_source=tempopelotas&utm_medium=footer&utm_campaign=portal_tempo_pelotas";

type FooterProps = { source?: WeatherData["source"]; };

function isActivePath(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function Footer({ source }: FooterProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const sourceStatus = source?.isFallback ? "Algumas informações estão com atualização parcial" : "Dados e fontes monitorados";

  return <>
    <EmergencyFooterStrip />
    <footer className="tp-home-footer-shell">
      <div className="tp-home-footer">
        <section className="tp-home-footer-top" aria-labelledby="tp-home-footer-title">
          <div className="tp-home-footer-identity">
            <Link className="tp-home-footer-brand" to="/" aria-label="Tempo Pelotas — página inicial"><img className="tp-home-footer-brand-logo" src="/brand/tempo-pelotas-purple.svg" alt="" width={344} height={50} loading="lazy" decoding="async" draggable={false} /></Link>
            <h2 id="tp-home-footer-title">Tempo, água e dados de Pelotas.</h2>
            <p>Previsão, observação, radar, alertas e hidrologia para Pelotas e região.</p>
          </div>
          <div className={`tp-home-footer-status${source?.isFallback ? " is-fallback" : ""}`} aria-label="Estado das fontes do portal">
            <span aria-hidden="true" />
            <div><small>Saúde das fontes</small><strong>{sourceStatus}</strong><Link className="tp-home-footer-status__link" to="/status-dos-dados" aria-label="Consultar os dados e as fontes do Tempo Pelotas">Ver dados e fontes<ArrowRight aria-hidden="true" /></Link></div>
          </div>
        </section>
        <section className="tp-home-footer-directory" aria-label="Navegação principal do portal"><div className="tp-home-footer-groups">{footerGroups.map((group) => <nav className="tp-home-footer-group" aria-label={group.title} key={group.title}><strong>{group.title}</strong><ul>{group.links.map((link) => <li key={link.to}><Link to={link.to} aria-label={link.ariaLabel} aria-current={isActivePath(pathname, link.to) ? "page" : undefined}><span>{link.label}</span><ArrowRight aria-hidden="true" /></Link></li>)}</ul></nav>)}</div></section>
        <section className="tp-home-footer-transparency" aria-label="Orientação de segurança e dados">
          <div className="tp-home-footer-sources">
            <span>Dados e fontes</span>
            <p><Link to="/status-dos-dados">Origem, uso e status de cada fonte</Link></p>
          </div>
          <div className="tp-home-footer-service">
            <div className="tp-home-footer-guidance"><span aria-hidden="true">i</span><p>Em situações de risco, siga os comunicados da Defesa Civil, do INMET e das autoridades locais.</p></div>
            <nav className="tp-home-footer-legal" aria-label="Transparência e dados">
              <Link to="/status-dos-dados" aria-label="Consultar a origem e o status das fontes do Tempo Pelotas" aria-current={isActivePath(pathname, "/status-dos-dados") ? "page" : undefined}>Dados e fontes</Link>
              <Link to="/privacidade-e-dados" aria-label="Consultar a política de privacidade e dados do Tempo Pelotas" aria-current={isActivePath(pathname, "/privacidade-e-dados") ? "page" : undefined}>Privacidade e dados</Link>
              <a href="/feed" type="application/feed+json" aria-label="Abrir o feed JSON de dados do Tempo Pelotas">Feed de dados</a>
            </nav>
          </div>
        </section>
        <div className="tp-home-footer-base"><span>© {new Date().getFullYear()} Tempo Pelotas</span><p>Projeto do <a href={mobiUrl} target="_blank" rel="noopener noreferrer" aria-label="Conhecer o Ecossistema MOBI, abre em nova aba">Ecossistema MOBI</a></p></div>
      </div>
    </footer>
  </>;
}