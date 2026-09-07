import {
  contributionPath,
  HISTORICAL_COLLABORATION_ORDER,
  type HistoricalCollaborationContext,
} from "@/lib/history/historical-collaboration";

import "./HistoricalCollaboration.css";
import "./HistoricalCollaborationContainer.css";

type HistoricalCollaborationProps = {
  context: HistoricalCollaborationContext;
};

export function HistoricalCollaborationPrompt({ context }: HistoricalCollaborationProps) {
  const researchInProgress = context.eventYear === 2001;

  return (
    <aside className="tp-history-collab-prompt" aria-label="Ajude a completar este registro histórico">
      <div>
        {researchInProgress ? <span>Pesquisa em andamento</span> : null}
        <p>
          {researchInProgress
            ? "Ainda faltam documentos sobre a enchente de 2001. Fotos, jornais e outros registros podem ajudar a completar essa história."
            : `Tem fotos, jornais, documentos, medições ou lembranças de ${context.eventYear}? Esse material pode ajudar a completar esta história.`}
        </p>
      </div>
      <a className="tp-history-collab-button" href={contributionPath(context)}>
        Enviar material ou relato
      </a>
    </aside>
  );
}

export function HistoricalCollaborationSection({ context }: HistoricalCollaborationProps) {
  const researchInProgress = context.eventYear === 2001;

  return (
    <section className="tp-history-collab" aria-labelledby="tp-history-collab-title">
      <div className="tp-history-collab__intro">
        <h2 id="tp-history-collab-title">Ajude a completar esta história</h2>
        <p>
          {researchInProgress
            ? "Parte dos registros de 2001 ainda não foi encontrada. Fotos, jornais, documentos e relatos com data e local podem ajudar a preencher o que falta."
            : `Tem algum registro de ${context.eventYear}? Fotos, jornais, documentos, medições e relatos locais podem ajudar a preservar detalhes que ainda não estão nesta página.`}
        </p>
      </div>

      <div className="tp-history-collab__body">
        <div className="tp-history-collab__grid" aria-label="Materiais que podem ser enviados">
          <article>
            <strong>Fotos e documentos</strong>
            <p>Imagens da época, jornais, boletins, mapas, cartas e outros registros.</p>
          </article>
          <article>
            <strong>Fontes e correções</strong>
            <p>Links, documentos ou informações que ajudem a corrigir ou ampliar a página.</p>
          </article>
          <article>
            <strong>Relatos</strong>
            <p>Lembranças de quem viveu o evento, com data e local aproximados quando conhecidos.</p>
          </article>
          <article>
            <strong>Medições e marcas de água</strong>
            <p>Níveis, alturas observadas ou marcas físicas, junto com o local e o contexto disponível.</p>
          </article>
        </div>

        <div className="tp-history-collab__rules">
          <h3>Como funciona</h3>
          <ul>
            <li>a conta do Tempo Pelotas é gratuita;</li>
            <li>todo material passa por revisão antes de qualquer publicação;</li>
            <li>uma contribuição não altera a página automaticamente;</li>
            <li>autor, origem e data são preservados sempre que conhecidos;</li>
            <li>você pode enviar um material apenas para análise, sem autorizar publicação.</li>
          </ul>
          <a className="tp-history-collab-button" href={contributionPath(context)}>
            Enviar uma contribuição sobre {context.eventYear}
          </a>
        </div>

        <div className="tp-history-research-note">
          <strong>Sobre as fontes</strong>
          <p>
            Cada informação mantém sua origem. Quando um dado ainda não foi encontrado ou confirmado,
            a página informa esse limite em vez de completar a história por estimativa.
          </p>
        </div>

        <nav className="tp-history-collab__years" aria-label="Outros registros históricos de enchentes">
          <span>História das enchentes</span>
          <div>
            <a href="/historia-das-enchentes-pelotas">Visão geral</a>
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
