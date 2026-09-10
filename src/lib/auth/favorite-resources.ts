export const FAVORITE_RESOURCE_KEYS = [
  "forecast-7-days",
  "laranjal-weather",
  "laranjal-level",
  "regional-waters",
  "guaiba-level",
  "sao-goncalo-level",
  "jaguarao-level",
  "radar-satellite",
  "live-cameras",
  "widget-builder",
] as const;

export type FavoriteResourceKey = (typeof FAVORITE_RESOURCE_KEYS)[number];
export type FavoriteResourceType = "page" | "location" | "station" | "tool";
export type FavoriteResourceGroup = "Tempo" | "Águas" | "Ferramentas";

export type FavoriteResourceHref =
  | "/previsao-7-dias-pelotas"
  | "/tempo-laranjal-pelotas"
  | "/nivel-da-lagoa-dos-patos-laranjal"
  | "/situacao-hidrologica-pelotas"
  | "/nivel-do-guaiba"
  | "/nivel-do-canal-sao-goncalo"
  | "/nivel-do-rio-jaguarao"
  | "/radar-e-satelite-pelotas"
  | "/cameras-ao-vivo-pelotas"
  | "/widgets";

export type FavoriteResource = {
  key: FavoriteResourceKey;
  type: FavoriteResourceType;
  group: FavoriteResourceGroup;
  title: string;
  description: string;
  href: FavoriteResourceHref;
};

export const FAVORITE_RESOURCES: readonly FavoriteResource[] = [
  {
    key: "forecast-7-days",
    type: "page",
    group: "Tempo",
    title: "Previsão de 7 dias",
    description: "Abra rapidamente a previsão estendida de Pelotas.",
    href: "/previsao-7-dias-pelotas",
  },
  {
    key: "laranjal-weather",
    type: "location",
    group: "Tempo",
    title: "Tempo no Laranjal",
    description: "Acompanhe a previsão dedicada à Praia do Laranjal.",
    href: "/tempo-laranjal-pelotas",
  },
  {
    key: "radar-satellite",
    type: "tool",
    group: "Tempo",
    title: "Radar e satélite",
    description: "Acesse a central visual de radar e imagens de satélite.",
    href: "/radar-e-satelite-pelotas",
  },
  {
    key: "live-cameras",
    type: "tool",
    group: "Tempo",
    title: "Câmeras ao vivo",
    description: "Veja as câmeras públicas reunidas pelo Tempo Pelotas.",
    href: "/cameras-ao-vivo-pelotas",
  },
  {
    key: "laranjal-level",
    type: "station",
    group: "Águas",
    title: "Nível da Lagoa no Laranjal",
    description: "Abra a leitura local e o movimento recente da série.",
    href: "/nivel-da-lagoa-dos-patos-laranjal",
  },
  {
    key: "regional-waters",
    type: "page",
    group: "Águas",
    title: "Situação das águas",
    description: "Acompanhe a visão regional das réguas e fontes hidrológicas.",
    href: "/situacao-hidrologica-pelotas",
  },
  {
    key: "guaiba-level",
    type: "station",
    group: "Águas",
    title: "Nível do Guaíba",
    description: "Consulte a régua selecionada e seu contexto regional.",
    href: "/nivel-do-guaiba",
  },
  {
    key: "sao-goncalo-level",
    type: "station",
    group: "Águas",
    title: "Canal São Gonçalo",
    description: "Abra a leitura da estação acompanhada pela Defesa Civil RS.",
    href: "/nivel-do-canal-sao-goncalo",
  },
  {
    key: "jaguarao-level",
    type: "station",
    group: "Águas",
    title: "Rio Jaguarão",
    description: "Consulte a leitura e a tendência informada pela fonte.",
    href: "/nivel-do-rio-jaguarao",
  },
  {
    key: "widget-builder",
    type: "tool",
    group: "Ferramentas",
    title: "Gerador de widgets",
    description: "Crie e gerencie widgets vinculados à sua conta.",
    href: "/widgets",
  },
];

const FAVORITE_RESOURCE_KEY_SET = new Set<string>(FAVORITE_RESOURCE_KEYS);
const FAVORITE_RESOURCE_BY_KEY = new Map(
  FAVORITE_RESOURCES.map((resource) => [resource.key, resource] as const),
);

export function isFavoriteResourceKey(value: string): value is FavoriteResourceKey {
  return FAVORITE_RESOURCE_KEY_SET.has(value);
}

export function getFavoriteResource(key: FavoriteResourceKey) {
  return FAVORITE_RESOURCE_BY_KEY.get(key) ?? null;
}
