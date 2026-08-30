# Tempo Pelotas → MOBI Ticket — preparação do consumidor P1

Data: **29/08/2026**  
Status: **source ready / runtime unchanged / canary pending**

## Objetivo

Preparar o Tempo Pelotas como primeiro consumidor externo controlado do MOBI Ticket P1 sem quebrar o widget P0 já montado globalmente no portal e sem versionar a chave da origem.

## Estado encontrado

O root do TanStack Start já monta:

```text
<MobiTicketWidgetLoader />
```

A implementação anterior carregava somente:

```text
https://agenciamobi.com.br/widget/mobi-ticket.js
source=tempo_pelotas
```

O MOBI Core passou a versionar o loader canônico em:

```text
https://agenciamobi.com.br/widgets/mobi-support-widget-loader.js
```

O Core P1 também possui, apenas em source neste momento, configuração pública sanitizada por origem por meio de `support-widget-config`.

## Migração backward-compatible

`src/components/mobi-ticket/MobiTicketWidgetLoader.tsx` agora opera em dois modos:

### Chave da instalação presente

Quando existe:

```text
VITE_MOBI_TICKET_WIDGET_TOKEN
```

o portal carrega o loader canônico, mantém `source=tempo_pelotas`, habilita `data-config-mode=remote` e fornece atributos P0 de fallback para categorias/copy/apresentação.

Categorias de fallback:

```text
Erro no portal
Sugestão
Dados incorretos
Dúvida
Solicitação de melhoria
```

### Chave ainda ausente

Enquanto a variável não estiver configurada no ambiente publicado, o portal continua usando o script legado P0.

Isso é deliberado: preparar o source P1 não pode desligar o suporte existente por ausência de um gate de runtime do Core.

## Segurança

`VITE_MOBI_TICKET_WIDGET_TOKEN` é uma chave pública de instalação: ela necessariamente chega ao browser e só possui autoridade quando combinada no Core com:

- `source=tempo_pelotas` ativo;
- allowlist explícita de origem;
- validação server-side do endpoint.

Mesmo sendo pública por desenho, o valor real não é versionado no Git. `.env.example` documenta apenas o nome vazio.

Não existem no consumidor:

- `SUPABASE_SERVICE_ROLE_KEY`;
- token administrativo do Core;
- acesso direto ao banco Core;
- configuração de allowlist pelo browser;
- fallback que transforme a chave pública em autorização isolada.

## Teste de contrato

`tests/analytics-communication-runtime.test.ts` agora protege:

- montagem global do widget;
- carregamento em idle;
- URL canônica do loader;
- fallback legado P0;
- variável de ambiente sem valor versionado;
- `source=tempo_pelotas` fixo;
- configuração remota somente quando a chave estiver presente;
- categorias públicas esperadas;
- ausência de `service_role`/segredo administrativo.

## Runtime

Nenhum deploy do Tempo Pelotas foi realizado nesta rodada e nenhum runtime do Core foi alterado por este repositório.

Estado correto:

```text
Tempo consumer source       = ready_for_p1_canary
Tempo production runtime    = unchanged
Core P1 migration           = source_only_not_applied
Core support-widget-config  = source_ready_not_deployed
Core loader v1.1            = source_ready_not_published
canary                       = pending
```

## Próximo gate

A ordem segura é:

1. aplicar `20260830021500_mobi_ticket_p1_public_origin_config.sql` no Core por boundary autorizado;
2. publicar `support-widget-config` e exigir probe fail-closed;
3. preencher `public_config` somente da origem `tempo_pelotas`;
4. publicar o loader canônico v1.1 no Core;
5. configurar `VITE_MOBI_TICKET_WIDGET_TOKEN` no ambiente do Tempo Pelotas;
6. publicar o portal;
7. validar browser real: config remota, fallback, status e abertura do ticket;
8. criar um ticket real portal → Core e confirmar protocolo/ingress;
9. só depois generalizar P1 para outras origens.

Não remover o fallback legado antes de o canário real passar.
