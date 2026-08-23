const BRAZIL_COUNTRY_CODE = "BR";
const BLOCKED_LOGO_PATH = "/brand/tempo-pelotas-purple.svg";

const GEO_RESTRICTED_HOSTS = new Set([
  "tempopelotas.com.br",
  "www.tempopelotas.com.br",
  "mobitempopelotas.lovable.app",
]);

const COUNTRY_HEADERS = [
  "cf-ipcountry",
  "cloudfront-viewer-country",
  "x-vercel-ip-country",
  "x-country-code",
  "x-geo-country",
] as const;

type CloudflareRequest = Request & {
  cf?: {
    country?: unknown;
  };
};

function normalizeCountry(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return /^[A-Z0-9]{2}$/.test(normalized) ? normalized : null;
}

export function resolveRequestCountry(request: Request) {
  const cloudflareCountry = normalizeCountry((request as CloudflareRequest).cf?.country);
  if (cloudflareCountry) return cloudflareCountry;

  for (const header of COUNTRY_HEADERS) {
    const value = normalizeCountry(request.headers.get(header));
    if (value) return value;
  }

  return null;
}

export function isGeoRestrictedProductionHost(request: Request) {
  try {
    return GEO_RESTRICTED_HOSTS.has(new URL(request.url).hostname.toLowerCase());
  } catch {
    return false;
  }
}

function isBrowserRequest(request: Request) {
  return Boolean(
    request.headers.get("sec-fetch-dest") ||
      request.headers.get("sec-fetch-mode") ||
      request.headers.get("sec-fetch-site"),
  );
}

function isAllowedForeignAsset(request: Request) {
  try {
    return new URL(request.url).pathname === BLOCKED_LOGO_PATH;
  } catch {
    return false;
  }
}

export function shouldBlockForeignBrowserRequest(request: Request) {
  if (!isGeoRestrictedProductionHost(request)) return false;
  if (!isBrowserRequest(request)) return false;
  if (isAllowedForeignAsset(request)) return false;

  return resolveRequestCountry(request) !== BRAZIL_COUNTRY_CODE;
}

function blockedPageDocument() {
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="robots" content="noindex,nofollow,noarchive,nosnippet,noimageindex">
  <meta name="googlebot" content="noindex,nofollow,noarchive,nosnippet,noimageindex">
  <meta name="theme-color" content="#ffffff">
  <title>Tempo Pelotas</title>
  <style>
    *{box-sizing:border-box}
    html,body{width:100%;min-height:100%;margin:0;background:#fff}
    body{display:grid;min-height:100dvh;place-items:center;padding:28px}
    main{display:grid;width:100%;place-items:center}
    img{display:block;width:min(72vw,560px);height:auto}
    @media(max-width:560px){img{width:min(82vw,440px)}}
  </style>
</head>
<body>
  <main aria-label="Tempo Pelotas">
    <img src="${BLOCKED_LOGO_PATH}" alt="Tempo Pelotas" width="10643" height="1552">
  </main>
</body>
</html>`;
}

function blockedHeaders() {
  return new Headers({
    "Content-Type": "text/html; charset=utf-8",
    "Content-Language": "pt-BR",
    "Cache-Control": "private, no-store, max-age=0",
    "CDN-Cache-Control": "no-store",
    "Content-Security-Policy":
      "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; script-src 'none'; connect-src 'none'; font-src 'none'; media-src 'none'; object-src 'none'; worker-src 'none'; frame-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Permissions-Policy":
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), accelerometer=(), gyroscope=(), magnetometer=()",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet, noimageindex",
    Vary: "CF-IPCountry, Sec-Fetch-Dest, Sec-Fetch-Mode, Sec-Fetch-Site",
  });
}

export function createBrazilOnlyAccessResponse(request: Request) {
  if (!shouldBlockForeignBrowserRequest(request)) return null;

  return new Response(request.method === "HEAD" ? null : blockedPageDocument(), {
    status: 403,
    headers: blockedHeaders(),
  });
}
