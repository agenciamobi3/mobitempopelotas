"use client";

import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";

import {
  moderateHistoricalContribution,
  type HistoricalModerationItem,
  type HistoricalModerationSnapshot,
} from "@/lib/history/moderation.functions";

import "./HistoricalModerationPanel.css";

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Horário não informado";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "tamanho não informado";
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

function kindLabel(kind: string) {
  const labels: Record<string, string> = {
    source: "Fonte / notícia",
    photo: "Foto",
    document: "Documento",
    testimony: "Depoimento",
    correction: "Correção",
    measurement: "Medição / marca de água",
    other: "Outro material",
  };
  return labels[kind] ?? kind;
}

function statusLabel(status: string) {
  if (status === "reviewing") return "Em revisão";
  if (status === "accepted") return "Aceita para pesquisa";
  if (status === "rejected") return "Rejeitada";
  return "Pendente";
}

export function HistoricalModerationPanel({ snapshot }: { snapshot: HistoricalModerationSnapshot }) {
  const moderate = useServerFn(moderateHistoricalContribution);
  const initialItems = snapshot.status === "authorized" ? snapshot.items : [];
  const [items, setItems] = useState<HistoricalModerationItem[]>(initialItems);
  const [notes, setNotes] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialItems.map((item) => [item.id, item.moderationNote ?? ""])),
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const pendingCount = useMemo(
    () => items.filter((item) => item.status === "pending").length,
    [items],
  );

  if (snapshot.status !== "authorized") return null;

  async function applyModeration(
    item: HistoricalModerationItem,
    status: "reviewing" | "accepted" | "rejected",
  ) {
    setBusyId(item.id);
    setMessage(null);

    try {
      const result = await moderate({
        data: {
          id: item.id,
          status,
          moderationNote: notes[item.id] ?? "",
        },
      });

      if (!result.ok) {
        setMessage("A moderação não pôde ser salva. A fila não foi alterada localmente.");
        return;
      }

      if (status === "accepted" || status === "rejected") {
        setItems((current) => current.filter((candidate) => candidate.id !== item.id));
      } else {
        setItems((current) =>
          current.map((candidate) =>
            candidate.id === item.id
              ? {
                  ...candidate,
                  status: result.item.status,
                  moderationNote: result.item.moderationNote,
                  reviewedAt: result.item.reviewedAt,
                }
              : candidate,
          ),
        );
      }

      setMessage(
        status === "accepted"
          ? "Contribuição aceita para pesquisa. Nenhum conteúdo foi publicado automaticamente."
          : status === "rejected"
            ? "Contribuição rejeitada e removida da fila ativa."
            : "Contribuição marcada como em revisão.",
      );
    } catch {
      setMessage("A moderação não pôde ser salva. Tente novamente a partir da fila atual.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="historical-moderation" aria-labelledby="historical-moderation-title">
      <header className="historical-moderation__heading">
        <div>
          <span className="eyebrow">Operação interna</span>
          <h2 id="historical-moderation-title">Moderação do arquivo histórico</h2>
          <p>
            Revise contribuições antes de incorporá-las à pesquisa. Aceitar um item aqui não altera
            nenhuma página pública e não substitui a autorização de reprodução do material.
          </p>
        </div>
        <div className="historical-moderation__summary" aria-label="Resumo da fila de moderação">
          <strong>{items.length}</strong>
          <span>na fila ativa</span>
          <small>{pendingCount} ainda pendentes</small>
        </div>
      </header>

      <div className="historical-moderation__policy" role="note">
        <strong>Consentimento continua separado da moderação.</strong>
        <span>
          Um item aceito pode orientar a pesquisa mesmo sem autorização de publicação. Fotos,
          documentos e outros materiais não devem ser reproduzidos publicamente quando
          <code> publication_authorized </code> estiver desmarcado.
        </span>
      </div>

      {message ? <p className="historical-moderation__message" role="status">{message}</p> : null}

      {items.length === 0 ? (
        <div className="historical-moderation__empty">
          <strong>Nenhuma contribuição pendente ou em revisão.</strong>
          <p>A fila voltará a aparecer aqui quando houver novo material enviado pelo arquivo público.</p>
        </div>
      ) : (
        <div className="historical-moderation__list">
          {items.map((item) => (
            <article className="historical-moderation__item" key={item.id}>
              <header>
                <div>
                  <span>{kindLabel(item.kind)} · {item.pageTitle}</span>
                  <h3>{item.title}</h3>
                  <small>
                    Enviada em {formatDateTime(item.createdAt)} · {statusLabel(item.status)}
                  </small>
                </div>
                <div className="historical-moderation__badges">
                  <span className={item.publicationAuthorized ? "is-authorized" : "is-private"}>
                    {item.publicationAuthorized ? "Reprodução autorizada" : "Somente análise"}
                  </span>
                  {item.publishAnonymously ? <span>Crédito anônimo</span> : null}
                </div>
              </header>

              <p className="historical-moderation__description">{item.description}</p>

              <dl className="historical-moderation__metadata">
                <div>
                  <dt>Página</dt>
                  <dd>{item.pagePath}</dd>
                </div>
                <div>
                  <dt>Data informada</dt>
                  <dd>{item.dateLabel ?? "Não informada"}</dd>
                </div>
                <div>
                  <dt>Local informado</dt>
                  <dd>{item.locationText ?? "Não informado"}</dd>
                </div>
                <div>
                  <dt>Crédito sugerido</dt>
                  <dd>{item.creditName ?? "Não informado"}</dd>
                </div>
              </dl>

              {item.sourceUrl ? (
                <p className="historical-moderation__source">
                  <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
                    Abrir fonte informada ↗
                  </a>
                </p>
              ) : null}

              {item.attachments.length > 0 ? (
                <div className="historical-moderation__attachments">
                  <strong>Anexos privados</strong>
                  <ul>
                    {item.attachments.map((attachment) => (
                      <li key={attachment.path}>
                        {attachment.signedUrl ? (
                          <a href={attachment.signedUrl} target="_blank" rel="noopener noreferrer">
                            {attachment.name}
                          </a>
                        ) : (
                          <span>{attachment.name}</span>
                        )}
                        <small>{attachment.mime} · {formatBytes(attachment.size)}</small>
                      </li>
                    ))}
                  </ul>
                  <small>Os links assinados expiram em poucos minutos e não tornam o bucket público.</small>
                </div>
              ) : null}

              <label className="historical-moderation__note">
                <span>Nota interna de moderação</span>
                <textarea
                  rows={3}
                  maxLength={2000}
                  value={notes[item.id] ?? ""}
                  onChange={(event) =>
                    setNotes((current) => ({ ...current, [item.id]: event.target.value }))
                  }
                  placeholder="Registre conferências, pendências, contexto ou motivo da decisão."
                />
              </label>

              <div className="historical-moderation__actions">
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => void applyModeration(item, "reviewing")}
                >
                  Em revisão
                </button>
                <button
                  type="button"
                  className="is-accept"
                  disabled={busyId === item.id}
                  onClick={() => void applyModeration(item, "accepted")}
                >
                  Aceitar para pesquisa
                </button>
                <button
                  type="button"
                  className="is-reject"
                  disabled={busyId === item.id}
                  onClick={() => void applyModeration(item, "rejected")}
                >
                  Rejeitar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {snapshot.truncated ? (
        <p className="historical-moderation__truncated">
          A fila possui mais de 50 itens. Esta V1 mostra os 50 mais recentes para manter a operação leve.
        </p>
      ) : null}
    </section>
  );
}
