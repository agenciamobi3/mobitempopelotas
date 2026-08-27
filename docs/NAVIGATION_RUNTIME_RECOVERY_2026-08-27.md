# Tempo Pelotas — recuperação de runtime entre navegações

Data: 27/08/2026

## Problema observado

Usuários reportaram ocorrências recorrentes do boundary global `Não foi possível carregar esta página` durante a troca entre páginas públicas, inclusive em `/vento-em-pelotas`.

O sintoma é compatível com uma falha transitória de navegação SPA: uma aba que já hidratou pode permanecer aberta durante um novo deploy e, ao navegar, tentar buscar um chunk, preload ou server function que pertence à versão anterior. Também pode ocorrer uma falha temporária de transporte entre o cliente e uma server function.

A página de Vento não foi tratada como causa isolada. A correção foi aplicada em duas camadas: runtime global e degradação local das rotas que combinam múltiplas consultas.

## 1. Recuperação global de navegação

`src/lib/stale-client-recovery.ts` passou a distinguir:

- erro de asset/chunk/preload;
- erro transitório de navegação ou server function.

Além dos padrões de bundle já existentes, a recuperação reconhece falhas de `fetch`, rede, server function e respostas transitórias como 408, 410, 425, 429, 500, 502, 503 e 504. O 404 também é recuperável neste contexto porque uma aba antiga pode requisitar uma função/chunk que deixou de existir após um deploy.

A recuperação genérica só é habilitada depois que o runtime cliente hidratou com sucesso. Dessa forma, um erro determinístico no carregamento inicial não dispara recargas em ciclo.

Quando uma falha transitória ocorre durante a navegação:

1. o erro continua sendo reportado à telemetria disponível;
2. o navegador registra em `sessionStorage` a URL e o instante da tentativa;
3. é feita uma única recarga completa da própria URL;
4. HTML e runtime passam a pertencer à mesma versão publicada;
5. uma nova tentativa automática na mesma URL fica bloqueada por 60 segundos.

Se o navegador estiver offline, a recuperação genérica não força reload. Se o mesmo erro persistir depois da tentativa protegida, o boundary continua disponível ao usuário em vez de entrar em loop.

O listener específico `vite:preloadError` permanece ativo para falhas de preload detectadas antes do boundary.

## 2. Vento e Chuva não dependem mais de sucesso conjunto

Antes desta correção, `/vento-em-pelotas` e `/chuva-em-pelotas` executavam:

- `getWeatherIntelligence()`;
- `getPelotasMeteogram()`;

em `Promise.all`.

Mesmo que cada integração tenha fallback server-side, uma falha no transporte da própria server function poderia rejeitar a Promise no navegador e derrubar toda a rota.

Foi criado `src/lib/weather/public-weather-page-loader.ts`.

O novo contrato usa `Promise.allSettled` e trata cada domínio separadamente:

- se a inteligência meteorológica não chegar ao cliente, usa `createUnavailableWeatherIntelligence()`;
- se o meteograma não chegar, entrega `MeteogramData` com `status: unavailable` e série vazia;
- nenhuma falha é convertida em valor zero, observação falsa ou previsão fictícia;
- os componentes que dependem do detalhamento horário simplesmente deixam de renderizar conteúdo que não existe;
- o restante da página continua navegável.

Vento e Chuva agora usam esse loader compartilhado.

## 3. O que esta correção não faz

- não mascara um bug determinístico recorrente;
- não chama dados previstos de observação;
- não transforma falha de fonte em condição normal;
- não desativa a navegação SPA;
- não cria banco, migration, secret, variável de ambiente ou rota pública;
- não depende do service worker para recuperar o runtime;
- não força recarga quando o navegador está explicitamente offline.

## 4. Contrato automatizado

`tests/public-route-resilience.test.ts` protege:

- listener de `vite:preloadError`;
- limite de uma recuperação por URL/janela;
- reconhecimento de falhas transitórias de navegação/server function;
- ativação somente após hidratação do cliente;
- bloqueio de reload genérico offline;
- uso de `Promise.allSettled` no loader público compartilhado;
- uso do loader resiliente por Vento e Chuva;
- ausência do antigo `Promise.all` nessas duas rotas.

O workflow `Qualidade` já executa esse arquivo no passo `Resiliência das rotas públicas`.

## 5. Validação pós-deploy

Após publicação, validar em uma sessão normal e também com uma aba mantida aberta durante um deploy:

1. navegar repetidamente entre Home, Hoje, Chuva, Vento, 7 dias, Radar e páginas de Águas;
2. confirmar que uma falha transitória recuperável provoca no máximo uma recarga completa e segue para a página pedida;
3. confirmar ausência de ciclos de recarga;
4. deixar o navegador offline e confirmar que o runtime não entra em tentativa automática de reload;
5. validar que Vento e Chuva permanecem renderizadas quando o meteograma estiver indisponível;
6. observar telemetria/logs para identificar se ainda existe uma classe de erro não coberta;
7. repetir em desktop e mobile.

A correção reduz o impacto ao usuário e também mantém o erro determinístico visível após a tentativa protegida, permitindo investigação em vez de ocultação permanente.
