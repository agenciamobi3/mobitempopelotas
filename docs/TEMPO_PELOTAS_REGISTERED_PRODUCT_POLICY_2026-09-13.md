# Tempo Pelotas — política atual dos produtos cadastrados

Data: 13/09/2026  
Branch operacional: `main`

## Decisão atual

O Tempo Pelotas não está antecipando monetização enquanto as ferramentas cadastradas ainda estão sendo amadurecidas.

A regra de produto vigente é:

```text
portal público -> continua amplo e aberto
conta cadastrada Free -> recebe os recursos de conta já implementados
PRO -> permanece como capacidade técnica para evolução futura, sem transformar automaticamente recurso novo em paywall
```

Um recurso novo só deve ser classificado como PRO quando houver definição explícita de planos, limites, proposta de valor e política de transição.

Até essa decisão existir, a implementação não deve usar linguagem como `Produto PRO`, `assine para desbloquear` ou equivalente para recursos que nasceram na experiência cadastrada.

## Observatório

O Observatório passa a fazer parte da conta Free cadastrada nesta fase.

Contrato atual:

```text
visitante sem login -> redireciona para /conta?next=/observatorio
conta ativa cadastrada -> acesso permitido
conta suspensa/expirada -> acesso negado pelo gate server-side
admin confirmado -> acesso permitido pela exceção administrativa já existente
```

O entitlement `observatoryAccess` permanece no modelo porque ele será útil quando os planos forem formalizados, mas atualmente é `true` tanto no conjunto Free quanto no PRO.

A rota continua privada para mecanismos de busca e fora do inventário público. Isso é uma decisão de superfície autenticada, não um paywall.

## Painel autenticado

O `/painel` deixa de se comportar como uma página editorial longa e passa a funcionar como workspace.

Estrutura atual:

- sidebar fixa em desktop;
- rail compacta em tablet;
- navegação inferior no celular;
- topbar curta com identidade e ações da conta;
- resumo de conta em faixa;
- Painel Vivo;
- Favoritos Vivos;
- seção de ferramentas com Observatório e Gerador de Widgets;
- próximos recursos em bloco compacto;
- footer mínimo, sem duplicar o footer público completo.

A navegação lateral organiza recursos de conta e atalhos do portal sem duplicar a arquitetura editorial pública.

## Favoritos

Os favoritos ativos continuam visíveis na visão geral.

O catálogo completo passou a ficar recolhido em `Gerenciar favoritos`, evitando que a página principal cresça verticalmente apenas para oferecer configuração.

## Regra para próximos recursos

Ao implementar uma nova ferramenta cadastrada:

1. entregar primeiro uma experiência funcional e segura;
2. integrá-la ao workspace da conta;
3. manter dados públicos públicos quando a origem já for pública;
4. não marcar como PRO por padrão;
5. criar entitlement quando houver necessidade arquitetural, sem assumir que isso já representa cobrança;
6. só aplicar restrição comercial após decisão específica de produto.

## Documentação histórica

Documentos anteriores do Observatório descrevem a política inicial em que Free não tinha acesso e PRO tinha. Essa parte é histórica e foi substituída por esta decisão de 13/09/2026.

A arquitetura de segurança, lazy loading, Cesium, CSP, fontes e separação entre público/autenticado continua válida onde não conflitar com esta política atual.
