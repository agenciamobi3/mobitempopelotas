# SEO regional — conclusão da cobertura editorial municipal

Data: 28/08/2026  
Branch: `main`  
Escopo: refinamento das páginas municipais já indexáveis, sem criar novas URLs.

## Objetivo

Concluir a fase de enriquecimento editorial das páginas de previsão por município sem transformar o diretório regional em um conjunto de doorway pages ou textos parametrizados em massa.

O inventário permanece em **48 URLs indexáveis**: **25 fixas + 23 municipais**. Pelotas continua representada pela Home; nenhuma rota nova foi criada nesta rodada.

## Resultado

Antes desta rodada, 11 municípios tinham perfil editorial local específico. Os 12 restantes ainda utilizavam majoritariamente o texto-base compartilhado.

Agora as **23 páginas municipais indexáveis** possuem perfil editorial próprio, com:

- meta description específica;
- descrição própria do hero;
- título editorial local;
- introdução específica;
- pelo menos quatro fatos/orientações contextuais;
- vínculo com cidades próximas e com o contexto regional já cadastrado.

Os 12 municípios enriquecidos nesta etapa foram:

1. Morro Redondo;
2. Turuçu;
3. Arroio do Padre;
4. Pedro Osório;
5. Cerrito;
6. Cristal;
7. Arroio Grande;
8. Herval;
9. Pinheiro Machado;
10. Pedras Altas;
11. Candiota;
12. Aceguá.

Os 11 perfis anteriores permanecem preservados: Rio Grande, São José do Norte, São Lourenço do Sul, Canguçu, Piratini, Capão do Leão, Jaguarão, Santa Vitória do Palmar, Chuí, Bagé e Dom Pedrito.

## Critério editorial

O conteúdo novo usa somente contexto já pertencente ao cadastro regional do projeto, como:

- posição relativa dentro da Zona Sul;
- Costa Doce;
- Fronteira Sul;
- Campanha;
- Serra do Sudeste;
- municípios rurais;
- proximidade com rios já descritos no cadastro;
- relação geográfica com municípios vizinhos.

Não foram criadas afirmações fixas sobre clima típico, recordes, risco, temperatura, chuva ou comportamento meteorológico sem dado atual.

A previsão continua representando as coordenadas cadastradas do município. O texto editorial não converte previsão de modelo em observação local.

## Semântica protegida

Alguns perfis reforçam limites importantes:

- Pedro Osório: previsão de chuva não é medição do rio Piratini;
- Cristal: previsão de chuva não é nível do rio Camaquã;
- cidades próximas continuam consultando coordenadas próprias, sem copiar valores umas das outras;
- vento médio e rajadas permanecem separados;
- chance de chuva e volume previsto permanecem separados;
- aviso oficial do INMET continua separado da previsão numérica;
- previsão de sete dias continua apresentada como tendência que deve ser atualizada conforme a data se aproxima.

## Decisão anti-doorway

A conclusão da cobertura editorial **não** introduz FAQ parametrizado, FAQPage em massa, páginas extras por palavra-chave ou blocos repetidos com simples troca do nome da cidade.

O portal continua com uma URL por município aprovado e uma experiência meteorológica real por coordenadas. A expansão futura do inventário permanece sujeita ao publication gate existente.

## Arquitetura de código

Para evitar inflar ainda mais o catálogo inicial, os 12 novos perfis foram organizados em:

`src/lib/regional-city-editorial-expansion.ts`

O helper existente `src/lib/regional-city-editorial.ts` combina o catálogo anterior com essa expansão. A interface pública para title, description e perfil editorial permanece a mesma para os componentes regionais.

## Dados estruturados e breadcrumb

As páginas municipais já expunham `WebPage` com entidade `Place` e `GeoCoordinates`. Nesta rodada foi acrescentado também um `BreadcrumbList` coerente com a navegação pública:

`Tempo Pelotas → Tempo na Região Sul → Tempo em <município>`

O breadcrumb usa o helper compartilhado `createBreadcrumbListJsonLd` e serialização por `serializeJsonLd`, evitando duplicar lógica de schema e mantendo a trilha ligada às URLs canônicas já existentes.

Nenhum `FAQPage` foi adicionado.

## Contrato automatizado

Foi criado:

`tests/regional-city-editorial-completeness.test.ts`

O teste verifica que:

- existem 23 páginas municipais indexáveis além da Home de Pelotas;
- todas possuem perfil editorial específico;
- cada meta description contém a cidade correspondente;
- hero e introdução possuem conteúdo mínimo útil;
- cada perfil possui pelo menos quatro fatos/orientações;
- introduções e títulos editoriais não são repetidos entre municípios;
- o breadcrumb estruturado mantém a sequência Home → Região → Município;
- a serialização de JSON-LD usa o helper compartilhado;
- FAQ massificado continua ausente da página regional.

O teste foi incluído em `test:contracts`.

## Próxima etapa SEO

Depois desta conclusão, o próximo ganho regional deve vir de dados reais de desempenho — Search Console, descoberta/indexação e CTR — e não de aumentar texto ou abrir cidades indiscriminadamente.

As próximas rodadas devem priorizar:

1. páginas municipais com impressões relevantes e CTR abaixo do potencial;
2. ajuste de title/meta conforme consultas reais;
3. melhoria de links internos entre municípios quando houver relação geográfica clara;
4. expansão de conteúdo somente quando existir contexto realmente específico;
5. nenhuma nova cidade sem publication gate e utilidade real.
