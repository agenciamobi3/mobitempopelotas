import { Footer } from "@/components/layout/Footer";
import type { WeatherData } from "@/production/lib/weather-data";

import "./site-footer-home.css";

type SiteFooterProps = {
  source?: WeatherData["source"];
};

/**
 * Footer público único do Tempo Pelotas.
 * Conteúdo, navegação, utilidade pública e geometria são compartilhados pela
 * Home, páginas internas e páginas institucionais.
 */
export function SiteFooter({ source }: SiteFooterProps) {
  return <Footer source={source} />;
}
