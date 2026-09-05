import {
  contributionPath,
  HISTORICAL_COLLABORATION_ORDER,
  type HistoricalCollaborationContext,
} from "@/lib/history/historical-collaboration";

import "./HistoricalCollaboration.css";

type HistoricalCollaborationProps = {
  context: HistoricalCollaborationContext;
};

export function HistoricalCollaborationPrompt({ context }: HistoricalCollaborationProps) {
  return (
    <aside className="tp-history-collab-prompt" aria-label="Colabore com este registro histórico">
      <div>
        <span>Arquivo aberto à comunidade</span>
        <p>
          Tem uma foto, documento, fonte, medição ou lembrança de {context.eventYear} que pode
          melhorar este registro?
        </p>
      </div>
      <a className="tp-history-collab-button" href={contributionPath(context)}>
        Colabore com este registro
      </a>
    </aside>
  );
}

export function HistoricalCollaborationSection({ context }: HistoricalCollaborationProps) {
  return (
    <section className="tp-history-collab" aria-labelledby="tp-history-collab-title">
      <div className="tp-history-collab__intro">
        <span>Arquivo construído com a comunidade</span>
        <h2 id="tp-history-collab-title">Ajude a preservar a memória das cheias de Pelotas</h2>
        <p>
          Parte da história local sobrevive em álbuns de família, recortes de jornal, documentos,
          marcas de água, vídeos, relatos e páginas antigas que já não aparecem nas buscas comuns.
          O Tempo Pelotas recebe contribuições para que esse material possa ser localizado, conferido
          e preservado com sua origem identificada.
        </p>
      </div>

      <div className="tp-history-collab__body">
        <div className="tp-history-collab__grid" aria-label="Materiais que podem ser enviados">
          <article>
            <strong>Fotos e documentos</strong>
            <p>Imagens da época, jornais, boletins, mapas, relatórios, cartas e outros registros.</p>
          </article>
          <article>
            <strong>Fontes e correções</strong>
            <p>Links, referências bibliográficas ou informações que ajudem a corrigir e ampliar o texto.</p>
          </article>
          <article>
            <strong>Relatos e memória local</strong>
            <p>Depoimentos de quem viveu o evento, com data e local aproximados quando conhecidos.</p>
          </article>
          <article>
            <strong>Medições e marcas de água</strong>
            <p>Réguas, cotas, alturas observadas e marcas físicas, sempre com o contexto disponível.</p>
          </article>
        </div>

        <div className="tp-history-collab__rules">
          <h3>Como a colaboração funciona</h3>
          <ul>
            <li>a conta do Tempo Pelotas é gratuita;</li>
            <li>toda contribuição entra como pendente e passa por revisão antes de qualquer publicação;</li>
            <li>o material não altera automaticamente o registro histórico;</li>
            <li>autoria, origem, data e grau de certeza são preservados sempre que conhecidos;</li>
            <li>não envie fotos ou documentos que você não tenha autorização para compartilhar.</li>
          </ul>
          <a className="tp-history-collab-button" href={contributionPath(context)}>
            Enviar uma contribuição sobre {context.eventYear}
          </a>
        </div>

        <div className="tp-history-research-note">
          <strong>Para trabalhos e pesquisas</strong>
          <p>
            Este registro reúne fontes oficiais, jornalísticas, acadêmicas, documentos históricos e,
            quando identificado dessa forma, memória de moradores. Cada informação mantém sua origem.
            Quando um dado ainda não foi localizado, a lacuna é indicada em vez de estimada.
          </p>
        </div>

        <nav className="tp-history-collab__years" aria-label="Outros registros históricos de enchentes">
          <span>História das enchentes</span>
          <div>
            {HISTORICAL_COLLABORATION_ORDER.map((item) => (
              <a
                href={item.pagePath}
                aria-current={item.pagePath === context.pagePath ? "page" : undefined}
                key={item.pagePath}
              >
                {item.eventYear}
              </a>
            ))}
          </div>
        </nav>
      </div>
    </section>
  );
}
