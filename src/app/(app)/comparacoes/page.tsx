import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, CalendarClock, MessageSquare, Plus, UserRound } from "lucide-react";
import Carregando from "@/components/Carregando";
import { db } from "@/lib/db";
import type { ItemComparacao } from "@/lib/metricas";
import { empresaAtual } from "@/lib/session";

export const metadata = { title: "Comparações — Oásis" };

export default function Comparacoes() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <Suspense fallback={<Carregando />}>
        <Conteudo />
      </Suspense>
    </main>
  );
}

async function Conteudo() {
  const empresa = await empresaAtual();
  const lista = await db.comparacao.findMany({
    where: { empresaId: empresa.id },
    orderBy: { criadoEm: "desc" },
    take: 60,
    include: { recrutador: true, _count: { select: { comentarios: true } } },
  });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">Comparações</h1>
          <p className="subtitulo mt-2">Visíveis a toda a empresa</p>
        </div>
        <Link href="/comparar" className="btn btn-primary">
          <Plus size={16} /> Nova comparação
        </Link>
      </div>

      {lista.length === 0 ? (
        <div className="card mt-8 flex flex-col items-center gap-3 p-10 text-center">
          <p className="max-w-md text-muted">
            Nenhuma comparação salva ainda. Monte uma em “Nova comparação” e salve para a equipe não precisar refazer.
          </p>
          <Link href="/comparar" className="btn btn-outline">
            <Plus size={16} /> Nova comparação
          </Link>
        </div>
      ) : (
        <ul className="card an-linhas-comp mt-8 overflow-hidden">
          {lista.map((c) => {
            const itens = c.dados as unknown as ItemComparacao[];
            const n = c._count.comentarios;
            return (
              <li key={c.id}>
                <Link href={`/comparacoes/${c.id}`} className="an-linha group">
                  <div className="flex -space-x-3">
                    {itens.map((item) => (
                      <Image
                        key={item.perfil.login}
                        src={item.perfil.avatar}
                        alt={`@${item.perfil.login}`}
                        width={44}
                        height={44}
                        className="rounded-full border-2 border-surface"
                      />
                    ))}
                  </div>
                  <div className="min-w-0">
                    <h2 className="line-clamp-2 font-sans text-base font-semibold tracking-normal">{c.titulo}</h2>
                    <p className="truncate text-xs text-muted">{itens.map((item) => `@${item.perfil.login}`).join(" × ")}</p>
                  </div>
                  <dl className="col-span-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted sm:col-span-1 sm:justify-end">
                    <div className="flex items-center gap-1.5">
                      <UserRound size={14} className="text-primary" />
                      <dt className="sr-only">Feita por</dt>
                      <dd>{c.recrutador?.nome ?? "Perfil removido"}</dd>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CalendarClock size={14} className="text-primary" />
                      <dt className="sr-only">Data</dt>
                      <dd>{c.criadoEm.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</dd>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MessageSquare size={14} className="text-primary" />
                      <dt className="sr-only">Comentários</dt>
                      <dd>
                        {n} {n === 1 ? "comentário" : "comentários"}
                      </dd>
                    </div>
                    <div className="hidden sm:block" aria-hidden>
                      <ArrowRight size={16} className="text-primary transition-transform group-hover:translate-x-1" />
                    </div>
                  </dl>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
