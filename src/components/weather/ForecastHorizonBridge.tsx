import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarRange } from "lucide-react";

import "./ForecastHorizonBridge.css";

export function ForecastHorizonBridge() {
  return (
    <section className="forecast-horizon-bridge" aria-labelledby="forecast-horizon-bridge-title">
      <Link to="/previsao-15-dias-pelotas" aria-labelledby="forecast-horizon-bridge-title">
        <CalendarRange aria-hidden="true" />
        <div>
          <h2 id="forecast-horizon-bridge-title">Previsão para os próximos 15 dias</h2>
          <p>A segunda semana tem mais incerteza. Confira novamente mais perto da data.</p>
        </div>
        <span>
          Ver 15 dias <ArrowRight aria-hidden="true" />
        </span>
      </Link>
    </section>
  );
}
