import "./FloodVisitorGuide.css";

export type FloodVisitorGuideYear = "1941" | "2001" | "2015" | "2024";

type FloodVisitorGuideCopy = {
  title: string;
  happened: string;
  cause: string;
  impact: string;
  numbers: string;
};

const FLOOD_VISITOR_GUIDES: Record<FloodVisitorGuideYear, FloodVisitorGuideCopy> = {
  "1941": {
    title: "Entenda a enchente de 1941 sem precisar conhecer termos técnicos",
    happened:
      "Pelotas enfrentou uma cheia prolongada. Fotografias e documentos preservados mostram áreas tomadas pela água e permitem reconstruir uma marca histórica de 2,88 m no Canal São Gonçalo.",
    cause:
      "Os documentos disponíveis ajudam a reconstruir a dimensão da cheia, mas ainda não são suficientes para resumir toda a causa do evento em uma única explicação. Por isso a página separa o que está comprovado do que ainda é uma lacuna histórica.",
    impact:
      "Os registros conhecidos mostram a água em pontos de Pelotas, especialmente na região da Praça do Porto e do Canal São Gonçalo. Eles não permitem dizer que toda a cidade ficou sob a mesma altura de água.",
    numbers:
      "Quando você ler 2,88 m, pense em uma leitura ligada a uma régua e a um ponto específico do Canal São Gonçalo. Não significa 2,88 m de água dentro das casas nem uma altura válida para todo o Laranjal ou para toda a Lagoa dos Patos.",
  },
  "2001": {
    title: "Entenda a enchente de 2001 em poucos minutos",
    happened:
      "Em 8 de outubro de 2001, Pelotas teve vento de até 105 km/h. A Lagoa avançou cerca de 600 metros para dentro do Laranjal, ondas chegaram a aproximadamente um metro e cerca de 3 mil pessoas ficaram isoladas na Z3.",
    cause:
      "Estudos posteriores indicam que ventos fortes de leste e nordeste dificultaram a saída da água da Lagoa para o oceano e também empurraram água em direção à costa de Pelotas. O vento foi uma peça central do episódio.",
    impact:
      "Laranjal e Z3 aparecem com destaque nos registros da época, com inundação, isolamento e danos. A página também acompanha a recuperação dos acessos e do balneário depois do evento.",
    numbers:
      "Você verá 2,90 m e 1,90 m para o mesmo dia na régua histórica. Isso não é um erro do site: o arquivo da ANA preserva o dado bruto, isto é, o registro original, e o dado consistido, isto é, um valor revisado depois e marcado como estimado. Como não encontramos o documento que explique especificamente a diferença de 1 metro, mostramos os dois em vez de escolher um silenciosamente.",
  },
  "2015": {
    title: "Entenda por que a enchente de 2015 durou tantos dias",
    happened:
      "Pelotas recebeu muita chuva e, ao mesmo tempo, havia grande quantidade de água chegando de outras partes da região. Lagoa dos Patos e Canal São Gonçalo ficaram elevados e áreas baixas do Laranjal, Z3, Barra e arredores sofreram com a inundação.",
    cause:
      "A cheia foi resultado de uma combinação: chuva intensa em Pelotas, água vinda da Lagoa Mirim e de rios regionais, contribuição do Guaíba para a Lagoa dos Patos e vento desfavorável à saída da água para o mar.",
    impact:
      "Houve resgates, abrigos, interrupção preventiva de energia, isolamento de comunidades e obras emergenciais. O balanço municipal registra cerca de 1.300 famílias atendidas ao longo de toda a ocorrência.",
    numbers:
      "Até 20 de outubro, a Prefeitura informava 299 mm de chuva no mês, diante de uma média de 101 mm citada para outubro. Já os números de nível, como 2,20 m no São Gonçalo, pertencem a réguas específicas. Eles ajudam a acompanhar a cheia, mas não representam a profundidade da água em todos os bairros.",
  },
  "2024": {
    title: "Entenda por que a enchente de 2024 chegou depois a Pelotas",
    happened:
      "A água que inundou Pelotas não veio apenas da chuva que caiu na cidade. Parte importante do volume percorreu rios do Centro e do Norte do Rio Grande do Sul, passou pelo Guaíba e avançou lentamente pela Lagoa dos Patos até chegar ao sul do Estado.",
    cause:
      "Foi uma combinação de enorme volume de água vindo de outras bacias, chuva local, níveis elevados da Lagoa dos Patos e do Canal São Gonçalo, além de vento, maré e condições de saída da água pelo estuário de Rio Grande.",
    impact:
      "Laranjal, Z3, Pontal da Barra e outras áreas baixas foram atingidos por uma inundação prolongada. A emergência continuou em Pelotas mesmo quando o pior momento já havia passado em Porto Alegre.",
    numbers:
      "O Canal São Gonçalo chegou a 3,04 m na régua usada durante a emergência. Esse número é a leitura daquele ponto de monitoramento, não a altura da água em todas as casas. O mesmo cuidado vale ao comparar Pelotas, Guaíba e outras estações.",
  },
};

export function FloodVisitorGuide({ year }: { year: FloodVisitorGuideYear }) {
  const copy = FLOOD_VISITOR_GUIDES[year];

  return (
    <section className="tp-flood-visitor" aria-labelledby={`tp-flood-visitor-${year}`}>
      <header className="tp-flood-visitor__header">
        <span>Antes dos detalhes</span>
        <h2 id={`tp-flood-visitor-${year}`}>{copy.title}</h2>
        <p>
          Esta parte foi escrita para quem só quer entender o que aconteceu. Os documentos, medições
          e explicações técnicas continuam disponíveis mais abaixo na página.
        </p>
      </header>

      <div className="tp-flood-visitor__grid">
        <article>
          <span>O que aconteceu</span>
          <p>{copy.happened}</p>
        </article>
        <article>
          <span>Por que aconteceu</span>
          <p>{copy.cause}</p>
        </article>
        <article>
          <span>Quem e onde foi afetado</span>
          <p>{copy.impact}</p>
        </article>
        <article className="tp-flood-visitor__numbers">
          <span>Como ler os números</span>
          <p>{copy.numbers}</p>
        </article>
      </div>

      <div className="tp-flood-visitor__glossary">
        <strong>Se aparecer um termo técnico, leia assim:</strong>
        <p>
          <b>Régua</b> é o ponto onde o nível da água é medido. <b>Cota ou nível</b> é a leitura nessa
          régua, não a profundidade da inundação em toda a cidade. <b>Dado bruto</b> é o registro
          original; <b>dado consistido</b> é um valor revisado depois de uma checagem. <b>Zero ou
          referência da régua</b> é o ponto de partida usado naquela medição. Por isso, números de
          réguas diferentes não devem ser comparados como se usassem a mesma escala.
        </p>
      </div>
    </section>
  );
}
