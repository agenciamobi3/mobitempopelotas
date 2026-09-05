"use client";

import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";

import {
  createHistoricalContribution,
  type HistoricalContributionAttachment,
  type HistoricalContributionKind,
} from "@/lib/history/contribution.functions";
import type { HistoricalCollaborationContext } from "@/lib/history/historical-collaboration";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

import "./HistoricalContributionForm.css";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "application/pdf",
]);
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const MAX_FILES = 5;

const contributionKinds: readonly { value: HistoricalContributionKind; label: string }[] = [
  { value: "source", label: "Fonte ou link" },
  { value: "photo", label: "Foto histórica" },
  { value: "document", label: "Documento ou recorte" },
  { value: "testimony", label: "Depoimento ou memória" },
  { value: "measurement", label: "Medição ou marca de água" },
  { value: "correction", label: "Correção do registro" },
  { value: "other", label: "Outro material" },
];

function safeFileName(name: string) {
  const normalized = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 160);
  return normalized || "arquivo";
}

function contributionError(code: string) {
  if (code === "unauthenticated") return "Sua sessão expirou. Entre novamente antes de enviar.";
  if (code === "invalid_page") return "Este registro histórico não está habilitado para colaboração.";
  if (code === "invalid_attachment") return "Um dos anexos não pôde ser validado.";
  if (code === "unavailable") return "A área de contribuições está temporariamente indisponível.";
  return "Não foi possível registrar a contribuição. Os anexos enviados nesta tentativa foram removidos.";
}

export function HistoricalContributionForm({
  context,
  contributorName,
}: {
  context: HistoricalCollaborationContext;
  contributorName: string;
}) {
  const createContribution = useServerFn(createHistoricalContribution);
  const [kind, setKind] = useState<HistoricalContributionKind>("source");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [publishAnonymously, setPublishAnonymously] = useState(false);

  const fileSummary = useMemo(() => {
    if (!files.length) return "Nenhum anexo selecionado";
    return `${files.length} ${files.length === 1 ? "anexo selecionado" : "anexos selecionados"}`;
  }, [files]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const form = new FormData(event.currentTarget);
    const client = getSupabaseBrowserClient();
    if (!client) {
      setError("A conexão com a área de membros não está disponível neste navegador.");
      return;
    }

    if (files.length > MAX_FILES) {
      setError(`Envie no máximo ${MAX_FILES} anexos por contribuição.`);
      return;
    }

    const invalidFile = files.find(
      (file) => !ALLOWED_MIME_TYPES.has(file.type) || file.size <= 0 || file.size > MAX_FILE_SIZE,
    );
    if (invalidFile) {
      setError(
        `O arquivo “${invalidFile.name}” não é aceito. Use JPG, PNG, WebP, AVIF ou PDF de até 15 MB.`,
      );
      return;
    }

    setBusy(true);
    const uploadedPaths: string[] = [];

    try {
      const {
        data: { user },
        error: userError,
      } = await client.auth.getUser();
      if (userError || !user) throw new Error("unauthenticated");

      const contributionId = crypto.randomUUID();
      const attachments: HistoricalContributionAttachment[] = [];

      for (const [index, file] of files.entries()) {
        const path = `${user.id}/${contributionId}/${index + 1}-${safeFileName(file.name)}`;
        const { error: uploadError } = await client.storage
          .from("historical-contributions")
          .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });

        if (uploadError) throw new Error(`upload:${uploadError.message}`);
        uploadedPaths.push(path);
        attachments.push({ path, name: file.name, mime: file.type as HistoricalContributionAttachment["mime"], size: file.size });
      }

      const result = await createContribution({
        data: {
          id: contributionId,
          pagePath: context.pagePath,
          kind,
          title: String(form.get("title") ?? ""),
          description: String(form.get("description") ?? ""),
          locationText: String(form.get("locationText") ?? ""),
          dateLabel: String(form.get("dateLabel") ?? ""),
          sourceUrl: String(form.get("sourceUrl") ?? ""),
          creditName: String(form.get("creditName") ?? ""),
          publishAnonymously,
          attachments,
          rightsConfirmed: form.get("rightsConfirmed") === "on" as true,
          publicationAuthorized: form.get("publicationAuthorized") === "on" as true,
        },
      });

      if (!result.ok) throw new Error(result.code);

      setSuccess(true);
      setFiles([]);
      event.currentTarget.reset();
      setKind("source");
      setPublishAnonymously(false);
    } catch (caught) {
      if (uploadedPaths.length) {
        await client.storage.from("historical-contributions").remove(uploadedPaths);
      }
      const code = caught instanceof Error ? caught.message : "storage_error";
      setError(code.startsWith("upload:") ? "Falha ao enviar um dos anexos. Tente novamente." : contributionError(code));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="tp-contribution-form" onSubmit={handleSubmit}>
      <div className="tp-contribution-form__context">
        <span>Você está colaborando com</span>
        <strong>{context.pageTitle}</strong>
        <small>Contribuidor conectado: {contributorName || "conta Tempo Pelotas"}</small>
      </div>

      <div className="tp-contribution-form__field">
        <label htmlFor="contribution-kind">Tipo de contribuição</label>
        <select id="contribution-kind" value={kind} onChange={(event) => setKind(event.target.value as HistoricalContributionKind)}>
          {contributionKinds.map((item) => (
            <option value={item.value} key={item.value}>{item.label}</option>
          ))}
        </select>
      </div>

      <div className="tp-contribution-form__field">
        <label htmlFor="contribution-title">Título</label>
        <input id="contribution-title" name="title" required minLength={3} maxLength={180} placeholder="Ex.: Foto da Avenida Rio Grande durante a cheia" />
      </div>

      <div className="tp-contribution-form__field">
        <label htmlFor="contribution-description">Conte o que você sabe</label>
        <textarea id="contribution-description" name="description" required minLength={10} maxLength={8000} rows={8} placeholder="Descreva o material, o que aparece, como você obteve a informação e qualquer contexto que ajude a verificar o registro." />
      </div>

      <div className="tp-contribution-form__row">
        <div className="tp-contribution-form__field">
          <label htmlFor="contribution-location">Local</label>
          <input id="contribution-location" name="locationText" maxLength={240} placeholder="Ex.: Valverde, Laranjal" />
        </div>
        <div className="tp-contribution-form__field">
          <label htmlFor="contribution-date">Data ou período</label>
          <input id="contribution-date" name="dateLabel" maxLength={120} placeholder="Ex.: outubro de 2015 / data aproximada" />
        </div>
      </div>

      <div className="tp-contribution-form__field">
        <label htmlFor="contribution-source">Link da fonte, se houver</label>
        <input id="contribution-source" name="sourceUrl" type="url" maxLength={1200} placeholder="https://..." />
      </div>

      <div className="tp-contribution-form__row">
        <div className="tp-contribution-form__field">
          <label htmlFor="contribution-credit">Crédito / autor do material</label>
          <input id="contribution-credit" name="creditName" maxLength={120} placeholder="Nome do fotógrafo, autor ou acervo" />
        </div>
        <label className="tp-contribution-form__check tp-contribution-form__check--compact">
          <input type="checkbox" checked={publishAnonymously} onChange={(event) => setPublishAnonymously(event.target.checked)} />
          <span>Se publicado, não mostrar meu nome como colaborador</span>
        </label>
      </div>

      <div className="tp-contribution-form__field">
        <label htmlFor="contribution-files">Anexos opcionais</label>
        <input
          id="contribution-files"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,application/pdf"
          multiple
          onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, MAX_FILES))}
        />
        <small>{fileSummary}. Até 5 arquivos, 15 MB cada. Fotos e PDFs ficam privados durante a revisão.</small>
      </div>

      <div className="tp-contribution-form__consents">
        <label className="tp-contribution-form__check">
          <input type="checkbox" name="rightsConfirmed" required />
          <span>Confirmo que posso compartilhar este material e que não estou enviando conteúdo de terceiros sem autorização.</span>
        </label>
        <label className="tp-contribution-form__check">
          <input type="checkbox" name="publicationAuthorized" required />
          <span>Autorizo o Tempo Pelotas a armazenar, revisar e, se aprovado editorialmente, publicar esta contribuição com a origem e os créditos informados.</span>
        </label>
      </div>

      {error ? <p className="tp-contribution-form__message is-error" role="alert">{error}</p> : null}
      {success ? (
        <div className="tp-contribution-form__message is-success" role="status">
          <strong>Contribuição recebida.</strong>
          <span>Ela ficou pendente para revisão e não altera automaticamente o registro histórico.</span>
        </div>
      ) : null}

      <button className="tp-contribution-form__submit" type="submit" disabled={busy}>
        {busy ? "Enviando contribuição..." : "Enviar para revisão"}
      </button>
    </form>
  );
}
