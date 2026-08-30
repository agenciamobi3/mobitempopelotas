import "./home-radar-cta.css";

export function HomeRadarCta() {
  return (
    <section className="tp-home-radar-cta" aria-labelledby="tp-home-radar-cta-title">
      <div className="tp-home-radar-cta__content">
        <span className="tp-home-radar-cta__eyebrow">Monitoramento visual</span>
        <h2 id="tp-home-radar-cta-title">Satélites e radares para acompanhar o tempo na região</h2>
        <p>
          Consulte radar de chuva, imagens de satélite e registros de trovoadas em Pelotas e na Zona
          Sul. As imagens são carregadas somente quando você abre o monitoramento.
        </p>
        <a className="tp-home-radar-cta__link" href="/radar-e-satelite-pelotas">
          Ver Satélites e Radares <span aria-hidden="true">→</span>
        </a>
      </div>

      <div className="tp-home-radar-cta__visual" aria-hidden="true">
        <div className="tp-home-radar-cta__radar">
          <span className="tp-home-radar-cta__ring tp-home-radar-cta__ring--one" />
          <span className="tp-home-radar-cta__ring tp-home-radar-cta__ring--two" />
          <span className="tp-home-radar-cta__ring tp-home-radar-cta__ring--three" />
          <span className="tp-home-radar-cta__beam" />
          <span className="tp-home-radar-cta__point tp-home-radar-cta__point--one" />
          <span className="tp-home-radar-cta__point tp-home-radar-cta__point--two" />
          <span className="tp-home-radar-cta__point tp-home-radar-cta__point--three" />
        </div>
        <div className="tp-home-radar-cta__legend">
          <span>Radar</span>
          <span>Satélite</span>
          <span>Trovoadas</span>
        </div>
      </div>
    </section>
  );
}
