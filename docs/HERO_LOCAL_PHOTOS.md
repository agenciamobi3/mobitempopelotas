# Acervo local do hero

A Home do Tempo Pelotas usa fotografias locais de Pelotas como fonte visual primária do hero estático.

## Categorias

- chuva/trovoadas: Praia do Laranjal com chuva;
- nevoeiro/neblina: Pelotas sob nevoeiro;
- céu limpo/sol: Pelotas em condição aberta durante o dia;
- céu aberto/limpo à noite: Praia do Laranjal sob céu noturno aberto;
- nublado/parcialmente nublado: vista urbana de Pelotas com céu variável.

O resolvedor fica em `src/production/lib/hero-photo-presentation.ts` e cruza a condição observada/narrativa oficial com o ícone meteorológico já resolvido.

A fotografia noturna é usada quando o texto normalizado identifica céu `aberto`/`limpo` associado à noite ou quando o ícone meteorológico resolvido é `moon`. `partly-cloudy-night` continua na categoria de céu variável e não deve ser promovido a céu aberto apenas por ocorrer à noite.

Os ativos otimizados ficam em `public/weather/hero/`. A fotografia de parcialmente nublado usa AVIF para preservar a leitura da paisagem com baixo peso. A fotografia `pelotas-laranjal-ceu-aberto-noite.webp` deriva do acervo local enviado para o projeto e é mantida em versão WebP otimizada para uso no hero. Quando a câmera ao vivo da Praia do Laranjal está online, ela mantém prioridade sobre a fotografia estática.

Não usar Wikimedia ou bancos genéricos como fonte principal do hero. Novas imagens devem ser locais, categorizadas no resolvedor e manter crédito verdadeiro.
