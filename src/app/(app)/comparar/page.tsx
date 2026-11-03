import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { loginsDaUrl, MAX_COMPARAR, montarComparacao } from "@/lib/comparacao";
import { empresaAtual } from "@/lib/session";

export const metadata = { title: "Comparar candidatos — Oásis" };

export default function Comparar({ searchParams }: PageProps<"/comparar">) {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <Suspense fallback={<p className="text-muted">Carregando...</p>}>
        <Conteudo searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

const data = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "Não informado");

async function Conteudo({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  await empresaAtual();

  // O campo "novo" acrescenta um candidato à lista atual.
  const novo = typeof sp.novo === "string" ? sp.novo : undefined;
  const logins = loginsDaUrl([...loginsDaUrl(sp.c), ...(novo ? [novo] : [])]);
  let itens: Awaited<ReturnType<typeof montarComparacao>> = [];
  let erro: string | undefined;
  try {
    itens = await montarComparacao(logins);
  } catch {
    erro = "Não foi possível consultar o GitHub agora. Tente novamente em alguns instantes.";
  }

  const linhas: [string, (i: (typeof itens)[number]) => React.ReactNode][] = [
    ["Localização", (i) => i.perfil.localizacao ?? "Não informada"],
    ["Repositórios públicos", (i) => i.perfil.repos],
    ["Seguidores", (i) => i.perfil.seguidores],
    ["Linguagens mais usadas", (i) => (i.linguagens.length ? i.linguagens.join(", ") : "Nenhuma identificada")],
    ["Estrelas (repositórios recentes próprios)", (i) => i.estrelas],
    ["Última atividade em repositório", (i) => data(i.ultimaAtividade)],
    ["Biografia", (i) => i.perfil.bio ?? "Sem biografia informada."],
  ];

  return (
    <>
      <h1 className="text-2xl font-bold">Comparar candidatos</h1>

      {logins.length < MAX_COMPARAR && (
        <form className="mt-4 flex flex-wrap items-end gap-2">
          {logins.map((l) => (
            <input key={l} type="hidden" name="c" value={l} />
          ))}
          <label className="text-sm font-medium">
            Adicionar usuário do GitHub
            <input
              name="novo"
              placeholder="Ex.: torvalds"
              className="mt-1 block w-64 rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
            />
          </label>
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover">
            Adicionar
          </button>
        </form>
      )}

      {erro && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {erro}
        </p>
      )}

      {itens.length === 0 && !erro ? (
        <p className="mt-6 text-muted">
          Escolha até {MAX_COMPARAR} candidatos em{" "}
          <Link href="/favoritos" className="font-semibold text-primary hover:underline">
            Favoritos
          </Link>{" "}
          ou adicione usuários acima.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="w-48 p-4" />
                {itens.map((i) => (
                  <th key={i.perfil.login} className="p-4 align-top">
                    <Image src={i.perfil.avatar} alt="" width={48} height={48} className="rounded-full" />
                    <Link href={`/candidato/${i.perfil.login}`} className="mt-2 block font-semibold text-primary hover:underline">
                      {i.perfil.nome ?? i.perfil.login}
                    </Link>
                    <span className="font-normal text-muted">@{i.perfil.login}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhas.map(([rotulo, valor]) => (
                <tr key={rotulo} className="border-b border-border last:border-0">
                  <th scope="row" className="p-4 align-top font-medium text-muted">
                    {rotulo}
                  </th>
                  {itens.map((i) => (
                    <td key={i.perfil.login} className="p-4 align-top">
                      {valor(i)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-muted">
        A comparação apoia a análise e não indica o melhor candidato. Os números vêm de dados públicos do GitHub e não
        medem competência.
      </p>
    </>
  );
}
