# Tempo Pelotas — qualidade executável, acessibilidade e Web Vitals

Data: 27/08/2026  
Branch: `main`  
Escopo: acessibilidade estrutural, teclado, responsividade e métricas de laboratório das páginas públicas.

## 1. Objetivo

Após a rodada de refinamento SEO das 48 URLs indexáveis, a prioridade passa de expansão/copy para **qualidade executável**.

Esta etapa cria um gate reproduzível para detectar regressões visíveis e estruturais antes da publicação, sem adicionar nova dependência de navegador ao `package.json` e sem confundir medições de laboratório com dados reais de usuários.

O inventário público não muda: permanecem **48 URLs indexáveis**, sendo 25 rotas fixas e 23 páginas municipais.

## 2. Baseline de acessibilidade já existente

O projeto já possuía uma fundação relevante:

- skip link para `#conteudo-principal` no header público;
- foco visível para links, botões, campos e elementos focáveis;
- `main#conteudo-principal` nas shells públicas;
- foco transferido ao conteúdo principal após mudança de rota;
- anúncio `aria-live` de página carregada;
- `aria-busy` durante navegação quando aplicável;
- suporte a `prefers-reduced-motion`;
- suporte a `forced-colors` e `prefers-contrast` em superfícies principais;
- megamenus com `aria-expanded`, `aria-controls` e painéis identificados;
- menu móvel com o mesmo contrato de expansão/controle;
- imagens editoriais com política explícita de `alt`.

O problema desta fase não era ausência total de acessibilidade, mas **falta de um gate de navegador reproduzível dentro do pipeline atual**.

## 3. Correção de foco no header

Foi corrigido um caso concreto de navegação por teclado.

Antes:

1. o usuário abria um megamenu ou menu móvel;
2. movia o foco para um link dentro do painel;
3. pressionava `Escape`;
4. o painel era ocultado;
5. o elemento focado podia permanecer dentro do conteúdo que acabara de receber `hidden`.

Agora `SiteHeader` possui um guard de foco que, ao detectar `Escape` com o foco dentro de `#tp-mobile-menu` ou de um painel `tp-mega-*`, localiza o controle correspondente por `aria-controls` e devolve o foco a ele no próximo frame.

O fechamento do painel continua pertencendo ao `HomeEditorialHeader`; o guard não cria uma segunda fonte de estado.

Contrato estático associado:

- `tests/header-keyboard-accessibility.test.ts`.

## 4. Novo Browser Quality Smoke

Arquivo principal:

- `scripts/browser-quality-smoke.mjs`.

Compatibilidade com o nome histórico:

- `scripts/accessibility-editorial-smoke.mjs` agora importa o smoke principal em vez de manter uma implementação Playwright separada.

Comandos:

```bash
npm run quality:browser
npm run quality:a11y
```

Ambos usam a mesma fonte de verdade.

### 4.1. Sem dependência npm de navegador

O smoke usa:

- Node.js 24;
- `fetch` e `WebSocket` nativos;
- Chrome DevTools Protocol;
- Chrome/Chromium instalado no ambiente.

A descoberta do navegador aceita:

- `CHROME_PATH`;
- `google-chrome-stable`;
- `google-chrome`;
- `chromium`;
- `chromium-browser`.

Isso remove a inconsistência anterior em que o script histórico importava `playwright` sem Playwright estar declarado no projeto.

## 5. Cobertura inicial

O gate usa nove rotas representativas:

1. `/`;
2. `/tempo-hoje-pelotas`;
3. `/previsao-15-dias-pelotas`;
4. `/radar-e-satelite-pelotas`;
5. `/nivel-da-lagoa-dos-patos-laranjal`;
6. `/nivel-do-guaiba`;
7. `/tempo-na-regiao-sul-rs`;
8. `/status-dos-dados`;
9. `/privacidade-e-dados`.

Cada rota é avaliada em três larguras:

- 320 × 720 — mobile estreito;
- 768 × 1024 — tablet/intermediário;
- 1280 × 900 — desktop.

Total inicial: **27 verificações de página/viewport**, além do teste de interação do header na Home.

A escolha busca representar:

- Home complexa;
- forecast curto e estendido;
- mapa/radar;
- hidrologia local e regional;
- diretório regional;
- página operacional de status;
- página institucional/editorial.

A cobertura pode crescer por risco, não por simples contagem de URLs.

## 6. Falhas bloqueantes

O smoke falha quando encontra, entre outros:

- documento sem idioma português;
- `title` ausente;
- quantidade de H1 visíveis diferente de 1;
- quantidade de landmarks `<main>` diferente de 1;
- skip link que não se torna visível ao receber foco;
- IDs duplicados;
- controles interativos sem nome acessível detectável;
- campos sem rótulo detectável;
- imagens sem atributo `alt`;
- overflow horizontal acima da tolerância mínima;
- menu/mega menu que não abre com estado ARIA coerente;
- `Escape` que não fecha o painel;
- `Escape` que não devolve o foco ao controle de origem.

Esses itens são tratados como regressões estruturais e não como mera recomendação estética.

## 7. Responsividade

A primeira proteção automatizada usa largura real do documento para detectar overflow horizontal em 320, 768 e 1280 px.

Isso não substitui inspeção visual. A auditoria manual posterior deve conferir também:

- zoom/reflow equivalente a 400%;
- sobreposição de elementos fixos/sticky;
- conteúdo cortado;
- tabelas e gráficos largos;
- menus e diálogos;
- orientação e diferentes proporções de tela;
- tamanho e espaçamento de alvos interativos;
- legibilidade sem depender de hover.

## 8. Web Vitals de laboratório

O smoke registra, quando o navegador expõe as entradas:

- TTFB;
- FCP;
- LCP;
- CLS.

Nesta primeira etapa, os limiares de referência geram **avisos**, não bloqueio:

- LCP > 2,5 s;
- CLS > 0,1;
- TTFB > 800 ms.

O modo estrito pode ser ativado por:

```bash
QUALITY_PERF_STRICT=true npm run quality:browser
```

No modo estrito, o baseline inicial bloqueia pelo menos:

- LCP > 4 s;
- CLS > 0,25.

A intenção é coletar primeiro um baseline reproduzível antes de transformar variações de laboratório em gate rígido.

### Regra metodológica

**LCP/CLS/TTFB deste smoke são métricas de laboratório. Não são CrUX, não são Core Web Vitals de campo e não devem ser descritos como experiência real de todos os visitantes.**

A validação de campo deve usar dados reais quando houver volume suficiente, preferencialmente Search Console/CrUX ou telemetria RUM explicitamente aprovada.

## 9. CI

O workflow `.github/workflows/quality.yml` passou a prever, após build/typecheck/lint:

1. início de `vite preview` em `127.0.0.1:4173`;
2. espera ativa pela Home;
3. execução do Browser Quality Smoke;
4. upload do relatório mesmo em caso de falha;
5. encerramento do preview.

Artefatos:

- `artifacts/browser-quality/report.json`;
- `artifacts/browser-quality/README.md`.

O artefato do GitHub Actions fica retido por 14 dias no contrato atual.

## 10. Estado de execução

A implementação está versionada, mas **não há resultado de CI aprovado nesta documentação**.

Os runners do workflow `Qualidade` continuam sendo uma pendência de infraestrutura registrada no projeto. Enquanto eles não iniciarem normalmente, a presença do gate no YAML não significa que o smoke foi executado pelo GitHub.

Também não se deve usar a tentativa no ambiente interno desta sessão como aprovação: o navegador local disponível ali bloqueou navegação por política administrativa do ambiente. Essa limitação é externa ao projeto e não produz um resultado válido de aprovação ou reprovação do portal.

## 11. Performance: decisões desta rodada

Foram revisadas algumas áreas de maior peso:

- a Home já carrega hidrologia de forma diferida com `Suspense/Await`;
- a câmera ao vivo da Home é aprimoramento progressivo e não bloqueia o forecast principal;
- o mapa de radar importa `maplibre-gl` dinamicamente no cliente;
- a área do mapa de radar reserva altura por breakpoint, reduzindo risco de layout shift;
- imagens gráficas do SIMAGRO usam `loading="lazy"` e `decoding="async"`.

Não foi inventado `width/height` ou aspect ratio para produtos externos do SIMAGRO sem confirmação das dimensões de origem. O novo CLS de laboratório deve ajudar a decidir se essa superfície realmente precisa de reserva adicional antes de aplicar um valor arbitrário.

## 12. O que ainda exige auditoria manual

Automação não fecha WCAG 2.2 AA sozinha. Continuam necessários testes manuais de, no mínimo:

- navegação 100% por teclado;
- ordem de foco e foco visível;
- leitor de tela em fluxos principais;
- nomes, estados e descrições de controles complexos;
- contraste de texto, ícones e estados;
- zoom/reflow 400%;
- orientação/redução de viewport;
- conteúdo ao passar mouse versus foco;
- alvos de toque;
- mensagens de erro e formulários;
- conteúdo dinâmico anunciado;
- mapas, gráficos e alternativas textuais;
- comportamento em reduced motion/forced colors;
- responsividade real em dispositivos móveis.

## 13. Próxima ordem de trabalho

1. restaurar o runner e obter o primeiro relatório real do Browser Quality Smoke;
2. corrigir regressões estruturais encontradas;
3. capturar baseline de LCP/CLS/TTFB por rota e viewport;
4. atacar os maiores custos mensuráveis de carregamento/renderização;
5. executar auditoria manual WCAG 2.2 AA nas rotas críticas;
6. medir Core Web Vitals de campo quando houver fonte confiável e volume suficiente;
7. somente depois promover thresholds de performance de aviso para gate bloqueante.

## Decisão

**A fase de qualidade passa a ter um gate de navegador versionado e reproduzível, mas ainda não é declarada aprovada enquanto a infraestrutura de CI não executar o contrato e a auditoria manual não estiver concluída.**
