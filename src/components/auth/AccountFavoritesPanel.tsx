import { Link } from "@tanstack/react-router";
import { useState, type DragEvent } from "react";
import { useServerFn } from "@tanstack/react-start";

import { DashboardItemControls } from "@/components/auth/DashboardPersonalization";
import type { FavoriteLiveCard } from "@/lib/auth/account-dashboard-live.functions";
import {
  dashboardCardSize,
  favoriteCardLayoutKey,
  placeDashboardItem,
  type DashboardLayout,
} from "@/lib/auth/dashboard-layout";
import {
  FAVORITE_RESOURCES,
  type FavoriteResourceKey,
  type FavoriteResourceGroup,
} from "@/lib/auth/favorite-resources";
import {
  setAccountFavorite,
  type AccountFavoritesSnapshot,
} from "@/lib/auth/favorites.functions";

import "./AccountFavoriteLive.css";

type AuthenticatedFavorites = Extract<AccountFavoritesSnapshot, { status: "authenticated" }>;
type Feedback = { tone: "success" | "error"; text: string } | null;

const GROUPS: readonly FavoriteResourceGroup[] = ["Tempo", "Águas", "Ferramentas"];

function formatUpdatedAt(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function liveMeta(card: FavoriteLiveCard, updatedAt: string | null) {
  const parts = [updatedAt ? `Atualizado ${updatedAt}` : null, card.source ? `Fonte: ${card.source}` : null].filter(
    (value): value is string => Boolean(value),
  );
  return parts.length > 0 ? parts.join(" · ") : "Consulta atual";
}

function FavoriteLiveContent({ card }: { card: FavoriteLiveCard }) {
  const updatedAt = formatUpdatedAt(card.updatedAt);

  return (
    <>
      <div className="account-favorites__live-topline">
        <span className={`account-favorites__live-status is-${card.status}`}>{card.badge}</span>
        <span>Dados do portal</span>
      </div>
      <div className="account-favorites__live-value">{card.primary}</div>
      <p className="account-favorites__live-summary">{card.secondary}</p>
      {card.detail ? <p className="account-favorites__live-detail">{card.detail}</p> : null}
      <div className="account-favorites__live-footer">
        <small>{liveMeta(card, updatedAt)}</small>
        <strong>Abrir →</strong>
      </div>
    </>
  );
}

export function AccountFavoritesPanel({
  snapshot,
  liveCards,
  liveLoading,
  onFavoritesChanged,
  layout,
  customizing,
  onLayoutChange,
}: {
  snapshot: AuthenticatedFavorites;
  liveCards: Partial<Record<FavoriteResourceKey, FavoriteLiveCard>>;
  liveLoading: boolean;
  onFavoritesChanged?: () => Promise<void>;
  layout: DashboardLayout;
  customizing: boolean;
  onLayoutChange: (layout: DashboardLayout) => void;
}) {
  const updateFavorite = useServerFn(setAccountFavorite);
  const [favoriteKeys, setFavoriteKeys] = useState<FavoriteResourceKey[]>(snapshot.favoriteKeys);
  const [pendingKey, setPendingKey] = useState<FavoriteResourceKey | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [draggedFavorite, setDraggedFavorite] = useState<FavoriteResourceKey | null>(null);

  const favoriteSet = new Set(favoriteKeys);
  const favoriteOrderIndex = new Map(layout.favoriteOrder.map((key, index) => [key, index] as const));
  const selectedResources = FAVORITE_RESOURCES.filter((resource) => favoriteSet.has(resource.key)).sort(
    (first, second) =>
      (favoriteOrderIndex.get(first.key) ?? Number.MAX_SAFE_INTEGER) -
      (favoriteOrderIndex.get(second.key) ?? Number.MAX_SAFE_INTEGER),
  );
  const selectedKeys = selectedResources.map((resource) => resource.key);

  function moveFavorite(resourceKey: FavoriteResourceKey, direction: -1 | 1) {
    const index = selectedKeys.indexOf(resourceKey);
    const target = selectedKeys[index + direction];
    if (!target) return;
    onLayoutChange({
      ...layout,
      favoriteOrder: placeDashboardItem(layout.favoriteOrder, resourceKey, target),
    });
  }

  function resizeFavorite(resourceKey: FavoriteResourceKey, size: "compact" | "medium" | "wide") {
    const key = favoriteCardLayoutKey(resourceKey);
    onLayoutChange({
      ...layout,
      sizes: { ...layout.sizes, [key]: size },
    });
  }

  function startFavoriteDrag(event: DragEvent<HTMLButtonElement>, resourceKey: FavoriteResourceKey) {
    setDraggedFavorite(resourceKey);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", resourceKey);
  }

  function dropFavorite(target: FavoriteResourceKey) {
    if (!draggedFavorite) return;
    onLayoutChange({
      ...layout,
      favoriteOrder: placeDashboardItem(layout.favoriteOrder, draggedFavorite, target),
    });
    setDraggedFavorite(null);
  }

  async function toggleFavorite(resourceKey: FavoriteResourceKey) {
    if (pendingKey) return;

    const active = !favoriteSet.has(resourceKey);
    setPendingKey(resourceKey);
    setFeedback(null);

    try {
      const result = await updateFavorite({ data: { resourceKey, active } });

      if (!result.ok) {
        if (result.code === "unauthenticated") {
          window.location.assign("/conta?next=/painel");
          return;
        }

        setFeedback({
          tone: "error",
          text:
            result.code === "not_entitled"
              ? "Favoritos não estão habilitados para esta conta."
              : "Não foi possível atualizar seus favoritos agora.",
        });
        return;
      }

      setFavoriteKeys((current) =>
        active
          ? current.includes(resourceKey)
            ? current
            : [resourceKey, ...current]
          : current.filter((key) => key !== resourceKey),
      );
      setFeedback({
        tone: "success",
        text: active
          ? "Favorito salvo. O painel vai buscar a leitura atual quando ela estiver disponível."
          : "Favorito removido do seu painel.",
      });
      await onFavoritesChanged?.();
    } catch {
      setFeedback({ tone: "error", text: "Não foi possível atualizar seus favoritos agora." });
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <section className="account-favorites" aria-labelledby="account-favorites-title">
      <div className="account-dashboard__section-heading account-favorites__heading">
        <span className="eyebrow">Favoritos Vivos · Free</span>
        <h2 id="account-favorites-title">O que você acompanha vem até o painel</h2>
        <p>
          Salve páginas, estações e ferramentas que você consulta com frequência. Quando existe uma
          leitura canônica disponível, o favorito deixa de ser apenas um atalho e mostra o estado atual
          diretamente aqui. O conteúdo público continua aberto para qualquer visitante.
        </p>
      </div>

      {!snapshot.storageReady ? (
        <div className="account-favorites__notice" role="status">
          <strong>Favoritos temporariamente indisponíveis</strong>
          <p>
            Sua conta continua ativa. Assim que a estrutura de favoritos estiver disponível neste
            ambiente, seus recursos poderão ser salvos aqui.
          </p>
        </div>
      ) : !snapshot.enabled ? (
        <div className="account-favorites__notice" role="status">
          <strong>Favoritos não habilitados nesta conta</strong>
          <p>Os demais recursos liberados para sua conta continuam funcionando normalmente.</p>
        </div>
      ) : (
        <>
          <div className="account-favorites__saved" aria-live="polite" aria-busy={liveLoading}>
            <div className="account-favorites__saved-heading">
              <div>
                <small>Meu acompanhamento</small>
                <strong>
                  {selectedResources.length === 0
                    ? "Nenhum favorito ainda"
                    : `${selectedResources.length} ${selectedResources.length === 1 ? "favorito" : "favoritos"}`}
                </strong>
              </div>
              <span>{liveLoading ? "Atualizando dados" : "Incluído no plano Free"}</span>
            </div>

            {selectedResources.length === 0 ? (
              <p className="account-favorites__empty">
                Marque a estrela nos recursos abaixo. Os que possuem leitura estruturada passam a mostrar
                a condição atual aqui no painel.
              </p>
            ) : (
              <div className="account-favorites__shortcuts account-favorites__shortcuts--live">
                {selectedResources.map((resource, index) => {
                  const liveCard = liveCards[resource.key];
                  const layoutKey = favoriteCardLayoutKey(resource.key);
                  const size = dashboardCardSize(layout, layoutKey);
                  return (
                    <div
                      key={resource.key}
                      className={`dashboard-card-edit-shell dashboard-card-size-${size}${customizing ? " is-editing" : ""}`}
                      onDragOver={customizing ? (event) => event.preventDefault() : undefined}
                      onDrop={customizing ? () => dropFavorite(resource.key) : undefined}
                    >
                      {customizing ? (
                        <DashboardItemControls
                          label={resource.title}
                          size={size}
                          canMoveUp={index > 0}
                          canMoveDown={index < selectedResources.length - 1}
                          onMoveUp={() => moveFavorite(resource.key, -1)}
                          onMoveDown={() => moveFavorite(resource.key, 1)}
                          onSizeChange={(nextSize) => resizeFavorite(resource.key, nextSize)}
                          onDragStart={(event) => startFavoriteDrag(event, resource.key)}
                        />
                      ) : null}
                      <Link
                        to={resource.href}
                        className={`account-favorites__shortcut${liveCard ? " account-favorites__shortcut--live" : ""}`}
                      >
                        <span>{resource.group}</span>
                        <strong>{resource.title}</strong>
                        {liveCard ? (
                          <FavoriteLiveContent card={liveCard} />
                        ) : (
                          <>
                            <p className="account-favorites__shortcut-description">{resource.description}</p>
                            <small>{liveLoading ? "Verificando dados…" : "Abrir →"}</small>
                          </>
                        )}
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {feedback ? (
            <p
              className={`account-favorites__feedback is-${feedback.tone}`}
              role={feedback.tone === "error" ? "alert" : "status"}
            >
              {feedback.text}
            </p>
          ) : null}

          <div className="account-favorites__catalog">
            {GROUPS.map((group) => {
              const resources = FAVORITE_RESOURCES.filter((resource) => resource.group === group);
              return (
                <section key={group} className="account-favorites__group" aria-labelledby={`favorite-group-${group}`}>
                  <h3 id={`favorite-group-${group}`}>{group}</h3>
                  <div className="account-favorites__choices">
                    {resources.map((resource) => {
                      const selected = favoriteSet.has(resource.key);
                      const pending = pendingKey === resource.key;

                      return (
                        <article className={`account-favorites__choice${selected ? " is-selected" : ""}`} key={resource.key}>
                          <div>
                            <strong>{resource.title}</strong>
                            <p>{resource.description}</p>
                          </div>
                          <button
                            type="button"
                            className="account-favorites__toggle"
                            aria-pressed={selected}
                            aria-label={`${selected ? "Remover" : "Adicionar"} ${resource.title} ${selected ? "dos" : "aos"} favoritos`}
                            disabled={Boolean(pendingKey)}
                            onClick={() => void toggleFavorite(resource.key)}
                          >
                            <span aria-hidden="true">{selected ? "★" : "☆"}</span>
                            {pending ? "Salvando…" : selected ? "Salvo" : "Favoritar"}
                          </button>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
