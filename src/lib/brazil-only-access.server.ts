const BRAZIL_COUNTRY_CODE = "BR";

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

export type BrazilAccessDecisionReason =
  | "allowed-brazil"
  | "blocked-foreign"
  | "blocked-unknown"
  | "bypass-non-browser"
  | "bypass-non-production";

export type BrazilAccessDecision = {
  productionHost: boolean;
  browser: boolean;
  country: string | null;
  blocked: boolean;
  reason: BrazilAccessDecisionReason;
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

export function isBrowserAccessRequest(request: Request) {
  return Boolean(
    request.headers.get("sec-fetch-dest") ||
      request.headers.get("sec-fetch-mode") ||
      request.headers.get("sec-fetch-site"),
  );
}

export function evaluateBrazilAccess(request: Request): BrazilAccessDecision {
  const productionHost = isGeoRestrictedProductionHost(request);
  const browser = isBrowserAccessRequest(request);
  const country = resolveRequestCountry(request);

  if (!productionHost) {
    return {
      productionHost,
      browser,
      country,
      blocked: false,
      reason: "bypass-non-production",
    };
  }

  if (!browser) {
    return {
      productionHost,
      browser,
      country,
      blocked: false,
      reason: "bypass-non-browser",
    };
  }

  if (country === BRAZIL_COUNTRY_CODE) {
    return {
      productionHost,
      browser,
      country,
      blocked: false,
      reason: "allowed-brazil",
    };
  }

  return {
    productionHost,
    browser,
    country,
    blocked: true,
    reason: country ? "blocked-foreign" : "blocked-unknown",
  };
}

export function shouldBlockForeignBrowserRequest(request: Request) {
  return evaluateBrazilAccess(request).blocked;
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
    svg{display:block;width:min(44vw,240px);height:auto}
    @media(max-width:560px){svg{width:min(58vw,220px)}}
  </style>
</head>
<body>
  <main aria-label="Tempo Pelotas">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-labelledby="blocked-logo-title blocked-logo-description">
      <title id="blocked-logo-title">TEMPO Pelotas</title>
      <desc id="blocked-logo-description">Sol sobre ondas, símbolo do portal de tempo e águas de Pelotas.</desc>
      <rect width="512" height="512" rx="112" fill="#071e2f"/>
      <circle cx="256" cy="202" r="88" fill="#f27035"/>
      <g fill="none" stroke="#18bdcd" stroke-width="24" stroke-linecap="round">
        <path d="M86 316c38 0 38-28 76-28s38 28 76 28 38-28 76-28 38 28 76 28 38-28 76-28"/>
        <path d="M86 374c38 0 38-28 76-28s38 28 76 28 38-28 76-28 38 28 76 28 38-28 76-28"/>
      </g>
      <g fill="none" stroke="#5e2ced" stroke-width="18" stroke-linecap="round">
        <path d="M256 76v34M256 294v34M130 202h34M348 202h34M167 113l24 24M321 267l24 24M345 113l-24 24M191 267l-24 24"/>
      </g>
    </svg>
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
      "default-src 'none'; img-src 'none'; style-src 'unsafe-inline'; script-src 'none'; connect-src 'none'; font-src 'none'; media-src 'none'; object-src 'none'; worker-src 'none'; frame-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
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

export function createBrazilOnlyAccessResponse(
  request: Request,
  decision: BrazilAccessDecision = evaluateBrazilAccess(request),
) {
  if (!decision.blocked) return null;

  return new Response(request.method === "HEAD" ? null : blockedPageDocument(), {
    status: 403,
    headers: blockedHeaders(),
  });
}
