# Histórico pessoal da conta

Data: 13/09/2026

## Objetivo

Concluir o primeiro módulo histórico do `/painel` usando a Historical Data Layer que já existe no projeto, sem criar uma segunda base e sem expor o arquivo privado diretamente ao navegador.

## Contrato de acesso

O recurso nasce disponível para contas cadastradas Free. Neste estágio não existe corte comercial de dias entre Free e PRO. A estrutura de entitlement continua preparada para uma decisão futura, mas o Free atual usa histórico amplo.

## Segurança

A tabela `historical_measurements` continua revogada para `anon` e `authenticated` e acessível somente ao `service_role`.

A server function do histórico:

1. autentica a sessão com o cliente público e cookies da requisição;
2. lê o estado da conta e resolve os entitlements;
3. somente depois cria o cliente administrativo;
4. consulta exclusivamente a série solicitada;
5. devolve resposta privada com `Cache-Control: private, no-store`.

O navegador nunca recebe a service role e não ganha acesso direto à tabela histórica.

## Primeira superfície

A primeira versão trabalha com nível d'água arquivado em:

- Laranjal;
- Rio Grande;
- São Lourenço do Sul;
- Arambaré;
- São José do Norte;
- Itapuã;
- Guaíba no Gasômetro;
- Guaíba no Cais Mauá.

Os períodos de exploração são 7, 30 e 60 dias.

## Integridade temporal

A consulta aceita somente `data_class = observation` e `variable_key = water_level`.

Para manter o gráfico leve, séries extensas podem ser amostradas para renderização. A amostragem escolhe pontos que já existem na série, preserva início e fim e nunca cria valores intermediários, médias artificiais ou interpolação de lacunas.

O `HydrologyLevelChart` existente continua responsável por detectar lacunas, movimento recente, mínimo, máximo e variação.

## Próximos módulos

Comparações avançadas e exportações continuam fora desta entrega. Quando forem implementadas, devem reutilizar o mesmo arquivo canônico e respeitar as regras documentais de cada fonte.
