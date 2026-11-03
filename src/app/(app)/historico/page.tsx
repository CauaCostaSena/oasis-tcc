import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { empresaAtual } from "@/lib/session";

export const metadata = { title: "Histórico de buscas — Oásis" };

export default function Historico() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <Suspense fallback={<p className="text-muted">Carregando...</p>}>
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

  return (
    <>
      <h1 className="text-2xl font-bold">Histórico de buscas</h1>
      {buscas.length === 0 ? (
        <p className="mt-4 text-muted">
          Nenhuma busca ainda.{" "}
          <Link href="/busca" className="font-semibold text-primary hover:underline">
            Buscar candidatos
          </Link>
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {buscas.map((b) => {
            const f = (b.filtros ?? {}) as { minRepos?: number | null; minSeguidores?: number | null };
            const u = new URLSearchParams({ buscar: "1" });
            if (b.linguagem) u.set("linguagem", b.linguagem);
            if (b.localizacao) u.set("localizacao", b.localizacao);
            if (f.minRepos) u.set("minRepos", String(f.minRepos));
            if (f.minSeguidores) u.set("minSeguidores", String(f.minSeguidores));
            const partes = [
              b.linguagem && `Linguagem: ${b.linguagem}`,
              b.localizacao && `Local: ${b.localizacao}`,
              f.minRepos && `Mín. ${f.minRepos} repositórios`,
              f.minSeguidores && `Mín. ${f.minSeguidores} seguidores`,
            ].filter(Boolean);

            return (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4">
                <div>
                  <p className="font-medium">{partes.join(" · ")}</p>
                  <p className="text-xs text-muted">
                    {b.criadoEm.toLocaleString("pt-BR")} · {b.total.toLocaleString("pt-BR")} perfis encontrados
                  </p>
                </div>
                <Link
                  href={`/busca?${u}`}
                  className="rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary-soft"
                >
                  Repetir busca
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
