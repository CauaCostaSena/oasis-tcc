import Link from "next/link";
import { Suspense } from "react";
import CardCandidato from "@/components/CardCandidato";
import { executarBusca } from "@/lib/busca";
import { db } from "@/lib/db";
import { MAX_PAGINAS, type Filtros } from "@/lib/github";
import { empresaAtual } from "@/lib/session";

export const metadata = { title: "Buscar candidatos — Oásis" };

const LINGUAGENS = [
  "Python", "JavaScript", "TypeScript", "Java", "C#", "PHP", "Go", "Rust",
  "Kotlin", "Swift", "Ruby", "C++", "C", "Dart",
];

type Params = Record<string, string | string[] | undefined>;

const texto = (v: Params[string]) => (typeof v === "string" ? v.trim().slice(0, 60) : "");
const inteiro = (v: Params[string], max: number) => {
  const n = parseInt(texto(v), 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, max) : undefined;
};

const campo =
  "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft";

export default function Busca({ searchParams }: PageProps<"/busca">) {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <Suspense fallback={<p className="text-muted">Carregando...</p>}>
        <Conteudo searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

// Lê sessão e parâmetros da URL em tempo de requisição, por isso fica dentro do Suspense.
async function Conteudo({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const empresa = await empresaAtual();

  const filtros: Filtros = {
    linguagem: LINGUAGENS.includes(texto(sp.linguagem)) ? texto(sp.linguagem) : undefined,
    localizacao: texto(sp.localizacao) || undefined,
    minRepos: inteiro(sp.minRepos, 10000),
    minSeguidores: inteiro(sp.minSeguidores, 1000000),
  };
  const pagina = inteiro(sp.pagina, MAX_PAGINAS) ?? 1;
  const buscou = Boolean(sp.buscar);
  const temCriterio = Boolean(filtros.linguagem || filtros.localizacao);

  let erro: string | undefined;
  let r: Awaited<ReturnType<typeof executarBusca>>["resultado"];
  if (buscou && !temCriterio) {
    erro = "Escolha uma linguagem ou informe uma localização.";
  } else if (buscou) {
    try {
      ({ erro, resultado: r } = await executarBusca(empresa, filtros, pagina));
    } catch (e) {
      const status = (e as { status?: number }).status;
      erro =
        status === 403 || status === 429
          ? "O GitHub limitou as consultas por agora. Tente novamente em alguns instantes."
          : "Não foi possível consultar o GitHub. Tente novamente.";
    }
  }

  const favoritos = new Set(
    r
      ? (
          await db.favorito.findMany({
            where: { empresaId: empresa.id, githubLogin: { in: r.perfis.map((p) => p.login) } },
          })
        ).map((f) => f.githubLogin)
      : [],
  );

  const qs = (p: number) => {
    const u = new URLSearchParams({ buscar: "1", pagina: String(p) });
    for (const [k, v] of Object.entries(filtros)) if (v) u.set(k, String(v));
    return `/busca?${u}`;
  };

  return (
    <>
      <h1 className="text-2xl font-bold">Buscar candidatos</h1>

      <form className="mt-6 grid gap-4 rounded-xl border border-border bg-surface p-5 sm:grid-cols-2 lg:grid-cols-5">
        <input type="hidden" name="buscar" value="1" />
        <label className="text-sm font-medium">
          Linguagem
          <select name="linguagem" defaultValue={filtros.linguagem ?? ""} className={campo}>
            <option value="">Qualquer</option>
            {LINGUAGENS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Localização
          <input name="localizacao" defaultValue={filtros.localizacao} placeholder="Ex.: Brasil" className={campo} />
        </label>
        <label className="text-sm font-medium">
          Mín. repositórios
          <input name="minRepos" type="number" min={0} defaultValue={filtros.minRepos} className={campo} />
        </label>
        <label className="text-sm font-medium">
          Mín. seguidores
          <input name="minSeguidores" type="number" min={0} defaultValue={filtros.minSeguidores} className={campo} />
        </label>
        <button className="self-end rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover">
          Buscar
        </button>
      </form>

      {erro && (
        <p role="alert" className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {erro}
        </p>
      )}

      {r && (
        <section className="mt-8">
          <p className="text-sm text-muted">
            {r.total.toLocaleString("pt-BR")} perfis encontrados
            {r.total > MAX_PAGINAS * 12 && " (o GitHub exibe até 1.000)"}. Dados públicos, sujeitos a estarem incompletos.
          </p>

          {r.perfis.length === 0 ? (
            <p className="mt-6 text-muted">Nenhum candidato para esses filtros.</p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {r.perfis.map((p) => (
                <CardCandidato key={p.login} p={p} favorito={favoritos.has(p.login)} />
              ))}
            </div>
          )}

          {r.paginas > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-4 text-sm" aria-label="Paginação">
              {pagina > 1 && (
                <Link href={qs(pagina - 1)} className="font-semibold text-primary hover:underline">
                  ← Anterior
                </Link>
              )}
              <span className="text-muted">
                Página {pagina} de {r.paginas}
              </span>
              {pagina < r.paginas && (
                <Link href={qs(pagina + 1)} className="font-semibold text-primary hover:underline">
                  Próxima →
                </Link>
              )}
            </nav>
          )}
        </section>
      )}
    </>
  );
}
