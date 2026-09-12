import { isGeoRestrictedProductionHost } from "../brazil-only-access.server";

const SUPABASE_ORIGIN = "https://ovcpgjyomwjteapbvfwk.supabase.co";
const SUPABASE_REALTIME_ORIGIN = "wss://ovcpgjyomwjteapbvfwk.supabase.co";
const OBSERVATORY_OSM_ORIGIN = "https://tile.openstreetmap.org";
const OBSERVATORY_TERRAIN_ORIGIN = "https://terrain.reearth.land";

const GLOBAL_CSP_DIRECTIVES = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "manifest-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://accounts.google.com",
  "script-src-attr 'none'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://i.ytimg.com https://img.youtube.com https://lh3.googleusercontent.com https://tiles.openfreemap.org ${OBSERVATORY_OSM_ORIGIN}`,
  "font-src 'self' data: https://tiles.openfreemap.org",
  `connect-src 'self' ${SUPABASE_ORIGIN} ${SUPABASE_REALTIME_ORIGIN} https://www.google-analytics.com https://region1.google-analytics.com https://accounts.google.com https://api.open-meteo.com https://tiles.openfreemap.org ${OBSERVATORY_OSM_ORIGIN} ${OBSERVATORY_TERRAIN_ORIGIN}`,
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://accounts.google.com",
  "worker-src 'self' blob:",
  "media-src 'self' blob:",
  "upgrade-insecure-requests",
] as const;

export const GLOBAL_CONTENT_SECURITY_POLICY = `${GLOBAL_CSP_DIRECTIVES.join("; ")};`;

export function applyGlobalContentSecurityPolicy(request: Request, headers: Headers) {
  if (!isGeoRestrictedProductionHost(request)) return;

  // Respostas especiais, como a página de bloqueio e embeds, já possuem uma política
  // deliberadamente específica. Não enfraquecemos nem sobrescrevemos essas exceções.
  if (headers.has("Content-Security-Policy")) return;

  headers.set("Content-Security-Policy", GLOBAL_CONTENT_SECURITY_POLICY);
}
