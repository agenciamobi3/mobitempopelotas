# Ficha cadastral ANA / RHN da estação 87955001

Data: 08/09/2026

## Objetivo

Enriquecer `/nivel-da-lagoa-dos-patos-laranjal` com o cadastro oficial da estação `87955001` na Rede Hidrometeorológica Nacional sem promover a medição ANA ao número principal da página.

A ficha é **cadastral**, não operacional.

## Fonte oficial

Camada pública:

`https://portal1.snirh.gov.br/server/rest/services/Estações_Hidrometeorológicas_SNIRH/FeatureServer/0`

Consulta exata:

`CodigoAdicional='87955001'`

A chamada acontece no servidor, por HTTPS, sem token, cookie ou API key.

## Campos aproveitados

Somente metadados cadastrais são solicitados:

- código adicional `87955001`;
- nome e descrição;
- tipo de estação;
- situação cadastral de operação;
- município e UF;
- rio, bacia e sub-bacia;
- latitude e longitude;
- altitude e área de drenagem quando publicadas;
- instituição responsável;
- instituição operadora;
- presença e datas cadastradas de régua de nível;
- presença e datas cadastradas de registrador de nível;
- presença e datas cadastradas de telemetria;
- data de alteração do cadastro quando publicada.

A integração não solicita:

- `Ult_Dado`;
- `Data_ult_dado`;
- `Status_Dado`;
- valor de nível;
- série temporal;
- vazão atual;
- qualquer campo usado para criar a medição principal da página.

## Apresentação pública

Componente:

`src/components/hydrology/AnaRhnLaranjalStationProfile.tsx`

A ficha aparece somente quando a consulta devolve a estação exata com contrato válido.

Ela apresenta conteúdo concreto, sem tags genéricas de preenchimento:

- código;
- local;
- corpo d'água;
- tipo de estação;
- situação cadastral;
- responsável;
- operadora;
- área de drenagem quando publicada;
- equipamentos realmente cadastrados;
- datas dos equipamentos quando publicadas.

Campos ausentes não são substituídos por textos inventados.

Se a consulta falhar ou a estação não aparecer, o componente retorna `null` e a página continua normalmente.

## Regra editorial

O antigo bloco genérico `OfficialDataAccessNotice` foi retirado de `/nivel-da-lagoa-dos-patos-laranjal`.

A página deixa de explicar no meio do conteúdo que a integração ANA está “em implantação”. Em seu lugar, mostra o que existe de fato para `87955001` e concentra a explicação metodológica no fechamento da ficha.

O fechamento informa que:

- a ficha descreve o cadastro da estação;
- a ficha não cria uma terceira leitura pública;
- a régua `87955001` não é convertida para LabHidroSens/UFPel;
- a régua `87955001` não é convertida para CIEX/FURG;
- a medição ANA continua fora do número principal enquanto a referência vertical não estiver confirmada.

## Relação com as fontes atuais

O seletor de leitura local não muda:

1. LabHidroSens/UFPel enquanto a leitura estiver atualizada;
2. CIEX/FURG sensor Pelotas (`sensor_7`) quando a fonte principal estiver stale/unavailable;
3. last-known da própria Estação Laranjal quando aplicável e claramente datado.

A `87955001` não participa desse seletor nesta etapa.

## Resiliência

A ficha é carregada dentro do mesmo budget de 2,5 s usado pelas dependências hidrológicas públicas.

Falha da ficha não derruba:

- nível atual;
- gráfico recente;
- contexto meteorológico;
- embed;
- conteúdo educativo;
- SEO da rota.

## Arquivos principais

- `src/lib/hydrology/ana-rhn-laranjal-profile.server.ts`
- `src/lib/hydrology/ana-rhn-laranjal-profile.functions.ts`
- `src/components/hydrology/AnaRhnLaranjalStationProfile.tsx`
- `src/components/hydrology/AnaRhnLaranjalStationProfile.module.css`
- `src/lib/hydrology/public-hydrology-page-loader.ts`
- `src/routes/nivel-da-lagoa-dos-patos-laranjal.tsx`
- `tests/ana-rhn-laranjal-profile.test.ts`

## Próximo gate

Antes de qualquer uso público da medição ANA da `87955001`, ainda é obrigatório documentar a referência vertical/zero/RN aplicável à estação e confirmar que a unidade, horário, status e significado do valor recebido permitem publicação sem mistura de referenciais.
