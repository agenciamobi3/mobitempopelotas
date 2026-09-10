"use client";

import { useRouterState } from "@tanstack/react-router";
import type { AnchorHTMLAttributes } from "react";
import { Fragment, useEffect, useRef, useState } from "react";

import { AuthAccountAction } from "@/components/auth/AuthAccountAction";
import type { EditorialInternalPath } from "@/lib/editorial-content";
import type { InmetAlertSeverity } from "@/production/lib/inmet-alerts";
import type { AdvisoryLevel } from "@/production/lib/weather-insights";

import "./home-editorial-header.css";

type MegaMenuId = "forecast" | "water" | "region" | "explore";
type HeaderStaticPath =
  | EditorialInternalPath
  | "/blog"
  | "/estacao-embrapa-pelotas"
  | "/nivel-da-lagoa-dos-patos"
  | "/nivel-do-canal-sao-goncalo"
  | "/nivel-do-rio-jaguarao"
  | "/historia-das-enchentes-pelotas"
  | "/enchente-1941-pelotas"
  | "/enchente-2001-pelotas"
  | "/enchente-2015-pelotas"
  | "/enchente-2024-pelotas-laranjal"
  | "/previsao-15-dias-pelotas"
  | "/status-dos-dados"
  | "/tempo-na-regiao-sul-rs";

type HeaderStaticLink = {
  label: string;
  to: HeaderStaticPath;
  description: string;
};

type HeaderRegionalLink = {
  label: string;
  to: "/tempo-em/$citySlug";
  params: { citySlug: string };
  path: `/tempo-em/${string}`;
  description: string;
};

type HeaderMenuLink = HeaderStaticLink | HeaderRegionalLink;

type HeaderMenuDefinition = {
  id: MegaMenuId;
  label: string;
  summary: string;
  activePaths: readonly string[];
  featured: HeaderStaticLink & { eyebrow: string };
  sections: readonly {
    title: string;
    links: readonly HeaderMenuLink[];
  }[];
};

type PublicHeaderLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: string;
  params?: Record<string, string>;
};

/**
 * O menu principal do portal público usa navegação nativa de documento.
 * Mantemos a assinatura `to`/`params` localmente para que o inventário editorial
 * continue tipado, sem envolver o TanStack Link, preload ou transição SPA.
 */
function Link({ to, params, ...props }: PublicHeaderLinkProps) {
  const href = params
    ? Object.entries(params).reduce(
        (resolved, [key, value]) => resolved.replace(`$${key}`, encodeURIComponent(value)),
        to,
      )
    : to;

  return <a {...props} href={href} />;
}

const megaMenus: readonly HeaderMenuDefinition[] = [
  {
    id: "forecast",
    label: "Previsão",
    summary: "Planejamento do dia, da semana e do horizonte estendido.",
    activePaths: [
      "/tempo-hoje-pelotas",
      "/tempo-amanha-pelotas",
      "/previsao-7-dias-pelotas",
      "/previsao-15-dias-pelotas",
      "/chuva-em-pelotas",
      "/vento-em-pelotas",
      "/meteograma-pelotas",
    ],
    featured: {
      eyebrow: "Tempo em Pelotas",
      label: "Previsão de hoje",
      to: "/tempo-hoje-pelotas",
      description: "Condição do dia, próximas horas e mudanças mais relevantes.",
    },
    sections: [
      {
        title: "Planeje o dia",
        links: [
          {
            label: "Tempo amanhã",
            to: "/tempo-amanha-pelotas",
            description: "Temperatura, chuva e vento para o próximo dia.",
          },
          {
            label: "Próximos 7 dias",
            to: "/previsao-7-dias-pelotas",
            description: "Tendência completa da semana em Pelotas.",
          },
          {
            label: "Próximos 15 dias",
            to: "/previsao-15-dias-pelotas",
            description: "Tendência estendida, com incerteza crescente no horizonte.",
          },
          {
            label: "Meteograma",
            to: "/meteograma-pelotas",
            description: "Temperatura, chuva, pressão, nuvens e vento hora a hora.",
          },
        ],
      },
      {
        title: "Variáveis",
        links: [
          {
            label: "Chuva em Pelotas",
            to: "/chuva-em-pelotas",
            description: "Probabilidade, volume e evolução prevista.",
          },
          {
            label: "Vento e rajadas",
            to: "/vento-em-pelotas",
            description: "Direção, velocidade e rajadas previstas.",
          },
        ],
      },
    ],
  },
  {
    id: "water",
    label: "Águas",
    summary: "Lagoa dos Patos, Guaíba, rios, canais regionais e memória das cheias.",
    activePaths: [
      "/situacao-hidrologica-pelotas",
      "/nivel-da-lagoa-dos-patos",
      "/nivel-da-lagoa-dos-patos-laranjal",
      "/nivel-do-guaiba",
      "/nivel-do-canal-sao-goncalo",
      "/nivel-do-rio-jaguarao",
      "/historia-das-enchentes-pelotas",
      "/enchente-1941-pelotas",
      "/enchente-2001-pelotas",
      "/enchente-2015-pelotas",
      "/enchente-2024-pelotas-laranjal",
    ],
    featured: {
      eyebrow: "Situação hidrológica",
      label: "Acompanhe a rede de águas",
      to: "/situacao-hidrologica-pelotas",
      description: "Laranjal, Lagoa dos Patos, Guaíba e estações regionais.",
    },
    sections: [
      {
        title: "Agora",
        links: [
          {
            label: "Nível da Lagoa dos Patos",
            to: "/nivel-da-lagoa-dos-patos",
            description: "Panorama dos cinco pontos locais monitorados entre Itapuã e o estuário.",
          },
          {
            label: "Nível no Laranjal",
            to: "/nivel-da-lagoa-dos-patos-laranjal",
            description: "Leitura local, movimento recente da série e contexto da Lagoa dos Patos.",
          },
          {
            label: "Nível do Guaíba",
            to: "/nivel-do-guaiba",
            description: "Leitura regional do Guaíba com referência própria das estações.",
          },
          {
            label: "Nível do Canal São Gonçalo",
            to: "/nivel-do-canal-sao-goncalo",
            description: "Leitura da estação da Eclusa em Capão do Leão, com referência própria.",
          },
          {
            label: "Nível do Rio Jaguarão",
            to: "/nivel-do-rio-jaguarao",
            description: "Leitura oficial em Jaguarão, com horário, tendência informada pela fonte e limites da régua.",
          },
          {
            label: "Situação das águas",
            to: "/situacao-hidrologica-pelotas",
            description: "Visão integrada da rede hidrológica regional.",
          },
        ],
      },
      {
        title: "Memória e contexto",
        links: [
          {
            label: "História das enchentes",
            to: "/historia-das-enchentes-pelotas",
            description: "Índice de pesquisa com os registros de 1941, 2001, 2015 e 2024.",
          },
          {
            label: "Enchente de 1941",
            to: "/enchente-1941-pelotas",
            description: "Registro documental da cheia histórica em Pelotas e no São Gonçalo.",
          },
          {
            label: "Enchente de 2001",
            to: "/enchente-2001-pelotas",
            description: "Ciclone extratropical, avanço das águas no Laranjal e isolamento da Z3.",
          },
          {
            label: "Enchente de 2015",
            to: "/enchente-2015-pelotas",
            description: "Linha do tempo dos boletins oficiais, níveis, impactos e resposta pública.",
          },
          {
            label: "Enchente de 2024",
            to: "/enchente-2024-pelotas-laranjal",
            description: "Linha do tempo da cheia histórica em Pelotas e no Laranjal.",
          },
        ],
      },
    ],
  },
  {
    id: "region",
    label: "Região",
    summary: "Previsão regional e cidades da Zona Sul do Rio Grande do Sul.",
    activePaths: ["/tempo-na-regiao-sul-rs", "/tempo-em/"],
    featured: {
      eyebrow: "Zona Sul do RS",
      label: "Tempo na região",
      to: "/tempo-na-regiao-sul-rs",
      description: "Visão meteorológica das cidades acompanhadas pelo Tempo Pelotas.",
    },
    sections: [
      {
        title: "Pelotas e entorno",
        links: [
          {
            label: "Capão do Leão",
            to: "/tempo-em/$citySlug",
            params: { citySlug: "capao-do-leao-rs" },
            path: "/tempo-em/capao-do-leao-rs",
            description: "Previsão regional para o município vizinho a Pelotas.",
          },
          {
            label: "Canguçu",
            to: "/tempo-em/$citySlug",
            params: { citySlug: "cangucu-rs" },
            path: "/tempo-em/cangucu-rs",
            description: "Tempo na Serra do Sudeste e área rural regional.",
          },
          {
            label: "Morro Redondo",
            to: "/tempo-em/$citySlug",
            params: { citySlug: "morro-redondo-rs" },
            path: "/tempo-em/morro-redondo-rondo-rs",
            description: "Previsão para o município serrano próximo a Pelotas.",
          },
        ],
      },
      {
        title: "Costa e fronteira",
        links: [
          {
            label: "Rio Grande",
            to: "/tempo-em/$citySlug",
            params: { citySlug: "rio-grande-rs" },
            path: "/tempo-em/rio-grande-rs",
            description: "Condições na cidade portuária e entorno costeiro.",
          },
          {
            label: "São Lourenço do Sul",
            to: "/tempo-em/$citySlug",
            params: { citySlug: "sao-lourenco-do-sul-rs" },
            path: "/tempo-em/sao-lourenco-do-sul-rs",
            description: "Previsão para a Costa Doce junto à Lagoa dos Patos.",
          },
          {
            label: "Jaguarão",
            to: "/tempo-em/$citySlug",
            params: { citySlug: "jaguarao-rs" },
            path: "/tempo-em/jaguarao-rs",
            description: "Condições meteorológicas na Fronteira Sul.",
          },
        ],
      },
    ],
  },
  {
    id: "explore",
    label: "Explorar",
    summary: "Observação, clima, histórico, conteúdo editorial e transparência dos dados.",
    activePaths: [
      "/estacao-embrapa-pelotas",
      "/cameras-ao-vivo-pelotas",
      "/mapa-de-geadas-rio-grande-do-sul",
      "/clima-em-pelotas",
      "/historico-climatico-pelotas",
      "/blog",
      "/status-dos-dados",
    ],
    featured: {
      eyebrow: "Entenda Pelotas",
      label: "Clima de Pelotas",
      to: "/clima-em-pelotas",
      description: "Estações do ano, Lagoa dos Patos e dinâmica do clima local.",
    },
    sections: [
      {
        title: "Observação e contexto",
        links: [
          {
            label: "Estação Embrapa",
            to: "/estacao-embrapa-pelotas",
            description: "Medições locais de temperatura, chuva, vento e pressão.",
          },
          {
            label: "Câmeras ao vivo",
            to: "/cameras-ao-vivo-pelotas",
            description: "Céu, visibilidade e condições locais em vídeo.",
          },
          {
            label: "Mapa de geadas",
            to: "/mapa-de-geadas-rio-grande-do-sul",
            description: "Produto oficial do INMET para o Rio Grande do Sul.",
          },
          {
            label: "Histórico climático",
            to: "/historico-climatico-pelotas",
            description: "Compare temperatura, chuva e vento dos últimos dias.",
          },
        ],
      },
      {
        title: "Conteúdo e transparência",
        links: [
          {
            label: "Blog",
            to: "/blog",
            description: "Conteúdo meteorológico e explicações do portal.",
          },
          {
            label: "Dados e fontes",
            to: "/status-dos-dados",
            description: "Origem, atualização e limites das informações do portal.",
          },
        ],
      },
    ],
  },
];

function isActivePath(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

function isMenuActive(pathname: string, activePaths: readonly string[]) {
  return activePaths.some((path) => pathname === path || pathname.startsWith(path));
}

function isRegionalMenuLink(item: HeaderMenuLink): item is HeaderRegionalLink {
  return item.to === "/tempo-em/$citySlug";
}

function itemPath(item: HeaderMenuLink) {
  return isRegionalMenuLink(item) ? item.path : item.to;
}

function alertLabel(level: AdvisoryLevel, officialSeverity: InmetAlertSeverity) {
  if (officialSeverity === "great-danger") return "Alerta vermelho";
  if (officialSeverity === "danger") return "Alerta laranja";
  if (officialSeverity === "potential") return "Alerta amarelo";
  if (level === "warning") return "Alerta ativo";
  if (level === "attention") return "Atenção";
  return "Avisos";
}

function ChevronIcon() {
  return (
    <svg className="tp-home-header__chevron" viewBox="0 0 12 8" aria-hidden="true">
      <path d="m1 1.5 5 5 5-5" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg className="tp-home-header__arrow" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 8h9M9 4l4 4-4 4" />
    </svg>
  );
}

export function HomeEditorialHeader({
  advisoryLevel = "normal",
  officialAlertSeverity = "unknown",
}: {
  advisoryLevel?: AdvisoryLevel;
  officialAlertSeverity?: InmetAlertSeverity;
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const headerRef = useRef<HTMLElement>(null);
  const [openMenu, setOpenMenu] = useState<MegaMenuId | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const alertsActive = isActivePath(pathname, "/alertas");
  const satellitesAndRadarsActive = isActivePath(pathname, "/radar-e-satelite-pelotas");
  const officialSeverityClass =
    officialAlertSeverity === "unknown" ? "" : ` severity-${officialAlertSeverity}`;

  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpenMenu(null);
      setMobileOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <>
      <a className="skip-link" href="#conteudo-principal">
        Pular para o conteúdo principal
      </a>
      <header
        ref={headerRef}
        className="tp-home-header"
        data-advisory-level={advisoryLevel}
        data-official-alert-severity={officialAlertSeverity}
        data-mobile-open={mobileOpen ? "true" : "false"}
      >
        <div className="tp-home-header__inner">
          <Link
            className="tp-home-header__brand"
            to="/"
            aria-label="Tempo Pelotas — página inicial"
          >
            <img
              src="/brand/tempo-pelotas-purple.svg"
              alt="Tempo Pelotas"
              width={344}
              height={50}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              draggable={false}
            />
          </Link>

          <nav className="tp-home-header__nav" aria-label="Navegação principal do Tempo Pelotas">
            <Link
              className={`tp-home-header__direct${pathname === "/" ? " is-active" : ""}`}
              to="/"
              aria-current={pathname === "/" ? "page" : undefined}
            >
              Agora
            </Link>

            {megaMenus.map((menu) => {
              const isOpen = openMenu === menu.id;
              const isActive = isMenuActive(pathname, menu.activePaths);

              return (
                <Fragment key={menu.id}>
                  <div
                    className={`tp-home-header__nav-item${isOpen ? " is-open" : ""}`}
                    onMouseEnter={() => setOpenMenu(menu.id)}
                    onMouseLeave={() =>
                      setOpenMenu((current) => (current === menu.id ? null : current))
                    }
                    onFocus={() => setOpenMenu(menu.id)}
                    onBlur={(event) => {
                      const nextTarget = event.relatedTarget as Node | null;
                      if (!event.currentTarget.contains(nextTarget)) {
                        setOpenMenu((current) => (current === menu.id ? null : current));
                      }
                    }}
                  >
                    <button
                      className={`tp-home-header__trigger${isActive ? " is-active" : ""}`}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`tp-mega-${menu.id}`}
                      onClick={() =>
                        setOpenMenu((current) => (current === menu.id ? null : menu.id))
                      }
                    >
                      <span>{menu.label}</span>
                      <ChevronIcon />
                    </button>

                    <div
                      className="tp-home-header__mega"
                      id={`tp-mega-${menu.id}`}
                      hidden={!isOpen}
                    >
                      <div className="tp-home-header__mega-surface">
                        <Link
                          className="tp-home-header__mega-featured"
                          to={menu.featured.to}
                          onClick={() => setOpenMenu(null)}
                        >
                          <span className="tp-home-header__mega-eyebrow">{menu.featured.eyebrow}</span>
                          <strong>{menu.featured.label}</strong>
                          <p>{menu.featured.description}</p>
                          <span className="tp-home-header__mega-cta">
                            Abrir <ArrowIcon />
                          </span>
                        </Link>

                        <div className="tp-home-header__mega-content">
                          <div className="tp-home-header__mega-heading">
                            <span>{menu.label}</span>
                            <p>{menu.summary}</p>
                          </div>
                          <div className="tp-home-header__mega-sections">
                            {menu.sections.map((section) => (
                              <section key={section.title}>
                                <h3>{section.title}</h3>
                                <div className="tp-home-header__mega-links">
                                  {section.links.map((item) => {
                                    const path = itemPath(item);
                                    const active = isActivePath(pathname, path);

                                    if (isRegionalMenuLink(item)) {
                                      return (
                                        <Link
                                          key={path}
                                          to={item.to}
                                          params={item.params}
                                          className={active ? "is-active" : undefined}
                                          aria-current={active ? "page" : undefined}
                                          onClick={() => setOpenMenu(null)}
                                        >
                                          <strong>{item.label}</strong>
                                          <span>{item.description}</span>
                                        </Link>
                                      );
                                    }

                                    return (
                                      <Link
                                        key={path}
                                        to={item.to}
                                        className={active ? "is-active" : undefined}
                                        aria-current={active ? "page" : undefined}
                                        onClick={() => setOpenMenu(null)}
                                      >
                                        <strong>{item.label}</strong>
                                        <span>{item.description}</span>
                                      </Link>
                                    );
                                  })}
                                </div>
                              </section>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {menu.id === "forecast" ? (
                    <Link
                      className={`tp-home-header__direct${satellitesAndRadarsActive ? " is-active" : ""}`}
                      to="/radar-e-satelite-pelotas"
                      aria-current={satellitesAndRadarsActive ? "page" : undefined}
                    >
                      Satélites e Radares
                    </Link>
                  ) : null}
                </Fragment>
              );
            })}
          </nav>

          <div className="tp-home-header__actions">
            <button
              className="tp-home-header__mobile-toggle"
              type="button"
              aria-expanded={mobileOpen}
              aria-controls="tp-mobile-menu"
              aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
              onClick={() => setMobileOpen((current) => !current)}
            >
              <span aria-hidden="true" />
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </button>
            <AuthAccountAction />
            <Link
              className={`tp-home-header__alert is-${advisoryLevel}${officialSeverityClass}${alertsActive ? " is-active" : ""}`}
              to="/alertas"
              aria-label="Consultar avisos meteorológicos oficiais para Pelotas"
              aria-current={alertsActive ? "page" : undefined}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3 3.6 19h16.8L12 3Z" />
                <path d="M12 9v4.5M12 17h.01" />
              </svg>
              <span>{alertLabel(advisoryLevel, officialAlertSeverity)}</span>
            </Link>
          </div>
        </div>

        <nav
          className="tp-home-header__mobile-menu"
          id="tp-mobile-menu"
          aria-label="Menu completo do Tempo Pelotas"
          hidden={!mobileOpen}
        >
          <div className="tp-home-header__mobile-menu-inner">
            <Link
              className={`tp-home-header__mobile-home${pathname === "/" ? " is-active" : ""}`}
              to="/"
              aria-current={pathname === "/" ? "page" : undefined}
            >
              <span>Agora</span>
              <strong>Tempo atual em Pelotas</strong>
              <ArrowIcon />
            </Link>

            <div className="tp-home-header__mobile-groups">
              {megaMenus.map((menu) => (
                <Fragment key={menu.id}>
                  <section className="tp-home-header__mobile-group">
                    <div className="tp-home-header__mobile-group-heading">
                      <h2>{menu.label}</h2>
                      <p>{menu.summary}</p>
                    </div>
                    <div className="tp-home-header__mobile-links">
                      <Link className="is-featured" to={menu.featured.to}>
                        <strong>{menu.featured.label}</strong>
                        <span>{menu.featured.description}</span>
                      </Link>
                      {menu.sections.flatMap((section) => section.links).map((item) => {
                        const path = itemPath(item);
                        const active = isActivePath(pathname, path);

                        if (isRegionalMenuLink(item)) {
                          return (
                            <Link
                              key={path}
                              to={item.to}
                              params={item.params}
                              className={active ? "is-active" : undefined}
                              aria-current={active ? "page" : undefined}
                            >
                              <strong>{item.label}</strong>
                              <span>{item.description}</span>
                            </Link>
                          );
                        }

                        return (
                          <Link
                            key={path}
                            to={item.to}
                            className={active ? "is-active" : undefined}
                            aria-current={active ? "page" : undefined}
                          >
                            <strong>{item.label}</strong>
                            <span>{item.description}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </section>

                  {menu.id === "forecast" ? (
                    <section className="tp-home-header__mobile-group" aria-label="Satélites e Radares">
                      <div className="tp-home-header__mobile-links">
                        <Link
                          className={satellitesAndRadarsActive ? "is-featured is-active" : "is-featured"}
                          to="/radar-e-satelite-pelotas"
                          aria-current={satellitesAndRadarsActive ? "page" : undefined}
                        >
                          <strong>Satélites e Radares</strong>
                          <span>Radar de chuva, imagens de satélite e trovoadas em Pelotas e na Zona Sul.</span>
                        </Link>
                      </div>
                    </section>
                  ) : null}
                </Fragment>
              ))}
            </div>
          </div>
        </nav>
      </header>
    </>
  );
}