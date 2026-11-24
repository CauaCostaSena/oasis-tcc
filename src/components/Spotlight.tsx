"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowDown, ArrowRight, ArrowUp, Bookmark, ChevronRight, Code2, CornerDownLeft, MapPin, Plus, Save, Search, SlidersHorizontal, Trash2, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { excluirFiltro, salvarFiltro } from "@/app/actions/filtros";
import {
  CAMPOS_TEXTO, FILTROS_VAZIOS, LINGUAGENS, ORDENS, REGIOES,
  filtrosParaParams, rotulos, temCriterio, type CampoTexto, type Filtros, type Ordem,
} from "@/lib/filtros";
import { Switch } from "./Controles";

export type FiltroSalvo = { id: number; nome: string; filtros: Filtros };

const LOGIN = /^[a-z\d][a-z\d-]{0,38}$/i;
const EXEMPLOS = ["Busque por nome, usuário ou linguagem", "Ex.: TypeScript", "Ex.: torvalds", "Ex.: Salvador"];
const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const alterna = <T,>(lista: T[], v: T, ligado: boolean) => (ligado ? [...lista, v] : lista.filter((x) => x !== v));

// Atalhos de perfil no pop-up: cada switch liga um valor fixo de um campo.
const ATALHOS: [string, keyof Filtros, number][] = [
  ["10+ repositórios", "minRepos", 10],
  ["30+ repositórios", "minRepos", 30],
  ["100+ seguidores", "minSeguidores", 100],
  ["1.000+ seguidores", "minSeguidores", 1000],
  ["Conta com 3+ anos", "minAnos", 3],
  ["Conta com 5+ anos", "minAnos", 5],
  ["Conta com até 2 anos", "maxAnos", 2],
];
const FAIXAS: [string, keyof Filtros][] = [
  ["Mín. repositórios", "minRepos"],
  ["Máx. repositórios", "maxRepos"],
  ["Mín. seguidores", "minSeguidores"],
  ["Máx. seguidores", "maxSeguidores"],
];

function Linha({ rotulo, ligado, aoMudar }: { rotulo: string; ligado: boolean; aoMudar: (v: boolean) => void }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-[var(--r-controle)] px-3 py-2 text-sm transition-colors hover:bg-primary-soft">
      {rotulo}
      <Switch checked={ligado} onChange={(e) => aoMudar(e.target.checked)} />
    </label>
  );
}

function Grupo({ titulo, nota, children }: { titulo: string; nota?: string; children: React.ReactNode }) {
  return (
    <section className="py-5 first:pt-0 last:pb-0">
      <h3 className="text-sm font-semibold">{titulo}</h3>
      {nota && <p className="mt-0.5 text-xs text-muted">{nota}</p>}
      <div className="-mx-3 mt-2 grid gap-x-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

/**
 * Barra de busca fixa. Digitar sugere linguagem, região, filtro salvo, busca por nome ou abrir um perfil;
 * o ícone de filtro abre o pop-up com os switches. A busca só roda ao confirmar, porque cada uma conta no plano.
 */
export default function Spotlight({
  inicial = FILTROS_VAZIOS,
  salvos,
  mostrarSalvos = false,
  autoFoco = false,
  aoBuscar,
}: {
  inicial?: Filtros;
  salvos: FiltroSalvo[];
  mostrarSalvos?: boolean;
  autoFoco?: boolean;
  aoBuscar?: () => void;
}) {
  const router = useRouter();
  const [f, setF] = useState<Filtros>(inicial);
  const [texto, setTexto] = useState(inicial.texto ?? "");
  const [verSalvos, setVerSalvos] = useState(mostrarSalvos);
  const [foco, setFoco] = useState(false);
  const [ativo, setAtivo] = useState(0);
  const [exemplo, setExemplo] = useState(0);
  const [pendente, iniciar] = useTransition();
  const popup = useRef<HTMLDialogElement>(null);
  const id = useId();
  const reduzido = useReducedMotion();

  useEffect(() => {
    const t = setInterval(() => setExemplo((e) => (e + 1) % EXEMPLOS.length), 3500);
    return () => clearInterval(t);
  }, []);

  const muda = (p: Partial<Filtros>) => setF((atual) => ({ ...atual, ...p }));
  const digitado = texto.trim();

  // Devolve false se faltou critério (a busca não saiu).
  function buscar(alvo: Filtros) {
    if (!temCriterio(alvo)) {
      toast.error("Digite um nome ou escolha pelo menos uma linguagem ou região.");
      return false;
    }
    const u = filtrosParaParams(alvo);
    u.set("buscar", "1");
    if (verSalvos) u.set("salvos", "1");
    aoBuscar?.();
    iniciar(() => router.push(`/busca?${u}`));
    return true;
  }
  const comTexto = (): Filtros => ({ ...f, texto: digitado || undefined });

  const t = semAcento(digitado);
  const sugestoes = !t
    ? []
    : [
        ...LINGUAGENS.filter((l) => l.toLowerCase().startsWith(t) && !f.linguagens.includes(l))
          .slice(0, 3)
          .map((l) => ({
            Icone: Code2,
            rotulo: l,
            descricao: "Buscar por linguagem",
            agir: () => buscar({ ...f, texto: undefined, linguagens: [...f.linguagens, l] }),
          })),
        ...Object.keys(REGIOES)
          .filter((r) => semAcento(r).startsWith(t) && !f.regioes.includes(r))
          .slice(0, 2)
          .map((r) => ({
            Icone: MapPin,
            rotulo: r,
            descricao: "Buscar por região",
            agir: () => buscar({ ...f, texto: undefined, regioes: [...f.regioes, r] }),
          })),
        ...salvos
          .filter((s) => semAcento(s.nome).includes(t))
          .slice(0, 2)
          .map((s) => ({
            Icone: Bookmark,
            rotulo: s.nome,
            descricao: `Filtro personalizado · ${rotulos(s.filtros).join(", ")}`,
            agir: () => buscar(s.filtros),
          })),
        { Icone: Search, rotulo: `Buscar “${digitado}”`, descricao: "Em nomes e usuários do GitHub", agir: () => buscar(comTexto()) },
        ...(LOGIN.test(digitado)
          ? [
              {
                Icone: UserRound,
                rotulo: `Abrir o perfil @${digitado}`,
                descricao: "Ir direto ao perfil, sem gastar uma busca",
                agir: () => {
                  aoBuscar?.();
                  router.push(`/candidato/${digitado}`);
                },
              },
            ]
          : []),
      ];

  // [etiqueta, o que limpar ao remover]
  const um = (p: Partial<Filtros>) => rotulos({ ...FILTROS_VAZIOS, ...p })[0];
  const chips: [string, Partial<Filtros>][] = [
    ...f.linguagens.map((l): [string, Partial<Filtros>] => [l, { linguagens: f.linguagens.filter((x) => x !== l) }]),
    ...f.regioes.map((r): [string, Partial<Filtros>] => [r, { regioes: f.regioes.filter((x) => x !== r) }]),
  ];
  if (f.minRepos || f.maxRepos) chips.push([um({ minRepos: f.minRepos, maxRepos: f.maxRepos }), { minRepos: undefined, maxRepos: undefined }]);
  if (f.minSeguidores || f.maxSeguidores) {
    chips.push([um({ minSeguidores: f.minSeguidores, maxSeguidores: f.maxSeguidores }), { minSeguidores: undefined, maxSeguidores: undefined }]);
  }
  if (f.minAnos || f.maxAnos) chips.push([um({ minAnos: f.minAnos, maxAnos: f.maxAnos }), { minAnos: undefined, maxAnos: undefined }]);
  if (f.patrocinavel) chips.push(["GitHub Sponsors", { patrocinavel: undefined }]);
  if (f.ordem) chips.push([ORDENS[f.ordem][0], { ordem: undefined }]);

  const opcao = Math.min(ativo, Math.max(sugestoes.length - 1, 0));

  function teclas(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const n = sugestoes.length || 1;
      setAtivo((a) => (a + (e.key === "ArrowDown" ? 1 : n - 1)) % n);
    }
  }

  return (
    <>
      <div className="card spot overflow-hidden">
        <form
          role="search"
          className="flex h-14 items-center gap-3 pl-4 pr-2.5 sm:h-16 sm:pl-5 sm:pr-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (sugestoes.length) sugestoes[Math.min(ativo, sugestoes.length - 1)].agir();
            else buscar(comTexto());
          }}
        >
          <Search className="shrink-0 text-primary" />
          <div className="relative min-w-0 flex-1 text-lg sm:text-xl">
            {!texto && (
              <span aria-hidden className="pointer-events-none absolute inset-0 flex items-center overflow-hidden whitespace-nowrap text-muted">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={exemplo}
                    initial={{ opacity: 0, y: 10, filter: "blur(5px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -10, filter: "blur(5px)" }}
                    transition={{ duration: reduzido ? 0 : 0.25 }}
                  >
                    {EXEMPLOS[exemplo]}
                  </motion.span>
                </AnimatePresence>
              </span>
            )}
            <input
              value={texto}
              onChange={(e) => {
                setTexto(e.target.value);
                setAtivo(0);
              }}
              onFocus={() => setFoco(true)}
              onBlur={() => setFoco(false)}
              onKeyDown={teclas}
              autoFocus={autoFoco}
              maxLength={60}
              role="combobox"
              aria-expanded={foco && Boolean(digitado)}
              aria-controls={`${id}-lista`}
              aria-activedescendant={foco && digitado ? `${id}-op-${opcao}` : undefined}
              aria-autocomplete="list"
              aria-label="Buscar candidatos por nome, usuário, linguagem ou região"
              className="relative w-full bg-transparent !outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => popup.current?.showModal()}
            aria-label="Abrir filtros"
            className="btn btn-ghost btn-icone relative"
          >
            <SlidersHorizontal size={20} />
            {chips.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-on-primary">
                {chips.length}
              </span>
            )}
          </button>
          <button disabled={pendente} aria-label="Buscar" aria-busy={pendente} className="btn btn-primary">
            <span className="hidden sm:inline">{pendente ? "Buscando..." : "Buscar"}</span>
            <ArrowRight size={16} className="seta" />
          </button>
        </form>

        {chips.length > 0 && (
          <ul className="flex flex-wrap items-center gap-2 px-4 pb-3 sm:px-5" aria-label="Filtros ativos">
            {chips.map(([nome, limpar]) => (
              <li key={nome} className="chip">
                {nome}
                <button
                  type="button"
                  onClick={() => muda(limpar)}
                  aria-label={`Remover filtro ${nome}`}
                  className="-mr-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-primary/20"
                >
                  <X size={12} />
                </button>
              </li>
            ))}
            {chips.length > 1 && (
              <li>
                <button type="button" onClick={() => setF(FILTROS_VAZIOS)} className="cursor-pointer px-2 py-1 text-xs font-medium text-muted transition-colors hover:text-foreground">
                  Limpar filtros
                </button>
              </li>
            )}
          </ul>
        )}

        <AnimatePresence initial={false}>
          {foco && (
            <motion.div
              initial={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
              animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
              exit={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
              transition={{ duration: reduzido ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
              onMouseDown={(e) => e.preventDefault()} // não tira o foco do campo antes do clique
              className="border-t border-border bg-surface-2/60"
            >
              {digitado ? (
                <>
                  <ul id={`${id}-lista`} role="listbox" aria-label="Sugestões">
                    {sugestoes.map((s, i) => (
                      <li key={s.rotulo} role="presentation">
                        <button
                          type="button"
                          role="option"
                          id={`${id}-op-${i}`}
                          aria-selected={i === opcao}
                          onClick={s.agir}
                          onMouseEnter={() => setAtivo(i)}
                          className="sugestao flex min-h-12 w-full cursor-pointer items-center gap-3 px-4 py-2 text-left transition-colors sm:px-5"
                        >
                          <s.Icone size={18} className="shrink-0 text-primary" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{s.rotulo}</span>
                            <span className="block truncate text-xs text-muted">{s.descricao}</span>
                          </span>
                          <ChevronRight size={16} className={`shrink-0 text-muted transition-opacity ${i === opcao ? "opacity-100" : "opacity-0"}`} />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <p className="hidden items-center gap-4 border-t border-border px-5 py-2 text-xs text-muted sm:flex">
                    <span className="flex items-center gap-1.5">
                      <kbd className="tecla"><ArrowUp size={10} /><ArrowDown size={10} /></kbd> navegar
                    </span>
                    <span className="flex items-center gap-1.5">
                      <kbd className="tecla"><CornerDownLeft size={10} /></kbd> escolher
                    </span>
                  </p>
                </>
              ) : (
                <div className="space-y-4 px-4 py-4 sm:px-5">
                  {salvos.length > 0 && (
                    <div>
                      <p className="rotulo">Seus filtros</p>
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {salvos.map((s) => (
                          <li key={s.id}>
                            <button type="button" onClick={() => buscar(s.filtros)} title={rotulos(s.filtros).join(" · ")} className="chip-opcao gap-1.5">
                              <Bookmark size={12} /> {s.nome}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div>
                    <p className="rotulo">Comece por uma linguagem</p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {LINGUAGENS.slice(0, 8).map((l) => {
                        const ligada = f.linguagens.includes(l);
                        return (
                          <li key={l}>
                            <button type="button" aria-pressed={ligada} onClick={() => muda({ linguagens: alterna(f.linguagens, l, !ligada) })} className="chip-opcao">
                              {l}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  <p className="text-xs text-muted">Ou digite um nome, usuário ou região. A busca só roda ao confirmar.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <dialog ref={popup} className="popup" aria-label="Filtros da busca">
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <h2 className="text-lg font-bold">Filtros</h2>
            {chips.length > 0 && <span className="chip">{chips.length} {chips.length === 1 ? "ativo" : "ativos"}</span>}
          </div>
          <button type="button" onClick={() => popup.current?.close()} aria-label="Fechar filtros" className="btn btn-ghost btn-icone">
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 divide-y divide-border overflow-y-auto px-5 py-5 sm:px-6">
          <section className="pb-5">
            <h3 className="text-sm font-semibold">Filtros personalizados</h3>
            {salvos.length === 0 ? (
              <p className="mt-1 text-xs text-muted">Marque os switches abaixo e salve a seleção para reutilizar com um clique.</p>
            ) : (
              <ul className="mt-2 flex flex-wrap gap-2">
                {salvos.map((s) => (
                  <li key={s.id} className="flex min-h-9 items-center rounded-full border border-border bg-surface-2 text-sm">
                    <button type="button" onClick={() => buscar(s.filtros) && popup.current?.close()} title={rotulos(s.filtros).join(" · ")} className="flex items-center gap-2 rounded-l-full py-1.5 pl-3 pr-2 font-medium hover:text-primary">
                      <Bookmark size={14} /> {s.nome}
                    </button>
                    <button
                      type="button"
                      aria-label={`Excluir filtro ${s.nome}`}
                      onClick={() => iniciar(async () => void (await excluirFiltro(s.id), toast.success(`Filtro “${s.nome}” excluído.`)))}
                      className="rounded-r-full py-1.5 pl-1 pr-3 text-muted hover:text-danger"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const nome = String(new FormData(form).get("nome"));
                if (!temCriterio(comTexto())) return void toast.error("Marque pelo menos uma linguagem ou região antes de salvar.");
                iniciar(async () => {
                  const erro = await salvarFiltro(nome, comTexto());
                  if (erro) return void toast.error(erro);
                  toast.success(`Filtro “${nome.trim()}” salvo.`);
                  form.reset();
                });
              }}
            >
              <input name="nome" required maxLength={40} placeholder="Nome para a seleção atual" aria-label="Nome do filtro personalizado" className="field" />
              <button disabled={pendente} className="btn btn-outline">
                <Save size={14} /> Salvar
              </button>
            </form>
          </section>

          <Grupo titulo="Linguagem" nota="Várias marcadas: basta o candidato ter uma delas.">
            {LINGUAGENS.map((l) => (
              <Linha key={l} rotulo={l} ligado={f.linguagens.includes(l)} aoMudar={(v) => muda({ linguagens: alterna(f.linguagens, l, v) })} />
            ))}
          </Grupo>

          <Grupo titulo="Região" nota="Vem do campo de localização que a pessoa escreveu no GitHub.">
            {[...new Set([...Object.keys(REGIOES), ...f.regioes])].map((r) => (
              <Linha key={r} rotulo={r} ligado={f.regioes.includes(r)} aoMudar={(v) => muda({ regioes: alterna(f.regioes, r, v) })} />
            ))}
            <form
              className="flex gap-2 px-3 py-2 sm:col-span-2"
              onSubmit={(e) => {
                e.preventDefault();
                const outra = String(new FormData(e.currentTarget).get("outra")).trim();
                if (outra && !f.regioes.includes(outra)) muda({ regioes: [...f.regioes, outra] });
                e.currentTarget.reset();
              }}
            >
              <input name="outra" maxLength={40} placeholder="Outra cidade ou país" aria-label="Outra região" className="field" />
              <button className="btn btn-outline">
                <Plus size={14} /> Adicionar
              </button>
            </form>
          </Grupo>

          <Grupo titulo="Perfil">
            {ATALHOS.map(([nome, campo, valor]) => (
              <Linha key={nome} rotulo={nome} ligado={f[campo] === valor} aoMudar={(v) => muda({ [campo]: v ? valor : undefined })} />
            ))}
            <Linha rotulo="Tem GitHub Sponsors" ligado={Boolean(f.patrocinavel)} aoMudar={(v) => muda({ patrocinavel: v || undefined })} />
            <details className="group px-3 py-2 text-sm sm:col-span-2">
              <summary className="flex cursor-pointer list-none items-center gap-1 text-muted transition-colors hover:text-foreground">
                <ChevronRight size={14} className="transition-transform group-open:rotate-90" /> Faixa exata
              </summary>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {FAIXAS.map(([nome, campo]) => (
                  <label key={campo} className="text-xs text-muted">
                    {nome}
                    <input
                      type="number"
                      min={0}
                      value={(f[campo] as number | undefined) ?? ""}
                      onChange={(e) => muda({ [campo]: Number(e.target.value) > 0 ? Number(e.target.value) : undefined })}
                      className="field mt-1"
                    />
                  </label>
                ))}
              </div>
            </details>
          </Grupo>

          <Grupo titulo="Procurar o texto digitado em" nota="Sem nenhum marcado: usuário e nome.">
            {(Object.keys(CAMPOS_TEXTO) as CampoTexto[]).map((c) => (
              <Linha key={c} rotulo={CAMPOS_TEXTO[c]} ligado={f.em.includes(c)} aoMudar={(v) => muda({ em: alterna(f.em, c, v) })} />
            ))}
          </Grupo>

          <Grupo titulo="Ordenar por" nota="Sem nenhum marcado: melhor correspondência.">
            {(Object.keys(ORDENS) as Ordem[]).map((o) => (
              <Linha key={o} rotulo={ORDENS[o][0]} ligado={f.ordem === o} aoMudar={(v) => muda({ ordem: v ? o : undefined })} />
            ))}
          </Grupo>

          <Grupo titulo="Exibição">
            <Linha rotulo="Mostrar candidatos já salvos" ligado={verSalvos} aoMudar={setVerSalvos} />
          </Grupo>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-border bg-surface px-5 py-4 sm:px-6">
          <button type="button" disabled={chips.length === 0} onClick={() => setF(FILTROS_VAZIOS)} className="btn btn-ghost">
            Limpar tudo
          </button>
          <button type="button" disabled={pendente} aria-busy={pendente} onClick={() => buscar(comTexto()) && popup.current?.close()} className="btn btn-primary">
            {pendente ? "Buscando..." : "Aplicar e buscar"} <ArrowRight size={16} className="seta" />
          </button>
        </footer>
      </dialog>
    </>
  );
}

export const abrirBusca = () => window.dispatchEvent(new Event("oasis:buscar"));

/** A mesma busca por cima de qualquer página: Ctrl+K (ou o botão da barra lateral) abre, Esc fecha. */
export function BuscaGlobal({ salvos }: { salvos: FiltroSalvo[] }) {
  const [aberta, setAberta] = useState(false);
  const reduzido = useReducedMotion();

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAberta((a) => !a);
      } else if (e.key === "Escape" && !document.querySelector("dialog[open]")) setAberta(false);
    };
    const abrir = () => setAberta(true);
    window.addEventListener("keydown", tecla);
    window.addEventListener("oasis:buscar", abrir);
    return () => {
      window.removeEventListener("keydown", tecla);
      window.removeEventListener("oasis:buscar", abrir);
    };
  }, []);

  // Portal: a barra lateral tem backdrop-filter, que prenderia um elemento "fixed" dentro dela.
  // Só existe no navegador (abre por tecla ou clique), então document está sempre disponível aqui.
  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {aberta && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          // Fechar é mais rápido que abrir: quem aperta Esc quer a página de volta na hora.
          exit={{ opacity: 0, transition: { duration: reduzido ? 0.1 : 0.16 } }}
          onClick={() => setAberta(false)}
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 pt-[10vh] backdrop-blur-sm sm:pt-[14vh]"
        >
          <motion.div
            role="dialog"
            aria-label="Buscar candidatos"
            initial={reduzido ? { opacity: 0 } : { opacity: 0, scaleX: 1.15, scaleY: 1.05, y: -10, filter: "blur(14px)" }}
            animate={{ opacity: 1, scaleX: 1, scaleY: 1, y: 0, filter: "blur(0px)" }}
            exit={
              reduzido
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.98, y: 6, filter: "blur(6px)", transition: { duration: 0.16, ease: [0.4, 0, 1, 1] } }
            }
            transition={reduzido ? { duration: 0.1 } : { type: "spring", stiffness: 550, damping: 50 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl rounded-[var(--r-card)] [box-shadow:var(--sombra)]"
          >
            <Spotlight salvos={salvos} autoFoco aoBuscar={() => setAberta(false)} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
