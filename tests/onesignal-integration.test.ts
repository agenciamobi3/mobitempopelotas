import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const ROOT_ROUTE_PATH = new URL("../src/routes/__root.tsx", import.meta.url);
const PWA_MANAGER_PATH = new URL("../src/components/pwa/PwaManager.tsx", import.meta.url);

test("não carrega SDK externo de notificações na raiz da aplicação", async () => {
  const rootRoute = await readFile(ROOT_ROUTE_PATH, "utf8");

  assert.doesNotMatch(rootRoute, /OneSignal/);
  assert.doesNotMatch(rootRoute, /cdn\.onesignal\.com/);
  assert.doesNotMatch(rootRoute, /notifyButton/);
  assert.doesNotMatch(rootRoute, /dangerouslySetInnerHTML=\{\{ __html: ONESIGNAL/);
});

test("mantém o service worker do portal fora do caminho crítico enquanto suspenso", async () => {
  const pwaManager = await readFile(PWA_MANAGER_PATH, "utf8");

  assert.match(pwaManager, /TEMPO_SERVICE_WORKER_PATH = "\/sw\.js"/);
  assert.match(pwaManager, /navigator\.serviceWorker\.getRegistrations\(\)/);
  assert.match(pwaManager, /registration\.unregister\(\)/);
  assert.doesNotMatch(pwaManager, /navigator\.serviceWorker\.register\(/);
  assert.doesNotMatch(pwaManager, /OneSignal|cdn\.onesignal\.com/);
});

test("não monta gerenciadores paralelos de notificações", async () => {
  const rootRoute = await readFile(ROOT_ROUTE_PATH, "utf8");

  assert.doesNotMatch(rootRoute, /PushNotificationsManager/);
});
