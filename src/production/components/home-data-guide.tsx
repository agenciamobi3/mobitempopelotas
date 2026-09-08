import { Link } from "@tanstack/react-router";

import { HOME_EDITORIAL_CONTENT } from "@/lib/editorial-content";

import "./home-data-guide.css";

const dataTypes = [
  {
    label: "Observação",
    text: "É o que foi realmente medido por uma estação identificada. Horário e fonte acompanham a leitura quando disponíveis.",
  },
  {
    label: "Previsão",
    text: "É uma estimativa para as próximas horas e dias. Pode mudar conforme novas rodadas dos modelos e novas observações entram no sistema.",
  },
  {
    label: "Aviso oficial",
    text: "É um comunicado emitido por órgão competente. Tem natureza diferente da previsão e da interpretação editorial do portal.",
  },
  {
    label: "Radar e satélite",
    text: "São produtos de monitoramento por imagem. Ajudam a acompanhar chuva, nuvens e trovoadas observadas, mas não projetam sozinhos o que ocorrerá depois.",
  },
] as const;

export function HomeDataGuide() {
  return (
    <section
      className="tp-home-guide"
      id="como-interpretar-o-tempo"
      aria-labelledby="tp-home-guide-title"
    >
      <header className="tp-home-guide__intro">
        <div>
          <span>Entenda os dados</span>
          <h2 id="tp-home-guide-title">Medição, previsão e aviso são informações diferentes</h2>
          <p>{HOME_EDITORIAL_CONTENT.answer}</p>
        </div>
      </header>

      <div className="tp-home-guide__types" aria-label="Tipos de informação do portal">
        {dataTypes.map((item) => (
          <article key={item.label}>
            <strong>{item.label}</strong>
            <p>{item.text}</p>
          </article>
        ))}
      </div>

      <div className="tp-home-guide__details">
        <div className="tp-home-guide__faq">
          <span>Perguntas frequentes</span>
          <h3>Como interpretar as informações do portal</h3>
          <div>
            {HOME_EDITORIAL_CONTENT.faqs.map((faq) => (
              <details key={faq.question}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>

        <nav className="tp-home-guide__related" aria-label="Informações relacionadas">
          <span>Transparência</span>
          <h3>Dados e fontes</h3>
          <ul>
            <li>
              <Link to="/status-dos-dados">
                <span>
                  <strong>Ver dados e fontes</strong>
                  <small>Origem, uso, estado atual e horário de verificação.</small>
                </span>
                <b aria-hidden="true">→</b>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </section>
  );
}
