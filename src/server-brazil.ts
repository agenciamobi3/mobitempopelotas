import { createBrazilOnlyAccessResponse } from "./lib/brazil-only-access.server";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let appServerPromise: Promise<ServerEntry> | undefined;

async function getAppServer() {
  if (!appServerPromise) {
    appServerPromise = import("./server").then((module) => module.default as ServerEntry);
  }
  return appServerPromise;
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const restricted = createBrazilOnlyAccessResponse(request);
    if (restricted) return restricted;

    const appServer = await getAppServer();
    return appServer.fetch(request, env, ctx);
  },
};
