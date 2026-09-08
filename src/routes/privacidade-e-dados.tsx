import { createFileRoute, Link } from "@tanstack/react-router";

import { ContentPageShell } from "@/components/layout/ContentPageShell";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd } from "@/lib/structured-data";

const PAGE_TITLE = "Privacidade, dados e retenção no Tempo Pelotas";
const PAGE_DESCRIPTION =
  "Entenda quais dados a conta utiliza, por quanto tempo são mantidos e como baixar ou excluir suas informações no Tempo Pelotas.";
const PAGE_PATH = "/privacidade-e-dados";

export const Route = createFileRoute("/privacidade-e-dados")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Privacidade e dados", path: PAGE_PATH },
        ],
        about: ["Privacidade no Tempo Pelotas", "Retenção de dados", "Direitos da conta"],
      }),
    ]),
  component: PrivacyDataPage,
});

function PrivacyDataPage() {
  return (
    <ContentPageShell pageClassName="privacy-data-shell">
      <div className="privacy-page">
        <header className="privacy-hero">
          <div>
            <span className="eyebrow">Privacidade e controle</span>
            <h1>Seus dados devem ser compreensíveis e estar sob seu controle</h1>
            <p>
              O Tempo Pelotas mantém previsão, avisos oficiais, radar, satélite, câmeras e situação
              das águas acessíveis sem login. A conta existe para identificação básica, preferências
              opcionais e recursos voluntários como a colaboração com o arquivo histórico.
            </p>
          </div>
          <aside className="privacy-summary" aria-label="Resumo da política">
            <strong>Conta opcional</strong>
            <span>
              Você pode consultar o portal sem cadastro, alterar preferências a qualquer momento,
              baixar uma cópia dos seus dados ou excluir definitivamente a conta.
            </span>
          </aside>
        </header>

        <div className="privacy-grid">
          <section className="privacy-card">
            <span className="eyebrow">O que é utilizado</span>
            <h2>Dados básicos e escolhas do visitante</h2>
            <ul>
              <li>nome, e-mail e imagem fornecidos pelo Google;</li>
              <li>preferências de alertas, águas, resumo diário e novidades;</li>
              <li>histórico de alterações dessas preferências;</li>
              <li>dados técnicos do aparelho quando notificações são ativadas;</li>
              <li>
                quando você colabora voluntariamente com o arquivo histórico, o conteúdo enviado,
                sua origem informada, créditos, anexos e o vínculo da contribuição com sua conta.
              </li>
            </ul>
          </section>

          <section className="privacy-card">
            <span className="eyebrow">Colaborações históricas</span>
            <h2>Anexos ficam privados durante a revisão</h2>
            <p>
              Fotos e documentos enviados para o arquivo histórico são armazenados em área privada e
              a contribuição entra como pendente. O envio não altera automaticamente uma página do
              portal. Material aprovado só é publicado após revisão editorial e conforme a autorização
              dada no formulário.
            </p>
          </section>

          <section className="privacy-card">
            <span className="eyebrow">O que não depende da conta</span>
            <h2>Informação meteorológica continua pública</h2>
            <p>
              Previsão do tempo, chuva, vento, imagens de radar e satélite, avisos oficiais,
              câmeras, níveis das águas e páginas históricas permanecem acessíveis aos visitantes.
            </p>
          </section>

          <section className="privacy-card privacy-card--wide">
            <span className="eyebrow">Seus direitos</span>
            <h2>Baixar, corrigir, revogar ou excluir</h2>
            <p>
              Na área da conta, você pode corrigir informações, alterar autorizações, baixar seus
              dados e remover definitivamente a conta. A exportação inclui os metadados das
              contribuições históricas vinculadas ao seu usuário. A exclusão da conta remove também
              essas contribuições e seus anexos privados.
            </p>
            <div className="privacy-actions">
              <Link to="/conta" search={{ erro: undefined, next: "/conta" }}>
                Abrir minha conta
              </Link>
              <Link to="/status-dos-dados">Consultar dados e fontes</Link>
            </div>
          </section>
        </div>
      </div>
    </ContentPageShell>
  );
}
