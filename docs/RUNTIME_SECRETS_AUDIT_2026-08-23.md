# Tempo Pelotas — auditoria sanitizada de secrets e runtime

Checkpoint: 23/08/2026.

Este documento registra somente nomes e finalidade. Nenhum valor secreto deve ser versionado.

## Resumo

A auditoria do ambiente conectado ao Lovable encontrou 18 secrets cadastradas. A maior parte das integrações meteorológicas e de conta está coberta, mas o subsistema de web push/cron possui cinco variáveis operacionais ausentes no ambiente: `CRON_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` e `PUSH_ADMIN_SECRET`.

Secrets ociosas ou legadas não quebram o runtime por existirem. O risco real é operacional: nomes antigos podem induzir a equipe a acreditar que uma funcionalidade está configurada quando o código ativo já lê outro nome.

## Cadastradas e utilizadas pelo código ativo

- `MOBI_SUPABASE_SECRET_KEY` — cliente administrativo server-side do Supabase externo.
- `GEMINI_WEATHER_ENABLED` — chave liga/desliga da camada editorial Weather AI.
- `GEMINI_API_KEY` — autenticação da integração Gemini Weather AI.
- `GEMINI_MODEL` — seleção do modelo da integração Gemini.
- `REDEMET_API_BASE_URL` — base da integração REDEMET.
- `REDEMET_API_KEY` — autenticação REDEMET.
- `REDEMET_RADAR_AREA` — configuração operacional do radar.
- `REDEMET_RADAR_PRODUCT` — configuração operacional do produto do radar.
- `YOUTUBE_API_KEY` — integração das câmeras/canal no YouTube.
- `YOUTUBE_CHANNEL_HANDLE` — identificação do canal usado pela camada de câmeras.
- `LOVABLE_API_KEY` — ferramenta operacional de smoke/cutover; não é dependência da interface pública normal.

## Cadastradas, mas sem uso no runtime público atual

- `GOOGLE_SEARCH_CONSOLE_API_KEY` — não é lida pelo runtime atual; Search Console é tratado como ferramenta/conector operacional.
- `GOOGLE_MAPS_SERVER_API_KEY` — referência legada; mapas públicos atuais usam MapLibre/OpenFreeMap.
- `GOOGLE_OAUTH_CLIENT_ID` — não alimenta o login Google atual.
- `GOOGLE_OAUTH_CLIENT_SECRET` — não alimenta o login Google atual; permanece apenas em verificações operacionais/legadas.
- `GOOGLE_PAGESPEED_API_KEY` — não é lida pelo runtime atual.
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — legado sem uso na interface ativa.
- `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` — legado sem uso na interface ativa.

A existência desses nomes não gera erro por si só. Não remover sem revisar ferramentas externas, workflows e planos de reativação.

## Login Google — nome canônico atual

O fluxo ativo usa Google Identity Services no navegador e lê:

- `VITE_GOOGLE_CLIENT_ID` — valor público de build.

A credencial Google é então validada pelo Supabase externo via `signInWithIdToken`. Portanto `GOOGLE_OAUTH_CLIENT_ID` e `GOOGLE_OAUTH_CLIENT_SECRET` não devem ser tratados como prova de que o login atual está configurado.

## Ausentes e necessários para web push/cron

- `CRON_SECRET` — protege rotinas agendadas, incluindo o resumo diário; quando usado por GitHub Actions ou outro scheduler, deve corresponder ao segredo configurado no chamador.
- `VAPID_PUBLIC_KEY` — chave pública de Web Push.
- `VAPID_PRIVATE_KEY` — chave privada de Web Push; exclusivamente server-side.
- `VAPID_SUBJECT` — identidade VAPID, normalmente `mailto:` ou URL HTTPS.
- `PUSH_ADMIN_SECRET` — protege disparos administrativos em `/api/push/broadcast`.

Sem o par VAPID, o endpoint `/api/push/config` declara o recurso indisponível e o gerenciador público de notificações permanece oculto. Sem `CRON_SECRET`, a rotina diária protegida não pode ser executada normalmente. Sem `PUSH_ADMIN_SECRET`, o broadcast administrativo responde como não configurado.

A auditoria do repositório também não encontrou um workflow/scheduler versionado que chame automaticamente `/api/cron/push-daily`. Portanto configurar `CRON_SECRET` é necessário, mas não suficiente: o resumo diário só passa a ser automático quando existir um agendamento real e monitorado para essa rota. `water` e `community` possuem consentimento e caminho de broadcast, mas não possuem hoje uma automação própria equivalente ao resumo diário.

## Preferências da conta x canal de entrega

As preferências `weather_alerts`, `water_alerts`, `daily_summary` e `community_updates` são persistidas no Supabase e já são usadas como filtros de consentimento pelo backend de Web Push.

A preferência, sozinha, não cria uma inscrição no navegador. O fluxo correto é:

`conta/preferências → ativação explícita no navegador → PushManager → /api/push/subscription → inscrição vinculada à conta → filtro por preferência → entrega`

Desde este checkpoint, `PushNotificationsManager` está montado no shell global. Ele permanece invisível quando `/api/push/config` informa que o ambiente ainda não possui configuração VAPID operacional.

## Google Analytics

Measurement ID público da conexão existente: `G-97YX7HPD90`.

A conexão do workspace Lovable chamada `Analytics TEMPO Pelotas` existe, mas a tentativa de vínculo ao projeto foi recusada pela camada de permissões da própria conexão: o proprietário/membro que possui o projeto não está autorizado a usar essa conexão no estado atual.

O conector Google Analytics do Lovable é a fonte canônica planejada para o tracking. Não manter uma segunda inicialização manual de `gtag.js` no código enquanto esse conector for a integração escolhida, pois isso pode duplicar inicialização e pageviews quando a conexão for vinculada.

Até a permissão ser corrigida e o vínculo concluído, o projeto não deve declarar a medição do GA4 como operacional somente por existir o Measurement ID.

## Próximos passos operacionais

1. corrigir a permissão da conexão `Analytics TEMPO Pelotas` no workspace e vinculá-la ao projeto;
2. validar no navegador/Realtime do GA4 que cada navegação SPA gera somente um pageview;
3. gerar/configurar o par VAPID definitivo e `VAPID_SUBJECT`;
4. configurar `PUSH_ADMIN_SECRET`;
5. definir `CRON_SECRET` e configurar um scheduler real para `/api/cron/push-daily` usando o mesmo valor;
6. validar `/api/push/config` em produção;
7. ativar notificações em um navegador autenticado e confirmar que a inscrição recebe `user_id`;
8. testar separadamente weather, water, daily summary e community com consentimento ligado/desligado;
9. manter e-mail como canal separado caso seja implementado futuramente; as quatro preferências atuais não equivalem a assinatura de e-mail.
