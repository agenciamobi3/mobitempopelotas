# GeoInfo Embrapa — levantamento técnico para o Tempo Pelotas

Data: 26/08/2026  
Status: levantamento técnico inicial concluído; integração ainda não implementada  
Branch de referência: `main`

## 1. Objetivo

Avaliar o ecossistema GeoInfo da Embrapa como fonte complementar do Tempo Pelotas, identificando:

- como descobrir datasets e metadados sem raspar a interface humana;
- quais serviços geoespaciais podem ser consumidos programaticamente;
- quais conjuntos de dados têm potencial para meteorologia contextual, climatologia, solo, chuva, erosão, agrometeorologia e páginas regionais;
- quais limites de licença e semântica precisam bloquear publicação automática;
- se esta frente deve ou não fazer parte do contrato da futura `/previsao-15-dias-pelotas`.

Conclusão principal: **GeoInfo é uma fonte temática/geoespacial complementar e não deve ser acoplado ao contrato operacional da previsão de 15 dias.** A rota de 15 dias pode avançar com um serviço Open-Meteo estendido dedicado, enquanto GeoInfo fica em uma trilha própria de enriquecimento territorial e agrometeorológico.

## 2. Ecossistema encontrado

O domínio `geoinfo.dados.embrapa.br` expõe mais de uma superfície de catálogo/serviço.

### 2.1. Catálogo GeoNetwork legado / metadados

Superfícies informadas:

- catálogo: `https://geoinfo.dados.embrapa.br/metadados/srv/por/catalog.search`
- Swagger/API: `https://geoinfo.dados.embrapa.br/metadados/doc/api/index.html`

A interface se identifica como GeoNetwork opensource.

O projeto upstream GeoNetwork documenta busca de metadados pelos endpoints:

- `/srv/api/search/records/_search`
- `/srv/api/search/records/_msearch`

Esses endpoints aceitam consultas Elasticsearch em `POST` no GeoNetwork moderno. Antes de criar um coletor do Tempo Pelotas, o caminho real sob `/metadados` deve ser confirmado na instância da Embrapa com uma chamada de capability/smoke test; não assumir compatibilidade apenas pela documentação upstream.

Referência upstream:

- `https://github.com/geonetwork/core-geonetwork`
- `https://github.com/geonetwork/core-geonetwork/blob/main/docs/manual/docs/api/search.md`

### 2.2. GeoNode / catálogo atual

O portal atual também expõe GeoNode:

- home: `https://geoinfo.dados.embrapa.br/`
- catálogo: `https://geoinfo.dados.embrapa.br/catalogue/`
- documentação para desenvolvedores: `https://geoinfo.dados.embrapa.br/developer/`

A documentação da própria Embrapa informa suporte a:

- CSW 2.0.2 para metadados;
- OpenSearch 1.0;
- OAI-PMH 2.0;
- WMS 1.1.1 para mapas;
- WFS 1.1.0 para dados vetoriais;
- WCS 1.1.1 para rasters;
- WMTS 1.0.0 / GeoWebCache para tiles.

Endpoint CSW publicado pela documentação:

`https://geoinfo.dados.embrapa.br/catalogue/csw`

A documentação mostra explicitamente que WFS pode entregar dados como GeoJSON, GML, CSV ou shapefile e aceitar filtros espaciais/bounding box.

### 2.3. GeoServer

O GeoServer público está em:

`https://geoinfo.dados.embrapa.br/geoserver/`

Serviço OGC genérico observado nos metadados:

`https://geoinfo.dados.embrapa.br/geoserver/ows`

No levantamento de 26/08/2026, a página pública de preview informava **7.281 camadas configuradas**. Esse número é inventário dinâmico e não deve ser codificado como constante de produto.

## 3. Regra arquitetural para o Tempo Pelotas

Não raspar HTML do catálogo como contrato de produção.

Fluxo recomendado:

`catálogo (CSW / GeoNetwork API)`  
`-> metadado normalizado`  
`-> gate de licença/publicação/escala/data`  
`-> descoberta do serviço OGC`  
`-> WMS/WFS/WCS conforme o tipo`  
`-> cache/recorte server-side quando necessário`  
`-> apresentação no portal`

Separar três papéis:

1. **discovery** — descobrir e atualizar o inventário de datasets;
2. **metadata** — guardar título, UUID/id, resumo, responsável, data, escala/resolução, projeção, extensão, licença e links;
3. **data access** — acessar a camada real por WMS/WFS/WCS/arquivo quando a licença e o contrato permitirem.

## 4. Datasets candidatos identificados

Este é um inventário inicial dos conjuntos que apareceram com documentação suficiente no levantamento público. Não representa todos os milhares de itens existentes no GeoInfo.

| Dataset | Tipo / resolução | Serviços/formato observados | Licença observada | Uso potencial no Tempo Pelotas | Prioridade |
| --- | --- | --- | --- | --- | --- |
| Mapa de solos do Brasil [CNPS] | vetor, escala 1:5.000.000 | GeoJSON, CSV, GML, shapefile, WMS, WFS | CC BY-NC 3.0 BR | contexto pedológico nacional; pouco detalhado para inferência local fina | P3 |
| Estimativa de água disponível nos solos do Brasil — segunda aproximação [CNPS] | vetor, escala 1:500.000 | GeoJSON, CSV, GML, shapefile, WMS, WFS | CC BY-NC 3.0 BR | agrometeorologia, capacidade de água no solo, contexto de ZARC e páginas rurais | P1 para pesquisa, bloqueada para uso comercial até revisão jurídica/licença |
| Mapa de erodibilidade dos solos à erosão hídrica do Brasil [CNPS] | vetor, escala 1:250.000 | GeoJSON, CSV, GML, shapefile, WMS, WFS | CC BY-NC 3.0 BR | contexto de impacto de chuva, solo e erosão; páginas técnicas/agro | P2 |
| Mapa de suscetibilidade dos solos à erosão hídrica do Brasil [CNPS] | raster, 30 m | GeoTIFF/arquivo, WMS, WCS | CC BY-NC 3.0 BR | mapa temático de suscetibilidade; chuva + relevo + erodibilidade | P2 |
| Mapa de vulnerabilidade dos solos à erosão hídrica do Brasil — 2019 [CNPS] | raster, 30 m | WMS, WCS; download informado como indisponível na plataforma em parte dos metadados | CC BY-NC 3.0 BR | contexto territorial de exposição à erosão com uso/cobertura da terra | P3 |
| Erosividade da chuva do Brasil — dataset GeoInfo 1775 | raster, conforme publicação técnica Embrapa | dataset digital citado no catálogo GeoInfo; contrato OGC ainda deve ser validado | licença precisa ser lida no registro específico antes de qualquer uso | contexto climatológico/erosividade; **não é chuva observada nem previsão** | P2 para auditoria |
| Mapa de pH do solo a 0–30 cm do Brasil [CNPS] | raster, 1 km | dataset raster; serviço deve ser validado antes de uso | CC BY-NC 3.0 BR no registro consultado | eventual camada agrometeorológica/pedológica | P4 |
| Mapa de salinidade do solo a 0–30 cm do Brasil [CNPS] | raster, 1 km | dataset raster; serviço deve ser validado antes de uso | CC BY-NC 3.0 BR no registro consultado | eventual contexto de solos da planície costeira; não inferir condição de lavoura individual | P4 |
| Pontos de amostragem PronaSolos — 2020 [CNPS] | pontos / base de perfis de solo | metadado público; formatos/serviço devem ser confirmados antes de integrar | verificar registro específico | pesquisa de qualidade/representatividade do dado pedológico | P3 para pesquisa |
| CAR 2024 — dimensão territorial da vegetação nativa por município | vetor municipal | GeoJSON, CSV, GML, shapefile; WMS/WFS no ecossistema GeoNode | verificar registro específico antes de publicação | contexto rural/territorial, não meteorologia operacional | P4 |

## 5. Datasets com maior potencial imediato

### 5.1. Água disponível no solo

O conjunto `Estimativa de água disponível nos solos do Brasil (Segunda aproximação)` é o achado mais diretamente ligado a agrometeorologia.

Os próprios metadados dizem que água disponível no solo é usada na modelagem do **Zoneamento Agrícola de Risco Climático (Zarc)**. O produto usa uma base de 1.514 perfis de solos e foi publicado na escala 1:500.000.

Possíveis usos futuros:

- uma área de agrometeorologia para a Zona Sul/Campanha;
- contexto para Canguçu, Dom Pedrito, Bagé e outros municípios rurais;
- explicar por que o mesmo volume de chuva não tem o mesmo efeito em todo tipo de solo;
- cruzar, editorialmente, previsão de chuva com características persistentes do solo — sempre sem transformar isso em diagnóstico agronômico de propriedade específica.

**Não usar na previsão de 15 dias como modificador automático do tempo.** É dado de solo, não modelo atmosférico.

### 5.2. Erodibilidade / suscetibilidade / vulnerabilidade à erosão

Os três conjuntos formam uma família útil:

- erodibilidade = atributo intrínseco do solo;
- suscetibilidade = integra erodibilidade + erosividade da chuva + relevo;
- vulnerabilidade = acrescenta exposição associada ao uso/cobertura da terra.

O mapa de suscetibilidade usa pixel de 30 m e integra mapa de erodibilidade, erosividade da chuva e SRTM/NASA. O mapa de vulnerabilidade também usa 30 m e considera uso/cobertura da terra.

Possíveis usos:

- mapas explicativos em conteúdo sobre chuva intensa/erosão;
- conteúdo técnico para atividade rural;
- visualizações regionais sem fingir que o mapa representa risco de alagamento urbano ou enchente.

**Não usar para alertar temporal, alagamento ou inundação.** São produtos temáticos de solo/erosão.

### 5.3. Erosividade da chuva

A publicação técnica da Embrapa `Erosividade da Chuva do Brasil` aponta o dataset digital GeoInfo de id `1775` e informa que a modelagem foi construída com dados mensais de precipitação de 3.659 estações, sendo 3.294 da rede ZARC e 365 da CPRM/SGB.

Isto pode ser valioso para contexto climatológico e erosão, mas o conceito é **erosividade climatológica/modelada**, não:

- chuva de hoje;
- acumulado das últimas 24 horas;
- radar;
- previsão de 7/15 dias;
- aviso meteorológico.

Antes de integrar, localizar o registro de metadado do dataset 1775, validar licença, resolução, CRS, extensão, serviço OGC e data de referência.

## 6. O que o levantamento não encontrou como fonte operacional

Na pesquisa pública/indexada desta rodada, não foi encontrado um dataset GeoInfo que substitua diretamente:

- Embrapa Clima Temperado para observação meteorológica atual em Pelotas;
- Open-Meteo para previsão horária/diária;
- INMET para avisos oficiais;
- REDEMET para radar/satélite/STSC;
- LabHidroSens/UFPel para nível do Laranjal;
- Defesa Civil/ANA/SGB para hidrometeorologia operacional.

Também não foi encontrado, nesta primeira passada indexada, um produto GeoInfo claramente voltado a telemetria em tempo real da Lagoa dos Patos ou Canal São Gonçalo.

**Importante:** ausência na pesquisa web não equivale a ausência no catálogo. O inventário completo deve ser feito futuramente pelo catálogo CSW/GeoNetwork API, não por busca de navegador.

## 7. Gate de licença — obrigatório

Vários dos datasets de maior interesse consultados informam **CC BY-NC 3.0 BR**, isto é, uso não comercial.

Como o Tempo Pelotas está ligado a uma operação comercial da MOBI, nenhum desses dados deve ser incorporado automaticamente em uma funcionalidade pública/comercial apenas porque está tecnicamente acessível.

Para cada dataset, registrar antes de uso:

- licença exata;
- se o uso planejado é permitido;
- atribuição exigida;
- possibilidade de exibir tiles WMS sem redistribuir o arquivo;
- possibilidade de derivar estatísticas;
- restrições de download/redistribuição;
- contato/responsável quando houver dúvida.

`metadata publicamente acessível != licença irrestrita de reutilização`.

## 8. Contrato técnico proposto para uma futura integração

Não implementar agora junto com a previsão de 15 dias. Quando a frente GeoInfo entrar, criar uma camada independente.

### 8.1. Discovery

Proposta:

`src/lib/geoinfo/catalog.server.ts`

Responsabilidade:

- pesquisar termos no CSW ou GeoNetwork API;
- retornar somente metadados normalizados;
- nunca expor credencial, caso algum endpoint futuro exija autenticação;
- cache de horas/dias, pois metadados não são tempo real.

### 8.2. Registry local

Proposta:

`src/lib/geoinfo/datasets.ts`

Cada dataset aprovado deve ter um registro explícito:

```ts
{
  id,
  title,
  layerName,
  resourceType,
  sourceUrl,
  serviceType,
  serviceUrl,
  crs,
  spatialResolution,
  publicationDate,
  license,
  commercialUseApproved,
  attribution,
  semanticRole,
}
```

Nenhuma camada descoberta automaticamente entra em produção sem promoção manual para esse registry.

### 8.3. Acesso aos dados

- vetor: WFS com `bbox`/filtro e saída GeoJSON quando viável;
- raster: WMS para visualização; WCS apenas quando houver necessidade real de análise numérica;
- tiles: WMTS/GeoWebCache quando o serviço e a licença permitirem;
- arquivos grandes: nunca baixar no pageview.

### 8.4. Cache e disponibilidade

GeoInfo não deve entrar no critical path de Home, Hoje, Amanhã, 7 dias ou 15 dias.

Se uma camada GeoInfo falhar:

- a previsão continua funcionando;
- o mapa temático informa indisponibilidade;
- não há fallback para dados inventados ou para outro tema semanticamente diferente.

## 9. Relação com MapLibre

O Tempo Pelotas já utiliza MapLibre na experiência regional. Há três estratégias possíveis, em ordem de preferência:

1. serviço de tiles/WMTS compatível;
2. WMS como camada raster, se o adaptador adotado suportar a estratégia com estabilidade;
3. WFS server-side -> GeoJSON reduzido/recortado -> source MapLibre.

Para dados vetoriais nacionais, nunca enviar o dataset inteiro ao browser. Fazer recorte por bounding box/região e simplificação quando necessário.

## 10. Relação com SEO e conteúdo

GeoInfo pode criar diferenciação editorial real, especialmente em páginas regionais e uma futura frente agroclimática.

Usos aceitáveis:

- “características do solo na região”;
- “capacidade de água disponível no solo”;
- “suscetibilidade à erosão hídrica”;
- mapas e explicações territoriais;
- comparação de contextos entre municípios quando escala/resolução sustentarem a interpretação.

Usos a evitar:

- gerar dezenas de páginas automaticamente por classe de solo;
- transformar mapa nacional de pequena escala em diagnóstico de bairro/propriedade;
- usar erosividade como sinônimo de chuva prevista;
- usar suscetibilidade à erosão como sinônimo de risco de enchente;
- misturar dado estático/geográfico com leitura meteorológica atual sem rótulo.

## 11. Relação com `/previsao-15-dias-pelotas`

Decisão: **nenhuma dependência do GeoInfo na versão inicial da previsão de 15 dias**.

A nova rota deve continuar seguindo o contrato já definido:

- consulta Open-Meteo estendida e dedicada;
- até 15 dias, sem alterar o `forecast_days=7` global;
- cache e timeout próprios;
- normalização de diária;
- nenhuma data ausente vira zero;
- incerteza editorial explícita conforme o horizonte aumenta;
- INMET/CPPMet somente como contexto quando houver sobreposição temporal real.

No futuro, GeoInfo pode aparecer em uma seção complementar, por exemplo `Contexto do solo e da região`, mas sem afetar os valores meteorológicos previstos.

## 12. Próxima auditoria GeoInfo, quando esta frente for retomada

Executar um harvester de metadados em blocos para:

- `Pelotas`;
- `Rio Grande do Sul`;
- `Embrapa Clima Temperado`;
- `chuva` / `precipitação`;
- `erosividade`;
- `solo`;
- `água disponível`;
- `ZARC`;
- `agroclimático`;
- `Lagoa dos Patos`;
- `bacia`;
- `inundação` / `enchente`;
- `declividade`;
- `uso e cobertura da terra`.

Saída esperada:

`dataset -> id/uuid -> camada -> extensão -> escala/resolução -> data -> licença -> WMS/WFS/WCS -> uso proposto -> decisão`

## 13. Fontes consultadas

- GeoInfo Embrapa — catálogo GeoNetwork: `https://geoinfo.dados.embrapa.br/metadados/srv/por/catalog.search`
- GeoInfo Embrapa — Swagger/API GeoNetwork: `https://geoinfo.dados.embrapa.br/metadados/doc/api/index.html`
- GeoInfo Embrapa — developer/GeoNode: `https://geoinfo.dados.embrapa.br/developer/`
- GeoInfo Embrapa — GeoServer: `https://geoinfo.dados.embrapa.br/geoserver/`
- GeoNetwork upstream: `https://github.com/geonetwork/core-geonetwork`
- GeoNetwork Search Service: `https://github.com/geonetwork/core-geonetwork/blob/main/docs/manual/docs/api/search.md`
- Mapa de solos do Brasil: `https://geoinfo.dados.embrapa.br/datasets/geoinfo_data:geonode:brasil_solos_5m_20201104/metadata_detail`
- Água disponível nos solos do Brasil: `https://geoinfo.dados.embrapa.br/datasets/geoinfo_data:geonode:adbrasil/metadata_detail`
- Erodibilidade dos solos: `https://geoinfo.dados.embrapa.br/datasets/geoinfo_data:geonode:brasil_erodibilidade_solo/metadata_detail`
- Suscetibilidade à erosão: `https://geoinfo.dados.embrapa.br/datasets/geonode:suscetibilidade_bra/metadata_detail`
- Vulnerabilidade à erosão: `https://geoinfo.dados.embrapa.br/datasets/vulnerabilidade_2019_bra:geonode:vulnerabilidade_2019_bra/metadata_detail`
- Erosividade da Chuva do Brasil — publicação técnica Embrapa, com referência ao dataset 1775: `https://www.infoteca.cnptia.embrapa.br/infoteca/bitstream/doc/1159615/1/CNPS-BPD-286-2023.pdf`

## 14. Decisão de sequência

1. levantamento GeoInfo documentado — concluído;
2. não introduzir GeoInfo no critical path meteorológico;
3. avançar para `/previsao-15-dias-pelotas` com o contrato estendido já planejado;
4. retomar GeoInfo depois como frente independente de contexto territorial/agrometeorologia, sempre passando pelo gate de licença.
