# Recuperação do typecheck — 26/08/2026

Status: correção em andamento

Este registro delimita a rodada de recuperação de TypeScript/build antes da próxima frente SEO.

Escopo identificado:

- navegação tipada para `/conta`, cuja rota possui search validado;
- fontes passadas ao `SiteFooter` pelos shells editoriais/de dados;
- `attributionControl` do MapLibre na Central Regional;
- leitura do estado consolidado de readiness na promoção de cidades candidatas;
- navegação tipada do `home-editorial-header` e componentes que ainda propagam destinos como `string`;
- compatibilidade entre conteúdo editorial local e os destinos internos registrados;
- contratos de regressão afetados pelas correções.

Regras desta rodada:

- não usar `any` ou casts para esconder erros de TypeScript;
- preservar a semântica atual de rotas e fontes;
- não alterar `src/routeTree.gen.ts` manualmente;
- não criar páginas, fontes ou funcionalidades novas;
- não avançar para a próxima rodada SEO enquanto os erros conhecidos deste conjunto não estiverem corrigidos;
- a validação em GitHub Actions continua sujeita à falha de infraestrutura observada antes da execução dos steps; não confundir esse problema externo com resultado do typecheck.
