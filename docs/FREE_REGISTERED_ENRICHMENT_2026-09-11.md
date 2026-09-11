# Tempo Pelotas — enriquecimento gratuito para usuários cadastrados

Data: 11/09/2026
Estado: primeira leva implementada no `main`

## Princípio

O cadastro gratuito não existe para privatizar informação pública.

A regra de produto adotada é:

- a informação pública essencial continua disponível sem login;
- a Conta Free pode acrescentar organização, personalização, síntese, rastreabilidade e contexto;
- dados provenientes de fontes públicas não se tornam pagos apenas porque o Tempo Pelotas os organizou;
- uma fonte privada ou contratualmente restrita continua sujeita aos seus próprios termos de uso, independentemente de o visitante estar autenticado;
- credenciais, endpoints privados, payloads internos e informações que a fonte não autoriza redistribuir nunca são expostos pela camada cadastrada;
- o PRO deve monetizar automação, profundidade histórica, regras, comparações, exportações e capacidade de trabalho quando as licenças permitirem, não o simples acesso ao dado público bruto.

## Arquitetura

A primeira implementação usa `getRegisteredEnrichmentAccess` apenas para verificar se existe uma sessão autenticada.

A Server Function:

- usa a sessão normal do Supabase;
- não usa `service_role`;
- não exige entitlement PRO;
- retorna somente `authenticated`, `unauthenticated` ou `unavailable`;
- usa `Cache-Control: private, no-store` e `Vary: Cookie, Authorization`.

O dado meteorológico ou hidrológico não é buscado novamente por essa função. Cada página reutiliza o mesmo objeto de dados que já alimenta sua experiência pública.

Isso mantém uma separação simples:

- **página pública:** informação principal e interpretação necessária para qualquer visitante;
- **Conta Free:** segunda leitura, contexto e sínteses derivadas do mesmo conjunto permitido de dados;
- **PRO futuro:** automação e ferramentas de trabalho sobre informações cuja licença permita esse uso.

## Meteorologia

O componente `RegisteredWeatherEnrichment` foi adicionado inicialmente às páginas:

- `/tempo-hoje-pelotas`;
- `/chuva-em-pelotas`;
- `/vento-em-pelotas`;
- `/previsao-7-dias-pelotas`.

### Tempo hoje

A Conta Free pode visualizar, quando os campos estão disponíveis:

- menor visibilidade prevista nas próximas 6 horas;
- maior cobertura de nuvens baixas nas próximas 6 horas;
- maior CAPE previsto nas próximas 12 horas;
- menor diferença entre temperatura e ponto de orvalho nas próximas 6 horas.

A diferença temperatura × ponto de orvalho é apresentada como proximidade da saturação, sem afirmar que haverá neblina.

### Chuva

A camada cadastrada calcula a partir da previsão horária já consolidada:

- acumulado previsto em 6 horas;
- acumulado previsto em 12 horas;
- acumulado previsto em 24 horas;
- maior volume horário previsto;
- maior probabilidade horária de precipitação.

A interface diferencia explicitamente previsão de chuva já observada.

### Vento

A camada cadastrada resume:

- maior rajada em 6 horas;
- maior rajada em 12 horas;
- maior rajada em 24 horas;
- maior vento sustentado em 24 horas;
- horário do pico;
- direção em graus quando disponível;
- quantidade de horas com rajada prevista igual ou superior a 50 km/h.

Esse limiar é apenas um filtro de apresentação do painel e não é classificado como alerta oficial.

### Previsão de 7 dias

A Conta Free recebe uma síntese adicional com:

- soma da precipitação prevista nos sete dias;
- quantidade de dias com precipitação prevista ou chance de chuva relevante;
- maior máxima;
- menor mínima;
- rajada diária mais forte.

## Rastreabilidade meteorológica

Além da síntese específica da página, a Conta Free mostra dados que já existem na consolidação:

- score de qualidade;
- confiança da consolidação;
- fonte selecionada para a observação;
- idade da observação;
- provedor selecionado para a previsão;
- fontes degradadas ou indisponíveis;
- divergências relevantes registradas entre fontes;
- notas operacionais produzidas pela própria consolidação.

A interface não cria discrepâncias próprias. Ela apenas expõe de forma legível o contrato `weather.quality` já usado pelo runtime.

## Hidrologia

O componente `RegisteredHydrologyEnrichment` foi adicionado inicialmente às páginas:

- `/nivel-do-canal-sao-goncalo`, estação `DCRS-00063`;
- `/nivel-do-rio-jaguarao`, estação `DCRS-00115`.

As duas páginas continuam exibindo publicamente a leitura principal da estação.

Quando autenticado, o usuário recebe contexto adicional da mesma resposta da Rede de Monitoramento Hidrometeorológico da Defesa Civil RS:

- freshness da leitura;
- idade da observação;
- acumulados de chuva de 1h, 6h, 12h, 24h, 72h e 168h quando disponíveis;
- capacidades declaradas da estação;
- quantidade de estações recentes na rede regional;
- quantidade de estações regionais recebidas;
- tamanho do inventário estadual recebido;
- até quatro outras estações com nível de rio, apresentadas apenas como contexto de rede.

### Regra para réguas

Outras estações nunca são apresentadas como se suas cotas fossem diretamente comparáveis.

O enriquecimento preserva que:

- cada régua possui sua referência física;
- datum e localização podem ser diferentes;
- um valor maior em outra estação não significa automaticamente uma condição mais grave;
- a chuva de uma estação não representa automaticamente toda a bacia;
- nenhuma cota de atenção, inundação ou classificação de risco é inventada pelo Tempo Pelotas.

## Visitante sem login

Nas páginas que possuem enriquecimento, o visitante não autenticado continua recebendo a experiência pública normal.

Ao fim do conteúdo relevante aparece somente uma chamada curta informando que a Conta Free oferece uma leitura adicional. O CTA leva para `/conta` preservando a página de retorno.

O teaser reforça que a informação pública da página permanece aberta.

## Fontes públicas e privadas

A presença de uma fonte dentro da consolidação não significa autorização irrestrita para redistribuição.

Antes de ampliar essa camada para uma nova origem, verificar:

1. se o dado já pode ser exibido publicamente pelo portal;
2. se o termo da fonte permite redistribuição ou derivação;
3. se há obrigação de atribuição;
4. se existem limites de cache, retenção ou histórico;
5. se a fonte contém elementos privados, licenciados ou obtidos com credencial que não podem ser repassados ao usuário final.

O login não substitui essa verificação.

## Próximos candidatos Free

A arquitetura pode ser aplicada, após revisão específica da semântica e das fontes, a:

- nível da Lagoa dos Patos no Laranjal;
- nível do Guaíba;
- situação hidrológica regional;
- radar e satélite;
- câmeras, quando houver estado operacional útil além do próprio vídeo;
- páginas meteorológicas regionais;
- previsão de 15 dias;
- meteograma e camadas atmosféricas;
- histórico curto do próprio recurso;
- comparação simples com o dia anterior ou média recente, quando houver série apropriada.

O objetivo não é esconder detalhes atrás do login indiscriminadamente. Cada enriquecimento precisa responder à pergunta: **o que a conta pode organizar ou explicar melhor sem retirar valor do visitante público?**

## Fronteira recomendada com PRO

A Conta Free pode continuar recebendo informação e contexto das fontes permitidas.

O PRO deve concentrar valor em operações como:

- regras personalizadas de alerta;
- monitoramento automático de mudanças;
- histórico profundo;
- comparação entre períodos e séries compatíveis;
- múltiplos painéis e localidades;
- relatórios programados;
- exportações, quando a licença da fonte permitir;
- integrações, webhooks e API com limites maiores;
- analytics avançado dos widgets;
- workflows para equipes ou empresas.

Assim, a assinatura remunera infraestrutura, automação e ferramentas próprias do Tempo Pelotas, não a apropriação comercial de uma informação pública de terceiros.

## Proteções

`tests/free-registered-enrichment.test.ts` protege que:

- o acesso adicional seja somente por sessão e não por PRO;
- a resposta de autenticação seja privada;
- não haja `service_role` nessa verificação;
- meteorologia reutilize campos reais da consolidação;
- não sejam criados valores demonstrativos;
- previsão e observação de chuva continuem semanticamente separadas;
- rastreabilidade e divergências venham da consolidação existente;
- São Gonçalo use `DCRS-00063`;
- Jaguarão use `DCRS-00115`;
- os acumulados adicionais venham da própria estação;
- réguas diferentes não sejam convertidas em classificação de risco inventada;
- a superfície continue responsiva e utilizável por teclado.

O contrato faz parte de `npm run test:contracts`.
