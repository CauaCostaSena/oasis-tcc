import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Clock, FolderHeart, GitCompareArrows, Sparkles } from "lucide-react";
import Carregando from "@/components/Carregando";
import Spotlight from "@/components/Spotlight";
import { db } from "@/lib/db";
import { filtrosSalvos } from "@/lib/preferencias";
import { empresaAtual } from "@/lib/session";

export const metadata = { title: "Início — Oásis" };

export default function Painel() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <Suspense fallback={<Carregando cards={3} />}>
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
  const [buscasMes, buscasTotal, favoritos, avaliacoes, salvos] = await Promise.all([
    db.busca.count({
      where: { empresaId: empresa.id, criadoEm: { gte: new Date(agora.getFullYear(), agora.getMonth(), 1) } },
    }),
    db.busca.count({ where: { empresaId: empresa.id } }),
    db.favorito.count({ where: { empresaId: empresa.id } }),
    db.avaliacao.count({
      where: { empresaId: empresa.id, OR: [{ privada: false }, { recrutadorId: empresa.recrutador.id }] },
    }),
    filtrosSalvos(empresa.recrutador.id),
  ]);

  // [título, valor, limite (-1 = ilimitado)]
  const medidores = [
    ["Buscas neste mês", buscasMes, empresa.plano.limiteBuscasMes],
    ["Favoritos", favoritos, empresa.plano.limiteFavoritos],
  ] as const;

  const atalhos = [
    ["/favoritos", "Abrir pastas", "Organize os favoritos da empresa.", FolderHeart],
    ["/comparacoes", "Comparações", "Veja as comparações salvas pela equipe.", GitCompareArrows],
    ["/semelhantes", "Perfis semelhantes", "Ache candidatos parecidos com um salvo.", Sparkles],
    ["/historico", "Histórico", "Repita uma busca anterior.", Clock],
  ] as const;

  return (
    <>
      <h1 className="max-w-3xl text-3xl font-bold sm:text-4xl">Olá, {empresa.recrutador.nome}. Quem você procura hoje?</h1>

      {/* O momento de movimento desta página: a busca entra. */}
      <div className="entra mt-6">
        <Spotlight salvos={salvos} />
        <p className="mt-3 px-1 text-xs text-muted">
          Digite um nome, usuário, linguagem ou região. O ícone de filtro abre as opções; <kbd className="tecla hidden md:inline-flex">Ctrl K</kbd><span className="md:hidden">o botão Buscar no topo</span> abre
          esta busca em qualquer página.
        </p>
      </div>

      <section aria-label="Uso do plano" className="card mt-8 flex flex-wrap items-center gap-x-8 gap-y-4 px-4 py-4 sm:px-5">
        <span className="chip">Plano {empresa.plano.nome}</span>
        {medidores.map(([titulo, valor, lim]) => (
          <div key={titulo} className="w-full sm:w-auto sm:min-w-40 sm:flex-1">
            <p className="flex items-baseline justify-between gap-2 text-sm">
              <span className="text-muted">{titulo}</span>
              <span className="num font-semibold">
                {valor} <span className="font-normal text-muted">/ {limite(lim)}</span>
              </span>
            </p>
            {lim > 0 && (
              <div
                className="barra mt-2"
                role="progressbar"
                aria-label={titulo}
                aria-valuemin={0}
                aria-valuemax={lim}
                aria-valuenow={Math.min(valor, lim)}
              >
                <span style={{ width: `${Math.min(100, (valor / lim) * 100)}%` }} />
              </div>
            )}
          </div>
        ))}
        <p className="num text-sm text-muted">
          <span className="font-semibold text-foreground">{avaliacoes}</span> {avaliacoes === 1 ? "comentário" : "comentários"}
          <span className="mx-2" aria-hidden>·</span>
          <span className="font-semibold text-foreground">{buscasTotal}</span> {buscasTotal === 1 ? "busca" : "buscas"} desde o cadastro
        </p>
      </section>

      <h2 className="mb-3 mt-12 text-base font-semibold">Atalhos</h2>
      <ul className="card divide-y divide-border overflow-hidden">
        {atalhos.map(([href, titulo, texto, Icone]) => (
          <li key={href}>
            <Link href={href} className="group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-primary-soft sm:px-5">
              <Icone size={18} className="shrink-0 text-primary" />
              <span className="min-w-0 flex-1 sm:flex sm:items-baseline sm:gap-3">
                <span className="block font-medium">{titulo}</span>
                <span className="block truncate text-sm text-muted">{texto}</span>
              </span>
              <ArrowRight size={16} className="shrink-0 text-muted transition-transform group-hover:translate-x-1 group-hover:text-primary" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
