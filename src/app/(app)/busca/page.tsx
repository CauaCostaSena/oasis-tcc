import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, ArrowRight, EyeOff, SearchX } from "lucide-react";
import CardCandidato from "@/components/CardCandidato";
import Carregando from "@/components/Carregando";
import Spotlight from "@/components/Spotlight";
import { executarBusca } from "@/lib/busca";
import { filtrosDaUrl, filtrosParaParams, temCriterio } from "@/lib/filtros";
import { MAX_PAGINAS, POR_PAGINA } from "@/lib/github";
import { favoritosDe, filtrosSalvos } from "@/lib/preferencias";
import { empresaAtual } from "@/lib/session";

export const metadata = { title: "Buscar candidatos — Oásis" };

type Params = Record<string, string | string[] | undefined>;

export default function Busca({ searchParams }: PageProps<"/busca">) {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <Suspense fallback={<Carregando cards={6} />}>
        <Conteudo searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

// Lê sessão e parâmetros da URL em tempo de requisição, por isso fica dentro do Suspense.
async function Conteudo({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const empresa = await empresaAtual();

  const filtros = filtrosDaUrl(sp);
  const pagina = Math.min(Math.max(parseInt(String(sp.pagina), 10) || 1, 1), MAX_PAGINAS);
  const buscou = Boolean(sp.buscar);
  const mostrarSalvos = sp.salvos === "1";

  let erro: string | undefined;
  let r: Awaited<ReturnType<typeof executarBusca>>["resultado"];
  if (buscou && !temCriterio(filtros)) {
    erro = "Digite um nome ou escolha pelo menos uma linguagem ou região.";
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

  // Quem a empresa já salvou não volta como indicação, a menos que o switch "Mostrar já salvos" esteja ligado.
  const salvos = r ? await favoritosDe(empresa.id, r.perfis.map((p) => p.login)) : new Map<string, string>();
  const visiveis = r ? (mostrarSalvos ? r.perfis : r.perfis.filter((p) => !salvos.has(p.login))) : [];
  const ocultos = r ? r.perfis.length - visiveis.length : 0;

  const qs = (p: number, verSalvos = mostrarSalvos) => {
    const u = filtrosParaParams(filtros);
    u.set("buscar", "1");
    if (p > 1) u.set("pagina", String(p));
    if (verSalvos) u.set("salvos", "1");
    return `/busca?${u}`;
  };

  return (
    <>
      <h1 className="text-3xl font-bold sm:text-4xl">Buscar candidatos</h1>
      <p className="subtitulo mt-2">Por nome, usuário, linguagem ou região, a partir de dados públicos do GitHub.</p>

      <div className="mt-6">
        {/* key: ao navegar para outra busca, a barra recomeça com os filtros da URL */}
        <Spotlight
          key={qs(1)}
          inicial={filtros}
          salvos={await filtrosSalvos(empresa.recrutador.id)}
          mostrarSalvos={mostrarSalvos}
        />
      </div>

      {erro && (
        <p role="alert" className="alerta mt-6">
          {erro}
        </p>
      )}

      {!buscou && (
        <p className="mt-6 text-sm text-muted">
          Cada busca confirmada conta no limite do plano. Para refazer uma anterior sem digitar,{" "}
          <Link href="/historico" className="font-semibold text-primary hover:underline">
            abra o histórico
          </Link>
          .
        </p>
      )}

      {r && (
        <section className="mt-8">
          <p className="text-sm text-muted">
            {r.total.toLocaleString("pt-BR")} perfis encontrados
            {r.total > MAX_PAGINAS * POR_PAGINA &&
              ` (exibindo os ${MAX_PAGINAS * POR_PAGINA} primeiros; refine os filtros para ver outros)`}
            . Dados públicos, sujeitos a estarem incompletos.
          </p>
          {(ocultos > 0 || mostrarSalvos) && (
            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="selo-salvo">
                <EyeOff size={12} />
                {mostrarSalvos
                  ? "Mostrando também quem a empresa já salvou"
                  : `${ocultos} já ${ocultos === 1 ? "salvo oculto" : "salvos ocultos"} nesta página`}
              </span>
              <Link href={qs(pagina, !mostrarSalvos)} className="font-semibold text-primary hover:underline">
                {mostrarSalvos ? "Ocultar já salvos" : "Mostrar"}
              </Link>
            </p>
          )}

          {visiveis.length === 0 ? (
            <div className="card mt-6 flex flex-col items-center gap-3 p-12 text-center text-muted">
              <SearchX size={32} className="text-primary" />
              {ocultos > 0 ? "Todos os candidatos desta página já estão salvos." : "Nenhum candidato para esses filtros."}
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visiveis.map((p, i) => (
                <div key={p.login} className="entra" style={{ "--n": Math.min(i, 11) } as React.CSSProperties}>
                  <CardCandidato p={p} favorito={salvos.has(p.login)} aviso={salvos.get(p.login)} />
                </div>
              ))}
            </div>
          )}

          {r.paginas > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-4 text-sm" aria-label="Paginação">
              {pagina > 1 && (
                <Link href={qs(pagina - 1)} className="btn btn-outline">
                  <ArrowLeft size={16} /> Anterior
                </Link>
              )}
              <span className="text-muted">
                Página {pagina} de {r.paginas}
              </span>
              {pagina < r.paginas && (
                <Link href={qs(pagina + 1)} className="btn btn-outline">
                  Próxima <ArrowRight size={16} className="seta" />
                </Link>
              )}
            </nav>
          )}
        </section>
      )}
    </>
  );
}
