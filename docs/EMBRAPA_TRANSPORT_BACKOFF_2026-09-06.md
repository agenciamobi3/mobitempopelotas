# Embrapa — incidente de transporte e backoff do coletor (06/09/2026)

## Objetivo

Registrar o diagnóstico operacional da interrupção da coleta central da Embrapa Clima Temperado e a política de backoff adotada sem alterar a semântica pública da observação meteorológica.

## Evidência observada

Em 06/09/2026, `weather_station_current` mostrava:

- último sucesso: `2026-09-05T11:56:02Z`;
- último erro: `The operation was aborted due to timeout`;
- mais de 1.100 falhas consecutivas;
- duração das tentativas próxima ao limite configurado de 2,2 s.

O endpoint consultado pelo portal continua sendo:

`https://agromet.cpact.embrapa.br/online/Current_Monitor.htm`

Uma prova de conectividade executada a partir do Supabase com `pg_net` mostrou que o problema não se limita ao timeout curto do aplicativo:

- HTTPS com teto de 12 s: nenhum HTTP foi trocado; o tempo ficou concentrado no estabelecimento da conexão/TLS;
- HTTP com teto de 12 s: nenhum HTTP foi trocado; a conexão também não completou;
- HTTPS com teto de 20 s: nenhum HTTP foi trocado; o handshake permaneceu pendente até o timeout.

Ao mesmo tempo, a página oficial continuava aparecendo em rastreamento público recente com dados meteorológicos atuais. Portanto este incidente deve ser descrito como **falha de transporte da integração do Tempo Pelotas até o host**, e não como prova de indisponibilidade global da Embrapa.

## Contrato público preservado

A correção anterior continua válida:

- snapshot central só é caminho rápido por 75 s;
- amostra com mais de 30 min não pode ser publicada como `Agora`;
- pageview não dispara refresh persistente;
- sem observação recente, o Hero degrada para previsão/atualização e nunca promove last-good antigo como condição atual.

O backoff do coletor não altera nenhuma dessas regras.

## Backoff adaptativo

O cron continua agendado a cada minuto. A função `public.invoke_embrapa_collector()` decide se realmente deve chamar o endpoint conforme `consecutive_failures` e `last_attempt_at`:

- 0–2 falhas: tenta a cada minuto;
- 3–9 falhas: mínimo de 2 minutos entre tentativas;
- 10–59 falhas: mínimo de 5 minutos;
- 60 ou mais falhas: mínimo de 10 minutos.

No primeiro sucesso, a lógica de saúde existente zera a sequência de falhas e a cadência efetiva volta ao normal sem precisar alterar o cron.

## O que o backoff resolve

- reduz chamadas redundantes ao runtime e ao host externo durante falha prolongada;
- reduz ruído em logs e custos operacionais;
- preserva detecção automática de recuperação;
- não cria nova fonte de observação;
- não usa cache velho como `Agora`;
- não transforma falha de integração em diagnóstico sobre a disponibilidade pública da Embrapa.

## O que continua pendente

- confirmar se a rota de rede entre o runtime hospedado e `agromet.cpact.embrapa.br` volta a completar conexão;
- investigar, se necessário, se o aplicativo oficial Agromet usa outro endpoint público e documentado que possa ser utilizado legitimamente pelo portal;
- não adotar scraping de cache de buscador como fonte meteorológica;
- não substituir silenciosamente a observação Embrapa por INMET/Open-Meteo sob o mesmo rótulo de fonte.
