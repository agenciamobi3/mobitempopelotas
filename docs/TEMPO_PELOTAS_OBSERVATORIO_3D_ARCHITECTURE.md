# Tempo Pelotas Observatório — arquitetura 3D, produto PRO e plano de implementação

Data da decisão: 12/09/2026  
Estado: **arquitetura aprovada / Fase 1 em andamento**  
Branch operacional: `main`  
Rota interna atual: `/observatorio`  
Acesso atual: **PRO por entitlement**  
Indexação durante desenvolvimento: **proibida**

Estado executável da implementação: `docs/TEMPO_PELOTAS_OBSERVATORIO_FOUNDATION_2026-09-12.md`.

## 1. Objetivo

Este documento define a arquitetura funcional, técnica, visual e de governança do **Tempo Pelotas Observatório**, uma nova ferramenta avançada do plano PRO destinada a reunir em uma única experiência espacial e temporal as principais camadas meteorológicas, hidrológicas e ambientais do Tempo Pelotas.

O Observatório não deve ser tratado como um simples “mapa 3D” nem como uma cópia do projeto `bilawalsidhu/gods-eye-view`. O objetivo é construir uma ferramenta própria do Tempo Pelotas, integrada à stack atual, ao Historical Data Layer, aos contratos existentes de radar/satélite/hidrologia e à arquitetura de conta/entitlements.

A proposta central é permitir que o usuário PRO explore, de forma coordenada:

- terreno e relevo;
- radar meteorológico;
- imagens de satélite e cobertura real de nuvens;
- atividade elétrica;
- alertas oficiais;
- estações meteorológicas e hidrológicas;
- Lagoa dos Patos, Canal São Gonçalo, Guaíba, rios e redes regionais;
- câmeras;
- geada;
- focos de calor/incêndio quando a fonte e a política permitirem;
- atmosfera 3D visual;
- futuras grades de vento, precipitação e campos meteorológicos derivados de modelos.

O valor PRO não consiste em transformar dados oficiais públicos em paywall. O valor comercial está na **integração, profundidade, navegação espacial, sincronização temporal, histórico, cruzamento de camadas, ferramentas próprias e análise produzida pelo Tempo Pelotas**.

Este princípio segue `docs/ACCOUNT_AND_PRO_ARCHITECTURE.md` e `docs/DATA_ACCESS_PUBLIC_FREE_PRO_PLAN.md`.

---

## 2. Decisões de produto

### 2.1. Nome e rota

Nome do produto:

> **Tempo Pelotas Observatório**

Rota canônica:

```text
/observatorio
```

Não usar `/observatorio-3d` como rota principal. O 3D é uma característica importante da primeira geração, mas o Observatório pode futuramente incorporar análises, históricos, comparações, relatórios e outras ferramentas que ultrapassem a representação tridimensional.

### 2.2. Recurso PRO

O Observatório deve ser um recurso exclusivo do plano PRO por meio de entitlement dedicado.

Entitlement implementado:

```ts
observatoryAccess: boolean
```

Política inicial:

```text
Free -> false
PRO  -> true
```

Não usar condicionais espalhadas como:

```ts
if (tier === "pro")
```

A autorização deve seguir o contrato central de `AccountEntitlements`.

A proteção deve existir no servidor. Ocultar um botão no navegador não constitui autorização.

### 2.3. Desenvolvimento oculto em `main`

O Observatório será desenvolvido diretamente na branch operacional `main`, mas permanecerá oculto até decisão explícita de lançamento.

Durante todo o período de desenvolvimento:

- não incluir no header público;
- não incluir no megamenu;
- não incluir no footer;
- não incluir em CTAs comerciais públicos;
- não incluir em `src/lib/public-routes.ts`;
- não incluir no sitemap;
- não criar Schema que incentive descoberta;
- não promover em feed, OG editorial ou páginas públicas;
- enviar `noindex`;
- preferir também `nofollow`, `noarchive`, `nosnippet` e `noimageindex` durante a fase interna;
- aplicar `X-Robots-Tag` equivalente no response quando tecnicamente conveniente;
- manter proteção real por sessão + entitlement.

`noindex` é uma política de descoberta, não uma barreira de segurança.

### 2.4. Dados públicos permanecem públicos

Nada que hoje seja público deixa de ser público por causa do Observatório.

Exemplos:

- radar público continua público;
- satélite público continua público;
- alertas oficiais continuam públicos;
- níveis e dados hidrológicos públicos continuam públicos;
- páginas públicas continuam existindo independentemente do PRO.

O Observatório vende a ferramenta avançada que combina esses elementos.

---

## 3. Princípio científico e semântico

O Observatório deve ser mais rigoroso do que uma visualização puramente cinematográfica.

Toda camada deve declarar claramente o que representa.

### 3.1. Classes mínimas

Adotar quatro classes visuais/semânticas:

#### OBSERVADO

Medição, sensoriamento ou registro realmente recebido de uma fonte.

Exemplos:

- radar REDEMET;
- imagem GOES/REDEMET;
- raios STSC;
- nível de uma estação;
- leitura meteorológica observacional;
- foco de calor detectado por satélite.

#### PREVISTO

Saída de previsão meteorológica ou modelo numérico.

Exemplos:

- cobertura de nuvens futura;
- vento previsto;
- chuva prevista;
- variável modelada em grade.

#### DERIVADO

Indicador calculado pelo Tempo Pelotas com base em dados de origem.

Exemplos:

- tendência;
- comparação de períodos;
- diferença previsão x observado;
- índice próprio;
- agregação espacial/temporal.

#### VISUAL

Representação gráfica criada para melhorar compreensão e imersão, sem afirmar que a geometria representa exatamente a estrutura física observada.

Exemplos:

- nuvens volumétricas procedurais;
- partículas de chuva;
- névoa atmosférica;
- animação visual de vento quando não representar diretamente uma grade científica.

### 3.2. Regra permanente

Nunca apresentar:

- efeito visual como observação;
- previsão como medição;
- reanálise como medição direta;
- ausência de dado como zero;
- camada degradada como normal;
- interpolação visual como resolução real da fonte.

Essa regra amplia, sem substituir, a separação já adotada pelo projeto entre `observation`, `forecast`, `reanalysis` e `derived`.

---

## 4. Motor 3D

### 4.1. Decisão

Usar **CesiumJS** como motor exclusivo da superfície `/observatorio`.

Não substituir MapLibre no restante do Tempo Pelotas.

Arquitetura:

```text
Tempo Pelotas
│
├── portal público e painel convencional
│   └── MapLibre onde já utilizado
│
└── /observatorio
    └── CesiumJS
        ├── terreno
        ├── imagem base
        ├── raster meteorológico
        ├── GeoJSON / entidades
        ├── timeline
        ├── atmosfera
        └── seleção/inspeção
```

### 4.2. Por que não substituir MapLibre

MapLibre já está integrado e funcional em:

- radar;
- STSC/trovoadas;
- geada;
- mapas hidrológicos;
- alertas;
- mapas regionais.

O Observatório é uma nova ferramenta, não uma reescrita das páginas existentes.

### 4.3. Lazy loading obrigatório

Cesium não deve entrar no bundle inicial das rotas convencionais.

Fluxo:

```text
/observatorio
    ↓
shell React leve
    ↓
sessão + entitlement válidos
    ↓
dynamic import do módulo 3D
    ↓
Cesium Viewer
```

A Home, páginas de previsão, radar público, hidrologia pública e demais superfícies não devem carregar Cesium apenas porque o pacote existe no repositório.

### 4.4. Assets do Cesium

A integração Vite/TanStack deverá materializar corretamente os assets exigidos pelo CesiumJS, incluindo conforme a versão adotada:

- Workers;
- Assets;
- Widgets;
- ThirdParty;
- `CESIUM_BASE_URL` ou mecanismo equivalente compatível com o build final.

O build em Lovable/Nitro deve ser validado em produção e não apenas no dev server.

---

## 5. Base cartográfica e terreno

### 5.1. Não depender inicialmente de Google Photorealistic 3D

O MVP não deve depender de Google Photorealistic 3D Tiles.

Motivos:

- meteorologia não exige edifícios fotorrealistas;
- custo e quotas não devem ser pré-requisito para o produto nascer;
- o dado meteorológico deve permanecer legível sobre a base;
- uma superfície geográfica simples pode ser mais adequada para radar, satélite e hidrologia.

### 5.2. Modos de mapa previstos

Arquitetura deve permitir futuramente:

```text
Mapa
Satélite
Terreno
Fotorrealista
```

Nem todos precisam existir no MVP.

### 5.3. Terreno inicial

Avaliar como primeira opção o mesmo princípio técnico utilizado pelo God's Eye View com Re:Earth Terrain/Mapterhorn, ou outra fonte de terreno comercialmente compatível e tecnicamente adequada.

Requisitos mínimos:

- uso compatível com produto comercial;
- atribuição preservada;
- integração por `CesiumTerrainProvider` ou contrato suportado;
- fallback claro quando indisponível;
- nenhum dado de elevação inventado.

### 5.4. Terreno não é mapa de inundação

Relevo + nível hidrológico não autorizam automaticamente afirmar qual área irá inundar.

Um produto de inundação exigiria, conforme o caso:

- DEM adequado;
- datum vertical validado;
- batimetria;
- drenagem;
- topografia local;
- modelo hidrodinâmico;
- condições de contorno;
- validação científica.

O Observatório pode mostrar relevo e hidrologia sem transformar isso em previsão de inundação.

---

## 6. Camadas planejadas

### 6.1. Matriz inicial

| Camada | Origem principal | Renderização | Classe | Fase |
| --- | --- | --- | --- | --- |
| Terreno | provider de terreno aprovado | terreno 3D | base | MVP |
| Radar | REDEMET | raster georreferenciado | OBSERVADO | MVP |
| Satélite Realçado | REDEMET/contingência aprovada | raster georreferenciado | OBSERVADO | MVP |
| Satélite IR | REDEMET/contingência aprovada | raster georreferenciado | OBSERVADO | MVP |
| Satélite Visível | REDEMET | raster georreferenciado | OBSERVADO | MVP |
| Raios | STSC | pontos temporais | OBSERVADO | MVP |
| Alertas | INMET | polígonos/áreas | OBSERVADO/oficial | MVP |
| Estações hidrológicas | fontes já integradas | pontos 3D | OBSERVADO | MVP |
| WMS hidrológico | SACE/outros aprovados | imagery WMS | conforme fonte | MVP |
| Estações meteorológicas | fontes já validadas | pontos 3D | OBSERVADO | fase 1 |
| Geada | integração existente | pontos/polígonos | conforme contrato | fase 1 |
| Câmeras | integração Tempo Pelotas | pontos + painel | OBSERVADO | fase 1 |
| GOES/NASA GIBS | NASA | WMTS/raster temporal | OBSERVADO | fase 1/2 |
| Focos de calor | NASA FIRMS | pontos/heatmap | OBSERVADO | fase 2 |
| Nuvens volumétricas | dados meteorológicos + shader | volume/overlay | VISUAL | fase 2 |
| Chuva visual | observação/modelo + partículas | partículas | VISUAL ou PREVISTO | fase 2 |
| Vento por estação | fontes observacionais | vetores | OBSERVADO | fase 2 |
| Vento em grade | modelo numérico | partículas/streamlines | PREVISTO | futuro |
| Nuvens modeladas por níveis | modelo numérico em grade | volumes/camadas | PREVISTO | futuro |

Cada entrada precisa passar pela política de governança antes de ser habilitada no PRO.

---

## 7. Radar REDEMET

### 7.1. Reaproveitamento

O Tempo Pelotas já possui backend apropriado para o Observatório:

- credencial server-only;
- seleção resiliente da estação;
- tentativa de produtos iniciando por `maxcappi`;
- bounds oficiais por frame;
- proxy de imagem sanitizado;
- timestamps reais;
- sequência temporal;
- last-good/resiliência;
- validação de que o frame cobre Pelotas.

Não criar um segundo coletor de radar apenas para o Observatório.

### 7.2. Contrato desejado

O Observatório deve consumir um contrato próximo de:

```ts
type ObservatoryRasterFrame = {
  id: string;
  imageUrl: string;
  observedAt: string | null;
  bounds: {
    west: number;
    south: number;
    east: number;
    north: number;
  };
  provider: string;
  product: string;
  classification: "observed";
};
```

Esse contrato pode ser adaptado a partir de `RedemetImageFrame`; evitar duplicação desnecessária.

### 7.3. Renderização

O frame deve ser renderizado como imagery georreferenciada sobre o globo/terreno, respeitando exatamente seus bounds.

Controles:

- ligar/desligar;
- transparência;
- anterior/próximo;
- play/pause;
- velocidade;
- voltar ao quadro mais recente;
- mostrar fonte/produto/horário;
- estado de frescor;
- estado indisponível/degradado.

---

## 8. Satélite e nuvens observadas

### 8.1. A resposta curta

**Sim, o Observatório conseguirá mostrar nuvens.**

A primeira implementação deve usar **nuvens realmente observadas em imagem de satélite**, não volumes 3D inventados.

### 8.2. Produtos já disponíveis no Tempo Pelotas

Preservar a semântica atual:

- `realcada` — infravermelho realçado;
- `ir` — infravermelho;
- `vis` — visível.

O backend existente já entrega frames com:

- `imageUrl`;
- `bounds`;
- `observedAt`;
- provider;
- produto.

Isso é adequado para renderização no Cesium.

### 8.3. O que a camada significa

Imagem de satélite é uma observação espacial real do sensor.

Ela pode ser projetada sobre o globo e animada por tempo.

Ela não é, por si só, um volume 3D de nuvens.

A UI deve chamar isso de forma clara, por exemplo:

```text
Satélite — Infravermelho
OBSERVADO
```

Nunca chamar um raster 2D de “nuvens volumétricas”.

### 8.4. GOES/NASA GIBS

Pesquisar e validar a inclusão de NASA GIBS/GOES como camada complementar.

Casos desejados:

- GeoColor;
- Clean Infrared / Band 13;
- outros produtos com utilidade meteorológica regional, desde que a semântica e a política sejam revisadas.

Preferir WMTS/WMS suportado nativamente pelo Cesium.

REDEMET continua sendo a integração brasileira principal; NASA não deve substituir silenciosamente uma camada nacional quando a interface afirmar que está mostrando REDEMET.

---

## 9. Nuvens volumétricas 3D

### 9.1. Três conceitos distintos

O produto deve separar:

1. **nuvens observadas por satélite**;
2. **atmosfera volumétrica visual**;
3. **campo tridimensional de nuvens derivado de modelo numérico**.

### 9.2. Atmosfera volumétrica visual

É tecnicamente viável inspirar-se na abordagem do God's Eye View.

O projeto de referência possui `cockpitCloudEffects.js` e `weatherEffectsMath.js`, que transformam variáveis meteorológicas em intensidades visuais para:

- nuvem;
- chuva;
- neve;
- neblina;
- haze;
- tempestade;
- vento.

O shader é procedural e limitado propositalmente em resolução/FPS para reduzir custo.

No Tempo Pelotas, essa camada deve ser rotulada:

```text
Atmosfera 3D
VISUAL
```

ou equivalente.

Ela não substitui satélite, radar ou observação.

### 9.3. Dados que podem controlar o efeito

Quando a fonte e a licença permitirem, a intensidade pode ser controlada por:

- cobertura de nuvens;
- precipitação;
- código meteorológico;
- visibilidade;
- vento;
- direção do vento;
- umidade;
- eventualmente base/topo de nuvens quando disponível de forma confiável.

### 9.4. Fail-clear

Ausência de dado deve desligar/reduzir a representação em vez de inventar condição atmosférica.

Não usar um céu fechado por padrão apenas para tornar a cena bonita.

### 9.5. Campo 3D baseado em modelo

Fase futura.

Para representar nuvens baixas, médias e altas espacialmente, será necessária uma grade meteorológica, não apenas valores pontuais de Pelotas.

Arquitetura conceitual:

```text
Modelo meteorológico
    ↓
grade lat/lon
    ↓
cloud_low / cloud_mid / cloud_high
    ↓
normalização e política de fonte
    ↓
volumes/camadas 3D
```

Isso deve ser tratado como `PREVISTO`, e não `OBSERVADO`.

Não bloquear o lançamento do Observatório esperando esta fase.

---

## 10. STSC / atividade elétrica

### 10.1. Reaproveitamento

Usar o contrato atual do Tempo Pelotas.

Regras já consolidadas devem permanecer:

- timestamps normalizados corretamente;
- recorte regional;
- janela temporal real;
- quadro válido com zero pontos = zero ocorrências observadas naquele quadro;
- ausência de quadro utilizável != zero raios;
- STSC não substitui alerta oficial.

### 10.2. Visualização 3D

Renderizar raios como entidades geográficas temporais.

A apresentação pode dar maior destaque visual aos eventos recentes, desde que:

- o timestamp real permaneça disponível;
- a intensidade visual não seja apresentada como intensidade física do raio sem dado que suporte isso;
- o fade seja apenas uma codificação de idade.

Exemplo:

```text
0–2 min   -> brilho máximo
2–5 min   -> médio
5–10 min  -> reduzido
```

Essa é uma regra visual derivada, não propriedade do sensor.

---

## 11. Alertas INMET

Alertas oficiais devem poder aparecer sobre o globo como polígonos/áreas afetadas quando a geometria estiver disponível ou puder ser representada com fidelidade suficiente a partir do contrato oficial.

Requisitos:

- preservar órgão;
- preservar vigência;
- preservar severidade;
- preservar descrição oficial quando apresentada;
- não fabricar geometria mais precisa do que a fonte oferece;
- não transformar STSC/radar em alerta oficial.

A página pública de alertas continua existindo independentemente do PRO.

---

## 12. Hidrologia

### 12.1. Estações

O Observatório deve representar as estações como pontos clicáveis.

Painel de inspeção:

- nome da estação;
- instituição;
- nível/vazão/chuva conforme o parâmetro;
- unidade;
- horário original;
- idade/frescor;
- tendência quando for derivada com metodologia válida;
- referência vertical quando pertinente;
- fonte original;
- gráfico quando autorizado.

### 12.2. WMS

As integrações atuais que já entregam WMS podem ser reutilizadas por imagery provider adequado no Cesium.

Não criar scraping visual do MapLibre para transportar o mapa existente ao Cesium.

Consumir a fonte original por contrato aprovado.

### 12.3. Lagoa dos Patos e Canal São Gonçalo

Dar destaque espacial ao sistema local e regional:

- Laranjal;
- Canal São Gonçalo;
- Rio Grande;
- São Lourenço do Sul;
- São José do Norte;
- demais pontos verificados;
- Guaíba e bacias relacionadas conforme a escala selecionada.

O Observatório deve ajudar o usuário a compreender a relação espacial entre os pontos, sem afirmar causalidade hidrológica automática.

---

## 13. Câmeras

Fase posterior ao MVP básico.

Câmeras podem aparecer como pins/entidades clicáveis.

Ao selecionar:

- abrir painel lateral;
- mostrar live/replay conforme o contrato já existente;
- preservar origem;
- não projetar artificialmente um vídeo em geometria 3D sem necessidade.

O objetivo é contexto meteorológico, não reproduzir a experiência CCTV do God's Eye View.

---

## 14. Geada

A camada atual de geada pode ser adaptada ao Observatório quando o contrato for estável.

A UI deve indicar claramente se a informação representa:

- observação;
- risco;
- previsão;
- interpolação;
- produto oficial.

Não transformar pontos de estação em uma superfície contínua sem metodologia documentada.

---

## 15. NASA FIRMS / focos de calor

Camada recomendada para fase 2.

A implementação do God's Eye View é útil como referência porque já contém:

- proxy;
- parsing CSV;
- cache;
- adaptação;
- heatmap/pontos;
- tratamento de estado degradado.

No Tempo Pelotas, implementar de forma própria e coerente com a arquitetura server-side existente.

Nome sugerido na UI:

```text
Focos de calor
```

Não chamar automaticamente de “incêndios ativos” se a semântica do produto FIRMS usado não sustentar essa afirmação naquele contexto.

Revisar licença, atribuição, retenção e uso comercial antes de habilitar no PRO.

---

## 16. Vento

### 16.1. MVP

Mostrar vento nos pontos/estações em que realmente exista uma observação ou previsão válida.

Exemplos:

- seta;
- direção;
- velocidade;
- rajada separada quando realmente existente.

### 16.2. Campo vetorial regional

Para desenhar streamlines/partículas em uma região inteira é necessária uma grade espacial de vento.

Não gerar um campo regional a partir de um único valor de Pelotas.

Fluxo futuro:

```text
modelo numérico
    ↓
grade U/V
    ↓
recorte regional
    ↓
interpolação visual controlada
    ↓
partículas/streamlines
```

Essa camada será `PREVISTO` quando vier de forecast/modelo.

---

## 17. Timeline global

A timeline deve ser um dos componentes centrais do produto.

### 17.1. Relógio compartilhado

O Observatório deve manter um instante de referência global:

```ts
observatoryTime: Date
```

Cada camada temporal resolve o frame/evento apropriado para esse instante.

Exemplo:

```text
17:10 selecionado

Radar      -> quadro mais próximo válido
Satélite   -> quadro mais próximo válido
STSC       -> eventos na janela correspondente
Estações   -> leitura compatível com o instante
Hidrologia -> observação mais próxima permitida
```

### 17.2. Controles

MVP:

- anterior;
- próximo;
- play;
- pause;
- velocidade;
- arrastar timeline;
- voltar ao vivo;
- indicar quando uma camada não possui frame naquela janela.

### 17.3. Não fabricar sincronismo

Fontes têm cadências diferentes.

A UI deve aceitar que:

- radar esteja em 17:12;
- satélite esteja em 17:10;
- STSC tenha eventos até 17:11;
- hidrologia esteja em 17:00.

O relógio da cena não muda os timestamps originais.

Cada camada deve informar seu frame efetivamente usado.

### 17.4. Histórico PRO

Fases futuras:

- 30 min;
- 1 h;
- 3 h;
- 6 h;
- 12 h;
- 24 h;
- eventos históricos salvos;
- comparação entre duas janelas;
- replay de tempestades/enchentes quando o acervo permitir.

O Historical Data Layer é a base natural para essa evolução.

---

## 18. Arquitetura interna recomendada

Não permitir que dezenas de componentes manipulem o `Cesium.Viewer` diretamente sem coordenação.

Estrutura sugerida:

```text
src/
└── observatory/
    ├── core/
    │   ├── ObservatoryViewer.ts
    │   ├── ObservatoryLayerManager.ts
    │   ├── ObservatoryTimeline.ts
    │   ├── ObservatoryCamera.ts
    │   ├── ObservatorySelection.ts
    │   ├── ObservatoryRenderGovernor.ts
    │   └── ObservatoryTypes.ts
    │
    ├── layers/
    │   ├── radar/
    │   ├── satellite/
    │   ├── lightning/
    │   ├── alerts/
    │   ├── hydrology/
    │   ├── weather-stations/
    │   ├── frost/
    │   ├── cameras/
    │   ├── fires/
    │   └── atmosphere/
    │
    ├── data/
    │   ├── observatory.functions.ts
    │   ├── observatory.server.ts
    │   └── observatory-policy.ts
    │
    └── ui/
        ├── ObservatoryShell.tsx
        ├── ObservatoryLayersPanel.tsx
        ├── ObservatoryTimeline.tsx
        ├── ObservatoryInspector.tsx
        ├── ObservatoryToolbar.tsx
        ├── ObservatoryLegend.tsx
        └── ObservatorySourceStatus.tsx
```

A estrutura final pode variar, mas os limites de responsabilidade devem permanecer.

---

## 19. Layer Manager

Criar um registro central de camadas.

Contrato conceitual:

```ts
type ObservatoryLayerDefinition = {
  id: string;
  label: string;
  category: "weather" | "satellite" | "hydrology" | "alerts" | "environment" | "visual";
  classification: "observed" | "forecast" | "derived" | "visual";
  temporal: boolean;
  defaultEnabled: boolean;
  requiredEntitlement?: keyof AccountEntitlements;
  attribution: string;
  sourcePolicyId: string;
};
```

Runtime adicional pode registrar:

- estado;
- timestamp;
- erro sanitizado;
- frescor;
- renderer ativo;
- transparência;
- frame selecionado;
- cleanup.

### 19.1. Estados

Usar estados coerentes com a filosofia do Tempo Pelotas:

```text
LOADING
LIVE / CURRENT
STALE
DEGRADED
UNAVAILABLE
DISABLED
REVIEW
```

Não reduzir todos os problemas a `error=true`.

---

## 20. Governança de fontes

Antes de uma camada ser liberada no Observatório PRO, registrar no mínimo:

```text
source
institution
classification
retention_allowed
public_display_allowed
free_authenticated_allowed
pro_allowed
commercial_use_allowed
export_allowed
attribution_required
review_status
terms_checked_at
```

Quando `commercial_use_allowed` ou `pro_allowed` for incerto:

```text
REVIEW
```

A camada pode existir tecnicamente sem ser liberada comercialmente.

### 20.1. Open-Meteo

O Tempo Pelotas já usa Open-Meteo em outras superfícies, mas qualquer novo uso intensivo ou novo produto PRO deve passar por revisão específica dos termos/plano aplicáveis no momento da implementação.

Não assumir que um endpoint gratuito usado para o portal público autoriza automaticamente processamento comercial intensivo para um recurso PRO.

### 20.2. God's Eye View

O código do projeto de referência é MIT, mas os datasets e provedores de terceiros mantêm suas próprias licenças.

Não importar datasets do projeto sem revisão.

Não importar automaticamente:

- OpenSky;
- TeleGeography;
- CCTV estrangeiro;
- rádio;
- tráfego;
- cabos submarinos;
- datasets locais bundled;
- modelos 3D de terceiros.

Usar o repositório principalmente como referência arquitetural e de implementação.

---

## 21. O que reaproveitar conceitualmente do God's Eye View

Elementos valiosos:

- criação minimalista do `Cesium.Viewer`;
- lifecycle explícito do viewer;
- gerenciamento de map stacks;
- terreno com fallback;
- renderização sob demanda/governor;
- organização por camadas;
- last-good e estado degradado;
- cache server-side;
- atribuições por fonte;
- abort/cancelamento de requests;
- cleanup de handlers e recursos WebGL;
- proteção contra race condition em troca de camadas;
- atmosfera procedural;
- limites de FPS/resolução para efeitos visuais;
- fail-clear quando dados meteorológicos faltam.

Não copiar a identidade do produto.

Não reproduzir:

- HUD militar;
- linguagem de inteligência/espionagem;
- cockpit de aeronaves;
- hangar 3D;
- contatos militares;
- voz como requisito;
- estilo visual do projeto.

O Tempo Pelotas Observatório deve continuar parecendo parte do Tempo Pelotas.

---

## 22. UI e UX

### 22.1. Desktop

Direção:

```text
┌─────────────────────────────────────────────────────────────────────┐
│ TEMPO PELOTAS OBSERVATÓRIO     Dados 17:42      Pelotas       PRO │
├───────────────┬───────────────────────────────────────┬─────────────┤
│ CAMADAS       │                                       │ INSPEÇÃO    │
│               │                                       │             │
│ ☑ Satélite    │                GLOBO                  │ Radar       │
│ ☑ Radar       │                 3D                    │ 17:40       │
│ ☑ Raios       │                                       │ REDEMET     │
│               │                                       │             │
│ ATMOSFERA     │                                       │             │
│ ☐ Nuvens 3D  │                                       │             │
│ ☐ Vento       │                                       │             │
│               │                                       │             │
│ ÁGUA          │                                       │             │
│ ☑ Estações    │                                       │             │
│ ☐ Bacias      │                                       │             │
├───────────────┴───────────────────────────────────────┴─────────────┤
│ ◀  ▶  ❚❚   16:50──17:00──17:10──17:20──17:30──●17:40  AO VIVO   │
└─────────────────────────────────────────────────────────────────────┘
```

### 22.2. Mobile

No mobile:

- globo ocupa a maior parte da viewport;
- painel de camadas vira bottom sheet;
- inspeção vira sheet/modal;
- timeline permanece acessível na faixa inferior;
- reduzir quantidade de elementos simultâneos;
- respeitar safe areas;
- não bloquear scroll/gestos fora da superfície 3D;
- explicar gesto cooperativo quando necessário.

### 22.3. Inspector

Ao clicar uma entidade/camada:

- nome;
- classe (`OBSERVADO`, etc.);
- valor;
- unidade;
- timestamp;
- fonte;
- estado;
- link para página pública quando existir;
- gráfico/contexto quando permitido.

### 22.4. Legenda científica

Toda camada deve ter legenda apropriada.

Especialmente:

- escala de radar;
- interpretação do produto de satélite;
- severidade de alertas;
- idade dos raios;
- estado hidrológico;
- distinção visual x observado.

---

## 23. Performance

### 23.1. Renderização sob demanda

Não manter 60 FPS continuamente quando a cena estiver parada.

Criar `ObservatoryRenderGovernor` ou usar mecanismos equivalentes do Cesium.

Render contínuo somente quando necessário:

- câmera em movimento;
- timeline tocando;
- partículas ativas;
- atmosfera animada;
- transição visual;
- camada que realmente exige frames contínuos.

### 23.2. Camadas desligadas não carregam dados

Regra:

```text
layer disabled -> não buscar payload pesado
```

Exceções somente quando uma pré-busca pequena e justificada melhorar a UX sem custo relevante.

### 23.3. Mobile

Aplicar limites adaptativos:

- device pixel ratio;
- número de entidades;
- densidade de partículas;
- resolução de efeitos;
- taxa de atualização;
- quantidade de camadas animadas.

### 23.4. Atmosfera

Inspirar-se no God's Eye View para limitar efeitos WebGL.

Princípios:

- framebuffer reduzido;
- FPS limitado;
- baixa quantidade de passos de ray marching;
- desligar em `prefers-reduced-motion` quando apropriado;
- fallback sem efeito se WebGL/capacidade não suportar;
- nunca derrubar o Observatório inteiro por falha no shader.

---

## 24. Cache e resiliência

Aplicar os padrões já usados no Tempo Pelotas:

- timeout explícito;
- abort;
- cache compatível com a fonte;
- last-good quando permitido;
- timestamp real preservado;
- stale explicitamente identificado;
- erro de integração não tratado como ausência global da fonte;
- nenhum secret no navegador;
- hosts allowlisted em proxies;
- payloads limitados por tamanho;
- redirects revalidados quando aplicável;
- resposta sanitizada.

O Observatório não deve criar um segundo conjunto de proxies se os endpoints atuais já forem adequados e seguros.

---

## 25. Segurança e PRO

### 25.1. Rota

A rota pode renderizar um shell mínimo antes da resolução do acesso, mas não deve retornar dados premium protegidos sem autorização.

Fluxo:

```text
request
  ↓
sessão
  ↓
resolveAccountAccess()
  ↓
entitlements.observatoryAccess
  ├── false -> estado de acesso/upgrade
  └── true  -> bootstrap do Observatório
```

### 25.2. APIs premium

Quando uma API existir apenas para o Observatório/PRO:

- verificar sessão server-side;
- resolver entitlement;
- aplicar política da fonte;
- `Cache-Control: private` quando a resposta for específica do usuário/acesso;
- não expor service role;
- não confiar no cliente para intervalo temporal ou capacidade paga.

Dados públicos já disponíveis por endpoints públicos não precisam ser artificialmente duplicados como privados, desde que a experiência premium continue protegida.

---

## 26. SEO e invisibilidade durante desenvolvimento

A rota deve usar metadata não indexável.

Recomendação durante fase interna:

```text
robots: noindex, nofollow, noarchive, nosnippet, noimageindex
```

Também:

- não inserir no sitemap;
- não inserir em `public-routes`;
- não criar links públicos;
- não incluir no feed;
- não registrar como conteúdo editorial indexável;
- testar response headers em produção.

Ao lançar comercialmente, a política de indexação poderá ser revista separadamente da proteção de acesso.

É perfeitamente possível ter uma landing page pública indexável sobre o Observatório no futuro e manter a ferramenta `/observatorio` autenticada/noindex.

---

## 27. Fases de implementação

### Fase 0 — documentação

Estado: **concluída com este documento**.

Entregas:

- definição de produto;
- PRO por entitlement;
- rota;
- noindex;
- stack Cesium;
- governança;
- escopo de MVP;
- distinção científica das camadas.

Nenhum código funcional do Observatório deve ser considerado implementado apenas por este documento.

### Fase 1 — fundação silenciosa

Estado: **em andamento**. O detalhamento executável está em `docs/TEMPO_PELOTAS_OBSERVATORIO_FOUNDATION_2026-09-12.md`.

Já implementado na `main`:

- `observatoryAccess` em `AccountEntitlements`;
- Free `false` e PRO ativo `true`;
- fail-closed para PRO suspenso/expirado;
- `/observatorio` protegida por gate server-side;
- metadata e headers noindex/no-store;
- ausência de sitemap/public routes/navegação;
- shell standalone responsivo;
- contratos de camada;
- `ObservatoryLayerManager`;
- `ObservatoryRenderGovernor` abstrato;
- teste `tests/observatory-foundation.test.ts` em `test:contracts`.

Ainda pendente nesta fase:

- instalar Cesium com lockfiles coerentes;
- lazy-load do runtime Cesium;
- materializar assets do Cesium no build;
- `ObservatoryViewer` mínimo;
- base cartográfica;
- terreno + fallback;
- validação de CSP dos providers;
- build/typecheck/smoke PRO real.

Critério de saída continua sendo:

> usuário PRO de teste abre o globo; usuário Free não recebe o recurso; rota não é indexável; nenhuma página pública convencional carrega Cesium.

### Fase 2 — primeiro Observatório útil

Entregas:

- radar REDEMET;
- satélite Realçado;
- satélite IR;
- satélite Visível;
- STSC;
- alertas;
- estações hidrológicas principais;
- WMS hidrológico aprovado;
- inspector;
- transparência;
- estados por camada.

Critério de saída:

> a ferramenta já possui valor meteorológico/hidrológico real mesmo sem efeitos 3D avançados.

### Fase 3 — timeline unificada

Entregas:

- relógio global;
- play/pause;
- anterior/próximo;
- velocidade;
- frame mais próximo por camada;
- timestamp efetivamente usado por fonte;
- voltar ao vivo;
- não fabricar sincronismo.

Critério de saída:

> radar, satélite e raios podem ser explorados em conjunto ao longo de uma janela temporal.

### Fase 4 — ampliação observacional

Entregas candidatas:

- estações meteorológicas;
- geada;
- câmeras;
- NASA GIBS/GOES;
- NASA FIRMS;
- novas camadas hidrológicas aprovadas.

Cada uma depende de policy review.

### Fase 5 — atmosfera 3D

Entregas:

- atmosfera procedural opcional;
- nuvens volumétricas VISUAIS;
- precipitação visual quando justificável;
- efeitos de neblina/haze;
- controle por observação/modelo permitido;
- limites de performance;
- indicação explícita `VISUAL`.

Critério de saída:

> efeito aumenta compreensão/imersão sem se passar por dado observado.

### Fase 6 — ferramentas PRO avançadas

Entregas candidatas:

- histórico ampliado;
- replay de eventos;
- comparação entre duas datas;
- cenas salvas;
- links de cena;
- screenshots;
- gráficos vinculados ao objeto selecionado;
- comparação previsão x observado;
- análises próprias;
- IA aplicada aos dados da cena;
- relatórios quando juridicamente permitidos.

### Fase 7 — meteorologia 3D por modelo

Pesquisa futura:

- grade de vento U/V;
- partículas/streamlines;
- precipitação em grade;
- cloud cover low/mid/high;
- volumes meteorológicos;
- cortes verticais;
- níveis de pressão;
- outros campos 3D de modelo.

Não bloquear MVP ou lançamento por esta fase.

---

## 28. MVP aprovado

O MVP do Tempo Pelotas Observatório é:

> **terreno 3D + radar + satélite/nuvens observadas + raios + alertas + hidrologia + timeline unificada.**

Não fazem parte do critério obrigatório de MVP:

- Google Photorealistic 3D;
- nuvens volumétricas perfeitas;
- vento em partículas regionais;
- modelo tridimensional da atmosfera;
- IA;
- câmeras projetadas em 3D;
- histórico de vários anos;
- compartilhamento de cenas.

O MVP deve priorizar verdade e utilidade antes de espetáculo.

---

## 29. Critérios de aceite do MVP

### Acesso

- [x] rota `/observatorio` existe;
- [x] PRO autorizado server-side por entitlement;
- [x] Free bloqueado sem montar o shell avançado;
- [x] sem dependência de condicional `tier === "pro"` espalhada;
- [x] noindex implementado no código;
- [x] fora do sitemap/public-routes;
- [x] fora da navegação pública.

Esses itens estão implementados em código, mas a validação de runtime autenticado no domínio permanece pendente.

### Build

- [ ] Cesium builda em TanStack/Vite/Nitro;
- [ ] assets carregam em produção;
- [ ] dynamic import funciona;
- [ ] demais rotas não recebem bundle Cesium desnecessariamente;
- [ ] SSR não tenta acessar DOM/WebGL.

### Mapa

- [ ] terreno/base carregam;
- [ ] fallback funciona;
- [ ] créditos obrigatórios visíveis;
- [ ] câmera inicia em recorte útil de Pelotas/Lagoa;
- [ ] desktop e mobile funcionam.

### Radar

- [ ] frame oficial respeita bounds;
- [ ] horário real visível;
- [ ] transparência funciona;
- [ ] indisponibilidade não vira frame falso;
- [ ] last-good preserva idade.

### Satélite

- [ ] Realçado funciona;
- [ ] IR funciona;
- [ ] Visível respeita daylight;
- [ ] fallback preserva provider real;
- [ ] sequência temporal funciona;
- [ ] imagem é classificada como OBSERVADO.

### STSC

- [ ] pontos aparecem nas coordenadas reais;
- [ ] idade/timestamp preservados;
- [ ] zero real separado de sem coleta;
- [ ] fade é apenas visual.

### Hidrologia

- [ ] estações clicáveis;
- [ ] valor/unidade/horário/fonte preservados;
- [ ] WMS aprovado renderiza quando habilitado;
- [ ] nenhum falso mapa de inundação.

### Timeline

- [ ] relógio único;
- [ ] play/pause;
- [ ] frame efetivo por camada explícito;
- [ ] fontes com cadências diferentes não recebem timestamp fabricado.

### Performance

- [ ] render sob demanda em repouso;
- [ ] camada desligada não faz fetch pesado recorrente;
- [ ] mobile possui degradação controlada;
- [ ] falha de shader/camada não derruba viewer.

---

## 30. Testes recomendados

Contrato inicial já criado:

```text
tests/observatory-foundation.test.ts
```

Ele protege entitlement, noindex, ausência em `public-routes`, gate server-side, shell standalone, Layer Manager, Render Governor e o estado deliberadamente sem Cesium antes dos lockfiles coerentes.

Contratos posteriores permanecem recomendados, por exemplo:

```text
tests/observatory-lazy-cesium.test.ts
tests/observatory-layer-registry.test.ts
tests/observatory-radar-layer.test.ts
tests/observatory-satellite-layer.test.ts
tests/observatory-lightning-layer.test.ts
tests/observatory-hydrology-layer.test.ts
tests/observatory-timeline.test.ts
tests/observatory-source-policy.test.ts
```

Browser/E2E posterior:

- login Free;
- login PRO;
- carregamento do viewer;
- rotação/zoom;
- ativação/desativação de camadas;
- timeline;
- mobile;
- reduced motion;
- WebGL indisponível;
- provider de terreno indisponível;
- radar indisponível;
- satélite sem luz solar;
- STSC sem coleta;
- sessão expirada durante uso.

---

## 31. Observabilidade

O Observatório deve possuir métricas próprias, sem registrar dados pessoais desnecessários.

Eventos úteis:

- viewer iniciado;
- falha de WebGL;
- camada ativada/desativada;
- provider indisponível;
- tempo de bootstrap;
- tempo para primeira camada útil;
- timeline iniciada/parada;
- fallback de terreno;
- erro de raster;
- entitlement negado.

Não enviar secrets, URLs assinadas, cookies ou payloads sensíveis para telemetria.

---

## 32. Atribuição

Criar um componente de atribuição do Observatório que acompanhe as camadas realmente ativas.

Exemplos possíveis conforme fonte:

- REDEMET / DECEA;
- INMET;
- Defesa Civil RS;
- ANA/SNIRH;
- NASA;
- OpenStreetMap;
- provider de terreno;
- provider de imagery.

Não esconder atribuições obrigatórias em modo fullscreen.

Atribuição de base cartográfica e atribuição de dado meteorológico são conceitos diferentes e podem coexistir.

---

## 33. Questões deliberadamente adiadas

Não decidir ainda:

- preço do PRO;
- billing provider;
- Google Photorealistic 3D em produção;
- Cesium ion comercial;
- API pública do Observatório;
- exportação de cenas;
- compartilhamento público de cenas;
- retenção de todos os produtos raster;
- backfill completo de radar/satélite;
- modelos numéricos 3D específicos;
- IA do Observatório;
- modo empresarial/pesquisador.

Essas decisões não bloqueiam a fundação.

---

## 34. Fontes técnicas e referências de pesquisa

### Repositórios

- Tempo Pelotas: `agenciamobi/mobitempopelotas`
- referência geoespacial: `bilawalsidhu/gods-eye-view`

### Documentação interna relacionada

- `PROJECT_CURRENT_STATE.md`
- `docs/TEMPO_PELOTAS_OBSERVATORIO_FOUNDATION_2026-09-12.md`
- `docs/ACCOUNT_AND_PRO_ARCHITECTURE.md`
- `docs/DATA_ACCESS_PUBLIC_FREE_PRO_PLAN.md`
- `docs/HISTORICAL_DATA_INVENTORY.md`
- `docs/OFFICIAL_DATA_SOURCE_POLICY.md`
- `docs/REDEMET_OPERATIONS.md`
- `docs/REDEMET_RADAR_SATELLITE_AUDIT_2026-09-08.md`
- `docs/ANA_RHN_INTEGRATION.md`
- `docs/DEFESA_CIVIL_RS_HYDROMET_PLAN.md`

### Referências externas a revisar na implementação

- CesiumJS: `https://cesium.com/platform/cesiumjs/`
- CesiumJS Imagery providers: `https://cesium.com/learn/cesiumjs/ref-doc/ImageryProvider.html`
- CesiumJS WMS: `https://cesium.com/learn/cesiumjs/ref-doc/WebMapServiceImageryProvider.html`
- CesiumJS WMTS: `https://cesium.com/learn/cesiumjs/ref-doc/WebMapTileServiceImageryProvider.html`
- NASA GIBS: `https://gibs.earthdata.nasa.gov/`
- NASA Worldview: `https://worldview.earthdata.nasa.gov/`
- NASA FIRMS: `https://firms.modaps.eosdis.nasa.gov/`
- Re:Earth Terrain: `https://github.com/reearth/reearth-terrain`
- God's Eye View: `https://github.com/bilawalsidhu/gods-eye-view`

Termos, preços, quotas e licenças externos devem ser conferidos novamente no momento da ativação de cada provider. Este documento registra a decisão arquitetural de 12/09/2026, não congela condições comerciais de terceiros.

---

## 35. Decisões que não devem ser revertidas sem revisão arquitetural

1. O Observatório é ferramenta PRO por entitlement, não por condicional espalhada de plano.
2. Dados oficiais que já são públicos continuam públicos fora do Observatório.
3. O Observatório será desenvolvido em `main`, mas oculto e noindex até lançamento explícito.
4. MapLibre continua sendo a solução das páginas atuais; Cesium entra apenas na superfície avançada do Observatório.
5. Cesium deve ser lazy-loaded e não contaminar o bundle inicial do portal.
6. O MVP não depende de Google Photorealistic 3D nem Cesium ion comercial.
7. Radar, satélite e STSC reaproveitam os contratos existentes sempre que possível.
8. Satélite/nuvens observadas e nuvens volumétricas são produtos diferentes.
9. Atmosfera procedural é `VISUAL`, nunca `OBSERVADO`.
10. Ausência de dado nunca vira zero, normalidade ou efeito visual inventado.
11. Timeline preserva timestamps reais de cada fonte e não fabrica sincronismo.
12. Relevo + nível de água não viram automaticamente mapa de inundação.
13. Fontes com uso comercial/PRO incerto permanecem `REVIEW`.
14. O código do God's Eye View é referência, não base integral do produto.
15. Identidade, UX e linguagem devem continuar sendo Tempo Pelotas, sem copiar o HUD militar/OSINT do projeto de referência.
16. O primeiro objetivo é utilidade meteorológica e hidrológica real; efeitos cinematográficos vêm depois.

---

## 36. Próxima ação técnica aprovada

A Fase 1 já foi iniciada. O próximo bloco permanece dentro da própria **fundação silenciosa** e não deve avançar ainda para camadas meteorológicas.

Estado da ordem:

```text
1. entitlement observatoryAccess          CONCLUÍDO EM CÓDIGO
2. /observatorio protegido e noindex      CONCLUÍDO EM CÓDIGO
3. lazy-load do Cesium                    PENDENTE
4. assets/build                            PENDENTE
5. viewer mínimo                           PENDENTE
6. terreno/base                            PENDENTE
7. layer registry                          FUNDAÇÃO CONCLUÍDA
8. render governor                         FUNDAÇÃO CONCLUÍDA
9. testes de acesso/noindex                VERSIONADOS; EXECUÇÃO A CONFIRMAR
10. somente depois radar/satélite/STSC     NÃO INICIAR AINDA
```

A próxima ação é instalar o runtime Cesium pelo fluxo normal que consiga atualizar os lockfiles de forma coerente com `npm ci`; depois materializar seus assets, montar `ObservatoryViewer`, base keyless, Re:Earth Terrain/fallback e validar build/SSR/CSP.

A instalação não deve ser simulada adicionando `cesium` apenas ao `package.json` sem `package-lock.json` e `bun.lock` correspondentes.