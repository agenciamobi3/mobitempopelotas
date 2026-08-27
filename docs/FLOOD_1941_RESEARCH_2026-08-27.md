# Enchente de 1941 em Pelotas — base documental

Data: 27/08/2026  
Status: pesquisa suficiente para publicação editorial controlada  
Rota associada: `/enchente-1941-pelotas`

## Objetivo

Registrar as fontes e os limites factuais usados na página histórica da enchente de 1941 em Pelotas. A rota deve responder à intenção `enchente de 1941 em Pelotas` sem transformar memória histórica em telemetria moderna, sem transferir cotas entre estações e sem ampliar territorialmente afirmações que as fontes não sustentam.

## Fontes principais

### UCPel — acervo Nelson Nobre Magalhães + pesquisa UFPel

Fonte: https://ucpel.edu.br/noticias/acervo-fotografico-mantido-pela-ucpel-e-usado-em-estudo-para-monitoramento-do-nivel-da-lagoa-dos-patos-e-canal-sao-goncalo

Fatos utilizados:

- o Museu da UCPel preserva 61 registros fotográficos em preto e branco da enchente de 1941;
- o material pertence ao acervo Nelson Nobre Magalhães;
- pesquisadores da UFPel utilizaram fotografia da Praça do Porto, com o prédio da Alfândega como referência física, para reconstruir o maior nível associado ao São Gonçalo em 1941;
- depois da aplicação do modelo de cálculo, foi localizado um mapa de 1940 no qual constava a marca histórica de 2,88 m;
- fotografias dos dias 17 e 18 de maio mostram vários pontos da cidade ainda alagados;
- há registros de ruas inundadas no fim de maio e início de junho;
- o material foi usado em 2024 para apoiar a amarração de réguas e modelagem da lâmina d'água.

### Prefeitura de Pelotas — 12/05/2024

Fonte: https://www.pelotas.rs.gov.br/noticia/canal-sao-goncalo-atinge-cota-historica-de-1941

Fatos utilizados:

- a Prefeitura tratou 2,88 m como a cota histórica de referência da enchente de 1941 no Canal São Gonçalo;
- em 12/05/2024, às 19h, a régua do Porto chegou novamente a 2,88 m.

### Prefeitura de Pelotas — 15/05/2024

Fonte: https://www.pelotas.rs.gov.br/noticia/paula-reforca-saida-da-populacao-em-areas-de-risco

Fatos utilizados:

- em 15/05/2024, às 21h, o canal chegou a 2,89 m;
- essa leitura foi apresentada pelo Município como superação da referência histórica de 1941.

### UFPel / SIIEPE 2025

Fonte: https://anais-siiepe.ufpel.edu.br/2025/MD_05091.pdf

Fatos utilizados:

- trabalho acadêmico realizou levantamento documental dos eventos de inundação de 1941 em Pelotas;
- registros fotográficos da UCPel foram georreferenciados em mapa colaborativo;
- o estudo reforça o valor da integração entre documentação histórica e tecnologias de mapeamento para gestão de riscos.

## Decisões editoriais

### URL

Canonical: `/enchente-1941-pelotas`.

Não usar `/enchente-1941-pelotas-laranjal` como canonical. As fontes fortes levantadas sustentam Pelotas, Praça do Porto e Canal São Gonçalo. Elas não dão base suficiente para transformar `Laranjal` em elemento central do slug de 1941.

### Marca de 2,88 m

Pode ser exibida como **referência histórica associada ao Canal São Gonçalo**, com explicação de como foi reconstruída e validada documentalmente.

Não afirmar que 2,88 m é:

- cota geral de toda Pelotas;
- cota da Estação Laranjal;
- cota da Lagoa dos Patos em qualquer ponto;
- cota do Guaíba;
- limiar automático de inundação para qualquer estação atual.

### Duração

Pode-se afirmar que o evento persistiu por semanas porque o acervo documenta áreas alagadas em 17–18 de maio e ainda no fim de maio/início de junho.

Evitar inventar uma data exata de início ou encerramento enquanto não houver documento primário específico para esses marcos.

### Comparação 1941 x 2024

É permitida quando:

- a referência usada estiver identificada;
- 2,88 m for tratada como marca histórica associada ao São Gonçalo;
- 2024 for descrito com as leituras oficiais correspondentes;
- não houver simples subtração entre réguas ou estações distintas.

## Fotografias históricas

As imagens encontradas na pesquisa permanecem como fontes documentais externas. Não incorporar fotografias de terceiros ao repositório ou à página sem confirmar direito/licença de uso e crédito adequado.

O conteúdo da rota é textual e cita as páginas originais das instituições.

## Gate atendido

A página possui:

1. intenção distinta;
2. fontes institucionais e acadêmicas identificadas;
3. primeira dobra útil;
4. canonical própria;
5. comparação 1941 x 2024 com referência explícita;
6. links para monitoramento atual;
7. teste de contrato específico;
8. nenhuma fonte nova de runtime, migration, secret ou coletor.

Próxima validação: build/typecheck/testes, render mobile e confirmação da URL no domínio publicado/sitemap após sincronização.
