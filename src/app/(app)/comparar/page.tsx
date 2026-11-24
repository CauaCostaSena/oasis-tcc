import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, ChevronDown, History, Plus, X } from "lucide-react";
import Carregando from "@/components/Carregando";
import ComparacaoView from "@/components/ComparacaoView";
import { SalvarComparacao } from "@/components/Comparacoes";
import { NeonCheckbox } from "@/components/Controles";
import { loginsDaUrl, montarComparacao } from "@/lib/comparacao";
import { db } from "@/lib/db";
import { chaveLogins, METRICAS, metricasValidas, TODAS_METRICAS } from "@/lib/metricas";
import { empresaAtual } from "@/lib/session";

export const metadata = { title: "Nova comparação — Oásis" };

export default function Comparar({ searchParams }: PageProps<"/comparar">) {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <Suspense fallback={<Carregando />}>
        <Conteudo searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Conteudo({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const empresa = await empresaAtual();
  const limite = empresa.plano.limiteComparar;

  // O campo "novo" acrescenta um candidato à lista atual.
  const atuais = Array.isArray(sp.c) ? sp.c : sp.c ? [sp.c] : [];
  const novo = typeof sp.novo === "string" ? sp.novo.trim().replace(/^@/, "") : "";
  const pedidos = [...new Set([...atuais, ...(novo ? [novo] : [])])];
  const logins = loginsDaUrl(pedidos, limite);
  const metricas = metricasValidas(sp.m);

  let itens: Awaited<ReturnType<typeof montarComparacao>> = [];
  let erro: string | undefined;
  try {
    itens = await montarComparacao(logins);
  } catch {
    erro = "Não foi possível consultar o GitHub agora. Tente novamente em alguns instantes.";
  }
  if (!erro && pedidos.length > limite) {
    erro = `O plano ${empresa.plano.nome} compara até ${limite} candidatos de uma vez; os demais ficaram de fora.`;
  }

  // Evita refazer o que a equipe já salvou com os mesmos candidatos.
  const repetidas =
    itens.length >= 2
      ? await db.comparacao.findMany({
          where: { empresaId: empresa.id, logins: chaveLogins(itens.map((i) => i.perfil.login)) },
          include: { recrutador: true },
          orderBy: { criadoEm: "desc" },
          take: 3,
        })
      : [];

  const url = (ls: string[]) => {
    const u = new URLSearchParams();
    ls.forEach((l) => u.append("c", l));
    metricas.forEach((m) => u.append("m", m));
    return `/comparar?${u}`;
  };

  return (
    <>
      <Link href="/comparacoes" className="btn btn-ghost !px-3">
        <ArrowLeft size={16} /> Comparações salvas
      </Link>
      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Nova comparação</h1>
      <p className="subtitulo mt-2">
        Plano {empresa.plano.nome} · até {limite} candidatos
      </p>

      <section className="card mt-6 p-5">
        <h2 className="text-base font-semibold">Candidatos</h2>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {itens.map((i) => (
            <span key={i.perfil.login} className="flex min-h-10 items-center gap-2 rounded-full border border-border bg-surface-2 py-1 pl-1 pr-1 text-sm">
              <Image src={i.perfil.avatar} alt="" width={28} height={28} className="rounded-full" />@{i.perfil.login}
              <Link
                href={url(itens.map((x) => x.perfil.login).filter((l) => l !== i.perfil.login))}
                aria-label={`Tirar @${i.perfil.login} da comparação`}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-danger-soft hover:text-danger"
              >
                <X size={16} />
              </Link>
            </span>
          ))}
          {itens.length < limite && (
            <form className="flex flex-wrap items-center gap-2">
              {itens.map((i) => (
                <input key={i.perfil.login} type="hidden" name="c" value={i.perfil.login} />
              ))}
              {metricas.map((m) => (
                <input key={m} type="hidden" name="m" value={m} />
              ))}
              <input name="novo" required placeholder="Usuário do GitHub" aria-label="Adicionar usuário do GitHub" className="field !w-52" />
              <button className="btn btn-outline">
                <Plus size={16} /> Adicionar
              </button>
            </form>
          )}
        </div>
        <p className="mt-3 text-xs text-muted">
          Você também pode marcar candidatos em{" "}
          <Link href="/favoritos" className="font-semibold text-primary hover:underline">
            Favoritos
          </Link>{" "}
          e clicar em “Comparar selecionados”.
        </p>

        <form className="mt-5 border-t border-border pt-5">
          {itens.map((i) => (
            <input key={i.perfil.login} type="hidden" name="c" value={i.perfil.login} />
          ))}
          <details open={itens.length < 2} className="group">
            <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 rounded-[var(--r-controle)]">
              <span>
                <span className="block text-base font-semibold">Métricas que a empresa quer comparar</span>
                <span className="block text-xs text-muted">
                  {metricas.length} de {TODAS_METRICAS.length} selecionadas
                </span>
              </span>
              <ChevronDown size={18} className="shrink-0 text-muted transition-transform duration-200 group-open:rotate-180" />
            </summary>
            {/* key: os checkboxes voltam ao que está na URL depois de aplicar */}
            <div key={metricas.join()} className="mt-3 grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
              {TODAS_METRICAS.map((m) => (
                <label key={m} className="flex min-h-10 cursor-pointer items-center gap-3 text-sm">
                  <NeonCheckbox name="m" value={m} defaultChecked={metricas.includes(m)} />
                  {METRICAS[m].rotulo}
                </label>
              ))}
            </div>
            <button className="btn btn-outline mt-3">Aplicar métricas</button>
          </details>
        </form>
      </section>

      {erro && (
        <p role="alert" className="alerta mt-4">
          {erro}
        </p>
      )}

      {repetidas.length > 0 && (
        <div className="selo-salvo mt-4 !block !rounded-[var(--r-card)] !p-4 !text-sm">
          <p className="flex items-center gap-2 font-semibold">
            <History size={16} /> A equipe já salvou uma comparação com estes candidatos:
          </p>
          <ul className="mt-2 space-y-1 font-normal">
            {repetidas.map((r) => (
              <li key={r.id}>
                <Link href={`/comparacoes/${r.id}`} className="underline">
                  {r.titulo}
                </Link>{" "}
                · {r.recrutador?.nome ?? "Perfil removido"} · {r.criadoEm.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
              </li>
            ))}
          </ul>
        </div>
      )}

      {itens.length === 0 ? (
        <p className="card mt-6 p-10 text-center text-muted">Adicione pelo menos 2 candidatos para ver os gráficos.</p>
      ) : (
        <div className="mt-6 space-y-6">
          <ComparacaoView itens={itens} metricas={metricas} />
          {itens.length >= 2 && <SalvarComparacao logins={itens.map((i) => i.perfil.login)} metricas={metricas} />}
        </div>
      )}
    </>
  );
}
