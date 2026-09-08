import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { DataSourceCard } from "./DataSourceCard";
import "./TempoPelotasAboutPage.css";

const processSteps = [
  {
    number: "01",
    title: "Buscamos os dados",
    description: "O portal consulta fontes meteorológicas, hidrológicas e de monitoramento identificadas em cada página.",
  },
  {
    number: "02",
    title: "Preservamos a origem",
    description: "Horário, instituição, estado da coleta e limitações acompanham o dado sempre que a fonte fornece essas informações.",
  },
  {
    number: "03",
    title: "Organizamos para leitura local",
    description: "Temperatura, chuva, vento, níveis, radar e outros registros são apresentados com linguagem mais simples e contexto para Pelotas e região.",
  },
  {
    number: "04",
    title: "Mostramos quando algo falha",
    description: "Uma fonte atrasada ou indisponível não vira zero nem dado inventado. O estado da informação deve continuar visível.",
  },
] as const;

export function TempoPelotasAboutPage() {
  return (
    <div className="about-page">
      <header className="about-hero">
        <div className="about-hero__copy">
          <span>Tempo Pelotas · projeto da MOBI</span>
          <h1>Dados públicos, contexto local e uma leitura mais simples do tempo e das águas.</h1>
          <p>
            O Tempo Pelotas reúne informações meteorológicas, ambientais e hidrológicas em um só
            lugar. A proposta é aproximar dados técnicos da rotina de quem vive, trabalha, estuda ou
            pesquisa em Pelotas e na Região Sul do Rio Grande do Sul.
          </p>
          <div className="about-hero__actions">
            <Link to="/metodologia">Como os dados funcionam <ArrowRight aria-hidden="true" /></Link>
            <Link to="/status-dos-dados">Status das fontes</Link>
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
          <h2 id="about-mission-title">Transformar consulta técnica em informação que faça sentido para a comunidade.</h2>
        </div>
        <div>
          <p>
            O portal não substitui as instituições responsáveis pelas medições, previsões ou alertas.
            Ele organiza essas informações, preserva a fonte e oferece contexto para facilitar a leitura.
          </p>
          <p>
            Isso inclui diferenciar observação de previsão, indicar quando uma leitura está atrasada e
            evitar preencher lacunas com números que a fonte não publicou.
          </p>
        </div>
      </section>

      <section className="about-process" aria-labelledby="about-process-title">
        <header>
          <span>Como funciona</span>
          <h2 id="about-process-title">Da fonte até a tela, sem esconder o caminho.</h2>
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
            <span>Fontes e instituições</span>
            <h2 id="about-sources-title">Cada informação deve chegar com origem identificável.</h2>
          </div>
          <p>
            As fontes utilizadas variam conforme a página e a disponibilidade da integração. O nome,
            horário e papel de cada fonte aparecem junto dos dados sempre que possível.
          </p>
        </header>
        <div className="about-sources__list">
          <DataSourceCard
            role="Meteorologia e avisos"
            name="INMET"
            description="Previsões, estações, avisos oficiais e outros dados meteorológicos utilizados conforme a disponibilidade de cada serviço."
          />
          <DataSourceCard
            role="Observação local"
            name="Embrapa Clima Temperado"
            description="Medições meteorológicas locais do posto de referência em Pelotas, incluindo temperatura, umidade, vento e acumulados quando publicados."
          />
          <DataSourceCard
            role="Meteorologia regional"
            name="CPPMet / UFPel"
            description="Publicações e informações meteorológicas regionais produzidas pelo Centro de Pesquisas e Previsões Meteorológicas da UFPel."
          />
          <DataSourceCard
            role="Radar, satélite e raios"
            name="REDEMET / DECEA"
            description="Imagens e registros de monitoramento usados na leitura regional de chuva, nuvens e atividade elétrica."
          />
          <DataSourceCard
            role="Monitoramento hidrológico"
            name="CIEX / FURG e redes locais"
            description="Leituras de nível utilizadas em páginas hidrológicas, sempre mantendo separadas as referências e séries de cada estação."
          />
        </div>
      </section>

      <section className="about-mobi" aria-labelledby="about-mobi-title">
        <div>
          <span>Desenvolvimento</span>
          <h2 id="about-mobi-title">O Tempo Pelotas é um projeto tecnológico da MOBI.</h2>
        </div>
        <div>
          <p>
            A MOBI desenvolve a plataforma, as integrações, a experiência de navegação e as camadas de
            apresentação que conectam diferentes serviços em uma interface pública.
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
          <h2 id="about-directory-title">Um portal para acompanhar o presente e entender o passado.</h2>
        </header>
        <nav aria-label="Áreas do Tempo Pelotas">
          <Link to="/tempo-hoje-pelotas"><strong>Tempo agora e hoje</strong><span>Condição, próximas horas e previsão diária.</span></Link>
          <Link to="/radar-e-satelite-pelotas"><strong>Radar e satélite</strong><span>Coletas recentes e horários reais das fontes.</span></Link>
          <Link to="/situacao-hidrologica-pelotas"><strong>Situação das águas</strong><span>Níveis, estações e contexto hidrológico regional.</span></Link>
          <Link to="/historia-das-enchentes-pelotas"><strong>Arquivo histórico</strong><span>Eventos de 1941, 2001, 2015 e 2024.</span></Link>
          <Link to="/tempo-na-regiao-sul-rs"><strong>Região Sul do RS</strong><span>Previsão municipal e comparação entre cidades.</span></Link>
        </nav>
      </section>

      <footer className="about-transparency">
        <div>
          <span>Transparência</span>
          <h2>Quer saber de onde veio um número?</h2>
          <p>
            Consulte a metodologia e o status operacional das integrações. Quando uma fonte não
            responde, esse estado deve aparecer em vez de ser escondido por uma aparência de normalidade.
          </p>
        </div>
        <Link to="/metodologia">Ver metodologia <ArrowRight aria-hidden="true" /></Link>
      </footer>
    </div>
  );
}
