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
            Fontes contemporâneas, análise acadêmica e os próprios arquivos Hidro da estação
            87955000 permitem documentar o evento sem esconder as revisões da série. Para 8 de
            outubro, o arquivo bruto e o consistido não têm o mesmo valor, e essa diferença passa a
            ser mostrada explicitamente em vez de ser resolvida por escolha editorial.
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
        <a href="#regua-laranjal-2001">Régua do Laranjal</a>
        <a href="#mecanismo-vento-2001">Mecanismo do vento</a>
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
            A reconstrução combina fontes contemporâneas com evidências hidrológicas e acadêmicas
            posteriores claramente identificadas. A Folha de S.Paulo registra a classificação
            meteorológica e os principais números do dia. A Prefeitura de Pelotas documenta danos,
            invasão das águas e recuperação. Os arquivos Hidro da ANA acrescentam a série da régua
            Laranjal 87955000 e permitem separar a camada bruta da camada consistida.
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
            Essa cadeia resume apenas o que as fontes atuais sustentam. A série hidrológica e a análise
            acadêmica acrescentam contexto, mas não autorizam converter uma referência local em
            altitude nem apagar a diferença entre dado bruto, dado consistido e valor estimado.
          </p>
        </div>
      </section>

      <section className="tp-flood-explanation" id="regua-laranjal-2001">
        <div>
          <span>Régua histórica ANA · estação 87955000</span>
          <h2>No mesmo 8 de outubro, o Hidro preserva 2,90 m bruto e 1,90 m consistido</h2>
        </div>
        <div>
          <p>
            O cabeçalho da exportação Hidro define <strong>NivelConsistencia 1 como Bruto</strong> e
            <strong> NivelConsistencia 2 como Consistido</strong>. Para outubro de 2001, a camada bruta
            registra no dia 8 uma leitura de <strong>300 cm às 07h</strong>, outra de
            <strong> 280 cm às 17h</strong> e uma <strong>média diária de 290 cm</strong>.
          </p>
          <p>
            Na camada consistida do mesmo mês, a cota do dia 8 é <strong>190 cm</strong>. O próprio
            arquivo marca esse valor com <strong>status 2 = Estimado</strong>. Nessa linha, a máxima
            mensal também é 190 cm e o dia da máxima é 8. Portanto, 2,90 m e 1,90 m não são duas
            réguas diferentes: são duas camadas de tratamento da série 87955000 para a mesma data.
          </p>
          <p>
            O MDB da estação ajuda a rastrear por que a série pode ter mudado sem, contudo, explicar a
            correção específica de 100 cm. Em <strong>29/06/2018</strong>, o histórico informa que os
            dados fluviométricos da 87955000 foram alterados no âmbito do Contrato ANA nº 10/2015,
            cujo objeto era a análise de consistência de dados fluviométricos. O Tempo Pelotas não
            transforma esse registro geral em uma justificativa técnica inventada para o dia 8.
          </p>
          <p>
            O relatório municipal de 2013 continua relevante porque recompila a série ANA disponível à
            época e registra 2,90 m em 08/10/2001. Depois da recuperação dos arquivos Hidro atuais,
            porém, esse número passa a ser identificado como compatível com a <strong>camada bruta</strong>,
            enquanto a camada consistida atualmente exportada preserva 1,90 m como estimado.
          </p>
          <p>
            O histórico cadastral também exige cautela com altitude. Em <strong>05/10/2017</strong>, o
            campo altitude foi alterado de 5,00 m para <strong>-0,02 m</strong>, descrito como a altitude
            correspondente ao zero da régua levantado em campo. Em março de 2018, entretanto, o mesmo
            histórico registra substituição e renumeração de lances de régua. Sem o nivelamento que
            demonstre continuidade até 2001, o portal não retroprojeta -0,02 m para converter as cotas
            de 2001 em altitude sobre um datum.
          </p>
          <p>
            Há ainda uma separação operacional recente entre os códigos. Em <strong>30/04/2026</strong>,
            o histórico da 87955000 registra a retirada do tipo telemétrico, mantendo a estação como F.
            O MDB da <strong>87955001</strong> registra cadastro em <strong>08/06/2026</strong> com o nome
            LARANJAL e a descrição TELEMÉTRICA. Isso sustenta papéis distintos para a régua histórica e
            a telemetria atual, mas não prova que as duas identidades compartilham o mesmo zero, RN ou
            datum vertical.
          </p>
          <blockquote>
            Em 08/10/2001, a 87955000 tem 290 cm na camada bruta e 190 cm na camada consistida,
            marcada como estimada. Ambos são valores de régua, não altitudes. A 87955001 não é usada
            para recalibrar a série histórica.
          </blockquote>
        </div>
      </section>

      <section className="tp-flood-explanation" id="mecanismo-vento-2001">
        <div>
          <span>Análise acadêmica do evento</span>
          <h2>Como os ventos de leste e nordeste ajudaram a represar a Lagoa</h2>
        </div>
        <div>
          <p>
            Um trabalho da Faculdade de Meteorologia da UFPel analisa especificamente a inundação da
            costa oeste da Lagoa dos Patos em 8 de outubro de 2001. O estudo usa Análise Final do NCEP
            com resolução de 1° x 1° em intervalos de seis horas e dados horários de pressão,
            velocidade e direção do vento da Praticagem da Barra de Rio Grande entre 5 e 8 de outubro.
          </p>
          <p>
            A reconstrução identifica a Alta Subtropical do Atlântico Sul estacionária sobre o oceano
            e uma baixa pressão sobre o norte da Argentina. A interação entre os sistemas aumentou o
            gradiente de pressão sobre o Rio Grande do Sul e fortaleceu os ventos do quadrante
            leste-nordeste nos dias que antecederam o evento extremo.
          </p>
          <p>
            Segundo as conclusões do trabalho, os ventos de leste e nordeste podem ter dificultado a
            saída das águas da Lagoa dos Patos para o Oceano Atlântico. O atrito do vento com a
            superfície também deslocou água em direção à costa oeste, contribuindo para a inundação.
            Essa análise explica o mecanismo físico do episódio, mas não redefine a referência da régua
            histórica nem substitui os relatos contemporâneos.
          </p>
          <blockquote>
            Análise acadêmica posterior específica não é boletim operacional contemporâneo. O Tempo
            Pelotas usa cada camada para aquilo que ela realmente documenta.
          </blockquote>
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
          <h2>“Ciclone extratropical”, “nordestão” e camadas da régua são evidências diferentes</h2>
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
          <p>
            A série Hidro da 87955000 acrescenta outra camada documental. O bruto preserva 2,90 m
            como média diária de 08/10/2001; o consistido preserva 1,90 m para a mesma data e marca o
            valor como estimado. A divergência fica visível porque consistência de dado não é sinônimo
            de apagar o registro bruto.
          </p>
          <p>
            A análise acadêmica da UFPel é específica do episódio e ajuda a explicar a dinâmica
            atmosférica e hidrodinâmica, mas foi produzida posteriormente. Ela não é reclassificada como
            boletim emitido durante a emergência e não altera a atribuição dos números contemporâneos.
          </p>
          <p>
            Um texto náutico publicado em 2005 por Danilo Chagas Ribeiro descreve, de forma geral,
            que o vento Nordeste pode elevar o nível das águas na porção sul da Lagoa dos Patos por
            represamento no Canal da Feitoria, ao mesmo tempo em que reduz o nível ao norte. Esse
            material posterior ajuda a explicar o mecanismo hidrodinâmico associado ao termo local,
            mas não documenta o episódio de 2001.
          </p>
          <blockquote>
            O portal preserva quem afirmou cada coisa, a camada de consistência de cada medição e a
            referência de cada régua. Uma correção posterior não é escondida, e uma régua não vira
            altitude por aproximação.
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
          <h2>O que ainda falta documentar</h2>
        </div>
        <div>
          <p>
            Os arquivos bruto e consistido da ANA já foram recuperados. A lacuna agora é mais
            específica: explicar tecnicamente a revisão de 290 para 190 cm, fechar o referencial da
            régua aplicável a 2001 e documentar a relação entre a régua histórica 87955000 e a
            identidade telemétrica 87955001 sem presumir continuidade vertical.
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
