# Tempo Pelotas — evolução do painel cadastrado

Data: 11/09/2026
Estado: fase 1 implementada no `main`

## Princípio de produto

A área autenticada não deve existir apenas como passagem para recursos públicos ou como vitrine de funcionalidades PRO.

A regra adotada a partir desta fase é:

- **Free cria hábito e organização pessoal**;
- **PRO amplia profundidade, automação e capacidade de trabalho**;
- dados públicos básicos continuam públicos;
- a conta reorganiza e contextualiza os dados em torno da pessoa;
- recursos pagos não devem empobrecer artificialmente a experiência gratuita.

## Fase 1 — Painel Vivo Free

O `/painel` passa a se apresentar como **Meu Tempo Pelotas**.

A ordem de leitura agora é:

1. identidade e camada da conta;
2. resumo vivo pessoal;
3. favoritos do usuário;
4. área `Para meu site`;
5. próximas camadas de profundidade;
6. ferramentas internas condicionais já existentes.

Essa ordem evita que widgets, PRO ou recursos futuros apareçam antes do valor cotidiano da conta.

## Resumo meteorológico pessoal

`AccountLiveOverview` recupera dados com a mesma Server Function `getWeatherIntelligence` usada pela camada meteorológica do portal.

Não existe uma API paralela específica para o painel.

A primeira versão mostra:

- temperatura atual medida quando existe observação utilizável;
- fallback explícito para previsão quando não há medição atual;
- condição derivada da apresentação meteorológica canônica;
- mínima e máxima do dia;
- chance e volume de chuva previstos;
- maior chance de chuva nas próximas seis horas;
- vento/rajada de destaque nas próximas seis horas;
- quantidade de avisos oficiais relevantes para Pelotas;
- links para aprofundar cada leitura nas páginas públicas correspondentes.

## Integridade dos dados

O painel não usa números demonstrativos para preencher estados vazios.

Quando a consolidação meteorológica não retorna conteúdo utilizável:

- o estado é marcado como indisponível;
- valores ficam vazios;
- o usuário é informado de que as páginas públicas continuam disponíveis;
- nenhuma leitura fictícia substitui o dado real.

## Favoritos

Os favoritos continuam sendo privados por usuário e permanecem no centro da experiência Free.

Nesta fase eles ainda funcionam principalmente como organização e atalhos persistidos. A evolução natural é torná-los **favoritos vivos**, exibindo no próprio painel o estado resumido do recurso escolhido quando a fonte e a semântica forem seguras.

Prioridade sugerida para favoritos vivos:

1. previsão de 7 dias;
2. Tempo no Laranjal;
3. nível da Lagoa no Laranjal;
4. Canal São Gonçalo;
5. Guaíba;
6. Rio Jaguarão;
7. radar/satélite e câmeras como estado de disponibilidade/atualização.

## Para meu site

O gerador de widgets continua disponível no Free.

Ele foi reposicionado para a área **Para meu site**, junto da distribuição e analytics dos widgets. A mudança é de arquitetura da experiência, não de entitlement.

## Próximas camadas

Depois de consolidar o valor diário do painel Free, as próximas evoluções recomendadas são:

1. favoritos vivos;
2. preferências pessoais que realmente alterem o painel;
3. resumo diário personalizado;
4. histórico pessoal curto no Free;
5. reavaliação segura da experiência de notificações, respeitando o estado atual da infraestrutura de push;
6. histórico profundo, comparações, regras avançadas, exportações e análises como candidatos naturais ao PRO.

## Web Push

O código de Web Push existente não foi reativado nesta fase.

Há infraestrutura preservada no repositório, mas contratos atuais mantêm o gerenciador fora do shell global enquanto a funcionalidade estiver suspensa. A evolução do painel não deve contornar essa decisão. Qualquer retorno de alertas personalizados deve ocorrer em uma etapa própria, com revisão de runtime, consentimento, preferências e entrega.

## Proteções

`tests/free-account-favorites.test.ts` agora também protege que:

- o resumo vivo exista;
- ele apareça antes da área `Para meu site`;
- favoritos permaneçam na experiência pessoal;
- os dados venham da consolidação meteorológica real;
- avisos sejam filtrados por relevância para Pelotas;
- existam rotas de aprofundamento;
- falhas não sejam preenchidas com dados inventados;
- o layout seja responsivo e preserve foco visível.

`tests/account-live-dashboard.test.ts` adiciona uma verificação focada da mesma arquitetura na suíte ampla.
