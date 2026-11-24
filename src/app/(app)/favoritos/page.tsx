import Link from "next/link";
import { Suspense } from "react";
import { GitCompareArrows } from "lucide-react";
import CardCandidato from "@/components/CardCandidato";
import Carregando from "@/components/Carregando";
import { NeonCheckbox } from "@/components/Controles";
import { MoverPasta, NovaPasta, Pasta, PastaVisual } from "@/components/Pastas";
import { db } from "@/lib/db";
import { obterPerfil, type Perfil } from "@/lib/github";
import { empresaAtual } from "@/lib/session";

export const metadata = { title: "Favoritos — Oásis" };

export default function Favoritos({ searchParams }: PageProps<"/favoritos">) {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <Suspense fallback={<Carregando cards={4} />}>
        <Conteudo searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Conteudo({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const empresa = await empresaAtual();
  const [favs, pastas] = await Promise.all([
    db.favorito.findMany({ where: { empresaId: empresa.id }, orderBy: { criadoEm: "desc" } }),
    db.pasta.findMany({ where: { empresaId: empresa.id }, orderBy: { criadoEm: "asc" } }),
  ]);

  // ?pasta=<id> abre uma pasta; id desconhecido (ex.: pasta excluída) volta para "Todos".
  const aberta = pastas.find((p) => String(p.id) === sp.pasta);
  const visiveis = aberta ? favs.filter((f) => f.pastaId === aberta.id) : favs;
  const perfis = (await Promise.all(visiveis.map((f) => obterPerfil(f.githubLogin)))).filter(
    (p): p is Perfil => p !== null,
  );
  const pastaDe = new Map(favs.map((f) => [f.githubLogin, f.pastaId]));
  const opcoes = pastas.map(({ id, nome }) => ({ id, nome }));

  return (
    <>
      <h1 className="text-3xl font-bold sm:text-4xl">Favoritos</h1>
      <p className="subtitulo mt-2">Visível só para a sua empresa</p>

      <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
        <div className="entra">
          <PastaVisual nome="Todos os favoritos" total={favs.length} cor={0} aberta={!aberta} papeis={favs.map((f) => f.githubLogin)}>
            <Link href="/favoritos" scroll={false} className="absolute inset-0 z-10 rounded-3xl" aria-label="Ver todos os favoritos" />
          </PastaVisual>
        </div>
        {pastas.map((p, i) => {
          const dentro = favs.filter((f) => f.pastaId === p.id);
          return (
            <div key={p.id} className="entra" style={{ "--n": i + 1 } as React.CSSProperties}>
              <Pasta
                aberta={aberta?.id === p.id}
                p={{ id: p.id, nome: p.nome, total: dentro.length, papeis: dentro.map((f) => f.githubLogin) }}
              />
            </div>
          );
        })}
        <div className="entra" style={{ "--n": pastas.length + 1 } as React.CSSProperties}>
          <NovaPasta />
        </div>
      </div>

      <h2 className="mt-14 text-xl font-bold">{aberta ? aberta.nome : "Todos os favoritos"}</h2>
      {perfis.length === 0 ? (
        <div className="card mt-4 flex flex-col items-center gap-3 p-10 text-center">
          <p className="text-muted">
            {aberta ? "Esta pasta está vazia. Mova um favorito para cá pelo seletor de pasta embaixo do card." : "Nenhum favorito ainda. Salve candidatos na busca para organizá-los aqui."}
          </p>
          <Link href={aberta ? "/favoritos" : "/painel"} className="btn btn-outline">
            {aberta ? "Ver todos os favoritos" : "Buscar candidatos"}
          </Link>
        </div>
      ) : (
        <>
          <p className="subtitulo mt-1">
            Marque até {empresa.plano.limiteComparar} candidatos (limite do plano {empresa.plano.nome}) para compará-los lado a lado.
          </p>
          {/* Formulário vazio: os checkboxes e o botão o referenciam por `form`, pois os cards já têm formulários. */}
          <form id="comparar" action="/comparar" />
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {perfis.map((p) => (
              <div key={p.login} className="flex flex-col">
                <div className="flex-1">
                  <CardCandidato p={p} favorito />
                </div>
                <div className="an-fav-rodape">
                  <MoverPasta login={p.login} pastaId={pastaDe.get(p.login) ?? null} pastas={opcoes} />
                  <label className="flex min-h-10 shrink-0 cursor-pointer items-center gap-2 text-sm">
                    <NeonCheckbox form="comparar" name="c" value={p.login} />
                    Comparar
                  </label>
                </div>
              </div>
            ))}
          </div>
          <div className="flutuante an-acao mt-6">
            <p className="text-sm text-muted">Selecione os candidatos acima e abra a comparação.</p>
            <button form="comparar" className="btn btn-primary">
              <GitCompareArrows size={16} /> Comparar selecionados
            </button>
          </div>
        </>
      )}
    </>
  );
}
