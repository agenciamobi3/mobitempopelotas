# Acervo local do hero

A Home do Tempo Pelotas usa fotografias locais de Pelotas como fonte visual primária do hero estático.

## Categorias

- chuva durante o dia: Praia do Laranjal com chuva;
- chuva à noite: registro local `pelotas-noite-chuva.png`;
- tempestade durante o dia: mantém o registro de chuva do acervo anterior enquanto não houver foto diurna específica de tempestade;
- tempestade à noite: registro local `pelotas-noite-tempestade.png`;
- nevoeiro/neblina: Pelotas sob nevoeiro;
- céu limpo/sol: Pelotas em condição aberta durante o dia;
- céu aberto/limpo à noite: Praia do Laranjal sob céu noturno aberto;
- sol entre nuvens/parcialmente nublado durante o dia: registros locais rotacionados de forma determinística, preservando a divisão por cobertura de nuvens;
- parcialmente nublado com poucas nuvens no fim de tarde: registro local específico entre 16h e 18h59;
- parcialmente nublado na madrugada: registro local específico disponível para `partly-cloudy-night` entre 00h e 06h59;
- nublado na madrugada: usa `pelotas-madrugada-parcialmente-nublado.png` entre 00h e 06h59 para não exibir fotografia diurna durante a madrugada;
- nublado no entorno do meio-dia: `pelotas-meio-dia-nublado.png` entre 11h e 14h59;
- nublado nos demais horários: mantém o registro-base anterior.

O resolvedor fica em `src/production/lib/hero-photo-presentation.ts`. A condição visual já resolvida é a autoridade para escolher chuva, trovoada, sol e nebulosidade. A narrativa oficial pode complementar a leitura quando não há ícone meteorológico disponível, mas uma menção a chuva futura não pode substituir por foto de chuva um estado atual de `partly-cloudy`.

## Chuva, tempestade e nublado por horário

Os três arquivos adicionados em 07/09/2026 entram de acordo com o próprio estado e o período que representam:

- `pelotas-noite-chuva.png`, do commit `ddc478159b666f868fe6b81e6694e2baadedb144`, é usado quando a condição resolvida é `rain` e a hora local está entre 19h e 06h59;
- `pelotas-noite-tempestade.png`, do mesmo commit, é usado quando a condição resolvida é `storm` no mesmo período noturno;
- `pelotas-meio-dia-nublado.png`, do commit `3ec47026de6cb2ac5c42247ee9bed96a23c91f9a`, é usado quando a condição resolvida é `cloud` entre 11h e 14h59.

Para `cloud` entre 00h e 06h59, o resolvedor usa `pelotas-madrugada-parcialmente-nublado.png` como fallback visual compatível com o período. O `kind` continua sendo `cloudy`: a fotografia é reaproveitada apenas para evitar a incoerência de mostrar um registro diurno durante a madrugada. O arquivo não é usado para `cloud` entre 19h e 23h59 porque ele é explicitamente identificado como madrugada; essa faixa continua aguardando uma fotografia própria de noite nublada.

Fora dessas faixas, o acervo anterior continua sendo usado. A regra é determinística e não usa `Math.random()`. Isso evita mostrar uma fotografia explicitamente noturna durante o dia ou uma imagem identificada como meio-dia em horários incompatíveis.

Chuva e tempestade permanecem estados distintos no resolvedor, mesmo que durante o dia ambos ainda usem a fotografia de chuva já existente. À noite, cada estado passa a ter sua própria fotografia.

## Rotação de parcialmente nublado

O acervo diurno preserva a regra editorial já validada: cobertura de nuvens abaixo de 50% usa como registro-base `pelotas parcialmente nublado centro.jpg`; a partir de 50% usa como registro-base `pelotas-parcialmente-nublado.avif`. A divisão usa `cloudCover` da previsão horária, campo preservado tanto no pipeline Open-Meteo quanto no fallback MET Norway. Na ausência desse campo, o resolvedor mantém a variação do Centro como base.

A fotografia `pelotas-dia-parcialmente-bulado.png`, adicionada ao acervo em 06/09/2026, e a fotografia `pelotas-laranjal-parcialmente-nublado-sol-entre-nuvens.png`, adicionada em 08/09/2026, entram como variações diurnas adicionais. Fora do fim de tarde, a rotação não usa `Math.random()`: o resolvedor usa a hora meteorológica corrente em `America/Sao_Paulo` e distribui os registros em três slots determinísticos. Quando `hora % 3 === 0`, permanece a fotografia-base definida pela cobertura de nuvens; quando `hora % 3 === 1`, entra `pelotas-dia-parcialmente-bulado.png`; quando `hora % 3 === 2`, entra a nova fotografia da Praia do Laranjal com sol entre nuvens. O `kind` continua refletindo `partly-cloudy-light` ou `partly-cloudy-dense`, independentemente do arquivo alternativo exibido.

A fotografia `pelotas-fim-de-tarde-poucas-nuvens.png`, adicionada no commit `8077d4c75ec0c25026bc55244decc7f77e07f752`, entra somente quando a condição resolvida é `partly-cloudy`, a cobertura informada é menor que 50% e a hora local está entre 16h e 18h59. Nesse intervalo, a sequência contextual já existente continua preservada: às 16h permanece o JPG do Centro, às 17h entra a fotografia específica de fim de tarde e às 18h entra `pelotas-dia-parcialmente-bulado.png`. A nova fotografia do Laranjal não substitui essa faixa especial, porque o registro de fim de tarde tem prioridade editorial. Cobertura igual ou superior a 50% não usa a foto de poucas nuvens, evitando ilustrar um céu mais aberto do que a leitura meteorológica sustenta.

Para `partly-cloudy-night`, a fotografia `pelotas-madrugada-parcialmente-nublado.png` entra apenas durante a madrugada, entre 00h e 06h59, também nos slots pares. Nos demais horários noturnos, e nos slots ímpares da madrugada, permanece `pelotas-parcialmente-nublado.avif` como comportamento anterior. Isso evita usar uma imagem explicitamente de madrugada no começo da noite.

A hora é derivada primeiro de `weather.hourly[0].timestamp`, com fallback para `current.updatedAt` e `current.source.observedAt`. Timestamps sem timezone explícito são tratados como hora local fornecida pelo pipeline; timestamps com timezone ou UTC são convertidos para `America/Sao_Paulo`. Essa escolha mantém SSR e hidratação determinísticos e evita troca aleatória de fotografia no mesmo estado meteorológico.

A fotografia noturna de céu aberto continua sendo usada quando o texto normalizado identifica céu `aberto`/`limpo` associado à noite ou quando o ícone meteorológico resolvido é `moon`. `partly-cloudy-night` permanece na categoria de céu variável e não deve ser promovido a céu aberto apenas por ocorrer à noite.

Os ativos ficam em `public/weather/hero/`. O AVIF anterior representa a variação historicamente usada para maior cobertura de nuvens; a fotografia adicional do Centro em JPG representa a variação de menor cobertura. Os PNGs adicionais ampliam a rotação contextual de dia, meio-dia, fim de tarde, noite e madrugada. A nova fotografia `pelotas-laranjal-parcialmente-nublado-sol-entre-nuvens.png` amplia especificamente a variedade visual de `partly-cloudy` durante o dia sem alterar a classificação meteorológica. A fotografia `pelotas-laranjal-ceu-aberto-noite.webp` deriva do acervo local enviado para o projeto e é mantida em versão WebP otimizada para uso no hero. Quando a câmera ao vivo da Praia do Laranjal está online, ela mantém prioridade sobre a fotografia estática.

Não usar Wikimedia ou bancos genéricos como fonte principal do hero. Novas imagens devem ser locais, categorizadas no resolvedor e manter crédito verdadeiro.
