# INMET / GOES — produtos de satélite e estado de integração

Checkpoint original: 23/08/2026.  
Revisão operacional: 28/08/2026.

## Objetivo

Registrar o que é produto oficial documentado pelo INMET e separar isso do que já possui contrato técnico validado no runtime do Tempo Pelotas.

## Produtos documentados pelo INMET

A página oficial do INMET sobre produtos de imagens de satélite descreve quatro famílias:

- Infravermelho termal;
- Vapor d'água;
- Canal visível;
- Topo de nuvens.

Referência oficial: https://portal.inmet.gov.br/servicos/produtos-de-imagens-de-sat%C3%A9lite
Portal oficial de imagens: https://satelite.inmet.gov.br/

O INMET informa atualização diária a cada 15 minutos para esse serviço.

## Contrato técnico do Tempo Pelotas

O adaptador `src/lib/weather/inmet-satellite.server.ts` trabalha com:

- satélite: `GOES`;
- área: `S` (Região Sul);
- produto: `IV`;
- apresentação pública: `GOES — infravermelho`;
- provedor: `INMET`.

O produto usa o proxy sanitizado em `/api/redemet/image`, que valida tokens, host, resposta HTTP, tipo real de imagem, tamanho máximo e não expõe credenciais.

A camada INMET permanece separada dos produtos REDEMET (`realcada`, `ir`, `vis`). Para `realcada` e `ir`, o INMET pode atuar como contingência oficial quando a REDEMET não entrega uma camada utilizável. O canal visível nunca recebe fallback infravermelho.

## Revisão de 28/08/2026 — 403 não significa INMET fora do ar

Um caso real no domínio mostrou `INMET Satélite respondeu com HTTP 403` enquanto outros produtos meteorológicos continuavam operando. A mensagem anterior induzia uma interpretação incorreta: um HTTP 403 recebido pela integração server-side significa que **aquela requisição do Tempo Pelotas foi recusada**, não que o portal público do INMET esteja necessariamente indisponível.

A revisão identificou e corrigiu três pontos:

1. as requisições à `apisat.inmet.gov.br` passam a reproduzir o contexto HTTP esperado pelo portal público, com `Referer`, `Origin`, idiomas e perfil de navegador; em 403 há uma única tentativa controlada sem `Origin`;
2. erros de integração agora são descritos como falha/recusa da integração, sem declarar indisponibilidade global do INMET;
3. o endpoint de imagem do INMET pode responder JSON com a imagem no campo `base64`; o proxy agora aceita esse contrato, decodifica o conteúdo, valida a assinatura binária real e só então entrega a imagem ao navegador.

Esse terceiro ponto é especialmente importante: o proxy anterior esperava apenas bytes de imagem. Portanto uma resposta válida em JSON/base64 podia ser classificada como imagem indisponível mesmo com dado utilizável na origem.

## Relação com REDEMET

A mesma revisão encontrou assimetria no satélite REDEMET: Radar e STSC já autenticavam pela query `api_key`, enquanto o cliente genérico de satélite ainda dependia de `X-Api-Key`. O novo adaptador de satélite usa o mesmo contrato de autenticação server-side por `api_key`, sem expor a credencial ao navegador ou aos logs.

O overview de Radar/Satélite também deixou de chamar o cliente genérico antigo e passou a usar os adaptadores resilientes atuais. REDEMET e INMET são consultados separadamente; a seleção da contingência ocorre depois, preservando provedor, produto e origem.

## Estado de validação

As correções estão versionadas em `main`, mas ainda precisam ser confirmadas no runtime publicado. Até essa validação:

- um 403 do adaptador deve ser tratado como diagnóstico da integração, não como prova de indisponibilidade pública do INMET;
- ausência de frames REDEMET pode resultar de autenticação, parsing, timeout ou payload sem imagem utilizável;
- nenhuma dessas condições deve ser convertida em “fonte fora” sem evidência externa independente.

## Produtos ainda não habilitados

Vapor d'água e Topo de nuvens são produtos oficiais documentados pelo INMET, mas este checkpoint não encontrou documentação pública suficiente para afirmar os identificadores técnicos esperados pela `apisat.inmet.gov.br`.

Portanto:

- não inferir nem inventar códigos de produto;
- não expor botões de Vapor d'água ou Topo de nuvens até validar as chamadas reais da API;
- não reutilizar `IV` com outro rótulo;
- não tratar nomes editoriais como se fossem códigos de endpoint.

## Próxima validação

1. confirmar em produção a consulta de datas e horários de `GOES/S/IV`;
2. confirmar pelo proxy uma imagem JSON/base64 real do INMET;
3. validar uma camada `realcada` REDEMET autenticada por `api_key`;
4. confirmar contingência REDEMET → INMET sem alterar semântica do produto;
5. observar timestamps, bounds e last-good durante uma falha transitória;
6. executar os contratos automatizados assim que os runners voltarem a executar steps normalmente.
