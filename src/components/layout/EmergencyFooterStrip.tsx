import { ExternalLink, PhoneCall } from "lucide-react";

import "./EmergencyFooterStrip.css";

const emergencyPhones = [
  { number: "190", label: "Brigada Militar" },
  { number: "192", label: "SAMU" },
  { number: "193", label: "Bombeiros" },
] as const;

const DEFESA_CIVIL_URL = "https://defesacivil.rs.gov.br/";
const DEFESA_CIVIL_LOGO_URL = "/defesa-civil-rs.png";

export function EmergencyFooterStrip() {
  return (
    <section
      className="tp-public-service-strip"
      aria-label="Telefones úteis e cadastro para alertas da Defesa Civil do Rio Grande do Sul"
    >
      <div className="tp-public-service-strip__inner">
        <section className="tp-public-service-phones" aria-labelledby="tp-public-service-phones-title">
          <div className="tp-public-service-phones__heading">
            <span>Serviço público</span>
            <h2 id="tp-public-service-phones-title">Telefones de emergência</h2>
            <p>Atalhos para atendimento imediato quando a situação exigir.</p>
          </div>
          <div className="tp-public-service-phones__grid">
            {emergencyPhones.map((phone) => (
              <a
                key={phone.number}
                href={`tel:${phone.number}`}
                aria-label={`Ligar para ${phone.label} no número ${phone.number}`}
              >
                <strong>
                  <PhoneCall aria-hidden="true" />
                  {phone.number}
                </strong>
                <span>{phone.label}</span>
              </a>
            ))}
          </div>
        </section>

        <section
          className="tp-public-service-civil-defense"
          aria-labelledby="tp-public-service-civil-defense-title"
        >
          <div className="tp-public-service-civil-defense__identity">
            <img
              src={DEFESA_CIVIL_LOGO_URL}
              alt="Defesa Civil do Rio Grande do Sul"
              width={82}
              height={82}
              loading="lazy"
              decoding="async"
            />
            <div>
              <span>Alertas oficiais · Defesa Civil RS</span>
              <h2 id="tp-public-service-civil-defense-title">Receba avisos diretamente no celular</h2>
            </div>
            <a
              href={DEFESA_CIVIL_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Abrir o portal oficial da Defesa Civil do Rio Grande do Sul em nova aba"
            >
              Portal oficial
              <ExternalLink aria-hidden="true" />
            </a>
          </div>

          <div className="tp-public-service-civil-defense__signup">
            <p>
              Cadastre gratuitamente uma área de interesse: envie um SMS para
              <strong> 40199 </strong>
              com o <strong>CEP</strong> que deseja acompanhar.
            </p>
            <a href="sms:40199" aria-label="Enviar SMS para 40199 e cadastrar um CEP">
              Cadastrar CEP por SMS
            </a>
          </div>
        </section>
      </div>
    </section>
  );
}
