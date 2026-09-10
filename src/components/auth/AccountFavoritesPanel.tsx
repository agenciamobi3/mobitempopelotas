import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import {
  FAVORITE_RESOURCES,
  type FavoriteResourceKey,
  type FavoriteResourceGroup,
} from "@/lib/auth/favorite-resources";
import {
  setAccountFavorite,
  type AccountFavoritesSnapshot,
} from "@/lib/auth/favorites.functions";

type AuthenticatedFavorites = Extract<AccountFavoritesSnapshot, { status: "authenticated" }>;
type Feedback = { tone: "success" | "error"; text: string } | null;

const GROUPS: readonly FavoriteResourceGroup[] = ["Tempo", "Águas", "Ferramentas"];

export function AccountFavoritesPanel({ snapshot }: { snapshot: AuthenticatedFavorites }) {
  const updateFavorite = useServerFn(setAccountFavorite);
  const [favoriteKeys, setFavoriteKeys] = useState<FavoriteResourceKey[]>(snapshot.favoriteKeys);
  const [pendingKey, setPendingKey] = useState<FavoriteResourceKey | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const favoriteSet = new Set(favoriteKeys);
  const selectedResources = FAVORITE_RESOURCES.filter((resource) => favoriteSet.has(resource.key));

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
        text: active ? "Atalho adicionado aos seus favoritos." : "Atalho removido dos favoritos.",
      });
    } catch {
      setFeedback({ tone: "error", text: "Não foi possível atualizar seus favoritos agora." });
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <section className="account-favorites" aria-labelledby="account-favorites-title">
      <div className="account-dashboard__section-heading account-favorites__heading">
        <span className="eyebrow">Favoritos · Free</span>
        <h2 id="account-favorites-title">Seu Tempo Pelotas em poucos atalhos</h2>
        <p>
          Salve páginas, estações e ferramentas que você consulta com frequência. O favorito organiza
          seu painel, mas o conteúdo público continua aberto para qualquer visitante.
        </p>
      </div>

      {!snapshot.storageReady ? (
        <div className="account-favorites__notice" role="status">
          <strong>Favoritos temporariamente indisponíveis</strong>
          <p>
            Sua conta continua ativa. Assim que a estrutura de favoritos estiver disponível neste
            ambiente, seus atalhos poderão ser salvos aqui.
          </p>
        </div>
      ) : !snapshot.enabled ? (
        <div className="account-favorites__notice" role="status">
          <strong>Favoritos não habilitados nesta conta</strong>
          <p>Os demais recursos liberados para sua conta continuam funcionando normalmente.</p>
        </div>
      ) : (
        <>
          <div className="account-favorites__saved" aria-live="polite">
            <div className="account-favorites__saved-heading">
              <div>
                <small>Meus atalhos</small>
                <strong>
                  {selectedResources.length === 0
                    ? "Nenhum favorito ainda"
                    : `${selectedResources.length} ${selectedResources.length === 1 ? "favorito" : "favoritos"}`}
                </strong>
              </div>
              <span>Incluído no plano Free</span>
            </div>

            {selectedResources.length === 0 ? (
              <p className="account-favorites__empty">
                Marque a estrela nos recursos abaixo. Eles aparecerão aqui para abrir em um toque.
              </p>
            ) : (
              <div className="account-favorites__shortcuts">
                {selectedResources.map((resource) => (
                  <Link key={resource.key} to={resource.href} className="account-favorites__shortcut">
                    <span>{resource.group}</span>
                    <strong>{resource.title}</strong>
                    <small>Abrir →</small>
                  </Link>
                ))}
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
