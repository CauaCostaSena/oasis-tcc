import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Clock, RotateCw } from "lucide-react";
import Carregando from "@/components/Carregando";
import { db } from "@/lib/db";
import { filtrosParaParams, normalizar, rotulos } from "@/lib/filtros";
import { empresaAtual } from "@/lib/session";

export const metadata = { title: "Histórico de buscas — Oásis" };

export default function Historico() {
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
  const buscas = await db.busca.findMany({
    where: { empresaId: empresa.id },
    orderBy: { criadoEm: "desc" },
    take: 50,
  });

  // Agrupa por dia, mantendo a ordem (mais recentes primeiro).
  const agora = new Date();
  const hoje = agora.toDateString();
  const ontem = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - 1).toDateString();
  const dias: [string, typeof buscas][] = [];
  for (const b of buscas) {
    const d = b.criadoEm.toDateString();
    const rotulo =
      d === hoje ? "Hoje" : d === ontem ? "Ontem" : b.criadoEm.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
    const grupo = dias.at(-1);
    if (grupo?.[0] === rotulo) grupo[1].push(b);
    else dias.push([rotulo, [b]]);
  }

  return (
    <>
      <h1 className="text-3xl font-bold sm:text-4xl">Histórico de buscas</h1>
      <p className="subtitulo mt-2">Suas últimas 50 buscas. Repita qualquer uma com os mesmos filtros.</p>
      {buscas.length === 0 ? (
        <div className="card mt-6 flex flex-col items-center gap-3 p-10 text-center">
          <Clock size={28} className="text-primary" />
          <p className="text-muted">Nenhuma busca ainda. As buscas que você fizer aparecem aqui.</p>
          <Link href="/painel" className="btn btn-primary">
            Buscar candidatos <ArrowRight size={16} className="seta" />
          </Link>
        </div>
      ) : (
        <div className="entra">
          {dias.map(([dia, lista]) => (
            <section key={dia} className="mt-8">
              <h2 className="mb-2 text-sm font-semibold text-muted">{dia}</h2>
              <ul className="card divide-y divide-border overflow-hidden">
                {lista.map((b) => {
                  // Buscas antigas guardavam só linguagem/localização nas colunas; as novas guardam tudo em `filtros`.
                  const bruto = (b.filtros ?? {}) as Record<string, unknown>;
                  const f = normalizar({
                    ...bruto,
                    linguagens: bruto.linguagens ?? (b.linguagem ? [b.linguagem] : []),
                    regioes: bruto.regioes ?? (b.localizacao ? [b.localizacao] : []),
                  });
                  const u = filtrosParaParams(f);
                  u.set("buscar", "1");
                  const partes = rotulos(f);

                  return (
                    <li key={b.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap gap-2">
                          {partes.map((t) => (
                            <span key={String(t)} className="chip">
                              {t}
                            </span>
                          ))}
                        </p>
                        <p className="num mt-1.5 text-xs text-muted">
                          {b.criadoEm.toLocaleTimeString("pt-BR", { timeStyle: "short" })} · {b.total.toLocaleString("pt-BR")} perfis encontrados
                        </p>
                      </div>
                      <Link href={`/busca?${u}`} aria-label="Repetir busca" title="Repetir busca" className="btn btn-outline shrink-0">
                        <RotateCw size={14} /> <span className="hidden sm:inline">Repetir busca</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
