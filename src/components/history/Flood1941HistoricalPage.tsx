import { Link } from "@tanstack/react-router";

import {
  FLOOD_1941_KEY_FACTS,
  FLOOD_1941_SOURCES,
  FLOOD_1941_TIMELINE,
} from "@/lib/content/flood-1941-pelotas";

import "./Flood2024HistoricalPage.css";

export function Flood1941Hero() {
  return (
    <section className="tp-flood-hero" aria-labelledby="tp-flood-1941-hero-title">
      <div className="tp-flood-hero__inner">
        <div className="tp-flood-hero__copy">
          <span>Registro histórico · 1941</span>
          <h1 id="tp-flood-1941-hero-title">Enchente de 1941 em Pelotas</h1>
          <p>
            Fotografias preservadas em Pelotas, documentos de época e pesquisas recentes permitem
            reconstruir parte da cheia que marcou a cidade em 1941 — inclusive a referência de 2,88
            metros associada ao Canal São Gonçalo.
          </p>
        </div>

        <div className="tp-flood-hero__summary" aria-label="Marcos documentados de 1941">
          {FLOOD_1941_KEY_FACTS.map((fact) => (
            <div key={fact.label}>
              <span>{fact.label}</span>
              <strong>{fact.value}</strong>
              <small>{fact.detail}</small>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Flood1941HistoricalPage() {
  return (
    <article className="tp-flood-history">
      <nav className="tp-flood-history__index" aria-label="Nesta página">
        <span>Nesta página</span>
        <a href="#o-que-os-registros-mostram">O que os registros mostram</a>
        <a href="#marca-de-288">Como surgiu a marca de 2,88 m</a>
        <a href="#linha-do-tempo-1941">Linha do tempo documentada</a>
        <a href="#comparacao-2024">1941 e 2024</a>
        <a href="#fontes-1941">Fontes</a>
      </nav>

      <section className="tp-flood-history__lead" id="o-que-os-registros-mostram">
        <div>
          <span>O que é possível afirmar</span>
          <h2>Uma cheia prolongada, registrada por dezenas de fotografias</h2>
        </div>
        <div className="tp-flood-history__lead-copy">
          <p>
            O Museu da Universidade Católica de Pelotas preserva 61 fotografias em preto e branco
            da enchente de 1941 no acervo Nelson Nobre Magalhães. Muitas delas trazem anotações de
            datas e locais feitas por antigos detentores do conjunto.
          </p>
          <p>
            Esse material foi retomado por pesquisadores da Universidade Federal de Pelotas durante
            a crise de 2024 para reconstruir níveis históricos, referenciar réguas de monitoramento e
            compreender a permanência da água no território urbano.
          </p>
          <p>
            A documentação forte disponível sustenta uma página sobre Pelotas, Praça do Porto e
            Canal São Gonçalo. Ela não autoriza tratar toda a cidade, a Lagoa dos Patos ou o Laranjal
            como se tivessem uma única cota histórica equivalente.
          </p>
        </div>

        <div className="tp-flood-history__chain">
          <strong>Fotografia histórica → referência física na cidade → reconstrução da lâmina d’água → validação com documento cartográfico</strong>
          <p>
            Essa sequência é importante porque a marca histórica hoje usada como referência não é
            uma suposição editorial: ela foi reconstituída por pesquisa e confrontada com material
            documental de época.
          </p>
        </div>
      </section>

      <section className="tp-flood-explanation" id="marca-de-288">
        <div>
          <span>A marca histórica</span>
          <h2>Como pesquisadores chegaram aos 2,88 metros</h2>
        </div>
        <div>
          <p>
            Uma fotografia da Praça do Porto tomada pelas águas, com o antigo prédio da Alfândega ao
            fundo, forneceu um ponto físico que ainda existe e pôde ser usado para estimar a altura
            alcançada pela inundação de 1941.
          </p>
          <p>
            Depois da aplicação do modelo de cálculo, os pesquisadores localizaram um mapa de 1940
            no qual constava a mesma marca histórica de 2,88 metros. A coincidência reforçou a
            metodologia usada para amarrar as réguas de monitoramento do Canal São Gonçalo.
          </p>
          <p>
            A referência deve ser entendida dentro desse contexto histórico e da régua utilizada.
            Ela não deve ser transferida automaticamente para a Estação Laranjal, para o Guaíba ou
            para outras estações da Lagoa dos Patos.
          </p>
          <blockquote>
            Comparar cheias exige preservar local, régua, referência altimétrica e método de medição.
          </blockquote>
        </div>
      </section>

      <section className="tp-flood-timeline" id="linha-do-tempo-1941" aria-labelledby="tp-flood-1941-timeline-title">
        <header>
          <span>Linha do tempo documentada</span>
          <h2 id="tp-flood-1941-timeline-title">O que as fontes permitem reconstruir sem preencher lacunas</h2>
          <p>
            Em vez de inventar uma cronologia diária, esta linha do tempo usa somente datas e períodos
            sustentados pelo acervo e pelas pesquisas consultadas.
          </p>
        </header>

        <div className="tp-flood-timeline__list">
          {FLOOD_1941_TIMELINE.map((item) => (
            <section className="tp-flood-event is-pelotas" key={`${item.date}-${item.title}`}>
              <div className="tp-flood-event__date">
                <span>{item.date}</span>
                <small>Registro histórico</small>
                <strong>Pelotas / Canal São Gonçalo</strong>
              </div>
              <div className="tp-flood-event__body">
                <h3>{item.title}</h3>
                {item.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {item.highlight ? <b className="tp-flood-event__highlight">{item.highlight}</b> : null}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="tp-flood-lessons" id="comparacao-2024">
        <div>
          <span>1941 e 2024</span>
          <h2>Comparar os eventos ajuda, desde que a comparação preserve a referência</h2>
        </div>
        <div>
          <p>
            Em 12 de maio de 2024, a Prefeitura informou que o Canal São Gonçalo havia atingido 2,88
            metros, a mesma referência associada à cheia de 1941. Em 15 de maio, a leitura chegou a
            2,89 metros e superou esse marco.
          </p>
          <p>
            Isso tornou 1941 uma referência operacional importante durante a emergência de 2024,
            mas não significa que qualquer número de outra estação possa ser comparado diretamente.
            O Tempo Pelotas mantém cada régua, horário e fonte identificados.
          </p>
          <ul>
            <li>1941 é uma referência histórica reconstruída com documentação local;</li>
            <li>2015 possui uma série municipal quase diária, mas usa referências próprias de cada boletim;</li>
            <li>2024 possui telemetria e registros operacionais muito mais densos;</li>
            <li>níveis de estações diferentes não devem ser convertidos por simples subtração;</li>
            <li>a comparação histórica não substitui alertas ou decisões de segurança atuais.</li>
          </ul>
        </div>
      </section>

      <section className="tp-flood-sources" id="fontes-1941" aria-labelledby="tp-flood-1941-sources-title">
        <div>
          <span>Fontes documentais</span>
          <h2 id="tp-flood-1941-sources-title">De onde vêm as informações desta página</h2>
        </div>
        <div>
          <p>
            O conteúdo foi limitado ao que pode ser sustentado por acervo universitário, pesquisa
            acadêmica e registros oficiais da Prefeitura de Pelotas. Não usamos fotografias de 1941
            como decoração sem identificar sua origem nem transformamos relatos secundários em dado
            de nível.
          </p>
          <div className="tp-flood-related__links">
            {FLOOD_1941_SOURCES.map((source) => (
              <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>
                <span>
                  {source.name}<br />
                  <small>{source.organization} — {source.role}</small>
                </span>
                <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="tp-flood-related" aria-label="Continue consultando">
        <div>
          <span>Do histórico ao monitoramento atual</span>
          <h2>Compare 1941, 2015 e 2024 sem misturar as referências de medição</h2>
        </div>
        <div className="tp-flood-related__links">
          <Link to="/enchente-2015-pelotas">
            Enchente de 2015 em Pelotas <span aria-hidden="true">→</span>
          </Link>
          <Link to="/enchente-2024-pelotas-laranjal">
            Enchente de 2024 em Pelotas <span aria-hidden="true">→</span>
          </Link>
          <Link to="/situacao-hidrologica-pelotas">
            Situação atual das águas <span aria-hidden="true">→</span>
          </Link>
          <Link to="/nivel-da-lagoa-dos-patos-laranjal">
            Nível atual no Laranjal <span aria-hidden="true">→</span>
          </Link>
          <Link to="/nivel-do-guaiba">
            Nível atual do Guaíba <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </article>
  );
}
