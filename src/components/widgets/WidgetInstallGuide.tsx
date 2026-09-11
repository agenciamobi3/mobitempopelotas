import { useState } from "react";

import type { WidgetPresentation } from "@/lib/widgets/widget-content";

import "./WidgetInstallGuide.css";

type InstallationTarget = "wordpress" | "html" | "builder";

type WidgetInstallGuideProps = {
  title: string;
  embedCode: string;
  presentation: WidgetPresentation;
  copied: boolean;
  onCopy: () => void;
  defaultOpen?: boolean;
};

const INSTALLATION_TARGETS: ReadonlyArray<{
  key: InstallationTarget;
  label: string;
  shortLabel: string;
}> = [
  { key: "wordpress", label: "WordPress / Elementor", shortLabel: "WordPress" },
  { key: "html", label: "HTML comum", shortLabel: "HTML" },
  { key: "builder", label: "Outros construtores", shortLabel: "Construtores" },
];

function placementAdvice(presentation: WidgetPresentation) {
  if (presentation === "compact") {
    return {
      label: "Coluna estreita",
      range: "320–420 px",
      text: "Funciona melhor em sidebar, rodapé, grade lateral ou card estreito.",
    };
  }

  if (presentation === "horizontal") {
    return {
      label: "Seção ampla",
      range: "680 px ou mais",
      text: "Use em uma faixa de largura total ou em uma coluna principal ampla. Em telas menores ele volta para uma coluna.",
    };
  }

  return {
    label: "Coluna de conteúdo",
    range: "480–760 px",
    text: "É a opção mais versátil para páginas, artigos, notícias e áreas institucionais.",
  };
}

function installationSteps(target: InstallationTarget) {
  if (target === "wordpress") {
    return [
      "No Elementor, arraste o widget HTML para o ponto da página onde o Tempo Pelotas deve aparecer. No editor de blocos, use um bloco HTML personalizado.",
      "Cole o código exatamente como foi gerado, sem separar a tag <script> e sem colar em um bloco de texto comum.",
      "Atualize ou publique a página e abra a URL publicada. Quando o widget carregar, o domínio poderá ser reconhecido no Widget Insights.",
    ];
  }

  if (target === "html") {
    return [
      "Abra o arquivo, template ou componente responsável pela região da página onde o widget deve aparecer.",
      "Cole o snippet dentro do conteúdo da página, exatamente na posição desejada. Não coloque o código em um arquivo CSS nem no <head> apenas para exibir o widget.",
      "Publique a alteração e abra a página em desktop e celular. O iframe ajusta a altura, respeita a largura disponível e registra somente o domínio para métricas agregadas.",
    ];
  }

  return [
    "Procure no construtor um bloco chamado HTML, Embed, Código, Custom HTML ou equivalente e posicione-o onde o widget deve aparecer.",
    "Cole o snippet completo nesse bloco. Evite campos de texto rico, CSS personalizado ou cabeçalho global, porque eles podem remover a tag <script> ou exibir o widget no lugar errado.",
    "Salve e abra a página publicada. Se a plataforma aceitar o script e o widget carregar, o domínio poderá aparecer automaticamente no Widget Insights.",
  ];
}

export function WidgetInstallGuide({
  title,
  embedCode,
  presentation,
  copied,
  onCopy,
  defaultOpen = false,
}: WidgetInstallGuideProps) {
  const [target, setTarget] = useState<InstallationTarget>("wordpress");
  const [open, setOpen] = useState(defaultOpen);
  const placement = placementAdvice(presentation);
  const selectedTarget = INSTALLATION_TARGETS.find((item) => item.key === target)!;
  const steps = installationSteps(target);

  return (
    <details
      className="widget-install-guide"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>
        <div>
          <span>Instalação</span>
          <strong>Instalar no seu site</strong>
          <small>Passo a passo para WordPress, HTML e outros construtores.</small>
        </div>
        <span className="widget-install-guide__placement-summary">
          {placement.label} · {placement.range}
        </span>
      </summary>

      <div className="widget-install-guide__body">
        <section className="widget-install-guide__placement" aria-label="Espaço recomendado">
          <div>
            <span>Onde este formato encaixa melhor</span>
            <strong>{placement.label}</strong>
          </div>
          <p>
            <b>{placement.range}.</b> {placement.text}
          </p>
        </section>

        <div
          className="widget-install-guide__targets"
          role="group"
          aria-label="Escolher ambiente de instalação"
        >
          {INSTALLATION_TARGETS.map((item) => (
            <button
              type="button"
              className={item.key === target ? "is-selected" : undefined}
              aria-pressed={item.key === target}
              onClick={() => setTarget(item.key)}
              key={item.key}
            >
              <span>{item.shortLabel}</span>
              <small>{item.label}</small>
            </button>
          ))}
        </div>

        <section className="widget-install-guide__steps" aria-live="polite">
          <span>Passo a passo</span>
          <h4>{selectedTarget.label}</h4>
          <ol>
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <div className="widget-install-guide__code-block">
          <div>
            <span>Código deste widget</span>
            <strong>{title}</strong>
          </div>
          <code className="widget-builder-code">{embedCode}</code>
          <div className="widget-install-guide__code-actions">
            <button
              className="widget-builder-button is-secondary"
              type="button"
              onClick={onCopy}
            >
              {copied ? "Código copiado" : "Copiar código"}
            </button>
            <p>
              Copie o snippet inteiro uma única vez no ponto onde deseja exibir o widget. A aparência e
              os dados continuam sendo atualizados pelo Tempo Pelotas sem trocar esse código.
            </p>
          </div>
        </div>

        <div className="widget-install-guide__aftercare">
          <strong>Depois de publicar</strong>
          <p>
            Abra a página uma vez e volte ao Widget Insights. Quando o widget renderizar em um site
            externo, o Tempo Pelotas passa a mostrar carregamentos agregados, última atividade e o
            domínio detectado. Não usamos cookie de analytics nem identificamos visitantes individuais.
          </p>
        </div>
      </div>
    </details>
  );
}
