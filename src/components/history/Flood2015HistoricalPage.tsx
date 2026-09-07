import { Link } from "@tanstack/react-router";
import {
  Archive,
  BookOpen,
  CalendarDays,
  CloudRain,
  ExternalLink,
  FileText,
  Ruler,
  ShieldCheck,
  Users,
  Waves,
  Wrench,
} from "lucide-react";

import {
  FLOOD_2015_ARCHIVE,
  FLOOD_2015_KEY_FACTS,
  FLOOD_2015_SOURCES,
  FLOOD_2015_TIMELINE,
} from "@/lib/content/flood-2015-pelotas";

import "./Flood2015HistoricalPage.css";
import "./Flood2024HistoricalPage.css";
import "./FloodHistoricalVisualSystem.css";

const FACT_ICONS = [CloudRain, Ruler, Users] as const;
const TIMELINE_ICON_BY_STAGE = {
  lagoa: Waves,
  pelotas: ShieldCheck,
} as const;

const PAGE_INDEX_ITEMS = [
  { href: "#como-a-cheia-se-formou", label: "Como a cheia se formou", icon: Waves },
  { href: "#linha-do-tempo-2015", label: "Linha do tempo", icon: CalendarDays },
  { href: "#arquivo-boletins-2015", label: "Boletins de 2015", icon: Archive },
  { href: "#por-que-nao-drenava", label: "Por que a água não baixava", icon: Waves },
  { href: "#impactos-e-resposta", label: "Impactos e resposta", icon: ShieldCheck },
  { href: "#como-ler-os-niveis", label: "Como ler os níveis", icon: Ruler },
  { href: "#fontes-2015", label: "Documentos e fontes", icon: BookOpen },
] as const;

export function Flood2015Hero() {
  return (
    <section className="tp-flood-hero" aria-labelledby="tp-flood-2015-hero-title">
      <div className="tp-flood-hero__inner">
        <div className="tp-flood-hero__copy">
          <span>Pelotas · outubro e novembro de 2015</span>
          <h1 id="tp-flood-2015-hero-title">Enchente de 2015 em Pelotas</h1>
          <p>
            Em outubro de 2015, chuva muito acima da média, níveis altos na Lagoa dos Patos e no
            Canal São Gonçalo e vento desfavorável ao escoamento deixaram áreas de Pelotas alagadas.
            Laranjal, Z3, Barra e outros pontos baixos tiveram resgates, interrupções e obras de
            emergência durante várias semanas.
          </p>
        </div>

        <div className="tp-flood-hero__summary" aria-label="Marcos documentados da cheia de 2015">
          {FLOOD_2015_KEY_FACTS.map((fact, index) => {
            const FactIcon = FACT_ICONS[index] ?? FileText;
            return (
              <div key={fact.label}>
                <div className="tp-flood-visual-fact__label">
                  <FactIcon className="tp-flood-visual-icon" aria-hidden="true" />
                  <span>{fact.label}</span>
                </div>
                <strong>{fact.value}</strong>
                <small>{fact.detail}</small>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Flood2015HistoricalPage() {
  return (
    <article className="tp-flood-history">
      <nav className="tp-flood-history__index tp-flood-visual-index" aria-label="Nesta página">
        <span>Nesta página</span>
        {PAGE_INDEX_ITEMS.map((item) => {
          const ItemIcon = item.icon;
          return (
            <a href={item.href} key={item.href}>
              <ItemIcon className="tp-flood-visual-icon" aria-hidden="true" />
              {item.label}
            </a>
          );
        })}
      </nav>

      <section className="tp-flood-history__lead" id="como-a-cheia-se-formou">
        <div>
          <span className="tp-flood-visual-kicker">
            <Waves className="tp-flood-visual-icon" aria-hidden="true" />
            Como a cheia se formou
          </span>
          <h2>Não foi apenas a chuva que caiu em Pelotas</h2>
        </div>
        <div className="tp-flood-history__lead-copy">
          <p>
            Enquanto chovia muito em Pelotas e na região, água da Lagoa Mirim e dos rios Piratini e
            Jaguarão chegava ao Canal São Gonçalo. Ao mesmo tempo, água vinda do Guaíba avançava pela
            Lagoa dos Patos em direção ao sul.
          </p>
          <p>
            O vento nordeste também dificultava a saída da água da Lagoa para o mar. Com a Lagoa e o
            Canal altos, bairros e balneários mais baixos tinham menos capacidade para escoar a água.
          </p>
          <p>
            Nos boletins municipais, a Estação da Embrapa aparece com 299 mm de chuva em outubro até
            o dia 20. No mesmo registro, a média citada para todo o mês era de 101 mm.
          </p>
        </div>

        <div className="tp-flood-history__chain">
          <strong>
            chuva intensa + água chegando de outras bacias + Lagoa e Canal altos + vento desfavorável
            → alagamentos nas áreas mais baixas
          </strong>
          <p>
            As águas chegaram por caminhos diferentes, mas o efeito local foi o mesmo: a Lagoa e o
            Canal já estavam altos e havia pouca capacidade para receber a água que precisava sair das
            áreas urbanas.
          </p>
        </div>
      </section>

      <section
        className="tp-flood-timeline"
        id="linha-do-tempo-2015"
        aria-labelledby="tp-flood-2015-timeline-title"
      >
        <header>
          <span className="tp-flood-visual-kicker">
            <CalendarDays className="tp-flood-visual-icon" aria-hidden="true" />
            Linha do tempo
          </span>
          <h2 id="tp-flood-2015-timeline-title">Dos primeiros sinais à recuperação</h2>
          <p>
            Os boletins municipais foram publicados com frequência durante a emergência. As medições
            abaixo mantêm a data, o horário e a origem informados em cada registro.
          </p>
        </header>

        <div className="tp-flood-timeline__list">
          {FLOOD_2015_TIMELINE.map((item) => {
            const TimelineIcon = TIMELINE_ICON_BY_STAGE[item.stage];
            return (
              <section className={`tp-flood-event is-${item.stage}`} key={`${item.date}-${item.title}`}>
                <div className="tp-flood-event__date">
                  <span className="tp-flood-visual-event-icon" aria-hidden="true">
                    <TimelineIcon className="tp-flood-visual-icon" />
                  </span>
                  <span>{item.date}</span>
                  <strong>{item.stageLabel}</strong>
                </div>
                <div className="tp-flood-event__body">
                  <h3>{item.title}</h3>
                  {item.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {item.measurements?.length ? (
                    <dl className="tp-flood-event__measurements" aria-label={`Medições de ${item.date}`}>
                      {item.measurements.map((measurement) => (
                        <div key={`${measurement.label}-${measurement.value}`}>
                          <dt>{measurement.label}</dt>
                          <dd>{measurement.value}</dd>
                          {measurement.detail ? <small>{measurement.detail}</small> : null}
                        </div>
                      ))}
                    </dl>
                  ) : null}
                  {item.highlight ? <b className="tp-flood-event__highlight">{item.highlight}</b> : null}
                </div>
              </section>
            );
          })}
        </div>
      </section>

      <section
        className="tp-flood-sources"
        id="arquivo-boletins-2015"
        aria-labelledby="tp-flood-2015-archive-title"
      >
        <div>
          <h2 id="tp-flood-2015-archive-title">Quase todos os dias tiveram novas atualizações</h2>
        </div>
        <div>
          <p>
            O arquivo municipal preserva a sequência de publicações da época. Alguns boletins ainda
            estão disponíveis por inteiro; em outros casos, restou apenas o registro de que a
            publicação existiu.
          </p>
          <div className="tp-flood-archive" role="list" aria-label="Boletins de 2015 localizados no arquivo municipal">
            {FLOOD_2015_ARCHIVE.map((entry) => (
              <section className="tp-flood-archive__entry" role="listitem" key={entry.date}>
                <div>
                  <strong>{entry.date}</strong>
                  <span className={`is-${entry.retrieval}`}>
                    {entry.retrieval === "full" ? "texto completo" : "só registro encontrado"}
                  </span>
                </div>
                <ul>
                  {entry.publications.map((publication) => (
                    <li key={publication}>{publication}</li>
                  ))}
                </ul>
                <p>{entry.note}</p>
              </section>
            ))}
          </div>
          <p className="tp-flood-archive__caveat">
            Quando falta o texto completo, nenhum valor é preenchido por suposição. Informações
            recuperadas em jornais continuam identificadas pela fonte que as publicou.
          </p>
        </div>
      </section>

      <section className="tp-flood-explanation" id="por-que-nao-drenava">
        <div>
          <span className="tp-flood-visual-kicker">
            <Waves className="tp-flood-visual-icon" aria-hidden="true" />
            Por que a água não baixava
          </span>
          <h2>Bombear não resolve quando o lugar que recebe a água também está alto</h2>
        </div>
        <div>
          <p>
            O boletim de 19 de outubro explica que os canais do Laranjal precisavam descarregar água
            em um sistema que também estava com o nível elevado.
          </p>
          <p>
            Com Lagoa dos Patos e Canal São Gonçalo altos, as áreas mais baixas recebiam água ao mesmo
            tempo em que tinham dificuldade para escoá-la. Por isso, casas de bombas sozinhas não
            resolveriam o problema naquele momento.
          </p>
          <blockquote>
            Em 2015, o problema não era apenas tirar água das ruas: também era preciso ter para onde
            essa água pudesse sair.
          </blockquote>
        </div>
      </section>

      <section className="tp-flood-lessons" id="impactos-e-resposta">
        <div>
          <h2>Resgates, abrigos, energia interrompida e obras de emergência</h2>
        </div>
        <div>
          <p>
            O balanço municipal registrou aproximadamente 1.300 famílias atendidas ao longo de toda a
            ocorrência. Esse total não significa que 1.300 famílias ficaram desabrigadas ao mesmo
            tempo.
          </p>
          <p>
            Os registros incluem resgates no Laranjal e na Z3, isolamento da Barra, transbordamento
            do Arroio Sujo, interrupção preventiva de energia em 1.956 moradias e um dique emergencial
            de aproximadamente 2 km no Valverde.
          </p>
          <p>
            Jornais da época ajudam a preencher pontos em que o arquivo municipal está incompleto.
            Quando um dado vem de jornal, essa origem permanece indicada.
          </p>
          <ul className="tp-flood-visual-list">
            {[
              "Prefeitura em alerta e evacuações na Z3 já em 14 de outubro;",
              "pico crítico situado entre 18 e 19 de outubro;",
              "Situação de Emergência decretada em 20 de outubro;",
              "acesso de ônibus à Z3 retomado em 23 de outubro;",
              "dique emergencial iniciado no Pontal da Barra em 25 de outubro;",
              "reconhecimento federal divulgado em 28 de outubro;",
              "plantão especial da Defesa Civil encerrado em 4 de novembro;",
              "abrigos desativados e limpeza intensificada em 5 de novembro;",
              "balanço consolidado publicado em 6 de novembro.",
            ].map((text, index) => (
              <li key={text}>
                <span className="tp-flood-visual-list-icon" aria-hidden="true">
                  {index < 3 ? <ShieldCheck className="tp-flood-visual-icon" /> : <Wrench className="tp-flood-visual-icon" />}
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="tp-flood-explanation" id="como-ler-os-niveis">
        <div>
          <h2>Números de lugares diferentes não são a mesma medição</h2>
        </div>
        <div>
          <p>
            Os boletins registraram valores diferentes ao longo dos dias. O balanço de 6 de novembro
            é a fonte usada para identificar o período mais crítico e a marca de 2,20 m no Canal São
            Gonçalo.
          </p>
          <p>
            Para a Lagoa, o mesmo balanço informa que uma régua de 1,80 m ficou submersa. Isso mostra
            que a água passou do limite daquela régua, mas não permite afirmar qual foi o nível máximo
            exato acima de 1,80 m.
          </p>
          <p>
            A leitura de 2,10 m na Casa de Bombas do Porto, em 14 de outubro, pertence a outra régua.
            Ela não é tratada como se fosse a mesma medição da Lagoa ou do Canal São Gonçalo.
          </p>
          <p>
            Para comparar esses números com medições atuais, é preciso saber onde cada nível foi
            medido e qual referência aquela régua usava.
          </p>
          <p>
            O G1 publicou, citando a Defesa Civil, que a Lagoa teria chegado a “2,25 m acima do
            normal”. Como a reportagem não informa qual régua nem o que significava “normal”, esse
            número permanece como informação atribuída à reportagem, e não como uma medição confirmada
            da Lagoa.
          </p>
        </div>
      </section>

      <section className="tp-flood-sources" id="fontes-2015" aria-labelledby="tp-flood-2015-sources-title">
        <div>
          <h2 id="tp-flood-2015-sources-title">Onde os registros de 2015 foram encontrados</h2>
        </div>
        <div>
          <p>
            A maior parte dos registros vem da série “Cheias 2015” da Prefeitura de Pelotas. G1 e GZH
            completam momentos em que o arquivo municipal não preservou todo o texto. Cada informação
            continua ligada à fonte que a publicou.
          </p>
          <div className="tp-flood-related__links">
            {FLOOD_2015_SOURCES.map((source) => (
              <a className="tp-flood-visual-source-link" href={source.url} target="_blank" rel="noreferrer" key={`${source.date}-${source.url}`}>
                <span className="tp-flood-visual-source-icon" aria-hidden="true">
                  <FileText className="tp-flood-visual-icon" />
                </span>
                <span>
                  {source.name}<br />
                  <small>{source.organization} · {source.date} · {source.role}</small>
                </span>
                <span className="tp-flood-visual-source-external" aria-hidden="true">
                  <ExternalLink className="tp-flood-visual-icon" />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="tp-flood-related" aria-label="Continue consultando">
        <div>
          <h2>Veja outras enchentes e os níveis de hoje</h2>
        </div>
        <div className="tp-flood-related__links">
          <Link to="/enchente-1941-pelotas">
            Enchente de 1941 em Pelotas <span aria-hidden="true">→</span>
          </Link>
          <Link to="/enchente-2001-pelotas">
            Enchente de 2001 em Pelotas e no Laranjal <span aria-hidden="true">→</span>
          </Link>
          <Link to="/enchente-2024-pelotas-laranjal">
            Enchente de 2024 em Pelotas e no Laranjal <span aria-hidden="true">→</span>
          </Link>
          <Link to="/situacao-hidrologica-pelotas">
            Situação atual das águas <span aria-hidden="true">→</span>
          </Link>
          <Link to="/nivel-da-lagoa-dos-patos-laranjal">
            Nível atual no Laranjal <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </article>
  );
}
