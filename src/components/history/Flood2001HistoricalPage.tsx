import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarDays,
  ExternalLink,
  FileText,
  History,
  MapPin,
  Newspaper,
  Ruler,
  Search,
  Users,
  Waves,
  Wind,
  Wrench,
} from "lucide-react";

import {
  FLOOD_2001_KEY_FACTS,
  FLOOD_2001_RESEARCH_GAPS,
  FLOOD_2001_SOURCES,
  FLOOD_2001_TIMELINE,
} from "@/lib/content/flood-2001-pelotas";

import "./Flood2024HistoricalPage.css";
import "./Flood2001Hero.css";
import "./FloodHistoricalVisualSystem.css";

const FACT_ICONS = [CalendarDays, Wind, Waves, Users] as const;
const TIMELINE_ICONS = [Wind, Newspaper, Wrench, CalendarDays, History] as const;

const PAGE_INDEX_ITEMS = [
  { href: "#o-que-sabemos-2001", label: "O que aconteceu", icon: MapPin },
  { href: "#regua-laranjal-2001", label: "Nível no Laranjal", icon: Ruler },
  { href: "#mecanismo-vento-2001", label: "Por que a água avançou", icon: Wind },
  { href: "#linha-do-tempo-2001", label: "Linha do tempo", icon: CalendarDays },
  { href: "#fontes-e-limites-2001", label: "Como usamos as fontes", icon: BookOpen },
  { href: "#nao-confundir-setembro-2001", label: "Outro evento de 2001", icon: History },
  { href: "#lacunas-2001", label: "O que ainda buscamos", icon: Search },
  { href: "#fontes-2001", label: "Fontes", icon: FileText },
] as const;

export function Flood2001Hero() {
  return (
    <section className="tp-flood-hero" aria-labelledby="tp-flood-2001-hero-title">
      <div className="tp-flood-hero__inner">
        <div className="tp-flood-hero__copy">
          <span>Pelotas · outubro de 2001</span>
          <h1 id="tp-flood-2001-hero-title">Enchente de 2001 em Pelotas e no Laranjal</h1>
          <p>
            Na madrugada de 8 de outubro de 2001, um forte temporal atingiu Pelotas. Uma reportagem
            publicada no dia seguinte, citando meteorologistas, classificou o sistema como ciclone
            extratropical e registrou vento de 105 km/h. No Laranjal, as águas avançaram cerca de
            600 metros para dentro da área urbana, e aproximadamente 3 mil pessoas ficaram isoladas na
            Colônia Z3.
          </p>
        </div>

        <div className="tp-flood-hero__summary" aria-label="Marcos documentados do evento de 2001">
          {FLOOD_2001_KEY_FACTS.map((fact, index) => {
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

export function Flood2001HistoricalPage() {
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

      <section className="tp-flood-history__lead" id="o-que-sabemos-2001">
        <div>
          <span className="tp-flood-visual-kicker">
            <MapPin className="tp-flood-visual-icon" aria-hidden="true" />
            O que aconteceu
          </span>
          <h2>Vento muito forte, águas avançando e áreas isoladas</h2>
        </div>
        <div className="tp-flood-history__lead-copy">
          <p>
            Na madrugada de 8 de outubro, Pelotas teve vento de 105 km/h. A reportagem publicada no
            dia seguinte também registrou ondas de aproximadamente um metro na Lagoa dos Patos,
            avanço das águas por seis quadras no Laranjal, cerca de 600 metros, e aproximadamente
            3 mil pessoas isoladas na Colônia Z3.
          </p>
          <p>
            Duas semanas depois, a Prefeitura de Pelotas confirmou danos causados pelos fortes ventos
            e pela invasão das águas do Canal São Gonçalo e da Lagoa dos Patos. Equipes ainda
            trabalhavam na recuperação de acessos, drenagem e limpeza do balneário.
          </p>
          <p>
            Os documentos também preservam medições do nível da água no Laranjal. Como os arquivos
            mostram dois valores para o mesmo dia, essa diferença é apresentada separadamente na
            próxima seção, sem escolher um deles como se o outro não existisse.
          </p>
        </div>

        <div className="tp-flood-history__chain">
          <strong>
            vento muito forte → ondas na Lagoa → águas avançando no Laranjal → isolamento e danos
          </strong>
          <p>
            As fontes não mostram que toda Pelotas, o Laranjal e a Z3 tiveram a mesma altura de água.
            Os níveis medidos na régua do Laranjal são uma referência daquele ponto e são tratados
            separadamente abaixo.
          </p>
        </div>
      </section>

      <section className="tp-flood-explanation" id="regua-laranjal-2001">
        <div>
          <span className="tp-flood-visual-kicker">
            <Ruler className="tp-flood-visual-icon" aria-hidden="true" />
            Nível medido no Laranjal
          </span>
          <h2>Por que aparecem 2,90 m e 1,90 m no mesmo dia</h2>
        </div>
        <div>
          <p>
            Os arquivos da estação Laranjal 87955000 guardam duas versões da medição de 8 de outubro
            de 2001. A versão bruta, que preserva os registros antes da revisão da série, tem leituras
            de <strong>300 cm às 07h</strong> e <strong>280 cm às 17h</strong>, com média diária de
            <strong> 290 cm</strong>.
          </p>
          <p>
            A versão consistida, revisada posteriormente, registra <strong>190 cm</strong> para o mesmo
            dia e marca esse valor como <strong>estimado</strong>. Por isso, 2,90 m e 1,90 m não são
            duas réguas diferentes nem um erro do site. São duas versões preservadas da mesma série
            histórica, e o Tempo Pelotas mostra as duas.
          </p>
          <p>
            O histórico da estação informa que os dados fluviométricos foram alterados em
            <strong> 29/06/2018</strong> durante um trabalho de análise e consistência de dados da ANA.
            Esse registro ajuda a entender por que existe uma revisão, mas não explica sozinho por que
            o valor de 8 de outubro mudou exatamente 100 cm. Por isso, a página não inventa uma causa
            para essa diferença.
          </p>
          <p>
            Um relatório municipal de 2013, baseado em dados da ANA disponíveis à época, registra
            2,90 m em 08/10/2001. Com os arquivos Hidro atuais, esse valor pode ser identificado como
            compatível com a <strong>série bruta</strong>, enquanto a série consistida preserva
            <strong> 1,90 m como estimado</strong>.
          </p>
          <p>
            O histórico cadastral também mudou ao longo dos anos. Em 2017, o zero da régua passou a
            aparecer com altitude de <strong>-0,02 m</strong>, e em 2018 houve substituição e
            renumeração de lances da régua. Sem um documento que prove que essa referência vale para
            2001, o portal não usa o valor de 2017 para transformar os níveis antigos em altitude.
          </p>
          <p>
            Hoje também existem dois códigos relacionados ao Laranjal. A estação histórica
            <strong> 87955000</strong> deixou de ser classificada como telemétrica em 2026, enquanto a
            <strong> 87955001</strong> foi cadastrada como LARANJAL TELEMÉTRICA. Isso mostra que elas
            têm papéis diferentes, mas não prova que usam exatamente a mesma referência vertical.
          </p>
          <blockquote>
            Em 08/10/2001, a estação 87955000 preserva 2,90 m na série bruta e 1,90 m na série
            consistida, marcada como estimada. São níveis de uma régua naquele ponto, não a altura da
            água em todas as ruas do Laranjal.
          </blockquote>
        </div>
      </section>

      <section className="tp-flood-explanation" id="mecanismo-vento-2001">
        <div>
          <span className="tp-flood-visual-kicker">
            <Wind className="tp-flood-visual-icon" aria-hidden="true" />
            Por que a água avançou
          </span>
          <h2>O vento ajudou a empurrar a água para a costa de Pelotas</h2>
        </div>
        <div>
          <p>
            Um estudo da Faculdade de Meteorologia da UFPel analisou especificamente a inundação da
            costa oeste da Lagoa dos Patos em 8 de outubro de 2001 usando dados de vento e pressão dos
            dias anteriores ao evento.
          </p>
          <p>
            O estudo encontrou uma combinação de sistemas atmosféricos que reforçou os ventos de leste
            e nordeste sobre a região. Esses ventos ficaram mais fortes nos dias que antecederam o
            episódio extremo.
          </p>
          <p>
            Segundo os pesquisadores, o vento pode ter dificultado a saída da água da Lagoa dos Patos
            para o Oceano Atlântico e, ao mesmo tempo, empurrado água em direção à costa oeste. Esse
            mecanismo ajuda a explicar o avanço das águas no Laranjal, mas não muda a referência usada
            pela régua histórica.
          </p>
          <blockquote>
            O estudo ajuda a explicar como o episódio aconteceu. Os números registrados durante a
            enchente continuam atribuídos às fontes que os publicaram na época.
          </blockquote>
        </div>
      </section>

      <section className="tp-flood-timeline" id="linha-do-tempo-2001" aria-labelledby="tp-flood-2001-timeline-title">
        <header>
          <span className="tp-flood-visual-kicker">
            <CalendarDays className="tp-flood-visual-icon" aria-hidden="true" />
            Linha do tempo
          </span>
          <h2 id="tp-flood-2001-timeline-title">Do temporal à recuperação do Laranjal</h2>
          <p>
            Nem todos os dias têm registros preservados. Por isso, a linha do tempo mostra apenas as
            datas que aparecem nas fontes já encontradas.
          </p>
        </header>

        <div className="tp-flood-timeline__list">
          {FLOOD_2001_TIMELINE.map((item, index) => {
            const TimelineIcon = TIMELINE_ICONS[index] ?? CalendarDays;
            return (
              <section className="tp-flood-event is-lagoa" key={`${item.date}-${item.title}`}>
                <div className="tp-flood-event__date">
                  <span className="tp-flood-visual-event-icon" aria-hidden="true">
                    <TimelineIcon className="tp-flood-visual-icon" />
                  </span>
                  <span>{item.date}</span>
                  <small>Registro da época</small>
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

      <section className="tp-flood-explanation" id="fontes-e-limites-2001">
        <div>
          <span className="tp-flood-visual-kicker">
            <BookOpen className="tp-flood-visual-icon" aria-hidden="true" />
            Como usamos as fontes
          </span>
          <h2>Cada fonte conta uma parte do que aconteceu</h2>
        </div>
        <div>
          <p>
            A expressão “ciclone extratropical” aparece na reportagem da Folha de S.Paulo publicada
            no dia seguinte, que atribui essa classificação a meteorologistas. A Prefeitura, em seu
            comunicado de 22 de outubro, fala em fortes ventos, vendavais e invasão das águas.
          </p>
          <p>
            Em 2002, ao lembrar o evento do ano anterior, a Prefeitura usa a palavra “nordestão”,
            expressão local para o vento nordeste forte. Ela ajuda a registrar como pescadores e
            moradores descreviam o vento, mas não substitui a classificação meteorológica do sistema.
          </p>
          <p>
            Os arquivos da estação 87955000 acrescentam as medições do Laranjal. A versão bruta
            preserva 2,90 m em 08/10/2001; a versão consistida preserva 1,90 m e marca esse valor como
            estimado. As duas permanecem visíveis porque fazem parte da história do dado.
          </p>
          <p>
            O estudo da UFPel foi feito depois do evento e ajuda a explicar o papel dos ventos e da
            Lagoa. Ele não é tratado como um boletim emitido durante a emergência e não substitui os
            registros publicados em 2001.
          </p>
          <p>
            Um texto náutico publicado em 2005 também descreve, de forma geral, como o vento Nordeste
            pode elevar o nível da água na parte sul da Lagoa dos Patos. Ele ajuda a entender o
            mecanismo, mas não é usado como prova direta do que aconteceu em 8 de outubro de 2001.
          </p>
          <blockquote>
            Quando duas fontes dizem coisas diferentes, a página mostra a diferença e identifica de
            onde veio cada informação.
          </blockquote>
        </div>
      </section>

      <section className="tp-flood-lessons" id="nao-confundir-setembro-2001">
        <div>
          <span className="tp-flood-visual-kicker">
            <History className="tp-flood-visual-icon" aria-hidden="true" />
            Outro evento de 2001
          </span>
          <h2>As chuvas de agosto e setembro foram outro episódio</h2>
        </div>
        <div>
          <p>
            Existe um estudo sobre chuvas intensas em Pelotas entre 31 de agosto e 3 de setembro de
            2001. Ele descreve outra situação meteorológica. Até agora, não há documentação suficiente
            para tratar aquele episódio e a enchente de outubro como um único evento.
          </p>
          <p>
            Se novas fontes mostrarem uma ligação direta entre os dois períodos, esta página poderá ser
            atualizada. Por enquanto, eles permanecem separados.
          </p>
        </div>
      </section>

      <section className="tp-flood-lessons" id="lacunas-2001">
        <div>
          <span className="tp-flood-visual-kicker">
            <Search className="tp-flood-visual-icon" aria-hidden="true" />
            O que ainda buscamos
          </span>
          <h2>Algumas partes da história ainda não estão fechadas</h2>
        </div>
        <div>
          <p>
            Os arquivos bruto e consistido da ANA já foram recuperados. Ainda falta um documento que
            explique especificamente a mudança de 2,90 m para 1,90 m em 8 de outubro, além de mais
            informações sobre a referência da régua usada em 2001 e sua relação com a estação
            telemétrica atual.
          </p>
          <ul>
            {FLOOD_2001_RESEARCH_GAPS.map((gap) => (
              <li key={gap}>{gap}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="tp-flood-sources" id="fontes-2001" aria-labelledby="tp-flood-2001-sources-title">
        <div>
          <span className="tp-flood-visual-kicker">
            <BookOpen className="tp-flood-visual-icon" aria-hidden="true" />
            Fontes
          </span>
          <h2 id="tp-flood-2001-sources-title">De onde vêm as informações desta página</h2>
        </div>
        <div>
          <p>
            A página pode crescer quando novas fotos, jornais, boletins ou documentos forem
            encontrados. Quando uma informação ainda não foi confirmada, ela permanece indicada como
            dúvida em vez de ser preenchida por estimativa.
          </p>
          <div className="tp-flood-related__links">
            {FLOOD_2001_SOURCES.map((source) => (
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
          <Link to="/enchente-2015-pelotas">
            Enchente de 2015 em Pelotas <span aria-hidden="true">→</span>
          </Link>
          <Link to="/enchente-2024-pelotas-laranjal">
            Enchente de 2024 em Pelotas e no Laranjal <span aria-hidden="true">→</span>
          </Link>
          <Link to="/situacao-hidrologica-pelotas">
            Situação atual das águas <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </article>
  );
}
