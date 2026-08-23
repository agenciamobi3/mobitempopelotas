import {
  createSupabaseAdminClient,
  getSupabaseServerConfig,
} from "../supabase/server-client.server";

type RateLimitRpcRow = {
  allowed: boolean;
  remaining: number;
  retry_after_seconds: number;
};

type RateLimitRpcClient = {
  rpc: (
    name: "consume_security_rate_limit",
    args: {
      p_scope: string;
      p_key_hash: string;
      p_limit: number;
      p_window_seconds: number;
    },
  ) => PromiseLike<{
    data: RateLimitRpcRow[] | null;
    error: { message?: string } | null;
  }>;
};

type SensitiveRouteRule = {
  scope: string;
  pathname: string;
  methods: readonly string[];
  maxBodyBytes: number;
  rateLimit?: {
    limit: number;
    windowSeconds: number;
  };
};

const SENSITIVE_ROUTE_RULES: readonly SensitiveRouteRule[] = [
  {
    scope: "account-delete",
    pathname: "/api/account/delete",
    methods: ["POST", "OPTIONS"],
    maxBodyBytes: 16_384,
    rateLimit: { limit: 5, windowSeconds: 15 * 60 },
  },
  {
    scope: "account-export",
    pathname: "/api/account/export",
    methods: ["GET", "HEAD", "OPTIONS"],
    maxBodyBytes: 0,
    rateLimit: { limit: 12, windowSeconds: 10 * 60 },
  },
  {
    scope: "push-subscription",
    pathname: "/api/push/subscription",
    methods: ["POST", "DELETE", "OPTIONS"],
    maxBodyBytes: 16_384,
    rateLimit: { limit: 30, windowSeconds: 10 * 60 },
  },
  {
    scope: "push-broadcast",
    pathname: "/api/push/broadcast",
    methods: ["POST", "OPTIONS"],
    maxBodyBytes: 16_384,
    rateLimit: { limit: 12, windowSeconds: 5 * 60 },
  },
] as const;

const SENSITIVE_PREFIX_RULES = [
  {
    prefix: "/api/cron/",
    methods: ["GET", "POST", "HEAD", "OPTIONS"] as const,
    maxBodyBytes: 64 * 1024,
  },
] as const;

const CLIENT_ADDRESS_HEADERS = ["cf-connecting-ip", "x-real-ip", "x-forwarded-for"] as const;

function jsonError(status: number, error: string, additionalHeaders?: HeadersInit) {
  const headers = new Headers({
    "Cache-Control": "private, no-store, max-age=0",
    "Content-Type": "application/json; charset=utf-8",
    Pragma: "no-cache",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, nofollow",
  });
  if (additionalHeaders) {
    new Headers(additionalHeaders).forEach((value, key) => headers.set(key, value));
  }

  return new Response(JSON.stringify({ success: false, error }), { status, headers });
}

function declaredBodyBytes(request: Request) {
  const value = request.headers.get("content-length");
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : Number.POSITIVE_INFINITY;
}

function exactRule(pathname: string) {
  return SENSITIVE_ROUTE_RULES.find((rule) => rule.pathname === pathname) ?? null;
}

function prefixRule(pathname: string) {
  return SENSITIVE_PREFIX_RULES.find((rule) => pathname.startsWith(rule.prefix)) ?? null;
}

function normalizedClientAddress(request: Request) {
  for (const header of CLIENT_ADDRESS_HEADERS) {
    const raw = request.headers.get(header)?.trim();
    if (!raw) continue;

    const candidate = header === "x-forwarded-for" ? raw.split(",", 1)[0]?.trim() : raw;
    if (!candidate || candidate.length > 96) continue;
    if (!/^[0-9a-f:.]+$/i.test(candidate)) continue;
    return candidate.toLowerCase();
  }

  return "unresolved-client";
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function keyedClientHash(request: Request, scope: string) {
  const config = getSupabaseServerConfig();
  if (!config.isAdminConfigured || !config.secretKey) return null;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(config.secretKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${scope}:${normalizedClientAddress(request)}`),
  );
  return bytesToHex(new Uint8Array(signature));
}

async function consumeDistributedRateLimit(
  scope: string,
  keyHash: string,
  limit: number,
  windowSeconds: number,
) {
  const client = createSupabaseAdminClient() as unknown as RateLimitRpcClient;
  const { data, error } = await client.rpc("consume_security_rate_limit", {
    p_scope: scope,
    p_key_hash: keyHash,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error || !data?.[0]) {
    throw new Error(error?.message || "Rate limit backend returned no result.");
  }

  return data[0];
}

function methodGuard(method: string, allowedMethods: readonly string[]) {
  if (allowedMethods.includes(method)) return null;
  return jsonError(405, "Método não permitido.", { Allow: allowedMethods.join(", ") });
}

function bodySizeGuard(request: Request, maxBodyBytes: number) {
  const bodyBytes = declaredBodyBytes(request);
  if (bodyBytes === null) return null;
  if (maxBodyBytes === 0 && bodyBytes > 0) {
    return jsonError(413, "Corpo não permitido nesta rota.");
  }
  if (bodyBytes > maxBodyBytes) {
    return jsonError(413, "Corpo da requisição excede o limite permitido.");
  }
  return null;
}

export async function enforceSensitiveRequestFirewall(request: Request) {
  let pathname: string;
  try {
    pathname = new URL(request.url).pathname;
  } catch {
    return jsonError(400, "Endereço de requisição inválido.");
  }

  if (pathname.length > 512) return jsonError(414, "Endereço de requisição muito longo.");

  const exact = exactRule(pathname);
  const prefix = prefixRule(pathname);
  if (!exact && !prefix) return null;

  const allowedMethods = exact?.methods ?? prefix!.methods;
  const methodResponse = methodGuard(request.method.toUpperCase(), allowedMethods);
  if (methodResponse) return methodResponse;

  const maxBodyBytes = exact?.maxBodyBytes ?? prefix!.maxBodyBytes;
  const bodyResponse = bodySizeGuard(request, maxBodyBytes);
  if (bodyResponse) return bodyResponse;

  if (!exact?.rateLimit || request.method.toUpperCase() === "OPTIONS") return null;

  try {
    const keyHash = await keyedClientHash(request, exact.scope);
    if (!keyHash) {
      console.error("[security-firewall] Distributed rate limiter is not configured.");
      return jsonError(503, "Controle de segurança temporariamente indisponível.");
    }

    const result = await consumeDistributedRateLimit(
      exact.scope,
      keyHash,
      exact.rateLimit.limit,
      exact.rateLimit.windowSeconds,
    );

    if (!result.allowed) {
      return jsonError(429, "Muitas tentativas. Aguarde e tente novamente.", {
        "Retry-After": String(result.retry_after_seconds),
        "RateLimit-Limit": String(exact.rateLimit.limit),
        "RateLimit-Remaining": "0",
        "RateLimit-Reset": String(result.retry_after_seconds),
      });
    }
  } catch (error) {
    console.error("[security-firewall] Distributed rate limiter failed.", {
      message: error instanceof Error ? error.message : String(error),
      scope: exact.scope,
    });
    return jsonError(503, "Controle de segurança temporariamente indisponível.");
  }

  return null;
}

export async function probeDistributedSecurityRateLimiter() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const keyHash = bytesToHex(bytes);
  const result = await consumeDistributedRateLimit("security-smoke", keyHash, 2, 60);
  return result.allowed && result.remaining === 1;
}
