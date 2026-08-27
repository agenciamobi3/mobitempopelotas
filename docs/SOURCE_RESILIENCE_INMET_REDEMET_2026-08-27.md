# Tempo Pelotas — resiliência INMET e REDEMET

Data: 27/08/2026  
Branch: `main`

## Contexto

A revisão visual de produção identificou dois estados degradados recorrentes que precisavam ser tratados além da camada de CSS:

- a previsão municipal oficial do INMET podia aparecer indisponível mesmo com a previsão horária principal funcionando;
- a camada de satélite REDEMET podia ficar sem imagem, deixando apenas o mapa-base e o estado de indisponibilidade.

A correção mantém uma regra central do portal: contingência não pode mudar silenciosamente a natureza do dado apresentado.

## Previsão municipal do INMET

A consulta oficial passa a usar um contrato resiliente em `src/lib/weather/inmet-forecast-resilient.server.ts`.

Ordem operacional:

1. rota municipal atual observada para o código IBGE de Pelotas;
2. rota histórica já utilizada anteriormente pelo projeto como contingência.

A segunda consulta começa de forma escalonada quando a primeira demora e assume imediatamente quando a primeira falha. O objetivo é aumentar disponibilidade sem elevar o deadline global da Home: `OFFICIAL_SOURCE_DEADLINE_MS.inmetForecast` permanece em 1,9 s.

As duas rotas alimentam o mesmo parser e representam a mesma semântica: previsão municipal oficial do INMET. Nenhuma delas é convertida em observação meteorológica.

Se ambas falharem, o estado continua `unavailable`; não são produzidos períodos fictícios, valores zero ou dados de outro provedor sob o rótulo INMET.

## Satélite REDEMET com contingência oficial

Foi adicionado `src/lib/redemet/redemet-satellite-resilient.server.ts`.

Contrato:

- Realçado e Infravermelho continuam tentando a REDEMET/DECEA primeiro;
- quando a REDEMET não retorna camada utilizável dentro do orçamento, GOES/INMET pode assumir como contingência oficial;
- a resposta identifica `provider: INMET`, produto GOES e `sourceLabel` de contingência, portanto a origem real continua visível;
- o canal Visível **não** recebe fallback infravermelho, porque isso alteraria a semântica do produto selecionado;
- se REDEMET e INMET estiverem indisponíveis, o mapa permanece em estado degradado e conserva o diagnóstico das duas fontes;
- o last-good existente continua válido por até duas horas quando houver um quadro recente elegível.

A rota pública `/api/redemet/satellite` passa a usar esse contrato para Realçado/IR/Visível. A seleção direta `source=inmet` permanece disponível.

## Interface

A seção de radar/satélite da Home passou a declarar `REDEMET / DECEA + INMET` como fontes do monitoramento e deixou de usar a expressão genérica “tempo real” para todo o bloco. A copy agora descreve observações recentes, atualizadas conforme disponibilidade e horário da fonte.

O estado visual de indisponibilidade já havia sido corrigido na mesma rodada para não cobrir grande parte do mapa e para manter contraste legível.

## Testes

`tests/source-resilience-regressions.test.ts` protege:

- presença e prioridade da rota atual de previsão INMET;
- entrada escalonada da rota histórica;
- preservação do deadline de 1,9 s;
- preferência pela REDEMET quando a camada está disponível;
- contingência GOES/INMET para Realçado e Infravermelho;
- proibição de substituir Visível por infravermelho;
- preservação do estado indisponível quando as duas fontes falham.

O teste foi incluído em `npm run test:contracts`.

## Limites de validação

O código e os contratos estão versionados, mas a infraestrutura atual do GitHub Actions ainda não produz checks para o repositório. Portanto esta documentação não declara a suíte aprovada.

A confirmação final exige observar o domínio publicado após sincronização/deploy e validar pelo menos:

- retorno da previsão oficial INMET na Home;
- Realçado/IR com REDEMET saudável;
- fallback GOES/INMET quando REDEMET estiver degradada;
- Visível no período noturno e diurno;
- timestamp e identificação da fonte em todos os estados.
