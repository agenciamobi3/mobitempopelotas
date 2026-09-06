# Resiliência das rotas públicas

## Objetivo

Evitar que páginas públicas do Tempo Pelotas sejam substituídas pelo `errorComponent` global por falhas transitórias, integrações lentas ou estados antigos de cliente que podem ser degradados com segurança.

A prioridade operacional é explícita: **o documento público precisa abrir antes de qualquer dependência externa lenta**. Dados meteorológicos, hidrológicos, radar, satélite e séries auxiliares podem degradar; a navegação não pode degradar junto.

A estratégia cobre cinco classes diferentes de falha:

1. falha de dados no servidor;
2. dependência externa lenta o bastante para reter o SSR público;
3. preload ou invalidação SPA desnecessária de uma página pública;
4. cliente desatualizado após deploy, quando o navegador tenta carregar um chunk/module antigo;
5. corrida entre recuperações client-side independentes, em que uma resposta poderia apagar a outra.

O `errorComponent` global continua existindo como última barreira para erros de programação ou falhas que não possam ser recuperadas com segurança. Ele não é uma tela normal de carregamento e não deve aparecer durante navegação saudável.

## 1. Shell-first nas rotas públicas críticas

Depois da reprodução do P0 em 28/08/2026, Home, Hoje, Amanhã e 7 dias deixaram de consultar qualquer fonte externa no loader inicial.

Rotas:

- `/`;
- `/tempo-hoje-pelotas`;
- `/tempo-amanha-pelotas`;
- `/previsao-7-dias-pelotas`.

O primeiro loader entrega somente um contrato local criado por `createUnavailableWeatherIntelligence()`. A Home também entrega o resumo hidrológico inicial como indisponível localmente, em vez de aguardar Laranjal, Guaíba ou rede da Lagoa.

Isso significa que o primeiro documento dessas quatro rotas não espera por:

- Open-Meteo;
- Embrapa;
- INMET;
- CPPMet/UFPel;
- Supabase meteorológico;
- Estação Laranjal;
- Guaíba;
- rede da Lagoa dos Patos.

A ausência temporária de valores dinâmicos é preferível a impedir a página de existir.

## 2. Recuperação progressiva depois da hidratação

`src/production/lib/open-meteo-browser-recovery.ts` reforça o contrato inicial somente depois da hidratação.

O hook histórico `useOpenMeteoIntelligenceRecovery()` atualmente recupera duas camadas independentes:

1. previsão Open-Meteo diretamente no navegador;
2. observação atual em `/api/weather/embrapa`, protegida pelo gate de frescor do centralizador da Embrapa.

As recuperações atualizam o estado de forma independente. Nenhuma resposta de cache pode ser tratada como observação atual apenas por possuir temperatura.

### 2.1. Open-Meteo

A recuperação client-side preenche séries horária e diária reais. Ela não altera `current` observado quando já existe uma observação válida.

No servidor, o fluxo compartilhado permanece disponível para rotas que ainda precisam dele:

1. origem Open-Meteo direta;
2. cache privado validado no Supabase;
3. Edge Function somente como contingência;
4. `unavailable` quando nenhuma camada atende.

O cache privado preserva o timestamp real e não inventa previsão.

### 2.2. Embrapa

Em 06/09/2026 foi reproduzida uma regressão na Home: durante a hidratação, o Hero podia inicialmente mostrar a contingência/previsão correta e depois ser sobrescrito por uma leitura central antiga da Embrapa. O caso observado promoviu como `Agora` um snapshot de **05/09 às 08:56** no dia 06/09.

A auditoria do Supabase mostrou que o cron permanecia ativo, porém a coleta estava em falha consecutiva por timeout. O registro central continuava com `fetched_at`/`last_success_at` de 05/09, enquanto novas tentativas seguiam ocorrendo. O bug de apresentação não era o cron estar desabilitado; era o pageview aceitar uma última leitura antiga como se ainda fosse atual.

Contrato permanente após a correção:

- `/api/weather/embrapa` usa `no-store`;
- `src/lib/weather/embrapa-current.server.ts` aceita o snapshot central como caminho rápido somente por **75 segundos**;
- snapshot central mais velho perde autoridade e a leitura cai para consulta direta da fonte;
- essa consulta direta de pageview não reivindica lease, não chama `refreshCentralEmbrapaObservation()` e não persiste dados;
- depois da obtenção, `getObservationAgeMinutes()` + `canUseEmbrapaObservation()` preservam o limite editorial de **30 minutos** para uma observação poder ser publicada como atual;
- observação mais velha, ausente ou indisponível faz `/api/weather/embrapa` responder **503** e não pode ser promovida pelo navegador a `currentSource: embrapa`;
- sem observação recente, a Home pode continuar com previsão, mas o Hero não deve rotular last-known como `Agora`.

Na recuperação client-side:

- timeout próprio: **3 s**;
- somente resposta HTTP publicável é transformada em observação atual;
- `currentProvenance` registra a Embrapa apenas nos campos efetivamente fornecidos;
- condição, rajada e visibilidade permanecem nulas quando não são fornecidas pela estação;
- timestamp/idade da observação permanecem os da própria leitura;
- modelo numérico nunca é promovido silenciosamente a observação medida.

Falha da recuperação Embrapa é local e não impede a previsão Open-Meteo nem a página.

## 3. Rotas que ainda usam budget local de página

Shell-first não foi aplicado indiscriminadamente. Rotas secundárias continuam usando composição server-side resiliente quando isso preserva melhor seu contrato.

Política atual:

- `loadPublicWeatherPage()` e cada domínio de `loadPublicWeatherWithMeteogram()`: **2,5 s** por dependência;
- loaders hidrológicos públicos compartilhados: **2,5 s** por dependência;
- Radar/Satélite: **2,8 s** por domínio;
- previsão de 15 dias: **2,8 s** por domínio;
- inteligência meteorológica interna compartilhada: até **5 s**, sem impor esse teto às quatro rotas shell-first.

Ao atingir o teto, o loader retorna o contrato `unavailable` daquele domínio. Isso não afirma que a fonte oficial está fora; significa somente que aquela renderização pública não aguardará mais.

## 4. Hidrologia

Laranjal, Guaíba, rede da Lagoa dos Patos, SACE e Defesa Civil degradam separadamente em `src/lib/hydrology/public-hydrology-page-loader.ts`.

A Home não consulta mais essas fontes no primeiro loader. Durante o P0, o bloco de águas pode degradar localmente e direcionar o visitante às páginas dedicadas. Um reforço hidrológico futuro da Home deve ser client-side/isolado; não deve recolocar hidrologia no caminho crítico do documento principal.

## 5. Navegação pública fora do SPA

`src/components/navigation/PublicDocumentNavigationGuard.tsx` intercepta links públicos same-origin e usa `window.location.assign(destination.href)`.

O menu principal recebeu proteção adicional: `src/production/components/home-editorial-header.tsx` usa anchors nativas `<a href>` em desktop e mobile, sem TanStack `Link`.

Áreas autenticadas como `/conta`, `/painel`, `/auth`, `/login` e `/admin` continuam autorizadas a usar SPA. Um link específico também pode optar por SPA com `data-spa-navigation="true"`.

## 6. Preload e invalidação global retirados

`src/router.tsx` usa `defaultPreload: false`.

O antigo preload por `intent` com delay zero podia iniciar um loader apenas por hover/foco, antes do clique capturado pela política de documento completo.

`WeatherMinuteRefresh` também não executa mais `router.invalidate()` a cada 60 segundos. Uma página saudável não deve reabrir toda a árvore de loaders por timer, foco, visibilidade ou retorno online.

Atualizações futuras em segundo plano devem ser específicas do componente/domínio.

## 7. Cliente desatualizado após deploy

`src/lib/stale-client-recovery.ts` reconhece assinaturas de chunk/module antigo, como `Failed to fetch dynamically imported module`, `ChunkLoadError` e falha de preload.

Quando a assinatura é recuperável, o navegador pode solicitar um documento fresco com `__tp_recover=<timestamp>`. A tentativa é limitada por `sessionStorage` por URL lógica dentro de uma janela de 60 segundos para impedir loop.

Essa recuperação é uma contenção excepcional. A tela global de atualização não deve ser usada como parte normal da navegação.

## 8. Diagnóstico de publicação

`/api/runtime-version` é um endpoint operacional estático, sem fonte externa, com `no-store` e `X-Robots-Tag: noindex, nofollow`.

Release desta rodada:

`2026-08-28-p0-shell-first-v1`

Seu objetivo é distinguir objetivamente:

- código sincronizado no repositório/preview;
- publicação já propagada no domínio canônico;
- problema real do runtime depois que a versão correta está no ar.

Não declarar a produção alinhada ao shell-first antes de confirmar esse release no domínio canônico.

## 9. Radar, STSC e satélites

A disponibilidade de Radar/STSC/satélite é independente da disponibilidade do documento público. A página deve abrir mesmo que REDEMET ou INMET não respondam dentro do budget de página.

O monitor operacional deve distinguir resposta da integração, timeout e payload não utilizável. Um timeout do adapter não é prova de indisponibilidade global do serviço oficial.

## 10. O que não fazer

- Não transformar erro de programação em dado meteorológico válido.
- Não inserir temperatura, chuva, vento, nível, alerta ou timestamp fictício.
- Não restaurar preload público por intenção.
- Não restaurar invalidação global periódica da árvore de rotas.
- Não criar loop de recuperação automática.
- Não fazer uma fonte externa reter o documento público até o timeout da hospedagem.
- Não disparar coleta, lease ou persistência apenas porque um visitante abriu uma página.
- Não publicar cache central antigo como `Agora`.
- Não promover observação Embrapa com mais de 30 minutos a leitura atual.
- Não confundir budget de documento com budget da fonte oficial.
- Não recolocar Home/Hoje/Amanhã/7 dias em um loader externo sem uma razão operacional comprovada.
- Não remover o `errorComponent` global; ele permanece como contenção final, não como experiência normal.

## 11. Testes

`tests/public-navigation-stability.test.ts` protege:

- ausência de invalidação global;
- navegação por documento completo;
- anchors nativas no menu público;
- `defaultPreload: false`;
- shell-first da Home, Hoje, Amanhã e 7 dias;
- budgets das rotas secundárias.

`tests/public-route-resilience.test.ts` protege a separação entre rotas shell-first e rotas que ainda usam o loader compartilhado.

`tests/embrapa-current-freshness.test.ts` protege:

- janela máxima de 75 segundos do snapshot central;
- observação Embrapa com mais de 30 minutos não publicável como `Agora`;
- temperatura ausente nunca publicável mesmo com timestamp recente.

`tests/embrapa-centralization.test.ts` protege a separação entre coleta persistente do cron e fallback direto read-only do pageview.

`tests/open-meteo-browser-recovery.test.ts` protege:

- recuperação rica do Open-Meteo;
- preservação de observação existente;
- recuperação da observação real da Embrapa;
- ausência de campos observados inventados.

`tests/open-meteo-edge.test.ts`, `tests/fifteen-day-forecast.test.ts` e `tests/redemet-performance.test.ts` preservam os contratos especializados.

Os runners do GitHub Actions continuam precisando de execução real antes de qualquer afirmação de suíte aprovada. Preview reconstruído pelo Lovable não substitui CI, build local, typecheck ou suíte completa.

## 12. Operação e diagnóstico

Quando uma página pública voltar a cair no boundary global ou mostrar dado atual suspeito, classificar nesta ordem:

1. **release:** confirmar `/api/runtime-version`;
2. **documento:** verificar se a rota shell-first entrega HTML antes de qualquer recuperação;
3. **render:** procurar erro de componente ao receber contrato vazio;
4. **observação:** verificar idade do snapshot central e da amostra antes de aceitar o rótulo `Agora`;
5. **recuperação client-side:** verificar Open-Meteo e `/api/weather/embrapa` separadamente;
6. **rota secundária:** validar o budget local de 2,5–2,8 s;
7. **asset/chunk:** verificar se ocorreu após deploy e corresponde a módulo/preload antigo;
8. **infra/runtime:** verificar publicação, logs e disponibilidade da aplicação.

A prioridade é manter o portal navegável e semanticamente correto. A ausência temporária de uma observação é preferível a publicar uma leitura antiga como atual.
