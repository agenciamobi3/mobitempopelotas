# Tempo Pelotas — refinamento e enriquecimento SEO

Data: 27/08/2026  
Branch: `main`  
Escopo: enriquecimento das URLs existentes, sem expansão artificial do sitemap.

## Objetivo

Esta rodada consolida a fase posterior à criação das páginas de 15 dias, Guaíba e Enchente de 1941. O foco deixa de ser abrir novas URLs e passa a ser aumentar utilidade, cobertura semântica, clareza editorial e conectividade interna das páginas que já possuem intenção própria.

O inventário permanece em **48 URLs indexáveis**, sendo **25 rotas fixas e 23 páginas municipais**. Nenhuma URL nova foi criada nesta rodada.

## 1. Home x Hoje

A Home assume de forma explícita a intenção de condição imediata:

- `tempo agora em Pelotas`;
- `temperatura atual em Pelotas`;
- `sensação térmica em Pelotas`.

A rota `/tempo-hoje-pelotas` permanece responsável pela intenção de planejamento dentro do dia:

- tempo hoje;
- previsão por hora;
- temperatura e sensação;
- chuva, volume, vento e avisos ao longo do dia.

A malha interna conecta:

`Home → Hoje → Amanhã → 7 dias → 15 dias`.

A separação evita que Home e Hoje tentem responder exatamente ao mesmo conjunto de termos com páginas quase equivalentes.

## 2. Chuva

`/chuva-em-pelotas` foi enriquecida para responder de forma visível a intenções complementares sem fabricar dado fixo:

- `Vai chover hoje em Pelotas?`;
- `Quanto choveu hoje em Pelotas?`;
- chance de chuva;
- volume previsto;
- chuva observada;
- relação entre chuva forte e acompanhamento hidrológico.

A semântica permanece protegida:

- chuva observada e chuva prevista são blocos diferentes;
- o acumulado observado não é somado automaticamente ao previsto, porque as janelas podem se sobrepor;
- acumulado regional pertence à estação identificada;
- chuva forte isolada não vira diagnóstico automático de elevação da Lagoa ou de inundação.

A navegação passa a conectar:

`Chuva → Radar → Situação das Águas → Laranjal → Alertas`.

## 3. Cluster hidrológico e histórico

O cluster foi reforçado sem alterar coletores ou referências:

`Laranjal ↔ Situação das Águas ↔ Guaíba ↔ Enchente de 1941 ↔ Enchente de 2024`.

Regras mantidas:

- Cais Mauá e Gasômetro continuam réguas próprias;
- a Estação Laranjal mantém sua referência local;
- a marca histórica de 2,88 m associada ao Canal São Gonçalo em 1941 não é transferida para Laranjal ou Guaíba;
- níveis atuais não são comparados diretamente com marcas históricas sem referência compatível;
- leitura do Guaíba não é convertida automaticamente em risco para Pelotas;
- leitura atrasada continua identificada como atrasada.

A página do Guaíba passou a apontar também para o registro histórico de 1941, além de 2024 e das páginas operacionais atuais.

## 4. Páginas regionais

O inventário municipal não foi expandido. O trabalho ocorreu dentro das páginas já aprovadas.

Agora **11 municípios possuem perfil editorial local específico**:

1. Rio Grande;
2. São José do Norte;
3. São Lourenço do Sul;
4. Canguçu;
5. Morro Redondo;
6. Capão do Leão;
7. Jaguarão;
8. Santa Vitória do Palmar;
9. Chuí;
10. Bagé;
11. Dom Pedrito.

Os perfis específicos tratam características geográficas e de uso da previsão que já pertencem ao cadastro editorial do projeto, sem transformar modelo numérico em observação local.

Todas as páginas municipais públicas passam a apresentar:

- FAQ local visível;
- `FAQPage` coerente com o FAQ visível;
- `BreadcrumbList`;
- entidade `Place` com `GeoCoordinates` no JSON-LD;
- contexto explícito de que a previsão representa as coordenadas cadastradas;
- links geográficos para cidades próximas.

Municípios sem perfil específico usam FAQ editorial padrão parametrizada pelo nome da cidade. O conteúdo não afirma clima observado, microclima ou fenômeno local sem fonte.

## 5. Dados estruturados e entidades

O enriquecimento busca coerência entre conteúdo visível e schema. Não são adicionadas respostas ocultas apenas para motores de busca.

Nas páginas regionais:

- `WebPage` referencia a entidade geográfica da cidade;
- `Place` e `GeoCoordinates` descrevem a localidade cadastrada;
- `BreadcrumbList` representa a hierarquia de navegação;
- `FAQPage` reproduz perguntas e respostas visíveis na interface.

Nas páginas editoriais principais, `about` foi refinado para refletir intenções e entidades efetivamente tratadas pelo conteúdo.

## 6. Testes de contrato

Além dos testes especializados já existentes, foi adicionado:

- `tests/seo-editorial-enrichment.test.ts`.

O contrato protege:

- separação Home/Agora x Hoje/Por hora;
- links Hoje → 7 dias → 15 dias;
- intenção `Vai chover hoje em Pelotas?`;
- conexão de Chuva com hidrologia e Laranjal;
- separação entre chuva observada e prevista;
- cluster Laranjal/Guaíba/1941/2024;
- proibição de transferir referências históricas para réguas atuais;
- presença de FAQ visível e schema correspondente nas páginas regionais;
- existência de pelo menos dez perfis editoriais regionais específicos.

Os contratos foram versionados, mas a suíte completa ainda depende da restauração dos runners do GitHub Actions. Esta documentação **não declara os testes como executados**.

## 7. O que não foi feito

Esta rodada deliberadamente não:

- criou páginas de sexta-feira ou sábado;
- criou previsão de 20/30 dias;
- adicionou municípios ao inventário;
- criou doorway pages;
- alterou Open-Meteo, Embrapa, INMET, REDEMET, SACE, Defesa Civil ou coletores hidrológicos;
- criou migration, Edge Function, secret ou variável de ambiente;
- alterou a árvore de rotas, porque nenhuma rota nova foi criada.

## 8. Gate de Search Console

A indisponibilidade atual do conector de Search Console não impede refinamentos estruturais que melhoram páginas existentes, mas continua bloqueando decisões dependentes de evidência nova de consulta/CTR.

Permanecem condicionadas a nova captura de Search Console:

- decisão final sobre páginas permanentes de sexta-feira/sábado;
- medição de CTR após os novos snippets de Home, Hoje e Chuva;
- priorização quantitativa da próxima rodada por município.

## Decisão

**Continuar refinando as 48 URLs existentes antes de expandir o inventário.**

A próxima rodada deve priorizar conteúdo útil, resposta imediata, entidades, links internos, acessibilidade, Core Web Vitals e sinais reais de Search Console, mantendo a regra de que cada nova URL precisa de intenção, fonte e utilidade próprias.
