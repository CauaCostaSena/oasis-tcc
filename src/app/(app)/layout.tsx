import Link from "next/link";
import { Suspense } from "react";
import { LogOut, Users } from "lucide-react";
import { sair } from "@/app/actions/auth";
import { trocarPerfil } from "@/app/actions/recrutadores";
import BotaoTema from "@/components/BotaoTema";
import Logo from "@/components/Logo";
import NavApp, { BotaoBuscar, Sino } from "@/components/NavApp";
import { BuscaGlobal } from "@/components/Spotlight";
import { db } from "@/lib/db";
import { filtrosSalvos } from "@/lib/preferencias";
import { empresaAtual } from "@/lib/session";

// A casca (barra lateral e links) é estática; só <Recrutador> lê a sessão, dentro do Suspense.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <aside className="casca-barra relative z-30 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border px-4 py-3 md:fixed md:inset-y-0 md:left-0 md:w-60 md:flex-col md:flex-nowrap md:items-stretch md:gap-4 md:border-b-0 md:border-r md:px-4 md:py-5">
        <Link href="/painel" aria-label="Oásis — início" className="md:px-2">
          <Logo />
        </Link>
        <div className="order-last w-full md:order-none">
          <BotaoBuscar />
        </div>
        {/* usePathname suspende em rotas dinâmicas (/candidato/[login]); o Suspense mantém o resto estático. */}
        {/* Celular: barra fixa embaixo com os 5 itens. Desktop: coluna da barra lateral. */}
        <nav
          aria-label="Seções"
          className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:static md:order-none md:w-full md:flex-1 md:border-0 md:bg-transparent md:pb-0 md:backdrop-blur-none"
        >
          <Suspense>
            <NavApp />
          </Suspense>
        </nav>
        <div className="ml-auto flex items-center gap-1 md:ml-0 md:flex-col md:items-stretch md:gap-2">
          <Suspense>
            <Recrutador />
          </Suspense>
          <div className="flex items-center gap-1">
            <BotaoTema />
            <form action={trocarPerfil}>
              <button aria-label="Trocar perfil" title="Trocar perfil" className="btn btn-ghost btn-icone">
                <Users size={18} />
              </button>
            </form>
            <form action={sair}>
              <button aria-label="Sair" title="Sair" className="btn btn-ghost btn-icone">
                <LogOut size={18} />
              </button>
            </form>
          </div>
        </div>
      </aside>
      <div className="pb-20 md:pb-0 md:pl-60">{children}</div>
    </>
  );
}

/** Quem está usando, o sino e a busca do Ctrl+K: tudo o que depende do perfil escolhido. */
async function Recrutador() {
  const empresa = await empresaAtual();
  const eu = empresa.recrutador;
  const [avisos, salvos] = await Promise.all([
    db.notificacao.findMany({
      where: { empresaId: empresa.id, OR: [{ autorId: { not: eu.id } }, { autorId: null }] },
      orderBy: { criadoEm: "desc" },
      take: 15,
    }),
    filtrosSalvos(eu.id),
  ]);

  return (
    <>
      <div className="flex items-center gap-2 md:rounded-xl md:border md:border-border md:p-2">
        <span className="display hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary font-bold text-on-primary md:flex">
          {eu.nome[0].toUpperCase()}
        </span>
        <span className="hidden min-w-0 flex-1 md:block">
          <span className="block truncate text-sm font-semibold">{eu.nome}</span>
          <span className="block truncate text-xs text-muted">{empresa.nome}</span>
        </span>
        <Sino
          avisos={avisos.map((a) => ({
            id: a.id,
            texto: a.texto,
            link: a.link,
            quando: a.criadoEm.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }),
            nova: a.criadoEm > eu.notificacoesVistasEm,
          }))}
        />
      </div>
      <BuscaGlobal salvos={salvos} />
    </>
  );
}
