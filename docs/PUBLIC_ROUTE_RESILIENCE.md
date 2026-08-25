# Resiliência das rotas públicas

## Objetivo

Evitar que páginas públicas do Tempo Pelotas sejam substituídas pelo `errorComponent` global por falhas transitórias que podem ser degradadas com segurança.

A estratégia cobre duas classes diferentes de falha:

1. falha de dados no servidor, especialmente na consolidação meteorológica compartilhada;
2. cliente desatualizado após deploy, quando o navegador tenta carregar um chunk/module que já não existe na versão publicada.

O `errorComponent` global continua existindo como última barreira para erros de programação ou falhas que não possam ser recuperadas com segurança.

## 1. Falha de dados meteorológicos

Grande parte das páginas meteorológicas públicas consome `getWeatherIntelligence()`.

A camada interna já possui timeouts e estados `unavailable` para várias fontes, mas uma exceção inesperada acima desses adapters ainda podia rejeitar a server function e derrubar a rota inteira.

`src/lib/weather/weather-intelligence.functions.ts` agora contém uma última barreira de exceção. Quando `fetchWeatherIntelligence()` falha de forma inesperada, a server function devolve `createUnavailableWeatherIntelligence()` em vez de propagar a exceção para o router.

O fallback está em `src/lib/weather/weather-intelligence-fallback.ts` e segue estas regras:

- `status: unavailable`;
- `current: null`;
- séries horária e diária vazias;
- alertas, previsões oficiais e contextos auxiliares vazios;
- todas as fontes marcadas como indisponíveis e não utilizáveis;
- score de qualidade zero e confiança baixa;
- brief determinístico, sem chamada de IA;
- nenhum valor meteorológico demonstrativo ou inventado.

A interface pública já possui estados vazios/indisponíveis e deve continuar navegável mesmo sem dados utilizáveis.

## 2. Cliente desatualizado após deploy

O portal usa Vite/TanStack e possui chunks versionados. Quando uma aba permanece aberta durante um deploy, ela pode continuar com o shell antigo e, ao navegar para outra rota, solicitar um chunk que foi substituído. Erros típicos incluem:

- `Failed to fetch dynamically imported module`;
- `Error loading dynamically imported module`;
- `ChunkLoadError`;
- falhas de preload de módulo/CSS.

`src/lib/stale-client-recovery.ts` trata apenas assinaturas conhecidas desse cenário.

A recuperação possui duas entradas:

- evento `vite:preloadError`, instalado no root do aplicativo;
- inspeção do erro que chegou ao `errorComponent` global.

Quando a assinatura é compatível com cliente desatualizado, o navegador executa uma recarga completa para buscar o HTML e os chunks da versão publicada.

Para impedir loop de recarga, a tentativa é registrada em `sessionStorage` por URL e só pode ocorrer automaticamente uma vez dentro de uma janela de 60 segundos. Se `sessionStorage` não estiver disponível, não há recarga automática.

O botão manual `Tentar novamente` do erro global também usa `window.location.reload()`.

## 3. Central Regional

`/tempo-na-regiao-sul-rs` possui ainda uma barreira própria porque seu contrato deve preservar o diretório das 24 cidades mesmo quando todas as fontes da visão resumida falharem.

Esse fallback cria itens `unavailable` para todo `PUBLIC_REGIONAL_CITIES`, com métricas nulas e links municipais preservados. A estratégia detalhada do provedor/snapshot continua em `docs/REGIONAL_WEATHER_FALLBACK.md`.

## 4. O que não fazer

- Não transformar erro de programação arbitrário em dado meteorológico válido.
- Não inserir temperatura, chuva, vento, nível, alerta ou timestamp fictício para preencher a interface.
- Não aplicar recarga automática a toda exceção do React; a recuperação de cliente só deve reagir a padrões conhecidos de asset/chunk.
- Não criar uma chamada externa por página quando a camada compartilhada já possui fallback.
- Não remover o `errorComponent` global: ele continua necessário como contenção final e telemetria.

## 5. Testes

`tests/public-route-resilience.test.ts` cobre:

- contrato do fallback meteorológico sem valores inventados;
- existência da barreira final em `getWeatherIntelligence()`;
- recuperação de chunks antigos;
- proteção contra loop por `sessionStorage`;
- instalação da recuperação no root e uso no error boundary.

O workflow `quality.yml` executa esse contrato como etapa dedicada.

## 6. Operação e diagnóstico

Quando uma página pública voltar a cair no erro global, classificar primeiro a falha:

- **dados:** conferir server function, fonte externa e fallback correspondente;
- **asset/chunk:** conferir se ocorreu logo após deploy e se o erro corresponde a módulo dinâmico/preload;
- **programação/render:** tratar como bug real, sem mascarar com fallback genérico;
- **infra/runtime:** conferir deploy, logs e disponibilidade da aplicação.

A resiliência deve manter o portal navegável quando a informação externa estiver indisponível, mas sem esconder defeitos reais de código.