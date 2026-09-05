import { Link } from "@tanstack/react-router";

import {
  FLOOD_2001_KEY_FACTS,
  FLOOD_2001_RESEARCH_GAPS,
  FLOOD_2001_SOURCES,
  FLOOD_2001_TIMELINE,
} from "@/lib/content/flood-2001-pelotas";

import "./Flood2024HistoricalPage.css";

export function Flood2001Hero() {
  return (
    <section className="tp-flood-hero" aria-labelledby="tp-flood-2001-hero-title">
      <div className="tp-flood-hero__inner">
        <div className="tp-flood-hero__copy">
          <span>Registro histórico · outubro de 2001 · pesquisa em andamento</span>
          <h1 id="tp-flood-2001-hero-title">Enchente de 2001 em Pelotas e no Laranjal</h1>
          <p>
            Fontes contemporâneas já permitem documentar o ciclone extratropical, o vento extremo,
            o avanço das águas sobre o Laranjal, o isolamento da Z3 e a recuperação posterior. Esta
            página permanece aberta a novas fontes porque parte importante do acervo local ainda está
            fora da internet ou depende de arquivos históricos.
          </p>
        </div>

        <div className="tp-flood-hero__summary" aria-label="Marcos documentados do evento de 2001">
          {FLOOD_2001_KEY_FACTS.map((fact) => (
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

export function Flood2001HistoricalPage() {
  return (
    <article className="tp-flood-history">
      <nav className="tp-flood-history__index" aria-label="Nesta página">
        <span>Nesta página</span>
        <a href="#o-que-sabemos-2001">O que sabemos</a>
        <a href="#linha-do-tempo-2001">Linha do tempo</a>
        <a href="#fontes-e-limites-2001">Fontes e limites</a>
        <a href="#nao-confundir-setembro-2001">Outro evento em setembro</a>
        <a href="#lacunas-2001">O que ainda buscamos</a>
        <a href="#fontes-2001">Fontes</a>
      </nav>

      <section className="tp-flood-history__lead" id="o-que-sabemos-2001">
        <div>
          <span>O que já pode ser afirmado</span>
          <h2>Um episódio de vento extremo com forte resposta da Lagoa</h2>
        </div>
        <div className="tp-flood-history__lead-copy">
          <p>
            A reconstrução atual usa duas camadas contemporâneas que se complementam. A Folha de
            S.Paulo registra a classificação meteorológica do sistema e os principais números do dia.
            A Prefeitura de Pelotas documenta oficialmente os danos locais, a invasão das águas e a
            recuperação do Laranjal semanas depois.
          </p>
          <p>
            Na madrugada de 8 de outubro de 2001, a reportagem publicada no dia seguinte registrou
            vento de 105 km/h em Pelotas, ondas de aproximadamente um metro na Lagoa dos Patos, cerca
            de 3 mil pessoas isoladas na Z3 e avanço das águas por seis quadras, aproximadamente 600
            metros, para dentro do Laranjal.
          </p>
          <p>
            O comunicado municipal de 22 de outubro confirma fortes ventos, vendavais e invasão das
            águas do Canal São Gonçalo e da Lagoa dos Patos, além de trabalhos de recuperação de
            acessos, drenagem e limpeza do balneário.
          </p>
        </div>

        <div className="tp-flood-history__chain">
          <strong>
            sistema atmosférico intenso → vento muito forte sobre a região → ondas e avanço das águas
            da Lagoa → isolamento, inundação e danos no Laranjal e na Z3
          </strong>
          <p>
            Essa cadeia resume apenas o que as fontes atuais sustentam. Ela não substitui uma análise
            meteorológica oficial detalhada que ainda possa ser recuperada em acervos da época.
          </p>
        </div>
      </section>

      <section className="tp-flood-timeline" id="linha-do-tempo-2001" aria-labelledby="tp-flood-2001-timeline-title">
        <header>
          <span>Linha do tempo documentada</span>
          <h2 id="tp-flood-2001-timeline-title">Do evento à recuperação do balneário</h2>
          <p>
            A cronologia permanece curta porque não preenchemos dias sem documentação. Novos marcos
            serão incorporados conforme jornais, fotografias, boletins e documentos locais forem
            recuperados.
          </p>
        </header>

        <div className="tp-flood-timeline__list">
          {FLOOD_2001_TIMELINE.map((item) => (
            <section className="tp-flood-event is-lagoa" key={`${item.date}-${item.title}`}>
              <div className="tp-flood-event__date">
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
          ))}
        </div>
      </section>

      <section className="tp-flood-explanation" id="fontes-e-limites-2001">
        <div>
          <span>Hierarquia das fontes</span>
          <h2>“Ciclone extratropical” e “nordestão” não vêm da mesma fonte</h2>
        </div>
        <div>
          <p>
            A classificação “ciclone extratropical” vem da reportagem contemporânea da Folha, que a
            atribui a meteorologistas. A Prefeitura de 22 de outubro não usa esse termo: fala em fortes
            ventos, vendavais e invasão das águas.
          </p>
          <p>
            Em 2002, ao recordar o evento do ano anterior, a Prefeitura menciona a força do
            “nordestão”, expressão usada por pescadores para o vento nordeste forte. Esse termo registra
            a percepção e a linguagem local do vento; não deve ser apresentado como sinônimo técnico
            automático do sistema atmosférico em escala maior.
          </p>
          <blockquote>
            O portal preserva quem afirmou cada coisa. Uma fonte local de impacto não vira, por
            aproximação, uma fonte meteorológica.
          </blockquote>
        </div>
      </section>

      <section className="tp-flood-lessons" id="nao-confundir-setembro-2001">
        <div>
          <span>Outro episódio no mesmo ano</span>
          <h2>A chuva intensa de agosto e setembro não é fundida automaticamente com outubro</h2>
        </div>
        <div>
          <p>
            Existe estudo acadêmico sobre chuvas intensas em Pelotas entre 31 de agosto e 3 de
            setembro de 2001, associado a outra configuração meteorológica. A existência desse estudo
            é relevante para a história climática do ano, mas não autoriza transformar os dois eventos
            em uma única enchente sem documentação que estabeleça essa continuidade.
          </p>
          <p>
            Se novas fontes mostrarem relação hidrológica ou uma sequência contínua de impactos, a
            página poderá ser atualizada. Até lá, os episódios permanecem separados.
          </p>
        </div>
      </section>

      <section className="tp-flood-lessons" id="lacunas-2001">
        <div>
          <span>Pesquisa em andamento</span>
          <h2>O que ainda não encontramos</h2>
        </div>
        <div>
          <p>
            Uma página histórica também precisa dizer o que não sabe. As lacunas abaixo orientam a
            próxima etapa de pesquisa e ajudam moradores, estudantes e pesquisadores a entender onde
            uma nova fonte pode realmente acrescentar conhecimento.
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
          <span>Fontes documentais</span>
          <h2 id="tp-flood-2001-sources-title">De onde vêm as informações publicadas até aqui</h2>
        </div>
        <div>
          <p>
            A página será ampliada conforme novas fontes forem localizadas. Lacunas permanecem
            identificadas em vez de serem completadas por estimativa, memória não atribuída ou
            comparação automática com outras enchentes.
          </p>
          <div className="tp-flood-related__links">
            {FLOOD_2001_SOURCES.map((source) => (
              <a href={source.url} target="_blank" rel="noreferrer" key={`${source.date}-${source.url}`}>
                <span>
                  {source.name}<br />
                  <small>{source.organization} · {source.date} · {source.role}</small>
                </span>
                <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="tp-flood-related" aria-label="Continue consultando">
        <div>
          <span>Memória hidrológica de Pelotas</span>
          <h2>Compare os eventos sem misturar mecanismos, réguas ou fontes</h2>
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
