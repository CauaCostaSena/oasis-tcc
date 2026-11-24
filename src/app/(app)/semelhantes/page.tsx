import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Check, SearchX, Sparkles } from "lucide-react";
import CardCandidato from "@/components/CardCandidato";
import Carregando from "@/components/Carregando";
import { analisar, similaridade } from "@/lib/analise";
import { executarBusca } from "@/lib/busca";
import { analisarCandidato } from "@/lib/comparacao";
import { db } from "@/lib/db";
import { LINGUAGENS, normalizar, rotulos } from "@/lib/filtros";
import { LOGIN_VALIDO, obterPerfil, obterRepos, type Perfil } from "@/lib/github";
import { empresaAtual } from "@/lib/session";

export const metadata = { title: "Perfis semelhantes — Oásis" };

export default function Semelhantes({ searchParams }: PageProps<"/semelhantes">) {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <Suspense fallback={<Carregando cards={6} />}>
        <Conteudo searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

/** Busca no GitHub quem tem as linguagens e o porte do modelo e dá nota de similaridade a cada um. */
async function sugerir(empresa: Awaited<ReturnType<typeof empresaAtual>>, login: string, salvos: Set<string>) {
  const modelo = await analisarCandidato(login);
  if (!modelo) return { erro: "Perfil modelo não encontrado no GitHub." };

  // Uma linguagem só quando ela domina (60% ou mais dos repositórios); senão as duas principais.
  const conhecidas = modelo.analise.linguagens.filter(([l]) => LINGUAGENS.includes(l));
  const total = modelo.analise.linguagens.reduce((s, [, q]) => s + q, 0);
  const linguagens = conhecidas.slice(0, conhecidas[0]?.[1] / total >= 0.6 ? 1 : 2).map(([l]) => l);
  if (!linguagens.length) {
    return { modelo, erro: "O perfil modelo não tem repositórios próprios nas linguagens que o Oásis sabe buscar." };
  }
  // Porte: seguidores entre a metade e o dobro do modelo (o GitHub devolve primeiro os de mais seguidores);
  // repositórios entre um quarto e o quádruplo.
  const { seguidores, repos } = modelo.perfil;
  const filtros = normalizar({
    linguagens,
    minSeguidores: Math.floor(seguidores / 2),
    maxSeguidores: seguidores * 2 + 10,
    minRepos: Math.max(1, Math.floor(repos / 4)),
    maxRepos: repos * 4 + 5,
  });

  const { erro, resultado } = await executarBusca(empresa, filtros, 1);
  if (!resultado) return { modelo, filtros, erro };

  const candidatos = resultado.perfis.filter((p) => p.login !== modelo.perfil.login && !salvos.has(p.login));
  const lista = await Promise.all(
    candidatos.map(async (p) => ({
      p,
      similar: similaridade(modelo, { perfil: p, analise: analisar(p, await obterRepos(p.login)) }),
    })),
  );
  return { modelo, filtros, lista: lista.sort((a, b) => b.similar.pct - a.similar.pct) };
}

async function Conteudo({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const empresa = await empresaAtual();
  const favs = await db.favorito.findMany({ where: { empresaId: empresa.id }, orderBy: { criadoEm: "desc" } });
  const salvos = (await Promise.all(favs.map((f) => obterPerfil(f.githubLogin)))).filter((p): p is Perfil => p !== null);

  const login = typeof sp.modelo === "string" && LOGIN_VALIDO.test(sp.modelo) ? sp.modelo : undefined;
  let r: Awaited<ReturnType<typeof sugerir>> | undefined;
  if (login && sp.buscar) {
    try {
      r = await sugerir(empresa, login, new Set(favs.map((f) => f.githubLogin)));
    } catch (e) {
      const status = (e as { status?: number }).status;
      r = {
        erro:
          status === 403 || status === 429
            ? "O GitHub limitou as consultas por agora. Tente novamente em alguns instantes."
            : "Não foi possível consultar o GitHub. Tente novamente.",
      };
    }
  }

  return (
    <>
      <h1 className="text-3xl font-bold sm:text-4xl">Perfis semelhantes</h1>
      <p className="subtitulo mt-2">Indicações a partir de quem você já salvou</p>

      {salvos.length === 0 && !login ? (
        <div className="card mt-6 flex flex-col items-center gap-3 p-10 text-center">
          <p className="text-muted">Salve um candidato nos favoritos para usá-lo como modelo.</p>
          <Link href="/painel" className="btn btn-outline">
            Buscar candidatos
          </Link>
        </div>
      ) : (
        <form className="card mt-6 p-5">
          <h2 className="text-base font-semibold">Escolha o perfil modelo</h2>
          <p className="subtitulo mt-1 !text-sm">O Oásis procura perfis com linguagens e porte parecidos com o do modelo.</p>
          <div key={login} className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {/* Um modelo vindo do perfil do candidato pode não estar nos favoritos: entra na lista só com o login. */}
            {[
              ...(login && !salvos.some((p) => p.login === login) ? [{ login, nome: null, avatar: null }] : []),
              ...salvos,
            ].map((p) => (
              <label
                key={p.login}
                className="an-modelo group flex min-h-14 cursor-pointer items-center gap-3 rounded-[var(--r-controle)] border border-border p-3 text-sm hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-primary-soft"
              >
                <input type="radio" name="modelo" value={p.login} defaultChecked={p.login === login} required className="sr-only" />
                {p.avatar ? (
                  <Image src={p.avatar} alt="" width={40} height={40} className="rounded-full" />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-bold text-on-primary">
                    {p.login[0].toUpperCase()}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{p.nome ?? p.login}</span>
                  <span className="block truncate text-xs text-muted">@{p.login}</span>
                </span>
                <Check size={16} className="shrink-0 text-primary opacity-0 transition-opacity group-has-[:checked]:opacity-100" aria-hidden />
              </label>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button name="buscar" value="1" className="btn btn-primary">
              <Sparkles size={16} /> Buscar semelhantes
            </button>
            <p className="text-xs text-muted">Conta como 1 busca do plano e entra no histórico.</p>
          </div>
        </form>
      )}

      {r?.erro && (
        <p role="alert" className="alerta mt-6">
          {r.erro}
        </p>
      )}

      {r && "lista" in r && r.lista && (
        <section className="mt-12">
          <h2 className="text-xl font-bold">
            Parecidos com {r.modelo.perfil.nome ?? r.modelo.perfil.login}
          </h2>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
            Busca usada:
            {rotulos(r.filtros).map((t) => (
              <span key={t} className="chip">
                {t}
              </span>
            ))}
          </p>
          <details className="mt-2 text-sm text-muted">
            <summary className="flex min-h-10 cursor-pointer items-center hover:text-foreground">Como a porcentagem é calculada</summary>
            <p className="max-w-2xl pb-2">
              Linguagens valem 50% (proporção de repositórios por linguagem), tipo de projeto 30% (áreas e tópicos em
              comum) e porte 20% (repositórios, seguidores e tempo de conta em faixas parecidas). Quando um critério não
              tem dados, os outros são reescalados. É uma estimativa sobre dados públicos, não uma medida de competência.
            </p>
          </details>

          {r.lista.length === 0 ? (
            <div className="card mt-6 flex flex-col items-center gap-3 p-12 text-center text-muted">
              <SearchX size={32} className="text-primary" />
              Nenhum perfil novo para este modelo (os já salvos não voltam como indicação).
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {r.lista.map(({ p, similar }, i) => (
                <div key={p.login} className="entra" style={{ "--n": Math.min(i, 8) } as React.CSSProperties}>
                  <CardCandidato p={p} favorito={false} similar={similar} />
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );
}
