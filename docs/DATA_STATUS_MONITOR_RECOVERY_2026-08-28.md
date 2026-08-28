# Recuperação do monitor de status — 28/08/2026

## Incidente

O histórico persistido de `/status-dos-dados` deixou de receber amostras depois de **23/08/2026 17:52:07 UTC**. A página pública continuou capaz de consultar o estado atual das fontes, mas os percentuais de disponibilidade, incidentes e duração monitorada dependiam de uma rotina agendada que não estava mais executando.

A causa não estava na coleta das fontes nem no Supabase. O disparo periódico era feito exclusivamente pelo workflow `.github/workflows/data-status-monitor.yml`. No mesmo período, os GitHub Actions do repositório passaram a criar jobs sem executar steps. Portanto a indisponibilidade do runner interrompeu também a persistência histórica.

## Correção arquitetural

A coleta periódica deixa de depender do GitHub Actions como agendador primário.

A migration `20260828170000_data_status_supabase_scheduler.sql` cria:

- `data_source_status_monitor_settings`, tabela privada com endpoint, token aleatório e kill switch;
- `invoke_data_source_status_monitor()`, função `security definer` que usa `pg_net` para chamar o endpoint interno;
- job `tempo-pelotas-data-status-monitor` em `pg_cron`, executado a cada 10 minutos.

O token é gerado no próprio banco e enviado apenas no header `X-Collector-Token`. O runtime valida esse token consultando a tabela privada e usando comparação timing-safe. Não existe cópia do token no navegador, no GitHub ou em arquivo versionado.

`CRON_SECRET` e GitHub OIDC permanecem aceitos pelo endpoint como caminhos operacionais secundários. O workflow do GitHub não agenda mais a coleta a cada 10 minutos; mantém execução manual/push e o smoke diário de segurança.

## Lacuna de 23–28/08

A ausência de amostras não pode ser interpretada como continuidade de um incidente.

Antes de religar o monitor, a migration encerra incidentes que permaneciam abertos e cuja última confirmação tem mais de 30 minutos. O `resolved_at` é fixado no próprio `last_seen_at`, e o detalhe registra que houve uma lacuna de monitoramento. Se a primeira nova amostra continuar degradada, a função existente `record_data_source_status` abre um novo incidente a partir do momento efetivamente observado.

Assim, o portal não transforma cinco dias sem monitoramento em cinco dias comprovados de indisponibilidade.

## Proteção contra histórico stale

`src/lib/status/data-status-freshness.server.ts` consulta a amostra persistida mais recente. Se ela tiver mais de 30 minutos — três intervalos nominais do cron — o histórico deixa de ser apresentado como disponibilidade atual.

A seção de estado atual continua independente: `collectDataStatus()` ainda consulta as integrações no carregamento da página. Apenas os percentuais/incidentes históricos são degradados até existir novamente uma amostra recente.

## Contratos

`tests/data-status-history.test.ts` protege:

- RLS e RPCs do histórico original;
- scheduler `pg_cron` e chamada `pg_net`;
- token privado sem duplicação em secret externo;
- encerramento explícito de incidentes presos antes da lacuna;
- barreira de 30 minutos contra histórico stale;
- permanência do GitHub OIDC como caminho secundário;
- ausência do antigo cron GitHub de 10 minutos.

O workflow `quality.yml` possui etapa dedicada para esse contrato. Enquanto os runners continuarem sem steps, essa etapa permanece versionada mas sem evidência executável.

## Operação

Após publicar o runtime que aceita `X-Collector-Token`:

1. aplicar a migration no Supabase oficial;
2. confirmar `tempo-pelotas-data-status-monitor` ativo em `cron.job`;
3. executar `select public.invoke_data_source_status_monitor()` uma vez para smoke;
4. confirmar resposta 2xx em `net._http_response`;
5. confirmar novas linhas em `data_source_status_checks`;
6. confirmar que incidentes anteriores à lacuna foram encerrados em seu último `last_seen_at`;
7. confirmar que eventual estado degradado atual abre um novo incidente com timestamp atual.

Migration versionada e deploy de código não substituem essa validação no banco oficial.
