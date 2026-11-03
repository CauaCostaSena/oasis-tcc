import Link from "next/link";
import Reveal from "@/components/Reveal";

const passos = [
  ["1", "Defina a busca", "Escolha linguagem de programação, localização e outros filtros."],
  ["2", "Veja os candidatos", "Cards organizados com dados públicos do GitHub."],
  ["3", "Analise o perfil", "Repositórios, linguagens, estrelas e projetos em um só lugar."],
  ["4", "Organize e compare", "Favorite, avalie em privado e compare lado a lado."],
];

const recursos = [
  ["Busca por linguagem", "Encontre desenvolvedores pelas linguagens dos repositórios públicos."],
  ["Perfil técnico", "Bio, localização declarada e projetos reunidos numa página."],
  ["Favoritos e avaliações", "Anotações privadas, visíveis só para a sua empresa."],
  ["Comparação lado a lado", "Compare candidatos sem ranking automático: a decisão é sua."],
  ["Histórico de buscas", "Retome pesquisas anteriores e acompanhe o uso da plataforma."],
];

// Valores e limites provisórios, a definir.
const planos = [
  ["Gratuito", "R$ 0", ["20 buscas por mês", "10 favoritos", "Comparação de até 3 candidatos"]],
  ["Profissional", "A definir", ["200 buscas por mês", "100 favoritos", "Comparação de até 3 candidatos"]],
  ["Empresarial", "A definir", ["Buscas ilimitadas", "Favoritos ilimitados", "Suporte prioritário"]],
] as const;

const botao =
  "inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors";

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <span className="text-xl font-bold text-primary">Oásis</span>
          <div className="flex items-center gap-3">
            <Link href="/login" className={`${botao} text-primary hover:bg-primary-soft`}>
              Entrar
            </Link>
            <Link href="/cadastro" className={`${botao} bg-primary text-white hover:bg-primary-hover`}>
              Cadastrar empresa
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 py-20 text-center sm:py-28">
          <Reveal>
            <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
              Encontre os desenvolvedores certos <span className="text-primary">no GitHub</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
              O Oásis reúne dados públicos do GitHub para sua empresa pesquisar, organizar e comparar
              candidatos em um único lugar.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/cadastro" className={`${botao} bg-primary text-white hover:bg-primary-hover`}>
                Começar agora
              </Link>
              <a href="#como-funciona" className={`${botao} border border-border bg-surface hover:bg-primary-soft`}>
                Como funciona
              </a>
            </div>
          </Reveal>
        </section>

        <section id="como-funciona" className="mx-auto max-w-6xl scroll-mt-16 px-6 py-16">
          <Reveal>
            <h2 className="text-center text-3xl font-bold">Como funciona</h2>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {passos.map(([n, titulo, texto]) => (
              <Reveal key={n}>
                <div className="h-full rounded-xl border border-border bg-surface p-6 transition-transform hover:-translate-y-1">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft font-bold text-primary">
                    {n}
                  </span>
                  <h3 className="mt-4 font-semibold">{titulo}</h3>
                  <p className="mt-2 text-sm text-muted">{texto}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <Reveal>
            <h2 className="text-center text-3xl font-bold">O que você encontra</h2>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recursos.map(([titulo, texto]) => (
              <Reveal key={titulo}>
                <div className="h-full rounded-xl border border-border bg-surface p-6">
                  <h3 className="font-semibold text-primary">{titulo}</h3>
                  <p className="mt-2 text-sm text-muted">{texto}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted">
              Os dados vêm de perfis públicos e podem estar incompletos. Eles apoiam a análise, mas não
              substituem a avaliação da sua equipe.
            </p>
          </Reveal>
        </section>

        <section id="planos" className="mx-auto max-w-6xl scroll-mt-16 px-6 py-16">
          <Reveal>
            <h2 className="text-center text-3xl font-bold">Planos</h2>
          </Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {planos.map(([nome, preco, itens]) => (
              <Reveal key={nome}>
                <div className="flex h-full flex-col rounded-xl border border-border bg-surface p-6">
                  <h3 className="text-lg font-semibold">{nome}</h3>
                  <p className="mt-2 text-3xl font-bold text-primary">{preco}</p>
                  <ul className="mt-4 flex-1 space-y-2 text-sm text-muted">
                    {itens.map((i) => (
                      <li key={i}>✓ {i}</li>
                    ))}
                  </ul>
                  <Link href="/cadastro" className={`${botao} mt-6 border border-primary text-primary hover:bg-primary-soft`}>
                    Escolher
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="px-6 py-20 text-center">
          <Reveal>
            <h2 className="text-3xl font-bold">Pronto para pesquisar?</h2>
            <Link href="/cadastro" className={`${botao} mt-6 bg-primary text-white hover:bg-primary-hover`}>
              Cadastrar minha empresa
            </Link>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-sm text-muted">
        Oásis — projeto de TCC, SENAI. Dados públicos fornecidos pelo GitHub.
      </footer>
    </>
  );
}
