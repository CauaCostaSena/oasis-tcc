import Link from "next/link";
import {
  ArrowRight,
  ArrowUp,
  Bookmark,
  Clock,
  Code2,
  FolderHeart,
  GitCompareArrows,
  MapPin,
  NotebookPen,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import BarraRolagem from "@/components/BarraRolagem";
import BotaoTema from "@/components/BotaoTema";
import Logo from "@/components/Logo";
import { PastaVisual } from "@/components/Pastas";
import Planos from "@/components/Planos";
import Tilt from "@/components/Tilt";

const passos = [
  ["Defina a busca", "Escolha linguagem de programação, localização e outros filtros."],
  ["Veja os candidatos", "Cards organizados com dados públicos do GitHub."],
  ["Analise o perfil", "Repositórios, linguagens, estrelas e projetos em um só lugar."],
  ["Organize e compare", "Guarde em pastas, avalie em privado e compare lado a lado."],
];

const recursos = [
  [Code2, "Busca por linguagem", "Encontre desenvolvedores pelas linguagens dos repositórios públicos."],
  [UserRound, "Perfil técnico", "Bio, localização declarada e projetos reunidos numa página."],
  [NotebookPen, "Avaliações privadas", "Anotações e notas visíveis só para a sua empresa."],
  [GitCompareArrows, "Comparação lado a lado", "Compare candidatos sem ranking automático: a decisão é sua."],
  [Clock, "Histórico de buscas", "Retome pesquisas anteriores e acompanhe o uso da plataforma."],
] as const;

const exemplos = [
  ["Ana Souza", "@anasouza", ["TypeScript", "Python", "Go"]],
  ["Bruno Lima", "@brunolima", ["TypeScript", "Go"]],
  ["Carla Dias", "@carladias", ["Go", "Rust"]],
] as const;

const secoes = [
  ["#como-funciona", "Como funciona"],
  ["#recursos", "Recursos"],
  ["#pastas", "Pastas"],
  ["#planos", "Planos"],
];

export default function Home() {
  return (
    <>
      <BarraRolagem />
      <header className="vidro sticky top-0 z-30 border-b border-border">
        <nav className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:gap-6 sm:px-6">
          <Logo />
          <ul className="hidden flex-1 gap-6 text-sm font-medium text-muted md:flex">
            {secoes.map(([href, nome]) => (
              <li key={href}>
                <a href={href} className="transition-colors hover:text-primary">
                  {nome}
                </a>
              </li>
            ))}
          </ul>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <BotaoTema />
            <Link href="/login" className="btn btn-ghost !px-3 sm:!px-4">
              Entrar
            </Link>
            <Link href="/cadastro" className="btn btn-primary">
              Cadastrar <ArrowRight size={16} className="seta hidden sm:block" />
            </Link>
          </div>
        </nav>
      </header>

      <main className="overflow-x-clip">
        {/* Abertura: o único momento autoral de movimento da página */}
        <section className="mx-auto grid max-w-6xl items-center gap-14 px-6 pb-20 pt-14 sm:pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:pb-28">
          <div className="hero-texto">
            <h1 className="text-4xl font-bold leading-[1.08] sm:text-6xl">
              Encontre os desenvolvedores certos <span className="text-primary">no GitHub.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted">
              O Oásis reúne dados públicos do GitHub para sua empresa pesquisar, organizar e comparar candidatos em um
              único lugar.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/cadastro" className="btn btn-primary !px-6 !py-3">
                Começar agora <ArrowRight size={16} className="seta" />
              </Link>
              <a href="#como-funciona" className="btn btn-outline !px-6 !py-3">
                Como funciona
              </a>
            </div>
          </div>

          <div className="hero-card">
            <Tilt max={14} className="mx-auto max-w-sm">
              <article className="card overflow-hidden shadow-2xl">
                <div className="h-24 bg-gradient-to-br from-teal-400 via-cyan-600 to-teal-900" />
                <div className="px-6 pb-6">
                  <span className="display -mt-9 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border-4 border-surface bg-primary text-2xl font-bold text-on-primary">
                    A
                  </span>
                  <div className="mt-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">Ana Souza</p>
                      <p className="text-sm text-muted">@anasouza · exemplo</p>
                    </div>
                    <span className="chip">
                      <Bookmark size={12} fill="currentColor" /> Favorita
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-muted">Desenvolvedora back-end. APIs, dados e código aberto.</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {["TypeScript", "Python", "Go"].map((l) => (
                      <span key={l} className="chip">
                        {l}
                      </span>
                    ))}
                  </div>
                  <dl className="mt-5 grid grid-cols-3 divide-x divide-border rounded-2xl border border-border py-3 text-center">
                    {[
                      ["48", "Repositórios"],
                      ["1,2 mil", "Seguidores"],
                      ["Salvador", "Local"],
                    ].map(([v, l]) => (
                      <div key={l} className="px-2">
                        <dd className="text-sm font-bold">{v}</dd>
                        <dt className="text-xs text-muted">{l}</dt>
                      </div>
                    ))}
                  </dl>
                </div>
              </article>
            </Tilt>
            <p className="mt-4 hidden text-center text-xs text-muted [@media(hover:hover)]:block">
              Cartão de exemplo: passe o mouse para inclinar
            </p>
          </div>
        </section>

        {/* Como funciona: a ordem importa, então é um fluxo */}
        <section id="como-funciona" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20 sm:py-28">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div>
              <h2 className="text-3xl font-bold sm:text-5xl">Da busca à decisão em quatro passos</h2>
              <p className="subtitulo mt-4 max-w-sm">Sem planilha e sem abrir um perfil por vez.</p>
            </div>
            <ol>
              {passos.map(([titulo, texto], i) => (
                <li key={titulo} className="relative flex gap-5 pb-10 last:pb-0">
                  {i < passos.length - 1 && <span aria-hidden className="absolute bottom-0 left-[1.0625rem] top-10 w-px bg-border" />}
                  <span className="display relative flex h-[2.125rem] w-[2.125rem] shrink-0 items-center justify-center rounded-full border border-primary bg-background text-sm font-bold text-primary">
                    {i + 1}
                  </span>
                  <div className="pt-1">
                    <h3 className="text-lg font-semibold">{titulo}</h3>
                    <p className="mt-1.5 max-w-md text-muted">{texto}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Recursos: lista à esquerda, prévia da busca à direita */}
        <section id="recursos" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20 sm:py-28">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 className="text-3xl font-bold sm:text-5xl">O que você encontra</h2>
              <ul className="mt-10 divide-y divide-border border-y border-border">
                {recursos.map(([Icone, titulo, texto]) => (
                  <li key={titulo} className="flex gap-4 py-5">
                    <Icone size={20} className="mt-0.5 shrink-0 text-primary" />
                    <div>
                      <h3 className="font-semibold">{titulo}</h3>
                      <p className="mt-1 text-sm text-muted">{texto}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:pt-24">
              <div className="card p-5" role="img" aria-label="Exemplo ilustrativo de busca por linguagem e localização">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="chip">TypeScript</span>
                  <span className="chip">Go</span>
                  <span className="chip chip-neutro">
                    <MapPin /> Salvador
                  </span>
                </div>
                <ul className="mt-4 divide-y divide-border">
                  {exemplos.map(([nome, usuario, langs]) => (
                    <li key={usuario} className="flex items-center gap-3 py-3">
                      <span className="display flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft font-bold text-primary">
                        {nome[0]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{nome}</p>
                        <p className="truncate text-xs text-muted">{usuario}</p>
                      </div>
                      <div className="hidden gap-1.5 sm:flex">
                        {langs.map((l) => (
                          <span key={l} className="chip chip-neutro">
                            {l}
                          </span>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-muted">Exemplo ilustrativo, com perfis fictícios.</p>
              </div>
              <p className="mt-6 flex items-start gap-3 text-sm text-muted">
                <ShieldCheck size={18} className="mt-0.5 shrink-0 text-primary" />
                Os dados vêm de perfis públicos e podem estar incompletos. Eles apoiam a análise, mas não substituem a
                avaliação da sua equipe.
              </p>
            </div>
          </div>
        </section>

        {/* Pastas */}
        <section id="pastas" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20 sm:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold sm:text-5xl">Guarde candidatos em pastas</h2>
              <p className="mt-5 max-w-md text-muted">
                Crie pastas por vaga ou etapa, como “Front-end” ou “Entrevistar”, e mova os favoritos entre elas. Tudo
                fica visível só para a sua empresa.
              </p>
              {/* Sem mouse (celular) as pastas já aparecem abertas, então a dica só faz sentido no desktop. */}
              <p className="mt-6 hidden items-center gap-2 text-sm font-semibold text-primary [@media(hover:hover)]:flex">
                <FolderHeart size={18} /> Passe o mouse nas pastas ao lado
              </p>
            </div>
            <div className="pastas-demo grid grid-cols-2 gap-5">
              <PastaVisual nome="Front-end" total={7} cor={0} papeis={["marina", "joaopedro", "lucasdev"]} />
              <PastaVisual nome="Entrevistar" total={3} cor={1} papeis={["rafa", "bia-codes", "theo"]} />
            </div>
          </div>
        </section>

        {/* Planos */}
        <section id="planos" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20 sm:py-28">
          <h2 className="text-center text-3xl font-bold sm:text-5xl">Um plano para cada equipe</h2>
          <Planos />
        </section>

        {/* Chamada final */}
        <section className="px-6 pb-20 pt-8 sm:pb-28">
          <div className="card mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12 sm:px-12 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-bold sm:text-4xl">Pronto para pesquisar?</h2>
              <p className="mt-3 max-w-md text-muted">Cadastre sua empresa em um minuto e faça a primeira busca hoje.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/cadastro" className="btn btn-primary !px-6 !py-3">
                Cadastrar minha empresa <ArrowRight size={16} className="seta" />
              </Link>
              <Link href="/login" className="btn btn-outline !px-6 !py-3">
                Já tenho conta
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 text-sm text-muted">
          <Logo className="!text-base text-foreground" />
          <p>Projeto de TCC, SENAI. Dados públicos fornecidos pelo GitHub.</p>
          <a href="#" className="btn btn-ghost">
            Voltar ao topo <ArrowUp size={16} />
          </a>
        </div>
      </footer>
    </>
  );
}
