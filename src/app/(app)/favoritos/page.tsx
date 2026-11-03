import Link from "next/link";
import { Suspense } from "react";
import CardCandidato from "@/components/CardCandidato";
import { MAX_COMPARAR } from "@/lib/comparacao";
import { db } from "@/lib/db";
import { obterPerfil, type Perfil } from "@/lib/github";
import { empresaAtual } from "@/lib/session";

export const metadata = { title: "Favoritos — Oásis" };

export default function Favoritos() {
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
  const favs = await db.favorito.findMany({
    where: { empresaId: empresa.id },
    orderBy: { criadoEm: "desc" },
  });
  const perfis = (await Promise.all(favs.map((f) => obterPerfil(f.githubLogin)))).filter(
    (p): p is Perfil => p !== null,
  );

  return (
    <>
      <h1 className="text-2xl font-bold">Favoritos</h1>
      {perfis.length === 0 ? (
        <p className="mt-4 text-muted">
          Nenhum favorito ainda.{" "}
          <Link href="/busca" className="font-semibold text-primary hover:underline">
            Buscar candidatos
          </Link>
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm text-muted">
            Marque até {MAX_COMPARAR} candidatos para compará-los lado a lado.
          </p>
          {/* Formulário vazio: os checkboxes e o botão o referenciam por `form`, pois os cards já têm formulários. */}
          <form id="comparar" action="/comparar" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {perfis.map((p) => (
              <div key={p.login}>
                <CardCandidato p={p} favorito />
                <label className="mt-2 flex items-center gap-2 text-sm">
                  <input
                    form="comparar"
                    type="checkbox"
                    name="c"
                    value={p.login}
                    className="h-4 w-4 accent-[var(--primary)]"
                  />
                  Selecionar para comparar
                </label>
              </div>
            ))}
          </div>
          <button
            form="comparar"
            className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            Comparar selecionados
          </button>
        </>
      )}
    </>
  );
}
