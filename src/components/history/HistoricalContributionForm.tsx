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

const contributionKinds: readonly {
  value: HistoricalContributionKind;
  label: string;
  description: string;
}[] = [
  {
    value: "photo",
    label: "Tenho uma foto",
    description: "Fotografia da época, marca de água, rua, bairro, família ou paisagem atingida.",
  },
  {
    value: "document",
    label: "Tenho um documento",
    description: "Jornal, boletim, relatório, mapa, carta, recorte ou outro registro digitalizado.",
  },
  {
    value: "source",
    label: "Encontrei uma fonte ou notícia",
    description: "Link, página antiga, referência bibliográfica, arquivo ou pista para pesquisa.",
  },
  {
    value: "testimony",
    label: "Quero contar o que vivi",
    description: "Memória de morador, trabalhador, pescador ou pessoa que acompanhou o evento.",
  },
  {
    value: "measurement",
    label: "Tenho uma medição ou marca de água",
    description: "Altura observada, régua, anotação, marca física ou outra referência mensurável.",
  },
  {
    value: "correction",
    label: "Quero corrigir uma informação",
    description: "Erro de data, local, nome, interpretação, fonte ou contexto do registro publicado.",
  },
  {
    value: "other",
    label: "Tenho outro material",
    description: "Qualquer contribuição histórica que não se encaixe nas opções anteriores.",
  },
];

const kindCopy: Record<HistoricalContributionKind, { title: string; description: string }> = {
  photo: {
    title: "Ex.: Foto da Avenida Rio Grande durante a cheia",
    description:
      "Conte onde a foto foi feita, quando aproximadamente, quem aparece ou o que ela mostra e de qual acervo ela veio.",
  },
  document: {
    title: "Ex.: Recorte do jornal sobre o Laranjal",
    description:
      "Diga que documento é esse, quem publicou ou produziu, de quando ele é e qualquer detalhe que ajude a localizar o original.",
  },
  source: {
    title: "Ex.: Notícia antiga sobre a cheia de 2001",
    description:
      "Explique o que a fonte documenta, onde você a encontrou e por que ela pode ajudar a completar ou conferir o registro.",
  },
  testimony: {
    title: "Ex.: Relato do Valverde durante a enchente",
    description:
      "Conte o que você lembra. Não precisa saber a data exata; local, período aproximado, referências da rua e outras lembranças ajudam muito.",
  },
  measurement: {
    title: "Ex.: Marca de água na residência no Valverde",
    description:
      "Informe o local, a altura ou referência observada, como ela foi medida e, se souber, a data ou período aproximado.",
  },
  correction: {
    title: "Ex.: Correção da data de um acontecimento",
    description:
      "Indique qual trecho precisa ser revisto, qual seria a informação correta e a fonte ou contexto que sustenta a correção.",
  },
  other: {
    title: "Ex.: Registro histórico sobre a enchente",
    description:
      "Descreva o material e tudo o que souber sobre origem, data, local e como ele pode contribuir para o arquivo.",
  },
};

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
  const [kind, setKind] = useState<HistoricalContributionKind>("photo");
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

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const rightsConfirmed = form.get("rightsConfirmed") === "on";
    const publicationAuthorized = form.get("publicationAuthorized") === "on";

    if (!rightsConfirmed) {
      setError("Confirme que você pode compartilhar o material com o Tempo Pelotas para análise.");
      return;
    }

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
        attachments.push({
          path,
          name: file.name,
          mime: file.type as HistoricalContributionAttachment["mime"],
          size: file.size,
        });
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
          rightsConfirmed: true,
          publicationAuthorized,
        },
      });

      if (!result.ok) throw new Error(result.code);

      setSuccess(true);
      setFiles([]);
      formElement.reset();
      setKind("photo");
      setPublishAnonymously(false);
    } catch (caught) {
      if (uploadedPaths.length) {
        await client.storage.from("historical-contributions").remove(uploadedPaths);
      }
      const code = caught instanceof Error ? caught.message : "storage_error";
      setError(
        code.startsWith("upload:")
          ? "Falha ao enviar um dos anexos. Tente novamente."
          : contributionError(code),
      );
    } finally {
      setBusy(false);
    }
  }

  const copy = kindCopy[kind];

  return (
    <form className="tp-contribution-form" onSubmit={handleSubmit}>
      <div className="tp-contribution-form__context">
        <span>Você está colaborando com</span>
        <strong>{context.pageTitle}</strong>
        <small>Contribuidor conectado: {contributorName || "conta Tempo Pelotas"}</small>
      </div>

      <fieldset className="tp-contribution-form__kind">
        <legend>O que você quer compartilhar?</legend>
        <div className="tp-contribution-form__kind-grid">
          {contributionKinds.map((item) => (
            <label className={kind === item.value ? "is-selected" : ""} key={item.value}>
              <input
                type="radio"
                name="kind"
                value={item.value}
                checked={kind === item.value}
                onChange={() => setKind(item.value)}
              />
              <span>
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="tp-contribution-form__field">
        <label htmlFor="contribution-title">Dê um título curto para a contribuição</label>
        <input
          id="contribution-title"
          name="title"
          required
          minLength={3}
          maxLength={180}
          placeholder={copy.title}
        />
      </div>

      <div className="tp-contribution-form__field">
        <label htmlFor="contribution-description">Conte o que você sabe</label>
        <textarea
          id="contribution-description"
          name="description"
          required
          minLength={10}
          maxLength={8000}
          rows={8}
          placeholder={copy.description}
        />
      </div>

      <div className="tp-contribution-form__row">
        <div className="tp-contribution-form__field">
          <label htmlFor="contribution-location">Onde isso aconteceu?</label>
          <input
            id="contribution-location"
            name="locationText"
            maxLength={240}
            placeholder="Ex.: Valverde, Laranjal / Avenida Rio Grande"
          />
          <small>Não precisa informar endereço residencial exato.</small>
        </div>
        <div className="tp-contribution-form__field">
          <label htmlFor="contribution-date">Quando aproximadamente?</label>
          <input
            id="contribution-date"
            name="dateLabel"
            maxLength={120}
            placeholder={`Ex.: outubro de ${context.eventYear} / data aproximada`}
          />
          <small>Uma data aproximada já ajuda. Não invente precisão que você não possui.</small>
        </div>
      </div>

      <div className="tp-contribution-form__field">
        <label htmlFor="contribution-source">Link da fonte, se houver</label>
        <input
          id="contribution-source"
          name="sourceUrl"
          type="url"
          maxLength={1200}
          placeholder="https://..."
        />
      </div>

      <div className="tp-contribution-form__row">
        <div className="tp-contribution-form__field">
          <label htmlFor="contribution-credit">Quem produziu este material?</label>
          <input
            id="contribution-credit"
            name="creditName"
            maxLength={120}
            placeholder="Fotógrafo, autor, jornal ou acervo da família"
          />
          <small>Se não souber, deixe em branco. Não atribua autoria por aproximação.</small>
        </div>
        <label className="tp-contribution-form__check tp-contribution-form__check--compact">
          <input
            type="checkbox"
            checked={publishAnonymously}
            onChange={(event) => setPublishAnonymously(event.target.checked)}
          />
          <span>Se algo for publicado, não mostrar meu nome como colaborador</span>
        </label>
      </div>

      <div className="tp-contribution-form__field">
        <label htmlFor="contribution-files">Fotos ou documentos</label>
        <input
          id="contribution-files"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,application/pdf"
          multiple
          onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, MAX_FILES))}
        />
        <small>
          {fileSummary}. Até 5 arquivos, 15 MB cada. Os originais ficam privados enquanto a contribuição é analisada.
        </small>
      </div>

      <div className="tp-contribution-form__consents">
        <label className="tp-contribution-form__check">
          <input type="checkbox" name="rightsConfirmed" required />
          <span>
            <strong>Posso compartilhar para análise.</strong> Confirmo que posso enviar este material ao
            Tempo Pelotas para pesquisa e revisão editorial e que não estou compartilhando conteúdo de
            terceiros sem autorização.
          </span>
        </label>
        <label className="tp-contribution-form__check">
          <input type="checkbox" name="publicationAuthorized" />
          <span>
            <strong>Também autorizo publicação.</strong> Se a contribuição for aprovada, autorizo a
            reprodução pública do material no Tempo Pelotas com a origem e os créditos informados.
            Esta opção é voluntária.
          </span>
        </label>
        <p className="tp-contribution-form__consent-note">
          Se você não autorizar publicação, o material ainda poderá ser analisado como pista de pesquisa.
          O arquivo enviado não será reproduzido publicamente sem nova autorização.
        </p>
      </div>

      {error ? (
        <p className="tp-contribution-form__message is-error" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <div className="tp-contribution-form__message is-success" role="status">
          <strong>Contribuição recebida.</strong>
          <span>
            Ela ficou pendente para revisão e não altera automaticamente o registro histórico. Qualquer
            publicação respeitará a autorização informada neste envio.
          </span>
        </div>
      ) : null}

      <button className="tp-contribution-form__submit" type="submit" disabled={busy}>
        {busy ? "Enviando contribuição..." : "Enviar para revisão"}
      </button>
    </form>
  );
}
