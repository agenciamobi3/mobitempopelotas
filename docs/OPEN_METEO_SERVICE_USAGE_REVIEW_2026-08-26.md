# Open-Meteo — revisão de uso do serviço antes da previsão de 30 dias

Data: 26/08/2026  
Status: gate operacional aberto; não publicar nova dependência sazonal antes de resolver a modalidade de uso do serviço  
Branch de referência: `main`

## 1. Motivo desta revisão

A implementação de `/previsao-15-dias-pelotas` confirmou que o endpoint meteorológico padrão do Open-Meteo atende tecnicamente a janela diária de até 15/16 dias.

A próxima frente planejada, `/previsao-30-dias-pelotas`, exige outro produto: tendência subseasonal para os dias posteriores à janela de previsão diária. A documentação atual do Open-Meteo oferece o ECMWF EC46 pela Seasonal Forecast API, mas a revisão dos termos de uso revelou um gate que precisa ser resolvido antes de ampliar a dependência.

Este documento separa duas questões diferentes:

1. licença dos dados retornados;
2. modalidade de acesso ao serviço/API que entrega esses dados.

Não é parecer jurídico. É um gate técnico/operacional para impedir que o código assuma uma modalidade de uso que não foi confirmada para o produto.

## 2. O que a documentação oficial informa

### 2.1. Dados

A página de licença do Open-Meteo informa que os dados servidos pela API são disponibilizados sob Creative Commons Attribution 4.0 International (CC BY 4.0), com obrigação de atribuição.

A documentação pede que a atribuição ao Open-Meteo apareça junto aos locais em que os dados são exibidos.

### 2.2. Serviço gratuito x uso comercial

Os termos de uso consultados em 26/08/2026 dizem que o Free API Service é destinado a uso não comercial e possui limites próprios.

A mesma página apresenta como exemplos de uso comercial:

- site ou aplicativo com assinatura;
- site ou aplicativo com publicidade;
- integração em produto comercial ou atividade promocional.

A página de preços informa que os planos de API pagos incluem licença de uso comercial do serviço, endpoint dedicado e API key.

Portanto:

`dados CC BY 4.0` não deve ser interpretado como `qualquer modalidade do serviço gratuito pode ser usada comercialmente`.

São contratos diferentes e precisam ser tratados separadamente.

### 2.3. Seasonal Forecast API e nível de plano

Na tabela de preços revisada em 26/08/2026, a família que inclui Seasonal Forecast API, Ensemble Weather API, Historical Weather API, Historical Forecast API, Previous Model Runs API e Single Runs API aparece disponível no Free/Open-Access e nos planos Professional/Enterprise, mas não no Standard.

Consequência para o desenho atual:

- para uso comercial apenas do forecast padrão, um plano comercial compatível pode ser suficiente conforme os termos vigentes;
- para a tendência de 30 dias baseada na Seasonal Forecast API, o plano comercial precisa oferecer essa API; na tabela atual isso aponta para **Professional ou Enterprise**, ou então self-host/alternativa licenciada.

Não codificar o tier como verdade permanente. Preços e escopo de plano são condições externas e devem ser conferidos antes da contratação/ativação.

## 3. Situação atual encontrada no repositório

A auditoria do código ativo encontrou chamadas diretas ao endpoint público `https://api.open-meteo.com/v1/forecast` em vários fluxos, incluindo:

- `src/lib/weather/open-meteo.server.ts`;
- `src/lib/weather/meteogram.server.ts`;
- `src/routes/api/weather/hourly-precipitation.ts`;
- `src/lib/weather/regional-cities-overview.server.ts`;
- `src/lib/weather/regional-city-weather.server.ts`;
- `src/lib/weather/regional-city-weather-resilient.server.ts`;
- `src/lib/weather/regional-city-weather-client.ts`;
- `src/production/lib/open-meteo-browser-recovery.ts`;
- `supabase/functions/open-meteo-forecast/index.ts`;
- `supabase/functions/regional-weather-overview/index.ts`;
- `supabase/functions/forecast-open-meteo-capture/index.ts`.

Também existe a nova consulta dedicada de 15 dias em `src/lib/weather/extended-forecast.server.ts`.

Na revisão desta data, não foi encontrada no repositório uma configuração equivalente a:

- `OPEN_METEO_API_KEY`;
- endpoint `customer-api.open-meteo.com`;
- endpoint `customer-seasonal-api.open-meteo.com`;
- contrato de self-host do Open-Meteo.

O `.env.example` também não possui essas variáveis.

Conclusão operacional: **não assumir que a modalidade comercial/self-host já está resolvida apenas porque a integração técnica existe e funciona.**

### 3.1. Atribuição pública já existente

A auditoria do footer confirmou que a atribuição básica ao Open-Meteo já existe no portal:

- `src/lib/public-source-links.ts` registra `Open-Meteo` com link para `https://open-meteo.com/`;
- `src/components/layout/Footer.tsx` renderiza esse mapa de fontes no bloco `Fontes e proveniência` do footer compartilhado.

Isso é positivo e deve ser preservado.

Ainda assim, a revisão futura deve confirmar se a forma/posição final atende integralmente à exigência vigente de atribuição para todas as superfícies que exibem dados Open-Meteo, inclusive APIs, embeds ou experiências que possam não carregar o footer normal.

## 4. Impacto sobre a previsão de 30 dias

A página de 30 dias continua tecnicamente válida como produto e SEO, mas a nova fonte não deve ser colocada em runtime público até o gate de serviço ser resolvido.

Arquitetura aprovada permanece:

### Dias 1–15

- previsão diária;
- dados do contrato já implementado em `/previsao-15-dias-pelotas`;
- mínima, máxima, chuva e vento por data;
- incerteza crescente declarada.

### Dias 16–30

- não criar cartões diários;
- usar tendência subseasonal agregada por semana;
- tratar a informação como visão de área, não como previsão local precisa de bairro/rua;
- não transformar anomalia semanal em afirmação de chuva em uma data específica.

## 5. Fonte técnica candidata para dias 16–30

A candidata principal continua sendo a Seasonal Forecast API do Open-Meteo usando ECMWF EC46.

Documentação revisada:

- EC46 alcança até 46 dias;
- resolução espacial aproximada de 36 km;
- atualização diária por volta de 20:30 UTC segundo o Open-Meteo;
- sistema ensemble;
- o Open-Meteo disponibiliza modelo de média do ensemble;
- dados semanais são calculados diretamente a partir do produto EC46;
- existem médias e anomalias semanais de temperatura, precipitação, vento e outras variáveis;
- o dataset não possui bias correction no estado documentado em 26/08/2026.

O próprio ECMWF orienta a faixa subseasonal como leitura das condições médias semana a semana e de seus desvios em relação à climatologia do modelo, não como detalhamento confiável do tempo de cada dia distante.

### Modelo recomendado para o contrato futuro

`ecmwf_ec46_ensemble_mean`

### Variáveis semanais mínimas candidatas

- `temperature_2m_mean`;
- `temperature_2m_anomaly`;
- `precipitation_mean`;
- `precipitation_anomaly`.

Os nomes acima foram confirmados também no enum `ForecastVariableWeekly` do código upstream do Open-Meteo.

Não ampliar o primeiro contrato com EFI, SOT ou probabilidades avançadas antes de a página básica estar validada e a semântica de cada campo estar coberta por testes.

## 6. Como a interface deve traduzir o dado

O dado bruto poderá preservar os valores numéricos para rastreabilidade, mas a superfície pública deve continuar simples.

Exemplos de conceito — não são valores fixos nem copy baseada em dado inexistente:

- temperatura com sinal acima do padrão do modelo;
- temperatura próxima do padrão do modelo;
- temperatura com sinal abaixo do padrão do modelo;
- período com sinal mais úmido;
- período sem sinal claro de desvio de precipitação;
- período com sinal mais seco.

Os thresholds de classificação não devem ser inventados agora. Antes de transformar uma anomalia pequena em rótulo editorial, definir uma regra técnica documentada e testada.

## 7. Gate obrigatório antes do runtime público

Escolher e registrar uma das modalidades abaixo.

### Opção A — API comercial Open-Meteo

- contratar plano que inclua a Seasonal Forecast API;
- usar endpoint customer correspondente;
- armazenar API key somente server-side;
- nunca colocar a chave em `VITE_*`;
- centralizar a construção de endpoint;
- garantir atribuição CC BY 4.0 no produto.

O código upstream do Open-Meteo reconhece explicitamente `customer-seasonal-api.open-meteo.com` como host da Seasonal API.

No quadro de planos consultado em 26/08/2026, Seasonal Forecast API não aparece habilitada no Standard; aparece na família de APIs disponível em Professional/Enterprise. Confirmar novamente antes de assinar, porque essa condição é externa e pode mudar.

### Opção B — self-host

- operar instância própria do Open-Meteo de acordo com a licença do software e das fontes de dados;
- registrar custo operacional, atualização dos modelos, armazenamento e observabilidade;
- revisar separadamente as condições dos dados de origem.

### Opção C — outra fonte licenciada

- só substituir EC46/Open-Meteo se outra fonte oferecer contrato técnico e direitos de uso mais adequados;
- preservar a regra de tendência semanal, não 30 dias diários fictícios.

## 8. Refatoração recomendada depois da decisão

Quando a modalidade estiver definida, não corrigir somente a nova página de 30 dias.

Criar uma configuração server-side central para Open-Meteo e migrar progressivamente as chamadas diretas existentes.

Contrato sugerido:

- base URL por família de API;
- chave server-side quando aplicável;
- nenhum secret em navegador/log;
- atribuição centralizada;
- timeout por domínio;
- modo de operação explícito;
- fallback seguro;
- testes que bloqueiem retorno acidental ao endpoint gratuito em um ambiente configurado como comercial.

A recuperação browser-side merece tratamento próprio: se um ambiente comercial exigir chave, o navegador não deve receber essa chave. Nesse cenário, a recuperação deve passar por endpoint server-side controlado ou outra arquitetura equivalente.

## 9. O que não fazer

- não adicionar `apikey` em código cliente;
- não versionar chave no `.env.production` do Git;
- não esconder chave em query string entregue ao navegador;
- não publicar `/previsao-30-dias-pelotas` chamando o Free API Service e assumir que CC BY 4.0 resolve a modalidade do serviço;
- não criar 30 previsões diárias a partir do EC46;
- não usar resolução de 36 km como se representasse microclima de um ponto específico;
- não chamar valor de anomalia de alerta;
- não inferir chuva em um dia específico a partir de tendência semanal.

## 10. Próxima ação técnica

Antes de abrir a URL de 30 dias para indexação:

1. definir a modalidade de uso Open-Meteo para o Tempo Pelotas;
2. registrar/configurar endpoint e segredo se houver;
3. centralizar o acesso server-side;
4. validar a resposta semanal real do EC46;
5. criar parser tipado e fallback;
6. definir a tradução editorial das anomalias;
7. só então criar `/previsao-30-dias-pelotas`, sitemap, links internos e testes de SEO.

Até esse gate ser fechado, `/previsao-30-dias-pelotas` permanece **planejada e não publicada**.

## 11. Referências públicas revisadas em 26/08/2026

- Open-Meteo — Licence: `https://open-meteo.com/en/license`
- Open-Meteo — Terms: `https://open-meteo.com/en/terms`
- Open-Meteo — Pricing: `https://open-meteo.com/en/pricing`
- Open-Meteo — Seasonal Forecast API: `https://open-meteo.com/en/docs/seasonal-forecast-api`
- ECMWF — Sub-seasonal-range forecasts: `https://www.ecmwf.int/en/forecasts/about-our-forecasts/sub-seasonal-range-forecasts`
- Open-Meteo upstream — `Sources/App/Controllers/ForecastapiController.swift`
- Open-Meteo upstream — `Sources/App/Controllers/VariableWeekly.swift`
