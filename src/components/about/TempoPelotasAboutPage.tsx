import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import "./TempoPelotasAboutPage.css";

const processSteps = [
  {
    number: "01",
    title: "Coletamos informações públicas",
    description: "O portal consulta fontes meteorológicas, hidrológicas e de monitoramento usadas nas páginas do Tempo Pelotas.",
  },
  {
    number: "02",
    title: "Preservamos a fonte",
    description: "A origem e o horário acompanham a informação publicada sempre que estão disponíveis.",
  },
  {
    number: "03",
    title: "Organizamos para Pelotas",
    description: "Os dados são apresentados de forma direta, com foco em Pelotas e na Região Sul do Rio Grande do Sul.",
  },
  {
    number: "04",
    title: "Indicamos indisponibilidade",
    description: "Quando uma fonte não entrega um dado utilizável, o portal informa a indisponibilidade em vez de inventar um valor.",
  },
] as const;

export function TempoPelotasAboutPage() {
  return (
    <div className="about-page">
      <header className="about-hero">
        <div className="about-hero__copy">
          <span>Tempo Pelotas · projeto da MOBI</span>
          <h1>Informação meteorológica e hidrológica para Pelotas e região.</h1>
          <p>
            O Tempo Pelotas reúne previsão, observações, alertas, radar, satélite, níveis das águas e
            conteúdo histórico em um portal público voltado à comunidade.
          </p>
          <div className="about-hero__actions">
            <Link to="/status-dos-dados">Dados e fontes <ArrowRight aria-hidden="true" /></Link>
            <Link to="/tempo-hoje-pelotas">Tempo hoje</Link>
          </div>
        </div>

        <aside className="about-hero__summary" aria-label="Resumo do projeto">
          <div>
            <small>Foco</small>
            <strong>Pelotas e Região Sul do RS</strong>
          </div>
          <div>
            <small>Informação</small>
            <strong>Tempo, clima, água e eventos extremos</strong>
          </div>
          <div>
            <small>Tecnologia</small>
            <strong>Desenvolvida pela MOBI</strong>
          </div>
        </aside>
      </header>

      <section className="about-intro" aria-labelledby="about-mission-title">
        <div>
          <span>Nossa missão</span>
          <h2 id="about-mission-title">Facilitar o acesso da comunidade a informações úteis sobre tempo e águas.</h2>
        </div>
        <div>
          <p>
            O portal não substitui as instituições responsáveis pelas medições, previsões ou alertas.
            Cada informação mantém a atribuição da fonte correspondente.
          </p>
          <p>
            Medições, previsões e avisos são apresentados separadamente para que o visitante saiba o
            que foi observado, o que é estimativa e o que é comunicação oficial.
          </p>
        </div>
      </section>

      <section className="about-process" aria-labelledby="about-process-title">
        <header>
          <span>Como funciona</span>
          <h2 id="about-process-title">Da fonte até a página.</h2>
        </header>
        <div className="about-process__steps">
          {processSteps.map((step) => (
            <article key={step.number}>
              <span>{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-sources" aria-labelledby="about-sources-title">
        <header>
          <div>
            <span>Dados e fontes</span>
            <h2 id="about-sources-title">A origem dos dados fica concentrada em uma página pública.</h2>
          </div>
          <p>
            A página Dados e fontes informa quais serviços estão em uso, o que cada um fornece, o
            estado atual e o horário da última verificação.
          </p>
        </header>
        <div className="about-hero__actions">
          <Link to="/status-dos-dados">Consultar dados e fontes <ArrowRight aria-hidden="true" /></Link>
        </div>
      </section>

      <section className="about-mobi" aria-labelledby="about-mobi-title">
        <div>
          <span>Desenvolvimento</span>
          <h2 id="about-mobi-title">O Tempo Pelotas é um projeto tecnológico da MOBI.</h2>
        </div>
        <div>
          <p>
            A MOBI desenvolve e mantém a plataforma, a experiência de navegação e a publicação das
            informações reunidas pelo portal.
          </p>
          <p>
            A autoria da tecnologia não transforma a MOBI na fonte dos dados externos. Medições,
            previsões e avisos continuam atribuídos às instituições responsáveis.
          </p>
        </div>
      </section>

      <section className="about-directory" aria-labelledby="about-directory-title">
        <header>
          <span>O que você encontra</span>
          <h2 id="about-directory-title">Acompanhe o presente e consulte o histórico.</h2>
        </header>
        <nav aria-label="Áreas do Tempo Pelotas">
          <Link to="/tempo-hoje-pelotas"><strong>Tempo agora e hoje</strong><span>Condição, próximas horas e previsão diária.</span></Link>
          <Link to="/radar-e-satelite-pelotas"><strong>Radar e satélite</strong><span>Imagens meteorológicas recentes e seus horários.</span></Link>
          <Link to="/situacao-hidrologica-pelotas"><strong>Situação das águas</strong><span>Níveis e contexto hidrológico regional.</span></Link>
          <Link to="/historia-das-enchentes-pelotas"><strong>Arquivo histórico</strong><span>Eventos de 1941, 2001, 2015 e 2024.</span></Link>
          <Link to="/tempo-na-regiao-sul-rs"><strong>Região Sul do RS</strong><span>Previsão municipal para cidades acompanhadas pelo portal.</span></Link>
        </nav>
      </section>

      <footer className="about-transparency">
        <div>
          <span>Transparência</span>
          <h2>Quer saber de onde veio uma informação?</h2>
          <p>Consulte a página única de dados e fontes do Tempo Pelotas.</p>
        </div>
        <Link to="/status-dos-dados">Ver dados e fontes <ArrowRight aria-hidden="true" /></Link>
      </footer>
    </div>
  );
}
