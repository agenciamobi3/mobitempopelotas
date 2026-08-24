import { DataSourceCard } from "./DataSourceCard";

export function TempoPelotasAboutPage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10">
      <section>
        <h1 className="text-3xl font-bold">Tempo Pelotas</h1>
        <p className="mt-4 text-lg">
          Uma plataforma de disseminação de informações meteorológicas,
          ambientais e hidrológicas para Pelotas e região.
        </p>
        <p className="mt-3">
          O projeto organiza informações técnicas de diferentes fontes para
          aproximar dados importantes da comunidade em uma experiência digital
          simples, acessível e transparente.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Nossa missão</h2>
        <p className="mt-3">
          Facilitar o acesso a informações sobre tempo, clima, água e eventos
          extremos, ajudando moradores, estudantes, pesquisadores e interessados
          a compreender melhor as condições ambientais da região.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Tecnologia desenvolvida pela MOBI</h2>
        <p className="mt-3">
          O Tempo Pelotas é um projeto tecnológico desenvolvido pela MOBI -
          Marketing Inteligente, utilizando integração de APIs, processamento de
          dados e interfaces digitais para transformar informações técnicas em
          uma experiência mais clara para o usuário.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Como funciona</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <div><h3 className="font-semibold">Fontes</h3><p className="mt-2">Dados meteorológicos, ambientais e hidrológicos.</p></div>
          <div><h3 className="font-semibold">Integração</h3><p className="mt-2">Conexão com serviços e APIs disponíveis.</p></div>
          <div><h3 className="font-semibold">Organização</h3><p className="mt-2">Tratamento dos dados para facilitar consultas.</p></div>
          <div><h3 className="font-semibold">Informação</h3><p className="mt-2">Apresentação em painéis e páginas digitais.</p></div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Fontes de informação</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <DataSourceCard name="INMET" description="Dados e avisos meteorológicos oficiais." />
          <DataSourceCard name="Embrapa Clima Temperado" description="Informações meteorológicas locais e pesquisa aplicada." />
          <DataSourceCard name="UFPEL / CPMET" description="Conhecimento científico e estudos meteorológicos regionais." />
          <DataSourceCard name="Sistemas públicos" description="Monitoramento, alertas e informações ambientais." />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">O que você encontra</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6">
          <li>Painel meteorológico e previsão do tempo.</li>
          <li>Informações regionais e páginas municipais.</li>
          <li>Monitoramento hidrológico.</li>
          <li>Históricos de eventos climáticos importantes.</li>
          <li>Conteúdos educativos sobre clima e ambiente.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Transparência</h2>
        <p className="mt-3">
          O Tempo Pelotas organiza e dissemina informações. A tecnologia da MOBI
          facilita o acesso aos dados, mas registros meteorológicos e alertas
          permanecem vinculados às fontes responsáveis.
        </p>
      </section>
    </main>
  );
}
