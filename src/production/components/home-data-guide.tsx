import { Link } from "@tanstack/react-router";

import "./home-data-guide.css";

const dataTypes = [
  {
    label: "Observação",
    text: "É o que foi realmente medido por uma estação identificada. Horário e fonte acompanham a leitura quando disponíveis.",
  },
  {
    label: "Previsão",
    text: "É uma estimativa para as próximas horas e dias. Pode mudar conforme novas atualizações chegam.",
  },
  {
    label: "Aviso oficial",
    text: "É um comunicado emitido por órgão competente. Não é a mesma coisa que previsão ou medição.",
  },
  {
    label: "Radar e satélite",
    text: "São imagens de monitoramento. Ajudam a acompanhar chuva, nuvens e trovoadas na região.",
  },
] as const;

const quickAnswers = [
  {
    question: "A condição atual é uma previsão?",
    answer:
      "Não. Quando há uma medição recente e utilizável, o Agora usa observação. Se ela estiver indisponível, o portal não preenche esse espaço com uma previsão.",
  },
  {
    question: "Onde vejo a origem dos dados?",
    answer:
      "A fonte aparece junto das informações principais. A página Dados e fontes reúne a lista completa, o uso de cada fonte e seu estado atual.",
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
          <p>
            O Tempo Pelotas mantém essas informações separadas para não apresentar uma estimativa como
            se fosse uma medição nem transformar ausência de dados em condição normal.
          </p>
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
          <h3>Leitura rápida</h3>
          <div>
            {quickAnswers.map((faq) => (
              <details key={faq.question}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>

        <nav className="tp-home-guide__related" aria-label="Dados e fontes">
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
