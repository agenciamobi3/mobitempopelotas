import { Link } from "@tanstack/react-router";

import "./FloodHistoryIndexPage.css";

const FLOOD_HISTORY_EVENTS = [
  {
    year: 1941,
    title: "Enchente de 1941 em Pelotas",
    path: "/enchente-1941-pelotas",
    status: "Registro histórico consolidado",
    summary:
      "Reconstrução histórica da grande cheia de 1941, com contexto regional, impactos em Pelotas e limites das comparações com réguas atuais.",
    research: "Fontes históricas, registros institucionais e reconstrução documental.",
  },
  {
    year: 2001,
    title: "Enchente de 2001 em Pelotas e no Laranjal",
    path: "/enchente-2001-pelotas",
    status: "Pesquisa em andamento",
    summary:
      "Ciclone extratropical, vento de 105 km/h, avanço das águas no Laranjal, isolamento da Z3 e recuperação do balneário.",
    research: "Parte do acervo ainda está fora da internet ou depende de arquivos históricos.",
  },
  {
    year: 2015,
    title: "Enchente de 2015 em Pelotas",
    path: "/enchente-2015-pelotas",
    status: "Diário documental",
    summary:
      "Boletins quase diários permitem acompanhar níveis, chuva, vento, resgates, abrigos, obras emergenciais e a recuperação do Laranjal e da Z3.",
    research: "Série oficial da Prefeitura, medições preservadas por data e horário e imprensa contemporânea complementar.",
  },
  {
    year: 2024,
    title: "Enchente de 2024 em Pelotas e no Laranjal",
    path: "/enchente-2024-pelotas-laranjal",
    status: "Registro contemporâneo consolidado",
    summary:
      "Documentação extensa da cheia de 2024, com cronologia, contexto hidrológico, impactos e relação entre Lagoa dos Patos, Canal São Gonçalo e condições regionais.",
    research: "Maior disponibilidade de registros contemporâneos, telemetria, fontes oficiais e documentação pública.",
  },
] as const;

export function FloodHistoryIndexPage() {
  return (
    <article className="tp-flood-index">
      <section className="tp-flood-index-hero" aria-labelledby="tp-flood-index-title">
        <span>Arquivo climático e hidrológico de Pelotas</span>
        <h1 id="tp-flood-index-title">História das enchentes em Pelotas</h1>
        <p>
          Um ponto de partida para estudantes, moradores e pesquisadores encontrarem em um só lugar
          cronologias, medições, fontes, documentos e lacunas conhecidas sobre as principais cheias
          que atingiram Pelotas, o Laranjal, a Z3 e áreas próximas.
        </p>
      </section>

      <nav className="tp-flood-index-grid" aria-label="Registros históricos de enchentes">
        {FLOOD_HISTORY_EVENTS.map((event) => (
          <Link to={event.path} className="tp-flood-index-card" key={event.year}>
            <div className="tp-flood-index-card__year">{event.year}</div>
            <div>
              <span>{event.status}</span>
              <h2>{event.title}</h2>
              <p>{event.summary}</p>
              <small>{event.research}</small>
            </div>
            <strong aria-hidden="true">→</strong>
          </Link>
        ))}
      </nav>

      <section className="tp-flood-index-guide" aria-labelledby="tp-flood-index-guide-title">
        <div>
          <span>Para trabalhos e pesquisas</span>
          <h2 id="tp-flood-index-guide-title">Como usar este arquivo</h2>
        </div>
        <div>
          <p>
            Cada página separa o que vem de fonte oficial, imprensa contemporânea, pesquisa
            acadêmica, documento histórico ou memória de moradores. Quando uma informação ainda não
            foi localizada, a lacuna permanece identificada em vez de ser preenchida por estimativa.
          </p>
          <ul>
            <li>confira sempre a fonte indicada junto da informação;</li>
            <li>não compare cotas de anos diferentes sem saber estação, régua, datum e referência;</li>
            <li>trate números publicados em momentos diferentes como fotografias daquele instante;</li>
            <li>use a cronologia para distinguir fato contemporâneo de balanço retrospectivo;</li>
            <li>quando uma fonte antiga desapareceu da web, o registro informa essa limitação.</li>
          </ul>
        </div>
      </section>

      <section className="tp-flood-index-method" aria-labelledby="tp-flood-index-method-title">
        <div>
          <span>Memória pública com rastreabilidade</span>
          <h2 id="tp-flood-index-method-title">O objetivo não é deixar a história depender de links que podem desaparecer</h2>
        </div>
        <div>
          <p>
            Muitos documentos antigos de Pelotas hoje só aparecem em páginas quebradas, índices de
            jornais, cópias salvas ou serviços de arquivamento. O Tempo Pelotas organiza referências
            e contexto para que uma pesquisa escolar ou técnica não precise começar por arqueologia
            digital.
          </p>
          <p>
            O arquivo cresce de forma incremental. Uma página pode estar publicada e, ao mesmo tempo,
            continuar em pesquisa. Isso é preferível a esconder um evento até que todos os documentos
            possíveis tenham sido encontrados.
          </p>
        </div>
      </section>

      <section className="tp-flood-index-collab" aria-labelledby="tp-flood-index-collab-title">
        <div>
          <span>Acervo comunitário</span>
          <h2 id="tp-flood-index-collab-title">Você guarda alguma parte dessa história?</h2>
          <p>
            Fotografias, jornais, documentos, medições, marcas de água e depoimentos podem ajudar a
            completar os registros. Escolha o ano correspondente e envie o material para revisão.
          </p>
        </div>
        <a href="/contribuir">Escolher uma enchente e contribuir</a>
      </section>
    </article>
  );
}
