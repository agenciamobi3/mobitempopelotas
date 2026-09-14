# Identidade Tempo Pelotas

- `tempo-pelotas-primary.svg`: assinatura principal em ciano.
- `tempo-pelotas-purple.svg`: variação institucional em roxo.
- `tempo-pelotas-header.svg`: alias compatível da versão principal usado pelo portal.
- `tempo-pelotas-icon.svg`: **único ícone canônico** do site e do app PWA. É o desenho enviado no commit `e87eb5bc2d83aa1ee9cf5cfd58bd7fae1c1a856a` e deve ser usado como favicon, ícone do navegador, Apple touch icon, ícone de instalação, tela offline e notificações.
- `tempo-pelotas-social.png`: imagem raster 1200×630 para Open Graph e Twitter.

As assinaturas vetoriais preservam fundo transparente. A assinatura ciano é a aplicação padrão nos cabeçalhos e rodapés; a imagem social é dedicada ao compartilhamento e não substitui o logotipo institucional.

Não criar variantes concorrentes de favicon/PWA. O navegador e o manifest apontam diretamente para `tempo-pelotas-icon.svg`; endpoints PNG legados apenas redirecionam para esse arquivo para preservar compatibilidade com instalações antigas.
