import { createFileRoute } from "@tanstack/react-router";

import { isAllowedRedemetImageUrl } from "@/lib/redemet/redemet.server";
import {
  buildInmetSatelliteFrameUrl,
  isValidInmetSatelliteToken,
} from "@/lib/weather/inmet-satellite.server";

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const ALLOWED_INMET_HOSTS = new Set(["apisat.inmet.gov.br"]);

type ImageSource = {
  provider: "REDEMET" | "INMET";
  url: string;
};

type JsonRecord = Record<string, unknown>;

function errorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

function resolveImageSource(requestUrl: string): ImageSource | null {
  const search = new URL(requestUrl).searchParams;

  if (search.get("provider") === "inmet") {
    const date = search.get("date")?.trim() ?? "";
    const hour = search.get("hour")?.trim() ?? "";
    if (!isValidInmetSatelliteToken(date) || !isValidInmetSatelliteToken(hour)) return null;
    return { provider: "INMET", url: buildInmetSatelliteFrameUrl(date, hour) };
  }

  const source = search.get("src")?.trim();
  return source && isAllowedRedemetImageUrl(source)
    ? { provider: "REDEMET", url: source }
    : null;
}

function asRecord(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function detectImageContentType(bytes: Uint8Array) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return "image/webp";
  }
  if (bytes.length >= 6) {
    const signature = String.fromCharCode(...bytes.slice(0, 6));
    if (signature === "GIF87a" || signature === "GIF89a") return "image/gif";
  }
  return null;
}

function decodeInmetBase64(payload: unknown) {
  const record = asRecord(payload);
  const raw = typeof record?.base64 === "string" ? record.base64.trim() : "";
  if (!raw) return null;

  const dataUri = raw.match(/^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,(.+)$/i);
  const encoded = dataUri ? dataUri[2] : raw;

  try {
    const buffer = Buffer.from(encoded, "base64");
    if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) return null;
    const detected = detectImageContentType(buffer);
    if (!detected) return null;
    return { image: buffer, contentType: detected };
  } catch {
    return null;
  }
}

function inmetHeaders() {
  return {
    Accept: "application/json, image/avif, image/webp, image/png, image/jpeg, */*",
    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.7",
    Origin: "https://satelite.inmet.gov.br",
    Referer: "https://satelite.inmet.gov.br/",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36",
  };
}

function redemetHeaders() {
  return {
    Accept: "image/png,image/webp,image/jpeg,image/gif;q=0.8",
    "User-Agent": "TempoPelotas/2.0 (+https://tempopelotas.com.br)",
  };
}

function publicImageResponse(image: ArrayBuffer | Uint8Array, contentType: string) {
  const byteLength = image.byteLength;
  return new Response(image, {
    status: 200,
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=1800",
      "CDN-Cache-Control": "max-age=900, stale-while-revalidate=1800",
      "Content-Length": String(byteLength),
      "Content-Type": contentType,
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export const Route = createFileRoute("/api/redemet/image")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const source = resolveImageSource(request.url);
        if (!source) return errorResponse("Imagem meteorológica inválida.", 400);

        try {
          const response = await fetch(source.url, {
            headers: source.provider === "INMET" ? inmetHeaders() : redemetHeaders(),
            redirect: "follow",
            signal: AbortSignal.timeout(12_000),
          });

          if (source.provider === "INMET") {
            const finalUrl = new URL(response.url || source.url);
            if (!ALLOWED_INMET_HOSTS.has(finalUrl.hostname.toLowerCase())) {
              return errorResponse("Redirecionamento de imagem INMET não autorizado.", 502);
            }

            if (!response.ok) {
              return errorResponse("Imagem INMET temporariamente indisponível para a integração.", 502);
            }

            const contentType = response.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
            if (ALLOWED_CONTENT_TYPES.has(contentType)) {
              const image = await response.arrayBuffer();
              if (image.byteLength > MAX_IMAGE_BYTES) {
                return errorResponse("Imagem meteorológica excede o limite permitido.", 413);
              }
              return publicImageResponse(image, contentType);
            }

            const payload = (await response.json()) as unknown;
            const decoded = decodeInmetBase64(payload);
            if (!decoded) {
              return errorResponse("O INMET respondeu sem uma imagem base64 utilizável.", 502);
            }
            return publicImageResponse(decoded.image, decoded.contentType);
          }

          const contentType = response.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
          const declaredLength = Number(response.headers.get("content-length") ?? 0);

          if (!response.ok || !ALLOWED_CONTENT_TYPES.has(contentType)) {
            return errorResponse("Imagem REDEMET temporariamente indisponível.", 502);
          }

          if (!isAllowedRedemetImageUrl(response.url)) {
            return errorResponse("Redirecionamento de imagem não autorizado.", 502);
          }

          if (Number.isFinite(declaredLength) && declaredLength > MAX_IMAGE_BYTES) {
            return errorResponse("Imagem meteorológica excede o limite permitido.", 413);
          }

          const image = await response.arrayBuffer();
          if (image.byteLength > MAX_IMAGE_BYTES) {
            return errorResponse("Imagem meteorológica excede o limite permitido.", 413);
          }

          return publicImageResponse(image, contentType);
        } catch (error) {
          console.error("[weather/image] Entrega indisponível", {
            provider: source.provider,
            message: error instanceof Error ? error.message : "Falha desconhecida",
          });
          return errorResponse(`Imagem ${source.provider} temporariamente indisponível.`, 502);
        }
      },
    },
  },
});
