export type PublicSourceLink = {
  label: string;
  url: string;
  ariaLabel: string;
};

export const PUBLIC_DATA_SOURCE_LINKS = {
  embrapa: {
    label: "Embrapa Clima Temperado",
    url: "https://agromet.cpact.embrapa.br/online/Current_Monitor.htm",
    ariaLabel: "Abrir dados meteorológicos da Embrapa Clima Temperado em nova aba",
  },
  inmet: {
    label: "INMET",
    url: "https://portal.inmet.gov.br/",
    ariaLabel: "Abrir o portal oficial do INMET em nova aba",
  },
  cppmet: {
    label: "CPPMet/UFPel",
    url: "https://wp.ufpel.edu.br/cppmet/",
    ariaLabel: "Abrir a página oficial do CPPMet da UFPel em nova aba",
  },
  openMeteo: {
    label: "Open-Meteo",
    url: "https://open-meteo.com/",
    ariaLabel: "Abrir a fonte de previsão Open-Meteo em nova aba",
  },
  metNorway: {
    label: "MET Norway",
    url: "https://api.met.no/weatherapi/locationforecast/2.0/documentation",
    ariaLabel: "Abrir a documentação oficial da previsão do MET Norway em nova aba",
  },
  redemet: {
    label: "REDEMET/DECEA",
    url: "https://redemet.decea.mil.br/",
    ariaLabel: "Abrir a REDEMET do DECEA em nova aba",
  },
  simagro: {
    label: "SIMAGRO RS",
    url: "https://simagro.rs.gov.br/",
    ariaLabel: "Abrir o portal oficial do SIMAGRO RS em nova aba",
  },
  defesaCivilRs: {
    label: "Defesa Civil RS",
    url: "https://sistemas.defesacivil.rs.gov.br/api-redehidrometeorologica",
    ariaLabel: "Abrir a documentação oficial da Rede Hidrometeorológica da Defesa Civil RS em nova aba",
  },
  casaMilitarRs: {
    label: "Casa Militar RS",
    url: "https://estado.rs.gov.br/casa-militar",
    ariaLabel: "Abrir a página institucional da Casa Militar do Rio Grande do Sul em nova aba",
  },
  mks: {
    label: "MKS / Qualle Control",
    url: "https://www.mkssistemas.com.br/",
    ariaLabel: "Abrir o site oficial da MKS Desenvolvimento de Sistemas, Qualle Control, em nova aba",
  },
  labHidroSens: {
    label: "LabHidroSens/UFPel",
    url: "https://tb.labhidrosens.com/dashboard/97ec9a60-d9e1-11f0-ac7c-456d9a25fe9a?publicId=0a869e80-d9e8-11f0-ac7c-456d9a25fe9a",
    ariaLabel: "Abrir o painel público da Estação Laranjal do LabHidroSens da UFPel em nova aba",
  },
  metsul: {
    label: "MetSul",
    url: "https://metsul.com/nivel-do-guaiba/",
    ariaLabel: "Abrir a página de nível do Guaíba da MetSul em nova aba",
  },
  tidesat: {
    label: "TideSat Global",
    url: "https://www.tidesatglobal.com/",
    ariaLabel: "Abrir o site oficial da TideSat Global em nova aba",
  },
  nivelGuaiba: {
    label: "Nível Guaíba",
    url: "https://nivelguaiba.com.br/",
    ariaLabel: "Abrir o portal Nível Guaíba em nova aba",
  },
  lagoonNetwork: {
    label: "Rede Lagoa dos Patos",
    url: "https://monitoramentolagoadospatos.com.br/",
    ariaLabel: "Abrir a Rede de Monitoramento do Nível da Lagoa dos Patos em nova aba",
  },
  furg: {
    label: "FURG",
    url: "https://www.furg.br/",
    ariaLabel: "Abrir o site oficial da Universidade Federal do Rio Grande, FURG, em nova aba",
  },
  portosRs: {
    label: "Portos RS",
    url: "https://www.portosrs.com.br/",
    ariaLabel: "Abrir o site oficial da Portos RS em nova aba",
  },
} as const satisfies Record<string, PublicSourceLink>;

export const FOOTER_SOURCE_GROUPS = [
  {
    title: "Previsão e observação",
    sources: [
      PUBLIC_DATA_SOURCE_LINKS.embrapa,
      PUBLIC_DATA_SOURCE_LINKS.inmet,
      PUBLIC_DATA_SOURCE_LINKS.cppmet,
      PUBLIC_DATA_SOURCE_LINKS.openMeteo,
      PUBLIC_DATA_SOURCE_LINKS.metNorway,
    ],
  },
  {
    title: "Monitoramento",
    sources: [PUBLIC_DATA_SOURCE_LINKS.redemet, PUBLIC_DATA_SOURCE_LINKS.simagro],
  },
  {
    title: "Águas",
    sources: [
      PUBLIC_DATA_SOURCE_LINKS.defesaCivilRs,
      PUBLIC_DATA_SOURCE_LINKS.casaMilitarRs,
      PUBLIC_DATA_SOURCE_LINKS.mks,
      PUBLIC_DATA_SOURCE_LINKS.labHidroSens,
      PUBLIC_DATA_SOURCE_LINKS.metsul,
      PUBLIC_DATA_SOURCE_LINKS.tidesat,
      PUBLIC_DATA_SOURCE_LINKS.nivelGuaiba,
      PUBLIC_DATA_SOURCE_LINKS.lagoonNetwork,
      PUBLIC_DATA_SOURCE_LINKS.furg,
      PUBLIC_DATA_SOURCE_LINKS.portosRs,
    ],
  },
] as const;
