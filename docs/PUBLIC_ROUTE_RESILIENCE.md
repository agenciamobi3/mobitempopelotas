# Resiliência das rotas públicas

## Objetivo

Evitar que páginas públicas do Tempo Pelotas sejam substituídas pelo `errorComponent` global por falhas transitórias, integrações lentas ou estados antigos de cliente que podem ser degradados com segurança.

A prioridade operacional é explícita: **o documento público precisa abrir antes de qualquer dependência externa lenta**. Dados meteorológicos, hidrológicos, radar, satélite e séries auxiliares podem degradar; a navegação não pode degradar junto.

A estratégia cobre quatro classes diferentes de falha:

1. falha de dados no servidor;
2. dependência externa lenta o bastante para reter o SSR público;
3. invalidação SPA desnecessária de uma página pública já saudável;
4. cliente desatualizado após deploy, quando o navegador tenta carregar um chunk/module antigo.

O `errorComponent` global continua existindo como última barreira para erros de programação ou falhas que não possam ser recuperadas com segurança. Ele não é uma tela normal de carregamento e não deve aparecer durante navegação saudável.

## 1. Falha de dados meteorológicos

Grande parte das páginas meteorológicas públicas consome `getWeatherIntelligence()`.

A camada interna possui timeouts e estados `unavailable` para várias fontes, mas uma exceção inesperada acima desses adapters ainda pode rejeitar a server function. `src/lib/weather/weather-intelligence.functions.ts` contém a última barreira de exceção: quando `fetchWeatherIntelligence()` falha de forma inesperada, a server function devolve `createUnavailableWeatherIntelligence()` em vez de propagar a exceção para o router.

O fallback preserva estas regras:

- `status: unavailable`;
- `current: null`;
- séries horária e diária vazias;
- alertas, previsões oficiais e contextos auxiliares vazios;
- fontes marcadas como indisponíveis e não utilizáveis;
- score de qualidade zero e confiança baixa;
- brief determinístico, sem chamada de IA;
- nenhum valor meteorológico demonstrativo ou inventado.

A interface pública deve continuar navegável mesmo sem dados utilizáveis.

## 2. Budget de fonte e budget de página são contratos diferentes

O pipeline meteorológico compartilhado mantém budgets internos realistas para não declarar uma fonte fora cedo demais. A consolidação completa de `getWeatherIntelligence()` pode usar até **5 segundos**, e integrações individuais possuem seus próprios limites.

Isso não significa que uma página pública deva aguardar os mesmos 5 segundos.

Em 28/08/2026 foi aplicado um hotfix de navegação após reprodução do portal caindo na tela global “Carregando a versão mais recente do Tempo Pelotas” durante uso normal. A política atual passou a ser:

- Home: meteorologia principal com teto local de **2,5 s**;
- Home: bloco hidrológico continua diferido e recebe teto de **3,5 s**, sem bloquear a página principal;
- Hoje, Amanhã, 7 dias, Alertas e demais páginas que usam `loadPublicWeatherPage()`: teto local de **2,5 s**;
- Chuva, Vento e páginas compostas com meteograma: cada domínio recebe teto local de **2,5 s** e degrada independentemente;
- páginas hidrológicas públicas compartilhadas: cada dependência recebe teto local de **2,5 s**;
- Radar e Satélite: teto de página de **2,8 s** por domínio;
- Previsão de 15 dias: teto de página de **2,8 s** por domínio.

Ao atingir o teto da página, o loader retorna o contrato `unavailable` daquele domínio. Isso **não** afirma que a fonte oficial está fora; significa somente que aquela renderização pública não aguardará mais.

Os budgets internos das fontes permanecem separados e podem ser maiores porque também atendem coletores, caches, monitoramento e tentativas de recuperação fora do caminho crítico da navegação.

### 2.1. Open-Meteo

O fluxo compartilhado permanece:

1. origem Open-Meteo direta primeiro;
2. se a origem direta for utilizável, retornar imediatamente;
3. se estiver indisponível, tentar o último payload validado persistido no cache privado do Supabase;
4. somente quando o cache não puder atender, consultar configuração/token e chamar a Edge Function;
5. se nenhuma camada puder atender, preservar `unavailable`.

O cache privado não inventa previsão: ele reutiliza o último payload completo validado e preserva o horário real da captura.

A previsão estendida segue a mesma prioridade, mas com contrato próprio: primeiro tenta 15 dias diretamente; em falha pode reutilizar até 7 dias reais preservados como janela `partial`, sem extrapolar dias 8–15.

### 2.2. Embrapa

`getCentralEmbrapaObservation()` é cache-first/read-only no caminho público. A visita à página não deve reivindicar lease nem disparar coleta persistente. A última observação real pode ser exibida quando a coleta corrente falha, sempre com horário/idade originais e sem se passar por observação nova.

### 2.3. Hidrologia

Laranjal, Guaíba, rede da Lagoa dos Patos, SACE e Defesa Civil degradam separadamente. `src/lib/hydrology/public-hydrology-page-loader.ts` contém agora a barreira local de 2,5 s por dependência. Nenhuma delas pode impedir a rota inteira de abrir.

## 3. Invalidação global por minuto retirada do público

`WeatherMinuteRefresh` deixou de executar `router.invalidate()` a cada 60 segundos.

Esse mecanismo era incompatível com a estratégia atual de navegação pública por documento completo: uma página já carregada e saudável podia, um minuto depois, reabrir todos os loaders via SPA. Uma oscilação transitória de rede, server function, fonte ou deploy podia então promover a rota inteira ao boundary global sem o visitante ter feito nada.

A regra atual é:

- nenhum `router.invalidate()` periódico global nas páginas públicas;
- coletores, cron e caches centrais continuam atualizando as fontes;
- uma nova navegação pública obtém um documento novo;
- componentes que realmente precisarem de atualização em segundo plano devem atualizar somente seu próprio domínio, sem invalidar a árvore de rotas inteira.

## 4. Navegação pública por documento completo

`src/components/navigation/PublicDocumentNavigationGuard.tsx` intercepta links públicos same-origin e usa `window.location.assign(destination.href)`.

Áreas autenticadas como `/conta`, `/painel`, `/auth`, `/login` e `/admin` continuam autorizadas a usar SPA. Um link específico também pode optar por SPA com `data-spa-navigation="true"`.

O objetivo é evitar que uma aba antiga dependa de route chunks mantidos em memória depois de um deploy.

## 5. Cliente desatualizado após deploy

`src/lib/stale-client-recovery.ts` reconhece assinaturas de chunk/module antigo, como `Failed to fetch dynamically imported module`, `ChunkLoadError` e falha de preload.

Quando a assinatura é recuperável, o navegador pode solicitar um documento fresco com `__tp_recover=<timestamp>`. A tentativa é limitada por `sessionStorage` por URL lógica dentro de uma janela de 60 segundos para impedir loop.

Essa recuperação é uma contenção excepcional. A tela global de atualização não deve ser usada como parte normal da navegação.

## 6. Radar, STSC e satélites

A disponibilidade de Radar/STSC/satélite é independente da disponibilidade do documento público. A página deve abrir mesmo que a REDEMET ou o INMET não respondam dentro do budget de página.

O monitor operacional também deve distinguir resposta da integração, timeout e payload não utilizável. Um timeout do adapter não deve ser apresentado como prova de indisponibilidade global do serviço oficial.

## 7. O que não fazer

- Não transformar erro de programação em dado meteorológico válido.
- Não inserir temperatura, chuva, vento, nível, alerta ou timestamp fictício.
- Não restaurar invalidação global periódica de toda a rota pública.
- Não criar loop de recuperação automática.
- Não fazer uma fonte externa reter o documento público até o timeout da hospedagem.
- Não disparar coleta, lease ou persistência apenas porque um visitante abriu uma página.
- Não confundir budget de SSR com budget da fonte oficial.
- Não remover o `errorComponent` global; ele permanece como contenção final, não como experiência normal.

## 8. Testes

`tests/public-navigation-stability.test.ts` protege especificamente o hotfix de navegação:

- ausência de `router.invalidate()`/`setInterval()` no refresh global público;
- preservação da navegação por documento completo;
- teto de 2,5 s nos loaders meteorológicos e hidrológicos públicos;
- teto de 2,8 s em Radar e previsão estendida;
- deadlines próprios da Home e hidrologia diferida.

`tests/public-route-resilience.test.ts` continua cobrindo fallback meteorológico, barreira global, budgets de fontes, recuperação de runtime e navegação pública.

`tests/open-meteo-edge.test.ts`, `tests/fifteen-day-forecast.test.ts` e `tests/redemet-performance.test.ts` preservam os contratos especializados.

Os runners do GitHub Actions continuam precisando de execução real antes de qualquer afirmação de suíte aprovada. Job criado sem steps não comprova build/teste.

## 9. Operação e diagnóstico

Quando uma página pública voltar a cair no boundary global, classificar primeiro:

- **loader lento:** confirmar se a barreira local devolveu fallback dentro de 2,5–2,8 s;
- **dados:** verificar fonte externa e fallback correspondente;
- **asset/chunk:** verificar se ocorreu após deploy e corresponde a módulo/preload antigo;
- **programação/render:** tratar como bug real, sem mascarar com valor fictício;
- **infra/runtime:** verificar publicação, logs e disponibilidade da aplicação.

A prioridade é manter o portal navegável. A ausência temporária de uma camada de dados é preferível a uma página pública inteira inacessível.
