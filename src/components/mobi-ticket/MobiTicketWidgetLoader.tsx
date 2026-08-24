import { useEffect } from "react";

const WIDGET_SOURCE = "tempo_pelotas";

export function MobiTicketWidgetLoader() {
  useEffect(() => {
    if (document.querySelector("script[data-mobi-ticket-widget]")) return;

    const script = document.createElement("script");
    script.dataset.mobiTicketWidget = "true";
    script.async = true;
    script.src = "https://agenciamobi.com.br/widget/mobi-ticket.js";
    script.dataset.source = WIDGET_SOURCE;

    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return null;
}
