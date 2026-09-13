import { Link } from "@tanstack/react-router";
import {
  BellRing,
  Camera,
  CloudSun,
  Globe2,
  Heart,
  LayoutDashboard,
  RadioTower,
  Settings,
  SlidersHorizontal,
  UserRound,
  Waves,
} from "lucide-react";

import type { AccountSnapshot } from "@/lib/auth/account.functions";

type AuthenticatedAccount = Extract<AccountSnapshot, { status: "authenticated" }>;

function initials(displayName: string) {
  const parts = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "TP";
}

function AccountIdentity({ snapshot }: { snapshot: AuthenticatedAccount }) {
  return (
    <div className="account-app-nav__identity">
      <span className="account-app-nav__avatar" aria-hidden="true">
        {snapshot.identity.avatarUrl ? (
          <img src={snapshot.identity.avatarUrl} alt="" />
        ) : (
          initials(snapshot.identity.displayName)
        )}
      </span>
      <span className="account-app-nav__identity-copy">
        <strong>{snapshot.identity.displayName}</strong>
        <small>Conta {snapshot.access.label}</small>
      </span>
    </div>
  );
}

export function AccountDashboardNavigation({ snapshot }: { snapshot: AuthenticatedAccount }) {
  return (
    <>
      <aside className="account-app-nav" aria-label="Navegação do meu Tempo Pelotas">
        <Link className="account-app-nav__brand" to="/" aria-label="Ir para o portal Tempo Pelotas">
          <img
            src="/brand/tempo-pelotas-header.svg"
            alt="Tempo Pelotas"
            width={11349}
            height={1552}
          />
        </Link>

        <AccountIdentity snapshot={snapshot} />

        <nav className="account-app-nav__groups">
          <div className="account-app-nav__group">
            <span className="account-app-nav__group-label">Meu painel</span>
            <a className="account-app-nav__item is-current" href="#visao-geral">
              <LayoutDashboard aria-hidden="true" size={18} />
              <span>Visão geral</span>
            </a>
            <a className="account-app-nav__item" href="#painel-vivo">
              <CloudSun aria-hidden="true" size={18} />
              <span>Painel Vivo</span>
            </a>
            <a className="account-app-nav__item" href="#favoritos">
              <Heart aria-hidden="true" size={18} />
              <span>Favoritos</span>
            </a>
          </div>

          <div className="account-app-nav__group">
            <span className="account-app-nav__group-label">Ferramentas</span>
            <Link className="account-app-nav__item" to="/observatorio">
              <Globe2 aria-hidden="true" size={18} />
              <span>Observatório</span>
              <small>Novo</small>
            </Link>
            <Link className="account-app-nav__item" to="/widgets">
              <SlidersHorizontal aria-hidden="true" size={18} />
              <span>Widgets</span>
            </Link>
          </div>

          <div className="account-app-nav__group">
            <span className="account-app-nav__group-label">Explorar</span>
            <Link className="account-app-nav__item" to="/radar-e-satelite-pelotas">
              <RadioTower aria-hidden="true" size={18} />
              <span>Radar e satélite</span>
            </Link>
            <Link className="account-app-nav__item" to="/alertas">
              <BellRing aria-hidden="true" size={18} />
              <span>Alertas oficiais</span>
            </Link>
            <Link className="account-app-nav__item" to="/cameras-ao-vivo-pelotas">
              <Camera aria-hidden="true" size={18} />
              <span>Câmeras</span>
            </Link>
            <Link className="account-app-nav__item" to="/situacao-hidrologica-pelotas">
              <Waves aria-hidden="true" size={18} />
              <span>Situação das águas</span>
            </Link>
          </div>
        </nav>

        <div className="account-app-nav__footer">
          <Link
            className="account-app-nav__item"
            to="/conta"
            search={{ erro: undefined, next: "/conta" }}
          >
            <Settings aria-hidden="true" size={18} />
            <span>Minha conta</span>
          </Link>
          <Link className="account-app-nav__portal" to="/">
            Voltar ao portal
          </Link>
          <small>Seu painel reúne recursos da conta e atalhos para o portal.</small>
        </div>
      </aside>

      <nav className="account-app-mobile-nav" aria-label="Atalhos do painel">
        <a href="#visao-geral">
          <LayoutDashboard aria-hidden="true" size={19} />
          <span>Início</span>
        </a>
        <a href="#favoritos">
          <Heart aria-hidden="true" size={19} />
          <span>Favoritos</span>
        </a>
        <Link to="/observatorio">
          <Globe2 aria-hidden="true" size={19} />
          <span>Observatório</span>
        </Link>
        <Link to="/widgets">
          <SlidersHorizontal aria-hidden="true" size={19} />
          <span>Widgets</span>
        </Link>
        <Link to="/conta" search={{ erro: undefined, next: "/conta" }}>
          <UserRound aria-hidden="true" size={19} />
          <span>Conta</span>
        </Link>
      </nav>
    </>
  );
}
