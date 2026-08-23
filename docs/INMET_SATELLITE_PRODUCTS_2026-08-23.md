# INMET / GOES — produtos de satélite e estado de integração

Checkpoint: 23/08/2026.

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

## Estado técnico validado no Tempo Pelotas

O adaptador `src/lib/weather/inmet-satellite.server.ts` possui hoje contrato técnico validado para:

- satélite: `GOES`;
- área: `S` (Região Sul);
- produto: `IV`;
- apresentação pública: `GOES — infravermelho`;
- provedor: `INMET`.

Esse produto usa o proxy sanitizado já existente em `/api/redemet/image`, que valida tokens, resposta HTTP, tipo de conteúdo, tamanho da imagem e não expõe credenciais.

A Home passa a oferecer `GOES / INMET` como fonte adicional no seletor de Satélite, sem substituir nem renomear os três produtos REDEMET já validados (`realcada`, `ir`, `vis`).

## Produtos ainda não habilitados

Vapor d'água e Topo de nuvens são produtos oficiais documentados pelo INMET, mas este checkpoint não encontrou documentação pública suficiente para afirmar os identificadores técnicos esperados pela `apisat.inmet.gov.br`.

Portanto:

- não inferir nem inventar códigos de produto;
- não expor botões de Vapor d'água ou Topo de nuvens até validar as chamadas reais da API;
- não reutilizar `IV` com outro rótulo;
- não tratar nomes editoriais como se fossem códigos de endpoint.

## Próxima validação

Para habilitar uma nova camada INMET:

1. obter o identificador técnico por documentação oficial ou por requisição real observada no portal oficial;
2. confirmar que `datas/GOES/S/<produto>` retorna datas utilizáveis;
3. confirmar que `horas/GOES/S/<produto>/<data>` retorna horários utilizáveis;
4. validar a URL de imagem, conteúdo e comportamento do proxy;
5. confirmar o enquadramento espacial da imagem antes de sobrepor o raster ao MapLibre;
6. adicionar contrato automatizado e somente então expor a opção na interface.

Até essa validação, `IV` é o único produto INMET/GOES considerado integrado no monitor regional da Home.
