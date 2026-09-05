# Acervo local do hero

A Home do Tempo Pelotas usa fotografias locais de Pelotas como fonte visual primária do hero estático.

## Categorias

- chuva/trovoadas: Praia do Laranjal com chuva;
- nevoeiro/neblina: Pelotas sob nevoeiro;
- céu limpo/sol: Pelotas em condição aberta durante o dia;
- céu aberto/limpo à noite: Praia do Laranjal sob céu noturno aberto;
- sol entre nuvens/parcialmente nublado: dois registros locais, escolhidos pela cobertura de nuvens da hora corrente;
- nublado: vista urbana de Pelotas com céu variável enquanto não houver um registro específico melhor para céu totalmente fechado.

O resolvedor fica em `src/production/lib/hero-photo-presentation.ts`. A condição visual já resolvida é a autoridade para escolher chuva, trovoada, sol e nebulosidade. A narrativa oficial pode complementar a leitura quando não há ícone meteorológico disponível, mas uma menção a chuva futura não pode substituir por foto de chuva um estado atual de `partly-cloudy`.

Para `partly-cloudy`, o acervo possui duas variações. Cobertura de nuvens abaixo de 50% usa `pelotas parcialmente nublado centro.jpg`; a partir de 50% usa `pelotas-parcialmente-nublado.avif`. A divisão usa `cloudCover` da previsão horária, campo preservado tanto no pipeline Open-Meteo quanto no fallback MET Norway. Na ausência desse campo, o resolvedor mantém a variação do Centro como fallback.

A fotografia noturna é usada quando o texto normalizado identifica céu `aberto`/`limpo` associado à noite ou quando o ícone meteorológico resolvido é `moon`. `partly-cloudy-night` continua na categoria de céu variável e não deve ser promovido a céu aberto apenas por ocorrer à noite.

Os ativos ficam em `public/weather/hero/`. O AVIF anterior representa a variação com maior cobertura de nuvens; a fotografia adicional do Centro em JPG representa a variação com menor cobertura. A fotografia `pelotas-laranjal-ceu-aberto-noite.webp` deriva do acervo local enviado para o projeto e é mantida em versão WebP otimizada para uso no hero. Quando a câmera ao vivo da Praia do Laranjal está online, ela mantém prioridade sobre a fotografia estática.

Não usar Wikimedia ou bancos genéricos como fonte principal do hero. Novas imagens devem ser locais, categorizadas no resolvedor e manter crédito verdadeiro.
