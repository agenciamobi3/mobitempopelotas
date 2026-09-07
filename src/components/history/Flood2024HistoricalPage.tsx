import { Link } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  BookOpen,
  Building2,
  CalendarDays,
  Clock,
  CloudRain,
  FileText,
  MapPin,
  Route,
  Ruler,
  ShieldCheck,
  Waves,
  Wind,
} from "lucide-react";

import {
  FLOOD_2024_HYDROLOGICAL_PATH,
  FLOOD_2024_SOURCE_ORGANIZATIONS,
  FLOOD_2024_TIMELINE,
} from "@/lib/content/flood-2024-pelotas";

import "./Flood2024HistoricalPage.css";
import "./FloodHistoricalVisualSystem.css";

const HERO_FACT_ICONS = [Ruler, Clock, Building2] as const;
const TIMELINE_ICON_BY_STAGE = {
  "centro-norte": CloudRain,
  rios: Waves,
  guaiba: Waves,
  lagoa: Waves,
  pelotas: MapPin,
  estuario: Wind,
  retorno: Building2,
} as const;

const PAGE_INDEX_ITEMS = [
  { href: "#como-a-agua-chegou", label: "Como a água chegou", icon: Waves },
  { href: "#linha-do-tempo", label: "Linha do tempo", icon: CalendarDays },
  { href: "#por-que-pelotas-inundou", label: "Por que Pelotas inundou depois", icon: Clock },
  { href: "#caminho-da-cheia", label: "Caminho da cheia", icon: Route },
  { href: "#outros-eventos-historicos", label: "2001 e 2015", icon: ArrowLeftRight },
  { href: "#ensinamentos", label: "O que 2024 mostrou", icon: ShieldCheck },
] as const;

export function Flood2024Hero() {
  const facts = [
    {
      label: "Canal São Gonçalo",
      value: "3,04 m",
      detail: "maior valor registrado pela régua usada na emergência",
    },
    {
      label: "Sala de Situação",
      value: "28 dias",
      detail: "de operação coletiva durante a fase mais crítica",
    },
    {
      label: "UBS Laranjal",
      value: "54 dias",
      detail: "entre o fechamento pela inundação e a reabertura",
    },
  ] as const;

  return (
    <section className="tp-flood-hero" aria-labelledby="tp-flood-hero-title">
      <div className="tp-flood-hero__inner">
        <div className="tp-flood-hero__copy">
          <span>Pelotas · abril a julho de 2024</span>
          <h1 id="tp-flood-hero-title">Enchente de 2024 em Pelotas e no Laranjal</h1>
          <p>
            A enchente de 2024 chegou a Pelotas depois de atingir outras partes do Rio Grande do Sul.
            A água passou pelo Guaíba, avançou pela Lagoa dos Patos e, dias depois, elevou os níveis no
            Laranjal, no Canal São Gonçalo e em outras áreas baixas do município.
          </p>
        </div>

        <div className="tp-flood-hero__summary" aria-label="Marcos do evento">
          {facts.map((fact, index) => {
            const FactIcon = HERO_FACT_ICONS[index] ?? FileText;
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

function HydrologicalPath() {
  return (
    <div className="tp-flood-path" aria-label="Caminho da cheia de 2024">
      {FLOOD_2024_HYDROLOGICAL_PATH.map((item, index) => (
        <div className="tp-flood-path__step" key={item}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <strong>{item}</strong>
          {index < FLOOD_2024_HYDROLOGICAL_PATH.length - 1 ? (
            <b aria-hidden="true">↓</b>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function Flood2024HistoricalPage() {
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

      <section className="tp-flood-history__lead" id="como-a-agua-chegou">
        <div>
          <span className="tp-flood-visual-kicker">
            <Waves className="tp-flood-visual-icon" aria-hidden="true" />
            Como a água chegou até Pelotas
          </span>
          <h2>A água percorreu centenas de quilômetros antes de chegar ao sul do Estado</h2>
        </div>
        <div className="tp-flood-history__lead-copy">
          <p>
            Dias antes de Pelotas entrar na fase mais crítica, chuvas extremas já haviam elevado rios
            como Taquari, Caí, Sinos e Jacuí. Essa água chegou ao Guaíba e provocou níveis históricos
            na região de Porto Alegre.
          </p>
          <p>
            Depois, a água seguiu para a Lagoa dos Patos e avançou lentamente para o sul. Arambaré,
            São Lourenço do Sul, Pelotas, São José do Norte e Rio Grande sentiram esse avanço em
            momentos diferentes.
          </p>
          <p>
            Em Pelotas, a Lagoa já alta se combinou com chuva local, água do Canal São Gonçalo e da
            Lagoa Mirim, direção dos ventos, maré e condições de saída da água por Rio Grande.
          </p>
          <p>
            O resultado foi uma inundação prolongada em áreas baixas, incluindo Laranjal, Colônia Z3,
            Pontal da Barra e regiões próximas ao Canal São Gonçalo.
          </p>
        </div>

        <div className="tp-flood-history__chain">
          <strong>
            chuvas extremas no RS → rios da Bacia do Guaíba → Guaíba → Lagoa dos Patos → Pelotas e
            Laranjal → Rio Grande → Oceano Atlântico
          </strong>
          <p>
            Por isso Pelotas ainda aguardava a chegada de parte desse volume quando Porto Alegre já
            enfrentava seu período mais crítico.
          </p>
        </div>
      </section>

      <section className="tp-flood-timeline" id="linha-do-tempo" aria-labelledby="tp-flood-timeline-title">
        <header>
          <span className="tp-flood-visual-kicker">
            <CalendarDays className="tp-flood-visual-icon" aria-hidden="true" />
            Linha do tempo
          </span>
          <h2 id="tp-flood-timeline-title">Da chuva extrema ao retorno das famílias</h2>
          <p>
            A linha do tempo mostra onde estava o problema em cada momento, desde o avanço da água
            pelo Estado até a drenagem e a recuperação em Pelotas.
          </p>
        </header>

        <div className="tp-flood-timeline__list">
          {FLOOD_2024_TIMELINE.map((item) => {
            const TimelineIcon = TIMELINE_ICON_BY_STAGE[item.stage];
            return (
              <section className={`tp-flood-event is-${item.stage}`} key={`${item.date}-${item.title}`}>
                <div className="tp-flood-event__date">
                  <span className="tp-flood-visual-event-icon" aria-hidden="true">
                    <TimelineIcon className="tp-flood-visual-icon" />
                  </span>
                  <span>{item.date}</span>
                  <small>Onde estava o problema</small>
                  <strong>{item.stageLabel}</strong>
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

      <section className="tp-flood-explanation" id="por-que-pelotas-inundou">
        <div>
          <span className="tp-flood-visual-kicker">
            <Clock className="tp-flood-visual-icon" aria-hidden="true" />
            Por que Pelotas inundou depois
          </span>
          <h2>A água levou dias para avançar do Guaíba até o sul da Lagoa</h2>
        </div>
        <div>
          <p>
            Grande parte da água que atingiu Pelotas já estava em movimento pelo Estado antes de
            chegar ao município.
          </p>
          <p>
            A Lagoa dos Patos precisou receber esse grande volume e levá-lo em direção a Rio Grande,
            principal caminho de saída para o Oceano Atlântico.
          </p>
          <p>
            Esse processo é lento. A Lagoa é extensa, a região é muito plana e, em alguns momentos,
            vento e maré dificultaram ainda mais a saída da água.
          </p>
          <p>
            Por isso, olhar apenas para a chuva que caía em Pelotas não mostrava todo o risco que se
            aproximava.
          </p>
          <blockquote>
            O que acontece no Guaíba pode aumentar o risco, dias depois, para comunidades do sul da
            Lagoa dos Patos.
          </blockquote>
        </div>
      </section>

      <section className="tp-flood-route" id="caminho-da-cheia">
        <header>
          <span className="tp-flood-visual-kicker">
            <Route className="tp-flood-visual-icon" aria-hidden="true" />
            Caminho da cheia de 2024
          </span>
          <h2>Do Centro e Norte do Estado até o Oceano Atlântico</h2>
          <p>
            O trajeto abaixo ajuda a entender por que o risco para Pelotas continuava mesmo depois do
            momento mais crítico em Porto Alegre.
          </p>
        </header>
        <HydrologicalPath />
      </section>

      <section
        className="tp-flood-timeline"
        id="outros-eventos-historicos"
        aria-labelledby="tp-flood-other-events-title"
      >
        <header>
          <span className="tp-flood-visual-kicker">
            <ArrowLeftRight className="tp-flood-visual-icon" aria-hidden="true" />
            2001 e 2015
          </span>
          <h2 id="tp-flood-other-events-title">As grandes enchentes de Pelotas não aconteceram do mesmo jeito</h2>
          <p>
            Em 2001, os registros destacam o vento muito forte e o avanço da Lagoa. Em 2015, chuva
            intensa, água vinda de outras bacias e vento desfavorável se combinaram com níveis altos
            na Lagoa e no Canal São Gonçalo.
          </p>
        </header>

        <div className="tp-flood-timeline__list">
          <section className="tp-flood-event is-lagoa">
            <div className="tp-flood-event__date">
              <span className="tp-flood-visual-event-icon" aria-hidden="true">
                <Wind className="tp-flood-visual-icon" />
              </span>
              <span>8 de outubro de 2001</span>
              <small>Evento histórico</small>
              <strong>Vento muito forte + Lagoa</strong>
            </div>
            <div className="tp-flood-event__body">
              <h3>Vento de 105 km/h e avanço das águas no Laranjal</h3>
              <p>
                A Folha de S.Paulo registrou um ciclone extratropical no Rio Grande do Sul. Em Pelotas,
                o vento chegou a 105 km/h, cerca de 3 mil pessoas ficaram isoladas na Colônia Z3 e as
                águas avançaram aproximadamente 600 metros para dentro do Laranjal.
              </p>
              <p>
                A documentação disponível para 2001 dá destaque especial ao vento e à resposta da
                Lagoa junto à costa de Pelotas. Por isso, aquele episódio não é tratado como uma cópia
                de 2024.
              </p>
              <b className="tp-flood-event__highlight">105 km/h em Pelotas · avanço de cerca de 600 m no Laranjal</b>
              <p>
                <Link to="/enchente-2001-pelotas">
                  Ver a página completa da enchente de 2001 <span aria-hidden="true">→</span>
                </Link>
              </p>
            </div>
          </section>

          <section className="tp-flood-event is-pelotas">
            <div className="tp-flood-event__date">
              <span className="tp-flood-visual-event-icon" aria-hidden="true">
                <CloudRain className="tp-flood-visual-icon" />
              </span>
              <span>18 a 22 de outubro de 2015</span>
              <small>Evento histórico</small>
              <strong>Chuva + água regional + vento</strong>
            </div>
            <div className="tp-flood-event__body">
              <h3>Chuva muito acima da média e níveis altos na Lagoa e no Canal</h3>
              <p>
                Até 20 de outubro, a Estação da Embrapa havia registrado 299 mm de chuva no mês,
                diante de uma média de 101 mm citada pela Prefeitura. O Município também apontou água
                chegando ao Canal São Gonçalo e à Lagoa dos Patos por diferentes caminhos.
              </p>
              <p>
                O balanço municipal posterior situou o período mais crítico entre 18 e 19 de outubro,
                registrou 2,20 m no São Gonçalo e cerca de 1.300 famílias atendidas ao longo do evento.
              </p>
              <b className="tp-flood-event__highlight">São Gonçalo: 2,20 m · cerca de 1.300 famílias atendidas</b>
              <p>
                <Link to="/enchente-2015-pelotas">
                  Ver a linha do tempo completa da enchente de 2015 <span aria-hidden="true">→</span>
                </Link>
              </p>
            </div>
          </section>
        </div>
      </section>

      <section className="tp-flood-lessons" id="ensinamentos">
        <div>
          <span className="tp-flood-visual-kicker">
            <ShieldCheck className="tp-flood-visual-icon" aria-hidden="true" />
            O que 2024 mostrou
          </span>
          <h2>Para acompanhar Pelotas, é preciso olhar além do Laranjal</h2>
        </div>
        <div>
          <p>O monitoramento precisa considerar vários pontos ao mesmo tempo:</p>
          <ul className="tp-flood-visual-list">
            {[
              "o Guaíba;",
              "a Lagoa dos Patos de norte a sul;",
              "o Canal São Gonçalo;",
              "a Lagoa Mirim;",
              "a chuva regional;",
              "os ventos;",
              "as condições de saída da água em Rio Grande.",
            ].map((text, index) => (
              <li key={text}>
                <span className="tp-flood-visual-list-icon" aria-hidden="true">
                  {index < 4 ? <Waves className="tp-flood-visual-icon" /> : <CloudRain className="tp-flood-visual-icon" />}
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
          <p>
            A água que pode ameaçar Pelotas amanhã pode estar hoje a centenas de quilômetros de
            distância. Foi uma das lições mais importantes da enchente de 2024.
          </p>
        </div>
      </section>

      <section className="tp-flood-sources" aria-labelledby="tp-flood-sources-title">
        <div>
          <span className="tp-flood-visual-kicker">
            <BookOpen className="tp-flood-visual-icon" aria-hidden="true" />
            Fontes
          </span>
          <h2 id="tp-flood-sources-title">De onde vêm as informações desta página</h2>
        </div>
        <div>
          <p>
            Esta página reúne informações publicadas durante e depois da enchente por órgãos públicos,
            instituições de pesquisa e sistemas de monitoramento. Os registros de 2001 e 2015 aparecem
            apenas como comparação histórica.
          </p>
          <p>
            Níveis medidos em lugares diferentes podem usar réguas e referências diferentes. Por isso,
            os números não são comparados diretamente sem verificar onde e como cada medição foi feita.
          </p>
          <div className="tp-flood-sources__organizations">
            {FLOOD_2024_SOURCE_ORGANIZATIONS.map((source) => (
              <span key={source}>{source}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="tp-flood-related" aria-label="Continue acompanhando">
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
          <Link to="/enchente-2015-pelotas">
            Enchente de 2015 em Pelotas <span aria-hidden="true">→</span>
          </Link>
          <Link to="/situacao-hidrologica-pelotas">
            Situação atual das águas <span aria-hidden="true">→</span>
          </Link>
          <Link to="/nivel-da-lagoa-dos-patos-laranjal">
            Nível e histórico do Laranjal <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </article>
  );
}
