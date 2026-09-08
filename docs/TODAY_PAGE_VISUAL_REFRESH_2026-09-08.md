# Tempo Hoje — renovação editorial de 08/09/2026

## Escopo

A rota pública `/tempo-hoje-pelotas` foi migrada do antigo hero retail fotográfico para um hero editorial próprio, mantendo a separação semântica entre observação atual e previsão.

A mudança é visual e estrutural. Ela não autoriza transformar previsão em medição, preencher lacunas com números demonstrativos ou alterar a proveniência dos dados.

## Contrato do hero

O componente continua sendo `TodayRetailHero.tsx` por compatibilidade nominal, mas sua composição atual não é mais a antiga composição retail.

O hero atual:

- não usa fotografia;
- não usa painel roxo de condição;
- não usa mosaico de tiles;
- não possui CTAs promocionais na primeira dobra;
- usa `TodayEditorialHero.css` como folha visual exclusiva;
- usa o mesmo rail da Home: até 1440 px com gutter desktop de 48 px, rail compacto de 1180 px e gutter móvel de 20 px;
- mantém fundo editorial claro em largura total enquanto o conteúdo permanece contido no rail.

A antiga pilha `TodayRetailHero.css`, `TodayRetailHeroPhoto.css`, `TodayRetailHeroRefinement.css` e `today-retail-hero-backgrounds.ts` foi aposentada após Chuva e Vento também deixarem de depender dela.

## Observação atual x próxima hora

A primeira dobra possui dois estados distintos.

### Medição atual disponível

Só é tratada como observação quando:

- `current.available` é verdadeiro; e
- `current.source.kind === "observation"`.

Nesse estado, temperatura, condição, sensação, umidade e vento do hero pertencem à leitura atual. A fonte e o horário observado continuam identificados.

### Medição atual indisponível

A previsão horária não é convertida em um falso “agora”. Se existir próxima hora, ela é apresentada explicitamente como `Previsão da próxima hora` e a copy informa que ela não substitui uma observação atual.

Se nem observação nem previsão horária estiverem disponíveis, a primeira dobra permanece em estado de atualização e não recebe valores demonstrativos.

## Corpo da página

Os principais capítulos foram abertos visualmente para reduzir a sensação de dashboard:

- previsão por hora;
- planejamento das próximas horas;
- condição atual;
- sinais atmosféricos;
- resumo prático;
- bloco final de interpretação/FAQ.

Cards permanecem somente onde a comparação de vários valores realmente precisa de uma superfície própria, como períodos horários e camadas de nuvens.

A navegação de capítulos foi reduzida para uma faixa editorial leve.

## Proveniência

A página mantém a Rede de Monitoramento Hidrometeorológico da Defesa Civil RS como origem da observação atual quando o dado cumpre o contrato de publicação.

A referência antiga à medição operacional da Embrapa foi removida também do contexto estruturado/SEO da rota. O histórico da Embrapa permanece histórico e não volta a ser anunciado como fonte atual.

## Responsividade e acessibilidade

O hero dedicado possui breakpoints próprios em 1240 px, 1100 px e 720 px, além de suporte a `forced-colors`.

No mobile, os três fatos passam para uma única coluna com divisórias, sem recriar cartões empilhados.

## Validação

Os contratos de fonte protegem:

- separação observação x previsão da próxima hora;
- rail próprio do hero;
- ausência da antiga pilha fotográfica;
- ausência de tiles/CTAs antigos;
- proveniência da Defesa Civil RS;
- corpo editorial aberto.

A validação pixel a pixel no domínio canônico continua sendo uma prova separada da presença do código na `main` e da absorção pelo deploy.

O GitHub Actions continua sujeito ao defeito externo de runner que pode encerrar a workflow antes de executar qualquer step. Quando isso ocorrer, não considerar testes, build, typecheck ou lint como executados.
