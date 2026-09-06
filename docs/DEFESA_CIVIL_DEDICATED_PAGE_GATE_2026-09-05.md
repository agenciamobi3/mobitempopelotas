# Gate editorial para páginas hidrológicas dedicadas da Defesa Civil RS

Data da decisão: 5 de setembro de 2026

## Objetivo

A disponibilidade de uma estação na Rede de Monitoramento Hidrometeorológico da Defesa Civil RS não autoriza, por si só, a criação de uma URL indexável. O Tempo Pelotas primeiro usa a leitura para enriquecer a página meteorológica municipal existente. Uma página hidrológica própria só é publicada quando há intenção de busca autônoma, identidade inequívoca do ponto observado e conteúdo suficiente para responder à consulta sem produzir uma página rasa.

Este gate protege o portal contra canibalização entre previsão do tempo e hidrologia e contra crescimento programático sem utilidade editorial.

## Critérios obrigatórios

Uma estação candidata só pode ganhar página dedicada quando o conjunto abaixo estiver suficientemente atendido:

1. existe uma consulta hidrológica autônoma plausível, centrada no rio, canal, lagoa, régua ou sistema, e não apenas no nome do município;
2. a relação entre estação, localidade e corpo hídrico está identificada sem inferência por proximidade;
3. a fonte declara capacidade de nível e a unidade apresentada é conhecida;
4. a página consegue explicar estação, horário, recência, tendência, referência da régua, limites do dado e relação com chuva ou contexto regional;
5. a intenção não concorre com o title/H1 meteorológico da página `/tempo-em/...`;
6. ausência de leitura nunca é convertida em zero, normalidade ou leitura de uma estação vizinha;
7. o valor não é chamado de cota de atenção, alerta ou inundação sem metadado específico aplicável àquela régua;
8. réguas diferentes não são comparadas, somadas, subtraídas ou convertidas sem referência vertical compatível;
9. canonical, sitemap, links internos e dados estruturados precisam apontar para a localidade correta;
10. a promoção precisa ser explícita no registry editorial. Não existe criação automática de rota a partir do inventário de estações.

## Promoções aprovadas nesta onda

### Rio Jaguarão

- Estação: `DCRS-00115`
- Página meteorológica distribuidora: `/tempo-em/jaguarao-rs`
- Página hidrológica: `/nivel-do-rio-jaguarao`
- Intenção principal: nível do Rio Jaguarão hoje

A intenção é autônoma e recorrente no contexto local. Em 24 de agosto de 2026, a Prefeitura de Jaguarão publicou uma atualização específica intitulada **“Atualização do Rio Jaguarão”**, informando a leitura da régua e registrando que a Defesa Civil permanecia acompanhando o nível do rio.

Fonte pública de evidência:

- Prefeitura Municipal de Jaguarão: https://www.jaguarao.rs.gov.br/atualizacao-do-rio-jaguarao/

A Hidrovia do Mercosul, documentada pelo DNIT, também trata o Rio Jaguarão como trecho hídrico próprio do sistema regional, reforçando que o rio possui identidade hidrográfica distinta da página meteorológica municipal.

### Canal São Gonçalo

- Estação: `DCRS-00063`
- Nome da estação: Capão do Leão - Eclusa - Canal São Gonçalo
- Página meteorológica distribuidora: `/tempo-em/capao-do-leao-rs`
- Página hidrológica: `/nivel-do-canal-sao-goncalo`
- Intenção principal: nível do Canal São Gonçalo hoje

A página é canônica para o **Canal São Gonçalo**, não para uma consulta genérica de “nível em Capão do Leão”. O município funciona como localização da estação da Eclusa.

Em 31 de agosto de 2026, a Prefeitura de Pelotas publicou uma atualização específica intitulada **“Nível do São Gonçalo atinge cota de atenção”**, evidenciando uma consulta pública autônoma pelo nível do canal. A cota citada nessa notícia pertence à medição e ao contexto informados pela Prefeitura no Cais do Porto e **não é transferida** para a estação `DCRS-00063` da Eclusa.

O DNIT descreve o Canal São Gonçalo como trecho próprio da Hidrovia do Mercosul e informa que a barragem eclusada do canal foi construída em Capão do Leão. Isso sustenta a identidade editorial da estação sem transformar a régua da Eclusa em equivalente à régua de Pelotas.

Fontes públicas de evidência:

- Prefeitura Municipal de Pelotas: https://pelotas.com.br/noticia/nivel-do-sao-goncalo-atinge-cota-de-atencao
- DNIT, Hidrovia do Mercosul: https://www.gov.br/dnit/pt-br/assuntos/aquaviario/antiga-daq/hidrovia-do-mercosul

## Candidatas mantidas somente nas páginas meteorológicas

As seguintes estações continuam úteis como enriquecimento local, mas **não foram promovidas nesta onda**:

| Página meteorológica | Estação | Situação |
| --- | --- | --- |
| `/tempo-em/turucu-rs` | `DCRS-00126` | módulo local; sem página hidrológica própria aprovada |
| `/tempo-em/cristal-rs` | `DCRS-00125` | módulo local; sem página hidrológica própria aprovada |
| `/tempo-em/arroio-grande-rs` | `DCRS-00050`, `DCRS-00111` | módulo preserva os dois pontos; sem escolha automática de uma estação canônica |
| `/tempo-em/bage-rs` | `DCRS-00041` | módulo local; sem página hidrológica própria aprovada |
| `/tempo-em/santa-vitoria-do-palmar-rs` | `DCRS-00049` | módulo local; sem página hidrológica própria aprovada |

Essas candidatas podem ser reavaliadas quando surgir evidência de intenção autônoma e conteúdo suficiente. A existência de uma estação, um valor de nível ou uma mudança de tendência não altera o gate automaticamente.

## Contrato de implementação

O registry `src/lib/hydrology/defesa-civil-regional-pages.ts` é a autoridade explícita desta onda:

- `REGIONAL_DEFESA_CIVIL_STATIONS` controla quais páginas meteorológicas recebem o módulo;
- `REGIONAL_DEFESA_CIVIL_DEDICATED_PAGES` controla quais delas podem encaminhar para uma URL hidrológica própria.

Atualmente o segundo registry contém somente Jaguarão e Capão do Leão/Canal São Gonçalo. Qualquer nova promoção deve passar novamente pelos critérios deste documento e receber teste que impeça criação acidental de páginas para as demais estações.
