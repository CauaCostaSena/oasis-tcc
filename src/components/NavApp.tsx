"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bell, BellOff, Clock, FolderHeart, GitCompareArrows, House, Search, Sparkles } from "lucide-react";
import { marcarNotificacoesVistas } from "@/app/actions/filtros";
import { abrirBusca } from "./Spotlight";

// [destino, nome, ícone, outros caminhos que também acendem o item]
const links = [
  ["/painel", "Início", House, ["/busca", "/candidato"]],
  ["/favoritos", "Favoritos", FolderHeart, []],
  ["/comparacoes", "Comparações", GitCompareArrows, ["/comparar"]],
  ["/semelhantes", "Semelhantes", Sparkles, []],
  ["/historico", "Histórico", Clock, []],
] as const;

/** Barra inferior no celular, barra lateral no desktop; o destaque desliza até a página atual. */
export default function NavApp() {
  const caminho = usePathname();
  return (
    <ul className="grid grid-cols-5 gap-0.5 px-1 py-1.5 text-[11px] font-medium tracking-tight md:flex md:tracking-normal md:flex-col md:gap-1 md:p-0 md:text-sm">
      {links.map(([href, nome, Icone, extras]) => {
        const ativo = [href, ...extras].some((c) => caminho.startsWith(c));
        return (
          <li key={href} className="relative min-w-0">
            {ativo && (
              <motion.span
                layoutId="nav-ativo"
                className="absolute inset-0 rounded-xl bg-primary-soft"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <Link
              href={href}
              aria-current={ativo ? "page" : undefined}
              className={`relative flex min-h-[3.25rem] flex-col items-center justify-center gap-1 rounded-xl px-0 transition-colors md:min-h-0 md:flex-row md:justify-start md:gap-3 md:px-3 md:py-2.5 ${
                ativo ? "text-primary" : "text-muted hover:text-foreground"
              }`}
            >
              <Icone size={18} className="shrink-0" />
              <span className="max-w-full truncate">{nome}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function BotaoBuscar() {
  return (
    <button
      onClick={abrirBusca}
      className="flex min-h-10 w-full cursor-pointer items-center gap-3 rounded-[var(--r-controle)] border border-border bg-surface-2 px-3 text-sm text-muted transition-colors hover:border-primary hover:text-foreground"
    >
      <Search size={16} />
      <span className="flex-1 text-left">Buscar</span>
      <kbd className="tecla hidden md:inline-flex">Ctrl K</kbd>
    </button>
  );
}

type Aviso = { id: number; texto: string; link: string | null; quando: string; nova: boolean };

/** Sino da barra lateral. Abrir a lista marca tudo como lido para este recrutador. */
export function Sino({ avisos }: { avisos: Aviso[] }) {
  const [aberto, setAberto] = useState(false);
  const [, iniciar] = useTransition();
  const raiz = useRef<HTMLDivElement>(null);
  const novas = avisos.filter((a) => a.nova).length;

  // Clicar fora ou apertar Esc fecha o pop-over.
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAberto(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("pointerdown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  return (
    <div className="relative" ref={raiz}>
      <button
        onClick={() => {
          setAberto((a) => !a);
          if (!aberto && novas) iniciar(() => marcarNotificacoesVistas());
        }}
        aria-label={novas ? `Notificações: ${novas} novas` : "Notificações"}
        aria-expanded={aberto}
        aria-haspopup="true"
        className="btn btn-ghost btn-icone relative"
      >
        <Bell size={18} />
        {novas > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#fe5f2f] px-1 text-[10px] font-bold text-white">
            {novas}
          </span>
        )}
      </button>
      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="flutuante absolute right-0 top-full z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] origin-top-right overflow-hidden md:bottom-0 md:left-full md:right-auto md:top-auto md:ml-3 md:mt-0 md:origin-bottom-left"
          >
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
              <p className="text-sm font-semibold">Notificações</p>
              {novas > 0 && <span className="chip">{novas} {novas === 1 ? "nova" : "novas"}</span>}
            </div>
            {avisos.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
                <BellOff size={22} className="text-muted" />
                <p className="text-sm text-muted">Nada por aqui. Você é avisado quando outro recrutador guarda um candidato numa pasta.</p>
              </div>
            ) : (
              <ul className="max-h-80 divide-y divide-border overflow-y-auto">
                {avisos.map((a) => (
                  <li key={a.id}>
                    <Link href={a.link ?? "/favoritos"} onClick={() => setAberto(false)} className="flex gap-3 px-4 py-3 text-sm transition-colors hover:bg-primary-soft">
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${a.nova ? "bg-[#fe5f2f]" : "bg-transparent"}`} />
                      <span className="min-w-0">
                        <span className="line-clamp-3 block">{a.texto}</span>
                        <span className="mt-0.5 block text-xs text-muted">{a.quando}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
