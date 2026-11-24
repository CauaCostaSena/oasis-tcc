import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, CalendarClock, RefreshCw, UserRound } from "lucide-react";
import Carregando from "@/components/Carregando";
import ComparacaoView from "@/components/ComparacaoView";
import { ComentarComparacao, ExcluirComentario, ExcluirComparacao } from "@/components/Comparacoes";
import { db } from "@/lib/db";
import { metricasValidas, type ItemComparacao } from "@/lib/metricas";
import { empresaAtual } from "@/lib/session";

export const metadata = { title: "Comparação — Oásis" };

export default function Comparacao({ params }: PageProps<"/comparacoes/[id]">) {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <Suspense fallback={<Carregando />}>
        <Conteudo params={params} />
      </Suspense>
    </main>
  );
}

const quando = (d: Date) => d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

async function Conteudo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const empresa = await empresaAtual();
  // O empresaId no filtro impede abrir comparação de outra empresa.
  const c = /^\d+$/.test(id)
    ? await db.comparacao.findFirst({
        where: { id: Number(id), empresaId: empresa.id },
        include: { recrutador: true, comentarios: { orderBy: { criadoEm: "asc" }, include: { recrutador: true } } },
      })
    : null;
  if (!c) notFound();

  const itens = c.dados as unknown as ItemComparacao[];
  const metricas = metricasValidas(c.metricas);
  const refazer = new URLSearchParams();
  itens.forEach((i) => refazer.append("c", i.perfil.login));
  metricas.forEach((m) => refazer.append("m", m));

  return (
    <>
      <Link href="/comparacoes" className="btn btn-ghost !px-3">
        <ArrowLeft size={16} /> Comparações
      </Link>

      <header className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold sm:text-4xl">{c.titulo}</h1>
          <p className="mt-3 flex flex-wrap gap-2">
            <span className="chip">
              <UserRound size={12} /> {c.recrutador?.nome ?? "Perfil removido"}
            </span>
            <span className="chip">
              <CalendarClock size={12} /> {quando(c.criadoEm)}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/comparar?${refazer}`} className="btn btn-outline">
            <RefreshCw size={16} /> Refazer com dados de hoje
          </Link>
          {c.recrutadorId === empresa.recrutador.id && <ExcluirComparacao id={c.id} />}
        </div>
      </header>
      <p className="subtitulo mt-3 max-w-3xl !text-sm">
        Os números são os do dia em que a comparação foi salva. Todos os recrutadores da empresa podem ver e comentar; só
        quem fez pode excluir.
      </p>

      <div className="mt-6">
        <ComparacaoView itens={itens} metricas={metricas} />
      </div>

      <section className="mt-12 max-w-3xl">
        <h2 className="text-xl font-bold">Comentários</h2>
        {c.comentarios.length === 0 ? (
          <p className="subtitulo mt-2">Ninguém comentou ainda. Registre abaixo o que a equipe concluiu desta comparação.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {c.comentarios.map((k) => (
              <li key={k.id} className="card p-4">
                <div className="flex items-start justify-between gap-2 text-xs text-muted">
                  <span>
                    <strong className="text-foreground">{k.recrutador?.nome ?? "Perfil removido"}</strong> · {quando(k.criadoEm)}
                  </span>
                  {k.recrutadorId === empresa.recrutador.id && <ExcluirComentario id={k.id} />}
                </div>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm">{k.texto}</p>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4">
          <ComentarComparacao id={c.id} />
        </div>
      </section>
    </>
  );
}
