# /previsao-7-dias-pelotas — atualização visual editorial

Data: 08/09/2026  
Branch: `main`

## Objetivo

A página `/previsao-7-dias-pelotas` foi migrada do sistema visual retail com fotografia, painel escuro, tiles e seções encapsuladas para a linguagem editorial clara adotada nas páginas históricas e na nova página de amanhã.

A mudança é visual e estrutural. Os contratos meteorológicos, SEO, fontes e recuperação de dados permanecem preservados.

## HERO semanal

`SevenDayRetailHero` continua sendo o componente público da primeira dobra, mas foi reescrito.

Contrato atual:

- fundo claro em largura total, com gradientes discretos;
- conteúdo interno no mesmo rail do corpo da página;
- título `Previsão de 7 dias para Pelotas`;
- resumo com a faixa térmica semanal;
- quantidade de dias disponíveis e estado de avisos oficiais como metadados discretos;
- leitura lateral com tendência meteorológica e fonte principal;
- três fatos essenciais em faixa aberta: temperaturas, chuva e rajadas;
- sem fotografia no HERO;
- sem painel meteorológico escuro;
- sem quatro tiles auxiliares;
- sem CTAs que repetem a navegação existente na própria página.

Estados `normal`, `attention` e `warning` continuam alterando a tonalidade do fundo sem transformar a síntese meteorológica em aviso oficial.

Arquivos:

- `src/components/weather/SevenDayRetailHero.tsx`;
- `src/components/weather/SevenDayRetailHero.css`.

## Rail e shell

A rota semanal deixou de herdar a regra genérica do `InternalWeatherPageShell.css` que forçava `.seven-day-retail-hero__inner` a `width: 100%`.

Assim, o rail do HERO possui uma única fonte de verdade no CSS dedicado da página, evitando a mesma disputa de cascade já identificada anteriormente na rota de amanhã.

O aviso oficial do INMET e o corpo usam o mesmo rail público.

## Corpo editorial

A rota importa `SevenDayForecastEditorialRefinement.css` depois da implementação funcional de `SevenDayForecastPageV2`.

O refinamento:

- reduz o índice de capítulos a uma faixa horizontal simples;
- remove números e descrições secundárias do índice apenas visualmente;
- abre as seções `Dia a dia`, `Temperaturas`, `Chuva e vento` e `INMET e UFPel`;
- remove caixa, gradiente, raio e sombra das grandes seções;
- mantém cards apenas para os sete dias, porque cada dia é uma unidade comparável;
- transforma a tendência de temperatura em tabela gráfica aberta;
- transforma os fatos térmicos em faixa com divisórias;
- apresenta chuva/vento e INMET/UFPel como colunas editoriais;
- transforma os links relacionados em uma faixa de navegação simples.

## Ponte para 15 dias

`ForecastHorizonBridge` continua preservando a mensagem de incerteza da segunda semana, mas deixa de usar card com fundo e botão roxo.

A superfície agora é uma faixa aberta com divisória e link textual.

## Responsividade

- HERO passa para uma coluna abaixo de 1100 px;
- fatos do HERO empilham no mobile;
- índice editorial usa rolagem horizontal em telas menores;
- grid de sete dias continua usando os breakpoints já existentes;
- chuva/vento, fontes oficiais, fatos térmicos e links relacionados passam para uma coluna quando necessário;
- `forced-colors` e foco visível continuam contemplados.

## Dados e SEO preservados

A rodada não altera:

- canonical;
- title/description;
- JSON-LD editorial;
- Open-Meteo como fonte principal de previsão;
- contingências existentes;
- INMET e CPPMet/UFPel;
- semântica de `null` e zero de rajadas;
- rankings de chuva e vento;
- empates de maior máxima e menor mínima;
- recuperação pós-hidratação;
- navegação 7 dias → 15 dias.

## Contratos automatizados

`tests/seven-day-retail-visual.test.ts` agora protege:

- HERO sem fotografia/painel retail/tiles antigos;
- rail próprio da rota;
- tendência + três fatos essenciais;
- índice editorial reduzido;
- grandes seções abertas;
- cards preservados somente no dia a dia;
- tabela de temperaturas aberta;
- chuva/vento e fontes oficiais em colunas editoriais;
- manutenção dos contratos de dados, SEO e responsividade.
