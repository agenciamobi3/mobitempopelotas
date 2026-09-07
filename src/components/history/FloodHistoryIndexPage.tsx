import { Link } from "@tanstack/react-router";

import "./FloodHistoryIndexPage.css";

const FLOOD_HISTORY_EVENTS = [
  {
    year: 1941,
    title: "Enchente de 1941 em Pelotas",
    path: "/enchente-1941-pelotas",
    status: "Registro histórico consolidado",
    summary:
      "Fotografias e documentos ajudam a mostrar onde a água chegou e como foi reconstruída a marca histórica de 2,88 m no Canal São Gonçalo.",
    research: "A página explica o que sabemos, o que ainda não sabemos e como essa marca foi reconstruída.",
  },
  {
    year: 2001,
    title: "Enchente de 2001 em Pelotas e no Laranjal",
    path: "/enchente-2001-pelotas",
    status: "Pesquisa em andamento",
    summary:
      "Vento de 105 km/h, avanço da Lagoa por cerca de 600 metros no Laranjal, ondas e isolamento da Z3.",
    research: "Também explicamos, em linguagem simples, por que a régua histórica mostra dois valores diferentes para o mesmo dia.",
  },
  {
    year: 2015,
    title: "Enchente de 2015 em Pelotas",
    path: "/enchente-2015-pelotas",
    status: "Diário documental",
    summary:
      "Chuva muito acima da média, água chegando de outras bacias, níveis altos e vento dificultando a saída da água para o mar.",
    research: "Boletins quase diários permitem acompanhar resgates, abrigos, níveis, obras e a recuperação do Laranjal e da Z3.",
  },
  {
    year: 2024,
    title: "Enchente de 2024 em Pelotas e no Laranjal",
    path: "/enchente-2024-pelotas-laranjal",
    status: "Registro contemporâneo consolidado",
    summary:
      "A água percorreu o Estado, passou pelo Guaíba e avançou pela Lagoa dos Patos até atingir Pelotas dias depois do pico em Porto Alegre.",
    research: "A página mostra esse caminho, os principais impactos e como interpretar os níveis registrados durante a emergência.",
  },
] as const;

export function FloodHistoryIndexPage() {
  return (
    <article className="tp-flood-index">
      <section className="tp-flood-index-hero" aria-labelledby="tp-flood-index-title">
        <span>Arquivo climático e hidrológico de Pelotas</span>
        <h1 id="tp-flood-index-title">História das enchentes em Pelotas</h1>
        <p>
          Este arquivo foi pensado para estudantes, moradores e pesquisadores, mas você não precisa
          entender de meteorologia ou hidrologia para começar. Escolha um ano e veja primeiro o que
          aconteceu em linguagem direta; as medições, documentos e detalhes técnicos ficam disponíveis
          para quem quiser aprofundar.
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
          <h2 id="tp-flood-index-guide-title">Como ler as páginas sem se perder nos números</h2>
        </div>
        <div>
          <p>
            Primeiro leia o resumo em linguagem simples. Depois, se quiser conferir a origem de um
            número, avance para a linha do tempo e para as fontes. Cada página informa quando algo vem
            de fonte oficial, imprensa contemporânea, pesquisa acadêmica, documento histórico ou
            memória de moradores. Quando uma informação não foi localizada, a lacuna permanece
            identificada em vez de ser preenchida por estimativa.
          </p>
          <ul>
            <li>
              “2,20 m” ou “3,04 m” normalmente é a leitura de uma régua em um ponto específico, não
              a altura da água em todas as casas;
            </li>
            <li>
              duas réguas podem começar de pontos diferentes, por isso números de locais diferentes
              não devem ser comparados diretamente;
            </li>
            <li>
              em termos técnicos: não compare cotas de anos diferentes sem saber estação, régua,
              datum e referência;
            </li>
            <li>um número publicado em determinado horário representa aquele momento da cheia;</li>
            <li>quando uma fonte antiga desapareceu da internet, a página informa essa limitação.</li>
          </ul>
        </div>
      </section>

      <section className="tp-flood-index-method" aria-labelledby="tp-flood-index-method-title">
        <div>
          <span>Por que guardamos tantos detalhes?</span>
          <h2 id="tp-flood-index-method-title">Para contar a história sem transformar dúvida em certeza</h2>
        </div>
        <div>
          <p>
            Muitos documentos antigos de Pelotas hoje só aparecem em páginas quebradas, índices de
            jornais, cópias salvas ou serviços de arquivamento. O Tempo Pelotas organiza essas pistas
            para que uma pesquisa escolar ou técnica não precise começar por arqueologia digital.
          </p>
          <p>
            Quando dois documentos discordam, mostramos a diferença e explicamos o que cada um diz.
            Quando falta uma informação, dizemos que ela falta. Assim a página continua fácil de ler
            sem fingir uma precisão que as fontes não oferecem.
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
