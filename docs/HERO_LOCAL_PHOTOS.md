# Acervo local do hero

A Home do Tempo Pelotas usa fotografias locais de Pelotas como fonte visual primária do hero estático.

## Categorias

- chuva/trovoadas: Praia do Laranjal com chuva;
- nevoeiro/neblina: Pelotas sob nevoeiro;
- céu limpo/sol: Pelotas em condição aberta durante o dia;
- céu aberto/limpo à noite: Praia do Laranjal sob céu noturno aberto;
- sol entre nuvens/parcialmente nublado durante o dia: registros locais rotacionados de forma determinística, preservando a divisão por cobertura de nuvens;
- parcialmente nublado na madrugada: registro local específico disponível para `partly-cloudy-night` entre 00h e 06h59;
- nublado: vista urbana de Pelotas com céu variável enquanto não houver um registro específico melhor para céu totalmente fechado.

O resolvedor fica em `src/production/lib/hero-photo-presentation.ts`. A condição visual já resolvida é a autoridade para escolher chuva, trovoada, sol e nebulosidade. A narrativa oficial pode complementar a leitura quando não há ícone meteorológico disponível, mas uma menção a chuva futura não pode substituir por foto de chuva um estado atual de `partly-cloudy`.

## Rotação de parcialmente nublado

O acervo diurno preserva a regra editorial já validada: cobertura de nuvens abaixo de 50% usa como registro-base `pelotas parcialmente nublado centro.jpg`; a partir de 50% usa como registro-base `pelotas-parcialmente-nublado.avif`. A divisão usa `cloudCover` da previsão horária, campo preservado tanto no pipeline Open-Meteo quanto no fallback MET Norway. Na ausência desse campo, o resolvedor mantém a variação do Centro como base.

A fotografia `pelotas-dia-parcialmente-bulado.png`, adicionada ao acervo em 06/09/2026, entra como variação diurna adicional. A rotação não usa `Math.random()`: o resolvedor usa a hora meteorológica corrente em `America/Sao_Paulo`. Em horas pares, a nova fotografia diurna ocupa o slot visual; em horas ímpares, permanece a fotografia-base definida pela cobertura de nuvens. O `kind` continua refletindo `partly-cloudy-light` ou `partly-cloudy-dense`, mesmo quando o arquivo alternativo é exibido.

Para `partly-cloudy-night`, a fotografia `pelotas-madrugada-parcialmente-nublado.png` entra apenas durante a madrugada, entre 00h e 06h59, também nos slots pares. Nos demais horários noturnos, e nos slots ímpares da madrugada, permanece `pelotas-parcialmente-nublado.avif` como comportamento anterior. Isso evita usar uma imagem explicitamente de madrugada no começo da noite.

A hora é derivada primeiro de `weather.hourly[0].timestamp`, com fallback para `current.updatedAt` e `current.source.observedAt`. Timestamps sem timezone explícito são tratados como hora local fornecida pelo pipeline; timestamps com timezone ou UTC são convertidos para `America/Sao_Paulo`. Essa escolha mantém SSR e hidratação determinísticos e evita troca aleatória de fotografia no mesmo estado meteorológico.

A fotografia noturna de céu aberto continua sendo usada quando o texto normalizado identifica céu `aberto`/`limpo` associado à noite ou quando o ícone meteorológico resolvido é `moon`. `partly-cloudy-night` permanece na categoria de céu variável e não deve ser promovido a céu aberto apenas por ocorrer à noite.

Os ativos ficam em `public/weather/hero/`. O AVIF anterior representa a variação historicamente usada para maior cobertura de nuvens; a fotografia adicional do Centro em JPG representa a variação de menor cobertura. As duas novas imagens PNG ampliam a rotação contextual de dia e madrugada. A fotografia `pelotas-laranjal-ceu-aberto-noite.webp` deriva do acervo local enviado para o projeto e é mantida em versão WebP otimizada para uso no hero. Quando a câmera ao vivo da Praia do Laranjal está online, ela mantém prioridade sobre a fotografia estática.

Não usar Wikimedia ou bancos genéricos como fonte principal do hero. Novas imagens devem ser locais, categorizadas no resolvedor e manter crédito verdadeiro.
