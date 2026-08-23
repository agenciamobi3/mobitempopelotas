# Footer editorial público — arquitetura consolidada

Checkpoint: 23/08/2026

## Objetivo

O footer do Tempo Pelotas é uma única superfície pública compartilhada pela Home, páginas meteorológicas, páginas regionais e páginas institucionais. Ele complementa o megamenu do header sem repetir sua densidade.

Não existe mais uma variante alternativa de footer por assunto. `src/components/layout/Footer.tsx` é a fonte de conteúdo e estrutura; `src/production/components/site-footer-home.css` é a fonte visual principal dessa superfície.

## Hierarquia pública

O diretório editorial é condensado em quatro grupos:

- **Previsão** — Hoje, Amanhã, 7 dias, Meteograma, Chuva e Vento;
- **Monitoramento** — Radar e satélite, Estação Embrapa, Câmeras, Geadas e Avisos oficiais;
- **Águas** — Situação das águas, nível no Laranjal e Enchente de 2024;
- **Região e contexto** — Tempo na Zona Sul, Clima de Pelotas, Histórico climático e Blog.

Metodologia, status dos dados, privacidade e feed permanecem em uma camada própria de transparência, sem competir com os destinos meteorológicos principais.

## Proveniência

As fontes são apresentadas por domínio para evitar uma linha técnica extensa e pouco legível:

- **Previsão e observação** — Embrapa Clima Temperado, INMET, CPPMet/UFPel, Open-Meteo e MET Norway;
- **Monitoramento** — REDEMET/DECEA e SIMAGRO RS;
- **Águas** — Defesa Civil RS, Casa Militar RS, MKS/Qualle Control, LabHidroSens/UFPel, MetSul, TideSat Global, Nível Guaíba, Rede Lagoa dos Patos, FURG e Portos RS.

Os destinos externos usados nessa camada ficam centralizados em `src/lib/public-source-links.ts`. Cada fornecedor possui nome público, URL HTTPS e `aria-label` próprio. O footer renderiza esses nomes como links editoriais normais para a fonte ou instituição original, em nova aba, com `noopener noreferrer` e **sem** `nofollow` ou `sponsored` por padrão.

O texto âncora deve permanecer institucional e legível, sem inserção artificial de palavras-chave. O objetivo é transparência, navegação e rastreabilidade de origem; não manipulação de ranking.

Fontes compostas são separadas quando representam participantes diferentes. Exemplo: Defesa Civil RS, Casa Militar RS e MKS/Qualle Control possuem links independentes; o mesmo ocorre com MetSul e TideSat Global. A Rede de Monitoramento do Nível da Lagoa dos Patos também aparece como portal de dados próprio, além das referências institucionais FURG e Portos RS.

Essa lista é informativa. Ela não transforma todas as fontes em equivalentes nem altera as regras específicas de atribuição, semântica, disponibilidade ou governança documentadas nos subsistemas correspondentes.

## Utilidade pública

`EmergencyFooterStrip` aparece uma única vez imediatamente antes do footer e mantém:

- 190 — Brigada Militar;
- 192 — SAMU;
- 193 — Bombeiros;
- portal oficial da Defesa Civil RS;
- orientação para cadastro gratuito de CEP por SMS no número 40199.

A faixa preserva as cores de referência da Defesa Civil RS (`#00167b` e `#ef6213`) e possui comportamento responsivo, foco visível, `prefers-reduced-motion` e `forced-colors`.

## Responsividade

- desktop amplo: quatro colunas de navegação e três colunas de proveniência;
- abaixo de 1100 px: diretório em duas colunas;
- abaixo de 920 px: topo e transparência empilhados;
- abaixo de 720 px: navegação e proveniência em uma coluna, com alvos adequados para toque.

Os links das fontes mantêm sublinhado discreto no estado normal, reforço de cor/sublinhado em hover ou foco e contraste explícito em `forced-colors`.

## Contratos

A arquitetura é protegida por:

- `tests/footer-editorial-navigation.test.ts`;
- `tests/footer-public-service.test.ts`;
- `tests/global-shell-consistency.test.ts`;
- workflow `.github/workflows/quality.yml`.

O contrato do footer exige HTTPS para todas as URLs declaradas, `aria-label` informando abertura em nova aba, ausência de `nofollow`/`sponsored` no bloco editorial e preservação dos fallbacks de foco/contraste.

A árvore de rotas versionada continua sendo gerada exclusivamente por `scripts/generate-route-tree.mjs`; o output automático padrão do TanStack Router não deve substituir o arquivo canônico do repositório.
