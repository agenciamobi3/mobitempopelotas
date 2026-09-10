import { Link } from "@tanstack/react-router";
import { ArrowRight, LayoutDashboard, LockKeyhole, SlidersHorizontal, UserRoundPlus } from "lucide-react";

import "./LaranjalEmbedGuide.css";

export function LaranjalEmbedGuide() {
  return (
    <section className="laranjal-embed-guide" aria-labelledby="laranjal-embed-guide-title">
      <div className="laranjal-embed-guide-copy">
        <span className="laranjal-embed-guide-eyebrow">Widgets do Tempo Pelotas</span>
        <h2 id="laranjal-embed-guide-title">Leve o nível do Laranjal para o seu site.</h2>
        <p>
          A criação de widgets agora acontece dentro da sua conta. O construtor salva a configuração,
          gera o código de incorporação e permite gerenciar o widget depois sem deixar código aberto
          nesta página pública.
        </p>
        <ul>
          <li>Escolha o módulo de nível do Laranjal no construtor.</li>
          <li>Defina o nome e confira a prévia antes de publicar.</li>
          <li>Copie o código gerado e pause ou reative o widget quando precisar.</li>
        </ul>
      </div>

      <aside className="laranjal-embed-guide-access" aria-label="Acesso ao construtor de widgets">
        <div className="laranjal-embed-guide-access__icon">
          <LockKeyhole aria-hidden="true" />
        </div>
        <span>Acesso pela conta</span>
        <h3>Use o construtor no seu painel</h3>
        <p>
          É necessário entrar ou criar uma conta gratuita para gerar um widget. Seus widgets ficam
          vinculados ao seu painel para você poder reutilizar e gerenciar cada incorporação.
        </p>

        <div className="laranjal-embed-guide-access__steps" aria-label="Fluxo para criar o widget">
          <div><UserRoundPlus aria-hidden="true" /><span>Entre ou crie sua conta</span></div>
          <div><SlidersHorizontal aria-hidden="true" /><span>Configure o widget</span></div>
          <div><LayoutDashboard aria-hidden="true" /><span>Gerencie pelo painel</span></div>
        </div>

        <Link className="laranjal-embed-guide-access__action" to="/widgets">
          Abrir construtor de widgets <ArrowRight aria-hidden="true" />
        </Link>
        <small>Se você ainda não estiver conectado, o portal encaminha para o acesso da conta.</small>
      </aside>
    </section>
  );
}
