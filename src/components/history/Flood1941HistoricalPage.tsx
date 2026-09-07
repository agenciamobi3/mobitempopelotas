import { Link } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  BookOpen,
  CalendarDays,
  Camera,
  Clock,
  ExternalLink,
  FileText,
  MapPin,
  MapPinned,
  Ruler,
  ShieldCheck,
  Waves,
} from "lucide-react";

import {
  FLOOD_1941_KEY_FACTS,
  FLOOD_1941_SOURCES,
  FLOOD_1941_TIMELINE,
} from "@/lib/content/flood-1941-pelotas";

import "./Flood2024HistoricalPage.css";
import "./Flood1941HistoricalPage.css";

const FACT_ICONS = [Ruler, Camera, CalendarDays] as const;

const PAGE_INDEX_ITEMS = [
  { href: "#o-que-aconteceu-1941", label: "O que aconteceu", icon: MapPin },
  { href: "#marca-de-288", label: "De onde vêm os 2,88 m", icon: Ruler },
  { href: "#linha-do-tempo-1941", label: "Maio e junho de 1941", icon: CalendarDays },
  { href: "#comparacao-2024", label: "Comparação com 2024", icon: ArrowLeftRight },
  { href: "#fontes-1941", label: "Fontes", icon: BookOpen },
] as const;

const TIMELINE_ICONS = [Waves, Camera, Clock, CalendarDays, ArrowLeftRight] as const;

const COMPARISON_POINTS = [
  {
    icon: Camera,
    text: "em 1941, a reconstrução depende principalmente de fotos e documentos antigos;",
  },
  {
    icon: Waves,
    text: "em 2024, havia muito mais medições e registros feitos durante a emergência;",
  },
  {
    icon: Ruler,
    text: "um nível medido no Canal não representa a altura da água em toda a cidade;",
  },
  {
    icon: ShieldCheck,
    text: "para decisões de segurança, sempre valem os alertas e as medições atuais.",
  },
] as const;

export function Flood1941Hero() {
  return (
    <section className="tp-flood-hero" aria-labelledby="tp-flood-1941-hero-title">
      <div className="tp-flood-hero__inner">
        <div className="tp-flood-hero__copy">
          <span>Pelotas · maio de 1941</span>
          <h1 id="tp-flood-1941-hero-title">Enchente de 1941 em Pelotas</h1>
          <p>
            Em 1941, uma grande enchente deixou ruas e áreas próximas ao Canal São Gonçalo alagadas
            por semanas. Fotos antigas e documentos preservados ajudam a mostrar até onde a água
            chegou e como a cidade viveu aquele período.
          </p>
        </div>

        <div className="tp-flood-hero__summary" aria-label="Principais informações documentadas sobre 1941">
          {FLOOD_1941_KEY_FACTS.map((fact, index) => {
            const FactIcon = FACT_ICONS[index] ?? FileText;

            return (
              <div className="tp-flood-1941-fact" key={fact.label}>
                <div className="tp-flood-1941-fact__label">
                  <FactIcon className="tp-flood-1941-icon" aria-hidden="true" />
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

export function Flood1941HistoricalPage() {
  return (
    <article className="tp-flood-history">
      <nav className="tp-flood-history__index tp-flood-1941-index" aria-label="Nesta página">
        <span>Nesta página</span>
        {PAGE_INDEX_ITEMS.map((item) => {
          const ItemIcon = item.icon;

          return (
            <a href={item.href} key={item.href}>
              <ItemIcon className="tp-flood-1941-icon" aria-hidden="true" />
              {item.label}
            </a>
          );
        })}
      </nav>

      <section className="tp-flood-history__lead" id="o-que-aconteceu-1941">
        <div>
          <span className="tp-flood-1941-kicker">
            <MapPin className="tp-flood-1941-icon" aria-hidden="true" />
            Maio e junho de 1941
          </span>
          <h2>Partes de Pelotas ficaram alagadas por semanas</h2>
        </div>
        <div className="tp-flood-history__lead-copy">
          <p>
            O Museu da Universidade Católica de Pelotas preserva 61 fotografias em preto e branco da
            enchente de 1941 no acervo Nelson Nobre Magalhães. Muitas fotos têm anotações antigas com
            datas e locais.
          </p>
          <p>
            As imagens mostram pontos como a Praça do Porto e a antiga Alfândega. Também há registros
            de ruas ainda alagadas no fim de maio e no início de junho.
          </p>
          <p>
            Em 2024, pesquisadores da Universidade Federal de Pelotas voltaram a estudar essas fotos.
            Eles usaram lugares que ainda existem para calcular até onde a água havia chegado em 1941
            e conferir a antiga marca do Canal São Gonçalo.
          </p>
          <p>
            Os registros ajudam a entender o que aconteceu em alguns pontos de Pelotas. Eles não
            mostram que toda a cidade, o Laranjal ou a Lagoa dos Patos tiveram a mesma altura de água.
          </p>
        </div>

        <div className="tp-flood-history__chain tp-flood-1941-discovery">
          <span className="tp-flood-1941-discovery__icon" aria-hidden="true">
            <Camera className="tp-flood-1941-icon" />
          </span>
          <div className="tp-flood-1941-discovery__copy">
            <strong>
              Uma foto antiga da Praça do Porto mostrou um ponto que ainda existe. Esse local ajudou no
              cálculo da altura da água em 1941.
            </strong>
            <p>
              Depois, os pesquisadores encontraram a mesma marca de 2,88 m em um mapa de 1940. Isso deu
              mais segurança à comparação usada no Canal São Gonçalo.
            </p>
          </div>
        </div>
      </section>

      <section className="tp-flood-explanation" id="marca-de-288">
        <div>
          <span className="tp-flood-1941-kicker">
            <Ruler className="tp-flood-1941-icon" aria-hidden="true" />
            Canal São Gonçalo
          </span>
          <h2>De onde vem a marca de 2,88 metros</h2>
        </div>
        <div>
          <p>
            Uma fotografia mostra a Praça do Porto alagada, com o antigo prédio da Alfândega ao fundo.
            Como o prédio ainda existe, ele serviu de ponto de referência para estimar a altura que a
            água alcançou em 1941.
          </p>

          <div className="tp-flood-1941-method" aria-label="Como a marca de 2,88 metros foi conferida">
            <span>
              <Camera className="tp-flood-1941-icon" aria-hidden="true" />
              Foto de 1941
            </span>
            <b aria-hidden="true">→</b>
            <span>
              <MapPin className="tp-flood-1941-icon" aria-hidden="true" />
              Alfândega
            </span>
            <b aria-hidden="true">→</b>
            <span>
              <Ruler className="tp-flood-1941-icon" aria-hidden="true" />
              Cálculo
            </span>
            <b aria-hidden="true">→</b>
            <span>
              <MapPinned className="tp-flood-1941-icon" aria-hidden="true" />
              Mapa de 1940
            </span>
          </div>

          <p>
            Depois do cálculo, os pesquisadores encontraram um mapa de 1940 que também mostrava a marca
            de 2,88 metros. A mesma informação em duas fontes diferentes reforçou o resultado.
          </p>
          <p>
            Os 2,88 m pertencem à referência usada no Canal São Gonçalo. Esse número não significa que
            havia 2,88 m de água em todas as ruas ou casas de Pelotas e não pode ser tratado como se
            fosse a mesma medição do Laranjal, do Guaíba ou de outras estações.
          </p>
          <blockquote>
            Para comparar duas enchentes, é preciso saber onde e como cada nível foi medido.
          </blockquote>
        </div>
      </section>

      <section className="tp-flood-timeline" id="linha-do-tempo-1941" aria-labelledby="tp-flood-1941-timeline-title">
        <header>
          <span className="tp-flood-1941-kicker">
            <CalendarDays className="tp-flood-1941-icon" aria-hidden="true" />
            Maio e junho de 1941
          </span>
          <h2 id="tp-flood-1941-timeline-title">O que as fotos e os documentos mostram ao longo das semanas</h2>
          <p>
            Nem todos os dias de 1941 têm registros preservados. Por isso, a linha do tempo mostra
            somente as datas e os períodos que aparecem nas fotos e nos documentos encontrados.
          </p>
        </header>

        <div className="tp-flood-timeline__list">
          {FLOOD_1941_TIMELINE.map((item, index) => {
            const TimelineIcon = TIMELINE_ICONS[index] ?? CalendarDays;

            return (
              <section className="tp-flood-event is-pelotas" key={`${item.date}-${item.title}`}>
                <div className="tp-flood-event__date">
                  <span className="tp-flood-1941-event-icon" aria-hidden="true">
                    <TimelineIcon className="tp-flood-1941-icon" />
                  </span>
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
            );
          })}
        </div>
      </section>

      <section className="tp-flood-lessons" id="comparacao-2024">
        <div>
          <span className="tp-flood-1941-kicker">
            <ArrowLeftRight className="tp-flood-1941-icon" aria-hidden="true" />
            1941 e 2024
          </span>
          <h2>Em 2024, o Canal voltou à marca de 2,88 m e depois passou dela</h2>
        </div>
        <div>
          <p>
            Em 12 de maio de 2024, a Prefeitura informou que o Canal São Gonçalo havia chegado a
            2,88 metros, a mesma marca ligada à enchente de 1941. Em 15 de maio, a leitura chegou a
            2,89 metros.
          </p>
          <p>
            A comparação é útil porque usa a referência do Canal São Gonçalo. Números medidos em
            outros lugares não podem ser comparados diretamente como se fossem a mesma régua.
          </p>
          <ul className="tp-flood-1941-comparison-list">
            {COMPARISON_POINTS.map((item) => {
              const PointIcon = item.icon;

              return (
                <li key={item.text}>
                  <span className="tp-flood-1941-comparison-list__icon" aria-hidden="true">
                    <PointIcon className="tp-flood-1941-icon" />
                  </span>
                  <span>{item.text}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="tp-flood-sources" id="fontes-1941" aria-labelledby="tp-flood-1941-sources-title">
        <div>
          <span className="tp-flood-1941-kicker">
            <BookOpen className="tp-flood-1941-icon" aria-hidden="true" />
            Fontes
          </span>
          <h2 id="tp-flood-1941-sources-title">De onde vêm as informações desta página</h2>
        </div>
        <div>
          <p>
            Esta página usa fotos preservadas por universidades, pesquisas acadêmicas e documentos
            oficiais da Prefeitura de Pelotas. Quando uma informação não pôde ser confirmada, ela não
            foi apresentada como fato.
          </p>
          <div className="tp-flood-related__links">
            {FLOOD_1941_SOURCES.map((source) => (
              <a className="tp-flood-1941-source-link" href={source.url} target="_blank" rel="noreferrer" key={source.url}>
                <span className="tp-flood-1941-source-icon" aria-hidden="true">
                  <FileText className="tp-flood-1941-icon" />
                </span>
                <span>
                  {source.name}<br />
                  <small>{source.organization} · {source.role}</small>
                </span>
                <span className="tp-flood-1941-source-external" aria-hidden="true">
                  <ExternalLink className="tp-flood-1941-icon" />
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
