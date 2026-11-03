import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { empresaAtual } from "@/lib/session";

export const metadata = { title: "Painel — Oásis" };

export default function Painel() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <Suspense fallback={<p className="text-muted">Carregando...</p>}>
        <Conteudo />
      </Suspense>
    </main>
  );
}

const limite = (n: number) => (n < 0 ? "ilimitado" : String(n));

// A sessão é lida em tempo de requisição, por isso fica dentro do Suspense.
async function Conteudo() {
  const empresa = await empresaAtual();
  const agora = new Date();
  const [buscasMes, buscasTotal, favoritos, avaliacoes] = await Promise.all([
    db.busca.count({
      where: { empresaId: empresa.id, criadoEm: { gte: new Date(agora.getFullYear(), agora.getMonth(), 1) } },
    }),
    db.busca.count({ where: { empresaId: empresa.id } }),
    db.favorito.count({ where: { empresaId: empresa.id } }),
    db.avaliacao.count({ where: { empresaId: empresa.id } }),
  ]);

  const cartoes: [string, string, string][] = [
    ["Buscas neste mês", `${buscasMes} / ${limite(empresa.plano.limiteBuscasMes)}`, "Limite do seu plano"],
    ["Favoritos", `${favoritos} / ${limite(empresa.plano.limiteFavoritos)}`, "Limite do seu plano"],
    ["Avaliações registradas", String(avaliacoes), "Observações privadas"],
    ["Buscas realizadas", String(buscasTotal), "Desde o cadastro"],
  ];

  return (
    <>
      <h1 className="text-2xl font-bold">Olá, {empresa.nome}</h1>
      <p className="mt-1 text-muted">
        Plano <strong className="text-foreground">{empresa.plano.nome}</strong>
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cartoes.map(([titulo, valor, nota]) => (
          <div key={titulo} className="rounded-xl border border-border bg-surface p-5">
            <p className="text-sm text-muted">{titulo}</p>
            <p className="mt-1 text-2xl font-bold text-primary">{valor}</p>
            <p className="mt-1 text-xs text-muted">{nota}</p>
          </div>
        ))}
      </div>

      <Link
        href="/busca"
        className="mt-8 inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
      >
        Buscar candidatos
      </Link>
    </>
  );
}
