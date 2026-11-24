"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, FolderInput, MoreHorizontal, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { criarPasta, excluirPasta, moverFavorito, renomearPasta } from "@/app/actions/pastas";

// Cores do fundo de cada pasta, escolhidas pelo id para ficarem estáveis.
const CORES = [
  ["#0f766e", "#134e4a", "#2dd4bf"],
  ["#0e7490", "#164e63", "#67e8f9"],
  ["#4d7c0f", "#365314", "#bef264"],
  ["#b45309", "#78350f", "#fcd34d"],
  ["#6d28d9", "#3b0764", "#c4b5fd"],
];

/** Só o desenho da pasta: fundo colorido, "papéis" que sobem no hover e frente de vidro. */
export function PastaVisual({
  nome,
  total,
  papeis,
  cor = 0,
  aberta,
  children,
}: {
  nome: React.ReactNode;
  total: number;
  papeis: string[]; // até 3 logins mostrados como folhas
  cor?: number;
  aberta?: boolean;
  children?: React.ReactNode; // link e botões, por cima do desenho
}) {
  const [c1, c2, c3] = CORES[cor % CORES.length];
  return (
    <div
      className="pasta"
      data-aberta={aberta ? "" : undefined}
      style={{ "--pc1": c1, "--pc2": c2, "--pc3": c3 } as React.CSSProperties}
    >
      <div className="pasta-fundo" />
      {papeis.slice(0, 3).map((login, i) => (
        <div key={login} className="pasta-papel" style={{ "--i": i } as React.CSSProperties}>
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-700 text-[10px] text-white">
            {login[0].toUpperCase()}
          </span>
          <span className="truncate">@{login}</span>
        </div>
      ))}
      <div className="pasta-frente">
        <div className={`truncate font-semibold ${children ? "pr-12" : ""}`}>{nome}</div>
        <p className="font-mono text-xs text-muted">
          {total} {total === 1 ? "candidato" : "candidatos"}
        </p>
      </div>
      {children}
    </div>
  );
}

type P = { id: number; nome: string; total: number; papeis: string[] };

/** Pasta real: clicar abre; o menu "..." renomeia ou exclui. */
export function Pasta({ p, aberta }: { p: P; aberta: boolean }) {
  const [menu, setMenu] = useState(false);
  const [editando, setEditando] = useState(false);
  const [pendente, iniciar] = useTransition();
  const raiz = useRef<HTMLDivElement>(null);

  // Fecha o menu com Esc ou ao clicar fora.
  useEffect(() => {
    if (!menu) return;
    const fora = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !raiz.current?.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("keydown", fora);
    document.addEventListener("pointerdown", fora);
    return () => {
      document.removeEventListener("keydown", fora);
      document.removeEventListener("pointerdown", fora);
    };
  }, [menu]);

  const executar = (acao: () => Promise<string | undefined>, ok: string) =>
    iniciar(async () => {
      const erro = await acao();
      if (erro) toast.error(erro);
      else toast.success(ok);
    });

  return (
    <PastaVisual
      cor={p.id}
      total={p.total}
      papeis={p.papeis}
      aberta={aberta || menu}
      nome={
        editando ? (
          <form
            className="relative z-20 flex gap-1"
            onSubmit={(e) => {
              e.preventDefault();
              const nome = String(new FormData(e.currentTarget).get("nome"));
              setEditando(false);
              if (nome.trim() !== p.nome) executar(() => renomearPasta(p.id, nome), "Pasta renomeada.");
            }}
          >
            <input name="nome" defaultValue={p.nome} maxLength={40} autoFocus required aria-label="Nome da pasta" className="field min-w-0 !py-1" />
            <button aria-label="Salvar nome" className="btn btn-primary btn-icone">
              <Check size={16} />
            </button>
          </form>
        ) : (
          p.nome
        )
      }
    >
      {!editando && (
        <Link
          href={aberta ? "/favoritos" : `/favoritos?pasta=${p.id}`}
          scroll={false}
          className="absolute inset-0 z-10 rounded-3xl"
          aria-label={`Abrir pasta ${p.nome}`}
        />
      )}
      <div ref={raiz} className="absolute bottom-3 right-3 z-20">
        <button
          onClick={() => setMenu((m) => !m)}
          disabled={pendente}
          aria-label={`Opções da pasta ${p.nome}`}
          aria-expanded={menu}
          aria-busy={pendente}
          className="btn btn-outline btn-icone"
        >
          {menu ? <X size={16} /> : <MoreHorizontal size={16} />}
        </button>
        <AnimatePresence>
          {menu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 8 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="flutuante absolute bottom-full right-0 mb-2 w-48 origin-bottom-right overflow-hidden p-1 text-sm"
            >
              <button
                onClick={() => {
                  setMenu(false);
                  setEditando(true);
                }}
                className="flex min-h-10 w-full items-center gap-2 rounded-[var(--r-controle)] px-3 hover:bg-primary-soft"
              >
                <Pencil size={14} /> Renomear
              </button>
              <button
                onClick={() => {
                  setMenu(false);
                  executar(() => excluirPasta(p.id), "Pasta excluída. Os favoritos foram mantidos.");
                }}
                className="flex min-h-10 w-full items-center gap-2 rounded-[var(--r-controle)] px-3 text-danger hover:bg-danger-soft"
              >
                <Trash2 size={14} /> Excluir pasta
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PastaVisual>
  );
}

/** Bloco tracejado que vira um campo para criar a pasta. */
export function NovaPasta() {
  const [aberto, setAberto] = useState(false);
  const [pendente, iniciar] = useTransition();

  return (
    <div className="pasta flex items-center justify-center rounded-3xl border-2 border-dashed border-border transition-colors hover:border-primary">
      {aberto ? (
        <form
          className="w-full space-y-2 px-5"
          onSubmit={(e) => {
            e.preventDefault();
            const nome = String(new FormData(e.currentTarget).get("nome"));
            iniciar(async () => {
              const erro = await criarPasta(nome);
              if (erro) return void toast.error(erro);
              toast.success(`Pasta "${nome.trim()}" criada.`);
              setAberto(false);
            });
          }}
        >
          <input name="nome" maxLength={40} autoFocus required placeholder="Nome da pasta" aria-label="Nome da nova pasta" className="field" />
          <div className="flex gap-2">
            <button disabled={pendente} className="btn btn-primary flex-1">
              {pendente ? "Criando..." : "Criar"}
            </button>
            <button type="button" onClick={() => setAberto(false)} className="btn btn-outline">
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setAberto(true)}
          className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-3xl text-sm font-semibold text-muted hover:text-primary"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <Plus size={20} />
          </span>
          Nova pasta
        </button>
      )}
    </div>
  );
}

/** Seletor "Mover para pasta" de um favorito. */
export function MoverPasta({
  login,
  pastaId,
  pastas,
}: {
  login: string;
  pastaId: number | null;
  pastas: { id: number; nome: string }[];
}) {
  const [pendente, iniciar] = useTransition();
  return (
    <label className="flex min-w-0 flex-1 items-center gap-2 text-sm text-muted">
      <FolderInput size={16} className="shrink-0" />
      <span className="sr-only">Pasta de @{login}</span>
      <select
        name="pasta"
        value={pastaId ?? ""}
        disabled={pendente}
        onChange={(e) => {
          const id = e.target.value ? Number(e.target.value) : null;
          iniciar(async () => {
            const erro = await moverFavorito(login, id);
            if (erro) toast.error(erro);
            else if (id) toast.success(`@${login} movido para "${pastas.find((p) => p.id === id)?.nome}".`);
            else toast.success(`@${login} retirado da pasta.`);
          });
        }}
        className="field !py-1.5"
      >
        <option value="">Sem pasta</option>
        {pastas.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nome}
          </option>
        ))}
      </select>
    </label>
  );
}
