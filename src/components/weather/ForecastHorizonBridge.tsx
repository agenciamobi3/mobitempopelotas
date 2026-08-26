import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarRange } from "lucide-react";

import "./ForecastHorizonBridge.css";

export function ForecastHorizonBridge() {
  return (
    <section className="forecast-horizon-bridge" aria-labelledby="forecast-horizon-bridge-title">
      <CalendarRange aria-hidden="true" />
      <div>
        <span>Quer olhar mais adiante?</span>
        <h2 id="forecast-horizon-bridge-title">Veja a previsão de Pelotas para os próximos 15 dias</h2>
        <p>
          A janela estendida mantém mínima, máxima, chuva e rajadas dia a dia e destaca que a
          incerteza aumenta na segunda semana.
        </p>
      </div>
      <Link to="/previsao-15-dias-pelotas">
        Ver 15 dias <ArrowRight aria-hidden="true" />
      </Link>
    </section>
  );
}
