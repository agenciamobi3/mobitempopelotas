import { Link } from "@tanstack/react-router";

import {
  FLOOD_2015_ARCHIVE,
  FLOOD_2015_KEY_FACTS,
  FLOOD_2015_SOURCES,
  FLOOD_2015_TIMELINE,
} from "@/lib/content/flood-2015-pelotas";

import "./Flood2015HistoricalPage.css";
import "./Flood2024HistoricalPage.css";

export function Flood2015Hero() {
  return (
    <section className="tp-flood-hero" aria-labelledby="tp-flood-2015-hero-title">
      <div className="tp-flood-hero__inner">
        <div className="tp-flood-hero__copy">
          <span>Registro histórico · outubro a novembro de 2015</span>
          <h1 id="tp-flood-2015-hero-title">Enchente de 2015 em Pelotas</h1>
          <p>
            Boletins publicados pela Prefeitura durante a emergência permitem acompanhar a cheia
            quase dia a dia, da combinação de chuva, Lagoa, Canal São Gonçalo e vento até a retirada
            de moradores e a recuperação do Laranjal, Z3, Barra e áreas baixas.
          </p>
        </div>

        <div className="tp-flood-hero__summary" aria-label="Marcos documentados da cheia de 2015">
          {FLOOD_2015_KEY_FACTS.map((fact) => (
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

export function Flood2015HistoricalPage() {
  return (
    <article className="tp-flood-history">
      <nav className="tp-flood-history__index" aria-label="Nesta página">
        <span>Nesta página</span>
        <a href="#como-a-cheia-se-formou">Como a cheia se formou</a>
        <a href="#linha-do-tempo-2015">Linha do tempo e medições</a>
        <a href="#arquivo-boletins-2015">Arquivo de boletins</a>
        <a href="#por-que-nao-drenava">Por que a água não drenava</a>
        <a href="#impactos-e-resposta">Impactos e resposta</a>
        <a href="#como-ler-os-niveis">Como ler os níveis</a>
        <a href="#fontes-2015">Fontes</a>
      </nav>

      <section className="tp-flood-history__lead" id="como-a-cheia-se-formou">
        <div>
          <span>O mecanismo documentado</span>
          <h2>Não foi apenas a chuva que caiu em Pelotas</h2>
        </div>
        <div className="tp-flood-history__lead-copy">
          <p>
            Os informativos municipais descrevem duas contribuições regionais simultâneas. De um
            lado, Lagoa Mirim e rios como Piratini e Jaguarão alimentavam o Canal São Gonçalo. De
            outro, água excedente do Guaíba chegava à Lagoa dos Patos.
          </p>
          <p>
            A isso se somaram volumes de chuva muito elevados em Pelotas e vento nordeste ou vento
            desfavorável ao escoamento da Lagoa para o mar. O resultado foi a manutenção de níveis
            elevados justamente junto a áreas urbanas de baixa cota.
          </p>
          <p>
            A Estação da Embrapa acumulou, segundo a Prefeitura, 299 mm em outubro até o dia 20. O
            mesmo registro municipal citava 101 mm como média para outubro.
          </p>
        </div>

        <div className="tp-flood-history__chain">
          <strong>
            Lagoa Mirim + Piratini + Jaguarão → Canal São Gonçalo · Guaíba → Lagoa dos Patos · chuva
            local e regional + vento desfavorável → níveis elevados e inundação das áreas baixas
          </strong>
          <p>
            As duas rotas de água não devem ser resumidas como uma única corrente. Elas convergiram
            no problema local: São Gonçalo e Lagoa altos, com pouca capacidade para receber a água
            que precisava sair das áreas urbanizadas.
          </p>
        </div>
      </section>

      <section
        className="tp-flood-timeline"
        id="linha-do-tempo-2015"
        aria-labelledby="tp-flood-2015-timeline-title"
      >
        <header>
          <span>Linha do tempo documentada</span>
          <h2 id="tp-flood-2015-timeline-title">Dos primeiros sinais à estabilização, com as leituras recuperadas</h2>
          <p>
            A Prefeitura publicou boletins diariamente, duas ou mais vezes segundo o balanço final.
            Cada medição abaixo conserva a data, o horário ou a referência temporal dada pela fonte.
            Quando um valor sobrevive apenas em reportagem contemporânea que cita a Defesa Civil,
            essa origem aparece explicitamente. Variações não são convertidas em cotas inventadas.
          </p>
        </header>

        <div className="tp-flood-timeline__list">
          {FLOOD_2015_TIMELINE.map((item) => (
            <section className={`tp-flood-event is-${item.stage}`} key={`${item.date}-${item.title}`}>
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
          ))}
        </div>
      </section>

      <section
        className="tp-flood-sources"
        id="arquivo-boletins-2015"
        aria-labelledby="tp-flood-2015-archive-title"
      >
        <div>
          <span>Arquivo oficial localizado</span>
          <h2 id="tp-flood-2015-archive-title">A Prefeitura chegou a publicar mais de um boletim por dia</h2>
        </div>
        <div>
          <p>
            O índice histórico municipal preserva a sequência de atualizações mesmo quando alguns
            endereços antigos já não entregam o corpo completo da notícia. Isso permite distinguir o
            que foi integralmente recuperado do que apenas permanece comprovado no inventário.
          </p>
          <div className="tp-flood-archive" role="list" aria-label="Boletins de 2015 localizados no arquivo municipal">
            {FLOOD_2015_ARCHIVE.map((entry) => (
              <section className="tp-flood-archive__entry" role="listitem" key={entry.date}>
                <div>
                  <strong>{entry.date}</strong>
                  <span className={`is-${entry.retrieval}`}>
                    {entry.retrieval === "full" ? "conteúdo recuperado" : "apenas índice recuperado"}
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
            Quando o corpo de um boletim não está disponível, a página não completa medições por
            interpolação, memória secundária ou semelhança de horários. Uma fonte contemporânea pode
            recuperar um dado da Defesa Civil, mas não transforma essa fonte no boletim municipal perdido.
          </p>
        </div>
      </section>

      <section className="tp-flood-explanation" id="por-que-nao-drenava">
        <div>
          <span>Por que a água não drenava?</span>
          <h2>Bombear não resolve quando o destino da água também está alto</h2>
        </div>
        <div>
          <p>
            Em 19 de outubro, a própria Prefeitura explicou uma limitação essencial da drenagem do
            Laranjal: os canais precisavam descarregar em um sistema que também estava com nível
            elevado.
          </p>
          <p>
            Com Lagoa dos Patos e Canal São Gonçalo represados, as áreas mais baixas recebiam água ao
            mesmo tempo em que perdiam capacidade de escoá-la. Por isso, o Município registrava que
            casas de bombas não seriam solução isolada enquanto não houvesse nível receptor mais baixo.
          </p>
          <blockquote>
            A cheia de 2015 mostra por que nível, vento e capacidade de saída da água precisam ser
            lidos em conjunto.
          </blockquote>
        </div>
      </section>

      <section className="tp-flood-lessons" id="impactos-e-resposta">
        <div>
          <span>Impactos e resposta pública</span>
          <h2>Resgates, abrigos, energia interrompida e obras emergenciais</h2>
        </div>
        <div>
          <p>
            O balanço municipal consolidou aproximadamente 1.300 famílias atendidas ao longo de toda
            a ocorrência. Esse total acumulado não deve ser confundido com o número de famílias
            simultaneamente desabrigadas.
          </p>
          <p>
            Os registros incluem resgates no Laranjal e na Z3, isolamento da Barra, transbordamento
            do Arroio Sujo, interrupção preventiva de energia em 1.956 moradias e construção ou
            reforço de um dique emergencial com aproximadamente 2 km no Valverde.
          </p>
          <p>
            A imprensa contemporânea complementa lacunas pontuais do arquivo. G1 documenta fatos do
            dia do decreto; GZH preserva medições atribuídas à Defesa Civil em 27 e 28 de outubro.
            Esses registros permanecem identificados como jornalísticos e não substituem boletins
            municipais que não foram recuperados.
          </p>
          <ul>
            <li>Prefeitura em alerta e evacuações na Z3 já em 14 de outubro;</li>
            <li>pico crítico retrospectivamente situado entre 18 e 19 de outubro;</li>
            <li>Situação de Emergência decretada em 20 de outubro;</li>
            <li>acesso de ônibus à Z3 retomado em 23 de outubro após baixa da Lagoa;</li>
            <li>dique emergencial iniciado no Pontal da Barra em 25 de outubro;</li>
            <li>divulgação municipal do reconhecimento federal em 28 de outubro;</li>
            <li>plantão especial da Defesa Civil encerrado em 4 de novembro;</li>
            <li>abrigos desativados e limpeza intensificada em 5 de novembro;</li>
            <li>balanço consolidado publicado em 6 de novembro.</li>
          </ul>
        </div>
      </section>

      <section className="tp-flood-explanation" id="como-ler-os-niveis">
        <div>
          <span>Como ler os níveis de 2015</span>
          <h2>Uma medida só faz sentido com sua régua, horário e referência</h2>
        </div>
        <div>
          <p>
            Os boletins de 2015 registram valores diferentes ao longo do dia e da semana. Eles devem
            ser preservados como fotografias daquele instante. O balanço de 6 de novembro é a fonte
            usada para identificar retrospectivamente o período crítico e o valor de 2,20 m do São
            Gonçalo.
          </p>
          <p>
            Para a Lagoa, o mesmo balanço informa que a régua de 1,80 m ficou submersa durante o
            evento. Isso prova que a água ultrapassou o alcance daquele instrumento, mas não autoriza
            transformar o registro em uma cota máxima exata acima de 1,80 m.
          </p>
          <p>
            A leitura de 2,10 m da Casa de Bombas do Porto em 14 de outubro também permanece na sua
            referência original. Ela é uma profundidade registrada naquela régua local e não é
            tratada como se fosse a mesma cota das séries posteriores da Lagoa ou do São Gonçalo.
          </p>
          <p>
            Esses números não são convertidos automaticamente para as estações atuais. Uma comparação
            direta exige saber estação, datum, zero da régua e referência vertical de cada medição.
          </p>
          <p>
            O G1 publicou, atribuindo a informação à Defesa Civil, que a Lagoa dos Patos teria chegado
            a “2,25 m acima do normal”. Como a reportagem não esclarece qual estação, zero ou definição
            de “normal” sustentava a expressão, ela permanece como relato atribuído e não entra como
            cota calibrada na sequência municipal.
          </p>
        </div>
      </section>

      <section className="tp-flood-sources" id="fontes-2015" aria-labelledby="tp-flood-2015-sources-title">
        <div>
          <span>Fontes documentais</span>
          <h2 id="tp-flood-2015-sources-title">Um arquivo oficial quase diário da cheia</h2>
        </div>
        <div>
          <p>
            A espinha dorsal desta reconstrução é a série “Cheias 2015” da Prefeitura de Pelotas.
            G1 e GZH entram como fontes jornalísticas contemporâneas complementares, sempre com a
            atribuição preservada. Quando a GZH reproduz uma medição da Defesa Civil, o dado pode
            preencher a cronologia daquele instante, mas não é apresentado como corpo recuperado do
            boletim municipal perdido.
          </p>
          <div className="tp-flood-related__links">
            {FLOOD_2015_SOURCES.map((source) => (
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
          <span>Outras cheias e monitoramento atual</span>
          <h2>2015 é uma peça da memória hidrológica de Pelotas</h2>
        </div>
        <div className="tp-flood-related__links">
          <Link to="/enchente-1941-pelotas">
            Enchente de 1941 em Pelotas <span aria-hidden="true">→</span>
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
