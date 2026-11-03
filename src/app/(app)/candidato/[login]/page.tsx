import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { excluirAvaliacao } from "@/app/actions/candidatos";
import BotaoFavorito from "@/components/BotaoFavorito";
import FormAvaliacao from "@/components/FormAvaliacao";
import { db } from "@/lib/db";
import { LOGIN_VALIDO, obterPerfil, obterRepos, type Repo } from "@/lib/github";
import { empresaAtual } from "@/lib/session";

export const metadata = { title: "Perfil do candidato — Oásis" };

const MAX_REPOS = 30;

export default function Candidato({ params }: PageProps<"/candidato/[login]">) {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <Suspense fallback={<p className="text-muted">Carregando...</p>}>
        <Conteudo params={params} />
      </Suspense>
    </main>
  );
}

// Linguagens dos repositórios próprios (forks não entram), da mais frequente para a menos.
function linguagens(repos: Repo[]) {
  const n = new Map<string, number>();
  for (const r of repos) if (r.linguagem && !r.fork) n.set(r.linguagem, (n.get(r.linguagem) ?? 0) + 1);
  return [...n].sort((a, b) => b[1] - a[1]).slice(0, 8);
}

const data = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "—");

async function Conteudo({ params }: { params: Promise<{ login: string }> }) {
  const { login } = await params;
  const empresa = await empresaAtual();
  if (!LOGIN_VALIDO.test(login)) notFound();

  let perfil, repos: Repo[];
  try {
    perfil = await obterPerfil(login);
    if (!perfil) notFound();
    repos = await obterRepos(login);
  } catch (e) {
    if ((e as { digest?: string }).digest?.startsWith("NEXT_")) throw e; // notFound/redirect do Next
    return (
      <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        Não foi possível consultar o GitHub agora. Tente novamente em alguns instantes.
      </p>
    );
  }

  const langs = linguagens(repos);
  const favorito = Boolean(
    await db.favorito.findUnique({
      where: { empresaId_githubLogin: { empresaId: empresa.id, githubLogin: perfil.login } },
    }),
  );
  const avaliacoes = await db.avaliacao.findMany({
    where: { empresaId: empresa.id, githubLogin: perfil.login },
    orderBy: { criadoEm: "desc" },
  });

  return (
    <>
      <Link href="/busca" className="text-sm font-semibold text-primary hover:underline">
        ← Voltar à busca
      </Link>

      <header className="mt-6 flex flex-col gap-5 rounded-xl border border-border bg-surface p-6 sm:flex-row">
        <Image src={perfil.avatar} alt="" width={96} height={96} className="h-24 w-24 rounded-full" priority />
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">{perfil.nome ?? perfil.login}</h1>
          <p className="text-muted">@{perfil.login}</p>
          <p className="mt-3">{perfil.bio ?? <span className="text-muted">Sem biografia informada.</span>}</p>
          <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
            <div>📍 {perfil.localizacao ?? "Localização não informada"}</div>
            <div>{perfil.repos} repositórios públicos</div>
            <div>{perfil.seguidores} seguidores</div>
          </dl>
          <div className="mt-4 flex flex-wrap items-start gap-2">
            <BotaoFavorito login={perfil.login} favorito={favorito} />
            <Link
              href={`/comparar?c=${perfil.login}`}
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-primary-soft"
            >
              Comparar
            </Link>
            <a
              href={perfil.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary-soft"
            >
              Abrir no GitHub ↗
            </a>
          </div>
        </div>
      </header>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Avaliações privadas</h2>
        <p className="mt-1 text-xs text-muted">Registradas pela sua empresa. Não fazem parte do perfil do GitHub.</p>
        <div className="mt-4 rounded-xl border border-border bg-surface p-5">
          <FormAvaliacao login={perfil.login} />
        </div>
        {avaliacoes.length > 0 && (
          <ul className="mt-4 space-y-3">
            {avaliacoes.map((a) => (
              <li key={a.id} className="rounded-xl border border-border bg-surface p-4">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>
                    {a.criadoEm.toLocaleDateString("pt-BR")}
                    {a.nota && ` · Nota ${a.nota}/5`}
                  </span>
                  <form action={excluirAvaliacao.bind(null, a.id)}>
                    <button className="font-semibold hover:text-red-700">Excluir</button>
                  </form>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm">{a.texto}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Linguagens nos repositórios públicos</h2>
        {langs.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Nenhuma linguagem identificada nos repositórios próprios.</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {langs.map(([nome, qtd]) => (
              <li key={nome} className="rounded-full bg-primary-soft px-3 py-1 text-sm font-medium text-primary">
                {nome} · {qtd}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-muted">
          Mostra onde a pessoa publicou código, não o nível de domínio. Forks não são contados.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Repositórios recentes</h2>
        {repos.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Nenhum repositório público.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {repos.slice(0, MAX_REPOS).map((r) => (
              <li key={r.url} className="rounded-xl border border-border bg-surface p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-primary hover:underline"
                  >
                    {r.nome}
                  </a>
                  {r.fork && <span className="rounded bg-border px-2 py-0.5 text-xs text-muted">fork</span>}
                </div>
                {r.descricao && <p className="mt-1 text-sm text-muted">{r.descricao}</p>}
                <p className="mt-2 flex flex-wrap gap-x-4 text-xs text-muted">
                  <span>{r.linguagem ?? "Linguagem não identificada"}</span>
                  <span>★ {r.estrelas}</span>
                  <span>⑂ {r.forks}</span>
                  <span>Atualizado em {data(r.atualizado)}</span>
                </p>
              </li>
            ))}
          </ul>
        )}
        {repos.length > MAX_REPOS && (
          <p className="mt-3 text-sm text-muted">
            Mostrando {MAX_REPOS} de {repos.length} repositórios. Veja o restante no GitHub.
          </p>
        )}
      </section>
    </>
  );
}
